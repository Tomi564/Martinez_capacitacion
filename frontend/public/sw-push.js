/**
 * Push handler importado por el Service Worker de next-pwa (importScripts).
 * Muestra notificaciones con payload { titulo, cuerpo } del backend.
 */
self.addEventListener('push', (event) => {
  var titulo = 'Martinez Neumaticos';
  var cuerpo = '';

  if (event.data) {
    try {
      var data = event.data.json();
      titulo = data.titulo || data.title || titulo;
      cuerpo = data.cuerpo || data.body || '';
    } catch (_e) {
      cuerpo = event.data.text() || '';
    }
  }

  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: cuerpo,
      icon: '/icons/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
