// 앱 화면(HTML/JS)을 오프라인에서도 열 수 있게 캐시. 글 데이터(Supabase)는 캐시하지 않음.
const CACHE = "ws-v1";
const SHELL = ["./", "index.html", "config.js", "manifest.webmanifest", "icon.svg"];
const STATIC_HOSTS = ["cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    // 온라인이면 항상 최신(수정 배포가 바로 반영), 오프라인이면 캐시
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match("index.html")))
    );
  } else if (STATIC_HOSTS.includes(url.hostname)) {
    // 라이브러리와 글꼴은 버전이 고정이라 캐시 우선
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }))
    );
  }
});
