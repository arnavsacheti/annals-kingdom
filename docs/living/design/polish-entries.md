# POLISH.md entries for the living chart (exact markdown, placement by title, delivery order)

Date 2026-10-05. Insertions only: every existing POLISH.md line stays byte-identical, no checkbox changes, and each
anchor below is found exactly once (the POLISH unit verifies both: the original lines are an in-order subsequence of
the new file and the diff has only `+` lines). Every line of every block is at most 100 characters. Four insertions:

| # | block | placement (by title) |
|---|---|---|
| P1 | "Atlas reduced motion for its own animations (dashmove, copulse)" | directly above the heading `### Filigree for the Table (cont.) and the street research: the sheet spec, then the street bible`: after the last line of the "Mobile 15 · Real-device pass (OWNER-RUN)" entry (`    street-drift green; Street 2 plan preview reads the overrides with no baked check loosened.`) and before the blank line that precedes the heading |
| P2 | "Living later · the sim dragon is not Lugal (OWNER-GATED, LC17)" | directly below the last line of "Mobile later · one-finger pan at altitude (OWNER-GATED)" (`  real-finger verdict in Mobile 15. Leave unchecked until the owner says go.`) and above the blank line that precedes "Street battle sheet (OWNER-GATED, ST10)" |
| P3 | the track block `### The living chart (USER REQUEST): …` with Living 0-4, the sea mask, Living 3z/4z and the later items | directly above `## Done`: after the last line of "Street battle sheet (OWNER-GATED, ST10)" (the line `    declared hook lines change; zero console errors on `#s=epeshu` and `#s=tamar1374`.`) and its blank line; the block ends with one blank line before `## Done` |
| P4 | none in `docs/filigree/todo-inputs.json` | the shape adds no Filigree input (`filigree-input.md`) |

Why these places:
- **P1** edits existing atlas animation, so it cannot ride inside the living track (LC1: with `living` absent nothing
  changes) and must not land inside an open Mobile lane (each lane review scores against its first unit's reference,
  and a sim-lane mobile-build snapshot flags any `maps-site/` write). Blocked by Mobile 9 and Mobile 14, it is reached
  right after the lanes and before Filigree 3 takes the atlas; Filigree 2 is docs-only and plans against either state.
  The research named it "the reduced-motion CSS fix after Mobile 9"; Mobile 14 is added because of the sim-lane
  whole-tree snapshot. It also never runs beside a Street 3, Street 4 or Street punch run: Street 3 digests
  `maps-site/**` at the start and end of every run (GS.8, `street-3-build.js` 1106-1111) and fails on any change.
- **P2** edits `index.html` world state, so it obeys the street hold and waits for Street 4, beside the other
  after-Street-4 sim items. It changes the canon realm's fingerprint, so it is never a default.
- **P3** is the newest request, so it goes last and the owner's earlier Filigree, Mobile and Street orders stand.
  Living 1 is blocked by Filigree 4 anyway, the zoom scope by Street 4. The sea mask (a real prerequisite: Filigree 3's
  mask is DEM-window-only, density-bible B-03) and the river trace live inside the block, so no `maps-site/` writer of
  this track can run inside a Mobile lane or beside Filigree 3.

## P1. Directly above `### Filigree for the Table (cont.) and the street research: …`

```markdown
- [ ] **Atlas reduced motion for its own animations (dashmove, copulse)** — the atlas's two CSS
  animations ignore reduced motion: `.route-line.playing` loops `dashmove` for as long as a journey
  is on, and `.glyph.copulse` pulses a new origin. Add one `@media (prefers-reduced-motion:
  reduce)` block to `maps-site/index.html` beside the existing rules that sets `animation: none` on
  both (the `@keyframes dashmove` and `@keyframes copulse` lines stay untouched), and let the
  playing route line follow the atlas's one motion state: `setRoutePlaying` adds the `playing`
  class only while `jReduced()` is false, and the `#jbar-reduce` change handler re-applies it
  (WCAG 2.2.2 and 2.3.3). Re-anchor by pattern, never by line number; if the Mobile atlas lane
  moved the journey bar (A-U8 puts journeys in the table drawer), apply the handler change where
  `getElementById('jbar-reduce')` now is. No second `matchMedia` and no new state: the living
  chart's still-chart control later writes the same `jrn.forceReduced` (LC2). A plain polish
  item, delegated per `.claude/CLAUDE.md` (sonnet/medium: CSS plus two class lines); not a living
  job.
  - Done when (scored by commands; T is a CDN dir built per `docs/living/README.md` §8.6):
    before the edit `node tools/mobile-capture.js --atlas --profiles
    iphone13,pixel7,landscape,desktop,desktop2x --unit LRM-before --server spawn --cdn-dir T
    --out docs/living/captures/LRM-before.json --shots-dir docs/living/shots/LRM-before`, after
    it the same with `--unit LRM` into `captures/LRM.json` and `shots/LRM`; the accept file
    `docs/living/accept/LRM.json` is the template of `docs/living/README.md` §5.9 copied
    verbatim (UG4 handled as that section says), `node tools/mobile-capture.js --lint-accept
    docs/living/accept/LRM.json` exits 0, and `node tools/mobile-capture.js --accept
    docs/living/accept/LRM.json --capture docs/living/captures/LRM.json --ref
    LRM-before=docs/living/captures/LRM-before.json` exits 0 with `"baseline": "LRM-before"`
    (UG1-UG3, UG6-UG8, UG10 with declared growth ≤ 160 B and +0 requests, UG11; UG5 and UG9
    waived with the template's reasons; only the page-byte keys the template declares may move,
    and shots within the mobile 0.005 diff tolerance: they are taken under reduced motion with
    animations off); a throwaway node
    script (in `mktemp -d`, never committed) that requires `tools/mobile-capture.js`'s exported
    `startServer`, `launch`, `resolveCdn` and `openPage` opens the atlas at 1366x768 with the
    hash `#journey=t0.5000` (the journey resumes paused at its midpoint), clicks `#jbar-play`,
    adds `copulse` to one `.mk.t-origin .glyph`, and reads `getComputedStyle(…).animationName`:
    `none` for `.route-line.playing` and for that glyph under emulated `reduce`; `dashmove`
    without it; `none` again with `#jbar-reduce` checked; `grep -c matchMedia
    maps-site/index.html` and the atlas clock tokens unchanged; each of
    `getElementById('jbar-reduce')`, `forceReduced`, `jReduceMq`, `function jReduced(`,
    `@keyframes dashmove` and `@keyframes copulse` still occurs in `maps-site/index.html` (the
    living `ANCHORS`); when `maps-site/data/offline-manifest.json` exists it is regenerated with
    `node tools/build-offline-manifest.js --atlas` and `--atlas --check` exits 0; zero console
    errors. Re-baselines: none edited here. `docs/mobile/final.json` (if already taken) is
    re-measured only by the mobile track's own re-run; Filigree 3 and Street 3 take their
    references at the start of their own runs (Street 3's GS.8 start digest; Street 1's
    `baseline.json` keys on the `index.html` sha, which this item never changes), so they pick
    up the post-edit atlas with no action.
  - Blocked by: Mobile 9 and Mobile 14 checked (an atlas edit inside an open lane breaks that lane
    review's reference, and a live sim-lane snapshot flags any `maps-site/` write).
  - Prerequisites: no mobile-build or mobile-review run live; never beside a Filigree 3 run (if
    Filigree 3 has started, this waits until "Filigree 4 · Review → punch list" is checked);
    never while a Street 3, Street 4 or Street punch run is live (Street 3 digests `maps-site/**`
    per run, GS.8: run it before Street 3 starts or between Street 3 runs, never beside one).
    Writes only `maps-site/index.html`, the manifest when present, and `docs/living/{accept,
    captures}/LRM*`.
```

## P2. Directly below "Mobile later · one-finger pan at altitude (OWNER-GATED)"

```markdown
- [ ] **Living later · the sim dragon is not Lugal (OWNER-GATED, LC17)** — in `#s=epeshu` the sim
  wakes a seeded dragon (`W.dragon.name` drawn from six names, its lair `W.peak`, Myth on by
  default, so `tickDragon` runs), while canon has one dragon, Lugal, gone into the Fell Mountains
  after the Last War, his neutrality brokered by the party (`maps-site/data/party-route.json`,
  `reviews.json`). The owner rules one of: (a) Myth off by default in the canon realm; (b) the
  canon realm shows no dragon (Myth off or the dragon dead) and the chronicle names Lugal as gone
  north to the Fell Mountains (atlas 782, 8; outside the sim's window, so he cannot lair there);
  (c) leave it, with a chronicle line that this wyrm is not Lugal. The atlas never names the
  sim's dragon Lugal (LC4). Keep the `W.dragon = { name: pick(dR, …)` statement and its
  `pick(dR, …)` draw, so the `W.rng.hist` cursor and every later history draw are unchanged;
  apply the ruling after it (a name or Myth default set afterwards). A plain polish item,
  delegated per `.claude/CLAUDE.md`.
  - Done when (scored by commands): the ruling is quoted as an LC17 override in
    `docs/living/rulings.json`; the CLAUDE.md syntax one-liner passes; `simDays(400)` on
    `#s=tamar1374` is unchanged; `#s=epeshu` changes exactly as ruled and is identical on a double
    run; the literal `W.dragon = ` still sits on one line of `index.html` and every flag-1 anchor
    of the eight filigree and street scripts resolves (`repo.anchors_missing` is `[]` in a `node
    tools/mobile-capture.js --sim --profiles desktop` capture written under `docs/living/`); the
    new epeshu fingerprint is written into the item's result note with the re-baseline it causes
    for each consumer (`docs/mobile/baseline.json` (B0), `docs/mobile/captures/R1.json`,
    `docs/mobile/final.json`, `docs/street/gates/baseline.json`,
    `maps-site/living/traffic.json`): those files are re-measured only by their own tracks'
    sanctioned re-runs, never edited here; `node tools/street-drift.js` exits 0; zero console
    errors on both seeds; zero banned vocabulary in new chronicle text.
  - Blocked by: an LC17 override naming (a), (b) or (c) (absent = blocked: leave unchecked, note
    "owner ruling LC17", take the next item); Street 4 passed and the street hold clear
    (`docs/street/README.md` §1.3); no mobile-build run live.
```

## P3. Directly above `## Done`

```markdown
### The living chart (USER REQUEST): motion and life on the atlas, four jobs, after the street view

The owner's ask (spoken, 2026-10-05): footprints along the travel routes, traffic on the ways and
the seas, moving creatures and water "rather than just a flat map", landmark exhibits, and a
"transitive" layer that adds detail when you zoom in. Research digest
`docs/research/living-chart.md`; operator's guide (protocol, invocation, args, outputs, gates,
model/effort pairings, smoke recipe, owner rulings LC1–LC17, what is copied from the filigree,
street and mobile packages and how drift is caught) `docs/living/README.md`. Each job is ONE saved
workflow, run as its own polish run in a fresh session; every output and gate record lands in
`docs/living/`. A job's preflight refuses to start unless the previous living gate says `"pass":
true`; every gate is scored by the script from fixed fixtures (frozen atlas views LV1–LV9 at fixed
presentation instants, the capture's virtual clock, `tools/mobile-capture.js` accept files), never
by taste. Motion is presentation only: one presentation clock from the rAF timestamp, keyed seeded
streams, zero added clock tokens, frozen under the capture's virtual clock; one reduced-motion
state and one visible "still chart" control stop all of it (WCAG 2.2.2). Everything ships
default-off behind `living=1`; with it absent the atlas is the table map byte for byte apart from
the declared hook lines (no row, no canvas, no listener). The 3D detail layer is the sim's street
view, reached by a zoom-through (H2z) into its frozen poster; WebGL in the atlas (H1) is an
owner-gated spike. This track never edits `index.html`, `docs/filigree/`, `docs/street/`,
`docs/mobile/` or any filigree, street or mobile script, tool, gate or ruling. No living job runs
while a Mobile item other than Mobile 15 is open or a mobile or street tool is running, and Living
3 also holds while the table map, a filigree fix or (for the zoom scope) the street view could be
touched; a held job returns `held`. Use the returned `polish_note`, `polish_inserts` (placed
directly above `polish_inserts_above`) and `changelog_line` as for the street items; queue rules
and reason codes: `docs/living/README.md` §1. While the owner's feature-branch note stands
(`docs/mobile/owner-answers.json` `notes.releases`), the central session commits each run's
paths without tagging or pushing; the returned `changelog_line` accumulates in `CHANGELOG.md`
and the cut happens at merge.

- [ ] **Living 0 · Install the living workflows (central)** — move the four staged scripts
  `docs/living/design/workflows/living-{1-research,2-plan,3-build,4-review}.js` byte for byte to
  `.claude/workflows/`. Executor: the central (owner) session, never a workflow agent (UG11); a
  polish run that reaches it in queue order hands it to the central session. From the repo root:
  `node tools/living-drift.js --staged` (exit 0); `node tools/living-drift.js --install-window`
  (`"open":true`); `cp docs/living/design/workflows/living-*.js .claude/workflows/`; `sha256sum`
  of each staged/installed pair equal; `rm docs/living/design/workflows/living-*.js`; `node
  tools/living-drift.js` (exit 0). Its own commit, `living: install the four living workflows
  (Living 0)`, absorbed by the next release cut; the result note names the four new
  `pipeline_sha` keys.
  - Done when (scored by commands): the window printed `"open":true` just before the copy; each
    installed sha256 equals its staged copy's and its entry in `docs/living/design/DELIVERED.json`;
    `node tools/living-drift.js` exits 0 on the installed location (L9: none left staged); `node
    tools/street-drift.js` exits 0; every `.claude/workflows/{filigree,street,mobile}-*.js` sha is
    unchanged; each living job's `mode:'plan'` preview returns `reason:'plan'` (an unmet chain or
    missing inputs show as `chain_ok:false`, never a throw).
  - Blocked by: Mobile 9 and Mobile 14 checked and no `Mobile 9 fix K` / `Mobile 14 fix K` item
    open (no mobile-build or mobile-review run can then follow, so no UG11 or `START_REF`
    exposure; Living 1 waits for Filigree 4 anyway). Earlier only through `--install-window
    --idle-confirmed`, passed by the central session after it has checked every open session for
    a running mobile-build or mobile-review Workflow (pgrep cannot see a run in its agent phases),
    and only while neither lane is closed. A lane unit is a `docs/mobile/units.json` unit whose
    `run` is Mobile 4-8, 5b or `Mobile 9 (fix K)` (atlas) or Mobile 10-13 or `Mobile 14 (fix K)`
    (sim); D1, D2, D6 and the other shared units are not lane units. Window closed: note its
    `why`, take the next item.
  - Prerequisites: the delivery commit is in the checkout: `docs/living/design/DELIVERED.json`
    exists and every path it lists hashes to its entry (`node tools/living-drift.js --staged`
    exits 0). After the install `docs/street/gates/baseline.json` and `docs/mobile/baseline.json`
    record an older `pipeline_sha`; their own tracks re-measure them, never edited here.
- [ ] **Living · the sheet-wide sea mask (tool)** — an offline, deterministic low-resolution
  land/water mask of the whole sheet, `tools/living-sea-mask.js` → `maps-site/living/sea-mask.png`
  (1 mask px per 8 atlas px, 549x274, top-origin), loaded only by the living chart under
  `living=1`. Filigree 3's land/water mask and `rivers.json` stop at the DEM window
  (density-bible B-03: "The sheets cover the window only"), so the sea shimmer outside the window
  has no other source; `washMake` and `sampleCityMask` are per-city and are never called or
  changed. Inside the window the mask must agree with the DEM, never replace Filigree's.
  - Done when (scored by `node tools/living-sea-mask.js --check`): two runs byte-identical;
    ≤ 32 KB; every `maps_markers.json` entry whose name ends in "Sea" reads water; every
    `city-anchors.json` settlement without `harbor:true` reads land within 1 mask px and every
    `harbor:true` anchor has water within ceil(`sea.distPx`/8)+1 mask px; inside the window
    [1060,1240]..[1860,2040] every z7 hex with `node tools/filigree-dem.js --bbox` land_frac 0 is
    ≥ 90% water and every hex with land_frac 1 is ≥ 90% land; filigree fixture F08 is ≥ 95% water;
    `maps-site/index.html` sha unchanged; when `maps-site/data/offline-manifest.json` exists it is
    regenerated (`node tools/build-offline-manifest.js --atlas`) and `--atlas --check` exits 0.
  - Blocked by: Filigree 4 passed (Filigree 3 no longer writes `maps-site/`); Mobile 9 and Mobile
    14 checked.
  - Prerequisites: never while a mobile-build, mobile-review, Filigree 3, Street 3, Street punch or
    Living 3 run is live (Street 3 digests `maps-site/**` per run, GS.8). Writes only the tool, the
    mask and the manifest. Delegated per `.claude/CLAUDE.md` (sonnet/high tool).
- [ ] **Living 1 · Research → living bible (USER REQUEST)** — measure and read what the motion
  must stand on: write the instrument (`tools/living-measure.js`, a thin extension that requires
  `tools/mobile-capture.js`'s exported server, browser, page and virtual-clock functions and never
  edits it); freeze nine atlas views LV1–LV9 on the finished table map (the whole chart, the
  Pēshunor north coast, Sepos to the White Sea, the far north, Epēshu at the city band and at the
  zoom-through threshold, the Fell Mountains, the White Sea in storm season, and open sea as the
  control) with the living-off reference `L0`; answer thirteen targeted questions q02–q14 (motion
  owners today, the one reduced-motion state, the host pane, route geometry, the sea mask, rivers,
  the sim traffic snapshot, the dark hour, canon per device, words, the street hand-off, bytes,
  the class map); then a living bible mapping the 21 devices and the owner's six asks to classes
  with their driving state (presentation clock, seeded function, snapshot, static), canon tier,
  band, zones, still frame and owner gate, reusing the filigree density bible's class ids. A bible,
  not an animation.
  - Input: `docs/living/research-dossier.md`, `docs/living/todo-inputs.json`,
    `docs/living/rulings.json`, `maps-site/` and `index.html` (read-only), the filigree density
    bible, sheet spec and gate views, `docs/street/gates/views.json` when present (read-only; when
    Street 1 has not run, q12 records "street frozen views absent", an allowed answer, and slice
    Z re-checks them).
  - Output: `docs/living/living-bible.{md,json}`; evidence `docs/living/research/q02–q14.json`; the
    instrument `tools/living-measure.js` and its toy fixtures `docs/living/fixtures/toy/`; frozen
    fixtures `docs/living/gates/views.json` + `gates/view/LV1–LV9.png`, `gates/view-data.json`,
    `gates/measure-keys.json` and the off reference `docs/living/captures/L0.json`; gate record
    `docs/living/gates/1-research.json`; also `gates/1-view-answers.json`, `state/1-research.json`
    (full list: `docs/living/README.md` §4).
  - Done when (still-frame gate): two blind appliers on different models (sonnet/high, opus/high),
    holding only the bible, the frozen views and stills, `L0`, `view-data.json` and the data files
    the bible cites, each name for every gate view LV1–LV8 the classes that move there and at
    least two that stay still, each with its driving state, canon tier, still frame and a source
    ref that resolves: each applier's moving set equals the set the script computes from the
    bible's own bands and zones on ≥7 of 8 views (Jaccard ≥0.75 on all); ≥95% of named classes
    carry the bible's state and tier; ≥90% of refs resolve per applier and no view below 75%;
    every moving class has a source feature in that view; canon tiers equal the research's table
    and every invented device is owner-gated and off; on LV9 nothing moves beyond the bible's
    sheet-wide classes; zero "bible silent"; checklist 27/27 (21 devices + 6 asks); no rule adds
    sim state, a pane, a clock token or WebGL; the instrument passes its self-test (a toy layer
    that breaks each rule fails), is byte-identical on a double run and its glyph hash moves when
    one keyed seed moves; zero banned vocabulary; at most 2 follow-up rounds, else leave unchecked
    with the returned `polish_inserts` (`Living gap — …`, directly above Living 2).
  - Run, in a fresh session: `Workflow({name:'living-1-research', args:{date:'<today, YYYY-MM-DD,
    from the session environment>', cdnDir:'<T>'}})`; if the name does not resolve, use
    `scriptPath:'/home/user/annals-kingdom/.claude/workflows/living-1-research.js'`. T: one
    `mktemp -d` dir per session holding `npm pack leaflet@1.9.4 three@0.128.0
    @fontsource/eb-garamond@5.3.0 @fontsource/lora@5.3.0 @fontsource/ibm-plex-mono@5.3.0
    @fontsource/im-fell-english@5.3.0` (npm works while the CDNs are blocked); without `cdnDir`
    each capture relay builds its own, and a resume never assumes T survived. Optional first
    step: the same call with `mode:'plan'` (not a polish result; an unmet chain shows as
    `chain_ok:false`); stop if `agents_bound` > 138, the value recorded in
    `docs/living/README.md` §11 (150 is the hard cap). A thrown `prelude drift: L…`, `anchor
    lost: …` or `missing inputs: …` is a run fault: no release, note it, fix per README §12 (never
    by editing a filigree, street or mobile file). On a rerun keep `resume:true`: frozen views are
    never re-frozen (`fixtures changed (moved: LVn, …); delete docs/living/gates/views.json and
    docs/living/gates/view/ to re-freeze`).
  - Blocked by: Filigree 4 (the latest `docs/filigree/gates/4-review-c<k>.json` a full unforced
    pass; otherwise the preflight throws `living research waits for the finished table map …`,
    treated as blocked); Living 0 checked; "Atlas reduced motion for its own animations" checked;
    "Traced road network" and "Sim ↔ atlas continuity" checked (both rewrite atlas data or the hash
    vocabulary the frozen views and `L0` stand on). No other unchecked atlas item gates it (the
    owner-gated "Mobile later · WebP rasters" and the older atlas backlog never block Living 1;
    its only waits are the chain above and the held conditions below, as README §10 states).
    **Held** (a returned `reason:'held'`: no release, take the next item) while a Mobile item other
    than Mobile 15 is open, "Mobile later · census pin names on phones (A12 part b)" or a filigree
    fix item is open, or a mobile or street tool is running. An owner-gated Mobile 5b holds every
    living job until the owner rules it; when it is the only hold left, the central session asks
    the owner once and notes the date.
  - Prerequisites: the sea mask item checked or not (q06 measures it or records its absence).
    Docs + the instrument; never edits `index.html`, `maps-site/**` or any `docs/` tree but
    `docs/living/`.
- [ ] **Living 2 · Planning → living spec (USER REQUEST)** — from the living bible alone: the
  presentation clock and determinism contract (rAF timestamp, dt clamp, keyed streams
  `lc:<class>:<id>:<k>`, zero clock tokens, frozen under the virtual clock); the still chart and
  the one motion state (LC2, LC3); the host (an existing pane, LC13), the lazy loader, the
  declared hook lines (the `setHash` keep of `living=1` among them) and their restore rule; the
  devices by slice (L0 instrument and hooks; L1 the still-chart control, the clock and the
  dark-hour dim; L2 footprints, a route drawing itself, caravans, ships, traffic weight, the
  living traffic snapshot and selection; L3 sea shimmer, storm tracks, birds, whales where placed,
  Lugal's still mark; Z the zoom-through and exhibits); budgets per device class; the layers row
  and every player-visible string; the accept template; per-slice checks; build units;
  prerequisites with their POLISH titles.
  - Input: `docs/living/living-bible.{md,json}`, `gates/views.json`, `gates/view-data.json`,
    `captures/L0.json`.
  - Output: `docs/living/living-spec.{md,json}` (+ section drafts `spec/`); probes
    `gates/2-probes.json` (frozen before the spec exists); gate record `gates/2-plan.json`; also
    `cold/`, `state/2-plan.json`.
  - Done when (cold-animator gate): two blind readers on different models (sonnet/high,
    opus/high) that may read ONLY `living-spec.{md,json}` answer the frozen probes at ≥90% each
    with zero schema-path guesses; every bible must-rule traces to a spec rule and every spec rule
    to a unit with machine-checkable acceptance; the unit DAG is acyclic with ≤8 units per slice
    and unit files only `maps-site/living.js`, `maps-site/living/**`, declared hook lines of
    `maps-site/index.html`, `tools/living-*.js` and `docs/living/{fixtures,accept}/**` (the
    first unit extends the instrument); every slice has a `/checks` list holding the mandatory
    off-identity, UG4 re-score, still-frame, moves, still-chart, stop, tokens, zoom-sync, appear,
    lazy-failure, bytes, voice, coexistence and phone-parity checks; every hook line is declared,
    marked `/*LC-HOOK*/`, replaces one whole line and holds no filigree or street anchor literal,
    and their raw growth is ≤ the LC14 cap; the accept template waives UG4 with the fixed reason;
    the hash param is `living` (ST18 grammar); caps within LC8, LC9 and LC14; no rise (LC10);
    invented devices absent unless overridden (LC4); zero banned vocabulary. At most 2 fix
    rounds.
  - Run: `Workflow({name:'living-2-plan', args:{date:'YYYY-MM-DD'}})`.
  - Blocked by: Living 1 (`docs/living/gates/1-research.json` pass, bible unchanged; the filigree
    density bible, sheet spec and the cited filigree and street rulings unchanged since Living 1;
    a thrown Error otherwise, treated as blocked). Held as Living 1 when a mobile item is open or
    a mobile or street tool runs.
  - Prerequisites: owner glance at LC1, LC4, LC5, LC6, LC7, LC11, LC14 (defaults apply
    otherwise). Docs-only. Data items it finds go directly above Living 3 as `Living data — …`.
- [ ] **Living 3 · Implementation → the living chart (USER REQUEST, MULTI-RUN)** — build
  `living-spec.json`'s units slice by slice (L0 instrument and hooks: the lazy
  `maps-site/living.js` loader, the declared hook lines, the `living=1` row and its hash keep, the
  canvas in its pane; L1 the still-chart control, the presentation clock and the dark-hour dim;
  L2 footprints, a route drawing itself, caravans, ships, traffic weight, the living traffic
  snapshot and selection; L3 sea shimmer, storm tracks, birds, whales where placed, Lugal's still
  mark). Each run builds up to 6 ready units of the current slice, strictly one at a time
  (every unit holds the `maps-site/index.html` lock), each through accept file → snapshot
  (`tools/mobile-tree.js`) → implementer → syntax, scope and static check → off-state
  `tools/mobile-capture.js --accept` against `L0` and on-state `tools/living-measure.js` (both
  scored in code) → ≤2 fixes → restore on failure, and runs that slice's gate when the slice is
  complete; everything ships behind the default-off `living=1`. Leave unchecked between runs with
  the returned note (`Living 3 slice Lx: n/m units …`); check off only on `check_off: true`.
  - Input: `docs/living/living-spec.json` (units, checks, hook lines, contracts) +
    `gates/views.json`, `captures/L0.json`.
  - Output: `maps-site/living.js`, `maps-site/living/**`, the declared hook lines in
    `maps-site/index.html`, the regenerated offline manifest when present, extensions to
    `tools/living-measure.js` (never breaking Living 1's keys); accept files
    `docs/living/accept/`; captures `docs/living/captures/`; per-unit ledger
    `docs/living/state/3-build/`; slice gates `gates/3-build-L{0..3}.json`, final
    `gates/3-build.json`; also `state/3-build.json`.
  - Done when (still-chart test, in every slice gate and again in the final L3 gate): with
    `living` absent, `node tools/mobile-capture.js --accept` against `L0` passes on all five
    profiles (UG1-UG3, UG6-UG8 desktop identity with no declared region, UG10 first-view growth
    only the declared hook bytes and +0 requests, UG11; UG4, UG5 and UG9 waived with fixed reasons
    and re-scored: anchors, drift, tithe lines, living strings); with `living=1` under the frozen
    virtual clock two runs give byte-identical stills and glyph lists and positions agree on both
    profiles; every view's moving classes move between two presentation instants and its still
    classes do not; with the still-chart control on, or `prefers-reduced-motion`, glyphs freeze,
    every class stays (counts equal the moving frame's) and living's rAF count is 0; hidden,
    off-screen, below its band, layer off or under a card also give 0; draws per second within
    LC8; glyphs within 1 px of their place after `zoomend` and transformed during `zoomanim`; no
    glyph eases in over more than 250 ms (R6); a blocked lazy chunk logs no error and leaves the
    still chart; `maps-site/living.js` and `maps-site/living/**` hold 0 clock tokens and no
    `createPane`, `matchMedia`, `W.rng` or WebGL; first-view raw growth ≤ 200 B (LC14); the
    offline manifest `--check` exits 0 when present; zero console errors with `filigree=1` and
    `living=1` together; glyph boxes clear of every label box; `index.html`, `docs/filigree/**`,
    `docs/street/**` and `docs/mobile/**` byte-unchanged; zero banned vocabulary in the living
    strings; the slice's spec checks pass.
  - Run: `Workflow({name:'living-3-build', args:{date:'YYYY-MM-DD'}})`. A unit stuck after 3
    failed runs is queued once directly above this item (`Living 3 stuck unit <id>`); fix it by
    hand, then re-run with `args.unstick ["<id>"]` (or `args.discard ["fix-L<n><k>"]`).
  - Blocked by: Living 2 (`gates/2-plan.json` pass, spec unchanged; a thrown Error otherwise);
    open `Living data — …` items (a returned `reason:'blocked'`; the sea mask item unchecked
    blocks only the L3 water units). **Held** — a returned `reason:'held'`: no release, note it,
    take the next item — while: the latest `docs/filigree/gates/4-review-c<k>.json` is not an
    unforced pass or any `Filigree 3 stuck unit` / `Filigree 4 punch c` / `Filigree data —` item
    is open; a Mobile item other than Mobile 15 is open, or "Mobile later · census pin names on
    phones (A12 part b)" is unchecked; a mobile or street tool is running.
  - Prerequisites: holds `maps-site/index.html` and `maps-site/living*` while running; never in a
    parallel session with Filigree 3, Street 3, Street 4 or a Street punch run (Street 3 fails GS.8
    on any `maps-site/` change during its run); never touches `index.html` or port 8544.
- [ ] **Living 4 · Review → punch list (USER REQUEST)** — review the living chart (slices L0-L3)
  against the bible and the spec through eleven single-lens finders (determinism and the clock,
  the still chart and WCAG 2.2.2, desktop identity and bytes, phone parity and battery, canon,
  voice, route truth, coexistence with the table map, ambient craft, where the build flinched, and
  owner-input fidelity: footprints, traffic, creatures, water, exhibits and the "transitive" layer
  each delivered, deferred to a named POLISH item, or ruled out by a ruling id); every finding
  must carry reproducible evidence and survive reproduce + refute + severity.
  - Input: the finished living chart (`gates/3-build.json` pass), the bible, the spec, the frozen
    views and `L0`.
  - Output: `docs/living/punch-list-c<k>.{md,json}` ("Why the flat chart is worse", "Where we
    flinched"; the plain `punch-list.{md,json}` is a copy of the latest), findings
    `docs/living/findings/`, capture `docs/living/review-c<k>/`, gate `gates/4-review-c<k>.json`;
    also `state/4-review.json`.
  - Done when (flat-chart gate): on LV2, LV3, LV5 and LV8, desktop and phone, at least 2 of 3
    blind judges (opus/sonnet/opus, fixed A/B order) prefer the living frame pair to the flat
    still, and each lists ≥3 omissions that the instrument's class counts confirm (present living,
    absent flat); the still frame keeps every class; the still-chart test re-measured clean; all
    six owner asks delivered or homed; zero banned vocabulary; zero surviving blocker or major; no
    lens died in round 0.
  - Run: `Workflow({name:'living-4-review', args:{date:'YYYY-MM-DD'}})`; optional
    `args.preview:true` (findings only, under `docs/living/preview/`, never a polish result).
  - Blocked by: Living 3 (`gates/3-build.json` a full unforced pass with the spec unchanged; else
    `review must wait for the finished living chart`, treated as blocked). A cycle-2 run returns
    `reason:'blocked'` while a cycle-1 punch item is open. Held as Living 2.
  - Prerequisites: docs-only. On fail the returned punch items go DIRECTLY ABOVE this entry and
    this item stays unchecked for a re-review (at most 2 cycles, then the owner decides; R16
    cited). Punch items edit only Living 3's files and obey Living 3's hold. On pass the owner may
    flip `living` on by default (LC1) only after an owner-run real-device pass (the Mobile 15
    checklist plus the still-chart control and battery at the table).
- [ ] **Living 3z · The zoom-through into the street view (USER REQUEST, MULTI-RUN)** — the same
  workflow with `scope:'zoom'`, slice Z: inside the Epēshu window, zooming from `Z_OPEN_MAX`
  toward `Z_STREET` crossfades the city overlay into a Street frozen-view poster (by the R6
  threshold rule; an instant swap under the still chart), then offers "Go down into the street"
  (a link built from the atlas's `#simLink` href plus `#s=epeshu&goto=<place>&street=1`, in the
  vocabulary of "Sim ↔ atlas continuity"; never a relative `index.html`, which resolves to the
  atlas on Pages and in production, and never forwarding `living=1`); landmark exhibits (the
  Epēshīn Forum first unless LC7 is overridden) open the same poster in the card with the same
  step. The sim stays the only 3D (LC7).
  - Done when: the still-chart test of Living 3 still passes on every slice; each poster is shot
    with `street=1` on, by the Street probe or `tools/living-posters.js` driving the sim, at the
    camera pose recorded in `docs/street/gates/views.json` for that view (never the pixels of
    `docs/street/gates/view/SV*.jpg`, which are street-off fixtures), records the sha256 of
    `views.json` and of its pose entry, and is ≤ 150 KB; every step link loads the sim with
    `ANNALS.street` present and zero console errors; the crossfade is present at its threshold
    only inside the window and eases ≤ 250 ms; with the still chart it is an instant swap;
    `index.html` and `docs/street/**` byte-unchanged.
  - Run: `Workflow({name:'living-3-build', args:{date:'YYYY-MM-DD', scope:'zoom'}})`.
  - Blocked by: Living 4 passed; Street 4 passed (the latest `docs/street/gates/4-review-c<k>.json`
    an unforced pass, no open `Street 4 punch c` item); "Sim ↔ atlas continuity" checked. Held as
    Living 3.
- [ ] **Living 4z · Review the zoom-through (USER REQUEST)** — `living-4-review` with
  `scope:'zoom'`: the same lenses on slice Z plus the hand-off itself (does the page change read
  as the "transitive layer"? LC7); the flat-chart gate on LV5 and LV6.
  - Run: `Workflow({name:'living-4-review', args:{date:'YYYY-MM-DD', scope:'zoom'}})`.
  - Blocked by: Living 3z (`gates/3-build-Z.json` a full unforced pass). Punch items go directly
    above this entry (`Living 4z punch c<k> …`); at most 2 cycles.
- [ ] **Living later · invented creatures (OWNER-GATED, LC4)** — the owner's "moving dragons"
  wish (a film mood, not a source): dragon flocks, hoarwyrm and Witch-Bird behaviours, and any
  other creature canon does not give. Built as Living 3 units (a Living 2 re-run adds them) only
  after an LC4 override names each creature, its place and its behaviour; every one carries the
  rumour mark (`prov:'invented'`). Absent the override: blocked, leave unchecked, take the next
  item.
- [ ] **Living later · trace the rivers (data, tool)** — the sibling of "Traced road network":
  trace the print's SOLID black lines (canon: rivers) sheet-wide with `tools/living-rivers.js`
  into `maps-site/living/rivers.json`, reusing that item's committed lab (text-component mask
  first, chain radius and direction coherence); its scratchpad groundwork is not reachable, so if
  "Traced road network" lands without committing its lab under `tools/`, this item rebuilds the
  tracer from the committed `traced-roads.json` and the atlas print. Never writes Filigree 3's
  in-window `rivers.json` (B-13); where both exist the window stretch is cross-checked, never
  overwritten. It feeds only "Living later · river flow and barges".
  - Done when (scored by commands): two runs byte-identical; every polyline has ≥ 8 vertices in
    top-origin atlas px; inside the window each polyline lies within 3 px of Filigree's
    `rivers.json` over ≥ 90% of its length; each canon river named in `wiki-places.json` labels a
    polyline within 40 px or is listed as not found; no polyline runs within 6 px of a
    `traced-roads.json` chain for more than 20% of its length; no vertex inside filigree fixture
    F08 (open sea); the way-traces that follow a solid line are listed in `_meta` (the East-West
    Road audit); `maps-site/index.html` sha unchanged; the manifest regenerated when present and
    `--atlas --check` exits 0.
  - Blocked by: "Traced road network" checked; Filigree 4 passed; Mobile 9 and Mobile 14 checked.
  - Prerequisites: holds as the sea mask item. Delegated per `.claude/CLAUDE.md` (sonnet/high).
- [ ] **Living later · river flow and barges** — the river devices the research found blocked:
  barges at direction-dependent pace (slow upstream, fast down) and a flow shimmer along
  `maps-site/living/rivers.json`, as Living 3 units after a Living 2 re-run adds them, reviewed by
  a Living 4 cycle. Blocked by: "Living later · trace the rivers (data, tool)" checked and Living
  4 passed.
- [ ] **Living later · the three.js detail spike (H1) (OWNER-GATED, LC7)** — only if the step into
  the street feels too abrupt at the table: a throwaway fixture page under `docs/living/spike/`
  (never served, never in `maps-site/`) that measures a lazily loaded vendored three r128 overlay
  over the Epēshu window past `Z_OPEN_MAX` (gzipped bytes, GL contexts on the phone profile, drift
  in px after `zoomend`, canvas cost) into `docs/living/spike/verdict.json`; findings only, no
  default change. Blocked by: an LC7 override asking for it; Living 4z passed; Mobile 15 recorded
  real devices.
```

## Inserts the jobs return (titles fixed; never queued now)

| title | placed directly above | returned by | when |
|---|---|---|---|
| `Living gap — <criterion>` | Living 2 | Living 1 | a still-frame criterion still fails after 2 rounds |
| `Living data — <what>` (e.g. `Living data — traced roads`, `Living data — re-cut the traffic snapshot`) | Living 3 | Living 2 (`/prerequisites` with status missing), Living 3 (a stale snapshot) | a slice needs data that is absent |
| `Living 3 stuck unit <id> — …` / `Living 3 stuck criterion <S> <id> — …` | Living 3 (or Living 3z) | Living 3 | 3 failed runs / a fix unit that did not cure its criterion |
| `Living 4 punch c<k> <id> — …` / `Living 4z punch c<k> <id> — …` | Living 4 / Living 4z | Living 4 | a surviving blocker or major |

## Delivery order (central; agents never write the repo)

1. This session's implementation writes every file into the staging tree
   `<staging>/repo/<path>` (a planning-session directory; nothing touches the checkout).
2. The central session waits until no mobile-build or mobile-review run is live in any session
   (it checks the sessions itself: `pgrep` sees only tool processes, never a run in its agent
   phases) and `pgrep -af 'tools/(mobile-capture|mobile-tree|street-probe)[.]js'` prints nothing.
   It never writes during a live mobile run: the whole-tree snapshot covers `tools/` and
   `.claude/` (so `tools/living-drift.js` and `.claude/CLAUDE.md`).
3. One copy, in this order: `tools/living-drift.js`; `docs/living/design/workflows/living-*.js`
   (staged, NOT `.claude/workflows/`); `docs/living/README.md`, `research-dossier.md`,
   `todo-inputs.json`, `rulings.json`, `design/*.md`, `design/build/*.js`; the `.gitignore` lines;
   `docs/research/living-chart.md` and its index line; the `.claude/CLAUDE.md` pointer;
   `docs/living/design/DELIVERED.json`; POLISH.md last (so no "Run:" line names a missing file and
   no queue run sees a half delivery).
4. Verify: `node tools/living-drift.js --staged` and `--self-test` exit 0; `node tools/street-drift.js`
   exits 0; every path in `DELIVERED.json` hashes to its entry; `grep -rnE '<scratch[p]ad>|/tmp/cl[a]ude'`
   over the delivered files prints nothing; sha256 of every `.claude/workflows/{filigree,street,
   mobile}-*.js`, `tools/street-drift.js`, `tools/mobile-*.js`, `tools/build-offline-manifest.js`
   and every file under `docs/{filigree,street,mobile}/` equal before and after; `node
   tools/living-drift.js --hold` parses.
5. One delivery commit (central), absorbed by the next release cut (no tag of its own; while the
   owner's feature-branch note stands, no tag or push at all: the cut happens at merge).
6. Then Living 0, once Mobile 9 and Mobile 14 are checked (`--install-window` prints
   `"open":true`), or earlier only through `--idle-confirmed` as its entry says.
