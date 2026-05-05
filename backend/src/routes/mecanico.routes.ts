import { Router, Response, NextFunction } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { normalizePatenteAr } from '../utils/patente';
import type { AuthRequest } from '../middleware/auth.middleware';
import { Resend } from 'resend';
import { sendPushToUserIds } from '../services/push-send.service';

const router = Router();
router.use(authMiddleware);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const registrarAuditoria = async (
  req: AuthRequest,
  payload: {
    accion: string;
    entidad: string;
    entidadId?: string | null;
    datosAnteriores?: unknown;
    datosNuevos?: unknown;
  }
) => {
  const user = req.user as { id?: string; rol?: string } | undefined;
  if (!user?.id) return;
  try {
    await supabase.rpc('registrar_auditoria_operacional', {
      p_usuario_id: user.id,
      p_rol: user.rol || 'mecanico',
      p_accion: payload.accion,
      p_entidad: payload.entidad,
      p_entidad_id: payload.entidadId || null,
      p_datos_anteriores: (payload.datosAnteriores ?? null) as any,
      p_datos_nuevos: (payload.datosNuevos ?? null) as any,
    });
  } catch (e) {
    console.error('[mecanico] auditoria_operacional error', e);
  }
};

// ─── Clientes ───────────────────────────────────────────────────────────────

// GET /api/mecanico/clientes — lista para admin/vendedor
router.get('/clientes', requireRole('admin', 'vendedor'), async (req, res: Response, next: NextFunction) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const includeEmpty = String(req.query.include_empty || '').toLowerCase() === 'true';
    const { data, error, count } = await supabase
      .from('vehiculos')
      .select(
        `id, patente, marca, modelo, anio, medida_rueda, created_at, clientes(id, nombre, apellido, dni, telefono, email), visitas_taller(id, estado, motivo, observaciones, km, diagnostico_enviado, created_at)`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new AppError('Error al obtener vehículos', 500);
    const vehiculos = includeEmpty
      ? (data || [])
      : (data || []).filter((v: any) => Array.isArray(v.visitas_taller) && v.visitas_taller.length > 0);
    return res.json({
      vehiculos,
      total: includeEmpty ? (count || 0) : vehiculos.length,
      limit,
      offset,
    });
  } catch (e) { next(e); }
});

// POST /api/mecanico/clientes — crear cliente
router.post('/clientes', requireRole('admin', 'vendedor', 'mecanico'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { nombre, apellido, dni, telefono, email } = req.body;
    if (!nombre || !apellido) throw new AppError('Nombre y apellido requeridos', 400);
    const { data, error } = await supabase
      .from('clientes')
      .insert({ nombre, apellido, dni: dni || null, telefono: telefono || null, email: email || null })
      .select().single();
    if (error) throw new AppError('Error al crear cliente', 500);
    return res.status(201).json({ cliente: data });
  } catch (e) { next(e); }
});

// ─── Vehículos ──────────────────────────────────────────────────────────────

// GET /api/mecanico/vehiculos/sugerencias?q=ABC
router.get('/vehiculos/sugerencias', requireRole('mecanico', 'admin', 'gomero'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rawTrim = String(req.query.q || '').trim();
    if (rawTrim.length < 3 || !/[a-zA-Z0-9]/.test(rawTrim)) return res.json({ vehiculos: [] });

    const qTexto = rawTrim.toUpperCase();
    const qPatente = normalizePatenteAr(rawTrim);

    const orFilter =
      qPatente.length > 0
        ? `patente.ilike.%${qPatente}%,marca.ilike.%${qTexto}%,modelo.ilike.%${qTexto}%`
        : `marca.ilike.%${qTexto}%,modelo.ilike.%${qTexto}%`;

    const { data, error } = await supabase
      .from('vehiculos')
      .select(`id, patente, marca, modelo, anio, medida_rueda, clientes(id, nombre, apellido, telefono, email)`)
      .or(orFilter)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) throw new AppError('Error al buscar sugerencias de vehículos', 500);
    return res.json({ vehiculos: data || [] });
  } catch (e) { next(e); }
});

// GET /api/mecanico/vehiculos/buscar/:patente
router.get('/vehiculos/buscar/:patente', requireRole('mecanico', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const param = req.params.patente;
    let rawPat = typeof param === 'string' ? param : Array.isArray(param) ? param[0] || '' : '';
    try {
      rawPat = decodeURIComponent(rawPat.replace(/\+/g, '%20'));
    } catch {
      /* parámetro inválido, normalize devolverá '' */
    }
    const patenteParam = normalizePatenteAr(rawPat);
    if (!patenteParam) throw new AppError('Patente vacía', 400);
    const { data, error } = await supabase
      .from('vehiculos')
      .select(`*, clientes(id, nombre, apellido, dni, telefono, email)`)
      .eq('patente', patenteParam)
      .maybeSingle();
    if (error) throw new AppError('Error al buscar', 500);
    return res.json({ vehiculo: data });
  } catch (e) { next(e); }
});

// POST /api/mecanico/vehiculos — crear vehículo (y cliente si viene)
router.post('/vehiculos', requireRole('mecanico', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { patente: patenteRaw, marca, modelo, anio, medida_rueda, cliente_id, cliente } = req.body;
    const patente = normalizePatenteAr(String(patenteRaw || ''));
    if (!patente || !marca || !modelo) throw new AppError('Patente, marca y modelo requeridos', 400);

    let clienteId = cliente_id;

    // Si no viene cliente_id, crear el cliente primero
    if (!clienteId && cliente) {
      const { data: nuevoCliente, error: errCliente } = await supabase
        .from('clientes')
        .insert({
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          dni: cliente.dni || null,
          telefono: cliente.telefono || null,
          email: cliente.email || null,
        })
        .select().single();
      if (errCliente) throw new AppError('Error al crear cliente', 500);
      clienteId = nuevoCliente.id;
    }

    const { data, error } = await supabase
      .from('vehiculos')
      .insert({ patente, marca, modelo, anio: anio || null, medida_rueda: medida_rueda || null, cliente_id: clienteId || null })
      .select(`*, clientes(id, nombre, apellido, telefono, email)`)
      .single();
    if (error) throw new AppError('Error al crear vehículo', 500);
    return res.status(201).json({ vehiculo: data });
  } catch (e) { next(e); }
});

// PATCH /api/mecanico/vehiculos/:id — vincular o actualizar titular
router.patch('/vehiculos/:vehiculoId', requireRole('mecanico', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const vehiculoId = req.params.vehiculoId as string;
    const { cliente } = req.body as {
      cliente?: { nombre?: string; apellido?: string; telefono?: string | null; email?: string | null };
    };
    if (!cliente?.nombre?.trim() || !cliente?.apellido?.trim()) {
      throw new AppError('Nombre y apellido del cliente son requeridos', 400);
    }

    const { data: vehiculo, error: vErr } = await supabase
      .from('vehiculos')
      .select('id, cliente_id')
      .eq('id', vehiculoId)
      .single();
    if (vErr || !vehiculo) throw new AppError('Vehículo no encontrado', 404);

    let clienteId = vehiculo.cliente_id as string | null;

    if (clienteId) {
      const { error: cErr } = await supabase
        .from('clientes')
        .update({
          nombre: cliente.nombre.trim(),
          apellido: cliente.apellido.trim(),
          telefono: cliente.telefono?.trim() || null,
          email: cliente.email?.trim() || null,
        })
        .eq('id', clienteId);
      if (cErr) throw new AppError('Error al actualizar cliente', 500);
    } else {
      const { data: nuevoCliente, error: insErr } = await supabase
        .from('clientes')
        .insert({
          nombre: cliente.nombre.trim(),
          apellido: cliente.apellido.trim(),
          telefono: cliente.telefono?.trim() || null,
          email: cliente.email?.trim() || null,
        })
        .select('id')
        .single();
      if (insErr) throw new AppError('Error al crear cliente', 500);
      clienteId = nuevoCliente.id;
      const { error: linkErr } = await supabase
        .from('vehiculos')
        .update({ cliente_id: clienteId })
        .eq('id', vehiculoId);
      if (linkErr) throw new AppError('Error al vincular cliente al vehículo', 500);
    }

    const { data: out, error: outErr } = await supabase
      .from('vehiculos')
      .select('*, clientes(id, nombre, apellido, telefono, email)')
      .eq('id', vehiculoId)
      .single();
    if (outErr) throw new AppError('Error al leer vehículo', 500);
    return res.json({ vehiculo: out });
  } catch (e) { next(e); }
});

// ─── Visitas ─────────────────────────────────────────────────────────────────

// GET /api/mecanico/checklist-items — ítems activos del checklist
router.get('/checklist-items', requireRole('mecanico', 'admin', 'vendedor'), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('checklist_items')
      .select('id, descripcion, orden')
      .eq('activo', true)
      .order('orden');
    if (error) throw new AppError('Error al obtener checklist', 500);
    return res.json({ items: data || [] });
  } catch (e) { next(e); }
});

// GET /api/mecanico/visitas — visitas activas del mecánico (sin entregadas)
router.get('/visitas', requireRole('mecanico', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const mecanicoId = req.user!.id;
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const offset = Math.max(0, Number(req.query.offset) || 0);

    const { data, error, count } = await supabase
      .from('visitas_taller')
      .select(`*, vehiculos(patente, marca, modelo, clientes(nombre, apellido))`, { count: 'exact' })
      .eq('mecanico_id', mecanicoId)
      .neq('estado', 'entregado')
      .or('orden_estado.is.null,orden_estado.eq.pendiente_mecanico')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new AppError('Error al obtener visitas', 500);
    return res.json({
      visitas: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (e) { next(e); }
});

// GET /api/mecanico/visitas/historial — historial paginado (sin filtro de fecha)
router.get('/visitas/historial', requireRole('mecanico', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const mecanicoId = req.user!.id;
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const offset = Math.max(0, Number(req.query.offset) || 0);

    const { data, error, count } = await supabase
      .from('visitas_taller')
      .select(`*, vehiculos(patente, marca, modelo, clientes(nombre, apellido))`, { count: 'exact' })
      .eq('mecanico_id', mecanicoId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new AppError('Error al obtener historial de visitas', 500);
    return res.json({
      visitas: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (e) { next(e); }
});

// POST /api/mecanico/visitas — crear visita
router.post('/visitas', requireRole('mecanico', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      vehiculo_id,
      motivo,
      km,
      observaciones,
      estado_neumaticos,
      estado_frenos,
      presion_psi,
      recomendacion,
    } = req.body;
    if (!vehiculo_id) throw new AppError('Vehículo requerido', 400);
    const { data, error } = await supabase
      .from('visitas_taller')
      .insert({
        vehiculo_id,
        gomero_id: null,
        mecanico_id: req.user!.id,
        motivo: motivo || null,
        observaciones: observaciones || null,
        estado_neumaticos: estado_neumaticos || null,
        estado_frenos: estado_frenos || null,
        presion_psi:
          presion_psi != null && presion_psi !== ''
            ? (() => {
                const n = Number(String(presion_psi).replace(',', '.'));
                return Number.isFinite(n) ? n : null;
              })()
            : null,
        recomendacion: recomendacion || null,
        estado_visita: 'abierta',
        km: km || null,
        estado: 'en_revision',
        orden_estado: 'pendiente_mecanico',
      })
      .select(`*, vehiculos(patente, marca, modelo, clientes(nombre, apellido, email))`)
      .single();
    if (error) throw new AppError('Error al crear visita', 500);
    return res.status(201).json({ visita: data });
  } catch (e) { next(e); }
});

// GET /api/mecanico/visitas/:id — detalle de visita con checklist (vendedor: solo lectura en el front)
router.get('/visitas/:id', requireRole('mecanico', 'admin', 'vendedor'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { data: visita, error } = await supabase
      .from('visitas_taller')
      .select(`*, vehiculos(patente, marca, modelo, anio, medida_rueda, clientes(nombre, apellido, email, telefono))`)
      .eq('id', req.params.id)
      .single();
    if (error || !visita) throw new AppError('Visita no encontrada', 404);

    const { data: items } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('activo', true)
      .order('orden');

    const { data: respuestas } = await supabase
      .from('checklist_respuestas')
      .select('*')
      .eq('visita_id', req.params.id);

    return res.json({ visita, items: items || [], respuestas: respuestas || [] });
  } catch (e) { next(e); }
});

// PATCH /api/mecanico/visitas/:id — actualizar estado/observaciones
router.patch('/visitas/:id', requireRole('mecanico', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      estado,
      observaciones,
      estado_neumaticos,
      estado_frenos,
      presion_psi,
      recomendacion,
      estado_visita,
      orden_estado,
      tren_delantero,
      tren_alineado,
      tren_balanceo,
      amortiguadores_revisados,
      auxilio_revisado,
      presupuesto,
      fotos_neumatico_urls,
    } = req.body;

    const { data: prev, error: prevErr } = await supabase
      .from('visitas_taller')
      .select(
        'id, orden_estado, mecanico_tomo_at, mecanico_id, vehiculos(patente)'
      )
      .eq('id', req.params.id)
      .single();
    if (prevErr || !prev) throw new AppError('Visita no encontrada', 404);

    const uid = req.user!.id;
    if (req.user!.rol === 'mecanico' && String(prev.mecanico_id) !== String(uid)) {
      throw new AppError('No autorizado', 403);
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (estado) updates.estado = estado;
    if (observaciones !== undefined) updates.observaciones = observaciones;
    if (estado_neumaticos !== undefined) updates.estado_neumaticos = estado_neumaticos || null;
    if (estado_frenos !== undefined) updates.estado_frenos = estado_frenos || null;
    if (presion_psi !== undefined) {
      if (presion_psi == null || presion_psi === '') {
        updates.presion_psi = null;
      } else {
        const n = Number(String(presion_psi).replace(',', '.'));
        updates.presion_psi = Number.isFinite(n) ? n : null;
      }
    }
    if (recomendacion !== undefined) updates.recomendacion = recomendacion || null;
    if (estado_visita !== undefined) updates.estado_visita = estado_visita;

    if (tren_delantero !== undefined) {
      updates.tren_delantero = tren_delantero === null || tren_delantero === '' ? null : String(tren_delantero);
    }
    if (tren_alineado !== undefined) updates.tren_alineado = tren_alineado;
    if (tren_balanceo !== undefined) updates.tren_balanceo = tren_balanceo;
    if (amortiguadores_revisados !== undefined) updates.amortiguadores_revisados = amortiguadores_revisados;
    if (auxilio_revisado !== undefined) updates.auxilio_revisado = auxilio_revisado;
    if (presupuesto !== undefined) updates.presupuesto = presupuesto || null;
    if (fotos_neumatico_urls !== undefined) {
      updates.fotos_neumatico_urls = Array.isArray(fotos_neumatico_urls) ? fotos_neumatico_urls : null;
    }

    if (orden_estado !== undefined) {
      const allowed = new Set(['pendiente_gomero', 'pendiente_mecanico', 'finalizado', 'incompleto']);
      if (!allowed.has(String(orden_estado))) throw new AppError('orden_estado inválido', 400);
      updates.orden_estado = orden_estado;
    }

    if (
      req.user!.rol === 'mecanico' &&
      prev.mecanico_tomo_at == null &&
      prev.orden_estado === 'pendiente_mecanico'
    ) {
      updates.mecanico_tomo_at = new Date().toISOString();
    }

    const { error } = await supabase.from('visitas_taller').update(updates).eq('id', req.params.id);
    if (error) {
      console.error('[mecanico] PATCH visitas_taller', req.params.id, error);
      throw new AppError('Error al actualizar visita', 500);
    }

    const nuevoOrdenEstado = updates.orden_estado as string | undefined;
    if (nuevoOrdenEstado === 'finalizado' && prev.orden_estado !== 'finalizado') {
      const { data: recipients } = await supabase
        .from('users')
        .select('id')
        .in('rol', ['vendedor', 'admin'])
        .eq('activo', true);
      const ids = (recipients || []).map((r) => r.id).filter(Boolean);
      const patente = (prev.vehiculos as { patente?: string } | null)?.patente || 'orden';
      if (ids.length) {
        await sendPushToUserIds(ids, 'Orden de trabajo finalizada', `${patente} — informe listo`);
      }
    }

    return res.json({ ok: true });
  } catch (e) { next(e); }
});

// DELETE /api/mecanico/visitas/:id — eliminar visita del mecánico
router.delete('/visitas/:id', requireRole('mecanico', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rawId = req.params.id;
    const visitaId = typeof rawId === 'string' ? rawId : rawId?.[0];
    if (!visitaId) throw new AppError('ID de visita inválido', 400);
    const mecanicoId = req.user!.id;

    const { data: visita, error: readErr } = await supabase
      .from('visitas_taller')
      .select('id, estado, mecanico_id')
      .eq('id', visitaId)
      .maybeSingle();
    if (readErr) throw new AppError('Error al buscar visita', 500);
    if (!visita) throw new AppError('Visita no encontrada', 404);
    if (String(visita.mecanico_id) !== String(mecanicoId)) throw new AppError('No autorizado', 403);
    if (visita.estado === 'entregado') {
      throw new AppError('No se puede eliminar una visita entregada', 400);
    }

    const datosAnteriores = { ...visita };

    const { error: delErr } = await supabase
      .from('visitas_taller')
      .delete()
      .eq('id', visitaId);
    if (delErr) throw new AppError('Error al eliminar visita', 500);

    await registrarAuditoria(req, {
      accion: 'eliminar_visita',
      entidad: 'visitas_taller',
      entidadId: visitaId,
      datosAnteriores,
      datosNuevos: null,
    });

    return res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/mecanico/visitas/:id/checklist — guardar respuestas
router.post('/visitas/:id/checklist', requireRole('mecanico', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { respuestas } = req.body as { respuestas: { item_id: string; estado: string; nota?: string }[] };
    if (!respuestas?.length) throw new AppError('Respuestas requeridas', 400);

    const visitaId = req.params.id;
    const estadosPermitidos = new Set(['ok', 'revisar', 'urgente']);
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const r of respuestas) {
      if (!r.item_id || !uuidRe.test(String(r.item_id))) {
        throw new AppError('Ítem de checklist inválido', 400);
      }
      if (!r.estado || !estadosPermitidos.has(String(r.estado))) {
        throw new AppError('Estado de checklist inválido', 400);
      }
    }

    const rows = respuestas.map((r) => ({
      visita_id: visitaId,
      item_id: r.item_id,
      estado: r.estado,
      nota: r.nota != null && String(r.nota).trim() !== '' ? String(r.nota).trim() : null,
    }));

    const { error } = await supabase
      .from('checklist_respuestas')
      .upsert(rows, { onConflict: 'visita_id,item_id' });
    if (error) {
      const err = error as { code?: string; message?: string };
      const missingUpdatedAt =
        err.code === '42703' && typeof err.message === 'string' && err.message.includes('updated_at');

      if (!missingUpdatedAt) {
        console.error('[mecanico] checklist_respuestas upsert', visitaId, error);
        throw new AppError('Error al guardar checklist', 500);
      }

      // Compatibilidad para entornos con schema viejo: evita UPDATE (trigger con updated_at roto)
      const itemIds = Array.from(new Set(rows.map((r) => r.item_id)));
      const { error: delErr } = await supabase
        .from('checklist_respuestas')
        .delete()
        .eq('visita_id', visitaId)
        .in('item_id', itemIds);
      if (delErr) {
        console.error('[mecanico] checklist_respuestas delete fallback', visitaId, delErr);
        throw new AppError('Error al guardar checklist', 500);
      }

      const { error: insertErr } = await supabase.from('checklist_respuestas').insert(rows);
      if (insertErr) {
        console.error('[mecanico] checklist_respuestas insert fallback', visitaId, insertErr);
        throw new AppError('Error al guardar checklist', 500);
      }
    }
    return res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/mecanico/visitas/:id/diagnostico — enviar email
router.post('/visitas/:id/diagnostico', requireRole('mecanico', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { data: visita } = await supabase
      .from('visitas_taller')
      .select(`*, vehiculos(patente, marca, modelo, anio, clientes(nombre, apellido, email))`)
      .eq('id', req.params.id)
      .single();

    if (!visita) throw new AppError('Visita no encontrada', 404);

    const cliente = (visita.vehiculos as any)?.clientes;
    const vehiculo = visita.vehiculos as any;
    const email = cliente?.email;
    if (!email) throw new AppError('El cliente no tiene email registrado', 400);

    const { data: respuestas } = await supabase
      .from('checklist_respuestas')
      .select(`*, checklist_items(descripcion)`)
      .eq('visita_id', req.params.id);

    const revisar = (respuestas || []).filter((r: any) => r.estado === 'revisar');
    const urgente = (respuestas || []).filter((r: any) => r.estado === 'urgente');
    const ok = (respuestas || []).filter((r: any) => r.estado === 'ok');

    const filaChecklist = (items: any[], color: string, label: string) =>
      items.map((r: any) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${(r.checklist_items as any)?.descripcion}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:${color}">${label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#666;font-size:13px">${r.nota || ''}</td>
        </tr>`).join('');

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#1F1F1F;padding:24px;border-radius:12px 12px 0 0">
          <h2 style="color:white;margin:0;font-size:20px">Diagnóstico de tu vehículo</h2>
          <p style="color:#aaa;margin:4px 0 0">Martínez Neumáticos</p>
        </div>
        <div style="background:#f9f9f9;padding:24px">
          <p style="margin:0 0 8px">Hola <strong>${cliente?.nombre} ${cliente?.apellido}</strong>,</p>
          <p style="margin:0 0 20px;color:#444">Te enviamos el diagnóstico de tu <strong>${vehiculo?.marca} ${vehiculo?.modelo}</strong> (${vehiculo?.patente}).</p>

          ${urgente.length > 0 ? `
          <div style="background:#fff1f0;border:1px solid #ffd5d5;border-radius:8px;padding:12px 16px;margin-bottom:16px">
            <p style="color:#C8102E;font-weight:bold;margin:0 0 4px">⚠ Atención urgente</p>
            <p style="color:#666;font-size:13px;margin:0">Los siguientes puntos requieren atención inmediata.</p>
          </div>` : ''}

          <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
            <thead>
              <tr style="background:#f0f0f0">
                <th style="padding:10px 12px;text-align:left;font-size:13px;color:#666">Ítem</th>
                <th style="padding:10px 12px;text-align:left;font-size:13px;color:#666">Estado</th>
                <th style="padding:10px 12px;text-align:left;font-size:13px;color:#666">Observación</th>
              </tr>
            </thead>
            <tbody>
              ${filaChecklist(urgente, '#C8102E', '🔴 URGENTE')}
              ${filaChecklist(revisar, '#b45309', '⚠ REVISAR')}
              ${filaChecklist(ok, '#16a34a', '✓ OK')}
            </tbody>
          </table>

          ${visita.observaciones ? `
          <div style="margin-top:20px;background:white;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
            <p style="font-weight:bold;margin:0 0 8px;color:#333">Observaciones del mecánico</p>
            <p style="margin:0;color:#555;line-height:1.6">${visita.observaciones}</p>
          </div>` : ''}

          <p style="margin-top:24px;color:#888;font-size:13px">Para consultas llamanos o visitanos. ¡Gracias por confiar en Martínez Neumáticos!</p>
        </div>
      </div>`;

    if (!resend) throw new AppError('Email no configurado', 500);

    await resend.emails.send({
      from: 'Martinez Neumáticos <onboarding@resend.dev>',
      to: email,
      subject: `Diagnóstico de tu ${vehiculo?.marca} ${vehiculo?.modelo} — Martínez Neumáticos`,
      html,
    });

    await supabase.from('visitas_taller').update({ diagnostico_enviado: true, estado: 'listo' }).eq('id', req.params.id);

    return res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
