# Deep dive: cartographic filigree — the Collison/Azlen thread and the Swiss stack

Verified 2026-10-04: 16 tasks (12 web, 4 code). Each web claim got two adversarial lenses (source, refute) and each
code fact a mechanical anchor check. The results were cross-checked against the owner's brief
`filigree-for-the-table.pdf` (v2), which is authoritative for intent and for what the posts said. x.com, Bay Atlas
and geo.admin are egress-blocked, so post contents are **owner's brief**. The full dossier with votes and anchors is
`../filigree/research-dossier.md`. Applied to maps.princexizor.ddns.net, it feeds the four Filigree jobs
(`../filigree/README.md`).

## The links (confirmed, high)
- **Dates.** Decoded from the X snowflake IDs: Collison 2026-09-29 15:01 UTC; Azlen 2026-10-01 06:09 UTC. One
  summary that said "October 1" for Collison is wrong.
- **The geo.admin reply is Flurin Laim** (brief). No source names "Michael Federspiel".
- **The `map.geo.admin.ch` URL**, decoded from `geoadmin/web-mapviewer`:
  - `layers` = `;`-separated `id[@k=v],visible,opacity`, where `,f` = loaded but hidden;
  - `@year=` per layer;
  - `timeSlider` appears only while active;
  - `compareRatio` (0–1 swipe) is dropped when inactive.
- **Correction to the brief.** All six overlays in the shared link are `,f`. It opens on the **bare colour base**,
  with the old survey, buildings, stops, paths, muster days and shut ways waiting in the layer list. That is "overlays in
  reach, not on the base drawing", already true of the URL.

## Why the zoom feels smooth: Leaflet 1.9.4 vs the atlas (confirmed, high)
| piece | Leaflet mechanism | atlas today | gap |
|---|---|---|---|
| tile pyramid | one integer `tileZoom=round(zoom)`, CSS-scaled | z0–5 JPG × 3 eras (860 tiles, ~9 MB each) | no authored level past z5 |
| generalized geometry | none built in | one `crSpline` per feature | per-band geometry sets |
| min/maxZoom | tile layers only; vectors/markers have none | CSS pane tiers A/B/C on `zoomend`, tier D live | per-layer, per-rank gates |
| fractional zoom | `zoomSnap:0` is legal; no style interpolation | on; only the base/overlay opacity ramps ease | write `--z` on `zoom`, `calc()` ink |
| crossfade | fixed 200 ms per tile; parents retained z−5 | hand-built base→city ramp | sheet→sheet ramps between layers |
| overzoom | `maxNativeZoom` in GridLayer | z5 stretched to 11.5, faded to 0.12 | an honest softness band |
| appear effect | tile fade only | tier fade 0.2 s | names arrive after their ink |

Brief corrections. Each brief claim below is checked against the Leaflet 1.9.4 source.

| Brief claim | Verdict |
|---|---|
| Interpolated line width, text size and opacity | **Not in Leaflet.** It must be hand-driven from the `zoom` event |
| Swiss sheets "crossfade" | Leaflet fades per tile within one layer, **never between two sheets**. The atlas does that by hand |
| Bay Atlas = MapLibre + PMTiles + Mapzen terrain + OSM | **Unverified.** No repo was found, and the only echo was a search summary refuted as task-prompt echo |
| swisstopo vector service | **Unverified.** Owner's brief only |

## The Swiss stack in fiction (candidates; the density bible decides)
| Swiss layer | at the table | already in the atlas/sim |
|---|---|---|
| Zeitreihen 1864 | the old survey: Imperial / War era sheets under the live one | era pyramids + `setEra` (a swap today, no hash) |
| building register | steadings and folds; a homestead is a named dot | none in open country; seeded city plans |
| transit stops | caravan halts / waystations (**not** "coach posts") | shipped POI "The Beacon Post"; party stops; sea lanes |
| marked paths | cairned ways, drove-tracks: never dotted (dotted = major roads) | sim `W.roads` inside the window; 2 named ways |
| Schiessanzeigen | muster days: levy muster-days, Tamar's dark hour, dragon flights (**no** "artillery") | "The Muster Ground" POI; sim `W.dragon`, bandit camps |
| closures | shut ways: flooded fords, plague-watched gates, bandit-held roads | sim famine/plague flags, ambushes; no road status |
| colour base | PatrinorModern.png, relief from the sim DEM | see below |

Voice debt: the shipped POIs "The Tithe-Yard" / "The Tithe-Barn" are a rename item (church vocabulary), not a blocker: they become "The Tribute-Yard" / "The Tribute-Barn" (R10).

## The relief window (confirmed this pass, decoded)
- `EPESHU_HF` (`index.html`, `const EPESHU_HF_URI`) is a 768² RGB PNG with h = (R·256+G)/32 − 300 m. It was traced
  from atlas window [1060,1240]..[1860,2040], and atlas = (1060,1240) + grid·800/768.
- **Check:** Aldorūs grid 373/276 → (1448.5, 1527.5) vs anchor (1448.6, 1527.5), h 139 m.
- **Range:** −46…328 m. The **summit is 328.19 m at (1648.5, 1603.5)**, inland of Tamaron in the Aura-Hōth heights.
- **Use the raw decode.** `genHydrology` carves the sim's `W.H`.
- **Resolution** is about 1.04 atlas px per cell. That is fine for contours at z5–6 and soft past them.
- Outside the window there is **no DEM**. Relief there must not be invented.
- **One ground:**
  - the Pēshunor north coast (Epēshu → Sokundo → Kanae → Rhup → Tamaron);
  - Aldorūs, the only ringed river town upstream of Sokundo;
  - Epēshu, the painted chart with 19 POIs, where the party is.

  All three sit inside the window, so a country → valley → city stack can derive its heights instead of inventing them.

## Atlas facts that shape the build (anchor-checked; re-anchor by pattern)
- **No label collision** logic exists: labels are DOM spans with a halo, at fixed 13/14 px.
- **Live ramps:** only `worldOpacityUpdate` and the base/overlay ramps ease with zoom.
- **The `#view=x,y,z` hash** is written on moveend only when the hash already starts `#view=`, and it **drops any
  trailing params**. New layer, era or toggle params must be composed so they survive.
- **Not in the hash:** era, layers and night mode.
- **No data file holds** rivers, relief, heights, hazards, shut ways or stops. `traced-roads.json` (46 polylines) is
  not loaded.
- **No fog:** `W.weather` has none (clear, overcast, rain, snow, storm). Fog must be a seeded function of place and
  sim day, never wall-clock.
- **Data bugs:**
  - Drāmūz marker is 35 px off its anchor;
  - Hordon's anchor duplicates Maeges;
  - Aldorūs's trait note ("out of sight of the sea") contradicts its anchor (sea 77 px NE).

## Readers vs navigators (brief v2, mapped)
- **Paint on the base, names on a threshold.**
  - Painters want watercolour, fog washes, bone paper, and contrast pooled at edges. That pass is cheap on the
    existing land/water mask (`washMake`, `sampleCityMask`).
  - Rankers want the far zoom almost empty and the valley zoom indecent.
- **The appear effect.** Data steps on a threshold; ink eases over a few tenths of a zoom level.
- **One-question views.** These extend the shipped Contents plates (`THEMES`) rather than adding a mode.
- **Real colours.** Washes sample the print hue; the named palette is for line work.
- **"Cramped".** Fix it with a minimum label spacing at phone width, not with fewer names.

## Refuted / corrected
- "Bay Atlas has an AtlasSwiss style with Mapzen terrain and relief/contour/boundary layers": a search-summary echo,
  refuted.
- "The link shows the 1864 survey … on the colour map": the overlays are hidden (`,f`).
- The follow-up hash `#9/37.75/-122.25` is the central Bay, not the Sonoma coast of plate one. The two differ, but
  they do not contradict.
- Code corrections:
  - `city-anchors.json` holds 136 cities, not ~35;
  - `DEPLOY.md` still says tiles z0–4 (the disk has z0–5);
  - the z5 level is 630 tiles (35 columns), not 32×32.

## Open questions (nothing survived)
- **Brief conflicts** (peaks always vs the region sheet; shed-scale ink vs ranks; palette vs real colour; texture vs
  street names; "nothing smaller" vs the lettered print; fade vs no fade): owner rulings R1–R6, `../filigree/README.md` §9.
- **Era tiles.** Do the era tiles differ from Modern in roads and forest, or only in names and borders? This decides
  between a raster old survey and an old-name layer.
- **Ground outside the window:** a painted pseudo-heightmap, a glyph distance field, or authored hachures.
- **Invented names.** How many can canon carry, and is the `prov:'invented'` watermark enough?
- **Per-frame cost** of hundreds of SVG labels and contour strokes on the `zoom` event (unmeasured).
- **Stamen Watercolor's** mask/blur/edge-darken method, and the real Bay Atlas stack (both unverified).
