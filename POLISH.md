# Polish backlog — the meshed world and both sites

Worked by scheduled polish runs: each run takes the TOP unchecked item only, implements
it per `.claude/CLAUDE.md` process (delegate substantive edits to an opus agent, verify
in-browser or via the CDP fallback, zero console errors), checks it off with a one-line
result note, adds any newly discovered gaps to the bottom, cuts a patch release
(`vX.Y.Z-alpha.N+1`), and pushes (auto-deploys the Pages demo). One item per run —
resist scope creep. If another workflow holds the target file, take the next
non-conflicting item instead.

## Queue

- [ ] **Traced road network (USER FLAG)** — extract the atlas's dotted lines (canon:
  dotted = major roadways, solid black = rivers) into splines: render as the true
  road layer, snap the named ways to them, and feed approach bearings. Lab groundwork
  banked in scratchpad: road_dots.npy (856 solid-dot candidates), traced-roads-v3.json
  (41 partial chains), roads-overlay-v3.png. LEARNINGS: text i-dots/periods chain like
  roads (mask text components first — implemented, works); dots on hatched realm
  tints merge with the stripes and vanish (needs local contrast normalization or
  matched filtering per-direction before component detection); chain radius 26/42 with
  direction coherence ≥0.55 works where dots survive. ALSO per the same canon: the
  "District borders" layer traced dotted lines as boundaries — they are ROADS
  (relabel/retire the layer when the network ships), and any way-trace that followed a
  SOLID line was following a river (audit the East-West Road trace).

### Filigree for the Table (USER REQUEST): the table map in four jobs, strictly in order

Owner's brief `docs/research/filigree-for-the-table.pdf`; operator's guide (invocation, args, outputs,
model/effort pairings, smoke recipe, owner rulings) `docs/filigree/README.md`. Each job is ONE saved
workflow, run as its own polish run in a fresh session; every output and gate record lands in
`docs/filigree/` (never the scratchpad). A job's preflight refuses to start unless the previous job's gate
file says `"pass": true` ("do not let planning start before the density bible exists"); every gate is
scored by the script from fixed fixtures, never by taste ("do not let review become a vibe check"). Use the
returned `polish_note` as the result note, `polish_inserts` as new items, `changelog_line` in the release.
Queue rules for these items (reason codes, where inserted items go, releases, the on-return table): `docs/filigree/README.md` §1.

- [ ] **Filigree 1 · Research → density bible (USER REQUEST)** — inventory what plate one bothers to name
  (peak, height, homestead, reserve, river fork, coast road) against what plates two and three delete; walk
  the Pēshunor north coast once (three fixed bands of the sheet-one box) and one fixed Epēshu quarter in
  Azlen's grain (block, park void, arterial, fog wash, contour hill); carry the Swiss stack into fiction
  (old survey, every structure, caravan halts, blazed paths, muster days, shut ways); map each class to what
  the atlas and sim already hold (the `EPESHU_HF` relief window, era sheets, Contents plates, POI pool, city
  generator) or to a named build need. A density bible, not a map.
  - Input: brief plates 1–3 (PDF pp.2–4), the Swiss layer list (pp.4–5), Leponnia
    (`docs/filigree/research-dossier.md`, `docs/filigree/todo-inputs.json`), `maps-site` tiles and data,
    the sim heightfield `EPESHU_HF`.
  - Output: `docs/filigree/density-bible.{md,json}`; per-question evidence `docs/filigree/research/`;
    fixture crops `docs/filigree/gates/hex/F01–F12.jpg` + `gates/hexes.json`; the read-only probe
    `tools/filigree-dem.js`; gate record `docs/filigree/gates/1-research.json`; also `gates/1-hex-answers.json`, `state/1-research.json`
    (full list: docs/filigree/README.md §4).
  - Done when (blank-hex gate): two blind appliers on different models (sonnet/high, opus/high), holding
    only the bible and the crops of the 12 fixed z7 hexes F01–F12, each classify every hex and name six
    bible classes as instances on it whose source refs resolve (DEM, data file, print pixel, mint key or sim anchor,
    inside the hex): class agreement ≥5/6 on ≥10 of 12 hexes and ≥4/6 on all 12; ≥5 of 6 instances
    resolve per applier per hex; zero "bible silent"; the brief + v2 checklist 27/27; zero banned
    vocabulary; at most 2 follow-up rounds, else leave unchecked with the gap list (the returned
    `polish_inserts`, placed directly above Filigree 2). The polish run checks the box only when the returned
    `pass` is `true`.
  - Run, in a fresh session: `Workflow({name:'filigree-1-research', args:{date:'<today, YYYY-MM-DD, from the
    session environment>'}})`; if the name does not resolve, use `scriptPath:'/home/user/annals-kingdom/.claude/workflows/filigree-1-research.js'`
    (absolute path) instead of `name`. Optional first step: the same call with `mode:'plan'` returns the agent
    schedule (expect `pass:false, reason:'plan'`); a plan run is not a polish result (no note, no release, no box).
    If the schedule totals more than about 215 agents, stop and note it rather than running. A plan-mode
    preflight failure is the same failure as in a full run. On a rerun after a partial failure, keep the default
    `resume:true`; the frozen `gates/hexes.json` and `gates/hex/*.jpg` are skipped, never regenerated.
  - Blocked by: nothing (so `reason:'blocked'` never fires here).
  - Prerequisites: the delivery commit (scripts, README, dossier, todo-inputs, rulings, design docs) is
    already in the checkout. Docs + a read-only probe tool; never edits `index.html` or `maps-site/index.html`. If the dotted
    "Traced road network" data file is missing or unloaded, that is a q17 finding, not a preflight failure.

- [ ] **Filigree 2 · Planning → sheet spec (USER REQUEST)** — from the bible alone: one coast, one river
  town, one painted city (default Pēshunor north coast / Aldorūs / Epēshu unless a challenger refutes
  them); label ranks per sheet (country / region / valley / city) on the existing reveal tiers (peaks and
  heights always, homesteads as dots, reserves as a green wash, only the river town gets a shield); the
  city rule (texture over type, fog as weather not as art); the overlay order locked (old survey under the
  live sheet, shut ways and muster days on top, swappable between sessions); the palette (bone paper, rust
  coast road, ocher arterials, rose-brown blocks, wet-blue water); the test contracts (hook, capture
  harness, gate views); build units in slices A ground / B ink / C city / D stack.
  - Input: `docs/filigree/density-bible.{md,json}` and the region.
  - Output: `docs/filigree/sheet-spec.{md,json}` (+ section drafts `spec/`, base crops
    `spec/assets/`); frozen probes `gates/2-probes.json`; gate views `gates/views.json`; gate record
    `gates/2-plan.json`; also `cold/`, `state/2-plan.json` (full list: docs/filigree/README.md §4).
  - Done when (cold-cartographer gate): two drafters on different models that may read ONLY
    `sheet-spec.{md,json}` + the base crops answer the probes frozen before the spec existed at ≥90%
    each, and draw sheet one (the region sheet over the north coast) as SVG whose layers follow the
    spec's paint order exactly, with every must class, no forbidden class, palette hexes only and exactly
    one shield at the river town; zero spec-silent decisions; zero blocking divergences between the two
    drafts; `sheet-spec.md` names no source post outside `## Provenance`; every bible must-rule traces to
    a spec rule and every spec rule to a build unit with machine-checkable acceptance. At most 2 fix rounds.
  - Run: `Workflow({name:'filigree-2-plan', args:{date:'YYYY-MM-DD'}})`.
  - Blocked by: Filigree 1 (preflight refuses by throwing an Error naming the gate, which the run treats as blocked; needs `gates/1-research.json` passed and the bible is
    unchanged since).
  - Prerequisites: owner glance at rulings R1, R5, R6, R7, R9, R18 (defaults apply otherwise). Docs-only.

- [ ] **Notch safe-areas** — add viewport-fit=cover + env(safe-area-inset-*) padding
  on the header/dock so notched phones in landscape don't clip controls.
- [ ] **Trackpad gesture feel** — after real-finger feedback: tune the sim's pan gain
  and the atlas handler's pinch sensitivity so both apps feel identical.
- [ ] **Region-chart zoom-through** — evaluate footprint-anchoring the REGION MapArt
  (Rhusagos, Relkor…) at mid zooms the way cities anchor at street zooms; keep modal
  where the geometry doesn't fit.
- [ ] **Uncharted-band softening** — the parchment grain pops in abruptly near z6.8 in
  open country; ease it with the same opacity ramp the base uses.
- [ ] **Data fetch cache-busting** — append the app VERSION to data/*.json fetch URLs
  so local demos never show stale cards after a data edit (Pages ETags already handle
  the deployed site).
- [ ] **Tier-hidden markers intercept clicks** — invisible (tier-faded) route waypoints
  still capture pointer events and can steal clicks from markers beneath them
  (pre-existing Leaflet pane quirk): set pointer-events none on faded panes.
- [ ] **Sim ↔ atlas continuity** — matching deep-link vocabulary both ways
  (sim `#goto=` ↔ atlas `#chart=`), so cross-links can land on the same place.

- [ ] **Census second pass — orphan ○ dots & unmarkered towns** — the snapping lab
  exposed ~28 strong unclaimed ring-dots incl. printed towns with no marker at all
  (Parli, Mūmakon, Ilongazoro, Ūgdon, Kroton, Tōron; Tasta and Nhandar visible bare
  by Gizalīs) and one marker whose label is unfindable at its coords (Pish — likely a
  mis-transcription in that dense cluster). Transcribe the orphans' labels, add
  markers, resolve Pish. The ◉ major-city sweep is DONE (15 found, 10 added
  v0.9.12); only ○ towns remain. Artifacts: lab_orphans.json, lab_assign.json,
  lab_ncc_r1.npy in the session scratchpad. Consider whether ◉ majors should reveal
  a tier earlier than lesser towns.

### Filigree for the Table (cont.): build and review

- [ ] **Filigree 3 · Implementation → the table map (USER REQUEST, MULTI-RUN)** — build
  `sheet-spec.json`'s units in paint order (relief first, contours tight enough to read as fingerprints,
  water, the rust coast road, green reserves, homestead dots, names and heights, then the city grain and
  fog washes last) with the overlays as separate sheets (old survey, structures, caravan halts, blazed
  paths, muster days, shut ways); never generalize a ridge to save ink; mint a Patrinaic name for any
  unnamed knoll (deterministic, `prov:'invented'`, listed for the owner). Each run builds up to 8 ready
  units of the current slice (A ground → B ink → C city → D stack) under per-file locks and runs that
  slice's gate when the slice is complete; everything ships behind the default-off table-map toggle.
  Leave unchecked between runs with the returned note (`slice X: n/m units …`); check off only when the
  workflow returns `check_off: true`.
  - Input: `docs/filigree/sheet-spec.json` (units, checks, contracts) + `gates/views.json`,
    `gates/hexes.json`.
  - Output: the table map in `maps-site/` (FILIGREE block in `maps-site/index.html`, baked relief,
    `filigree-*.json`, `rivers.json`, notices sample), tools `tools/filigree-*.js` + `tools/mint-names.js`,
    regenerated gazetteer, `docs/filigree/names-for-owner.md`, per-unit ledger
    `docs/filigree/state/3-build/`, slice gates `gates/3-build-{A,B,C,D}.json`, final `gates/3-build.json`; also `gates/3-handtest-questions.json`, `state/3-build.json`, `tools/filigree-handq.js`
    (full list: docs/filigree/README.md §4).
  - Done when (hand test, inside the slice B gate and again in the final slice D gate): with the
    settlement covered by an opaque disc (and every other town in view disc'd) on 3 fixed views, two
    navigators on different models that see only the screenshot answer ≥80% of frozen, data-computed route
    questions by ridge names, read ≥70% of the visible landform labels, see ≥6 named heights outside the
    mask, and cannot name the covered town; plus ≥10/12 fixture hexes show their six and none below 4, overlay toggles
    refetch zero base tiles, the toggle off leaves no filigree pane, generators are byte-identical on
    rerun, and the smoke is clean (sim `#s=epeshu` + a procedural seed with `simDays(400)`, atlas, zero
    console errors).
  - Run: `Workflow({name:'filigree-3-build', args:{date:'YYYY-MM-DD'}})`.
  - Blocked by: Filigree 2 (`gates/2-plan.json` pass, spec unchanged); "Traced road network" and "Census
    second pass" checked (R11). The owner may pass `overridePrereqs:true` to build slice A only.
  - Prerequisites: holds `maps-site/index.html` while running. Data gaps it finds go directly above this
    item.

- [ ] **Filigree 4 · Review → punch list (USER REQUEST)** — review the finished sheets against plate one
  (not a normal VTT map), the city against Azlen (painted, or a UI?), the stack (pull the old survey, the
  shut ways and the muster notice without a redraw), every name read aloud (unsayable → cut or rewritten at
  the generator), the holes where the build flinched and generalized, plus the v2 lenses (navigator,
  data truth, appear effect, real colour, cramped on phones). Thirteen single-lens finders; every finding
  must carry reproducible evidence and survive reproduce + refute + severity.
  - Input: the finished sheets (`gates/3-build.json` pass), plates 1–3, the Swiss layer list, the
    density bible, the sheet spec.
  - Output: `docs/filigree/punch-list.{md,json}` (with "Why the sparse map is worse" and "Where we
    flinched"), verified findings `docs/filigree/findings/`, capture `docs/filigree/review-c<k>/`, gate
    record `gates/4-review-c<k>.json`; also `state/4-review.json`, `review-c<k>/cited/` (full list: docs/filigree/README.md §4).
  - Done when (angry-sparse gate): on every open-country view at least 2 of 3 blind judges
    (opus/sonnet/opus, fixed A/B order) prefer the dense sheet and each lists ≥3 omissions the DOM confirms
    (named dense, absent with the toggle off); dense counts meet the bible's per-view targets and the
    sparse view carries ≤ a third of the dense names; ≥10/12 fixtures show their six and none below 4; zero unsayable names;
    overlay pulls refetch zero base tiles; zero appear-effect pop-ins; zero surviving blocker or major.
  - Run: `Workflow({name:'filigree-4-review', args:{date:'YYYY-MM-DD'}})`.
  - Blocked by: Filigree 3 (`gates/3-build.json` pass; a preflight refusal is a thrown Error, treated as blocked).
  - Prerequisites: none. Docs-only. On fail the returned punch items go DIRECTLY ABOVE this entry and this
    item stays unchecked for a re-review (at most 2 cycles, then the owner decides; R16). On pass the owner
    may flip the table map on by default (R18).

## Done

- [x] **Pins as the cartographer's own idiom (USER FLAG)** — census pins visible
  again: tan disc with black ink border for towns, larger disc with inner black dot
  for ◉ major cities; they grow reactively as the hand nears (rAF proximity, 140px
  falloff) and the border turns gold under the cursor. A ◉ template sweep (from
  Hordon's hand-measured glyph) found all 15 double-ring majors: ten had NO marker
  and were added (Alensis City, Sepos, Līm Haub, Tamaron, Bōlkhar, Gizalīs, Ākat,
  Kurūgnon, Nub-Nefer, Men-Nehet — names read from the print), five known capitals
  snapped exactly to their printed ◉ (Epēshu, Summarch, Penthelon, Hordon, Cyrikon).
  (v0.9.12-alpha.1)

- [x] **Pins on the printed ○'s (USER FLAG)** — matched-glyph NCC detection over the
  whole atlas; all 121 settlement markers audited one-to-one against detected dots:
  110 snapped exact (35 were off by 5–69px — census transcription drift), Hordon's
  double-ring ◉ measured by hand, 5 bad auto-matches (letter-'o'/neighbour thefts)
  caught and rejected in the crop audit. Census pins are now print-riding halos
  (Epēshu-badge idiom): the print carries the town, hover reveals a bronze ring;
  edge-clamped pins stay visible; majors untouched. (v0.9.11-alpha.1)

(check items off above and move them here with a one-line result + version)

- [x] **Layers panel intrusiveness (USER FLAG) + era control** — the 16-row layers
  panel now collapses to the standard icon on all sizes (expands on hover/tap), and
  the era panel is a compact current-age chip that expands on tap and re-folds after
  a pick. (v0.9.9-alpha.1)

- [x] **Generated POI variety** — oddity pool widened to eight (springs, wash-stones,
  tithe-yards, beacon posts, plague-stones…) and towns gain one civic institution
  (gallows hill, horse fair, tithe-barn, muster ground, counting-house); all ✶,
  ruin branch untouched. (v0.9.8-alpha.1)

- [x] **Lake biome** — Penthelon's footprint anchor was floating IN the Five Fingers
  (wiki marker position; 14% land); snapped to the charted shore, biome 'lake' set
  (canon), and lake styling added: fishing-stake rows in the shallows joining the
  Lakemen stilt-piers. The mask supplies the true lakeshore. (v0.9.7-alpha.1)

- [x] **Riverside cities** — seeded winding rivers rasterized into the shared water
  field (lanes, buildings, fields, and rubble all stop at the banks automatically);
  bridges where primaries cross; market/gates/temple nudged to dry ground; the
  Kolens Connection placed on its riverbank; Ion Ephel's Tungril hugs the ruin
  toward the sea. Controls byte-identical. (v0.9.6-alpha.1)

- [x] **Crossfade palette match** — verified already delivered by the terrain-melding
  run (§c surround tint toward the sampled atlas hue, in code at the vignette block);
  no further change needed. (closed in run 9)
- [x] **Overlay pre-warm** — approaching within six footprints below the descend
  threshold now pre-bakes the city plan via requestIdleCallback; verified Kanae
  pre-registered at z6.0 with distant cities untouched and instant overlay on
  descent. (v0.9.5-alpha.1)

- [x] **Addressable alleys** — lane graphs with T-junctions and two widths replace the
  jittered infill; every building fronts a walkable lane (gate → street → alley →
  door); ruins byte-identical, determinism proven at both async stages. (v0.9.4-alpha.1)
- [x] **Line tap targets + chart labels (USER FLAG)** — 16px invisible hit-lines over
  ways and lanes (click verified opening the Sun Road card); chart cartouches read
  their typed label (the Seat says BUILDING PLAN, not CITY CHART). Shipped alongside
  the Sun Road canon re-trace and the chart curation. (v0.9.4-alpha.1)

- [x] **Census follow-ups** — wide-crop re-read of the 13 quarantined names recovered
  4 towns (Netho, Nīs Garnata, Ūmak-nūs-Ion, Nhandar Khezīn; Ītor Hāspira was already
  in) and 7 confirmed non-towns; Clickerhall snapped 40px to its true printed dot;
  full-atlas template match proved the three known double-ring glyphs are the only
  ones — an honest negative. (v0.9.2-alpha.1)

- [x] **All named cities anchored (USER FLAG)** — 306 detected dots transcribed by a
  7-agent fan-out (167 towns high-confidence, 126 false positives skipped, 13 low-
  confidence quarantined); all integrated with trace provenance, four approximate
  anchors snapped to their true printed dots, "Lesser settlements" tier-C sub-toggle
  keeps the continental view clean; Hemdok Laego descends onto a mask-true plan.
  (v0.9.0-alpha.1)

- [x] **Epēshu roundel doubling** — all 19 POI coords corrected to the true printed
  badge centers (blob detection for 9, contact-sheet measurement for 10 after an
  int16 luminance overflow and tree-blob false matches were run down); live markers
  are now invisible interactive halos over the print, revealed on hover. Deep-link
  click targets land exactly. (v0.8.5-alpha.1)

- [x] **Cultural & historical texture (USER QUESTION → PASS)** — 28 cities now carry
  biome/condition/hinterland with per-claim provenance (Hordon arid per canon's
  "semi-arid island"; Ion Ephel ruin at the Tungril's mouth; 14 lesser Leponnian
  towns faded under the post-Sack decline, ✶-flagged); generator renders frost/arid/
  wooded grounds, gap-toothed faded towns with wall breaches, Lakemen stilt-piers,
  Goblin-Dwarf burrow-holds, Hord longhouse ruins, port-leaning hinterland roads;
  three new canon anchors (Hordon, Clickerhall, Ion Ephel); default-trait cities
  byte-identical. (v0.8.4-alpha.1)

- [x] **Route continuity (USER FLAG)** — per-city approach bearings from every
  world polyline: gates open exactly where roads arrive (Tamaron's Sun-Road gate
  points at Epēshu within 3.6°), quays bias toward their sea lanes on the true
  waterline, street-tier stubs carry the arrival into the plan; control cities
  bit-identical to baseline; Drāmūz honestly sea-only (no land route in data).
  (v0.8.3-alpha.1)

- [x] **Terrain continuity (USER FLAG)** — generated plans now derive land/water from
  the atlas pixels beneath them (border-connected flood drops label ink; Kardunash's
  coast continues on the true west; Sokundo follows the drawn strait over its authored
  bearing); parchment wash under every plan kills the giant-label fight; seeded
  irregular vignette ends the hard square edge. Deterministic, zero errors.
  (v0.8.2-alpha.1)

- [x] **Off-frame points visible (USER FLAG)** — clampToFrame at every render site;
  4 off-chart markers now edge-pinned with direction chevrons + "beyond the charted …"
  cards; journey lands wps 3–5 fully in-frame; BONUS: fixed a pre-existing crSpline
  Barry–Goldman denominator bug that sprayed leg tails ±40k px. (v0.8.1-alpha.1)
