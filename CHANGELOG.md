# Changelog

All notable changes to this project are documented here. Versioning follows
[SemVer 2.0.0](https://semver.org/spec/v2.0.0.html); every release is currently
an `-alpha.N` prerelease. See `.claude/CLAUDE.md` for the release workflow.

## [0.8.2-alpha.1] — 2026-07-13
- Generated city plans now meld with the atlas: coastlines derived from the actual
  map pixels beneath each footprint (printed labels filtered out; quays ray-cast onto
  the true waterline), a parchment wash quiets the magnified ink under every plan
  (real charts included), and a seeded irregular vignette dissolves the plan edges —
  no more floating squares
- Mobile emulation sweep: atlas verified at five form factors (320px–iPad, portrait
  and landscape, DPR 2–3) with zero overflow and correct panel modes; two nits queued

## [0.8.1-alpha.1] — 2026-07-13
- Every canon point is now visible: off-chart markers (Far North, Fell Mountains,
  Hoarland, Moonless Lands) pin to the map's edge with a direction chevron and
  "beyond the charted north/west" honesty in tooltip and card; the journey
  fly-through lands every waypoint fully inside the locked viewport
- Fixed a latent Catmull-Rom denominator bug that flung the final sub-segment of
  every route/lane leg tens of thousands of pixels off-canvas
- Scrubbed editor annotations that had leaked into two waypoint notes

## [0.8.0-alpha.1] — 2026-07-13
- The meshed world: one continuous zoom from continent to alleyway — the atlas fades
  beneath you into real city plans (Epēshu with its 19 legend POIs, the Summarch
  sketch) or seeded canon-informed generated plans for every other anchored town
  (walls, gates, quays on true coastal bearings, ruin mode for Lepon), with dynamic
  zoom depth, an "uncharted at this scale" treatment in open country, and honest
  provenance everywhere: ⚜ archives / ⌖ traced / ✶ conjecture
- Ways & Waters: four sea lanes with cog glyphs, the Road that Walks with the Sun and
  the East-West Road as traced highways, seven Leponnian district borders (dotted,
  off by default), all fading out on descent
- Mac trackpad on the atlas: two-finger scroll pans, pinch and mouse wheels zoom
  (mirrors the sim); host-aware Sim link (works on Pages/localhost)
- Player canon: Sjefenhold (Frösted's ruined home village) and Kolens in Diapremon
  with the Kolens Connection drawn into its generated plan; Frösted's card carries
  the public arc of his backstory
- Fixes from review: deep-link zoom stall (Leaflet animation stranding), Gulf
  Crossing lane rerouted off the Mīth Mīrdak landmass, Ways master-toggle symmetry,
  Drāmūz provenance mislabel, retina chart tiles at max zoom

## [0.7.1-alpha.3] — 2026-07-13
- Mac trackpad gestures in the sim now follow the Apple/Google Maps convention:
  two-finger scroll PANS (pan previously had no gesture — only right-drag);
  pinch and real mouse wheels zoom toward the cursor (delta heuristic)
- Atlas gets the mirror treatment in the next site build

## [0.7.1-alpha.2] — 2026-07-13
- Sim ↔ atlas cross-links: an "⚘ Atlas" chip in the sim's top bar (host-aware:
  relative on Pages/localhost, subdomain in production); the atlas's Sim link
  gains the same host-awareness in the next site build

## [0.7.1-alpha.1] — 2026-07-13
- GitHub Pages deployment: every push to master publishes the sim at
  arnavsacheti.github.io/annals-kingdom/ and the atlas at /maps-site/ —
  zero-cost demo hosting (public repo), no DDNS required for feedback rounds

## [0.7.0-alpha.1] — 2026-07-12
- Detail charts from the wiki's MapArt: 15 locations open an in-depth chart from
  their place card (Epēshu's 3914×4200 city plan tiled to native zoom; the Seat,
  Summarch sketch, Rhusagos, Relkor, and more as fitted overlays), with a
  "Back to the Wide World" control that restores the exact prior view and era,
  and #chart= deep links
- Epēshu's chart carries 19 interactive POIs matching the map's printed legend
  (temples, Forum, Māmban, Relkhonak, amphitheatre, Black Barghest Inn…), each
  opening a canon description card
- 28 LocationArt illustrations as place/realm card header plates
- Fix: chart tiles blanking at max zoom on retina displays

## [0.6.1-alpha.2] — 2026-07-12
- Fix: bottom-left dock (Company strip, Groups button, scale bar) no longer hides
  behind the open side panel — it shifts clear on desktop, and yields to the
  bottom sheet on mobile

## [0.6.1-alpha.1] — 2026-07-12
- Deep-zoom quality: z5 tile level rebuilt with unsharp masking (linework and
  lettering crisp at max zoom, no halos) and extended to the Imperial and
  War-of-the-Patrons era maps — switching ages at full depth no longer blurs

## [0.6.0-alpha.1] — 2026-07-12
- The Company: character cards (grounded bios, fly-able road beats, gear, review
  dispatches), hometown POIs, conjectural origin trails, company strip — each
  toggleable; deep links (#company=…)
- Groups & Powers: nine factions with alignments, seat badges, member cross-links
  (the Eshbrīn, Orondēs, and Lektān of Epēshu; the Allhammers, Ninth House,
  the Cloister, Pebros's Army, the Senate, the Māgosh)
- Viewport locked vertical-fill with free side-scroll (Google-Maps feel); party
  route redrawn as centripetal Catmull-Rom curves through geographic via points
- The sim's Epēshu is now the canon city: nine district labels (Wood Quay,
  Whitestreet, the Marble Quarter…), the Blue Temple of Thobrauk, Bangeph Rock
  raised offshore, Mount Mastery and the Fairy Arch, Pebros's camp at Lepon with
  its chronicle line, ruler = Surīhurūk Hethel of the Mālaz (republic title
  threaded through chip/chronicle/inspector), &goto= deep links
- Canon-name hygiene: Selwin and Pebros removed from the random name pool
  (in-place swap, RNG draw order preserved)

## [0.5.0-alpha.1] — 2026-07-12
- Atlas UX overhaul: side-panel place cards with full wiki lore (popups retired),
  era base layers (Modern / War of the Patrons / Imperial), realm hover cartouches,
  fit-relative zoom-tier reveal, "Follow the journey" fly-through, Cyrikon-miles
  scale bar, cover-fit viewport with resize handling, retina tiles (z5 crisp),
  deep links (#place=…)
- server.js resolves directory paths (serves /maps-site/ alongside the sim)

## [0.4.0-alpha.1] — 2026-07-12
- New `maps-site/`: the interactive atlas for maps.princexizor.ddns.net — Leaflet over
  a tiled PatrinorModern (z0–4), wiki markers with lore popups and read-more links,
  realm-boundary polygons extracted from the atlas tints (all 8 legend realms), the
  party's 12-waypoint route with session notes, diacritic-folding search, and 16
  Traveller's Reviews grounded in the session logs (lore-reviewed and corrected)
- `DEPLOY.md`: nginx/Caddy blocks for sim. and maps. subdomains
- README rewritten for the campaign fork (upstream credit retained)

## [0.3.0-alpha.1] — 2026-07-12
- World enlarged 6 km → 9 km (N=768, CELL unchanged) with a whole-realm zoom ceiling
  (alt 11 km), altitude-scaled fog, and content density scaled to the larger land
- Town generator: wall circuits with road-aligned gates and towers (capital + towns,
  and mid-sim when a town crosses 650 souls, with a chronicle line), districts
  (temple precinct, market ward, dockside warehouses, smith row, granary edge),
  per-settlement patron Kembar, temple-towers
- Minimap (camera wedge, live markers) + full-screen world map on `M` with
  click-to-travel, canvas-rendered from world data
- Calendar switched to campaign reckoning: sim Year 1 = 1374 A.B. (After the Binding)
- Epēshu realm rebuilt from the campaign atlas `PatrinorModern.png` (source of truth):
  true Leponnian coastline decoded from an embedded 768² heightfield, 19 mapped
  settlements at atlas positions, Lepon the Old as eternal ruins, Aura-Hōth highlands,
  and the atlas art itself as a crossfade layer in the M-map

## [0.2.0-alpha.1] — 2026-07-12
- Nīmlad campaign reskin: Paternic naming, Kembar pantheon in fates/omens,
  bronze-age goods, chronicle prose in campaign voice
- Cosmology: gas giant Tamar rendered in the sky shader + daily dark-hour eclipse
- Custom Map Mode (`window.CUSTOM_MAP_DATA` / `CUSTOM_MAP_LOCK`) ported to the 3D
  renderer (heightmap, settlements, house names), with World-tab UI
- Epēshu set as the default realm (synthetic first-pass coastline)

## [0.1.0] — 2026-07-11
- Base single-file sim (fork point from upstream `emollick/annals-kingdom`)
