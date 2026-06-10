// 최소 서비스워커 — 설치/활성화만 처리 (오프라인 캐싱은 추후 확장)
const CACHE = 'process-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // 네트워크 우선, 실패 시 캐시 (필요 시 전략 확장)
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
