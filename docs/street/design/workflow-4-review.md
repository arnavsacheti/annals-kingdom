# Workflow 4 · `street-4-review.js` — Street 4 · Review → punch list

> Planning snapshot, 2026-10-04 (final integrated plan). Where the committed script and this document disagree, the
> script wins. The prelude is the **street prelude v1** of `workflow-1-research.md` §0, byte for byte.
> Docs-only: it writes `docs/street/**` and nothing else. Its punch items edit the sim later, as ordinary polish items
> that obey the street hold.

## 1. meta (exact literal)

```js
export const meta = {
  name: 'street-4-review',
  description: 'Street 4: review the finished street view against the bible and the spec through single-lens finders; gate = bare-street test + no surviving blocker/major',
  whenToUse: 'Run as the POLISH item "Street 4 · Review → punch list" after docs/street/gates/3-build.json passed: Workflow({name:"street-4-review", args:{date:"YYYY-MM-DD"}}). Docs-only; its punch items go directly above the Street 4 entry.',
  phases: [
    {title: 'Preflight', detail: 'drift, anchors, chain (Street 3 final gate), cycle, prior punch ids, frozen views and caps'},
    {title: 'Capture', detail: 'one probe run (all views on/off, paths, phone, fingerprints, shots) + digest-checked metrics reader'},
    {title: 'Find', detail: 'eleven single-lens finders, <=2 findings each in round 0, <=1 later'},
    {title: 'Verify', detail: 'dedup -> reproduce -> refute -> severity per fresh finding; <=2 extra rounds'},
    {title: 'Bare-street gate', detail: '3 blind judges x 4 views (opus/sonnet/opus, fixed A/B order); omissions confirmed in code from probe class counts'},
    {title: 'Punch list', detail: 'opus/xhigh integrator -> punch-list.md/.json and the inserts'},
    {title: 'Record', detail: 'findings, gates/4-review-c<k>.json, state/4-review.json; cited shots only'}
  ]
}
```

## 2. Args

Shared + `force`. Job keys: `streetRulings`, `port`, `preview` (boolean; findings only, written under
`docs/street/preview/`, `pass` forced false, never a polish result), `cycle` (1..2; default 1 + the count of non-preview
`gates/4-review-c*.json`; a third cycle is refused, ST13; an explicit cycle whose gate exists is refused unless
`force`). First body line: `checkArgs(['streetRulings', 'port', 'preview', 'cycle'])`.

## 3. Constants

```js
const JUDGE_VIEWS = ['SV1', 'SV2', 'SV4', 'SV7']
const JUDGES = [{id: 'J0', role: 'judge'}, {id: 'J1', role: 'deep'}, {id: 'J2', role: 'judge'}]   // opus/high, sonnet/high, opus/high
const layeredIsA = (vi, j) => (vi % 2 === 0) !== (j === 'J0')   // J0 sees the opposite order to J1 and J2; parity by view index
const PHONE = ['SV1', 'SV2']   // 390x844
const FIND_CAP0 = 2, FIND_CAP = 1, EXTRA_ROUNDS = 2, VERIFY_BOUND = 200, ROUND_TOKENS = 1500000   // ROUND_TOKENS: one extra round's budget floor
// PREVIEW, RV and RVREL are defined in §6 straight after checkArgs (they need A.preview, validated there); a stage that uses them runs after that point
const LENSES = [
  {id: 'L01', role: 'deep', check: 'Determinism', lens: 'fingerprints (never/off/on/walk), STREET-block greps, every keyed-hash key equals the spec form, no W field written'},
  {id: 'L02', role: 'audit', check: 'Performance and caps', lens: 'caps per view, quads and tris built per frame, resident tris, the shadow pass with instanced casters, far quiet at SV5/SV9'},
  {id: 'L03', role: 'audit', check: 'Pop and fade (R6)', lens: 'appear samples on the descent, hysteresis swaps on the sweep, oscillate builds'},
  {id: 'L04', role: 'judge', check: 'Caravan sense', lens: 'queues at fords, one-lane bridges and toll halts read as bronze-age traffic; no overlap; render-only; gate leaves shut only in the drawn dark hour (ST5)'},
  {id: 'L05', role: 'audit', check: 'Canon and voice', lens: 'VOCAB_ST over new strings, R10 and ST16 words, the Patrinaic words (q12) used correctly, "cog" not spread, the nine Kembar, years A.B.'},
  {id: 'L06', role: 'deep', check: 'The Marble City', lens: 'does SV1/SV6/SV8 read as Epēshu: marble-pale stone tier (ST12), the Blue Temple of Thobrauk on Wood Quay, no invented district layout'},
  {id: 'L07', role: 'audit', check: 'Weather and sky', lens: 'cloud deck keyed to W.weather and the day, the R13 fog copy (or its recorded gap), the weather dial exact, no fog sim state'},
  {id: 'L08', role: 'audit', check: 'Layers and hash', lens: 'rows default off, street=1 composes with s= and goto=, the ST18 hash table, the shadows row at degrade 3, no new keys'},
  {id: 'L09', role: 'audit', check: 'Phone', lens: '390x844 at SV1/SV2: rows reachable, touch targets >= 44 px, no horizontal scroll, caps met, reduced motion honoured'},
  {id: 'L10', role: 'judge', check: 'Where the build flinched', lens: 'tiers that stop early, SV7 (procedural) missing near detail, a bible class absent at its view, a spec rule with no visible effect'},
  {id: 'L11', role: 'judge', check: 'Owner-input fidelity', lens: 'the owner\'s toggles exist and work (clouds, shadows, roads and folk), the weather density dial, session overlays (the herald\'s tidings from fixtures/tidings.json), "detail emerges naturally" (far views quiet, detail arrives on the descent), and the VTT export and party presence stated out of scope (ST10) in the bible and README §9 rather than silently dropped'}
]
const SEV = ['blocker', 'major', 'minor', 'nit']
```

## 4. Schemas

```js
// S, SA, B, I, N, NN, OBJ, ANCH, DRIFT, FILANCH exactly as in workflow-1 §3.3, plus that section's 'job helpers' block (driftIds, citedChanged, lowBudget) pasted verbatim; DIGEST as in workflow-3 §5 (plus phone)
const PRE4 = OBJ({missing: SA, anchors: ANCH, fil_anchors: FILANCH, drift: DRIFT,
  gate3: OBJ({exists: B, pass: B, mode: S, forced: B, spec_ok: B, tree_digest: S}),
  gate1: OBJ({fil_rulings_cited: {type: 'object', additionalProperties: S}}),
  fil_overrides: {type: 'object', additionalProperties: S}, st_overrides: {type: 'object', additionalProperties: S},
  cycles: {type: 'array', items: I}, prior: OBJ({k: I, ids: SA, lenses: {type: 'object', additionalProperties: S}}),
  class_labels: SA, caps: {type: 'object', additionalProperties: {type: 'object', additionalProperties: NN}},
  device: {type: 'array', items: OBJ({path: S, fps_min: N, degrade_max: I})}, tree_digest: S})
const CAPT = OBJ({metrics_path: S, metrics_sha256: S, shots_dir: S, infra_error: S})
const FIND = OBJ({lens: S, findings: {type: 'array', items: OBJ({id: S, title: S, where: S,
  evidence: OBJ({kind: {type: 'string', enum: ['shot', 'cmd', 'metric']}, ref: S}), repro_cmd: S, fix: S, unit_hint: S})}})
const DEDUP = OBJ({fresh: SA, dupes: {type: 'array', items: OBJ({id: S, of: S})}})
const REPRO = OBJ({id: S, reproduced: B, out: S})
const REFUTE = OBJ({id: S, refuted: B, why: S})
const SEVR = OBJ({id: S, severity: {type: 'string', enum: SEV}, why: S})
const PANEL = OBJ({prefer: {type: 'string', enum: ['A', 'B']}, omissions: {type: 'array', items: OBJ({class: S, where: S})}, files_read: SA})
const VGREP = OBJ({hits: SA})
const COEX = OBJ({fil_anchors: FILANCH, tree_digest: S, restore_undeclared: SA})
const PUNCH = OBJ({md: S, json: S, sha_md: S, sha_json: S, items: {type: 'array', items: OBJ({id: S, severity: S, title: S, fix: S, unit_hint: S, done_when: S})}})
```

## 5. Agents

| label | phase | role → pair | prompt essentials (`PS(...)`) | schema |
|---|---|---|---|---|
| `preflight` (crit) | Preflight | mech → haiku/low | `ANCHOR_TASK`, `FIL_ANCHOR_TASK`, `DRIFT_TASK`; `gate3` from `gates/3-build.json` (+ its recorded tree digest); `gate1` stamps; rulings overrides; existing non-preview cycles; the prior cycle's punch ids and lenses; `class_labels` = `street-bible.json` `classes[].id`; `caps` = spec `/caps`; `device` files under `docs/street/device/`; `tree_digest` now | PRE4 |
| `capture` (crit) | Capture | audit → sonnet/medium | `node tools/street-probe.js` with the full S4 capture flags + `--phone SV1,SV2` + `--fingerprint` (both seeds: never/off/on/walk) `--out ${RV}/review-c<k>/metrics.json --shots ${RV}/review-c<k>/shots/`; returns paths + sha only | CAPT |
| `metrics reader` (one retry) | Capture | mech → haiku/low | the fixed digest script (workflow-3 DIGEST + phone + fingerprints); sha must equal the capture's | DIGEST |
| `<Lnn> · <check>[ rN]` | Find | per LENSES | ONE lens; reads: the digest, the shots, the bible, the spec, index.html (STREET block), the rulings it names; ≤ FIND_CAP0 findings in round 0, ≤ FIND_CAP later; each with reproducible evidence (`shot#x,y,w,h` \| `cmd` \| `metric:<pointer>`), a `repro_cmd` that exits 0 when the defect is present, a fix and a unit hint; write `${RV}/findings/<Lnn>-c<k>-r<n>.json` | FIND |
| `dedup` (optional) | Verify | mech → haiku/low | fuzzy second pass over the findings the code-side `seen` Set already passed (normalized title + where against seen ids, this run + prior cycle); its result can only remove more, never re-admit a finding the Set dropped | DEDUP |
| `<id> · reproduce` | Verify | audit → sonnet/medium | run `repro_cmd` from a mktemp copy when it writes; reproduced = exit 0 and output matches the evidence | REPRO |
| `<id> · refute` | Verify | judge → opus/high | refute with evidence or keep | REFUTE |
| `<id> · severity` | Verify | triage → sonnet/low | blocker (breaks determinism, coexistence or the off identity) · major (a gate criterion or a cap) · minor · nit | SEVR |
| `<SVn> · <Jk>` | Bare-street gate | J0 judge → opus/high, J1 deep → sonnet/high, J2 judge → opus/high | blind (`PS(…, true)`): see ONLY the two stills (A/B per `layeredIsA`); which shows the richer, more legible street at table distance; list the things present in one and absent in the other using ONLY these class names (the full bible list, present or not): `class_labels`; `files_read` | PANEL |
| `voice grep` | Bare-street gate | mech → haiku/low | `VOCAB_ST` over every string literal inside the STREET block | VGREP |
| `coexistence` | Bare-street gate | mech → haiku/low | `FIL_ANCHOR_TASK` (literals + in_street counts), workflow-3 `RESTORE_TASK` undeclared lines; the tree digest is recorded for information only | COEX |
| `punch integrator` (crit) | Punch list | integ → opus/xhigh | write `${RV}/punch-list.md` ("Why the bare street is worse", "Where we flinched", "Device gate (ST8)") and `.json`; one item per surviving blocker/major, one grouped item for minor/nit; `done_when` = the finding's `repro_cmd` no longer exits 0 | PUNCH |
| `shot pruner` | Record | mech → haiku/low | copy the shots the punch list cites to `${RV}/review-c<k>/cited/` (≤300 KB each); `shots/` stays git-ignored | PRUNE |
| `record findings` / `record gate` / `record state` (crit) | Record | mech → haiku/low | `recordD` / `record` | RECD / REC |

## 6. Control flow

```js
checkArgs(['streetRulings', 'port', 'preview', 'cycle'])
if (A.preview !== undefined && typeof A.preview !== 'boolean') die('preview must be a boolean')
const PREVIEW = A.preview === true
if (A.cycle !== undefined && !(Number.isInteger(A.cycle) && A.cycle >= 1 && A.cycle <= 2)) die('cycle must be an integer in 1..2; a third review cycle is refused (ST13): the owner decides')
const RV = PREVIEW ? OUTABS + '/preview' : OUTABS
const RVREL = PREVIEW ? OUT + '/preview' : OUT
phase('Preflight')
const pre = await crit(PS(PREFLIGHT4), {label: 'preflight', phase: 'Preflight', schema: PRE4, ...M('mech')})
if (!pre) return done({reason: 'agent died: preflight'})
if (!PREVIEW && !(pre.gate3 && pre.gate3.exists && pre.gate3.pass && pre.gate3.mode === 'full' && !pre.gate3.forced && pre.gate3.spec_ok)) die('review must wait for the finished street view (docs/street/gates/3-build.json pass)')
if (!pre.drift || pre.drift.ok !== true) die('prelude drift: …')
if ((pre.missing || []).length) die('missing inputs: …')
if (anchorsLost(pre.anchors).length) die('anchor lost: …')
// CYCLE = A.cycle ?? 1 + pre.cycles.length (explicit values already validated above); the derived default only: CYCLE > 2 -> die('a third review cycle is refused (ST13): the owner decides')
// the explicit-cycle check runs before the preflight agent, so stub run 3 (cycle:3) throws the cycle bound first
// plan -> done({reason: 'plan', schedule, agents_min, agents_max, bound: 200, over_bound, cycle})
phase('Capture')      // capture (crit) -> metrics reader (sha check, one retry; else 'agent died: metrics reader'); infra -> done('infra')
phase('Find')         // round 0: parallel(all LENSES)
phase('Verify')       // dedup in code: const seen = new Set(priorIds.map(norm) + this run's norm(title + ' ' + where)); fresh = findings whose key is not in seen (add as they pass)
//                       the haiku `dedup` agent is an optional fuzzy second pass over the code-fresh list only, never the gate
//                       pipeline stages are (prev, item, index): reproduce = (_p, f) => ..., refute = (r, f) => ..., severity = (rf, f) => ...
//                       const verified = (await pipeline(fresh, reproduce, refute, severity)).filter(Boolean); log the dropped (died) count
//                       survivors = reproduced && !refuted
//                       extra rounds (<= EXTRA_ROUNDS): re-run only lenses that produced a survivor, cap FIND_CAP; each round is gated by
//                       `if (lowBudget()) { log('budget: extra round skipped'); break }` (the guarded filigree-1 idiom)
//                       and by a code counter `agents` (find + verify spawns) that stops at VERIFY_BOUND; leftovers recorded unverified as a gap
phase('Bare-street gate')   // pipeline(JUDGE_VIEWS, (view, _item, vi) => parallel(J0, J1, J2 using layeredIsA(vi, j.id))); .filter(Boolean) and a missing judge fails SG4.2 for that view; voice grep; coexistence
phase('Punch list')   // punch integrator (crit)
phase('Record')       // shot pruner; recordD findings/c<k>.json; record gates/4-review-c<k>.json; record state/4-review.json
return done({...})
```

## 7. Gate: bare-street test + no surviving blocker/major (scored in code)

An omission by judge j at view v is **confirmed** when `d.views[v].classes_on[class] > 0` and the bare count is 0
(`classes_off` absent or 0). A judge "prefers layered" when its `prefer` names the layered still under `layeredIsA`.

| id | criterion | threshold |
|---|---|---|
| SG4.1 | surviving blocker or major findings | 0 |
| SG4.2 | per judge view: ≥2 of 3 judges prefer layered, and each of them lists ≥3 confirmed omissions | 4/4 views |
| SG4.3 | fingerprints re-measured: both seeds `never === off === on`, `walk_on === walk_off` | equal |
| SG4.4 | caps met on SV1–SV9 (digest vs spec `/caps`), SV5/SV9 on === off | all |
| SG4.5 | fade: `appear.violations` = [], swaps 1+1 per threshold | both |
| SG4.6 | `VOCAB_ST` hits in STREET-block string literals | 0 |
| SG4.7 | coexistence: filigree anchors resolve and none sits inside the STREET block, `restore_undeclared` = [], hash table ok, stats keys unchanged (no tree-digest comparison here: filigree punch fixes may legitimately change `maps-site/` after Street 3; Street 3's GS.8 already proved per run that this track never wrote there) | all |
| SG4.8 | blind compliance: each judge's `files_read` ⊆ its two stills | all |
| SG4.9 | coverage: every lens returned in round 0; verify fan-outs ≥75% kept | all |

The device gate (ST8) is **reported**, not scored: `device_gate` = `pass` when a `docs/street/device/*.json` shows
`fps_min ≥ 42` and `degrade_max === 0`, `fail` when one exists and does not, `absent` otherwise. The owner flips the
street default only when Street 4 passed AND `device_gate === 'pass'`.

## 8. Bounds

Preflight 2 + Capture 4 + Find 11 + Verify round 0 (dedup 1 + 22 × 3) 67 + extra rounds 2 × (11 + 1 + 11 × 3) = 90 +
Gate 12 + 2 = 14 + Punch 2 + Record 1 + 2 × 3 = 7 → **197 (bound 200; typical ≈80)**.

## 9. Outputs and return

Outputs: `docs/street/punch-list.{md,json}`, `findings/<Lnn>-c<k>-r<n>.json` + `findings/c<k>.json` (verified),
`review-c<k>/metrics.json` + `review-c<k>/cited/` (tracked) + `review-c<k>/shots/` (git-ignored),
`gates/4-review-c<k>.json`, `state/4-review.json`; with `preview:true` all of it under `docs/street/preview/`
(git-ignored).

| field | value |
|---|---|
| `pass` | gate pass, not preview, not forced, records read back |
| `reason` | `''` · failing ids joined `, ` · `preview` · `forced: <reason>` · `infra` · `agent died: <label>` · `record-mismatch` · `plan` · `smoke` |
| `polish_note` | `Street 4 c<k>: <s> surviving (<b> blocker, <m> major), bare-street <v>/4 views, device gate <pass|fail|absent>` |
| `polish_inserts` | per surviving blocker/major: `- [ ] **Street 4 punch c<k> · <id> — <title>** — <fix>; unit hint: <hint>; edits index.html only inside the STREET block or declared hooks and obeys the street hold (docs/street/README.md §1.3); done when <repro_cmd> no longer exits 0`; plus one grouped `- [ ] **Street 4 punch c<k> · <n> minor/nit items (<ids>)** — fix each as listed in docs/street/punch-list.md; done when each listed item's evidence no longer reproduces` |
| `polish_inserts_above` | `'Street 4 · Review → punch list'` |
| `changelog_line` | `- docs: Street 4 — review c<k> (<pass|fail>)` |
| `cycle`, `device_gate`, `gate`, `gate_path`, `owner_rulings_used`, `street_rulings_used` | informational |

## 10. Stub runs (impl-units acceptance; harness and canned files as workflow-1 §10; scratchpad-only, not reproducible from the repo)

| run | expect |
|---|---|
| `node street-plan/stubrun-street.js <script> '{"date":"2026-10-05"}' street-plan/stub/s4-fresh.json` | exit 3, `threw` contains `review must wait for the finished street view` |
| `node street-plan/stubrun-street.js <script> '{"date":"2026-10-05","mode":"plan","preview":true}' street-plan/stub/s4-fresh.json` | exit 0, `reason === 'plan'`, `bound === 200`, `violations` = [] |
| `node street-plan/stubrun-street.js <script> '{"date":"2026-10-05","cycle":3}'` | exit 3, `threw` names the cycle bound (1..2) |
