/**
 * objetivos.routes.ts — Objetivos mensuales por vendedor
 *
 * GET /api/objetivos/actual — objetivo + progreso del mes actual (vendedor)
 */

import { Router, Response, NextFunction } from 'express';
import { supabase } from '../config/database';
import { authMiddleware } from '../middleware/auth.middleware';
import type { AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// GET /api/objetivos/actual — objetivo del mes en curso para el vendedor logueado
router.get('/actual', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const ahora = new Date();
    const mes = ahora.getMonth() + 1;
    const anio = ahora.getFullYear();

    const { data: objetivo } = await supabase
      .from('objetivos')
      .select('meta_ventas, meta_conversion')
      .eq('user_id', userId)
      .eq('mes', mes)
      .eq('anio', anio)
      .maybeSingle();

    // Calcular progreso real del mes
    const inicioMes = new Date(anio, mes - 1, 1).toISOString();
    const { data: atenciones } = await supabase
      .from('atenciones')
      .select('resultado')
      .eq('user_id', userId)
      .gte('created_at', inicioMes);

    const total = atenciones?.length || 0;
    const ventas = (atenciones || []).filter((a) => a.resultado === 'venta_cerrada').length;
    const tasaActual = total > 0 ? Math.round((ventas / total) * 100) : 0;

    return res.status(200).json({
      objetivo: objetivo || null,
      progreso: { ventas, total, tasaConversion: tasaActual },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
