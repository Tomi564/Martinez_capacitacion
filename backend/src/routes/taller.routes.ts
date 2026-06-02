/**
 * taller.routes.ts — QR y calificaciones del taller (gomero / mecánico)
 */

import { Router } from 'express';
import { tallerController } from '../controllers/taller.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Público — cliente escanea QR del taller
router.get('/encuesta/:codigo', tallerController.getEncuesta.bind(tallerController));

router.post('/calificaciones', tallerController.calificar.bind(tallerController));

// Protegido — personal del taller
router.get(
  '/qr/mio',
  authMiddleware,
  requireRole('gomero', 'mecanico', 'admin'),
  tallerController.getMiQR.bind(tallerController),
);

router.get(
  '/mis-calificaciones',
  authMiddleware,
  requireRole('gomero', 'mecanico', 'admin'),
  tallerController.getMisCalificaciones.bind(tallerController),
);

export default router;
