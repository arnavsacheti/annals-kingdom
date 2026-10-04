# Deep dive: streamed streets — the 3D city post and the sim

Verified 2026-10-04: 9 tasks (4 web, 5 code). Each web claim got two adversarial lenses (source, refute) and each code
fact a mechanical anchor check. x.com is egress-blocked, so the post is **owner's paraphrase**. The full dossier with
votes and anchors is `../street/research-dossier.md`. It feeds the four Street jobs (`../street/README.md`), which sit
after the Filigree jobs, cite their rulings by id and never edit them. Code anchors are `index.html`, by pattern.

## Provenance: the post and its sources (medium)
- Best candidate `github.com/jeantimex/tokyo` ("Procedural-Tokyo", three.js): PLATEAU CityGML, GSI DEM and OSM compiled
  offline to 256 m binary tiles, streamed around the camera, meshed in Web Workers. **Not confirmed** as the post.
- Confirmed in that repo: facades by use, road markings, signals that **cycle**, a settings panel with clouds and a cars
  slider. Unread: cars that *obey* signals, a shadows toggle, any FPS figure, the "Opus 5.5" credit.
- Lookalike `tanuu5/tokyo-auto-drive`: a single-file three.js r128 demo with no open data; same genre, not the post.
- Sources of the methods below: 3DTilesRendererJS docs, the 3D Tiles spec, movsim (IDM), three.js source, FXMaster.

## Methods that port to r128, single file (high)
| method | verified source | the sim's route |
|---|---|---|
| refine by screen-space error `geomErr·H/(2d·tan(fov/2)) > ~16 px` | 3D Tiles / tiles renderer | hand-rolled off `CAM.radius` (the one zoom input) |
| bounded loading: ≤6 jobs, priority queue | tiles renderer `maxJobs` | a time-sliced main-thread queue, no Workers |
| LRU with hard caps that **stays coarse** when full | tiles renderer | a `Map` LRU with `dispose()` and a triangle cap |
| own culling | tiles renderer | `Frustum.intersectsSphere` per quad; `frustumCulled=false` on instanced meshes (r128 uses the base sphere) |
| 250 ms cross-fade on arrival | tiles fade plugin | opacity or dither on the patched Lambert; the same grammar as filigree R6 |
| vehicle spacing: IDM `calcAccDet` (piecewise free term; `calcAcc` adds noise) | movsim | spacing terms only, render-only, never integrated by frames |
| per-instance colour, manual `needsUpdate` | three.js | every `MAT.world` InstancedMesh carries instanceColor (a crash rule in the sim) |
| **not portable** | — | 3DTilesRendererJS (three ≥0.167), BatchedMesh (r170+), `THREE.LOD` hysteresis (dev only): copy methods, not libraries |

## What the sim already holds (code, high)
- **Caravans** are a pure function of the sim day (`routePos`); arrivals are day-ticked in `processArrivals(day)` and
  roll on `W.rng.hist`. A queue that moved an arrival would shift every later draw, so queueing is **render-only**.
- **Two clocks.** `renderTod` advances by `dt/300`; the sim day by speed. The dark hour (`const darkHour =`) is a
  function of the drawn sun, so gate leaves shut by the dark hour are presentation, never a hindrance to the caravans.
- **The seed parser** is the unanchored `location.hash.match(/s=([^&]+)/)` at two sites: any param ending in `s`
  (`notices=`, the filigree R12 key) is read as the seed, and the `'#s='` writers drop every other param.
- **Randomness**: the sim's keyed idiom is `makeStream(key)` = xmur3 → sfc32; it has **no** mulberry32 (the atlas does).
- **The near plane** is already dynamic: `camera.near = clamp(R*0.02, 0.5, 50)`.
- **Shadows**: `shadowsOn` is never set; `wantShadow` needs `degradeStep < 3`; the degrade ladder is one-way at
  smoothed fps < 42 and always trips under headless SwiftShader, so sandbox gates count, they do not time.
- **Street data exists**: `s.streets` (3.2–5.2 m), `s.buildings`, `s.gates`, `W.bridges`, Epēshu's labels (Epēshīn
  Forum, the Marble Quarter, Wood Quay, Whitestreet, Outwall …); the Blue Temple of Thobrauk on Wood Quay's north edge.
- **`ANNALS.stats()`** keys must not change: the filigree review compares it across loads.
- **Debts**: the omen eclipse lasts `performance.now()+20000`; precipitation, lightning and sheep use `Math.random`
  (render-only); none may be copied into street code.

## The bronze-age translation
| the post's piece | Nīmlad reading | driving state |
|---|---|---|
| timed crossings that hold vehicles | fords and one-lane bridges crossed in turn; toll halts held as a dwell; gate leaves shut while the drawn dark hour lasts | keyed stream on (seed, route, day); render-only |
| vehicle-following | caravan strings at donkey pace, bunching at the obstacles | closed form of (day, neighbours); arrival day never moves |
| crowd life | market crowds keyed by (seed, settlement, day), scaled by `s.pop`; no named market day | keyed stream |
| clouds / shadows / vehicles toggles | rows "clouds", "shadows" (today's look by default), "roads and folk"; no new keys; `street=1` default off | layers |
| weather effects | the cloud deck from `W.weather`; a four-step weather density dial; fog only through the R13 function | sim read + keyed stream |
| session overlays | the herald's tidings: shut ways and muster days from `notices=` (R12), after the parser fix | notice |
| procedural facades | mudbrick, plaster, stone; Epēshu's stone tier marble-pale | seeded gen |
| urban table scenes | **unsourced** (no grid, scale or capture spec): out of scope until the owner rules a battle sheet | — |

Player words: "the gates shut at the dark hour", caravan halts and waystations, toll halts; the shipped "cog" stays
but is not spread; "market ward" is a code term only.

## Budget (from `web-performance.md` and the sim)
- ~1.6M triangles and ~50 draw calls today; rAF work ≤10–15 ms; slice any task over 50 ms; no per-frame allocation.
- Smoothed fps below 42 trips the one-way degrade ladder for the whole app: the street view stays off by default until
  an owner device run passes.
- Shadow box 140 m at 2048² at street level; one 1500-point precipitation draw; DPR capped at 2 (1.6 on phones).
- Near detail is its own mesh, never part of the 700 ms settlement re-batch. Per-tier numbers are unmeasured: Street 1
  measures them under a virtual clock.

## Open questions
Post identity; whether canon shuts gates at the dark hour; Patrinaic words for gate, toll and market; Epēshu's
district layout (labels only today); a battle-sheet scale for table use; device fps on a phone.
