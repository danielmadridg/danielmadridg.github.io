const CACHE_NAME = 'prodegi-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/prodegilogo.webp'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch event with cache-first strategy for static assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Cache-first for static assets
  if (url.pathname.startsWith('/assets/') ||
      url.pathname.includes('.svg') ||
      url.pathname.includes('.webp')) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(response => {
          // Cache successful responses
          if (response.ok && response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        }).catch(() => {
          // Return cached version if fetch fails
          return caches.match(request);
        });
      })
    );
    return;
  }

  // Network-first for API calls and dynamic content
  if (request.url.includes('firestore') ||
      request.url.includes('googleapis') ||
      request.url.includes('oaistatic.com')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
