/**
 * qr.routes.ts — Rutas del sistema QR
 *
 * Algunas rutas son públicas (encuesta, calificar)
 * porque el cliente final no tiene cuenta en el sistema.
 */

import { Router } from 'express';
import { qrController } from '../controllers/qr.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// ─────────────────────────────────────────────────────
// Rutas PÚBLICAS — sin autenticación
// El cliente final llega acá desde el QR
// ─────────────────────────────────────────────────────

// GET /api/qr/encuesta/:codigo
router.get(
  '/encuesta/:codigo',
  qrController.getEncuesta.bind(qrController)
);

// POST /api/qr/calificar/:codigo
router.post(
  '/calificar/:codigo',
  qrController.calificar.bind(qrController)
);

// ─────────────────────────────────────────────────────
// Rutas PROTEGIDAS — requieren autenticación
// ─────────────────────────────────────────────────────

// GET /api/qr/mio
router.get(
  '/mio',
  authMiddleware,
  qrController.getMiQR.bind(qrController)
);

// GET /api/qr/mis-calificaciones
router.get(
  '/mis-calificaciones',
  authMiddleware,
  qrController.getMisCalificaciones.bind(qrController)
);

export default router;