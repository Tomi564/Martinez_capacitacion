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

const pushDisponible =
  !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY;

let webpushLib: typeof import('web-push') | null = null;
if (pushDisponible) {
  try {
    webpushLib = require('web-push');
  } catch {
    webpushLib = null;
  }
}

if (pushDisponible && webpushLib) {
  webpushLib.setVapidDetails(
    'mailto:admin@martinez.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

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
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error('Error al obtener comunicados');
    return res.status(200).json({ comunicados: data || [] });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/comunicados
router.post('/comunicados', async (req, res, next) => {
  try {
    const { titulo, contenido } = req.body;
    if (!titulo?.trim() || !contenido?.trim()) {
      return res.status(400).json({ error: 'Título y contenido son requeridos' });
    }
    // Desactivar todos los anteriores antes de crear uno nuevo activo
    await supabase.from('comunicados').update({ activo: false }).eq('activo', true);

    const { data, error } = await supabase
      .from('comunicados')
      .insert({ titulo: titulo.trim(), contenido: contenido.trim(), activo: true })
      .select()
      .single();
    if (error) throw new Error('Error al crear comunicado');

    // Envío push automático (best effort, no rompe flujo principal)
    if (pushDisponible && webpushLib) {
      try {
        const preview = contenido.trim().slice(0, 100);
        const cuerpo = contenido.trim().length > 100 ? `${preview}...` : preview;

        const { data: suscripciones } = await supabase
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth');

        if (suscripciones?.length) {
          const payload = JSON.stringify({
            titulo: titulo.trim(),
            cuerpo,
          });

          await Promise.allSettled(
            suscripciones.map(async (s) => {
              try {
                await webpushLib.sendNotification(
                  { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                  payload
                );
              } catch {
                await supabase
                  .from('push_subscriptions')
                  .delete()
                  .eq('endpoint', s.endpoint);
              }
            })
          );
        }
      } catch {
        // Silencioso: no debe romper la creación del comunicado
      }
    }

    return res.status(201).json({ comunicado: data });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/comunicados/:id
router.patch('/comunicados/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    if (typeof activo !== 'boolean') {
      return res.status(400).json({ error: 'activo debe ser boolean' });
    }
    await supabase.from('comunicados').update({ activo }).eq('id', id);
    return res.status(200).json({ mensaje: 'Comunicado actualizado' });
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

    let query = supabase
      .from('visitas_taller')
      .select(`
        id, created_at, estado, estado_visita, motivo, observaciones, updated_at, updated_by_admin_at, updated_by_admin_id,
        vehiculos(patente, marca, modelo, clientes(nombre, apellido)),
        users!visitas_taller_mecanico_id_fkey(id, nombre, apellido)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (mecanicoId) {
      query = query.eq('mecanico_id', mecanicoId);
    }
    if (fecha) {
      const inicio = new Date(`${fecha}T00:00:00.000Z`).toISOString();
      const fin = new Date(`${fecha}T23:59:59.999Z`).toISOString();
      query = query.gte('created_at', inicio).lte('created_at', fin);
    }

    const { data, error } = await query;
    if (error) throw new Error('Error al obtener visitas');
    return res.status(200).json({ visitas: data || [] });
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
        *,
        vehiculos(*, clientes(*)),
        users!visitas_taller_mecanico_id_fkey(id, nombre, apellido, email)
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
      estado_neumaticos,
      estado_frenos,
      presion_psi,
      recomendacion,
      estado_visita,
    } = req.body;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by_admin_at: new Date().toISOString(),
      updated_by_admin_id: (req as any).user?.id,
    };

    if (observaciones !== undefined) updates.observaciones = observaciones || null;
    if (estado_neumaticos !== undefined) updates.estado_neumaticos = estado_neumaticos || null;
    if (estado_frenos !== undefined) updates.estado_frenos = estado_frenos || null;
    if (presion_psi !== undefined) updates.presion_psi = presion_psi != null ? Number(presion_psi) : null;
    if (recomendacion !== undefined) updates.recomendacion = recomendacion || null;
    if (estado_visita !== undefined) updates.estado_visita = estado_visita;

    const { error } = await supabase
      .from('visitas_taller')
      .update(updates)
      .eq('id', id);
    if (error) throw new Error('Error al actualizar visita');

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
    const { data, error } = await supabase
      .from('sugerencias_dev')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error('Error al obtener sugerencias');
    return res.status(200).json({ sugerencias: data || [] });
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
    const { data, error } = await supabase
      .from('sugerencias_dev')
      .insert({ texto: texto.trim(), estado: 'pendiente' })
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
      `Vendedor: ${nombre}`,
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

    // ── 1. Ventas por semana (últimas 8 semanas) ──
    const ventasPorSemana: { semana: string; ventas: number; monto: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const lunes = new Date();
      lunes.setDate(lunes.getDate() - lunes.getDay() + 1 - i * 7);
      lunes.setHours(0, 0, 0, 0);
      const sabado = new Date(lunes);
      sabado.setDate(lunes.getDate() + 6);
      sabado.setHours(23, 59, 59, 999);

      const ventasSemana = todasAtenciones.filter((a) => {
        const fecha = new Date(a.created_at);
        return a.resultado === 'venta_cerrada' && fecha >= lunes && fecha <= sabado;
      });

      const label = `${lunes.getDate()}/${lunes.getMonth() + 1}`;
      ventasPorSemana.push({
        semana: label,
        ventas: ventasSemana.length,
        monto: ventasSemana.reduce((acc, a) => acc + (a.monto || 0), 0),
      });
    }

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

    // ── 4. Monto acumulado por mes (últimos 6 meses) ──
    const montoPorMes: { mes: string; monto: number; ventas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const mes = fecha.getMonth();
      const anio = fecha.getFullYear();

      const ventasMes = todasAtenciones.filter((a) => {
        const d = new Date(a.created_at);
        return a.resultado === 'venta_cerrada' && d.getMonth() === mes && d.getFullYear() === anio;
      });

      const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      montoPorMes.push({
        mes: MESES[mes],
        monto: ventasMes.reduce((acc, a) => acc + (a.monto || 0), 0),
        ventas: ventasMes.length,
      });
    }

    return res.status(200).json({
      ventasPorSemana,
      moduloStats,
      conversionPorVendedor,
      montoPorMes,
    });
  } catch (error) {
    next(error);
  }
});

export default router;