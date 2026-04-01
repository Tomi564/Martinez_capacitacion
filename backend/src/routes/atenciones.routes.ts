/**
 * atenciones.routes.ts — Rutas de registro de atenciones
 */

import { Router } from 'express';
import { atencionesController } from '../controllers/atenciones.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// POST /api/atenciones
router.post(
  '/',
  atencionesController.crear.bind(atencionesController)
);

// GET /api/atenciones/mias
router.get(
  '/mias',
  atencionesController.getMias.bind(atencionesController)
);

// GET /api/atenciones/todas — solo admin
router.get(
  '/todas',
  requireRole('admin'),
  atencionesController.getTodas.bind(atencionesController)
);

export default router;
