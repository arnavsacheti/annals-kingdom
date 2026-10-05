export const meta = {
  name: 'living-3-build',
  description: 'Living 3: build the living chart from living-spec.json units, slice by slice (L0 instrument and hooks, L1 still chart and clock, L2 routes and traffic, L3 sea, sky and creatures; scope zoom: Z); gate = still-chart test + slice gates',
  whenToUse: 'Run as the POLISH item "Living 3 · Implementation → the living chart" (multi-run) after docs/living/gates/2-plan.json passed: Workflow({name:"living-3-build", args:{date:"YYYY-MM-DD"}}); "Living 3z" passes scope:"zoom". Returns reason "held" while the table map, a mobile item or (zoom) the street view could be touched. Holds maps-site/index.html and maps-site/living* while running.',
  phases: [
    {title: 'Preflight', detail: 'drift, anchors (living + filigree + street), the hold, the chain, the ledger, the slice, the restore invariant'},
    {title: 'Rebase', detail: 'keep or re-take the living-off reference on restore(maps-site/index.html) in a temp tree'},
    {title: 'Build', detail: 'per unit: accept -> snapshot -> implement -> check -> measure (off + on, scored in code) -> fix <= 2 -> restore on failure -> record; one unit at a time'},
    {title: 'Slice gate', detail: 'manifest, off capture + accept, frames, static, spec checks; GL.1-GL.14 scored in code'},
    {title: 'Fix units', detail: 'diagnoser -> fix units into the ledger, built by the next run (<= 2 gate rounds per slice)'},
    {title: 'Smoke', detail: 'final gate only: both apps, both seeds, living=1 with filigree=1, zero console errors'},
    {title: 'Record', detail: 'manifest regenerated when maps-site changed; ledger, slice gate, final gate; coexistence re-read'}
  ]
}
const JOB = 'living-3-build'
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
// ---- Living 3 args (design §2; every rule is a die() directly after checkArgs) ----
checkArgs(['livingRulings', 'port', 'scope', 'slice', 'maxUnits', 'units', 'unstick', 'discard', 'gate', 'cdnDir'])
const SCOPE = A.scope ?? 'motion'
if (!['motion', 'zoom'].includes(SCOPE)) die('args.scope must be motion|zoom')
const SLICES = SCOPE === 'zoom' ? ['Z'] : ['L0', 'L1', 'L2', 'L3']
const strArr = v => Array.isArray(v) && v.every(x => typeof x === 'string' && /^[A-Za-z0-9._-]+$/.test(x))
if (A.slice != null && !SLICES.includes(A.slice)) die('args.slice must be one of ' + SLICES.join('|') + ' for scope ' + SCOPE)
const MAX_UNITS = A.maxUnits ?? 6
if (!Number.isInteger(MAX_UNITS) || MAX_UNITS < 1 || MAX_UNITS > 6) die('args.maxUnits must be an integer 1..6')
if (A.units != null && !(strArr(A.units) && A.units.length >= 1 && A.units.length <= MAX_UNITS)) die('args.units must be a non-empty array of unit id strings, at most maxUnits long')
if (A.unstick != null && !strArr(A.unstick)) die('args.unstick must be an array of unit id strings')
if (A.discard != null && !(Array.isArray(A.discard) && A.discard.every(x => typeof x === 'string' && /^fix-(L[0-3]|Z)\d+$/.test(x)))) die('args.discard must be an array of fix-<slice><n> ids')
const GATE_MODE = A.gate ?? 'auto'
if (!['auto', 'skip', 'only'].includes(GATE_MODE)) die('args.gate must be auto|skip|only')
if (GATE_MODE === 'only' && A.units != null) die('args.units is refused with gate:"only"')
if (A.cdnDir != null && (typeof A.cdnDir !== 'string' || !PATH_OK.test(A.cdnDir) || !A.cdnDir.startsWith('/'))) die('args.cdnDir must be an absolute path of letters, digits and _ / . + - only')
const CDN = A.cdnDir || null
const UNSTICK = new Set(A.unstick || []), DISCARD = new Set(A.discard || [])

// ---- constants (design §3) ----
const ROUND_TOKENS = 700000   // one unit with its fixes (≈ 23 agents) or one slice gate (16); read by the config's lowBudget()
const IN = MODE === 'smoke' ? DOCS : OUTABS   // chain inputs; a smoke run reads the durable docs/living read-only
const SPEC_JSON = IN + '/living-spec.json', GATE2 = IN + '/gates/2-plan.json', GATE1 = IN + '/gates/1-research.json'
const VIEWS_JSON = IN + '/gates/views.json', KEYS_JSON = IN + '/gates/measure-keys.json', BIBLE_JSON = IN + '/living-bible.json'
const LEDGER_DIR = IN + '/state/3-build', STATE = OUTABS + '/state/3-build.json', ATLAS_REF = IN + '/state/3-build/atlas-ref.json'
const ACCEPT_DIR = OUTABS + '/accept', CAPS = OUTABS + '/captures', SNAP = REPO + '/docs/living/shots/loop'   // git-ignored; not under .git or .claude (mobile-tree.js rule)
const FINAL = OUTABS + '/gates/' + (SCOPE === 'zoom' ? '3-build-Z.json' : '3-build.json')
const SLICE_GATE = s => OUTABS + '/gates/3-build-' + s + '.json'
const UNIT_FILES_OK = [/^maps-site\/living\.js$/, /^maps-site\/living\/[A-Za-z0-9._\/-]+$/, /^maps-site\/index\.html$/, /^tools\/living-[a-z-]+\.js$/, /^docs\/living\/(fixtures|accept)\/[A-Za-z0-9._\/-]+$/]
const NEVER = /^(index\.html|\.claude\/|docs\/(filigree|street|mobile)\/|tools\/(filigree|street|mobile)-|tools\/street-drift\.js|tools\/build-offline-manifest\.js|server\.js|vendor\/)/
const ROLE_OF = u => (u.kind === 'logic' ? 'judge' : u.kind === 'tool' ? 'deep' : 'audit')   // logic opus/high; tool sonnet/high; data/css sonnet/medium; MO() applies u.model/u.effort
const PROFILES5 = ['iphone13', 'pixel7', 'landscape', 'desktop', 'desktop2x']
const ON_PROFILES = ['desktop', 'iphone13']
const SCENARIOS = ['moving', 'still', 'reduce', 'hidden', 'card', 'layer-off', 'below-band', 'offscreen', 'zoom-anim', 'block-chunk', 'coexist']
const CAP_DRAWS = {desktop: 20, iphone13: 15}, HOOK_CAP_RAW = 200, EASE_MS = 250, DRIFT_PX = 1
const FIX_PER_ROUND = 3, GATE_ROUNDS = 2, STUCK_AT = 3
const capFlags = id => `--atlas --profiles ${PROFILES5.join(',')} --unit LC-${id} --out ${OUTABS}/captures/${id}.json --shots-dir ${OUTABS}/shots/${id} --port ${PORT}`   // never docs/mobile/
const STATE_IN = IN + '/state/3-build.json', ACCEPT_IN = IN + '/accept', FINAL_IN = IN + '/gates/' + (SCOPE === 'zoom' ? '3-build-Z.json' : '3-build.json')
const ALL_SLICES = ['L0', 'L1', 'L2', 'L3', 'Z']
const LAZY_CAPS = [[/^maps-site\/living(\.js|\/[^/]+\.js)$/, 40 * 1024, 'living code', true], [/^maps-site\/living\/traffic\.json$/, 60 * 1024, 'traffic snapshot', false], [/^maps-site\/living\/sea-mask\.png$/, 32 * 1024, 'sea mask', false], [/^maps-site\/living\/posters\/[^/]+$/, 150 * 1024, 'poster', false]]   // LC14; the code cap is summed over every lazy .js file
const HEX64 = /^[0-9a-f]{64}$/
const T0 = 0, T1 = 4000   // the two instants every frames run takes (t0 the still frame, t1)
const DARK_ONLY = ['LC-dark-hour']   // LC11: the dim changes only inside the dark hour and t0 lies outside it; a [t0, t1] mover only while Living 1's tDark is a number <= t1 (no tDark: no frame shows its dim)
const BOUND = 2 * 4 + (2 + 2) + MAX_UNITS * (2 + 2 + 1 + 2 + 2 + 2 * (1 + 2 + 2) + 2 + 2) + 16 + 2 + 10   // §9: crit agents count twice; 178 at maxUnits 6 (README §11 cap 200)
const CDN_TEXT = CDN ? `--cdn-dir ${CDN}` : '--cdn-dir T'
const SANDBOX_T = SANDBOX_LC + (CDN ? '' : '\nT = one mktemp -d dir you build once per this recipe (the npm pack step) and reuse for every command of this task. Its path goes into no relayed tool line: a relayed line stays exactly as the tool printed it.')
const LINE_RULE = 'Return the tool\'s one stdout JSON line parsed, every field unchanged (it carries len and sum; do not reformat, round, re-sort or drop anything). If it printed {"ok":false,...} without len/sum, return that object with len: -1 and sum: "" added; if it printed nothing parseable, return {ok: false, error: "<last stderr line>", len: -1, sum: ""}.'
const OUT_REL = OUTABS.startsWith(REPO + '/') ? OUTABS.slice(REPO.length + 1) : OUTABS   // OUTABS relative to the repo root (full mode keeps it under docs/living)
// The two instrument lines this job scores in code. L0.U01 (the instrument extension) writes --gate-summary to this shape; Living 1's --static keeps these names.
const GL_SHAPE = `--gate-summary F --spec F --slice S prints ONE JSON line {ok, slice, views: {<LVn>: {<profile>: {glyph_sha: {t0, t1, run2_t0}, positions_equal_profiles, moving_ok: {<class>: true when it moved between t0 and t1}, still_ok: {<class>: true when it did not}, still: {glyph_sha_t0, glyph_sha_t1, counts_equal, raf_living, journey_playing, j_reduced, control: {present, w, h, aria}}, reduce: {the same keys as still}, stops: {hidden, card, layer_off, below_band, offscreen} (living rAF callbacks), draws_per_s, zoom_drift_px (null on a view with no living glyph), transform_during_zoomanim, alpha_ramp_ms_max (null when nothing eases), block_chunk: {console_errors, page_errors, still_shown}, coexist: {console_errors, page_errors}, label_overlap_px, phone_parity: {missing: [classes drawn on desktop and on iphone13 at neither the view zoom nor +0.5]}}}}, len, sum} (len/sum over the key-sorted JSON of every other field, FNV-1a 32 as tools/mobile-tree.js)`
const STATIC_SHAPE = `--static --hooks F prints ONE JSON line {ok, clock_tokens: {P, W} (counts in maps-site/living.js and maps-site/living/**), forbidden: {<name>: count} (createPane, matchMedia, W.rng, WebGL contexts, THREE, xmur3, mulberry32, genCityCanvas, washMake, sampleCityMask), gz: {<repo-relative lazy file>: gzip bytes}, hook_raw_growth (size of maps-site/index.html minus size of its restore), hooks: [{line, marked, declared, replaces_found}], restore_sha, strings: [every LC_STRINGS text of maps-site/living.js], notices_writes, len, sum}`

// ---- schemas (design §5) ----
const S = {type: 'string'}, B = {type: 'boolean'}, I = {type: 'integer'}, SA = {type: 'array', items: S}, OBJ = {type: 'object'}
const LINE = {type: 'object', additionalProperties: true, properties: {ok: B, len: I, sum: S}, required: ['ok', 'len', 'sum']}   // any tool line with len/sum (mobile-tree, living-drift --hold, living-measure summaries)
const FILST = {type: 'object', properties: {literals: OBJ, on_hook: SA}, required: ['literals', 'on_hook']}   // FIL_ST_ANCHOR_TASK: literals {literal: line or null}, on_hook [literals found on a /*LC-HOOK*/ line]
const PRE3 = {type: 'object', properties: {missing: SA, anchors: OBJ, fil_st: FILST, chain: OBJ, spec: OBJ, ledger: OBJ, slice_gates: OBJ, ref: OBJ, restore: {type: 'object', properties: {sha_restore: S, undeclared: SA, misplaced: SA, duplicated: SA}, required: ['sha_restore', 'undeclared', 'misplaced', 'duplicated']}, ref_shots_ok: B, keys_superset: B, tool_shas: OBJ, bible: {type: 'object', properties: {exists: B, devices: OBJ}, required: ['exists', 'devices']}}, required: ['missing', 'anchors', 'fil_st', 'chain', 'spec', 'ledger', 'slice_gates', 'ref', 'restore', 'ref_shots_ok', 'keys_superset', 'tool_shas', 'bible']}
const DRIFT = {type: 'object', properties: {living: OBJ, street: OBJ}, required: ['living', 'street']}
const REBASE = {type: 'object', properties: {name: S, path: S, sha256: S, exit_code: I, profile_errors: SA, shots_ok: B, tree_restore_sha: S, manifest_sha: S, index_sha: S, infra_error: S}, required: ['name', 'path', 'sha256', 'exit_code', 'profile_errors', 'shots_ok', 'tree_restore_sha', 'manifest_sha', 'index_sha', 'infra_error']}
const ACC = {type: 'object', properties: {off: {type: 'object', properties: {path: S, sha256: S, lint_exit: I, errors: SA}, required: ['path', 'sha256', 'lint_exit', 'errors']}, on: {type: 'object', properties: {path: S, sha256: S, lint_exit: I, errors: SA}, required: ['path', 'sha256', 'lint_exit', 'errors']}}, required: ['off', 'on']}
const IMPL = {type: 'object', properties: {files_written: SA, notes: S}, required: ['files_written']}
const CHECK = {type: 'object', properties: {tree: LINE, syntax: {type: 'object', properties: {index: S, atlas: S, living_js: S, json_ok: B}, required: ['index', 'atlas', 'living_js', 'json_ok']}, static: LINE, drift_exit: I}, required: ['tree', 'syntax', 'static', 'drift_exit']}
const MEASURE_R = {type: 'object', properties: {off: {type: 'object', properties: {capture_exit: I, accept_exit: I, failing: {type: 'array', items: OBJ}, repo: OBJ}, required: ['capture_exit', 'accept_exit', 'failing', 'repo']}, on: {type: 'object', properties: {exit: I, failing: {type: 'array', items: OBJ}}, required: ['exit', 'failing']}, infra_error: S}, required: ['off', 'on', 'infra_error']}
const RESTORE = {type: 'object', properties: {displaced: SA, restore: LINE, after: LINE}, required: ['displaced', 'restore', 'after']}   // copies of foreign-looking paths, then mobile-tree restore, then mobile-tree check (tree_changed must be empty)
const MANI = {type: 'object', properties: {exists: B, regen_exit: I, check_exit: I, sha: S}, required: ['exists', 'regen_exit', 'check_exit', 'sha']}
const GOFF = {type: 'object', properties: {capture_exit: I, accept_exit: I, failing: {type: 'array', items: OBJ}, repo: {type: 'object', properties: {anchors_missing: SA, street_drift_exit: I, tithe_lines: I, markers: OBJ, index_sha: S}, required: ['anchors_missing', 'street_drift_exit', 'tithe_lines', 'markers', 'index_sha']}, ref_repo: {type: 'object', properties: {tithe_lines: I, markers: OBJ, index_sha: S}, required: ['tithe_lines', 'markers', 'index_sha']}, infra_error: S}, required: ['capture_exit', 'accept_exit', 'failing', 'repo', 'ref_repo', 'infra_error']}
const GSTAT = {type: 'object', properties: {static: LINE, drift: DRIFT, fil_st: FILST, readme_strings: {type: 'object', additionalProperties: B}}, required: ['static', 'drift', 'fil_st', 'readme_strings']}   // readme_strings: each LC_STRINGS text -> listed in docs/living/README.md §13
const GCHK = {type: 'object', properties: {results: {type: 'array', items: {type: 'object', properties: {id: S, exit: I, out_tail: S, parsed: B, picked: {type: ['string', 'number', 'boolean', 'object', 'array', 'null']}}, required: ['id', 'exit', 'out_tail', 'parsed', 'picked']}}}, required: ['results']}   // id = the slice-keyed check key; picked = the value at the expect's key in the command's whole JSON output
const DIAG = {type: 'object', properties: {units: {type: 'array', items: {type: 'object', properties: {id: S, title: S, files: SA, kind: S, depends_on: SA, cures: S, acceptance: {type: 'array', items: OBJ}}, required: ['id', 'title', 'files', 'kind', 'depends_on', 'cures', 'acceptance']}}}, required: ['units']}
const SMOKE = {type: 'object', properties: {syntax_ok: B, sim: {type: 'object', additionalProperties: {type: 'object', properties: {errors: I, ready: B}, required: ['errors', 'ready']}}, atlas_living: {type: 'object', properties: {errors: I, views_ok: I}, required: ['errors', 'views_ok']}, infra_error: S}, required: ['syntax_ok', 'sim', 'atlas_living', 'infra_error']}

// ---- small helpers ----
const arr = x => Array.isArray(x) ? x : []
const obj = x => (x && typeof x === 'object' && !Array.isArray(x)) ? x : {}
const same = (a, b) => JSON.stringify(canonJ(a === undefined ? null : a)) === JSON.stringify(canonJ(b === undefined ? null : b))
const J = v => JSON.stringify(v)
const oneLine = (s, n) => String(s ?? '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim().slice(0, n || 140)
const num = x => typeof x === 'number' && isFinite(x)
const infraOf = x => !!x && typeof x.infra_error === 'string' && x.infra_error.trim() !== ''
const relP = p => { const s = String(p ?? '').trim().replace(/^(\.\/)+/, ''); return s.startsWith(REPO + '/') ? s.slice(REPO.length + 1) : s }
const driftIds = d => ['living', 'street'].flatMap(k => arr(obj(obj(d)[k]).checks).filter(c => c && !c.ok).map(c => k + ' ' + c.id + (c.detail ? ' (' + oneLine(c.detail, 80) + ')' : ''))).join('; ') || 'no drift report'
const sumVals = v => num(v) ? v : Object.values(obj(v)).reduce((t, x) => t + (num(x) ? x : 0), 0)
const fileOk = f => UNIT_FILES_OK.some(re => re.test(f)) && !NEVER.test(f)
const inFiles = (p, files) => files.some(f => f.endsWith('/') ? p.startsWith(f) : p === f)
const unitOf = (x, fix) => {
  const u = obj(x)
  return {id: String(u.id ?? ''), slice: String(u.slice ?? ''), title: String(u.title ?? u.id ?? ''), kind: String(u.kind ?? ''), files: [...new Set(arr(u.files).map(relP))],
    depends_on: arr(u.depends_on).map(String), covers: arr(u.covers).map(String), views: arr(u.views).map(String), acceptance: arr(u.acceptance).filter(a => a && typeof a === 'object'),
    requires: arr(Array.isArray(u.requires) ? u.requires : u.requires == null ? [] : [u.requires]).map(String), cures: String(u.cures ?? ''), fix: !!fix,
    status: String(u.status ?? ''), model: u.model ?? null, effort: u.effort ?? null}
}
const fixK = id => { const m = /^fix-(L[0-3]|Z)(\d+)$/.exec(id); return m ? {slice: m[1], k: Number(m[2])} : null }
const ug4 = (repo, ref) => {   // UG4 re-scored from a capture's repo block against the reference's (README §5.4)
  const r = obj(repo), f = obj(ref), w = []
  if (!Array.isArray(r.anchors_missing)) w.push('anchors_missing not relayed'); else if (r.anchors_missing.length) w.push('anchors_missing: ' + r.anchors_missing.slice(0, 4).join(', '))
  if (r.street_drift_exit !== 0) w.push('street_drift_exit ' + r.street_drift_exit)
  if (!Number.isInteger(r.tithe_lines) || r.tithe_lines !== f.tithe_lines) w.push(`tithe_lines ${r.tithe_lines} vs the reference's ${f.tithe_lines}`)
  if (!r.markers || typeof r.markers !== 'object' || !same(r.markers, f.markers)) w.push(`markers ${J(r.markers)} vs the reference's ${J(f.markers)}`)
  return w
}
const pickOf = exp => { const e = obj(exp); return typeof e.key === 'string' && typeof e.op === 'string' ? e.key : null }   // the dotted key a {key, op, value} expect reads
const checkOk = (exp, r) => {   // /slices/<S>/checks expect: an exit code, or {key, op, value} read from the command's JSON output (the relay's picked value; a short tail as a fallback); scored here, never by the relay
  if (!r || !Number.isInteger(r.exit)) return false
  if (num(exp) || (typeof exp === 'string' && /^-?\d+$/.test(exp.trim()))) return r.exit === Number(exp)
  const e = obj(exp)
  if (pickOf(e) == null) return false
  let v
  if (r.parsed === true && Object.prototype.hasOwnProperty.call(r, 'picked')) v = r.picked
  else {
    const tail = String(r.out_tail ?? '').trim(), lines = tail.split('\n').map(l => l.trim()).filter(l => l.startsWith('{')).reverse()
    let j = null
    for (const t of [tail].concat(lines)) { try { j = JSON.parse(t); break } catch (x) { j = null } }
    if (!j) return false
    v = e.key.split('.').reduce((o, k) => (o && typeof o === 'object') ? o[k] : undefined, j)
  }
  const op = e.op
  if (op === '==' || op === '===' || op === 'eq') return same(v, e.value)
  if (op === '!=' || op === 'ne') return !same(v, e.value)
  if (!num(v) || !num(e.value)) return false
  return op === '<=' ? v <= e.value : op === '>=' ? v >= e.value : op === '<' ? v < e.value : op === '>' ? v > e.value : false
}

// ---- P0 Preflight (parallel: preflight, hold, drift, anchors) ----
phase('Preflight')
const INPUTS = [SPEC_JSON, GATE2, GATE1, VIEWS_JSON, KEYS_JSON, BIBLE_JSON, DOCS + '/rulings.json', CAPTURE, TREE_TOOL, MEASURE, LDRIFT]
const RESTORE_RULE = `restore(maps-site/index.html) = the file with each line containing "${HOOK_MARK}" that equals the "text" of a /hook_lines entry of ${SPEC_JSON} (compared after trimming) put back to that entry's "replaces" (an entry whose "replaces" is "" is an insert hook: its line is removed); every other line unchanged.`
const PREFLIGHT_TASK = `Preflight for Living 3 (read-only: write nothing outside a mktemp -d dir; use a node script for each step; a missing or unparsable file gives the empty value (false, "", 0, null, [] or {}), never a guess).
A. anchors: ${ANCHOR_TASK}
B. missing = every one of these that does not exist: ${INPUTS.join(' ; ')}.
C. chain = {gate2: from ${GATE2} {exists, pass: parsed.pass === true, mode: parsed.mode or "", forced: parsed.forced_by != null, spec_sha: the sha256 its "artifacts" ([{path, sha256}]) records for the entry whose path ends "living-spec.json" ("" when none)}, spec_sha_now: sha256sum ${SPEC_JSON} (""), gate1: from ${GATE1} {exists, pass: parsed.pass === true, mode: parsed.mode or "", forced: parsed.forced_by != null, stamps: parsed.stamps or {}, cited: parsed.cited or {}, tDark: parsed.tDark (a number, or null)}, stamps_now: {density_bible: sha256sum ${FIL}/density-bible.json ("")}, st_texts_now: read ${REPO}/.claude/workflows/street-1-research.js, take the text from the line that starts "const ST_RULINGS = {" through the next line that is exactly "}", evaluate it as an object literal (new Function("return " + text without the leading "const ST_RULINGS = ")), use each non-empty string under the same key of the "overrides" object of ${STD}/rulings.json in place of the default, and keep only ${ST_CITED.join(', ')}; fil_overrides: the "overrides" object of ${FIL}/rulings.json; lc_overrides: the "overrides" object of ${DOCS}/rulings.json} (string values only in both override objects).
D. fil_st: ${FIL_ST_ANCHOR_TASK}
E. spec, from ${SPEC_JSON}: {exists, units: /units verbatim, slices: {<key>: {checks: /slices/<key>/checks verbatim}} for every key of /slices, hook_lines: /hook_lines verbatim, hook_bytes: the sum over /hook_lines of max(0, text.length - replaces.length), strings: /strings verbatim, devices: {<id>: {slice: /devices/<id>/slice verbatim}} for every key of /devices, accept_template: /accept_template verbatim, on_template: /on_template verbatim, counts: /counts verbatim, counts_now: {units_n: /units length, rules_n: /rules length, checks_n: the sum over /slices of checks length, hooks_n: /hook_lines length}, canonical_len: /canonical_len, canonical_len_now: JSON.stringify(the parsed spec with its canonical_len key deleted, key order as in the file).length}.
F. ledger = {units: {<id>: {status, runs_failed, attempts}} for every *.json directly in ${LEDGER_DIR} except atlas-ref.json (keyed by its "id"), state: from ${STATE_IN} {exists, fix_units: its fix_units verbatim or [], gate_fails: its gate_fails or {}, slice_accept: its slice_accept or {}}}.
G. slice_gates = {<S>: {exists, pass: parsed.pass === true, spec_sha: its spec_sha256 or "", accept_exists: ${ACCEPT_IN}/slice-<S>.json exists} for S in ${ALL_SLICES.join(', ')} (gate file ${IN}/gates/3-build-<S>.json), final: the same for ${FINAL_IN}}.
H. ref = ${ATLAS_REF} parsed (every field verbatim) plus exists (present and parses) and capture_ok (${IN}/captures/<its ref>.json exists and its sha256sum equals the recorded sha256); {exists: false} when absent. ref_shots_ok = ref.exists and every shot that capture records for the desktop and desktop2x profiles exists and re-hashes to its recorded sha256 (false when none is recorded).
I. restore: ${RESTORE_RULE} In memory only: sha_restore = sha256 hex of restore(${REPO}/maps-site/index.html); undeclared = every line containing "${HOOK_MARK}" that equals no /hook_lines text; duplicated = the ids of hooks whose text is on more than one line; misplaced = the ids of hooks present whose "anchor" literal is neither on that line nor on the line directly above it.
J. keys_superset: run node ${MEASURE} --keys --out <tmp>/keys.json (a mktemp -d path) and report whether every key listed in ${KEYS_JSON} is in it.
K. tool_shas = {mobile_capture: sha256sum ${CAPTURE}, mobile_tree: sha256sum ${TREE_TOOL}, living_measure: sha256sum ${MEASURE} (null when absent)}.
L. bible, from ${BIBLE_JSON}: {exists, devices: {<id>: {moves: /devices/<id>/moves, default: /devices/<id>/default, status: /devices/<id>/status}} for every key of /devices, each value verbatim}.
Return {missing, anchors (the map of A), fil_st, chain, spec, ledger, slice_gates, ref, restore: {sha_restore, undeclared, misplaced, duplicated}, ref_shots_ok, keys_superset, tool_shas, bible}.`
const [pre, hold, drift, anc] = await parallel([
  () => crit(PL(PREFLIGHT_TASK), {label: 'preflight', phase: 'Preflight', schema: PRE3, ...M('triage')}),
  () => crit(PL(HOLD_TASK_LC), {label: 'hold', phase: 'Preflight', schema: LINE, ...M('triage')}),
  () => crit(PL(DRIFT_TASK_LC), {label: 'drift', phase: 'Preflight', schema: DRIFT, ...M('triage')}),
  () => crit(PL(FIL_ST_ANCHOR_TASK), {label: 'anchors', phase: 'Preflight', schema: FILST, ...M('triage')})
])
const ABOVE = SCOPE === 'zoom' ? 'Living 3z · The zoom-through' : 'Living 3 · Implementation'
const base = {scope: SCOPE, slice: null, check_off: false, agents_bound: BOUND, polish_inserts_above: ABOVE, gate: null, final_gate: null}
for (const [x, l] of [[pre, 'preflight'], [hold, 'hold'], [drift, 'drift'], [anc, 'anchors']]) if (!x) return done({...base, reason: 'agent died: ' + l})
const lost = anchorsLost(pre.anchors)
if (lost.length) die('anchor lost: ' + lost.join('; '))
const otherLost = lits => lits.map(l => String(l).trim() + " (another track's anchor)").join('; ')
const fsLits = [...new Set([obj(pre.fil_st), obj(anc)].flatMap(f => Object.entries(obj(f.literals)).filter(([, v]) => !v).map(([k]) => k).concat(arr(f.on_hook).map(String))))]
if (fsLits.length) die('anchor lost: ' + otherLost(fsLits))
if (obj(drift.living).ok !== true || obj(drift.street).ok !== true) die('prelude drift: ' + driftIds(drift))

// ---- schedule (computed in code; reported in plan mode, enforced in full mode) ----
const chain = obj(pre.chain), SP = obj(pre.spec), LGR = obj(pre.ledger), SG = obj(pre.slice_gates), REF = obj(pre.ref), RST = obj(pre.restore), TS = obj(pre.tool_shas)
const missing = arr(pre.missing)
const LCR = lcRulingsMerge(obj(chain.lc_overrides))
const FILR = rulingsMerge(obj(chain.fil_overrides))
const RUSED = {lc: LCR.used}
const g2 = obj(chain.gate2), g1 = obj(chain.gate1)
const SPEC_SHA = typeof chain.spec_sha_now === 'string' ? chain.spec_sha_now : ''
const specUnits = arr(SP.units).map(x => unitOf(x, false))
const ST0 = obj(LGR.state), LEDU = obj(LGR.units)
const fixUnits = arr(ST0.fix_units).map(x => ({...unitOf(x, true), status: DISCARD.has(String(obj(x).id)) ? 'discarded' : String(obj(x).status || 'proposed')}))
const sliceUnits = s => specUnits.filter(u => u.slice === s).concat(fixUnits.filter(u => u.slice === s && u.status !== 'discarded').sort((a, b) => (fixK(a.id) || {k: 0}).k - (fixK(b.id) || {k: 0}).k))
const isDone = id => obj(LEDU[id]).status === 'done'
const runsFailed = id => UNSTICK.has(id) ? 0 : (Number.isInteger(obj(LEDU[id]).runs_failed) ? LEDU[id].runs_failed : 0)
const gatePassed = s => { const g = obj(SG[s]); return g.exists === true && g.pass === true && g.spec_sha === SPEC_SHA && HEX64.test(SPEC_SHA) }
const finalPassed = () => { const g = obj(SG.final); return g.exists === true && g.pass === true && g.spec_sha === SPEC_SHA && HEX64.test(SPEC_SHA) }
const issues = []   // chain faults: thrown in full mode (in this order), reported in plan mode
if (!FORCE && MODE !== 'smoke') {
  if (!(g2.exists === true && g2.pass === true && g2.mode === 'full' && g2.forced !== true)) issues.push('build must not start before the living spec passes: docs/living/gates/2-plan.json is not a full unforced pass')
  else if (!HEX64.test(SPEC_SHA) || g2.spec_sha !== SPEC_SHA) issues.push('build must not start before the living spec passes: living-spec.json changed since Living 2 (its sha differs from the one gates/2-plan.json stamps); re-run living-2-plan')
  const cited = obj(g1.cited), citedFil = obj(cited.fil), citedSt = obj(cited.st), stNow = obj(chain.st_texts_now)
  const changed = FIL_CITED.filter(k => citedFil[k] !== FILR.r[k]).concat(ST_CITED.filter(k => citedSt[k] !== stNow[k]))
  if (changed.length) issues.push('the cited rulings changed since Living 1 (' + changed.join(', ') + '); re-run living-1-research')
  else if (obj(g1.stamps).density_bible !== obj(chain.stamps_now).density_bible) issues.push('the filigree density bible changed since Living 1; re-run living-1-research')
}
const cn = obj(SP.counts), cnNow = obj(SP.counts_now)
if (SP.exists === true && (!['units_n', 'rules_n', 'checks_n', 'hooks_n'].every(k => Number.isInteger(cn[k]) && cn[k] === cnNow[k]) || !Number.isInteger(SP.canonical_len) || SP.canonical_len !== SP.canonical_len_now)) issues.push('scheduler: the spec copy differs from its own counts')
let SLICE = A.slice ?? null, gateOnly = GATE_MODE === 'only', finalRerun = false
if (SLICE == null) { SLICE = SLICES.find(s => !gatePassed(s)) || null; if (SLICE == null && !finalPassed()) { SLICE = SLICES[SLICES.length - 1]; finalRerun = true } }
if (SLICE != null && !FORCE) { const earlier = SLICES.slice(0, SLICES.indexOf(SLICE)).find(s => !gatePassed(s)); if (earlier) issues.push(`slice ${SLICE} refused: earlier slice ${earlier} has not passed its gate`) }
const sliceChecks = s => arr(obj(obj(SP.slices)[s]).checks)
if (SLICE != null && SP.exists === true && !sliceChecks(SLICE).length) issues.push(`living-spec.json has no /checks for slice ${SLICE}: re-run living-2-plan`)
if (pre.keys_superset !== true) issues.push('the instrument dropped a Living 1 key: restore tools/living-measure.js')
const chainOk = !missing.length && !issues.length
const heldBy = holdOf(hold, SCOPE === 'zoom' ? 'zoom' : 'build')
if (SCOPE === 'zoom' && lenOk(hold) && !(obj(hold.sim).street_param > 0 && obj(hold.street).views === true)) heldBy.push('street=1 or the Street frozen views are absent')
const POL = obj(hold.polish), LIV = obj(POL.living)
const dataBlock = SLICE == null ? [] : arr(LIV.data_open).filter(t => new RegExp('\\b' + SLICE + '\\b').test(String(t)))
const units = SLICE == null ? [] : sliceUnits(SLICE)
const blockedUnit = u => u.requires.includes('sea-mask') && POL.seamask_checked !== true
const blockedBy = dataBlock.map(t => 'open data item: ' + t).concat(units.filter(blockedUnit).map(u => u.id + ': needs "Living · the sheet-wide sea mask"'))
const readyAll = units.filter(u => !isDone(u.id) && u.depends_on.every(isDone) && runsFailed(u.id) < STUCK_AT && !blockedUnit(u))
const stuckIds = units.filter(u => !isDone(u.id) && runsFailed(u.id) >= STUCK_AT).map(u => u.id)
const ready = (A.units ? readyAll.filter(u => A.units.includes(u.id)) : readyAll).slice(0, MAX_UNITS)
const viewsOf = ss => { const v = [...new Set(specUnits.filter(u => ss.includes(u.slice)).flatMap(u => u.views))]; return v.length ? v : arr(obj(SP.on_template).views).map(String) }
if (MODE === 'plan') {
  return done({...base, reason: 'plan', slice: SLICE, ready: ready.map(u => u.id), stuck: stuckIds, missing, held_by: heldBy, blocked_by: blockedBy, chain_ok: chainOk, chain_issues: issues, owner_rulings_used: RUSED,
    polish_note: `plan: scope ${SCOPE}, slice ${SLICE || '-'}, ${ready.length} ready unit(s) [${ready.map(u => u.id).join(', ')}], at most ${BOUND} agents including crit() retries (cap 200)` + (chainOk ? '' : '; chain not met: ' + issues.concat(missing.length ? ['missing ' + missing.length + ' input(s)'] : []).join('; ')) + (heldBy.length ? '; held: ' + heldBy[0] : '')})
}
if (missing.length) die('missing inputs: ' + missing.join(', '))
if (heldBy.length) return done({...base, reason: 'held', slice: SLICE, held_by: heldBy, owner_rulings_used: RUSED, polish_note: 'Living 3: held (' + heldBy[0] + '); no release'})

// ---- smoke mode: the current tree measured once, every output under outDir (README §8.5) ----
const gateViews = ss => viewsOf(ss)
const tDark = num(g1.tDark) ? g1.tDark : null
const framesTask = (s, vs, tag) => `Slice gate frames${tag} (write only under ${OUTABS}/captures and ${OUTABS}/shots). From ${REPO}: node ${MEASURE} --frames --views ${VIEWS_JSON} --ids ${vs.join(',')} --profiles ${ON_PROFILES.join(',')} --living 0,1 --t ${T0},${T1}${tDark != null ? ',' + tDark : ''} --scenarios ${SCENARIOS.join(',')} --runs 2 --port ${PORT} ${CDN_TEXT} --out ${OUTABS}/captures/gate-${s}.json --shots-dir ${OUTABS}/shots/gate-${s}, then node ${MEASURE} --gate-summary ${OUTABS}/captures/gate-${s}.json --spec ${SPEC_JSON} --slice ${s}. ${LINE_RULE.replace("the tool's one", "the --gate-summary run's one")}
The line's shape: ${GL_SHAPE}
${SANDBOX_T}`
const staticTask = tag => `Slice gate static${tag} (read-only: write nothing outside a mktemp -d dir).
1. static: from ${REPO} run node ${MEASURE} --static --hooks ${SPEC_JSON}; the line unchanged (${STATIC_SHAPE}).
2. drift: ${DRIFT_TASK_LC}
3. fil_st: ${FIL_ST_ANCHOR_TASK}
4. readme_strings: for each text in the static line's "strings", true when the table of section "## 13" of ${DOCS}/README.md lists it in its text column (an exact match after trimming), else false.
Return {static, drift, fil_st, readme_strings}.`
if (MODE === 'smoke') {
  if (SLICE == null || !SLICES.includes(SLICE)) return done({...base, reason: 'smoke', polish_note: 'smoke: no slice to measure'})
  phase('Slice gate')
  const vs = gateViews([SLICE])
  const [sfr, sst] = await parallel([
    () => crit(PL(framesTask(SLICE, vs, ' (smoke)')), {label: 'gate frames', phase: 'Slice gate', schema: LINE, ...M('triage')}),
    () => crit(PL(staticTask(' (smoke)')), {label: 'gate static', phase: 'Slice gate', schema: GSTAT, ...M('triage')})
  ])
  return done({...base, reason: 'smoke', slice: SLICE, smoke: {frames_ok: lenOk(sfr), static_ok: !!sst && lenOk(sst.static), views: vs}, outputs: [OUTABS + '/captures/gate-' + SLICE + '.json', OUTABS + '/shots/gate-' + SLICE + '/'],
    polish_note: `smoke: slice ${SLICE} frames ${lenOk(sfr) ? 'ok' : 'failed'}, static ${sst && lenOk(sst.static) ? 'ok' : 'failed'} (outputs under ${OUTABS})`})
}

// ---- the chain, the restore invariant, the blocks (full mode) ----
for (const m of issues) die(m)
const rBad = [...arr(RST.undeclared).map(l => 'undeclared marked line ' + oneLine(l, 80)), ...arr(RST.misplaced).map(h => 'misplaced hook ' + h), ...arr(RST.duplicated).map(h => 'duplicated hook ' + h)]
if (rBad.length || !HEX64.test(RST.sha_restore || '')) die('restore invariant broken: ' + (rBad.join('; ') || 'no restore sha') + ' (undo by hand, or delete docs/living/state/3-build/atlas-ref.json when the remaining change is legitimate)')
if (A.units) for (const id of A.units) if (!readyAll.some(u => u.id === id)) die(`args.units: ${id} is not a ready unit of slice ${SLICE} (done, stuck, blocked, dep-unmet or unknown)`)
if (dataBlock.length) return done({...base, reason: 'blocked', slice: SLICE, blocked_by: blockedBy, owner_rulings_used: RUSED, polish_note: `Living 3 slice ${SLICE}: blocked (${blockedBy[0]})`})
const sliceDone = () => units.every(u => isDone(u.id) || doneNow.has(u.id))
const doneNow = new Set()
if (SLICE == null || (finalPassed() && SLICES.every(gatePassed) && A.slice == null)) return done({...base, pass: true, check_off: true, reason: 'nothing to build', slice: SLICE, owner_rulings_used: RUSED, polish_note: `Living 3${SCOPE === 'zoom' ? 'z' : ''}: nothing to build; the final gate passed on the current spec`})
const stuckBy = stuckIds.map(id => id + ': stuck (Living 3 stuck unit; args.unstick after a hand fix)')
if (!ready.length && !sliceDone() && GATE_MODE !== 'only' && !finalRerun && blockedBy.length + stuckBy.length) return done({...base, reason: 'blocked', slice: SLICE, blocked_by: blockedBy.concat(stuckBy), owner_rulings_used: RUSED, polish_note: `Living 3 slice ${SLICE}: blocked (${blockedBy.concat(stuckBy)[0]})`})
const holdShas = obj(hold.shas)
const pipeDigest = sh => fnv(J(canonJ(obj(obj(sh).workflows))))
const gaps = [], inserts = [], outputs = []
const seenIns = new Set(arr(LIV.stuck_open).map(norm))
const insertOnce = (title, line) => { const k = norm(title); if (seenIns.has(k)) { log('polish insert dropped (already queued): ' + title); return } seenIns.add(k); inserts.push(line) }

// ---- P1 Rebase: keep or re-take the living-off reference on restore(maps-site/index.html) ----
phase('Rebase')
let REFN = obj(REF.exists === true ? REF : {})
const rebaseWhy = []
if (REF.exists !== true || REF.capture_ok !== true) rebaseWhy.push('no reference')
else {
  if (pre.ref_shots_ok !== true) rebaseWhy.push('reference shots missing')
  if (RST.sha_restore !== REF.sha_restore) rebaseWhy.push('a foreign atlas edit (restore sha moved)')
  if (pipeDigest(holdShas) !== REF.pipeline) rebaseWhy.push('a pipeline script changed (UG11)')
  if (TS.mobile_capture !== REF.capture_tool_sha) rebaseWhy.push('tools/mobile-capture.js changed')
  if (holdShas.maps_other !== REF.maps_other) rebaseWhy.push('another maps-site file changed')
  if ((holdShas.manifest ?? null) !== (REF.manifest ?? null)) rebaseWhy.push('the offline manifest changed')
  if ((holdShas.index ?? null) !== (REF.index_sha ?? null)) rebaseWhy.push('the sim index.html changed (GL.12 and UG4 compare against the reference)')
}
const refN = name => { const m = /^L0-r(\d+)$/.exec(String(name || '')); return m ? Number(m[1]) : 0 }
const rebaseTask = (name, tag) => `Re-take the living-off reference "${name}"${tag} on a temp copy (the repo itself stays untouched; never edit a file under ${REPO} except the capture and shots paths named below).
${SANDBOX_T}
1. In a mktemp -d dir X: copy every top-level entry of ${REPO} except .git and node_modules into X/tree (cp -r).
2. ${RESTORE_RULE} Write restore(${REPO}/maps-site/index.html) over X/tree/maps-site/index.html; tree_restore_sha = its sha256sum. If it differs from ${RST.sha_restore}, write nothing else and return infra_error "restored copy sha mismatch".
3. Delete X/tree/maps-site/living.js and X/tree/maps-site/living/ (when present); keep X/tree/maps-site/data/offline-manifest.json as it is (manifest_sha = its sha256sum, "" when absent).
4. From X/tree run node X/tree/tools/mobile-capture.js --atlas --profiles ${PROFILES5.join(',')} --unit ${name} --out ${OUT_REL}/captures/${name}.json --shots-dir ${OUT_REL}/shots/${name} ${CDN_TEXT} --port ${PORT} (relative paths, so the shot paths it records hold in both trees).
5. Copy X/tree/${OUT_REL}/captures/${name}.json to ${OUTABS}/captures/${name}.json and the dir X/tree/${OUT_REL}/shots/${name}/ to ${OUTABS}/shots/${name}/ (create the parents).
Return {name: "${name}", path: "${OUTABS}/captures/${name}.json", sha256 (sha256sum of the copied capture), exit_code (the capture's exit code), profile_errors (the capture's per-profile errors, verbatim), shots_ok (every shot it records exists in the copied dir), tree_restore_sha, manifest_sha, index_sha (sha256sum of X/tree/index.html), infra_error ("" or the setup failure: port, browser, CDN, capture busy)}.`
async function rebase(label, ph, why) {   // returns the new reference record, or a done() object to return
  const name = 'L0-r' + (refN(REFN.ref) + 1)
  const r = await crit(PL(rebaseTask(name, label === 'rebase' ? '' : ' (gate)')), {label, phase: ph, schema: REBASE, ...M('triage')})
  if (!r) return {stop: done({...base, reason: 'agent died: ' + label, slice: SLICE, owner_rulings_used: RUSED})}
  if (infraOf(r)) return {stop: done({...base, reason: 'infra', slice: SLICE, owner_rulings_used: RUSED, polish_note: `infra (${label}): ${oneLine(r.infra_error)}`})}
  if (r.exit_code !== 0 || arr(r.profile_errors).length || r.tree_restore_sha !== RST.sha_restore || !HEX64.test(r.sha256 || '')) return {stop: done({...base, reason: 'infra', slice: SLICE, owner_rulings_used: RUSED, polish_note: `infra (${label}): capture exit ${r.exit_code}, ${arr(r.profile_errors).length} profile error(s)` + (r.tree_restore_sha !== RST.sha_restore ? ', restored copy sha mismatch' : '')})}
  const rec = {job: JOB, date: DATE, ref: name, path: OUT + '/captures/' + name + '.json', sha256: r.sha256, sha_restore: RST.sha_restore, manifest: r.manifest_sha ? r.manifest_sha : null,
    maps_other: holdShas.maps_other ?? null, pipeline: pipeDigest(holdShas), capture_tool_sha: TS.mobile_capture ?? null, index_sha: r.index_sha, shots_ok: r.shots_ok === true, why, previous: REFN.ref || 'L0'}
  const w = await recordL('state/3-build/atlas-ref.json', rec, 'record atlas-ref' + (label === 'rebase' ? '' : ' (gate)'))
  if (!w) gaps.push('record-mismatch: state/3-build/atlas-ref.json')
  log(`rebaselined: ${name} (${why.join('; ')})`)
  outputs.push(rec.path, OUT + '/shots/' + name + '/', OUT + '/state/3-build/atlas-ref.json')
  return {rec}
}
const rebased = []
if (rebaseWhy.length) {
  const rb = await rebase('rebase', 'Rebase', rebaseWhy)
  if (rb.stop) return rb.stop
  REFN = rb.rec; rebased.push(rb.rec.ref)
} else log('reference kept: ' + REFN.ref)

// ---- P2 Build: one unit at a time (each holds maps-site/index.html and maps-site/living*) ----
const SPEC_RULES_NOTE = `The spec: ${SPEC_JSON} (/rules for the rule ids the unit covers, /hook_lines, /host, /loader, /hash, /restore, /strings, /budgets); its prose: ${IN}/living-spec.md. The bible: ${IN}/living-bible.md (read-only).`
const HOOK_TABLE = J(arr(SP.hook_lines))
const DET_RULE_LC = `Determinism and host (LC12, LC13): motion is presentation only. Presentation time accumulates the rAF timestamp argument with dt clamped to 100 ms, so it freezes under the capture's virtual clock; randomness only from keyed streams ${KEY_IDIOM} (an xmur3 to mulberry32 copy inside maps-site/living.js); positions are pure functions of (seed literal, class, id, snapshot day, presentation time); zero clock tokens (grep -E '${LC_CLOCK_GREP}') in maps-site/living.js and maps-site/living/**; no new sim state, no W.rng, no createPane, no pane z change, no WebGL or THREE in maps-site, never a notices= write; the atlas's xmur3, mulberry32, genCityCanvas, washMake and sampleCityMask are never called or changed. The hook marker is ${HOOK_MARK} and the param is ${LIVING_PARAM}=1.`
const implTask = (u, extra) => `Implement Living 3 unit ${u.id} (slice ${u.slice}, kind ${u.kind || 'unknown'}): ${u.title}
The unit, verbatim: ${J(u)}
${SPEC_RULES_NOTE}
Write ONLY these repo-relative files (create directories as needed): ${u.files.join(', ')}. Nothing else: never index.html, never another track's file, never a file under docs/living/ other than those listed.
maps-site/index.html changes only by the declared hook lines (each line carries ${HOOK_MARK}; ${RESTORE_RULE}); the hook-line table, verbatim: ${HOOK_TABLE}
Every player-visible string goes into the LC_STRINGS literal of maps-site/living.js (and README §13 lists it); one visible still-chart control writes jrn.forceReduced read through jReduced() (no second matchMedia, no second motion flag); the living code is lazy (maps-site/living.js and maps-site/living/**, fetched only under ${LIVING_PARAM}=1, versioned by ?v=; a failed fetch logs no console error and leaves the still chart).
${DET_RULE_LC}
Living rulings (merged; LC12, LC13 fixed):
${rulingText(LCR.r, ['LC1', 'LC2', 'LC3', 'LC8', 'LC9', 'LC10', 'LC12', 'LC13', 'LC14', 'LC16'])}
${VOCAB_LC_RULE}
${u.files.some(f => /^tools\/living-/.test(f)) ? 'Instrument lines this build scores in code (keep these field names; add keys, never drop one from ' + KEYS_JSON + '):\n- ' + GL_SHAPE + '\n- ' + STATIC_SHAPE + '\n- --lint-on F (exit 0 on a valid on-state accept file) and --score F --frames F (one JSON object {pass, failing: [{key, op, expected, got}]}, exit 0 on a pass).\n' : ''}Any browser check goes through node ${MEASURE} or node ${CAPTURE} per the sandbox recipe, outputs under a mktemp -d dir.
${extra || ''}Return {files_written: [repo-relative paths], notes (one line)}.`
const GROWTH_UNIT = id => `the spec's cumulative hook bytes through this unit (the sum of max(0, text.length - replaces.length) over the /hook_lines a unit up to and including ${id}, in spec order, names in its covers; the total over all /hook_lines when no unit names a hook id)`
const acceptTask = (u, ref, vs, growth) => `Accept files for Living 3 unit ${u.id}, authored blind: you see only the inputs below and never open the unit's code, maps-site/, tools/ sources or a diff.
The unit's acceptance, verbatim: ${J(u.acceptance)}
The spec's accept_template, verbatim: ${J(SP.accept_template ?? null)}
The spec's on_template, verbatim: ${J(SP.on_template ?? null)}
Read ${MOB}/metrics.md section 8 (read-only) and the top-level and per-profile key names of the reference capture ${OUTABS}/captures/${ref}.json (keys only).
1. Write ${ACCEPT_DIR}/${u.id}.json: the accept_template with unit "LC-${u.id}", baseline "${ref}", profiles ${J(PROFILES5)}, clock "virtual", its gates and waive verbatim, declared_first_view_growth {bytes: ${growth || GROWTH_UNIT(u.id)}, requests: 0}, files_touched ${J(u.files)}, checks: the acceptance entries of kind "accept" as mobile-capture checks {key, op, value}.
2. Write ${ACCEPT_DIR}/${u.id}.on.json: the on_template with views ${J(vs)} and checks: the acceptance entries of kind "on" as {key, op, value}.
3. From ${REPO}: node ${CAPTURE} --lint-accept ${ACCEPT_DIR}/${u.id}.json and node ${MEASURE} --lint-on ${ACCEPT_DIR}/${u.id}.on.json. When ${MEASURE} has no --lint-on mode yet (the unit that adds it), report on.lint_exit -1 and errors ["--lint-on absent"].
Return {off: {path, sha256 (sha256sum), lint_exit, errors (the lint messages)}, on: {path, sha256, lint_exit, errors}}.`
const snapTask = u => `Snapshot (from ${REPO}): node ${TREE_TOOL} snapshot --unit LC-${u.id} --snap ${SNAP} --files '${J(u.files)}'. ${LINE_RULE}`
const checkTask = (u, tag) => `Check unit ${u.id}${tag} (read-only: write nothing outside a mktemp -d dir). From ${REPO}:
1. tree: node ${TREE_TOOL} check --unit LC-${u.id} --snap ${SNAP}; the line unchanged.
2. syntax: index = the stdout of this command with the path index.html, atlas = the same with maps-site/index.html (each prints "OK <n>" or "block <n>: <error>"): node -e '<the CLAUDE.md syntax one-liner: extract every inline script block and compile it with new Function>' — use the exact one-liner from ${REPO}/.claude/CLAUDE.md "Verification", changing only the file path; living_js = "OK" when new Function compiles the text of maps-site/living.js, "absent" when the file does not exist, else the error message; json_ok = every .json file among ${J(u.files)} parses (true when none).
3. static: node ${MEASURE} --static --hooks ${SPEC_JSON}; the line unchanged (${STATIC_SHAPE}).
4. drift_exit: the exit code of node ${LDRIFT}.
Return {tree, syntax: {index, atlas, living_js, json_ok}, static, drift_exit}.`
const measureTask = (u, ref, vs, tag) => `Measure unit ${u.id}${tag}; never interpret: relay exits and failing arrays verbatim. ${SANDBOX_T}
(a) off: node ${CAPTURE} ${capFlags(u.id)} ${CDN_TEXT}; capture_exit = its exit code. Then node ${CAPTURE} --accept ${ACCEPT_DIR}/${u.id}.json --capture ${OUTABS}/captures/${u.id}.json --ref ${ref}=${OUTABS}/captures/${ref}.json; accept_exit = its exit code, failing = its "failing" array verbatim ([] when it passed). repo = {anchors_missing, street_drift_exit, tithe_lines, markers, index_sha (meta.index_sha)} from the "repo" block of ${OUTABS}/captures/${u.id}.json, plus ref: the same four fields tithe_lines, markers, index_sha read from ${OUTABS}/captures/${ref}.json.
(b) on: node ${MEASURE} --lint-on ${ACCEPT_DIR}/${u.id}.on.json (a non-zero exit is on.exit with failing [{key: "lint", op: "lint", expected: "valid", got: <message>}]); else node ${MEASURE} --frames --views ${VIEWS_JSON} --ids ${vs.join(',')} --profiles ${ON_PROFILES.join(',')} --living 1 --t ${T0},${T1} --scenarios ${arr(obj(SP.on_template).scenarios).join(',') || 'moving,still'} --port ${PORT} ${CDN_TEXT} --out ${OUTABS}/captures/${u.id}.on.json --shots-dir ${OUTABS}/shots/${u.id}.on, then node ${MEASURE} --score ${ACCEPT_DIR}/${u.id}.on.json --frames ${OUTABS}/captures/${u.id}.on.json; on.exit = the score's exit code, on.failing = its "failing" array verbatim.
Return {off: {capture_exit, accept_exit, failing, repo}, on: {exit, failing}, infra_error ("" or the setup failure: port, browser, CDN, capture busy)}.`
const restoreTask = (u, keep) => `Restore unit ${u.id} (from ${REPO}): ${keep.length ? `first copy each of these repo-relative paths that exists (cp -p, creating parents) to ${SNAP}/displaced/LC-${u.id}/<the same relative path>, so a concurrent write the restore puts back can be re-applied by hand: ${J(keep)}; displaced = the paths you copied. Then ` : 'displaced = []. '}node ${TREE_TOOL} restore --unit LC-${u.id} --snap ${SNAP}, then node ${TREE_TOOL} check --unit LC-${u.id} --snap ${SNAP}. Return {displaced, restore: <the first line>, after: <the second line>}, each line unchanged. ${LINE_RULE.replace('Return the tool\'s one stdout JSON line parsed', 'Each line is the tool\'s one stdout JSON line parsed')}`
const RESTORED = ['index.html', 'maps-site/', 'tools/', '.claude/', 'server.js', 'vendor/']   // what mobile-tree restore puts back besides its guard files (its TREE)
const livingOwned = p => UNIT_FILES_OK.slice(0, 4).some(re => re.test(p))   // maps-site/index.html, maps-site/living*, tools/living-*: held by this job while it runs
const foreignOf = (u, ps) => [...new Set(arr(ps).map(relP))].filter(p => inFiles(p, RESTORED.concat(['docs/mobile/accept/LC-' + u.id + '.json', 'docs/mobile/owner-answers.json'])) && !inFiles(p, u.files) && !livingOwned(p))   // a path the restore puts back (its TREE and guard files) that no living unit may write: another track's write or a breach
const scopeOf = (u, c) => {   // in code: what the check relay shows about the unit's tree, syntax and static lines
  const w = [], never = []
  if (!c) return {w: ['check died'], never}
  const t = c.tree
  if (!lenOk(t)) w.push('tree line ' + (t && t.ok === false ? 'failed: ' + oneLine(t.error) : 'mis-relayed'))
  const changed = [...new Set(arr(obj(t).changed).concat(arr(obj(t).tree_changed)).map(relP))].filter(p => !p.startsWith('docs/living/shots/'))
  for (const p of changed) { if (NEVER.test(p)) never.push(p); else if (!inFiles(p, u.files)) w.push('outside the unit files: ' + p) }
  const sy = obj(c.syntax)
  if (!/^OK \d+$/.test(String(sy.index ?? ''))) w.push('index.html syntax: ' + oneLine(sy.index))
  if (!/^OK \d+$/.test(String(sy.atlas ?? ''))) w.push('maps-site/index.html syntax: ' + oneLine(sy.atlas))
  if (!['OK', 'absent'].includes(String(sy.living_js ?? ''))) w.push('maps-site/living.js syntax: ' + oneLine(sy.living_js))
  if (sy.json_ok !== true) w.push('a unit .json file does not parse')
  const st = c.static
  if (!lenOk(st)) w.push('static line ' + (st && st.ok === false ? 'failed: ' + oneLine(st.error) : 'mis-relayed'))
  else {
    if (sumVals(st.clock_tokens) !== 0) w.push('clock tokens ' + J(st.clock_tokens))
    if (sumVals(st.forbidden) !== 0) w.push('forbidden names ' + J(st.forbidden))
    const bad = arr(st.hooks).filter(h => !(h && h.marked === true && h.declared === true && h.replaces_found === true))
    if (bad.length) w.push('hook table: ' + bad.slice(0, 3).map(h => oneLine(obj(h).line, 60)).join(' | '))
  }
  if (c.drift_exit !== 0) w.push('living-drift exit ' + c.drift_exit)
  if (never.length) w.unshift('NEVER path changed: ' + never.join(', '))
  return {w, never}
}
const measureWhy = m => {
  if (!m) return ['measure died']
  const w = [], off = obj(m.off), on = obj(m.on)
  if (off.capture_exit !== 0) w.push('off capture exit ' + off.capture_exit)
  if (off.accept_exit !== 0) w.push('off accept exit ' + off.accept_exit)
  arr(off.failing).forEach(f => w.push('off ' + oneLine(J(f), 160)))
  ug4(off.repo, obj(obj(off.repo).ref)).forEach(x => w.push('UG4 ' + x))
  if (on.exit !== 0) w.push('on exit ' + on.exit)
  arr(on.failing).forEach(f => w.push('on ' + oneLine(J(f), 160)))
  return w
}
const results = {}, builtOk = [], failedIds = [], skipped = [], unitRecs = {}
let unitStop = null, man = null, closed = null
const manTask = tag => `Offline manifest${tag} (from ${REPO}): when ${REPO}/maps-site/data/offline-manifest.json exists, run node ${MANIFEST} --atlas (it rewrites that file), then node ${MANIFEST} --atlas --check; return {exists: true, regen_exit, check_exit, sha (sha256sum of the manifest after both)}. When it does not exist, run nothing and return {exists: false, regen_exit: 0, check_exit: 0, sha: ""}.`
const COEX = ['index', 'docs_filigree', 'docs_street', 'docs_mobile', 'workflows', 'tools_other', 'street_state3', 'maps_other']
const builtLine = () => builtOk.length ? `living chart: slice ${SLICE} — ${builtOk.map(x => x.title).join('; ')}` : ''
async function closeOut() {   // README §1.6, §1.7, §5.4: every return that may offer built units for commit runs this once: the manifest (when a maps-site path changed and the gate did not regenerate it), then the hold re-read and the coexistence compare
  if (closed) return closed
  phase('Record')
  const mapsChanged = builtOk.some(u => u.files.some(f => f.startsWith('maps-site/')))
  let manRec = null
  if (mapsChanged && !man) {
    manRec = await crit(PL(manTask(' (record)')), {label: 'manifest (record)', phase: 'Record', schema: MANI, ...M('triage')})
    if (!manRec) gaps.push('manifest (record) died: the offline manifest may be stale (GL.11 false)')
    else if (manRec.exists === true && manRec.check_exit !== 0) gaps.push('GL.11 false: the regenerated offline manifest fails --atlas --check (exit ' + manRec.check_exit + ')')
  }
  const manDied = mapsChanged && !man && !manRec
  const manFail = mapsChanged && !man && (!manRec || (manRec.exists === true && (manRec.regen_exit !== 0 || manRec.check_exit !== 0)))
  const holdRec = await crit(PL(HOLD_TASK_LC), {label: 'hold (record)', phase: 'Record', schema: LINE, ...M('triage')})
  const broken = !holdRec || !lenOk(holdRec) ? ['hold read died or mis-relayed'] : COEX.filter(k => !same(obj(holdRec.shas)[k], holdShas[k]))
  if (broken.length) gaps.push('coexistence broken: ' + broken.join(', '))
  const needsRestore = manDied ? builtOk.map(u => u.id) : []   // never offered for commit with a stale manifest: the ledger stops calling them done, the central session restores them
  for (const id of needsRestore) {
    doneNow.delete(id)
    if (!unitRecs[id]) continue
    const rw = await recordL('state/3-build/' + id + '.json', {...unitRecs[id], status: 'needs-restore', last_failure: 'built, but the offline manifest step died: restore the tree before this unit is rebuilt'}, 'record ' + id + ' (needs restore)')
    if (!rw) gaps.push('record-mismatch: state/3-build/' + id + '.json')
  }
  const snapRel = relP(SNAP)
  const note = needsRestore.length ? `; the offline manifest step died, so the ${needsRestore.length} unit(s) built this run (${needsRestore.join(', ')}) are NOT offered for commit: restore them, last built first, with ${needsRestore.slice().reverse().map(id => `node tools/mobile-tree.js restore --unit LC-${id} --snap ${snapRel}`).join(' then ')}, and re-run (their ledger records read needs-restore)`
    : (manFail ? '; the offline manifest regeneration or its --atlas --check failed (GL.11 false)' : '') + (broken.length ? '; coexistence broken at the Record re-read: ' + broken.join(', ') : '')
  closed = {manRec, manDied, manFail, broken, needsRestore, note}
  return closed
}
async function early(o) {   // a return before the Record phase that may hand back built units
  const c = await closeOut()
  const cl = c.needsRestore.length ? '' : builtLine()
  return done({...base, slice: SLICE, owner_rulings_used: RUSED, outputs: [...new Set(outputs)], polish_inserts: inserts, ...o,
    reason: c.broken.length && !/^coexistence broken/.test(o.reason) ? 'coexistence broken: ' + c.broken.join(', ') : o.reason,
    gaps: gaps.slice(), needs_restore: c.needsRestore, polish_note: (o.polish_note || 'Living 3 slice ' + SLICE + ': ' + o.reason) + c.note + (cl ? `; ${builtOk.length} built unit(s) offered for commit` : ''), changelog_line: cl})
}
phase('Build')
for (let i = 0; GATE_MODE !== 'only' && i < ready.length; i++) {
  const u = ready[i]
  if (i > 0 && lowBudget()) { log('budget: unit skipped'); skipped.push(...ready.slice(i).map(x => x.id)); break }
  const ref = REFN.ref, vs = u.views.length ? u.views : viewsOf([u.slice])
  const prevRuns = runsFailed(u.id), prevAtt = Number.isInteger(obj(LEDU[u.id]).attempts) ? LEDU[u.id].attempts : 0
  let status = 'failed', why = [], snapped = false, acc = null, ms = null, fixes = 0, lastCheck = null
  const died = l => { unitStop = l; return l }
  acc = await crit(PL(acceptTask(u, ref, vs)), {label: 'accept ' + u.id, phase: 'Build', schema: ACC, ...M('audit')})
  if (!acc) { died('accept ' + u.id) }
  else if (acc.off.lint_exit !== 0 || arr(acc.off.errors).length || !(acc.on.lint_exit === 0 || (acc.on.lint_exit === -1 && u.files.includes('tools/living-measure.js')))) why = ['accept file not valid: ' + oneLine(arr(acc.off.errors).concat(arr(acc.on.errors)).join('; ') || 'lint exit ' + acc.off.lint_exit + '/' + acc.on.lint_exit, 300)]
  else {
    const sn = await crit(PL(snapTask(u)), {label: 'snapshot ' + u.id, phase: 'Build', schema: LINE, ...M('triage')})
    if (!sn) died('snapshot ' + u.id)
    else if (!lenOk(sn)) { unitStop = 'infra'; why = ['snapshot line ' + (sn.ok === false ? 'failed: ' + oneLine(sn.error) : 'mis-relayed')] }
    else {
      snapped = true
      const im = await agent(PL(implTask(u)), {label: 'implement ' + u.id, phase: 'Build', schema: IMPL, ...MO(ROLE_OF(u), u)})
      if (!im) died('implement ' + u.id)
      else {
        let ck = await crit(PL(checkTask(u, '')), {label: 'check ' + u.id, phase: 'Build', schema: CHECK, ...M('triage')})
        lastCheck = ck
        let sc = scopeOf(u, ck)
        if (!ck) died('check ' + u.id)
        else if (sc.never.length) why = sc.w   // a write the unit may never make: restored without a measure or a fix
        else {
          if (!sc.w.length) { ms = await crit(PL(measureTask(u, ref, vs, '')), {label: 'measure ' + u.id, phase: 'Build', schema: MEASURE_R, ...M('triage')}); if (!ms) died('measure ' + u.id); else if (infraOf(ms)) unitStop = 'infra' }
          why = sc.w.length ? sc.w : ms ? measureWhy(ms) : ['measure died']
          while (!unitStop && why.length && fixes < 2) {
            fixes++
            const failingKeys = ms ? arr(obj(ms.off).failing).concat(arr(obj(ms.on).failing)) : []
            const fx = await agent(PL(implTask(u, `This is fix ${fixes} of 2. The previous attempt failed on:\n${why.join('\n')}\nFailing keys, verbatim ({key, op, expected, got}): ${J(failingKeys)}\nThe same file limits hold.\n`)), {label: `fix ${u.id} ${fixes}`, phase: 'Build', schema: IMPL, ...MO(ROLE_OF(u), u)})
            if (!fx) { died(`fix ${u.id} ${fixes}`); break }
            ck = await crit(PL(checkTask(u, ` after fix ${fixes}`)), {label: `check ${u.id} after fix ${fixes}`, phase: 'Build', schema: CHECK, ...M('triage')})
            lastCheck = ck
            if (!ck) { died(`check ${u.id} after fix ${fixes}`); break }
            sc = scopeOf(u, ck)
            if (sc.never.length) { why = sc.w; break }
            ms = null
            if (!sc.w.length) { ms = await crit(PL(measureTask(u, ref, vs, ` after fix ${fixes}`)), {label: `measure ${u.id} after fix ${fixes}`, phase: 'Build', schema: MEASURE_R, ...M('triage')}); if (!ms) { died(`measure ${u.id} after fix ${fixes}`); break } if (infraOf(ms)) { unitStop = 'infra'; break } }
            why = sc.w.length ? sc.w : measureWhy(ms)
          }
          if (!unitStop && !why.length) status = 'done'
        }
      }
    }
  }
  if (unitStop === 'infra' && ms && infraOf(ms)) why = ['infra: ' + oneLine(ms.infra_error)]
  let coex = [], displaced = []
  if (status !== 'done' && snapped) {   // restore on failure (and before any stop once a snapshot exists)
    const keep = lastCheck && lenOk(lastCheck.tree) ? foreignOf(u, arr(lastCheck.tree.changed).concat(arr(lastCheck.tree.tree_changed))) : []
    const rs = await crit(PL(restoreTask(u, keep)), {label: 'restore ' + u.id, phase: 'Build', schema: RESTORE, ...M('triage')})
    if (!rs) return done({...base, reason: 'agent died: restore ' + u.id, slice: SLICE, owner_rulings_used: RUSED, polish_note: `Living 3 slice ${SLICE}: restore of ${u.id} died; restore it by hand with node tools/mobile-tree.js restore --unit LC-${u.id} --snap docs/living/shots/loop`})
    if (!lenOk(rs.restore) || !lenOk(rs.after) || arr(rs.after.tree_changed).length) die(`restore failed for ${u.id}: ` + (!lenOk(rs.restore) ? 'restore line failed or mis-relayed' : !lenOk(rs.after) ? 'check line failed or mis-relayed' : 'tree_changed after restore: ' + arr(rs.after.tree_changed).slice(0, 5).join(', ')))
    coex = foreignOf(u, rs.restore.reverted); displaced = arr(rs.displaced).map(relP)
    const own = arr(rs.restore.reverted).map(relP).filter(p => !inFiles(p, u.files) && !coex.includes(p))
    if (own.length) log(`restore ${u.id}: living paths outside its files put back: ${own.slice(0, 10).join(', ')}`)
  }
  if (unitStop && unitStop !== 'infra' && !coex.length) return await early({reason: 'agent died: ' + unitStop, polish_note: `Living 3 slice ${SLICE}: agent died (${unitStop}); ${builtOk.length} unit(s) built before it`})
  const counted = unitStop !== 'infra'
  const runs = status === 'done' ? prevRuns : counted ? prevRuns + 1 : prevRuns
  const rec = {job: JOB, date: DATE, id: u.id, slice: u.slice, title: u.title, status, attempts: prevAtt + 1, runs_failed: runs, fixes, files: u.files,
    files_sha: obj(obj(lastCheck).tree).files_sha || {}, accept_sha: acc ? {off: acc.off.sha256, on: acc.on.sha256} : null, measure: ms ? {off: ms.off, on: ms.on} : null, ref: REFN.ref, spec_sha256: SPEC_SHA, last_failure: why.join(' | ').slice(0, 600), cures: u.cures}
  unitRecs[u.id] = rec
  const rw = await recordL('state/3-build/' + u.id + '.json', rec, 'record ' + u.id)
  if (!rw) gaps.push('record-mismatch: state/3-build/' + u.id + '.json')
  outputs.push(OUT + '/state/3-build/' + u.id + '.json', OUT + '/accept/' + u.id + '.json', OUT + '/accept/' + u.id + '.on.json')
  results[u.id] = {status, why, runs}
  if (status === 'done') { doneNow.add(u.id); builtOk.push(u); log(`built ${u.id}` + (fixes ? ` after ${fixes} fix(es)` : '')) }
  else {
    failedIds.push(u.id); log(`failed ${u.id}: ${why.join(' | ').slice(0, 300)}`)
    if (counted && runs >= STUCK_AT && prevRuns < STUCK_AT) { const t = `Living 3 stuck unit ${u.id} — ${oneLine(u.title, 80)}`; insertOnce(t, `- [ ] **${t}** — last failure: ${oneLine(why.join('; '), 300)}; fix by hand, then re-run with args.unstick ["${u.id}"]`) }
  }
  if (coex.length) {   // the whole-tree restore put back paths no living unit may write: never carry on, never let the Record re-read see them as unchanged
    gaps.push(`coexistence broken: restore of ${u.id} put back ${coex.join(', ')}`)
    return await early({reason: 'coexistence broken: restore of ' + u.id + ' put back ' + coex.slice(0, 8).join(', '),
      polish_note: `Living 3 slice ${SLICE}: unit ${u.id} failed and its restore put back ${coex.slice(0, 8).join(', ')} (another track's concurrent write or a living breach)` + (displaced.length ? `; their pre-restore copies are under docs/living/shots/loop/displaced/LC-${u.id}/ (${displaced.slice(0, 8).join(', ')})` : '; no pre-restore copy exists') + `; the central session checks them and re-applies any legitimate write before the next run; ${builtOk.length} unit(s) built before it`})
  }
  if (unitStop === 'infra') return await early({reason: 'infra', polish_note: `Living 3 slice ${SLICE}: infra at ${u.id} (${oneLine(why.join('; '))}); ${builtOk.length} unit(s) built before it`})
}
const fixSet = new Set(fixUnits.map(u => u.id))

// ---- P3 Slice gate (GL.1-GL.14 scored in code) ----
const isLast = SLICE === SLICES[SLICES.length - 1]
const gateSlices = isLast ? SLICES : [SLICE]   // the final gate re-runs every view and check of the scope
let gateDue = GATE_MODE === 'only' || (GATE_MODE !== 'skip' && sliceDone())
if (gateDue && builtOk.length + failedIds.length > 0 && lowBudget()) { log('budget: slice gate deferred'); gateDue = false }
if (!gateDue) log(GATE_MODE === 'skip' ? 'gate "skip": slice gate not run' : `slice ${SLICE} gate not due: ${units.filter(u => !isDone(u.id) && !doneNow.has(u.id)).map(u => u.id).join(', ') || 'deferred'}`)
let crits = null, gateDied = null, gateInfra = null, gaOk = true
const hookGrowth = h => Math.max(0, String(obj(h).text ?? '').length - String(obj(h).replaces ?? '').length)
const hookBytesThrough = s => {   // GL.11's target: the tree carries every hook landed by the slices up to s in ALL_SLICES order (zoom runs on the landed motion hooks); the total over all /hook_lines when no unit names a hook id
  const hl = arr(SP.hook_lines), named = new Set(specUnits.flatMap(u => u.covers)), upTo = new Set(ALL_SLICES.slice(0, ALL_SLICES.indexOf(s) + 1))
  const ids = hl.some(h => named.has(String(obj(h).id))) ? new Set(specUnits.filter(u => upTo.has(u.slice)).flatMap(u => u.covers)) : null
  return hl.filter(h => !ids || ids.has(String(obj(h).id))).reduce((t, h) => t + hookGrowth(h), 0)
}
const BDEV = obj(obj(pre.bible).devices), SDEV = obj(SP.devices)
const t01Movers = ss => !Object.keys(SDEV).length || !Object.keys(BDEV).length ? null : Object.keys(SDEV).filter(id => ss.includes(String(obj(SDEV[id]).slice)) && (!DARK_ONLY.includes(id) || (tDark != null && tDark <= T1))).filter(id => {   // GL.4's ">= 1 moving class" binds unless this is []: the spec's devices of the gated slices in the bible's mover set; a device the bible lacks counts as a mover, unrelayed spec or bible devices (null) keep the floor (fail closed); living-4-review.js MOVERS is the same rule
  const b = BDEV[id]; return !b || typeof b !== 'object' || (b.moves === true && b.default === 'on' && b.status === 'build')
})
const specStrings = new Set(arr(SP.strings).map(s => String(typeof s === 'string' ? s : obj(s).text ?? '').trim()).filter(Boolean))
function scoreGL(s, vs, chks, gof, gfr, gst, gc, mn) {
  const E = []
  for (const v of vs) for (const p of ON_PROFILES) { const e = obj(obj(obj(gfr).views)[v])[p]; E.push({v, p, e: e && typeof e === 'object' ? e : null}) }
  const miss = E.filter(x => !x.e).map(x => x.v + '/' + x.p), EE = E.filter(x => x.e), frOk = lenOk(gfr) && !miss.length && E.length > 0
  const stl = obj(obj(gst).static), stOk = lenOk(stl)
  const per = (f) => EE.filter(x => !f(x.e, x.p)).map(x => x.v + '/' + x.p)
  const r = []
  r.push(C('GL.1', 'off identity: gate off capture and accept exit 0, failing empty (UG1-3, UG6-8, UG10, UG11)', {capture_exit: gof.capture_exit, accept_exit: gof.accept_exit, failing: arr(gof.failing).slice(0, 5)}, 'exit 0, failing []', gof.capture_exit === 0 && gof.accept_exit === 0 && !arr(gof.failing).length))
  const u4 = ug4(gof.repo, gof.ref_repo), fs2 = obj(obj(gst).fil_st), fsBad = Object.entries(obj(fs2.literals)).filter(([, x]) => !x).map(([k]) => k).concat(arr(fs2.on_hook))
  const strs = stOk ? arr(stl.strings).map(x => String(typeof x === 'string' ? x : obj(x).text ?? '')) : null
  const notListed = strs ? strs.filter(t => obj(obj(gst).readme_strings)[t] !== true) : ['static line'], voice = strs ? strs.filter(t => VOCAB_LC.test(t) || JARGON_LC.test(t)) : []
  const dr = obj(obj(gst).drift)
  r.push(C('GL.2', 'UG4 and UG9 re-scored: no anchor missing, street-drift 0, tithe lines and markers equal the reference, other tracks\' anchors, living-drift ok, every LC_STRINGS text in README §13 and free of VOCAB_LC/JARGON_LC', {ug4: u4, other_anchors: fsBad, drift: obj(dr.living).ok === true && obj(dr.street).ok === true ? 'ok' : driftIds(dr), not_listed: notListed.slice(0, 5), voice_hits: voice.slice(0, 5)}, 'all empty / ok', !u4.length && !fsBad.length && obj(dr.living).ok === true && obj(dr.street).ok === true && !notListed.length && !voice.length))
  const g3 = frOk ? per(e => { const g = obj(e.glyph_sha); return typeof g.t0 === 'string' && g.t0 !== '' && g.t0 === g.run2_t0 && e.positions_equal_profiles === true }) : null
  r.push(C('GL.3', 'still frame and determinism: glyph_sha t0 equals the second run, positions equal across profiles', frOk ? {failing: g3} : {summary: lenOk(gfr) ? 'missing ' + miss.join(', ') : 'line failed or mis-relayed'}, 'every view x profile', frOk && !g3.length))
  const movers = EE.reduce((t, x) => t + Object.keys(obj(x.e.moving_ok)).length, 0)
  const g4 = frOk ? per(e => e.moving_ok && typeof e.moving_ok === 'object' && e.still_ok && typeof e.still_ok === 'object' && Object.values(e.moving_ok).every(x => x === true) && Object.values(e.still_ok).every(x => x === true)) : null
  const mv = t01Movers(gateSlices), vac4 = s === 'L0' || (mv !== null && !mv.length)
  r.push(C('GL.4', 'moves: every moving class moved between t0 and t1, every still class did not' + (vac4 ? ' (>= 1 mover vacuous on ' + gateSlices.join(', ') + ': ' + (s === 'L0' ? 'the instrument slice' : 'no spec device moves in [t0, t1]') + ')' : ''), frOk ? {failing: g4, moving_classes: movers, t01_movers: mv ?? 'spec or bible devices not relayed'} : {summary: 'no summary', t01_movers: mv ?? 'spec or bible devices not relayed'}, vac4 ? 'all true' : 'all true, >= 1 moving class', frOk && !g4.length && (vac4 || movers > 0)))
  const stillOk = (x, p) => { const o = obj(x), c = obj(o.control); return typeof o.glyph_sha_t0 === 'string' && o.glyph_sha_t0 === o.glyph_sha_t1 && o.counts_equal === true && o.raf_living === 0 && o.journey_playing === false && o.j_reduced === true && c.present === true && (p !== 'iphone13' || (num(c.w) && num(c.h) && c.w >= 44 && c.h >= 44)) && specStrings.has(String(c.aria ?? '').trim()) }
  const g5 = s === 'L0' ? [] : frOk ? per((e, p) => stillOk(e.still, p) && stillOk(e.reduce, p)) : null
  r.push(C('GL.5', 'the still chart (from L1): under still and reduce the frame and counts hold, 0 living rAF, journey paused, j_reduced, the control present (>= 44x44 css px on iphone13) with its /strings label', s === 'L0' ? 'vacuous on L0' : frOk ? {failing: g5} : 'no summary', 'every view x profile', s === 'L0' || (frOk && !g5.length)))
  const g6 = frOk ? per((e, p) => { const st = obj(e.stops); return ['hidden', 'card', 'layer_off', 'below_band', 'offscreen'].every(k => st[k] === 0) && num(e.draws_per_s) && e.draws_per_s <= CAP_DRAWS[p] }) : null
  r.push(C('GL.6', 'stops and frames: 0 living rAF hidden/card/layer off/below band/off-screen; draws per second within 20 desktop, 15 iphone13', frOk ? {failing: g6} : 'no summary', CAP_DRAWS, frOk && !g6.length))
  r.push(C('GL.7', 'tokens and host: 0 clock tokens (P and W) and 0 forbidden names in the living files', stOk ? {clock_tokens: stl.clock_tokens, forbidden: stl.forbidden} : 'static line failed or mis-relayed', 0, stOk && sumVals(stl.clock_tokens) === 0 && sumVals(stl.forbidden) === 0))
  const g8 = frOk ? per(e => e.zoom_drift_px === null || (num(e.zoom_drift_px) && e.zoom_drift_px <= DRIFT_PX && e.transform_during_zoomanim === true)) : null
  r.push(C('GL.8', 'zoom sync: <= 1 px after zoomend and a transform during zoomanim on every view with living glyphs', frOk ? {failing: g8} : 'no summary', DRIFT_PX, frOk && !g8.length))
  const g9 = frOk ? per(e => e.alpha_ramp_ms_max === null || (num(e.alpha_ramp_ms_max) && e.alpha_ramp_ms_max <= EASE_MS)) : null
  r.push(C('GL.9', 'appear: alpha ramp <= 250 ms (R6, LC10)', frOk ? {failing: g9} : 'no summary', EASE_MS, frOk && !g9.length))
  const g10 = frOk ? per(e => { const b = obj(e.block_chunk); return b.console_errors === 0 && b.page_errors === 0 && (s === 'L0' || b.still_shown === true) }) : null
  r.push(C('GL.10', 'lazy failure: with the chunk blocked, 0 console and page errors and the still chart shown', frOk ? {failing: g10} : 'no summary', 0, frOk && !g10.length))
  const gz = stOk ? obj(stl.gz) : {}, over = []
  if (stOk) for (const [re, capB, what, summed] of LAZY_CAPS) {
    const hits = Object.entries(gz).filter(([f]) => re.test(relP(f)))
    if (summed) { const t = hits.reduce((a, [, b]) => a + (num(b) ? b : 0), 0); if (t > capB) over.push(`${what} ${t} > ${capB}`) } else hits.filter(([, b]) => !num(b) || b > capB).forEach(([f, b]) => over.push(`${relP(f)} ${b} > ${capB}`))
  }
  const hg = stOk ? stl.hook_raw_growth : null, mOk = !mn || mn.exists !== true || mn.check_exit === 0, decl = hookBytesThrough(s)
  r.push(C('GL.11', 'bytes: hook raw growth <= 200 and equal to the spec\'s cumulative hook bytes through slice ' + s + '; lazy gz within LC14; the manifest --atlas --check exit 0', {hook_raw_growth: hg, declared: decl, over, manifest: mn ? {exists: mn.exists, check_exit: mn.check_exit} : 'not run'}, {hook: HOOK_CAP_RAW, lazy: 'LC14'}, stOk && num(hg) && hg <= HOOK_CAP_RAW && hg === decl && !over.length && !!mn && mOk))
  const g12 = frOk ? per(e => { const c = obj(e.coexist); return c.console_errors === 0 && c.page_errors === 0 && e.label_overlap_px === 0 }) : null
  const idxEq = typeof obj(gof.repo).index_sha === 'string' && obj(gof.repo).index_sha !== '' && obj(gof.repo).index_sha === obj(gof.ref_repo).index_sha
  r.push(C('GL.12', 'coexistence: filigree=1 with living=1 0 errors, 0 label overlap (LC9), the sim index sha equal to the reference\'s; the Record hold shas unchanged', {failing: g12, index_sha_equal: idxEq, record_hold: 'pending'}, 0, frOk && !g12.length && idxEq))
  const g13 = frOk ? per(e => Array.isArray(obj(e.phone_parity).missing) && !e.phone_parity.missing.length) : null
  r.push(C('GL.13', 'phone parity (delay, never drop): every class drawn on desktop is drawn on iphone13 at the view zoom or +0.5', frOk ? {failing: g13} : 'no summary', 'missing []', frOk && !g13.length))
  const res = arr(obj(gc).results), bad = chks.filter(c => !checkOk(c.expect, res.find(x => x && x.id === c.key))).map(c => c.key)   // keyed by slice: the final gate carries every MANDATORY_CHECKS id once per slice
  r.push(C('GL.14', 'every /slices/<S>/checks id of every gated slice passes (an exit code, or {key, op, value} read from the command\'s JSON output)', {failing: bad, n: chks.length}, 'all pass', chks.length > 0 && !bad.length))
  return r
}
if (gateDue) {
  phase('Slice gate')
  man = await crit(PL(manTask('')), {label: 'manifest', phase: 'Slice gate', schema: MANI, ...M('triage')})
  if (!man) gateDied = 'manifest'
  else if (man.exists === true && (man.sha || null) !== (REFN.manifest ?? null)) {
    const rb = await rebase('rebase (gate)', 'Slice gate', ['the offline manifest moved since the reference'])
    if (rb.stop) return await early({reason: rb.stop.reason, polish_note: rb.stop.polish_note || `Living 3 slice ${SLICE}: ${rb.stop.reason} (rebase (gate))`})
    REFN = rb.rec; rebased.push(rb.rec.ref)
  }
  const vs = gateViews(gateSlices), chks = gateSlices.flatMap(s => sliceChecks(s).map(c => ({s, id: String(obj(c).id), cmd: String(obj(c).cmd ?? ''), expect: obj(c).expect}))).map((c, i, all) => { const k = c.s + ':' + c.id, n = all.slice(0, i).filter(x => x.s + ':' + x.id === k).length; return {...c, key: n ? k + '#' + (n + 1) : k} })
  if (!gateDied && obj(ST0.slice_accept)[SLICE] !== SPEC_SHA) {
    const ga = await crit(PL(acceptTask({id: 'slice-' + SLICE, slice: SLICE, files: [...new Set(units.flatMap(u => u.files))], acceptance: units.flatMap(u => u.acceptance)}, REFN.ref, vs, `the spec's cumulative hook bytes through slice ${SLICE} (the sum of max(0, text.length - replaces.length) over the /hook_lines the units of ${SLICES.slice(0, SLICES.indexOf(SLICE) + 1).join(', ')} name in their covers; the total over all /hook_lines when no unit names a hook id)`)), {label: 'gate accept', phase: 'Slice gate', schema: ACC, ...M('audit')})
    if (!ga) gateDied = 'gate accept'
    else if (ga.off.lint_exit !== 0 || arr(ga.off.errors).length) gaOk = false, gaps.push('slice accept file not valid: ' + oneLine(arr(ga.off.errors).join('; ')))
  }
  if (!gateDied) {
    const offTask = `Slice gate off (${SLICE}). ${SANDBOX_T}
From ${REPO}: node ${CAPTURE} ${capFlags('slice-' + SLICE)} ${CDN_TEXT}; capture_exit = its exit code. Then node ${CAPTURE} --accept ${ACCEPT_DIR}/slice-${SLICE}.json --capture ${OUTABS}/captures/slice-${SLICE}.json --ref ${REFN.ref}=${OUTABS}/captures/${REFN.ref}.json; accept_exit = its exit code, failing = its "failing" array verbatim. repo = {anchors_missing, street_drift_exit, tithe_lines, markers} from the "repo" block of ${OUTABS}/captures/slice-${SLICE}.json and index_sha = its meta.index_sha; ref_repo = {tithe_lines, markers} from the "repo" block of ${OUTABS}/captures/${REFN.ref}.json and index_sha = its meta.index_sha.
Return {capture_exit, accept_exit, failing, repo, ref_repo, infra_error ("" or the setup failure)}.`
    const chkTask = `Slice gate checks (${gateSlices.join(', ')}). From ${REPO} run each command below in order (a fresh shell each; never edit a file to make one pass) and return {results: [{id (the entry's id, as given), exit (its exit code), out_tail (the last 600 characters of its stdout), parsed, picked}]}, one per entry. parsed and picked come from a node script over the command's whole stdout saved to a file (never from the tail): j = JSON.parse(the whole stdout); when that throws, for each line that starts with "{" at column 0, from the last to the first, try the text from that line to the end of stdout, then that line alone, and j = the first that parses; parsed = whether some j parsed; picked = the value at the entry's dotted path "pick" in j (split on "."; null when pick is null, j is absent or the path is missing), copied unchanged. Entries, verbatim: ${J(chks.map(c => ({id: c.key, cmd: c.cmd, pick: pickOf(c.expect)})))}`
    const [gf, gfr, gst, gc] = await parallel([
      () => crit(PL(offTask), {label: 'gate off', phase: 'Slice gate', schema: GOFF, ...M('triage')}),
      () => crit(PL(framesTask(SLICE, vs, '')), {label: 'gate frames', phase: 'Slice gate', schema: LINE, ...M('triage')}),
      () => crit(PL(staticTask('')), {label: 'gate static', phase: 'Slice gate', schema: GSTAT, ...M('triage')}),
      () => crit(PL(chkTask), {label: 'gate checks', phase: 'Slice gate', schema: GCHK, ...M('triage')})
    ])
    gateDied = !gf ? 'gate off' : !gfr ? 'gate frames' : !gst ? 'gate static' : !gc ? 'gate checks' : null
    if (!gateDied && infraOf(gf)) gateInfra = 'gate off: ' + oneLine(gf.infra_error)
    if (!gateDied && !gateInfra) crits = scoreGL(SLICE, vs, chks, gf, gfr, gst, gc, man)
  }
  if (gateDied) return await early({reason: 'agent died: ' + gateDied, polish_note: `Living 3 slice ${SLICE}: ${builtOk.length}/${units.length} units built, gate not scored (agent died: ${gateDied})`})
  if (gateInfra) return await early({reason: 'infra', polish_note: `Living 3 slice ${SLICE}: infra (${gateInfra})`})
  outputs.push(OUT + '/captures/slice-' + SLICE + '.json', OUT + '/captures/gate-' + SLICE + '.json', OUT + '/accept/slice-' + SLICE + '.json')
}
const glFails = () => (crits || []).filter(c => !c.pass).map(c => c.id)

// ---- P4 Fix units (a failed gate: the diagnoser proposes; the next run builds) ----
const gateFails0 = obj(ST0.gate_fails), gateFails = {...gateFails0}
const newFix = []
if (crits && glFails().length) {
  const prev = obj(gateFails0[SLICE]), n = (prev.spec_sha === SPEC_SHA && Number.isInteger(prev.n) ? prev.n : 0) + 1
  gateFails[SLICE] = {n, spec_sha: SPEC_SHA}
  if (n >= GATE_ROUNDS) {
    for (const c of crits.filter(c => !c.pass)) { const t = `Living 3 stuck criterion ${SLICE} ${c.id} — ${oneLine(c.desc, 90)}`; insertOnce(t, `- [ ] **${t}** — failed ${n} gate rounds; measured ${oneLine(J(c.measured), 240)}; fix by hand, or drop a fix unit that did not cure it with args.discard`) }
  } else if (lowBudget()) log('budget: diagnoser skipped')
  else {
    phase('Fix units')
    const failed = crits.filter(c => !c.pass)
    const ledgerFix = fixUnits.map(u => ({id: u.id, slice: u.slice, status: isDone(u.id) ? 'built' : u.status, cures: u.cures, files: u.files}))
    const dg = await agent(PL(`You are the Living 3 build diagnoser for slice ${SLICE} (scope ${SCOPE}). The slice gate failed on these criteria, scored in code with their numbers:
${J(failed)}
The spec: ${SPEC_JSON} (units, rules, hook lines, budgets); the ledger's fix units (proposed, built or discarded, each with the criterion it cures): ${J(ledgerFix)}. The gate captures: ${OUTABS}/captures/gate-${SLICE}.json and ${OUTABS}/captures/slice-${SLICE}.json (read-only).
Diagnose living defects only (never the instrument's measurement, the checks or the off reference) and propose at most ${FIX_PER_ROUND} NEW fix units, each curing one failing criterion that no fix unit above already cures: {id (any placeholder; ids are assigned in code), title, files (repo-relative, each matching one of ${UNIT_FILES_OK.map(r => r.source).join(' | ')} and never ${NEVER.source}), kind (logic | tool | data | css), depends_on (unit ids already in the spec or the ledger), cures (the criterion id it cures, e.g. "GL.6", then ": " and the defect in a few words), acceptance: [{kind: "accept" | "on" | "cmd", cmd?, expect?}] (machine-checkable)}. Write no file.
${DET_RULE_LC}
${VOCAB_LC_RULE}
Return {units: [...]}.`), {label: 'diagnoser', phase: 'Fix units', schema: DIAG, ...M('judge')})
    if (!dg) log('agent died: diagnoser (no fix unit this round)')
    else {
      const cureKey = (s, c) => s + ' ' + norm(c)   // the slice and the whole cures text: a criterion may need several distinct cures, and another slice's cure never blocks this one
      const seenFix = new Set(fixUnits.map(u => u.id).concat(fixUnits.filter(u => u.status !== 'discarded').map(u => cureKey(u.slice, u.cures))))
      const failedIds2 = new Set(failed.map(c => c.id))
      let k = Math.max(0, ...fixUnits.concat(Object.keys(LEDU).map(id => ({id}))).map(u => fixK(u.id)).filter(x => x && x.slice === SLICE).map(x => x.k))
      for (const x of arr(dg.units)) {
        const u = unitOf(x, true), key = cureKey(SLICE, u.cures)
        const why = seenFix.has(key) ? 'cure already in the ledger or this round' : !failedIds2.has(String(u.cures).split(':')[0].trim()) ? 'cures no failing criterion' : !u.files.length || !u.files.every(fileOk) ? 'files outside the living set' : newFix.length >= FIX_PER_ROUND ? 'over ' + FIX_PER_ROUND + ' per round' : ''
        if (why) { log(`fix unit dropped (${why}): ${oneLine(u.cures, 80)}`); continue }
        seenFix.add(key); k++
        newFix.push({...u, id: `fix-${SLICE}${k}`, slice: SLICE, status: 'proposed', date: DATE, depends_on: u.depends_on.filter(d => specUnits.some(s => s.id === d) || fixSet.has(d))})
      }
      log(`fix units: ${newFix.map(u => u.id + ' (' + oneLine(u.cures, 40) + ')').join(', ') || 'none new'}`)
    }
  }
}

// ---- P5 Smoke (the final slice of the scope, after a passing gate) ----
let smoke = null, smokeOk = null
if (crits && isLast && !glFails().length) {
  phase('Smoke')
  smoke = await crit(PL(`Final smoke (write only under ${OUTABS}/captures and ${OUTABS}/shots). ${SANDBOX_T}
1. syntax_ok: from ${REPO}, the CLAUDE.md syntax one-liner (${REPO}/.claude/CLAUDE.md "Verification") prints "OK <n>" for index.html and for maps-site/index.html.
2. sim: node ${CAPTURE} --sim --profiles desktop --port ${PORT} ${CDN_TEXT} --out ${OUTABS}/captures/smoke-${SLICE}.json --shots-dir ${OUTABS}/shots/smoke-${SLICE} (both seeds, simDays(400) taken by the tool); sim = {<seed>: {errors (console and page errors), ready (window.ANNALS.ready reached)}} for every seed it ran.
3. atlas_living: node ${MEASURE} --frames --views ${VIEWS_JSON} --profiles desktop --living 1 --scenarios moving,coexist --port ${PORT} ${CDN_TEXT} --out ${OUTABS}/captures/smoke-${SLICE}.living.json --shots-dir ${OUTABS}/shots/smoke-${SLICE}.living; atlas_living = {errors (console plus page errors over every view), views_ok (views with 0 errors)}.
Return {syntax_ok, sim, atlas_living, infra_error ("" or the setup failure)}.`), {label: 'smoke', phase: 'Smoke', schema: SMOKE, ...M('triage')})
  if (!smoke) return await early({reason: 'agent died: smoke', polish_note: `Living 3 slice ${SLICE}: final smoke died`})
  if (infraOf(smoke)) return await early({reason: 'infra', polish_note: `Living 3 slice ${SLICE}: infra (smoke: ${oneLine(smoke.infra_error)})`})
  const seeds = Object.entries(obj(smoke.sim))
  smokeOk = smoke.syntax_ok === true && seeds.length >= 2 && seeds.every(([, v]) => obj(v).ready === true && obj(v).errors === 0) && obj(smoke.atlas_living).errors === 0
  outputs.push(OUT + '/captures/smoke-' + SLICE + '.json', OUT + '/captures/smoke-' + SLICE + '.living.json')
}

// ---- P6 Record ----
phase('Record')
const CO = await closeOut(), {broken, manFail} = CO, offered = CO.needsRestore.length ? [] : builtOk
if (crits) { const g = crits.find(c => c.id === 'GL.12'); g.measured = {...obj(g.measured), record_hold: broken.length ? broken : 'unchanged'}; g.pass = g.pass && !broken.length }
const glOk = !!crits && !glFails().length
const fixAll = fixUnits.map(u => ({id: u.id, slice: u.slice, title: u.title, files: u.files, kind: u.kind, depends_on: u.depends_on, cures: u.cures, acceptance: u.acceptance, status: doneNow.has(u.id) || isDone(u.id) ? 'built' : u.status, date: obj(arr(ST0.fix_units).find(x => obj(x).id === u.id)).date || DATE}))
  .concat(newFix.map(u => ({id: u.id, slice: u.slice, title: u.title, files: u.files, kind: u.kind, depends_on: u.depends_on, cures: u.cures, acceptance: u.acceptance, status: 'proposed', date: DATE})))
const gateRec = crits ? gateObj({scope: SCOPE, slice: SLICE, spec_sha256: SPEC_SHA, ref: REFN.ref, rebaselined: rebased, views: gateViews(gateSlices), criteria: crits, gaps: gaps.slice(),
  artifacts: [{path: OUT + '/captures/slice-' + SLICE + '.json'}, {path: OUT + '/captures/gate-' + SLICE + '.json'}, {path: OUT + '/accept/slice-' + SLICE + '.json'}], rulings_used: {lc: LCR.used}, agents_bound: BOUND}) : null
const finalRec = gateRec && isLast && gateRec.pass && smokeOk === true ? gateObj({...gateRec, final: true, slices: SLICES,
  criteria: crits.concat([C('SMOKE', 'final smoke: syntax, both seeds ready with 0 errors, the living views 0 errors', smoke ? {syntax_ok: smoke.syntax_ok, sim: smoke.sim, atlas_living: smoke.atlas_living} : null, 0, smokeOk === true)])}) : null
const sliceAccept = {...obj(ST0.slice_accept)}
if (gateRec && gaOk) sliceAccept[SLICE] = SPEC_SHA
const stateRec = {job: JOB, date: DATE, mode: MODE, scope: SCOPE, slice: SLICE, spec_sha256: SPEC_SHA, ref: REFN.ref, rebaselined: rebased, built: offered.map(u => u.id), needs_restore: CO.needsRestore, failed: failedIds, skipped,
  stuck: units.filter(u => !doneNow.has(u.id) && !isDone(u.id) && (results[u.id] ? results[u.id].runs : runsFailed(u.id)) >= STUCK_AT).map(u => u.id),
  fix_units: fixAll, discarded: [...DISCARD], gate_fails: gateFails, slice_accept: sliceAccept, gate: gateRec ? {pass: gateRec.pass, failing: glFails()} : null, final_gate: finalRec ? finalRec.pass : null, gaps: gaps.slice(), polish_inserts: inserts, agents_bound: BOUND}
const recs = []
if (gateRec) recs.push(await recordL('gates/3-build-' + SLICE + '.json', gateRec, 'record gates/3-build-' + SLICE + '.json'))
if (finalRec) recs.push(await recordL(FINAL.slice(OUTABS.length + 1), finalRec, 'record ' + FINAL.slice(OUTABS.length + 1)))
recs.push(await recordL('state/3-build.json', stateRec, 'record state/3-build.json'))
const recOk = recs.every(Boolean)
if (gateRec) outputs.push(OUT + '/gates/3-build-' + SLICE + '.json')
if (finalRec) outputs.push(OUT + FINAL.slice(OUTABS.length))
outputs.push(OUT + '/state/3-build.json')
const checkOff = !!finalRec && finalRec.pass === true && recOk && !broken.length
const titles = offered.map(u => u.title).join('; ')
const gateStr = !gateRec ? 'not run' : gateRec.pass ? 'pass' : 'fail (' + glFails().join(', ') + ')'
const reason = broken.length ? 'coexistence broken: ' + broken.join(', ') : !recOk ? 'record-mismatch' : CO.manDied ? 'agent died: manifest (record)' : smokeOk === false ? 'smoke-fail' : (gateRec && !gateRec.pass) || manFail ? 'gate-fail' : failedIds.length ? 'units-failed' : ''
return done({...base, pass: checkOff, check_off: checkOff, reason, slice: SLICE, gate: gateRec, final_gate: finalRec ? finalRec.pass : null, blocked_by: blockedBy.length ? blockedBy : undefined, outputs: [...new Set(outputs)], polish_inserts: inserts,
  owner_rulings_used: RUSED, gate_path: gateRec ? OUT + '/gates/3-build-' + SLICE + '.json' : null, fix_units_proposed: newFix.map(u => u.id), rebaselined: rebased, gaps: gaps.slice(), needs_restore: CO.needsRestore,
  polish_note: `Living 3${SCOPE === 'zoom' ? 'z' : ''} slice ${SLICE}: ${builtOk.length}/${ready.length} units built, gate ${gateStr}` + (failedIds.length ? `; failed ${failedIds.join(', ')}` : '') + (skipped.length ? `; budget skipped ${skipped.join(', ')}` : '') + (newFix.length ? `; fix units ${newFix.map(u => u.id).join(', ')}` : '') + (rebased.length ? `; rebaselined ${rebased.join(', ')}` : '') + (smokeOk === false ? '; smoke failed' : '') + (checkOff ? '; final gate passed: check off' : '') + (inserts.length ? '; skip inserts already queued' : '') + CO.note,
  changelog_line: CO.needsRestore.length ? '' : offered.length ? `living chart: slice ${SLICE} — ${titles}` : `living chart: slice ${SLICE} — no unit built (${failedIds.length} failed)`})
