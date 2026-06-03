/**
 * Envío de notificaciones web push a usuarios concretos (por user_id en push_subscriptions).
 * Reutiliza la misma config VAPID que push.routes.
 */

import { supabase } from '../config/database';

const vapidConfigured =
  !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY;

let webpush: typeof import('web-push') | null = null;
if (vapidConfigured) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    webpush = require('web-push');
    webpush!.setVapidDetails(
      'mailto:admin@martinez.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
  } catch {
    webpush = null;
  }
}

function logPushSendError(endpoint: string, err: unknown) {
  const e = err as { statusCode?: number; body?: string; message?: string };
  console.error('[push-send] Error enviando notificación', {
    endpoint: endpoint.slice(0, 80),
    statusCode: e.statusCode ?? null,
    message: e.message ?? String(err),
    body: e.body ?? null,
  });
}

export async function sendPushToUserIds(
  userIds: string[],
  titulo: string,
  cuerpo: string
): Promise<{ enviados: number }> {
  if (!webpush) {
    console.log('[push-send] web-push no disponible (VAPID no configurado o módulo ausente)');
    return { enviados: 0 };
  }

  if (userIds.length === 0) {
    console.log('[push-send] Sin userIds destino');
    return { enviados: 0 };
  }

  const { data: suscripciones, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('user_id', userIds);

  if (error) {
    console.error('[push-send] Error leyendo push_subscriptions:', error.message);
    return { enviados: 0 };
  }

  if (!suscripciones?.length) {
    console.log('[push-send] 0 suscripciones para', userIds.length, 'usuario(s)');
    return { enviados: 0 };
  }

  console.log(
    `[push-send] Enviando "${titulo}" a ${suscripciones.length} suscripción(es) (${userIds.length} user_id(s))`
  );

  const payload = JSON.stringify({ titulo, cuerpo });
  let enviados = 0;

  await Promise.allSettled(
    suscripciones.map(async (s) => {
      try {
        await webpush!.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        enviados++;
      } catch (err) {
        logPushSendError(s.endpoint, err);
        await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      }
    })
  );

  console.log(`[push-send] Resultado: ${enviados}/${suscripciones.length} enviadas OK`);
  return { enviados };
}
