/* Bibiliya Yera service worker.
 *
 * Lets the app (and the website) OPEN without internet, so chapters the person
 * has downloaded can be read and heard offline.
 *
 *  - Pages (index.html, privacy.html): network first, so updates always show up
 *    right away; if the network fails or is very slow, the last saved copy is used.
 *  - Small files (images, verse list): saved on first use and served
 *    from the saved copy next time, refreshed quietly in the background.
 *  - Audio is NOT handled here. Online it streams normally; downloaded audio is
 *    kept by the page itself (Cache Storage) and played from there.
 */
var SHELL = 'bibiliya-shell-v4';
var SHELL_FILES = [
  'index.html',
  'data/daily-verses.json',
  'data/fr/daily-verses.json',
  'data/en/daily-verses.json',
  'images/bible-cover.jpg',
  'images/now-playing.jpg',
  'images/daily/1-sunrise-ridge.jpg',
  'images/daily/2-mountain-lake.jpg',
  'images/daily/3-cross-sunset.jpg',
  'images/daily/4-beach-sunrise.jpg',
  'images/daily/5-misty-valley.jpg',
  'images/daily/6-waterfall.jpg',
  'images/daily/7-purple-dusk.jpg',
  'images/daily/8-mountain-trail.jpg',
  'images/daily/9-lake-dock.jpg'
];
var PAGE_TIMEOUT_MS = 4000;

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(SHELL).then(function (c) {
      return Promise.all(SHELL_FILES.map(function (u) { return c.add(u).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k.indexOf('bibiliya-shell-') === 0 && k !== SHELL;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function pageKey(url) {
  var u = new URL(url);
  var p = u.pathname;
  if (/\/$/.test(p)) p += 'index.html';
  return u.origin + p;                         // ignore ?query and #hash
}

function withTimeout(promise, ms) {
  return new Promise(function (resolve, reject) {
    var t = setTimeout(function () { reject(new Error('timeout')); }, ms);
    promise.then(function (v) { clearTimeout(t); resolve(v); }, function (err) { clearTimeout(t); reject(err); });
  });
}

function networkFirstPage(req) {
  var key = pageKey(req.url);
  var net = fetch(req);
  return withTimeout(net, PAGE_TIMEOUT_MS).then(function (resp) {
    if (resp && resp.ok) {
      var copy = resp.clone();
      caches.open(SHELL).then(function (c) { c.put(key, copy); });
    }
    return resp;
  }).catch(function () {
    return caches.match(key).then(function (hit) {
      if (hit) {
        // keep the slow request going so the saved copy still gets refreshed
        net.then(function (resp) {
          if (resp && resp.ok) caches.open(SHELL).then(function (c) { c.put(key, resp.clone()); });
        }).catch(function () {});
        return hit;
      }
      return caches.match(new URL('index.html', self.registration.scope).href).then(function (home) {
        return home || net;
      });
    });
  });
}

function staleWhileRevalidate(req) {
  return caches.match(req).then(function (cached) {
    var net = fetch(req).then(function (resp) {
      if (resp && resp.ok && resp.status === 200) {
        var copy = resp.clone();
        caches.open(SHELL).then(function (c) { c.put(req, copy); });
      }
      return resp;
    }).catch(function () { return cached; });
    return cached || net;
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (/\/audio\//.test(url.pathname)) return;     // audio: never touched here
  // The Bible text, the book list and the search index are saved and read by the page
  // itself (so it also works on iPhone, where this worker may be unavailable).
  if (/\/data\/(?:[a-z]{2}\/)?(books\/|index\.json|search-index\.json)/.test(url.pathname)) return;
  if (req.headers.has('range')) return;
  if (req.mode === 'navigate') { e.respondWith(networkFirstPage(req)); return; }
  e.respondWith(staleWhileRevalidate(req));
});
