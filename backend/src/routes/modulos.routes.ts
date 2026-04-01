/**
 * modulos.routes.ts — Rutas de módulos
 *
 * Todas las rutas requieren autenticación.
 * Las rutas de escritura (POST, PUT, DELETE) requieren rol admin.
 */

import { Router } from 'express';
import { modulosController } from '../controllers/modulos.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { progresoService } from '../services/progreso.service';

const router = Router();

// Todas las rutas de módulos requieren autenticación
router.use(authMiddleware);

// ─────────────────────────────────────────────────────
// Rutas para vendedores y admins
// ─────────────────────────────────────────────────────

// GET /api/modulos
router.get('/', modulosController.getModulos.bind(modulosController));

// GET /api/modulos/mi-nivel

router.get('/mi-nivel', async (req: any, res, next) => {
  try {
    const result = await progresoService.getNivel(req.user!.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/modulos/:id
router.get('/:id', modulosController.getModuloById.bind(modulosController));

export default router;