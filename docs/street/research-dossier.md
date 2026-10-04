# Streamed street detail — the 3D Tokyo post and the sim

Verified 2026-10-04 from 9 tasks: 4 web and 5 code. Each web claim got two adversarial lenses (source and refute).
Each code fact got a mechanical anchor check, and the disputed anchors were re-grepped for this digest. x.com is
egress-blocked, so the post itself is **owner's paraphrase**. PLATEAU, MLIT, GSI, Wikipedia and Owlbear docs are
blocked too. A web finding survives here only if no lens refuted it, with any "partly" corrections applied. This
feeds the DnD-map todo next to the four Filigree jobs (`../filigree/README.md`). Unless prefixed, code anchors are
`index.html`.

## 1. What the post is
- **Unread.** The author, date, link and any FPS numbers are all unknown.
- **Best candidate (medium): `github.com/jeantimex/tokyo`**, README title "Procedural-Tokyo", a three.js driving
  game.
  - It compiles Project PLATEAU (CityGML, incl. `tran`), GSI DEM tiles and OSM roads/rail (ODbL), plus Poly Haven
    CC0 textures.
  - Commits are dated 3–4 Oct 2026. Those are the first page of the log, not necessarily the repo's start.
  - It is **not confirmed** to be the post's project.
- **Not confirmed from the repo:** the "Opus 5.5" link and Claude co-authorship. The README never mentions an AI.
- **Lookalike (high):** `tanuu5/tokyo-auto-drive` is a single-file three.js r128 drive demo credited to Opus 5.5 on
  Claude Cowork. It has no PLATEAU, OSM or GSI data, so it is not the post. It does show the genre and the same
  single-file r128 shape as the Annals.

| owner's paraphrase | status |
|---|---|
| PLATEAU + OSM + GSI compiled to streaming tiles | **confirmed** in the candidate repo |
| procedural facades, road markings | **confirmed** |
| traffic that obeys signals | **signals cycle** (README). Cars follow expressway ramps (commit). That cars *obey* signals is **unread** |
| toggles for clouds, shadows, traffic | **partly**. Commits show a settings panel: clouds (off by default), a cars slider, headlight strength, an info-panel checkbox, and a whole-city/progressive view toggle. **No shadows toggle was seen** |
| nearer camera brings higher fidelity, high FPS | **partly**: tiles stream around the camera, trees swap near/far, shadows scale with the view. No FPS figures were read |
| aerial photos | unread in the repo. GSI seamlessphoto exists (low) |

## 2. Verified findings
| # | finding | conf. | votes (src/ref) | source |
|---|---|---|---|---|
| T1 | An offline compiler turns raw records into binary 256 m tiles. The client streams them around the camera and meshes them in Web Workers (`src/world/meshing.js`, `src/shared/tileformat.js`, `public/tiles/<area>/`). The README names BoundlessNYC as the pattern's origin; **README-only**, with no separate source read | high | ✓/✓ | jeantimex README |
| T2 | Walls are textured by use: tile, concrete panel, plaster, brick tile and metal siding. Windows have frames, mullions and interior-mapped rooms. Roads carry lane lines, zebras and stop lines. Trees are ez-tree up close and simple shapes far away. The sky is procedural with clouds. Sun shadows scale with the view | high | ✓/✓ | same |
| T3 | Signals cycle (`src/world/props.js`). Vehicles, trains, headlamps and white birds exist. Controls: drag, WASD, N for day/night, `?night=1`, `?radius=` | med | ~/~ | README + commits |
| S1 | 3DTilesRendererJS 0.5.3 needs three ≥0.167 (dev 0.185). Its byte budgets need r166+ and BatchedTilesPlugin r170+. It **cannot be dropped into r128**, so only the algorithm ports | high | ✓/✓ | package.json, plugins API.md |
| S2 | Refinement is by screen-space error: `errorTarget` 16 px, optional distance falloff, `maxDepth` ∞ | high | ✓/✓ | core API.md |
| S3 | Loads go through priority queues, with `maxJobs` 6 and `maxJobsPerOrigin` 6 (cite API.md only) | high | ~/✓ | core API.md |
| S4 | The LRU holds 6000/8000 items and about 322/430 MB, `unloadPercent` 0.05, and records a `refused` stat. Caps are hard: when full, the view **stays at coarser tiles** rather than stalling | high | ✓/✓ | API.md, README |
| S5 | The renderer does its own culling (`frustumCulled=false`), keeps `loadSiblings` on, and hides active tiles that leave the frustum | high | ✓/✓ | three API.md |
| S6 | Tiles cross-fade over 250 ms, popping beyond 50 fading tiles. UnloadTiles frees GPU memory after a delay. Batched tiles need r170+ and cannot be combined with the fade | high | ✓/✓ | plugins API.md |
| S7 | XYZ overlay defaults: 20 levels, 256 px tiles, EPSG:3857. Quantized-mesh skirts default to the tile's geometric error. PLATEAU appears as a README example, not a formal list | high | ~/~ | README, API.md |
| S8 | plateau-gis-converter reads CityGML 2.0 and writes 3D Tiles, MVT, glTF, OBJ, GeoJSON and similar formats | med | ~/? | converter repo |
| M1 | IDM car-following: `s* = s0 + max(0, vT + v·Δv/(2√(ab)))`, `accInt = −a(s*/max(s,s0))²`, clamped at −bmax. accFree is **piecewise**: `a(1−(v/v0)^4)` below v0 and `a(1−v/v0)` at or above it. Use `calcAccDet`; `calcAcc` adds `Math.random()` noise | high | ~/✓ | movsim models.js |
| M2 | movsim updates in order: accelerations, then lane changes, then speeds and positions. Its dt is **tied to a 30 fps target** × time-lapse, so it is *not* decoupled. The Annals needs a constant dt stepped from a sim-time accumulator | high | ✓/~ | movsim README |
| M3 | A red light becomes virtual stationary obstacles in every lane, and the ordinary gap term does the stopping. The phase cycle is inference | med | ✓/✓ | movsim README |
| M4 | InstancedMesh stores 16 matrix floats and 3 colour floats per instance, and `needsUpdate` is manual. **On r128** there is no per-instance bounding sphere: culling uses the base geometry's sphere, so set `frustumCulled=false` and cull manually (as the sim already does) | high | ✓/~ | three dev source + r128 note |
| M5 | `THREE.LOD` swaps by distance. Per-level hysteresis is **dev-only**: r128's `addLevel(obj, dist)` has none, so hand-roll it | med | ✓/~ | LOD.js (dev) |
| V1 | 3D Tiles: geometric error in metres becomes an SSE, and a tile refines past its threshold. REPLACE swaps the parent out. ADD draws children over the parent, and children inherit the mode | high | ✓/✓ | 3D Tiles spec |
| V2 | `viewerRequestVolume` gates a tile's request and refinement on the viewer's position. A geometricError of 0 inside the volume means always rendered. Using it for the party's position is inference | high | ~/~ | spec |
| V3 | FXMaster splits effects into two lanes. Particles come in Weather, Ambient and Animals groups. Whole-scene filters are bloom, color, fog, lightning, oldfilm, predator, underwater and screenShake (README l.884). Fog also exists as an ambient particle | high | ~/✓ | FXMaster README |
| V4 | Particle density follows Foundry's client Performance Mode (100/75/50/25%). Regions with Suppress Weather and tiles with Restricts Weather (e.g. roofs) mask it | high | ~/✓ | same |
| V5 | FXMaster V8 uses Foundry V14 Scene Levels. Tokens POV, Specific Tokens POV and Always Visible for GM are Region-behaviour options. The macro API has `effects.play/stop/toggle(toggleKey)` and `presets.toggle`. Applying it to session overlays is inference | high | ~/~ | same |
| V6 | Watabou's city link is reproducible from `size` + `seed`. The open-source copy lacks waterbodies and the options UI | med | ✓/✓ | TownGeneratorOS README |

Low-confidence leads (unverifiable by both lenses, so **do not spec from them**):
- **GSI tiles:** `cyberjapandata…/xyz/dem_png/{z}/{x}/{y}.png` (dem5a/5b at z15, dem10b at z14) and `seamlessphoto/…jpg`.
- **Alternative matches for the post:** `kolom1234/tokyoOpenWorld` PR#18 (crowds and signals) and
  `webtrackerxy/3d-city-million-cars`.
- **Procedural facades:** shader window grids and impostors. The linegel skill exists but targets r185
  WebGPU/TSL and prefers merged geometry or BatchedMesh for facades.
- **Cities: Skylines:** a near model plus an auto or hand-made low-poly far LOD, typically 10–100 triangles.
- **Old Assyrian caravans:** 10–50 donkeys over about 1200 km. Merchants lived in a *kārum* outside the walls.
  Taxes were levied by the states along the route.

## 3. Refuted / corrected
- **"No user-facing toggles" in the repo:** refuted. There is a settings panel with clouds and a cars slider. The
  shadows toggle is still unseen.
- **"Vehicles obey signals":** unsupported. Only "signals cycle" was read.
- **"Claude co-authored", "Opus 5.5":** unverified. Do not assert either.
- **Unverified repo details:** the `tools/pipeline/markings.mjs` path, lane arrows, painted speed limits and
  "image-based ambient light". Flag them; the dropped items are not in T2.
- **"movsim dt decoupled from render"** → it is derived from a 30 fps target.
- **"InstancedMesh bounding sphere must be recomputed or culling breaks"** → overstated, and on r128 it does not
  apply.
- **"LOD hysteresis"** is from the dev branch, not r128.
- **3DTilesRendererJS:**
  - "built to `build/index.three.js`" → its main entry is `src/index.js` (ES modules) with conditional exports.
  - The README queue-list citation is dropped.
- **viewerRequestVolume "allows prefetching"** → dropped. That is inference, not spec text.
- **C:S "≈1/5 triangles", "two discrete LODs"** → dropped.
- **Kanesh "tolls on arrival, en route, departure"** → only "taxes in the states passed through" is supported.
- **Code anchor corrections** (re-grepped):
  - caravan speed: `:3616` (not 3609);
  - shadow extent: `:6234`;
  - filigree R6 at `filigree-1-research.js:51`, R7 at `:52`, **R10 at `:55`** (the audit gave 52);
  - shut-ways list at `todo-inputs.json:217`;
  - `W.rng.amb` defined at `:7161`.
- **Carried-over anchors:** in `docs/filigree/todo-inputs.json` the sim anchors (3694, 3511, 3871, 5831) have
  drifted. Re-anchor them by pattern.

## 4. Pipeline pieces → three.js r128, single file
| piece | Tokyo | r128 / no-build route | sim today | gap |
|---|---|---|---|---|
| tiling | offline compile → 256 m binary tiles | Generate quads from the seed at runtime: a pure function of (seed, quad). No tile files | Trees are the only "chunks": 6×6 at 1500 m (`:501`, `:3170-3178`) | a quadtree for street detail around the focus |
| refine rule | SSE / near-far swap | Hand-rolled SSE: `geomErr·H/(2d·tan(fov/2)) > ~16 px`, keyed off `CAM.radius` | Settlement hi/lo swap at 2400/2200 (`:7265-7266`). Labels by R (`:3288-3295`). Water detail fades over 320–850 and 900–2200 (`:2312-2315`) | mid tiers; per-building gating |
| build budget | Worker meshing | Time-sliced main-thread queue (≤6 jobs, ms budget per frame). A Worker from a Blob is possible but would duplicate gen code | Rebuilds throttled to 700 ms settlement, 2.5 s roads, 1.2/4.5 s overlay, 1.5 s rivers (`:7279-7296`). No workers | a per-frame ms budget |
| eviction | LRU (`refused` ⇒ stay coarse) | A `Map` LRU of built quads with `geometry.dispose()` | Dispose discipline for settlement, road and agent meshes (`:3077`) | an LRU and a byte or tri cap |
| culling | own frustum cull | `Frustum.intersectsSphere` per quad group | Manual chunk cull (`:7262`). Rocks, sheep and birds are never culled (`:3202`, `:4405`, `:4434`) | per-quad cull; cull rocks and sheep |
| fade-in | 250 ms cross-fade | Opacity/dither via the existing patched Lambert (`onBeforeCompile`) | none: binary pop | ≤250 ms ease, matching R6 |
| facades | material by use; mullions; interior maps | Vertex-colour quads by archetype × tier, near-only | 12 archetypes (`:1543`); tier → wattle, plaster or stone (`:2702-2711`); 4 cached variants (`:2926`); flat window quads with night glow (`:825-836`, `:728-730`) | near-only door/lintel/course detail; more variants; Epēshu marble |
| road marking | lane lines, zebras | Ruts, kerbs, gate thresholds and market-paving ribbons | Three-band street ribbon at +0.55; only the capital is cobbled (`:2623-2655`, `:2673`) | near-only surface detail |
| repeated props | instanced trees, cars | `InstancedMesh` + **instanceColor** (required on `MAT.world`, `:3208`) | Four InstancedMesh sites (`:3178`, `:3202`, `:4405`, `:4434`); props merged into the hi mesh (`:1883-1900`) | instanced stalls, carts, crowds |
| traffic | cars, trains, signals cycle | **Render-only** IDM-style queueing: the visual offset is a stateless f(seed, day, neighbours) and the arrival day stays `routePos` = f(day) (`:3647`). No render frame feeds an accumulator. (Otherwise the IDM must step inside the sim tick at a fixed sim-dt and draw from no shared stream.) Gate/bridge obstacles on a keyed-hash schedule (`calcAccDet`) | Caravans and cogs are pure functions of sim day (`:3647`), at 300/480 m per day (`:3616`), and overlap freely. Arrival rolls on `W.rng.hist` (plague `:3738`, trade chronicle `:3748`, ambush `:5228`) would shift if queueing moved an arrival day | queueing, dwell, right of way |
| sky / clouds | procedural sky + clouds | A cloud-shadow and cloud-deck layer from W.weather; placement is a keyed hash (xmur3(seed + class + id + day) → mulberry32 (the R9 pattern, `filigree-1-research.js:54`)), never a stream draw (`W.rng.amb` per-frame draws, `:7161`, would tie the view to frame rate) | No cloud layer. Overcast only dims light (`:6214`). Fog far-plane ×0.72 rain, ×0.8 snow (`:6254`) | clouds; fog as weather |
| shadows | sun shadows scale with view | already done; the toggle must also respect `degradeStep`: `wantShadow` needs `degradeStep<3` (`:6231`), and the one-way ladder reaches step 3 at `:7332-7334`, after which turning it on does nothing. The row says so | Gated `R<1650`, extent `clamp(R·1.6,140,1600)` (`:6231`, `:6234`), 2048² PCFSoft (`:7179`) | the `shadowsOn` toggle is never set (`:6166`) |
| layer UI | settings panel | Layers rows plus hash keys, default off. New keys cannot reuse taken letters: **C is watch mode** (`:6112`); H, L, F, T, G and M are also taken (`:6108-6114`), plus space, 1-5 and Escape. Pick free keys after checking the camera key handlers, or use rows only | L/F/H/T/C/G/M keys and the overlay menu (`:6108-6114`, `:426-429`). No tree, cloud, shadow, traffic or weather toggle | a layers panel |
| terrain / drape | GSI elevation (DEM) and aerial photos; the owner's clause. Repo use unread | No new data: the existing heightfield grid (`N=768`, CELL ≈ 11.72 m, `:492`) and the authored Epēshu heightfield (`:7578`); `PatrinorModern.png` is the "aerial" drape. Sub-cell relief, if any, is a deterministic f(seed, cell). **R22** (`filigree-1-research.js:67`): no relief is invented outside the `EPESHU_HF` window | Heightfield `:492`, `:7578`; atlas PNG | street detail at R≈9 m sits on 11.72 m cells; needs sub-cell ground height that agrees with the grid |
| agent LOD (vehicles) | vehicles gain detail as the camera nears (owner: "buildings and vehicles") | Far dot or impostor → the current mesh → near IDM-spaced individual animals (render-only offsets, keyed hashes), swapped with a hand-rolled hysteresis band (M5) | Caravans are one fixed mesh at every distance: three pack animals plus a drover (`:3584`) | no far or near tier; near-fidelity rows cover buildings only |
| VTT scene | **unsourced** | Nothing read covers table scale: no square or hex grid overlay, no top-down orthographic capture or export, no token or fog-of-war hand-off. Every VTT source is Foundry/FXMaster (V3–V5); Owlbear was blocked | none | the owner's headline use case has no spec; see §8 |
| near plane | – | Review near=2 / far=30000 for sub-metre detail (`:2214`) | Orbit R 9…11000 log-linear (`:5949`) | depth precision at street level |

## 5. Bronze-age translation
- **"Traffic obeys signals" → ways that open and shut.** Each closure is a virtual stationary obstacle (M3) on a
  caravan's route, on a schedule that is a keyed hash, xmur3(seed + class + id + day) → mulberry32 (the R9 pattern, `filigree-1-research.js:54`), never a draw from `W.rng.hist`/`gen`/`det` (that alters the world). Render-only, so closures shape the visual queue and never move an arrival day:
  - **town gates**, shut through Tamar's dark hour (player-facing: "gates shut at the dark hour"; "curfew" is medieval civic vocabulary and stays out). `darkHour` is a pure function of sun direction
    (`:6197`), but it is driven by `renderTod`, which is **render time, not sim time** (`:7276`). A sim-side gate schedule
    must derive the dark hour from `W.clock.day`;
  - **one-lane bridges and fords**, using a token: the first to arrive crosses, the rest queue;
  - **toll halts**, held as a dwell time. Today tolls are settled on arrival only (`:3737`);
  - **market days**, when crowds slow a ward.

  Queueing follows from IDM gaps (large `s0` and `T`, donkey-pace `v0`). **Constraint, not a question:** it is render-only. A constant-dt accumulator fed by render frames makes the step count depend on frame rate, and a queue that moves an arrival day shifts every later `W.rng.hist` draw (`:3738`, `:3748`, `:5228`), so `simDays(400)` would depend on how the run was viewed. Caravans today never see one another
  (`:5228` is the only interaction, bandit ambush).
- **Words.** "Market ward" stays a code term only. "Cog" is a medieval ship-type already in shipped prose (`:3404`); note it as existing and do not spread it into new prose.
- **Crowds.** There are no pedestrians today. Population is a scalar, and the nearest thing to life is hearth smoke
  under `R<420` (`:4486`). Near-only instanced figures could be placed by a keyed hash of (seed, settlement, day), not a stream, and scaled by `s.pop`
  and the market ward (dd<0.30, `:1664-1694`).
- **The Tokyo toggles → sim layers.**

  | Tokyo toggle | sim layer |
  |---|---|
  | clouds | a new cloud-deck/shadow layer driven by `W.weather` (`:3464`, rolled at `:5013`), placement by keyed hash |
  | shadows | wire up the dead `shadowsOn` |
  | traffic | caravans, cogs and armies (`:3609-3616`, `:4571`), plus crowds and sheep (`:4453`) |
  | – | the existing overlay modes stay as they are (Trade is the closest to "traffic density", from `W.routeVolume`) |

- **Weather.** `W.weather` is global, with no fog (`:3464`). R13 rules that fog is a seeded function of (place,
  notices-snapshot sim day), with no new sim weather state and never wall-clock (`filigree-1-research.js:58`). A 3D
  fog or mist effect **must call the same function** the atlas uses.
- **Weather density.** Use a quality dial, after FXMaster's 100/75/50/25%. Mask it under roofs, colonnades and
  halls.
- **Session overlays.**
  - **Shut ways** (`todo-inputs.json:217`) and **muster days** (`:194`) load as notices via `notices=<url>` or a
    file import, outside the release (R12, `:57`). They render as barriers and closures and as dark-hour or levy
    lighting (muster days include dragon flights, `docs/filigree/todo-inputs.json:199`; the dragon myth line is `:5390`). Player-facing label: "the herald's tidings" (R12, `filigree-1-research.js:57`).
  - **Party presence.** There is no party entity today (`:3663` CAM.follow is the only hook). Model it as a
    viewer-request volume (V2): detail is built only near the party.
- **Determinism debts to fix before any of this ships:**
  - The omen eclipse lasts `performance.now()+20000` inside `tickOmens` (`:5328`), a hard-rule edge.
    *[Corrected after the street script review, 2026-10-04: "to fix before any of this ships" is not enforced by the
    street package. Street 1's bible must list this debt (SG1.12); no Street 2 unit, Street 3 gate or POLISH item
    fixes it, because the line is sim code outside the STREET block. It stays an accepted, recorded debt (street code
    never reads it; ST4), and fixing it is a separate owner decision, see README §12 "Known limits".]*
  - Precipitation (`:4216`), lightning, sheep wander and the hearth pick use `Math.random`. That is render-only, but
    the 3D layer must not copy it.
- **Canon notes.**
  - The bronze-age analogue is Kanesh's *kārum* (traders outside the walls). It is real-world colour, not Nīmlad
    canon.
  - Epēshu's districts are labels only (`:7624-7634`, `:3267`). Marble shows only on capital walls (`:2869`). The Blue Temple of Thobrauk stands on Wood Quay's northern edge (`maps-site/data/wiki-places.json:240`).
  - Banned words: coach posts, artillery, tithe, saint, abbey, priest, baron (R10, `filigree-1-research.js:55`).

## 6. Fit with the filigree package
**Connects:**
- **Halts and caravans.** The caravan-halts class has no sim entity (`todo-inputs.json:161`, `:170`). The street
  view is a natural renderer for it.
- **Shared reveal grammar.**
  - Shut ways (`:217`) and muster days (`:194`) are the same notice classes.
  - The R6 reveal grammar is "presence is a threshold, ink eases ≤250 ms" (`:51`). It equals the 250 ms tile fade
    (S6).
  - Under R7 the city sheet draws nothing at rest at `Z_TIER_D` (`:52`). The 3D street view picks up where R7 stops.
- **Shipping conventions to follow.**
  - Fog comes from R13 (`:58`).
  - Ship default-off behind a hash key and a layers row, per R18 (`:63`).
  - Notices travel outside the release, per R12 (`:57`).
- **Classes and vocabulary.**
  - Bible class ids such as Beacon Post and Muster Ground (`README.md:545`) should be shared, not re-invented.
  - Follow the R10 vocabulary (`:55`).
- **Deep links.**
  - The POLISH item "Sim ↔ atlas continuity" (`POLISH.md:132`) is the deep-link home: `#goto=` is parsed at
    `:5923`, alongside `#s=`.
  - Trackpad feel (`POLISH.md:119`) gains a third camera path.

**Conflicts:**
- **Queue order.** The jobs run strictly 1→4, each gated (`POLISH.md:26` "strictly in order"; preflight `:31`). A street view has no slot in that chain,
  and adding it to Jobs 1–2 means re-running them.
- **File ownership.** Job 3 holds `maps-site/index.html` (`POLISH.md:182`). It leaves the sim `index.html` alone
  unless a unit names it (`filigree-3-build.js:445`), yet its smoke and syntax gates run on **both** files
  (`POLISH.md:173`). A half-done sim edit can fail a filigree gate.
- **Window.** R22 limits sheets to the `EPESHU_HF` window (`:67`). Street detail outside it must not invent relief.
- **Shape A blocker.** Adding street units to sheet-spec after Job 2 passed is a changed spec; Job 3's preflight throws on that (`POLISH.md:178`), and R15 (`filigree-1-research.js:60`) cuts another patch release per re-run.
- **Release cadence (shapes B and C).** R15 cuts a patch per filigree job and CLAUDE.md squashes all WIP into one commit per cut. Street-track commits must not sit unpushed across a filigree cut, or the squash mixes the two tracks.
- **Fog source.** Fog as a new `W.weather` state contradicts R13.
- **Shape C start point.** Not "after Filigree 3 releases `maps-site/index.html`": Job 3 is multi-run and its units may edit the sim `index.html` when a unit names it (`filigree-3-build.js:445`); its smoke gate runs on both apps (`POLISH.md:173`), and Filigree 4 fix cycles (R16, up to 2) re-run that gate. Start **after `gates/3-build.json` passes, with no sim-touching work while Filigree 4 fix units are open**. The queue rule supports this (`POLISH.md:8`: if another workflow holds the file, take the next item).
- **Shape C addendum.** It must not edit `filigree-1-research.js` R-text or `docs/filigree/*` (Job 3's preflight needs the Job 2 gate to pass with the spec unchanged, `POLISH.md:178`; R17 forces a Job 1 re-run). It is a **new street-track doc** that cites R6/R10/R12/R13/R18 by id, read-only.
- **Hash keys.** The atlas `#view=` writer drops trailing params, fixed by U00 (`README.md:347`). A street key must
  not clobber `#goto=`, `#s=` or `filigree=1`.

## 7. Performance budgets the street view must fit
- **Baseline today:** about 1.6M tris and about 50 draw calls (`web-performance.md:4`). This is the ceiling to
  stay near.
- **Frame:** rAF work under about 15 ms (≤10 ms safer), with 120 Hz halving it (`:8`). A locked 30 Hz beats a
  dropping 60 Hz (`:12`).
- **Long tasks:** any task over 50 ms must be sliced (`:15`). Quad builds therefore need a per-frame ms cap.
- **Degrade ladder:** it triggers at smoothed fps <42, checked every 5 s after frame 300, and is one-way (`:7330-7334`).
  The street view must hold ≥42 fps on target hardware, or it will trip the ladder for the whole app.
- **Draw calls:** instance or merge everything (9,000→300 via instancing; `web-performance.md:23`). Every
  `MAT.world` InstancedMesh needs `instanceColor` (`:3208`).
- **Allocations:** no per-frame allocation. Pool objects the way `_frust` and `_pm` do (`web-performance.md:27`).
- **Shadows:** the box at street level is 140 m half-extent at 2048² (`:6234`, `:7179`). Instanced crowds and carts
  casting shadows multiply the shadow pass.
- **Weather:** the precipitation baseline is one 1500-point `Points` draw call (`:4213`).
- **Pixel ratio:** capped at 2, or 1.6 at ≤760 px (`:2209`).
- **Measure with** `ANNALS.stats()` (fps, calls, tris; `:7517`). No per-LOD numbers exist yet, and the LOD and
  culling guidance is unverified (`web-performance.md:58`), so the budget must come from new probes.
- **Settlement rebuild cost:** each rebuild is a whole re-batch, one settlement per 700 ms. Near-only detail should
  be its own mesh, not part of `meshHi` (`:3076-3101`).

## 8. Open questions
- **Post identity.** What is the post's author, date and link? Is it jeantimex/tokyo, kolom1234 or webtrackerxy?
  Does any of them make vehicles obey signals?
- **Placement.** Does the street view live in the sim (3D, `index.html`) or in the atlas (2D Leaflet at
  `Z_TIER_D`+)? Or is it a sim view deep-linked from the atlas city zoom?
- **Scope.** Is it Epēshu only (canon, inside `EPESHU_HF`), or every procedural settlement? Is Epēshu's district
  layout authored or generated?
- **Gate canon.** Does canon shut gates at the dark hour? Is there a Patrinaic word for gate, toll or market
  (`lexicon/patrinaic.json`)?
- **Party entity.** A party entity would add state; it too must be render-only or a keyed f(seed, day). (Queueing and crowds are settled as render-only constraints in §5.)
- **VTT export.** Must the street view export a gridded battle map (square or hex), and at what scale? Top-down orthographic capture and token or fog-of-war hand-off are unsourced (§4).
- **Budget.** What tri and call budget does a street-level frame get on a phone? Unmeasured.
- **Workers.** Blob Workers in a single file would mean duplicating gen code, or serialising the parts it needs.
  Worth it, or are time-sliced main-thread builds enough?
- **Camera near plane.** Is a dynamic near plane needed at R≈9 m?
