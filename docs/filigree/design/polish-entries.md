> **Superseded planning snapshot (2026-10-04).** The live queue text is `POLISH.md` and
> [`../README.md`](../README.md) §1 (reason codes, placement, releases, the on-return table); the two blocks below are
> the original drafts and are **not kept in sync**. Do not re-apply them.

**Where it goes:**
Locate by **title**, never by line number (lines shift between polish runs):
- **Block 1** (the section header + Filigree 1–2) goes immediately after the item starting
  `- [ ] **Traced road network (USER FLAG)**` and before the item starting `- [ ] **Notch safe-areas**`.
- **Block 2** (Filigree 3–4) goes immediately after the item starting `- [ ] **Census second pass` and before the
  `## Done` heading.
- Every title that Job 1's q17 searches for exists in `POLISH.md` today (checked 2026-10-04): "Traced road network",
  "Census second pass", "Uncharted-band softening", "Data fetch cache-busting", "Tier-hidden markers", "Region-chart
  zoom-through", "Sim ↔ atlas continuity". If a later polish run renames one, q17 reports it as a finding.

**Delivery order (prerequisite to adding these items).** The POLISH items are added **last**, in the same release
that commits everything they run: `.claude/workflows/filigree-1-research.js` … `filigree-4-review.js` (each starting
`export const meta = {` on line 1), `docs/filigree/README.md`, `research-dossier.md`, `todo-inputs.json`,
`rulings.json`, the design docs under `docs/filigree/design/` (so the specification lives in the repo, not in a
scratchpad), the `.gitignore` entries for the bulk-capture directories, and `docs/research/cartographic-filigree.md`.
Until that release lands, do not add the items: a "Run:" line with nothing to run would fail Job 1's preflight
(`missing inputs`).

Why this placement:
- Jobs 1 and 2 are docs-only, so they start soon without pre-empting the older owner flag.
- Jobs 3 and 4 sit below every data prerequisite: the road network, uncharted-band softening, cache-busting,
  tier-hidden clicks, sim↔atlas and the census ("pretty maps do not fix bad data").

---

### Block 1: insert after the Traced road network item

```markdown
### Filigree for the Table (USER REQUEST): the table map in four jobs, strictly in order

Owner's brief `docs/research/filigree-for-the-table.pdf`; operator's guide (invocation, args, outputs,
model/effort pairings, smoke recipe, owner rulings) `docs/filigree/README.md`. Each job is ONE saved
workflow, run as its own polish run in a fresh session; every output and gate record lands in
`docs/filigree/` (never the scratchpad). A job's preflight refuses to start unless the previous job's gate
file says `"pass": true` ("do not let planning start before the density bible exists"); every gate is
scored by the script from fixed fixtures, never by taste ("do not let review become a vibe check"). Use the
returned `polish_note` as the result note, `polish_inserts` as new items, `changelog_line` in the release.
Queue rules for these items:
- `reason:'blocked'` (a prerequisite is unchecked): leave the item unchecked with the note and take the
  next unchecked item. This is the rule for these items, not the "another workflow holds the file" escape.
- `reason:'infra'` (sandbox, browser or CDN failure): no release; note it; the next run retries.
- A gap a filigree run finds that blocks a LATER filigree job goes directly above that job, not at the bottom.
- Docs-only runs (Jobs 1, 2 and 4 without fixes) still cut a patch release with a `docs:` CHANGELOG line.
- Owner rulings ship with defaults (embedded in each script; owner overrides go in `docs/filigree/rulings.json`,
  shape `{"date":"…","overrides":{},"confirmed":[]}`). Job 1 uses the defaults and does not need the file or any
  confirmation; confirm R1, R5, R6, R7, R9 and R18 before Filigree 2 if you want other than the defaults.
  Agents never run git.
- The release commit for a filigree run contains `docs/filigree/**` (bulk shots are git-ignored), any new tool such as
  `tools/filigree-dem.js`, and the `CHANGELOG.md` + `VERSION` bump, per `.claude/CLAUDE.md` "Versioning & release
  workflow".
- On return, act on the result by this table (`pass`, `reason` are fields of the returned object):

  | Returned | Do |
  |---|---|
  | `pass:true` (Job 1, 2, 4) or `check_off:true` (Job 3) | check the box; write `polish_note` as the result note; cut a `docs:` patch release |
  | `pass:false`, no `reason` special-case (gate failed on its criteria) | leave unchecked with `polish_note`; insert `polish_inserts` directly above the next filigree job (Job 1 gaps above Filigree 2, Job 2 data items above Filigree 3, Job 3 stuck units above Filigree 3, Job 4 punch items above Filigree 4); commit `research/`, `gates/` and `state/` (the resume cache); cut a `docs:` release |
  | `reason:'blocked'` | leave unchecked with the note; take the next item; no release (Job 3 only) |
  | `reason:'infra'` or `'agent died: …'` | no release; do not commit a half-written `research/`; note it; the next run retries |
  | `reason:'mask-leak'` | leave unchecked; no fix units; note it (capture fault) |
  | `reason:'record-mismatch'` | write the returned gate object (2-space indent, trailing newline) to the path in `gate_path`, re-read and `JSON.parse` it, then treat as the `pass` row it carries |
  | `reason:'nothing to build'` (Job 3) | the slice work is already complete; check the box if `check_off` is true |
  | Workflow tool missing / name does not resolve | use `scriptPath` with the absolute path; if the tool itself is absent, treat as `infra` |

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
    `tools/filigree-dem.js`; gate record `docs/filigree/gates/1-research.json`.
  - Done when (blank-hex gate): two blind appliers on different models (sonnet/high, opus/high), holding
    only the bible and the crops of the 12 fixed z7 hexes F01–F12, each classify every hex and name six
    bible classes as instances on it whose source refs resolve (DEM, data file, print pixel or mint key,
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
  - Prerequisites: the delivery release above (scripts, README, dossier, todo-inputs, rulings, design docs
    committed). Docs + a read-only probe tool; never edits `index.html` or `maps-site/index.html`. If the dotted
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
    `gates/2-plan.json`.
  - Done when (cold-cartographer gate): two drafters on different models that may read ONLY
    `sheet-spec.{md,json}` + the base crops answer the probes frozen before the spec existed at ≥90%
    each, and draw sheet one (the region sheet over the north coast) as SVG whose layers follow the
    spec's paint order exactly, with every must class, no forbidden class, palette hexes only and exactly
    one shield at the river town; zero spec-silent decisions; zero blocking divergences between the two
    drafts; `sheet-spec.md` names no source post outside `## Provenance`; every bible must-rule traces to
    a spec rule and every spec rule to a build unit with machine-checkable acceptance. At most 2 fix rounds.
  - Run: `Workflow({name:'filigree-2-plan', args:{date:'YYYY-MM-DD'}})`.
  - Blocked by: Filigree 1 (preflight refuses unless `gates/1-research.json` passed and the bible is
    unchanged since).
  - Prerequisites: owner glance at rulings R1, R5, R6, R7, R9, R18 (defaults apply otherwise). Docs-only.
```

### Block 2: insert after the Census second pass item, before `## Done`

```markdown
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
    `docs/filigree/state/3-build/`, slice gates `gates/3-build-{A,B,C,D}.json`, final `gates/3-build.json`.
  - Done when (hand test, inside the slice B gate and again in the final slice D gate): with the
    settlement covered by an opaque disc (and every other town in view disc'd) on 3 fixed views, two
    navigators on different models that see only the screenshot answer ≥80% of frozen, data-computed route
    questions by ridge names, read ≥70% of the visible landform labels, see ≥6 named heights outside the
    mask, and cannot name the covered town; plus ≥10/12 fixture hexes show their six, overlay toggles
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
    record `gates/4-review-c<k>.json`.
  - Done when (angry-sparse gate): on every open-country view at least 2 of 3 blind judges
    (opus/sonnet/opus, fixed A/B order) prefer the dense sheet and each lists ≥3 omissions the DOM confirms
    (named dense, absent with the toggle off); dense counts meet the bible's per-view targets and the
    sparse view carries ≤ a third of the dense names; ≥10/12 fixtures show their six; zero unsayable names;
    overlay pulls refetch zero base tiles; zero appear-effect pop-ins; zero surviving blocker or major.
  - Run: `Workflow({name:'filigree-4-review', args:{date:'YYYY-MM-DD'}})`.
  - Blocked by: Filigree 3 (`gates/3-build.json` pass).
  - Prerequisites: none. Docs-only. On fail the returned punch items go DIRECTLY ABOVE this entry and this
    item stays unchecked for a re-review (at most 2 cycles, then the owner decides; R16). On pass the owner
    may flip the table map on by default (R18).
```
