# The living chart: operator's guide

This directory holds the durable record of the owner's request of 2026-10-05 to make the atlas "more alive than a flat
map": footprints along the travel routes, caravans and ships, moving creatures and water, the dark hour, landmark
exhibits, and a "transitive" layer that adds detail as you zoom in. The verified research is
[`research-dossier.md`](research-dossier.md) (a byte copy of the research digest); the terse digest is
[`../research/living-chart.md`](../research/living-chart.md); its inputs and the planning corrections are
[`todo-inputs.json`](todo-inputs.json); the owner's examples and the source names live only in §14.

The work is four jobs, each one saved workflow, run as its own polish run, plus one central install step:

| # | Job | Output | Done when |
|---|---|---|---|
| 0 | Install (central) | the four scripts in `.claude/workflows/` | moved inside the UG11 install window; drift green |
| 1 | Research | living bible | at any frozen view you can name what moves there, what stays still, what drives each and what canon backs it |
| 2 | Planning | living spec | an animator who never heard the owner answers the frozen probes from the spec alone |
| 3 | Implementation | the living chart | with `living` absent the table map is untouched; with it, everything moves from one clock and one control stills it all |
| 4 | Review | punch list | the flat chart makes you wish it moved |

Every gate is scored **by the script** from fixed fixtures: nine frozen atlas views at fixed presentation instants,
the capture's virtual clock, `tools/mobile-capture.js` accept files and the instrument `tools/living-measure.js`. No
gate reads a wall clock and none is a matter of taste.

**This track sits beside Filigree, Street and Mobile and never edits them.** It derives its machinery from the
filigree prelude through the street masks (§0), cites their rulings by id, runs their tools unchanged, reads their
records read-only, and builds only when none of them holds the atlas (§1.3). It never edits `index.html`.

**Source of truth.** The committed scripts `living-{1-research,2-plan,3-build,4-review}.js` are the running truth:
staged in [`design/workflows/`](design/workflows/) until Living 0 moves them into `.claude/workflows/`. Their design
documents in [`design/`](design/) are **planning snapshots** (2026-10-05): where a script and its design disagree, the
script wins. Every script starts with `export const meta = {` on line 1. The prelude's generator is delivered with
them: [`design/build/`](design/build/) holds `living-config.js` (the config region's source), `gen-prelude.js` (the
derivation, with `--splice` for `design/workflow-1-research.md` §0) and `proto-check.js`. The planning session's three
approach studies are not delivered (planning-session only); the design documents carry their conclusions.

**Delivery order.** One delivery commit holds, in this order: `tools/living-drift.js`, the four staged scripts in
`design/workflows/`, this README, `research-dossier.md`, `todo-inputs.json`, `rulings.json`, the rest of `design/`
(`design/build/` included), the `.gitignore` lines, the digest and its index line, the `.claude/CLAUDE.md` pointer,
[`design/DELIVERED.json`](design/DELIVERED.json) (the sha256 of every delivered file but POLISH.md), and last the
POLISH.md entries. It lands only while no mobile-build or mobile-review run is live (the mobile whole-tree snapshot
covers `tools/` and `.claude/`). Living 0 requires `DELIVERED.json` and then installs the scripts in its own commit
(§1.10). If the delivery is cut short, POLISH.md is not written, so no queue entry names a missing script.

## 0. Lineage: what is copied, cited, ported, run, read, and new

| kind | what | how drift is caught |
|---|---|---|
| **copied** | filigree prelude v1, through the street prelude: the same seven whole-line masks (START, END, OUT, DOCS, FULLOUT, J1FORCE, ANCHORS) with living values, and one living config region in place of the street one (`design/workflow-1-research.md` §0 states the derivation exactly) | `tools/living-drift.js` L1 (masked prelude = filigree prelude v1), L2 (the four living preludes identical), L0 (the filigree preludes identical and `tools/street-drift.js` exits 0); every living preflight runs it |
| **copied with a stated change** | `recordL` = filigree-1's `recordD` with its name and `M('triage')` for `M('mech')` (a record relays a 64-hex sha; haiku altered single digits on 2026-10-05) | L4 |
| **copied verbatim** | `canonJ`, `fnv`, `lenOk` (the relay check of `mobile-build.js` and `tools/mobile-tree.js`); the sandbox recipe of `filigree-3-build.js` plus `mobile-build.js`'s four font packages (captures render the production fonts) | L3 |
| **cited by id** | filigree R6, R10, R12, R13, R15, R16, R18, R22 (texts: the prelude's `RULINGS` + `docs/filigree/rulings.json` overrides); street ST1, ST3, ST4, ST7, ST18 (texts: `street-1-research.js` `ST_RULINGS` + `docs/street/rulings.json`); UG1-UG11 (`docs/mobile/gates.md`); density-bible classes B-18, B-37, B-41, B-42 | L5 (ids exist); Living 1 stamps the texts and the source shas; Livings 2-4 refuse when they moved |
| **ported** | the job skeletons of Street 1-4 and Filigree 1-4 (questions → lenses → integrator → validator → paired blind appliers → resolver → critic; frozen probes → sections → integrator → anchors → red team → paired blind readers; slices, ledger, stuck at 3, diagnoser; finders → reproduce/refute/severity → blind panel) and the `mobile-build.js` per-unit loop (accept file authored blind, whole-tree snapshot, scope, measured acceptance, ≤ 2 fixes, restore) | owned by this track; reviewed as new code |
| **run, never edited** | `tools/mobile-capture.js` (`--atlas` captures with `--out`/`--shots-dir` under `docs/living/`, `--accept … --capture … --ref`, `--lint-accept`, and its exported functions inside the instrument); `tools/mobile-tree.js` (snapshot, check, restore); `tools/build-offline-manifest.js` (`--atlas`, `--atlas --check`); `tools/street-drift.js` (exit code); `tools/filigree-dem.js` (the sea-mask check) | L7 (every name the instrument requires is exported); the Record hold re-reads their shas (`tools_other`) |
| **read-only** | `index.html` (the dark hour, `W.agents`, `routePos`, the dragon), `maps-site/**` outside the living files (Livings 1, 2, 4), `docs/{filigree,street,mobile}/**`, `.claude/**` (agents), `tools/{filigree,street,mobile}-*`, `server.js`, `vendor/` | `RO_RULE_LC` in every prompt (`PL(...)`); the coexistence shas of `--hold` at preflight and at Record |
| **new** | the living config region, the four job bodies, `tools/living-drift.js`, `tools/living-measure.js` (Living 1), `tools/living-sea-mask.js` and `tools/living-rivers.js` (their POLISH items), `maps-site/living.js` and `maps-site/living/**` (Living 3), these docs | review effort goes here; `living-drift --self-test` proves the checker |

**Weather has one owner per app.** Street owns the sim's sky (cloud deck, shadows, the weather dial: ST7, ST19; the
R13 fog copy: ST11). LC-weather on the atlas is a seeded atlas function of (place, snapshot sim day) built on the R13
fog function; it reads no `W.weather`, no Street weather dial and no sim state, and adds none to the sim (Living 2
probe `P-weather-source`). Caravans and ships inside the window read the exported sim snapshot; nothing is added to
the sim.

**Never edit a filigree, street or mobile file from this track**, and never add a block to
`docs/filigree/todo-inputs.json`: Filigree 2 never reads that file (`filigree-2-plan.js` names it only in the comment
on line 34; its inputs are the dossier, the README reuse map, the density bible and the `rulings.json` overrides), so
a living block there would be dead text, and the only route to the sheet spec would be a Filigree 1 re-integration
that re-stamps the bible and forces Street 1 to re-run. A filigree or street change that moves the prelude stops this
track with `prelude drift: …` until the living prelude is re-derived (§12).

## 1. Protocol

1. **One job per polish run.** The living block sits directly above `## Done`, after the street block, so the
   owner's earlier requests keep their order. A polish run takes the top unchecked item, as usual: a living job is
   reached when every item above it is checked, blocked or held. Living 1 waits for Filigree 4 anyway, the zoom scope
   for Street 4. To run a living job out of order the owner moves its entry or invokes the Workflow explicitly; the
   preflight (gate files, chain, hold) still applies and nothing overrides it except Livings 2-4's `args.force`
   (recorded, never a pass).
2. **The order is enforced by gate files.** Each preflight refuses (throws) unless the previous gate says
   `"pass": true` and its key artifact is unchanged:
   - Living 1 needs the latest `docs/filigree/gates/4-review-c<k>.json` a full unforced pass (`living research waits
     for the finished table map: …`) and "Atlas reduced motion for its own animations" checked (`living research waits
     for the atlas reduced-motion item`); Living 0, "Traced road network" and "Sim ↔ atlas continuity" are POLISH
     blockers only (in plan mode every unmet chain is reported as `chain_ok:false`, never thrown);
   - Living 2 needs `gates/1-research.json` (`planning must not start before the living bible exists: …`), the
     filigree density bible and the cited rulings unchanged since Living 1 (`the filigree density bible changed since
     Living 1; re-run living-1-research`, `the cited rulings changed since Living 1 (…); re-run living-1-research`);
   - Living 3 needs `gates/2-plan.json` and an unchanged spec (`build must not start before the living spec passes:
     …`), the Living 1 stamps as above, `slice Lx refused: earlier slice Ly has not passed its gate`, `living-spec.json
     has no /checks for slice Lx: re-run living-2-plan`;
   - Living 4 needs `gates/3-build.json` (zoom: `gates/3-build-Z.json`) a full unforced pass with the spec unchanged
     (`review must wait for the finished living chart: …`); a cycle-2 run returns `reason:'blocked'` while a cycle-1
     punch item is open.

   A thrown prerequisite is treated as blocked: leave the item unchecked, note it, take the next item.
3. **The hold (computed in code; no override).** Every job relays `node tools/living-drift.js --hold` (one JSON line
   with `len`/`sum`; a mis-relayed line counts as held) and computes `holdOf(hold, scope)` from the config:
   - **every job** holds while a mobile or street tool runs (`tools/(mobile-capture|mobile-tree|street-probe).js`) or
     any `Mobile N` / `Mobile Nb` / `Mobile N fix K` item other than Mobile 15 is unchecked;
   - **Living 1 and Living 3** also hold while "Mobile later · census pin names on phones (A12 part b)" or any
     `Filigree 3 stuck unit` / `Filigree 4 punch c` / `Filigree data —` item is open;
   - **Living 3** also holds while the latest filigree 4-review gate is not an unforced pass;
   - **Living 3 with `scope:'zoom'`** also holds while the latest street 4-review gate is not an unforced pass, a
     `Street 3 stuck` / `Street 4 punch c` / `Street data (S3) —` item is open, "Sim ↔ atlas continuity" is
     unchecked, or `street=1` and the Street frozen views are absent.

   Why: mobile-build snapshots the whole tree (`index.html`, `maps-site/`, `tools/`, `.claude/`, `server.js`,
   `vendor/`) and flags any write outside its unit, and a Mobile lane review scores against its first unit's
   reference. The docs-only jobs (Livings 2 and 4) write nothing that snapshot covers, but every job reads
   `maps-site/index.html` (Living 2's hook anchors, Living 4's captures), which an open Mobile atlas item may be
   rewriting between units; an open item is the only machine-readable sign of a lane in flight, since `pgrep` cannot
   see a mobile-build run in its agent phases. An owner-gated Mobile 5b therefore holds every living job until the
   owner rules it; when it is the only hold left, the central session asks once and notes the date; Filigree 3 holds both app files and its fix cycles re-run its gate; Street 3 digests `maps-site/**` at
   the start and end of every run (GS.8). The hold never reads `docs/mobile/state.json` app shas, which stay different
   after any legitimate app edit. `held` means: no release, no box, note it, take the next non-conflicting item.
   **Parallel sessions:** no living job runs in a parallel session with a mobile-build or mobile-review run, and Living
   3 (and the sea-mask and river items) never runs beside Filigree 3, Street 3, Street 4 or a Street punch run, in
   either direction; the Record re-read turns a missed overlap into `coexistence broken: …`. A live Street 3 run is
   visible to the machine only while its probe process runs (`busy`) and afterwards through `shas.street_state3`;
   between Street 3 runs nothing is live. A Street 3 Workflow in another session is checked by the central session.
4. **Living 3 is multi-run.** Slices L0 instrument and hooks → L1 the still chart, the clock and the dark hour → L2
   routes and traffic → L3 sea, sky and creatures; the zoom scope has the one slice Z. Each run builds up to `maxUnits`
   ready units of the current slice, strictly one at a time (every unit holds `maps-site/index.html` and
   `maps-site/living*`), and runs the slice gate when the slice is complete. Leave the item unchecked between runs with
   the returned note; check it off only on `check_off: true`. Stuck items are queued once, directly above Living 3 (or
   3z): `Living 3 stuck unit <id> — …` (3 failed runs; `args.unstick` after a hand fix) and `Living 3 stuck criterion
   <S> <id> — …` (a fix unit that did not cure its criterion; `args.discard`).
5. **What the polish run does with the return value.**

   | Return field | What the run does with it |
   |---|---|
   | `polish_note` | the one-line result note |
   | `polish_inserts` | new items, placed directly above `polish_inserts_above`; skip any whose title is already queued |
   | `polish_inserts_above` | `Living 2 · Planning` (Living 1 gaps), `Living 3 · Implementation` (Living 2 data items, Living 3 stuck units), `Living 3z · The zoom-through` (its stuck units), `Living 4 · Review → punch list` (punch items), `Living 4z · Review the zoom-through` (its punch items) |
   | `changelog_line` | goes into `CHANGELOG.md` (§1.7) |
   | `pass` / `check_off` | decides the checkbox (`check_off` for Living 3 and 3z, `pass` otherwise) |
   | `held_by`, `blocked_by`, `scope`, `slice`, `cycle`, `gate`, `final_gate`, `agents_bound` | informational, except record-mismatch recovery (§12) |
6. **Reason codes.** Filigree's (filigree README §1.6) with these living specifics:
   - `held` (every job): §1.3. No release; take the next item.
   - `blocked` (Living 3): an open `Living data — <item> (<slice>)` item naming the slice in its bold title (Living 2
     writes it there, e.g. `**Living data — re-cut the traffic snapshot (L2)**`), the sea-mask item open for the L3
     water units, or no buildable unit; (Living 4): cycle 2 while a cycle-1 punch item is open. Same handling.
   - `prelude drift: L…` (thrown, any job): a run fault. No release; fix per §12.
   - `infra`, `agent died: <label>`: no release when nothing was built; the next run retries. In Living 3 units built
     before an `infra` are still committed (and released per §1.7) with the returned `changelog_line`.
   - `gate-fail`, `units-failed`, `smoke-fail` (Living 3), `coexistence broken: …` (Livings 2-4), and comma-joined
     criterion ids (Livings 1 and 2 join with `,`, Living 4 with `, `): leave the box unchecked.
   - **Which thrown string is which** (match the text after the `<job>: ` prefix):

     | class | thrown-string prefixes | action |
     |---|---|---|
     | blocked | `living research waits for`, `planning must not start before`, `build must not start before`, `review must wait for the finished living chart`, `slice Lx refused`, `living-spec.json has no /checks`, `the filigree density bible changed since Living 1`, `the cited rulings changed since Living 1` | leave unchecked, note it, take the next item |
     | run fault | `prelude drift:`, `anchor lost:`, `missing inputs:`, `fixtures changed (moved: …)`, `gates/2-probes.json is invalid (…)`, `scheduler:`, `the instrument dropped a Living 1 key`, `restore invariant broken:`, `restore failed for`, `a third review cycle is refused`, `gates/4-review…-c<k>.json already exists`, `living ruling … is a fixed constraint`, every argument-validation throw (`args.… must …`, `unknown arg …`, `unknown living ruling …`, `args.force is not accepted by Living 1 …`, `args.rulings sets the filigree R1..R22 and is refused here …`, `args.units: … is not a ready unit`, `full runs write the durable record`, `smoke runs must pass an absolute`, `unknown ruling …`, `ruling … must be …`, `unknown role …`, `living ruling … must be …`); **catch-all:** any throw not in the other rows | no release; fix per §12; note it |
     | infra | `agent died: <label>` (any null `crit` slot after its retry, e.g. `agent died: drift`, `agent died: reader B`), `infra` (a tool `infra_error`, including `capture busy` after `RO_RULE_LC`'s 20-minute wait for a foreign capture), Workflow name unresolved | no release; the next run retries |

   - `nothing to build` (Living 3), `already passed: …` (Livings 1 and 2), `record-mismatch` (§12), `forced: <reason>`,
     `plan`, `preview`: as in filigree.
7. **Releases** (R15 cited). While the owner's feature-branch note stands (`docs/mobile/owner-answers.json`
   `notes.releases`: "keep work on the feature branch; versioned cuts happen at merge"), the central session commits
   each run's paths without tagging or pushing; the returned `changelog_line` accumulates in `CHANGELOG.md` and the cut
   happens at merge. Otherwise each living run ends in a prerelease re-cut of the current scope (`X.Y.Z-alpha.N`, bump
   N; `VERSION` + `CHANGELOG.md`, one release commit, tag, push), per `.claude/CLAUDE.md`. Docs-only runs (Livings 1,
   2, 4 without fixes) use a `docs:` CHANGELOG line. The central procedure, since agents never run git: (1) require a
   clean tree for the other tracks: `git status --porcelain` lists no path outside `docs/living/`, `tools/living-*`,
   `maps-site/living.js`, `maps-site/living/`, `maps-site/index.html` (Living 3 only), `maps-site/data/offline-manifest.json`
   (Living 3 only), `POLISH.md`, `VERSION` and `CHANGELOG.md`; (2) run the job; (3) stage only the
   paths the job wrote (`docs/living/**`, `tools/living-*.js`, and for Living 3 `maps-site/living.js`,
   `maps-site/living/**`, `maps-site/index.html` and `maps-site/data/offline-manifest.json`), plus `POLISH.md`,
   `VERSION` and `CHANGELOG.md`; (4) squash per `.claude/CLAUDE.md` "Cutting a version", never mixing another track's
   WIP commit; (5) only when cuts are allowed: tag and `git push --follow-tags` (the CLAUDE.md hotfix exception, with
   `--force-with-lease`, if a living commit, the delivery commit included, was already pushed). The delivery commit and
   the Living 0 commit have no release of their own: the next cut absorbs them.
8. **Git.** Agents never run git and never edit POLISH.md, CHANGELOG.md, VERSION or `.claude/`. The polish run commits.
9. **The living chart ships off** (LC1, R18 cited): `living=1` plus a layers row, both absent until the param is set,
   until Living 4 passes **and** an owner-run real-device pass (the Mobile 15 checklist plus the still-chart control
   and battery at the table). Then the owner flips the default by an LC1 override.
10. **The install window and Living 0.** A new `.claude/workflows/*.js` file is pipeline drift for every later mobile
    capture: UG11 compares `pipeline_sha` over the union of keys (`tools/mobile-capture.js` ~1406-1408), and
    `mobile-review.js` scores a lane's combined acceptance against `START_REF`, the first lane unit's `ref_before`,
    which `mobile-build.js` freezes once a unit has passed; a copy during a unit makes mobile-build raise UG11, restore
    `.claude/` from its snapshot (deleting the new scripts) and halt the item. So the four scripts are staged under
    `design/workflows/` (outside the mobile tree and the pipeline key set) and Living 0 moves them when `node
    tools/living-drift.js --install-window` prints `"open":true`: no mobile or street tool running, and Mobile 9 and
    Mobile 14 checked with no open `Mobile 9 fix K` / `Mobile 14 fix K` item (then no mobile-build or mobile-review run
    can follow). Earlier only with `--idle-confirmed`, passed by the central session after it has checked every open
    session for a running mobile-build or mobile-review Workflow (`pgrep` cannot see a run in its agent phases), and
    only while in each lane (atlas: Mobile 4-8 and 5b; sim: Mobile 10-13) no lane unit has passed. A lane unit is a
    `docs/mobile/units.json` unit whose `run` names one of those items or a `Mobile 9 (fix K)` / `Mobile 14 (fix K)`
    run; D1, D2, D6 and the other shared units are not. Living 0 is run by the central session (a polish run that
    reaches it hands it over), in its own commit; its exact commands are in its POLISH entry.

## 2. Invocation

| Situation | Call |
|---|---|
| Fresh session, scripts installed | `Workflow({name:'living-1-research', args:{date:'<today>'}})`; likewise `living-2-plan`, `living-3-build` (`scope:'zoom'` for Living 3z), `living-4-review` (`scope:'zoom'` for Living 4z) |
| A name that does not resolve, or the session that edited a script | `Workflow({scriptPath:'/home/user/annals-kingdom/.claude/workflows/living-1-research.js', args:{date:'<today>'}})` |
| Before Living 0 (previews only) | `scriptPath:'/home/user/annals-kingdom/docs/living/design/workflows/living-<n>-<stage>.js'` with `mode:'plan'` or `mode:'smoke'` |
| The Workflow tool is unavailable | stop; `reason:'infra'`, note "Workflow tool unavailable", no release |
| Preview the cost | `args:{date, mode:'plan'}`; stop if `agents_bound` exceeds the recorded value of §11 (the cap is the hard limit) |
| Resume a killed run in the same session | `Workflow({scriptPath, resumeFromRunId})` |
| Resume across sessions | re-run with `resume:true` (the default) |

`date` is today's date as `YYYY-MM-DD` from the session environment (scripts cannot read the clock). Plan mode is not
a polish result. Every job's plan preview throws only `anchor lost` and `prelude drift` (faults of the package or the
checkout); missing inputs and an unsatisfied chain (Living 1: the Filigree 4 wait and the reduced-motion item) are
reported as `chain_ok:false` with `missing`, and the schedule is still returned, with `held_by`/`blocked_by`. Cross-session resume: Living 1 skips questions whose evidence re-hashes and
never re-freezes the views or `L0`; Living 2 resumes frozen probes and sections from its checkpoints; Living 3 resumes
per unit from `state/3-build/`; Living 4 is one cycle per run.

## 3. Args

**Shared** (the prelude's rules with the living outDir): `date` (required), `repo`, `outDir` (default `docs/living`;
full mode must stay under it; smoke needs an absolute dir outside the repo), `mode` (`full|smoke|plan`; smoke forces
haiku/low and one item per list), `maxRounds` (0..2), `resume` (default true), `force` (Livings 2-4: a non-empty
reason; Living 1 rejects it). **`rulings` is refused**: filigree R overrides come only from
`docs/filigree/rulings.json`; use `livingRulings` (keys ⊆ LC1…LC17, non-empty strings; LC2, LC3, LC10, LC12, LC13 are
fixed and refused). `port` (default 0 = an OS-assigned free port; 1024..65535 otherwise; 8544 refused: it belongs to
`server.js`). Unknown keys are rejected.

| job | extra args |
|---|---|
| Living 1 | `livingRulings`, `port`, `cdnDir` (absent: each capture relay builds its own CDN dir per §8.6) |
| Living 2 | `livingRulings` (reads the merged non-fixed rulings as answers; the baked probes never move) |
| Living 3 | `livingRulings`, `port`, `scope` (`motion` \| `zoom`), `slice` (L0-L3 or Z; default the first slice without a passing gate stamped with the current spec sha), `maxUnits` (1..6, default 6), `units`, `unstick`, `discard` (`^fix-(L[0-3]|Z)\d+$`), `gate` (`auto` \| `skip` \| `only`), `cdnDir` |
| Living 4 | `livingRulings`, `port`, `scope`, `preview` (boolean), `cycle` (1..2; derived when absent), `cdnDir` |

## 4. Outputs

All under `docs/living/` unless stated; git-ignored: `shots/` (incl. `shots/loop/`), `review-c*/shots/`,
`review-z-c*/shots/`, `preview/`, `design/build/prelude.js` (generator output).

| path | written by | note |
|---|---|---|
| `README.md`, `research-dossier.md`, `todo-inputs.json`, `rulings.json`, `design/` (incl. `design/build/`, `design/DELIVERED.json`) | delivery | `design/workflows/` empties at Living 0 |
| `research/q02–q14.json` (13; q01 is the instrument), `research/f<r><n>.json` | Living 1 | evidence |
| `living-bible.{md,json}` | Living 1 | the bible |
| `fixtures/toy/` | Living 1 | the instrument's toy layers (served from a temp copy only) |
| `gates/views.json`, `gates/view/LV1–LV9.png`, `gates/view-data.json`, `gates/measure-keys.json` | Living 1 | **frozen**; re-freeze only by deleting `views.json` and `view/` |
| `captures/L0.json` (+ `shots/L0/`) | Living 1 | the living-off reference; later references `captures/L0-r<n>.json` by Living 3's rebase |
| `gates/1-research.json`, `gates/1-view-answers.json`, `state/1-research.json` | Living 1 | |
| `spec/s01–s12.{md,json}`, `living-spec.{md,json}`, `gates/2-probes.json`, `cold/`, `gates/2-plan.json`, `state/2-plan.json` | Living 2 | `2-probes.json` frozen; regenerate only with `resume:false` |
| `accept/<id>.json`, `accept/<id>.on.json`, `accept/slice-<S>.json`, `captures/<id>.json`, `captures/<id>.on.json`, `captures/gate-<S>.json` | Living 3 | |
| `state/3-build/<id>.json`, `state/3-build/atlas-ref.json`, `state/3-build.json`, `gates/3-build-L0..L3.json`, `gates/3-build.json`, `gates/3-build-Z.json` | Living 3 | |
| `review-c<k>/`, `findings/`, `punch-list-c<k>.{md,json}`, `punch-list.{md,json}`, `gates/4-review-c<k>.json`, `state/4-review.json` (zoom: `review-z-c<k>/`, `punch-list-z-c<k>.*`, `gates/4-review-z-c<k>.json`) | Living 4 | a cycle's gate is never overwritten |
| `accept/LRM.json`, `captures/LRM-before.json`, `captures/LRM.json` | "Atlas reduced motion …" item | |
| `spike/` | the H1 spike item (owner-gated) | never served |

Outside `docs/living/`: `tools/living-drift.js` (delivery), `tools/living-measure.js` (Living 1, extended by Living
3), `tools/living-sea-mask.js` + `maps-site/living/sea-mask.png`, `tools/living-rivers.js` +
`maps-site/living/rivers.json` (their items), `maps-site/living.js`, `maps-site/living/**`, the declared `/*LC-HOOK*/`
lines of `maps-site/index.html` and `maps-site/data/offline-manifest.json` (Living 3).

## 5. Gates

Gate criterion ids: the Filigree README uses bare `G1.x`, `G2.x`, `G3.x`, `G4.x` for its own gates. In prose that
could mean either track (and in any grep across `docs/*/gates/`), write the living ids with the track, e.g. "living
G4.6"; a bare G-id in a filigree document always means the filigree gate. The living records live only under
`docs/living/gates/`, so a path always disambiguates.

### 5.1 Fixture views (rules in Living 1; resolved and frozen once)

| id | view | rule | scored |
|---|---|---|---|
| LV1 | The Whole Chart | the atlas's whole-chart fit | yes |
| LV2 | The Pēshunor north coast | `docs/filigree/gates/views.json` V1 centre and zoom | yes |
| LV3 | Sepos to the White Sea | `party-route.json` indices 7-8 (0-based: Sepos, White Sea), the country band midpoint | yes |
| LV4 | The far north | `party-route.json` indices 2-4 (0-based: Watchwater, Far North, Fell Mountains; a teleport leg), the country band | yes |
| LV5 | Epēshu at the city band | `city-anchors.json` Epēshu, midway between `Z_TIER_D` and `Z_OPEN_MAX` | yes |
| LV6 | Epēshu at the zoom-through threshold | Epēshu at `Z_OPEN_MAX` + 0.5 | yes |
| LV7 | The Fell Mountains | `party-route.json` index 4 (0-based: Fell Mountains, 782, 8), the region band (Lugal's still mark) | yes |
| LV8 | The White Sea in storm season | `maps_markers.json` White Sea, the country band, the snapshot's late-1374 day | yes |
| LV9 | Open sea (control) | the centre of filigree fixture F08, z7 | control only |

Instants: t0 = 0 ms (the still frame, outside the dark hour), t1 = 4000 ms, tDark from `--dark-scan`; one presentation
day is 300 s. Profiles: on-state desktop and iphone13; off-state all five. A moved focus or a changed rule on a rerun
dies with `fixtures changed (moved: LVn, …); delete docs/living/gates/views.json and docs/living/gates/view/ to
re-freeze`.

### 5.2 The instrument (`tools/living-measure.js`)

Written by Living 1 over `tools/mobile-capture.js`'s exported functions (`startServer`, `launch`, `loadPlaywright`,
`resolveCdn`, `openPage`, `pump`, `PROFILES`, `clockTokens`, `imageDiff`, `pngDecode`, `pngEncode`, `braceRange`;
L7 checks each is exported). Its own server on `--port` (0), never 8544; never writes `docs/mobile/`. Every summary
prints one JSON line with `len`/`sum` (the `tools/mobile-tree.js` scheme). Modes: `--self-test` (toy layers that break
each rule must fail exactly their metric), `--freeze-views`, `--check-views`, `--view-data`, `--keys`, `--dark-scan`,
`--freeze-summary`, `--frames` (scenarios `moving still reduce hidden card layer-off below-band offscreen zoom-anim
block-chunk coexist`), `--static [--hooks]`, `--export-traffic`, `--validate-bible`, `--resolve-refs`,
`--spec-summary`, `--resolve-pointers`; Living 3's L0 adds `--gate-summary`, `--lint-on`, `--score`. Keys are only
ever added (`gates/measure-keys.json`).

### 5.3 The presentation-clock protocol

Presentation time accumulates the rAF timestamp argument with dt clamped to 100 ms; it stops while the page is hidden,
the layer is off-screen, below its band, off, under a card, or still. It never reads `Date`, `performance.now` or
`Math.random`; positions are pure functions of (seed literal, class, id, snapshot day, presentation time) through keyed
streams `lc:<class>:<id>:<k>`. Under the capture's virtual clock every frame is frozen, so the off-state shots (taken
under reduced motion with animations disabled) are the still frame, and `--t` pumps the virtual clock to an instant.

### 5.4 The off reference, the restore invariant and coexistence

- **Off identity**: with `living` absent the atlas must equal the reference: `node tools/mobile-capture.js --accept
  <file> --capture <capture> --ref <ref>=docs/living/captures/<ref>.json`, gates UG1, UG2, UG3, UG6, UG7, UG8 (no
  declared region), UG10 (declared growth = the hook bytes, +0 requests), UG11; UG4, UG5 and UG9 waived with fixed
  reasons. **UG4** hard-fails once a `/* FILIGREE */` or `/* STREET */` marker exists, so its other halves are
  re-scored from the capture's repo block (no anchor missing, `street_drift_exit` 0, `tithe_lines` and `markers`
  equal the reference's). **UG9** reads `docs/mobile/README.md`, which this track never edits, so living strings are
  scored against §13 and `VOCAB_LC`.
- **Captures** always pass `--out` and `--shots-dir` under `docs/living/`, and `--accept` always runs with
  `--capture`: without them the tool writes `docs/mobile/captures/<unit>.json` or `docs/mobile/shots/`.
- **Restore invariant**: every changed line of `maps-site/index.html` is a declared hook marked `/*LC-HOOK*/`;
  restore (each hook back to the line it replaced) must reproduce the sha in `state/3-build/atlas-ref.json`. An
  undeclared or misplaced hook throws `restore invariant broken: …`; a different restore sha is a foreign atlas edit
  and triggers a rebase.
- **Rebase**: the reference is re-taken on a temp copy of the repo with restore(`maps-site/index.html`), without the
  living files, with the live offline manifest, by the copy of `tools/mobile-capture.js` inside that tree; triggers:
  no reference, its shots missing, a foreign atlas edit, a changed pipeline script (UG11), a changed capture tool, or a
  changed manifest or other `maps-site/` file. Recorded `rebaselined`.
- **Manifest**: `tools/build-offline-manifest.js` walks every file under `maps-site/`, so every living run that
  changed a `maps-site/` path regenerates `maps-site/data/offline-manifest.json` (when it exists) and requires
  `--atlas --check` to exit 0.
- **Coexistence**: `--hold` at preflight and at Record; `index.html`, `docs/filigree/**`, `docs/street/**`,
  `docs/mobile/**`, `.claude/workflows/*.js`, the other tracks' tools, `docs/street/state/3-build.json` and
  `maps-site/**` outside the living files must not change during a run.

### 5.5 Living 1 — the still-frame test (G1.1-G1.14)

Two blind appliers (sonnet/high, opus/high) holding only the bible, the frozen views and stills, `view-data`, `L0`,
`maps-site/data/` and the filigree density bible name, per gate view LV1-LV8, the classes that move there and ≥ 2 that
stay still, each with driving state, canon tier, still frame and a source ref. Scored in code: G1.1 moving sets equal
the set computed from the bible's own bands and zones on ≥ 7/8 views (Jaccard ≥ 0.75 on all); G1.2 still sets; G1.3
state and tier ≥ 95%; G1.4 refs ≥ 90% (no view below 75%); G1.5 every moving class has a source feature in the view;
G1.6 canon tiers equal the research table, invented devices off and owner-gated, sourceless devices deferred with a
POLISH home, the rise ruled out; G1.7 LV9 moves nothing beyond the sheet-wide classes; G1.8 zero silence; G1.9
checklist 27/27; G1.10 no forbidden rule (sim state, pane, clock token, WebGL, `notices=` write); G1.11 the instrument
self-test, double run and contract; G1.12 nine views frozen and `L0` clean; G1.13 voice; G1.14 blindness and
coexistence. At most 2 follow-up rounds; then `Living gap — <criterion>` inserts above Living 2.

### 5.6 Living 2 — the cold-animator test (G2.1-G2.15)

≥ 30 probes frozen before the spec (baked answers: `living`, default off, no rise, the whole-sheet dim, 20/15/30
draws, the 100 ms clamp, the `setHash` keep, the snapshot path, `notices=` read only, H2z then H2, the 200-byte hook
cap, UG4 waived, the `lc:` key, t0 still, 250 ms, zero panes, zero clock tokens, no WebGL, the weather source). Two blind readers on the
spec alone: G2.1 ≥ 90% each; G2.2 no schema-path guess; G2.3 no null pointer; G2.4 bible rule → spec rule → unit
trace; G2.5 DAG, ≤ 8 units per slice, allowed files only, L0.U01 the instrument extension; G2.6 the mandatory checks
per slice; G2.7 hook lines (declared, marked, found once, no other track's anchor literal, ≤ 200 raw bytes, the
`setHash` keep); G2.8 the param; G2.9 caps; G2.10 no rise; G2.11 gated devices absent; G2.12 the accept template and
its waivers verbatim, lint clean; G2.13 voice and source names under `## Provenance` only; G2.14 prerequisites with
status (missing → `Living data — <item> (<slice>)` inserts, the slice inside the bold title); G2.15 probes before
the spec, readers blind.

### 5.7 Living 3 — the still-chart test and the slice gates (GL.1-GL.14)

Per unit: accept file (authored blind) → snapshot → implementer → syntax, scope and static check → off-state accept
and on-state score (both in code) → ≤ 2 fixes → restore on failure. Per slice (and again over every slice in the
final gate): GL.1 off identity; GL.2 UG4 and UG9 re-scored; GL.3 still frame and determinism (double run, both
profiles); GL.4 moves (moving classes move, still classes stay; its "at least one moving class" floor is vacuous for any slice whose spec lists no device moving in [t0, t1], computed in code from the spec: a spec device of the gated slices that the bible lists as moves, default on, status build, a device the bible lacks counting as a mover, and the dark-hour device counting only while Living 1's tDark is a number ≤ t1 (LC11 puts t0 outside the dark hour; with no tDark no frame shows its dim); unrelayed spec or bible devices keep the floor (fail closed); L0 is always vacuous; no other slice, Z included, has an exemption: the same computation decides it; Living 4's G4.4 applies the same rule per slice); GL.5 the still chart (control and reduced motion:
frozen, every class kept, 0 rAF, journey paused, the control ≥ 44 px with its words); GL.6 stops (hidden, card, layer
off, below band, off-screen: 0 rAF) and draws per second; GL.7 zero clock tokens and forbidden names in the living
files; GL.8 zoom sync (≤ 1 px after `zoomend`, transformed during `zoomanim`); GL.9 appear (≤ 250 ms); GL.10 lazy
failure silent; GL.11 bytes (≤ 200 raw hook bytes, lazy caps, the manifest check); GL.12 coexistence (`filigree=1`
with `living=1`, no label overlap, `index.html` sha unchanged, hold shas unchanged); GL.13 phone parity (delay, never
drop); GL.14 the slice's spec checks. The final gate adds the smoke (both apps, both seeds, zero console errors).

### 5.8 Living 4 — the flat-chart test (G4.1-G4.8)

Eleven blind single-lens finders; each finding reproduced (sonnet/medium), refuted (opus/high) and rated
(sonnet/low), surviving on 2 of 3. Three blind judges (opus/sonnet/opus, fixed A/B order) per panel view (LV2, LV3,
LV5, LV8; zoom: LV5, LV6) compare the living pair (t0/t1 stills + a 6-frame strip) with the flat still. G4.1 ≥ 2 of 3
prefer living; G4.2 each lists ≥ 3 omissions the class counts confirm; G4.3 the still frame keeps every class; G4.4 the
still-chart test re-measured (GL.4 needs a moving class only on a slice whose spec lists a device moving in [t0, t1] by the §5.7 rule, else vacuous); G4.5 voice; G4.6 zero surviving blocker or major; G4.7 no lens died; G4.8 all six asks
delivered, homed in POLISH or ruled out.

### 5.9 The reduced-motion item's accept file (`docs/living/accept/LRM.json`)

Copied verbatim by "Atlas reduced motion for its own animations" (lint-clean with `tools/mobile-capture.js
--lint-accept` against the checkout of 2026-10-05). When a `/* FILIGREE */` or `/* STREET */` marker exists in an app
file, remove `"UG4"` from `gates` and add `"UG4": "living track: a /* FILIGREE */ or /* STREET */ marker exists by
design; anchors, drift and tithe_lines re-scored by the item"` to `waive`, then re-score by hand: the capture's
`repo.anchors_missing` is `[]`, `street_drift_exit` is 0, `tithe_lines` equals `LRM-before`'s.

```json
{
 "unit": "LRM",
 "profiles": ["iphone13", "pixel7", "landscape", "desktop", "desktop2x"],
 "clock": "virtual",
 "files_touched": ["maps-site/index.html", "maps-site/data/offline-manifest.json", "docs/living/accept/LRM.json"],
 "gates": ["UG1", "UG2", "UG3", "UG4", "UG6", "UG7", "UG8", "UG10", "UG11"],
 "waive": {"UG5": "atlas-only item: index.html is byte-unchanged (the sim is not touched)", "UG9": "no new player-visible string: CSS and two class lines only"},
 "baseline": "LRM-before",
 "declared_change_keys": [
  "atlas.iphone13.first_load.bytes",
  "atlas.iphone13.first_load.by_cat.html_other.bytes",
  "atlas.iphone13.first_load.max_asset.bytes",
  "atlas.iphone13.repeat_visit.bytes",
  "atlas.pixel7.first_load.bytes",
  "atlas.pixel7.first_load.by_cat.html_other.bytes",
  "atlas.pixel7.first_load.max_asset.bytes",
  "atlas.pixel7.repeat_visit.bytes",
  "atlas.landscape.first_load.bytes",
  "atlas.landscape.first_load.by_cat.html_other.bytes",
  "atlas.landscape.first_load.max_asset.bytes",
  "atlas.landscape.repeat_visit.bytes",
  "atlas.desktop.first_load.bytes",
  "atlas.desktop.first_load.by_cat.html_other.bytes",
  "atlas.desktop.first_load.max_asset.bytes",
  "atlas.desktop.repeat_visit.bytes",
  "atlas.desktop2x.first_load.bytes",
  "atlas.desktop2x.first_load.by_cat.html_other.bytes",
  "atlas.desktop2x.first_load.max_asset.bytes",
  "atlas.desktop2x.repeat_visit.bytes"
 ],
 "declared_first_view_growth": {"bytes": 160, "requests": 0},
 "mask": [],
 "strings": [],
 "checks": [
  {"key": "atlas.iphone13.errors.unexplained", "op": "==", "value": 0},
  {"key": "atlas.iphone13.errors.page", "op": "==", "value": 0},
  {"key": "atlas.pixel7.errors.unexplained", "op": "==", "value": 0},
  {"key": "atlas.pixel7.errors.page", "op": "==", "value": 0},
  {"key": "atlas.landscape.errors.unexplained", "op": "==", "value": 0},
  {"key": "atlas.landscape.errors.page", "op": "==", "value": 0},
  {"key": "atlas.desktop.errors.unexplained", "op": "==", "value": 0},
  {"key": "atlas.desktop.errors.page", "op": "==", "value": 0},
  {"key": "atlas.desktop2x.errors.unexplained", "op": "==", "value": 0},
  {"key": "atlas.desktop2x.errors.page", "op": "==", "value": 0},
  {"key": "atlas.desktop.shot_diff", "op": "<=", "value": 0.005, "ref": "LRM-before"},
  {"key": "atlas.desktop2x.shot_diff", "op": "<=", "value": 0.005, "ref": "LRM-before"},
  {"key": "atlas.iphone13.metrics", "op": "deep-equals", "ref": "LRM-before", "except": ["declared_change_keys"]},
  {"key": "atlas.pixel7.metrics", "op": "deep-equals", "ref": "LRM-before", "except": ["declared_change_keys"]},
  {"key": "atlas.landscape.metrics", "op": "deep-equals", "ref": "LRM-before", "except": ["declared_change_keys"]},
  {"key": "atlas.desktop.metrics", "op": "deep-equals", "ref": "LRM-before", "except": ["declared_change_keys"]},
  {"key": "atlas.desktop2x.metrics", "op": "deep-equals", "ref": "LRM-before", "except": ["declared_change_keys"]}
 ]
}```

## 6. Model/effort pairing

The prelude's `PAIR`: `mech` haiku/low, `triage` sonnet/low, `audit` sonnet/medium, `deep` sonnet/high, `judge`
opus/high, `integ` opus/xhigh. Smoke runs force haiku/low. Deviations, with reasons:
- **Any agent that relays a 64-hex sha or a tool's JSON line is `triage`, never `mech`** (haiku altered single hex
  digits on 2026-10-05); records go through `recordL` (triage). `mech` is used only for string anchor checks.
- Every tool line with `len`/`sum` is re-checked in code (`lenOk`); a mis-relay gets one fresh agent.
- Implementers: logic in `living.js` or a hook line `judge` (opus/high); tools `deep` (sonnet/high); data and CSS
  `audit` (sonnet/medium); a spec unit's own `model`/`effort` applies through `MO()`. Fixers take the implementer's
  role.
- Integrators (bible, spec, punch list) `integ`; probe writer, red team, refuters, diagnoser, critic and ambiguity
  judges `judge`.
- Blind pairs use two models: appliers and readers sonnet/high + opus/high; the panel opus/high, sonnet/high,
  opus/high.

| job | agents (role) |
|---|---|
| Living 1 | preflight, hold, drift, cite (triage); instrument + fixes (deep); instrument check, freeze, L0, validator, resolver (triage); q02-q14 (audit 8, deep 3, triage 1, judge 1); anchor checks (mech); lenses (judge refute ×4, triage recount ×2, audit second-look ×7); integrator, patcher (integ); appliers (deep + judge); ambiguity, critic (judge) |
| Living 2 | preflight, hold, drift, spec reader, guess auditor, anchor fixer (triage); anchors (mech); prober, red team, spec fixer (judge); s01-s12 (judge ×5, deep ×3, audit ×4); integrator, red-team patch (integ); readers (deep + judge) |
| Living 3 | preflight, hold, drift, anchors, rebase, snapshot, check, measure, restore, manifest, gate relays, smoke, records (triage); accept authors (audit); implementers and fixers (by kind); diagnoser (judge) |
| Living 4 | preflight, hold, drift, capture, severity (triage); finders (deep ×2, audit ×5, judge ×4); repro (audit); refute (judge); panel (judge, deep, judge); punch (integ) |

## 7. Reuse map (re-anchor by pattern, never by line number)

Atlas (`maps-site/index.html`): `function jFrame(` (the one rAF owner), `jReduceMq`, `function jReduced(`,
`forceReduced`, `getElementById('jbar-reduce')`, `setRoutePlaying`, `.route-line.playing{animation:dashmove`,
`@keyframes copulse`, the pane table `['pJTrail',416]` and `map.createPane(`, `function setHash(`, `function
handleHash(` (params journey, chart, poi, company, faction, place, view), `var Z_STREET=11.5, Z_OPEN_MAX=8.0,
Z_TIER_D=7.5`, `function buildSeaLanes(`, JPATH and `var JPPS=260`, `function registerCityOverlay(`, `window.ATLAS=`,
the five functions living never calls (`xmur3`, `mulberry32`, `genCityCanvas`, `washMake`, `sampleCityMask`). Data
(top-origin atlas px, `px = map.unproject([x,y],4)`): `party-route.json`, `named-ways.json`, `sea-lanes.json`,
`city-anchors.json` (`harbor:true`, `sea.distPx`), `maps_markers.json`, `wiki-places.json`, `chart-pois.json`,
`traced-roads.json`, Filigree's in-window `rivers.json`. Sim (read-only): `const darkHour =`, `renderTod`,
`function routePos(`, `W.agents`, `W.routeVolume`, `W.seaRoutes`, `function tickDragon`, `window.ANNALS = {`.

## 8. Smoke recipe (the package itself)

1. `node tools/living-drift.js` (before Living 0: `--staged`) exits 0: parse, meta, phases, forbidden tokens (L6),
   the derivation (L1-L4), rulings (L5), the param (L8), placement (L9).
2. `node tools/living-drift.js --self-test` exits 0.
3. `node tools/street-drift.js` exits 0, and the filigree README §8 commands still pass (nothing of theirs moved).
4. Plan-mode previews of the four scripts (`scriptPath` to the staged copies before Living 0): each returns
   `reason:'plan'` with `agents_bound` equal to §11 (an unmet chain or missing inputs as `chain_ok:false`).
5. A smoke run of each job with an absolute scratch `outDir` outside the repo (`mode:'smoke'`): the plumbing chain.
   Smoke runs read their chain inputs from `docs/living/` (read-only) and write only under the outDir, so a job whose
   predecessor has never passed dies `missing inputs: …` in smoke mode: the expected result at delivery.
6. The CDN dir: `npm pack leaflet@1.9.4 three@0.128.0 @fontsource/eb-garamond@5.3.0 @fontsource/lora@5.3.0
   @fontsource/ibm-plex-mono@5.3.0 @fontsource/im-fell-english@5.3.0` into a temp dir, passed as `--cdn-dir`.
7. Once Living 1 has run: `node tools/living-measure.js --self-test` and `node tools/mobile-capture.js --self-test`.
Never start `server.js` on 8544 for this track; the tools serve on a free port.

## 9. Owner rulings

`rulings.json` holds `{date, about, rulings:[{id, text, default, fixed, gated, why, owner_question}], overrides:{},
confirmed:[]}`; `rulings[].text` mirrors `LC_RULINGS` in the scripts byte for byte (L5). To rule, put an id under
`overrides` with a text that **starts with** that ruling's text and appends the decision (append-only); fixed ids are
refused; list signed-off ids under `confirmed`. Confirm before Living 2: LC1, LC4, LC5, LC6, LC7, LC11, LC14.

| id | the default, in short | kind | the owner's question |
|---|---|---|---|
| LC1 | off; `living=1` only; row and control only then; `setHash` keeps it | owner | off until Living 4 and a real-phone look? |
| LC2 | one visible still-chart control writing `jrn.forceReduced`; no second `matchMedia` | fixed | — |
| LC3 | still = one frame, every class kept | fixed | — |
| LC4 | canon-backed movers only; whales only with a placed Loon Sea; Lugal a still mark; coastal birds (inferred) move; invented creatures absent | owner-gated additions | which creatures, where, doing what? does Lugal fly? birds unmarked or "told, not seen"? |
| LC5 | the party route only, session order, teleport legs a gap, no member tints | owner | Company or each member? gap or sea leg? |
| LC6 | a seeded function everywhere; the sim snapshot inside the Epēshu window; never `notices=`; *mūskar* (merchantman) on every lane, galley only if ruled | owner | invented schedules acceptable? galley anywhere? |
| LC7 | the sim is the only 3D: H2z then H2; H1 a never-served spike | owner-gated (H1) | is a page change the transitive layer? first exhibit? |
| LC8 | ≤ 20 draws/s fine, ≤ 15 coarse, ≤ 30 one-shot on phones; dt ≤ 100 ms; zero rAF when stopped | owner | smooth enough? |
| LC9 | slow, low contrast, under the names, never flashing | owner | 24 px/s right? |
| LC10 | no rise or scale-pop (R6) | fixed | — |
| LC11 | one whole-sheet dim; no sweep | owner | dim or sweep? |
| LC12 | pure functions, keyed streams, zero clock tokens, five atlas functions untouched | fixed | — |
| LC13 | one canvas in `pJTrail`, lazy `living.js` and `living/**`, no pane, no WebGL | fixed | — |
| LC14 | +0 requests, ≤ 200 raw hook bytes; lazy 40/60/32/150 KB | owner | accept 200 bytes, or a literal +0 (no chart)? |
| LC15 | moving glyphs selectable, with a keyboard list | owner | selectable? |
| LC16 | bronze-age words; `VOCAB_LC` and the UG9 words banned; §13 the only voice-read list | owner | "Still the chart" / "Stir the chart"? |
| LC17 | the sim dragon left as it is until ruled (a/b/c) | owner-gated item | (a) Myth off; (b) no dragon in the canon realm and Lugal named as gone north to the Fell Mountains (atlas 782, 8, outside the window); or (c) a chronicle line that this wyrm is not Lugal? |

## 10. Prerequisites and coexistence

| item | blocked by | held while (§1.3) | writes |
|---|---|---|---|
| Atlas reduced motion (dashmove, copulse) | Mobile 9 and 14 | a mobile run live; Filigree 3 started (then waits for Filigree 4); never while a Street 3, Street 4 or Street punch run is live (GS.8) | `maps-site/index.html` (CSS + 2 lines), the manifest, `docs/living/{accept,captures}/LRM*` |
| Living 0 | Mobile 9 and 14 checked, no lane fix item open (earlier only with `--idle-confirmed`); `design/DELIVERED.json` | a mobile or street tool running | `.claude/workflows/living-*.js` (central) |
| Living · the sheet-wide sea mask | Filigree 4; Mobile 9 and 14 | mobile, Filigree 3, Street 3/4/punch, Living 3 runs | the tool, `maps-site/living/sea-mask.png`, the manifest |
| Living 1 | Filigree 4; Living 0; the reduced-motion item; Traced road network; Sim ↔ atlas continuity | every-job + census + filigree fix items | `docs/living/**`, `tools/living-measure.js` |
| Living 2 | Living 1 | every-job | `docs/living/**` |
| Living 3 | Living 2; open `Living data — <item> (<slice>)` items for the slice | §1.3 Living 3 | §4 |
| Living 4 | Living 3 | every-job | `docs/living/**` |
| Living 3z / 4z | Living 4; Street 4; "Sim ↔ atlas continuity" | §1.3 zoom | as Living 3 / 4 |
| Living later · trace the rivers | Traced road network; Filigree 4; Mobile 9 and 14 | as the sea mask | the tool, `maps-site/living/rivers.json`, the manifest |
| Living later · the sim dragon | an LC17 override; Street 4; the street hold | a mobile run live | `index.html` (owner-ruled) |

The track never writes `index.html` (except the owner-gated dragon item), `docs/filigree/**`, `docs/street/**`,
`docs/mobile/**`, `.claude/**` from an agent, `tools/{filigree,street,mobile}-*`, `tools/street-drift.js`,
`tools/build-offline-manifest.js`, `server.js` or `vendor/`, and never uses port 8544. Its script names never match
`^(filigree|street)-\d-` (the UG4 anchor regex), so its anchors never enter a mobile gate.

## 11. Budget and size

| job | agents_bound (plan mode) | cap | typical |
|---|---|---|---|
| Living 1 | 138 | 150 | ~60 |
| Living 2 | 72 | 80 | ~28 |
| Living 3 (per run, `maxUnits` 6) | 178 | 200 | ~70; 5-7 runs for L0-L3 |
| Living 4 | 127 (zoom 121) | 150 | ~60 |

`agents_bound` is the plan-mode value; a preview that prints more than the recorded value means the script grew:
stop and review it before running (the cap is the hard limit the stub run enforces).

The track is about 60 + 28 + 6×70 + 60 + (3z: 2×70) + (4z: 60) ≈ 770 agents. Images ≤ 300 KB (`full_path` kept);
posters ≤ 150 KB; the first view gains ≤ 200 raw bytes and +0 requests.

## 12. Troubleshooting and known limits

- **Editing the installed living scripts** (any fix below, after Living 0): every edit of a `.claude/workflows/*.js`
  file is a `pipeline_sha` change for the mobile track, so edit only when `node tools/living-drift.js --install-window`
  prints `"edit_ok":true` (no mobile or street tool running, and both lane reviews checked with no lane fix item open,
  or `--idle-confirmed` with no lane unit passed).
- **`prelude drift: L1/L2`**: a filigree or street change moved the root. Re-derive the living prelude with the
  delivered generator: copy the living config region from any living script to `design/build/living-config.js` if it
  differs, run `node docs/living/design/build/gen-prelude.js --splice docs/living/design/workflow-1-research.md` (it
  writes `design/build/prelude.js` from the current street prelude and refreshes §0's block and sha), check with `node
  docs/living/design/build/proto-check.js`, put `prelude.js` in place of the prelude of all four scripts in one commit
  (inside the `edit_ok` window), re-run `node tools/living-drift.js`. Never edit a filigree or street file to make this
  pass. **L3**: re-copy the mobile-build
  lines or the sandbox tokens. **L4**: re-derive `recordL`. **L5**: make `rulings.json` texts equal `LC_RULINGS`.
- **`anchor lost: …`**: re-anchor the living `ANCHORS` by pattern in all four scripts (L2), one commit; an anchor of
  another track (Living 3) means that track moved a line: never edit it, re-point the hook in a Living 2 re-run.
- **Rebaselined**: recorded, not a failure; a rebase after every run is a sign an outside change keeps landing.
- **`restore invariant broken`**: undo the stray marked line by hand, or delete `state/3-build/atlas-ref.json` when
  the remaining change is legitimate (the next run rebases).
- **`coexistence broken: …`**: a run overlapped another track's run; finish the other run, re-run this one (Living 4
  records no cycle gate for such a run, so the re-run keeps the same cycle).
- **The instrument after a `mobile-capture.js` change**: L7 names a missing export; otherwise Living 3 rebases and
  re-runs both self-tests.
- **`record-mismatch`**: the returned object still holds the gate; re-run the job (`resume:true`), never hand-write a
  gate.
- **A held queue**: expected while the mobile lanes, Filigree 3/4 or Street 3/4 run; the living jobs wait their turn.
- **Known limits**: Chromium only (no WebKit, so no iOS Low Power Mode); SwiftShader frame rates are informational;
  battery and heat are unmeasured until the owner's device pass; a wall-clock dependency hidden by the virtual clock
  is caught by the static token count; if Mobile 7's "Keep this chart for the table — <size>" shows on a desktop
  shot, the manifest rule plus the rebase keep the off reference honest.

## 13. Player-visible strings (the only voice-read list)

| surface | text |
|---|---|
| layers row | The living chart |
| control, moving | Still the chart |
| control, still | Stir the chart |
| control title | Still or stir every motion on the chart |
| footprints card | The Company's road: <stop> |
| caravan card | A caravan string on the <way>, between <place> and <place>, seen on the way |
| ship card | A mūskar (merchantman) on the <lane>, bound for <port>, seen on the way |
| snapshot card line | as last seen, in the year <n> A.B. |
| dark hour | Tamar's dark hour |
| Lugal | Lugal's still mark |
| glyph list | Moving on the chart |
| exhibit action | Go down into the street |
| poster caption | <place>, as the street shows it |
| rumour mark | told, not seen |

In the snapshot card line `<n>` is the snapshot's year, 1374 (A.B.), never a sim day count. Each new string goes into `LC_STRINGS` in `maps-site/living.js` and into this table; zero `VOCAB_LC` and UG9 words;
read against `docs/mobile/voice-rubric.md` (read-only).

## 14. Provenance

The owner's input (spoken, verbatim): "The two that I shared earlier have quite a lot of detail for how different
applications can use three.js for a kind of more transitive layer when zooming in, and how they are using it to enable
more details that you would see once you've zoomed into those detail layers. Some people are using it for interactive
Lombard Street exhibits. And the examples I show show interactive zoom and probably traffic patterns and stuff. It
would be cool to maybe show travel routes with people's footprints or something like that. I think in How to Train
Your Dragon you can see moving dragons or water patterns to make things more interactive and more visually appealing
rather than just a flat map that we've rendered. Maybe these are things we should also add to this to-do list."

- **Recollection only** (searched, not found; never a precedent): the Lombard Street exhibit, the traffic-pattern
  zoom demo in the Collison and Azlen threads, three.js zoom transitions in either thread, How to Train Your Dragon's
  dragons and water as a map, Bay Atlas's stack.
- **Verified precedents**: Mini Tokyo 3D, deck.gl TripsLayer, Leaflet Renderer.js and Layer.js, windy.js and
  leaflet-velocity, earth.nullschool, model-viewer, Mapbox storytelling, three r128 (InstancedMesh, curves), the
  Marauder's Map credits (staging only), WCAG 2.2.2 and 2.3.3.
- **Open questions for the owner**: the thread replies or screenshots; which dragon-film scene; the rulings marked
  owner above (§9).
