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

Owner's brief `docs/research/filigree-for-the-table.pdf`; operator's guide (invocation, args,
outputs, model/effort pairings, smoke recipe, owner rulings) `docs/filigree/README.md`. Each job is
ONE saved workflow, run as its own polish run in a fresh session; every output and gate record lands
in `docs/filigree/` (never the scratchpad). A job's preflight refuses to start unless the previous
job's gate file says `"pass": true` ("do not let planning start before the density bible exists");
every gate is scored by the script from fixed fixtures, never by taste ("do not let review become a
vibe check"). Use the returned `polish_note` as the result note, `polish_inserts` as new items,
`changelog_line` in the release. Queue rules for these items (reason codes, where inserted items go,
releases, the on-return table): `docs/filigree/README.md` §1.

- [x] **Filigree 1 · Research → density bible (USER REQUEST)** — inventory what plate one bothers to
  name (peak, height, homestead, reserve, river fork, coast road) against what plates two and three
  delete; walk the Pēshunor north coast once (three fixed bands of the sheet-one box) and one fixed
  Epēshu quarter in Azlen's grain (block, park void, arterial, fog wash, contour hill); carry the
  Swiss stack into fiction (old survey, every structure, caravan halts, blazed paths, muster days,
  shut ways); map each class to what the atlas and sim already hold (the `EPESHU_HF` relief window,
  era sheets, Contents plates, POI pool, city generator) or to a named build need. A density bible,
  not a map.
  - Input: brief plates 1–3 (PDF pp.2–4), the Swiss layer list (pp.4–5), Leponnia
    (`docs/filigree/research-dossier.md`, `docs/filigree/todo-inputs.json`), `maps-site` tiles and
    data, the sim heightfield `EPESHU_HF`.
  - Output: `docs/filigree/density-bible.{md,json}`; per-question evidence
    `docs/filigree/research/`; fixture crops `docs/filigree/gates/hex/F01–F12.jpg` +
    `gates/hexes.json`; the read-only probe `tools/filigree-dem.js`; gate record
    `docs/filigree/gates/1-research.json`; also `gates/1-hex-answers.json`,
    `state/1-research.json` (full list: docs/filigree/README.md §4).
  - Done when (blank-hex gate): two blind appliers on different models (sonnet/high, opus/high),
    holding only the bible and the crops of the 12 fixed z7 hexes F01–F12, each classify every hex
    and name six bible classes as instances on it whose source refs resolve (DEM, data file, print
    pixel, mint key or sim anchor: each inside the hex and where the instance sits): class
    agreement ≥5/6 on ≥10 of 12 hexes and ≥4/6 on all 12; ≥5 of 6 instances resolve per applier per
    hex (only F08 open sea and F12 no-DEM may be exempt); zero "bible silent"; the brief + v2
    checklist 27/27; zero banned vocabulary; at most 2 follow-up rounds, else leave unchecked with
    the gap list (the returned `polish_inserts`: one stable item per failing criterion plus one
    pointer to the gaps, placed directly above Filigree 2; skip any already queued). The polish run
    checks the box only when the returned `pass` is `true`.
  - Run, in a fresh session: `Workflow({name:'filigree-1-research', args:{date:'<today, YYYY-MM-DD,
    from the session environment>'}})`; if the name does not resolve, use
    `scriptPath:'/home/user/annals-kingdom/.claude/workflows/filigree-1-research.js'` (absolute
    path) instead of `name`. Optional first step: the same call with `mode:'plan'` returns the
    agent schedule (expect `pass:false, reason:'plan'`); a plan run is not a polish result (no
    note, no release, no box). Compare its `agents_bound` with README §11 (about 224 with `crit()`
    retries; a typical run is about 97): if you raised an arg or the script grew past that, stop
    and note it rather than running. For Job 1 a plan-mode preflight failure is the same failure as
    in a full run (Jobs 2 to 4 previews are meaningful once the previous job has run). Any thrown
    Error (bad args, `missing inputs`, `anchor lost`) is a run fault: no release, note the Error
    text, take the next item. On a rerun after a partial failure, keep the default `resume:true`:
    the frozen `gates/hexes.json` and `gates/hex/*.jpg` are skipped, never regenerated (a rerun with
    changed fixtures dies with `fixtures changed; delete gates/hex* to re-crop`), and questions
    listed in `state/1-research.json` whose evidence still re-hashes are skipped. That ledger is
    written only at the end of a run, so after an abort a new session re-researches all 18.
  - Blocked by: nothing (so `reason:'blocked'` never fires here).
  - Prerequisites: the delivery commit (scripts, README, dossier, todo-inputs, rulings, design docs)
    is already in the checkout. Docs + a read-only probe tool; never edits `index.html` or
    `maps-site/index.html`. If the dotted "Traced road network" data file is missing or unloaded,
    that is a q17 finding, not a preflight failure.
  - Default-rulings result (2026-10-04, superseded by the mobile re-integration):
    density bible: 59 rules, 12/12 hexes agree ≥5/6 (min 6/6), 100%
    instances resolve, checklist 27/27, round 1; gaps for Job 2 recorded in
    `docs/filigree/gates/1-research.json`.
  - Mobile re-integration (Mobile 0): docs/filigree/rulings.json now overrides R2 R7 R12 R14 R18 and
    todo-inputs.json carries a "mobile" block, so the bible is re-integrated. Path B: delete
    gates/1-research.json (the deletion the script's own message names) and run fresh with
    resume:true. The ledger skips research; the hex crops stay. Path C, a full re-run, needs the
    owner's go. Check this box again only on the re-integrated pass, when all of these hold:
    rulings_used names the overrides; density-bible.md has "## Phone (mobile block)" with FM1-FM12;
    the bible's class ids are a superset of 72175a5's. Then add the new Result line here.
  - Result (2026-10-05, mobile re-integration): density bible: 59 rules, 12/12 hexes agree ≥5/6
    (min 6/6), 100% instances resolve, checklist 27/27, round 0; rulings_used R2 R7 R12 R14 R18 from
    rulings.json; "## Phone (mobile block)" carries FM1-FM12; 27/27 classes kept (none dropped).

### Mobile at the table (USER REQUEST): keep the quality, fit the phone

The owner's ask: keep the atlas and the sim at their present quality on phones at the table, and
make them work
there: one hand, poor wifi, three hours of battery, glare and night, the right tap first time, the
plates kept
offline. Rule: delay, never drop. Every class the desktop shows stays reachable on a phone; a phone
budget never
thins, delays or shrinks the desktop; nothing touches the seed, W.rng, the sim, canon or the
chronicle voice.
Research `docs/research/mobile-at-the-table.md`; guide, gates and records `docs/mobile/README.md`;
instrument
`tools/mobile-capture.js` against `docs/mobile/baseline.json`; loop
`.claude/workflows/mobile-build.js` and
`mobile-review.js`.

How the items run:
- Each item is one polish run with one patch release. Its units run one at a time through the build
  workflow, then the item's review workflow runs.
- The atlas items (Mobile 4-9, maps-site/index.html) and the sim items (Mobile 10-14, index.html)
  may run in parallel sessions, each strictly in order. Release cuts are serialized by the
  orchestrator.

Every unit passes the universal gates, plus its own measured acceptance at 390x664 (iPhone 13) and
412x839
(Pixel 7). The universal gates are:
- the CLAUDE.md syntax check;
- zero console errors;
- simDays(400) fingerprints identical for epeshu and tamar1374;
- every workflow anchor, ANNALS.stats() keys, the keydown handler and the Leaflet panes unchanged;
- the desktop unchanged at 1366x768@1 and 1440x900@2;
- voice.

A failing unit is restored from its snapshot; the item stays unchecked with the failing numbers.
Agents never run git.

- [x] **Mobile 0 · Rulings, phone criteria, research copy (USER REQUEST)** — write
  docs/street/rulings.json (ST8), docs/filigree/rulings.json (R2 R7 R12 R14 R18) and both "mobile"
  blocks, text-level with every existing byte kept; uncheck Filigree 1 for its re-integration. Copy
  the verified brief to docs/research/mobile-at-the-table.md (+ index line) and its inputs to
  docs/mobile/inputs.json; write docs/mobile/README.md; apply these POLISH edits. R6, ST7, ST9 and
  ST19 keep their defaults (an override would drop Street 2's baked checks).
  - Done when: all four files parse and match the plan's files byte for byte; earlier todo-inputs
    keys deep-equal before and after; no override hits VOCAB or VOCAB_ST; each override starts with
    its default text; player-visible strings (labels, titles, aria-labels, hint, tidings) are
    enumerated in docs/mobile/README.md as a list, and only that list is voice-read (wiki canon
    names such as The Lektān Priesthood are exempt from the VOCAB grep);
    docs/mobile/owner-answers.json exists with null answers.
  - Prerequisites: no Filigree 1 agent running when the filigree files are written. Hold Street 1
    and Filigree 2 (full runs) until this item, the re-integration, Mobile 2 and both lane reviews
    are done. Docs only.
- [x] **Mobile 1 · The measuring stick, the baseline, the loop (USER REQUEST)** —
  tools/mobile-capture.js (iPhone 13, Pixel 7, desktop 1366x768@1, desktop2x 1440x900@2, landscape;
  virtual and real clocks; bytes, rects, taps, fingerprints, anchors); baseline B0 captured twice
  before any app edit; the saved loop .claude/workflows/mobile-build.js and mobile-review.js
  (written by the central session only, never a workflow agent; checked by
  tools/mobile-loop-check.js and reviewed). The units start from the verified harness shipped beside
  units.json (inputs/) and score against accept files authored before each implementer runs.
  - Done when: two runs agree on every non-timing key; the capture reproduces the brief within 5%
    (first load 729,636 B, doc 974 vs 664, chrome cover 29%, Contents kicker −26 px, the Epēshu tap
    at z4.55 opening the Lektān card, 11 of 13 sim controls under 44 px, degradeStep 0 after 60 s);
    the loop's plan mode and a no-op dry run pass; reviews leave no blocker or major.
  - Prerequisites: Mobile 0. Reads the app files only, so it may run while Filigree 1 runs.
- [x] **Mobile 2 · Workflow routes for phones (script)** — filigree-2-plan.js: the capture contract
  gains the 390x664 phone page, the net block, throttles and serviceWorkers:'block'; every slice's
  /checks must hold a phone check (G2.1). street-2-plan.js: S0.U01 asks the probe for --phone on
  every view, --class and --cpu; /device_classes joins the spec shape with a code-scored SG2.17
  (desktop = /stream, phone ≤ 3 jobs and ≤ half the triangle cap). Job bodies only; never a prelude,
  filigree-1-research.js or street-1-research.js.
  - Done when: each script parses; node tools/street-drift.js exits 0; prelude shas unchanged; the
    masked diffs show nothing else moved; the synthetic checksFailures and SG2.17 fixtures pass; the
    adversarial review leaves no blocker or major (≤2 cycles). The live plan-mode previews run at
    the top of Filigree 2 and Street 2.
  - Prerequisites: Mobile 0. Never while Filigree 2 or Street 2 runs.
- [x] **Mobile 3 · Delivery: compression, cache, staging, manifests (USER REQUEST)** — server.js
  (gzip, MIME, ETag/304, Cache-Control, HEAD, PORT env); DEPLOY.md (nginx and Caddy blocks, the sim
  root as an allowlist so .git, docs and tools are never served, HTTPS, the worker kill switch, the
  TILES_V rule); pages.yml stages vendor/ and the workers when present;
  tools/build-offline-manifest.js. Resolves "Data fetch cache-busting" by revalidation.
  - Done when: atlas index.html ≤ 70 KB transferred (211,860 raw); sim index.html ≤ 760 KB
    (1,203,659 raw); iPhone first load without fonts ≤ 450 KB (was 729,636 B); repeat visit ≤ 10% of
    the first (was 100%); header lint 0 mismatches; a staged Pages copy loads clean; the manifest
    tool is byte-identical on rerun.
  - Prerequisites: Mobile 1 baseline captured; Filigree 1 not running.
  - Result (2026-10-05): D1, D2, D6 passed the loop (first attempt each). iPhone atlas page
    67,676 B, data 68,427 B, first load 427,384 B; repeat visit 4,843 B, 37/37 cached; sim page
    746,236 B. Header lint 0 mismatches; manifest byte-identical on rerun. The capture tool now
    takes the repeat visit in a cache-on probe (page.route turns the HTTP cache off).
- [ ] **Mobile 4 · Atlas: vendored, versioned, framed (USER REQUEST)** — vendored Leaflet 1.9.4 and
  the OFL fonts (A9); raster URLs carry ?t=TILES_V (A8); the closed sheet clipped, the Contents
  heading safe, safe areas and dvh (A1, A11, A14). Resolves "Notch safe-areas".
  - Done when: 0 foreign origins (was 3), and the vendored Leaflet bytes equal its SRI; every raster
    request carries ?t=1; with the sheet closed the page height equals the viewport (664/839, was
    974/1,265); the Contents kicker's top ≥ 0 (was −26); the desktop reference is re-taken once
    (fonts now render).
  - Prerequisites: Mobile 3.
- [ ] **Mobile 5 · Atlas: absolute bands and the right tap (USER REQUEST)** — reveal tiers pinned to
  absolute zooms at the earlier of the two desktops (A19); one glyph-centre tap resolver with a
  "which mark?" chooser, so faded glyphs never take a tap (A2); 44 px controls and invisible marker
  pads (A3). Resolves "Tier-hidden markers intercept clicks".
  - Done when: ATLAS.tiers() is identical on all five profiles and no desktop reveals later; 0
    wrong-card taps in the five tap views (was: Epēshu at z4.55 opened the Lektān card); ≤ 5% of
    targets under 44 px (was ~98%); glyphs unmoved.
  - Prerequisites: Mobile 4. The tier pin needs the owner's answer (plan owner question 1) whenever
    a desktop moves more than 0.35 zoom (computed: the 1x desktop's tier C moves 0.58 earlier).
    Without the answer, A19 and A5 move to a "Mobile 5b · absolute bands (OWNER-GATED)" item
    directly above Filigree 2, and the lane continues.
- [ ] **Mobile 6 · Atlas: the table drawer, the whole chart, light overlays (USER REQUEST)** —
  one-row header, a thumb-zone cluster, and era, layers, Groups, the Company and journeys in one
  bottom sheet (a side sheet in landscape) (A4, A6, A16, A21); The Whole Chart letterboxed to the
  phone's width (A5); 720 px overlay previews before the full plate (A7).
  - Done when: chrome cover ≤ 12% at the whole chart (was 29%/21%) and ≤ 35% at peek; every desktop
    control reachable in ≤ 2 taps; ≥ 95% of the chart visible at The Whole Chart on both phones (was
    36%/30%); ≤ 250 KB before the Epēshu overlay swaps in (was 2,171,881 B); desktop identical.
    Every new aria-label and title uses table vocabulary (sheet handle "Draw the sheet up or down",
    layers "Layers of the chart", close "Close the card"); never menu, drawer, modal, dismiss or
    toggle in visible or accessible text.
  - Prerequisites: Mobile 5.
- [ ] **Mobile 7 · Atlas: kept for the table and kept lit (USER REQUEST)** — the atlas service
  worker (registers only on a secure, non-localhost host and never under automation, unless ?sw=1;
  kill switch); "Keep this chart for the table — <size>", with the exact size from the manifest
  shown first; "Keep the chart lit" (A10, A20).
  - Done when: offline reload shows the kept era z0-4 with 0 failed tiles; the shown size is within
    5% of the bytes fetched; nothing downloads before the tap; 0 registrations under Playwright
    without ?sw=1; the kill switch clears everything.
  - Prerequisites: Mobile 6.
- [ ] **Mobile 8 · Atlas: card sheet, touch parity, search, zoom steps, night measured (USER
  REQUEST)** — the place card as a peek/half/full sheet (A13); :hover gated, halo ring, realm tap,
  long-press name peek, census pads (A15, A12 part a); search at 16 px with 44 px rows (A17);
  half-step zoom buttons, Save-Data idle tiles, keepBuffer kept at 4 (A18); a night-pinch capture
  and a recorded verdict (A22).
  - Done when: card peek 100-140 px with a 48 px handle and swipe-down; 0 ungated :hover rules (was
    29); a long-press names without opening; focusing search never zooms the page; the A22 verdict
    is recorded (it inserts "Mobile later · night tiles" only if night fails; the LoAF numbers are
    advisory in the sandbox). Same table-vocabulary rule for every new aria-label and title (the
    card handle, close and sheet controls).
  - Prerequisites: Mobile 7.
- [ ] **Mobile 9 · Atlas lane review (USER REQUEST)** — five blind finder lenses on the lane's whole
  diff and its captures (delay-not-drop, desktop identity, tap correctness, bytes, voice). Each
  finding is reproduced and refuted; an opus/high judge rules. Surviving majors become fix items
  directly above this one.
  - Done when: no surviving blocker or major; the staged Pages copy and both desktops re-captured
    clean; docs/mobile/final.json written for the atlas (the FM8 reference).
  - Prerequisites: Mobile 4-8. Must pass before Filigree 2.
- [ ] **Mobile 10 · Sim: vendored, reach and escape (USER REQUEST)** — three r128 and IM Fell
  English vendored (S6); 44 px controls, 13 px HUD text, page zoom unlocked, manipulation on HUD
  buttons (S5, S13); a "Return the court" tab and a close button on the full chart (S4, S11).
  - Done when: 0 foreign origins; 0 of 13 controls under 44 px (was 11); one tap restores the court
    and one closes the chart; the keydown handler unchanged; the desktop reference re-taken once.
  - Prerequisites: Mobile 3. Before Street 1.
- [ ] **Mobile 11 · Sim: device classes and honest frames (USER REQUEST)** — a device class chosen
  once at load (?dc=, pointer, short side, memory, cores), with creation-time levers only and no
  instance trimming (S2); the ladder on real frame time with upward recovery and a 30 fps phone cap,
  plus ANNALS.device() and ANNALS.deviceReport() (S1, S16); WebGL context loss survived without
  regenerating, and a pause while hidden (S3, S8).
  - Done when: the ladder's node unit test passes; the ladder fires within 10 s on a throttled phone
    profile and never at a virtual 60 fps; desktop calls and tris identical; fingerprints identical
    under both classes; a context loss restores the same world; ANNALS.stats() keys unchanged.
  - Prerequisites: Mobile 10. Before Street 1.
- [ ] **Mobile 12 · Sim: kept for the table and kept lit (USER REQUEST)** — the sim service worker
  (same guard; returns early for maps-site/ on Pages; kill switch); "Keep the realm for the table —
  <size>" and "Keep the chronicle lit" (S6, S17).
  - Done when: offline reload reaches ANNALS.ready with 0 failed requests and the same fingerprint;
    the sim worker never answers a maps-site/ request; the size is within 5%; no clock token added.
  - Prerequisites: Mobile 11. Before Street 1.
- [ ] **Mobile 13 · Sim: resize, phone layout, ledger sheet, first touch, night ink (USER REQUEST)**
  — debounced resize with the class pixel ratio, and a capped graphs canvas (S9, S14); speed
  controls in a bottom bar and a compact landscape HUD (S10); the ledger as a three-stop sheet
  (S12); a first-touch hint card (S7); Night ink for the HUD, ledger and sheets (S18).
  - Done when: top chrome ≤ 10% of the height on iPhone (was 15-22%); ledger ≤ 35% at peek and ≤ 50%
    at half (was 60%); the hint shows once and never on desktop; HUD contrast ≥ 4.5:1 in both
    themes; the 3D scene untouched. The hint reads "One finger turns the sky · two fingers walk the
    land · draw two fingers together to come near · touch to look · touch twice to journey"; Night
    ink reads "Night ink: lit by Tamar's dark hour" / "Day ink"; new aria-labels use table
    vocabulary (never menu, drawer, modal, dismiss, toggle, "Dark mode" or "Theme").
  - Prerequisites: Mobile 12. Before Street 1.
- [ ] **Mobile 14 · Sim lane review (USER REQUEST)** — five blind lenses (determinism, desktop
  identity, phone parity, lifecycle, voice), each finding reproduced and refuted, then an opus/high
  judge; majors become fix items directly above this one.
  - Done when: no surviving blocker or major; docs/mobile/final.json completed for the sim; the
    "sim_after_mobile_pass" features grep-confirmed in index.html (else the street block's sentence
    is edited).
  - Prerequisites: Mobile 10-13. Must pass before Street 1.
- [ ] **Mobile 15 · Real-device pass (OWNER-RUN)** — on a real iPhone (Safari) and an Android phone
  (Chrome), at the table. Check: the five tap views; drawer and card gestures; whether the layers
  rows stay open; 100dvh and safe areas; Keep for the table and storage.persist(); wake lock; night
  mode under a pinch; the sim's ladder; ANNALS.deviceReport(). Record real viewports in
  docs/mobile/devices.json; findings go directly above this item.
  - Blocked by: Mobile 9 and Mobile 14. Owner-run only (leave unchecked; take the next item). Before
    any default flip (R18, ST7).
  - Result (2026-10-05): R2 R7 R12 R14 R18 and ST8 overridden append-only and owner-confirmed;
    R6 ST7 ST9 ST19 kept; "mobile" blocks in both todo-inputs; Filigree 1 re-integrated (FM1-FM12).
  - Result (2026-10-05): tools/mobile-capture.js (123 self-tests), B0 captured twice with zero
    differing keys, mobile-build/mobile-review loop with whole-tree rollback; all review findings
    closed.
  - Result (2026-10-05): SE1a, SE2a, SE2b landed in job bodies; preludes byte-identical,
    street-drift green; Street 2 plan preview reads the overrides with no baked check loosened.
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

### Filigree for the Table (cont.) and the street research: the sheet spec, then the street bible

- [ ] **Filigree 2 · Planning → sheet spec (USER REQUEST)** — from the bible alone: one coast, one
  river town, one painted city (default Pēshunor north coast / Aldorūs / Epēshu unless a challenger
  refutes them); label ranks per sheet (country / region / valley / city) on the existing reveal
  tiers (peaks and heights always, homesteads as dots, reserves as a green wash, only the river town
  gets a shield); the city rule (texture over type, fog as weather not as art); the overlay order
  locked (old survey under the live sheet, shut ways and muster days on top, swappable between
  sessions); the palette (bone paper, rust coast road, ocher arterials, rose-brown blocks, wet-blue
  water); the test contracts (hook, capture harness, gate views); build units in slices A ground /
  B ink / C city / D stack.
  - Input: `docs/filigree/density-bible.{md,json}` and the region.
  - Output: `docs/filigree/sheet-spec.{md,json}` (+ section drafts `spec/`, base crops
    `spec/assets/`); probes `gates/2-probes.json` (frozen before the spec exists, stamped with the
    bible sha and rulings; regenerated only by `resume:false`); gate views `gates/views.json`; gate
    record `gates/2-plan.json`; also `cold/`, `state/2-plan.json` (full list:
    docs/filigree/README.md §4).
  - Done when (cold-cartographer gate): two drafters on different models that may read ONLY
    `sheet-spec.{md,json}` + the base crops answer the probes frozen before the spec existed at
    ≥90% each, and draw sheet one (the region sheet over the north coast) as SVG whose layers
    follow the spec's paint order exactly, with every must class, no forbidden class (the region
    sheet's `/forbidden` plus the homestead classes), palette hexes only (`/palette/*/day` plus
    `/paint/wash_hex/*`) and exactly one shield at the river town; zero spec-silent decisions; zero
    blocking divergences between the two drafts; `sheet-spec.md` names no source post outside
    `## Provenance`; every bible must-rule traces to a spec rule and every spec rule to a build
    unit with machine-checkable acceptance; each slice A-D has a non-empty `/checks` list (every
    check with an id, cmd and expect); no homestead class in `/sheet_one/layers` or the region
    `must`; the gate views are the V1–V7 seeds at each band's midpoint. At most 2 fix rounds.
  - Run: `Workflow({name:'filigree-2-plan', args:{date:'YYYY-MM-DD'}})`.
  - Blocked by: Filigree 1 (preflight refuses by throwing an Error naming the gate, which the run
    treats as blocked; needs `gates/1-research.json` passed and the bible unchanged since).
  - Prerequisites: owner glance at rulings R1, R5, R6, R7, R9, R18 (defaults apply otherwise; R7 and
    R18 now carry the mobile overrides). Mobile 2 checked (phone capture contract, per-slice phone
    check); Mobile 4-9 checked (absolute bands, the tap resolver, the table drawer, the card sheet
    and ?t= rasters the spec plans against); no edit to index.html or maps-site/index.html in
    flight. First run its `mode:'plan'` preview (the live gate of Mobile 2's filigree edit).
    Docs-only.

- [ ] **Street 1 · Research → street bible (USER REQUEST)** — measure and read what the street view
  must stand on: write the probe (`tools/street-probe.js`: its own read-only server, a virtual clock
  that makes calls, triangles, object counts and sim fingerprints exact); freeze nine camera views
  SV1–SV9 of Epēshu and the procedural seed `tamar1374` (the Forum, the gate at the dark hour, a
  ward, a bridge where caravans queue, the far band, a door at R 9, a procedural town, Wood Quay in
  weather, the far sky) and the street-off baseline at each; answer fourteen targeted questions,
  q02–q15 (q01 is the probe itself; topics in order q02–q15: the clocks and the dark hour, caravans
  and a stateless queue, every determinism debt, street data, facades and instancing, LOD and the
  near plane, keys, hash and the seed writers, weather and the R13 fog source, the R12 notices,
  Epēshu canon, Patrinaic words, shadows and the degrade ladder, r128 facts, the class map; the
  id-to-topic table is design/workflow-1-research.md §3.1, the QUESTIONS list in
  street-1-research.js); then a street bible mapping each of the 17 pieces and 10 bronze-age
  analogues to classes with their driving state (seeded gen, sim read-only, keyed render, notice),
  reusing the filigree density bible's class ids. A bible, not a renderer.
  - Input: `docs/street/research-dossier.md`, `docs/street/todo-inputs.json`,
    `docs/research/streamed-streets.md`, `index.html`, `docs/filigree/density-bible.json` and
    `maps-site/data/` (read-only), `lexicon/patrinaic.json`.
  - Output: `docs/street/street-bible.{md,json}`; evidence `docs/street/research/q01–q15.json`; the
    probe `tools/street-probe.js`; frozen fixtures `docs/street/gates/views.json` +
    `gates/view/SV1–SV9.jpg` and the baseline `gates/baseline.json`; gate record
    `docs/street/gates/1-research.json`; also `gates/1-view-answers.json`, `state/1-research.json`
    (full list: `docs/street/README.md` §4).
  - Done when (blank-street gate): two blind appliers on different models (sonnet/high, opus/high),
    holding only the bible, the frozen views and their stills, the baseline and greps of
    `index.html` (and, for filigree class ids, the filigree density bible and `maps-site/data/`),
    each name for every gate view SV1–SV8 (SV9, the far sky, is measured and frozen
    but not scored) the tier the bible's rule gives and six bible classes that must be present
    there, each with the bible's driving state and a source ref that resolves (sim literal,
    keyed-stream key, notice class, probe metric or filigree class id): tier exact 8/8; class
    agreement ≥5/6 on ≥7 of 8 views and ≥4/6 on all; ≥5 of 6 refs resolve per applier per view and
    ≥90% overall; zero "bible silent"; checklist 27/27; the bible declares no new sim state and
    lists every determinism debt the grep finds; caps ceilings numeric for SV1–SV9 and at or above
    the baseline; the probe is deterministic on a double run and its fingerprint changes when one
    caravan's departure day moves; zero banned vocabulary; at most 2 follow-up rounds, else leave
    unchecked with the returned `polish_inserts` (`Street gap — …`, directly above Street 2; skip
    any already queued).
  - Run, in a fresh session: `Workflow({name:'street-1-research', args:{date:'<today, YYYY-MM-DD,
    from the session environment>'}})` (today = the date the session environment reports, e.g. `date
    +%F`); if the name does not resolve, use
    `scriptPath:'/home/user/annals-kingdom/.claude/workflows/street-1-research.js'`. Optional first
    step: the same call with `mode:'plan'` (not a polish result); compare `agents_bound` with README
    §11 (180; plan mode needs Filigree 1 passed too) and stop if it grew. A thrown `prelude drift:
    …`, `anchor lost: …` or `missing inputs: …` is a run fault: no release, note it, fix per README
    §12 (never by editing a filigree script). Match thrown strings after the `<job>: ` prefix. On a
    rerun keep `resume:true`: frozen views are never re-frozen (`fixtures changed (moved: SV1, ...);
    delete docs/street/gates/views.json and docs/street/gates/view/ to re-freeze`).
  - Blocked by: Filigree 1 (`docs/filigree/gates/1-research.json` pass, full, unforced, bible
    unchanged; otherwise the preflight throws `street research waits for the density bible …`,
    treated as blocked; this holds for `mode:'plan'` too, so the plan-mode check cannot be done
    before Filigree 1 passes). Thrown-string classes (blocked, run fault, infra):
    `docs/street/README.md` §1.6. Runs after the mobile sim lane (Mobile 10-14) so the frozen views,
    the baseline and STATS_KEYS are measured on the phone-ready sim; if Filigree 3 later moves the
    sim, Street 3 re-baselines (the `rebaselined` note; it does not re-resolve view focuses; README
    §12). After a later Filigree 1 re-run, re-run Street 1 with `resume:true` (README §12).
  - Prerequisites: the street delivery commit (scripts, `tools/street-drift.js`, README, dossier,
    todo-inputs, rulings, design docs) is in the checkout; verify with `ls
    .claude/workflows/street-1-research.js docs/street/README.md tools/street-drift.js && node
    tools/street-drift.js` (the first release cut after it absorbs the delivery commit; there is no
    delivery tag). Docs + the read-only probe; never edits `index.html`, `maps-site/**` or
    `docs/filigree/**`. Mobile 0 checked (ST8 override and the street "mobile" block written);
    Filigree 1 checked on the re-integrated bible; Mobile 14 checked. After it passes, grep
    docs/street/street-bible.md for "## Phone (mobile block)" and SM1-SM11 (if absent, insert
    "Mobile · phone criteria into Street 2 (contingency, script)" directly above Street 2).

- [ ] **Street 2 · Planning → street spec (USER REQUEST)** — from the street bible alone: the tiers
  and the refine rule (screen-space error off `CAM.radius`, hand-rolled in/out hysteresis pairs
  inside the settlement band), the streaming queue (quads a pure function of seed and quad id, ≤6
  jobs and a triangle cap per frame, an LRU with dispose that stays coarse when full, own culling),
  the ≤250 ms ease (R6), near facades and the street surface (Epēshu marble per ST12, ruts, kerbs,
  thresholds, ground on the grid per R22), instanced stalls, carts and crowds, render-only caravan
  queues (spacing at donkey pace, fords and one-lane bridges crossed in turn, toll halts as a dwell,
  gate leaves shut while the drawn dark hour lasts), the sky (cloud deck and shadows row, the
  weather dial, the R13 fog copy), the layers rows and `street=1` (default off, R18), the
  seed-parser fix (ST18) before `notices=` (R12) is read, the herald's tidings, per-view caps, the
  determinism contract, the STREET block and its declared hook lines, and build units in slices S0
  instrument / S1 streaming / S2 near detail / S3 life / S4 sky and layers.
  - Input: `docs/street/street-bible.{md,json}`, `gates/views.json`, `gates/baseline.json`; the
    filigree notices contract (read-only).
  - Output: `docs/street/street-spec.{md,json}` (+ section drafts `spec/`); probes
    `gates/2-probes.json` (frozen before the spec exists); the tidings fixture
    `fixtures/tidings.json` (frozen); gate record `gates/2-plan.json`; also `cold/`,
    `state/2-plan.json`.
  - Done when (cold-engineer gate): two blind readers on different models (sonnet/high, opus/high)
    that may read ONLY `street-spec.{md,json}` answer the probes frozen before the spec existed at
    ≥90% each, with zero schema-path guesses; no spec-probe pointer is null; every bible must-rule
    traces to a spec rule and every spec rule to a unit with machine-checkable acceptance; the unit
    DAG is acyclic with ≤9 units per slice and unit files only `index.html`, `tools/street-probe.js`
    and `docs/street/{fixtures,shots,device}/**`; every slice has a `/checks` list with the
    mandatory checks; caps for SV1–SV9 within the bible ceiling, the far views equal to the
    baseline; the determinism contract allows only keyed streams and read-only sim state; every
    hook line is declared, marked, replaces one whole `index.html` line and holds no filigree
    anchor literal; the block placement literal sits on exactly one `index.html` line; the spec's
    fade.ms (≤250, R6), max_jobs_frame (≤6, ST9), tri_cap_frame, resident_tris and traffic s0/T/v0
    are numbers, there are ≥3 caravan tiers, and every hysteresis pair sits inside 2200 (SG2.16);
    fixed probe answers have no unfilled placeholders; new hash params never end in `s` and
    `notices=` is read only after the S0 parser unit; no source-post name outside `## Provenance`;
    zero banned vocabulary. At most 2 fix rounds.
  - Run: `Workflow({name:'street-2-plan', args:{date:'YYYY-MM-DD'}})`. A re-run on an unchanged
    bible, rulings and spec files returns `already passed` and leaves `street-spec.json` alone; to
    redo, delete `gates/2-plan.json` or pass `resume:false`.
  - Blocked by: Street 1 (`docs/street/gates/1-research.json` pass, bible unchanged; the filigree
    density bible and the cited filigree rulings unchanged since Street 1; a thrown Error otherwise,
    treated as blocked).
  - Prerequisites: owner glance at ST1, ST2, ST5, ST8, ST10, ST12 (defaults apply otherwise).
    Docs-only. Data items it finds go directly above Street 3 as `Street data (S3) — …`. Mobile 2
    checked; first re-run its `mode:'plan'` preview (the live gate of Mobile 2's street edits);
    SG2.17 (/device_classes) joins its gate.

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

- [ ] **Mobile · Filigree 3 phone slice pass (script)** — filigree-3-build.js job body: REQ_CHECKS
  requires the per-slice "phone" check as a backstop (Job 2 already enforces it). The slice-gate
  capture also runs the 390x664 DPR 3 phone page and the net block, and each slice gate records its
  viewports. A slice fails on phone overlaps, horizontal scroll, names under 12 px on a coarse
  pointer, wrong-card taps, or any filigree request with the toggle off.
  - Done when: parse; node tools/street-drift.js exits 0; prelude shas unchanged; the Filigree 3
    `mode:'plan'` preview passes; an adversarial review leaves no blocker or major (≤2 cycles).
  - Blocked by: Filigree 2. Must be checked before the first Filigree 3 run.

- [ ] **Filigree 3 · Implementation → the table map (USER REQUEST, MULTI-RUN)** — build
  `sheet-spec.json`'s units in paint order (relief first, contours tight enough to read as
  fingerprints, water, the rust coast road, green reserves, homestead dots, names and heights, then
  the city grain and fog washes last) with the overlays as separate sheets (old survey, structures,
  caravan halts, blazed paths, muster days, shut ways); never generalize a ridge to save ink; mint a
  Patrinaic name for any unnamed knoll (deterministic, `prov:'invented'`, listed for the owner).
  Each run builds up to 8 ready units of the current slice (A ground → B ink → C city → D stack)
  under per-file locks and runs that slice's gate when the slice is complete; everything ships
  behind the default-off table-map toggle. Leave unchecked between runs with the returned note
  (`slice X: n/m units …`); check off only when the workflow returns `check_off: true`.
  - Input: `docs/filigree/sheet-spec.json` (units, checks, contracts) + `gates/views.json`,
    `gates/hexes.json`.
  - Output: the table map in `maps-site/` (FILIGREE block in `maps-site/index.html`, baked relief,
    `filigree-*.json`, `rivers.json`, notices sample), tools `tools/filigree-*.js` +
    `tools/mint-names.js`, regenerated gazetteer, `docs/filigree/names-for-owner.md`, per-unit
    ledger `docs/filigree/state/3-build/`, slice gates `gates/3-build-{A,B,C,D}.json`, final
    `gates/3-build.json`; also `gates/3-handtest-questions.json`, `state/3-build.json`,
    `tools/filigree-handq.js` (full list: docs/filigree/README.md §4).
  - Done when (hand test, inside the slice B gate and again in the final slice D gate): with the
    settlement covered by an opaque disc (and every other town in view disc'd) on 3 fixed views, two
    navigators on different models that see only the screenshot answer ≥80% of frozen,
    data-computed route questions by ridge names (a names answer scores by Jaccard ≥ 0.5, precision
    and recall together), read ≥70% of the visible landform labels, see ≥6 named heights outside
    the mask, and cannot name the covered town; plus ≥10/12 fixture hexes show their six and none
    below 4, overlay toggles refetch zero base tiles, the toggle off leaves no filigree pane, the
    pane z-order follows the spec's paint order, generators are byte-identical on rerun, and the
    smoke is clean (sim `#s=epeshu` + a procedural seed with `simDays(400)`, atlas, zero console
    errors).
  - Run: `Workflow({name:'filigree-3-build', args:{date:'YYYY-MM-DD'}})`. A unit stuck after 3
    failed runs is queued once above this item; fix it by hand, then re-run with
    `args.unstick ["<id>"]` (or `args.discard ["fix-<S><n>"]` for an obsolete fix unit).
  - Blocked by: Filigree 2 (`gates/2-plan.json` pass, spec unchanged; a missing or changed Job 2
    gate, a refused slice and a spec with no `/checks` are thrown Errors, which the run treats as
    blocked); "Traced road network" and "Census second pass" checked (R11; only these come back as a
    returned `reason:'blocked'`). The owner may pass `overridePrereqs:true` to build slice A only.
  - Prerequisites: holds `maps-site/index.html` while running. Data gaps it finds go directly above
    this item. "Mobile · Filigree 3 phone slice pass (script)" checked; Mobile 4-14 checked (this
    job holds both maps-site/index.html and index.html).

- [ ] **Mobile · Filigree 4 phone gate and bytes (script)** — filigree-4-review.js job body: F08
  moves from 390x844 to 390x664 (plus 844x340). MET_KEYS and the metrics digest gain net and the new
  phone keys. A code-scored phone criterion (overlaps 0, no horizontal scroll, gap ≥ the spec
  minimum, names ≥ 12 px, 0 wrong taps, chrome cover ≤ 12%) makes a phone failure fail the gate;
  byte criteria cover 0 requests with the toggle off and ≤ 500 KB per asset without a low-res step.
  R18's coarse-pointer flip waits on it.
  - Done when: parse; drift ok; a Job 4 `preview:true` run after Filigree 3 passes; the phone
    criterion is scored on synthetic pass and fail metrics; review clean.
  - Blocked by: Filigree 3.

- [ ] **Filigree 4 · Review → punch list (USER REQUEST)** — review the finished sheets against
  plate one (not a normal VTT map), the city against Azlen (painted, or a UI?), the stack (pull the
  old survey, the shut ways and the muster notice without a redraw), every name read aloud
  (unsayable → cut or rewritten at the generator), the holes where the build flinched and
  generalized, plus the v2 lenses (navigator, data truth, appear effect, real colour, cramped on
  phones). Thirteen single-lens finders; every finding must carry reproducible evidence and survive
  reproduce + refute + severity.
  - Input: the finished sheets (`gates/3-build.json` pass), plates 1–3, the Swiss layer list, the
    density bible, the sheet spec.
  - Output: `docs/filigree/punch-list.{md,json}` (with "Why the sparse map is worse" and "Where we
    flinched"), verified findings `docs/filigree/findings/`, capture
    `docs/filigree/review-c<k>/`, gate record `gates/4-review-c<k>.json`; also
    `state/4-review.json`, `review-c<k>/cited/` (full list: docs/filigree/README.md §4).
  - Done when (angry-sparse gate): on every open-country view at least 2 of 3 blind judges
    (opus/sonnet/opus, fixed A/B order) prefer the dense sheet and each lists ≥3 omissions the DOM
    confirms (named dense, absent with the toggle off); dense counts meet the bible's per-view
    targets and the sparse view carries ≤ a third of the dense names; ≥10/12 fixtures show their six
    and none below 4; zero unsayable names (and the read-aloud finder ran); overlay pulls refetch
    zero base tiles; zero appear-effect pop-ins; zero surviving blocker or major; no lens died in
    round 0; on V1-V6 (dense) no `/sheets/<sheet>/forbidden` class is drawn and every must class
    is; V1 has exactly one shield, at the river town, and zero homestead-class features.
  - Run: `Workflow({name:'filigree-4-review', args:{date:'YYYY-MM-DD'}})`. Optional:
    `args.preview:true` reviews a partial build (findings only, written under
    `docs/filigree/preview/`, never a polish result).
  - Blocked by: Filigree 3 (`gates/3-build.json` pass; a premature run throws "review must wait
    for the finished sheet", an Error treated as blocked).
  - Prerequisites: none. Docs-only. On fail the returned punch items go DIRECTLY ABOVE this entry
    and this item stays unchecked for a re-review (at most 2 cycles, then the owner decides; R16).
    On pass the owner may flip the table map on by default (R18).

- [ ] **Mobile later · census pin names on phones (A12 part b)** — a ranked, delay-not-drop label
  budget for the atlas's own census pins at the whole chart on phones. It reuses the filigree
  collision pass (R2 bounds: desktop threshold + 0.5 zoom); never a second label engine.
  - Blocked by: Filigree 4 passed and the Filigree 3 hold clear.
- [ ] **Mobile later · WebP rasters (OWNER-GATED)** — a WebP q80 cut of the z0-4 pyramids (about
  0.55x the bytes) behind a TILES_V bump and a regenerated offline manifest, after the owner
  eyeballs ink-dense tiles (cities, coasts); no AVIF without a perceptual check. Leave unchecked
  until the owner says go.

### Street view (USER REQUEST): the streamed street view in four jobs, after the table map

The owner's request: a streamed city whose detail emerges as the camera nears (blocks, then houses,
facades and doors), with caravans, crowds, a cloud deck, weather and session overlays as toggled
layers, never cluttering the far zooms, carried into the sim at street level. Research digest
`docs/research/streamed-streets.md`; operator's guide (protocol, invocation, args, outputs, gates,
model/effort pairings, smoke recipe, owner rulings ST1–ST19, what is copied from the filigree
package and how drift is caught) `docs/street/README.md`. Each job is ONE saved workflow, run as its
own polish run in a fresh session; every output and gate record lands in `docs/street/`. A job's
preflight refuses to start unless the previous street gate says `"pass": true`; every gate is scored
by the script from fixed fixtures (frozen camera views, a virtual-clock probe, sim fingerprints),
never by taste. Determinism is a gate: caravan queues, crowds, clouds and shut ways are render-only
keyed streams, and the `simDays(400)` fingerprint must be identical with the street view on, off and
never loaded. This track never edits `maps-site/`, `docs/filigree/` or a filigree script; Street 3
builds only while filigree does not hold the sim and otherwise returns `held`. Use the returned
`polish_note`, `polish_inserts` (placed directly above `polish_inserts_above`) and `changelog_line`
as for the filigree items; queue rules and reason codes (`held`, `blocked`, `prelude drift`):
`docs/street/README.md` §1.
Street 1 and Street 2 sit higher in the queue (below Filigree 2) by the mobile plan of 2026-10-04:
they run
after the mobile sim lane and before Filigree 3; Street 3 and Street 4 stay here.

- [ ] **Mobile · Street 3 device classes gate and phone device record (script)** — street-3-build.js
  job body: read /device_classes. Slice gates at ?dc=phone check quad jobs and triangles per frame
  and resident bytes against the phone class (GS.P7c). The newest docs/street/device-phone/*.json is
  recorded, never gated (GS.Rp: absent = gap). The desktop device reader is unchanged.
  - Done when: parse; node tools/street-drift.js exits 0; the Street 3 `mode:'plan'` preview after
    Street 2 passes; synthetic GS.P7c and GS.Rp cases; review clean.
  - Blocked by: Street 2.

- [ ] **Street 3 · Implementation → the street view (USER REQUEST, MULTI-RUN)** — build
  `street-spec.json`'s units slice by slice (S0 instrument: the STREET block, the `ANNALS.street`
  hook, the default-off row and `street=1`, the probe extension, the seed-parser fix; S1 streaming:
  quads, tiers, queue, LRU, culling, ease; S2 near detail: facades, surface, props; S3 life: caravan
  tiers, render-only queues, crowds, gate leaves; S4 sky and layers: clouds, shadows row, weather
  dial, the R13 fog copy, the herald's tidings). Each run builds up to 6 ready units of the current
  slice, strictly one at a time (every unit holds the `index.html` lock), and runs that slice's
  gate when the slice is complete; everything ships behind the default-off street toggle. Leave
  unchecked between runs with the returned note (`Street 3 slice Sx: n/m units …`); check off only
  when the workflow returns `check_off: true`.
  - Input: `docs/street/street-spec.json` (units, checks, caps, hook lines, contracts) +
    `gates/views.json`, `gates/baseline.json`, `fixtures/tidings.json`.
  - Output: the `/* STREET */` block and the declared hook lines in `index.html`; probe extensions
    in `tools/street-probe.js` (never breaking Street 1's literals); per-unit ledger
    `docs/street/state/3-build/`; slice gates `gates/3-build-S{0..4}.json`, final
    `gates/3-build.json`; also `state/3-build.json`.
  - Done when (walk test, in every slice gate and again in the final S4 gate): the `simDays(400)`
    fingerprint is identical with the street view never loaded, off and on, and with the camera
    walking the views street on and off, for `#s=epeshu` and `#s=tamar1374`; with the toggle off
    every view's draw calls, triangles, geometries, textures and objects equal the reference
    exactly; with it on every view keeps its caps and the far views draw nothing extra; no street
    object pops in one frame or eases longer than 250 ms (R6); each tier swaps once each way;
    oscillating and flying away and back build no extra and leak nothing; zero clock, `W.rng` or
    `nowMs` reads and zero banned vocabulary in the STREET block's strings, every InstancedMesh
    there carries instanceColor, only declared hook lines changed outside it and no declared insert
    hook is duplicated; `ANNALS.stats()` keys, the keys handler and the near plane unchanged; the
    hash table parses (`notices=` never read as the seed); queue positions equal at 30 and 60
    virtual fps; the filigree anchors still resolve and `maps-site/` + `docs/filigree/` are
    byte-unchanged; the slice's spec checks pass; the console stays clean.
  - Run: `Workflow({name:'street-3-build', args:{date:'YYYY-MM-DD'}})`. A unit stuck after 3 failed
    runs is queued once directly above this item (one line); fix it by hand, then re-run with
    `args.unstick ["<id>"]` (or `args.discard ["fix-S<n><k>"]` for an obsolete fix unit, one whose
    dependency can never be met, or a done fix unit queued as `Street 3 stuck criterion <S> <id>`
    because it did not cure its criterion).
  - Blocked by: Street 2 (`gates/2-plan.json` pass, spec unchanged; the filigree density bible and
    the cited filigree rulings unchanged since Street 1; a thrown Error otherwise); open
    `Street data (S3) — …` items (a returned `reason:'blocked'`). **Held** — a returned
    `reason:'held'`: no release, note it, take the next item — while filigree holds the sim:
    `docs/filigree/gates/3-build.json` not a full unforced pass or not fresh against the current
    `sheet-spec.json`, or "Filigree 3" not checked, or any
    unchecked `Filigree 3 stuck unit` / `Filigree 4 punch c` / `Filigree data —` item (with ST15
    strict also until the latest Filigree 4 gate passes).
  - Prerequisites: holds `index.html` while running; never touches `maps-site/`, `docs/filigree/` or
    port 8544.
    "Mobile · Street 3 device classes gate and phone device record (script)" checked.

- [ ] **Mobile · Street 4 phone views and phone device gate (script)** — street-4-review.js job
  body: phone shots and metrics for every frozen view (SV1-SV9) at 390x664 with --class phone, where
  today there are two at 390x844. A phone device gate reads docs/street/device-phone/: median fps ≥
  27 at the 30 fps cap, degradeStep within the phone floor, the current index sha. It is reported
  beside the desktop gate; absent never fails the review; the phone default flip needs pass (ST7,
  ST8).
  - Done when: parse; drift ok; a Street 4 preview after Street 3 passes; synthetic device-phone
    cases (absent, stale, median 26, median 28 within floor); review clean.
  - Blocked by: Street 3.

- [ ] **Street 4 · Review → punch list (USER REQUEST)** — review the finished street view against
  the bible and the spec through eleven single-lens finders (determinism, performance and caps, pop
  and fade, caravan sense, canon and voice, the Marble City, weather and sky, layers and hash,
  phone, where the build flinched, and owner-input fidelity: the clouds, shadows and roads-and-folk
  rows, the weather dial, the herald's tidings, detail emerging on the descent, and the VTT export
  stated out of scope rather than dropped); every finding must carry reproducible evidence and
  survive reproduce + refute + severity.
  - Input: the finished street view (`gates/3-build.json` pass), the bible, the spec, the frozen
    views and caps.
  - Output: `docs/street/punch-list-c<k>.{md,json}` ("Why the bare street is worse", "Where we
    flinched", "Device gate"; the plain `punch-list.{md,json}` is a copy of the latest), findings
    `docs/street/findings/`, capture `docs/street/review-c<k>/` (metrics and cited shots tracked),
    gate `gates/4-review-c<k>.json`; also `state/4-review.json`.
  - Done when (bare-street gate): on SV1, SV2, SV4 and SV7 at least 2 of 3 blind judges
    (opus/sonnet/opus, fixed A/B order) prefer the layered view to the bare one, and each lists ≥3
    omissions that the probe's class counts confirm (present layered, absent bare); fingerprints
    re-measured identical; caps met on all nine views; zero fade violations; zero banned vocabulary
    in new player-facing strings; coexistence with the table map clean; zero surviving blocker or
    major; no lens died in round 0.
  - Run: `Workflow({name:'street-4-review', args:{date:'YYYY-MM-DD'}})`; optional
    `args.preview:true` (findings only, under `docs/street/preview/`, never a polish result).
  - Blocked by: Street 3 (`gates/3-build.json` a full unforced pass with the spec unchanged since
    its final gate, and the cited filigree rulings unchanged; else `review must wait for the
    finished street view`, treated as blocked). A cycle-2 run returns `reason:'blocked'` while a
    cycle-1 punch item is still open.
  - Prerequisites: none (a cycle-2 run is blocked while cycle-1 punch items are open). Docs-only.
    On fail the returned punch items go DIRECTLY ABOVE this entry and this item stays unchecked
    for a re-review (at most 2 cycles, then the owner decides; ST13). Punch items edit `index.html`
    only inside the STREET block or its declared hooks, and may also edit `tools/street-probe.js`;
    they obey the same hold as Street 3 and never edit anything under `docs/street/` (spec,
    `gates/views.json`, `gates/baseline.json`, `fixtures/`). A defect in the spec becomes a re-run
    of street-2-plan, and one in the frozen views, baseline or fixtures a re-run of
    street-1-research; the item's fix then starts with "re-run street-2-plan:" or "re-run
    street-1-research:". The minor-items line cites `docs/street/punch-list-c<k>.md`. On pass the
    owner may flip the street view on by default only after an owner-hardware
    `tools/street-probe.js --device` run records smoothed fps ≥42 and degrade step 0 over a 60 s
    descent on the current `index.html` (ST8; the return names it `device_gate`: pass, fail, absent
    or stale).

- [ ] **Mobile later · the camera clears the sheets (S15)** — set the camera view offset to the
  unobscured rectangle while a sheet is open, counting the bottom speed bar; presentation only.
  - Blocked by: Street 4 passed and the street hold clear (it changes the projection the frozen
    views measure).
- [ ] **Mobile later · far-instance thinning the street spec did not absorb (S2 rest)** — any
  phone-class instance fraction or static-shadow freeze still wanted after Street 4. It must never
  reorder or rewrite instances that W.treeIndex addresses, and never move a per-tree draw out of its
  generation order (SM2).
  - Blocked by: Street 4 passed.
- [ ] **Mobile later · one-finger pan at altitude (OWNER-GATED)** — a map-like one-finger pan high
  above the land, with orbit kept near the ground (brief open question 3); only after the owner's
  real-finger verdict in Mobile 15. Leave unchecked until the owner says go.
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

- [ ] **Street battle sheet (OWNER-GATED, ST10)** — a top-down orthographic export of the current
  street view with a square grid at the scale the owner sets in ST10 (for example 5 ft squares at 70
  px), for the table. A plain polish item, not a workflow job: built inside the STREET block behind
  the street toggle, delegated per `.claude/CLAUDE.md`.
  - Blocked by: an ST10 override in `docs/street/rulings.json` that names the scale (absent =
    blocked: leave unchecked, note "owner ruling ST10", take the next item); Street 4 passed; the
    street hold clear (`docs/street/README.md` §1.3, the same conditions Street 3 checks).
  - Done when (scored by commands; this item adds the `--battle-sheet` flag to the probe without
    changing its other outputs): `node tools/street-probe.js --battle-sheet SV1 --out <tmp>/a.png`
    run twice gives byte-identical PNGs; width and height equal the view's squares times px per
    square; a grid line sits at every px-per-square column and row (each grid column and row is
    darker than both neighbours); the SV1 focus lands on its expected pixel ±1; the `simDays(400)`
    fingerprint is unchanged with and without an export; the STREET-block greps stay clean and only
    declared hook lines change; zero console errors on `#s=epeshu` and `#s=tamar1374`.

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
