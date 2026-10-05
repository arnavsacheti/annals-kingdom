# Deploying the two sites

Both sites are static files; the wiki host (princexizor.ddns.net) needs two server
blocks (nginx) or two site blocks (Caddy). The sim block is an **allowlist**: the repo
root also holds `.git`, `docs/`, `tools/`, `POLISH.md`, `lexicon/` and `maps-site/`, and
none of those may be served from the sim host. The maps block roots at `maps-site/`
only and denies dotfiles.

`node tools/lint-deploy.js` keeps this file honest: it starts `server.js`, requests the
example path of every row in the header table below and compares the three headers, then
evaluates the allowlist `location ~` regex of the sim block against the answer table.
Run it after editing this file or the header rules in `server.js`. `server.js` is the
single source of truth for headers; the nginx and Caddy blocks must reproduce it.

## Headers (one table, one source)

| path class | example path | Cache-Control | Content-Type | Content-Encoding |
|---|---|---|---|---|
| html | `/index.html` | `no-cache` | `text/html; charset=utf-8` | `gzip` |
| atlas html | `/maps-site/index.html` | `no-cache` | `text/html; charset=utf-8` | `gzip` |
| vendored library (versioned by path) | `/vendor/three.js/r128/three.min.js` | `public, max-age=31536000, immutable` | `text/javascript; charset=utf-8` | `gzip` |
| versioned raster (`?t=<TILES_V>`) | `/maps-site/tiles/0/0/0.jpg?t=1` | `public, max-age=31536000, immutable` | `image/jpeg` | `none` |
| unversioned raster | `/share.jpg` | `public, max-age=2592000` | `image/jpeg` | `none` |
| data json | `/maps-site/data/gazetteer.json` | `no-cache` | `application/json; charset=utf-8` | `gzip` |
| data geojson | `/maps-site/data/realms.geojson` | `no-cache` | `application/geo+json; charset=utf-8` | `gzip` |
| worker | `/sw.js` | `no-cache` | `text/javascript; charset=utf-8` | `gzip` |
| offline manifest | `/offline-manifest.json` | `no-cache` | `application/json; charset=utf-8` | `gzip` |

Rules in words: a versioned path (anything under `vendor/`, or any URL carrying `?t=`)
is `immutable` for a year; every mutable path (html, data json, `sw.js`,
`sw-kill.js`, `offline-manifest.json`) is `no-cache` and revalidates by ETag; unversioned
rasters get 30 days. Text types are gzipped; rasters are never recompressed.

**TILES_V rule.** The atlas stamps every raster under `tiles/`, `tiles-war/`,
`tiles-imperial/`, `charts/` and `art/` with `?t=<TILES_V>` (the `var TILES_V` in
`maps-site/index.html`). Because those URLs are immutable, a changed raster with an
unchanged `TILES_V` is served stale for a year: bump `TILES_V` in the same change that
touches any raster. `tools/offline-manifest.js --check` fails when a listed raster
changed and `TILES_V` did not. Vendored libraries are versioned by their path
(`vendor/three.js/r128/`); a new version gets a new directory, never an overwrite.

## sim.princexizor.ddns.net, the living world

Serves only the allowlist: `/`, `/index.html`, `/share.jpg`, `/vendor/**`, `/sw.js`,
`/sw-kill.js`, `/offline-manifest.json`. Anything else answers `index.html` (the fallback)
or 404, never a repo file. Dotfiles are refused first, so `/.git/HEAD` and
`/vendor/.x` are 404.

| request path | sim block answers |
|---|---|
| `/` | `file` |
| `/index.html` | `file` |
| `/vendor/three.js/r128/three.min.js` | `file` |
| `/sw.js` | `file` |
| `/.git/HEAD` | `index.html-or-404` |
| `/docs/a.md` | `index.html-or-404` |
| `/tools/street-drift.js` | `index.html-or-404` |
| `/POLISH.md` | `index.html-or-404` |
| `/lexicon/patrinaic.json` | `index.html-or-404` |
| `/maps-site/index.html` | `index.html-or-404` |

nginx (the `map` goes in the `http` context, for example `conf.d/annals-cache.conf`):

```nginx
map "$arg_t:$uri" $annals_cc {
  default                                   "no-cache";
  "~^[^:]+:"                                "public, max-age=31536000, immutable";
  "~^:/(.+/)?vendor/"                       "public, max-age=31536000, immutable";
  "~^:/.+\.(jpg|jpeg|png|webp|gif|ico)$"    "public, max-age=2592000";
}

server {
  listen 443 ssl http2;
  server_name sim.princexizor.ddns.net;
  # ssl_certificate / ssl_certificate_key from certbot
  root /path/to/annals-kingdom;
  index index.html;

  gzip on;
  gzip_vary on;
  gzip_min_length 256;
  gzip_types text/css text/plain text/javascript application/javascript application/json
             application/geo+json image/svg+xml application/manifest+json;

  add_header Cache-Control $annals_cc always;

  location ~ /\. { return 404; }
  location ~ ^/(index\.html|share\.jpg|sw\.js|sw-kill\.js|offline-manifest\.json|vendor/.+)?$ {
    try_files $uri $uri/ =404;
  }
  location / { try_files /index.html =404; }
}

server { listen 80; server_name sim.princexizor.ddns.net; return 301 https://$host$request_uri; }
```

The `location ~ ^/(...)?$` line is the allowlist the lint evaluates; keep it on one line.
Regex locations beat the prefix `location /`, so only the listed names reach the disk.

Caddy:

```caddy
sim.princexizor.ddns.net {
  root * /path/to/annals-kingdom
  encode gzip
  @dot path_regexp dot /\.
  respond @dot 404
  @allowed path / /index.html /share.jpg /sw.js /sw-kill.js /offline-manifest.json /vendor/*
  @versioned {
    query t=*
  }
  header {
    Cache-Control "no-cache"
  }
  header @versioned Cache-Control "public, max-age=31536000, immutable"
  header /vendor/* Cache-Control "public, max-age=31536000, immutable"
  header /share.jpg Cache-Control "public, max-age=2592000"
  handle @allowed {
    file_server
  }
  handle {
    rewrite * /index.html
    file_server
  }
}
```

Notes:
- The default seed is `epeshu`: the Marble City and Leponnia, traced from the
  campaign atlas, in the year 1374 A.B. Share any world with `#s=<seed>`.
- Three.js is vendored under `vendor/three.js/r128/` (no CDN at runtime once D4 lands).
- No build step, no server-side code. `server.js` is only for local preview.

## maps.princexizor.ddns.net, the interactive atlas

Roots at `maps-site/` only (Leaflet, tiles, data files, the vendored libraries). The
`map` above is shared; this block adds the dotfile denial and the same gzip set.

```nginx
server {
  listen 443 ssl http2;
  server_name maps.princexizor.ddns.net;
  root /path/to/annals-kingdom/maps-site;
  index index.html;

  gzip on;
  gzip_vary on;
  gzip_min_length 256;
  gzip_types text/css text/plain text/javascript application/javascript application/json
             application/geo+json image/svg+xml application/manifest+json;

  add_header Cache-Control $annals_cc always;

  location ~ /\. { return 404; }
  location / { try_files $uri $uri/ =404; }
}

server { listen 80; server_name maps.princexizor.ddns.net; return 301 https://$host$request_uri; }
```

Caddy:

```caddy
maps.princexizor.ddns.net {
  root * /path/to/annals-kingdom/maps-site
  encode gzip
  @dot path_regexp dot /\.
  respond @dot 404
  @versioned {
    query t=*
  }
  header Cache-Control "no-cache"
  header @versioned Cache-Control "public, max-age=31536000, immutable"
  header /vendor/* Cache-Control "public, max-age=31536000, immutable"
  file_server
}
```

Notes:
- `tiles/{z}/{x}/{y}.jpg` (zooms 0-4) are requested as `?t=<TILES_V>`; `data/*.json`
  and `*.geojson` are mutable and revalidate.
- Cross-links: the atlas header links to the wiki and the sim; add reciprocal links
  from the wiki nav if desired.

## HTTPS is required

Serve both hosts over HTTPS. Service workers, `navigator.storage.persist()` and the
screen wake lock only exist in a secure context; over plain http the sites still load but
the kept-for-the-table features are absent. Certbot or Caddy's automatic certificates
both do.

## Kill switch for the worker

If a bad `sw.js` ships, copy the kill worker over it on the server:

```sh
cp sw-kill.js sw.js        # in the sim root; maps-site/ likewise for the atlas worker
```

`sw.js` is `no-cache`, so every browser fetches the replacement on its next visit; the
kill worker unregisters itself and deletes every cache it can see. Then fix the real
`sw.js`, restore it, and bump the cache names it uses. Never give `sw.js` or
`sw-kill.js` a long `Cache-Control`.

## GitHub Pages (staging)

`.github/workflows/pages.yml` stages the sim at `/` and the atlas at `/maps-site/` of
`/annals-kingdom/`. Its "Stage sites" step copies `vendor`, `sw.js`, `sw-kill.js` and
`offline-manifest.json` only when they exist. Pages sets its own headers (about ten
minutes of caching, no immutable); the TILES_V rule still applies.

## DNS

Point both subdomains at the same host as the wiki (A/AAAA or CNAME), then reload
nginx/Caddy. HTTPS via your existing certbot/Caddy automation.
