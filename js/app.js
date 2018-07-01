//make sure that Service Workers are supported.
if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => {
            // console.log(reg);
        })
        .catch(e => {
            // console.error(e);
        })
} else {
    console.log('Service Worker is not supported in this browser.');
}