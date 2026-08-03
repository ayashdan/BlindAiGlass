// Minimal service worker: only exists to receive push events and show a
// notification. No caching/offline behavior — that's a separate concern
// this app doesn't need right now.

self.addEventListener("push", (event) => {
  let data = { title: "Forge", body: "Don't lose your streak!" };
  try {
    if (event.data) data = event.data.json();
  } catch {
    // ignore malformed payloads
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Forge", {
      body: data.body || "",
      data: { url: data.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
