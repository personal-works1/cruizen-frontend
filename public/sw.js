const CACHE_NAME = "cruizen-v3"  // ← bump version

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

// ── separate cache for API data (shorter TTL) ─────────────────────────
const DATA_CACHE_NAME = "cruizen-data-v3"
const DATA_CACHE_TTL  = 5 * 60 * 1000  // 5 minutes

// ── routes worth caching for offline engagement ───────────────────────
const CACHEABLE_API_ROUTES = [
  "/api/posts/feed",
  "/api/posts/trending",
  "/api/search/discover",
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
          .filter((key) => key !== CACHE_NAME && key !== DATA_CACHE_NAME)
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

  // ── API data routes — stale-while-revalidate ──────────────────────
  const isCacheableApi = CACHEABLE_API_ROUTES.some((route) =>
    url.pathname.startsWith(route)
  )

  if (isCacheableApi) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request)

        // check if cached response is still fresh
        if (cached) {
          const cachedTime = cached.headers.get("sw-cached-at")
          const isStale = cachedTime
            ? Date.now() - Number(cachedTime) > DATA_CACHE_TTL
            : true

          if (!isStale) {
            // fresh enough — return immediately, revalidate in background
            event.waitUntil(revalidateAndCache(cache, event.request))
            return cached
          }
        }

        // stale or missing — fetch fresh, cache it, return it
        return revalidateAndCache(cache, event.request)
      })
    )
    return
  }

  // ── skip other API/external calls ────────────────────────────────
  if (
    url.hostname.includes("render") ||
    url.hostname.includes("neon") ||
    url.hostname.includes("cloudinary.com")
  ) return

  // ── network-first for HTML ────────────────────────────────────────
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

  // ── cache-first for static assets (JS, CSS, images) ──────────────
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

// ── helper: fetch, stamp with timestamp, cache, return ───────────────
async function revalidateAndCache(cache, request) {
  try {
    const res = await fetch(request)
    if (res.ok) {
      // stamp the response with when it was cached
      // (Response headers are immutable, so we reconstruct it)
      const body = await res.clone().text()
      const stamped = new Response(body, {
        status: res.status,
        statusText: res.statusText,
        headers: {
          ...Object.fromEntries(res.headers.entries()),
          "sw-cached-at": String(Date.now()),
          "content-type": res.headers.get("content-type") || "application/json",
        },
      })
      cache.put(request, stamped)
    }
    return res
  } catch {
    // network failed — return whatever we have cached, even if stale
    const fallback = await cache.match(request)
    if (fallback) return fallback
    // nothing cached either — return a graceful empty response
    return new Response(
      JSON.stringify({ posts: [], hasMore: false, trending_posts: [], trending_words: [], videos: [] }),
      { status: 200, headers: { "content-type": "application/json" } }
    )
  }
}