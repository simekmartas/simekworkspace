const CACHE_NAME = 'majak-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/novinky.html',
  '/styles.css',
  '/navigation.js',
  '/simple-novinky.js',
  '/access-control.js',
  '/theme-toggle.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache otevřen');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Vrátí cached verzi nebo fetchne ze sítě
        if (response) {
          return response;
        }
        return fetch(event.request).catch(() => {
          // Fallback pro offline
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync pro offline komentáře
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-comments') {
    event.waitUntil(syncOfflineComments());
  }
});

async function syncOfflineComments() {
  try {
    const db = await openDatabase();
    const offlineComments = await getOfflineComments(db);
    
    for (const comment of offlineComments) {
      try {
        await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(comment.data)
        });
        await deleteOfflineComment(db, comment.id);
      } catch (error) {
        console.log('Nepodařilo se synchronizovat komentář:', error);
      }
    }
  } catch (error) {
    console.log('Background sync selhala:', error);
  }
} 