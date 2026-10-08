const CACHE = 'walkingout-shell-v3';
const SCOPE = '/apps/walkingout/';
const SHELL = [
  `${SCOPE}`,
  `${SCOPE}index.html`,
  `${SCOPE}styles.css`,
  `${SCOPE}app.js`,
  `${SCOPE}manifest.webmanifest`,
];

function isGuide(pathname) {
  return pathname === `${SCOPE}help` || pathname.startsWith(`${SCOPE}help/`);
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !url.pathname.startsWith(SCOPE)) return;
  // The guide, its screenshots, and the PDF are not the installed app shell.
  // Leave them to the network so a cache miss can't be replaced by the app.
  if (isGuide(url.pathname)) return;
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
