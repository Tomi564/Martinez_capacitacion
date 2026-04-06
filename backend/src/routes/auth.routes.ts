/**
 * auth.routes.ts — Definición de rutas de autenticación
 *
 * Conecta las URLs con sus middlewares y controllers.
 * Es el "mapa" de la API de autenticación.
 *
 * Rutas definidas:
 *  POST /api/auth/login   → login con email y contraseña
 *  GET  /api/auth/me      → datos del usuario autenticado
 *  POST /api/auth/logout  → cerrar sesión
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// ─────────────────────────────────────────────────────
// Rate limiter específico para login
// Más estricto que el global: 10 intentos cada 15 minutos
// Protege contra ataques de fuerza bruta sobre contraseñas
// ─────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos de login. Esperá 15 minutos e intentá de nuevo.',
  },
});

// ─────────────────────────────────────────────────────
// Rutas públicas (sin autenticación)
// ─────────────────────────────────────────────────────

// POST /api/auth/login
router.post(
  '/login',
  loginLimiter,                      // Primero el rate limiter
  authController.login.bind(authController)  // Después el controller
);

// ─────────────────────────────────────────────────────
// Rutas protegidas (requieren JWT válido)
// ─────────────────────────────────────────────────────

// GET /api/auth/me
router.get(
  '/me',
  authMiddleware,                    // Verifica el JWT
  authController.me.bind(authController)
);

// POST /api/auth/logout
router.post(
  '/logout',
  authMiddleware,                    // Solo usuarios autenticados pueden hacer logout
  authController.logout.bind(authController)
);

export default router;