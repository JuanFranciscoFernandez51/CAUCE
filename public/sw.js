/*
 * Service Worker de Cauce — app-shell offline-friendly, sin librerías.
 *
 * Estrategias:
 *  - Navegación (documentos HTML): network-first con fallback al caché y, si
 *    no hay nada, a una página offline mínima. Así la app abre aunque no haya
 *    señal.
 *  - Estáticos (_next/static, imágenes, fuentes, etc.): stale-while-revalidate
 *    → responde rápido del caché y refresca en segundo plano.
 *  - El resto (APIs, POST, etc.): pasa derecho a la red, nunca lo cacheamos.
 */

const VERSION = "cauce-pwa-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const STATIC_CACHE = `${VERSION}-static`;

// Mínimo imprescindible para que algo se vea sin red.
const PRECACHE = ["/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Página offline mínima de respaldo (cuando no hay nada cacheado para navegar).
function offlineFallback() {
  return new Response(
    `<!doctype html><html lang="es"><head><meta charset="utf-8">` +
      `<meta name="viewport" content="width=device-width, initial-scale=1">` +
      `<title>Sin conexión</title>` +
      `<style>body{font-family:system-ui,sans-serif;display:flex;min-height:100vh;` +
      `align-items:center;justify-content:center;margin:0;background:#0b1220;color:#e6edf6;` +
      `text-align:center;padding:24px}div{max-width:320px}h1{font-size:18px;margin:0 0 8px}` +
      `p{font-size:14px;opacity:.8;margin:0}</style></head>` +
      `<body><div><h1>Sin conexión</h1>` +
      `<p>No pudimos cargar esta pantalla. Revisá tu conexión y volvé a intentar.</p>` +
      `</div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/icon.svg" ||
    /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|gif|webp|avif|svg|ico)$/.test(
      url.pathname
    )
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Solo GET y mismo origen; lo demás (POST a APIs, terceros) va directo a la red.
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegación → network-first con fallback al caché y a la página offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || offlineFallback();
        })
    );
    return;
  }

  // Estáticos → stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res && res.status === 200) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
