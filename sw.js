const CACHE_NAME = 'goon-games-v1';
const STATIC_CACHE = 'static-v1';
const IMAGES_CACHE = 'images-v1';
const FONTS_CACHE = 'fonts-v1';

// Assets to cache
const staticAssets = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching static assets');
        return cache.addAll(staticAssets);
      }),
      // Create other caches
      caches.open(IMAGES_CACHE),
      caches.open(FONTS_CACHE)
    ])
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (![STATIC_CACHE, IMAGES_CACHE, FONTS_CACHE].includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle images
  if (request.destination === 'image') {
    event.respondWith(handleImage(request));
    return;
  }

  // Handle fonts
  if (request.destination === 'font') {
    event.respondWith(handleFont(request));
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetchAndCache(request, STATIC_CACHE);
    })
  );
});

// Handle image requests
async function handleImage(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  return fetchAndCache(request, IMAGES_CACHE);
}

// Handle font requests
async function handleFont(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  return fetchAndCache(request, FONTS_CACHE);
}

// Fetch and cache function
async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (!response || response.status !== 200 || response.type !== 'basic') {
      return response;
    }

    const responseToCache = response.clone();
    const cache = await caches.open(cacheName);
    await cache.put(request, responseToCache);

    return response;
  } catch (error) {
    console.error('Fetch failed:', error);
    return new Response('Network error', { status: 408, statusText: 'Network error' });
  }
} 