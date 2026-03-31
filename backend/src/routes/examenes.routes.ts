/**
 * examenes.routes.ts — Rutas de exámenes
 *
 * Todas las rutas requieren autenticación.
 */

import { Router } from 'express';
import { examenesController } from '../controllers/examenes.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/examenes/:moduloId/preguntas
router.get(
  '/:moduloId/preguntas',
  examenesController.getPreguntas.bind(examenesController)
);

// POST /api/examenes/:moduloId/submit
router.post(
  '/:moduloId/submit',
  examenesController.submitExamen.bind(examenesController)
);

// GET /api/examenes/:moduloId/historial
router.get(
  '/:moduloId/historial',
  examenesController.getHistorial.bind(examenesController)
);

export default router;