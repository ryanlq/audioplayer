
const VERSION = "v1";
const CACHE_NAME = `pwamp-${VERSION}`;

// Those are all the resources our app needs to work.
// We'll cache them on install.
let INITIAL_CACHED_RESOURCES = [
  "./",
  "./index.html",
  "./skins/default.css",
  "./skins/preload.css",
  "./about.css",
  "./my.css",
  "./imgs/default.svg",
  "./app.js",
  "./audio-metadata-parse-worker.js",
  "./libs/exporter.js",
  "./libs/file-launch-handler.js",
  "./libs/importer.js",
  "./index.html",
  "./libs/keys.js",
  "./media-session.js",
  "./libs/parseAudioMetadata.js",
  "./libs/player.js",
  "./libs/popup-polyfill.js",
  "./libs/protocol-launch-handler.js",
  "./libs/recorder.js",
  "./libs/share-target-launch-handler.js",
  "./libs/skin.js",
  "./libs/song-ui-factory.js",
  "./libs/store.js",
  "./libs/utils.js",
  "./libs/lyric.js",
  "./icon/favicon.png",
  "./libs/visualizer.js",
  "./widgets/mini-player.json",
  "./widgets/mini-player-data.json",
  "./libs/Speaker.js",
  "./libs/LyricParser.js",
  "./libs/readlocalfile.js",
  "./libs/idb-keyval.js",
  "./imgs/0.jpg",
  "./imgs/1.jpg",
  "./imgs/2.jpg",
  "./imgs/3.jpg",
  "./imgs/4.jpg",
  "./imgs/5.jpg",
  "./imgs/6.jpg",
  "./imgs/7.jpg",
  "./imgs/8.jpg",
  "./imgs/9.jpg",
  "./imgs/10.jpg",
  "./imgs/11.jpg",
  "./imgs/12.jpg",
  "./imgs/13.jpg",
  "./imgs/14.jpg",
  "./imgs/15.jpg",
  "./imgs/16.jpg",
  "./imgs/0.jpg",
  "./imgs/mobile/1.jpg",
  "./imgs/mobile/2.jpg",
  "./imgs/mobile/3.jpg",
  "./imgs/mobile/4.jpg",
  "./imgs/mobile/5.jpg",
  "./imgs/mobile/6.jpg",
  "./imgs/mobile/7.jpg",
  "./imgs/mobile/8.jpg",
  "./imgs/mobile/9.jpg",
  "./imgs/mobile/10.jpg",
  "./imgs/mobile/11.jpg",
  "./imgs/mobile/12.jpg",
  "./imgs/mobile/13.jpg",
  "./imgs/mobile/14.jpg",
  "./imgs/mobile/15.jpg",
  "./imgs/mobile/16.jpg",
  "./imgs/add.svg",
  "./imgs/play.svg",
  "./imgs/pause.svg",
  "./imgs/prev.svg",
  "./imgs/next.svg",
  "./imgs/lyric.png",
];
// Add a cache-busting query string to the pre-cached resources.
// This is to avoid loading these resources from the disk cache.
const INITIAL_CACHED_RESOURCES_WITH_VERSIONS = INITIAL_CACHED_RESOURCES.map(path => {
  return `${path}?v=${VERSION}`;
});

// On install, fill the cache with all the resources we know we need.
// Install happens when the app is used for the first time, or when a
// new version of the SW is detected by the browser.
// In the latter case, the old SW is kept around until the new one is
// activated by a new client.
self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    var uniqueUrls = [...new Set(INITIAL_CACHED_RESOURCES_WITH_VERSIONS)]; 
    cache.addAll(uniqueUrls);
  })());
});

// Activate happens after install, either when the app is used for the
// first time, or when a new version of the SW was installed.
// We use the activate event to delete old caches and avoid running out of space.
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(name => {
      if (name !== CACHE_NAME) {
        return caches.delete(name);
      }
    }));
    await clients.claim();
  })());
});

// Main fetch handler.
// A cache-first strategy is used, with a fallback to the network.
// The static resources fetched here will not have the cache-busting query
// string. So we need to add it to match the cache.
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Don't care about other-origin URLs.
  if (url.origin !== location.origin) {
    return;
  }

  // Don't care about anything else than GET.
  if (event.request.method !== 'GET') {
    return;
  }

  // Don't care about widget requests.
  if (url.pathname.includes("/widgets/")) {
    return;
  }

  // On fetch, go to the cache first, and then network.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const versionedUrl = `${event.request.url}?v=${VERSION}`;
    const cachedResponse = await cache.match(versionedUrl);

    if (cachedResponse) {
      return cachedResponse;
    } else {
      const fetchResponse = await fetch(versionedUrl);
      cache.put(versionedUrl, fetchResponse.clone());
      return fetchResponse;
    }
  })());
});

// Special fetch handler for song file sharing.
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'POST' || !url.pathname.includes('/handle-shared-song')) {
    return;
  }

  // Immediately redirect to the start URL, there's nothing to see here.
  event.respondWith(Response.redirect('./'));

  event.waitUntil(async function () {
    const data = await event.request.formData();
    const files = data.getAll('audioFiles');

    // Store the song in a special IDB place for the front-end to pick up later
    // when it starts.
    // Instead of importing idb-keyval here, we just have a few lines of manual
    // IDB code, to store the file in the same keyval store that idb-keyval uses.
    const openReq = indexedDB.open('keyval-store');
    openReq.onupgradeneeded = e => {
      const { target: { result: db } } = e;
      db.createObjectStore("keyval");
    }
    openReq.onsuccess = e => {
      const { target: { result: db } } = e;
      const transaction = db.transaction("keyval", "readwrite");
      const store = transaction.objectStore("keyval");
      store.put(files, 'handle-shared-files');
    }
  }());
});

// Handle the mini-player widget updates in another script.
importScripts('./sw-widgets.js');
