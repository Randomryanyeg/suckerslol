const CACHE_NAME = 'scotia-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  'https://www.scotiabank.com/content/dam/scotiabank/canada/en/images/logos/scotiabank-logo.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // For navigation requests, try to fetch from network, if fails return offline.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then(fetchRes => {
        // If server returns 500 or 404 for a navigation-like request (though we handled navigate above)
        if (!fetchRes || fetchRes.status === 404 || fetchRes.status >= 500) {
           // We could return offline here too if we wanted
        }
        return fetchRes;
      }).catch(() => {
        // Fallback for other assets if needed
        return response;
      });
    })
  );
});
