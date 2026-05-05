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

export async function sendPushToUserIds(
  userIds: string[],
  titulo: string,
  cuerpo: string
): Promise<{ enviados: number }> {
  if (!webpush || userIds.length === 0) {
    return { enviados: 0 };
  }

  const { data: suscripciones, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('user_id', userIds);

  if (error || !suscripciones?.length) {
    return { enviados: 0 };
  }

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
      } catch {
        await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      }
    })
  );

  return { enviados };
}
