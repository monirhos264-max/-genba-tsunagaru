
const CACHE_NAME = "genba-tsunagaru-v3";

const APP_FILES = [
  "/-genba-tsunagaru/",
  "/-genba-tsunagaru/index.html",
  "/-genba-tsunagaru/dashboard.html",
  "/-genba-tsunagaru/attendance.html",
  "/-genba-tsunagaru/location.html",
  "/-genba-tsunagaru/report.html",
  "/-genba-tsunagaru/equipment.html",
  "/-genba-tsunagaru/delivery.html",
  "/-genba-tsunagaru/history.html",
  "/-genba-tsunagaru/dashboard.css",
  "/-genba-tsunagaru/style.css",
  "/-genba-tsunagaru/icon.svg",
  "/-genba-tsunagaru/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_FILES);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  if (
    url.pathname.includes("/functions/") ||
    url.pathname.includes("/auth/") ||
    url.pathname.includes("/rest/")
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached || Response.error();
      })
  );
});
