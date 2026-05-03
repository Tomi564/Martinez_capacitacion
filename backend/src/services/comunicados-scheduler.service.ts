/**
 * Activa comunicados cuya fecha programada ya pasó y envía push (mismo criterio que publicación inmediata).
 */

import { supabase } from '../config/database';

const pushDisponible =
  !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY;

let webpushLib: typeof import('web-push') | null = null;
if (pushDisponible) {
  try {
    const w = require('web-push') as typeof import('web-push');
    w.setVapidDetails(
      'mailto:admin@martinez.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
    webpushLib = w;
  } catch {
    webpushLib = null;
  }
}

export async function enviarPushComunicado(titulo: string, contenido: string) {
  if (!pushDisponible || !webpushLib) return;
  try {
    const preview = contenido.trim().slice(0, 100);
    const cuerpo = contenido.trim().length > 100 ? `${preview}...` : preview;
    const { data: suscripciones } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth');

    if (!suscripciones?.length) return;

    const payload = JSON.stringify({ titulo: titulo.trim(), cuerpo });
    await Promise.allSettled(
      suscripciones.map(async (s) => {
        try {
          await webpushLib!.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
        } catch {
          await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        }
      }),
    );
  } catch {
    // best effort
  }
}

/** Activa a lo sumo un comunicado programado vencido (el de fecha más reciente). */
export async function processScheduledComunicados(): Promise<void> {
  const now = new Date().toISOString();

  const { data: siguiente, error: selErr } = await supabase
    .from('comunicados')
    .select('id, titulo, contenido')
    .eq('activo', false)
    .not('programado_para', 'is', null)
    .lte('programado_para', now)
    .order('programado_para', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selErr || !siguiente?.id) return;

  await supabase.from('comunicados').update({ activo: false }).eq('activo', true);

  await supabase
    .from('comunicados')
    .update({ activo: true, programado_para: null })
    .eq('id', siguiente.id);

  await supabase
    .from('comunicados')
    .update({ programado_para: null })
    .eq('activo', false)
    .not('programado_para', 'is', null)
    .lte('programado_para', now)
    .neq('id', siguiente.id);

  await enviarPushComunicado(siguiente.titulo, siguiente.contenido);
}
