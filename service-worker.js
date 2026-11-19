const CACHE_NAME = "genba-tsunagaru-v4";
const APP_FILES = [
  "/-genba-tsunagaru/","/-genba-tsunagaru/index.html","/-genba-tsunagaru/dashboard.html",
  "/-genba-tsunagaru/attendance.html","/-genba-tsunagaru/location.html","/-genba-tsunagaru/report.html",
  "/-genba-tsunagaru/equipment.html","/-genba-tsunagaru/delivery.html","/-genba-tsunagaru/history.html",
  "/-genba-tsunagaru/dashboard.css","/-genba-tsunagaru/style.css","/-genba-tsunagaru/icon.svg",
  "/-genba-tsunagaru/manifest.json","/-genba-tsunagaru/app-config.js"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.includes("/functions/") || url.pathname.includes("/auth/") || url.pathname.includes("/rest/")) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok) { const copy=response.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)); }
    return response;
  }).catch(async()=> (await caches.match(request)) || Response.error()));
});
self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { body: event.data?.text() || "新しいお知らせがあります。" }; }
  const title = data.title || "現場つながる";
  const options = {
    body: data.body || "備品申請の状況が更新されました。",
    icon: "./icon.svg",
    badge: "./icon.svg",
    tag: data.tag || "genba-update",
    renotify: true,
    data: { url: data.url || "./equipment.html" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "./equipment.html", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(list => {
    for (const client of list) if ("focus" in client) { client.navigate(target); return client.focus(); }
    return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
  }));
});
