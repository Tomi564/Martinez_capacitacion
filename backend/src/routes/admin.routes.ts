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

// ─────────────────────────────────────────────────────
// Niveles
// ─────────────────────────────────────────────────────

// GET /api/admin/niveles
router.get('/niveles', async (_req, res, next) => {
  try {
    const { data: vendedores } = await supabase
      .from('users')
      .select('id, nombre, apellido, email')
      .eq('rol', 'vendedor')
      .eq('activo', true);

    if (!vendedores?.length) {
      return res.status(200).json({ vendedores: [] });
    }

    const { data: modulos } = await supabase
      .from('modulos')
      .select('id')
      .eq('activo', true);

    const totalModulos = modulos?.length || 10;

    const { data: progresos } = await supabase
      .from('progreso')
      .select('user_id, estado, mejor_nota');

    const getNivel = (userId: string) => {
      const progVendedor = (progresos || []).filter(p => p.user_id === userId);
      const aprobados = progVendedor.filter(p => p.estado === 'aprobado');
      const totalAprobados = aprobados.length;

      if (totalAprobados >= totalModulos) return 'profesional';
      if (totalAprobados >= 6) return 'vendedor';
      if (totalAprobados >= 3) return 'aprendiz';
      if (totalAprobados > 0) return 'aprendiz';
      return 'sin_inicio';
    };

    const NIVEL_LABELS: Record<string, string> = {
      sin_inicio:  'Sin inicio',
      aprendiz:    'Aprendiz',
      vendedor:    'Vendedor',
      profesional: 'Profesional',
      elite:       'Élite ★',
    };

    const NIVEL_COLORS: Record<string, string> = {
      sin_inicio:  'gray',
      aprendiz:    'blue',
      vendedor:    'amber',
      profesional: 'green',
      elite:       'purple',
    };

    const SIGUIENTE_NIVEL: Record<string, { label: string; requisito: string } | null> = {
      sin_inicio:  { label: 'Aprendiz',    requisito: 'Aprobá los primeros 3 módulos' },
      aprendiz:    { label: 'Vendedor',    requisito: 'Aprobá módulos 1-6 con promedio ≥80%' },
      vendedor:    { label: 'Profesional', requisito: 'Aprobá los 10 módulos' },
      profesional: { label: 'Élite',       requisito: 'Calificación ≥4.5/5 por 3 meses' },
      elite:       null,
    };

    const vendedoresConNivel = vendedores.map(v => {
      const progVendedor = (progresos || []).filter(p => p.user_id === v.id);
      const aprobados = progVendedor.filter(p => p.estado === 'aprobado').length;
      const nivel = getNivel(v.id);
      const siguiente = SIGUIENTE_NIVEL[nivel];

      return {
        id: v.id,
        nombre: v.nombre,
        apellido: v.apellido,
        email: v.email,
        nivel,
        label: NIVEL_LABELS[nivel],
        color: NIVEL_COLORS[nivel],
        progresoPorcentaje: totalModulos > 0
          ? Math.round((aprobados / totalModulos) * 100)
          : 0,
        modulosAprobados: aprobados,
        totalModulos,
        siguienteNivel: siguiente?.label || null,
        requisiteSiguiente: siguiente?.requisito || null,
      };
    });

    // Ordenar por nivel descendente
    const ordenNivel = ['elite', 'profesional', 'vendedor', 'aprendiz', 'sin_inicio'];
    vendedoresConNivel.sort((a, b) =>
      ordenNivel.indexOf(a.nivel) - ordenNivel.indexOf(b.nivel)
    );

    return res.status(200).json({ vendedores: vendedoresConNivel });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────
// Inactivos
// ─────────────────────────────────────────────────────

// GET /api/admin/inactivos
// Vendedores que llevan más de 3 días sin avanzar
router.get('/inactivos', async (_req, res, next) => {
  try {
    const { data, error } = await supabase.rpc('detectar_inactivos');

    if (error) throw new Error('Error al obtener vendedores inactivos');

    return res.status(200).json({ inactivos: data || [] });
  } catch (error) {
    next(error);
  }
});

export default router;