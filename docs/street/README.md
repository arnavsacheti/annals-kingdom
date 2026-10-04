# Street view: operator's guide

This directory holds the durable record of the owner's request to carry a streamed, layered city into the sim: a
street view of Epēshu and every settlement whose detail emerges as the camera nears, with caravans and crowds, a
cloud deck and weather, and session overlays, all toggled as layers and none of it cluttering the far zooms. The
source post and what was verified about it are in [`research-dossier.md`](research-dossier.md), the terse digest is
[`../research/streamed-streets.md`](../research/streamed-streets.md), and the post's own names live only in §13.

The work is four jobs, each one saved workflow in `.claude/workflows/`, run as its own polish run:

| # | Job | Output | Done when |
|---|---|---|---|
| 1 | Research | street bible | standing at any frozen view you can name the six things that must be there, what drives each, and what it may cost |
| 2 | Planning | street spec | an engineer who never saw the post answers the frozen probes from the spec alone |
| 3 | Implementation | the street view | the world is the same seed whether you look or not, the frame keeps its caps, and the table map is untouched |
| 4 | Review | punch list | the bare street makes you angry |

Every gate is scored **by the script** from fixed fixtures: frozen camera views, a virtual-clock probe that makes draw
calls, triangles, object counts and sim fingerprints exact, computed probes and closed-form answers. No gate reads a
wall clock and none is a matter of taste.

**This track sits beside "Filigree for the Table" and never edits it.** It derives its machinery from the filigree
package (§0), cites the filigree rulings by id, reads filigree outputs read-only, and builds only after the filigree
build has released the sim (§1.3).

**Source of truth.** The committed scripts `.claude/workflows/street-{1-research,2-plan,3-build,4-review}.js` are the
running truth. Their design documents are committed in [`design/`](design/) as **planning snapshots** (2026-10-04):
where a script and its design disagree, the script wins. Every script starts with `export const meta = {` on line 1.

**Delivery order.** One delivery commit holds, in this order: `tools/street-drift.js`, the four scripts, this README,
`research-dossier.md`, `todo-inputs.json`, `rulings.json`, `design/`, the `.gitignore` lines, the digest and its index
line, the `.claude/CLAUDE.md` pointer, and last the POLISH.md block (so no "Run:" line ever names a missing script).

## 0. Lineage: what is copied, cited, ported, read, and new

| kind | what | how drift is caught |
|---|---|---|
| **copied** | the filigree prelude v1, under seven whole-line masks (START, END, OUT, DOCS, FULLOUT, J1FORCE, ANCHORS) plus one config region; `recordD` with `RECD`/`lensOf` from `filigree-1-research.js` | `tools/street-drift.js` D1 (masked prelude equal), D2 (four street preludes identical), D4 (`recordD` verbatim); run at every street preflight |
| **copied (recipe)** | the sandbox recipe: the Chromium path, the CDN packages and the two route globs of `filigree-3-build.js`'s `SANDBOX` | D3 (the street sandbox names each of them) |
| **cited** | filigree rulings R6, R9, R10, R12, R13, R15, R16, R18, R22 by id; their text is the prelude's `RULINGS` (verbatim by D1) plus `docs/filigree/rulings.json` overrides | Street 1 stamps the exact texts in its gate; Streets 2–4 refuse when they changed |
| **ported** | the job skeletons: question → lens → integrator → validator → paired blind appliers → resolver → critic (Job 1); frozen probes → sections → integrator → units → reader → paired blind readers (Job 2); per-unit implement → syntax → accept → fix ≤2 → determinism → record, ledger, stuck at 3, slice gates (Job 3); capture → single-lens finders → reproduce/refute/severity → blind panel → punch list (Job 4) | owned by this track; reviewed as new code |
| **read-only** | `docs/filigree/density-bible.json` class ids (sha-stamped), the R13 fog function in the `/* FILIGREE */` block, the R12 notices schema and sample, the filigree `index.html` anchors (read live from `filigree-1-research.js`) | GS.8: the filigree anchors still resolve and `maps-site/**` + `docs/filigree/**` hash to the same tree digest after every build run |
| **new** | the config region, the four job bodies (fixtures, questions, sections, units, lenses, criteria), `tools/street-drift.js`, `tools/street-probe.js` (written by Street 1), these docs | review effort goes here |

**Never edit a filigree file from this track.** A filigree fix that changes the prelude stops the street track with
`prelude drift: …` until the street prelude is re-derived (§12); the remedy is never to edit a filigree script.

## 1. Protocol

1. **One job per polish run.** The four street items sit in one block below the "Filigree 4 · Review → punch list"
   entry and above `## Done`. A polish run takes the top unchecked item, as usual, so the street jobs are reached when
   every item above is checked or refused; Streets 1, 2 and 4 hold no app file and may run while the filigree build
   waits on its data prerequisites.

   The queue rule is POLISH.md's own: *"each run takes the TOP unchecked item only … If another workflow holds the
   target file, take the next non-conflicting item instead."* So Street 1 is reached only when every item above it is
   checked, or is skipped as non-conflicting because it is blocked or held: a runnable-but-unfinished Filigree 2, a
   multi-run Filigree 3 between its runs, or Filigree 4 all outrank it. Reading the entry's "early" as "while Filigree 3
   is merely incomplete" is wrong; it holds only while that item is refused (thrown prerequisite or `held`). To run a
   street job out of order the owner moves its entry above the filigree items or invokes the Workflow explicitly; an
   explicit invocation is still gated by the job's preflight (gate files, density bible, hold), which nothing overrides
   except Streets 2–4's `args.force` (recorded, never a pass).
2. **The order is enforced by gate files.** Each preflight refuses unless the previous street gate says
   `"pass": true` and its key artifact is unchanged:
   - Street 1 needs `docs/filigree/gates/1-research.json` pass (full, unforced) and the filigree density bible unchanged:
     `street research waits for the density bible …`;
   - Street 2 needs `gates/1-research.json` and an unchanged bible: `planning must not start before the street bible
     exists …`; also `the filigree density bible changed since Street 1; re-run street-1-research` and `the cited
     filigree rulings changed since Street 1 (…); re-run street-1-research`;
   - Street 3 needs `gates/2-plan.json` and an unchanged spec: `build must not start before the street spec passes …`;
     `slice Sx refused: earlier slice Sy has not passed its gate`; `street-spec.json has no /checks for slice Sx: re-run
     street-2-plan`;
   - Street 4 needs `gates/3-build.json`: `review must wait for the finished street view …` (`args.preview` skips it).

   A thrown prerequisite is treated as blocked: leave the item unchecked, note it, take the next item. `args.force`
   (a reason string, Streets 2–4) bypasses the chain; a forced gate is recorded `forced_by` and **can never pass**.
3. **The hold (Street 3 only; computed in code; no override).** Street 3 returns `reason:'held'` (never throws) unless
   all of these hold:
   - `docs/filigree/gates/3-build.json` exists with `pass: true`, `mode: 'full'` and no `forced_by`;
   - POLISH.md has a line starting `- [x] **Filigree 3 ·`;
   - no unchecked line matches `^- \[ \] \*\*(Filigree 3 stuck unit|Filigree 4 punch c|Filigree data —)`;
   - with ST15 overridden to `strict…`: the highest `docs/filigree/gates/4-review-c<k>.json` has `pass: true`.

   Why: the filigree build's units may edit the sim, and its smoke gate loads both apps; Filigree 4 fix cycles re-run
   that gate. So no street edit lands before the filigree build has passed, and none while a filigree fix item is
   open. `held` means: no release, no box, note it, take the next non-conflicting item (POLISH.md queue rule).
   Street 3 also returns `reason:'blocked'` while any `- [ ] **Street data (S3) — …` item is open (its own
   prerequisites, queued by Street 2).
4. **Street 3 is multi-run.** Slices S0 instrument → S1 streaming → S2 near detail → S3 life → S4 sky and layers; each
   run builds up to `maxUnits` ready units of the current slice (every `index.html` unit strictly one at a time) and
   runs the slice gate when the slice is complete. Leave the item unchecked between runs with the returned note; check
   it off only on `check_off: true` (the final S4 gate passed, or the `nothing to build` rerun after it).
5. **What the polish run does with the return value.**

   | Return field | What the run does with it |
   |---|---|
   | `polish_note` | the one-line result note |
   | `polish_inserts` | new items, placed directly above `polish_inserts_above`; skip any whose title is already queued |
   | `polish_inserts_above` | `Street 2` (Street 1 gaps), `Street 3` (Street 2 data items, Street 3 stuck units), `Street 4 · Review → punch list` (punch items) |
   | `changelog_line` | goes in the patch release |
   | `pass` / `check_off` | decides the checkbox (`check_off` for Street 3, `pass` otherwise) |
   | `held_by`, `blocked_by`, `slice`, `gate`, `final_gate`, `state`, `device_gate`, `chain_ok` | informational, except record-mismatch recovery (§12) |
6. **Reason codes.** Filigree's (filigree README §1.6) with these street specifics:
   - `held` (Street 3): the filigree hold (item 3). No release; take the next item.
   - `blocked` (Street 3): open `Street data (S3)` items. Same handling.
   - `prelude drift: D…` (thrown, any job): a run fault, like `anchor lost`. No release; fix per §12.
   - `infra`, `agent died: <label>`: no release, the next run retries; in Street 3 units built before an `infra` are
     still committed with the returned `changelog_line`.
   - `gate-fail`, `units-failed`, `smoke-fail` (Street 3); comma-joined criterion ids (Streets 1 and 2 join with `,`,
     Street 4 with `, `): leave the box unchecked.
   - **Which thrown string is which** (match against the text after the `<job>: ` prefix that die() prepends, or by substring; the polish run treats each class as stated):

     | class | thrown-string prefixes | action |
     |---|---|---|
     | blocked (a prerequisite is not met yet) | `street research waits for the density bible`, `planning must not start before`, `build must not start before`, `review must wait for the finished street view`, `slice Sx refused`, `street-spec.json has no /checks`, `the filigree density bible changed since Street 1`, `the cited filigree rulings changed since Street 1` | leave unchecked, note it, take the next item |
     | run fault (the package or the checkout is broken) | `prelude drift:`, `anchor lost:`, `missing inputs:` (the commonest on a partial delivery), `a third review cycle is refused`, `unknown arg …`, `fixtures changed; delete docs/street/gates/views.json and docs/street/gates/view/ to re-freeze` (Street 1; delete as named, rerun), `gates/2-probes.json is invalid (…); delete it and rerun with resume:false`, `gates/4-review-c<k>.json already exists: refusing to overwrite an earlier cycle's record` (owner action named in the message), `args.units: … is not ready`, `scheduler: …`, `args.… must …`, `street ruling … is a fixed constraint` (fix the call) | no release; fix per §12; note it |
     | infra | `agent died: <label>`, `infra`, Workflow name unresolved | no release; the next run retries |

   - `nothing to build` (Street 3), `already passed: …` (Street 1, `pass:true`), `record-incomplete: …` (Street 1),
     `record-mismatch` (§12), `forced: <reason>`, `plan`, `preview`: as in filigree.
7. **Releases** (ST14, R15 cited). Every street run is its own polish run and cuts its own patch release at its end
   (`X.Y.Z-alpha.N` bump, `VERSION` + `CHANGELOG.md`, one release commit, tag, push), so no street commit ever sits
   unpushed across a filigree cut. Docs-only runs use a `docs:` CHANGELOG line. The central procedure, since agents never
   run git: (1) require a clean tree for the other track before the run (`git status --porcelain` shows no uncommitted
   filigree paths: `maps-site/`, `docs/filigree/`, `.claude/workflows/filigree-*`, and `index.html` while Filigree 3 is
   mid-build); if it is not clean, finish or commit that track's work first, or take the next item. (2) Run the job.
   (3) Stage only the paths the job wrote (`docs/street/**`, `tools/street-probe.js`, and for Street 3 `index.html`),
   plus `VERSION` and `CHANGELOG.md`. (4) Squash per `.claude/CLAUDE.md` "Cutting a version": the WIP commits since the
   last release that touch these paths become the ONE release commit; a filigree WIP commit never goes into a street
   release or the reverse. (5) Tag and `git push --follow-tags`. If an earlier street commit was already pushed, the
   CLAUDE.md hotfix exception applies and the squash is pushed with `--force-with-lease`; when unrelated filigree WIP
   commits sit between, squash only the unpushed street tail.
8. **Git.** Agents never run git and never edit POLISH.md, CHANGELOG.md, VERSION or `.claude/`. The polish run commits.
9. **The street view ships off** (ST7, R18 cited): `street=1` plus a layers row, default off, until Street 4 passes
   **and** an owner-hardware device run passes (ST8, §5.2). Then the owner flips the default.

## 2. Invocation

| Situation | Call |
|---|---|
| Fresh session (scripts committed and in the checkout) | `Workflow({name:'street-1-research', args:{date:'<today>'}})`; likewise `street-2-plan`, `street-3-build`, `street-4-review` |
| The session that created or edited the scripts, or a name that does not resolve | `Workflow({scriptPath:'/home/user/annals-kingdom/.claude/workflows/street-1-research.js', args:{date:'<today>'}})` |
| The Workflow tool is unavailable | stop; `reason:'infra'`, note "Workflow tool unavailable", no release |
| Preview the cost (preflight only) | `args:{date, mode:'plan'}`; compare the bound with §11 and stop if it grew |
| Resume a killed run in the same session | `Workflow({scriptPath, resumeFromRunId})` |
| Resume across sessions | re-run with `resume:true` (the default) |

`date` is today's date as `YYYY-MM-DD` from the session environment (scripts cannot read the clock).

Plan mode is not a polish result. Street 1's plan preview fails exactly as a full run would (`missing inputs`,
`anchor lost`, `prelude drift`, the density-bible refusal). Streets 2 and 3 report an unsatisfied chain as
`chain_ok:false` and still return the schedule; Street 3 also reports `held`/`blocked_by`. Street 4 throws until Street
3's final gate exists (use `preview:true` for a partial build).

Cross-session resume: Street 1 skips questions whose evidence re-hashes (its ledger is written only at Record) and
never regenerates frozen fixtures; Street 2 resumes sections and frozen probes while their stamps match; Street 3
resumes per unit from `state/3-build/`; Street 4 is one cycle per run.

## 3. Args

**Shared** (the filigree prelude's rules, with the street outDir): `date` (required), `repo`, `outDir` (default
`docs/street`; full mode must stay under it; smoke needs an absolute dir outside the repo), `mode`
(`full|smoke|plan`), `maxRounds` (0..2), `resume` (default true), `force` (Streets 2–4: a non-empty reason; Street 1
rejects it). **`rulings` is refused**: filigree R overrides come only from `docs/filigree/rulings.json`; use
`streetRulings` (keys ⊆ ST1…ST19, non-empty strings; ST3, ST4 and ST18 are fixed and refused) for street rulings.
`port` (default 0 = the probe binds an OS-assigned free port; 8544 is refused, it belongs to `server.js` and the
filigree jobs). Unknown keys are rejected.

| job | arg | default | rule |
|---|---|---|---|
| 3 | `maxUnits` | 6 | 1..12 |
| 3 | `units` | — | unit ids in the current slice, ready, ≤ maxUnits; not with `gate:'only'` |
| 3 | `slice` | first slice without a pass gate under the current spec | `S0`..`S4`; refused if an earlier slice has not passed |
| 3 | `gate` | `auto` | `auto` \| `skip` \| `only` |
| 3 | `unstick` | — | unit ids whose `runs_failed` is reset for this run |
| 3 | `discard` | — | `fix-S<n><k>` ids marked `discarded` |
| 4 | `preview` | false | findings only, under `docs/street/preview/`; never a polish result |
| 4 | `cycle` | 1 + non-preview review gates | 1..2; a third is refused (ST13) |

## 4. Outputs

```
docs/street/
  README.md                 this guide
  research-dossier.md       the verified research pass on the post (2026-10-04)
  todo-inputs.json          its structured inputs (17 pieces, 10 bronze-age analogues, budgets, constraints)
  rulings.json              owner overrides of ST1..ST19: {"date","about","overrides":{},"confirmed":[]}
  design/                   planning snapshots: workflow-1-research.md … workflow-4-review.md, polish-entries.md
  research/q01..q15.json    Street 1 evidence (+ f<r><n>.json follow-ups)
  street-bible.{md,json}    Street 1
  spec/s01..s10.{md,json}   Street 2 section drafts
  street-spec.{md,json}     Street 2 (units, slices, checks, caps, hook lines, determinism contract)
  fixtures/tidings.json     Street 2: the R12-schema tidings fixture (frozen while resume:true)
  cold/                     Street 2: the blind readers' answers
  state/                    ledgers: 1-research.json, 2-plan.json, 3-build.json, 3-build/<unit>.json,
                            3-build/index-ref.json, 3-build/off-ref.json (when re-baselined), 4-review.json
  shots/                    Street 3 captures (git-ignored; last two runs; ≤300 KB per image)
  review-c<k>/              Street 4: metrics.json + cited/ (tracked); shots/ (git-ignored)
  findings/                 Street 4
  punch-list.{md,json}      Street 4
  device/<date>.json        owner-run device measurements (ST8)
  preview/                  Street 4 preview scratch (git-ignored)
  gates/
    views.json, view/SV1..SV9.jpg     Street 1 fixtures (frozen)
    baseline.json                     Street 1 street-off baseline (frozen per index.html sha)
    1-research.json, 1-view-answers.json
    2-probes.json (frozen), 2-plan.json
    3-build-S0..S4.json, 3-build.json
    4-review-c<k>.json
tools/street-probe.js       Street 1 q01 (extended by Street 3 units, never broken)
tools/street-drift.js       the drift check (delivered with the scripts)
index.html                  Street 3 only: the /* STREET */ block + the spec's declared hook lines
```

**Frozen files.** `gates/views.json` + `gates/view/` (a changed rule dies with `fixtures changed; delete
docs/street/gates/views.json and docs/street/gates/view/ to re-freeze`), `gates/baseline.json` (re-measured only when
index.html or the probe changed), `gates/2-probes.json` and `fixtures/tidings.json` (frozen while `resume:true`;
`resume:false` regenerates). Those deletions are the only sanctioned ones.

## 5. Gates

### 5.1 Fixture views (rules in Street 1; resolved and frozen once)

| id | seed | day | focus | R (m) | tod | tests |
|---|---|---|---|---|---|---|
| SV1 | epeshu | 120 | Epēshu label "Epēshīn Forum" | 30 | 0.50 | near facades, stalls, crowds |
| SV2 | epeshu | 120 | the Epēshu gate facing Tamaron | 60 | the drawn dark hour | gate leaves, lamps |
| SV3 | epeshu | first weather day | label "Whitestreet" | 600 | 0.40 | mid tier, clouds |
| SV4 | epeshu | first queue day | the bridge nearest Epēshu on a route | 120 | 0.45 | caravans taking turns |
| SV5 | epeshu | 120 | Epēshu centre | 2300 | 0.50 | far quiet inside the 2200/2400 band |
| SV6 | epeshu | 120 | the building nearest "the Marble Quarter" | 9 | 0.50 | the door, the near plane, marble |
| SV7 | tamar1374 | 120 | the largest settlement | 30 | 0.50 | procedural scope |
| SV8 | epeshu | first weather day | label "Wood Quay" | 200 | 0.45 | the quay in weather, the Blue Temple quarter |
| SV9 | epeshu | 120 | Epēshu centre | 11000 | 0.50 | far quiet (measure only) |

Every view is reached by `simDays(day)` from a cold load at speed 0 (never `ANNALS.day()`, which skips the weather
rolls), the camera by `ANNALS.goto(x, z, R, true)` with yaw 0. Seeds: `epeshu` and `tamar1374` (filigree Job 3's
procedural smoke seed). The blank-street gate uses SV1–SV8; SV9 is measured only. Street 4 adds 390×844 phone variants
of SV1 and SV2.

### 5.2 The probe

`tools/street-probe.js` is the instrument every gate reads. It serves the repo itself (read-only, `--port`, default an
OS-assigned port), routes the CDNs from `--cdn-dir`, and installs a **virtual clock** before page scripts:
`requestAnimationFrame`, `performance.now` and `Date.now` on a fixed timeline, `Math.random` seeded, the director held,
speed 0, tod pinned. Under it, calls, tris, geometries, object counts, settled hashes and fingerprints are exact and the
degrade ladder never trips. Wall-clock times are never gated. The one real-clock mode, `--device`, is owner-run on real
hardware and writes `docs/street/device/<date>.json` (smoothed fps per second over a 60 s descent, the degrade step);
a pass (fps ≥ 42 throughout, degrade step 0) is the precondition for flipping the default (ST8).

### 5.3 Fingerprint protocol

The fingerprint is the sha256 of a canonical JSON of the sim after `ANNALS.speed(0)` and `simDays(400)`: the clock,
day ticked, settlements (pop, kind, prosperity), agents (kind, departDay, route, speed), the chronicle, treasury and
route volume. Street 1 proves it is sensitive (one caravan's `departDay` + 1 changes it). Street 3 requires, per seed,
`never === off === on` (no param, `street=0`, `street=1`) and `walk_on === walk_off` (simDays in chunks with the camera
walking SV1–SV8 and frames pumped between), both equal to the reference. If the baseline shows the sim alone is
view-dependent (`view_dependent: true`), that is recorded as a debt, not a failure.

### 5.4 The restore invariant and the hold-free coexistence checks

All street code lives in one `/* STREET */ … /* /STREET */` block (one namespace, `const STREET`), plus hook lines the
spec declares, each carrying `/*ST-HOOK*/`. `restore(index.html)` removes the block and turns every marked line back
into the line it replaced. While only this track has edited the sim, `restore(index.html)` is the pre-street file byte
for byte. So: a changed `restore` sha at preflight means another item edited the sim (Street 3 then re-measures its
off reference: the **re-baseline**, recorded), and an unchanged one after a build proves no undeclared line moved
(GS.X3). The filigree anchors are read live from `filigree-1-research.js` and must still resolve, none may appear
inside the block, and `maps-site/**` + `docs/filigree/**` must hash to the same tree digest after every run (GS.8).

### 5.5 Street 1 — blank-street test

Two blind appliers on different models (A sonnet/high, B opus/high, identical prompts) hold only the bible, the views,
the stills, the baseline and greps of index.html; per gate view they name the tier and six bible classes, each with its
state and a source ref; a resolver checks every ref.

| id | criterion |
|---|---|
| SG1.1 | bible valid (validator ok; shas equal) |
| SG1.2 | checklist 27/27 (17 pieces + 10 bronze-age analogues) |
| SG1.3 | both appliers valid on 8/8, tier exact |
| SG1.4 | class agreement ≥5/6 on ≥7 of 8 and ≥4/6 on all |
| SG1.5 | ≥5/6 refs resolve per applier per view, ≥90% overall |
| SG1.6 | zero "bible silent" |
| SG1.7 | zero banned vocabulary |
| SG1.8 | no struck claim cited |
| SG1.9 | blind compliance |
| SG1.10 | every fan-out ≥75% kept |
| SG1.11 | probe deterministic, literals met, fingerprint sensitive; baseline double run equal |
| SG1.12 | no new sim state; every determinism debt the grep finds listed; keys in canonical form |
| SG1.13 | caps ceiling numeric for SV1–SV9 and ≥ the baseline |
| SG1.14 | every imported filigree class id exists; the filigree bible unchanged during the run |

### 5.6 Street 2 — cold-engineer test

Two blind readers (sonnet/high, opus/high) may read only `street-spec.{md,json}` and answer 28–36 probes frozen before
the spec existed.

| id | criterion |
|---|---|
| SG2.0 | chain held |
| SG2.1 | traceability (bible must-rule → spec rule → unit), DAG, ≤9 units per slice, machine-checkable acceptance |
| SG2.2 | unit files only `index.html`, `tools/street-*.js`, `docs/street/**` |
| SG2.3 | cited literals resolve; no hook line holds a filigree or street anchor literal |
| SG2.4 | no source-post name outside `## Provenance` |
| SG2.5 | no spec-probe pointer null |
| SG2.6 | each reader ≥90% |
| SG2.7 | every slice has `/checks`; the mandatory check ids present |
| SG2.8 | caps for SV1–SV9 numeric, within the bible ceiling; SV5 and SV9 equal the baseline |
| SG2.9 | determinism contract: keyed hash + read-only sim state only; no new sim state |
| SG2.10 | hash params `^[a-z]+$`, not ending in `s`, not `s`/`goto`/`filigree`; `notices` consumed only with the S0 parser unit and the hash table |
| SG2.11 | hook lines marked, ≤16, a function hook → replaced line; one `STREET` namespace |
| SG2.12 | mandatory units present (S0.U00, S0.U01, S0.U02; S4.Ufog only when the atlas fog exists; S4.Unotices iff notices are consumed) |
| SG2.13 | zero banned vocabulary |
| SG2.14 | blindness; zero schema-path guesses |
| SG2.15 | artifacts hashed |

### 5.7 Street 3 — the walk test and the slice gates

| id | criterion | from |
|---|---|---|
| GS.1 | every unit of the slice done | S0 |
| GS.2 | fingerprints `never === off === on === ref`, `walk_on === walk_off === ref`, both seeds | S0 |
| GS.3 | street off: every view's calls, tris, geometries, textures, objects equal the reference exactly | S0 |
| GS.4 | street on: every view within its caps; SV5 and SV9 on = off exactly | S0 |
| GS.5 | zero clock, `W.rng` and `nowMs` in the block; every InstancedMesh carries instanceColor; one top-level name | S0 |
| GS.6 | no pop (0 → ≥0.9 opacity in one step); ease ≤ 250 ms (R6) | S1 |
| GS.7 | each tier threshold swaps once in, once out | S1 |
| GS.8 | filigree anchors resolve, none in the block; `maps-site/**` + `docs/filigree/**` untouched | S0 |
| GS.9 | console clean, both seeds, on and off | S0 |
| GS.10 | the slice's spec `/checks` pass | S0 |
| GS.X3 | only declared hook lines changed outside the block (restore invariant) | S0 |
| GS.X4 | the keydown handler and the `camera.near` line unchanged | S0 |
| GS.X5 | the hash table parses (`#notices=u&s=a` reads seed `a`); seed writers keep `street=1` | S0 |
| GS.X6 | `ANNALS.stats()` keys unchanged | S0 |
| GS.P5 | oscillating across the reveal and settlement bands builds each class ≤ 2 times | S1 |
| GS.P6 | fly away and back twice, then reseed: geometry count returns; resident tris ≤ cap | S1 |
| GS.P7 | per frame: quad jobs ≤ 6, built tris ≤ cap | S1 |
| GS.L1 | queue positions equal at 30 and 60 virtual fps | S3 |
| GS.L2 | caravan spacing ≥ s0 at SV4; drawn never ahead of true | S3 |
| GS.K1 | fog copy byte-identical and equal on 50 fixed pairs (or a recorded gap when the atlas function is absent) | S4 |
| GS.K2 | cloud placement equal on a day, different on the next; deck only in weather | S4 |
| GS.K3 | shadows row: off kills the shadow pass; default equals today; "held off for speed" at degrade step 3 | S4 |
| GS.K4 | weather dial: drawn precipitation exact at each of the four steps | S4 |
| GS.K5 | the herald's tidings from `fixtures/tidings.json` drawn exactly; none without notices | S4 |
| GS.R | device run recorded when present (never a failure here) | — |

S4's gate is the final gate and re-checks every slice's `/checks`. The reference is `gates/baseline.json` until a
re-baseline writes `state/3-build/off-ref.json`.

### 5.8 Street 4 — bare-street test

On SV1, SV2, SV4 and SV7, three blind judges (opus/sonnet/opus; J0 sees the opposite A/B order to J1 and J2) see only
the bare and the layered stills. Each names what one has and the other lacks using the bible's class names; an omission
is confirmed in code when the probe counts that class on the layered view and not on the bare one.

| id | criterion |
|---|---|
| SG4.1 | zero surviving blocker or major |
| SG4.2 | per view ≥2 of 3 prefer layered, each with ≥3 confirmed omissions |
| SG4.3 | fingerprints re-measured equal |
| SG4.4 | caps met; far views quiet |
| SG4.5 | zero fade violations; swaps 1+1 |
| SG4.6 | zero banned words in STREET-block strings |
| SG4.7 | coexistence clean (filigree anchors resolve and stay out of the block, restore, hash table, stats keys) |
| SG4.8 | blind compliance |
| SG4.9 | every lens returned in round 0; verify coverage ≥75% |

Lenses: determinism; performance and caps; pop and fade; caravan sense; canon and voice; the Marble City; weather and
sky; layers and hash; phone; where the build flinched; owner-input fidelity (the toggles, the weather dial, the
tidings, detail emerging on the descent, and the VTT exclusion stated rather than dropped).

## 6. Model/effort pairing

The pairing policy is `docs/filigree/README.md` §6, unchanged: the street prelude carries the same `PAIR`
(`mech` haiku/low · `triage` sonnet/low · `audit` sonnet/medium · `deep` sonnet/high · `judge` opus/high · `integ`
opus/xhigh), and every paired blind test runs on different models with identical prompts.

| job | step | role |
|---|---|---|
| all | preflights, recounts, resolvers, recorders, readers, greps, rebaseliner, determinism runs, metrics readers, static checks | mech |
| 1 | q01 probe writer and fixer | deep (tool pipeline) |
| 1 | q02, q05–q10, q12–q14 | audit (one bounded question each) |
| 1 | q03 caravans and the stateless queue (runs a property test) | deep |
| 1 | q04 debts | mech (a grep) |
| 1 | q11 Epēshu canon (crops) | deep (vision) |
| 1 | q15 class map; critic; patcher; ambiguity judge | judge |
| 1 | bible integrator | integ |
| 1 | applier A / B | deep / judge |
| 2 | sections s01, s02, s05, s09; probe writer; red team; patcher; unit planner; spec fixer | judge |
| 2 | sections s03, s08, s10 | deep |
| 2 | sections s04, s06, s07; tidings fixture | audit |
| 2 | anchor fixer; guess auditors | triage |
| 2 | spec integrator | integ |
| 2 | reader A / B | deep / judge |
| 3 | `index.html` implementers and fixers; diagnoser | judge |
| 3 | probe-extension implementers and fixers | deep |
| 3 | docs/data implementers; acceptance and spec-check runners; smoke; capture | audit |
| 4 | finders: L01 determinism, L06 Marble City | deep |
| 4 | finders: L02, L03, L05, L07, L08, L09 | audit |
| 4 | finders: L04 caravan sense, L10 flinched, L11 owner-input fidelity; refute verifier | judge |
| 4 | reproduce verifier | audit |
| 4 | severity verifier | triage |
| 4 | panel J0 / J1 / J2 | judge / deep / judge |
| 4 | punch integrator | integ |

Deviations from the filigree kind-of-step table, with reasons: q03 is `deep` (it writes and runs a property test, a
tool step); the Job 2 sections s03/s08/s10 are `deep` (they translate measured data and tool output; anchors and
probes catch errors); every `index.html` implementer and fixer is `judge` (logic edits in the sim, the filigree rule
for app logic); Street 3 never uses `integ` (no integrator), like filigree Job 3.

## 7. Reuse map (the sim; re-anchor by pattern, never by line number)

| need | reuse | anchor |
|---|---|---|
| keyed randomness | `makeStream(key)` = xmur3 → sfc32; street key `makeStream(W.seed+':st:'+cls+':'+id+':'+day)`; the sim has no mulberry32 (the dossier's "xmur3 → mulberry32" is the atlas form of the same keyed idea; ST4 rules the sim form) | `function makeStream(s){`, `function xmur3(str){` |
| the frame | `tick(dt, nowMs)` → `simAdvance`; street code reads `dt` only | `function tick(dt, nowMs)`, `function simAdvance(nd)`, `function frame(nowMs)` |
| caravans | `routePos`, `updateAgents` (a pure function of the day), `processArrivals(day)` (tolls, plague roll, chronicle on `W.rng.hist`): a queue may move meshes only | `function routePos(`, `function updateAgents()`, `function processArrivals(day)` |
| settlement LOD | swap by camera-to-centre at 2400 out / 2200 in; near detail is its own mesh, never `meshHi` | `function updateLOD()` |
| near plane | already `clamp(R*0.02, 0.5, 50)`; unchanged | `camera.near = clamp(R*0.02, 0.5, 50)` |
| dark hour | a pure function of the drawn sun (`renderTod`), not of the sim day | `const darkHour =`, `renderTod = (renderTod` |
| shadows | `shadowsOn` (never set today) and `wantShadow`; the one-way degrade ladder | `let shadowsOn = true`, `const wantShadow`, `let fpsAvg = 60, degradeStep` |
| street data | `s.streets`, `s.buildings`, `s.gates`, `W.bridges`; Epēshu labels and the Blue Temple | `s.streets.push`, `s.gates = []`, `W.bridges = []`, `{name:'Epēshīn Forum'`, `{name:'Wood Quay'`, `templeName:'the Blue Temple of Thobrauk'` |
| instancing | every InstancedMesh on `MAT.world` carries instanceColor | `every InstancedMesh sharing MAT.world MUST carry instanceColor` |
| weather | `W.weather` has no fog state (R13) | `W.weather = ` |
| keys and rows | the keydown handler (no new keys); the overlay menu | `window.addEventListener('keydown'`, `id="ovMenu"` |
| hash | the unanchored seed regex at two sites and the `'#s='` writers (fixed in S0, ST18); `applyGotoFromHash` | `location.hash.match(/s=([^&]+)/)`, `'#s='+encodeURIComponent`, `function applyGotoFromHash()` |
| debug API | `ANNALS.stats()` (keys never change), `.simDays`, `.step`, `.tod`, `.goto`, `.hold`, `.speed`, `.seed`; street metrics only under `ANNALS.street` | `window.ANNALS = {` |

## 8. Smoke recipe

Run from the repo root after any edit to a street **or a filigree** script.

**(a) Parse** and **(b) meta, phases and forbidden tokens**: the filigree README §8 (a) and (b) commands, unchanged,
with the glob `.claude/workflows/street-*.js`.

**(c) Drift**: `node tools/street-drift.js` (add `--json` for machine output). D0 filigree preludes identical; D1
each street prelude equals the filigree prelude under the seven masks; D2 the four street preludes identical; D3 the
sandbox recipe matches filigree-3's; D4 `recordD` verbatim; D5 citations well-formed and the street rulings free of
banned words; D6 meta, phases, parse and forbidden tokens. `node tools/street-drift.js --self-test` proves the checker
itself on synthesized scripts in a temp dir (a faithful copy passes; a one-word R6 edit fails D1 and D2).

**(d) The filigree package is intact**: re-run the filigree README §8 (a)–(c) commands unchanged over
`.claude/workflows/filigree-*.js` (parse ok ×4, meta ok ×4, prelude identical) on every street delivery.

**(e) Plan mode**: `Workflow({name:'street-1-research', args:{date:'<today>', mode:'plan'}})` — expect a schedule and
`pass:false`. In a fresh checkout Street 1 throws the density-bible refusal until Filigree 1 has passed; Streets 2–3
return `chain_ok:false`; Street 4 throws until Street 3 has written its final gate.

**(f) Plumbing chain** in a scratch dir, never under `docs/`: the four jobs with `mode:'smoke'` and the same absolute
`outDir`; smoke uses haiku/low and one item per fan-out, Street 3 writes only dry-run diffs; delete the dir afterwards.

**(g0) Bootstrap the CDN directory** (once per sandbox; `--cdn-dir` is the only way the probe gets three and leaflet, since CDNs are blocked): `D=$(mktemp -d) && cd $D && npm pack three@0.128.0 leaflet@1.9.4 && for f in *.tgz; do mkdir -p "${f%.tgz}" && tar xzf $f -C "${f%.tgz}"; done`, then pass `--cdn-dir $D`. The exact layout the probe expects is the `SANDBOX_ST` string in the prelude (copied from `filigree-3-build.js` `SANDBOX`). Playwright comes from `NODE_PATH=/opt/node22/lib/node_modules` and Chromium from `/opt/pw-browsers/chromium-1194/`; both are environment-specific, and a failure to find either is reported by the probe as `infra_error` (never a gate fail). `tools/filigree-capture.js` does not exist, so there is no shortcut.

**(g) App smoke**: the filigree README §8 (f) recipe (npm-packed three r128 and leaflet, Playwright from `NODE_PATH`,
the Chromium path) — or simply `node tools/street-probe.js --fingerprint --seed epeshu --days 400 --cdn-dir <dir>`
once the probe exists. Load `#s=epeshu` and `#s=tamar1374`, wait for `ANNALS.ready`, `simDays(400)`, zero console
errors, with and without `street=1`.

## 9. Owner rulings

Runs proceed on the defaults (embedded in the street prelude's `ST_RULINGS`). Override in `docs/street/rulings.json`
(`{"overrides":{"ST5":"…"}}`) or with `args.streetRulings`; every gate records `street_rulings_used`. Filigree rulings
are cited, never restated: their text is the filigree prelude's (verbatim) plus `docs/filigree/rulings.json`; edit them
only there.

**Confirm before Street 2:** ST1, ST2, ST5, ST8, ST10, ST12.

| id | question | default |
|---|---|---|
| ST1 | placement | the sim only, one STREET block plus declared hooks; the atlas, `docs/filigree/` and filigree tools never edited; the atlas-to-sim link belongs to "Sim ↔ atlas continuity" |
| ST2 | scope | generic tiers for every settlement (tamar1374 tests it); Epēshu facades only in Epēshu; ground interpolates the 11.72 m grid, no new relief (R22) |
| ST3 (fixed) | queueing | render-only: meshes move, `departDay`/route/speed never; no accumulator fed by frames; fingerprint identical on/off/never |
| ST4 (fixed) | randomness | `makeStream(W.seed+':st:'+cls+':'+id+':'+day)` cached per key; presentation time from `dt`; no `W.rng`, clock or `nowMs` in the block |
| ST5 | gates at the dark hour | leaves drawn shut while the drawn eclipse lasts; presentation only, never a hindrance to the caravans; "the gates shut at the dark hour"; canon unconfirmed (a veto leaves them open) |
| ST6 | obstacles | one-lane bridges and fords crossed in turn; toll halts hold a dwell; keyed on (seed, route, day); visual only |
| ST7 | layers | rows only, no new keys; `street=1`, default off; sub-rows "roads and folk", "clouds", "weather", "shadows" (on; "held off for speed" at degrade step 3) |
| ST8 | perf evidence | deterministic caps and exact off-identity in the sandbox; owner device run (fps ≥ 42, degrade step 0, 60 s descent) before the default flip |
| ST9 | workers | none; ≤6 quad jobs and a triangle cap per frame; a full LRU stays coarse |
| ST10 | VTT export, party presence | out of scope (unsourced); the battle sheet is a separate owner-gated item, enabled by overriding this ruling with its scale |
| ST11 | fog | the R13 function copied byte-identical with its helpers inside the STREET namespace; no fog sim state; a gap while the atlas has none |
| ST12 | marble | stone tier inside Epēshu marble-pale; the Blue Temple of Thobrauk on Wood Quay's northern edge the one landmark facade |
| ST13 | review cycles, crowds | punch items above Street 4, ≤2 cycles, then the owner; crowds keyed daily by (seed, settlement, day), scaled by `s.pop`; no named market day |
| ST14 | releases | one patch per street run; `docs:` lines for docs-only runs (R15) |
| ST15 | hold strictness | lenient (§1.3); `strict…` also waits for the latest Filigree 4 gate |
| ST16 | words | Patrinaic lexicon or plain bronze-age English; minted names per R9; the street word list extends R10's; the shipped "cog" not spread |
| ST17 | provenance | the post's sources named only under `## Provenance` |
| ST18 (fixed) | hash parser | S0 anchors the seed param `(?:^#|&)s=` at both sites and makes every `#s=` writer keep other params; new params `^[a-z]+$`, not ending in `s`, not `s`/`goto`/`filigree`; `notices=` read only after this |
| ST19 | weather density | a "weather" sub-row with four steps scaling the drawn precipitation count (draw range only); roof masks only when exact under the probe |

`rulings.json` shape: `{"date":"2026-10-04","about":"…","overrides":{},"confirmed":[]}`; add ids to `confirmed` as the
owner signs them off. It is optional for Street 1.

## 10. Prerequisites and coexistence

| prerequisite | blocks | why |
|---|---|---|
| Filigree 1 passed (`docs/filigree/gates/1-research.json`) | Street 1 | the street bible imports the density bible's class ids |
| the filigree hold clear (§1.3) | Street 3 | the filigree build may edit the sim and its smoke loads both apps |
| `Street data (S3) — …` items checked | Street 3 | prerequisites Street 2 found |
| "Sim ↔ atlas continuity" | — | owns the atlas → sim deep link (`#goto=`), not this track |
| "Trackpad gesture feel" | — | edits the sim; a later edit only triggers a recorded re-baseline |

Coexistence summary: the street track writes only `index.html` (inside the block and its declared hooks, Street 3
only), `tools/street-*.js` and `docs/street/**`. It never writes `maps-site/**`, `docs/filigree/**`, `.claude/**`,
`tools/filigree-*` or `server.js`, never uses port 8544, and its script names never match the filigree glob
`filigree-*.js`. Its hash param `street` cannot be read as the seed (it does not end in `s`), and S0 anchors the seed
parser before anything reads `notices=`.

## 11. Budget and size

| job | typical agents | bound (plan-mode `agents_bound` / `bound`) |
|---|---|---|
| Street 1 | ≈80 | 180 |
| Street 2 | ≈50 | 90 |
| Street 3 | ≈40 per run (5–8 runs) | 190 per run at `maxUnits:6` |
| Street 4 | ≈80 | 200 |

A plan result above the bound means an arg was raised or a script grew: stop and note it. A full track is ≈80 + 50 +
6 × 40 + 80 ≈ 450 agents. Images ≤300 KB; `shots/`, `review-c*/shots/` and `preview/` are git-ignored; `shots/` keeps
the last two runs.

## 12. Troubleshooting and known limits

- **`prelude drift: D…`.** A filigree or street script changed. Re-derive: copy the current filigree prelude, apply the
  seven street replacements (§0, `design/workflow-1-research.md` §0), keep the street config region, paste the result
  into all four street scripts, then run §8 (a)–(d). Self-contained: the committed scripts carry the config region
  (ST rulings text, `VOCAB_ST`, `SANDBOX_ST`, the check tasks) and the street `ANCHORS` list inline between the street
  prelude markers, so copy them out of any street script; nothing outside the repo is needed. Never edit a filigree script to make the check pass.
- **`anchor lost: …`.** A street anchor no longer matches index.html: re-anchor that literal in the prelude's
  `ANCHORS` (all four scripts) and re-run §8. A filigree anchor lost before any street edit is recorded, not caused,
  by this track.
- **The filigree density bible changed after Street 1** (a Filigree 1 re-run adding gaps). Streets 2 and 3 throw
  `the filigree density bible changed since Street 1; re-run street-1-research` (Streets 2, 3 and 4 throw the
  cited-rulings string; Street 4 does not compare the bible sha). Re-run Street 1 with `resume:true`:
  the frozen `gates/views.json`, the baseline and every `research/q*.json` whose evidence re-hashes survive; the
  bible is re-validated against the new class ids and the blank-street gate runs again. Gate records of Streets 2–4
  are then stale and those jobs re-run in order (budget: the Street 1 re-run plus Street 2 again, ≈130 agents beyond
  §11).
- **Street 1 run while Filigree 3 is mid-build.** Allowed, but `index.html` may still move. `gates/baseline.json`
  stores `index_sha`; Street 3 only re-measures the off reference whenever it differs (the `rebaselined` note); it does not
  re-resolve view focuses. A moved focus (Filigree 3 moved the grid or a label focus) is caught by a Street 1 re-run
  (`fixtures changed; delete docs/street/gates/views.json and docs/street/gates/view/ to re-freeze`) or by a gate
  failure. Cheapest course: run Street 1 after Filigree 3 is checked.
- **Held for many runs.** Expected until the filigree build passes and its fix items close; the note names what holds.
- **A fingerprint mismatch.** Bisect `never` against `off`: a difference means the hook itself touches sim state.
  `on` against `off` means a street path writes the world.
- **Off-identity failure.** Usually a STREET object created while off, or a foreign sim edit since the last run
  (the gate then shows `rebaselined`).
- **GS.8 tree digest differs.** Something wrote `maps-site/` or `docs/filigree/` during the Street 3 run: a street
  agent breaking the read-only rule (fix and re-run), or a filigree run overlapping it (runs are one at a time; re-run).
- **The atlas fog function does not exist yet.** A recorded gap, never an invented function.
- **A stuck Street 3 unit.** Fix it by hand, then re-run with `args.unstick ["<id>"]`; an obsolete fix unit gets
  `args.discard`.
- **`record-mismatch`.** As filigree: write the returned `gate`/`final_gate`/`state` by hand where returned; Street 2
  returns none, so re-run with `resume:true`.
- **Known limits.** Sandbox counts are not device frames: the default stays off until the owner's device run (ST8).
  The virtual clock could hide a real-clock dependency in street code; the static greps catch the syntax. The VTT
  battle sheet and party presence are out of scope until the owner rules (ST10). Design docs are snapshots.

## 13. Provenance

The owner's input (verbatim, 2026-10-04): "The post showcases a browser-based 3D Tokyo model built in Three.js using
Opus 5.5 to compile open data sources like PLATEAU 3D city models, OpenStreetMap, and GSI elevation/aerial photos into
streaming tiles with procedural facades, road markings, and animated traffic that obeys signals. Smooth zoom and detail
transitions come from tiled streaming, layer toggles for clouds/shadows/traffic, and dynamic rendering that loads
higher-fidelity elements like individual buildings and vehicles as the camera moves closer, maintaining high FPS
without overload. For DND maps, this inspires interactive urban VTT scenes with procedural density, weather effects,
and session-specific overlays, aligning with trends toward atlas-style filigree where detail emerges naturally rather
than cluttering low zooms."

What was verified (research-dossier.md): the post itself was egress-blocked, so it stays the owner's paraphrase; the
best candidate repository is `github.com/jeantimex/tokyo` ("Procedural-Tokyo"), not confirmed as the post; its signals
cycle, but that cars obey them is unread; no shadows toggle was seen; the "Opus 5.5" credit is unverified.
3DTilesRendererJS needs three ≥0.167 and BatchedMesh r170+, so only their methods port to r128 (screen-space-error
refine, a bounded job queue, an LRU that stays coarse when full, own culling, a 250 ms cross-fade); the
car-following model is IDM (`calcAccDet`, movsim). The bronze-age translation (fords and one-lane bridges crossed in
turn, toll halts, gate leaves at the dark hour, caravan strings, market crowds, a cloud deck from the weather, the
herald's tidings) is this track's, not the post's.
