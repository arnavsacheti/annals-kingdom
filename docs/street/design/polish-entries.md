# POLISH.md entries for the street track (exact markdown, placement, delivery order)

> Planning snapshot, 2026-10-04 (final integrated plan). The live queue text is `POLISH.md`; the protocol is
> `docs/street/README.md` §1. Applied by the central session, never by an agent (filigree README §1.8).

## Placement (by title, never by line number)

Insert the block below **as one unit**, directly below the last line of the entry
`- [ ] **Filigree 4 · Review → punch list (USER REQUEST)**` (its last sub-bullet ends
`On pass the owner may flip the table map on by default (R18).`) and directly above the line `## Done`, with exactly
one blank line before the `###` heading and one blank line after the last item.

**Status.** This file is a plan until its delivery order (below, steps 0–5) has landed as one commit. Before applying
the block, check that every path named in an `Input:` or `Run:` line exists: `ls .claude/workflows/street-1-research.js
.claude/workflows/street-2-plan.js .claude/workflows/street-3-build.js .claude/workflows/street-4-review.js
docs/street/README.md docs/street/research-dossier.md docs/street/todo-inputs.json docs/street/rulings.json
docs/research/streamed-streets.md tools/street-drift.js && node tools/street-drift.js`. Note the delivery release tag
(`vX.Y.Z-alpha.N`) in `CHANGELOG.md` so the prerequisite is checkable. Without all of it, a run dies at Workflow name
resolution or at the `missing inputs` preflight.

Why there, and nowhere else:
- It is the bottom of the queue, so no filigree item moves and the strict Filigree 1 → 4 order is untouched: the
  owner's table map keeps its priority, and nothing street-side is inserted between the filigree jobs.
- The queue's own rule (POLISH.md header: "each run takes the TOP unchecked item only … If another workflow holds the
  target file, take the next non-conflicting item instead") reaches Streets 1–2 early only while every filigree item
  above is checked or refused: Filigree 2 runnable, a multi-run Filigree 3 between runs, or Filigree 4 all outrank
  Street 1 until they are done or refuse (Filigree 3 on its data prerequisites, R11; Filigree 4 throwing "review must
  wait"). Then a polish run takes the next unchecked item, which is Street 1 (docs + a read-only tool; it reads
  `index.html` but holds no app file). To run a street job out of order, move its entry above the filigree items or
  invoke the Workflow explicitly; an explicit invocation is still gated by the job's preflight.
- Street 3 is the only street job that writes `index.html`; at the bottom of the queue it is reached only when every
  item above is checked or refused, and its own code-scored hold (`reason:'held'`) refuses even if the owner reorders
  the queue.
- Filigree inserts never land inside this block: Filigree 1 gaps go above Filigree 2, Filigree 2 data items and
  Filigree 3 stuck units above Filigree 3, Filigree 4 punch items above Filigree 4 (R16). Street inserts stay inside
  it: `Street gap` items above Street 2, `Street data (S3)` items and stuck units above Street 3, punch items above
  Street 4.

No existing POLISH.md line changes (a `git diff POLISH.md` shows only added lines, all inside this block).

## The block (verbatim)

```markdown
### Street view (USER REQUEST): the streamed street view in four jobs, after the table map

The owner's request: a streamed city whose detail emerges as the camera nears (blocks, then houses, facades and
doors), with caravans, crowds, a cloud deck, weather and session overlays as toggled layers, never cluttering the far
zooms, carried into the sim at street level. Research digest `docs/research/streamed-streets.md`; operator's guide
(protocol, invocation, args, outputs, gates, model/effort pairings, smoke recipe, owner rulings ST1–ST19, what is
copied from the filigree package and how drift is caught) `docs/street/README.md`. Each job is ONE saved workflow, run
as its own polish run in a fresh session; every output and gate record lands in `docs/street/`. A job's preflight
refuses to start unless the previous street gate says `"pass": true`; every gate is scored by the script from fixed
fixtures (frozen camera views, a virtual-clock probe, sim fingerprints), never by taste. Determinism is a gate:
caravan queues, crowds, clouds and shut ways are render-only keyed streams, and the `simDays(400)` fingerprint must be
identical with the street view on, off and never loaded. This track never edits `maps-site/`, `docs/filigree/` or a
filigree script; Street 3 builds only while filigree does not hold the sim and otherwise returns `held`. Use the
returned `polish_note`, `polish_inserts` (placed directly above `polish_inserts_above`) and `changelog_line` as for
the filigree items; queue rules and reason codes (`held`, `blocked`, `prelude drift`): `docs/street/README.md` §1.

- [ ] **Street 1 · Research → street bible (USER REQUEST)** — measure and read what the street view must stand on:
  write the probe (`tools/street-probe.js`: its own read-only server, a virtual clock that makes calls, triangles,
  object counts and sim fingerprints exact); freeze nine camera views SV1–SV9 of Epēshu and the procedural seed
  `tamar1374` (the Forum, the gate at the dark hour, a ward, a bridge where caravans queue, the far band, a door at
  R 9, a procedural town, Wood Quay in weather, the far sky) and the street-off baseline at each; answer fourteen
  targeted questions, q02–q15 (q01 is the probe itself; topics in order q02–q15: the clocks and the dark hour, caravans and a stateless queue, every determinism debt, street
  data, facades and instancing, LOD and the near plane, keys, hash and the seed writers, weather and the R13 fog source,
  the R12 notices, Epēshu canon, Patrinaic words, shadows and the degrade ladder, r128 facts, the class map; the id-to-topic
  table is README §5.1 / design §3.1); then a
  street bible mapping each of the 17 pieces and 10 bronze-age analogues to classes with their driving state
  (seeded gen, sim read-only, keyed render, notice), reusing the filigree density bible's class ids. A bible, not a
  renderer.
  - Input: `docs/street/research-dossier.md`, `docs/street/todo-inputs.json`, `docs/research/streamed-streets.md`,
    `index.html`, `docs/filigree/density-bible.json` and `maps-site/data/` (read-only), `lexicon/patrinaic.json`.
  - Output: `docs/street/street-bible.{md,json}`; evidence `docs/street/research/q01–q15.json`; the probe
    `tools/street-probe.js`; frozen fixtures `docs/street/gates/views.json` + `gates/view/SV1–SV9.jpg` and the baseline
    `gates/baseline.json`; gate record `docs/street/gates/1-research.json`; also `gates/1-view-answers.json`,
    `state/1-research.json` (full list: `docs/street/README.md` §4).
  - Done when (blank-street gate): two blind appliers on different models (sonnet/high, opus/high), holding only the
    bible, the frozen views and their stills, the baseline and greps of `index.html`, each name for every gate view
    SV1–SV8 (SV9, the far sky, is measured and frozen but not scored) the tier the bible's rule gives and six bible classes that must be present there, each with the bible's
    driving state and a source ref that resolves (sim literal, keyed-stream key, notice class, probe metric or filigree
    class id): tier exact 8/8; class agreement ≥5/6 on ≥7 of 8 views and ≥4/6 on all; ≥5 of 6 refs resolve per applier
    per view and ≥90% overall; zero "bible silent"; checklist 27/27; the bible declares no new sim state and lists every
    determinism debt the grep finds; caps ceilings numeric for SV1–SV9 and at or above the baseline; the probe is
    deterministic on a double run and its fingerprint changes when one caravan's departure day moves; zero banned
    vocabulary; at most 2 follow-up rounds, else leave unchecked with the returned `polish_inserts` (`Street gap — …`,
    directly above Street 2; skip any already queued).
  - Run, in a fresh session: `Workflow({name:'street-1-research', args:{date:'<today, YYYY-MM-DD, from the session
    environment>'}})` (today = the date the session environment reports, e.g. `date +%F`); if the name does not resolve, use
    `scriptPath:'/home/user/annals-kingdom/.claude/workflows/street-1-research.js'`. Optional first step: the same call
    with `mode:'plan'` (not a polish result); compare `agents_bound` with README §11 (180; plan mode needs Filigree 1 passed too) and stop if it grew. A thrown
    `prelude drift: …`, `anchor lost: …` or `missing inputs: …` is a run fault: no release, note it, fix per README §12
    (never by editing a filigree script). On a rerun keep `resume:true`: frozen views are never re-frozen
    (`fixtures changed; delete docs/street/gates/views.json and docs/street/gates/view/ to re-freeze`).
  - Blocked by: Filigree 1 (`docs/filigree/gates/1-research.json` pass, full, unforced, bible unchanged; otherwise the
    preflight throws `street research waits for the density bible …`, treated as blocked; this holds for `mode:'plan'`
    too, so the plan-mode check cannot be done before Filigree 1 passes). Thrown-string classes (blocked, run fault,
    infra): `docs/street/README.md` §1.6. Prefer running Street 1 after Filigree 3 is checked: the frozen views and the
    baseline are measured from the live `index.html`, and if Filigree 3 moves the sim afterwards Street 3 re-baselines or
    stops with `fixtures changed; delete …` (README §12). After a later Filigree 1 re-run, re-run Street 1 with
    `resume:true` (README §12).
  - Prerequisites: the street delivery commit (scripts, `tools/street-drift.js`, README, dossier, todo-inputs, rulings,
    design docs) is in the checkout; verify with `ls .claude/workflows/street-1-research.js docs/street/README.md
    tools/street-drift.js && node tools/street-drift.js`, and look for the delivery tag in `CHANGELOG.md`. Docs + the read-only probe; never edits `index.html`, `maps-site/**` or
    `docs/filigree/**`.

- [ ] **Street 2 · Planning → street spec (USER REQUEST)** — from the street bible alone: the tiers and the refine rule
  (screen-space error off `CAM.radius`, hand-rolled in/out hysteresis pairs inside the settlement band), the streaming
  queue (quads a pure function of seed and quad id, ≤6 jobs and a triangle cap per frame, an LRU with dispose that
  stays coarse when full, own culling), the ≤250 ms ease (R6), near facades and the street surface (Epēshu marble per
  ST12, ruts, kerbs, thresholds, ground on the grid per R22), instanced stalls, carts and crowds, render-only caravan
  queues (spacing at donkey pace, fords and one-lane bridges crossed in turn, toll halts as a dwell, gate leaves shut
  while the drawn dark hour lasts), the sky (cloud deck and shadows row, the weather dial, the R13 fog copy), the
  layers rows and `street=1` (default off, R18), the seed-parser fix (ST18) before `notices=` (R12) is read, the
  herald's tidings, per-view caps, the determinism contract, the STREET block and its declared hook lines, and build
  units in slices S0 instrument / S1 streaming / S2 near detail / S3 life / S4 sky and layers.
  - Input: `docs/street/street-bible.{md,json}`, `gates/views.json`, `gates/baseline.json`; the filigree notices
    contract (read-only).
  - Output: `docs/street/street-spec.{md,json}` (+ section drafts `spec/`); probes `gates/2-probes.json` (frozen before
    the spec exists); the tidings fixture `fixtures/tidings.json` (frozen); gate record `gates/2-plan.json`; also
    `cold/`, `state/2-plan.json`.
  - Done when (cold-engineer gate): two blind readers on different models (sonnet/high, opus/high) that may read ONLY
    `street-spec.{md,json}` answer the probes frozen before the spec existed at ≥90% each, with zero schema-path
    guesses; no spec-probe pointer is null; every bible must-rule traces to a spec rule and every spec rule to a unit
    with machine-checkable acceptance; the unit DAG is acyclic with ≤9 units per slice and unit files only
    `index.html`, `tools/street-*.js` and `docs/street/**`; every slice has a `/checks` list with the mandatory checks;
    caps for SV1–SV9 within the bible ceiling, the far views equal to the baseline; the determinism contract allows
    only keyed streams and read-only sim state; every hook line is declared, marked and holds no filigree anchor
    literal; new hash params never end in `s` and `notices=` is read only after the S0 parser unit; no source-post
    name outside `## Provenance`; zero banned vocabulary. At most 2 fix rounds.
  - Run: `Workflow({name:'street-2-plan', args:{date:'YYYY-MM-DD'}})`.
  - Blocked by: Street 1 (`docs/street/gates/1-research.json` pass, bible unchanged; the filigree density bible and the
    cited filigree rulings unchanged since Street 1; a thrown Error otherwise, treated as blocked).
  - Prerequisites: owner glance at ST1, ST2, ST5, ST8, ST10, ST12 (defaults apply otherwise). Docs-only. Data items it
    finds go directly above Street 3 as `Street data (S3) — …`.

- [ ] **Street 3 · Implementation → the street view (USER REQUEST, MULTI-RUN)** — build `street-spec.json`'s units slice
  by slice (S0 instrument: the STREET block, the `ANNALS.street` hook, the default-off row and `street=1`, the probe
  extension, the seed-parser fix; S1 streaming: quads, tiers, queue, LRU, culling, ease; S2 near detail: facades,
  surface, props; S3 life: caravan tiers, render-only queues, crowds, gate leaves; S4 sky and layers: clouds, shadows
  row, weather dial, the R13 fog copy, the herald's tidings). Each run builds up to 6 ready units of the current slice,
  every `index.html` unit strictly one at a time, and runs that slice's gate when the slice is complete; everything
  ships behind the default-off street toggle. Leave unchecked between runs with the returned note
  (`Street 3 slice Sx: n/m units …`); check off only when the workflow returns `check_off: true`.
  - Input: `docs/street/street-spec.json` (units, checks, caps, hook lines, contracts) + `gates/views.json`,
    `gates/baseline.json`, `fixtures/tidings.json`.
  - Output: the `/* STREET */` block and the declared hook lines in `index.html`; probe extensions in
    `tools/street-probe.js` (never breaking Street 1's literals); per-unit ledger `docs/street/state/3-build/`; slice
    gates `gates/3-build-S{0..4}.json`, final `gates/3-build.json`; also `state/3-build.json`.
  - Done when (walk test, in every slice gate and again in the final S4 gate): the `simDays(400)` fingerprint is
    identical with the street view never loaded, off and on, and with the camera walking the views street on and off,
    for `#s=epeshu` and `#s=tamar1374`; with the toggle off every view's draw calls, triangles, geometries and objects
    equal the reference exactly; with it on every view keeps its caps and the far views draw nothing extra; no street
    object pops in one frame or eases longer than 250 ms (R6); each tier swaps once each way; oscillating and flying
    away and back build no extra and leak nothing; zero clock, `W.rng` or `nowMs` reads in the STREET block, every
    InstancedMesh there carries instanceColor, and only declared hook lines changed outside it; `ANNALS.stats()` keys,
    the keys handler and the near plane unchanged; the hash table parses (`notices=` never read as the seed);
    queue positions equal at 30 and 60 virtual fps; the filigree anchors still resolve and `maps-site/` +
    `docs/filigree/` are byte-unchanged; the slice's spec checks pass; the console stays clean.
  - Run: `Workflow({name:'street-3-build', args:{date:'YYYY-MM-DD'}})`. A unit stuck after 3 failed runs is queued once
    directly above this item; fix it by hand, then re-run with `args.unstick ["<id>"]` (or `args.discard
    ["fix-S<n><k>"]` for an obsolete fix unit).
  - Blocked by: Street 2 (`gates/2-plan.json` pass, spec unchanged; a thrown Error otherwise); open
    `Street data (S3) — …` items (a returned `reason:'blocked'`). **Held** — a returned `reason:'held'`: no release,
    note it, take the next item — while filigree holds the sim: `docs/filigree/gates/3-build.json` not a full unforced
    pass, or "Filigree 3" not checked, or any unchecked `Filigree 3 stuck unit` / `Filigree 4 punch c` /
    `Filigree data —` item (with ST15 strict also until the latest Filigree 4 gate passes).
  - Prerequisites: holds `index.html` while running; never touches `maps-site/`, `docs/filigree/` or port 8544.

- [ ] **Street 4 · Review → punch list (USER REQUEST)** — review the finished street view against the bible and the spec
  through eleven single-lens finders (determinism, performance and caps, pop and fade, caravan sense, canon and voice,
  the Marble City, weather and sky, layers and hash, phone, where the build flinched, and owner-input fidelity: the
  clouds, shadows and roads-and-folk rows, the weather dial, the herald's tidings, detail emerging on the descent, and
  the VTT export stated out of scope rather than dropped); every finding must carry reproducible evidence and survive
  reproduce + refute + severity.
  - Input: the finished street view (`gates/3-build.json` pass), the bible, the spec, the frozen views and caps.
  - Output: `docs/street/punch-list.{md,json}` ("Why the bare street is worse", "Where we flinched", "Device gate"),
    findings `docs/street/findings/`, capture `docs/street/review-c<k>/` (metrics and cited shots tracked), gate
    `gates/4-review-c<k>.json`; also `state/4-review.json`.
  - Done when (bare-street gate): on SV1, SV2, SV4 and SV7 at least 2 of 3 blind judges (opus/sonnet/opus, fixed A/B
    order) prefer the layered view to the bare one, and each lists ≥3 omissions that the probe's class counts confirm
    (present layered, absent bare); fingerprints re-measured identical; caps met on all nine views; zero fade
    violations; zero banned vocabulary in new player-facing strings; coexistence with the table map clean; zero
    surviving blocker or major; no lens died in round 0.
  - Run: `Workflow({name:'street-4-review', args:{date:'YYYY-MM-DD'}})`; optional `args.preview:true` (findings only,
    under `docs/street/preview/`, never a polish result).
  - Blocked by: Street 3 (`gates/3-build.json` pass; else `review must wait for the finished street view`, treated as
    blocked).
  - Prerequisites: none. Docs-only. On fail the returned punch items go DIRECTLY ABOVE this entry and this item stays
    unchecked for a re-review (at most 2 cycles, then the owner decides; ST13). Punch items edit `index.html` only
    inside the STREET block or its declared hooks and obey the same hold as Street 3. On pass the owner may flip the
    street view on by default only after an owner-hardware `tools/street-probe.js --device` run records smoothed fps
    ≥42 and degrade step 0 over a 60 s descent (ST8; the return names it `device_gate`).

- [ ] **Street battle sheet (OWNER-GATED, ST10)** — a top-down orthographic export of the current street view with a
  square grid at the scale the owner sets in ST10 (for example 5 ft squares at 70 px), for the table. A plain polish
  item, not a workflow job: built inside the STREET block behind the street toggle, delegated per `.claude/CLAUDE.md`.
  - Blocked by: an ST10 override in `docs/street/rulings.json` that names the scale (absent = blocked: leave unchecked,
    note "owner ruling ST10", take the next item); Street 4 passed; the street hold clear (`docs/street/README.md`
    §1.3, the same conditions Street 3 checks).
  - Done when (scored by commands; this item adds the `--battle-sheet` flag to the probe without changing its other
    outputs): `node tools/street-probe.js --battle-sheet SV1 --out <tmp>/a.png` run twice gives
    byte-identical PNGs; width and height equal the view's squares times px per square; a grid line sits at every
    px-per-square column and row (each grid column and row is darker than both neighbours); the SV1 focus lands on its
    expected pixel ±1; the `simDays(400)` fingerprint is unchanged with and without an export; the STREET-block greps
    stay clean and only declared hook lines change; zero console errors on `#s=epeshu` and `#s=tamar1374`.
```

## Delivery order (the session that lands this plan)

0. **Atomicity.** Delivery is one atomic step: before the scratchpad is lost, `docs/street/research-dossier.md` and
   `docs/street/todo-inputs.json` must be written (impl-units D3/D4) and committed with everything else. `impl-units.json`,
   the `approach-*.md` files, the stub harness and the generators are disposable build inputs: they are not committed and
   nothing committed refers to them.
1. **Snapshot** (central, before any unit runs): `sha256sum .claude/workflows/filigree-*.js POLISH.md index.html` and a
   tree digest of `docs/filigree/**` and `maps-site/**` into the session scratchpad.
2. **Implementation units** (`impl-units.json`, sequential where a unit depends on another; agents never run git):
   `tools/street-drift.js` first (a byte copy, self-tested), then `street-1-research.js` (it carries the prelude), then
   the other three scripts, then the docs and data copies, `.gitignore`, the digest and its index line.
3. **Verification** (central): `docs/street/README.md` §8 (a)–(e) on the street scripts, §8 (d) on the filigree scripts
   (unchanged), `node tools/street-drift.js` and `--self-test`, the plan-mode stubs of every script
   (`street-plan/stubrun-street.js`), `git diff --stat` empty for `.claude/workflows/filigree-*.js`, `docs/filigree/`,
   `maps-site/` and `index.html` (compare with the step-1 snapshot).
4. **Central edits last**: the one-line `.claude/CLAUDE.md` Process pointer (`digest-brief.md`), then this POLISH.md
   block, so no "Run:" line ever names a script that is not in the checkout.
5. **One delivery commit** and a version cut per `.claude/CLAUDE.md` (the four scripts, `tools/street-drift.js`,
   `docs/street/**`, the digest + index line, `.gitignore`, `.claude/CLAUDE.md`, POLISH.md; `CHANGELOG.md` line
   `- docs: queue the street view as four saved workflows (street-1..4) behind the filigree hold`).
