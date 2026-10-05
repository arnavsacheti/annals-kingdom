# Workflow 4 · `living-4-review.js` — Living 4 · Review → punch list (flat-chart gate)

> Planning snapshot, 2026-10-05. Where the committed script and this document disagree, the script wins. The prelude
> is **the living prelude** of `workflow-1-research.md` §0, byte for byte. Docs-only: writes only under
> `docs/living/` (its captures with `--out`/`--shots-dir` there, never `docs/mobile/`). Staged at
> `docs/living/design/workflows/living-4-review.js` until Living 0. Scope `zoom` (POLISH "Living 4z") reviews slice Z.

## 1. meta (exact literal)

```js
export const meta = {
  name: 'living-4-review',
  description: 'Living 4: review the finished living chart against the bible and the spec through single-lens finders; gate = flat-chart test + no surviving blocker/major',
  whenToUse: 'Run as the POLISH item "Living 4 · Review → punch list" after docs/living/gates/3-build.json passed: Workflow({name:"living-4-review", args:{date:"YYYY-MM-DD"}}); "Living 4z" passes scope:"zoom". Docs-only; its punch items go directly above the Living 4 (or Living 4z) entry.',
  phases: [
    {title: 'Preflight', detail: 'drift, the hold, the Living 3 chain (final gate, spec unchanged), cycle, open punch items'},
    {title: 'Capture', detail: 'a fresh five-profile off capture + living frames on every view; cited stills'},
    {title: 'Find', detail: 'eleven single-lens blind finders in parallel'},
    {title: 'Verify', detail: 'per finding: reproduce -> refute -> severity; survives on 2 of 3'},
    {title: 'Panel', detail: 'three blind judges per panel view, fixed A/B order; omissions confirmed by class counts'},
    {title: 'Punch', detail: 'opus/xhigh integrator -> punch-list-c<k>.md/.json and the POLISH inserts'},
    {title: 'Record', detail: 'gates/4-review-c<k>.json, state/4-review.json'}
  ]
}
const JOB = 'living-4-review'
```

## 2. Args

Shared + `force` (reason; the chain is skipped, never a pass). First body line:
`checkArgs(['livingRulings', 'port', 'scope', 'preview', 'cycle', 'cdnDir'])`.

| arg | default | rule |
|---|---|---|
| `scope` | `'motion'` | `motion` (slices L0-L3, chain `gates/3-build.json`) or `zoom` (slice Z, chain `gates/3-build-Z.json`); anything else throws `args.scope must be motion|zoom` |
| `preview` | false | boolean (else `args.preview must be a boolean`); findings only under `docs/living/preview/`, the chain wait is skipped, never a polish result (`pass:false`, `reason:'preview'`) |
| `cycle` | derived (1 + the highest existing `gates/4-review[-z]-c<k>.json`) | a positive integer (else `args.cycle must be a positive integer`); 1 or 2; a third throws `a third review cycle is refused (R16 cited): the owner decides`; an existing gate file is never overwritten: `gates/4-review-c<k>.json already exists: refusing to overwrite an earlier cycle's record` |
| `cdnDir` | — | an absolute path matching `PATH_OK` (else `args.cdnDir must be an absolute path …`), passed to the tools as `--cdn-dir` |
| `port`, `livingRulings` | | config |

Every rule above is a `die()` line in §3, directly after `checkArgs` (stub-run cases in §11).

## 3. Constants

```js
checkArgs(['livingRulings', 'port', 'scope', 'preview', 'cycle', 'cdnDir'])
const SCOPE = A.scope ?? 'motion'
if (!['motion', 'zoom'].includes(SCOPE)) die('args.scope must be motion|zoom')
if (A.preview != null && typeof A.preview !== 'boolean') die('args.preview must be a boolean')
if (A.cycle != null && !(Number.isInteger(A.cycle) && A.cycle >= 1)) die('args.cycle must be a positive integer (1 or 2; a third is refused)')
if (A.cdnDir != null && (typeof A.cdnDir !== 'string' || !PATH_OK.test(A.cdnDir) || !A.cdnDir.startsWith('/'))) die('args.cdnDir must be an absolute path of letters, digits and _ / . + - only')
const PREVIEW = A.preview === true
const CDN = A.cdnDir || null   // null: each relay packs its own temp dir per SANDBOX_LC
const ROUND_TOKENS = 400000   // one verify batch (10 findings × 3 voters); lowBudget() of the config reads it
const VERIFY_BATCH = 10
const TAG = SCOPE === 'zoom' ? '4-review-z' : '4-review'
const IN = MODE === 'smoke' ? DOCS : OUTABS   // chain inputs (gate, spec, bible, views, reference); a smoke run reads the durable docs/living read-only, writes only under its outDir, and dies missing inputs before Living 3 has passed
const CHAIN = IN + (SCOPE === 'zoom' ? '/gates/3-build-Z.json' : '/gates/3-build.json')
const PANEL_VIEWS = SCOPE === 'zoom' ? ['LV5', 'LV6'] : ['LV2', 'LV3', 'LV5', 'LV8']
const AB = {LV2: 'living-first', LV3: 'flat-first', LV5: 'living-first', LV6: 'flat-first', LV8: 'flat-first'}   // fixed A/B order per view
const JUDGES = [{id: 'J0', role: 'judge'}, {id: 'J1', role: 'deep'}, {id: 'J2', role: 'judge'}]   // opus/high, sonnet/high, opus/high
const MAX_VERIFY = 30
const SEV_RUBRIC = 'blocker: a determinism or clock-token break, desktop identity with living absent, a write to another track\'s file or gate, an invented creature or behaviour shown by default; major: a gate criterion or budget missed, a missing still-chart path, a delay-not-drop break, an owner ask silently dropped; minor: a visible defect within the spec; nit: taste'
const LENSES = [ /* §5.2 */ ]
const ASKS_HOME = ASKS   // footprints, traffic, creatures, water, exhibits, zoom_detail (config)
```

## 4. Schemas

```js
const S = {type: 'string'}, B = {type: 'boolean'}, I = {type: 'integer'}, SA = {type: 'array', items: S}, OBJ = {type: 'object'}
const LINE = {type: 'object', additionalProperties: true, properties: {ok: B, len: I, sum: S}, required: ['ok', 'len', 'sum']}
const DRIFT = {type: 'object', properties: {living: OBJ, street: OBJ}, required: ['living', 'street']}   // the same line as workflows 1-3
const PRE4 = {type: 'object', properties: {missing: SA, chain: {type: 'object', properties: {gate: OBJ, spec_sha_now: S, spec_sha_gate: S, cited_ok: B}, required: ['gate', 'spec_sha_now', 'spec_sha_gate', 'cited_ok']}, cycles: {type: 'array', items: I}, open_punch: SA, polish_titles: SA}, required: ['missing', 'chain', 'cycles', 'open_punch', 'polish_titles']}
const CAP4 = {type: 'object', properties: {off: {type: 'object', properties: {capture_exit: I, accept_exit: I, failing: {type: 'array', items: OBJ}}, required: ['capture_exit', 'accept_exit', 'failing']}, summary: LINE, counts: {type: 'object', additionalProperties: OBJ}, cited: SA, infra_error: S}, required: ['off', 'summary', 'counts', 'cited', 'infra_error']}   // counts: {LVn: {profile: {living: {class: n}, flat: {class: n}, still: {class: n}}}}
const FINDING = {type: 'object', properties: {id: S, severity_claim: {type: 'string', enum: ['blocker', 'major', 'minor', 'nit']}, title: S, evidence: {type: 'object', properties: {cmd: S, key: S, shot: S}, required: []}, where: S, repro: S}, required: ['id', 'severity_claim', 'title', 'evidence', 'where', 'repro']}
const FIND = {type: 'object', properties: {lens: S, findings: {type: 'array', items: FINDING}, asks: OBJ}, required: ['lens', 'findings']}   // asks only from L11: {<ask>: {status: delivered|deferred|ruled-out, device?, polish_title?, lc?}}
const REPRO = {type: 'object', properties: {id: S, reproduced: B, observed: S}, required: ['id', 'reproduced', 'observed']}
const REFUTE = {type: 'object', properties: {id: S, refuted: B, why: S}, required: ['id', 'refuted', 'why']}
const SEV = {type: 'object', properties: {id: S, severity: {type: 'string', enum: ['blocker', 'major', 'minor', 'nit']}, why: S}, required: ['id', 'severity', 'why']}
const JUDGE = {type: 'object', properties: {view: S, prefer: {type: 'string', enum: ['A', 'B']}, omissions: {type: 'array', items: {type: 'object', properties: {class: S, where: S}, required: ['class', 'where']}}, files_read: SA}, required: ['view', 'prefer', 'omissions', 'files_read']}
const PUNCH = {type: 'object', properties: {md: OBJ, json: OBJ, items: {type: 'array', items: {type: 'object', properties: {id: S, severity: S, title: S, fix: S, files: SA, done_when: S, rerun: S}, required: ['id', 'severity', 'title', 'fix', 'files', 'done_when', 'rerun']}}, hold: LINE}, required: ['md', 'json', 'items', 'hold']}   // hold: the Record-time --hold re-read (P5's last step)
```

## 5. Agents

### 5.1 Pipeline agents

| label | phase | role → model/effort | prompt essentials | schema |
|---|---|---|---|---|
| `preflight` | Preflight | triage → sonnet/low | inputs exist (`CHAIN`, spec, bible, views, `L0` or the latest reference named in `state/3-build/atlas-ref.json`); `CHAIN` parsed, the spec sha it stamps vs sha256 of `living-spec.json`; Living 1 cited texts unchanged (`cited_ok`); the integer k of every `gates/<TAG>-c<k>.json`; open POLISH lines `- [ ] **Living 4 punch c<k>` (or `Living 4z punch c<k>`); every POLISH item title (`- [ ] **…**` and `- [x] **…**`, for G4.8) | `PRE4` |
| `hold` | Preflight | triage | `HOLD_TASK_LC` | `LINE` |
| `drift` | Preflight | triage | `DRIFT_TASK_LC` | `DRIFT` (§4) |
| `capture` | Capture | triage | `SANDBOX_LC`; (a) `node tools/mobile-capture.js --atlas --profiles <five> --unit LC-review-c<k> --out ${OUTABS}/review-c<k>/capture.json --shots-dir ${OUTABS}/review-c<k>/shots/off` and `--accept docs/living/accept/slice-<last>.json --capture … --ref <ref>=…`; (b) `node tools/living-measure.js --frames --views VIEWS_JSON --profiles desktop,iphone13 --living 0,1 --t 0,4000,<tDark> --scenarios moving,still,reduce,hidden,card,layer-off,below-band,offscreen,zoom-anim,block-chunk,coexist --runs 2 --out ${OUTABS}/review-c<k>/metrics.json --shots-dir ${OUTABS}/review-c<k>/shots/on`, then `--gate-summary` for every slice of the scope (lines unchanged); (c) per panel view and profile the living t0/t1 stills, a 6-frame strip (t = 0, 800, …, 4000) and the flat still copied ≤ 300 KB into `${OUTABS}/review-c<k>/cited/`; (d) class counts per view, profile and state (living t0, flat, still) from `metrics.json` | `CAP4` |
| `L01`…`L11` | Find | per §5.2, **blind** to one another | the lens question, `review-c<k>/` (metrics, capture, cited), the spec, the bible, the code under review (`maps-site/living.js`, `maps-site/living/**`, the hook lines), the rulings; every finding carries a command, metric key or cited shot that reproduces it; L11 also returns `asks` | `FIND` |
| `repro <fid>` | Verify | audit → sonnet/medium | run the finding's `repro` exactly; observed vs claimed | `REPRO` |
| `refute <fid>` | Verify | judge → opus/high | try to show the finding wrong from the spec, rulings and evidence | `REFUTE` |
| `severity <fid>` | Verify | triage → sonnet/low | `SEV_RUBRIC`; one severity | `SEV` |
| `judge <J> <LVn>` | Panel | `JUDGES[j].role`, **blind** (`NOGIT_RULE`) | may read ONLY the cited files of that view: A and B (by `AB`: the living pair = t0/t1 stills + strip; the flat still) on desktop and phone; which would you rather have at the table, and ≥ 3 things the other one lacks (class and where) | `JUDGE` |
| `punch` | Punch | integ → opus/xhigh | the surviving findings with severities, the panel, the asks; write `punch-list-c<k>.{md,json}` (sections "Why the flat chart is worse", "Where we flinched", the minor-items line) and copy them to `punch-list.{md,json}`; one item per surviving blocker or major: a plain POLISH item obeying Living 3's hold, editing only Living 3's files; a spec defect becomes "re-run living-2-plan: …", a fixture defect "re-run living-1-research: …"; last, after every file is written, the Record-time coexistence read: `node tools/living-drift.js --hold`, its line relayed unchanged as `hold` (it rides this agent so `agents_bound` stays 127, §8) | `PUNCH` |
| `record …` | Record | `recordL` | `gates/<TAG>-c<k>.json` (never over an existing one; not written when coexistence broke), `state/4-review.json` | `RECD` |

### 5.2 Lenses (one question each; blind finders)

| id | role | the one lens |
|---|---|---|
| L01 | deep | determinism and the clock: any position not a pure function of (seed, class, id, day, presentation time)? a clock token, `W.rng`, a stream outside the `lc:` key? glyphs that differ between runs or profiles? |
| L02 | audit | the still chart and WCAG 2.2.2 / 2.3.3: one control, one state; anything that moves past 5 s with the control on or under reduced motion; information lost when still (LC3) |
| L03 | audit | desktop identity and bytes with `living` absent: any pixel, node, listener, request or byte beyond the declared hook lines; the hook bytes vs LC14; the manifest |
| L04 | audit | phone parity and battery: delay not drop on iphone13; rAF while hidden, off-screen, below band, covered or still; draws per second vs LC8 |
| L05 | judge | canon: every moving thing canon-backed or ruled; invented creatures and behaviours absent by default (LC4); Lugal still at the Fell Mountains stop; the dark hour one global dim (LC11); cards that assert canon the extract lacks |
| L06 | audit | voice: `VOCAB_LC`, the UG9 words, the sim's ship kind leaking, display nouns, the README §13 list |
| L07 | deep | route truth: footprints on JPATH in session order, teleport legs as gaps, caravans on the named ways (and the printed road once traced), ships on the lanes, top-origin coordinates |
| L08 | audit | coexistence with the table map: names over motion, the pane order, R6 (no fade from nothing), `notices=` read only, `filigree=1` with `living=1`; for `zoom` the step link, the poster provenance and the street files untouched |
| L09 | judge | ambient craft (LC9): glyph boxes against label boxes from the capture, speed, contrast, flashes; what pulls the eye off the names |
| L10 | judge | where the build flinched: devices the bible says build that are stubbed, dropped, silently gated or reduced below the spec |
| L11 | judge | owner-input fidelity: the six asks (footprints, traffic, creatures, water, exhibits, the zoom-in detail layer): each delivered (a device present in the class counts), deferred to a POLISH title that exists, or ruled out by an LC id; returns `asks` |

## 6. Control flow

```text
P0  [preflight, hold, drift] = parallel(crit)
    any slot null (crit already retried once) -> return done({reason:'agent died: <preflight|hold|drift>'}) before any dereference
    drift not ok -> die('prelude drift: …')
    plan -> return done({reason:'plan', agents_bound, cycle, chain_ok, missing, held_by, blocked_by})   // missing inputs and the chain reported, never thrown, in plan mode
    missing -> die('missing inputs: …')
    holdOf(hold, 'docs') non-empty -> return done({reason:'held', held_by})
    k = A.cycle ?? 1 + max(cycles); k > 2 -> die('a third review cycle is refused (R16 cited): the owner decides'); cycles includes k -> die('gates/<TAG>-c<k>.json already exists: refusing to overwrite an earlier cycle\'s record')
    full, !FORCE, !preview: chain gate not a full unforced pass, or spec sha moved, or !cited_ok -> die('review must wait for the finished living chart: …') / die('the cited rulings changed since Living 1 (…); re-run living-1-research')
    k === 2 and open_punch has a c1 line -> return done({reason:'blocked', blocked_by: open_punch})
P1  capture (crit; null -> return done({reason:'agent died: capture'}); infra_error, including "capture busy" from RO_RULE_LC's 20-minute bound -> return done({reason:'infra'}))
P2  Find: L01..L11 in parallel; a lens that died (null slot, logged) -> G4.7 false (no retry in round 0); .filter(Boolean) before the findings are pooled
P3  Verify: findings ranked by claimed severity, the first MAX_VERIFY, in batches of VERIFY_BATCH (no pipeline(); one
    parallel per batch, results passed through .filter(Boolean) with log() of the drop count); before every batch after
    the first: if (lowBudget()) { log('budget: verify batch skipped'); break }
    per finding repro ‖ refute ‖ severity; survives when reproduced and not refuted and rated (2 of 3 votes); a null
    voter counts against survival (null repro = not reproduced, null refute = refuted, null severity = unrated); the
    rest listed as unverified minors, except that an unverified finding claiming blocker or major (cut by MAX_VERIFY or
    by the budget) makes G4.6 false: the gate never passes on unverified severe claims
P4  Panel: for each view in PANEL_VIEWS, J0 ‖ J1 ‖ J2 (blind; a null judge counts against, G4.1); omissions confirmed in code against capture.counts (present in living t0, absent in flat)
P5  Punch (crit; null -> return done({reason:'agent died: punch'})): items for every surviving blocker or major; titles deduplicated in code against seenIns = new Set(open_punch.map(norm)) and each other
P6  Record: coexistence (README §5.4) in code: punchR.hold passes lenOk and its shas equal the preflight hold's on index, atlas,
    manifest, maps_other, docs_filigree, docs_street, docs_mobile, street_state3, workflows and tools_other (Living 4 writes
    none of them) -> else gaps 'coexistence broken: <key> moved during the run' (or 'the Record hold read mis-relayed'),
    gate pass false, no gates/<TAG>-c<k>.json written (the re-run keeps cycle k), no polish_inserts, no changelog_line,
    reason 'coexistence broken: …' (after preview, smoke and record-mismatch; before forced and the G4 ids);
    recordL gates/<TAG>-c<k>.json (unless coexistence broke) and state/4-review.json (preview: under docs/living/preview/ only)
```

## 7. Gate G4 — the flat-chart test (code; every criterion must pass)

| id | criterion |
|---|---|
| G4.1 | on every panel view at least 2 of 3 judges prefer the living side (A or B mapped through `AB`); a dead judge counts against |
| G4.2 | each preferring judge lists ≥ 3 omissions that `capture.counts` confirm (the class has glyphs in living t0 and none in flat) |
| G4.3 | the still frame keeps every class: for every view and profile the `still` class counts equal the living t0 counts (LC3) |
| G4.4 | the still-chart test re-measured: the off accept exit 0 with `failing` empty, and every slice's `--gate-summary` passes GL.3-GL.13 in code (the workflow 3 §8 rules) |
| G4.5 | zero `VOCAB_LC`/`JARGON_LC` hits in the living strings (from the summary) |
| G4.6 | zero surviving blocker or major, and no unverified finding (MAX_VERIFY cut or budget skip) that claims blocker or major |
| G4.7 | no lens died in round 0 |
| G4.8 | L11's `asks` covers all six: `delivered` names a device with glyphs in the counts, `deferred` names a POLISH title found verbatim in `polish_titles`, `ruled-out` names an LC id |

## 8. Loop bounds and the agent bound

One finder round per cycle (no loop-until-dry); ≤ 30 findings verified, in batches of 10, each batch after the first gated by `lowBudget()` (`ROUND_TOKENS` 400000); ≤ 2 cycles per scope. `agents_bound` (crit
twice): preflight 3×2 = 6; capture 2; finders 11; verify 30×3 = 90; panel 3×4 = 12 (zoom: 3×2 = 6); punch 2 (its last step is the Record-time `--hold` re-read); record 2×2
= 4; total **127** (zoom 121); README §11 cap **150**. A typical run is about 60.

## 9. Outputs and return

Writes `docs/living/review-c<k>/` (capture, metrics, cited stills tracked; `shots/` git-ignored), `findings/c<k>-L<nn>.json`
and `findings/c<k>-verified.json`, `punch-list-c<k>.{md,json}` and its copy `punch-list.{md,json}`,
`gates/<TAG>-c<k>.json`, `state/4-review.json` (zoom: `review-z-c<k>/`, `punch-list-z-c<k>.*`).

Return (`done`): `{…, scope, cycle, polish_inserts_above: SCOPE === 'zoom' ? 'Living 4z · Review the zoom-through' :
'Living 4 · Review → punch list', held_by?, blocked_by?}`.
- pass: `polish_note` "Living 4 c<k>: the flat chart loses on n/m views, 0 blocker/major, asks 6/6", `changelog_line`
  "docs: living chart — review cycle <k> (Living 4)"; the owner may then flip LC1 after the device pass.
- fail: `polish_inserts` one `Living 4 punch c<k> <id> — <title>` per surviving blocker or major (`Living 4z punch …`
  for zoom), placed directly above the entry, plus one line citing `docs/living/punch-list-c<k>.md` for the minors;
  `reason` the failing G4 ids joined by `, `.
- `held`, `blocked`, `plan`, `preview`, `infra`, `agent died: <label>`, `forced: <reason>` as README §1.6.

## 10. What this stage reuses (exactly)

- **Copied:** the living prelude.
- **Ported:** the Street 4 / Filigree 4 skeleton (capture → single-lens blind finders → reproduce, refute, severity
  on 2 of 3 → blind panel with fixed A/B order → punch list; cycles ≤ 2; never overwrite a cycle's gate).
- **Run, never edited:** `tools/mobile-capture.js` (`--out`/`--shots-dir` under `docs/living/review-c<k>/`,
  `--accept … --capture`), `tools/living-measure.js` (frames, `--gate-summary`), `tools/living-drift.js`.
- **Cited:** R6, R12, R13, R16 (cycles), ST1, ST18, UG1-UG11; `docs/mobile/voice-rubric.md` (read-only) for L06.

## 11. Stub run (U05 acceptance)

The workflow-1 §11 harness: plan mode returns `reason:'plan'` with `agents_bound` 127 ≤ 150 (zoom 121); `cycle:3`
throws `a third review cycle is refused …`; an existing c1 gate with `cycle:1` throws the overwrite refusal; cycle 2
with an open `Living 4 punch c1` line returns `blocked`; `preview:true` returns `reason:'preview'`, `pass:false` and
records only under `docs/living/preview/`; a full stub with canned passing relays returns `pass:true` with 8 criteria;
the same with one judge dead on LV2 and another preferring flat fails exactly G4.1; `scope:'zomm'` throws `args.scope must
be motion|zoom`, `preview:'yes'` throws `args.preview must be a boolean`, `cycle:0` throws the cycle rule, a relative
`cdnDir` throws the cdnDir rule; a null `drift` slot returns `agent died: drift`; a stub `budget` whose `remaining()` is
below `ROUND_TOKENS` after the first batch verifies 10 findings, logs `budget: verify batch skipped`, and fails G4.6 when
a skipped finding claims major.
