/**
 * ranking.routes.ts
 *
 * GET /api/ranking/semanal  — ranking semanal por ventas (vendedor y admin)
 * GET /api/ranking/historico — estadísticas acumuladas (solo admin)
 *
 * Ciclo semanal:
 *  Lunes–Sábado: ranking activo, se acumulan ventas en tiempo real
 *  Domingo:      ranking visible pero cerrado (muestra datos Lun–Sáb)
 *  Lunes:        reset, todos arrancan desde cero
 */

import { Router } from 'express';
import { supabase } from '../config/database';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

/** Devuelve el rango de fechas de la semana actual según el día */
function getSemanaActual() {
  const now = new Date();
  // Convertir a hora argentina (UTC-3)
  const arg = new Date(now.toLocaleString('en-US', { timeZone: 'America/Argentina/Salta' }));
  const dia = arg.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab

  let lunes: Date;
  let sabado: Date;
  let estado: 'activa' | 'cerrada';

  if (dia === 0) {
    // Domingo: mostrar semana anterior (Lun–Sáb)
    lunes = new Date(arg);
    lunes.setDate(arg.getDate() - 6);
    lunes.setHours(0, 0, 0, 0);
    sabado = new Date(arg);
    sabado.setDate(arg.getDate() - 1);
    sabado.setHours(23, 59, 59, 999);
    estado = 'cerrada';
  } else {
    // Lunes–Sábado: semana en curso
    lunes = new Date(arg);
    lunes.setDate(arg.getDate() - (dia - 1));
    lunes.setHours(0, 0, 0, 0);
    sabado = new Date(lunes);
    sabado.setDate(lunes.getDate() + 5);
    sabado.setHours(23, 59, 59, 999);
    estado = dia === 6 ? 'cerrada' : 'activa';
  }

  return { lunes, sabado, estado };
}

// GET /api/ranking/semanal
router.get('/semanal', async (_req, res, next) => {
  try {
    const { lunes, sabado, estado } = getSemanaActual();

    const [
      { data: vendedores },
      { data: atenciones },
    ] = await Promise.all([
      supabase
        .from('users')
        .select('id, nombre, apellido')
        .eq('rol', 'vendedor')
        .eq('activo', true),
      supabase
        .from('atenciones')
        .select('user_id, resultado, monto, created_at')
        .eq('resultado', 'venta_cerrada')
        .gte('created_at', lunes.toISOString())
        .lte('created_at', sabado.toISOString()),
    ]);

    const ranking = (vendedores || []).map((v) => {
      const ventas = (atenciones || []).filter((a) => a.user_id === v.id);
      const cantidadVentas = ventas.length;
      const montoTotal = ventas.reduce((acc, a) => acc + (a.monto || 0), 0);

      return {
        id: v.id,
        nombre: `${v.nombre} ${v.apellido}`,
        cantidadVentas,
        montoTotal,
      };
    });

    // Orden: ventas desc → monto desc
    ranking.sort((a, b) => {
      if (b.cantidadVentas !== a.cantidadVentas) return b.cantidadVentas - a.cantidadVentas;
      return b.montoTotal - a.montoTotal;
    });

    return res.status(200).json({
      ranking,
      semana: {
        inicio: lunes.toISOString(),
        fin: sabado.toISOString(),
        estado,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/ranking/historico — solo admin
router.get('/historico', requireRole('admin'), async (_req, res, next) => {
  try {
    const [
      { data: vendedores },
      { data: atenciones },
    ] = await Promise.all([
      supabase
        .from('users')
        .select('id, nombre, apellido')
        .eq('rol', 'vendedor')
        .eq('activo', true),
      supabase
        .from('atenciones')
        .select('user_id, resultado, monto'),
    ]);

    const stats = (vendedores || []).map((v) => {
      const todas = (atenciones || []).filter((a) => a.user_id === v.id);
      const ventas = todas.filter((a) => a.resultado === 'venta_cerrada');
      const totalAtenciones = todas.length;
      const totalVentas = ventas.length;
      const montoTotal = ventas.reduce((acc, a) => acc + (a.monto || 0), 0);
      const tasaConversion = totalAtenciones > 0
        ? Math.round((totalVentas / totalAtenciones) * 100)
        : 0;

      return {
        id: v.id,
        nombre: `${v.nombre} ${v.apellido}`,
        totalVentas,
        totalAtenciones,
        montoTotal,
        tasaConversion,
      };
    });

    stats.sort((a, b) => b.totalVentas - a.totalVentas);

    return res.status(200).json({ stats });
  } catch (error) {
    next(error);
  }
});

export default router;
