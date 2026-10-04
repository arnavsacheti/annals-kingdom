# Workflow 1 · `street-1-research.js` — Street 1 · Research → street bible

> Planning snapshot, 2026-10-04 (final integrated plan). Implementation-ready design for
> `.claude/workflows/street-1-research.js`. Where the committed script and this document disagree, the
> script wins (docs/street/README.md §0). This file also carries the **street prelude v1** in full (§0); the
> other three street designs reference it.

Inputs this design rests on: `docs/street/research-dossier.md`,
`docs/street/todo-inputs.json`, the filigree package (`POLISH.md`,
`docs/filigree/README.md`, `.claude/workflows/filigree-*.js`, read-only), and `index.html` re-grepped
2026-10-04 (anchors are by pattern; line numbers below are orientation only).

## 0. The street prelude v1 (byte-identical in all four street scripts)

Layout of every street script, exactly as the filigree scripts:

```
line 1      export const meta = { … }          (pure literal; no comment or blank line before it)
            const JOB = 'street-N-…'
            // ==== street prelude v1 — … ====   (the block below, byte for byte)
            …
            // ==== end street prelude ====
            checkArgs([...job keys...])        (first line of the job body)
```

**Derivation.** The block is filigree prelude v1 (`filigree-1-research.js`, between `// ==== filigree prelude v1`
and `// ==== end filigree prelude ====`) with exactly seven whole-line masks replaced and one config region
appended before the END marker:

| mask | filigree line (located by pattern) | street replacement |
|---|---|---|
| START | `// ==== filigree prelude v1 …` | `// ==== street prelude v1 — derived from filigree prelude v1 (masked diff: tools/street-drift.js D1); keep byte-identical across the four street scripts ====` |
| END | `// ==== end filigree prelude ====` | `// ==== end street prelude ====` (config region placed directly above it) |
| OUT | `const OUT = String(A.outDir \|\| 'docs/filigree')…` | the same with `'docs/street'` |
| DOCS | `const DOCS = REPO + '/docs/filigree' …` | `const DOCS = REPO + '/docs/street'` + comment |
| FULLOUT | `if (MODE === 'full' && !underDocs(OUTABS)) die(…)` | the same naming `docs/street` |
| J1FORCE | `if (A.force != null && JOB === 'filigree-1-research') die(…)` | `JOB === 'street-1-research'`, message "Street 1" |
| ANCHORS | `const ANCHORS = [` … `]` | the street anchor list |

Everything else (arg validation, `dayOk`, `PATH_OK`, smoke/plan/full rules, `checkArgs`, `RULINGS` R1–R22 and
`rulingsMerge`/`rulingText`, `PAIR`/`M`/`MO`, `cap`, `norm`, `crit`, `kept`, `RULE`/`NOGIT_RULE`/`P`,
`READBACK`/`FILE_OK`, `VOCAB`/`VOCAB_RULE`, `CLOCK_GREP`, `absP`/`blindBad`, `ANCHOR_TASK`/`anchorsLost`/`anchorMap`,
`REC`/`record`, `C`/`gateObj`/`done`) is the reviewed filigree code, unchanged. The config region holds every
street-specific constant. `tools/street-drift.js` (delivered with this plan, tested: faithful copies pass, a one-word
R6 edit fails D1 and D2, a banned word in an ST text fails D5, a changed chromium path fails D3) proves the derivation
at every street preflight.

**The exact block** (generated mechanically from the filigree prelude at delivery time with the seven masks above; the
generator is scratchpad-only and is not committed. The block below, config region and street `ANCHORS` included, IS the
byte source for all four scripts: paste it verbatim, never retype it. To re-derive it later use the README §12 recipe):

```js
// ==== street prelude v1 — derived from filigree prelude v1 (masked diff: tools/street-drift.js D1); keep byte-identical across the four street scripts ====
const A = (args && typeof args === 'object' && !Array.isArray(args)) ? args : {}
const die = m => { throw new Error(JOB + ': ' + m) }
const DATE = A.date
const dayOk = d => { if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false; const [y, m, n] = d.split('-').map(Number); return m >= 1 && m <= 12 && n >= 1 && n <= [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1] }
if (!dayOk(DATE)) die('args.date must be a "YYYY-MM-DD" string naming a real calendar day (scripts cannot read the clock)')
const MODE = A.mode || 'full'
if (!['full', 'smoke', 'plan'].includes(MODE)) die('args.mode must be full|smoke|plan')
const PATH_OK = /^[A-Za-z0-9_\/.+-]+$/   // repo/outDir reach unquoted shell lines in prompts; this charset needs no quoting
for (const k of ['repo', 'outDir']) if (A[k] != null && (typeof A[k] !== 'string' || !PATH_OK.test(A[k]))) die('args.' + k + ' must be a path string of letters, digits and _ / . + - only')
const REPO = String(A.repo || '/home/user/annals-kingdom').replace(/\/+$/, '')
if (!REPO.startsWith('/') || REPO.includes('//') || REPO.split('/').some(s => s === '.' || s === '..')) die('args.repo must be a normalized absolute path')
const OUT = String(A.outDir || 'docs/street').replace(/\/+$/, '')
if (OUT.includes('//') || OUT.split('/').some(s => s === '.' || s === '..')) die('args.outDir must not contain empty, . or .. segments')
const OUTABS = OUT.startsWith('/') ? OUT : REPO + '/' + OUT
const DOCS = REPO + '/docs/street'   // street static inputs (dossier, todo-inputs, rulings.json, README); filigree inputs come from FIL, read-only
const underDocs = p => p === DOCS || p.startsWith(DOCS + '/')
if (MODE === 'full' && !underDocs(OUTABS)) die('full runs write the durable record: args.outDir must be docs/street or a subdirectory of it')
if (MODE === 'smoke' && (!OUT.startsWith('/') || OUTABS === REPO || OUTABS.startsWith(REPO + '/'))) die('smoke runs must pass an absolute args.outDir outside the repo (use the session scratchpad)')
const ROUNDS = A.maxRounds ?? 2
if (!Number.isInteger(ROUNDS) || ROUNDS < 0 || ROUNDS > 2) die('args.maxRounds must be an integer 0..2')
if (A.resume != null && typeof A.resume !== 'boolean') die('args.resume must be a boolean')
if (A.rulings != null && (typeof A.rulings !== 'object' || Array.isArray(A.rulings))) die('args.rulings must be a plain object')
const RESUME = A.resume !== false
const SHARED_ARGS = ['date', 'repo', 'outDir', 'mode', 'maxRounds', 'rulings', 'resume', 'force']
function checkArgs(extra) { for (const k of Object.keys(A)) if (!SHARED_ARGS.concat(extra || []).includes(k)) die('unknown arg ' + k) }   // every job body calls this first, listing only its own keys
if (A.force != null && JOB === 'street-1-research') die('args.force is not accepted by Street 1 (there is no earlier street gate to skip)')
if (A.force != null && (typeof A.force !== 'string' || !A.force.trim())) die('args.force must be a non-empty reason string (omit it, never false or 0, for an unforced run)')
const FORCE = A.force == null ? null : A.force.trim()
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
  R10: 'Vocabulary: "coach posts" -> caravan halts / waystations; "artillery hours" and live-fire "range" wording dropped (the layer is muster days); "the 1864 sheet" -> the old survey (Imperial / War era sheets); "closures" -> shut ways; the shipped The Tithe-Yard / The Tithe-Barn POIs are renamed by a Job 3 unit to The Tribute-Yard / The Tribute-Barn, and the same unit rewords their description (d:) strings too (the Tithe-Yard\'s "harvest-tithe" -> "harvest-tribute"), so no "tithe" in any case remains in maps-site/index.html (a rename, never a Job 1 gate failure; Job 4 F06 checks this pair by name AND grep -ci tithe maps-site/index.html == 0).',
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
for (const [k, v] of Object.entries(A.rulings || {})) { if (!Object.prototype.hasOwnProperty.call(RULINGS, k)) die('unknown ruling ' + k); if (typeof v !== 'string' || !v.trim()) die('ruling ' + k + ' must be a non-empty string') }
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
const NOGIT_RULE = `Never run git. Use absolute paths. Write nothing except the files this prompt names. Return only the requested JSON.`   // blind actors: no repo-root, no date, no hints about the layout
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
  ['index.html', 'function xmur3(str){', 1], ['index.html', 'function makeStream(s){', 1], ['index.html', 'function updateLOD()', 1],
  ['index.html', 'function tick(dt, nowMs)', 1], ['index.html', 'function frame(nowMs)', 1], ['index.html', 'function simAdvance(nd)', 1],
  ['index.html', 'function updateAgents()', 1], ['index.html', 'function processArrivals(day)', 1], ['index.html', 'function routePos(', 1],
  ['index.html', 'let shadowsOn = true', 1], ['index.html', 'const wantShadow', 1], ['index.html', 'const darkHour =', 1],
  ['index.html', 'renderTod = (renderTod', 1], ['index.html', 'camera.near = clamp(R*0.02, 0.5, 50)', 1], ["index.html", "window.addEventListener('keydown'", 1],
  ['index.html', 'let fpsAvg = 60, degradeStep', 1], ['index.html', 'function applyGotoFromHash()', 1], ['index.html', 'window.ANNALS = {', 1],
  ['index.html', 'W.weather = ', 1], ['index.html', 's.gates = []', 1], ['index.html', 's.streets.push', 1], ['index.html', 'W.bridges = []', 1],
  ['index.html', 'every InstancedMesh sharing MAT.world MUST carry instanceColor', 1], ['index.html', "templeName:'the Blue Temple of Thobrauk'", 1],
  ['index.html', "{name:'Wood Quay'", 1], ['index.html', "{name:'Epēshīn Forum'", 1], ['index.html', 'id="ovMenu"', 1],
  ['index.html', 'location.hash.match(/s=([^&]+)/)', 0], ['index.html', "'#s='+encodeURIComponent", 0],
  ['index.html', '/* STREET */', 0], ['index.html', '/* /STREET */', 0], ['maps-site/index.html', '/* FILIGREE */', 0], ['maps-site/index.html', '/* /FILIGREE */', 0]
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
// ---- street config ----
const FIL = REPO + '/docs/filigree'   // the filigree record: read-only for the whole street track
const FIL_CITED = ['R6', 'R9', 'R10', 'R12', 'R13', 'R15', 'R16', 'R18', 'R22']   // cited by id; texts = RULINGS above (verbatim, drift check D1) + docs/filigree/rulings.json overrides
if (A.rulings != null) die('args.rulings sets the filigree R1..R22 and is refused here: the street track reads R overrides only from docs/filigree/rulings.json; use args.streetRulings for ST ids')
const ST_RULINGS = {
  ST1: 'Placement: the street view lives in the sim only (index.html, 3D), inside one /* STREET */ ... /* /STREET */ block plus the hook lines the spec declares; the atlas, docs/filigree/ and tools/filigree-* are never edited; the atlas-to-sim deep link belongs to the POLISH item "Sim ↔ atlas continuity".',
  ST2: 'Scope: every settlement gets the generic tiers (the procedural seed tamar1374 tests it); Epēshu-specific facades only inside Epēshu; street ground sits on the existing heightfield and interpolates the 11.72 m grid corners, never new relief (R22 cited).',
  ST3: 'Queueing is render-only: street code moves only mesh transforms; departDay, route and speed are never touched; no accumulator is fed by render frames; the simDays(400) fingerprint is identical with the street view on, off and never loaded.',
  ST4: "Randomness: every street choice comes from a keyed stream makeStream(W.seed+':st:'+cls+':'+id+':'+day) (the sim's own xmur3 -> sfc32 idiom, index.html function makeStream), cached per key; presentation time is ST.t accumulated from dt only; the STREET block never names W.rng, Math.random, Date.now, performance.now or nowMs.",
  ST5: 'Gates at the dark hour: gate leaves are drawn shut while the drawn eclipse lasts (the render-time darkHour, driven by renderTod); presentation only, never a hindrance to the caravans, because the sim day and the light day are decoupled; player text "the gates shut at the dark hour"; canon unconfirmed (an owner veto leaves them open).',
  ST6: 'Obstacles: one-lane bridges and fords are crossed in turn by arrival order; toll halts hold a dwell; schedules are keyed on (seed, route, day); the queue offset is a closed-form function of the day and the neighbours, visual only.',
  ST7: 'Layers: rows only, no new keys; hash param street=1, default off; sub-rows "roads and folk", "clouds", "weather", "shadows"; the shadows row defaults on (today\'s look) and reads "held off for speed" at degradeStep >= 3; the owner flips the street default only after Street 4 passes and the ST8 device run passes.',
  ST8: 'Perf evidence: sandbox gates use deterministic counts (calls, tris, geometries, quads and tris built per frame, resident tris) and exact off-identity under the probe\'s virtual clock, never wall-clock times; device fps >= 42 with degradeStep 0 over a 60 s descent is owner-run (tools/street-probe.js --device -> docs/street/device/<date>.json) and is the precondition for the default flip.',
  ST9: 'Workers: none; a time-sliced main-thread queue with at most 6 quad jobs and a triangle cap per frame; a full LRU stays coarse.',
  ST10: 'VTT export and party presence: out of scope (unsourced: no grid, scale or capture spec). The battle sheet is a separate owner-gated POLISH item, enabled only when this ruling is overridden with its scale (for example "battle sheet: 5 ft squares at 70 px").',
  ST11: 'Fog: the R13 fog function is copied byte-identical, with the helpers it calls, inside the STREET namespace from the /* FILIGREE */ block; no W.weather fog state; while the atlas function does not exist the fog unit records a gap and invents nothing.',
  ST12: 'Marble: stone-tier buildings inside Epēshu\'s footprint take a marble-pale palette; other cities unchanged; the Blue Temple of Thobrauk on Wood Quay\'s northern edge is the one landmark facade.',
  ST13: 'Review cycles and crowds: punch items go directly above Street 4; at most 2 review cycles, then the owner (mirrors R16); crowds are keyed daily by (seed, settlement, day) and scaled by s.pop; no named market day (the calendar is not canon).',
  ST14: 'Releases: every street run is its own polish run and cuts its own patch release; docs-only runs use a "docs:" CHANGELOG line (R15 cited); nothing street-made sits unpushed across a filigree cut.',
  ST15: 'lenient: Street 3 runs only when docs/filigree/gates/3-build.json passed (full, unforced), the Filigree 3 box is checked and no Filigree 3 stuck unit, Filigree 4 punch or Filigree data item is open; an override starting "strict" additionally needs the latest Filigree 4 gate to pass.',
  ST16: 'Words: new player-facing words come from the Patrinaic lexicon (lexicon/patrinaic.json, reserved canon words excluded) or plain bronze-age English; minted names follow R9 (cited); VOCAB_ST extends the R10 list; the shipped "cog" stays but is not spread.',
  ST17: 'Provenance: names of the source post, its repository and its data sources appear only under "## Provenance"; the post itself stays the owner\'s paraphrase.',
  ST18: 'Hash parser: slice S0 anchors seed parsing to a param boundary ((?:^#|&)s=) at both parse sites and makes every #s= writer keep the other params; existing hashes parse identically (the X5 table); a new street hash param matches ^[a-z]+$, does not end in "s", and is not s, goto or filigree; notices= is read only after this lands.',
  ST19: 'Weather density: a "weather" sub-row with four steps (full, three-quarters, half, quarter) scales the drawn count of the existing precipitation points (draw range only, no new randomness); roof masks only where the count is exact under the probe, else a recorded gap.'
}
const ST_FIXED = ['ST3', 'ST4', 'ST18']   // determinism and parser constraints: never overridable
if (A.streetRulings != null && (typeof A.streetRulings !== 'object' || Array.isArray(A.streetRulings))) die('args.streetRulings must be a plain object')
for (const [k, v] of Object.entries(A.streetRulings || {})) { if (!Object.prototype.hasOwnProperty.call(ST_RULINGS, k)) die('unknown street ruling ' + k); if (ST_FIXED.includes(k)) die('street ruling ' + k + ' is a fixed constraint'); if (typeof v !== 'string' || !v.trim()) die('street ruling ' + k + ' must be a non-empty string') }
function stRulingsMerge(fileOverrides) {
  const r = {}, used = {}, fo = (fileOverrides && typeof fileOverrides === 'object') ? fileOverrides : {}
  for (const k of Object.keys(ST_RULINGS)) {
    if (ST_FIXED.includes(k) && fo[k] != null) log('docs/street/rulings.json overrides fixed street ruling ' + k + ': ignored')
    const a = (A.streetRulings || {})[k], f = !ST_FIXED.includes(k) && typeof fo[k] === 'string' && fo[k].trim() ? fo[k] : null
    r[k] = a || f || ST_RULINGS[k]; used[k] = a ? 'args' : f ? 'rulings.json' : 'default'
  }
  return {r, used}
}
const strict = str => /^strict/i.test(String(str.r.ST15 || '').trim())
const PORT = A.port ?? 0   // 0 = the probe binds an OS-assigned free port, so parallel probe runs never collide
if (!Number.isInteger(PORT) || (PORT !== 0 && (PORT < 1024 || PORT > 65535)) || PORT === 8544) die('args.port must be 0 or an integer 1024..65535 other than 8544 (the probe serves the repo itself; 8544 belongs to server.js and the filigree jobs)')
const SEEDS = ['epeshu', 'tamar1374']   // the canon seed and filigree Job 3's procedural smoke seed
const V_BUST = Number(DATE.replace(/-/g, ''))
const KEY_IDIOM = "makeStream(W.seed+':st:'+cls+':'+id+':'+day)"
const VOCAB_ST = new RegExp(VOCAB.source.replace(/\)\\b$/, '|curfews?|cars?|trucks?|bus(es)?|taxis?|automobiles?|motorcars?|railways?|locomotives?|trams?|stoplights?|traffic lights?|signals?|pedestrians?|crosswalks?|zebra crossings?|lane lines?|sidewalks?|toll booths?|police|petrol|neon|asphalt|tarmac)\\b'), 'i')
const VOCAB_ST_RULE = `Banned vocabulary (case-insensitive regex ${VOCAB_ST.source}) must not appear in new player-facing text, fiction names, street-class labels or row labels, except inside the sections "## Provenance" and "## Renames". Bronze-age words: the gates shut at the dark hour; caravan halts and waystations; toll halts; fords and one-lane bridges crossed in turn; roads and folk. Voice: bronze-age Nīmlad, the nine Kembar, years A.B.`
const ST_CLOCK_GREP = CLOCK_GREP + '|performance[.]now'   // the STREET block also gets two separate greps: W[.]rng and nowMs
const RO_RULE = `Read-only for you (never write, move or delete): ${FIL}/**, ${REPO}/maps-site/**, ${REPO}/.claude/**, ${REPO}/tools/filigree-*.`
const PS = (body, blind) => P((blind ? '' : RO_RULE + '\n') + body, blind)   // every street agent() prompt in a job body is PS(...); record/recordD keep P
const PROBE = REPO + '/tools/street-probe.js'
const SANDBOX_ST = `Sandbox recipe for the street track (CDNs are blocked; npm is not): every browser step goes through node ${PROBE}, which serves ${REPO} read-only with its own static server on --port ${PORT} (0 = an OS-assigned free port, so parallel probe runs never collide); never start, stop or reuse server.js on 8544 (it belongs to the filigree jobs). In a temp dir (mktemp -d) run npm pack leaflet@1.9.4 three@0.128.0 and extract them to leaflet/ and three/, then pass --cdn-dir <tmp>: the probe routes **/three.js/r128/three.min.js to <tmp>/three/build/three.min.js and **/leaflet@1.9.4/dist/* to <tmp>/leaflet/dist/<file> (page.route + fulfill from disk). Playwright comes from NODE_PATH=/opt/node22/lib/node_modules; if its bundled browser is missing, launch Chromium with executablePath /opt/pw-browsers/chromium-1194/chrome-linux/chrome; never run playwright install. A setup failure (port, browser, CDN) is an infra_error, never a street defect.`
const DRIFT_TASK = `Drift check (read-only): from ${REPO} run node tools/street-drift.js --json and return its stdout parsed: {ok, checks: [{id, ok, detail}]}. If tools/street-drift.js is missing, return {ok: false, checks: [{id: "D-", ok: false, detail: "tools/street-drift.js missing"}]}.`
const FIL_ANCHOR_TASK = `Filigree anchors (read-only; a node script in a mktemp -d dir): read ${REPO}/.claude/workflows/filigree-1-research.js, take the text from the line that starts "const ANCHORS = [" through the next line that is exactly "]", evaluate it as an array literal (new Function("return " + text without the leading "const ANCHORS = ")), keep the entries whose path is "index.html" and whose flag is 1, and find each literal in ${REPO}/index.html with String.indexOf. Also count each literal's occurrences inside the STREET block (the text between "/* STREET */" and "/* /STREET */"; 0 when the block is absent). Return {literals: {"<literal>": "index.html:<line>" | null}, in_street: {"<literal>": <count>}}.`
const HOLD_TASK = `Hold read (write nothing): 1. fil3 = ${FIL}/gates/3-build.json: {exists (present and parses), pass: parsed.pass === true, mode: parsed.mode or "", forced: parsed.forced_by != null}. 2. fil4 = the ${FIL}/gates/4-review-c<k>.json with the highest integer k: {k, pass: parsed.pass === true}, or null when none exists. 3. In ${REPO}/POLISH.md: f3_checked = some line starts with "- [x] **Filigree 3 ·"; open = the text of every line matching ^- \\[ \\] \\*\\*(Filigree 3 stuck unit|Filigree 4 punch c|Filigree data —); street_data_open = the text of every line matching ^- \\[ \\] \\*\\*Street data \\(S3\\) — . Return {fil3, fil4, f3_checked, open, street_data_open}.`
const holdWhy = (h, str) => !h ? ['hold read died'] : [
  !(h.fil3 && h.fil3.exists && h.fil3.pass === true && h.fil3.mode === 'full' && h.fil3.forced !== true) ? 'docs/filigree/gates/3-build.json is not a full unforced pass' : '',
  h.f3_checked === true ? '' : 'Filigree 3 is not checked off',
  (h.open || []).length ? (h.open || []).length + ' open filigree fix item(s)' : '',
  strict(str) && !(h.fil4 && h.fil4.pass === true) ? 'ST15 strict: the latest Filigree 4 gate has not passed' : ''].filter(Boolean)
// record() copies verbatim through a cheap agent; recordD also checks a code-side digest (canonical JSON length + top-level array lengths), so a truncated or altered copy is caught
const RECD = {type: 'object', properties: {path: {type: 'string'}, sha256: {type: 'string'}, pass: {type: 'boolean'}, criteria: {type: 'integer'}, canon_len: {type: 'integer'}, lens: {type: 'object', additionalProperties: {type: 'integer'}}}, required: ['path', 'sha256', 'pass', 'criteria', 'canon_len', 'lens']}
const lensOf = o => Object.fromEntries(Object.entries(o).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.length]))
async function recordD(rel, obj, label) {
  const r = await crit(P(`Write the JSON below VERBATIM (2-space indent, trailing newline) to ${OUTABS}/${rel}, creating parent directories. Re-read the file, JSON.parse it, and return {path, sha256 (sha256sum of the file), pass: parsed.pass === true, criteria: (parsed.criteria || []).length, canon_len: JSON.stringify(parsed).length, lens: {<each top-level key whose value is an array>: that array's length}}.\n\n${JSON.stringify(obj, null, 2)}`),
    {label: label || ('record ' + rel), phase: 'Record', schema: RECD, ...M('mech')})
  const want = lensOf(obj), got = (r && r.lens) || {}
  if (!r || !FILE_OK({sha256: r.sha256, parsed: true}) || r.pass !== (obj.pass === true) || r.criteria !== (obj.criteria || []).length || r.canon_len !== JSON.stringify(obj).length
    || Object.keys(want).length !== Object.keys(got).length || Object.keys(want).some(k => want[k] !== got[k])) { log('record-mismatch: ' + rel); return null }
  return r
}
// ---- end street config ----
// ==== end street prelude ====
```

Notes on the config region (all enforced by the code above, recorded here for reviewers):
- `args.rulings` is refused: filigree R overrides come only from `docs/filigree/rulings.json` (read-only), so the two
  tracks cannot disagree on a cited ruling. ST overrides come from `args.streetRulings` and `docs/street/rulings.json`;
  `ST3`, `ST4`, `ST18` are fixed (args die; a file override is ignored and logged).
- `PORT` defaults to 0: the probe binds an OS-assigned free port, so parallel probe runs never collide and 8544
  (`server.js`, the filigree jobs) is never touched; 8544 itself is refused.
- `KEY_IDIOM` is the sim's own keyed-stream idiom (`function makeStream` = xmur3 → sfc32, index.html ~l.520). The sim
  has **no** mulberry32 (grep: 0 hits); a copied atlas function that needs one carries its own copy inside the
  STREET namespace (ST11).
- `VOCAB_ST` = the filigree `VOCAB` plus street words; `ST_CLOCK_GREP` adds `performance[.]now`; the STREET block also
  gets separate `W[.]rng` and `nowMs` greps.
- `PS(body, blind)` = `P` with the read-only rule prepended (non-blind). Every agent prompt in a street job body is
  `PS(...)`; the prelude's `record`/`recordD` keep `P` (they write one script-computed object).
- `HOLD_TASK` + `holdWhy()` live here so Street 3 (the only user) and any future reader share one definition.
- `recordD` (with `RECD`, `lensOf`) is filigree-1's verbatim (drift check D4).

## 1. meta (exact literal)

```js
export const meta = {
  name: 'street-1-research',
  description: 'Street 1: measure and read what the street view must stand on (probe tool, frozen views, baseline, sim facts, canon) into a street bible; gate = blank-street test',
  whenToUse: 'Run as the POLISH item "Street 1 · Research → street bible", in a fresh session: Workflow({name:"street-1-research", args:{date:"YYYY-MM-DD"}}). Docs + the read-only probe tool; never edits index.html, maps-site/ or docs/filigree/.',
  phases: [
    {title: 'Preflight', detail: 'drift check, re-anchor (street + filigree), filigree bible gate, rulings, ledger, probe check'},
    {title: 'Tool', detail: 'q01: tools/street-probe.js (virtual clock) -> recount -> fix <= 2'},
    {title: 'Fixtures', detail: 'freeze SV1-SV9 (views.json + stills) once; baseline.json measured twice'},
    {title: 'Research', detail: 'one targeted question per agent -> docs/street/research/<qid>.json'},
    {title: 'Verify', detail: 'per question: anchor + one kind lens (recount / refute / canon / second-look)'},
    {title: 'Synthesize', detail: 'opus/xhigh integrator -> street-bible.md/.json; validator + vocabulary grep'},
    {title: 'Blank-street gate', detail: 'paired blind appliers (sonnet/high + opus/high) per view, ref resolver, scoring in code'},
    {title: 'Follow-up', detail: 'critic -> fresh questions -> patcher -> re-gate (<= maxRounds)'},
    {title: 'Record', detail: 'gates/1-research.json, gates/1-view-answers.json, state/1-research.json'}
  ]
}
```

## 2. Args

Shared (prelude): `date` (required), `repo`, `outDir` (default `docs/street`; full mode must stay under it; smoke needs
an absolute dir outside the repo), `mode` (`full|smoke|plan`), `maxRounds` (0..2), `resume` (default true). `rulings`
is refused (config); `force` is refused (J1FORCE: no earlier street gate). Job keys: `streetRulings`, `port`.
First body line: `checkArgs(['streetRulings', 'port'])`.

## 3. Constants (job body)

```js
const VIEW_RULES = [   // resolved once by the probe's --freeze-views, then frozen in gates/views.json
  {id: 'SV1', seed: 'epeshu', day: 120, focus: "label:Epēshīn Forum", R: 30, tod: 0.50, tests: 'near facades, stalls, crowds (the market)'},
  {id: 'SV2', seed: 'epeshu', day: 120, focus: 'gate:Epēshu>Tamaron', R: 60, tod: 'dark', tests: 'gate leaves at the drawn dark hour, lamps'},
  {id: 'SV3', seed: 'epeshu', day: 'weather', focus: 'label:Whitestreet', R: 600, tod: 0.40, tests: 'mid tier (a ward), clouds'},
  {id: 'SV4', seed: 'epeshu', day: 'queue', focus: 'bridge:Epēshu', R: 120, tod: 0.45, tests: 'caravans taking turns at a one-lane bridge'},
  {id: 'SV5', seed: 'epeshu', day: 120, focus: 'settlement:Epēshu', R: 2300, tod: 0.50, tests: 'inside the 2200/2400 settlement hysteresis band: far quiet'},
  {id: 'SV6', seed: 'epeshu', day: 120, focus: 'building-near-label:the Marble Quarter', R: 9, tod: 0.50, tests: 'the door; the near plane (already clamp(R*0.02,0.5,50)); marble'},
  {id: 'SV7', seed: 'tamar1374', day: 120, focus: 'largest-settlement', R: 30, tod: 0.50, tests: 'procedural scope (ST2)'},
  {id: 'SV8', seed: 'epeshu', day: 'weather', focus: 'label:Wood Quay', R: 200, tod: 0.45, tests: 'the quay in weather, the cloud deck, the Blue Temple quarter'},
  {id: 'SV9', seed: 'epeshu', day: 120, focus: 'settlement:Epēshu', R: 11000, tod: 0.50, tests: 'far quiet (measure only)'}
]
const FOCUS_RULES = 'label:<name> = Epēshu centre (s.x, s.z) + the cityLabels entry {dx, dz} of that name; gate:Epēshu>Tamaron = the Epēshu s.gates entry whose bearing from the centre is nearest the bearing to Tamaron (ties: lower index); bridge:Epēshu = the W.bridges entry nearest Epēshu that lies within 30 m of a W.routes polyline (camera on its midpoint); settlement:<name> = s.x, s.z; building-near-label:<name> = the s.buildings entry (of the settlement) nearest that label point; largest-settlement = the settlement with the largest pop (ties: lower index)'
const DAY_RULES = 'weather = the first d in 120..240 whose W.weather.state after simDays(d) from a cold load is overcast, rain or storm (fallback 120, recorded as fallback); queue = the first d in 120..240 with >= 2 caravans within 300 m of the SV4 bridge after simDays(d) (fallback: the d with the most such caravans, ties lowest d, recorded)'
const TOD_RULES = 'dark = the midpoint of the longest run of tod in [0,1) (step 1/1000) where the dark-hour proxy (probe --dark-scan) is >= 0.5 (fallback 0.92, recorded)'
const CAMERA_RULE = 'cold load of /?v=<V_BUST>#s=<seed>, ANNALS.speed(0), ANNALS.simDays(day) (never ANNALS.day(): it skips the weather rolls), ANNALS.tod(tod), ANNALS.hold(1e12), ANNALS.goto(x, z, R, true), ANNALS.yaw(0); pump frames under the virtual clock until settled (street: stats().pending === 0) or 600 frames'
const GATE_VIEWS = ['SV1', 'SV2', 'SV3', 'SV4', 'SV5', 'SV6', 'SV7', 'SV8']   // SV9 is measure-only
const STATS_KEYS = ['fps', 'calls', 'tris', 'buildings', 'trees', 'seed', 'realm', 'treasury', 'pop', 'agents', 'chron']   // ANNALS.stats() today; must never change (filigree Job 4 F07 compares it across loads)
const PIECES = ['tiling', 'refine_rule', 'build_budget', 'eviction', 'culling', 'fade_in', 'facades', 'street_surface', 'instancing', 'traffic', 'sky_clouds', 'shadows', 'layer_ui', 'terrain_drape', 'vtt_scene', 'agent_lod', 'near_plane']   // todo-inputs.json pieces[0..16], in order
const ANALOGUES = ['gates_bridges_tolls', 'caravan_strings', 'crowds', 'cloud_deck', 'shadows_row', 'roads_and_folk', 'weather_density', 'tidings', 'facade_materials', 'vtt_out_of_scope']   // bronze_age[0..9], in order
const CHECKLIST = PIECES.concat(ANALOGUES)   // 27 keys
const STATES = ['seeded-gen', 'sim-read', 'keyed-render', 'notice']
const KEY_RE = '^st:[a-z_]+:[a-z_.]+:day$'   // the bible's canonical form of KEY_IDIOM: st:<class>:<id expr>:day
const HEX64 = /^[0-9a-f]{64}$/
const FU_MAX_Q = 4, FU_MAX_LENS = 1
const ROUND_TOKENS = 1200000
const BIBLE_MD = OUTABS + '/street-bible.md', BIBLE_JSON = OUTABS + '/street-bible.json'
const VIEWS_JSON = OUTABS + '/gates/views.json', BASELINE = OUTABS + '/gates/baseline.json'
const FIL_BIBLE = FIL + '/density-bible.json', FIL_GATE1 = FIL + '/gates/1-research.json'
const PROBE_T = MODE === 'smoke' ? OUTABS + '/tools/street-probe.js' : PROBE   // smoke never writes into the repo
const APPLIER_ALLOWED = [BIBLE_MD, BIBLE_JSON, VIEWS_JSON, OUTABS + '/gates/view/', BASELINE, REPO + '/index.html', REPO + '/maps-site/data/', FIL_BIBLE]
const ST_CITED_1 = ['ST2', 'ST3', 'ST4', 'ST5', 'ST6', 'ST7', 'ST10', 'ST11', 'ST12', 'ST13', 'ST16', 'ST18', 'ST19']
```

### 3.1 Questions (one targeted task each)

`{qid, short, question, reads, role, lens, tool?}`; lens roles are filigree Job 1's `LENS_ROLE`
(`anchor` mech, `second-look` deep, `refute` judge, `recount` mech, `canon` audit); every question whose claims cite an
anchor also gets the `anchor` lens (Job 1's `lensesFor`).

| qid | short | question (essentials) | reads | role | lens |
|---|---|---|---|---|---|
| q01 | probe tool | Write `tools/street-probe.js` to the PROBE_SPEC below; claims = each flag and output field with a computed evidence ref | PROBE_SPEC, README §8 (f) recipe via SANDBOX_ST, index.html ANNALS API | deep | recount (tool literals) |
| q02 | clocks and the dark hour | `tick(dt, nowMs)` → `simAdvance`; `simDays` partition-independence at speed 0; `renderTod` advance (`dt/300`) vs `W.clock.day`; the darkHour formula (`_sunDir`, `_tamarDir`, local `sunElev`) checked against the probe's `--dark-scan` proxy; `ANNALS.step` feeding `performance.now()` as `nowMs`; what a gate-leaf rule may read (render only) | index.html | audit | refute |
| q03 | caravans and the stateless queue | `routePos`, `updateAgents`, `processArrivals(day)`: the fields a render-only queue may touch (mesh transforms only); the neighbour set per (route, day) computable statelessly; IDM `calcAccDet` terms at donkey pace (s0, T, v0); run a node property test on synthetic agents: monotone order, gap ≥ s0, d_vis ≤ d_true, f(day) path-independence | index.html, the dossier §2 M1–M3 | deep | refute |
| q04 | determinism debts | every `Math.random`, `Date.now`, `performance.now`, `W.rng.amb` and `nowMs` in index.html, each with its enclosing function and class gen / sim / render | index.html | mech | recount |
| q05 | settlement street data | `s.streets` (widths), `s.buildings` `{t,x,z,ry,tier,sc}`, `s.gates`, the market reserve (dd<0.30), `W.bridges`, `W.routes`, quays; sub-cell ground vs the 11.72 m grid (R22) | index.html | audit | recount |
| q06 | facades and instancing | the 12 `ARCH`, tier materials, 4 cached variants, windows and night glow; every InstancedMesh site and the instanceColor rule; the culling gaps (rocks, sheep, birds); where a near-only mesh must sit (never `meshHi`) | index.html | audit | recount |
| q07 | LOD, camera, near plane | `updateLOD` 2400/2200 by camera-to-centre distance; label tiers by R; water fades; `CAM.radius` 9…11000; `camera.near = clamp(R*0.02, 0.5, 50)` (already dynamic); the inputs for a screen-space-error rule | index.html | audit | recount |
| q08 | keys, hash, parser, writers | the keydown keys; the overlay menu rows (`#ovMenu`); the unanchored seed regex at both parse sites (`notices=` collides); every `'#s='` writer (each drops other params); `applyGotoFromHash`; free param names (end not in `s`) | index.html | audit | recount |
| q09 | weather and the R13 fog source | `W.weather` states and roll cadence; the precipitation `Points` (count 1500, `Math.random`, render-only); fog far-plane modulation; the R13 fog function in the `/* FILIGREE */` block of maps-site/index.html: exists? name, signature, the helpers it calls (incl. mulberry32), purity — or "not yet built" | index.html, maps-site/index.html (read-only) | audit | refute |
| q10 | notices (R12) | the committed notices sample in `maps-site/data/` or `docs/filigree/sheet-spec.json` `/contracts` (read-only): the schema of shut ways and muster days; what the sim can read without a fetch at boot; the classes a street view would draw | maps-site/data/, docs/filigree/ | audit | canon |
| q11 | Epēshu canon | `wiki-places.json` (the Blue Temple of Thobrauk on Wood Quay's northern edge), `chart-pois.json` districts, `detail-charts.json`, the capital marble walls, the Epēshu `cityLabels`; one chart crop of the Marble Quarter | maps-site/data/, maps-site/charts/epeshu/ | deep | second-look, canon |
| q12 | Patrinaic words | words for gate, toll, market, bridge, ford, crowd, cloud, caravan halt, herald (reserved canon words excluded) | lexicon/patrinaic.json | audit | canon |
| q13 | shadows and the degrade ladder | `shadowsOn` (never set), `wantShadow`, the one-way ladder (smoothed fps < 42, every 5 s after frame 300), shadow extent and map size; what headless can and cannot measure; the global binding the `pinDegrade` hook must hold | index.html | audit | recount |
| q14 | r128 API facts | from `npm pack three@0.128.0` source: `InstancedMesh.setColorAt`/`instanceColor`, `Frustum.intersectsSphere`, `onBeforeCompile` dither on the patched Lambert, no BatchedMesh, `LOD.addLevel` without hysteresis | npm three@0.128.0 | audit | recount |
| q15 | class map | map each of the 27 CHECKLIST keys (17 Tokyo pieces + 10 bronze-age analogues of `todo-inputs.json`) to street classes `{id, from, state ∈ STATES, fil_class?, tier_min, tier_max}`, reusing a filigree density-bible class id wherever one exists (read-only) | docs/street/todo-inputs.json, docs/filigree/density-bible.json | judge | refute, canon |

`q01` carries `tool: true` and runs alone in the Tool phase. q02–q15 run in parallel in the Research phase.

### 3.2 PROBE_SPEC (the q01 tool contract, embedded in its prompt and in the probe fixer's)

`tools/street-probe.js` — plain Node + Playwright from `NODE_PATH`, read-only on the repo (writes only `--out`,
`--shots`), no npm installs, no clock or random call syntax outside the fenced installer `/* VCLOCK */ … /* /VCLOCK */`
(`grep -cE ST_CLOCK_GREP` outside the fence = 0). Sorted keys, stable arrays, so every exact field is byte-stable.

- Server and CDN: its own read-only static server over `<repo>` on `--port` (default 0 = OS-assigned); `--cdn-dir
  <dir>` routes the two CDN globs to disk (SANDBOX_ST); never touches `server.js`/8544.
- **Virtual clock** (`addInitScript`, before page scripts): `requestAnimationFrame`, `performance.now` and `Date.now` on a
  fixed timeline, dt = 1/`--vfps` (default 60); `Math.random` seeded (an xmur3→sfc32 copy keyed `'probe'`); director held
  (`ANNALS.hold(1e12)`), speed 0, tod pinned. The probe pumps frames itself; fps therefore reads 60 and the degrade
  ladder never trips in measurement.
- View spec: `--view <seed>:<day>:<focus>:<R>:<tod>` (focus = `x,z` or a FOCUS_RULES token) or `--views <views.json>`;
  camera per CAMERA_RULE.
- `--freeze-views <rules.json> --out <views.json> --shots <dir>`: resolve VIEW_RULES with FOCUS/DAY/TOD rules → `{date,
  frozen: true, rules (verbatim), views: [{id, seed, day, x, z, R, tod, yaw: 0, focus, fallback?}]}` + one JPEG still
  per view (`<dir>/<id>.jpg`, UI chrome hidden, ≤300 KB).
- `--dark-scan --seed <s>`: the dark-hour midpoint tod (TOD_RULES). For each f = k/1000: `ANNALS.tod(f)`, `ANNALS.step(1)`,
  then in the page (global script bindings are readable from `page.evaluate`) the proxy
  `smooth((_sunDir.dot(_tamarDir) - 0.955) / (0.985 - 0.955)) * clamp01(Math.asin(_sunDir.y) * 6)` — the code's own
  `const darkHour =` with `sunElev` (a local) recovered as `asin(_sunDir.y)`. q02 re-derives this from the code and
  its refute lens strikes the probe claim if the formula drifted.
- `--metrics <csv>` over `calls, tris, geoms, textures, objects, stats_keys` (Street 3 S0.U01 adds `classes, appear,
  swaps, jobs, resident`): `calls`/`tris` from `renderer.info.render` after one settled render, `geoms`/`textures` from
  `renderer.info.memory`, `objects` = scene objects by type, `stats_keys` = `Object.keys(ANNALS.stats())`.
- `--layers street=0` (Street 1 asserts `ANNALS.street` is absent; S0.U01 adds `street=1`).
- `--fingerprint --seed <s> --days <n> [--walk <views.json>] [--perturb departDay]`: speed 0, `simDays(n)` (with
  `--walk`: 8 chunks of n/8 days, the camera parked at SV1…SV8 and 120 pumped frames between chunks), then sha256 of a
  canonical JSON of `{clock: W.clock, dayTicked, settlements: [{id|name, pop, kind, prosperity}], agents: [{kind,
  departDay, route key, speed}], chron: W.chron texts, treasury, routeVolume}`. `--perturb departDay` adds 1 to the first
  caravan's `departDay` in page memory before `simDays` (the sensitivity test: the sha must change).
- `--paths <list>` where list is one or more of `descent`, `oscillate`, `flyaway`, comma-separated (`--paths descent,oscillate,flyaway`; repeated flags are not used); `--vfps <list>` takes `30`, `60` or `30,60` (per-frame records `{f, R, calls, tris, geoms}`; S0.U01 adds builds/jobs/
  resident): descent 11000→9 log-linear over 900 frames at SV1's focus; oscillate R 170↔230 and 2150↔2450, 600 frames;
  flyaway SV1 → R 11000 → SV1 twice, then `ANNALS.seed('tamar1374')` and back to `epeshu` and SV1.
- `--device`: real clock, headed when a display exists, the SV1 descent for 60 s: per-second `ANNALS.stats().fps`
  (and, after S0, `ANNALS.street.stats().degrade_step`) → `docs/street/device/<date>.json` only when the owner runs it.
- `--stats-keys`, `--help` (lists every flag above literally), `--out <path>`.
- Output: one JSON `{tool_sha (sha256 of this file), index_sha (sha256 of index.html), views: {SVn: {...}},
  fingerprint: {...}, paths: {...}, console_errors: [...], infra_error: ''}`.

PROBE_LIT (the recount literals, scored in code by `probePass`):
1. `--fingerprint --seed epeshu --days 30` twice → equal 64-hex shas;
2. `--fingerprint --seed epeshu --days 30 --perturb departDay` → a different sha;
3. `--view epeshu:120:settlement=Epēshu:600:0.5 --metrics calls,tris` → integers > 0;
4. `--stats-keys` → deep-equals STATS_KEYS;
5. `grep -vn` outside the VCLOCK fence for `ST_CLOCK_GREP` → 0 hits;
6. `--views` over a one-view temp file twice → byte-equal output files;
7. `--help` lists every PROBE_SPEC flag, the list-valued ones in list form (`--paths <a,b,..>`, `--vfps <30,60>`) (`flags_missing` = []).

### 3.3 Schemas

```js
const S = {type: 'string'}, SA = {type: 'array', items: S}, B = {type: 'boolean'}, I = {type: 'integer'}, N = {type: 'number'}
const NN = {type: ['number', 'null']}
const OBJ = (props, req) => ({type: 'object', properties: props, required: req || Object.keys(props)})
const ANCH = {type: 'object', additionalProperties: {type: ['string', 'null']}}
const DRIFT = OBJ({ok: B, checks: {type: 'array', items: OBJ({id: S, ok: B, detail: S})}})
const FILANCH = OBJ({literals: ANCH, in_street: {type: 'object', additionalProperties: I}})
// ---- job helpers (NOT in the prelude, so drift check D2 does not cover them): this block is pasted verbatim into W1-W4 after the schema atoms above ----
const driftIds = d => ((d && d.checks) || []).filter(c => !c.ok).map(c => c.id).join(', ') || 'no drift report'
const citedChanged = (cited, now) => Object.keys(cited || {}).filter(k => (now || {})[k] !== cited[k])   // ids whose ruling text differs from the text Street 1 stamped
const lowBudget = () => !!(budget && budget.total && budget.remaining() < ROUND_TOKENS)   // the filigree-1 idiom; every round gate is `if (lowBudget()) { log('budget: round skipped'); break }`
// W1-local functions probePass, researchRound, checkBible, runGate, evaluate and ambiguity are defined in the script body at §5; they are not shared with W2-W4
const PROBEP = OBJ({exists: B, sha_run1: S, sha_run2: S, perturbed_differs: B, view_calls: NN, view_tris: NN, stats_keys: SA, clock_hits: I, views_equal: B, flags_missing: SA, tool_sha: S, infra_error: S})
const PRE1 = OBJ({
  missing: SA, anchors: ANCH, fil_anchors: FILANCH, drift: DRIFT,
  fil_gate1: OBJ({exists: B, pass: B, mode: S, forced: B, bible_ok: B, bible_sha256: S, class_ids: SA}),
  fil_overrides: {type: 'object', additionalProperties: S}, st_overrides: {type: 'object', additionalProperties: S},
  ledger: OBJ({questions: {type: 'array', items: OBJ({qid: S, path: S, sha256: S, sha_ok: B, claim_ids: SA, struck: SA})}, seen_questions: SA}),
  probe: PROBEP,
  gate_prev: OBJ({exists: B, pass: B, mode: S, forced: B, md_ok: B, json_ok: B, answers_exists: B, fil_bible_sha256: S, fil_rulings_cited: {type: 'object', additionalProperties: S}}),
  fixtures: OBJ({views_exists: B, views_rules: S, stills: SA, baseline_exists: B, baseline_index_sha: S, baseline_tool_sha: S, index_sha: S})})
const QSCHEMA = OBJ({qid: S, path: S, sha256: S,
  claims: {type: 'array', items: OBJ({id: S, text: S,
    evidence: OBJ({kind: {type: 'string', enum: ['anchor', 'computed', 'probe', 'data', 'crop', 'lexicon', 'web']}, ref: S}),
    confidence: {type: 'string', enum: ['high', 'medium', 'low']}})},
  gaps: SA, summary: S})
const LENS = {type: 'object', properties: {lens: S, checked: I, own_reading: {type: 'array', items: OBJ({claim: S, reading: S})},
  struck: {type: 'array', items: OBJ({claim: S, why: S, evidence: S})}}, required: ['lens', 'checked', 'struck']}
const VIEWFRZ = OBJ({fixtures_changed: B, path: S, sha256: S, parsed: B, views: {type: 'array', items: OBJ({id: S, seed: S, day: I, x: N, z: N, R: N, tod: N, fallback: S})}, stills: {type: 'array', items: OBJ({id: S, path: S, bytes: I})}, infra_error: S})
const BASE = OBJ({path: S, sha256: S, parsed: B, runs_equal: B, view_dependent: B, index_sha: S, tool_sha: S, views_n: I, stats_keys: SA, keydown_sha: S, perturbed_differs: B, infra_error: S})
const INTEG1 = OBJ({md: S, json: S, sha_md: S, sha_json: S, class_ids: SA, rule_ids: SA,
  tier_bands: {type: 'array', items: OBJ({tier: S, R_min: N, R_max: N})}, states: {type: 'object', additionalProperties: S},
  checklist_keys: SA, cited_claims: SA})
const VALID1 = OBJ({ok: B, failures: SA, sha_md: S, sha_json: S, class_ids: SA, checklist_keys: SA, cited_claims: SA,
  tier_bands: {type: 'array', items: OBJ({tier: S, R_min: N, R_max: N})}, states: {type: 'object', additionalProperties: S},
  new_sim_state: SA, debts_missing: SA, fil_class_unknown: SA, ceiling_below_baseline: SA, ceiling_missing: SA, bad_keys: SA})
const VHITS = OBJ({hits: SA})
const APPLY1 = OBJ({view: S, tier: S,
  items: {type: 'array', items: OBJ({class: S, state: {type: 'string', enum: STATES},
    instance: OBJ({what: S, near: S}),
    source: OBJ({kind: {type: 'string', enum: ['sim', 'key', 'notice', 'probe', 'fil']}, ref: S})})},
  bible_silent: B, missing: SA, files_read: SA})
const RESOLVE1 = OBJ({view: S, results: {type: 'array', items: OBJ({actor: {type: 'string', enum: ['A', 'B']}, idx: I, ok: B, why: S})}})
const AMBIG = OBJ({gaps: {type: 'array', items: OBJ({view: S, section: S, what: S})}})
const CRITIC = OBJ({questions: {type: 'array', items: OBJ({qid: S, question: S, reads: SA,
  role: {type: 'string', enum: ['mech', 'triage', 'audit', 'deep', 'judge']},
  lens: {type: 'array', items: {type: 'string', enum: ['anchor', 'second-look', 'refute', 'recount', 'canon']}}})}})
```

## 4. Agents (label · phase · role → model/effort · prompt essentials · schema)

| label | phase | role → pair | prompt essentials (all `PS(...)`; blind ones `PS(…, true)`) | schema |
|---|---|---|---|---|
| `preflight` (crit) | Preflight | mech → haiku/low | `ANCHOR_TASK`; then `FIL_ANCHOR_TASK`; then `DRIFT_TASK`; inputs exist: `${DOCS}/research-dossier.md`, `${DOCS}/todo-inputs.json`, `${REPO}/docs/research/streamed-streets.md`, `${REPO}/lexicon/patrinaic.json`, `${REPO}/maps-site/data/{wiki-places,chart-pois,detail-charts}.json`, `${REPO}/index.html`, `${REPO}/maps-site/index.html`, `${REPO}/tools/street-drift.js` (the filigree bible and gate are reported in `fil_gate1`, never in `missing`); `fil_gate1` from `${FIL_GATE1}` (`bible_ok` = its artifacts sha for density-bible.json equals `sha256sum ${FIL_BIBLE}`; `class_ids` = the bible's `classes[].id`); both rulings files' `overrides` (absent = {}); the ledger `state/1-research.json` (re-hash each entry); the probe check (PROBE_LIT 1, 3, 4, 5 when `${PROBE_T}` exists, else `exists:false`); `gate_prev` from `gates/1-research.json`; `fixtures` (views.json exists/its `rules` text, stills present, baseline exists with its `index_sha`/`tool_sha`; `index_sha` = sha256sum index.html). Writes nothing | PRE1 |
| `q01 · probe tool` | Tool | deep → sonnet/high | the research prompt for q01 + PROBE_SPEC + SANDBOX_ST + anchors map; writes `${PROBE_T}` and `research/q01.json` | QSCHEMA |
| `q01 · recount` | Tool | mech → haiku/low | run PROBE_LIT 1–7 via SANDBOX_ST; write nothing outside a mktemp dir | PROBEP |
| `q01 · probe fix <k>` (k ≤ 2) | Tool | deep → sonnet/high | the failing PROBE_LIT items with outputs; rewrite `${PROBE_T}` only; update `research/q01.json` | QSCHEMA |
| `view freezer` (crit) | Fixtures | mech → haiku/low | if `${VIEWS_JSON}` exists: compare its `rules` string with `JSON.stringify(VIEW_RULES)` + FOCUS/DAY/TOD/CAMERA rule texts (exact); different → `fixtures_changed:true`, write nothing; same and all stills present → skip (READBACK); else write the rules to a temp file and run `node ${PROBE_T} --freeze-views <tmp> --out ${VIEWS_JSON} --shots ${OUTABS}/gates/view/ --cdn-dir <tmp>`; READBACK + views + stills | VIEWFRZ |
| `baseline` (crit) | Fixtures | mech → haiku/low | skip (READBACK) when `${BASELINE}` exists, `frozen`, its `index_sha` = sha256sum index.html and `tool_sha` = the probe's; else run twice `--views ${VIEWS_JSON} --layers street=0 --metrics calls,tris,geoms,textures,objects,stats_keys`, and per seed twice `--fingerprint --days 400` and `--fingerprint --days 400 --walk ${VIEWS_JSON}`, plus `--perturb departDay` once on epeshu; keydown sha = sha256 of the text from `window.addEventListener('keydown'` to its matching `});` (node brace match); write `${BASELINE}` = `{date, frozen: true, tool_sha, index_sha, views: {SVn: {calls, tris, geoms, textures, objects}}, fingerprint: {epeshu: {plain, walk}, tamar1374: {plain, walk}}, view_dependent, stats_keys, keydown_sha, near_line: 'camera.near = clamp(R*0.02, 0.5, 50);', runs_equal}` | BASE |
| `<qid> · <short>` (q02–q15) | Research | per table | Job 1's `researchPrompt` shape: ONE question; reads; anchors map; `rulingText(RUL, ['R6','R10','R12','R13','R22'])` + `rulingText(STR.r, ST_CITED_1)`; `VOCAB_ST_RULE`; write `research/<qid>.json` `{qid, claims, gaps, summary, date}`, claim ids `<qid>-cNN`, evidence on every claim | QSCHEMA |
| `<qid> · <lens>` | Verify | `LENS_ROLE[lens]` | Job 1's `lensPrompt` + `LENS_TEXT` (second-look withholds refs and asks own reading first; recount re-runs commands; canon adds `VOCAB_ST_RULE`; anchor greps `path :: literal`) | LENS |
| `bible integrator` (crit) | Synthesize | integ → opus/xhigh | read only the trusted research files (EVIDENCE_NOTE), struck claim ids, the dossier, todo-inputs, `${VIEWS_JSON}`, `${BASELINE}`, the filigree bible's class ids; rulings (R6, R9, R10, R12, R13, R18, R22 + ST1–ST19); CHECKLIST; STRUCTURE (below); `VOCAB_ST_RULE`; write `${BIBLE_MD}` + `${BIBLE_JSON}` | INTEG1 |
| `bible validator` | Synthesize | mech → haiku/low | VALIDATOR (below), a fixed node script described in prose; write nothing | VALID1 |
| `vocabulary grep` | Synthesize | mech → haiku/low | node over `${BIBLE_MD}` line by line skipping `## Provenance`/`## Renames` sections, and over every `label`/`row` string of `${BIBLE_JSON}`, regex `VOCAB_ST.source` flags `gi` | VHITS |
| `<SVn> · applier A` / `B` | Blank-street gate | A deep → sonnet/high, B judge → opus/high (identical prompts) | blind (`PS(…, true)`): read ONLY `APPLIER_ALLOWED` (index.html by `grep -nF` only); find SVn in views.json (seed, day, x, z, R, tod) and its still; name the tier the bible's tier rule gives for R; name exactly SIX distinct bible classes that must be present at this view, each with its state (from the bible), an instance `{what, near:'x,z'}` within the view's footprint and a source ref `sim:<index.html literal>` \| `key:st:<class>:<id expr>:day` \| `notice:<class>` \| `probe:<SVn>.<metric>` \| `fil:<filigree class id>`; `bible_silent` + `missing` when the bible does not answer; `files_read` (absolute) | APPLY1 |
| `<SVn> · resolver` | Blank-street gate | mech → haiku/low | per item of A and B: `sim` → `grep -cF` of the literal in index.html ≥ 1 AND the literal is in that class's `sim_source`; `key` → matches `KEY_RE` AND the class is `keyed-render` with that `key`; `notice` → a class with state `notice`; `probe` → `views.SVn.<metric>` exists in `${BASELINE}`; `fil` → an id in `${FIL_BIBLE}` classes; plus `near` within `1.5·R + 30` m of the view's x,z; ok + why; write nothing | RESOLVE1 |
| `ambiguity judge` (crit; only when a view fails or is silent) | Blank-street gate | judge → opus/high | the failing rows (classes, states, refs, invalid reasons) + the bible: name the bible section that left the appliers disagreeing, silent or invalid, and what it lacks | AMBIG |
| `completeness critic` | Follow-up | judge → opus/high | failing criteria, gaps, seen questions; ≤ `FU_MAX_Q` fresh questions (one task each, role, ≤1 lens); a probe failure (SG1.11) is re-asked as `f<r>1 · probe rewrite` with the tool task | CRITIC |
| `f<r><n> · …` + lens + anchor | Follow-up | as Research/Verify | as above | QSCHEMA / LENS |
| `bible patcher` (crit) | Follow-up | judge → opus/high | patch only the named sections; never renumber ids; same STRUCTURE/RETURN | INTEG1 |
| `record gate` / `record view answers` / `record ledger` (crit each) | Record | mech → haiku/low | `recordD` (prelude) | RECD |

**STRUCTURE** (integrator and patcher):

```
street-bible.md sections: tiers; classes by tier (what must be there at each nearness); determinism (states, keys,
debts); clocks; caravans and queues; sky and weather; layers and hash; notices; Epēshu; caps; prerequisites;
"## Renames"; "## Provenance" (the only place the post's sources may be named).
street-bible.json:
{date, fil_bible_sha256,
 tiers: {kind: "radius", bands: [{tier: "T0".."T4", R_min, R_max}]},          // contiguous, covering [9, 11000]
 classes: [{id, label, from: [checklist keys], state: "seeded-gen"|"sim-read"|"keyed-render"|"notice",
            sim_source: [index.html literal], key: "st:<class>:<id expr>:day" | "", fil_class: "" | <filigree class id>,
            tier_min, tier_max, row: "roads and folk"|"clouds"|"weather"|"shadows"|"street"|"", new: bool}],
 rules: [{id: "SB-01", text, kind: "must"|"forbidden"|"threshold"|"determinism"|"source", cites: [claimId]}],
 caps_ceiling: {SV1..SV9: {calls, tris, objects}},
 determinism: {allowed_sources: ["keyed-hash", "sim-read-only"], new_sim_state: [], key_idiom: KEY_IDIOM,
               debts: [{fn, token, kind: "gen"|"sim"|"render"}]},
 clocks: {dark_hour: "render", sim_day: "W.clock.day", presentation: "ST.t"},
 hash: {param: "street", parser_fix: "S0 (ST18)", writers: [literal lines]},
 checklist: {<each of the 27 keys>: rule id or class id},
 prerequisites: [{item, blocks: "S0".."S4", status: "checked"|"open"|"missing"}]}
Rules are general (by tier, class and view kind), never the fixture answers. A keyed-render class names its key in the
canonical form; a sim-read or seeded-gen class names ≥1 sim_source literal; a notice class names its R12 notice class.
vtt_scene and vtt_out_of_scope map to the rule that states ST10.
```

**VALIDATOR** (the `bible validator` prompt's fixed script, in prose): JSON.parse `${BIBLE_JSON}`, check `${BIBLE_MD}`
exists; required keys; unique class and rule ids; every class state ∈ STATES; `sim-read`/`seeded-gen` classes have ≥1
`sim_source`, each found in index.html by `indexOf`; `keyed-render` classes have `key` matching `KEY_RE` (else
`bad_keys`); `determinism.new_sim_state` = [] (else listed); `debts` ⊇ the debt grep (run: a node script listing every
`Math.random`, `Date.now`, `performance.now`, `W.rng.amb` and `nowMs` occurrence in index.html with its enclosing
`function` name; each `(fn, token)` must appear in `debts`, else `debts_missing`); every non-empty `fil_class` is a
`classes[].id` of `${FIL_BIBLE}` (else `fil_class_unknown`); tier bands contiguous over [9, 11000]; `caps_ceiling` has
numeric calls/tris/objects for SV1–SV9 (else `ceiling_missing`) and each ≥ `${BASELINE}` `views.SVn` (else
`ceiling_below_baseline`); `checklist_keys` = keys of `checklist` whose value is an existing rule or class id;
`cited_claims` = all `rules[].cites`; `sha_md`/`sha_json` = sha256sum of each file; `ok` = no failure.

## 5. Control flow

```js
checkArgs(['streetRulings', 'port'])
// constants, schemas (§3)
phase('Preflight')
const pre = await crit(PS(PREFLIGHT_TASK), {label: 'preflight', phase: 'Preflight', schema: PRE1, ...M('mech')})
if (!pre) return done({reason: 'agent died: preflight'})
const fg = pre.fil_gate1 || {}
if (!(fg.exists && fg.pass && fg.mode === 'full' && !fg.forced && fg.bible_ok)) die('street research waits for the density bible (docs/filigree/gates/1-research.json pass, full, unforced, bible unchanged)')
if (!pre.drift || pre.drift.ok !== true) die('prelude drift: ' + driftIds(pre.drift))   // run fault; remedy README §12
if ((pre.missing || []).length) die('missing inputs: ' + pre.missing.join(', '))
const lost = anchorsLost(pre.anchors); if (lost.length) die('anchor lost: ' + lost.join('; '))
const filLost = Object.entries((pre.fil_anchors || {}).literals || {}).filter(([, v]) => !v).map(([k]) => k)
if (filLost.length) log('filigree anchors already lost in index.html (not this track): ' + filLost.join('; '))   // recorded in gaps
const {r: RUL, used: RUSED} = rulingsMerge(pre.fil_overrides)
const STR = stRulingsMerge(pre.st_overrides), SUSED = STR.used
const FIL_CITED_TEXT = Object.fromEntries(FIL_CITED.map(k => [k, RUL[k]]))
// ledger + resume (Job 1 rules): a question resumes while its evidence re-hashes; q01 also needs probePass(pre.probe)
// plan mode -> schedule (§6) and return done({reason: 'plan', schedule, agents_bound, ...})
// already passed: gate_prev pass/full/unforced, md_ok, json_ok, fil_bible_sha256 === fg.bible_sha256,
//   and every FIL_CITED text equal -> done({pass: true, reason: 'already passed: …'}); a missing answers file or
//   ledger -> done({reason: 'record-incomplete: …'})
phase('Tool')
// q01 unless resumed: research(q01) -> recount -> while (!probePass(p) && k < 2) fix(k) -> recount
// p.infra_error -> return done({reason: 'infra', ...}); !probePass after fixes -> skip Fixtures/Research gate
//   and go to Record with SG1.11 failed (the other criteria recorded as not evaluated)
phase('Fixtures')
// view freezer (crit): fixtures_changed -> die('fixtures changed; delete docs/street/gates/views.json and
//   docs/street/gates/view/ to re-freeze'); !FILE_OK -> done('agent died: view freezer'); infra -> done('infra')
// baseline (crit): !FILE_OK -> done('agent died: baseline'); infra -> done('infra')
phase('Research')
await researchRound(todo, '')   // Job 1's pipeline: research -> parallel lenses (phase 'Verify')
phase('Synthesize')
let bible = await crit(integratorPrompt, {label: 'bible integrator', phase: 'Synthesize', schema: INTEG1, ...M('integ')})
if (!bible) return done({reason: 'agent died: bible integrator', ...})
let chk = await checkBible('')   // validator + vocabulary grep in parallel
phase('Blank-street gate')
let gate = await runGate('')     // pipeline over GATE_VIEWS: parallel(A, B) -> resolver
let ev = evaluate(bible, chk, gate)
let amb = await ambiguity(ev, gate, '')
// Follow-up loop: while (failing(ev).length && rounds < ROUNDS): `if (lowBudget()) { log('budget: follow-up round skipped'); break }` (the guarded idiom, ROUND_TOKENS);
//   critic -> fresh (dedup by norm, qids f<RBASE+r><n>) -> researchRound -> patcher (crit) -> checkBible ->
//   runGate -> evaluate -> ambiguity; a round with zero fresh questions still patches and re-gates
phase('Record')
// recordD x3; reason = record-mismatch | '' | failing ids joined ',' | MODE
return done({...})
```

## 6. Gate: blank-street test (scored in code by `evaluate`)

`tierOf(R)` = the band of `chk.val.tier_bands` (the validator's reading) with `R_min ≤ R < R_max`. Per gate view and
applier: valid = blind ok, exactly 6 items with 6 distinct classes all in `val.class_ids`, every item's state equals
`val.states[class]`, `tier === tierOf(view.R)`. Agreement = |classes(A) ∩ classes(B)|.

| id | criterion | threshold |
|---|---|---|
| SG1.1 | bible valid: validator `ok`, its shas equal the integrator's/patcher's | ok |
| SG1.2 | checklist coverage (validator read) | 27/27 |
| SG1.3 | both appliers valid on every gate view, tier exact | 8/8 |
| SG1.4 | class agreement | ≥5/6 on ≥7 of 8 AND ≥4/6 on all 8 |
| SG1.5 | ref resolution per applier per view | ≥5/6 each; ≥90% overall (nothing scored = fail) |
| SG1.6 | `bible_silent` | 0 |
| SG1.7 | `VOCAB_ST` hits | 0 |
| SG1.8 | struck claims cited (validator `cited_claims` ∩ STRUCK) | none |
| SG1.9 | blind compliance (`blindBad` over `files_read`) | 0 reads outside APPLIER_ALLOWED |
| SG1.10 | coverage: research, lenses, rows, appliers, resolvers | every fan-out ≥75% kept |
| SG1.11 | probe: `probePass(p)` (PROBE_LIT 1–7) AND baseline `runs_equal` AND `perturbed_differs` | all true |
| SG1.12 | determinism contract: `new_sim_state` = [], `debts_missing` = [], `bad_keys` = [] | all empty |
| SG1.13 | caps ceiling: `ceiling_missing` = [] and `ceiling_below_baseline` = [] | both empty |
| SG1.14 | filigree imports: `fil_class_unknown` = [] and the filigree bible sha unchanged during the run | both |

`view_dependent: true` in the baseline (the sim's own fingerprint differs between plain and walked runs) is **not** a
failure: it is a recorded debt (gaps + a `Street gap` insert) and Street 3 then compares walked-on with walked-off
only (README §5.3).

## 7. Loop bounds and agent bound (plan-mode schedule)

| phase | min | max |
|---|---|---|
| Preflight | 1 | 2 |
| Tool | 0 (resumed) | 6 (writer 1 + recount 1 + 2 × (fix 1 + recount 1)) |
| Fixtures | 2 | 4 |
| Research | unresumed q02–q15 | 14 |
| Verify | Σ lenses | 28 (≤2 per question incl. anchor) |
| Synthesize | 3 | 4 |
| Blank-street gate | 24 | 26 (8 × (2 appliers + resolver) + ambiguity judge with retry) |
| Follow-up | 0 | 2 × (critic 1 + 4 × 3 + patcher 2 + validator 1 + grep 1 + gate 26) = 86 |
| Record | 3 | 6 |
| **total** | | **176 (bound 180; typical ≈80)** |

`agents_bound` > 180 in a plan result means an arg was raised or the script grew: stop and note it.

## 8. Outputs

`docs/street/street-bible.{md,json}`, `research/q01..q15.json` (+ `f<r><n>.json`), `tools/street-probe.js`,
`gates/views.json` + `gates/view/SV1..SV9.jpg` (frozen), `gates/baseline.json` (frozen per index sha),
`gates/1-research.json`, `gates/1-view-answers.json`, `state/1-research.json`.

Gate record (`gateObj`): `criteria`, `rounds`, `rulings_used: RUSED`, `street_rulings_used: SUSED`,
`fil_bible_sha256`, `fil_rulings_cited: FIL_CITED_TEXT` (the exact texts; Streets 2–4 compare strings), `artifacts`
(bible md/json via the validator's shas, views.json, baseline.json, probe), `gaps`.

## 9. Return value (`done(...)`; the README §1.4 table says what the polish run does with each field)

| field | value |
|---|---|
| `pass` | gate pass and every record read back |
| `reason` | `''` · `already passed: …` (pass:true) · `record-incomplete: …` · `record-mismatch` · `infra` · `agent died: <label>` · failing ids joined `,` (`SG1.4,SG1.5`) · `plan` · `smoke` |
| `polish_note` | `street bible: <n> classes, <k>/8 views agree ≥5/6, <p>% refs resolve, checklist <c>/27, probe <ok|fail>` (+ "skip inserts already queued" on a fail) |
| `polish_inserts` | on fail: one `- [ ] **Street gap — close <id> (<desc>); measured values are in docs/street/gates/1-research.json** (blocks Street 2; place directly above it; skip if already queued)` per failing criterion, plus one for the gaps list; on `view_dependent`: `- [ ] **Street gap — the sim fingerprint is view-dependent (baseline.json); Street 3 compares walked-on vs walked-off only**` |
| `polish_inserts_above` | `'Street 2'` |
| `changelog_line` | `- docs: Street 1 — street bible (blank-street gate pass|fail)` (R15 cited) |
| `gate_path`, `outputs`, `owner_rulings_used: RUSED`, `street_rulings_used: SUSED`, `gate` | as filigree Job 1 |

## 10. Stub runs (impl-units acceptance; scratchpad-only, not reproducible from the repo)

The delivery session's harness `street-plan/stubrun-street.js` and canned files `street-plan/stub/*.json` live in its scratchpad and are not committed; later sessions verify with README §8 (a)–(e) instead. The harness runs the script with no real agent: each `agent()` returns the canned
object for its label deep-merged over a schema-minimal object (booleans false, arrays empty), and every call is
checked (phase in meta, model/effort valid, schema `required` ⊆ `properties`). Canned preflights live in
`street-plan/stub/`.

| run | expect |
|---|---|
| `node street-plan/stubrun-street.js <script> '{"date":"2026-10-05","mode":"plan"}' street-plan/stub/s1-ok.json` | exit 0, `returned.reason === 'plan'`, `agents_bound` ≤ 180, `violations` = [] |
| `node street-plan/stubrun-street.js <script> '{"date":"2026-10-05"}' street-plan/stub/s1-nobible.json` | exit 3, `threw` starts `street-1-research: street research waits for the density bible` |
| `node street-plan/stubrun-street.js <script> '{"date":"2026-10-05"}' street-plan/stub/s1-ok.json` | exit 0 (never a TypeError), `returned.pass === false` (no criterion passes on empty evidence) |
| `node street-plan/stubrun-street.js <script> '{"date":"2026-10-05","force":"x"}'` | exit 3, `args.force is not accepted by Street 1` |
