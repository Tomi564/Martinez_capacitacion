/**
 * usePushNotifications.ts — Suscripción a notificaciones push PWA
 *
 * Solicita permiso al usuario, registra el Service Worker y envía
 * la suscripción al backend para que pueda enviar notificaciones.
 */

import { apiClient } from '@/lib/api';

const SW_READY_TIMEOUT_MS = 5000;

export function pushHabilitadoEnEntorno(): boolean {
  return process.env.NODE_ENV !== 'development';
}

async function esperarServiceWorkerReady(
  timeoutMs: number,
): Promise<ServiceWorkerRegistration | null> {
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('SW_READY_TIMEOUT')), timeoutMs);
      }),
    ]);
  } catch (err) {
    if (err instanceof Error && err.message === 'SW_READY_TIMEOUT') {
      console.warn(
        `[suscribirPush] navigator.serviceWorker.ready no respondió en ${timeoutMs}ms (¿service worker no registrado, p. ej. dev sin PWA?)`,
      );
      return null;
    }
    throw err;
  }
}

export async function suscribirPush(): Promise<boolean> {
  if (!pushHabilitadoEnEntorno()) {
    return false;
  }

  try {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.warn('[suscribirPush] Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY');
      return false;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[suscribirPush] Push o Service Worker no disponibles en este navegador');
      return false;
    }

    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') {
      return false;
    }

    const registration = await esperarServiceWorkerReady(SW_READY_TIMEOUT_MS);
    if (!registration) {
      return false;
    }

    const suscripcionExistente = await registration.pushManager.getSubscription();
    if (suscripcionExistente) {
      await enviarSuscripcion(suscripcionExistente);
      return true;
    }

    const suscripcion = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    });

    await enviarSuscripcion(suscripcion);
    return true;
  } catch (err) {
    console.error('[suscribirPush] Error al suscribir push', err);
    return false;
  }
}

async function enviarSuscripcion(sub: PushSubscription) {
  const json = sub.toJSON();
  await apiClient.post('/push/subscribe', {
    endpoint: json.endpoint,
    keys: json.keys,
  });
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
