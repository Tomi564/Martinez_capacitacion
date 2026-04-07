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
import pushRoutes from './routes/push.routes';
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
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─────────────────────────────────────────────────────
// Parseo de JSON
// ─────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
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
  max: 100,
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
});

export default app;