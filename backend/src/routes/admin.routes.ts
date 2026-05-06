/**
 * admin.routes.ts — Rutas del panel de administración
 *
 * Todas las rutas requieren autenticación Y rol admin.
 */

import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import { supabase } from '../config/database';
import { WHATSAPP_SUGERENCIAS } from '../config/whatsapp';
import { enviarPushComunicado } from '../services/comunicados-scheduler.service';
import { preguntasDiariasService } from '../services/preguntas-diarias.service';

const router = Router();

const registrarAuditoria = async (
  req: any,
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
  await supabase.rpc('registrar_auditoria_operacional', {
    p_usuario_id: user.id,
    p_rol: user.rol || 'admin',
    p_accion: payload.accion,
    p_entidad: payload.entidad,
    p_entidad_id: payload.entidadId || null,
    p_datos_anteriores: (payload.datosAnteriores ?? null) as any,
    p_datos_nuevos: (payload.datosNuevos ?? null) as any,
  });
};

// Todas las rutas admin requieren autenticación y rol admin
router.use(authMiddleware);
router.use(requireRole('admin'));

// ─────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────

// GET /api/admin/auditoria (y variante con barra final por compatibilidad con proxies)
router.get('/auditoria', adminController.getAuditoria.bind(adminController));
router.get('/auditoria/', adminController.getAuditoria.bind(adminController));

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

// GET /api/admin/reportes/csv?tipo=progreso|calificaciones
router.get(
  '/reportes/csv',
  adminController.getReportesCsv.bind(adminController)
);

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

// DELETE /api/admin/modulos/:id/preguntas/:preguntaId — elimina permanentemente
router.delete('/modulos/:id/preguntas/:preguntaId', async (req, res, next) => {
  try {
    const { preguntaId } = req.params;

    const { error } = await supabase
      .from('preguntas')
      .delete()
      .eq('id', preguntaId);

    if (error) throw new Error('Error al eliminar la pregunta');

    return res.status(200).json({ mensaje: 'Pregunta eliminada' });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/vendedores/:id
router.get(
  '/vendedores/:id',
  adminController.getVendedorById.bind(adminController)
);

// PATCH /api/admin/vendedores/:id/reset-password
router.patch(
  '/vendedores/:id/reset-password',
  adminController.resetPasswordVendedor.bind(adminController)
);

// POST /api/admin/vendedores/:id/reset-progreso
router.post(
  '/vendedores/:id/reset-progreso',
  adminController.resetProgresoVendedor.bind(adminController)
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
router.get('/notificaciones', async (_req, res, next) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(_req.query.limit) || 50));
    const offset = Math.max(0, Number(_req.query.offset) || 0);
    const { data, error } = await supabase
      .from('notificaciones_admin')
      .select(`
        id, user_id, modulo_id, tipo, titulo, mensaje, leida, created_at,
        users (nombre, apellido, email),
        modulos (titulo, orden)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error('Error al obtener notificaciones');

    const { data: noLeidasRpc, error: noLeidasError } = await supabase.rpc('admin_notificaciones_no_leidas_count');
    if (noLeidasError) throw new Error('Error al obtener conteo de no leídas');

    const noLeidas = Number(noLeidasRpc || 0);

    return res.status(200).json({
      notificaciones: data || [],
      noLeidas,
      limit,
      offset,
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

    // Calificaciones QR promedio por vendedor (para determinar nivel élite)
    const { data: calificaciones } = await supabase
      .from('calificaciones_qr')
      .select('vendedor_id, estrellas, estrellas_vendedor');

    const getPromedioQR = (userId: string) => {
      const cals = (calificaciones || []).filter(c => c.vendedor_id === userId);
      if (!cals.length) return 0;
      return cals.reduce((acc, c: any) => acc + (c.estrellas_vendedor ?? c.estrellas ?? 0), 0) / cals.length;
    };

    const getNivel = (userId: string) => {
      const progVendedor = (progresos || []).filter(p => p.user_id === userId);
      const aprobados = progVendedor.filter(p => p.estado === 'aprobado');
      const totalAprobados = aprobados.length;

      // Élite: completó todos los módulos Y promedio QR ≥ 4.5
      if (totalAprobados >= totalModulos && getPromedioQR(userId) >= 4.5) return 'elite';
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
      profesional: { label: 'Élite',       requisito: 'Completá todos los módulos y alcanzá un promedio de calificaciones QR ≥4.5' },
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
// Vendedores que llevan más de 3 días sin avanzar (o nunca empezaron)
router.get('/inactivos', async (_req, res, next) => {
  try {
    // Traer todos los vendedores activos
    const { data: vendedores, error: errV } = await supabase
      .from('users')
      .select('id, nombre, apellido, email')
      .eq('rol', 'vendedor')
      .eq('activo', true);

    if (errV) throw new Error('Error al obtener vendedores');

    if (!vendedores?.length) {
      return res.status(200).json({ inactivos: [] });
    }

    // Traer el último intento de cada vendedor
    const { data: progresos } = await supabase
      .from('progreso')
      .select('user_id, ultimo_intento')
      .in('user_id', vendedores.map(v => v.id));

    const ahora = new Date();
    const DIAS_LIMITE = 3;

    const inactivos = vendedores
      .map(v => {
        const intentos = (progresos || []).filter(p => p.user_id === v.id);
        const fechas = intentos
          .map(p => p.ultimo_intento)
          .filter(Boolean)
          .sort()
          .reverse();

        const ultimoIntento = fechas[0] || null;

        if (!ultimoIntento) {
          // Nunca empezó
          return { ...v, ultimo_intento: null, dias_inactivo: null };
        }

        const diasTranscurridos = Math.floor(
          (ahora.getTime() - new Date(ultimoIntento).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diasTranscurridos >= DIAS_LIMITE) {
          return { ...v, ultimo_intento: ultimoIntento, dias_inactivo: diasTranscurridos };
        }
        return null;
      })
      .filter(Boolean);

    return res.status(200).json({ inactivos });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────
// Comunicados
// ─────────────────────────────────────────────────────

// GET /api/admin/comunicados
router.get('/comunicados', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('comunicados')
      .select('id, titulo, contenido, activo, created_at, programado_para')
      .order('created_at', { ascending: false });
    if (error) throw new Error('Error al obtener comunicados');
    return res.status(200).json({ comunicados: data || [] });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/comunicados — inmediato o programado (programado_para ISO futuro)
router.post('/comunicados', async (req, res, next) => {
  try {
    const { titulo, contenido, programado_para: programadoRaw } = req.body;
    if (!titulo?.trim() || !contenido?.trim()) {
      return res.status(400).json({ error: 'Título y contenido son requeridos' });
    }

    let programadoPara: string | null = null;
    if (programadoRaw) {
      const d = new Date(programadoRaw);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ error: 'Fecha de programación inválida' });
      }
      programadoPara = d.toISOString();
    }

    const ahora = Date.now();
    const esFuturo = programadoPara && new Date(programadoPara).getTime() > ahora;

    if (esFuturo) {
      const { data, error } = await supabase
        .from('comunicados')
        .insert({
          titulo: titulo.trim(),
          contenido: contenido.trim(),
          activo: false,
          programado_para: programadoPara,
        })
        .select()
        .single();
      if (error) throw new Error('Error al crear comunicado programado');

      await registrarAuditoria(req, {
        accion: 'programar_comunicado',
        entidad: 'comunicado',
        entidadId: data?.id || null,
        datosAnteriores: null,
        datosNuevos: data || null,
      });

      return res.status(201).json({ comunicado: data });
    }

    await supabase.from('comunicados').update({ activo: false }).eq('activo', true);

    const { data, error } = await supabase
      .from('comunicados')
      .insert({
        titulo: titulo.trim(),
        contenido: contenido.trim(),
        activo: true,
        programado_para: null,
      })
      .select()
      .single();
    if (error) throw new Error('Error al crear comunicado');

    await registrarAuditoria(req, {
      accion: 'publicar_comunicado',
      entidad: 'comunicado',
      entidadId: data?.id || null,
      datosAnteriores: null,
      datosNuevos: data || null,
    });

    await enviarPushComunicado(titulo.trim(), contenido.trim());

    return res.status(201).json({ comunicado: data });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/comunicados/:id
router.delete('/comunicados/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: anterior } = await supabase
      .from('comunicados')
      .select('id, titulo, contenido, activo, created_at, programado_para')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase.from('comunicados').delete().eq('id', id);
    if (error) throw new Error('Error al eliminar comunicado');

    await registrarAuditoria(req, {
      accion: 'eliminar_comunicado',
      entidad: 'comunicado',
      entidadId: id,
      datosAnteriores: anterior || null,
      datosNuevos: null,
    });

    return res.status(200).json({ mensaje: 'Comunicado eliminado' });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/comunicados/:id — activo, texto, fecha programada
router.patch('/comunicados/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { activo, titulo, contenido, programado_para: programadoRaw } = req.body;

    const { data: anterior } = await supabase
      .from('comunicados')
      .select('id, titulo, contenido, activo, created_at, programado_para')
      .eq('id', id)
      .maybeSingle();
    if (!anterior) {
      return res.status(404).json({ error: 'Comunicado no encontrado' });
    }

    const updates: Record<string, unknown> = {};

    if (typeof titulo === 'string' && titulo.trim()) updates.titulo = titulo.trim();
    if (typeof contenido === 'string' && contenido.trim()) updates.contenido = contenido.trim();

    if ('programado_para' in req.body) {
      if (programadoRaw === null || programadoRaw === '') {
        updates.programado_para = null;
      } else {
        const d = new Date(programadoRaw);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ error: 'programado_para inválido' });
        }
        updates.programado_para = d.toISOString();
      }
    }

    if (typeof activo === 'boolean') {
      if (activo === true) {
        await supabase.from('comunicados').update({ activo: false }).eq('activo', true);
        updates.activo = true;
        updates.programado_para = null;
      } else {
        updates.activo = false;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No hay cambios válidos' });
    }

    const { error: upErr } = await supabase.from('comunicados').update(updates).eq('id', id);
    if (upErr) throw new Error('Error al actualizar comunicado');

    const { data: nuevo } = await supabase
      .from('comunicados')
      .select('id, titulo, contenido, activo, created_at, programado_para')
      .eq('id', id)
      .maybeSingle();

    await registrarAuditoria(req, {
      accion: 'editar_comunicado',
      entidad: 'comunicado',
      entidadId: id,
      datosAnteriores: anterior,
      datosNuevos: nuevo,
    });

    if (updates.activo === true) {
      await enviarPushComunicado(nuevo?.titulo ?? '', nuevo?.contenido ?? '');
    }

    return res.status(200).json({ comunicado: nuevo, mensaje: 'Comunicado actualizado' });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/notificaciones-ranking
router.get('/notificaciones-ranking', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const { data, error } = await supabase
      .from('ranking_notificaciones_log')
      .select(`
        id, tipo, titulo, cuerpo, payload, created_at,
        users!ranking_notificaciones_log_user_id_fkey(nombre, apellido)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error('Error al obtener notificaciones de ranking');
    return res.status(200).json({ notificaciones: data || [] });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────
// Objetivos
// ─────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────
// Visitas de mecánicos (admin)
// ─────────────────────────────────────────────────────

// GET /api/admin/visitas?fecha=YYYY-MM-DD&mecanico_id=uuid
router.get('/visitas', async (req, res, next) => {
  try {
    const fecha = (req.query.fecha as string) || '';
    const mecanicoId = (req.query.mecanico_id as string) || '';
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const offset = Math.max(0, Number(req.query.offset) || 0);

    let query = supabase
      .from('visitas_taller')
      .select(`
        id, created_at, estado, estado_visita, motivo, observaciones, updated_at, updated_by_admin_at, updated_by_admin_id,
        vehiculos(patente, marca, modelo, clientes(nombre, apellido)),
        users!visitas_taller_mecanico_id_fkey(id, nombre, apellido)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (mecanicoId) {
      query = query.eq('mecanico_id', mecanicoId);
    }
    if (fecha) {
      const inicio = new Date(`${fecha}T00:00:00.000Z`).toISOString();
      const fin = new Date(`${fecha}T23:59:59.999Z`).toISOString();
      query = query.gte('created_at', inicio).lte('created_at', fin);
    }

    const { data, error, count } = await query;
    if (error) throw new Error('Error al obtener visitas');
    return res.status(200).json({
      visitas: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
});

/** Contador SLA: pendiente_mecanico, sin tomar, enviada hace más de 2 h. */
router.get('/taller/ordenes-mecanico-retrasadas-count', async (req, res, next) => {
  try {
    const limite = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from('visitas_taller')
      .select('id', { count: 'exact', head: true })
      .eq('orden_estado', 'pendiente_mecanico')
      .is('mecanico_tomo_at', null)
      .not('enviado_al_mecanico_at', 'is', null)
      .lt('enviado_al_mecanico_at', limite);
    if (error) throw error;
    return res.status(200).json({ count: count ?? 0 });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/visitas/:id
router.get('/visitas/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('visitas_taller')
      .select(`
        id, created_at, estado_visita, motivo, observaciones, presion_psi, updated_by_admin_at,
        tren_delantero, tren_alineado, tren_balanceo, amortiguadores_revisados, auxilio_revisado, presupuesto, fotos_neumatico_urls,
        vehiculos(patente, marca, modelo, clientes(nombre, apellido))
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error('Error al obtener visita');
    return res.status(200).json({ visita: data });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/visitas/:id
router.patch('/visitas/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      observaciones,
      presion_psi,
      estado_visita,
      tren_delantero,
      tren_alineado,
      tren_balanceo,
      amortiguadores_revisados,
      auxilio_revisado,
      presupuesto,
      fotos_neumatico_urls,
    } = req.body;

    const { data: antes } = await supabase
      .from('visitas_taller')
      .select('id, estado_visita, observaciones, presion_psi, tren_delantero, tren_alineado, tren_balanceo, amortiguadores_revisados, auxilio_revisado, presupuesto, fotos_neumatico_urls, updated_at')
      .eq('id', id)
      .single();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by_admin_at: new Date().toISOString(),
      updated_by_admin_id: (req as any).user?.id,
    };

    if (observaciones !== undefined) updates.observaciones = observaciones || null;
    if (presion_psi !== undefined) updates.presion_psi = presion_psi != null ? Number(presion_psi) : null;
    if (estado_visita !== undefined) updates.estado_visita = estado_visita;
    if (tren_delantero !== undefined) updates.tren_delantero = tren_delantero || null;
    if (tren_alineado !== undefined) updates.tren_alineado = tren_alineado;
    if (tren_balanceo !== undefined) updates.tren_balanceo = tren_balanceo;
    if (amortiguadores_revisados !== undefined) updates.amortiguadores_revisados = amortiguadores_revisados;
    if (auxilio_revisado !== undefined) updates.auxilio_revisado = auxilio_revisado;
    if (presupuesto !== undefined) updates.presupuesto = presupuesto || null;
    if (fotos_neumatico_urls !== undefined) {
      updates.fotos_neumatico_urls = Array.isArray(fotos_neumatico_urls) ? fotos_neumatico_urls : null;
    }

    const { error } = await supabase
      .from('visitas_taller')
      .update(updates)
      .eq('id', id);
    if (error) throw new Error('Error al actualizar visita');

    const { data: despues } = await supabase
      .from('visitas_taller')
      .select('id, estado_visita, observaciones, presion_psi, tren_delantero, tren_alineado, tren_balanceo, amortiguadores_revisados, auxilio_revisado, presupuesto, fotos_neumatico_urls, updated_at')
      .eq('id', id)
      .single();

    await registrarAuditoria(req, {
      accion: estado_visita === 'cerrada' ? 'cerrar_visita' : 'editar_visita',
      entidad: 'visita',
      entidadId: id,
      datosAnteriores: antes || null,
      datosNuevos: despues || null,
    });

    return res.status(200).json({ mensaje: 'Visita actualizada' });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/vendedores/:id/objetivo
router.post('/vendedores/:id/objetivo', async (req, res, next) => {
  try {
    const vendedorId = req.params.id as string;
    const { mes, anio, meta_ventas, meta_conversion } = req.body;

    if (!mes || !anio) {
      return res.status(400).json({ error: 'mes y anio son requeridos' });
    }

    const { error } = await supabase
      .from('objetivos')
      .upsert(
        {
          user_id: vendedorId,
          mes: Number(mes),
          anio: Number(anio),
          meta_ventas: meta_ventas ? Number(meta_ventas) : 0,
          meta_conversion: meta_conversion ? Number(meta_conversion) : 0,
        },
        { onConflict: 'user_id,mes,anio' }
      );

    if (error) throw new Error('Error al guardar objetivo');
    return res.status(200).json({ mensaje: 'Objetivo guardado correctamente' });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/vendedores/:id/objetivo
router.get('/vendedores/:id/objetivo', async (req, res, next) => {
  try {
    const vendedorId = req.params.id as string;
    const ahora = new Date();
    const mes = ahora.getMonth() + 1;
    const anio = ahora.getFullYear();

    const { data } = await supabase
      .from('objetivos')
      .select('meta_ventas, meta_conversion, mes, anio')
      .eq('user_id', vendedorId)
      .eq('mes', mes)
      .eq('anio', anio)
      .maybeSingle();

    return res.status(200).json({ objetivo: data || null });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────
// Sugerencias al desarrollador
// ─────────────────────────────────────────────────────

// GET /api/admin/sugerencias
router.get('/sugerencias', async (_req, res, next) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(_req.query.limit) || 20));
    const offset = Math.max(0, Number(_req.query.offset) || 0);
    const { data, error, count } = await supabase
      .from('sugerencias_dev')
      .select('id, texto, estado, created_at, rol, user_id', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error('Error al obtener sugerencias');
    return res.status(200).json({
      sugerencias: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/sugerencias
router.post('/sugerencias', async (req, res, next) => {
  try {
    const { texto } = req.body;
    if (!texto?.trim()) {
      return res.status(400).json({ error: 'El texto es requerido' });
    }
    const uid = (req as any).user?.id || null;
    const rol = (req as any).user?.rol || 'admin';
    const { data, error } = await supabase
      .from('sugerencias_dev')
      .insert({ texto: texto.trim(), estado: 'pendiente', user_id: uid, rol })
      .select()
      .single();
    if (error) throw new Error('Error al guardar sugerencia');

    const usuario = (req as any).user as { nombre?: string; apellido?: string } | undefined;
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
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/sugerencias/:id
router.patch('/sugerencias/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const estadosValidos = ['pendiente', 'visto', 'en_progreso', 'listo'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    await supabase.from('sugerencias_dev').update({ estado }).eq('id', id);
    return res.status(200).json({ mensaje: 'Estado actualizado' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/sugerencias/:id
router.delete('/sugerencias/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await supabase.from('sugerencias_dev').delete().eq('id', id);
    return res.status(200).json({ mensaje: 'Sugerencia eliminada' });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────
// Estadísticas para gráficos
// GET /api/admin/estadisticas
// ─────────────────────────────────────────────────────
router.get('/estadisticas', async (_req, res, next) => {
  try {
    const [{ data: ventasPorSemana, error: ventasPorSemanaError }, { data: montoPorMes, error: montoPorMesError }] =
      await Promise.all([
        supabase.rpc('admin_estadisticas_ventas_por_semana', { p_weeks: 8 }),
        supabase.rpc('admin_estadisticas_monto_por_mes', { p_months: 6 }),
      ]);

    if (ventasPorSemanaError) throw new Error('Error al obtener ventas por semana');
    if (montoPorMesError) throw new Error('Error al obtener monto por mes');

    const [
      { data: atenciones },
      { data: vendedores },
      { data: progresos },
      { data: modulos },
    ] = await Promise.all([
      supabase.from('atenciones').select('user_id, resultado, monto, created_at'),
      supabase.from('users').select('id, nombre, apellido').eq('rol', 'vendedor').eq('activo', true),
      supabase.from('progreso').select('user_id, modulo_id, estado, mejor_nota'),
      supabase.from('modulos').select('id, titulo, orden').eq('activo', true).order('orden'),
    ]);

    const todasAtenciones = atenciones || [];
    const todosVendedores = vendedores || [];

    // ── 2. Módulos: aprobados vs reprobados ──
    const moduloStats = (modulos || []).map((m) => {
      const progresosModulo = (progresos || []).filter((p) => p.modulo_id === m.id);
      const aprobados = progresosModulo.filter((p) => p.estado === 'aprobado').length;
      const reprobados = progresosModulo.filter(
        (p) => p.estado !== 'aprobado' && p.mejor_nota !== null && (p.mejor_nota || 0) > 0
      ).length;
      return {
        modulo: `M${m.orden}`,
        titulo: m.titulo,
        aprobados,
        reprobados,
      };
    });

    // ── 3. Tasa de conversión por vendedor ──
    const conversionPorVendedor = todosVendedores.map((v) => {
      const atenc = todasAtenciones.filter((a) => a.user_id === v.id);
      const ventas = atenc.filter((a) => a.resultado === 'venta_cerrada').length;
      const tasa = atenc.length > 0 ? Math.round((ventas / atenc.length) * 100) : 0;
      return {
        nombre: v.nombre,
        tasa,
        ventas,
        total: atenc.length,
      };
    }).sort((a, b) => b.tasa - a.tasa);

    return res.status(200).json({
      ventasPorSemana: ventasPorSemana || [],
      moduloStats,
      conversionPorVendedor,
      montoPorMes: montoPorMes || [],
    });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────
// Preguntas diarias (post-capacitación)
// ─────────────────────────────────────────────────────

router.get('/preguntas-diarias/respuestas', async (req, res, next) => {
  try {
    const result = await preguntasDiariasService.listRespuestasAdmin({
      vendedor_id: (req.query.vendedor_id as string) || undefined,
      fecha: (req.query.fecha as string) || undefined,
      fecha_desde: (req.query.fecha_desde as string) || undefined,
      fecha_hasta: (req.query.fecha_hasta as string) || undefined,
      limit: Number(req.query.limit),
      offset: Number(req.query.offset),
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/preguntas-diarias/:id', async (req, res, next) => {
  try {
    const result = await preguntasDiariasService.getPreguntaAdmin(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/preguntas-diarias', async (_req, res, next) => {
  try {
    const result = await preguntasDiariasService.listPreguntasAdmin();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/preguntas-diarias', async (req, res, next) => {
  try {
    const result = await preguntasDiariasService.createPreguntaAdmin(req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/preguntas-diarias/:id', async (req, res, next) => {
  try {
    const result = await preguntasDiariasService.updatePreguntaAdmin(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;