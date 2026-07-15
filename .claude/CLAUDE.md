# The Annals — project guide

A procedurally generated living-kingdom sim in **one file** (`index.html`, vanilla JS +
three.js r128 via CDN, no build step). Themed to the owner's D&D campaign
*Tale of the Allhammers*, set in Nīmlad. `server.js` is a minimal static server:
`node server.js` → http://localhost:8544.

## Campaign canon (source of truth)
- Wiki: https://princexizor.ddns.net — Quartz site; every page's raw content is in
  `/static/contentIndex.json`. The Leaflet world-map config (with marker pixel coords)
  is embedded in the `/Map-of-the-Wide-World` page HTML.
- Atlas: `PatrinorModern.png` (4390×2188) in iCloud
  `Documents/DnD (Do Not Disturb)/Allhammers_PlayerPacket/Maps and Visual Aids/Maps/`.
  Wiki Leaflet markers use lat = pixels from the BOTTOM edge, long = pixels from left.
  CARTOGRAPHIC KEY (user-confirmed): DOTTED lines = major roadways; SOLID black lines
  = rivers. Ring-dots ○ = settlements (◉ double-ring = major city, Māgosh-class — 15 on the map); dark discs with
  numerals = city-chart legend badges.
- Fixed facts: pantheon = the nine **Kembar** (Thobrauk, Arbezmara, Hesphek, Doremil,
  Kurūgan, Bēlkar, Mālgal, Laegos, + the unworshipped Mad One); years counted
  **After the Binding**, campaign present = **1374 A.B.**; party is in **Epēshu, the
  Marble City** (Leponnia); old capital **Lepon** sacked 745 A.B. (ruins); the gas giant
  **Tamar** causes a daily "dark hour" eclipse. Lamor and Pēshunor are REGIONS, not towns.
- Default seed `epeshu` loads the Leponnia realm through `window.CUSTOM_MAP_DATA`
  (see `buildEpeshuMapData()`); the wiki atlas is authoritative for its geography.
- Language: the DM's Classical Patrinaic dictionary (PolyGlot save) lives in
  `lexicon/PatrinaicRevamp.pgd`; `tools/pgd2lexicon.js` extracts `lexicon/patrinaic.json`
  (full lexicon + etymology links) and, with `--emit-js`, the curated
  `PATRINAIC_ROOTS`/`PATRINAIC_SUFS` block embedded in `index.html` (regenerate, don't
  hand-edit). Procedural place names compose real roots + attested affixes; reserved
  canon words (e.g. Nīmlad 'earth') are excluded in the tool.

## Hard rules
- **Determinism**: world gen is a pure function of the seed. Generation/sim code uses
  the seeded streams (`W.rng.gen`, `W.rng.hist`, or the `R` threaded through gen
  functions) — never `Math.random()`/`Date.now()` there. Same seed ⇒ identical world.
- Single file, no frameworks, terse vanilla style; comments only for constraints the
  code can't express.
- New player-facing prose matches the chronicle voice (bronze-age Nīmlad, Kembar);
  never Christian-medieval vocabulary (saint/abbey/priest/baron/etc.).

## Verification
- Syntax: extract inline `<script>` blocks and `new Function()` them —
  `node -e 'const fs=require("fs");const s=fs.readFileSync("index.html","utf8");const re=/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g;let m,n=0;while(m=re.exec(s)){n++;try{new Function(m[1])}catch(e){console.error("block "+n+": "+e.message);process.exit(1)}}console.log("OK "+n)'`
- Browser smoke: load `http://localhost:8544/?v=<fresh-int>#s=epeshu` AND a procedural
  seed; wait for `window.ANNALS.ready`; console must stay error-free;
  `ANNALS.simDays(400)` as a sim smoke. Debug API: `ANNALS.stats()`, `.world`,
  `.simDays(n)`, `.step(n)`, `.tod(f)`, `.goto/.gotoSettlement`, `.seed(s)`,
  `.fate(name,x,z)`, `.act(name)`.

## Versioning & release workflow (SemVer 2.0.0)
- All releases are prereleases for now: `X.Y.Z-alpha.N` (bump `N` for re-cuts of the
  same scope; bump minor for feature milestones while pre-1.0).
- **During development**: make small logical commits as work lands (never commit
  mid-edit states of `index.html` while a delegation workflow is writing to it).
- **Cutting a version**: squash the WIP commits since the last release into ONE
  release commit titled `vX.Y.Z-alpha.N: <summary>`, update `VERSION` + `CHANGELOG.md`
  in that commit, tag it `vX.Y.Z-alpha.N`, then **push** to `origin master`
  (`git push --follow-tags`). Only push at version cuts.
- History: one commit per release on master (plus the base commits). `origin` is the
  owner's fork; `upstream` (emollick) is never pushed.
- **Hotfix exception**: if urgent commits were pushed mid-cycle (user-facing data
  fixes), the next cut's squash rewrites pushed history — push it with
  `--force-with-lease` (solo fork, content-preserving) or squash only the unpushed
  tail. Never leave the cut half-pushed.

## Process
- Plan with the core model (specs with line anchors + acceptance criteria in the
  session scratchpad), delegate implementation to opus/sonnet subagents/workflows
  (sequential stages when editing `index.html` — it's one file), verify in-browser
  afterward. Agents must not run git commands; commits/releases are done centrally.

## Deployment targets (planned)
- `sim.princexizor.ddns.net` — this sim as the campaign's living-world window
  (party presence, trade routes, unfolding affairs).
- `maps.princexizor.ddns.net` — Leaflet interactive atlas over `PatrinorModern.png`
  (tiles, wiki markers/links, region boundaries, player "reviews" sourced from
  session logs). Static bundle lives in `maps-site/` once built.
