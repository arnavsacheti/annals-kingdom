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
   every item above is checked or refused; Streets 1 and 2 hold no app file and may run while the filigree build
   waits on its data prerequisites (Street 4 only after Street 3 has passed, or with `preview:true`).

   The queue rule is POLISH.md's own: *"each run takes the TOP unchecked item only … If another workflow holds the
   target file, take the next non-conflicting item instead."* So Street 1 is reached only when every item above it is
   checked, or is skipped as non-conflicting because it is blocked or held: a runnable-but-unfinished Filigree 2, a
   multi-run Filigree 3 between its runs, or Filigree 4 all outrank it. Reading the queue as reaching the street jobs "early" (a word of `design/polish-entries.md`, not of the POLISH
   block) while Filigree 3 is merely incomplete is wrong; it holds only while that item is refused (thrown prerequisite
   or `held`). To run a
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
     also `the filigree density bible changed since Street 1; re-run street-1-research` and `the cited filigree rulings
     changed since Street 1 (…); re-run street-1-research`; `slice Sx refused: earlier slice Sy has not passed its
     gate`; `street-spec.json has no /checks for slice Sx: re-run street-2-plan`;
   - Street 4 needs `gates/3-build.json` as a full, unforced pass whose spec is unchanged since Street 3's final gate
     (`spec_ok`), and the cited filigree rulings unchanged: `review must wait for the finished street view …` and
     `the cited filigree rulings changed since Street 1 (…)` (`args.preview` and `args.force` skip both). The wait is
     thrown in full mode only; smoke and plan runs log it and go on. A cycle-2 run also returns `reason:'blocked'`
     (§1.6) while a cycle-1 punch item is open.

   A thrown prerequisite is treated as blocked: leave the item unchecked, note it, take the next item. `args.force`
   (a reason string, Streets 2–4) bypasses the chain; a forced gate is recorded `forced_by` and **can never pass**.
3. **The hold (Street 3 only; computed in code; no override).** Street 3 returns `reason:'held'` (never throws) unless
   all of these hold:
   - `docs/filigree/gates/3-build.json` exists with `pass: true`, `mode: 'full'` and no `forced_by`;
   - that gate is fresh: the `sheet-spec.json` sha256 recorded in its artifacts equals the sha256 of the current
     `docs/filigree/sheet-spec.json` (a stale gate holds Street 3);
   - POLISH.md has a line starting `- [x] **Filigree 3 ·`;
   - no unchecked line matches `^- \[ \] \*\*(Filigree 3 stuck unit|Filigree 4 punch c|Filigree data —)`;
   - with ST15 overridden to `strict…`: the highest `docs/filigree/gates/4-review-c<k>.json` has `pass: true`.

   Why: the filigree build's units may edit the sim, and its smoke gate loads both apps; Filigree 4 fix cycles re-run
   that gate. So no street edit lands before the filigree build has passed, and none while a filigree fix item is
   open. `held` means: no release, no box, note it, take the next non-conflicting item (POLISH.md queue rule).
   Street 3 also returns `reason:'blocked'` while any `- [ ] **Street data (S3) — …` item is open (its own
   prerequisites, queued by Street 2).
4. **Street 3 is multi-run.** Slices S0 instrument → S1 streaming → S2 near detail → S3 life → S4 sky and layers; each
   run builds up to `maxUnits` ready units of the current slice and runs the slice gate when the slice is complete.
   Every unit holds the `index.html` lock (units run strictly one at a time, and each `index.html` unit also takes the
   `tools/street-probe.js` lock, so index units serialize against probe-tool edits). Leave the item unchecked between
   runs with the returned note; check it off only on `check_off: true` (the final S4 gate passed, or the `nothing to
   build` rerun after it).

   Stuck items are queued once, directly above Street 3, each as one line (whitespace collapsed; title capped at 120
   and last failure at 600 characters): `Street 3 stuck unit <id>` (3 failed runs; `args.unstick` after a hand fix),
   and `Street 3 stuck criterion <S> <id>` (a fix unit is done but did not cure its criterion; `args.discard` is the
   escape, the next gate round then offers a fresh fix unit). A ledger fix unit whose dependency is no unit of its own
   or an earlier slice (rejected, discarded or unknown id) is reported stuck once (recorded `runs_failed` 3) with
   "dependency X can never be met …; drop it with args.discard ["id"]", never with a suggestion to unstick, and the
   run's reason is `units-failed`; a diagnoser unit with such a dependency is rejected (it stays `proposed`). A fix
   unit blocked by a failed in-batch dependency is recorded `pending`, not left `proposed`. When such dead units are
   recorded, the run builds `max(1, maxUnits - ceil(dead/6))` units so the §11 bound holds.
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
   - `blocked` (Street 3): open `Street data (S3)` items. Same handling. (Street 4): cycle 2 while a `- [ ] **Street 4
     punch c<cycle-1> ` line is still open in POLISH.md, returned with `blocked_by` (not for `preview`, `force` or
     `plan`; plan lists `blocked_by`).
   - `prelude drift: D…` (thrown, any job): a run fault, like `anchor lost`. No release; fix per §12.
   - `infra`, `agent died: <label>`: no release when nothing was built, the next run retries; in Street 3, units built
     before an `infra` are still committed in a patch release using the returned `changelog_line` (as in filigree
     Job 3). Street 2: a dead spec reader in the Fix phase ends the run with `agent died: spec reader`, not a fix round.
   - `gate-fail`, `units-failed`, `smoke-fail` (Street 3); comma-joined criterion ids (Streets 1 and 2 join with `,`,
     Street 4 with `, `): leave the box unchecked.
   - **Which thrown string is which** (match against the text after the `<job>: ` prefix that die() prepends, or by substring; the polish run treats each class as stated):

     | class | thrown-string prefixes | action |
     |---|---|---|
     | blocked (a prerequisite is not met yet) | `street research waits for the density bible`, `planning must not start before`, `build must not start before`, `review must wait for the finished street view`, `slice Sx refused`, `street-spec.json has no /checks`, `the filigree density bible changed since Street 1`, `the cited filigree rulings changed since Street 1` | leave unchecked, note it, take the next item |
     | run fault (the package or the checkout is broken) | `prelude drift:`, `anchor lost:`, `missing inputs:` (the commonest on a partial delivery), `a third review cycle is refused`, `unknown arg …`, `fixtures changed` followed by `(moved: SVn, …)` or `(rules)`, then `; delete docs/street/gates/views.json and docs/street/gates/view/ to re-freeze` and a baseline clause (Street 1: a moved focus or a changed rule; delete as named, rerun), `gates/2-probes.json is invalid (…); delete it and rerun with resume:false`, `gates/4-review-c<k>.json already exists: refusing to overwrite an earlier cycle's record` (owner action named in the message; raised for the derived cycle as well as `args.cycle`), `args.units: … is not ready`, `scheduler: …`, `restore invariant broken:` and `coexistence broken:` (Street 3: undeclared `/*ST-HOOK*/` lines at preflight, a previous run that left `restore(index.html)` off its stamp, or a previous run that changed `maps-site/` or `docs/filigree/` with the tree unchanged since; the owner action is in each message: undo by hand, or delete `state/3-build/index-ref.json` when the remaining change is legitimate), `street-bible.json has no classes` (Street 4), `street ruling … is a fixed constraint`, and every other argument-validation throw (`args.… must …`, `args.force is not accepted by Street 1`, `args.rulings sets the filigree R1..R22 and is refused here …`, `unknown ruling …`, `unknown street ruling …`, `ruling … must be a non-empty string`, `street ruling … must be a non-empty string`, `preview must be a boolean`, `args.units lists a unit twice`): fix the call. **Catch-all:** any throw not in the blocked or infra rows is a run fault | no release; fix per §12; note it |
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
   plus `POLISH.md` (the polish run's own edit: the checked box, the result note and the inserts), `VERSION` and
   `CHANGELOG.md`. (4) Squash per `.claude/CLAUDE.md` "Cutting a version": the WIP commits since the
   last release that touch these paths become the ONE release commit; a filigree WIP commit never goes into a street
   release or the reverse. (5) Tag and `git push --follow-tags`. If an earlier street commit was already pushed, the
   CLAUDE.md hotfix exception applies and the squash is pushed with `--force-with-lease`; when unrelated filigree WIP
   commits sit between, squash only the unpushed street tail. The street delivery commit has no release of its own: the
   first release cut after it (normally Street 1's) absorbs it. A Street 3 run with no unit built and no gate words
   its CHANGELOG line `no unit built (n failed)`, not `slice gate run`.
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
`chain_ok:false` and still return the schedule; Street 3 also reports `held`/`blocked_by`. Street 4 throws that wait in full
mode only (smoke and plan log it; use `preview:true` for a partial build in a full run).

Cross-session resume: Street 1 skips questions whose evidence re-hashes (its ledger is written only at Record) and
never regenerates frozen fixtures; Street 2 resumes sections and frozen probes while their stamps match,
also across agent-died stops: the ledger `state/2-plan.json` is checkpointed after Probes (probes + tidings) and after
Sections (before the section-quorum stop), and on any stop with unrecorded work; a section resumes only when its
recorded json AND md both re-hash; the tidings gaps (schema source, shut-way and muster-day counts) survive a resume in the
ledger. A re-run on an unchanged bible, rulings and spec files returns `already passed` and
does not rewrite `street-spec.json` (to redo Street 2, delete `gates/2-plan.json` or pass `resume:false`). Street 3
resumes per unit from `state/3-build/`; Street 4 is one cycle per run.

## 3. Args

**Shared** (the filigree prelude's rules, with the street outDir): `date` (required), `repo`, `outDir` (default
`docs/street`; full mode must stay under it; smoke needs an absolute dir outside the repo), `mode`
(`full|smoke|plan`), `maxRounds` (0..2), `resume` (default true), `force` (Streets 2–4: a non-empty reason; Street 1
rejects it). **`rulings` is refused**: filigree R overrides come only from `docs/filigree/rulings.json`; use
`streetRulings` (keys ⊆ ST1…ST19, non-empty strings; ST3, ST4 and ST18 are fixed and refused) for street rulings;
Street 2 honours overrides of ST5, ST7, ST9 and ST19 (§9).
`port` (default 0 = the probe binds an OS-assigned free port; otherwise an integer 1024..65535; 8544 is refused, it
belongs to `server.js` and the filigree jobs). Unknown keys are rejected.

| job | arg | default | rule |
|---|---|---|---|
| 3 | `maxUnits` | 6 | 1..12 |
| 3 | `units` | — | unit ids in the current slice, ready, ≤ maxUnits; not with `gate:'only'` |
| 3 | `slice` | first slice without a pass gate under the current spec | `S0`..`S4`; refused if an earlier slice has not passed |
| 3 | `gate` | `auto` | `auto` \| `skip` \| `only` |
| 3 | `unstick` | — | unit ids whose `runs_failed` is reset for this run |
| 3 | `discard` | — | `fix-S<n><k>` ids marked `discarded` |
| 4 | `preview` | false | findings only, under `docs/street/preview/`; never a polish result |
| 4 | `cycle` | 1 + max(existing cycles, 0) | 1..2; a third is refused (ST13); the already-exists refusal applies to the derived cycle as well as `args.cycle` |

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
                            3-build/index-ref.json, 3-build/off-ref.json (when re-baselined), 4-review.json;
                            2-plan.json sections carry {sid, path, sha256, md, sha_md, stamp} (older entries without
                            md/sha_md are not resumed and are rewritten once) and the ledger also holds
                            tidings_schema_source, tidings_shut_ways, tidings_muster_days
  shots/                    Street 3 captures (git-ignored; last two runs; ≤300 KB per image)
  review-c<k>/              Street 4: metrics.json + cited/ (tracked; files named <NN>-<basename>); shots/ (git-ignored)
  findings/                 Street 4
  punch-list-c<k>.{md,json} Street 4, per cycle (punch-list.{md,json} is kept only as a copy of the latest list)
  device/<date>.json        owner-run device measurements (ST8)
  preview/                  Street 4 preview scratch (git-ignored)
  gates/
    views.json, view/SV1..SV9.jpg     Street 1 fixtures (frozen)
    baseline.json                     Street 1 street-off baseline (per index.html, probe and views.json sha;
                                      never re-measured once the STREET block exists)
    1-research.json, 1-view-answers.json
    2-probes.json (frozen), 2-plan.json
    3-build-S0..S4.json, 3-build.json (each with a top-level tree_digest)
    4-review-c<k>.json (its punch_items [{id, lens, title}] feed the next cycle)
tools/street-probe.js       Street 1 q01 (extended by Street 3 units, never broken)
tools/street-drift.js       the drift check (delivered with the scripts)
index.html                  Street 3 only: the /* STREET */ block + the spec's declared hook lines
```

**Frozen files.** `gates/views.json` + `gates/view/` (a changed rule or a moved focus dies with `fixtures changed (moved: SVn, ...)`
or `fixtures changed (rules)`, then `; delete docs/street/gates/views.json and docs/street/gates/view/ to re-freeze`
and a baseline note), `gates/baseline.json` (re-measured when
index.html, the probe or `views.json` changed, and never once index.html carries the STREET block: it is kept and
staleness is a recorded gap), `gates/2-probes.json` and `fixtures/tidings.json` (frozen while `resume:true`;
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
rolls), then `ANNALS.world.sv` is snapped to the code's `seasonWeights` of the day (CAMERA_RULE: the slow season filter's
steady state, render-only, so the drawn sky and the dark hour depend on the day alone), the camera by
`ANNALS.goto(x, z, R, true)` with yaw 0. SV2's tod is the midpoint of the longest run where the code's own dark-hour
formula at that day is ≥ 0.5 (`--dark-scan`); the dark fallback no longer exists as a recorded outcome: an SV2 frozen
without a dark hour (fallback `dark: none`, or formula < 0.5 at its tod) fails SG1.11. Seeds: `epeshu` and `tamar1374` (filigree Job 3's
procedural smoke seed). The blank-street gate uses SV1–SV8; SV9 is measured only. Street 4 adds 390×844 phone variants
of SV1 and SV2.

### 5.2 The probe

`tools/street-probe.js` is the instrument every gate reads. It serves the repo itself (read-only, `--port`, default an
OS-assigned port), routes the CDNs from `--cdn-dir`, and installs a **virtual clock** before page scripts:
`requestAnimationFrame`, `performance.now` and `Date.now` on a fixed timeline, `Math.random` seeded, the director held,
speed 0, tod pinned. Under it, calls, tris, geometries, object counts, settled hashes and fingerprints are exact and the
degrade ladder never trips. Wall-clock times are never gated. The sim is one IIFE, so none of its bindings (`renderer`, `scene`,
`renderTod`, `_sunDir`, …) is readable from the page: the probe reads the renderer and the scene through its own
`THREE.WebGLRenderer` hook and computes the dark hour from copies of the code's formula (`--dark-scan`), never by
editing index.html. Requests to `fonts.googleapis.com` and `fonts.gstatic.com` are aborted (the sandbox has no network);
exactly those failures are excluded from `console_errors` and the filter is listed in the output field
`console_errors_filter`. The one real-clock mode, `--device`, is owner-run on real hardware and writes
`docs/street/device/<date>.json` (smoothed fps per second over a 60 s descent, the degrade step, and, as it must stamp,
`index_sha`, the sha256 of the index.html it ran against); a pass (fps ≥ 42 throughout, degrade step 0, on the current index.html) is the
precondition for flipping the default (ST8).
The `--device` file shape is `{date, index_sha, seconds: [{t, fps, degrade_step}]}`; Street 3 reads `fps_min` (minimum
`/seconds/<i>/fps`) and `degrade_max` (maximum `/seconds/<i>/degrade_step`) from the newest dated file.

The S0-S4 probe extensions must write each digest field at exactly these `--out` paths (JSON Pointer; copied from
`PROBE_OUT` in `street-3-build.js`, which is authoritative):

- views: `/views/<SVn>/off/{calls,tris,geoms,textures,objects}` (the `street=0` run); `/views/<SVn>/on/{calls,tris,geoms,textures,objects,quads_per_frame,built_tris_per_frame,resident_tris}` (the `street=1` run); `/views/<SVn>/on/classes` (`{<class>: count}`)
- appear: `/appear/violations` (strings), `/appear/slowest_ms`
- swaps: `/swaps/<threshold>/{in,out}`
- oscillate_builds: `/paths/oscillate/builds/<class>`
- flyaway: `/paths/flyaway/{geoms_first,geoms_return,geoms_reseed,resident_max}`
- jobs_max, built_tris_max: `/paths/jobs_max`, `/paths/built_tris_max` (per-frame maxima over every path run)
- vfps: `/vfps/{h30,h60}` (the `--queue-hash` hashes under `--vfps 30` and `60`)
- spacing: `/spacing/{min_gap,dvis_over_dtrue}` (at SV4)
- hash_table: `/hash_table` (`[{hash, ok, got}]`); writer_roundtrip: `/writer_roundtrip`
- stats_keys: `/views/SV1/on/stats_keys` (in order); inst_no_color: `/inst_no_color`
- clouds: `/sky/clouds/{same_day_equal,next_day_differs,deck_matches_weather}`
- shadows_row: `/sky/shadows_row/{held_text,disabled,off_kills_shadow,default_on_equal}`
- weather_dial: `/sky/weather_dial/{exact,counts}` (`counts`: 4 integers)
- tidings: `/tidings/{barriers,musters,off_zero,atlas_equal}` (`atlas_equal` null with no atlas sample)
- fog: `/fog/{present,src_equal,pairs_equal}` (both equality flags null when `present` is false)
- console_errors: `/console_errors` (strings) Street 4 reads the newest device file as `pass`, `fail`, `absent` or
`stale` (no `index_sha`, or one that differs from the current index.html); until `--device` stamps `index_sha`, every
device run reads as stale.

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
(GS.X3), also across runs. The re-baseline measures `restore(index.html)`: it copies the repo (minus `.git`,
`node_modules` and `maps-site`) to a temp tree, writes the restored index.html there (its sha must equal the restore
sha) and runs the probe and the keydown rule on that copy; `off-ref.json` gains `measured_on: 'restore(index.html)'`,
and a probe that cannot serve another tree makes the result `infra`. `state/3-build/index-ref.json` stamps the
reference this run measured against (`pre.restore.sha_restore`, kept or re-baselined), never the post-run restore sha,
plus `restore_ok`, `sha_restore_left`, `undeclared_left`, `hook_faults_left`, `tree_ok`, `tree_digest_pre` and `tree_digest_end`, so the next
preflight refuses (`restore invariant broken:` or `coexistence broken:`, §1.6) instead of absorbing a stray edit. The
proof also requires every declared insert hook to sit beside its declared `hook_lines[].anchor` (`misplaced`: the
anchor text is on the nearest line above or below that is not itself a marked line), `dup_hooks` to cover every declared
hook line (none may appear twice), and the marked lines outside the block to number at most the declared `hook_lines`
count and exactly `hooks_present` + `undeclared`. A run that left hook faults makes the next preflight refuse, and
`index-ref.json` gains `hook_faults_left` (the first three). The filigree anchors are read live from `filigree-1-research.js` and must still resolve (the
preflight's `fil_anchors.n` is the kept entry count; a run fault when it is 0 or differs from the literal count), none
may appear inside the block, and `maps-site/**` + `docs/filigree/**` must hash to the same tree digest after every run
(GS.8). The shots pruner computes that tree rule at the end of every run, gate or not: a difference fails GS.8 when a
gate ran, otherwise it gives reason `units-failed` with a polish-note clause, and either way it is stamped in
`index-ref.json`. The slice gates `gates/3-build-S*.json` and `gates/3-build.json` carry a top-level `tree_digest`. The
spec copy the preflight reads carries counts and canonical lengths for units, checks, hook_lines and caps; a mismatch
is a run fault, so nothing is scheduled from a truncated copy.

### 5.5 Street 1 — blank-street test

Two blind appliers on different models (A sonnet/high, B opus/high, identical prompts) hold only the bible, the views,
the stills, the baseline and greps of index.html (and, for `fil` class ids, the filigree density bible and
`maps-site/data/`); per gate view they name the tier and six bible classes, each with its state and a source ref; a
resolver checks every ref. The appliers are told to use only `id`, `seed`, `day`, `x`, `z`, `R` and `tod` of
`views.json` and to ignore its `rules` and `tests`. The resolver counts sim literals with a node script (`String.indexOf`
on a temp JSON file), not shell `grep -cF`. The radius tiers are fixed constants shared by q15, the integrator, the
patcher and the validator, which checks the bands equal them: T0 [9, 40), T1 [40, 150), T2 [150, 700), T3 [700, 2400),
T4 [2400, 11001). The debt naming rule is fixed in q04, the integrator spec and the validator (`<anon>@<line>`,
`<top-level>`). Questions q10 and q12 carry the lenses recount and canon. A dead completeness critic does not end the
follow-up loop: the critic goes through `crit()` (one retry), and if it still dies the round continues (probe rewrite,
patch, re-gate) with an empty question list.

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
| SG1.11 | probe deterministic, literals 1-8 met (8 = `--dark-scan` checked against the code's formula), fingerprint sensitive; baseline double run equal and measured on the current `views.json` (`views_sha`); SV2 frozen without a dark fallback and inside the dark hour (formula ≥ 0.5) |
| SG1.12 | no new sim state; every determinism debt the grep finds listed (fn named by the fixed rule); keys in canonical form |
| SG1.13 | caps ceiling numeric for SV1–SV9 and ≥ the baseline |
| SG1.14 | every imported filigree class id exists; the filigree bible unchanged during the run |

### 5.6 Street 2 — cold-engineer test

Two blind readers (sonnet/high, opus/high) may read only `street-spec.{md,json}` and answer 28–36 probes frozen before
the spec existed. Probe answers are scored through `norm()` except P-near, P-parser and P-hook-marker, which are scored
whitespace-collapsed exact; the readers are scored against the fixed kind, tol and options, and a frozen probe set
fails readback when a mandatory probe changed them, when a fixed answer holds an unfilled `<...>` placeholder, when a
fixed enum answer is not among its options, a fixed number answer is not numeric, an enum or order probe has no
options, P-key-crowd lacks the form `st:crowd:<settlement id>:day`, or P-hash-param fails ST18 `PARAM_OK`. The probe
readback returns `canon_len`, which the script cross-checks.

| id | criterion |
|---|---|
| SG2.0 | chain held |
| SG2.1 | traceability (bible must-rule → spec rule → unit), DAG, ≤9 units per slice, machine-checkable acceptance |
| SG2.2 | unit files only `index.html`, `tools/street-probe.js` and `docs/street/{fixtures,shots,device}/**`, never the gate, state, research, bible, spec or rulings files or `tools/street-drift.js`; no `.`/`..`/empty segments, backslashes or leading `./`, and the fixtures/shots/device tail has no dot-leading segment |
| SG2.3 | cited literals resolve; each non-null `hook_lines[].replaces` equals exactly one whole `index.html` line (else `not a whole line` / `ambiguous (n lines)`); no hook line holds a filigree or street anchor literal |
| SG2.4 | no source-post name outside `## Provenance` |
| SG2.5 | no spec-probe pointer null |
| SG2.6 | each reader ≥90% |
| SG2.7 | every slice has `/checks`; the mandatory check ids present (12 on every slice, plus per slice: S0 `street.hash_table`; S1 `fade`, `swaps`, `paths`; S3 `vfps`, `spacing`, `caravan_tiers`; S4 `clouds`, `shadows_row`, `weather_dial`, `tidings`, `folk_row` and `fog_copy` when the fog unit exists) |
| SG2.8 | caps for SV1–SV9 numeric, within the bible ceiling; SV5 and SV9 equal the baseline |
| SG2.9 | determinism contract: keyed hash + read-only sim state only; no new sim state; no clock or random token in acceptance commands (grep kinds, `street.static_clock`/`street.static_rng` and text scans that only name the tokens are skipped; tokens are written in bracket form) |
| SG2.10 | hash params `^[a-z]+$`, not ending in `s`, not `s`/`goto`/`filigree`; `notices` consumed only with the S0 parser unit and the hash table |
| SG2.11 | hook lines marked, ≤16, a function hook → replaced line; every `hook_lines` entry with `replaces: null` carries `anchor` (verbatim single-line `index.html` text, exactly one occurrence, no `/*ST-HOOK*/`, not inside the hook's own line; a non-null `replaces` has anchor null), counted by the literal guard and scored here; one `STREET` namespace; a non-empty `block.placement` that the literal guard finds on exactly one `index.html` line |
| SG2.12 | mandatory units present (S0.U00, S0.U01, S0.U02; S4.Ufog only when the atlas fog exists; S4.Unotices iff notices are consumed) |
| SG2.13 | zero banned vocabulary: the ban covers the whole spec body of `street-spec.md` outside `## Provenance` and `## Renames`, plus every JSON `label`, `row`, `text` and `player` string |
| SG2.14 | blindness; zero schema-path guesses |
| SG2.15 | artifacts hashed |
| SG2.16 | limits Street 3 gates on (spec reader returns `/fade/ms`, `/stream/{max_jobs_frame,tri_cap_frame,resident_tris}`, `/traffic/{s0,T,v0}`, `/traffic/tiers` and `/tiers/hysteresis`): `fade.ms` ≤ 250 (R6), `max_jobs_frame` an integer 1..6 (ST9), `tri_cap_frame`, `resident_tris`, `s0`, `T`, `v0` positive numbers, at least 3 caravan tiers with `in_R`/`out_R` hysteresis, and every hysteresis pair 0 < in_R < out_R ≤ 2200; an R6 or ST9 override relaxes only that bound; failures go to the spec fixer as `limits` items |
| SG2.17 | device classes (spec reader returns `/device_classes` as `{<class>: {max_jobs_frame, tri_cap_frame, resident_bytes, ladder_floor_fps, ladder_floor_step, pixel_ratio, instance_frac, draw_dist_frac, weather_step}}`): `desktop` and `phone` present (`tablet` optional); `desktop.max_jobs_frame` and `desktop.tri_cap_frame` equal `/stream`'s; `phone.max_jobs_frame` an integer 1..min(3, desktop's); `phone.tri_cap_frame` ≤ half the desktop's; `resident_bytes`, `ladder_floor_fps`, `pixel_ratio` positive; `ladder_floor_step` an integer 0..3; `instance_frac` and `draw_dist_frac` in (0, 1]; `weather_step` one of 1, 0.75, 0.5, 0.25 (skipped under an ST19 override); failures go to the spec fixer as `limits` items |

### 5.7 Street 3 — the walk test and the slice gates

| id | criterion | from |
|---|---|---|
| GS.1 | every unit of the slice done | S0 |
| GS.2 | fingerprints `never === off === on === ref`, `walk_on === walk_off === ref`, both seeds | S0 |
| GS.3 | street off: every view's calls, tris, geometries, textures, objects equal the reference exactly | S0 |
| GS.4 | street on: every view within its caps; SV5 and SV9 on = off exactly | S0 |
| GS.5 | zero clock, `W.rng` and `nowMs` in the block and zero banned vocabulary in its string literals and the `/*ST-HOOK*/` lines (`vocab_hits`); every InstancedMesh carries instanceColor; one top-level name | S0 |
| GS.6 | no pop (0 → ≥0.9 opacity in one step); ease ≤ 250 ms (R6) | S1 |
| GS.7 | each tier threshold swaps once in, once out | S1 |
| GS.8 | filigree anchors resolve (and at least one filigree literal was recorded at preflight), none in the block; `maps-site/**` + `docs/filigree/**` untouched | S0 |
| GS.9 | console clean, both seeds, on and off (the aborted font hosts are excluded, `console_errors_filter`) | S0 |
| GS.10 | the slice's spec `/checks` pass (results matched by id only; a `--cdn-dir`/`--port` appended to a probe command no longer matters) | S0 |
| GS.X3 | only declared hook lines changed outside the block: restore sha unchanged, `undeclared` = [], no declared hook line twice, every insert hook beside its declared anchor, marked lines ≤ the declared `hook_lines` count (restore invariant) | S0 |
| GS.M | every digest field the slice scores is found at its probe output path (`PROBE_OUT`); a miss is a capture/mapping fault, reason `infra`, no fix unit, never a pass | S0 |
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

Build details the table leaves out. Every unit runs and scores the restore check and syntax-checks `index.html`
(every unit holds its lock); a non-index unit fails as `edited outside unit files: index.html` when the file's sha
differs from the last index-touching unit's. The unit record is verified, not trusted: the writer returns
`acceptance_n`, `runs_failed`, `spec_sha256`, `restore_sha`, the sorted `path:sha` list and `canon_len`, and the script
compares them; the write and the owner-discard edit go through node scripts, not hand edits. The metrics reader gets one explicit JSON
path per digest field (`PROBE_OUT`, below) and reads only those; it returns `not_found`, which is required and limited to
the fields the slice scores, beside the digest, and the read is retried once before GS.M fails. Fix units
(from the diagnoser or the ledger) are rejected when a file path has a `.` or `..` segment, a `//`, a backslash or a
leading `/`, when a dependency is neither a spec unit id nor a `fix-S<digit><n>` id, or when an acceptance `expect` is
empty or whitespace. `re:` expectations are bounded: a pattern longer than 200 characters, with a backreference or with
nested or stacked quantifiers never matches, the tested output is cut to 2000 characters, and fix-unit acceptance with
such a pattern is rejected (Street 2's spec checks that use `re:` get the same limit).

### 5.8 Street 4 — bare-street test

On SV1, SV2, SV4 and SV7, three blind judges (opus/sonnet/opus; J0 sees the opposite A/B order to J1 and J2) see only
the bare and the layered stills. Each names what one has and the other lacks using the bible's class names; an omission
is confirmed in code when the probe counts that class on the layered view and not on the bare one. The blind stills come
from two extra single-layer desktop probe runs in the capture step; a judge view whose layered/bare pair the capture
could not identify fails SG4.2 with no judges run for it, and a gap is recorded.

| id | criterion |
|---|---|
| SG4.1 | zero surviving blocker or major |
| SG4.2 | per view ≥2 of 3 prefer layered, each with ≥3 confirmed omissions |
| SG4.3 | fingerprints re-measured equal |
| SG4.4 | caps met; far views quiet |
| SG4.5 | zero fade violations; swaps 1+1 |
| SG4.6 | zero banned words in STREET-block strings |
| SG4.7 | coexistence clean (filigree anchors resolve and stay out of the block, `restore_undeclared` empty and `restore(index.html)` sha256 equal to `sha_restore` in `state/3-build/index-ref.json` or `off-ref.json`, hash table, stats keys) |
| SG4.8 | blind compliance |
| SG4.9 | every lens returned in round 0; verify coverage ≥75% (a verifier that returns `infra_error` counts against the kept fraction: the finding is ledgered unverified with why `infra` and a gap is recorded) |

Cycles and prior ids. The default cycle is 1 + max(existing cycles, 0), and the already-exists refusal applies to the
derived cycle as well as `args.cycle`. Prior ids, lenses and titles come from `gates/4-review-c<k-1>.json` (its
`punch_items [{id, lens, title}]`), falling back to `punch-list-c<k-1>.json`. A prior id counts as fixed only when a
finding re-reporting it was verified and either did not reproduce or was refuted; every other prior id goes under "Not
re-checked" and into `gate.not_rechecked` and `punch_ids`. The finding cap keeps re-reported prior ids first (a capped
or no-evidence prior id lands in `not_rechecked`); the dedup re-tags a match to an open prior id as a reopen and never
drops it, and a dupe is accepted only when `of` names an earlier candidate or an exact seen title. The gate record
`gates/4-review-c<k>.json` is written with the digest-checked `recordD` (`canon_len` and top-level array lengths), like
the findings file; the list is `punch-list-c<k>.{md,json}` and the plain `punch-list.{md,json}` is only a copy of the
latest. The shot pruner runs before the punch integrator, in the "Punch list" phase: `cited/` files are named
`<NN>-<basename>` and each shot item's `evidence.ref` in the punch list points at its `cited/` copy (the `#x,y,w,h`
region is kept). Finders, reproducers and refuters get the sandbox recipe and always use `--port 0` plus the capture's
kept `--cdn-dir`, whatever `args.port` is; verifiers run in batches of 6. Street 4 dies when `street-bible.json`
`classes[]` is empty, records a gap when no class label matches any judge view's `classes_on` key (a harness fault, not
a build fault), and retries a failed metrics-reader node script once (`infra` only when both attempts fail). The
newest `device_gate` value is `pass`, `fail`, `absent` or `stale` (§5.2).

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
return `chain_ok:false`; Street 4 logs the missing Street 3 chain in plan mode (it throws only in a full run).

**(f) Plumbing chain** in a scratch dir, never under `docs/`: the four jobs with `mode:'smoke'` and the same absolute
`outDir`; smoke uses haiku/low and one item per fan-out, Street 3 writes only dry-run diffs; delete the dir afterwards. Street 4
dies on an unsatisfied `gates/3-build.json` chain only in full mode (smoke and plan log it), so `preview:true` is not
needed in the smoke step. The smoke prompts show the smoke probe path (`<outDir>/tools/street-probe.js`), not the repo's.

**(g0) Bootstrap the CDN directory** (once per sandbox; `--cdn-dir` is the only way the probe gets three and leaflet, since CDNs are blocked): `D=$(mktemp -d) && (cd $D && npm pack leaflet@1.9.4 three@0.128.0 >/dev/null && mkdir leaflet three && tar xzf leaflet-1.9.4.tgz -C leaflet --strip-components=1 && tar xzf three-0.128.0.tgz -C three --strip-components=1)`, then pass `--cdn-dir $D` (the probe routes `<D>/three/build/three.min.js` and `<D>/leaflet/dist/<file>`; the same form as the filigree README §8 (f), and without `--strip-components=1` the files land under `package/` and every browser step fails as `infra_error`). The exact layout the probe expects is the `SANDBOX_ST` string in the prelude (copied from `filigree-3-build.js` `SANDBOX`). The probe aborts requests to `fonts.googleapis.com` and `fonts.gstatic.com` and excludes exactly those failures from `console_errors`, listing the filter in the output field `console_errors_filter`. Playwright comes from `NODE_PATH=/opt/node22/lib/node_modules` and Chromium from `/opt/pw-browsers/chromium-1194/`; both are environment-specific, and a failure to find either is reported by the probe as `infra_error` (never a gate fail). `tools/filigree-capture.js` does not exist, so there is no shortcut.

**(g) App smoke**: the filigree README §8 (f) recipe (npm-packed three r128 and leaflet, Playwright from `NODE_PATH`,
the Chromium path) — or simply `node tools/street-probe.js --fingerprint --seed epeshu --days 400 --cdn-dir <dir>`
once the probe exists. Load `#s=epeshu` and `#s=tamar1374`, wait for `ANNALS.ready`, `simDays(400)`, zero console
errors (the aborted font hosts excluded), with and without `street=1`.

## 9. Owner rulings

Runs proceed on the defaults (embedded in the street prelude's `ST_RULINGS`). Override in `docs/street/rulings.json`
(`{"overrides":{"ST5":"…"}}`) or with `args.streetRulings`; every gate records `street_rulings_used`. Filigree rulings
are cited, never restated: their text is the filigree prelude's (verbatim) plus `docs/filigree/rulings.json`; edit them
only there.

**Confirm before Street 2:** ST1, ST2, ST5, ST8, ST10, ST12.

Street 2 honours overrides of ST5, ST7, ST9 and ST19 (`args.streetRulings` or `docs/street/rulings.json`) and of R6
(`docs/filigree/rulings.json`). The baked default answers (P-dark-hour `render`, P-shadows-default `on`, P-hash-param
`street`, P-fade-ms 250) and the spec-shape and section constants then read "as the overridden ruling states", and the
probe writer fills those answers from the ruling text. An ST5 override adds a `none` option to P-dark-hour. An ST7
hash-param override must pass `PARAM_OK` (ST18) and flows into `hash.params`, `layers.param`, the minimum hash table
and the S0.U00 text. The gate gaps record the overridden ids and the plan preview returns `overridden_baked`. An R6 or
ST9 override relaxes only that bound of SG2.16; Street 3 still gates `fade.ms` ≤ 250 and `max_jobs_frame` ≤ 6.
ST7, ST9 and ST19 keep their defaults on purpose for the phone: SG2.17 reads the phone class against `/stream` and `/weather/steps`, so a phone-specific budget is a `/device_classes` proposal (until the ST8 phone run), never an override of those rulings.

| id | question | default |
|---|---|---|
| ST1 | placement | the sim only, one STREET block plus declared hooks; the atlas, `docs/filigree/` and filigree tools never edited; the atlas-to-sim link belongs to "Sim ↔ atlas continuity" |
| ST2 | scope | generic tiers for every settlement (tamar1374 tests it); Epēshu facades only in Epēshu; ground interpolates the 11.72 m grid, no new relief (R22) |
| ST3 (fixed) | queueing | render-only: meshes move, `departDay`/route/speed never; no accumulator fed by frames; fingerprint identical on/off/never |
| ST4 (fixed) | randomness | `makeStream(W.seed+':st:'+cls+':'+id+':'+day)` cached per key; presentation time from `dt`; no `W.rng`, clock or `nowMs` in the block |
| ST5 | gates at the dark hour | leaves drawn shut while the drawn eclipse lasts; presentation only, never a hindrance to the caravans; "the gates shut at the dark hour"; canon unconfirmed (a veto leaves them open) |
| ST6 | obstacles | one-lane bridges and fords crossed in turn; toll halts hold a dwell; keyed on (seed, route, day); visual only |
| ST7 | layers | rows only, no new keys; `street=1`, default off; sub-rows "roads and folk", "clouds", "weather", "shadows" (on; "held off for speed" at degrade step 3) |
| ST8 | perf evidence | deterministic caps and exact off-identity in the sandbox; owner device run (fps ≥ 42, degrade step 0, 60 s descent, on the current index.html or it reads `stale`) before the default flip |
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
| Street 1 | ≈80 | 180 (plan-mode `agents_bound` is exactly 180: the critic goes through `crit()`, so each follow-up round counts 44) |
| Street 2 | ≈50 | 90 (plan-mode `agents_max` 77: the Record phase is 8, gate + final ledger + two ledger checkpoints, crit each) |
| Street 3 | ≈40 per run (5–8 runs) | 190 per run at `maxUnits:6`, `maxRounds:2` (plan-mode bound 190; Record is 2 + 4 × 2, the pruner going through `crit()`) |
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
  the frozen `gates/views.json`, the baseline and every `research/q*.json` whose evidence re-hashes survive (the baseline
  survives after Street 3 too: once index.html carries the STREET block it is kept and staleness is a recorded gap;
  `views.json` is re-resolved on every run, and a moved focus dies with `fixtures changed (moved: …)`); the
  bible is re-validated against the new class ids and the blank-street gate runs again. Gate records of Streets 2–4
  are then stale and those jobs re-run in order (budget: the Street 1 re-run plus Street 2 again, ≈130 agents beyond
  §11).
- **Street 1 run while Filigree 3 is mid-build.** Allowed, but `index.html` may still move. `gates/baseline.json`
  stores `index_sha`; Street 3 only re-measures the off reference whenever it differs (the `rebaselined` note); it does not
  re-resolve view focuses. A moved focus (Filigree 3 moved the grid or a label focus) is caught by a Street 1 re-run:
  the freezer re-resolves the views every run, and an already-passed gate whose index.html changed since
  `baseline.json` re-checks the views (recount + freezer) before returning `already passed`. A moved focus dies with
  `fixtures changed (moved: SVn, …); delete docs/street/gates/views.json and docs/street/gates/view/ to re-freeze`
  (plus a baseline note), or is caught by a gate failure. Cheapest course: run Street 1 after Filigree 3 is checked.
- **Held for many runs.** Expected until the filigree build passes and its fix items close; the note names what holds.
- **A fingerprint mismatch.** Bisect `never` against `off`: a difference means the hook itself touches sim state.
  `on` against `off` means a street path writes the world.
- **Off-identity failure.** Usually a STREET object created while off, or a foreign sim edit since the last run
  (the gate then shows `rebaselined`).
- **GS.8 tree digest differs.** Something wrote `maps-site/` or `docs/filigree/` during the Street 3 run: a street
  agent breaking the read-only rule (fix and re-run), or a filigree run overlapping it (runs are one at a time; re-run).
- **The atlas fog function does not exist yet.** A recorded gap, never an invented function.
- **A stuck Street 3 unit.** Fix it by hand, then re-run with `args.unstick ["<id>"]`; an obsolete fix unit gets
  `args.discard`, and so does a fix unit whose dependency can never be met or that is done but did not cure its
  criterion (§1.4).
- **`record-mismatch`.** As filigree: Streets 1, 2 and 4 return `gate` (write it to the gate path by hand); Street 3 also
  returns `final_gate` and `state`. The Street 2 ledger `state/2-plan.json` is not returned; a re-run with `resume:true`
  rebuilds it from the files that re-hash, but a re-run on an unchanged bible, rulings and spec files with a passed gate
  returns `already passed` and does not rewrite `street-spec.json` (to redo, delete `gates/2-plan.json` or pass
  `resume:false`).
- **Known limits.** Sandbox counts are not device frames: the default stays off until the owner's device run (ST8).
  The virtual clock could hide a real-clock dependency in street code; the static greps catch the syntax. The VTT
  battle sheet and party presence are out of scope until the owner rules (ST10). Design docs are snapshots.
  The omen eclipse (`tickOmens` writes `W.eclipseUntil = performance.now() + 20000`, a hard-rule edge in sim code) is a
  determinism debt the dossier wanted fixed "before any of this ships". This track only lists it: Street 1's bible must
  carry it (SG1.12), and no street unit, gate or POLISH item fixes it, because the line is sim code outside the STREET
  block. It stays an accepted, recorded debt; fixing it is a separate owner decision. Street code never reads it
  (ST4).

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
