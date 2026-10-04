# Design — `.claude/workflows/filigree-4-review.js` (Job 4: Review → punch list)

This implements brief p5–6, "4. Review".
- **Input:** the finished sheet, plus the three plates and the Swiss layer list.
- **Output:** a punch list. It checks:
  - density against plate one, not against a normal virtual-tabletop map;
  - the city against Azlen: does it look painted, or like a UI?;
  - the stack: can you pull the old survey, the shut ways and the muster notice without redrawing?;
  - every name read aloud;
  - the holes where the build flinched and generalized.
- **Done when:** the sparse version of your own map makes you angry.
- v2 adds four lenses: navigator, data truth, appear effect and real colour.

**§0 prelude:** paste the fenced block from `workflow-1-research.md` §0 verbatim. `const JOB = 'filigree-4-review'`
goes above it. **Sparse** = the same view with the table-map toggle off (R18), so no baseline from an earlier run is
needed.

## meta
```js
export const meta = {
  name: 'filigree-4-review',
  description: 'Filigree Job 4: review the finished table map against plate one, Azlen and the Swiss stack; gate = angry-sparse test + no surviving blocker/major',
  whenToUse: 'Run as the POLISH item "Filigree 4 · Review → punch list" after gates/3-build.json passed: Workflow({name:"filigree-4-review", args:{date:"YYYY-MM-DD"}}). Docs-only; its punch items go directly above the Filigree 4 entry.',
  phases: [
    {title: 'Preflight', detail: 'build gate passed; cycle number; fixtures, views, bible targets, re-anchor'},
    {title: 'Capture', detail: 'one capture run of the committed harness -> metrics.json + dense/sparse shots'},
    {title: 'Find', detail: '13 single-lens finders, evidence required'},
    {title: 'Verify', detail: 'dedup vs seen; reproduce + refute + severity per finding; loop until dry'},
    {title: 'Angry-sparse gate', detail: 'paired-model blind judges per open-country view; omissions confirmed by DOM metrics'},
    {title: 'Punch list', detail: 'opus/xhigh integrator -> punch-list.md/.json + polish inserts'},
    {title: 'Record', detail: 'gates/4-review-c<cycle>.json, state/4-review.json'}
  ]
}
const JOB = 'filigree-4-review'
```

## Args
- Shared args (§0), plus `force` (a reason string). The body starts with `checkArgs(['preview','cycle','port'])`;
  `preview` must be a boolean, `cycle` an integer, `port` an integer.
- Job-specific:

| arg | default | rule |
|---|---|---|
| `preview` | false | boolean. Allows a run on a partial build. Findings only; `pass` is forced false |
| `cycle` | `1 + count(gates/4-review-c*.json)` | integer 1..2. A value above 2 → `die('review cycle cap reached (R16): escalate to the owner')` |
| `port` | 8544 | integer 1024..65535 |

## Agents and schemas

### Preflight (phase `Preflight`; mech, `crit`)
It runs `ANCHOR_TASK` and reads the following:
- `${OUTABS}/gates/3-build.json` `pass`;
- the list of prior `gates/4-review-c*.json` files (count + the last one's punch ids);
- `gates/views.json`, `gates/hexes.json`, `gates/1-hex-answers.json`;
- `density-bible.json` `targets.per_view`, `ground_classes`, `plates.one`;
- from `sheet-spec.json`: `perf`, `appear`, `spacing`, `city_rule`, `plates`, `palette`, `overlays`, `generators`, `slice_classes`;
- `${DOCS}/rulings.json`.

Schema: an object whose required keys are those names plus `anchors` and `rulings_overrides`, plus `build_pass`
(boolean), `prior_count` (integer) and `prior_punch_ids` (string array). Free-form inner objects use
`additionalProperties` with a union type; fields the script reads (`targets.per_view`, `ground_classes`) are typed
concretely.

Script rules:
- In `full` mode, `!build_pass && !A.preview && !FORCE` → `die('review must wait for the finished sheet (gates/3-build.json pass)')`.
- `cycle > 2` → `die`.
- `mode:'plan'` → schedule: Capture 1, Find 13, Verify 3×n, extra rounds ≤ROUNDS×(lenses with survivors + 3×fresh),
  gate 12, Punch 1, Record 2, bound ≈ 260.

### Capture (phase `Capture`; audit, `crit`)
There is **one** capture agent, because it owns the browser and is the only stateful step. It runs the committed
harness once:
`node tools/filigree-capture.js --views ${OUTABS}/gates/views.json --cells ${OUTABS}/gates/hexes.json --modes dense,sparse --themes day,night --dpr 1,2 --metrics labels,counts,tiles,stack,appear,loaf,phone,city,edges,fog --out ${OUTABS}/review-c${cycle}/`

The harness writes `metrics.json` into `review-c<k>/` and the bulk JPEGs into `review-c<k>/shots/`, which is
git-ignored (unit D10); a capture is up to 56 JPEGs, about 17 MB, and must not enter git history. After the punch list
is written, a mech **`shot pruner`** copies only the images the punch list cites into `review-c<k>/cited/`
(tracked), removes older cycles' `shots/` directories, and asserts the counts (`count_ok`; schema
`{"type":"object","properties":{"cited":{"type":"array","items":{"type":"string"}},"removed":{"type":"array","items":{"type":"string"}},"count_ok":{"type":"boolean"}},"required":["cited","removed","count_ok"]}`). Only
`metrics.json` and `cited/` are committed.

That covers V1–V7, dense (`filigree=1`) and sparse (toggle off), day/night and DPR 1/2. It records:
- DOM label dumps;
- per-cell class counts;
- base-tile requests per overlay toggle;
- base DOM node identity across toggles (a stamped `data-probe`);
- reload and hash round-trip;
- opacity samples at 0.05-zoom steps across each class's `minZoom ±0.5`;
- Long Animation Frames timings on a scripted zoom sweep;
- phone 390×844 label spacing;
- city at-rest counts;
- edge luminance;
- fog determinism.

It returns a compact summary. The full data stays in `metrics.json`.

Schema (required keys; inner objects typed with `additionalProperties`, never a bare `{}`):
- `metrics_path`, `shots_dir`;
- `views`: `{V:{dense:{named:n, heights:n, counts:{}}, sparse:{named:n, heights:n}}}`;
- `cells`: `{F:{dense:{class:n}}}`;
- `stack`: `{node_identity_kept, reload, roundtrip_equal, moveend_keeps_params}`;
- `tiles_refetched`: n, summed over toggles;
- `appear_violations`: n;
- `below_minzoom_visible`: n;
- `loaf_p95_ms`;
- `phone`: `{min_label_gap_px, overlaps, hscroll}`;
- `city`: `{pins_at_rest, block_labels}`;
- `names_dense`: `{V:[names]}`;
- `names_sparse`: `{V:[names]}`;
- `console_errors`;
- `infra_error`.

A non-empty `infra_error` → `return done({pass:false, reason:'infra', polish_note:'infra: ' + err})`. The polish run
cuts no release, and the next run retries.

### Find (phase `Find`)
`parallel` over `LENSES`. The barrier is justified: findings must be deduped across all lenses before the expensive
verification. The result goes through `kept(found, 'finders')` (the drop is logged and feeds the ≥75% coverage
criterion G4.9); a dead finder is a missing lens, never "no findings". Every finder is built with `P(...)`.

Each finder reads `metrics.json`, the shots, the spec, the bible and code anchors (`anchorMap`), plus its lens inputs.
It writes `${OUTABS}/findings/<lens>-c<cycle>-r<round>.json`.

Each finder is also given the prior cycle's punch ids. It must report a still-unfixed prior item with `prior_id`
rather than as a new finding.

Schema (`FIND`):
```json
{"type":"object","properties":{"lens":{"type":"string"},"findings":{"type":"array","items":{"type":"object","properties":{
  "title":{"type":"string"},"severity_guess":{"type":"string","enum":["blocker","major","minor","nit"]},
  "location":{"type":"object","properties":{"view":{"type":"string"},"hex":{"type":"string"},"file":{"type":"string"},"pattern":{"type":"string"}},"required":["view","hex","file","pattern"]},
  "evidence":{"type":"object","properties":{"kind":{"type":"string","enum":["shot","anchor","metric","cmd"]},"ref":{"type":"string"}},"required":["kind","ref"]},
  "fix":{"type":"string"},"unit_hint":{"type":"string"},"prior_id":{"type":"string"}},
  "required":["title","severity_guess","location","evidence","fix","unit_hint","prior_id"]}}},"required":["lens","findings"]}
```
Unused location fields are `''`. Code **rejects** any finding whose `evidence.ref` is empty.

**LENSES.** Each has one lens and one model/effort pair. The brief's five checks come first.

| id | lens (mechanical core first) | role |
|---|---|---|
| F01 | **Density vs plate one.** Per-class dense counts per view vs `targets.per_view`; vision on V2–V5 vs the bible's `plates.one` inventory ("not a normal VTT map") | judge |
| F02 | **City vs Azlen.** Painted, or a UI? Start from V6 day+night with `city.pins_at_rest`/`block_labels`, then a vision read with cited screen regions | deep |
| F03 | **Stack pull.** Old survey, shut ways and muster days toggled: base tiles refetched, node identity, reload, hash round-trip, moveend keeps params | audit |
| F04 | **Read every name aloud.** For every dense label: syllabify under the Patrinaic seams; the NAME repeat rule (anchor `NAME.used.has(n)`); ≤12 letters per word; no 4-consonant cluster; reserved words. Anything unsayable gets cut or rewritten, and the fix targets the generator source, never the JSON | audit |
| F05 | **Flinch and generalize.** On the 12 fixtures (dense), are the six present? Do the Job-1 applier instances (`1-hex-answers.json`) exist by name or position? Across the sheet-one bbox: DEM local maxima ≥ prominence without a label, and valleys without contour hair | judge |
| F06 | **Canon and voice.** `VOCAB_RULE`, the Kembar, A.B., `prov:'invented'` on every invented feature, the R10 rename done (The Tithe-Yard / The Tithe-Barn → The Tribute-Yard / The Tribute-Barn: the old strings are absent from `maps-site/index.html` and the new pair present) | audit |
| F07 | **Determinism.** Every `/generators` command run twice gives equal sha; `grep -E CLOCK_GREP` over the FILIGREE block; fog seeded; `ANNALS.stats()` identical across two sim loads of `#s=epeshu` | deep |
| F08 | **Accessibility and phone ("cramped").** At 390×844: `min_label_gap_px` ≥ spec `spacing`, overlaps 0, no horizontal scroll, 44 px targets, focus order, reduced motion; night mode keeps day pixels | audit |
| F09 | **Performance.** `loaf_p95_ms` vs spec `perf`; label counts vs caps | audit |
| F10 | **Navigator.** The one-question plate (V7) label count ≤ its cap; "where can we go this week?" answerable in ≤2 clicks; search and `#place` stay filigree-free | audit |
| F11 | **Data truth.** Rivers and the rust road vs print crops (dotted ≠ solid); names vs canon (`wiki-places`, gazetteer); invented items carry `prov` | deep |
| F12 | **Appear effect.** From the opacity samples: no class goes from 0 to ≥0.9 within one 0.05 step; nothing is visible below its `minZoom`; names arrive at or after their ink; ease width within R6 | audit |
| F13 | **Real colour.** Wash hues vs the print-sampled hue (ΔE ≤ 10); line colours = palette tokens; biome agreement with `city-traits.json` | audit |

### Verify (phase `Verify`)
- `seen` is a Set of keys `norm(lens + '|' + location.view + location.hex + location.file + location.pattern + '|' + evidence.ref)`.
  The free-text title is **not** part of the key, so the same defect reworded by a later round is a duplicate. When
  two findings share a key in one round, the longer `title` is kept (tie-break only). A finding with a `prior_id`
  keys on that id instead.
- Fresh = not in `seen`. Add every fresh finding to `seen`. Dedup runs against `seen`, not against confirmed, so rejected findings do not recur.
- `pipeline(fresh, (f, _, i) => parallel([reproduce, refute, severity]))` gives three distinct lenses per finding. The
  triple keeps its nulls positionally: a null reproduce or refute verdict means the finding does not survive
  (`unverified`, logged), a null severity falls back to `severity_guess`:
  - **`reproduce`** (audit): re-run the evidence (command, metric path, shot region, anchor) → `{reproduced:bool, note}`; schema `{"type":"object","properties":{"reproduced":{"type":"boolean"},"note":{"type":"string"}},"required":["reproduced","note"]}`.
  - **`refute`** (judge): "default `refuted:true` if the evidence does not reproduce or a brief/ruling allows it" → `{refuted:bool, why}`; schema `{"type":"object","properties":{"refuted":{"type":"boolean"},"why":{"type":"string"}},"required":["refuted","why"]}`.
  - **`severity`** (triage). It applies a fixed rubric:
    - **blocker**: breaks a brief done-when or a CLAUDE.md hard rule (determinism, canon key, voice).
    - **major**: a brief clause is unmet.
    - **minor**: polish.
    - **nit**.

    Returns `{severity}`; schema `{"type":"object","properties":{"severity":{"type":"string","enum":["blocker","major","minor","nit"]}},"required":["severity"]}`.
- A finding **survives** if `reproduced && !refuted`. Its severity is the severity agent's rating.
- **Loop until dry.** Up to `ROUNDS` extra rounds re-run **only the lenses that produced ≥1 survivor** in the previous
  round. Each re-run is told "already seen: <titles>; report only what is not in this list". The loop stops on a round
  with zero fresh findings. If the cap is hit, `log` it.

### Angry-sparse gate (phase `Angry-sparse gate`)
For each open-country view V2–V5 there is a panel of three blind judges (majority-of-three, G4.2 needs ≥2):
- `J0` judge (opus/high)
- `J1` deep (sonnet/high)
- `J2` judge (opus/high)

README §6's independence rule (paired actors differ in model) is met by *mixing* the panel: J1 is a different model
from J0 and J2, and J2 differs from J0 by sheet order instead of model. The A/B order is **dense first when
`(viewIndex + orderShift(judgeIndex)) % 2 === 0`**, with `orderShift(0) = 0` and `orderShift(1) = orderShift(2) = 1`,
so J0 sees the opposite order to J1 and J2 on every view. It is never random. All judges are built with
`P(body, true)`.

The prompt: "Two sheets of the same ground at the same zoom: A=<png> and B=<png>. Open no other file. Which sheet
would you rather navigate by ridge names with the town covered? List every named landform, height, homestead or path
present on one sheet and missing on the other."

Schema: `{"type":"object","properties":{"prefers":{"type":"string","enum":["A","B"]},"omissions":{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"kind":{"type":"string"},"missing_on":{"type":"string","enum":["A","B"]}},"required":["name","kind","missing_on"]}},"files_read":{"type":"array","items":{"type":"string"}}},"required":["prefers","omissions","files_read"]}`.

It runs as `pipeline(VIEWS_OPEN, (v, _, vi) => parallel(judges.map((J, ji) => () => agent(sparsePrompt(v, order(vi, ji)), {label: ..., phase: 'Angry-sparse gate', schema: SPARSE, ...M(J.role)}))))`
(stage callbacks are `(prev, item, index)`; the first stage receives `(item, item, index)`, so `vi` is the view
index). The three results are positional and keep their nulls: a null judge counts as **not preferring dense** for
that view (never as a vote for dense), is logged `agent died: <view> J<n>` and feeds G4.9. Scoring is in code. An
omission counts only if all of these hold:
- `missing_on` is the sparse side;
- `norm(name)` ∈ `names_dense[v]`;
- it is ∉ `names_sparse[v]`.

**Pass criteria (all):**
| id | criterion | threshold |
|---|---|---|
| G4.1 | surviving blocker/major findings | 0 |
| G4.2 | per view V2–V5: judges preferring dense, each listing ≥3 DOM-verified omissions | ≥2 of 3 judges on every view |
| G4.3 | dense counts per class ≥ bible `targets.per_view[sheet]`, and sparse named ≤ dense named / 3 | every open view |
| G4.4 | fixtures (dense): count of six classes present | ≥10/12 cells 6/6, none <4 |
| G4.5 | read-aloud (F04) surviving findings | 0 |
| G4.6 | stack: `tiles_refetched=0`, `node_identity_kept`, `!reload`, `roundtrip_equal`, `moveend_keeps_params` | all |
| G4.7 | appear: `appear_violations=0`, `below_minzoom_visible=0` | true |
| G4.8 | blind compliance of the judges (allowlist: `blindBad(files_read, [their two PNG paths])`) | 0 reads outside the two PNGs |
| G4.9 | coverage | ≥75% of every fan-out |

### Punch list (phase `Punch list`; integ = opus/xhigh, `crit`)
It reads the surviving findings, the gate measurements and the prior cycle's punch list, and writes:
- `${OUTABS}/punch-list.md`, with these sections:
  1. ranked items, grouped first by brief check and then by severity;
  2. **"Why the sparse map is worse"**: the verified omissions per view;
  3. **"Where we flinched"**: from F05;
  4. **"Fixed since cycle N-1"**.
- `${OUTABS}/punch-list.json`: `{date, cycle, items:[{id:'P<cycle>-NN', severity, lens, location, evidence, fix, unit_hint, done_when, polish_md}]}`.
  - `done_when` is copied from the finding's mechanical check (a metric, command or count).

Return schema (the punch integrator ends with `READBACK` for `punch-list.json`, checked with `FILE_OK` on `sha_json`/`parsed`): `{"type":"object","properties":{"md":{"type":"string"},"json":{"type":"string"},"sha_md":{"type":"string"},"sha_json":{"type":"string"},"parsed":{"type":"boolean"},"items":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"severity":{"type":"string"},"polish_md":{"type":"string"}},"required":["id","severity","polish_md"]}}},"required":["md","json","sha_md","sha_json","parsed","items"]}`.

### Record (phase `Record`)
Two `record()` calls:
- `gates/4-review-c<cycle>.json` ← `gateObj({criteria, rounds, artifacts, rulings_used, gaps, cycle, omissions_by_view, judges})`.
- `state/4-review.json` ← `{cycle, seen_keys, lens_counts}`.

## Return value
```
done({pass: gate.pass && !A.preview, reason, rounds, cycle,
  outputs: ['docs/filigree/punch-list.md', '…/punch-list.json', '…/findings/', '…/review-c<cycle>/', '…/gates/4-review-c<cycle>.json'],
  gate_path, owner_rulings_used: RUSED,
  polish_note: pass ? `review c${cycle}: sparse loses on 4/4 views (${omissions} verified omissions), 0 blocker/major — owner may now flip the table map on (R18)`
                    : `review c${cycle}: ${blockers} blocker, ${majors} major; ${k}/4 views angry — punch items queued above`,
  polish_inserts: one "- [ ] **Filigree 4 punch c<cycle> · P..-NN — <title>** — fix; unit hint; done when <mechanical check>" per surviving blocker/major, plus ONE grouped item for minors and nits. All go DIRECTLY ABOVE the Filigree 4 entry (R16),
  changelog_line: '- docs: Filigree 4 — review cycle ' + cycle + ' (' + (pass ? 'pass' : 'punch list') + ')'})
```
When the gate fails, the item stays unchecked. After its punch items are fixed, the next run re-reviews as
cycle 2. The script refuses a third cycle (R16).

## Outputs (repo)
| path | writer |
|---|---|
| `docs/filigree/review-c<k>/metrics.json`, `review-c<k>/cited/` (tracked); `review-c<k>/shots/` (git-ignored bulk, ≤300 KB each) | capture / shot pruner |
| `docs/filigree/findings/<lens>-c<k>-r<n>.json` | finders |
| `docs/filigree/punch-list.{md,json}` | punch integrator |
| `docs/filigree/gates/4-review-c<k>.json`, `state/4-review.json` | `record()` |

## Loop bounds
- Extra find rounds: ≤ `ROUNDS`, re-running only lenses with survivors.
- Three verifiers per fresh finding.
- One capture.
- 12 gate judges.
- Agents ≈ 110–170 typical, bound ≈ 260. `mode:'plan'` prints the schedule first.
