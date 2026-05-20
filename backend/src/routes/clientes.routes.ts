/**
 * clientes.routes.ts — Búsqueda y clientes vinculados a ventas
 */

import { Router } from 'express';
import { clientesController } from '../controllers/clientes.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get(
  '/sugerencias',
  requireRole('vendedor', 'admin'),
  clientesController.sugerencias.bind(clientesController)
);

router.get(
  '/ventas',
  requireRole('vendedor', 'admin'),
  clientesController.ventas.bind(clientesController)
);

export default router;
