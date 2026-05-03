/**
 * server.ts — Entry point del backend Express
 *
 * Responsabilidades:
 *  - Cargar y validar variables de entorno ANTES de importar cualquier otra cosa
 *  - Configurar middlewares globales (CORS, JSON, rate limiting, logs)
 *  - Montar las rutas de la API
 *  - Arrancar el servidor HTTP
 *
 * Por qué este orden importa:
 *  env.ts se importa primero y lanza un error si falta alguna variable crítica,
 *  así el proceso muere en startup y no en tiempo de request.
 */

import './config/env';                    // Validación de env — siempre primero
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';

import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import modulosRoutes from './routes/modulos.routes';   
import examenesRoutes from './routes/examenes.routes';
import qrRoutes from './routes/qr.routes';
import adminRoutes from './routes/admin.routes';
import atencionesRoutes from './routes/atenciones.routes';
import productosRoutes from './routes/productos.routes';
import comunicadosRoutes from './routes/comunicados.routes';
import rankingRoutes from './routes/ranking.routes';
import objetivosRoutes from './routes/objetivos.routes';
import mecanicoRoutes from './routes/mecanico.routes';
import pushRoutes from './routes/push.routes';
import {
  recordatorioModuloInactivo,
  recordatorioObjetivoMitadMes,
  recordatorioCierreRanking,
} from './services/recordatorios.service';
import {
  enviarCierreSemanalRanking,
  enviarReinicioLunesRanking,
} from './services/ranking-notificaciones.service';
import { processScheduledComunicados } from './services/comunicados-scheduler.service';
const app = express();

// ─────────────────────────────────────────────────────
// Seguridad básica
// helmet pone headers HTTP defensivos (X-Frame-Options, etc.)
// ─────────────────────────────────────────────────────
app.use(helmet());

// ─────────────────────────────────────────────────────
// CORS — en producción solo acepta peticiones del frontend
// ─────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const stripSlash = (o: string) => o.replace(/\/$/, '');
      const originNorm = stripSlash(origin);

      const fromEnv = (process.env.FRONTEND_URL || '')
        .split(',')
        .map((s) => stripSlash(s.trim()))
        .filter(Boolean);
      const extra = (process.env.FRONTEND_URLS || '')
        .split(',')
        .map((s) => stripSlash(s.trim()))
        .filter(Boolean);
      const allowList = [...fromEnv, ...extra];

      const isLocal =
        originNorm === 'http://localhost:3000' || originNorm === 'http://127.0.0.1:3000';
      const isVercel = /^https:\/\/[a-z0-9.-]+\.vercel\.app$/i.test(originNorm);

      if (allowList.includes(originNorm) || isLocal || isVercel) {
        return callback(null, true);
      }

      console.warn(
        `[CORS] Origen no permitido: ${originNorm} (FRONTEND_URL=${process.env.FRONTEND_URL || '(vacío)'})`,
      );
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─────────────────────────────────────────────────────
// Parseo de JSON
// ─────────────────────────────────────────────────────
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────
// Logging HTTP
// ─────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─────────────────────────────────────────────────────
// Rate limiting global — 100 requests por IP cada 15 minutos
// ─────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Intentá de nuevo en 15 minutos.' },
});
app.use('/api', globalLimiter);

// ─────────────────────────────────────────────────────
// Health check — para Railway/Render sepan que el proceso vive
// ─────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────
// Rutas de la API
// ─────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/modulos', modulosRoutes);
app.use('/api/examenes', examenesRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/atenciones', atencionesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/comunicados', comunicadosRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/objetivos', objetivosRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/mecanico', mecanicoRoutes);

// ─────────────────────────────────────────────────────
// 404 — cualquier ruta no definida cae acá
// ─────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ─────────────────────────────────────────────────────
// Error handler global — siempre al final
// ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─────────────────────────────────────────────────────
// Arranque del servidor
// ─────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV}`);
  console.log(`   Frontend permitido: ${process.env.FRONTEND_URL}`);

  // ─────────────────────────────────────────────────────
  // Cron jobs — recordatorios automáticos
  // Timezone: America/Argentina/Salta (UTC-3, sin DST)
  // ─────────────────────────────────────────────────────

  // Diario a las 10:00 — módulos sin avanzar hace 3+ días
  cron.schedule('0 10 * * *', () => {
    recordatorioModuloInactivo().catch(console.error);
  }, { timezone: 'America/Argentina/Salta' });

  // Día 15 de cada mes a las 9:00 — objetivo mensual por debajo del 40%
  cron.schedule('0 9 15 * *', () => {
    recordatorioObjetivoMitadMes().catch(console.error);
  }, { timezone: 'America/Argentina/Salta' });

  // Viernes a las 17:00 — cierre de ranking mañana (sábado)
  cron.schedule('0 17 * * 5', () => {
    recordatorioCierreRanking().catch(console.error);
  }, { timezone: 'America/Argentina/Salta' });

  // Sábado a las 18:00 — cierre semanal y posición final
  cron.schedule('0 18 * * 6', () => {
    enviarCierreSemanalRanking().catch(console.error);
  }, { timezone: 'America/Argentina/Salta' });

  // Lunes a las 08:00 — reinicio simbólico de semana
  cron.schedule('0 8 * * 1', () => {
    enviarReinicioLunesRanking().catch(console.error);
  }, { timezone: 'America/Argentina/Salta' });

  // Cada minuto — publicar comunicados programados
  cron.schedule('* * * * *', () => {
    processScheduledComunicados().catch(console.error);
  }, { timezone: 'America/Argentina/Salta' });

  console.log('   ⏰ Cron jobs activos: módulos, objetivos, ranking, comunicados programados');
});

export default app;