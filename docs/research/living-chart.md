# Deep dive: the living chart — motion, routes and a zoom-through for the atlas

Verified 2026-10-05: 13 tasks (7 web, 6 code). Each web claim got two adversarial lenses (source, refute) and each code
fact a mechanical anchor check (133 facts: 132 confirmed, 1 partly). x.com, vercel.app and most press hosts were
blocked; canon comes from the 51-page wiki extract `maps-site/data/wiki-places.json` (`contentIndex.json` is absent),
so "not in canon" means "not in the extract". The full dossier with votes and anchors is
`../living/research-dossier.md`; it feeds the four Living jobs (`../living/README.md`), which sit after Filigree 4 and
Street 4 and never edit them. Code anchors are by pattern: `maps-site/index.html` (atlas) and `index.html` (sim).

## Provenance: the owner's examples (recollection, low)
- "The two I shared earlier" are the Collison and Azlen posts already in `cartographic-filigree.md`. Their replies are
  unread, and nothing found ties three.js, a zoom transition, Lombard Street or traffic to either thread.
- The **Lombard Street exhibit** (four searches, zero hits) and the **traffic-pattern zoom demo** are the owner's
  recollection, never a precedent. The nearest verified analogue is Mini Tokyo 3D (three.js over a GL map with live
  trains and aircraft; its zoom-level detail is unconfirmed).
- **How to Train Your Dragon** ("moving dragons, water patterns") is a mood, with no map source found.
- The asks, restated: a "transitive" layer that adds detail as you zoom in; footprints on travel routes; traffic
  (caravans, ships); moving creatures; animated water; landmark exhibits. Detail density stays Filigree 3's reveal
  tiers, "Region-chart zoom-through" and "Census second pass": the living chart adds motion only.

## Methods that port (high unless marked)
| method | verified source | the atlas's route |
|---|---|---|
| one playhead trail: per-vertex time, a head and a fading tail from one `t` | deck.gl `trips-layer.ts` | footprints: stamps along JPATH arc length on the presentation clock |
| a registered overlay canvas: 10% pad, CSS transform during `zoomanim`, exact redraw on `zoomend` | Leaflet `Renderer.js` | one canvas inside the existing `pJTrail` pane |
| gate a lazy layer on `zoomend`, never by `minZoom` (it moves the map's zoom limits) | Leaflet `Layer.js` | the zoom-through threshold |
| progress from the rAF timestamp, clamp dt, stop on `visibilitychange` | MDN | `jFrame` already clamps dt at 120 ms |
| keyed seeded streams (mulberry32, ~4G period) | bryc PRNGs | a copy keyed `lc:<class>:<id>:<k>` inside `living.js` |
| precomputed fields, a 15 fps cap, counts by area (seeded by `Math.random` as shipped) | windy.js | re-seeded, deterministic |
| poster → orbit → hotspots, `reveal="manual"` | model-viewer | exhibits: the Street poster, then the step into the sim |
| a chapter = camera pose + layer toggles | Mapbox storytelling | an exhibit = centre + zoom + rows |
| one draw call per kind; arc-length `getPointAt` (med) | three r128 docs | the H1 spike only |
| **not portable**: GL custom layers sharing the map's context (Mapbox, MapLibre, deck.gl interleaved) | their docs | Mercator GL maps; the atlas is Leaflet `CRS.Simple` |

## What the atlas and the sim already hold (code, high)
- **One rAF owner**: `jFrame(now)` drives the journey from the rAF timestamp, clamps dt at 120 ms and re-requests a
  frame while a journey is on, even paused. Neither page has a `visibilitychange` handler.
- **One reduced-motion state**: `jReduceMq`, `jReduced()`, `jrn.forceReduced` and the visible `#jbar-reduce` box.
  The route dash `dashmove` loops for as long as a journey is on and the origin pulse `copulse` runs twice; neither
  has a `prefers-reduced-motion` rule.
- **Panes** come from one literal table; `pJTrail` (z 416) holds the journey trail, below every name pane; UG7 freezes
  the list. `setHash` replaces the whole hash, so a new param is lost on the first card open unless kept. Bands:
  `Z_TIER_D` 7.5, `Z_OPEN_MAX` 8, `Z_STREET` 11.5. Atlas data is top-origin; only the wiki's markers count from below.
- **Places**: the Fell Mountains marker sits at y −93, above the sheet; `party-route.json` index 4 (0-based; Fell Mountains, 782, 8) is where
  the party found Lugal's lair. The Loon Sea has no atlas coordinates at all ("the most northerly region known").
- **Routes**: 12 party-route stops; 4 invented sea lanes on 16-step splines; the Sun Road lies off the printed road
  until "Traced road network"; `traced-roads.json` (46 polylines) is not loaded.
- **Water**: no sheet-wide land/water mask: `washMake` and `sampleCityMask` are per city, and Filigree 3's mask and
  `rivers.json` stop at the DEM window (density-bible B-03).
- **Sim**: the dark hour is one global dim from the drawn sun (`const darkHour =`; 300 s per drawn day); caravans are
  `W.agents` `{route, departDay, speed}` placed by `routePos`; the ships carry a medieval type name that must not
  reach the chart; the dragon is a seeded name of six with its lair at `W.peak`, awake by default in `#s=epeshu`.

## Accessibility (high)
- WCAG 2.2.2 (A): motion that starts by itself, lasts over 5 s and runs beside other content needs a **visible**
  pause or stop; one control for all motion satisfies it. `prefers-reduced-motion` alone satisfies only 2.3.3 (AAA).
- Zoom is not named by 2.3.3 (treating zoom effects as in scope is an inference, medium). iOS Low Power Mode clamps
  rAF to 30 fps (medium); after a hidden tab, clamp dt and resume from the stopped clock.

## Canon (from the extract)
- **Backed**: Tamar's dark hour (a global dim); the named seas and rivers; hurricanes from Ponbar north in late summer
  and autumn; Epēshu's stormclouds in the last days of 1374 A.B.; the Sun Road, the East-West Road, the Dale Road;
  Trogmunder and Green Sea trade; Loon Sea whales and seals; one dragon, Lugal, gone into the Fell Mountains with a
  neutrality the party brokered; the party's route (approximate, in session order).
- **Inferred**: traffic on canon routes, barges, birds (lexicon *leph*, *arbezeph*, *aurael*), traffic weight.
- **Invented**: dragon flocks; a flying Lugal; a kraken or serpent; per-day footprints; lane schedules and cargo;
  hearth smoke; a travelling dark-hour sweep; hoarwyrm and Witch-Bird behaviours; the sim's dragon as Lugal.
- **Words**: caravan string, halt, waystation, *khophesh*, *mūskar* (merchantman) for ships (galley only if LC6 rules it), the herald's tidings, still
  the chart; never the sim's ship-type word, a word of the banned lists, or a UG9 interface word.

## The 2D → 3D hand-off
| option | how | verdict |
|---|---|---|
| H1 | a lazy three.js r128 canvas past `Z_OPEN_MAX` on `zoomend`, per-site origin, ortho camera | an owner-gated, never-served spike: first WebGL in the atlas, a second GL context on phones, 3D drifts on 2D raster, heights only in the Epēshu window |
| H2 | a card action deep-links the sim at `#s=epeshu&goto=<place>&street=1` | the destination: one 3D renderer, determinism already guarded |
| H2z | inside the Epēshu window, zooming from `Z_OPEN_MAX` toward `Z_STREET` crossfades into the Street frozen-view poster, then offers H2 | **chosen** for the "transitive layer"; owner question: is a page change acceptable? |
| H3 | one canvas of stamps, ships, shimmer and shadow blobs | **chosen** for every motion device: no dependency, every sheet, easy to freeze |
| H4 | move the atlas to MapLibre GL | rejected: rewrites the atlas under Filigree; `CRS.Simple` is not Mercator |

## Budgets (proposals; gates count structure under the virtual clock, never fps in the sandbox)
- First view: +0 requests and at most 200 raw bytes of declared hook lines (a literal +0 bytes is unreachable: inline
  code must read `living=1`). Lazy, gzipped, versioned: code ≤ 40 KB, the traffic snapshot ≤ 60 KB, the sea mask
  ≤ 32 KB, a poster ≤ 150 KB.
- Frames: ambient ≤ 20 draws/s on fine pointers and ≤ 15 on coarse ones; one-shot ≤ 30 on phones; rAF work ≤ 6-8 ms on
  a phone; zero rAF when hidden, off-screen, below band, off, covered or still.

## Corrections after planning (2026-10-05)
- Filigree 2 never reads `docs/filigree/todo-inputs.json` (one comment line names it), so no Filigree input is added.
- Filigree 3's land/water mask and rivers are DEM-window-only (B-03): the sheet-wide sea mask and river trace are real
  prerequisites, cross-checked against Filigree's in-window outputs, never replacing them.
- New `.claude/workflows/*.js` files fail a Mobile lane review (UG11 over the union of pipeline keys) unless they land
  while the lane has no passed unit or its review is checked: the living scripts are staged and installed by Living 0.
- Street 3 digests `maps-site/**` every run (GS.8): no `maps-site/` writer runs beside it.
- UG4 fails once the filigree marker exists, so living accept files waive it and re-score its halves; captures always
  name `--out` and `--shots-dir` under `docs/living/`; every `maps-site/` writer regenerates the offline manifest.

## Open questions (the owner's)
1. Which replies showed the Lombard Street exhibit and the traffic demo; which dragon-film scene was meant?
2. Default off until the review and a real-phone look? Is a page change into the sim acceptable as the transitive
   layer, and which landmark is the first exhibit (default: the Epēshīn Forum)?
3. Which creatures may move, and is an invented one allowed under a rumour mark? Does Lugal ever fly (default: no)?
4. Footprints for the Company only or each member; teleport legs as a gap or a sea leg?
5. A whole-sheet dark-hour dim (canon) or a travelling sweep (invented)?
6. The sim's dragon in the canon realm: switched off, made Lugal, or left with a chronicle line?
7. Up to 200 raw bytes in the first view, or a literal +0 (then the chart cannot load)?
