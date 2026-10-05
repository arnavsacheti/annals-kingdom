# Workflow 2 · `living-2-plan.js` — Living 2 · Planning → living spec (cold-animator gate)

> Planning snapshot, 2026-10-05. Where the committed script and this document disagree, the script wins. The prelude
> is **the living prelude** of `workflow-1-research.md` §0, byte for byte (`tools/living-drift.js` L1, L2). Docs-only:
> writes nothing outside `docs/living/`. Staged at `docs/living/design/workflows/living-2-plan.js` until Living 0.

## 1. meta (exact literal)

```js
export const meta = {
  name: 'living-2-plan',
  description: 'Living 2: turn the living bible into a living spec with build units in slices L0-L3 and Z; gate = cold-animator test',
  whenToUse: 'Run as the POLISH item "Living 2 · Planning → living spec" after docs/living/gates/1-research.json passed: Workflow({name:"living-2-plan", args:{date:"YYYY-MM-DD"}}). Docs-only. Returns reason "held" while a mobile item is open or a mobile or street tool runs.',
  phases: [
    {title: 'Preflight', detail: 'drift, re-anchor, the hold, the Living 1 chain (bible, cited rulings, stamps), ledger'},
    {title: 'Probes', detail: 'frozen probes written before any spec section; baked answers fixed in code'},
    {title: 'Sections', detail: 'twelve targeted section writers s01-s12 in parallel -> docs/living/spec/<sid>.{md,json}'},
    {title: 'Integrate', detail: 'opus/xhigh integrator -> living-spec.md/.json: units, checks, hook lines, accept template'},
    {title: 'Anchors', detail: 'every hook anchor and replaced line found once in maps-site/index.html; fixer'},
    {title: 'Red team', detail: 'one adversary on coexistence and the hold; one integrator patch'},
    {title: 'Cold-animator gate', detail: 'paired blind readers (sonnet/high + opus/high) on the spec alone; guess auditor; scoring in code'},
    {title: 'Fix', detail: 'spec fixer -> anchors -> readers -> auditor (<= maxRounds)'},
    {title: 'Record', detail: 'gates/2-plan.json, state/2-plan.json (checkpointed after Probes and Sections)'}
  ]
}
const JOB = 'living-2-plan'
```

## 2. Args

Shared (prelude): `date`, `repo`, `outDir` (default `docs/living`), `mode`, `maxRounds` (0..2), `resume`, `force` (a
non-empty reason; the chain is skipped, the gate is recorded `forced_by` and never passes); `rulings` refused. First
body line `checkArgs(['livingRulings'])`. `livingRulings`: the config's validation; Living 2 reads the merged texts of
the non-fixed rulings as answers (`LC1 LC4 LC5 LC6 LC7 LC8 LC9 LC11 LC14 LC15 LC16 LC17`), every baked probe stays
fixed.

## 3. Constants

```js
checkArgs(['livingRulings'])
const IN = MODE === 'smoke' ? DOCS : OUTABS   // chain inputs: a smoke run reads the durable docs/living read-only and writes only under its outDir
const GATE1 = IN + '/gates/1-research.json', GATE2 = OUTABS + '/gates/2-plan.json', LEDGER = OUTABS + '/state/2-plan.json'
const BIBLE_MD = IN + '/living-bible.md', BIBLE_JSON = IN + '/living-bible.json', VIEWS_JSON = IN + '/gates/views.json', VIEW_DATA = IN + '/gates/view-data.json', L0 = IN + '/captures/L0.json'
const SPEC_MD = OUTABS + '/living-spec.md', SPEC_JSON = OUTABS + '/living-spec.json', SPEC_DIR = OUTABS + '/spec', COLD = OUTABS + '/cold', PROBES = OUTABS + '/gates/2-probes.json'
const SLICES = ['L0', 'L1', 'L2', 'L3', 'Z']
const SLICE_NAME = {L0: 'instrument and hooks', L1: 'the still chart, the clock and the dark hour', L2: 'routes and traffic', L3: 'sea, sky and creatures', Z: 'the zoom-through and exhibits'}
const ALLOWED_FILES = [/^maps-site\/living\.js$/, /^maps-site\/living\/[A-Za-z0-9._\/-]+$/, /^maps-site\/index\.html$/, /^tools\/living-[a-z-]+\.js$/, /^docs\/living\/(fixtures|accept)\/[A-Za-z0-9._\/-]+$/]
const NEVER_FILES = /^(index\.html|\.claude\/|docs\/(filigree|street|mobile)\/|tools\/(filigree|street|mobile)-|tools\/street-drift\.js|tools\/build-offline-manifest\.js|server\.js|vendor\/)/
const MANDATORY_CHECKS = ['off-identity', 'ug4-rescore', 'still-frame', 'moves', 'still-chart', 'stop', 'tokens', 'zoom-sync', 'appear', 'lazy-failure', 'bytes', 'voice', 'coexistence', 'phone-parity']
const CHECK_CMDS = /^(node tools\/mobile-capture\.js (--accept|--lint-accept) |node tools\/living-measure\.js |node tools\/living-drift\.js|node tools\/street-drift\.js|node tools\/build-offline-manifest\.js --atlas --check|node -e 'const fs=)/   // the last prefix admits the CLAUDE.md syntax one-liner without naming its module loader (no forbidden token in the script text)
const ACCEPT_GATES = ['UG1', 'UG2', 'UG3', 'UG6', 'UG7', 'UG8', 'UG10', 'UG11']
const WAIVE = {
  UG4: 'living track: the /* FILIGREE */ and /* STREET */ markers exist by design after Filigree 3 and Street 3; the anchor, drift and tithe halves are re-scored by living-3-build (GL.2)',
  UG5: 'atlas-only unit: index.html is byte-unchanged (GL.12 scores its sha against the reference)',
  UG9: 'living strings are listed in docs/living/README.md §13 and scored by living-measure --static (GL.2); with living absent no string is added'
}
const BAKED = {   // probe answers fixed by code and rulings, whatever the bible says
  'P-param': 'living', 'P-default': 'off', 'P-rise': 'none', 'P-dark': 'whole-sheet dim', 'P-fps-fine': 20, 'P-fps-coarse': 15,
  'P-fps-oneshot-phone': 30, 'P-dt-clamp-ms': 100, 'P-hash-keep': 'setHash keeps living=1', 'P-snapshot': 'maps-site/living/traffic.json',
  'P-notices': 'read only', 'P-3d': 'H2z then H2', 'P-hook-cap-raw': 200, 'P-ug4': 'waived', 'P-key': 'lc:<class>:<id>:<k>',
  'P-still-instant': 't0', 'P-ease-ms': 250, 'P-createpane': 0, 'P-clock-tokens': 0, 'P-webgl': 'none',
  'P-weather-source': 'seeded atlas function of place and snapshot day on the R13 fog function; no sim state'
}
const POST_NAMES = /\b(Mini Tokyo|Marauder|Game of Thrones|How to Train Your Dragon|Lombard|Collison|Azlen|Bay Atlas|TripsLayer|windy)\b/i   // allowed only under ## Provenance
const ROUND_TOKENS = 600000   // one fix round (≈ 11 agents) with headroom; read by the config's lowBudget()
const SECTIONS = [ /* §5.2 */ ]
```

## 4. Schemas

```js
const S = {type: 'string'}, B = {type: 'boolean'}, I = {type: 'integer'}, SA = {type: 'array', items: S}, OBJ = {type: 'object'}
const PRE2 = {type: 'object', properties: {missing: SA, anchors: OBJ, chain: {type: 'object', properties: {gate1: OBJ, bible_md_sha: S, bible_json_sha: S, stamps_now: OBJ, cited_now: OBJ}, required: ['gate1', 'bible_md_sha', 'bible_json_sha', 'stamps_now', 'cited_now']}, overrides: OBJ, ledger: OBJ, gate_prev: OBJ, probes_file: OBJ}, required: ['missing', 'anchors', 'chain', 'overrides', 'ledger', 'gate_prev', 'probes_file']}
const HOLD = {type: 'object', additionalProperties: true, properties: {ok: B, len: I, sum: S}, required: ['ok', 'len', 'sum']}
const DRIFT = {type: 'object', properties: {living: OBJ, street: OBJ}, required: ['living', 'street']}
const PROBE = {type: 'object', properties: {id: S, q: S, kind: {type: 'string', enum: ['number', 'enum', 'pointer', 'list', 'text']}, source: {type: 'string', enum: ['bible', 'baked', 'ruling']}, expected_json: S, spec_pointer: S, cite: S}, required: ['id', 'q', 'kind', 'source', 'expected_json', 'spec_pointer', 'cite']}   // expected_json: the answer as JSON text, JSON.parse'd in code before the compare (every property typed)
const PROBES_OUT = {type: 'object', properties: {path: S, sha256: S, parsed: B, probes: {type: 'array', items: PROBE}}, required: ['path', 'sha256', 'parsed', 'probes']}
const SEC = {type: 'object', properties: {sid: S, md: OBJ, json: OBJ, owns: SA, rules_n: I}, required: ['sid', 'md', 'json', 'owns', 'rules_n']}   // md/json = {path, sha256, parsed}
const SPEC = {type: 'object', properties: {md: OBJ, json: OBJ, counts: {type: 'object', properties: {units_n: I, rules_n: I, checks_n: I, hooks_n: I}, required: ['units_n', 'rules_n', 'checks_n', 'hooks_n']}, canonical_len: I}, required: ['md', 'json', 'counts', 'canonical_len']}
const SPEC_READ = {type: 'object', additionalProperties: true, properties: {ok: B, len: I, sum: S}, required: ['ok', 'len', 'sum']}   // node tools/living-measure.js --spec-summary SPEC_JSON --bible BIBLE_JSON: units[{id, slice, files, kind, depends_on, acceptance_n, acceptance_ok}], rules[{id, covers}], bible_must[], slices{S:{check_ids, cmds}}, hook_lines[{id, anchor, replaces, text_len, replaces_len, marked}], hash, caps, eases, rise_rules, gated_units, accept_template, strings, prerequisites, md_post_names, md_vocab_hits, counts
const ANCH2 = {type: 'object', properties: {hooks: {type: 'array', items: {type: 'object', properties: {id: S, anchor_n: I, replaces_n: I, fil_st_literal: B}, required: ['id', 'anchor_n', 'replaces_n', 'fil_st_literal']}}, lint_exit: I}, required: ['hooks', 'lint_exit']}
const RED = {type: 'object', properties: {contradictions: {type: 'array', items: {type: 'object', properties: {a: S, b: S, why: S, fix: S}, required: ['a', 'b', 'why', 'fix']}}}, required: ['contradictions']}
const READ = {type: 'object', properties: {answers: {type: 'array', items: {type: 'object', properties: {id: S, answer_json: S, schema_path: S}, required: ['id', 'answer_json', 'schema_path']}}, files_read: SA}, required: ['answers', 'files_read']}
const AUDIT = {type: 'object', additionalProperties: true, properties: {ok: B, len: I, sum: S}, required: ['ok', 'len', 'sum']}   // --resolve-pointers SPEC_JSON <answers>: resolved{reader:{id: bool}}, values{reader:{id: value}}, spec_ptr{probe id: bool}
const FIXED = {type: 'object', properties: {md: OBJ, json: OBJ, fixed: SA}, required: ['md', 'json', 'fixed']}
```

## 5. Agents

### 5.1 Pipeline agents

| label | phase | role → model/effort | prompt essentials | schema |
|---|---|---|---|---|
| `preflight` | Preflight | triage → sonnet/low | `ANCHOR_TASK`; inputs exist (bible md/json, views, view-data, L0, rulings.json); `GATE1` parsed; sha256 of both bible files; the current texts of the cited R/ST rulings and the Living 1 `stamps` files (sheet spec, density bible, filigree views, mobile-capture, mobile-tree); overrides of `docs/living/rulings.json`; `LEDGER`, `GATE2`, `PROBES` (parsed or null) | `PRE2` |
| `hold` | Preflight | triage | `HOLD_TASK_LC` | `HOLD` |
| `drift` | Preflight | triage | `DRIFT_TASK_LC` | `DRIFT` |
| `prober` | Probes | judge → opus/high | sees the bible, the merged LC rulings, `VIEWS_JSON`, `VIEW_DATA`, never a spec; writes `PROBES` = `{frozen:true, bible_sha256, rulings_used, probes:[≥ 30 PROBE]}` with every key of `BAKED` as `source:'baked'` and `expected_json` = `JSON.stringify` of its value; bible probes answerable in closed form from the bible (a pointer, number, enum or list), each with the `spec_pointer` where the spec must answer it (e.g. `/hash/param`, `/budgets/draws_per_s/coarse`, `/devices/LC-footprints/still`, `/hook_lines`) | `PROBES_OUT` |
| `s01`…`s12` | Sections | per §5.2 | the bible, the merged rulings, the section's brief and owned pointers, `VOCAB_LC_RULE`, the C1-C16 corrections of `docs/living/todo-inputs.json`; write `SPEC_DIR/<sid>.md` and `<sid>.json` (rules with `covers` = bible rule ids); never write outside `SPEC_DIR` | `SEC` |
| `integrator` | Integrate | integ → opus/xhigh | the twelve sections only; write `SPEC_MD` and `SPEC_JSON` in the shape of §5.3; units in slices with ≤ 8 per slice, files only `ALLOWED_FILES`; the accept template with `ACCEPT_GATES` and `WAIVE` verbatim; `/slices/<S>/checks` with every `MANDATORY_CHECKS` id; `## Provenance` the only place for source names | `SPEC` |
| `spec reader` | Integrate | triage | `node tools/living-measure.js --spec-summary SPEC_JSON --bible BIBLE_JSON --md SPEC_MD`; return the line unchanged | `SPEC_READ` |
| `spec reader (red team)` / `spec reader (fix <r>)` | Red team / Fix | triage | as `spec reader` | `SPEC_READ` |
| `anchors` | Anchors | mech → haiku/low | for each hook line: count `anchor` and `replaces` occurrences in `maps-site/index.html` (String.indexOf loops, strings only); `FIL_ST_ANCHOR_TASK` literals contained in `text` or `replaces`; fill the accept template with a sample unit and run `node tools/mobile-capture.js --lint-accept <tmp>` | `ANCH2` |
| `anchor fixer` | Anchors | triage → sonnet/low | the failing hooks and the anchors map; re-point `anchor`/`replaces` in `SPEC_JSON` only to lines that exist once | `FIXED` |
| `anchors (fix <r>)` | Fix | mech | as `anchors` | `ANCH2` |
| `red team` | Red team | judge | attack the spec on coexistence: UG1-UG11 with the UG4 waiver, R6, ST1/ST7/ST18, the hold, the install window, C1-C16, GS.8, the manifest rule, the off-identity of the layers row | `RED` |
| `red-team patch` | Red team | integ | apply the contradictions' fixes to `SPEC_MD`/`SPEC_JSON` (one pass) | `FIXED` |
| `reader A` / `reader B` | Cold-animator gate | deep → sonnet/high / judge → opus/high, **blind** | may read ONLY `SPEC_MD` and `SPEC_JSON`; answer every probe question (ids and questions passed in the prompt, never the expected answers) as `answer_json` (the value as JSON text) with the JSON pointer it read; write `COLD/<A|B>.json` | `READ` |
| `reader A (fix <r>)` / `reader B (fix <r>)` / `guess auditor (fix <r>)` | Fix | as the gate rows | as the gate rows | `READ` / `AUDIT` |
| `guess auditor` | Cold-animator gate | triage | `node tools/living-measure.js --resolve-pointers SPEC_JSON --answers <tmp of both readers' answers> --probes PROBES`; return the line unchanged | `AUDIT` |
| `spec fixer` | Fix | judge | the failing criteria, the probes both readers missed (question, expected, their answers), the guesses; patch `SPEC_MD`/`SPEC_JSON` so the answer is stated at the probe's `spec_pointer` | `FIXED` |
| `hold (record)` | Record | triage | `HOLD_TASK_LC` | `HOLD` |
| `record …` | Record | `recordL` (triage) | `state/2-plan.json` (checkpoints after Probes and after Sections), `gates/2-plan.json` | `RECD` |

`recordL` tags every record phase `Record` (its body is filigree's `recordD` under the two L4 substitutions, so it
takes no phase argument); the two checkpoints therefore show under Record in the phase ledger although they run
after Probes and Sections. Every other row runs in exactly the one phase it names.

### 5.2 Sections (one writer each; the integrator owns nothing a section owns)

| sid | role | owns | brief |
|---|---|---|---|
| s01 | judge | `/clock`, `/determinism` | the presentation clock (rAF timestamp argument, dt clamp 100 ms, stopped while hidden), keyed streams `KEY_IDIOM` inside `living.js` (an xmur3 → mulberry32 copy under new names), the seed literal and the snapshot day, frozen under the capture's virtual clock; zero clock tokens; never `W.rng` or the five atlas functions (LC12) |
| s02 | judge | `/still` | the one control and the one state (LC2): the row control writes `jrn.forceReduced`; journey playback, the route dash and the living layer read `jReduced()`; the still frame per class at `t0` (LC3); WCAG 2.2.2/2.3.3; ≥ 44 px on coarse pointers |
| s03 | judge | `/host`, `/loader`, `/hook_lines`, `/hash`, `/restore` | the existing pane (LC13, from the bible), Renderer.js sync (zoomanim transform, zoomend redraw, 10% pad, DPR ≤ 2), the lazy loader (`maps-site/living.js?v=`), each hook `{id, anchor, replaces, text}` marked `/*LC-HOOK*/`, the `setHash` keep of `living=1`, the restore rule, a failed fetch silent (UG2), raw growth ≤ 200 B (LC14) |
| s04 | deep | `/devices/LC-footprints`, `/devices/LC-route-draw`, `/devices/LC-select` | footprints (LC5, teleport legs a gap), the route drawing itself (< 5 s, instant when still), selection and the keyboard list (LC15) |
| s05 | deep | `/devices/LC-caravans`, `/devices/LC-ships`, `/devices/LC-traffic-weight`, `/snapshot` | the seeded atlas function, the living snapshot (`--export-traffic`, stamp, the staleness rule and its `Living data — re-cut the traffic snapshot` insert), halts (B-18), shut ways read from `notices=` (B-42), display nouns (LC6) |
| s06 | deep | `/devices/LC-water`, `/devices/LC-weather`, `/devices/LC-dark-hour` | sea shimmer on `maps-site/living/sea-mask.png` (the sea-mask item), storm tracks (Ponbar north, late summer and autumn), the dark-hour dim (LC11), fog read-only (R13, B-37); **weather ownership**: LC-weather is a seeded atlas function of (place, snapshot sim day) built on the R13 fog function; it reads no `W.weather`, no Street weather dial and no sim state, and adds none to the sim (Street owns the sim's sky: ST7, ST11, ST19); probe `P-weather-source` checks `/devices/LC-weather/source` |
| s07 | audit | `/devices/LC-birds`, `/devices/LC-whales`, `/devices/LC-lugal`, `/gated` | birds on coasts, whales only where the bible placed the Loon Sea, Lugal's still mark at party-route.json index 4 (0-based: Fell Mountains); the gated set absent (LC4, LC17) |
| s08 | judge | `/zoom` | slice Z: the crossfade from `Z_OPEN_MAX` toward `Z_STREET` inside the window (R6 threshold, instant when still), posters shot with `street=1` on by `tools/living-posters.js` driving the sim at the camera pose recorded in `docs/street/gates/views.json` for each view (never the pixels of `docs/street/gates/view/SV*.jpg`, which are street-off Street 1 fixtures), each recording the sha256 of `views.json` and of its pose entry, ≤ 150 KB; the step link built from the atlas `#simLink` href plus `#s=epeshu&goto=<place>&street=1` (never a relative `index.html`, never forwarding `living=1`), the step link grammar of "Sim ↔ atlas continuity", exhibits (the Epēshīn Forum first unless LC7 says otherwise) |
| s09 | audit | `/budgets`, `/stops` | draws per second per class and pointer, canvas ops per draw, gz bytes per lazy file, the phone delay ≤ +0.5 zoom, the stop table (hidden, off-screen, below band, layer off, card, still) |
| s10 | audit | `/strings`, `/row` | the layers row "The living chart" (only under `living=1`), every visible string in one `LC_STRINGS` literal of `living.js`, `VOCAB_LC` and the UG9 words, the README §13 list |
| s11 | judge | `/slices`, `/accept_template` | per slice `/checks[{id, cmd, expect}]` holding every `MANDATORY_CHECKS` id, commands matching `CHECK_CMDS` only; the accept template (`ACCEPT_GATES`, `WAIVE` verbatim, `strings: []`, `declared_change_keys` limited to the atlas page-byte keys the hook growth moves, `declared_first_view_growth` = the slice's cumulative hook bytes, `+0` requests) and the on-state template for `living-measure --lint-on` |
| s12 | audit | `/prerequisites` | `[{item, blocks, status: checked|open|missing, polish_title}]` for the sea mask item (L3 water units), "Traced road network" (L2 caravans on the printed road), the river trace (later), Street 4 + "Sim ↔ atlas continuity" (Z), the traffic snapshot export (L2) |

### 5.3 The spec shape (`living-spec.json`)

```text
{date, bible_sha256, rulings_used, rules:[{id, text, covers:[bible rule ids]}],
 clock, determinism, still, host:{pane, z}, loader:{path, version_param}, hash:{param, keep_hook}, restore,
 devices:{<id>:{slice, rules:[], still, budget:{draws_per_s, ops, bytes_gz}}}, snapshot:{path, export_cmd, stamp}, zoom,
 budgets, stops, strings:[{surface, text}], row, gated:[ids],
 hook_lines:[{id, anchor, replaces, text}],
 accept_template:{unit:"<id>", baseline:"<ref>", profiles:[five], clock:"virtual", gates:ACCEPT_GATES, waive:WAIVE, strings:[], declared_change_keys:[…], declared_first_view_growth:{bytes, requests:0}, checks:[], files_touched:[]},
 on_template:{views:[LVn], instants:[t0,t1], scenarios:[…], checks:[{key, op, value}]},
 slices:{L0:{checks:[{id, cmd, expect}]}, L1…, L3, Z},
 units:[{id:"L<S>.U<nn>"|"Z.U<nn>", slice, title, files:[], kind:"logic"|"data"|"tool"|"css", model?, effort?, depends_on:[], covers:[], views:[LVn], acceptance:[{kind:"accept"|"on"|"cmd", cmd?, expect?}]}],
 prerequisites:[{item, blocks, status, polish_title}], counts:{units_n, rules_n, checks_n, hooks_n}, canonical_len}
```

## 6. Control flow

```text
P0  [preflight, hold, drift] = parallel(crit)
    any slot null (crit already retried once) -> return done({reason:'agent died: <preflight|hold|drift>'}) before any dereference
    anchorsLost -> die('anchor lost: …'); drift not ok -> die('prelude drift: …')
    plan -> return done({reason:'plan', agents_bound, chain_ok, missing, held_by, sections: SECTIONS.map(s=>s.sid)})   // missing inputs and the chain reported, never thrown, in plan mode
    missing -> die('missing inputs: …')
    holdOf(hold, 'docs') non-empty -> return done({reason:'held', held_by})
    !FORCE: !(gate1.pass && gate1.mode==='full' && !gate1.forced_by) -> die('planning must not start before the living bible exists: docs/living/gates/1-research.json is not a full unforced pass')
            bible shas != gate1 artifacts -> die('planning must not start before the living bible exists: the bible changed since Living 1; re-run living-1-research')
            stamps_now.density_bible != gate1.stamps.density_bible -> die('the filigree density bible changed since Living 1; re-run living-1-research')
            cited_now != gate1.cited (any id) -> die('the cited rulings changed since Living 1 (' + ids + '); re-run living-1-research')
    gate_prev pass && RESUME && bible, rulings, probes and spec files re-hash -> return done({pass:true, reason:'already passed: …'})
P1  Probes: when PROBES exists, RESUME and its bible_sha256 and rulings_used match -> reuse; a stale PROBES in full mode -> die('gates/2-probes.json is invalid (stale: bible or rulings changed); delete it and rerun with resume:false')
    else prober (crit); code checks ≥ 30 probes, unique ids, every BAKED key present with equal expected -> else die('gates/2-probes.json is invalid (…)…')
    checkpoint LEDGER
P2  Sections: the ledger's sections whose md and json re-hash are kept; the rest in parallel, through kept() (drops logged); kept(…) < 75% -> checkpoint, return done({reason:'agent died: sections'})
    checkpoint LEDGER
P3  integrator (crit) -> spec reader (crit; lenOk); a null integrator or spec reader -> return done({reason:'agent died: <label>'})
P4  anchors -> any hook with anchor_n != 1 or replaces_n != 1 -> anchor fixer -> anchors (once)
P5  red team -> red-team patch (when contradictions) -> spec reader
P6  reader A ‖ reader B -> guess auditor -> score G2.1..G2.15 (answers JSON.parse'd from answer_json in code; an unparsable answer is wrong); a dead reader -> return done({reason:'agent died: reader A|B'})
P7  r = 1..ROUNDS while a fixable criterion fails: if (lowBudget()) { log('budget: fix round skipped'); break };
    spec fixer -> spec reader (fix r) -> anchors (fix r) -> readers (fix r) -> auditor (fix r) -> re-score;
    a dead reader -> return done({reason:'agent died: reader A|B'}); any other null -> return done({reason:'agent died: <label>'})
P8  hold (record) (coexistence); recordL LEDGER and GATE2
```

## 7. Gate G2 — the cold-animator test (code; every criterion must pass)

| id | criterion |
|---|---|
| G2.1 | each reader answers ≥ 90% of the probes correctly (`JSON.parse` of `answer_json` and `expected_json` in code, then the normalised compare driven by the probe `kind`: numbers within 1e-9, enums and pointers exact, lists as sets, text by `norm`; a value that does not parse is wrong) |
| G2.2 | zero schema-path guesses: every answer's `schema_path` resolves in `SPEC_JSON` (auditor) |
| G2.3 | every probe's `spec_pointer` resolves in the spec (no null pointer) |
| G2.4 | traceability: every bible `must` rule is covered by a spec rule; every spec rule is covered by ≥ 1 unit; every unit has ≥ 1 acceptance entry that is machine-checkable (`accept`, `on`, or `cmd` with `expect`) |
| G2.5 | the unit DAG is acyclic, ≤ 8 units per slice, every dependency in the same or an earlier slice; every unit file matches `ALLOWED_FILES` and none matches `NEVER_FILES`; `L0.U01` is the instrument extension (`tools/living-measure.js`, kind `tool`: `--gate-summary`, `--lint-on`, `--score`) and every other unit depends on it transitively |
| G2.6 | every slice in `SLICES` has `/checks` holding every `MANDATORY_CHECKS` id, each with a `cmd` matching `CHECK_CMDS` and an `expect` |
| G2.7 | hook lines: each has `id`, `anchor`, `replaces`, `text` with the `/*LC-HOOK*/` mark; `anchor_n` and `replaces_n` are 1; no filigree or street flag-1 literal in `text` or `replaces`; Σ max(0, len(text) − len(replaces)) ≤ 200 (LC14); one hook keeps `living=1` in `setHash` |
| G2.8 | `/hash/param === LIVING_PARAM` |
| G2.9 | caps within the rulings: draws per second ≤ 20 fine and ≤ 15 coarse, one-shot ≤ 30, dt clamp 100, speed ≤ 24, flips ≤ 3, dim ≤ 0.12, lazy caps ≤ LC14's |
| G2.10 | no rise or scale-pop rule; every ease ≤ 250 ms (LC10) |
| G2.11 | every device whose bible `owner_gate` is set is absent from `/units` unless `LCR.used[gate] !== 'default'` |
| G2.12 | the accept template's `gates` ⊇ `ACCEPT_GATES`, `waive` equals `WAIVE` byte for byte, and the anchors agent's `--lint-accept` of a filled sample exits 0 |
| G2.13 | voice and names: zero `VOCAB_LC`/`JARGON_LC` hits in `/strings` and the spec md outside `## Provenance`; `POST_NAMES` only under `## Provenance` |
| G2.14 | `/prerequisites` lists the sea mask item, "Traced road network", the river trace and Street 4 + "Sim ↔ atlas continuity", each with a status; every `missing` becomes a `Living data — …` insert |
| G2.15 | probes frozen before the spec (the ledger's probe checkpoint precedes every section's), stamped with the current bible sha; `blindBad(files_read, [SPEC_MD, SPEC_JSON])` empty for both readers |

## 8. Loop bounds and the agent bound

`maxRounds` ≤ 2 fix rounds; one red-team pass; one anchor-fix pass per round. `agents_bound` (crit agents twice):
preflight 3×2 = 6; prober 2; sections 12; integrator 2 + spec reader 2 = 4; anchors 1 + fixer 2 + anchors 1 = 4; red
team 2 + patch 2 + spec reader 2 = 6; gate readers 2×2 + auditor 2 = 6; fix 2 × (fixer 2 + spec reader 2 + anchors 1
+ readers 4 + auditor 2) = 22; record (hold + 2 checkpoints + 2 records)×2 = 10; total **72**; README §11 cap **80**. A
typical run is about 28.

## 9. Outputs and return

Writes only `docs/living/living-spec.{md,json}`, `spec/s01-s12.{md,json}`, `gates/2-probes.json`, `cold/{A,B}.json`,
`gates/2-plan.json`, `state/2-plan.json`.

Return (`done`): `{…, polish_inserts_above: 'Living 3 · Implementation', held_by?}`.
- pass: `polish_note` "Living 2: living spec, N units in L0-L3 + Z, readers a%/b%, round r", `changelog_line` "docs:
  living chart — the living spec (Living 2)", `polish_inserts` the `Living data — <item>` lines of `/prerequisites`
  with status `missing`, deduplicated in code against `seenIns = new Set(hold.polish.living.data_open.map(norm))` (the
  queued titles from the preflight hold) and against each other; dropped duplicates are logged.
- fail: `reason` the failing ids joined by `,`; inserts none (the box stays unchecked; the next run fixes).
- `held`, `plan`, `already passed: …`, `forced: <reason>`, `agent died: <label>` as README §1.6.

## 10. What this stage reuses (exactly)

- **Copied:** the living prelude (§0 of workflow 1).
- **Ported:** the Street 2 skeleton (frozen probes → sections → integrator → anchors → red team → paired blind
  readers → fixer), its frozen-probe rule (`resume:false` to regenerate) and its checkpointed ledger.
- **Run, never edited:** `tools/mobile-capture.js --lint-accept` (the accept template), `tools/living-measure.js`
  (`--spec-summary`, `--resolve-pointers`), `tools/living-drift.js`, `tools/street-drift.js`.
- **Cited by id:** filigree R6 R10 R12 R13 R15 R16 R18 R22 (texts stamped by Living 1), street ST1 ST3 ST4 ST7 ST18,
  UG1-UG11, density-bible classes B-18 B-37 B-41 B-42.

## 11. Stub run (U03 acceptance)

The workflow-1 §11 harness with canned relays: plan mode returns `reason:'plan'`, `agents_bound` 72 ≤ 80; a `gate1`
with `forced_by` set throws `living-2-plan: planning must not start before the living bible exists …`; a changed cited
text throws `the cited rulings changed since Living 1 (R6); re-run living-1-research`; a probes file missing `P-hash-keep`
throws `gates/2-probes.json is invalid (…)`; a probe whose `expected_json` does not parse throws the same; a null `hold` slot
returns `agent died: hold`; a stub `budget` with `remaining()` below `ROUND_TOKENS` runs no fix round and logs `budget:
fix round skipped`; a dead reader B in round 1 returns `agent died: reader B`; a `/prerequisites` item already in
`data_open` is not inserted twice; a full stub run whose spec summary satisfies every criterion returns
`pass:true` with 15 criteria; the same with a hook of 230 raw bytes fails exactly G2.7.
