export const meta = {
  name: 'street-4-review',
  description: 'Street 4: review the finished street view against the bible and the spec through single-lens finders; gate = bare-street test + no surviving blocker/major',
  whenToUse: 'Run as the POLISH item "Street 4 · Review → punch list" after docs/street/gates/3-build.json passed: Workflow({name:"street-4-review", args:{date:"YYYY-MM-DD"}}). Docs-only; its punch items go directly above the Street 4 entry.',
  phases: [
    {title: 'Preflight', detail: 'drift, anchors, chain (Street 3 final gate), cycle, prior punch ids, frozen views and caps'},
    {title: 'Capture', detail: 'one probe run (all views on/off, paths, phone, fingerprints, shots), two single-layer still runs for the blind pairs + digest-checked metrics reader'},
    {title: 'Find', detail: 'eleven single-lens finders, <=2 findings each in round 0, <=1 later'},
    {title: 'Verify', detail: 'dedup -> reproduce -> refute -> severity per fresh finding; <=2 extra rounds'},
    {title: 'Bare-street gate', detail: '3 blind judges x 4 views (opus/sonnet/opus, fixed A/B order); omissions confirmed in code from probe class counts'},
    {title: 'Punch list', detail: 'opus/xhigh integrator -> punch-list.md/.json and the inserts'},
    {title: 'Record', detail: 'findings, gates/4-review-c<k>.json, state/4-review.json; cited shots only'}
  ]
}
const JOB = 'street-4-review'
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
checkArgs(['streetRulings', 'port', 'preview', 'cycle'])
if (A.preview !== undefined && typeof A.preview !== 'boolean') die('preview must be a boolean')
const PREVIEW = A.preview === true
if (A.cycle !== undefined && !(Number.isInteger(A.cycle) && A.cycle >= 1)) die('args.cycle must be an integer in 1..2')
if (A.cycle !== undefined && A.cycle > 2) die('a third review cycle is refused (ST13): the owner decides (args.cycle must be in 1..2)')
const RV = PREVIEW ? OUTABS + '/preview' : OUTABS
const RVREL = PREVIEW ? OUT + '/preview' : OUT
const PVREL = PREVIEW ? 'preview/' : ''   // record()/recordD() paths are relative to OUTABS

// ---- constants (design §3, literal) ----
const JUDGE_VIEWS = ['SV1', 'SV2', 'SV4', 'SV7']
const JUDGES = [{id: 'J0', role: 'judge'}, {id: 'J1', role: 'deep'}, {id: 'J2', role: 'judge'}]   // opus/high, sonnet/high, opus/high
const layeredIsA = (vi, j) => (vi % 2 === 0) !== (j === 'J0')   // J0 sees the opposite order to J1 and J2; parity by view index
const PHONE = ['SV1', 'SV2']   // 390x844
const FIND_CAP0 = 2, FIND_CAP = 1, EXTRA_ROUNDS = 2, VERIFY_BOUND = 200, VERIFY_CONC = 6, ROUND_TOKENS = 1500000   // ROUND_TOKENS: one extra round's budget floor
const LENSES = [
  {id: 'L01', role: 'deep', check: 'Determinism', lens: 'fingerprints (never/off/on/walk), STREET-block greps, every keyed-hash key equals the spec form, no W field written'},
  {id: 'L02', role: 'audit', check: 'Performance and caps', lens: 'caps per view, quads and tris built per frame, resident tris, the shadow pass with instanced casters, far quiet at SV5/SV9'},
  {id: 'L03', role: 'audit', check: 'Pop and fade (R6)', lens: 'appear samples on the descent, hysteresis swaps on the sweep, oscillate builds'},
  {id: 'L04', role: 'judge', check: 'Caravan sense', lens: 'queues at fords, one-lane bridges and toll halts read as bronze-age traffic; no overlap; render-only; gate leaves shut only in the drawn dark hour (ST5)'},
  {id: 'L05', role: 'audit', check: 'Canon and voice', lens: 'VOCAB_ST over new strings, R10 and ST16 words, the Patrinaic words (q12) used correctly, "cog" not spread, the nine Kembar, years A.B.'},
  {id: 'L06', role: 'deep', check: 'The Marble City', lens: 'does SV1/SV6/SV8 read as Epēshu: marble-pale stone tier (ST12), the Blue Temple of Thobrauk on Wood Quay, no invented district layout'},
  {id: 'L07', role: 'audit', check: 'Weather and sky', lens: 'cloud deck keyed to W.weather and the day, the R13 fog copy (or its recorded gap), the weather dial exact, no fog sim state'},
  {id: 'L08', role: 'audit', check: 'Layers and hash', lens: 'rows default off, street=1 composes with s= and goto=, the ST18 hash table, the shadows row at degrade 3, no new keys'},
  {id: 'L09', role: 'audit', check: 'Phone', lens: '390x844 at SV1/SV2: rows reachable, touch targets >= 44 px, no horizontal scroll, caps met, reduced motion honoured'},
  {id: 'L10', role: 'judge', check: 'Where the build flinched', lens: 'tiers that stop early, SV7 (procedural) missing near detail, a bible class absent at its view, a spec rule with no visible effect'},
  {id: 'L11', role: 'judge', check: 'Owner-input fidelity', lens: 'the owner\'s toggles exist and work (clouds, shadows, roads and folk), the weather density dial, session overlays (the herald\'s tidings from fixtures/tidings.json), "detail emerges naturally" (far views quiet, detail arrives on the descent), and the VTT export and party presence stated out of scope (ST10) in the bible and README §9 rather than silently dropped'}
]
const SEV = ['blocker', 'major', 'minor', 'nit']

// ---- W4-local constants (each restates a design rule the script needs as data) ----
const BIBLE_MD = OUTABS + '/street-bible.md', BIBLE_JSON = OUTABS + '/street-bible.json'
const SPEC_MD = OUTABS + '/street-spec.md', SPEC_JSON = OUTABS + '/street-spec.json'
const VIEWS_JSON = OUTABS + '/gates/views.json', TIDINGS = OUTABS + '/fixtures/tidings.json'
const GATE1 = OUTABS + '/gates/1-research.json', GATE3 = OUTABS + '/gates/3-build.json'
const DEVICE_DIR = OUTABS + '/device'
const STATS_KEYS = ['fps', 'calls', 'tris', 'buildings', 'trees', 'seed', 'realm', 'treasury', 'pop', 'agents', 'chron']   // ANNALS.stats() keys; must never change
const HASH_TABLE_MIN = ['#s=epeshu', '#s=a&goto=B', '#goto=B&s=a', '#notices=u&s=a', '#s=a&street=1', '#street=1', '#notices=u']
const HOOK_MARK = '/*ST-HOOK*/'
const CAP_VIEWS = ['SV1', 'SV2', 'SV3', 'SV4', 'SV5', 'SV6', 'SV7', 'SV8', 'SV9'], FAR_QUIET = ['SV5', 'SV9']
const CAP_FALLBACK = {quads_per_frame: d => d.jobs_max, built_tris_per_frame: d => d.built_tris_max, resident_tris: d => d.flyaway.resident_max}   // per-frame caps the probe reports run-wide, not per view
const DEVICE_FPS = 42
const CAPTURE_FLAGS = '--views ' + VIEWS_JSON + ' --layers street=0,street=1 --metrics calls,tris,geoms,textures,objects,stats_keys,classes,appear,swaps,jobs,resident --hash-table --paths descent,oscillate,flyaway --vfps 30,60 --queue-hash 600 --tidings ' + TIDINGS + ' --sky --fog-pairs 50 --phone ' + PHONE.join(',')   // Street 3's S4 capture set + the phone pair
const FP_DAYS = 400
const BLIND_TOK = vi => vi % 2 === 0 ? ['p', 'q'] : ['q', 'p']   // [layered, bare] neutral still names per judge view
const LENS_RULES = {   // the rulings each finder is handed (filigree R ids are FIL_CITED ids only)
  L01: {R: ['R13'], ST: ['ST3', 'ST4', 'ST18']}, L02: {R: [], ST: ['ST8', 'ST9']}, L03: {R: ['R6'], ST: ['ST9']},
  L04: {R: [], ST: ['ST3', 'ST5', 'ST6']}, L05: {R: ['R9', 'R10'], ST: ['ST13', 'ST16', 'ST17']}, L06: {R: [], ST: ['ST2', 'ST12']},
  L07: {R: ['R13'], ST: ['ST11', 'ST19']}, L08: {R: ['R18'], ST: ['ST7', 'ST18']}, L09: {R: ['R6'], ST: ['ST7', 'ST8']},
  L10: {R: ['R22'], ST: ['ST2']}, L11: {R: ['R12', 'R18'], ST: ['ST7', 'ST10', 'ST19']}}
const LENS_READS = {
  L01: `the fingerprint block of the digest; grep -nE '${ST_CLOCK_GREP}' and grep -n 'W[.]rng' and grep -n 'nowMs' over the STREET block; the spec's /determinism`,
  L02: 'the spec\'s /caps and /stream; the digest views.<SVn>.on against /caps/<SVn>',
  L03: 'the spec\'s /fade and /tiers; the digest appear, swaps and oscillate_builds',
  L04: 'the spec\'s /traffic and /gates; the digest spacing and vfps; the SV2 and SV4 shots',
  L05: `${REPO}/lexicon/patrinaic.json (read only); the bible's Patrinaic words; the "Campaign canon" section of ${REPO}/.claude/CLAUDE.md (read only)`,
  L06: `${REPO}/maps-site/data/wiki-places.json and ${REPO}/maps-site/data/chart-pois.json (read only); the SV1, SV6 and SV8 shots`,
  L07: `the spec's /sky, /fog and /weather; the digest clouds, weather_dial and fog; ${FIL}/ (read only) for the R13 fog source`,
  L08: 'the spec\'s /layers, /hash and /hook_lines; the digest hash_table, writer_roundtrip and shadows_row; index.html at the keydown and hash anchors',
  L09: `the digest phone block; the phone shots of ${PHONE.join(' and ')} (390x844)`,
  L10: 'the bible\'s classes per view and tier bands; the digest classes_on per view; the SV7 shots',
  L11: `${DOCS}/todo-inputs.json, ${DOCS}/README.md §9, ${TIDINGS}; the digest tidings, clouds, shadows_row and weather_dial; the descent path in the capture`}
const DET_RULE = `Determinism (ST3, ST4): street code takes every random choice from the sim's keyed stream ${KEY_IDIOM} (index.html function makeStream = xmur3 -> sfc32; the sim has no mulberry32), cached per key and render-only; presentation time accumulates from dt only (ST.t); gen and sim code never call the unseeded random or any wall-clock timer (all banned by the project determinism rule), and the STREET block never names W.rng or nowMs; street code moves only mesh transforms (departDay, route and speed are never touched); no new sim state.`
const FIX_RULE = 'A fix edits index.html only inside the /* STREET */ block or on a hook line the spec declares (each carries /*ST-HOOK*/), or tools/street-probe.js; never maps-site/, docs/filigree/ or tools/filigree-*, and never anything under docs/street/: the spec (street-spec.md/.json), the frozen views (gates/views.json), the baseline (gates/baseline.json) and the fixtures (fixtures/) are sha-checked by the Street 1-3 gates and the next review cycle, so editing one sends the track back to Street 1 or 2. A defect that lives in the spec is fixed by a re-run of street-2-plan, and one in the frozen views, baseline or fixtures by a re-run of street-1-research: fix then starts "re-run street-2-plan:" or "re-run street-1-research:" and says what must change.'
const SEV_RUBRIC = 'blocker = breaks determinism (a fingerprint differs, a keyed-stream rule, a clock or W.rng use), coexistence (a filigree anchor, maps-site/ or docs/filigree/, an undeclared hook line) or the off identity (street=0 or no street param differs from the pre-street sim); major = fails a gate criterion (the Street 3 slice criteria or the Street 4 bare-street test) or a cap in the spec /caps; minor = a visible defect inside the spec\'s rules; nit = taste.'
const TMPCOPY = `D=$(mktemp -d); tar -C ${REPO} --exclude=./.git -cf - . | tar -C $D -xf -; cd $D`

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
// W4-local helpers (the digest script, finder/verifier prompts, the gate scoring) are defined below; they are not shared with W1-W3
const NB = {type: ['boolean', 'null']}, NI = {type: ['integer', 'null']}
const MAPN = {type: 'object', additionalProperties: NN}, MAPI = {type: 'object', additionalProperties: I}
const PRE4 = OBJ({missing: SA, anchors: ANCH, fil_anchors: FILANCH, drift: DRIFT,
  gate3: OBJ({exists: B, pass: B, mode: S, forced: B, spec_ok: B, tree_digest: S}),
  gate1: OBJ({fil_rulings_cited: {type: 'object', additionalProperties: S}}),
  fil_overrides: {type: 'object', additionalProperties: S}, st_overrides: {type: 'object', additionalProperties: S},
  cycles: {type: 'array', items: I}, prior: OBJ({k: I, ids: SA, lenses: {type: 'object', additionalProperties: S}, titles: {type: 'object', additionalProperties: S}}),
  class_labels: SA, punch_open: SA, restore_refs: SA, caps: {type: 'object', additionalProperties: {type: 'object', additionalProperties: NN}},
  device: {type: 'array', items: OBJ({path: S, fps_min: N, degrade_max: I, index_sha: S})}, index_sha256: S, tree_digest: S})
const CAPT = OBJ({metrics_path: S, metrics_sha256: S, shots_dir: S, cdn_dir: S, infra_error: S,
  blind: {type: 'array', items: OBJ({view: S, layered_src: S, bare_src: S, layered: S, bare: S, layered_sha256: S, bare_sha256: S})}})
const DIGEST = OBJ({sha256: S, digest: S, infra_error: S,   // workflow-3 DIGEST + classes_off, phone, fps (fingerprints), digest, infra_error
  views: {type: 'object', additionalProperties: OBJ({off: MAPN, on: MAPN, classes_on: MAPI, classes_off: MAPI})},
  appear: OBJ({violations: {type: ['array', 'null'], items: S}, slowest_ms: NN}), swaps: {type: 'object', additionalProperties: OBJ({in: NI, out: NI})},
  oscillate_builds: MAPI, flyaway: OBJ({geoms_first: NN, geoms_return: NN, geoms_reseed: NN, resident_max: NN}),
  jobs_max: NN, built_tris_max: NN, vfps: OBJ({h30: S, h60: S}), spacing: OBJ({min_gap: NN, dvis_over_dtrue: NI}),
  hash_table: {type: 'array', items: OBJ({hash: S, ok: B, got: S})}, writer_roundtrip: NB, stats_keys: SA, inst_no_color: NI,
  clouds: OBJ({same_day_equal: NB, next_day_differs: NB, deck_matches_weather: NB}), shadows_row: OBJ({held_text: NB, disabled: NB, off_kills_shadow: NB, default_on_equal: NB}),
  weather_dial: OBJ({exact: NB, counts: {type: 'array', items: I}}), tidings: OBJ({barriers: NI, musters: NI, off_zero: NB, atlas_equal: NB}),
  fog: OBJ({present: NB, src_equal: NB, pairs_equal: NB}), device: {type: ['object', 'null'], properties: {fps_min: NN, degrade_max: NI}},
  phone: {type: 'object', additionalProperties: {type: 'object', additionalProperties: {type: ['number', 'boolean', 'string', 'null']}}},
  fps: {type: 'object', additionalProperties: OBJ({never: S, off: S, on: S, walk_on: S, walk_off: S})},
  console_errors: SA})
const FIND = OBJ({lens: S, findings: {type: 'array', items: OBJ({id: S, title: S, where: S,
  evidence: OBJ({kind: {type: 'string', enum: ['shot', 'cmd', 'metric']}, ref: S}), repro_cmd: S, fix: S, unit_hint: S})}})
const DEDUP = OBJ({fresh: SA, dupes: {type: 'array', items: OBJ({id: S, of: S})}, reopens: {type: 'array', items: OBJ({id: S, of: S})}})
const REPRO = OBJ({id: S, reproduced: B, out: S, infra_error: S})
const REFUTE = OBJ({id: S, refuted: B, why: S, infra_error: S})
const SEVR = OBJ({id: S, severity: {type: 'string', enum: SEV}, why: S})
const PANEL = OBJ({prefer: {type: 'string', enum: ['A', 'B']}, omissions: {type: 'array', items: OBJ({class: S, where: S})}, files_read: SA})
const VGREP = OBJ({hits: SA})
const COEX = OBJ({fil_anchors: FILANCH, tree_digest: S, restore_undeclared: SA, sha_restore: S})
const PUNCH = OBJ({md: S, json: S, sha_md: S, sha_json: S, items: {type: 'array', items: OBJ({id: S, severity: S, title: S, fix: S, unit_hint: S, done_when: S})}})
const PRUNE = OBJ({kept: SA, deleted: SA, count_ok: B})

// ---- helpers ----
const J = v => JSON.stringify(v)
const arr = v => Array.isArray(v) ? v : []
const oneLine = s => String(s ?? '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
const pad2 = n => String(n).padStart(2, '0')
const isHex = s => /^[0-9a-f]{64}$/.test(String(s ?? ''))
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i])
const LENS_IX = id => LENSES.findIndex(L => L.id === id)
// The digest: a fixed script over metrics.json (never an agent's own summary); fnv over its canonical output catches a mistranscribed return.
function canon(v) { return typeof v === 'string' ? v.normalize('NFC') : Array.isArray(v) ? v.map(canon).sort((a, b) => { const x = JSON.stringify(a), y = JSON.stringify(b); return x < y ? -1 : x > y ? 1 : 0 }) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v }
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 } return h.toString(16).padStart(8, '0') }
const DIG_KEYS = ['views', 'appear', 'swaps', 'oscillate_builds', 'flyaway', 'jobs_max', 'built_tris_max', 'vfps', 'spacing', 'hash_table', 'writer_roundtrip', 'stats_keys', 'inst_no_color',
  'clouds', 'shadows_row', 'weather_dial', 'tidings', 'fog', 'device', 'phone', 'fps', 'console_errors', 'infra_error']
const digOf = m => fnv(JSON.stringify(canon(Object.fromEntries(DIG_KEYS.map(k => [k, m[k]])))))
const DIGEST_JS = `const canon = (${canon})
const fnv = (${fnv})
const SEEDS = ${J(SEEDS)}
let s = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', d => { s += d }).on('end', () => {
  const m = JSON.parse(s)
  const o = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {}, L = x => Array.isArray(x) ? x : null
  const n = x => typeof x === 'number' && isFinite(x) ? x : null, b = x => typeof x === 'boolean' ? x : null, i = x => Number.isInteger(x) ? x : null, str = x => typeof x === 'string' ? x : ''
  const nums = x => { const r = {}; for (const [k, v] of Object.entries(o(x))) if (n(v) !== null) r[k] = v; return r }
  const ints = x => { const r = {}; for (const [k, v] of Object.entries(o(x))) if (i(v) !== null) r[k] = v; return r }
  const layer = (x, on) => { const v = o(x), k = on ? 'street=1' : 'street=0'; return o(v[on ? 'on' : 'off'] || v[k] || o(v.layers)[k]) }
  const P = o(m.paths), views = {}, phone = {}, fps = {}
  for (const [v, x] of Object.entries(o(m.views))) {
    const off = layer(x, false), on = layer(x, true)
    views[v] = {off: nums(off), on: nums(on), classes_on: ints(o(x).classes_on || on.classes), classes_off: ints(o(x).classes_off || off.classes)}
  }
  for (const [v, x] of Object.entries(o(m.phone))) { const r = {}; for (const [k, y] of Object.entries(o(x))) if (n(y) !== null || b(y) !== null || typeof y === 'string') r[k] = y; phone[v] = r }
  for (const sd of SEEDS) { const f = o(o(m.fingerprint)[sd]), w = o(f.walk); fps[sd] = {never: str(f.never), off: str(f.off), on: str(f.on), walk_on: str(f.walk_on || w.on), walk_off: str(f.walk_off || w.off)} }
  const ap = o(m.appear || P.appear), sw = o(m.swaps || P.swaps), fl = o(m.flyaway || P.flyaway), vf = o(m.vfps || m.queue_hash), sp = o(m.spacing)
  const swaps = {}; for (const [k, x] of Object.entries(sw)) swaps[k] = {in: i(o(x).in), out: i(o(x).out)}
  const firstOn = Object.keys(o(m.views)).sort().map(v => layer(o(m.views)[v], true).stats_keys).find(Array.isArray)
  const cl = o(m.clouds || o(m.sky).clouds), sh = o(m.shadows_row || o(m.sky).shadows_row), wd = o(m.weather_dial || o(m.sky).weather_dial), td = o(m.tidings), fg = o(m.fog)
  const out = {views,
    appear: {violations: L(ap.violations) ? ap.violations.map(x => typeof x === 'string' ? x : JSON.stringify(x)) : null, slowest_ms: n(ap.slowest_ms)},
    swaps, oscillate_builds: ints(m.oscillate_builds || o(P.oscillate).builds),
    flyaway: {geoms_first: n(fl.geoms_first), geoms_return: n(fl.geoms_return), geoms_reseed: n(fl.geoms_reseed), resident_max: n(fl.resident_max)},
    jobs_max: n(m.jobs_max ?? P.jobs_max), built_tris_max: n(m.built_tris_max ?? P.built_tris_max),
    vfps: {h30: str(vf.h30), h60: str(vf.h60)}, spacing: {min_gap: n(sp.min_gap), dvis_over_dtrue: i(sp.dvis_over_dtrue)},
    hash_table: (L(m.hash_table) || []).map(x => ({hash: str(o(x).hash), ok: o(x).ok === true, got: str(o(x).got)})), writer_roundtrip: b(m.writer_roundtrip),
    stats_keys: (L(m.stats_keys) || L(o(m.stats).keys) || firstOn || []).map(String), inst_no_color: i(m.inst_no_color),
    clouds: {same_day_equal: b(cl.same_day_equal), next_day_differs: b(cl.next_day_differs), deck_matches_weather: b(cl.deck_matches_weather)},
    shadows_row: {held_text: b(sh.held_text), disabled: b(sh.disabled), off_kills_shadow: b(sh.off_kills_shadow), default_on_equal: b(sh.default_on_equal)},
    weather_dial: {exact: b(wd.exact), counts: (L(wd.counts) || []).filter(x => i(x) !== null)},
    tidings: {barriers: i(td.barriers), musters: i(td.musters), off_zero: b(td.off_zero), atlas_equal: b(td.atlas_equal)},
    fog: {present: b(fg.present), src_equal: b(fg.src_equal), pairs_equal: b(fg.pairs_equal)},
    device: m.device && typeof m.device === 'object' ? {fps_min: n(m.device.fps_min), degrade_max: i(m.device.degrade_max)} : null,
    phone, fps, console_errors: (L(m.console_errors) || []).map(String), infra_error: m.infra_error == null ? '' : String(m.infra_error)}
  out.digest = fnv(JSON.stringify(canon(out)))
  process.stdout.write(JSON.stringify(out) + '\\n')
})
`
const SHOT_REF = '"<absolute image path>#x,y,w,h" (the image path, a #, then the region in image pixels)'
const shotPath = ref => {   // '' when the ref names no image
  const m = String(ref ?? '').match(/([^\s'"`(<[]+?\.(?:jpe?g|png))(?![A-Za-z0-9])/i)
  return !m ? '' : absP(m[1])
}

// ---- Preflight ----
phase('Preflight')
const INPUTS = [REPO + '/index.html', PROBE, REPO + '/tools/street-drift.js', REPO + '/.claude/workflows/filigree-1-research.js', BIBLE_MD, BIBLE_JSON, SPEC_MD, SPEC_JSON, VIEWS_JSON, TIDINGS]
const PREFLIGHT4 = `Preflight for Street 4 (read-only: write nothing outside a mktemp -d dir). An absent input gives the empty value of its key.
A. ${ANCHOR_TASK}
Put that object under "anchors".
B. ${FIL_ANCHOR_TASK}
Put that object under "fil_anchors".
C. ${DRIFT_TASK}
Put that object under "drift".
Also:
1. missing = every one of these paths that does not exist or (for .json) does not parse: ${INPUTS.join(' ; ')}.
2. gate3 from ${GATE3}: {exists (present and parses), pass: parsed.pass === true, mode: parsed.mode or "", forced: parsed.forced_by != null, spec_ok: parsed.spec_sha256 (or, when absent, the sha256 of the parsed.artifacts entry whose path ends "street-spec.json") equals sha256sum ${SPEC_JSON} now, tree_digest: parsed.tree_digest or ""}. An absent file gives exists false, pass false, mode "", forced false, spec_ok false, tree_digest "".
3. gate1 = {fil_rulings_cited: parsed.fil_rulings_cited of ${GATE1}, verbatim ({} when absent)}.
4. fil_overrides = the "overrides" object of ${FIL}/rulings.json; st_overrides = the "overrides" object of ${DOCS}/rulings.json ({} when a file or its key is absent; string values only).
5. cycles = the sorted integers k of every ${OUTABS}/gates/4-review-c<k>.json that parses and does not carry "preview": true.
6. prior = the earlier review cycle: k = ${A.cycle !== undefined ? A.cycle - 1 : 'the highest of cycles (0 when there is none)'}; ids = the "punch_ids" array of ${OUTABS}/gates/4-review-c<k>.json; lenses = {<id>: "lens"} and titles = {<id>: "title"} for every entry of the "punch_items" array of that same gate file (fall back to items[] of ${OUTABS}/punch-list-c<k>.json, that cycle's own list, when the gate has no punch_items; never read the unversioned punch-list.json). {k: 0, ids: [], lenses: {}, titles: {}} when k is 0 or the gate is absent.
7. class_labels = the "id" of every entry of classes[] in ${BIBLE_JSON}, in file order.
8. caps = from ${SPEC_JSON}: {"<SVn>": the /caps/<SVn>/on object (or /caps/<SVn> itself when it has no "on" key), every value a number or null} for every view under /caps.
9. device = one entry per file ${DEVICE_DIR}/*.json, sorted by path: {path, fps_min: its minimum smoothed fps, degrade_max: its maximum degrade step, index_sha: the sha256 of the index.html it ran against (its "index_sha" or "index_sha256" key; "" when the file records none)}; [] when there is none. index_sha256 = sha256sum of ${REPO}/index.html now.
10. tree_digest = sha256 over the sorted list of "<path> <sha256>" lines (paths relative to ${REPO}) for every file under ${REPO}/maps-site/ and ${FIL}/, joined with "\\n".
11. punch_open = the text of every line of ${REPO}/POLISH.md matching ^- \\[ \\] \\*\\*Street 4 punch c[0-9]+ (the whole line; [] when none).
12. restore_refs = the non-empty "sha_restore" strings of ${OUTABS}/state/3-build/index-ref.json and ${OUTABS}/state/3-build/off-ref.json (an absent file or key adds nothing).
Return {missing, anchors, fil_anchors, drift, gate3, gate1, fil_overrides, st_overrides, cycles, prior, class_labels, punch_open, restore_refs, caps, device, index_sha256, tree_digest}.`
const pre = await crit(PS(PREFLIGHT4), {label: 'preflight', phase: 'Preflight', schema: PRE4, ...M('mech')})
if (!pre) return done({reason: 'agent died: preflight'})
const g3 = pre.gate3 || {}
const chainOk = !!(g3.exists && g3.pass && g3.mode === 'full' && !g3.forced && g3.spec_ok)
if (!PREVIEW && !FORCE && !chainOk && MODE === 'full') die('review must wait for the finished street view (docs/street/gates/3-build.json pass)')
if (!pre.drift || pre.drift.ok !== true) die('prelude drift: ' + driftIds(pre.drift))
if ((pre.missing || []).length) die('missing inputs: ' + pre.missing.join(', '))
if (!arr(pre.class_labels).map(String).filter(Boolean).length) die('street-bible.json has no classes (classes[].id is empty): SG4.2 cannot be scored')
const lost = anchorsLost(pre.anchors)
if (lost.length) die('anchor lost: ' + lost.join('; '))
const {r: RUL, used: RUSED} = rulingsMerge(pre.fil_overrides)
const STR = stRulingsMerge(pre.st_overrides), SUSED = STR.used
const citedNow = Object.fromEntries(FIL_CITED.map(k => [k, RUL[k]]))
const ruled = citedChanged((pre.gate1 || {}).fil_rulings_cited, citedNow)
if (ruled.length && !PREVIEW && !FORCE) die('the cited filigree rulings changed since Street 1 (' + ruled.join(', ') + '); re-run street-1-research')
if (!chainOk) log('chain not satisfied (gates/3-build.json): ' + (FORCE ? 'forced: ' + FORCE : 'preview run, findings only'))
const CYCLE = A.cycle ?? (1 + Math.max(0, ...arr(pre.cycles)))
if (CYCLE > 2) die('a third review cycle is refused (ST13): the owner decides')
if (arr(pre.cycles).includes(CYCLE) && !FORCE && !PREVIEW) die(`gates/4-review-c${CYCLE}.json already exists: refusing to overwrite an earlier cycle's record (pass force with a reason to redo it)`)
const PUNCH_HELD = CYCLE > 1 ? arr(pre.punch_open).map(String).filter(t => t.includes(`Street 4 punch c${CYCLE - 1} `)) : []   // cycle-1 punch items still open: the build is unfixed (they obey the street hold), so cycle 2 would re-measure it
if (PUNCH_HELD.length && !PREVIEW && !FORCE && MODE !== 'plan') return done({reason: 'blocked', blocked_by: PUNCH_HELD, cycle: CYCLE, owner_rulings_used: RUSED, street_rulings_used: SUSED,
  polish_note: `blocked: ${PUNCH_HELD.length} open Street 4 punch c${CYCLE - 1} item(s); no release, take the next item`})
const PRIOR_IDS = CYCLE > 1 ? arr((pre.prior || {}).ids).map(String).filter(Boolean) : []
const PRIOR_LENS = CYCLE > 1 ? Object.fromEntries(Object.entries((pre.prior || {}).lenses || {}).map(([k, v]) => [norm(k), String(v ?? '').trim().toUpperCase()])) : {}
const LNS = cap(LENSES), JVIEWS = cap(JUDGE_VIEWS), JUD = cap(JUDGES)
const RX = Math.min(EXTRA_ROUNDS, ROUNDS)   // extra find rounds: the design's 2, lowered by args.maxRounds
const nGate = JVIEWS.length * JUD.length + 2   // judges + voice grep + coexistence
const RESERVE = nGate + 2 + 7   // gate + punch integrator (crit) + shot pruner and three records (crit)
const dg = pre.device || [], dLast = dg.length ? dg[dg.length - 1] : null   // the newest device run decides (paths are dated)
const IDX_SHA = String(pre.index_sha256 ?? '').trim().toLowerCase(), dSha = dLast ? String(dLast.index_sha ?? '').trim().toLowerCase() : ''
const DEVICE_GATE = !dLast ? 'absent' : !(isHex(IDX_SHA) && dSha === IDX_SHA) ? 'stale' : (Number(dLast.fps_min) >= DEVICE_FPS && dLast.degrade_max === 0) ? 'pass' : 'fail'   // stale: the newest device run did not measure this index.html

if (MODE === 'plan') {
  const nL = LNS.length
  const schedule = [
    {phase: 'Preflight', agents_min: 1, agents_max: 2},
    {phase: 'Capture', agents_min: 2, agents_max: 4},   // capture (crit) + metrics reader (one retry)
    {phase: 'Find', agents_min: nL, agents_max: nL + RX * nL},
    {phase: 'Verify', agents_min: 0, agents_max: (1 + 3 * FIND_CAP0 * nL) + RX * (1 + 3 * FIND_CAP * nL), per_fresh_finding: 3},
    {phase: 'Bare-street gate', agents_min: nGate, agents_max: nGate},
    {phase: 'Punch list', agents_min: 2, agents_max: 3},   // shot pruner + integrator (crit)
    {phase: 'Record', agents_min: 3, agents_max: 6}]   // findings, gate, state (crit each)
  const agents_min = schedule.reduce((t, x) => t + x.agents_min, 0), agents_max = schedule.reduce((t, x) => t + x.agents_max, 0)
  return done({reason: 'plan', schedule, agents_min, agents_max, bound: VERIFY_BOUND, over_bound: agents_max > VERIFY_BOUND, cycle: CYCLE,
    chain_ok: chainOk, preview: PREVIEW, device_gate: DEVICE_GATE, prior_ids: PRIOR_IDS, blocked_by: PUNCH_HELD, owner_rulings_used: RUSED, street_rulings_used: SUSED,
    assumes: 'Verify max rests on the code-side caps of 2 findings per lens in round 0 and 1 per re-run lens later; fresh findings past the bound or the token budget are left unverified (a recorded gap)'})
}

const CAPDIR = `${RV}/review-c${CYCLE}`, CAPREL = `${RVREL}/review-c${CYCLE}`
const gaps = [], criteria = [], coverage = []
let rounds = 0, spent = 2   // spent: a code counter of spawned agents (crit counted at its retry bound); preflight counted
const died = label => done({reason: 'agent died: ' + label, rounds, cycle: CYCLE, preview: PREVIEW, device_gate: DEVICE_GATE, owner_rulings_used: RUSED, street_rulings_used: SUSED,
  polish_note: `Street 4 c${CYCLE}: agent died: ${label}; no release, the next run retries`})
const infra = e => done({reason: 'infra', rounds, cycle: CYCLE, preview: PREVIEW, device_gate: DEVICE_GATE, owner_rulings_used: RUSED, street_rulings_used: SUSED, polish_note: 'infra: ' + oneLine(e)})

// ---- Capture ----
phase('Capture')
const blindTriples = JVIEWS.map(v => [v, ...BLIND_TOK(JUDGE_VIEWS.indexOf(v))])
const blindImg = (v, which) => `${CAPDIR}/shots/blind/${v}-${BLIND_TOK(JUDGE_VIEWS.indexOf(v))[which === 'layered' ? 0 : 1]}.jpg`   // the capture copies the desktop blind pairs to these exact names
const capt = await crit(PS(`You own the browser for this review; you are its only capture step. Never judge and never summarise metrics.json: a separate reader extracts the measurements.
${SANDBOX_ST}
1. From ${REPO}, run ONCE: node ${PROBE} ${CAPTURE_FLAGS} --port ${PORT} --cdn-dir <tmp> --out ${CAPDIR}/metrics.json --shots ${CAPDIR}/shots/
${PREVIEW ? '   This is a preview of a partial build: first run node ' + PROBE + ' --help and drop from the line above every flag it does not list (keep the rest unchanged).\n' : ''}2. Fingerprints, both seeds ${SEEDS.join(' and ')}: per seed s run node ${PROBE} --fingerprint --seed s --days ${FP_DAYS} --port ${PORT} --cdn-dir <tmp> five ways, each with --out to a file in your temp dir: no --layers flag (never), --layers street=0 (off), --layers street=1 (on), --walk ${VIEWS_JSON} --layers street=1 (walk_on), --walk ${VIEWS_JSON} --layers street=0 (walk_off). Then, with a node script that copies each run's fingerprint sha byte for byte and changes nothing else in the file, set the key fingerprint of ${CAPDIR}/metrics.json to {"<seed>": {"never": sha, "off": sha, "on": sha, "walk_on": sha, "walk_off": sha}} for both seeds.
3. Blind stills for the bare-street panel. Never infer a still's layer or size from the file names of step 1 (the combined run's naming is not fixed). Instead run the probe twice more, desktop size only (no --phone flag), one layer per run, each into its own fresh directory: node ${PROBE} --views ${VIEWS_JSON} --layers street=1 --port ${PORT} --cdn-dir <tmp> --out <tmp>/blind-on.json --shots <tmp>/blind-on/ and the same with --layers street=0, --out <tmp>/blind-off.json and --shots <tmp>/blind-off/. In each directory the still of a view is the one image whose file name contains that view id as a whole token (SV1 never matches SV10). For each [view, layered name, bare name] of ${J(blindTriples)}: layered_src = that view's still in <tmp>/blind-on/, bare_src = its still in <tmp>/blind-off/; byte-copy layered_src to ${CAPDIR}/shots/blind/<view>-<layered name>.jpg and bare_src to ${CAPDIR}/shots/blind/<view>-<bare name>.jpg. When a directory holds no such image, or more than one, for a view, leave that source and its copy "" (copy nothing for that view) rather than guess.
4. Every image stays under ${CAPDIR}/shots/ (git-ignored), at most 300 KB each. Edit no repo file and never the probe. Keep the <tmp> directory holding the extracted three/ and leaflet/ (do not delete it): the verifiers reuse it.
Return {metrics_path (absolute), metrics_sha256 (sha256sum of the final metrics.json; '' when it was not written), shots_dir (absolute; ${CAPDIR}/shots), cdn_dir (the absolute <tmp> passed as --cdn-dir), blind: [one entry per view of step 3: {view, layered_src, bare_src (absolute source paths), layered, bare (absolute paths of the copies), layered_sha256, bare_sha256 (sha256sum of each copy)}], infra_error}: infra_error = the setup failure (probe missing, non-zero exit, port, browser or CDN), '' when there is none. A street defect is never an infra_error. On an infra error fill every other key with '' (blind: []).`),
  {label: 'capture', phase: 'Capture', schema: CAPT, ...M('audit')})
spent += 2
if (!capt) return died('capture')
if (String(capt.infra_error ?? '').trim()) return infra(capt.infra_error)
const SHOTS = absP(String(capt.shots_dir || '').trim() || CAPDIR + '/shots').replace(/\/+$/, '')
const METRICS = absP(String(capt.metrics_path || '').trim() || CAPDIR + '/metrics.json')
const cdnRaw = String(capt.cdn_dir ?? '').trim().replace(/\/+$/, '')
const CDN = cdnRaw.startsWith('/') && PATH_OK.test(cdnRaw) && !cdnRaw.split('/').includes('..') ? cdnRaw : ''   // reaches unquoted prompt lines
// Every probe command after the capture runs in parallel with others: a fixed args.port would collide, so these steps always bind port 0.
const VPROBE = `Every probe command in this step uses --port 0 (an OS-assigned free port; findings are checked in parallel, so a fixed port collides${PORT ? ', whatever --port the recipe above names' : ''}) and ${CDN ? `--cdn-dir ${CDN} (three/ and leaflet/ already extracted by the capture; skip npm pack; only if that directory is gone, build your own as the recipe says)` : '--cdn-dir <tmp> built as the recipe says'}.`
const blindMap = {}, blindBadWhy = {}
for (const v of JVIEWS) {
  const es = arr(capt.blind).filter(e => e && String(e.view ?? '').trim() === v)
  const e = es[0] || {}, ls = String(e.layered_src ?? '').trim(), bs = String(e.bare_src ?? '').trim()
  const why = es.length !== 1 ? `${es.length} blind entries` : !ls || !bs ? 'no single still found per layer' : absP(ls) === absP(bs) ? 'layered and bare share one source still'
    : absP(String(e.layered ?? '')) !== blindImg(v, 'layered') || absP(String(e.bare ?? '')) !== blindImg(v, 'bare') ? 'copies not at the neutral names'
    : !isHex(e.layered_sha256) || !isHex(e.bare_sha256) ? 'copy hash missing' : ''
  if (why) blindBadWhy[v] = why; else blindMap[v] = {layered_src: absP(ls), bare_src: absP(bs)}
}
if (Object.keys(blindBadWhy).length) gaps.push('blind stills not captured (the view fails SG4.2, no judge runs): ' + Object.entries(blindBadWhy).map(([v, w]) => `${v}: ${w}`).join('; '))
const readerPrompt = `Mechanical read-back; judge nothing. Write the JavaScript between the BEGIN/END lines below, byte for byte, to rd.js in a fresh temp dir (mktemp -d; use your file-writing tool or a quoted heredoc so nothing expands). Then run, from ${REPO}: sha256sum ${METRICS} and node <that dir>/rd.js < ${METRICS}.
Return the single JSON object that node prints, every key and value exactly as printed (do not round, reorder, trim, translate or drop anything; empty arrays, empty objects and nulls stay), plus sha256 = the hash sha256sum printed. If node fails (a syntax error means rd.js was copied wrongly), return sha256 and infra_error = its error message, with every other key empty.
BEGIN rd.js
${DIGEST_JS}END rd.js`
let dig = null, rdInfra = ''
for (let t = 0; t < 2 && !dig; t++) {
  const r = await agent(PS(readerPrompt), {label: 'metrics reader' + (t ? ' (retry)' : ''), phase: 'Capture', schema: DIGEST, ...M('mech')})
  spent++
  if (!r) { rdInfra = ''; continue }
  if (String(r.infra_error ?? '').trim()) { rdInfra = String(r.infra_error); log(`metrics reader: node failed (${oneLine(rdInfra).slice(0, 160)}), ${t ? 'giving up' : 'retrying'}`); continue }
  rdInfra = ''
  if (r.digest !== digOf(r)) { log(`metrics reader: digest ${r.digest} does not match its own return (${digOf(r)}): mistranscribed, ${t ? 'giving up' : 'retrying'}`); continue }
  if (!isHex(r.sha256) || r.sha256 !== capt.metrics_sha256) { log(`metrics reader: sha ${r.sha256} differs from the capture's ${capt.metrics_sha256}, ${t ? 'giving up' : 'retrying'}`); continue }
  dig = r
}
if (!dig) return rdInfra ? infra('metrics reader failed twice: ' + rdInfra) : died('metrics reader')
{ const lset = new Set(arr(pre.class_labels).map(x => norm(String(x)))); if (!JVIEWS.some(v => Object.keys((dig.views[v] || {}).classes_on || {}).some(k => lset.has(norm(k))))) gaps.push('no class of street-bible.json classes[] matches a key of classes_on in any judge view of the digest: SG4.2 cannot confirm an omission (a harness fault, not the build)') }
if (dig.console_errors.length) gaps.push('console errors during capture: ' + dig.console_errors.slice(0, 5).join(' | '))

// ---- Find + Verify (loop until dry, <= RX extra rounds) ----
const DIGTXT = J(Object.fromEntries(DIG_KEYS.map(k => [k, dig[k]])))
const PRIOR_TITLES = CYCLE > 1 ? Object.fromEntries(Object.entries((pre.prior || {}).titles || {}).map(([k, v]) => [norm(k), oneLine(v)])) : {}
const priorList = PRIOR_IDS.map(id => ({id, title: PRIOR_TITLES[norm(id)] || ''}))
const priorTxt = PRIOR_IDS.length
  ? `Open punch items from cycle ${CYCLE - 1}: ${J(priorList)} (details in ${OUTABS}/punch-list-c${CYCLE - 1}.json). A defect that is one of these, still unfixed, is reported with id set to that punch id and fresh evidence; every other finding has id "".`
  : 'There is no prior review cycle: id is always "".'
const seenTitles = {}
const finderPrompt = (L, round) => `You are Street 4 review finder ${L.id} — ${L.check}. ONE lens only; report defects only through it:
${L.lens}
Review only: edit no repo file. The one file you write is ${RV}/findings/${L.id}-c${CYCLE}-r${round}.json. Cycle ${CYCLE}, round ${round}.
Read: the metrics digest at the end of this prompt (a fixed-script read of ${METRICS}, sha256 ${dig.sha256}); the capture ${METRICS} itself; the shots in ${SHOTS}/ (layered = street=1, bare = street=0; phone variants at 390x844 for ${PHONE.join(' and ')}; the file naming is the probe's own and not fixed, so take a still's layer and size from the probe's record of its shots in ${METRICS} or from node ${PROBE} --help, never guessed from a file name; the desktop layered/bare pairs captured one layer per run are known exactly: ${J(blindMap)}); the street bible ${BIBLE_MD} and ${BIBLE_JSON}; the street spec ${SPEC_MD} and ${SPEC_JSON}; ${REPO}/index.html (the /* STREET */ block and the hook lines carrying ${HOOK_MARK}); the frozen views ${VIEWS_JSON}; ${LENS_READS[L.id]}.
Code anchors (pattern -> path:line as re-derived this run; cite code by pattern, never by line number alone):
${anchorMap(pre.anchors)}
Rulings:
${rulingText(RUL, LENS_RULES[L.id].R)}
${rulingText(STR.r, LENS_RULES[L.id].ST)}
${DET_RULE}
${VOCAB_ST_RULE}
${priorTxt}
${round > 0 ? `Already reported by this lens: ${J((seenTitles[L.id] || []).slice())}; report only what is not in this list.\n` : ''}Every finding needs evidence {kind, ref} another agent can re-check: shot = ${SHOT_REF}; metric = a JSON pointer into ${METRICS} (e.g. /views/SV1/street=1/calls, as the file spells it); cmd = a shell command run from ${REPO}. repro_cmd = a shell command, run from ${REPO}, that exits 0 while the defect is present and non-zero once it is fixed; one that writes anything (the probe's --out, a build) first makes a temp copy (${TMPCOPY}) and runs there, with paths relative to the copy or written as $D and never an absolute ${REPO} path. Probe runs (fingerprint, cap, fade and hash defects) follow this recipe: ${SANDBOX_ST}
${VPROBE} A repro_cmd that runs the probe carries --port 0 and that --cdn-dir explicitly, so a verifier can run it as written. where = the view id, file:pattern or layers row the defect sits at. A finding with an empty evidence.ref or repro_cmd is discarded.
fix = the change to make. ${FIX_RULE} unit_hint = the street-spec unit id or the file the fix belongs in.
Severity guide (for your ordering only; verifiers rate it): ${SEV_RUBRIC}
Report at most ${round === 0 ? FIND_CAP0 : FIND_CAP} finding(s) this round, the most severe first; a later round asks again for what is left.
Write ${RV}/findings/${L.id}-c${CYCLE}-r${round}.json as {"date":"${DATE}","lens":"${L.id}","cycle":${CYCLE},"round":${round},"findings":[...]} (2-space indent, creating the directory), then return {lens:"${L.id}", findings}.
Digest = ${DIGTXT}`
const fText = f => J({id: f.uid, lens: f.lens, title: f.title, where: f.where, evidence: f.evidence, repro_cmd: f.repro_cmd, fix: f.fix})
const reproducePrompt = f => `Reproduce ONE Street 4 review finding independently. Edit no repo file; write nothing outside a mktemp -d dir.
Finding: ${fText(f)}
Run its repro_cmd from ${REPO}; when the command writes anything (the probe's --out, a build, a generator) run it instead in a temp copy (${TMPCOPY}) with every ${REPO} in it rewritten to $D. Probe commands follow this recipe: ${SANDBOX_ST}
${VPROBE} (A repro_cmd naming another --port or --cdn-dir is run with these instead; nothing else in it changes.)
Then check the evidence: shot = open the image (shots live in ${SHOTS}/) and inspect the region; metric = read that pointer in ${METRICS}; cmd = run it from ${REPO}.
reproduced = true only when repro_cmd exits 0 AND its output or the evidence shows the defect as described. out = the exit code, then the first 400 characters of the output.
infra_error = the setup failure when you could not run the check at all (port in use, browser, CDN, npm, a probe crash before it measured anything), '' otherwise; with an infra_error set reproduced false. A command that ran and showed no defect is reproduced false with infra_error ''.
Return {id: "${f.uid}", reproduced, out, infra_error}.`
const refutePrompt = (f, rep) => `Try to refute ONE Street 4 review finding. Edit no repo file; write nothing outside a mktemp -d dir.
Finding: ${fText(f)}
An independent reproduction: ${J({reproduced: rep.reproduced, out: oneLine(rep.out).slice(0, 400)})}
Re-check the evidence yourself (shots in ${SHOTS}/, metrics ${METRICS}, commands from ${REPO}; a writing command runs in a temp copy: ${TMPCOPY}). Probe commands follow this recipe: ${SANDBOX_ST}
${VPROBE}
If a setup failure (port, browser, CDN, npm, a probe crash before it measured anything) stops you re-checking, return infra_error = that failure and refuted false: never refute what you could not re-check. Otherwise infra_error = ''.
Default refuted:true when the evidence does not hold; when the street bible (${BIBLE_MD}), the street spec (${SPEC_MD}, ${SPEC_JSON}) or a ruling below allows what it describes; or when the defect lies outside the street track (maps-site/, docs/filigree/, filigree code, or an index.html line that is neither in the /* STREET */ block nor a declared hook). refuted:false only when the defect is real, in the street track, and nothing allows it.
Rulings:
${rulingText(RUL, FIL_CITED)}
${rulingText(STR.r, Object.keys(ST_RULINGS))}
Return {id: "${f.uid}", refuted, why, infra_error}.`
const severityPrompt = f => `Rate the severity of ONE verified Street 4 finding with this fixed rubric: ${SEV_RUBRIC}
Read the spec rule or gate criterion it touches before rating (spec ${SPEC_JSON}; Street 3's final gate ${GATE3}). Edit nothing.
Finding: ${fText(f)}
Return {id: "${f.uid}", severity, why}.`

// Code-side dedup: prior punch ids seed the Set; a finding re-reporting one (its id) is admitted once per run under its own key; every other finding keys on norm(title + ' ' + where).
const priorSet = new Set(PRIOR_IDS.map(norm))
const seen = new Set(priorSet)
const keyOf = f => priorSet.has(norm(f.id)) ? 'reopen ' + norm(f.id) : norm(f.title + ' ' + f.where)
const survivors = [], unverified = [], dropped = [], deadLens = new Set(), lensCounts = {}
const touched = new Set()   // norm(prior id) re-reported by a finder but lost before verification (cap, no evidence): not re-checked, never fixed
let lensesNow = LNS
for (let round = 0; ; round++) {
  const tag = round ? ' r' + round : ''
  phase('Find')
  const raw = await parallel(lensesNow.map(L => () => agent(PS(finderPrompt(L, round)), {label: `${L.id} · ${L.check}${tag}`, phase: 'Find', schema: FIND, ...M(L.role)})))
  spent += raw.length
  const fk = kept(raw, 'finders r' + round)
  if (round > 0 && !fk.ok) gaps.push(`extra round ${round}: ${raw.length - fk.k.length}/${raw.length} finders died`)
  const candidates = []
  raw.forEach((res, i) => {
    const L = lensesNow[i], lc = lensCounts[L.id] || (lensCounts[L.id] = {found: 0, no_evidence: 0, capped: 0, dupe: 0, fresh: 0, survived: 0, died: 0, unverified: 0, not_reproduced: 0, refuted: 0, infra: 0})
    if (!res) { lc.died++; if (round === 0) deadLens.add(L.id); log(`agent died: ${L.id} finder r${round}` + (round === 0 ? ' (a missing lens, never "no findings")' : '')); return }
    const isPrior = f => !!f && priorSet.has(norm(f.id))
    const all = arr(res.findings).map((f, j) => [f, j]).sort((a, b) => (isPrior(b[0]) - isPrior(a[0])) || a[1] - b[1]).map(x => x[0])   // stable: re-reported prior ids first, so the cap never drops one ahead of a new finding
    const capN = round === 0 ? FIND_CAP0 : FIND_CAP, k1 = all.slice(0, capN)
    if (all.length > capN) {
      lc.capped += all.length - capN; log(`${L.id} r${round}: ${all.length - capN} finding(s) past the per-lens cap of ${capN} dropped`)
      for (const f of all.slice(capN)) if (isPrior(f)) { touched.add(norm(f.id)); dropped.push({uid: `${L.id}.r${round}.cap`, lens: L.id, title: oneLine(f.title), prior_id: String(f.id), why: 'past the per-lens cap (prior id not re-checked)'}) }
    }
    k1.forEach((f, j) => {
      lc.found++
      if (!f || !f.evidence || !String(f.evidence.ref ?? '').trim() || !String(f.repro_cmd ?? '').trim()) { lc.no_evidence++; if (isPrior(f)) { touched.add(norm(f.id)); dropped.push({uid: `${L.id}.r${round}.${j + 1}`, lens: L.id, title: oneLine(f.title), prior_id: String(f.id), why: 'no evidence (prior id not re-checked)'}) } return }
      const g = {...f, lens: L.id, round, uid: `${L.id}.r${round}.${j + 1}`, prior_id: priorSet.has(norm(f.id)) ? String(f.id) : ''}
      g.key = keyOf(g)
      if (seen.has(g.key) && !g.key.startsWith('reopen ')) { lc.dupe++; dropped.push({uid: g.uid, lens: L.id, title: oneLine(g.title), why: 'seen'}); return }
      if (g.key.startsWith('reopen ') && seen.has(g.key)) { lc.dupe++; dropped.push({uid: g.uid, lens: L.id, title: oneLine(g.title), why: 'prior id already re-reported'}); return }
      seen.add(g.key)
      candidates.push(g)
    })
  })
  if (!candidates.length) { log(`round ${round}: no fresh findings (dry)`); break }

  phase('Verify')
  let fresh = candidates
  if (fresh.length > 1 || PRIOR_IDS.length) {   // the optional fuzzy pass: it removes only dupes of an earlier candidate or a seen title; a match to a prior punch id re-tags, never removes
    const seenList = [...new Set(Object.values(seenTitles).flat())]
    const openPrior = priorList.filter(p => !seen.has('reopen ' + norm(p.id)))
    const dd = await agent(PS(`Fuzzy duplicate pass, mechanical; judge nothing else and write nothing.
Candidates (in order): ${J(fresh.map(f => ({id: f.uid, lens: f.lens, title: oneLine(f.title), where: oneLine(f.where), prior_id: f.prior_id})))}
Already seen (titles reported earlier in this run): ${J(seenList)}
A candidate is a duplicate when it names the same defect at the same place as an EARLIER candidate in the list or as an already-seen title, in other words; "of" is then that earlier candidate's id or that seen title, copied exactly.
${openPrior.length ? `Open punch items from the previous cycle (never a reason to drop a candidate): ${J(openPrior)}. A candidate whose prior_id is "" but which names the same defect as one of these is a reopen: list it under reopens as {id, of: that punch id}, and keep it in fresh.` : 'There are no open punch items to match: reopens is [].'}
Return {fresh: [ids that are not duplicates], dupes: [{id, of}], reopens: [{id, of}]}.`),
      {label: 'dedup' + tag, phase: 'Verify', schema: DEDUP, ...M('mech')})
    spent++
    if (dd) {
      const ix = new Map(fresh.map((f, i) => [f.uid, i])), seenSet = new Set(seenList)
      const priorOpen = new Map(openPrior.map(p => [norm(p.id), p.id]))
      for (const x of arr(dd.reopens)) {   // re-tag only: a candidate that matches an open prior id is verified as that id's reopen
        const f = x && ix.has(x.id) ? fresh[ix.get(x.id)] : null, pid = x ? priorOpen.get(norm(x.of)) : undefined
        if (!f || f.prior_id || !pid || seen.has('reopen ' + norm(pid))) continue
        f.prior_id = pid; f.key = 'reopen ' + norm(pid); seen.add(f.key); log(`dedup: ${f.uid} re-tagged as a reopen of ${pid}`)
      }
      const ofOk = x => { const of = String(x.of ?? '').trim(); return !!of && of !== x.id && (ix.has(of) ? ix.get(of) < ix.get(x.id) : seenSet.has(of)) }
      const bad = arr(dd.dupes).filter(x => x && ix.has(x.id) && !ofOk(x))
      if (bad.length) log(`dedup${tag}: ${bad.length} dupe claim(s) ignored (of names neither an earlier candidate nor a seen title)`)
      const gone = new Set(arr(dd.dupes).filter(x => x && ix.has(x.id) && ofOk(x)).map(x => x.id))
      for (const f of fresh) if (gone.has(f.uid) && !f.prior_id) { lensCounts[f.lens].dupe++; dropped.push({uid: f.uid, lens: f.lens, title: oneLine(f.title), why: 'fuzzy dupe'}) }
      fresh = fresh.filter(f => !gone.has(f.uid) || f.prior_id)
    } else log('agent died: dedup' + tag + ' (optional; the code-side Set already ran)')
  }
  for (const f of fresh) { (seenTitles[f.lens] = seenTitles[f.lens] || []).push(oneLine(f.title)); lensCounts[f.lens].fresh++ }
  const fits = Math.max(0, Math.floor((VERIFY_BOUND - spent - RESERVE) / 3))
  const sevGuess = f => f.prior_id ? 0 : 1
  const verify = fresh.length <= fits ? fresh : fresh.map((f, j) => [f, j]).sort((a, b) => sevGuess(a[0]) - sevGuess(b[0]) || LENS_IX(a[0].lens) - LENS_IX(b[0].lens) || a[1] - b[1]).slice(0, fits).map(x => x[0])
  const overBound = verify.length < fresh.length
  if (overBound) {
    const cut = fresh.filter(f => !verify.includes(f))
    for (const f of cut) { unverified.push({uid: f.uid, lens: f.lens, prior_id: f.prior_id, title: oneLine(f.title), why: 'bound'}); lensCounts[f.lens].unverified++ }
    log(`round ${round}: ${cut.length} of ${fresh.length} fresh finding(s) left unverified: the agent bound (${spent} spent, ${RESERVE} reserved, bound ${VERIFY_BOUND})`)
    gaps.push(`round ${round}: ${cut.length} fresh finding(s) left unverified by the agent bound (lenses ${[...new Set(cut.map(f => f.lens))].join(', ')})`)
  }
  const infraOf = x => String((x && x.infra_error) ?? '').trim()
  const ver = []
  for (let c = 0; c < verify.length; c += VERIFY_CONC) ver.push(...await pipeline(verify.slice(c, c + VERIFY_CONC),   // bounded: every verifier may start probe runs
    async (_p, f) => { const rep = await agent(PS(reproducePrompt(f)), {label: `${f.uid} · reproduce`, phase: 'Verify', schema: REPRO, ...M('audit')}); if (!rep) throw new Error('reproduce died'); return {rep} },
    async (r, f) => { if (r.rep.reproduced !== true || infraOf(r.rep)) return {...r, ref: null}; const ref = await agent(PS(refutePrompt(f, r.rep)), {label: `${f.uid} · refute`, phase: 'Verify', schema: REFUTE, ...M('judge')}); if (!ref) throw new Error('refute died'); return {...r, ref} },
    async (rf, f) => { if (!rf.ref || rf.ref.refuted !== false || infraOf(rf.ref)) return {...rf, sev: null}; const sev = await agent(PS(severityPrompt(f)), {label: `${f.uid} · severity`, phase: 'Verify', schema: SEVR, ...M('triage')}); if (!sev) throw new Error('severity died'); return {...rf, sev} }))
  spent += 3 * verify.length
  const infraIx = new Set(verify.map((_f, i) => i).filter(i => ver[i] && (infraOf(ver[i].rep) || infraOf(ver[i].ref))))
  const vk = kept(ver.map((v, i) => infraIx.has(i) ? null : v), 'verify r' + round)   // an infra-blocked check is not a kept verdict (SG4.9)
  coverage.push({what: 'verify r' + round + (infraIx.size ? ` (${infraIx.size} infra)` : ''), ok: vk.ok, frac: vk.k.length + '/' + ver.length})
  if (infraIx.size) gaps.push(`round ${round}: ${infraIx.size} finding(s) unverified by a verifier setup failure: ${[...new Set([...infraIx].map(i => oneLine(infraOf(ver[i].rep) || infraOf(ver[i].ref)).slice(0, 120)))].slice(0, 3).join(' | ')}`)
  const survLenses = new Set()
  verify.forEach((f, i) => {
    const v = ver[i], lc = lensCounts[f.lens], base = {uid: f.uid, lens: f.lens, prior_id: f.prior_id, title: oneLine(f.title)}
    if (!v) { unverified.push({...base, why: 'verifier died'}); lc.unverified++; log(`unverified (a verifier died): ${f.uid} ${oneLine(f.title)}`); return }
    if (infraIx.has(i)) { const e = infraOf(v.rep) || infraOf(v.ref); unverified.push({...base, why: 'infra', detail: oneLine(e).slice(0, 200), stage: infraOf(v.rep) ? 'reproduce' : 'refute'}); lc.unverified++; lc.infra++; log(`unverified (infra): ${f.uid} ${oneLine(e).slice(0, 120)}`); return }
    if (v.rep.reproduced !== true) { dropped.push({...base, why: 'not reproduced', out: oneLine(v.rep.out).slice(0, 200)}); lc.not_reproduced++; return }
    if (!v.ref || v.ref.refuted !== false) { dropped.push({...base, why: 'refuted', refute_why: oneLine(v.ref && v.ref.why).slice(0, 200)}); lc.refuted++; return }
    if (!v.sev) { unverified.push({...base, why: 'no severity'}); lc.unverified++; return }
    survivors.push({...f, severity: v.sev.severity, severity_why: oneLine(v.sev.why), reproduce_out: oneLine(v.rep.out).slice(0, 400), refute_why: oneLine(v.ref.why)})
    lensCounts[f.lens].survived++
    survLenses.add(f.lens)
  })
  if (overBound) { log(`round ${round}: no extra round (the bound was reached)`); break }
  if (!survLenses.size) { log(`round ${round}: no lens produced a survivor`); break }
  if (round >= RX) { log(`find loop cap: ${RX} extra round(s) run; lenses ${[...survLenses].join(', ')} still produced survivors`); if (RX) gaps.push(`find loop stopped at its cap with survivors from ${[...survLenses].join(', ')}`); break }
  if (lowBudget()) { log('budget: extra round skipped'); gaps.push(`extra round ${round + 1} skipped by the token budget`); break }
  const next = lensesNow.filter(L => survLenses.has(L.id))
  const est = next.length + 1 + 3 * FIND_CAP * next.length
  if (spent + est + RESERVE > VERIFY_BOUND) { log(`extra round ${round + 1} skipped: about ${est} more agents would cross the bound (${spent} spent, ${RESERVE} reserved, bound ${VERIFY_BOUND})`); gaps.push(`extra round ${round + 1} skipped by the agent bound`); break }
  lensesNow = next
  rounds++
}

// ---- Bare-street gate ----
phase('Bare-street gate')
const LABELS = arr(pre.class_labels).map(String).filter(Boolean)
const pairOf = (v, vi, jid) => layeredIsA(vi, jid) ? [blindImg(v, 'layered'), blindImg(v, 'bare')] : [blindImg(v, 'bare'), blindImg(v, 'layered')]
const panelBody = ([a, b]) => `Two stills of the same place from the same camera: A = ${a} and B = ${b}. Open no other file and run nothing.
At table distance, which still shows the richer, more legible street, the one you would rather run a scene in?
Then list every thing present in one still and absent in the other, naming each ONLY by one of these class names (the full list; most may be on neither still): ${J(LABELS)}.
Return {prefer: "A" or "B", omissions: [{class: a name from the list, exactly as written, where: "A" or "B" (the still that HAS it)}], files_read: [every file you opened, as absolute paths]}.`
const coexPrompt = `Coexistence read (write nothing outside a mktemp -d dir).
A. ${FIL_ANCHOR_TASK}
Put that object under "fil_anchors".
B. Restore check (a node script in the temp dir): read ${REPO}/index.html and ${SPEC_JSON} (/hook_lines: [{line, replaces}]). Delete the lines from the first line containing "/* STREET */" through the first line after it containing "/* /STREET */" (inclusive; none when absent). Then for every remaining line that contains "${HOOK_MARK}": if it equals some hook_lines[].line exactly, replace it with that entry's replaces (delete the line when replaces is null); otherwise keep it and list it in restore_undeclared. sha_restore = sha256 of the joined result (lines joined with "\\n"); restore_undeclared is [] when none.
C. tree_digest = sha256 over the sorted list of "<path> <sha256>" lines (paths relative to ${REPO}) for every file under ${REPO}/maps-site/ and ${FIL}/, joined with "\\n".
Return {fil_anchors, tree_digest, restore_undeclared, sha_restore}.`
const voicePrompt = `Vocabulary grep, mechanical (write nothing outside a mktemp -d dir). With a node script, take the lines of ${REPO}/index.html strictly between the line containing "/* STREET */" and the line containing "/* /STREET */"; extract every string literal (single- and double-quoted strings and the literal parts of template strings; skip comments); test each with new RegExp(${J(VOCAB_ST.source)}, "i"). Return {hits: ["<line number>: <literal>" for every literal that matches]} ([] when none match or the block is absent).`
const [panels, vg, cx] = await parallel([
  () => pipeline(JVIEWS, (view, _item, vi) => blindBadWhy[view] ? [] : parallel(JUD.map(j => () => agent(PS(panelBody(pairOf(view, JUDGE_VIEWS.indexOf(view), j.id)), true),
    {label: `${view} · ${j.id}`, phase: 'Bare-street gate', schema: PANEL, ...M(j.role)})))),
  () => agent(PS(voicePrompt), {label: 'voice grep', phase: 'Bare-street gate', schema: VGREP, ...M('mech')}),
  () => agent(PS(coexPrompt), {label: 'coexistence', phase: 'Bare-street gate', schema: COEX, ...M('mech')})])
spent += nGate
const findClass = (v, cls) => { const want = norm(cls); return Object.keys((dig.views[v] || {}).classes_on || {}).find(k => norm(k) === want) }
const labelSet = new Set(LABELS.map(norm))
const judgeRows = [], perView = {}, badReads = [], deadJudges = []
let judgesAlive = 0
JVIEWS.forEach((v, vi) => {
  const gvi = JUDGE_VIEWS.indexOf(v), res = arr(arr(panels)[vi]), vw = dig.views[v] || null
  let qualified = 0, missing = 0
  const union = new Set()
  if (blindBadWhy[v]) { perView[v] = {ok: false, judges_qualified: 0, judges_missing: JUD.length, confirmed: [], blind: 'not captured: ' + blindBadWhy[v]}; return }
  JUD.forEach((jd, ji) => {
    const r = res[ji] || null, lA = layeredIsA(gvi, jd.id), layeredSide = lA ? 'A' : 'B'
    if (!r) { missing++; deadJudges.push(`${v} · ${jd.id}`); judgeRows.push({view: v, judge: jd.id, role: jd.role, layered_is_a: lA, died: true}); return }
    judgesAlive++
    const confirmed = [...new Set(arr(r.omissions).filter(o => o && String(o.where).trim().toUpperCase() === layeredSide && labelSet.has(norm(o.class)))
      .map(o => findClass(v, o.class)).filter(k => k && vw && (vw.classes_on[k] || 0) > 0 && !((vw.classes_off || {})[k] > 0)))].sort()
    const bad = blindBad(r.files_read, pairOf(v, gvi, jd.id))
    if (bad.length) badReads.push(...bad.map(p => `${v} · ${jd.id}: ${p}`))
    const prefersLayered = r.prefer === layeredSide
    if (prefersLayered && confirmed.length >= 3) qualified++
    confirmed.forEach(k => union.add(k))
    judgeRows.push({view: v, judge: jd.id, role: jd.role, layered_is_a: lA, died: false, prefer: r.prefer, prefers_layered: prefersLayered, omissions_listed: arr(r.omissions).length, confirmed, bad_reads: bad})
  })
  perView[v] = {ok: qualified >= 2 && missing === 0, judges_qualified: qualified, judges_missing: missing, confirmed: [...union].sort()}
})

// ---- criteria (scored in code from the digest, the mech readers and the verifiers) ----
const isBM = f => f.severity === 'blocker' || f.severity === 'major'
const nBlock = survivors.filter(f => f.severity === 'blocker').length, nMajor = survivors.filter(f => f.severity === 'major').length
const fpRows = Object.fromEntries(SEEDS.map(sd => {
  const f = dig.fps[sd] || null, all = f ? [f.never, f.off, f.on, f.walk_on, f.walk_off] : []
  return [sd, {ok: !!f && all.every(isHex) && f.never === f.off && f.off === f.on && f.walk_on === f.walk_off, ...(f || {})}]
}))
const capRows = CAP_VIEWS.map(v => {
  const c = (pre.caps || {})[v] || null, vw = dig.views[v] || null, on = vw ? vw.on : {}
  const metrics = c ? Object.entries(c).filter(([, x]) => typeof x === 'number') : []
  const over = metrics.map(([k, lim]) => { const got = typeof on[k] === 'number' ? on[k] : CAP_FALLBACK[k] ? CAP_FALLBACK[k](dig) : null; return {k, lim, got} }).filter(x => !(typeof x.got === 'number' && x.got <= x.lim))
  const offKeys = vw ? Object.keys(vw.off) : []
  const quiet = !FAR_QUIET.includes(v) || (!!vw && offKeys.length > 0 && offKeys.every(k => vw.on[k] === vw.off[k]))
  return {view: v, ok: !!c && !!vw && metrics.length > 0 && !over.length && quiet, over: over.map(x => `${x.k} ${x.got}>${x.lim}`), far_quiet: FAR_QUIET.includes(v) ? quiet : null, caps: !!c, measured: !!vw}
})
const swapRows = Object.entries(dig.swaps || {})
const fadeOk = Array.isArray(dig.appear.violations) && dig.appear.violations.length === 0 && swapRows.length > 0 && swapRows.every(([, s]) => s.in === 1 && s.out === 1)
const lits = Object.entries(((cx || {}).fil_anchors || {}).literals || {}), inStreet = Object.entries(((cx || {}).fil_anchors || {}).in_street || {})
const htRows = arr(dig.hash_table), htHave = new Set(htRows.map(x => x.hash))
const coex = {coexistence_read: !!cx, fil_literals: lits.length, fil_unresolved: lits.filter(([, x]) => !x).map(([k]) => k), fil_in_street: inStreet.filter(([, n]) => n > 0).map(([k, n]) => `${k}: ${n}`),
  restore_undeclared: cx ? arr(cx.restore_undeclared) : null, sha_restore: cx ? cx.sha_restore : '', restore_refs: arr(pre.restore_refs), restore_sha_ok: !!cx && isHex(cx.sha_restore) && arr(pre.restore_refs).includes(cx.sha_restore), hash_table_bad: htRows.filter(x => !x.ok).map(x => x.hash), hash_table_missing: HASH_TABLE_MIN.filter(h => !htHave.has(h)),
  writer_roundtrip: dig.writer_roundtrip, stats_keys: dig.stats_keys, tree_digest: cx ? cx.tree_digest : '', tree_digest_gate3: g3.tree_digest || '', tree_digest_preflight: pre.tree_digest || ''}
const coexOk = !!cx && lits.length > 0 && !coex.fil_unresolved.length && !coex.fil_in_street.length && coex.restore_undeclared.length === 0 && coex.restore_sha_ok
  && htRows.length > 0 && !coex.hash_table_bad.length && !coex.hash_table_missing.length && dig.writer_roundtrip === true && sameList(dig.stats_keys, STATS_KEYS)
const vHits = vg ? arr(vg.hits) : null
coverage.unshift({what: 'lenses run in round 0 (a dead finder is a missing lens, never "no findings")', ok: deadLens.size === 0, frac: (LNS.length - deadLens.size) + '/' + LNS.length + (deadLens.size ? ' dead: ' + [...deadLens].join(', ') : '')})
criteria.push(
  C('SG4.1', 'surviving blocker or major findings (reproduced, not refuted, severity-rated)', {blocker: nBlock, major: nMajor, unverified: unverified.length, dead_lenses: [...deadLens]}, '0', nBlock + nMajor === 0),
  C('SG4.2', 'per judge view: >=2 of 3 blind judges prefer the layered still, each listing >=3 omissions confirmed by the probe (classes_on > 0, bare count 0); a missing judge fails its view',
    {per_view: perView, died: deadJudges}, `${JVIEWS.length}/${JVIEWS.length} views`, JVIEWS.length > 0 && JVIEWS.every(v => perView[v].ok)),
  C('SG4.3', 'fingerprints re-measured, both seeds: never === off === on and walk_on === walk_off (64-hex)', fpRows, 'equal', SEEDS.every(sd => fpRows[sd].ok)),
  C('SG4.4', 'caps met on SV1-SV9 (digest vs spec /caps); SV5 and SV9 on === off', capRows, 'all', capRows.every(x => x.ok)),
  C('SG4.5', 'fade: appear.violations = []; hysteresis swaps exactly 1 in + 1 out per threshold', {violations: dig.appear.violations, swaps: dig.swaps}, 'both', fadeOk),
  C('SG4.6', 'VOCAB_ST hits in STREET-block string literals', {hits: vHits, grep_ran: !!vg}, '0', !!vg && vHits.length === 0),
  C('SG4.7', 'coexistence: filigree anchors resolve and none sits inside the STREET block; restore_undeclared = [] and restore(index.html) sha equals the Street 3 index-ref/off-ref stamp; hash table ok; stats keys unchanged (tree digest for information only)', coex, 'all', coexOk),
  C('SG4.8', 'blind compliance: each judge read only its two stills', {bad_reads: badReads}, '0 reads outside the two stills', badReads.length === 0 && judgesAlive > 0),
  C('SG4.9', 'coverage: every lens returned in round 0; verify fan-outs >=75% kept', coverage, 'all', coverage.every(x => x.ok)))
const failing = criteria.filter(c => !c.pass).map(c => c.id)
const viewsOk = JVIEWS.filter(v => perView[v].ok).length

// ---- Punch list ----
phase('Punch list')
const ranked = survivors.slice().sort((a, b) => SEV.indexOf(a.severity) - SEV.indexOf(b.severity) || LENS_IX(a.lens) - LENS_IX(b.lens) || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0))
const items = ranked.map((f, i) => {
  const id = `P${CYCLE}-${pad2(i + 1)}`, L = LENSES[LENS_IX(f.lens)], dw = '`' + oneLine(f.repro_cmd) + '` no longer exits 0'
  return {id, severity: f.severity, lens: f.lens, check: L ? L.check : f.lens, title: oneLine(f.title), where: oneLine(f.where), evidence: f.evidence, repro_cmd: oneLine(f.repro_cmd),
    fix: oneLine(f.fix), unit_hint: oneLine(f.unit_hint), prior_id: f.prior_id, done_when: dw, finding: f.uid}
})
const flinched = items.filter(x => x.lens === 'L10' || (x.prior_id && PRIOR_LENS[norm(x.prior_id)] === 'L10')).map(x => x.id)
const fixedSince = PRIOR_IDS.filter(id => !survivors.some(f => norm(f.prior_id) === norm(id)) && !unverified.some(u => norm(u.prior_id) === norm(id)) && !touched.has(norm(id)) && !deadLens.has(PRIOR_LENS[norm(id)] || '?') && dropped.some(d => norm(d.prior_id) === norm(id) && (d.why === 'not reproduced' || d.why === 'refuted')))
const notRechecked = PRIOR_IDS.filter(id => !survivors.some(f => norm(f.prior_id) === norm(id)) && !fixedSince.includes(id))
if (notRechecked.length) gaps.push(`prior punch ids not re-checked (never re-reported with a verified reproduce or refute verdict: lens died, finding unverified, capped, or no evidence): ${notRechecked.join(', ')}`)
// Pruner first: cited stills are copied under collision-free names and every shot ref is re-pointed to the tracked copy before the list is written.
const citedPlan = []
for (const x of items) {
  if (!x.evidence || x.evidence.kind !== 'shot') continue
  const src = shotPath(x.evidence.ref)
  if (src && !citedPlan.some(c => c.src === src)) citedPlan.push({src, dest: `${CAPDIR}/cited/${pad2(citedPlan.length + 1)}-${src.split('/').pop().replace(/[^A-Za-z0-9._-]/g, '_')}`})
}
const pr = await agent(PS(`Housekeeping, mechanical. Write nothing except what is named here.
1. Create ${CAPDIR}/cited/ and copy into it ONLY these images, each from "src" to exactly "dest" (skip a src that does not exist; a JPEG over 300 KB is re-encoded at a lower quality to fit): ${J(citedPlan)}. Remove any other file already in ${CAPDIR}/cited/.
2. Leave ${SHOTS}/ in place (it is git-ignored) and never touch metrics.json.
3. count_ok = the number of files now in ${CAPDIR}/cited/ equals the number of listed srcs that exist (${citedPlan.length} listed).
Return {kept: [absolute paths now in ${CAPDIR}/cited/], deleted: [files removed from cited/], count_ok}.`),
  {label: 'shot pruner', phase: 'Punch list', schema: PRUNE, ...M('mech')})
spent++
if (!pr) { log('agent died: shot pruner'); gaps.push('shot pruner died: cited/ not built; punch items cite the git-ignored shots/ paths') }
else {
  if (!pr.count_ok || arr(pr.kept).length > citedPlan.length) gaps.push(`shot pruner count check: ${arr(pr.kept).length}/${citedPlan.length} cited images`)
  const keptSet = new Set(arr(pr.kept).map(k => absP(k))), to = new Map(citedPlan.filter(c => keptSet.has(c.dest)).map(c => [c.src, c.dest]))
  for (const x of items) { const src = x.evidence && x.evidence.kind === 'shot' ? shotPath(x.evidence.ref) : '', d = to.get(src); if (d) x.evidence = {...x.evidence, ref: String(x.evidence.ref).replace(/[^\s'"`(<[]+?\.(?:jpe?g|png)(?![A-Za-z0-9])/i, () => d)} }
}
const pl = await crit(PS(`You are the punch-list integrator for Street 4 review cycle ${CYCLE}${PREVIEW ? ' (a preview: findings only, never the durable list)' : ''}. ${CYCLE > 1 ? `Read ${OUTABS}/punch-list-c${CYCLE - 1}.json (the previous cycle's own list, read only) for the previous titles. ` : ''}Then write four files (each cycle has its own pair; the unversioned pair is only a copy of the latest list and is never read as a prior list):
1. ${RV}/punch-list-c${CYCLE}.json = {"date":"${DATE}","cycle":${CYCLE},"items":ITEMS} with ITEMS below verbatim: keep every item, field, id and the order; add or drop nothing (2-space indent).
2. ${RV}/punch-list-c${CYCLE}.md, with these sections:
   ## Punch list: the items ranked by severity (blocker, major, minor, nit) and then by lens (${LENSES.map(L => L.id + ' ' + L.check).join('; ')}); each with id, severity, title, where, evidence, fix, unit hint and done when.
   ## Why the bare street is worse: per judge view, the confirmed omissions below and which judges preferred the layered still (name the judges J0/J1/J2 only; never call a still A or B).
   ## Where we flinched: the items ${J(flinched)} (lens L10, Where the build flinched); write "none survived verification" when that list is empty.
   ## Device gate (ST8): the device gate is "${DEVICE_GATE}" (${dLast ? `newest run ${dLast.path}: fps_min ${dLast.fps_min}, degrade_max ${dLast.degrade_max}, index sha ${dSha ? (dSha === IDX_SHA ? 'matches the current index.html' : 'differs from the current index.html: stale') : 'not recorded: stale'}` : 'no docs/street/device/*.json yet'}); the owner flips the street default only when Street 4 passed AND the device gate is "pass" (ST7, ST8).
   ## Fixed since cycle ${CYCLE - 1}: ${CYCLE > 1 ? 'the prior ids listed as fixed below, with their titles from the previous punch-list-c${CYCLE - 1}.json; then, under "Not re-checked", the not-re-checked ids (never call them fixed)' : 'write "First review cycle."'}
   ## Gate: one row per criterion (id, measured in brief, threshold, pass).
3. ${RV}/punch-list.json = a byte copy of the c${CYCLE} json; 4. ${RV}/punch-list.md = a byte copy of the c${CYCLE} md.
${VOCAB_ST_RULE}
ITEMS = ${J(items)}
Gate criteria = ${J(criteria.map(c => ({id: c.id, desc: c.desc, measured: JSON.stringify(c.measured === undefined ? null : c.measured).slice(0, 400), threshold: c.threshold, pass: c.pass})))}
Per judge view = ${J(perView)}
Judges = ${J(judgeRows.map(r => ({view: r.view, judge: r.judge, died: r.died, prefers_layered: !!r.prefers_layered, confirmed: r.confirmed || []})))}
Fixed since cycle ${CYCLE - 1} = ${J(fixedSince)}
Not re-checked = ${J(notRechecked)}
Re-read the c${CYCLE} files; return {md: the c${CYCLE} md path, json: the c${CYCLE} json path, sha_md: sha256sum of the c${CYCLE} md file, sha_json: sha256sum of the c${CYCLE} json file, items: [{id, severity, title, fix, unit_hint, done_when}] as written}.`),
  {label: 'punch integrator', phase: 'Punch list', schema: PUNCH, ...M('integ')})
spent += 2
if (!pl || !isHex(pl.sha_json) || !isHex(pl.sha_md)) return died('punch integrator')
if (arr(pl.items).map(x => x.id).join(',') !== items.map(x => x.id).join(',')) { log('punch-list item ids differ from the computed list'); gaps.push('punch-list.json item ids differ from the computed list') }

// ---- Record ----
phase('Record')
if (unverified.length) gaps.push(`${unverified.length} finding(s) unverified (a verifier died or hit a setup failure, or the agent bound was reached)`)
const findingsRec = {date: DATE, job: JOB, cycle: CYCLE, preview: PREVIEW, metrics_sha256: dig.sha256,
  verified: survivors.map(f => ({uid: f.uid, lens: f.lens, round: f.round, severity: f.severity, title: oneLine(f.title), where: oneLine(f.where), evidence: f.evidence, repro_cmd: f.repro_cmd, fix: oneLine(f.fix), unit_hint: oneLine(f.unit_hint), prior_id: f.prior_id, reproduce_out: f.reproduce_out, refute_why: f.refute_why, severity_why: f.severity_why})),
  unverified, dropped}
const gate = gateObj({criteria, rounds, rulings_used: RUSED, street_rulings_used: SUSED, gaps, cycle: CYCLE, preview: PREVIEW, device_gate: DEVICE_GATE,
  chain_ok: chainOk, fil_rulings_cited: citedNow,
  artifacts: [{path: RVREL + `/punch-list-c${CYCLE}.md`, sha256: pl.sha_md}, {path: RVREL + `/punch-list-c${CYCLE}.json`, sha256: pl.sha_json}, {path: CAPREL + '/metrics.json', sha256: dig.sha256}],
  per_view: perView, judges: judgeRows, punch_ids: [...items.map(x => x.id), ...notRechecked], punch_items: items.map(x => ({id: x.id, lens: x.lens, title: x.title})), fixed_since: fixedSince, not_rechecked: notRechecked, dead_lenses: [...deadLens], lens_counts: lensCounts})
if (PREVIEW) gate.pass = false
const gatePath = `${RVREL}/gates/4-review-c${CYCLE}.json`
const recs = await parallel([
  () => recordD(`${PVREL}findings/c${CYCLE}.json`, findingsRec, 'record findings'),
  () => recordD(`${PVREL}gates/4-review-c${CYCLE}.json`, gate, 'record gate'),
  () => record(`${PVREL}state/4-review.json`, {date: DATE, job: JOB, cycle: CYCLE, rounds, seen: [...seen], lens_counts: lensCounts, metrics_sha256: dig.sha256}, 'record state')])
const recOk = recs.every(Boolean)
const pass = gate.pass && !PREVIEW && recOk
const minorItems = items.filter(x => !isBM(x))
const inserts = PREVIEW ? [] : items.filter(isBM).map(x => `- [ ] **Street 4 punch c${CYCLE} · ${x.id} — ${x.title}** — ${x.fix}; unit hint: ${x.unit_hint || 'none'}; edits index.html only inside the STREET block or declared hooks, or tools/street-probe.js, never docs/street/ (a fix that starts "re-run street-" is that re-run instead, not an edit), and obeys the street hold (docs/street/README.md §1.3); done when ${x.done_when}`)
if (!PREVIEW && minorItems.length) inserts.push(`- [ ] **Street 4 punch c${CYCLE} · ${minorItems.length} minor/nit items (${minorItems.map(x => x.id).join(', ')})** — fix each as listed in ${RVREL}/punch-list-c${CYCLE}.md (never by editing docs/street/; an item whose fix starts "re-run street-" is that re-run); done when each listed item's evidence no longer reproduces`)
const reason = !recOk ? 'record-mismatch' : pass ? '' : PREVIEW ? 'preview' : FORCE ? 'forced: ' + FORCE : MODE !== 'full' ? MODE : failing.join(', ')
return done({pass, reason, rounds, cycle: CYCLE, preview: PREVIEW, device_gate: DEVICE_GATE, gate, gate_path: gatePath,
  outputs: [RVREL + `/punch-list-c${CYCLE}.md`, RVREL + `/punch-list-c${CYCLE}.json`, RVREL + '/punch-list.md', RVREL + '/punch-list.json', RVREL + '/findings/', CAPREL + '/metrics.json', CAPREL + '/cited/', gatePath, RVREL + '/state/4-review.json'],
  owner_rulings_used: RUSED, street_rulings_used: SUSED,
  polish_note: `Street 4 c${CYCLE}: ${survivors.length} surviving (${nBlock} blocker, ${nMajor} major), bare-street ${viewsOk}/${JUDGE_VIEWS.length} views, device gate ${DEVICE_GATE}` + (recOk ? '' : `; record-mismatch: write the returned gate to ${gatePath} by hand (README §12)`),
  polish_inserts: inserts, polish_inserts_above: 'Street 4 · Review → punch list',
  changelog_line: `- docs: Street 4 — review c${CYCLE} (${pass ? 'pass' : 'fail'})`})
