/* Casa en Equipo — service worker */
const CACHE = "casa-v1";
const ASSETS = ["/", "/index.html", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Red con fallback a cache (para que la app abra sin conexión)
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request).then((r) => r || caches.match("/index.html")))
  );
});

// Llega un push del servidor -> mostrar notificación
self.addEventListener("push", (e) => {
  let data = { title: "Casa en Equipo", body: "Hoy te toca cocinar 🍳" };
  try { if (e.data) data = e.data.json(); } catch (err) {}
  e.waitUntil(
    self.registration.showNotification(data.title || "Casa en Equipo", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "casa-cocina",
      data: { url: data.url || "/" }
    })
  );
});

// Tap en la notificación -> abrir la app
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ("focus" in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
