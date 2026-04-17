const CACHE_NAME = 'nexus-transit-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through simple bypass cache for standalone PWA mechanics
  event.respondWith(fetch(event.request).catch(() => new Response('Offline')));
});
