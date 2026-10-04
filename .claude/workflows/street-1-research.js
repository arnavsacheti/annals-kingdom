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
const JOB = 'street-1-research'
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

// ---- fixtures, checklist and fixed constants (design §3, literal) ----
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
const PROBE_REL = MODE === 'smoke' ? OUT + '/tools/street-probe.js' : 'tools/street-probe.js'
const CRIT_MAX = 2   // crit(): a null first answer launches one retry
const RULES_TEXT = [JSON.stringify(VIEW_RULES), FOCUS_RULES, DAY_RULES, TOD_RULES, CAMERA_RULE].join('\n')   // stamped verbatim into views.json "rules"; any change is a fixture change
const RULES_FILE = {date: DATE, v: V_BUST, rules: RULES_TEXT, views: VIEW_RULES}
const viewRule = id => VIEW_RULES.find(v => v.id === id)
const infraOf = x => !!x && typeof x.infra_error === 'string' && x.infra_error.trim() !== ''
const DET_RULE = `Determinism (ST3, ST4): anything you propose for street code takes its randomness only from the sim's keyed stream ${KEY_IDIOM} (index.html function makeStream = xmur3 -> sfc32; the sim has no mulberry32), cached per key; presentation time accumulates from dt only (ST.t); gen and sim code never call Math[.]random, Date[.]now or performance[.]now, and the STREET block never names W.rng or nowMs; street code moves only mesh transforms (departDay, route and speed are never touched).`

// ---- the probe contract (q01, its recount and its fixer) ----
const PROBE_FLAGS = ['--port', '--cdn-dir', '--view', '--views', '--freeze-views', '--out', '--shots', '--dark-scan', '--seed', '--metrics', '--layers', '--fingerprint', '--days', '--walk', '--perturb', '--paths <a,b,..>', '--vfps <30,60>', '--device', '--stats-keys', '--help']
const PROBE_SPEC = `PROBE_SPEC — ${PROBE_T} (the street track's instrument; Street 3 extends it and never breaks it):
- Plain Node + Playwright from NODE_PATH; read-only on the repo (writes only --out and --shots); no npm installs; sorted object keys and stable array order, so every exact field is byte-stable across runs; no clock or random call syntax outside the fenced installer /* VCLOCK */ ... /* /VCLOCK */ (grep -cE '${ST_CLOCK_GREP}' over the file with the fenced text removed = 0).
- Server and CDN: its own read-only static server over the repo on --port (default 0 = an OS-assigned free port); --cdn-dir <dir> routes the two CDN globs to disk (the sandbox recipe); never starts, stops or touches server.js or port 8544.
- Virtual clock (page.addInitScript, before any page script): requestAnimationFrame, performance[.]now and Date[.]now on a fixed timeline, dt = 1/--vfps (default 60); Math[.]random replaced by a seeded copy of the sim's xmur3 -> sfc32 keyed 'probe'; the director held (ANNALS.hold(1e12)), speed 0, tod pinned. The probe pumps frames itself, so fps reads 60 and the degrade ladder never trips in measurement. Page loads use /?v=${V_BUST}#s=<seed>.
- View spec: --view <seed>:<day>:<focus>:<R>:<tod> (focus = x,z or a focus token; inside --view a token writes its colon as "=", e.g. settlement=Epēshu) or --views <views.json> (entries carry x, z or a focus token); the camera per CAMERA_RULE: ${CAMERA_RULE}.
  Focus tokens: ${FOCUS_RULES}.
  Day tokens: ${DAY_RULES}.
  Tod tokens: ${TOD_RULES}.
- --freeze-views <rules.json> --out <views.json> --shots <dir>: rules.json = {date, v, rules (a string), views (the view rules)}; resolve every rule's focus, day and tod tokens and write {date, frozen: true, rules (copied verbatim from rules.json), views: [{id, seed, day, x, z, R, tod, yaw: 0, focus, fallback?}]} plus one JPEG still per view at <dir>/<id>.jpg (UI chrome hidden, <= 300 KB).
- --dark-scan --seed <s>: the dark-hour midpoint tod (the tod rule). For each f = k/1000: ANNALS.tod(f), ANNALS.step(1), then in the page (global script bindings are readable from page.evaluate) the proxy smooth((_sunDir.dot(_tamarDir) - 0.955) / (0.985 - 0.955)) * clamp01(Math.asin(_sunDir.y) * 6), i.e. the code's own "const darkHour =" with sunElev (a local) recovered as asin(_sunDir.y).
- --metrics <csv> over calls, tris, geoms, textures, objects, stats_keys: calls and tris from renderer.info.render after one settled render, geoms and textures from renderer.info.memory, objects = scene objects counted by type, stats_keys = Object.keys(ANNALS.stats()).
- --layers street=0: asserts ANNALS.street is absent (Street 3 adds street=1).
- --fingerprint --seed <s> --days <n> [--walk <views.json>] [--perturb departDay]: speed 0, simDays(n) (with --walk: 8 chunks of n/8 days, the camera parked at SV1..SV8 with 120 pumped frames between chunks), then sha256 of a canonical JSON of {clock: W.clock, dayTicked, settlements: [{id|name, pop, kind, prosperity}], agents: [{kind, departDay, route key, speed}], chron: the W.chron texts, treasury, routeVolume}; output fingerprint = {seed, days, walk, perturb, sha256}. --perturb departDay adds 1 to the first caravan's departDay in page memory before simDays (the sensitivity test: the sha must change).
- --paths <a,b,..> (one or more of descent, oscillate, flyaway, comma-separated; never repeated flags) and --vfps <30,60> (30, 60 or 30,60): per-frame records {f, R, calls, tris, geoms}; descent 11000 -> 9 log-linear over 900 frames at SV1's focus; oscillate R 170<->230 and 2150<->2450, 600 frames; flyaway SV1 -> R 11000 -> SV1 twice, then ANNALS.seed('tamar1374') and back to epeshu and SV1.
- --device: real clock, headed when a display exists, the SV1 descent for 60 s, per-second ANNALS.stats().fps -> docs/street/device/<date>.json; owner-run only, never inside a workflow.
- --stats-keys; --help (lists every flag literally: ${PROBE_FLAGS.join('  ')}); --out <path>.
- Output: one JSON {tool_sha (sha256 of the probe file), index_sha (sha256 of index.html), views: {SVn: {...}}, fingerprint: {...}, paths: {...}, console_errors: [...], infra_error: ""}; a setup failure (port, browser, CDN) is infra_error, never a street defect.`
const PROBE_LIT = [
  'fingerprint twice: --fingerprint --seed epeshu --days 30, two runs -> equal 64-hex fingerprint.sha256 (sha_run1, sha_run2)',
  'sensitivity: --fingerprint --seed epeshu --days 30 --perturb departDay -> a sha256 different from sha_run1 (perturbed_differs)',
  'one view: --view epeshu:120:settlement=Epēshu:600:0.5 --metrics calls,tris -> integers > 0 (view_calls, view_tris; null when unreadable)',
  `stats keys: --stats-keys -> deep-equals ${JSON.stringify(STATS_KEYS)} (stats_keys = the printed array)`,
  `clock syntax: lines of the probe file outside the /* VCLOCK */ ... /* /VCLOCK */ fence matching the regex ${ST_CLOCK_GREP} -> 0 (clock_hits = the count; a node script removes the fenced text first)`,
  `byte-stable views: --views over a one-view temp file twice, each run with its own --out -> byte-equal output files (views_equal); the one view is SV1 of ${VIEWS_JSON} when that file exists, else {"id":"T1","seed":"epeshu","day":120,"focus":"settlement:Epēshu","R":600,"tod":0.5,"yaw":0}`,
  `help: --help lists every one of ${JSON.stringify(PROBE_FLAGS)} as a literal substring (flags_missing = the absent ones)`
]
const PROBE_LIT_TEXT = 'PROBE_LIT (scored in code by the script):\n' + PROBE_LIT.map((t, i) => `${i + 1}. ${t}`).join('\n')
const probeTask = lits => `exists = ${PROBE_T} exists. If it does not, return exists false, every string "", every number null, every boolean false and every array []. Otherwise, from ${REPO}, run ${lits ? 'ONLY literals ' + lits.join(', ') : 'every literal'} below with node ${PROBE_T} (outputs and temp files in a mktemp -d dir, never in the repo) and report what the commands printed: sha_run1, sha_run2, perturbed_differs, view_calls, view_tris, stats_keys, clock_hits, views_equal, flags_missing as each literal names them${lits ? '; for the literals you do not run return perturbed_differs false, views_equal false, flags_missing []' : ''}. tool_sha = sha256sum ${PROBE_T}. infra_error = "" or the setup failure (port, browser, CDN) that kept a literal from running. Never edit the probe.
${PROBE_LIT_TEXT}`
const posInt = v => Number.isInteger(v) && v > 0
function probeWhy(p, lits) {   // the failing PROBE_LIT items, scored here from a recount (never from the probe writer)
  const L = lits || [1, 2, 3, 4, 5, 6, 7]
  if (!p) return ['no probe reading']
  if (p.exists !== true) return ['probe missing: ' + PROBE_REL]
  if (infraOf(p)) return ['infra: ' + p.infra_error]
  const w = []
  if (L.includes(1) && !(HEX64.test(p.sha_run1 || '') && p.sha_run1 === p.sha_run2)) w.push(`1 fingerprint not reproducible (${p.sha_run1 || '-'} vs ${p.sha_run2 || '-'})`)
  if (L.includes(2) && p.perturbed_differs !== true) w.push('2 fingerprint insensitive to --perturb departDay')
  if (L.includes(3) && !(posInt(p.view_calls) && posInt(p.view_tris))) w.push(`3 view metrics calls ${p.view_calls}, tris ${p.view_tris}`)
  if (L.includes(4) && JSON.stringify(p.stats_keys || []) !== JSON.stringify(STATS_KEYS)) w.push('4 stats keys ' + JSON.stringify(p.stats_keys || []))
  if (L.includes(5) && p.clock_hits !== 0) w.push(`5 clock syntax outside the VCLOCK fence: ${p.clock_hits}`)
  if (L.includes(6) && p.views_equal !== true) w.push('6 --views output not byte-stable')
  if (L.includes(7) && !(Array.isArray(p.flags_missing) && p.flags_missing.length === 0)) w.push('7 --help lacks ' + (p.flags_missing || []).join(' '))
  return w
}
const probePass = p => probeWhy(p).length === 0
const PRE_LITS = [1, 3, 4, 5]   // what the preflight re-measures for resume; the Tool phase always recounts 1-7

// ---- questions (design §3.1; one targeted task each) ----
const QUESTIONS = [
  {qid: 'q01', short: 'probe tool', tool: true, question: 'Write the read-only street probe to PROBE_SPEC (below) so it meets every PROBE_LIT item; claims = each flag and output field, each with a computed evidence ref (the command you ran and what it printed).', reads: ['index.html (anchor window.ANNALS = { : the debug API the probe drives)', 'docs/street/README.md §8 (f)-(g0) (the sandbox recipe; the prompt carries it as SANDBOX_ST)'], role: 'deep', lens: ['recount']},
  {qid: 'q02', short: 'clocks and the dark hour', question: 'Clocks and the dark hour: tick(dt, nowMs) -> simAdvance; simDays partition-independence at speed 0; how renderTod advances (dt/300) against W.clock.day; the darkHour formula (_sunDir, _tamarDir, the local sunElev) checked against the probe --dark-scan proxy; ANNALS.step feeding a performance[.]now reading as nowMs; what a gate-leaf rule may read (render state only).', reads: ['index.html (anchors function tick(dt, nowMs), function simAdvance(nd), const darkHour =, renderTod = (renderTod)'], role: 'audit', lens: ['refute']},
  {qid: 'q03', short: 'caravans and the stateless queue', question: 'Caravans and the stateless queue: routePos, updateAgents, processArrivals(day): the fields a render-only queue may touch (mesh transforms only); the neighbour set per (route, day) computed statelessly; the IDM calcAccDet terms at donkey pace (s0, T, v0). Run a node property test on synthetic agents (in a mktemp -d dir): monotone order, gap >= s0, d_vis <= d_true, f(day) path-independence.', reads: ['index.html (anchors function routePos(, function updateAgents(), function processArrivals(day))', 'docs/street/research-dossier.md §2 M1-M3'], role: 'deep', lens: ['refute']},
  {qid: 'q04', short: 'determinism debts', question: 'Determinism debts: every Math[.]random, Date[.]now, performance[.]now, W.rng.amb and nowMs occurrence in index.html, each with its enclosing function name and its class gen | sim | render.', reads: ['index.html'], role: 'mech', lens: ['recount']},
  {qid: 'q05', short: 'settlement street data', question: 'Settlement street data: s.streets (widths), s.buildings {t,x,z,ry,tier,sc}, s.gates, the market reserve (dd<0.30), W.bridges, W.routes, quays; sub-cell street ground against the 11.72 m heightfield grid (R22 cited: no new relief).', reads: ['index.html (anchors s.gates = [], s.streets.push, W.bridges = [])'], role: 'audit', lens: ['recount']},
  {qid: 'q06', short: 'facades and instancing', question: 'Facades and instancing: the 12 ARCH, tier materials, the 4 cached variants, windows and night glow; every InstancedMesh site and the instanceColor rule; the culling gaps (rocks, sheep, birds); where a near-only mesh must sit (never meshHi).', reads: ['index.html (anchor every InstancedMesh sharing MAT.world MUST carry instanceColor)'], role: 'audit', lens: ['recount']},
  {qid: 'q07', short: 'LOD, camera, near plane', question: 'LOD, camera and near plane: updateLOD 2400/2200 by camera-to-centre distance; label tiers by R; water fades; CAM.radius 9..11000; camera.near = clamp(R*0.02, 0.5, 50) (already dynamic); the inputs a screen-space-error refine rule would need.', reads: ['index.html (anchors function updateLOD(), camera.near = clamp(R*0.02, 0.5, 50))'], role: 'audit', lens: ['recount']},
  {qid: 'q08', short: 'keys, hash, parser, writers', question: 'Keys, hash, parser and writers: the keydown keys; the overlay menu rows (#ovMenu); the unanchored seed regex at both parse sites (a notices= param collides with it); every "#s=" writer (each drops the other params); applyGotoFromHash; free hash param names (matching ^[a-z]+$, not ending in s).', reads: ["index.html (anchors window.addEventListener('keydown', id=\"ovMenu\", function applyGotoFromHash())"], role: 'audit', lens: ['recount']},
  {qid: 'q09', short: 'weather and the R13 fog source', question: 'Weather and the R13 fog source: W.weather states and roll cadence; the precipitation Points (count 1500, render-only randomness); fog far-plane modulation; the R13 fog function inside the /* FILIGREE */ block of maps-site/index.html: does it exist? its name, signature, the helpers it calls (mulberry32 included) and its purity, or "not yet built" (ST11: then a recorded gap, nothing invented).', reads: ['index.html (anchor W.weather = )', 'maps-site/index.html (read-only; the /* FILIGREE */ ... /* /FILIGREE */ block)'], role: 'audit', lens: ['refute']},
  {qid: 'q10', short: 'notices (R12)', question: 'Notices (R12): the committed notices sample in maps-site/data/ or the /contracts of docs/filigree/sheet-spec.json (both read-only): the schema of shut ways and muster days; what the sim can read without a fetch at boot; the classes a street view would draw from it.', reads: ['maps-site/data/', 'docs/filigree/ (read-only: sheet-spec.json /contracts when present)'], role: 'audit', lens: ['canon']},
  {qid: 'q11', short: 'Epēshu canon', question: 'Epēshu canon: wiki-places.json (the Blue Temple of Thobrauk on Wood Quay\'s northern edge), the chart-pois.json districts, detail-charts.json, the capital\'s marble walls, the Epēshu cityLabels of index.html; look at one chart crop of the Marble Quarter.', reads: ['maps-site/data/wiki-places.json', 'maps-site/data/chart-pois.json', 'maps-site/data/detail-charts.json', 'maps-site/charts/epeshu/', "index.html (anchors templeName:'the Blue Temple of Thobrauk', {name:'Wood Quay', {name:'Epēshīn Forum')"], role: 'deep', lens: ['second-look', 'canon']},
  {qid: 'q12', short: 'Patrinaic words', question: 'Patrinaic words for gate, toll, market, bridge, ford, crowd, cloud, caravan halt and herald (reserved canon words excluded), each with its lexicon entry.', reads: ['lexicon/patrinaic.json'], role: 'audit', lens: ['canon']},
  {qid: 'q13', short: 'shadows and the degrade ladder', question: 'Shadows and the degrade ladder: shadowsOn (never set), wantShadow, the one-way ladder (smoothed fps < 42, every 5 s after frame 300), shadow extent and map size; what headless can and cannot measure; the global binding a pinDegrade hook must hold.', reads: ['index.html (anchors let shadowsOn = true, const wantShadow, let fpsAvg = 60, degradeStep)'], role: 'audit', lens: ['recount']},
  {qid: 'q14', short: 'r128 API facts', question: 'three r128 API facts from the source of npm pack three@0.128.0 (in a mktemp -d dir): InstancedMesh.setColorAt / instanceColor, Frustum.intersectsSphere, an onBeforeCompile dither on the patched Lambert, no BatchedMesh, LOD.addLevel without hysteresis.', reads: ['npm pack three@0.128.0 (src/ of the extracted package)'], role: 'audit', lens: ['recount']},
  {qid: 'q15', short: 'class map', question: `Class map: map each of the ${CHECKLIST.length} checklist keys (${PIECES.length} Tokyo pieces + ${ANALOGUES.length} bronze-age analogues of todo-inputs.json) to street classes {id, from, state in ${STATES.join(' | ')}, fil_class?, tier_min, tier_max}, reusing a filigree density-bible class id wherever one exists (read-only). Keys: ${CHECKLIST.join(', ')}.`, reads: ['docs/street/todo-inputs.json', 'docs/filigree/density-bible.json (read-only)'], role: 'judge', lens: ['refute', 'canon']}
]
const LENS_ROLE = {anchor: 'mech', 'second-look': 'deep', refute: 'judge', recount: 'mech', canon: 'audit'}

// ---- schemas (design §3.3) ----
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
  new_sim_state: SA, debts_missing: SA, fil_class_unknown: SA, ceiling_below_baseline: SA, ceiling_missing: SA, bad_keys: SA, fil_bible_sha256: S})   // + fil_bible_sha256: SG1.14 needs an independent read of the filigree bible sha at gate time
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

// ---- Preflight ----
phase('Preflight')
const INPUTS = [DOCS + '/research-dossier.md', DOCS + '/todo-inputs.json', REPO + '/docs/research/streamed-streets.md', REPO + '/lexicon/patrinaic.json',
  ...['wiki-places', 'chart-pois', 'detail-charts'].map(f => `${REPO}/maps-site/data/${f}.json`), REPO + '/index.html', REPO + '/maps-site/index.html', REPO + '/tools/street-drift.js']
const PREFLIGHT_TASK = `Preflight for Street 1 (read-only: write nothing outside a mktemp -d dir).
A. ${ANCHOR_TASK}
B. ${FIL_ANCHOR_TASK}
C. ${DRIFT_TASK}
Also check:
1. Inputs exist: ${INPUTS.join(' ; ')}. missing = every one that does not exist (the filigree bible and gate are reported in fil_gate1, never here).
2. fil_gate1 from ${FIL_GATE1}: {exists (present and parses), pass: parsed.pass === true, mode: parsed.mode or "", forced: parsed.forced_by != null, bible_ok: the parsed.artifacts entry whose path ends "density-bible.json" has a sha256 equal to sha256sum ${FIL_BIBLE}, bible_sha256: sha256sum ${FIL_BIBLE} ("" when absent), class_ids: every classes[].id of ${FIL_BIBLE} ([] when absent)}. An absent gate file gives exists false, pass false, mode "", forced false, bible_ok false.
3. fil_overrides = the "overrides" object of ${FIL}/rulings.json; st_overrides = the "overrides" object of ${DOCS}/rulings.json ({} when a file or its key is absent; string values only).
4. The ledger ${OUTABS}/state/1-research.json if present: for each entry of its "questions", sha256sum the file at its "path" and return {qid, path, sha256 (the recorded one), sha_ok (the file exists and re-hashes to the recorded sha256), claim_ids, struck} copied from the entry; seen_questions = its "seen_questions". Absent ledger = {questions: [], seen_questions: []}.
5. probe (run it, edit nothing): ${probeTask(PRE_LITS)}
${SANDBOX_ST}
6. gate_prev from ${OUTABS}/gates/1-research.json: {exists (present and parses), pass: parsed.pass === true, mode: parsed.mode or "", forced: parsed.forced_by != null, md_ok: the artifacts entry whose path ends "street-bible.md" names a sha256 equal to sha256sum ${BIBLE_MD}, json_ok: the same for street-bible.json and ${BIBLE_JSON}, answers_exists: ${OUTABS}/gates/1-view-answers.json exists and parses, fil_bible_sha256: parsed.fil_bible_sha256 or "", fil_rulings_cited: parsed.fil_rulings_cited or {}}. Absent file = all false, "" and {}.
7. fixtures: {views_exists: ${VIEWS_JSON} exists and parses, views_rules: its "rules" string ("" when absent), stills: the file names present under ${OUTABS}/gates/view/ (e.g. "SV1.jpg"), baseline_exists: ${BASELINE} exists and parses, baseline_index_sha and baseline_tool_sha: its index_sha and tool_sha ("" when absent), index_sha: sha256sum ${REPO}/index.html}.
Return {missing, anchors (the map of A), fil_anchors (B), drift (C), fil_gate1, fil_overrides, st_overrides, ledger, probe, gate_prev, fixtures}.`
const pre = await crit(PS(PREFLIGHT_TASK), {label: 'preflight', phase: 'Preflight', schema: PRE1, ...M('mech')})
if (!pre) return done({reason: 'agent died: preflight'})
const fg = pre.fil_gate1 || {}
if (!(fg.exists && fg.pass && fg.mode === 'full' && !fg.forced && fg.bible_ok)) die('street research waits for the density bible (docs/filigree/gates/1-research.json pass, full, unforced, bible unchanged)')
if (!pre.drift || pre.drift.ok !== true) die('prelude drift: ' + driftIds(pre.drift))   // run fault; remedy README §12
if ((pre.missing || []).length) die('missing inputs: ' + pre.missing.join(', '))
const lost = anchorsLost(pre.anchors); if (lost.length) die('anchor lost: ' + lost.join('; '))
const gapsPre = []
const filLost = Object.entries((pre.fil_anchors || {}).literals || {}).filter(([, v]) => !v).map(([k]) => k)
if (filLost.length) { log('filigree anchors already lost in index.html (not this track): ' + filLost.join('; ')); gapsPre.push('filigree anchors already lost in index.html (recorded, not caused, by this track): ' + filLost.join('; ')) }
const inStreet = Object.entries((pre.fil_anchors || {}).in_street || {}).filter(([, n]) => n > 0).map(([k, n]) => `${k} x${n}`)
if (inStreet.length) gapsPre.push('filigree anchors inside the STREET block: ' + inStreet.join('; '))
const {r: RUL, used: RUSED} = rulingsMerge(pre.fil_overrides)
const STR = stRulingsMerge(pre.st_overrides), SUSED = STR.used
const FIL_CITED_TEXT = Object.fromEntries(FIL_CITED.map(k => [k, RUL[k]]))
const fx0 = pre.fixtures || {}
log(`fixtures: views.json ${fx0.views_exists ? 'frozen' : 'absent'}, ${(fx0.stills || []).length} still(s), baseline ${fx0.baseline_exists ? (fx0.baseline_index_sha === fx0.index_sha ? 'current' : 'stale (index.html moved)') : 'absent'}`)

// ledger + resume (Job 1 rules): a question resumes while its evidence re-hashes; q01 also needs the preflight probe reading (literals 1, 3, 4, 5)
const LEDGER = (pre.ledger && Array.isArray(pre.ledger.questions)) ? pre.ledger.questions.filter(x => x && x.qid) : []
const TOOL_QIDS = new Set(QUESTIONS.filter(q => q.tool).map(q => q.qid))
const probePre = probeWhy(pre.probe, PRE_LITS).length === 0
if (!probePre && LEDGER.some(x => TOOL_QIDS.has(x.qid) && x.sha_ok === true)) log('probe fails preflight: q01 re-runs despite a re-hashing evidence file')
const ledgerOk = qid => LEDGER.some(x => x.qid === qid && x.sha_ok === true) && (probePre || !TOOL_QIDS.has(qid))
const resumed = RESUME ? LEDGER.filter(x => ledgerOk(x.qid)) : []
const unresumed = QUESTIONS.filter(q => !(RESUME && ledgerOk(q.qid)))
const q01Todo = unresumed.find(q => q.tool) || null
const todo = cap(unresumed.filter(q => !q.tool))
if (resumed.length) log(`resume: ${resumed.length} question(s) re-hash and are skipped: ${resumed.map(x => x.qid).join(', ')}`)

const lensMax = q => q.lens.length + (q.lens.includes('anchor') ? 0 : 1)   // Job 1's lensesFor: the declared lenses plus anchor when a claim cites one (q11, q15: 3)
const TOOL_MAX = 2 + 2 * 2   // writer + recount + 2 x (fix + recount)
const GATE_MIN = 3 * GATE_VIEWS.length, GATE_MAX = GATE_MIN + CRIT_MAX   // 2 appliers + 1 resolver per view (+ ambiguity judge, crit)
const FU_Q_MAX = FU_MAX_Q * 3   // questions x (research + <=2 lenses); a probe rewrite costs research + recount + one baseline re-measure
const FU_ROUND_MAX = 1 + FU_Q_MAX + CRIT_MAX + 2 + GATE_MAX   // critic, questions, patcher (crit), validator + grep, gate
if (MODE === 'plan') {
  const rq = unresumed.filter(q => !q.tool)
  const sched = [
    {phase: 'Preflight', agents_min: 1, agents_max: CRIT_MAX},
    {phase: 'Tool', agents_min: q01Todo ? 2 : 1, agents_max: TOOL_MAX},
    {phase: 'Fixtures', agents_min: 2, agents_max: 2 * CRIT_MAX},
    {phase: 'Research', agents_min: rq.length, agents_max: rq.length},
    {phase: 'Verify', agents_min: rq.reduce((s, q) => s + q.lens.length, 0), agents_max: rq.reduce((s, q) => s + lensMax(q), 0)},
    {phase: 'Synthesize', agents_min: 3, agents_max: CRIT_MAX + 2},
    {phase: 'Blank-street gate', agents_min: GATE_MIN, agents_max: GATE_MAX},
    {phase: 'Follow-up', agents_min: 0, agents_max: ROUNDS * FU_ROUND_MAX},
    {phase: 'Record', agents_min: 3, agents_max: 3 * CRIT_MAX}
  ]
  const tot = sched.reduce((s, x) => s + x.agents_max, 0)
  return done({reason: 'plan', owner_rulings_used: RUSED, street_rulings_used: SUSED, schedule: sched, agents_bound: tot, resumed: resumed.map(x => x.qid),
    polish_note: `plan: ${unresumed.length} question(s) to research${q01Todo ? ' (q01 writes the probe)' : ''}, at most ${tot} agents including crit() retries (bound 180)`})
}

// A gate that already passed on an unchanged bible, an unchanged filigree bible and unchanged cited rulings is not redone.
const GP = pre.gate_prev || {}
const citedSame = FIL_CITED.every(k => (GP.fil_rulings_cited || {})[k] === RUL[k]) && !citedChanged(GP.fil_rulings_cited, RUL).length
if (RESUME && MODE === 'full' && GP.exists === true && GP.pass === true && GP.mode === 'full' && GP.forced !== true && GP.md_ok === true && GP.json_ok === true
  && HEX64.test(GP.fil_bible_sha256 || '') && GP.fil_bible_sha256 === fg.bible_sha256 && citedSame) {
  const lack = [GP.answers_exists === true ? '' : 'gates/1-view-answers.json', LEDGER.length ? '' : 'state/1-research.json'].filter(Boolean)
  if (lack.length) return done({reason: 'record-incomplete: the gate passed on an unchanged bible but ' + lack.join(' and ') + ' is missing and cannot be rebuilt without a new run; delete docs/street/gates/1-research.json (or pass resume:false) to redo Street 1', owner_rulings_used: RUSED, street_rulings_used: SUSED, polish_inserts_above: 'Street 2'})
  log('gate already passed on an unchanged bible: nothing to do')
  return done({pass: true, reason: 'already passed: gate pass:true, the street bible re-hashes, the filigree bible and the cited rulings are unchanged; nothing re-run', owner_rulings_used: RUSED, street_rulings_used: SUSED,
    gate_path: OUT + '/gates/1-research.json', polish_inserts_above: 'Street 2',
    outputs: [OUT + '/street-bible.md', OUT + '/street-bible.json', OUT + '/gates/views.json', OUT + '/gates/view/', OUT + '/gates/baseline.json', OUT + '/gates/1-research.json', OUT + '/gates/1-view-answers.json', OUT + '/research/', PROBE_REL],
    polish_note: 'Street 1 already passed on an unchanged street bible; nothing was re-run'})
}

// ---- research + verify machinery (ported from filigree Job 1) ----
const READS_NOTE = `Read paths are relative to the repo root ${REPO}, except gates/... and research/..., which are under ${OUTABS}. Everything under docs/filigree/, maps-site/, .claude/ and tools/filigree-* is read-only.`
const LENS_TEXT = {
  'second-look': 'Second look: independently re-read the SAME source the researcher read (the files, crops or data under Reads). Do not open the research file or its evidence. The claim list below is for comparison only: it carries claim text without evidence refs. Before you decide any strike, write your own reading of the source for each claim\'s topic into own_reading (claim id + what the source itself shows), then strike every claim your reading contradicts. Independence is partial (you do see the claim text), so own_reading must be filled for every claim.',
  refute: 'Refute: refute claims you can disprove with evidence (code you read, a command you ran); keep what you cannot.',
  recount: 'Recount: re-run the computation, grep or count behind each claim yourself (commands allowed; throwaway scripts in a mktemp -d dir) and strike every claim you cannot reproduce.',
  canon: 'Canon: check voice and canon (bronze-age Nīmlad, the nine Kembar, years A.B.; Lamor and Pēshunor are regions, not towns; Epēshu is the Marble City; Lepon is a ruin) and the banned vocabulary; strike claims whose proposed names, labels or player-facing wording break them. ' + VOCAB_ST_RULE,
  anchor: 'Anchor: for every claim whose evidence.kind is "anchor", check that the ref resolves: grep -nF -e <literal> <file> from the repo root, quoting the literal properly (a literal containing a single quote goes through a temp file with grep -nF -f, or through double quotes). Strike every claim whose anchor does not resolve.'
}
const lensesFor = (q, r) => cap([...new Set(q.lens.concat((r.claims || []).some(c => c && c.evidence && c.evidence.kind === 'anchor') ? ['anchor'] : []))])
const toolTask = () => `Tool task: write the committed read-only probe ${PROBE_T} (create the directory) to the contract below, and run it until it meets every literal. Stamp the date ${DATE} in a header comment. ${SANDBOX_ST}
${PROBE_SPEC}
${PROBE_LIT_TEXT}`
const researchPrompt = q => PS(`Research question ${q.qid} (${q.short || 'follow-up'}). Answer this ONE question and nothing else:
${q.question}

Reads: ${q.reads.join('; ')}
${READS_NOTE}
Static inputs you may consult: ${DOCS}/research-dossier.md, ${DOCS}/todo-inputs.json, ${REPO}/docs/research/streamed-streets.md${q.tool ? '' : `, the frozen fixtures ${VIEWS_JSON} and ${BASELINE}, the probe ${PROBE_T} (run it per the sandbox recipe when a measurement settles a claim: ${SANDBOX_ST})`}.

Anchors re-derived by pattern this run (literal -> path:line):
${anchorMap(pre.anchors)}

Fixture views (rules; resolved values live in ${VIEWS_JSON}): ${VIEW_RULES.map(v => `${v.id} ${v.seed} day ${v.day} ${v.focus} R ${v.R} tod ${v.tod}`).join(' · ')}

Rulings:
${rulingText(RUL, ['R6', 'R10', 'R12', 'R13', 'R22'])}
${rulingText(STR.r, ST_CITED_1)}
${DET_RULE}
${VOCAB_ST_RULE}
${q.tool ? '\n' + toolTask() + '\n' : ''}
Write ${OUTABS}/research/${q.qid}.json (create the directory) = {qid, claims, gaps, summary, date: "${DATE}"}. Claim ids are "${q.qid}-c01", "${q.qid}-c02", ... Cite evidence on every claim: kind anchor | computed | probe | data | crop | lexicon | web; ref = "path :: literal" for an anchor, the command for computed or probe, file#key for data, the crop px, the lexicon entry, or the URL. Anything you cannot establish is a gaps[] entry, never a guess. Return {qid: "${q.qid}", path (absolute path of that file), sha256 (sha256sum of it), claims, gaps, summary (<= 3 sentences)}.`)
const lensPrompt = (L, q, r) => PS(`Verify research question ${q.qid} through ONE lens: ${L}.
Question: ${q.question}
Reads: ${q.reads.join('; ')}
${READS_NOTE}
${LENS_TEXT[L]}

Claims (${L === 'second-look' ? 'id: text; evidence refs withheld' : 'id: text [evidence kind :: ref]'}):
${(r.claims || []).map(c => L === 'second-look' ? `${c.id}: ${c.text}` : `${c.id}: ${c.text} [${c.evidence ? c.evidence.kind + ' :: ' + c.evidence.ref : 'no evidence'}]`).join('\n') || '(none)'}

Write nothing (throwaway scripts in a mktemp -d dir); return the LENS object${L === 'second-look' ? ' (own_reading first, one entry per claim id)' : ''}: lens = "${L}", checked = how many claims you checked, struck = [{claim: <claim id>, why, evidence}] for every claim you disproved (empty when none).`)
const recountPrompt = () => PS(`Recount the street probe against its literals (write nothing outside a mktemp -d dir; never edit the probe).
${SANDBOX_ST}
${probeTask(null)}`)

const STRUCK = new Set(resumed.flatMap(x => x.struck || []))
const gapsResearch = []
const resAll = []
const cov = {rn: resumed.length, rk: resumed.length, ln: 0, lk: 0}   // resumed questions were fully verified when recorded (the ledger keeps only those)
const evidence = () => [...new Set(resumed.filter(x => !resAll.some(y => y.q.qid === x.qid)).map(x => x.path).concat(resAll.map(x => x.r.path)).filter(Boolean))]
const EVIDENCE_NOTE = () => `Research evidence this run trusts (read ONLY these research files; ignore every other file under ${OUTABS}/research/, they are stale or unverified):\n${evidence().join('\n') || '(none)'}`
async function researchRound(qs, tag) {   // a tool question's verify stage is the probe recount (PROBEP), scored by probePass
  const res = await pipeline(qs,
    q => agent(researchPrompt(q), {label: q.qid + ' · ' + (q.short || 'follow-up') + tag, phase: 'Research', schema: QSCHEMA, ...M(q.role)}),
    (r, q) => r && (q.tool
      ? agent(recountPrompt(), {label: q.qid + ' · recount' + tag, phase: 'Verify', schema: PROBEP, ...M('mech')})
        .then(pp => ({q, r, probe: pp, struck: probePass(pp) ? [] : (r.claims || []).map(c => c.id), lensDrops: pp ? 0 : 1, lensN: 1}))
      : parallel(lensesFor(q, r).map(L => () =>
        agent(lensPrompt(L, q, r), {label: q.qid + ' · ' + L + tag, phase: 'Verify', schema: LENS, ...M(LENS_ROLE[L])})))
        .then(vs => ({q, r, struck: vs.filter(Boolean).flatMap(v => (v.struck || []).map(s => s.claim)), lensDrops: vs.filter(v => !v).length, lensN: vs.length}))))
  const {k} = kept(res, 'research+verify' + tag)
  res.forEach((x, i) => { if (!x) gapsResearch.push(`${qs[i].qid}: no evidence (research agent or its verify stage died)`) })
  cov.rn += res.length; cov.rk += k.length
  for (const x of k) {
    x.struck.forEach(c => STRUCK.add(c))
    cov.ln += x.lensN; cov.lk += x.lensN - x.lensDrops
    if (x.lensDrops) log(`${x.q.qid}: ${x.lensDrops}/${x.lensN} verify stage(s) died; kept out of the ledger so a resume re-runs it`)
    ;(x.r.gaps || []).forEach(g => gapsResearch.push(`${x.q.qid}: ${g}`))
    resAll.push(x)
  }
  return k
}

// ---- Tool: q01 alone, before any fixture ----
phase('Tool')
const Q01 = QUESTIONS.find(q => q.tool)
const recount = label => agent(recountPrompt(), {label, phase: 'Tool', schema: PROBEP, ...M('mech')})
const fixPrompt = (p, k) => PS(`Fix the street probe ${PROBE_T} (fix ${k} of 2). A recount found these PROBE_LIT items failing:
${probeWhy(p).join('\n')}
Recount reading: ${JSON.stringify(p)}
Rewrite ${PROBE_T} only (no other file but the research record below), to the contract below, and run it until every literal holds. Then rewrite ${OUTABS}/research/q01.json = {qid: "q01", claims, gaps, summary, date: "${DATE}"} for the fixed tool (claim ids "q01-c01", ...; evidence kind computed, ref = the command). Return {qid: "q01", path, sha256 (sha256sum of research/q01.json), claims, gaps, summary}.
${SANDBOX_ST}
${PROBE_SPEC}
${PROBE_LIT_TEXT}
${DET_RULE}`)
let r01 = null, P1 = null, probeFixes = 0
if (q01Todo) {
  r01 = await agent(researchPrompt(Q01), {label: 'q01 · probe tool', phase: 'Tool', schema: QSCHEMA, ...M(Q01.role)})
  if (!r01) log('agent died: q01 · probe tool (the recount decides whether a probe exists)')
}
P1 = await recount('q01 · recount')
while (P1 && !infraOf(P1) && !probePass(P1) && probeFixes < 2) {
  probeFixes++
  const fx = await agent(fixPrompt(P1, probeFixes), {label: 'q01 · probe fix ' + probeFixes, phase: 'Tool', schema: QSCHEMA, ...M('deep')})
  if (fx) r01 = fx; else log('agent died: q01 · probe fix ' + probeFixes)
  P1 = await recount('q01 · recount · after fix ' + probeFixes)
}
if (!P1) return done({reason: 'agent died: q01 · recount', owner_rulings_used: RUSED, street_rulings_used: SUSED, polish_inserts_above: 'Street 2'})
if (infraOf(P1)) return done({reason: 'infra', owner_rulings_used: RUSED, street_rulings_used: SUSED, polish_inserts_above: 'Street 2', polish_note: 'infra (probe setup): ' + P1.infra_error})
const probeOk = probePass(P1)
if (q01Todo) { cov.rn += 1; cov.ln += 1; cov.lk += 1 }
if (r01) {
  const x = {q: Q01, r: r01, probe: P1, struck: probeOk ? [] : (r01.claims || []).map(c => c.id), lensDrops: probeOk ? 0 : 1, lensN: 1}   // a failed probe keeps q01 out of the ledger
  if (q01Todo) cov.rk += 1
  x.struck.forEach(c => STRUCK.add(c)); (r01.gaps || []).forEach(g => gapsResearch.push('q01: ' + g)); resAll.push(x)
} else if (q01Todo) gapsResearch.push('q01: no research record (the probe writer died)')
log(`probe: ${probeOk ? 'literals 1-7 met' : 'failing: ' + probeWhy(P1).join('; ')} after ${probeFixes} fix(es)`)

// ---- Fixtures, Research, Synthesize, gate and follow-up run only on a passing probe; otherwise straight to Record with SG1.11 failed ----
const baselinePrompt = () => PS(`Measure the street-off baseline (frozen per index.html sha and probe sha; README §5.3).
Skip (write nothing, go to the read-back) when ${BASELINE} exists, parses, has frozen === true, its index_sha equals sha256sum ${REPO}/index.html and its tool_sha equals sha256sum ${PROBE_T}.
Otherwise, with the sandbox recipe and all outputs in a mktemp -d dir: run twice node ${PROBE_T} --views ${VIEWS_JSON} --layers street=0 --metrics calls,tris,geoms,textures,objects,stats_keys (each with its own --out); for each seed of ${JSON.stringify(SEEDS)} run twice --fingerprint --seed <seed> --days 400 and twice --fingerprint --seed <seed> --days 400 --walk ${VIEWS_JSON}; run once --fingerprint --seed epeshu --days 400 --perturb departDay. keydown_sha = sha256 of the text of ${REPO}/index.html from "window.addEventListener('keydown'" to its matching "});" (a node script matching braces from the first "{" after it).
runs_equal = the two metrics outputs are byte-equal AND each fingerprint pair is equal; view_dependent = for some seed the plain sha differs from the walk sha; perturbed_differs = the perturbed sha differs from the epeshu plain sha.
Write ${BASELINE} (create gates/) = {date: "${DATE}", frozen: true, tool_sha, index_sha, views: {SVn: {calls, tris, geoms, textures, objects}} (from the first metrics run), fingerprint: {epeshu: {plain, walk}, tamar1374: {plain, walk}}, view_dependent, stats_keys, keydown_sha, near_line: "camera.near = clamp(R*0.02, 0.5, 50);", runs_equal, perturbed_differs}.
${SANDBOX_ST}
${READBACK} Also return, read from the file: runs_equal, view_dependent, index_sha, tool_sha, views_n (the number of keys of views), stats_keys, keydown_sha, perturbed_differs; and infra_error ("" or the setup failure).`)
const freezePrompt = PS(`Freeze the street fixture views (README §5.1). They are frozen once written and never regenerated.
1. If ${VIEWS_JSON} exists: with a node script (mktemp -d) compare JSON.parse(file).rules with the expected rules string below using ===. Different, or no rules key: write nothing, delete nothing, and return fixtures_changed true with the read-back of the existing file. Equal and every still ${OUTABS}/gates/view/<id>.jpg exists for ${VIEW_RULES.map(v => v.id).join(', ')}: write nothing; go to the read-back.
2. Otherwise: write the rules file below VERBATIM to <tmp>/rules.json and run node ${PROBE_T} --freeze-views <tmp>/rules.json --out ${VIEWS_JSON} --shots ${OUTABS}/gates/view/ --cdn-dir <cdn dir> (create the directories). ${SANDBOX_ST}
${READBACK} Also return fixtures_changed (false unless step 1 found a difference), views: [{id, seed, day, x, z, R, tod, fallback ("" when none)}] read from the file, stills: [{id, path, bytes}] for every still that exists, and infra_error ("" or the setup failure the probe reported).
Expected rules string (JSON-encoded): ${JSON.stringify(RULES_TEXT)}
Rules file: ${JSON.stringify(RULES_FILE)}`)
let vf = null, BASEL = null, bible = null, chk = {val: null, voc: null}, gate = {rows: [], skipped: ''}, ev = null, amb = {gaps: []}, rounds = 0
let gapsGate = []
const viewOf = id => ((vf && vf.views) || []).find(v => v && v.id === id) || null
const GV = cap(GATE_VIEWS)

const STRUCTURE = `street-bible.md sections: tiers; classes by tier (what must be there at each nearness); determinism (states, keys, debts); clocks; caravans and queues; sky and weather; layers and hash; notices; Epēshu; caps; prerequisites; "## Renames"; "## Provenance" (the only place the source post's sources may be named, ST17).
street-bible.json:
{date: "${DATE}", fil_bible_sha256: "${fg.bible_sha256 || ''}",
 tiers: {kind: "radius", bands: [{tier: "T0".."T4", R_min, R_max}]},          (contiguous, covering [9, 11000]; a view's tier is the band with R_min <= R < R_max)
 classes: [{id, label, from: [checklist keys], state: ${STATES.map(s => '"' + s + '"').join(' | ')},
            sim_source: [index.html literal], key: "st:<class>:<id expr>:day" | "", fil_class: "" | <filigree class id>,
            tier_min, tier_max, row: "roads and folk" | "clouds" | "weather" | "shadows" | "street" | "", new: bool}],
 rules: [{id: "SB-01", text, kind: "must" | "forbidden" | "threshold" | "determinism" | "source", cites: [claimId]}],   (ids stable across rounds)
 caps_ceiling: {SV1..SV9: {calls, tris, objects}},   (each >= the ${BASELINE} views value)
 determinism: {allowed_sources: ["keyed-hash", "sim-read-only"], new_sim_state: [], key_idiom: "${KEY_IDIOM}",
               debts: [{fn, token, kind: "gen" | "sim" | "render"}]},   (every Math[.]random, Date[.]now, performance[.]now, W.rng.amb and nowMs occurrence in index.html with its enclosing function)
 clocks: {dark_hour: "render", sim_day: "W.clock.day", presentation: "ST.t"},
 hash: {param: "street", parser_fix: "S0 (ST18)", writers: [literal lines]},
 checklist: {<each of the ${CHECKLIST.length} keys>: rule id or class id},
 prerequisites: [{item, blocks: "S0".."S4", status: "checked" | "open" | "missing"}]}
Rules are general (by tier, class and view kind), never the fixture answers. A keyed-render class names its key in the canonical form (regex ${KEY_RE}: st:<class>:<id expr>:day, the bible's form of ${KEY_IDIOM}); a sim-read or seeded-gen class names >=1 sim_source literal found verbatim in index.html; a notice class names its R12 notice class. A non-empty fil_class is a class id of ${FIL_BIBLE} (read-only). vtt_scene and vtt_out_of_scope map to the rule that states ST10.`
const RETURN1 = `Return {md, json (absolute paths), sha_md, sha_json (sha256sum of each file), class_ids (every classes[].id), rule_ids (every rules[].id), tier_bands (tiers.bands as written), states ({<class id>: its state}), checklist_keys (the checklist keys whose value is an existing rule or class id), cited_claims (every claim id in any rules[].cites)}.`
const CHECK_TEXT = `Checklist (street-bible.json "checklist" maps every key to an existing rule or class id): pieces ${PIECES.join(', ')}; bronze-age analogues ${ANALOGUES.join(', ')}.`
const BIBLE_RULINGS = rulingText(RUL, ['R6', 'R9', 'R10', 'R12', 'R13', 'R18', 'R22']) + '\n' + rulingText(STR.r, Object.keys(ST_RULINGS))
const FIL_IDS_TEXT = `Filigree density-bible class ids (read-only, sha ${fg.bible_sha256 || '?'}): ${(fg.class_ids || []).join(', ') || '(read them from ' + FIL_BIBLE + ')'}`

async function checkBible(tag) {
  const [v, w] = await parallel([
    () => agent(PS(`Validate the street bible with a fixed node script (mktemp -d); write nothing. JSON.parse ${BIBLE_JSON} and check that ${BIBLE_MD} exists. Checks: the required keys (date, fil_bible_sha256, tiers, classes, rules, caps_ceiling, determinism, clocks, hash, checklist, prerequisites); unique class ids and unique rule ids; every class state is one of ${JSON.stringify(STATES)}; every sim-read or seeded-gen class has >= 1 sim_source and each one is found in ${REPO}/index.html by indexOf; every keyed-render class has a key matching new RegExp(${JSON.stringify(KEY_RE)}) (else its id goes to bad_keys); determinism.new_sim_state is [] (else its entries go to new_sim_state); the debt grep: list every Math[.]random, Date[.]now, performance[.]now, W.rng.amb and nowMs occurrence in ${REPO}/index.html with its enclosing function name, and every (fn, token) pair must appear in determinism.debts (else "fn :: token" goes to debts_missing); every non-empty fil_class is a classes[].id of ${FIL_BIBLE} (else to fil_class_unknown); tiers.bands are contiguous (each R_max = the next R_min) and cover [9, 11000]; caps_ceiling has numeric calls, tris and objects for each of SV1..SV9 (else the view id goes to ceiling_missing), each >= the same field of views.<SVn> in ${BASELINE} (else "SVn.field" goes to ceiling_below_baseline).
Return {ok (true only when no check fails), failures (one line per failed check), sha_md and sha_json (sha256sum of ${BIBLE_MD} and ${BIBLE_JSON} as they are now), class_ids (every classes[].id), checklist_keys (the keys of "checklist" whose value is an existing rule or class id), cited_claims (every distinct string in any rules[].cites), tier_bands (tiers.bands as {tier, R_min, R_max}), states ({<class id>: state}), new_sim_state, debts_missing, fil_class_unknown, ceiling_below_baseline, ceiling_missing, bad_keys, fil_bible_sha256 (sha256sum ${FIL_BIBLE} now)}.`),
    {label: 'bible validator' + tag, phase: 'Synthesize', schema: VALID1, ...M('mech')}),
    () => agent(PS(`Vocabulary grep over the street bible. A short node script in a mktemp -d dir with the case-insensitive regex source ${JSON.stringify(VOCAB_ST.source)} (flags "gi"): scan ${BIBLE_MD} line by line, skipping the sections "## Provenance" and "## Renames" (a section runs to the next "## " heading), and every string value under a "label" or "row" key anywhere in ${BIBLE_JSON}. Write nothing. Return {hits: ["<file>:<line or json path>: <matched word>", ...]} (empty when clean).`),
    {label: 'vocabulary grep' + tag, phase: 'Synthesize', schema: VHITS, ...M('mech')})
  ])
  if (!v) log('agent died: bible validator' + tag)
  if (!w) log('agent died: vocabulary grep' + tag)
  return {val: v, voc: w}
}

const applyPrompt = id => PS(`Blank-street test for view ${id}. You may read ONLY these (a path ending "/" means the files under that directory): ${APPLIER_ALLOWED.join(', ')}. Read ${REPO}/index.html only through grep -nF (never open it whole). Open nothing else: the script checks your files_read against this allowlist, so do not open research files, dossiers, inputs, READMEs, design notes or POLISH.
Find ${id} in ${VIEWS_JSON} (seed, day, x, z, R, tod) and look at its still ${OUTABS}/gates/view/${id}.jpg. Name the tier the bible's tier rule gives for this view's R (street-bible.json tiers.bands: R_min <= R < R_max).
Then name exactly SIX distinct bible classes (street-bible.json classes[].id) that must be present at this view before it may look bare, each with: state (that class's state in the bible: ${STATES.join(' | ')}); instance {what (what it is at this view), near: "x,z" (world metres, inside the view's footprint: within 1.5*R + 30 of the view's x,z)}; source {kind, ref}: sim -> ref = an index.html literal you found with grep -nF; key -> ref = "st:<class>:<id expr>:day" (the class's key); notice -> ref = the notice class; probe -> ref = "<SVn>.<metric>" of the views in ${BASELINE}; fil -> ref = a filigree class id in ${FIL_BIBLE}.
If the bible does not let you answer, set bible_silent true and list what it lacks in missing; otherwise bible_silent false and missing [].
files_read = every file you opened or grepped (absolute paths). Return {view: "${id}", tier, items, bible_silent, missing, files_read}.`, true)
const resolvePrompt = (id, pair) => {
  const v = viewOf(id)
  const its = a => a ? JSON.stringify((a.items || []).map((it, idx) => ({idx, class: it && it.class, state: it && it.state, near: it && it.instance && it.instance.near, source: it && it.source}))) : 'no answer'
  return PS(`Resolve the blank-street answers for view ${id}${v ? ` (frozen at x ${v.x}, z ${v.z}, R ${v.R})` : ''}; take x, z and R from ${VIEWS_JSON}. Write nothing (throwaway scripts in a mktemp -d dir).
For every item of applier A and of applier B check:
1. The source resolves: sim -> grep -cF of the literal in ${REPO}/index.html is >= 1 AND the literal is listed in that class's sim_source in ${BIBLE_JSON}; key -> the ref matches new RegExp(${JSON.stringify(KEY_RE)}) AND the class is keyed-render with exactly that key; notice -> the class has state notice; probe -> views.<SVn>.<metric> exists in ${BASELINE}; fil -> the ref is a classes[].id of ${FIL_BIBLE}.
2. near "x,z" parses and lies within 1.5*R + 30 m (Euclidean) of the view's x,z.
ok = both hold; why names the first failing check ("" when ok). Return {view: "${id}", results: [{actor: "A" | "B", idx, ok, why}]}, one result per item.
Applier A items: ${its(pair[0])}
Applier B items: ${its(pair[1])}`)
}
async function runGate(tag) {
  const rows = await pipeline(GV,
    id => parallel(['A', 'B'].map(X => () => agent(applyPrompt(id), {label: `${id} · applier ${X}${tag}`, phase: 'Blank-street gate', schema: APPLY1, ...M(X === 'A' ? 'deep' : 'judge')}))),
    (pair, id) => agent(resolvePrompt(id, pair), {label: `${id} · resolver${tag}`, phase: 'Blank-street gate', schema: RESOLVE1, ...M('mech')}).then(res => ({id, A: pair[0], B: pair[1], res})))
  return {rows, skipped: ''}
}

// Scored in code. tierOf reads the validator's tier_bands; R comes from the fixed VIEW_RULES. note = the run stopped before the gate (every criterion but SG1.11 is "not evaluated").
function evaluate(bib, ck, gt, note) {
  const NE = note ? 'not evaluated: ' + note : ''
  const b = bib || {}, val = ck && ck.val, voc = ck && ck.voc
  const bands = (val && Array.isArray(val.tier_bands) ? val.tier_bands : []).filter(t => t && typeof t.R_min === 'number' && typeof t.R_max === 'number')
  const tierOf = R => { const t = bands.find(t => t.R_min <= R && R < t.R_max); return t ? t.tier : null }
  const cls = new Set(val ? val.class_ids || [] : []), st = (val && val.states) || {}
  const died = [], blindHits = [], silent = []
  const vs = GATE_VIEWS.map((id, i) => {
    const row = gt.rows[i] || null, R = viewRule(id).R
    const results = row && row.res && Array.isArray(row.res.results) ? row.res.results : []
    if (!row) died.push(note ? `${id}: not run` : `agent died: ${id} (no row)`)
    else if (!row.res) died.push(`agent died: ${id} resolver`)
    const s = {id, R, tier: tierOf(R), valid: {}, why: {}, classes: {}, items: {}, resolved: {}, silent: false}
    for (const X of ['A', 'B']) {
      const a = row ? row[X] : null, why = []
      s.classes[X] = []; s.items[X] = 0; s.resolved[X] = 0
      if (!a) { why.push(row ? `agent died: ${id} applier ${X}` : 'no answer'); if (row) died.push(`agent died: ${id} applier ${X}`); s.valid[X] = false; s.why[X] = why; continue }
      const items = (Array.isArray(a.items) ? a.items : []).filter(Boolean)
      const bad = blindBad(a.files_read, APPLIER_ALLOWED)
      if (bad.length) { why.push('blind: ' + bad.join(', ')); bad.forEach(p => blindHits.push(`${id}/${X}: ${p}`)) }
      if (a.bible_silent === true) { s.silent = true; silent.push(`${id}/${X}: ${(a.missing || []).join('; ')}`) }
      if (!s.tier || a.tier !== s.tier) why.push(`tier ${a.tier} (bible gives ${s.tier || 'no band'} for R ${R})`)
      s.classes[X] = items.map(it => it.class); s.items[X] = items.length
      const cs = new Set(s.classes[X])
      if (items.length !== 6 || cs.size !== 6) why.push(`${items.length} items, ${cs.size} distinct classes (6 required)`)
      const unk = [...cs].filter(c => !cls.has(c)); if (unk.length) why.push('unknown classes: ' + unk.join(', '))
      const stBad = items.filter(it => cls.has(it.class) && st[it.class] !== it.state).map(it => `${it.class} ${it.state}!=${st[it.class]}`); if (stBad.length) why.push('state: ' + stBad.join(', '))
      s.resolved[X] = new Set(results.filter(r => r && r.actor === X && r.ok === true && Number.isInteger(r.idx) && r.idx >= 0 && r.idx < items.length).map(r => r.idx)).size
      s.valid[X] = why.length === 0; s.why[X] = why
    }
    s.agree = row && row.A && row.B ? new Set(s.classes.A.filter(c => s.classes.B.includes(c))).size : 0
    s.ok3 = !!row && s.valid.A && s.valid.B
    return s
  })
  const N = GATE_VIEWS.length
  const n3 = vs.filter(s => s.ok3).length, n5 = vs.filter(s => s.agree >= 5).length, minAgree = Math.min(...vs.map(s => s.agree))
  const below = [], tally = [0, 0]
  for (const s of vs) for (const X of ['A', 'B']) {
    if (s.resolved[X] < 5) below.push(`${s.id}/${X} ${s.resolved[X]}/6`)
    tally[0] += s.resolved[X]; tally[1] += Math.max(6, s.items[X])
  }
  const pct = tally[1] ? Math.round(1000 * tally[0] / tally[1]) / 10 : 0   // nothing scored is a fail, never 100%
  const ckKeys = new Set(val ? val.checklist_keys || [] : []), ckMiss = CHECKLIST.filter(k => !ckKeys.has(k))
  const ckSelf = CHECKLIST.filter(k => (b.checklist_keys || []).includes(k) && !ckKeys.has(k))
  const citedStruck = val ? [...new Set(val.cited_claims || [])].filter(c => STRUCK.has(c)) : []
  const citedSelf = (b.cited_claims || []).filter(c => STRUCK.has(c) && !citedStruck.includes(c))
  const rowsK = kept(gt.rows, 'blank-street').k, rowsN = GV.length
  const fan = [['research+verify', cov.rn, cov.rk], ['verify stages', cov.ln, cov.lk], ['view rows', rowsN, rowsK.length],
    ['appliers', 2 * rowsN, rowsK.reduce((n, r) => n + (r.A ? 1 : 0) + (r.B ? 1 : 0), 0)], ['resolvers', rowsN, rowsK.filter(r => r.res).length]]
  const fanBad = fan.filter(([, n, k]) => k < Math.ceil(n * 0.75))
  const shaOk = !!val && HEX64.test(val.sha_md || '') && HEX64.test(val.sha_json || '') && val.sha_md === b.sha_md && val.sha_json === b.sha_json
  const xc = (xs, what) => xs.length ? `; integrator self-report also claims ${what}: ${xs.join(', ')}` : ''
  const probeW = probeWhy(P1), bl = BASEL
  const probe11 = probeW.length === 0 && !!bl && bl.runs_equal === true && bl.perturbed_differs === true
  const filShaOk = !!val && HEX64.test(val.fil_bible_sha256 || '') && val.fil_bible_sha256 === fg.bible_sha256
  const ne = m => NE || m, ok = x => !NE && !!x   // a run stopped before the gate records every criterion but SG1.11 as not evaluated (fail)
  const VD = 'agent died: bible validator'
  const lst = (k, xs) => (xs || []).length ? k + ': ' + xs.join(', ') : ''
  const criteria = [
    C('SG1.1', 'bible files exist + validator ok', ne(!val ? VD : (val.ok ? 'ok' : 'failures: ' + (val.failures || []).join('; ')) + (shaOk ? '' : '; bible sha256 mismatch or malformed (validator vs integrator/patcher)')),
      'ok && failures=[] && validator sha256 = integrator sha256 (64-hex) for both bible files', ok(shaOk && val.ok === true && (val.failures || []).length === 0)),
    C('SG1.2', 'checklist coverage (validator read of street-bible.json)', ne(!val ? VD : `${CHECKLIST.length - ckMiss.length}/${CHECKLIST.length}` + (ckMiss.length ? ' missing: ' + ckMiss.join(', ') : '') + xc(ckSelf, 'keys the file lacks')),
      `${CHECKLIST.length}/${CHECKLIST.length} keys -> existing rule or class ids`, ok(!!val && ckMiss.length === 0)),
    C('SG1.3', 'both appliers valid on every gate view, tier exact', ne(`${n3}/${N}` + (died.length ? '; ' + died.join('; ') : '')), `${N}/${N}`, ok(n3 === N)),
    C('SG1.4', 'class agreement', ne(`${n5}/${N} views >=5/6; min ${minAgree}/6`), `>=5/6 on >=${N - 1}/${N} AND >=4/6 on all ${N}`, ok(n5 >= N - 1 && minAgree >= 4)),
    C('SG1.5', 'ref resolution', ne((below.length ? 'below 5/6: ' + below.join(', ') + '; ' : '') + `overall ${pct}%`), 'each applier >=5/6 on every view; overall >=90% (nothing scored = fail)', ok(!below.length && pct >= 90)),
    C('SG1.6', 'bible silence', ne(silent.length ? silent.join(' | ') : 0), 0, ok(gt.rows.length > 0 && silent.length === 0)),
    C('SG1.7', 'VOCAB_ST hits', ne(!voc ? 'agent died: vocabulary grep' : (voc.hits || []).length ? voc.hits.join(' | ') : 0), 0, ok(!!voc && (voc.hits || []).length === 0)),
    C('SG1.8', 'struck claims cited (validator read of rules[].cites)', ne(!val ? VD : citedStruck.length || citedSelf.length ? (citedStruck.join(', ') || 'none') + xc(citedSelf, 'struck cites') : 0), 'none cited', ok(!!val && citedStruck.length === 0 && citedSelf.length === 0)),
    C('SG1.9', 'blind compliance (allowlist check on self-reported files_read; not a guarantee)', ne(blindHits.length ? blindHits.join(' | ') : 0), '0 reads outside APPLIER_ALLOWED', ok(gt.rows.length > 0 && blindHits.length === 0)),
    C('SG1.10', 'coverage', ne(fan.map(([w, n, k]) => `${w} ${k}/${n}`).join('; ')), 'every fan-out >=75% kept', ok(fanBad.length === 0)),
    C('SG1.11', 'probe literals 1-7 (recount) + baseline double run equal + fingerprint sensitive',
      (probeW.length ? 'probe: ' + probeW.join('; ') : 'probe: literals 1-7 met') + '; ' + (!bl ? 'baseline: not measured' : `baseline runs_equal ${bl.runs_equal}, perturbed_differs ${bl.perturbed_differs}`),
      'probePass && runs_equal && perturbed_differs', probe11),
    C('SG1.12', 'determinism contract (validator)', ne(!val ? VD : [lst('new_sim_state', val.new_sim_state), lst('debts_missing', val.debts_missing), lst('bad_keys', val.bad_keys)].filter(Boolean).join('; ') || 'all empty'),
      'new_sim_state = debts_missing = bad_keys = []', ok(!!val && !(val.new_sim_state || []).length && !(val.debts_missing || []).length && !(val.bad_keys || []).length)),
    C('SG1.13', 'caps ceiling (validator)', ne(!val ? VD : [lst('missing', val.ceiling_missing), lst('below baseline', val.ceiling_below_baseline)].filter(Boolean).join('; ') || 'numeric for SV1-SV9, >= baseline'),
      'ceiling_missing = ceiling_below_baseline = []', ok(!!val && !(val.ceiling_missing || []).length && !(val.ceiling_below_baseline || []).length)),
    C('SG1.14', 'filigree imports', ne(!val ? VD : lst('unknown fil_class', val.fil_class_unknown) + ((val.fil_class_unknown || []).length ? '; ' : '') + (filShaOk ? 'filigree bible unchanged' : `filigree bible sha ${val.fil_bible_sha256 || '-'} != preflight ${fg.bible_sha256 || '-'}`)),
      'fil_class_unknown = [] AND the filigree bible sha unchanged during the run', ok(!!val && !(val.fil_class_unknown || []).length && filShaOk))
  ]
  const needJudge = !NE && (vs.some(s => s.agree < 5 || !s.valid.A || !s.valid.B) || silent.length > 0)
  return {criteria, vs, n5, pct, ckN: CHECKLIST.length - ckMiss.length, needJudge}
}
const failing = e => e.criteria.filter(x => !x.pass)
async function ambiguity(e, gt, tag) {
  if (!e.needJudge) return {gaps: []}
  const bad = e.vs.filter(s => s.agree < 5 || !s.valid.A || !s.valid.B || s.silent).map(s => {
    const row = gt.rows[GATE_VIEWS.indexOf(s.id)] || null
    const ans = X => row && row[X] ? {tier: row[X].tier, classes: s.classes[X], states: (row[X].items || []).map(it => it && it.state), refs: (row[X].items || []).map(it => it && it.source), bible_silent: row[X].bible_silent, missing: row[X].missing} : null
    return {view: s.id, tests: viewRule(s.id).tests, R: s.R, bible_tier: s.tier, agree: s.agree, A: ans('A'), B: ans('B'), invalid: {A: s.why.A, B: s.why.B}}
  })
  return crit(PS(`The blank-street gate found ambiguous or failing views. Read the bible ${BIBLE_MD} and ${BIBLE_JSON}. For each failing view below, name the bible section that left the two blind appliers disagreeing, silent or invalid, and say what that section lacks (a missing class, a tier band that does not decide, a state or key left unstated, an unclear source rule...). Write nothing. Return {gaps: [{view, section, what}]}.
Failing rows:
${JSON.stringify(bad, null, 1)}`), {label: 'ambiguity judge' + tag, phase: 'Blank-street gate', schema: AMBIG, ...M('judge')})
}

if (probeOk) {
  phase('Fixtures')
  vf = await crit(freezePrompt, {label: 'view freezer', phase: 'Fixtures', schema: VIEWFRZ, ...M('mech')})
  if (vf && vf.fixtures_changed === true) die('fixtures changed; delete docs/street/gates/views.json and docs/street/gates/view/ to re-freeze')
  if (infraOf(vf)) return done({reason: 'infra', owner_rulings_used: RUSED, street_rulings_used: SUSED, polish_inserts_above: 'Street 2', polish_note: 'infra (view freezer): ' + vf.infra_error})
  if (!FILE_OK(vf)) return done({reason: 'agent died: view freezer', owner_rulings_used: RUSED, street_rulings_used: SUSED, polish_inserts_above: 'Street 2'})
  const stillIds = new Set((vf.stills || []).filter(x => x && x.id).map(x => x.id))
  const noStill = VIEW_RULES.map(v => v.id).filter(id => !stillIds.has(id))
  if (noStill.length) gapsPre.push('stills missing: ' + noStill.join(', '))
  BASEL = await crit(baselinePrompt(), {label: 'baseline', phase: 'Fixtures', schema: BASE, ...M('mech')})
  if (infraOf(BASEL)) return done({reason: 'infra', owner_rulings_used: RUSED, street_rulings_used: SUSED, polish_inserts_above: 'Street 2', polish_note: 'infra (baseline): ' + BASEL.infra_error})
  if (!FILE_OK(BASEL)) return done({reason: 'agent died: baseline', owner_rulings_used: RUSED, street_rulings_used: SUSED, polish_inserts_above: 'Street 2'})

  phase('Research')
  await researchRound(todo, '')

  phase('Synthesize')
  bible = await crit(PS(`Integrate the street bible: what the street view must stand on, so that a blind reader handed only the bible, the frozen views and the baseline can name, for any view, the tier and six classes that must be present with their state and source.
Read ONLY: the trusted research files below (claim ids <qid>-cNN); ${DOCS}/research-dossier.md; ${DOCS}/todo-inputs.json; ${VIEWS_JSON}; ${BASELINE}; ${FIL_BIBLE} (read-only, for its class ids).
${EVIDENCE_NOTE()}
Struck claims (disproved by a verifier; never cite them): ${[...STRUCK].join(', ') || '(none)'}
${FIL_IDS_TEXT}

Rulings:
${BIBLE_RULINGS}
${DET_RULE}

${CHECK_TEXT}
${VOCAB_ST_RULE}

Write ${BIBLE_MD} and ${BIBLE_JSON} (date "${DATE}").
${STRUCTURE}
${RETURN1}`), {label: 'bible integrator', phase: 'Synthesize', schema: INTEG1, ...M('integ')})
  if (!bible) return done({reason: 'agent died: bible integrator', owner_rulings_used: RUSED, street_rulings_used: SUSED, polish_inserts_above: 'Street 2'})
  chk = await checkBible('')

  phase('Blank-street gate')
  gate = await runGate('')
  ev = evaluate(bible, chk, gate, '')
  amb = await ambiguity(ev, gate, '')
  if (!amb) return done({reason: 'agent died: ambiguity judge', owner_rulings_used: RUSED, street_rulings_used: SUSED, polish_inserts_above: 'Street 2'})
  gapsGate = (amb.gaps || []).map(g => `${g.view} § ${g.section}: ${g.what}`)

  // ---- Follow-up (bounded by ROUNDS; dedup by norm(question)) ----
  const seenQ = new Set(((pre.ledger && pre.ledger.seen_questions) || []).map(norm))
  QUESTIONS.forEach(q => seenQ.add(norm(q.question)))
  const FQ = /^f(\d+)\d$/   // follow-up qids f<round><n>, rounds numbered on from the ledger, so a qid (and its claim ids) never repeats across runs
  const RBASE = Math.max(0, ...LEDGER.map(x => FQ.exec(x.qid)).filter(Boolean).map(m => Number(m[1])))
  while (failing(ev).length && rounds < ROUNDS) {
    if (lowBudget()) { log('budget: follow-up round skipped'); break }
    const rr = rounds + 1, tag = ' r' + rr, fr = RBASE + rr
    phase('Follow-up')
    const probeFail = failing(ev).find(x => x.id === 'SG1.11')
    const fails = failing(ev).map(x => `${x.id} ${x.desc}: ${x.measured}`)
    const askMax = FU_MAX_Q - (probeFail ? 1 : 0)
    const critic = await agent(PS(`Completeness critic for the street bible (follow-up round ${rr}). The blank-street gate failed.
Failing criteria:
${fails.join('\n')}
Gaps (bible sections + research gaps):
${gapsGate.concat(gapsResearch, gapsPre).join('\n') || '(none)'}
Already asked (normalized; never repeat one of these):
${[...seenQ].join('\n')}
Read ${BIBLE_MD} and, as needed, the trusted research files below.
${EVIDENCE_NOTE()}
Emit at most ${askMax} follow-up research questions that would close these gaps: each ONE targeted task with reads (repo-relative paths), role (mech | triage | audit | deep | judge: deep for tools and crops, audit for code reading, judge for interpretation, mech for counts and greps) and lens (at most one of anchor | second-look | refute | recount | canon; [] for none). qid = "f${fr}<n>" (the script renumbers). Wording and structure problems in the bible are not research questions: the patcher runs and the gate re-runs every round, so return an empty list when every gap is one of those. ${probeFail ? 'SG1.11 (the probe and the baseline) is not yours: the script queues a probe rewrite itself. ' : ''}Write nothing. Return {questions}.`),
    {label: 'completeness critic' + tag, phase: 'Follow-up', schema: CRITIC, ...M('judge')})
    if (!critic) { log('agent died: completeness critic' + tag + '; follow-up stopped'); break }
    const fresh = []
    if (probeFail) fresh.push({...Q01, qid: `f${fr}1`, short: 'probe rewrite',   // no other question carries the tool task, so SG1.11 is closed here or not at all
      question: `The street probe ${PROBE_REL} or its baseline failed SG1.11 (${probeFail.measured}). Rewrite the probe so it is deterministic, meets every PROBE_LIT item and makes the baseline double run byte-equal with a fingerprint sensitive to --perturb departDay.`})
    for (const q of critic.questions || []) {
      const k = norm(q && q.question)
      if (!k || seenQ.has(k) || fresh.length >= FU_MAX_Q) continue
      seenQ.add(k)
      fresh.push({qid: `f${fr}${fresh.length + 1}`, short: 'follow-up', question: q.question, reads: (q.reads || []).length ? q.reads : ['(choose the sources)'],
        role: PAIR[q.role] && q.role !== 'integ' ? q.role : 'audit', lens: [...new Set((q.lens || []).filter(x => x in LENS_ROLE))].slice(0, FU_MAX_LENS)})
    }
    rounds = rr
    log(`follow-up round ${rr}: ${fresh.length} fresh question(s)` + (fresh.length ? '' : '; patch + re-gate only'))
    const got = fresh.length ? await researchRound(cap(fresh), tag) : []
    const tq = got.find(x => x.q.tool && x.probe)
    if (tq) {
      P1 = tq.probe
      if (probePass(P1)) {   // the probe changed: the baseline (frozen per tool sha) is re-measured
        const b2 = await agent(baselinePrompt(), {label: 'baseline' + tag, phase: 'Fixtures', schema: BASE, ...M('mech')})
        if (b2 && FILE_OK(b2) && !infraOf(b2)) BASEL = b2; else log('baseline' + tag + ': ' + (infraOf(b2) ? 'infra ' + b2.infra_error : 'agent died') + '; SG1.11 keeps the earlier baseline')
      }
    }
    bible = await crit(PS(`Patch the street bible (follow-up round ${rr}). Edit ONLY the sections named in the gaps below; never renumber or reuse class or rule ids (append new ids after the highest); keep both files consistent.
Files: ${BIBLE_MD} and ${BIBLE_JSON} (re-stamp date "${DATE}").
New research: ${!fresh.length ? '(none asked this round: patch the wording and structure gaps below)' : got.map(x => x.r.path).join(', ') || '(none survived)'}.
${EVIDENCE_NOTE()}
Gaps:
${gapsGate.concat(fails).join('\n')}
Struck claims (never cite them): ${[...STRUCK].join(', ') || '(none)'}
${FIL_IDS_TEXT}

Rulings:
${BIBLE_RULINGS}
${DET_RULE}

${CHECK_TEXT}
${VOCAB_ST_RULE}
${STRUCTURE}
${RETURN1}`), {label: 'bible patcher' + tag, phase: 'Follow-up', schema: INTEG1, ...M('judge')})
    if (!bible) return done({reason: 'agent died: bible patcher' + tag, rounds, owner_rulings_used: RUSED, street_rulings_used: SUSED, polish_inserts_above: 'Street 2'})
    chk = await checkBible(tag)
    gate = await runGate(tag)
    ev = evaluate(bible, chk, gate, '')
    amb = await ambiguity(ev, gate, tag)
    if (!amb) return done({reason: 'agent died: ambiguity judge' + tag, rounds, owner_rulings_used: RUSED, street_rulings_used: SUSED, polish_inserts_above: 'Street 2'})
    gapsGate = (amb.gaps || []).map(g => `${g.view} § ${g.section}: ${g.what}`)
  }
} else {
  log('probe failed after ' + probeFixes + ' fix(es): fixtures, research and the gate are skipped; recording SG1.11')
  ev = evaluate(null, chk, gate, 'the probe failed SG1.11, so fixtures, research and the blank-street gate did not run')
}

// ---- Record ----
phase('Record')
const fails = failing(ev)
const vdep = !!BASEL && BASEL.view_dependent === true
const gapsFinal = gapsPre.concat(gapsGate, gapsResearch, vdep ? ['the sim fingerprint is view-dependent (baseline.json): Street 3 compares walked-on with walked-off only (README §5.3)'] : [])
const shaRec = k => (chk.val && HEX64.test(chk.val[k] || '') && chk.val[k]) || (bible && bible[k]) || ''
const gateRec = gateObj({criteria: ev.criteria, rounds, rulings_used: RUSED, street_rulings_used: SUSED, gaps: gapsFinal,
  fil_bible_sha256: fg.bible_sha256 || '', fil_rulings_cited: FIL_CITED_TEXT, view_rules: VIEW_RULES, probe: P1,
  artifacts: [{path: OUT + '/street-bible.md', sha256: shaRec('sha_md')}, {path: OUT + '/street-bible.json', sha256: shaRec('sha_json')},
    {path: OUT + '/gates/views.json', sha256: (vf && vf.sha256) || ''}, {path: OUT + '/gates/baseline.json', sha256: (BASEL && BASEL.sha256) || ''},
    {path: PROBE_REL, sha256: (P1 && P1.tool_sha) || ''}]})
const answer = a => a ? {tier: a.tier, bible_silent: a.bible_silent, missing: a.missing, items: a.items} : null
const viewAnswers = {job: JOB, date: DATE, mode: MODE, rounds, views: GATE_VIEWS.map((id, i) => {
  const row = gate.rows[i] || null, s = ev.vs[i]
  return {id, R: s.R, tier: s.tier, agree: s.agree, valid: s.valid, why: s.why, resolved: s.resolved, A: answer(row && row.A), B: answer(row && row.B)}
})}
const seenAll = new Set(((pre.ledger && pre.ledger.seen_questions) || []).map(norm).concat(QUESTIONS.map(q => norm(q.question)), resAll.map(x => norm(x.q.question))))
const unverifiedQ = new Set(resAll.filter(x => x.lensDrops > 0).map(x => norm(x.q.question)))   // a question whose verify stage died (or whose probe failed) stays out of the ledger, so the next run re-asks it
const stateRec = {job: JOB, date: DATE,
  questions: resumed.filter(x => !resAll.some(y => y.q.qid === x.qid)).map(x => ({qid: x.qid, path: x.path, sha256: x.sha256, claim_ids: x.claim_ids || [], struck: x.struck || []}))
    .concat(resAll.filter(x => x.lensDrops === 0).map(x => ({qid: x.q.qid, path: x.r.path, sha256: x.r.sha256, claim_ids: (x.r.claims || []).map(c => c.id), struck: x.struck}))),
  seen_questions: [...seenAll].filter(k => !unverifiedQ.has(k)), bible_sha: {md: shaRec('sha_md'), json: shaRec('sha_json')}}
const recs = [
  await recordD('gates/1-research.json', gateRec, 'record gate'),
  await recordD('gates/1-view-answers.json', viewAnswers, 'record view answers'),
  await recordD('state/1-research.json', stateRec, 'record ledger')
]
const recOk = !recs.some(r => !r)
const reason = !recOk ? 'record-mismatch' : gateRec.pass ? '' : (fails.map(x => x.id).join(',') || (MODE === 'full' ? '' : MODE))
const polishInserts = (gateRec.pass ? [] : fails.filter(x => !/^not evaluated/.test(String(x.measured))).map(x => `- [ ] **Street gap — close ${x.id} (${x.desc}); measured values are in docs/street/gates/1-research.json** (blocks Street 2; place directly above it; skip if already queued)`)
  .concat(gapsFinal.length ? ['- [ ] **Street gap — resolve the gaps listed in docs/street/gates/1-research.json "gaps"** (blocks Street 2; place directly above it; skip if already queued)'] : []))
  .concat(vdep ? ['- [ ] **Street gap — the sim fingerprint is view-dependent (baseline.json); Street 3 compares walked-on vs walked-off only**'] : [])
return done({pass: gateRec.pass && recOk, reason, rounds,
  outputs: [OUT + '/street-bible.md', OUT + '/street-bible.json', OUT + '/gates/views.json', OUT + '/gates/view/', OUT + '/gates/baseline.json', OUT + '/gates/1-research.json', OUT + '/gates/1-view-answers.json', OUT + '/state/1-research.json', OUT + '/research/', PROBE_REL],
  gate_path: OUT + '/gates/1-research.json', owner_rulings_used: RUSED, street_rulings_used: SUSED,
  polish_note: `street bible: ${((bible && bible.class_ids) || []).length} classes, ${ev.n5}/${GATE_VIEWS.length} views agree ≥5/6, ${ev.pct}% refs resolve, checklist ${ev.ckN}/${CHECKLIST.length}, probe ${probePass(P1) ? 'ok' : 'fail'}` + (gateRec.pass ? '' : '; skip inserts already queued'),
  polish_inserts: polishInserts, polish_inserts_above: 'Street 2',
  changelog_line: '- docs: Street 1 — street bible (blank-street gate ' + (gateRec.pass ? 'pass' : 'fail') + ')',
  gate: gateRec})
