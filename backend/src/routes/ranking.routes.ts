/**
 * ranking.routes.ts — Tabla de posiciones de vendedores
 *
 * GET /api/ranking — ranking calculado en base a módulos, conversión y QR
 */

import { Router } from 'express';
import { supabase } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', async (_req, res, next) => {
  try {
    const [
      { data: vendedores },
      { data: modulos },
      { data: progresos },
      { data: atenciones },
      { data: calificaciones },
    ] = await Promise.all([
      supabase.from('users').select('id, nombre, apellido').eq('rol', 'vendedor').eq('activo', true),
      supabase.from('modulos').select('id').eq('activo', true),
      supabase.from('progreso').select('user_id, estado, mejor_nota').eq('estado', 'aprobado'),
      supabase.from('atenciones').select('user_id, resultado'),
      supabase.from('calificaciones_qr').select('vendedor_id, estrellas'),
    ]);

    const totalModulos = modulos?.length || 0;

    const ranking = (vendedores || []).map((v) => {
      const progreso = (progresos || []).filter((p) => p.user_id === v.id);
      const modulosAprobados = progreso.length;

      const atenc = (atenciones || []).filter((a) => a.user_id === v.id);
      const ventas = atenc.filter((a) => a.resultado === 'venta_cerrada').length;
      const tasaConversion = atenc.length > 0
        ? Math.round((ventas / atenc.length) * 100)
        : 0;

      const cals = (calificaciones || []).filter((c) => c.vendedor_id === v.id);
      const promedioQR = cals.length > 0
        ? Math.round((cals.reduce((acc, c) => acc + c.estrellas, 0) / cals.length) * 10) / 10
        : 0;

      const notasAprobados = progreso.map((p) => p.mejor_nota).filter((n) => n > 0);
      const promedioExamenes = notasAprobados.length > 0
        ? Math.round(notasAprobados.reduce((a, b) => a + b, 0) / notasAprobados.length * 10) / 10
        : 0;

      return {
        id: v.id,
        nombre: `${v.nombre} ${v.apellido}`,
        modulosAprobados,
        totalModulos,
        tasaConversion,
        totalAtenciones: atenc.length,
        promedioQR,
        totalCalificaciones: cals.length,
        promedioExamenes,
      };
    });

    // Orden: módulos desc → tasa conversión desc → QR desc
    ranking.sort((a, b) => {
      if (b.modulosAprobados !== a.modulosAprobados) return b.modulosAprobados - a.modulosAprobados;
      if (b.tasaConversion !== a.tasaConversion) return b.tasaConversion - a.tasaConversion;
      return b.promedioQR - a.promedioQR;
    });

    return res.status(200).json({ ranking });
  } catch (error) {
    next(error);
  }
});

export default router;
