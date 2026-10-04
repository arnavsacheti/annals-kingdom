export const meta = {
  name: 'filigree-4-review',
  description: 'Filigree Job 4: review the finished table map against plate one, Azlen and the Swiss stack; gate = angry-sparse test + no surviving blocker/major',
  whenToUse: 'Run as the POLISH item "Filigree 4 · Review → punch list" after gates/3-build.json passed: Workflow({name:"filigree-4-review", args:{date:"YYYY-MM-DD"}}). Docs-only; its punch items go directly above the Filigree 4 entry.',
  phases: [
    {title: 'Preflight', detail: 'build gate passed; cycle number; fixtures, views, bible targets, re-anchor'},
    {title: 'Capture', detail: 'one capture run of the committed harness -> metrics.json + dense/sparse shots; a fixed-script metrics reader (digest-checked) feeds the gate'},
    {title: 'Find', detail: '13 single-lens finders, evidence required'},
    {title: 'Verify', detail: 'dedup vs seen; reproduce + refute + severity per finding; loop until dry'},
    {title: 'Angry-sparse gate', detail: 'paired-model blind judges per open-country view; omissions confirmed by DOM metrics'},
    {title: 'Punch list', detail: 'opus/xhigh integrator -> punch-list.md/.json + polish inserts'},
    {title: 'Record', detail: 'gates/4-review-c<cycle>.json, state/4-review.json'}
  ]
}
const JOB = 'filigree-4-review'
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
checkArgs(['preview', 'cycle', 'port'])
if (A.preview != null && typeof A.preview !== 'boolean') die('args.preview must be a boolean')
const PREVIEW = A.preview === true
if (A.cycle != null) {
  if (!Number.isInteger(A.cycle) || A.cycle < 1) die('args.cycle must be an integer 1..2')
  if (A.cycle > 2) die('review cycle cap reached (R16): escalate to the owner')
}
const PORT = A.port ?? 8544
if (!Number.isInteger(PORT) || PORT < 1024 || PORT > 65535) die('args.port must be an integer 1024..65535')

// ---- constants (design: workflow-4-review.md) ----
const BOUND = 260
const BRIEF = REPO + '/docs/research/filigree-for-the-table.pdf'
const SPEC = `${OUTABS}/sheet-spec.md and ${OUTABS}/sheet-spec.json`
const BIBLE = `${OUTABS}/density-bible.md and ${OUTABS}/density-bible.json`
const SHEET_ONE_BBOX = [1216, 1376, 1760, 1664]
const SEV = ['blocker', 'major', 'minor', 'nit']
const SEV_RUBRIC = 'blocker = breaks a brief done-when or a .claude/CLAUDE.md hard rule (determinism, a canon key, the voice); major = a brief clause is unmet; minor = polish; nit = taste.'
const KEMBAR = 'Thobrauk, Arbezmara, Hesphek, Doremil, Kurūgan, Bēlkar, Mālgal, Laegos and the unworshipped Mad One'
const VIEWS_OPEN = cap(['V2', 'V3', 'V4', 'V5'])
const JUDGES = [{id: 'J0', role: 'judge'}, {id: 'J1', role: 'deep'}, {id: 'J2', role: 'judge'}]
const orderShift = ji => ji === 0 ? 0 : 1
const denseFirst = (vi, ji) => (vi + orderShift(ji)) % 2 === 0   // never random: J0 sees the opposite order to J1 and J2 on every view
const LENSES = [
  {id: 'F01', role: 'judge', check: 'Density vs plate one',
    lens: 'Is the dense sheet as full as plate one, and not a normal virtual-tabletop map? Mechanical core first: per class, the dense counts of every view (metrics.json views.<V>.dense.counts) against the bible targets.per_view[<that view\'s sheet>] (views.json gives each view\'s sheet). Then a vision read of the dense V2-V5 shots against the bible\'s plates.one inventory and plate one itself.',
    reads: `the brief ${BRIEF} page 2 (plate one; Read it with pages:"2"); the bible's plates.one and targets.per_view`, rulings: ['R1', 'R2', 'R5', 'R8', 'R20']},
  {id: 'F02', role: 'deep', check: 'City vs Azlen',
    lens: 'Does the city look painted, or like a UI? Start from V6 day and night: metrics.json city.pins_at_rest and city.block_labels, and the V6 shots. Then a vision read that cites screen regions (image path + x,y,w,h): texture over type, park voids, arterials, fog as weather, pooled edges, no chrome and no pins at rest.',
    reads: `the brief ${BRIEF} pages 4 and 6 (Azlen: page 4 is 'The painted city', page 6 the pooled edges and the appear effect; Read them with pages:"4" and pages:"6"); the spec's city_rule`, rulings: ['R4', 'R7', 'R13', 'R19']},
  {id: 'F03', role: 'audit', check: 'Stack pull',
    lens: 'Can you pull the old survey, the shut ways and the muster days without a redraw? From metrics.json: base tiles refetched per overlay toggle (tiles.<toggle>.base_requests), base DOM node identity across toggles (stack.node_identity_kept, a stamped data-probe), no reload (stack.reload), hash round-trip (stack.roundtrip_equal), moveend keeps params (stack.moveend_keeps_params). Then read the overlay and hash code.',
    reads: 'the spec\'s overlays, hash and toggle sections; maps-site/index.html at the anchors function handleHash, function setEra and !/^#view=/.test(location.hash)', rulings: ['R10', 'R12', 'R14', 'R18']},
  {id: 'F04', role: 'audit', check: 'Every name read aloud',
    lens: 'Read every dense label aloud (every name in metrics.json views.<V>.dense.labels). For each: syllabify it under the Patrinaic seams; apply the NAME repeat rule (anchor NAME.used.has(n) in index.html); at most 12 letters per word; no cluster of 4 consonants; no reserved canon word. Anything unsayable is cut or rewritten, and the fix targets the generator source (tools/mint-names.js, its veto list, the roots tool), never the generated JSON.',
    reads: `${REPO}/lexicon/patrinaic.json, ${REPO}/tools/pgd2lexicon.js, ${REPO}/tools/mint-names.js, ${OUTABS}/names-for-owner.md; index.html at the anchors const NAME = , NAME.used.has(n) and const PATRINAIC_ROOTS`, rulings: ['R9', 'R10']},
  {id: 'F05', role: 'judge', check: 'Where the build flinched',
    lens: `Where did the build flinch and generalize? On the 12 fixtures (metrics.json cells.<F>.dense): are the six classes of each cell's ground class present? Do the Job 1 applier instances (${OUTABS}/gates/1-hex-answers.json) exist on the dense render, by name or by position (within 16 atlas px)? Across the sheet-one bbox ${JSON.stringify(SHEET_ONE_BBOX)} (atlas px): DEM local maxima at or above the spec's prominence that carry no height or name label, and valleys without contour hair (node tools/filigree-dem.js --bbox x0,y0,x1,y1 and --at x,y).`,
    reads: `${OUTABS}/gates/hexes.json, ${OUTABS}/gates/1-hex-answers.json, the bible's ground_classes, ${REPO}/tools/filigree-dem.js`, rulings: ['R1', 'R17', 'R20', 'R22']},
  {id: 'F06', role: 'audit', check: 'Canon and voice',
    lens: `Canon and voice. ${VOCAB_RULE} The pantheon is the nine Kembar (${KEMBAR}); years are counted A.B. Every invented feature carries prov "invented" (maps-site/data/filigree-*.json). The R10 rename is done: "The Tithe-Yard" and "The Tithe-Barn" occur 0 times in maps-site/index.html and "The Tribute-Yard" and "The Tribute-Barn" are both present (grep -cF each), and no description string still carries the old levy word: grep -ci tithe maps-site/index.html returns 0.`,
    reads: `${REPO}/maps-site/data/filigree-*.json, ${OUTABS}/names-for-owner.md, the "Campaign canon" section of ${REPO}/.claude/CLAUDE.md (read only)`, rulings: ['R9', 'R10', 'R21']},
  {id: 'F07', role: 'deep', check: 'Determinism',
    lens: `Determinism. Never run a generator in ${REPO}: copy the repo once into a fresh temp dir (D=$(mktemp -d); tar -C ${REPO} --exclude=./.git -cf - . | tar -C $D -xf -), then run every command in the spec's generators list twice inside $D (cwd $D; any ${REPO} prefix in a command rewritten to $D) and compare the sha256sum of its outputs in $D between the two runs. A cmd evidence for a generator must itself make that temp copy first, so a verifier re-running it never writes into the repo. grep -nE '${CLOCK_GREP}' over the FILIGREE block of maps-site/index.html (between /* FILIGREE */ and /* /FILIGREE */) must find nothing. Fog is seeded (metrics.json fog.same_day_equal and fog.diff_day_differs). ANNALS.stats() must be identical across two sim loads of /?v=<int>#s=epeshu (sandbox recipe: ${DOCS}/README.md §8 (f)).`,
    reads: 'the spec\'s generators list; maps-site/index.html (FILIGREE block); index.html', rulings: ['R9', 'R13']},
  {id: 'F08', role: 'audit', check: 'Accessibility and phone ("cramped")',
    lens: 'Accessibility and phone. At 390x844: metrics.json phone.min_label_gap_px >= the spec\'s spacing minimum, phone.overlaps = 0, phone.hscroll false; 44 px touch targets; a sane focus order; prefers-reduced-motion honoured; night mode keeps the day pixels (compare the -day- and -night- shots of the same view).',
    reads: 'the spec\'s spacing and appear sections', rulings: ['R2', 'R6']},
  {id: 'F09', role: 'audit', check: 'Performance',
    lens: 'Performance. metrics.json loaf.p95_ms (Long Animation Frames on the scripted zoom sweep) against the spec\'s perf caps; label counts per view against the label caps.',
    reads: 'the spec\'s perf section', rulings: ['R6']},
  {id: 'F10', role: 'audit', check: 'Navigator',
    lens: 'Navigator. The one-question plate (V7) label count is at or under its cap; "Where can we go this week?" is answerable in at most 2 clicks from the default atlas; search and #place deep links stay filigree-free.',
    reads: 'the spec\'s plates section; maps-site/index.html at the anchors var THEMES= and var DEFAULT_ON=', rulings: ['R18']},
  {id: 'F11', role: 'deep', check: 'Data truth',
    lens: 'Data truth ("pretty maps do not fix bad data"). Rivers and the rust road against crops of the print (maps-site/tiles/5/): dotted lines are roads, solid lines are rivers, never swapped. Names against canon (maps-site/data/wiki-places.json, maps-site/data/gazetteer.json). Every invented item carries prov.',
    reads: `${REPO}/maps-site/tiles/5/, ${REPO}/maps-site/data/wiki-places.json, ${REPO}/maps-site/data/gazetteer.json, ${REPO}/maps-site/data/filigree-*.json`, rulings: ['R3', 'R9', 'R21']},
  {id: 'F12', role: 'audit', check: 'Appear effect',
    lens: 'Appear effect. From the opacity samples in metrics.json appear (0.05-zoom steps across each class\'s minZoom +-0.5): no class goes from 0 to >= 0.9 within one 0.05 step; nothing is visible below its minZoom; names arrive at or after their own ink; the ease width is within R6.',
    reads: 'the spec\'s appear section; maps-site/index.html at the anchor function worldOpacityUpdate', rulings: ['R1', 'R6']},
  {id: 'F13', role: 'audit', check: 'Real colour',
    lens: 'Real colour. Wash hues against the hue sampled from the print (Delta E <= 10); line colours equal the palette tokens; biome agreement with maps-site/data/city-traits.json.',
    reads: `the spec's palette section; ${REPO}/maps-site/data/city-traits.json; maps-site/index.html at the anchors function washMake and function sampleCityMask`, rulings: ['R3']}
]
const LENS_IX = id => LENSES.findIndex(L => L.id === id)

// ---- schemas (design § Agents and schemas) ----
const S = {type: 'string'}, SA = {type: 'array', items: S}, B = {type: 'boolean'}, N = {type: 'number'}, I = {type: 'integer'}
const obj = (properties, required) => ({type: 'object', properties, required: required || Object.keys(properties)})
const NMAP = {type: 'object', additionalProperties: N}
const FREE = {type: 'object', additionalProperties: {type: ['string', 'number', 'boolean', 'array', 'object', 'null']}}
const PRE = obj({
  anchors: {type: 'object', additionalProperties: {type: ['string', 'null']}},
  rulings_overrides: {type: 'object', additionalProperties: S},
  build_pass: B, prior_count: I, cycle_gate_exists: B, prior_punch_ids: SA, prior_punch_lens: {type: 'object', additionalProperties: S},
  views: {type: 'array', items: obj({id: S, sheet: S, x: N, y: N, zoom: N, mask: S})},
  hexes: {type: 'array', items: obj({id: S, cell: S})},
  hex_answers: {type: 'object', additionalProperties: obj({ground_class: S, exempt_rule: S, instances: I})},
  targets: obj({per_view: {type: 'object', additionalProperties: NMAP}}),
  ground_classes: {type: 'object', additionalProperties: obj({six: SA, exempt_rule: S})},
  plate_one: NMAP,
  perf: FREE, appear: FREE, spacing: FREE, city_rule: FREE, plates: FREE, palette: FREE, overlays: FREE,
  generators: SA, slice_classes: {type: 'object', additionalProperties: SA},
  sheet_rules: {type: 'object', additionalProperties: obj({must: SA, forbidden: SA})}, shield_class: S, homestead_classes: SA, river_town: obj({name: S, x: N, y: N}),
  missing: SA})
const CAPT = obj({metrics_path: S, shots_dir: S, metrics_sha256: S, shield_near_river_town: {type: ['number', 'null']}, infra_error: S})
const NB = {type: ['boolean', 'null']}, NN = {type: ['number', 'null']}, NI = {type: ['integer', 'null']}
const MET = obj({   // exactly what METRICS_JS prints, plus the file's sha256
  sha256: S, digest: S,
  views: {type: 'object', additionalProperties: obj({dense: obj({named: I, heights: N, counts: NMAP}), sparse: obj({named: I, heights: N})})},
  cells: {type: 'object', additionalProperties: obj({dense: NMAP})},
  names_dense: {type: 'object', additionalProperties: SA}, names_sparse: {type: 'object', additionalProperties: SA},
  stack: obj({node_identity_kept: NB, reload: NB, roundtrip_equal: NB, moveend_keeps_params: NB}),
  tiles_refetched: NN, appear_violations: NI, below_minzoom_visible: NI, loaf_p95_ms: NN,
  phone: obj({min_label_gap_px: NN, overlaps: NN, hscroll: NB}),
  city: obj({pins_at_rest: NN, block_labels: NN}),
  console_errors: SA, infra_error: S})
const FIND = obj({lens: S, findings: {type: 'array', items: obj({
  title: S, severity_guess: {type: 'string', enum: SEV},
  location: obj({view: S, hex: S, file: S, pattern: S}),
  evidence: obj({kind: {type: 'string', enum: ['shot', 'anchor', 'metric', 'cmd']}, ref: S}),
  fix: S, unit_hint: S, prior_id: S}), maxItems: 2}})
const REPRO = obj({reproduced: B, note: S})
const REFUTE = obj({refuted: B, why: S})
const SEVS = obj({severity: {type: 'string', enum: SEV}})
const SPARSE = obj({prefers: {type: 'string', enum: ['A', 'B']},
  omissions: {type: 'array', items: obj({name: S, kind: S, missing_on: {type: 'string', enum: ['A', 'B']}})}, files_read: SA})
const PUNCH = obj({md: S, json: S, sha_md: S, sha_json: S, parsed: B, items: {type: 'array', items: obj({id: S, severity: S, polish_md: S})}})
const PRUNE = obj({cited: SA, removed: SA, count_ok: B})

// ---- helpers ----
const J = v => JSON.stringify(v)
const oneLine = s => String(s ?? '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
const pad2 = n => String(n).padStart(2, '0')
const AGENT_TOKENS = 30000   // rough per-agent spend, turns the optional token budget into an agent count
const budgetLeft = () => {
  try {
    if (!budget || typeof budget !== 'object') return Infinity
    const r = typeof budget.remaining === 'function' ? budget.remaining() : budget.remaining
    return typeof r === 'number' && !Number.isNaN(r) ? r : Infinity
  } catch (e) { return Infinity }
}
const budgetLow = n => budgetLeft() < n * AGENT_TOKENS
const FIND_CAP = round => round === 0 ? 2 : 1   // findings kept per lens per round; the plan schedule and the extra-round estimate rest on it
const pidOf = f => String(f.prior_id ?? '').trim()
const keyOf = (lens, f) => {
  const pid = pidOf(f)
  if (pid) return norm(lens + '|prior|' + pid)   // a still-open prior punch item keys on its own id, per lens, so one lens never displaces another's report
  const l = f.location || {}
  return norm(lens + '|' + l.view + l.hex + l.file + l.pattern + '|' + f.evidence.ref)
}
const doneWhen = f => `the ${f.evidence.kind} check \`${oneLine(f.evidence.ref)}\` no longer reproduces it (re-run it from the repo root; the next review cycle's reproduce verifier returns reproduced=false)`
const SHOT_REF = '"<absolute image path>#x,y,w,h" (the image path, a #, then the region in image pixels; e.g. /abs/V2-dense-day-dpr1.jpg#120,40,200,80)'
const shotPath = ref => {   // tolerant of any separator after the image name; '' when the ref names no image
  const m = String(ref ?? '').match(/([^\s'"`(<[]+?\.(?:jpe?g|png))(?![A-Za-z0-9])/i)
  return !m ? '' : m[1].includes('/') ? absP(m[1]) : SHOTS + '/' + m[1]
}
// Gate measurements come from a fixed script over metrics.json, never from an agent's own summary; the digest catches a mistranscribed return.
function canon(v) { return typeof v === 'string' ? v.normalize('NFC') : Array.isArray(v) ? v.map(canon).sort((a, b) => { const x = JSON.stringify(a), y = JSON.stringify(b); return x < y ? -1 : x > y ? 1 : 0 }) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v }
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 } return h.toString(16).padStart(8, '0') }
const MET_KEYS = ['views', 'cells', 'names_dense', 'names_sparse', 'stack', 'tiles_refetched', 'appear_violations', 'below_minzoom_visible', 'loaf_p95_ms', 'phone', 'city', 'console_errors', 'infra_error']
const metDigest = m => fnv(JSON.stringify(canon(Object.fromEntries(MET_KEYS.map(k => [k, m[k]])))))
const METRICS_JS = `const canon = (${canon})
const fnv = (${fnv})
let s = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', d => { s += d }).on('end', () => {
  const m = JSON.parse(s), o = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {}, L = x => Array.isArray(x) ? x : null
  const n = x => typeof x === 'number' && isFinite(x) ? x : null, b = x => typeof x === 'boolean' ? x : null
  const nm = x => { const r = {}; for (const [k, v] of Object.entries(o(x))) if (n(v) !== null) r[k] = v; return r }
  const txt = ls => ls.map(l => String(o(l).text == null ? '' : o(l).text)).filter(Boolean)
  const views = {}, names_dense = {}, names_sparse = {}, cells = {}
  for (const [v, x] of Object.entries(o(m.views))) {
    const d = o(o(x).dense), sp = o(o(x).sparse), dl = L(d.labels) || [], sl = L(sp.labels) || []
    views[v] = {dense: {named: dl.length, heights: n(d.heights) || 0, counts: nm(d.counts)}, sparse: {named: sl.length, heights: n(sp.heights) || 0}}
    names_dense[v] = txt(dl); names_sparse[v] = txt(sl)
  }
  for (const [f, x] of Object.entries(o(m.cells))) cells[f] = {dense: nm(o(x).dense)}
  const tl = Object.values(o(m.tiles)), ap = o(m.appear), st = o(m.stack), ph = o(m.phone), ct = o(m.city)
  const out = {views, cells, names_dense, names_sparse,
    stack: {node_identity_kept: b(st.node_identity_kept), reload: b(st.reload), roundtrip_equal: b(st.roundtrip_equal), moveend_keeps_params: b(st.moveend_keeps_params)},
    tiles_refetched: tl.length && tl.every(x => n(o(x).base_requests) !== null) ? tl.reduce((t, x) => t + o(x).base_requests, 0) : null,
    appear_violations: L(ap.violations) ? ap.violations.length : null, below_minzoom_visible: L(ap.below_minzoom_visible) ? ap.below_minzoom_visible.length : null,
    loaf_p95_ms: n(o(m.loaf).p95_ms), phone: {min_label_gap_px: n(ph.min_label_gap_px), overlaps: n(ph.overlaps), hscroll: b(ph.hscroll)},
    city: {pins_at_rest: n(ct.pins_at_rest), block_labels: n(ct.block_labels)},
    console_errors: (L(m.console_errors) || []).map(String), infra_error: m.infra_error == null ? '' : String(m.infra_error)}
  out.digest = fnv(JSON.stringify(canon(out)))
  process.stdout.write(JSON.stringify(out) + '\\n')
})
`

// ---- Preflight ----
phase('Preflight')
const pre = await crit(P(`${ANCHOR_TASK}
Put that object under "anchors". Then read the following and write nothing. An absent input gives the empty value of its key.
1. build_pass: ${OUTABS}/gates/3-build.json exists, parses and has "pass": true.
2. Prior reviews: list ${OUTABS}/gates/4-review-c*.json. prior_count = the number of them that parse and do NOT carry "preview": true. prior_punch_ids = the "punch_ids" array of the one of those with ${A.cycle != null ? `cycle number ${A.cycle - 1} in its file name (4-review-c${A.cycle - 1}.json; [] when absent)` : 'the highest cycle number in its file name'} (fall back to the ids of items[] in ${OUTABS}/punch-list.json when that gate has no punch_ids); [] when there is none. cycle_gate_exists = ${A.cycle != null ? `${OUTABS}/gates/4-review-c${A.cycle}.json exists and does not carry "preview": true` : 'false'}. prior_punch_lens = {<id>: the "lens" of that item} for every item in items[] of ${OUTABS}/punch-list.json ({} when that file is absent).
3. views = the "views" array of ${OUTABS}/gates/views.json as [{id, sheet, x, y, zoom, mask}] (mask '' when none).
4. hexes = the "hexes" array of ${OUTABS}/gates/hexes.json as [{id, cell:"cx,cy"}].
5. hex_answers = from ${OUTABS}/gates/1-hex-answers.json, per hex id: {ground_class, exempt_rule ('' when none), instances (the number of items)}, taken from applier A (applier B when A is absent for that hex).
6. From ${OUTABS}/density-bible.json: targets = {per_view: its targets.per_view verbatim ({<sheet>:{<class>:n}})}; ground_classes = {<id>: {six, exempt_rule ('' when none)}}; plate_one = its plates.one.classes verbatim ({<class>:n}).
7. From ${OUTABS}/sheet-spec.json: perf, appear, spacing, city_rule, plates, palette and overlays as objects (a value that is an array or a scalar is wrapped as {"value": <it>}; {} when absent); generators as an array of command strings (an object entry gives its cmd); slice_classes verbatim ({<slice>:[classId]}).
8. rulings_overrides = the "overrides" object of ${DOCS}/rulings.json ({} when that file is absent).
9. Sheet rules: sheet_rules = {<sheet>: {must: the class ids of /sheets/<sheet>/must ([{class, rule}] -> class), forbidden: /sheets/<sheet>/forbidden}} for every sheet under /sheets of ${OUTABS}/sheet-spec.json; river_town = /picks/river_town of that file as {name, x, y} ({name: "", x: 0, y: 0} if missing); from ${OUTABS}/density-bible.json: shield_class = the id of the class that draws the overlay town shield (R19; '' if none), homestead_classes = the ids of every class whose id or label names homesteads.
missing = the paths of these required inputs that are absent or do not parse: ${OUTABS}/gates/views.json, ${OUTABS}/gates/hexes.json, ${OUTABS}/gates/1-hex-answers.json, ${OUTABS}/density-bible.json, ${OUTABS}/sheet-spec.json.`),
  {label: 'preflight', phase: 'Preflight', schema: PRE, ...M('mech')})
if (!pre) return done({reason: 'agent died: preflight'})
const lost = anchorsLost(pre.anchors)
if (lost.length) die('anchor lost: ' + lost.join('; '))
if (!pre.build_pass) {   // before the missing-inputs check: a premature full run always names the gate it waits for
  if (MODE === 'full' && !PREVIEW && !FORCE) die('review must wait for the finished sheet (gates/3-build.json pass)')
  log('gate chain not satisfied (gates/3-build.json is not pass): ' + (FORCE ? 'forced: ' + FORCE : PREVIEW ? 'preview run, findings only' : 'reported only in ' + MODE + ' mode'))
}
const REQ_IN = ['gates/views.json', 'gates/hexes.json', 'gates/1-hex-answers.json', 'density-bible.json', 'sheet-spec.json']
const miss = REQ_IN.filter(r => (pre.missing || []).some(p => String(p).trim() === r || absP(p) === OUTABS + '/' + r || absP(p).endsWith('/' + r))).map(r => OUTABS + '/' + r)
const extraMiss = (pre.missing || []).filter(p => !REQ_IN.some(r => String(p).trim() === r || absP(p).endsWith('/' + r)))
if (extraMiss.length) log('preflight listed non-required inputs as missing (ignored): ' + extraMiss.join(', '))
if (miss.length) {
  if (MODE !== 'smoke') die('missing inputs: ' + miss.join(', '))
  log('missing inputs (smoke, not enforced): ' + miss.join(', '))
}
const {r: RUL, used: RUSED} = rulingsMerge(pre.rulings_overrides)
const CYCLE = A.cycle ?? (1 + pre.prior_count)
if (A.cycle != null && pre.cycle_gate_exists && !PREVIEW && !FORCE) die(`gates/4-review-c${CYCLE}.json already exists: refusing to overwrite an earlier cycle's record (pass force with a reason to redo it)`)
if (CYCLE > 2) die('review cycle cap reached (R16): escalate to the owner')
const PRIOR_IDS = CYCLE > 1 ? pre.prior_punch_ids : []
const PRIOR_LENS = CYCLE > 1 ? Object.fromEntries(Object.entries(pre.prior_punch_lens || {}).map(([k, v]) => [norm(k), String(v ?? '').trim().toUpperCase()])) : {}
const lensOfPrior = id => PRIOR_LENS[norm(id)] || ''
const JUD = cap(JUDGES)
const nGate = VIEWS_OPEN.length * JUD.length
const RESERVE = nGate + 3 + 4   // gate judges + punch integrator (+retry) + shot pruner + two records (+retries)

if (MODE === 'plan') {
  const nL = cap(LENSES).length
  const schedule = [
    {phase: 'Preflight', agents_min: 1, agents_max: 2},
    {phase: 'Capture', agents_min: 2, agents_max: 4},
    {phase: 'Find', agents_min: nL, agents_max: nL + ROUNDS * nL},
    {phase: 'Verify', agents_min: 0, agents_max: 3 * 2 * nL + ROUNDS * 3 * nL, per_fresh_finding: 3},
    {phase: 'Angry-sparse gate', agents_min: nGate, agents_max: nGate},
    {phase: 'Punch list', agents_min: 2, agents_max: 3},
    {phase: 'Record', agents_min: 2, agents_max: 4}
  ]
  const agents_min = schedule.reduce((t, x) => t + x.agents_min, 0), agents_max = schedule.reduce((t, x) => t + x.agents_max, 0)
  return done({reason: 'plan', schedule, agents_min, agents_max, bound: BOUND, over_bound: agents_max > BOUND, cycle: CYCLE,
    assumes: 'Verify max rests on the enforced cap of 2 findings per lens in round 0 and 1 per re-run lens later (FIND maxItems + a per-round slice); fresh findings past the bound or the token budget are left unverified, and extra rounds are skipped at run time when they would cross either',
    chain_ok: pre.build_pass, preview: PREVIEW, owner_rulings_used: RUSED})
}

// A preview writes under <outDir>/preview/ only: never the durable punch list, findings, gates, state or older cycles' shots.
const PVREL = PREVIEW ? 'preview/' : '', RVABS = OUTABS + (PREVIEW ? '/preview' : ''), RVREL = OUT + (PREVIEW ? '/preview' : '')
const CAPDIR = `${RVABS}/review-c${CYCLE}`
const BLIND_TOK = vi => vi % 2 === 0 ? ['p', 'q'] : ['q', 'p']   // [dense, sparse] neutral file names for the blind judges
const coverage = [], gaps = [], criteria = []
let rounds = 0
const died = label => done({reason: 'agent died: ' + label, rounds, cycle: CYCLE, owner_rulings_used: RUSED,
  gate: gateObj({criteria: criteria.slice(), rounds, rulings_used: RUSED, gaps, cycle: CYCLE, preview: PREVIEW})})

// ---- Capture ----
phase('Capture')
const capt = await crit(P(`You own the browser for this review; you are its only capture step. Run the committed harness ONCE, from ${REPO}:
node tools/filigree-capture.js --views '${OUTABS}/gates/views.json' --cells '${OUTABS}/gates/hexes.json' --modes dense,sparse --themes day,night --dpr 1,2 --metrics labels,counts,tiles,stack,appear,loaf,phone,city,edges,fog --port ${PORT} --out '${CAPDIR}/'
- Sandbox: when unpkg/cdnjs are unreachable, prepare a CDN dir the way ${DOCS}/README.md §8 (f) describes (npm pack leaflet@1.9.4 three@0.128.0 into a mktemp -d dir, extracted) and add --cdn-dir <that dir>. Never run playwright install. If port ${PORT} is not 8544, a server must already be listening there (server.js listens on 8544 only).
- The views file lists every view (V1, the country sheet, through V7); capture them all, V1 included: never pass or keep a subset.
- The harness writes ${CAPDIR}/metrics.json and the images <view>-<mode>-<theme>-dpr<k>.jpg. The images belong in ${CAPDIR}/shots/ (git-ignored bulk, at most 300 KB each): if the harness wrote them straight into ${CAPDIR}/, move them into ${CAPDIR}/shots/ without renaming them. Do not edit the harness or any other repo file.
- Blind copies: for each of these [view, dense name, sparse name] triples ${J(VIEWS_OPEN.map((v, vi) => [v, ...BLIND_TOK(vi)]))}, copy ${CAPDIR}/shots/<view>-dense-day-dpr1.jpg to ${CAPDIR}/shots/blind/<view>-<dense name>.jpg and ${CAPDIR}/shots/<view>-sparse-day-dpr1.jpg to ${CAPDIR}/shots/blind/<view>-<sparse name>.jpg.
Do not summarise metrics.json; a separate reader extracts the measurements. Return only:
- metrics_path (absolute), shots_dir (absolute; ${CAPDIR}/shots), metrics_sha256 (sha256sum of metrics.json, '' when it was not written);
- shield_near_river_town = ${String(pre.shield_class || '').trim() ? `the number of features of class "${String(pre.shield_class).trim()}" drawn on view V1 (dense, filigree=1) within 48 atlas px of the river town ${J(pre.river_town || {})}: take it from the V1 dense labels in metrics.json when that class is listed there; otherwise open V1 exactly as the harness does (its views.json entry, filigree=1) in a throwaway Playwright script run from a temp dir and read ATLAS.filigree.count([x-48, y-48, x+48, y+48])["${String(pre.shield_class).trim()}"] (0 when absent); null only when it cannot be measured` : 'null (the bible names no shield class)'};
- infra_error = the setup failure (harness missing, non-zero exit, browser or CDN failure), '' when there is none. Map defects never set infra_error.
On an infra error fill every other key with '' (shield_near_river_town null).`),
  {label: 'capture', phase: 'Capture', schema: CAPT, ...M('audit')})
if (!capt) return died('capture')
const infra = e => done({pass: false, reason: 'infra', cycle: CYCLE, polish_note: 'infra: ' + e, owner_rulings_used: RUSED})
if (String(capt.infra_error ?? '').trim()) return infra(capt.infra_error)
const SHOTS = absP(String(capt.shots_dir || '').trim() || CAPDIR + '/shots').replace(/\/+$/, '')
const METRICS = absP(String(capt.metrics_path || '').trim() || CAPDIR + '/metrics.json')
const readerPrompt = `Mechanical read-back; judge nothing. Write the JavaScript between the BEGIN/END lines below, byte for byte, to rd.js in a fresh temp dir (mktemp -d; use your file-writing tool or a quoted heredoc so nothing expands). Then run, from ${REPO}: sha256sum '${METRICS}' and node <that dir>/rd.js < '${METRICS}'.
Return the single JSON object that node prints, every key and value exactly as printed (do not round, reorder, trim, translate or drop anything; empty arrays and nulls stay), plus sha256 = the hash sha256sum printed. If node fails, return sha256 and infra_error = its error message, with every other key empty.
BEGIN rd.js
${METRICS_JS}END rd.js`
let met = null, nSpent = 2   // capture (+retry)
for (let t = 0; t < 2 && !met; t++) {
  const r = await agent(P(readerPrompt), {label: 'metrics reader' + (t ? ' (retry)' : ''), phase: 'Capture', schema: MET, ...M('mech')})
  nSpent++
  if (!r) continue
  if (r.digest === metDigest(r)) met = r
  else log(`metrics reader: digest ${r.digest} does not match its own return (${metDigest(r)}): mistranscribed, ${t ? 'giving up' : 'retrying'}`)
}
if (!met) return died('metrics reader')
if (String(met.infra_error ?? '').trim()) return infra(met.infra_error)
if (/^[0-9a-f]{64}$/.test(String(capt.metrics_sha256 || '')) && met.sha256 !== capt.metrics_sha256) return infra(`metrics.json changed between capture (${capt.metrics_sha256}) and read-back (${met.sha256})`)
if (met.console_errors.length) gaps.push('console errors during capture: ' + met.console_errors.slice(0, 5).join(' | '))

// ---- Find + Verify (loop until dry) ----
const finderPrompt = (L, round) => `You are Filigree review finder ${L.id} — ${L.check}. ONE lens only; report defects only through it:
${L.lens}
Review only: edit no repo file. Cycle ${CYCLE}, round ${round}.
Read: the capture ${METRICS} (views, cells, tiles, stack, appear, loaf, phone, city, edges, fog) and the shots in ${SHOTS}/ (<view>-<mode>-<theme>-dpr<k>.jpg; dense = filigree=1, sparse = the same view with the toggle off); the sheet spec ${SPEC}; the density bible ${BIBLE}; the views ${OUTABS}/gates/views.json; ${L.reads}.
Code anchors (pattern -> path:line as re-derived this run; cite code by pattern, never by line number alone):
${anchorMap(pre.anchors)}
Rulings:
${rulingText(RUL, L.rulings)}
${PRIOR_IDS.length ? `Open punch items from cycle ${CYCLE - 1}: ${PRIOR_IDS.join(', ')} (details in ${OUTABS}/punch-list.json). A defect that is one of these, still unfixed, is reported with prior_id set to that id and fresh evidence that it is still there, never as a new finding.` : 'There is no prior review cycle; prior_id is always \'\'.'}
${round > 0 ? `Already seen: ${J((seenTitles[L.id] || []).slice())}; report only what is not in this list.\n` : ''}Every finding needs evidence {kind, ref} that another agent can re-run: shot = ${SHOT_REF}; metric = a JSON path into metrics.json (e.g. views.V2.dense.counts.peak); anchor = <file>:<literal pattern>; cmd = a shell command run from ${REPO} that shows the defect. A finding with an empty evidence.ref is discarded. location = {view, hex, file, pattern}; unused fields are ''.
severity_guess: ${SEV_RUBRIC}
Report at most ${FIND_CAP(round)} finding(s) this round, the most severe first; a later round asks again for what is left.
fix: the change to make (at the source or generator, never in generated JSON). unit_hint: the Job 3 unit id or the file the fix belongs in.
Write ${RVABS}/findings/${L.id}-c${CYCLE}-r${round}.json as {"date":"${DATE}","lens":"${L.id}","cycle":${CYCLE},"round":${round},"findings":[...]} (2-space indent), creating the directory, then return {lens:"${L.id}", findings}.`
const findingText = (f, blind) => J({lens: f.lens, title: f.title, severity_guess: blind ? undefined : f.severity_guess, location: f.location, evidence: f.evidence, fix: f.fix, prior_id: f.prior_id})
const reproducePrompt = f => `Reproduce ONE review finding independently. Write nothing; edit no repo file.
Finding: ${findingText(f)}
Re-run its evidence: cmd = run the command from ${REPO} (a command that would write into ${REPO}, such as a generator, runs instead in a temp copy: D=$(mktemp -d); tar -C ${REPO} --exclude=./.git -cf - . | tar -C $D -xf -; cwd $D); metric = read that path in ${METRICS}; shot = open the image (shots live in ${SHOTS}/) and inspect the region; anchor = find the pattern in the file. reproduced = true only when the defect as described is really there. Return {reproduced, note}.`
const refutePrompt = f => `Try to refute ONE review finding. Write nothing; edit no repo file.
Finding: ${findingText(f)}
Re-run its evidence first: cmd = run the command from ${REPO} (a command that would write into ${REPO}, such as a generator, runs instead in a temp copy: D=$(mktemp -d); tar -C ${REPO} --exclude=./.git -cf - . | tar -C $D -xf -; cwd $D); metric = read that JSON path in the capture ${METRICS}; shot = open the image (shots live in ${SHOTS}/; a ref is ${SHOT_REF}) and inspect the region; anchor = find the pattern in the file (paths relative to ${REPO}).
Default refuted:true when the evidence does not reproduce, or when the brief (${BRIEF}), the sheet spec (${SPEC}), the density bible (${BIBLE}) or a ruling below allows what it describes. refuted:false only when the defect is real and nothing allows it.
Rulings:
${rulingText(RUL, Object.keys(RULINGS))}
Return {refuted, why}.`
const severityPrompt = f => `Rate the severity of ONE review finding with this fixed rubric: ${SEV_RUBRIC}
The brief is ${BRIEF} (its done-when clauses); the sheet spec is ${SPEC}; the density bible is ${BIBLE}; the metrics are ${METRICS}; the hard rules are in ${REPO}/.claude/CLAUDE.md (read only).
Finding: ${findingText(f, true)}
Read the brief clause the finding touches before rating. Write nothing; edit no repo file. Return {severity}.`

const seen = new Set(), seenTitles = {}, lensCounts = {}, survivors = [], unverified = [], deadLens = new Set()
const sevRank = f => { const i = SEV.indexOf(f.severity_guess); return i < 0 ? SEV.length : i }
let lensesNow = cap(LENSES)
for (let round = 0; ; round++) {
  const tag = ' c' + CYCLE + ' r' + round
  phase('Find')
  const raw = await parallel(lensesNow.map(L => () => agent(P(finderPrompt(L, round)), {label: L.id + ' · find' + tag, phase: 'Find', schema: FIND, ...M(L.role)})))
  nSpent += raw.length
  const fk = kept(raw, 'finders r' + round); coverage.push(['finders r' + round, fk.ok, fk.k.length + '/' + raw.length])
  const byKey = new Map()
  let noEvidence = 0
  raw.forEach((res, i) => {
    const L = lensesNow[i], lc = lensCounts[L.id] || (lensCounts[L.id] = {found: 0, no_evidence: 0, capped: 0, fresh: 0, survived: 0, died: 0, unverified: 0})
    if (!res) { lc.died++; if (round === 0) deadLens.add(L.id); log(`agent died: ${L.id} finder r${round}` + (round === 0 ? ' (a missing lens, never "no findings")' : '')); return }
    const all = (res.findings || []).map((f, j) => [f, j]).sort((a, b) => sevRank(a[0]) - sevRank(b[0]) || a[1] - b[1]).map(x => x[0])
    const kept1 = all.slice(0, FIND_CAP(round))
    if (all.length > kept1.length) { lc.capped += all.length - kept1.length; log(`${L.id} r${round}: ${all.length - kept1.length} finding(s) past the per-lens cap of ${FIND_CAP(round)} dropped`) }
    for (const f of kept1) {
      lc.found++
      if (!f.evidence || !String(f.evidence.ref ?? '').trim()) { lc.no_evidence++; noEvidence++; continue }
      const g = {...f, lens: L.id, round, key: keyOf(L.id, f)}
      const prev = byKey.get(g.key)
      if (!prev || String(g.title).length > String(prev.title).length) byKey.set(g.key, g)
    }
  })
  if (noEvidence) log(`round ${round}: ${noEvidence} finding(s) rejected (empty evidence.ref)`)
  const fresh0 = [...byKey.values()].filter(f => !seen.has(f.key))
  for (const f of fresh0) { seen.add(f.key); (seenTitles[f.lens] = seenTitles[f.lens] || []).push(oneLine(f.title)); lensCounts[f.lens].fresh++ }
  if (!fresh0.length) { log(`round ${round}: no fresh findings (dry)`); break }
  const fits = Math.max(0, Math.floor((Math.min(BOUND - nSpent, Math.floor(budgetLeft() / AGENT_TOKENS)) - RESERVE) / 3))
  const fresh = fresh0.length <= fits ? fresh0 : fresh0.map((f, j) => [f, j]).sort((a, b) => sevRank(a[0]) - sevRank(b[0]) || LENS_IX(a[0].lens) - LENS_IX(b[0].lens) || a[1] - b[1]).slice(0, fits).map(x => x[0])
  const overBound = fresh.length < fresh0.length
  if (overBound) {
    const cut = fresh0.filter(f => !fresh.includes(f))
    for (const f of cut) { unverified.push({key: f.key, lens: f.lens, prior_id: pidOf(f), title: oneLine(f.title), why: 'bound'}); lensCounts[f.lens].unverified++ }
    log(`round ${round}: ${cut.length} of ${fresh0.length} fresh finding(s) left unverified: verifying them would cross the agent bound or the token budget (${nSpent} spent, ${RESERVE} reserved, bound ${BOUND})`)
    gaps.push(`round ${round}: ${cut.length} fresh finding(s) left unverified by the agent bound/budget (lenses ${[...new Set(cut.map(f => f.lens))].join(', ')})`)
  }

  phase('Verify')
  const trip = await pipeline(fresh, (f, _, i) => parallel([
    () => agent(P(reproducePrompt(f)), {label: `${f.lens} #${i + 1} · reproduce${tag}`, phase: 'Verify', schema: REPRO, ...M('audit')}),
    () => agent(P(refutePrompt(f)), {label: `${f.lens} #${i + 1} · refute${tag}`, phase: 'Verify', schema: REFUTE, ...M('judge')}),
    () => agent(P(severityPrompt(f)), {label: `${f.lens} #${i + 1} · severity${tag}`, phase: 'Verify', schema: SEVS, ...M('triage')})
  ]))
  nSpent += 3 * fresh.length
  let vAlive = 0
  const survLenses = new Set()
  fresh.forEach((f, i) => {
    const t = trip[i] || [null, null, null], rep = t[0] || null, ref = t[1] || null, sev = t[2] || null
    vAlive += [rep, ref, sev].filter(Boolean).length
    if (!rep || !ref) { unverified.push({key: f.key, lens: f.lens, prior_id: pidOf(f), title: oneLine(f.title), why: !rep ? 'reproduce died' : 'refute died'}); lensCounts[f.lens].unverified++; log(`unverified (${!rep ? 'reproduce' : 'refute'} died): ${f.lens} ${oneLine(f.title)}`); return }
    if (rep.reproduced !== true || ref.refuted !== false) return
    survivors.push({...f, severity: sev ? sev.severity : f.severity_guess, severity_from: sev ? 'verifier' : 'guess', reproduce_note: rep.note, refute_why: ref.why})
    lensCounts[f.lens].survived++
    survLenses.add(f.lens)
  })
  const vTotal = 3 * fresh.length
  coverage.push(['verifiers r' + round, vAlive >= Math.ceil(vTotal * 0.75), vAlive + '/' + vTotal])
  if (overBound) { log(`round ${round}: no extra round (the bound or budget was already reached)`); break }
  if (!survLenses.size) { log(`round ${round}: no lens produced a survivor`); break }
  if (round >= ROUNDS) { log(`find loop cap hit: ${ROUNDS} extra round(s) run and lenses ${[...survLenses].join(', ')} still produced survivors`); break }
  const next = lensesNow.filter(L => survLenses.has(L.id))
  const est = 4 * next.length
  if (nSpent + est + RESERVE > BOUND || budgetLow(est + RESERVE)) {
    log(`extra round ${round + 1} skipped: about ${est} more agents would cross the bound (${nSpent} spent, ${RESERVE} reserved, bound ${BOUND})`)
    gaps.push(`find loop stopped at round ${round} by the agent bound; lenses with survivors: ${next.map(L => L.id).join(', ')}`)
    break
  }
  lensesNow = next
  rounds++
}

// ---- Angry-sparse gate ----
phase('Angry-sparse gate')
const blindImg = (v, vi, mode) => `${SHOTS}/blind/${v}-${BLIND_TOK(vi)[mode === 'dense' ? 0 : 1]}.jpg`
const pairOf = (v, vi, ji) => denseFirst(vi, ji) ? [blindImg(v, vi, 'dense'), blindImg(v, vi, 'sparse')] : [blindImg(v, vi, 'sparse'), blindImg(v, vi, 'dense')]
const sparseBody = ([a, b]) => `Two sheets of the same ground at the same zoom: A=${a} and B=${b}. Open no other file. Which sheet would you rather navigate by ridge names with the town covered? List every named landform, height, homestead or path present on one sheet and missing on the other.
Return {prefers:"A"|"B", omissions:[{name (exactly as lettered), kind, missing_on:"A"|"B"}], files_read:[every file you opened, as absolute paths]}.`
const panels = await pipeline(VIEWS_OPEN, (v, _, vi) => parallel(JUD.map((Jd, ji) => () => agent(P(sparseBody(pairOf(v, vi, ji)), true),
  {label: `sparse judge ${v} ${Jd.id}`, phase: 'Angry-sparse gate', schema: SPARSE, ...M(Jd.role)}))))
const judgeRows = [], omissionsByView = {}, badReads = [], deadJudges = []
let judgesAlive = 0
VIEWS_OPEN.forEach((v, vi) => {
  const res = panels[vi] || JUD.map(() => null)
  const nd = new Set((met.names_dense[v] || []).map(norm)), ns = new Set((met.names_sparse[v] || []).map(norm))
  let qualified = 0
  const union = new Set()
  JUD.forEach((Jd, ji) => {
    const r = res[ji] || null, df = denseFirst(vi, ji), denseSide = df ? 'A' : 'B', sparseSide = df ? 'B' : 'A', imgs = pairOf(v, vi, ji)
    if (!r) {
      log(`agent died: ${v} ${Jd.id}`); deadJudges.push(`${v} ${Jd.id}`)
      judgeRows.push({view: v, judge: Jd.id, role: Jd.role, dense_first: df, died: true, prefers_dense: false, verified: [], bad_reads: []})
      return
    }
    judgesAlive++
    const verified = [...new Set(r.omissions.filter(o => o.missing_on === sparseSide).map(o => norm(o.name)).filter(n => n && nd.has(n) && !ns.has(n)))]
    const bad = blindBad(r.files_read, imgs)
    if (bad.length) badReads.push(...bad.map(p => `${v} ${Jd.id}: ${p}`))
    const prefersDense = r.prefers === denseSide
    if (prefersDense && verified.length >= 3) qualified++
    verified.forEach(n => union.add(n))
    judgeRows.push({view: v, judge: Jd.id, role: Jd.role, dense_first: df, died: false, prefers: r.prefers, prefers_dense: prefersDense,
      omissions_listed: r.omissions.length, verified, bad_reads: bad})
  })
  omissionsByView[v] = {angry: qualified >= 2, judges_qualified: qualified, verified: [...union].sort()}
})
coverage.push(['sparse judges', judgesAlive >= Math.ceil(nGate * 0.75), judgesAlive + '/' + nGate])
const nL0 = cap(LENSES).length
coverage.push(['lenses run in round 0 (every lens is a brief check; a dead finder is a missing lens)', deadLens.size === 0, (nL0 - deadLens.size) + '/' + nL0 + (deadLens.size ? ' dead: ' + [...deadLens].join(', ') : '')])

// ---- criteria (scored in code) ----
const isBM = f => f.severity === 'blocker' || f.severity === 'major'
const nBlock = survivors.filter(f => f.severity === 'blocker').length, nMajor = survivors.filter(f => f.severity === 'major').length
const sheetOf = v => ((pre.views.find(x => x.id === v) || {}).sheet || '')
const g43 = VIEWS_OPEN.map(v => {
  const sheet = sheetOf(v), want = pre.targets.per_view[sheet] || {}, vw = met.views[v] || null
  const counts = vw ? vw.dense.counts : {}
  const short = Object.entries(want).filter(([c, n]) => !((counts[c] || 0) >= n)).map(([c, n]) => `${c} ${counts[c] || 0}<${n}`)
  const dn = vw ? vw.dense.named : 0, sn = vw ? vw.sparse.named : 0
  const ok = !!vw && Object.keys(want).length > 0 && !short.length && dn > 0 && sn <= dn / 3
  return {view: v, sheet, ok, short, dense_named: dn, sparse_named: sn, targets: Object.keys(want).length ? 'ok' : 'no bible target for this sheet'}
})
const g44 = pre.hexes.map(h => {
  const ans = pre.hex_answers[h.id] || null, gc = ans ? ans.ground_class : '', g = pre.ground_classes[gc] || null
  const exempt = !!ans && (!!String(ans.exempt_rule || '').trim() || (!!g && !g.six.length && !!String(g.exempt_rule || '').trim()))
  if (exempt) return {hex: h.id, ground_class: gc, present: 6, exempt: true}
  const cell = (met.cells[h.id] || {}).dense || {}
  const six = g ? g.six : []
  return {hex: h.id, ground_class: gc, present: six.filter(c => (cell[c] || 0) > 0).length, of: six.length, exempt: false}
})
const VIEW_SHEET = {V1: 'country', V2: 'region', V3: 'valley', V4: 'region', V5: 'valley', V6: 'city'}   // fallback when views.json lacks a sheet
const g410 = (() => {
  const rules0 = pre.sheet_rules || {}, per = {}, bad = [], dense = v => ((met.views[v] || {}).dense || {}).counts || null
  for (const v of Object.keys(VIEW_SHEET)) {
    const sheet = sheetOf(v) || VIEW_SHEET[v], rules = rules0[sheet], n = dense(v)
    if (!rules || !n) { per[v] = {sheet, missing: !rules ? '/sheets/' + sheet : 'dense counts (view not captured)'}; bad.push(v); continue }
    const drawn = (rules.forbidden || []).filter(c => (n[c] || 0) > 0).map(c => c + '=' + n[c]), absent = (rules.must || []).filter(c => !((n[c] || 0) > 0))
    per[v] = {sheet, forbidden_drawn: drawn, must_absent: absent}
    if (drawn.length || absent.length) bad.push(v)
  }
  const v1 = dense('V1') || {}, sc = String(pre.shield_class || '').trim(), hc = pre.homestead_classes || []
  const homes = hc.filter(c => (v1[c] || 0) > 0).map(c => c + '=' + v1[c])
  const near = capt.shield_near_river_town
  const shield = {class: sc, on_v1: sc ? v1[sc] || 0 : null, near_river_town: typeof near === 'number' && isFinite(near) ? near : null, river_town: (pre.river_town || {}).name || ''}
  const ok = !bad.length && hc.length > 0 && !homes.length && !!sc && shield.on_v1 === 1 && shield.near_river_town === 1
  return {measured: {per_view: per, failing: bad, homestead_classes: hc, v1_homesteads_drawn: homes, v1_shield: shield}, ok}
})()
const n66 = g44.filter(x => x.present >= 6).length, nUnder4 = g44.filter(x => x.present < 4).length
const ofLens = id => f => f.lens === id || (!!pidOf(f) && lensOfPrior(pidOf(f)) === id)   // a re-reported prior item also counts for the lens that first raised it
const nF04 = survivors.filter(ofLens('F04')).length, f04Dead = deadLens.has('F04') || !cap(LENSES).some(L => L.id === 'F04')
const st = met.stack
criteria.push(
  C('G4.1', 'surviving blocker/major findings (reproduced, not refuted, severity-rated)', {blocker: nBlock, major: nMajor, unverified: unverified.length, dead_lenses: [...deadLens]}, '0', nBlock + nMajor === 0),
  C('G4.2', 'per open view V2-V5: blind judges preferring dense, each listing >=3 DOM-verified omissions', {per_view: Object.fromEntries(VIEWS_OPEN.map(v => [v, omissionsByView[v].judges_qualified])), died: deadJudges.map(x => 'agent died: ' + x)}, '>=2 of 3 judges on every view', VIEWS_OPEN.every(v => omissionsByView[v].angry)),
  C('G4.3', 'dense counts per class >= bible targets.per_view[sheet]; sparse named <= dense named / 3', g43, 'every open view', g43.every(x => x.ok)),
  C('G4.4', 'fixtures (dense): classes of the six present', {cells_6of6: n66, cells_under_4: nUnder4, cells: g44}, '>=10/12 cells 6/6, none <4', n66 >= 10 && nUnder4 === 0),
  C('G4.5', 'read-aloud (F04) surviving findings; the F04 finder must have run', {surviving: nF04, finder_dead: f04Dead}, '0 surviving, finder alive', nF04 === 0 && !f04Dead),
  C('G4.6', 'stack pull', {tiles_refetched: met.tiles_refetched, ...st}, 'tiles_refetched=0, node identity kept, no reload, hash round-trip, moveend keeps params',
    met.tiles_refetched === 0 && st.node_identity_kept === true && st.reload === false && st.roundtrip_equal === true && st.moveend_keeps_params === true),
  C('G4.7', 'appear effect', {appear_violations: met.appear_violations, below_minzoom_visible: met.below_minzoom_visible}, 'both 0', met.appear_violations === 0 && met.below_minzoom_visible === 0),
  C('G4.8', 'blind compliance of the sparse judges (allowlist: their two images)', {bad_reads: badReads}, '0 reads outside the two images', badReads.length === 0),
  C('G4.9', 'coverage: >=75% of every fan-out', coverage.map(([what, ok, frac]) => ({what, ok, frac})), '>=75% of every fan-out', coverage.every(x => x[1])),
  C('G4.10', 'sheet rules on V1-V6 (dense): no /sheets/<sheet>/forbidden class drawn, every /sheets/<sheet>/must class drawn; V1 (country): exactly one shield, at the river town, and zero homestead-class features', g410.measured,
    'every class in forbidden = 0 and every must class > 0 on V1, V2/V4 (region), V3/V5 (valley), V6 (city); V1: shield count 1, 1 within 48 atlas px of the river town, homestead classes 0', g410.ok)
)
const failing = criteria.filter(c => !c.pass).map(c => c.id)

// ---- Punch list ----
phase('Punch list')
const ranked = survivors.slice().sort((a, b) => SEV.indexOf(a.severity) - SEV.indexOf(b.severity) || LENS_IX(a.lens) - LENS_IX(b.lens) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
const items = ranked.map((f, i) => {
  const id = `P${CYCLE}-${pad2(i + 1)}`, dw = doneWhen(f), L = LENSES[LENS_IX(f.lens)]
  return {id, severity: f.severity, lens: f.lens, check: L ? L.check : f.lens, title: oneLine(f.title), location: f.location, evidence: f.evidence,
    fix: oneLine(f.fix), unit_hint: oneLine(f.unit_hint), prior_id: pidOf(f), prior_lens: pidOf(f) ? lensOfPrior(pidOf(f)) : '', done_when: dw,
    polish_md: `- [ ] **Filigree 4 punch c${CYCLE} · ${id} — ${oneLine(f.title)}** — ${oneLine(f.fix)}; unit hint: ${oneLine(f.unit_hint) || 'none'}; done when ${dw}`}
})
const minorItems = items.filter(x => !isBM(x))
const lensShaky = new Set([...deadLens, ...unverified.map(u => u.lens)])   // lenses that did not run, or ran with a finding left unverified
const stillOpen = id => survivors.some(f => pidOf(f) && norm(pidOf(f)) === norm(id))
const rechecked = id => {
  if (unverified.some(u => u.prior_id && norm(u.prior_id) === norm(id))) return false
  const own = lensOfPrior(id)
  return own ? !lensShaky.has(own) && cap(LENSES).some(L => L.id === own) : lensShaky.size === 0
}
const fixedSince = PRIOR_IDS.filter(id => !stillOpen(id) && rechecked(id))
const notRechecked = PRIOR_IDS.filter(id => !stillOpen(id) && !rechecked(id))
if (notRechecked.length) gaps.push(`prior punch ids not re-checked (their lens died or one of its findings went unverified): ${notRechecked.join(', ')}`)
const pl = await crit(P(`You are the punch-list integrator for Filigree review cycle ${CYCLE}. If ${OUTABS}/punch-list.json exists (the cycle ${CYCLE - 1} list), read it first${PREVIEW ? ' (read only: this is a preview run)' : ', BEFORE you overwrite it'}. Then write two files:
1. ${RVABS}/punch-list.json = {"date":"${DATE}","cycle":${CYCLE},"items":ITEMS} with ITEMS below verbatim: keep every item, field, id and the order; add or drop nothing (2-space indent).
2. ${RVABS}/punch-list.md, with these sections:
   ## Punch list: the items ranked, grouped first by brief check (in this order: ${LENSES.map(L => L.check).join('; ')}) and then by severity (blocker, major, minor, nit); each with id, severity, title, location, evidence, fix, unit hint and done when.
   ## Why the sparse map is worse: per view, the verified omissions below and which judges preferred the dense sheet (name the judges J0/J1/J2 only; never call a sheet A or B).
   ## Where we flinched: the items whose lens or prior_lens is F05 (say "none survived verification" when there are none).
   ## Fixed since cycle ${CYCLE - 1}: ${CYCLE > 1 ? 'the prior ids listed as fixed, with their titles from the previous punch-list.json; then, under "Not re-checked", the not-re-checked ids below with their titles (their lens died or a verifier died; never call them fixed)' : 'write "First review cycle."'}
   ## Gate: one row per criterion (id, measured, threshold, pass).
${VOCAB_RULE}
ITEMS = ${J(items)}
Gate criteria = ${J(criteria.map(c => ({id: c.id, desc: c.desc, measured: c.measured, threshold: c.threshold, pass: c.pass})))}
Omissions by view = ${J(omissionsByView)}
Judges = ${J(judgeRows.map(r => ({view: r.view, judge: r.judge, died: r.died, prefers_dense: r.prefers_dense, verified: r.verified})))}
Fixed since cycle ${CYCLE - 1} = ${J(fixedSince)}
Not re-checked = ${J(notRechecked)}
${READBACK} Report that path as json, its sha256 as sha_json and parsed; md = the md path and sha_md = sha256sum of the md file. Also return items = [{id, severity, polish_md}] as written.`),
  {label: 'punch integrator', phase: 'Punch list', schema: PUNCH, ...M('integ')})
if (!pl || !FILE_OK({sha256: pl.sha_json, parsed: pl.parsed})) return died('punch integrator')
const wrote = pl.items.map(x => x.id).join(','), wantIds = items.map(x => x.id).join(',')
if (wrote !== wantIds) { log('punch-list item ids differ from the computed list: wrote [' + wrote + '], computed [' + wantIds + ']'); gaps.push('punch-list.json item ids differ from the computed list') }

const shotItems = items.filter(x => x.evidence.kind === 'shot'), noImg = shotItems.filter(x => !shotPath(x.evidence.ref)).map(x => x.id)
if (noImg.length) { log('shot evidence naming no image: ' + noImg.join(', ')); gaps.push(`shot-evidence punch items whose ref names no image (nothing copied to cited/): ${noImg.join(', ')}`) }
const citedSrc = [...new Set(shotItems.map(x => shotPath(x.evidence.ref)).filter(Boolean))]
const pr = await agent(P(`Housekeeping, mechanical. Write nothing except what is named here.
1. Create ${CAPDIR}/cited/ and copy into it ONLY these images (flat, keep each basename; skip a path that does not exist): ${J(citedSrc)}. Remove any other file already in ${CAPDIR}/cited/.
2. ${PREVIEW ? 'Remove nothing else (this is a preview run; older cycles keep their shots/).' : `Remove the shots/ directory of every OLDER review cycle (${OUTABS}/review-c<j>/shots/ for j < ${CYCLE}). Never remove ${SHOTS}, any metrics.json or any cited/ directory.`}
3. count_ok = the number of files now in ${CAPDIR}/cited/ equals the number of listed images that exist (${citedSrc.length} listed).
Return {cited:[absolute paths now in ${CAPDIR}/cited/], removed:[directories removed], count_ok}.`),
  {label: 'shot pruner', phase: 'Punch list', schema: PRUNE, ...M('mech')})
if (!pr) { log('agent died: shot pruner'); gaps.push('shot pruner died: cited/ not built, older shots/ not pruned') }
else if (!pr.count_ok || pr.cited.length !== citedSrc.length) { log(`shot pruner: count check failed (${pr.cited.length} cited of ${citedSrc.length} listed)`); gaps.push(`shot pruner count check: ${pr.cited.length}/${citedSrc.length} cited images`) }

// ---- Record ----
phase('Record')
if (unverified.length) gaps.push(`${unverified.length} finding(s) unverified (a reproduce or refute verifier died, or the agent bound/budget was reached)`)
const gate = gateObj({criteria, rounds, rulings_used: RUSED, gaps, cycle: CYCLE, preview: PREVIEW,
  artifacts: [{path: RVREL + '/punch-list.md', sha256: pl.sha_md}, {path: RVREL + '/punch-list.json', sha256: pl.sha_json}, {path: `${RVREL}/review-c${CYCLE}/metrics.json`, sha256: met.sha256}],
  omissions_by_view: omissionsByView, judges: judgeRows, punch_ids: [...items.map(x => x.id), ...notRechecked], fixed_since: fixedSince, not_rechecked: notRechecked, dead_lenses: [...deadLens]})
if (PREVIEW) gate.pass = false
const gatePath = `${RVREL}/gates/4-review-c${CYCLE}.json`
const recs = await parallel([
  () => record(`${PVREL}gates/4-review-c${CYCLE}.json`, gate),
  () => record(PVREL + 'state/4-review.json', {date: DATE, cycle: CYCLE, seen_keys: [...seen], lens_counts: lensCounts})
])
const pass = gate.pass && !PREVIEW
const nAngry = VIEWS_OPEN.filter(v => omissionsByView[v].angry).length
const nOmissions = VIEWS_OPEN.reduce((t, v) => t + omissionsByView[v].verified.length, 0)
const inserts = items.filter(isBM).map(x => x.polish_md)
if (minorItems.length) {
  const ids = minorItems.map(x => x.id).join(', ')
  inserts.push(`- [ ] **Filigree 4 punch c${CYCLE} · ${minorItems.length} minor/nit items (${ids})** — fix each as listed in ${RVREL}/punch-list.md; done when each listed item's evidence check no longer reproduces (the next review cycle reports none of these ids by prior_id)`)
}
const summary = {
  rounds, cycle: CYCLE, preview: PREVIEW,
  outputs: [RVREL + '/punch-list.md', RVREL + '/punch-list.json', RVREL + '/findings/', `${RVREL}/review-c${CYCLE}/`, gatePath],
  gate_path: gatePath, owner_rulings_used: RUSED,
  polish_note: pass
    ? `review c${CYCLE}: sparse loses on ${nAngry}/${VIEWS_OPEN.length} views (${nOmissions} verified omissions), 0 blocker/major — owner may now flip the table map on (R18)`
    : `review c${CYCLE}: ${nBlock} blocker, ${nMajor} major; ${nAngry}/${VIEWS_OPEN.length} views angry — punch items queued above`,
  polish_inserts: inserts, polish_inserts_above: 'Filigree 4',
  changelog_line: '- docs: Filigree 4 — review cycle ' + CYCLE + ' (' + (pass ? 'pass' : 'punch list') + ')',
  gate
}
if (recs.some(x => !x)) return done({...summary, pass: false, reason: 'record-mismatch',
  polish_note: `review c${CYCLE}: record-mismatch — write gate to ${gatePath} from this return by hand (§12); not a pass, box stays unchecked; ${nBlock} blocker, ${nMajor} major`,
  changelog_line: '- docs: Filigree 4 — review cycle ' + CYCLE + ' (record-mismatch; punch list)'})
return done({...summary, pass, reason: pass ? '' : PREVIEW ? 'preview' : FORCE ? 'forced: ' + FORCE : (failing.length ? failing.join(', ') : MODE)})
