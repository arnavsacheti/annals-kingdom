export const meta = {
  name: 'filigree-3-build',
  description: 'Filigree Job 3: build the table map from sheet-spec.json units, slice by slice (A ground, B ink, C city, D stack); gate = hand test + slice gates',
  whenToUse: 'Run as the POLISH item "Filigree 3 · Implementation → the table map" (multi-run) after gates/2-plan.json passed: Workflow({name:"filigree-3-build", args:{date:"YYYY-MM-DD"}}). Holds maps-site/index.html while running.',
  phases: [
    {title: 'Preflight', detail: 'spec gate + spec unchanged; ledger; slice; prerequisites (R11); re-anchor'},
    {title: 'Build', detail: 'topo + paint-order schedule, per-file locks; implement -> syntax -> accept -> fix<=2 -> determinism -> unit record'},
    {title: 'Smoke', detail: 'sim (#s=epeshu + a procedural seed, simDays 400) and atlas views on/off, zero console errors'},
    {title: 'Slice gate', detail: 'capture metrics + spec checks + determinism; scored in code per slice'},
    {title: 'Hand test', detail: 'frozen computed questions; masked captures; paired blind navigators; scored in code'},
    {title: 'Fix units', detail: 'diagnoser -> fix units -> rebuild -> re-gate (<= maxRounds)'},
    {title: 'Record', detail: 'state/3-build.json, gates/3-build-<slice>.json, gates/3-build.json when D passes'}
  ]
}
const JOB = 'filigree-3-build'
// ==== filigree prelude v1 — keep byte-identical across the four filigree scripts ====
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
if (A.force != null && JOB === 'filigree-1-research') die('args.force is not accepted by Job 1 (there is no earlier gate to skip)')
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
  ['maps-site/index.html', 'The Tribute-Yard', 0], ['maps-site/index.html', 'The Tribute-Barn', 0], ['maps-site/index.html', 'harvest-tithe', 0]
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


checkArgs(['maxUnits', 'units', 'slice', 'gate', 'overridePrereqs', 'port', 'unstick', 'discard'])
const SLICES = ['A', 'B', 'C', 'D']
const MAXU = A.maxUnits ?? 8
if (!Number.isInteger(MAXU) || MAXU < 1 || MAXU > 20) die('args.maxUnits must be an integer 1..20')
const UNITS_ARG = A.units ?? null
if (UNITS_ARG !== null && (!Array.isArray(UNITS_ARG) || !UNITS_ARG.length || UNITS_ARG.some(x => typeof x !== 'string' || !x.trim()))) die('args.units must be a non-empty array of unit id strings')
if (UNITS_ARG && new Set(UNITS_ARG).size !== UNITS_ARG.length) die('args.units lists a unit twice')
if (UNITS_ARG && UNITS_ARG.length > MAXU) die(`args.units lists ${UNITS_ARG.length} units, more than maxUnits (${MAXU})`)
const SLICE_ARG = A.slice ?? null
if (SLICE_ARG !== null && !SLICES.includes(SLICE_ARG)) die('args.slice must be one of A|B|C|D')
const GATE = A.gate ?? 'auto'
if (!['auto', 'skip', 'only'].includes(GATE)) die('args.gate must be auto|skip|only')
if (A.overridePrereqs != null && typeof A.overridePrereqs !== 'boolean') die('args.overridePrereqs must be a boolean')
const OVERRIDE = A.overridePrereqs === true
const PORT = A.port ?? 8544
if (!Number.isInteger(PORT) || PORT < 1024 || PORT > 65535) die('args.port must be an integer 1024..65535')
const UNSTICK = A.unstick ?? [], DISCARD = A.discard ?? []
if (!Array.isArray(UNSTICK) || UNSTICK.some(x => typeof x !== 'string' || !x.trim())) die('args.unstick must be an array of unit id strings (zeroes their runs_failed)')
if (!Array.isArray(DISCARD) || DISCARD.some(x => typeof x !== 'string' || !/^fix-[A-D]\d+$/.test(x))) die('args.discard must be an array of fix unit ids (fix-<slice><n>)')
if (UNITS_ARG && GATE === 'only') die('args.units and gate "only" exclude each other (gate "only" builds nothing)')

// ---- constants (design: workflow-3-build.md) ----
const SLICE_NAME = {A: 'ground', B: 'ink', C: 'city', D: 'stack'}
const SLICE_METRICS = {A: 'counts,edges,panes', B: 'counts,labels,panes', C: 'counts,city,edges,fog,panes', D: 'counts,labels,city,edges,fog,stack,tiles,appear,panes'}
const PAINT_NAMES = ['infrastructure', 'relief', 'contours', 'water', 'rust coast road', 'green reserves', 'homestead dots', 'names and heights', 'city grain', 'fog washes', 'overlays']
const IMPL_RULINGS = ['R2', 'R3', 'R6', 'R7', 'R9', 'R10', 'R13', 'R18', 'R19', 'R20']
const HAND_VIEWS = ['V2', 'V3', 'V4']
const MASKED = {V2: 'Aldorūs', V3: 'Aldorūs', V4: 'Sokundo'}   // README §5 views table (gates/views.json is frozen by Job 2)
const VIEW_SHEET = {V1: 'country', V2: 'region', V3: 'valley', V4: 'region', V5: 'valley', V6: 'city'}   // fallback when views.json lacks a sheet
const SHEET_VIEWS = Object.keys(VIEW_SHEET)
const QKINDS = ['name', 'height', 'bearing8', 'side8', 'names']
const FIXTURES = ['F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'F08', 'F09', 'F10', 'F11', 'F12']
const FX11 = FIXTURES.slice(0, 11)
const APP_FILES = ['index.html', 'maps-site/index.html']
const FIX_PER_ROUND = 4
const ROUND_TOKENS = 1800000   // optional budget gate: up to ~70 agents in one fix round (snapshot, diagnoser, ledger guard, 4 units, re-gate)
const SPEC_MD = OUTABS + '/sheet-spec.md', SPEC_JSON = OUTABS + '/sheet-spec.json'
const VIEWS_JSON = OUTABS + '/gates/views.json', HEXES_JSON = OUTABS + '/gates/hexes.json', HANDQ = OUTABS + '/gates/3-handtest-questions.json'
const HANDQ_STAGE = OUTABS + '/gates/3-handtest-questions.staged.json'   // the writer's output; moved onto HANDQ only after the script validates it
const LEDGER_DIR = OUTABS + '/state/3-build'
const FIX_STAGE = OUTABS + '/state/3-build-fix-stage', LEDGER_SNAP = OUTABS + '/state/3-build-snapshot'   // outside LEDGER_DIR: preflight never reads them
const HANDQ_TOOL = MODE === 'smoke' ? OUTABS + '/dry/tools/filigree-handq.js' : REPO + '/tools/filigree-handq.js'
const BRIEF = REPO + '/docs/research/filigree-for-the-table.pdf'
const DOSSIER = DOCS + '/research-dossier.md'
const REUSE = DOCS + '/README.md § "7. Reuse map"'
const V_BUST = Number(DATE.replace(/-/g, ''))
const MASK_RULE = 'an opaque disc over the settlement of radius max(96, 1.5 × footprint) atlas px (times --mask-scale), plus r = 48 discs over every other anchor or marker in view, which also covers the print\'s hand-lettered town names'
const SANDBOX = `Sandbox recipe (CDNs are blocked; npm is not): if nothing listens on port ${PORT}, start node server.js from ${REPO} (server.js serves 8544 only; any other port must already be served). In a temp dir (mktemp -d) run npm pack leaflet@1.9.4 three@0.128.0 and extract them to leaflet/ and three/. Playwright comes from NODE_PATH=/opt/node22/lib/node_modules; if its bundled browser is missing, launch Chromium with executablePath /opt/pw-browsers/chromium-1194/chrome-linux/chrome; never run playwright install. Route **/leaflet@1.9.4/dist/* to <tmp>/leaflet/dist/<file> and **/three.js/r128/three.min.js to <tmp>/three/build/three.min.js (page.route + fulfill from disk). Once tools/filigree-capture.js exists, its --cdn-dir <tmp> flag does all of this. A setup failure (server, browser, CDN) is an infra_error, never a map defect.`

// ---- schemas (design § Agents and schemas) ----
const STR = {type: 'string'}, STRS = {type: 'array', items: {type: 'string'}}, BOOL = {type: 'boolean'}, NUM = {type: 'number'}, INT = {type: 'integer'}
const ANY = {type: ['string', 'number', 'boolean', 'array', 'object', 'null']}
const LOOSE = {type: 'object', additionalProperties: ANY}
const NUMMAP = {type: 'object', additionalProperties: NUM}
const obj = (properties, required) => ({type: 'object', properties, required: required || Object.keys(properties)})
const ACC_ITEM = obj({kind: {type: 'string', enum: ['node', 'grep', 'json', 'capture']}, cmd: STR, expect: STR})
const unitProps = strict => ({id: STR, title: STR, slice: {type: 'string', enum: SLICES},
  kind: {type: 'string', enum: ['logic', 'tool', 'data', 'css', 'copy']}, files: STRS, paint_order: INT, depends_on: STRS,
  requires: {type: 'array', items: {type: 'string', enum: ['roads', 'census', 'rivers']}}, covers: STRS,
  model: strict ? {type: 'string', enum: MODELS} : STR, effort: strict ? {type: 'string', enum: EFFORTS} : STR,
  acceptance: {type: 'array', items: ACC_ITEM}})
const UNIT_REQ = ['id', 'title', 'slice', 'kind', 'files', 'paint_order', 'depends_on', 'requires', 'covers', 'acceptance']
const UNIT_READ = obj({...unitProps(false), failed_criterion: STR, status: STR}, UNIT_REQ)   // model/effort stay free strings: MO() validates them per field
const UNIT_FIX = obj({...unitProps(true), failed_criterion: STR}, UNIT_REQ.concat(['failed_criterion']))   // Job 2's UNIT + failed_criterion
const FILEREC = obj({path: STR, sha256: STR, parsed: BOOL})
const PRE = obj({spec_gate_pass: BOOL, spec_sha_ok: BOOL, spec_sha256: STR,
  units: {type: 'array', items: UNIT_READ},
  slice_classes: {type: 'object', additionalProperties: STRS},
  checks: {type: 'object', additionalProperties: {type: 'array', items: obj({id: STR, cmd: STR, expect: STR})}},
  generators: {type: 'array', items: obj({cmd: STR, outputs: STRS})},
  pre_filigree_panes: STRS, paint_order_ids: STRS, label_cap: NUM, edge_delta: NUM,
  ground: {type: 'object', additionalProperties: obj({ground_class: STR, six: STRS, exempt: BOOL, min: NUMMAP})},
  ledger: obj({entries: {type: 'array', items: obj({id: STR, slice: STR, status: STR, attempts: INT, runs_failed: INT, failed_criterion: STR, title: STR, last_failure: STR, spec_sha256: STR})},
    pending_fix: {type: 'array', items: UNIT_READ}}),
  slice_pass: obj({A: BOOL, B: BOOL, C: BOOL, D: BOOL, final: BOOL}),
  view_sheets: {type: 'object', additionalProperties: STR},
  sheet_rules: {type: 'object', additionalProperties: obj({must: STRS, forbidden: STRS})},
  shield_class: STR, homestead_classes: STRS, river_town: obj({name: STR, x: NUM, y: NUM}),
  handq: obj({present: BOOL, sha: STR}),
  prereq: obj({roads: BOOL, census: BOOL, rivers_ready: BOOL}),
  block_markers: BOOL,
  anchors: {type: 'object', additionalProperties: {type: ['string', 'null']}},
  rulings_overrides: {type: 'object', additionalProperties: STR}},
['spec_gate_pass', 'spec_sha_ok', 'units', 'slice_classes', 'checks', 'generators', 'pre_filigree_panes', 'paint_order_ids', 'label_cap', 'edge_delta',
  'ground', 'ledger', 'slice_pass', 'view_sheets', 'sheet_rules', 'shield_class', 'homestead_classes', 'river_town', 'handq', 'prereq', 'block_markers', 'anchors', 'rulings_overrides'])
const IMPL = obj({id: STR, files_changed: {type: 'array', items: obj({path: STR, sha256: STR})}, notes: STR, dry: BOOL})
const SYN = obj({ok: BOOL, errors: STRS})
const ACC = obj({results: {type: 'array', items: obj({cmd: STR, ok: BOOL, out: STR})}, infra_error: STR})
const DETU = obj({ok: BOOL, diffs: STRS})
const RECU = obj({status: {type: 'string', enum: ['done', 'failed', 'infra']}, path: STR, sha256: STR, parsed: BOOL})
const SMOKE = obj({console_errors: STRS, infra_error: STR, block_random_hits: INT, shots: STRS})
const GCAP = obj({
  cells: {type: 'object', additionalProperties: obj({dense: NUMMAP, sparse: NUMMAP}, ['dense'])},
  views: {type: 'object', additionalProperties: {type: 'object', additionalProperties: obj({counts: NUMMAP, heights: NUM}, [])}},
  city: obj({pins_at_rest: NUM, controls_at_rest: NUM, block_labels: NUM, street_names_below: NUM, street_names_above: NUM, label_count: NUM}, []),
  stack: obj({node_identity_kept: BOOL, reload: BOOL, roundtrip_equal: BOOL, moveend_keeps_params: BOOL}, []),
  tiles: {type: 'object', additionalProperties: obj({base_requests: NUM}, [])},
  edges: {type: 'object', additionalProperties: obj({band_mean: NUM, interior_mean: NUM}, [])},
  fog: obj({opacity: NUM, same_day_equal: BOOL, diff_day_differs: BOOL}, []),
  appear: obj({steps: NUM, violations: {type: 'array', items: LOOSE}, below_minzoom_visible: STRS}, []),
  shield: obj({near_river_town: NUM}, []),
  panes: STRS, panes_when_off: STRS, filigree_counts_when_off: NUMMAP, console_errors: STRS, infra_error: STR, metrics_sha256: STR},
['cells', 'views', 'city', 'stack', 'tiles', 'edges', 'fog', 'appear', 'panes', 'panes_when_off', 'filigree_counts_when_off', 'console_errors', 'infra_error'])
const SPECC = obj({results: {type: 'array', items: obj({id: STR, ok: BOOL, value: STR})}})
const DETG = obj({generators: {type: 'array', items: obj({cmd: STR, equal: BOOL})}, random_hits: INT, syntax_ok: BOOL})
const QITEM = obj({id: STR, q: STR, kind: {type: 'string', enum: QKINDS}})
const HQS = obj({path: STR, sha256: STR, parsed: BOOL, deterministic: BOOL,
  questions: {type: 'object', additionalProperties: {type: 'array', items: QITEM}},
  answers: {type: 'object', additionalProperties: {type: ['string', 'number', 'array']}}})
const HCAP = obj({pngs: {type: 'object', additionalProperties: STR}, outside: {type: 'object', additionalProperties: STRS},
  heights_outside: {type: 'object', additionalProperties: INT}, infra_error: STR})
const NAV = obj({answers: {type: 'array', items: obj({id: STR, value: {type: ['string', 'number', 'boolean', 'array']}})},
  legible: {type: 'array', items: obj({name: STR, height: STR})}, covered_town_guess: STR, files_read: STRS})
const DIAG = obj({units: {type: 'array', items: UNIT_FIX}, files: {type: 'array', items: FILEREC}})
const DFILES = obj({files: {type: 'array', items: FILEREC}})
const SHAS = {type: 'array', items: obj({path: STR, sha256: STR})}
const SNAPS = obj({files: SHAS})
const GUARD = obj({ledger: SHAS, restored: STRS, removed: STRS, promoted: {type: 'array', items: FILEREC}, snapshot_kept: BOOL})
const PRUNE = obj({kept: STRS, removed: STRS, count_ok: BOOL})

// ---- helpers ----
const J = v => JSON.stringify(v)
const J2 = v => JSON.stringify(v, null, 2)
const relP = p => { const s = String(p ?? '').trim().replace(/^(\.\/)+/, ''); return s.startsWith(REPO + '/') ? s.slice(REPO.length + 1) : s }
const pct = x => Math.round(1000 * x) / 10
const budgetLeft = () => {
  try {
    if (!budget || typeof budget !== 'object') return Infinity
    const r = typeof budget.remaining === 'function' ? budget.remaining() : budget.remaining
    return typeof r === 'number' ? r : Infinity
  } catch (e) { return Infinity }
}
const unitOf = x => ({...x, id: String(x.id), files: [...new Set((x.files || []).map(relP))], depends_on: x.depends_on || [], requires: x.requires || [],
  covers: x.covers || [], acceptance: x.acceptance || [], paint_order: Number.isInteger(x.paint_order) ? x.paint_order : 10, model: x.model || null, effort: x.effort || null})
const appBound = u => u.files.some(f => APP_FILES.includes(f)) || u.acceptance.some(a => a.kind === 'capture')
const genOuts = u => needsDet(u) ? [...new Set(gensFor(u).flatMap(g => (g.outputs || []).map(relP)))] : []
const lockKeys = u => { const o = genOuts(u); return [...new Set(u.files.concat(o, appBound(u) || o.some(f => f.startsWith('maps-site/') || APP_FILES.includes(f)) ? ['<app>'] : []))] }

function kahn(units) {   // topological order, tie-break (paint_order, id); cyclic = ids left over
  const byId = new Map(units.map(u => [u.id, u])), indeg = new Map(units.map(u => [u.id, 0])), next = new Map(units.map(u => [u.id, []]))
  for (const u of units) for (const d of new Set(u.depends_on)) if (byId.has(d) && d !== u.id) { indeg.set(u.id, indeg.get(u.id) + 1); next.get(d).push(u.id) }
  const cmp = (a, b) => (a.paint_order - b.paint_order) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  const ready = units.filter(u => indeg.get(u.id) === 0).sort(cmp), order = []
  while (ready.length) {
    const u = ready.shift(); order.push(u)
    for (const j of next.get(u.id)) { indeg.set(j, indeg.get(j) - 1); if (indeg.get(j) === 0) { ready.push(byId.get(j)); ready.sort(cmp) } }
  }
  const selfDep = new Set(units.filter(u => u.depends_on.includes(u.id)).map(u => u.id))
  return {order: order.filter(u => !selfDep.has(u.id)), cyclic: units.filter(u => !order.includes(u) || selfDep.has(u.id)).map(u => u.id)}
}

function closeOver(units, isDone, deferred) {   // transitive exclusion to a fixpoint: a dependency must be done or itself still in the pool
  let pool = units.slice(), changed = true
  while (changed) {
    changed = false
    const ids = new Set(pool.map(u => u.id))
    for (const u of pool) {
      const unmet = u.depends_on.filter(d => !isDone(d) && !ids.has(d))
      if (unmet.length) { deferred.push({id: u.id, why: 'dep-unmet: ' + unmet.join(', ')}); log(`deferred ${u.id} (dep-unmet: ${unmet.join(', ')})`); pool = pool.filter(x => x !== u); changed = true; break }
    }
  }
  return pool
}

const P8 = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']
const sector = v => P8.indexOf(String(v ?? '').toLowerCase().replace(/north/g, 'n').replace(/south/g, 's').replace(/east/g, 'e').replace(/west/g, 'w').replace(/[^nsew]/g, ''))
const toInt = v => { const m = String(v ?? '').replace(/[,\s]/g, '').match(/-?\d+/); return m ? Number(m[0]) : NaN }
const asNames = v => (Array.isArray(v) ? v : String(v ?? '').split(/\s*[,;]\s*|\s+and\s+/)).map(norm).filter(Boolean)
function answerOk(kind, got, exp) {
  if (got == null || exp == null) return false
  if (kind === 'height') { const a = toInt(got), b = toInt(exp); return Number.isInteger(a) && a === b }
  if (kind === 'bearing8' || kind === 'side8') { const a = sector(got), b = sector(exp); if (a < 0 || b < 0) return false; const d = Math.abs(a - b) % 8; return Math.min(d, 8 - d) <= 1 }
  if (kind === 'names') { const e = new Set(asNames(exp)), g = new Set(asNames(got)), hit = [...e].filter(x => g.has(x)).length; return e.size > 0 && hit / (e.size + g.size - hit) >= 0.5 }   // Jaccard: listing every visible name no longer passes
  const e = norm(Array.isArray(exp) ? exp[0] : exp)
  return e !== '' && norm(Array.isArray(got) ? got[0] : got) === e
}
const townLeak = (guess, town) => { const g = norm(guess), t = norm(town); return !!t && !!g && (g === t || (' ' + g + ' ').includes(' ' + t + ' ')) }

// ---- Preflight ----
phase('Preflight')
const pre = await crit(P(`${ANCHOR_TASK}
Put that object under "anchors". Then read the following and write nothing (a missing file gives the empty value; never invent):
1. spec_gate_pass: ${OUTABS}/gates/2-plan.json exists, parses and has "pass": true. spec_sha256: sha256sum of ${SPEC_JSON} ('' if missing). spec_sha_ok: it equals the sha256 recorded for sheet-spec.json in that gate's "artifacts" ([{path, sha256}]); false if either is missing.
2. From ${SPEC_JSON}: units = /units verbatim (each {id, title, slice, kind, files, paint_order, depends_on, requires, covers, acceptance, model?, effort?}); slice_classes = /slice_classes; checks = /checks ({<slice>: [{id, cmd, expect}]}); generators = /generators normalized to [{cmd, outputs: [repo-relative paths that command writes]}]; pre_filigree_panes = /hook/pre_filigree_panes; paint_order_ids = /paint_order as an array of ids (the brief's p5 order, bottom to top; [] if missing); label_cap = /city_rule/label_cap (0 if missing); edge_delta = /paint/pooled_edge/delta_lum (0 if missing).
3. ground, for each fixture F01..F12: ground_class = the agreed ground class of that hex in ${OUTABS}/gates/1-hex-answers.json; from ${OUTABS}/density-bible.json: six = ground_classes.<ground_class>.six; exempt = that ground class has a non-empty exempt_rule; min = {<class id>: classes[<class id>].min_per_cell.<ground_class> (1 when absent)} for each class in six. Shape {<F>: {ground_class, six, exempt, min}}.
4. ledger, from every ${OUTABS}/state/3-build/*.json: entries = [{id, slice, status, attempts, runs_failed, failed_criterion, title, last_failure, spec_sha256 (the unit file's "spec_sha256")}] (absent strings "", absent numbers 0); pending_fix = the whole unit object of every file whose id starts with "fix-" and whose status is pending, failed or infra (never done or discarded), with its fields id, title, slice, kind, files, paint_order, depends_on, requires, covers, acceptance (as [{kind, cmd, expect}]), failed_criterion, status.
5. slice_pass = {A, B, C, D: ${OUTABS}/gates/3-build-<slice>.json exists, parses and has "pass": true AND the sha256 recorded for sheet-spec.json in its "artifacts" equals spec_sha256 (a gate recorded under another sheet-spec is stale: false); final: the same for ${OUTABS}/gates/3-build.json}.
6. handq = {present: ${HANDQ} exists and parses, sha: its sha256sum ('' if missing)}.
7. prereq, from ${REPO}/POLISH.md, finding each item BY ITS TITLE TEXT (never by line number): roads = the item whose bold title contains "Traced road network" is checked ("- [x]"); census = the item whose bold title contains "Census second pass" is checked; rivers_ready = ${REPO}/maps-site/data/rivers.json exists.
8. block_markers = ${REPO}/maps-site/index.html contains both "/* FILIGREE */" and "/* /FILIGREE */".
9. rulings_overrides = the "overrides" object of ${DOCS}/rulings.json ({} when the file is absent).
10. Sheet rules: view_sheets = {<view id>: its "sheet"} for every view in ${VIEWS_JSON}; sheet_rules = {<sheet>: {must: the class ids of /sheets/<sheet>/must ([{class, rule}] -> class), forbidden: /sheets/<sheet>/forbidden}} for every sheet under /sheets of ${SPEC_JSON}; river_town = /picks/river_town of ${SPEC_JSON} as {name, x, y} ({name: "", x: 0, y: 0} if missing); from ${OUTABS}/density-bible.json: shield_class = the id of the class that draws the overlay town shield (R19; '' if none), homestead_classes = the ids of every class whose id or label names homesteads.`), {label: 'preflight', phase: 'Preflight', schema: PRE, ...M('mech')})
if (!pre) return done({reason: 'agent died: preflight', check_off: false})
const lost = anchorsLost(pre.anchors)
if (lost.length) die('anchor lost: ' + lost.join('; '))
const {r: RUL, used: RUSED} = rulingsMerge(pre.rulings_overrides)
const chainOk = !!(pre.spec_gate_pass && pre.spec_sha_ok)
if (!chainOk) {
  if (MODE === 'full' && !FORCE) die('build must not start before the sheet spec passed its gate (gates/2-plan.json), or the spec changed since')
  log('gate chain not satisfied (Job 2 gate not pass, or the spec changed): ' + (FORCE ? 'forced: ' + FORCE : 'reported only in ' + MODE + ' mode'))
}

// ---- slice + prerequisites (R11) ----
const passed = s => pre.slice_pass[s] === true
let SL = SLICE_ARG || SLICES.find(s => !passed(s)) || null
if (!SL) {
  if (pre.slice_pass.final === true) return done({pass: true, reason: MODE === 'plan' ? 'plan' : 'nothing to build', slice: 'D', check_off: MODE === 'full' && !FORCE, ...(MODE === 'plan' ? {nothing_to_build: true, chain_ok: chainOk, schedule: [], agents_bound: 0} : {}), owner_rulings_used: RUSED, gate_path: OUT + '/gates/3-build.json', polish_note: 'Filigree 3 complete (gates/3-build.json pass)'})
  SL = 'D'; log('slices A-D passed but gates/3-build.json is not pass: re-running the slice D gate')
}
const missingPre = [['roads', 'Traced road network'], ['census', 'Census second pass']].filter(([k]) => pre.prereq[k] !== true).map(([, t]) => t)
const blockedBy = missingPre.length && !(SL === 'A' && OVERRIDE) ? missingPre : []
const blockedNote = 'blocked: waiting on ' + blockedBy.join(' and ') + (SL !== 'A' && OVERRIDE ? ' (overridePrereqs covers slice A only, R11)' : '')
if (missingPre.length && !blockedBy.length) log('overridePrereqs: slice A runs without ' + missingPre.join(' and ') + ' (R11)')
if (blockedBy.length) {
  if (MODE !== 'plan') return done({pass: false, reason: 'blocked', slice: SL, check_off: false, blocked_by: blockedBy, owner_rulings_used: RUSED, polish_note: blockedNote})
  log(blockedNote + ': plan mode still returns the schedule; units that require them count as deferred')
}
const unpassedBefore = SLICES.slice(0, SLICES.indexOf(SL)).filter(s => !passed(s))
if (unpassedBefore.length) die(`slice ${SL} refused: earlier slice ${unpassedBefore.join(', ')} has not passed its gate`)
const specGap = (SL === 'D' ? SLICES : [SL]).filter(s => !(pre.checks[s] || []).length)   // spec('<S>') can never pass without them, and no fix unit can add them
if (specGap.length) {
  const msg = `sheet-spec.json has no /checks for slice ${specGap.join(', ')}: Job 2 (section s12) must write per-slice checks; re-run Job 2`
  if (MODE === 'full' && !FORCE) die(msg)
  log(msg + (FORCE ? ' (forced: ' + FORCE + ')' : ' (reported only in ' + MODE + ' mode)'))
}

// ---- schedule (code) ----
const LEDGER = new Map(pre.ledger.entries.map(e => [e.id, e]))
const SPEC_UNITS = pre.units.map(unitOf)
const DISC = new Set(DISCARD)
const FIX_PENDING = pre.ledger.pending_fix.map(unitOf).filter(u => !DISC.has(u.id)).filter(u => { const m = /^fix-([A-D])\d+$/.exec(u.id); const ok = !!m && u.slice === m[1] && SLICES.includes(u.slice) && !!u.failed_criterion && u.acceptance.length > 0; if (!ok) log(`pending fix unit ${u.id} ignored: failed validation (id/slice/failed_criterion/acceptance)`); return ok })
for (const id of UNSTICK) { const e = LEDGER.get(id); if (e && (e.runs_failed || 0) > 0) { e.runs_failed = 0; log(`unstick: ${id} runs_failed reset to 0`) } else log(`unstick: ${id} has no failed runs on record`) }
if (DISC.size && MODE === 'full') {
  const dr = await agent(P(`For each file below that exists set "status" to "discarded" and add "discarded_reason": "discarded by owner (args.discard)"; keep every other field; 2-space indent, trailing newline. Files: ${J([...DISC].map(id => `${OUTABS}/state/3-build/${id}.json`))}
${READBACK}`), {label: 'owner discard', phase: 'Preflight', schema: DFILES, ...M('mech')})
  if (!dr || !dr.files.every(FILE_OK)) log('owner discard incomplete: the ledger files may still read as pending')
}
const ALL_BY_ID = new Map(SPEC_UNITS.concat(FIX_PENDING).map(u => [u.id, u]))
const doneSet = new Set(pre.ledger.entries.filter(e => e.status === 'done').map(e => e.id))
if (doneSet.has('U00') && !pre.block_markers) { doneSet.delete('U00'); log('U00 is recorded done but the /* FILIGREE */ block markers are missing in maps-site/index.html: U00 is re-queued') }
for (const u of SPEC_UNITS) { const e = LEDGER.get(u.id); if (e && doneSet.has(u.id) && e.spec_sha256 && pre.spec_sha256 && e.spec_sha256 !== pre.spec_sha256) { doneSet.delete(u.id); log(`${u.id}: built under another sheet-spec.json (sha differs); re-queued`) } }
if (!RESUME) for (const u of SPEC_UNITS.concat(FIX_PENDING)) if (u.slice === SL && doneSet.delete(u.id)) log(`resume:false: ${u.id} re-queued`)
const newFixIds = []   // accepted fix units written by this run's diagnoser
const knownFixOf = s => [...new Set(pre.ledger.entries.filter(e => /^fix-/.test(e.id) && e.status !== 'discarded' && !DISC.has(e.id) && e.slice === s).map(e => e.id)
  .concat(FIX_PENDING.filter(u => u.slice === s).map(u => u.id), newFixIds.filter(id => (ALL_BY_ID.get(id) || {}).slice === s)))]
const unitIdsOf = s => [...new Set(SPEC_UNITS.filter(u => u.slice === s).map(u => u.id).concat(knownFixOf(s)))]
const reqOk = r => r === 'roads' ? pre.prereq.roads === true : r === 'census' ? pre.prereq.census === true : r === 'rivers' ? pre.prereq.rivers_ready === true : false
const seenFix = new Set(pre.ledger.entries.filter(e => /^fix-/.test(e.id) && e.failed_criterion && e.status !== 'discarded').map(e => e.slice + '|' + e.failed_criterion)
  .concat(FIX_PENDING.filter(u => u.failed_criterion).map(u => u.slice + '|' + u.failed_criterion)))

const cand = [...new Map(SPEC_UNITS.filter(u => u.slice === SL).concat(FIX_PENDING.filter(u => u.slice === SL)).map(u => [u.id, u])).values()]
const deferred = [], stuck = []
let pool0 = []
for (const u of cand) {
  if (doneSet.has(u.id)) continue
  const led = LEDGER.get(u.id) || {}
  if ((led.runs_failed || 0) >= 3) { stuck.push({id: u.id, title: u.title || '', last_failure: led.last_failure || ''}); log(`stuck: ${u.id} (runs_failed ${led.runs_failed})`); continue }
  const unmet = u.requires.filter(r => !reqOk(r))
  if (unmet.length) { deferred.push({id: u.id, why: 'requires ' + unmet.join(', ')}); log(`deferred ${u.id} (requires ${unmet.join(', ')})`); continue }
  pool0.push(u)
}
const isDone0 = id => doneSet.has(id)
const pool = closeOver(pool0, isDone0, deferred)
const topo = kahn(pool)
if (topo.cyclic.length) die('scheduler: dependency cycle among ' + topo.cyclic.join(', '))
let batch
if (UNITS_ARG) {
  const inSlice = new Set(cand.map(u => u.id)), ready = new Set(topo.order.map(u => u.id))
  for (const id of UNITS_ARG) {
    if (!inSlice.has(id)) die(`args.units: ${id} is not a unit of the current slice ${SL}`)
    if (!ready.has(id)) die(`args.units: ${id} is not ready (done, stuck, deferred or dep-unmet)`)
  }
  batch = topo.order.filter(u => UNITS_ARG.includes(u.id))
} else batch = topo.order.slice(0, MAXU)
batch = cap(batch)
if (GATE === 'only') batch = []
{
  const ids = new Set(batch.map(u => u.id))
  for (const u of batch) for (const d of u.depends_on) if (!doneSet.has(d) && !ids.has(d)) die(`scheduler: ${u.id} depends on ${d}, which is neither done nor scheduled before it in this batch`)
}
const restOfSlice = unitIdsOf(SL).filter(id => !doneSet.has(id) && !batch.some(u => u.id === id))
const handSlice = SL === 'B' || SL === 'D'

if (MODE === 'plan') {
  const nB = batch.length, gateLikely = GATE === 'only' || (GATE === 'auto' && !restOfSlice.length)
  // maxima as the code runs them (crit() = 2 agents); every gate cycle (1 + ROUNDS) re-runs smoke, gate and hand test; fix-unit builds count in Build
  const UNIT_MAX = 1 + 3 * 2 + 2 + 1 + 2, HANDQ_MAX = 2 + 2 + 2, HAND_CYCLE = 2 * (1 + 2 * HAND_VIEWS.length)
  const schedFor = n => [
    {phase: 'Preflight', agents_min: 1, agents_max: 2},
    {phase: 'Build', agents_min: 4 * n, agents_max: UNIT_MAX * (n + ROUNDS * FIX_PER_ROUND)},
    {phase: 'Smoke', agents_min: n || gateLikely ? 1 : 0, agents_max: 2 * (1 + ROUNDS)},
    {phase: 'Slice gate', agents_min: gateLikely ? 3 : 0, agents_max: 3 * (1 + ROUNDS)},
    {phase: 'Hand test', agents_min: gateLikely && handSlice ? 2 + 2 * cap(HAND_VIEWS).length : 0, agents_max: handSlice ? HANDQ_MAX + HAND_CYCLE * (1 + ROUNDS) : 0},
    {phase: 'Fix units', agents_min: 0, agents_max: ROUNDS * (2 + 2 + 2)},
    {phase: 'Record', agents_min: 2, agents_max: 1 + 3 * 2}
  ]
  const boundFor = n => schedFor(n).reduce((s, r) => s + r.agents_max, 0)
  const schedule = schedFor(nB), bound = boundFor(nB)
  return done({reason: 'plan', slice: SL, check_off: false, chain_ok: chainOk, blocked_by: blockedBy, spec_gap: specGap, owner_rulings_used: RUSED, schedule, agents_bound: bound,
    units: batch.map(u => u.id), deferred, stuck: stuck.map(x => x.id), rest_of_slice: restOfSlice, gate_expected: gateLikely,
    polish_note: `plan: slice ${SL} (${SLICE_NAME[SL]}), ${nB} unit(s) [${batch.map(u => u.id).join(', ')}], ${deferred.length} deferred, ${stuck.length} stuck; at most ${bound} agents (${boundFor(8)} at maxUnits 8, maxRounds ${ROUNDS})` +
      (chainOk ? '' : '; gate chain not satisfied (a full run refuses)') + (blockedBy.length ? '; ' + blockedNote : '') + (specGap.length ? '; spec gap: no /checks for slice ' + specGap.join(', ') + ' (a full run refuses)' : '')})
}

// ---- Build ----
const anchorText = anchorMap(pre.anchors)
const hardRules = u => `Hard rules:
- Determinism: seeded only, xmur3(name) -> mulberry32 as the atlas already does (anchors "function xmur3", "function mulberry32"). No unseeded randomness and no wall-clock reads: grep -E '${CLOCK_GREP}' must find nothing inside the FILIGREE block or in tools/filigree-*.js.
- Generated files (maps-site/data/filigree-names.json, maps-site/data/gazetteer.json, the baked relief) are regenerated by their tool and never hand-edited.
- Canon key: dotted = major roads only; solid black = rivers. Never draw a minor path dotted.
- ${VOCAB_RULE}
- All filigree JS goes inside /* FILIGREE */ … /* /FILIGREE */ in maps-site/index.html, with only minimal hook calls outside it.
- The table map stays behind the default-off toggle (R18).
- The sim ${REPO}/index.html is untouched unless this unit's files name it.
- Do not generalize a ridge to save ink; if a knoll has no name, mint one with the names tool (R9).
- Edit ONLY this unit's files (repo-relative to ${REPO}): ${J(u.files)}. Other units may be running at the same time on other files.
- A tool or data unit's acceptance never reads maps-site/index.html.
Rulings:
${rulingText(RUL, IMPL_RULINGS)}`
const dryLine = (u, k) => MODE === 'smoke' ? `DRY RUN: edit nothing; write your intended change as a unified diff to ${OUTABS}/dry/${u.id}${k ? '-fix' + k : ''}.diff (create the directory). Return files_changed = [] and dry = true.\n` : ''
const implPrompt = (u, i, n) => `${dryLine(u, 0)}You are implementing build unit ${u.id} of the Filigree table map (slice ${u.slice}, ${SLICE_NAME[u.slice]}).
Unit (JSON): ${J(u)}
Paint order: ${u.paint_order} (${PAINT_NAMES[u.paint_order] || 'overlays'}); position ${i + 1} of ${n} in this run's schedule (relief -> contours -> water -> rust coast road -> green reserves -> homestead dots -> names and heights -> city grain -> fog washes; overlays as separate sheets).
Read the rules in "covers" (${J(u.covers)}) from ${SPEC_MD} and ${SPEC_JSON}; the /hook and /capture contracts there are binding. Reuse before inventing: ${REUSE}. Background (read only if needed): ${DOSSIER}; the owner's brief ${BRIEF}.
Current anchors (re-derived this run; grep the pattern if a line moved):
${anchorText}
${hardRules(u)}
Return {id: "${u.id}", files_changed: [{path (repo-relative), sha256 (sha256sum after your edit)}], notes (one paragraph), dry}.`
const syntaxPrompt = targets => `Mechanical syntax gate, no judging; write nothing. Check ONLY these files (repo-relative to ${REPO}): ${J(targets)}.
- each .html file: the CLAUDE.md "Verification" syntax check: extract every inline <script> block that has no src attribute and compile its body with new Function; report a failing block as "<file> block <n>: <message>";
- each .json file: JSON.parse it;
- each .js file: node --check it.
Return {ok: true only when every check passed, errors: [one line per failure]}.`
const acceptPrompt = u => `Run the acceptance items of build unit ${u.id} from ${REPO}, exactly as written, and write nothing in the repo: ${J(u.acceptance)}
- kind node | grep | json: run cmd in a shell and compare its stdout with expect. ok when the trimmed stdout equals expect, or expect is written /regex/ and the stdout matches it, or expect is a count (for grep, the number of matching lines) and equals it; when expect is a prose condition, evaluate that condition against the output. Anything else is ok: false.
- kind capture: only then start the server and a browser. ${SANDBOX}
Do not start a server or browser when no item has kind capture.${MODE === 'smoke' ? ' SMOKE: the unit was a dry run, so failures are expected; still run every item.' : ''}
Return {results: [{cmd, ok, out (the relevant output, at most 400 characters)}] in the order given, infra_error: "" (or the setup failure: server, browser or CDN; never a failing check)}.`
const fixPrompt = (u, st, k) => `${dryLine(u, k)}You are fixing build unit ${u.id} (attempt ${k} of 2) after its gate failed.
Unit (JSON): ${J(u)}
Syntax errors: ${J(st.syn ? st.syn.errors : [])}
Failing acceptance results: ${J(st.acc ? st.acc.results.filter(r => !r.ok) : [])}${st.acc && st.acc.results.length < u.acceptance.length ? ` (only ${st.acc.results.length} of ${u.acceptance.length} items reported)` : ''}
Read the rules in "covers" from ${SPEC_MD} and ${SPEC_JSON}. Fix the cause, not the check.
Current anchors:
${anchorText}
${hardRules(u)}
Return {id: "${u.id}", files_changed: [{path, sha256}], notes, dry}.`
const gensFor = u => pre.generators.filter(g => (g.outputs || []).map(relP).some(o => u.files.includes(o)) || u.files.some(f => String(g.cmd).includes(f)))
const needsDet = u => u.kind === 'tool' || u.files.some(f => pre.generators.some(g => (g.outputs || []).map(relP).includes(f)))

async function recordUnit(u, s) {
  const prev = LEDGER.get(u.id) || {}
  const status = s.status
  const runsFailed = (prev.runs_failed || 0) + (status === 'failed' ? 1 : 0)
  const res = s.acc ? s.acc.results : []
  const rec = {...u, id: u.id, date: DATE, spec_sha256: pre.spec_sha256 || '', slice: u.slice, status, files: u.files,
    shas: [...(s.shas || new Map()).entries()].map(([path, sha256]) => ({path, sha256})),
    acceptance: u.acceptance.map((a, i) => ({...a, ok: res[i] ? res[i].ok : null, out: res[i] ? res[i].out : ''})),
    attempts: (prev.attempts || 0) + 1, fix_attempts: s.attempts || 0, runs_failed: runsFailed, last_failure: s.last_failure || '', dry: MODE === 'smoke'}
  const r = await crit(P(`Write the JSON below VERBATIM (2-space indent, trailing newline) to ${OUTABS}/state/3-build/${u.id}.json, creating parent directories (one file per unit; replace any previous content). Also return status = the "status" field of the file as you read it back.

${J2(rec)}

${READBACK}`), {label: `${u.id} · record`, phase: 'Build', schema: RECU, ...M('mech')})
  const recorded = FILE_OK(r) && r.status === status
  if (!recorded) log(`${u.id}: unit record ${r ? 'read-back mismatch' : 'agent died'}; the unit counts as failed for this run (the next preflight repairs the ledger)`)
  return {id: u.id, ok: status === 'done' && recorded, status: recorded ? status : 'failed', built_status: status, recorded, title: u.title || '',
    last_failure: recorded ? rec.last_failure : (rec.last_failure || 'unit record failed'), runs_failed: runsFailed, files_changed: rec.shas.map(x => x.path)}
}

async function buildUnit(u, i, n) {
  const L = s => `${u.id} · ${s}`
  const role = u.kind === 'logic' ? 'judge' : u.kind === 'tool' ? 'deep' : 'audit'
  const shas = new Map()
  const note = r => { for (const f of r.files_changed) shas.set(relP(f.path), f.sha256) }
  const outside = () => [...shas.keys()].filter(f => !u.files.map(relP).includes(f))
  const strayFail = (att, acc) => { const o = outside(); log(`${u.id}: edited outside unit files: ${o.join(', ')}`); return recordUnit(u, {status: 'failed', last_failure: 'edited outside unit files: ' + o.join(', '), shas, attempts: att, acc}) }
  const impl = await agent(P(implPrompt(u, i, n)), {label: L('implement'), phase: 'Build', schema: IMPL, ...MO(role, u)})
  if (!impl) return recordUnit(u, {status: 'infra', last_failure: 'agent died: implement', shas})
  note(impl)
  if (outside().length) return strayFail(0)
  const scope = () => { const c = [...shas.keys()]; return (c.length ? c : MODE === 'smoke' ? [] : u.files).filter(f => /\.(html|json|js)$/.test(f)) }
  const check = async k => {
    const sfx = k ? ` (fix ${k})` : ''
    const targets = scope()
    const syn = targets.length ? await agent(P(syntaxPrompt(targets)), {label: L('syntax' + sfx), phase: 'Build', schema: SYN, ...M('mech')}) : {ok: true, errors: []}
    if (!syn) return {dead: 'syntax' + sfx}
    const acc = await agent(P(acceptPrompt(u)), {label: L('accept' + sfx), phase: 'Build', schema: ACC, ...M('audit')})
    if (!acc) return {dead: 'accept' + sfx, syn}
    const infra = acc.infra_error.trim()
    return {syn, acc, infra, ok: syn.ok === true && !infra && u.acceptance.length > 0 && acc.results.length >= u.acceptance.length && acc.results.every(r => r.ok === true)}
  }
  let st = await check(0), attempts = 0
  while (!st.dead && !st.infra && !st.ok && attempts < 2) {
    attempts++
    const fx = await agent(P(fixPrompt(u, st, attempts)), {label: L('fix ' + attempts), phase: 'Build', schema: IMPL, ...M(u.kind === 'logic' ? 'judge' : 'audit')})
    if (!fx) { st = {...st, dead: 'fix ' + attempts}; break }
    note(fx)
    if (outside().length) return strayFail(attempts, st.acc)
    st = await check(attempts)
  }
  if (st.dead) return recordUnit(u, {status: 'infra', last_failure: 'agent died: ' + st.dead, shas, attempts, acc: st.acc})
  if (st.infra) return recordUnit(u, {status: 'infra', last_failure: 'infra: ' + st.infra, shas, attempts, acc: st.acc})
  if (!st.ok) {
    const why = (st.syn.errors || []).slice(0, 3).concat(st.acc.results.filter(r => !r.ok).slice(0, 3).map(r => r.cmd + ' -> ' + String(r.out).slice(0, 120)))
    return recordUnit(u, {status: 'failed', last_failure: why.join(' | ') || 'acceptance incomplete', shas, attempts, acc: st.acc})
  }
  if (needsDet(u)) {
    const gens = gensFor(u)
    if (MODE === 'smoke') log(`${u.id}: determinism skipped in smoke (generators write repo files)`)
    else if (!gens.length) log(`${u.id}: no /generators command touches its files; determinism skipped`)
    else {
      const det = await agent(P(`Mechanical determinism check for unit ${u.id}, no judging; write nothing except what the commands themselves write. Run each command below from ${REPO} twice in a row; after each run sha256sum every output it lists. ok = every output has the same sha256 after both runs; diffs = one line per output that differed ("<path>: <sha 1> != <sha 2>"). Commands: ${J(gens)}. Return {ok, diffs}.`),
        {label: L('determinism'), phase: 'Build', schema: DETU, ...M('mech')})
      if (!det) return recordUnit(u, {status: 'infra', last_failure: 'agent died: determinism', shas, attempts, acc: st.acc})
      if (!det.ok) return recordUnit(u, {status: 'failed', last_failure: 'determinism: ' + det.diffs.slice(0, 3).join('; '), shas, attempts, acc: st.acc})
    }
  }
  return recordUnit(u, {status: 'done', last_failure: '', shas, attempts, acc: st.acc})
}

const tails = {}, runById = {}
function withFiles(paths, fn) {
  const files = [...new Set(paths)].sort()
  const run = Promise.all(files.map(f => tails[f] || Promise.resolve())).then(fn)
  const settled = run.then(() => null, () => null); files.forEach(f => { tails[f] = settled })
  return run
}
const doneNow = new Set(doneSet)
const results = {}, builtOk = [], failedIds = [], infraIds = [], changedFiles = new Set()
async function runBatch(units) {   // submission (and lock) order = topological order
  const ids = new Set(units.map(u => u.id))
  for (const u of units) {
    const miss = u.depends_on.filter(d => !doneNow.has(d) && !ids.has(d) && !runById[d])
    if (miss.length) die(`scheduler: ${u.id} depends on ${miss.join(', ')}, which is neither done nor scheduled`)
  }
  units.forEach((u, i) => {
    runById[u.id] = withFiles(lockKeys(u), async () => {
      const deps = await Promise.all(u.depends_on.filter(d => runById[d]).map(d => runById[d].catch(() => null)))
      if (deps.some(d => !d || !d.ok)) return {id: u.id, ok: false, status: 'blocked-by-dep'}
      return buildUnit(u, i, units.length)
    })
  })
  const built = await Promise.all(units.map(u => runById[u.id].catch(() => null)))
  for (let i = 0; i < units.length; i++) {
    const u = units[i]
    let r = built[i]
    if (!r) { log(`${u.id}: its build threw; counted as failed, never as done`); r = await recordUnit(u, {status: 'failed', last_failure: 'build threw'}) }
    results[u.id] = r
    if (r.status === 'blocked-by-dep') { deferred.push({id: u.id, why: 'a dependency failed this run'}); log(`deferred ${u.id} (a dependency failed this run)`) }
    else if (r.ok) { doneNow.add(u.id); builtOk.push(u) }
    else if (r.status === 'infra') infraIds.push(u.id)
    else failedIds.push(u.id)
    for (const f of r.files_changed || []) changedFiles.add(f)
  }
  return built
}

phase('Build')
if (batch.length) await runBatch(batch)
else log(GATE === 'only' ? 'gate "only": no build' : 'no ready unit in slice ' + SL)

// ---- Smoke / Slice gate / Hand test ----
const shotSfx = tag => tag ? '-' + tag.trim().replace(/[^A-Za-z0-9.]+/g, '-') : ''
const u01Done = () => doneNow.has('U01')
async function runSmoke(tag) {
  phase('Smoke')
  const dir = `${OUTABS}/shots/run-${DATE}${shotSfx(tag)}`
  return crit(P(`Runtime smoke; write nothing in the repo (screenshots and scratch files go under ${dir}/). ${SANDBOX}
Sim: load http://localhost:${PORT}/?v=${V_BUST}#s=epeshu and http://localhost:${PORT}/?v=${V_BUST}#s=tamar1374; for each, wait for window.ANNALS.ready, then run ANNALS.simDays(400).
Atlas: ${u01Done() ? `run node tools/filigree-capture.js --views '${VIEWS_JSON}' --modes dense,sparse --themes day,night --metrics labels --port ${PORT} --out '${dir}/' (add --cdn-dir <tmp> when the CDNs are unreachable)` : `load http://localhost:${PORT}/maps-site/?v=${V_BUST} with a throwaway Playwright script run from a temp dir, wait for window.ATLAS.ready, then open the same view with the table-map toggle on (filigree=1 in the hash) and off`}.
Collect every console error and page error (sim and atlas). Count the lines matching grep -E '${CLOCK_GREP}' between the /* FILIGREE */ and /* /FILIGREE */ markers of ${REPO}/maps-site/index.html (0 when the block does not exist yet).
Return {console_errors: [one line each], infra_error ("" when setup worked), block_random_hits, shots: [paths written]}.`), {label: 'smoke' + tag, phase: 'Smoke', schema: SMOKE, ...M('audit')})
}

const checksFor = sl => (sl === 'D' ? SLICES : [sl]).flatMap(s => (pre.checks[s] || []).map(c => ({...c, id: s + ':' + c.id, slice: s})))   // ids are slice-qualified: the same id in two slices stays two results
const gatePrompts = (sl, tag) => {
  const dir = `${OUTABS}/shots/gate-${sl}-${DATE}${shotSfx(tag)}`
  return [
    `Slice ${sl} gate capture. You are the only agent that starts the server: ${SANDBOX} Leave the server running when you finish (the spec checks running alongside you may use it); never stop it.
Run from ${REPO}: node tools/filigree-capture.js --views '${VIEWS_JSON}' --cells '${HEXES_JSON}' --modes dense,sparse --metrics ${SLICE_METRICS[sl]} --port ${PORT} --out '${dir}/' (add --cdn-dir <tmp> when the CDNs are unreachable).
Then read ${dir}/metrics.json and return its compact metrics: cells (verbatim: {<F>: {dense: {<class>: n}, sparse: {...}}}), views (counts and heights only, for every view the capture wrote, V1 included: {<V>: {<mode>: {counts, heights}}}), city, stack, tiles, edges, fog, appear, panes (the filigree pane ids in DOM order, bottom to top, each normalized to its paint-order id, or to old_survey / muster_days / shut_ways / notices for overlay panes; [] when this slice measures none), panes_when_off, filigree_counts_when_off, console_errors, infra_error ("" when the capture ran), metrics_sha256 (sha256sum of metrics.json). A metric this slice does not measure is {} (never invent values).${sl === 'D' ? `
Also return shield = {near_river_town: the number of features of class "${pre.shield_class}" drawn on view V1 (dense) within 48 atlas px of the river town ${J(pre.river_town)}}: take it from the V1 dense labels in metrics.json when that class is listed there; otherwise open V1 exactly as the capture tool does (its views.json entry, filigree=1) in a throwaway Playwright script run from a temp dir and read ATLAS.filigree.count([x-48, y-48, x+48, y+48])["${pre.shield_class}"] (0 when absent). Return shield = {} only when it cannot be measured.` : ''}`,
    `Mechanical spec checks, no judging; write nothing. Never start or stop a server or browser yourself: the gate capture agent running alongside you owns the server on port ${PORT}; a check that needs it and finds nothing listening may wait up to 60 s for it, then is ok: false with value "no server". Run each check below from ${REPO}: its cmd prints JSON on stdout; evaluate its expect condition against that JSON. One result per check id; a command that fails or prints no JSON is ok: false with value = the error.
Checks: ${J(checksFor(sl))}
Return {results: [{id, ok, value (the measured value as a short string)}]}.`,
    `Mechanical determinism + syntax check, no judging; write nothing except what the generator commands themselves write. Start no server or browser.
1. generators: ${MODE === 'smoke' ? 'SMOKE: do not run the generators (they would rewrite repo files); return generators: [].' : `run each command below from ${REPO} twice in a row; after each run sha256sum every output it lists; equal = identical sha256 for every output after both runs. Commands: ${J(pre.generators)}`}
2. random_hits: the number of lines matching grep -E '${CLOCK_GREP}' between the /* FILIGREE */ and /* /FILIGREE */ markers of ${REPO}/maps-site/index.html, plus in ${REPO}/tools/filigree-*.js.
3. syntax_ok: the CLAUDE.md "Verification" syntax check (extract every inline <script> block that has no src attribute and compile its body with new Function) passes on BOTH ${REPO}/index.html and ${REPO}/maps-site/index.html.
Return {generators: [{cmd, equal}], random_hits, syntax_ok}.`
  ]
}
const GATE_LABELS = ['gate capture', 'spec checks', 'determinism + syntax']
const GATE_SCHEMAS = [GCAP, SPECC, DETG]
const GATE_ROLES = ['audit', 'mech', 'mech']

let HQ = null, hqWritten = false
function hqProblems(h) {   // the invariants scoreNav relies on: >= 8 per view, globally unique "<V>-T<n>-<k>" ids, a well-formed answer per id
  const bad = [], seen = new Set(), qs = (h && h.questions) || {}, ans = (h && h.answers) || {}
  for (const v of HAND_VIEWS) {
    const list = Array.isArray(qs[v]) ? qs[v] : []
    if (list.length < 8) bad.push(`${v}: ${list.length} questions (< 8)`)
    for (const q of list) {
      const id = String((q && q.id) ?? '')
      if (!new RegExp('^' + v + '-T[1-6]-\\d+$').test(id)) bad.push(`${v}: id "${id}" is not ${v}-T<n>-<k>`)
      if (seen.has(id)) bad.push('duplicate id ' + id)
      seen.add(id)
      if (!QKINDS.includes(q && q.kind)) bad.push(`${id}: kind ${q && q.kind}`)
      else if (!Object.prototype.hasOwnProperty.call(ans, id) || !answerOk(q.kind, ans[id], ans[id])) bad.push(`${id}: no well-formed ${q.kind} answer`)
    }
  }
  return bad
}
const writerPrompt = why => `Write ${HANDQ_TOOL}: a pure, deterministic Node script (no network; no clock or randomness: grep -E '${CLOCK_GREP}' must find nothing in it; stable sorted output) that reads ${REPO}/maps-site/data/filigree-*.json (names, heights, rivers, road), ${VIEWS_JSON} and the /fixtures/hand_test entry of ${SPEC_JSON}, and writes the file named by its --out <path> argument as {date: "${DATE}", frozen: true, views: ${J(HAND_VIEWS)}, questions: {<V>: [{id, q, kind}]}, answers: {<id>: value}}.
For each of ${HAND_VIEWS.join(', ')} write at least 8 questions, from these fixed templates only:
- T1: the names of the two highest named heights visible outside the mask (kind "names": answered as names only, no heights).
- T2: the named ridge or peak nearest the covered area.
- T3: the 8-point bearing from named peak A to named peak B.
- T4: the named heights passed on the right when walking the rust road toward the cover.
- T5: the 8-point side of the cover the river runs on.
- T6 (valley views): a named homestead within one ridge of the cover.
Question ids are unique across ALL views: "<V>-T<n>-<k>" (view, template number, a 1-based counter within that view and template), for example V2-T1-1, V2-T1-2, V3-T1-1. "answers" holds exactly one entry per question id, keyed by that id.
kind is one of ${QKINDS.join(' | ')}; bearings and sides are one of N NE E SE S SW W NW; heights are integers; "names" answers are non-empty arrays; "name" answers are non-empty strings. Every question must be answerable from the map outside the mask (${MASK_RULE}); never ask for the covered town's name.
Run the tool twice with --out ${HANDQ_STAGE} and compare the sha256sum of that file after each run: deterministic = true only when both runs match. Never write ${HANDQ} itself (the script moves the staged file there after validating it). No hand-test screenshot exists yet; do not look for any.${why.length ? `
A previous attempt was rejected for: ${J(why.slice(0, 12))}. Fix the tool so none of these recur.` : ''}
Return {path (${HANDQ_STAGE}), sha256, parsed, deterministic, questions, answers} with questions and answers exactly as written.
${READBACK}`
async function questions() {   // frozen: written once (before any hand-test screenshot), read thereafter; only a validated set is ever frozen
  if (HQ) return null
  if (!pre.handq.present && !hqWritten) {
    let why = []
    for (let k = 1; k <= 2; k++) {
      const r = await crit(P(writerPrompt(why)), {label: 'question writer' + (k > 1 ? ' (redo)' : ''), phase: 'Hand test', schema: HQS, ...M('deep')})
      if (!r) return 'question writer'
      why = !FILE_OK(r) || r.deterministic !== true ? ['read-back or determinism failed'] : hqProblems(r)
      if (why.length) { log(`question writer attempt ${k}: invalid set: ${why.slice(0, 6).join('; ')}`); continue }
      const mv = await crit(P(`Mechanical publish, no judging. If ${HANDQ} already exists, change nothing and return its read-back. Otherwise move ${HANDQ_STAGE} to ${HANDQ} (mv) and return the read-back of ${HANDQ}. Write nothing else.
${READBACK}`), {label: 'question publish', phase: 'Hand test', schema: FILEREC, ...M('mech')})
      if (!FILE_OK(mv) || mv.sha256 !== r.sha256) return mv ? 'question publish (the frozen file differs from the validated set)' : 'question publish'
      HQ = r; hqWritten = true
      return null
    }
    return 'question writer (invalid set: ' + why.slice(0, 4).join('; ') + ')'
  }
  const r = await crit(P(`Mechanical reader, no judging; write nothing. Read the frozen hand-test questions ${HANDQ} and return {path, sha256 (sha256sum of the file), parsed (it parses), deterministic: true, questions (its "questions" object verbatim), answers (its "answers" object verbatim)}.`),
    {label: 'question reader', phase: 'Hand test', schema: HQS, ...M('mech')})
  if (!FILE_OK(r) || (pre.handq.sha && r.sha256 !== pre.handq.sha)) return r ? 'question reader (the frozen questions changed since preflight)' : 'question reader'
  const why = hqProblems(r)
  if (why.length) return `question reader (invalid frozen set: ${why.slice(0, 4).join('; ')}; delete ${OUT}/gates/3-handtest-questions.json by hand to re-freeze)`
  HQ = r
  return null
}
const handCapPrompt = (views, k, dir) => `Hand-test capture. ${SANDBOX}
Run from ${REPO}: node tools/filigree-capture.js --views '${VIEWS_JSON}' --only ${views.join(',')} --modes dense --mask auto --mask-scale ${k} --metrics labels --port ${PORT} --out '${dir}/' (add --cdn-dir <tmp> when the CDNs are unreachable).
The mask is ${MASK_RULE}.
Then read ${dir}/metrics.json and return: pngs = {<view>: absolute path of its dense screenshot}; outside = {<view>: views.<view>.dense.visible_landform_labels_outside_mask}; infra_error ("" when the capture ran);
heights_outside = {<view>: the number of entries of that outside list that are a height numeral (R20: a bare integer) or carry one ("<name> <integer>")}. When the list holds names only, count instead the names in it whose own label in views.<view>.dense.labels has a bare-integer label within 40 px of it (same x, y units). Never use views.<view>.dense.heights: it also counts the heights hidden under the mask.`
const NAV_RULE = `Never run git. Run no commands and open only the one image this prompt names. Write nothing. Return only the requested JSON.`   // R059: navigators get no commands at all, stricter than the blind NOGIT_RULE
const navPrompt = (v, png) => `You see ONLY this image: ${absP(png)}. Open no other file and do not use the web. Answer each question by reading the map.
Questions (answer every id; bearings and sides as one of N NE E SE S SW W NW; heights as bare integers; "names" answers as an array of names): ${J((HQ.questions[v] || []).map(q => ({id: q.id, q: q.q, kind: q.kind})))}
List every landform name you can read, with its height if printed (else ""), as legible.
If you can tell which town is covered, name it in covered_town_guess (else "").
List every file you opened (absolute paths) in files_read.
Return {answers: [{id, value}], legible: [{name, height}], covered_town_guess, files_read}.`
async function navigate(views, shot, tag) {
  const live = views.filter(v => shot[v].png)
  const res = await pipeline(live, (v, _, vi) => parallel(['A', 'B'].map(X => () => agent(NAV_RULE + '\n' + navPrompt(v, shot[v].png),
    {label: `${v} · navigator ${X}${tag}`, phase: 'Hand test', schema: NAV, ...M(X === 'A' ? 'deep' : 'judge')}))))
  const out = {}
  for (const v of views) out[v] = {A: null, B: null}
  live.forEach((v, i) => { const pr = res[i]; out[v] = {A: (pr && pr[0]) || null, B: (pr && pr[1]) || null} })
  return out
}
function scoreNav(v, nav, sh) {
  const qs = HQ.questions[v] || []
  if (!nav) return {acc: 0, recall: 0, blind: [], leak: false, wrong: qs.map(q => q.id), dead: true}
  const got = new Map(nav.answers.map(a => [a.id, a.value]))
  const wrong = qs.filter(q => !answerOk(q.kind, got.get(q.id), HQ.answers[q.id])).map(q => q.id)
  const outside = [...new Set(sh.outside.map(norm))].filter(Boolean), leg = new Set(nav.legible.map(l => norm(l.name)))
  return {acc: qs.length ? (qs.length - wrong.length) / qs.length : 0, recall: outside.length ? outside.filter(x => leg.has(x)).length / outside.length : 0,
    blind: blindBad(nav.files_read, [absP(sh.png)]), leak: !!MASKED[v] && townLeak(nav.covered_town_guess, MASKED[v]), wrong, dead: false}
}
const scorePair = (v, pr, sh) => ({A: scoreNav(v, pr.A, sh), B: scoreNav(v, pr.B, sh)})
const shotOf = (c, v, k) => ({png: c.pngs[v] || '', outside: c.outside[v] || [], heights: Math.min(c.heights_outside[v] ?? 0, (c.outside[v] || []).length), k})   // each counted height sits on an outside entry
async function handTest(tag) {
  phase('Hand test')
  const dq = await questions()
  if (dq) return {pass: false, died: dq, leakViews: [], summary: 'agent died: ' + dq, dirs: []}
  const views = cap(HAND_VIEWS)
  const short = HAND_VIEWS.filter(v => (HQ.questions[v] || []).length < 8)
  const dir1 = `${OUTABS}/shots/hand-${DATE}${shotSfx(tag)}`, dir2 = dir1 + '-k15'
  const c1 = await agent(P(handCapPrompt(views, 1, dir1)), {label: 'hand capture' + tag, phase: 'Hand test', schema: HCAP, ...M('audit')})
  if (!c1) return {pass: false, died: 'hand capture' + tag, leakViews: [], summary: 'agent died: hand capture' + tag, dirs: [dir1]}
  if (c1.infra_error.trim()) return {pass: false, infra: c1.infra_error.trim(), leakViews: [], summary: 'infra: ' + c1.infra_error.trim(), dirs: [dir1]}
  const shot = {}
  for (const v of views) shot[v] = shotOf(c1, v, 1)
  const per = {}
  const navs = await navigate(views, shot, tag)
  for (const v of views) per[v] = scorePair(v, navs[v], shot[v])
  const leaking = views.filter(v => per[v].A.leak || per[v].B.leak)
  const dirs = [dir1]
  if (leaking.length) {
    log('mask leak on ' + leaking.join(', ') + ': re-capturing once at mask scale 1.5')
    dirs.push(dir2)
    const c2 = await agent(P(handCapPrompt(leaking, 1.5, dir2)), {label: 'hand capture (k1.5)' + tag, phase: 'Hand test', schema: HCAP, ...M('audit')})
    if (!c2) return {pass: false, died: 'hand capture (k1.5)' + tag, leakViews: [], summary: 'agent died: hand capture (k1.5)' + tag, dirs}
    if (c2.infra_error.trim()) return {pass: false, infra: c2.infra_error.trim(), leakViews: [], summary: 'infra: ' + c2.infra_error.trim(), dirs}
    for (const v of leaking) shot[v] = shotOf(c2, v, 1.5)
    const navs2 = await navigate(leaking, shot, ' (k1.5)' + tag)
    for (const v of leaking) per[v] = scorePair(v, navs2[v], shot[v])
  }
  const leakViews = views.filter(v => per[v].A.leak || per[v].B.leak)
  const navOk = s => s.acc >= 0.8 && s.recall >= 0.7 && !s.blind.length && !s.leak
  const failing = views.filter(v => !(navOk(per[v].A) && navOk(per[v].B) && shot[v].heights >= 6))
  const sum = s => ({acc_pct: pct(s.acc), recall_pct: pct(s.recall), wrong: s.wrong, blind: s.blind, leak: s.leak, dead: s.dead})
  const summary = {questions: Object.fromEntries(HAND_VIEWS.map(v => [v, (HQ.questions[v] || []).length])), short_of_8: short,
    views: Object.fromEntries(views.map(v => [v, {mask_scale: shot[v].k, png: shot[v].png, heights_outside: shot[v].heights, A: sum(per[v].A), B: sum(per[v].B)}])),
    failing, recaptured: leaking, leak: leakViews}
  return {pass: !failing.length && !short.length, leakViews, summary, dirs}
}

const REQ_CHECKS = {A: ['A.rivers_overlap', 'A.imhof_F01', 'A.coast_edge_V4'], B: ['B.one_shield', 'B.names_for_owner', 'B.gazetteer_prov']}   // Job 2 must emit these ids; G3.A4/G3.B5 fail without them
function sliceCriteria(sl, g) {
  const {sm, gc, sc, dt, hand} = g
  const dead = l => 'agent died: ' + l
  const units = sls => { const m = sls.flatMap(s => unitIdsOf(s)).filter(id => !doneNow.has(id)); return [m.length ? {not_done: m} : 'all done', !m.length] }
  const det = () => {
    if (!dt) return [dead('determinism + syntax'), false]
    const uneq = dt.generators.filter(x => !x.equal).map(x => x.cmd)
    const short = MODE !== 'smoke' && dt.generators.length < pre.generators.length
    return [{unequal: uneq, generators_run: dt.generators.length, generators_spec: pre.generators.length, random_hits: dt.random_hits, syntax_ok: dt.syntax_ok},
      !uneq.length && !short && dt.random_hits === 0 && dt.syntax_ok === true]
  }
  const cellOK = (F, classes) => {
    const gf = pre.ground[F]
    if (!gf) return false
    if (gf.exempt) return true
    const dense = ((gc.cells || {})[F] || {}).dense || {}
    return classes.filter(c => gf.six.includes(c)).every(c => (Number(dense[c]) || 0) >= ((gf.min || {})[c] ?? 1))
  }
  const cells = (classes, fx) => {
    if (!gc) return [dead('gate capture'), false]
    const bad = fx.filter(F => !cellOK(F, classes))
    return [{ok: fx.length - bad.length, of: fx.length, failing: bad, classes}, !bad.length && !gc.infra_error.trim()]
  }
  const spec = sls => {
    const empty = (sls === 'D' ? SLICES : [sls]).filter(s => !(pre.checks[s] || []).length)
    if (empty.length) return [{spec_gap: 'no /checks for slice ' + empty.join(', ') + ' in sheet-spec.json (a Job 2 defect; no fix unit can add them)'}, false]
    const missingReq = (sls === 'D' ? SLICES : [sls]).flatMap(s => (REQ_CHECKS[s] || []).filter(id => !(pre.checks[s] || []).some(c => c.id === id)).map(id => s + ':' + id))
    if (missingReq.length) return [{spec_gap: 'required checks missing from sheet-spec.json /checks: ' + missingReq.join(', ') + ' (a Job 2 defect; no fix unit can add them)'}, false]
    if (!sc) return [dead('spec checks'), false]
    const want = checksFor(sls).map(c => c.id)
    const got = new Map(sc.results.map(r => [r.id, r]))
    const bad = want.filter(id => (got.get(id) || {}).ok !== true)
    return [{ok: want.length - bad.length, of: want.length, failing: bad.map(id => id + ' = ' + ((got.get(id) || {}).value ?? 'missing'))}, !bad.length]
  }
  const off = () => {
    if (!gc) return [dead('gate capture'), false]
    const nonzero = Object.entries(gc.filigree_counts_when_off).filter(([, n]) => Number(n) !== 0).map(([k, n]) => k + '=' + n)
    const a = [...new Set(gc.panes_when_off)].sort(), b = [...new Set(pre.pre_filigree_panes)].sort()
    const same = a.length === b.length && a.every((x, i) => x === b[i])
    return [{nonzero_counts: nonzero, panes_when_off: a, pre_filigree_panes: b}, !nonzero.length && same]
  }
  const PANE_OVER = ['muster_days', 'shut_ways', 'notices']
  const panes = () => {
    if (!gc) return [dead('gate capture'), false]
    const ids = pre.paint_order_ids || [], seq = gc.panes || []
    if (!ids.length) return [{spec_gap: '/paint_order missing from sheet-spec.json (a Job 2 defect)'}, false]
    const rank = new Map(ids.map((x, i) => [x, i]))
    const paint = seq.filter(x => rank.has(x)), idx = x => seq.indexOf(x)
    const bad = []
    for (let i = 1; i < paint.length; i++) if (rank.get(paint[i]) < rank.get(paint[i - 1])) bad.push(paint[i - 1] + ' above ' + paint[i])
    const lastPaint = Math.max(-1, ...paint.map(idx)), firstPaint = paint.length ? Math.min(...paint.map(idx)) : Infinity
    if (idx('old_survey') >= 0 && idx('old_survey') > firstPaint) bad.push('old_survey not under the live sheet')
    for (const o of PANE_OVER) if (idx(o) >= 0 && idx(o) < lastPaint) bad.push(o + ' under the live sheet')
    return [{panes: seq, paint_order: ids, violations: bad}, paint.length > 0 && !bad.length]
  }
  const smokeC = () => [{smoke: sm ? {console_errors: sm.console_errors.slice(0, 10), infra_error: sm.infra_error, block_random_hits: sm.block_random_hits} : dead('smoke'),
    capture: gc ? {console_errors: gc.console_errors.slice(0, 10), infra_error: gc.infra_error} : dead('gate capture')},
  !!sm && !!gc && !sm.console_errors.length && !sm.infra_error.trim() && !gc.console_errors.length && !gc.infra_error.trim()]
  const city = () => {
    if (!gc) return [dead('gate capture'), false]
    const c = gc.city || {}
    return [{...c, label_cap: pre.label_cap}, c.pins_at_rest === 0 && c.block_labels === 0 && c.street_names_below === 0 && c.street_names_above > 0 && typeof c.label_count === 'number' && c.label_count <= pre.label_cap]
  }
  const fog = () => { if (!gc) return [dead('gate capture'), false]; const f = gc.fog || {}; return [f, f.opacity > 0 && f.same_day_equal === true && f.diff_day_differs === true] }
  const edge = () => {
    if (!gc) return [dead('gate capture'), false]
    const e = (gc.edges || {}).V6 || {}
    return [{...e, edge_delta: pre.edge_delta}, typeof e.band_mean === 'number' && typeof e.interior_mean === 'number' && e.band_mean <= e.interior_mean - pre.edge_delta]
  }
  const stack = () => {
    if (!gc) return [dead('gate capture'), false]
    const t = Object.entries(gc.tiles || {}), s = gc.stack || {}
    return [{tiles: Object.fromEntries(t.map(([k, v]) => [k, v.base_requests])), ...s},
      t.length > 0 && t.every(([, v]) => v.base_requests === 0) && s.node_identity_kept === true && s.reload === false && s.roundtrip_equal === true && s.moveend_keeps_params === true]
  }
  const six = () => {
    if (!gc) return [dead('gate capture'), false]
    const per = FIXTURES.map(F => {
      const gf = pre.ground[F]
      if (!gf) return [F, 0]
      if (gf.exempt) return [F, 6]
      const dense = ((gc.cells || {})[F] || {}).dense || {}
      return [F, gf.six.filter(c => Number(dense[c]) > 0).length]
    })
    const full = per.filter(([, n]) => n >= 6).length, low = per.filter(([, n]) => n < 4).map(([F]) => F)
    return [{per_cell: Object.fromEntries(per), full_6of6: full, below_4: low}, full >= 10 && !low.length]
  }
  const appear = () => {
    if (!gc) return [dead('gate capture'), false]
    const a = gc.appear || {}
    return [a, Array.isArray(a.violations) && !a.violations.length && Array.isArray(a.below_minzoom_visible) && !a.below_minzoom_visible.length]
  }
  const sheets = () => {
    if (!gc) return [dead('gate capture'), false]
    const per = {}, bad = [], dense = v => ((((gc.views || {})[v] || {}).dense || {}).counts) || null
    for (const v of SHEET_VIEWS) {
      const sheet = pre.view_sheets[v] || VIEW_SHEET[v], rules = pre.sheet_rules[sheet], n = dense(v)
      if (!rules || !n) { per[v] = {sheet, missing: !rules ? '/sheets/' + sheet : 'dense counts'}; bad.push(v); continue }
      const drawn = rules.forbidden.filter(c => (Number(n[c]) || 0) > 0).map(c => c + '=' + n[c]), absent = rules.must.filter(c => !(Number(n[c]) > 0))
      per[v] = {sheet, forbidden_drawn: drawn, must_absent: absent}
      if (drawn.length || absent.length) bad.push(v)
    }
    const v1 = dense('V1') || {}, sc0 = pre.shield_class
    const homes = pre.homestead_classes.filter(c => (Number(v1[c]) || 0) > 0).map(c => c + '=' + v1[c])
    const shield = {class: sc0, on_v1: sc0 ? Number(v1[sc0]) || 0 : null, near_river_town: (gc.shield || {}).near_river_town ?? null, river_town: pre.river_town.name}
    const shieldOk = !!sc0 && shield.on_v1 === 1 && shield.near_river_town === 1
    return [{per_view: per, failing: bad, v1_homesteads_drawn: homes, v1_shield: shield}, !bad.length && !homes.length && shieldOk]
  }
  const handC = () => hand ? [hand.summary, hand.pass === true] : ['not run', false]
  const leakC = () => C('GH.leak', 'hand-test mask holds (no navigator names the covered town after one re-capture at mask scale 1.5)',
    hand ? (hand.died ? 'agent died: ' + hand.died : hand.infra ? 'infra: ' + hand.infra : {leak: hand.leakViews, recaptured: hand.summary.recaptured}) : 'not run', 'no leak',
    !!hand && !hand.died && !hand.infra && !hand.leakViews.length)
  const SC = s => pre.slice_classes[s] || []
  const G = (n, desc, thr, mo) => C(`G3.${sl}${n}`, desc, mo[0], thr, mo[1])
  const both = (x, y) => [{a: x[0], b: y[0]}, x[1] && y[1]]
  if (sl === 'A') return [
    G(1, 'every slice-A unit done, its acceptance all ok', 'all', units(['A'])),
    G(2, 'determinism + syntax', 'generators equal, random_hits = 0, syntax_ok', det()),
    G(3, 'ground on fixtures F01-F11: cellOK(F, slice_classes.A)', '11/11', cells(SC('A'), FX11)),
    G(4, 'spec checks A (rivers.json print overlap, Imhof NW-lit > SE-shaded on F01, pooled coast edge on V4)', 'all ok', spec('A')),
    G(5, 'toggle off: zero filigree features and the pre-filigree pane set', 'true', off()),
    G(6, 'smoke + capture: 0 console errors, no infra error', 'true', smokeC()),
    G(7, 'pane z-order is a subsequence of the paint order (old survey under, notices on top)', 'true', panes())]
  if (sl === 'B') return [
    G(1, 'every slice-B unit done, its acceptance all ok', 'all', units(['B'])),
    G(2, 'determinism + syntax', 'generators equal, random_hits = 0, syntax_ok', det()),
    G(3, 'ink on fixtures F01-F11: cellOK(F, slice_classes.B)', '11/11', cells(SC('B'), FX11)),
    G(4, 'hand test (V2-V4: each navigator >= 80%, recall >= 70%, >= 6 heights outside the mask, no leak, blind clean)', 'pass', handC()),
    G(5, 'spec checks B (one shield, at Aldorūs; names-for-owner.md lists every invented name; gazetteer regenerated with prov)', 'all ok', spec('B')),
    G(6, 'toggle off: zero filigree features and the pre-filigree pane set', 'true', off()),
    G(7, 'smoke + capture: 0 console errors, no infra error', 'true', smokeC()),
    G(8, 'pane z-order is a subsequence of the paint order (names above relief, old survey under, notices on top)', 'true', panes()),
    leakC()]
  if (sl === 'C') return [
    G(1, 'every slice-C unit done, its acceptance all ok', 'all', units(['C'])),
    G(2, 'determinism + syntax', 'generators equal, random_hits = 0, syntax_ok', det()),
    G(3, 'city at rest (V6): 0 pins, 0 block labels, street names only above the threshold, labels <= cap', 'all', city()),
    G(4, 'fog as weather: opacity > 0, same day equal, different day differs', 'all', fog()),
    G(5, 'pooled edge V6: band_mean <= interior_mean - edge_delta', 'true', edge()),
    G(6, 'spec checks C', 'all ok', spec('C')),
    G(7, 'toggle off: zero filigree features and the pre-filigree pane set', 'true', off()),
    G(8, 'smoke + capture: 0 console errors, no infra error', 'true', smokeC()),
    G(9, 'pane z-order is a subsequence of the paint order (names above relief, fog above names, old survey under, notices on top)', 'true', panes())]
  const cityAll = [city(), fog(), edge()]
  return [
    G(1, 'every unit of every slice done', 'all', units(SLICES)),
    G(2, 'G3.A3, G3.B3, G3.C3-C5 re-measured', 'all', [{A3: cells(SC('A'), FX11)[0], B3: cells(SC('B'), FX11)[0], C3: cityAll[0][0], C4: cityAll[1][0], C5: cityAll[2][0]},
      cells(SC('A'), FX11)[1] && cells(SC('B'), FX11)[1] && cityAll.every(x => x[1])]),
    G(3, 'stack: every overlay toggle base_requests = 0; node identity kept; no reload; hash round-trip; moveend keeps params', 'all', stack()),
    G(4, 'six-check on all 12 fixtures (exempt cells count 6/6)', '>= 10/12 cells 6/6 and none < 4', six()),
    G(5, 'hand test re-run with the frozen questions', 'pass', handC()),
    G(6, 'appear: no violations, nothing visible below its minZoom', 'true', appear()),
    G(7, 'all spec checks (every slice)', 'all ok', spec('D')),
    G(8, 'determinism + syntax', 'generators equal, random_hits = 0, syntax_ok', det()),
    G(9, 'toggle off + smoke', 'all', both(off(), smokeC())),
    G(10, 'sheet rules on V1-V6 (dense): no /sheets/<sheet>/forbidden class drawn, every /sheets/<sheet>/must class drawn; V1 (country): exactly one shield, at the river town, and zero homestead-class features', 'all views', sheets()),
    G(11, 'pane z-order is a subsequence of the paint order (contours before names, fog last, old survey under, notices on top)', 'true', panes()),
    leakC()]
}

async function gateCycle(tag) {
  const sm = await runSmoke(tag)
  phase('Slice gate')
  const ps = gatePrompts(SL, tag)
  const gateAgent = i => agent(P(ps[i]), {label: GATE_LABELS[i] + tag, phase: 'Slice gate', schema: GATE_SCHEMAS[i], ...M(GATE_ROLES[i])})
  const dt0 = await gateAgent(2)   // generators rewrite the repo data files the capture and the spec checks read: they run alone, first
  const pair = await parallel([0, 1].map(i => () => gateAgent(i)))
  const triple = [pair[0] || null, pair[1] || null, dt0 || null]
  const [gc, sc, dt] = triple   // positional; a null report fails every criterion that needs it
  const hand = handSlice ? await handTest(tag) : null
  const criteria = sliceCriteria(SL, {sm, gc, sc, dt, hand})
  const died = [sm ? null : 'smoke' + tag].concat(triple.map((x, i) => x ? null : GATE_LABELS[i] + tag), [hand && hand.died ? hand.died : null]).filter(Boolean)
  const infra = [sm && sm.infra_error.trim(), gc && gc.infra_error.trim(), hand && hand.infra].filter(Boolean)
  const leak = !!hand && hand.leakViews.length > 0
  const dirs = [`${OUT}/shots/run-${DATE}${shotSfx(tag)}/`, `${OUT}/shots/gate-${SL}-${DATE}${shotSfx(tag)}/`].concat(hand ? hand.dirs.map(d => d.replace(OUTABS, OUT) + '/') : [])
  return {tag, sm, gc, sc, dt, hand, criteria, scoredPass: criteria.every(c => c.pass), died, infra, leak, dirs,
    metrics: [`${OUTABS}/shots/gate-${SL}-${DATE}${shotSfx(tag)}/metrics.json`].concat(hand ? hand.dirs.map(d => d + '/metrics.json') : [])}
}

const sliceComplete = () => unitIdsOf(SL).every(id => doneNow.has(id))
let cyc = null, smokeOnly = null, rounds = 0, diagDied = null
const gaps = [], shotDirs = []
if (GATE !== 'skip' && (GATE === 'only' || sliceComplete())) cyc = await gateCycle('')
else {
  log(GATE === 'skip' ? 'gate "skip": slice gate not run' : `slice ${SL} gate not due: ${unitIdsOf(SL).filter(id => !doneNow.has(id)).join(', ')} not done`)
  if (batch.length) smokeOnly = await runSmoke('')
}
if (cyc) shotDirs.push(...cyc.dirs)
if (smokeOnly) shotDirs.push(`${OUT}/shots/run-${DATE}/`)

// ---- Fix units ----
const specGapC = c => !!c.measured && typeof c.measured === 'object' && typeof c.measured.spec_gap === 'string'
const unitsC = c => /^G3\.[ABCD]1$/.test(c.id)   // 'units done' is not a map defect
const mapFail = c => !!c && !c.infra.length && !c.leak && !c.died.length && c.criteria.some(x => !x.pass && !specGapC(x) && !unitsC(x))
while (cyc && rounds < ROUNDS && mapFail(cyc)) {
  if (budgetLeft() < ROUND_TOKENS) { log(`budget: ${budgetLeft()} tokens left < ${ROUND_TOKENS}; fix round skipped; the gate fails on its own criteria`); break }
  rounds++
  const tag = ' r' + rounds
  phase('Fix units')
  const failed = cyc.criteria.filter(c => !c.pass && !specGapC(c) && !unitsC(c))
  const failedIdsC = failed.map(c => c.id)
  const before = new Set(seenFix)
  const usedHere = [...before].filter(k => k.startsWith(SL + '|')).map(k => k.slice(2))
  const existingIds = [...new Set([...ALL_BY_ID.keys()].concat(pre.ledger.entries.map(e => e.id)))].filter(id => /^fix-/.test(id))
  const snap = await crit(P(`Mechanical ledger snapshot, no judging. Run rm -rf ${FIX_STAGE} ${LEDGER_SNAP}, then mkdir -p ${FIX_STAGE} ${LEDGER_SNAP}, then copy every *.json directly in ${LEDGER_DIR} (top level only) into ${LEDGER_SNAP}/ with cp -p. Write nothing else.
Return {files: [{path (the ORIGINAL path under ${LEDGER_DIR}), sha256 (sha256sum of that original)}]} for every *.json directly in ${LEDGER_DIR}.`), {label: 'ledger snapshot' + tag, phase: 'Fix units', schema: SNAPS, ...M('mech')})
  if (!snap) { diagDied = 'ledger snapshot' + tag; break }
  const base = p => String(p).split('/').pop()
  const snapSha = new Map(snap.files.filter(f => absP(f.path) === LEDGER_DIR + '/' + base(f.path) && /^[0-9a-f]{64}$/.test(f.sha256)).map(f => [base(f.path), f.sha256]))
  const snapGap = [...new Set(pre.ledger.entries.map(e => e.id).concat(Object.values(results).filter(r => r.recorded).map(r => r.id)))].map(id => id + '.json').filter(n => !snapSha.has(n))
  if (snapGap.length) { log('ledger snapshot incomplete (' + snapGap.join(', ') + '): no diagnoser runs without a full snapshot'); gaps.push('fix round' + tag + ' skipped: the ledger snapshot missed ' + snapGap.join(', ')); break }
  const dg = await crit(P(`You are the build diagnoser for slice ${SL} (${SLICE_NAME[SL]}), fix round ${rounds}. The slice gate failed on these criteria (scored in code):
${J2(failed)}
Metrics: ${J(cyc.metrics)}. Units: /units of ${SPEC_JSON} and ${OUTABS}/state/3-build/*.json. Rules: ${SPEC_MD}. Reuse map: ${REUSE}.
Diagnose map defects only (never the capture, the checks or the questions) and write NEW fix units, at most ${FIX_PER_ROUND}, each to ${FIX_STAGE}/<id>.json (2-space indent, trailing newline; that staging directory exists and the script moves accepted units into the ledger) with "status": "pending" and "date": "${DATE}":
- id: fix-${SL}${rounds}<n> with n = 1, 2, …, skipping any id that already exists: ${J(existingIds)}; never write anything under ${LEDGER_DIR} or any other file;
- the same unit fields as the sheet-spec units: id, title, slice "${SL}", kind (logic | tool | data | css | copy), files (repo-relative), paint_order (0..10), depends_on (ids that are already done or among your new units; no cycles), requires (roads | census | rivers), covers (spec rule ids), optional model / effort, and acceptance: [{kind: node | grep | json | capture, cmd, expect}], mechanical only (a command plus its expected output); capture only for units whose files include maps-site/index.html or index.html; a tool or data unit's acceptance never reads maps-site/index.html;
- failed_criterion: the id of the criterion it fixes, one of ${J(failedIdsC)}. Write no unit for these criteria, which already have a fix unit: ${J(usedHere)}.
${VOCAB_RULE}
Return {units: [every unit object you wrote], files: [{path, sha256, parsed} for each file]}; for each file you wrote:
${READBACK}`), {label: 'diagnoser' + tag, phase: 'Fix units', schema: DIAG, ...M('judge')})
  const guard = async names => {   // restore every snapshotted ledger file, drop strays, then move the accepted staged units in
    const listed = [...snapSha].map(([n, sha256]) => ({path: LEDGER_DIR + '/' + n, sha256}))
    const g = await crit(P(`Mechanical ledger guard, no judging; change nothing except as listed.
1. Restore: for each {path, sha256} in ${J(listed)}: if that file is missing or its sha256sum differs, copy ${LEDGER_SNAP}/<its file name> back over it (cp -p) and list the file name under "restored".
2. Strays: delete every *.json directly in ${LEDGER_DIR} whose path is not in that list (rm on exactly those files) and list their file names under "removed".
3. Promote: for each file name in ${J(names)}: copy ${FIX_STAGE}/<name> to ${LEDGER_DIR}/<name>, never over an existing file (skip the name when one exists).
4. ledger = [{path, sha256 (sha256sum now)}] for every path of step 1; promoted = [{path, sha256, parsed}] for each file copied in step 3 (re-read it; parsed: true only when it JSON.parses).
5. Only when every ledger sha256 equals its listed sha256: rm -rf ${FIX_STAGE} ${LEDGER_SNAP} and snapshot_kept = false; otherwise keep both directories and snapshot_kept = true.
Return {ledger, restored, removed, promoted, snapshot_kept}.`), {label: 'ledger guard' + tag, phase: 'Fix units', schema: GUARD, ...M('mech')})
    if (!g) return null
    const now = new Map(g.ledger.map(f => [base(f.path), f.sha256]))
    const ok = [...snapSha].every(([n, sha]) => now.get(n) === sha)
    if (g.restored.length) log('ledger guard restored ' + g.restored.join(', ') + ' (the diagnoser wrote over them)')
    if (g.removed.length) log('ledger guard removed stray ledger file(s) ' + g.removed.join(', '))
    if (!ok) gaps.push(`ledger guard${tag}: ${LEDGER_DIR} does not match its snapshot; restore it by hand from ${LEDGER_SNAP}`)
    return {ok, promoted: new Map(g.promoted.filter(FILE_OK).map(f => [base(f.path), f.sha256]))}
  }
  if (!dg) { if (!await guard([])) gaps.push(`ledger guard${tag} died: compare ${LEDGER_DIR} with ${LEDGER_SNAP} by hand`); diagDied = 'diagnoser' + tag; break }
  const inStage = f => absP(f.path) === FIX_STAGE + '/' + base(f.path)
  const stray = dg.files.filter(f => !inStage(f)).map(f => String(f.path))
  if (stray.length) log('diagnoser wrote outside ' + FIX_STAGE + ': ' + stray.join(', ') + ' (the ledger guard restores or removes them)')
  const okFile = new Map(dg.files.filter(f => inStage(f) && FILE_OK(f)).map(f => [base(f.path), f]))
  const idRe = new RegExp('^fix-' + SL + rounds + '\\d+$')
  const fresh = []
  for (const x of dg.units.map(unitOf)) {
    const hasFile = okFile.has(x.id + '.json')
    const why = !idRe.test(x.id) ? 'id outside fix-' + SL + rounds + '<n>' : existingIds.includes(x.id) || snapSha.has(x.id + '.json') || fresh.some(y => y.id === x.id) ? 'id already exists' : x.slice !== SL ? 'slice ' + x.slice
      : !hasFile ? 'no read-back of its staged file' : !failedIdsC.includes(x.failed_criterion) ? 'failed_criterion ' + x.failed_criterion + ' is not failing'
        : before.has(SL + '|' + x.failed_criterion) ? 'duplicate of an existing fix unit for ' + x.failed_criterion : x.acceptance.length ? '' : 'no acceptance'
    if (why) { log(`fix unit ${x.id} dropped (never promoted): ${why}`); continue }
    fresh.push(x)
  }
  const cyc2 = kahn(fresh)
  if (cyc2.cyclic.length) { log('diagnoser units form a cycle: ' + cyc2.cyclic.join(', ') + '; all dropped (never promoted)'); fresh.length = 0 }
  if (fresh.length > FIX_PER_ROUND) {
    const ord = kahn(fresh).order, keep = ord.slice(0, FIX_PER_ROUND)
    for (const x of ord.slice(FIX_PER_ROUND)) log(`fix unit ${x.id} dropped (never promoted): over per-round cap`)
    fresh.length = 0; fresh.push(...keep)
  }
  const gd = await guard(fresh.map(x => x.id + '.json'))
  if (!gd) { diagDied = 'ledger guard' + tag; gaps.push(`ledger guard${tag} died: compare ${LEDGER_DIR} with ${LEDGER_SNAP} by hand; staged fix units are not promoted`); break }
  const landed = fresh.filter(x => gd.promoted.get(x.id + '.json') === okFile.get(x.id + '.json').sha256)
  for (const x of fresh.filter(x => !landed.includes(x))) { log(`fix unit ${x.id} not promoted (its ledger copy differs from the staged read-back)`); gaps.push(`fix unit ${x.id} not promoted into ${LEDGER_DIR}; check ${LEDGER_DIR}/${x.id}.json by hand`) }
  fresh.length = 0; fresh.push(...landed)
  for (const x of fresh) { seenFix.add(SL + '|' + x.failed_criterion); ALL_BY_ID.set(x.id, x); newFixIds.push(x.id) }
  for (const id of failedIdsC.filter(id => before.has(SL + '|' + id))) gaps.push(`${id} still fails after its fix unit; no new fix unit (dedup ${SL}|${id})`)
  if (!gd.ok) { log('ledger guard: the ledger does not match its snapshot; no fix unit is built this round'); break }
  if (!fresh.length) { log('no new fix unit this round'); break }
  if (GATE === 'only') { log('gate "only": fix units ' + fresh.map(x => x.id).join(', ') + ' are written as pending for the next run'); break }
  const fixPool = closeOver(kahn(fresh).order, id => doneNow.has(id), deferred)
  const fixBatch = cap(kahn(fixPool).order).slice(0, FIX_PER_ROUND)
  if (!fixBatch.length) { log('no fix unit is ready this round'); break }
  phase('Build')
  await runBatch(fixBatch)
  if (!fixBatch.every(u => doneNow.has(u.id)) || !sliceComplete()) { log('fix units incomplete: the slice gate is not re-run'); break }
  cyc = await gateCycle(tag)
  shotDirs.push(...cyc.dirs)
}

// ---- Record ----
phase('Record')
const prune = await agent(P(`Prune old capture directories under ${OUTABS}/shots/ (git-ignored bulk). List the directories directly under it whose names match run-*, gate-*-* or hand-*; each name carries a date YYYY-MM-DD. Keep every directory whose date is one of the two newest dates present (this run is ${DATE}); delete the others (rm -rf on exactly those directories, nothing else). Then list again: count_ok = the remaining directories carry at most two distinct dates and none of the deleted ones exists. Return {kept: [names], removed: [names], count_ok}.`),
  {label: 'shots pruner', phase: 'Record', schema: PRUNE, ...M('mech')})
if (!prune || !prune.count_ok) { log('shots pruner: ' + (prune ? 'count check failed' : 'agent died')); gaps.push('shots/ not pruned to the last two runs') }
const stuckNew = Object.values(results).filter(r => r.runs_failed >= 3 && ((LEDGER.get(r.id) || {}).runs_failed || 0) < 3).map(r => ({id: r.id, title: r.title, last_failure: r.last_failure}))
const stuckNow = [...new Map(stuck.concat(stuckNew).map(x => [x.id, x])).values()]
const perSlice = Object.fromEntries(SLICES.map(s => { const ids = unitIdsOf(s); return [s, {done: ids.filter(id => doneNow.has(id)).length, total: ids.length}] }))
const nDone = perSlice[SL].done, nTotal = perSlice[SL].total
const runState = {job: JOB, date: DATE, mode: MODE, slice: SL, per_slice: perSlice, built: builtOk.map(u => u.id), failed: failedIds, deferred, stuck: stuckNow.map(x => x.id), infra: infraIds,
  new_fix_units: newFixIds, rounds, gate_ran: !!cyc, smoke: smokeOnly ? {console_errors: smokeOnly.console_errors.length, block_random_hits: smokeOnly.block_random_hits, infra_error: smokeOnly.infra_error} : null, gaps}
let gate = null, finalGate = null
if (cyc) {
  for (const c of cyc.criteria.filter(c => !c.pass)) gaps.push(specGapC(c) ? `${c.id}: ${c.measured.spec_gap}` : `${c.id} failed`)
  const artifacts = [{path: OUT + '/sheet-spec.json', sha256: pre.spec_sha256 || ''}].concat(
    HQ && handSlice ? [{path: OUT + '/gates/3-handtest-questions.json', sha256: HQ.sha256}] : [],
    cyc.gc ? [{path: `${OUT}/shots/gate-${SL}-${DATE}${shotSfx(cyc.tag)}/metrics.json`, sha256: cyc.gc.metrics_sha256 || ''}] : [])
  gate = gateObj({criteria: cyc.criteria, rounds, artifacts, rulings_used: RUSED, gaps, slice: SL})
  if (SL === 'D' && gate.pass) finalGate = gateObj({criteria: cyc.criteria, rounds, artifacts, rulings_used: RUSED, gaps, slice: 'D', final: true})
}
const recs = await parallel([() => record('state/3-build.json', runState)].concat(
  gate ? [() => record(`gates/3-build-${SL}.json`, gate)] : [],
  finalGate ? [() => record('gates/3-build.json', finalGate)] : []))
const recMismatch = recs.some(x => !x)

const finalPass = !!finalGate && !recMismatch
const unitInfra = infraIds.length > 0 || (smokeOnly && smokeOnly.infra_error.trim())
const diedAll = (cyc ? cyc.died : []).concat(diagDied ? [diagDied] : [], !cyc && batch.length && !smokeOnly ? ['smoke'] : [])
const smokeBad = !!smokeOnly && (smokeOnly.console_errors.length > 0 || Number(smokeOnly.block_random_hits) > 0)
const reason = (unitInfra || (cyc && cyc.infra.length)) ? 'infra'
  : diedAll.length ? 'agent died: ' + diedAll[0]
    : cyc && cyc.leak ? 'mask-leak'
      : recMismatch ? 'record-mismatch'
        : cyc && !cyc.scoredPass ? 'gate-fail'
          : smokeBad ? 'smoke-fail'
          : failedIds.length || stuckNow.length ? 'units-failed'
            : MODE === 'full' ? '' : MODE
const gateStatus = !cyc ? (GATE === 'skip' ? 'skipped' : 'not due') : cyc.infra.length ? 'infra' : cyc.scoredPass ? (gate.pass ? 'pass' : 'pass (scored; ' + (FORCE ? 'forced' : MODE) + ')')
  : 'fail (' + cyc.criteria.filter(c => !c.pass).map(c => c.id).join(', ') + ')'
const builtIds = builtOk.map(u => u.id).join(', ') || 'none built'
const titles = builtOk.map(u => u.title || u.id).join('; ') || 'slice gate run'
const outputs = [...changedFiles].sort().concat([OUT + '/state/3-build/', OUT + '/state/3-build.json'], gate ? [OUT + `/gates/3-build-${SL}.json`] : [], finalGate ? [OUT + '/gates/3-build.json'] : [],
  hqWritten ? [OUT + '/gates/3-handtest-questions.json', relP(HANDQ_TOOL)] : [], MODE === 'smoke' ? [OUT + '/dry/'] : [], [...new Set(shotDirs)])
return done({
  pass: finalPass, reason, slice: SL, check_off: SL === 'D' && finalPass, rounds, outputs,
  gate_path: OUT + '/gates/3-build-' + SL + '.json', owner_rulings_used: RUSED, gate, final_gate: finalGate, state: runState,
  polish_note: `Filigree 3 slice ${SL}: ${nDone}/${nTotal} units (${builtIds}); ${deferred.length} deferred; gate ${gateStatus}` + (failedIds.length ? `; failed ${failedIds.join(', ')}` : '') + (stuckNow.length ? `; stuck ${stuckNow.map(x => x.id).join(', ')}` : '') + (smokeBad ? `; smoke FAILED (${smokeOnly.console_errors.length} console errors, ${smokeOnly.block_random_hits} clock hits in the FILIGREE block)` : ''),
  polish_inserts: stuckNew.map(x => `- [ ] **Filigree 3 stuck unit ${x.id} — ${x.title || x.id}** — ${x.last_failure || 'failed 3 runs'}; fix by hand, then re-run with args.unstick ["${x.id}"]; a fix unit that is obsolete is dropped with args.discard ["${x.id}"]`),
  polish_inserts_above: 'Filigree 3',
  changelog_line: `- Filigree 3 slice ${SL} (${SLICE_NAME[SL]}): ${titles} — behind the table-map toggle`
})
