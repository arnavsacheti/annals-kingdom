export const meta = {
  name: 'filigree-1-research',
  description: 'Filigree Job 1: research the three plates, the Swiss layer list and Leponnia into a density bible; gate = blank-hex test',
  whenToUse: 'Run as the POLISH item "Filigree 1 · Research → density bible", in a fresh session: Workflow({name:"filigree-1-research", args:{date:"YYYY-MM-DD"}}). Docs + a read-only probe tool; never edits index.html or maps-site/index.html.',
  phases: [
    {title: 'Preflight', detail: 're-anchor by pattern, read ledger + rulings, probe the DEM tool, crop the 12 fixture hexes'},
    {title: 'Research', detail: 'one targeted question per agent -> docs/filigree/research/<qid>.json'},
    {title: 'Verify', detail: 'per question: anchor + one kind lens (second-look / refute / recount / canon)'},
    {title: 'Synthesize', detail: 'opus/xhigh integrator -> density-bible.md/.json; validator + vocabulary grep'},
    {title: 'Blank-hex gate', detail: 'paired blind appliers (sonnet/high + opus/high) per fixture, instance resolver, scoring in code'},
    {title: 'Follow-up', detail: 'completeness critic -> fresh questions -> patcher -> re-gate (<= maxRounds)'},
    {title: 'Record', detail: 'gates/1-research.json, gates/1-hex-answers.json, state/1-research.json'}
  ]
}
const JOB = 'filigree-1-research'
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
checkArgs([])

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

// ---- fixtures and fixed ground (R8, R17, R22) ----
const HEXES = [
  {id: 'F01', cell: [51, 50], bbox: [1632, 1600, 1664, 1632], note: 'summit cell: window maximum 328.19 in DEM cell 565,349 (centre 1649.06,1604.06), edge of AURA-HŌTH lettering'},
  {id: 'F02', cell: [43, 49], bbox: [1376, 1568, 1408, 1600], note: 'open plateau, blank on the print'},
  {id: 'F03', cell: [41, 47], bbox: [1312, 1504, 1344, 1536], note: 'open, inside printed PĒSHUNOR lettering (collision test)'},
  {id: 'F04', cell: [43, 51], bbox: [1376, 1632, 1408, 1664], note: 'open, DRANIMOS lettering, solid river at the edge'},
  {id: 'F05', cell: [42, 45], bbox: [1344, 1440, 1376, 1472], note: 'inland strip under the north-coast dotted road (steep)'},
  {id: 'F06', cell: [48, 47], bbox: [1536, 1504, 1568, 1536], note: 'coast + dotted road between Kanae and Rhup'},
  {id: 'F07', cell: [40, 43], bbox: [1280, 1376, 1312, 1408], note: 'Paerāndas islets'},
  {id: 'F08', cell: [50, 43], bbox: [1600, 1376, 1632, 1408], note: 'open sea (control)'},
  {id: 'F09', cell: [45, 47], bbox: [1440, 1504, 1472, 1536], note: 'Aldorūs (1448.6,1527.5) + solid river: river-town control'},
  {id: 'F10', cell: [38, 44], bbox: [1216, 1408, 1248, 1440], note: 'Epēshu ◉ (1236.1,1415): painted-city control'},
  {id: 'F11', cell: [35, 44], bbox: [1120, 1408, 1152, 1440], note: 'Lepon the Old ruin coast (1146.5,1420.2): old-survey control'},
  {id: 'F12', cell: [83, 6], bbox: [2656, 192, 2688, 224], note: 'open ground by the "Mountain Wall" marker (2676,206): no-DEM control'}
]
const EXEMPT_OK = new Set(['F08', 'F12'])   // only the open-sea and no-DEM controls may score as exempt; every other fixture must name six
const WINDOW = [1060, 1240, 1860, 2040]
const SHEET_ONE_BBOX = [1216, 1376, 1760, 1664]
const BANDS = {W: [1216, 1376, 1400, 1664], M: [1400, 1376, 1580, 1664], E: [1580, 1376, 1760, 1664]}
const Q1 = 'Epēshu chart px [256,2304)x[1280,3328) = chart z3 tiles x 1..8, y 5..12 (about a quarter of the 3914x4200 chart: the Forum, the Marble Quarter, the Māmban garden (a park void), the Necropolis, Wood Quay and the temples; maps-site/data/chart-pois.json is in chart px)'
const ERA_TILES = [[11, 11], [9, 11], [10, 12]]
const HEX_SHEET = 'valley'   // a hex is one z7 tile, read at the valley sheet: that sheet's forbidden classes apply
const BRIEF_ITEMS = ['peak', 'height', 'homestead', 'reserve', 'river_fork', 'coast_road', 'plate2_deletions', 'plate3_deletions', 'block', 'park_void', 'arterial', 'fog_wash', 'contour_hill', 'old_survey', 'every_structure', 'caravan_halts', 'blazed_paths', 'muster_days', 'shut_ways']
const V2_ITEMS = ['paint_on_base', 'names_on_threshold', 'appear_effect', 'one_question_view', 'pooled_edge', 'real_colour', 'cramped', 'data_truth']
const CHECKLIST = BRIEF_ITEMS.concat(V2_ITEMS)
const BRIEF = REPO + '/docs/research/filigree-for-the-table.pdf'
const DEM_TOOL = MODE === 'smoke' ? OUTABS + '/tools/filigree-dem.js' : REPO + '/tools/filigree-dem.js'   // smoke never writes into the repo
const DEM_REL = MODE === 'smoke' ? OUT + '/tools/filigree-dem.js' : 'tools/filigree-dem.js'
const APPLIER_ALLOWED = [...new Set([OUTABS + '/density-bible.md', OUTABS + '/density-bible.json', OUTABS + '/gates/hexes.json', OUTABS + '/gates/hex/', REPO + '/tools/filigree-dem.js', DEM_TOOL, REPO + '/maps-site/data/', REPO + '/index.html', REPO + '/maps-site/index.html'])]
const HEX64 = /^[0-9a-f]{64}$/
const FU_MAX_Q = 5, FU_MAX_LENS = 1
const ROUND_TOKENS = 1500000   // optional budget gate: ~57 agents in one follow-up round

const QUESTIONS = [
  {qid: 'q01', short: 'plate one inventory', question: 'Plate-one inventory per class (peak+height, homestead, reserve, river fork, coast road, shields, trails, ▲ glyphs, the braided river, the four-name valley knot); counts per class.', reads: ['docs/research/filigree-for-the-table.pdf (Read pages:"2")'], role: 'deep', lens: ['second-look']},
  {qid: 'q02', short: 'plates two/three keep vs delete', question: 'What plates two and three keep vs delete; the rule that a POI pin must never stand in for a landform name.', reads: ['docs/research/filigree-for-the-table.pdf (Read pages:"2-4": plate one p2, plate two p3, plate three p4)'], role: 'deep', lens: ['second-look']},
  {qid: 'q03', short: 'Azlen city grain', question: 'Azlen city grain -> measurable proxies (block grain scale, park void, arterial class, fog wash, contour hill, pooled edges, no chrome/pins), taken from the brief\'s text description (there is no Azlen image in the brief: its three plates are Sonoma).', reads: ['docs/research/filigree-for-the-table.pdf (Read pages:"4,6")', 'docs/filigree/research-dossier.md §9'], role: 'deep', lens: ['second-look']},
  {qid: 'q04', short: 'Swiss stack in fiction', question: 'Swiss stack -> fiction layers (old survey, every structure, caravan halts, blazed paths, muster days, shut ways, colour base): swap semantics (base/under/over), data today, gap. Use the README reuse map; reuse the shipped The Beacon Post / The Muster Ground POIs; flag the Tithe renames (R10).', reads: ['docs/research/filigree-for-the-table.pdf (Read pages:"4-5")', 'docs/filigree/research-dossier.md §5', 'docs/filigree/README.md § Reuse map'], role: 'judge', lens: ['refute', 'canon']},
  {qid: 'q05', short: 'coast walk band W', question: 'Coast walk band W (x1216-1400, y1376-1664): everything the print draws per plate-one class (z5 tiles); what maps_markers / city-anchors / named-ways / traced-roads / sea-lanes / wiki-places carry inside the band; which plate-one classes are missing.', reads: ['maps-site/tiles/5/', 'maps-site/data/maps_markers.json', 'maps-site/data/city-anchors.json', 'maps-site/data/named-ways.json', 'maps-site/data/traced-roads.json', 'maps-site/data/sea-lanes.json', 'maps-site/data/wiki-places.json'], role: 'deep', lens: ['second-look']},
  {qid: 'q06', short: 'coast walk band M', question: 'Coast walk band M (x1400-1580, y1376-1664): everything the print draws per plate-one class (z5 tiles); what maps_markers / city-anchors / named-ways / traced-roads / sea-lanes / wiki-places carry inside the band; which plate-one classes are missing.', reads: ['maps-site/tiles/5/', 'maps-site/data/maps_markers.json', 'maps-site/data/city-anchors.json', 'maps-site/data/named-ways.json', 'maps-site/data/traced-roads.json', 'maps-site/data/sea-lanes.json', 'maps-site/data/wiki-places.json'], role: 'deep', lens: ['second-look']},
  {qid: 'q07', short: 'coast walk band E', question: 'Coast walk band E (x1580-1760, y1376-1664): everything the print draws per plate-one class (z5 tiles); what maps_markers / city-anchors / named-ways / traced-roads / sea-lanes / wiki-places carry inside the band; which plate-one classes are missing.', reads: ['maps-site/tiles/5/', 'maps-site/data/maps_markers.json', 'maps-site/data/city-anchors.json', 'maps-site/data/named-ways.json', 'maps-site/data/traced-roads.json', 'maps-site/data/sea-lanes.json', 'maps-site/data/wiki-places.json'], role: 'deep', lens: ['second-look']},
  {qid: 'q08', short: 'city quarter Q1', question: 'City quarter Q1 in Azlen grain: block, park void, arterial, fog wash, contour hill. What exists on the chart vs the generated plan (the genCityCanvas feature list), anchors, gaps.', reads: ['maps-site/charts/epeshu/3/{1..8}/{5..12}.jpg', 'maps-site/data/chart-pois.json', 'maps-site/data/detail-charts.json', 'maps-site/index.html (anchor function genCityCanvas)'], role: 'deep', lens: ['second-look']},
  {qid: 'q09', short: 'relief supply', question: 'Relief supply. Decode EPESHU_HF; verify the transform on Aldorūs; per-fixture h range; local maxima with prominence >=15 m inside SHEET_ONE_BBOX; contour spacing in screen px at z6/z7/z8 for a 5 m interval; genHydrology carves W.H, so use the raw decode. Write the committed read-only probe tools/filigree-dem.js (see the tool task below).', reads: ['index.html (anchor const EPESHU_HF_URI)'], role: 'deep', tool: true, lens: ['recount']},
  {qid: 'q10', short: 'water supply', question: 'Water supply: sim rivers inside the window vs the solid black lines on the print; forks per coast band; propose the rivers.json source rule (DEM flow candidates kept only where the print shows a solid line).', reads: ['index.html', 'maps-site/tiles/5/'], role: 'deep', lens: ['second-look']},
  {qid: 'q11', short: 'name supply', question: 'Name supply: landform/structure roots + affixes, reserved canon words, sayability (the NAME repeat rule at anchor NAME.used.has(n), seam rules), how many distinct names can be minted per class, proposed mint key (class, cellId) on xmur3/mulberry32.', reads: ['lexicon/patrinaic.json', 'tools/pgd2lexicon.js', 'index.html (anchors const NAME = , NAME.used.has(n), const PATRINAIC_ROOTS)'], role: 'audit', lens: ['canon']},
  {qid: 'q12', short: 'data baseline', question: 'Data baseline: named-thing counts per class per fixture cell and per sheet-one band.', reads: ['maps-site/data/maps_markers.json', 'maps-site/data/city-anchors.json', 'maps-site/data/named-ways.json', 'maps-site/data/traced-roads.json', 'maps-site/data/sea-lanes.json', 'maps-site/data/wiki-places.json', 'maps-site/data/chart-pois.json', 'maps-site/data/city-traits.json', 'maps-site/data/gazetteer.json'], role: 'mech', lens: ['recount']},
  {qid: 'q13', short: 'overlay hooks', question: 'Overlay hooks re-anchored: chronicle chron, W.banditCamps, ambush, famine/plague flags, the Pebros camp, W.dragon, W.weather (no fog), The Beacon Post / The Muster Ground / Tithe POIs.', reads: ['index.html', 'maps-site/index.html'], role: 'audit', lens: []},
  {qid: 'q14', short: 'old survey eras', question: 'Do the Imperial/War eras differ from Modern in roads/forest, or only in names/borders? 3 fixed land tiles (z5 11/11, 9/11, 10/12) x 3 eras.', reads: ['maps-site/tiles/5/11/11.jpg', 'maps-site/tiles/5/9/11.jpg', 'maps-site/tiles/5/10/12.jpg', 'maps-site/tiles-imperial/5/ (same three tiles)', 'maps-site/tiles-war/5/ (same three tiles)'], role: 'deep', lens: ['second-look']},
  {qid: 'q15', short: 'v2 camps to rules', question: 'The v2 camps -> per-sheet rules: paint on the base, names on a threshold, the appear effect, one-question views, pooled-edge contrast, real colours, "cramped" (min label spacing at 390 px), data truth.', reads: ['docs/research/filigree-for-the-table.pdf (Read pages:"6-8")', 'docs/filigree/research-dossier.md §9'], role: 'judge', lens: ['refute', 'canon']},
  {qid: 'q16', short: 'printed lettering per fixture', question: 'Printed lettering per fixture: which of F01-F12 the print already fills with hand lettering or glyphs (collision with overlay labels).', reads: ['gates/hex/F01.jpg .. gates/hex/F12.jpg'], role: 'deep', lens: ['second-look']},
  {qid: 'q17', short: 'prerequisite audit', question: 'Prerequisite audit. Find the POLISH items by title text ("Traced road network", "Census second pass", "Uncharted-band softening", "Data fetch cache-busting", "Tier-hidden markers", "Region-chart zoom-through", "Sim ↔ atlas continuity"; all seven titles exist in POLISH.md today): checked? Do their promised files exist? Is maps-site/data/traced-roads.json loaded by maps-site/index.html (code reading)? A missing or unloaded traced-roads.json is a finding, never a failure.', reads: ['POLISH.md', 'maps-site/'], role: 'audit', lens: []},
  {qid: 'q18', short: 'pooled-edge precedent', question: 'The Stamen Watercolor method (mask, blur, edge-darken) as a pooled-edge precedent: one web attempt; if egress is blocked, return a single claim with confidence low and evidence {kind:"web", ref:"U"}.', reads: ['web (one attempt)'], role: 'audit', lens: []}
]
const LENS_ROLE = {anchor: 'mech', 'second-look': 'deep', refute: 'judge', recount: 'mech', canon: 'audit'}
const hexById = id => HEXES.find(h => h.id === id)
const BOX = id => hexById(id).bbox.join(',')
// One cell-centre sampling rule for the probe, its literals and the gate. Literals re-derived from a raw decode of EPESHU_HF_URI under exactly this rule:
// summit cell 565,349 = 328.1875 (bilinear 328.18), Aldorūs cell 373,276 = 139.3125 (bilinear 139.295), F01 252.71875..328.1875, F08 hmax -43.1875.
// The --at points sit inside their cells, away from cell edges, so nearest-cell and bilinear readings both land within tolerance.
const DEM_SAMPLING = 'cell (gx,gy), gx,gy in 0..767, covers atlas [1060 + gx*800/768, 1060 + (gx+1)*800/768) x [1240 + gy*800/768, 1240 + (gy+1)*800/768), so its centre is (1060 + (gx+0.5)*800/768, 1240 + (gy+0.5)*800/768) (Aldorūs cell 373,276 -> centre 1449.06,1528.02, h 139.31); --at x,y returns the h of the cell CONTAINING x,y (gx = floor((x-1060)*768/800), same for y; equivalently the cell whose centre is nearest) and null when x,y lies outside the half-open window [1060,1860) x [1240,2040); --bbox x0,y0,x1,y1 uses every cell whose CENTRE lies in the half-open box [x0,x1) x [y0,y1) (no interpolation)'
const DEM_REF = {summit: [328.19, 0.1], aldorus: [139.31, 0.5], f01_hmin: [252.72, 1], f01_hmax: [328.19, 1]}
const DEM_AT = {summit: '1649,1604', aldorus: '1449,1528'}
const DEM_LIT = `--at ${DEM_AT.summit} -> h ${DEM_REF.summit[0]} ±${DEM_REF.summit[1]}; --at ${DEM_AT.aldorus} -> h ${DEM_REF.aldorus[0]} ±${DEM_REF.aldorus[1]}; --bbox ${BOX('F08')} (F08) -> hmax < 0; --bbox ${BOX('F01')} (F01) -> hmin ${DEM_REF.f01_hmin[0]} ±${DEM_REF.f01_hmin[1]}, hmax ${DEM_REF.f01_hmax[0]} ±${DEM_REF.f01_hmax[1]}`
const DEM_PROBE_TASK = `exists = the file ${DEM_TOOL} exists. If it does not, return exists false, sha_run1 and sha_run2 "", and null numbers. Otherwise, from ${REPO}: run node ${DEM_TOOL} --bbox ${BOX('F01')} twice and sha256sum each stdout -> sha_run1, sha_run2; at_summit = h from --at ${DEM_AT.summit}; at_aldorus = h from --at ${DEM_AT.aldorus}; f08_hmax = hmax from --bbox ${BOX('F08')}; f01_hmin and f01_hmax from --bbox ${BOX('F01')}. Any value you cannot read is null.`
const near = (v, [x, tol]) => typeof v === 'number' && isFinite(v) && Math.abs(v - x) <= tol
const demPass = p => !!p && p.exists === true && /^[0-9a-f]{64}$/.test(p.sha_run1 || '') && p.sha_run1 === p.sha_run2 &&
  near(p.at_summit, DEM_REF.summit) && near(p.at_aldorus, DEM_REF.aldorus) && typeof p.f08_hmax === 'number' && p.f08_hmax < 0 &&
  near(p.f01_hmin, DEM_REF.f01_hmin) && near(p.f01_hmax, DEM_REF.f01_hmax)
const FIXED_TEXT = [
  `DEM window ${WINDOW.join(',')} (x0,y0,x1,y1); sheet one (region sheet over the Pēshunor north coast) ${SHEET_ONE_BBOX.join(',')}`,
  `coast walk bands: ${Object.entries(BANDS).map(([k, b]) => k + ' ' + b.join(',')).join(' · ')}`,
  `city quarter Q1: ${Q1}`,
  `old-survey era tiles (z5 x/y): ${ERA_TILES.map(t => t.join('/')).join(', ')}`,
  `fixture hexes (one hex = one z7 tile = 32 atlas px; cell cx,cy covers [32cx,32cx+32) x [32cy,32cy+32)): ${HEXES.map(h => `${h.id} cell ${h.cell.join(',')} bbox ${h.bbox.join(',')}`).join('; ')}`
].join('\n')
const READS_NOTE = `Read paths are relative to the repo root ${REPO}, except gates/... and research/..., which are under ${OUTABS}. Read the brief with the Read tool's pages argument, only the pages named.`

// ---- schemas ----
const S = {type: 'string'}, SA = {type: 'array', items: {type: 'string'}}, B = {type: 'boolean'}, NN = {description: 'a number, or null when it cannot be read'}
const QSCHEMA = {type: 'object', properties: {
  qid: S, path: S, sha256: S,
  claims: {type: 'array', items: {type: 'object', properties: {
    id: S, text: S,
    evidence: {type: 'object', properties: {kind: {type: 'string', enum: ['pdf-page', 'crop', 'anchor', 'computed', 'data', 'web']}, ref: S}, required: ['kind', 'ref']},
    confidence: {type: 'string', enum: ['high', 'medium', 'low']}}, required: ['id', 'text', 'evidence', 'confidence']}},
  gaps: SA, summary: S},
required: ['qid', 'path', 'sha256', 'claims', 'gaps', 'summary']}
const LENS = {type: 'object', properties: {lens: S, checked: {type: 'integer'}, own_reading: {type: 'array', items: {type: 'object', properties: {claim: S, reading: S}, required: ['claim', 'reading']}},
  struck: {type: 'array', items: {type: 'object', properties: {claim: S, why: S, evidence: S}, required: ['claim', 'why', 'evidence']}}},
required: ['lens', 'checked', 'struck']}
const DEMP = {type: 'object', properties: {exists: B, sha_run1: S, sha_run2: S, at_summit: NN, at_aldorus: NN, f08_hmax: NN, f01_hmin: NN, f01_hmax: NN},
  required: ['exists', 'sha_run1', 'sha_run2', 'at_summit', 'at_aldorus', 'f08_hmax', 'f01_hmin', 'f01_hmax']}
const PRE = {type: 'object', properties: {
  missing: SA, dem: DEMP,
  gate_prev: {type: 'object', properties: {exists: B, pass: B, mode: S, forced: B, md_ok: B, json_ok: B, hex_answers_exists: B}},
  anchors: {type: 'object', additionalProperties: {description: '"path:line" string, or null when the literal is not found'}},
  rulings_overrides: {type: 'object', additionalProperties: {type: 'string'}},
  ledger: {type: 'object', properties: {
    questions: {type: 'array', items: {type: 'object', properties: {qid: S, path: S, sha256: S, sha_ok: B, claim_ids: SA, struck: SA}, required: ['qid', 'path', 'sha256', 'sha_ok', 'claim_ids', 'struck']}},
    seen_questions: SA}, required: ['questions', 'seen_questions']}},
required: ['missing', 'anchors', 'rulings_overrides', 'ledger', 'dem']}
const HEXCROP = {type: 'object', properties: {fixtures_changed: B, hexes_path: S, path: S, sha256: S, parsed: B,
  crops: {type: 'array', items: {type: 'object', properties: {id: S, path: S}, required: ['id', 'path']}},
  existing: {type: 'array', items: {type: 'object', properties: {id: S, cell: {type: 'array', items: {type: 'number'}}, bbox: {type: 'array', items: {type: 'number'}}, crop: {type: 'object', properties: {path: S, x0: {type: 'number'}, y0: {type: 'number'}, scale: {type: 'number'}}, required: ['path', 'x0', 'y0', 'scale']}}, required: ['id', 'cell', 'bbox', 'crop']}}},
required: ['hexes_path', 'path', 'sha256', 'parsed', 'crops']}
const INTEG = {type: 'object', properties: {
  md: S, json: S, sha_md: S, sha_json: S, rule_ids: SA, class_ids: SA, ground_classes: SA, exempt_rules: SA,
  exempt_by_class: {type: 'object', additionalProperties: {type: 'string'}},
  forbidden_by_sheet: {type: 'object', additionalProperties: SA}, checklist_keys: SA, cited_claims: SA},
required: ['md', 'json', 'sha_md', 'sha_json', 'rule_ids', 'class_ids', 'ground_classes', 'exempt_rules', 'exempt_by_class', 'forbidden_by_sheet', 'checklist_keys', 'cited_claims']}
const VALID = {type: 'object', properties: {ok: B, failures: SA, checklist_keys: SA, cited_claims: SA, sha_md: S, sha_json: S}, required: ['ok', 'failures', 'checklist_keys', 'cited_claims', 'sha_md', 'sha_json']}
const VHITS = {type: 'object', properties: {hits: SA}, required: ['hits']}
const APPLY = {type: 'object', properties: {
  hex: S, ground_class: S, exempt_rule: S,
  items: {type: 'array', items: {type: 'object', properties: {
    class: S, rule: S,
    instance: {type: 'object', properties: {name: S, x: {type: 'number'}, y: {type: 'number'}}, required: ['name', 'x', 'y']},
    source: {type: 'object', properties: {kind: {type: 'string', enum: ['dem', 'data', 'print', 'mint', 'sim']}, ref: S}, required: ['kind', 'ref']}},
  required: ['class', 'rule', 'instance', 'source']}},
  bible_silent: B, missing: SA, files_read: SA},
required: ['hex', 'ground_class', 'exempt_rule', 'items', 'bible_silent', 'missing', 'files_read']}
const RESOLVE = {type: 'object', properties: {hex: S,
  results: {type: 'array', items: {type: 'object', properties: {actor: {type: 'string', enum: ['A', 'B']}, idx: {type: 'integer'}, ok: B, why: S}, required: ['actor', 'idx', 'ok', 'why']}}},
required: ['hex', 'results']}
const AMBIG = {type: 'object', properties: {gaps: {type: 'array', items: {type: 'object', properties: {hex: S, section: S, what: S}, required: ['hex', 'section', 'what']}}}, required: ['gaps']}
const CRITIC = {type: 'object', properties: {questions: {type: 'array', items: {type: 'object', properties: {
  qid: S, question: S, reads: SA,
  role: {type: 'string', enum: ['mech', 'triage', 'audit', 'deep', 'judge']},
  lens: {type: 'array', items: {type: 'string', enum: ['anchor', 'second-look', 'refute', 'recount', 'canon']}}},
required: ['qid', 'question', 'reads', 'role', 'lens']}}}, required: ['questions']}

// ---- Preflight ----
phase('Preflight')
const INPUTS = [
  BRIEF, DOCS + '/research-dossier.md', DOCS + '/todo-inputs.json',
  REPO + '/maps-site/tiles/5', REPO + '/maps-site/tiles-war/5', REPO + '/maps-site/tiles-imperial/5',
  REPO + '/maps-site/charts/epeshu/3', REPO + '/maps-site/tiles/5/20/1.jpg', REPO + '/lexicon/patrinaic.json',
  ...['maps_markers', 'city-anchors', 'named-ways', 'traced-roads', 'sea-lanes', 'wiki-places', 'chart-pois', 'detail-charts', 'city-traits'].map(f => `${REPO}/maps-site/data/${f}.json`),
  REPO + '/tools/pgd2lexicon.js', REPO + '/tools/build-gazetteer.js'
]
const pre = await crit(P(`${ANCHOR_TASK}

Also check, and write nothing:
1. Inputs exist (file or directory): ${INPUTS.join(' ; ')}. "missing" lists every one that does not exist (traced-roads.json is missing only if the file is truly gone; whether it is loaded is not your question).
2. Read ${DOCS}/rulings.json if present: rulings_overrides = its "overrides" object ({} if the file or the key is absent).
3. The DEM probe (run it, edit nothing): ${DEM_PROBE_TASK} Return these as "dem".
4. Read the ledger ${OUTABS}/state/1-research.json if present. For each entry of its "questions": sha256sum the file at its "path" and return {qid, path, sha256 (the recorded one), sha_ok (the file exists and re-hashes to the recorded sha256), claim_ids, struck} copied from the entry. seen_questions = its "seen_questions" array. Absent ledger = {questions: [], seen_questions: []}.
5. Read ${OUTABS}/gates/1-research.json if present (write nothing). gate_prev = {exists: it exists and parses, pass: parsed.pass === true, mode: parsed.mode, forced: parsed.forced_by is non-null, md_ok: the artifacts entry whose path ends density-bible.md names a sha256 equal to sha256sum of ${OUTABS}/density-bible.md, json_ok: the same for density-bible.json, hex_answers_exists: ${OUTABS}/gates/1-hex-answers.json exists and parses}. Absent file = {exists: false, pass: false, mode: "", forced: false, md_ok: false, json_ok: false, hex_answers_exists: false}.
Return {missing, anchors (the re-anchor map above), rulings_overrides, dem, ledger, gate_prev}.`), {label: 'preflight', phase: 'Preflight', schema: PRE, ...M('mech')})
if (!pre) return done({reason: 'agent died: preflight'})
if ((pre.missing || []).length) die('missing inputs: ' + pre.missing.join(', '))
const lostAnchors = anchorsLost(pre.anchors)
if (lostAnchors.length) die('anchor lost: ' + lostAnchors.join('; '))
const {r: RUL, used: RUSED} = rulingsMerge(pre.rulings_overrides)
const LEDGER = (pre.ledger && Array.isArray(pre.ledger.questions)) ? pre.ledger.questions.filter(x => x && x.qid) : []
const TOOL_QIDS = new Set(QUESTIONS.filter(q => q.tool).map(q => q.qid))
const demPre = demPass(pre.dem)   // a tool question resumes only while its probe still reproduces the literals; else it re-runs and rewrites the tool
if (!demPre && LEDGER.some(x => TOOL_QIDS.has(x.qid) && x.sha_ok === true)) log('dem probe fails preflight: ' + [...TOOL_QIDS].join(', ') + ' re-run despite a re-hashing evidence file')
const ledgerOk = qid => LEDGER.some(x => x.qid === qid && x.sha_ok === true) && (demPre || !TOOL_QIDS.has(qid))
const resumed = RESUME ? LEDGER.filter(x => ledgerOk(x.qid)) : []
const unresumed = QUESTIONS.filter(q => !(RESUME && ledgerOk(q.qid)))
const todo = cap(unresumed.filter(q => q.tool).concat(unresumed.filter(q => !q.tool)))   // tool question first: smoke's one question must write the probe or the gate never reaches its appliers
if (resumed.length) log(`resume: ${resumed.length} question(s) re-hash and are skipped: ${resumed.map(x => x.qid).join(', ')}`)

const lensMax = q => q.lens.length + (q.lens.includes('anchor') ? 0 : 1)
const CRIT_MAX = 2   // crit(): a null first answer launches one retry
const GATE_MIN = 1 + 3 * HEXES.length, GATE_MAX = GATE_MIN + CRIT_MAX   // dem probe + 2 appliers and 1 resolver per hex (+ ambiguity judge, crit)
const FU_ROUND_MAX = 1 + FU_MAX_Q * (1 + FU_MAX_LENS + 1) + CRIT_MAX + 2 + GATE_MAX   // critic, questions x (research + lens + anchor), patcher (crit), validator + grep, gate
if (MODE === 'plan') {
  const sched = [
    {phase: 'Preflight', agents_min: 2, agents_max: 2 * CRIT_MAX},
    {phase: 'Research', agents_min: unresumed.length, agents_max: unresumed.length},
    {phase: 'Verify', agents_min: unresumed.reduce((s, q) => s + q.lens.length, 0), agents_max: unresumed.reduce((s, q) => s + lensMax(q), 0)},
    {phase: 'Synthesize', agents_min: 3, agents_max: CRIT_MAX + 2},
    {phase: 'Blank-hex gate', agents_min: GATE_MIN, agents_max: GATE_MAX},
    {phase: 'Follow-up', agents_min: 0, agents_max: ROUNDS * FU_ROUND_MAX},
    {phase: 'Record', agents_min: 3, agents_max: 3 * CRIT_MAX}
  ]
  const tot = sched.reduce((s, x) => s + x.agents_max, 0)
  return done({reason: 'plan', owner_rulings_used: RUSED, schedule: sched, agents_bound: tot, resumed: resumed.map(x => x.qid),
    polish_note: `plan: ${unresumed.length} question(s) to research, at most ${tot} agents including crit() retries (bound ≈224)`})
}

// A gate that already passed on a bible that still re-hashes is not redone: re-integrating would write a new bible and could flip the pass.
const GP = pre.gate_prev || {}
if (RESUME && MODE === 'full' && GP.exists === true && GP.pass === true && GP.mode === 'full' && GP.forced !== true && GP.md_ok === true && GP.json_ok === true) {
  const lack = [GP.hex_answers_exists === true ? '' : 'gates/1-hex-answers.json', LEDGER.length ? '' : 'state/1-research.json'].filter(Boolean)
  if (lack.length) return done({reason: 'record-incomplete: the gate passed on an unchanged bible but ' + lack.join(' and ') + ' is missing and cannot be rebuilt without a new run; delete gates/1-research.json (or pass resume:false) to redo Job 1', owner_rulings_used: RUSED})
  log('gate already passed on an unchanged bible: nothing to do')
  return done({pass: true, reason: 'already passed: gate pass:true and the bible re-hashes; nothing re-run', owner_rulings_used: RUSED, gate_path: OUT + '/gates/1-research.json',
    outputs: [OUT + '/density-bible.md', OUT + '/density-bible.json', OUT + '/gates/hexes.json', OUT + '/gates/hex/', OUT + '/gates/1-research.json', OUT + '/gates/1-hex-answers.json', OUT + '/research/', DEM_REL],
    polish_note: 'Job 1 already passed on an unchanged density bible; nothing was re-run'})
}

const HX = cap(HEXES)
const HEXES_JSON = {date: DATE, unit: 'z7 tile = 32 atlas px', hexes: HX.map(h => ({id: h.id, cell: h.cell, bbox: h.bbox,
  center: [(h.bbox[0] + h.bbox[2]) / 2, (h.bbox[1] + h.bbox[3]) / 2], crop: {path: `gates/hex/${h.id}.jpg`, x0: h.bbox[0] - 32, y0: h.bbox[1] - 32, scale: 4}}))}
const crop = await crit(P(`Crop the fixture hexes (R17: one hex = one z7 tile = 32 atlas px). They are FROZEN once written: first check whether ${OUTABS}/gates/hexes.json exists, parses, lists exactly the hex ids ${HX.map(h => h.id).join(', ')}, and every crop it lists exists under ${OUTABS}/. If so, compare each hex of that file with the JSON below: cell, bbox and crop {path, x0, y0, scale} must all be equal. If it exists, write nothing and delete nothing: return existing = its hexes exactly as stored ({id, cell, bbox, crop {path, x0, y0, scale}} each; ignore its date) and fixtures_changed false, with the read-back of the existing file; the script compares them with the JSON below.
Otherwise, for each hex in the JSON below: the crop window is the bbox plus one cell of margin on every side, i.e. 96x96 atlas px starting at (crop.x0, crop.y0). Source: the z5 tiles ${REPO}/maps-site/tiles/5/<tx>/<ty>.jpg (256 px tiles, 2 screen px per atlas px, so tx = floor(x/128), ty = floor(y/128); F12 at (2656,192) is tile 20/1; verify this naming against the files on disk before cropping). Stitch the tiles the window needs (neighbours supply the margin) with ImageMagick convert (/usr/bin/convert) or Python PIL (no sharp, no playwright install), crop the 192x192 screen-px window, upscale x2 to 384x384 (4 px per atlas px), and write JPEG quality 85 (<= 300 KB) to ${OUTABS}/gates/hex/<id>.jpg.
Then write ${OUTABS}/gates/hexes.json as exactly this JSON (2-space indent; crop paths are relative to ${OUTABS}):
${JSON.stringify(HEXES_JSON, null, 2)}
${READBACK} Also return hexes_path (= that path) and crops: [{id, path}] for every crop file that exists when you finish.`),
{label: 'hex cropper', phase: 'Preflight', schema: HEXCROP, ...M('mech')})
const fixtureDiff = (crop && Array.isArray(crop.existing) && crop.existing.length) ? HEXES_JSON.hexes.filter(h => { const e = crop.existing.find(x => x && x.id === h.id); return !e || JSON.stringify([e.cell, e.bbox, e.crop && [e.crop.path, e.crop.x0, e.crop.y0, e.crop.scale]]) !== JSON.stringify([h.cell, h.bbox, [h.crop.path, h.crop.x0, h.crop.y0, h.crop.scale]]) }).map(h => h.id) : []   // scored in code: date and key order never count
if (fixtureDiff.length || (crop && Array.isArray(crop.existing) && crop.existing.length && crop.existing.length !== HEXES_JSON.hexes.length)) die('fixtures changed (' + fixtureDiff.join(', ') + '); delete gates/hex* (gates/hexes.json and gates/hex/) under ' + OUTABS + ' to re-crop (R17: a changed fixture cell needs a Job 1 re-run)')
if (!FILE_OK(crop)) return done({reason: 'agent died: hex cropper', owner_rulings_used: RUSED})
const cropIds = new Set((crop.crops || []).filter(c => c && c.id).map(c => c.id))

// ---- Research + Verify ----
const DEM_TASK = `Tool task: also write the committed read-only probe ${DEM_TOOL} (plain Node using only the built-in fs, path and zlib modules; no npm packages; no clock or random calls: grep -E '${CLOCK_GREP}' on it must find nothing). It decodes the EPESHU_HF PNG embedded at the anchor const EPESHU_HF_URI in ${REPO}/index.html: 768x768 RGB, h = (R*256+G)/32 - 300 m. Sampling rule (the gate literals depend on it; follow it exactly): ${DEM_SAMPLING}. CLI: --at x,y prints {"h": <m, 2 decimals> | null outside the window}; --bbox x0,y0,x1,y1 prints {"land_frac","hmin","hmax","peaks":[{"x","y","h","prom"}]}. Output must be byte-identical across runs. It must reproduce: ${DEM_LIT}. Stamp the date in a header comment.`
const LENS_TEXT = {
  'second-look': 'Second look: independently re-read the SAME source the researcher read (the pages, crops, tiles or files under Reads). Do not open the research file or its evidence. The claim list below is for comparison only: it carries claim text without evidence refs. Before you decide any strike, write your own reading of the source for each claim\'s topic into own_reading (claim id + what the source itself shows), then strike every claim your reading contradicts. Independence is partial (you do see the claim text), so own_reading must be filled for every claim.',
  refute: 'Refute: refute claims you can disprove with evidence; keep what you cannot.',
  recount: 'Recount: re-run the computation or count behind each numeric claim yourself (commands allowed; throwaway scripts in a mktemp -d dir) and strike every claim you cannot reproduce.',
  canon: 'Canon: check voice and canon (bronze-age Nīmlad, the nine Kembar, years A.B.; Lamor and Pēshunor are regions, not towns) and the banned vocabulary; strike claims whose proposed names or player-facing wording break them. ' + VOCAB_RULE,
  anchor: 'Anchor: for every claim whose evidence.kind is "anchor", check that the ref resolves: grep -nF -e <literal> <file> from the repo root, quoting the literal properly (a literal containing a single quote goes through a temp file with grep -nF -f, or through double quotes). Strike every claim whose anchor does not resolve.'
}
const lensesFor = (q, r) => cap([...new Set(q.lens.concat((r.claims || []).some(c => c && c.evidence && c.evidence.kind === 'anchor') ? ['anchor'] : []))])
const researchPrompt = q => P(`Research question ${q.qid} (${q.short || 'follow-up'}). Answer this ONE question and nothing else:
${q.question}

Reads: ${q.reads.join('; ')}
${READS_NOTE}
Static inputs you may consult: ${DOCS}/research-dossier.md, ${DOCS}/todo-inputs.json, ${DOCS}/README.md (section "Reuse map"), the brief ${BRIEF}.

Anchors re-derived by pattern this run (literal -> path:line):
${anchorMap(pre.anchors)}

Fixed constants (atlas px):
${FIXED_TEXT}

Rulings:
${rulingText(RUL, ['R10', 'R17', 'R22'])}
${q.tool ? '\n' + DEM_TASK + '\n' : ''}
Write ${OUTABS}/research/${q.qid}.json (create the directory) = {qid, claims, gaps, summary, date: "${DATE}"}. Claim ids are "${q.qid}-c01", "${q.qid}-c02", ... Cite evidence on every claim: kind pdf-page | crop | anchor | computed | data | web; ref = the page, crop px, "path :: literal" for an anchor, the command, or file#key. Anything you cannot establish is a gaps[] entry, never a guess. Return {qid: "${q.qid}", path (absolute path of that file), sha256 (sha256sum of it), claims, gaps, summary (<= 3 sentences)}.`)
const lensPrompt = (L, q, r) => P(`Verify research question ${q.qid} through ONE lens: ${L}.
Question: ${q.question}
Reads: ${q.reads.join('; ')}
${READS_NOTE}
${LENS_TEXT[L]}${L === 'recount' && q.tool ? `\nFor the probe ${DEM_TOOL}: run it twice with the same arguments (--bbox ${BOX('F01')}) and compare the sha256 of the two outputs; check the literals ${DEM_LIT}. Strike every claim that disagrees with the tool output or the literals; if the tool is nondeterministic or misses a literal, strike its tool claims.` : ''}

Claims (${L === 'second-look' ? 'id: text; evidence refs withheld' : 'id: text [evidence kind :: ref]'}):
${(r.claims || []).map(c => L === 'second-look' ? `${c.id}: ${c.text}` : `${c.id}: ${c.text} [${c.evidence ? c.evidence.kind + ' :: ' + c.evidence.ref : 'no evidence'}]`).join('\n') || '(none)'}

Write nothing; return the LENS object${L === 'second-look' ? ' (own_reading first, one entry per claim id)' : ''}: lens = "${L}", checked = how many claims you checked, struck = [{claim: <claim id>, why, evidence}] for every claim you disproved (empty when none).`)

const STRUCK = new Set(resumed.flatMap(x => x.struck || []))
const gapsResearch = []
const resAll = []
const cov = {rn: resumed.length, rk: resumed.length, ln: 0, lk: 0}   // resumed questions were fully verified when recorded (the ledger keeps only those)
const evidence = () => [...new Set(resumed.filter(x => !resAll.some(y => y.q.qid === x.qid)).map(x => x.path).concat(resAll.map(x => x.r.path)).filter(Boolean))]
const EVIDENCE_NOTE = () => `Research evidence this run trusts (read ONLY these research files; ignore every other file under ${OUTABS}/research/, they are stale or unverified):\n${evidence().join('\n') || '(none)'}`
async function researchRound(qs, tag) {
  const res = await pipeline(qs,
    q => agent(researchPrompt(q), {label: q.qid + ' · ' + (q.short || 'follow-up') + tag, phase: 'Research', schema: QSCHEMA, ...M(q.role)}),
    (r, q) => r && parallel(lensesFor(q, r).map(L => () =>
      agent(lensPrompt(L, q, r), {label: q.qid + ' · ' + L + tag, phase: 'Verify', schema: LENS, ...M(LENS_ROLE[L])})))
      .then(vs => ({q, r, struck: vs.filter(Boolean).flatMap(v => (v.struck || []).map(s => s.claim)), lensDrops: vs.filter(v => !v).length, lensN: vs.length})))
  const {k} = kept(res, 'research+verify' + tag)
  res.forEach((x, i) => { if (!x) gapsResearch.push(`${qs[i].qid}: no evidence (research agent or its verify stage died)`) })
  cov.rn += res.length; cov.rk += k.length
  for (const x of k) {
    x.struck.forEach(c => STRUCK.add(c))
    cov.ln += x.lensN; cov.lk += x.lensN - x.lensDrops
    if (x.lensDrops) log(`${x.q.qid}: ${x.lensDrops}/${x.lensN} verify lens(es) died; kept out of the ledger so a resume re-runs it`)
    ;(x.r.gaps || []).forEach(g => gapsResearch.push(`${x.q.qid}: ${g}`))
    resAll.push(x)
  }
  return k
}
phase('Research')
await researchRound(todo, '')

// ---- Synthesize ----
const STRUCTURE = `density-bible.md sections: per sheet (country / region / valley / city), per class, fiction stack, plates, city grain, ground classes and their six, targets, prerequisites, "## Renames", "## Provenance".
density-bible.json shape:
{date, ground:{window:[${WINDOW.join(',')}], sheet_one_bbox:[${SHEET_ONE_BBOX.join(',')}]},
 rules:[{id:"B-01", text, kind:"must"|"forbidden"|"threshold"|"source"|"exempt", sheets:[...], cites:[claimId]}],   (ids stable across rounds)
 sheets:{country|region|valley|city:{must:[ruleId], forbidden:[ruleId], band_hint:"W"|"M"|"E"|"" (the sheet-one coast band whose counts calibrated this sheet's targets, "" when none)}},
 classes:[{id, label, fiction_name, rank, sheets:[...], forbidden_on:[...], source_kinds:["dem"|"data"|"print"|"mint"|"sim"], instance_rule, min_per_cell:{<groundClass>:n}, reuse:"<pattern anchor> | NEW:<machinery>"}],
 ground_classes:{<id>:{criteria:"mechanical test (DEM land_frac/h, window, anchor kind...)", six:[classId x6], exempt_rule:""}},
 no_dem_rule:ruleId,
 layers:[{id, swiss_id, fiction_name, swap:"base"|"under"|"over", data_today, gap}],
 plates:{one:{classes:{<class>:n}}, two:{kept:[], deleted:[]}, three:{kept:[], deleted:[]}},
 city_grain:{block, park_void, arterial, fog_wash, contour_hill},   (each {rule, data_today, gap})
 targets:{per_view:{region:{<class>:n}, valley:{<class>:n}}},
 prerequisites:[{item, blocks:"F3-A"|"F3-B"|"F3-C"|"F3-D", status:"checked"|"open"|"missing"}],   (Job 3 builds in slices: F3-A ground (DEM-derived ground classes and the hex sampler; no data prerequisites), F3-B named things from data (roads, census, markers), F3-C fiction stack layers and overlay hooks, F3-D city grain, plates and the final gate. "blocks" is the earliest slice that cannot be built without the item: POLISH "Traced road network" and "Census second pass" -> F3-B (R11); "Data fetch cache-busting" and "Tier-hidden markers" -> F3-C; "Sim ↔ atlas continuity" -> F3-C; "Uncharted-band softening" and "Region-chart zoom-through" -> F3-D; take status from research q17)
 checklist:{<each checklist key>: ruleId},
 mint key: every class whose source_kinds include "mint" states its mint key in instance_rule (R9: xmur3(class+cellId) -> mulberry32)}
Name the classes so the checks are mechanical: a class whose id or label contains \"homestead\" lists \"country\" AND \"region\" in forbidden_on (brief p8: homesteads wait for the valley sheet; sheet one is the region sheet), and a class whose id or label contains \"block\" lists \"city\" in forbidden_on; sheets.country.forbidden and sheets.city.forbidden are non-empty rule ids, and sheets.region.forbidden includes a rule that forbids homesteads (a rule whose text names homesteads).
Rules are general (by ground class and sheet): never list the fixture hexes or their answers. An exempt_rule is allowed only for ground with no land (open sea) and for ground outside the DEM window (the no-DEM rule, R22); every other ground class (coast, islets, river towns and the painted city included) names six classes. A hex is read at the ${HEX_SHEET} sheet. The no-DEM rule covers ground outside the window (R22).`
const RETURN_TEXT = `Return {md, json (absolute paths), sha_md, sha_json (sha256sum of each file), rule_ids (every rules[].id), class_ids (every classes[].id), ground_classes (the ground_classes keys), exempt_rules (rule ids used as exemptions), exempt_by_class ({<ground class>: its exempt_rule or ""}), forbidden_by_sheet ({<sheet>: [class ids forbidden on it]}), checklist_keys (the checklist keys whose value is an existing rule id), cited_claims (every claim id in any rules[].cites)}.`
const CHECK_TEXT = `Checklist (the json "checklist" must map every key to an existing rule id): brief items ${BRIEF_ITEMS.join(', ')}; v2 items ${V2_ITEMS.join(', ')}.`
const BIBLE_RULINGS = rulingText(RUL, ['R1', 'R2', 'R3', 'R5', 'R6', 'R8', 'R9', 'R10', 'R11', 'R17', 'R19', 'R20', 'R21', 'R22'])
phase('Synthesize')
let bible = await crit(P(`Integrate the density bible (brief p5 "1. Research": done when you can point at a blank hex and say which six things must appear on it before it is allowed to be empty).
Read: the research files listed below (claim ids <qid>-cNN); ${DOCS}/research-dossier.md sections 5-9; ${DOCS}/todo-inputs.json; the brief ${BRIEF} (Read tool, pages "1-8"); ${DOCS}/README.md section "Reuse map".
${EVIDENCE_NOTE()}
Struck claims (disproved by a verifier; never cite them): ${[...STRUCK].join(', ') || '(none)'}

Rulings:
${BIBLE_RULINGS}

${CHECK_TEXT}
${VOCAB_RULE}

Fixed ground (atlas px):
${FIXED_TEXT}

Write ${OUTABS}/density-bible.md and ${OUTABS}/density-bible.json (date "${DATE}").
${STRUCTURE}
${RETURN_TEXT}`), {label: 'bible integrator', phase: 'Synthesize', schema: INTEG, ...M('integ')})
if (!bible) return done({reason: 'agent died: bible integrator', owner_rulings_used: RUSED, gate: gateObj({rulings_used: RUSED, gaps: gapsResearch})})

async function checkBible(tag) {
  const [v, w] = await parallel([
    () => agent(P(`Validate the density bible. JSON.parse ${OUTABS}/density-bible.json and check that ${OUTABS}/density-bible.md exists. Check: the required keys (date, ground, rules, sheets, classes, ground_classes, no_dem_rule, layers, plates, city_grain, targets, prerequisites, checklist); unique rule ids; every sheets.*.must/forbidden id exists in rules; some class whose id or label matches /homestead/i has \"country\" AND \"region\" in its forbidden_on, sheets.country.forbidden is non-empty, and sheets.region.forbidden contains a rule id whose rule text forbids homesteads (homesteads wait for the valley sheet; sheet one is the region sheet); some class whose id or label matches /block/i has \"city\" in its forbidden_on and sheets.city.forbidden is non-empty; every ground_classes.*.six has 6 distinct existing class ids or an exempt_rule that exists in rules; every class has fiction_name, rank, source_kinds and instance_rule; no_dem_rule exists in rules; every checklist value is an existing rule id; the checklist has every one of these ${CHECKLIST.length} keys: ${CHECKLIST.join(', ')}. Write nothing. Return {ok (true only when nothing fails), failures: [one line per failed check, each naming the rule it breaks, e.g. \"homestead class must list country AND region in forbidden_on\", \"sheets.region.forbidden must include a rule forbidding homesteads (brief p8: Homesteads wait for the valley sheet)\", \"sheets.country.forbidden must be non-empty\", \"block class must list city in forbidden_on\", \"sheets.city.forbidden must be non-empty\"], checklist_keys (read from the file: every key of "checklist" whose value is an existing rule id), cited_claims (read from the file: every distinct string in any rules[].cites), sha_md and sha_json (sha256sum of ${OUTABS}/density-bible.md and ${OUTABS}/density-bible.json as they are now)}.`),
      {label: 'bible validator' + tag, phase: 'Synthesize', schema: VALID, ...M('mech')}),
    () => agent(P(`Vocabulary grep over the density bible. Use a short node script in a mktemp -d dir with the case-insensitive regex source ${JSON.stringify(VOCAB.source)} (flags "gi"). Scan ${OUTABS}/density-bible.md line by line, skipping the sections "## Provenance" and "## Renames" (a section runs to the next "## " heading), and every string value under a "fiction_name" or "label" key anywhere in ${OUTABS}/density-bible.json. Write nothing. Return {hits: ["<file>:<line or json path>: <matched word>", ...]} (empty when clean).`),
      {label: 'vocabulary grep' + tag, phase: 'Synthesize', schema: VHITS, ...M('mech')})
  ])
  if (!v) log('agent died: bible validator' + tag)
  if (!w) log('agent died: vocabulary grep' + tag)
  return {val: v, voc: w}
}
let chk = await checkBible('')

// ---- Blank-hex gate ----
const applyPrompt = h => P(`Blank-hex test for hex ${h.id}. You may read ONLY ${OUTABS}/density-bible.md, ${OUTABS}/density-bible.json, ${OUTABS}/gates/hexes.json, the crop ${OUTABS}/gates/hex/${h.id}.jpg, the data files the bible cites (under ${REPO}/maps-site/data/), and you may run node ${DEM_TOOL}; for a sim: ref you may grep ${REPO}/index.html or ${REPO}/maps-site/index.html. Open nothing else: the allowlist is enforced by the script from your files_read (anything outside it is a blind violation), so do not open the brief, docs/research/, the dossier, todo-inputs.json, the research files, the README or POLISH.
Find hex ${h.id} in hexes.json (its bbox, center and crop origin). The hex is read at the ${HEX_SHEET} sheet. Classify this hex into one of the bible's ground_classes using its criteria.
Then name exactly SIX things that must appear on it before it may be empty, each a distinct bible class. Give each as an instance on THIS hex: atlas x,y inside the hex (±16 px margin), a name if it has one ("" if none), and a source ref of one of these forms: dem:x,y | data:<file>#<name> | print:${h.id}@px,py (crop pixels) | mint:<class>:${h.id} | sim:<literal grep pattern> (source.kind = dem|data|print|mint|sim, source.ref = the part after the colon). The source must sit where the instance does: a dem ref's x,y is the instance x,y; a data entry's own coordinates (its point, or a vertex or segment of its line) lie on this hex (±16 px); a print ref's crop pixel is the instance (within 2 atlas px). A real entry from elsewhere on the map does not count. Cite the bible rule that requires each one. If the bible exempts this ground class, cite the exemption rule in exempt_rule and give no items; otherwise exempt_rule is "".
If you need something the bible does not give, set bible_silent true and list what is missing; otherwise bible_silent false and missing [].
List every file you opened in files_read (absolute paths). Return {hex: "${h.id}", ground_class, exempt_rule, items, bible_silent, missing, files_read}.`, true)
const resolvePrompt = (h, pair) => {
  const cx0 = h.bbox[0] - 32, cy0 = h.bbox[1] - 32
  const its = a => a ? JSON.stringify((a.items || []).map((it, idx) => ({idx, class: it.class, instance: it.instance, source: it.source}))) : 'no items'
  return P(`Resolve the blank-hex answers for hex ${h.id}: bbox ${h.bbox.join(',')}, accepted box (bbox ±16 px) x ${h.bbox[0] - 16}..${h.bbox[2] + 16}, y ${h.bbox[1] - 16}..${h.bbox[3] + 16}; crop ${OUTABS}/gates/hex/${h.id}.jpg is 384x384 with origin atlas (${cx0},${cy0}) at 4 px per atlas px.
For every item of applier A and of applier B check three things:
1. The source ref resolves: dem -> node ${DEM_TOOL} --at x,y (run from ${REPO}) prints a non-null h; data -> the named entry exists in that file under ${REPO}/maps-site/data/; print -> the crop exists and px,py lie inside 0..383; mint -> the class allows source kind "mint" and defines a mint key in ${OUTABS}/density-bible.json; sim -> grep -F finds the literal in ${REPO}/index.html or ${REPO}/maps-site/index.html.
2. The instance x,y lies inside the accepted box.
3. The source sits where the instance claims: dem -> the ref's x,y equals the instance x,y within 1 atlas px; data -> the entry's OWN atlas position lies inside the accepted box (a point entry by its x,y or atlasX,atlasY; a line entry such as named-ways / sea-lanes "pts" or a traced-roads polyline by any vertex inside the box or any segment crossing it; a chart-pois.json entry is in city-chart px and counts as lying at that city's atlasX,atlasY in city-anchors.json; an entry with no coordinates of its own, e.g. wiki-places, fails); print -> the crop px converted to atlas (x = ${cx0} + px/4, y = ${cy0} + py/4) lies within 2 atlas px of the instance x,y; mint and sim -> nothing more.
ok = all three hold; why names the first one that fails. Write nothing. Return {hex: "${h.id}", results: [{actor: "A"|"B", idx, ok, why}]}, one result per item.
Applier A items: ${its(pair[0])}
Applier B items: ${its(pair[1])}`)
}
const demProbePrompt = P(`Check the read-only probe ${DEM_TOOL}; write nothing. ${DEM_PROBE_TASK}`)
async function runGate(tag) {
  const probe = await agent(demProbePrompt, {label: 'dem probe' + tag, phase: 'Blank-hex gate', schema: DEMP, ...M('mech')})
  if (!probe) log('agent died: dem probe' + tag)
  if (probe && probe.exists === false) { log('dem tool missing: blank-hex gate skipped' + tag); return {probe, rows: [], skipped: 'dem tool missing'} }
  const rows = await pipeline(HX,
    h => parallel(['A', 'B'].map(X => () => agent(applyPrompt(h), {label: `${h.id} · applier ${X}${tag}`, phase: 'Blank-hex gate', schema: APPLY, ...M(X === 'A' ? 'deep' : 'judge')}))),
    (pair, h) => agent(resolvePrompt(h, pair), {label: `${h.id} · resolver${tag}`, phase: 'Blank-hex gate', schema: RESOLVE, ...M('mech')}).then(res => ({h, A: pair[0], B: pair[1], res})))
  return {probe, rows, skipped: ''}
}

function evaluate(bib, ck, gate) {
  const rule = new Set(bib.rule_ids || []), cls = new Set(bib.class_ids || []), gcs = new Set(bib.ground_classes || []), exr = new Set(bib.exempt_rules || [])
  const exBy = bib.exempt_by_class || {}, forb = new Set((bib.forbidden_by_sheet || {})[HEX_SHEET] || [])
  const died = [], blindHits = [], silentHexes = []
  const hx = HEXES.map((h, i) => {
    const row = gate.rows[i] || null
    const results = row && row.res && Array.isArray(row.res.results) ? row.res.results : []
    if (!row) died.push(gate.skipped ? `${h.id}: ${gate.skipped}` : `agent died: ${h.id} (no row)`)
    else if (!row.res) died.push(`agent died: ${h.id} resolver`)
    const s = {id: h.id, crop: cropIds.has(h.id), valid: {}, why: {}, exempt: {}, classes: {}, items: {}, resolved: {}, gc: {}, silent: false}
    for (const X of ['A', 'B']) {
      const a = row ? row[X] : null, why = []
      s.classes[X] = []; s.items[X] = 0; s.resolved[X] = 0; s.exempt[X] = ''; s.gc[X] = a ? a.ground_class : null
      if (!a) { why.push(row ? `agent died: ${h.id} applier ${X}` : 'no answer'); if (row) died.push(`agent died: ${h.id} applier ${X}`); s.valid[X] = false; s.why[X] = why; continue }
      const items = (Array.isArray(a.items) ? a.items : []).filter(Boolean)
      const bad = blindBad(a.files_read, APPLIER_ALLOWED)
      if (bad.length) { why.push('blind: ' + bad.join(', ')); bad.forEach(p => blindHits.push(`${h.id}/${X}: ${p}`)) }
      if (a.bible_silent === true) { s.silent = true; silentHexes.push(`${h.id}/${X}: ${(a.missing || []).join('; ')}`) }
      if (!gcs.has(a.ground_class)) why.push('ground class not in bible: ' + a.ground_class)
      const ex = String(a.exempt_rule || '').trim()
      s.exempt[X] = ex; s.classes[X] = items.map(it => it.class); s.items[X] = items.length
      if (ex) {
        if (!EXEMPT_OK.has(h.id)) why.push(`exemption ${ex} on ${h.id}: only ${[...EXEMPT_OK].join(', ')} (open sea, no DEM) may be exempt`)
        else if (!exr.has(ex) || exBy[a.ground_class] !== ex) why.push(`exemption ${ex} is not the bible exemption of ${a.ground_class}`)
      }
      else {
        const cs = new Set(s.classes[X])
        if (items.length !== 6 || cs.size !== 6) why.push(`${items.length} items, ${cs.size} distinct classes (6 required)`)
        const unk = [...cs].filter(c => !cls.has(c)); if (unk.length) why.push('unknown classes: ' + unk.join(', '))
        const fb = [...cs].filter(c => forb.has(c)); if (fb.length) why.push(`forbidden on the ${HEX_SHEET} sheet: ` + fb.join(', '))
        const ur = items.map(it => it.rule).filter(r => !rule.has(r)); if (ur.length) why.push('unknown rules: ' + ur.join(', '))
      }
      s.resolved[X] = new Set(results.filter(r => r && r.actor === X && r.ok === true && Number.isInteger(r.idx) && r.idx >= 0 && r.idx < items.length).map(r => r.idx)).size
      s.valid[X] = why.length === 0; s.why[X] = why
    }
    const a = row && row.A, b = row && row.B
    s.same_gc = !!(a && b && a.ground_class === b.ground_class)
    s.isExempt = !!(EXEMPT_OK.has(h.id) && s.exempt.A && s.exempt.A === s.exempt.B && s.valid.A && s.valid.B)
    s.agree = !(a && b) ? 0 : (EXEMPT_OK.has(h.id) && s.exempt.A && s.exempt.A === s.exempt.B) ? 6 : new Set(s.classes.A.filter(c => s.classes.B.includes(c))).size
    s.ok3 = s.crop && s.valid.A && s.valid.B && s.same_gc
    if (!s.crop) died.push(`${h.id}: crop missing`)
    return s
  })
  const N = HEXES.length
  const n3 = hx.filter(s => s.ok3).length
  const n5 = hx.filter(s => s.agree >= 5).length, minAgree = Math.min(...hx.map(s => s.agree))
  const below = [], tally = [0, 0]
  for (const s of hx) if (!s.isExempt) for (const X of ['A', 'B']) {
    if (s.resolved[X] < 5) below.push(`${s.id}/${X} ${s.resolved[X]}/6`)
    tally[0] += s.resolved[X]; tally[1] += Math.max(6, s.items[X])
  }
  const pct = tally[1] ? Math.round(1000 * tally[0] / tally[1]) / 10 : 0   // nothing scored is a fail, never 100%
  const {val, voc} = ck   // G1.2 and G1.8 are scored from the validator's reading of density-bible.json; the integrator's self-report only cross-checks it
  const ckKeys = new Set(val ? val.checklist_keys || [] : []), ckMiss = CHECKLIST.filter(k => !ckKeys.has(k))
  const ckSelf = CHECKLIST.filter(k => (bib.checklist_keys || []).includes(k) && !ckKeys.has(k))
  const citedStruck = val ? [...new Set(val.cited_claims || [])].filter(c => STRUCK.has(c)) : []
  const citedSelf = (bib.cited_claims || []).filter(c => STRUCK.has(c) && !citedStruck.includes(c))
  const rowsK = kept(gate.rows, 'blank-hex').k
  const rowsN = gate.skipped ? HX.length : gate.rows.length
  const fan = [['research+verify', cov.rn, cov.rk], ['verify lenses', cov.ln, cov.lk], ['blank-hex rows', rowsN, rowsK.length],
    ['appliers', 2 * rowsN, rowsK.reduce((n, r) => n + (r.A ? 1 : 0) + (r.B ? 1 : 0), 0)], ['resolvers', rowsN, rowsK.filter(r => r.res).length],
    ['crops', N, HEXES.filter(h => cropIds.has(h.id)).length]]
  const fanBad = fan.filter(([, n, k]) => k < Math.ceil(n * 0.75))
  const p = gate.probe
  const demOk = demPass(p)
  const shaOk = !!val && HEX64.test(val.sha_md || '') && HEX64.test(val.sha_json || '') && val.sha_md === bib.sha_md && val.sha_json === bib.sha_json
  const xc = (xs, what) => xs.length ? `; integrator self-report also claims ${what}: ${xs.join(', ')}` : ''
  const criteria = [
    C('G1.1', 'bible files exist + validator ok', !val ? 'agent died: bible validator' : (val.ok ? 'ok' : 'failures: ' + (val.failures || []).join('; ')) + (shaOk ? '' : '; bible sha256 mismatch or malformed (validator vs integrator/patcher)'), 'ok && failures=[] && validator sha256 = integrator sha256 (64-hex) for both bible files', shaOk && !!val && val.ok === true && (val.failures || []).length === 0),
    C('G1.2', 'brief + v2 checklist covered (validator read of density-bible.json)', !val ? 'agent died: bible validator' : `${CHECKLIST.length - ckMiss.length}/${CHECKLIST.length}` + (ckMiss.length ? ' missing: ' + ckMiss.join(', ') : '') + xc(ckSelf, 'keys the file lacks'), `${CHECKLIST.length}/${CHECKLIST.length} keys -> existing rule ids`, !!val && ckMiss.length === 0),
    C('G1.3', 'both appliers valid on every hex; same ground class', `${n3}/${N}` + (gate.skipped ? ' (' + gate.skipped + ')' : '') + (died.length ? '; ' + died.join('; ') : ''), `${N}/${N}`, !gate.skipped && n3 === N),
    C('G1.4', 'class agreement', `${n5}/${N} hexes >=5/6; min ${minAgree}/6`, `>=5/6 on >=${N - 2}/${N} AND >=4/6 on all ${N}`, n5 >= N - 2 && minAgree >= 4),
    C('G1.5', 'instance resolution', (below.length ? 'below 5/6: ' + below.join(', ') + '; ' : '') + `overall ${pct}%`, `each applier >=5/6 on every non-exempt hex (only ${[...EXEMPT_OK].join(', ')} may be exempt); overall >=90%`, !gate.skipped && !below.length && pct >= 90),
    C('G1.6', 'bible silence', silentHexes.length ? silentHexes.join(' | ') : (gate.skipped ? 'gate skipped' : 0), 0, !gate.skipped && silentHexes.length === 0),
    C('G1.7', 'vocabulary', !voc ? 'agent died: vocabulary grep' : (voc.hits || []).length ? voc.hits.join(' | ') : 0, 0, !!voc && (voc.hits || []).length === 0),
    C('G1.8', 'struck claims (validator read of rules[].cites)', !val ? 'agent died: bible validator' : citedStruck.length || citedSelf.length ? (citedStruck.join(', ') || 'none') + xc(citedSelf, 'struck cites') : 0, 'none cited', !!val && citedStruck.length === 0 && citedSelf.length === 0),
    C('G1.9', 'blind compliance (allowlist check on self-reported files_read; not a guarantee)', blindHits.length ? blindHits.join(' | ') : (gate.skipped ? 'gate skipped' : 0), 'zero reads outside APPLIER_ALLOWED', !gate.skipped && blindHits.length === 0),
    C('G1.10', 'coverage', fan.map(([w, n, k]) => `${w} ${k}/${n}`).join('; '), 'every fan-out >=75% kept', fanBad.length === 0),
    C('G1.11', 'DEM probe', !p ? 'agent died: dem probe' : p.exists === false ? 'dem tool missing' : `summit ${p.at_summit}, Aldorūs ${p.at_aldorus}, F08 hmax ${p.f08_hmax}, F01 ${p.f01_hmin}..${p.f01_hmax}, ${p.sha_run1 === p.sha_run2 ? 'same sha' : 'sha differs'}`,
      DEM_LIT + '; two runs same sha', demOk)
  ]
  const needJudge = !gate.skipped && (hx.some(s => s.agree < 5 || !s.valid.A || !s.valid.B) || silentHexes.length > 0)
  return {criteria, hx, n5, pct, ckN: CHECKLIST.length - ckMiss.length, needJudge}
}
const failing = ev => ev.criteria.filter(c => !c.pass)
async function ambiguity(ev, gate, tag) {
  if (!ev.needJudge) return {gaps: gate.skipped ? [{hex: '*', section: 'tools', what: gate.skipped}] : []}
  const bad = ev.hx.filter(s => s.agree < 5 || !s.valid.A || !s.valid.B || s.silent).map(s => {
    const row = gate.rows[HEXES.findIndex(h => h.id === s.id)] || null
    const ans = X => row && row[X] ? {ground_class: row[X].ground_class, exempt_rule: row[X].exempt_rule, classes: s.classes[X], rules: (row[X].items || []).map(it => it && it.rule), bible_silent: row[X].bible_silent, missing: row[X].missing} : null
    return {hex: s.id, note: hexById(s.id).note, agree: s.agree, A: ans('A'), B: ans('B'), invalid: {A: s.why.A, B: s.why.B}}
  })
  return crit(P(`The blank-hex gate found ambiguous or failing hexes. Read the bible ${OUTABS}/density-bible.md and ${OUTABS}/density-bible.json. For each failing hex below, find the bible section that left the two blind appliers disagreeing, silent or invalid, and say what that section is missing (a missing class, a ground-class criterion that does not decide, an unstated exemption, an unclear source rule...). Write nothing. Return {gaps: [{hex, section, what}]}.
Failing rows:
${JSON.stringify(bad, null, 1)}`), {label: 'ambiguity judge' + tag, phase: 'Blank-hex gate', schema: AMBIG, ...M('judge')})
}

phase('Blank-hex gate')
let gate = await runGate('')
let ev = evaluate(bible, chk, gate)
let amb = await ambiguity(ev, gate, '')
const partialGate = (rounds, extraGaps) => gateObj({criteria: ev.criteria, rounds, rulings_used: RUSED, gaps: gapsResearch.concat(extraGaps || []), hex_notes: HEXES})
if (!amb) return done({reason: 'agent died: ambiguity judge', owner_rulings_used: RUSED, gate: partialGate(0)})
let gapsGate = amb.gaps.map(g => `${g.hex} § ${g.section}: ${g.what}`)

// ---- Follow-up (bounded by ROUNDS; dedup by norm(question)) ----
const seenQ = new Set(((pre.ledger && pre.ledger.seen_questions) || []).map(norm))
QUESTIONS.forEach(q => seenQ.add(norm(q.question)))
// Follow-up qids are f<round><n> (n one digit: FU_MAX_Q <= 9) with rounds numbered on from the ledger, so a qid (and its struck claim ids) never repeats across runs.
const FQ = /^f(\d+)\d$/
const RBASE = Math.max(0, ...LEDGER.map(x => FQ.exec(x.qid)).filter(Boolean).map(m => Number(m[1])))
const TOOL_Q = QUESTIONS.find(q => q.tool)
let rounds = 0
while (failing(ev).length && rounds < ROUNDS) {
  if (budget && budget.total && budget.remaining() < ROUND_TOKENS) { log(`budget: ${budget.remaining()} tokens left < ${ROUND_TOKENS}; follow-up round skipped`); break }
  const rr = rounds + 1, tag = ' r' + rr, fr = RBASE + rr
  phase('Follow-up')
  const demFail = failing(ev).find(c => c.id === 'G1.11')
  const fails = failing(ev).map(c => `${c.id} ${c.desc}: ${c.measured}`)
  const askMax = FU_MAX_Q - (demFail ? 1 : 0)
  const critic = await agent(P(`Completeness critic for the density bible (follow-up round ${rr}). The blank-hex gate failed.
Failing criteria:
${fails.join('\n')}
Gaps (bible sections + research gaps):
${gapsGate.concat(gapsResearch).join('\n') || '(none)'}
Already asked (normalized; never repeat one of these):
${[...seenQ].join('\n')}
Read ${OUTABS}/density-bible.md and, as needed, the trusted research files below.
${EVIDENCE_NOTE()} Emit at most ${askMax} follow-up research questions that would close these gaps: each ONE targeted question with reads (repo-relative paths; brief pages named, e.g. docs/research/filigree-for-the-table.pdf (Read pages:"2")), role (mech | triage | audit | deep | judge: deep for vision walks and tools, audit for code reading, judge for interpretation, mech for counts) and lens (at most one of anchor | second-look | refute | recount | canon; [] for none). qid = "f${fr}<n>" (the script renumbers). Wording and structure problems in the bible are not research questions: the patcher runs and the gate re-runs every round, so return an empty list when every gap is one of those. ${demFail ? 'G1.11 (the DEM probe) is not yours: the script queues a probe rewrite itself. ' : ''}Write nothing. Return {questions}.`),
  {label: 'completeness critic' + tag, phase: 'Follow-up', schema: CRITIC, ...M('judge')})
  if (!critic) { log('agent died: completeness critic' + tag + '; follow-up stopped'); break }
  const fresh = []
  if (demFail && TOOL_Q) fresh.push({...TOOL_Q, qid: `f${fr}1`, short: 'probe rewrite',   // no other question carries the tool task, so G1.11 is closed here or not at all
    question: `The DEM probe ${DEM_REL} failed G1.11 (${demFail.measured}). Rewrite it so it is deterministic and reproduces every literal, then report what it prints for --bbox of each fixture hex inside the window.`})
  for (const q of critic.questions || []) {
    const k = norm(q && q.question)
    if (!k || seenQ.has(k) || fresh.length >= FU_MAX_Q) continue
    seenQ.add(k)
    fresh.push({qid: `f${fr}${fresh.length + 1}`, short: 'follow-up', question: q.question, reads: (q.reads || []).length ? q.reads : ['(choose the sources)'],
      role: PAIR[q.role] && q.role !== 'integ' ? q.role : 'audit', lens: [...new Set((q.lens || []).filter(L => L in LENS_ROLE))].slice(0, FU_MAX_LENS)})
  }
  rounds = rr
  log(`follow-up round ${rr}: ${fresh.length} fresh question(s)` + (fresh.length ? '' : '; patch + re-gate only'))
  const got = fresh.length ? await researchRound(cap(fresh), tag) : []
  bible = await crit(P(`Patch the density bible (follow-up round ${rr}). Edit ONLY the bible sections named in the gaps below; never renumber or reuse rule ids (append new ids after the highest); keep both files consistent.
Files: ${OUTABS}/density-bible.md and ${OUTABS}/density-bible.json (re-stamp date "${DATE}").
New research: ${!fresh.length ? '(none asked this round: patch the wording and structure gaps below)' : got.map(x => x.r.path).join(', ') || '(none survived)'}.
${EVIDENCE_NOTE()}
Gaps:
${gapsGate.concat(fails).join('\n')}
Struck claims (never cite them): ${[...STRUCK].join(', ') || '(none)'}

Rulings:
${BIBLE_RULINGS}

${CHECK_TEXT}
${VOCAB_RULE}
${STRUCTURE}
${RETURN_TEXT}`), {label: 'bible patcher' + tag, phase: 'Follow-up', schema: INTEG, ...M('judge')})
  if (!bible) return done({reason: 'agent died: bible patcher' + tag, rounds, owner_rulings_used: RUSED, gate: partialGate(rounds, gapsGate)})
  chk = await checkBible(tag)
  gate = await runGate(tag)
  ev = evaluate(bible, chk, gate)
  amb = await ambiguity(ev, gate, tag)
  if (!amb) return done({reason: 'agent died: ambiguity judge' + tag, rounds, owner_rulings_used: RUSED, gate: partialGate(rounds)})
  gapsGate = amb.gaps.map(g => `${g.hex} § ${g.section}: ${g.what}`)
}

// ---- Record ----
phase('Record')
const fails = failing(ev)
const gapsFinal = gapsGate.concat(gapsResearch)
const shaRec = k => (chk.val && HEX64.test(chk.val[k] || '') && chk.val[k]) || bible[k]   // the validator's hash is the independent read; G1.1 fails when it differs
const gateRec = gateObj({criteria: ev.criteria, rounds, rulings_used: RUSED, gaps: gapsFinal, hex_notes: HEXES,
  artifacts: [{path: OUT + '/density-bible.md', sha256: shaRec('sha_md')}, {path: OUT + '/density-bible.json', sha256: shaRec('sha_json')}, {path: OUT + '/gates/hexes.json', sha256: crop.sha256}]})
const answer = a => a ? {ground_class: a.ground_class, exempt_rule: a.exempt_rule, bible_silent: a.bible_silent, items: a.items} : null
const hexAnswers = {job: JOB, date: DATE, mode: MODE, rounds, hexes: HEXES.map((h, i) => {
  const row = gate.rows[i] || null, s = ev.hx[i]
  return {id: h.id, bbox: h.bbox, agree: s.agree, valid: s.valid, resolved: s.resolved, A: answer(row && row.A), B: answer(row && row.B)}
})}
const unverifiedQ = new Set(resAll.filter(x => x.lensDrops > 0).map(x => norm(x.q.question)))   // a question whose verify lens died stays out of the ledger, so the next run re-asks and re-verifies it
const stateRec = {job: JOB, date: DATE,
  questions: resumed.filter(x => !resAll.some(y => y.q.qid === x.qid)).map(x => ({qid: x.qid, path: x.path, sha256: x.sha256, claim_ids: x.claim_ids || [], struck: x.struck || []}))
    .concat(resAll.filter(x => x.lensDrops === 0).map(x => ({qid: x.q.qid, path: x.r.path, sha256: x.r.sha256, claim_ids: (x.r.claims || []).map(c => c.id), struck: x.struck}))),
  seen_questions: [...seenQ].filter(k => !unverifiedQ.has(k)), bible_sha: {md: shaRec('sha_md'), json: shaRec('sha_json')}}
const recs = [
  await recordD('gates/1-research.json', gateRec, 'record gate'),
  await recordD('gates/1-hex-answers.json', hexAnswers, 'record hex answers'),
  await recordD('state/1-research.json', stateRec, 'record ledger')
]
const reason = recs.some(r => !r) ? 'record-mismatch' : gateRec.pass ? '' : (fails.map(c => c.id).join(',') || (MODE === 'full' ? '' : MODE))
const polishInserts = gateRec.pass ? [] : fails.map(c => `- [ ] **Filigree gap — close ${c.id} (${c.desc}); measured values are in gates/1-research.json** (blocks Filigree 2; place directly above it; skip if already queued)`)
  .concat(gapsGate.length ? ['- [ ] **Filigree gap — resolve the bible-silence and ambiguity gaps listed in gates/1-research.json "gaps"** (blocks Filigree 2; place directly above it; skip if already queued)'] : []).slice(0, 12)
return done({pass: gateRec.pass && !recs.some(r => !r), reason, rounds,
  outputs: [OUT + '/density-bible.md', OUT + '/density-bible.json', OUT + '/gates/hexes.json', OUT + '/gates/hex/', OUT + '/gates/1-research.json', OUT + '/gates/1-hex-answers.json', OUT + '/research/', DEM_REL],
  gate_path: OUT + '/gates/1-research.json', owner_rulings_used: RUSED,
  polish_note: (gateRec.pass ? '' : 'on a failed gate each retry may re-add the polish_inserts: skip any whose title is already queued. ') + `density bible: ${(bible.rule_ids || []).length} rules, ${ev.n5}/${HEXES.length} hexes agree ≥5/6, ${ev.pct}% instances resolve, checklist ${ev.ckN}/${CHECKLIST.length} (round ${rounds})`,
  polish_inserts: polishInserts,
  changelog_line: '- docs: Filigree 1 — density bible for Leponnia (blank-hex gate ' + (gateRec.pass ? 'pass' : 'fail') + ')',
  gate: gateRec})
