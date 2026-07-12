# Deploying the two sites

Both sites are static; the wiki host (princexizor.ddns.net) just needs two more
server blocks (or Caddy site blocks) pointing at this repo.

## sim.princexizor.ddns.net — the living world
Serves the repo root (`index.html` is self-contained; three.js loads from CDN).

```nginx
server {
  server_name sim.princexizor.ddns.net;
  root /path/to/annals-kingdom;
  index index.html;
  location / { try_files $uri /index.html; }
}
```

Caddy: `sim.princexizor.ddns.net { root * /path/to/annals-kingdom  file_server }`

Notes:
- The default seed is `epeshu` — the Marble City and Leponnia, traced from the
  campaign atlas, in the year 1374 A.B. Share any world with `#s=<seed>`.
- `M` opens the world map (players can flip between the sim's chart and the
  campaign atlas art); the minimap bottom-left shows where the camera is.
- No build step, no server-side code. `server.js` is only for local preview.

## maps.princexizor.ddns.net — the interactive atlas
Serves the `maps-site/` folder (Leaflet + pre-tiled PatrinorModern + data files).

```nginx
server {
  server_name maps.princexizor.ddns.net;
  root /path/to/annals-kingdom/maps-site;
  index index.html;
  location /tiles/ { expires 30d; }
}
```

Caddy: `maps.princexizor.ddns.net { root * /path/to/annals-kingdom/maps-site  file_server }`

Notes:
- Everything is static: `tiles/{z}/{x}/{y}.jpg` (zooms 0–4), `data/*.json`
  (markers, wiki excerpts, player reviews, party route, realm boundaries).
- Cross-links: the atlas header links to the wiki and the sim; add reciprocal
  links from the wiki nav if desired.

## DNS
Point both subdomains at the same host as the wiki (A/AAAA or CNAME), then
reload nginx/Caddy. HTTPS via your existing certbot/Caddy automation.
