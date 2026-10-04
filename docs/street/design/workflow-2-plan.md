# Workflow 2 · `street-2-plan.js` — Street 2 · Planning → street spec

> Planning snapshot, 2026-10-04 (final integrated plan). Where the committed script and this document disagree, the
> script wins. The prelude is the **street prelude v1** of `workflow-1-research.md` §0, byte for byte
> (`street-plan/street-prelude.js`); only the job body differs.

## 1. meta (exact literal)

```js
export const meta = {
  name: 'street-2-plan',
  description: 'Street 2: turn the street bible into a street spec with build units in slices S0-S4; gate = cold-engineer test',
  whenToUse: 'Run as the POLISH item "Street 2 · Planning → street spec" after docs/street/gates/1-research.json passed: Workflow({name:"street-2-plan", args:{date:"YYYY-MM-DD"}}). Docs-only.',
  phases: [
    {title: 'Preflight', detail: 'drift check, anchors, chain (Street 1 pass, bible unchanged, filigree bible + cited rulings unchanged), ledger'},
    {title: 'Probes', detail: 'frozen before the spec exists: 28-36 probes + readback; the tidings fixture'},
    {title: 'Sections', detail: 'one writer per section -> spec/<sid>.md + .json fragment; anchor check; triage fixer'},
    {title: 'Integrate', detail: 'opus/xhigh integrator -> street-spec.md/.json; red team; patcher'},
    {title: 'Units', detail: 'unit planner -> /units in slices S0-S4 with machine-checkable acceptance'},
    {title: 'Check', detail: 'spec reader (mechanical read-back), anchor + filigree-literal guard, leak grep, vocabulary grep'},
    {title: 'Cold-engineer gate', detail: 'two blind readers (sonnet/high + opus/high) answer the frozen probes from the spec alone; guess auditors; scoring in code'},
    {title: 'Fix', detail: 'spec fixer -> re-read -> re-gate (<= maxRounds)'},
    {title: 'Record', detail: 'gates/2-plan.json, state/2-plan.json'}
  ]
}
```

## 2. Args

Shared + `force` (a reason string; the gate is then recorded `forced_by` and can never pass). Job keys:
`streetRulings`, `port`. First body line: `checkArgs(['streetRulings', 'port'])`.

## 3. Constants

```js
const SLICES = ['S0', 'S1', 'S2', 'S3', 'S4']
const SLICE_NAME = {S0: 'instrument', S1: 'streaming', S2: 'near detail', S3: 'life', S4: 'sky and layers'}
const SECTIONS = [
  {sid: 's01', title: 'Tiers, refine rule, hysteresis, fade', owns: ['/tiers', '/fade'], R: ['R6'], ST: ['ST2', 'ST4'], role: 'judge'},
  {sid: 's02', title: 'Streaming queue, budget, LRU, culling', owns: ['/stream'], R: [], ST: ['ST8', 'ST9'], role: 'judge'},
  {sid: 's03', title: 'Near facades, street surface, sub-cell ground', owns: ['/facades', '/surface', '/ground'], R: ['R22'], ST: ['ST2', 'ST12'], role: 'deep'},
  {sid: 's04', title: 'Instanced props and crowds', owns: ['/props', '/crowds'], R: [], ST: ['ST4', 'ST13'], role: 'audit'},
  {sid: 's05', title: 'Render-only caravans: tiers, spacing, obstacles, gate leaves', owns: ['/traffic', '/gates'], R: [], ST: ['ST3', 'ST4', 'ST5', 'ST6'], role: 'judge'},
  {sid: 's06', title: 'Sky: cloud deck, shadows row, weather dial, the R13 fog copy', owns: ['/sky', '/fog', '/weather'], R: ['R13'], ST: ['ST4', 'ST7', 'ST11', 'ST19'], role: 'audit'},
  {sid: 's07', title: 'Layers rows, hash and parser, notices (the herald\'s tidings)', owns: ['/layers', '/hash', '/notices'], R: ['R12', 'R18'], ST: ['ST7', 'ST18'], role: 'audit'},
  {sid: 's08', title: 'Caps per view and the probe contract', owns: ['/caps', '/probe'], R: [], ST: ['ST8'], role: 'deep'},
  {sid: 's09', title: 'Determinism contract, the STREET block, hook lines, static checks', owns: ['/determinism', '/block', '/hook_lines', '/static'], R: [], ST: ['ST1', 'ST3', 'ST4'], role: 'judge'},
  {sid: 's10', title: 'Checks per slice and fixtures', owns: ['/checks', '/fixtures'], R: [], ST: [], role: 'deep'}
]
const MANDATORY_CHECKS = ['street.fingerprint', 'street.off_identity', 'street.caps', 'street.static_clock', 'street.static_rng',
  'street.instance_color', 'street.fil_anchors', 'street.untouched', 'street.console', 'street.hooks', 'street.keydown', 'street.stats_keys']   // every slice
const SLICE_CHECKS = {S0: ['street.hash_table'], S1: ['street.fade', 'street.swaps', 'street.paths'], S3: ['street.vfps', 'street.spacing'], S4: ['street.clouds', 'street.shadows_row', 'street.weather_dial', 'street.tidings']}   // + 'street.fog_copy' when the fog unit exists
const MANDATORY_UNITS = {
  'S0.U00': 'the STREET block (one namespace const STREET, placed per /block/placement) + the ANNALS.street getter hook (on, set, stats, settledHash, queueHash, parseHash, pinDegrade) + the default-off master row + street=1 read',
  'S0.U01': 'probe extension: --layers street=1 (and street=0 now asserts ANNALS.street absent OR stats().objects === 0), metrics classes/appear/swaps/jobs/resident, path builds/jobs/resident, --paths and --vfps accept comma lists (--paths descent,oscillate,flyaway; --vfps 30,60) with --queue-hash <t>, --hash-table, --phone, device degrade_step; Street 1 literals unchanged (acceptance re-measures baseline.json fields exactly); S4 units add --tidings, --sky, --fog-pairs',
  'S0.U02': 'hash parser (ST18): both seed parse sites anchored to (?:^#|&)s=; every #s= writer keeps the other params',
  'S4.Ufog': 'the R13 fog copy (only when q09 found the function; otherwise a recorded gap, no unit)',
  'S4.Unotices': 'notices reader for notices=<url> (after S0.U02) drawing shut ways and muster days from the R12 schema'}
const UNIT_FILES_OK = /^(index\.html|tools\/street-probe\.js|docs\/street\/(fixtures|shots|device)\/.+)$/
const UNIT_FILES_BAD = /^(maps-site\/|docs\/filigree\/|\.claude\/|tools\/filigree-|tools\/street-drift\.js$|docs\/street\/(gates|state|research)\/|docs\/street\/(street-bible|street-spec)\.|docs\/street\/rulings\.json$|server\.js$|POLISH\.md$|CHANGELOG\.md$|VERSION$)/
const PARAM_OK = p => /^[a-z]+$/.test(p) && !/s$/.test(p) && !['s', 'goto', 'filigree'].includes(p)
const HASH_TABLE_MIN = ['#s=epeshu', '#s=a&goto=B', '#goto=B&s=a', '#notices=u&s=a', '#s=a&street=1', '#street=1', '#notices=u']
const LEAK_RE = 'Tokyo|PLATEAU|jeantimex|OpenStreetMap|\\bOSM\\b|\\bGSI\\b|3D ?Tiles|BatchedMesh|FXMaster|movsim|Foundry'
const PROBES_MIN = 28, PROBES_MAX = 36
const MANDATORY_PROBES = ['P-tier-SV5', 'P-key-crowd', 'P-hash-param', 'P-departDay', 'P-fade-ms', 'P-near', 'P-parser', 'P-dark-hour', 'P-shadows-default', 'P-fog-source', 'P-stats-keys', 'P-hook-marker']
const READER_ALLOWED = [OUTABS + '/street-spec.md', OUTABS + '/street-spec.json']
const ROUND_TOKENS = 600000
const SPEC_MD = OUTABS + '/street-spec.md', SPEC_JSON = OUTABS + '/street-spec.json', PROBES = OUTABS + '/gates/2-probes.json', TIDINGS = OUTABS + '/fixtures/tidings.json'
```

The fixed mandatory probes (answers from the bible, views, baseline or rulings; the writer may add more):

| id | question | answer (kind) |
|---|---|---|
| P-tier-SV5 | the tier the bible gives at SV5's R | bible tier id (enum) |
| P-key-crowd | the key form for crowds | `st:crowd:<settlement id>:day` (string; the bible's) |
| P-hash-param | the street hash param | `street` |
| P-departDay | may a queue move a caravan's departDay? | `no` |
| P-fade-ms | the longest ease after a threshold (R6) | 250 (number, tol 0) |
| P-near | the camera.near rule after the build | `clamp(R*0.02, 0.5, 50)` unchanged |
| P-parser | the seed param pattern after S0 | `(?:^#|&)s=` |
| P-dark-hour | which clock closes the gate leaves | `render` |
| P-shadows-default | the shadows row default | `on` |
| P-fog-source | where the street fog comes from | `filigree:<fn>` or `absent` (from q09) |
| P-stats-keys | may ANNALS.stats() gain a key? | `no` |
| P-hook-marker | the marker every hook line carries | `/*ST-HOOK*/` |

## 4. Schemas

```js
// S, SA, B, I, N, NN, OBJ, ANCH, DRIFT, FILANCH exactly as in workflow-1 §3.3, followed by that section's 'job helpers' block (driftIds, citedChanged, lowBudget), pasted verbatim; none of it is in the prelude
const ANY = {type: ['string', 'number', 'boolean', 'array', 'object', 'null']}
const PRE2 = OBJ({missing: SA, anchors: ANCH, fil_anchors: FILANCH, drift: DRIFT,
  gate1: OBJ({exists: B, pass: B, mode: S, forced: B, md_ok: B, json_ok: B, fil_bible_sha256: S, fil_rulings_cited: {type: 'object', additionalProperties: S}, bible_sha256: S}),
  fil_bible_sha256_now: S, fil_overrides: {type: 'object', additionalProperties: S}, st_overrides: {type: 'object', additionalProperties: S},
  fil_notices: OBJ({exists: B, source: S}),   // source: 'sheet-spec /contracts/notices' | 'maps-site/data/<file>' | ''
  fog: OBJ({exists: B, name: S}),             // from research/q09.json via the bible
  ledger: OBJ({sections: {type: 'array', items: OBJ({sid: S, path: S, sha256: S, sha_ok: B, stamp: S})}, probes_sha256: S, tidings_sha256: S}),
  probes: OBJ({exists: B, frozen: B, sha256: S, bible_sha256: S, rulings_stamp: S, n: I}),
  tidings: OBJ({exists: B, frozen: B, sha256: S}),
  views_ok: B, baseline_ok: B, spec_exists: B})
const PROBEW = OBJ({path: S, sha256: S, parsed: B, n: I})
const PROBERB = OBJ({ok: B, failures: SA, sha256: S, n: I, ids: SA})
const TIDE = OBJ({path: S, sha256: S, parsed: B, schema_source: S, shut_ways: I, muster_days: I})
const SECW = OBJ({sid: S, md: S, json: S, sha_md: S, sha_json: S, pointers: SA, anchors: SA, open: SA})
const ANCHK = OBJ({sid: S, lost: SA})
const INTEG2 = OBJ({md: S, json: S, sha_md: S, sha_json: S, rule_ids: SA})
const RED = OBJ({contradictions: {type: 'array', items: OBJ({a: S, b: S, what: S, severity: {type: 'string', enum: ['blocking', 'minor']}})}})
const UNITW = OBJ({units_n: I, per_slice: {type: 'object', additionalProperties: I}, sha_json: S})
const READER = OBJ({   // the spec reader's read-back: the ONLY source the script scores structure from
  units: {type: 'array', items: OBJ({id: S, slice: S, kind: S, files: SA, deps: SA, covers: SA, hooks: SA, acceptance_n: I, acceptance_ok: B})},
  dag_ok: B, cyclic: SA, untraced_bible_must: SA, rules_without_unit: SA,
  checks: {type: 'object', additionalProperties: SA}, checks_malformed: SA,
  caps: {type: 'object', additionalProperties: {type: 'object', additionalProperties: NN}},
  caps_ceiling_over: SA, far_quiet_ok: B,
  determinism: OBJ({allowed_sources: SA, new_sim_state: SA, key_idiom: S, rng_in_acceptance: SA}),
  hash: OBJ({params: SA, consumes: SA, table: SA}),
  hook_lines: {type: 'array', items: OBJ({line: S, replaces: {type: ['string', 'null']}})}, hook_map_ok: B,
  block: OBJ({placement: S, namespace: S}),
  fog_unit: B, notices_unit: B,
  pointers: {type: 'object', additionalProperties: ANY}})
const GUARD = OBJ({lost: SA, fil_literals_touched: SA, street_literals_touched: SA})
const READ2 = OBJ({answers: {type: 'object', additionalProperties: ANY}, guesses: {type: 'array', items: OBJ({id: S, why: S})}, files_read: SA})
const AUDITG = OBJ({verdicts: {type: 'array', items: OBJ({id: S, schema_guess: B})}})
const FIXR = OBJ({md: S, json: S, sha_md: S, sha_json: S, fixed: SA})
```

## 5. Agents

| label | phase | role → pair | prompt essentials (`PS(...)`) | schema |
|---|---|---|---|---|
| `preflight` (crit) | Preflight | mech → haiku/low | `ANCHOR_TASK`, `FIL_ANCHOR_TASK`, `DRIFT_TASK`; `gate1` from `gates/1-research.json` (md_ok/json_ok = artifact shas equal sha256sum of the bible files; copy `fil_bible_sha256`, `fil_rulings_cited`); `fil_bible_sha256_now` = sha256sum `${FIL}/density-bible.json`; both rulings files; `fil_notices` (read-only); `fog` from `street-bible.json` `/prerequisites` or `research/q09.json`; ledger `state/2-plan.json` (re-hash each section file); probes/tidings files and their stamps; views/baseline parse; writes nothing | PRE2 |
| `probe writer` (crit; skipped while frozen and stamps match) | Probes | judge → opus/high | read ONLY the bible, views.json, baseline.json and the rulings text in the prompt (no spec exists yet); write `${PROBES}` = `{date, frozen: true, bible_sha256, rulings_stamp: <rulingText(RUL, FIL_CITED) + rulingText(STR.r, all ST)>, probes: [{id, q, kind: number|enum|string|order|pointer, options?, answer?, tol?, pointer?, source: bible|views|baseline|ruling|spec}]}`, 28–36 probes, every MANDATORY_PROBES id with its answer, ≥12 spec probes (question + JSON pointer into street-spec.json, no answer) spread over every section's `owns`; READBACK + n | PROBEW |
| `probe readback` | Probes | mech → haiku/low | JSON.parse; unique ids; kinds; 28–36; every fixed probe has `answer`, every spec probe has `pointer` and no `answer`; MANDATORY_PROBES present; `frozen === true`; stamps equal those in the prompt | PROBERB |
| `tidings fixture` (crit; frozen while resume) | Probes | audit → sonnet/medium | write `${TIDINGS}` in the R12 notices schema (`fil_notices.source`, read-only; absent → the bible's notice classes and `schema_source: 'bible'`, recorded as a gap): seed epeshu, sim day 120, one shut way on the SV4 approach route (its route id from views.json + the sim), one muster day at Epēshu; READBACK + counts | TIDE |
| `<sid> · writer` | Sections | per SECTIONS (`judge` opus/high, `deep` sonnet/high, `audit` sonnet/medium) | from the bible alone (+ views, baseline, q-evidence the bible cites): write `spec/<sid>.md` and `spec/<sid>.json` holding exactly the pointers it owns; cite index.html literals as `index.html :: <literal>`; the section's cited R/ST texts; KEY_IDIOM; `VOCAB_ST_RULE`; never name a probe | SECW |
| `<sid> · anchors` | Sections | mech → haiku/low | every `index.html :: literal` in the section resolves by indexOf | ANCHK |
| `<sid> · anchor fix` (only on misses) | Sections | triage → sonnet/low | re-anchor by pattern or drop the claim; rewrite the section files only | SECW |
| `spec integrator` (crit) | Integrate | integ → opus/xhigh | merge spec/*.json fragments + md into `${SPEC_MD}` + `${SPEC_JSON}` (SPEC_SHAPE below); `## Provenance` is the only place source names may appear; rules `SS-NN` each with `traces: [bible rule ids]` | INTEG2 |
| `red team` | Integrate | judge → opus/high | contradictions between sections, against the cited R/ST texts and the determinism contract | RED |
| `spec patcher` (crit; only when blocking contradictions) | Integrate | judge → opus/high | fix each blocking contradiction; never renumber ids | INTEG2 |
| `unit planner` | Units | judge → opus/high | write `/units` into `${SPEC_JSON}`: `[{id, slice, title, kind: logic|tool|doc, files, deps, covers: [SS ids], hooks: [hook line literals], acceptance: [{id, kind: node|grep|json|probe, cmd, expect}], model?, effort?}]`; MANDATORY_UNITS present (S4.Ufog only when `fog.exists`); ≤9 units per slice; files match UNIT_FILES_OK, never UNIT_FILES_BAD; `expect` forms: an exact string, `re:<regex>`, `==N`, `<=N`, `>=N`, or `json:<value>` (the build scores them in code) | UNITW |
| `spec reader` | Check | mech → haiku/low | a fixed node read-back of `${SPEC_JSON}` + `street-bible.json` producing READER (traceability: every bible rule of kind `must` traced by some SS rule's `traces`; every SS rule covered by ≥1 unit; Kahn DAG; `checks` ids per slice and malformed entries; caps per view and `caps_ceiling_over` against the bible; `far_quiet_ok` = SV5 and SV9 `on` caps equal baseline; `hook_map_ok` = the map hook line → replaces is a function and every `line` contains `/*ST-HOOK*/`; `pointers` = the value at every spec-probe pointer of `${PROBES}`, null when absent) | READER |
| `literal guard` | Check | mech → haiku/low | every `index.html` literal the spec cites and every hook `replaces` line occurs in index.html; no hook `line` contains a filigree ANCHORS literal (index.html, flag 1, read from filigree-1-research.js) or a street flag-1 literal | GUARD |
| `leak grep` | Check | mech → haiku/low | `LEAK_RE` (case-insensitive) over `${SPEC_MD}` outside `## Provenance` and over every string of `${SPEC_JSON}` | VHITS |
| `vocabulary grep` | Check | mech → haiku/low | `VOCAB_ST` over `${SPEC_MD}` outside `## Provenance`/`## Renames` and over every `label`, `row`, `text` and `player` string of `${SPEC_JSON}` | VHITS |
| `reader A` / `reader B` | Cold-engineer gate | A deep → sonnet/high, B judge → opus/high (identical prompts) | blind: read ONLY READER_ALLOWED; answer every probe `{id, q, kind, options}` (spec probes: the value the spec gives); list guesses (an answer not stated by the spec); `files_read` | READ2 |
| `guess audit <A|B>` (only when guesses) | Cold-engineer gate | triage → sonnet/low | per guess: is the answer derivable from the spec text (false = a schema-path guess)? | AUDITG |
| `spec fixer` | Fix | judge → opus/high | fix only: probes both readers missed, null pointers, missing checks, cap rows, malformed acceptance, schema-path guesses | FIXR |
| `record gate` / `record ledger` (crit) | Record | mech → haiku/low | `record` (prelude) | REC |

**SPEC_SHAPE** (`street-spec.json`):

```
{date, bible_sha256, rules: [{id: "SS-01", text, traces: [bible rule ids]}],
 tiers: {bands: [{tier, R_min, R_max}], refine: {kind: "sse", target_px, geom_err_m: {T0..T4}},
         hysteresis: [{tier, in_R, out_R}]},                       // out_R > in_R; all <= 2200 (inside meshHi)
 fade: {ms, method: "opacity"|"dither"},                           // ms <= 250 (R6)
 stream: {max_jobs_frame, tri_cap_frame, resident_tris, lru: "map", cull: "sphere"},   // max_jobs_frame <= 6 (ST9)
 facades: {...}, surface: {...}, ground: {rule}, props: {...}, crowds: {key, scale},
 traffic: {s0, T, v0, obstacles: [{class, key, rule}]}, gates: {clock: "render"},
 sky: {clouds: {key, states}, shadows: {row_default: "on"}}, fog: {source: "filigree:<fn>" | "absent", helpers: []},
 weather: {steps: [1, 0.75, 0.5, 0.25]},
 layers: {rows: [{label, default}], param: "street"},
 hash: {params: ["street"], consumes: ["notices"], parser: {pattern: "(?:^#|&)s=", sites: 2},
        table: [{hash, expect: {seed, goto, street}}]},
 notices: {schema_source, fixture: "fixtures/tidings.json", classes: [...]},
 caps: {SV1..SV9: {on: {calls, tris, objects, quads_per_frame, built_tris_per_frame, resident_tris}}},
 probe: {flags_added: [...], api: ["on", "set", "stats", "settledHash", "queueHash", "parseHash", "pinDegrade"]},
 determinism: {allowed_sources: ["keyed-hash", "sim-read-only"], new_sim_state: [], key_idiom: KEY_IDIOM, forbidden: [...]},
 block: {placement: "<index.html literal the block sits directly above>", namespace: "STREET"},
 hook_lines: [{line: "<exact final text incl. indentation, contains /*ST-HOOK*/>", replaces: "<exact original line>" | null}],
 static: {checks: [...]},
 checks: {S0: [{id, cmd, expect}], S1: [...], S2: [...], S3: [...], S4: [...]},
 fixtures: {views: "gates/views.json", baseline: "gates/baseline.json", tidings: "fixtures/tidings.json"},
 prerequisites: [{item, blocks, polish_title}],
 units: [...]}
```

## 6. Control flow

```js
checkArgs(['streetRulings', 'port'])
phase('Preflight')
const pre = await crit(PS(PREFLIGHT2), {label: 'preflight', phase: 'Preflight', schema: PRE2, ...M('mech')})
if (!pre) return done({reason: 'agent died: preflight'})
if (!pre.drift || pre.drift.ok !== true) die('prelude drift: …')
if ((pre.missing || []).length) die('missing inputs: …')
const lost = anchorsLost(pre.anchors); if (lost.length) die('anchor lost: …')
const {r: RUL, used: RUSED} = rulingsMerge(pre.fil_overrides); const STR = stRulingsMerge(pre.st_overrides)
const g1 = pre.gate1 || {}
const chain = [
  !(g1.exists && g1.pass && g1.mode === 'full' && !g1.forced && g1.md_ok && g1.json_ok) ? 'planning must not start before the street bible exists (docs/street/gates/1-research.json pass, bible unchanged)' : '',
  g1.fil_bible_sha256 && g1.fil_bible_sha256 !== pre.fil_bible_sha256_now ? 'the filigree density bible changed since Street 1; re-run street-1-research' : '',
  citedChanged(g1.fil_rulings_cited, RUL).length ? 'the cited filigree rulings changed since Street 1 (' + citedChanged(g1.fil_rulings_cited, RUL).join(', ') + '); re-run street-1-research' : ''].filter(Boolean)
const chainOk = !chain.length
if (MODE === 'plan') return done({reason: 'plan', chain_ok: chainOk, chain, schedule, bound: 90, agents_max, over_bound: agents_max > 90, …})
if (!chainOk && !FORCE && MODE === 'full') die(chain[0])   // a thrown prerequisite: the run treats it as blocked
phase('Probes')
// probe writer (skip when RESUME && frozen && sha matches the ledger && bible + rulings stamps match) -> readback
//   readback !ok -> die('gates/2-probes.json is invalid (' + failures + '); delete it and rerun with resume:false')
// tidings fixture (skip when frozen and its sha matches the ledger) -> FILE_OK or done('agent died: tidings fixture')
phase('Sections')
// pipeline over SECTIONS needing a write: writer -> anchors -> (lost.length ? anchor fix -> anchors) ; kept() >= 75%
phase('Integrate')
// integrator (crit) -> red team -> patcher when blocking contradictions
phase('Units')
// unit planner
phase('Check')
// parallel: spec reader, literal guard, leak grep, vocabulary grep
phase('Cold-engineer gate')
// parallel(reader A, reader B) -> guess audits -> evaluate()
// Fix loop: while failing && rounds < ROUNDS && !lowBudget() (log() when skipped): spec fixer -> Check (all four) -> gate again
phase('Record')
// record gates/2-plan.json (gateObj incl. street_rulings_used, artifacts: spec md/json, bible json, probes, tidings shas)
// record state/2-plan.json {job, date, sections: [...], probes_sha256, tidings_sha256, bible_sha256, spec: {md, json}}
return done({...})
```

## 7. Gate: cold-engineer test (scored in code)

Probe scoring: number within `tol` (default 0), enum/string by `norm`, order exact; a spec probe is scored against
the spec reader's `pointers[pointer]` (never the integrator's claim). A reader's score = correct / total.

| id | criterion | threshold |
|---|---|---|
| SG2.0 | chain held (Street 1 pass, bible unchanged, filigree bible and cited rulings unchanged) | true (forced → recorded, never pass) |
| SG2.1 | traceability + structure (reader): `untraced_bible_must` = [], `rules_without_unit` = [], `dag_ok`, ≤9 units per slice, every unit `acceptance_n` ≥1 and `acceptance_ok` | all |
| SG2.2 | unit files: every file matches UNIT_FILES_OK and none UNIT_FILES_BAD | 0 violations |
| SG2.3 | literal guard: `lost` = [], `fil_literals_touched` = [], `street_literals_touched` = [] | all empty |
| SG2.4 | leak grep | 0 hits |
| SG2.5 | spec-probe pointers null | 0 |
| SG2.6 | each reader | ≥90% |
| SG2.7 | checks: every slice S0–S4 non-empty, `checks_malformed` = [], union ⊇ MANDATORY_CHECKS, each slice ⊇ SLICE_CHECKS[slice], S4 ⊇ `street.fog_copy` when `fog_unit` | all |
| SG2.8 | caps: SV1–SV9 numeric (6 metrics), `caps_ceiling_over` = [], `far_quiet_ok` | all |
| SG2.9 | determinism: allowed_sources = `['keyed-hash','sim-read-only']`, new_sim_state = [], key_idiom = KEY_IDIOM, `rng_in_acceptance` = [] | all |
| SG2.10 | hash: every param `PARAM_OK`; if `consumes` has `notices` then S0 has `S0.U02` and the table ⊇ HASH_TABLE_MIN | all |
| SG2.11 | hook lines: `hook_map_ok`, count ≤16, every unit's `hooks` ⊆ hook_lines, `block.namespace` = `STREET` | all |
| SG2.12 | mandatory units present (S4.Ufog iff `pre.fog.exists`; S4.Unotices iff `consumes` has notices) | all |
| SG2.13 | vocabulary | 0 hits |
| SG2.14 | blindness and guesses: both readers' `files_read` ⊆ READER_ALLOWED; zero `schema_guess: true` (a missing audit verdict fails) | all |
| SG2.15 | artifacts hashed: spec md/json, bible json, probes, tidings (64-hex each) | all |

Fix-loop note (filigree §12): a probe missed by both readers is spec ambiguity and goes to the fixer; one missed by a
single reader is logged as noise.

## 8. Bounds

Preflight 2 + Probes (writer 2 + readback 1 + tidings 2) 5 + Sections 10 × 3 = 30 + Integrate 2 + 1 + 2 = 5 + Units 1 +
Check 4 + Gate 4 + Fix 2 × (1 + 4 + 4) = 18 + Record 4 = 2 + 5 + 30 + 5 + 1 + 4 + 4 + 18 + 4 = **73 (bound 90; typical ≈50)**; `agents_max` is computed in code from these same terms
(`2 + 5 + 3 * SECTIONS.length + 5 + 1 + 4 + 4 + ROUNDS * 9 + 4`) and `over_bound` / README §11 quote that value. A fix round is skipped
when `lowBudget()` is true (`ROUND_TOKENS` = 600000), with a `log()`.

## 9. Outputs and return

Outputs: `docs/street/street-spec.{md,json}`, `spec/s01..s10.{md,json}`, `gates/2-probes.json` (frozen while
`resume:true`), `fixtures/tidings.json` (frozen while `resume:true`), `cold/{A,B}[-r<k>].json` (the readers' answers,
written by the script via `record`), `gates/2-plan.json`, `state/2-plan.json`.

| field | value |
|---|---|
| `pass` | gate pass and records read back |
| `reason` | `''` · `forced: <reason>` · failing ids joined `,` · `record-mismatch` · `agent died: <label>` · `infra` · `plan` · `smoke` |
| `polish_note` | `street spec: <u> units (S0 <a> / S1 <b> / S2 <c> / S3 <d> / S4 <e>), readers <A>% / <B>%, <n> probes; gate pass|fail` |
| `polish_inserts` | `- [ ] **Street data (S3) — <item>**` for each spec `/prerequisites` entry whose `polish_title` is not queued and no `Street data (S3) — <item>` exists (directly above Street 3) |
| `polish_inserts_above` | `'Street 3'` |
| `changelog_line` | `- docs: Street 2 — street spec (cold-engineer gate pass|fail)` |
| `chain_ok`, `gate`, `gate_path`, `owner_rulings_used`, `street_rulings_used` | as filigree Job 2 (plus the street rulings) |

## 10. Stub runs (impl-units acceptance; harness and canned files as workflow-1 §10; scratchpad-only, not reproducible from the repo)

| run | expect |
|---|---|
| `node street-plan/stubrun-street.js <script> '{"date":"2026-10-05","mode":"plan"}' street-plan/stub/s2-fresh.json` | exit 0, `reason === 'plan'`, `chain_ok === false`, `bound === 90`, `violations` = [] |
| `node street-plan/stubrun-street.js <script> '{"date":"2026-10-05"}' street-plan/stub/s2-fresh.json` | exit 3, `threw` contains `planning must not start before the street bible exists` |
| `node street-plan/stubrun-street.js <script> '{"date":"2026-10-05","mode":"plan"}' street-plan/stub/s2-cited.json` (gate 1 passed, R6 text stale: exercises `citedChanged` on the chain-failure path) | exit 0, `reason === 'plan'`, `chain_ok === false`, `chain` has one entry that contains `cited filigree rulings changed` and `R6` |
| `node street-plan/stubrun-street.js <script> '{"date":"2026-10-05","force":"stub"}' street-plan/stub/s2-fresh.json` | exit 0, `pass === false`, `reason` starts `forced` or lists criterion ids (a forced gate never passes) |
