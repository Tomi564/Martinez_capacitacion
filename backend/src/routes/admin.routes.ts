/**
 * admin.routes.ts — Rutas del panel de administración
 *
 * Todas las rutas requieren autenticación Y rol admin.
 */

import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { supabase } from '../config/database';

const router = Router();

// Todas las rutas admin requieren autenticación y rol admin
router.use(authMiddleware);
router.use(requireRole('admin'));

// ─────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────

// GET /api/admin/dashboard
router.get(
  '/dashboard',
  adminController.getDashboard.bind(adminController)
);

// ─────────────────────────────────────────────────────
// Vendedores
// ─────────────────────────────────────────────────────

// GET /api/admin/vendedores
router.get(
  '/vendedores',
  adminController.getVendedores.bind(adminController)
);

// POST /api/admin/vendedores
router.post(
  '/vendedores',
  adminController.crearVendedor.bind(adminController)
);

// PATCH /api/admin/vendedores/:id
router.patch(
  '/vendedores/:id',
  adminController.updateVendedor.bind(adminController)
);

// ─────────────────────────────────────────────────────
// Módulos
// ─────────────────────────────────────────────────────

// GET /api/admin/modulos
router.get(
  '/modulos',
  adminController.getModulos.bind(adminController)
);

// POST /api/admin/modulos
router.post(
  '/modulos',
  adminController.crearModulo.bind(adminController)
);

// PATCH /api/admin/modulos/:id
router.patch(
  '/modulos/:id',
  adminController.updateModulo.bind(adminController)
);

// ─────────────────────────────────────────────────────
// Reportes
// ─────────────────────────────────────────────────────

// GET /api/admin/reportes
router.get(
  '/reportes',
  adminController.getReportes.bind(adminController)
);

// GET /api/admin/modulos/:id
router.get(
  '/modulos/:id',
  adminController.getModuloById.bind(adminController)
);

// POST /api/admin/modulos/:id/preguntas
router.post(
  '/modulos/:id/preguntas',
  adminController.crearPregunta.bind(adminController)
);

// PATCH /api/admin/modulos/:id/preguntas/:preguntaId
router.patch(
  '/modulos/:id/preguntas/:preguntaId',
  adminController.updatePregunta.bind(adminController)
);

// GET /api/admin/vendedores/:id
router.get(
  '/vendedores/:id',
  adminController.getVendedorById.bind(adminController)
);

// DELETE /api/admin/vendedores/:id
router.delete(
  '/vendedores/:id',
  adminController.eliminarVendedor.bind(adminController)
);

// DELETE /api/admin/modulos/:id
router.delete(
  '/modulos/:id',
  adminController.eliminarModulo.bind(adminController)
);

// ─────────────────────────────────────────────────────
// Notificaciones
// ─────────────────────────────────────────────────────

// GET /api/admin/notificaciones
router.get('/notificaciones', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('notificaciones_admin')
      .select(`
        *,
        users (nombre, apellido, email),
        modulos (titulo, orden)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error('Error al obtener notificaciones');

    const noLeidas = (data || []).filter(n => !n.leida).length;

    return res.status(200).json({
      notificaciones: data || [],
      noLeidas,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/notificaciones/leer-todas
// IMPORTANTE: debe ir antes de /:id/leer para que Express no confunda "leer-todas" con un :id
router.patch('/notificaciones/leer-todas', async (_req, res, next) => {
  try {
    await supabase
      .from('notificaciones_admin')
      .update({ leida: true })
      .eq('leida', false);

    return res.status(200).json({ mensaje: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/notificaciones/:id/leer
router.patch('/notificaciones/:id/leer', async (req, res, next) => {
  try {
    const id = req.params.id as string;

    await supabase
      .from('notificaciones_admin')
      .update({ leida: true })
      .eq('id', id);

    return res.status(200).json({ mensaje: 'Notificación marcada como leída' });
  } catch (error) {
    next(error);
  }
});

export default router;