# Design — `.claude/workflows/filigree-2-plan.js` (Job 2: Planning → sheet spec)

Implements brief p5, "2. Planning":
- **Input:** the density bible and the region.
- **Output:** a sheet spec. Pick one coast, one river town and one painted city; set label ranks; decide the Azlen rule;
  lock the overlay order; name the palette.
- **Done when:** a cartographer who has not seen the posts could draw sheet one from the spec alone.
- Brief: "Do not let planning start before the density bible exists."

**§0 prelude:** paste verbatim the fenced block in `workflow-1-research.md` §0, then `const JOB = 'filigree-2-plan'`
above it, below meta.

## meta
```js
export const meta = {
  name: 'filigree-2-plan',
  description: 'Filigree Job 2: turn the density bible into a sheet spec with build units; gate = cold-cartographer test',
  whenToUse: 'Run as the POLISH item "Filigree 2 · Planning → sheet spec" after gates/1-research.json passed: Workflow({name:"filigree-2-plan", args:{date:"YYYY-MM-DD"}}). Docs-only.',
  phases: [
    {title: 'Preflight', detail: 'bible gate passed + bible unchanged; re-anchor; ledger; rulings'},
    {title: 'Probes', detail: 'freeze 30-40 closed-form probes BEFORE the spec exists'},
    {title: 'Pick', detail: 'challenger vs the R8 default ground; 3 pickers + 2 judges only if refuted'},
    {title: 'Sections', detail: 'one writer per spec section -> anchor check -> fixer'},
    {title: 'Integrate', detail: 'opus/xhigh integrator -> sheet-spec.md/.json; base crops; red-team + patch'},
    {title: 'Units', detail: 'unit planner -> units[] in slices A-D; DAG + traceability in code'},
    {title: 'Check', detail: 'anchor, leak and canon checks; fixer; spec reader resolves probe pointers'},
    {title: 'Cold-cartographer gate', detail: 'paired blind drafters -> SVG extractors -> scoring in code; guess auditor; divergence judge'},
    {title: 'Fix', detail: 'spec fixer on both-wrong probes, silent pointers, gaps, divergences (<= maxRounds)'},
    {title: 'Record', detail: 'gates/2-plan.json, gates/views.json, state/2-plan.json'}
  ]
}
const JOB = 'filigree-2-plan'
```

## Args

The shared args are listed in §0. `force` (a reason string) skips the Job 1 gate check, and the resulting gate can never pass.

Job-specific args (the body starts with `checkArgs(['ground'])`):
- `ground`, optional: `{coast, river_town, city}`.
  - When given, the Pick phase is skipped and the value is recorded as an owner override.
  - Validation: each field must be a non-empty string.

## Constants

**SPEC_ROOTS** are the JSON-pointer roots the spec MUST populate. Probes may only point under them. The roots:
`/picks /sheets /paint_order /sheet_one /label_ranks /appear /spacing /city_rule /overlays /hash /toggle
/notices /palette /paint /relief /rivers /names /plates /perf /prerequisites /fixtures /hook /capture /checks
/generators /rules /units /slices /slice_classes`.

**PAINT_ORDER_IDS**, the brief's p5 order:
`['relief','contours','water','rust_road','reserves','homesteads','names_heights','city_grain','fog']`.

**OVERLAY_IDS**, in fiction (R10):
`['old_survey','structures','caravan_halts','blazed_paths','muster_days','shut_ways']` (player-facing labels: the old survey, raised halls and steadings, caravan halts, blazed paths, muster days, shut ways; `muster_days` = levy muster-days, Tamar's dark hour, dragon flights).
- `old_survey` sits under the live sheet.
- `muster_days` and `shut_ways` sit on top and are swappable.

**VIEWS_SEED** are the views s12 must define. The integrator resolves each `zoom` to the midpoint of the named
sheet's band.
| id | sheet | center (atlas px) | mask |
|---|---|---|---|
| V1 | country | 1488,1520 (sheet-one centre) | — |
| V2 | region | 1448.6,1527.5 (Aldorūs) | Aldorūs |
| V3 | valley | 1448.6,1527.5 | Aldorūs |
| V4 | region | 1477.7,1444.2 (Sokundo, C1 coast) | Sokundo |
| V5 | valley | 1392,1584 (F02 plateau) | — |
| V6 | city | 1236.1,1415 (Epēshu) | — |
| V7 | region, one-question plate "Where can we go this week?" | 1448.6,1527.5 | — |

Masks:
- **Settlement disc:** radius `max(96, 1.5 × footprint)` atlas px.
- **Every other anchor/marker in view:** a disc of r = 48 atlas px, so the print's hand-lettered town names are covered as well.

**Hash rule (anchor `!/^#view=/.test(location.hash)`):**
- Views are written `#view=x,y,z&filigree=1&…`.
- Today the moveend writer rewrites the hash to `#view=x,y,z` and drops trailing params. U00 must make it keep them.

**CAPTURE_CONTRACT** is copied verbatim into `/capture` and implemented by unit U01:
```
node tools/filigree-capture.js --views <views.json> [--only V2,V3] [--modes dense,sparse] [--themes day,night]
  [--dpr 1,2] [--mask auto|none] [--mask-scale 1|1.5] [--cells <hexes.json>]
  [--metrics labels,counts,tiles,stack,appear,loaf,phone,city,edges,fog] [--viewport 1280x800]
  [--port 8544] [--cdn-dir <dir>] --out <dir>
  -> <out>/<view>-<mode>-<theme>-dpr<k>.jpg (<=300 KB each) and <out>/metrics.json:
  {views:{<V>:{<mode>:{labels:[{text,class,rank,x,y,opacity}], counts:{<class>:n}, heights:n, visible_landform_labels_outside_mask:[name]}}},
   cells:{<F>:{<mode>:{<class>:n}}},
   tiles:{<toggle>:{base_requests:n}},
   stack:{node_identity_kept:bool, reload:bool, roundtrip_equal:bool, moveend_keeps_params:bool},
   appear:{steps:n, violations:[{class, z_from, z_to, op_from, op_to}], below_minzoom_visible:[class]},
   loaf:{p95_ms, max_ms, frames}, phone:{min_label_gap_px, overlaps, hscroll:bool},
   city:{pins_at_rest, controls_at_rest, block_labels, street_names_below, street_names_above, label_count},
   edges:{<V>:{band_mean, interior_mean}}, fog:{opacity, same_day_equal:bool, diff_day_differs:bool},
   panes_when_off:[name], filigree_counts_when_off:{<class>:n},
   console_errors:[string], infra_error:null|string}
Behaviour:
- Starts `node server.js` if the port is free.
- Routes **/leaflet@1.9.4/dist/* and **/three.js/r128/three.min.js to the extracted `npm pack leaflet@1.9.4
  three@0.128.0` files in --cdn-dir.
- Uses Chromium at /opt/pw-browsers (Playwright from NODE_PATH=/opt/node22/lib/node_modules).
- Never runs `playwright install`.
- Waits for window.ATLAS.ready + document.fonts.ready + network idle + 400 ms after zoomend.
- Counts are taken ONLY through ATLAS.filigree (visible = pane opacity > 0.5 AND intersects the viewport).
- Any setup failure sets infra_error and exits 2. Map defects never set infra_error.
```

**HOOK_CONTRACT** is copied verbatim into `/hook`; unit U00 implements it:
`ATLAS.filigree = {on, classes, version, count(bbox)->{class:n}, names(bbox)->[{text,class,rank,x,y}], sparse(bool)}`.
- `bbox` is `[x0,y0,x1,y1]` in atlas px.
- `count` and `names` see only features whose pane opacity is > 0.5 and that intersect the viewport.
- `sparse(true)` equals the toggle off.
- All filigree code lives in one block `/* FILIGREE */ … /* /FILIGREE */` in `maps-site/index.html`.

**LEAK** regex for G2.3, applied to `sheet-spec.md` outside `## Provenance` and to every string in `sheet-spec.json`:
`/plate (one|two|three)|plate [123]|Azlen|Collison|Bay Atlas|geo\.admin|swisstopo|Sonoma|Guerneville|Applegate|Handmer|Andersson/i`.

**SECTIONS.** Each has one writer, which writes `spec/<sid>.md` and returns the fragment for the SPEC_ROOTS it owns.

| sid | section | owns | role |
|---|---|---|---|
| s01 | Sheets and zoom bands → Leaflet mapping. Covers the bands vs `TIER_CEIL`, `Z_TIER_D`, `Z_STREET`, reveal tiers A–D, the base/overlay ramps, overzoom honesty, sheet one = region band over C1 (R8), and the DM sheet lock `sheet=<band>&at=<place>` | `/sheets/*/band`, `/sheet_one` | deep |
| s02 | Label ranks, the collision pass (own weighted greedy, ~50 lines; labelgun is archived), the threshold + appear effect (R1, R2, R6), min label spacing at 390 px width ("cramped"), selective label masking (halo/knockout), and collisions with printed lettering (q16) | `/label_ranks`, `/appear`, `/spacing`, `/sheets/*/must`, `/sheets/*/forbidden` | judge |
| s03 | The city rule (R4, R7, R13): texture over type, fog as weather (seeded), no block labels, street names on a threshold, pins at rest = 0, and a label cap | `/city_rule` | judge |
| s04 | Overlay stack + swap + hash (R12, R14, R18). The old survey is an era tile layer under the live base (opacity/swipe). Notices sit on top (the player-facing label is "the herald's tidings"; `notices` stays the file/param/schema name). Covers the `layers=id@k=v,visible,opacity;…` grammar, the default-off `filigree=1` toggle + layers-panel row, hash composition through the `#view=` writer, and the notices schema `{id,kind,voice,start_ab,end_ab,geom}` + loading | `/overlays`, `/hash`, `/toggle`, `/notices` | judge |
| s05 | Palette (R3): line-work tokens (bone paper = the print, rust road, ocher arterials, rose-brown blocks, contour hair, wet-blue water line) as hex + night variants; WCAG contrast for labels | `/palette` | audit |
| s06 | Relief/contours/heights/hachures from `EPESHU_HF` via `tools/filigree-dem.js` decode: Imhof light from the upper left (azimuth 315°, altitude 45°, cool valley shadow), contour interval 5 m, index every 25 m, prominence ≥15 m, no-DEM rule (R22), heights per R20, an `imhof_check_cmd`. Also `rivers.json`: source rule + print-overlap check (≥90% of samples within 3 px of dark ink) | `/relief`, `/rivers` | deep |
| s07 | Names (R9): mint key, `tools/mint-names.js`, the veto list, `prov:'invented'`, sayability (the NAME repeat rule anchor `NAME.used.has(n)`, seam rules), `names-for-owner.md`, gazetteer regeneration (never hand-edited) | `/names` | audit |
| s08 | Readers vs navigators: one-question plates as `THEMES` entries ("Where can we go this week?" extends `roads`; "What is around us?" = the valley sheet at the party's place); search and `#place` stay filigree-free | `/plates` | audit |
| s09 | Performance budget from `docs/research/web-performance.md`: LoAF p95 cap, labels per view cap, per-zoom-frame work | `/perf` | audit |
| s10 | Data prerequisites + data truth (R11, R21): which slices need the roads / census / rivers; Drāmūz, Hordon and the Aldorūs contradiction queued as data items | `/prerequisites` | audit |
| s11 | Paint on the base: a pooled-edge contrast pass on the land/water mask (reuse `washMake`/`sampleCityMask`) for coast, parks and reserves (method, band px, luminance delta); washes print-sampled; the real-colour check (ΔE ≤ 10 vs the print hue / biome) | `/paint` | deep |
| s12 | Fixtures + test contracts: VIEWS_SEED → `/fixtures/views`, hand-test masks, HOOK_CONTRACT → `/hook` (+ `pre_filigree_panes`: the pane names present today, read from the pane-creation code), CAPTURE_CONTRACT → `/capture`, per-slice `/checks` (`{id, cmd, expect}`: a command printing JSON plus a condition on it, such as `overlap >= 0.9`), `/generators` (every `tools/filigree-*.js` / `mint-names` / `build-gazetteer` command) | `/fixtures`, `/hook`, `/capture`, `/checks`, `/generators` | audit |

## Agents and schemas

**Preflight** (phase `Preflight`, mech, `crit`). It runs `ANCHOR_TASK` and checks:
- `${OUTABS}/gates/1-research.json` exists with `pass:true`;
- its recorded bible sha256 equals the current `density-bible.json` sha.

It also returns the following:
- From the bible: `rule_ids`, `rule_kinds` (id → kind), `must_ids`, `class_ids`, `forbidden_by_sheet`, `targets`.
- `rulings_overrides` from `${DOCS}/rulings.json`.
- Ledger `state/2-plan.json`: sections present (path + sha ok), probes present (sha ok).
- `spec_exists`.

Schema: `{"type":"object","properties":{"bible_gate_pass":{"type":"boolean"},"bible_sha_ok":{"type":"boolean"},"spec_exists":{"type":"boolean"},"rule_kinds":{"type":"object","additionalProperties":{"type":"string"}},"targets":{"type":"object","additionalProperties":{"type":"object","additionalProperties":{"type":"object","additionalProperties":{"type":"number"}}}},"must_ids":{"type":"array","items":{"type":"string"}},"rule_ids":{"type":"array","items":{"type":"string"}},"class_ids":{"type":"array","items":{"type":"string"}},"forbidden_by_sheet":{"type":"object","additionalProperties":{"type":"array","items":{"type":"string"}}},"anchors":{"type":"object","additionalProperties":{"type":["string","null"]}},"rulings_overrides":{"type":"object","additionalProperties":{"type":"string"}},"sections_ok":{"type":"array","items":{"type":"object","properties":{"sid":{"type":"string"},"path":{"type":"string"},"rules":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"from":{"type":"array","items":{"type":"string"}},"buildable":{"type":"boolean"}},"required":["id","from","buildable"]}}},"required":["sid","path","rules"]}},"probes_ok":{"type":"boolean"},"probe_summary":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"ok":{"type":"boolean"}},"required":["id","ok"]}}},"required":["bible_gate_pass","bible_sha_ok","spec_exists","rule_kinds","targets","must_ids","rule_ids","class_ids","forbidden_by_sheet","anchors","rulings_overrides","sections_ok","probes_ok","probe_summary"]}`.

Script behaviour:
- In `full` mode, `!(bible_gate_pass && bible_sha_ok) && !FORCE` → `die('planning must not start before the density bible exists (brief p5): gates/1-research.json is not pass, or the bible changed since')`.
- In smoke/plan mode the same condition is logged only.
- A lost required anchor → `die`.
- `mode:'plan'` → return the schedule: Probes 1, Pick 1–6, Sections 12–36, Integrate 4–6, Units 1, Check 4–8, Gate 7, Fix ≤2×12, Record 3, bound ≈ 100.

**Probes** (phase `Probes`, judge, `crit`; skipped when `probes_ok && RESUME`). The probes are never regenerated
across rounds or runs.

Prompt:
- "The sheet spec does not exist yet and you must not look for one. From `density-bible.md/.json`, brief p5
  (Planning) + p8 (sheets), and these rulings `rulingText(RUL, all)`, write 30–40 closed-form probes a cartographer
  must answer to draw sheet one.
- ≥15 must be `fixed`: the answer is determined by the bible, the brief or a ruling regardless of the ground pick
  and of choices the spec makes. Give `expected` and `cite` (`B-xx` | `brief pN` | `Rnn`).
- The rest are `spec` probes: freeze ONLY the question and a JSON pointer under SPEC_ROOTS where the spec must
  hold the answer (for example `/sheets/valley/band/0`, `/palette/rust_road/day`, `/picks/river_town/name`). No
  expected value.
- Cover: paint order positions, forbidden per sheet, the shield town, the fog layer's place vs names, appear
  ease, the overlay order, the hex six on F02, palette tokens, and the city label rule."

It writes `${OUTABS}/gates/2-probes.json`: `{date, frozen:true, probes:[…]}` and ends with `READBACK` (the script checks `FILE_OK`; a failure is treated like a dead agent).

Schema:
`{"type":"object","properties":{"path":{"type":"string"},"sha256":{"type":"string"},"parsed":{"type":"boolean"},"probes":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"q":{"type":"string"},"kind":{"type":"string","enum":["enum","number","name","hex","order","bool"]},"source":{"type":"string","enum":["bible","brief","ruling","spec"]},"expected":{"type":["string","number","boolean","array"]},"cite":{"type":"string"},"pointer":{"type":"string"},"tolerance":{"type":"number"}},"required":["id","q","kind","source"]}}},"required":["path","sha256","parsed","probes"]}`.

Code check:
- 30 ≤ n ≤ 40.
- ≥15 non-spec probes, each with `expected` and `cite`.
- Every spec probe has a `pointer` starting with a SPEC_ROOTS entry.
- Fail → one re-ask (`crit` label `probes (fix)`), then `die`.

**Pick** (phase `Pick`). Skipped if `A.ground` is given.
1. **`pick challenger`** (judge). "Try to refute the R8 default (C1 / Aldorūs / Epēshu; sheet one = the region sheet over
   C1)." It uses the bible and dossier §7: DEM coverage, data readiness, shield evenness (Kanae 86 px, Sokundo 88
   px; R19), the Aldorūs sea contradiction (R21) and the Drāmūz marker.
   Schema: `{"type":"object","properties":{"refuted":{"type":"boolean"},"reasons":{"type":"array","items":{"type":"string"}},"alt":{"type":"object","properties":{"coast":{"type":"string"},"river_town":{"type":"string"},"city":{"type":"string"}},"required":["coast","river_town","city"]}},"required":["refuted","reasons","alt"]}`.
2. If `refuted` → `parallel` 3 **pickers** (judge; angles evidence-led / table-play-led / build-risk-led), each returning
   `{coast, river_town, city, why}`. Schema: `{"type":"object","properties":{"coast":{"type":"string"},"river_town":{"type":"string"},"city":{"type":"string"},"why":{"type":"string"}},"required":["coast","river_town","city","why"]}`.
   Results go through `kept(picks, 'pickers')`; a dead picker is simply a missing candidate.
3. Then `parallel` 2 **pick judges** (judge) score {default, alt, the 3 picks}. They use a rubric of 1–5 on each of: canon fit, one DEM
   window, data readiness, shield evenness, table play. Schema: `{"type":"object","properties":{"scores":{"type":"array","items":{"type":"object","properties":{"candidate":{"type":"string"},"canon_fit":{"type":"integer"},"dem_window":{"type":"integer"},"data_ready":{"type":"integer"},"shield_even":{"type":"integer"},"table_play":{"type":"integer"}},"required":["candidate","canon_fit","dem_window","data_ready","shield_even","table_play"]}}},"required":["scores"]}`.
   A dead judge is dropped (`kept`); with zero judges left the default stands and the pick is logged `pick-unjudged`.
4. Totals are tallied in code. An alternative wins only if its total is ≥ default + 1 (R8); otherwise the default is kept.
   The barrier is justified because judges need all picks.

**Sections** (phase `Sections`). This is a pipeline over `cap(SECTIONS)` minus the resumed ones, with three stages and no barrier.
1. **`<sid> · write`** (role per table). It reads the bible, README § Reuse map, `rulingText(RUL, relevant)`, the
   picks, `anchorMap`, and the dossier. Its section is not blind.
   - Write `${OUTABS}/spec/<sid>.md`.
   - Rule ids `S-<sid>-NN`, each with `from:[B-xx]` (may be empty only if `buildable:false`).
   - Give anchors as patterns.
   - Schema: `{"type":"object","properties":{"sid":{"type":"string"},"path":{"type":"string"},"sha256":{"type":"string"},"rules":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"text":{"type":"string"},"from":{"type":"array","items":{"type":"string"}},"buildable":{"type":"boolean"}},"required":["id","text","from","buildable"]}},"fragment":{"type":"object","additionalProperties":{"type":["string","number","boolean","array","object","null"]}},"anchors":{"type":"array","items":{"type":"object","properties":{"path":{"type":"string"},"pattern":{"type":"string"}},"required":["path","pattern"]}},"open":{"type":"array","items":{"type":"string"}}},"required":["sid","path","sha256","rules","fragment","anchors","open"]}`.
2. **`<sid> · anchors`** (mech): `grep -nF` each pattern. Schema `{"type":"object","properties":{"bad":{"type":"array","items":{"type":"string"}}},"required":["bad"]}`.
3. **`<sid> · fix`** (triage), only if `bad.length`. It rewrites those anchors in the section file and returns the write schema.

Stage callbacks are written out so the writer's result survives to stage 3 (a stage only receives the previous
stage's output):
```js
pipeline(todoSections,
  s => agent(P(writePrompt(s)), {label: s.sid + ' · write', phase: 'Sections', schema: WRITE, ...M(s.role)}),
  (w, s) => w && agent(P(anchorPrompt(w)), {label: s.sid + ' · anchors', phase: 'Sections', schema: ANCH, ...M('mech')}).then(a => a && ({w, bad: a.bad})),
  (a, s) => a && (a.bad.length ? agent(P(fixPrompt(a.w, a.bad)), {label: s.sid + ' · fix', phase: 'Sections', schema: WRITE, ...M('triage')}) : a.w))
```
The result per section is the writer's (or fixer's) object; a `null` anywhere means that section is missing, and
`kept(sections, 'sections')` feeds G2.12 (a section dropped twice fails G2.1).


**Role notes (README §6 table).** s02, s03, s04 are `judge` (interpretation of rulings); s05, s07–s10, s12 are
`audit`. s01, s06 and s11 are `deep` (sonnet/high), deliberately below opus: they translate tool output (tier
constants, the DEM decode, the wash method) rather than interpret, and a drafted-wrong number is caught by the
anchor/probe checks, not by a stronger writer.

**Integrate** (phase `Integrate`).
1. **`spec integrator`** (integ, `crit`). It reads every `spec/s*.md` + fragments, the bible, picks and rulings. It writes:
   - `${OUTABS}/sheet-spec.md`. This must be **self-sufficient prose**: every reference is described in its own words, and
     the posts/plates/Swiss names appear only in a final `## Provenance` section.
   - `${OUTABS}/sheet-spec.json` with every SPEC_ROOTS key:
     - `paint_order` = PAINT_ORDER_IDS;
     - `overlays` cover OVERLAY_IDS;
     - `/fixtures/views` zooms resolved;
     - `/hook` and `/capture` copied verbatim;
     - `/rules` = all section rules.

   Return schema: `{"type":"object","properties":{"md":{"type":"string"},"json":{"type":"string"},"sha_md":{"type":"string"},"sha_json":{"type":"string"},"rules":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"from":{"type":"array","items":{"type":"string"}},"buildable":{"type":"boolean"}},"required":["id","from","buildable"]}},"roots_present":{"type":"array","items":{"type":"string"}}},"required":["md","json","sha_md","sha_json","rules","roots_present"]}`.
2. **`base cropper`** (mech) runs in parallel with the integrator. It writes `${OUTABS}/spec/assets/sheet-one-base.jpg`
   (z5 tiles over `SHEET_ONE_BBOX`, 2 px per atlas px, JPEG q85, using ImageMagick `convert` as pinned in the Job 1
   appendix) and `sheet-one-base.json` (bbox, scale). Schema: `{"type":"object","properties":{"jpg":{"type":"string"},"json":{"type":"string"},"sha256":{"type":"string"},"parsed":{"type":"boolean"}},"required":["jpg","json","sha256","parsed"]}`; the script checks `FILE_OK`. A dead cropper returns `agent died: base cropper` (the drafters need the base).
3. **`red-team`** (judge): contradictions spec ↔ rulings ↔ bible. Schema: `{"type":"object","properties":{"contradictions":{"type":"array","items":{"type":"object","properties":{"a":{"type":"string"},"b":{"type":"string"},"fix":{"type":"string"}},"required":["a","b","fix"]}}},"required":["contradictions"]}`. If any:
   - **`spec patcher`** (judge) applies them and returns the integrator schema;
   - a second red-team runs once. A dead red-team counts as 'not clean' for G2.9, never as 0 contradictions.

   G2.9 = the last red-team returns 0.

**Units** (phase `Units`). The **`unit planner`** (judge, `crit`) appends `units[]`, `slices` (unit ids per slice) and `slice_classes` (bible class ids each slice must make visible, used by the Job 3 slice gates) to `sheet-spec.json` and returns them.

Unit schema:
```json
{"type":"object","properties":{"units":{"type":"array","items":{"type":"object","properties":{
  "id":{"type":"string"},"title":{"type":"string"},"slice":{"type":"string","enum":["A","B","C","D"]},
  "kind":{"type":"string","enum":["logic","tool","data","css","copy"]},"files":{"type":"array","items":{"type":"string"}},
  "paint_order":{"type":"integer"},"depends_on":{"type":"array","items":{"type":"string"}},
  "requires":{"type":"array","items":{"type":"string","enum":["roads","census","rivers"]}},
  "covers":{"type":"array","items":{"type":"string"}},"model":{"type":"string","enum":["opus","sonnet","haiku"]},"effort":{"type":"string","enum":["low","medium","high","xhigh","max"]},
  "acceptance":{"type":"array","items":{"type":"object","properties":{"kind":{"type":"string","enum":["node","grep","json","capture"]},"cmd":{"type":"string"},"expect":{"type":"string"}},"required":["kind","cmd","expect"]}}},
  "required":["id","title","slice","kind","files","paint_order","depends_on","requires","covers","acceptance"]}},
 "slices":{"type":"object","additionalProperties":{"type":"array","items":{"type":"string"}}},"slice_classes":{"type":"object","additionalProperties":{"type":"array","items":{"type":"string"}}}},"required":["units","slices","slice_classes"]}
```

`model` and `effort` are optional and independent: Job 3 validates each against the allowed sets (`MO()`), falls
back to the role pair for a missing or invalid one and logs the rejection; they are ignored in `smoke` mode.

Prompt constraints:
- `paint_order`: 0 = infrastructure, 1–9 = PAINT_ORDER_IDS, 10 = overlays.
- **Slice contents:**
  - **A ground:** U00 hook + toggle + hash composition (logic), U01 capture tool, the relief bake reusing
    `tools/filigree-dem.js`, contours, water fill + pooled coast edge, `rivers.json`.
  - **B ink:** mint tool + gazetteer source, steadings, rust coast road over the traced network, reserves wash,
    names + heights rank/collision pass, the single Aldorūs shield.
  - **C city:** Epēshu painted pass (grain, park voids, ocher arterials, pooled edges), seeded fog, street names on
    a threshold, hover-only halos.
  - **D stack:** old survey under + swipe, notices schema/sample/import, structures / caravan halts / blazed paths /
    muster days / shut ways as toggled sheets, hash grammar + `sheet=` lock, two one-question plates, the R10 rename
    of the Tithe-Yard / Tithe-Barn POIs to The Tribute-Yard / The Tribute-Barn.
- ≤9 units per slice.
- Every acceptance item is machine-checkable (a command + an expected output). Prose is rejected.
- `capture` acceptance only after U01 (depends on U01).
- `index.html` (the sim) only if a spec rule names it.

Code checks, which make up **G2.1**:
- unique ids;
- `depends_on` resolves and the graph is acyclic (Kahn);
- no dependency on a later slice;
- ≤9 per slice;
- U00 is in slice A with files `['maps-site/index.html']` and kind `logic` (it creates the FILIGREE block, implements HOOK_CONTRACT with `classes` = the bible class ids, adds the default-off `filigree=1` toggle + layers-panel row, and makes the `#view=` moveend writer keep trailing params);
- `slice_classes` ⊆ bible class ids, and every class in any `ground_classes.*.six` belongs to exactly one slice;
- U01 is in slice A with files `['tools/filigree-capture.js']` and depends on U00;
- every acceptance has non-empty `cmd` and `expect`;
- every buildable spec rule ∈ ∪`covers`;
- every bible `must` id ∈ ∪ spec `rules[].from`.

A failure gets one re-ask of the unit planner with the failures, then it counts as a fail.

**Check** (phase `Check`). `parallel` of three agents, because the fixer needs all three reports. The results are
**positional and keep their nulls**: a null report is a failing input (`agent died: anchor check|leak check|canon
check`), never a pass.
- **`anchor check`** (mech): every anchor pattern in the spec resolves. Schema `{"type":"object","properties":{"bad":{"type":"array","items":{"type":"string"}}},"required":["bad"]}`.
- **`leak check`** (mech): LEAK over `sheet-spec.md` outside `## Provenance` + all JSON strings. Schema `{"type":"object","properties":{"hits":{"type":"array","items":{"type":"string"}}},"required":["hits"]}`.
- **`canon check`** (audit): player-facing strings in the spec vs `VOCAB_RULE` (prelude); `sheet-spec.md` keeps the old Tithe names only inside a `## Renames` section, which is exempt from `VOCAB_RULE` (not from LEAK). Schema `{"type":"object","properties":{"violations":{"type":"array","items":{"type":"string"}}},"required":["violations"]}`.

If any check reports a problem:
1. **`spec fixer`** (triage) applies the fixes.
2. The three checks re-run once.

Then the **`spec reader`** (mech) runs. It reads `sheet-spec.json` and returns, by code-friendly paths:
- `{probe_values:[{id, value}]}`: the value at each spec probe's pointer, or null;
- `sheet_one_layers`, `paint_order`;
- `must_classes`: `/sheets/region/must[].class`;
- `forbidden_classes`: `/sheets/region/forbidden`;
- `palette_hex`: all day hex values, lowercase;
- `river_town:{name,x,y}`, `must_label:[names]`;
- `views`: `/fixtures/views`;
- `rule_ids`.

Schema (all keys required): `{"type":"object","properties":{"probe_values":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"value":{"type":["string","number","boolean","array","null"]}},"required":["id","value"]}},"sheet_one_layers":{"type":"array","items":{"type":"string"}},"paint_order":{"type":"array","items":{"type":"string"}},"must_classes":{"type":"array","items":{"type":"string"}},"forbidden_classes":{"type":"array","items":{"type":"string"}},"palette_hex":{"type":"array","items":{"type":"string"}},"river_town":{"type":"object","properties":{"name":{"type":"string"},"x":{"type":"number"},"y":{"type":"number"}},"required":["name","x","y"]},"must_label":{"type":"array","items":{"type":"string"}},"views":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"sheet":{"type":"string"},"x":{"type":"number"},"y":{"type":"number"},"zoom":{"type":"number"},"mask":{"type":"string"}},"required":["id","sheet","x","y","zoom","mask"]}},"rule_ids":{"type":"array","items":{"type":"string"}}},"required":["probe_values","sheet_one_layers","paint_order","must_classes","forbidden_classes","palette_hex","river_town","must_label","views","rule_ids"]}`. **G2.4** = no probe pointer resolves to null.

**Cold-cartographer gate** (phase `Cold-cartographer gate`).
- **`drafter A`** (deep) and **`drafter B`** (judge) receive identical prompts (built with `P(body, true)`; the only
  per-drafter difference is the output directory `<X>`):
  - "You are a cartographer who has never seen any source posts or plates. You may read ONLY
    `${OUTABS}/sheet-spec.md`, `${OUTABS}/sheet-spec.json`, `${OUTABS}/spec/assets/*` and your own output directory
    `${OUTABS}/cold/<X>/`. Anything else you open (including the other drafter's directory, `gates/`, the bible or
    the section drafts) is a violation. Do not use the web.
  - Draw SHEET ONE as `${OUTABS}/cold/<X>/sheet-one.svg`:
    - viewBox = its bbox in atlas px;
    - one `<g id="layer-<id>">` per painted layer, in paint order;
    - every label is a `<text>` with `data-class` and `data-rank`;
    - fills/strokes only as palette hex;
    - the base may be embedded as `<image>`.
  - Answer every probe below (id, q, kind only).
  - List each guess you had to make, with the spec section you looked in (or null).
  - List every file you opened."
  - Schema: `{"type":"object","properties":{"svg":{"type":"string"},"answers":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"value":{"type":["string","number","boolean","array"]},"rule":{"type":"string"}},"required":["id","value","rule"]}},"guesses":{"type":"array","items":{"type":"object","properties":{"what":{"type":"string"},"needed_for":{"type":"string"},"spec_ref":{"type":"string"}},"required":["what","needed_for","spec_ref"]}},"files_read":{"type":"array","items":{"type":"string"}}},"required":["svg","answers","guesses","files_read"]}`.
  - Blind check is an allowlist: `DRAFTER_ALLOWED(X) = [OUTABS + '/sheet-spec.md', OUTABS + '/sheet-spec.json', OUTABS + '/spec/assets/', OUTABS + '/cold/' + X + '/']`. Because each drafter may only touch its own `cold/<X>/`, one drafter reading the other's SVG is a violation.
  - Dead drafter: its slot stays `null` (positional A/B). A null drafter fails G2.5 and G2.6 for that side
    (`agent died: drafter A|B`) and is excluded from the divergence judge; it is never scored as zeros.
- Then `pipeline(['A','B'], (X, _, i) => drafter(X), (d, X, i) => d && extract(d, X))`: stage callbacks are
  `(prev, item, index)`, the first stage receives `(item, item, index)`, and a null drafter short-circuits its
  extractor. Plus a separate rasterizer:
  1. **`svg extractor <X>`** (mech). A mechanical node/regex extraction, no judging. Schema `{"type":"object","properties":{"layers":{"type":"array","items":{"type":"string"}},"colors":{"type":"array","items":{"type":"string"}},"labels":{"type":"array","items":{"type":"object","properties":{"text":{"type":"string"},"class":{"type":"string"},"rank":{"type":"string"},"x":{"type":"number"},"y":{"type":"number"}},"required":["text","class","rank","x","y"]}},"shields":{"type":"array","items":{"type":"object","properties":{"x":{"type":"number"},"y":{"type":"number"}},"required":["x","y"]}}},"required":["layers","colors","labels","shields"]}`. Here `layers` are the `layer-*` ids in document order and `colors` are lowercase hex.
  2. **`rasterize`** (audit; it drives Chromium): screenshots of both SVGs → `cold/<X>/sheet-one.png`. It is one agent, run after both drafters. Schema `{"type":"object","properties":{"pngs":{"type":"array","items":{"type":"string"}},"infra_error":{"type":"string"}},"required":["pngs","infra_error"]}`. A non-empty `infra_error` → `reason:'infra'`.
- **Scoring in code.** For each drafter:
  - **probes:**
    - fixed probes are compared with `expected`;
    - spec probes are compared with the reader's `probe_values`;
    - comparisons use `norm()`, number tolerance, exact order arrays and case-insensitive hex;
  - **draw checks:**
    - `layers` == `sheet_one_layers`, exact order;
    - every `must_classes` entry appears as a `data-class` or layer;
    - no `forbidden_classes`;
    - `colors ⊆ palette_hex ∪ {none, transparent}`;
    - exactly one shield, within 24 px of `river_town`;
    - `must_label ⊆ labels.text` by `norm()`;
  - **blind:** `blindBad(files_read, DRAFTER_ALLOWED(X))` must be empty.
- **`guess auditor`** (judge) runs on both drafters' guesses + the spec. It classifies each guess as `answered`
  (quote the spec text) or `gap`, with the SPEC_ROOTS pointer it concerns, or `''` for a choice outside the
  schema. **G2.7** counts gaps whose pointer is under SPEC_ROOTS. Out-of-schema gaps are logged only. Schema:
  `{"type":"object","properties":{"verdicts":{"type":"array","items":{"type":"object","properties":{"drafter":{"type":"string","enum":["A","B"]},"guess":{"type":"string"},"class":{"type":"string","enum":["answered","gap"]},"quote":{"type":"string"},"pointer":{"type":"string"}},"required":["drafter","guess","class","quote","pointer"]}}},"required":["verdicts"]}`.
  A dead auditor makes G2.7 fail (`agent died: guess auditor`).
- **`divergence judge`** (judge) sees the two PNGs + the spec only. It returns
  `{blocking:[{spec_rule, pointer, a, b}], minor:[…]}`; schema `{"type":"object","properties":{"blocking":{"type":"array","items":{"type":"object","properties":{"spec_rule":{"type":"string"},"pointer":{"type":"string"},"a":{"type":"string"},"b":{"type":"string"}},"required":["spec_rule","pointer","a","b"]}},"minor":{"type":"array","items":{"type":"string"}}},"required":["blocking","minor"]}`. Code keeps only blocking items whose `spec_rule` ∈ the
  reader's `rule_ids`, which gives **G2.8**. A dead judge fails G2.8; it is not read as 0 divergences.

**Pass criteria:**
| id | criterion | threshold |
|---|---|---|
| G2.0 | preflight chain: Job 1 passed, bible unchanged | true (not forced) |
| G2.1 | traceability + DAG + acceptance + slices + mandatory U00/U01 | all code checks |
| G2.2 | anchors resolve (by pattern) | 0 bad |
| G2.3 | leak check | 0 hits |
| G2.4 | spec answers every spec probe pointer | 0 null |
| G2.5 | probe accuracy | each drafter ≥90% |
| G2.6 | draw checks | both drafts pass all |
| G2.7 | schema-path gap guesses | 0 |
| G2.8 | blocking divergences | 0 |
| G2.9 | red-team contradictions | last pass 0 |
| G2.10 | canon/voice | 0 violations |
| G2.11 | blind compliance (allowlist check on self-reported `files_read`) | 0 reads outside `DRAFTER_ALLOWED` |
| G2.12 | coverage (`kept()` on sections, pickers, judges) | ≥75% of each fan-out |

**Fix** (phase `Fix`, loop `round < ROUNDS` while failing).
1. **`spec fixer`** (judge, `crit`). It patches only what is cited:
   - probes **both** drafters got wrong (a spec ambiguity; one-drafter misses are logged as noise and not fixed);
   - null pointers;
   - schema-path gaps;
   - blocking divergences;
   - draw checks both drafts failed;
   - leak and canon hits;
   - unit failures.

   It returns the integrator schema.
2. Then Check + spec reader + the gate re-run, with new drafter labels ` r<round>`.
3. The same frozen probes are used every round.

**Record** (phase `Record`). Three `record()` calls:
- `gates/2-plan.json`: `gateObj({criteria, rounds, artifacts:[spec md/json sha, bible sha, probes sha], picks, rulings_used, gaps})`.
- `gates/views.json`: `{date, views}` from the spec reader.
- `state/2-plan.json`: sections with path, sha and rules; probes sha; spec sha.

## Return value
```
done({pass, reason, rounds,
  outputs: ['docs/filigree/sheet-spec.md', '…/sheet-spec.json', '…/spec/', '…/gates/2-probes.json', '…/gates/views.json', '…/cold/', '…/gates/2-plan.json'],
  gate_path: OUT + '/gates/2-plan.json', owner_rulings_used: RUSED,
  polish_note: `sheet spec: ${rules} rules, ${units} units (A ${a} · B ${b} · C ${c} · D ${d}); cold drafters ${pa}%/${pb}% probes, ${div} blocking divergences (round ${rounds})`,
  polish_inserts: data items from /prerequisites not yet queued (R21), each "- [ ] **Filigree data — …**" placed directly above Filigree 3,
  changelog_line: '- docs: Filigree 2 — sheet spec for the table map (cold-cartographer gate ' + (pass ? 'pass' : 'fail') + ')'})
```

## Outputs (repo)
| path | writer |
|---|---|
| `docs/filigree/gates/2-probes.json` | probe writer (frozen) |
| `docs/filigree/spec/s01..s12.md` | section writers |
| `docs/filigree/spec/assets/sheet-one-base.{jpg,json}` | base cropper |
| `docs/filigree/sheet-spec.{md,json}` | integrator / patcher / unit planner / fixers |
| `docs/filigree/cold/{A,B}/sheet-one.{svg,png}` | drafters / rasterizer |
| `docs/filigree/gates/2-plan.json`, `gates/views.json`, `state/2-plan.json` | `record()` |

## Loop bounds
- Fix rounds: ≤ `ROUNDS`.
- Red-team: ≤2 passes.
- Unit planner: ≤2 asks.
- Probe writer: ≤2 asks.
- Section fixer: one pass.
- Agents ≈ 58 for a clean pass, with a bound ≈ 100.
