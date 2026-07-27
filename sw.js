// Service worker minimal : rend l'app installable, passe les requêtes au réseau.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => { e.respondWith(fetch(e.request)); });
