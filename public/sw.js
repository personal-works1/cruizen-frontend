const CACHE_NAME = "cruizen-v2"

// files to cache on install
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/Cruizen.png",
  "/manifest.json",
  "/home",
  "/search",
  "/cart",
  "/messages",
  "/notifications",
  "/leaderboard",
  
]

// ── install: cache static assets ─────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// ── activate: delete old caches ───────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── fetch: cache-first for static, network-first for API ─────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // skip non-GET and API requests — always fresh from network
  if (event.request.method !== "GET") return
  if (url.pathname.startsWith("/api") || url.hostname.includes("render") || url.hostname.includes("neon") || url.hostname.includes("cloudinary.com") ) return

  // network-first for HTML (always get latest app shell)
  if (event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return res
        })
        .catch(() => caches.match("/index.html"))
    )
    return
  }

  // cache-first for everything else (images, js, css)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((res) => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        return res
      })
    })
  )
})