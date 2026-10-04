> Planning snapshot (2026-10-04). The script in .claude/workflows/ is the source of truth; later fixes are not back-ported here.

# Design — `.claude/workflows/filigree-3-build.js` (Job 3: Implementation → the table map, MULTI-RUN)

Implements brief p5 "3. Implementation".
- **Input:** the sheet spec.
- **Output:** the table map.
- **Paint order:** relief → contours (tight enough to read as fingerprints) → water → rust coast road → green
  reserves → homestead dots → names and heights → city grain → fog washes last.
- **Overlays:** built as separate sheets (old survey, structures, caravan halts, blazed paths, muster days, shut ways).
- **Rules:** do not generalize a ridge to save ink; if a knoll has no name, invent one.
- **Done when:** you can cover the settlement with a hand and still navigate by ridge names.

**§0 prelude:** paste the fenced block from `workflow-1-research.md` §0 verbatim. `const JOB = 'filigree-3-build'`
goes above it.

The build runs in four **slices**, each with its own executable gate. Every run builds up to `maxUnits` ready units
of the current slice. When the slice is complete, the run executes the slice gate. Slice D's gate is the final gate
(`gates/3-build.json`).
- A: ground
- B: ink, where the hand test lives
- C: city
- D: stack

## meta
```js
export const meta = {
  name: 'filigree-3-build',
  description: 'Filigree Job 3: build the table map from sheet-spec.json units, slice by slice (A ground, B ink, C city, D stack); gate = hand test + slice gates',
  whenToUse: 'Run as the POLISH item "Filigree 3 · Implementation → the table map" (multi-run) after gates/2-plan.json passed: Workflow({name:"filigree-3-build", args:{date:"YYYY-MM-DD"}}). Holds maps-site/index.html while running.',
  phases: [
    {title: 'Preflight', detail: 'spec gate + spec unchanged; ledger; slice; prerequisites (R11); re-anchor'},
    {title: 'Build', detail: 'topo + paint-order schedule, per-file locks; implement -> syntax -> accept -> fix<=2 -> determinism -> unit record'},
    {title: 'Smoke', detail: 'sim (#s=epeshu + a procedural seed, simDays 400) and atlas views on/off, zero console errors'},
    {title: 'Slice gate', detail: 'capture metrics + spec checks + determinism; scored in code per slice'},
    {title: 'Hand test', detail: 'frozen computed questions; masked captures; paired blind navigators; scored in code'},
    {title: 'Fix units', detail: 'diagnoser -> fix units -> rebuild -> re-gate (<= maxRounds)'},
    {title: 'Record', detail: 'state/3-build.json, gates/3-build-<slice>.json, gates/3-build.json when D passes'}
  ]
}
const JOB = 'filigree-3-build'
```

## Args
- Shared (§0), plus `force` (a reason string). `force` skips the Job 2 gate check, and the result can never pass.
- Job-specific args, with validation. Any violation → `die`. The body starts with
  `checkArgs(['maxUnits','units','slice','gate','overridePrereqs','port','unstick','discard'])`; `units` must be an array of strings,
  `slice`/`gate` must be one of the listed values, `overridePrereqs` a boolean (no truthy coercion).

| arg | default | rule |
|---|---|---|
| `maxUnits` | 8 | integer 1..20 |
| `units` | — | array of unit ids. Each must exist in the current slice and be ready, else `die` |
| `slice` | first slice whose `gates/3-build-<S>.json` is not pass | 'A'..'D'. `die` if an earlier slice has not passed |
| `gate` | `'auto'` | `'auto'` runs the slice gate when every unit of the slice is done. `'skip'` never runs it. `'only'` runs no build, only the gate |
| `overridePrereqs` | false | boolean (R11). Lets slice **A only** run before the road network and the census second pass are checked |
| `port` | 8544 | integer 1024..65535 |
| `unstick` | — | array of unit id strings; each unit's `runs_failed` is reset to 0 for this run (use after fixing a stuck unit by hand) |
| `discard` | — | array of `fix-<slice><n>` ids; each ledger file is marked `discarded` (an obsolete fix unit) |

## Agents and schemas

### Preflight (phase `Preflight`; mech, `crit`)
The prompt is `RULE` + `ANCHOR_TASK`, plus these reads:
- `${OUTABS}/gates/2-plan.json` `pass`, plus its recorded spec sha vs the current `sheet-spec.json`.
- From `sheet-spec.json`:
  - `units`, `slice_classes`, `checks`, `generators`, `hook.pre_filigree_panes`;
  - `city_rule.label_cap`, `paint.pooled_edge.delta_lum` and `/paint_order` (as `paint_order_ids`). The preflight no
    longer returns `slices` or `fixtures`, so its PRE schema is smaller.
- From the bible: `ground_classes`, with their six and exemptions, and `classes[].min_per_cell`.
- `gates/1-hex-answers.json`: the agreed ground class per fixture.
- `state/3-build/*.json`: per unit `{status, attempts, runs_failed, spec_sha256}`, plus any `fix-*` units with status
  `pending`, `failed` or `infra` (the whole unit objects, since the diagnoser's units live only there). A pending fix unit
  that fails validation (id, slice, `failed_criterion`) is ignored at preflight, and a unit with no acceptance never passes.
- Pass flags of `gates/3-build-{A,B,C,D}.json` and `gates/3-build.json`. A gate whose recorded `sheet-spec.json` sha differs from the current spec counts as not passed, and a done unit stamped with a different `spec_sha256` is re-queued (records written before the stamp are kept).
- `gates/3-handtest-questions.json`: present, plus its sha.
- POLISH prerequisites, **found by title text**:
  - `roads` = the "Traced road network" item is `[x]`;
  - `census` = the "Census second pass" item is `[x]`;
  - `rivers_ready` = `maps-site/data/rivers.json` exists.
- Whether the FILIGREE block markers `/* FILIGREE */` and `/* /FILIGREE */` are present in `maps-site/index.html`.

Schema: an object with these keys, all required. Inner objects are typed loosely, never as a bare `{}`: use
`additionalProperties` with a union type (`["string","number","boolean","array","object","null"]`) for the free-form
ones, and concrete `properties` where the script reads a field (`ground.<F>.six`, `slice_pass.*`, `prereq.*`,
`handq.present`):
- `spec_gate_pass`, `spec_sha_ok`
- `units`, `slice_classes`, `checks`, `generators`, `pre_filigree_panes`, `paint_order_ids`, `label_cap`, `edge_delta`
- `ground`: `{F01:{ground_class, six:[…], exempt:bool, min:{class:n}}}`
- `ledger`, `slice_pass:{A,B,C,D,final}`
- `handq:{present, sha}`
- `prereq:{roads, census, rivers_ready}`
- `block_markers:bool`, `anchors`, `rulings_overrides`

Script logic:
- In `full` mode, `!(spec_gate_pass && spec_sha_ok) && !FORCE` → `die('build must not start before the sheet spec passed its gate (gates/2-plan.json), or the spec changed since')`. In smoke, plan and forced runs this is only logged; plan mode reports it as `chain_ok:false`, and the plan result also carries `blocked_by` and `spec_gap`.
- `S` = `A.slice` validated, else the first of A–D whose `slice_pass[S]` is false. If all four have passed and `final` is true → `return done({pass:true, reason:'nothing to build', check_off:true (unforced full run), polish_note:'Filigree 3 complete (gates/3-build.json pass)'})`; in plan mode it returns `reason:'plan'` with `nothing_to_build:true` and an empty schedule.
- **Prerequisites (R11).** If `!(roads && census)`:
  - `S === 'A' && A.overridePrereqs` → continue, and log it;
  - otherwise → `return done({pass:false, reason:'blocked', blocked_by:[…missing], polish_note:'blocked: waiting on ' + names})` (full and smoke runs; in plan mode it is logged and reported as `blocked_by`, never returned as `blocked`).
- A full, unforced run with no `/checks/<S>` (for slice D, none for any slice) → `die('sheet-spec.json has no /checks for slice <S>: Job 2 (section s12) must write per-slice checks; re-run Job 2')`; smoke, plan and forced runs only log it.
- `mode:'plan'` → return the schedule. The bound per run is the sum of the per-phase maxima: Preflight 2, Build 12·(maxUnits + ROUNDS·4) (the 12 per unit includes `crit` retries and the record `crit` retry; fix-unit builds are counted here), Smoke 2·(1+ROUNDS), Slice gate 3·(1+ROUNDS), Hand test 6 + 14·(1+ROUNDS) on slices B and D only (6 = question writer, redo and publish), Fix units 6·ROUNDS, Record 7. At `maxUnits:8`, `ROUNDS:2` that is 228 for slices A and C and 276 for B and D; the plan `polish_note` prints the computed figure.

### Build (phase `Build`)

**Schedule (code).**
- `pool` = the units of slice `S` + pending `fix-*` units of `S`. Exclude `done` units. Exclude units with
  `runs_failed ≥ 3`; these are **stuck** and are reported, not retried. Exclude units whose `requires` are unmet
  (`roads`/`census` from the prereqs, `rivers` from `rivers_ready`); these are deferred and logged.
- **Transitive exclusion.** Compute `blocked` to a fixpoint: a pool unit is also excluded (and logged as deferred
  `dep-unmet`) when any `depends_on` id is neither `done` (ledger) nor itself in the pool-after-exclusion. So a unit
  that depends on a stuck or deferred unit is never built on an unmet dependency.
- Topological order uses Kahn's algorithm with tie-break `(paint_order, id)`. Paint order is also gated on the built map's pane stacking (the pane z-order criterion of each slice gate).
- `batch` = the first `maxUnits` units, or exactly `A.units` when it is given.
- Because the order is topological and exclusion is transitive, every not-done dependency of a batch unit is
  earlier in the batch, or the unit is not in the batch. A dependency id with no `runById` entry that is not `done`
  in the ledger is an error (`die` in the scheduler), never silently dropped.
- `gate === 'only'` → `batch = []`.

**Per-file locks and the app lock.** Submission order is the topological order. Lock chains therefore follow
submission order, and no unit can wait on a later one. Result: no deadlock and a deterministic *submission and lock*
order (agent wall-clock interleaving of independent units is not deterministic, and the design does not claim it).

Units that are not file-disjoint in what their gates read must not overlap. The chosen rule (option 1 of the three
considered: scoped gates; global read locks and fully sequential batches were rejected as slower for no gain):
- A unit's `syntax` step checks **only its own changed files** (the two HTML files only when the unit's `files`
  include them). A whole-tree syntax check of both HTML files runs once in the slice gate's `determinism + syntax`
  agent, after the batch, when nothing is in flight.
- A unit is **app-bound** when its `files` include `index.html` or `maps-site/index.html`, or any of its
  acceptance items is of kind `capture` (it runs against the live app). Every app-bound unit also takes the
  pseudo-file key `'<app>'` in `withFiles`, so app-bound units run one at a time in submission order, while pure
  tool/data/css units on disjoint files run concurrently with them and never touch the live app.
- The per-file lock also covers a unit's generator outputs, and takes `'<app>'` when any output is under `maps-site/`. A
  unit that edits files outside its declared `files` fails with `edited outside unit files`: the one-writer-per-file
  claim is enforced after the fact, not just by prompt.
- A tool or data unit's acceptance must therefore not read `maps-site/index.html`; the planner is told this
  (its acceptance kinds are `node|grep|json` for such units, `capture` only for app-bound ones).
```js
const tails = {}, runById = {}
function withFiles(paths, fn) {
  const files = [...new Set(paths)].sort()
  const run = Promise.all(files.map(f => tails[f] || Promise.resolve())).then(fn)
  const settled = run.then(() => null, () => null); files.forEach(f => { tails[f] = settled })
  return run
}
for (const u of batch) runById[u.id] = withFiles(u.files, async () => {
  const deps = await Promise.all(u.depends_on.filter(d => runById[d]).map(d => runById[d]))
  if (deps.some(d => !d || !d.ok)) return {id: u.id, ok: false, status: 'blocked-by-dep'}
  return buildUnit(u)
})
const built = await Promise.all(batch.map(u => runById[u.id].catch(() => null)))
// built[i] === null means the unit's run threw: count it as failed (status 'failed', runs_failed + 1), log it, and
// never as done. built is not filtered: its position is batch order.
```

**`buildUnit(u)`.** Every agent gets `phase:'Build'` and a label like `U07 · implement`.

1. **`implement`**. The role depends on the kind:
   - `logic` → judge (opus/high);
   - `tool` → deep (sonnet/high);
   - `data|css|copy` → audit (sonnet/medium);
   - `u.model` / `u.effort` override the pair per field through `MO(role, u)` in `full` mode: each is validated
     against the allowed sets independently, a missing or invalid one falls back to `M(role)` and is `log`ged as
     rejected, and nothing overrides in `smoke` mode.

   The prompt (built with `P(...)`) contains:
   - `RULE` (via `P`) and `anchorMap`;
   - the unit JSON and its paint-order position;
   - "read the rules in `covers` from `sheet-spec.md`/`.json`".

   It also contains these **hard rules**:
   - **Determinism:** seeded only, `xmur3(name)` → `mulberry32` as the atlas already does. No unseeded randomness
     and no wall-clock reads: `grep -E CLOCK_GREP` finds nothing in the FILIGREE block or in `tools/filigree-*.js`.
     The prompt states this through `CLOCK_GREP`, never as literal call syntax.
   - **Generated files** (`filigree-names.json`, `gazetteer.json`, baked relief) are regenerated by their tool and
     never hand-edited.
   - **Canon key:** dotted = major roads only and solid black = rivers. Never draw a minor path dotted.
   - `VOCAB_RULE`.
   - **The FILIGREE block:** all filigree JS goes inside `/* FILIGREE */ … /* /FILIGREE */` in
     `maps-site/index.html`, with only minimal hook calls outside it.
   - **The table map stays behind the default-off toggle (R18).**
   - The sim `index.html` is untouched unless the unit's files name it.
   - "Do not generalize a ridge to save ink; if a knoll has no name, mint one with the names tool (R9)".
   - `rulingText(RUL, ['R2','R3','R6','R7','R9','R10','R13','R18','R19','R20'])`.

   In **smoke** mode the prompt starts with "DRY RUN: edit nothing; write your intended change as a unified diff to
   `${OUTABS}/dry/<id>.diff`".

   Schema: `{"type":"object","properties":{"id":{"type":"string"},"files_changed":{"type":"array","items":{"type":"object","properties":{"path":{"type":"string"},"sha256":{"type":"string"}},"required":["path","sha256"]}},"notes":{"type":"string"},"dry":{"type":"boolean"}},"required":["id","files_changed","notes","dry"]}`.
2. **`syntax`** (mech). It runs three checks, scoped to the unit's own changed files (see the app lock above):
   - the CLAUDE.md inline-script `new Function` check on each changed HTML file (`index.html` and/or
     `maps-site/index.html`; skipped when the unit changed neither);
   - `JSON.parse` on every changed `.json`;
   - `node --check` on every changed `.js`.

   Schema: `{"type":"object","properties":{"ok":{"type":"boolean"},"errors":{"type":"array","items":{"type":"string"}}},"required":["ok","errors"]}`.
3. **`accept`** (audit; README §6 puts acceptance runs and Playwright capture at sonnet/medium) runs every
   `u.acceptance` item. It starts the server and browser only if an item is of kind `capture`. It compares each
   output with `expect`.
   Schema: `{"type":"object","properties":{"results":{"type":"array","items":{"type":"object","properties":{"cmd":{"type":"string"},"ok":{"type":"boolean"},"out":{"type":"string"}},"required":["cmd","ok","out"]}},"infra_error":{"type":"string"}},"required":["results","infra_error"]}`.
   A non-empty `infra_error` marks the unit `infra`. It does not count as a failure, and the run's reason becomes `infra`.
4. **`fix`** runs at most 2 attempts while syntax or acceptance fails. The role is judge (opus/high) for `logic`
   (README §6: logic edits in `maps-site/index.html`) and audit otherwise. The
   prompt carries the errors and failing results. Each attempt is followed by `syntax` and `accept` again.
5. **`determinism`** (mech) runs only when the unit has kind `tool`, or its files include a generated output. It runs every
   `/generators` command touching the unit's files twice and compares the sha256 values.
   Schema: `{"type":"object","properties":{"ok":{"type":"boolean"},"diffs":{"type":"array","items":{"type":"string"}}},"required":["ok","diffs"]}`.
6. **`unit record`** (mech) writes `${OUTABS}/state/3-build/<id>.json`:
   `{id, date, slice, status:'done'|'failed'|'infra', files, shas, acceptance, attempts, runs_failed}`.
   - `runs_failed` is incremented when the status is `failed`.
   - There is one file per unit, so writes never race.
   - It ends with `READBACK`. Schema: `{"type":"object","properties":{"status":{"type":"string","enum":["done","failed","infra"]},"path":{"type":"string"},"sha256":{"type":"string"},"parsed":{"type":"boolean"}},"required":["status","path","sha256","parsed"]}`; the script checks `FILE_OK`, and a dead recorder makes the unit `failed` for this run (the in-memory status is still returned, and the ledger is repaired by the next run's preflight).

`buildUnit` returns `{id, ok: status==='done', status}`.

### Smoke (phase `Smoke`; audit; once per run whenever a unit was built or a gate will run)
- **Cache-buster:** `v = Number(DATE.replace(/-/g, ''))`.
- **Sim:**
  - Load `http://localhost:${port}/?v=${v}#s=epeshu` and `/?v=${v}#s=tamar1374`.
  - Wait for `window.ANNALS.ready`.
  - Run `ANNALS.simDays(400)`.
- **Atlas:**
  - If U01 is done, run `node tools/filigree-capture.js --views ${OUTABS}/gates/views.json --modes dense,sparse --themes day,night --metrics labels --out ${OUTABS}/shots/run-${DATE}/`.
  - Otherwise load `/maps-site/?v=${v}` with a throwaway Playwright script, using the sandbox recipe from the README (it runs from a temp dir).
- The console must stay error-free.
- Count `grep -E CLOCK_GREP` hits inside the FILIGREE block.

Schema: `{"type":"object","properties":{"console_errors":{"type":"array","items":{"type":"string"}},"infra_error":{"type":"string"},"block_random_hits":{"type":"integer"},"shots":{"type":"array","items":{"type":"string"}}},"required":["console_errors","infra_error","block_random_hits","shots"]}`.

### Slice gate (phase `Slice gate`)
It runs only if every unit of `S` is `done`, or `gate === 'only'`, and only if `gate !== 'skip'`. Three agents run, but
not all at once: `determinism + syntax` runs first and alone (the generators rewrite the data files the capture and the
spec checks read), then `gate capture` and `spec checks` run in `parallel`. The gate capture agent is the only one that
starts the server. The barrier is needed because the scoring uses all three reports. The result array is
**positional and keeps its nulls**: a null report fails every criterion that needs it (`criteria` records `agent died:
gate capture|spec checks|determinism + syntax`); it is never read as zero metrics or as a pass.
- **`gate capture`** (audit). It runs `node tools/filigree-capture.js --views ${OUTABS}/gates/views.json --cells ${OUTABS}/gates/hexes.json --modes dense,sparse --metrics <SLICE_METRICS[S]> --out ${OUTABS}/shots/gate-${S}-${DATE}/` and returns the compact metrics:
  `cells`, `views` (counts and heights only), `city`, `stack`, `tiles`, `edges`, `fog`, `appear`, `panes_when_off`,
  `filigree_counts_when_off`, `console_errors`, `infra_error`. All are required; inner objects are typed
  (`additionalProperties` with a union type; concrete `properties` for fields the script reads, e.g.
  `stack.node_identity_kept`, `appear.violations`).
  - `SLICE_METRICS`:
    - `A: 'counts,edges,panes'`
    - `B: 'counts,labels,panes'`
    - `C: 'counts,city,edges,fog,panes'`
    - `D: 'counts,labels,city,edges,fog,stack,tiles,appear,panes'`
- **`spec checks`** (mech) runs every `/checks/<S>`. For D it runs every slice's checks. Each check is a command plus
  an `expect` condition on its JSON stdout. The agent evaluates the condition and returns
  `{"type":"object","properties":{"results":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"ok":{"type":"boolean"},"value":{"type":"string"}},"required":["id","ok","value"]}}},"required":["results"]}`.
  The named ids `A.rivers_overlap`, `A.imhof_F01`, `A.coast_edge_V4` (slice A) and `B.one_shield`, `B.names_for_owner`,
  `B.gazetteer_prov` (slice B) must exist in `/checks`; Job 2 emits them. A missing id, or a slice with no checks, is
  recorded as `measured {spec_gap: …}`: it never starts a fix round, is never passed to the diagnoser, and appears in
  `gaps` as `<id>: no /checks for slice …`. Failing and ok ids in gate records are slice-qualified (`A:A.rivers_overlap`).
- **`determinism + syntax`** (mech). It runs every `/generators` command twice and compares sha. It runs `grep -E CLOCK_GREP` over
  the FILIGREE block and `tools/filigree-*.js`. It runs the CLAUDE.md syntax check on **both** HTML files (the
  whole-tree check; per-unit gates are scoped, see the app lock). It returns `{generators:[{cmd, equal}], random_hits, syntax_ok}`;
  schema `{"type":"object","properties":{"generators":{"type":"array","items":{"type":"object","properties":{"cmd":{"type":"string"},"equal":{"type":"boolean"}},"required":["cmd","equal"]}},"random_hits":{"type":"integer"},"syntax_ok":{"type":"boolean"}},"required":["generators","random_hits","syntax_ok"]}`.

`six(F)`, `min(F,c)` and `exempt(F)` come from preflight `ground`. `SC[S]` = `slice_classes[S]`.
`cellOK(F, classes)` means that for every `c ∈ classes ∩ six(F)`, `cells[F].dense[c] ≥ min(F,c)` (default 1).
Exempt cells pass.

| id | slice | criterion | threshold |
|---|---|---|---|
| G3.A1 | A | every slice-A unit `done`, its acceptance all ok | all |
| G3.A2 | A | determinism + syntax | generators equal, `random_hits=0`, `syntax_ok` |
| G3.A3 | A | ground on fixtures F01–F11: `cellOK(F, SC.A)` | 11/11 |
| G3.A4 | A | spec checks A (incl. `rivers.json` print-overlap ≥0.9 within 3 px, Imhof NW-lit > SE-shaded on F01, pooled coast edge on V4) | all ok |
| G3.A5 | A | toggle off: `filigree_counts_when_off` all 0 AND set(`panes_when_off`) = set(`pre_filigree_panes`) | true |
| G3.A6 | A | smoke + capture: 0 console errors, no infra error | true |
| G3.A7 | A | pane z-order is a subsequence of `/paint_order` (old survey under, notices on top) | true |
| G3.B1–B2 | B | as A1–A2 for slice B | |
| G3.B3 | B | ink on fixtures: `cellOK(F, SC.B)` | 11/11 |
| G3.B4 | B | **hand test** (below) | pass |
| G3.B5 | B | spec checks B (one shield, at Aldorūs; `names-for-owner.md` lists every invented name; gazetteer regenerated with `prov`) | all ok |
| G3.B6–B7 | B | as A5–A6 | |
| G3.B8 | B | pane z-order is a subsequence of `/paint_order` (names above relief, old survey under, notices on top) | true |
| GH.leak | B, D | hand-test mask holds | no leak |
| G3.C1–C2 | C | as A1–A2 for slice C | |
| G3.C3 | C | city at rest (V6): `pins_at_rest=0`, `block_labels=0`, `street_names_below=0`, `street_names_above>0`, `label_count ≤ label_cap` | all |
| G3.C4 | C | fog as weather: `fog.opacity>0`, `same_day_equal`, `diff_day_differs` | all |
| G3.C5 | C | pooled edge V6: `band_mean ≤ interior_mean − edge_delta` | true |
| G3.C6–C8 | C | spec checks C; as A5; as A6 | |
| G3.C9 | C | pane z-order is a subsequence of `/paint_order` (names above relief, fog above names, old survey under, notices on top) | true |
| G3.D1 | D | every unit of every slice `done` | all |
| G3.D2 | D | G3.A3, G3.B3, G3.C3–C5 re-measured | all |
| G3.D3 | D | stack: every overlay toggle `base_requests=0`; `node_identity_kept`; `!reload`; `roundtrip_equal`; `moveend_keeps_params` | all |
| G3.D4 | D | six-check, all 12 fixtures: count of six classes with dense count > 0 | ≥10/12 cells 6/6 AND none <4 (exempt cells count 6/6) |
| G3.D5 | D | hand test re-run with the frozen questions | pass |
| G3.D6 | D | appear: `appear.violations=[]` and `below_minzoom_visible=[]` | true |
| G3.D7–D9 | D | all spec checks; determinism + syntax; toggle off + smoke | all |
| G3.D10 | D | sheet rules on V1–V6 (dense): no `/sheets/<sheet>/forbidden` class drawn, every `/sheets/<sheet>/must` class drawn; V1 (country): exactly one shield, at the river town, and zero homestead-class features | all views |
| G3.D11 | D | pane z-order is a subsequence of `/paint_order` (contours before names, fog last, old survey under, notices on top) | true |

These are mechanical by design. The vision read "does the city look painted, or like a UI?" is a Job 4 lens (F02),
not a build gate.

### Hand test (phase `Hand test`; runs inside the B and D gates)
1. **`question writer`** (deep = sonnet/high, `crit`; README §6 puts tool pipelines there; only when `!handq.present`; frozen afterwards).
   - It writes **`tools/filigree-handq.js`**: pure Node and deterministic. It reads `maps-site/data/filigree-*.json`
     (names, heights, rivers, road), `${OUTABS}/gates/views.json` and `/fixtures/hand_test`.
   - It runs the tool twice (same sha) with `--out` set to the staged path `${OUTABS}/gates/3-handtest-questions.staged.json`; its own read-back covers the staged file. A mech publish step then moves it onto `${OUTABS}/gates/3-handtest-questions.json`, but only after the script validates it (≥8 per view, unique ids, well-formed answers, valid kinds; one writer retry). An invalid set is an `agent died` result, never a map defect (no fix rounds). A frozen file that fails validation returns `agent died: question reader (invalid frozen set …)`; delete it by hand to re-freeze. That happens **before any
     hand-test screenshot exists**.
   - It writes at least 8 questions per view for V2, V3 and V4, from fixed templates. Ids are `<V>-T<n>-<k>`, unique across views, with one answer per id:
     - T1: the two highest named peaks visible outside the mask (names only).
     - T2: the named ridge or peak nearest the covered area.
     - T3: the 8-point bearing from named peak A to named peak B.
     - T4: the named heights passed on the right when walking the rust road toward the cover.
     - T5: the 8-point side of the cover the river runs on.
     - T6 (valley views): a named homestead within one ridge of the cover.
   - It ends with `READBACK` on the questions file. Returns: `{"type":"object","properties":{"path":{"type":"string"},"sha256":{"type":"string"},"parsed":{"type":"boolean"},"deterministic":{"type":"boolean"},"questions":{"type":"object","additionalProperties":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"q":{"type":"string"},"kind":{"type":"string","enum":["name","height","bearing8","side8","names"]}},"required":["id","q","kind"]}}},"answers":{"type":"object","additionalProperties":{"type":["string","number","array"]}}}, "required":["path","sha256","parsed","deterministic","questions","answers"]}`; the script checks `FILE_OK` and `deterministic`.
     - `questions`: `{V2:[{id,q,kind}]}`, with `kind` ∈ `name|height|bearing8|side8|names`.
     - `answers`: `{id: value}`. The script uses it; navigators never see it.
   - When the file already exists, preflight hands the sha to a mech **`question reader`**. The reader returns the same
     schema from the file, so the questions stay frozen across runs.
2. **`hand capture`** (audit) runs
   `node tools/filigree-capture.js --views ${OUTABS}/gates/views.json --only V2,V3,V4 --modes dense --mask auto --mask-scale <k> --metrics labels --out ${OUTABS}/shots/hand-${DATE}/`.
   - The mask is an opaque disc over the settlement of radius `max(96, 1.5×footprint)`, plus r = 48 discs over every
     other anchor or marker in view. That also covers the print's hand-lettered town names.
   - Returns `{pngs:{V2,V3,V4}, outside:{V2:[names]}, heights_outside:{V2:n}, infra_error}`; the agent no longer copies `views.<V>.dense.heights`: it counts the height numerals in the visible landform labels outside the mask (bare integers and `<name> <integer>` entries), or, if that list holds names only, the outside names that have a bare-integer label within 40 px, and the script caps the value at the length of the outside list, so G3.B4/G3.D5 `>= 6` heights measures only heights outside the mask; schema `{"type":"object","properties":{"pngs":{"type":"object","additionalProperties":{"type":"string"}},"outside":{"type":"object","additionalProperties":{"type":"array","items":{"type":"string"}}},"heights_outside":{"type":"object","additionalProperties":{"type":"integer"}},"infra_error":{"type":"string"}},"required":["pngs","outside","heights_outside","infra_error"]}`. A null capture fails the hand test as `agent died: hand capture` (never zero metrics).
3. **Navigators** run as `pipeline(['V2','V3','V4'], (v, _, vi) => parallel([A, B].map(...)))`
   (stage callbacks are `(prev, item, index)`). The pair keeps its nulls: a null navigator scores 0 for that view.
   - Navigator A is deep (sonnet/high) and navigator B is judge (opus/high). Both are built with `P(body, true)`, and blind navigators are not told the repo root.
   - The prompt: "You see ONLY this image `<png>`. Open no other file and do not use the web. Answer each question by
     reading the map. List every landform name you can read (with its height if printed). If you can tell which
     town is covered, name it."
   - Schema: `{"type":"object","properties":{"answers":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"value":{"type":["string","number","boolean","array"]}},"required":["id","value"]}},"legible":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"height":{"type":"string"}},"required":["name","height"]}},"covered_town_guess":{"type":"string"},"files_read":{"type":"array","items":{"type":"string"}}},"required":["answers","legible","covered_town_guess","files_read"]}`.
4. **Scoring (code).** Accuracy per navigator per view:
   - names: `norm()` equality;
   - heights: exact integer;
   - `bearing8`/`side8`: within ±1 sector;
   - `names`: Jaccard overlap ≥ 0.5 (precision and recall together; listing every visible name no longer passes).

   **Recall** = |norm(legible) ∩ norm(outside[v])| / |outside[v]|.

   **Blind check:** `blindBad(files_read, [absP(png)])` is empty (allowlist = that one PNG).

   **Mask validity:** a `covered_town_guess` that matches the masked town by `norm()` means the mask leaked. In that case:
   - re-capture that view at `--mask-scale 1.5`;
   - re-run both navigators once;
   - if it still leaks → criterion `GH.leak` fails with `reason:'mask-leak'`. This is a capture fault, not a map
     defect, so no fix units are written.

   **Hand-test pass (GH):** for each view, each navigator scores ≥80%, recall ≥70%, `heights_outside ≥ 6`, there is no
   leak, and the blind check is clean.

### Fix units (phase `Fix units`; loop `round < ROUNDS`)
This phase runs only when the slice gate failed for map reasons. It does not run for `infra`, `mask-leak` or `blocked`.
1. **`diagnoser`** (judge, `crit`). It reads the failed criteria, the metrics paths and the units. It writes new units
   `fix-<S><round><n>` to `${OUTABS}/state/3-build/<id>.json` with status `pending`, using the same unit schema and
   mechanical acceptance, each tagged `failed_criterion: '<criterion id>'`. It returns them and ends with `READBACK`
   per file (`FILE_OK`). Schema: `{"type":"object","properties":{"units":{"type":"array","items":<UNIT, as in Job 2, plus "failed_criterion":{"type":"string"}>},"files":{"type":"array","items":{"type":"object","properties":{"path":{"type":"string"},"sha256":{"type":"string"},"parsed":{"type":"boolean"}},"required":["path","sha256","parsed"]}}},"required":["units","files"]}`.
   The code validates the schema and that the graph is acyclic.
   - **Dedup.** `seenFix` is a Set of `slice + '|' + failed_criterion`, seeded from every `fix-*` ledger entry that has a
     `failed_criterion`, except those with status `discarded`, plus the pending fix units. A new fix unit whose key is
     already in `seenFix` is discarded and logged, so the same failure never yields a fresh fix unit on every round.
   - **Cap.** At most 4 fix units per round, enforced in code: extras are discarded as `over per-round cap`.
   - **Discard.** The fix discard agent touches only new ids matching `fix-<slice><round><n>`. An overwrite of an
     existing ledger file is reported in `gaps` for manual repair and is not auto-discarded.
2. The new units go through `buildUnit` under the same locks.
3. Then Smoke, the Slice gate and the Hand test re-run. The questions stay frozen.

### Record (phase `Record`)
A mech **`shots pruner`** runs first (schema `{"type":"object","properties":{"kept":{"type":"array","items":{"type":"string"}},"removed":{"type":"array","items":{"type":"string"}},"count_ok":{"type":"boolean"}},"required":["kept","removed","count_ok"]}`): it lists `${OUTABS}/shots/{run,gate-*,hand}-*` directories, keeps the two newest run dates, deletes the rest and asserts the remaining count (`count_ok`). `shots/` is git-ignored (unit D10), so only `metrics.json` files are ever committed from it.

`record()` writes:
- `state/3-build.json`:
  `{date, slice:S, per_slice:{A:{done,total},…}, built:[ids], deferred:[{id, why}], stuck:[ids], infra:[ids]}`.
- `gates/3-build-<S>.json`, when the gate ran:
  `gateObj({criteria, rounds, artifacts, rulings_used, gaps, slice:S})`.
- `gates/3-build.json`, only when slice D's gate passed. It carries the G3.D criteria.

## Return value
```
done({pass: final D gate passed this run, reason: ''|'blocked'|'infra'|'mask-leak'|'gate-fail'|'smoke-fail'|'units-failed'|'record-mismatch'|'nothing to build'|'agent died: …',   // smoke-fail: a non-gate run whose smoke showed console errors or clock hits in the FILIGREE block
  slice: S, check_off: (S==='D' && pass),
  outputs: [changed app/tool/data files, 'docs/filigree/state/3-build/', 'docs/filigree/gates/3-build-<S>.json', shots dirs],
  gate_path: OUT + '/gates/3-build-' + S + '.json', owner_rulings_used: RUSED,
  polish_note: `Filigree 3 slice ${S}: ${nDone}/${nTotal} units (${builtIds}); ${deferred} deferred; gate ${gateStatus}` ,   // nDone/nTotal, never `done` (the prelude function)
  polish_inserts: stuck units, only on the run in which a unit becomes stuck (runs_failed reaches 3) -> "- [ ] **Filigree 3 stuck unit <id> — <title>** — <last failure>; fix by hand, then re-run with args.unstick [\"<id>\"]; a fix unit that is obsolete is dropped with args.discard [\"<id>\"]" (directly above Filigree 3),
  changelog_line: `- Filigree 3 slice ${S} (${SLICE_NAME[S]}): ${titles} — behind the table-map toggle`})
```
The polish run checks the item off only when `check_off` is true. Otherwise the item stays unchecked, and its result
note is `polish_note`.

## Outputs (repo)
| path | writer |
|---|---|
| `maps-site/index.html` (FILIGREE block + hooks), `maps-site/data/filigree-*.json`, `rivers.json`, relief bake, notices sample, `tools/filigree-*.js`, `tools/mint-names.js`, `maps-site/data/gazetteer.json` (regenerated) | unit implementers / fixers, as `sheet-spec.json` names them |
| `tools/filigree-handq.js`, `docs/filigree/gates/3-handtest-questions.json` | question writer (frozen) |
| `docs/filigree/state/3-build/<unit>.json` | unit recorders / diagnoser |
| `docs/filigree/shots/{run,gate-*,hand}-<date>/` | smoke / captures (git-ignored bulk). Pruned to the last two runs by the shots pruner; ≤300 KB per image |
| `docs/filigree/names-for-owner.md` | the names unit (R9) |
| `docs/filigree/state/3-build.json`, `gates/3-build-<S>.json`, `gates/3-build.json` | `record()` |

## Loop bounds
- Units per run: ≤ `maxUnits`.
- Fixer attempts per unit: ≤2.
- `runs_failed ≥ 3` → stuck.
- Fix rounds: ≤ `ROUNDS`.
- Mask re-capture: once per view.
- About 50 agents in a typical run; bound 228 (slices A, C) or 276 (B, D) at `maxUnits:8`, `maxRounds:2`, computed from the formula in the preflight section.
