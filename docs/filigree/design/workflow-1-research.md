> Planning snapshot (2026-10-04). The script in .claude/workflows/ is the source of truth; later fixes are not back-ported here.

# Design — `.claude/workflows/filigree-1-research.js` (Job 1: Research → density bible)

Implements brief p5 "1. Research" (input: the three plates, the Swiss layer list, the region the
campaign already uses; output: a density bible, not a map; done when you can point at a blank
hex and say which six things must appear on it before it is allowed to be empty).
This file also holds **§0, the shared prelude**. All four scripts carry it byte-identically.

Evidence base, verified in this session (2026-10-04):
- The `EPESHU_HF` decode gives a 768² RGB PNG with h = (R·256+G)/32 − 300.
- Cell-centre rule: DEM cell (gx,gy) covers atlas [1060+gx·800/768, +800/768) × [1240+gy·800/768, +800/768) and its
  centre is at +0.5. `--at` returns the containing cell; `--bbox` takes the cells whose centre lies in the half-open box.
- Summit **328.19 m in DEM cell 565,349 (centre 1649.06, 1604.06)**; minimum −46.03 m.
- Aldorūs cell (373, 276), centre 1449.06, 1528.02, h 139.31 m.
- Fixture cell stats are in the HEXES table below.
- Anchors drift. `EPESHU_HF_URI` is at `index.html:7584`, not the dossier's 7578, and the `#view` guard is at
  `maps-site/index.html:3529`. So every script re-anchors **by pattern** (the `ANCHORS` constant) and never
  trusts line numbers.

---

## §0 Shared prelude (normative; copy verbatim into all four scripts)

File layout of every script:
1. `export const meta = {…}`, a pure literal.
2. The one per-file line `const JOB = '<meta.name>'`. It sits **outside** the prelude, so the drift check passes.
3. The prelude block, verbatim, between the two marker comments.
4. The job body.

```js
// ==== filigree prelude v1 — keep byte-identical across the four filigree scripts ====
const A = (args && typeof args === 'object' && !Array.isArray(args)) ? args : {}
const die = m => { throw new Error(JOB + ': ' + m) }
const DATE = A.date
if (!/^\d{4}-\d{2}-\d{2}$/.test(DATE || '')) die('args.date "YYYY-MM-DD" is required (scripts cannot read the clock)')
const MODE = A.mode || 'full'
if (!['full', 'smoke', 'plan'].includes(MODE)) die('args.mode must be full|smoke|plan')
const REPO = String(A.repo || '/home/user/annals-kingdom').replace(/\/+$/, '')
if (!REPO.startsWith('/') || REPO.includes('//') || REPO.split('/').some(s => s === '.' || s === '..')) die('args.repo must be a normalized absolute path')
const OUT = String(A.outDir || 'docs/filigree').replace(/\/+$/, '')
if (OUT.includes('//') || OUT.split('/').some(s => s === '.' || s === '..')) die('args.outDir must not contain empty, . or .. segments')
const OUTABS = OUT.startsWith('/') ? OUT : REPO + '/' + OUT
const DOCS = REPO + '/docs/filigree'   // static inputs (dossier, todo-inputs, rulings.json, README) always come from the repo
const underDocs = p => p === DOCS || p.startsWith(DOCS + '/')
if (MODE === 'full' && !underDocs(OUTABS)) die('full runs write the durable record: args.outDir must be docs/filigree or a subdirectory of it')
if (MODE === 'smoke' && (!OUT.startsWith('/') || OUTABS === REPO || OUTABS.startsWith(REPO + '/'))) die('smoke runs must pass an absolute args.outDir outside the repo (use the session scratchpad)')
const ROUNDS = A.maxRounds ?? 2
if (!Number.isInteger(ROUNDS) || ROUNDS < 0 || ROUNDS > 2) die('args.maxRounds must be an integer 0..2')
if (A.resume != null && typeof A.resume !== 'boolean') die('args.resume must be a boolean')
if (A.rulings != null && (typeof A.rulings !== 'object' || Array.isArray(A.rulings))) die('args.rulings must be a plain object')
const RESUME = A.resume !== false
const SHARED_ARGS = ['date', 'repo', 'outDir', 'mode', 'maxRounds', 'rulings', 'resume', 'force']
function checkArgs(extra) { for (const k of Object.keys(A)) if (!SHARED_ARGS.concat(extra || []).includes(k)) die('unknown arg ' + k) }   // every job body calls this first, listing only its own keys
const FORCE = A.force == null ? null : String(A.force).trim()
if (FORCE !== null && (!FORCE || JOB === 'filigree-1-research')) die(JOB === 'filigree-1-research' ? 'args.force is not accepted by Job 1 (there is no earlier gate to skip)' : 'args.force must be a non-empty reason string')
const RULINGS = {
  R1: 'Peaks: principal peaks (▲ + canon range names Rhoshkhon, Sūs Gimīlīn, Aura-Hōth) from the country sheet; ridge names and heights from the region sheet down; once arrived a name or height is never dropped, generalized or replaced by a pin at closer zoom.',
  R2: 'Rank decides WHEN a name appears (its threshold), not HOW it is inked: one ink colour and one face family for landform and homestead names; at most one size step between ranks.',
  R3: 'The named palette (rust road, ocher arterials, rose-brown blocks, contour hair) is for drawn line work only; washes (water, reserves, fog, city tone) sample the print hue as washMake does; bone paper is the print itself.',
  R4: 'Never label blocks; arterial and street names arrive on a threshold inside the city band, one step above the city sheet entry.',
  R5: 'Accept the print: PatrinorModern.png already letters every ○ town at z0-5. "Nothing smaller than the one town" binds the filigree overlay only; no de-lettered raster.',
  R6: 'Presence is a threshold (absent below minZoom); after arriving, ink eases over <=0.25 zoom or <=250 ms; names arrive at or after their own ink; nothing fades in below its threshold.',
  R7: 'City sheet (z >= Z_TIER_D): nothing drawn at rest. Epēshu hover halos stay (invisible at rest); cursor-growing census pins are suppressed inside the city footprint at the city band; deep links still land.',
  R8: 'Ground: coast C1 (Pēshunor north coast, Epēshu-Sokundo-Kanae-Rhup-Tamaron), river town Aldorūs, painted city Epēshu, unless the pick panel scores an alternative >=1 point higher. Sheet one = the REGION sheet over C1, bbox x1216-1760 y1376-1664 (atlas px).',
  R9: 'Invented names are allowed where the land is unnamed: minted deterministically (xmur3(class+cellId) -> mulberry32 over the Patrinaic roots tool, reserved words excluded), prov "invented", every one listed in docs/filigree/names-for-owner.md; owner veto = add to the tool veto list and re-mint; no numeric cap.',
  R10: 'Vocabulary: "coach posts" -> caravan halts / waystations; "artillery hours" and live-fire "range" wording dropped (the layer is muster days); "the 1864 sheet" -> the old survey (Imperial / War era sheets); "closures" -> shut ways; the shipped The Tithe-Yard / The Tithe-Barn POIs are renamed by a Job 3 unit to The Tribute-Yard / The Tribute-Barn (a rename, never a Job 1 gate failure; Job 4 F06 checks for exactly this pair).',
  R11: 'Data first: Job 3 needs POLISH "Traced road network" and "Census second pass" checked; args.overridePrereqs lets slice A (ground) run without them, never slices B-D.',
  R12: 'Notices (muster days, shut ways; player-facing label: the herald\'s tidings) load outside the release: a hash param notices=<url> or a local file import; one sample snapshot (fixed seed, fixed simDays) is committed; no mid-cycle pushes.',
  R13: 'Fog is a seeded function of (place, notices-snapshot sim day); no new sim weather state; never wall-clock.',
  R14: 'Old survey = an era tile layer (tiles-imperial/ or tiles-war/) stacked UNDER the live base with opacity or swipe; if research finds the eras differ only in names/borders, add an old-name layer as well.',
  R15: 'Docs-only runs (Jobs 1, 2, 4 without fixes) still cut a patch release; their CHANGELOG line starts "docs:".',
  R16: 'Review punch items go directly above the Filigree 4 entry; at most 2 review cycles, then the owner decides.',
  R17: 'Hex = one z7 tile (32 atlas px). The 12 fixture cells F01-F12 are literal constants; changing them needs a Job 1 re-run.',
  R18: 'The table map ships behind a default-off toggle (hash param filigree=1 + a layers-panel row). The sparse version = the same view with the toggle off, verified by DOM (no filigree pane or feature). The owner flips the default after Job 4 passes.',
  R19: 'Only Aldorūs gets the overlay shield; Kanae and Sokundo get none on any filigree sheet; the print’s own ◉/○ glyphs are untouched.',
  R20: 'Heights are bare numerals (as on plate one) with a legend line "height above the sea", prov "derived" from EPESHU_HF; no unit.',
  R21: 'Data contradictions (Aldorūs "out of sight of the sea" vs sea 77 px NE; Drāmūz marker 35 px off; Hordon/Maeges anchor) are recorded and queued as data items directly above the filigree job they block; filigree jobs never edit canon notes.',
  R22: 'Sheets cover the EPESHU_HF window [1060,1240]..[1860,2040] only; outside it there is no DEM, the bible states a no-DEM rule (fixture F12), and no relief is invented there.'
}
for (const [k, v] of Object.entries(A.rulings || {})) { if (!(k in RULINGS)) die('unknown ruling ' + k); if (typeof v !== 'string' || !v.trim()) die('ruling ' + k + ' must be a non-empty string') }
function rulingsMerge(fileOverrides) {
  const r = {}, used = {}, fo = (fileOverrides && typeof fileOverrides === 'object') ? fileOverrides : {}
  for (const k of Object.keys(RULINGS)) {
    const a = (A.rulings || {})[k], f = typeof fo[k] === 'string' && fo[k].trim() ? fo[k] : null
    r[k] = a || f || RULINGS[k]; used[k] = a ? 'args' : f ? 'rulings.json' : 'default'
  }
  return {r, used}
}
const rulingText = (r, ids) => ids.map(k => `${k}: ${r[k]}`).join('\n')
const PAIR = {mech: ['haiku', 'low'], triage: ['sonnet', 'low'], audit: ['sonnet', 'medium'], deep: ['sonnet', 'high'], judge: ['opus', 'high'], integ: ['opus', 'xhigh']}
const M = role => { const p = PAIR[role]; if (!p) die('unknown role ' + role); return MODE === 'smoke' ? {model: 'haiku', effort: 'low'} : {model: p[0], effort: p[1]} }
const MODELS = ['opus', 'sonnet', 'haiku'], EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max']
function MO(role, o) {   // per-field, validated override (planner-emitted unit.model / unit.effort); never in smoke
  const b = M(role); if (MODE === 'smoke' || !o) return b
  const r = {...b}
  for (const [k, set] of [['model', MODELS], ['effort', EFFORTS]]) if (o[k] != null) { if (set.includes(o[k])) r[k] = o[k]; else log('rejected unit override ' + k + '=' + o[k]) }
  return r
}
const cap = xs => MODE === 'smoke' ? xs.slice(0, 1) : xs
const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9#.-]+/g, ' ').trim()
async function crit(p, o) { return (await agent(p, o)) ?? (await agent(p, {...o, label: o.label + ' (retry)'})) }
function kept(xs, what) { const k = xs.filter(Boolean); if (k.length < xs.length) log(`${what}: ${xs.length - k.length}/${xs.length} dropped`); return {k, ok: k.length >= Math.ceil(xs.length * 0.75)} }
const RULE = `Repo root: ${REPO} (cd there before any command; use absolute paths). Write ONLY the files this prompt names (under ${OUTABS} unless it says otherwise); throwaway scripts go in a temp dir (mktemp -d), never in the repo. Never run git. Never edit POLISH.md, CHANGELOG.md, VERSION or anything under .claude/. Stamp date ${DATE} into every artifact you write. Return only the requested JSON.`
const NOGIT_RULE = `Never run git. Run commands from ${REPO}. Write nothing except the files this prompt names. Return only the requested JSON.`   // blind actors: no repo-root, no date, no hints about the layout
const P = (body, blind) => (blind ? NOGIT_RULE : RULE) + '\n' + body   // EVERY agent() prompt is P(...) or starts with RULE
const READBACK = 'Re-read the file you wrote, JSON.parse it, and return {path, sha256 (sha256sum of the file), parsed: true}.'
const FILE_OK = f => !!f && /^[0-9a-f]{64}$/.test(f.sha256 || '') && f.parsed === true
const VOCAB = /\b(saint|abbey|priest|baron|artillery|musket|rifle|pistol|cannon|gunpowder|gunfire|coach(es)?|tithes?|church|chapel|cathedral|monk|bishop|knight|castle|manor|feudal|vassal|pilgrim|parish|cavalry|crusade|sermon|cleric)\b/i
const VOCAB_RULE = `Banned vocabulary (case-insensitive regex ${VOCAB.source}) must not appear in new player-facing text or fiction names, except inside the sections "## Provenance" and "## Renames". Voice: bronze-age Nīmlad, the nine Kembar, years A.B.`
const CLOCK_GREP = 'Math[.]random|Date[.]now|new Date[(][)]'   // for grep -E in prompts; never write clock/random call syntax literally in a script
// Blindness is an ALLOWLIST of absolute paths (a trailing '/' means "this directory"), built per actor from OUTABS/REPO, so it holds for any outDir.
const absP = p => { const s = String(p).trim(); return s.startsWith('/') ? s : REPO + '/' + s.replace(/^(\.\/)+/, '') }
const blindBad = (read, allowed) => (read || []).filter(p => { const a = absP(p); return a.split('/').includes('..') || !allowed.some(x => a === x || (x.endsWith('/') && a.startsWith(x))) })
const ANCHORS = [
  ['index.html', 'const EPESHU_HF_URI', 1], ['index.html', 'function genHydrology', 1], ['index.html', 'const NAME = ', 1],
  ['index.html', 'NAME.used.has(n)', 1], ['index.html', 'const PATRINAIC_ROOTS', 1], ['index.html', 'W.weather = ', 1],
  ['index.html', 'W.dragon = ', 1], ['index.html', "name:'Aldorūs'", 1],
  ['maps-site/index.html', 'function handleHash', 1], ['maps-site/index.html', 'var THEMES=', 1], ['maps-site/index.html', 'var DEFAULT_ON=', 1],
  ['maps-site/index.html', 'var Z_STREET=', 1], ['maps-site/index.html', 'var TIER_CEIL=', 1], ['maps-site/index.html', 'function setEra', 1],
  ['maps-site/index.html', 'function worldOpacityUpdate', 1], ['maps-site/index.html', 'function registerCityOverlay', 1],
  ['maps-site/index.html', 'function washMake', 1], ['maps-site/index.html', 'function sampleCityMask', 1], ['maps-site/index.html', 'function genCityCanvas', 1],
  ['maps-site/index.html', 'function xmur3', 1], ['maps-site/index.html', 'function mulberry32', 1], ['maps-site/index.html', 'window.ATLAS=', 1],
  ['maps-site/index.html', '!/^#view=/.test(location.hash)', 1], ['maps-site/index.html', 'The Beacon Post', 0], ['maps-site/index.html', 'The Muster Ground', 0],
  ['maps-site/index.html', 'The Tithe-Yard', 0], ['maps-site/index.html', 'The Tithe-Barn', 0],
  ['maps-site/index.html', 'The Tribute-Yard', 0], ['maps-site/index.html', 'The Tribute-Barn', 0]
]
const ANCHOR_TASK = `Re-anchor by pattern (never trust old line numbers). Save this JSON list of [path, literal] pairs to a temp file and run a short node script (so no shell quoting touches the literals, some contain quotes) that reads <repo>/<path> and finds each literal with String.indexOf. Return {"<literal>": "path:line" (1-based line of the first hit) | null, ...}. Pairs: ${JSON.stringify(ANCHORS.map(a => [a[0], a[1]]))}`
const anchorsLost = got => ANCHORS.filter(a => a[2] && !(got || {})[a[1]]).map(a => a[0] + ' :: ' + a[1])
const anchorMap = got => Object.entries(got || {}).filter(([, v]) => v).map(([k, v]) => `${k} -> ${v}`).join('\n')
const REC = {type: 'object', properties: {path: {type: 'string'}, sha256: {type: 'string'}, pass: {type: 'boolean'}, criteria: {type: 'integer'}}, required: ['path', 'sha256', 'pass', 'criteria']}
async function record(rel, obj, label) {
  const r = await crit(P(`Write the JSON below VERBATIM (2-space indent, trailing newline) to ${OUTABS}/${rel}, creating parent directories. Re-read the file, JSON.parse it, and return {path, sha256 (sha256sum of the file), pass: parsed.pass === true, criteria: (parsed.criteria || []).length}.\n\n${JSON.stringify(obj, null, 2)}`),
    {label: label || ('record ' + rel), phase: 'Record', schema: REC, ...M('mech')})
  if (!r || r.pass !== (obj.pass === true) || r.criteria !== (obj.criteria || []).length) { log('record-mismatch: ' + rel); return null }
  return r
}
const C = (id, desc, measured, threshold, ok) => ({id, desc, measured, threshold, pass: !!ok})
function gateObj(o) { return {job: JOB, date: DATE, mode: MODE, forced_by: FORCE, rounds: 0, criteria: [], artifacts: [], rulings_used: {}, gaps: [], ...o, pass: MODE === 'full' && !FORCE && (o.criteria || []).length > 0 && (o.criteria || []).every(c => c.pass)} }
function done(o) { return {job: JOB, date: DATE, mode: MODE, reason: '', rounds: 0, outputs: [], polish_note: '', polish_inserts: [], changelog_line: '', owner_rulings_used: {}, forced_by: FORCE, gate_path: null, ...o, pass: MODE === 'full' && !FORCE && !!o.pass} }
// ==== end filigree prelude ====
```

Notes on the prelude:
- In smoke mode `M()` forces haiku/low, `cap()` truncates every fan-out to one item, and `gateObj`/`done` force
  `pass:false`. The thresholds are still computed and recorded, but they cannot pass. In smoke and plan mode the
  gate chain (a previous job's `pass:true`) is **reported, not enforced**, so the four smokes can chain in one
  scratch `outDir`.
- `FORCE` lets jobs 2–4 skip the previous-gate check. It is recorded as `forced_by`, and that gate can never pass.
- Job bodies start with `checkArgs([...own keys])`, so a typo such as `maxround` dies instead of being ignored.
- Rulings merge in this order: embedded `RULINGS` < `docs/filigree/rulings.json` `overrides` (read by each preflight)
  < `args.rulings`. Every gate records `rulings_used`.
- Every job's preflight returns `rulings_overrides` (from `${DOCS}/rulings.json`) and `anchors`. The job then runs
  `const {r: RUL, used: RUSED} = rulingsMerge(pre.rulings_overrides)` and dies on `anchorsLost(pre.anchors)`.
- **A dead critical agent never throws.** When a `crit()` call still returns null, the job returns
  `done({pass:false, reason:'agent died: <label>', …})` together with whatever gate object it has computed so far.
  Only argument validation, missing inputs, a lost required anchor and the order rule may `die()`.
- `record()` writes the script-computed gate and ledger objects (`gates/<n>-<job>.json`, `gates/views.json`,
  `state/<n>-<job>.json`). It is one haiku agent. A read-back mismatch logs `record-mismatch`, and the caller then
  returns `pass:false, reason:'record-mismatch'` together with the computed gate object, so the polish run can
  write that object by hand.
- **Exception list.** Five other writers create shared files because the content is produced by the agent itself:
  the hex cropper (`gates/hexes.json`), the probe writer (`gates/2-probes.json`), the question writer
  (`gates/3-handtest-questions.json`), the unit recorders and the diagnoser (`state/3-build/*.json`). Each of them
  must end with `READBACK` and return `{path, sha256, parsed:true}` in its schema; the script checks `FILE_OK(r)`
  and treats a failure exactly like a dead agent. Every other agent writes only the files it owns.
- **Reserved identifiers.** Job bodies must not declare any of these top-level names, because the prelude owns
  them and the whole file is one function body (a duplicate `const` is a SyntaxError): `A, die, DATE, MODE, REPO,
  OUT, OUTABS, DOCS, underDocs, ROUNDS, RESUME, FORCE, SHARED_ARGS, checkArgs, RULINGS, rulingsMerge, rulingText,
  PAIR, M, MO, MODELS, EFFORTS, cap, norm, crit, kept, RULE, NOGIT_RULE, P, READBACK, FILE_OK, VOCAB, VOCAB_RULE,
  CLOCK_GREP, absP, blindBad, ANCHORS, ANCHOR_TASK, anchorsLost, anchorMap, REC, record, C, gateObj, done, JOB,
  meta`. Job-local names must differ (bands are the single object `BANDS`, counters are `nDone`, `nTotal`, never
  `done`). README §8 (a) compiles each whole file with `AsyncFunction`, so a collision fails the parse smoke.
- **Every `agent()` prompt is `P(...)` or starts with `RULE`.** Blind actors use `P(body, true)` (they get
  `NOGIT_RULE`: no git, write only the named files, no repo-layout hints). Acceptance: grep that no `agent(` call
  has a prompt argument that does not start with `P(`, `RULE` or a variable assigned from one of them.
- **Every `agent()` whose result is destructured, indexed or tested carries a `schema`** (root `type:'object'`,
  `required` ⊆ `properties`). Without one `agent()` returns a plain string and field reads silently yield
  `undefined`. The job docs list a schema for each of these agents; an agent with a free-text result is the only
  exception.
- **Null handling.** `parallel`/`pipeline`/`Promise.all` results may contain `null` (a dead agent). Two rules:
  (1) where position carries meaning (applier A/B, drafter A/B, the 3-agent Check and Slice-gate barriers, the
  judge panels) keep the `null`, treat it as a FAILING input to the criterion that depends on it, and record
  `agent died: <label>` in `criteria`; never read a null as a pass or as zeros. (2) Everywhere else pass the array
  through `kept(xs, what)`, which logs the drop and feeds the ≥75% coverage criterion.
- **Optional budget gate.** Before each follow-up or fix round, if `budget` exposes remaining capacity below that
  round's documented bound, skip the round, `log` it, and let the gate fail on its own criteria.
- Inputs vs outputs:
  - Static inputs are always read from `DOCS` (`docs/filigree/` in the repo): `research-dossier.md`, `todo-inputs.json`,
    `rulings.json` and README § Reuse map.
  - Everything a job writes, and everything a later job reads from an earlier one, lives under `OUTABS`.
  - So a smoke chain (jobs 1→4 in one scratch `outDir`) works without touching `docs/`.
- No script may contain clock or random **call syntax**, even inside a prompt string, because the parse smoke greps
  for it. Prompts use `CLOCK_GREP`, which is written with character classes.
- Agent prompts embed no run-varying value except `DATE` and the `anchorMap` text (line numbers that preflight
  re-derives from the repo). A same-args relaunch through `resumeFromRunId` with an unchanged repo is a full
  cache hit; after any repo edit the prompts that embed `anchorMap` miss the cache, which is accepted. Where
  caching matters (long fan-outs) a prompt gives the anchor patterns and tells the agent to grep for line numbers
  itself.

---

## meta

```js
export const meta = {
  name: 'filigree-1-research',
  description: 'Filigree Job 1: research the three plates, the Swiss layer list and Leponnia into a density bible; gate = blank-hex test',
  whenToUse: 'Run as the POLISH item "Filigree 1 · Research → density bible", in a fresh session: Workflow({name:"filigree-1-research", args:{date:"YYYY-MM-DD"}}). Docs + a read-only probe tool; never edits index.html or maps-site/index.html.',
  phases: [
    {title: 'Preflight', detail: 're-anchor by pattern, read ledger + rulings, crop the 12 fixture hexes'},
    {title: 'Research', detail: 'one targeted question per agent -> docs/filigree/research/<qid>.json'},
    {title: 'Verify', detail: 'per question: anchor + one kind lens (second-look / refute / recount / canon)'},
    {title: 'Synthesize', detail: 'opus/xhigh integrator -> density-bible.md/.json; validator + vocabulary grep'},
    {title: 'Blank-hex gate', detail: 'paired blind appliers (sonnet/high + opus/high) per fixture, instance resolver, scoring in code'},
    {title: 'Follow-up', detail: 'completeness critic -> fresh questions -> patcher -> re-gate (<= maxRounds)'},
    {title: 'Record', detail: 'gates/1-research.json, gates/1-hex-answers.json, state/1-research.json'}
  ]
}
const JOB = 'filigree-1-research'
```

## Args

The shared args come from the prelude: `date` (required), `repo`, `outDir`, `mode`, `maxRounds` (0..2), `rulings`, `resume`.
`force` is **rejected** for Job 1. Job 1 has no job-specific args: its body starts with `checkArgs([])`.

## Constants

**HEXES.** These are R17 fixtures: one z7 tile = 32 atlas px. Every cell was checked against the print
(contact sheet) and the DEM decode in this session.
- Cell `(cx,cy)` covers x ∈ [32cx, 32cx+32) and y ∈ [32cy, 32cy+32).
- The `note` column stays in the script constant and the gate record only. It is **not** written to
  `gates/hexes.json`, so appliers must classify the ground from the bible.

| id | cell | bbox x0,y0,x1,y1 | DEM h (m) | land frac | note (print / role) |
|---|---|---|---|---|---|
| F01 | 51,50 | 1632,1600,1664,1632 | 252.72..328.19 | 1.00 | summit cell: window maximum 328.19 in DEM cell 565,349 (centre 1649.06,1604.06), edge of AURA-HŌTH lettering |
| F02 | 43,49 | 1376,1568,1408,1600 | 136..151 | 1.00 | open plateau, blank on the print |
| F03 | 41,47 | 1312,1504,1344,1536 | 126..135 | 1.00 | open, inside printed PĒSHUNOR lettering (collision test) |
| F04 | 43,51 | 1376,1632,1408,1664 | 151..162 | 1.00 | open, DRANIMOS lettering, solid river at the edge |
| F05 | 42,45 | 1344,1440,1376,1472 | 44..131 | 1.00 | inland strip under the north-coast dotted road (steep) |
| F06 | 48,47 | 1536,1504,1568,1536 | -41..88 | 0.29 | coast + dotted road between Kanae and Rhup |
| F07 | 40,43 | 1280,1376,1312,1408 | -21..24 | 0.13 | Paerāndas islets |
| F08 | 50,43 | 1600,1376,1632,1408 | -46..-43 | 0.00 | open sea (control) |
| F09 | 45,47 | 1440,1504,1472,1536 | 137..142 | 1.00 | Aldorūs (1448.6,1527.5) + solid river: river-town control |
| F10 | 38,44 | 1216,1408,1248,1440 | -15..98.5 | 0.72 | Epēshu ◉ (1236.1,1415): painted-city control |
| F11 | 35,44 | 1120,1408,1152,1440 | -42..65 | 0.26 | Lepon the Old ruin coast (1146.5,1420.2): old-survey control |
| F12 | 83,6 | 2656,192,2688,224 | — (outside window) | — | open ground by the "Mountain Wall" marker (2676,206): no-DEM control |

In code: `const HEXES = [{id:'F01', cell:[51,50], bbox:[1632,1600,1664,1632], note:'…'}, …]`. The DEM column goes
into the q09 recount literals below.

**Fixed ground and views (R8):**
- `WINDOW=[1060,1240,1860,2040]`
- `SHEET_ONE_BBOX=[1216,1376,1760,1664]`
- Coast bands for the walk, one object (never top-level `W`/`M`/`E`, which collide with prelude names):
  `const BANDS = {W: [1216,1376,1400,1664], M: [1400,1376,1580,1664], E: [1580,1376,1760,1664]}`
- City quarter **Q1** = Epēshu chart px [256,2304)×[1280,3328), which is chart z3 tiles x 1..8, y 5..12. It covers about a
  quarter of the 3914×4200 chart and contains the Forum, the Marble Quarter, the Māmban garden (a park void),
  the Necropolis, Wood Quay and the temples (`maps-site/data/chart-pois.json`, chart px).
- Era tiles for q14: z5 (11,11), (9,11) and (10,12).

**CHECKLIST** (27 keys; the bible's `checklist` must map every key to an existing rule id):
- **BRIEF_ITEMS** (19, brief p5 with the R10 renames): `peak, height, homestead, reserve, river_fork, coast_road,
  plate2_deletions, plate3_deletions, block, park_void, arterial, fog_wash, contour_hill, old_survey,
  every_structure, caravan_halts, blazed_paths, muster_days, shut_ways`.
- **V2_ITEMS** (8, brief pp.6–8): `paint_on_base, names_on_threshold, appear_effect, one_question_view,
  pooled_edge, real_colour, cramped, data_truth`.

**VOCAB** (prelude constant, used by G1.7): `VOCAB` / `VOCAB_RULE` from §0.
- It applies to `density-bible.md` **outside** the sections `## Provenance` and `## Renames`.
- It also applies to every `fiction_name`/`label` string in `density-bible.json`.
- The shipped Tithe POIs are R10 rename items, listed in `## Renames`. They are never a Job 1 failure.

**QUESTIONS.** There are 18. Each agent answers ONE question and writes `research/<qid>.json`. The `lens` column
names the kind-specific verifier. The anchor lens is added whenever a returned claim carries `anchor` evidence.

| qid | question (one each) | reads | role | lens |
|---|---|---|---|---|
| q01 | Plate-one inventory per class (peak+height, homestead, reserve, river fork, coast road, shields, trails, ▲ glyphs, the braided river, the four-name valley knot); counts per class | brief PDF **p2** (Read `pages:"2"`) | deep | second-look |
| q02 | What plates two and three keep vs delete; the rule that a POI pin must never stand in for a landform name | brief PDF **pp.2–4** (plate one p2, plate two p3, plate three p4) | deep | second-look |
| q03 | Azlen city grain → measurable proxies (block grain scale, park void, arterial class, fog wash, contour hill, pooled edges, no chrome/pins), read from images | brief PDF **pp.4, 6** (Read `pages:"4,6"`; the brief has no Azlen image, so the proxies come from its text description); dossier §9 | deep | second-look |
| q04 | Swiss stack → fiction layers (old survey, every structure, caravan halts, blazed paths, muster days, shut ways, colour base): swap semantics (base/under/over), data today, gap. Use the README reuse map; reuse the shipped Beacon Post / Muster Ground POIs; flag Tithe renames (R10) | brief pp.4–5; dossier §5; README § Reuse map | judge | refute + canon |
| q05 | Coast walk band W (x1216–1400): everything the print draws per plate-one class (z5 tiles); what `maps_markers`/`city-anchors`/`named-ways`/`traced-roads`/`sea-lanes`/`wiki-places` carry inside the band; what plate-one classes are missing | `maps-site/tiles/5/`; `maps-site/data/{maps_markers,city-anchors,named-ways,traced-roads,sea-lanes,wiki-places}.json` | deep | second-look |
| q06 | Coast walk band M (x1400–1580), same task | same | deep | second-look |
| q07 | Coast walk band E (x1580–1760), same task | same | deep | second-look |
| q08 | City quarter Q1 in Azlen grain: block, park void, arterial, fog wash, contour hill. What exists on the chart vs the generated plan (`genCityCanvas` feature list), anchors, gaps | `maps-site/charts/epeshu/3/{1..8}/{5..12}.jpg`, `maps-site/data/chart-pois.json`, `maps-site/data/detail-charts.json` | deep | second-look |
| q09 | Relief supply. Decode `EPESHU_HF`; verify the transform on Aldorūs; per-fixture h range; local maxima with prominence ≥15 m inside `SHEET_ONE_BBOX`; contour spacing in screen px at z6/z7/z8 for 5 m interval; note that `genHydrology` carves `W.H`, so use the raw decode. **Write the committed read-only probe `tools/filigree-dem.js`** (pure Node + zlib): `--at x,y` → `{h}` (null outside window), `--bbox x0,y0,x1,y1` → `{land_frac,hmin,hmax,peaks:[{x,y,h,prom}]}` | `index.html` (anchor `const EPESHU_HF_URI`) | deep (tool) | recount |
| q10 | Water supply: sim rivers inside the window vs the solid black lines on the print; forks per coast band; propose the `rivers.json` source rule (DEM flow candidates kept only where the print shows a solid line) | `index.html`, tiles z5 | deep | second-look |
| q11 | Name supply: landform/structure roots + affixes, reserved canon words, sayability (the NAME repeat rule at anchor `NAME.used.has(n)`, seam rules), how many distinct names can be minted per class, proposed mint key (class, cellId) on xmur3/mulberry32 | `lexicon/patrinaic.json`, `tools/pgd2lexicon.js`, `index.html` | audit | canon |
| q12 | Data baseline: named-thing counts per class per fixture cell and per sheet-one band | `maps-site/data/*.json` (the six files listed in q05 plus `chart-pois.json`, `city-traits.json`, `gazetteer.json`) | mech | recount |
| q13 | Overlay hooks re-anchored: chronicle `chron`, `W.banditCamps`, ambush, famine/plague flags, Pebros camp, `W.dragon`, `W.weather` (no fog), Beacon Post / Muster Ground / Tithe POIs | `index.html`, `maps-site/index.html` | audit | (anchor only) |
| q14 | Do the Imperial/War eras differ from Modern in roads/forest, or only in names/borders? 3 fixed land tiles × 3 eras | `maps-site/tiles*/5/{11/11,9/11,10/12}.jpg` | deep | second-look |
| q15 | The v2 camps → per-sheet rules: paint on the base, names on a threshold, the appear effect, one-question views, pooled-edge contrast, real colours, "cramped" (min label spacing at 390 px), data truth | brief pp.6–8; dossier §9 | judge | refute + canon |
| q16 | Printed lettering per fixture: which of F01–F12 the print already fills with hand lettering or glyphs (collision with overlay labels) | `gates/hex/Fxx.jpg` | deep | second-look |
| q17 | Prerequisite audit. Find the POLISH items by title text ("Traced road network", "Census second pass", "Uncharted-band softening", "Data fetch cache-busting", "Tier-hidden markers", "Region-chart zoom-through", "Sim ↔ atlas continuity"; all seven titles exist in `POLISH.md` today): checked? Do their promised files exist? Is `maps-site/data/traced-roads.json` loaded by `maps-site/index.html` (code reading, hence audit)? A missing or unloaded `traced-roads.json` is a q17 **finding**, never a preflight failure | `POLISH.md`, `maps-site/` | audit | — |
| q18 | Stamen Watercolor method (mask, blur, edge-darken) as a pooled-edge precedent: one web attempt; if egress is blocked, return a single claim with confidence low and `evidence.kind:'web', ref:'U'` | web | audit | — |

Lens → role:
- `second-look`: deep (sonnet/high). A partly independent re-read of the same page, crop or tiles: it sees the claim text
  without its evidence refs and must write its own reading first.
- `refute`: judge. "Refute claims you can disprove with evidence; keep what you cannot."
- `recount`: mech. Re-run the computation. For q09 it runs `tools/filigree-dem.js` twice: sha equal, plus these
  literals:
  - `--at 1649,1604` → 328.19 ±0.1;
  - `--at 1449,1528` → 139.31 ±0.5;
  - `--bbox` F08 → hmax < 0;
  - `--bbox` F01 → hmin 252.72 ±1, hmax 328.19 ±1.
- `canon`: audit. Voice, Kembar, A.B. and the VOCAB regex.
- `anchor`: mech. Every `anchor` ref resolves (`grep -nF -e <literal> <file>`, quoting the literal properly; a literal
  containing a single quote is passed through a temp file or double quotes).

**Encoding.** In the script `QUESTIONS` is an array of literals, never parsed from this table:
`{qid:'q09', short:'relief supply', question:'…', reads:['index.html'], role:'deep', tool:true, lens:['recount']}`.
- `role` is always a `PAIR` key (`deep (tool)` → `role:'deep', tool:true`); `M()` dies on an unknown role.
- `lens` is always an array of lens ids: `refute + canon` → `['refute','canon']`; `(anchor only)` and `—` → `[]`.
- `lensesFor(q, r)` = `q.lens` plus `'anchor'` when any claim in `r.claims` has `evidence.kind === 'anchor'`;
  duplicates removed; `cap()` applies in smoke.
- The role per question is the one in the table. Deviations from the README §6 pairing table are justified there
  (the opus `refute` lens is kept only for the interpretive questions q04 and q15; q03 reads images, so it takes a
  `second-look`).

**Implementation appendix (helpers the prelude does not define).** Each is a plain function in the job body.
- `ledgerOk(qid)`: true when `pre.ledger.questions` has `qid` with `sha_ok` (the evidence file re-hashed to the
  recorded sha) and, for a tool question (q09), the preflight DEM probe passes (otherwise the tool question re-runs and
  rewrites `tools/filigree-dem.js`). The ledger holds only questions whose verify lenses all returned; a question with a
  dead lens is left out of it (and out of `seen_questions`), so a resume re-runs it. It is written only in the Record
  phase, so an abort before Record leaves no ledger. `todo = cap(QUESTIONS.filter(q => !(RESUME && ledgerOk(q.qid))))`: resumed questions are
  filtered first and `cap()` then truncates what is left (so in smoke the one kept question is the first
  un-resumed one); resumed questions contribute their recorded `claim_ids` and `struck`.
- `researchPrompt(q)`: `P(` + the contents listed under "Research + Verify" + `)`.
- `lensPrompt(L, q, r)`: `P(` + the lens instruction from the lens list above + the claims in `r` (ids and text) +
  "write nothing; return the LENS object" + `)`. The `anchor` and `recount` lenses may run commands; the
  `second-look` lens must re-read the SAME source independently and must not open `research/<qid>.json`'s evidence.
- `applyPrompt(h)`: `P(` the blind-applier prompt below with `<id>` filled in, `true)`. It is identical for A and B.
- `resolvePrompt(h, pair)`: `P(` the resolver instructions + both appliers' `items` (null → "no items") +
  `)`.
- Image tooling, pinned for every cropper/rasterizer in the four jobs: ImageMagick `convert` (present at
  `/usr/bin/convert`) and Python PIL; no `sharp`, no `playwright install`. The hex cropper maps atlas px to z5 tiles
  with `tile_x = floor(x / 128)`, `tile_y = floor(y / 128)` (z5 = 2 screen px per atlas px, so a 256 px tile spans 128 atlas px; F12 at (2656,192) → tile 20/1; verify against
  `maps-site/tiles/5/<x>/<y>.jpg` naming before cropping) and stitches the needed tiles with `convert` before
  cropping.
- PDF pages: the brief is read with the Read tool's `pages` argument (max 20 pages per call). Every prompt that reads
  the PDF names its pages.
- F12 (cell 83,6) lies outside the DEM window. Its z5 tile `maps-site/tiles/5/20/1.jpg` exists (checked 2026-10-04);
  preflight lists `tiles/5/20/1.jpg` under inputs so a missing one is reported, and the cropper uses its neighbours
  for the margin.
- q18 needs web access, which the sandbox proxy may block; the question already says to return one low-confidence
  claim with `evidence.kind:'web', ref:'U'` when egress fails.

---

## Agents and schemas

`QSCHEMA` is used by every research agent. The claim id is `<qid>-cNN`.
```json
{"type":"object","properties":{
  "qid":{"type":"string"},"path":{"type":"string"},"sha256":{"type":"string"},
  "claims":{"type":"array","items":{"type":"object","properties":{
    "id":{"type":"string"},"text":{"type":"string"},
    "evidence":{"type":"object","properties":{"kind":{"type":"string","enum":["pdf-page","crop","anchor","computed","data","web"]},"ref":{"type":"string"}},"required":["kind","ref"]},
    "confidence":{"type":"string","enum":["high","medium","low"]}},"required":["id","text","evidence","confidence"]}},
  "gaps":{"type":"array","items":{"type":"string"}},
  "summary":{"type":"string"}},
 "required":["qid","path","sha256","claims","gaps","summary"]}
```

`LENS` is used by every verifier:
```json
{"type":"object","properties":{"lens":{"type":"string"},"checked":{"type":"integer"},
  "struck":{"type":"array","items":{"type":"object","properties":{"claim":{"type":"string"},"why":{"type":"string"},"evidence":{"type":"string"}},"required":["claim","why","evidence"]}}},
 "required":["lens","checked","struck"]}
```

### Preflight (phase `Preflight`)
1. **`preflight`** (mech, `crit`). Its prompt is `RULE` + `ANCHOR_TASK` + checks:
   - inputs exist:
     - `docs/research/filigree-for-the-table.pdf`;
     - `${DOCS}/research-dossier.md`;
     - `${DOCS}/todo-inputs.json`;
     - `maps-site/tiles/5`, `tiles-war/5`, `tiles-imperial/5`;
     - `maps-site/charts/epeshu/3`, `maps-site/tiles/5/20/1.jpg`;
     - `lexicon/patrinaic.json`;
     - `maps-site/data/{maps_markers,city-anchors,named-ways,traced-roads,sea-lanes,wiki-places,chart-pois,detail-charts,city-traits}.json` (absence of `traced-roads.json` is reported in `missing` only if the file is truly gone; whether it is *loaded* is q17's finding);
     - `tools/pgd2lexicon.js`, `tools/build-gazetteer.js`;
   - reads `${DOCS}/rulings.json` (`overrides` object, `{}` if absent);
   - reads `${OUTABS}/state/1-research.json` if present. For each recorded question it re-hashes `path` and reports
     whether the sha matches;
   - runs the DEM probe (`tools/filigree-dem.js`, the G1.11 literals) and reports it as `dem`;
   - reads `${OUTABS}/gates/1-research.json` if present (`gate_prev`): when the gate is pass on a bible that still
     re-hashes, a resume run returns `pass:true` without re-running; if the ledger or `gates/1-hex-answers.json` is
     missing it returns `record-incomplete` instead of rebuilding, and the operator deletes `gates/1-research.json` or
     passes `resume:false` to redo Job 1.

   `rulings.json` is optional for Job 1 (absent = `{}`); if the owner or the polish run creates it, its shape is
   `{"date":"…","overrides":{},"confirmed":[]}`. Job 1 uses the defaults for R8, R10, R17, R19–R22 unless it overrides them.

   Schema:
```json
{"type":"object","properties":{
  "missing":{"type":"array","items":{"type":"string"}},
  "anchors":{"type":"object","additionalProperties":{"type":["string","null"]}},
  "rulings_overrides":{"type":"object","additionalProperties":{"type":"string"}},
  "ledger":{"type":"object","properties":{
    "questions":{"type":"array","items":{"type":"object","properties":{"qid":{"type":"string"},"path":{"type":"string"},"sha_ok":{"type":"boolean"},"claim_ids":{"type":"array","items":{"type":"string"}},"struck":{"type":"array","items":{"type":"string"}}},"required":["qid","path","sha_ok","claim_ids","struck"]}},
    "seen_questions":{"type":"array","items":{"type":"string"}}},"required":["questions","seen_questions"]}},
 "required":["missing","anchors","rulings_overrides","ledger"]}
```
   Script behaviour:
   - `null` → return `done({reason:'agent died: preflight'})`.
   - `missing.length` → `die('missing inputs: …')`. This applies in `plan` mode too: a plan-mode preflight failure is
     the same failure as in a full run (plan mode is a dry run of the real preflight, not a bypass).
   - `anchorsLost(pre.anchors).length` → `die('anchor lost: …')`.
   - `const {r: RUL, used: RUSED} = rulingsMerge(pre.rulings_overrides)`.
2. **`mode:'plan'`** returns here: `done({reason:'plan', schedule:[{phase, agents_min, agents_max}]})`. The numbers are
   computed from the constants:
   - Research: 18 (minus questions resumed);
   - Verify: ≤36;
   - Synthesize: 3;
   - Blank-hex gate: 37;
   - Follow-up: ≤2×58;
   - Record: 3;
   - total bound ≈ 224 (the plan result's `agents_bound`, counting `crit()` retries: one retry each for the preflight, hex cropper, integrator, ambiguity judge, patcher and the 3 records).
3. **`hex cropper`** (mech, `crit`). For each HEX it crops the z5 tiles (2 screen px per atlas px) over the cell
   bbox plus one cell of margin (96 atlas px). It upscales ×2 to 384×384 (4 px per atlas px) and writes JPEG q85 to
   `${OUTABS}/gates/hex/<id>.jpg`. It then writes `${OUTABS}/gates/hexes.json` as
   `{date, unit:'z7 tile = 32 atlas px', hexes:[{id, cell, bbox, center, crop:{path, x0, y0, scale:4}}]}`, with no
   note field. It ends with `READBACK`. Schema: `{"type":"object","properties":{"hexes_path":{"type":"string"},"path":{"type":"string"},"sha256":{"type":"string"},"parsed":{"type":"boolean"},"crops":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"path":{"type":"string"}},"required":["id","path"]}}},"required":["hexes_path","path","sha256","parsed","crops"]}`; the script checks `FILE_OK`.
   - `gates/hexes.json` and `gates/hex/*.jpg` are **frozen** once written: on a rerun the cropper first checks that
     all 12 crops and `hexes.json` exist and parse, and then returns them untouched. If the fixtures in the script no
     longer match the frozen file, the run dies with `fixtures changed; delete gates/hex* to re-crop` rather than
     silently reusing the old crops.
   - A missing crop counts as an invalid hex (G1.3) and against coverage (G1.10).
   - F12 comes from `tiles/5/20/1.jpg` and its neighbours.

### Research + Verify (phases `Research`, `Verify`)
`const todo = cap(QUESTIONS.filter(q => !(RESUME && ledgerOk(q.qid))))`, where `ledgerOk` means the sha
re-hashed. Resumed questions contribute their recorded `claim_ids`/`struck`.

```js
const res = await pipeline(todo,
  q => agent(researchPrompt(q), {label: q.qid + ' · ' + q.short, phase: 'Research', schema: QSCHEMA, ...M(q.role)}),
  (r, q) => r && parallel(lensesFor(q, r).map(L => () =>
    agent(lensPrompt(L, q, r), {label: q.qid + ' · ' + L, phase: 'Verify', schema: LENS, ...M(LENS_ROLE[L])})))
    .then(vs => ({q, r, struck: vs.filter(Boolean).flatMap(v => v.struck.map(s => s.claim)), lensDrops: vs.filter(v => !v).length})))
```
- It is a pipeline, not a barrier, because each question's verifiers need only that question's output. Stage
  callbacks have the signature `(prev, item, index)`; the first stage receives `(item, item, index)`.
- A `null` entry in `res` (research agent dead, or its verifier stage short-circuited) means that question has no
  evidence: the script logs it, keeps the null out of every list via `kept(res, 'research+verify')`, and feeds the
  question id to the completeness critic as a gap. Lens verifiers that die are counted in `lensDrops`, not read as
  "nothing struck".
- `researchPrompt(q)` contains (all through `P(...)`, so it starts with `RULE`):
  - `RULE`;
  - the one question;
  - the reads;
  - `anchorMap(pre.anchors)`;
  - the fixed constants it needs (bands, Q1, WINDOW, HEXES bboxes);
  - `rulingText(RUL, ['R10','R17','R22'])`;
  - the instruction "write `${OUTABS}/research/<qid>.json` = your returned object + `date`; cite evidence per claim;
    unknown ⇒ a `gaps[]` entry, never a guess".
- `LENS_ROLE = {anchor:'mech', 'second-look':'deep', refute:'judge', recount:'mech', canon:'audit'}`.
- The script computes `STRUCK = ∪ struck` over the non-null entries. Coverage: `const {k: resK, ok: resOk} = kept(res, 'research+verify')`; `resOk` feeds G1.10.

### Synthesize (phase `Synthesize`)
1. **`bible integrator`** (integ = opus/xhigh, `crit`). It reads every `research/*.json`, the dossier §5–§9,
   `todo-inputs.json`, the brief, README § Reuse map, and the struck list. Instructions:
   - "never cite a struck claim";
   - `rulingText(RUL, ['R1','R2','R3','R5','R6','R8','R9','R10','R11','R17','R19','R20','R21','R22'])` (R11 included);
   - the CHECKLIST keys;
   - the VOCAB rule.

   It writes `${OUTABS}/density-bible.md` (sections: per sheet, per class, fiction stack, plates, city grain, ground
   classes and their six, targets, prerequisites, `## Renames`, `## Provenance`) and `${OUTABS}/density-bible.json`:
```
{date, ground:{window:[1060,1240,1860,2040], sheet_one_bbox:[1216,1376,1760,1664]},
 rules:[{id:'B-01', text, kind:'must'|'forbidden'|'threshold'|'source'|'exempt', sheets:[…], cites:[claimId]}],   // ids stable across rounds
 sheets:{country|region|valley|city:{must:[ruleId], forbidden:[ruleId], band_hint:'W'|'M'|'E'|''}},   // band_hint = the sheet-one coast band whose counts calibrated this sheet's targets, '' when none
 classes:[{id, label, fiction_name, rank, sheets:[…], forbidden_on:[…], source_kinds:['dem'|'data'|'print'|'mint'|'sim'],
           instance_rule, min_per_cell:{<groundClass>:n}, reuse:'<pattern anchor> | NEW:<machinery>'}],
 ground_classes:{<id>:{criteria:'mechanical test (DEM land_frac/h, window, anchor kind…)', six:[classId×6], exempt_rule:''}},
 no_dem_rule:ruleId,
 layers:[{id, swiss_id, fiction_name, swap:'base'|'under'|'over', data_today, gap}],
 plates:{one:{classes:{<class>:n}}, two:{kept:[], deleted:[]}, three:{kept:[], deleted:[]}},
 city_grain:{block, park_void, arterial, fog_wash, contour_hill},     // each {rule, data_today, gap}
 targets:{per_view:{region:{<class>:n}, valley:{<class>:n}}},          // Job 4 G4.3 reads these
 prerequisites:[{item, blocks:'F3-A'|'F3-B'|'F3-C'|'F3-D', status:'checked'|'open'|'missing'}],
   // slices: F3-A ground (DEM-derived ground classes and the hex sampler; no data prerequisites), F3-B named things from
   // data (roads, census, markers), F3-C fiction stack layers and overlay hooks, F3-D city grain, plates and the final
   // gate. blocks = the earliest slice that cannot be built without the item ("Traced road network" and "Census second
   // pass" -> F3-B (R11); "Data fetch cache-busting", "Tier-hidden markers" and "Sim ↔ atlas continuity" -> F3-C;
   // "Uncharted-band softening" and "Region-chart zoom-through" -> F3-D); status comes from research q17
 checklist:{<27 keys>: ruleId}}
```
   Return schema:
```json
{"type":"object","properties":{
  "md":{"type":"string"},"json":{"type":"string"},"sha_md":{"type":"string"},"sha_json":{"type":"string"},
  "rule_ids":{"type":"array","items":{"type":"string"}},"class_ids":{"type":"array","items":{"type":"string"}},
  "ground_classes":{"type":"array","items":{"type":"string"}},"exempt_rules":{"type":"array","items":{"type":"string"}},
  "forbidden_by_sheet":{"type":"object","additionalProperties":{"type":"array","items":{"type":"string"}}},"checklist_keys":{"type":"array","items":{"type":"string"}},
  "cited_claims":{"type":"array","items":{"type":"string"}}},
 "required":["md","json","sha_md","sha_json","rule_ids","class_ids","ground_classes","exempt_rules","forbidden_by_sheet","checklist_keys","cited_claims"]}
```
   Code checks (the integrator's own return only cross-checks; the scored read is the validator's, below):
   - G1.2: every CHECKLIST key ∈ the validator's `checklist_keys`.
   - G1.8: the validator's `cited_claims ∩ STRUCK = ∅`; a struck cite the integrator self-reports also fails.
2. `parallel` of two mech agents. A barrier is fine here; there are only two.
   - **`bible validator`**: `JSON.parse` the bible. It checks:
     - required keys;
     - unique rule ids;
     - every `sheets.*.must/forbidden` id exists;
     - homestead and block checks are defined by `forbidden_on`: some class whose id or label matches /homestead/i lists
       `country` and `region` in `forbidden_on`, and some class matching /block/i lists `city`;
     - `sheets.country.forbidden` and `sheets.city.forbidden` are non-empty rule ids, and `sheets.region.forbidden`
       holds a rule that forbids homesteads (brief p8);
     - every `ground_classes.*.six` has 6 distinct existing class ids or an `exempt_rule` that exists;
     - every class has `fiction_name`, `rank`, `source_kinds` and `instance_rule`;
     - `no_dem_rule` exists.

     It also returns its own `sha_md`/`sha_json` (sha256 of both bible files), `checklist_keys` and `cited_claims`
     read from `density-bible.json`. A dead validator fails G1.1, G1.2 and G1.8.

     Schema: `{"type":"object","properties":{"ok":{"type":"boolean"},"failures":{"type":"array","items":{"type":"string"}},"sha_md":{"type":"string"},"sha_json":{"type":"string"},"checklist_keys":{"type":"array","items":{"type":"string"}},"cited_claims":{"type":"array","items":{"type":"string"}}},"required":["ok","failures","sha_md","sha_json","checklist_keys","cited_claims"]}`.
   - **`vocabulary grep`**: VOCAB over the `.md` outside `## Provenance`/`## Renames`, and over the JSON
     `fiction_name`/`label` strings. Schema: `{"type":"object","properties":{"hits":{"type":"array","items":{"type":"string"}}},"required":["hits"]}`.

### Blank-hex gate (phase `Blank-hex gate`)
**`applier A`** (deep = sonnet/high) and **`applier B`** (judge = opus/high) use identical prompts, per hex, built
with `P(body, true)` (blind: `NOGIT_RULE` only). The prompt:
- "You may read ONLY `${OUTABS}/density-bible.md`, `${OUTABS}/density-bible.json`, `${OUTABS}/gates/hexes.json`, the crop
  `${OUTABS}/gates/hex/<id>.jpg`, the data files the bible cites, and you may run `node tools/filigree-dem.js`.
- Open nothing else: the allowlist is enforced by the script from your `files_read` (anything outside it is a
  blind violation), so do not open the brief, `docs/research/`, the dossier, `todo-inputs.json`, the research
  files, the README or POLISH.
- Classify this hex into one of the bible's `ground_classes` using its `criteria`.
- Then name exactly SIX things that must appear on it before it may be empty, each a distinct bible class. Give
  each as an **instance** on THIS hex: atlas x,y inside the hex (±16 px margin), a name if it has one, and a
  source ref in one of these forms:
  - `dem:x,y`;
  - `data:<file>#<name>`;
  - `print:<hexId>@px,py` (crop pixels);
  - `mint:<class>:<hexId>`;
  - `sim:<literal grep pattern>`.
- Cite the bible rule that requires each one. If the bible exempts this ground class, cite the exemption rule
  instead of items.
- If you need something the bible does not give, set `bible_silent:true` and say what is missing.
- List every file you opened."

Schema (`APPLY`):
```json
{"type":"object","properties":{
  "hex":{"type":"string"},"ground_class":{"type":"string"},"exempt_rule":{"type":"string"},
  "items":{"type":"array","items":{"type":"object","properties":{
    "class":{"type":"string"},"rule":{"type":"string"},
    "instance":{"type":"object","properties":{"name":{"type":"string"},"x":{"type":"number"},"y":{"type":"number"}},"required":["name","x","y"]},
    "source":{"type":"object","properties":{"kind":{"type":"string","enum":["dem","data","print","mint","sim"]},"ref":{"type":"string"}},"required":["kind","ref"]}},
    "required":["class","rule","instance","source"]}},
  "bible_silent":{"type":"boolean"},"missing":{"type":"array","items":{"type":"string"}},
  "files_read":{"type":"array","items":{"type":"string"}}},
 "required":["hex","ground_class","exempt_rule","items","bible_silent","missing","files_read"]}
```

**`resolver`** (mech), one per hex, takes both appliers' items. For every item it checks two things:
- **The ref resolves:**
  - `dem` → `node tools/filigree-dem.js --at x,y` is non-null;
  - `data` → the entry exists;
  - `print` → the crop exists and the px is in bounds;
  - `mint` → the class allows `mint` and the bible defines a mint key;
  - `sim` → `grep -F` finds the literal.
- **The instance lies within the hex bbox ±16 px.** For a `print` ref, convert crop px with `x0 + px/4`.
- **The source sits where the instance does:** a `dem` ref's x,y equals the instance within 1 px; a `data` entry's own
  point or line lies in the hex ±16 px (`chart-pois` counts at its city anchor; an entry without coordinates fails); a
  `print` pixel lies within 2 atlas px of the instance.

Schema:
`{"type":"object","properties":{"hex":{"type":"string"},"results":{"type":"array","items":{"type":"object","properties":{"actor":{"type":"string","enum":["A","B"]},"idx":{"type":"integer"},"ok":{"type":"boolean"},"why":{"type":"string"}},"required":["actor","idx","ok","why"]}}},"required":["hex","results"]}`.

Ordering: the Research phase (which includes q09, the only writer of `tools/filigree-dem.js`) finishes before the gate
starts, and G1.11 re-verifies the tool; if `tools/filigree-dem.js` is missing when the gate would start, the gate is
skipped and G1.11/G1.3 fail with `dem tool missing` instead of letting the appliers run without it.

Control flow (a pipeline over hexes; the pair inside an item is a 2-agent barrier because the resolver needs both).
Stage callbacks are `(prev, item, index)`. The pair keeps its `null`s: `pair[0]`/`pair[1]` are positional (A and B),
and a null applier is an **invalid** applier for that hex (criterion `agent died: <hex> applier A|B`); the resolver
still runs on whichever applier is non-null. A hex whose whole item is null (`rows[i] === null`) counts as invalid in
G1.3 (12/12 is required) and is also reported in the coverage count; `rows` is passed through `kept(rows,
'blank-hex')` for coverage only, never used to shrink the denominator of 12.
```js
const rows = await pipeline(cap(HEXES),
  h => parallel(['A', 'B'].map(X => () => agent(applyPrompt(h), {label: `${h.id} · applier ${X}`, phase: 'Blank-hex gate', schema: APPLY, ...M(X === 'A' ? 'deep' : 'judge')}))),
  (pair, h) => agent(resolvePrompt(h, pair), {label: `${h.id} · resolver`, phase: 'Blank-hex gate', schema: RESOLVE, ...M('mech')}).then(res => ({h, A: pair[0], B: pair[1], res})))
```
Scoring is plain code, per hex:
- An applier is **valid** when:
  - it is non-null;
  - `blindBad(files_read, APPLIER_ALLOWED)` is empty, where `APPLIER_ALLOWED = [OUTABS + '/density-bible.md', OUTABS + '/density-bible.json', OUTABS + '/gates/hexes.json', OUTABS + '/gates/hex/', REPO + '/tools/filigree-dem.js', REPO + '/maps-site/data/', REPO + '/index.html', REPO + '/maps-site/index.html']` (the last two for `sim:` refs only);
  - `ground_class` ∈ bible;
  - either `exempt_rule` ∈ `exempt_rules` and equals that ground class's exemption (only F08 and F12 may be exempt; an
    exemption on any other hex makes the applier invalid), or there are 6 items with
    distinct classes ∈ `class_ids`, none in `forbidden_by_sheet` for the hex's sheet, and every `rule` ∈ `rule_ids`.
- `agree` = |classes A ∩ classes B|, or 6 when both cite the same exemption (applies to F08 and F12 only).
- A and B `ground_class` must be equal.
- `resolved(X)` = the count of X's items with resolver ok.

Then **one** **`ambiguity judge`** (judge, `crit`) runs, and only if any hex scores agree < 5, has a `bible_silent`, or
an invalid applier (agree < 5 and `bible_silent` are the only thresholds; there is no other ambiguity score). It sees the failing rows + the bible and returns
`{"type":"object","properties":{"gaps":{"type":"array","items":{"type":"object","properties":{"hex":{"type":"string"},"section":{"type":"string"},"what":{"type":"string"}},"required":["hex","section","what"]}}},"required":["gaps"]}`.

**Pass criteria.** All must hold. Thresholds are computed in smoke mode but not enforced.

| id | criterion | threshold |
|---|---|---|
| G1.1 | bible files exist + validator ok | `ok && failures=[]`, and the validator's sha256 of both bible files equals the integrator's or patcher's (the gate's artifacts record the validator's shas) |
| G1.2 | brief + v2 checklist covered (validator's read of `density-bible.json`) | 27/27 keys → existing rule ids |
| G1.3 | both appliers valid on every hex; same ground class | 12/12 |
| G1.4 | class agreement | ≥5/6 on ≥10/12 hexes AND ≥4/6 on all 12 |
| G1.5 | instance resolution | each applier ≥5/6 items resolve on every hex except F08 and F12, which alone may be exempt (an exemption elsewhere makes the applier invalid, G1.3, and the hex is still scored); overall ≥90%, and 0% (not 100%) when nothing is scored |
| G1.6 | bible silence | zero `bible_silent` |
| G1.7 | vocabulary | zero hits |
| G1.8 | struck claims (validator's read of `rules[].cites`) | none cited |
| G1.9 | blind compliance (allowlist check on the appliers' self-reported `files_read`; README states it is not a guarantee) | zero reads outside `APPLIER_ALLOWED` |
| G1.10 | coverage (resumed questions count as kept) | every fan-out ≥75% kept |
| G1.11 | DEM probe (also run in the preflight) | q09 recount literals match and the tool is deterministic (two runs, same sha) |

### Follow-up (phase `Follow-up`; loop `round < ROUNDS` while the gate fails)
1. **`completeness critic`** (judge). It turns `gaps` and the failing criteria into ≤5 follow-up questions
   `{qid:'f<round><n>', question, reads, role, lens}`.
   - Dedup against `seenQ = new Set(pre.ledger.seen_questions.map(norm))` (restored from the ledger, so reruns do not
     re-ask), plus every question asked earlier in this run; the schema is
     `{"type":"object","properties":{"questions":{"type":"array","items":{"type":"object","properties":{"qid":{"type":"string"},"question":{"type":"string"},"reads":{"type":"array","items":{"type":"string"}},"role":{"type":"string","enum":["mech","triage","audit","deep","judge"]},"lens":{"type":"array","items":{"type":"string","enum":["anchor","second-look","refute","recount","canon"]}}},"required":["qid","question","reads","role","lens"]}}},"required":["questions"]}`.
   - `qid = f<r><n>`, where `r` is numbered on from the highest follow-up round in `state/1-research.json` so follow-up
     qids never repeat across runs. An in-run G1.11 failure adds an `f<r>1` probe-rewrite question.
   - Zero fresh questions runs a patch-only round (patcher, validator/vocab, re-gate); every follow-up round patches.
2. The fresh questions (if any) go through the same Research→Verify pipeline.
3. **`bible patcher`** (judge, `crit`). It edits only the bible sections named in `gaps`, never renumbers rule ids, and
   returns the integrator schema.
4. Validator + vocabulary grep run again.
5. The gate re-runs on all 12 hexes, because the bible changed. Labels get the suffix ` r<round>`.

### Record (phase `Record`)
Three records, written by `recordD` (a `record()` that also checks a code-side digest: the canonical JSON length and the
length of every top-level array, so a truncated or altered copy is caught, besides `pass` and the criteria count):
- `gates/1-research.json`: `gateObj({criteria, rounds, artifacts:[bible md/json sha, hexes.json sha], rulings_used: RUSED, gaps, hex_notes: HEXES})`.
- `gates/1-hex-answers.json`: per hex, both appliers' items. Job 4 F05 checks that these instances exist on the
  dense render.
- `state/1-research.json`: `{job, date, questions:[{qid, path, sha256, claim_ids, struck}], seen_questions:[…], bible_sha}`.
  It lists only questions whose verify lenses all returned.

If any record returns null → `pass:false, reason:'record-mismatch'`, with the gate object in the return value.

## Return value
```
done({pass: gate.pass, reason: gate.pass ? '' : failing criterion ids joined, rounds,
  outputs: ['docs/filigree/density-bible.md', '…/density-bible.json', '…/gates/hexes.json', '…/gates/hex/', '…/gates/1-research.json', '…/gates/1-hex-answers.json', '…/research/', 'tools/filigree-dem.js'],
  gate_path: OUT + '/gates/1-research.json', owner_rulings_used: RUSED,
  polish_note: `density bible: ${n} rules, ${k}/12 hexes agree ≥5/6, ${res}% instances resolve, checklist 27/27 (round ${rounds})`,
  polish_inserts: gate.pass ? [] : [one stable "- [ ] **Filigree gap — close G1.n (…)**" item per failing criterion id plus one pointer to the gaps list, placed directly above Filigree 2; the operator skips any already queued],
  changelog_line: '- docs: Filigree 1 — density bible for Leponnia (blank-hex gate ' + (pass ? 'pass' : 'fail') + ')'})
```

## Outputs (repo)
| path | writer |
|---|---|
| `docs/filigree/research/q01..q18.json`, `f<r><n>.json` (r numbered on from the ledger's highest round) | research agents |
| `docs/filigree/gates/hex/F01..F12.jpg`, `gates/hexes.json` | hex cropper |
| `docs/filigree/density-bible.{md,json}` | integrator / patcher |
| `tools/filigree-dem.js` | q09 (read-only probe, pure Node; reused by Job 3's relief bake) |
| `docs/filigree/gates/1-research.json`, `gates/1-hex-answers.json`, `state/1-research.json` | `record()` |

## Loop bounds and dedup
- Follow-up rounds: ≤ `ROUNDS` (≤2), each ≤5 fresh questions.
- Dedup key: `norm(question)` across rounds and runs (`seen_questions`).
- One ambiguity judge per gate run.
- Agents (`full` mode): ≈ 97 for a clean pass, with a bound ≈ 224 including `crit()` retries. `mode:'plan'` prints the exact schedule.
