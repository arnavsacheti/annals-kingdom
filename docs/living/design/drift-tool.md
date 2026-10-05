# `tools/living-drift.js`: design

New, read-only, owned by the living track. It is never an edit to `tools/street-drift.js`, `tools/mobile-tree.js` or
any other track's tool: it reads them, spawns `tools/street-drift.js` for its exit code, and copies two small pieces
(`metaCheck`, the FNV relay line) whose copies it checks against their sources at run time.

```
node tools/living-drift.js [--json] [--repo <dir>] [--staged]     drift checks L0-L9 (default)
node tools/living-drift.js --hold [--repo <dir>]                   the hold read, one JSON line with len and sum
node tools/living-drift.js --install-window [--idle-confirmed] [--repo <dir>]   the UG11 install window, one JSON line with len and sum
node tools/living-drift.js --self-test                             synthetic repos in a temp dir; never reads or writes living scripts in REPO
```

Exit codes: **0** ok; **1** drift (any check false), or for `--hold` / `--install-window` a file it needs did not
parse; **2** usage (an unknown flag, `--repo` without a dir) or no living script in either location. `--hold` and
`--install-window` exit 0 whenever they could read; the decision is the workflow's, computed in code from the fields.

Header comment (verbatim intent): "Read-only drift, hold and install-window checks for the living workflows
(docs/living/README.md §8). The living prelude is filigree prelude v1 under the street masks plus one living config
region; this proves it." `'use strict'`; only `fs`, `path`, `os`, `crypto`, `child_process`; no clock or random calls.

## 1. Where the four scripts are (L9 decides)

`STAGED = docs/living/design/workflows/`, `INSTALLED = .claude/workflows/`, names `living-1-research`,
`living-2-plan`, `living-3-build`, `living-4-review` (`.js`). The checks run on the installed copies when all four are
installed, else on the staged copies when all four are staged; `--staged` forces the staged copies (Living 0 checks
them before the copy). Neither location complete: exit 2 with `no living scripts in .claude/workflows/ or
docs/living/design/workflows/`.

## 2. Checks (default mode)

Constants: `F_START = '// ==== filigree prelude v1'`, `F_END = '// ==== end filigree prelude ===='`,
`L_START = '// ==== living prelude v1'`, `L_END = '// ==== end living prelude ===='`,
`C_START = '// ---- living config ----\n'`, `C_END = '// ---- end living config ----\n'`, and the seven masks of
`tools/street-drift.js` with `(filigree|living)` in START and END:

```js
const MASKS = [
  ['START', /^\/\/ ==== (filigree|living) prelude v1.*$/m],
  ['END', /^\/\/ ==== end (filigree|living) prelude ====$/m],
  ['OUT', /^const OUT = .*$/m],
  ['DOCS', /^const DOCS = .*$/m],
  ['FULLOUT', /^if \(MODE === 'full' && !underDocs\(OUTABS\)\).*$/m],
  ['J1FORCE', /^if \(A\.force != null && JOB === .*$/m],
  ['ANCHORS', /^const ANCHORS = \[\n[\s\S]*?\n\]$/m]
]
```

`block`, `masked`, `stripConfig`, `configOf`, `lineOf` and `evalLiteral` behave as the same-named functions of
`tools/street-drift.js` (re-written here, with the living markers).

| id | check | fails when |
|---|---|---|
| **L0** | the derivation root is healthy: the four filigree preludes are byte-identical, and `node tools/street-drift.js --json` (spawned, `cwd` = repo) exits 0 | either half fails (detail names it) |
| **L1** | each living prelude, with its config region stripped and the seven masks applied, equals filigree prelude v1 (from `filigree-1-research.js`) masked | any script differs, a marker is missing or a mask matches ≠ 1 time |
| **L2** | the four living preludes (config included) are byte-identical, and all four exist in the chosen location | a variant, or a missing script |
| **L3** | copies in step with their sources: `SANDBOX_LC` names the four tokens `tools/street-drift.js` D3 reads from `filigree-3-build.js`'s `const SANDBOX = ` line (Chromium path, `leaflet@1.9.4 three@0.128.0`, the two route globs) and every `@fontsource/<face>@<version>` token of `mobile-build.js`'s `const CDN_STEP = ` line; the config lines starting `const canonJ = `, `const fnv = ` and `const lenOk = ` are byte-equal to the same-starting lines of `mobile-build.js` | a token is missing or a line differs |
| **L4** | `recordL` is derived: the config text from `const RECD = ` through the `\n  return r\n}` that ends `recordL` equals `filigree-1-research.js`'s text from `const RECD = ` through the end of `recordD` after exactly two substitutions, each applied once: `async function recordD(` → `async function recordL(` and `...M('mech')})` → `...M('triage')})` | anything else differs, or a substitution site is not found exactly once |
| **L5** | rulings, citations and words: `FIL_CITED` ⊆ the prelude's `RULINGS`; `ST_CITED` ⊆ the `ST_RULINGS` literal of `street-1-research.js` (evaluated); `LC_FIXED`, `LC_GATED` ⊆ `LC_RULINGS`; no LC text matches `VOCAB_LC` or `JARGON_LC`; `VOCAB_LC.source` keeps `VOCAB`'s alternation and contains every alternative of `street-1-research.js`'s `VOCAB_ST`; `JARGON_LC.toString()` equals the regex literal on the `const jargon = ` line of `tools/mobile-capture.js`; `docs/living/rulings.json` has exactly the keys `date, about, rulings, overrides, confirmed`, `rulings[].id` equals the LC ids in order, every `rulings[].text` equals `LC_RULINGS[id]`, every `fixed`/`gated` flag equals membership of `LC_FIXED`/`LC_GATED`; `overrides` keys are LC ids not in `LC_FIXED`, each a string that starts with its default text and is longer (append-only); `confirmed` ⊆ LC ids | any of these |
| **L6** | meta and bodies: `metaCheck(file, stem)` of `tools/street-drift.js` (line 1 is `export const meta = {`; AsyncFunction parse with the eight globals; `meta` a pure literal; `name` = stem; `const JOB = '<stem>'`; phase titles used = declared; no `Date.now(`, `Math.random(`, `performance.now(`, argless `new Date()`, `require(` or `import` in the body); the copy of `metaCheck` in this tool must equal street-drift's function source (read at run time, compared after a whitespace-exact cut from `function metaCheck(` to its closing `\n}`); outside the prelude no `record(`/`recordD(` call (bodies use `recordL`) and no `8544` literal | any of these |
| **L7** | the instrument contract: when `tools/living-measure.js` exists, every name it destructures from `require('./mobile-capture.js')` (the `const {…} = require('./mobile-capture.js')` statement, parsed) is a key of the object on the `module.exports = {` line of `tools/mobile-capture.js` | a name is missing (detail lists it); when the instrument is absent the check passes with `absent: Living 1 writes it` |
| **L8** | the param grammar (ST18 cited): `LIVING_PARAM` matches `^[a-z]+$`, does not end in `s`, and is none of `s goto street filigree notices journey chart poi company faction place view` | any of these |
| **L9** | placement: all four scripts in exactly one of STAGED and INSTALLED, none in the other (Living 0 moves them) | a mixed or partial placement |

Output: one line per check (`ok   L1 living-2-plan.js: derived ok`), then `living drift: ok` or `living drift: FAIL`;
with `--json` one line `{"ok":…,"location":"staged"|"installed","checks":[{"id","ok","detail"}]}`.

## 3. `--hold`: the hold read (no decision)

Prints one line `{"ok":true, …fields, "len":N, "sum":H}` where `len` and `sum` (32-bit FNV-1a hex) are computed over
`JSON.stringify(canon(fields))` exactly as `tools/mobile-tree.js` does, so the workflow's `lenOk` catches a relay that
altered or dropped anything. Fields:

- `busy`: `"<pid> <first 120 chars of the command line>"` for each process whose command line matches
  `tools/(mobile-capture|mobile-tree|street-probe)[.]js`, read with `pgrep -af` spawned without a shell (its own
  pattern contains `(` and `[.]`, so it never matches itself); this tool's pid and parent excluded.
- `polish` (from `POLISH.md`, line by line):
  - `mobile_open`: titles of unchecked lines matching `^- \[ \] \*\*Mobile (\d{1,2})(b?)( fix \d{1,2}| \(fix \d{1,2}\))? ·`
    whose number is not 15 (Mobile 5b and the review fix items included: `mobile-review.js` inserts them as `- [ ]
    **Mobile 9 fix 1 · …`; "Mobile ·" script items and "Mobile later ·" items excluded);
  - `census_open`: an unchecked line starts `- [ ] **Mobile later · census pin names`;
  - `fil_open`: unchecked `Filigree 3 stuck unit|Filigree 4 punch c|Filigree data —` lines;
  - `street_open`: unchecked `Street 3 stuck|Street 4 punch c|Street data \(S3\) —` lines;
  - booleans `m9_checked`, `m14_checked`, `f4_checked`, `s4_checked`, `continuity_checked` (`- [x] **Sim ↔ atlas
    continuity**`), `traced_roads_checked`, `rm_checked` (`- [x] **Atlas reduced motion for its own animations`),
    `seamask_checked` (`- [x] **Living · the sheet-wide sea mask`), `rivers_checked` (`- [x] **Living later · trace
    the rivers`), `l0_checked` (`- [x] **Living 0 ·`);
  - `living`: `{gap_open, data_open, stuck_open, punch_open: {c1, c2}, zpunch_open: {c1, c2}}`, each an array of the
    bold titles of the unchecked `Living gap — `, `Living data — `, `Living 3 stuck `, `Living 4 punch c<k> `,
    `Living 4z punch c<k> ` lines (the jobs dedupe their `polish_inserts` against these, in code).
- `filigree`: `f2` = `docs/filigree/gates/2-plan.json` `{exists, pass, mode, forced}`; `f4` = the
  `docs/filigree/gates/4-review-c<k>.json` with the highest integer k as `{k, pass, forced}`, or null.
- `street`: `s4` likewise from `docs/street/gates/4-review-c<k>.json`; `views` = `docs/street/gates/views.json` exists.
- `sim`: `street_param` = occurrences of `street=` in `index.html`.
- `shas`: sha256 of `index.html` and `maps-site/index.html`; `manifest` (`maps-site/data/offline-manifest.json` or
  null); tree digests (sha256 over sorted `path\0sha\n` lines) of `docs/filigree/**`, `docs/street/**`,
  `docs/mobile/**` and `maps_other` = `maps-site/**` minus `maps-site/index.html`, `maps-site/living.js`,
  `maps-site/living/**` and `maps-site/data/offline-manifest.json`; `street_state3` (`docs/street/state/3-build.json`
  or null); `workflows`: `{".claude/workflows/<f>": sha}` for every `.js` there plus `tools/street-drift.js` (the UG11
  `pipeline_sha` key set); `tools_other`: every `tools/filigree-*`, `tools/street-*`, `tools/mobile-*` and
  `tools/build-offline-manifest.js`.

## 4. `--install-window`

Reads `docs/mobile/units.json` (an array of `{id, run, …}`), `docs/mobile/state.json` (`units[id].status`) and
`POLISH.md`. Lanes: **atlas** = units whose `run` is `Mobile 4`..`Mobile 8`, `Mobile 5b` or `Mobile 9 (fix K)`;
**sim** = `Mobile 10`..`Mobile 13` or `Mobile 14 (fix K)` (the `run` mobile-review gives its fix units). A lane is
**closed** when one of its units has status `passed` and its review line (`- [x] **Mobile 9 ·` / `- [x] **Mobile 14 ·`)
is not checked, or an unchecked `Mobile 9 fix K ·` / `Mobile 14 fix K ·` line exists (the POLISH form of those
fix units). A **lane unit** is a `docs/mobile/units.json` entry whose `run` names one of those items; D1, D2, D6 and
every other unit are not lane units. Prints `{"ok":true, "open":…, "path":"reviews-checked"|"idle-confirmed"|null,
"idle_unverifiable":…, "edit_ok":…, "busy":[…], "lanes":{"atlas":{"units":[…], "passed":[…], "review_checked":…,
"fix_open":[…], "closed":…}, "sim":{…}}, "staged":n, "installed":n, "why":[…], "len":N, "sum":H}`:

- `quiet` = `busy` empty, both review lines (`Mobile 9 ·`, `Mobile 14 ·`) checked and no `Mobile 9 fix K` / `Mobile 14
  fix K` line open: no mobile-build or mobile-review run can follow, so nothing can meet a changed pipeline key.
- `early` = `busy` empty, neither lane closed, and `--idle-confirmed` passed. `pgrep` sees only tool processes; a
  mobile-build run spends most of each unit in agent phases (accept author, implementer, lenses, refuters) with no
  such process, so idleness cannot be read from the machine. The flag is passed only by the central session after it
  has checked every open session for a running mobile-build or mobile-review Workflow.
- `open` = (`quiet` ∨ `early`) ∧ `staged` 4 ∧ `installed` 0; `path` names which held; `idle_unverifiable` is true
  whenever `quiet` is false (so `open` can only come from the flag); `edit_ok` = `quiet` ∨ `early`, with no
  staged/installed test: the condition for editing the installed living scripts after Living 0 (README §12), since
  every edit of a `.claude/workflows/*.js` file is the same `pipeline_sha` change.
- `why` lists every failing part (a busy tool, a closed lane with its passed unit ids, an open review or fix line, "no
  --idle-confirmed: pgrep cannot see a mobile-build run in its agent phases", the staged/installed counts).

Why: UG11
compares `pipeline_sha` over the union of keys (`tools/mobile-capture.js:1406-1408`), and `mobile-review.js` scores a
lane's combined acceptance against `START_REF` (:108, :225), the first lane unit's `ref_before`, frozen once a unit has
passed (`mobile-build.js:310`); a script landing after that and before the lane review fails the review on UG11.

## 5. `--self-test`

Builds temp repos in `os.tmpdir()` (removed in `finally`); it copies the real `filigree-*.js`, `street-*.js`,
`mobile-build.js`, `tools/street-drift.js` and `tools/mobile-capture.js` read-only into each, synthesises four living
scripts from the real filigree prelude plus a minimal living config (built from the same source lines L3-L5 read, so
it passes by construction) and a matching `docs/living/rulings.json`. Cases, each a fresh copy:

| case | expected |
|---|---|
| faithful copies (staged) | exit 0, every check ok |
| a one-word edit of R6 in `living-2-plan.js` | L1 and L2 fail |
| a one-word edit of one LC text in one script | L2 fails |
| `rulings.json` text of LC1 differs | L5 fails |
| `recordL` keeps `M('mech')` | L4 fails |
| `SANDBOX_LC` without `@fontsource/lora@5.3.0` | L3 fails |
| `LIVING_PARAM = 'livings'` | L8 fails |
| scripts in both STAGED and INSTALLED | L9 fails |
| a fake `tools/living-measure.js` requiring `{noSuchExport}` | L7 fails |
| `--hold` on a synthetic POLISH.md (Mobile 5b open, `Mobile 14 fix 1 ·` open, census open, one `Filigree 4 punch c1` line, Mobile 9 checked) | the exact `mobile_open`, `census_open`, `fil_open`, `m9_checked` values; `len`/`sum` re-verify; FNV vectors `''`→`811c9dc5`, `'a'`→`e40c292c`, `'foobar'`→`bf9cf968` |
| `--install-window`: no lane unit passed, no flag / the same with `--idle-confirmed` / D3 passed with Mobile 9 open and `--idle-confirmed` / Mobile 9 and Mobile 14 checked, no flag / the last with `Mobile 9 fix 1 ·` open / Mobile 9 and 14 checked with 4 installed | `open:false, idle_unverifiable:true` / `open:true, path:"idle-confirmed"` / closed (atlas), `open:false` / `open:true, path:"reviews-checked"` / `open:false` / `open:false, edit_ok:true` |
| `--hold` titles | `living.gap_open` and `data_open` list the exact bold titles of the synthetic `Living gap — G1.1: …` and `Living data — traced roads` lines |

Prints `{"ok":…, "cases":[{"case","ok","detail"}]}`; exit 0 only when every case behaves as expected.

## 6. Who runs it

- Every living job's preflight (`DRIFT_TASK_LC`, through a triage relay): `prelude drift: L…` is a thrown run fault.
- `HOLD_TASK_LC` (`--hold`) at every preflight and again at Record (the coexistence shas).
- Living 0 (`--install-window`, `--staged`), central only; `edit_ok` before any later edit of an installed living script (README §12).
- `tools/living-measure.js --self-test` never depends on it; `tools/street-drift.js` never reads it.
