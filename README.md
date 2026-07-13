# The Annals of Epēshu — a living Nīmlad in a single file

![The Annals](share.jpg)

A procedurally simulated realm that lives on its own — harvests and plagues, dynasties
and civil wars, bandits, omens, and a dragon asleep in the Aura-Hōth heights — while its
chronicle writes itself in the margin, dated in years **After the Binding**.

This fork of [emollick/annals-kingdom](https://github.com/emollick/annals-kingdom) is
themed to the *Tale of the Allhammers* D&D campaign: the default world is **Epēshu, the
Marble City, and Leponnia** — its coastline, towns, and ruined old capital traced
directly from the campaign atlas (`PatrinorModern.png`) — under the gas giant **Tamar**,
whose daily eclipse brings the dark hour. The Kembar receive worship; the Mad One does not.

Everything is one HTML file. No build step, no backend, no saves — the entire realm
regenerates deterministically from a seed in the URL hash, so a link *is* a world:
`#s=epeshu` forges the campaign realm in 1374 A.B.; any other seed forges a procedural
corner of the Wide World with the same rules.

## The two sites

- **sim.princexizor.ddns.net** — this simulation: the party's corner of Nīmlad living
  day by day; trade routes, worldly affairs, and how life goes on.
- **maps.princexizor.ddns.net** — the interactive atlas (`maps-site/`): the full
  campaign map with place lore from the wiki, realm boundaries, the party's route, and
  reviews of establishments from those best qualified to give them.

See [DEPLOY.md](DEPLOY.md). Campaign wiki: [princexizor.ddns.net](https://princexizor.ddns.net).

## What lives in it

- **The atlas made flesh** — Leponnia's true coastline as terrain, 19 mapped
  settlements from Epēshu to Kardunash, Lepon the Old in eternal ruin, the Marble Gulf,
  Paerāndas, and Mount Tamator where the atlas draws the Aura-Hōth-Hanath
- **A working bronze-age economy** — grain, salt fish, timber, copper ore, bronzework,
  dyed cloth, and wine; prices from scarcity, caravans and cargo cogs, tolls, famines
- **A dynasty** — named notables who marry, scheme, and die; successions, regencies,
  usurpers, browsable family trees; five Leponnian great houses with temperaments,
  grudges, and civil wars
- **Walled towns with districts** — circuits with road-aligned gates and towers that
  rise as towns prosper; temple-towers to each settlement's patron Kembar; market
  wards, dockside warehouses, smith rows
- **The fates** — Thobrauk's floods, Mālgal's harvests, Doremil's comets, barghest
  wolf-winters, the white elk of Bēlkar, star-iron falls, and one child of Laegos
- **The world map** — press `M`: a chart of the living realm with click-to-travel, and
  for the campaign world a crossfade to the atlas art itself; a minimap tracks the
  camera always
- **An auto-director and Watch mode** — leave it alone and the camera drifts to
  whatever story is breaking; press `C` and the realm narrates itself
- **The Chronicle** — every event inked with its A.B. date, filterable, exportable,
  with charts of population, treasury, and prosperity across the decades
- **Acts of God** — plague, fire, earthquake, dragon-waking, assassination, contested
  successions, or the charter of a new village exactly where you click
- **Custom Map Mode** — load your own heightmap + settlement list from the World tab
  and forge any region of the Wide World (grid 0–767)

## Controls

| Desktop | Touch |
|---|---|
| drag to orbit | one finger orbits |
| two-finger scroll pans · pinch or mouse wheel zooms | pinch zooms, drag pans |
| right-drag to pan | two fingers pan |
| double-click to travel | double-tap travels |
| click to inspect | tap inspects |

`space` pause · `1–5` speed · `M` world map · `T` territories · `C` watch mode ·
`G` director · `L` labels · `H` hide the court · `Esc` release

## Running locally

Open `index.html` in a browser, or:

```
node server.js
```

and visit `http://localhost:8544`. The only network dependency is three.js r128 from a CDN.

## How it's built

Vanilla JavaScript and three.js r128 in one file. Four seeded RNG streams (worldgen,
detail, ambient, history) keep generation and simulation deterministic — the same seed
always yields the same world and the same history, at any speed. The campaign terrain
ships as an embedded 768² heightfield PNG decoded at boot; the atlas art rides along as
the M-map's second layer. Versioning is SemVer 2.0 alpha — see [CHANGELOG.md](CHANGELOG.md)
and `.claude/CLAUDE.md` for the release workflow.

## License

[MIT](LICENSE) — upstream by [Ethan Mollick](https://github.com/emollick/annals-kingdom);
campaign theming for the Tale of the Allhammers.
