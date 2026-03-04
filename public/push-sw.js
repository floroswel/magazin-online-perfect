// Push notification service worker
self.addEventListener("push", (event) => {
  let data = { title: "MegaShop", body: "Ai o notificare nouă!" };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error("Push data parse error:", e);
  }

  const options = {
    body: data.body || "",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
      event_type: data.event_type || "general",
    },
    actions: [
      { action: "open", title: "Deschide" },
      { action: "close", title: "Închide" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title || "MegaShop", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
