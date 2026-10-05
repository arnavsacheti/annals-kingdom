# Mobile without losing the filigree

Brief for the owner, Filigree 2 and Street 2. The goal is to keep the atlas (`maps-site/index.html`) and the sim (`index.html`) at their present quality on phones at the table, where wifi is likely poor, before the Filigree and Street programs add density on top.

The rest of this brief follows these rules:
- Web findings appear only where no verification lens refuted them, and the lens corrections are applied.
- Code facts appear only where the anchor check did not refute them. Spec-gap facts F12, F18 and F19 were dropped for anchor drift. Where their content still matters, it was re-read directly and is cited from that re-read.
- Capture problems appear only where the re-measure confirmed them, or confirmed them in part with the corrected numbers.
- `inputs.json` in this folder holds the same content in machine-readable form.

Shots live in `(session scratchpad, not kept)` (written `shots/` below). Metrics are in `atlas-capture-metrics.json`, `atlas-extra.json`, `sim-capture-metrics.json`, `sim-supp*.json` and `rm*-metrics*.json` in the same folder.

Test profiles: iPhone 13 (390x664 CSS px of viewport, DPR 3), Pixel 7 (412x839, DPR 2.625) and desktop (1366x768). All runs used Chromium against localhost `server.js`. The "iPhone" profile is Chromium with an iPhone user agent, not WebKit. The sim used SwiftShader software GL, so its frame times say nothing about phone GPUs (see §1.3).

---

## 1. What phones get today (measured)

### 1.1 Atlas: bytes and time
| what | iPhone 13 | Pixel 7 | desktop | shot / source |
|---|---|---|---|---|
| first load, settled Contents | 729,636 B / 37 req (tiles 289,647 in 20) | 661,199 B / 32 | 597,108 B / 32 | metrics `*.firstLoadBytes` |
| repeat visit, warm cache | **same 729,636 B, 0 cache hits** | 661,199 B | 597,108 B | `*.repeatVisit` |
| time to first tile / atlas ready | 204 / 408 ms | 185 / 375 ms | 261 / 394 ms | `*.ttf` |
| same on slow 4G (1.6 Mbps, 150 ms RTT) + 4x CPU | 2,465 / 4,132 ms (CDN latency **not** included: Leaflet came from disk, fonts were aborted) | | | `iphone13-slow4g.ttf` |
| street zoom `#chart=Epēshu` | +2.18-2.20 MB in 3 req. `art/overlay-Epeshu.jpg` = 2,171,881 B (2863x3072), no low-res step. Settles in 5.17 s unthrottled. No slow-4G settle time was re-measured, so none is quoted | 5.16 s | 5.16 s | `shots/iphone13-5-street-zoom-epeshu.png` |
| session total | 3.17-3.57 MB. The overlay is about 61-68% of it | 3.15 MB | 3.27 MB | `*.totalBytes` |
| gzip -9 potential (none is served today) | index.html 211,860 → 66,752 B; first-load data ~216 → ~62 KB | | | computed |

Per-era tile pyramid: 860 tiles, about 9 MB (z0-4 = 2,928 KB, z5 = 6,224 KB). The z5 median tile is 6.3 KB. Tiles are baseline JPEG at Q88 and 256 px.

### 1.2 Atlas: layout and touch
| view | iPhone 13 | Pixel 7 | desktop | shot |
|---|---|---|---|---|
| map share of viewport / chrome cover of map at whole chart | 78% / 29% (header 111 px) | 83% / 21% | 90% / 5% | `shots/iphone13-2-whole-chart.png` |
| chrome cover with layers open | 85-86% | 82% | 27% | `shots/iphone13-3-layers-panel.png` |
| share of chart width visible at minZoom ("The Whole Chart") | 36-37% (minZoom 1.95) | 29-30% (2.35) | 97-98% | `shots/iphone13-2-whole-chart.png` vs `shots/desktop-2-whole-chart.png` |
| pins / text labels at whole chart | 89-113 pins, **0 labels, 0 tooltips** (hover:none) | 74-96 / 0 | 163 / 0 | same |
| pin crowding | 97-106 pairs < 22 px apart, 283-299 pairs < 44 px | 57-62 pairs < 22 px | 82 | `atlas-extra.json` |
| interactive elements under 44x44 | about 98% (123/127 by one selector, 211/215 by another) | 106/110 | 198/200 | metrics |
| tap on the Epēshu pin at z4.55 | **opened the Lektān faction card**: `elementsFromPoint` = [fac-badge, faction icon, Epēshu glyph]. Zoom-dependent; at a deeper zoom it opened Epēshu correctly | correct at z4.95 | n/a | `shots/iphone13-4-place-card.png` |
| place card sheet | 390x332 (50%). Body scrollHeight 4,808 vs 330 (about 15 screens). 17/21 targets < 44, close button 30x30 | 412x444 (53%) | 340 px side panel (22%) | `shots/iphone13-4b-place-card-epeshu.png` |
| closed sheet leak | 22 px of the closed sheet shows over the footer. Document scrolls to 974 vs 664 | 17 px, 1,265 vs 839 | none | `shots/iphone13-7-page-scrolled-closed-sheet.png` |
| layers panel | 372x405 (61% of height) with internal scroll. Groups & Powers and the Company strip draw over its lower rows. Rows are 22.8 px tall, checkboxes 13 px | 394x434, fits, same overlap | | `shots/iphone13-3-layers-panel.png` |
| Contents heading | kicker at -26 px, title at -8 px: **clipped and unreachable** | fine | fine | `shots/iphone13-1-contents.png` |
| horizontal overflow / console | none in any view. The only console error is the blocked Google Fonts request (an infra artifact) | | | metrics |

Not verified: whether the layers control stays open after a tap on a real device. In Chromium emulation it opened and closed again within 100 ms, and stock Leaflet behaves the same way there (m28).

### 1.3 Sim (seed epeshu)
| what | value | source |
|---|---|---|
| scene load | Phones draw 993,852 tris in 25 calls; desktop 1.13-1.14 M tris in 27-30 calls. 48,568 trees and about 1,300 buildings on **every** profile | `sim-capture-metrics.json` defaultView |
| drawing buffer | Pixel 7: 659x1342 at ratio 1.6 (884k px). iPhone 13: 624x1062. Desktop 1366x768 at ratio 1 (1.05 M px). A phone renders about 85% of desktop pixels | env |
| degrade ladder | **Never fired.** Measured rAF was 1.06-1.56 fps (SwiftShader), yet `ANNALS.stats().fps` read 26-37 and degradeStep stayed 0 | `shots/rm-pixel7x4.png`, `rm-metrics-pixel7x4.json` |
| JS per tick + submit | 3-9 ms, so the frame is GPU/raster-bound | `sim-supp.json` |
| payload | index.html 1,203,659 B raw (749,705 B gzip, which is **not** served). three.js r128 comes from cdnjs. The fonts stylesheet is render-blocking (index.html:24) | server.js read |
| touch | One finger orbits (yaw and pitch), two fingers pinch and pan, tap inspects, double-tap travels. Panning cannot be found without the hint | `sim-supp2.json`, `shots/sim-pixel7-touched.png` |
| tap targets | 11 of 13 visible controls are under 44 px: speed buttons 24-63x31, Atlas/Wiki 22 px tall, Export 57x28, chronicle toggle 29x28, quick icons 42x42. Ledger: tabs 22 px tall, fold button 21x19, sliders 18 px | `shots/sim-pixel7-panel-ledger.png` |
| top occupancy | HUD 100 px plus ledger handle, down to y = 146 on Pixel 7 (17%); 15-22% on iPhone 13 | re-measure |
| ledger sheet | y = 108-611 of 839 (60%); the last sliders sit below the fold | `shots/sim-pixel7-panel-ledger.png` |

Capture limits: real phone GPU frame times, thermal behaviour and WebKit specifics are **unmeasured**.

---

## 2. Verified practice (sources)

Each item carries the corrections from its verification lenses.

1. **Ranked greedy label placement** (MapLibre v8 style spec). The lower `symbol-sort-key` places first and a colliding later label is dropped. `text-padding` defaults to 2 px. Leaflet has no collision engine (secondary source; consistent with its API), so the atlas has to build its own: a screen-space bounding-box test applied in rank order. Source: maplibre-style-spec `v8.json`. *High.*
2. **Variable anchors before dropping.** `text-variable-anchor-offset` tries each anchor in order before moving to the next label; the radial offset is in **ems**. The spec gives no anchor order, so the order is ours to choose. *High.*
3. **Per-class size ramps** (OSM Bright). city [7,14]→[11,24]; town [10,14]→[15,24]; village [10,12]→[15,22]; state [12,10]→[15,14]; country [1,11]→[4,17]. Interpolation is exponential (base 1.2). Max width is 8 em for city/town/village, 9 for state and 6.25 for country. These are not phone recommendations. *High (re-read).*
4. **Touch targets.** WCAG 2.2 AA 2.5.8 sets 24x24 CSS px, with an exception for undersized targets whose 24 px circles do not overlap, and an **Essential exception that names dense map pins**. Culling pins is therefore a UX choice, not a compliance need. Apple 44 pt / Material 48 dp come from secondary sources only. Material's sheet drag handle is at least 48 dp (primary source). *Medium.*
5. **Bottom sheets** (Material BottomSheet.md, Android). A *standard* sheet has no scrim and leaves the map interactive. Half-expanded ratio is 0.5 of the parent height, max width 640 dp, drag handle at least 48 dp, settle velocity 500 px/s. *Medium; not an Apple or Google Maps spec.*
6. **Leaflet touch behaviour** (leaflet@1.9.4 source, the version in use):
   - Non-permanent tooltips open on `click`, so a tap shows them. Sticky tooltips also open on tap, at the tap point. Only cursor tracking and closing on hover-out are lost.
   - TapHold simulates `contextmenu` after 600 ms, enabled by default on mobile Safari; `tapTolerance` is 15 px.
   - `zoomSnap:0` means pinch never snaps to a whole level.
   - `.leaflet-container` sets `touch-action: pan-x pan-y`.
   - `detectRetina` halves `tileSize`, adds 1 to `zoomOffset` and lowers maxZoom by 1 for **any DPR > 1**. 2x and 3x phones get the same 2x2 fan-out.
   *High.*
7. **Streaming engines' defaults are desktop-sized.**
   - 3DTilesRendererJS: errorTarget 16. LRU max 8,000 items / ~430 MB (0.4 GiB), min 6,000 / ~322 MB. Byte limits work only on three r166+, so not on our r128. Download queue **25** per origin (the standalone class default is 6), parse queue 5. Cache caps are hard: when full, detail stalls at coarse tiles. maxTilesProcessed 250 is disputed between the lenses.
   - Cesium: SSE 16, cache 512 MB + 512 MB overflow, `dynamicScreenSpaceError` and `foveatedScreenSpaceError` on (both suit horizon views). Its widget renders at CSS-pixel resolution by default (`useBrowserRecommendedResolution` gives ratio 1.0).
   - Phone values (SSE 32-64, a cache of about 100-150 MB) are proposals.
   *High for the defaults.*
8. **three r128** handles `webglcontextlost`/`restored` internally (preventDefault, then a GL state rebuild) and has `shadowMap.autoUpdate` / `needsUpdate` at both renderer and light level, so static shadows can be frozen (benefit unmeasured). *High for the API facts.*
9. **HTTP caching** (MDN). Every response should carry an explicit `Cache-Control`. Versioned assets should be `max-age=31536000, immutable`. Heuristic caching is a fallback to avoid. *High.*
10. **Storage** (MDN).
    - Quotas: Chromium up to 60% of disk. Firefox best-effort is the smaller of 10% of disk or a 10 GiB group. WebKit browser apps about 60%.
    - Safari **deletes script-written data** (Cache API, service worker, IndexedDB) for an origin after 7 days of browser use with no interaction. A fortnightly table loses its offline cache. `navigator.storage.persist()` is the lever.
    - MDN does **not** say a Home Screen install exempts a site from the 7-day rule.
    *High / medium.*
11. **Tile format experiments** (local, not perceptual).
    - 512 px tiles cut requests 4x. The measured 0.80x bytes is partly a quality drop (q80 vs the source q88).
    - WebP q80 came to about 0.55x of the JPEG on a 12-tile sample. That AVIF smears ink lines rests only on MAE; eyeball before choosing.
    *Medium / low.*
12. **Unverified leads, to measure and not to quote as budgets:**
    - iOS canvas memory cap of about 384 MB (iOS 15; snippet only).
    - Sustained-GPU thermal drops of 20-60% (snippets).
    - three.js mobile rules of thumb (100-150 draw calls, <96 MB textures).
    - `navigator.vibrate` absent on iOS.
    - The Network Information API (`saveData`, `effectiveType`) is Chromium-only, so any gating needs a fallback.

---

## 3. Principles that keep the quality on phones

1. **Delay, never drop.**
   - A phone shows the same classes of ink and names as the desktop on the same sheet. A per-viewport label budget may move a lower-rank name to a higher zoom.
   - Every name a desktop shows on a sheet appears on the phone by that sheet's next zoom step.
   - Type never shrinks to fit more names. On coarse-pointer viewports no name is drawn below 12 px (11 px for italic sub-labels).
2. **Thresholds in absolute zoom; budgets in CSS px.**
   - Ink scale per CSS pixel is device-independent at a given zoom, so presence thresholds must be absolute zooms that no viewport can move.
   - Today they are not: the atlas tiers ride on `fitZoom`, which depends on the viewport (`tierZoom()` at `maps-site/index.html:1205-1211`, `fillZoom` at `:838-846`). Tier B sits at (2·fitZoom + TIER_CEIL)/3, so it lands at a different absolute zoom on every device (fitZoom 1.95 on iPhone, 2.35 on Pixel; the desktop shows 97-98% of the chart at minZoom, so its value is lower still). A19 decouples the bands or pins them to the desktop value.
   - What changes with the device is how much fits. Spacing and label count are budgets over the viewport's CSS-px area, computed in CSS px so DPR never changes *what* is shown.
   - DPR only picks raster sharpness.
   - Placement is ranked and greedy, with variable anchors (practice 1-2).
3. **One question per view on a phone; the full sheet is one tap away.**
   - The phone default is the map plus one floating control cluster.
   - Search, layers, era, the Company and journeys live in one bottom sheet ("the table drawer") instead of five floating controls.
   - Chrome target: ≤ 12% of the map at the whole chart, ≤ 35% with any sheet at peek.
4. **Tap reveals what hover reveals.**
   - Every hover-only effect (halos, realm brighten, census swell, tooltips) has a named tap or long-press path.
   - `:hover` styles are gated by `@media (hover:hover)`.
   - Long-press (Leaflet `contextmenu`) peeks a name without opening a card.
   - Taps resolve by distance to the glyph centre: one glyph within 22 px opens directly, and a small "which?" chooser appears only when two or more are within 22 px. A tap never opens the wrong card.
5. **Bottom-sheet cards with three stops.**
   - Stops: peek (name, kind, primary action, about 120 px), half (50%) and full.
   - A standard sheet with no scrim, so the map stays live.
   - A drag handle of at least 48 px; swipe down dismisses.
   - The closed sheet is clipped and `visibility:hidden`.
6. **Hit areas grow, glyphs do not.** On `pointer:coarse`, controls get min 44x44. Markers get invisible padded hit areas (44 px, or the WCAG 24 px-circle spacing rule) so the drawn density stays as it is. Pads never decide a tap: the glyph-centre rule above does, so overlapping pads cannot send most city taps to the chooser.
7. **Device classes for the street view** (phone / tablet / desktop). These are not the street spec's `tiers`, which are camera-radius LOD bands (T0..T4).
   - The class is chosen at load from pointer, short side, `deviceMemory` and `hardwareConcurrency`. It never touches `W.rng` or the seed.
   - Each class has budgets for calls, tris, resident bytes and quad jobs per frame, recorded in the spec's `/device_classes` (§5.3 item 9).
   - The quality ladder works on **real** frame time over a sustained window, with hysteresis and **upward recovery**. Antialias is fixed at context creation, so recovery cannot restore it: the phone class runs without antialias for the whole session (accepted).
   - Device classes scale instance fractions, draw distance and weather density first. Shadows come off last.
   - Device classes touch presentation only, never the seed or the sim.
8. **Bytes are a budget, not an accident.**
   - Serve compressed with explicit cache headers and versioned immutable assets.
   - No single asset above 500 KB without a low-res step first.
   - Overlays fetch only when turned on.
   - Proposed budget: first atlas view ≤ 400 KB gzip, each pan or zoom step ≤ 100 KB.
9. **Offline plates for the table.**
   - A service worker precaches the shell (HTML, vendored Leaflet, data JSON, vendored woff2 fonts) and caches tiles cache-first. Tile paths must be versioned (`tiles-v<N>/`) before they are cached immutably or cache-first; the worker's cache name is keyed on `VERSION`, so each release cut invalidates it and shows an "a new chart is ready" notice.
   - A "Keep for the table" action stores one era's z0-4 (about 3 MB; about 1.6 MB as WebP) plus the current city and the herald's tidings snapshot.
   - It calls `storage.persist()` and is offered again each visit, because of the iOS 7-day eviction.
   - It is offered on both origins (the atlas and the sim are separate origins with separate caches), shows its size before downloading, and never starts by itself on Save-Data.
   - Service workers, the Cache API, `storage.persist()` and the Wake Lock API all need HTTPS, so both subdomains need certificates (open question 11).
10. **The phone is a gate, not a review note.** Every density gate also passes at 390x664 portrait and about 844x340 landscape (both with browser toolbars) at DPR 3. 390x664 is the viewport the iPhone capture actually had, and A11 reproduces only at that height. The landscape size is proposed and was not captured. Phone runs also cover reduced motion and night mode, including a night-mode pinch capture (A22).
11. **Live through the session.**
    - Pause on `visibilitychange`.
    - Handle WebGL context loss without regenerating anything: on restore, re-upload GPU resources from the existing CPU-side state. three r128 re-uploads geometries and textures itself after `initGLContext`, so only custom render targets and shadow maps need attention. The world and sim state (affairs, chronicle, caravans, every simulated day since load) are never rebuilt from the seed.
    - Debounce resize and re-apply DPR.
    - Keep idle frames cheap: render on demand or cap at 30 fps when nothing moves (S16 for the sim).

---

## 4. Current-site mobile defects to fix now

Size: S < ½ day, M ≈ 1-2 days, L > 2 days. Atlas first, then the sim. None of these needs to wait for Filigree or Street, but the order matters (§4.3).

### 4.1 Atlas (`maps-site/index.html`)
| id | defect | evidence | anchor | fix | size | sev |
|---|---|---|---|---|---|---|
| A1 | The closed bottom sheet leaks: the page scrolls and a strip of the card shows over the footer | p01: iPhone panel top 642 < 664, doc 974 vs 664; Pixel 1,265 vs 839 | `:141` (#stage has no overflow), `:613-616` | `#stage{overflow:hidden}`; `#panel:not(.open){visibility:hidden}` after the transition (transitionend or a delay) | S | major |
| A2 | Ambiguous taps open the wrong entity (the faction badge stacked on Epēshu) | p05: iPhone z4.55 opened #faction=The Lektān Priesthood; 97-106 pin pairs < 22 px | `:408` (.fac-badge), the marker build around `:1227-1243` | On coarse pointers, a tap is resolved by distance to the glyph centre: exactly one interactive glyph within 22 px → open it; two or more within 22 px → a "which?" chooser sheet. Offset faction badges from their seat glyph. A3's marker hit pads must land with or after this item, otherwise wrong-card taps get worse | M | major |
| A3 | About 98% of interactive elements are under 44 px on phones | p04, F5, F6: theme 37x31, search 370x32, close 30x30, strip toggle 24x24, era-title 71x25, grp-btn 126x28, layer rows 22.8 px | `:382-385` (only the zoom buttons are enlarged), `:69,99-103,249,302,337-355,479,485` | One `@media (pointer:coarse)` block: min 44 px for header links, close, toggles, era control, jbar buttons, layer rows. Markers get a transparent `::after` hit pad of 44 px (pads only enlarge the target; the tap is still resolved by A2's glyph-centre rule, and this lands with or after A2); glyph sizes are unchanged | M | major |
| A4 | Chrome covers 29% of the map at the whole chart (85% with layers open) | p02 | header `:606-611`, dock `:468-476`, era `:296-312`, jbar `:325-362` | On phones: header to one row (search collapses to an icon), and era, layers, Groups, Company and journey merge into one "table drawer" bottom sheet. Target ≤ 12% | M | major |
| A5 | "The Whole Chart" shows only 29-37% of the chart on portrait phones | p03 | `fillZoom()` `:838-846` | Tier bands are decoupled from `fitZoom` by A19. On portrait set `minZoom = min(fillZoom, fitWidthZoom)`. The Whole Chart plate does `fitBounds` (letterboxed on parchment) | M | major |
| A6 | The layers panel overlaps the dock, scrolls internally, and has 13 px checkboxes | p06: 372x405 at 61% of height (iPhone) | `:3616-3623` | Coarse pointer: render the layers list inside the table drawer (A4) with 44 px rows, above the dock's z-index | M | major |
| A7 | The street fly-in is one 2.17 MB JPEG with no low-res step | p07: 2,171,881 B, 61-68% of session bytes (no slow-4G timing was re-measured) | `art/overlay-Epeshu.jpg`, chart load around `:1734-1741` | Ship a ~720 px preview (about 120-180 KB) first and swap to the full image on load, or cut the overlay into the tile pyramid. WebP version after a visual check | M | major |
| A8 | No compression, no cache headers, and repeat visits refetch everything | p08: 729,636 B / 37 req with 0 cache hits on revisit; the nginx block only has `/tiles/ expires 30d` | `DEPLOY.md:35`, `server.js:4,11` (also serves .json/.jpg as octet-stream) | nginx: `gzip on` for html/json/css/js/svg, `no-cache` + ETag for index.html. Tile paths carry no version today (`tiles/`, `tiles/5/x/y.jpg`, `maps-site/index.html:820,2961`), so `immutable` is only allowed once the tile root is versioned (`tiles-v<N>/`); until then keep `max-age` 30d with ETag. Only versioned art and charts take `Cache-Control: public, max-age=31536000, immutable`. server.js: add the json/jpg/png/webp MIME types | S | major |
| A9 | Three foreign origins in the render path (Google Fonts CSS, unpkg leaflet.css/.js) | p09 | `:7-10`, `:720` | Vendor Leaflet 1.9.4 into `maps-site/vendor/` (keep the SRI hashes). Vendor the OFL fonts as woff2 into `maps-site/vendor/` too (no Google Fonts CSS), with `font-display:swap` and system serif fallbacks, so the service worker never caches opaque cross-origin font responses (which inflate the Chromium storage quota) | S | major |
| A10 | No offline capability; table wifi is poor | D6, F20: no SW or manifest | whole file | Service worker plus a "Keep for the table" button (principle 9): shell precache, tiles cache-first from the versioned tile root (A8), cache name keyed on `VERSION` with an "a new chart is ready" notice after each cut, `storage.persist()`, re-offered every visit. Shows its size before downloading and never starts by itself on Save-Data. Needs HTTPS on the maps. origin | L | major |
| A11 | The Contents heading is clipped on short phones | p10: kicker -26 px, iPhone | `:107-108` | `#contents{align-items:safe center}` (fallback: inner `margin:auto`) | S | minor |
| A12 | Phones see unlabeled pins at the whole chart; the census swell is mouse-only | p11 (0 labels, 0 tooltips); F10 | `:1251-1273`, `:168-181` | On hover:none: a ranked label budget (principle 2) for top-rank names, long-press peek, 44 px hit pads on census pins. Skip the mousemove loop on touch | M | minor |
| A13 | The place card is half the screen and about 15 screens long, with no peek | p12; F9: no handle, swipe or snap | `:241-252`, `:613-616`; jbar coupling `:361` | A 3-stop standard sheet (peek/half/full) with a 48 px handle and swipe-to-dismiss. Move jbar's `calc(64% + 10px)` onto a CSS variable shared with the sheet | M | minor |
| A14 | No safe-area or dvh support | F1, M6 | `:5`; already queued at `POLISH.md:117` | Add `viewport-fit=cover`, `env(safe-area-inset-*)` on header/footer/jbar/dock, `100dvh` with a 100% fallback | S | minor |
| A15 | Hover styles stick after a tap; the POI halo is invisible on touch | F11, F12, M7: 29 `:hover` lines, none gated | `:63-598` (:hover), `:508-514`, `:1341`, `:1467` | Wrap `:hover` in `@media (hover:hover)`. Give the POI halo a faint visible ring on hover:none. Realm highlight on tap | S | minor |
| A16 | A landscape phone (>640 px wide) gets the desktop drawer | F17 | `:606` (width-only) | Extend the mobile query to `(max-width:640px), (max-height:500px) and (pointer:coarse)`. In landscape use a right-side sheet capped at 50% width | S | minor |
| A17 | The search input is 14 px, so iOS zooms on focus; the keyboard can cover suggestions | F5, F21 | `:86`, `:90-93` | 16 px on coarse pointers; 44 px suggestion rows; `visualViewport` resize to keep the dropdown above the keyboard | S | minor |
| A18 | Tile cost on phones: `keepBuffer:4`, and quarter-step zoom buttons need many taps per tier | M3, M8, F14, F16 | `:775-778`, `:816`, `:1735` | Coarse pointer: `keepBuffer:2`, `updateWhenIdle:true` on Save-Data, zoom buttons step 0.5. Keep `detectRetina` (quality) | S | minor |
| A19 | Atlas tier bands ride on the viewport-dependent `fitZoom`, so presence thresholds differ per device (contradicts principle 2) | `tierZoom()` puts tier B at (2·fitZoom + TIER_CEIL)/3; fitZoom 1.95 iPhone, 2.35 Pixel, lower on desktop | `maps-site/index.html:1205-1211`, `fillZoom()` `:838-846` | Decouple the tier bands from `fitZoom` (absolute zooms), or pin them to the desktop value. Lands before Filigree 3 stamps sheet bands | M | major |
| A20 | No screen wake lock; the screen sleeps mid-session at the table | none in the file | whole file | An opt-in "Keep the chart lit" row in the table drawer (Wake Lock API, HTTPS only). Whether iOS supports it is unverified (open question 11) | S | minor |
| A21 | One-handed reach: the floating cluster and primary actions sit at the top | header `:606-611`, dock `:468-476` | as A4 | Put the floating cluster and the table drawer's primary actions in the bottom thumb zone (extends A4) | S | minor |
| A22 | Night mode phone cost is uncaptured: `filter: invert` runs on the whole tile pane | principle 10 requires night-mode phone runs; none exists | `maps-site/index.html:37` | Capture a night-mode pinch and pan on the phone profiles (frame time, jank) and decide whether to keep the filter or pre-render a night tile style | S | minor |

### 4.2 Sim (`index.html`)
| id | defect | evidence | anchor | fix | size | sev |
|---|---|---|---|---|---|---|
| S1 | The degrade ladder cannot see a slow phone | p1: rAF 1.06-1.42 fps while fpsAvg read 26-37; dt clamped to 0.05 s; frameN > 300 gate | `:7318-7336` | Measure fps from the **unclamped** rAF delta (presentation only; the sim keeps the clamped dt). Gate on elapsed real time (about 4 s after sceneReady), not on frameN. Use the median over a sliding window, with thresholds per device class: desktop keeps today's step-down below 42 (`:7328-7333`), the phone class steps down below the phone floor (28 proposed, stated in `/device_classes`). Step back up above 50 fps for 30 s. Show a small notice. Samples come from uncapped frames only, so S16's cap cannot pin fps under the recovery bar | S | major |
| S2 | The ladder never reduces geometry; phones carry desktop load (about 1 M tris, 48,568 trees) | p2 | `:2208-2212`, `:7179`, flora `:3170-3202`, `:4405`, `:4434` | Choose a device class at init (principle 7). Phone class: antialias off (fixed at context creation, so the upward recovery cannot restore it; accepted for the phone class), `powerPreference:'default'` instead of the hard-coded `'high-performance'` (`:2208`, creation-time, battery), shadow map 1024, `PCFShadowMap`, InstancedMesh `.count` fraction for far chunks, terrain shadow frozen via `autoUpdate=false` and refreshed on time-of-day steps. The `.count` trim keeps the first k instances, which follow generation order and may cluster, so it must use a stride or an index-hash permutation (xmur3/mulberry over the chunk id) and never draw from `W.rng` (extra draws would change the world). Presentation only; N, the seed and the sim are untouched | M | major |
| S3 | No WebGL context-loss handling (black canvas after backgrounding) | F9 | `:2207-2214` | Add `webglcontextlost` (preventDefault, pause) and `webglcontextrestored` (re-upload GPU resources from the existing CPU-side state; three r128 re-uploads geometries and textures itself after `initGLContext`, so only custom render targets and shadow maps need attention). The world and sim state are never regenerated, so affairs, chronicle and caravans survive. Check with `WEBGL_lose_context`: `ANNALS.stats()` and the chronicle match before and after | M | major |
| S4 | Hide-the-court promises "tap the map edge to return", but that is not implemented | F16 (partly: only key H restores) | `:391`, `:6292-6296` | Add a small always-visible restore tab (44 px) or implement the edge tap | S | major |
| S5 | Controls under 44 px on phones | p4: speed 24-63x31, links 22 px tall, Export 57x28, toggle 29x28, ledger tabs 22 px, fold 21x19, sliders 18 px | `:228-275` | A `@media (pointer:coarse)` block: min-height 44, slider thumbs 28 px | S | major |
| S6 | 1.2 MB uncompressed, no cache headers, three.js from a CDN, render-blocking fonts, no SW | p8 | `server.js`, `:24`, `:463` | Same server or nginx fix as A8. Vendor `three.min.js` r128. Vendor the OFL fonts as woff2 next to the sim (no render-blocking Google Fonts CSS). The sim is a separate origin from the atlas, so it needs its own service worker and its own "Keep for the table" offer (same rules as A10); HTTPS on the sim. origin | S | major |
| S7 | Panning cannot be found on touch; the hint is mouse-worded and buried | p3 (partly), F11 | `:395-398`, `:5998-6066` | A first-run coach card on touch ("one finger turns the sky · two fingers walk the land · pinch to draw near"), hint text per pointer type. Optional: one-finger pan at high altitude | S | minor |
| S8 | No pause when hidden (battery) | F8 | `:7670` | On `visibilitychange`, stop the rAF loop and resume with prevMs reset | S | minor |
| S9 | Resize does not re-apply DPR and is not debounced | F4 | `:2215-2219` | Debounce 150 ms and re-apply the device-class DPR on resize or orientation change | S | minor |
| S10 | Only one `@media`; a landscape phone gets the desktop HUD | F12 | `:228` | Add `(max-height:500px) and (pointer:coarse)`: compact HUD, side sheets. On portrait phones move the speed controls from the 100 px top HUD into a bottom bar (thumb zone) | M | minor |
| S11 | The full chart closes with Esc only | F15 | `:7499-7503` | Add a 44 px close button in `#mapPanel` | S | minor |
| S12 | The ledger sheet covers 60%; its sliders are below the fold | p7 (partly; the gesture-blocking claim was dropped) | `:228-266` | Make the ledger a 3-stop sheet; tabs at top, sliders scroll | S | minor |
| S13 | The viewport meta locks page zoom; HUD text is 11.5 px | p9 | `:5` | Drop `maximum-scale=1, user-scalable=no` (the canvas already owns gestures through `touch-action:none` + gesture preventDefault); add `touch-action:manipulation` on HUD buttons so a double-tap on a control never zooms the page; HUD text 13 px on phones | S | minor |
| S14 | The graphs canvas uses uncapped DPR and reallocates on each draw | F20 | `:6772-6776` | Cap at 2 and reallocate only on a size change | S | minor |
| S15 | Top occupancy 15-22%; the camera is not offset to the free area | p5 (partly; corrected numbers) | `:228-266` | Set the camera view offset (`setViewOffset`) to the unobscured rectangle when sheets open, counting the S10 bottom bar | M | minor |
| S16 | Idle frames at full rate drain the battery | principle 11 | render loop `:7318-7336` | A 30 fps cap for the phone class, presentation only. At 30 fps dt is 0.033 s, below the 0.05 s clamp, so sim speed is unchanged | S | minor |
| S17 | No screen wake lock in the sim | none in the file | whole file | An opt-in "Keep the chart lit" row (HTTPS only), as A20 | S | minor |
| S18 | The sim has no dark UI theme; the glare and night use is unserved | 0 hits for `data-theme` or `prefers-color-scheme` in `index.html` | `:228-275` | A dark theme for the HUD, ledger and sheets (`prefers-color-scheme` plus a manual toggle) | M | minor |

### 4.3 Sequencing
- `index.html` is held during Filigree 3 and Street 3, so the S-items should land **before** Street 3. S1-S3 and S16 are prerequisites the street ladder builds on.
- A1-A9 and A11-A22 are atlas edits. A3's marker hit pads land with or after A2. A19 lands first of the filigree-facing items, since sheet bands stand on it. They should land before Filigree 3 holds `maps-site/index.html`. The A2, A4, A6 and A13 patterns become the base the filigree overlays attach to.
- A8, A9, S6 and A10 (with HTTPS on both subdomains) are delivery work outside the two programs and can go first.

---

## 5. Ruling overrides and additions

Street has not run: there is no `docs/street/gates/`. Filigree 1 is listed as in progress, and `docs/filigree/gates/hexes.json` and `gates/hex/` already exist.

**Precondition before writing the Filigree overrides.** The density bible stamps the R2 and R6 texts (`filigree-1-research.js:435`), and Job 1 reads overrides only at preflight (`:287,296`). If Job 1 has passed preflight, its bible carries the default texts. Confirm Job 1 has not started, or re-run it with `resume:false`. The Street overrides can be written now.

Street 1 stamps R6, R9, R10, R12, R13, R15, R16, R18 and R22 verbatim, and Streets 2-4 refuse if those texts drift. So R6, R12 and R18 must be settled **before Street 1** (street README:40). R7 and R18 are on the confirm-before-Filigree-2 list.

### 5.1 `docs/filigree/rulings.json` → `overrides`
| id | proposed text | why |
|---|---|---|
| R2 | Rank decides WHEN a name appears (its threshold), not HOW it is inked: one ink colour and one face family for landform and homestead names; at most one size step between ranks. Placement is ranked and greedy in CSS px with a per-viewport spacing minimum; on a small viewport the rank pass may delay a name to a higher zoom but never drops a class the desktop shows on that sheet, and every delayed name appears by the sheet's next zoom step. No name shrinks below its desktop size to fit a small viewport, and on a coarse-pointer viewport none is drawn below 12 px (11 px italic). | Turns the vague "cramped" item (q15) into delay-not-drop with a size floor on coarse pointers, so phones keep every class and desktop filigree type is not forced up. |
| R6 | Presence is a threshold (absent below minZoom); after arriving, ink eases over <=0.25 zoom or <=250 ms; names arrive at or after their own ink; nothing fades in below its threshold. On the atlas, thresholds are evaluated on the settled zoom after a pinch or fling (an ease never restarts mid-gesture); eases animate opacity/transform only; with prefers-reduced-motion the ease is instant. | Continuous pinch (`zoomSnap:0`) would otherwise retrigger eases mid-gesture; compositor-only animation holds on low-end GPUs. Cited by Street for its fade, so it must be set before Street 1; the settled-zoom clause is scoped to the atlas so a continuous 3D descent can still swap street LOD. |
| R7 | City sheet (z >= Z_TIER_D): nothing drawn at rest. Epēshu halos stay invisible at rest; on hover devices hover reveals them, on touch devices (hover:none) a tap on a halo's footprint reveals it and opens its card, and a long-press peeks its name without opening the card. Cursor-growing census pins are suppressed inside the city footprint at the city band; on touch no pin depends on cursor growth; every pin has an invisible hit pad, but a tap is resolved by distance to the glyph centre: one glyph within 22 px opens directly, and a chooser appears only when two or more glyphs are within 22 px. Deep links still land. | Hover-only halos and mouse-only swell leave phones with invisible or untappable targets (F10, F12, p05). With 283-299 pin pairs under 44 px, overlapping pads would send most city taps to a chooser, so the rule follows A2. |
| R12 | Notices (muster days, shut ways; player-facing label: the herald's tidings) load outside the release: a hash param notices=<url> or a local file import; one sample snapshot (fixed seed, fixed simDays) is committed; no mid-cycle pushes. Each surface (the atlas and the sim, which are separate origins) keeps its own last loaded snapshot on the device (Cache API), dated in the A.B. reckoning (the day it was cried), and shows it when the network is down. | Table wifi is poor; the tidings must not vanish when the connection drops. Cited by Street, so it must be set before Street 1. |
| R14 | Old survey = an era tile layer (tiles-imperial/ or tiles-war/) stacked UNDER the live base with opacity or swipe, fetched only while the reader has it turned on (never prefetched); if research finds the eras differ only in names/borders, add an old-name layer as well. | A second full tile layer doubles phone requests; on-demand keeps the toggle free when off. |
| R18 | The table map ships behind a default-off toggle (hash param filigree=1 + a layers-panel row). The sparse version = the same view with the toggle off, verified by DOM (no filigree pane or feature) and, once Filigree 4 records a network metric (§5.3 item 3), by network (no filigree request). The owner flips the default after Job 4 passes at desktop and at 390x664 portrait; the owner may flip it per device class (fine pointer first). | Lets phones keep the sparse view until the phone review passes, and makes toggle-off cost zero bytes. Cited by Street. |

### 5.2 `docs/street/rulings.json` → `overrides`
ST3, ST4 and ST18 are fixed (`street-1-research.js` `ST_FIXED`, re-read directly) and are not touched.

| id | proposed text | why |
|---|---|---|
| ST7 | Layers: rows only, no new keys; hash param street=1, default off; sub-rows "roads and folk", "clouds", "weather", "shadows"; the shadows row defaults on (today's look) and reads "held off for speed" at degradeStep >= 3; on coarse-pointer devices these rows live in the existing drawer as 44 px rows; the owner flips the street default only after Street 4 passes and the ST8 device runs pass, and may flip it for desktops before phones. | A per-class default flip, and a touch-sized home for the rows. |
| ST8 | Perf evidence: sandbox gates use deterministic counts (calls, tris, geometries, quads and tris built per frame, resident tris) and exact off-identity under the probe's virtual clock, never wall-clock times, measured for each device class the spec defines (phone class at 390x664, ratio 1.6); device evidence is owner-run on owner hardware: a desktop run (fps >= 42 with degradeStep 0 over a 60 s descent, tools/street-probe.js --device -> docs/street/device/<date>.json) and one phone run (sustained >= 30 fps over a 5-minute descent and idle, at a ladder step no lower than the spec's phone floor, read from ANNALS.stats(), filed as docs/street/device-phone/<date>.json and never under docs/street/device/), both preconditions for the respective default flip. | One desktop run cannot vouch for phones (spec-gap F17). Thermal throttling needs a sustained run. The phone file has its own directory because Street 3 and Street 4 read the newest `docs/street/device/*.json` against fps >= 42 and degradeStep 0 (§5.3 item 6). |
| ST9 | Workers: none; a time-sliced main-thread queue with at most 6 quad jobs and a triangle cap per frame on the desktop class and at most 3 jobs and half the triangle cap on the phone class; a full LRU stays coarse; the spec states these per-class budgets and an LRU resident-byte cap per class in `/device_classes`. | Phone main threads are slower and memory is capped (iOS ~384 MB is a lead, unverified). The numbers are proposals. `/stream` holds only scalars today, so the per-class values need the `/device_classes` shape (§5.3 item 9). |
| ST19 | Weather density: a "weather" sub-row with four steps (full, three-quarters, half, quarter) scales the drawn count of the existing precipitation points (draw range only, no new randomness); the default step follows the device class (desktop full, phone half) and the quality ladder may lower it before it touches shadows; roof masks only where the count is exact under the probe, else a recorded gap. | Draw range is a presentation-only lever that keeps the effect present; it is cheaper than losing shadows. |

### 5.3 What overrides cannot express (needs a script or tool change)
The override channel replaces existing ruling texts only. New ids such as R23 or ST20, and new gate keys, are refused (street-1-research.js:162). These items need edits to the scripts or tools:

1. **Phone viewport in build gates:**
   - The Filigree 3 slice gates count features "that intersect the viewport", but no viewport is recorded (README:413).
   - Needed: `filigree-3-build.js` / `tools/filigree-capture.js` record the viewport and add a 390x664 portrait DPR 3 pass to each slice gate.
2. **The F08 phone finder is review-only** (`filigree-4-review.js:176`). Make a phone failure a gate criterion in Job 4, not just a finding.
3. **A byte and request metric:**
   - `MET_KEYS` (`filigree-4-review.js:270`) lacks `bytes_first_view`, `requests_first_view` and `max_asset_bytes`.
   - The capture tool has no network or CPU throttle flag.
4. **The street phone list is hard-coded:** `const PHONE = ['SV1','SV2']` (`street-4-review.js:213`). Derive it from the spec, or extend it to every SV view.
5. **The street probe lacks device flags.**
   - Street 2 already plans a `--phone` flag (`street-2-plan.js:224`, S0.U01), and Street 4 passes `--phone SV1,SV2` at 390x844 (`street-4-review.js:242`).
   - The gap: no `--dpr`, `--cpu-throttle` or `--class` flag, a phone list limited to SV1/SV2, and a phone viewport of 390x844 where the gate wants 390x664. Phone-class sandbox counts need all of them.
6. **Phone device evidence for ST8 must not share the desktop directory.**
   - Street 3 reads the *newest* `docs/street/device/*.json` and requires fps_min >= 42 and degrade_max 0 (`street-3-build.js:787,930-932`). Street 4 hard-codes `DEVICE_FPS = 42` with the same check (`street-4-review.js:241,430`).
   - A phone file named `docs/street/device/<date>-phone.json` would become the newest file: Street 4's device gate would read `fail` and Street 3 would record a miss.
   - So phone runs are filed under `docs/street/device-phone/<date>.json` (the ST8 override says so). If Street 3 and 4 are to gate the phone run, they need a script edit to read that directory against the phone bar.
   - `--device` assumes Node on the owner's machine. Needed: an in-page `ANNALS.deviceReport()` (index.html, a Street S0 unit) plus a way to file its JSON in `docs/street/device-phone/`.
7. **No home for a standalone "mobile" ruling.** Folding mobile into R2, R6, R7, R12, R14, R18, ST7, ST8, ST9 and ST19 (above) works. A first-class R23/ST20 (offline and byte budgets) needs the `RULINGS` and `ST_RULINGS` tables extended.
8. **Delivery work** (A8, A9, A10, S6: server and nginx headers, vendoring, service worker) sits outside both programs. It needs its own POLISH items, not ruling text.
9. **Per-class budgets have no home in the street spec.**
   - `/stream` holds scalar `max_jobs_frame`, `tri_cap_frame` and `resident_tris`, which Street 3 reads directly (`street-2-plan.js:305,694,797`; `street-3-build.js:892-893`). The ST9 phone caps (3 jobs, half the triangle cap, an LRU byte cap) and SM1's per-class budgets would never be gated.
   - Needed: extend the spec shape with a `/device_classes` object (per class: inputs, thresholds, calls, tris, resident bytes, quad jobs and tris per frame, ladder floor), and a Street 3 gate that reads it.
10. **Mobile criteria need a route into the specs.** The plan jobs read rulings and bibles, not a criteria file; the research jobs read `todo-inputs.json` (`filigree-1-research.js:438`, `street-1-research.js:794`). §6.3 names the carrier of every criterion. The `"mobile"` block in `todo-inputs.json` (draft in `inputs.json` under `todo_inputs_mobile`) must be written before Filigree 1 and Street 1.

---

## 6. Mobile acceptance criteria to require of the specs

### 6.1 Filigree 2 sheet spec
- **FM1** Every sheet unit states its phone behaviour at 390x664 portrait and about 844x340 landscape, both with browser toolbars (DPR 3): label budget, minimum label gap in CSS px, and the zoom at which delayed names arrive.
- **FM2** Class parity: every class visible on a sheet at desktop is visible on that sheet on a phone by the next zoom step (delay, not drop), checked by capture.
- **FM3** No name shrinks below its desktop size to fit a small viewport, and on a coarse-pointer viewport none is drawn below 12 px (11 px italic), checked at 390x664; `phone.overlaps = 0`; no horizontal scroll.
- **FM4** Every interactive filigree feature has a hit area ≥ 44 CSS px on pointer:coarse, or meets the WCAG 2.5.8 spacing rule. Taps resolve by distance to the glyph centre: one glyph within 22 px opens directly, and the chooser appears only when two or more are within 22 px. Zero wrong-card taps on the fixture cells.
- **FM5** No information is hover-only: each hover reveal names its tap or long-press path, and `:hover` styles are gated by `(hover:hover)`.
- **FM6** Appear effects are opacity/transform only, honour prefers-reduced-motion, and evaluate on the settled zoom after a pinch.
- **FM7** Bytes:
  - Toggle off adds 0 requests.
  - Each sheet entry on a phone adds ≤ 150 KB (proposed).
  - No asset over 500 KB without a low-res step.
  - Old-survey tiles fetch only when on.
- **FM8** Filigree adds no floating control. Its rows live in the layers list / table drawer. The chrome cover at the whole chart stays at or below the post-A4 baseline.
- **FM9** Out-of-band panes are removed, not left at opacity 0. The phone DOM node count at the whole chart has a stated cap.
- **FM10** Sheet bands are stated as absolute zoom, not derived from `fitZoom` (viewport-dependent: 1.95 on iPhone vs 2.35 on Pixel today; see A19). Capture shows the same band zoom on every profile.
- **FM11** Night mode and day mode both pass FM1-FM5 on the phone. A WCAG 1.4.3 contrast check covers the 10-11 px muted mono chrome text (e.g. `.card-type` 10 px at `maps-site/index.html:256`, `.rev .when` at `:292`).
- **FM12** Every filigree asset sits under a versioned URL (e.g. `tiles-v<N>/`) so it can be cached immutably and offline.

### 6.2 Street 2 street spec
- **SM1** Device classes (not the spec's `tiers`, which are camera-radius LOD bands) are defined (inputs, thresholds), each with budgets for calls, tris, resident bytes, quad jobs and tris per frame, recorded in `/device_classes`. Phone-class sandbox counts are measured at 390x664, ratio 1.6.
- **SM2** Every unit names its device-class behaviour as a scale (instance fraction, draw distance, weather step, cloud count), never a removed feature. Off-identity and the simDays fingerprint are identical at every device class.
- **SM3** The quality ladder spec:
  - Uses real (unclamped) frame time over a sustained window, with hysteresis and upward recovery.
  - Includes the street steps before shadows-off.
  - Has a stated floor per device class (desktop 42, phone stated).
  - Builds on the S1 fix.
- **SM4** On WebGL context loss and restore, street resources rebuild from their ST4 keys (the world and sim are never regenerated), and the fingerprint plus the visible street match before and after (`WEBGL_lose_context` test).
- **SM5** `visibilitychange` hidden pauses the streaming queue and rendering. Idle frames are capped or rendered on demand.
- **SM6** Touch:
  - Caravan and building picks use a screen-space tolerance of ≥ 22 px radius.
  - The street camera gestures are specified for one and two fingers, with a hint per pointer type.
  - No keyboard-only street function.
- **SM7** Phone shots and metrics are required for every SV view, not only SV1/SV2. This needs the §5.3 item 4 script change.
- **SM8** The LRU resident cap per device class stays under the phone ceiling stated in the spec. The cap fills coarse, never stalls black.
- **SM9** Session overlays (tidings, weather notes) render in the existing bottom sheets on phones. Sheets do not cover more than 50% at peek or half.
- **SM10** Code weight: the STREET block's added gzip bytes are stated and capped. Street data is generated from the seed, never shipped.
- **SM11** The ST8 phone run is defined: device, duration (≥ 5 min), success bar and file path (`docs/street/device-phone/<date>.json`).

### 6.3 How each criterion reaches the specs
The plan jobs read rulings and bibles, not a criteria file. A criterion therefore needs a carrier: an override text (§5), or the `"mobile"` block of `todo-inputs.json` that the research jobs read (written before Filigree 1 and Street 1). "Block" below means that block; `inputs.json` holds the draft under `todo_inputs_mobile`.

| id | carrier |
|---|---|
| FM1 | R2 (budget, delay) and R18 (viewport); block for the landscape size |
| FM2 | R2 |
| FM3 | block (R2 carries only the size rule; overlaps and scroll need the block) |
| FM4 | R7 |
| FM5 | R7 for halos and long-press; block for the `(hover:hover)` gating |
| FM6 | R6 |
| FM7 | R14 (on demand) and R18 (toggle off); block for the 150 KB and 500 KB caps |
| FM8 | R18 (layers row); block for the chrome-cover cap |
| FM9 | block |
| FM10 | block (and A19) |
| FM11 | block |
| FM12 | block |
| SM1 | ST9 (budgets) and ST8 (viewport); block for the class inputs |
| SM2 | block |
| SM3 | ST7 and ST19 (steps before shadows); block for the ladder spec |
| SM4 | block |
| SM5 | block |
| SM6 | block |
| SM7 | block, plus the §5.3 item 4 script change |
| SM8 | ST9 |
| SM9 | block |
| SM10 | block |
| SM11 | ST8 |

---

## 7. Open questions
1. Should phones get the filigree and street defaults at the same time as desktops, or later per device class (proposed R18/ST7 allow either)?
2. "The Whole Chart" on a portrait phone: letterboxed fit-width (A5) or keep fill-height and add an overview inset?
3. Sim on phones: should one finger pan at high altitude (map-like) and orbit only near the ground?
4. Should `user-scalable=no` go (S13)? It conflicts with WCAG 1.4.4, and iOS ignores it anyway.
5. Hosting: can the home server at princexizor.ddns.net take compressed, cached traffic for a table of phones, or should tiles sit on a CDN or static host? Production nginx headers were not inspected.
6. WebP tiles: these need a visual check on ink-dense tiles (cities, coasts) before a switch. AVIF is not recommended without a perceptual check. Is a 512 px tile re-cut wanted?
7. No real-device data exists:
   - Phone GPU frame times, thermal behaviour, WebKit gestures and `100dvh`/safe-area.
   - Whether the layers control stays open after a tap on a real device (m28).
   - Whether the beat card overlaps the chronicle header (sim p6, unverified).
   Who runs the first phone pass, and on which devices?
8. iOS eviction: is the "Keep for the table" button enough, given that `storage.persist()` support on iOS is unverified? Should the DM's device precache the session's city before each game?
9. Label budgets: what labels-per-area figure? No source gives one, so it needs tuning on a real phone against Filigree densities.
10. Haptics (Android-only `navigator.vibrate`): wanted at all? If so, only as a non-informational extra.
11. HTTPS and wake lock: do `maps.` and `sim.princexizor.ddns.net` both have certificates (`DEPLOY.md:49` only says "via your existing automation")? Service workers, the Cache API, `storage.persist()` and the Wake Lock API all need them. Wake Lock support on iOS is unverified.
12. Is Filigree 1 already past preflight? If so the overrides need a `resume:false` re-run (§5 precondition).
13. Phone-class ladder bar: S16's 30 fps cap and a recovery bar of 50 fps cannot both hold on capped frames. S1 samples uncapped frames only, but the phone class's own step-down floor (28 proposed) and step-up bar are unmeasured and need a real device.
14. The 844x340 landscape viewport is proposed, not captured, and toolbar heights vary by browser. Who captures real-device viewports?
15. Who writes the `"mobile"` block into `todo-inputs.json`, and does it get written before Filigree 1 and Street 1?
16. Should Street 3 and Street 4 gate the `device-phone/` file against a phone bar (§5.3 item 6), or only record it?
