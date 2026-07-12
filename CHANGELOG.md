# Changelog

All notable changes to this project are documented here. Versioning follows
[SemVer 2.0.0](https://semver.org/spec/v2.0.0.html); every release is currently
an `-alpha.N` prerelease. See `.claude/CLAUDE.md` for the release workflow.

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
