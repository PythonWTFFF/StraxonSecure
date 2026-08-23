const CACHE_NAME = 'straxon-secure-v1';
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/straxonlogo.jpeg',
];

// Install Event: Cache Static Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: Cleanup Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Implement PWA Caching Strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Network First for API routes (Server Functions) and Live Data routes
  if (
    url.pathname.startsWith('/_server') || 
    url.pathname.startsWith('/api') || 
    url.pathname.startsWith('/labs') ||
    url.pathname.startsWith('/easm')
  ) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If successful, clone and cache it for fallback
          if(response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            // If it's a page navigation, return offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return new Response('Network error and no cache available', { status: 503 });
          });
        })
    );
    return;
  }

  // 2. Cache First for Static Assets (Images, Fonts, CSS, JS chunks)
  if (
    event.request.destination === 'image' ||
    event.request.destination === 'font' ||
    event.request.destination === 'style' ||
    event.request.destination === 'script'
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // 3. Stale-While-Revalidate for everything else (HTML navigations)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => {
        // If network fails and no cache, serve offline page for navigations
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      });
      return cachedResponse || fetchPromise;
    })
  );
});

// Background Sync Event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scan') {
    event.waitUntil(
      // In a full implementation, we would pull queued requests from IndexedDB
      // and replay them here.
      console.log('[SW] Syncing offline scans in background...')
    );
  }
});

// Push Notifications Event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'New Alert', body: 'Threat detected.' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200]
    })
  );
});
