# Deep dive: the living chart — motion, routes and a 3D detail layer for the atlas

Verified 2026-10-05: 13 tasks (7 web, 6 code). Each web claim got two adversarial lenses (source, refute). Each code
fact got a mechanical anchor check, 133 code facts: 132 confirmed, 1 partly. A web finding survives only if no lens
refuted it, with 'partly' corrections applied. Where both lenses could only say "unverifiable", the claim stays at
**low** confidence and is labelled as such. Hosts that were blocked: x.com, vercel.app, discourse.threejs.org,
minitokyo3d.com, maplibre.org, developers.google.com, w3.org, web.dev, MDN live, and most press sites. Only GitHub raw
pages and search summaries were readable. Canon comes from `maps-site/data/wiki-places.json`, a 51-page extract of the
wiki. **`contentIndex.json` is not in the repo** and the live wiki is unreachable, so a claim that something is "not in
canon" means it is not in the extract. Code anchors are `maps-site/index.html` (atlas) and `index.html` (sim). Line
numbers drift, so re-anchor them by pattern. Atlas anchors in §4–§8 are prefixed `maps-site/`; a bare `index.html` is the sim. This research feeds the shape decision in §7; it is not a job of its own yet.

## 1. The input and its provenance
- **The two threads.** These are the Collison and Azlen posts already digested in `cartographic-filigree.md`.
  - Collison is dated 2026-09-29 by `../filigree/research-dossier.md`, and the post is about map density
    ("cartographic filigree") and Bay Atlas. A new search summary repeats this, but it is an echo and adds no
    independent confirmation.
  - The text of both posts is unread, and so is every **reply**.
  - **Nothing found ties three.js, a zoom transition, Lombard Street or traffic to either thread.**
- **Lombard Street exhibit.** Four searches turned up no three.js or 3D Lombard Street exhibit (high). It is
  **owner-recalled and unverified**. It could be a reply video, a Bay Atlas feature, or a misremembering. Do not cite
  it as a precedent.
- **Traffic-pattern zoom demo.** Also **owner-recalled**. The closest verified real-world match is **Mini Tokyo 3D**
  (below), and nothing shows it appeared in the threads.
- **How to Train Your Dragon.** No source was found for any HTTYD map UI, animated map, dragon flight or water staging.
  Record it as the owner's **design wish** ("moving dragons, water patterns, more alive than a flat map"), not as a
  precedent. The ask is about mood, not a spec.
- **Bay Atlas** stack is unknown (vercel.app is blocked and no repo was found). Never claim it uses three.js or
  MapLibre.
- **The owner's real asks**, restated:
  1. a "transitive" layer that adds detail as you zoom in;
  2. footprints on travel routes;
  3. traffic (caravans, ships);
  4. moving creatures;
  5. animated water;
  6. landmark "exhibits".
- **Mapping "more detail once zoomed in" to existing work.** Density is **not** a living-track job. It is Filigree 3's
  reveal tiers (tier D, the city band), "Region-chart zoom-through" (POLISH.md:447) and "Census second pass". The living
  track adds **motion only**, on top of whatever those tiers reveal; a later plan job must not duplicate their density work.
- **Coverage of the owner's clauses.** Zoom as a transition, selectable moving things, and the to-do deliverable were
  only partly covered: see H2z (§5), the `LC-select` device, and the draft POLISH entries in `todo-inputs.json`
  `polish_entries`.

## 2. Verified findings (confidence · vote record · source)
### Map → 3D precedents
| finding | conf | votes | source |
|---|---|---|---|
| Mini Tokyo 3D layers three.js over Mapbox/MapLibre, with live trains and aircraft, an underground toggle, playback, and a Mapbox token. Stack per the **docs**, not the README; its `ThreeLayerInterface` is confirmed to exist (API unread). Zoom adaptation exists (line offsets by zoom), but "overview far, stations near" is **unconfirmed** | med | partly/partly | github.com/nagix/mini-tokyo-3d |
| maplibre-three-plugin: `MapScene`, flyTo/zoomTo, RTC groups, 3D Tiles, billboards, post-processing. Camera sync is **implied** by the design, not quoted | high | conf/partly | github.com/dvt3d/maplibre-three-plugin |
| Mapbox `CustomLayerInterface`: three.js shares the map's GL context, and render() gets a camera matrix. The layer may assume blend/depth state and **nothing else**. `renderingMode` defaults to `'2d'` (no depth); `'3d'` shares depth. MapLibre's version is inferred from shared lineage | high | conf/partly | mapbox-gl-js `custom_style_layer.ts` |
| Threebox `CameraSync`: world group scaled by zoom, near/far planes from pitch, re-sync on `move`/`resize`, `setLayerZoomRange`, cache for thousands of objects | high (source read) | conf/unverif | jscastro76/threebox |
| Google js-three: a lat/lng/alt **anchor origin** because float32 holds ~7 digits; `resetState()` after each draw; `requestRedraw` only in "always" mode | high | conf/unverif | googlemaps/js-three |
| deck.gl overlaid mode (separate canvas, the default) vs interleaved (shared context, `beforeId`). Interleaved: mapbox v3+, v2.13+ with `useWebGL2`, maplibre v3+ with a WebGL1 fallback. **No blanket WebGL2 requirement.** One synced view; no non-Mercator. Antialias note unverified | med | partly/unverif | deck.gl docs |
| StreetView3DOverlay: three.js model over Street View imagery. The author says registration is imprecise and was tuned by trial and error, so 3D drifts on 2D imagery | high | conf/conf | rbejar/StreetView3DOverlay |
| Cesium 2D→3D is a staged morph: three equal stages, linearly lerped camera vectors, ortho↔perspective frustum. The 2.0 s default and shader-level morph are **unconfirmed** | med | partly/partly | Cesium `SceneTransitioner.js` |
| Discourse thread: a three.js globe handing off to MapLibre city close-ups. The thread exists; its content is unread | **low** | unverif ×2 | discourse.threejs.org/t/…/92585 |
| LIRIS "3D animated map Lyon": bus network as WebGL particles (THREE.js, **Aframe.io**, D3). Particle-per-line is the separate 2D canvas sibling project. Date unconfirmed | **low** | partly/unverif | projet.liris.cnrs.fr |

### Leaflet as host (code-read, v1.9.4)
- **No Leaflet + three.js plugin was found by search** (medium; "not found", not "does not exist"). Searches did find
  WebGL/2D plugins: Leaflet.PixiOverlay (closest analogue), TileLayer.GL, GLMarkers, glify, Leaflet.gl (experimental)
  and CanvasLayer. A three.js overlay is custom code, estimated at ~100–200 lines (unsourced).
- **Renderer.js** (high, conf ×2) is the pattern for a registered overlay canvas:
  - pad the canvas 10%;
  - bind `viewreset`/`zoom`/`moveend`/`zoomend`, plus `zoomanim`;
  - during animated zoom apply a CSS 3D transform from the zoom scale and the new pixel origin;
  - redraw in `_update` on moveend.
- **Layer.js `_updateZoomLevels`** (high, v1.9.4 confirmed): a layer with min/maxZoom **changes the map's zoom
  limits** and fires `zoomlevelschange`. Gate a lazy layer by hand on `zoomend` instead.
- **GridLayer** level stacking, `keepBuffer` and `maxNativeZoom` overzoom (**low**, a summary that was not re-read): the
  raster keeps upscaling past z5, so a detail layer fades in over soft raster, not over blank space.
- **Canvas.js** (high): one coalesced rAF and dirty bounds. Cost still scales with the vectors that overlap the bounds.
- **CRS.Simple handoff** (**inference**, low):
  - world units = atlas px at a reference zoom, scaled 2^(z−ref);
  - a per-site local origin for float32 (the js-three idea);
  - an ortho or low-fov camera.

### Motion technique
| finding | conf | source |
|---|---|---|
| **TripsLayer**: one `currentTime` playhead, per-vertex timestamps, and a fragment discard/fade by `trailLength` (fade only when `fadeTrail`). Per frame it updates two floats and a bool. Timestamps are float32, so subtract an epoch | high | deck.gl `trips-layer.ts` |
| PathLayer `widthMinPixels`/`widthMaxPixels` keep a route legible at every zoom | high | deck.gl docs |
| Kepler Trip layer: `[lon,lat,alt,ts]` LineStrings, trail length in seconds | med | docs.kepler.gl (snippet) |
| SnakeAnim: time- and distance-based reveal at 200 px/s **at current zoom** (so duration varies with zoom); no pause or perf notes | high | README |
| ant-path: pause/resume/reverse; `delay` 400 ms is the **pulse period**, per the README; dashArray `'10, 20'`. The CSS-animation mechanism is **unverified** | med | README |
| windy.js (leaflet-velocity): particle count = area × 1/300 (**divided** by `PARTICLE_REDUCTION` on mobile); 15 fps cap; `destination-in` trail fade; `stop()` cancels rAF; `Math.random` seeding, so non-deterministic as shipped | high | `windy.js` |
| leaflet-velocity canvas layer: one rAF per redraw request, **no pause/stop of its own** | high | `L.CanvasLayer.js` |
| rAF: drive progress from the timestamp argument (120/144 Hz screens); rAF is paused in background tabs. `visibilitychange` is the stop hook. IntersectionObserver sees DOM, not map regions: use `map.getBounds().intersects()` | high | MDN (GitHub source) |
| three r128 `InstancedMesh`: one draw call, per-instance matrix writes; static instances cost nothing per frame | high | r128 docs |
| `CatmullRomCurve3` (centripetal, tension 0.5); constant speed via base-class `Curve.getPointAt` (arc length, cached) | med | r128 docs |
| mulberry32: 32-bit, ~4G period, skips ~⅓ of outputs (irrelevant for decoration) | high | bryc/PRNGs.md |
| earth.nullschool: per-particle interpolation is costly; precompute the field and simplify animated geometry | high | cambecc/earth README |

### Film, game and history precedents (staging, not tech)
- **Marauder's Map** (med):
  - VFX composited moving footprints and labels over a captured physical map, and Cinesite did the ink;
  - the end credits run ~11 min, designed by Rus Wetherell, who animated them in **~20 days**;
  - Evan Davies (Cinesite) made the dissolving footprints;
  - per-walker gait, speed and heading variance is **inference**.
- **AE footprint recipe** (low, unchecked): a rough-edged stamp, scale-pop in, slow fade.
- **MinaLima** (low): designed in-character, not as "Treasure Island" whimsy; the lettering traces the set
  architecture. Lesson: the motion belongs to a believable authored object.
- **Game of Thrones titles** (med): a concave-earth map with a sun inside an armillary sphere; the camera swoops to
  places; clockwork buildings rise and unfold; inspired by the frontispiece map. "Everything else is still; the camera is
  the animator" is **inference**.
- **Total War** (low, unchecked): ambient ships, water lapping and weather; shadows baked far and dynamic near.
- **Crusader Kings III** (low, unchecked): birds, sandstorms, waves.
- **ORBIS** (med): headline network figures are confirmed: 632 sites, 301 ports, 84,631 km of road, 28,272 km of
  river/canal, 1,026 directed sea routes (c. 200 CE). It models time and cost. Mode counts are unchecked.
- **Peutinger Table** (med): an itinerary with red segments marking daily stops (verify the tick detail before
  building). **Gough Map** dates to c. 1400; its red lines are likely built from itinerary distances.
- **Old Assyrian caravans** (low): donkey caravans over ~1,100 km, early 19th c. BCE. String size and km/day are design
  parameters only.
- **Lagash→Nippur** (med): 137 km, 16–17 days towing upstream, ~4× downstream (the source's rounding). Down-rate is
  inferred.
- **Uluburun** (low): coastal hopping with nightly anchorage, an interpretation of the cargo.
- **Minard** (low): width = size, two inks for direction. **Flow-map heuristics** (low): curve long flows, width =
  volume.
- **Mapbox storytelling** (high): a chapter = camera pose + layer toggles + callback. `rotateAnimation` turns 90° over
  24 s **after** the transition. Under 750 px alignment centres.
- **model-viewer** (high): poster slot; `reveal` = `auto`|`manual` (manual waits for `dismissPoster()`);
  `loading` = auto(=lazy)|lazy|eager; `camera-controls`; hotspot slots. Ladder: poster → orbit → hotspots.
- **three r128 HorizontalTiltShiftShader** (high): 9 taps, σ 2.7, `h` 1/512 (set it to 1/width), focus row `r` 0.35.
  Needs EffectComposer.
- **Google Arts & Culture 3D Tours** on ModelViewer (low); **Sketchfab** autostart and turntable, plus a warning against
  texture preload on iOS (low); scroll-driven "camera on rails" (low, unverified).

### Accessibility and craft
- **WCAG 2.2.2 Pause, Stop, Hide** (Level A, from the spec; high) applies to motion that:
  - starts automatically;
  - lasts more than 5 s;
  - runs in parallel with other content.

  Looped water, footprints and creatures are in scope. **One mechanism controlling all motion** satisfies it.
  `prefers-reduced-motion` alone does **not** satisfy 2.2.2 (inference, both lenses agree).
- **WCAG 2.3.3 Animation from Interactions** (AAA, stated on the page; high) covers non-essential motion that
  interaction triggers; parallax is the example. Remedies: avoid, user control, or `prefers-reduced-motion`. Zoom is
  **not named**; reading zoom-scale effects as in scope is inference (med).
- **Material motion** (high): a 50–1000 ms ladder; duration grows with distance travelled; decelerate on enter,
  accelerate on exit. The doc has **no** reduced-motion guidance. It covers UI transitions, not ambient loops.
- **iOS rAF** is clamped to 30 fps in Low Power Mode (WebKit 215745, intentional; med). Chrome's 1 s timer and the
  "75% CPU" figure are dropped.
- **Tab-return dt spike** (high, a standard mechanism): clamp dt (e.g. 0.1 s) and stop the clock on
  `visibilitychange`.
- **Peripheral-motion research** (low, hypothesis): animated peripheral text did not distract from a central task
  (Georgia Tech). "Animation > colour > area > position" in disruptiveness is VT/McCrickard material. Design rule
  either way: keep motion slow and low-contrast, and away from names.

## 3. Refuted / corrected
- Lombard Street exhibit, traffic demo and HTTYD: **not found**. Owner recollection only, never a precedent.
- Mini Tokyo 3D: stack and zoom LOD are **not in the README**. Cite the docs; zoom LOD is unconfirmed.
- Marauder's credits: "5–6 weeks of 20-hour days" and "thousands of footsteps" are **dropped**. The figure is ~20 days
  (Wetherell).
- MinaLima: "showy" boys becomes "cunning, intelligent, crafty".
- Gough Map "c. 1360" becomes **c. 1400**. It is not "only routes with recorded distances".
- deck.gl: "interleaved needs WebGL2" is **wrong** for maplibre v3+.
- Mapbox custom layer: "must not assume GL state" becomes "may assume blend/depth only".
- leaflet-velocity: "redraws immediately on every move" is **dropped**. `PARTICLE_REDUCTION` divides the count.
- ant-path `delay` is the pulse period, not a start delay.
- Cesium: three staged phases, not one tween. The 2.0 s default is uncited.
- Material: the claim that it "ties motion theming to user preferences" is **dropped**.
- WCAG: "both criteria accept prefers-reduced-motion" is **wrong**. That route is 2.3.3 only; 2.2.2 needs a visible
  mechanism.
- Sim budget: "phones ~994k tris in 25 calls, the same as desktop" is ambiguous in `mobile-at-the-table.md:27`.
  `web-performance.md` says desktop is ~1.6M tris / ~50 calls.
- **Coordinates**: the atlas **data files are top-origin**. `px(x,y)=map.unproject([x,y],NZ)`, NZ=4: Summarch y=58
  north, Epēshu y=1404 south. CLAUDE.md's "lat = pixels from the bottom" holds for **wiki Leaflet markers** only. A
  living layer reading `data/*.json` must not assume bottom-origin.

## 4. Devices
Cost is a proposal until measured. "Pause" means the controller stops rAF. RM means `prefers-reduced-motion` or the
"still chart" control.

| device | precedent | web technique (cost · pause · RM) | atlas route (data + anchor) | canon basis | gap |
|---|---|---|---|---|---|
| **Footprints on the party route** | Marauder's Map | seeded stamps every N px along JPATH arc length, alternating L/R, with a TripsLayer-style head and fading tail driven by one `t`. One canvas, 1 draw/frame, ≤15–20 fps · pause hidden/off-screen/below band · RM: static stamps along the whole walked route | `party-route.json` (12 stops, `via[]`); JPATH (`maps-site/index.html:1019`) and `JPPS=260` (3090); `jTrail` (`maps-site/index.html:3120-3138`), pane pJTrail (818); `jReduced()` (`maps-site/index.html:3092`); `#journey=t` | route is canon in kind; points "Approximate", ordered by session; dated only "summer 1374" (Summarch) to "last days of 1374" (Epēshu) | no per-day dates; teleport legs (Far North → Fell Mtns; Sepos → White Sea) must be a sea leg or a gap, never a walk |
| **Each member's road** | Marauder's name labels | footprint tint from `party.json` colour; label rides the lead print · RM static | `party.json` `road[]` and `color`; `buildTrails` conjectural arcs (`maps-site/index.html:1631`) | origins canon, the paths explicitly conjectural | must stay marked invented |
| **Caravans on ways** | Mini Tokyo 3D, TripsLayer, Peutinger ticks | sprite stamps (donkey string) in a pool, position = routePos(route, (day−depart)·speed), stage ticks at high zoom · ≤N per screen from a seeded budget · RM: halted strings at caravan halts | `named-ways.json` (Sun Road, 28 pts; East-West Road); sim `W.agents` {route, departDay, speed} (init `index.html:3442`; push `index.html:3617`) via a **snapshot**; candidate path source for the printed road: `maps-site/data/traced-roads.json` (46 polylines, not loaded by the atlas; verify against the print before use); halts = B-18 `caravan_halt` | Sun Road canon (Drāmūz→Cyrikon via Lepon, Epēshu, Tamaron, Bōlkhar; only stretches near cities kept up); lexicon *khophesh* 'caravan' | Sun Road trace lies **off the printed road** (`density-bible.md:356`) until "Traced road network"; spawns need `W.rng.hist` replay, so not closed-form; volumes invented |
| **Ships on sea lanes** | Total War (low), Uluburun (low) | sail glyph (display noun map: sim `kind:'cog'` (`index.html:3616`) is a medieval ship type; show *mūskar* or galley, never "cog") on the existing lane spline latlngs; coastal hop with a dwell at port; seasonal storm detours · RM: moored at ends | `sea-lanes.json` (4 lanes, `prov:'invented'`); `buildSeaLanes` 16-step `crSpline` (`maps-site/index.html:1385`; `crSpline` 942); `city-anchors.json` 11 `harbor:true` with `sea{side,distPx}` | Trogmunders the canon carriers (catamaran); Green Sea trade hub; Marble Gulf contested with Hordon; the *Tamarnīn* (party ship) | lanes invented, not linked to sim `W.seaRoutes`; no schedules or cargo |
| **River barges** | Lagash→Nippur ×4 | direction-dependent pace: slow up, fast down · RM static | **none**: no river geometry in atlas data; sim rivers only inside the Epēshu window | rivers canon (Tungril, Khephnār, Termos …) | needs traced rivers (solid black lines on the print) |
| **Traffic weight** | Minard, PathLayer clamps | static width = volume, clamped min/max px; two inks for direction · no motion, so it is also the RM fallback | sim `W.routeVolume` / `W.pairLoads` 'si>di' (`index.html:3735-3736`) via snapshot | inferred | Epēshu window only; procedural seeds have no atlas footprint |
| **Animated water** | earth.nullschool, windy, sim water shader | canvas: masked low-contrast noise drift on a sea mask (**no sheet-wide land/water mask exists**: `washMake` `maps-site/index.html:1938` and `sampleCityMask` 2955 are per-city masks around anchors; prerequisite = an offline tool generating a low-res sea mask, lazy-loaded with declared bytes, or one derived from coast polygons); 12–15 fps; precomputed field · RM: frozen frame | the print plus the new sea mask (prerequisite); the sim's `WATER_VS/FS` (`index.html:2280-2355`) is portable GLSL but the atlas has no GL | sea shimmer: canon (White Sea, Great Chasmous, Loon, Green, Aldronde); river flow: **blocked**, no river data (solid lines = rivers; "trace the rivers" is a sibling of "Traced road network", POLISH.md:13) | no WebGL in the atlas; no flow-map source read; no river data |
| **Storms, cloud shadow, smoke** | Total War (low), GoT | slow drifting soft blobs; storm tracks from Ponbar north · RM: one still wash | sim `W.weather` is realm-global (`tickWeather` `index.html:5002-5017`); fog via R13 function; B-37 `fog_wash` | **hurricanes from Ponbar north in late summer/autumn** (storm tracks and stormclouds: canon); Great Chasmous hard to cross then; Epēshu stormclouds, last days of 1374 | no per-region weather; hearth smoke `invented` |
| **Dark hour (whole-sheet dimming)** | none | the sim's dark hour is **one global dimming value** from the sun's direction (`index.html:6195-6197`, `_tamarDir` 6164), not a moving band: render it as a whole-sheet dim; a travelling sweep would be **invented** and is an owner question. Clock = the rAF-timestamp presentation clock, frozen in captures, **never `Date`** (UG3, atlas W=2 cap) · RM: static dim | closed form in the sim; the atlas keeps its own presentation clock since renderTod is decoupled from sim day (300 s/day) | **canon** (tidal lock, ~1 h afternoon eclipse between Rhusagos and Patrinor) | cheap, canon, a good first device; sweep is invented |
| **Birds (inferred) & whales (canon)** | CK3 birds (low) | instanced or sprite pool on seeded curves, `getPointAt(frac(t/period+phase))` · RM: perched/absent | sim birds use `W.rng.amb` layout (`index.html:4384-4440`); atlas: Loon Sea, coasts | whales: canon (Loon Sea whales and seals). Birds: inferred (the lexicon has the words, no canon placement); lexicon *leph* 'bird', *arbezeph* 'eagle', *aurael* 'raven', *hudnūs/dornūs* whale/orca | sim sheep/birds animate on `Math.random`/nowMs: re-author, never copy |
| **Lugal (static glyph)** | GoT clockwork (staging) | one static glyph at the Fell Mountains, drawn from canon data (marker), no flight, no notice-driven path · RM: same glyph | `maps_markers.json` Fell Mountains marker (canon data, not the sim) | **one named dragon**, Lugal, vanished into the Fell Mountains after the Last War; the party brokered his neutrality (`maps-site/data/party-route.json`, `reviews.json`) | the sim dragon is **not** Lugal: `W.dragon.name` is a seeded pick of six names (`index.html:3474`), its lair is `W.peak`, and Myth defaults to Low = on (`index.html:350-351`) so `tickDragon` wakes it in `#s=epeshu`. Dragon flights are dropped; the sim-vs-canon mismatch is an owner-gated sim item after Street 4 |
| **Dragon flocks (HTTYD)** | none sourced | same pool as birds | none | **invented**: no dragon species in the extract | owner question |
| **Far North / Ponbar beasts** | none | **not in the default.** Hoarwyrms and Witch-Birds (named once, wiki-places Far North) may appear only as still, named glyphs; "snow-ripple" and "wheel" behaviours are invented; Ponbar beasts are not shown | regions `realms.geojson` / `minor-regions.geojson` | named in canon, no detail; Ponbar beasts unresolved ("not even the Trogmunders can say"); behaviour = `invented-behaviour` | showing them invents what canon withholds; owner-gated |
| **Route draws itself** | SnakeAnim, ant-path | one-shot reveal on selection, arc-length timed (not px/s), **<5 s** (exempt from 2.2.2) · RM: instant | any route polyline | n/a | none |
| **Rise from the map** | GoT clockwork | structures scale up when tier D arrives · RM: instant | tier D at `Z_TIER_D` 7.5 (`maps-site/index.html:782`) | n/a | **conflicts** with filigree R6 (presence by threshold, ease ≤0.25 zoom / 250 ms); needs a ruling |
| **Zoom-in 3D detail layer** | Mini Tokyo 3D, Threebox, js-three | see §5 | `Z_OPEN_MAX` 8, `Z_STREET` 11.5; `registerCityOverlay` (`maps-site/index.html:2083`); Epēshu canon overlay 2863×3072 | Epēshu window only (sim DEM) | Leaflet has no GL; pane freeze |
| **Landmark exhibits** | model-viewer poster ladder, Mapbox chapters, tilt-shift | poster still in the card → tap → live scene; chapter = Leaflet center+zoom (no pitch or bearing) + layer toggles · RM: poster only | `chart-pois.json` (Epēshu 19, Summarch 9; chart-pixel coords); Street frozen views as posters | Epēshu Forum and the Sun Road through it; Blue Temple of Thobrauk; **Lepon ruins** (745 A.B.); Paerāndas ruins (Mad One inscriptions) | POIs in two cities only; a poster per exhibit is ≤150 KB per sheet entry |

## 5. The 2D → 3D handoff for a CRS.Simple atlas
| option | how | bytes | pros | cons |
|---|---|---|---|---|
| **H1 · lazy three.js overlay on deep zoom** | fetch vendored three r128 past `Z_OPEN_MAX` on `zoomend` (not `minZoom`, which moves map limits). One transparent canvas registered by the Renderer.js scheme (CSS transform in animation, exact camera on `zoomend`); per-site origin, ortho camera; pixel ratio ≤1.5–2 | ~600 KB raw / ~150 KB gz (**unmeasured**) + scene data; 0 in first view | true 3D; matches the owner's "transitive layer" | first WebGL in maps-site; a second GL context on phones; needs a declared pane (UG7, Filigree 2 freeze); custom sync code with no plugin; 3D-on-raster drift (StreetView3DOverlay); only the Epēshu window has heights |
| **H2 · step into the sim's street view** | at the city band in the Epēshu window, a card action deep-links `sim/#s=epeshu&goto=<place>&street=1`; a Street frozen-view still serves as the poster | 0 in the atlas; poster ≤150 KB | reuses Street (caravans, crowds, weather already owned there); one 3D engine; determinism already guarded | a page change, not a zoom; needs "Sim ↔ atlas continuity" (POLISH:458), Street 3/4 and ST18 grammar; Epēshu window only |
| **H3 · canvas-only 2.5D** | one overlay canvas (or `L.canvas`) for stamps, ships, water shimmer, shadow blobs; sprite "rise" | ~10–30 KB code, est. | no new dependency; works on every sheet, not just the window; easiest to freeze for UG8 | no true 3D; per-vector canvas cost |
| **H2z · zoom-through into Street** | inside the Epēshu window, zooming from `Z_OPEN_MAX` toward `Z_STREET` (`maps-site/index.html:782`) crossfades the city overlay into the Street frozen-view poster, and only then offers the step into the sim (H2 link). RM: instant swap | poster ≤150 KB | gives the owner's actual ask, a zoom transition, without WebGL in the atlas; H2 stays the destination | still ends in a page change; needs Street 3/4 and `street=1`; Epēshu window only; **owner question: is a page change acceptable as the "transitive layer"?** |
| H4 · move the atlas to MapLibre | GL custom layers | large | native three.js layers | rewrites the atlas under Filigree; CRS.Simple is not Mercator; **rejected** |

**Recommendation.** Use **H3 for the living chart** (every motion device) and **H2z (with H2 as its destination) for 3D detail**: the sim *is* the
3D detail layer, and exhibits use a poster → "step into the street" link. Keep **H1 as an owner-gated spike**, only
after Filigree 4, Mobile 15 real-device numbers and Street 4, and only if H2's page change feels too abrupt at the
table. Specify the handoff together with "Region-chart zoom-through" (POLISH:447).

## 6. Canon
- **Backed:**
  - the dark hour (Tamar, closed form in the sim);
  - seas and named rivers;
  - hurricane season from Ponbar;
  - the Epēshu stormclouds of late 1374;
  - the Sun Road and East-West Road; the Dale Road;
  - Green Sea and Trogmunder trade;
  - Loon Sea whales and seals, and the "Leviathan Sea" as Patrin hearsay;
  - Lugal (one dragon, Fell Mountains; neutrality brokered by the party, sourced from `maps-site/data/party-route.json` and `reviews.json`, not `party.json`);
  - hoarwyrms and Witch-Birds (Far North, named only);
  - the Ponbar beasts (unresolved in canon: shown only if the owner rules; behaviours of hoarwyrms/Witch-Birds are `invented-behaviour`);
  - the party's route (approximate, ordered by session);
  - Pebros's army outside the Lepon ruins (the only live army).
- **Inferred:** caravan and ship traffic on canon routes (kind canon, detail invented), barges, birds (the lexicon has
  the words), traffic weight from the sim.
- **Invented:**
  - a travelling dark-hour sweep (canon is a global dimming);
  - hoarwyrm snow-ripples and Witch-Bird wheels (behaviour);
  - dragon flocks of any kind (HTTYD);
  - a flying Lugal over Leponnia;
  - a kraken or serpent at a fixed spot;
  - per-day footprints;
  - lane schedules and volumes;
  - hearth smoke;
  - griffons, wyverns and rocs;
  - Dagon as an ambient creature. Dagon is a one-off session-6 attack on the *Tamarnīn*, known only from `party.json`.
- **Display nouns.** Sim agents use `kind:'cog'`; map to *mūskar* or galley before any visible text.
- **Voice.** Use caravan, string, halt, waystation, *khophesh*, *mūskar* 'courier/merchantman', herald's tidings,
  muster day, still chart / furl. Never "coach", "pilgrim" (in the church sense), or gunpowder words. UG9 bans the
  visible words toggle/tap/swipe/download.

## 7. Fit with Filigree / Street / Mobile
- **Connects:**
  - journey mode (`jrn._rafOn`, `jReduced`) as the single-rAF-owner pattern;
  - B-18 `caravan_halt` for endpoints; B-41 `muster_day` (the dark hour; not dragon flights); B-42 `shut_way` (diverted
    caravans); B-37 `fog_wash`;
  - the R13 fog function; R12 `notices=` snapshot (never wall-clock; a stale snapshot reads "last cried, <n> A.B.");
  - Street `routePos`/`updateAgents`;
  - "Sim ↔ atlas continuity" (POLISH:458); "Region-chart zoom-through" (POLISH:447); "Traced road network" (POLISH:13);
  - R18-style default-off toggle;
  - **one reduced-motion source and one control for all motion**: the living layer reuses `jReduceMq`/`jReduced()` (`maps-site/index.html:3091-3092`), not a second `matchMedia`; LC2's "still chart" control also governs journey playback and `.route-line.playing` (WCAG 2.2.2 by one mechanism);
  - **snapshot ownership**: caravan/ship tracks "with the herald's tidings (`notices=`)" extend R12's Filigree-owned snapshot, which Filigree 2 will freeze. Either reserve a versioned field in the Option C Filigree 2 input now, or ship a separate `living=` snapshot file;
  - absolute bands (`Z_TIER_D`/`Z_OPEN_MAX`/`Z_STREET`), with a phone delay of at most +0.5 zoom.
- **Conflicts:**
  - Filigree 3 holds **both** `maps-site/index.html` and `index.html` (POLISH.md ~519, "job holds both"; docs/mobile/README.md:77), so sim-side living work cannot overlap it either.
  - Street ST1: sim only, never the atlas. ST3: render-only. ST7: rows only, **no new keys**, `street=1`. ST10: party
    presence in the sim is out of scope.
  - ST18 param grammar: `living` passes (`^[a-z]+$`, no trailing s).
  - Street already claims caravans and weather in the sim, so a duplicate engine risks double toggles. Ruling: the sim
    owns 3D street life; the atlas owns chart-scale glyphs read from a snapshot.
  - UG7 pane freeze (no `createPane`) and the Filigree 2 `pre_filigree_panes` freeze.
  - UG3 clock tokens (atlas P=1/W=2; sim 37/37).
  - UG8 desktop identity; UG10 first-view bytes.
  - R6 no fade-from-nothing; the density-bible appear clause (`docs/filigree/density-bible.json:2374`).
  - The Mobile rebase rule: an app-file edit mid-lane invalidates the baselines.
- **Queue:** Filigree 1 is done and **Filigree 2 has not run**. That makes now the cheap moment to add *inputs*, such
  as a reserved living pane or z-slot in the pane table and the clock rule. Build items sit **after Filigree 4 and
  Mobile 9** (atlas). Any sim-side piece sits **after Street 4**. The **H2 link unit and exhibits are split from the
  atlas devices**: they need `street=1`, which does not exist yet (no `street=` in `index.html`; only `goto=` at
  `index.html:5923`), so they queue after Street 3/4, not with the atlas items after Filigree 4. Draft entries and exact
  insertion points are in `todo-inputs.json` `polish_entries`.

## 8. Budgets and gates (proposals until measured)
- **Bytes:**
  - first view +0 B / +0 requests on iphone13 (UG10; today 427,384 B over 37 requests);
  - lazy chunks gzipped and versioned-immutable;
  - no asset over 500 KB without a low-res step (Principle 8);
  - a poster is ≤150 KB per sheet entry, and a pan/zoom step stays ≤100 KB;
  - never repeat the 2.17 MB `overlay-Epeshu.jpg`.
- **Frame:**
  - rAF work ≤6–8 ms on a phone and ≤10 ms on desktop;
  - 15–20 fps for ambient layers, 30 fps cap on phones (iOS LPM clamps to 30 anyway);
  - progress from the rAF timestamp; clamp dt;
  - slice anything over 50 ms;
  - one canvas and ≤10 draw calls (H1: InstancedMesh, never per-footprint meshes).
  - Gates count structure under the virtual clock: SwiftShader fps is informational only.
- **Battery:** zero rAF when hidden (`visibilitychange`; there is none in either app today), off-screen
  (`getBounds().intersects`), below band, layer off, a card open over the layer, or RM.
- **Reduced motion:**
  - one visible **still-chart** control in the layers row (WCAG 2.2.2), initialised from `matchMedia` and live to its
    `change` event;
  - RM freezes `t` on a fixed, pleasing frame, so information stays;
  - zoom-scale effects become instant (2.3.3);
  - the missing CSS `@media (prefers-reduced-motion)` for `dashmove`/`copulse` (`maps-site/index.html:215-216, 420-421`) edits existing atlas animation: **not part of this track**. Queue it as its own item after Mobile 9, or hand it to the Mobile atlas lane with an owner nod (an app-file edit mid-lane trips the rebase rule, docs/mobile/README.md:81).
- **UG3:** no new `Math.random`/`Date.now`/`performance.now`. Seed with the existing `xmur3`/`mulberry32` *idiom*
  without calling or touching those functions, `genCityCanvas`, `washMake` or `sampleCityMask` (cityCanvasSha
  unchanged).
- **UG8:** default-off alone does **not** keep desktop identity: a layers-panel row and the "still chart" control add pixels to desktop shots. Either render both only when `living=1`, or have each unit declare the panel region under UG8 (docs/mobile/README.md:29), as R18 did. A default-on layer must declare mask rects and keys.
- **Seeded atlas function inputs.** A constant seed literal, and day = the snapshot's day plus the presentation clock (rAF timestamp). The atlas has no sim day; never wall-clock (R12, UG3).
- **Also:** UG2 (a failed lazy fetch must be handled, not logged as an error), UG7, UG9.

## 9. Open questions
1. What do the threads' replies show? The owner could paste links or screenshots of the Lombard Street exhibit and the
   traffic demo.
2. Which HTTYD scene does the owner mean: the film's map, or the series?
3. Motion default: off (R18-style) or on?
4. Which creatures (§6)? Lugal's flight vs his brokered neutrality; the sim dragon in `#s=epeshu`.
5. Footprints: the party route only, or each member? Do teleport legs become a sea leg or a gap?
6. Should the atlas ever carry WebGL (H1), or is the sim the only 3D (H2)?
7. Do caravans and ships come from a sim snapshot (shared, Epēshu window only) or a seeded atlas function (every sheet,
   invented)?
8. Per-frame cost of canvas stamps and water on real phones (Mobile 15).
9. River geometry: trace the solid lines first?
10. Which landmark gets the first exhibit?
11. Is a page change acceptable as the owner's "transitive layer" (H2z), or must the zoom stay inside the atlas (H1)?
12. May a moving glyph be selectable (LC-select)? Proposed yes.
13. Snapshot ownership: reserve a versioned field in R12's snapshot (Filigree 2 input) or ship a separate `living=` file?
14. Should the dark-hour travel as a sweep (invented) or dim the whole sheet (canon)?
15. The sim dragon vs canon Lugal (random name, lair `W.peak`, wakes in `#s=epeshu`): fix in the sim after Street 4?
16. Hoarwyrms/Witch-Birds as still named glyphs, or not shown; Ponbar beasts stay hidden unless ruled.
