export const meta = {
  name: 'living-2-plan',
  description: 'Living 2: turn the living bible into a living spec with build units in slices L0-L3 and Z; gate = cold-animator test',
  whenToUse: 'Run as the POLISH item "Living 2 · Planning → living spec" after docs/living/gates/1-research.json passed: Workflow({name:"living-2-plan", args:{date:"YYYY-MM-DD"}}). Docs-only. Returns reason "held" while a mobile item is open or a mobile or street tool runs.',
  phases: [
    {title: 'Preflight', detail: 'drift, re-anchor, the hold, the Living 1 chain (bible, cited rulings, stamps), ledger'},
    {title: 'Probes', detail: 'frozen probes written before any spec section; baked answers fixed in code'},
    {title: 'Sections', detail: 'twelve targeted section writers s01-s12 in parallel -> docs/living/spec/<sid>.{md,json}'},
    {title: 'Integrate', detail: 'opus/xhigh integrator -> living-spec.md/.json: units, checks, hook lines, accept template'},
    {title: 'Anchors', detail: 'every hook anchor and replaced line found once in maps-site/index.html; fixer'},
    {title: 'Red team', detail: 'one adversary on coexistence and the hold; one integrator patch'},
    {title: 'Cold-animator gate', detail: 'paired blind readers (sonnet/high + opus/high) on the spec alone; guess auditor; scoring in code'},
    {title: 'Fix', detail: 'spec fixer -> anchors -> readers -> auditor (<= maxRounds)'},
    {title: 'Record', detail: 'gates/2-plan.json, state/2-plan.json (checkpointed after Probes and Sections)'}
  ]
}
const JOB = 'living-2-plan'
// ==== living prelude v1 — derived from filigree prelude v1 via the street prelude (masked diff: tools/living-drift.js L1); keep byte-identical across the four living scripts ====
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
const OUT = String(A.outDir || 'docs/living').replace(/\/+$/, '')
if (OUT.includes('//') || OUT.split('/').some(s => s === '.' || s === '..')) die('args.outDir must not contain empty, . or .. segments')
const OUTABS = OUT.startsWith('/') ? OUT : REPO + '/' + OUT
const DOCS = REPO + '/docs/living'   // living static inputs (dossier, todo-inputs, rulings.json, README); filigree, street and mobile records are read-only (FIL, STD, MOB)
const underDocs = p => p === DOCS || p.startsWith(DOCS + '/')
if (MODE === 'full' && !underDocs(OUTABS)) die('full runs write the durable record: args.outDir must be docs/living or a subdirectory of it')
if (MODE === 'smoke' && (!OUT.startsWith('/') || OUTABS === REPO || OUTABS.startsWith(REPO + '/'))) die('smoke runs must pass an absolute args.outDir outside the repo (use the session scratchpad)')
const ROUNDS = A.maxRounds ?? 2
if (!Number.isInteger(ROUNDS) || ROUNDS < 0 || ROUNDS > 2) die('args.maxRounds must be an integer 0..2')
if (A.resume != null && typeof A.resume !== 'boolean') die('args.resume must be a boolean')
if (A.rulings != null && (typeof A.rulings !== 'object' || Array.isArray(A.rulings))) die('args.rulings must be a plain object')
const RESUME = A.resume !== false
const SHARED_ARGS = ['date', 'repo', 'outDir', 'mode', 'maxRounds', 'rulings', 'resume', 'force']
function checkArgs(extra) { for (const k of Object.keys(A)) if (!SHARED_ARGS.concat(extra || []).includes(k)) die('unknown arg ' + k) }   // every job body calls this first, listing only its own keys
if (A.force != null && JOB === 'living-1-research') die('args.force is not accepted by Living 1 (there is no earlier living gate to skip)')
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
  ['maps-site/index.html', 'function jFrame(', 1], ['maps-site/index.html', 'function jReduced(', 1], ['maps-site/index.html', 'jReduceMq', 1],
  ['maps-site/index.html', "getElementById('jbar-reduce')", 1], ['maps-site/index.html', 'forceReduced', 1], ['maps-site/index.html', "'pJTrail'", 1],
  ['maps-site/index.html', 'map.createPane(', 1], ['maps-site/index.html', 'function setHash(', 1], ['maps-site/index.html', 'Z_OPEN_MAX', 1],
  ['maps-site/index.html', 'function buildSeaLanes(', 1], ['maps-site/index.html', 'function registerCityOverlay(', 1], ['maps-site/index.html', 'window.ATLAS=', 1],
  ['maps-site/index.html', 'function handleHash(', 1], ['maps-site/index.html', 'JPPS', 1], ['maps-site/index.html', '@keyframes dashmove', 1],
  ['maps-site/index.html', '@keyframes copulse', 1], ['index.html', 'const darkHour =', 1], ['index.html', 'renderTod = (renderTod', 1],
  ['index.html', 'function routePos(', 1], ['index.html', 'function tickDragon', 1], ['index.html', 'window.ANNALS = {', 1],
  ['maps-site/index.html', '/*LC-HOOK*/', 0], ['maps-site/index.html', 'living=1', 0], ['maps-site/index.html', '/* FILIGREE */', 0], ['index.html', '/* STREET */', 0]
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
// ---- living config ----
const FIL = REPO + '/docs/filigree', STD = REPO + '/docs/street', MOB = REPO + '/docs/mobile'   // the other tracks' records: read-only for the whole living track
const FIL_CITED = ['R6', 'R10', 'R12', 'R13', 'R15', 'R16', 'R18', 'R22']   // cited by id; texts = RULINGS above (verbatim, living-drift L1) + docs/filigree/rulings.json overrides
const ST_CITED = ['ST1', 'ST3', 'ST4', 'ST7', 'ST18']   // cited by id; texts read live from street-1-research.js ST_RULINGS + docs/street/rulings.json overrides (living-drift L5)
if (A.rulings != null) die('args.rulings sets the filigree R1..R22 and is refused here: the living track reads R overrides only from docs/filigree/rulings.json; use args.livingRulings for LC ids')
const LC_RULINGS = {
  LC1: 'Default off: the living chart ships behind the hash param living=1; once it is set, setHash keeps it (one declared hook line). With it absent the atlas creates no living node, canvas, listener, rAF callback, request or layers row, so desktop identity (UG8) holds with no declared region. The layers row "The living chart" and the still-chart control render only under living=1. The owner flips the default only after Living 4 passes and an owner-run real-device pass.',
  LC2: 'One control, one state: one visible still-chart control stops every motion on the atlas at once (the living layer, journey playback and the playing route line). It writes the atlas\'s one reduced-motion state, jrn.forceReduced read through jReduced(), which already follows prefers-reduced-motion through jReduceMq and its change event; the #jbar-reduce box shows the same state. No second matchMedia and no second motion flag (WCAG 2.2.2).',
  LC3: 'Still frame: under the still chart, reduced motion or the capture\'s frozen virtual clock, the chart freezes on one fixed frame and keeps every piece of information: footprints as stamps along the walked route, caravan strings halted at their nearest halt, ships moored at their lane\'s nearer port, water and the dark-hour dim frozen outside the dark hour, creatures at rest, zoom effects instant. Every class and glyph of the moving chart stays.',
  LC4: 'Creatures: only canon-backed kinds move. Whales of the Loon Sea move only where Living 1 resolves a canon placement for that sea on the sheet (the atlas data holds none); coastal birds (inferred; the lexicon words leph, arbezeph, aurael) may move along coasts. Lugal is one still mark at the Fell Mountains stop of party-route.json, never flying and never named for the sim\'s dragon. Hoarwyrms and Witch-Birds are not shown; the Ponbar beasts are never shown. Dragon flocks and any other creature or behaviour canon does not give are absent unless an override names the creature, its place and its behaviour; such a creature carries a rumour mark (prov invented).',
  LC5: 'Footprints: they follow the party route (party-route.json) only, in session order, as alternating stamps along the arc length with one head and a fading tail on the presentation clock. A leg the atlas journey treats as a teleport is a gap, never a walk or an invented voyage; a sea leg is drawn only where party-route.json names a ship. No per-member tints. The head rests at Epēshu, where the party is.',
  LC6: 'Traffic: caravan strings on the named ways and ships on the sea lanes come from one seeded atlas function everywhere (inputs: a constant seed literal, class, id and the presentation clock; prov inferred, schedules and volumes invented), and inside the Epēshu window from the living traffic snapshot maps-site/living/traffic.json, exported once from the sim at seed epeshu and a fixed day by tools/living-measure.js --export-traffic and stamped with the index.html sha. Never wall-clock time; never the herald\'s tidings snapshot (R12): notices= is only read, for shut ways. Visible nouns come from a display map: the sim\'s ship kind reads mūskar (merchantman) on every lane; galley only where an LC6 override rules it.',
  LC7: 'Detail in 3D: the sim is the only 3D. The atlas reaches it by the zoom-through: inside the Epēshu window, zooming past the city band crossfades the city overlay into a Street frozen-view poster by the R6 threshold rule (instant under the still chart), then offers the step into the street (the sim\'s URL from the atlas #simLink href plus #s=epeshu&goto=<place>&street=1; never a relative index.html and never forwarding living=1). A landmark exhibit opens the same poster in its card, then the same step. No WebGL in maps-site; the three.js overlay (H1) exists only as an owner-gated spike page under docs/living/spike/ that is never served.',
  LC8: 'Frames: ambient motion draws at most 20 times per second on fine pointers and 15 on coarse pointers; one-shot motion (a route drawing itself, the crossfade) at most 30 on phones. Progress comes from the rAF timestamp with dt clamped to 100 ms. Zero living rAF callbacks while the page is hidden or the layer is off-screen, below its band, off, under a card or still.',
  LC9: 'Craft: motion stays slow (at most 24 css px per second on screen), low in contrast, under every name pane and out of every label box plus a 4 px halo; no region flips luminance more than 3 times a second and nothing alerts.',
  LC10: 'No rise: structures and glyphs appear by the R6 threshold rule (present at their threshold, any ease at most 0.25 zoom or 250 ms); no scale-pop and nothing fades in from nothing over more than 250 ms.',
  LC11: 'Dark hour: Tamar\'s dark hour is one whole-sheet dim of the base (at most 12% luminance, under every name pane) from the sim\'s closed form on the presentation day (one presentation day = 300 s, as the sim\'s renderTod); the still frame lies outside the dark hour. A travelling sweep is invented and absent unless overridden.',
  LC12: 'Determinism: motion is presentation only. Every glyph position is a pure function of (seed literal, class, id, snapshot day, presentation time); presentation time accumulates the rAF timestamp argument with dt clamped, so it freezes under the capture\'s virtual clock. Randomness comes only from keyed streams on the key lc:<class>:<id>:<k> (an xmur3 to mulberry32 copy inside maps-site/living.js). maps-site gains zero clock tokens (pattern W of docs/mobile/metrics.md §6), nothing names W.rng, and the atlas\'s xmur3, mulberry32, genCityCanvas, washMake and sampleCityMask are never called or changed.',
  LC13: 'Host: the living layer is one canvas inside an existing pane (pJTrail unless Living 2 proves it unfit, then another existing pane), kept in step by the Leaflet renderer scheme (a CSS transform during zoomanim, an exact redraw on zoomend); no createPane, no pane z change, no WebGL. Living code and data are lazy: maps-site/living.js and maps-site/living/**, hand-written with no build step, fetched only under living=1, versioned by ?v=; a failed fetch logs no console error and leaves the still chart.',
  LC14: 'Bytes: the first view gains +0 requests and at most 200 raw bytes of declared hook lines in maps-site/index.html (its size minus that of restore(maps-site/index.html)), declared under UG10; a literal +0 bytes would leave no way to read living=1. Lazy caps: living code at most 40 KB gzipped, the traffic snapshot 60 KB gzipped, the sea mask 32 KB, each poster 150 KB.',
  LC15: 'Select: a moving glyph is selectable: a pointer hit on the current or still frame opens a card (a caravan string: its way and the places it runs between; a ship: its lane and port; the footprints: the session stop), and a keyboard-reachable list names every glyph in view. Cards never assert canon the extract lacks; inferred traffic reads "seen on the way".',
  LC16: 'Words: the bronze-age Nīmlad voice (caravan string, halt, waystation, khophesh, mūskar, galley, the herald\'s tidings, still the chart, stir the chart). VOCAB_LC and the UG9 table-words list never appear in visible text. The player-visible strings are listed in docs/living/README.md §13, and only that list is voice-read.',
  LC17: 'The sim\'s dragon: in #s=epeshu the sim wakes a seeded dragon (a name drawn from six, lair W.peak, Myth on by default) while canon has one dragon, Lugal, gone into the Fell Mountains. It stays as it is until the owner rules (a) Myth off by default in the canon realm, (b) the canon realm shows no dragon (Myth off or the dragon dead) and the chronicle names Lugal as gone north to the Fell Mountains (atlas 782, 8, outside the sim\'s window), or (c) a chronicle line says this wyrm is not Lugal. The atlas never names the sim\'s dragon Lugal.'
}
const LC_FIXED = ['LC2', 'LC3', 'LC10', 'LC12', 'LC13']   // one control, the still frame, no rise, determinism, host: never overridable
const LC_GATED = ['LC4', 'LC7', 'LC17']   // owner-gated additions (an invented creature, the three.js spike, the sim dragon): absent unless an override names them
if (A.livingRulings != null && (typeof A.livingRulings !== 'object' || Array.isArray(A.livingRulings))) die('args.livingRulings must be a plain object')
for (const [k, v] of Object.entries(A.livingRulings || {})) { if (!Object.prototype.hasOwnProperty.call(LC_RULINGS, k)) die('unknown living ruling ' + k); if (LC_FIXED.includes(k)) die('living ruling ' + k + ' is a fixed constraint'); if (typeof v !== 'string' || !v.trim()) die('living ruling ' + k + ' must be a non-empty string') }
function lcRulingsMerge(fileOverrides) {   // args, then docs/living/rulings.json overrides (append-only: each starts with its default text), then the default
  const r = {}, used = {}, fo = (fileOverrides && typeof fileOverrides === 'object') ? fileOverrides : {}
  for (const k of Object.keys(LC_RULINGS)) {
    if (LC_FIXED.includes(k) && fo[k] != null) log('docs/living/rulings.json overrides fixed living ruling ' + k + ': ignored')
    const a = (A.livingRulings || {})[k], f = !LC_FIXED.includes(k) && typeof fo[k] === 'string' && fo[k].startsWith(LC_RULINGS[k]) ? fo[k] : null
    if (!LC_FIXED.includes(k) && fo[k] != null && !f) log('docs/living/rulings.json override of ' + k + ' does not start with its default text: ignored')
    r[k] = a || f || LC_RULINGS[k]; used[k] = a ? 'args' : f ? 'rulings.json' : 'default'
  }
  return {r, used}
}
const lowBudget = () => !!(budget && budget.total && budget.remaining() < ROUND_TOKENS)   // the filigree-1 idiom; each job declares its own ROUND_TOKENS; every extra round is gated `if (lowBudget()) { log('budget: round skipped'); break }`
const PORT = A.port ?? 0   // 0 = the tools bind an OS-assigned free port, so parallel runs never collide
if (!Number.isInteger(PORT) || (PORT !== 0 && (PORT < 1024 || PORT > 65535)) || PORT === 8544) die('args.port must be 0 or an integer 1024..65535 other than 8544 (8544 belongs to server.js)')
const V_BUST = Number(DATE.replace(/-/g, ''))
const LIVING_PARAM = 'living'   // LC1; the ST18 grammar (living-drift L8)
const KEY_IDIOM = "'lc:'+cls+':'+id+':'+k"   // LC12 keyed streams, inside maps-site/living.js only
const HOOK_MARK = '/*LC-HOOK*/'
const DEVICES = ['LC-footprints', 'LC-member-roads', 'LC-caravans', 'LC-ships', 'LC-barges', 'LC-traffic-weight', 'LC-water', 'LC-river-flow', 'LC-weather', 'LC-hearth-smoke', 'LC-dark-hour', 'LC-birds', 'LC-whales', 'LC-lugal', 'LC-dragon-flocks', 'LC-north-south-beasts', 'LC-route-draw', 'LC-select', 'LC-rise', 'LC-detail-3d', 'LC-exhibits']
const ASKS = ['footprints', 'traffic', 'creatures', 'water', 'exhibits', 'zoom_detail']   // the owner's six asks (docs/living/todo-inputs.json input.confirmed)
const CANON_TABLE = {'LC-footprints': 'inferred', 'LC-member-roads': 'invented', 'LC-caravans': 'inferred', 'LC-ships': 'inferred', 'LC-barges': 'inferred', 'LC-traffic-weight': 'inferred', 'LC-water': 'canon', 'LC-river-flow': 'canon', 'LC-weather': 'canon', 'LC-hearth-smoke': 'invented', 'LC-dark-hour': 'canon', 'LC-birds': 'inferred', 'LC-whales': 'canon', 'LC-lugal': 'canon', 'LC-dragon-flocks': 'invented', 'LC-north-south-beasts': 'invented-behaviour', 'LC-route-draw': 'inferred', 'LC-select': 'inferred', 'LC-rise': 'inferred', 'LC-detail-3d': 'canon', 'LC-exhibits': 'canon'}
const VOCAB_LC = new RegExp(VOCAB.source.replace(/\)\\b$/, '|curfews?|cars?|trucks?|bus(es)?|taxis?|automobiles?|motorcars?|railways?|locomotives?|trams?|stoplights?|traffic lights?|signals?|pedestrians?|crosswalks?|zebra crossings?|lane lines?|sidewalks?|toll booths?|police|petrol|neon|asphalt|tarmac|cogs?|galleons?|frigates?|caravels?|carracks?|sloops?|steam\\w*|engines?|trains?|planes?|airships?|minimap|fast travel|waypoints?)\\b'), 'i')
const JARGON_LC = /\b(tap|click|swipe|pinch|drawer|modal|menu|toggle|dismiss|app|download|install|offline mode|dark mode|theme|settings)\b/i   // UG9's table-words list, equal to tools/mobile-capture.js (living-drift L5)
const VOCAB_LC_RULE = `Banned vocabulary (case-insensitive regex ${VOCAB_LC.source}) and the UG9 words (regex ${JARGON_LC.source}) must not appear in new player-facing text, glyph or card labels, row labels or fiction names, except inside the sections "## Provenance" and "## Renames". Bronze-age words: caravan strings, halts and waystations, khophesh, mūskar or galley for ships, the herald's tidings, still the chart / stir the chart. Voice: bronze-age Nīmlad, the nine Kembar, years A.B.`
const LC_CLOCK_GREP = 'Math[.]random|Date[.]now|new Date[(]|Date[(]|Date[.]parse|performance[.]now|Intl[.]DateTimeFormat|crypto[.]getRandomValues|requestIdleCallback'   // pattern W of docs/mobile/metrics.md §6: zero occurrences in maps-site/living.js and maps-site/living/**
const RO_RULE_LC = `Read-only for you (never write, move or delete): ${REPO}/index.html, ${FIL}/**, ${STD}/**, ${MOB}/**, ${REPO}/.claude/**, ${REPO}/tools/filigree-*, ${REPO}/tools/street-*, ${REPO}/tools/mobile-*, ${REPO}/tools/build-offline-manifest.js, ${REPO}/server.js, ${REPO}/vendor/**. Never schedule reminders, triggers or wake-ups. Never start, stop or reuse a server on port 8544. Never start node tools/mobile-capture.js while another runs (pgrep -f 'tools/mobile-capture[.]js'): poll every 30 s at most 40 times (20 minutes); if it still runs, stop and return infra_error "capture busy" (never kill it).`
const PL = (body, blind) => P((blind ? '' : RO_RULE_LC + '\n') + body, blind)   // every living agent() prompt in a job body is PL(...); recordL keeps P
const MEASURE = REPO + '/tools/living-measure.js', CAPTURE = REPO + '/tools/mobile-capture.js', TREE_TOOL = REPO + '/tools/mobile-tree.js', LDRIFT = REPO + '/tools/living-drift.js', MANIFEST = REPO + '/tools/build-offline-manifest.js'
const SANDBOX_LC = `Sandbox recipe for the living track (CDNs are blocked; npm is not): every browser step goes through node ${CAPTURE} or node ${MEASURE}, which serve ${REPO} read-only with their own static server on --port ${PORT} (0 = an OS-assigned free port); never start, stop or reuse server.js on 8544. In a temp dir (mktemp -d) run npm pack leaflet@1.9.4 three@0.128.0 @fontsource/eb-garamond@5.3.0 @fontsource/lora@5.3.0 @fontsource/ibm-plex-mono@5.3.0 @fontsource/im-fell-english@5.3.0 and pass --cdn-dir <tmp>: the tools route **/leaflet@1.9.4/dist/* to <tmp>/leaflet/dist/<file> and **/three.js/r128/three.min.js to <tmp>/three/build/three.min.js and serve the Google Fonts hosts from the fontsource files. Playwright comes from NODE_PATH=/opt/node22/lib/node_modules; if its bundled browser is missing, launch Chromium with executablePath /opt/pw-browsers/chromium-1194/chrome-linux/chrome; never run playwright install. Every tools/mobile-capture.js capture passes --out and --shots-dir under ${OUTABS} (never docs/mobile/), and --accept always runs with --capture. A setup failure (port, browser, CDN) is an infra_error, never a living defect.`
const canonJ = v => Array.isArray(v) ? v.map(canonJ) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonJ(v[k])])) : v
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 } return h.toString(16).padStart(8, '0') }   // must equal fnv in tools/mobile-tree.js
const lenOk = r => { if (!r || r.ok !== true || !Number.isInteger(r.len)) return false; const t = JSON.stringify(canonJ(Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'ok' && k !== 'len' && k !== 'sum')))); return t.length === r.len && fnv(t) === r.sum }   // tools/mobile-tree.js prints len and sum over every other field: a relay that dropped or altered anything, even one hex digit, fails here
const DRIFT_TASK_LC = `Drift check (read-only): from ${REPO} run node tools/living-drift.js --json, then node tools/street-drift.js --json. Return {living: <the first stdout parsed: {ok, checks: [{id, ok, detail}]}>, street: <the second, same shape>}. A missing tool gives {ok: false, checks: [{id: "-", ok: false, detail: "<path> missing"}]} for its half.`
const HOLD_TASK_LC = `Hold read (write nothing): from ${REPO} run node tools/living-drift.js --hold and return its one stdout line parsed, every field unchanged (it carries len and sum; do not reformat, round or drop anything).`
const holdOf = (h, scope) => {   // computed in code from the --hold relay; scope: 'docs' (Living 2, 4), 'freeze' (Living 1), 'build' (Living 3 motion), 'zoom' (Living 3z)
  if (!lenOk(h)) return ['hold read died or mis-relayed']
  const p = h.polish || {}, f4 = (h.filigree || {}).f4, s4 = (h.street || {}).s4, why = []
  if ((h.busy || []).length) why.push('a mobile or street tool is running: ' + h.busy.slice(0, 2).join(' | '))
  if ((p.mobile_open || []).length) why.push('open mobile item(s): ' + p.mobile_open.slice(0, 3).join('; '))
  if (scope !== 'docs' && p.census_open === true) why.push('"Mobile later · census pin names on phones (A12 part b)" is unchecked')
  if (scope !== 'docs' && (p.fil_open || []).length) why.push((p.fil_open || []).length + ' open filigree fix item(s)')
  if ((scope === 'build' || scope === 'zoom') && !(f4 && f4.pass === true && f4.forced !== true)) why.push('the latest docs/filigree/gates/4-review-c<k>.json is not an unforced pass')
  if (scope === 'zoom' && !(s4 && s4.pass === true && s4.forced !== true)) why.push('the latest docs/street/gates/4-review-c<k>.json is not an unforced pass')
  if (scope === 'zoom' && (p.street_open || []).length) why.push((p.street_open || []).length + ' open street fix item(s)')
  if (scope === 'zoom' && p.continuity_checked !== true) why.push('"Sim ↔ atlas continuity" is unchecked')
  return why
}
const FIL_ST_ANCHOR_TASK = `Other tracks' anchors (read-only; a node script in a mktemp -d dir): for each of ${REPO}/.claude/workflows/filigree-1-research.js and ${REPO}/.claude/workflows/street-1-research.js take the text from the line that starts "const ANCHORS = [" through the next line that is exactly "]", evaluate it as an array literal (new Function("return " + text without the leading "const ANCHORS = ")), keep the entries whose flag is 1, and find each literal in ${REPO}/<path> with String.indexOf. Also report every line of ${REPO}/maps-site/index.html that contains "${HOOK_MARK}" and holds one of those literals. Return {literals: {"<literal>": "<path>:<line>" | null}, on_hook: ["<literal>", ...]}.`
// recordL = filigree-1's recordD with two substitutions (living-drift L4): its name, and M('triage') for M('mech'), because a record relays a 64-hex sha (haiku altered single digits, 2026-10-05)
const RECD = {type: 'object', properties: {path: {type: 'string'}, sha256: {type: 'string'}, pass: {type: 'boolean'}, criteria: {type: 'integer'}, canon_len: {type: 'integer'}, lens: {type: 'object', additionalProperties: {type: 'integer'}}}, required: ['path', 'sha256', 'pass', 'criteria', 'canon_len', 'lens']}
const lensOf = o => Object.fromEntries(Object.entries(o).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.length]))
async function recordL(rel, obj, label) {
  const r = await crit(P(`Write the JSON below VERBATIM (2-space indent, trailing newline) to ${OUTABS}/${rel}, creating parent directories. Re-read the file, JSON.parse it, and return {path, sha256 (sha256sum of the file), pass: parsed.pass === true, criteria: (parsed.criteria || []).length, canon_len: JSON.stringify(parsed).length, lens: {<each top-level key whose value is an array>: that array's length}}.\n\n${JSON.stringify(obj, null, 2)}`),
    {label: label || ('record ' + rel), phase: 'Record', schema: RECD, ...M('triage')})
  const want = lensOf(obj), got = (r && r.lens) || {}
  if (!r || !FILE_OK({sha256: r.sha256, parsed: true}) || r.pass !== (obj.pass === true) || r.criteria !== (obj.criteria || []).length || r.canon_len !== JSON.stringify(obj).length
    || Object.keys(want).length !== Object.keys(got).length || Object.keys(want).some(k => want[k] !== got[k])) { log('record-mismatch: ' + rel); return null }
  return r
}
// ---- end living config ----
// ==== end living prelude ====
// ---- Living 2 constants (design §2-§3) ----
checkArgs(['livingRulings'])
if (A.livingRulings != null && Object.keys(A.livingRulings).some(k => LC_FIXED.includes(k) || !Object.prototype.hasOwnProperty.call(LC_RULINGS, k))) die('args.livingRulings takes only the overridable LC ids: ' + Object.keys(LC_RULINGS).filter(k => !LC_FIXED.includes(k)).join(' '))
const IN = MODE === 'smoke' ? DOCS : OUTABS   // chain inputs: a smoke run reads the durable docs/living read-only and writes only under its outDir
const GATE1 = IN + '/gates/1-research.json', GATE2 = OUTABS + '/gates/2-plan.json', LEDGER = OUTABS + '/state/2-plan.json'
const BIBLE_MD = IN + '/living-bible.md', BIBLE_JSON = IN + '/living-bible.json', VIEWS_JSON = IN + '/gates/views.json', VIEW_DATA = IN + '/gates/view-data.json', L0 = IN + '/captures/L0.json'
const SPEC_MD = OUTABS + '/living-spec.md', SPEC_JSON = OUTABS + '/living-spec.json', SPEC_DIR = OUTABS + '/spec', COLD = OUTABS + '/cold', PROBES = OUTABS + '/gates/2-probes.json'
const SLICES = ['L0', 'L1', 'L2', 'L3', 'Z']
const SLICE_NAME = {L0: 'instrument and hooks', L1: 'the still chart, the clock and the dark hour', L2: 'routes and traffic', L3: 'sea, sky and creatures', Z: 'the zoom-through and exhibits'}
const ALLOWED_FILES = [/^maps-site\/living\.js$/, /^maps-site\/living\/[A-Za-z0-9._\/-]+$/, /^maps-site\/index\.html$/, /^tools\/living-[a-z-]+\.js$/, /^docs\/living\/(fixtures|accept)\/[A-Za-z0-9._\/-]+$/]
const NEVER_FILES = /^(index\.html|\.claude\/|docs\/(filigree|street|mobile)\/|tools\/(filigree|street|mobile)-|tools\/street-drift\.js|tools\/build-offline-manifest\.js|server\.js|vendor\/)/
const MANDATORY_CHECKS = ['off-identity', 'ug4-rescore', 'still-frame', 'moves', 'still-chart', 'stop', 'tokens', 'zoom-sync', 'appear', 'lazy-failure', 'bytes', 'voice', 'coexistence', 'phone-parity']
const CHECK_CMDS = /^(node tools\/mobile-capture\.js (--accept|--lint-accept) |node tools\/living-measure\.js |node tools\/living-drift\.js|node tools\/street-drift\.js|node tools\/build-offline-manifest\.js --atlas --check|node -e 'const fs=)/   // the last prefix admits the CLAUDE.md syntax one-liner without naming its module loader (no forbidden token in the script text)
const ACCEPT_GATES = ['UG1', 'UG2', 'UG3', 'UG6', 'UG7', 'UG8', 'UG10', 'UG11']
const WAIVE = {
  UG4: 'living track: the /* FILIGREE */ and /* STREET */ markers exist by design after Filigree 3 and Street 3; the anchor, drift and tithe halves are re-scored by living-3-build (GL.2)',
  UG5: 'atlas-only unit: index.html is byte-unchanged (GL.12 scores its sha against the reference)',
  UG9: 'living strings are listed in docs/living/README.md §13 and scored by living-measure --static (GL.2); with living absent no string is added'
}
const BAKED = {   // probe answers fixed by code and rulings, whatever the bible says
  'P-param': 'living', 'P-default': 'off', 'P-rise': 'none', 'P-dark': 'whole-sheet dim', 'P-fps-fine': 20, 'P-fps-coarse': 15,
  'P-fps-oneshot-phone': 30, 'P-dt-clamp-ms': 100, 'P-hash-keep': 'setHash keeps living=1', 'P-snapshot': 'maps-site/living/traffic.json',
  'P-notices': 'read only', 'P-3d': 'H2z then H2', 'P-hook-cap-raw': 200, 'P-ug4': 'waived', 'P-key': 'lc:<class>:<id>:<k>',
  'P-still-instant': 't0', 'P-ease-ms': 250, 'P-createpane': 0, 'P-clock-tokens': 0, 'P-webgl': 'none',
  'P-weather-source': 'seeded atlas function of place and snapshot day on the R13 fog function; no sim state'
}
const POST_NAMES = /\b(Mini Tokyo|Marauder|Game of Thrones|How to Train Your Dragon|Lombard|Collison|Azlen|Bay Atlas|TripsLayer|windy)\b/i   // allowed only under ## Provenance
const ROUND_TOKENS = 600000   // one fix round (≈ 11 agents) with headroom; read by the config's lowBudget()
const SECTIONS = [   // §5.2: one writer each; the integrator owns nothing a section owns
  {sid: 's01', role: 'judge', owns: ['/clock', '/determinism'], brief: `The presentation clock (the rAF timestamp argument, dt clamp 100 ms, stopped while hidden), keyed streams ${KEY_IDIOM} inside maps-site/living.js (an xmur3 -> mulberry32 copy under new names), the seed literal and the snapshot day, frozen under the capture's virtual clock; zero clock tokens; never W.rng or the five atlas functions (xmur3, mulberry32, genCityCanvas, washMake, sampleCityMask; LC12).`},
  {sid: 's02', role: 'judge', owns: ['/still'], brief: 'The one control and the one state (LC2): the row control writes jrn.forceReduced; journey playback, the route dash and the living layer read jReduced(); the still frame per class at t0 (LC3); WCAG 2.2.2 and 2.3.3; at least 44 px on coarse pointers.'},
  {sid: 's03', role: 'judge', owns: ['/host', '/loader', '/hook_lines', '/hash', '/restore'], brief: `The existing pane (LC13, from the bible), Renderer.js sync (zoomanim transform, zoomend redraw, 10% pad, DPR <= 2), the lazy loader (maps-site/living.js?v=), each hook {id, anchor, replaces, text} marked ${HOOK_MARK}, the setHash keep of ${LIVING_PARAM}=1, the restore rule, a failed fetch silent (UG2), raw growth <= 200 B (LC14).`},
  {sid: 's04', role: 'deep', owns: ['/devices/LC-footprints', '/devices/LC-route-draw', '/devices/LC-select'], brief: 'Footprints (LC5, teleport legs a gap), the route drawing itself (< 5 s, instant when still), selection and the keyboard list (LC15).'},
  {sid: 's05', role: 'deep', owns: ['/devices/LC-caravans', '/devices/LC-ships', '/devices/LC-traffic-weight', '/snapshot'], brief: 'The seeded atlas function, the living snapshot (--export-traffic, stamp, the staleness rule and its "Living data — re-cut the traffic snapshot" insert), halts (B-18), shut ways read from notices= (B-42), display nouns (LC6).'},
  {sid: 's06', role: 'deep', owns: ['/devices/LC-water', '/devices/LC-weather', '/devices/LC-dark-hour'], brief: 'Sea shimmer on maps-site/living/sea-mask.png (the sea-mask item), storm tracks (Ponbar north, late summer and autumn), the dark-hour dim (LC11), fog read-only (R13, B-37). Weather ownership: LC-weather is a seeded atlas function of (place, snapshot sim day) built on the R13 fog function; it reads no W.weather, no Street weather dial and no sim state, and adds none to the sim (Street owns the sim\'s sky: ST7, ST11, ST19); /devices/LC-weather/source states it.'},
  {sid: 's07', role: 'audit', owns: ['/devices/LC-birds', '/devices/LC-whales', '/devices/LC-lugal', '/gated'], brief: 'Birds on coasts, whales only where the bible placed the Loon Sea, Lugal\'s still mark at party-route.json index 4 (0-based: Fell Mountains); the gated set absent (LC4, LC17).'},
  {sid: 's08', role: 'judge', owns: ['/zoom'], brief: `Slice Z: the crossfade from Z_OPEN_MAX toward Z_STREET inside the window (R6 threshold, instant when still), posters shot with street=1 on by tools/living-posters.js driving the sim at the camera pose recorded in docs/street/gates/views.json for each view (never the pixels of docs/street/gates/view/SV*.jpg, which are street-off Street 1 fixtures), each recording the sha256 of views.json and of its pose entry, <= 150 KB; the step link built from the atlas #simLink href plus #s=epeshu&goto=<place>&street=1 (never a relative index.html, never forwarding ${LIVING_PARAM}=1), the step link grammar of "Sim ↔ atlas continuity", exhibits (the Epēshīn Forum first unless LC7 says otherwise).`},
  {sid: 's09', role: 'audit', owns: ['/budgets', '/stops'], brief: 'Draws per second per class and pointer, canvas ops per draw, gz bytes per lazy file, the phone delay <= +0.5 zoom, the stop table (hidden, off-screen, below band, layer off, card, still).'},
  {sid: 's10', role: 'audit', owns: ['/strings', '/row'], brief: `The layers row "The living chart" (only under ${LIVING_PARAM}=1), every visible string in one LC_STRINGS literal of living.js, VOCAB_LC and the UG9 words, the README §13 list.`},
  {sid: 's11', role: 'judge', owns: ['/slices', '/accept_template', '/on_template'], brief: 'Per slice /checks [{id, cmd, expect}] holding every MANDATORY_CHECKS id, commands matching CHECK_CMDS only; the accept template (ACCEPT_GATES, WAIVE verbatim, strings: [], declared_change_keys limited to the atlas page-byte keys the hook growth moves, declared_first_view_growth = the slice\'s cumulative hook bytes, +0 requests) and the on-state template for living-measure --lint-on.'},
  {sid: 's12', role: 'audit', owns: ['/prerequisites'], brief: '[{item, blocks, status: checked | open | missing, polish_title}] for the sea mask item (L3 water units), "Traced road network" (L2 caravans on the printed road), the river trace (later), Street 4 + "Sim ↔ atlas continuity" (Z), the traffic snapshot export (L2).'}
]

// ---- Living 2 local constants (each restates a design rule the code needs as data) ----
const BAKED_PTR = {   // where the spec must state each baked answer (the prober copies these; the owning section states the value there)
  'P-param': '/hash/param', 'P-default': '/row/default', 'P-rise': '/still/rise', 'P-dark': '/devices/LC-dark-hour/kind', 'P-fps-fine': '/budgets/draws_per_s/fine',
  'P-fps-coarse': '/budgets/draws_per_s/coarse', 'P-fps-oneshot-phone': '/budgets/draws_per_s/oneshot_phone', 'P-dt-clamp-ms': '/clock/dt_clamp_ms', 'P-hash-keep': '/hash/keep',
  'P-snapshot': '/snapshot/path', 'P-notices': '/snapshot/notices', 'P-3d': '/zoom/order', 'P-hook-cap-raw': '/budgets/hook_raw_bytes', 'P-ug4': '/accept_template/waive/UG4',
  'P-key': '/determinism/key', 'P-still-instant': '/still/instant', 'P-ease-ms': '/budgets/ease_ms', 'P-createpane': '/host/create_pane', 'P-clock-tokens': '/determinism/clock_tokens',
  'P-webgl': '/host/webgl', 'P-weather-source': '/devices/LC-weather/source'
}
const BAKED_KIND = {'P-param': 'enum', 'P-default': 'enum', 'P-rise': 'enum', 'P-ug4': 'enum', 'P-still-instant': 'enum', 'P-webgl': 'enum', 'P-dark': 'text', 'P-hash-keep': 'text', 'P-snapshot': 'text', 'P-notices': 'text', 'P-3d': 'text', 'P-key': 'text', 'P-weather-source': 'text'}   // every other baked probe is a number
const kindOfBaked = id => BAKED_KIND[id] || 'number'
const PROBE_KINDS = ['number', 'enum', 'pointer', 'list', 'text'], PROBE_SOURCES = ['bible', 'baked', 'ruling']
const PROBES_MIN = 30
const READER_PCT = 90
const UNITS_PER_SLICE = 8
const HOOK_RAW_MAX = 200   // LC14
const EASE_MAX = 250   // LC10
const CAPS = [   // G2.9: the summary's caps, read at the first path that holds a number (the spec shape names the first)
  {id: 'draws_per_s.fine', max: 20, paths: ['draws_per_s.fine', 'ambient_draws_per_s.fine', 'draws_fine']},
  {id: 'draws_per_s.coarse', max: 15, paths: ['draws_per_s.coarse', 'ambient_draws_per_s.coarse', 'draws_coarse']},
  {id: 'draws_per_s.oneshot_phone', max: 30, paths: ['draws_per_s.oneshot_phone', 'oneshot_draws_per_s_phone', 'draws_oneshot_phone']},
  {id: 'dt_clamp_ms', max: 100, min: 1, paths: ['dt_clamp_ms']},
  {id: 'speed_css_px_s', max: 24, paths: ['speed_css_px_s', 'speed_px_s', 'speed']},
  {id: 'flips_per_s', max: 3, paths: ['flips_per_s', 'flips']},
  {id: 'dark_dim_max', max: 0.12, paths: ['dark_dim_max', 'dim_max', 'dim']},
  {id: 'lazy_gz_kb.code', max: 40, paths: ['lazy_gz_kb.code', 'code_kb_gz']},
  {id: 'lazy_gz_kb.traffic', max: 60, paths: ['lazy_gz_kb.traffic', 'traffic_kb_gz']},
  {id: 'sea_mask_kb', max: 32, paths: ['sea_mask_kb']},
  {id: 'poster_kb', max: 150, paths: ['poster_kb']}
]
const PREREQS = [   // G2.14: each must be listed in /prerequisites with a status (matched on item + polish_title, normalised)
  {id: 'the sea mask item', re: /sea.?mask/}, {id: 'Traced road network', re: /traced road network/}, {id: 'the river trace', re: /river/},
  {id: 'Street 4', re: /street 4/}, {id: 'Sim ↔ atlas continuity', re: /atlas continuity/}
]
const PREREQ_STATUS = ['checked', 'open', 'missing']
const FIXABLE = ['G2.1', 'G2.2', 'G2.3', 'G2.4', 'G2.5', 'G2.6', 'G2.7', 'G2.8', 'G2.9', 'G2.10', 'G2.11', 'G2.12', 'G2.13', 'G2.14']   // a spec fix can move these; G2.15 (probe order, reader blindness) it cannot
const LC_ANSWER_IDS = Object.keys(LC_RULINGS).filter(k => !LC_FIXED.includes(k))   // the non-fixed rulings Living 2 reads as answers (LC1 LC4 LC5 LC6 LC7 LC8 LC9 LC11 LC14 LC15 LC16 LC17)
const HEX64 = /^[0-9a-f]{64}$/
const IN_REL = MODE === 'smoke' ? 'docs/living' : OUT   // repo-relative (or absolute) prefix of the chain inputs for the records
const SHA_KEYS = ['index', 'atlas', 'maps_other', 'docs_filigree', 'docs_street', 'docs_mobile', 'workflows', 'tools_other']
const BOUND = 2 * 3 + 2 + SECTIONS.length + (2 + 2) + (1 + 2 + 1) + (2 + 2 + 2) + (2 * 2 + 2) + ROUNDS * (2 + 2 + 1 + 2 * 2 + 2) + 2 * (1 + 2 + 2)   // §8: crit agents twice; 72 at maxRounds 2 (README §11 cap 80)
const POLISH_ABOVE = 'Living 3 · Implementation'

// ---- schemas (design §4) ----
const S = {type: 'string'}, B = {type: 'boolean'}, I = {type: 'integer'}, SA = {type: 'array', items: S}, OBJ = {type: 'object'}
const PRE2 = {type: 'object', properties: {missing: SA, anchors: OBJ, chain: {type: 'object', properties: {gate1: OBJ, bible_md_sha: S, bible_json_sha: S, stamps_now: OBJ, cited_now: OBJ}, required: ['gate1', 'bible_md_sha', 'bible_json_sha', 'stamps_now', 'cited_now']}, overrides: OBJ, ledger: OBJ, gate_prev: OBJ, probes_file: OBJ}, required: ['missing', 'anchors', 'chain', 'overrides', 'ledger', 'gate_prev', 'probes_file']}
const HOLD = {type: 'object', additionalProperties: true, properties: {ok: B, len: I, sum: S}, required: ['ok', 'len', 'sum']}
const DRIFT = {type: 'object', properties: {living: OBJ, street: OBJ}, required: ['living', 'street']}
const PROBE = {type: 'object', properties: {id: S, q: S, kind: {type: 'string', enum: ['number', 'enum', 'pointer', 'list', 'text']}, source: {type: 'string', enum: ['bible', 'baked', 'ruling']}, expected_json: S, spec_pointer: S, cite: S}, required: ['id', 'q', 'kind', 'source', 'expected_json', 'spec_pointer', 'cite']}   // expected_json: the answer as JSON text, JSON.parse'd in code before the compare (every property typed)
const PROBES_OUT = {type: 'object', properties: {path: S, sha256: S, parsed: B, probes: {type: 'array', items: PROBE}}, required: ['path', 'sha256', 'parsed', 'probes']}
const SEC = {type: 'object', properties: {sid: S, md: OBJ, json: OBJ, owns: SA, rules_n: I}, required: ['sid', 'md', 'json', 'owns', 'rules_n']}   // md/json = {path, sha256, parsed}
const SPEC = {type: 'object', properties: {md: OBJ, json: OBJ, counts: {type: 'object', properties: {units_n: I, rules_n: I, checks_n: I, hooks_n: I}, required: ['units_n', 'rules_n', 'checks_n', 'hooks_n']}, canonical_len: I}, required: ['md', 'json', 'counts', 'canonical_len']}
const SPEC_READ = {type: 'object', additionalProperties: true, properties: {ok: B, len: I, sum: S}, required: ['ok', 'len', 'sum']}   // node tools/living-measure.js --spec-summary SPEC_JSON --bible BIBLE_JSON: units[{id, slice, files, kind, depends_on, acceptance_n, acceptance_ok}], rules[{id, covers}], bible_must[], slices{S:{check_ids, cmds}}, hook_lines[{id, anchor, replaces, text_len, replaces_len, marked}], hash, caps, eases, rise_rules, gated_units, accept_template, strings, prerequisites, md_post_names, md_vocab_hits, counts
const ANCH2 = {type: 'object', properties: {hooks: {type: 'array', items: {type: 'object', properties: {id: S, anchor_n: I, replaces_n: I, fil_st_literal: B}, required: ['id', 'anchor_n', 'replaces_n', 'fil_st_literal']}}, lint_exit: I}, required: ['hooks', 'lint_exit']}
const RED = {type: 'object', properties: {contradictions: {type: 'array', items: {type: 'object', properties: {a: S, b: S, why: S, fix: S}, required: ['a', 'b', 'why', 'fix']}}}, required: ['contradictions']}
const READ = {type: 'object', properties: {answers: {type: 'array', items: {type: 'object', properties: {id: S, answer_json: S, schema_path: S}, required: ['id', 'answer_json', 'schema_path']}}, files_read: SA}, required: ['answers', 'files_read']}
const AUDIT = {type: 'object', additionalProperties: true, properties: {ok: B, len: I, sum: S}, required: ['ok', 'len', 'sum']}   // --resolve-pointers SPEC_JSON <answers>: resolved{reader:{id: bool}}, values{reader:{id: value}}, spec_ptr{probe id: bool}
const FIXED = {type: 'object', properties: {md: OBJ, json: OBJ, fixed: SA}, required: ['md', 'json', 'fixed']}

// ---- small helpers ----
const J = v => JSON.stringify(v)
const arr = x => Array.isArray(x) ? x : []
const obj = x => (x && typeof x === 'object' && !Array.isArray(x)) ? x : {}
const same = (a, b) => JSON.stringify(canonJ(a === undefined ? null : a)) === JSON.stringify(canonJ(b === undefined ? null : b))
const toolErr = x => !!x && x.ok === false   // a tool's own {"ok":false,...} line (relayed with len -1)
const oneLine = s => String(s ?? '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim().slice(0, 140)
const pct = (k, n) => n ? Math.round(1000 * k / n) / 10 : 0
const isNum = v => typeof v === 'number' && Number.isFinite(v)
const getPath = (o, p) => p.split('.').reduce((c, k) => (c && typeof c === 'object') ? c[k] : undefined, o)
const parseJ = t => { try { return {ok: true, v: JSON.parse(t)} } catch (e) { return {ok: false, v: undefined} } }
async function relay(p, o) {   // a tool-line relay: one fresh agent when the first dies or mis-relays (lenOk); counts like crit()
  const a = await agent(p, o)
  if (a && (lenOk(a) || toolErr(a))) return a
  log((a ? 'mis-relayed: ' : 'agent died: ') + o.label + '; one fresh relay')
  return agent(p, {...o, label: o.label + ' (retry)'})
}
const driftIds = d => ['living', 'street'].flatMap(k => arr(obj(obj(d)[k]).checks).filter(c => c && !c.ok).map(c => k + ' ' + c.id + (c.detail ? ' (' + String(c.detail).slice(0, 80) + ')' : ''))).join('; ') || 'no drift report'
const LINE_RULE = 'Return the tool\'s one stdout JSON line parsed, every field unchanged (it carries len and sum; do not reformat, round, re-sort or drop anything). If it printed {"ok":false,...} without len/sum, return that object with len: -1 and sum: "" added; if it printed nothing parseable, return {ok: false, error: "<last stderr line>", len: -1, sum: ""}.'
const DET_RULE_LC = `Determinism (LC12, LC13): motion is presentation only. Presentation time accumulates the rAF timestamp argument with dt clamped to 100 ms, so it freezes under the capture's virtual clock; randomness only from keyed streams ${KEY_IDIOM} (an xmur3 to mulberry32 copy inside maps-site/living.js); positions are pure functions of (seed literal, class, id, snapshot day, presentation time); zero clock tokens (grep -E '${LC_CLOCK_GREP}') in maps-site/living.js and maps-site/living/**; no new sim state, no createPane, no WebGL, never a notices= write; the hook marker is ${HOOK_MARK} and the param is ${LIVING_PARAM}=1.`
const POST_RULE = `Names of the source posts and their tools (case-insensitive regex ${POST_NAMES.source}) appear only under a final "## Provenance" section of the md and in no string of the json.`

// ---- P0 Preflight (parallel: preflight, hold, drift) ----
phase('Preflight')
const INPUTS = [BIBLE_MD, BIBLE_JSON, VIEWS_JSON, VIEW_DATA, L0, DOCS + '/rulings.json', DOCS + '/todo-inputs.json', MEASURE, CAPTURE, LDRIFT]
const PREFLIGHT_TASK = `Preflight for Living 2 (read-only: write nothing outside a mktemp -d dir; a node script for every JSON read and every sha256sum).
A. anchors: ${ANCHOR_TASK}
B. missing = every one of these that does not exist: ${INPUTS.join(' ; ')}.
C. chain:
 - gate1 from ${GATE1}: {exists (present and parses), pass: parsed.pass === true, mode: parsed.mode or "", forced_by: parsed.forced_by or null, artifacts: parsed.artifacts (verbatim; [] when absent), stamps: parsed.stamps or {}, cited: parsed.cited or {}}; absent or unparsable: {exists: false, pass: false, mode: "", forced_by: null, artifacts: [], stamps: {}, cited: {}}.
 - bible_md_sha, bible_json_sha = sha256sum of ${BIBLE_MD} and ${BIBLE_JSON} ("" when absent).
 - stamps_now = {sheet_spec, density_bible, filigree_views, mobile_capture, mobile_tree}: sha256sum of ${FIL}/sheet-spec.json, ${FIL}/density-bible.json, ${FIL}/gates/views.json, ${CAPTURE}, ${TREE_TOOL} ("" when absent).
 - cited_now = {st: {${ST_CITED.join(', ')}: <merged text>}}: read ${REPO}/.claude/workflows/street-1-research.js, take the text from the line that starts "const ST_RULINGS = {" through the next line that is exactly "}", evaluate it as an object literal (new Function("return " + text without the leading "const ST_RULINGS = ")), then for each key of the "overrides" object of ${STD}/rulings.json (absent = {}) that is a non-empty string use it in place of the default; only those five ids.
D. overrides = {lc: the "overrides" object of ${DOCS}/rulings.json, fil: the "overrides" object of ${FIL}/rulings.json} ({} when a file or its key is absent; string values only).
E. ledger from ${LEDGER} if it parses: {seq: parsed.seq or 0, probes: parsed.probes (with sha_ok: the file at its path exists and sha256sum equals its sha256) or null, sections: for each entry of parsed.sections {sid, md, md_sha, json, json_sha, seq, stamp} copied plus sha_ok (both files exist and re-hash to md_sha and json_sha)}. Absent or unparsable: {seq: 0, probes: null, sections: []}.
F. gate_prev from ${GATE2} if it parses: {exists: true, pass: parsed.pass === true, mode: parsed.mode or "", forced: parsed.forced_by != null, bible_sha256: parsed.bible_sha256 or "", bible_md_sha256: parsed.bible_md_sha256 or "", rulings_used: parsed.rulings_stamp or {}, artifacts_ok: every parsed.artifacts entry names a file (repo-relative to ${REPO} or absolute) that exists and whose sha256sum equals its sha256 (false when the list is empty or any entry is missing or differs)}. Absent: {exists: false}.
G. probes_file from ${PROBES} if it exists: {exists: true, parsed (JSON.parse succeeds), sha256 (sha256sum of the file), frozen: parsed.frozen === true, bible_sha256: parsed.bible_sha256 or "", rulings_used: parsed.rulings_used or {}, probes: parsed.probes VERBATIM (every field of every probe; [] when absent)}. Absent: {exists: false}.
Return {missing, anchors (the map of A), chain: {gate1, bible_md_sha, bible_json_sha, stamps_now, cited_now}, overrides, ledger, gate_prev, probes_file}.`
const [pre, hold, drift] = await parallel([
  () => crit(PL(PREFLIGHT_TASK), {label: 'preflight', phase: 'Preflight', schema: PRE2, ...M('triage')}),
  () => crit(PL(HOLD_TASK_LC), {label: 'hold', phase: 'Preflight', schema: HOLD, ...M('triage')}),
  () => crit(PL(DRIFT_TASK_LC), {label: 'drift', phase: 'Preflight', schema: DRIFT, ...M('triage')})
])
for (const [x, l] of [[pre, 'preflight'], [hold, 'hold'], [drift, 'drift']]) if (!x) return done({reason: 'agent died: ' + l, agents_bound: BOUND, polish_inserts_above: POLISH_ABOVE})
const lost = anchorsLost(pre.anchors)
if (lost.length) die('anchor lost: ' + lost.join('; '))
if (obj(drift.living).ok !== true || obj(drift.street).ok !== true) die('prelude drift: ' + driftIds(drift))
const missing = arr(pre.missing)
const CH = obj(pre.chain), G1 = obj(CH.gate1), heldBy = holdOf(hold, 'docs')
const LCR = lcRulingsMerge(obj(pre.overrides).lc), FILR = rulingsMerge(obj(pre.overrides).fil)
const RUSED = {lc: LCR.used, fil: Object.fromEntries(FIL_CITED.map(k => [k, FILR.used[k]]))}
const BSHA = HEX64.test(CH.bible_json_sha || '') ? CH.bible_json_sha : '', BMDSHA = HEX64.test(CH.bible_md_sha || '') ? CH.bible_md_sha : ''
const artSha = suffix => (arr(G1.artifacts).find(a => a && typeof a.path === 'string' && a.path.endsWith(suffix)) || {}).sha256 || ''
const filNow = Object.fromEntries(FIL_CITED.map(k => [k, FILR.r[k]])), stNow = obj(obj(CH.cited_now).st), cited1 = obj(G1.cited)
const citedChanged = FIL_CITED.filter(k => obj(cited1.fil)[k] !== filNow[k]).concat(ST_CITED.filter(k => obj(cited1.st)[k] !== stNow[k]))
const chainWhy = [
  !(G1.exists === true && G1.pass === true && G1.mode === 'full' && !G1.forced_by) ? 'planning must not start before the living bible exists: docs/living/gates/1-research.json is not a full unforced pass' : '',
  G1.exists === true && !(BSHA && BMDSHA && artSha('living-bible.json') === BSHA && artSha('living-bible.md') === BMDSHA) ? 'planning must not start before the living bible exists: the bible changed since Living 1; re-run living-1-research' : '',
  G1.exists === true && obj(CH.stamps_now).density_bible !== obj(G1.stamps).density_bible ? 'the filigree density bible changed since Living 1; re-run living-1-research' : '',
  G1.exists === true && citedChanged.length ? 'the cited rulings changed since Living 1 (' + citedChanged.join(', ') + '); re-run living-1-research' : ''].filter(Boolean)
const chainOk = !chainWhy.length && !missing.length
if (MODE === 'plan') {
  return done({reason: 'plan', agents_bound: BOUND, chain_ok: chainOk, chain: chainWhy, missing, held_by: heldBy, sections: SECTIONS.map(s => s.sid), owner_rulings_used: RUSED, polish_inserts_above: POLISH_ABOVE,
    plan: {sections: SECTIONS.map(s => s.sid), slices: SLICES, rounds: ROUNDS, probes_min: PROBES_MIN, baked: Object.keys(BAKED).length},
    polish_note: `plan: ${SECTIONS.length} sections, >= ${PROBES_MIN} frozen probes (${Object.keys(BAKED).length} baked), at most ${BOUND} agents including crit() retries (cap 80)` + (chainOk ? '' : '; chain not met: ' + chainWhy.concat(missing.length ? ['missing ' + missing.length + ' input(s)'] : []).join('; ')) + (heldBy.length ? '; held: ' + heldBy[0] : '')})
}
if (missing.length) die('missing inputs: ' + missing.join(', '))
if (heldBy.length) return done({reason: 'held', held_by: heldBy, agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: POLISH_ABOVE, polish_note: 'Living 2: held (' + heldBy[0] + '); no release'})
if (!FORCE && chainWhy.length) die(chainWhy[0])
if (FORCE && chainWhy.length) log('chain skipped (forced: ' + FORCE + '): ' + chainWhy.join('; '))
const stampDiff = ['sheet_spec', 'filigree_views', 'mobile_capture', 'mobile_tree'].filter(k => obj(CH.stamps_now)[k] !== obj(G1.stamps)[k])
const RST = {stamp: 'lc:' + fnv(rulingText(LCR.r, Object.keys(LC_RULINGS)) + '\n' + rulingText(FILR.r, FIL_CITED) + '\n' + ST_CITED.map(k => k + ': ' + stNow[k]).join('\n')), used: LCR.used}   // the rulings a probe or section was written against
const GP = obj(pre.gate_prev)
const OUTPUTS = [OUT + '/living-spec.md', OUT + '/living-spec.json', OUT + '/spec/', OUT + '/gates/2-probes.json', OUT + '/cold/', OUT + '/gates/2-plan.json', OUT + '/state/2-plan.json']
if (RESUME && MODE === 'full' && !FORCE && GP.exists === true && GP.pass === true && GP.mode === 'full' && GP.forced !== true && GP.artifacts_ok === true
  && !!BSHA && GP.bible_sha256 === BSHA && GP.bible_md_sha256 === BMDSHA && same(GP.rulings_used, RST)) {
  return done({pass: true, reason: 'already passed: gate pass:true, the living bible and the rulings are unchanged and the spec, probes and bible files re-hash; nothing re-run', agents_bound: BOUND,
    gate_path: OUT + '/gates/2-plan.json', outputs: OUTPUTS, owner_rulings_used: RUSED, polish_inserts_above: POLISH_ABOVE,
    polish_note: 'Living 2 already passed on an unchanged living bible; the spec is untouched', changelog_line: ''})
}
const gaps = []
if (stampDiff.length) gaps.push('Living 1 stamps changed since its gate (informational; only the density bible blocks): ' + stampDiff.join(', '))
const RULES_TEXT = `Living rulings (merged; the non-fixed ones ${LC_ANSWER_IDS.join(' ')} may carry overrides and are read as answers; LC2, LC3, LC10, LC12, LC13 are fixed constraints):
${rulingText(LCR.r, Object.keys(LC_RULINGS))}
Cited filigree and street rulings (read-only):
${rulingText(FILR.r, FIL_CITED)}
${ST_CITED.map(k => k + ': ' + stNow[k]).join('\n')}`

// ---- ledger (checkpointed after Probes and after Sections; resume reads it) ----
const LG = obj(pre.ledger)
let SEQ = Number.isInteger(LG.seq) ? LG.seq : 0
let PROBE_CK = null   // {sha256, seq, bible_sha256, rulings_used, ok}: the probe checkpoint as the ledger holds it
let secKept = []   // [{sid, md, md_sha, json, json_sha, seq, stamp}]
let SEC_CK = false, specShas = {md: '', json: ''}
const ledgerObj = () => ({job: JOB, date: DATE, seq: SEQ, bible_sha256: BSHA, rulings_used: RST,
  probes: PROBE_CK ? {path: PROBES, sha256: PROBE_CK.sha256, seq: PROBE_CK.seq, bible_sha256: PROBE_CK.bible_sha256, rulings_used: PROBE_CK.rulings_used} : null,
  sections: secKept, spec: specShas})
async function checkpoint(why) { return !!(await recordL('state/2-plan.json', ledgerObj(), 'record state/2-plan.json (' + why + ')')) }
const secStamp = s => 'sec:' + fnv([BSHA, RST.stamp, J(s)].join('|'))   // a section resumes only against the bible, rulings and definition it was written for

// ---- P1 Probes (frozen before any section; regenerated only with resume:false) ----
phase('Probes')
const PF = obj(pre.probes_file)
const probeFails = (ps, sha) => {   // scored in code from the probes array (never from the writer's claims)
  const f = []
  if (!HEX64.test(sha || '')) f.push('sha256 not 64-hex')
  const list = arr(ps).filter(Boolean), ids = list.map(p => p.id)
  if (list.length < PROBES_MIN) f.push(`need >= ${PROBES_MIN} probes, got ${list.length}`)
  if (new Set(ids).size !== ids.length) f.push('duplicate probe ids')
  for (const p of list) {
    if (typeof p.q !== 'string' || !p.q.trim()) f.push(`${p.id}: empty question`)
    if (!PROBE_KINDS.includes(p.kind)) f.push(`${p.id}: kind ${J(p.kind)}`)
    if (!PROBE_SOURCES.includes(p.source)) f.push(`${p.id}: source ${J(p.source)}`)
    if (typeof p.spec_pointer !== 'string' || !p.spec_pointer.startsWith('/')) f.push(`${p.id}: spec_pointer ${J(p.spec_pointer)} is not a JSON pointer`)
    if (!parseJ(String(p.expected_json)).ok) f.push(`${p.id}: expected_json does not parse`)
  }
  for (const [k, v] of Object.entries(BAKED)) {
    const p = list.find(x => x.id === k)
    if (!p) { f.push('missing baked probe ' + k); continue }
    const e = parseJ(String(p.expected_json))
    if (p.source !== 'baked') f.push(`${k}: source ${J(p.source)} (want baked)`)
    if (e.ok && !same(e.v, v)) f.push(`${k}: expected ${String(p.expected_json).slice(0, 60)} != ${J(v)}`)
    if (p.spec_pointer !== BAKED_PTR[k]) f.push(`${k}: spec_pointer ${J(p.spec_pointer)} (want ${BAKED_PTR[k]})`)
  }
  return f
}
const invalid = f => die('gates/2-probes.json is invalid (' + f.slice(0, 6).join('; ') + '); delete it and rerun with resume:false')
const pfFresh = PF.exists === true && PF.parsed === true && PF.frozen === true && !!BSHA && PF.bible_sha256 === BSHA && same(PF.rulings_used, RST)
let probes = null, PROBES_SHA = ''
if (RESUME && PF.exists === true && pfFresh) {
  const f = probeFails(PF.probes, PF.sha256)
  if (f.length) invalid(f)
  probes = arr(PF.probes).filter(Boolean); PROBES_SHA = PF.sha256
  const lp = obj(LG.probes)
  PROBE_CK = lp.sha_ok === true && lp.sha256 === PF.sha256 && Number.isInteger(lp.seq) ? {sha256: PF.sha256, seq: lp.seq, bible_sha256: BSHA, rulings_used: RST, ok: true} : null
  if (!PROBE_CK) {   // a frozen file the ledger does not hold yet: checkpoint it now, before any section
    SEQ += 1
    PROBE_CK = {sha256: PF.sha256, seq: SEQ, bible_sha256: BSHA, rulings_used: RST, ok: false}
    PROBE_CK.ok = await checkpoint('probes')
    if (!PROBE_CK.ok) gaps.push('ledger checkpoint (probes) not recorded: G2.15 cannot show the probes came first')
  }
  log(`probes resumed (frozen, bible and rulings unchanged): ${probes.length}`)
} else {
  if (RESUME && PF.exists === true && !pfFresh) {
    if (MODE === 'full') invalid([PF.parsed !== true ? 'does not parse' : PF.frozen !== true ? 'not frozen' : 'stale: bible or rulings changed'])
    log('probes stale (' + MODE + ' run): rewritten')
  }
  if (!RESUME && PF.exists === true) log('resume:false: the frozen probes are regenerated')
  const BAKED_LIST = Object.entries(BAKED).map(([id, v]) => ({id, kind: kindOfBaked(id), source: 'baked', expected_json: J(v), spec_pointer: BAKED_PTR[id]}))
  const pw = await crit(PL(`Freeze the cold-animator probes BEFORE the living spec exists. You never see a spec: do not open ${SPEC_MD}, ${SPEC_JSON}, anything under ${SPEC_DIR}/ or ${COLD}/ (ignore them if present).
Read ONLY: the living bible ${BIBLE_MD} and ${BIBLE_JSON}, the frozen views ${VIEWS_JSON} and ${VIEW_DATA}, and the rulings below.
Write ${PROBES} (create the directory) with a node script, 2-space indent: {"date": "${DATE}", "frozen": true, "bible_sha256": "${BSHA}", "rulings_used": ${J(RST)}, "probes": [...]} (bible_sha256 and rulings_used exactly as given).
- At least ${PROBES_MIN} probes, ids unique; each {id, q, kind (${PROBE_KINDS.join(' | ')}), source (${PROBE_SOURCES.join(' | ')}), expected_json (the answer as JSON text: a number as 20, a string as "\\"off\\"", a list as "[\\"a\\",\\"b\\"]"), spec_pointer (the RFC 6901 pointer into living-spec.json where the spec must state the answer), cite (the bible rule id, device id or LC id that settles it)}.
- Baked probes, with exactly these ids, kinds, sources, expected_json and spec_pointer (write q yourself; keep its meaning): ${J(BAKED_LIST)}
- Bible probes (source bible, or ruling for a non-fixed LC ruling's answer): answerable in closed form from the bible alone (a pointer, number, enum or list): device slices, bands, still frames, budgets per class, the owner gate of a device, the hosting pane, the snapshot day, the sea-mask and river dependencies. Each with the spec_pointer where the spec must answer it, inside the spec shape below (e.g. /devices/LC-footprints/still, /budgets/draws_per_s/coarse, /hook_lines).
- A reader sees only id, q and kind and is scored by the compare of its kind (number within 1e-9, enum and pointer exact, list as a set, text after lowercasing and folding punctuation), so q states the answer format (units for numbers; the exact tokens for an enum).
Spec shape (pointer targets only): clock, determinism, still, host, loader, hash, restore, devices/<LC id>/{slice, still, budget, kind, source, rules}, snapshot, zoom, budgets, stops, strings, row, gated, hook_lines, accept_template, on_template, slices/<L0..L3|Z>/checks, units, prerequisites.
${RULES_TEXT}
${READBACK.replace('return {path, sha256 (sha256sum of the file), parsed: true}', 'return {path, sha256 (sha256sum of the file), parsed: true, probes (the probes array VERBATIM, every field of every probe)}')}`), {label: 'prober', phase: 'Probes', schema: PROBES_OUT, ...M('judge')})
  if (!pw || !FILE_OK(pw)) return done({reason: 'agent died: prober', agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: POLISH_ABOVE})
  const f = probeFails(pw.probes, pw.sha256)
  if (f.length) invalid(f)
  probes = arr(pw.probes).filter(Boolean); PROBES_SHA = pw.sha256
  SEQ += 1
  PROBE_CK = {sha256: PROBES_SHA, seq: SEQ, bible_sha256: BSHA, rulings_used: RST, ok: false}
  PROBE_CK.ok = await checkpoint('probes')
  if (!PROBE_CK.ok) gaps.push('ledger checkpoint (probes) not recorded: G2.15 cannot show the probes came first')
  log(`probes written and frozen: ${probes.length}`)
}
const probeById = Object.fromEntries(probes.map(p => [p.id, p]))
const probeKind = p => Object.prototype.hasOwnProperty.call(BAKED, p.id) ? kindOfBaked(p.id) : p.kind
const QUESTIONS = probes.map(p => ({id: p.id, q: p.q, kind: probeKind(p)}))   // never the expected answers (the readers are blind)

// ---- P2 Sections ----
phase('Sections')
const SPEC_SHAPE = `${SPEC_JSON} (exact shape; a pointer named here holds exactly this):
{date: "${DATE}", bible_sha256: "${BSHA}", rulings_used: ${J(LCR.used)}, rules: [{id: "LS-01", text, covers: [bible rule ids]}],
 clock: {source: "rAF timestamp argument", dt_clamp_ms, hidden: "stopped", ...}, determinism: {key: "lc:<class>:<id>:<k>", idiom: ${J(KEY_IDIOM)}, seed_literal, snapshot_day, clock_tokens: 0, never: [...]},
 still: {control, state, instant: "t0", rise: "none", classes: {<device id>: <its still frame>}}, host: {pane, z, create_pane: 0, webgl: "none", sync}, loader: {path, version_param},
 hash: {param: "${LIVING_PARAM}", keep: "setHash keeps ${LIVING_PARAM}=1", keep_hook: "<the id of the hook line that keeps it>"}, restore,
 devices: {<LC id>: {slice, kind, rules: [], still, budget: {draws_per_s, ops, bytes_gz}, source?}}, snapshot: {path, export_cmd, stamp, notices: "read only", staleness}, zoom: {order: "H2z then H2", ...},
 budgets: {draws_per_s: {fine, coarse, oneshot_phone}, dt_clamp_ms, speed_css_px_s, flips_per_s, dark_dim_max, ease_ms, hook_raw_bytes, requests: 0, lazy_gz_kb: {code, traffic}, sea_mask_kb, poster_kb, phone_delay_zoom}, stops: [{when, rule}],
 strings: [{surface, text}], row: {label: "The living chart", default: "off", only_under: "${LIVING_PARAM}=1"}, gated: [device ids],
 hook_lines: [{id, anchor, replaces, text}],   (anchor and replaces: verbatim text found exactly once in maps-site/index.html; text: the full replacement line carrying ${HOOK_MARK}; the sum over hooks of max(0, len(text) - len(replaces)) <= ${HOOK_RAW_MAX} bytes; no filigree or street anchor literal in text or replaces)
 accept_template: {unit: "<id>", baseline: "<ref>", profiles: ["iphone13", "pixel7", "landscape", "desktop", "desktop2x"], clock: "virtual", gates: ${J(ACCEPT_GATES)}, waive: ${J(WAIVE)}, strings: [], declared_change_keys: [...], declared_first_view_growth: {bytes, requests: 0}, checks: [], files_touched: []},
 on_template: {views: [LVn], instants: ["t0", "t1"], scenarios: [...], checks: [{key, op, value}]},
 slices: {L0: {checks: [{id, cmd, expect}]}, L1: {...}, L2: {...}, L3: {...}, Z: {...}},   (every slice holds every id of ${J(MANDATORY_CHECKS)}; every cmd starts with one of the prefixes of /${CHECK_CMDS.source}/; a node tools/mobile-capture.js command passes --out and --shots-dir under docs/living/ (never docs/mobile/) and --accept always carries --capture; every check has a non-empty expect)
 units: [{id: "L<S>.U<nn>" | "Z.U<nn>", slice, title, files: [], kind: "logic" | "data" | "tool" | "css", model?, effort?, depends_on: [], covers: [spec rule ids], views: [LVn], acceptance: [{kind: "accept" | "on" | "cmd", cmd?, expect?}]}],
 prerequisites: [{item, blocks, status: "checked" | "open" | "missing", polish_title}], counts: {units_n, rules_n, checks_n, hooks_n}, canonical_len}`
const fixedFor = s => Object.fromEntries(Object.entries(BAKED_PTR).filter(([, ptr]) => s.owns.some(o => ptr === o || ptr.startsWith(o + '/'))).map(([id, ptr]) => [ptr, BAKED[id]]))
const secPrompt = s => PL(`You write ONE section of the living spec: ${s.sid}. You own exactly these living-spec.json pointers: ${s.owns.join(', ')}; state nothing at any other pointer.
Brief: ${s.brief}
Read: the living bible ${BIBLE_MD} and ${BIBLE_JSON} (the source of truth; your rules cover its rule ids), ${VIEWS_JSON}, ${VIEW_DATA}, ${L0} (the living-off reference), the corrections C1-C16 under the "corrections" key of ${DOCS}/todo-inputs.json (they supersede the research wherever they differ), and ${REPO}/maps-site/index.html through grep -nF only. Do not open ${PROBES}, anything under ${COLD}/, another section's draft, ${SPEC_MD} or ${SPEC_JSON}.
Fixed values at your pointers (code constants and rulings; state each exactly, at exactly that pointer): ${J(fixedFor(s))}
Write ${SPEC_DIR}/${s.sid}.md (prose a builder follows without the bible, with a "## Rules" list) and ${SPEC_DIR}/${s.sid}.json = {"date": "${DATE}", "sid": "${s.sid}", "fragment": {<each owned pointer>: value}, "rules": [{"id": "${s.sid}-01", "text", "covers": [bible rule ids]}]} (create the directory). Write nothing outside ${SPEC_DIR}/.
${SPEC_SHAPE}
${RULES_TEXT}
${DET_RULE_LC}
${VOCAB_LC_RULE}
${POST_RULE}
Re-read both files and JSON.parse the json. Return {sid: "${s.sid}", md: {path, sha256 (sha256sum), parsed: true when it exists and is non-empty}, json: {path, sha256, parsed: JSON.parse succeeds}, owns (the pointers you filled), rules_n}.`)
const secLedger = arr(LG.sections).filter(x => x && x.sid)
const secResumed = RESUME && PROBE_CK && PROBE_CK.ok ? SECTIONS.filter(s => secLedger.some(x => x.sid === s.sid && x.sha_ok === true && x.stamp === secStamp(s) && Number.isInteger(x.seq) && x.seq > PROBE_CK.seq)) : []
secKept = secResumed.map(s => secLedger.find(x => x.sid === s.sid)).map(x => ({sid: x.sid, md: x.md, md_sha: x.md_sha, json: x.json, json_sha: x.json_sha, seq: x.seq, stamp: x.stamp}))
if (secResumed.length) log('sections resumed (re-hash, stamp and order match): ' + secResumed.map(s => s.sid).join(', '))
const secTodo = cap(SECTIONS.filter(s => !secResumed.includes(s)))
const secRaw = await parallel(secTodo.map(s => () => agent(secPrompt(s), {label: s.sid, phase: 'Sections', schema: SEC, ...M(s.role)})))
const secOut = secRaw.map((r, i) => r && r.sid === secTodo[i].sid && FILE_OK(r.md) && FILE_OK(r.json) ? r : null)
secOut.forEach((r, i) => { if (!r) { gaps.push(`section ${secTodo[i].sid}: writer died or its files did not parse (rerun with resume to retry it)`); if (secRaw[i]) log('section ' + secTodo[i].sid + ': files did not read back') } })
const secK = kept(secOut, 'section writers')
if (secK.k.length) {
  SEQ += 1
  secKept = secKept.concat(secK.k.map(r => ({sid: r.sid, md: r.md.path, md_sha: r.md.sha256, json: r.json.path, json_sha: r.json.sha256, seq: SEQ, stamp: secStamp(SECTIONS.find(s => s.sid === r.sid))})))
  SEC_CK = await checkpoint('sections')
  if (!SEC_CK) gaps.push('ledger checkpoint (sections) not recorded: a rerun re-buys the sections')
} else SEC_CK = secResumed.length > 0
if (secTodo.length && !secK.ok) return done({reason: 'agent died: sections', agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: POLISH_ABOVE, polish_note: `Living 2: ${secK.k.length}/${secTodo.length} section writers kept; the kept drafts are ledgered`})
const secPresent = SECTIONS.filter(s => secKept.some(x => x.sid === s.sid))

// ---- P3 Integrate ----
phase('Integrate')
let specFiles = null
const integ = await crit(PL(`You are the living-spec integrator. Read ONLY the section drafts ${secPresent.map(s => SPEC_DIR + '/' + s.sid + '.md + .json').join(', ')} and, from ${BIBLE_JSON}, only its rules[] ids and kinds (for the trace). Do not open ${PROBES} or anything under ${COLD}/.
Write ${SPEC_JSON} and ${SPEC_MD}:
1. ${SPEC_JSON}: every section's fragment at its owned pointers, unchanged unless two sections contradict (resolve in favour of the rulings, then the determinism rule); rules = every section rule renumbered "LS-01", "LS-02", ... (stable from now on), each {id, text, covers: [bible rule ids]}, so every bible rule of kind "must" is covered by at least one LS rule.
2. units (you own /units, /rules, /counts and the top-level stamps; nothing a section owns): slices ${SLICES.map(s => s + ' (' + SLICE_NAME[s] + ')').join(', ')}; ids "L<S>.U<nn>" or "Z.U<nn>"; at most ${UNITS_PER_SLICE} units per slice; depends_on only to the same or an earlier slice, no cycles; L0.U01 is the instrument extension (files ["tools/living-measure.js"], kind "tool": --gate-summary, --lint-on, --score) and every other unit depends on it transitively; files only matching ${ALLOWED_FILES.map(r => r.source).join(' | ')}, never ${NEVER_FILES.source}; covers: together the units cover every LS rule; every unit has at least one acceptance entry that is machine-checkable (kind accept, kind on, or kind cmd with an expect).
3. /accept_template carries gates ${J(ACCEPT_GATES)} and waive ${J(WAIVE)} VERBATIM; /slices/<S>/checks carries every id of ${J(MANDATORY_CHECKS)} in every slice.
4. ${SPEC_MD}: self-sufficient prose from which a builder who never saw the bible or the source posts builds the living chart: one section per spec part, the rules list with ids, the units by slice, and a final "## Provenance" (the only place for source names; list what you resolved between sections there).
5. stamps: bible_sha256 "${BSHA}", rulings_used ${J(LCR.used)}, date "${DATE}".
${SPEC_SHAPE}
${RULES_TEXT}
${DET_RULE_LC}
${VOCAB_LC_RULE}
${POST_RULE}
Re-read both files and JSON.parse the json. Return {md: {path, sha256 (sha256sum), parsed: true when non-empty}, json: {path, sha256, parsed: JSON.parse succeeds}, counts: {units_n, rules_n, checks_n (summed over slices), hooks_n}, canonical_len (JSON.stringify(parsed).length)}.`), {label: 'integrator', phase: 'Integrate', schema: SPEC, ...M('integ')})
if (!integ || !FILE_OK(integ.md) || !FILE_OK(integ.json)) return done({reason: 'agent died: integrator', agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: POLISH_ABOVE})
specFiles = {md: integ.md, json: integ.json}
const takeFiles = (x, label) => { if (!x || !FILE_OK(x.json) || !FILE_OK(x.md)) return false; specFiles = {md: x.md, json: x.json}; arr(x.fixed).forEach(t => log(label + ': ' + oneLine(t))); return true }
const SPEC_READ_TASK = PL(`Spec summary (read-only; write nothing). From ${REPO} run node ${MEASURE} --spec-summary ${SPEC_JSON} --bible ${BIBLE_JSON} --md ${SPEC_MD}. ${LINE_RULE}`)
async function readSpec(label, ph) {   // returns the summary line, or a done() object to return
  const r = await relay(SPEC_READ_TASK, {label, phase: ph, schema: SPEC_READ, ...M('triage')})
  if (!r) return {stop: done({reason: 'agent died: ' + label, rounds, agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: POLISH_ABOVE})}
  if (toolErr(r)) return {stop: done({reason: 'infra', rounds, agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: POLISH_ABOVE, polish_note: 'infra (' + label + '): ' + oneLine(r.error)})}
  if (!lenOk(r)) return {stop: done({reason: 'agent died: ' + label, rounds, agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: POLISH_ABOVE, polish_note: 'the spec summary line was mis-relayed twice'})}
  return {sum: r}
}
let rounds = 0
let SUMR = await readSpec('spec reader', 'Integrate')
if (SUMR.stop) return SUMR.stop
let SUM = SUMR.sum

// ---- P4 Anchors ----
phase('Anchors')
const ANCHORS_TASK = PL(`Hook anchors (strings only; write only temp files in a mktemp -d dir; use a node script, since the literals hold quotes and no shell quoting may touch them).
1. Read /hook_lines of ${SPEC_JSON} ([{id, anchor, replaces, text}]). For each hook: anchor_n = the number of occurrences of its anchor in ${REPO}/maps-site/index.html, counted with a String.indexOf loop (each search from the previous hit + 1); replaces_n = the same for its replaces (0 when either is missing or empty).
2. Other tracks' anchor literals: run this check (its "Return" describes that script's output, not your answer): ${FIL_ST_ANCHOR_TASK}
   fil_st_literal = the hook's text or replaces contains one of those flag-1 literals.
3. The accept template: take /accept_template of ${SPEC_JSON}, set unit to "L0.U01" and baseline to "L0" (keep every other field), write it to <tmp>/accept-sample.json, and from ${REPO} run node ${CAPTURE} --lint-accept <tmp>/accept-sample.json --out ${COLD}/lint-accept.json --shots-dir ${COLD}/lint-shots (the lint reads only the file and writes nothing). lint_exit = its exit code (-1 when /accept_template is missing).
Return {hooks: [{id, anchor_n, replaces_n, fil_st_literal}], lint_exit}.`)
const runAnchors = (label, ph) => agent(ANCHORS_TASK, {label, phase: ph, schema: ANCH2, ...M('mech')})
const hookBad = an => arr(obj(an).hooks).filter(h => h && (h.anchor_n !== 1 || h.replaces_n !== 1 || h.fil_st_literal === true))
const hookFixText = an => J(hookBad(an))
let AN = await runAnchors('anchors', 'Anchors')
if (!AN) { log('agent died: anchors (G2.7 and G2.12 cannot pass this pass)'); gaps.push('anchors agent died') }
let specMoved = false
if (AN && hookBad(AN).length) {
  const fx = await crit(PL(`Anchor fixer: these hook lines of ${SPEC_JSON} are not found exactly once in ${REPO}/maps-site/index.html, or touch another track's anchor literal: ${hookFixText(AN)} (anchor_n, replaces_n: the occurrence counts; fil_st_literal: text or replaces holds a filigree or street flag-1 anchor literal).
The anchors re-derived this run (literal -> path:line): ${anchorMap(pre.anchors)}
Re-point each failing hook's anchor and replaces to verbatim text that occurs exactly once in ${REPO}/maps-site/index.html (check with a String.indexOf count in a node script), keep its text carrying ${HOOK_MARK}, keep the sum over hooks of max(0, len(text) - len(replaces)) <= ${HOOK_RAW_MAX}, and keep every other key byte-for-byte. Edit ${SPEC_JSON} only.
Re-read the file and JSON.parse it. Return {md: {path: "${SPEC_MD}", sha256 (sha256sum), parsed: true}, json: {path, sha256, parsed}, fixed (one line per hook you re-pointed)}.`), {label: 'anchor fixer', phase: 'Anchors', schema: FIXED, ...M('triage')})
  if (!takeFiles(fx, 'anchor fixer')) { log('agent died: anchor fixer; the failing hooks stand'); gaps.push('anchor fixer died: ' + hookBad(AN).map(h => h.id).join(', ')) }
  else {
    specMoved = true
    const a2 = await runAnchors('anchors (after fix)', 'Anchors')
    if (a2) AN = a2; else log('agent died: anchors (after fix); the pre-fix counts stand')
  }
}

// ---- P5 Red team ----
phase('Red team')
const red = await crit(PL(`Red team (write nothing). Attack ${SPEC_MD} and ${SPEC_JSON} on coexistence with the other tracks and the hold: UG1-UG11 with the UG4 waiver (${WAIVE.UG4}); R6; ST1, ST7 and ST18; the hold (no living job beside a mobile run; Living 3 never beside Filigree 3 or Street 3/4); the install window (scripts staged under docs/living/design/workflows/ until Living 0); the corrections C1-C16 under "corrections" of ${DOCS}/todo-inputs.json; GS.8 (Street digests maps-site/** at the start and end of every Street 3 run); the manifest rule (every maps-site/ change regenerates maps-site/data/offline-manifest.json and needs node tools/build-offline-manifest.js --atlas --check); and the off-identity of the layers row (absent without ${LIVING_PARAM}=1). Read the bible ${BIBLE_JSON} for what the spec must not contradict.
${RULES_TEXT}
${DET_RULE_LC}
Each contradiction {a, b (quote both sides), why, fix (the concrete change)}; an empty list when the spec holds. Return {contradictions}.`), {label: 'red team', phase: 'Red team', schema: RED, ...M('judge')})
if (!red) { log('agent died: red team (contradictions unchecked)'); gaps.push('red team died: coexistence contradictions unchecked') }
const contra = arr(obj(red).contradictions).filter(c => c && c.fix)
if (contra.length) {
  const pat = await crit(PL(`Red-team patch (one pass): apply each fix below to ${SPEC_MD} and ${SPEC_JSON}; never renumber or reuse rule or unit ids (append after the highest); keep both files consistent; change nothing else.
${J(contra)}
${SPEC_SHAPE}
${DET_RULE_LC}
${VOCAB_LC_RULE}
${POST_RULE}
Re-read both files and JSON.parse the json. Return {md: {path, sha256, parsed}, json: {path, sha256, parsed}, fixed (one line per contradiction you resolved)}.`), {label: 'red-team patch', phase: 'Red team', schema: FIXED, ...M('integ')})
  if (!takeFiles(pat, 'red-team patch')) return done({reason: 'agent died: red-team patch', agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: POLISH_ABOVE})
  specMoved = true
}
if (specMoved) {
  SUMR = await readSpec('spec reader (red team)', 'Red team')
  if (SUMR.stop) return SUMR.stop
  SUM = SUMR.sum
}

// ---- P6 Cold-animator gate (paired blind readers; the auditor resolves every pointer) ----
const READ_ALLOWED = [SPEC_MD, SPEC_JSON]
const readerPrompt = X => PL(`You are building an animated layer for a Leaflet atlas from a spec, and have seen nothing else about it. You may read ONLY these two files: ${SPEC_MD} and ${SPEC_JSON}. Open nothing else (no other file, directory listing, repository file or the web): the script checks files_read against this allowlist.
Answer every question below from the spec alone. answer_json is the value as JSON text (a number as 20, a string as "\\"off\\"", a list as "[\\"a\\",\\"b\\"]"); schema_path is the RFC 6901 JSON pointer into living-spec.json where you read it (e.g. "/a/b/0"). A "number" question takes a JSON number, "enum" and "pointer" the exact string, "list" a JSON array, "text" the spec's own words.
Questions (id, q, kind): ${J(QUESTIONS)}
Write {"answers": [...]} to ${COLD}/${X}.json (create the directory; do not read it back).
files_read = every file you opened for reading (absolute paths). Return {answers: [{id, answer_json, schema_path}], files_read}.`, true)
const AUDIT_TASK = R => PL(`Guess auditor (write only temp files in a mktemp -d dir). Write this JSON VERBATIM to <tmp>/answers.json: ${J({A: arr(obj(R.A).answers), B: arr(obj(R.B).answers)})}
Then from ${REPO} run node ${MEASURE} --resolve-pointers ${SPEC_JSON} --answers <tmp>/answers.json --probes ${PROBES}. ${LINE_RULE}`)
async function runGate(tag, ph) {   // {R: {A, B}, AU} or {stop}
  const [a, b] = await parallel([
    () => crit(readerPrompt('A'), {label: 'reader A' + tag, phase: ph, schema: READ, ...M('deep')}),
    () => crit(readerPrompt('B'), {label: 'reader B' + tag, phase: ph, schema: READ, ...M('judge')})
  ])
  for (const [x, X] of [[a, 'A'], [b, 'B']]) if (!x) return {stop: done({reason: 'agent died: reader ' + X, rounds, agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: POLISH_ABOVE})}
  const R = {A: a, B: b}
  const au = await relay(AUDIT_TASK(R), {label: 'guess auditor' + tag, phase: ph, schema: AUDIT, ...M('triage')})
  if (!au && tag) return {stop: done({reason: 'agent died: guess auditor' + tag, rounds, agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: POLISH_ABOVE})}
  if (!au || !lenOk(au)) log('guess auditor' + tag + ': ' + (au ? 'line failed or mis-relayed' : 'agent died') + ' (G2.2 and G2.3 cannot pass)')
  return {R, AU: au && lenOk(au) ? au : null}
}

// ---- the G2 score (code only; design §7) ----
const answerMap = r => { const m = {}; for (const x of arr(obj(r).answers)) if (x && typeof x.id === 'string' && !(x.id in m)) m[x.id] = x; return m }
function probeEq(kind, a, e) {
  const num = v => typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
  if (kind === 'number') return isNum(num(a)) && isNum(num(e)) && Math.abs(num(a) - num(e)) <= 1e-9
  if (kind === 'enum' || kind === 'pointer') return typeof a === 'string' && typeof e === 'string' ? a.trim() === e.trim() : same(a, e)
  if (kind === 'list') { if (!Array.isArray(a) || !Array.isArray(e)) return false; const x = new Set(a.map(v => J(canonJ(v)))), y = new Set(e.map(v => J(canonJ(v)))); return x.size === y.size && [...x].every(v => y.has(v)) }
  const t = v => typeof v === 'string' ? v : J(v)
  return norm(t(a)) === norm(t(e)) && norm(t(e)) !== ''
}
function scoreReader(r) {
  const m = answerMap(r), wrong = []
  for (const p of probes) {
    const x = m[p.id], e = parseJ(String(p.expected_json))
    const a = x ? parseJ(String(x.answer_json)) : {ok: false}
    if (!x || !a.ok || !e.ok || !probeEq(probeKind(p), a.v, e.v)) wrong.push(p.id)
  }
  return {pct: pct(probes.length - wrong.length, probes.length), wrong, answers: m}
}
function dagOf(units) {   // Kahn's algorithm over depends_on; unknown deps and later-slice deps listed
  const ids = new Set(units.map(u => u.id)), si = s => SLICES.indexOf(s)
  const bad = []
  for (const u of units) for (const d of arr(u.depends_on)) {
    if (!ids.has(d)) bad.push(`${u.id}: unknown dependency ${d}`)
    else { const du = units.find(x => x.id === d); if (si(du.slice) > si(u.slice)) bad.push(`${u.id}: depends on ${d} in a later slice`) }
  }
  const indeg = Object.fromEntries(units.map(u => [u.id, arr(u.depends_on).filter(d => ids.has(d)).length])), done_ = [], q = units.filter(u => !indeg[u.id]).map(u => u.id)
  while (q.length) { const id = q.shift(); done_.push(id); for (const u of units) if (arr(u.depends_on).includes(id) && --indeg[u.id] === 0) q.push(u.id) }
  const cyclic = units.map(u => u.id).filter(id => !done_.includes(id))
  return {bad, cyclic}
}
const reach = (units, from) => {   // ids whose depends_on reaches `from` transitively
  const dep = Object.fromEntries(units.map(u => [u.id, arr(u.depends_on)])), memo = {}
  const r = (id, seen) => { if (id in memo) return memo[id]; if (seen.has(id)) return false; seen.add(id); const v = (dep[id] || []).some(d => d === from || r(d, seen)); memo[id] = v; return v }
  return new Set(units.map(u => u.id).filter(id => r(id, new Set())))
}
const checksOf = sl => {   // /slices/<S>/checks as [{id, cmd, expect}] (or the flattened check_ids / cmds / expects arrays)
  const s = obj(sl)
  if (Array.isArray(s.checks)) return s.checks.filter(Boolean).map(c => ({id: c.id, cmd: c.cmd, expect: c.expect}))
  const ids = arr(s.check_ids), cmds = arr(s.cmds), ex = Array.isArray(s.expects) ? s.expects : null
  return ids.map((id, i) => ({id, cmd: cmds[i], expect: ex ? ex[i] : (Array.isArray(s.has_expect) ? (s.has_expect[i] ? 'stated' : '') : undefined)}))
}
const easeList = e => Array.isArray(e) ? e.map(x => isNum(x) ? x : obj(x).ms ?? obj(x).ease_ms ?? obj(x).value) : Object.values(obj(e)).map(x => isNum(x) ? x : obj(x).ms ?? obj(x).ease_ms)
const textOf = s => typeof s === 'string' ? s : obj(s).text
function score(ctx) {
  const {sum, an, gt} = ctx
  const SD = 'spec summary missing', ok = !!sum
  const units = arr(obj(sum).units).filter(Boolean), rules = arr(obj(sum).rules).filter(Boolean)
  // G2.1-G2.3 (readers, auditor)
  const sc = {A: gt && gt.R.A ? scoreReader(gt.R.A) : null, B: gt && gt.R.B ? scoreReader(gt.R.B) : null}
  const AU = gt && gt.AU, res = obj(obj(AU).resolved), ptr = obj(obj(AU).spec_ptr)
  const guesses = ['A', 'B'].flatMap(X => sc[X] ? Object.values(sc[X].answers).filter(x => obj(res[X])[x.id] !== true).map(x => ({reader: X, id: x.id, schema_path: x.schema_path})) : [])
  const nullPtr = probes.filter(p => ptr[p.id] !== true).map(p => ({id: p.id, spec_pointer: p.spec_pointer}))
  // G2.4 traceability
  const covered = new Set(rules.flatMap(r => arr(r.covers)))
  const untraced = arr(obj(sum).bible_must).filter(id => !covered.has(id))
  const ruleNoUnit = Array.isArray(obj(sum).rules_without_unit) ? sum.rules_without_unit : rules.map(r => r.id).filter(id => !units.some(u => arr(u.covers).includes(id)) && !arr((rules.find(r => r.id === id) || {}).units).length)
  const accBad = units.filter(u => !(Number.isInteger(u.acceptance_n) && u.acceptance_n >= 1 && u.acceptance_ok === true)).map(u => u.id)
  const g4 = [untraced.length ? 'bible must rules uncovered: ' + untraced.join(', ') : '', ruleNoUnit.length ? 'spec rules without a unit: ' + ruleNoUnit.join(', ') : '', accBad.length ? 'units without a machine-checkable acceptance: ' + accBad.join(', ') : '', units.length ? '' : 'no units'].filter(Boolean)
  // G2.5 structure
  const dag = dagOf(units), perSlice = Object.fromEntries(SLICES.map(s => [s, units.filter(u => u.slice === s).length]))
  const u01 = units.find(u => u.id === 'L0.U01'), toU01 = reach(units, 'L0.U01')
  const fileBad = units.flatMap(u => arr(u.files).length ? arr(u.files).filter(f => typeof f !== 'string' || !ALLOWED_FILES.some(r => r.test(f)) || NEVER_FILES.test(f) || f.split('/').includes('..')).map(f => u.id + ': ' + f) : [u.id + ': no files'])
  const g5 = [...dag.bad, dag.cyclic.length ? 'cycle: ' + dag.cyclic.join(', ') : '', ...SLICES.filter(s => perSlice[s] > UNITS_PER_SLICE).map(s => `${s} has ${perSlice[s]} units (max ${UNITS_PER_SLICE})`),
    ...units.filter(u => !SLICES.includes(u.slice)).map(u => `${u.id}: slice ${J(u.slice)}`), ...fileBad.map(f => 'file ' + f),
    !u01 ? 'L0.U01 missing' : (u01.slice !== 'L0' || u01.kind !== 'tool' || !arr(u01.files).includes('tools/living-measure.js')) ? 'L0.U01 is not the instrument extension (slice L0, kind tool, tools/living-measure.js)' : '',
    ...(u01 ? units.filter(u => u.id !== 'L0.U01' && !toU01.has(u.id)).map(u => `${u.id} does not depend on L0.U01`) : [])].filter(Boolean)
  // G2.6 checks
  const slices = obj(obj(sum).slices)
  const g6 = SLICES.flatMap(S => {
    const cs = checksOf(slices[S]), ids = cs.map(c => c.id)
    return [...MANDATORY_CHECKS.filter(id => !ids.includes(id)).map(id => `${S} lacks ${id}`),
      ...cs.filter(c => MANDATORY_CHECKS.includes(c.id)).filter(c => typeof c.cmd !== 'string' || !CHECK_CMDS.test(c.cmd) || (/--accept /.test(c.cmd) && !/--capture /.test(c.cmd)) || c.expect == null || c.expect === '').map(c => `${S}.${c.id}: cmd ${J(String(c.cmd ?? '').slice(0, 60))}${c.expect == null || c.expect === '' ? ' (no expect)' : ''}`)]
  })
  // G2.7 hook lines
  const hooks = arr(obj(sum).hook_lines).filter(Boolean), anH = Object.fromEntries(arr(obj(an).hooks).filter(Boolean).map(h => [h.id, h]))
  const growth = hooks.reduce((t, h) => t + Math.max(0, (Number(h.text_len) || 0) - (Number(h.replaces_len) || 0)), 0)
  const keepHook = obj(obj(sum).hash).keep_hook
  const g7 = [...hooks.filter(h => !(typeof h.id === 'string' && h.id && typeof h.anchor === 'string' && h.anchor && typeof h.replaces === 'string' && h.replaces && Number.isInteger(h.text_len) && h.text_len > 0 && h.marked === true)).map(h => `${h.id}: not a complete marked hook {id, anchor, replaces, text}`),
    ...(an ? hooks.filter(h => !anH[h.id] || anH[h.id].anchor_n !== 1 || anH[h.id].replaces_n !== 1).map(h => `${h.id}: anchor x${obj(anH[h.id]).anchor_n ?? '?'}, replaces x${obj(anH[h.id]).replaces_n ?? '?'} (want 1 and 1)`) : ['anchor counts unread (agent died: anchors)']),
    ...(an ? hooks.filter(h => anH[h.id] && anH[h.id].fil_st_literal === true).map(h => `${h.id}: holds a filigree or street anchor literal`) : []),
    growth > HOOK_RAW_MAX ? `raw growth ${growth} B > ${HOOK_RAW_MAX}` : '', hooks.length ? '' : 'no hook lines',
    typeof keepHook === 'string' && hooks.some(h => h.id === keepHook) ? '' : `no hook keeps ${LIVING_PARAM}=1 in setHash (/hash/keep_hook ${J(keepHook ?? null)})`].filter(Boolean)
  // G2.8 the param
  const param = obj(obj(sum).hash).param
  // G2.9 caps
  const caps = obj(obj(sum).caps)
  const capVals = CAPS.map(c => { const v = c.paths.map(p => getPath(caps, p)).find(isNum); return {c, v} })
  const g9 = capVals.filter(({c, v}) => !(isNum(v) && v <= c.max && v >= (c.min || 0))).map(({c, v}) => `${c.id} ${J(v ?? null)} (want ${c.min ? c.min + '..' : '<= '}${c.max})`)
  // G2.10 no rise
  const eases = easeList(obj(sum).eases), riseRules = arr(obj(sum).rise_rules)
  const g10 = [riseRules.length ? 'rise or scale-pop rules: ' + riseRules.map(x => typeof x === 'string' ? x : J(x)).join(', ') : '', ...eases.filter(v => !(isNum(v) && v >= 0 && v <= EASE_MAX)).map(v => `ease ${J(v ?? null)} ms (want <= ${EASE_MAX})`)].filter(Boolean)
  // G2.11 gated devices
  const g11 = arr(obj(sum).gated_units).filter(Boolean).filter(g => { const gate = typeof g === 'string' ? '' : (g.owner_gate || g.gate || ''); return !(gate && LCR.used[gate] && LCR.used[gate] !== 'default') }).map(g => typeof g === 'string' ? g + ' (owner gate unknown)' : `${g.unit || g.id || '?'} implements ${g.device || '?'} (${g.owner_gate || g.gate || 'no gate'} not overridden)`)
  // G2.12 accept template
  const at = obj(obj(sum).accept_template)
  const g12 = [...ACCEPT_GATES.filter(g => !arr(at.gates).includes(g)).map(g => 'gates lack ' + g), same(at.waive, WAIVE) && Object.keys(obj(at.waive)).every(k => at.waive[k] === WAIVE[k]) ? '' : 'waive differs from WAIVE', !an ? 'lint unread (agent died: anchors)' : an.lint_exit === 0 ? '' : 'lint-accept exit ' + an.lint_exit].filter(Boolean)
  // G2.13 voice and names
  const strs = arr(obj(sum).strings).map(textOf).filter(t => typeof t === 'string')
  const strHits = strs.flatMap(t => [VOCAB_LC, JARGON_LC, POST_NAMES].map(re => (t.match(re) || [])[0]).filter(Boolean).map(w => `${J(t.slice(0, 40))}: ${w}`))
  const g13 = [...strHits, ...arr(obj(sum).md_vocab_hits).map(x => 'md: ' + (typeof x === 'string' ? x : J(x))), ...arr(obj(sum).md_post_names).map(x => 'md name outside Provenance: ' + (typeof x === 'string' ? x : J(x)))]
  // G2.14 prerequisites
  const pre_ = arr(obj(sum).prerequisites).filter(Boolean)
  const g14 = PREREQS.map(r => { const hit = pre_.filter(p => r.re.test(norm(String(p.item || '') + ' ' + String(p.polish_title || '')))); return !hit.length ? r.id + ' not listed' : hit.some(p => PREREQ_STATUS.includes(p.status)) ? '' : r.id + ': status ' + J(hit[0].status) }).filter(Boolean)
  // G2.15 probes before the spec, readers blind
  const orderBad = [!(PROBE_CK && PROBE_CK.ok) ? 'the probe checkpoint is not in the ledger' : '', PROBE_CK && PROBE_CK.bible_sha256 !== BSHA ? 'probes stamped with another bible sha' : '', !SEC_CK ? 'the sections checkpoint is not in the ledger' : '',
    ...secKept.filter(s => !(PROBE_CK && s.seq > PROBE_CK.seq)).map(s => s.sid + ' not after the probes')].filter(Boolean)
  const blind = gt ? ['A', 'B'].flatMap(X => blindBad(arr(obj(gt.R[X]).files_read), READ_ALLOWED).map(p => X + ': ' + p)) : ['readers did not run']
  const ne = m => ok ? m : SD
  const rdTxt = X => sc[X] ? sc[X].pct + '%' : 'no reader'
  const criteria = [
    C('G2.1', 'each reader answers >= 90% of the probes (answer_json and expected_json parsed in code, compared by kind)', {A: rdTxt('A'), B: rdTxt('B'), probes: probes.length}, `>= ${READER_PCT}% each`, !!sc.A && !!sc.B && sc.A.pct >= READER_PCT && sc.B.pct >= READER_PCT),
    C('G2.2', 'schema-path guesses: every answer\'s schema_path resolves in the spec (auditor)', !AU ? 'auditor line missing' : guesses.length ? guesses.map(g => `${g.reader}#${g.id} ${g.schema_path}`) : 0, 0, !!AU && !guesses.length),
    C('G2.3', 'every probe spec_pointer resolves in the spec (auditor)', !AU ? 'auditor line missing' : nullPtr.length ? nullPtr.map(p => p.id + ' ' + p.spec_pointer) : 0, 0, !!AU && !nullPtr.length),
    C('G2.4', 'traceability: bible must -> spec rule -> unit; machine-checkable acceptance', ne(g4.length ? g4 : 'ok'), 'all', ok && !g4.length),
    C('G2.5', 'unit DAG, <= 8 per slice, earlier-slice deps, ALLOWED_FILES only, L0.U01 the instrument extension under every unit', ne(g5.length ? g5 : 'ok'), 'all', ok && !g5.length),
    C('G2.6', 'every slice holds every mandatory check, each cmd in CHECK_CMDS with an expect', ne(g6.length ? g6 : 'ok'), MANDATORY_CHECKS.length + ' ids x ' + SLICES.length + ' slices', ok && !g6.length),
    C('G2.7', 'hook lines: complete and marked, anchor and replaces found once, no other track\'s literal, raw growth <= 200 B, one setHash keep', ne(g7.length ? g7 : `ok (${hooks.length} hooks, ${growth} B)`), `<= ${HOOK_RAW_MAX} B, x1 each`, ok && !g7.length),
    C('G2.8', '/hash/param', ne(J(param ?? null)), J(LIVING_PARAM), ok && param === LIVING_PARAM),
    C('G2.9', 'caps within the rulings', ne(g9.length ? g9 : 'ok'), CAPS.map(c => c.id + ' <= ' + c.max).join(', '), ok && !g9.length),
    C('G2.10', 'no rise or scale-pop rule; every ease <= 250 ms', ne(g10.length ? g10 : 'ok'), `0 rise rules, eases <= ${EASE_MAX}`, ok && !g10.length),
    C('G2.11', 'owner-gated devices absent from /units unless overridden', ne(g11.length ? g11 : 0), 0, ok && !g11.length),
    C('G2.12', 'accept template: gates include ACCEPT_GATES, waive equals WAIVE, --lint-accept of a filled sample exits 0', ne(g12.length ? g12 : 'ok'), 'all', ok && !g12.length),
    C('G2.13', 'voice and names: VOCAB_LC / JARGON_LC in /strings and the md, source names outside ## Provenance', ne(g13.length ? g13 : 0), 0, ok && !g13.length),
    C('G2.14', '/prerequisites: the sea mask, Traced road network, the river trace, Street 4, Sim ↔ atlas continuity, each with a status', ne(g14.length ? g14 : 'ok'), PREREQS.length + ' listed with checked | open | missing', ok && !g14.length),
    C('G2.15', 'probes frozen before the spec (ledger order, current bible sha); readers blind', orderBad.length || blind.length ? {order: orderBad, blind} : 'ok', 'probe checkpoint before every section; files_read within the spec md and json', !orderBad.length && !blind.length)
  ]
  const wrongBoth = sc.A && sc.B ? sc.A.wrong.filter(id => sc.B.wrong.includes(id)) : []
  return {criteria, sc, wrongBoth, guesses, nullPtr, g: {g4, g5, g6, g7, g9, g10, g11, g12, g13, g14}, units, perSlice, growth}
}
const failing = e => e.criteria.filter(c => !c.pass)

phase('Cold-animator gate')
let GT = await runGate('', 'Cold-animator gate')
if (GT.stop) return GT.stop
let ev = score({sum: SUM, an: AN, gt: GT})
log(`gate: ${failing(ev).map(c => c.id).join(', ') || 'all criteria pass'}`)

// ---- P7 Fix (bounded by ROUNDS; cited items deduplicated per round; budget-gated) ----
while (rounds < ROUNDS && failing(ev).some(c => FIXABLE.includes(c.id))) {
  if (lowBudget()) { log('budget: fix round skipped'); break }
  const rr = rounds + 1, tag = ' (fix ' + rr + ')'
  phase('Fix')
  const items = [], seen = new Set()
  const add = (kind, item) => { const k = kind + ':' + J(item); if (seen.has(k)) { log('fix item dropped' + tag + ' (duplicate): ' + oneLine(k)); return } seen.add(k); items.push({kind, item}) }
  failing(ev).filter(c => FIXABLE.includes(c.id)).forEach(c => add('failing criterion', {id: c.id, desc: c.desc, measured: c.measured}))
  ev.wrongBoth.forEach(id => { const p = probeById[id]; add('probe both readers missed', {id, q: p.q, expected_json: p.expected_json, spec_pointer: p.spec_pointer, A: obj(ev.sc.A.answers[id]).answer_json ?? null, B: obj(ev.sc.B.answers[id]).answer_json ?? null}) })
  ev.guesses.forEach(g => add('schema-path guess', g))
  ev.nullPtr.forEach(p => add('null pointer', p))
  if (AN) hookBad(AN).forEach(h => add('hook anchor', h))
  if (!items.length) { log('fix: nothing the spec fixer can change; no round run'); break }
  rounds = rr
  log(`fix round ${rr}: ${items.length} cited item(s); failing ${failing(ev).map(c => c.id).join(',')}`)
  const fx = await crit(PL(`You are the spec fixer, round ${rr}. Patch ${SPEC_MD} and ${SPEC_JSON} ONLY where cited below; never renumber or reuse rule or unit ids; keep both files consistent; keep everything else byte-for-byte.
- A probe both readers missed, or a null pointer: state the answer explicitly at exactly the probe's spec_pointer (its expected_json is the settled answer) and say it plainly in the md.
- A schema-path guess: the reader looked at a pointer the spec does not hold; state the decision where the spec's shape promises it.
- A hook anchor item: re-point anchor and replaces to verbatim text found exactly once in ${REPO}/maps-site/index.html (count with a String.indexOf loop in a node script), never touching another track's anchor literal; the anchors re-derived this run: ${anchorMap(pre.anchors)}.
- Any other failing criterion: correct the spec to the shape and rules below.
Cited items: ${J(items)}
${SPEC_SHAPE}
${RULES_TEXT}
${DET_RULE_LC}
${VOCAB_LC_RULE}
${POST_RULE}
Re-read both files and JSON.parse the json. Return {md: {path, sha256, parsed}, json: {path, sha256, parsed}, fixed (one line per item you fixed)}.`), {label: 'spec fixer' + tag, phase: 'Fix', schema: FIXED, ...M('judge')})
  if (!takeFiles(fx, 'spec fixer' + tag)) return done({reason: 'agent died: spec fixer' + tag, rounds, agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: POLISH_ABOVE})
  SUMR = await readSpec('spec reader' + tag, 'Fix')
  if (SUMR.stop) return SUMR.stop
  SUM = SUMR.sum
  const a3 = await runAnchors('anchors' + tag, 'Fix')
  if (!a3) return done({reason: 'agent died: anchors' + tag, rounds, agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: POLISH_ABOVE})
  AN = a3
  GT = await runGate(tag, 'Fix')
  if (GT.stop) return GT.stop
  ev = score({sum: SUM, an: AN, gt: GT})
  log(`gate${tag}: ${failing(ev).map(c => c.id).join(', ') || 'all criteria pass'}`)
}

// ---- P8 Record ----
phase('Record')
const holdRec = await crit(PL(HOLD_TASK_LC), {label: 'hold (record)', phase: 'Record', schema: HOLD, ...M('triage')})
const h0 = obj(hold.shas), h1 = holdRec && lenOk(holdRec) ? obj(holdRec.shas) : null
const coexBad = !h1 ? ['the Record hold read died or mis-relayed'] : SHA_KEYS.filter(k => !same(h0[k], h1[k])).map(k => k + ' moved during the run')
if (coexBad.length) { log('coexistence: ' + coexBad.join('; ')); gaps.push('coexistence: ' + coexBad.join('; ')) }
const fails = failing(ev)
specShas = {md: obj(specFiles && specFiles.md).sha256 || '', json: obj(specFiles && specFiles.json).sha256 || ''}
const readersRec = X => ev.sc[X] ? {pct: ev.sc[X].pct, wrong: ev.sc[X].wrong} : null
const gateRec = gateObj({criteria: ev.criteria, rounds, gaps: [...new Set(gaps)], rulings_used: RUSED, rulings_stamp: RST, bible_sha256: BSHA, bible_md_sha256: BMDSHA,
  stamps: obj(G1.stamps), cited: {fil: filNow, st: stNow}, probes_n: probes.length, readers: {A: readersRec('A'), B: readersRec('B')}, units_per_slice: ev.perSlice, hook_growth_bytes: ev.growth,
  coexistence: {ok: !coexBad.length, moved: coexBad}, sections_resumed: secResumed.map(s => s.sid), agents_bound: BOUND,
  artifacts: [{path: OUT + '/living-spec.md', sha256: specShas.md}, {path: OUT + '/living-spec.json', sha256: specShas.json}, {path: OUT + '/gates/2-probes.json', sha256: PROBES_SHA},
    {path: IN_REL + '/living-bible.md', sha256: BMDSHA}, {path: IN_REL + '/living-bible.json', sha256: BSHA}]})
if (coexBad.length) gateRec.pass = false   // a run that overlapped another track never passes (README §5.4)
const recs = [await recordL('gates/2-plan.json', gateRec, 'record gates/2-plan.json'), await recordL('state/2-plan.json', ledgerObj(), 'record state/2-plan.json')]
const recOk = recs.every(Boolean)
const pass = gateRec.pass && recOk
// The slice rides inside the bold title ("**Living data — <item> (L2)**"): living-drift --hold returns bold titles only and
// Living 3 blocks a slice on a data_open title naming it. A queued title matches with or without its trailing "(<slice>)".
const sliceTag = b => { const s = [...new Set(oneLine(b).match(/\b(L[0-3]|Z)\b/g) || [])]; return s.length ? s.join(', ') : oneLine(b) || '?' }
const seenIns = new Set(arr(obj(obj(hold.polish).living).data_open).flatMap(t => [norm(t), norm(String(t).replace(/\s*\([^()]*\)\s*$/, ''))]))   // the queued "Living data — …" titles (preflight hold)
const insKeys = new Set(), inserts = []
if (pass) for (const p of arr(obj(SUM).prerequisites).filter(x => x && x.status === 'missing')) {
  const item = oneLine(p.item || p.polish_title), key = norm('Living data — ' + item), tag = sliceTag(p.blocks)
  if (!item) continue
  if (seenIns.has(key) || insKeys.has(key)) { log('polish insert dropped (already queued): Living data — ' + item); continue }
  insKeys.add(key)
  inserts.push(`- [ ] **Living data — ${item} (${tag})** — blocks Living 3 slice ${tag}${p.polish_title ? ' (POLISH: "' + oneLine(p.polish_title) + '")' : ''}; listed missing in docs/living/living-spec.json /prerequisites`)
}
const reason = FORCE ? 'forced: ' + FORCE + (fails.length ? '; ' + fails.map(c => c.id).join(',') : '') : !recOk ? 'record-mismatch' : coexBad.length ? 'coexistence broken: ' + coexBad.join('; ') : pass ? '' : (fails.map(c => c.id).join(',') || MODE)
const nUnits = ev.units.length, rA = ev.sc.A ? ev.sc.A.pct : 0, rB = ev.sc.B ? ev.sc.B.pct : 0
return done({pass, reason, rounds, agents_bound: BOUND, outputs: OUTPUTS, gate_path: OUT + '/gates/2-plan.json', owner_rulings_used: RUSED, gate: gateRec,
  polish_note: pass ? `Living 2: living spec, ${nUnits} units in L0-L3 + Z, readers ${rA}%/${rB}%, round ${rounds}` : `Living 2: ${reason || 'not a pass'}; living spec ${nUnits} units, readers ${rA}%/${rB}%, round ${rounds}`,
  polish_inserts: inserts, polish_inserts_above: POLISH_ABOVE, changelog_line: pass ? 'docs: living chart — the living spec (Living 2)' : ''})
