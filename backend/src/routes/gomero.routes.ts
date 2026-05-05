import { Router, Response, NextFunction } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { normalizePatenteAr } from '../utils/patente';
import type { AuthRequest } from '../middleware/auth.middleware';
import { sendPushToUserIds } from '../services/push-send.service';

const router = Router();
router.use(authMiddleware);

async function obtenerMecanicoDestino(mecanicoIdBody: string | undefined): Promise<string> {
  if (mecanicoIdBody && /^[0-9a-f-]{36}$/i.test(mecanicoIdBody)) {
    const { data: u } = await supabase
      .from('users')
      .select('id')
      .eq('id', mecanicoIdBody)
      .eq('rol', 'mecanico')
      .eq('activo', true)
      .maybeSingle();
    if (u?.id) return u.id;
  }
  const { data: first } = await supabase
    .from('users')
    .select('id')
    .eq('rol', 'mecanico')
    .eq('activo', true)
    .limit(1)
    .maybeSingle();
  if (!first?.id) throw new AppError('No hay ningún mecánico activo en el sistema.', 400);
  return first.id;
}

// ─── Vehículos (mismo contrato que /mecanico para patente / alta) ───────────

router.get('/vehiculos/sugerencias', requireRole('gomero', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
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
  } catch (e) {
    next(e);
  }
});

router.get('/vehiculos/buscar/:patente', requireRole('gomero', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const param = req.params.patente;
    let rawPat = typeof param === 'string' ? param : Array.isArray(param) ? param[0] || '' : '';
    try {
      rawPat = decodeURIComponent(rawPat.replace(/\+/g, '%20'));
    } catch {
      /* vacío */
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
  } catch (e) {
    next(e);
  }
});

router.post('/vehiculos', requireRole('gomero', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { patente: patenteRaw, marca, modelo, anio, medida_rueda, cliente_id, cliente } = req.body;
    const patente = normalizePatenteAr(String(patenteRaw || ''));
    if (!patente || !marca || !modelo) throw new AppError('Patente, marca y modelo requeridos', 400);

    let clienteId = cliente_id;

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
        .select()
        .single();
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
  } catch (e) {
    next(e);
  }
});

router.patch('/vehiculos/:vehiculoId', requireRole('gomero', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
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
      const { error: linkErr } = await supabase.from('vehiculos').update({ cliente_id: clienteId }).eq('id', vehiculoId);
      if (linkErr) throw new AppError('Error al vincular cliente al vehículo', 500);
    }

    const { data: out, error: outErr } = await supabase
      .from('vehiculos')
      .select('*, clientes(id, nombre, apellido, telefono, email)')
      .eq('id', vehiculoId)
      .single();
    if (outErr) throw new AppError('Error al leer vehículo', 500);
    return res.json({ vehiculo: out });
  } catch (e) {
    next(e);
  }
});

// ─── Órdenes (visitas_taller) ────────────────────────────────────────────────

router.get('/ordenes', requireRole('gomero', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 50));
    const offset = Math.max(0, Number(req.query.offset) || 0);

    let q = supabase
      .from('visitas_taller')
      .select(`*, vehiculos(patente, marca, modelo, clientes(nombre, apellido))`, { count: 'exact' });

    if (req.user!.rol !== 'admin') {
      q = q.eq('gomero_id', req.user!.id);
    } else {
      const g = String(req.query.gomero_id || '').trim();
      if (g && /^[0-9a-f-]{36}$/i.test(g)) q = q.eq('gomero_id', g);
    }

    const { data, error, count } = await q.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    if (error) throw new AppError('Error al obtener órdenes', 500);
    return res.json({ ordenes: data || [], total: count || 0, limit, offset });
  } catch (e) {
    next(e);
  }
});

router.post('/ordenes', requireRole('gomero', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { vehiculo_id, gomero_id: gomeroAdminBody } = req.body;
    if (!vehiculo_id) throw new AppError('vehiculo_id requerido', 400);

    let gomeroId = req.user!.id;
    if (req.user!.rol === 'admin') {
      const gid = typeof gomeroAdminBody === 'string' ? gomeroAdminBody.trim() : '';
      if (!gid || !/^[0-9a-f-]{36}$/i.test(gid)) {
        throw new AppError('gomero_id requerido (admin)', 400);
      }
      const { data: guser } = await supabase
        .from('users')
        .select('id')
        .eq('id', gid)
        .eq('rol', 'gomero')
        .eq('activo', true)
        .maybeSingle();
      if (!guser) throw new AppError('Gomero no encontrado o inactivo', 400);
      gomeroId = gid;
    }

    const { data, error } = await supabase
      .from('visitas_taller')
      .insert({
        vehiculo_id,
        gomero_id: gomeroId,
        mecanico_id: null,
        orden_estado: 'pendiente_gomero',
        estado: 'en_revision',
        estado_visita: 'abierta',
      })
      .select(`*, vehiculos(patente, marca, modelo, clientes(nombre, apellido))`)
      .single();

    if (error) throw new AppError('Error al crear orden', 500);
    return res.status(201).json({ orden: data });
  } catch (e) {
    next(e);
  }
});

router.patch('/ordenes/:id', requireRole('gomero', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const { data: row, error: rErr } = await supabase
      .from('visitas_taller')
      .select('id, gomero_id, orden_estado')
      .eq('id', id)
      .single();
    if (rErr || !row) throw new AppError('Orden no encontrada', 404);
    if (row.gomero_id !== req.user!.id && req.user!.rol !== 'admin') {
      throw new AppError('No autorizado', 403);
    }
    if (row.orden_estado !== 'pendiente_gomero') {
      throw new AppError('Esta orden ya fue enviada o cerrada.', 400);
    }

    const {
      neumaticos_cambiados,
      km,
      marca_neumatico,
      medida_neumatico,
      presion_psi,
      observaciones_gomero,
    } = req.body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (neumaticos_cambiados !== undefined) updates.neumaticos_cambiados = Boolean(neumaticos_cambiados);
    if (km !== undefined) updates.km = km == null || km === '' ? null : Number(km);
    if (marca_neumatico !== undefined) updates.marca_neumatico = marca_neumatico || null;
    if (medida_neumatico !== undefined) updates.medida_neumatico = medida_neumatico || null;
    if (observaciones_gomero !== undefined) updates.observaciones_gomero = observaciones_gomero || null;

    if (presion_psi !== undefined) {
      if (presion_psi == null || presion_psi === '') {
        updates.presion_psi = null;
      } else {
        const n = Number(String(presion_psi).replace(',', '.'));
        updates.presion_psi = Number.isFinite(n) ? n : null;
      }
    }

    const { error } = await supabase.from('visitas_taller').update(updates).eq('id', id);
    if (error) throw new AppError('Error al actualizar orden', 500);
    return res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post('/ordenes/:id/enviar-mecanico', requireRole('gomero', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const mecanicoIdBody = req.body?.mecanico_id as string | undefined;

    const { data: row, error: rErr } = await supabase
      .from('visitas_taller')
      .select('id, gomero_id, orden_estado, vehiculos(patente)')
      .eq('id', id)
      .single();

    if (rErr || !row) throw new AppError('Orden no encontrada', 404);
    if (row.gomero_id !== req.user!.id && req.user!.rol !== 'admin') {
      throw new AppError('No autorizado', 403);
    }
    if (row.orden_estado !== 'pendiente_gomero') {
      throw new AppError('La orden no está pendiente de la parte gomería.', 400);
    }

    const mecanicoId = await obtenerMecanicoDestino(mecanicoIdBody);

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('visitas_taller')
      .update({
        orden_estado: 'pendiente_mecanico',
        mecanico_id: mecanicoId,
        enviado_al_mecanico_at: now,
        updated_at: now,
      })
      .eq('id', id);

    if (error) throw new AppError('Error al enviar la orden', 500);

    const patente = (row.vehiculos as { patente?: string } | null)?.patente || 'vehículo';
    await sendPushToUserIds(
      [mecanicoId],
      'Nueva orden de trabajo',
      `Te enviaron una orden — ${patente}`
    );

    return res.json({ ok: true, mecanico_id: mecanicoId });
  } catch (e) {
    next(e);
  }
});

router.get('/ordenes/:id', requireRole('gomero', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('visitas_taller')
      .select(`*, vehiculos(patente, marca, modelo, anio, medida_rueda, clientes(nombre, apellido, email, telefono))`)
      .eq('id', req.params.id)
      .single();

    if (error || !data) throw new AppError('Orden no encontrada', 404);
    if (req.user!.rol !== 'admin' && data.gomero_id !== req.user!.id) {
      throw new AppError('No autorizado', 403);
    }

    return res.json({ orden: data });
  } catch (e) {
    next(e);
  }
});

export default router;
