export const meta = {
  name: 'living-1-research',
  description: 'Living 1: measure and read what the living chart must stand on (instrument, frozen views, the living-off reference, atlas and sim facts, canon) into a living bible; gate = still-frame test',
  whenToUse: 'Run as the POLISH item "Living 1 · Research → living bible", in a fresh session: Workflow({name:"living-1-research", args:{date:"YYYY-MM-DD"}}). Docs + the instrument tools/living-measure.js; never edits index.html, maps-site/ or another track\'s docs. Returns reason "held" while a mobile item is open or a mobile or street tool runs.',
  phases: [
    {title: 'Preflight', detail: 'drift (living + street), re-anchor, the hold, the Filigree 4 chain, cited rulings, ledger'},
    {title: 'Instrument', detail: 'q01: tools/living-measure.js over the mobile-capture exports -> self-test twice -> fix <= 2'},
    {title: 'Freeze', detail: 'LV1-LV9 views.json + stills + view-data + key list once; the living-off reference L0 (five profiles)'},
    {title: 'Research', detail: 'one targeted question per agent q02-q14 -> docs/living/research/<qid>.json'},
    {title: 'Verify', detail: 'per question: anchor check + one lens (refute / recount / second look)'},
    {title: 'Synthesize', detail: 'opus/xhigh integrator -> living-bible.md/.json; validator through the instrument'},
    {title: 'Still-frame gate', detail: 'paired blind appliers (sonnet/high + opus/high), ref resolver, scoring in code'},
    {title: 'Follow-up', detail: 'critic -> <= 4 fresh questions -> verify -> patcher -> re-gate (<= maxRounds)'},
    {title: 'Record', detail: 'gates/1-research.json, gates/1-view-answers.json, state/1-research.json; coexistence re-read'}
  ]
}
const JOB = 'living-1-research'
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
// ---- Living 1 constants (design §2-§3) ----
checkArgs(['livingRulings', 'port', 'cdnDir'])
if (A.cdnDir != null && (typeof A.cdnDir !== 'string' || !PATH_OK.test(A.cdnDir) || !A.cdnDir.startsWith('/'))) die('args.cdnDir must be an absolute path of letters, digits and _ / . + - only')
const CDN = A.cdnDir || null   // null: each capture relay builds T per SANDBOX_LC
const ROUND_TOKENS = 1200000   // one follow-up round (<= 28 agents incl. appliers); read by the config's lowBudget()
const GATE1 = OUTABS + '/gates/1-research.json', ANSWERS = OUTABS + '/gates/1-view-answers.json', LEDGER = OUTABS + '/state/1-research.json'
const BIBLE_MD = OUTABS + '/living-bible.md', BIBLE_JSON = OUTABS + '/living-bible.json', RESEARCH = OUTABS + '/research'
const VIEWS_JSON = OUTABS + '/gates/views.json', VIEW_DIR = OUTABS + '/gates/view/', VIEW_DATA = OUTABS + '/gates/view-data.json', KEYS_JSON = OUTABS + '/gates/measure-keys.json'
const L0 = OUTABS + '/captures/L0.json', L0_SHOTS = OUTABS + '/shots/L0', TOY = OUTABS + '/fixtures/toy/'
const DOSSIER = DOCS + '/research-dossier.md', TODO = DOCS + '/todo-inputs.json', RULINGS_JSON = DOCS + '/rulings.json'
const LV_RULES = [   // resolved in code-free form by the instrument (--freeze-views); frozen once; stops/stop are 0-based indices into party-route.json stops[] (4 = Fell Mountains, 7-8 = Sepos, White Sea)
  {id: 'LV1', name: 'The Whole Chart', rule: 'fit'},
  {id: 'LV2', name: 'The Pēshunor north coast', rule: 'filigree-view', ref: 'V1'},
  {id: 'LV3', name: 'Sepos to the White Sea', rule: 'route-leg', stops: [7, 8], band: 'country'},
  {id: 'LV4', name: 'The far north', rule: 'route-leg', stops: [2, 4], band: 'country'},
  {id: 'LV5', name: 'Epēshu at the city band', rule: 'anchor', name_of: 'Epēshu', zoom: 'mid:Z_TIER_D,Z_OPEN_MAX'},
  {id: 'LV6', name: 'Epēshu at the zoom-through threshold', rule: 'anchor', name_of: 'Epēshu', zoom: 'Z_OPEN_MAX+0.5'},
  {id: 'LV7', name: 'The Fell Mountains', rule: 'route-stop', stop: 4, band: 'region'},
  {id: 'LV8', name: 'The White Sea in storm season', rule: 'marker', name_of: 'White Sea', band: 'country', day: 'snapshot'},
  {id: 'LV9', name: 'Open sea (control)', rule: 'filigree-hex', ref: 'F08', zoom: 7}
]
const GATE_VIEWS = ['LV1', 'LV2', 'LV3', 'LV4', 'LV5', 'LV6', 'LV7', 'LV8']   // LV9 is the control (G1.7)
const INSTANTS = {t0: 0, t1: 4000}   // ms of presentation time; tDark comes from --dark-scan (q09)
const PROFILES5 = ['iphone13', 'pixel7', 'landscape', 'desktop', 'desktop2x']
const REF_KINDS = ['data', 'anchor', 'metric', 'class', 'print', 'lc']   // ref grammar: data:<file>#<json pointer> | anchor:<path>::<literal> | metric:<file>#<key> | class:<filigree class id> | print:<LVn>@<x>,<y> | lc:<LC id>
const ROUND_Q = 4
const QUESTIONS = [   // §5.2: one targeted question each; lens refute -> judge, recount -> triage, second-look -> audit
  {id: 'q02', role: 'audit', lens: 'second-look', topic: 'which code moves the atlas today', brief: 'Which code moves the atlas today? Every rAF caller, CSS animation, timer and clock token in maps-site/index.html with path:line, whether each stops when hidden or reduced, measured with living-measure --frames --living 0 rAF counts on LV1 and LV3.'},
  {id: 'q03', role: 'audit', lens: 'second-look', topic: 'how one still-chart control writes the atlas motion state', brief: 'How does one still-chart control write the atlas\'s one motion state? jReduceMq, jReduced(), jrn.forceReduced, #jbar-reduce, setRoutePlaying after the reduced-motion item; what journey playback does under it; why no second matchMedia is needed.'},
  {id: 'q04', role: 'audit', lens: 'recount', topic: 'which existing pane hosts the living canvas', brief: 'Which existing pane hosts the living canvas? The pane list and z order from L0, what pJTrail holds, the name panes above it, the frozen filigree pane table (sheet-spec.json, read-only), and how the Leaflet Renderer.js scheme keeps a canvas in step during zoomanim.'},
  {id: 'q05', role: 'deep', lens: 'refute', topic: 'where exactly the routes run', brief: 'Where exactly do the routes run? party-route.json stops and via[], JPATH arc length, the legs the journey treats as teleports, named ways vs traced roads vs the print (px offsets), the sea-lane splines, top-origin conversion, and the Fell Mountains placement (marker y -93 vs party-route.json index 4, 0-based).'},
  {id: 'q06', role: 'deep', lens: 'second-look', topic: 'whether the sheet-wide sea mask serves the shimmer', brief: 'Does the sheet-wide sea mask serve the shimmer? If "Living · the sheet-wide sea mask (tool)" is checked: water fraction per view (view-data), the harbour and DEM-agreement tests; else what the mask would need. Never Filigree\'s mask outside the window.'},
  {id: 'q07', role: 'audit', lens: 'second-look', topic: 'what river data exists', brief: 'What river data exists? Filigree 3\'s in-window rivers.json (present, overlap check), the later sheet-wide trace, and which river devices stay deferred.'},
  {id: 'q08', role: 'audit', lens: 'refute', topic: 'what the living traffic snapshot would hold', brief: 'What would the living traffic snapshot hold? W.agents fields (route, departDay, speed, kind), routePos, W.routeVolume/pairLoads, W.seaRoutes, via living-measure --export-traffic --seed epeshu --day <d> --out <tmp> (a temp path, never maps-site/); the sim-to-atlas window transform; bytes; the display noun for the sim\'s ship kind.'},
  {id: 'q09', role: 'audit', lens: 'second-look', topic: 'the dark hour in closed form', brief: 'What is the dark hour in closed form? const darkHour =, _tamarDir, renderTod (300 s per drawn day) copied into a presentation-day function; --dark-scan gives tDark; the dim amount that stays under the name panes.'},
  {id: 'q10', role: 'deep', lens: 'refute', topic: 'what canon backs for each of the 21 devices', brief: 'What does canon back for each of the 21 devices? Against wiki-places.json, party-route.json, reviews.json, party.json, lexicon/patrinaic.json: the Loon Sea placement (no atlas coordinates; print lettering or none), Lugal, hoarwyrms and Witch-Birds, the storm season, each device\'s tier against the research table.'},
  {id: 'q11', role: 'audit', lens: 'second-look', topic: 'which words the chart may show', brief: 'Which words may the chart show? The display nouns (mūskar, khophesh, galley), the proposed strings (todo-inputs.json strings), VOCAB_LC and the UG9 words, the voice rubric (docs/mobile/voice-rubric.md, read-only).'},
  {id: 'q12', role: 'audit', lens: 'second-look', topic: 'what the zoom-through stands on', brief: 'What does the zoom-through stand on? street= in index.html, docs/street/gates/views.json and its stills, ANNALS.street, "Sim ↔ atlas continuity", the Epēshu landmarks in chart-pois.json, the band from Z_OPEN_MAX to Z_STREET in the window; what slice Z waits for.'},
  {id: 'q13', role: 'triage', lens: 'recount', topic: 'what the chart may cost in bytes', brief: 'What may the chart cost in bytes? L0 iphone13 first view (bytes, requests), the LC14 hook ceiling, lazy chunk estimates, gzip by server.js, the offline manifest (present? does any captured desktop view show a size it derives?).'},
  {id: 'q14', role: 'judge', lens: 'refute', topic: 'which bible classes these devices are', brief: 'Which bible classes are these devices? Map every device onto the filigree density-bible classes (B-18 caravan_halt, B-37 fog_wash, B-41 muster_day, B-42 shut_way) and the street bible\'s classes when present; which device reads notices= (shut ways), read-only.'}
]
const seenQ = new Set(QUESTIONS.map(q => norm(q.topic)))   // follow-up dedup (P7; the prelude's norm); grows with every accepted follow-up
const LENS_ROLE = {refute: 'judge', recount: 'triage', 'second-look': 'audit'}
const FIXABLE = ['G1.1', 'G1.2', 'G1.3', 'G1.4', 'G1.5', 'G1.6', 'G1.7', 'G1.8', 'G1.9', 'G1.10', 'G1.13']   // a follow-up round (research + patch + re-gate) can move these; G1.11, G1.12 and G1.14 it cannot
const AMB_MAX = 4
const HEX64 = /^[0-9a-f]{64}$/
const MEASURE_T = MODE === 'smoke' ? OUTABS + '/tools/living-measure.js' : MEASURE   // smoke never writes into the repo
const MEASURE_REL = MODE === 'smoke' ? OUT + '/tools/living-measure.js' : 'tools/living-measure.js'
const SRV_PORT = (SANDBOX_LC.match(/server\.js on (\d+)/) || [])[1] || 'the server.js port'   // the contract names it; the body never spells it
const CDN_TEXT = CDN ? `--cdn-dir ${CDN}` : '--cdn-dir T'
const SANDBOX_T = SANDBOX_LC + (CDN ? '' : '\nT = one mktemp -d dir you build once per this recipe (the npm pack step) and reuse for every command of this task; never assume it survives a resume (a resumed run rebuilds it). Its path goes into no relayed tool line: a relayed line stays exactly as the tool printed it.')
const RULE_DATA = {'route-leg': 'party-route.json', 'route-stop': 'party-route.json', anchor: 'city-anchors.json', marker: 'maps_markers.json'}
const LV_DATA = [...new Set(LV_RULES.map(v => RULE_DATA[v.rule]).filter(Boolean))].map(f => REPO + '/maps-site/data/' + f)
const ALLOWED = [BIBLE_MD, BIBLE_JSON, VIEWS_JSON, VIEW_DIR, VIEW_DATA, L0, REPO + '/maps-site/data/', FIL + '/density-bible.json']   // the appliers' read allowlist (G1.14)
const ZONE_RULE = 'zones grammar (each entry one string): "sheet" (everywhere on the sheet) | "bbox:x0,y0,x1,y1" (atlas px, top origin, x0<x1, y0<y1) | "data:<repo-relative file>" (present where that file has >= 1 feature in the view; e.g. data:maps-site/data/named-ways.json) | "mask:sea" (present where the view\'s sea fraction > 0). band = [zmin, zmax] in atlas zoom, inclusive. A device is present on a view when the view zoom lies in its band and one zone holds.'
const REF_RULE = 'ref grammar (exactly one prefix): data:<repo-relative file>#<json pointer> | anchor:<repo-relative path>::<literal> | metric:<file>#<key> | class:<filigree density-bible class id> | print:<LVn>@<x>,<y> (atlas px inside that view) | lc:<LC id>'
const DET_RULE_LC = `Determinism (LC12, LC13): motion is presentation only. Presentation time accumulates the rAF timestamp argument with dt clamped to 100 ms, so it freezes under the capture's virtual clock; randomness only from keyed streams ${KEY_IDIOM} (an xmur3 to mulberry32 copy inside maps-site/living.js); positions are pure functions of (seed literal, class, id, snapshot day, presentation time); zero clock tokens (grep -E '${LC_CLOCK_GREP}') in maps-site/living.js and maps-site/living/**; no new sim state, no createPane, no WebGL, never a notices= write; the hook marker is ${HOOK_MARK} and the param is ${LIVING_PARAM}=1.`
const LINE_RULE = 'Return the tool\'s one stdout JSON line parsed, every field unchanged (it carries len and sum; do not reformat, round, re-sort or drop anything). If it printed {"ok":false,...} without len/sum, return that object with len: -1 and sum: "" added; if it printed nothing parseable, return {ok: false, error: "<last stderr line>", len: -1, sum: ""}.'
const INSTRUMENT_CONTRACT = `- Requires from \`./mobile-capture.js\` only names in its \`module.exports\` (L7): \`startServer\`, \`launch\`,
  \`loadPlaywright\`, \`resolveCdn\`, \`openPage\`, \`pump\`, \`PROFILES\`, \`clockTokens\`, \`imageDiff\`, \`pngDecode\`,
  \`pngEncode\`, \`braceRange\`. Never edits it, never writes \`docs/mobile/\`, never binds ${SRV_PORT} (\`--port\`, 0 default).
- Every summary mode prints ONE JSON line \`{"ok":true,…,"len":N,"sum":H}\` with \`len\`/\`sum\` over the key-sorted JSON of
  the other fields exactly as \`tools/mobile-tree.js\` (FNV-1a 32), or \`{"ok":false,"error":…}\` and exit 1.
- Modes: \`--self-test\`; \`--freeze-views --rules F --out F --stills D\`; \`--check-views --views F --rules F\`
  (prints \`moved\`); \`--view-data --views F --out F\` (per view: features in the viewport bbox per data file, \`sea_frac\`
  from \`maps-site/living/sea-mask.png\` when present); \`--keys --out F\` (every output key it can emit, frozen as
  \`gates/measure-keys.json\`; later versions may add keys, never drop one); \`--dark-scan\`; \`--freeze-summary\`;
  \`--frames --views F [--ids …] --profiles p,q --living 0|1 --t a,b[,c] --scenarios s1,… [--runs 2] --out F
  [--shots-dir D]\` with scenarios \`moving still reduce hidden card layer-off below-band offscreen zoom-anim
  block-chunk coexist\` (coexist = \`filigree=1&living=1\`), reporting per view × profile × scenario: \`glyphs
  [{class,id,x,y,alpha}]\` in atlas px, \`glyph_sha\`, \`class_counts\`, \`raf_living\` (callbacks over 120 pumped frames),
  \`draws_per_s\`, \`still_sha\`, \`console_errors\`, \`page_errors\`, \`label_overlap_px\`, \`zoom_drift_px\`,
  \`transform_during_zoomanim\`, \`alpha_ramp_ms_max\`, \`control {present, rect, aria_label, pressed}\`, \`j_reduced\`,
  \`journey_playing\`; before \`maps-site/living.js\` exists every on-run reports \`living:"absent"\` and still measures
  today's motion owners; \`--static [--hooks <living-spec.json>]\` (clock tokens by pattern W in \`maps-site/living.js\` and
  \`maps-site/living/**\`; forbidden names \`createPane matchMedia W.rng getContext('webgl\` \`THREE\` and the five atlas
  function names; gz bytes per lazy file; the raw growth \`size(maps-site/index.html) − size(restore(...))\`; the hook
  table \`[{line, marked, declared, replaces_found}]\`; \`restore_sha\`; \`strings\` from the \`LC_STRINGS\` literal of
  \`living.js\`; \`notices_writes\`); \`--export-traffic --seed S --day D --out F\`; \`--validate-bible F --md F --constants
  F\`; \`--resolve-refs F\`; and, for Living 2, \`--spec-summary SPEC --bible BIBLE --md MD\` (the units, rules, slices,
  hook lines, caps, eases, template, strings and prerequisites of \`docs/living/living-spec.json\` in the shape of
  workflow 2 §5.3, flattened to the fields its G2 criteria read) and \`--resolve-pointers SPEC --answers F --probes F\`
  (JSON-pointer resolution of every reader answer and every probe's \`spec_pointer\`).
- Living 3's slice L0 extends the instrument with \`--gate-summary F --spec F --slice S\` (the GL numbers of workflow 3
  §8 as one line), \`--lint-on F\` and \`--score F --frames F\` (the on-state accept files), as tool units; an
  extension may add keys to \`gates/measure-keys.json\` and never drops one (Living 3 checks the key list ⊇ Living 1's).
- The virtual clock is the capture's: rAF timestamps come from the pumped virtual time, so a frozen clock gives a
  frozen frame; \`--t\` pumps to an instant.
- \`--self-test\` copies \`maps-site/\` to a temp dir (never edits the repo), injects the toy loader there, and checks:
  the pass toy layer passes every scenario; each fail toy (rAF while hidden, a position from \`Math.random\`, a
  \`createPane\`, a 600 ms fade-in, a glyph inside a label box, an error on a blocked chunk) fails exactly its metric;
  \`double-run\` equal; \`seed-sensitivity\` (one keyed seed shifted moves \`glyph_sha\`). Cases \`[{case, ok, detail}]\`.`
const LINE_SHAPES = `Line shapes this job scores in code (each one JSON line; len/sum over the key-sorted JSON of every other field, FNV-1a 32 as tools/mobile-tree.js):
- --self-test --repo R: {ok, cases: [{case, ok, detail}], len, sum}; no timing, path, port or pid in the line, so two runs print the same line.
- --freeze-views --rules F --out F --stills D: writes views.json {date, rules (the rules file verbatim), views: [{id, zoom, bbox: [x0,y0,x1,y1], center: [x,y], focus_inside_data, still_sha}]} and D/<LVn>.png (<= 300 KB each, full_path kept). Rule kinds: fit = the atlas whole-chart fit at the desktop profile; filigree-view = the centre and zoom of entry <ref> of docs/filigree/gates/views.json; route-leg = the bbox of party-route.json stops[<stops>] (0-based, inclusive range), zoom = the midpoint of the named band; route-stop = party-route.json stops[<stop>] at the named band's midpoint; anchor = the city-anchors.json entry <name_of>, zoom by its expression over the var Z_STREET=..., Z_OPEN_MAX=..., Z_TIER_D=... line of maps-site/index.html (mid:a,b = (a+b)/2); marker = the maps_markers.json entry <name_of> at the band midpoint, day snapshot = the traffic snapshot day; filigree-hex = the centre of fixture <ref> of docs/filigree/gates/hexes.json at the given zoom. Bands (country, region, city) come from docs/filigree/sheet-spec.json (read-only). focus_inside_data = the focus was found in its source and lies inside the print (0..4390 x 0..2188 atlas px). Coordinates are top-origin atlas px (px = map.unproject([x,y],4)).
- --check-views --views F --rules F --out F2: re-resolves and prints {ok, moved: [ids whose zoom, bbox or centre moved, or whose rule changed], len, sum}, and writes the same line to F2.
- --freeze-summary --views F --view-data F --keys F [--check F2]: {ok, views: [{id, zoom, bbox, center, focus_inside_data, still_sha}], view_data: {LVn: {features: {<repo-relative data file>: count}, sea_frac}}, moved (F2's moved, [] without --check), refrozen (true without --check), keys_n, views_sha, view_data_sha, keys_sha, tDark (from the last --dark-scan, ms of presentation time), len, sum}.
- --validate-bible F --md F --constants F: {ok, errors: [], devices: {<device id>: {moves, default, status, band, zones, still_rule, canon_tier, driving_state, owner_gate, home}}, sheet_wide: [], checklist: {devices_n, asks_n, missing: []}, canon_mismatch: [], vocab_hits: [], forbidden_rules: [], refs_total, len, sum}. checklist.missing = every constants.DEVICES id without a devices entry and every constants.ASKS key without an asks entry; canon_mismatch = device ids whose canon_tier differs from constants.CANON_TABLE; vocab_hits = matches of constants.VOCAB_LC in living-bible.md outside the sections "## Provenance" and "## Renames", plus matches of VOCAB_LC or JARGON_LC in every string under a "label", "name", "noun", "string", "strings" or "fiction" key of the json; forbidden_rules = ids of rules[] whose kind is not "forbidden" and whose text adds sim state, a pane (createPane), a clock token (pattern W), WebGL in maps-site/ or a notices= write.
- --resolve-refs F (F = {refs: [], lc_ids: [], views, fil_bible, repo}): {ok, resolved: {<ref>: true|false}, len, sum}; data: the file exists and the JSON pointer resolves; anchor: the literal occurs in the file (String.indexOf); metric: the key exists in the JSON file; class: a classes[].id of fil_bible; print: the view exists in views and x,y lie inside its bbox; lc: one of lc_ids; any other prefix false.`
const TOY_RULE = `Toy layers (${TOY}): small hand-written scripts injected only into the temp copy of maps-site/ that --self-test makes. The pass toy draws on one canvas inside pane pJTrail, takes presentation time from the rAF timestamp argument (dt clamped to 100 ms, so it freezes under the capture's virtual clock), draws positions from a keyed stream ${KEY_IDIOM} (an xmur3 to mulberry32 copy) and stops its rAF while hidden, still or below its band; each fail toy breaks exactly one rule as the contract lists.`
const BOUND = 2 * 4 + (1 + 2 + 2 * (1 + 2)) + 2 * 2 + QUESTIONS.length + 2 * QUESTIONS.length + 2 * 2 + (2 * 2 + 2 + AMB_MAX)
  + ROUNDS * (2 + ROUND_Q + 2 * ROUND_Q + 2 + 2 + 2 * 2 + 2 + AMB_MAX) + 2 * 4   // §8: crit agents count twice; 138 at maxRounds 2 (README §11 cap 150)

// ---- schemas (design §4) ----
const S = {type: 'string'}, B = {type: 'boolean'}, I = {type: 'integer'}, N = {type: 'number'}, SA = {type: 'array', items: S}, OBJ = {type: 'object'}
const PRE = {type: 'object', properties: {missing: SA, anchors: OBJ, chain: {type: 'object', properties: {f4: OBJ, rm_checked: B, l0_checked: B, sheet_spec_sha: S, density_bible_sha: S, filigree_views_sha: S}, required: ['f4', 'rm_checked', 'sheet_spec_sha', 'density_bible_sha', 'filigree_views_sha']},
  overrides: {type: 'object', properties: {lc: OBJ, fil: OBJ, st: OBJ}, required: ['lc', 'fil', 'st']}, ledger: OBJ, gate_prev: OBJ, tool_shas: OBJ}, required: ['missing', 'anchors', 'chain', 'overrides', 'ledger', 'gate_prev', 'tool_shas']}
const HOLD = {type: 'object', additionalProperties: true, properties: {ok: B, len: I, sum: S}, required: ['ok', 'len', 'sum']}
const DRIFT = {type: 'object', properties: {living: OBJ, street: OBJ}, required: ['living', 'street']}
const CITE = {type: 'object', properties: {st_texts: OBJ, fil_texts: OBJ, sha: OBJ}, required: ['st_texts', 'fil_texts', 'sha']}
const TOOLW = {type: 'object', properties: {path: S, sha256: S, modes: SA, notes: S}, required: ['path', 'sha256', 'modes']}
const TOOLC = {type: 'object', properties: {a: HOLD, b: HOLD, equal: B, sha256: S, contract_ok: B, infra_error: S}, required: ['a', 'b', 'equal', 'sha256', 'contract_ok', 'infra_error']}
const FREEZE = {type: 'object', additionalProperties: true, properties: {ok: B, len: I, sum: S}, required: ['ok', 'len', 'sum']}
const L0R = {type: 'object', properties: {path: S, sha256: S, exit_code: I, profile_errors: SA, profiles: SA, shots_ok: B, atlas_sha: S, index_sha: S, reused: B, infra_error: S}, required: ['path', 'sha256', 'exit_code', 'profile_errors', 'profiles', 'shots_ok', 'atlas_sha', 'index_sha', 'reused', 'infra_error']}
const QFILE = {type: 'object', properties: {path: S, sha256: S, parsed: B, claims_n: I, gaps_n: I}, required: ['path', 'sha256', 'parsed', 'claims_n']}
const ANCH = {type: 'object', properties: {qid: S, claims: {type: 'array', items: {type: 'object', properties: {id: S, found: B}, required: ['id', 'found']}}}, required: ['qid', 'claims']}
const LENS = {type: 'object', properties: {qid: S, struck: SA, corrected: {type: 'array', items: {type: 'object', properties: {id: S, fix: S}, required: ['id', 'fix']}}}, required: ['qid', 'struck', 'corrected']}
const BIBLE = {type: 'object', properties: {md: QFILE, json: QFILE}, required: ['md', 'json']}
const VALID = {type: 'object', additionalProperties: true, properties: {ok: B, len: I, sum: S}, required: ['ok', 'len', 'sum']}
const ITEM = {type: 'object', properties: {class: S, state: S, tier: S, still: S, ref: S}, required: ['class', 'state', 'tier', 'still', 'ref']}
const APPLY = {type: 'object', properties: {views: {type: 'object', additionalProperties: {type: 'object', properties: {move: {type: 'array', items: ITEM}, still: {type: 'array', items: ITEM}, silent: B}, required: ['move', 'still', 'silent']}}, lv9_move: SA, files_read: SA}, required: ['views', 'lv9_move', 'files_read']}
const RESOLVE = {type: 'object', additionalProperties: true, properties: {ok: B, len: I, sum: S}, required: ['ok', 'len', 'sum']}
const AMBIG = {type: 'object', properties: {view: S, verdict: S, bible_says: S, cite: S}, required: ['view', 'verdict', 'bible_says', 'cite']}
const CRITIC = {type: 'object', properties: {followups: {type: 'array', items: {type: 'object', properties: {id: S, role: S, topic: S, brief: S, why: S}, required: ['id', 'role', 'topic', 'brief', 'why']}}}, required: ['followups']}
const PATCH = {type: 'object', properties: {md: QFILE, json: QFILE, patched: SA}, required: ['md', 'json', 'patched']}

// ---- small helpers ----
const arr = x => Array.isArray(x) ? x : []
const obj = x => (x && typeof x === 'object' && !Array.isArray(x)) ? x : {}
const same = (a, b) => JSON.stringify(canonJ(a === undefined ? null : a)) === JSON.stringify(canonJ(b === undefined ? null : b))
const toolErr = x => !!x && x.ok === false   // a tool's own {"ok":false,...} line (relayed with len -1)
async function relay(p, o) {   // a tool-line relay: one fresh agent when the first dies or mis-relays (lenOk); counts like crit()
  const a = await agent(p, o)
  if (a && (lenOk(a) || toolErr(a))) return a
  log((a ? 'mis-relayed: ' : 'agent died: ') + o.label + '; one fresh relay')
  return agent(p, {...o, label: o.label + ' (retry)'})
}
const driftIds = d => ['living', 'street'].flatMap(k => arr(obj(obj(d)[k]).checks).filter(c => c && !c.ok).map(c => k + ' ' + c.id + (c.detail ? ' (' + String(c.detail).slice(0, 80) + ')' : ''))).join('; ') || 'no drift report'
const jac = (a, b) => { const x = new Set(a), y = new Set(b), u = new Set([...x, ...y]); if (!u.size) return 1; let i = 0; for (const c of x) if (y.has(c)) i++; return i / u.size }
const sameSet = (a, b) => { const x = new Set(a), y = new Set(b); return x.size === y.size && [...x].every(c => y.has(c)) }
const pct = (k, n) => n ? Math.round(1000 * k / n) / 10 : 0
const oneLine = s => String(s ?? '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim().slice(0, 140)

// ---- P0 Preflight (parallel: preflight, hold, drift, cite) ----
phase('Preflight')
const INPUTS = [DOSSIER, TODO, RULINGS_JSON, FIL + '/density-bible.json', FIL + '/sheet-spec.json', FIL + '/gates/views.json', FIL + '/gates/hexes.json', ...LV_DATA, CAPTURE, TREE_TOOL, LDRIFT]
const PREFLIGHT_TASK = `Preflight for Living 1 (read-only: write nothing outside a mktemp -d dir).
A. anchors: ${ANCHOR_TASK}
B. missing = every one of these that does not exist: ${INPUTS.join(' ; ')}.
C. chain: f4 = the ${FIL}/gates/4-review-c<k>.json with the highest integer k as {k, pass: parsed.pass === true, forced: parsed.forced_by != null || parsed.forced === true}, or null when none exists; rm_checked = some line of ${REPO}/POLISH.md starts with "- [x] **Atlas reduced motion for its own animations"; l0_checked = some line starts with "- [x] **Living 0 ·" (informational); sheet_spec_sha, density_bible_sha, filigree_views_sha = sha256sum of ${FIL}/sheet-spec.json, ${FIL}/density-bible.json, ${FIL}/gates/views.json ("" when absent).
D. overrides: lc = the "overrides" object of ${RULINGS_JSON}; fil = the "overrides" object of ${FIL}/rulings.json; st = the "overrides" object of ${STD}/rulings.json ({} when a file or its key is absent; string values only).
E. ledger from ${LEDGER} if it parses: {tool_sha: its tool_sha or "", questions: for each entry of its "questions": {qid, path, sha256 (the recorded one), sha_ok (the file at path exists and sha256sum equals the recorded sha256), struck, corrected, topic} copied from the entry, seen_topics: its seen_topics or [], asked_ids: its asked_ids or []}. Absent or unparsable: {tool_sha: "", questions: [], seen_topics: [], asked_ids: []}.
F. gate_prev from ${GATE1} if it parses: {exists: true, pass: parsed.pass === true, mode: parsed.mode or "", forced: parsed.forced_by != null, md_ok: the artifacts entry whose path ends "living-bible.md" has a sha256 equal to sha256sum ${BIBLE_MD}, json_ok: the same for living-bible.json and ${BIBLE_JSON}, tool_sha: the sha256 of the artifacts entry whose path ends "living-measure.js" ("" when none), answers_exists: ${ANSWERS} exists and parses, ledger_exists: ${LEDGER} exists and parses, stamps: parsed.stamps or {}, cited: parsed.cited or {}}. Absent: {exists: false}.
G. tool_shas: {mobile_capture: sha256sum ${CAPTURE}, mobile_tree: sha256sum ${TREE_TOOL}, living_measure: sha256sum ${MEASURE_T} or null when absent}.
Return {missing, anchors (the map of A), chain, overrides, ledger, gate_prev, tool_shas}.`
const CITE_TASK = `Cited rulings (read-only; a node script in a mktemp -d dir; write nothing else).
1. Read ${REPO}/.claude/workflows/street-1-research.js, take the text from the line that starts "const ST_RULINGS = {" through the next line that is exactly "}", evaluate it as an object literal (new Function("return " + text without the leading "const ST_RULINGS = ")), then for each key of the "overrides" object of ${STD}/rulings.json (absent = {}) that is a non-empty string, use it in place of the default. st_texts = {${ST_CITED.join(', ')}: <merged text>} (only these ids).
2. fil_texts = the texts below, each replaced by a non-empty string under the same key of the "overrides" object of ${FIL}/rulings.json (absent = {}): ${JSON.stringify(Object.fromEntries(FIL_CITED.map(k => [k, RULINGS[k]])))}
3. sha = {street_1_research: sha256sum of that script, street_rulings: sha256sum ${STD}/rulings.json or "", filigree_rulings: sha256sum ${FIL}/rulings.json or ""}.
Return {st_texts, fil_texts, sha}.`
const [pre, hold, drift, cite] = await parallel([
  () => crit(PL(PREFLIGHT_TASK), {label: 'preflight', phase: 'Preflight', schema: PRE, ...M('triage')}),
  () => crit(PL(HOLD_TASK_LC), {label: 'hold', phase: 'Preflight', schema: HOLD, ...M('triage')}),
  () => crit(PL(DRIFT_TASK_LC), {label: 'drift', phase: 'Preflight', schema: DRIFT, ...M('triage')}),
  () => crit(PL(CITE_TASK), {label: 'cite', phase: 'Preflight', schema: CITE, ...M('triage')})
])
for (const [x, l] of [[pre, 'preflight'], [hold, 'hold'], [drift, 'drift'], [cite, 'cite']]) if (!x) return done({reason: 'agent died: ' + l, agents_bound: BOUND, polish_inserts_above: 'Living 2 · Planning'})
const lost = anchorsLost(pre.anchors)
if (lost.length) die('anchor lost: ' + lost.join('; '))
if (obj(drift.living).ok !== true || obj(drift.street).ok !== true) die('prelude drift: ' + driftIds(drift))
const chain = obj(pre.chain), f4 = chain.f4 && typeof chain.f4 === 'object' ? chain.f4 : null
const missing = arr(pre.missing)
const f4ok = !!(f4 && f4.pass === true && f4.forced !== true)
const chainOk = f4ok && chain.rm_checked === true && !missing.length
const heldBy = holdOf(hold, 'freeze')
const LCR = lcRulingsMerge(obj(pre.overrides).lc)
const FILR = rulingsMerge(obj(pre.overrides).fil)
const gapsPre = []
const filCode = Object.fromEntries(FIL_CITED.map(k => [k, FILR.r[k]]))
if (!same(filCode, obj(cite.fil_texts))) gapsPre.push('cite: the relayed filigree R texts differ from the prelude texts merged with docs/filigree/rulings.json (the code merge is recorded)')
const RUSED = {lc: LCR.used, fil: Object.fromEntries(FIL_CITED.map(k => [k, FILR.used[k]]))}
if (MODE === 'plan') {
  return done({reason: 'plan', agents_bound: BOUND, chain_ok: chainOk, missing, held_by: heldBy, owner_rulings_used: RUSED, polish_inserts_above: 'Living 2 · Planning',
    chain: {f4, rm_checked: chain.rm_checked === true, l0_checked: chain.l0_checked === true},
    plan: {questions: QUESTIONS.map(q => q.id), views: LV_RULES.map(v => v.id), rounds: ROUNDS, round_questions: ROUND_Q},
    polish_note: `plan: ${QUESTIONS.length} questions, ${LV_RULES.length} views, at most ${BOUND} agents including crit() retries (cap 150)` + (chainOk ? '' : '; chain not met: ' + [f4ok ? '' : 'Filigree 4 not an unforced pass', chain.rm_checked === true ? '' : 'reduced-motion item unchecked', missing.length ? 'missing ' + missing.length + ' input(s)' : ''].filter(Boolean).join(', ')) + (heldBy.length ? '; held: ' + heldBy[0] : '')})
}
if (missing.length) die('missing inputs: ' + missing.join(', '))
if (heldBy.length) return done({reason: 'held', held_by: heldBy, agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: 'Living 2 · Planning', polish_note: 'Living 1: held (' + heldBy[0] + '); no release'})
if (!f4ok) die('living research waits for the finished table map: the latest docs/filigree/gates/4-review-c<k>.json is not an unforced pass')
if (chain.rm_checked !== true) die('living research waits for the atlas reduced-motion item')
if (chain.l0_checked !== true) log('Living 0 is unchecked in POLISH.md (informational: a POLISH blocker, not a script check)')
const TS = obj(pre.tool_shas), GP = obj(pre.gate_prev), LG = obj(pre.ledger)
const STAMPS = {sheet_spec: chain.sheet_spec_sha || '', density_bible: chain.density_bible_sha || '', filigree_views: chain.filigree_views_sha || '', mobile_capture: TS.mobile_capture || '', mobile_tree: TS.mobile_tree || ''}
const CITED = {fil: filCode, st: obj(cite.st_texts), sha: obj(cite.sha)}
const OUTPUTS = [OUT + '/living-bible.md', OUT + '/living-bible.json', OUT + '/research/', OUT + '/fixtures/toy/', OUT + '/gates/views.json', OUT + '/gates/view/', OUT + '/gates/view-data.json', OUT + '/gates/measure-keys.json', OUT + '/captures/L0.json', OUT + '/gates/1-research.json', OUT + '/gates/1-view-answers.json', OUT + '/state/1-research.json', MEASURE_REL]
if (RESUME && MODE === 'full' && GP.exists === true && GP.pass === true && GP.mode === 'full' && GP.forced !== true && GP.md_ok === true && GP.json_ok === true && GP.answers_exists === true && GP.ledger_exists === true
  && Object.values(STAMPS).every(v => HEX64.test(v)) && same(obj(GP.stamps), STAMPS) && same(obj(obj(GP.cited).fil), CITED.fil) && same(obj(obj(GP.cited).st), CITED.st)
  && HEX64.test(GP.tool_sha || '') && GP.tool_sha === TS.living_measure) {
  return done({pass: true, reason: 'already passed: gate pass:true, the living bible re-hashes, the stamps (sheet spec, density bible, filigree views, mobile tools) and the cited rulings are unchanged', agents_bound: BOUND,
    gate_path: OUT + '/gates/1-research.json', outputs: OUTPUTS, owner_rulings_used: RUSED, polish_inserts_above: 'Living 2 · Planning',
    polish_note: 'Living 1 already passed on an unchanged living bible; nothing re-run', changelog_line: ''})
}

// ---- P1 Instrument (q01) ----
phase('Instrument')
const INSTRUMENT_TASK = `Instrument task (q01): write ${MEASURE_T} (create the directory), the living track's instrument, to the contract below, and its toy layers under ${TOY}. Read ${CAPTURE} for its exported functions and its virtual clock; never edit it. ${MODE === 'smoke' ? `This is a smoke run: first copy ${CAPTURE} to ${OUTABS}/tools/mobile-capture.js (a read-only copy beside the smoke instrument; never edit either) so ./mobile-capture.js resolves. ` : ''}Load ./mobile-capture.js through Node's CommonJS module loader in one destructuring const {...} = <loader>('./mobile-capture.js') statement (the form tools/living-drift.js L7 parses), naming only the functions you use. Every mode takes --repo <dir> (the checkout it serves and reads; default the parent of the tool's own directory) and --port (0 default). Stamp the date ${DATE} in a header comment. Run node ${MEASURE_T} --self-test --repo ${REPO} --port ${PORT} ${CDN_TEXT} until every case is ok and two runs print the same line.
${SANDBOX_T}
The instrument contract (workflow-1-research.md §5.4, verbatim):
${INSTRUMENT_CONTRACT}
${LINE_SHAPES}
${TOY_RULE}
${DET_RULE_LC}
Return {path (absolute path of the tool), sha256 (sha256sum of it), modes (every mode it implements), notes (one line; the CDN dir T when you built one)}.`
const CHECK_TASK = `Instrument check (write nothing outside a mktemp -d dir; never edit the tool). From ${REPO}: run node ${MEASURE_T} --self-test --repo ${REPO} --port ${PORT} ${CDN_TEXT} twice (two separate runs). a and b: ${LINE_RULE.replace('Return the tool', 'each is the tool')} equal = the two lines with len and sum removed compare equal as text. sha256 = sha256sum ${MEASURE_T} ("" when absent). contract_ok = node ${LDRIFT} --json (from ${REPO}) prints a report whose every L7 check has ok true. infra_error = "" or the setup failure (port, browser, CDN) that kept the self-test from running.
${SANDBOX_T}
Return {a, b, equal, sha256, contract_ok, infra_error}.`
const instWhy = c => {
  if (!c) return ['instrument check died (after its retry)']
  const w = []
  for (const k of ['a', 'b']) {
    const l = c[k]
    if (!lenOk(l)) w.push(`self-test run ${k}: ${l && l.ok === false ? 'failed: ' + oneLine(l.error) : 'line mis-relayed (len/sum)'}`)
    else {
      const cs = arr(l.cases)
      if (!cs.length) w.push(`self-test run ${k}: no cases`)
      cs.filter(x => !x || x.ok !== true).forEach(x => w.push(`self-test run ${k}: case ${x && x.case} failed: ${oneLine(x && x.detail)}`))
    }
  }
  if (!(c.equal === true && lenOk(c.a) && lenOk(c.b) && c.a.len === c.b.len && c.a.sum === c.b.sum)) w.push('double run: the two self-test lines differ')
  if (c.contract_ok !== true) w.push('contract: tools/living-drift.js L7 not ok')
  if (!HEX64.test(c.sha256 || '')) w.push('tool sha256 missing or malformed')
  return [...new Set(w)]
}
const checkInst = tag => crit(PL(CHECK_TASK), {label: 'instrument check' + tag, phase: 'Instrument', schema: TOOLC, ...M('triage')})
const infraOf = x => !!x && typeof x.infra_error === 'string' && x.infra_error.trim() !== ''
let IC = null, instFixes = 0
const toolSame = RESUME && HEX64.test(TS.living_measure || '') && TS.living_measure === LG.tool_sha
if (toolSame) {
  IC = await checkInst(' (resume)')
  if (IC && !infraOf(IC) && !instWhy(IC).length) log('instrument unchanged since the ledger and its self-test passes: kept')
} else {
  const w = await agent(PL(INSTRUMENT_TASK), {label: 'instrument', phase: 'Instrument', schema: TOOLW, ...M('deep')})
  if (!w) log('agent died: instrument (the check decides whether a tool exists)')
  IC = await checkInst('')
}
if (infraOf(IC)) return done({reason: 'infra', agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: 'Living 2 · Planning', polish_note: 'infra (instrument check): ' + oneLine(IC.infra_error)})
while (instWhy(IC).length && instFixes < 2) {
  instFixes++
  const why = instWhy(IC)
  const fx = await agent(PL(`Fix the living instrument ${MEASURE_T} (fix ${instFixes} of 2). The check found:
${why.join('\n')}
Failing self-test cases, verbatim: ${JSON.stringify([...arr(obj(IC && IC.a).cases), ...arr(obj(IC && IC.b).cases)].filter(x => x && x.ok !== true))}
Fix only ${MEASURE_T} and the toy layers under ${TOY}; never edit ${CAPTURE}.
${INSTRUMENT_TASK}`), {label: 'instrument fix ' + instFixes, phase: 'Instrument', schema: TOOLW, ...M('deep')})
  if (!fx) log('agent died: instrument fix ' + instFixes)
  IC = await checkInst(' after fix ' + instFixes)
  if (infraOf(IC)) return done({reason: 'infra', agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: 'Living 2 · Planning', polish_note: 'infra (instrument check): ' + oneLine(IC.infra_error)})
}
const instOk = instWhy(IC).length === 0
log(`instrument: ${instOk ? 'self-test ok, double run equal, L7 ok' : 'failing: ' + instWhy(IC).join('; ')} after ${instFixes} fix(es)`)

// ---- run state (filled by P2-P7) ----
let FZ = null, L0C = null, bible = null, VAL = null, G = {A: null, B: null, res: null, amb: []}, ev = null, rounds = 0, holdRec   // holdRec stays undefined until Record
const gapsResearch = [], gapsGate = []
const STRUCK = new Set(), FIXES = {}
const verified = []   // {q, file, struck, corrected}: questions whose anchor and lens both answered (the integrator's input)
const askedIds = new Set(QUESTIONS.map(q => q.id).concat(arr(LG.asked_ids)))
arr(LG.seen_topics).forEach(t => seenQ.add(norm(t)))
const askedTopic = new Map(QUESTIONS.map(q => [q.id, q.topic]))   // id -> topic of every question asked, this run and the ledger's (the critic's list)
arr(LG.questions).forEach(x => { if (x && x.qid && typeof x.topic === 'string' && x.topic && !askedTopic.has(String(x.qid))) askedTopic.set(String(x.qid), x.topic) })
const viewOf = id => arr(obj(FZ).views).find(v => v && v.id === id) || null
const vdOf = id => obj(obj(obj(FZ).view_data)[id])

// ---- research + verify machinery ----
const READS_NOTE = `Read-only inputs: ${DOSSIER}, ${TODO}, ${RULINGS_JSON}, ${REPO}/maps-site/ (all of it), ${REPO}/index.html, ${REPO}/lexicon/patrinaic.json, ${FIL}/ and ${STD}/ (read-only), the frozen fixtures ${VIEWS_JSON}, ${VIEW_DATA}, ${KEYS_JSON} and the living-off reference ${L0}.`
const researchPrompt = (q, tag) => PL(`Research question ${q.id}${tag || ''}. Answer this ONE question and nothing else:
${q.brief}
${READS_NOTE}
Anchors re-derived by pattern this run (literal -> path:line):
${anchorMap(pre.anchors)}
The instrument: node ${MEASURE_T} --repo ${REPO} --port ${PORT} ${CDN_TEXT} <mode> (modes in its header); run it when a measurement settles a claim. Any --frames run passes --out ${OUTABS}/shots/${q.id}/frames.json and --shots-dir ${OUTABS}/shots/${q.id}/; every other output goes to a mktemp -d dir (never maps-site/, never docs/mobile/).
${q.id === 'q04' ? 'When the other tracks\' anchors matter to the pane question, run this check and cite what it finds as claims (its "Return" describes the script\'s output, not your answer, which stays the research file below): ' + FIL_ST_ANCHOR_TASK + '\n' : ''}${SANDBOX_T}
Living rulings (merged):
${rulingText(LCR.r, Object.keys(LC_RULINGS))}
Cited filigree and street rulings:
${Object.entries(CITED.fil).concat(Object.entries(CITED.st)).map(([k, v]) => k + ': ' + v).join('\n')}
${DET_RULE_LC}
${VOCAB_LC_RULE}
Write ${RESEARCH}/${q.id}.json (create the directory) = {qid: "${q.id}", date: "${DATE}", claims: [{id: "${q.id}-c01", text, and exactly one of anchor ("<repo-relative path>::<literal found by String.indexOf>"), data_ref ("<repo-relative file>#<json pointer>") or metric ("<instrument mode> :: <key> = <value>"), canon_tier (canon | inferred | invented | invented-behaviour, when the claim is about canon)}], gaps: []}. Anything you cannot establish is a gaps[] entry, never a guess. ${READBACK} Also return claims_n (the number of claims) and gaps_n.`)
const anchorPrompt = (q, f) => PL(`Anchor check for research question ${q.id} (strings only; write nothing outside a mktemp -d dir). Read ${f.path} (sha256 ${f.sha256}). For every claim with an anchor "<path>::<literal>": found = the literal occurs in ${REPO}/<path> by String.indexOf (a node script; literals hold quotes, so no shell grep). For every claim with a data_ref "<file>#<json pointer>": found = ${REPO}/<file> parses and the pointer resolves. Claims with only a metric are not listed. Return {qid: "${q.id}", claims: [{id, found}]}.`)
const LENS_TEXT = {
  refute: 'Refute: try to break each claim from its cited source (the code, data or command it names); strike what you disprove, correct what is wrong but fixable, keep what you cannot break.',
  recount: 'Recount: re-run the numbers behind each claim by command (throwaway scripts in a mktemp -d dir; the instrument per the sandbox recipe when the claim cites it); strike what you cannot reproduce, correct a number you reproduce differently.',
  'second-look': 'Second look: re-read the cited spans yourself (anchor lines, data entries, metric lines) and strike every claim the source itself does not say; correct a claim the source says differently.'
}
const lensPrompt = (q, f, L) => PL(`Verify research question ${q.id} through ONE lens: ${L}.
Question: ${q.brief}
Research file: ${f.path} (sha256 ${f.sha256}); read its claims and their anchor, data_ref or metric.
${LENS_TEXT[L]}
${READS_NOTE}
${L === 'recount' ? SANDBOX_T + '\nThe instrument: node ' + MEASURE_T + ' --repo ' + REPO + ' --port ' + PORT + ' ' + CDN_TEXT + ' <mode>.\n' : ''}Write nothing. Return {qid: "${q.id}", struck: [claim ids], corrected: [{id, fix (the corrected claim text)}]}.`)
async function research(qs, tag) {   // P3: researchers in parallel; nulls and malformed files are gaps
  const rs = await parallel(qs.map(q => () => agent(researchPrompt(q, tag), {label: (q.follow ? 'follow-up ' : 'research ') + q.id, phase: q.follow ? 'Follow-up' : 'Research', schema: QFILE, ...M(q.role)})))
  const got = rs.map(r => r && FILE_OK(r) ? r : null)
  got.forEach((r, i) => { if (!r) { gapsResearch.push(`${qs[i].id}: no evidence (research agent died or its file did not parse)`); log('agent died: research ' + qs[i].id) } })
  return got
}
async function verify(qs, files, tag) {   // P4: one parallel over all 2 x n agents (no pipeline); a null anchor or lens leaves the question unverified
  const live = qs.map((q, i) => [q, files[i]]).filter(([, f]) => f)
  const outs = await parallel(live.flatMap(([q, f]) => [
    () => agent(anchorPrompt(q, f), {label: 'anchor ' + q.id + (tag || ''), phase: q.follow ? 'Follow-up' : 'Verify', schema: ANCH, ...M('mech')}),
    () => agent(lensPrompt(q, f, q.lens), {label: 'lens ' + q.id + (tag || ''), phase: q.follow ? 'Follow-up' : 'Verify', schema: LENS, ...M(LENS_ROLE[q.lens] || 'audit')})
  ]))
  const ok = []
  live.forEach(([q, f], i) => {
    const an = outs[2 * i], le = outs[2 * i + 1]
    if (!an || !le) { gapsResearch.push(`${q.id}: unverified (${!an ? 'anchor' : 'lens'} agent died); its claims are kept out of the bible and the ledger`); log(`unverified: ${q.id} (${!an ? 'anchor' : 'lens'} died)`); return }
    const struck = [...new Set(arr(an.claims).filter(c => c && c.found === false).map(c => String(c.id)).concat(arr(le.struck).map(String)))]
    const corrected = arr(le.corrected).filter(c => c && !struck.includes(String(c.id)))
    struck.forEach(c => STRUCK.add(c)); corrected.forEach(c => { FIXES[c.id] = c.fix })
    const v = {q, file: f, struck, corrected}
    ok.push(v); verified.push(v)
  })
  return ok
}
const EVIDENCE = vs => vs.map(v => `${v.file.path} (sha256 ${v.file.sha256})`).join('\n') || '(none)'
const STRUCK_TEXT = () => `Struck claims (disproved; never use them): ${[...STRUCK].join(', ') || '(none)'}
Corrections (use the corrected text instead of the claim's own): ${JSON.stringify(FIXES)}`

// ---- bible, validator, gate (shared by the first pass and every follow-up round) ----
const BIBLE_SHAPE = `${BIBLE_JSON} = {date: "${DATE}", devices: {<id>: {class_id, filigree_class, canon_tier, default ("on" | "off"), owner_gate ("" | an LC id), driving_state, moves (boolean), still_rule ("" or how it holds still), band: [zmin, zmax], zones: [...], data_refs: [refs], still_frame, cost: {draws_per_s, bytes_gz}, slice, status ("build" | "deferred" | "ruled-out"), home ("" or the POLISH item that will supply it)}}, sheet_wide: [device ids that apply to the whole sheet], asks: {${ASKS.join(', ')}}, rules: [{id: "LB-01", kind ("must" | "forbidden" | "threshold" | "determinism" | "source"), text, covers: [device ids]}], debts: [...]}.
Device ids are exactly: ${DEVICES.join(', ')} (21; every one gets an entry). Canon tiers are exactly the research table: ${JSON.stringify(CANON_TABLE)}; an invented or invented-behaviour device is default "off" with its LC owner_gate; a device with no data source is "deferred" with its POLISH home; LC-rise is "ruled-out" (LC10).
${ZONE_RULE}
${REF_RULE}
${BIBLE_MD}: one section per device (what moves, when, where, how it holds still, its canon tier and source), the fixture views LV1-LV9 in general terms (rules by band and zone, never the fixture answers), the six asks, the debts, "## Renames" and "## Provenance".`
const BIBLE_RETURN = `Return {md: {path, sha256 (sha256sum), parsed: true when it exists and is non-empty, claims_n: the number of "## " headings}, json: {path, sha256, parsed: JSON.parse succeeds, claims_n: the number of devices}}.`
const BIBLE_RULES = () => `Living rulings (merged; overrides already applied):
${rulingText(LCR.r, Object.keys(LC_RULINGS))}
Cited filigree and street rulings (read-only):
${Object.entries(CITED.fil).concat(Object.entries(CITED.st)).map(([k, v]) => k + ': ' + v).join('\n')}
${DET_RULE_LC}
${VOCAB_LC_RULE}
Never a rule that adds sim state, a pane, a clock token, WebGL in maps-site/ or a notices= write (those belong in "forbidden" rules only).`
const VALIDATE_TASK = `Bible validator (write only a temp file in a mktemp -d dir). Write this JSON to <tmp>/constants.json verbatim: ${JSON.stringify({DEVICES, ASKS, CANON_TABLE, LC_IDS: Object.keys(LC_RULINGS), VOCAB_LC: VOCAB_LC.source, JARGON_LC: JARGON_LC.source})}
Then from ${REPO} run node ${MEASURE_T} --repo ${REPO} --port ${PORT}${CDN ? ' --cdn-dir ' + CDN : ''} --validate-bible ${BIBLE_JSON} --md ${BIBLE_MD} --constants <tmp>/constants.json. ${LINE_RULE}`
const validate = tag => relay(PL(VALIDATE_TASK), {label: 'validator' + tag, phase: 'Synthesize', schema: VALID, ...M('triage')})
const applyPrompt = () => PL(`Still-frame test. You may read ONLY these (a path ending "/" means the files under it): ${ALLOWED.join(', ')}. Open nothing else: the script checks files_read against this allowlist.
The views: ${VIEWS_JSON} views[] (id, zoom, bbox, center), their stills ${VIEW_DIR}<id>.png and their features in ${VIEW_DATA}. From the bible alone (${BIBLE_MD}, ${BIBLE_JSON}), for each view ${GATE_VIEWS.join(', ')}: move = every class (a device id, a key of living-bible.json devices) that moves on that view; still = at least two classes that stay still there. Each item {class, state (that device's driving_state), tier (its canon_tier), still (what the still frame shows of it on this view), ref (one source, ${REF_RULE})}. Set silent true for a view the bible does not let you decide (and leave its lists empty). lv9_move = the classes that move on LV9 (the open-sea control).
files_read = every file you opened (absolute paths). Return {views: {LV1: {move, still, silent}, ...}, lv9_move, files_read}.`, true)
async function runGate(tag) {
  const [a, b] = await parallel([
    () => crit(applyPrompt(), {label: 'applier A' + tag, phase: 'Still-frame gate', schema: APPLY, ...M('deep')}),
    () => crit(applyPrompt(), {label: 'applier B' + tag, phase: 'Still-frame gate', schema: APPLY, ...M('judge')})
  ])
  if (!a) log('agent died: applier A' + tag); if (!b) log('agent died: applier B' + tag)
  const refs = [...new Set([a, b].filter(Boolean).flatMap(x => Object.values(obj(x.views)).flatMap(v => arr(obj(v).move).concat(arr(obj(v).still))).map(it => it && it.ref).filter(r => typeof r === 'string')))]
  let res = null
  if (refs.length) {
    res = await relay(PL(`Ref resolver (write only a temp file in a mktemp -d dir). Write this JSON to <tmp>/refs.json verbatim: ${JSON.stringify({refs, lc_ids: Object.keys(LC_RULINGS), views: VIEWS_JSON, fil_bible: FIL + '/density-bible.json', repo: REPO})}
Then from ${REPO} run node ${MEASURE_T} --repo ${REPO} --port ${PORT}${CDN ? ' --cdn-dir ' + CDN : ''} --resolve-refs <tmp>/refs.json. ${LINE_RULE}`), {label: 'resolver' + tag, phase: 'Still-frame gate', schema: RESOLVE, ...M('triage')})
    if (!res || !lenOk(res)) { log('resolver' + tag + ': ' + (res ? 'mis-relayed or failed' : 'agent died') + '; no ref resolves'); res = null }
  }
  const moveOf = (x, id) => [...new Set(arr(obj(obj(obj(x).views)[id]).move).map(it => it && it.class))]
  const disputed = a && b ? GATE_VIEWS.filter(id => !sameSet(moveOf(a, id), moveOf(b, id))).map(id => ({id, j: jac(moveOf(a, id), moveOf(b, id))})).sort((p, q) => p.j - q.j || GATE_VIEWS.indexOf(p.id) - GATE_VIEWS.indexOf(q.id)).slice(0, AMB_MAX) : []
  const amb = disputed.length ? await parallel(disputed.map(d => () => agent(PL(`Ambiguity judge for view ${d.id}: two blind appliers named different moving sets (Jaccard ${d.j.toFixed(2)}). Applier A: ${JSON.stringify(moveOf(a, d.id))}. Applier B: ${JSON.stringify(moveOf(b, d.id))}. Read ${BIBLE_MD}, ${BIBLE_JSON}, the view in ${VIEWS_JSON} and ${VIEW_DATA}. Which reading does the bible support? Cite the section or rule. Your verdict never overrides the code score. Write nothing. Return {view: "${d.id}", verdict ("A" | "B" | "neither" | "both"), bible_says, cite}.`),
    {label: 'ambiguity ' + d.id + tag, phase: 'Still-frame gate', schema: AMBIG, ...M('judge')}))) : []
  amb.forEach((x, i) => { if (!x) log('agent died: ambiguity ' + disputed[i].id + tag + ' (ignored)') })
  return {A: a, B: b, res, amb: amb.filter(Boolean)}
}

// ---- computed sets and the G1 score (code only; design §6-§7) ----
const DEVS = () => VAL && lenOk(VAL) ? obj(VAL.devices) : {}
const zoneHolds = (z, v, vd) => {
  if (typeof z !== 'string') return false
  if (z === 'sheet') return true
  if (z === 'mask:sea') return typeof vd.sea_frac === 'number' && vd.sea_frac > 0
  let m = z.match(/^bbox:(-?[\d.]+),(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)$/)
  if (m) { const [x0, y0, x1, y1] = m.slice(1).map(Number), bb = arr(v.bbox).map(Number); return bb.length === 4 && x0 <= bb[2] && x1 >= bb[0] && y0 <= bb[3] && y1 >= bb[1] }
  m = z.match(/^data:(.+)$/)
  if (m) return dataCount(vd, m[1]) >= 1
  return false
}
const dataCount = (vd, file) => { const f = obj(vd.features), base = file.split('/').pop(); return Number(f[file] ?? Object.entries(f).filter(([k]) => k.split('/').pop() === base).reduce((s, [, n]) => s + Number(n || 0), 0)) || 0 }
const hasSource = (d, vd) => arr(d.zones).some(z => (typeof z === 'string' && /^data:/.test(z) && dataCount(vd, z.slice(5)) >= 1) || (z === 'mask:sea' && typeof vd.sea_frac === 'number' && vd.sea_frac > 0))
function computedSets(id) {
  const v = viewOf(id), vd = vdOf(id), out = {move: [], still: []}
  if (!v || typeof v.zoom !== 'number') return out
  for (const [k, d0] of Object.entries(DEVS())) {
    const d = obj(d0), band = arr(d.band)
    const present = band.length === 2 && v.zoom >= band[0] && v.zoom <= band[1] && arr(d.zones).some(z => zoneHolds(z, v, vd))
    if (!present) continue
    if (d.moves === true && d.default === 'on' && d.status === 'build') out.move.push(k)
    if (d.moves !== true || !!d.still_rule) out.still.push(k)
  }
  return out
}
function scoreApplier(a, comp, resolved) {   // per-applier numbers for G1.1-G1.4 and G1.8
  const r = {eq: 0, minJ: 0, still2: 0, items: 0, carry: 0, refs: 0, refsOk: 0, viewRefMin: 0, silent: [], views: {}}
  if (!a) return r
  const devs = DEVS(), V = obj(a.views)
  let minJ = 1, viewMin = 1
  for (const id of GATE_VIEWS) {
    const x = V[id], c = comp[id]
    if (!x || typeof x !== 'object' || x.silent === true) r.silent.push(id + (x ? '' : ' (missing)'))
    const mv = arr(obj(x).move).filter(Boolean), st = arr(obj(x).still).filter(Boolean)
    const named = [...new Set(mv.map(it => it.class))], stillN = [...new Set(st.map(it => it.class))]
    const j = jac(named, c.move), eq = sameSet(named, c.move)
    const sOk = stillN.length >= 2 && stillN.every(k => c.still.includes(k))
    if (eq) r.eq++; if (sOk) r.still2++
    minJ = Math.min(minJ, j)
    const its = mv.concat(st)
    const carry = its.filter(it => devs[it.class] && it.state === devs[it.class].driving_state && it.tier === devs[it.class].canon_tier).length
    const rok = its.filter(it => typeof it.ref === 'string' && REF_KINDS.includes(it.ref.split(':')[0]) && resolved[it.ref] === true).length
    r.items += its.length; r.carry += carry; r.refs += its.length; r.refsOk += rok
    const vp = its.length ? rok / its.length : 0
    viewMin = Math.min(viewMin, vp)
    r.views[id] = {named, j: Math.round(j * 100) / 100, eq, still_ok: sOk, refs: `${rok}/${its.length}`}
  }
  r.minJ = Math.round(minJ * 100) / 100; r.viewRefMin = Math.round(viewMin * 1000) / 10
  return r
}
function score(note) {   // note: the run stopped before the gate (every criterion but G1.11 is recorded "not evaluated")
  const NE = note ? 'not evaluated: ' + note : ''
  const ne = m => NE || m, ok = x => !NE && !!x
  const val = VAL && lenOk(VAL) ? VAL : null, VD = !VAL ? 'validator died' : 'validator line failed or mis-relayed'
  const comp = Object.fromEntries(GATE_VIEWS.map(id => [id, computedSets(id)]))
  const resolved = G.res && lenOk(G.res) ? obj(G.res.resolved) : {}
  const sA = scoreApplier(G.A, comp, resolved), sB = scoreApplier(G.B, comp, resolved)
  const sides = [['A', G.A, sA], ['B', G.B, sB]]
  const sw = arr(obj(val).sheet_wide), devs = DEVS()
  const g1 = sides.every(([, a, s]) => a && s.eq >= 7 && s.minJ >= 0.75)
  const g2 = sides.every(([, a, s]) => a && s.still2 >= 7)
  const g3 = sides.every(([, a, s]) => a && s.items > 0 && s.carry / s.items >= 0.95)
  const g4 = sides.every(([, a, s]) => a && s.refs > 0 && s.refsOk / s.refs >= 0.9 && s.viewRefMin >= 75)
  const noSrc = GATE_VIEWS.flatMap(id => comp[id].move.filter(k => !sw.includes(k) && !hasSource(obj(devs[k]), vdOf(id))).map(k => id + ':' + k))
  const canonBad = DEVICES.filter(k => !devs[k] || devs[k].canon_tier !== CANON_TABLE[k])
  const invBad = DEVICES.filter(k => devs[k] && /^invented/.test(CANON_TABLE[k]) && !(devs[k].default === 'off' && typeof devs[k].owner_gate === 'string' && Object.prototype.hasOwnProperty.call(LC_RULINGS, devs[k].owner_gate)))
  const srcBad = DEVICES.filter(k => { const d = devs[k]; if (!d) return false; const z = arr(d.zones); const sourced = sw.includes(k) || z.some(x => x === 'sheet' || x === 'mask:sea' || (typeof x === 'string' && /^(data|bbox):/.test(x))); return !sourced && !(d.status === 'ruled-out' || (d.status === 'deferred' && typeof d.home === 'string' && d.home.trim())) })
  const riseBad = !devs['LC-rise'] || devs['LC-rise'].status !== 'ruled-out'
  const g6 = !!val && !canonBad.length && !invBad.length && !srcBad.length && !riseBad && !arr(val.canon_mismatch).length
  const lv9 = sides.map(([X, a]) => [X, a ? arr(a.lv9_move).filter(k => !sw.includes(k)) : null])
  const silentAll = sides.flatMap(([X, a, s]) => a ? s.silent.map(v => X + ':' + v) : [X + ': no answer'])
  const ck = obj(obj(val).checklist), devKeys = Object.keys(devs)
  const g9 = !!val && arr(ck.missing).length === 0 && ck.devices_n === DEVICES.length && ck.asks_n === ASKS.length && DEVICES.every(k => devKeys.includes(k))
  const fz = FZ && lenOk(FZ) ? FZ : null, vs = arr(obj(fz).views)
  const vOk = LV_RULES.filter(r => vs.some(v => v && v.id === r.id && v.focus_inside_data === true)).length
  const l0 = L0C, l0Ok = !!l0 && l0.exit_code === 0 && !arr(l0.profile_errors).length && l0.shots_ok === true && PROFILES5.every(p => arr(l0.profiles).includes(p))
  const keysOk = !!fz && Number.isInteger(fz.keys_n) && fz.keys_n > 0
  const iw = instWhy(IC).concat(fz ? (keysOk ? [] : ['gates/measure-keys.json not written (keys_n 0)']) : [note ? 'key list not frozen (the run stopped before Freeze)' : 'key list: the freeze died'])
  const blind = sides.flatMap(([X, a]) => a ? blindBad(a.files_read, ALLOWED).map(p => X + ': ' + p) : [])
  const SHA_KEYS = ['index', 'atlas', 'maps_other', 'docs_filigree', 'docs_street', 'docs_mobile', 'workflows', 'tools_other']
  const h0 = obj(hold.shas), h1 = holdRec && lenOk(holdRec) ? obj(holdRec.shas) : null
  const coexBad = !h1 ? ['the Record hold read died or mis-relayed'] : SHA_KEYS.filter(k => !same(h0[k], h1[k])).map(k => k + ' moved during the run')
  const coexText = holdRec === undefined ? 'not yet read (Record)' : coexBad.join('; ') || 'shas equal'
  const j = s => `eq ${s.eq}/8, min Jaccard ${s.minJ}`
  const criteria = [
    C('G1.1', 'moving set = computed on >= 7/8 gate views, Jaccard >= 0.75 on all 8 (per applier)', ne(sides.map(([X, a, s]) => X + ': ' + (a ? j(s) : 'agent died')).join('; ')), '>= 7/8 equal and min Jaccard >= 0.75, both appliers', ok(g1)),
    C('G1.2', '>= 2 still classes per view, all in the computed still set, on >= 7/8 views (per applier)', ne(sides.map(([X, a, s]) => X + ': ' + (a ? s.still2 + '/8' : 'agent died')).join('; ')), '>= 7/8, both appliers', ok(g2)),
    C('G1.3', 'named classes carry the bible\'s driving_state and canon_tier', ne(sides.map(([X, a, s]) => X + ': ' + (a ? pct(s.carry, s.items) + '% of ' + s.items : 'agent died')).join('; ')), '>= 95%, both appliers', ok(g3)),
    C('G1.4', 'refs resolve (--resolve-refs)', ne(sides.map(([X, a, s]) => X + ': ' + (a ? pct(s.refsOk, s.refs) + '% overall, min view ' + s.viewRefMin + '%' : 'agent died')).join('; ') + (G.res ? '' : '; resolver: no line')), '>= 90% overall and no view below 75%, both appliers', ok(g4)),
    C('G1.5', 'every computed moving class has a source feature in view_data or is sheet-wide', ne(!val ? VD : noSrc.join(', ') || 'all sourced'), 'none unsourced', ok(!!val && !!fz && !noSrc.length)),
    C('G1.6', 'canon tiers = CANON_TABLE; invented devices off + LC owner_gate; sourceless devices deferred with a home; LC-rise ruled-out', ne(!val ? VD : [canonBad.length ? 'tier: ' + canonBad.join(', ') : '', invBad.length ? 'invented not off/gated: ' + invBad.join(', ') : '', srcBad.length ? 'sourceless not deferred: ' + srcBad.join(', ') : '', riseBad ? 'LC-rise not ruled-out' : '', arr(val.canon_mismatch).length ? 'validator canon_mismatch: ' + val.canon_mismatch.join(', ') : ''].filter(Boolean).join('; ') || 'ok'), 'all hold', ok(g6)),
    C('G1.7', 'control view LV9: lv9_move within sheet_wide (both appliers)', ne(lv9.map(([X, x]) => X + ': ' + (x === null ? 'agent died' : x.join(', ') || 'ok')).join('; ')), 'both empty beyond sheet_wide', ok(!!val && lv9.every(([, x]) => x !== null && !x.length))),
    C('G1.8', 'bible silence', ne(silentAll.join(', ') || 0), 0, ok(!silentAll.length)),
    C('G1.9', 'checklist 27/27 (21 devices + 6 asks)', ne(!val ? VD : `devices ${ck.devices_n}/${DEVICES.length}, asks ${ck.asks_n}/${ASKS.length}` + (arr(ck.missing).length ? '; missing ' + ck.missing.join(', ') : '')), '27/27, missing []', ok(g9)),
    C('G1.10', 'forbidden rules (sim state, pane, clock token, WebGL, notices= write)', ne(!val ? VD : arr(val.forbidden_rules).join(', ') || 0), 0, ok(!!val && !arr(val.forbidden_rules).length)),
    C('G1.11', 'instrument: both self-test lines lenOk and ok, every case ok, double run equal, L7 contract, measure-keys written', iw.join('; ') || 'ok', 'all hold', !iw.length),
    C('G1.12', 'fixtures: 9/9 views with focus_inside_data, moved empty, L0 exit 0 on five profiles, no profile error, shots ok', ne(!fz ? 'freeze line missing' : `${vOk}/${LV_RULES.length} views, moved ${arr(fz.moved).join(', ') || 'none'}; L0 ${l0 ? 'exit ' + l0.exit_code + ', profiles ' + arr(l0.profiles).length + '/5, errors ' + arr(l0.profile_errors).length + ', shots ' + l0.shots_ok : 'missing'}`), '9/9, moved [], L0 clean', ok(!!fz && vOk === LV_RULES.length && !arr(fz.moved).length && l0Ok)),
    C('G1.13', 'voice: vocab_hits (bible strings and fiction fields outside ## Provenance)', ne(!val ? VD : arr(val.vocab_hits).join(' | ') || 0), 0, ok(!!val && !arr(val.vocab_hits).length)),
    C('G1.14', 'blindness (files_read within the allowlist) and coexistence (Record hold shas = preflight)', ne([blind.length ? 'blind: ' + blind.join(', ') : 'blind ok', coexText].join('; ')), 'no read outside ALLOWED; the eight sha groups equal', ok(!!G.A && !!G.B && !blind.length && !!h1 && !coexBad.length))
  ]
  return {criteria, sA, sB, comp}
}
const failing = e => e.criteria.filter(c => !c.pass)

// ---- P2 Freeze, P3 Research, P4 Verify, P5 Synthesize, P6 Gate, P7 Follow-up (only on a passing instrument) ----
if (instOk) {
  phase('Freeze')
  const RULES_FILE = {date: DATE, v: V_BUST, views: LV_RULES, instants: INSTANTS}
  const FREEZE_TASK = `Freeze the living fixture views (frozen once; README §5.1). All temp files in a mktemp -d dir (<tmp>). Write this rules file VERBATIM to <tmp>/rules.json: ${JSON.stringify(RULES_FILE)}
${RESUME ? `1. If ${VIEWS_JSON} exists: run node ${MEASURE_T} --repo ${REPO} --port ${PORT} ${CDN_TEXT} --check-views --views ${VIEWS_JSON} --rules <tmp>/rules.json --out <tmp>/check.json (never rewrite or delete ${VIEWS_JSON} or ${VIEW_DIR}), skip step 2 and go to step 3 with CHECK = --check <tmp>/check.json. If it does not exist, go to step 2 with CHECK empty.` : `1. resume is false: go to step 2 even when ${VIEWS_JSON} exists, with CHECK empty.`}
2. node ${MEASURE_T} --repo ${REPO} --port ${PORT} ${CDN_TEXT} --freeze-views --rules <tmp>/rules.json --out ${VIEWS_JSON} --stills ${VIEW_DIR} (create the directories).
3. Then: --view-data --views ${VIEWS_JSON} --out ${VIEW_DATA}; --keys --out ${KEYS_JSON}; --dark-scan --out <tmp>/dark.json; and finally --freeze-summary --views ${VIEWS_JSON} --view-data ${VIEW_DATA} --keys ${KEYS_JSON} CHECK (each with --repo ${REPO} --port ${PORT} ${CDN_TEXT}).
${SANDBOX_T}
${LINE_RULE} (the --freeze-summary line)`
  FZ = await relay(PL(FREEZE_TASK), {label: 'freeze', phase: 'Freeze', schema: FREEZE, ...M('triage')})
  if (!FZ) return done({reason: 'agent died: freeze', agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: 'Living 2 · Planning'})
  if (toolErr(FZ)) return done({reason: 'infra', agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: 'Living 2 · Planning', polish_note: 'infra (freeze): ' + oneLine(FZ.error)})
  if (!lenOk(FZ)) return done({reason: 'agent died: freeze', agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: 'Living 2 · Planning', polish_note: 'the freeze line was mis-relayed twice'})
  const moved = arr(FZ.moved)
  if (moved.length) {
    if (MODE === 'full') die('fixtures changed (moved: ' + moved.join(', ') + '); delete docs/living/gates/views.json and docs/living/gates/view/ to re-freeze')
    gapsResearch.push('fixtures moved (not a full run): ' + moved.join(', '))
  }
  L0C = await crit(PL(`The living-off reference L0 (README §5.4). ${RESUME ? `When ${L0} exists, parses, and every desktop and desktop2x shot it lists re-hashes (sha256sum of each file under ${L0_SHOTS}/ equals its recorded sha): write nothing and return it with reused true. Otherwise: ` : ''}wait for any running capture as the read-only rule bounds it (at most 20 minutes, then infra_error "capture busy"; never kill one), then from ${REPO} run node ${CAPTURE} --atlas --profiles ${PROFILES5.join(',')} --unit L0 --out ${OUTABS}/captures/L0.json --shots-dir ${OUTABS}/shots/L0 ${CDN_TEXT} --port ${PORT} (absolute paths, so the capture writes only under ${OUTABS}; never under docs/mobile/).
${SANDBOX_T}
Return {path, sha256 (sha256sum of ${L0}), exit_code (the capture's exit code; 0 when reused), profile_errors (every per-profile error the capture recorded), profiles (the profile names present), shots_ok (every listed shot exists under ${L0_SHOTS}/), atlas_sha (its meta.atlas_sha), index_sha (its meta.index_sha), reused, infra_error ("" or the setup failure)}.`), {label: 'L0', phase: 'Freeze', schema: L0R, ...M('triage')})
  if (!L0C) return done({reason: 'agent died: L0', agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: 'Living 2 · Planning'})
  if (infraOf(L0C)) return done({reason: 'infra', agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: 'Living 2 · Planning', polish_note: 'infra (L0): ' + oneLine(L0C.infra_error)})

  phase('Research')
  const ledgerQ = arr(LG.questions).filter(x => x && x.qid && x.sha_ok === true && HEX64.test(x.sha256 || ''))
  const resumed = RESUME ? QUESTIONS.filter(q => ledgerQ.some(x => x.qid === q.id)) : []
  for (const q of resumed) {
    const x = ledgerQ.find(y => y.qid === q.id)
    arr(x.struck).forEach(c => STRUCK.add(String(c))); arr(x.corrected).forEach(c => { if (c && c.id) FIXES[c.id] = c.fix })
    verified.push({q, file: {path: x.path, sha256: x.sha256, parsed: true}, struck: arr(x.struck), corrected: arr(x.corrected), resumed: true})
  }
  for (const x of RESUME ? ledgerQ.filter(y => /^f\d+$/.test(y.qid)) : []) {   // verified follow-ups of earlier runs stay evidence
    arr(x.struck).forEach(c => STRUCK.add(String(c))); arr(x.corrected).forEach(c => { if (c && c.id) FIXES[c.id] = c.fix })
    verified.push({q: {id: x.qid, topic: String(x.topic || ''), follow: true}, file: {path: x.path, sha256: x.sha256, parsed: true}, struck: arr(x.struck), corrected: arr(x.corrected), resumed: true})
  }
  if (resumed.length) log(`resume: ${resumed.length} question(s) re-hash and are skipped: ${resumed.map(q => q.id).join(', ')}`)
  const todo = cap(QUESTIONS.filter(q => !resumed.includes(q)))
  const files = await research(todo, '')
  if (todo.length && !kept(files, 'research').ok) return done({reason: 'agent died: research', agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: 'Living 2 · Planning'})

  phase('Verify')
  await verify(todo, files, '')

  phase('Synthesize')
  const INTEG_TASK = `Integrate the living bible: what the living chart must stand on, so that a blind applier handed only the bible, the frozen views, their stills, view-data, L0, maps-site/data/ and the filigree density bible can name, for any view, the classes that move and the classes that stay still, with driving state, canon tier, still frame and a source ref.
Read ONLY: the verified research files below; ${DOSSIER}; ${TODO} (devices, canon, budgets, corrections, views, strings); ${VIEWS_JSON}; ${VIEW_DATA}; ${L0}; ${FIL}/density-bible.json (read-only, for its class ids).
Verified research (read only these; every other file under ${RESEARCH}/ is stale or unverified):
${EVIDENCE(verified)}
${STRUCK_TEXT()}
${BIBLE_RULES()}
Write ${BIBLE_MD} and ${BIBLE_JSON}.
${BIBLE_SHAPE}
${BIBLE_RETURN}`
  bible = await crit(PL(INTEG_TASK), {label: 'integrator', phase: 'Synthesize', schema: BIBLE, ...M('integ')})
  if (!bible || !FILE_OK(bible.md) || !FILE_OK(bible.json)) return done({reason: 'agent died: integrator', agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: 'Living 2 · Planning'})
  VAL = await validate('')
  if (!VAL || !lenOk(VAL)) log('validator: ' + (VAL ? 'line failed or mis-relayed' : 'agent died') + ' after one fresh relay (G1.9, G1.10, G1.13 fail)')

  phase('Still-frame gate')
  G = await runGate('')
  ev = score('')
  log(`gate: ${failing(ev).map(c => c.id).join(', ') || 'all criteria pass'} (coexistence read at Record)`)

  // ---- P7 Follow-up (bounded by ROUNDS; ROUND_Q questions; dedup by seenQ and asked ids; budget-gated) ----
  const FQ = /^f(\d+)\d$/   // follow-up ids f<round><n>, rounds numbered on from the ledger, so an id never repeats across runs
  const RBASE = Math.max(0, ...[...askedIds].map(x => FQ.exec(x)).filter(Boolean).map(m => Number(m[1])))
  while (rounds < ROUNDS && failing(ev).some(c => FIXABLE.includes(c.id))) {
    if (lowBudget()) { log('budget: follow-up round skipped'); break }
    const rr = rounds + 1, tag = ' r' + rr, fr = RBASE + rr
    phase('Follow-up')
    rounds = rr
    const fails = failing(ev).filter(c => FIXABLE.includes(c.id)).map(c => `${c.id} ${c.desc}: ${c.measured}`)
    const listedT = new Set([...askedTopic.values()].map(norm))
    const asked = [...askedTopic].map(([id, t]) => id + ': ' + t).concat([...askedIds].filter(id => !askedTopic.has(id)).map(id => id + ' (topic not recorded)'), [...seenQ].filter(t => !listedT.has(t)).map(t => '- ' + t))
    const cr = await crit(PL(`Completeness critic for the living bible (follow-up round ${rr}). The still-frame gate failed.
Failing criteria:
${fails.join('\n')}
Gaps:
${gapsGate.concat(gapsResearch, gapsPre).join('\n') || '(none)'}
Ambiguity verdicts: ${JSON.stringify(G.amb)}
Every question already asked (ids and topics, all rounds; never repeat one):
${[...new Set(asked)].join('\n')}
Read ${BIBLE_MD} and, as needed, the verified research files:
${EVIDENCE(verified)}
Emit at most ${ROUND_Q} fresh research questions that would close these gaps, each ONE targeted task: {id (a fresh id, e.g. "f${fr}1"), role (audit | deep | judge | triage), topic (a short phrase), brief (the one question, with its sources), why}. Wording and structure problems of the bible are not research questions; return an empty list when every gap is one of those. Write nothing. Return {followups}.`), {label: 'critic' + tag, phase: 'Follow-up', schema: CRITIC, ...M('judge')})
    if (!cr) log('agent died: critic' + tag + '; no fresh questions this round')
    const batch = new Set(), batchIds = new Set(), fresh = []
    for (const f of arr(obj(cr).followups)) {
      const k = norm(f && f.topic), fid = String(f && f.id)
      if (!k || seenQ.has(k) || batch.has(k)) { log(`follow-up dropped${tag}: topic already asked: ${oneLine(f && f.topic)}`); continue }
      if (askedIds.has(fid) || batchIds.has(fid)) { log(`follow-up dropped${tag}: id ${fid} repeats an asked id`); continue }
      batch.add(k); batchIds.add(fid); fresh.push(f)
    }
    fresh.slice(ROUND_Q).forEach(f => log(`follow-up dropped${tag}: over the round cap of ${ROUND_Q}: ${oneLine(f.topic)}`))
    const qs = fresh.slice(0, ROUND_Q).map((f, i) => {
      const role = ['audit', 'deep', 'judge', 'triage'].includes(f.role) ? f.role : 'audit'
      return {id: `f${fr}${i + 1}`, crit_id: String(f.id), role, lens: role === 'judge' ? 'refute' : role === 'triage' ? 'recount' : 'second-look', topic: String(f.topic), brief: String(f.brief), follow: true}
    })
    qs.forEach(q => { seenQ.add(norm(q.topic)); askedIds.add(q.id); askedIds.add(q.crit_id); askedTopic.set(q.id, q.topic); askedTopic.set(q.crit_id, q.topic) })
    if (!qs.length) { log(`follow-up round ${rr}: no fresh question; the bible cannot change, stopping`); break }
    log(`follow-up round ${rr}: ${qs.length} fresh question(s): ${qs.map(q => q.id).join(', ')}`)
    const ff = await research(cap(qs), tag)
    const nv = await verify(cap(qs), ff, tag)
    if (!nv.length) { log(`follow-up round ${rr}: no new verified claims; stopping`); break }
    const pt = await crit(PL(`Patch the living bible (follow-up round ${rr}) from the new verified claims only; never renumber or reuse rule ids (append after the highest); keep both files consistent; re-stamp date "${DATE}".
Files: ${BIBLE_MD} and ${BIBLE_JSON}.
New verified research (read only these):
${EVIDENCE(nv)}
${STRUCK_TEXT()}
Failing criteria:
${fails.join('\n')}
${BIBLE_RULES()}
${BIBLE_SHAPE}
${BIBLE_RETURN.replace('Return {md', 'Return {patched: [the device and rule ids you changed], md')}`), {label: 'patcher' + tag, phase: 'Follow-up', schema: PATCH, ...M('integ')})
    if (!pt || !FILE_OK(pt.md) || !FILE_OK(pt.json)) return done({reason: 'agent died: patcher' + tag, rounds, agents_bound: BOUND, owner_rulings_used: RUSED, polish_inserts_above: 'Living 2 · Planning'})
    bible = {md: pt.md, json: pt.json}
    log(`patched${tag}: ${arr(pt.patched).join(', ') || '(none listed)'}`)
    VAL = await validate(tag)
    if (!VAL || !lenOk(VAL)) log('validator' + tag + ': ' + (VAL ? 'line failed or mis-relayed' : 'agent died'))
    G = await runGate(tag)
    ev = score('')
    log(`gate${tag}: ${failing(ev).map(c => c.id).join(', ') || 'all criteria pass'}`)
  }
} else {
  log('instrument failed after ' + instFixes + ' fix(es): freeze, research and the gate are skipped; recording G1.11')
  gapsResearch.push('instrument: ' + instWhy(IC).join('; '))
}

// ---- P8 Record ----
phase('Record')
holdRec = await crit(PL(HOLD_TASK_LC), {label: 'hold (record)', phase: 'Record', schema: HOLD, ...M('triage')})
if (!holdRec || !lenOk(holdRec)) log('hold (record): ' + (holdRec ? 'mis-relayed' : 'agent died') + '; coexistence cannot be shown (G1.14 fails)')
ev = score(instOk ? '' : 'the instrument failed G1.11, so freeze, research and the still-frame gate did not run')
const fails = failing(ev)
const gaps = [...new Set(gapsPre.concat(gapsResearch, gapsGate, G.amb.map(a => `${a.view}: ${a.verdict} (${oneLine(a.bible_says)}; ${oneLine(a.cite)})`)))]
const shaOf = k => (bible && bible[k] && HEX64.test(bible[k].sha256 || '')) ? bible[k].sha256 : ''
const fzl = FZ && lenOk(FZ) ? FZ : {}
const gateRec = gateObj({criteria: ev.criteria, rounds, gaps,
  artifacts: [{path: OUT + '/living-bible.md', sha256: shaOf('md')}, {path: OUT + '/living-bible.json', sha256: shaOf('json')},
    {path: OUT + '/gates/views.json', sha256: fzl.views_sha || ''}, {path: OUT + '/gates/view-data.json', sha256: fzl.view_data_sha || ''},
    {path: OUT + '/gates/measure-keys.json', sha256: fzl.keys_sha || ''}, {path: OUT + '/captures/L0.json', sha256: (L0C && L0C.sha256) || ''},
    {path: MEASURE_REL, sha256: (IC && IC.sha256) || ''}],
  rulings_used: {lc: LCR.used}, cited: CITED, stamps: STAMPS, view_rules: LV_RULES, instants: INSTANTS, tDark: fzl.tDark ?? null, agents_bound: BOUND})
const ansOf = a => a ? {views: a.views, lv9_move: a.lv9_move, files_read: a.files_read} : null
const viewAnswers = {job: JOB, date: DATE, mode: MODE, rounds, views: GATE_VIEWS.map(id => ({id, computed: ev.comp[id], A: ev.sA.views[id] || null, B: ev.sB.views[id] || null})),
  answers: {A: ansOf(G.A), B: ansOf(G.B)}, ambiguity: G.amb}
const ledgerRec = {job: JOB, date: DATE, tool_sha: instOk && IC ? IC.sha256 : '',
  questions: verified.map(v => ({qid: v.q.id, path: v.file.path, sha256: v.file.sha256, struck: v.struck, corrected: v.corrected, topic: v.q.topic})),
  seen_topics: [...seenQ], asked_ids: [...askedIds], bible_sha: {md: shaOf('md'), json: shaOf('json')}}
const recs = [
  await recordL('gates/1-research.json', gateRec, 'record gates/1-research.json'),
  await recordL('gates/1-view-answers.json', viewAnswers, 'record gates/1-view-answers.json'),
  await recordL('state/1-research.json', ledgerRec, 'record state/1-research.json')
]
const recOk = recs.every(Boolean)
const seenIns = new Set(arr(obj(obj(hold.polish).living).gap_open).map(norm))
const insKeys = new Set(), inserts = []
if (!gateRec.pass) for (const c of fails) {
  if (/^not evaluated/.test(String(c.measured))) continue
  const title = `Living gap — ${c.id}: ${oneLine(c.measured)}`, key = norm(`Living gap — ${c.id}`)
  if ([...seenIns].some(t => t === key || t.startsWith(key + ' ')) || insKeys.has(key)) { log('polish insert dropped (already queued): ' + c.id); continue }
  insKeys.add(key)
  inserts.push(`- [ ] **${title}** — measured values in docs/living/gates/1-research.json (blocks Living 2; place directly above it)`)
}
const sA = ev.sA, sB = ev.sB, minJ = Math.min(sA.minJ, sB.minJ), refsP = Math.min(pct(sA.refsOk, sA.refs), pct(sB.refsOk, sB.refs))
const nDev = Object.keys(DEVS()).length
const pass = gateRec.pass && recOk
const reason = !recOk ? 'record-mismatch' : gateRec.pass ? '' : (fails.map(c => c.id).join(',') || MODE)
return done({pass, reason, rounds, agents_bound: BOUND, outputs: OUTPUTS, gate_path: OUT + '/gates/1-research.json', owner_rulings_used: RUSED,
  polish_note: pass ? `Living 1: living bible, ${nDev} devices, gate views ${Math.min(sA.eq, sB.eq)}/8 (min Jaccard ${minJ}), refs ${refsP}%, round ${rounds}`
    : `Living 1: ${reason || 'not a pass'}; living bible ${nDev} devices, gate views ${Math.min(sA.eq, sB.eq)}/8 (min Jaccard ${minJ}), refs ${refsP}%, round ${rounds}` + (inserts.length ? '; skip inserts already queued' : ''),
  polish_inserts: inserts, polish_inserts_above: 'Living 2 · Planning',
  changelog_line: pass ? 'docs: living chart — the living bible (Living 1)' : '', gate: gateRec})
