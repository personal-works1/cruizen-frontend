const CACHE_NAME = "cruizen-v4"


const STATIC_ASSETS = [
"/Cruizen.png",
"/manifest.json",
]

// ── install ───────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
event.waitUntil(
caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
)
self.skipWaiting()
})

// ── activate: clean up old caches ────────────────────────────────────
self.addEventListener("activate", (event) => {
event.waitUntil(
caches.keys().then((keys) =>
Promise.all(
keys
.filter((key) => key !== CACHE_NAME)
.map((key) => caches.delete(key))
)
)
)
self.clients.claim()
})

// ── fetch ─────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
const url = new URL(event.request.url)

// skip non-GET
if (event.request.method !== "GET") return

// ── skip HTML — always fetch fresh so auth state is correct ──────
if (event.request.headers.get("accept")?.includes("text/html")) return

// ── skip all API calls — never cache auth/data responses ─────────
if (url.pathname.startsWith("/api/")) return

// ── skip external origins (Render, Neon, Cloudinary, etc.) ───────
if (url.hostname !== self.location.hostname) return

// ── cache-first for static assets (JS, CSS, images, fonts) ───────
event.respondWith(
caches.match(event.request).then((cached) => {
if (cached) return cached
return fetch(event.request).then((res) => {
// only cache valid responses
if (!res || res.status !== 200 || res.type !== "basic") return res
const clone = res.clone()
caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
return res
})
})
)
})

self.addEventListener("push", (event) => {
  const data = event.data.json()

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/Cruizen.png",
      data: { url: data.url }
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus().then((client) =>
          client.navigate(event.notification.data.url)
        )
      }
      return clients.openWindow(event.notification.data.url)
    })
  )
})