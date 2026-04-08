/**
 * recordatorios.service.ts — Lógica de recordatorios automáticos por push
 *
 * Tipos:
 *  - Módulo disponible sin avanzar hace 3+ días
 *  - Módulo en_curso sin rendir examen hace 5+ días
 *  - Objetivo mensual por debajo del 40% al día 15
 *  - Cierre de ranking semanal (viernes)
 */

import { supabase } from '../config/database';

/** Envía push a un usuario específico */
async function pushUsuario(userId: string, titulo: string, cuerpo: string) {
  try {
    const vapidConfigured = !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY;
    if (!vapidConfigured) return;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const webpush = require('web-push') as typeof import('web-push');
    webpush.setVapidDetails(
      'mailto:admin@martinez.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );

    const { data: suscripciones } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId);

    if (!suscripciones?.length) return;

    const payload = JSON.stringify({ titulo, cuerpo });

    await Promise.allSettled(
      suscripciones.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          );
        } catch {
          await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        }
      })
    );
  } catch {
    // Silencioso
  }
}

/** Envía push a todos los vendedores activos */
async function pushTodosVendedores(titulo: string, cuerpo: string) {
  const { data: vendedores } = await supabase
    .from('users')
    .select('id')
    .eq('rol', 'vendedor')
    .eq('activo', true);

  if (!vendedores?.length) return;

  await Promise.allSettled(
    vendedores.map((v) => pushUsuario(v.id, titulo, cuerpo))
  );
}

/**
 * RECORDATORIO 1 (diario 10am)
 * Vendedores con módulo disponible que no avanzan hace 3+ días
 */
export async function recordatorioModuloInactivo() {
  console.log('[cron] Verificando inactividad en módulos...');

  const hace3dias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  // Buscar progreso en estado 'disponible' o 'en_curso' sin actualizar hace 3 días
  const { data: progresos } = await supabase
    .from('progreso')
    .select('user_id, estado, updated_at, modulos(titulo, orden)')
    .in('estado', ['disponible', 'en_curso'])
    .lt('updated_at', hace3dias);

  if (!progresos?.length) return;

  type ProgresoItem = { user_id: string; estado: string; updated_at: string; modulos: unknown };

  // Agrupar por usuario: solo el módulo más urgente (menor orden)
  const porUsuario = new Map<string, ProgresoItem>();
  for (const p of progresos) {
    const existente = porUsuario.get(p.user_id);
    const ordenActual = ((p.modulos as { orden?: number } | null)?.orden) ?? 99;
    const ordenExistente = ((existente?.modulos as { orden?: number } | null)?.orden) ?? 99;
    if (!existente || ordenActual < ordenExistente) {
      porUsuario.set(p.user_id, p as ProgresoItem);
    }
  }

  for (const [userId, progreso] of porUsuario) {
    const modulo = progreso.modulos as { titulo: string; orden: number } | null;
    if (!modulo) continue;

    const mensaje = progreso.estado === 'en_curso'
      ? `Tenés el Módulo ${modulo.orden} en curso. ¡Rendí el examen cuando estés listo!`
      : `El Módulo ${modulo.orden} — "${modulo.titulo}" está disponible. ¡No pierdas el ritmo!`;

    await pushUsuario(userId, '📚 Seguí capacitándote', mensaje);
  }

  console.log(`[cron] Recordatorios módulos enviados a ${porUsuario.size} vendedores`);
}

/**
 * RECORDATORIO 2 (día 15 del mes, 9am)
 * Vendedores con objetivo mensual por debajo del 40%
 */
export async function recordatorioObjetivoMitadMes() {
  console.log('[cron] Verificando objetivos a mitad de mes...');

  const ahora = new Date();
  const mes = ahora.getMonth() + 1;
  const anio = ahora.getFullYear();
  const inicioMes = new Date(anio, mes - 1, 1).toISOString();

  const { data: objetivos } = await supabase
    .from('objetivos')
    .select('user_id, meta_ventas')
    .eq('mes', mes)
    .eq('anio', anio)
    .gt('meta_ventas', 0);

  if (!objetivos?.length) return;

  let enviados = 0;
  for (const obj of objetivos) {
    const { count } = await supabase
      .from('atenciones')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', obj.user_id)
      .eq('resultado', 'venta_cerrada')
      .gte('created_at', inicioMes);

    const ventas = count || 0;
    const pct = Math.round((ventas / obj.meta_ventas) * 100);

    if (pct < 40) {
      await pushUsuario(
        obj.user_id,
        '🎯 Objetivo mensual',
        `Vás por el ${pct}% de tu objetivo (${ventas}/${obj.meta_ventas} ventas). ¡Todavía hay tiempo!`
      );
      enviados++;
    }
  }

  console.log(`[cron] Recordatorios objetivo enviados a ${enviados} vendedores`);
}

/**
 * RECORDATORIO 3 (viernes 17hs)
 * Cierre del ranking semanal mañana (sábado)
 */
export async function recordatorioCierreRanking() {
  console.log('[cron] Enviando recordatorio de cierre de ranking...');
  await pushTodosVendedores(
    '🏆 El ranking cierra mañana',
    'Mañana sábado se cierra la tabla semanal. ¡Registrá tus ventas de hoy!'
  );
  console.log('[cron] Recordatorio ranking enviado');
}
