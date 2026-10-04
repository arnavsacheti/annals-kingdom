# Workflow 3 · `street-3-build.js` — Street 3 · Implementation → the street view (multi-run)

> Planning snapshot, 2026-10-04 (final integrated plan). Where the committed script and this document disagree, the
> script wins. The prelude is the **street prelude v1** of `workflow-1-research.md` §0, byte for byte.
> This is the only street job that writes `index.html`, and it runs only while filigree does not hold the sim (§4).

## 1. meta (exact literal)

```js
export const meta = {
  name: 'street-3-build',
  description: 'Street 3: build the street view from street-spec.json units, slice by slice (S0 instrument, S1 streaming, S2 near detail, S3 life, S4 sky and layers); gate = walk test + slice gates',
  whenToUse: 'Run as the POLISH item "Street 3 · Implementation → the street view" (multi-run) after docs/street/gates/2-plan.json passed: Workflow({name:"street-3-build", args:{date:"YYYY-MM-DD"}}). Returns reason "held" while filigree holds the sim. Holds index.html while running.',
  phases: [
    {title: 'Preflight', detail: 'drift, anchors, chain, the filigree hold, ledger, slice, the restore invariant'},
    {title: 'Re-baseline', detail: 'keep or re-measure the off reference (only when index.html changed outside the street track, or the probe changed)'},
    {title: 'Build', detail: 'per unit: implement -> syntax + restore -> accept (scored in code) -> fix<=2 -> determinism -> unit record; index.html units strictly one at a time'},
    {title: 'Smoke', detail: 'both seeds, street on/off, simDays(400), console; STREET-block greps'},
    {title: 'Slice gate', detail: 'determinism first, then capture + metrics reader + static + spec checks; scored in code'},
    {title: 'Fix units', detail: 'diagnoser -> fix units -> rebuild -> re-gate (<= maxRounds)'},
    {title: 'Record', detail: 'shots pruner; state/3-build.json, state/3-build/index-ref.json, gates/3-build-<S>.json, gates/3-build.json when S4 passes'}
  ]
}
```

## 2. Args

Shared + `force` (reason string). Job keys and rules (validated after `checkArgs`):

| arg | default | rule |
|---|---|---|
| `streetRulings` | `{}` | prelude |
| `port` | 0 | prelude (0 = OS-assigned; never 8544) |
| `maxUnits` | 6 | integer 1..12 |
| `units` | — | non-empty array of unit ids, each in the current slice and ready, length ≤ maxUnits; excludes `gate:'only'` |
| `slice` | the first slice whose gate (stamped with the current spec sha) has not passed | `S0`..`S4`; refused if an earlier slice has not passed |
| `gate` | `auto` | `auto` (gate when the slice is complete) \| `skip` \| `only` |
| `unstick` | `[]` | unit id strings whose `runs_failed` is reset for this run |
| `discard` | `[]` | ids matching `^fix-S[0-4]\d+$`; their ledger files are marked `discarded` |

There is **no** `overridePrereqs` and **no** hold override. First body line:
`checkArgs(['streetRulings', 'port', 'maxUnits', 'units', 'slice', 'gate', 'unstick', 'discard'])`.

## 3. Constants

```js
const SLICES = ['S0', 'S1', 'S2', 'S3', 'S4']
const SLICE_NAME = {S0: 'instrument', S1: 'streaming', S2: 'near detail', S3: 'life', S4: 'sky and layers'}
const SPEC_JSON = OUTABS + '/street-spec.json', VIEWS_JSON = OUTABS + '/gates/views.json', BASELINE = OUTABS + '/gates/baseline.json'
const LEDGER_DIR = OUTABS + '/state/3-build', INDEX_REF = OUTABS + '/state/3-build/index-ref.json', OFF_REF = OUTABS + '/state/3-build/off-ref.json'
const TIDINGS = OUTABS + '/fixtures/tidings.json'
const STATS_KEYS = ['fps', 'calls', 'tris', 'buildings', 'trees', 'seed', 'realm', 'treasury', 'pop', 'agents', 'chron']
const HOOK_MARK = '/*ST-HOOK*/'
const FIX_PER_ROUND = 3
const ROUND_TOKENS = 1800000
const IMPL_R = ['R6', 'R13', 'R18', 'R22'], IMPL_ST = ['ST1', 'ST3', 'ST4', 'ST5', 'ST6', 'ST7', 'ST9', 'ST11', 'ST12', 'ST13', 'ST16', 'ST18', 'ST19']
const SINCE = {fade: 'S1', swaps: 'S1', paths: 'S1', jobs: 'S1', vfps: 'S3', spacing: 'S3', clouds: 'S4', shadows_row: 'S4', weather_dial: 'S4', tidings: 'S4', fog: 'S4', hash_table: 'S0'}
const sliceAtLeast = (sl, s) => SLICES.indexOf(sl) >= SLICES.indexOf(s)
const canonJ = v => Array.isArray(v) ? v.map(canonJ) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonJ(v[k])])) : v
const CAPTURE_FLAGS = sl => '--views ' + VIEWS_JSON + ' --layers street=0,street=1 --metrics calls,tris,geoms,textures,objects,stats_keys' + (sliceAtLeast(sl, 'S0') ? ',classes,appear,swaps,jobs,resident --hash-table' : '') + (sliceAtLeast(sl, 'S1') ? ' --paths descent,oscillate,flyaway' : '') + (sliceAtLeast(sl, 'S3') ? ' --vfps 30,60 --queue-hash 600' : '') + (sliceAtLeast(sl, 'S4') ? ' --tidings ' + TIDINGS + ' --sky --fog-pairs 50' : '')   // flags exist from the slice whose units add them (S0.U01: S0-S3 set; S4 units: --tidings, --sky, --fog-pairs)
const expectOk = (exp, out) => {   // acceptance and /checks are scored here, never by the agent that ran them
  const o = String(out ?? '').trim(), e = String(exp ?? '')
  if (e.startsWith('re:')) { try { return new RegExp(e.slice(3)).test(o) } catch (x) { return false } }
  const m = /^(==|<=|>=)\s*(-?\d+(\.\d+)?)$/.exec(e); if (m) { if (!/^-?\d+(\.\d+)?$/.test(o)) return false; const v = Number(o); return isFinite(v) && (m[1] === '==' ? v === +m[2] : m[1] === '<=' ? v <= +m[2] : v >= +m[2]) }
  if (e.startsWith('json:')) { try { return JSON.stringify(canonJ(JSON.parse(o))) === JSON.stringify(canonJ(JSON.parse(e.slice(5)))) } catch (x) { return false } }
  return o === e.trim()
}
```

**The restore invariant** (the coexistence and hook-discipline core, from the sim-engineering X3 graft):
`restore(index.html)` = delete the lines from the one containing `/* STREET */` through the one containing
`/* /STREET */`; then every remaining line containing `HOOK_MARK` is replaced by its spec `replaces` line (or deleted
when `replaces` is null); a marked line absent from the spec's `hook_lines` is reported as `undeclared`. Because every
street edit outside the block is a declared hook, `restore(current)` equals the pre-street `index.html` byte for byte
for as long as only this track has edited the sim (splitting on "\n" and joining on "\n" is lossless, so for a file with no block and no marks `sha_restore` equals `sha256sum index.html`). Hence:
- **foreign change** (another item edited the sim): `sha(restore(current))` ≠ the stamp in `state/3-build/index-ref.json`
  (or, before any Street 3 run, ≠ `baseline.json` `index_sha`) → re-baseline;
- **X3** (only declared hook lines change outside the block): `sha(restore(after))` = `sha(restore(before))` and
  `undeclared` = [].

```js
const RESTORE_TASK = (tag) => `Restore check (write nothing; a node script in a mktemp -d dir): read ${REPO}/index.html and ${SPEC_JSON} (/hook_lines: [{line, replaces}]). Delete the lines from the first line containing "/* STREET */" through the first line after it containing "/* /STREET */" (inclusive; none when absent). Then for every remaining line that contains "${HOOK_MARK}": if it equals some hook_lines[].line exactly, replace it with that entry's replaces (delete the line when replaces is null); otherwise keep it and list it in undeclared. Return {sha_restore: sha256 of the joined result (lines joined with "\\n"), sha_index: sha256sum of index.html, undeclared, marked_n, block_lines, block_top_level: the names the block declares at its top level (const/let/var/function/class at brace depth 0 inside the block)} (${tag}).`
```

## 4. The hold (computed in code; never overridable)

The preflight embeds `HOLD_TASK` (config). With `h = pre.hold`:

```js
const heldBy = holdWhy(h, STR)      // [] when clear
// held  <=>  !(fil3 full unforced pass) || !f3_checked || open filigree fix items || (ST15 strict && latest Filigree 4 gate not pass)
```

When `heldBy.length`: `return done({reason: 'held', check_off: false, held_by: heldBy, polish_note: 'held: filigree
holds the sim (' + heldBy.join('; ') + '); no release, take the next item'})`. Plan mode reports `held` in its result
and still returns the schedule. The hold is a **return**, never a throw: the chain is fine, the sim is busy. This is
the research's Shape C start rule: no street edit lands before `docs/filigree/gates/3-build.json` passes (Filigree 3's
smoke gate loads both apps), and none while a Filigree 3 stuck unit, a Filigree 4 punch item or a Filigree data item is
open.

## 5. Schemas

```js
// S, SA, B, I, N, NN, OBJ, ANCH, DRIFT, FILANCH exactly as in workflow-1 §3.3, followed by that section's 'job helpers' block (driftIds, citedChanged, lowBudget), pasted verbatim; none of it is in the prelude
const HOLD = OBJ({fil3: OBJ({exists: B, pass: B, mode: S, forced: B}), fil4: {type: ['object', 'null'], properties: {k: I, pass: B}},
  f3_checked: B, open: SA, street_data_open: SA})
const RESTORE = OBJ({sha_restore: S, sha_index: S, undeclared: SA, marked_n: I, block_lines: I, block_top_level: SA})
const PRE3 = OBJ({missing: SA, anchors: ANCH, fil_anchors: FILANCH, drift: DRIFT, hold: HOLD, restore: RESTORE,
  gate2: OBJ({exists: B, pass: B, mode: S, forced: B, spec_ok: B, spec_sha256: S}),
  gate1: OBJ({fil_bible_sha256: S, fil_rulings_cited: {type: 'object', additionalProperties: S}}),
  fil_bible_sha256_now: S, fil_overrides: {type: 'object', additionalProperties: S}, st_overrides: {type: 'object', additionalProperties: S},
  spec: OBJ({units: {type: 'array', items: {type: 'object', additionalProperties: {type: ['string', 'number', 'boolean', 'array', 'object', 'null']}}}, checks: {type: 'object', additionalProperties: {type: 'array', items: OBJ({id: S, cmd: S, expect: S})}}, caps: {type: 'object', additionalProperties: {type: 'object', additionalProperties: NN}}, stream: {type: 'object', additionalProperties: NN}, traffic: {type: 'object', additionalProperties: NN}, hook_lines: {type: 'array', items: OBJ({line: S, replaces: {type: ['string', 'null']}})}, fog_unit: B}),
  ledger: {type: 'array', items: OBJ({id: S, status: S, runs_failed: I, spec_sha256: S, discarded: B})},
  slice_gates: {type: 'object', additionalProperties: OBJ({exists: B, pass: B, spec_sha256: S})},
  index_ref: OBJ({exists: B, sha_restore: S, tool_sha: S}),
  off_ref: OBJ({exists: B, sha_restore: S, tool_sha: S}),
  baseline: OBJ({exists: B, index_sha: S, tool_sha: S}),
  tool_sha: S, tree_digest: S, keydown_sha: S})
const REBASE = OBJ({path: S, sha256: S, parsed: B, runs_equal: B, infra_error: S})
const IMPL = OBJ({id: S, files_changed: {type: 'array', items: OBJ({path: S, sha256: S})}, notes: S, dry: B})
const SYN = OBJ({ok: B, errors: SA, restore: RESTORE})
const ACC = OBJ({results: {type: 'array', items: OBJ({id: S, cmd: S, out: S})}, infra_error: S})
const DETU = OBJ({fps: {type: 'object', additionalProperties: OBJ({never: S, off: S, on: S})}, infra_error: S})
const RECU = OBJ({path: S, sha256: S, parsed: B, status: S})
const SMOKE = OBJ({console_errors: SA, infra_error: S, clock_hits: I, rng_hits: I, nowms_hits: I})
const GDET = OBJ({fps: {type: 'object', additionalProperties: OBJ({never: S, off: S, on: S, walk_on: S, walk_off: S})}, infra_error: S})
const CAPT = OBJ({metrics_path: S, metrics_sha256: S, shots_dir: S, infra_error: S})
const DIGEST = OBJ({sha256: S,
  views: {type: 'object', additionalProperties: OBJ({off: {type: 'object', additionalProperties: NN}, on: {type: 'object', additionalProperties: NN}, classes_on: {type: 'object', additionalProperties: I}})},
  appear: OBJ({violations: SA, slowest_ms: NN}), swaps: {type: 'object', additionalProperties: OBJ({in: I, out: I})},
  oscillate_builds: {type: 'object', additionalProperties: I}, flyaway: OBJ({geoms_first: NN, geoms_return: NN, geoms_reseed: NN, resident_max: NN}),
  jobs_max: NN, built_tris_max: NN, vfps: OBJ({h30: S, h60: S}), spacing: OBJ({min_gap: NN, dvis_over_dtrue: I}),
  hash_table: {type: 'array', items: OBJ({hash: S, ok: B, got: S})}, writer_roundtrip: B, stats_keys: SA, inst_no_color: I,
  clouds: OBJ({same_day_equal: B, next_day_differs: B, deck_matches_weather: B}), shadows_row: OBJ({held_text: B, disabled: B, off_kills_shadow: B, default_on_equal: B}),
  weather_dial: OBJ({exact: B, counts: {type: 'array', items: I}}), tidings: OBJ({barriers: I, musters: I, off_zero: B, atlas_equal: {type: ['boolean', 'null']}}),
  fog: OBJ({present: B, src_equal: {type: ['boolean', 'null']}, pairs_equal: {type: ['boolean', 'null']}}), device: {type: ['object', 'null'], properties: {fps_min: N, degrade_max: I}},
  console_errors: SA})
const STATIC = OBJ({clock_hits: I, rng_hits: I, nowms_hits: I, inst_n: I, inst_color_n: I, restore: RESTORE, fil_anchors: FILANCH, street_in_block: {type: 'object', additionalProperties: I}, keydown_sha: S, near_line: B, tree_digest: S})
const CHK = OBJ({results: {type: 'array', items: OBJ({id: S, cmd: S, out: S})}, infra_error: S})
const DIAG = OBJ({units: {type: 'array', items: OBJ({id: S, slice: S, title: S, kind: S, files: SA, deps: SA, covers: SA, hooks: SA,
  acceptance: {type: 'array', items: OBJ({id: S, kind: S, cmd: S, expect: S})}})}, ledger_written: SA})
const PRUNE = OBJ({kept: SA, deleted: SA, count_ok: B})
```

## 6. Agents

| label | phase | role → pair | prompt essentials (`PS(...)`) | schema |
|---|---|---|---|---|
| `preflight` (crit) | Preflight | mech → haiku/low | `ANCHOR_TASK`, `FIL_ANCHOR_TASK`, `DRIFT_TASK`, `HOLD_TASK`, `RESTORE_TASK('preflight')`; `gate2` from `gates/2-plan.json` (spec_ok = artifact shas equal sha256sum of the spec files); `gate1` stamps; `fil_bible_sha256_now`; rulings overrides; `spec` = the read-back of street-spec.json fields named in the schema; the ledger `state/3-build/*.json` (one entry per file, `discarded` when marked); slice gates `gates/3-build-S*.json` and `gates/3-build.json` (`final`) with their spec sha; `index_ref`, `off_ref`, `baseline` stamps; `tool_sha` = sha256sum tools/street-probe.js; `tree_digest` = sha256 over the sorted list of `<path> <sha256>` for every file under maps-site/ and docs/filigree/; `keydown_sha` (Street 1's rule) | PRE3 |
| `rebaseliner` (crit; only when needed, §7) | Re-baseline | mech → haiku/low | twice `--views ${VIEWS_JSON} --layers street=0 --metrics calls,tris,geoms,textures,objects,stats_keys`; per seed twice `--fingerprint --days 400` and `--walk`; write `${OFF_REF}` = baseline.json's shape + `{why, sha_restore, tool_sha, keydown_sha}`; READBACK + runs_equal | REBASE |
| `<id> · implement` | Build | `index.html` in files → judge (opus/high); `tools/street-*.js` → deep (sonnet/high); else audit (sonnet/medium); `MO(role, unit)` | IMPL_PROMPT (below) | IMPL |
| `<id> · syntax[ (fix k)]` | Build | mech → haiku/low | the CLAUDE.md inline-script `new Function` check on index.html; `node --check` on tools; JSON.parse on json; `RESTORE_TASK(id)` | SYN |
| `<id> · accept[ (fix k)]` | Build | audit → sonnet/medium | run each acceptance `cmd` from the repo root (probe kinds via SANDBOX_ST, `--cdn-dir`), return raw stdout per item; never judge | ACC |
| `<id> · fix <k>` (k ≤ 2) | Build | judge for index.html, deep for tools, audit otherwise | IMPL_PROMPT + the failing items with outputs and the restore/undeclared report | IMPL |
| `<id> · determinism` (units touching index.html) | Build | mech → haiku/low | per seed `--fingerprint --days 400` with no street param, `street=0` and `street=1` | DETU |
| `<id> · record` (crit) | Build | mech → haiku/low | write `state/3-build/<id>.json` verbatim (status, runs_failed, spec_sha256, acceptance results, shas); READBACK + status | RECU |
| `smoke` (crit; after a batch that built units) | Smoke | audit → sonnet/medium | SANDBOX_ST; both seeds × {no street param, `street=1`}: load `/?v=${V_BUST}#s=<seed>[&street=1]`, `ANNALS.ready`, `simDays(400)`, collect console + page errors; greps over the STREET block: `ST_CLOCK_GREP`, `W[.]rng`, `nowMs` counts | SMOKE |
| `gate determinism` (crit; alone, first) | Slice gate | mech → haiku/low | per seed: `never` (no param), `off` (`street=0`), `on` (`street=1`), `walk_on`/`walk_off` (`--walk ${VIEWS_JSON}` with street=1/0) | GDET |
| `gate capture` (crit) | Slice gate | audit → sonnet/medium | `node tools/street-probe.js ${CAPTURE_FLAGS(SL)} --cdn-dir <tmp> --out ${OUTABS}/shots/gate-<S>-${DATE}/metrics.json --shots ${OUTABS}/shots/gate-<S>-${DATE}/`; returns only paths, sha and infra_error (the capture never judges) | CAPT |
| `metrics reader` (one retry) | Slice gate | mech → haiku/low | the fixed digest script over metrics.json (prose spec in §8 of the probe contract) + sha256sum; script compares `sha256` with the capture's | DIGEST |
| `gate static` | Slice gate | mech → haiku/low | STREET-block greps; count `new THREE.InstancedMesh` vs `instanceColor`/`setColorAt` uses in the block; `FIL_ANCHOR_TASK`; for every street ANCHORS literal with flag 1, its count inside the block; `RESTORE_TASK('gate')`; keydown sha; the `camera.near = clamp(R*0.02, 0.5, 50)` line present; `tree_digest` (preflight rule) | STATIC |
| `gate checks` | Slice gate | audit → sonnet/medium | run every `/checks/<S>` cmd (S4: every slice's) and return raw outputs | CHK |
| `diagnoser` | Fix units | judge → opus/high | failing criteria + the digest + the restore report → ≤ FIX_PER_ROUND fix units `fix-<S><n>` (n numbered on from the ledger) in the unit shape, same file allowlist and hook rules; write each to `state/3-build/fix-<S><n>.json` with READBACK | DIAG |
| `shots pruner` | Record | mech → haiku/low | keep the two newest run dates under `${OUTABS}/shots/` (`run-*`, `gate-*`), delete the rest, count check | PRUNE |
| `record state` / `record index ref` / `record slice gate` / `record final gate` (crit) | Record | mech → haiku/low | `record` (prelude) | REC |

**IMPL_PROMPT** (essentials, in this order): the unit JSON; the spec rules it `covers` (texts); `rulingText(RUL, IMPL_R)`
+ `rulingText(STR.r, IMPL_ST)`; `VOCAB_ST_RULE`; the anchors map; the spec's `/block` and `/hook_lines`; then the hard
rules:
1. All street JS lives in one `/* STREET */ … /* /STREET */` block of index.html, each marker on its own line: one
   namespace `const STREET = (function(){ … })()` placed directly above the spec's `/block/placement` literal; it declares
   no other top-level name.
2. Outside the block, change only the hook lines this unit lists in `hooks`, written exactly as the spec gives them
   (each contains `/*ST-HOOK*/`); a hook that `replaces` a line replaces exactly that line. Touch no other line.
3. Never call `simAdvance`, `tickDay` or `processArrivals`; never write `departDay`, `route`, `speed` or any `W` field;
   never name `W.rng`; never read `nowMs` or any clock; every random choice is `KEY_IDIOM`, cached per key; presentation
   time is `ST.t += dt`.
4. Every InstancedMesh gets `setColorAt` for every instance (instanceColor) before its first render.
5. Default off: without `street=1` the block builds nothing and adds no scene object; `ANNALS.stats()` keys stay
   STATS_KEYS; street metrics live under `ANNALS.street`.
6. Never put inside the block a filigree ANCHORS literal or a street flag-1 ANCHORS literal (listed); never change
   the `camera.near` line or the keydown handler; no new keys.
7. Player-facing strings obey `VOCAB_ST_RULE` and ST16.
8. In smoke mode write diffs to `${OUTABS}/dry/` and edit nothing.
9. Return `files_changed` with sha256 for every file written.

## 7. Control flow

```js
checkArgs([...]); /* arg rules §2 */
phase('Preflight')
const pre = await crit(PS(PREFLIGHT3), {label: 'preflight', phase: 'Preflight', schema: PRE3, ...M('mech')})
if (!pre) return done({reason: 'agent died: preflight', check_off: false})
if (!pre.drift || pre.drift.ok !== true) die('prelude drift: …')
if ((pre.missing || []).length) die('missing inputs: …')
if (anchorsLost(pre.anchors).length) die('anchor lost: …')
const {r: RUL, used: RUSED} = rulingsMerge(pre.fil_overrides); const STR = stRulingsMerge(pre.st_overrides)
const g2 = pre.gate2 || {}
const chain = [!(g2.exists && g2.pass && g2.mode === 'full' && !g2.forced && g2.spec_ok) ? 'build must not start before the street spec passes (docs/street/gates/2-plan.json pass, spec unchanged)' : '',
  pre.gate1.fil_bible_sha256 !== pre.fil_bible_sha256_now ? 'the filigree density bible changed since Street 1; re-run street-1-research' : '',
  citedChanged(pre.gate1.fil_rulings_cited, RUL).length ? 'the cited filigree rulings changed since Street 1 (…); re-run street-1-research' : ''].filter(Boolean)
if (chain.length && !FORCE && MODE === 'full') die(chain[0])
// slice: SL from args or the first slice without a pass gate stamped with g2.spec_sha256; refuse a later slice:
//   die('slice ' + SL + ' refused: earlier slice ' + x + ' has not passed its gate')
// if (!(pre.spec.checks[SL] || []).length) die('street-spec.json has no /checks for slice ' + SL + ': re-run street-2-plan')
// final gate pass stamped with the current spec -> return done({pass: true, reason: MODE === 'plan' ? 'plan' : 'nothing to build', check_off: MODE === 'full' && !FORCE, slice: 'S4'})
const heldBy = holdWhy(pre.hold, STR)
const blockedBy = (pre.hold && pre.hold.street_data_open) || []
if (MODE === 'plan') return done({reason: 'plan', chain_ok: !chain.length, held: heldBy.length > 0, held_by: heldBy, blocked_by: blockedBy, slice: SL, schedule, agents_bound, check_off: false, polish_note: …})
if (heldBy.length) return done({reason: 'held', check_off: false, held_by: heldBy, slice: SL, polish_note: 'held: filigree holds the sim (' + heldBy.join('; ') + '); no release'})
if (blockedBy.length) return done({reason: 'blocked', check_off: false, blocked_by: blockedBy, slice: SL, polish_note: 'blocked: open Street data (S3) items: …'})
phase('Re-baseline')
// ref = INDEX_REF stamps when it exists, else baseline.json (index_sha is the pristine sha before any street edit)
// keep when pre.restore.sha_restore === (pre.index_ref.exists ? pre.index_ref.sha_restore : pre.baseline.index_sha)
//   && pre.tool_sha === (pre.off_ref.exists ? pre.off_ref.tool_sha : pre.baseline.tool_sha)
// else: rebaseliner (crit) -> OFF_REF; gaps.push('rebaselined: ' + why); !FILE_OK -> done('agent died: rebaseliner'); infra -> done('infra')
const OFFREF_PATH = keep && !pre.off_ref.exists ? BASELINE : OFF_REF
phase('Build')
// ready = slice units (spec + ledger fix units for this slice), not done under the current spec sha, not discarded,
//   runs_failed < 3 unless unstick, deps done; Kahn order (id tie-break); cap MAXU (or args.units)
// lock keys = the unit's files; every unit naming index.html shares the 'index.html' lock => strictly sequential
// buildUnit: implement -> check(0) {syntax+restore, accept} -> while (!ok && k < 2) fix -> check(k)
//   ok = syntax ok && restore.undeclared = [] && restore.sha_restore === pre.restore.sha_restore
//        && every acceptance item expectOk(item.expect, out) && results cover every item && no infra
//   files changed outside unit.files -> failed ('edited outside unit files')
//   then (index.html units) determinism: every seed never === off === on, else failed ('determinism: …')
//   record (crit): status done | failed | infra; runs_failed += 1 on failed
phase('Smoke')   // only when this run built units and no gate ran
// smoke (crit); smokeBad = console errors or any STREET-block hit
phase('Slice gate')   // when every slice unit is done and GATE !== 'skip', or GATE === 'only'
// gateCycle(tag): gate determinism (alone) -> parallel(capture -> metrics reader (sha check, one retry), static, checks) -> sliceCriteria()
phase('Fix units')   // while gate fails && rounds < ROUNDS && !lowBudget() (log() when skipped): diagnoser -> validate fix units (allowlist, hooks ⊆ spec) -> runBatch -> gateCycle
phase('Record')
// shots pruner; record state/3-build.json; record state/3-build/index-ref.json {date, sha_restore: (post-run restore), tool_sha, off_ref: OFFREF_PATH};
// record gates/3-build-<SL>.json when a gate ran; record gates/3-build.json when SL === 'S4' and the gate passed (final)
return done({...})
```

## 8. Slice gate criteria (scored in code by `sliceCriteria(SL, g)`)

`ref` = the off reference (`OFFREF_PATH`), `d` = the metrics digest (sha checked), `st` = static, `gd` = gate
determinism, `caps` = `/caps/<SVn>/on` from the spec. Applicability by slice is in brackets; S4's gate is the
**final** gate and evaluates every criterion including every slice's `/checks`.

| id | criterion | threshold |
|---|---|---|
| GS.1 | every unit of the slice done under the current spec sha and recorded | n/n |
| GS.2 | fingerprint, both seeds: `never === off === on === ref.plain` and `walk_on === walk_off === ref.walk` (64-hex; under the virtual clock the walked run is deterministic even when `ref.view_dependent` records that walking alone moves the sim) | all equal |
| GS.3 | off identity: per view, street=0 `calls, tris, geoms, textures, objects` === `ref.views[SVn]` | exact, 9/9 |
| GS.4 | caps: per view, street=1 each metric ≤ `caps[SVn]`; SV5 and SV9 on === off exactly (far quiet: every street class, the cloud deck included, draws only inside the street band R < 2200, as shadows draw only below 1650) | all |
| GS.5 | static: clock 0, rng 0, nowMs 0 in the block; `inst_n === inst_color_n` and `d.inst_no_color === 0`; `block_top_level` = `['STREET']` | all |
| GS.6 [S1+] | fade: `d.appear.violations` = [] (no class from <0.1 to ≥0.9 opacity in one 1/60 s virtual step) and `slowest_ms` ≤ spec `/fade/ms` ≤ 250 (R6) | both |
| GS.7 [S1+] | hysteresis: on the scripted sweep every threshold swaps exactly 1 in + 1 out | all |
| GS.8 | coexistence: every filigree literal that resolved at preflight still resolves; `fil_anchors.in_street` all 0; street flag-1 literals inside the block all 0; `st.tree_digest === pre.tree_digest` (maps-site/** and docs/filigree/** untouched) | all |
| GS.9 | console clean: `d.console_errors` = [] and the smoke's, both seeds, on and off | 0 |
| GS.10 | the slice's `/checks` all pass by `expectOk` (a check id the spec lacks is a `spec_gap` in gaps and never starts a fix round) | all |
| GS.X3 | hooks: `st.restore.sha_restore === pre.restore.sha_restore` and `undeclared` = [] | both |
| GS.X4 | `st.keydown_sha === ref.keydown_sha` and `st.near_line` | both |
| GS.X5 [S0+, once S0.U02 is done] | `d.hash_table` all ok (⊇ the spec table: `#s=epeshu`, `#s=a&goto=B`, `#goto=B&s=a`, `#notices=u&s=a` (seed a, never the URL), `#s=a&street=1`, `#street=1`, `#notices=u`) and `d.writer_roundtrip` (ANNALS.seed from `#s=epeshu&street=1` keeps `street=1`) | all |
| GS.X6 | `d.stats_keys` deep-equals STATS_KEYS | equal |
| GS.P5 [S1+] | oscillate (R 170↔230 and 2150↔2450, 600 frames): builds per class ≤ 2 | all |
| GS.P6 [S1+] | flyaway twice + reseed: `geoms_return === geoms_first`, `geoms_reseed === geoms_first`, `resident_max` ≤ spec `/stream/resident_tris` | all |
| GS.P7 [S1+] | per frame: `jobs_max` ≤ spec `/stream/max_jobs_frame` (≤6) and `built_tris_max` ≤ `/stream/tri_cap_frame` | both |
| GS.L1 [S3+] | `d.vfps.h30 === d.vfps.h60` (queue positions hash at virtual t = 10 s) | equal |
| GS.L2 [S3+] | at SV4: `min_gap` ≥ spec `/traffic/s0` and `dvis_over_dtrue === 0` | both |
| GS.K1 [S4] | fog: when the FILIGREE fog function exists, `src_equal` (sha of `function <name>` … matching brace, both blocks) and `pairs_equal` (50 fixed (place, day) pairs); when absent, a recorded gap and pass | per ST11 |
| GS.K2 [S4] | clouds: `same_day_equal`, `next_day_differs`, `deck_matches_weather` (SV3, SV8) | all |
| GS.K3 [S4] | shadows row: `held_text` and `disabled` under `pinDegrade(3)`; `off_kills_shadow` at SV1; `default_on_equal` (row default = today's castShadow) | all |
| GS.K4 [S4] | weather dial: drawn precipitation count = round(base × step) for each of the four steps (`exact`) | true |
| GS.K5 [S4] | tidings: with `notices=<fixtures/tidings.json>` barriers = the fixture's shut ways and muster lights = its muster days at Epēshu; `off_zero` (no notices → 0 tiding objects); `atlas_equal` when the atlas sample exists (else a gap) | all |
| GS.R | device (optional, ST8): when `docs/street/device/*.json` exists, recorded (`fps_min ≥ 42`, `degrade_max === 0`); absent → a gap, never a failure here (Street 4 reports it; the default flip needs it) | — |

## 9. Fix units, stuck units, bounds

- Fix rounds ≤ `ROUNDS`; skipped when `lowBudget()` (guarded: `budget && budget.total && budget.remaining() < ROUND_TOKENS`, with a `log()`). The diagnoser's units are validated in code
  (files allowlist as Street 2's UNIT_FILES_OK/BAD, `hooks` ⊆ spec hook lines, ids `^fix-S[0-4]\d+$` unused); invalid
  ones are dropped and logged.
- A unit whose `runs_failed` reaches 3 is stuck: one insert, only on the run it becomes stuck:
  `- [ ] **Street 3 stuck unit <id> — <title>** — <last_failure>; fix by hand, then re-run with args.unstick ["<id>"]; an obsolete fix unit is dropped with args.discard ["<id>"]`.
- **Bound** at `maxUnits:6`, `maxRounds:2`: Preflight 2 + Re-baseline 2 + Build 6 × (implement 1 + syntax 1 + accept 1 +
  2 × (fix 1 + syntax 1 + accept 1) + determinism 1 + record 2) = 72 + Smoke 2 × (1 + 2) = 6 + Slice gate 3 × (det 1 +
  capture 1 + reader 2 + static 1 + checks 1) = 18 + Fix units 2 × (diagnoser 1 + 3 × 12) = 74 + Record (pruner 1 +
  4 records × 2) = 9 → **183 (bound 190; typical ≈40 per run; 5–8 runs in all)**.

## 10. Outputs and return

Outputs: the `/* STREET */` block and declared hook lines in `index.html`; extensions to `tools/street-probe.js`
(Street 1 literals unchanged, re-checked by S0.U01's acceptance); `state/3-build/<id>.json`, `state/3-build.json`,
`state/3-build/index-ref.json`, `state/3-build/off-ref.json` (when re-baselined), `gates/3-build-S{0..4}.json`,
`gates/3-build.json` (final), `shots/` (git-ignored; last two runs).

| field | value |
|---|---|
| `pass` | the final S4 gate passed and every record read back |
| `check_off` | true only then, or on the `nothing to build` rerun of an unforced full run with `gates/3-build.json` pass |
| `reason` | `''` · `held` · `blocked` · `infra` (units built before it are still committed) · `agent died: <label>` · `record-mismatch` · `gate-fail` · `smoke-fail` · `units-failed` · `nothing to build` · `plan` · `smoke` |
| `polish_note` | `Street 3 slice <S>: <n>/<m> units (<ids>); <d> deferred; gate <pass|fail (ids)|not due|skipped>` (+ stuck, smoke, rebaselined) |
| `polish_inserts` | stuck units (above) |
| `polish_inserts_above` | `'Street 3'` |
| `changelog_line` | `- Street 3 slice <S> (<name>): <titles> — behind the street toggle` |
| `slice`, `held_by`, `blocked_by`, `gate`, `final_gate`, `state`, `gate_path`, `owner_rulings_used`, `street_rulings_used` | informational (record-mismatch recovery as filigree Job 3) |

## 11. Stub runs (impl-units acceptance; harness and canned files as workflow-1 §10; scratchpad-only, not reproducible from the repo)

| run | expect |
|---|---|
| `node street-plan/stubrun-street.js <script> '{"date":"2026-10-05","mode":"plan"}' street-plan/stub/s3-fresh.json` | exit 0, `reason === 'plan'`, `chain_ok === false`, `held === true`, `agents_bound` ≤ 190, `violations` = [] |
| `node street-plan/stubrun-street.js <script> '{"date":"2026-10-05"}' street-plan/stub/s3-fresh.json` | exit 3, `threw` contains `build must not start before the street spec passes` |
| `node street-plan/stubrun-street.js <script> '{"date":"2026-10-05"}' street-plan/stub/s3-held.json` | exit 0, `reason === 'held'`, `check_off === false`, `held_by` non-empty, no `Build` phase used (labels contain no ` · implement`) |
| `node street-plan/stubrun-street.js <script> '{"date":"2026-10-05","overridePrereqs":true}'` | exit 3, `unknown arg overridePrereqs` |
