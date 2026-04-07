/**
 * usePushNotifications.ts — Suscripción a notificaciones push PWA
 *
 * Solicita permiso al usuario, registra el Service Worker y envía
 * la suscripción al backend para que pueda enviar notificaciones.
 */

import { apiClient } from '@/lib/api';

export async function suscribirPush(): Promise<boolean> {
  try {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return false;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') return false;

    const registration = await navigator.serviceWorker.ready;

    const suscripcionExistente = await registration.pushManager.getSubscription();
    if (suscripcionExistente) {
      // Ya suscrito — sincronizar con backend igual
      await enviarSuscripcion(suscripcionExistente);
      return true;
    }

    const suscripcion = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    await enviarSuscripcion(suscripcion);
    return true;
  } catch {
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
