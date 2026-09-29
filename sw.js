/* Service worker: lets the website keep working offline (site files + data + product images. Bump SHELL_VERSION when app files change. */
const SHELL_VERSION = 'shell-v3';
const DATA_CACHE = 'data-v1';
const IMG_CACHE = 'img-v1';
const SHELL = [
  './', './index.html', './styles.css', './app.js',
  './vendor/qrcode.js',
  './img/iontech-logo.png', './img/lenovo-logo.png',
  './icons/icon-192.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL_VERSION);
    await c.addAll(SHELL);
    const d = await caches.open(DATA_CACHE);
    try { await d.add(new Request('./data/products.json', { cache: 'reload' })); } catch (_) {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keep = [SHELL_VERSION, DATA_CACHE, IMG_CACHE];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Published catalog data: network first, fall back to cache when offline.
  if (url.origin === location.origin && url.pathname.endsWith('/data/products.json')) {
    e.respondWith((async () => {
      const c = await caches.open(DATA_CACHE);
      try {
        const res = await fetch(req, { cache: 'no-store' });
        if (res.ok) c.put('./data/products.json', res.clone());
        return res;
      } catch (_) {
        return (await c.match('./data/products.json')) || new Response('{}', { status: 503, headers: { 'Content-Type': 'application/json' } });
      }
    })());
    return;
  }

  // Product images from Lenovo PSREF: cache first, then network (stored for offline).
  if (/psrefstuff\.lenovo\.com$/.test(url.hostname) && /\.(png|jpe?g|webp|gif)$/i.test(url.pathname)) {
    e.respondWith((async () => {
      const c = await caches.open(IMG_CACHE);
      const hit = await c.match(req.url);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') c.put(req.url, res.clone());
        return res;
      } catch (_) {
        return new Response('', { status: 504 });
      }
    })());
    return;
  }

  // App shell: cache first, update in background.
  if (url.origin === location.origin) {
    e.respondWith((async () => {
      const c = await caches.open(SHELL_VERSION);
      const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await c.match('./index.html') : null);
      const net = fetch(req).then(res => { if (res.ok && SHELL.some(s => url.pathname.endsWith(s.replace('./', '/')))) c.put(req, res.clone()); return res; }).catch(() => null);
      return hit || (await net) || new Response('Offline', { status: 503 });
    })());
  }
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(list => {
    if (list[0]) return list[0].focus();
    return self.clients.openWindow('./index.html#/onhand');
  }));
});
