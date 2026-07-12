# Changelog

All notable changes to this project are documented here. Versioning follows
[SemVer 2.0.0](https://semver.org/spec/v2.0.0.html); every release is currently
an `-alpha.N` prerelease. See `.claude/CLAUDE.md` for the release workflow.

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
