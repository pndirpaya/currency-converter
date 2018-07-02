console.log('service works change 3')
let staticCacheName = 'currency-converter-static-v1';
//add static files to cache api
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(staticCacheName).then(cache => {
            cache.addAll([
                './',
                './sw.js',
                './js/app.js',
                './js/idb.js',
                './js/uikit-icons.min.js',
                './js/uikit.min.js',
                './css/uikit.min.css'
            ]);
        })
    );
});

// check the cache if files exist and serve them before making a fresh request
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.open(staticCacheName).then(cache => {
            return cache.match(event.request.url).then(response => {
                if (response) {
                    // console.log(response);
                    return response;
                }
                return fetch(event.request);
            });
        })
    );
});