const CACHE = 'runebook-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
];

// Install: cache core assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network first, fall back to cache
self.addEventListener('fetch', function(e) {
  // Don't intercept API calls or Supabase
  var url = e.request.url;
  if (url.includes('supabase.co') || 
      url.includes('vercel.app') || 
      url.includes('stripe.com') ||
      url.includes('jsdelivr.net')) {
    return;
  }
  
  e.respondWith(
    fetch(e.request)
      .then(function(res) {
        // Cache successful GET responses
        if (e.request.method === 'GET' && res.status === 200) {
          var clone = res.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return res;
      })
      .catch(function() {
        // Network failed — serve from cache
        return caches.match(e.request).then(function(cached) {
          return cached || caches.match('/index.html');
        });
      })
  );
});
