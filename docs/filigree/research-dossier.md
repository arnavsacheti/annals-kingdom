# Cartographic filigree: the Collison/Azlen thread, Bay Atlas, and the Swiss stack

> Snapshot of the 2026-10-04 research pass. Line anchors drift (EPESHU_HF_URI is now at index.html:7584, the #view guard at maps-site/index.html:3529); the filigree workflows re-anchor by pattern (docs/filigree/README.md §7).

Verified 2026-10-04. 16 research tasks (12 web, 4 code) ran before the owner's brief
arrived. Web claims got two adversarial lenses (*source* re-fetches, *refute* hunts
counter-evidence). Code facts got a mechanical *anchor* check. Then the brief
`docs/research/filigree-for-the-table.pdf` arrived, v2 with page 6 "How people are
using it". It is AUTHORITATIVE for intent and for what the posts said. Its
technical claims are cross-checked below. Applied to maps.princexizor.ddns.net:
this digest feeds the four "Filigree for the Table" todo workflows (research →
density bible, planning → sheet spec, implementation → table map, review → punch
list).

Vote key: C confirmed · P partly (correction applied) · U unverifiable · R refuted ·
A anchor-confirmed. Votes are written as `source/refute` for web claims and `A` for
code. Paths: `index.html` = the sim (repo root), `maps-site/index.html` = the atlas; a bare `:N` inherits the nearest preceding path in the same item/cell. Line numbers marked `~` in Leaflet sources come from summarizing fetchers and
are only good to within a few lines.

## 1. What the links are

**What could not be read from the sandbox.** x.com, bayatlas.vercel.app, azlen.me,
map.geo.admin.ch, docs.geo.admin.ch, swisstopo.admin.ch and data.geo.admin.ch all
return EGRESS_BLOCKED. Everything below about post text, replies, Bay Atlas
visuals and the Azlen flyover is **owner's brief**. It has not been re-verified as
a web fact.

**Post dates.** These were decoded from the X snowflake IDs: `(id >> 22) +
1288834974657` ms. This is arithmetic, so confidence is high.

- Collison 2104949645197910404 → **2026-09-29 15:01 UTC**, which matches the brief.
- Azlen 2105540576200581601 → **2026-10-01 06:09 UTC**, which matches the brief.
- One unreproduced search summary dated the Collison post "October 1". The ID shows
  that is wrong.

**(1) Patrick Collison, 29 Sep 2026 (owner's brief).**
- He says online maps elide detail even though high-DPI screens exist, and that he
  wants to "wallow in cartographic filigree".
- His second sentence, as quoted in one search snippet: "AI of course now makes this
  possible: bayatlas.vercel.app". The quote is low confidence and not reproduced.
- The demo is **Bay Atlas**, the Sonoma coast drawn in a style after swisstopo.
- A follow-up link carries the hash `#9/37.75/-122.25`. That is zoom 9 over the
  central Bay, not Sonoma.
- The `/photo/2` URL form implies at least two images. Their contents are known
  only from the brief's plates:
  - Plate one: Bay Atlas, dense, named ridges with heights.
  - Plates two and three: the same ground in default terrain, names stripped.
- Replies, per the brief:
  - **Flurin Laim** links map.geo.admin.ch. The task prompt said "Michael
    Federspiel", but no source shows that name, so use Laim.
  - Evan Applegate links radiantmaps.co (gilded sheets).
  - Casey Handmer mentions a private app with 160+ layers, about 5% of them
    personal.
  - A swisstopo 1:25k reply says the sheets show "huts, footpaths, rock faces".
    That one is a single unreproduced snippet with no name attached (low).

**What plates two and three delete and keep (brief pp.1–3, owner's brief).**
- **Plate two keeps:** Queens Peak and Pole Mountain as icon pins, Cazadero,
  Guerneville, two park pins, hillshade, and creek names (South Fork Gualala River,
  Austin Creek).
- **Plate three keeps:** Goat Rock, Toners Place, Dreamwood, Camp Thayer, the Black
  Mountain Retreat Center pin, and shields 1/116.
- **Deleted by both:** all heights, most knoll names, contour hair, trails, the rust
  coast road colour, and most homesteads.
- **Lesson for the forbidden lists:** a commercial pin replaced a landform name (Black
  Mountain survives only as a retreat pin). A POI pin must never stand in for a
  landform name.
- **Plate-one inventory items the first pass missed:**
  - the braided river;
  - the river-valley "knot": Guerneville, Rio Nido, Villa Grande and Monte Rio are
    four names, not one town;
  - plural highway shields;
  - ▲ peak glyphs;
  - dashed trails and the secondary road through Cazadero;
  - "ocean a flat blue" (versus Azlen's watercolor water);
  - "a shed-scale name sits in the same ink as a peak".

**Bay Atlas.**
- No repository named "bayatlas" was found, and no author or write-up turned up.
- Its stack, as the brief gives it (MapLibre GL + PMTiles + Mapzen terrain + OSM),
  could not be verified (§3).

**(2) Azlen Elza, 1 Oct 2026, quote-posting Collison (owner's brief).**
- The post is "a call for new aesthetics of maps", with a thirteen-second painted
  flyover of San Francisco:
  - the peninsula as a cream sheet;
  - rose-brown block grain;
  - green park voids;
  - contour hair on the western hills;
  - ocher arterials;
  - watercolor water;
  - fog washes over the East Bay and the Marin headlands;
  - no chrome and no pins.
- The brief's own reading: it is a camera move over a painted sheet, not a live map.
  "The wrong model for what appears at a given scale."
- Replies under it:
  - Rasmus Andersson: contrast pools at edges.
  - Someone compares it to earth.cyr.is.
  - Matt Webb: Stamen Watercolor was "ahead of its time".
  - "Cramped".
  - "Pretty maps do not fix bad data".
- The research task for this link found nothing. Its only surviving value is
  context about Azlen himself:
  - his GitHub bio is "design-researcher … more humane interfaces";
  - his most recent repo is `proseset` (2026-08-07), and none of his 72 repos is
    about maps;
  - an April 2026 post (ID-decoded 2026-04-13) shows a "peripheral canvas" whose
    squished edges act as a mini-map;
  - 2020 posts discuss three-level semantic zoom in Roam.

**(3) The map.geo.admin.ch URL, decoded.** Grammar comes from
`geoadmin/web-mapviewer` `packages/mapviewer/src/router/storeSync/`. The spec is
ADR `adr/2021_03_16_url_param_structure.md`.

| param | value | meaning |
|---|---|---|
| `#/map` | — | full app (an `#/embed` variant exists per a docs snippet; unverified) |
| `lang` | en | UI language |
| `center` | 2660000,1190000 | LV95 easting,northing, central Switzerland. The same pair appears verbatim in the docs example URL, so it is probably the national default view rather than a chosen place (inference) |
| `z` | 1 | viewer zoom on a 0–13 scale (docs snippet, medium). 1 is national scale |
| `topic` | ech | a valid topic value per the docs. Whether it is the default topic is unconfirmed |
| `layers` | 6 entries, `;`-separated | each entry is `id[@k=v],visible,opacity`. Visibility is `!visible \|\| visible==='t'`, so **`,f` = loaded but hidden** (code-read, C/C) |
| `ch.swisstopo.zeitreihen@year=1864` | | "Journey Through Time – Maps". 1864 is the last year of the Dufour Map (1:100k, 25 sheets, 1845–Dec 1864). The Siegfried Map is 1870–1926, so 1864 is most likely Dufour (inference). The viewer snaps to the nearest edition |
| `ch.bfs.gebaeude_wohnungs_register` | | Federal Register of Buildings and Dwellings (BFS) |
| `ch.bav.haltestellen-oev` | | public-transport stops plus operating points (BAV) |
| `ch.swisstopo.swisstlm3d-wanderwege` | | hiking trails CH+FL from swissTLM3D. Full yearly update plus ad-hoc fixes |
| `ch.vbs.schiessanzeigen` | | firing-range hazard zones plus dated bulletins (dates, times, weapons, max elevation). Monthly cadence |
| `ch.astra.wanderland-sperrungen_umleitungen` | | hiking/Wanderland closures and detours. Reported via the Swiss Hiking Federation and its cantonal associations. Updated daily (source lens) |
| `bgLayer` | ch.swisstopo.pixelkarte-farbe | colour National Map base |

**Correction to the brief.** The brief describes the link as showing "the 1864
survey, every building, transit stops … on the color national map". As shared, all
six overlays are `,f`. **The link opens on the bare colour base**, and the overlays
wait unchecked in the layer list. That is "overlays in reach, not on the base
drawing", the brief's own rule, already true of the URL.

## 2. Verified findings

### Swiss viewer mechanics (code-read from geoadmin/web-mapviewer)

1. **Layer grammar.** Layers are separated by `;`. Each layer is
   `id[@k=v…],visible,opacity`, and `f` hides it.
   - high · C/C
   - Source: `layersParamParser.js`.
2. **Per-layer time attribute.**
   - `@year=<year>` is written whenever the layer has multiple timestamps and a
     valid current year.
   - `@year=none` is written only when the timeSlider year matches no timestamp.
   - Otherwise the attribute is omitted.
   - medium · P/P (corrected wording)
   - Source: `transformLayerIntoUrlString` in `layersParamParser.js`.
3. **`timeSlider=<int year>`** is in the URL only while the slider is active. It is
   validated against `oldestYear..youngestYear`, and `keepInUrlWhenDefault:false`.
   - high · C/C
   - Source: `TimeSliderParamConfig.class.js`.
4. **`compareRatio`** is the swipe position, valid in 0.0–1.0 inclusive. The slider
   only activates when the value is strictly between 0 and 1, and the param is
   dropped when inactive.
   - high · C/C
   - Source: `CompareSliderParamConfig.class.js`.
5. **URL-synced state, in dependency order:** SearchAutoSelect, lang, NoSimpleZoom,
   sr, Search, Position, Camera, Zoom, 3d, geolocation, topic, CrossHair,
   CompareSlider, Layer, bgLayer, featureInfo, catalogNodes, TimeSlider,
   PrintConfig, hideEmbedUI, wms_url/wmts_url/api_url. bgLayer defaults to `void`.
   - high · C/C
   - Source: `storeSync.config.js`.
6. **Structure.** There is one param-config class per hash key, plus a store↔URL
   sync plugin. The legacy-permalink plugin and the `router/` parent files are
   unverified.
   - medium · P/P
7. **Modules.** Only `menu` (with `ImportCatalogue/external-providers.json`) and
   `i18n` are confirmed. drawing, infobox and map are claimed but unverified, and
   infobox = identify is an inference.
   - low · P/P
8. **Repository.** Node 22, pnpm 10, Vite/Vitest/Cypress (from `package.json`).
   The README has no URL docs; the ADR holds them.
   - high · C/P

### The six layers

9. **Journey Through Time.** Launched in 2013 for viewing maps "from any desired
   era". It spans three generations (Dufour, Siegfried, National Map) at
   1:25k/1:50k/1:100k. The archive scans are static, and only the selected epoch
   changes.
   - medium · U/C + C/P
10. **The time slider** opens from a clock button and shows "the most up-to-date
    combination of map sheets" for the chosen year.
    - medium · P/P
    - The lenses disagree on which layers carry it: one says Siegfried + National
      Map 1:25k, the other says National Map 1:50k (1938–today). Do not cite
      either layer.
11. **Hiking-trail layer**: as decoded in §1.
    - high · C/C
12. **Firing-range layer**: zones are fixed polygons and the bulletins are dated and
    scheduled. It is event-driven.
    - high · C/C
13. **Closures layer**: as decoded in §1. "Most live of the six" is inference.
    - medium · P/P
14. **Stops layer**: as decoded in §1.
    - medium · U/C
15. **Building register**: BFS, served by WMTS and REST. Per-building point
    rendering and the licence wording are unverified.
    - medium-low · U/P
16. **Base and topic.** pixelkarte-farbe = the colour National Map, and `ech` is a
    valid topic.
    - medium · U/C

### Swiss style and how it is reproduced

17. **Imhof relief.**
    - One global illumination direction from the upper left, adjusted locally per
      landform.
    - Aerial perspective: lowlands and far terrain lose contrast.
    - Shading colours seen in sources: grey-blue / blue-violet-grey. The lit/shaded
      colour *sequence* is unverified.
    - medium · P/P
    - The brief's "light upper-left, cool shadow in valleys" is consistent.
18. **Jenny et al. (arXiv 2010.01256).** U-Nets trained on paired DEMs and Swiss
    manual relief learn to:
    - drop minor detail;
    - locally rotate the light;
    - vary brightness by landform.
    Further applications: generalised DEMs for contours, and coastlines. **The input
    is a DEM.**
    - high · C/C
    - "18 experts judged it high quality" is unconfirmed, so do not cite it.
19. **Eduard.** A commercial Mac app (about $99.99) from Monash/ETH researchers. It
    does CNN image-to-image translation trained on DEM plus hand-shaded Swiss
    relief, from 1:25k to 1:1M. The user sets the global light and the network
    adjusts it locally. **It needs a DEM.**
    - medium · U/C
20. **davidoesch/ai-topographic-maps.**
    - What it does: SWISSIMAGE 256px WMTS tiles go through Gemini "Nano Banana"
      style transfer driven by `prompt.txt`, which gives per-class colours:
      buildings light gray, main roads yellow, minor roads white, vegetation green
      gradients, water light blue with darker outline. A `prompt_restart.txt`
      handles retries.
    - Outputs: `{col}_{row}.jpeg` plus `{col}_{row}_map.jpeg`.
    - Scope: a local demo at about 1:2000.
    - high · C/C
21. **davidoesch limitations**, as listed in its README:
    - seams between tiles;
    - incomplete handling of vegetation and water;
    - style drift;
    - occasional outright hallucination;
    - cars left in.
    - high · C/P

### Hi-DPI and density technique

22. **Leaflet `detectRetina`** requests four half-size tiles at z+1 for each tile.
    It also **lowers maxZoom by 1**, so real extra detail needs a pyramid one level
    deeper. `tileSize:512, zoomOffset:-1` avoids the 4× request count.
    - high · C/P
    - Source: Leaflet 1.9.4 `TileLayer.js`.
23. **Real-ESRGAN x4plus_anime_6B** is a smaller anime/line-art 4× model.
    - Its only published evidence is visual comparison against waifu2x. There are
      no fidelity metrics.
    - The "6 vs 23 blocks, 17 vs 64 MB" figures are from a mirror and unverified.
    - medium · P/P
24. **ControlNet tile** (control_v11f1e_sd15_tile) upscales by *hallucinating*
    detail steered by a prompt.
    - Seed reproducibility is **unverified**. Assume it holds only on the same
      hardware and library versions.
    - medium · P/P
25. **labelgun.** Weighted bounding-box label collision, where a higher weight wins.
    The repo was **archived 2025-04-09**. Whether it uses rbush is unconfirmed.
    - medium · P/P
26. **rbush** is a 2D R-tree with bulk loading. That leaflet.layergroup.collision
    uses it was seen only in a snippet.
    - low-medium · U/P
27. **Leaflet.LabelTextCollision** was "stale for six years" *as of the 2023 ICA
    paper*.
    - low · U/U

### Precedents

28. **NLS** offers side-by-side split, spyglass and 3D compare, against modern and
    satellite layers.
    - high · C/C
29. **NLS** also has a separate "change transparency of overlay" slider.
    - medium · U/C
30. **NLS stack (2012).** OpenLayers + GeoServer + TMS + Georeferencer, built by
    Klokan. Not Leaflet, and possibly outdated.
    - medium · P/P
31. **David Rumsey** overlays each old map on a current world map with a
    transparency slider (1680–1930).
    - medium · C/U
32. **Azgaar** has layer presets (Political, Cultural, Religions, Provinces, Biomes,
    Heightmap, Physical…), a tooltip per button showing its hotkey, and drag to
    reorder. Styling lives in the Style menu. Double-click zooms in and
    Shift+double-click zooms out. Max zoom is 20×, set in options.
    - medium · P/P
33. **LotR Project.** Filter by character and by place type, journey paths, and red
    event circles that open a sequence of events. "Dated" and the Ages covered are
    unconfirmed.
    - low-medium · P/U

### Leaflet 1.9.4 smoothness (source-read)

34. **Fractional zoom is native.**
    - `zoomSnap` and `zoomDelta` default to 1. `_limitZoom` rounds only if snap is
      truthy (Map.js ~L1587).
    - Wheel defaults are 60 px/level and 40 ms debounce.
    - high · C/C
35. **A tile layer shows one integer level at a time.** `tileZoom = Math.round(zoom)`
    (GridLayer.js ~L552), CSS-scaled to the fractional zoom. It never blends two
    levels.
    - high · C/C
36. **Overzoom lives in GridLayer, not TileLayer.** `maxNativeZoom` /
    `minNativeZoom`, enforced by `_clampZoom`.
    - high · C/P
37. **Crossfade is a fixed 200 ms JS fade per tile.** The constant is in
    `_updateOpacity` (~L326), and pruning waits 250 ms (~L887). The only switch is
    `fadeAnimation`.
    - high · C/C
38. **Old tiles stay under new ones** via `_retainParent(z-5)` and
    `_retainChildren(z+2)` (~L438–439). The depths are hardcoded. Outside
    `minZoom`/`maxZoom` all tiles are removed.
    - high · C/C
39. **Zoom animation and tile updates.**
    - `zoomAnimation` is skipped when the zoom difference exceeds
      `zoomAnimationThreshold` = 4 (Map.js ~L1667).
    - `updateWhenZooming:true`, `updateWhenIdle:Browser.mobile`,
      `updateInterval:200`.
    - high · C/C
40. **Per-layer min/maxZoom exists only for tile layers.** Markers and paths have no
    zoom range (inference; Path/Marker source not read). Gating them means
    add/remove or CSS.
    - medium · C/P

### Atlas code (anchor-checked; all A unless noted)

41. **Map frame and zoom limits.**
    - CRS.Simple, image 4390×2188, `NZ=4` native (`maps-site/index.html:724`).
    - `zoomSnap:0`, `zoomDelta:.25`, `fadeAnimation:true` (:774–777).
    - `Z_STREET=11.5`, `Z_OPEN_MAX=8.0`, `Z_TIER_D=7.5` (:767).
    - `TIER_CEIL=RETINA?5:6` (:768).
42. **Base layers.**
    - `makeBase`: 256 px JPG, `detectRetina:true`, `keepBuffer:4`,
      `maxNativeZoom` = 5, or 4 on retina, `maxZoom:Z_STREET` (:813–817).
    - Three eras, `modern`/`war`/`imperial` (:819–822).
    - `setEra` swaps the single `curBase` and **writes no hash** (:826).
    - Era radios: "Modern (1374 A.B.)", "War of the Patrons (1124–1133)",
      "Imperial (the golden age)" (:3332–3334).
43. **Tiles on disk** are identical per era: z0..5 = 2/6/15/45/162/630, 860 tiles,
    about 9 MB per era. Sample tile is a 256² JFIF. At z5 one screen px is about
    0.5 atlas px.
44. **Reveal tiers.**
    - Tiers A/B/C are thirds of `TIER_CEIL − fitZoom` (:1208–1213).
    - They toggle on `zoomend` only (:3477–3489).
    - They are applied as CSS pane `opacity:0`, with a 0.2 s transition (:226–238).
    - Tier D (z ≥ 7.5) hides every world pane and rides the live `zoom` event
      through `worldOpacityUpdate` (:547–554, :1994).
45. **Labels.**
    - Labels are DOM `span.lbl` with a text-shadow halo, shown only at tier C via
      `atlas-labels` (:157–161, :3487).
    - Lesser pins never get labels (:176).
    - **There is no collision or declutter logic** (:1220–1237).
    - Font sizes are fixed: 13/14 px, and 12.5 px for way labels (:158, :179, :600).
46. **Continuous ramps** exist only for the base and the city overlay.
    `baseOpacity` goes 1 → 0.12 over z6.2–8, and `overlayOpacity` 0 → 1 over
    z6.8–7.8 (:1833–1835), driven by `zoom zoomend moveend` (:3493). Stroke weights
    are literals, and `setStyle` appears only in hover handlers (:1341–1342,
    :1467–1468).
47. **Custom wheel handler.**
    - It replaces Leaflet's: `scrollWheelZoom.disable()` then
      `setZoomAround(...,{animate:false})`, with `k=0.0045` for the wheel and
      `0.018` for pinch (:869–896).
    - A typical 100 px detent is about 0.45 levels, applied instantly.
    - The Leaflet wheel options at :776–777 are dead.
    - C/P (corrected).
48. **Geometry is drawn once.** Each feature is a single Catmull-Rom `crSpline` at
    fixed density (:927; uses at :1287, :1375, :1417, :1623). A non-exhaustive
    search found no zoom-swapped geometry.
49. **City overlay pipeline.**
    - `registerCityOverlay` takes a URL, canvas or image (webp 0.85) and hot-swaps
      (:2068–2088).
    - Seeded `genCityCanvas` (:2166), called via `ensureCityGen` (:2968–3001).
    - Per-city tone wash sampled from the atlas hue (:1923–1936).
    - Invented road stubs only (:1941–1950).
    - Chart POIs at z ≥ 8 (:2018).
    - Idle pre-warm (:2004–2011).
    - Overlay LRU of 6 (:1857–1863).
50. **Uncharted grain** shows at z > 6.8 outside cities (:557–568, :1995). It is
    the only open-country treatment past z6.
51. **URL hash.**
    - `setHash` uses `replaceState` (:1043).
    - `handleHash` precedence: `journey` > `chart(&poi)` > `company` > `faction` >
      `place` > `view=x,y,z` (:3499).
    - `moveend` writes `#view` unless an entity hash is present (:3528).
    - **Neither era, layers nor night mode is in the hash.**
52. **Contents plates.** Four theme cards (whole, realms, roads, company) plus the
    tongue card (:3677). Presets live in `THEMES` (:1157), and the default overlay
    set is `DEFAULT_ON` (:1153).
53. **Data files.**
    - 16 data files are loaded in one `Promise.all`, and a failure degrades to
      `null` (:3535–3554).
    - `traced-roads.json` (46 unnamed polylines) is **not loaded**.
    - `named-ways` has 2 entries (`prov:trace`), `sea-lanes` has 4
      (`prov:invented`).
54. **Data counts.**
    - `maps_markers.json` has 159 entries; `gazetteer.json` has 176 (village 13,
      town 3, ruin 1 beyond marker kinds).
    - `city-anchors.json` has **136** cities; `city-traits.json` has 27.
    - Only Kolens and Ion Ephel carry a `river` field (`city-traits.json:802`),
      both outside Leponnia.
    - No atlas data file holds rivers, relief, heights, hazards, closures or stops.
    - `maps_markers.json` does carry 3 `Mountains and Hills` markers (Mountain Wall,
      Far Mountains, Fell Mountains) and 5 `Bodies of Water`. They draw as ▲ / ≈ in
      panes pMtn 622 and pWater 618 (`maps-site/index.html:1200–1201`, :804). The
      peak-label slot exists; none of the three is in Leponnia. The Leponnia wiki page
      (`wiki-places.json:150`) names the mountains of Rhoshkhon and Sūs Gimīlīn, canon
      seed for ridge names.
55. **Sim hooks.**
    - Notices: every event goes through `chron(cls,text,x,z,pri)` into `W.chron`,
      and `W.beats` keeps the last 60 (`index.html:3346–3353`). Default priority
      is reign/myth 9, war 8, fate 6 (:3349).
    - Bandit camps: `W.banditCamps` sit by roads (:5203). Ambushes happen within
      260 units and emit a chronicle entry at pri 5 (:5228–5235).
    - Famine and plague raise and clear flags with chronicle entries (:5831).
    - The Pebros camp is a war chronicle entry (:7236–7239).
    - Roads: `W.roads {pts,from,to,major}` grow mid-sim (:3871), and routes live in
      `W.routes` (:3511).
    - Streams: `W.rng.hist` (:3439), plus gen/det/amb (:7161).
    - Dates: `YEAR_AB=1373` (:503).
    - Text-only chronicle export (:6484).
    - Weather: `W.weather` (:3464, `tickWeather` :5002, on `W.rng.hist`) has only
      clear, overcast, rain, snow and storm. There is no fog state.
    - Dragon: `W.dragon` (:3474) and the wake event "a dragon of the old brood, a
      child of Laegos" (:5390).
    - Heightfield and transform: `EPESHU_HF` (:7578–7588) with atlas = (1060,1240) +
      grid·800/768 (see §5 base row). Sim coordinates therefore map to atlas px
      inside window [1060,1240]..[1860,2040].
    - Missing: there is **no party entity**. Outside the window there is no sim
      coverage.

## 3. Refuted / corrected

- **R, refute lens.** "Bay Atlas has an AtlasSwiss style, Mapzen/AWS Terrain Tiles,
  layers for relief, contours, land cover and boundaries." This was a
  search-summary sentence that likely echoed the task prompt. No page text supports
  it. A sibling task's identical "bayatlas-description" (U/U) is the same
  unreproduced summary, not independent support.
- **Corrections to the brief's technical section** (page 7), checked against the
  research:
  - **Bay Atlas = MapLibre GL + PMTiles + Mapzen terrain + OSM**: *unverified*. The
    site is blocked and no repo was found. The only web echo of "Mapzen" is the
    refuted summary above, so it stays owner's brief, not fact.
  - **swisstopo "newer vector service = Mapbox vector tiles + MapLibre style, base
    tileset adapted per zoom"** (brief p7): not addressed by the research and not
    cross-checked. Mark it owner's brief / unverified, like the Bay Atlas stack.
  - **swisstopo = per-scale raster sheets that crossfade.**
    - Per-scale *series* are confirmed: Dufour 1:100k, Siegfried 1:25k/50k,
      National Map 1:25k–1:100k, and Eduard was trained on 1:25k–1:1M.
    - The time slider picks "the best sheet combination for a year" (finding 10).
    - The crossfade *inside map.geo.admin.ch* was not read.
    - Leaflet's crossfade is per tile within one layer (finding 37). It does **not**
      crossfade between two different sheets. The atlas does that by hand with
      `baseOpacity`/`overlayOpacity`.
  - **Per-layer minzoom/maxzoom.** True for MapLibre styles and for Leaflet *tile*
    layers. Leaflet vectors and markers have none (finding 40). The brief's "a layer
    is either in the style or it is not" is how the atlas's tiers behave today, but
    they still **fade 0.2 s**. That fade is the "subtle appear effect" page 6
    praises (see §10).
  - **Fractional zoom with interpolation.** Fractional zoom: yes, already on
    (`zoomSnap:0`). Interpolated line width, text size and opacity: **no Leaflet
    equivalent**. It must be hand-driven from the `zoom` event. Tile layers never
    interpolate between levels; they show `Math.round(zoom)` scaled (finding 35).
  - **Overzoom softness**: confirmed (finding 36). The atlas overzooms z5 → 11.5
    and hides it by fading the base to 0.12.
  - **"The link shows the 1864 survey … on the colour map"**: every overlay is
    `,f` (hidden). See §1.
  - **The follow-up hash `#9/37.75/-122.25`** is the central Bay, not the Sonoma
    coast of plate one. This is not a contradiction; just two different views.
- **Collison post "dated October 1"** (one summary): wrong. The snowflake gives 29
  Sep 2026.
- **"Michael Federspiel → map.geo.admin.ch"** (task prompt): never found. The brief
  names Flurin Laim.
- **Code corrections.**
  - `city-anchors.json` holds 136 cities, not "~35+".
  - `lexicon.json` is 418 KB, not 428.
  - Doc anchors drifted: Imhof open question → `docs/research/atlas-structure.md:53`;
    URL serialization → `map-interface-design.md:23`; detectRetina 4× →
    `web-performance.md:43`; gdal2tiles pipeline → `web-performance.md:49`;
    `Z_STREET` → `maps-site/index.html:767` (not 764).
- **Storage math (corrected, computed).** z5 is 630 tiles on disk (35 columns), not
  "32×32". Each extra level is about 4×: z6 ≈ 2,500, z7 ≈ 10,000 tiles per era. At
  current compression that is roughly 36 MB and 145 MB per era, ×3 eras. This is an
  estimate.
- **`DEPLOY.md:42`** still says tiles z0–4. The disk has z0–5.
- **Data bug.** Drāmūz is at y=1769 in `maps_markers.json:200` (and so in the
  gazetteer), against `city-anchors.json:141` y=1733.8 and the printed dot. That is
  35 px off. Hordon's anchor (1139,1730) duplicates Maeges and disagrees with the
  Hordon marker (1124,1690).

## 4. The smoothness pieces

| piece | Bay Atlas / swisstopo (owner's brief unless noted) | Leaflet 1.9.4 mechanism | atlas today | gap |
|---|---|---|---|---|
| Tile pyramid | MapLibre/PMTiles vector pyramid. swisstopo WMTS raster per scale | GridLayer, one integer `tileZoom=Math.round(zoom)` CSS-scaled (~L552) | z0–5 JPG × 3 eras, 860 tiles, ~9 MB each (`maps-site/index.html:813–822`) | no authored level past z5. Retina caps native at 4 (:815) |
| Generalized geometry per zoom | different drawing per scale (Swiss sheets 1:25k…1:1M, verified series) | none built in; swap layers per zoom band yourself | one `crSpline` per feature at fixed density (:927, :1417) | per-band geometry sets: country/region/valley rivers, roads and paths |
| Per-layer min/maxzoom | style-level gates | tile layers: `minZoom`/`maxZoom` prune (~L422–427). Vectors/markers: none | CSS pane tiers A/B/C on `zoomend` (:3477–3489, :226–238). Tier D live (:1994) | per-*layer* (not per-pane-tier) gates. Labels gated by rank, not one class |
| Fractional zoom + interpolation | MapLibre interpolates width, text, opacity | `zoomSnap:0` legal. No style interpolation | `zoomSnap:0` (:776). Only base/overlay opacity ramp (:1833–1835). Literal weights and 13/14 px fonts | write `--z` on the zoom event, `calc()` stroke and font. Continuous pane ramps in place of binary classes. Eased wheel (:869–896 jumps instantly) |
| Crossfade | Swiss raster sheets crossfade (not verified in the geoadmin code) | 200 ms fixed per-tile JS fade (~L326), parents retained z-5 (~L438) | default `fadeAnimation:true` (no-op, :777). Hand-built base→city crossfade (:1833–1835) | sheet→sheet crossfade between *layers* (country/region/valley) needs opacity ramps like `baseOpacity`. A longer fade needs a GridLayer subclass |
| Overzoom | last tiles stretch ("a lie with good manners") | `maxNativeZoom` in GridLayer `_clampZoom` | z5 → 11.5 stretch, faded to 0.12 by z8. Uncharted grain > 6.8 (:557–568) | an authored valley sheet z6–8 in open country, or an honest softness band (POLISH "Uncharted-band softening", `POLISH.md:33`) |
| Appear effect (v2) | "subtle appear effect" praised under Azlen | tile fade only | tier fade 0.2 s (:226). Overlay ramps | per-rank stagger: names arrive after their ink, not with it |

## 5. The Swiss stack in fiction (CANDIDATES; the density bible decides)

Voice: bronze-age Nīmlad, the Kembar, years A.B. Avoid saint, abbey, priest, baron,
artillery, pilgrim and tithe. The brief's "artillery hours" has no bronze-age reading.
Drop it and use "range days" in the sense below. The brief's "coach posts" (Swiss-stack
table, and again in Research and Implementation) is anachronistic in the same way:
rename it "caravan halts / waystations" and do not let the density bible copy it through.

| Swiss id | meaning | fiction candidates | data today | missing / canon notes |
|---|---|---|---|---|
| `zeitreihen@year` | old survey under the live sheet | **the Imperial sheet** (golden age); **the War sheet** (Patrons, 1124–1133); "what the elders call the road"; old names before the sack of Lepon (745 A.B.) | era bases `maps-site/index.html:819–822`; `setEra` :826; era radios :3332; tiles-imperial/, tiles-war/ | era not in hash; no under/over stack (it is a swap); no fade or swipe (only `prototypes/atlas-night.html:50` split); no old-name layer. Lexicon etymology could supply older forms (not checked) |
| `gebaeude_wohnungs_register` | every structure | **steadings and folds**: herders' folds, steadings, granaries, wayside Kembar shrines, wells, ruined towers. A homestead is a named dot, never a town glyph. If the layer reuses the generated POI pool (`maps-site/index.html:2819–2830`), "The Tithe-Yard" (:2820) and "The Tithe-Barn" (:2829) must be renamed or stripped: tithe is church vocabulary | procedural plans `genCityCanvas` :2166; city-anchors 136; gazetteer village 13 / town 3 / ruin 1; lesser pins :1203, :1227; prototypes `parcels-roofs.html`, `epeshu-chart.html` | no stored structure records; no open-country dots. Every homestead would be `prov:invented` with seeded names from the Patrinaic roots |
| `haltestellen-oev` | transit halts as a network | **caravan halts / waystations, ferry stairs, fords, cog landings, beacon posts**: "the only places a shield is earned". The brief's name "coach posts" is anachronistic (renamed). "Beacon posts" already ships as a generated POI ("The Beacon Post", `maps-site/index.html:2821`; POLISH.md:81, v0.9.8): reuse it, do not duplicate. Transit is ranked with roads (OSM Swiss Style): one rank table covers halts and ways | party-route stops `JSTOPS` (`maps-site/index.html:1306`); sea-lanes 4 with ends (`sea-lanes.json:34`); sim caravans `index.html:3694`, routes :3511 | no halt entity in sim or atlas (`index.html:3871`: roads only, plus cairns and bridges) |
| `swisstlm3d-wanderwege` | blazed paths | **cairned ways, drove-tracks, shrine-paths**: the route the party can follow without a guide | named-ways 2 (`maps-site/index.html:3552`); `traced-roads.json` 46 polylines unloaded; sim cairns | canon key: dotted = *major* roads only, so minor paths are not on the print and are all invented. Never draw a path as dotted |
| `schiessanzeigen` | hazard that turns on and off, scheduled | **range days** read as: levy muster-days on the sling-fields (anchor to the shipped "The Muster Ground" POI, `maps-site/index.html:2830`); the army in the field (Pebros encamped at Lepon until Yuleday); bandit-held stretches; **Tamar's dark hour** (a daily hazard window); rite-days that close a precinct; **dragon flights**, sim-backed: `W.dragon` (`index.html:3474`), wake event "a dragon of the old brood, a child of Laegos" (:5390), and Lugal the Dragon in the Fell Mountains (`wiki-places.json`), taken from the same fixed-seed snapshot as the other notices. "Artillery hours" stays dropped | sim `index.html`: `chron` :3346, `W.banditCamps` :5203, ambush :5228, Pebros :7236–7239; daily eclipse is canon | no notice schema (start/end/severity); sim→atlas px exists only inside window [1060,1240]..[1860,2040] (atlas = (1060,1240) + grid·800/768); sim covers Leponnia only |
| `wanderland-sperrungen` | closures plus detours | **shut ways**: flooded fords, rockfall passes, plague-watched gates, war-shut gates, bandit-held road with the detour the innkeeper gives | sim `index.html`: famine/plague flags :5831, ambush `a.robbed` :5228, Pebros camp :7239 | roads carry no status; no detour model; no atlas layer; the "swap between sessions" needs a per-session file |
| base `pixelkarte-farbe` | colour national map, relief already drawn | **PatrinorModern.png** era pyramid. Brief: "contours first, names second" | tiles z0–5; night invert `maps-site/index.html:37` | no relief, contours or rivers in any atlas file. Imhof/Eduard/Jenny all need a DEM (findings 17–19), and the sim has one inside the Leponnia window: `EPESHU_HF` (`index.html:7578–7588`) is a 768² PNG, height = (R·256+G)/32 − 300 m, traced from atlas window px [1060,1240]..[1860,2040] "including the Aura-Hōth heights inland of Tamaron". The transform exists: **atlas = (1060,1240) + grid·800/768**. Check: Aldorūs sim grid 373/276 (`index.html:7639`) → 1448.5/1527.5 vs `city-anchors.json:52` 1448.6/1527.5. C1, Aldorūs and Epēshu (1236.1,1415) all sit inside the window, so contours, Imhof relief, hachures and peak heights for sheet one can be derived from the seed instead of invented. Only ground outside Leponnia has no DEM. Atlas peak labels: 3 `Mountains and Hills` markers (Mountain Wall, Far Mountains, Fell Mountains), none in Leponnia |

## 6. Fit to the atlas per sheet

Forbidden items come from the brief's page 8 list. Items marked *(derived)* are my
reading of "decide what is forbidden on each".

**Country sheet.** Zoom fit to about tier B.
- Today:
  - era tiles (`maps-site/index.html:813–822`);
  - tiers A/B, which show major regions and seas, then settlements (:226–238);
  - 15 ◉ majors in the raster;
  - realms (`realms.geojson`);
  - Sun Road and East-West Road (`named-ways.json:6`);
  - sea lanes.
- Missing:
  - peaks as overlay data (the ▲ slot, pane pMtn 622, exists with 3 markers, none in
    Leponnia; Rhoshkhon and Sūs Gimīlīn named at `wiki-places.json:150`);
  - rivers as data;
  - the wired road network (`traced-roads.json` unloaded);
  - label ranks and collision (none, :1220–1237);
  - a "one shield" rule.
- Forbidden: homesteads; *(derived)* ridge names, heights, paths and block grain.

**Region sheet.** Tier C, up to about z6.
- Today:
  - `atlas-labels` (:3487);
  - lesser census pins (:1227) with proximity growth (:1253–1275);
  - minor regions;
  - district borders (which are actually roads, `POLISH.md:13`).
- Missing:
  - ridge names and heights (no atlas file holds them; derivable inside the Leponnia
    window from `EPESHU_HF`, canon seeds Rhoshkhon and Sūs Gimīlīn);
  - reserves as wash polygons;
  - a continuous road;
  - the region-chart anchor (`POLISH.md:30`).
- Forbidden: *(derived)* homestead dots (they wait for the valley sheet), contour
  hair and block grain.

**Valley sheet.** Open country, z6–8.
- Today: nothing authored. The base stretches and fades (:1833), and uncharted grain
  shows past 6.8 (:1995).
- Missing: everything the brief lists:
  - homestead dots;
  - contour hair;
  - river forks;
  - the blazed path.
- Forbidden: *(derived)* block grain, city POIs, and shields except on the river
  town.

**City sheet.** z ≥ 7.5.
- Today:
  - Epēshu and Summarch charts (`detail-charts.json:37,45`);
  - POIs, 19 and 9 (`chart-pois.json:2,137`), shown at z ≥ 8 (:2018);
  - seeded generated plans (:2166, :2968);
  - tone wash (:1923);
  - stubs (:1941);
  - prototypes for parcels and roofs.
- Missing:
  - fog washes;
  - painted (non-UI) style;
  - label ranks on charts;
  - park voids and arterial classes in generated plans (not checked).
- Forbidden (brief, Azlen rule): a label on every block, UI chrome and pins. "Texture
  before type, fog as weather."
- **Conflict with shipped work.** Epēshu's 19 POI halos (POLISH.md, v0.8.5) and the
  census pins that grow toward the cursor (POLISH.md:56, v0.9.12) are pins. The spec
  must decide: hover-only halos meet the Azlen rule (nothing drawn at rest) or they
  are suppressed on the painted sheet. Proposed: hover-only halos stay, nothing
  permanent; the owner decides.
- **Fog source (determinism).** `W.weather` has no fog state (see item 55). Fog must be
  a seeded function of place and the snapshot sim day, or a new sim weather state on
  `W.rng.hist`. It must never come from wall-clock time.

**Overlays, any scale.**
- Today:
  - era swap (a base-layer swap in Leaflet's tilePane, z 200);
  - party route and journey (`#journey`, :3499);
  - company and factions;
  - layers control (:3616);
  - themes (:1157).
- Missing:
  - an under/over stack order (old survey *under*, notices *on top*). The "old survey
    under the live sheet" is a raster era layer in tilePane (z 200), **not** a vector pane
    between pRealm 410 and pWater 618 (pWater sits above every tile layer). Spec it as
    two stacked tile layers with `zIndex`/opacity, or a swipe (`compareRatio`), not a
    custom pane;
  - layer and era state in the hash;
  - compare (swipe, fade, spyglass);
  - a notices data file with per-session swap;
  - a DM-driven sheet lock or reveal. Brief p8 makes sheet changes a DM decision
    ("when they commit to a valley, swap"), not only a zoom band. Candidate: a
    `#sheet=valley&at=Aldorūs` hash that clamps zoom to that sheet's band;
  - an in-fiction source voice in the notice schema (`voice`: an old local, the
    innkeeper's slip, the levy-master's board).
- Notices load outside the release cycle: the project releases only at version cuts
  and `POLISH.md:35` cache-busts by `VERSION`, which does not change between sessions.
  Load them by a hash or URL param, a local file import, or a separately cached
  notices URL, or record a documented exception.
- Forbidden: notices drawn *into* the base; anything that needs a redraw to pull.
- **Pane table (proposed paint order, brief p5).** Existing panes
  (`maps-site/index.html:802–805`): pRealm 410, pDistrict 411, pTrail 412, pLane 413,
  pWay 414, pRouteLine 415, pJTrail 416, pCityWash 449, pCity 450, pWater 618 (water
  *labels*), pMajor 620, pMtn 622, pLesser 623, pSettle 624, pMinor 626, pOrigin 628,
  pFaction 630, pRouteWp 640, pJTrav 645, pCityPOI 650. pCityWash and pCity already sit
  in the "under" band.

| order | layer | host | note |
|---|---|---|---|
| 0 | old survey (era) | tilePane z 200, lower tile layer | opacity or swipe |
| 1 | live base + baked relief | tilePane z 200, upper tile layer | relief from `EPESHU_HF` baked in |
| 2 | contours | new pane ~405 | hair weight by `--z` |
| 3 | water fill | new low pane ~408 | pWater 618 holds labels only |
| 4 | rust road | new pane ~417 (continuous), over the dotted canon roads | canon dotted roads stay |
| 5 | reserves (green wash) | new pane ~409 | under road |
| 6 | homestead dots | new pane ~418 | below names |
| 7 | names + heights | pMtn 622 / pLesser 623 / pSettle 624 | rank pass |
| 8 | city grain | pCityWash 449 / pCity 450 | |
| 9 | fog | new pane ~460, `pointer-events:none` | decide whether it masks names |
| 10 | notices | above pRouteWp 640 | swappable |

  (Pane numbers are proposals. "Fog last" puts fog over names; the spec must decide
  whether fog masks them. Proposed: fog sits under labels on the country/region sheets
  and over block grain only on the city sheet.)

## 7. Candidates: one coast, one river town, one painted city

All anchors are atlas px. A z5 tile is `(floor(x/128), floor(y/128))`.

- **Coast.**
  - **C1 Pēshunor / Aura-Hoth-Hanath north coast** (x1236–1725, y1415–1585) is
    recommended.
    - A dotted road hugs the ragged coast, with the Paerāndas offshore (observed on the
      print; no committed crop. Anchor: z5 tiles (9..11, 11) and the Paerāndas marker at
      (1337,1335), `maps_markers.json:135`).
    - It has the Sun Road trace, the North Coast Packet and the wiki line "forests
      run along its coasts" (`wiki-places.json:150`).
    - It shares ground with the river town and the city.
  - **C2 Lamor / Marble Gulf west coast.** The Lepon ruin sits on the coast plus an
    island fort half a mile offshore (`city-traits.json:630`). Best for an old-survey
    (history) sheet.
  - **C3 Rhoshkhon / Gulf of Drāmūz.** The only coast backed by a named range (Sūs
    Gimīlīn, "Mount Star"). It has the strongest ridge-name test, but the whole window is
    covered by `EPESHU_HF`, so heights can be derived rather than invented (Drāmūz
    1335,1733.8 and Shengo 1453,1735 are inside [1060,1240]..[1860,2040]).
- **River town** (solid line = river).
  - **Aldorūs** (1448.6,1527.5; `city-anchors.json:52`) is recommended.
    - Village, pop 300, etymology "the height".
    - The river runs past its west side (print observation, no committed crop: use z5
      tile (11,11), x 1408–1535, y 1408–1535 - Aldorūs falls at 1448.6/1527.5 - or add a
      crop under `docs/research/`), and it is the only ringed place upstream of Sokundo.
    - Its notes are `invented`. `city-traits.json:222` reads "Sits well inland on the
      Leponnian plateau, out of sight of the sea entirely"; biome `plateau`, condition
      `faded`. So the record is sparse and there is room to author.
    - **Data contradiction to queue:** `city-anchors.json:52` puts the sea 77 px NE
      (`sea.side NE, distPx 77`), while the trait note says out of sight of the sea.
    - **Neighbour rule.** Kanae (86 px) and Sokundo (88 px) are close. Under "only the
      river town gets a shield" they lose their shields, or the rule that rejected
      Rēketis (Āglaz 46 px) is applied unevenly. The spec must say so.
  - **Kardunash** (`city-traits.json:573`). Walled harbor and the canon eastern
    border, but the walls survive the hand-cover test.
  - **Rēketis** (`city-anchors.json:62`). Āglaz is 46 px away, so it fails "only
    shielded place".
  - Medem and Summarch were rejected.
  - None of the three has river data.
- **Painted city.**
  - **Epēshu** is recommended. It has a painted chart (3914×4200) with 19 POIs, the
    party is there, and its hinterland lists Sokundo and Aldorūs
    (`city-traits.json:238`).
  - **Summarch.** Chart, 9 POIs, on the Undaukhōr.
  - **Drāmūz.** Generated plan only. Fix the 35 px marker first.
- **One ground.** C1 + Aldorūs + Epēshu all fall inside x1236–1480, y1415–1530, z5
  tiles (9..11, 11). That gives a coherent country → valley → city stack.

## 8. What each todo workflow can reuse

- **Research → density bible.**
  - The plate-one inventory (brief):
    - named peaks with heights;
    - homestead dots;
    - reserve washes;
    - the coast road;
    - river forks;
    - the one shielded town.
  - The Azlen city inventory:
    - block grain;
    - park voids;
    - arterials;
    - fog;
    - contour hills.
  - §5 fiction table and §7 candidates.
  - **Plates two and three inventory** (§1): what each keeps and what both delete, and
    the rule that a POI pin never stands in for a landform name.
  - The fact that **no atlas file holds rivers or homesteads**. Relief, contours and
    heights inside window [1060,1240]..[1860,2040] come from `EPESHU_HF`: bake it into
    atlas relief, contours and heights as a first-class input. Rivers and homesteads
    stay `prov:invented` unless traced from the print; ground outside Leponnia has no
    DEM.
  - **Blank hex, defined.** The atlas has no hex grid, so the unit is one z7 tile
    (32 atlas px, since a z5 tile is 128 px) or a league at a stated px scale (see
    todo-inputs `workflows`). The six things for open ground: contour hair, a named ridge
    with height, a water line or fork, a path or drove-track, a homestead dot, a cover
    wash. Not the plate-one six, which include a shielded town that cannot be on every
    hex.
- **Planning → sheet spec.**
  - §6 forbidden lists.
  - Label ranks: there is no collision code today. A weighted greedy pass on
    bounding boxes (labelgun model; own ~50 lines on rbush, since labelgun is
    archived).
  - Overlay order and the pane table (§6): pane z-indices `maps-site/index.html:802–805`; new panes slot between
    pRealm 410 and pWater 618 (under) or above pRouteWp 640 (on top).
  - Palette: bone paper is the base raster; rust road, ocher arterials, rose-brown
    blocks, wet-blue water.
  - The Imhof light rule (finding 17).
  - Hash grammar to copy: geoadmin `layers=id@k=v,visible,opacity;…` plus
    `timeSlider` and `compareRatio`, inserted into `handleHash` precedence without
    clobbering entity hashes (:3499, :3528).
- **Implementation → table map.**
  - Paint order maps to panes.
  - Continuous ramps follow the `worldOpacityUpdate` pattern (:1988–1996).
  - New raster levels: 512 px or z6 tiles, with retina `maxNativeZoom−1` (:815).
  - Generated sheets must be seeded (mulberry32 by name, as `ensureCityGen` does).
  - AI upscaling (ESRGAN or ControlNet tile) only offline, baked and committed;
    expect seams and hallucination (findings 21, 24).
  - Reuse `registerCityOverlay` for any painted sheet (:2068).
  - Paint order (relief → contours → water → rust road → reserves → homestead dots →
    names+heights → city grain → fog) maps to the pane table in §6. Water fill needs a
    new low pane because pWater 618 holds labels.
  - Bake `EPESHU_HF` into atlas relief, contours and heights (transform in §5 base
    row), offline and committed.
  - Invented knoll and homestead names ("if a knoll has no name, invent one") must be
    generated deterministically from the Patrinaic roots tool with reserved-word
    exclusion, and regenerated through `tools/build-gazetteer.js`, never hand-edited.
  - Sim notices come from a fixed-seed, fixed-`simDays` snapshot of
    `W.chron`/`W.banditCamps`/`W.dragon`, never `ANNALS.fate()`.
- **Review → punch list.**
  - Density against plate one (brief).
  - City against Azlen.
  - Stack swap: era plus notices toggled with no redraw (hash round-trip).
  - Read every name aloud: the gazetteer and Patrinaic roots are generated, so fix
    the source, never the JSON.
  - The hand-cover test on Aldorūs: ridge names must exist.
  - Retina check: `TIER_CEIL` stays pinned.
  - Day mode stays pixel-identical under night CSS (`maps-site/index.html:37`).

## 9. Readers vs navigators (v2)

Two camps, kept apart: **paint on the base, names on a threshold**. Those who hate it
want one sheet answering one question.

**Paint on the base.**
- Fog washes as weather on the city sheet.
- The bone-paper raster stays the ground.
- Pooled-ink edge contrast. Rasmus Andersson's point is that the coast and parks
  read without a stroke. The generator already samples land/water masks and atlas
  hue (`washMake` :1923, `sampleCityMask` :2940), so an edge-darkening pass on
  those masks is cheap.
- **Real colours, not a style palette.** The hand-drawn print's hue is canon. Washes
  should sample it, as `washMake` already does, rather than impose a palette.

**Names on a threshold.**
- The far zoom is almost empty: tier A already shows only major regions and seas
  (:226–233).
- The valley zoom is indecent: label ranks by weight.
- "Selective label masking": knock lines out under overlay labels. Today there is
  only a text-shadow halo (:157). The base raster also carries hand-lettered names,
  so overlay labels can collide with printed ones (open question,
  `atlas-structure.md:53`).
- The appear effect: data steps on a threshold, ink eases over a few tenths of a
  zoom level.

**The one-question view.**
- The Contents plates are already one-question presets (`THEMES` :1157).
- Add candidates such as:
  - "Where can we go this week?": roads, halts, shut ways and range days only.
  - "What is around us?": the valley sheet at the party's place.
- Journey mode (`#journey`) is a one-question view already.
- Navigators get search (:3430) and `#place` without filigree.

**Style separate from geometry.** This is the Vectormap instinct.
- Data JSON is separate from rendering.
- `city-traits.json` is an editable refinement surface (:2).
- `registerCityOverlay` hot-swaps.
- Era rasters are baked, so style and geometry are fused there. Night mode is only a
  CSS invert.

**Data prerequisites.** "Pretty maps do not fix bad data", so these come first:
- `POLISH.md:13` traced road network (USER FLAG). District borders are really roads,
  and the East-West Road trace may follow a river.
- `POLISH.md:44` census second pass (orphan ○, the Pish mis-transcription).
- The Drāmūz marker 35 px error and the Hordon/Maeges anchor (new, not queued).
- River polylines traced from the solid lines (new).
- `POLISH.md:33` uncharted-band softening, which is the valley-sheet appear effect.
- `POLISH.md:30` region-chart zoom-through, which is the region sheet.
- `POLISH.md:38` tier-hidden markers intercept clicks. This matters once panes stack
  under and over.
- `POLISH.md:41` sim ↔ atlas deep-link parity, which is how notices land on places.
- `POLISH.md:35` data fetch cache-busting, which matters for swapping notice files
  between sessions.
- `POLISH.md:28` trackpad gesture feel, which overlaps the "eased wheel" gap at
  `maps-site/index.html:869–896`.
- `POLISH.md:44`'s tail, "◉ majors reveal a tier earlier", which is a label-rank
  decision.
- "Where can we go this week?" extends the shipped "Roads & Waters" plate
  (CHANGELOG 0.11.0). It is not a new view.
- Notice files vs the release rule: per-session notices clash with "only push at version
  cuts" and with `POLISH.md:35` VERSION-based cache-busting (the version does not
  change between sessions). Load notices outside the release (hash or URL param, local
  file import, or a separately cached notices URL) or record a documented exception.

### v2 trend and replies mapped (fix 12)

Brief p6–7 items the first pass skipped, each mapped to an atlas action. Items from
the owner's brief only; none re-verified on the web.

| v2 item | map to |
|---|---|
| "transit ranked with roads" (OSM Swiss Style, State of the Map) | one rank table for halts and ways (§5) |
| "multi-layer road dashes" | canon dotted major roads as a casing layer plus a dot layer, tied to `POLISH.md:13` (traced road network). Never dash minor paths as dotted |
| "buildings drawn under or over the railway" | a z-rule for structure dots against ways: dots under halts and over ways, written into the pane table |
| "hachures that follow the rock" | derive from `EPESHU_HF` gradients inside the window; hand-authored elsewhere |
| viewer speed (Bay Atlas "speed") | a performance budget citing `docs/research/web-performance.md` (frame budget, steady beats fast); measure SVG label updates first |
| "cramped" (Azlen reply) | a minimum label spacing at phone width, enforced by the rank pass |
| "where's Waldo" | label ranks plus the one-question plates (§9) |
| Handmer's personal layers (160+ layers, ~5% personal) | the existing `maps-site/data/reviews.json` as a party layer; the atlas already loads it (`maps-site/index.html:3541`) |
| Stamen Watercolor (Matt Webb) | precedent for the pooled-edge pass. Its published mask, blur and edge-darken method needs a source fetch: **unverified** |
| "permission" (post used as permission) | no action; context only |
| Cartique ("for hobbits") | no action; context. A hobbyist fantasy-map tool, treat as a precedent to look up, not a source |
| MapTiler Landscape; OSM Swiss Style; swissALTI3D; QGIS / Swiss Map Vector 25 | Imhof/ML relief precedents (finding 17); the atlas substitutes `EPESHU_HF` for swissALTI3D. Sources unverified |

## 10. Open questions

- **Bay Atlas.** What is the real stack, region, author and AI method? Only a human
  with the site open can confirm the MapLibre/PMTiles/Mapzen claim.
- **No DEM outside Leponnia.** Inside window [1060,1240]..[1860,2040] the sim's
  `EPESHU_HF` (`index.html:7578–7588`) is a DEM and the transform is known (atlas =
  (1060,1240) + grid·800/768; Aldorūs checks to 0.1 px). Open: ground outside the
  window (the rest of the 4390×2188 atlas, incl. the three `Mountains and Hills`
  markers). The choices there:
  - paint a pseudo-heightmap;
  - glyph → distance field (no precedent found);
  - hand-drawn hachure strokes from authored ridge lines.
  Also open: the heightfield is 768² over an 800 px window (about 1.04 atlas px per
  cell). It is fine for contours at z5–6 and soft past that; resolution at the valley
  sheet needs a check.
- **Fade versus no fade.** The brief contradicts itself:
  - page 7: "names do not fade in from nothing";
  - page 6: the praised "subtle appear effect".
  The proposed resolution, threshold gate plus short ink ease, needs the owner's
  nod.
- **Invented names.** How many invented peak, homestead and path names can the
  campaign carry before canon dilutes? Who approves them, and is `prov:invented` with
  the hearsay watermark enough?
- **Rendering cost.** Can SVG-path stroke and label `calc()` updates run on every
  `zoom` frame at hundreds of labels? Renderer.js and SVG.js were not read, and
  there are no measurements.
- **Old names, dead roads, regrown forest.** The brief's full row is "dead roads, old
  spellings, forest that grew back". Do `tiles-imperial/` and `tiles-war/` differ from
  `tiles/` in roads and forest as well as borders and names? Byte-different at the
  sample tile level (all 3 eras have 860 tiles); a sampled ocean tile at z4 (8,5)
  looks the same by eye, so visual differences are **not yet checked** (needs a
  side-by-side on a land tile). This decides whether "old survey under" is a raster
  swap or a name layer. Invented knoll and homestead names must be generated
  deterministically via the Patrinaic roots tool with reserved-word exclusion and
  regenerated through `tools/build-gazetteer.js`.
- **Notices schema.** Sim day → A.B. date, a start/end pair for notices, and whether
  notices are authored per session (the DM's slip) or exported from the sim.
- **Super-resolution.** Does it preserve the parchment and hand lettering of
  PatrinorModern.png? This needs a local A/B on a crop.
- **Swiss time-slider layers.** Which layers carry the time slider (lenses
  disagree)? Does `@year=1864` show Dufour?
- **Brief internal conflicts (not recorded earlier).**
  - (a) Planning says "peaks and heights always" (p5), but "What to steal" (p8) holds
    ridge names and heights back until the region sheet.
  - (b) Plate one's "same ink for shed and peak" conflicts with label ranks.
  - (c) The planning palette (bone paper, rust, ocher, rose-brown) conflicts with the
    v2 pushback "real land colours, not a style palette". Proposed split: the palette
    for drawn line work, print-sampled hue for washes.
  - (d) The Azlen rule "texture over type" conflicts with the v2 complaint that
    Google/Apple drop street names when zoomed in. Proposed fix: street names on a
    threshold at city zoom.
  - (e) The country sheet's "nothing smaller than the one town" cannot hold on the
    baked base: `PatrinorModern.png` already prints every ○ town and its hand-lettered
    name at z0–5. Either accept the print or plan a de-lettered country raster.
- **Brief vocabulary.** "Coach posts" and "artillery hours" are anachronistic; the
  fiction names are "caravan halts / waystations" and "range days" (§5).
- **Pins on the painted sheet.** Do hover-only POI halos and the cursor-growing census
  pins (`POLISH.md:56`) meet the Azlen rule? (§6 city.)
- **Fog source.** A seeded function of place and snapshot day, or a new `W.weather`
  state (§6).
- **Sea contradiction at Aldorūs.** `city-anchors.json:52` (sea NE 77 px) versus
  `city-traits.json:222` (out of sight of the sea).
- **Stamen Watercolor method** and **the swisstopo vector-service claim** are
  unverified (§3, §9).
