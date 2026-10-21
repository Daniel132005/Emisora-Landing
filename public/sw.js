const CACHE_NAME = 'zumaque-pwa-v1'

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
]

// Instalar Service Worker y precachear shell básico
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Error precacheando assets:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activar y limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Manejo de peticiones de red
self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // 1. Ignorar métodos no GET
  if (req.method !== 'GET') return

  // 2. NUNCA interceptar audio/video streaming, web sockets o llamadas API dinámicas
  if (
    url.pathname.includes('/stream') ||
    url.pathname.includes('/live') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.aac') ||
    url.pathname.endsWith('.ogg') ||
    url.pathname.endsWith('.mp4') ||
    url.pathname.endsWith('.mov') ||
    url.pathname.endsWith('.webm') ||
    url.pathname.startsWith('/api/') ||
    url.port === '4000' ||
    url.port === '8000'
  ) {
    return
  }

  // 3. Estrategia para navegación (HTML): Network first con fallback a index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => {
        return caches.match('/index.html')
      })
    )
    return
  }

  // 4. Estrategia para fuentes, iconos e imágenes estáticas: Stale-While-Revalidate
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/voces/') ||
    url.pathname.startsWith('/mock/') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(req).then((cachedResponse) => {
          const fetchPromise = fetch(req)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(req, networkResponse.clone())
              }
              return networkResponse
            })
            .catch(() => cachedResponse)

          return cachedResponse || fetchPromise
        })
      })
    )
    return
  }

  // 5. Resto de peticiones: Network first con fallback a caché
  event.respondWith(
    fetch(req)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const resClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone))
        }
        return response
      })
      .catch(() => caches.match(req))
  )
})
