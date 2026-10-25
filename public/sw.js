// Duo Sanctuary - Service Worker for PWA & Native Android Shell
const CACHE_NAME = 'duo-sanctuary-v1';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[Duo SW] Precache partial error:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network-first strategy with cache fallback for dynamic sanctuary data
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip API or SSE streaming requests
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/realtime') ||
    event.request.url.includes('/api/export')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful basic asset responses
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (event.request.url.includes('/icons/') ||
            event.request.url.includes('/_next/static/'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Fallback to cache if offline
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        // If requesting a HTML document, return the cached root or offline page
        if (event.request.headers.get('accept')?.includes('text/html')) {
          const rootMatch = await caches.match('/');
          if (rootMatch) return rootMatch;
        }

        return new Response(
          `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Duo Sanctuary</title>
  <style>
    body { background: #FAF6EF; color: #332725; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 20px; }
    .box { background: white; border: 1px solid #EBD7C2; border-radius: 24px; padding: 36px 28px; max-width: 360px; box-shadow: 0 10px 25px -5px rgba(51, 39, 37, 0.08); }
    h2 { font-family: Georgia, serif; font-size: 22px; color: #332725; margin: 0 0 8px 0; }
    p { font-size: 13px; color: #735D57; line-height: 1.5; margin: 0 0 20px 0; }
    .btn { display: inline-block; width: 100%; background: #84232C; color: white; border: none; border-radius: 14px; padding: 13px 20px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; }
  </style>
  <script>
    setTimeout(function() { window.location.reload(); }, 3500);
  </script>
</head>
<body>
  <div class="box">
    <h2>Duo Sanctuary</h2>
    <p>Waking up your sanctuary... 🌸<br/>Auto-reconnecting momentarily.</p>
    <button class="btn" onclick="window.location.reload()">Enter Sanctuary</button>
  </div>
</body>
</html>`,
          {
            status: 200,
            headers: new Headers({ 'Content-Type': 'text/html; charset=utf-8' }),
          }
        );
      })
  );
});

// Push notification listener
self.addEventListener('push', (event) => {
  let data = { title: 'Duo Sanctuary', body: 'A tender moment is waiting for you.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification tap
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
