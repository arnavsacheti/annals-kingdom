export const meta = {
  name: 'street-3-build',
  description: 'Street 3: build the street view from street-spec.json units, slice by slice (S0 instrument, S1 streaming, S2 near detail, S3 life, S4 sky and layers); gate = walk test + slice gates',
  whenToUse: 'Run as the POLISH item "Street 3 · Implementation → the street view" (multi-run) after docs/street/gates/2-plan.json passed: Workflow({name:"street-3-build", args:{date:"YYYY-MM-DD"}}). Returns reason "held" while filigree holds the sim. Holds index.html while running.',
  phases: [
    {title: 'Preflight', detail: 'drift, anchors, chain, the filigree hold, ledger, slice, the restore invariant'},
    {title: 'Re-baseline', detail: 'keep or re-measure the off reference (only when index.html changed outside the street track, or the probe changed)'},
    {title: 'Build', detail: 'per unit: implement -> syntax + restore -> accept (scored in code) -> fix<=2 -> determinism -> unit record; index.html units strictly one at a time'},
    {title: 'Smoke', detail: 'both seeds, street on/off, simDays(400), console; STREET-block greps'},
    {title: 'Slice gate', detail: 'determinism first, then capture + metrics reader + static + spec checks; scored in code'},
    {title: 'Fix units', detail: 'diagnoser -> fix units -> rebuild -> re-gate (<= maxRounds)'},
    {title: 'Record', detail: 'shots pruner; state/3-build.json, state/3-build/index-ref.json, gates/3-build-<S>.json, gates/3-build.json when S4 passes'}
  ]
}
const JOB = 'street-3-build'
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
checkArgs(['streetRulings', 'port', 'maxUnits', 'units', 'slice', 'gate', 'unstick', 'discard'])

// ---- constants (design: docs/street/design/workflow-3-build.md §3) ----
const SLICES = ['S0', 'S1', 'S2', 'S3', 'S4']
const SLICE_NAME = {S0: 'instrument', S1: 'streaming', S2: 'near detail', S3: 'life', S4: 'sky and layers'}
const SPEC_JSON = OUTABS + '/street-spec.json', VIEWS_JSON = OUTABS + '/gates/views.json', BASELINE = OUTABS + '/gates/baseline.json'
const LEDGER_DIR = OUTABS + '/state/3-build', INDEX_REF = OUTABS + '/state/3-build/index-ref.json', OFF_REF = OUTABS + '/state/3-build/off-ref.json'
const TIDINGS = OUTABS + '/fixtures/tidings.json'
const STATS_KEYS = ['fps', 'calls', 'tris', 'buildings', 'trees', 'seed', 'realm', 'treasury', 'pop', 'agents', 'chron']
const HOOK_MARK = '/*ST-HOOK*/'
const FIX_PER_ROUND = 3
const ROUND_TOKENS = 1800000
const IMPL_R = ['R6', 'R13', 'R18', 'R22'], IMPL_ST = ['ST1', 'ST3', 'ST4', 'ST5', 'ST6', 'ST7', 'ST9', 'ST11', 'ST12', 'ST13', 'ST16', 'ST18', 'ST19']
const SINCE = {fade: 'S1', swaps: 'S1', paths: 'S1', jobs: 'S1', vfps: 'S3', spacing: 'S3', clouds: 'S4', shadows_row: 'S4', weather_dial: 'S4', tidings: 'S4', fog: 'S4', hash_table: 'S0'}
const sliceAtLeast = (sl, s) => SLICES.indexOf(sl) >= SLICES.indexOf(s)
const canonJ = v => Array.isArray(v) ? v.map(canonJ) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonJ(v[k])])) : v
const CAPTURE_FLAGS = sl => '--views ' + VIEWS_JSON + ' --layers street=0,street=1 --metrics calls,tris,geoms,textures,objects,stats_keys' + (sliceAtLeast(sl, 'S0') ? ',classes,appear,swaps,jobs,resident --hash-table' : '') + (sliceAtLeast(sl, 'S1') ? ' --paths descent,oscillate,flyaway' : '') + (sliceAtLeast(sl, 'S3') ? ' --vfps 30,60 --queue-hash 600' : '') + (sliceAtLeast(sl, 'S4') ? ' --tidings ' + TIDINGS + ' --sky --fog-pairs 50' : '')   // flags exist from the slice whose units add them (S0.U01: S0-S3 set; S4 units: --tidings, --sky, --fog-pairs)
const expectOk = (exp, out) => {   // acceptance and /checks are scored here, never by the agent that ran them
  const o = String(out ?? '').trim(), e = String(exp ?? '')
  if (e.startsWith('re:')) { try { return new RegExp(e.slice(3)).test(o) } catch (x) { return false } }
  const m = /^(==|<=|>=)\s*(-?\d+(\.\d+)?)$/.exec(e); if (m) { if (!/^-?\d+(\.\d+)?$/.test(o)) return false; const v = Number(o); return isFinite(v) && (m[1] === '==' ? v === +m[2] : m[1] === '<=' ? v <= +m[2] : v >= +m[2]) }
  if (e.startsWith('json:')) { try { return JSON.stringify(canonJ(JSON.parse(o))) === JSON.stringify(canonJ(JSON.parse(e.slice(5)))) } catch (x) { return false } }
  return o === e.trim()
}
const RESTORE_TASK = (tag) => `Restore check (write nothing; a node script in a mktemp -d dir): read ${REPO}/index.html and ${SPEC_JSON} (/hook_lines: [{line, replaces}]). Delete the lines from the first line containing "/* STREET */" through the first line after it containing "/* /STREET */" (inclusive; none when absent). Then for every remaining line that contains "${HOOK_MARK}": if it equals some hook_lines[].line exactly, replace it with that entry's replaces (delete the line when replaces is null); otherwise keep it and list it in undeclared. Return {sha_restore: sha256 of the joined result (lines joined with "\\n"), sha_index: sha256sum of index.html, undeclared, marked_n, block_lines, block_top_level: the names the block declares at its top level (const/let/var/function/class at brace depth 0 inside the block)} (${tag}).`
// Street 2's unit file allowlist (workflow-2-plan.md), applied here to diagnoser fix units and ledger fix units
const UNIT_FILES_OK = /^(index\.html|tools\/street-probe\.js|docs\/street\/(fixtures|shots|device)\/.+)$/
const UNIT_FILES_BAD = /^(maps-site\/|docs\/filigree\/|\.claude\/|tools\/filigree-|tools\/street-drift\.js$|docs\/street\/(gates|state|research)\/|docs\/street\/(street-bible|street-spec)\.|docs\/street\/rulings\.json$|server\.js$|POLISH\.md$|CHANGELOG\.md$|VERSION$)/
const HASH_TABLE_MIN = ['#s=epeshu', '#s=a&goto=B', '#goto=B&s=a', '#notices=u&s=a', '#s=a&street=1', '#street=1', '#notices=u']
const ACC_KINDS = ['node', 'grep', 'json', 'probe']
const M5 = ['calls', 'tris', 'geoms', 'textures', 'objects']
const NEAR_LINE = 'camera.near = clamp(R*0.02, 0.5, 50)'
const ST_FLAG1 = ANCHORS.filter(a => a[0] === 'index.html' && a[2]).map(a => a[1])
const SPEC_MD = OUTABS + '/street-spec.md'
const PKG_INPUTS = [REPO + '/index.html', REPO + '/POLISH.md', DOCS + '/README.md', DOCS + '/rulings.json', REPO + '/.claude/workflows/filigree-1-research.js', REPO + '/tools/street-drift.js']
const KEYDOWN_RULE = `keydown_sha = sha256 of the text of ${REPO}/index.html from "window.addEventListener('keydown'" to its matching "});" (a node script matching braces from the first "{" after it).`   // Street 1's rule, so it compares with baseline.json
const TREE_RULE = `tree_digest = sha256 of the text made of one line "<repo-relative path> <sha256>" per file under ${REPO}/maps-site/ and ${REPO}/docs/filigree/ (every file, recursively), sorted by path in byte order and joined with "\\n" (no trailing newline).`
const BLOCK_RULE = `BLOCK = the lines of ${REPO}/index.html from the first line containing "/* STREET */" through the first later line containing "/* /STREET */" (empty when absent)`
const PORT_FLAG = ' --port ' + PORT

// ---- args (design §2; validated after checkArgs) ----
const MAXU = A.maxUnits ?? 6
if (!Number.isInteger(MAXU) || MAXU < 1 || MAXU > 12) die('args.maxUnits must be an integer 1..12')
const UNITS_ARG = A.units ?? null
if (UNITS_ARG !== null && (!Array.isArray(UNITS_ARG) || !UNITS_ARG.length || UNITS_ARG.some(x => typeof x !== 'string' || !x.trim()))) die('args.units must be a non-empty array of unit id strings')
if (UNITS_ARG && new Set(UNITS_ARG).size !== UNITS_ARG.length) die('args.units lists a unit twice')
if (UNITS_ARG && UNITS_ARG.length > MAXU) die(`args.units lists ${UNITS_ARG.length} units, more than maxUnits (${MAXU})`)
const SLICE_ARG = A.slice ?? null
if (SLICE_ARG !== null && !SLICES.includes(SLICE_ARG)) die('args.slice must be one of S0|S1|S2|S3|S4')
const GATE = A.gate ?? 'auto'
if (!['auto', 'skip', 'only'].includes(GATE)) die('args.gate must be auto|skip|only')
if (UNITS_ARG && GATE === 'only') die('args.units and gate "only" exclude each other (gate "only" builds nothing)')
const UNSTICK = A.unstick ?? [], DISCARD = A.discard ?? []
if (!Array.isArray(UNSTICK) || UNSTICK.some(x => typeof x !== 'string' || !x.trim())) die('args.unstick must be an array of unit id strings (resets their runs_failed for this run)')
if (!Array.isArray(DISCARD) || DISCARD.some(x => typeof x !== 'string' || !/^fix-S[0-4]\d+$/.test(x))) die('args.discard must be an array of fix unit ids (fix-S<slice digit><n>)')

// ---- schemas (design §5) ----
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
const ANY = {type: ['string', 'number', 'boolean', 'array', 'object', 'null']}
const LOOSE = {type: 'object', additionalProperties: ANY}
const NUMMAP = {type: 'object', additionalProperties: NN}
// REFV: the off reference's values (baseline.json shape), read by the preflight or the rebaseliner so the gate compares in code
const REFV = OBJ({views: {type: 'object', additionalProperties: NUMMAP}, fingerprint: {type: 'object', additionalProperties: OBJ({plain: S, walk: S})}, keydown_sha: S, view_dependent: B})
const HOLD = OBJ({fil3: OBJ({exists: B, pass: B, mode: S, forced: B}), fil4: {type: ['object', 'null'], properties: {k: I, pass: B}},
  f3_checked: B, open: SA, street_data_open: SA})
const RESTORE = OBJ({sha_restore: S, sha_index: S, undeclared: SA, marked_n: I, block_lines: I, block_top_level: SA})
const PRE3 = OBJ({missing: SA, anchors: ANCH, fil_anchors: FILANCH, drift: DRIFT, hold: HOLD, restore: RESTORE,
  gate2: OBJ({exists: B, pass: B, mode: S, forced: B, spec_ok: B, spec_sha256: S}),
  gate1: OBJ({fil_bible_sha256: S, fil_rulings_cited: {type: 'object', additionalProperties: S}}),
  fil_bible_sha256_now: S, fil_overrides: {type: 'object', additionalProperties: S}, st_overrides: {type: 'object', additionalProperties: S},
  spec: OBJ({units: {type: 'array', items: {type: 'object', additionalProperties: {type: ['string', 'number', 'boolean', 'array', 'object', 'null']}}}, checks: {type: 'object', additionalProperties: {type: 'array', items: OBJ({id: S, cmd: S, expect: S})}}, caps: {type: 'object', additionalProperties: {type: 'object', additionalProperties: NN}}, stream: {type: 'object', additionalProperties: NN}, traffic: {type: 'object', additionalProperties: NN}, hook_lines: {type: 'array', items: OBJ({line: S, replaces: {type: ['string', 'null']}})}, fog_unit: B}),
  ledger: {type: 'array', items: OBJ({id: S, status: S, runs_failed: I, spec_sha256: S, discarded: B, slice: S, title: S, last_failure: S, failed_criterion: S, unit: LOOSE}, ['id', 'status', 'runs_failed', 'spec_sha256', 'discarded'])},
  slice_gates: {type: 'object', additionalProperties: OBJ({exists: B, pass: B, spec_sha256: S})},
  index_ref: OBJ({exists: B, sha_restore: S, tool_sha: S, ref: REFV}, ['exists', 'sha_restore', 'tool_sha']),
  off_ref: OBJ({exists: B, sha_restore: S, tool_sha: S, ref: REFV}),
  baseline: OBJ({exists: B, index_sha: S, tool_sha: S, ref: REFV}),
  tidings: OBJ({exists: B, shut_ways: I, musters: I}),
  tool_sha: S, tree_digest: S, keydown_sha: S})
const REBASE = OBJ({path: S, sha256: S, parsed: B, runs_equal: B, infra_error: S, ref: REFV})
const IMPL = OBJ({id: S, files_changed: {type: 'array', items: OBJ({path: S, sha256: S})}, notes: S, dry: B})
const SYN = OBJ({ok: B, errors: SA, restore: RESTORE})
const ACC = OBJ({results: {type: 'array', items: OBJ({id: S, cmd: S, out: S})}, infra_error: S})
const DETU = OBJ({fps: {type: 'object', additionalProperties: OBJ({never: S, off: S, on: S})}, infra_error: S})
const RECU = OBJ({path: S, sha256: S, parsed: B, status: S})
const SMOKE = OBJ({console_errors: SA, infra_error: S, clock_hits: I, rng_hits: I, nowms_hits: I})
const GDET = OBJ({fps: {type: 'object', additionalProperties: OBJ({never: S, off: S, on: S, walk_on: S, walk_off: S})}, infra_error: S})
const CAPT = OBJ({metrics_path: S, metrics_sha256: S, shots_dir: S, infra_error: S})
const DIGEST = OBJ({sha256: S,
  views: {type: 'object', additionalProperties: OBJ({off: {type: 'object', additionalProperties: NN}, on: {type: 'object', additionalProperties: NN}, classes_on: {type: 'object', additionalProperties: I}})},
  appear: OBJ({violations: SA, slowest_ms: NN}), swaps: {type: 'object', additionalProperties: OBJ({in: I, out: I})},
  oscillate_builds: {type: 'object', additionalProperties: I}, flyaway: OBJ({geoms_first: NN, geoms_return: NN, geoms_reseed: NN, resident_max: NN}),
  jobs_max: NN, built_tris_max: NN, vfps: OBJ({h30: S, h60: S}), spacing: OBJ({min_gap: NN, dvis_over_dtrue: I}),
  hash_table: {type: 'array', items: OBJ({hash: S, ok: B, got: S})}, writer_roundtrip: B, stats_keys: SA, inst_no_color: I,
  clouds: OBJ({same_day_equal: B, next_day_differs: B, deck_matches_weather: B}), shadows_row: OBJ({held_text: B, disabled: B, off_kills_shadow: B, default_on_equal: B}),
  weather_dial: OBJ({exact: B, counts: {type: 'array', items: I}}), tidings: OBJ({barriers: I, musters: I, off_zero: B, atlas_equal: {type: ['boolean', 'null']}}),
  fog: OBJ({present: B, src_equal: {type: ['boolean', 'null']}, pairs_equal: {type: ['boolean', 'null']}}), device: {type: ['object', 'null'], properties: {fps_min: N, degrade_max: I}},
  console_errors: SA})
const STATIC = OBJ({clock_hits: I, rng_hits: I, nowms_hits: I, inst_n: I, inst_color_n: I, restore: RESTORE, fil_anchors: FILANCH, street_in_block: {type: 'object', additionalProperties: I}, keydown_sha: S, near_line: B, tree_digest: S})
const CHK = OBJ({results: {type: 'array', items: OBJ({id: S, cmd: S, out: S})}, infra_error: S})
const DIAG = OBJ({units: {type: 'array', items: OBJ({id: S, slice: S, title: S, kind: S, files: SA, deps: SA, covers: SA, hooks: SA,
  acceptance: {type: 'array', items: OBJ({id: S, kind: S, cmd: S, expect: S})}, failed_criterion: S, model: S, effort: S}, ['id', 'slice', 'title', 'kind', 'files', 'deps', 'covers', 'hooks', 'acceptance', 'failed_criterion'])}, ledger_written: SA})
const PRUNE = OBJ({kept: SA, deleted: SA, count_ok: B})
const DISCS = OBJ({files: {type: 'array', items: OBJ({path: S, sha256: S, status: S})}})

// ---- helpers ----
const J = v => JSON.stringify(v)
const J2 = v => JSON.stringify(v, null, 2)
const relP = p => { const s = String(p ?? '').trim().replace(/^(\.\/)+/, ''); return s.startsWith(REPO + '/') ? s.slice(REPO.length + 1) : s }
const HEX = x => /^[0-9a-f]{64}$/.test(String(x ?? ''))
const num = x => typeof x === 'number' && isFinite(x)
const infraOf = x => !!x && typeof x.infra_error === 'string' && x.infra_error.trim() !== ''
const arr = x => Array.isArray(x) ? x : []
const obj = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {}
const sfx = tag => tag ? '-' + tag.trim().replace(/[^A-Za-z0-9.]+/g, '-') : ''
const unitOf = x => {
  const {status, date, runs_failed, last_failure, ...u} = obj(x)
  return {...u, id: String(u.id ?? ''), slice: String(u.slice ?? ''), title: String(u.title ?? ''), kind: String(u.kind ?? ''),
    files: [...new Set(arr(u.files).map(relP))], deps: arr(u.deps).map(String), covers: arr(u.covers).map(String), hooks: arr(u.hooks).map(String),
    acceptance: arr(u.acceptance).filter(a => a && typeof a === 'object').map(a => ({id: String(a.id ?? ''), kind: String(a.kind ?? ''), cmd: String(a.cmd ?? ''), expect: String(a.expect ?? '')})),
    failed_criterion: String(u.failed_criterion ?? ''), model: u.model || null, effort: u.effort || null}
}
const touchesIndex = u => u.files.includes('index.html')
const roleOf = u => touchesIndex(u) ? 'judge' : u.files.some(f => /^tools\/street-[^/]+\.js$/.test(f)) ? 'deep' : 'audit'
const usesProbe = u => u.acceptance.some(a => a.kind === 'probe' || /street-probe/.test(a.cmd))
const lockKeys = u => [...new Set(u.files.concat(usesProbe(u) ? ['index.html', 'tools/street-probe.js'] : []))]   // a probe run loads index.html and the probe: it never overlaps an edit of either
function kahn(units) {   // topological order, tie-break by id; cyclic = ids left over
  const byId = new Map(units.map(u => [u.id, u])), indeg = new Map(units.map(u => [u.id, 0])), next = new Map(units.map(u => [u.id, []]))
  for (const u of units) for (const d of new Set(u.deps)) if (byId.has(d) && d !== u.id) { indeg.set(u.id, indeg.get(u.id) + 1); next.get(d).push(u.id) }
  const cmp = (a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  const ready = units.filter(u => indeg.get(u.id) === 0).sort(cmp), order = []
  while (ready.length) {
    const u = ready.shift(); order.push(u)
    for (const j of next.get(u.id)) { indeg.set(j, indeg.get(j) - 1); if (indeg.get(j) === 0) { ready.push(byId.get(j)); ready.sort(cmp) } }
  }
  const selfDep = new Set(units.filter(u => u.deps.includes(u.id)).map(u => u.id))
  return {order: order.filter(u => !selfDep.has(u.id)), cyclic: units.filter(u => !order.includes(u) || selfDep.has(u.id)).map(u => u.id)}
}
function closeOver(units, isDone, deferred) {   // transitive exclusion to a fixpoint: a dependency must be done or itself still in the pool
  let pool = units.slice(), changed = true
  while (changed) {
    changed = false
    const ids = new Set(pool.map(u => u.id))
    for (const u of pool) {
      const unmet = u.deps.filter(d => !isDone(d) && !ids.has(d))
      if (unmet.length) { deferred.push({id: u.id, why: 'dep-unmet: ' + unmet.join(', ')}); log(`deferred ${u.id} (dep-unmet: ${unmet.join(', ')})`); pool = pool.filter(x => x !== u); changed = true; break }
    }
  }
  return pool
}

// ---- Preflight ----
phase('Preflight')
const PREFLIGHT3 = `Street 3 preflight. Read only: write nothing (throwaway node scripts go in a mktemp -d dir). A missing file gives the empty value (false, "", 0, [] or {}); never invent. Return one JSON object with these fields:
1. anchors: ${ANCHOR_TASK}
2. fil_anchors: ${FIL_ANCHOR_TASK}
3. drift: ${DRIFT_TASK}
4. hold: ${HOLD_TASK}
5. restore: ${RESTORE_TASK('preflight')}
6. missing: the absolute paths among ${J(PKG_INPUTS)} that do not exist; and, only when ${OUTABS}/gates/2-plan.json exists with "pass": true, also those among ${J([SPEC_JSON, VIEWS_JSON, BASELINE, PROBE])} that do not exist.
7. gate2, from ${OUTABS}/gates/2-plan.json: {exists (present and parses), pass: parsed.pass === true, mode: parsed.mode or "", forced: parsed.forced_by != null, spec_ok: its "artifacts" ([{path, sha256}]) has an entry for street-spec.json and every entry whose path ends in street-spec.json or street-spec.md records the sha256sum that file has now (false when the gate or a file is missing), spec_sha256: sha256sum of ${SPEC_JSON} ("" when missing)}.
8. gate1, from ${OUTABS}/gates/1-research.json: {fil_bible_sha256: its "fil_bible_sha256", fil_rulings_cited: its "fil_rulings_cited" object verbatim}. fil_bible_sha256_now: sha256sum of ${FIL}/density-bible.json.
9. fil_overrides: the "overrides" object of ${FIL}/rulings.json; st_overrides: the "overrides" object of ${DOCS}/rulings.json.
10. spec, from ${SPEC_JSON}: units = /units verbatim (each {id, slice, title, kind, files, deps, covers, hooks, acceptance: [{id, kind, cmd, expect}], model?, effort?}); checks = /checks verbatim ({<slice>: [{id, cmd, expect}]}); caps = {<SVn>: /caps/<SVn>/on} (numbers only); stream = the numeric fields of /stream plus fade_ms = /fade/ms; traffic = the numeric fields of /traffic; hook_lines = /hook_lines verbatim ([{line, replaces}]); fog_unit = some /units entry has id "S4.Ufog".
11. tidings, from ${TIDINGS}: {exists, shut_ways: the number of its shut-way entries, musters: the number of its muster-day entries at Epēshu}.
12. ledger: one entry per *.json file directly in ${LEDGER_DIR}, except index-ref.json and off-ref.json: {id, status, runs_failed, spec_sha256, discarded: status === "discarded", slice, title, last_failure, failed_criterion, unit: for an id starting "fix-", the file's unit fields {id, slice, title, kind, files, deps, covers, hooks, acceptance, failed_criterion, model?, effort?}, else {}}.
13. slice_gates: keys S0, S1, S2, S3, S4 = ${OUTABS}/gates/3-build-<key>.json and key final = ${OUTABS}/gates/3-build.json, each {exists (present and parses), pass: parsed.pass === true, spec_sha256: its "spec_sha256"}.
14. index_ref = ${INDEX_REF} and off_ref = ${OFF_REF}, each {exists, sha_restore, tool_sha, ref}; baseline = ${BASELINE}: {exists, index_sha, tool_sha, ref}. ref (all three) = {views: the file's "views" ({<SVn>: {calls, tris, geoms, textures, objects}}), fingerprint: its "fingerprint" ({<seed>: {plain, walk}}), keydown_sha, view_dependent}.
15. tool_sha: sha256sum of ${PROBE}. ${TREE_RULE} ${KEYDOWN_RULE}`
const pre = await crit(PS(PREFLIGHT3), {label: 'preflight', phase: 'Preflight', schema: PRE3, ...M('mech')})
if (!pre) return done({reason: 'agent died: preflight', check_off: false})
if (!pre.drift || pre.drift.ok !== true) die('prelude drift: ' + driftIds(pre.drift) + ' (node tools/street-drift.js; fix per docs/street/README.md §12)')
if (arr(pre.missing).length) die('missing inputs: ' + pre.missing.join(', '))
const lost = anchorsLost(pre.anchors)
if (lost.length) die('anchor lost: ' + lost.join('; '))
const {r: RUL, used: RUSED} = rulingsMerge(pre.fil_overrides)
const STR = stRulingsMerge(pre.st_overrides)
const SPEC = {units: arr(obj(pre.spec).units), checks: obj(obj(pre.spec).checks), caps: obj(obj(pre.spec).caps), stream: obj(obj(pre.spec).stream), traffic: obj(obj(pre.spec).traffic), hook_lines: arr(obj(pre.spec).hook_lines), fog_unit: obj(pre.spec).fog_unit === true}
const g2 = obj(pre.gate2), g1 = obj(pre.gate1)
const SPEC_SHA = String(g2.spec_sha256 || '')
const chain = [!(g2.exists && g2.pass && g2.mode === 'full' && !g2.forced && g2.spec_ok) ? 'build must not start before the street spec passes (docs/street/gates/2-plan.json pass, spec unchanged)' : '',
  g1.fil_bible_sha256 !== pre.fil_bible_sha256_now ? 'the filigree density bible changed since Street 1; re-run street-1-research' : '',
  citedChanged(g1.fil_rulings_cited, RUL).length ? 'the cited filigree rulings changed since Street 1 (' + citedChanged(g1.fil_rulings_cited, RUL).join(', ') + '); re-run street-1-research' : ''].filter(Boolean)
if (chain.length && !FORCE && MODE === 'full') die(chain[0])   // a thrown prerequisite: the polish run treats it as blocked
if (chain.length) log('gate chain not satisfied: ' + chain.join('; ') + (FORCE ? ' (forced: ' + FORCE + ')' : ' (reported only in ' + MODE + ' mode)'))

// ---- slice ----
const SG = obj(pre.slice_gates)
const passed = s => { const g = obj(SG[s]); return g.exists === true && g.pass === true && !!SPEC_SHA && g.spec_sha256 === SPEC_SHA }
let SL = SLICE_ARG || SLICES.find(s => !passed(s)) || null
if (!SL) {
  if (passed('final')) return done({pass: true, reason: MODE === 'plan' ? 'plan' : 'nothing to build', check_off: MODE === 'full' && !FORCE, slice: 'S4',
    owner_rulings_used: RUSED, street_rulings_used: STR.used, gate_path: OUT + '/gates/3-build.json', polish_note: 'Street 3 complete (gates/3-build.json pass under the current street spec)'})
  SL = 'S4'; log('slices S0-S4 passed but gates/3-build.json is not a pass under the current spec: re-running the S4 gate')
}
const unpassedBefore = SLICES.slice(0, SLICES.indexOf(SL)).filter(s => !passed(s))
if (unpassedBefore.length) die('slice ' + SL + ' refused: earlier slice ' + unpassedBefore[0] + ' has not passed its gate')
const specGap = (SL === 'S4' ? SLICES : [SL]).filter(s => !arr(SPEC.checks[s]).length)
if (specGap.length) {
  const msg = 'street-spec.json has no /checks for slice ' + specGap.join(', ') + ': re-run street-2-plan'
  if (MODE === 'full' && !FORCE && !chain.length) die(msg)
  log(msg + ' (reported only: ' + (FORCE ? 'forced' : chain.length ? 'chain not satisfied' : MODE + ' mode') + ')')
}

// ---- schedule (code) ----
const LEDGER = new Map(arr(pre.ledger).map(e => [String(e.id), {...e}]))
const DISC = new Set(DISCARD)
for (const id of UNSTICK) { const e = LEDGER.get(id); if (e && (e.runs_failed || 0) > 0) { e.runs_failed = 0; log(`unstick: ${id} runs_failed reset to 0 for this run`) } else log(`unstick: ${id} has no failed runs on record`) }
const HOOK_SET = new Set(SPEC.hook_lines.map(h => String(h.line)))
const fixSliceOf = id => { const m = /^fix-(S[0-4])\d+$/.exec(id); return m ? m[1] : '' }
function unitWhy(u) {   // structural rules every fix unit must meet (Street 2's file allowlist, declared hooks, mechanical acceptance)
  if (!/^fix-S[0-4]\d+$/.test(u.id)) return 'id is not fix-S<slice digit><n>'
  if (u.slice !== fixSliceOf(u.id)) return 'slice ' + u.slice + ' does not match its id'
  if (!u.files.length || u.files.some(f => !UNIT_FILES_OK.test(f) || UNIT_FILES_BAD.test(f))) return 'files outside the street allowlist: ' + J(u.files)
  if (u.hooks.some(h => !HOOK_SET.has(h))) return 'a hook line the spec does not declare'
  if (u.hooks.length && !touchesIndex(u)) return 'hooks without index.html in files'
  if (!u.acceptance.length || u.acceptance.some(a => !a.id || !ACC_KINDS.includes(a.kind) || !a.cmd.trim()) || new Set(u.acceptance.map(a => a.id)).size !== u.acceptance.length) return 'malformed acceptance'
  return ''
}
const SPEC_UNITS = SPEC.units.map(unitOf).filter(u => u.id)
const LEDGER_FIX = []
for (const e of LEDGER.values()) {
  if (!/^fix-/.test(e.id) || DISC.has(e.id) || e.discarded === true || e.status === 'discarded') continue
  if (e.status === 'proposed') { log(`fix unit ${e.id} was proposed but never accepted: ignored`); continue }
  if (!['pending', 'failed', 'infra', 'done'].includes(e.status)) { log(`fix unit ${e.id}: unknown status ${e.status}: ignored`); continue }
  const u = unitOf({...obj(e.unit), id: e.id})
  const why = unitWhy(u)
  if (why) { log(`ledger fix unit ${e.id} ignored: ${why}`); continue }
  LEDGER_FIX.push(u)
}
const ALL_BY_ID = new Map(SPEC_UNITS.concat(LEDGER_FIX).map(u => [u.id, u]))
const doneSet = new Set([...LEDGER.values()].filter(e => e.status === 'done' && !!SPEC_SHA && e.spec_sha256 === SPEC_SHA && ALL_BY_ID.has(e.id)).map(e => e.id))
for (const e of LEDGER.values()) if (e.status === 'done' && !doneSet.has(e.id) && ALL_BY_ID.has(e.id)) log(`${e.id}: built under another street-spec.json (or unstamped); re-queued`)
if (doneSet.has('S0.U00') && !(obj(pre.anchors)['/* STREET */'] && obj(pre.anchors)['/* /STREET */'])) { doneSet.delete('S0.U00'); log('S0.U00 is recorded done but the /* STREET */ block markers are missing from index.html: re-queued') }
if (!RESUME) for (const u of ALL_BY_ID.values()) if (u.slice === SL && doneSet.delete(u.id)) log(`resume:false: ${u.id} re-queued`)
const newFixIds = []
const unitIdsOf = s => [...new Set([...ALL_BY_ID.values()].filter(u => u.slice === s).map(u => u.id))]
const usedIds = new Set([...LEDGER.keys()].concat(SPEC_UNITS.map(u => u.id)))   // dedup: a fix id is never reused, a rejected proposal included
const seenCrit = new Set(LEDGER_FIX.filter(u => u.failed_criterion).map(u => u.slice + '|' + u.failed_criterion))   // dedup: one fix unit per (slice, criterion)

const cand = [...ALL_BY_ID.values()].filter(u => u.slice === SL)
const deferred = [], stuck = []
const pool0 = []
for (const u of cand) {
  if (doneSet.has(u.id)) continue
  const led = LEDGER.get(u.id) || {}
  if ((led.runs_failed || 0) >= 3) { stuck.push({id: u.id, title: u.title, last_failure: led.last_failure || ''}); log(`stuck: ${u.id} (runs_failed ${led.runs_failed})`); continue }
  pool0.push(u)
}
const topo = kahn(closeOver(pool0, id => doneSet.has(id), deferred))
if (topo.cyclic.length) die('scheduler: dependency cycle among ' + topo.cyclic.join(', '))
let batch
if (UNITS_ARG) {
  const inSlice = new Set(cand.map(u => u.id)), ready = new Set(topo.order.map(u => u.id))
  for (const id of UNITS_ARG) {
    if (!inSlice.has(id)) die(`args.units: ${id} is not a unit of the current slice ${SL}`)
    if (!ready.has(id)) die(`args.units: ${id} is not ready (done, stuck, discarded or dep-unmet)`)
  }
  batch = topo.order.filter(u => UNITS_ARG.includes(u.id))
} else batch = topo.order.slice(0, MAXU)
batch = cap(batch)
if (GATE === 'only') batch = []
{
  const ids = new Set(batch.map(u => u.id))
  for (const u of batch) for (const d of u.deps) if (!doneSet.has(d) && !ids.has(d)) die(`scheduler: ${u.id} depends on ${d}, which is neither done nor scheduled before it in this batch`)
}
const restOfSlice = unitIdsOf(SL).filter(id => !doneSet.has(id) && !batch.some(u => u.id === id))

// ---- the hold (computed in code; never overridable) ----
const heldBy = holdWhy(pre.hold, STR)
const blockedBy = arr((pre.hold || {}).street_data_open)
if (MODE === 'plan') {
  const nB = batch.length, gateLikely = GATE === 'only' || (GATE === 'auto' && !restOfSlice.length)
  // maxima as the code runs them (crit() = 2 agents); every gate cycle (1 + ROUNDS) re-runs smoke and the gate; fix-unit builds count under Fix units
  const UNIT_MAX = 1 + 1 + 1 + 2 * (1 + 1 + 1) + 1 + 2, GATE_CYCLE = 2 + 2 + 2 + 1 + 1
  const schedFor = n => [
    {phase: 'Preflight', agents_min: 1, agents_max: 2 + (DISC.size ? 1 : 0)},
    {phase: 'Re-baseline', agents_min: 0, agents_max: 2},
    {phase: 'Build', agents_min: 4 * n, agents_max: UNIT_MAX * n},
    {phase: 'Smoke', agents_min: n || gateLikely ? 1 : 0, agents_max: 2 * (1 + ROUNDS)},
    {phase: 'Slice gate', agents_min: gateLikely ? 6 : 0, agents_max: GATE_CYCLE * (1 + ROUNDS)},
    {phase: 'Fix units', agents_min: 0, agents_max: ROUNDS * (1 + FIX_PER_ROUND * UNIT_MAX)},
    {phase: 'Record', agents_min: 3, agents_max: 1 + 4 * 2}
  ]
  const boundFor = n => schedFor(n).reduce((s, r) => s + r.agents_max, 0)
  const schedule = schedFor(nB), agentsMax = boundFor(nB), bound = boundFor(MAXU)
  return done({reason: 'plan', slice: SL, check_off: false, chain_ok: !chain.length, chain, held: heldBy.length > 0, held_by: heldBy, blocked_by: blockedBy, spec_gap: specGap,
    owner_rulings_used: RUSED, street_rulings_used: STR.used, schedule, agents_max: agentsMax, agents_bound: bound, over_bound: bound > 190,
    units: batch.map(u => u.id), deferred, stuck: stuck.map(x => x.id), rest_of_slice: restOfSlice, gate_expected: gateLikely,
    polish_note: `plan: slice ${SL} (${SLICE_NAME[SL]}), ${nB} unit(s) [${batch.map(u => u.id).join(', ')}], ${deferred.length} deferred, ${stuck.length} stuck; at most ${agentsMax} agents this run, ${bound} at maxUnits ${MAXU}, maxRounds ${ROUNDS} (README §11 bound 190)` +
      (chain.length ? '; chain not satisfied (a full run refuses: ' + chain[0] + ')' : '') + (heldBy.length ? '; held: ' + heldBy.join('; ') : '') + (blockedBy.length ? '; blocked by ' + blockedBy.length + ' open Street data (S3) item(s)' : '') +
      (specGap.length ? '; spec gap: no /checks for slice ' + specGap.join(', ') : '')})
}
if (heldBy.length) return done({reason: 'held', check_off: false, held_by: heldBy, slice: SL, owner_rulings_used: RUSED, street_rulings_used: STR.used,
  polish_note: 'held: filigree holds the sim (' + heldBy.join('; ') + '); no release, take the next item'})
if (blockedBy.length) return done({reason: 'blocked', check_off: false, blocked_by: blockedBy, slice: SL, owner_rulings_used: RUSED, street_rulings_used: STR.used,
  polish_note: 'blocked: open Street data (S3) items: ' + blockedBy.join(' | ') + '; no release, take the next item'})
if (DISC.size && MODE === 'full') {
  const dr = await agent(PS(`Owner discard (args.discard), no judging. For each file below that exists, set "status" to "discarded" and add "discarded_reason": "discarded by owner (args.discard)", keeping every other field (2-space indent, trailing newline); change nothing else: ${J([...DISC].map(id => LEDGER_DIR + '/' + id + '.json'))}. Return {files: [{path, sha256 (sha256sum after the edit), status (the status as read back)}]} for each file that exists.`),
    {label: 'owner discard', phase: 'Preflight', schema: DISCS, ...M('mech')})
  if (!dr || dr.files.some(f => f.status !== 'discarded')) log('owner discard incomplete: a ledger file may still read as pending (the ids are excluded from this run either way)')
}

// ---- Re-baseline (design §7: decided in code from the restore sha and the stamps) ----
phase('Re-baseline')
const gaps = []
const refSha = pre.index_ref.exists ? pre.index_ref.sha_restore : pre.baseline.index_sha
const refTool = pre.off_ref.exists ? pre.off_ref.tool_sha : pre.baseline.tool_sha
const rebaseWhy = [pre.restore.sha_restore !== refSha ? 'index.html changed outside the street track (restore sha ' + pre.restore.sha_restore + ' != ' + (refSha || 'none') + ')' : '',
  pre.tool_sha !== refTool ? 'the probe changed (tool sha ' + pre.tool_sha + ' != ' + (refTool || 'none') + ')' : ''].filter(Boolean)
const keep = !rebaseWhy.length
let REF = keep ? (pre.off_ref.exists ? pre.off_ref.ref : pre.baseline.ref) : null
if (!keep) {
  const rb = await crit(PS(`Re-baseline the street-off reference (${rebaseWhy.join('; ')}); measure, never judge. ${SANDBOX_ST}
In a mktemp -d dir, from ${REPO}: run twice node ${PROBE} --views ${VIEWS_JSON} --layers street=0 --metrics calls,tris,geoms,textures,objects,stats_keys --cdn-dir <tmp>${PORT_FLAG} (each with its own --out); for each seed of ${J(SEEDS)} run twice --fingerprint --seed <seed> --days 400 and twice --fingerprint --seed <seed> --days 400 --walk ${VIEWS_JSON} (same --cdn-dir and --port). runs_equal = the two metrics runs give equal views and every fingerprint pair is equal. ${KEYDOWN_RULE}
Write ${OFF_REF} (create the directory) = baseline.json's shape plus why, sha_restore and tool_sha: {date: "${DATE}", frozen: true, why: ${J(rebaseWhy.join('; '))}, sha_restore: "${pre.restore.sha_restore}", tool_sha: "${pre.tool_sha}", index_sha (sha256sum ${REPO}/index.html), views: {<SVn>: {calls, tris, geoms, textures, objects}} (from the first metrics run), fingerprint: {<seed>: {plain, walk}}, view_dependent (some seed's plain differs from its walk), stats_keys, keydown_sha, near_line: "${NEAR_LINE};", runs_equal}.
${READBACK} Also return runs_equal, infra_error ("" or the setup failure: port, browser or CDN) and ref = {views, fingerprint, keydown_sha, view_dependent} as read back from the file.`),
  {label: 'rebaseliner', phase: 'Re-baseline', schema: REBASE, ...M('mech')})
  if (!rb) return done({reason: 'agent died: rebaseliner', check_off: false, slice: SL, owner_rulings_used: RUSED, street_rulings_used: STR.used, polish_note: 'Street 3: the rebaseliner died; no release, the next run retries'})
  if (infraOf(rb)) return done({reason: 'infra', check_off: false, slice: SL, owner_rulings_used: RUSED, street_rulings_used: STR.used, polish_note: 'Street 3: infra while re-baselining (' + rb.infra_error.trim() + '); no release'})
  if (!FILE_OK(rb) || absP(rb.path) !== OFF_REF) return done({reason: 'agent died: rebaseliner', check_off: false, slice: SL, owner_rulings_used: RUSED, street_rulings_used: STR.used, polish_note: 'Street 3: the off reference did not read back; no release'})
  if (rb.runs_equal !== true) return done({reason: 'infra', check_off: false, slice: SL, owner_rulings_used: RUSED, street_rulings_used: STR.used, polish_note: 'Street 3: the re-measured off reference is not reproducible (runs differ); no release'})
  REF = rb.ref
  gaps.push('rebaselined: ' + rebaseWhy.join('; '))
}
REF = {views: obj(obj(REF).views), fingerprint: obj(obj(REF).fingerprint), keydown_sha: String(obj(REF).keydown_sha || ''), view_dependent: obj(REF).view_dependent === true}
const OFFREF_PATH = keep && !pre.off_ref.exists ? BASELINE : OFF_REF
if (REF.view_dependent) gaps.push('the sim fingerprint is view-dependent in the off reference: GS.2 compares walk_on with walk_off and the reference walk')

// ---- Build ----
const anchorText = anchorMap(pre.anchors)
const FIL_LITS = Object.keys(obj(obj(pre.fil_anchors).literals))
const hookEntries = u => SPEC.hook_lines.filter(h => u.hooks.includes(h.line))
const hardRules = u => `Hard rules (the script checks them in code; a violation fails the unit):
1. All street JS lives in ONE /* STREET */ … /* /STREET */ block of ${REPO}/index.html, each marker on its own line: one namespace const STREET = (function(){ … })() placed directly above the line holding the /block/placement literal of ${SPEC_JSON}; the block declares no other top-level name.
2. Outside the block change only the hook lines this unit lists in "hooks", written exactly as /hook_lines of ${SPEC_JSON} gives them (each contains ${HOOK_MARK}); a hook that "replaces" a line replaces exactly that line. Touch no other line. This unit's hooks: ${J(hookEntries(u))}.
3. Never call simAdvance, tickDay or processArrivals; never write departDay, route, speed or any W field; never name W.rng; never read nowMs or any clock: grep -E '${ST_CLOCK_GREP}' must find nothing in the block, and gen and sim code never gain such a call either. Every random choice is the keyed stream ${KEY_IDIOM} (the sim's own xmur3 -> sfc32 idiom, index.html function makeStream; the sim has no mulberry32), cached per key; presentation time is ST.t += dt.
4. Every InstancedMesh gets setColorAt for every instance (instanceColor) before its first render (anchor "every InstancedMesh sharing MAT.world MUST carry instanceColor").
5. Default off: without street=1 in the hash the block builds nothing and adds no scene object; ANNALS.stats() keys stay exactly ${J(STATS_KEYS)}; street metrics live under ANNALS.street.
6. Never put any of these literals inside the block (filigree anchors and the street flag-1 anchors): ${J(FIL_LITS.concat(ST_FLAG1))}. Never change the line "${NEAR_LINE};" (the near plane) or the keydown handler (window.addEventListener('keydown' …); add no new keys.
7. Player-facing strings (row labels, class labels, tooltips, chronicle text) obey: ${VOCAB_ST_RULE} ST16: ${STR.r.ST16}
8. ${MODE === 'smoke' ? `SMOKE RUN: write your intended change as a unified diff to ${OUTABS}/dry/${u.id}.diff (create the directory), edit nothing, return files_changed [] and dry true.` : 'In smoke mode diffs go to <outDir>/dry/ and nothing is edited; this is a full run, so edit for real and return dry false.'}
9. Edit ONLY this unit's files (repo-relative to ${REPO}): ${J(u.files)}; other units may be running at the same time on other files. Return files_changed with the sha256 (sha256sum after your edit) of every file you wrote.`
const IMPL_PROMPT = u => `You are implementing build unit ${u.id} of the Street view (slice ${u.slice}, ${SLICE_NAME[u.slice] || ''}) in the Annals sim.
Unit (JSON): ${J(u)}
The spec rules it covers are the /rules entries of ${SPEC_JSON} with ids ${J(u.covers)} (prose in ${SPEC_MD}); /block, /hook_lines, /determinism, /probe and /caps there are binding.
Rulings:
${rulingText(RUL, IMPL_R)}
${rulingText(STR.r, IMPL_ST)}
${VOCAB_ST_RULE}
Current anchors (re-derived this run; grep the pattern if a line moved):
${anchorText}
${u.files.some(f => /^tools\/street-/.test(f)) ? `The probe ${PROBE} is the street track's instrument: extend it, never break it (every Street 1 flag and output field keeps its meaning). ${SANDBOX_ST}\n` : ''}${hardRules(u)}
Return {id: "${u.id}", files_changed: [{path (repo-relative), sha256}], notes (one paragraph), dry}.`
const syntaxPrompt = (u, targets) => `Mechanical syntax + restore check for unit ${u.id}, no judging; write nothing.
1. Check ONLY these files (repo-relative to ${REPO}): ${J(targets)}. Each .html file: the CLAUDE.md "Verification" check (extract every inline <script> block without a src attribute and compile its body with new Function; a failure is "<file> block <n>: <message>"); each .js file: node --check; each .json file: JSON.parse. ok = every check passed; errors = one line per failure.
2. restore: ${RESTORE_TASK(u.id)}
Return {ok, errors, restore}.`
const acceptPrompt = u => `Run the acceptance items of build unit ${u.id} from ${REPO} exactly as written and report what they print; write nothing in the repo (scratch output in a mktemp -d dir). Never judge and never compare with an expected value: the script scores every item. Items: ${J(u.acceptance.map(a => ({id: a.id, kind: a.kind, cmd: a.cmd})))}
For each item run its cmd in a shell from ${REPO}; out = its stdout, trimmed, at most 2000 characters (a command that fails gives its last stderr line). A cmd that runs node tools/street-probe.js without --cdn-dir gets --cdn-dir <tmp>${PORT_FLAG} appended: ${SANDBOX_ST}${MODE === 'smoke' ? ' SMOKE: the unit was a dry run, so failures are expected; still run every item.' : ''}
Return {results: [{id, cmd, out}] one per item in the given order, infra_error: "" (or the setup failure: port, browser or CDN; never a failing item)}.`
const fixPrompt = (u, st, k) => `You are fixing build unit ${u.id} (attempt ${k} of 2) after its check failed (scored in code).
Syntax errors: ${J(st.syn ? st.syn.errors : [])}
Restore report: ${J(st.syn ? st.syn.restore : null)} (the restored sha must stay ${pre.restore.sha_restore} and undeclared must be []: undo any edit outside the block that is not one of this unit's declared hook lines).
Failing acceptance items (expect vs what the command printed): ${J(st.bad || [])}
Fix the cause, never the check.
${IMPL_PROMPT(u)}`
const detPrompt = u => `Mechanical determinism check for unit ${u.id}, no judging; write nothing in the repo (outputs in a mktemp -d dir). ${SANDBOX_ST} For each seed of ${J(SEEDS)} run from ${REPO}: node ${PROBE} --fingerprint --seed <seed> --days 400 (never: no street layer flag), the same with --layers street=0 (off) and with --layers street=1 (on), each with --cdn-dir <tmp>${PORT_FLAG} and its own --out. Return {fps: {<seed>: {never, off, on}} (each the printed fingerprint.sha256; "" when absent), infra_error ("" or the setup failure)}.`

async function recordUnit(u, s) {
  const prev = LEDGER.get(u.id) || {}
  const status = s.status
  const runsFailed = (prev.runs_failed || 0) + (status === 'failed' ? 1 : 0)
  const res = new Map(arr(s.acc && s.acc.results).map(r => [r.id, r]))
  const rec = {...u, date: DATE, spec_sha256: SPEC_SHA, status, runs_failed: runsFailed, last_failure: s.last_failure || '',
    acceptance: u.acceptance.map(a => { const r = res.get(a.id); return {...a, out: r ? String(r.out).slice(0, 400) : '', ok: r ? expectOk(a.expect, r.out) : null} }),
    shas: [...(s.shas || new Map()).entries()].map(([path, sha256]) => ({path, sha256})), fix_attempts: s.attempts || 0,
    restore: s.restore || null, determinism: s.det || null, dry: MODE === 'smoke'}
  const path = LEDGER_DIR + '/' + u.id + '.json'
  const r = await crit(PS(`Write the JSON below VERBATIM (2-space indent, trailing newline) to ${path}, creating parent directories (one file per unit; replace any previous content). Also return status = the "status" field of the file as you read it back.

${J2(rec)}

${READBACK}`), {label: `${u.id} · record`, phase: 'Build', schema: RECU, ...M('mech')})
  const recorded = FILE_OK(r) && r.status === status && absP(r.path) === path
  if (!recorded) log(`${u.id}: unit record ${r ? 'read-back mismatch' : 'agent died'}; the unit counts as failed for this run (the next preflight re-reads the ledger)`)
  return {id: u.id, ok: status === 'done' && recorded, status: recorded ? status : 'failed', built_status: status, recorded, title: u.title,
    last_failure: recorded ? rec.last_failure : (rec.last_failure || 'unit record failed'), runs_failed: runsFailed, files_changed: rec.shas.map(x => x.path), shas: rec.shas, restore: s.restore || null}
}

async function buildUnit(u) {
  const L = s => `${u.id} · ${s}`
  const role = roleOf(u)
  const shas = new Map()
  const note = r => { for (const f of arr(r.files_changed)) shas.set(relP(f.path), String(f.sha256)) }
  const outside = () => [...shas.keys()].filter(f => !u.files.includes(f))
  const strayFail = (att, acc) => { const o = outside(); log(`${u.id}: edited outside unit files: ${o.join(', ')}`); return recordUnit(u, {status: 'failed', last_failure: 'edited outside unit files: ' + o.join(', '), shas, attempts: att, acc}) }
  const impl = await agent(PS(IMPL_PROMPT(u)), {label: L('implement'), phase: 'Build', schema: IMPL, ...MO(role, u)})
  if (!impl) return recordUnit(u, {status: 'infra', last_failure: 'agent died: implement', shas})
  note(impl)
  if (outside().length) return strayFail(0)
  const check = async k => {
    const tag = k ? ` (fix ${k})` : ''
    const targets = [...new Set(u.files.concat([...shas.keys()]).concat(['index.html']))].filter(f => /\.(html|json|js)$/.test(f))
    const syn = await agent(PS(syntaxPrompt(u, targets)), {label: L('syntax' + tag), phase: 'Build', schema: SYN, ...M('mech')})
    if (!syn) return {dead: 'syntax' + tag}
    const acc = await agent(PS(acceptPrompt(u)), {label: L('accept' + tag), phase: 'Build', schema: ACC, ...M('audit')})
    if (!acc) return {dead: 'accept' + tag, syn}
    const infra = acc.infra_error.trim()
    const got = new Map(acc.results.map(r => [r.id, r]))
    const bad = u.acceptance.filter(a => { const r = got.get(a.id); return !r || !expectOk(a.expect, r.out) }).map(a => ({id: a.id, cmd: a.cmd, expect: a.expect, out: got.has(a.id) ? String(got.get(a.id).out).slice(0, 400) : 'not reported'}))
    const restoreBad = touchesIndex(u) ? [syn.restore.undeclared.length ? 'undeclared lines outside the block: ' + syn.restore.undeclared.slice(0, 3).join(' | ') : '',
      syn.restore.sha_restore !== pre.restore.sha_restore ? 'restore sha changed (' + syn.restore.sha_restore + ' != ' + pre.restore.sha_restore + '): a line outside the block moved' : ''].filter(Boolean) : []
    return {syn, acc, infra, bad, restoreBad, ok: syn.ok === true && !restoreBad.length && !infra && u.acceptance.length > 0 && !bad.length}
  }
  let st = await check(0), attempts = 0
  while (!st.dead && !st.infra && !st.ok && attempts < 2) {
    attempts++
    const fx = await agent(PS(fixPrompt(u, st, attempts)), {label: L('fix ' + attempts), phase: 'Build', schema: IMPL, ...M(role)})
    if (!fx) { st = {...st, dead: 'fix ' + attempts}; break }
    note(fx)
    if (outside().length) return strayFail(attempts, st.acc)
    st = await check(attempts)
  }
  const restore = st.syn ? st.syn.restore : null
  if (st.dead) return recordUnit(u, {status: 'infra', last_failure: 'agent died: ' + st.dead, shas, attempts, acc: st.acc, restore})
  if (st.infra) return recordUnit(u, {status: 'infra', last_failure: 'infra: ' + st.infra, shas, attempts, acc: st.acc, restore})
  if (!st.ok) {
    const why = st.syn.errors.slice(0, 3).concat(st.restoreBad, st.bad.slice(0, 3).map(b => b.id + ': ' + b.cmd + ' -> ' + b.out.slice(0, 120) + ' (expect ' + b.expect + ')'))
    return recordUnit(u, {status: 'failed', last_failure: why.join(' | ') || 'acceptance incomplete', shas, attempts, acc: st.acc, restore})
  }
  let det = null
  if (touchesIndex(u)) {
    if (MODE === 'smoke') log(`${u.id}: determinism skipped in smoke (dry run, nothing edited)`)
    else {
      det = await agent(PS(detPrompt(u)), {label: L('determinism'), phase: 'Build', schema: DETU, ...M('mech')})
      if (!det) return recordUnit(u, {status: 'infra', last_failure: 'agent died: determinism', shas, attempts, acc: st.acc, restore})
      if (infraOf(det)) return recordUnit(u, {status: 'infra', last_failure: 'infra: ' + det.infra_error.trim(), shas, attempts, acc: st.acc, restore, det})
      const badSeeds = SEEDS.filter(s => { const f = obj(det.fps[s]); return !(HEX(f.never) && f.never === f.off && f.off === f.on) })
      if (badSeeds.length) return recordUnit(u, {status: 'failed', last_failure: 'determinism: never/off/on fingerprints differ for ' + badSeeds.map(s => s + ' ' + J(det.fps[s] || null)).join('; '), shas, attempts, acc: st.acc, restore, det})
    }
  }
  return recordUnit(u, {status: 'done', last_failure: '', shas, attempts, acc: st.acc, restore, det})
}

const tails = {}, runById = {}
function withFiles(keys, fn) {   // one lock per key; every unit naming index.html shares the key 'index.html', so those run strictly one at a time
  const files = [...new Set(keys)].sort()
  const run = Promise.all(files.map(f => tails[f] || Promise.resolve())).then(fn)
  const settled = run.then(() => null, () => null); files.forEach(f => { tails[f] = settled })
  return run
}
const doneNow = new Set(doneSet)
const results = {}, builtOk = [], failedIds = [], infraIds = [], changedFiles = new Set()
let lastRestore = pre.restore, toolShaNow = pre.tool_sha
async function runBatch(units) {   // submission (and lock) order = topological order
  const ids = new Set(units.map(u => u.id))
  for (const u of units) {
    const miss = u.deps.filter(d => !doneNow.has(d) && !ids.has(d) && !runById[d])
    if (miss.length) die(`scheduler: ${u.id} depends on ${miss.join(', ')}, which is neither done nor scheduled`)
  }
  for (const u of units) {
    runById[u.id] = withFiles(lockKeys(u), async () => {
      const deps = await Promise.all(u.deps.filter(d => runById[d]).map(d => runById[d].catch(() => null)))
      if (deps.some(d => !d || !d.ok)) return {id: u.id, ok: false, status: 'blocked-by-dep'}
      return buildUnit(u)
    })
  }
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
    if (r.restore) lastRestore = r.restore
    for (const f of arr(r.shas)) { changedFiles.add(f.path); if (f.path === 'tools/street-probe.js' && HEX(f.sha256)) toolShaNow = f.sha256 }
  }
  return built
}

phase('Build')
if (batch.length) await runBatch(batch)
else log(GATE === 'only' ? 'gate "only": no build' : 'no ready unit in slice ' + SL)

// ---- Smoke / Slice gate ----
const smokePrompt = dir => `Runtime smoke, no judging; write nothing in the repo (outputs under ${dir}/ and a mktemp -d dir). ${SANDBOX_ST}
1. For each seed of ${J(SEEDS)}, once without a street layer flag (off) and once with --layers street=1 (on): node ${PROBE} --fingerprint --seed <seed> --days 400 --cdn-dir <tmp>${PORT_FLAG} --out ${dir}/smoke-<seed>-<off|on>.json (it loads /?v=${V_BUST}#s=<seed>, with &street=1 when on, waits for window.ANNALS.ready and runs ANNALS.simDays(400)); console_errors = every console or page error those runs report, each prefixed "<seed> <off|on>: ".
2. Let ${BLOCK_RULE}. clock_hits = lines of BLOCK matching grep -E '${ST_CLOCK_GREP}'; rng_hits = lines of BLOCK matching grep -E 'W[.]rng'; nowms_hits = lines of BLOCK matching grep -E 'nowMs'.
Return {console_errors, infra_error ("" when setup worked), clock_hits, rng_hits, nowms_hits}.`
async function runSmoke(tag) {
  phase('Smoke')
  return crit(PS(smokePrompt(`${OUTABS}/shots/run-${DATE}${sfx(tag)}`)), {label: 'smoke' + tag, phase: 'Smoke', schema: SMOKE, ...M('audit')})
}
const smokeHits = sm => !!sm && (sm.clock_hits > 0 || sm.rng_hits > 0 || sm.nowms_hits > 0)
const checksFor = sl => (sl === 'S4' ? SLICES : [sl]).flatMap(s => arr(SPEC.checks[s]).map(c => ({id: s + ':' + c.id, cmd: String(c.cmd), expect: String(c.expect)})))   // ids are slice-qualified: the same id in two slices stays two results
const gdetPrompt = `Gate determinism, no judging; write nothing in the repo (outputs in a mktemp -d dir). You run alone: nothing else touches the sim meanwhile. ${SANDBOX_ST}
For each seed of ${J(SEEDS)} run from ${REPO} (each with --cdn-dir <tmp>${PORT_FLAG} and its own --out): never = node ${PROBE} --fingerprint --seed <seed> --days 400; off = the same with --layers street=0; on = the same with --layers street=1; walk_on = node ${PROBE} --fingerprint --seed <seed> --days 400 --walk ${VIEWS_JSON} --layers street=1; walk_off = the same with --layers street=0.
Return {fps: {<seed>: {never, off, on, walk_on, walk_off}} (each the printed fingerprint.sha256; "" when absent), infra_error ("" or the setup failure)}.`
const capturePrompt = (sl, dir) => `Slice ${sl} gate capture; measure, never judge. ${SANDBOX_ST}
From ${REPO} run: node tools/street-probe.js ${CAPTURE_FLAGS(sl)} --cdn-dir <tmp>${PORT_FLAG} --out ${dir}/metrics.json --shots ${dir}/ (create ${dir}/; images at most 300 KB each).
Return {metrics_path: "${dir}/metrics.json", metrics_sha256 (sha256sum of that file), shots_dir: "${dir}/", infra_error ("" when the capture ran, else the setup failure: port, browser or CDN)}.`
const readerPrompt = mpath => `Metrics reader, no judging; write nothing (a node script in a mktemp -d dir). Read ${mpath} (the street probe's output) and return sha256 = sha256sum of that file, plus this digest of it. A field the file lacks gets its empty value (null for a number, [] for a list, {} for a map, false for a flag, "" for a string); never invent, estimate or round:
- views: {<SVn>: {off: the street=0 metrics {calls, tris, geoms, textures, objects}, on: the street=1 metrics (the same keys plus every per-frame or resident figure it records for that view: quads_per_frame, built_tris_per_frame, resident_tris), classes_on: the per-class counts under street=1}};
- appear: {violations: one string per recorded appear violation, slowest_ms: the longest recorded ease in ms}; swaps: {<threshold>: {in, out}};
- oscillate_builds: {<class>: its builds on the oscillate path}; flyaway: {geoms_first, geoms_return, geoms_reseed, resident_max}; jobs_max and built_tris_max: the per-frame maxima over every path;
- vfps: {h30, h60}: the queue hashes at virtual t = 10 s under 30 and 60 virtual fps; spacing: {min_gap, dvis_over_dtrue} at SV4;
- hash_table: [{hash, ok, got}] verbatim; writer_roundtrip; stats_keys: the ANNALS.stats() key list in its order; inst_no_color: InstancedMeshes rendered without instanceColor;
- clouds: {same_day_equal, next_day_differs, deck_matches_weather}; shadows_row: {held_text, disabled, off_kills_shadow, default_on_equal}; weather_dial: {exact, counts}; tidings: {barriers, musters, off_zero, atlas_equal (null when there is no atlas sample)}; fog: {present (the FILIGREE fog function exists), src_equal, pairs_equal (both null when absent)};
- device: from the newest ${DOCS}/device/*.json, {fps_min (the lowest per-second fps), degrade_max (the highest degrade step)}; null when no such file exists;
- console_errors: every console or page error the file records.
Return {sha256, views, appear, swaps, oscillate_builds, flyaway, jobs_max, built_tris_max, vfps, spacing, hash_table, writer_roundtrip, stats_keys, inst_no_color, clouds, shadows_row, weather_dial, tidings, fog, device, console_errors}.`
const staticPrompt = `Static checks, no judging; write nothing (throwaway node scripts in a mktemp -d dir). Let ${BLOCK_RULE}.
1. clock_hits = lines of BLOCK matching grep -E '${ST_CLOCK_GREP}'; rng_hits = lines of BLOCK matching grep -E 'W[.]rng'; nowms_hits = lines of BLOCK matching grep -E 'nowMs'.
2. inst_n = the occurrences of "new THREE.InstancedMesh" in BLOCK; inst_color_n = how many of those meshes the block colours through .setColorAt( or .instanceColor (each mesh counted at most once).
3. restore: ${RESTORE_TASK('gate')}
4. fil_anchors: ${FIL_ANCHOR_TASK}
5. street_in_block: {"<literal>": its number of occurrences inside BLOCK} for each literal of ${J(ST_FLAG1)}.
6. ${KEYDOWN_RULE}
7. near_line: ${REPO}/index.html contains the literal "${NEAR_LINE}".
8. ${TREE_RULE}
Return {clock_hits, rng_hits, nowms_hits, inst_n, inst_color_n, restore, fil_anchors, street_in_block, keydown_sha, near_line, tree_digest}.`
const checksPrompt = sl => `Spec checks for slice ${sl}; run and report, never judge (the script scores every check); write nothing in the repo (outputs in a mktemp -d dir). Run each cmd below from ${REPO} exactly as written; a cmd that runs node tools/street-probe.js without --cdn-dir gets --cdn-dir <tmp>${PORT_FLAG} appended (${SANDBOX_ST}). out = its stdout, trimmed, at most 2000 characters (a failing command gives its last stderr line).
Checks: ${J(checksFor(sl).map(c => ({id: c.id, cmd: c.cmd})))}
Return {results: [{id, cmd, out}] one per check in the given order, infra_error ("" or the setup failure)}.`

const dead = l => 'agent died: ' + l
function sliceCriteria(sl, g) {   // design §8; every pass argument is script arithmetic over readers, recounts and digests
  const {sm, gd, d, st, ck} = g
  const cg = [], cs = []
  const D = d || {}, V = obj(D.views), ST = st || null, SPC = SPEC
  const sls = sl === 'S4' ? SLICES : [sl]
  {
    const ids = sls.flatMap(s => unitIdsOf(s)), notDone = ids.filter(id => !doneNow.has(id))
    cs.push(C('GS.1', 'every unit of the slice (S4: of every slice) done under the current spec sha and recorded', notDone.length ? {not_done: notDone, of: ids.length} : ids.length + '/' + ids.length, 'n/n', ids.length > 0 && !notDone.length))
  }
  {
    const rows = SEEDS.map(s => { const f = obj(gd && obj(gd.fps)[s]), r = obj(REF.fingerprint[s]); return {seed: s, never: f.never, off: f.off, on: f.on, walk_on: f.walk_on, walk_off: f.walk_off, ref_plain: r.plain, ref_walk: r.walk,
      ok: HEX(f.never) && f.never === f.off && f.off === f.on && f.on === r.plain && HEX(f.walk_on) && f.walk_on === f.walk_off && f.walk_off === r.walk} })
    cs.push(C('GS.2', 'fingerprints, both seeds: never === off === on === ref.plain and walk_on === walk_off === ref.walk', !gd ? dead('gate determinism') : infraOf(gd) ? 'infra: ' + gd.infra_error : rows, 'all equal', !!gd && !infraOf(gd) && rows.every(r => r.ok)))
  }
  {
    const vids = Object.keys(REF.views).sort()
    const bad = vids.filter(v => M5.some(k => { const x = obj(obj(V[v]).off)[k]; return !num(x) || x !== obj(REF.views[v])[k] }))
    cs.push(C('GS.3', 'off identity: per view, street=0 calls, tris, geoms, textures, objects equal the off reference (' + OFFREF_PATH.replace(OUTABS, OUT) + ')', !d ? dead('metrics reader') : {views: vids.length, differing: bad}, 'exact, 9/9', !!d && vids.length === 9 && !bad.length))
  }
  {
    const capV = Object.keys(SPC.caps).sort(), over = []
    for (const v of capV) {
      const on = obj(obj(V[v]).on)
      for (const [k, lim] of Object.entries(obj(SPC.caps[v]))) {
        if (!num(lim)) continue
        if (num(on[k])) { if (on[k] > lim) over.push(`${v}.${k} ${on[k]} > ${lim}`) } else if (['calls', 'tris', 'objects'].includes(k)) over.push(`${v}.${k} unmeasured`)
      }
    }
    const loud = ['SV5', 'SV9'].filter(v => { const x = obj(V[v]); return !M5.every(k => num(obj(x.on)[k]) && obj(x.on)[k] === obj(x.off)[k]) })
    cs.push(C('GS.4', 'caps: per view, street=1 each metric <= /caps/<SVn>/on; SV5 and SV9 on === off exactly (far quiet)', !d ? dead('metrics reader') : {views_capped: capV.length, over, far_not_quiet: loud}, 'all', !!d && capV.length > 0 && !over.length && !loud.length))
  }
  {
    const top = ST ? arr(ST.restore.block_top_level) : null
    cs.push(C('GS.5', 'static: clock 0, W.rng 0, nowMs 0 in the block; every InstancedMesh carries instanceColor; the block declares only STREET at top level',
      !ST ? dead('gate static') : {clock: ST.clock_hits, rng: ST.rng_hits, nowms: ST.nowms_hits, inst_n: ST.inst_n, inst_color_n: ST.inst_color_n, inst_no_color: d ? D.inst_no_color : null, block_top_level: top},
      'all', !!ST && !!d && ST.clock_hits === 0 && ST.rng_hits === 0 && ST.nowms_hits === 0 && ST.inst_n === ST.inst_color_n && D.inst_no_color === 0 && J(top) === '["STREET"]'))
  }
  if (sliceAtLeast(sl, SINCE.fade)) {
    const a = obj(D.appear), ms = SPC.stream.fade_ms
    cs.push(C('GS.6', 'fade: no class from <0.1 to >=0.9 opacity in one 1/60 s virtual step; slowest ease <= spec /fade/ms <= 250 (R6)', !d ? dead('metrics reader') : {violations: arr(a.violations).slice(0, 10), slowest_ms: a.slowest_ms ?? null, fade_ms: ms ?? null},
      'both', !!d && !arr(a.violations).length && num(a.slowest_ms) && num(ms) && a.slowest_ms <= ms && ms <= 250))
  }
  if (sliceAtLeast(sl, SINCE.swaps)) {
    const sw = Object.entries(obj(D.swaps)), bad = sw.filter(([, x]) => !(obj(x).in === 1 && obj(x).out === 1)).map(([k, x]) => k + ' ' + J(x))
    cs.push(C('GS.7', 'hysteresis: on the scripted sweep every threshold swaps exactly 1 in + 1 out', !d ? dead('metrics reader') : {thresholds: sw.length, bad}, 'all', !!d && sw.length > 0 && !bad.length))
  }
  {
    const was = Object.entries(obj(obj(pre.fil_anchors).literals)).filter(([, v]) => v).map(([k]) => k)
    const lostF = ST ? was.filter(k => !obj(ST.fil_anchors.literals)[k]) : was
    const inStreet = ST ? Object.entries(obj(ST.fil_anchors.in_street)).filter(([, n]) => n !== 0).map(([k, n]) => k + ' x' + n) : []
    const stIn = ST ? ST_FLAG1.filter(l => obj(ST.street_in_block)[l] !== 0).map(l => l + ' x' + obj(ST.street_in_block)[l]) : []
    cs.push(C('GS.8', 'coexistence: every filigree literal that resolved at preflight still resolves; none of them and no street flag-1 literal inside the block; maps-site/** and docs/filigree/** untouched (tree digest)',
      !ST ? dead('gate static') : {fil_lost: lostF, fil_in_block: inStreet, street_in_block: stIn, tree_digest: ST.tree_digest, tree_digest_pre: pre.tree_digest},
      'all', !!ST && !lostF.length && !inStreet.length && !stIn.length && HEX(pre.tree_digest) && ST.tree_digest === pre.tree_digest))
  }
  cs.push(C('GS.9', 'console clean: the capture digest and the smoke (both seeds, street on and off) report no console error',
    {capture: d ? arr(D.console_errors).slice(0, 10) : dead('metrics reader'), smoke: sm ? (infraOf(sm) ? 'infra: ' + sm.infra_error : sm.console_errors.slice(0, 10)) : dead('smoke')},
    '0', !!d && !!sm && !infraOf(sm) && !arr(D.console_errors).length && !sm.console_errors.length))
  {
    const empty = sls.filter(s => !arr(SPC.checks[s]).length)
    const want = checksFor(sl), got = new Map(arr(ck && ck.results).map(r => [r.id, r]))
    const bad = want.filter(c => { const r = got.get(c.id); return !r || String(r.cmd).trim() !== c.cmd.trim() || !expectOk(c.expect, r.out) }).map(c => c.id + ' = ' + (got.has(c.id) ? String(got.get(c.id).out).slice(0, 120) : 'missing') + ' (expect ' + c.expect + ')')
    const m10 = empty.length ? {spec_gap: 'no /checks for slice ' + empty.join(', ') + ' in street-spec.json (a Street 2 defect; no fix unit can add them)'}
      : !ck ? dead('gate checks') : infraOf(ck) ? 'infra: ' + ck.infra_error : {ok: want.length - bad.length, of: want.length, failing: bad}
    cs.push(C('GS.10', 'the slice\'s spec /checks pass by expectOk (S4: every slice\'s)', m10, 'all', !empty.length && !!ck && !infraOf(ck) && want.length > 0 && !bad.length))
  }
  cs.push(C('GS.X3', 'hooks: only declared hook lines changed outside the block (restore sha unchanged, undeclared = [])', !ST ? dead('gate static') : {sha_restore: ST.restore.sha_restore, sha_restore_pre: pre.restore.sha_restore, undeclared: ST.restore.undeclared.slice(0, 5)},
    'both', !!ST && ST.restore.sha_restore === pre.restore.sha_restore && !ST.restore.undeclared.length))
  cs.push(C('GS.X4', 'the keydown handler and the camera.near line unchanged', !ST ? dead('gate static') : {keydown_sha: ST.keydown_sha, ref_keydown_sha: REF.keydown_sha, near_line: ST.near_line},
    'both', !!ST && HEX(REF.keydown_sha) && ST.keydown_sha === REF.keydown_sha && ST.near_line === true))
  if (sliceAtLeast(sl, SINCE.hash_table) && doneNow.has('S0.U02')) {
    const rows = arr(D.hash_table), by = new Map(rows.map(r => [r.hash, r]))
    const missing = HASH_TABLE_MIN.filter(h => !by.has(h)), bad = rows.filter(r => r.ok !== true).map(r => r.hash + ' -> ' + r.got)
    cs.push(C('GS.X5', 'hash table parses (#notices=u&s=a reads seed a) and every #s= writer keeps street=1', !d ? dead('metrics reader') : {rows: rows.length, missing, bad, writer_roundtrip: D.writer_roundtrip},
      'all', !!d && !missing.length && !bad.length && D.writer_roundtrip === true))
  } else cg.push('GS.X5 not evaluated: S0.U02 (hash parser) is not done')
  cs.push(C('GS.X6', 'ANNALS.stats() keys unchanged', !d ? dead('metrics reader') : {stats_keys: arr(D.stats_keys)}, J(STATS_KEYS), !!d && J(arr(D.stats_keys)) === J(STATS_KEYS)))
  if (sliceAtLeast(sl, SINCE.paths)) {
    const ob = Object.entries(obj(D.oscillate_builds)), bad = ob.filter(([, n]) => !(Number.isInteger(n) && n <= 2)).map(([k, n]) => k + '=' + n)
    cs.push(C('GS.P5', 'oscillate (R 170<->230 and 2150<->2450, 600 frames): builds per class <= 2', !d ? dead('metrics reader') : {classes: ob.length, over: bad}, 'all', !!d && ob.length > 0 && !bad.length))
    const f = obj(D.flyaway), cap6 = SPC.stream.resident_tris
    cs.push(C('GS.P6', 'flyaway twice + reseed: geometry count returns; resident tris <= /stream/resident_tris', !d ? dead('metrics reader') : {...f, resident_cap: cap6 ?? null},
      'all', !!d && num(f.geoms_first) && f.geoms_return === f.geoms_first && f.geoms_reseed === f.geoms_first && num(f.resident_max) && num(cap6) && f.resident_max <= cap6))
  }
  if (sliceAtLeast(sl, SINCE.jobs)) {
    const mj = SPC.stream.max_jobs_frame, tc = SPC.stream.tri_cap_frame
    cs.push(C('GS.P7', 'per frame: quad jobs <= /stream/max_jobs_frame (<= 6, ST9) and built tris <= /stream/tri_cap_frame', !d ? dead('metrics reader') : {jobs_max: D.jobs_max ?? null, max_jobs_frame: mj ?? null, built_tris_max: D.built_tris_max ?? null, tri_cap_frame: tc ?? null},
      'both', !!d && num(D.jobs_max) && num(mj) && D.jobs_max <= mj && mj <= 6 && num(D.built_tris_max) && num(tc) && D.built_tris_max <= tc))
  }
  if (sliceAtLeast(sl, SINCE.vfps)) {
    const q = obj(D.vfps)
    cs.push(C('GS.L1', 'queue positions hash equal at virtual t = 10 s under 30 and 60 virtual fps', !d ? dead('metrics reader') : q, 'equal', !!d && !!q.h30 && q.h30 === q.h60))
  }
  if (sliceAtLeast(sl, SINCE.spacing)) {
    const sp = obj(D.spacing), s0 = SPC.traffic.s0
    cs.push(C('GS.L2', 'at SV4: caravan gap >= /traffic/s0 and drawn never ahead of true', !d ? dead('metrics reader') : {...sp, s0: s0 ?? null}, 'both', !!d && num(sp.min_gap) && num(s0) && sp.min_gap >= s0 && sp.dvis_over_dtrue === 0))
  }
  if (sliceAtLeast(sl, SINCE.fog)) {
    const f = obj(D.fog)
    if (d && f.present !== true) cg.push('GS.K1: the FILIGREE fog function is absent' + (SPC.fog_unit ? ' although the spec has S4.Ufog' : '') + '; recorded gap per ST11, nothing invented')
    cs.push(C('GS.K1', 'fog (ST11): the STREET copy of the FILIGREE fog function is byte-identical and equal on 50 fixed (place, day) pairs; a recorded gap when the atlas function is absent',
      !d ? dead('metrics reader') : {...f, fog_unit: SPC.fog_unit}, 'per ST11', !!d && (f.present !== true || (f.src_equal === true && f.pairs_equal === true))))
  }
  if (sliceAtLeast(sl, SINCE.clouds)) {
    const c = obj(D.clouds)
    cs.push(C('GS.K2', 'clouds: same day equal, next day differs, deck only in weather (SV3, SV8)', !d ? dead('metrics reader') : c, 'all', !!d && c.same_day_equal === true && c.next_day_differs === true && c.deck_matches_weather === true))
  }
  if (sliceAtLeast(sl, SINCE.shadows_row)) {
    const s = obj(D.shadows_row)
    cs.push(C('GS.K3', 'shadows row: "held off for speed" and disabled under pinDegrade(3); off kills the shadow pass at SV1; the default equals today\'s castShadow', !d ? dead('metrics reader') : s,
      'all', !!d && s.held_text === true && s.disabled === true && s.off_kills_shadow === true && s.default_on_equal === true))
  }
  if (sliceAtLeast(sl, SINCE.weather_dial)) {
    const w = obj(D.weather_dial)
    cs.push(C('GS.K4', 'weather dial: drawn precipitation count = round(base x step) at each of the four steps', !d ? dead('metrics reader') : w, 'true', !!d && w.exact === true && arr(w.counts).length === 4))
  }
  if (sliceAtLeast(sl, SINCE.tidings)) {
    const t = obj(D.tidings), fx = obj(pre.tidings)
    if (d && t.atlas_equal == null) cg.push('GS.K5: no atlas tidings sample to compare with (atlas_equal null): recorded gap')
    cs.push(C('GS.K5', 'tidings: with notices=<fixtures/tidings.json> barriers = its shut ways and muster lights = its muster days at Epēshu; none without notices; equal to the atlas when its sample exists',
      !d ? dead('metrics reader') : {...t, fixture: fx}, 'all', !!d && fx.exists === true && t.barriers === fx.shut_ways && t.musters === fx.musters && t.off_zero === true && t.atlas_equal !== false))
  }
  {
    const dv = d ? D.device : null
    if (!dv) cg.push('GS.R: no device run under docs/street/device/ (owner-run, ST8; the default flip needs one)')
    else if (!(num(dv.fps_min) && dv.fps_min >= 42 && dv.degrade_max === 0)) cg.push('GS.R: the recorded device run misses fps >= 42 / degrade 0 (' + J(dv) + ')')
    cs.push(C('GS.R', 'device run (ST8, owner-run): recorded when present (fps_min >= 42, degrade_max 0); absent is a gap, never a failure here', dv ? {...dv, meets: num(dv.fps_min) && dv.fps_min >= 42 && dv.degrade_max === 0} : 'absent (gap)', 'recorded', true))
  }
  return {criteria: cs, gaps: cg}
}

async function gateCycle(tag) {
  const sm = await runSmoke(tag)
  phase('Slice gate')
  const dir = `${OUTABS}/shots/gate-${SL}-${DATE}${sfx(tag)}`
  const gd = await crit(PS(gdetPrompt), {label: 'gate determinism' + tag, phase: 'Slice gate', schema: GDET, ...M('mech')})   // alone and first: the other probes must not share the machine with it
  const [cd, st, ck] = await parallel([
    async () => {
      const cp = await crit(PS(capturePrompt(SL, dir)), {label: 'gate capture' + tag, phase: 'Slice gate', schema: CAPT, ...M('audit')})
      if (!cp || infraOf(cp) || !HEX(cp.metrics_sha256)) return {cp, d: null}
      const mpath = absP(cp.metrics_path)
      let d = await agent(PS(readerPrompt(mpath)), {label: 'metrics reader' + tag, phase: 'Slice gate', schema: DIGEST, ...M('mech')})
      if (!d || d.sha256 !== cp.metrics_sha256) {
        log('metrics reader' + tag + ': ' + (d ? 'sha ' + d.sha256 + ' != capture ' + cp.metrics_sha256 : 'died') + '; one retry')
        d = await agent(PS(readerPrompt(mpath)), {label: 'metrics reader (retry)' + tag, phase: 'Slice gate', schema: DIGEST, ...M('mech')})
        if (d && d.sha256 !== cp.metrics_sha256) { log('metrics reader' + tag + ': sha still differs; the digest is discarded'); d = null }
      }
      return {cp, d}
    },
    () => agent(PS(staticPrompt), {label: 'gate static' + tag, phase: 'Slice gate', schema: STATIC, ...M('mech')}),
    () => agent(PS(checksPrompt(SL)), {label: 'gate checks' + tag, phase: 'Slice gate', schema: CHK, ...M('audit')})])
  const cp = cd ? cd.cp : null, d = cd ? cd.d : null
  const {criteria, gaps: cgaps} = sliceCriteria(SL, {sm, gd, d, st: st || null, ck: ck || null})
  const died = [sm ? null : 'smoke' + tag, gd ? null : 'gate determinism' + tag, cp ? null : 'gate capture' + tag, cp && !infraOf(cp) && !d ? (HEX(cp.metrics_sha256) ? 'metrics reader' : 'gate capture (no metrics sha256)') + tag : null,
    st ? null : 'gate static' + tag, ck ? null : 'gate checks' + tag].filter(Boolean)
  const infra = [sm, gd, cp, ck].filter(infraOf).map(x => x.infra_error.trim())
  if (st && st.restore) lastRestore = st.restore
  return {tag, sm, gd, cp, d, st, ck, criteria, cgaps, scoredPass: criteria.every(c => c.pass), died, infra, dir: dir.replace(OUTABS, OUT) + '/'}
}

const sliceComplete = () => unitIdsOf(SL).every(id => doneNow.has(id))
let cyc = null, smokeOnly = null, rounds = 0, diagDied = null
const shotDirs = []
if (GATE !== 'skip' && (GATE === 'only' || sliceComplete())) { cyc = await gateCycle(''); shotDirs.push(`${OUT}/shots/run-${DATE}/`, cyc.dir) }
else {
  log(GATE === 'skip' ? 'gate "skip": slice gate not run' : `slice ${SL} gate not due: ${unitIdsOf(SL).filter(id => !doneNow.has(id)).join(', ')} not done`)
  if (builtOk.length || failedIds.length) { smokeOnly = await runSmoke(''); shotDirs.push(`${OUT}/shots/run-${DATE}/`) }
}

// ---- Fix units ----
const specGapC = c => !!c.measured && typeof c.measured === 'object' && typeof c.measured.spec_gap === 'string'
const fixable = c => !c.pass && c.id !== 'GS.1' && c.id !== 'GS.R' && !specGapC(c)   // units not done and spec gaps are no street defect
const streetFail = x => !!x && !x.infra.length && !x.died.length && x.criteria.some(fixable)
while (cyc && rounds < ROUNDS && streetFail(cyc)) {
  const failed = cyc.criteria.filter(fixable)
  const failedIdsC = failed.map(c => c.id).filter(id => !seenCrit.has(SL + '|' + id))
  for (const c of failed.filter(c => seenCrit.has(SL + '|' + c.id))) gaps.push(`${c.id} still fails after its fix unit; no new fix unit (dedup ${SL}|${c.id})`)
  if (!failedIdsC.length) { log('fix rounds end: every failing criterion already has a fix unit'); break }
  if (lowBudget()) { log('budget: round skipped (fewer than ' + ROUND_TOKENS + ' tokens left); the gate fails on its own criteria'); break }
  rounds++
  const tag = ' r' + rounds
  phase('Fix units')
  let n0 = 1
  for (const id of usedIds) { const m = new RegExp('^fix-' + SL + '(\\d+)$').exec(id); if (m) n0 = Math.max(n0, Number(m[1]) + 1) }
  const offered = Array.from({length: FIX_PER_ROUND}, (_, i) => `fix-${SL}${n0 + i}`)
  const dg = await agent(PS(`You are the Street 3 build diagnoser for slice ${SL} (${SLICE_NAME[SL]}), fix round ${rounds}. The slice gate failed on these criteria, scored in code:
${J2(failed)}
Metrics digest (from ${cyc.dir}metrics.json): ${J(cyc.d)}
Restore report: ${J(cyc.st ? cyc.st.restore : null)}
Units: /units of ${SPEC_JSON} and the ledger ${LEDGER_DIR}/*.json; rules: ${SPEC_MD}; /hook_lines of ${SPEC_JSON} are the only lines a unit may change outside the STREET block.
Diagnose street defects only (never the probe's measurement, the checks or the off reference) and write NEW fix units, at most ${FIX_PER_ROUND}, using these ids in this order: ${J(offered)}. Write each to ${LEDGER_DIR}/<id>.json (2-space indent, trailing newline; never overwrite an existing file; write no other file) as {id, slice: "${SL}", title, kind (logic | tool | doc), files, deps, covers, hooks, acceptance: [{id, kind (node | grep | json | probe), cmd, expect}], failed_criterion, model?, effort?, status: "proposed", date: "${DATE}"}:
- files: repo-relative paths matching ${UNIT_FILES_OK} and never ${UNIT_FILES_BAD};
- hooks: a subset of the /hook_lines "line" literals of ${SPEC_JSON} (only with index.html in files);
- deps: ids already done or among your new units (no cycles);
- acceptance: mechanical only, a command plus its expected output as an exact string, "re:<regex>", "==N", "<=N", ">=N" or "json:<value>" (the script scores them in code);
- failed_criterion: one of ${J(failedIdsC)}; at most one unit per criterion.
Every unit obeys the build's hard rules: one /* STREET */ block, declared hook lines only, randomness only from ${KEY_IDIOM}, no clock, no W writes, instanceColor, default off, stats keys unchanged. ${VOCAB_ST_RULE}
Re-read each file you wrote and JSON.parse it. Return {units: [every unit you wrote], ledger_written: [the absolute path of each file you wrote that parses]}.`), {label: 'diagnoser' + tag, phase: 'Fix units', schema: DIAG, ...M('judge')})
  if (!dg) { diagDied = 'diagnoser' + tag; break }
  const written = new Set(arr(dg.ledger_written).map(absP))
  const fresh = [], critHere = new Set()
  for (const x of dg.units.map(unitOf)) {
    const why = !offered.includes(x.id) ? 'id ' + x.id + ' was not offered' : usedIds.has(x.id) || fresh.some(y => y.id === x.id) ? 'id already used' : x.slice !== SL ? 'slice ' + x.slice
      : !written.has(LEDGER_DIR + '/' + x.id + '.json') ? 'no read-back of its ledger file' : !failedIdsC.includes(x.failed_criterion) ? 'failed_criterion ' + x.failed_criterion + ' is not an open failing criterion'
        : critHere.has(x.failed_criterion) ? 'a second unit for ' + x.failed_criterion : unitWhy(x)
    usedIds.add(x.id)
    if (why) { log(`fix unit ${x.id} rejected (stays "proposed", ignored by later runs): ${why}`); continue }
    critHere.add(x.failed_criterion)
    fresh.push(x)
  }
  for (const p of written) { const id = String(p).split('/').pop().replace(/\.json$/, ''); usedIds.add(id) }
  const k = kahn(fresh)
  if (k.cyclic.length) { log('diagnoser units form a cycle: ' + k.cyclic.join(', ') + '; all rejected'); fresh.length = 0 }
  for (const x of fresh) { seenCrit.add(SL + '|' + x.failed_criterion); ALL_BY_ID.set(x.id, x); newFixIds.push(x.id) }
  if (!fresh.length) { log('no new fix unit this round'); break }
  const fixPool = GATE === 'only' ? [] : closeOver(kahn(fresh).order, id => doneNow.has(id), deferred)
  const fixBatch = cap(kahn(fixPool).order).slice(0, FIX_PER_ROUND)
  const waiting = fresh.filter(x => !fixBatch.includes(x))
  if (waiting.length) {   // accepted but not built this run: the ledger must read "pending", never "proposed"
    phase('Build')
    const pend = await parallel(waiting.map(x => () => recordUnit(x, {status: 'pending', last_failure: GATE === 'only' ? 'written by the diagnoser under gate "only"' : 'not ready this round'})))
    pend.forEach((r, i) => { if (!r || !r.recorded) gaps.push(`fix unit ${waiting[i].id} could not be recorded as pending; it stays "proposed" in ${LEDGER_DIR}`) })
  }
  if (!fixBatch.length) { log(GATE === 'only' ? 'gate "only": fix units ' + fresh.map(x => x.id).join(', ') + ' are recorded pending for the next run' : 'no fix unit is ready this round'); break }
  phase('Build')
  await runBatch(fixBatch)
  if (!fixBatch.every(u => doneNow.has(u.id)) || !sliceComplete()) { log('fix units incomplete: the slice gate is not re-run'); break }
  cyc = await gateCycle(tag)
  shotDirs.push(`${OUT}/shots/run-${DATE}${sfx(tag)}/`, cyc.dir)
}

// ---- Record ----
phase('Record')
const prune = await agent(PS(`Prune old capture directories under ${OUTABS}/shots/ (git-ignored bulk). List the directories directly under it whose names match run-* or gate-*; each name carries a date YYYY-MM-DD. Keep every directory whose date is one of the two newest dates present (this run is ${DATE}); delete the others (rm -rf on exactly those directories, nothing else). Then list again: count_ok = the remaining directories carry at most two distinct dates and none of the deleted ones exists. Return {kept: [names], deleted: [names], count_ok}.`),
  {label: 'shots pruner', phase: 'Record', schema: PRUNE, ...M('mech')})
if (!prune || !prune.count_ok) { log('shots pruner: ' + (prune ? 'count check failed' : 'agent died')); gaps.push('shots/ not pruned to the last two runs') }
const stuckNew = Object.values(results).filter(r => r.runs_failed >= 3 && ((LEDGER.get(r.id) || {}).runs_failed || 0) < 3).map(r => ({id: r.id, title: r.title, last_failure: r.last_failure}))
const stuckNow = [...new Map(stuck.concat(stuckNew).map(x => [x.id, x])).values()]
const perSlice = Object.fromEntries(SLICES.map(s => { const ids = unitIdsOf(s); return [s, {done: ids.filter(id => doneNow.has(id)).length, total: ids.length}] }))
const nDone = perSlice[SL].done, nTotal = perSlice[SL].total
if (cyc) for (const g of cyc.cgaps) gaps.push(g)
const runState = {job: JOB, date: DATE, mode: MODE, slice: SL, spec_sha256: SPEC_SHA, per_slice: perSlice, built: builtOk.map(u => u.id), failed: failedIds, deferred, stuck: stuckNow.map(x => x.id), infra: infraIds,
  new_fix_units: newFixIds, rounds, gate_ran: !!cyc, rebaselined: !keep, off_ref: OFFREF_PATH.replace(OUTABS, OUT),
  smoke: smokeOnly ? {console_errors: smokeOnly.console_errors.length, clock_hits: smokeOnly.clock_hits, rng_hits: smokeOnly.rng_hits, nowms_hits: smokeOnly.nowms_hits, infra_error: smokeOnly.infra_error} : null, gaps}
const indexRef = {date: DATE, sha_restore: lastRestore.sha_restore, tool_sha: toolShaNow, off_ref: OFFREF_PATH.replace(OUTABS, OUT)}
let gate = null, finalGate = null
if (cyc) {
  for (const c of cyc.criteria.filter(c => !c.pass)) gaps.push(specGapC(c) ? `${c.id}: ${c.measured.spec_gap}` : `${c.id} failed`)
  const artifacts = [{path: OUT + '/street-spec.json', sha256: SPEC_SHA}, {path: OFFREF_PATH.replace(OUTABS, OUT), sha256: ''}].concat(cyc.cp && HEX(cyc.cp.metrics_sha256) ? [{path: cyc.dir + 'metrics.json', sha256: cyc.cp.metrics_sha256}] : [])
  gate = gateObj({criteria: cyc.criteria, rounds, artifacts, rulings_used: RUSED, street_rulings_used: STR.used, gaps, slice: SL, spec_sha256: SPEC_SHA})
  if (SL === 'S4' && gate.pass) finalGate = gateObj({criteria: cyc.criteria, rounds, artifacts, rulings_used: RUSED, street_rulings_used: STR.used, gaps, slice: 'S4', final: true, spec_sha256: SPEC_SHA})
}
const recs = await parallel([() => record('state/3-build.json', runState, 'record state'), () => record('state/3-build/index-ref.json', indexRef, 'record index ref')].concat(
  gate ? [() => record(`gates/3-build-${SL}.json`, gate, 'record slice gate')] : [],
  finalGate ? [() => record('gates/3-build.json', finalGate, 'record final gate')] : []))
const recMismatch = recs.some(x => !x)

const finalPass = !!finalGate && !recMismatch
const unitInfra = infraIds.length > 0 || infraOf(smokeOnly)
const diedAll = (cyc ? cyc.died : []).concat(diagDied ? [diagDied] : [], !cyc && (builtOk.length || failedIds.length) && !smokeOnly ? ['smoke'] : [])
const smokeBad = !!smokeOnly && (smokeOnly.console_errors.length > 0 || smokeHits(smokeOnly))
const reason = (unitInfra || (cyc && cyc.infra.length)) ? 'infra'
  : diedAll.length ? 'agent died: ' + diedAll[0]
    : recMismatch ? 'record-mismatch'
      : cyc && !cyc.scoredPass ? 'gate-fail'
        : smokeBad ? 'smoke-fail'
          : failedIds.length || stuckNow.length ? 'units-failed'
            : MODE === 'full' ? '' : MODE
const gateStatus = !cyc ? (GATE === 'skip' ? 'skipped' : 'not due') : cyc.infra.length ? 'infra' : cyc.scoredPass ? (gate.pass ? 'pass' : 'pass (scored; ' + (FORCE ? 'forced' : MODE) + ')')
  : 'fail (' + cyc.criteria.filter(c => !c.pass).map(c => c.id).join(', ') + ')'
const builtIds = builtOk.map(u => u.id).join(', ') || 'none built'
const titles = builtOk.map(u => u.title || u.id).join('; ') || 'slice gate run'
const outputs = [...changedFiles].sort().concat([OUT + '/state/3-build/', OUT + '/state/3-build.json', OUT + '/state/3-build/index-ref.json'], keep ? [] : [OUT + '/state/3-build/off-ref.json'],
  gate ? [OUT + `/gates/3-build-${SL}.json`] : [], finalGate ? [OUT + '/gates/3-build.json'] : [], MODE === 'smoke' ? [OUT + '/dry/'] : [], [...new Set(shotDirs)])
return done({
  pass: finalPass, reason, slice: SL, check_off: SL === 'S4' && finalPass, rounds, outputs,
  gate_path: gate ? OUT + '/gates/3-build-' + SL + '.json' : null, owner_rulings_used: RUSED, street_rulings_used: STR.used, gate, final_gate: finalGate, state: runState, held_by: [], blocked_by: [],
  polish_note: `Street 3 slice ${SL}: ${nDone}/${nTotal} units (${builtIds}); ${deferred.length} deferred; gate ${gateStatus}` + (failedIds.length ? `; failed ${failedIds.join(', ')}` : '') + (stuckNow.length ? `; stuck ${stuckNow.map(x => x.id).join(', ')}` : '') +
    (smokeBad ? `; smoke FAILED (${smokeOnly.console_errors.length} console errors, ${smokeOnly.clock_hits + smokeOnly.rng_hits + smokeOnly.nowms_hits} clock/rng/nowMs hits in the STREET block)` : '') + (keep ? '' : '; rebaselined (' + rebaseWhy.join('; ') + ')'),
  polish_inserts: stuckNew.map(x => `- [ ] **Street 3 stuck unit ${x.id} — ${x.title || x.id}** — ${x.last_failure || 'failed 3 runs'}; fix by hand, then re-run with args.unstick ["${x.id}"]; an obsolete fix unit is dropped with args.discard ["${x.id}"]`),
  polish_inserts_above: 'Street 3',
  changelog_line: `- Street 3 slice ${SL} (${SLICE_NAME[SL]}): ${titles} — behind the street toggle`
})
