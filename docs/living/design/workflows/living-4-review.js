export const meta = {
  name: 'living-4-review',
  description: 'Living 4: review the finished living chart against the bible and the spec through single-lens finders; gate = flat-chart test + no surviving blocker/major',
  whenToUse: 'Run as the POLISH item "Living 4 · Review → punch list" after docs/living/gates/3-build.json passed: Workflow({name:"living-4-review", args:{date:"YYYY-MM-DD"}}); "Living 4z" passes scope:"zoom". Docs-only; its punch items go directly above the Living 4 (or Living 4z) entry.',
  phases: [
    {title: 'Preflight', detail: 'drift, the hold, the Living 3 chain (final gate, spec unchanged), cycle, open punch items'},
    {title: 'Capture', detail: 'a fresh five-profile off capture + living frames on every view; cited stills'},
    {title: 'Find', detail: 'eleven single-lens blind finders in parallel'},
    {title: 'Verify', detail: 'per finding: reproduce -> refute -> severity; survives on 2 of 3'},
    {title: 'Panel', detail: 'three blind judges per panel view, fixed A/B order; omissions confirmed by class counts'},
    {title: 'Punch', detail: 'opus/xhigh integrator -> punch-list-c<k>.md/.json and the POLISH inserts'},
    {title: 'Record', detail: 'gates/4-review-c<k>.json, state/4-review.json'}
  ]
}
const JOB = 'living-4-review'
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
// ---- Living 4 args (design §2; every rule is a die() directly after checkArgs) ----
checkArgs(['livingRulings', 'port', 'scope', 'preview', 'cycle', 'cdnDir'])
const SCOPE = A.scope ?? 'motion'
if (!['motion', 'zoom'].includes(SCOPE)) die('args.scope must be motion|zoom')
if (A.preview != null && typeof A.preview !== 'boolean') die('args.preview must be a boolean')
if (A.cycle != null && !(Number.isInteger(A.cycle) && A.cycle >= 1)) die('args.cycle must be a positive integer (1 or 2; a third is refused)')
if (A.cycle != null && A.cycle > 2) die('a third review cycle is refused (R16 cited): the owner decides')
if (A.cdnDir != null && (typeof A.cdnDir !== 'string' || !PATH_OK.test(A.cdnDir) || !A.cdnDir.startsWith('/'))) die('args.cdnDir must be an absolute path of letters, digits and _ / . + - only')
const PREVIEW = A.preview === true
const CDN = A.cdnDir || null   // null: each relay packs its own temp dir per SANDBOX_LC

// ---- constants (design §3) ----
const ROUND_TOKENS = 400000   // one verify batch (10 findings × 3 voters); lowBudget() of the config reads it
const VERIFY_BATCH = 10
const TAG = SCOPE === 'zoom' ? '4-review-z' : '4-review'
const ZP = SCOPE === 'zoom' ? 'z-' : ''   // review-z-c<k>/, punch-list-z-c<k>.*, findings/z-c<k>-*
const IN = MODE === 'smoke' ? DOCS : OUTABS   // chain inputs (gate, spec, bible, views, reference); a smoke run reads the durable docs/living read-only, writes only under its outDir, and dies missing inputs before Living 3 has passed
const CHAIN = IN + (SCOPE === 'zoom' ? '/gates/3-build-Z.json' : '/gates/3-build.json')
const PANEL_ALL = SCOPE === 'zoom' ? ['LV5', 'LV6'] : ['LV2', 'LV3', 'LV5', 'LV8']
const PANEL_VIEWS = cap(PANEL_ALL)
const AB = {LV2: 'living-first', LV3: 'flat-first', LV5: 'living-first', LV6: 'flat-first', LV8: 'flat-first'}   // fixed A/B order per view
const JUDGES = [{id: 'J0', role: 'judge'}, {id: 'J1', role: 'deep'}, {id: 'J2', role: 'judge'}]   // opus/high, sonnet/high, opus/high
const MAX_VERIFY = 30
const SEVS = ['blocker', 'major', 'minor', 'nit']
const SEV_RUBRIC = 'blocker: a determinism or clock-token break, desktop identity with living absent, a write to another track\'s file or gate, an invented creature or behaviour shown by default; major: a gate criterion or budget missed, a missing still-chart path, a delay-not-drop break, an owner ask silently dropped; minor: a visible defect within the spec; nit: taste'
const ASKS_HOME = ASKS   // footprints, traffic, creatures, water, exhibits, zoom_detail (config)
const SLICES = SCOPE === 'zoom' ? ['Z'] : ['L0', 'L1', 'L2', 'L3']
const LAST = SLICES[SLICES.length - 1]
const T1 = 4000, DARK_ONLY = ['LC-dark-hour']   // LC11: the dim changes only inside the dark hour and t0 lies outside it; a [t0, t1] mover only while Living 1's tDark is a number <= t1 (no tDark: no frame shows its dim)
const PROFILES5 = ['iphone13', 'pixel7', 'landscape', 'desktop', 'desktop2x']
const ON_PROFILES = ['desktop', 'iphone13']
const SCENARIOS = ['moving', 'still', 'reduce', 'hidden', 'card', 'layer-off', 'below-band', 'offscreen', 'zoom-anim', 'block-chunk', 'coexist']
const STRIP_T = [0, 800, 1600, 2400, 3200, 4000]
const CAP_DRAWS = {desktop: 20, iphone13: 15}, HOOK_CAP_RAW = 200, EASE_MS = 250, DRIFT_PX = 1   // the workflow 3 §8 numbers (LC8, LC10, LC14)
const LAZY_CAPS = [[/^maps-site\/living(\.js|\/[^/]+\.js)$/, 40 * 1024, 'living code', true], [/^maps-site\/living\/traffic\.json$/, 60 * 1024, 'traffic snapshot', false], [/^maps-site\/living\/sea-mask\.png$/, 32 * 1024, 'sea mask', false], [/^maps-site\/living\/posters\/[^/]+$/, 150 * 1024, 'poster', false]]
const CONTROL_WORDS = new Set(['Still the chart', 'Stir the chart', 'Still or stir every motion on the chart'])   // README §13: the control's words
const NEVER = /^(index\.html|\.claude\/|docs\/(filigree|street|mobile)\/|tools\/(filigree|street|mobile)-|tools\/street-drift\.js|tools\/build-offline-manifest\.js|server\.js|vendor\/)/
const HEX64 = /^[0-9a-f]{64}$/
const PUNCH_PREFIX = SCOPE === 'zoom' ? 'Living 4z punch' : 'Living 4 punch'
const ABOVE = SCOPE === 'zoom' ? 'Living 4z · Review the zoom-through' : 'Living 4 · Review → punch list'
const LABEL4 = SCOPE === 'zoom' ? 'Living 4z' : 'Living 4'
const WREL = PREVIEW ? 'preview/' : ''   // preview: every write under docs/living/preview/ only
const WOUT = OUTABS + (PREVIEW ? '/preview' : '')
const OUT_W = OUT + (PREVIEW ? '/preview' : '')
const SPEC_JSON = IN + '/living-spec.json', SPEC_MD = IN + '/living-spec.md', BIBLE_JSON = IN + '/living-bible.json', BIBLE_MD = IN + '/living-bible.md'
const VIEWS_JSON = IN + '/gates/views.json', GATE1 = IN + '/gates/1-research.json', ATLAS_REF = IN + '/state/3-build/atlas-ref.json'
const CDN_TEXT = CDN ? `--cdn-dir ${CDN}` : '--cdn-dir T'
const SANDBOX_T = SANDBOX_LC + (CDN ? '' : '\nT = one mktemp -d dir you build once per this recipe (the npm pack step) and reuse for every command of this task. Its path goes into no relayed tool line: a relayed line stays exactly as the tool printed it.')
const LINE_RULE = 'Each tool line is the tool\'s one stdout JSON line parsed, every field unchanged (it carries len and sum; do not reformat, round, re-sort or drop anything). If it printed {"ok":false,...} without len/sum, use that object with len: -1 and sum: "" added; if it printed nothing parseable, use {ok: false, error: "<last stderr line>", len: -1, sum: ""}.'
const LENSES = [
  {id: 'L01', role: 'deep', name: 'determinism and the clock', q: `Is any glyph position not a pure function of (seed, class, id, day, presentation time)? Is there a clock token (grep -E '${LC_CLOCK_GREP}' over maps-site/living.js and maps-site/living/**), a W.rng, or a stream keyed outside the lc: key (${KEY_IDIOM})? Do glyphs differ between the two runs or between the profiles in metrics.json?`},
  {id: 'L02', role: 'audit', name: 'the still chart (WCAG 2.2.2 / 2.3.3)', q: 'One control, one state: does anything move past 5 s with the still-chart control on or under reduced motion? Is any information lost when still (LC3: every class and glyph of the moving chart stays)? Is there a second matchMedia or a second motion flag (LC2)?'},
  {id: 'L03', role: 'audit', name: 'desktop identity and bytes with living absent', q: 'With living absent, is there any pixel, node, listener, request or byte beyond the declared hook lines? Do the hook bytes stay within LC14? Does the offline manifest hold (the off capture\'s accept result and the static line)?'},
  {id: 'L04', role: 'audit', name: 'phone parity and battery', q: 'Delay, never drop, on iphone13: is a class drawn on desktop missing on the phone? Is a living rAF callback running while hidden, off-screen, below its band, under a card or still? Are draws per second within LC8 (20 fine, 15 coarse, 30 one-shot on phones)?'},
  {id: 'L05', role: 'judge', name: 'canon', q: 'Is every moving thing canon-backed or ruled? Are invented creatures and behaviours absent by default (LC4)? Is Lugal one still mark at the Fell Mountains stop? Is the dark hour one whole-sheet dim (LC11)? Does a card assert canon the extract lacks (LC15)?'},
  {id: 'L06', role: 'audit', name: 'voice', q: `Do the visible living strings break the voice: VOCAB_LC, the UG9 words, the sim's ship kind leaking into a card, display nouns? Read every string against the README §13 list (${DOCS}/README.md) and ${MOB}/voice-rubric.md (read-only).`},
  {id: 'L07', role: 'deep', name: 'route truth', q: 'Do footprints follow the party route (party-route.json, JPATH) in session order, with teleport legs drawn as gaps? Do caravan strings run on the named ways (and the printed road once traced), ships on the sea lanes, all in top-origin atlas coordinates?'},
  {id: 'L08', role: 'audit', name: 'coexistence with the table map', q: SCOPE === 'zoom' ? 'Do names stay over motion and the pane order hold? R6 (no fade from nothing)? notices= read only? filigree=1 together with living=1? For the zoom-through: the step link (the sim URL from #simLink plus #s=epeshu&goto=<place>&street=1, never forwarding living=1), the poster provenance, and the street files untouched?' : 'Do names stay over motion and the pane order hold? R6 (no fade from nothing)? Is notices= only read? Does filigree=1 together with living=1 work with no label overlap?'},
  {id: 'L09', role: 'judge', name: 'ambient craft (LC9)', q: 'From the capture, do glyph boxes stay out of every label box plus a 4 px halo? Is motion slow (<= 24 css px per second), low in contrast, never flashing more than 3 times a second? What pulls the eye off the names?'},
  {id: 'L10', role: 'judge', name: 'where the build flinched', q: 'Which devices the bible says to build are stubbed, dropped, silently gated or reduced below the spec?'},
  {id: 'L11', role: 'judge', name: 'owner-input fidelity', q: `For each of the owner's six asks (${ASKS_HOME.join(', ')}; the zoom_detail ask is the zoom-in detail layer): is it delivered (a device present with glyphs in the class counts of metrics.json), deferred to a POLISH item that exists (its exact title), or ruled out by an LC id? An ask silently dropped is a finding.`}
]
const BOUND = 3 * 2 + 2 + LENSES.length + MAX_VERIFY * 3 + JUDGES.length * PANEL_ALL.length + 2 + 2 * 2   // §8: crit agents count twice; 127 (zoom 121); README §11 cap 150

// ---- schemas (design §4) ----
const S = {type: 'string'}, B = {type: 'boolean'}, I = {type: 'integer'}, SA = {type: 'array', items: S}, OBJ = {type: 'object'}
const LINE = {type: 'object', additionalProperties: true, properties: {ok: B, len: I, sum: S}, required: ['ok', 'len', 'sum']}
const DRIFT = {type: 'object', properties: {living: OBJ, street: OBJ}, required: ['living', 'street']}   // the same line as workflows 1-3
const PRE4 = {type: 'object', properties: {missing: SA, chain: {type: 'object', properties: {gate: OBJ, spec_sha_now: S, spec_sha_gate: S, cited_ok: B, gate1_cited: OBJ, st_texts_now: OBJ, fil_overrides: OBJ, lc_overrides: OBJ}, required: ['gate', 'spec_sha_now', 'spec_sha_gate', 'cited_ok']}, cycles: {type: 'array', items: I}, open_punch: SA, polish_titles: SA, spec_devices: OBJ, bible_devices: OBJ, tdark: {type: ['number', 'null']}}, required: ['missing', 'chain', 'cycles', 'open_punch', 'polish_titles']}
const CAP4 = {type: 'object', properties: {off: {type: 'object', properties: {capture_exit: I, accept_exit: I, failing: {type: 'array', items: OBJ}}, required: ['capture_exit', 'accept_exit', 'failing']}, summary: LINE, slices: {type: 'object', additionalProperties: LINE}, static: LINE, counts: {type: 'object', additionalProperties: OBJ}, cited: SA, infra_error: S}, required: ['off', 'summary', 'slices', 'static', 'counts', 'cited', 'infra_error']}   // counts: {LVn: {profile: {living: {class: n}, flat: {class: n}, still: {class: n}}}}
const FINDING = {type: 'object', properties: {id: S, severity_claim: {type: 'string', enum: SEVS}, title: S, evidence: {type: 'object', properties: {cmd: S, key: S, shot: S}, required: []}, where: S, repro: S}, required: ['id', 'severity_claim', 'title', 'evidence', 'where', 'repro']}
const FIND = {type: 'object', properties: {lens: S, findings: {type: 'array', items: FINDING}, asks: OBJ}, required: ['lens', 'findings']}   // asks only from L11: {<ask>: {status: delivered|deferred|ruled-out, device?, polish_title?, lc?}}
const REPRO = {type: 'object', properties: {id: S, reproduced: B, observed: S}, required: ['id', 'reproduced', 'observed']}
const REFUTE = {type: 'object', properties: {id: S, refuted: B, why: S}, required: ['id', 'refuted', 'why']}
const SEV = {type: 'object', properties: {id: S, severity: {type: 'string', enum: SEVS}, why: S}, required: ['id', 'severity', 'why']}
const JUDGE = {type: 'object', properties: {view: S, prefer: {type: 'string', enum: ['A', 'B']}, omissions: {type: 'array', items: {type: 'object', properties: {class: S, where: S}, required: ['class', 'where']}}, files_read: SA}, required: ['view', 'prefer', 'omissions', 'files_read']}
const PUNCH = {type: 'object', properties: {md: OBJ, json: OBJ, items: {type: 'array', items: {type: 'object', properties: {id: S, severity: S, title: S, fix: S, files: SA, done_when: S, rerun: S}, required: ['id', 'severity', 'title', 'fix', 'files', 'done_when', 'rerun']}}, hold: LINE}, required: ['md', 'json', 'items', 'hold']}   // hold: the Record-time --hold re-read (P5's last step)

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
const nz = c => Object.fromEntries(Object.entries(obj(c)).filter(([, n]) => num(n) && n > 0))   // a class with no glyph is 0 or absent

// ---- P0 Preflight (parallel: preflight, hold, drift) ----
phase('Preflight')
const INPUTS = [CHAIN, SPEC_JSON, BIBLE_JSON, BIBLE_MD, VIEWS_JSON, GATE1, IN + '/accept/slice-' + LAST + '.json', DOCS + '/rulings.json', CAPTURE, MEASURE, LDRIFT]
const PREFLIGHT_TASK = `Preflight for Living 4, scope ${SCOPE} (read-only: write nothing outside a mktemp -d dir; use a node script for each step; a missing or unparsable file gives the empty value (false, "", 0, null, [] or {}), never a guess).
A. missing = every one of these that does not exist: ${INPUTS.join(' ; ')}; plus the reference capture ${IN}/captures/<ref>.json, where <ref> is the "ref" field of ${ATLAS_REF} when that file exists and parses, else L0 (list its full path when it is absent).
B. chain = {gate: from ${CHAIN} {exists, pass: parsed.pass === true, mode: parsed.mode or "", forced: parsed.forced_by != null, final: parsed.final === true}, spec_sha_now: sha256sum ${SPEC_JSON} (""), spec_sha_gate: the "spec_sha256" field of ${CHAIN} (""), cited_ok: ${GATE1} exists, parses and has a "cited" object holding a "fil" object and an "st" object, gate1_cited: that "cited" object verbatim ({}), st_texts_now: read ${REPO}/.claude/workflows/street-1-research.js, take the text from the line that starts "const ST_RULINGS = {" through the next line that is exactly "}", evaluate it as an object literal (new Function("return " + text without the leading "const ST_RULINGS = ")), use each non-empty string under the same key of the "overrides" object of ${STD}/rulings.json in place of the default, and keep only ${ST_CITED.join(', ')}; fil_overrides: the "overrides" object of ${FIL}/rulings.json; lc_overrides: the "overrides" object of ${DOCS}/rulings.json} (string values only in both override objects).
C. cycles = the integer k of every file directly in ${IN}/gates/ whose name matches ^${TAG.replace(/-/g, '[-]')}-c([0-9]+)[.]json$ (ascending; [] when none).
D. open_punch = the title (the text after the leading "- [ ] **" up to the next "**", whitespace collapsed) of every line of ${REPO}/POLISH.md that starts with "- [ ] **${PUNCH_PREFIX} c".
E. polish_titles = the title (the text after "- [ ] **" or "- [x] **" up to the next "**", whitespace collapsed) of every line of ${REPO}/POLISH.md that starts with "- [ ] **" or "- [x] **".
F. spec_devices = for each key of the "devices" object of ${SPEC_JSON}: {slice: that entry's "slice" value verbatim (null when absent)}; bible_devices = for each key of the "devices" object of ${BIBLE_JSON}: {moves, default, status}, each that entry's value verbatim (null when absent); tdark = the "tDark" value of ${GATE1} verbatim when it is a number, else null. Copy, never judge.
Return {missing, chain, cycles, open_punch, polish_titles, spec_devices, bible_devices, tdark}.`
const [pre, hold, drift] = await parallel([
  () => crit(PL(PREFLIGHT_TASK), {label: 'preflight', phase: 'Preflight', schema: PRE4, ...M('triage')}),
  () => crit(PL(HOLD_TASK_LC), {label: 'hold', phase: 'Preflight', schema: LINE, ...M('triage')}),
  () => crit(PL(DRIFT_TASK_LC), {label: 'drift', phase: 'Preflight', schema: DRIFT, ...M('triage')})
])
const base = {scope: SCOPE, cycle: null, preview: PREVIEW, agents_bound: BOUND, polish_inserts_above: ABOVE}
for (const [x, l] of [[pre, 'preflight'], [hold, 'hold'], [drift, 'drift']]) if (!x) return done({...base, reason: 'agent died: ' + l})
if (obj(drift.living).ok !== true || obj(drift.street).ok !== true) die('prelude drift: ' + driftIds(drift))

// ---- the cycle, the chain and the blocks (computed in code; reported in plan mode, enforced in full mode) ----
const chain = obj(pre.chain), g3 = obj(chain.gate), missing = arr(pre.missing).map(String)
const cycles = arr(pre.cycles).filter(Number.isInteger)
const LCR = lcRulingsMerge(obj(chain.lc_overrides)), FILR = rulingsMerge(obj(chain.fil_overrides))
const RUSED = {lc: LCR.used, fil: FILR.used}
const POL = obj(hold.polish), LIV = obj(POL.living), HP = obj(SCOPE === 'zoom' ? LIV.zpunch_open : LIV.punch_open)
const openPunch = [...new Set(arr(pre.open_punch).map(t => oneLine(t, 400)).concat(lenOk(hold) ? Object.values(HP).flatMap(arr).map(t => oneLine(t, 400)) : []))]
const K = A.cycle ?? 1 + Math.max(0, ...cycles)
const cycleIssues = []
if (K > 2) cycleIssues.push('a third review cycle is refused (R16 cited): the owner decides')
else if (!PREVIEW && cycles.includes(K)) cycleIssues.push(`gates/${TAG}-c${K}.json already exists: refusing to overwrite an earlier cycle's record`)
const chainIssues = []
if (MODE !== 'smoke' && !FORCE && !PREVIEW) {
  const specNow = String(chain.spec_sha_now ?? '')
  if (!(g3.exists === true && g3.pass === true && g3.mode === 'full' && g3.forced !== true)) chainIssues.push(`review must wait for the finished living chart: ${relP(CHAIN)} is not a full unforced pass`)
  else if (!HEX64.test(specNow) || String(chain.spec_sha_gate ?? '') !== specNow) chainIssues.push(`review must wait for the finished living chart: living-spec.json changed since ${relP(CHAIN)} (re-run living-3-build on the current spec)`)
  const cited = obj(chain.gate1_cited), citedFil = obj(cited.fil), citedSt = obj(cited.st), stNow = obj(chain.st_texts_now)
  const changed = chain.cited_ok !== true ? ['no cited stamp in gates/1-research.json'] : FIL_CITED.filter(k => citedFil[k] !== FILR.r[k]).concat(ST_CITED.filter(k => citedSt[k] !== stNow[k]))
  if (changed.length) chainIssues.push('the cited rulings changed since Living 1 (' + changed.join(', ') + '); re-run living-1-research')
}
const blockedBy = K === 2 ? openPunch.filter(t => t.startsWith(PUNCH_PREFIX + ' c1 ')) : []
const heldBy = holdOf(hold, 'docs')
const chainOk = !missing.length && !chainIssues.length && !cycleIssues.length
base.cycle = K
if (MODE === 'plan') {
  return done({...base, reason: 'plan', chain_ok: chainOk, chain_issues: cycleIssues.concat(chainIssues), missing, held_by: heldBy, blocked_by: blockedBy, owner_rulings_used: RUSED,
    polish_note: `plan: ${LABEL4} cycle ${K}${PREVIEW ? ' (preview)' : ''}, panel ${PANEL_VIEWS.join(', ')}, ${LENSES.length} lenses, at most ${MAX_VERIFY} findings verified in batches of ${VERIFY_BATCH}, at most ${BOUND} agents including crit() retries (cap 150)` + (chainOk ? '' : '; chain not met: ' + cycleIssues.concat(chainIssues).concat(missing.length ? ['missing ' + missing.length + ' input(s)'] : []).join('; ')) + (heldBy.length ? '; held: ' + heldBy[0] : '') + (blockedBy.length ? '; blocked: ' + blockedBy[0] : '')})
}
if (missing.length) die('missing inputs: ' + missing.join(', '))
if (heldBy.length) return done({...base, reason: 'held', held_by: heldBy, owner_rulings_used: RUSED, polish_note: `${LABEL4}: held (${heldBy[0]}); no release`})
for (const m of cycleIssues) die(m)
for (const m of chainIssues) die(m)
if (blockedBy.length) return done({...base, reason: 'blocked', blocked_by: blockedBy, owner_rulings_used: RUSED, polish_note: `${LABEL4} c2: blocked while ${blockedBy.length} cycle-1 punch item(s) are open (${blockedBy[0]})`})

// ---- P1 Capture ----
phase('Capture')
const RREL = WREL + 'review-' + ZP + 'c' + K, RDIR = OUTABS + '/' + RREL
const UNIT = 'LC-review-' + ZP + 'c' + K
const SIDES = Object.fromEntries(PANEL_VIEWS.map(v => [v, AB[v] === 'living-first' ? {living: 'A', flat: 'B'} : {living: 'B', flat: 'A'}]))
const sideFiles = (v, p) => { const s = SIDES[v], d = `${RDIR}/cited/${v}/${p}/`; return {A: [], B: [], [s.living]: ['t0', 't1', 'strip'].map(n => d + s.living + '-' + n + '.png'), [s.flat]: [d + s.flat + '-still.png']} }
const CITED_WANT = PANEL_VIEWS.flatMap(v => ON_PROFILES.flatMap(p => { const f = sideFiles(v, p); return f.A.concat(f.B) }))
const CAPTURE_TASK = `Capture for the ${LABEL4} review, cycle ${K} (scope ${SCOPE}); never interpret: relay exits, failing arrays and tool lines verbatim. Write only under ${RDIR} (create it). ${SANDBOX_T}
(a) off: from ${REPO}: node ${CAPTURE} --atlas --profiles ${PROFILES5.join(',')} --unit ${UNIT} --out ${RDIR}/capture.json --shots-dir ${RDIR}/shots/off --port ${PORT} ${CDN_TEXT}; capture_exit = its exit code. Then node ${CAPTURE} --accept ${IN}/accept/slice-${LAST}.json --capture ${RDIR}/capture.json --ref <ref>=${IN}/captures/<ref>.json, where <ref> is the "ref" field of ${ATLAS_REF} (L0 when that file is absent); accept_exit = its exit code, failing = its "failing" array verbatim ([] when it passed).
(b) on: node ${MEASURE} --frames --views ${VIEWS_JSON} --profiles ${ON_PROFILES.join(',')} --living 0,1 --t 0,4000,<tDark> --scenarios ${SCENARIOS.join(',')} --runs 2 --port ${PORT} ${CDN_TEXT} --out ${RDIR}/metrics.json --shots-dir ${RDIR}/shots/on, where <tDark> is the "tDark" number of ${GATE1} (drop ",<tDark>" when it has none). Then, for each slice S of ${SLICES.join(', ')}: node ${MEASURE} --gate-summary ${RDIR}/metrics.json --spec ${SPEC_JSON} --slice S; slices[S] = that line. summary = slices["${LAST}"] (the same line again). Then node ${MEASURE} --static --hooks ${SPEC_JSON}; static = that line. ${LINE_RULE}
(c) cited stills, for the views ${PANEL_VIEWS.join(', ')} and the profiles ${ON_PROFILES.join(', ')} only: the living pair is the living=1 frame at t=0 (scenario moving), the living=1 frame at t=4000, and a strip of six living=1 frames at t = ${STRIP_T.join(', ')} ms (node ${MEASURE} --frames --views ${VIEWS_JSON} --ids <view> --profiles <profile> --living 1 --t ${STRIP_T.join(',')} --scenarios moving --port ${PORT} ${CDN_TEXT} --out ${RDIR}/strip-<view>-<profile>.json --shots-dir ${RDIR}/shots/strip, the six shots joined left to right into one PNG); the flat still is the living=0 frame at t=0. Copy each, scaled down until it is at most 300 KB when larger (the full-size shot stays under shots/), to exactly these paths (the letters are fixed per view; never rename them): ${J(Object.fromEntries(PANEL_VIEWS.map(v => [v, {living_pair: ON_PROFILES.flatMap(p => sideFiles(v, p)[SIDES[v].living]), flat_still: ON_PROFILES.flatMap(p => sideFiles(v, p)[SIDES[v].flat])}])))}. cited = every path written.
(d) counts = {<view id>: {<profile>: {living: {<class id>: glyph count at t=0 with living=1, scenario moving}, flat: {<class id>: the same with living=0}, still: {<class id>: the same under the still scenario}}}} for every view and profile in ${RDIR}/metrics.json, read from its per-class glyph counts (class ids as the instrument writes them, e.g. ${DEVICES.slice(0, 4).join(', ')}; a class with no glyph is 0).
Return {off: {capture_exit, accept_exit, failing}, summary, slices, static, counts, cited, infra_error ("" or the setup failure: port, browser, CDN, capture busy)}.`
const capR = await crit(PL(CAPTURE_TASK), {label: 'capture', phase: 'Capture', schema: CAP4, ...M('triage')})
if (!capR) return done({...base, reason: 'agent died: capture', owner_rulings_used: RUSED, polish_note: `${LABEL4} c${K}: the capture relay died twice; no release`})
if (infraOf(capR)) return done({...base, reason: 'infra', owner_rulings_used: RUSED, polish_note: `${LABEL4} c${K}: infra (capture: ${oneLine(capR.infra_error)}); no release`})
const gaps = [], outputs = [OUT_W + '/review-' + ZP + 'c' + K + '/capture.json', OUT_W + '/review-' + ZP + 'c' + K + '/metrics.json', OUT_W + '/review-' + ZP + 'c' + K + '/cited/']
const citedSet = new Set(arr(capR.cited).map(absP))
const citedMissing = CITED_WANT.filter(f => !citedSet.has(f))
if (citedMissing.length) { gaps.push('cited stills missing: ' + citedMissing.slice(0, 4).map(relP).join(', ')); log(`capture: ${citedMissing.length} cited still(s) missing`) }

// ---- P2 Find: eleven blind single-lens finders (no retry in round 0) ----
phase('Find')
const LENS_RUN = cap(LENSES)
const findPath = L => `${WOUT}/findings/${ZP}c${K}-${L.id}.json`
const FIL_TXT = rulingText(FILR.r, ['R6', 'R12', 'R13', 'R16', 'R18'])
const findTask = L => `You are finder ${L.id} of the ${LABEL4} review (cycle ${K}, scope ${SCOPE}): ${L.name}. You hold ONE lens and judge nothing outside it; never open another finder's file under ${WOUT}/findings/.
The lens: ${L.q}
Read-only inputs: the review capture ${RDIR}/capture.json, the frames ${RDIR}/metrics.json, the cited stills under ${RDIR}/cited/ (and the full-size shots under ${RDIR}/shots/); the spec ${SPEC_JSON} and ${SPEC_MD}; the bible ${BIBLE_MD} and ${BIBLE_JSON}; the code under review: ${REPO}/maps-site/living.js, ${REPO}/maps-site/living/**, and every line of ${REPO}/maps-site/index.html containing "${HOOK_MARK}"; the rulings below. Any browser step goes through node ${MEASURE} or node ${CAPTURE} per the sandbox recipe, every output under a mktemp -d dir. ${SANDBOX_T}
Living rulings (merged; LC2, LC3, LC10, LC12, LC13 fixed):
${rulingText(LCR.r, Object.keys(LC_RULINGS))}
Cited filigree rulings: ${FIL_TXT}
${L.id === 'L06' ? VOCAB_LC_RULE + '\n' : ''}Every finding carries evidence that reproduces it: a command (evidence.cmd, run from ${REPO}, writing only under a mktemp -d dir), a metric key of metrics.json or capture.json (evidence.key, a dotted path), or a cited shot path (evidence.shot); a finding with none is dropped. repro = the exact steps a verifier runs to see it. severity_claim by this rubric: ${SEV_RUBRIC}. At most 8 findings, the most severe first, ids F1, F2, ...
${L.id === 'L11' ? `Also return asks = {${ASKS_HOME.map(a => '"' + a + '"').join(', ')}}, each {status: "delivered" | "deferred" | "ruled-out", device (delivered: the one id of ${J(DEVICES)} that delivers it, with glyphs in metrics.json), polish_title (deferred: the exact title of an existing POLISH.md item, read from ${REPO}/POLISH.md), lc (ruled-out: the LC id that rules it out)}.\n` : ''}Write {lens: "${L.id}", date: "${DATE}", findings${L.id === 'L11' ? ', asks' : ''}} (2-space indent) to ${findPath(L)}, creating the directory.
Return {lens: "${L.id}", findings: [{id, severity_claim, title, evidence: {cmd?, key?, shot?}, where, repro}]${L.id === 'L11' ? ', asks' : ''}}.`
const lensOut = await parallel(LENS_RUN.map(L => () => agent(PL(findTask(L)), {label: L.id, phase: 'Find', schema: FIND, ...M(L.role)})))
kept(lensOut, 'finders')
const deadLens = [], pool = [], seenF = new Set(), lensCounts = {}
LENS_RUN.forEach((L, i) => {
  const o = lensOut[i], lc = lensCounts[L.id] = {found: 0, no_evidence: 0, dupe: 0, kept: 0}
  if (!o) { deadLens.push(L.id); log(`agent died: ${L.id} (no retry in round 0; G4.7 false)`); return }
  outputs.push(OUT_W + '/findings/' + ZP + 'c' + K + '-' + L.id + '.json')
  arr(o.findings).forEach((f0, j) => {
    const f = obj(f0), ev = obj(f.evidence); lc.found++
    if (![ev.cmd, ev.key, ev.shot].some(x => typeof x === 'string' && x.trim())) { lc.no_evidence++; log(`finding dropped (no evidence): ${L.id} ${oneLine(f.title, 80)}`); return }
    const key = norm(f.title) + '|' + norm(f.where)
    if (seenF.has(key)) { lc.dupe++; log(`finding dropped (duplicate): ${L.id} ${oneLine(f.title, 80)}`); return }
    seenF.add(key); lc.kept++
    pool.push({uid: `${L.id}-${j + 1}`, lens: L.id, id: String(f.id ?? ''), severity_claim: SEVS.includes(f.severity_claim) ? f.severity_claim : 'minor', title: oneLine(f.title, 200), where: oneLine(f.where, 200), repro: String(f.repro ?? '').slice(0, 1200),
      evidence: {cmd: String(ev.cmd ?? ''), key: String(ev.key ?? ''), shot: String(ev.shot ?? '')}})
  })
})
const l11 = LENS_RUN.findIndex(L => L.id === 'L11')
const asks = l11 >= 0 && lensOut[l11] ? obj(lensOut[l11].asks) : null

// ---- P3 Verify: reproduce ‖ refute ‖ severity per finding, batches of 10, each batch after the first gated by lowBudget() ----
phase('Verify')
const ranked = pool.map((f, i) => [f, i]).sort((a, b) => SEVS.indexOf(a[0].severity_claim) - SEVS.indexOf(b[0].severity_claim) || a[1] - b[1]).map(x => x[0])
const toVerify = cap(ranked).slice(0, MAX_VERIFY)
const survivors = [], dropped = [], unverified = ranked.slice(toVerify.length).map(f => ({uid: f.uid, lens: f.lens, title: f.title, severity_claim: f.severity_claim, why: MODE === 'smoke' ? 'smoke cap' : 'MAX_VERIFY'}))
if (unverified.length) log(`verify: ${unverified.length} finding(s) beyond the first ${toVerify.length} left unverified`)
const findingText = f => J({id: f.uid, lens: f.lens, severity_claim: f.severity_claim, title: f.title, where: f.where, evidence: f.evidence, repro: f.repro})
const reproTask = f => `Reproduce one ${LABEL4} review finding (read-only: write nothing outside a mktemp -d dir; never edit a repo file). Run its repro exactly as written, from ${REPO}, and compare what you observe with what it claims; a metric key is read from ${RDIR}/metrics.json or ${RDIR}/capture.json, a shot is opened as an image. ${SANDBOX_T}
The finding: ${findingText(f)}
Return {id: "${f.uid}", reproduced (true only when you saw the claimed defect yourself), observed (one line: what you saw)}.`
const refuteTask = f => `Try to show this ${LABEL4} review finding wrong (read-only; write nothing). Use the spec ${SPEC_JSON}, the bible ${BIBLE_MD}, the rulings below and the evidence (${RDIR}/metrics.json, ${RDIR}/capture.json, ${RDIR}/cited/): a finding is refuted when the spec or a ruling allows exactly what it calls a defect, when its evidence does not show it, or when it blames the living chart for another track's or the instrument's behaviour.
The finding: ${findingText(f)}
Living rulings (merged): ${rulingText(LCR.r, Object.keys(LC_RULINGS))}
Cited filigree rulings: ${FIL_TXT}
Return {id: "${f.uid}", refuted, why (one line)}.`
const sevTask = f => `Rate one ${LABEL4} review finding by this rubric only (read-only; write nothing): ${SEV_RUBRIC}.
The finding: ${findingText(f)}
Return {id: "${f.uid}", severity: "blocker" | "major" | "minor" | "nit", why (one line)}.`
for (let b = 0; b < toVerify.length; b += VERIFY_BATCH) {
  if (b > 0 && lowBudget()) { log('budget: verify batch skipped'); toVerify.slice(b).forEach(f => unverified.push({uid: f.uid, lens: f.lens, title: f.title, severity_claim: f.severity_claim, why: 'budget'})); break }
  const batch = toVerify.slice(b, b + VERIFY_BATCH)
  const tagged = (kind, f, p) => p.then(v => v ? {kind, uid: f.uid, v} : null)
  const res = await parallel(batch.flatMap(f => [
    () => tagged('repro', f, agent(PL(reproTask(f)), {label: 'repro ' + f.uid, phase: 'Verify', schema: REPRO, ...M('audit')})),
    () => tagged('refute', f, agent(PL(refuteTask(f)), {label: 'refute ' + f.uid, phase: 'Verify', schema: REFUTE, ...M('judge')})),
    () => tagged('severity', f, agent(PL(sevTask(f)), {label: 'severity ' + f.uid, phase: 'Verify', schema: SEV, ...M('triage')}))
  ]))
  const got = res.filter(Boolean)
  if (got.length < res.length) log(`verify batch ${b / VERIFY_BATCH + 1}: ${res.length - got.length}/${res.length} voter(s) dropped (a null voter counts against survival)`)
  const vote = (f, kind) => (got.find(x => x.uid === f.uid && x.kind === kind) || {}).v || null
  for (const f of batch) {
    const rp = vote(f, 'repro'), rf = vote(f, 'refute'), sv = vote(f, 'severity')
    const votes = {reproduced: !!rp && rp.reproduced === true, not_refuted: !!rf && rf.refuted === false, rated: !!sv && SEVS.includes(sv.severity)}   // null repro = not reproduced, null refute = refuted, null severity = unrated
    const yes = Object.values(votes).filter(Boolean).length
    const rec = {uid: f.uid, lens: f.lens, title: f.title, where: f.where, severity_claim: f.severity_claim, votes, observed: oneLine(rp && rp.observed, 300), refute_why: oneLine(rf && rf.why, 300)}
    if (yes >= 2) survivors.push({...f, ...rec, severity: votes.rated ? sv.severity : f.severity_claim, severity_why: oneLine(sv && sv.why, 200)})
    else dropped.push({...rec, why: !votes.reproduced ? 'not reproduced' : !votes.not_refuted ? 'refuted' : 'unrated'})
  }
}
const severeOf = xs => xs.filter(f => f.severity === 'blocker' || f.severity === 'major')
const severe = severeOf(survivors)
const unverSevere = unverified.filter(f => f.severity_claim === 'blocker' || f.severity_claim === 'major')
log(`verify: ${survivors.length} surviving (${severe.length} blocker/major), ${dropped.length} dropped, ${unverified.length} unverified`)

// ---- P4 Panel: three blind judges per panel view, fixed A/B order ----
phase('Panel')
const judgeFiles = v => ON_PROFILES.flatMap(p => { const f = sideFiles(v, p); return f.A.concat(f.B) })
const judgeTask = v => `You are a judge at a game table. Two versions, A and B, of the same view of a hand-drawn chart are saved as image files, each on a desktop screen and on a phone. Read ONLY these files (no other file, no repository, no web): ${J(judgeFiles(v))}.
In a file name, "A-" or "B-" names the version; "t0" and "t1" are two moments of that version, a "strip" is six moments of it left to right, a "still" is one moment.
Which would you rather have at the table while you play: A or B? Then list at least 3 things the version you prefer shows that the other lacks, each as {class, where}: class is the one id from this list that names it best: ${J(DEVICES)}; where says where on the chart.
Return {view: "${v}", prefer: "A" | "B", omissions: [{class, where}], files_read: [every file you opened, as an absolute path]}.`
const jobs = PANEL_VIEWS.flatMap(v => JUDGES.map(j => ({v, j})))
const jr = await parallel(jobs.map(x => () => agent(PL(judgeTask(x.v), true), {label: `judge ${x.j.id} ${x.v}`, phase: 'Panel', schema: JUDGE, ...M(x.j.role)})))
kept(jr, 'judges')
const counts = obj(capR.counts)
const confirmed = (v, cls) => ON_PROFILES.some(p => { const c = obj(obj(counts[v])[p]), l = obj(c.living)[cls], fl = obj(c.flat)[cls]; return num(l) && l > 0 && !(num(fl) && fl > 0) })
const panel = {}
for (const v of PANEL_VIEWS) {
  const allowed = [RDIR + '/cited/' + v + '/'], liv = SIDES[v].living
  panel[v] = {order: AB[v], judges: JUDGES.map(j => {
    const r = jr[jobs.findIndex(x => x.v === v && x.j.id === j.id)]
    if (!r) return {id: j.id, died: true, prefers_living: false, confirmed: []}
    const breach = blindBad(r.files_read, allowed)
    if (breach.length) log(`judge ${j.id} ${v}: read outside its cited files (${breach.slice(0, 2).join(', ')}); counted against`)
    const cls = [...new Set(arr(r.omissions).map(o => String(obj(o).class ?? '').trim()).filter(c => confirmed(v, c)))]
    return {id: j.id, died: false, blind_breach: breach.slice(0, 4), prefer: r.prefer, prefers_living: !breach.length && r.prefer === liv, confirmed: cls}
  })}
  panel[v].living_votes = panel[v].judges.filter(x => x.prefers_living).length
}
const panelOk = v => panel[v].living_votes >= 2
const flatLoses = PANEL_VIEWS.filter(panelOk).length

// ---- the gate G4 (scored in code; no agent decides a pass) ----
// GL.4's moving-class floor binds only a slice whose spec lists a device that moves in [t0, t1]: living-3-build.js t01Movers, the same rule (README §5.7 GL.4):
// a spec device of that slice in the bible's mover set (moves, default on, status build), a device the bible lacks counting as a mover, the dark-hour
// device only while tDark <= t1. Unrelayed spec or bible devices keep the floor on every slice but L0 (fail closed).
const SPD = obj(pre.spec_devices), BD = obj(pre.bible_devices), devKnown = Object.keys(SPD).length > 0 && Object.keys(BD).length > 0, tDark = num(pre.tdark) ? pre.tdark : null
const movesInT = id => { const b = BD[id]; return (!DARK_ONLY.includes(id) || (tDark != null && tDark <= T1)) && (!b || typeof b !== 'object' || (b.moves === true && b.default === 'on' && b.status === 'build')) }
const MOVERS = Object.fromEntries(SLICES.map(s => [s, devKnown ? Object.keys(SPD).filter(id => obj(SPD[id]).slice === s && movesInT(id)).sort() : null]))
const needsMover = s => s !== 'L0' && (MOVERS[s] === null || MOVERS[s].length > 0)
function sliceFails(line, s) {   // GL.3-GL.6, GL.8-GL.10, GL.12 (frames half), GL.13: the workflow 3 §8 rules over one --gate-summary line
  if (!lenOk(line)) return ['summary line ' + (line && line.ok === false ? 'failed' : 'mis-relayed')]
  const E = []
  for (const [v, pv] of Object.entries(obj(line.views))) for (const p of ON_PROFILES) { const e = obj(pv)[p]; E.push({v, p, e: e && typeof e === 'object' && !Array.isArray(e) ? e : null}) }
  if (!E.length) return ['no view in the summary']
  const w = E.filter(x => !x.e).map(x => 'missing ' + x.v + '/' + x.p), EE = E.filter(x => x.e)
  const chk = (id, f) => { const bad = EE.filter(x => !f(x.e, x.p)).map(x => x.v + '/' + x.p); if (bad.length) w.push(id + ' ' + bad.slice(0, 4).join(', ')) }
  chk('GL.3', e => { const g = obj(e.glyph_sha); return typeof g.t0 === 'string' && g.t0 !== '' && g.t0 === g.run2_t0 && e.positions_equal_profiles === true })
  chk('GL.4', e => e.moving_ok && typeof e.moving_ok === 'object' && e.still_ok && typeof e.still_ok === 'object' && Object.values(e.moving_ok).every(x => x === true) && Object.values(e.still_ok).every(x => x === true))
  if (needsMover(s) && !EE.some(x => Object.keys(obj(x.e.moving_ok)).length)) w.push('GL.4 no moving class' + (MOVERS[s] ? ' (spec movers ' + MOVERS[s].join(', ') + ')' : ' (spec or bible devices not relayed)'))
  const stillOk = (x, p) => { const o = obj(x), c = obj(o.control); return typeof o.glyph_sha_t0 === 'string' && o.glyph_sha_t0 === o.glyph_sha_t1 && o.counts_equal === true && o.raf_living === 0 && o.journey_playing === false && o.j_reduced === true && c.present === true && (p !== 'iphone13' || (num(c.w) && num(c.h) && c.w >= 44 && c.h >= 44)) && CONTROL_WORDS.has(String(c.aria ?? '').trim()) }
  if (s !== 'L0') chk('GL.5', (e, p) => stillOk(e.still, p) && stillOk(e.reduce, p))
  chk('GL.6', (e, p) => { const st = obj(e.stops); return ['hidden', 'card', 'layer_off', 'below_band', 'offscreen'].every(k => st[k] === 0) && num(e.draws_per_s) && e.draws_per_s <= CAP_DRAWS[p] })
  chk('GL.8', e => e.zoom_drift_px === null || (num(e.zoom_drift_px) && e.zoom_drift_px <= DRIFT_PX && e.transform_during_zoomanim === true))
  chk('GL.9', e => e.alpha_ramp_ms_max === null || (num(e.alpha_ramp_ms_max) && e.alpha_ramp_ms_max <= EASE_MS))
  chk('GL.10', e => { const b = obj(e.block_chunk); return b.console_errors === 0 && b.page_errors === 0 && (s === 'L0' || b.still_shown === true) })
  chk('GL.12', e => { const c = obj(e.coexist); return c.console_errors === 0 && c.page_errors === 0 && e.label_overlap_px === 0 })
  chk('GL.13', e => Array.isArray(obj(e.phone_parity).missing) && !e.phone_parity.missing.length)
  return w
}
function staticFails(st) {   // GL.7 and GL.11 (the static half): tokens, forbidden names, hook bytes, lazy caps
  if (!lenOk(st)) return ['static line ' + (st && st.ok === false ? 'failed' : 'mis-relayed')]
  const w = []
  if (sumVals(st.clock_tokens) !== 0) w.push('GL.7 clock tokens ' + J(st.clock_tokens))
  if (sumVals(st.forbidden) !== 0) w.push('GL.7 forbidden names ' + J(st.forbidden))
  if (!num(st.hook_raw_growth) || st.hook_raw_growth > HOOK_CAP_RAW) w.push('GL.11 hook raw growth ' + st.hook_raw_growth)
  const gz = obj(st.gz)
  for (const [re, capB, what, summed] of LAZY_CAPS) {
    const hits = Object.entries(gz).filter(([f]) => re.test(relP(f)))
    if (summed) { const t = hits.reduce((a, [, b]) => a + (num(b) ? b : 0), 0); if (t > capB) w.push(`GL.11 ${what} ${t} > ${capB}`) } else hits.filter(([, b]) => !num(b) || b > capB).forEach(([f, b]) => w.push(`GL.11 ${relP(f)} ${b} > ${capB}`))
  }
  return w
}
const off = obj(capR.off), sliceLines = obj(capR.slices)
const perSlice = Object.fromEntries(SLICES.map(s => [s, sliceFails(sliceLines[s], s)]))
const stFails = staticFails(capR.static)
const sumOk = lenOk(capR.summary) && same(capR.summary, sliceLines[LAST])
const g44 = off.capture_exit === 0 && off.accept_exit === 0 && !arr(off.failing).length && sumOk && SLICES.every(s => !perSlice[s].length) && !stFails.length
const stillBad = [], countViews = Object.keys(counts)
for (const v of countViews) for (const p of ON_PROFILES) { const c = obj(obj(counts[v])[p]); if (!c.living || !c.still || !same(nz(c.still), nz(c.living))) stillBad.push(v + '/' + p) }
const countsMissing = PANEL_VIEWS.filter(v => ON_PROFILES.some(p => !obj(obj(counts[v])[p]).living))
const strs = lenOk(capR.static) ? arr(capR.static.strings).concat(lenOk(capR.summary) ? arr(capR.summary.strings) : []).map(x => String(typeof x === 'string' ? x : obj(x).text ?? '')) : null
const voiceHits = strs ? strs.filter(t => VOCAB_LC.test(t) || JARGON_LC.test(t)) : null
const titles = new Set(arr(pre.polish_titles).map(t => oneLine(t, 400)))
const askOf = a => {
  const x = obj(obj(asks)[a]), st = x.status
  if (st === 'delivered') return DEVICES.includes(x.device) && countViews.some(v => ON_PROFILES.some(p => { const n = obj(obj(obj(counts[v])[p]).living)[x.device]; return num(n) && n > 0 }))
  if (st === 'deferred') return typeof x.polish_title === 'string' && titles.has(oneLine(x.polish_title, 400))
  if (st === 'ruled-out') return Object.prototype.hasOwnProperty.call(LC_RULINGS, String(x.lc ?? ''))
  return false
}
const asksOk = asks ? ASKS_HOME.filter(askOf) : []
const criteria = [
  C('G4.1', 'on every panel view at least 2 of 3 blind judges prefer the living side (A or B through the fixed order); a dead or unblind judge counts against', Object.fromEntries(PANEL_VIEWS.map(v => [v, {order: AB[v], living_votes: panel[v].living_votes, died: panel[v].judges.filter(x => x.died).map(x => x.id), breach: panel[v].judges.filter(x => arr(x.blind_breach).length).map(x => x.id)}])), '>= 2 of 3 on every view', PANEL_VIEWS.length > 0 && PANEL_VIEWS.every(panelOk)),
  C('G4.2', 'each preferring judge lists >= 3 omissions the class counts confirm (glyphs in living t0, none in flat)', Object.fromEntries(PANEL_VIEWS.map(v => [v, panel[v].judges.filter(x => x.prefers_living).map(x => ({id: x.id, confirmed: x.confirmed}))])), '>= 3 confirmed classes per preferring judge', PANEL_VIEWS.length > 0 && !countsMissing.length && PANEL_VIEWS.every(v => panel[v].judges.filter(x => x.prefers_living).every(x => x.confirmed.length >= 3))),
  C('G4.3', 'the still frame keeps every class: the still class counts equal the living t0 counts on every view and profile (LC3)', {mismatch: stillBad.slice(0, 8), views: countViews.length, panel_missing: countsMissing}, 'still == living t0', countViews.length > 0 && !countsMissing.length && !stillBad.length),
  C('G4.4', 'the still-chart test re-measured: off capture and accept exit 0 with failing empty; every slice\'s --gate-summary passes GL.3-GL.13 (GL.7, GL.11 from the static line; GL.4 needs a moving class only on a slice whose spec lists a device moving in [t0, t1])', {capture_exit: off.capture_exit, accept_exit: off.accept_exit, failing: arr(off.failing).slice(0, 5), summary_ok: sumOk, slices: perSlice, static: stFails, movers: MOVERS}, 'exit 0, failing [], every slice clean', g44),
  C('G4.5', 'zero VOCAB_LC / JARGON_LC hits in the living strings', strs ? {strings: strs.length, hits: voiceHits.slice(0, 5)} : 'static line failed or mis-relayed', 0, !!strs && !voiceHits.length),
  C('G4.6', 'zero surviving blocker or major, and no unverified finding (MAX_VERIFY cut or budget skip) claiming blocker or major', {blocker: severe.filter(f => f.severity === 'blocker').map(f => f.uid), major: severe.filter(f => f.severity === 'major').map(f => f.uid), unverified_severe: unverSevere.map(f => f.uid + ' (' + f.why + ')')}, 0, !severe.length && !unverSevere.length),
  C('G4.7', 'no lens died in round 0', {ran: LENS_RUN.map(L => L.id), died: deadLens}, LENSES.length + ' lenses', LENS_RUN.length === LENSES.length && !deadLens.length),
  C('G4.8', 'the six asks: delivered (a device with glyphs in the counts), deferred (a POLISH title found verbatim) or ruled out (an LC id)', asks ? {ok: asksOk, not: ASKS_HOME.filter(a => !asksOk.includes(a)), asks} : 'L11 died or did not run', ASKS_HOME.length + '/' + ASKS_HOME.length, !!asks && asksOk.length === ASKS_HOME.length)
]
const failing = criteria.filter(c => !c.pass).map(c => c.id)

// ---- P5 Punch: the integrator writes the punch list; inserts are computed and deduplicated in code ----
phase('Punch')
const PL_MD = `${WOUT}/punch-list-${ZP}c${K}.md`, PL_JSON = `${WOUT}/punch-list-${ZP}c${K}.json`, VER_JSON = `${WOUT}/findings/${ZP}c${K}-verified.json`
const brief = f => ({id: f.uid, lens: f.lens, severity: f.severity, title: f.title, where: f.where, evidence: f.evidence, repro: f.repro, observed: f.observed, refute_why: f.refute_why, votes: f.votes})
const panelBrief = Object.fromEntries(PANEL_VIEWS.map(v => [v, {living_votes: panel[v].living_votes, confirmed_omissions: [...new Set(panel[v].judges.flatMap(x => x.prefers_living ? x.confirmed : []))]}]))
const punchR = await crit(PL(`You are the ${LABEL4} punch-list integrator (cycle ${K}, scope ${SCOPE}). Write exactly three files, nothing else:
1. ${VER_JSON}: {date: "${DATE}", cycle: ${K}, scope: "${SCOPE}", survivors, dropped, unverified} with the three lists below verbatim (2-space indent).
2. ${PL_MD} with the sections "## Why the flat chart is worse" (per panel view, the confirmed omissions below, in plain words), "## Where we flinched" (the surviving findings of lens L10; "none survived verification" when there are none), "## Punch items" (one per surviving blocker or major, below), "## Minor items" (one line per surviving minor or nit and per unverified finding), and "## Gate" (each criterion id, pass or fail, one line).
3. ${PL_JSON}: {date, cycle, scope, items, minors, gate: {pass, failing}} where items is the list you return.
Then copy the two punch-list files to ${WOUT}/punch-list.md and ${WOUT}/punch-list.json.
One item per surviving blocker or major, with id = the finding id exactly: {id, severity, title (a short imperative POLISH title, no "**"), fix (what to change), files (repo-relative; only Living 3's files: maps-site/living.js, maps-site/living/**, the declared ${HOOK_MARK} lines of maps-site/index.html, tools/living-*.js, docs/living/**), done_when (a machine check: a command, a metric key with its threshold, or a gate criterion), rerun (the job to re-run after the fix)}. Each item is a plain POLISH item obeying Living 3's hold. A spec defect becomes the fix "re-run living-2-plan: <what>", a fixture defect "re-run living-1-research: <what>". Never name a file of another track, index.html or anything under .claude/. A fix that touches motion keeps it presentation only (LC12): presentation time from the rAF timestamp argument with dt clamped to 100 ms, so it freezes under the capture's virtual clock; randomness only from keyed streams ${KEY_IDIOM}; no clock token (grep -E '${LC_CLOCK_GREP}') and no W.rng in maps-site/living.js or maps-site/living/**.
${VOCAB_LC_RULE}
Surviving findings: ${J(survivors.map(brief))}
Dropped findings: ${J(dropped.map(f => ({id: f.uid, lens: f.lens, title: f.title, why: f.why})))}
Unverified findings: ${J(unverified)}
Panel (living votes of 3; omissions confirmed by the class counts): ${J(panelBrief)}
Asks (L11): ${J(asks || {})}
Gate criteria, scored in code: ${J(criteria.map(c => ({id: c.id, pass: c.pass, desc: c.desc})))}
Last, after every file above is written and copied (this is the run's Record-time coexistence read; it writes nothing): from ${REPO} run node tools/living-drift.js --hold; hold = its one stdout line parsed, every field unchanged (it carries len and sum; do not reformat, round or drop anything).
Return {md: {path, sha256 (sha256sum)}, json: {path, sha256 (sha256sum), parsed: true when it re-parses}, items, hold}.`), {label: 'punch', phase: 'Punch', schema: PUNCH, ...M('integ')})
if (!punchR) return done({...base, reason: 'agent died: punch', owner_rulings_used: RUSED, outputs, polish_note: `${LABEL4} c${K}: the punch integrator died twice; no gate recorded`})
if (!FILE_OK(obj(punchR.json))) gaps.push('punch-list json not verified (sha256 or parse)')
outputs.push(OUT_W + '/punch-list-' + ZP + 'c' + K + '.md', OUT_W + '/punch-list-' + ZP + 'c' + K + '.json', OUT_W + '/punch-list.md', OUT_W + '/punch-list.json', OUT_W + '/findings/' + ZP + 'c' + K + '-verified.json')
const items = arr(punchR.items).map(obj)
const tail = t => { const i = t.indexOf(' — '); return norm(i >= 0 ? t.slice(i + 3) : t) }
const seenIns = new Set(openPunch.map(norm).concat(openPunch.map(tail)))
const inserts = []
const insertOnce = (title, line) => { const a = norm(title), b = tail(title); if (seenIns.has(a) || seenIns.has(b)) { log('polish insert dropped (already queued): ' + title); return } seenIns.add(a); seenIns.add(b); inserts.push(line) }
for (const f of severe) {
  const it = items.find(x => String(x.id ?? '') === f.uid) || null
  if (!it) { gaps.push('no punch item for ' + f.uid + ': its insert uses the finding'); log('punch: no item for ' + f.uid) }
  const files = arr(it && it.files).map(relP), bad = files.filter(p => NEVER.test(p))
  if (bad.length) { gaps.push(`punch item ${f.uid} named another track's file(s): ${bad.join(', ')} (dropped from the insert)`); log('punch: dropped foreign file(s) from ' + f.uid) }
  const t = `${PUNCH_PREFIX} c${K} ${f.uid} — ${oneLine(it ? it.title : f.title, 90)}`
  insertOnce(t, `- [ ] **${t}** — ${f.severity} (${f.lens}); fix: ${oneLine(it ? it.fix : f.repro, 300)}; files: ${files.filter(p => !NEVER.test(p)).join(', ') || '-'}; done when: ${oneLine(it ? it.done_when : 'the finding no longer reproduces', 200)}; then ${oneLine(it ? it.rerun : 'living-4-review', 80)}`)
}
const minorsN = survivors.length - severe.length + unverified.length
if (failing.length && minorsN) { const t = `${PUNCH_PREFIX} c${K} minors — ${minorsN} minor or unverified item(s)`; insertOnce(t, `- [ ] **${t}** — see ${OUT_W}/punch-list-${ZP}c${K}.md "## Minor items"`) }

// ---- P6 Record: coexistence (README §5.4) — the --hold re-read rides the punch integrator as its last step, so agents_bound stays 127 (§8); Living 4 writes none of these groups ----
phase('Record')
const COEX4 = ['index', 'atlas', 'manifest', 'maps_other', 'docs_filigree', 'docs_street', 'docs_mobile', 'street_state3', 'workflows', 'tools_other']
const h0 = obj(hold.shas), h1 = lenOk(punchR.hold) ? obj(punchR.hold.shas) : null
const coexBad = !h1 ? ['the Record hold read mis-relayed'] : COEX4.filter(k => !same(h0[k], h1[k])).map(k => k + ' moved during the run')
if (coexBad.length) { log('coexistence broken: ' + coexBad.join('; ') + ' (no cycle gate recorded; re-run this cycle)'); gaps.push('coexistence broken: ' + coexBad.join('; ')) }
const gateRel = `${WREL}gates/${TAG}-c${K}.json`
const gate0 = gateObj({scope: SCOPE, cycle: K, preview: PREVIEW, criteria, gaps: gaps.slice(), rulings_used: RUSED, agents_bound: BOUND, panel_views: PANEL_VIEWS, ab: Object.fromEntries(PANEL_VIEWS.map(v => [v, AB[v]])),
  survivors: survivors.map(f => ({uid: f.uid, lens: f.lens, severity: f.severity, title: f.title})), dropped: dropped.map(f => ({uid: f.uid, why: f.why})), unverified: unverified.map(f => ({uid: f.uid, severity_claim: f.severity_claim, why: f.why})), dead_lenses: deadLens, lens_counts: lensCounts,
  artifacts: [{path: OUT_W + '/review-' + ZP + 'c' + K + '/capture.json'}, {path: OUT_W + '/review-' + ZP + 'c' + K + '/metrics.json'}, {path: OUT_W + '/punch-list-' + ZP + 'c' + K + '.json', sha256: String(obj(punchR.json).sha256 ?? '')}]})
const gateRec = {...gate0, coexistence: {ok: !coexBad.length, moved: coexBad}, ...(PREVIEW || coexBad.length ? {pass: false} : {})}   // a preview, or a run that overlapped another track, is never a polish result
const gatePath = coexBad.length ? null : OUT + '/' + gateRel   // an overlapped run records no cycle gate: "re-run this one" keeps cycle K (cycles <= 2)
const stateRec = {job: JOB, date: DATE, mode: MODE, scope: SCOPE, cycle: K, preview: PREVIEW, forced_by: FORCE, pass: gateRec.pass, failing, survivors: survivors.map(f => f.uid), severe: severe.map(f => f.uid), polish_inserts: coexBad.length ? [] : inserts, coexistence: gateRec.coexistence, gaps: gaps.slice(), agents_bound: BOUND, gate_path: gatePath}
const recs = (coexBad.length ? [] : [await recordL(gateRel, gateRec, 'record ' + gateRel)]).concat([await recordL(WREL + 'state/4-review.json', stateRec, 'record ' + WREL + 'state/4-review.json')])
const recOk = recs.every(Boolean)
if (gatePath) outputs.push(gatePath)
outputs.push(OUT + '/' + WREL + 'state/4-review.json')
const passNow = gateRec.pass === true && recOk
const reason = PREVIEW ? 'preview' : MODE === 'smoke' ? 'smoke' : !recOk ? 'record-mismatch' : coexBad.length ? 'coexistence broken: ' + coexBad.join('; ') : FORCE ? 'forced: ' + FORCE : failing.join(', ')
const sevN = severe.length + unverSevere.length
return done({...base, pass: passNow, reason, gate: gateRec, gate_path: gatePath, outputs: [...new Set(outputs)], owner_rulings_used: RUSED,
  polish_inserts: passNow || PREVIEW || MODE === 'smoke' || coexBad.length ? [] : inserts,
  polish_note: passNow ? `${LABEL4} c${K}: the flat chart loses on ${flatLoses}/${PANEL_VIEWS.length} views, 0 blocker/major, asks ${asksOk.length}/${ASKS_HOME.length}`
    : `${LABEL4} c${K}${PREVIEW ? ' (preview)' : ''}: ${failing.length ? 'fails ' + failing.join(', ') : 'all criteria pass'}; the flat chart loses on ${flatLoses}/${PANEL_VIEWS.length} views, ${sevN} blocker/major (${unverSevere.length} unverified), asks ${asksOk.length}/${ASKS_HOME.length}` + (coexBad.length ? `; coexistence broken (${coexBad.join('; ')}): no cycle gate recorded, finish the other run and re-run cycle ${K}` : '') + (recOk ? '' : `; record-mismatch: re-run with resume:true (README §12)`) + (inserts.length && !PREVIEW && MODE !== 'smoke' && !coexBad.length ? '; skip inserts already queued' : ''),
  changelog_line: PREVIEW || MODE === 'smoke' || coexBad.length ? '' : passNow ? `docs: living chart — review cycle ${K} (${LABEL4})` : `docs: living chart — review cycle ${K} punch list (${LABEL4})`})
