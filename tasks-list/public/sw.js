const CACHE_NAME = "list-cache-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Установка и стартовое кэширование");
      return cache.addAll(["/"]);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Удаление старого кэша:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Получен push-сигнал');
  
  let data = { title: 'Новая задача', body: 'Список обновлен' };
  
  // Пытаемся распарсить данные, если сервер их передал
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      // Если сервер передал просто строку, а не JSON
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/favicon-128x128.png', // Убедись, что иконка реально существует
    badge: '/icons/favicon-48x48.png',
    vibrate: [100, 50, 100], // Вибрация на телефонах
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    }
  };

  // Показываем системное уведомление
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Слушатель клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Клик по уведомлению');
  event.notification.close(); // Закрываем окошко
  // Можно открыть окно браузера с сайтом
  event.waitUntil(
    clients.openWindow('/')
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  if (
    requestUrl.port === "3000" ||
    !event.request.url.startsWith("http") ||
    event.request.url.includes("@vite") ||
    event.request.url.includes("chrome-extension")
  ) {
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            if (
              !event.request.url.includes("chrome-extension") &&
              !event.request.url.includes("@vite")
            ) {
              cache.put(event.request, responseToCache);
            }
          });

          return networkResponse;
        });
      })
      .catch((error) => {
        console.log(
          "[Service Worker] Оффлайн режим. Запрос не удался:",
          event.request.url,
          error,
        );
        return new Response("Offline", {
          status: 503,
          statusText: "Service Unavailable",
          headers: new Headers({
            "Content-Type": "text/plain",
          }),
        });
      }),
  );
});
