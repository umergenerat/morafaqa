
const CACHE_NAME = 'morafaka-cache-v1';
const DYNAMIC_CACHE_NAME = 'morafaka-dynamic-v1';

// الملفات الأساسية التي يجب تحميلها فوراً ليعمل التطبيق
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap'
];

// تنصيب الـ Service Worker وحفظ الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// تفعيل الـ Service Worker وحذف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// استراتيجية التعامل مع الشبكة (Network First, falling back to Cache)
// نحاول الاتصال بالإنترنت أولاً، إذا فشل، نعود للملفات المحفوظة
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات الـ API والمكتبات الخارجية الديناميكية المعقدة مبدئياً لتبسيط الكاش
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // إذا نجح الاتصال بالشبكة، نقوم بتحديث نسخة الكاش لهذه الصفحة
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // إذا فشل الاتصال (أوفلاين)، نبحث في الكاش
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // صفحة احتياطية في حالة عدم وجود الصفحة في الكاش (اختياري)
          // return caches.match('/offline.html');
        });
      })
  );
});
