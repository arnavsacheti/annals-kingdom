export const meta = {
  name: 'street-2-plan',
  description: 'Street 2: turn the street bible into a street spec with build units in slices S0-S4; gate = cold-engineer test',
  whenToUse: 'Run as the POLISH item "Street 2 · Planning → street spec" after docs/street/gates/1-research.json passed: Workflow({name:"street-2-plan", args:{date:"YYYY-MM-DD"}}). Docs-only.',
  phases: [
    {title: 'Preflight', detail: 'drift check, anchors, chain (Street 1 pass, bible unchanged, filigree bible + cited rulings unchanged), ledger'},
    {title: 'Probes', detail: 'frozen before the spec exists: 28-36 probes + readback; the tidings fixture'},
    {title: 'Sections', detail: 'one writer per section -> spec/<sid>.md + .json fragment; anchor check; triage fixer'},
    {title: 'Integrate', detail: 'opus/xhigh integrator -> street-spec.md/.json; red team; patcher'},
    {title: 'Units', detail: 'unit planner -> /units in slices S0-S4 with machine-checkable acceptance'},
    {title: 'Check', detail: 'spec reader (mechanical read-back, incl. the limits Street 3 gates on), anchor + filigree-literal guard, leak grep, vocabulary grep'},
    {title: 'Cold-engineer gate', detail: 'two blind readers (sonnet/high + opus/high) answer the frozen probes from the spec alone; guess auditors; scoring in code'},
    {title: 'Fix', detail: 'spec fixer -> re-read -> re-gate (<= maxRounds)'},
    {title: 'Record', detail: 'gates/2-plan.json, state/2-plan.json (the ledger is also checkpointed after Probes and after Sections, and on a stop with unrecorded work)'}
  ]
}
const JOB = 'street-2-plan'
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
  ST4: "Randomness: every street choice comes from a keyed stream makeStream(W.seed+':st:'+cls+':'+id+':'+day) (the sim's own xmur3 -> sfc32 idiom, index.html function makeStream), cached per key; presentation time is ST.t accumulated from dt only; the STREET block never names W.rng, the ambient random generator, or any wall-clock or high-resolution timer (nowMs included).",
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
checkArgs(['streetRulings', 'port'])

// ---- constants (design §3, literal) ----
const SLICES = ['S0', 'S1', 'S2', 'S3', 'S4']
const SLICE_NAME = {S0: 'instrument', S1: 'streaming', S2: 'near detail', S3: 'life', S4: 'sky and layers'}
const SECTIONS = [
  {sid: 's01', title: 'Tiers, refine rule, hysteresis, fade', owns: ['/tiers', '/fade'], R: ['R6'], ST: ['ST2', 'ST4'], role: 'judge'},
  {sid: 's02', title: 'Streaming queue, budget, LRU, culling', owns: ['/stream'], R: [], ST: ['ST8', 'ST9'], role: 'judge'},
  {sid: 's03', title: 'Near facades, street surface, sub-cell ground', owns: ['/facades', '/surface', '/ground'], R: ['R22'], ST: ['ST2', 'ST12'], role: 'deep'},
  {sid: 's04', title: 'Instanced props and crowds', owns: ['/props', '/crowds'], R: [], ST: ['ST4', 'ST13'], role: 'audit'},
  {sid: 's05', title: 'Render-only caravans: tiers, spacing, obstacles, gate leaves', owns: ['/traffic', '/gates'], R: [], ST: ['ST3', 'ST4', 'ST5', 'ST6'], role: 'judge'},
  {sid: 's06', title: 'Sky: cloud deck, shadows row, weather dial, the R13 fog copy', owns: ['/sky', '/fog', '/weather'], R: ['R13'], ST: ['ST4', 'ST7', 'ST11', 'ST19'], role: 'audit'},
  {sid: 's07', title: 'Layers rows, hash and parser, notices (the herald\'s tidings)', owns: ['/layers', '/hash', '/notices'], R: ['R12', 'R18'], ST: ['ST7', 'ST18'], role: 'audit'},
  {sid: 's08', title: 'Caps per view and the probe contract', owns: ['/caps', '/probe'], R: [], ST: ['ST8'], role: 'deep'},
  {sid: 's09', title: 'Determinism contract, the STREET block, hook lines, static checks', owns: ['/determinism', '/block', '/hook_lines', '/static'], R: [], ST: ['ST1', 'ST3', 'ST4'], role: 'judge'},
  {sid: 's10', title: 'Checks per slice and fixtures', owns: ['/checks', '/fixtures'], R: [], ST: [], role: 'deep'}
]
const MANDATORY_CHECKS = ['street.fingerprint', 'street.off_identity', 'street.caps', 'street.static_clock', 'street.static_rng',
  'street.instance_color', 'street.fil_anchors', 'street.untouched', 'street.console', 'street.hooks', 'street.keydown', 'street.stats_keys']   // every slice
const SLICE_CHECKS = {S0: ['street.hash_table'], S1: ['street.fade', 'street.swaps', 'street.paths'], S3: ['street.vfps', 'street.spacing', 'street.caravan_tiers'], S4: ['street.clouds', 'street.shadows_row', 'street.weather_dial', 'street.tidings', 'street.folk_row']}   // + 'street.fog_copy' when the fog unit exists
const MANDATORY_UNITS = {
  'S0.U00': 'the STREET block (one namespace const STREET, placed per /block/placement) + the ANNALS.street getter hook (on, set, stats, settledHash, queueHash, parseHash, pinDegrade) + the default-off master row + street=1 read',
  'S0.U01': 'probe extension: --layers street=1 (and street=0 now asserts ANNALS.street absent OR stats().objects === 0), metrics classes/appear/swaps/jobs/resident, path builds/jobs/resident, --paths and --vfps accept comma lists (--paths descent,oscillate,flyaway; --vfps 30,60) with --queue-hash <t>, --hash-table, --phone, device degrade_step; Street 1 literals unchanged (acceptance re-measures baseline.json fields exactly); S4 units add --tidings, --sky, --fog-pairs',
  'S0.U02': 'hash parser (ST18): both seed parse sites anchored to (?:^#|&)s=; every #s= writer keeps the other params',
  'S4.Ufog': 'the R13 fog copy (only when q09 found the function; otherwise a recorded gap, no unit)',
  'S4.Unotices': 'notices reader for notices=<url> (after S0.U02) drawing shut ways and muster days from the R12 schema'}
const UNIT_FILES_OK = /^(index\.html|tools\/street-probe\.js|docs\/street\/(fixtures|shots|device)(\/[^\/.][^\/]*)+)$/
const UNIT_PATH_BAD = f => typeof f !== 'string' || /\\|^\.\/|\/\/|(^|\/)\.{1,2}(\/|$)|\s/.test(f)   // a '.' or '..' segment, backslash, './' lead or empty segment slips past the anchored regexes
const UNIT_FILES_BAD = /^(maps-site\/|docs\/filigree\/|\.claude\/|tools\/filigree-|tools\/street-drift\.js$|docs\/street\/(gates|state|research)\/|docs\/street\/(street-bible|street-spec)\.|docs\/street\/rulings\.json$|server\.js$|POLISH\.md$|CHANGELOG\.md$|VERSION$)/
const PARAM_OK = p => /^[a-z]+$/.test(p) && !/s$/.test(p) && !['s', 'goto', 'filigree'].includes(p)
const HASH_TABLE_MIN = ['#s=epeshu', '#s=a&goto=B', '#goto=B&s=a', '#notices=u&s=a', '#s=a&street=1', '#street=1', '#notices=u']
const LEAK_RE = 'Tokyo|PLATEAU|jeantimex|OpenStreetMap|\\bOSM\\b|\\bGSI\\b|3D ?Tiles|BatchedMesh|FXMaster|movsim|Foundry'
const LEAK_RULE = 'Source and repository names (the regex /' + LEAK_RE + '/i) may appear only in a final "## Provenance" section of a .md file, never in any string of a json file.'
const PROBES_MIN = 28, PROBES_MAX = 36
const MANDATORY_PROBES = ['P-tier-SV5', 'P-key-crowd', 'P-hash-param', 'P-departDay', 'P-fade-ms', 'P-near', 'P-parser', 'P-dark-hour', 'P-shadows-default', 'P-fog-source', 'P-stats-keys', 'P-hook-marker']
const READER_ALLOWED = [OUTABS + '/street-spec.md', OUTABS + '/street-spec.json']
const ROUND_TOKENS = 600000
const SPEC_MD = OUTABS + '/street-spec.md', SPEC_JSON = OUTABS + '/street-spec.json', PROBES = OUTABS + '/gates/2-probes.json', TIDINGS = OUTABS + '/fixtures/tidings.json'

// ---- W2-local constants (not in the design's §3 list; each one restates a design rule the script needs as data) ----
const BIBLE_MD = OUTABS + '/street-bible.md', BIBLE_JSON = OUTABS + '/street-bible.json'
const VIEWS_JSON = OUTABS + '/gates/views.json', BASELINE = OUTABS + '/gates/baseline.json', GATE1 = OUTABS + '/gates/1-research.json'
const FIL_BIBLE = FIL + '/density-bible.json', FIL_SPEC = FIL + '/sheet-spec.json', Q09 = OUTABS + '/research/q09.json'
const LEDGER = OUTABS + '/state/2-plan.json', GATE2 = OUTABS + '/gates/2-plan.json'
const HOOK_MARK = '/*ST-HOOK*/'
const PROBE_KINDS = ['number', 'enum', 'string', 'order', 'pointer']
const PROBE_SOURCES = ['bible', 'views', 'baseline', 'ruling', 'spec']
const ACC_KINDS = ['node', 'grep', 'json', 'probe']
const UNIT_KINDS = ['logic', 'tool', 'doc']
const CAP_METRICS = ['calls', 'tris', 'objects', 'quads_per_frame', 'built_tris_per_frame', 'resident_tris']
const CAP_VIEWS = ['SV1', 'SV2', 'SV3', 'SV4', 'SV5', 'SV6', 'SV7', 'SV8', 'SV9']
const ALLOWED_SOURCES = ['keyed-hash', 'sim-read-only']
const HOOKS_MAX = 16, UNITS_PER_SLICE = 9, SPEC_PROBES_MIN = 12, READER_PCT = 90
const MESH_HI = 2200   // the settlement meshHi band: every hysteresis radius stays inside it (s01)
const HEX64 = /^[0-9a-f]{64}$/
const ST_ANCHOR_LITS = ANCHORS.filter(a => a[0] === 'index.html' && a[2] === 1).map(a => a[1])   // the street flag-1 literals a hook line must never touch
const EXPECT_GRAMMAR = 'an exact string; "re:<regex>"; "==N", "<=N" or ">=N" (the output is one number); or "json:<value>" (the output parses to the same JSON, keys sorted)'
const DET_RULE = `Determinism (ST3, ST4): street code takes every random choice from the sim's keyed stream ${KEY_IDIOM} (index.html function makeStream = xmur3 -> sfc32; the sim has no mulberry32), cached per key, render-only; presentation time accumulates from dt only (ST.t); gen and sim code never call the unseeded random function, the wall-clock date reader or the high-resolution timer, and the STREET block never names W.rng or nowMs; street code moves only mesh transforms (departDay, route and speed are never touched); no new sim state.`
const NO_PROBE_TALK = 'Never mention gates, probes, readers, scores or tests of this spec in the spec text: it must read as a self-sufficient engineering document.'

// ---- schemas (design §4; atoms exactly as in workflow-1 §3.3) ----
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
// W2-local functions (probe checks, evaluate, the gate runners) are defined below; they are not shared with W1, W3 or W4
const ANY = {type: ['string', 'number', 'boolean', 'array', 'object', 'null']}
const PRE2 = OBJ({missing: SA, anchors: ANCH, fil_anchors: FILANCH, drift: DRIFT,
  gate1: OBJ({exists: B, pass: B, mode: S, forced: B, md_ok: B, json_ok: B, fil_bible_sha256: S, fil_rulings_cited: {type: 'object', additionalProperties: S}, bible_sha256: S}),
  fil_bible_sha256_now: S, fil_overrides: {type: 'object', additionalProperties: S}, st_overrides: {type: 'object', additionalProperties: S},
  fil_notices: OBJ({exists: B, source: S}),   // source: 'sheet-spec /contracts/notices' | 'maps-site/data/<file>' | ''
  fog: OBJ({exists: B, name: S}),             // from research/q09.json via the bible
  ledger: OBJ({sections: {type: 'array', items: OBJ({sid: S, path: S, sha256: S, md: S, sha_md: S, sha_ok: B, stamp: S})}, probes_sha256: S, tidings_sha256: S, tidings_schema_source: S, tidings_shut_ways: I, tidings_muster_days: I}),
  probes: OBJ({exists: B, frozen: B, sha256: S, bible_sha256: S, rulings_stamp: S, n: I}),
  tidings: OBJ({exists: B, frozen: B, sha256: S}),
  gate_prev: OBJ({exists: B, pass: B, mode: S, forced: B, bible_sha256: S, fil_bible_sha256: S, rulings_stamp: S, spec_ok: B}),
  views_ok: B, baseline_ok: B, spec_exists: B})
const PROBEW = OBJ({path: S, sha256: S, parsed: B, n: I})
const PROBE_ITEM = OBJ({id: S, q: S, kind: S, options: SA, answer: ANY, tol: NN, pointer: S, source: S}, ['id', 'q', 'kind', 'source'])
const PROBERB = OBJ({ok: B, failures: SA, sha256: S, n: I, ids: SA, canon_len: I, probes: {type: 'array', items: PROBE_ITEM}})   // + probes: the script scores and asks from the file's own array
const TIDE = OBJ({path: S, sha256: S, parsed: B, schema_source: S, shut_ways: I, muster_days: I})
const SECW = OBJ({sid: S, md: S, json: S, sha_md: S, sha_json: S, pointers: SA, anchors: SA, open: SA})
const ANCHK = OBJ({sid: S, lost: SA})
const INTEG2 = OBJ({md: S, json: S, sha_md: S, sha_json: S, rule_ids: SA})
const RED = OBJ({contradictions: {type: 'array', items: OBJ({a: S, b: S, what: S, severity: {type: 'string', enum: ['blocking', 'minor']}})}})
const UNITW = OBJ({units_n: I, per_slice: {type: 'object', additionalProperties: I}, sha_json: S})
const READER = OBJ({   // the spec reader's read-back: the ONLY source the script scores structure from
  units: {type: 'array', items: OBJ({id: S, slice: S, kind: S, files: SA, deps: SA, covers: SA, hooks: SA, acceptance_n: I, acceptance_ok: B})},
  dag_ok: B, cyclic: SA, untraced_bible_must: SA, rules_without_unit: SA,
  checks: {type: 'object', additionalProperties: SA}, checks_malformed: SA,
  caps: {type: 'object', additionalProperties: {type: 'object', additionalProperties: NN}},
  caps_ceiling_over: SA, far_quiet_ok: B,
  determinism: OBJ({allowed_sources: SA, new_sim_state: SA, key_idiom: S, rng_in_acceptance: SA}),
  hash: OBJ({params: SA, consumes: SA, table: SA}),
  hook_lines: {type: 'array', items: OBJ({line: S, replaces: {type: ['string', 'null']}})}, hook_map_ok: B,
  block: OBJ({placement: S, namespace: S}),
  fog_unit: B, notices_unit: B,
  limits: OBJ({fade_ms: NN, max_jobs_frame: NN, tri_cap_frame: NN, resident_tris: NN, s0: NN, T: NN, v0: NN, hysteresis: {type: 'array', items: OBJ({tier: ANY, in_R: NN, out_R: NN})}, caravan_tiers: {type: 'array', items: OBJ({tier: ANY, in_R: NN, out_R: NN})}}),   // the spec values Street 3's gates read directly (SG2.16)
  pointers: {type: 'object', additionalProperties: ANY},
  sha_md: S, sha_json: S, sha_tidings: S, prereq_unqueued: SA})   // + sha_md/sha_json/sha_tidings (SG2.15 from an independent read) and prereq_unqueued (polish_inserts)
const GUARD = OBJ({lost: SA, fil_literals_touched: SA, street_literals_touched: SA})
const READ2 = OBJ({answers: {type: 'object', additionalProperties: ANY}, guesses: {type: 'array', items: OBJ({id: S, why: S})}, files_read: SA})
const AUDITG = OBJ({verdicts: {type: 'array', items: OBJ({id: S, schema_guess: B})}})
const FIXR = OBJ({md: S, json: S, sha_md: S, sha_json: S, fixed: SA})
const VHITS = OBJ({hits: SA})

// ---- helpers ----
const J = v => JSON.stringify(v)
const canonJ = v => Array.isArray(v) ? v.map(canonJ) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonJ(v[k])])) : v
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i])
const asList = v => Array.isArray(v) ? v : String(v ?? '').split(/\s*(?:,|>|→)\s*/).filter(Boolean)
const arr = v => Array.isArray(v) ? v : []
const percent = (a, b) => b ? Math.round(1000 * a / b) / 10 : 0
const hx = s => {   // a stable 64-bit text digest (two FNV-style lanes): stamps that agents copy exactly, never a security hash
  let a = 0x811c9dc5, b = 0x9747b28c
  for (const ch of String(s)) { const c = ch.codePointAt(0); a = Math.imul(a ^ c, 0x01000193) >>> 0; b = Math.imul(b ^ c, 0x5bd1e995) >>> 0; b = (b ^ (b >>> 15)) >>> 0 }
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0')
}
const CODE_PROBES = ['P-near', 'P-parser', 'P-hook-marker']   // answers are code: norm() would strip operators, so compare whitespace-collapsed only
function probeEq(p, got, exp) {
  if (exp == null || got == null) return false
  if (CODE_PROBES.includes(p.id) && typeof exp === 'string' && typeof got === 'string') return got.trim().replace(/\s+/g, ' ') === exp.trim().replace(/\s+/g, ' ')
  if (p.kind === 'number') { const a = Number(got), b = Number(exp); return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= (Number(p.tol) || 0) }
  if (p.kind === 'order') return sameList(asList(got).map(norm), asList(exp).map(norm))
  if (typeof exp === 'object' || typeof got === 'object') return J(canonJ(got)) === J(canonJ(exp)) || norm(J(canonJ(got))) === norm(J(canonJ(exp)))
  return norm(got) === norm(exp)
}

// ---- Preflight ----
phase('Preflight')
const INPUTS = [REPO + '/index.html', REPO + '/tools/street-drift.js', REPO + '/.claude/workflows/filigree-1-research.js', DOCS + '/research-dossier.md', DOCS + '/todo-inputs.json']
const PREFLIGHT2 = `Preflight for Street 2 (read-only: write nothing outside a mktemp -d dir).
A. ${ANCHOR_TASK}
B. ${FIL_ANCHOR_TASK}
C. ${DRIFT_TASK}
Also check:
1. Inputs exist: ${INPUTS.join(' ; ')}. missing = every one that does not exist (the street bible, its gate and Street 1's fixtures are reported below, never here).
2. gate1 from ${GATE1}: {exists (present and parses), pass: parsed.pass === true, mode: parsed.mode or "", forced: parsed.forced_by != null, md_ok: the parsed.artifacts entry whose path ends "street-bible.md" has a sha256 equal to sha256sum ${BIBLE_MD}, json_ok: the same for "street-bible.json" and ${BIBLE_JSON}, fil_bible_sha256: parsed.fil_bible_sha256 or "", fil_rulings_cited: parsed.fil_rulings_cited or {}, bible_sha256: sha256sum ${BIBLE_JSON} now ("" when absent)}. An absent gate file gives exists false, pass false, mode "", forced false, md_ok false, json_ok false.
3. fil_bible_sha256_now = sha256sum ${FIL_BIBLE} ("" when absent).
4. fil_overrides = the "overrides" object of ${FIL}/rulings.json; st_overrides = the "overrides" object of ${DOCS}/rulings.json ({} when a file or its key is absent; string values only).
5. fil_notices (read-only): exists true with source "sheet-spec /contracts/notices" when ${FIL_SPEC} parses and has /contracts/notices; else exists true with source "maps-site/data/<file>" for the first file (sorted by name) under ${REPO}/maps-site/data/ whose name contains "notices"; else {exists: false, source: ""}.
6. fog: read ${BIBLE_JSON} (its prerequisites and rules) and ${Q09} (its claims) for the name of the R13 fog function of the /* FILIGREE */ block in ${REPO}/maps-site/index.html (read-only). exists = a name was given AND "function <name>(" or "<name> = " occurs between "/* FILIGREE */" and "/* /FILIGREE */" in that file; name = that name ("" when none).
7. The ledger ${LEDGER} if present: for each entry of its "sections" return {sid, path, sha256, md, sha_md (the recorded ones; "" when the entry lacks md or sha_md), sha_ok (the file at path exists and re-hashes to sha256 AND the file at md exists and re-hashes to sha_md; false when md or sha_md is missing), stamp (the recorded one)}; probes_sha256, tidings_sha256, tidings_schema_source ("" when absent), tidings_shut_ways and tidings_muster_days (the recorded counts; -1 when absent) copied from it. Absent ledger = {sections: [], probes_sha256: "", tidings_sha256: "", tidings_schema_source: "", tidings_shut_ways: -1, tidings_muster_days: -1}.
8. probes from ${PROBES}: {exists (present and parses), frozen: parsed.frozen === true, sha256: sha256sum of the file, bible_sha256: parsed.bible_sha256 or "", rulings_stamp: parsed.rulings_stamp or "", n: parsed.probes.length or 0}.
9. tidings from ${TIDINGS}: {exists (present and parses), frozen: parsed.frozen === true, sha256: sha256sum of the file}.
10. views_ok = ${VIEWS_JSON} parses and holds views SV1..SV9; baseline_ok = ${BASELINE} parses and has frozen === true; spec_exists = ${SPEC_MD} or ${SPEC_JSON} exists.
11. gate_prev from ${GATE2}: {exists (present and parses), pass: parsed.pass === true, mode: parsed.mode or "", forced: parsed.forced_by != null, bible_sha256: parsed.bible_sha256 or "", fil_bible_sha256: parsed.fil_bible_sha256 or "", rulings_stamp: parsed.rulings_stamp or "", spec_ok: the parsed.artifacts entries whose path ends "street-spec.md", "street-spec.json", "street-bible.json", "gates/2-probes.json" and "fixtures/tidings.json" all exist with a sha256 equal to the sha256sum of the file at the repo-relative or absolute path they name (false when any entry is missing, empty or differs)}.
Absent files give exists false, "" and 0 (false for flags). Return {gate_prev, missing, anchors (the map of A), fil_anchors (B), drift (C), gate1, fil_bible_sha256_now, fil_overrides, st_overrides, fil_notices, fog, ledger, probes, tidings, views_ok, baseline_ok, spec_exists}.`
const pre = await crit(PS(PREFLIGHT2), {label: 'preflight', phase: 'Preflight', schema: PRE2, ...M('mech')})
if (!pre) return done({reason: 'agent died: preflight', polish_inserts_above: 'Street 3'})
if (!pre.drift || pre.drift.ok !== true) die('prelude drift: ' + driftIds(pre.drift))   // run fault; remedy README §12
if ((pre.missing || []).length) die('missing inputs: ' + pre.missing.join(', '))
const lost = anchorsLost(pre.anchors); if (lost.length) die('anchor lost: ' + lost.join('; '))
const {r: RUL, used: RUSED} = rulingsMerge(pre.fil_overrides); const STR = stRulingsMerge(pre.st_overrides), SUSED = STR.used
const g1 = pre.gate1 || {}
const chain = [
  !(g1.exists && g1.pass && g1.mode === 'full' && !g1.forced && g1.md_ok && g1.json_ok) ? 'planning must not start before the street bible exists (docs/street/gates/1-research.json pass, bible unchanged)' : '',
  g1.fil_bible_sha256 && g1.fil_bible_sha256 !== pre.fil_bible_sha256_now ? 'the filigree density bible changed since Street 1; re-run street-1-research' : '',
  citedChanged(g1.fil_rulings_cited, RUL).length ? 'the cited filigree rulings changed since Street 1 (' + citedChanged(g1.fil_rulings_cited, RUL).join(', ') + '); re-run street-1-research' : ''].filter(Boolean)
const chainOk = !chain.length
const gapsPre = []
const filLost = Object.entries((pre.fil_anchors || {}).literals || {}).filter(([, v]) => !v).map(([k]) => k)
if (filLost.length) { log('filigree anchors already lost in index.html (not this track): ' + filLost.join('; ')); gapsPre.push('filigree anchors already lost in index.html (recorded, not caused, by this track): ' + filLost.join('; ')) }
if (!pre.views_ok) gapsPre.push('gates/views.json missing or incomplete (Street 1 fixture)')
if (!pre.baseline_ok) gapsPre.push('gates/baseline.json missing or not frozen (Street 1 fixture)')
const fog = pre.fog || {}, FOG_OK = fog.exists === true && !!String(fog.name || '').trim()
const FOG_SRC = FOG_OK ? 'filigree:' + String(fog.name).trim() : 'absent'
if (!FOG_OK) gapsPre.push('the R13 fog function is not in the /* FILIGREE */ block yet: no fog unit, fog source "absent" (ST11)')
// rulings whose default values this script bakes into probes, spec shape and gates; an override drops the baked value and its text decides
const OVR = {R6: RUL.R6 !== RULINGS.R6, ST5: STR.r.ST5 !== ST_RULINGS.ST5, ST7: STR.r.ST7 !== ST_RULINGS.ST7, ST9: STR.r.ST9 !== ST_RULINGS.ST9, ST19: STR.r.ST19 !== ST_RULINGS.ST19}
const OVR_IDS = Object.keys(OVR).filter(k => OVR[k])
if (OVR_IDS.length) gapsPre.push('overridden rulings with baked defaults (' + OVR_IDS.join(', ') + '): their probe answers and spec values follow the ruling text, not the defaults' + (OVR.R6 || OVR.ST9 ? '; Street 3 still gates fade.ms <= 250 and max_jobs_frame <= 6' : ''))
const BSHA = HEX64.test(g1.bible_sha256 || '') ? g1.bible_sha256 : ''
const RSTAMP = 'r1:' + hx(rulingText(RUL, FIL_CITED) + '\n' + rulingText(STR.r, Object.keys(ST_RULINGS)))   // a digest of the cited rulings text (an agent copies 18 chars exactly; it would mangle 6 KB)
const LG = pre.ledger || {}
const secStamp = s => 's1:' + hx([BSHA, RSTAMP, J(s), FOG_SRC, KEY_IDIOM].join('|'))   // a section resumes only against the bible, rulings, fog and definition it was written for
const pf = pre.probes || {}
const probesKeep = RESUME && pf.exists === true && pf.frozen === true && HEX64.test(pf.sha256 || '') && pf.sha256 === LG.probes_sha256 && !!BSHA && pf.bible_sha256 === BSHA && pf.rulings_stamp === RSTAMP
const tf = pre.tidings || {}
const tidingsKeep = RESUME && tf.exists === true && tf.frozen === true && HEX64.test(tf.sha256 || '') && tf.sha256 === LG.tidings_sha256
const secLedger = arr(LG.sections).filter(x => x && x.sid)
const secResumed = RESUME ? SECTIONS.filter(s => secLedger.some(x => x.sid === s.sid && x.sha_ok === true && !!String(x.md || '').trim() && HEX64.test(x.sha_md || '') && x.stamp === secStamp(s))) : []
const secTodo = cap(SECTIONS.filter(s => !secResumed.includes(s)))
if (secResumed.length) log('sections resumed (re-hash and stamp match): ' + secResumed.map(s => s.sid).join(', '))

// ---- plan mode: the schedule (design §8; agents_max from the same terms) ----
const AGENTS_MAX = 2 + 5 + 3 * SECTIONS.length + 5 + 1 + 4 + 4 + ROUNDS * 9 + 8
if (MODE === 'plan') {
  const schedule = [
    {phase: 'Preflight', agents_min: 1, agents_max: 2},
    {phase: 'Probes', agents_min: (probesKeep ? 0 : 1) + 1 + (tidingsKeep ? 0 : 1), agents_max: 5},   // writer (crit) + readback + tidings (crit)
    {phase: 'Sections', agents_min: 2 * secTodo.length, agents_max: 3 * SECTIONS.length},   // writer + anchors (+ anchor fix); the literal guard re-checks every cited literal at Check
    {phase: 'Integrate', agents_min: 2, agents_max: 5},   // integrator (crit) + red team (+ patcher, crit)
    {phase: 'Units', agents_min: 1, agents_max: 1},
    {phase: 'Check', agents_min: 4, agents_max: 4},
    {phase: 'Cold-engineer gate', agents_min: 2, agents_max: 4},   // readers A, B (+ a guess audit per reader with guesses)
    {phase: 'Fix', agents_min: 0, agents_max: ROUNDS * 9},   // fixer + the four checks + the gate
    {phase: 'Record', agents_min: 2 + (probesKeep && tidingsKeep ? 0 : 1) + (secTodo.length ? 1 : 0), agents_max: 8}]   // gate + ledger + the ledger checkpoints after Probes and Sections (crit each)
  const agents_max = schedule.reduce((t, x) => t + x.agents_max, 0), agents_min = schedule.reduce((t, x) => t + x.agents_min, 0)
  if (agents_max !== AGENTS_MAX) log(`schedule sum ${agents_max} != formula ${AGENTS_MAX}`)
  return done({reason: 'plan', chain_ok: chainOk, chain, schedule, bound: 90, agents_min, agents_max, over_bound: agents_max > 90,
    probes_frozen: probesKeep, tidings_frozen: tidingsKeep, sections_resumed: secResumed.map(s => s.sid), fog_source: FOG_SRC, overridden_baked: OVR_IDS,
    owner_rulings_used: RUSED, street_rulings_used: SUSED, polish_inserts_above: 'Street 3',
    polish_note: `plan: chain ${chainOk ? 'held' : 'NOT held (' + chain.join('; ') + ')'}; ${secTodo.length} section(s) to write, probes ${probesKeep ? 'frozen' : 'to write'}, tidings ${tidingsKeep ? 'frozen' : 'to write'}; at most ${agents_max} agents including crit() retries (bound 90)`})
}
// a gate that already passed on an unchanged bible, filigree bible, rulings and spec files is not redone: re-integrating would give street-spec.json a new sha and re-queue every built Street 3 unit
const GP = pre.gate_prev || {}
if (RESUME && MODE === 'full' && !FORCE && chainOk && GP.exists === true && GP.pass === true && GP.mode === 'full' && GP.forced !== true && GP.spec_ok === true
  && !!BSHA && GP.bible_sha256 === BSHA && GP.rulings_stamp === RSTAMP && HEX64.test(GP.fil_bible_sha256 || '') && GP.fil_bible_sha256 === g1.fil_bible_sha256) {
  log('gate already passed on an unchanged bible and spec: nothing to do')
  return done({pass: true, reason: 'already passed: gate pass:true, the street bible, the filigree bible and the cited rulings are unchanged and the spec, probes and tidings files re-hash; nothing re-run', rounds: 0, chain_ok: chainOk, owner_rulings_used: RUSED, street_rulings_used: SUSED,
    gate_path: OUT + '/gates/2-plan.json', polish_inserts_above: 'Street 3', polish_note: 'Street 2 already passed on an unchanged street bible; the spec is untouched'})
}
if (!chainOk && !FORCE && MODE === 'full') die(chain[0])   // a thrown prerequisite: the run treats it as blocked
if (!chainOk) log('chain not held: ' + chain.join('; ') + (FORCE ? ' (forced: ' + FORCE + ')' : ' (reported only in ' + MODE + ' mode)'))

let rounds = 0
const gaps = gapsPre.slice()
let PROBES_SHA = '', TIDE_SHA = tidingsKeep ? tf.sha256 : '', ledgerDirty = false
let TIDE_SRC = tidingsKeep ? String(LG.tidings_schema_source || '') : '', TIDE_SW = tidingsKeep && Number.isInteger(LG.tidings_shut_ways) ? LG.tidings_shut_ways : -1, TIDE_MD = tidingsKeep && Number.isInteger(LG.tidings_muster_days) ? LG.tidings_muster_days : -1
let secKept = secResumed.map(s => secLedger.find(x => x.sid === s.sid)).filter(Boolean).map(x => ({sid: x.sid, path: x.path, sha256: x.sha256, md: x.md, sha_md: x.sha_md, stamp: x.stamp}))
const ledgerRec = spec => ({job: JOB, date: DATE, sections: secKept, probes_sha256: PROBES_SHA, tidings_sha256: TIDE_SHA, tidings_schema_source: TIDE_SRC, tidings_shut_ways: TIDE_SW, tidings_muster_days: TIDE_MD, bible_sha256: BSHA, spec: spec || {md: '', json: ''}})
async function checkpoint(why) {   // ledger every accepted stage, so a stop after it never re-buys the probes or sections (resume needs the ledger)
  if (!ledgerDirty) return
  ledgerDirty = false
  if (!(await record('state/2-plan.json', ledgerRec(), 'record ledger (' + why + ')'))) gaps.push('ledger checkpoint (' + why + ') not recorded: a rerun re-buys that work')
}
const stop = async r => { await checkpoint('stop'); return done({reason: FORCE ? 'forced: ' + FORCE + '; ' + r : r, rounds, chain_ok: chainOk, owner_rulings_used: RUSED, street_rulings_used: SUSED, polish_inserts_above: 'Street 3',
  polish_note: 'Street 2 stopped: ' + r + (FORCE ? ' (forced run)' : '')}) }
const rulingsAll = rulingText(RUL, FIL_CITED) + '\n' + rulingText(STR.r, Object.keys(ST_RULINGS))
const secRulings = s => [s.R.length ? rulingText(RUL, s.R) : '', s.ST.length ? rulingText(STR.r, s.ST) : ''].filter(Boolean).join('\n') || '(none cited; the determinism rule below binds every section)'

// ---- Probes (frozen before the spec exists; complete before any section writer starts) ----
phase('Probes')
const byRul = (k, what) => `<${what}, as the overridden ruling ${k} states>`   // an overridden baked ruling: the writer fills the answer from its text
const MANDATORY_FIXED = [   // the fixed answers this script knows; every <...> answer is filled by the writer (P-tier-SV5, P-key-crowd from the bible; byRul ones from the ruling)
  {id: 'P-tier-SV5', kind: 'enum', source: 'bible', q: 'the tier the bible gives at SV5\'s R (views.json); options = the bible\'s tier ids', answer: '<the bible tier id whose band holds SV5\'s R>'},
  {id: 'P-key-crowd', kind: 'string', source: 'bible', q: 'the key form for crowds', answer: '<the bible\'s crowd key, of the form st:crowd:<settlement id>:day>'},
  {id: 'P-hash-param', kind: 'string', source: 'ruling', q: 'the hash param that turns the street view on (lowercase letters only)', answer: OVR.ST7 ? byRul('ST7', 'the hash param that turns the street view on') : 'street'},
  {id: 'P-departDay', kind: 'enum', source: 'ruling', options: ['yes', 'no'], q: 'may a queue move a caravan\'s departDay?', answer: 'no'},
  {id: 'P-fade-ms', kind: 'number', source: 'ruling', tol: 0, q: 'the longest ease after a threshold, in ms (R6)', answer: OVR.R6 ? byRul('R6', 'the longest ease after a threshold, a number of ms') : 250},
  {id: 'P-near', kind: 'string', source: 'baseline', q: 'the camera.near rule after the build (the right-hand side expression only)', answer: 'clamp(R*0.02, 0.5, 50)'},
  {id: 'P-parser', kind: 'string', source: 'ruling', q: 'the seed param pattern after S0 (the regex source)', answer: '(?:^#|&)s='},
  OVR.ST5 ? {id: 'P-dark-hour', kind: 'enum', source: 'ruling', options: ['render', 'sim', 'wall', 'none'], q: 'which clock closes the gate leaves ("none" when they never shut)', answer: byRul('ST5', 'one of render | sim | wall | none')}
    : {id: 'P-dark-hour', kind: 'enum', source: 'bible', options: ['render', 'sim', 'wall'], q: 'which clock closes the gate leaves', answer: 'render'},
  {id: 'P-shadows-default', kind: 'enum', source: 'ruling', options: ['on', 'off'], q: 'the shadows row default', answer: OVR.ST7 ? byRul('ST7', 'on or off') : 'on'},
  {id: 'P-fog-source', kind: 'string', source: 'bible', q: 'where the street fog comes from: "filigree:<function name>" or "absent"', answer: FOG_SRC},
  {id: 'P-stats-keys', kind: 'enum', source: 'baseline', options: ['yes', 'no'], q: 'may ANNALS.stats() gain a key?', answer: 'no'},
  {id: 'P-hook-marker', kind: 'string', source: 'ruling', q: 'the marker every hook line carries', answer: HOOK_MARK}]
const KNOWN = Object.fromEntries(MANDATORY_FIXED.filter(m => !/^</.test(String(m.answer))).map(m => [m.id, m]))
const PLACEHOLDER = v => typeof v === 'string' && (/^\s*<[\s\S]*>\s*$/.test(v) || v.includes('<the '))   // an unfilled <...> template answer
const numOf = v => typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN
const OWN_ROOTS = SECTIONS.flatMap(s => s.owns)
function probeFails(rb) {   // scored here from the readback's verbatim array (never from the writer)
  const f = []
  if (!rb) return ['no readback']
  if (rb.ok !== true) f.push('readback: ' + (arr(rb.failures).join('; ') || 'not ok'))
  if (!HEX64.test(rb.sha256 || '')) f.push('sha256 not 64-hex')
  const ps = arr(rb.probes).filter(Boolean), ids = ps.map(p => p.id), idSet = new Set(ids)
  if (ps.length < PROBES_MIN || ps.length > PROBES_MAX) f.push(`need ${PROBES_MIN}..${PROBES_MAX} probes, got ${ps.length}`)
  if (idSet.size !== ids.length) f.push('duplicate probe ids')
  if (rb.canon_len !== JSON.stringify(arr(rb.probes)).length) f.push('readback probes array length differs from the file\'s canon_len (a copy error)')
  if (rb.n !== ps.length || !sameList([...arr(rb.ids)].sort(), [...ids].sort())) f.push('readback ids/n disagree with its probes array')
  for (const p of ps) {
    if (typeof p.q !== 'string' || !p.q.trim()) f.push(`${p.id}: empty question text`)
    if (!PROBE_KINDS.includes(p.kind)) f.push(`${p.id}: kind ${J(p.kind)}`)
    if (!PROBE_SOURCES.includes(p.source)) f.push(`${p.id}: source ${J(p.source)}`)
    if (p.source === 'spec') { if (!/^\//.test(p.pointer || '') || !OWN_ROOTS.some(r => p.pointer === r || p.pointer.startsWith(r + '/'))) f.push(`${p.id}: spec probe pointer ${J(p.pointer)} not under a section's pointers`); if (p.answer != null) f.push(`${p.id}: spec probe carries an answer`) }
    else if (p.answer == null || (typeof p.answer === 'string' && !p.answer.trim())) f.push(`${p.id}: fixed probe without answer`)
    else if (PLACEHOLDER(p.answer)) f.push(`${p.id}: answer ${J(p.answer)} is an unfilled placeholder`)
    else if (p.kind === 'enum' && !arr(p.options).some(o => norm(o) === norm(p.answer))) f.push(`${p.id}: answer ${J(p.answer)} not among its options ${J(arr(p.options))}`)
    else if (p.kind === 'number' && !Number.isFinite(numOf(p.answer))) f.push(`${p.id}: answer ${J(p.answer)} is not a number`)
    if ((p.kind === 'enum' || p.kind === 'order') && !arr(p.options).length) f.push(`${p.id}: ${p.kind} probe without options`)
  }
  for (const m of MANDATORY_FIXED) { const p = ps.find(x => x.id === m.id); if (p && (p.kind !== m.kind || p.source === 'spec')) f.push(`${m.id}: kind ${J(p.kind)} / source ${J(p.source)} (want kind ${m.kind}, a fixed source)`) }
  for (const m of MANDATORY_FIXED) {
    const p = ps.find(x => x.id === m.id); if (!p) continue
    if (m.options && !sameList(arr(p.options).map(norm).sort(), m.options.map(norm).sort())) f.push(`${m.id}: options ${J(p.options)} != ${J(m.options)}`)
    if (m.tol != null && Number(p.tol || 0) !== Number(m.tol || 0)) f.push(`${m.id}: tol ${J(p.tol)} != ${m.tol}`)
  }
  const ans = id => (ps.find(x => x.id === id) || {}).answer
  if (ans('P-key-crowd') != null && !/^st crowd .+ day$/.test(norm(ans('P-key-crowd')))) f.push(`P-key-crowd: answer ${J(ans('P-key-crowd'))} is not of the form st:crowd:<settlement id>:day`)
  if (ans('P-hash-param') != null && !PARAM_OK(String(ans('P-hash-param')).trim())) f.push(`P-hash-param: answer ${J(ans('P-hash-param'))} breaks ST18 (^[a-z]+$, not ending in s, not s, goto or filigree)`)
  const miss = MANDATORY_PROBES.filter(id => !idSet.has(id)); if (miss.length) f.push('mandatory probes missing: ' + miss.join(', '))
  for (const [id, m] of Object.entries(KNOWN)) { const p = ps.find(x => x.id === id); if (p && !probeEq({...m, ...p, kind: m.kind, tol: m.tol, options: m.options}, p.answer, m.answer)) f.push(`${id}: answer ${J(p.answer)} != ${J(m.answer)}`) }
  const sp = ps.filter(p => p.source === 'spec')
  if (sp.length < SPEC_PROBES_MIN) f.push(`need >= ${SPEC_PROBES_MIN} spec probes, got ${sp.length}`)
  const bare = SECTIONS.filter(s => !sp.some(p => s.owns.some(r => (p.pointer || '') === r || String(p.pointer || '').startsWith(r + '/')))).map(s => s.sid)
  if (bare.length) f.push('sections without a spec probe: ' + bare.join(', '))
  return f
}
let pw = null
if (!probesKeep) {
  if (pre.spec_exists) { gaps.push('probes written while a street spec already existed (resume:false or stale stamps)'); log('probes-after-spec: a street spec exists while the probes are written; the writer is told not to open it') }
  pw = await crit(PS(`Freeze the cold-engineer probes BEFORE the street spec exists. The spec is not yours to see: do not open ${SPEC_MD}, ${SPEC_JSON}, anything under ${OUTABS}/spec/ or ${OUTABS}/cold/ (ignore them if present).
Read ONLY: ${BIBLE_MD}, ${BIBLE_JSON}, ${VIEWS_JSON}, ${BASELINE} and the rulings below.
Write ${PROBES} (create gates/) with a node script, 2-space indent: {"date": "${DATE}", "frozen": true, "bible_sha256": "${BSHA}", "rulings_stamp": "${RSTAMP}", "probes": [...]} (keep bible_sha256 and rulings_stamp exactly as given).
- ${PROBES_MIN}-${PROBES_MAX} probes; each {id, q, kind: ${PROBE_KINDS.join(' | ')}, options (enum and order: the exact closed tokens), answer (fixed probes only), tol (number probes), pointer (spec probes only: an RFC 6901 JSON pointer into street-spec.json), source: ${PROBE_SOURCES.join(' | ')}}.
- Fixed probes (source bible | views | baseline | ruling) carry an answer settled by the bible, the views, the baseline or a ruling, whatever choices the spec makes later.
- Spec probes (source spec): the question and a pointer ONLY, no answer key; the spec will be written later and must hold the answer at that pointer. At least ${SPEC_PROBES_MIN}, with at least one under the pointers of every section: ${SECTIONS.map(s => s.sid + ' ' + s.owns.join(' ')).join('; ')}. The spec's shape (pointer targets): ${SPEC_SHAPE_SHORT()}.
- Mandatory fixed probes, with exactly these ids, kinds, options and answers (replace every <...> answer with the real value from the bible, or from the ruling it names, never leaving the <...> text; an enum answer is one of its options, a number answer a number; reword q freely but keep its meaning): ${J(MANDATORY_FIXED)}
- Readers see only id, q, kind and options and are scored by exact normalized match, so q states the answer format (units and rounding for numbers; for enum and order list the tokens in options and say to answer with them).
- Other ids "P-<short-name>", unique.
Rulings:
${rulingsAll}
${READBACK} Also return n (the number of probes).`), {label: 'probe writer', phase: 'Probes', schema: PROBEW, ...M('judge')})
  if (!pw) return stop('agent died: probe writer')
}
const rb = await agent(PS(`Mechanical probe readback, no judging (a node script in a mktemp -d dir; write nothing). JSON.parse ${PROBES} and check: frozen === true; bible_sha256 === ${J(BSHA)}; rulings_stamp === ${J(RSTAMP)}; ${PROBES_MIN} <= probes.length <= ${PROBES_MAX}; ids unique; every kind is one of ${J(PROBE_KINDS)}; every probe whose source is not "spec" has a non-empty answer; every probe whose source is "spec" has a pointer starting "/" and no answer key; every id of ${J(MANDATORY_PROBES)} is present.
Return {ok (true only when every check holds), failures (one line per failed check), sha256 (sha256sum of the file), n (probes.length), ids (every probe id in file order), canon_len (JSON.stringify(parsed.probes).length), probes (the probes array VERBATIM, every field of every probe)}.`), {label: 'probe readback', phase: 'Probes', schema: PROBERB, ...M('mech')})
if (!rb) return stop('agent died: probe readback')
const rbFails = probeFails(rb).concat(pw && HEX64.test(pw.sha256 || '') && rb.sha256 !== pw.sha256 ? [`readback sha ${rb.sha256} != writer sha ${pw.sha256}`] : [], probesKeep && rb.sha256 !== pf.sha256 ? ['file changed since the preflight'] : [])
if (rbFails.length) {
  if (probesKeep) die('gates/2-probes.json is invalid (' + rbFails.join('; ') + '); delete it and rerun with resume:false')
  return stop('agent died: probe writer (its gates/2-probes.json failed the readback: ' + rbFails.slice(0, 6).join('; ') + '); the next run rewrites it')   // never ledgered, so a rerun rewrites it
}
const probes = arr(rb.probes).filter(Boolean)
PROBES_SHA = rb.sha256
if (!probesKeep) ledgerDirty = true
const HASH_PARAM = OVR.ST7 ? String(probes.find(p => p.id === 'P-hash-param').answer).trim() : 'street'   // validated by probeFails (PARAM_OK)
const HASH_TABLE = HASH_TABLE_MIN.map(h => h.replace(/\bstreet=/, HASH_PARAM + '='))
if (HASH_PARAM !== 'street') MANDATORY_UNITS['S0.U00'] = MANDATORY_UNITS['S0.U00'].replace('street=1 read', HASH_PARAM + '=1 read (ST7 overridden)')
const specProbes = probes.filter(p => p.source === 'spec')
const probeList = J(probes.map(p => arr(p.options).length ? {id: p.id, q: p.q, kind: p.kind, options: p.options} : {id: p.id, q: p.q, kind: p.kind}))
log(`probes ${probesKeep ? 'resumed (frozen)' : 'written'}: ${probes.length} (${specProbes.length} spec)`)

if (!tidingsKeep) {
  const ns = pre.fil_notices || {}, src = ns.exists && String(ns.source || '').trim() ? String(ns.source).trim() : ''
  const td = await crit(PS(`Write the herald's tidings fixture ${TIDINGS} (create fixtures/) in the R12 notices schema: ${src ? 'the schema of ' + (src.startsWith('maps-site/') ? REPO + '/' + src : FIL_SPEC + ' /contracts/notices') + ' (read-only); schema_source = "' + src + '"' : 'no committed notices schema exists yet, so use the notice classes of ' + BIBLE_JSON + ' (shut ways, muster days) and set schema_source = "bible"'}.
Step 1, find the route id (write nothing yet): read ${VIEWS_JSON} for the SV4 bridge's x,z. In the sandbox below, load ${REPO}/index.html read-only at seed epeshu and in node/browser list ANNALS.world.routes (entries with an id and a polyline of points); pick the route whose polyline passes nearest the SV4 bridge point (ties: the lowest id) and use its id string verbatim. Do not use any probe flag: Street 3 adds them later and they may not exist.
Step 2, write the fixture. Record shape (the notices schema's own field names win when a schema exists): {date, frozen, seed, day, schema_source, shut_ways: [{route: "<route id from step 1>", from_day: 120, to_day: 121, kind: "shut_way"}], muster_days: [{settlement: "<the Epēshu settlement id from ANNALS.world.settlements, matched by name>", day: 120, kind: "muster_day"}]}; when the bible supplies the schema, those field names stand.
Content: {date: "${DATE}", frozen: true, seed: "epeshu", day: 120, schema_source, shut_ways: [exactly one shut way on the SV4 approach route: the route id of the W.routes entry through the SV4 bridge of ${VIEWS_JSON} (step 1 below)], muster_days: [exactly one muster day at Epēshu]} plus whatever fields the schema requires. Player-facing words: the herald's tidings, shut ways, muster days. ${VOCAB_ST_RULE}
${SANDBOX_ST}
Rulings:
${rulingText(RUL, ['R12', 'R13'])}
${READBACK} Also return schema_source, shut_ways (the count) and muster_days (the count).`), {label: 'tidings fixture', phase: 'Probes', schema: TIDE, ...M('audit')})
  if (!FILE_OK(td)) return stop('agent died: tidings fixture')
  TIDE_SHA = td.sha256; TIDE_SRC = String(td.schema_source || (src ? '' : 'bible')); TIDE_SW = td.shut_ways; TIDE_MD = td.muster_days
  ledgerDirty = true
}
if (tidingsKeep && TIDE_SW < 0) gaps.push('tidings fixture resumed without its ledgered counts (an older ledger); delete it and rerun with resume:false to re-measure')
else {   // replayed from the ledger on resume, so a frozen fixture's known defect stays on the gate record
  if (TIDE_SRC === 'bible' || (!tidingsKeep && !((pre.fil_notices || {}).exists && String((pre.fil_notices || {}).source || '').trim()))) gaps.push('tidings fixture follows the bible\'s notice classes: no committed R12 notices schema yet')
  if (TIDE_SW !== 1 || TIDE_MD !== 1) gaps.push(`tidings fixture holds ${TIDE_SW} shut way(s) and ${TIDE_MD} muster day(s) (1 and 1 asked)`)
}
await checkpoint('probes')

// ---- Sections ----
phase('Sections')
function SPEC_SHAPE_SHORT() { return 'tiers {bands [{tier, R_min, R_max}], refine {kind "sse", target_px, geom_err_m}, hysteresis [{tier, in_R, out_R}]}; fade {ms, method}; stream {max_jobs_frame, tri_cap_frame, resident_tris, lru, cull}; facades; surface; ground {rule}; props; crowds {key, scale}; traffic {s0, T, v0, obstacles [{class, key, rule}], tiers [{tier, in_R, out_R, repr}]}; gates {clock}; sky {clouds {key, states}, shadows {row_default}}; fog {source, helpers}; weather {steps}; layers {rows [{label, default}], param}; hash {params, consumes, parser {pattern, sites}, table [{hash, expect}]}; notices {schema_source, fixture, classes}; caps {SV1..SV9: {on: {' + CAP_METRICS.join(', ') + '}}}; probe {flags_added, api}; determinism {allowed_sources, new_sim_state, key_idiom, forbidden}; block {placement, namespace}; hook_lines [{line, replaces}]; static {checks}; checks {S0..S4: [{id, cmd, expect}]}; fixtures {views, baseline, tidings}; prerequisites [{item, blocks, polish_title}]; units' }
const SPEC_SHAPE = `street-spec.json (exact shape; a pointer named here holds exactly this):
{date: "${DATE}", bible_sha256: "${BSHA}", rules: [{id: "SS-01", text, traces: [bible rule ids]}],
 tiers: {bands: [{tier, R_min, R_max}], refine: {kind: "sse", target_px, geom_err_m: {T0..T4}}, hysteresis: [{tier, in_R, out_R}]},   (out_R > in_R; all <= 2200, inside meshHi)
 fade: {ms, method: "opacity" | "dither"},   (ms a number${OVR.R6 ? ' within the overridden R6' : ' <= 250, R6'})
 stream: {max_jobs_frame, tri_cap_frame, resident_tris, lru: "map", cull: "sphere"},   (all numbers; max_jobs_frame an integer${OVR.ST9 ? ' within the overridden ST9' : ' 1..6, ST9'})
 facades: {...}, surface: {...}, ground: {rule}, props: {...}, crowds: {key, scale},
 traffic: {s0, T, v0, obstacles: [{class, key, rule}], tiers: [{tier: "far" | "mid" | "near", in_R, out_R, repr}]},   (s0, T, v0 positive numbers; tiers: at least far, mid and near caravan tiers (far dot or impostor, mid the current mesh, near individual animals and load), 0 < in_R < out_R <= ${MESH_HI} for each, the hysteresis inside the street band)
 gates: {clock: ${OVR.ST5 ? '"render" | "sim" | "wall" | "none" (as the overridden ST5 states; "none" = the leaves never shut)' : '"render"'}},
 sky: {clouds: {key, states}, shadows: {row_default: ${OVR.ST7 ? '"on" | "off" (as the overridden ST7 states)' : '"on"'}}}, fog: {source: "filigree:<fn>" | "absent", helpers: []},   (this run: fog.source = "${FOG_SRC}")
 weather: {steps: ${OVR.ST19 ? '[<the steps the overridden ST19 states, as fractions of the drawn count>]' : '[1, 0.75, 0.5, 0.25]'}},
 layers: {rows: [{label, default}], param: ${J(HASH_PARAM)}},
 hash: {params: [${J(HASH_PARAM)}], consumes: ["notices"], parser: {pattern: "(?:^#|&)s=", sites: 2}, table: [{hash, expect: {seed, goto, street}}]},   (table includes at least ${J(HASH_TABLE)})
 notices: {schema_source, fixture: "fixtures/tidings.json", classes: [...]},
 caps: {SV1..SV9: {on: {${CAP_METRICS.join(', ')}}}},   (numbers; within the bible's caps_ceiling; SV5 and SV9 calls, tris and objects equal ${BASELINE} views)
 probe: {flags_added: [...], api: ["on", "set", "stats", "settledHash", "queueHash", "parseHash", "pinDegrade"]},
 determinism: {allowed_sources: ${J(ALLOWED_SOURCES)}, new_sim_state: [], key_idiom: ${J(KEY_IDIOM)}, forbidden: [...]},
 block: {placement: "<index.html literal the block sits directly above>", namespace: "STREET"},
 hook_lines: [{line: "<exact final text incl. indentation, contains ${HOOK_MARK}>", replaces: "<exact original line>" | null}],   (at most ${HOOKS_MAX})
 static: {checks: [...]},
 checks: {S0: [{id, cmd, expect}], S1: [...], S2: [...], S3: [...], S4: [...]},
 fixtures: {views: "gates/views.json", baseline: "gates/baseline.json", tidings: "fixtures/tidings.json"},
 prerequisites: [{item, blocks, polish_title}],
 units: [...]}`
const SEC_NOTES = {
  s01: `Tier bands contiguous over the camera radius 9..11000 and consistent with the bible tiers; hysteresis 0 < in_R < out_R and every value <= ${MESH_HI} (inside the settlement meshHi band); fade.ms ${OVR.R6 ? 'as the overridden R6 states' : '<= 250 (R6)'}; a screen-space-error refine rule (refine.kind "sse").`,
  s02: `${OVR.ST9 ? 'max_jobs_frame and the triangle cap per frame as the overridden ST9 states' : 'max_jobs_frame <= 6 and a triangle cap per frame (ST9: no workers, a time-sliced main-thread queue)'}; max_jobs_frame, tri_cap_frame and resident_tris numbers; lru "map"; cull "sphere"; resident_tris bounded.`,
  s03: 'Street ground interpolates the 11.72 m heightfield corners, never new relief (R22); Epēshu-only facades inside Epēshu; marble-pale stone tier inside Epēshu\'s footprint and the Blue Temple of Thobrauk on Wood Quay\'s northern edge (ST12); every InstancedMesh sharing MAT.world carries instanceColor.',
  s04: `Crowds keyed daily by (seed, settlement, day) and scaled by s.pop (ST13), key form "st:crowd:<settlement id>:day"; props instanced; every keyed choice uses ${KEY_IDIOM}.`,
  s05: `Queueing is render-only (ST3): mesh transforms only, departDay/route/speed never touched, the queue offset a closed-form function of the day and the neighbours (ST6); ${OVR.ST5 ? 'gates.clock as the overridden ST5 states ("none" when the leaves never shut)' : 'gates.clock "render" (the drawn dark hour, ST5)'}; traffic {s0, T, v0} positive numbers at donkey pace from the bible; /traffic/tiers: at least far, mid and near caravan tiers with in_R/out_R hysteresis inside the street band, so vehicles gain detail on the descent (a far dot or impostor, then the current mesh, then individual animals), tier swaps render-only like the queue (the S3 slice check street.caravan_tiers reads the thresholds).`,
  s06: `${OVR.ST7 ? 'sky.shadows.row_default as the overridden ST7 states' : 'sky.shadows.row_default "on" (held off for speed at degradeStep >= 3, ST7)'}; weather.steps ${OVR.ST19 ? 'as the overridden ST19 states' : '[1, 0.75, 0.5, 0.25]'} scaling the drawn precipitation count only (ST19); fog.source "${FOG_SRC}"${FOG_OK ? ' (copy that function byte-identical with its helpers into the STREET namespace, ST11)' : ' (the atlas function does not exist yet: a recorded gap, nothing invented, ST11)'}.`,
  s07: `layers.param ${J(HASH_PARAM)}; rows ${OVR.ST7 ? 'as the overridden ST7 states' : '"roads and folk", "clouds", "weather", "shadows" (ST7)'}; hash.params [${J(HASH_PARAM)}] (each matches ^[a-z]+$, does not end in "s", is not s, goto or filigree); hash.consumes ["notices"] read only after the S0 parser fix (ST18) with parser {pattern "(?:^#|&)s=", sites 2}; hash.table includes ${J(HASH_TABLE)}; notices.fixture "fixtures/tidings.json" (${TIDINGS}).`,
  s08: `caps for every view ${CAP_VIEWS.join(', ')} with numeric ${CAP_METRICS.join(', ')} under "on"; each within the bible's caps_ceiling; SV5 and SV9 (far quiet) equal ${BASELINE} views calls, tris and objects; probe.api ["on", "set", "stats", "settledHash", "queueHash", "parseHash", "pinDegrade"] and probe.flags_added (the flags Street 3 adds to ${PROBE}; Street 1 literals unchanged).`,
  s09: `determinism {allowed_sources ${J(ALLOWED_SOURCES)}, new_sim_state [], key_idiom ${J(KEY_IDIOM)}}; block {placement: an index.html literal the block sits directly above, namespace "STREET"} (ST1); at most ${HOOKS_MAX} hook_lines, each line carrying ${HOOK_MARK} and replacing exactly one original line (replaces) or inserted (replaces null), keeping the original indentation; no hook line or replaced line contains a street anchor literal (${J(ST_ANCHOR_LITS)}) or a filigree anchor literal (the index.html entries with flag 1 of const ANCHORS in ${REPO}/.claude/workflows/filigree-1-research.js, read-only).`,
  s10: `checks for every slice S0..S4 as [{id, cmd, expect}]; every slice lists the ids ${J(MANDATORY_CHECKS)}; plus per slice ${J(SLICE_CHECKS)}${FOG_OK ? ' and S4 also "street.fog_copy"' : ''}; expect is ${EXPECT_GRAMMAR}; street.folk_row: with the "roads and folk" row off, the per-view object counts of the caravan, crowd and prop classes at SV1 and SV4 are 0, with it on they match the caps, and the fingerprint is identical either way; check commands never depend on randomness or a clock, and name the clock and random tokens only in bracket form (Math[.]random, Date[.]now, performance[.]now); fixtures {views "gates/views.json", baseline "gates/baseline.json", tidings "fixtures/tidings.json"}.`}
const secFile = (s, ext) => `${OUTABS}/spec/${s.sid}.${ext}`
const secRes = await pipeline(secTodo,
  s => agent(PS(`You write ONE section of the street spec: ${s.sid}, "${s.title}". You own exactly these street-spec.json pointers: ${s.owns.join(', ')}.
Read the street bible ${BIBLE_MD} and ${BIBLE_JSON} (your source of truth), ${VIEWS_JSON}, ${BASELINE}, and the research evidence the bible cites (claim "<qid>-cNN" lives in ${OUTABS}/research/<qid>.json); read ${REPO}/index.html through grep -nF only. Do not open ${PROBES}, anything under ${OUTABS}/cold/, or another section's draft.
Write ${secFile(s, 'md')} (prose an engineer can build from, with a "## Rules" list) and ${secFile(s, 'json')} = {"date": "${DATE}", "sid": "${s.sid}", "fragment": {<each owned pointer>: value}, "rules": [{id: "${s.sid}-01".., text, traces: [bible rule ids]}]}, holding exactly the pointers you own (no others).
Cite every code location as "index.html :: <literal>" (one per line in the md; a whole JSON string in the json), the literal copied verbatim from index.html so String.indexOf finds it; never line numbers.
Constraints for this section: ${SEC_NOTES[s.sid]}
${SPEC_SHAPE}
Rulings cited by this section:
${secRulings(s)}
${DET_RULE}
${VOCAB_ST_RULE}
${NO_PROBE_TALK}
${LEAK_RULE}
Return {sid: "${s.sid}", md, json (absolute paths), sha_md, sha_json (sha256sum of each), pointers (the owned pointers you filled), anchors (every "index.html :: <literal>" you cite), open (questions you could not settle)}.`),
    {label: s.sid + ' · writer', phase: 'Sections', schema: SECW, ...M(s.role)}),
  (w, s) => w && agent(PS(`Mechanical anchor check of spec section ${s.sid}, no judging (a node script in a mktemp -d dir, String.indexOf, so no shell quoting touches the literals; write nothing). Collect every "index.html :: <literal>" citation in ${secFile(s, 'md')} (the literal runs to the end of the line, surrounding backticks stripped) and in every string of ${secFile(s, 'json')}, and test each literal against ${REPO}/index.html. Return {sid: "${s.sid}", lost: ["<literal>", ...]} for every literal not found.`),
    {label: s.sid + ' · anchors', phase: 'Sections', schema: ANCHK, ...M('mech')}).then(a => ({w, a})),
  (x, s) => {
    if (!x) return null
    if (!x.a) { log(s.sid + ': anchor check died; the literal guard re-checks at Check'); return {s, w: x.w, clean: false} }
    if (!arr(x.a.lost).length) return {s, w: x.w, clean: true}
    return agent(PS(`Fix the code anchors of spec section ${s.sid}: these "index.html :: <literal>" citations are not found in ${REPO}/index.html: ${J(x.a.lost)}
Re-anchor each by pattern (grep -nF / read the code near it and copy the current literal verbatim) or drop the claim when the code it names is gone. Rewrite ONLY ${secFile(s, 'md')} and ${secFile(s, 'json')}; change nothing else.
${LEAK_RULE}
Return {sid: "${s.sid}", md, json, sha_md, sha_json (sha256sum of each rewritten file), pointers, anchors (every citation now in the section), open}.`),
      {label: s.sid + ' · anchor fix', phase: 'Sections', schema: SECW, ...M('triage')}).then(fx => fx ? {s, w: fx, clean: false, fixed: true} : (log(s.sid + ': anchor fix died; ' + x.a.lost.length + ' lost literal(s) stand'), {s, w: x.w, clean: false, lost: x.a.lost}))
  })
const secK = kept(secRes, 'section writers')
secTodo.forEach((s, i) => { if (!secRes[i]) gaps.push(`section ${s.sid}: writer died (rerun with resume to retry it)`) })
const secFresh = secK.k.filter(x => HEX64.test(x.w.sha_json || '') && HEX64.test(x.w.sha_md || '') && !x.lost)
  .map(x => ({sid: x.s.sid, path: x.w.json, sha256: x.w.sha_json, md: x.w.md, sha_md: x.w.sha_md, stamp: secStamp(x.s)}))   // ledgered for resume; the guard still re-checks every literal
secKept = secKept.concat(secFresh)
if (secFresh.length) ledgerDirty = true
await checkpoint('sections')   // before the quorum stop, so the kept drafts survive it
if (!secK.ok) return stop(`agent died: section writers (${secK.k.length}/${secRes.length} kept)`)
for (const x of secK.k) { arr(x.w.open).forEach(o => gaps.push(`${x.s.sid} open: ${o}`)); if (x.lost) gaps.push(`${x.s.sid}: lost literals after a dead anchor fix: ${x.lost.join('; ')}`) }
const secPresent = SECTIONS.filter(s => secResumed.includes(s) || secK.k.some(x => x.s.sid === s.sid)).map(s => s.sid)

// ---- Integrate ----
phase('Integrate')
const integ = await crit(PS(`You are the spec integrator. Merge the section drafts ${secPresent.map(sid => `${OUTABS}/spec/${sid}.md + .json`).join(', ')} into ${SPEC_MD} and ${SPEC_JSON}. Read the street bible ${BIBLE_MD} and ${BIBLE_JSON} as the source of truth, ${VIEWS_JSON}, ${BASELINE} and ${TIDINGS}. Do not open ${PROBES} or anything under ${OUTABS}/cold/.
1. ${SPEC_JSON}: every section's fragment at its pointers, in the shape below (leave out "units": the unit planner writes it next); rules = every section rule renumbered "SS-01", "SS-02", ... (stable from now on), each {id, text, traces: [bible rule ids]}; every bible rule of kind "must" is traced by at least one SS rule; prerequisites = [{item, blocks: "S0".."S4", polish_title}] for every data item the build needs that the bible lists as open or missing.
2. ${SPEC_MD}: SELF-SUFFICIENT prose from which an engineer who never saw the source post builds the street view: one section per spec part, the rules list with ids, and the index.html citations as "index.html :: <literal>". Names of the source post, its repository and its data sources may appear ONLY in a final "## Provenance" section (ST17): nothing outside it may match /${LEAK_RE}/i, and no string of the json may. Old names that must stay quoted go only in a "## Renames" section.
Resolve conflicts between sections in favour of the bible, the rulings and the determinism rule; list what you resolved under "## Provenance".
${SPEC_SHAPE}
Rulings:
${rulingsAll}
${DET_RULE}
${VOCAB_ST_RULE}
${NO_PROBE_TALK}
Return {md, json (absolute paths), sha_md, sha_json (sha256sum of each), rule_ids (every rules[].id)}.`), {label: 'spec integrator', phase: 'Integrate', schema: INTEG2, ...M('integ')})
if (!integ) return stop('agent died: spec integrator')
const redPrompt = `Red-team the street spec ${SPEC_MD} and ${SPEC_JSON}: find contradictions between its sections, against the rulings below and against the determinism contract (${DET_RULE}). Also check the street bible ${BIBLE_JSON} for anything the spec contradicts. Each {a, b (quote both sides), what (the concrete fix), severity: "blocking" (a builder would build the wrong thing or break determinism, a ruling or the bible) | "minor"}. Write nothing.
Rulings:
${rulingsAll}`
const red = await agent(PS(redPrompt), {label: 'red team', phase: 'Integrate', schema: RED, ...M('judge')})
if (!red) { log('red team died: contradictions unchecked'); gaps.push('red team died: spec contradictions unchecked') }
const blocking = red ? arr(red.contradictions).filter(c => c && c.severity === 'blocking') : []
if (red) arr(red.contradictions).filter(c => c && c.severity !== 'blocking').forEach(c => gaps.push('minor contradiction: ' + c.what))
if (blocking.length) {
  const pat = await crit(PS(`Patch the street spec ${SPEC_MD} and ${SPEC_JSON}: fix each blocking contradiction below; never renumber or reuse rule ids (append new ones after the highest); change nothing else; keep both files consistent.
${J(blocking)}
${SPEC_SHAPE}
${DET_RULE}
${VOCAB_ST_RULE}
${NO_PROBE_TALK}
${LEAK_RULE}
Return {md, json, sha_md, sha_json, rule_ids}.`), {label: 'spec patcher', phase: 'Integrate', schema: INTEG2, ...M('judge')})
  if (!pat) return stop('agent died: spec patcher')
}

// ---- Units ----
phase('Units')
const unitsW = await agent(PS(`You are the unit planner. Read ${SPEC_MD} and ${SPEC_JSON} (and the bible ${BIBLE_JSON} for context). Write "units" into ${SPEC_JSON} (overwrite it in place when present; keep every other key byte-for-byte):
[{id, slice, title, kind: ${UNIT_KINDS.join(' | ')}, files: [repo-relative paths], deps: [unit ids], covers: [SS rule ids], hooks: [hook line literals, each exactly a /hook_lines line], acceptance: [{id, kind: ${ACC_KINDS.join(' | ')}, cmd, expect}], model?, effort?}]
- Slices ${SLICES.map(s => s + ' ' + SLICE_NAME[s]).join(', ')}; ids "<slice>.U<nn>"; at most ${UNITS_PER_SLICE} units per slice; deps never point to a later slice; no cycles.
- Mandatory units (exact ids): ${J(Object.fromEntries(Object.entries(MANDATORY_UNITS).filter(([k]) => k !== 'S4.Ufog' || FOG_OK)))}${FOG_OK ? '' : ' (no S4.Ufog: the R13 fog function does not exist yet, so the fog stays a recorded gap)'}. S4.Unotices depends on S0.U02.
- files: only index.html, tools/street-probe.js or docs/street/fixtures|shots|device/...; never maps-site/, docs/filigree/, .claude/, tools/filigree-*, tools/street-drift.js, docs/street/gates|state|research/, the bible or the spec, docs/street/rulings.json, server.js, POLISH.md, CHANGELOG.md or VERSION.
- covers: together the units cover every SS rule.
- hooks: every hook line a unit adds is one /hook_lines line, copied exactly.
- acceptance: at least one item per unit, each machine-checkable: a command run from the repo root and its expected stdout; expect is ${EXPECT_GRAMMAR}. probe kind = a node ${PROBE} command. No command depends on randomness or a clock (a grep kind that counts clock or random tokens is fine).
- model (opus | sonnet | haiku) and effort (low | medium | high | xhigh | max) optional per unit.
${DET_RULE}
${LEAK_RULE}
After writing, re-read the file and JSON.parse it. Return {units_n, per_slice: {S0: n, ...}, sha_json (sha256sum of ${SPEC_JSON})}.`), {label: 'unit planner', phase: 'Units', schema: UNITW, ...M('judge')})
if (!unitsW) return stop('agent died: unit planner')

// ---- Check: four mechanical read-backs, scored in code ----
const STR_ANCH_TEXT = J(ST_ANCHOR_LITS)
async function runChecks(tag) {
  phase('Check')
  const [rd, gd, lk, vc] = await parallel([
    () => agent(PS(`Mechanical spec reader, no judging. Do NOT extract by eye: write ONE node script (mktemp -d) that reads ${SPEC_JSON}, ${BIBLE_JSON} and ${BASELINE} and prints the JSON below; run it and return its output verbatim. Write nothing else.
- units: /units as [{id, slice, kind, files, deps, covers, hooks, acceptance_n (acceptance length), acceptance_ok (every acceptance item has a non-empty id, kind one of ${J(ACC_KINDS)}, a non-empty cmd, and an expect that is ${EXPECT_GRAMMAR}; a re: regex must compile and a json: value must parse)}].
- dag_ok: every dep names an existing unit id, no dep points to a later slice (order ${J(SLICES)}), and Kahn's algorithm orders every unit; cyclic = the ids it could not order.
- untraced_bible_must: every rules[].id of the bible whose kind is "must" and that appears in no spec rules[].traces; rules_without_unit: every spec rules[].id in no unit's covers.
- checks: {<slice>: [ids]} from /checks; checks_malformed: "<slice>[<i>]" for every entry without a non-empty id and cmd, or whose expect is not in the grammar above.
- caps: {<SVn>: {${CAP_METRICS.join(', ')}}} from /caps/<SVn>/on for ${CAP_VIEWS.join(', ')} (null for a missing or non-numeric value); caps_ceiling_over: "<SVn>.<metric>" wherever the spec value exceeds the bible's caps_ceiling.<SVn>.<metric> (metrics the ceiling names); far_quiet_ok: for SV5 and SV9 the spec's calls, tris and objects equal the baseline's views.<SVn> values.
- determinism: {allowed_sources, new_sim_state, key_idiom} from /determinism; rng_in_acceptance: "<unit id or slice>:<acceptance or check id>" for every unit acceptance or /checks entry that would CALL the clock or random source: skip entries whose kind is grep, whose id is street.static_clock or street.static_rng, or whose cmd only names the tokens inside a grep, rg, includes, indexOf or regex text scan; flag the rest whose cmd matches /${ST_CLOCK_GREP}/.
- hash: {params, consumes} from /hash, table: every /hash/table[].hash.
- hook_lines: /hook_lines verbatim as [{line, replaces}]; hook_map_ok: every line contains "${HOOK_MARK}", no non-null replaces contains it, no two hooks replace the same line, and every line with a non-null replaces starts with the same leading whitespace as its replaces.
- limits: {fade_ms: /fade/ms, max_jobs_frame, tri_cap_frame, resident_tris: from /stream, s0, T, v0: from /traffic (each the number there, or null when missing or not a JSON number), hysteresis: /tiers/hysteresis as [{tier, in_R, out_R}] (in_R / out_R null when not a JSON number; [] when missing), caravan_tiers: /traffic/tiers as [{tier, in_R, out_R}] (same null/[] rules)}.
- block: {placement, namespace} from /block; fog_unit: some unit id is "S4.Ufog"; notices_unit: some unit id is "S4.Unotices".
- pointers: {<pointer>: the value at that RFC 6901 pointer of the spec json (any type), or null when it does not resolve} for each of ${J([...new Set(specProbes.map(p => p.pointer))])}.
- sha_md, sha_json, sha_tidings: sha256sum of ${SPEC_MD}, ${SPEC_JSON} and ${TIDINGS}.
- prereq_unqueued: the item of every /prerequisites entry for which neither its polish_title (when non-empty) nor the exact text "Street data (S3) — <item>" occurs in ${REPO}/POLISH.md.
Missing values are [] / "" / false / null, never invented.`), {label: 'spec reader' + tag, phase: 'Check', schema: READER, ...M('mech')}),
    () => agent(PS(`Mechanical literal guard, no judging (a node script in a mktemp -d dir, String.indexOf; write nothing).
1. lost: collect every "index.html :: <literal>" citation in ${SPEC_MD} (to the end of the line, surrounding backticks stripped) and in every string of ${SPEC_JSON}, plus /block/placement, goes to lost when it does not occur in ${REPO}/index.html. /block/placement must also be a non-empty string that occurs on EXACTLY ONE line of ${REPO}/index.html (split on the newline character, count the lines that contain it): empty goes to lost as "block.placement :: empty", a count above 1 as "<placement> :: ambiguous (<n> lines)". Every non-null /hook_lines[].replaces must equal EXACTLY one full line of ${REPO}/index.html (split on the newline character, compare whole lines with indentation, count the equal lines): count 0 goes to lost as "<replaces> :: not a whole line", count above 1 as "<replaces> :: ambiguous (<n> lines)".
2. fil_literals_touched: read ${REPO}/.claude/workflows/filigree-1-research.js, take the text from the line that starts "const ANCHORS = [" through the next line that is exactly "]", evaluate it as an array literal, keep the entries whose path is "index.html" and whose flag is 1; every /hook_lines entry whose line or replaces contains one of those literals gives "<line> :: <literal>".
3. street_literals_touched: the same for these street literals: ${STR_ANCH_TEXT}.
Return {lost, fil_literals_touched, street_literals_touched}.`), {label: 'literal guard' + tag, phase: 'Check', schema: GUARD, ...M('mech')}),
    () => agent(PS(`Leak grep (a node script in a mktemp -d dir; write nothing): the regex source ${J(LEAK_RE)} with flags "gi" over ${SPEC_MD} line by line, skipping the "## Provenance" section (a section runs to the next "## " heading), and over every string value anywhere in ${SPEC_JSON}. Return {hits: ["<file>:<line or json path>: <match>", ...]} (empty when clean).`), {label: 'leak grep' + tag, phase: 'Check', schema: VHITS, ...M('mech')}),
    () => agent(PS(`Vocabulary grep (a node script in a mktemp -d dir; write nothing): the regex source ${J(VOCAB_ST.source)} with flags "gi" over ${SPEC_MD} line by line, skipping the sections "## Provenance" and "## Renames" (a section runs to the next "## " heading), and over every string value under a "label", "row", "text" or "player" key anywhere in ${SPEC_JSON}. Return {hits: ["<file>:<line or json path>: <match>", ...]} (empty when clean).`), {label: 'vocabulary grep' + tag, phase: 'Check', schema: VHITS, ...M('mech')})
  ])
  for (const [x, n] of [[rd, 'spec reader'], [gd, 'literal guard'], [lk, 'leak grep'], [vc, 'vocabulary grep']]) if (!x) log('agent died: ' + n + tag)
  return {rd, gd, lk, vc}
}

// ---- Cold-engineer gate: two blind readers, identical prompts ----
const coldPath = (X, tag) => `${OUTABS}/cold/${X}${tag ? '-r' + tag.trim().slice(1) : ''}.json`
const readerAllowed = (X, tag) => READER_ALLOWED.concat([coldPath(X, tag)])
async function runGate(tag) {
  phase('Cold-engineer gate')
  const rs = await parallel(['A', 'B'].map(X => () => agent(PS(`You are an engineer who will build a street view into a three.js sim from a spec, and has never seen anything else about it. You may read ONLY ${READER_ALLOWED.join(' and ')}. Open nothing else (no other file, directory listing, repository file or the web): the script checks files_read against this allowlist.
Answer every question below from the spec alone. For a question whose answer the spec does not state, still answer your best guess and list it in guesses as {id, why}. Answer in exactly the format q asks for; where options are listed, answer with exactly one of those tokens (an order question: those tokens as an array, in order); numbers as numbers.
Questions: ${probeList}
Write your answers object to ${coldPath(X, tag)} (create the directory; do not read it back).
files_read = every file you opened for reading (absolute paths). Return {answers: {<id>: value}, guesses, files_read}.`, true), {label: 'reader ' + X + tag, phase: 'Cold-engineer gate', schema: READ2, ...M(X === 'A' ? 'deep' : 'judge')})))
  const R = {A: rs[0] || null, B: rs[1] || null}
  const audits = await parallel(['A', 'B'].map(X => () => {
    const g = R[X] ? arr(R[X].guesses).filter(x => x && x.id) : []
    if (!g.length) return Promise.resolve({verdicts: []})
    return agent(PS(`Guess audit for reader ${X}. For each guess below, read ${SPEC_MD} and ${SPEC_JSON} and decide: is the answer derivable from the spec text (schema_guess false: the spec states it, the reader missed it), or did the reader have to guess where the spec's structure promises an answer it does not give (schema_guess true)? The question texts: ${J(probes.filter(p => g.some(x => x.id === p.id)).map(p => ({id: p.id, q: p.q, pointer: p.pointer || ''})))}.
Guesses: ${J(g)}
Exactly one verdict per guess id, none skipped. Write nothing. Return {verdicts: [{id, schema_guess}]}.`), {label: 'guess audit ' + X + tag, phase: 'Cold-engineer gate', schema: AUDITG, ...M('triage')})
  }))
  return {R, audits: {A: audits[0] || null, B: audits[1] || null}, tag}
}

// ---- evaluate: SG2.0..SG2.15, scored in code from the reader, the guard, the greps and the readers' answers ----
function score(rdr, rd) {
  if (!rdr) return null
  const ans = rdr.answers || {}, pts = (rd && rd.pointers) || {}
  const wrong = probes.filter(p => !probeEq(KNOWN[p.id] ? {...p, kind: KNOWN[p.id].kind, tol: KNOWN[p.id].tol, options: KNOWN[p.id].options} : p, ans[p.id], p.source === 'spec' ? pts[p.pointer] : p.answer)).map(p => p.id)
  return {pct: percent(probes.length - wrong.length, probes.length), wrong}
}
function evaluate(ck, gt) {
  const rd = ck.rd, gd = ck.gd, RD = 'agent died: spec reader'
  const units = rd ? arr(rd.units).filter(Boolean) : [], ids = new Set(units.map(u => u.id))
  const perSlice = Object.fromEntries(SLICES.map(s => [s, units.filter(u => u.slice === s).length]))
  const badSlice = units.filter(u => !SLICES.includes(u.slice)).map(u => `${u.id}: slice ${J(u.slice)}`)
  const s1 = !rd ? [RD] : [
    units.length ? '' : 'no units',
    arr(rd.untraced_bible_must).length ? 'untraced bible must: ' + rd.untraced_bible_must.join(', ') : '',
    arr(rd.rules_without_unit).length ? 'rules without unit: ' + rd.rules_without_unit.join(', ') : '',
    rd.dag_ok === true && !arr(rd.cyclic).length ? '' : 'dag: ' + (arr(rd.cyclic).join(', ') || 'not ok'),
    ...SLICES.filter(s => perSlice[s] > UNITS_PER_SLICE).map(s => `${s} has ${perSlice[s]} units (max ${UNITS_PER_SLICE})`), ...badSlice,
    ...units.filter(u => !(u.acceptance_n >= 1 && u.acceptance_ok === true)).map(u => `${u.id}: acceptance ${u.acceptance_n} item(s), ok ${u.acceptance_ok}`),
    ...units.filter(u => !UNIT_KINDS.includes(u.kind)).map(u => `${u.id}: kind ${J(u.kind)}`)].filter(Boolean)
  const fileViol = units.flatMap(u => arr(u.files).length ? arr(u.files).filter(f => UNIT_PATH_BAD(f) || !UNIT_FILES_OK.test(f) || UNIT_FILES_BAD.test(f)).map(f => `${u.id}: ${f}`) : [`${u.id}: no files`])
  const nullPtr = specProbes.filter(p => !rd || rd.pointers == null || rd.pointers[p.pointer] == null).map(p => `${p.id} ${p.pointer}`)
  const sc = {A: score(gt.R.A, rd), B: score(gt.R.B, rd)}
  const ck7 = rd ? (rd.checks || {}) : {}, cIds = s => arr(ck7[s]), union = new Set(SLICES.flatMap(cIds))
  const s7 = !rd ? [RD] : [
    ...SLICES.filter(s => !cIds(s).length).map(s => `${s}: no checks`),
    arr(rd.checks_malformed).length ? 'malformed: ' + rd.checks_malformed.join(', ') : '',
    ...MANDATORY_CHECKS.filter(c => !union.has(c)).map(c => 'missing mandatory ' + c),
    ...Object.entries(SLICE_CHECKS).flatMap(([s, cs]) => cs.filter(c => !cIds(s).includes(c)).map(c => `${s} lacks ${c}`)),
    rd.fog_unit === true && !cIds('S4').includes('street.fog_copy') ? 'S4 lacks street.fog_copy (the fog unit exists)' : ''].filter(Boolean)
  const caps = rd ? (rd.caps || {}) : {}
  const s8 = !rd ? [RD] : [
    ...CAP_VIEWS.flatMap(v => CAP_METRICS.filter(m => !(caps[v] && typeof caps[v][m] === 'number' && Number.isFinite(caps[v][m]))).map(m => `${v}.${m} not numeric`)),
    arr(rd.caps_ceiling_over).length ? 'over the bible ceiling: ' + rd.caps_ceiling_over.join(', ') : '',
    rd.far_quiet_ok === true ? '' : 'SV5/SV9 differ from the baseline (far quiet)'].filter(Boolean)
  const det = (rd && rd.determinism) || {}
  const s9 = !rd ? [RD] : [
    sameList([...arr(det.allowed_sources)].sort(), [...ALLOWED_SOURCES].sort()) ? '' : 'allowed_sources ' + J(det.allowed_sources),
    arr(det.new_sim_state).length ? 'new sim state: ' + det.new_sim_state.join(', ') : '',
    det.key_idiom === KEY_IDIOM ? '' : 'key_idiom ' + J(det.key_idiom),
    arr(det.rng_in_acceptance).length ? 'clock/random in acceptance: ' + det.rng_in_acceptance.join(', ') : ''].filter(Boolean)
  const hash = (rd && rd.hash) || {}, params = arr(hash.params), consumes = arr(hash.consumes), table = new Set(arr(hash.table))
  const u02 = units.find(u => u.id === 'S0.U02')
  const s10 = !rd ? [RD] : [
    params.includes(HASH_PARAM) ? '' : 'params lack ' + J(HASH_PARAM),
    ...params.filter(p => !PARAM_OK(p)).map(p => 'bad param ' + J(p)),
    ...(consumes.includes('notices') ? [u02 && u02.slice === 'S0' ? '' : 'notices consumed without S0.U02 in S0', ...HASH_TABLE.filter(h => !table.has(h)).map(h => 'hash table lacks ' + h)] : [])].filter(Boolean)
  const hooks = rd ? arr(rd.hook_lines).filter(Boolean) : [], hookSet = new Set(hooks.map(h => h.line))
  const s11 = !rd ? [RD] : [
    rd.hook_map_ok === true ? '' : 'hook map not ok',
    hooks.length <= HOOKS_MAX ? '' : `${hooks.length} hook lines (max ${HOOKS_MAX})`,
    ...units.flatMap(u => arr(u.hooks).filter(h => !hookSet.has(h)).map(h => `${u.id}: undeclared hook ${J(h)}`)),
    rd.block && rd.block.namespace === 'STREET' ? '' : 'block.namespace ' + J(rd.block && rd.block.namespace),
    rd.block && typeof rd.block.placement === 'string' && rd.block.placement.trim() ? '' : 'block.placement empty or missing'].filter(Boolean)
  const uSlice = id => (units.find(u => u.id === id) || {}).slice
  const s12 = !rd ? [RD] : [
    ...['S0.U00', 'S0.U01', 'S0.U02'].filter(id => uSlice(id) !== 'S0').map(id => id + ' missing (or not in S0)'),
    FOG_OK && uSlice('S4.Ufog') !== 'S4' ? 'S4.Ufog missing (the atlas fog exists)' : '',
    !FOG_OK && ids.has('S4.Ufog') ? 'S4.Ufog present but the atlas fog does not exist (ST11: a recorded gap)' : '',
    consumes.includes('notices') && uSlice('S4.Unotices') !== 'S4' ? 'S4.Unotices missing (notices consumed)' : '',
    !consumes.includes('notices') && ids.has('S4.Unotices') ? 'S4.Unotices present but notices not consumed' : ''].filter(Boolean)
  const lim = (rd && rd.limits) || {}, isNum = v => typeof v === 'number' && Number.isFinite(v), hy = arr(lim.hysteresis).filter(Boolean)
  const s16 = !rd ? [RD] : [
    isNum(lim.fade_ms) && lim.fade_ms >= 0 && (OVR.R6 || lim.fade_ms <= 250) ? '' : `/fade/ms ${J(lim.fade_ms ?? null)} (${OVR.R6 ? 'a number >= 0; R6 overridden' : '0..250, R6'})`,
    Number.isInteger(lim.max_jobs_frame) && lim.max_jobs_frame >= 1 && (OVR.ST9 || lim.max_jobs_frame <= 6) ? '' : `/stream/max_jobs_frame ${J(lim.max_jobs_frame ?? null)} (${OVR.ST9 ? 'an integer >= 1; ST9 overridden' : 'an integer 1..6, ST9'})`,
    ...[['stream', 'tri_cap_frame'], ['stream', 'resident_tris'], ['traffic', 's0'], ['traffic', 'T'], ['traffic', 'v0']].filter(([, k]) => !(isNum(lim[k]) && lim[k] > 0)).map(([o, k]) => `/${o}/${k} ${J(lim[k] ?? null)} (a positive number)`),
    arr(lim.caravan_tiers).filter(Boolean).length >= 3 ? '' : '/traffic/tiers needs at least far, mid and near caravan tiers',
    ...arr(lim.caravan_tiers).filter(Boolean).filter(h => !(isNum(h.in_R) && isNum(h.out_R) && h.in_R > 0 && h.out_R > h.in_R && h.out_R <= MESH_HI)).map(h => `/traffic/tiers ${J(h)} (0 < in_R < out_R <= ${MESH_HI})`),
    hy.length ? '' : '/tiers/hysteresis empty',
    ...hy.filter(h => !(isNum(h.in_R) && isNum(h.out_R) && h.in_R > 0 && h.out_R > h.in_R && h.out_R <= MESH_HI)).map(h => `/tiers/hysteresis ${J(h)} (0 < in_R < out_R <= ${MESH_HI})`)].filter(Boolean)
  const blind = [], guessBad = []
  for (const X of ['A', 'B']) {
    const r = gt.R[X]
    if (!r) { blind.push(`agent died: reader ${X}`); continue }
    blindBad(r.files_read, readerAllowed(X, gt.tag)).forEach(p => blind.push(`${X}: ${p}`))
    const gs = [...new Set(arr(r.guesses).filter(x => x && x.id).map(x => x.id))], au = gt.audits[X]
    if (gs.length && !au) { guessBad.push(`agent died: guess audit ${X}`); continue }
    for (const id of gs) {
      const v = arr(au && au.verdicts).find(x => x && x.id === id)
      if (!v) guessBad.push(`${X}#${id}: no verdict`); else if (v.schema_guess === true) guessBad.push(`${X}#${id}: schema-path guess`)
    }
  }
  const arts = [['street-spec.md', rd && rd.sha_md], ['street-spec.json', rd && rd.sha_json], ['street-bible.json', BSHA], ['gates/2-probes.json', PROBES_SHA], ['fixtures/tidings.json', rd && rd.sha_tidings]]
  const noSha = arts.filter(([, h]) => !HEX64.test(h || '')).map(([p]) => p)
  const tideDrift = rd && HEX64.test(rd.sha_tidings || '') && rd.sha_tidings !== TIDE_SHA ? [`fixtures/tidings.json re-hashes to ${rd.sha_tidings}, not the recorded ${TIDE_SHA || '(none)'}`] : []
  const pctOk = X => !!sc[X] && sc[X].pct >= READER_PCT
  const criteria = [
    C('SG2.0', 'chain held (Street 1 pass, bible unchanged, filigree bible and cited rulings unchanged)', chainOk ? (FORCE ? 'held; forced: ' + FORCE : 'held') : chain.concat(FORCE ? ['forced: ' + FORCE] : []), 'true (forced -> recorded, never pass)', chainOk && !FORCE),
    C('SG2.1', 'traceability + structure (spec reader): untraced must, rules without unit, DAG, <=9 units per slice, acceptance', s1.length ? s1 : 'ok', 'all', !s1.length),
    C('SG2.2', 'unit files inside UNIT_FILES_OK, never UNIT_FILES_BAD', !rd ? RD : fileViol.length ? fileViol : 0, '0 violations', !!rd && !fileViol.length),
    C('SG2.3', 'literal guard: cited literals resolve; no hook touches a filigree or street anchor literal', !gd ? 'agent died: literal guard' : {lost: arr(gd.lost), fil_literals_touched: arr(gd.fil_literals_touched), street_literals_touched: arr(gd.street_literals_touched)}, 'all empty', !!gd && !arr(gd.lost).length && !arr(gd.fil_literals_touched).length && !arr(gd.street_literals_touched).length),
    C('SG2.4', 'leak grep (source names outside ## Provenance)', !ck.lk ? 'agent died: leak grep' : arr(ck.lk.hits).length ? ck.lk.hits : 0, '0 hits', !!ck.lk && !arr(ck.lk.hits).length),
    C('SG2.5', 'spec-probe pointers null (spec reader)', !rd ? RD : nullPtr.length ? nullPtr : 0, '0', !!rd && !nullPtr.length),
    C('SG2.6', 'each reader', {A: sc.A ? sc.A.pct : 'agent died: reader A', B: sc.B ? sc.B.pct : 'agent died: reader B'}, `>= ${READER_PCT}%`, pctOk('A') && pctOk('B')),
    C('SG2.7', 'checks: every slice non-empty, none malformed, mandatory and per-slice ids present', s7.length ? s7 : 'ok', 'all', !s7.length),
    C('SG2.8', 'caps: SV1-SV9 numeric (6 metrics), within the bible ceiling, SV5/SV9 equal the baseline', s8.length ? s8 : 'ok', 'all', !s8.length),
    C('SG2.9', 'determinism contract', s9.length ? s9 : 'ok', 'keyed-hash + sim-read-only; no new sim state; KEY_IDIOM; no clock/random in acceptance', !s9.length),
    C('SG2.10', 'hash params and the notices parser rule', s10.length ? s10 : 'ok', 'all', !s10.length),
    C('SG2.11', 'hook lines: marked map, <= 16, unit hooks declared, one STREET namespace', s11.length ? s11 : 'ok', 'all', !s11.length),
    C('SG2.12', 'mandatory units present', s12.length ? s12 : 'ok', `S0.U00-U02; S4.Ufog iff the atlas fog exists (${FOG_OK}); S4.Unotices iff notices consumed`, !s12.length),
    C('SG2.13', 'vocabulary (VOCAB_ST)', !ck.vc ? 'agent died: vocabulary grep' : arr(ck.vc.hits).length ? ck.vc.hits : 0, '0 hits', !!ck.vc && !arr(ck.vc.hits).length),
    C('SG2.14', 'blindness (allowlist check on self-reported files_read) and zero schema-path guesses', blind.length || guessBad.length ? {blind, guesses: guessBad} : 'ok', 'files_read within READER_ALLOWED; 0 schema guesses; every guess audited', !blind.length && !guessBad.length),
    C('SG2.15', 'artifacts hashed: spec md/json and tidings (spec reader), bible json (preflight), probes (readback)', noSha.length || tideDrift.length ? {missing: noSha, drift: tideDrift} : 'ok', 'five 64-hex shas; tidings re-hash equals the recorded sha', !noSha.length && !tideDrift.length),
    C('SG2.16', 'limits Street 3 gates on (spec reader): fade.ms, stream max_jobs_frame / tri_cap_frame / resident_tris, traffic s0 / T / v0, hysteresis bounds', s16.length ? s16 : 'ok',
      `fade.ms ${OVR.R6 ? '>= 0 (R6 overridden)' : '<= 250 (R6)'}; max_jobs_frame integer ${OVR.ST9 ? '>= 1 (ST9 overridden)' : '1..6 (ST9)'}; the rest positive numbers; 0 < in_R < out_R <= ${MESH_HI}`, !s16.length)]
  const wrongBoth = sc.A && sc.B ? sc.A.wrong.filter(id => sc.B.wrong.includes(id)) : []
  const noise = sc.A && sc.B ? sc.A.wrong.concat(sc.B.wrong).filter(id => !wrongBoth.includes(id)) : []
  return {criteria, sc, wrongBoth, noise, nullPtr, s1, s7, s8, s9, s10, s11, s12, s16, fileViol, guessBad, perSlice, units}
}
const failingIds = ev => ev.criteria.filter(c => !c.pass).map(c => c.id)
const NOT_FIXABLE = new Set(['SG2.0', 'SG2.15'])

let ck = await runChecks('')
let gt = await runGate('')
let ev = evaluate(ck, gt)
if (ev.noise.length) log('one-reader probe misses (noise, not fixed): ' + [...new Set(ev.noise)].join(', '))

// ---- Fix (bounded by ROUNDS; each cited item asked at most once per round, deduplicated) ----
const asked = new Set()
while (rounds < ROUNDS && ev.criteria.some(c => !c.pass && !NOT_FIXABLE.has(c.id))) {
  if (lowBudget()) { log('budget: fix round skipped'); break }
  if (!ck.rd) return stop('agent died: spec reader')   // never hand a dead reader's RD strings or null pointers to the fixer
  const rr = rounds + 1, tag = ' r' + rr
  phase('Fix')
  const items = []
  const add = (k, v) => { const sig = k + ':' + J(v); if (!asked.has(sig + '@' + rr)) { asked.add(sig + '@' + rr); items.push({kind: k, item: v}) } }
  ev.wrongBoth.forEach(id => { const p = probes.find(x => x.id === id); if (p) add('probe both readers missed', p.source === 'spec' ? {q: p.q, pointer: p.pointer} : {q: p.q, answer: p.answer, source: p.source}) })
  ev.nullPtr.forEach(x => add('null pointer', x))
  ev.s7.forEach(x => add('checks', x)); ev.s8.forEach(x => add('caps', x)); ev.s1.forEach(x => add('structure', x))
  ev.s9.forEach(x => add('determinism', x)); ev.s10.forEach(x => add('hash', x)); ev.s11.forEach(x => add('hooks', x)); ev.s12.forEach(x => add('mandatory unit', x)); ev.s16.forEach(x => add('limits', x))
  ev.fileViol.forEach(x => add('unit files', x)); ev.guessBad.forEach(x => add('schema guess', x))
  if (ck.gd) ['lost', 'fil_literals_touched', 'street_literals_touched'].forEach(k => arr(ck.gd[k]).forEach(x => add('literal ' + k, x)))
  if (ck.lk) arr(ck.lk.hits).forEach(x => add('leak', x))
  if (ck.vc) arr(ck.vc.hits).forEach(x => add('vocabulary', x))
  if (!items.length) { log('fix: the failing criteria (' + failingIds(ev).join(',') + ') cite nothing the spec fixer can change (blindness, one-reader noise or a dead agent); no round run'); break }
  rounds = rr
  log(`fix round ${rr}: ${items.length} cited item(s); failing ${failingIds(ev).join(',')}`)
  const fx = await agent(PS(`You are the spec fixer, round ${rr}. Patch ${SPEC_MD} and ${SPEC_JSON} ONLY where cited below; never renumber or reuse rule or unit ids; keep both files consistent; keep everything else byte-for-byte.
- A probe both readers missed means the spec is ambiguous there: state the answer explicitly (a fixed question: its answer is the one given, settled by the bible, the views, the baseline or a ruling; a spec question: the value at its pointer).
- A null pointer: put the decision at exactly that JSON pointer.
- checks / caps / structure / mandatory unit / unit files / hooks / hash / determinism / limits items: correct /checks, /caps, /units, /hook_lines, /hash, /determinism, /fade, /stream, /traffic (its tiers included) or /tiers/hysteresis to the shape and rules below (acceptance expect is ${EXPECT_GRAMMAR}).
- A schema guess: state the missing decision where the spec's structure promises it.
- literal items: re-anchor to the current index.html literal (grep -nF) or drop the claim; a hook may not touch an anchor literal (move it to another line).
- leak / vocabulary hits: reword, or move source names into "## Provenance".
Cited items: ${J(items)}
${SPEC_SHAPE}
Mandatory units: ${J(Object.fromEntries(Object.entries(MANDATORY_UNITS).filter(([k]) => k !== 'S4.Ufog' || FOG_OK)))}
Rulings:
${rulingsAll}
${DET_RULE}
${VOCAB_ST_RULE}
${NO_PROBE_TALK}
${LEAK_RULE}
Return {md, json, sha_md, sha_json (sha256sum of each), fixed (one line per item you fixed)}.`), {label: 'spec fixer' + tag, phase: 'Fix', schema: FIXR, ...M('judge')})
  if (!fx) return stop('agent died: spec fixer' + tag)
  ck = await runChecks(tag)
  gt = await runGate(tag)
  ev = evaluate(ck, gt)
  if (ev.noise.length) log('one-reader probe misses' + tag + ' (noise, not fixed): ' + [...new Set(ev.noise)].join(', '))
}

if (!ck.rd) return stop('agent died: spec reader')
// ---- Record ----
phase('Record')
const rd = ck.rd
for (const X of ['A', 'B']) { const g = gt.R[X]; if (g) arr(g.guesses).filter(x => x && x.id).forEach(x => gaps.push(`reader ${X} guessed ${x.id}: ${x.why}`)) }
const failing = failingIds(ev)
const gateRec = gateObj({criteria: ev.criteria, rounds, rulings_used: RUSED, street_rulings_used: SUSED, gaps,
  chain_ok: chainOk, chain, fil_bible_sha256: g1.fil_bible_sha256 || '', fil_rulings_cited: g1.fil_rulings_cited || {}, bible_sha256: BSHA, rulings_stamp: RSTAMP, fog_source: FOG_SRC,
  probes_n: probes.length, readers: {A: ev.sc.A ? {pct: ev.sc.A.pct, wrong: ev.sc.A.wrong} : null, B: ev.sc.B ? {pct: ev.sc.B.pct, wrong: ev.sc.B.wrong} : null},
  units_per_slice: ev.perSlice, sections_resumed: secResumed.map(s => s.sid),
  artifacts: [{path: OUT + '/street-spec.md', sha256: (rd && rd.sha_md) || ''}, {path: OUT + '/street-spec.json', sha256: (rd && rd.sha_json) || ''},
    {path: OUT + '/street-bible.json', sha256: BSHA}, {path: OUT + '/gates/2-probes.json', sha256: PROBES_SHA}, {path: OUT + '/fixtures/tidings.json', sha256: TIDE_SHA}]})
const stateRec = ledgerRec({md: (rd && rd.sha_md) || '', json: (rd && rd.sha_json) || ''})
const recs = [await record('gates/2-plan.json', gateRec, 'record gate'), await record('state/2-plan.json', stateRec, 'record ledger')]
const recOk = recs.every(Boolean)
const reason = FORCE ? 'forced: ' + FORCE + (recOk ? '' : '; record-mismatch') : !recOk ? 'record-mismatch' : gateRec.pass ? '' : (failing.join(',') || MODE)
const nU = s => ev.perSlice[s] || 0
const pctTxt = X => ev.sc[X] ? ev.sc[X].pct + '%' : 'dead'
return done({pass: gateRec.pass && recOk, reason, rounds, chain_ok: chainOk, gate: gateRec,
  outputs: [OUT + '/street-spec.md', OUT + '/street-spec.json', OUT + '/spec/', OUT + '/gates/2-probes.json', OUT + '/fixtures/tidings.json', OUT + '/cold/', OUT + '/gates/2-plan.json', OUT + '/state/2-plan.json'],
  gate_path: OUT + '/gates/2-plan.json', owner_rulings_used: RUSED, street_rulings_used: SUSED,
  polish_note: `street spec: ${ev.units.length} units (S0 ${nU('S0')} / S1 ${nU('S1')} / S2 ${nU('S2')} / S3 ${nU('S3')} / S4 ${nU('S4')}), readers ${pctTxt('A')} / ${pctTxt('B')}, ${probes.length} probes; gate ${gateRec.pass ? 'pass' : 'fail'}`,
  polish_inserts: [...new Set(arr(rd && rd.prereq_unqueued).filter(Boolean))].map(t => `- [ ] **Street data (S3) — ${t}**`), polish_inserts_above: 'Street 3',
  changelog_line: '- docs: Street 2 — street spec (cold-engineer gate ' + (gateRec.pass ? 'pass' : 'fail') + ')'})
