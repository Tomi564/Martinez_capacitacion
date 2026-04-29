import { Router, Response, NextFunction } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { supabase } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import type { AuthRequest } from '../middleware/auth.middleware';
import { Resend } from 'resend';

const router = Router();
router.use(authMiddleware);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// ─── Clientes ───────────────────────────────────────────────────────────────

// GET /api/mecanico/clientes — lista para admin/vendedor
router.get('/clientes', requireRole('admin', 'vendedor'), async (req, res: Response, next: NextFunction) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const { data, error, count } = await supabase
      .from('vehiculos')
      .select(
        `id, patente, marca, modelo, anio, medida_rueda, created_at, clientes(id, nombre, apellido, dni, telefono, email), visitas_taller(id, estado, motivo, observaciones, km, diagnostico_enviado, created_at)`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new AppError('Error al obtener vehículos', 500);
    return res.json({
      vehiculos: data || [],
      total: count || 0,
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
router.get('/vehiculos/sugerencias', requireRole('mecanico', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 3) {
      return res.json({ vehiculos: [] });
    }

    const { data, error } = await supabase
      .from('vehiculos')
      .select(`id, patente, marca, modelo, anio, medida_rueda, clientes(id, nombre, apellido, telefono, email)`)
      .or(`patente.ilike.%${q}%,marca.ilike.%${q}%,modelo.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) throw new AppError('Error al buscar sugerencias de vehículos', 500);
    return res.json({ vehiculos: data || [] });
  } catch (e) { next(e); }
});

// GET /api/mecanico/vehiculos/buscar/:patente
router.get('/vehiculos/buscar/:patente', requireRole('mecanico', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patente = (req.params.patente as string).toUpperCase();
    const { data, error } = await supabase
      .from('vehiculos')
      .select(`*, clientes(id, nombre, apellido, dni, telefono, email)`)
      .eq('patente', patente)
      .maybeSingle();
    if (error) throw new AppError('Error al buscar', 500);
    return res.json({ vehiculo: data });
  } catch (e) { next(e); }
});

// POST /api/mecanico/vehiculos — crear vehículo (y cliente si viene)
router.post('/vehiculos', requireRole('mecanico', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { patente, marca, modelo, anio, medida_rueda, cliente_id, cliente } = req.body;
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
      .insert({ patente: patente.toUpperCase(), marca, modelo, anio: anio || null, medida_rueda: medida_rueda || null, cliente_id: clienteId || null })
      .select(`*, clientes(id, nombre, apellido, telefono, email)`)
      .single();
    if (error) throw new AppError('Error al crear vehículo', 500);
    return res.status(201).json({ vehiculo: data });
  } catch (e) { next(e); }
});

// ─── Visitas ─────────────────────────────────────────────────────────────────

// GET /api/mecanico/visitas — visitas de hoy del mecánico
router.get('/visitas', requireRole('mecanico', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const mecanicoId = req.user!.id;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const offset = Math.max(0, Number(req.query.offset) || 0);

    const { data, error, count } = await supabase
      .from('visitas_taller')
      .select(`*, vehiculos(patente, marca, modelo, clientes(nombre, apellido))`, { count: 'exact' })
      .eq('mecanico_id', mecanicoId)
      .gte('created_at', hoy.toISOString())
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
        mecanico_id: req.user!.id,
        motivo: motivo || null,
        observaciones: observaciones || null,
        estado_neumaticos: estado_neumaticos || null,
        estado_frenos: estado_frenos || null,
        presion_psi: presion_psi != null ? Number(presion_psi) : null,
        recomendacion: recomendacion || null,
        estado_visita: 'abierta',
        km: km || null,
        estado: 'en_revision'
      })
      .select(`*, vehiculos(patente, marca, modelo, clientes(nombre, apellido, email))`)
      .single();
    if (error) throw new AppError('Error al crear visita', 500);
    return res.status(201).json({ visita: data });
  } catch (e) { next(e); }
});

// GET /api/mecanico/visitas/:id — detalle de visita con checklist
router.get('/visitas/:id', requireRole('mecanico', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    } = req.body;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (estado) updates.estado = estado;
    if (observaciones !== undefined) updates.observaciones = observaciones;
    if (estado_neumaticos !== undefined) updates.estado_neumaticos = estado_neumaticos || null;
    if (estado_frenos !== undefined) updates.estado_frenos = estado_frenos || null;
    if (presion_psi !== undefined) updates.presion_psi = presion_psi != null ? Number(presion_psi) : null;
    if (recomendacion !== undefined) updates.recomendacion = recomendacion || null;
    if (estado_visita !== undefined) updates.estado_visita = estado_visita;
    const { error } = await supabase.from('visitas_taller').update(updates).eq('id', req.params.id);
    if (error) throw new AppError('Error al actualizar visita', 500);
    return res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/mecanico/visitas/:id/checklist — guardar respuestas
router.post('/visitas/:id/checklist', requireRole('mecanico', 'admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { respuestas } = req.body as { respuestas: { item_id: string; estado: string; nota?: string }[] };
    if (!respuestas?.length) throw new AppError('Respuestas requeridas', 400);

    const visitaId = req.params.id;
    const rows = respuestas.map(r => ({ visita_id: visitaId, item_id: r.item_id, estado: r.estado, nota: r.nota || null }));

    const { error } = await supabase
      .from('checklist_respuestas')
      .upsert(rows, { onConflict: 'visita_id,item_id' });
    if (error) throw new AppError('Error al guardar checklist', 500);
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
