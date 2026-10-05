# Workflow 3 · `living-3-build.js` — Living 3 · Implementation → the living chart (multi-run; still-chart test)

> Planning snapshot, 2026-10-05. Where the committed script and this document disagree, the script wins. The prelude
> is **the living prelude** of `workflow-1-research.md` §0, byte for byte. This is the only living job that writes
> the atlas: `maps-site/living.js`, `maps-site/living/**`, the declared `/*LC-HOOK*/` lines of `maps-site/index.html`
> and the regenerated offline manifest, plus `tools/living-*.js`; it runs only while the hold is clear (§4).
> Staged at `docs/living/design/workflows/living-3-build.js` until Living 0. Scope `zoom` (POLISH "Living 3z") is
> the same script with slice Z.

## 1. meta (exact literal)

```js
export const meta = {
  name: 'living-3-build',
  description: 'Living 3: build the living chart from living-spec.json units, slice by slice (L0 instrument and hooks, L1 still chart and clock, L2 routes and traffic, L3 sea, sky and creatures; scope zoom: Z); gate = still-chart test + slice gates',
  whenToUse: 'Run as the POLISH item "Living 3 · Implementation → the living chart" (multi-run) after docs/living/gates/2-plan.json passed: Workflow({name:"living-3-build", args:{date:"YYYY-MM-DD"}}); "Living 3z" passes scope:"zoom". Returns reason "held" while the table map, a mobile item or (zoom) the street view could be touched. Holds maps-site/index.html and maps-site/living* while running.',
  phases: [
    {title: 'Preflight', detail: 'drift, anchors (living + filigree + street), the hold, the chain, the ledger, the slice, the restore invariant'},
    {title: 'Rebase', detail: 'keep or re-take the living-off reference on restore(maps-site/index.html) in a temp tree'},
    {title: 'Build', detail: 'per unit: accept -> snapshot -> implement -> check -> measure (off + on, scored in code) -> fix <= 2 -> restore on failure -> record; one unit at a time'},
    {title: 'Slice gate', detail: 'manifest, off capture + accept, frames, static, spec checks; GL.1-GL.14 scored in code'},
    {title: 'Fix units', detail: 'diagnoser -> fix units into the ledger, built by the next run (<= 2 gate rounds per slice)'},
    {title: 'Smoke', detail: 'final gate only: both apps, both seeds, living=1 with filigree=1, zero console errors'},
    {title: 'Record', detail: 'manifest regenerated when maps-site changed; ledger, slice gate, final gate; coexistence re-read'}
  ]
}
const JOB = 'living-3-build'
```

## 2. Args

Shared + `force` (reason string; never a pass). First body line:
`checkArgs(['livingRulings', 'port', 'scope', 'slice', 'maxUnits', 'units', 'unstick', 'discard', 'gate', 'cdnDir'])`.

| arg | default | rule |
|---|---|---|
| `scope` | `'motion'` | `motion` (slices L0-L3) or `zoom` (slice Z) |
| `slice` | the first slice of the scope whose gate, stamped with the current spec sha, has not passed | `L0`..`L3` (motion) or `Z` (zoom); refused when an earlier slice has not passed: `slice Lx refused: earlier slice Ly has not passed its gate` |
| `maxUnits` | 6 | integer 1..6 |
| `units` | — | non-empty array of ready unit ids of the slice, length ≤ maxUnits; refused with `gate:'only'` |
| `unstick` | `[]` | unit ids whose `runs_failed` resets for this run |
| `discard` | `[]` | ids matching `^fix-(L[0-3]|Z)\d+$`; their ledger files are marked `discarded` |
| `gate` | `'auto'` | `auto` (gate when the slice is complete) \| `skip` \| `only` |
| `cdnDir` | — | an absolute path matching `PATH_OK`, passed to the tools as `--cdn-dir` (else each relay packs a temp dir per `SANDBOX_LC`) |
| `livingRulings`, `port` | | config |

Every rule above is a `die()` line in §3, directly after `checkArgs` (stub-run cases in §12).

**Smoke mode** (`mode:'smoke'`, an absolute `outDir` outside the repo): Living 3 runs the preflight, the hold and one
`gate frames` + `gate static` measurement of the current tree with every output under that outDir; it never runs an
implementer, a fixer, a snapshot or a restore, and never writes the checkout. Full mode alone builds. Its chain inputs
(spec, gates 1 and 2, views, measure keys, ledger, the atlas reference) are read from `IN = DOCS` (the durable
`docs/living/`, read-only); before Living 2 has ever passed, a smoke run dies `missing inputs: …`, the expected smoke
result at delivery (README §8.5).

## 3. Constants

```js
checkArgs(['livingRulings', 'port', 'scope', 'slice', 'maxUnits', 'units', 'unstick', 'discard', 'gate', 'cdnDir'])
const SCOPE = A.scope ?? 'motion'
if (!['motion', 'zoom'].includes(SCOPE)) die('args.scope must be motion|zoom')
const SLICES = SCOPE === 'zoom' ? ['Z'] : ['L0', 'L1', 'L2', 'L3']
const strArr = v => Array.isArray(v) && v.every(x => typeof x === 'string' && /^[A-Za-z0-9._-]+$/.test(x))
if (A.slice != null && !SLICES.includes(A.slice)) die('args.slice must be one of ' + SLICES.join('|') + ' for scope ' + SCOPE)
const MAX_UNITS = A.maxUnits ?? 6
if (!Number.isInteger(MAX_UNITS) || MAX_UNITS < 1 || MAX_UNITS > 6) die('args.maxUnits must be an integer 1..6')
if (A.units != null && !(strArr(A.units) && A.units.length >= 1 && A.units.length <= MAX_UNITS)) die('args.units must be a non-empty array of unit id strings, at most maxUnits long')
if (A.unstick != null && !strArr(A.unstick)) die('args.unstick must be an array of unit id strings')
if (A.discard != null && !(Array.isArray(A.discard) && A.discard.every(x => typeof x === 'string' && /^fix-(L[0-3]|Z)\d+$/.test(x)))) die('args.discard must be an array of fix-<slice><n> ids')
const GATE_MODE = A.gate ?? 'auto'
if (!['auto', 'skip', 'only'].includes(GATE_MODE)) die('args.gate must be auto|skip|only')
if (GATE_MODE === 'only' && A.units != null) die('args.units is refused with gate:"only"')
if (A.cdnDir != null && (typeof A.cdnDir !== 'string' || !PATH_OK.test(A.cdnDir) || !A.cdnDir.startsWith('/'))) die('args.cdnDir must be an absolute path of letters, digits and _ / . + - only')
const CDN = A.cdnDir || null
const ROUND_TOKENS = 700000   // one unit with its fixes (≈ 23 agents) or one slice gate (16); read by the config's lowBudget()
const IN = MODE === 'smoke' ? DOCS : OUTABS   // chain inputs; a smoke run reads the durable docs/living read-only
const SPEC_JSON = IN + '/living-spec.json', GATE2 = IN + '/gates/2-plan.json', GATE1 = IN + '/gates/1-research.json'
const VIEWS_JSON = IN + '/gates/views.json', KEYS_JSON = IN + '/gates/measure-keys.json'
const LEDGER_DIR = IN + '/state/3-build', STATE = OUTABS + '/state/3-build.json', ATLAS_REF = IN + '/state/3-build/atlas-ref.json'
const ACCEPT_DIR = OUTABS + '/accept', CAPS = OUTABS + '/captures', SNAP = REPO + '/docs/living/shots/loop'   // git-ignored; not under .git or .claude (mobile-tree.js rule)
const FINAL = OUTABS + '/gates/' + (SCOPE === 'zoom' ? '3-build-Z.json' : '3-build.json')
const SLICE_GATE = s => OUTABS + '/gates/3-build-' + s + '.json'
const UNIT_FILES_OK = [/^maps-site\/living\.js$/, /^maps-site\/living\/[A-Za-z0-9._\/-]+$/, /^maps-site\/index\.html$/, /^tools\/living-[a-z-]+\.js$/, /^docs\/living\/(fixtures|accept)\/[A-Za-z0-9._\/-]+$/]
const NEVER = /^(index\.html|\.claude\/|docs\/(filigree|street|mobile)\/|tools\/(filigree|street|mobile)-|tools\/street-drift\.js|tools\/build-offline-manifest\.js|server\.js|vendor\/)/
const ROLE_OF = u => (u.kind === 'logic' ? 'judge' : u.kind === 'tool' ? 'deep' : 'audit')   // logic opus/high; tool sonnet/high; data/css sonnet/medium; MO() applies u.model/u.effort
const PROFILES5 = ['iphone13', 'pixel7', 'landscape', 'desktop', 'desktop2x']
const ON_PROFILES = ['desktop', 'iphone13']
const SCENARIOS = ['moving', 'still', 'reduce', 'hidden', 'card', 'layer-off', 'below-band', 'offscreen', 'zoom-anim', 'block-chunk', 'coexist']
const CAP_DRAWS = {desktop: 20, iphone13: 15}, HOOK_CAP_RAW = 200, EASE_MS = 250, DRIFT_PX = 1
const FIX_PER_ROUND = 3, GATE_ROUNDS = 2, STUCK_AT = 3
const capFlags = id => `--atlas --profiles ${PROFILES5.join(',')} --unit LC-${id} --out ${OUTABS}/captures/${id}.json --shots-dir ${OUTABS}/shots/${id} --port ${PORT}`   // never docs/mobile/
```

## 4. The hold and the blocks (computed in code; never overridable)

`hold` relays `node tools/living-drift.js --hold`; `why = holdOf(hold, SCOPE === 'zoom' ? 'zoom' : 'build')`. A
non-empty `why` returns `{reason:'held', held_by: why}` with no write. The clauses (config `holdOf`): a mobile or
street tool running; an open Mobile item other than Mobile 15 (5b and fix items included); "Mobile later · census pin
names on phones (A12 part b)" unchecked; an open `Filigree 3 stuck unit` / `Filigree 4 punch c` / `Filigree data —`
item; the latest filigree 4-review gate not an unforced pass; for `zoom` also the latest street 4-review gate not an
unforced pass, an open `Street 3 stuck` / `Street 4 punch c` / `Street data (S3) —` item, or "Sim ↔ atlas continuity"
unchecked. The zoom scope additionally requires `hold.sim.street_param > 0` and `hold.street.views` (else held:
`street=1 or the Street frozen views are absent`).

Blocks (returned `reason:'blocked'`, `blocked_by`): an open `Living data — …` item whose text names the slice; for
slice L3 the units the spec marks `requires:'sea-mask'` while `polish.seamask_checked` is false (the other units of
the slice proceed); `Living 3 stuck unit <id>` items gate their dependants (a dependant is skipped, never built).

GS.8 coexistence (stated, not detectable in advance): Street 3 digests `maps-site/**` and `docs/filigree/**` at the
start and end of each run, so Living 3 never runs in a parallel session with Street 3, Street 4 or a Street punch
run. `busy` catches a running `tools/street-probe.js`; the Record re-read of `shas.street_state3` turns an overlap
into `coexistence broken: …` instead of silent damage.

## 5. Schemas

```js
const S = {type: 'string'}, B = {type: 'boolean'}, I = {type: 'integer'}, SA = {type: 'array', items: S}, OBJ = {type: 'object'}
const LINE = {type: 'object', additionalProperties: true, properties: {ok: B, len: I, sum: S}, required: ['ok', 'len', 'sum']}   // any tool line with len/sum (mobile-tree, living-drift --hold, living-measure summaries)
const FILST = {type: 'object', properties: {literals: OBJ, on_hook: SA}, required: ['literals', 'on_hook']}   // FIL_ST_ANCHOR_TASK: literals {literal: line or null}, on_hook [literals found on a /*LC-HOOK*/ line]
const PRE3 = {type: 'object', properties: {missing: SA, anchors: OBJ, fil_st: FILST, chain: OBJ, spec: OBJ, ledger: OBJ, slice_gates: OBJ, ref: OBJ, restore: {type: 'object', properties: {sha_restore: S, undeclared: SA, misplaced: SA, duplicated: SA}, required: ['sha_restore', 'undeclared', 'misplaced', 'duplicated']}, ref_shots_ok: B, keys_superset: B, tool_shas: OBJ}, required: ['missing', 'anchors', 'fil_st', 'chain', 'spec', 'ledger', 'slice_gates', 'ref', 'restore', 'ref_shots_ok', 'keys_superset', 'tool_shas']}
const DRIFT = {type: 'object', properties: {living: OBJ, street: OBJ}, required: ['living', 'street']}
const REBASE = {type: 'object', properties: {name: S, path: S, sha256: S, exit_code: I, profile_errors: SA, shots_ok: B, tree_restore_sha: S, manifest_sha: S, index_sha: S, infra_error: S}, required: ['name', 'path', 'sha256', 'exit_code', 'profile_errors', 'shots_ok', 'tree_restore_sha', 'manifest_sha', 'index_sha', 'infra_error']}
const ACC = {type: 'object', properties: {off: {type: 'object', properties: {path: S, sha256: S, lint_exit: I, errors: SA}, required: ['path', 'sha256', 'lint_exit', 'errors']}, on: {type: 'object', properties: {path: S, sha256: S, lint_exit: I, errors: SA}, required: ['path', 'sha256', 'lint_exit', 'errors']}}, required: ['off', 'on']}
const IMPL = {type: 'object', properties: {files_written: SA, notes: S}, required: ['files_written']}
const CHECK = {type: 'object', properties: {tree: LINE, syntax: {type: 'object', properties: {index: S, atlas: S, living_js: S, json_ok: B}, required: ['index', 'atlas', 'living_js', 'json_ok']}, static: LINE, drift_exit: I}, required: ['tree', 'syntax', 'static', 'drift_exit']}
const MEASURE_R = {type: 'object', properties: {off: {type: 'object', properties: {capture_exit: I, accept_exit: I, failing: {type: 'array', items: OBJ}, repo: OBJ}, required: ['capture_exit', 'accept_exit', 'failing', 'repo']}, on: {type: 'object', properties: {exit: I, failing: {type: 'array', items: OBJ}}, required: ['exit', 'failing']}, infra_error: S}, required: ['off', 'on', 'infra_error']}
const RESTORE = {type: 'object', properties: {restore: LINE, after: LINE}, required: ['restore', 'after']}   // mobile-tree restore, then mobile-tree check (tree_changed must be empty)
const MANI = {type: 'object', properties: {exists: B, regen_exit: I, check_exit: I, sha: S}, required: ['exists', 'regen_exit', 'check_exit', 'sha']}
const GOFF = {type: 'object', properties: {capture_exit: I, accept_exit: I, failing: {type: 'array', items: OBJ}, repo: {type: 'object', properties: {anchors_missing: SA, street_drift_exit: I, tithe_lines: I, markers: OBJ, index_sha: S}, required: ['anchors_missing', 'street_drift_exit', 'tithe_lines', 'markers', 'index_sha']}, ref_repo: {type: 'object', properties: {tithe_lines: I, markers: OBJ, index_sha: S}, required: ['tithe_lines', 'markers', 'index_sha']}, infra_error: S}, required: ['capture_exit', 'accept_exit', 'failing', 'repo', 'ref_repo', 'infra_error']}
const GSTAT = {type: 'object', properties: {static: LINE, drift: DRIFT, fil_st: FILST, readme_strings: {type: 'object', additionalProperties: B}}, required: ['static', 'drift', 'fil_st', 'readme_strings']}   // readme_strings: each LC_STRINGS text -> listed in docs/living/README.md §13
const GCHK = {type: 'object', properties: {results: {type: 'array', items: {type: 'object', properties: {id: S, exit: I, out_tail: S}, required: ['id', 'exit', 'out_tail']}}}, required: ['results']}
const DIAG = {type: 'object', properties: {units: {type: 'array', items: {type: 'object', properties: {id: S, title: S, files: SA, kind: S, depends_on: SA, cures: S, acceptance: {type: 'array', items: OBJ}}, required: ['id', 'title', 'files', 'kind', 'depends_on', 'cures', 'acceptance']}}}, required: ['units']}
const SMOKE = {type: 'object', properties: {syntax_ok: B, sim: {type: 'object', additionalProperties: {type: 'object', properties: {errors: I, ready: B}, required: ['errors', 'ready']}}, atlas_living: {type: 'object', properties: {errors: I, views_ok: I}, required: ['errors', 'views_ok']}, infra_error: S}, required: ['syntax_ok', 'sim', 'atlas_living', 'infra_error']}
```

## 6. Agents

| label | phase | role → model/effort | prompt essentials | schema |
|---|---|---|---|---|
| `preflight` | Preflight | triage → sonnet/low | `ANCHOR_TASK`; `GATE2` (pass, mode, forced) and the spec sha it stamps vs sha256 of `SPEC_JSON`; `GATE1.cited` and `stamps` vs the current texts and files; the spec's `counts` and `canonical_len` recomputed; `LEDGER_DIR/*.json` (status, runs_failed, attempts per unit); slice gates present with their spec sha; `ATLAS_REF`; **restore**: apply the spec's `/hook_lines` restore (each `/*LC-HOOK*/` line back to its `replaces`, an insert hook removed) to `maps-site/index.html` in memory, sha256 the result, list undeclared marked lines, misplaced or duplicated hooks; `ref_shots_ok` (every desktop and desktop2x shot of the reference re-hashes); `keys_superset` (`living-measure --keys` ⊇ `KEYS_JSON`); `tool_shas` of `tools/mobile-capture.js`, `tools/mobile-tree.js`, `tools/living-measure.js` | `PRE3` |
| `hold` | Preflight | triage | `HOLD_TASK_LC` | `LINE` |
| `drift` | Preflight | triage | `DRIFT_TASK_LC` | `DRIFT` |
| `anchors` | Preflight | triage | `FIL_ST_ANCHOR_TASK` (every filigree and street flag-1 literal resolves; none on a hook line) | `FILST` |
| `rebase` | Rebase | triage | `SANDBOX_LC`; in a `mktemp -d` dir T copy every top-level entry of the repo except `.git` and `node_modules` into `T/tree` (`cp -r`; the repo untouched); write restore(`maps-site/index.html`) over `T/tree/maps-site/index.html` (its sha256 must equal the preflight `sha_restore`, else `infra_error: "restored copy sha mismatch"` and write nothing); delete `T/tree/maps-site/living.js` and `T/tree/maps-site/living/`; keep the live offline manifest; from `T/tree` run `node T/tree/tools/mobile-capture.js --atlas --profiles … --unit <name> --out <R>/captures/<name>.json --shots-dir <R>/shots/<name> --cdn-dir C --port P` where `<R>` is `OUTABS` relative to the repo root (full mode keeps it under `docs/living`), so the tool records shot paths that hold in both trees; copy that capture and its shots dir into the repo at the same relative paths; return the record | `REBASE` |
| `rebase (gate)` | Slice gate | triage | as `rebase` (P3, when the manifest sha moved since the reference) | `REBASE` |
| `accept <id>` | Build | audit → sonnet/medium | sees ONLY the unit's `acceptance`, the spec's `accept_template` and `on_template`, `docs/mobile/metrics.md` §8 and the reference capture's key list; never the code or a diff; writes `ACCEPT_DIR/<id>.json` (the off-state mobile-capture accept: `baseline` = the reference name, five profiles, the template's gates and waivers verbatim, `declared_first_view_growth` = the spec's cumulative hook bytes through this unit, `files_touched` = the unit files) and `ACCEPT_DIR/<id>.on.json`; runs `node tools/mobile-capture.js --lint-accept` and `node tools/living-measure.js --lint-on` on them | `ACC` |
| `snapshot <id>` | Build | triage | `node tools/mobile-tree.js snapshot --unit LC-<id> --snap ${SNAP} --files '<unit files JSON>'`; return the line unchanged | `LINE` |
| `implement <id>` | Build | `MO(ROLE_OF(u), u)` | the unit, the spec rules it covers, the hook-line table, `VOCAB_LC_RULE`, LC12/LC13/LC14 texts, the restore rule; write ONLY the unit files; every visible string goes into `LC_STRINGS`; never `index.html`, never a pane, never a clock token, never `W.rng` or WebGL | `IMPL` |
| `check <id>` | Build | triage | `node tools/mobile-tree.js check --unit LC-<id> --snap ${SNAP}` (line unchanged); the CLAUDE.md syntax one-liner on `index.html` and `maps-site/index.html`; `new Function` on `maps-site/living.js` when present; `JSON.parse` of every unit `.json`; `node tools/living-measure.js --static --hooks SPEC_JSON` (line unchanged); `node tools/living-drift.js` exit | `CHECK` |
| `measure <id>` | Build | triage | (a) `node tools/mobile-capture.js ${capFlags(id)} --cdn-dir C` then `node tools/mobile-capture.js --accept ACCEPT_DIR/<id>.json --capture ${OUTABS}/captures/<id>.json --ref <ref>=${OUTABS}/captures/<ref>.json`; (b) `node tools/living-measure.js --frames --views VIEWS_JSON --ids <unit views> --profiles desktop,iphone13 --living 1 --t 0,4000 --scenarios <on_template> --out ${OUTABS}/captures/<id>.on.json --shots-dir ${OUTABS}/shots/<id>.on` then `--score ACCEPT_DIR/<id>.on.json --frames ${OUTABS}/captures/<id>.on.json`; return exits, the `failing` arrays verbatim, the capture's `repo.{anchors_missing, street_drift_exit, tithe_lines, markers}`; never interpret | `MEASURE_R` |
| `fix <id> <k>` (≤ 2) | Build | as `implement` | the failing keys verbatim (`{key, op, expected, got}`), the check line's failures; the same file limits | `IMPL` |
| `restore <id>` | Build | triage | `node tools/mobile-tree.js restore …` then `check …`; both lines unchanged | `RESTORE` |
| `record <id>` | Record (`recordL`'s fixed phase; called inside Build) | `recordL` (triage) | `state/3-build/<id>.json` `{id, status, attempts, runs_failed, files_sha, accept_sha, measure, ref}` | `RECD` |
| `manifest` | Slice gate | triage | when `maps-site/data/offline-manifest.json` exists: `node tools/build-offline-manifest.js --atlas`, then `--atlas --check`; sha256 of the manifest; else `exists:false` | `MANI` |
| `manifest (record)` | Record | triage | as `manifest` (P6) | `MANI` |
| `gate accept` | Slice gate | audit | as `accept`, for `ACCEPT_DIR/slice-<S>.json` (written once per spec sha) | `ACC` |
| `gate off` | Slice gate | triage | `node tools/mobile-capture.js ${capFlags('slice-' + S)} --cdn-dir C` and `--accept ACCEPT_DIR/slice-<S>.json --capture … --ref <ref>=…`; plus the reference's `repo.{tithe_lines, markers}` and `meta.index_sha` | `GOFF` |
| `gate frames` | Slice gate | triage | `node tools/living-measure.js --frames --views VIEWS_JSON --ids <slice views> --profiles desktop,iphone13 --living 0,1 --t 0,4000,<tDark> --scenarios ${SCENARIOS} --runs 2 --out ${OUTABS}/captures/gate-<S>.json --shots-dir ${OUTABS}/shots/gate-<S>`, then `--gate-summary ${OUTABS}/captures/gate-<S>.json --spec SPEC_JSON --slice <S>`; return the summary line unchanged | `LINE` |
| `gate static` | Slice gate | triage | `--static --hooks SPEC_JSON` line; `DRIFT_TASK_LC`; `FIL_ST_ANCHOR_TASK`; for each `LC_STRINGS` text whether `docs/living/README.md` §13 lists it | `GSTAT` |
| `gate checks` | Slice gate | triage | run each `/slices/<S>/checks[].cmd` from the repo root in order, return `{id, exit, out_tail}` (≤ 600 chars) | `GCHK` |
| `diagnoser` | Fix units | judge | the failing GL criteria with their numbers, the spec, the ledger (every fix unit already proposed, built or discarded, with its `cures`); ≤ `FIX_PER_ROUND` fix units (files within `UNIT_FILES_OK`, each naming the criterion it cures); ids are assigned in code | `DIAG` |
| `smoke` | Smoke | triage | the CLAUDE.md syntax one-liner; `node tools/mobile-capture.js --sim --profiles desktop --out <tmp>/smoke.json --shots-dir <tmp>/shots` (both seeds, `simDays(400)` taken by the tool) → errors per seed; `node tools/living-measure.js --frames --views VIEWS_JSON --profiles desktop --living 1 --scenarios moving,coexist --out <tmp>/s.json` → console and page errors over every view | `SMOKE` |
| `hold (record)` | Record | triage | `HOLD_TASK_LC` | `LINE` |
| `record …` | Record | `recordL` | `ATLAS_REF`, `STATE`, `SLICE_GATE(S)`, `FINAL` | `RECD` |

## 7. Control flow

```text
P0  [preflight, hold, drift, anchors] = parallel(crit)
    any slot null (crit already retried once) -> return done({reason:'agent died: <preflight|hold|drift|anchors>'}) before any dereference
    anchorsLost -> die('anchor lost: …'); fil_st.literals has a null or fil_st.on_hook is non-empty -> die('anchor lost: <literal> (another track\'s anchor)')
    drift not ok -> die('prelude drift: …')
    plan -> return done({reason:'plan', agents_bound, slice, ready units, missing, held_by, blocked_by, chain_ok})   // missing inputs and the chain reported, never thrown, in plan mode
    missing -> die('missing inputs: …')
    holdOf(...) non-empty or zoom prerequisites absent -> return done({reason:'held', held_by})
    chain (unless FORCE): gate2 full unforced and spec sha equal -> else die('build must not start before the living spec passes: …');
      Living 1 cited/stamps unchanged -> else die('the cited rulings changed since Living 1 (…); re-run living-1-research') or die('the filigree density bible changed since Living 1; re-run living-1-research')
      spec counts/canonical_len recomputed equal -> else die('scheduler: the spec copy differs from its own counts')
      slice refused / no /checks -> die('slice Lx refused: …') / die('living-spec.json has no /checks for slice Lx: re-run living-2-plan')
      !keys_superset -> die('the instrument dropped a Living 1 key: restore tools/living-measure.js')
    restore: undeclared/misplaced/duplicated -> die('restore invariant broken: … (undo by hand, or delete docs/living/state/3-build/atlas-ref.json when the remaining change is legitimate)')
    blocks -> return done({reason:'blocked', blocked_by}) when no unit of the slice is buildable
    nothing left and the final gate passed -> return done({pass:true, check_off:true, reason:'nothing to build'})
P1  Rebase when any: no reference; ref_shots_ok false; restore sha != ATLAS_REF.sha_restore (a foreign atlas edit);
    hold.shas.workflows != the reference's repo.pipeline_sha (a pipeline script changed: UG11); tool_shas.mobile-capture != ATLAS_REF's;
    hold.shas.maps_other or hold.shas.manifest != ATLAS_REF's -> rebase (crit) -> name 'L0-r<n>' (n = previous + 1; the first is Living 1's L0)
    infra_error -> return done({reason:'infra'}); exit != 0 or profile errors -> return done({reason:'infra', …}); record ATLAS_REF {ref, sha_restore, manifest, maps_other, pipeline digest, capture tool sha, why}
P2  Build (gate !== 'only'): ready = units of the slice, not done, deps done, runs_failed < STUCK_AT (or unstuck), not blocked; first maxUnits, in spec order
    for u of ready (strictly sequential; each holds the maps-site/index.html lock; before every unit after the first:
      if (lowBudget()) { log('budget: unit skipped'); break }, the skipped units stay ready for the next run):
      any null agent inside the unit -> restore (when a snapshot exists) and return done({reason:'agent died: <label>'})
      accept -> lint exits must be 0 (else the unit fails 'accept file not valid' before any edit)
      snapshot -> lenOk and ok, else infra stop
      implement -> check -> scope in code: tree changed ⊆ u.files, no NEVER path, syntax OK, static: 0 clock tokens, 0 forbidden names, hook table all declared/marked/found, drift exit 0
      measure -> pass when off.capture_exit 0, off.accept_exit 0, off.failing [], UG4 re-score (repo.anchors_missing [], street_drift_exit 0, tithe_lines and markers equal the reference's), on.exit 0, on.failing []
      fail -> fix (≤ 2, each followed by check + measure)
      still failing -> restore (lenOk both; after.tree_changed must be empty, else die('restore failed for <id>: …'))
               runs_failed++; at STUCK_AT -> polish_inserts 'Living 3 stuck unit <id> — <title>; last failure: <…>' (once)
      record <id>
P3  Slice gate (slice complete and gate !== 'skip', or gate === 'only'; when a unit was built in this run and lowBudget(),
    log('budget: slice gate deferred') and leave it to the next run):
      manifest -> rebase again when the manifest sha moved since the reference
      gate accept (first time for this spec sha) -> gate off ‖ gate frames ‖ gate static ‖ gate checks -> GL.1..GL.14 in code
      (a null gate relay -> return done({reason:'agent died: <label>'}); never a pass on a missing relay)
      pass -> record SLICE_GATE(S) (stamped with the spec sha); for the last slice of the scope also FINAL after the Smoke
      fail -> P4
P4  Fix units: if (lowBudget()) { log('budget: diagnoser skipped'); reason 'gate-fail' }; else diagnoser -> filter in code:
    seenFix = new Set(ledger fix ids ∪ ledger cures.map(norm)); a proposed unit whose norm(cures) is in seenFix, or that
    repeats another proposal of this round, is dropped and logged; the rest (≤ FIX_PER_ROUND) get ids fix-<S><k> with k =
    1 + the highest k in the ledger (never a reused id), written into the ledger (status proposed), built by the next run;
    a slice whose gate failed GATE_ROUNDS times -> 'Living 3 stuck criterion <S> <id> — …' inserts; reason 'gate-fail'
    Inserts (stuck unit and stuck criterion): seenIns = new Set(hold.polish.living.stuck_open.map(norm)); a title already
    in seenIns or already returned in this run is never returned again (the once-only rule, in code)
P5  Smoke (final slice only): syntax ok, both seeds ready with 0 errors, living views 0 errors -> else reason 'smoke-fail'
P6  Record: when any maps-site path changed in this run and the gate did not already regenerate it: manifest (check_exit 0 or reason 'gate-fail' with GL.11 false);
    hold (record): shas.index, docs_filigree, docs_street, docs_mobile, workflows, tools_other, street_state3 equal the preflight's
      (maps_other too: living writes only index.html, living*, the manifest) -> else gaps 'coexistence broken: <keys>' and reason 'coexistence broken: …'
    recordL STATE (+ the gate files above)
```

## 8. Slice gate GL — the still-chart test (scored in code; every criterion must pass)

The `gate frames` summary line (written by the L0 instrument unit to the spec's s11 contract) carries, per slice view
× profile: `glyph_sha {t0, t1, run2_t0}`, `positions_equal_profiles`, `moving_ok {class: moved}`, `still_ok {class:
unmoved}`, `still {glyph_sha_t0, glyph_sha_t1, counts_equal, raf_living, journey_playing, j_reduced, control:{present,
w, h, aria}}`, `reduce {…same}`, `stops {hidden, card, layer_off, below_band, offscreen: raf_living}`,
`draws_per_s`, `zoom_drift_px`, `transform_during_zoomanim`, `alpha_ramp_ms_max`, `block_chunk {console_errors,
page_errors, still_shown}`, `coexist {console_errors, page_errors}`, `label_overlap_px`, `phone_parity {missing:[…]}`.

| id | criterion |
|---|---|
| GL.1 | off identity: `gate off` capture exit 0, accept exit 0 and `failing` empty (UG1, UG2, UG3, UG6, UG7, UG8 with no declared region, UG10 within the declared hook growth and +0 requests, UG11) |
| GL.2 | UG4 and UG9 re-scored: `repo.anchors_missing` empty, `street_drift_exit` 0, `tithe_lines` and `markers` equal the reference's; living-drift ok; every `LC_STRINGS` text listed in README §13 and free of `VOCAB_LC` and `JARGON_LC` (tested in code on the relayed strings) |
| GL.3 | still frame and determinism: per view × profile `glyph_sha.t0 === glyph_sha.run2_t0`; `positions_equal_profiles` true |
| GL.4 | moves: every moving class of the slice's views moved between t0 and t1, every still class did not; the "≥ 1 moving class" floor binds only when the gated slices' spec devices hold a [t0, t1] mover (README §5.7 rule, computed in code; L0: vacuous) |
| GL.5 | the still chart (from L1): under `still` and `reduce`: `glyph_sha_t0 === glyph_sha_t1`, `counts_equal`, `raf_living` 0, `journey_playing` false, `j_reduced` true; the control present, ≥ 44×44 css px on iphone13, its aria label from `/strings` |
| GL.6 | stops and frames: every `stops` value 0; `draws_per_s` ≤ `CAP_DRAWS[profile]` |
| GL.7 | tokens and host: the static line's clock tokens (P and W) 0 in `maps-site/living.js` and `maps-site/living/**`; forbidden names 0 (`createPane`, `matchMedia`, `W.rng`, WebGL, `THREE`, the five atlas functions) |
| GL.8 | zoom sync: `zoom_drift_px` ≤ 1 after `zoomend` and `transform_during_zoomanim` true on every view with living glyphs |
| GL.9 | appear: `alpha_ramp_ms_max` ≤ 250 (R6, LC10) |
| GL.10 | lazy failure: with the chunk blocked, 0 console and page errors and the still chart shown |
| GL.11 | bytes: static `hook_raw_growth` ≤ 200 and equal to the spec's declared total; lazy gz bytes within LC14's caps; the manifest `check_exit` 0 when it exists |
| GL.12 | coexistence: `coexist` 0 errors; `label_overlap_px` 0 (LC9); `repo.index_sha === ref_repo.index_sha` (the sim untouched, so its fingerprint is too); the Record hold shas unchanged as P6 |
| GL.13 | phone parity (delay, never drop): `phone_parity.missing` empty (a class drawn on desktop is drawn on iphone13 at the view's zoom or at +0.5 zoom) |
| GL.14 | every `/slices/<S>/checks` id passes (`expect` an exit code, or `{key, op, value}` read from the JSON tail) |

The final gate (after L3; after Z for the zoom scope) re-runs GL.1-GL.14 over every view of every slice of the scope,
then the Smoke; `FINAL` is written only when all pass.

## 9. Fix units, stuck units, bounds

- Per unit ≤ 2 fixes; a unit stuck after `STUCK_AT` = 3 failed runs (inserted once, `seenIns`); ≤ 2 gate rounds per
  slice, each ≤ 3 fix units (deduplicated against the ledger, `seenFix`); `maxUnits` ≤ 6 per run; every unit after the
  first, the slice gate after a build, and the diagnoser are gated by `lowBudget()` (`ROUND_TOKENS` 700000).
- `agents_bound` (crit agents twice): preflight 4×2 = 8; rebase 2 + atlas-ref record 2 = 4; per unit (accept 2 +
  snapshot 2 + implement 1 + check 2 + measure 2 + 2 × (fix 1 + check 2 + measure 2) + restore 2 + record 2) = 23, × 6
  = 138; slice gate (manifest 2 + rebase 2 + accept 2 + off 2 + frames 2 + static 2 + checks 2 + diagnoser 2) = 16;
  smoke 2; record (manifest 2 + hold 2 + 3 records × 2) = 10; total **178**; README §11 cap **200**. A typical run is
  about 70.
- A partial run is committed: units built before an `infra` stop keep their ledger records and go into the patch
  release with the returned `changelog_line` (the filigree Job 3 rule).

## 10. Outputs and return

Writes `maps-site/living.js`, `maps-site/living/**`, declared hook lines of `maps-site/index.html`, the offline
manifest when it exists, `tools/living-*.js` (instrument extensions, the poster tool in slice Z), and under
`docs/living/`: `accept/`, `captures/` (+ git-ignored `shots/`), `state/3-build/`, `state/3-build.json`,
`gates/3-build-<S>.json`, `gates/3-build.json` (motion) or `gates/3-build-Z.json` (zoom).

Return (`done`): `{…, scope, slice, check_off, held_by?, blocked_by?, gate, final_gate, polish_inserts_above:
SCOPE === 'zoom' ? 'Living 3z · The zoom-through' : 'Living 3 · Implementation'}`.
- `check_off` true only when `FINAL` passed in this run, or on the `nothing to build` rerun after it.
- `polish_note` `Living 3 slice <S>: n/m units built, gate <pass|fail|not run> …`; `changelog_line` `living chart:
  slice <S> — <unit titles>` (or `no unit built (n failed)`).
- reasons: `held`, `blocked`, `plan`, `units-failed`, `gate-fail`, `smoke-fail`, `infra`, `agent died: <label>`,
  `nothing to build`, `coexistence broken: …`, comma-joined GL ids; thrown run faults as §7.

## 11. What this stage reuses (exactly)

- **Copied:** the living prelude.
- **Ported:** the Street 3 skeleton (slices, ledger, stuck at 3, diagnoser and fix units, the restore invariant and
  the re-baseline on a restored temp tree) and the mobile-build per-unit loop (accept authored blind before the
  implementer, whole-tree snapshot, scope check, measured acceptance, ≤ 2 fixes, restore on failure).
- **Run, never edited:** `tools/mobile-tree.js` (snapshot, check, restore: unchanged, with `--snap` under the
  git-ignored `docs/living/shots/loop`), `tools/mobile-capture.js` (`--atlas` captures with `--out` and `--shots-dir`,
  `--accept … --capture … --ref`, `--lint-accept`; never writes `docs/mobile/`), `tools/build-offline-manifest.js`
  (`--atlas`, `--atlas --check`), `tools/street-drift.js`, the filigree and street `ANCHORS`.
- **Owned and extended:** `tools/living-measure.js` (keys only added), `tools/living-drift.js`.

## 12. Stub run (U04 acceptance)

The workflow-1 §11 harness: plan mode returns `reason:'plan'` and `agents_bound` 178 ≤ 200; a hold line with
`census_open:true` returns `held`; the zoom scope with `s4:null` returns `held`; an undeclared `/*LC-HOOK*/` line in the
restore relay throws `restore invariant broken: …`; a unit whose check line lists `index.html` among changed files is
restored and counted failed without a measure; a measure relay with `markers:{FILIGREE:1}` equal to the reference's
passes GL.2 while one with an anchor missing fails it; a full stub with canned passing relays for one L0 unit and its
gate writes `gates/3-build-L0.json` with 14 criteria and returns `check_off:false`; the same on L3 with the smoke
passing returns `check_off:true`; `maxUnits:7`, `gate:'all'`, `discard:['fix-L9x']`, `units:[]` and a relative `cdnDir`
each throw their argument rule; a null `anchors` slot returns `agent died: anchors`; an `anchors` relay with
`on_hook:['W.dragon = ']` throws `anchor lost: W.dragon = (another track's anchor)`; a diagnoser that re-proposes a cure
already in the ledger yields no new fix unit and a log line; a stub `budget` below `ROUND_TOKENS` builds one unit, logs
`budget: unit skipped` and leaves the rest ready; a smoke run reads its inputs from `docs/living/` and writes only under
its outDir. The script never names a writable path matching `NEVER` (a grep of its prompts for
`index.html` as a write target is empty).
