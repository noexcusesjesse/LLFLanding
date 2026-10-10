const CACHE = 'walkquest-shell-v1';
const SCOPE = '/apps/walkquest/';
const SHELL = [
  `${SCOPE}`,
  `${SCOPE}index.html`,
  `${SCOPE}styles.css`,
  `${SCOPE}app.js`,
  `${SCOPE}maps.js`,
  `${SCOPE}postcard.js`,
  `${SCOPE}manifest.webmanifest`,
  `${SCOPE}icons/icon-192.png`,
  `${SCOPE}icons/icon-512.png`,
  `${SCOPE}engine/index.js`,
  `${SCOPE}engine/dates.js`,
  `${SCOPE}engine/convert.js`,
  `${SCOPE}engine/sanity.js`,
  `${SCOPE}engine/streaks.js`,
  `${SCOPE}engine/miles.js`,
  `${SCOPE}engine/chapters.js`,
  `${SCOPE}engine/campaigns.js`,
  `${SCOPE}engine/badges.js`,
  `${SCOPE}engine/progress.js`,
  `${SCOPE}engine/backup.js`,
  `${SCOPE}engine/store.js`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('walkquest-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !url.pathname.startsWith(SCOPE)) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match(`${SCOPE}index.html`))),
  );
});
