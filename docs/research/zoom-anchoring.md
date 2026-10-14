# Deep dive: anchoring on zoom, and whether a vector city fixes it

Verified 2026-10-07. The research covered 354 unique items. Each item got two independent verifier checks, against the HEAD export and fetched primary sources. The items are:

- 57 shift sources;
- 2 tie-point sets;
- 177 round-0 claims from eight lenses;
- 65 round-1 gap items;
- 53 round-2 gap items: G0 orphaned files, G7 chart-conditioned Epēshu, G8 seam clip, G9 era sheets.

**112 survived (2/2), 184 disputed (1/2), 58 refuted (0/2).** None of the 301 items carried over from the previous draft changed status.

Some sources could not be read:

- x.com is login-walled. The owner's posts are taken from the decoded briefs (`cartographic-filigree.md`, `living-chart.md`, `streamed-streets.md`).
- swisstopo's georeferencing pages, gdal.org, docs.qgis.org, allmaps.org and the campaign wiki were egress-blocked. Claims resting on them are marked unverified.

No browser was run. Every dynamic number is computed from code constants or measured on the z5 tiles and the art files.

Where to find more:

- the full dossier, with votes, anchors and the per-section text, is `../anchor/research-dossier.md`;
- the machine record is `../anchor/findings.json`;
- the browser probes still needed are listed in the dossier.

This applies to maps.princexizor.ddns.net and to the sim's Epēshu.

Confidence labels: **high** means survived 2/2; **[D]** means disputed 1/2, and the stated wording is the one the holding check supports. Units are atlas px: 1 world px = 1 PatrinorModern image px at NZ=4. On screen an error is multiplied by 2^(z−4): ×9.85 at z7.3, ×16 at z8, ×59.08 at Epēshu's live ceiling `cityMaxZ` 9.885.

**Key distinction.** REGISTRATION means where art or geometry sits relative to the atlas coast, rivers, roads and ring-dots, and it is what fixes misalignment. The RENDERING MEDIUM (raster vs vector) brings crispness past the stretched image, interactivity and shared road vertices. A vector city placed through the same `cityBox` misaligns exactly as the raster does.

## Why things shift (confirmed, high)

- **Leaflet does not drift.** `ImageOverlay._reset` rounds both corners through `latLngToLayerPoint`. That puts the overlay within 0.5 px in position and 1 px in size, at any zoom (vlod VL10, 2/2). Tiles, overlay and wash share one projection, and their rounding differs by at most about one screen px (refs C1 **[D]**: the bound is derived, and was verified only in the vendored minified build).
- **Placement is a guess.** `cityBox(a,w,h)` centres every city image on its anchor. It aspect-fits the image into a box of half-size `FOOT_R` (capital 26, town 14, village 9, ruin 8). It has no rotation, no control points and no error estimate (reg R2, 2/2; refs C2, 2/2).
- **The visible shift is that fixed error, magnified.** It has three separate causes:
  1. **Registration errors.** The anchors, the Summarch literal, Hordon, the two DM charts, the seam, and the gates, sea sides and rivers of generated plans.
  2. **Lifecycle motion nobody asked for.** The `setMaxZoom` ease-down, catchment pops, hot-swaps and `ensureArrival` teleports.
  3. **Presentation timing.**
- **Rivers are a fourth registration source the first round missed.** 18 of 135 generated plans have a printed river within 2.5·FOOT_R, and 17 of them draw no river (G0-7, 2/2). So the error is *not* "concentrated in the anchors and the two DM charts".
- **Only 2 of the 25 major sources depend on the medium:** `svg-css-scale-bloom` and `gen-jank-frame-drops`.

## Shift sources: the majors

"Major" is computed: an item that is not refuted and got at least one major vote.

| id | status | what | magnitude (corrected) | fix class |
|---|---|---|---|---|
| anchor-on-label | 2/2 | anchors on labels, not ring-dots | 39 >5 px; median 1.0, p90 35.4; Damoklir 69.1, Paga 68.6, Penthelon 112.8; 16-17 dots outside their own catchment | data via an offline tool (see Registration) |
| summarch-anchor-literal | 2/2 | `{523,58}` hard-coded in `meshedWorldInit` | 19.92 px; 196 screen px at z7.3, ~1.55k at the fly target 10.28 | translation, plus the seat and the waypoint |
| hordon-maeges-duplicate | 2/2 | Hordon on Maeges' dot (1139,1730) | 42.7 px; yank dz 2.33, then a snap to Hordon's plan | data: (1124,1690) |
| canon-hard-edge-seam | 2/2 | canon JPEGs have no alpha or mask | coast jump of 20-31 px; 1.18-1.83k screen px at 9.885 | clip plus fill, with registration |
| maxzoom-ease-down | 2/2 | the cap is set below the current zoom | dz: ruin 3.0, village 2.83, Summarch 2.78, town 2.19, Epēshu 1.885, capital 1.30 | `max(allowed,getZoom())` plus hysteresis |
| canon-art-fit-by-box | [D] | DM art aspect-fit, not fitted | Epēshu: tie rms 8.0; chart→print 8.48/21.05; G7 trace 7.7 | per-city translate+scale record |
| crossfade-double-image | [D] | two coasts visible over z7.1-7.59 | offset × 2^(z−4) | register first; keep the crossfade |
| catchment-swap-pop | [D] | one overlay, synchronous remove | full blink at z≥7.8; ~305 px desktop | fade out; hysteresis |
| synthetic-to-melded-swap | [D] | async mask hot-swaps the plan | coast rotation up to 132°; centre ~287 screen px | re-resolve POIs; crossfade |
| stubs-unramped-and-gap | [D] | stubs placed radially | median 4.2, max 14.0-14.5 px | snap in `buildCityStubs` |
| gates-ignore-atlas-roads | [D] | random gates without a crossing road | 11 of 136 have land approaches; Pomos gets false gates | per-leg medium; wait for "Traced road network" |
| trait-sea-side-vs-atlas | [D] | sea side taken from traits | Sokundo 132°, Tamaron 97° | data (moves `cityCanvasSha`) |
| marker-anchor-pixel-bias | [D] | ○ ring = marker+(1,0); ◉ = marker+(0,−2); anchors about (+1,+1) | 10-14 px at z7.3 | offline tool; no runtime +1 |
| route-faction-coords-off-town | [D] | pips and seats off town | Epēshu 19.1, Summarch 19.9/28.2, Sepos 410.6 | resolve by name |
| pinch-bounce-late-instantiation | [D] | bounce at the cap of 8 | 44-75 px | `bounceAtZoomLimits:false` |
| svg-css-scale-bloom | [D] | **medium**: strokes CSS-scaled mid-fly | stubs up to ×250 | add stubs on landing |
| gen-jank-frame-drops | [D] | **medium**: sync 2048² generation | unmeasured | scheduling only |
| view-hash-lossy | [D] | `#view` applied before the city exists | the checks disagree (cap 8 everywhere vs ≤3.0 dz) | generate, then `setView` |
| ensurearrival-hijack | [D] | unconditional arrival guard | one teleport, ~4.7 levels | per-descent token |
| setminmax-zoom-race | [D] | queued `setZoom` beats `setView` | exitChart lands 1113 px off | `enterChart`/`exitChart` only |
| ceiling-by-centre-not-cursor | [D] | cap follows the centre, not the cursor | wall at 8 (dz ≤3.0) | choose the city by cursor |
| flyto-unclamped-target | [D] | flies request deep zooms | ease-down up to 3.0 | clamp the target |
| panel-covers-fly-target | [D] | no padding on flies | +0.32H phone, −170 px desktop | offset from the settled sheet |
| midfly-mask-callback | [D] | callback uses the mid-fly centre | unmeasured | flying flag |
| eager-overlay-swap-on-fly | [D] | art removed at the fly's start | blank while the arc stays above z7.8 | keep the old overlay |

Minor survivors:

- `tier-classes-zoomend-only`
- `uncharted-stale-class`
- `clamp-pad-map-px`
- `poi-halo-2px-offset`: +2,+2 CSS px; fix with iconSize [26,26]

## Registration (confirmed, high unless marked)

### Anchors: the cheapest fix

- **Verdicts.** **45 move / 2 keep / 4 owner calls** over the 51 audited anchors of 138; the other 87 sit on a printed ring (G0-1, 2/2). This replaces 37/1/2 (gap-anchor C2 **[D]**).
  - The second pass added 8 moves: Sokundo, Kanae, Shengo, Pomos, Ishin, Pish, Ītor Hāspira, Paril.
  - Keeps: Drāmūz (anchor right, marker 35 px S in the sea; queued R21) and Sjefenhold (off-dot on purpose).
  - Owner calls: Paga, Penthelon, Ūmak-nūs-Ion, Kolens.
- **Derivation.** Use an offline deterministic tool with a reviewed by-name table. Do not use a runtime marker-wins rule, and do not snap by distance (gap-anchor C1 **[D]**; G0-5 **[D]**).
  - Paril sits on Mūmakon's ring.
  - The census second pass must come first. Sokundo, Kanae and Shengo have no marker, and six trace records have marker = anchor, both off the print (G0-4, 2/2).
- **The point convention must be ruled before any B0 re-cut.** The candidates are the ring centre, ring−(1,0) and ring−(1,1). Each gives a different `sampleCityMask` window, `cityCanvasSha` and gate set. Tamaron's sea approaches are [319.3,1.6] at the ring centre against [317.7,113.6,3.5] at ring−(1,1) (G0-3, 2/2; the hash differences are inferred, not recomputed).
- **Trio targets** (G0-2 **[D]**): Sokundo ○ (1478.0,1450.0), 5.81 px from its anchor; Kanae ○ (1523.0,1490.0), 7.45 px; Tamaron ◉ (1659,1554). A crop check is still needed.
- **Penthelon.** Its marker (1942,755) is on the ◉. Moving the anchor there drowns the plan, because the r−b≤54 test reads the olive tint as water (~2% land vs ~61%). A different land/water source would touch the UG3-pinned `sampleCityMask` (gap-anchor C3, 2/2). The same test reads 70 of 115 inland anchors as >50% water (gap-print vop-09, 2/2).
- **Collateral of moves.**
  - Approach sets change for six pairs; Harney loses both gates (gap-anchor C6 **[D]**).
  - Route and Sun Road vertices sit on the old anchors; re-trace onto the ink, never snap to anchors (C7 **[D]**).
  - 17 anchor-only names reach `gazetteer.json`, so regenerate it (gap-consumers C11 **[D]**).
  - Re-measure `sea.side`/`distPx`.
  - The living sea-mask pass set moves from 14 to 21 of 38 (gap-anchor C5 **[D]**).
- **Summarch.** Move it by translation only, from (523,58) to the ring: (541.75,49.75) by tie fit, (542.0,50.0) by the detector (G9-4 **[D]**). Keep FOOT_R 14 and north-up. Move the `factions.json` Allhammers seat and the `party-route.json` waypoint with it; (545,80) is offset on purpose. The DM's river runs north of the ring and the atlas river on the other side: an authoring call.

### The two DM charts (Epēshu, Summarch ties survived 2/2)

- **What exists.** Only two city-scale drawings exist (canon C01, 2/2):
  - tile pyramids `charts/epeshu` 3914×4200 and `charts/summarch` 4245×3951;
  - overlay JPGs `art/overlay-Epeshu.jpg` 2863×3072 (2,171,695 B) and `art/overlay-Summarch.jpg` 3072×2859, a ~0.73 downscale.
  - No file carries control points (canon C03, 2/2).
- **Epēshu box today:** (1211.87,1389)-(1260.33,1441), 0.016927 atlas px per art px.
  - Strict identifiable ties: **0**. Tie rms is 8.0.
  - A fitted translation+scale reaches 5.25 but is worse on leave-one-out (9.13).
  - Affine overfits (LOO 19.91), and +5.4° of rotation gains 0.2 px. Rotation, affine and TPS are rejected.
  - Coast-shape matching is multimodal (0.32×-1.04×): **the atlas is too simple at this scale to fit the chart.**
- **Summarch:** tie rms 27.82. Identifiable ties: 2. Recommended: translation only, ~20.4 px.
- **Three coasts** (gap-coasts):
  - The print and the DEM 0 m contour agree to rms 1.33-1.50 px (tc-1 **[D]**: one-directional window-wide), with no correction worth making (tc-2 **[D]**).
  - The **DM chart is the outlier**: chart→print 8.48 rms / 21.05 max, and 666 px² of land over sea (tc-3, 2/2).
  - B-38's "DEM up to 10 px off" measured the DEM against the box-placed chart (tc-6, 2/2), so slice C should clip to the print mask.

| Epēshu placement (scale × today, centre E) | chart→print rms/max | chart→DEM rms/max | land-over-sea / sea-over-land px² |
|---|---|---|---|
| today 1.0×, 0 | 8.48 / 21.05 | 6.88 / 18.84 | 666.5 / 0 |
| 0.6× +3E | **3.58 / 6.66** | **3.57 / 6.84** | 91.1 / 75.3 |
| 0.6× +8E | 4.82 / 9.07 | 5.35 / 9.62 | 39.3 / 106.8 |
| 0.8× +3E | 4.69 / 13.0 | 3.71 / 10.93 | 212.4 / 34.6 |
| 0.8× +8E | 4.83 / 11.02 | 4.48 / 8.69 | — |
| 1.0× +3E | 7.21 / 19.39 | 5.79 / 17.25 | 547.2 / 6.6 |
| 1.0× +8E | 5.88 / 17.27 | 5.15 / 15.02 | — |

(tc-4, tc-5, 2/2; G0-12 reproduces 91.9 / 74.4.)

- **Reading the table.**
  - A free fit runs to the edge of its search box (scale 0.5), so **coast shape cannot choose the scale**. It is a stated policy.
  - Even the best placement leaves ~3.6 px rms (35 screen px at z7.3, 211 at 9.885), in both directions.
- **Two scale criteria conflict** (G0-15 **[D]**). The print coast favours 0.6×+3E. The sim's labels favour ~1.0× (ratio 1.12, or 0.94 without Fairy Arch), and its extent favours ≥1.0× (1.53-1.63×). The atlas wins for placement and the sim follows; the owner picks.
- **A warp was measured and rejected** (G0-11, 2/2). A coast-band warp at 0.6×+3E cuts rms from 3.58 to 1.72, but the misregistered area is 156.2/165.8 against 166.4 unwarped: a third seam sign opens. It also bends canon fabric: Wood Quay moves 3.5 px, and at 1.0× it folds 3.6% of land (G0-14, 2/2; the wall-strain figures are held).
- **The scale itself.**
  - The printed bar is 659 atlas px = 600 mi, i.e. 0.910 mi/px (canon C05, 2/2). The code uses `MI_PER_NATIVE`=600/723 = 0.830 (canon C06 **[D]**). This is an owner question.
  - Summarch's 2.33 km chart fills 28 px, about 17.6× exaggerated (canon C10 **[D]**). **The insets are symbols**, so registration is symbolic: the town on its mark, the coast on the right side, the roads on their printed bearings.

### The seam treatment (G8)

- **Clip.** Use a stored, offline, islet-filled **print-land ring**, applied as a percent `clip-path: polygon()` on the overlay `<img>` through `className` (G8-1 **[D]**; G8-2 **[D]**). Store it over the fixed `sampleCityMask` patch (1201-1271 × 1380-1450).
  - DP 0.25: 148 vertices / 2,007 B CSS today, 74 / 984 B at 0.6×+3E. DP 0.5: 39 / 524 B. All stay within the mask's 0.5 px.
  - Build the mask on a padded window (G8-3 **[D]**).
- **Fill.** The clip reveals the tan wash (ΔE 14.1 from print sea), so add a **sea** fill (G8-4 **[D]**). Make it an `L.imageOverlay` in `pCityWash` at `zIndex:2`: no `createPane`, no `washMake` edit (G8-5, 2/2).
- **Rejected:**
  - an opaque base (G8-6 **[D]**);
  - a runtime canvas mask, which is ~30 screen px blocky at 9.885 (G8-7 **[D]**);
  - a PNG mask under `art/`, which needs a TILES_V bump (G8-8 **[D]**);
  - a pre-warped plate: 3,364 rasters / 36.7 MB re-versioned, and an A-U11 conflict until Mobile 6 passes (G0-13 **[D]**).
- **Ship clip, fill and the registration record as one unit.** Today's unregistered box would clip away 665.8 px² (G8-11 **[D]**). Band 2 (chart sea over print land) needs an owner decision.
- **Browser support.** Unprefixed `clip-path` covers iOS Safari 15+. Evenodd is unverified, so use a single ring (G8-9 **[D]**).

### One record, every reader

- **Who reads `cityBox`.** `ensureCityOverlay`, `buildWorldPOIs`, `worldPOICoord` and `washMake` all read it. `cityMaxZ` repeats the same maths. An override on the bounds alone would split the halos from the art (gap-consumers C9, 2/2).
- **The wash.** `washMake` is UG3-pinned and centres on the anchor, so geometry has to reach it through `reg`/`a` fields.
- **The cap.** `cityMaxZ` and `nearestCity` must read the same scale, or the cap drifts by log2(1/scale).
- **Generated plans** are registered to the coast by construction, and only where `drawWater` holds and the patch has water (reg R16, 2/2). Leave them on `cityBox`.
- **Era sheets are one target.** 748 of 1,260 tile pairs are byte-identical. Ink, rings and road dots match modern within 1 px; the imperial maximum is 1.12 at Heron's House (G9-1, 2/2; G9-2/4/5/6 **[D]**). No per-era fields are needed. The remaining era defect is colour: the wash is ΔG≈29, ΔB≈21 off in Leponnia (G9-8 **[D]**).
- **Roads.** The Sun Road (`named-ways.json`, already an `L.polyline`) sits a median 31.3 px off the printed dots (p90 64.6, max 98.2), and 45% of its samples have no dot in band (gap-print vop-01 **[D]**). `crSpline` adds only ≤6 px on land (vop-02 **[D]**). The North Coast Packet crosses land for 26/27 px (vop-06 **[D]**). Party-route legs are all classed as land: leg 8 is 74% sea (vop-04, 2/2).
- **Realm rings** are the best-registered layer: 3.5-5.4 px from the wash edge (vop-07 **[D]**). **The medium does not cause drift; registration does.**
- **No planned item supplies plan-usable rivers.** Filigree B-13 covers 5 of the 18 river cities (G0-10 **[D]**). An RV-guarded feed changes `atlas_fn_sha.genCityCanvas` only (G0-9, 2/2).

## The vector city: medium, not registration (confirmed unless marked)

- **Vectors misalign exactly like the raster when placed the same way.**
  - `L.svgOverlay` extends `L.ImageOverlay` and keeps its bounds box (refs C9, 2/2).
  - The chart-conditioned prototype placed through `cityBox` has a coast error of 7.7 rms, 1,780 of 5,424 buildings on print sea, and the Forum 9.5 px W of the dot (G7-9 **[D]**; G7-7, 2/2).
  - A generated plan in vector form lands in the same frame (gap-vecbudget C7 **[D]**).
- **Crispness (medium).** At `cityMaxZ` 9.885 the DM raster is 1 texel per **CSS** px, so it goes soft from z8.885 on DPR 2 and from z8.3 on DPR 3. `flyIntoCity` lands at 0.471 texels per device px on an iPhone 13 (G0-18 **[D]**). A sharper source raises the cap by the same amount, so the upscale at the cap stays equal to DPR (G0-17, 2/2).
- **Interactivity.**
  - Per-pane renderers already exist (vlod VL11, 2/2).
  - swisstopo's identify is a coordinate lookup with a 10 px tolerance and 10 features per click, not a geometry hit-test (RA-swisstopo-buildings-overlays **[D]**).
  - A tap lookup must go through the same transform and FM4's single 22 CSS px resolver, which does not exist at HEAD (own-atlas d1/d3).
- **Per-frame behaviour.** During `flyTo`, vectors are a CSS-scaled copy (vlod VL9, 2/2). The cost lands at zoomend/moveend, when *every* layer the renderer holds is re-projected (gap-vecbudget C4 **[D]**). A vector city needs LOD or a raster hand-off below ~z8 (C5, 2/2).

| what | features / vertices | bytes | source |
|---|---|---|---|
| generated village (Kanae) | 715 / 2,581 | 16,701 B gzip | gap-vecbudget C1, 2/2 |
| generated town (Tamaron) | 1,360 / 5,560 | 37,001 B gzip | C1 |
| counterfactual capital (Epēshu) | 2,065 / 8,462 | 59,862 B gzip; delta-int 21,535 | C1 |
| all 136 generated cities | 98,084 / 376,381 | 2.46 MB gzip | C2 **[D]**: only one is live at a time |
| prototype Epēshu (as emitted) | 7,758 / 29,360 | 180,610 B gzip; 9 merged paths | G7-3, 2/2 |
| prototype, non-degenerate | 6,279 / 23,444 | 153,137 B gzip | G7-3 |
| skeleton trace, Epēshu / Summarch | — / 4,624 / 931 | 24,015 / 5,326 B gzip | G0-19, 2/2 |
| full-building trace, Epēshu | 27,763 / 177,225 | 903,456 B gzip | G0-19 |

- **What the numbers mean.**
  - Merge by class into 11-30 paths, or use a per-pane `L.canvas` (C3 **[D]**).
  - The prototype is 2.8× the 8.5k-vertex live ceiling and takes ~1.2 s per build in node (1,177-1,375 ms); 1,377 of its 5,424 buildings have zero area (G7-2, 2/2). **Quote 4,047.**
  - The charts' skeleton is coast/water, Summarch's wall ring and Epēshu's hinterland edge, with **no street network**: the lanes are unpainted ground (G0-20, 2/2). Epēshu has 23,184 building blobs at ≥12 px on the pyramid.
- **Determinism and pins.**
  - `genCityCanvas` is clock-free, but it paints and returns no geometry, so a vector form needs a sibling function or a pinned refactor (gap-vecbudget C8 **[D]**).
  - Prototype ports should seed `xmur3(name+'|vec')` (G7-1, 2/2).
  - A vector *replacing* the hashed `data:` canvas nulls `cityCanvasSha` and fails UG3 (own-atlas c4 **[D]**).
- **Canon question.** Register the raster first. Then take a skeleton trace (~24 KB) as registration and hit geometry. Then a fabric, as its own item, but ask the DM for any Watabou MFCG export first: both charts look like MFCG output (vec V17 **[D]**; vec V18 **[D]**).
- **The sim.**
  - Epēshu's sim streets are invented by `planStreetsFor` (sim S4 **[D]**).
  - Same-named places sit 100-400 m apart between the apps (sim S6, 2/2); projected through `cityBox`, the 13 sim labels miss the chart POIs by 103-488 m (own-sim S8, 2/2).
  - The atlas↔sim transform exists only as literals: atlas = (1060,1240) + grid·800/768, ~11.265 m/px (sim S1, 2/2).
  - Adopting chart geometry re-baselines the whole `#s=epeshu` world (G7-13 **[D]**). Keep the sim out of the first cut.

## How the references stay anchored (high unless marked)

| reference | what keeps it anchored | transfer |
|---|---|---|
| swisstopo Journey Through Time | WMTS grid from the LV95 projection; a year change swaps only `Time` (RA-swisstopo-time **[D]**) | register each chart once, offline, store it; at runtime only place, fade and cap |
| swisstopo vector base | MapLibre mounted only under Web Mercator (2/2) | the medium follows the frame: Leaflet paths in atlas px, no MapLibre |
| swisstopo 2D→3D | hands over view state: centre and height from resolution (2/2) | H2/H2z carry an atlas-px centre and scale through the Epēshu transform |
| Tokyo / 3D Tiles | child transform maps into the parent frame (RA-tokyo, 2/2) | a chain **preserves** registration authored in; it never creates it |
| Bay Atlas, Azlen, Lombard, HTTYD | owner's brief only (all **[D]**) | aesthetic or narrative; not anchoring precedents |
| Leaflet guide, Allmaps | measure known points; fit control-point transforms (RA-tools **[D]**) | port the method, not the libraries; scale+translate first |

**Common principle** (RA-principle **[D]**: the universal wording is the project's conclusion). The detail is registered into one frame. The atlas already has that frame (CRS.Simple, shared by the three `makeBase` pyramids), but city art is not registered into it.

## Ownership and sequencing (confirmed unless marked)

- **Nobody owns registration of city art** (own-atlas a1, 2/2; G7-11 **[D]**). That covers the seam data (G8-10 **[D]**), plan rivers (G0-10 **[D]**) and the ease-down (own-atlas a3 **[D]**). Filigree slice C owns the painted look through the README §7 reuse map (own-sim S18 **[D]**). Living owns H2z, and LC7 is gated and unanswered. Street is sim-only (ST1).
- **Reaching Filigree 2.** A registration item reaches the spec only through a **README §7 row** read live at run time (own-atlas v2, 2/2).
  - POLISH-only items never enter the spec (v4 refuted).
  - Bible edits force a Path B re-integration (v1).
  - A `Filigree data —` title holds Street 3.
- **Where it lands.** "Window A": after Mobile 9/14 are checked and before Filigree 3. One central commit: the canon record, the clip and fill, the anchor moves after the convention ruling, Summarch and its twins, the B0 re-cut, and the gazetteer.

| move | changes | leaves alone |
|---|---|---|
| canon per-city record | shots at city zoom, LV5/LV6 stills (none frozen) | `atlas_fn_sha`, `cityCanvasSha`, TILES_V |
| Tamaron/Sokundo/Kanae anchor moves | `cityCanvasSha` on every profile (B0/R1 re-cut) | marker-keyed mobile ids |
| RV-guarded river feed | `atlas_fn_sha.genCityCanvas` | `cityCanvasSha` |
| mask-path change (Penthelon land source) | `atlas_fn_sha` and `cityCanvasSha` | — |
| CSS clip and fill on the overlay `<img>` | shots only | pins, TILES_V, A-U11's file |
| clip on a new pane, or inside a pinned function | UG7 / UG3 | — |
| new plate or PNG under `art/` | TILES_V (3,364 files, 36.7 MB), A-U11 until Mobile 6 | — |

- **The vector city comes last**, as its own item: atlas-only, beside the raster, on a sibling stream, in `pCity`, placed through the record. Sim `cityLabels` re-registration is fixture-only (SV1/SV3/SV6/SV8) and cheapest before Street 1; the fingerprint invariance is by code reading (own-sim S13 **[D]**).

## Brief and earlier-draft corrections

- **Overlay dimensions.** `overlay-Epeshu.jpg` is 2863 **wide** × 3072 tall; the brief had them transposed.
- **Anchor verdicts.** 45/2/4 over 138, not 37/1/2.
- **Approach pairs.** Six change, not five.
- **Stub gap.** A median of 4.2 px, not 2.2.
- **Error sources.** The error is not "concentrated in anchors + two charts": rivers are a fourth source (G0-7).
- **Ceiling.** Z_STREET 11.5 is a global clamp, not a street hand-off; the Epēshu ceiling is 9.885 (tc-8 **[D]**).
- **Epēshu ties.** Strict identifiable ties are 0, not 2; the policy range (0.83-1.0×) gives 5.3-8 px, not "about 5".
- **Summarch's SSE road chord.** 31.5°, not 34°.
- **Region charts.** These are 1:1 atlas crops: scale 1.00, not 0.961 (canon C19 **[D]**).
- **Blob counts.** Epēshu has 23,184 blobs on the pyramid against 17,323 on the overlay. The source-resolution explanation is an inference.
- **Skeleton.** The "coast, river, walls, gates, main streets" skeleton is not extractable; there are no streets (G0-20).
- **Hordon swap.** The centre shift is ~287 screen px, not 650+. The desktop catchment pop is ~305 px, not 538.
- **A-U11.** The same-file conflict is sourced after all (G0-13). It is a sequencing rule until Mobile 6 passes.
- **MapLibre.** It is out because it has no arbitrary pixel CRS and adds a second engine, not because of the single-file rule (RA-swisstopo-vector-base).
- **Bay Atlas.** "Density is a property of the medium" is rejected.

## Refuted (0/2)

**Shift sources:**

- `overlay-swap-decode-flash`: only in the hot-swap path.
- `descend-lateral-slide`: a marker click never flies.
- `downsample-shimmer`: no geometry moves.
- `tier-d-hard-cut`: the panes already transition.
- `refit-recentres-epeshu`: the reader's centre is restored.
- `tooltip-fixed-offsets`: 6 px margins were ignored.
- `way-spline-off-trace`: the spline adds ≤5.8 px; the trace itself is the error.
- `mask-coast-quantization`: 0.15-0.8 px.

**Gap round 1:**

- anchor C4: 18 of 19 draw no coast.
- anchor C8: there is no Penthelon key, and a 3 px lint fails at once.
- tc-7: no z11.5 coast jump exists over Epēshu.
- tc-9: the figures only roughly agree.
- vop-03: no Stony Ford road in the data.
- vop-05: a re-trace is not hash-neutral.
- vop-08: the district rings are to be relabelled or retired.
- consumers C1: POLISH-only items do not reach Job 2.
- consumers C2: q08-c08 is DEM-vs-chart.
- consumers C3: the scenario split was wrong.
- consumers C4: no hex is reclassified.
- consumers C6: the moves still need mobile rebases.
- consumers C8: the apps link by name.
- consumers C10: (523,58) also lives in `factions.json` and `party-route.json`.
- mobile C1: A-U2 failed.
- mobile C4: the cited sources do not show the claim.
- mobile C5: a rebase cost, not a rule.
- mobile C9: A-U10 is not in HEAD.
- mobile C10: TILES_V is needed only for raster bytes.

**Gap round 2:**

- G0-8: Ion Ephel is anchor-on-label, not a mask bug.
- G0-16: the area-equivalent radius proves nothing about the wall.

**Round 0:**

- canon C02 (truncated), C07 (inference), C18 (`chart-Summarch.jpg` is a city plan), C21 (truncated), C22 (printed-bar figures wrong).
- reg R8 (placement device, not a fix), R12 (Map Warper uses EPSG:4326).
- sim S2 (Shengo is the off-print side), S3 (sea placement wrong), S9 (scale figure wrong).
- vec V1 (only the coast is registered), V7, V11 (unsourced effort), V13 (superseded), V14, V16 (tracing gives shapes, not placement).
- refs C4 (a stability fix, not registration), C10 (merges medium with registration), C17 (the frames are related through `poiRef`).
- own-atlas a5, a6, b6, b10 (superseded by tc-6), c1 (slice C owns neither registration nor a vector city), d4, v3, v4.
- own-sim S19, S21.

## Open questions (none settled; the full list is in the dossier)

- **Boot cap.** Does the `#view` boot cap land every deep link at 8, Epēshu included (P9)? The two checks disagree.
- **Sokundo and Kanae rings.** They need a crop check before the trio is re-cut. Summarch's point (542.0,50.0) vs (541.75,49.75) waits on the convention ruling.
- **Shift share.** How the shift splits between `cityBox`, the ease-down and the swaps has not been measured in a browser (task 19, after Mobile 5).
- **The Epēshu chart itself.** Is it north-up? Is a wall drawn on it (three files disagree)? Which chart pixel sits on the ring?
- **DM masters.** Does the DM hold MFCG seeds, exports or higher-res masters?
- **Miles.** Which mile governs, and how long are a league and a River-Measure?
- **Delivery mechanics.** Does `clip-path` evenodd work on iOS 15? Does A-U11 swap with `setUrl`?
- **The README §7 route.** Two of its three limits are unknown. Does anything hash `docs/filigree/README.md`?
- **Unread sources.** swisstopo's georeferencing method, the Siegfried 0.7 mm figure, Bay Atlas's stack, the Tokyo repo identity and the Lombard link are all unverified.
- **Truncated dissents.** About 14 failing-check objections are cut off in the record, among them G0-13, G8-7, G7-6 and G9-8.
