/**
 * push.routes.ts — Suscripciones push (PWA)
 *
 * POST /api/push/subscribe   — guarda o actualiza la suscripción del dispositivo
 * POST /api/push/send        — envía notificación a todos (admin only)
 */

import { Router, Response, NextFunction } from 'express';
import { supabase } from '../config/database';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import type { AuthRequest } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// Verificar si las VAPID keys están configuradas
const vapidConfigured =
  !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY;

let webpush: typeof import('web-push') | null = null;
if (vapidConfigured) {
  // Importar dinámicamente para no romper si no está instalado
  try {
    webpush = require('web-push');
    webpush!.setVapidDetails(
      'mailto:admin@martinez.com',
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
  } catch {
    console.warn('⚠️  web-push no instalado — notificaciones push desactivadas');
  }
}

// POST /api/push/subscribe
router.post('/subscribe', async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!webpush) {
    return res.status(503).json({ error: 'Push no configurado en el servidor' });
  }
  try {
    const userId = req.user!.id;
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Suscripción inválida' });
    }

    await supabase.from('push_subscriptions').upsert(
      { user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: 'user_id,endpoint' }
    );

    return res.status(200).json({ mensaje: 'Suscripción guardada' });
  } catch (error) {
    next(error);
  }
});

// POST /api/push/send — admin envía notificación a todos
router.post('/send', requireRole('admin'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!webpush) {
    return res.status(503).json({ error: 'Push no configurado en el servidor' });
  }
  try {
    const { titulo, cuerpo } = req.body;
    if (!titulo || !cuerpo) {
      return res.status(400).json({ error: 'titulo y cuerpo son requeridos' });
    }

    const { data: suscripciones } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth');

    if (!suscripciones?.length) {
      return res.status(200).json({ mensaje: 'Sin suscriptores', enviados: 0 });
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
          // Suscripción expirada — eliminar
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', s.endpoint);
        }
      })
    );

    return res.status(200).json({ mensaje: `Notificación enviada`, enviados });
  } catch (error) {
    next(error);
  }
});

export default router;
