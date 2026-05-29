const CACHE_NAME = 'mrs-system-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon.png',
  '/favicon.ico'
];

// Instalação do Service Worker e caching inicial
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercepção de requisições
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não sejam do tipo GET ou que não sejam HTTP/HTTPS (como WebSockets)
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);

  // Estratégia Network-First para a página principal (HTML) para sempre tentar pegar a versão mais recente em dev/prod
  if (url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Salva no cache a última versão obtida com sucesso
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Se falhar a rede (offline), serve do cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Estratégia Cache-First para os outros assets estáticos (imagens, manifest, js, css, etc.)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Se a resposta for válida, coloca no cache
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Em caso de falha total de rede para imagem ou outros recursos
        console.log('[Service Worker] Fetch failed offline:', event.request.url);
      });
    })
  );
});
