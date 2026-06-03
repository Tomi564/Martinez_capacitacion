import { Router, Response, NextFunction } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import type { AuthRequest } from '../middleware/auth.middleware';
import { WHATSAPP_SUGERENCIAS } from '../config/whatsapp';
import { presupuestoVisitaController } from '../controllers/presupuesto-visita.controller';
import { presupuestoVisitaService } from '../services/presupuesto-visita.service';
import type { PresupuestoLineaInput } from '../services/presupuesto-lineas.service';
import {
  vehiculosBuscarPatenteHandler,
  vehiculosSugerenciasHandler,
} from '../handlers/vehiculos-patente.handler';

const router = Router();
router.use(authMiddleware);

// ─────────────────────────────────────────────────────
// Sugerencias (vendedor)
// ─────────────────────────────────────────────────────

// GET /api/vendedor/sugerencias — lista propia
router.get('/sugerencias', requireRole('vendedor'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const uid = req.user!.id;
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 50));
    const offset = Math.max(0, Number(req.query.offset) || 0);

    const { data, error, count } = await supabase
      .from('sugerencias_dev')
      .select('id, texto, estado, created_at, rol', { count: 'exact' })
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new AppError('Error al obtener sugerencias', 500);
    return res.json({ sugerencias: data || [], total: count || 0, limit, offset });
  } catch (e) {
    next(e);
  }
});

// POST /api/vendedor/sugerencias — crear sugerencia propia + link WhatsApp
router.post('/sugerencias', requireRole('vendedor'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { texto } = req.body as { texto?: string };
    if (!texto?.trim()) throw new AppError('El texto es requerido', 400);

    const uid = req.user!.id;
    const rol = req.user!.rol || 'vendedor';

    const { data, error } = await supabase
      .from('sugerencias_dev')
      .insert({
        texto: texto.trim(),
        estado: 'pendiente',
        user_id: uid,
        rol,
      })
      .select('id, texto, estado, created_at, rol')
      .single();
    if (error) throw new AppError('Error al guardar sugerencia', 500);

    const usuario = req.user as { nombre?: string; apellido?: string; rol?: string } | undefined;
    const nombre = usuario ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() : 'Usuario';
    const fechaHora = new Date().toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Salta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const mensajeWhatsapp = [
      'Nueva sugerencia desde Martínez Capacitación',
      `Rol: ${rol}`,
      `Usuario: ${nombre}`,
      `Fecha: ${fechaHora}`,
      '',
      `Sugerencia: ${texto.trim()}`,
    ].join('\n');

    const whatsappUrl = WHATSAPP_SUGERENCIAS
      ? `https://wa.me/${WHATSAPP_SUGERENCIAS}?text=${encodeURIComponent(mensajeWhatsapp)}`
      : null;

    return res.status(201).json({
      sugerencia: data,
      whatsappUrl,
      mensajeWhatsapp,
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/vendedor/visitas/:id/presupuesto.pdf — PDF de presupuesto (antes de /visitas/:id si se agrega)
router.get(
  '/visitas/:id/presupuesto.pdf',
  requireRole('vendedor'),
  (req, res, next) => presupuestoVisitaController.descargar(req, res, next)
);

// PATCH /api/vendedor/visitas/:id/presupuesto — precios finales del vendedor
router.patch(
  '/visitas/:id/presupuesto',
  requireRole('vendedor'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const rawId = req.params.id;
      const visitaId = typeof rawId === 'string' ? rawId : rawId?.[0];
      if (!visitaId) throw new AppError('ID de visita inválido', 400);

      const { presupuesto_lineas } = req.body as { presupuesto_lineas?: PresupuestoLineaInput[] };
      if (!Array.isArray(presupuesto_lineas)) {
        throw new AppError('presupuesto_lineas es requerido', 400);
      }

      const lineas = await presupuestoVisitaService.guardarPresupuestoVendedor(
        visitaId,
        presupuesto_lineas,
        req.user!.id,
        (req.user!.sucursal as string | null) ?? null,
      );

      return res.json({ presupuesto_lineas: lineas });
    } catch (e) {
      next(e);
    }
  },
);

// DELETE /api/vendedor/sugerencias/:id — eliminar propia
router.delete('/sugerencias/:id', requireRole('vendedor'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const uid = req.user!.id;
    const { id } = req.params;
    if (!id) throw new AppError('ID inválido', 400);

    const { error } = await supabase
      .from('sugerencias_dev')
      .delete()
      .eq('id', id)
      .eq('user_id', uid);

    if (error) throw new AppError('Error al eliminar sugerencia', 500);
    return res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// GET /api/vendedor/vehiculos/sugerencias?q= — autocompletado patente (atenciones)
router.get('/vehiculos/sugerencias', requireRole('vendedor'), vehiculosSugerenciasHandler);

// GET /api/vendedor/vehiculos/buscar/:patente
router.get('/vehiculos/buscar/:patente', requireRole('vendedor'), vehiculosBuscarPatenteHandler);

export default router;

