# Filigree for the Table: operator's guide

This directory holds the durable record of the owner's brief
[`docs/research/filigree-for-the-table.pdf`](../research/filigree-for-the-table.pdf). The brief asks for a table map:
a coast of named ribs and forgotten homesteads, a river town that is the only place with a shield, a painted city
whose blocks are texture rather than labels, and overlays for what is shut, what the levy is mustering for, and what the old
survey still remembers.

The brief splits the work into four jobs:

| # | Job | Output | Done when |
|---|---|---|---|
| 1 | Research | density bible | you can point at a blank hex and say which six things must appear on it before it is allowed to be empty |
| 2 | Planning | sheet spec | a cartographer who has not seen the posts could draw sheet one from the spec alone |
| 3 | Implementation | the table map | you can cover the settlement with a hand and still navigate by ridge names |
| 4 | Review | punch list | the sparse version of your own map makes you angry |

Two rules from the brief govern everything: "Do not let planning start before the density bible exists, and do not
let review become a vibe check."

Each job is one saved workflow in `.claude/workflows/`. Every gate is scored **by the script** from fixed fixtures,
closed-form answers and DOM metrics. Where a criterion reads the density bible (G1.2, G1.8), the script scores the
mechanical validator's reading of the file; the integrator's self-report only cross-checks it.

**Source of truth.** The committed scripts `.claude/workflows/filigree-{1-research,2-plan,3-build,4-review}.js` are
the running truth. Their design documents are committed beside this guide in [`design/`](design/)
(`workflow-1-research.md` … `workflow-4-review.md`, `polish-entries.md`), so a cold reader needs no scratchpad, but
they are **planning snapshots** (2026-10-04): each opens with that notice, later fixes are not back-ported, and where a
script and its design disagree the script wins (§12). `design/polish-entries.md` is a superseded snapshot too: the
live queue text is `POLISH.md` and §1 here. Every script starts with `export const meta = {` on line 1 (no leading
comment or blank line).

**Delivery order.** All of these are committed in one delivery commit *before* the four POLISH items are queued (otherwise a
polish run would find a "Run:" line with nothing to run): the four scripts, `README.md`, `research-dossier.md`,
`todo-inputs.json`, `rulings.json`, `design/`, `.gitignore` entries for the bulk-capture directories, the digest
`docs/research/cartographic-filigree.md`, and finally the POLISH.md entries.

Background:
- [`research-dossier.md`](research-dossier.md): the verified 2026-10-04 research pass, with anchors as of that date.
- [`todo-inputs.json`](todo-inputs.json): its structured inputs.
- [`../research/cartographic-filigree.md`](../research/cartographic-filigree.md): the terse digest.

## 1. Protocol

1. **One job per polish run.** The four POLISH items sit in two blocks. Jobs 1–2 come after "Traced road network";
   Jobs 3–4 come after "Census second pass". A polish run takes the top unchecked item, as usual.
2. **The order is enforced by gate files.** Each preflight refuses to start unless the previous job's gate says
   `"pass": true` and its key artifact is unchanged since:
   - Job 2 needs `gates/1-research.json` and an unchanged bible;
   - Job 3 needs `gates/2-plan.json` and an unchanged spec;
   - Job 4 needs `gates/3-build.json`.

   `args.force` (a reason) bypasses the check. A forced gate is recorded as `forced_by` and **can never pass**.

   A refused prerequisite is almost always a **thrown Error** that names what is missing:
   - Job 2: `planning must not start…` (the Job 1 gate is not pass, or the bible changed).
   - Job 3: `build must not start…` (the Job 2 gate is not pass, or the spec changed); `slice X refused: earlier slice …
     has not passed its gate`; and `sheet-spec.json has no /checks for slice X: Job 2 (section s12) must write per-slice
     checks; re-run Job 2` (for slice D, any of the four slices).
   - Job 4: `review must wait for the finished sheet (gates/3-build.json pass)`. It is thrown before the missing-inputs
     check; `args.preview` skips it and works on a partial build without `3-build.json`.

   Job 3 **returns** `reason:'blocked'` only for the unchecked "Traced road network" / "Census second pass" items
   (R11), and only once the gate chain has held. The polish run treats a thrown prerequisite Error and a returned
   `blocked` alike: leave the item unchecked, note it, and take the next unchecked item.

   **Any other thrown Error is a run fault, not a prerequisite, and carries no `reason`.** Examples: bad args
   (`<job>: …`, such as a malformed date); `missing inputs: …` and `anchor lost: …` from any job, Job 1 included;
   `fixtures changed; delete gates/hex* to re-crop` (Job 1). Treat it as `infra`: cut no release, note the Error text,
   and take the next unchecked item. A lost anchor means a pattern literal in the prelude's `ANCHORS` no longer matches
   `index.html` or `maps-site/index.html`; re-anchor that literal first (§12). A fixtures change is deliberate: delete
   `gates/hexes.json` and `gates/hex/` by hand and re-run.
3. **Job 3 is multi-run.**
   - Slices run in order: A ground → B ink → C city → D stack.
   - Each run builds up to `maxUnits` ready units of the current slice. When the slice is complete, it runs that
     slice's gate.
   - The item stays unchecked between runs, with the returned `polish_note`.
   - Check it off only when the workflow returns `check_off: true`. That happens when slice D's final gate passes. It also
     comes back on the `nothing to build` rerun of an unforced full run when `gates/3-build.json` is already pass (for
     example after a record-mismatch recovery that wrote `final_gate` by hand); that rerun cuts no release.
4. **What the polish run does with the return value.**

   | Return field | What the run does with it |
   |---|---|
   | `polish_note` | Uses it as the one-line result note. |
   | `polish_inserts` | Adds them as new items, placed as below. Skip any whose title is already queued. Job 1 sends one stable item per failing criterion id plus one pointer to the `gaps` list (never raw measurement strings). Job 2 omits an item when `POLISH.md` already has `Filigree data — <item>`. Job 3 sends a stuck unit only on the run in which it becomes stuck |
   | `polish_inserts_above` (Jobs 3 and 4) | Where to place the inserts: the item they go directly above. |
   | `blocked_by`, `final_gate`, `state`, `slice` (Job 3) | Informational, except for record-mismatch recovery (§12). |
   | `changelog_line` | Puts it in the patch release. |
   | `pass` / `check_off` | Uses it to decide the checkbox. |
5. **Placement of inserted items.**
   - A gap that blocks a **later** filigree job goes directly above that job, not at the bottom.
   - Review punch items go directly above Filigree 4 (R16).
   - Stuck build units go directly above Filigree 3. They are emitted only on the run in which a unit becomes stuck
     (its `runs_failed` reaches 3), not on every later run. The remedy is in §12.
6. **Reason codes.**
   - `blocked` (a Job 3 return only): the "Traced road network" or "Census second pass" item is unchecked. Leave the
     item unchecked with the note and take the next unchecked item. This is the explicit rule for these items, not the
     "another workflow holds the file" escape. Every other refused prerequisite (Jobs 2, 3 and 4) is a thrown Error
     (item 2); handle it the same way.
   - `infra`: a sandbox, browser or CDN failure. In Jobs 1, 2 and 4 cut no release and note it; the next run retries.
     In Job 3, an `infra` result after other units of the batch were built still commits those units in a patch
     release using the returned `changelog_line` (the next run's ledger already counts them as done).
   - `gate-fail` and `units-failed` (Job 3): leave the box unchecked with the note.
   - `smoke-fail` (Job 3): a run that built units but ran no gate, and whose smoke showed console errors or clock hits
     in the FILIGREE block. Leave the box unchecked with the `polish_note`.
   - `nothing to build` (Job 3): a no-op; no release. In an unforced full run it also returns `check_off: true` when
     `gates/3-build.json` is already pass (item 3).
   - `plan` and `preview`: not polish results (plan mode; Job 4 preview). No release, no note, no box.
   - `already passed: …` (Job 1, with `pass:true`): the gate was already pass on a bible that still re-hashes, so nothing
     was re-run. Check the box as for any pass.
   - `forced: <reason>` (Jobs 2 and 4): the gate ran forced and can never pass. A forced Job 3 run keeps the Job 3
     reasons and carries `forced_by` in its gate record; Job 1 rejects `force`.
   - Comma-joined criterion ids: the gate failed on those criteria; leave the box unchecked. Jobs 1 and 2 join with `,`
     and no space (`G1.4`, `G2.5,G2.6`); Job 4 joins with `, `.
   - `mask-leak`: the hand-test mask failed. That is a capture fault and produces no fix units.
   - `record-mismatch`: the recorder's read-back disagreed. Per job:
     - Job 3 returns `gate`, `final_gate` and `state`. Write each as 2-space-indent JSON plus a trailing newline, then
       re-read it and `JSON.parse` it: `gate` to `gate_path` (always `gates/3-build-<slice>.json`), `final_gate` to
       `gates/3-build.json` (slice D) and `state` to `state/3-build.json`.
     - Job 4 returns `gate`: write it to `gate_path` the same way. `state/4-review.json` is not returned. Its
       `polish_note` and `changelog_line` say `record-mismatch` and the box stays unchecked.
     - Job 1 returns only the gate. `1-hex-answers.json` and `state/1-research.json` are not recoverable from the
       return, so after writing the gate a `resume:true` run does not rebuild them: with `gates/1-research.json` pass and
       the bible re-hashing it returns `pass:true` without re-running, and if the ledger or the hex-answers file is
       missing it returns `record-incomplete: …`. To redo Job 1 delete `gates/1-research.json` or pass `resume:false`.
     - Job 2 returns **no** gate, so `gates/2-plan.json`, `gates/views.json` and `state/2-plan.json` cannot be written
       from the return. Re-run with `resume:true` (§2): sections and probes resume when their stamps still match.
   - `record-incomplete: …` (Job 1): see `record-mismatch` above.
   - `agent died: <label>`: a critical agent returned nothing. Treat it as `infra` (cut no release, retry next run).
   - `blocked` is a Job 3 reason only.
7. **Releases.** Every run cuts a patch release under the "Versioning & release workflow" of `.claude/CLAUDE.md` and the queue protocol at the top of `POLISH.md`
   (`X.Y.Z-alpha.N` bump, `VERSION` + `CHANGELOG.md`, one release commit, tag, push at the cut). Docs-only runs (Jobs 1,
   2 and 4 without fixes) use a `docs:` CHANGELOG line (R15). The release commit holds everything the run produced:
   `docs/filigree/**` (minus the git-ignored bulk shots), `tools/filigree-dem.js` and any other new tool or app file,
   plus the `CHANGELOG.md` and `VERSION` bump.
8. **Git.** Agents never run git and never edit POLISH, CHANGELOG, VERSION or `.claude/`. The polish run commits.
9. **The table map ships off.** It sits behind a default-off toggle (`filigree=1` + a layers-panel row) until Job 4
   passes. Then the owner flips the default (R18).

## 2. Invocation

| Situation | Call |
|---|---|
| Fresh session (the registry loads `.claude/workflows/` at session start; the files must be committed and in the checkout) | `Workflow({name:'filigree-1-research', args:{date:'<today>'}})`, and likewise `filigree-2-plan`, `filigree-3-build`, `filigree-4-review`. Any session model can orchestrate: the script chooses every agent's model itself |
| The session that created or edited the files, or a name that does not resolve | `Workflow({scriptPath:'/home/user/annals-kingdom/.claude/workflows/filigree-1-research.js', args:{date:'<today>'}})` (absolute path) |
| The `Workflow` tool is not available in the session | Stop. Return `reason:'infra'` with the note "Workflow tool unavailable"; cut no release; the next run retries |
| Preview the cost first (optional; preflight only; returns the per-phase agent schedule) | `args:{date, mode:'plan'}` |
| Resume a killed run in the same session | `Workflow({scriptPath, resumeFromRunId})`. The unchanged prefix is cached, and prompts embed no run-varying value except `date` |
| Resume across sessions | Re-run with `resume:true` (the default). What each job reuses is listed below |

Cross-session resume, per job:
- **Job 1** skips the questions listed in `state/1-research.json` whose evidence file still re-hashes. That ledger holds
  only questions whose verify lenses all returned: a question with a dead lens is left out of it (and dropped from
  `seen_questions`), so a resume re-runs it. A tool question (q09) also needs the preflight DEM probe to pass: if
  `tools/filigree-dem.js` is missing, nondeterministic or misses a literal, q09 re-runs and rewrites it even when
  `research/q09.json` re-hashes. The ledger is written **only in the Record phase**. A run that aborts earlier (every
  `agent died: …`, a killed session) leaves none, so the next cross-session run re-researches all 18 questions (a full
  research pass; only the frozen hex fixtures survive). The cheap retry after a kill is `resumeFromRunId` in the same
  session. When the gate already passed on a bible that re-hashes, a rerun returns `pass:true` without re-running (§1.6).
- **Job 2** resumes after any exit that follows the Sections phase. Sections are rewritten when the bible sha, the
  rulings or the ground picks changed, or when the ledger lacks their stored fragments. The probes resume only while
  `gates/2-probes.json` is frozen, its sha matches the ledger, and its `bible_sha256` and `rulings` stamp match the
  current bible and rulings. `resume:false` regenerates them (§4).
- **Job 3** resumes per unit from `state/3-build/`. Slice gates and done units are invalidated when `sheet-spec.json`
  changes: a gate recorded under another spec sha counts as not passed, and a done unit stamped with another
  `spec_sha256` is re-queued. Records written before the stamp existed are kept.
- **Job 4** is one cycle per run.

`date` is required because scripts cannot read the clock. It is **today's date as `YYYY-MM-DD`, read from the session
environment** (the "Today's date" line / `date +%F`), not an example value. It is stamped into every artifact.

**Plan mode** is optional and is *not* a polish result: it cuts no release, writes no note, and never checks a box. It runs the
real preflight, but a missing input does not behave the same way in every job:
- Job 1 fails exactly as a full run does (`missing inputs`, `anchor lost`).
- Jobs 2 and 3 only report an unsatisfied gate chain. The gate chain and Job 3 prerequisites are reported in the plan
  result (`chain_ok`; for Job 3 also `blocked_by` and `spec_gap`, which the `polish_note` names), not enforced, and the
  schedule is still returned. Plan mode never returns `reason:'blocked'`. With slices A–D and `gates/3-build.json` all
  passed, Job 3 returns `reason:'plan'` with `nothing_to_build:true` and an empty schedule.
- Job 4 throws `missing inputs: …` until Job 3 and every earlier job have written their files (`gates/views.json`,
  `gates/hexes.json`, `gates/1-hex-answers.json`, `density-bible.json`, `sheet-spec.json`). An unfinished
  `gates/3-build.json` is only reported.

So a plan preview of Jobs 2 to 4 is meaningful only after the previous job has run. The `schedule` is for your
decision: compare the returned bound (`agents_bound` for Jobs 1 and 3; `bound` and `agents_max` for Jobs 2 and 4) with
the job's figure: Job 1 ≈ 224 agents (including `crit()` retries), Job 2 ≈ 120, Job 3 at `maxUnits:8` and `maxRounds:2`
276 for slices B and D (the hand-test slices) and 228 for A and C (its `polish_note` prints the computed figure), Job 4 ≈ 260. These are worst cases at default
args, so the check fires only if you raised an arg or the script grew; if it does, stop and note it instead of
running. Typical costs are in §11.

## 3. Args

**Shared** (validated in the prelude; any violation throws `Error('<job>: …')`):

| arg | default | rule |
|---|---|---|
| `date` | **required** | a string in `YYYY-MM-DD` form naming a real calendar day; an array, month 13, or Feb 29 in a non-leap year is rejected |
| `repo` | `/home/user/annals-kingdom` | a normalized absolute path made only of `[A-Za-z0-9_/.+-]`; spaces, quotes, `;`, `$` and newlines are rejected so the path can sit in shell commands unquoted |
| `outDir` | `docs/filigree` | Outputs go here. The same character set as `repo` applies and an empty string is rejected (leave it out for the default). `full` mode requires it to be `docs/filigree` or a subdirectory of it (no `.`/`..` segments); `smoke` requires an absolute path outside the repo. Static inputs (dossier, todo-inputs, rulings.json) always come from `<repo>/docs/filigree` |
| `mode` | `full` | `full` \| `smoke` \| `plan` |
| `maxRounds` | 2 | integer 0..2; bounds every fix or follow-up loop (the agent bounds in §11 assume 2) |
| `rulings` | `{}` | a plain object; keys ⊆ R1…R22, values are non-empty strings; override `rulings.json`, which overrides the embedded defaults |
| `resume` | true | boolean; cross-session resume (above) |
| `force` | unset | Jobs 2–4 only: a non-empty reason **string**; the gate can then never pass. `false`, `0`, `true` and other non-strings are rejected (leave it out for an unforced run); Job 1 rejects any `force` |

`mode` values:
- **`smoke`** forces every agent to haiku/low, truncates every fan-out to 1 item, and reports thresholds and the gate
  chain without enforcing them. In Job 1 the one researched question is the tool question q09 (unless resumed), so
  smoke writes the DEM probe and exercises the appliers, the resolver and the scoring on F01. It **requires an absolute
  `outDir` outside the repo**. In Job 3 the implementers write diffs to `<outDir>/dry/` and edit nothing.
- **`plan`** runs preflight only.

Unknown keys are rejected (`checkArgs`), so a typo such as `maxround` dies instead of being ignored.

**Per job:**

| job | arg | default | rule |
|---|---|---|---|
| 2 | `ground` | — | `{coast, river_town, city}` strings; skips the Pick phase |
| 3 | `maxUnits` | 8 | 1..20 |
| 3 | `units` | — | unit ids; each must be in the current slice and ready |
| 3 | `slice` | first slice whose gate has not passed | `A`..`D`; refused if an earlier slice has not passed |
| 3 | `gate` | `auto` | `auto` (gate when the slice is complete) \| `skip` \| `only` |
| 3 | `overridePrereqs` | false | lets slice **A only** run before the road network and census items are checked (R11) |
| 3 | `unstick` | — | unit ids (strings) whose `runs_failed` is reset to 0 for this run: use it after fixing a stuck unit by hand (§12) |
| 3 | `discard` | — | `fix-<slice><n>` ids; each ledger file is marked `discarded` (an obsolete fix unit) |
| 3, 4 | `port` | 8544 | `server.js` listens on 8544 only; any other port must be a server you started |
| 4 | `preview` | false | review a partial build; findings only, `pass` is forced false. Writes only under `docs/filigree/preview/` (see §4); it never overwrites the durable punch list, findings, gates or state, and never prunes older cycles' `shots/` |
| 4 | `cycle` | 1 + count of non-preview `gates/4-review-c*.json` (preview gates live in `preview/gates/` and are never counted) | 1..2; a third cycle is refused (R16). With an explicit `cycle`, the prior ids come from the `c<cycle-1>` gate, and a run whose `c<cycle>` gate already exists is refused unless `force` is set (preview is exempt) |

## 4. Outputs

```
docs/filigree/
  README.md                 this guide
  research-dossier.md       verified research pass (2026-10-04; anchors drift, re-anchor by pattern)
  todo-inputs.json          structured inputs from that pass
  rulings.json              owner overrides of R1..R22 (empty = defaults); optional for Job 1 (absent = {}); shape {"date":"…","about":"…" (optional),"overrides":{},"confirmed":[]}
  design/                   the committed design docs: workflow-1-research.md … workflow-4-review.md, polish-entries.md
  research/q01..q18.json    Job 1: one evidence file per research question (+ f<r><n>.json follow-ups; r is numbered on
                            from the highest follow-up round in state/1-research.json, so follow-up qids never repeat across runs)
  density-bible.{md,json}   Job 1: the density bible
  spec/s01..s12.md          Job 2: section drafts;  spec/assets/sheet-one-base.{jpg,json}
  sheet-spec.{md,json}      Job 2: the sheet spec (+ units, slices, contracts)
  cold/{A,B}/sheet-one.{svg,png}   Job 2: the two cold drafts on the first pass; cold/{A,B}-r<k>/ in fix round k
                            (each drafter empties its own directory first)
  names-for-owner.md        Job 3: every invented name, for veto (R9)
  state/                    ledgers: 1-research.json, 2-plan.json, 3-build.json, 3-build/<unit>.json, 4-review.json
  shots/                    Job 3 smoke/gate/hand captures (git-ignored bulk; the shots pruner keeps the last two runs; <=300 KB per image).
                            Job 3 gate-record artifact paths under shots/ (e.g. gate-<S>-<date>/metrics.json) are non-durable:
                            they will not exist in a fresh checkout, so the recorded sha256 is the only durable evidence
  review-c<k>/              Job 4 capture: metrics.json + cited/ (tracked); shots/ (git-ignored bulk)
  findings/                 Job 4: <lens>-c<k>-r<n>.json
  punch-list.{md,json}      Job 4: the punch list
  preview/                  Job 4 with preview:true: a scratch area holding punch-list.{md,json}, findings/, review-c<k>/,
                            gates/4-review-c<k>.json and state/4-review.json. Never committed. The current .gitignore pattern
                            docs/filigree/review-c*/shots/ does not cover it: add docs/filigree/preview/ to .gitignore or
                            delete the directory after the review
  gates/
    hexes.json, hex/F01..F12.jpg     Job 1 fixtures (frozen)
    1-research.json, 1-hex-answers.json
    2-probes.json (frozen), views.json, 2-plan.json
    3-handtest-questions.json (frozen), 3-build-{A,B,C,D}.json, 3-build.json
    3-handtest-questions.staged.json   Job 3: transient, next to the frozen questions (see below)
    4-review-c<k>.json
tools/filigree-dem.js       Job 1: read-only EPESHU_HF probe (--at x,y | --bbox x0,y0,x1,y1); cell-centre rule in §7
tools/filigree-capture.js   Job 3 unit U01: the one committed capture harness
tools/filigree-handq.js     Job 3: hand-test question computer (deterministic); takes --out <path>
tools/filigree-*.js, tools/mint-names.js, maps-site/data/filigree-*.json, rivers.json, relief bake   Job 3 units
```

Shared files (`gates/*`, `state/*.json`) are written by the single `record()` agent, which writes the
script-computed object verbatim and reads it back, with five exceptions that produce the content themselves and
carry their own read-back (`sha256` + `parsed`): the hex cropper (`gates/hexes.json`), the probe writer
(`gates/2-probes.json`), the question writer, the unit recorders and the diagnoser (`state/3-build/*.json`). The
question writer runs `tools/filigree-handq.js --out` against `gates/3-handtest-questions.staged.json`, so its own
read-back covers the **staged** file; a mech publish step then moves it onto `gates/3-handtest-questions.json` only
after the script has validated it. Every other agent writes only the files it owns. The recorder's read-back is checked
on `pass` and the criteria count; Job 1's three records (gate, hex answers, ledger) also return a canonical-JSON length
and the length of every top-level array, and the script compares that digest too, so a truncated or altered copy is caught.

**Frozen files.**
- `gates/hexes.json`, `gates/hex/*.jpg` and `gates/3-handtest-questions.json` are **frozen** once written: a rerun
  skips them and never regenerates them. A Job 1 rerun whose fixtures changed dies with `fixtures changed; delete
  gates/hex* to re-crop` instead of silently reusing the old crops.
- A frozen `gates/3-handtest-questions.json` that fails validation makes Job 3 return `agent died: question reader
  (invalid frozen set …)`. Delete the file by hand to re-freeze.
- `gates/3-handtest-questions.staged.json` is transient. It is left behind only when the writer's set fails validation,
  and the next writer run overwrites it.
- `gates/2-probes.json` is frozen **only while `resume:true`**. `resume:false` regenerates it, and the gate then records
  `probes_written_after_spec` when a spec already existed. If a frozen file is invalid or stale, the script's own error
  says to delete it and rerun with `resume:false`; that is the one sanctioned deletion (§12).

**Job 2 file shapes.**
- `gates/2-probes.json` is `{date, frozen, bible_sha256, rulings, probes}`. A probe may carry an optional `options`
  field (the closed answer tokens for `enum` and `order` kinds); the drafters see `{id, q, kind, options}`. A probe file
  without the `bible_sha256`/`rulings` stamp is stale in full mode: delete it and regenerate.
- `state/2-plan.json` is `{job, date, sections:[{sid, path, sha256, rules, fragment, anchors, open}], probes_sha256,
  bible_sha256, picks, rulings_used, spec}`. An interim write after the Sections phase has empty `spec` shas.

## 5. Gates

Each gate record is `{job, date, mode, pass, forced_by, criteria:[{id, desc, measured, threshold, pass}], rounds,
artifacts:[{path, sha256}], rulings_used, gaps}`. `pass` = every criterion passes, in `full` mode, unforced.

**Fixed sample sets** (R17: one hex = one z7 tile = 32 atlas px; cell (cx,cy) covers [32cx, 32cx+32) × [32cy, 32cy+32)).
Each cell was checked on the print and in the `EPESHU_HF` decode. The DEM column follows the cell-centre rule (§7): it
is the range over the DEM cells whose centre lies in the hex, rounded to whole metres except where a decimal matters:

| id | cell | DEM h (m) | role |
|---|---|---|---|
| F01 | 51,50 | 252.72..328.19 | summit: window maximum 328.19 m in DEM cell 565,349 (centre 1649.06, 1604.06) |
| F02 | 43,49 | 136..151 | open plateau, blank on the print |
| F03 | 41,47 | 126..135 | open, inside printed PĒSHUNOR lettering |
| F04 | 43,51 | 151..162 | open, DRANIMOS lettering, solid river at the edge |
| F05 | 42,45 | 44..131 | inland strip under the north-coast dotted road |
| F06 | 48,47 | −41..88 | coast + dotted road, Kanae–Rhup |
| F07 | 40,43 | −21..24 | Paerāndas islets |
| F08 | 50,43 | −46..−43 | open sea (control) |
| F09 | 45,47 | 137..142 | Aldorūs, the river town |
| F10 | 38,44 | −15..98.5 | Epēshu ◉, the painted city |
| F11 | 35,44 | −42..65 | Lepon the Old ruin coast (old-survey control) |
| F12 | 83,6 | no DEM | by the Mountain Wall marker (2676,206): no-DEM control |

Further fixed regions and views (all coordinates are atlas px):

| Item | Definition |
|---|---|
| DEM window | [1060,1240]..[1860,2040] |
| Sheet one | the region sheet over the Pēshunor north coast, bbox x1216–1760, y1376–1664 (R8) |
| Coast walk bands | W x1216–1400 · M x1400–1580 · E x1580–1760 |
| City quarter Q1 | Epēshu chart px [256,2304)×[1280,3328), which is chart z3 tiles x1..8, y5..12 |

**Views** are frozen in `gates/views.json` by Job 2, with zoom = the midpoint of the sheet's band. This is enforced by
G2.13 before the gate can pass:

| View | Sheet | Center | Mask |
|---|---|---|---|
| V1 | country | 1488,1520 | — |
| V2 | region | Aldorūs | Aldorūs |
| V3 | valley | Aldorūs | Aldorūs |
| V4 | region | Sokundo 1477.7,1444.2 | Sokundo |
| V5 | valley | 1392,1584 | — |
| V6 | city | Epēshu | — |
| V7 | one-question plate "Where can we go this week?" | Aldorūs | — |

Hashes are `#view=x,y,z&filigree=1&…`. Today the moveend writer, guarded by `!/^#view=/.test(location.hash)`, drops
trailing params; unit U00 fixes that. Masks are an opaque disc of `max(96, 1.5×footprint)` over the settlement plus
r=48 discs over every other anchor in view.

**Job 1 · blank-hex gate** (`gates/1-research.json`). Two blind appliers (sonnet/high, opus/high) may read only the bible (`density-bible.{md,json}`), `gates/hexes.json`, the crops (`gates/hex/`),
`tools/filigree-dem.js`, `maps-site/data/` (for `data:` refs) and greps of `index.html` and `maps-site/index.html`
(for `sim:` refs). For every hex they classify the ground and name six bible classes,
each as an *instance* with a source ref (`dem:` `data:` `print:` `mint:` `sim:`). A mechanical resolver checks that
each ref resolves inside the hex, and also that the source sits where the instance does:
- a `dem` ref's x,y equals the instance within 1 px;
- a `data` entry's own point or line lies in the hex ±16 px (`chart-pois` counts at its city anchor; an entry without
  coordinates fails);
- a `print` pixel lies within 2 atlas px of the instance.

The research side works from a trusted evidence list: the integrator, critic and patcher read only the resumed
questions' files plus this run's research files, not every `research/*.json`; stale files are ignored. The
`second-look` verify lens is a partly independent re-read: it sees the claim text without its evidence refs and must
write its own reading first.

| id | criterion |
|---|---|
| G1.1 | bible valid: the validator's `ok`, no failures, and its sha256 of both bible files equals the integrator's or patcher's (the gate's artifacts record the validator's shas). The validator's forbidden coverage is three checks, defined by `forbidden_on`: `country.forbidden` (homestead classes list `country` there), `region.forbidden` (a homestead-forbidding rule; homestead classes list `region` there too, so the exclusion is not enforced on the country sheet alone; brief p8) and `city.forbidden` (block classes list `city`). Validator failures name the rule that failed. A dead validator fails G1.1, G1.2 and G1.8 |
| G1.2 | checklist 27/27 (19 brief items + 8 v2 items), scored from the validator's read of `density-bible.json`; the integrator's self-report only cross-checks |
| G1.3 | both appliers valid on 12/12, same ground class |
| G1.4 | class agreement ≥5/6 on ≥10/12 and ≥4/6 on all |
| G1.5 | ≥5/6 instances resolve per applier per hex, ≥90% overall. Only F08 (open sea) and F12 (no DEM) may be exempt; an exemption on any other hex makes that applier invalid (G1.3) and the hex is still scored. When nothing is scored, overall is 0%, not 100% |
| G1.6 | zero `bible_silent` |
| G1.7 | zero banned vocabulary outside `## Provenance`/`## Renames` |
| G1.8 | no struck claim cited, scored from the validator's read of `rules[].cites`; a struck cite the integrator self-reports also fails |
| G1.9 | blind compliance |
| G1.10 | ≥75% coverage (resumed questions count as kept) |
| G1.11 | the DEM probe is deterministic and matches the verified literals: `--at 1649,1604` → 328.19 ±0.1; `--at 1449,1528` → 139.31 ±0.5; `--bbox` F08 → hmax < 0; `--bbox` F01 → hmin 252.72 ±1, hmax 328.19 ±1. The preflight runs the probe too |

The follow-up loop (at most 2 rounds) numbers its qids on from earlier runs; a G1.11 failure in the run adds an
`f<r>1` probe-rewrite question. A round with zero fresh questions still runs a patch-only round (patcher, validator/vocab check, re-gate), so
every follow-up round patches.

**Job 2 · cold-cartographer gate** (`gates/2-plan.json`). The 30–40 probes in `gates/2-probes.json` are frozen
**before** the spec exists:
- *fixed* probes carry an answer from the bible, brief or rulings;
- *spec* probes freeze only the question and a JSON pointer, and their answer is read from the integrated spec.

Two drafters (sonnet/high, opus/high) may read only `sheet-spec.{md,json}` + base crops. A haiku extractor reads their
SVGs mechanically. A haiku spec reader, instructed to use a node script, reads `units`, `slices`, `slice_classes`,
`rules`, `bands` and the view seeds back from `sheet-spec.json`; the gate scores that read-back, never the unit
planner's or fixer's return. A fix round is skipped when `budget.remaining()` is below 600000 tokens (it was never
skipped before); the gate then fails on its own criteria.

| id | criterion |
|---|---|
| G2.0 | Job 1 passed and the bible is unchanged |
| G2.1 | traceability (bible must → spec rule → unit), DAG, machine-checkable acceptance, ≤9 units per slice, mandatory U00 hook/toggle and U01 capture. Checked against the `units`/`slices`/`slice_classes`/`rules` the spec reader reads back from `sheet-spec.json`, not the unit planner's return. It also fails on `ground_six unavailable` (preflight gave no ground-six classes while the bible has classes). It also fails when `sheet-spec.json` `/checks/<S>` is missing or empty, or holds a check with a blank `id`/`cmd`/`expect`, for any slice A–D (read back by the spec reader; each failure names the slice; fixable by the spec fixer via `checks_missing`), so Job 3's "no /checks for slice X" refusal is normally caught here. Section rule-format failures still fail G2.1 but start no fix rounds: the failing section is left out of `state/2-plan.json` and rewritten on the resume rerun |
| G2.2 | anchors resolve |
| G2.3 | no post/plate/Swiss name outside `## Provenance` |
| G2.4 | no spec-probe pointer is null |
| G2.5 | each drafter ≥90% of probes |
| G2.6 | both drafts: layer order = paint order, all must classes, no forbidden class (`/sheets/region/forbidden` plus the homestead classes: `SHEET_ONE_FORBIDDEN = ['homesteads']` and any class containing `homestead`; the global paint order still lists homesteads for the valley sheet), palette hexes only (the allowed colours are `/palette/*/day` plus the wash fills under `/paint/wash_hex/*`), exactly one shield at the river town, every must-label name |
| G2.7 | zero schema-path gap guesses, and the guess auditor returned a verdict for every guess each drafter listed. Missing verdicts fail G2.7 (`measured.auditor_incomplete`) and are recorded in `gaps` as `guess not audited` |
| G2.8 | zero blocking divergences (one with a near-miss or empty `spec_rule` counts as blocking, never discarded). The divergence judge runs only after the rasterizer lists both PNGs and a mechanical png-stat agent confirms both are non-empty on disk; otherwise G2.8 fails as `not run` |
| G2.9 | red-team contradictions resolved |
| G2.10 | canon/voice clean. The old Tithe names are allowed only in the `.md` `## Renames` section and in the R10 rename unit's JSON title, covers and acceptance commands |
| G2.11 | blind compliance |
| G2.12 | coverage |
| G2.13 | gate views: `/fixtures/views` = the V1–V7 seeds (sheet, centre, mask), each zoom = the midpoint of its sheet's band (fixable). Also fails when `/sheet_one/layers` or `/sheets/region/must` lists a homestead class, and on vacuous spec-reader output (empty `must`/`palette`/`layers`/`labels`/`rules`) |
| G2.14 | artifact hashes recorded: a 64-hex sha256 for `sheet-spec.md`, `sheet-spec.json`, `density-bible.json` and `gates/2-probes.json` |

**Job 3 · slice gates + hand test** (`gates/3-build-<S>.json`, final `gates/3-build.json`). All measurements come from
`tools/filigree-capture.js` through `ATLAS.filigree.count/names`. Those count only features with pane opacity > 0.5
that intersect the viewport.

| Slice | Gate |
|---|---|
| A (G3.A1–A7) | units done; generators byte-identical; zero `CLOCK_GREP` hits in the FILIGREE block; ground classes on F01–F11 ≥ bible minima; spec checks `A.rivers_overlap` (`rivers.json` ≥90% within 3 px of print ink), `A.imhof_F01` (NW-lit > SE-shaded on F01) and `A.coast_edge_V4` (pooled coast edge); toggle off = zero filigree features and the pre-filigree pane set; zero console errors; pane z-order (A7) |
| B (G3.B1–B8 + leak) | the same, for ink classes, plus the **hand test** and the B checks `B.one_shield` (one shield, at Aldorūs), `B.names_for_owner` (names-for-owner complete) and `B.gazetteer_prov` (gazetteer regenerated); pane z-order (B8) |
| C (G3.C1–C9) | city at rest: 0 pins, 0 block labels, street names only above the threshold, labels ≤ cap; fog opacity > 0, identical on the same day and different on another day; pooled edge band darker than the interior by the spec delta; pane z-order (C9) |
| D (final; G3.D1–D11 + leak) | all of A–C re-measured; stack pull (0 base-tile requests, base node identity kept, no reload, hash round-trip, moveend keeps params); ≥10/12 fixtures 6/6, none <4; hand test re-run; zero appear violations; sheet rules on V1–V6 (G3.D10): no `/sheets/<sheet>/forbidden` class drawn, every must class drawn, and the V1 country sheet has exactly one shield, at the river town, and zero homestead features; pane z-order (D11) |

Notes on the slice gates:
- The named spec-check ids above must exist in `sheet-spec.json` `/checks` (Job 2 emits them). A missing id, or a slice with
  no checks, is recorded as `measured {spec_gap: …}`: it never starts a fix round and is never passed to the diagnoser;
  it appears in `gaps` as `<id>: no /checks for slice …`. Failing and ok check ids in gate records are slice-qualified
  (for example `A:A.rivers_overlap`).
- The capture metrics now include `panes`, and the pane z-order criterion is a subsequence test against the spec's
  `/paint_order`. Paint order is therefore gated on the built map's pane stacking, not only a build-schedule tie-break.
- Within a gate cycle, determinism + syntax runs first and alone (the generators rewrite the data files the capture reads),
  then capture and the spec checks run in parallel. The gate capture agent is the only one that starts the server.

How the hand test works:
- `tools/filigree-handq.js` computes ≥8 questions per view (V2, V3, V4) from the baked data **before any screenshot**.
  Question ids are `<V>-T<n>-<k>`, unique across views, with one answer per id. The T1 question asks for names only (not
  heights). The blind navigators are not told the repo root.
- The tool writes `gates/3-handtest-questions.staged.json`; the script moves it onto the frozen
  `gates/3-handtest-questions.json` only after validating it: ≥8 per view, unique ids, well-formed answers, valid kinds
  (one writer retry). An invalid set is an `agent died` result, never a map defect, so it spends no fix rounds.
- Two navigators (sonnet/high, opus/high) see only the masked screenshot.

Pass needs all of the following:
- each navigator scores ≥80% (a `names` answer scores by Jaccard ≥ 0.5, precision and recall together, not recall alone);
- landform-label recall ≥70%;
- ≥6 named heights outside the mask. The hand-capture agent counts the height numerals (bare integers and
  `<name> <integer>` entries) in `visible_landform_labels_outside_mask`; if that list holds names only, it counts the
  outside names that have a bare-integer label within 40 px, and the script caps the value at the length of the
  outside list. Heights inside the mask never count;
- the blind check is clean.

If a navigator names the covered town, the mask leaked. The view is re-captured once at mask scale 1.5. A second leak
fails with `mask-leak` (a capture fault).

**Job 4 · angry-sparse gate** (`gates/4-review-c<k>.json`). Sparse is the same view with the toggle off.

| id | criterion |
|---|---|
| G4.1 | zero surviving blocker/major (each finding reproduced, not refuted, severity-rated) |
| G4.2 | on each open view V2–V5, ≥2 of 3 blind judges (opus/sonnet/opus, A/B order fixed by index parity) prefer dense and each lists ≥3 omissions that are named dense and absent sparse in the DOM |
| G4.3 | dense counts ≥ the bible's per-view targets; sparse names ≤ dense/3 |
| G4.4 | fixtures ≥10/12 6/6, none <4 |
| G4.5 | zero surviving read-aloud findings (including any re-reported prior item first raised by F04), and the F04 finder ran: a dead F04 finder fails G4.5 |
| G4.6 | stack pull clean |
| G4.7 | zero appear violations |
| G4.8 | blind compliance |
| G4.9 | coverage, including a `lenses run in round 0` row: any finder that died in round 0 fails G4.9, because a dead lens is a missing brief check, not "no findings" |
| G4.10 | sheet rules on V1–V6 (dense): no `/sheets/<sheet>/forbidden` class drawn and every must class drawn; on V1 (the country sheet, captured and scored) exactly one shield, at the river town, and zero homestead-class features |

Notes on a review cycle:
- **Finders.** At most 2 findings per lens in round 0 and 1 per re-run lens later (the finder schema's `maxItems` plus a
  per-round slice). Fresh findings beyond the 260-agent bound or the token budget are left unverified, recorded as a gap,
  and end the loop. The optional `+Nk` token budget is honoured at about 30k tokens per agent.
- **Capture.** The capture agent returns only `{metrics_path, shots_dir, metrics_sha256, infra_error}`. A separate mech
  metrics reader runs a fixed embedded node script over `metrics.json` and returns those fields plus a sha256 and a
  digest, which the script checks. A digest mismatch gets one retry, then `agent died: metrics reader`; a sha mismatch
  with the capture is `infra`. Missing metrics are null and fail their criterion.
- **Evidence.** A shot reference is `<absolute image path>#x,y,w,h`; shot punch items whose reference names no image
  are recorded in the gate's `gaps`. A `cmd` evidence that writes to the repo (the F07 generators run twice, for one)
  runs in a temp copy of the repo (tar without `.git` into `mktemp -d`), never in the repo itself.
- **Prior items.** A prior punch id counts as fixed only when its lens actually re-checked it. The gate
  `gates/4-review-c<k>.json` gains `not_rechecked` and `dead_lenses`; `fixed_since` lists only re-checked ids; `punch_ids`
  also lists the prior ids that were not re-checked, so they carry into the next cycle. `punch-list.json` items gain
  `prior_lens`. In `punch-list.md` the "Fixed since cycle N" section gains a "Not re-checked" sub-list, and "Where we
  flinched" selects items whose `lens` or `prior_lens` is F05. A grouped minor-insert item is therefore not done when
  its owning lens died: its ids show as not re-checked.

**Blindness is prompt-enforced.** Blind agents list the files they opened, and the script rejects forbidden reads.
That is a check, not a guarantee. The real defences are:
- answers are scored against data in code;
- questions and probes are frozen before the thing they test exists;
- every paired actor runs on a different model.

## 6. Model/effort pairing

This table is the pairing policy. It supersedes any earlier generic pairing table (the stage-workflows draft this
plan started from); deviations in the job designs are judged against *this* table, and each one below names its reason.

| Kind of step | model/effort | Used for |
|---|---|---|
| Mechanical: exists, hash, grep, count, crop, run a committed tool, syntax gate, SVG extraction, ref resolver, recorder, determinism double-run | **haiku/low** | preflights, croppers, extractors, resolvers, recounts, recorders, spec readers |
| Small rule-bound edit or triage | **sonnet/low** | anchor/spec fixers, severity verifier |
| Targeted audit, one bounded question, data/CSS/copy edits, Playwright smoke/capture/acceptance, most review lenses, reproduce-verifier | **sonnet/medium** | |
| Vision walks (plates, print crops, screenshots), tool/raster pipelines, the "A" member of every paired blind test | **sonnet/high** | |
| Interpretation, refuters, critics, judges, pickers, unit planner, patchers, logic edits in `maps-site/index.html`, the "B" member of every paired blind test | **opus/high** | |
| The one final integrator per job | **opus/xhigh** | density bible (J1), sheet spec (J2), punch list (J4); Job 3 has none |

**Independence rule:** every paired blind test (appliers, drafters, navigators) runs on different models with identical
prompts. The Job 4 sparse-judge panel is a majority-of-three (opus/sonnet/opus): J1 differs from J0 and J2 by model,
and J2 differs from J0 by sheet order (J0 sees the opposite order to J1 and J2). No actor sees the other's output or
the builder's self-assessment.

**Role → pair** (the script's `PAIR`; every `M(role)` call uses one of these):

| role | model/effort | typical use |
|---|---|---|
| `mech` | haiku/low | exists, hash, grep, count, crop, recorders, readers, extractors, resolvers, q12 data counts (recount lens) |
| `triage` | sonnet/low | anchor/spec fixers, severity verifier |
| `audit` | sonnet/medium | bounded audits, data/CSS/copy edits, acceptance runs, Playwright capture/rasterize, review lenses, reproduce verifier, code reading (q11, q13, q17) |
| `deep` | sonnet/high | vision walks, tool/raster pipelines (incl. the hand-test question writer), the "A" blind member |
| `judge` | opus/high | interpretation, refuters, critics, pickers, unit planner, patchers, logic edits and logic fixers in `maps-site/index.html`, the "B" blind member |
| `integ` | opus/xhigh | the one final integrator per job |

**Deviations from the generic Kind-of-step table, with reasons:** Job 2 sections s01/s06/s11 are `deep`, not `judge`
(they translate tool output; anchors and probes catch errors); Job 3 logic fixers are `judge` (README: logic edits);
Job 1 q03 is a `second-look` lens (it reads images; opus refuters stay on the interpretive q04 and q15 only); Job 1 q17
is `audit` (it reads code to decide whether a data file is loaded).

Opus refuters are used only for interpretive claims. Mechanical questions get anchor/recount lenses, and vision
claims get a second look. That lens is only partly independent: it sees the claim text without its evidence refs and
must write its own reading first, but it is not fully blind.

## 7. Reuse map (what already exists; re-anchor by pattern, never by line number)

| need (brief) | reuse | pattern anchor |
|---|---|---|
| relief, contours, heights | `EPESHU_HF`: a 768² PNG, h = (R·256+G)/32 − 300 m. **Cell-centre rule:** cell (gx,gy) covers atlas [1060+gx·800/768, +800/768) × [1240+gy·800/768, +800/768) and its centre is at +0.5 (Aldorūs cell 373,276 has centre 1449.06,1528.02, h 139.31). `tools/filigree-dem.js --at x,y` returns the containing cell; `--bbox` takes the cells whose centre lies in the half-open box | `index.html`: `const EPESHU_HF_URI`, `name:'Aldorūs'`. Use the raw decode: `function genHydrology` carves the sim's `W.H` |
| sheets as zoom bands | reveal tiers A/B/C (thirds of `TIER_CEIL − fitZoom`) + tier D at z ≥ `Z_TIER_D` 7.5; `Z_OPEN_MAX` 8, `Z_STREET` 11.5 | `maps-site/index.html`: `var TIER_CEIL=`, `var Z_STREET=` |
| ink easing / appear effect | `worldOpacityUpdate`, `baseOpacity`/`overlayOpacity` ramps | `function worldOpacityUpdate` |
| old survey under the live sheet | era pyramids `tiles-imperial/`, `tiles-war/` via `makeBase`; the split in `prototypes/atlas-night.html` | `function setEra` (it swaps one base today and writes no hash) |
| one-question views | Contents plates `THEMES` (whole/realms/roads/company), `DEFAULT_ON` | `var THEMES=`, `var DEFAULT_ON=` |
| invented names | `NAME.place/peak/river` on `PATRINAIC_ROOTS/SUFS`; the repeat/seam rule; `tools/pgd2lexicon.js`; `tools/build-gazetteer.js` | `const NAME = `, `NAME.used.has(n)`, `const PATRINAIC_ROOTS` |
| seeded generation | `xmur3` → `mulberry32` | `function xmur3`, `function mulberry32` |
| painted city, pooled edges | `registerCityOverlay`, seeded `genCityCanvas`, `washMake` (print-hue wash), `sampleCityMask` (land/water mask) | the four `function` names |
| caravan halts, muster days | shipped POIs "The Beacon Post", "The Muster Ground"; sim `chron`, `W.banditCamps`, `W.dragon` | `The Beacon Post`, `The Muster Ground`, `W.dragon = ` |
| blazed paths | sim `W.roads` inside the window, through the transform | `index.html`: `W.roads.push` |
| fog | none: `W.weather` has no fog state (R13) | `W.weather = ` |
| test wait + views | `window.ATLAS.ready`; `#view=x,y,z` | `window.ATLAS=`, `function handleHash`, `!/^#view=/.test(location.hash)` |
| voice debt | "The Tithe-Yard" / "The Tithe-Barn" POIs and their `d:` description string containing `harvest-tithe` (renamed by a Job 3 unit to "The Tribute-Yard" / "The Tribute-Barn", with the description reworded to `harvest-tribute`, R10) | `The Tithe-Yard`, `The Tithe-Barn`, `harvest-tithe` (old); `The Tribute-Yard`, `The Tribute-Barn` (new) |

**The only new machinery:**
1. `tools/filigree-dem.js`
2. The FILIGREE block + `ATLAS.filigree` hook + default-off toggle + hash composition (U00)
3. `tools/filigree-capture.js` (U01)
4. A relief bake (hillshade with Imhof light from the upper left, 5 m contours, peaks)
5. `tools/mint-names.js` + a gazetteer source
6. `tools/filigree-handq.js`
7. Data files: `rivers.json`, `filigree-*.json`, a notices sample

Explicitly out of scope: a new tile pyramid, a de-lettered raster, and any sim change.

## 8. Smoke recipe

Run these from the repo root after any edit to a filigree script.

**(a) Parse** (the harness wraps the body in an async function; this compiles each *whole file* as one function body, so
a duplicate top-level declaration, such as a job-local `const M` colliding with the prelude's `M`, fails here):
```sh
node -e 'const fs=require("fs"),AF=Object.getPrototypeOf(async function(){}).constructor;
for(const f of process.argv.slice(1)){const s=fs.readFileSync(f,"utf8");
 if(!s.startsWith("export const meta = {"))throw new Error(f+": must start with export const meta = {");
 new AF("agent","parallel","pipeline","phase","log","args","budget","workflow",s.replace(/^export const meta/m,"const meta"));
 console.log("parse ok",f)}' .claude/workflows/filigree-*.js
```

**(b) Meta, phases and forbidden tokens.** This checks four things:
- `meta` is a pure literal and `meta.name` equals the file stem;
- every single-quoted `phase('…')` or `phase: '…'` is in `meta.phases`, and vice versa;
- there is no clock or random call syntax;
- there is no `require(` and no `import`.
```sh
node -e 'const fs=require("fs");
for(const f of process.argv.slice(1)){const s=fs.readFileSync(f,"utf8"),i=s.indexOf("\nconst JOB = ");
 const meta=new Function(s.slice(0,i).replace(/^export const meta/,"const meta")+";return meta")();
 const stem=f.split("/").pop().replace(/\.js$/,"");if(meta.name!==stem)throw new Error(f+": meta.name");
 const titles=new Set(meta.phases.map(p=>p.title)),used=new Set([...s.matchAll(/phase\(\x27([^\x27]+)\x27\)|phase: \x27([^\x27]+)\x27/g)].map(m=>m[1]||m[2]));
 for(const u of used)if(!titles.has(u))throw new Error(f+": phase not in meta: "+u);
 for(const t of titles)if(!used.has(t))throw new Error(f+": meta phase unused: "+t);
 if(/\b(Date\.now|Math\.random)\s*\(|new Date\s*\(\s*\)|\brequire\s*\(|^\s*import\s/m.test(s.slice(i)))throw new Error(f+": forbidden token");
 console.log("meta ok",stem)}' .claude/workflows/filigree-*.js
```

**(c) Prelude drift.** The text between `// ==== filigree prelude v1` and `// ==== end filigree prelude ====` must be
byte-identical in all four files. The per-file `const JOB = …` line sits above the marker.
```sh
node -e 'const fs=require("fs"),c=require("crypto"),h=new Set();
for(const f of process.argv.slice(1)){const s=fs.readFileSync(f,"utf8"),a=s.indexOf("// ==== filigree prelude v1"),b=s.indexOf("// ==== end filigree prelude ====");
 if(a<0||b<0)throw new Error(f+": prelude markers");h.add(c.createHash("sha256").update(s.slice(a,b)).digest("hex"))}
if(h.size!==1)throw new Error("prelude drift: "+h.size+" variants");console.log("prelude identical")' .claude/workflows/filigree-*.js
```

**(d) Plan mode** costs one haiku preflight agent per job:
`Workflow({name:'filigree-1-research', args:{date:'2026-10-05', mode:'plan'}})`. Expect a `schedule` and `pass:false`.
Only Job 1's preview is guaranteed to work in a fresh checkout. Jobs 2 and 3 report an unsatisfied gate chain
(`chain_ok:false`) and still return the schedule, and Job 4 throws `missing inputs` until Jobs 1–3 have written their
files (§2).

**(e) Plumbing chain.** Run jobs 1→4 in one scratch dir, never under `docs/`:
`Workflow({name:'filigree-1-research', args:{date, mode:'smoke', outDir:'<session scratchpad>/filigree-smoke'}})`,
then 2, 3 and 4 with the same `outDir`.
- Smoke mode uses haiku/low and one item per fan-out. In Job 1 that item is the tool question q09 (unless resumed), so
  smoke writes the DEM probe and exercises the appliers, the resolver and the scoring on F01.
- The gate chain is reported but not enforced.
- Job 3 writes only dry-run diffs.
- Delete the scratch dir afterwards.

**(f) App smoke in a sandbox** (CDNs are blocked; npm is not):
```sh
D=$(mktemp -d) && (cd $D && npm pack leaflet@1.9.4 three@0.128.0 >/dev/null &&
  mkdir leaflet three && tar xzf leaflet-1.9.4.tgz -C leaflet --strip-components=1 && tar xzf three-0.128.0.tgz -C three --strip-components=1)
node server.js &   # http://localhost:8544/ (sim) and /maps-site/ (atlas)
```
- Playwright comes from `NODE_PATH=/opt/node22/lib/node_modules`. If the bundled browser is not found, launch Chromium
  with `executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'`. Never run `playwright install`.
- Route `**/leaflet@1.9.4/dist/*` → `$D/leaflet/dist/<file>` and `**/three.js/r128/three.min.js` →
  `$D/three/build/three.min.js` via `page.route(…, r => r.fulfill({path}))`. unpkg serves the npm bytes, so the SRI
  hashes match.
- **Sim:** load `/?v=<int>#s=epeshu` and a procedural seed, wait for `window.ANNALS.ready`, then run
  `ANNALS.simDays(400)`.
- **Atlas:** load `/maps-site/?v=<int>` and wait for `window.ATLAS.ready`.
- The console must stay error-free.
- Once U01 exists, `tools/filigree-capture.js --cdn-dir $D` does all of this.

## 9. Owner rulings

These are the brief's internal conflicts and the open policy choices. Runs proceed on the defaults. To override:
- edit `docs/filigree/rulings.json` → `{"overrides":{"R7":"…"}}`, or
- pass `args.rulings`.

Every gate records `rulings_used`. The defaults live in each script's prelude (`RULINGS`).

**Confirm before Filigree 2:** R1, R5, R6, R7, R9, R18. These shape the spec most, and reversing them after Job 3
means rework.

| id | question | default |
|---|---|---|
| R1 | Brief (a): "peaks and heights always" (p5) vs ridge names held to the region sheet (p8) | principal peaks ▲ + canon ranges (Rhoshkhon, Sūs Gimīlīn, Aura-Hōth) on the country sheet; ridge names + heights from the region sheet down; never dropped, generalized or replaced by a pin once arrived |
| R2 | (b) "a shed-scale name in the same ink as a peak" vs label ranks | rank decides when, not how: one ink, one face family, ≤1 size step |
| R3 | (c) the named palette vs "the real colours of the land" | palette for line work; washes sample the print hue (`washMake`); bone paper = the print |
| R4 | (d) "texture over type" vs maps dropping street names | never label blocks; street/arterial names on a threshold inside the city band |
| R5 | (e) "nothing smaller than the one town" vs a print that letters every ○ | accept the print; the rule binds the overlay only; no de-lettered raster |
| R6 | "names do not fade in from nothing" (p7) vs the praised appear effect (p6) | presence by threshold; ink eases ≤0.25 zoom / ≤250 ms; names at or after their ink |
| R7 | Azlen "no pins" vs Epēshu's hover halos and the census proximity pins | city sheet: nothing at rest; halos stay hover-only; census pins suppressed in the city footprint at the city band; deep links land |
| R8 | the ground and "sheet one" | Pēshunor north coast (C1) / Aldorūs / Epēshu unless a pick panel scores an alternative ≥1 higher; sheet one = region sheet over C1, bbox x1216–1760 y1376–1664 |
| R9 | invented names | minted deterministically from the Patrinaic roots tool, `prov:'invented'`, listed in `names-for-owner.md`; veto = add to the tool's veto list and re-mint; no cap |
| R10 | brief vocabulary | coach posts → caravan halts / waystations; "artillery hours" and the live-fire "range" wording dropped (the layer is **muster days**); closures → **shut ways**; the 1864 sheet → the old survey; the POIs "The Tithe-Yard" / "The Tithe-Barn" renamed by a Job 3 unit (planned by Job 2 in slice D) to **"The Tribute-Yard" / "The Tribute-Barn"**, with their `d:` description strings reworded too (`harvest-tithe` becomes `harvest-tribute`); church levy word out. Job 4 F06 checks this exact pair, and additionally needs `grep -ci tithe maps-site/index.html` to be 0 |
| R11 | data prerequisites | Job 3 needs "Traced road network" + "Census second pass" checked; `overridePrereqs` → slice A only |
| R12 | per-session notices vs "push only at version cuts" | notices (file/param name; player-facing label "the herald's tidings") load from `notices=<url>` or a local file; one committed sample snapshot; no mid-cycle pushes |
| R13 | fog source | a seeded function of (place, snapshot sim day); no sim change; never wall-clock |
| R14 | the old survey | an era tile layer stacked under the live base (opacity/swipe); an old-name layer too if the eras differ only in names |
| R15 | releases for docs-only runs | yes, a patch release with a `docs:` line |
| R16 | punch-item placement | directly above Filigree 4; ≤2 review cycles, then the owner |
| R17 | "hex" | one z7 tile (32 atlas px); fixtures F01–F12 are literal |
| R18 | the sparse baseline | the same view with the default-off toggle off, verified by DOM; the owner flips the default after Job 4 passes |
| R19 | the shield's reach | only Aldorūs; Kanae and Sokundo get none; the print's ◉/○ untouched |
| R20 | height units | bare numerals + legend "height above the sea", `prov:'derived'` |
| R21 | data contradictions (Aldorūs "out of sight of the sea" vs sea 77 px NE; Drāmūz marker 35 px off; Hordon/Maeges anchor) | recorded and queued directly above the job they block; canon notes are never edited by these jobs |
| R22 | ground outside the DEM window | out of scope; the bible states a no-DEM rule (F12); no invented relief |

`rulings.json` shape: `{"date":"2026-10-04","about":"…","overrides":{},"confirmed":[]}` (`about` is an optional note; the scripts read only `overrides`). Add ruling ids to `confirmed` as the owner signs them off.
It is created by the delivery commit and is **optional for Job 1**, which reads absence as `{}` and uses the
embedded defaults for the rulings it embeds (R8, R10, R17, R19–R22 among them); `confirmed` need not be non-empty
before Job 1. Confirmation matters before Job 2.

## 10. Data prerequisites ("pretty maps do not fix bad data")

| Prerequisite | Blocks | Why |
|---|---|---|
| "Traced road network (USER FLAG)" | Job 3 slices B–D (R11) | the rust coast road follows the canon dotted roads; "District borders" are really roads |
| "Census second pass" | Job 3 slices B–D | an unmarkered printed ○ must not be overprinted by an invented steading |
| "Uncharted-band softening" | — (sits above Job 3) | the valley-sheet appear effect |
| "Data fetch cache-busting" | — (sits above Job 3) | needed by notices and the new data files |
| "Tier-hidden markers intercept clicks" | — (sits above Job 3) | stacked panes |
| "Sim ↔ atlas continuity" | — (sits above Job 3) | deep links for notices |
| Data items Jobs 1–2 find (R21: Drāmūz marker, Hordon/Maeges anchor, Aldorūs sea note; river polylines from the solid lines) | the job they block | — |

Data items found by Jobs 1–2 are queued directly above the job they block.

## 11. Budget and size

| job | typical agents | bound | notes |
|---|---|---|---|
| 1 | ≈97 | ≈224 | 18 questions; 24 blind appliers + 12 resolvers per gate round; the bound includes `crit()` retries (one retry each for the preflight, hex cropper, integrator, ambiguity judge, patcher and the 3 records) |
| 2 | ≈60 | ≈120 | 12 sections; 2 drafters per round |
| 3 | ≈50 per run | ≈228 per run for slices A and C, ≈276 for B and D, at `maxUnits:8` | 3–6 runs in total |
| 4 | ≈110–170 | ≈260 | 13 finders, 3 verifiers per fresh finding, 12 sparse judges |

Notes on the bounds:
- **Job 2.** Each gate evaluation can run one more agent (the png stat), and the Probes phase gains a readback agent. The
  plan-mode schedule is Preflight 1–2, Probes (fresh 2–6, resumed 1–2), Pick 1–6, Sections 2n+1..3n+2 (n = sections to
  write), Integrate 3–6, Units 1–4, Check 4–9, Gate 8, Fix up to 2×17, Record 3–8; the plan result reports `bound: 120`
  and `over_bound`. A fix round is skipped when `budget.remaining()` is below 600000 tokens.
- **Job 3.** The worst case is the sum of the per-phase maxima: Preflight 2, Build 12·(maxUnits + ROUNDS·4), Smoke
  2·(1+ROUNDS), Slice gate 3·(1+ROUNDS), Hand test 6 + 14·(1+ROUNDS) on slices B and D only, Fix units 6·ROUNDS, Record 7.
  All of them are well under the 1000-agent cap.
- **Job 4.** Finders are capped at 2 findings per lens in round 0 and 1 per re-run lens later. Fresh findings beyond the
  260 bound or the token budget are left unverified, recorded as a gap, and end the loop. The optional `+Nk` token
  budget is honoured at about 30k tokens per agent. The metrics reader adds one or two agents per run; the bound constant
  is unchanged.

Size caps:
- images ≤300 KB each;
- bulk captures are git-ignored (`docs/filigree/shots/`, `docs/filigree/review-c*/shots/`); `shots/` keeps the last two
  runs, pruned by Job 3's `shots pruner` (mech agent with a count check); Job 4 commits only `metrics.json` and the
  images its punch list cites (`review-c<k>/cited/`), via its `shot pruner`;
- hex crops are JPEG q85 (12 images, frozen fixtures).

## 12. Troubleshooting and known limits

- **Rerun after a partial failure.** Use the default `resume:true`. On a *fail* (a gate that scored below threshold),
  commit `research/`, `gates/` and `state/` (they are the resume cache) but leave the POLISH box unchecked. On *infra*,
  do not commit a half-written `research/` directory; discard or leave it for the retry. Job 1 writes its ledger only
  at the end, so after an abort the retry re-researches all 18 questions (§2); a tool question (q09) additionally
  needs the preflight DEM probe to pass, or it re-runs and rewrites the tool even when its evidence file re-hashes.
  Never delete the frozen fixtures (§4); the sanctioned deletions are the ones the scripts' own errors name
  (`gates/hex*` after a deliberate fixture change, `gates/2-probes.json` when stale or invalid, a frozen
  `gates/3-handtest-questions.json` that fails validation). Smoke runs write only to their scratch `outDir`, which the
  operator deletes afterwards.
- **A stuck Job 3 unit** (`runs_failed` reached 3, so it is skipped). Fix it by hand, then re-run Job 3 with
  `args.unstick ["<id>"]`; for an obsolete fix unit use `args.discard ["fix-<S><n>"]` instead. Re-speccing in Job 2 is
  not the remedy.
- **A lost anchor.** `anchor lost: …` means a pattern literal no longer matches the app. Re-anchor that literal in the
  prelude's `ANCHORS`, which must stay byte-identical in all four scripts (§8 (c)), and re-run.

- **A name lookup fails in this session.** Workflows load at session start, so use `scriptPath` (§2).
- **Both Job 2 drafters miss the same probe.** That is spec ambiguity, and the fixer patches the spec. If only one
  misses, it is logged as noise.
- **`record-mismatch`.** The recorder's read-back disagreed. Where the return carries the computed object (Jobs 1, 3
  and 4), write it by hand; Job 2 returns none (per-job recovery in §1.6).
- **`forced_by` is set.** That gate can never pass. Re-run unforced once the previous job passes.
- **No DEM outside the window.** The heightfield is the sim's invention (max 328 m). Heights are `prov:'derived'`, and
  the resolution is about 1.04 atlas px per cell, so it is soft at the valley zoom. Vector contours carry the
  fingerprint.
- **Circular gate.** The hand-test questions come from the same baked data the build wrote. So Job 3 proves
  legibility, not truth. Job 4's data-truth lens (F11) checks names and roads against the print.
- **Unverified brief claims.** The brief's Bay Atlas stack, the swisstopo vector-service claim and the Stamen
  Watercolor method are unverified (owner's brief only). They never drive acceptance criteria.
- **Changing a job.** Edit its script, keep `meta.phases` and the literal phase strings in sync, keep the prelude
  identical in all four files, then run §8 (a)–(d). The design documents are frozen planning snapshots and are not
  updated; this guide and `POLISH.md` carry the current behaviour.
