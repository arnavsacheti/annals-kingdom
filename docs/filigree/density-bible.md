# Density bible: Filigree for the Table

Date: 2026-10-04. Job 1 (Research) output. The machine copy is `density-bible.json`; rule ids (`B-NN`), class ids and ground-class ids are stable across rounds. Ground: the Leponnia DEM window [1060,1240]..[1860,2040] (atlas px), sheet one = the region sheet over the Pēshunor north coast, bbox 1216,1376..1760,1664 (R8).

## The blank-hex answer

Point at any hex (one z7 tile, 32 atlas px; cell `cx,cy` covers [32cx,32cx+32) x [32cy,32cy+32), B-01) and read it at the valley sheet:

1. Run the ten ground tests in order (B-02); the first that holds is the ground class. Tests use only `tools/filigree-dem.js` (`--at` on the hex centre, `--bbox` on the hex) and `maps-site/data/city-anchors.json` / `detail-charts.json` (anchor inside the half-open bbox, no margin).
2. If the class is `no_dem` (B-03, the no-DEM rule) or `open_sea` (B-04), the hex is exempt: nothing is required on it.
3. Otherwise the class names six classes. Each must stand on the hex as an instance whose source sits where it does (B-05): `dem:x,y` at the instance's own cell, `data:<file>#<name>` with its own point in the hex, `print:<hex>@px,py` on the ink, `mint:<class>:<hex>` (keyed by R9), or `sim:<literal>` for a baked sim hook.
   - Citation (B-58): each item's `rule` field is exactly one bare id, `B-NN`, the governing rule of the item's class from the table below (`classes[].rule` in the json), whatever the instance's rank or source. Never cite B-05, the six, the ground test, a forbidding rule (B-22, B-47, B-48, B-52 to B-54) or a shaping rule (B-07 under a height, B-09, B-10); never prose, a second id, a slash or comma list, or "six of <class>".
   - A minted instance whose name cannot yet be computed (tools/mint-names.js not yet built) is recorded with `mint:<class>:<hex>` and name `""` at the position its instance rule gives; that satisfies B-05 (B-09).
   - Exactly six items. A traced river, the dotted road, a principal peak, a fork, a halt, a structure, a reserve or a notice that also falls on the hex is drawn by its own rule in addition to the six, never as a seventh item and never in place of a member (B-59).
4. Only then may the hex be "empty" of anything else.

| test | ground class | six things that must appear | exemption |
|---|---|---|---|
| 1 | `no_dem` | (none) | B-03 |
| 2 | `open_sea` | (none) | B-04 |
| 3 | `painted_city` | `city_tone`, `fog_wash`, `contour_hair`, `spot_height`, `landform_name`, `town_name` |  |
| 4 | `river_town` | `town_shield`, `town_name`, `river_line`, `contour_hair`, `spot_height`, `landform_name` |  |
| 5 | `ruin` | `old_survey`, `town_name`, `contour_hair`, `spot_height`, `landform_name`, `cover_wash` |  |
| 6 | `islets` | `coast_edge`, `contour_hair`, `spot_height`, `landform_name`, `homestead`, `cover_wash` |  |
| 7 | `coast` | `coast_edge`, `contour_hair`, `spot_height`, `landform_name`, `homestead`, `blazed_path` |  |
| 8 | `hill` | `contour_hair`, `spot_height`, `landform_name`, `relief_shade`, `homestead`, `blazed_path` |  |
| 9 | `settlement` | `town_name`, `contour_hair`, `spot_height`, `landform_name`, `cover_wash`, `blazed_path` |  |
| 10 | `open_ground` | `contour_hair`, `spot_height`, `landform_name`, `cover_wash`, `homestead`, `blazed_path` |  |

Class to governing rule (the one id an item cites, B-58):

| class | rule |
|---|---|
| `principal_peak` | B-06 |
| `spot_height` | B-08 |
| `landform_name` | B-07 |
| `contour_hair` | B-11 |
| `relief_shade` | B-12 |
| `coast_edge` | B-15 |
| `river_line` | B-13 |
| `river_fork` | B-14 |
| `road_rust` | B-16 |
| `blazed_path` | B-17 |
| `caravan_halt` | B-18 |
| `town_name` | B-19 |
| `town_shield` | B-20 |
| `homestead` | B-21 |
| `structure` | B-23 |
| `cover_wash` | B-25 |
| `reserve_wash` | B-24 |
| `old_survey` | B-40 |
| `muster_day` | B-41 |
| `shut_way` | B-42 |
| `city_tone` | B-57 |
| `built_grain` | B-33 |
| `park_void` | B-35 |
| `arterial` | B-36 |
| `fog_wash` | B-37 |
| `block_label` | B-34 |
| `rest_pin` | B-39 |

The six are, class for class, what plates two and three delete (B-52, B-53): heights, landform names, contour hair, paths, homesteads, washes. A shielded town is not in any open-ground six, because it cannot stand on every hex; it is the river town's own class.

## Per sheet

### Country

- Band: Reveal tiers A and B (B-46). Question: where is the coast, the river, the one town? (B-30)
- What it carries: Paint: the print, the relief shade, the pooled shore. Ink: principal peaks with their canon range names, the river, the continuous rust coast road, one shield at Aldorūs. The print's own ring lettering is accepted (R5); the overlay adds nothing smaller than the one town.
- Must: B-06 principal peaks; B-12 relief shading; B-13 print-led rivers; B-15 pooled edges; B-16 the continuous rust coast road; B-20 one shield; B-31 paint on the base; B-46 sheets as zoom bands
- Forbidden: B-47 country: nothing smaller than the one town; B-22 homesteads wait for the valley sheet; B-10 no pin for a landform
- Classes forbidden here: `spot_height`, `landform_name`, `contour_hair`, `river_fork`, `blazed_path`, `caravan_halt`, `town_name`, `homestead`, `structure`, `cover_wash`, `reserve_wash`, `city_tone`, `built_grain`, `park_void`, `arterial`, `fog_wash`, `block_label`, `rest_pin`
- Classes present: `principal_peak`, `relief_shade`, `coast_edge`, `river_line`, `road_rust`, `town_shield`, `old_survey`, `muster_day`, `shut_way`
- Band hint: none (no coast-band calibration)

### Region

- Band: Tier C up to z6; sheet one (B-46, B-55). Question: which valley do we commit to?
- What it carries: Ridge names and heights arrive (DEM ridges of prominence >= 15 m plus one promoted top per 2x2-hex block without a ridge, B-07); reserves as a named print-hue wash (B-24); the rust road stays continuous; settlement names from the anchors, ranked, with the phone-width spacing rule (B-19, B-29). Homesteads, contour hair, paths, structures, cover and built grain wait.
- Must: B-07 ridge names and heights, knolls; B-08 heights as bare numerals; B-12 relief shading; B-13 print-led rivers; B-15 pooled edges; B-16 the continuous rust coast road; B-18 caravan halts / waystations; B-19 settlement names from the anchors; B-20 one shield; B-24 reserves as a named wash; B-27 names on a threshold; B-29 cramped; B-55 the ground (R8)
- Forbidden: B-22 homesteads wait for the valley sheet; B-48 region: what waits; B-10 no pin for a landform; B-52 plate two deletions refused; B-53 plate three deletions refused
- Classes forbidden here: `contour_hair`, `river_fork`, `blazed_path`, `homestead`, `structure`, `cover_wash`, `city_tone`, `built_grain`, `park_void`, `arterial`, `fog_wash`, `block_label`, `rest_pin`
- Classes present: `principal_peak`, `spot_height`, `landform_name`, `relief_shade`, `coast_edge`, `river_line`, `road_rust`, `caravan_halt`, `town_name`, `town_shield`, `reserve_wash`, `old_survey`, `muster_day`, `shut_way`
- Band hint: coast band W calibrated this sheet's targets

### Valley

- Band: z6 to z8 in open country. Question: what is around us? (the valley sheet at the party's place)
- What it carries: Every land hex carries its six (B-05): knoll names and heights on every hex top, contour hair with form lines on flat ground, homestead dots with names, blazed paths, cover washes, river forks where the print draws them, every structure. The painted city reads as tone and fog until the city sheet.
- Must: B-05 the blank-hex rule; B-07 ridge names and heights, knolls; B-11 contour hair; B-13 print-led rivers; B-14 river forks; B-15 pooled edges; B-16 the continuous rust coast road; B-17 blazed paths; B-20 one shield; B-21 homestead dots; B-23 every structure; B-25 cover wash; B-30 one question per sheet; B-37 fog as weather; B-57 city tone
- Forbidden: B-54 valley: what is refused; B-10 no pin for a landform; B-52 plate two deletions refused; B-53 plate three deletions refused
- Classes forbidden here: `block_label`, `rest_pin`
- Classes present: `principal_peak`, `spot_height`, `landform_name`, `contour_hair`, `relief_shade`, `coast_edge`, `river_line`, `river_fork`, `road_rust`, `blazed_path`, `caravan_halt`, `town_name`, `town_shield`, `homestead`, `structure`, `cover_wash`, `reserve_wash`, `old_survey`, `muster_day`, `shut_way`, `city_tone`, `fog_wash`
- Band hint: coast band M calibrated this sheet's targets

### City

- Band: z >= 7.5 inside a painted city's footprint. Question: where are the park, the arterial and the fog?
- What it carries: Texture before type: rose-brown built grain, park voids with pooled edges, ocher arterials, seeded fog as weather, contour hills from the DEM. No label on every block, no chrome, no pin at rest; landform POIs become landform labels (B-10).
- Must: B-33 built grain, texture before type; B-35 park voids; B-36 ocher arterials; B-37 fog as weather; B-38 contour hills; B-26 real colours; B-31 paint on the base; B-57 city tone
- Forbidden: B-34 no label on every block; B-39 no chrome, no pin at rest; B-22 homesteads wait for the valley sheet; B-10 no pin for a landform
- Classes forbidden here: `homestead`, `structure`, `block_label`, `rest_pin`
- Classes present: `principal_peak`, `spot_height`, `landform_name`, `contour_hair`, `relief_shade`, `coast_edge`, `river_line`, `river_fork`, `road_rust`, `town_name`, `old_survey`, `muster_day`, `shut_way`, `city_tone`, `built_grain`, `park_void`, `arterial`, `fog_wash`
- Band hint: none (no coast-band calibration)

## Per class

Rank is the arrival order (B-27): 1-2 country, 3-4 region, 5-6 valley, 7 city, 9 never. Rule is the class's one governing rule, the only id a blank-hex item for it cites (B-58). Sources: dem = the probe on the raw decode; data = a file under `maps-site/data/`; print = ink on the PatrinorModern.png crop; mint = R9 deterministic name or seeded field; sim = a baked fixed-seed hook in `index.html`.

| class | label | fiction name | rank | rule | sheets | forbidden on | sources |
|---|---|---|---|---|---|---|---|
| `principal_peak` | Principal peak (triangle and canon range name) | the high peaks of the named ranges: Aura-Hōth, Rhoshkhon, Sūs Gimīlīn | 1 | B-06 | country, region, valley, city | (none) | dem, data |
| `spot_height` | Height (bare numeral) | the height above the sea | 3 | B-08 | region, valley, city | country | dem |
| `landform_name` | Ridge or knoll name | ridge and knoll names | 3 | B-07 | region, valley, city | country | dem, data, mint |
| `contour_hair` | Contour hair | contour hair, the fingerprint of the land | 5 | B-11 | valley, city | country, region | dem |
| `relief_shade` | Relief shading | the shading, lit from the upper left | 1 | B-12 | country, region, valley, city | (none) | dem |
| `coast_edge` | Pooled shore | the pooled shore | 1 | B-15 | country, region, valley, city | (none) | print, dem |
| `river_line` | River line | the river | 2 | B-13 | country, region, valley, city | (none) | print, data |
| `river_fork` | River fork | the river fork | 5 | B-14 | valley, city | country, region | print, data |
| `road_rust` | Coast road (rust) | the coast road and the great ways (the Road that Walks with the Sun) | 2 | B-16 | country, region, valley, city | (none) | print, data |
| `blazed_path` | Blazed path | blazed paths: cairned ways, drove-tracks, shrine-paths | 5 | B-17 | valley | country, region | sim, mint |
| `caravan_halt` | Caravan halt / waystation | caravan halts and waystations: fords, ferry stairs, cog landings, beacon posts | 4 | B-18 | region, valley | country | data, sim, mint |
| `town_name` | Settlement name | town and village names | 3 | B-19 | region, valley, city | country | data |
| `town_shield` | River-town shield | the shield of the river town, its waystation's sign | 1 | B-20 | country, region, valley | (none) | data |
| `homestead` | Homestead dot and name | steadings: a dot and a name (steading, fold, fisher's hut) | 6 | B-21 | valley | country, region, city | mint |
| `structure` | Every structure | every structure: folds, wells, wayside Kembar shrines, granaries, ruined towers | 6 | B-23 | valley | country, region, city | mint, sim |
| `cover_wash` | Cover wash | the cover: wood, tilth, meadow, marsh, sand, rock | 5 | B-25 | valley | country, region | sim |
| `reserve_wash` | Reserve wash and name | reserves: a Kembar's grove, the crown's chase, the commons | 4 | B-24 | region, valley | country | sim, mint |
| `old_survey` | Old survey | the old survey: names before the sack of Lepon (745 A.B.), dead roads, wood that grew back | 2 | B-40 | country, region, valley, city | (none) | data, print, mint |
| `muster_day` | Muster day notice | muster days | 2 | B-41 | country, region, valley, city | (none) | sim, data |
| `shut_way` | Shut way notice | shut ways | 2 | B-42 | country, region, valley, city | (none) | sim, data |
| `city_tone` | City tone wash | the city tone | 6 | B-57 | valley, city | country, region | data |
| `built_grain` | Built grain | built grain, rose-brown | 7 | B-33 | city | country, region | data |
| `park_void` | Park void | gardens and groves (green voids) | 7 | B-35 | city | country, region | data |
| `arterial` | Arterial (ocher) | the great streets, in ocher | 7 | B-36 | city | country, region | data |
| `fog_wash` | Fog wash | sea-fog | 6 | B-37 | valley, city | country, region | mint |
| `block_label` | Block label | a name on every block (refused) | 9 | B-34 | (never) | country, region, valley, city | data |
| `rest_pin` | Pin at rest | a pin standing in for a name (refused) | 9 | B-39 | (never) | country, region, valley, city | data |

Where each class stands (instance rule) and what it reuses:

- `principal_peak` (in no six: required only where its rule places it; cite B-06): At a DEM summit of window prominence >= 100 m (node tools/filigree-dem.js --bbox 1060,1240,1860,2040 --min-prom 100) standing in a canon range; instance x,y = that summit cell, ref dem:x,y; name = the canon range name (B-06). Required only on the hex holding such a summit. Reuse: maps-site/index.html :: Mountains and Hills (the pMtn triangle slot) | NEW:window peak list from tools/filigree-dem.js.
- `spot_height` (in the six of painted_city, river_town, ruin, islets, coast, hill, settlement, open_ground; cite B-08): Instance at the hex's highest cell: the first peaks entry of node tools/filigree-dem.js --bbox <hex bbox> --min-prom 1 (its h = hmax); ref dem:<that x,y>; label = round(h) as a bare numeral (B-08). Placement follows B-07: region sheet, only window-run ridges and promoted tops; valley sheet, every land hex. Governing rule B-08 (B-58), whatever the rank. Reuse: tools/filigree-dem.js --bbox | NEW:relief bake heights data file.
- `landform_name` (in the six of painted_city, river_town, ruin, islets, coast, hill, settlement, open_ground; cite B-07): Names the hex's highest cell (the first peaks entry of --bbox <hex bbox> --min-prom 1; same x,y as its spot_height). Rank 3 when that cell is a peak of the one window ridge run (node tools/filigree-dem.js --bbox 1060,1240,1860,2040 --min-prom 15) or the promoted top of its aligned 2x2-hex block, else rank 5 (a knoll, valley); the hex-local --min-prom 1 prominence never sets rank, and rank never changes the instance, its source or its citation (B-07). Name and source (B-09): canon only when a canon point lies inside the hex's half-open bbox: a maps_markers.json "Mountains and Hills" marker (ref data:maps_markers.json#<name>, instance at the marker), a chart landform POI counted at its city's anchor (ref data:chart-pois.json#<name>), or the principal summit cell of B-06 (ref dem:<summit x,y>, name = its canon range name). Printed range or region lettering crossing the hex is print ink, not a canon point, and never names the hex top; a hex top under a principal range's lettering is a knoll or ridge, never a principal_peak (principal_peak is in no six and never stands in for this class). Otherwise minted, mint key: xmur3("landform_name|" + cellId) -> mulberry32 (R9; cellId = "cx,cy"; ref mint:landform_name:<hex>), instance at the highest cell, terrain head as NAME.peak, prov invented, listed in names-for-owner.md; until tools/mint-names.js emits its data the name is "" (B-09). Governing rule B-07 (B-58). Reuse: index.html :: const NAME =  ; tools/build-gazetteer.js :: const ETYM | NEW:tools/mint-names.js.
- `contour_hair` (in the six of painted_city, river_town, ruin, islets, coast, hill, settlement, open_ground; cite B-11): Sample point = the hex centre when --at <centre> gives h >= 0, else the hex's highest cell; ref dem:<x,y>. The hair: every 5 m level crossing the hex, smoothed; 2.5 m form lines where hex relief < 40 m, hex relief = hmax - max(hmin, 0) from --bbox <hex bbox> (land only: every sea cell counts as 0 m, so seabed depth never adds relief); 25 m index only where 5 m spacing < 3 screen px (B-11). Reuse: index.html :: const EPESHU_HF_URI | NEW:relief bake (5 m contours).
- `relief_shade` (in the six of hill; cite B-12): Sample point = the hex's highest cell; ref dem:<x,y>. Imhof hillshade baked offline from the raw decode, upper-left light. Drawn on all window land; it counts toward a six only on hill ground (hex relief >= 40 m, measured as in B-11), where it reads. Reuse: index.html :: const EPESHU_HF_URI | NEW:relief bake (hillshade).
- `coast_edge` (in the six of islets, coast; cite B-15): Instance on the shoreline inside the hex: a crop pixel on the print's coast stroke (print:<hex>@px,py) or a land cell beside the sea (dem:x,y, h >= 0 within one cell of h < 0). Required on every hex with 0 < land_frac < 1 (B-15, the pooled_edge checklist key). Reuse: maps-site/index.html :: function sampleCityMask ; function washMake | NEW:pooled-edge pass.
- `river_line` (in the six of river_town; cite B-13): Instance on the print's solid black river ink inside the hex (print:<hex>@px,py), or a rivers.json vertex in the hex once traced (data:rivers.json#<reach>). Counts toward a six only on the river town's hex, where the instance may lie within the 16 px margin (the river the town stands on). On every other hex a traced river crosses (a vertex or river-ink pixel inside the half-open bbox) it is drawn by B-13 in addition to the six, never a seventh item (B-59). Never from the DEM or the sim alone. Reuse: NEW:rivers.json traced from print river-ink (B-13).
- `river_fork` (in no six: required only where its rule places it; cite B-14): Instance at a printed junction or split of traced rivers inside the hex (print ref on the junction ink, or the rivers.json junction vertex). Required only where the print draws one. Reuse: NEW:rivers.json junction vertices.
- `road_rust` (in no six: required only where its rule places it; cite B-16): Instance on a printed dotted-road dot inside the hex (print:<hex>@px,py); once the road network is re-traced, a vertex of that polyline (data). Drawn on every hex the printed dotted road crosses (a road dot or traced vertex inside the half-open bbox), in addition to that hex's six: road_rust is in no six, never a seventh item and never cited in place of a member (B-59). Reuse: maps-site/index.html :: function getJSON | NEW:re-traced road network (POLISH Traced road network).
- `blazed_path` (in the six of coast, hill, settlement, open_ground; cite B-17): Instance where the path crosses the hex: a sim road through the transform where one runs (ref sim:W.roads.push), else minted, mint key: xmur3("blazed_path|" + cellId) -> mulberry32 (R9; cellId = "cx,cy"; ref mint:blazed_path:<hex>) choosing entry and exit edges, waypoints on land off print ink, and the path's name; until tools/mint-names.js emits its data the instance stands at the hex's sample point (the hex centre when node tools/filigree-dem.js --at <centre> gives h >= 0, else the hex's highest cell, the first peaks entry of --bbox <hex bbox> --min-prom 1) with name "" (B-09). Never dotted. Reuse: index.html :: W.roads.push | NEW:path mint in tools/mint-names.js.
- `caravan_halt` (in no six: required only where its rule places it; cite B-18): At a route end or crossing whose own coordinates lie in the hex: a sea-lanes.json end vertex, a party-route stop, a sim caravan route end, or a ford where a traced river meets a way (data ref). Name canon, else mint key: xmur3("caravan_halt|" + cellId) -> mulberry32 (R9; cellId = "cx,cy"; ref mint:caravan_halt:<hex>). Never placed per hex. Reuse: maps-site/index.html :: The Beacon Post ; JSTOPS.
- `town_name` (in the six of painted_city, river_town, ruin, settlement; cite B-19): At a city-anchors.json anchor inside the hex (data:city-anchors.json#<name>, or its maps_markers.json / gazetteer.json entry); ranked in the rank pass; the print's own lettering stays. Reuse: maps-site/index.html :: function buildMarkers | NEW:rank pass.
- `town_shield` (in the six of river_town; cite B-20): Only at the R8 river town's anchor (data:city-anchors.json#Aldorūs); exactly one on every filigree sheet from the country sheet down; no other anchor carries one. Reuse: NEW:one shield mark (R19).
- `homestead` (in the six of islets, coast, hill, open_ground; cite B-21): One dot and name per hex where the ground class names it, on a land cell (h >= 0) off print ink and at least 4 atlas px from any ring glyph; position and name from mint key: xmur3("homestead|" + cellId) -> mulberry32 (R9; cellId = "cx,cy"; ref mint:homestead:<hex>) (steading pool: stem + -ban / -ila, compounds when it runs short); prov invented; never a ring or town glyph. Until tools/mint-names.js emits its data the instance stands at the hex's sample point (the hex centre when node tools/filigree-dem.js --at <centre> gives h >= 0, else the hex's highest cell, the first peaks entry of --bbox <hex bbox> --min-prom 1) with name "" (B-09). Reuse: maps-site/index.html :: function xmur3 ; function mulberry32 | NEW:tools/mint-names.js + data file.
- `structure` (in no six: required only where its rule places it; cite B-23): Small marks on land: the sim's cairns and bridges through the transform (ref sim:W.cairns = []), else mint key: xmur3("structure|" + cellId) -> mulberry32 (R9; cellId = "cx,cy"; ref mint:structure:<hex>) picking kind and land cell. Not required per hex; counted per valley view. Reuse: index.html :: W.cairns = [] | NEW:structure mint.
- `cover_wash` (in the six of ruin, islets, settlement, open_ground; cite B-25): Instance on a land cell of the hex; the cover is read from the sim's seeded biome grid through the transform (ref sim:function genBiomes), baked as data for seed epeshu; tint a step of the sampled print hue. Reuse: index.html :: function genBiomes ; maps-site/index.html :: function washMake | NEW:baked biome sample.
- `reserve_wash` (in no six: required only where its rule places it; cite B-24): A named wash over a contiguous forest or pine cluster of the sim's biome grid (ref sim:function genBiomes) or a canon reserve; name canon, else mint key: xmur3("reserve_wash|" + cellId) -> mulberry32 (R9; cellId = "cx,cy"; ref mint:reserve_wash:<hex>) keyed by the cell holding the cluster's centroid; green step of the print hue; no stroke, no pin. Reuse: index.html :: function genBiomes ; maps-site/index.html :: function washMake | NEW:reserve data file.
- `old_survey` (in the six of ruin; cite B-40): At a canon anchor or marker inside the hex that the old survey remembers (data:city-anchors.json#<ruin> or data:maps_markers.json#<name>): its old name, its dead roads, the wood that grew back. Old names canon, else mint key: xmur3("old_survey|" + cellId) -> mulberry32 (R9; cellId = "cx,cy"; ref mint:old_survey:<hex>) over older lexicon forms, prov invented. The era rasters give only the under-tint. On a ruin hex this item cites B-40; B-19 governs only the ruin's town_name. Reuse: maps-site/index.html :: function setEra | NEW:under-stack and old-name layer.
- `muster_day` (in no six: required only where its rule places it; cite B-41): A notice on top at a snapshot position through the transform (the Pebros camp, ref sim:pebrosCamp; bandit camps; the dragon's lair) or a shipped The Muster Ground POI; {place, start, end in A.B. days, voice}. Not required per hex. Reuse: maps-site/index.html :: The Muster Ground ; index.html :: function chron( | NEW:notices sample (fixed-seed snapshot).
- `shut_way` (in no six: required only where its rule places it; cite B-42): A notice on top naming a way, its shut stretch and the detour, from the snapshot's plague and hunger flags (ref sim:s.plagueFlag = true), ambush lines (ref sim:camp.ambushes++) or the DM's per-session file. Not required per hex. Reuse: index.html :: s.plagueFlag = true ; camp.ambushes++ | NEW:notices file.
- `city_tone` (in the six of painted_city; cite B-57): At the painted city's anchor (data:city-anchors.json#<city>, B-57): the washMake print-hue tone under the plan, on the overlay opacity ramp; on the valley sheet the painted city reads as this tone. Reuse: maps-site/index.html :: function washMake ; function overlayOpacity.
- `built_grain` (in no six: required only where its rule places it; cite B-33): Inside the painted footprint on the city sheet: the chart's built fill or the seeded plan's buildings (data:chart-pois.json#<quarter>, counted at the city's anchor); drawn grain, never labelled per house. Reuse: maps-site/index.html :: function registerCityOverlay ; function genCityCanvas.
- `park_void` (in no six: required only where its rule places it; cite B-35): A green void with no built grain inside the footprint: a canon garden, grove or burial ground (data:chart-pois.json#<garden>, counted at the city's anchor) or a new park primitive in seeded plans; pooled edge, no outline. Reuse: maps-site/index.html :: function genCityCanvas | NEW:park-void primitive.
- `arterial` (in no six: required only where its rule places it; cite B-36): The top road class through the painted city (the great road through the forum; data:chart-pois.json#Road That Walks with the Sun, counted at the anchor), ocher over the width ranking. Reuse: maps-site/index.html :: var roadHalf= | NEW:ocher arterial channel.
- `fog_wash` (in the six of painted_city; cite B-37): Seeded fog field around a painted city: mint:fog_wash:<hex>, mint key xmur3("fog_wash|" + cellId + "|" + snapshotDay) -> mulberry32 (place and snapshot sim day, never wall-clock); snapshotDay is the sim day of the one committed fixed-seed snapshot (B-43), a single constant for every hex, and presence on a painted-city hex does not depend on it (the day shapes density only), so the blank-hex record is mint:fog_wash:<hex>, name "", at the hex's sample point (the hex centre when node tools/filigree-dem.js --at <centre> gives h >= 0, else the hex's highest cell, the first peaks entry of --bbox <hex bbox> --min-prom 1); denser over water and far shores than over the built core; present at the valley band, thinning on the city sheet; over built grain only, never over a name. Reuse: maps-site/index.html :: function worldOpacityUpdate | NEW:seeded fog field.
- `block_label` (in no six: refused on every sheet; cite B-34): Never instantiated: a label on each block, house or lane at rest (B-34). Reuse: maps-site/index.html :: .poi-mk (hover-only).
- `rest_pin` (in no six: refused on every sheet; cite B-39): Never instantiated by the filigree overlay: a POI roundel, icon pin or marker drawn at rest in place of a place, reserve or landform name (B-10, B-39); shipped POI halos stay hover-only. Reuse: maps-site/index.html :: .poi-mk.

## Fiction stack

The Swiss stack pulled across into Nīmlad (B-40 to B-45). Base = the print with relief laid on; under = the old survey; over = everything the party can read off the sheet, the notices on top and swappable between sessions without a redraw.

| layer | Swiss layer | fiction | swap | data today | gap |
|---|---|---|---|---|---|
| `old_survey` | `ch.swisstopo.zeitreihen` | the old survey (the Imperial sheet, the War sheet) | under | tiles-imperial/ and tiles-war/ (860 tiles each, z0-5); setEra swaps one base, writes no hash; the eras are a land-hue recolour with identical linework | an under-stack (second tile layer, opacity or swipe), era in the hash, and an authored old-name / dead-road / regrown-wood layer |
| `every_structure` | `ch.bfs.gebaeude_wohnungs_register` | every structure: steadings, folds, wells, wayside Kembar shrines, granaries, ruined towers | over | structures exist only inside seeded settlement plans (genCityCanvas, prov invented); sim cairns and bridges inside the window | open-country steadings and structures: all minted, prov invented, listed for the owner |
| `caravan_halts` | `ch.bav.haltestellen-oev` | caravan halts / waystations | over | party-route stops (JSTOPS), 4 invented sea lanes with ends, sim caravans and W.routes; "The Beacon Post" POI in about 1 of 8 plans | no halt entity in sim or atlas; one rank table for halts and ways; only the river town earns the shield |
| `blazed_paths` | `ch.swisstopo.swisstlm3d-wanderwege` | blazed paths: cairned ways, drove-tracks, shrine-paths | over | named-ways.json (2, traces off the print), traced-roads.json (46 unloaded chains, mostly lettering and islets), sim W.roads inside the window | minor ways are not on the print (dotted = major roads only): sim roads through the transform plus minted paths, never dotted |
| `muster_days` | `ch.vbs.schiessanzeigen` | muster days | over | sim chron, W.banditCamps (max 3, transient), W.dragon (lair at the window summit), the Pebros camp constant; "The Muster Ground" POI in about 1 of 5 town plans | no notice schema (place, start, end, voice); a fixed-seed snapshot and a per-session file loaded outside the release |
| `shut_ways` | `ch.astra.wanderland-sperrungen_umleitungen` | shut ways | over | sim plague and hunger flags per settlement, ambush chronicle lines, the Pebros camp | roads carry no status and there is no detour model; a notice names the way, the stretch and the detour |
| `colour_base` | `ch.swisstopo.pixelkarte-farbe` | the print, with its relief laid on | base | PatrinorModern.png pyramid z0-5 (three eras); EPESHU_HF inside the window; the print draws no relief | an offline relief bake (Imhof hillshade, 5 m contours, heights) inside the window only |

Paint and stack order (B-44): relief, contours, water, rust road, reserves, homestead dots, names and heights, city grain, fog; the old survey as a second tile layer under the live base; notices above everything; structure marks under halts and over ways. Notices load outside the release (B-43) and come from a fixed-seed, fixed-day snapshot or the DM's per-session file, with a place, a start and an end in A.B. days and an in-fiction voice (the levy-master's board, the innkeeper's slip, an old local).

## Plates

Plate one (B-51) is the benchmark. Counted on its 1199 x 830 frame (classes mapped to this bible):

| class | plate one |
|---|---|
| `landform_name` | 27 |
| `spot_height` | 25 |
| `homestead` | 10 |
| `town_name` | 9 |
| `reserve_wash` | 3 |
| `town_shield` | 1 |
| `road_rust` | 1 |
| `river_line` | 3 |
| `river_fork` | 3 |
| `blazed_path` | 3 |
| `coast_edge` | 1 |
| `relief_shade` | 1 |
| `contour_hair` | 1 |

Notes: 27 triangle landforms (25 with heights 797 to 2,205; two names repeat), 19 place labels (10 homesteads, 9 in the river knot), 3 labelled reserve washes, one continuous rust road from the coast up the valley, a gold secondary road, one legible shield, three trail line types, three or more forks, one braided reach, continuous hillshade and contour texture, no river named. The brief's own list (7 peaks, 5 homesteads, 3 reserves, 4 knot names) undercounts the plate by about 2.5x.

Plate two (B-52) keeps `relief_shade`, `river_line`, `town_name`, `rest_pin` and deletes `spot_height`, `landform_name`, `contour_hair`, `blazed_path`, `road_rust`, `town_shield`, `reserve_wash`, `homestead`. Its three surviving peak names are icon pins with no triangle or height, the grey case the table map must not copy; it adds three water names plate one lacks.

Plate three (B-53) keeps `town_name`, `town_shield`, `rest_pin`, `reserve_wash`, `city_tone`, `river_line` and deletes `spot_height`, `landform_name`, `contour_hair`, `relief_shade`, `blazed_path`, `road_rust`, `homestead`. A venue pin carries the last trace of a landform name (Black Mountain), which fixes the rule that a pin never stands in for a landform (B-10). Shields (3) and parks are demoted, not deleted; four of plate one's ten homestead names survive as plain place labels, so "most homesteads" are gone.

Deleted by both, and therefore the core of every six: heights, landform names, contour hair, paths, the rust road's colour, most homesteads.

## City grain

Azlen's quarter, read on Epēshu Q1 (chart px [256,2304) x [1280,3328), about 0.63 of a hex; B-55). The brief gives words, not numbers, so every threshold is a Job 2 setting measured against these baselines.

| item | rule | data today | gap |
|---|---|---|---|
| block | B-33 | Epēshu chart Q1: about 13,700 built fills, 17.6% of land, aperiodic grain (3-4 chart px); seeded plans about 6x sparser per image px; Epēshu is drawn from the canon chart, never the generator | rose-brown hue (the chart fill is tan-ochre); the grain threshold is a Job 2 setting; no labels per block (B-34) |
| park_void | B-35 | three small deliberate green spots in Q1 (the Māmban, the Necropolis grove, the temple lawn); seeded plans have no park primitive | a park-void primitive; pooled edge instead of the Māmban's outline; a printed badge sits on the garden core |
| arterial | B-36 | chart arterial is a slate bar with width ranking only; seeded plans have four width tiers, all cream | ocher as a new colour channel on the top class |
| fog_wash | B-37 | none: W.weather has no fog; the washMake tone is a mat, not weather | a seeded fog field (place + snapshot day), ring denser than core, thinning with zoom, never over names |
| contour_hill | B-38 | the chart draws no relief; the DEM over Q1 spans -20 to 85 m as one rise from the west shore to the south-east | a smoothing rule (one DEM cell is about 84 screen px at the deepest chart zoom) and a clip to the chart coast (the DEM shore runs up to 10 atlas px off in the south) |

The grid becomes a textile between about z8.3 and z9.3 on the shipped chart (80.77 chart px per atlas px; cityMaxZ 10.34), so grain, arterial and void tests are read at fixed zooms (8, 9, 10, 10.34), never once. Fog lies over built grain only and never over a name.

## Ground classes and their six

Ordered decision list (B-02); the first test that holds wins. Exemptions exist only for ground with no land and ground outside the DEM window; coast, islets, the river town, the ruin and the painted city all carry six. Each six is exactly six items, each citing only its class's governing rule (B-58; B-05 and the six are implied, never cited). A traced river, the dotted road or any other line or mark placed by its own rule is drawn on the hex in addition to the six, never as a seventh item (B-59). Hex relief, wherever a class reads it, is hmax - max(hmin, 0) (B-11).

### 1. `no_dem`

- Criteria: Test 1 of 10 (first match wins). node tools/filigree-dem.js --at <hex centre> prints {"h":null}: the centre (32cx+16, 32cy+16) lies outside the DEM window [1060,1860) x [1240,2040).
- Exempt: B-03. No-DEM rule (R22): a hex whose centre lies outside the DEM window [1060,1240]..[1860,2040] (the probe's --at on the centre prints h null) is exempt from the six. The sheets cover the window only: no relief, contour, height, river, cover, ridge or knoll is derived or invented there; the print and canon markers still show, nothing else is required.

### 2. `open_sea`

- Criteria: Test 2. Otherwise, node tools/filigree-dem.js --bbox <hex bbox> gives land_frac 0 (every DEM cell centred in the hex is below 0 m).
- Exempt: B-04. Open-sea exemption: a hex inside the window with no land (--bbox land_frac 0, every DEM cell below 0 m) is exempt from the six. The sea stays a flat print-hue wash, unlabelled, as plate one leaves its ocean; sea lanes and notices may cross it, nothing is required on it.

### 3. `painted_city`

- Criteria: Test 3. Otherwise, the hex's half-open bbox [x0,x1) x [y0,y1) (no margin) holds the atlasX,atlasY of a maps-site/data/city-anchors.json entry whose name has a maps-site/data/detail-charts.json entry with label "CITY CHART".
- Six: `city_tone`, `fog_wash`, `contour_hair`, `spot_height`, `landform_name`, `town_name`

### 4. `river_town`

- Criteria: Test 4. Otherwise, the half-open bbox holds the city-anchors.json anchor of the R8 river town, Aldorūs (the one shield, R19).
- Six: `town_shield`, `town_name`, `river_line`, `contour_hair`, `spot_height`, `landform_name`

### 5. `ruin`

- Criteria: Test 5. Otherwise, the half-open bbox holds a city-anchors.json anchor whose kind is "ruin".
- Six: `old_survey`, `town_name`, `contour_hair`, `spot_height`, `landform_name`, `cover_wash`

### 6. `islets`

- Criteria: Test 6. Otherwise, from --bbox <hex bbox>: 0 < land_frac < 0.5 and hmax < 30 m (low land broken by sea).
- Six: `coast_edge`, `contour_hair`, `spot_height`, `landform_name`, `homestead`, `cover_wash`

### 7. `coast`

- Criteria: Test 7. Otherwise, 0 < land_frac < 1 (mainland shore).
- Six: `coast_edge`, `contour_hair`, `spot_height`, `landform_name`, `homestead`, `blazed_path`

### 8. `hill`

- Criteria: Test 8. Otherwise (land_frac 1), hmax - hmin >= 40 m from --bbox <hex bbox>.
- Six: `contour_hair`, `spot_height`, `landform_name`, `relief_shade`, `homestead`, `blazed_path`

### 9. `settlement`

- Criteria: Test 9. Otherwise, the half-open bbox holds any other city-anchors.json anchor (a village or town on gentle land).
- Six: `town_name`, `contour_hair`, `spot_height`, `landform_name`, `cover_wash`, `blazed_path`

### 10. `open_ground`

- Criteria: Test 10. Every remaining hex: all land, relief under 40 m, no anchor (plateau, farmland, blank paper inside printed lettering).
- Six: `contour_hair`, `spot_height`, `landform_name`, `cover_wash`, `homestead`, `blazed_path`

Why these six:

- `painted_city`: At the valley band the painted city is tone, fog on the water, the hills' hair and height, a knoll name and the city's own name; built grain, park voids and arterials resolve only on the city sheet.
- `river_town`: The one shield and the river are what make it the river town; its knoll and height keep it navigable when the town is covered by a hand (Aldorūs means "the height").
- `ruin`: The old survey remembers the ruin's old name and the wood that grew back; its name, knoll and height keep it on the live sheet.
- `islets`: Low land broken by sea: the pooled shore, a knoll and height on each islet group, a fisher's steading and the cover (sand, meadow).
- `coast`: Plate one's coast: the shore, the knolls above it with heights, a steading and the path along the shore. Where the print's dotted road runs, the rust road is drawn too (B-16), in addition to the six and never as a member (B-59).
- `hill`: On hill ground the shading reads, so it counts; cover may still be drawn. A hill hex under the dotted road or crossed by a traced river carries the rust road or the river in addition to the six (B-16, B-13, B-59); a hill top under a principal range's lettering is still a knoll or ridge named by the mint unless it holds the B-06 summit (B-09).
- `settlement`: A village or town on gentle land: its name, the hair, the height and knoll, the cover and the path out; the village is the dwelling, so no separate steading is required.
- `open_ground`: Flat plateau and farmland (relief under 40 m): 5 m contours alone cross a hex only once or twice at z7, so form lines, a named knoll and its height, a steading, a path and the cover keep it from reading blank. A traced river or the dotted road crossing open ground is drawn in addition to the six (B-59).

Calibration (computed with the probe and the anchors, 2026-10-04): sheet one's 153 hexes classify as open_ground 47, open_sea 45, coast 37, hill 17, islets 3, settlement 2, river_town 1, painted_city 1; the whole window grid (676 hexes, cells 33-58 x 38-63) as open_sea 241, open_ground 201, coast 120, no_dem 51, hill 45, islets 12, settlement 3, ruin 1, river_town 1, painted_city 1.

## Targets

Targets: a region view is one sheet-one coast band (about 180 x 288 atlas px, about 50 hexes); a valley view is a 4 x 4 hex window (128 x 128 atlas px). Region targets were calibrated on band W, the band with the most DEM ridges; another region view scales them by its land hexes and never falls below its own DEM ridge count. Valley targets are the six per land hex, counted on the 4 x 4 view around the river town in band M.

| class | region view (band W) | valley view (4 x 4 around the river town) |
|---|---|---|
| `landform_name` | 14 | 16 |
| `spot_height` | 14 | 16 |
| `town_name` | 4 | 1 |
| `road_rust` | 1 | - |
| `river_line` | 1 | 1 |
| `coast_edge` | 1 | 3 |
| `relief_shade` | 1 | 1 |
| `reserve_wash` | 1 | - |
| `caravan_halt` | 1 | - |
| `contour_hair` | - | 16 |
| `homestead` | - | 15 |
| `blazed_path` | - | 15 |
| `cover_wash` | - | 11 |
| `town_shield` | - | 1 |

Basis. Region: band W holds 14 DEM ridges of prominence >= 15 m (13 low hills of 19-46 m in the Paerāndas strip and one 160 m top on its south-east edge), 4 anchors (Epēshu, Rēketis, Āglaz, Pharzeban), one printed river, one dotted-road network and the Epēshu harbour (two sea-lane ends). Bands M and E hold only 3 and 2 DEM ridges (the plateau is a smooth dome), so there the 2x2-block promotion of B-07 carries the region names. Valley: the 4 x 4 view around Aldorūs is 11 open_ground, 3 coast, 1 hill and the river town hex; the counts are its six per hex summed. Plate one sets the floor in spirit: a reader should never find fewer names per view than a plate-one frame of the same ground.

## Prerequisites

Job 3 builds in slices: F3-A ground (DEM classes and the hex sampler, no data prerequisites; rivers.json is traced there), F3-B named things from data, F3-C fiction-stack layers and overlay hooks, F3-D city grain, plates and the final gate. "Blocks" is the earliest slice that cannot be built without the item (R11, R21); status from the POLISH audit.

| item | blocks | status |
|---|---|---|
| Traced road network | F3-B | open |
| Census second pass | F3-B | open |
| Filigree data — Aldorūs sea note (trait "out of sight of the sea" vs sea 77 px NE) | F3-B | missing |
| Filigree data — Drāmūz marker 35 px off its anchor | F3-B | missing |
| Filigree data — Hordon/Maeges anchor | F3-B | missing |
| Data fetch cache-busting | F3-C | open |
| Tier-hidden markers intercept clicks | F3-C | open |
| Sim ↔ atlas continuity | F3-C | open |
| Uncharted-band softening | F3-D | open |
| Region-chart zoom-through | F3-D | open |

`overridePrereqs` lets slice A run before the two data items are checked, never slices B-D. The three "Filigree data" items are not yet queued: they go directly above the filigree job they block, and no filigree job edits canon notes.

## Rules

| id | title | kind | sheets | rule | cites |
|---|---|---|---|---|---|
| B-01 | hex unit and DEM probe | source | country, region, valley, city | One hex is one z7 tile of 32 atlas px: cell (cx,cy) covers [32cx,32cx+32) x [32cy,32cy+32) and its centre is (32cx+16, 32cy+16) (R17). A hex is read at the valley sheet. Every DEM reading uses the committed read-only probe tools/filigree-dem.js on the raw EPESHU_HF decode (h = (R*256+G)/32 - 300 m), never the sim's carved W.H: --at x,y gives the containing cell (null outside the window), --bbox x0,y0,x1,y1 gives land_frac, hmin, hmax and peaks over the cells whose centre lies in the half-open box. A print ref names a pixel of the hex crop (gates/hexes.json: atlas x = crop.x0 + px/scale, atlas y = crop.y0 + py/scale). | q09-c01, q09-c02, q09-c03, q09-c13 |
| B-02 | ground decision list | threshold | country, region, valley, city | Ground classification is an ordered decision list of ten tests (ground_classes, "Test 1" to "Test 10"); the first test that holds names the hex's ground class. Anchor tests read maps-site/data/city-anchors.json atlasX,atlasY inside the hex's half-open bbox with no margin; DEM tests read the probe on the hex bbox (land_frac, hmin, hmax) and on the hex centre. Nothing is judged by eye. | q09-c05, q05-c14, q06-c12, q07-c13, q12-c03 |
| B-03 | no-DEM rule | exempt | country, region, valley, city | No-DEM rule (R22): a hex whose centre lies outside the DEM window [1060,1240]..[1860,2040] (the probe's --at on the centre prints h null) is exempt from the six. The sheets cover the window only: no relief, contour, height, river, cover, ridge or knoll is derived or invented there; the print and canon markers still show, nothing else is required. | q09-c06, q04-c16, q09-c03 |
| B-04 | open-sea exemption | exempt | country, region, valley, city | Open-sea exemption: a hex inside the window with no land (--bbox land_frac 0, every DEM cell below 0 m) is exempt from the six. The sea stays a flat print-hue wash, unlabelled, as plate one leaves its ocean; sea lanes and notices may cross it, nothing is required on it. | q01-c17, q09-c03, q07-c11 |
| B-05 | the blank-hex rule | must | valley | The blank-hex rule: before a land hex inside the window may be empty, each of the six classes its ground class names (ground_classes.<id>.six) stands on it as an instance whose source sits where the instance does, inside the hex (bbox +-16 px): dem at the instance's own cell, data whose own coordinates lie in the hex (chart POIs count at their city's anchor), print ink at the instance, a mint keyed to the hex (mint:<class>:<hex>), or a named sim hook (sim:<literal>). The six are the classes plates two and three delete: omission is the crime. B-05 is the umbrella of every six and is implied by the ground class: it is never cited on an item, and neither are the six (ground_classes.<id>.six) or the ground test; each item cites only its class's one governing rule (B-58). The six is exactly six items; lines and marks placed by their own rules are drawn in addition and never join or replace a member (B-59). | q02-c04, q02-c07, q02-c09, q06-c10, q07-c11, q05-c11 |
| B-06 | principal peaks | must | country, region, valley, city | Principal peaks (R1): a DEM summit with prominence >= 100 m over the whole window (probe --bbox 1060,1240,1860,2040 --min-prom 100) that stands in a canon range carries a filled triangle and that range's canon name (Aura-Hōth, Rhoshkhon, Sūs Gimīlīn) from the country sheet down; its height joins it from the region sheet. A high summit no canon range claims ranks as a ridge (B-07); it is never promoted on an invented name. The window's highest summit stands inside the printed AURA-HOTH-/HANATH region lettering and takes the Aura-Hōth name. | q09-c04, q09-c07, q07-c08, q01-c04, q13-c09 |
| B-07 | ridge names and heights, knolls | must | region, valley, city | Ridge names and heights arrive on the region sheet (R1): the ridge list is the one window run (probe --bbox 1060,1240,1860,2040 --min-prom 15), and every peak of that list in view is a ridge with a name and a height, and every aligned 2x2-hex block (even cx, even cy) that holds no ridge promotes its highest hex top to region rank. From the valley sheet every land hex also names its own highest cell (the first peaks entry of --bbox <hex> --min-prom 1) as a knoll with its height. "Knoll" is the valley-sheet word for every hex top; a hex top that is also a window-run ridge or a promoted top is the same instance at rank 3. Rank is read only from the window run and the 2x2 promotion, never from the hex-local --min-prom 1 prominence, which the hex box truncates. Rank never changes the instance, its source or its citation (spot_height cites B-08, landform_name cites B-07; B-58). Once arrived, a name or height is never dropped, generalized or replaced by a pin at closer zoom; a ridge is never generalized to save ink. | q01-c02, q01-c03, q09-c07, q09-c08, q02-c13 |
| B-08 | heights as bare numerals | source | region, valley, city | Heights are bare numerals with no unit, whole metres of the raw decode at the named cell, with one legend line "height above the sea" (R20); prov derived from EPESHU_HF. A height always sits beside a landform name or a triangle, never alone on a pin. | q09-c01, q09-c02, q01-c02 |
| B-09 | canon first, then the mint | source | country, region, valley, city | Names (R9): canon first (gazetteer, markers, chart POIs, the canon ranges, etymologies such as Aldorūs "the height"); where the land is unnamed a name is minted deterministically: xmur3(class + "\|" + cellId) -> mulberry32 over the Patrinaic roots tool (PATRINAIC_ROOTS / PATRINAIC_SUFS with the patJoin seam rules), cellId = "cx,cy"; reserved words and a fold-diacritics canon blocklist excluded; a sayability filter (no 4-consonant or 3-vowel runs, no doubled digraphs, 4-10 letters); rerolls salt the key ("\|a"+k) and never consume another cell's stream; one used set, separate from the sim's, filled in ascending cellId order. Minting runs offline in tools/ and is emitted as data; every invented name carries prov invented and is listed in docs/filigree/names-for-owner.md; an owner veto goes on the tool's veto list and the cell is re-minted. No numeric cap. Printed lettering is print ink, not a data point: a range, region or sea name lettered across a hex never names a landform in that hex. A landform name is canon only when a canon point lies inside the hex's half-open bbox: a maps_markers.json "Mountains and Hills" marker, a chart landform POI (counted at its city's anchor), or the principal summit cell of B-06 itself, which takes its range's name; every other hex top, one under a principal range's lettering included, is a knoll or ridge (B-07) named by the mint, and never a principal_peak. When the mint cannot yet be computed (tools/mint-names.js not yet built), the instance is still recorded: source mint:<class>:<hex>, name "" (never a hand-made name, never prose), standing where its class's instance_rule puts it (a minted position stands at the hex's sample point (the hex centre when node tools/filigree-dem.js --at <centre> gives h >= 0, else the hex's highest cell, the first peaks entry of --bbox <hex bbox> --min-prom 1)). That record satisfies the blank-hex rule (B-05); the name is filled when the tool emits its data. | q11-c01, q11-c03, q11-c04, q11-c06, q11-c07, q11-c08, q11-c10, q11-c12, q11-c13, q11-c14 |
| B-10 | no pin for a landform | forbidden | country, region, valley, city | A landform name is carried only by a landform label (name; triangle when principal; height where the DEM gives one). A POI pin, an icon pin or a venue name that embeds a landform word never stands in for it, never counts toward named heights, and never replaces it at any zoom. Canon chart POIs that are landforms (a hill, a rock, an arch) are drawn as landform labels; their POI halo stays hover-only. | q02-c08, q02-c10, q02-c12, q02-c15, q02-c16 |
| B-11 | contour hair | must | valley, city | Contour hair from the valley sheet (and as contour hills on the city sheet): every 5 m level of the raw decode, smoothed (one DEM cell is 1.04 atlas px and facets past z7), drawn in the contour-hair line colour at about 1 screen px. On ground whose hex relief is under 40 m a 2.5 m form line is added so flat land never reads blank; where 5 m spacing falls under 3 screen px on steep coast and hill ground only the 25 m index contours draw at that zoom. Hex relief = hmax - max(hmin, 0) from probe --bbox <hex bbox>: land relief only, every sea cell counting as 0 m, so seabed depth never adds relief (on all-land ground this equals hmax - hmin, the hill test's figure). | q09-c09, q09-c10, q09-c11, q09-c12, q09-c14, q03-c09 |
| B-12 | relief shading | must | country, region, valley, city | Relief shading inside the window from the country sheet down: an Imhof hillshade baked offline from the raw decode, light from the upper left, laid over the print without hiding its ink. The print itself draws no relief anywhere on sheet one, so every relief mark is derived. | q01-c18, q05-c03, q06-c07, q07-c07, q09-c01 |
| B-13 | print-led rivers | must | country, region, valley, city | Rivers are print-led: rivers.json traces the print's solid black lines on river-ink (lettering, road dots, graticule and a 4.5 px coast band removed), bridges under lettering recorded; the DEM gives only vertex heights, flow direction and a dem_supported flag. A DEM-only channel or a sim river is never drawn (the sim's peak-sourced rivers miss the print). The river shows from the country sheet down; river names, where any are wanted, are minted (prov invented). Every hex a traced river crosses carries it as a line drawn by this rule, in addition to the hex's six (B-59): crossing means a traced vertex or a pixel of river ink inside the hex's half-open bbox; ink only within the 16 px margin does not cross. river_line counts toward a six only on the river town's hex, whose six names it; there the river the town stands on may lie within the 16 px margin. | q10-c03, q10-c04, q10-c05, q10-c06, q10-c07, q10-c13, q10-c16, q10-c17, q10-c20 |
| B-14 | river forks | must | valley, city | River forks are drawn from the valley sheet only where traced print rivers meet or split; none is invented from DEM accumulation or from the sim, whose rivers have no forks. Sheet one's three coast bands hold no printed fork, so a fork is required only where the print draws one. | q10-c08, q10-c10, q01-c13, q10-c18 |
| B-15 | pooled edges | must | country, region, valley, city | Pooled edges: the shore (and on the city sheet the park edge) reads by contrast gathered on the paint side of the land/water mask, a darker step of the sampled print hue that falls off with distance, never by an added stroke; the print's own coast stroke stays. Every hex with 0 < land_frac < 1 carries it on every sheet. The Stamen Watercolor method is not verified, so only the brief's mechanism binds. This rule owns the class coast_edge (checklist key pooled_edge); a coast_edge item cites B-15. | q03-c03, q03-c10, q15-c05, q05-c08, q06-c06, q18-c01 |
| B-16 | the continuous rust coast road | must | country, region, valley, city | The coast road is one continuous rust line laid over the print's dotted major road (canon key: dotted = major roadways) from the country sheet down, unbroken through lettering gaps, never itself dotted. Its geometry is re-traced from the print dots: the shipped Sun Road trace, the traced-roads.json chains and the sea lanes lie off the printed road and cannot feed it before the Traced road network item. Every hex the printed dotted road crosses carries it as a line drawn by this rule, in addition to the hex's six (B-59): crossing means a printed road dot or a traced vertex inside the hex's half-open bbox. road_rust is in no ground class's six; on a coast, hill or any other hex under the dotted road it is never a seventh item and never cited in place of a member. | q01-c07, q05-c06, q05-c15, q05-c16, q06-c04, q06-c13, q06-c14, q07-c04, q07-c14, q07-c15, q17-c03, q17-c04 |
| B-17 | blazed paths | must | valley | Blazed paths from the valley sheet: cairned ways, drove-tracks and shrine-paths the party can follow without a guide; a sim road (W.roads) through the transform where one runs, else one minted path per hex where the ground class names it. Drawn as a fine solid or dashed brown line, never dotted (dotted belongs to major roads). | q04-c12, q01-c09, q13-c02 |
| B-18 | caravan halts / waystations | must | region, valley | Caravan halts / waystations (fords, ferry stairs, cog landings, beacon posts) are network nodes ranked in one table with the ways they sit on, placed at route ends and crossings (sea-lane ends, party-route stops, sim caravan routes, fords where a traced river meets a way), never by a per-hex mint. The shipped "The Beacon Post" POI is reused where a plan rolls it, never duplicated. Only the river town's halt earns a shield (B-20). | q04-c10, q04-c11, q13-c11, q05-c17 |
| B-19 | settlement names from the anchors | must | region, valley, city | Settlement names on the region sheet come from city-anchors.json and the gazetteer, ranked in the rank pass (most sheet-one places have no marker today); the print's own ring glyphs and lettering stay untouched. A ruin is named as a settlement. | q15-c15, q05-c13, q05-c14, q06-c12, q07-c13, q12-c04 |
| B-20 | one shield | must | country, region, valley | Exactly one overlay shield on the filigree sheets, at the river town Aldorūs (R8, R19), from the country sheet down: its waystation's sign. Kanae, Sokundo and every other ring get none on any filigree sheet; the print's own double-ring and ring glyphs are untouched. | q01-c10, q02-c09, q06-c03, q10-c12, q15-c07 |
| B-21 | homestead dots | must | valley | Homestead dots from the valley sheet: a steading, fold or fisher's hut is a small round dot with a plain name in the landform ink, never a ring or a town glyph; one per hex where the ground class names it, on a land cell off print ink; position and name from the mint (B-09), prov invented. No data file holds open-country structures, so every homestead is minted. | q01-c05, q04-c09, q05-c05, q11-c10 |
| B-22 | homesteads wait for the valley sheet | forbidden | country, region, city | Homesteads wait for the valley sheet: no homestead dot and no homestead name on the country sheet or the region sheet (brief p8; sheet one is the region sheet), and none inside a painted city's footprint on the city sheet. | q15-c03, q02-c04, q15-c07 |
| B-23 | every structure | must | valley | Every structure on the valley sheet: wells, folds, wayside Kembar shrines, granaries, ruined towers, the sim's cairns and bridges, as small marks under the halts and over the ways. Open-country structures are minted (prov invented); structures inside settlement plans stay in the seeded plan. | q04-c09, q04-c11, q04-c04 |
| B-24 | reserves as a named wash | must | region, valley | Reserves (a Kembar's grove, the crown's chase, the commons) arrive on the region sheet as a named wash in a green step of the sampled print hue, with no outline and no pin; extent from the forest and pine clusters of the sim's seeded biome grid inside the window, names canon or minted. A reserve is never carried by a park pin. | q01-c06, q02-c09, q05-c20, q15-c04 |
| B-25 | cover wash | must | valley | Cover wash from the valley sheet: the hex's ground cover (wood, tilth, meadow, marsh, sand, rock) read from the sim's seeded biome grid (genBiomes) through the transform, baked as data for seed epeshu, tinted as a step of the sampled print hue. Required where the ground class names it; elsewhere it may still be drawn. | q13-c02, q13-c14, q15-c05 |
| B-26 | real colours | source | country, region, valley, city | Real colours (R3): the named palette (rust road, ocher arterials, rose-brown built grain, contour hair) is for drawn line work only; every wash (water, reserves, cover, fog, city tone) samples the print hue as washMake does; bone paper is the print itself. Colour tests are ordering tests (built hue below arterial hue, arterial near ocher, parks green, water cool), not hex matches. | q15-c05, q03-c12, q08-c20, q05-c08 |
| B-27 | names on a threshold | threshold | country, region, valley, city | Names on a threshold (R2): rank decides when a name appears (its minzoom), never how it is inked; landform and homestead names share one ink colour and one face family, with at most one size step between ranks. Below its threshold a rank is absent. Arrival order: rank 1-2 country, 3-4 region, 5-6 valley, 7 city, 9 never. | q15-c07, q15-c03, q01-c16, q02-c13 |
| B-28 | appear effect | threshold | country, region, valley, city | Appear effect (R6): presence is a threshold per rank; after arriving, ink eases over at most 0.25 zoom or 250 ms on the live zoom event (the continuous ramps of worldOpacityUpdate, not the zoomend tier switch); a name lands at or after its own ink (dot, contour, way), never before it; nothing fades in below its threshold. | q15-c08, q15-c09, q15-c03 |
| B-29 | cramped | threshold | region, valley, city | Cramped: the rank pass measures label boxes in screen px on the live map container (a phone switches labels on at about 0.6x the desktop scale, so the gap is never inferred from the tier class); when two boxes come closer than the minimum gap, the lower-ranked name's threshold moves to the zoom where both fit. A name is never shrunk to fit (one size step at most) and, once arrived, never dropped. | q15-c11, q15-c12 |
| B-30 | one question per sheet | must | country, region, valley, city | One question per sheet, through the Contents plates: country "where is the coast, the river, the one town?"; region "which valley do we commit to?"; valley "what is around us?" (the valley sheet at the party's place); city "where are the park, the arterial and the fog?"; overlays "where can we go this week?", which extends the shipped Roads & Waters plate with halts, shut ways and muster days only. Navigators keep search, #place and #journey without filigree. | q15-c10, q15-c17, q15-c01 |
| B-31 | paint on the base | must | country, region, valley, city | Paint on the base (R5): the bone-paper ground is the print's own era raster, accepted and never de-lettered; relief shade, pooled edges and print-hue washes are laid on it. Paint never carries a name and a name never carries paint. "Nothing smaller than the one town" binds the filigree overlay only. | q15-c04, q15-c01, q05-c03 |
| B-32 | data truth | source | country, region, valley, city | Data truth (R11, R21): pretty maps do not fix bad data. Named layers are built only from data that matches the print: Job 3 slice B (named things from data) waits for the Traced road network and Census second pass items; data contradictions (Aldorūs "out of sight of the sea" against a sea 77 px NE; the Drāmūz marker 35 px off its anchor; the Hordon/Maeges anchor) are recorded and queued directly above the filigree job they block; filigree jobs never edit canon notes. | q15-c16, q17-c01, q17-c02, q06-c12, q10-c12, q05-c15, q05-c20 |
| B-33 | built grain, texture before type | must | city | Texture before type: the painted city carries built grain in rose-brown, fine and aperiodic (on the Epēshu chart it decorrelates in 3-4 chart px), sub-pixel tone at the valley band that resolves into structure as the city sheet is entered (the grid becomes a textile between about z8.3 and z9.3). Grain comes from the painted chart or the seeded plan, never from labels. | q03-c04, q03-c05, q08-c03, q08-c14, q08-c21 |
| B-34 | no label on every block | forbidden | city | No label on every block: on the city sheet no block, house or lane carries a label at rest; quarter and street names arrive only on a threshold inside the city band, ranked like every other name. | q03-c02, q15-c07, q15-c02 |
| B-35 | park voids | must | city | Park voids: green voids with no built grain inside (on the Epēshu chart the Māmban garden, the Necropolis grove, the temple lawns), edged by pooled paint rather than an outline; cream open ground, fields and the wood at the city edge do not count. Generated plans have no park primitive, so one is new machinery. | q03-c06, q08-c05, q08-c16 |
| B-36 | ocher arterials | must | city | Arterials in ocher: the top road class through the painted city (the great road through the forum) is drawn in ocher on top of the width ranking. The chart's arterial is slate and the seeded plans' roads are all cream, so ocher is a new colour channel, not a recolour. | q03-c07, q08-c04, q08-c15, q08-c20 |
| B-37 | fog as weather | must | valley, city | Fog as weather, not art: a fog wash around a painted city is a seeded function of place and the snapshot sim day (mint key xmur3("fog_wash\|" + cellId + "\|" + snapshotDay) -> mulberry32), never wall-clock and never a sim state (W.weather has no fog); denser over water and far shores than over the built core, present at the zoomed-out valley band and thinning as the city sheet is entered; on the city sheet it lies over built grain only, never over a name. | q03-c08, q13-c10, q15-c06, q08-c09 |
| B-38 | contour hills | must | city | Contour hills on the city sheet come from the DEM where the DEM puts them (Epēshu's high ground lies south-east, not on a compass-side rule), smoothed, and clipped to the chart's own coast where the DEM shore disagrees with it. | q03-c09, q08-c07, q08-c08 |
| B-39 | no chrome, no pin at rest | forbidden | city | No UI chrome and no pin drawn at rest over the painted city: POI halos stay hover-only; the chart's printed numbered badges are the print's own legend badges (R5: accepted, not removed, not counted as added pins); seeded plans add no roundel or cartouche over the city sheet. | q03-c11, q08-c10 |
| B-40 | the old survey under | must | country, region, valley, city | The old survey lies under the live sheet at any scale. The Imperial and War era rasters are a land-hue recolour of the modern print (the same roads, rivers, coast and lettering), so under the live base they give tint only; old names, dead roads and wood that grew back come from a new authored layer (canon old names first, else older forms minted from the lexicon etymology through the roots tool and build-gazetteer, prov invented). Era and layer state round-trip in the hash, and pulling the old survey needs no redraw. | q14-c01, q14-c03, q14-c06, q14-c08, q14-c09, q14-c10, q04-c06, q04-c07 |
| B-41 | muster days on top | must | country, region, valley, city | Muster days ride on top and swap between sessions: levy musters on the sling-fields (at the shipped "The Muster Ground" POI where a plan rolls it), the army in the field (Pebros encamped by Lepon until Yuleday), bandit-held stretches, dragon flights, Tamar's dark hour. Each notice carries a place, a start and an end in A.B. days and an in-fiction voice (the levy-master's board), taken from a fixed-seed, fixed-day sim snapshot or the DM's per-session file, never from wall-clock or a live fate call. | q04-c13, q13-c01, q13-c03, q13-c04, q13-c08, q13-c14 |
| B-42 | shut ways on top | must | country, region, valley, city | Shut ways ride on top and swap between sessions: flooded fords, rockfall passes, plague-watched and war-shut gates, a bandit-held road with the innkeeper's detour. Roads carry no status today, so each notice names the way, the shut stretch and the detour; sources are the snapshot's plague and hunger flags, the ambush chronicle lines, the Pebros camp, or the DM's slip. | q04-c15, q13-c05, q13-c06, q13-c07 |
| B-43 | notices outside the release | source | country, region, valley, city | Notices load outside the release cycle (a hash or URL param, a local file import, or a separately cached notices URL), never drawn into the base; the atlas has no live feed from the sim, so sim notices are a committed fixed-seed snapshot. | q13-c13, q17-c09, q04-c03 |
| B-44 | paint and stack order | source | country, region, valley, city | Paint and stack order: relief, contours, water, rust road, reserves, homestead dots, names and heights, city grain, fog; the old survey as a second tile layer under the live base (opacity or swipe); notices above everything; structure marks under halts and over ways. | q04-c02, q04-c03 |
| B-45 | vocabulary | source | country, region, valley, city | Vocabulary (R10): caravan halts / waystations; muster days; the old survey (the Imperial and War era sheets); shut ways. The shipped tribute POIs are renamed by a Job 3 unit to The Tribute-Yard and The Tribute-Barn, with their description reworded to "harvest-tribute" (see ## Renames). Every name is sayable at the table in the chronicle voice: bronze-age Nīmlad, the nine Kembar, years A.B. | q04-c04, q04-c05, q04-c17, q13-c12, q11-c15 |
| B-46 | sheets as zoom bands | source | country, region, valley, city | Sheets are zoom bands over the same ground: country = reveal tiers A and B; region = tier C up to z6; valley = z6 to z8 in open country; city = z >= 7.5 inside a painted city's footprint. Sheet one is the region sheet over the Pēshunor north coast (R8). The DM may hold a sheet when the party commits to a valley (brief p8). | q15-c08, q15-c11, q03-c05, q15-c03 |
| B-47 | country: nothing smaller than the one town | forbidden | country | Country sheet, nothing smaller than the one town (in the filigree overlay; the print's own ring lettering stays, R5): no homestead, no ridge or knoll name below the principal peaks, no height, no contour hair, no blazed path, no structure, no cover wash, no overlay settlement label (the print letters the towns; the river town carries only its shield), no built grain. | q15-c07, q15-c17, q15-c03 |
| B-48 | region: what waits | forbidden | region | Region sheet: contour hair, river forks, blazed paths, structures, cover washes and built grain wait for later sheets; reserves show only as a named wash, never as a pin. | q15-c03, q15-c17 |
| B-49 | targets and views | threshold | region, valley | Targets: a region view is one sheet-one coast band (about 180 x 288 atlas px, about 50 hexes); a valley view is a 4 x 4 hex window (128 x 128 atlas px). Region targets were calibrated on band W, the band with the most DEM ridges; another region view scales them by its land hexes and never falls below its own DEM ridge count. Valley targets are the six per land hex, counted on the 4 x 4 view around the river town in band M. | q05-c04, q09-c07, q05-c11, q06-c10, q07-c11, q12-c04, q12-c05 |
| B-50 | sim to atlas transform | source | country, region, valley, city | Sim to atlas inside the window only: atlas = (1060,1240) + (g + 0.5) * 800/768 for sim grid cell g; valid for seed epeshu alone; procedural seeds get no overlay. Sim-sourced layers (cover, paths, notices) are baked from a fixed-seed snapshot as data. | q13-c02, q04-c16, q09-c02 |
| B-51 | plate one benchmark | source | region, valley | Plate one is the density benchmark: 49 legible names on one frame (27 triangle landforms, 25 of them with heights from 797 to 2,205; 19 place labels, 10 of them homesteads and 9 in the river knot; 3 reserve washes), one continuous rust road from the coast up the valley, one legible shield, three or more river forks, one braided reach, hillshade and contour texture over every inland part, and no named river. | q01-c02, q01-c05, q01-c06, q01-c07, q01-c10, q01-c13, q01-c14, q01-c18, q01-c19 |
| B-52 | plate two deletions refused | forbidden | region, valley | Plate two's deletions are forbidden here: it drops every height (25 to 0), every triangle, the contour hair, the trails, the rust road, the shields, the reserve washes and eight of ten homesteads, and keeps three landform names only as icon pins. Each of those classes has its sheet in this bible, and an icon pin never counts as a landform name (B-10). | q02-c02, q02-c03, q02-c04, q02-c08 |
| B-53 | plate three deletions refused | forbidden | region, valley | Plate three's deletions are forbidden here too: no height, triangle, peak pin, river name, contour or trail survives there, the rust road goes grey, and a venue pin carries the last trace of a landform name. Shields and parks are demoted rather than deleted, so the table map keeps the one shield and the reserve washes. | q02-c05, q02-c06, q02-c07, q02-c09, q02-c10 |
| B-54 | valley: what is refused | forbidden | valley | Valley sheet: no shield anywhere but the river town's; no label on blocks and no pin at rest; outside a painted city's footprint no built grain (inside it the city reads as tone until the city sheet). | q15-c07, q03-c05, q01-c10 |
| B-55 | the ground (R8) | source | country, region, valley, city | Ground (R8): coast C1 (the Pēshunor north coast, Epēshu - Sokundo - Kanae - Rhup - Tamaron), river town Aldorūs, painted city Epēshu. Sheet one is the region sheet over C1, bbox x1216-1760, y1376-1664, walked as coast bands W x1216-1400, M x1400-1580, E x1580-1760; city quarter Q1 is Epēshu chart px [256,2304) x [1280,3328). | q05-c01, q06-c01, q07-c01, q08-c01, q10-c12 |
| B-56 | labels against the print | must | region, valley, city | Labels against the print: the print's lettering and rings are never moved or knocked out (R5). Where an overlay label's point sits on printed ink (a summit beside a region name, a knoll inside spaced lettering), the label offsets along its placement order while the point (triangle, dot, height) stays on its DEM cell; overlay lines are knocked out under overlay labels only. | q16-c03, q16-c04, q16-c05, q16-c16 |
| B-57 | city tone | must | valley, city | City tone: on the valley sheet a painted city reads as one wash at its anchor, the washMake tone sampled from the print's land hue under the plan on the overlay opacity ramp (R3), never an imposed palette colour and never a label; on the city sheet the same tone lies under the built grain. Every painted-city hex carries it; its source is the city's anchor in city-anchors.json. This rule owns the class city_tone; a city_tone item cites B-57. | q15-c05, q15-c04 |
| B-58 | one governing rule per class | source | country, region, valley, city | One governing rule per class: every class names exactly one rule that owns it (classes[].rule, and the class-to-rule table under the blank-hex answer), and a blank-hex item's rule field holds that one bare id, matching ^B-[0-9][0-9]$, and nothing else. Rules that shape a class without owning it (B-07 placing a height, B-09 naming, B-10 no pin) and the forbidding rules (B-22, B-47, B-48, B-52, B-53, B-54) are never cited on an item; B-05, the six and the ground test are implied by the ground class and are never cited either. No prose, second id, slash or comma list, or "six of <class>" goes in the field. | q02-c04, q02-c07 |
| B-59 | lines and marks outside the six | source | country, region, valley, city | Lines and marks outside the six: river_line (B-13), road_rust (B-16), river_fork (B-14), principal_peak (B-06), caravan_halt (B-18), structure (B-23), reserve_wash (B-24), muster_day (B-41) and shut_way (B-42) are drawn wherever their own rule places them and are checked by the sheet gates; on a hex they come in addition to its six, never join its count and never replace a member. A blank-hex answer names exactly the six its ground class lists, with no seventh item, even on a hex the traced river or the dotted road crosses; river_line counts toward a six only where the river town's six names it. | q10-c07, q06-c13 |

## Checklist

| key | rule |
|---|---|
| peak | B-06 principal peaks |
| height | B-08 heights as bare numerals |
| homestead | B-21 homestead dots |
| reserve | B-24 reserves as a named wash |
| river_fork | B-14 river forks |
| coast_road | B-16 the continuous rust coast road |
| plate2_deletions | B-52 plate two deletions refused |
| plate3_deletions | B-53 plate three deletions refused |
| block | B-33 built grain, texture before type |
| park_void | B-35 park voids |
| arterial | B-36 ocher arterials |
| fog_wash | B-37 fog as weather |
| contour_hill | B-38 contour hills |
| old_survey | B-40 the old survey under |
| every_structure | B-23 every structure |
| caravan_halts | B-18 caravan halts / waystations |
| blazed_paths | B-17 blazed paths |
| muster_days | B-41 muster days on top |
| shut_ways | B-42 shut ways on top |
| paint_on_base | B-31 paint on the base |
| names_on_threshold | B-27 names on a threshold |
| appear_effect | B-28 appear effect |
| one_question_view | B-30 one question per sheet |
| pooled_edge | B-15 pooled edges |
| real_colour | B-26 real colours |
| cramped | B-29 cramped |
| data_truth | B-32 data truth |

## Renames

- Brief "coach posts" (Swiss-stack table, Research, Implementation) -> caravan halts / waystations. Anachronistic for bronze-age Nīmlad; never copied through.
- Brief "artillery hours" -> dropped; the dossier's live-fire "range days" -> muster days (levy musters on the sling-fields, the army in the field, bandit-held stretches, dragon flights, Tamar's dark hour).
- Brief "the 1864 sheet" / Zeitreihen -> the old survey (the Imperial sheet, the War sheet).
- Brief "closures" -> shut ways. "Building register" -> every structure. "Marked paths" -> blazed paths. "Color base map" -> the print with its relief laid on.
- Shipped POI "The Tithe-Yard" (its d: string "...where the harvest-tithe is weighed...") -> "The Tribute-Yard", d: reworded to "harvest-tribute". Shipped POI "The Tithe-Barn" -> "The Tribute-Barn". A Job 3 unit does both renames; afterwards `grep -ci tithe maps-site/index.html` must print 0 (Job 4 F06 checks the pair by name and by that grep). Tithe is church vocabulary; the rename is never a Job 1 gate failure. Overlay code looks POIs up by the Tribute names or a name-agnostic key.
- Plate names (Sonoma: Table Mountain, Toners Place, Fort Ross State Historic Park and the rest) are reference counts only; no plate or Swiss name goes on a Nīmlad sheet.

## Provenance

- Integrated 2026-10-04 from: the brief `docs/research/filigree-for-the-table.pdf` pp.1-8; the trusted research files q01-q18 under `docs/filigree/research/` (claim ids `<qid>-cNN`); `research-dossier.md` sections 5-9; `todo-inputs.json`; the README "Reuse map"; rulings R1, R2, R3, R5, R6, R8, R9, R10, R11, R17, R19, R20, R21, R22 (defaults; `rulings.json` carries no overrides).
- Struck claims, never cited: q01-c01, q04-c08, q04-c14, q04-c18, q06-c16, q08-c17, q12-c06, q15-c13, q15-c14, q16-c02, q16-c06, q16-c09, q16-c10, q17-c06.
- Claims cited by the rules (181): q01-c02, q01-c03, q01-c04, q01-c05, q01-c06, q01-c07, q01-c09, q01-c10, q01-c13, q01-c14, q01-c16, q01-c17, q01-c18, q01-c19, q02-c02, q02-c03, q02-c04, q02-c05, q02-c06, q02-c07, q02-c08, q02-c09, q02-c10, q02-c12, q02-c13, q02-c15, q02-c16, q03-c02, q03-c03, q03-c04, q03-c05, q03-c06, q03-c07, q03-c08, q03-c09, q03-c10, q03-c11, q03-c12, q04-c02, q04-c03, q04-c04, q04-c05, q04-c06, q04-c07, q04-c09, q04-c10, q04-c11, q04-c12, q04-c13, q04-c15, q04-c16, q04-c17, q05-c01, q05-c03, q05-c04, q05-c05, q05-c06, q05-c08, q05-c11, q05-c13, q05-c14, q05-c15, q05-c16, q05-c17, q05-c20, q06-c01, q06-c03, q06-c04, q06-c06, q06-c07, q06-c10, q06-c12, q06-c13, q06-c14, q07-c01, q07-c04, q07-c07, q07-c08, q07-c11, q07-c13, q07-c14, q07-c15, q08-c01, q08-c03, q08-c04, q08-c05, q08-c07, q08-c08, q08-c09, q08-c10, q08-c14, q08-c15, q08-c16, q08-c20, q08-c21, q09-c01, q09-c02, q09-c03, q09-c04, q09-c05, q09-c06, q09-c07, q09-c08, q09-c09, q09-c10, q09-c11, q09-c12, q09-c13, q09-c14, q10-c03, q10-c04, q10-c05, q10-c06, q10-c07, q10-c08, q10-c10, q10-c12, q10-c13, q10-c16, q10-c17, q10-c18, q10-c20, q11-c01, q11-c03, q11-c04, q11-c06, q11-c07, q11-c08, q11-c10, q11-c12, q11-c13, q11-c14, q11-c15, q12-c03, q12-c04, q12-c05, q13-c01, q13-c02, q13-c03, q13-c04, q13-c05, q13-c06, q13-c07, q13-c08, q13-c09, q13-c10, q13-c11, q13-c12, q13-c13, q13-c14, q14-c01, q14-c03, q14-c06, q14-c08, q14-c09, q14-c10, q15-c01, q15-c02, q15-c03, q15-c04, q15-c05, q15-c06, q15-c07, q15-c08, q15-c09, q15-c10, q15-c11, q15-c12, q15-c15, q15-c16, q15-c17, q16-c03, q16-c04, q16-c05, q16-c16, q17-c01, q17-c02, q17-c03, q17-c04, q17-c09, q18-c01.
- Computed during integration (read-only, temp scripts): the ten-test classification of every sheet-one and window hex with `tools/filigree-dem.js` and `city-anchors.json` / `detail-charts.json`; DEM ridges per coast band (`--bbox <band> --min-prom 15`: W 14, M 3, E 2); window summits of prominence >= 60 m (328.19 m at 1649.06,1604.06; 175.94 m at 1094.9,1760.31; 59.81 m at 1111.56,1467.6); anchors per band (W 4, M 5, E 3); the 4 x 4 valley view around Aldorūs.
- Brief conflicts settled: (a) "peaks and heights always" vs heights held to the region sheet: principal peaks from the country sheet, ridge names and heights from the region sheet down (R1, B-06, B-07); (b) "same ink for shed and peak" vs ranks: rank sets when, not how (R2, B-27); (c) planning palette vs "real colours": palette for line work, print hue for washes (R3, B-26); (d) "texture over type" vs dropped street names: street names on a threshold inside the city band (B-34); (e) "nothing smaller than the one town" vs a print that letters every ring: the rule binds the overlay only (R5, B-47); (f) "names do not fade in from nothing" vs the praised appear effect: threshold plus a short ink ease (R6, B-28).
- Vocabulary: the voice is bronze-age Nīmlad, the nine Kembar, years A.B.; church and medieval words (tithe, coach, artillery, pilgrim and the like) appear only here and in ## Renames.
- Open (not settled by the trusted evidence): which canon range, if any, claims the 175.94 m summit in the far west of the window (until a ruling it ranks as a ridge, B-06); where Sūs Gimīlīn and the Rhoshkhon range stand on the atlas; the sayability thresholds and class head sets of the mint (proposals, not DM-ruled); the steading pool (about 147 names) is too small for a window-wide homestead layer without compounds; pooled-edge width and depth; the Stamen Watercolor method (unverified); the minimum label gap in px (needs a browser measure at 390 px width); the DEM shore runs up to 10 atlas px off the Epēshu chart coast in the south; whether the two Lamor reaches are one river under the L of LEPONNIA; the daily time of Tamar's dark hour (canon, not in the sim).

