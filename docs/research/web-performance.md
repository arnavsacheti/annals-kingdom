# Deep dive: web performance for the sim and the atlas

Fully verified 2026-07-16 (99 agents, 11 synthesized findings; 5 claims refuted).
Applied to index.html (three.js r128, ~1.6M tris, ~50 draw calls) and the
maps-site tile atlas.

## Frame budgeting (the sim's rAF loop) — all high-confidence
- Everything — JS, layout, paint, browser overhead — shares ~16 ms at 60 Hz;
  keep rAF callbacks under ~15 ms (modern web.dev guidance tightens to ~10 ms,
  and 120 Hz displays halve the budget). rAF is the only correct clock.
- **Steady beats fast**: perception keys on frame-time *variance*, not rate; rAF
  quantizes to divisors under load, and a locked 30 Hz reads better than 60 Hz
  with drops. Deliberate throttling (capping sim work per frame) is the right
  response on weak devices.
- Main-thread contention (input, fetch processing, timers) blocks rAF for
  hundreds of ms on mobile — keep heavy work chunked per-frame (as `simAdvance`
  catch-up already is) or in Workers. Modern corollaries, confirmed: **INP**
  (Core Web Vital since March 2024) penalizes >50 ms tasks; the **Long Animation
  Frames API** (Chrome 2024) attributes rAF overruns — this supersedes the old
  DevTools "Frames mode" workflow (that claim was refuted as outdated tooling).

## three.js scene costs
- Draw calls are the #1 CPU-bound cost; remedies: mesh merging + instancing
  (confirmed measurements: 9,000→300 calls via instancing; 10k separate meshes
  at 15 fps vs one InstancedMesh at 60 fps). The sim's merged-geometry
  architecture at ~50 calls is healthy.
- Per-frame allocations → GC hitches: pool vectors/matrices in hot paths.
  (Qualified: V8's concurrent GC reduced but didn't eliminate pauses.)
- Prefer vertex-shader work over fragment where interpolation permits
  (inverts if vertex-bound).
- Diagnostics: **Spector.js** (BabylonJS-maintained; WebGL only) for per-draw-
  call state + JS stacks; **EXT_disjoint_timer_query** for non-stalling GPU
  timing but effectively **Chromium-only** (2-1 vote; WebGL1 variant removed in
  2018 over timing side-channels). Refuted: "chrome://tracing rendering preset"
  as the recommended GPU-bound diagnostic.

## Leaflet tile knobs (v1.9.4, confirmed from source)
- `updateWhenIdle` defaults true on mobile, false on desktop — don't fight it.
- `keepBuffer: 2` is a *retention* ring, not proactive preloading (core Leaflet
  has no preload option).
- `updateInterval` (200 ms) + `updateWhenZooming: false` throttle re-tiling —
  cheapest smoothness win.
- `detectRetina` **quadruples tile requests** (four half-size tiles one zoom
  deeper) — a bandwidth-for-sharpness trade; needs pyramid depth to spare.
- Vector paths render as SVG DOM by default; `preferCanvas: true` for our many
  traced roads/rivers/region polygons.

## Raster atlas pipeline (now confirmed, 3-0 ×4)
Pre-tile PatrinorModern.png with **gdal2tiles-leaflet** (`-l` puts [0,0] at the
NW corner, matching Leaflet's XYZ scheme) + **leaflet-rastercoords** for
pixel-space marker authoring; needed depth = ceil(log2(max(w,h)/256)) → **zoom
0-5** for 4390×2188; cap the layer with `maxNativeZoom` so deeper zooms upscale
instead of 404ing. (The over-absolute "requires/is done by" phrasings of these
same facts were refuted — rastercoords is the documented convenience, not the
only way; `noWrap`/`bounds` are good hygiene, not correctness requirements.)

## Open questions (no claims survived — genuinely unanswered)
- three.js LOD / texture atlasing / occlusion culling best practices, and what
  `renderer.info` exposes — the whole culling corner came back empty.
- **Single-file HTML tradeoffs** (embedded base64 vs fetched assets: parse time,
  memory, cacheability, LCP/INP) — directly relevant to index.html's embedded
  heightfield/art URIs; nobody has published measurements worth citing.
- Large static JSON strategies (compression, streaming, chunked fetch,
  IndexedDB) and the payload sizes where each pays off.
- Detecting/adapting to mobile GPU thermal throttling (beyond observed
  frame-time regression; compute-pressure API unproven).
