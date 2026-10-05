export const meta = {
  name: 'filigree-2-plan',
  description: 'Filigree Job 2: turn the density bible into a sheet spec with build units; gate = cold-cartographer test',
  whenToUse: 'Run as the POLISH item "Filigree 2 · Planning → sheet spec" after gates/1-research.json passed: Workflow({name:"filigree-2-plan", args:{date:"YYYY-MM-DD"}}). Docs-only.',
  phases: [
    {title: 'Preflight', detail: 'bible gate passed + bible unchanged; re-anchor; ledger; rulings'},
    {title: 'Probes', detail: 'freeze 30-40 closed-form probes BEFORE the spec exists'},
    {title: 'Pick', detail: 'challenger vs the R8 default ground; 3 pickers + 2 judges only if refuted'},
    {title: 'Sections', detail: 'one writer per spec section -> anchor check -> fixer'},
    {title: 'Integrate', detail: 'opus/xhigh integrator -> sheet-spec.md/.json; base crops; red-team + patch'},
    {title: 'Units', detail: 'unit planner -> units[] in slices A-D; DAG + traceability in code'},
    {title: 'Check', detail: 'anchor, leak and canon checks; fixer; spec reader resolves probe pointers'},
    {title: 'Cold-cartographer gate', detail: 'paired blind drafters -> SVG extractors -> scoring in code; guess auditor; divergence judge'},
    {title: 'Fix', detail: 'spec fixer on both-wrong probes, silent pointers, gaps, divergences (<= maxRounds)'},
    {title: 'Record', detail: 'gates/2-plan.json, gates/views.json, state/2-plan.json'}
  ]
}
const JOB = 'filigree-2-plan'
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

checkArgs(['ground'])
const GROUND_KEYS = ['coast', 'river_town', 'city']
const GROUND = A.ground == null ? null : A.ground
if (GROUND !== null) {
  if (typeof GROUND !== 'object' || Array.isArray(GROUND)) die('args.ground must be {coast, river_town, city}')
  for (const k of Object.keys(GROUND)) if (!GROUND_KEYS.includes(k)) die('args.ground has unknown key ' + k)
  for (const k of GROUND_KEYS) if (typeof GROUND[k] !== 'string' || !GROUND[k].trim()) die('args.ground.' + k + ' must be a non-empty string')
}

// ---- constants (design: workflow-2-plan.md § Constants) ----
const SPEC_ROOTS = ['/picks', '/sheets', '/paint_order', '/sheet_one', '/label_ranks', '/appear', '/spacing', '/city_rule', '/overlays', '/hash', '/toggle',
  '/notices', '/palette', '/paint', '/relief', '/rivers', '/names', '/plates', '/perf', '/prerequisites', '/fixtures', '/hook', '/capture', '/checks',
  '/generators', '/rules', '/units', '/slices', '/slice_classes']
const UNIT_ROOTS = ['/units', '/slices', '/slice_classes']   // appended by the unit planner, not the integrator
const PAINT_ORDER_IDS = ['relief', 'contours', 'water', 'rust_road', 'reserves', 'homesteads', 'names_heights', 'city_grain', 'fog']
const SHEET_ONE_FORBIDDEN = ['homesteads']   // brief p8: homesteads wait for the valley sheet; PAINT_ORDER_IDS is the all-sheet order, sheet one (region) never paints them
const isHomestead = c => /homestead/.test(norm(String(c).replace(/^layer-/, '')))   // Job 1 names every homestead class by id or label
const OVERLAY_IDS = ['old_survey', 'structures', 'caravan_halts', 'blazed_paths', 'muster_days', 'shut_ways']
const OVERLAY_NOTE = 'Player-facing labels: the old survey, raised halls and steadings, caravan halts, blazed paths, muster days, shut ways (muster_days = levy muster-days, Tamar\'s dark hour, dragon flights). old_survey sits UNDER the live sheet; muster_days and shut_ways sit on top and are swappable.'
const SHEET_ONE_BBOX = [1216, 1376, 1760, 1664]
const WINDOW = [1060, 1240, 1860, 2040]
const SLICES = ['A', 'B', 'C', 'D']
const VIEWS_SEED = [
  {id: 'V1', sheet: 'country', x: 1488, y: 1520, mask: '', note: 'sheet-one centre'},
  {id: 'V2', sheet: 'region', x: 1448.6, y: 1527.5, mask: 'Aldorūs', note: 'Aldorūs'},
  {id: 'V3', sheet: 'valley', x: 1448.6, y: 1527.5, mask: 'Aldorūs', note: 'Aldorūs'},
  {id: 'V4', sheet: 'region', x: 1477.7, y: 1444.2, mask: 'Sokundo', note: 'Sokundo, C1 coast'},
  {id: 'V5', sheet: 'valley', x: 1392, y: 1584, mask: '', note: 'F02 plateau'},
  {id: 'V6', sheet: 'city', x: 1236.1, y: 1415, mask: '', note: 'Epēshu'},
  {id: 'V7', sheet: 'region', x: 1448.6, y: 1527.5, mask: '', note: 'one-question plate', plate: 'Where can we go this week?'}
]
const MASK_RULE = 'Settlement disc: radius max(96, 1.5 × footprint) atlas px. Every other anchor/marker in view: a disc of r = 48 atlas px, so the print\'s hand-lettered town names are covered as well.'
const HASH_RULE = 'Views are written #view=x,y,z&filigree=1&…. Today the moveend writer (anchor !/^#view=/.test(location.hash)) rewrites the hash to #view=x,y,z and drops trailing params. U00 must make it keep them.'
const CAPTURE_CONTRACT = `node tools/filigree-capture.js --views <views.json> [--only V2,V3] [--modes dense,sparse] [--themes day,night]
  [--dpr 1,2] [--mask auto|none] [--mask-scale 1|1.5] [--cells <hexes.json>]
  [--metrics labels,counts,tiles,stack,appear,loaf,phone,net,city,edges,fog] [--viewport 1280x800]
  [--phone 390x664@3] [--throttle none|slow4g] [--cpu 1|4]
  [--port 8544] [--cdn-dir <dir>] --out <dir>
  -> <out>/<view>-<mode>-<theme>-dpr<k>.jpg (<=300 KB each) and <out>/metrics.json:
  {viewport:{w,h,dpr}, phone_viewport:{w,h,dpr}, views:{<V>:{<mode>:{labels:[{text,class,rank,x,y,opacity}], counts:{<class>:n}, heights:n, visible_landform_labels_outside_mask:[name]}}},
   cells:{<F>:{<mode>:{<class>:n}}},
   tiles:{<toggle>:{base_requests:n}},
   stack:{node_identity_kept:bool, reload:bool, roundtrip_equal:bool, moveend_keeps_params:bool},
   appear:{steps:n, violations:[{class, z_from, z_to, op_from, op_to}], below_minzoom_visible:[class]},
   loaf:{p95_ms, max_ms, frames}, phone:{min_label_gap_px, overlaps, hscroll:bool, min_name_px, min_italic_px, wrong_taps, chrome_cover, dom_nodes},
   city:{pins_at_rest, controls_at_rest, block_labels, street_names_below, street_names_above, label_count},
   edges:{<V>:{band_mean, interior_mean}}, fog:{opacity, same_day_equal:bool, diff_day_differs:bool},
   net:{views:{<V>:{<mode>:{bytes, requests}}}, max_asset_bytes, max_asset_path, toggle_off_requests},
   panes_when_off:[name], filigree_counts_when_off:{<class>:n},
   console_errors:[string], infra_error:null|string}
Behaviour:
- Starts \`node server.js\` if the port is free.
- Routes **/leaflet@1.9.4/dist/* and **/three.js/r128/three.min.js to the extracted \`npm pack leaflet@1.9.4
  three@0.128.0\` files in --cdn-dir.
- Uses Chromium at /opt/pw-browsers (Playwright from NODE_PATH=/opt/node22/lib/node_modules).
- Never runs \`playwright install\`.
- Waits for window.ATLAS.ready + document.fonts.ready + network idle + 400 ms after zoomend.
- Counts are taken ONLY through ATLAS.filigree (visible = pane opacity > 0.5 AND intersects the viewport).
- Phone metrics come from a second page at --phone (default 390x664, deviceScaleFactor 3, isMobile, hasTouch), never from the --viewport page; visible = intersects that page's recorded viewport. min_name_px = the smallest computed font-size in CSS px among upright (non-italic) filigree names visible in that page's viewport (null when none); min_italic_px = the same among italic filigree names (null when none), because the coarse-pointer floor is 12 px upright and 11 px italic (R2, FM3). chrome_cover = the fraction of that viewport's area covered by the union of visible fixed or absolute non-map chrome rects. dom_nodes = document.querySelectorAll('*').length after settle. wrong_taps = taps at each interactive filigree glyph centre in the --cells fixture cells that open a card other than that glyph's (a chooser that lists it counts as right); it is a number whenever --cells is passed and null only without --cells.
- net counts the app's OWN assets only: transferred bytes (CDP Network.loadingFinished encodedDataLength) of responses from the server origin, per view and mode from a cold cache. Requests fulfilled by the CDN routes from --cdn-dir (leaflet, three.js) report no real encodedDataLength, so they are excluded from net and ignored by max_asset_path. max_asset_bytes and max_asset_path = the largest single app-origin response in the first view. toggle_off_requests = the number of requests, from a page loaded without filigree=1, to any URL that a page loaded with filigree=1 additionally requests (set difference of the two loads' request URLs). --throttle slow4g = 1.6 Mbps / 150 ms RTT and --cpu k = CDP CPU throttling are recorded, never gated on time.
- Every browser context is created with serviceWorkers:'block' (a context option).
- Any setup failure sets infra_error and exits 2. Map defects never set infra_error.`
const HOOK_CONTRACT = `ATLAS.filigree = {on, classes, version, count(bbox)->{class:n}, names(bbox)->[{text,class,rank,x,y}], sparse(bool)}
- bbox is [x0,y0,x1,y1] in atlas px.
- count and names see only features whose pane opacity is > 0.5 and that intersect the viewport.
- sparse(true) equals the toggle off.
- All filigree code lives in one block /* FILIGREE */ … /* /FILIGREE */ in maps-site/index.html.`
const LEAK = /plate (one|two|three)|plate [123]|Azlen|Collison|Bay Atlas|geo\.admin|swisstopo|Sonoma|Guerneville|Applegate|Handmer|Andersson/i
const BRIEF = REPO + '/docs/research/filigree-for-the-table.pdf'
const DOSSIER = DOCS + '/research-dossier.md'
const REUSE = DOCS + '/README.md § "7. Reuse map"'
const BIBLE = `${OUTABS}/density-bible.md and ${OUTABS}/density-bible.json`
const SPEC_MD = OUTABS + '/sheet-spec.md', SPEC_JSON = OUTABS + '/sheet-spec.json'
const JOB3_REQ_CHECKS = {A: ['A.rivers_overlap', 'A.imhof_F01', 'A.coast_edge_V4'], B: ['B.one_shield', 'B.names_for_owner', 'B.gazetteer_prov']}   // mirrors REQ_CHECKS in filigree-3-build.js; Job 3 refuses a slice whose /checks lacks one
const SECTIONS = [
  {sid: 's01', role: 'deep', title: 'Sheets and zoom bands → Leaflet mapping', owns: ['/sheets/*/band', '/sheet_one'], rulings: ['R1', 'R6', 'R7', 'R8', 'R18', 'R22'],
    brief: `Map the four sheets (country, region, valley, city) to zoom bands against the atlas constants TIER_CEIL, Z_TIER_D, Z_STREET (anchors var TIER_CEIL=, var Z_STREET=), the reveal tiers A–D, the baseOpacity/overlayOpacity ramps (function worldOpacityUpdate), overzoom honesty, sheet one = the region band over C1 (R8, bbox ${SHEET_ONE_BBOX}), and the DM sheet lock sheet=<band>&at=<place>. /sheet_one = {sheet:'region', bbox, layers:[paint-order ids painted on sheet one, in paint order], must_label:[names that must be lettered on sheet one]}.`},
  {sid: 's02', role: 'judge', title: 'Label ranks, collision pass, threshold + appear effect, spacing', owns: ['/label_ranks', '/appear', '/spacing', '/sheets/*/must', '/sheets/*/forbidden'], rulings: ['R1', 'R2', 'R5', 'R6', 'R19', 'R20'],
    brief: 'Label ranks per sheet; the collision pass (our own weighted greedy, ~50 lines; labelgun is archived); the threshold + appear effect (R1, R2, R6); minimum label spacing at 390 px width ("cramped"); selective label masking (halo/knockout); collisions with the print\'s own lettering. /sheets/<sheet>/must = [{class, rule}] and /sheets/<sheet>/forbidden = [classId], from the bible\'s sheets and classes.'},
  {sid: 's03', role: 'judge', title: 'The city rule', owns: ['/city_rule'], rulings: ['R4', 'R7', 'R13'],
    brief: 'The city rule (R4, R7, R13): texture over type, fog as weather (seeded), no block labels, street names on a threshold, pins at rest = 0, and a label cap.'},
  {sid: 's04', role: 'judge', title: 'Overlay stack, swap and hash', owns: ['/overlays', '/hash', '/toggle', '/notices'], rulings: ['R10', 'R12', 'R14', 'R18'],
    brief: `Overlay stack + swap + hash (R12, R14, R18). Overlay ids in order: ${OVERLAY_IDS.join(', ')}. ${OVERLAY_NOTE} The old survey is an era tile layer under the live base (opacity/swipe). Notices sit on top (player-facing label "the herald's tidings"; "notices" stays the file/param/schema name). Cover the layers=id@k=v,visible,opacity;… grammar, the default-off filigree=1 toggle + layers-panel row, hash composition through the #view= writer (${HASH_RULE}), and the notices schema {id,kind,voice,start_ab,end_ab,geom} + loading.`},
  {sid: 's05', role: 'audit', title: 'Palette', owns: ['/palette'], rulings: ['R3'],
    brief: 'Palette (R3): line-work tokens (bone paper = the print, rust road, ocher arterials, rose-brown blocks, contour hair, wet-blue water line) as hex + night variants; WCAG contrast for labels. /palette/<token> = {day:"#rrggbb", night:"#rrggbb", use}. The print-sampled wash fills live under /paint/wash_hex (s11).'},
  {sid: 's06', role: 'deep', title: 'Relief, contours, heights, rivers', owns: ['/relief', '/rivers'], rulings: ['R20', 'R22'],
    brief: `Relief/contours/heights/hachures from EPESHU_HF (anchor const EPESHU_HF_URI) via the tools/filigree-dem.js decode: Imhof light from the upper left (azimuth 315°, altitude 45°, cool valley shadow), contour interval 5 m, index every 25 m, prominence >= 15 m, the no-DEM rule (R22, window ${WINDOW}), heights per R20, an imhof_check_cmd. Also rivers.json: the source rule + a print-overlap check (>= 90% of samples within 3 px of dark ink).`},
  {sid: 's07', role: 'audit', title: 'Names', owns: ['/names'], rulings: ['R9', 'R10'],
    brief: 'Names (R9): mint key, tools/mint-names.js, the veto list, prov:"invented", sayability (the NAME repeat rule, anchor NAME.used.has(n); seam rules), names-for-owner.md, gazetteer regeneration via tools/build-gazetteer.js (never hand-edited).'},
  {sid: 's08', role: 'audit', title: 'Readers vs navigators: one-question plates', owns: ['/plates'], rulings: ['R10', 'R18'],
    brief: 'One-question plates as THEMES entries (anchor var THEMES=; DEFAULT_ON): "Where can we go this week?" extends roads; "What is around us?" = the valley sheet at the party\'s place; search and #place stay filigree-free.'},
  {sid: 's09', role: 'audit', title: 'Performance budget', owns: ['/perf'], rulings: ['R6'],
    brief: `Performance budget from ${REPO}/docs/research/web-performance.md: LoAF p95 cap, labels-per-view cap, per-zoom-frame work.`},
  {sid: 's10', role: 'audit', title: 'Data prerequisites and data truth', owns: ['/prerequisites'], rulings: ['R11', 'R21'],
    brief: `Data prerequisites + data truth (R11, R21): which slices need the roads / census / rivers; Drāmūz, Hordon and the Aldorūs contradiction queued as data items. /prerequisites = [{item, blocks:"F3-A".."F3-D", status, polish_title}] (polish_title = the exact ${REPO}/POLISH.md title when it is already queued, else "").`},
  {sid: 's11', role: 'deep', title: 'Paint on the base', owns: ['/paint'], rulings: ['R3'],
    brief: 'A pooled-edge contrast pass on the land/water mask (reuse function washMake / function sampleCityMask) for coast, parks and reserves (method, band px, luminance delta); washes print-sampled, each wash fill (water, reserves, fog, city tone, relief shading) given as explicit sampled hex at /paint/wash_hex/<name> (a #rrggbb string; drafters may use these for fills); the real-colour check (ΔE <= 10 vs the print hue / biome).'},
  {sid: 's12', role: 'audit', title: 'Fixtures and test contracts', owns: ['/fixtures', '/hook', '/capture', '/checks', '/generators'], rulings: ['R8', 'R17', 'R18', 'R19'],
    brief: `Fixtures + test contracts. /fixtures/views from these seeds (zoom = midpoint of the named sheet's band): ${JSON.stringify(VIEWS_SEED)}; masks: ${MASK_RULE} /hook = this contract VERBATIM plus pre_filigree_panes (the pane names present today, read from the pane-creation code in maps-site/index.html):\n${HOOK_CONTRACT}\n/capture = this contract VERBATIM:\n${CAPTURE_CONTRACT}\nPer-slice /checks as {id, cmd, expect} (a command printing JSON plus a condition on it, such as overlap >= 0.9); every slice's /checks also holds a check with id "phone" that runs the capture (node tools/filigree-capture.js, --metrics including phone) with --phone 390x664@3 and --cells <hexes.json> on that slice's gate views and expects phone.overlaps = 0, phone.hscroll false, phone.min_name_px null or >= 12, phone.min_italic_px null or >= 11 (upright names 12 px, italic names 11 px: R2, FM3) and phone.wrong_taps = 0 as a number (FM3, FM4); Job 3 also requires these exact check ids (case-sensitive, no extra spaces), each a real {id, cmd, expect} check for what its id names: ${Object.entries(JOB3_REQ_CHECKS).map(([k, ids]) => '/checks/' + k + ' must hold ids ' + ids.join(', ')).join('; ')}; /generators = every tools/filigree-*.js, mint-names and build-gazetteer command.`}
]
const RUBRIC = ['canon_fit', 'dem_window', 'data_ready', 'shield_even', 'table_play']
const DEFAULT_GROUND = {coast: 'C1 (Pēshunor north coast, Epēshu-Sokundo-Kanae-Rhup-Tamaron)', river_town: 'Aldorūs', city: 'Epēshu'}
const coldDir = (X, tag) => `${OUTABS}/cold/${X}${String(tag || '').trim() ? '-' + String(tag).trim() : ''}`   // round-tagged (cold/A, cold/A-r1, …) so no drafter finds an earlier round's draft
const DRAFTER_ALLOWED = (X, tag) => [OUTABS + '/sheet-spec.md', OUTABS + '/sheet-spec.json', OUTABS + '/spec/assets/', coldDir(X, tag) + '/']

// ---- schemas (design § Agents and schemas) ----
const S = {type: 'string'}, SA = {type: 'array', items: {type: 'string'}}, B = {type: 'boolean'}, N = {type: 'number'}, I = {type: 'integer'}
const obj = (properties, required) => ({type: 'object', properties, required: required || Object.keys(properties)})
const RULE3 = obj({id: S, from: SA, buildable: B})
const PROBE = obj({id: S, q: S, kind: {type: 'string', enum: ['enum', 'number', 'name', 'hex', 'order', 'bool']}, source: {type: 'string', enum: ['bible', 'brief', 'ruling', 'spec']},
  expected: {type: ['string', 'number', 'boolean', 'array']}, cite: S, pointer: S, tolerance: N, options: SA}, ['id', 'q', 'kind', 'source'])
const PRE = obj({bible_gate_pass: B, bible_sha_ok: B, bible_sha256: S, spec_exists: B,
  rule_kinds: {type: 'object', additionalProperties: S},
  targets: {type: 'object', additionalProperties: {type: 'object', additionalProperties: {type: 'object', additionalProperties: N}}},
  must_ids: SA, rule_ids: SA, class_ids: SA, ground_six: SA,
  forbidden_by_sheet: {type: 'object', additionalProperties: SA},
  anchors: {type: 'object', additionalProperties: {type: ['string', 'null']}},
  rulings_overrides: {type: 'object', additionalProperties: S},
  sections_ok: {type: 'array', items: obj({sid: S, path: S, sha256: S, rules: {type: 'array', items: RULE3}, fragment: {type: 'object', additionalProperties: {type: ['string', 'number', 'boolean', 'array', 'object', 'null']}}, anchors: {type: 'array', items: obj({path: S, pattern: S})}, open: SA}, ['sid', 'path', 'rules'])},
  ledger_ctx: obj({bible_sha256: S, picks: obj({coast: S, river_town: S, city: S}), rulings_used: {type: 'object', additionalProperties: S}}, []),
  probes_ok: B, probes_sha256: S, probes: {type: 'array', items: PROBE}, probes_stamp: obj({bible_sha256: S, rulings: {type: 'object', additionalProperties: S}}, []),
  probe_summary: {type: 'array', items: obj({id: S, ok: B})}},
  // required = the design's list exactly; bible_sha256 / ground_six / probes / probes_sha256 / sections_ok[].sha256 are optional extras that Record, G2.1 and the resume path read when present
  ['bible_gate_pass', 'bible_sha_ok', 'spec_exists', 'rule_kinds', 'targets', 'must_ids', 'rule_ids', 'class_ids', 'forbidden_by_sheet', 'anchors', 'rulings_overrides', 'sections_ok', 'probes_ok', 'probe_summary'])
const PROBES = obj({path: S, sha256: S, parsed: B, probes: {type: 'array', items: PROBE}})
const GROUND3 = obj({coast: S, river_town: S, city: S})
const CHAL = obj({refuted: B, reasons: SA, alt: GROUND3})
const PICK = obj({coast: S, river_town: S, city: S, why: S})
const JUDGE = obj({scores: {type: 'array', items: obj({candidate: S, canon_fit: I, dem_window: I, data_ready: I, shield_even: I, table_play: I})}})
const WRITE = obj({sid: S, path: S, sha256: S,
  rules: {type: 'array', items: obj({id: S, text: S, from: SA, buildable: B})},
  fragment: {type: 'object', additionalProperties: {type: ['string', 'number', 'boolean', 'array', 'object', 'null']}},
  anchors: {type: 'array', items: obj({path: S, pattern: S})}, open: SA})
const ANCH = obj({bad: SA})
const INTEG = obj({md: S, json: S, sha_md: S, sha_json: S, rules: {type: 'array', items: RULE3}, roots_present: SA})
const CROP = obj({jpg: S, json: S, sha256: S, parsed: B})
const RED = obj({contradictions: {type: 'array', items: obj({a: S, b: S, fix: S})}})
const UNIT_KINDS = ['logic', 'tool', 'data', 'css', 'copy'], ACC_KINDS = ['node', 'grep', 'json', 'capture']
const unitItem = strict => obj({
  id: S, title: S, slice: strict ? {type: 'string', enum: SLICES} : S,
  kind: strict ? {type: 'string', enum: UNIT_KINDS} : S, files: SA,
  paint_order: I, depends_on: SA,
  requires: strict ? {type: 'array', items: {type: 'string', enum: ['roads', 'census', 'rivers']}} : SA,
  covers: SA, model: strict ? {type: 'string', enum: ['opus', 'sonnet', 'haiku']} : S, effort: strict ? {type: 'string', enum: ['low', 'medium', 'high', 'xhigh', 'max']} : S,
  acceptance: {type: 'array', items: obj({kind: strict ? {type: 'string', enum: ACC_KINDS} : S, cmd: S, expect: S})}},
  ['id', 'title', 'slice', 'kind', 'files', 'paint_order', 'depends_on', 'requires', 'covers', 'acceptance'])
const UNITS = obj({units: {type: 'array', items: unitItem(true)},
  slices: {type: 'object', additionalProperties: SA}, slice_classes: {type: 'object', additionalProperties: SA}})
const HITS = obj({hits: SA})
const VIOL = obj({violations: SA})
const READER = obj({probe_values: {type: 'array', items: obj({id: S, value: {type: ['string', 'number', 'boolean', 'array', 'null']}})},
  sheet_one_layers: SA, paint_order: SA, must_classes: SA, forbidden_classes: SA, palette_hex: SA,
  river_town: obj({name: S, x: N, y: N}), must_label: SA,
  views: {type: 'array', items: obj({id: S, sheet: S, x: N, y: N, zoom: N, mask: S})}, bands: {type: 'object', additionalProperties: {type: 'array', items: N}},
  rule_ids: SA, sha_md: S, sha_json: S, prereq_unqueued: SA,
  rules: {type: 'array', items: RULE3}, units: {type: 'array', items: unitItem(false)},
  slices: {type: 'object', additionalProperties: SA}, slice_classes: {type: 'object', additionalProperties: SA},
  checks: {type: 'object', additionalProperties: {type: 'array', items: obj({id: S, cmd: S, expect: S})}}},
  // required = the design's list + the file-side rules/units/slices/slice_classes/checks G2.1 checks (never the planner's or fixers' returns) + the bands G2.13 checks; sha_md / sha_json / prereq_unqueued are optional extras for Record and polish_inserts
  ['probe_values', 'sheet_one_layers', 'paint_order', 'must_classes', 'forbidden_classes', 'palette_hex', 'river_town', 'must_label', 'views', 'bands', 'rule_ids', 'rules', 'units', 'slices', 'slice_classes', 'checks'])
const DRAFT = obj({svg: S, answers: {type: 'array', items: obj({id: S, value: {type: ['string', 'number', 'boolean', 'array']}, rule: S})},
  guesses: {type: 'array', items: obj({what: S, needed_for: S, spec_ref: S})}, files_read: SA})
const SVGX = obj({layers: SA, colors: SA, labels: {type: 'array', items: obj({text: S, class: S, rank: S, x: N, y: N})}, shields: {type: 'array', items: obj({x: N, y: N})}})
const RASTER = obj({pngs: SA, infra_error: S})
const SIZES = obj({sizes: {type: 'array', items: obj({path: S, bytes: N})}})
const AUDIT = obj({verdicts: {type: 'array', items: obj({drafter: {type: 'string', enum: ['A', 'B']}, n: I, guess: S, class: {type: 'string', enum: ['answered', 'gap']}, quote: S, pointer: S})}})
const HASHES = obj({hashes: {type: 'array', items: obj({path: S, sha256: S})}})
const DIVERGE = obj({blocking: {type: 'array', items: obj({spec_rule: S, pointer: S, a: S, b: S})}, minor: SA})

// ---- helpers ----
const underRoots = p => typeof p === 'string' && SPEC_ROOTS.some(r => p === r || p.startsWith(r + '/'))
const lc = s => String(s ?? '').trim().toLowerCase()
const asList = v => Array.isArray(v) ? v : String(v ?? '').split(/\s*(?:,|>|→)\s*/).filter(Boolean)
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i])
const percent = (a, b) => b ? Math.round(1000 * a / b) / 10 : 0
const clamp5 = v => Math.max(1, Math.min(5, Math.round(Number(v) || 1)))
const ROUND_TOKENS = 600000   // optional budget gate: ~16 agents (spec fixer, unit planner, checks, reader, cold gate) in one fix round
const budgetLeft = () => {
  try {
    if (!budget || typeof budget !== 'object') return Infinity
    const r = typeof budget.remaining === 'function' ? budget.remaining() : budget.remaining
    return typeof r === 'number' ? r : Infinity
  } catch (e) { return Infinity }
}
const sliceIx = s => SLICES.indexOf(s)
const SHA_OK = h => /^[0-9a-f]{64}$/.test(h)
const J = v => JSON.stringify(v)

function probeFailures(ps) {
  const f = [], list = Array.isArray(ps) ? ps : []
  if (list.length < 30 || list.length > 40) f.push(`need 30..40 probes, got ${list.length}`)
  const ids = list.map(p => p.id)
  if (new Set(ids).size !== ids.length) f.push('duplicate probe ids')
  const fixed = list.filter(p => p.source !== 'spec')
  if (fixed.length < 15) f.push(`need >= 15 fixed (non-spec) probes, got ${fixed.length}`)
  for (const p of fixed) {
    if (p.expected == null || (typeof p.expected === 'string' && !p.expected.trim())) f.push(`${p.id}: fixed probe without expected`)
    if (!p.cite || !/^(B-\w+|brief p\d+|R\d{1,2})$/.test(String(p.cite).trim())) f.push(`${p.id}: cite must be B-xx | brief pN | Rnn`)
    else if (/^B-/.test(p.cite) && pre && !pre.rule_ids.includes(p.cite.trim())) f.push(`${p.id}: cites unknown bible rule ${p.cite}`)
    else if (/^R\d/.test(p.cite) && !(p.cite.trim() in RULINGS)) f.push(`${p.id}: cites unknown ruling ${p.cite}`)
  }
  for (const p of list.filter(q => q.source === 'spec')) if (!underRoots(p.pointer)) f.push(`${p.id}: spec probe pointer ${J(p.pointer)} is not under SPEC_ROOTS`)
  return f
}

function sectionFailures(xs) {
  const f = []
  for (const x of xs) {
    for (const r of x.rules) {
      if (!new RegExp('^S-' + x.sid + '-\\d{2,}$').test(r.id)) f.push(`${x.sid}: rule id ${r.id} is not S-${x.sid}-NN`)
      if (r.buildable && !(r.from || []).length) f.push(`${x.sid}: buildable rule ${r.id} has empty from`)
    }
  }
  return f
}

function ancestors(id, byId) {
  const seen = new Set(), stack = [...((byId.get(id) || {}).depends_on || [])]
  while (stack.length) { const d = stack.pop(); if (seen.has(d)) continue; seen.add(d); for (const e of ((byId.get(d) || {}).depends_on || [])) stack.push(e) }
  return seen
}

function unitFailures(u, sp) {
  const f = [], units = u.units, ids = units.map(x => x.id), byId = new Map(units.map(x => [x.id, x]))
  const dup = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))]
  if (dup.length) f.push('duplicate unit ids: ' + dup.join(', '))
  for (const x of units) for (const d of x.depends_on) {
    const y = byId.get(d)
    if (!y) f.push(`${x.id} depends on unknown ${d}`)
    else if (sliceIx(y.slice) > sliceIx(x.slice)) f.push(`${x.id} (slice ${x.slice}) depends on ${d} of a later slice ${y.slice}`)
  }
  const uniq = [...byId.keys()], indeg = new Map(uniq.map(i => [i, 0])), next = new Map(uniq.map(i => [i, []]))
  for (const id of uniq) for (const d of new Set(byId.get(id).depends_on)) if (byId.has(d) && d !== id) { indeg.set(id, indeg.get(id) + 1); next.get(d).push(id) }
  for (const id of uniq) if (byId.get(id).depends_on.includes(id)) f.push(`${id} depends on itself`)
  const q = uniq.filter(i => indeg.get(i) === 0), order = []
  while (q.length) { const i = q.shift(); order.push(i); for (const j of next.get(i)) { indeg.set(j, indeg.get(j) - 1); if (indeg.get(j) === 0) q.push(j) } }
  if (order.length < uniq.length) f.push('dependency cycle among: ' + uniq.filter(i => !order.includes(i)).join(', '))
  for (const s of SLICES) { const n = units.filter(x => x.slice === s).length; if (n > 9) f.push(`slice ${s} has ${n} units (max 9)`) }
  const u0 = byId.get('U00'), u1 = byId.get('U01')
  if (!u0) f.push('U00 missing')
  else if (u0.slice !== 'A' || !sameList(u0.files, ['maps-site/index.html']) || u0.kind !== 'logic') f.push('U00 must be slice A, kind logic, files ["maps-site/index.html"]')
  if (!u1) f.push('U01 missing')
  else if (u1.slice !== 'A' || !sameList(u1.files, ['tools/filigree-capture.js']) || !u1.depends_on.includes('U00')) f.push('U01 must be slice A, files ["tools/filigree-capture.js"], depends on U00')
  const listed = []
  for (const [s, xs] of Object.entries(u.slices)) {
    if (!SLICES.includes(s)) { f.push('unknown slice key ' + s); continue }
    for (const id of xs) { listed.push(id); const x = byId.get(id); if (!x) f.push(`slices.${s} lists unknown unit ${id}`); else if (x.slice !== s) f.push(`slices.${s} lists ${id}, whose slice is ${x.slice}`) }
  }
  for (const id of uniq) { const n = listed.filter(y => y === id).length; if (n !== 1) f.push(`${id} is listed in slices ${n} times (need exactly 1)`) }
  const classOwner = {}
  for (const [s, cs] of Object.entries(u.slice_classes)) {
    if (!SLICES.includes(s)) { f.push('unknown slice_classes key ' + s); continue }
    for (const c of cs) { if (!pre.class_ids.includes(c)) f.push(`slice_classes.${s}: ${c} is not a bible class id`); (classOwner[c] = classOwner[c] || []).push(s) }
  }
  for (const c of pre.ground_six) { const o = classOwner[c] || []; if (o.length !== 1) f.push(`ground-six class ${c} belongs to ${o.length} slices (need exactly 1)`) }
  for (const x of units) {
    if (!SLICES.includes(x.slice)) f.push(`${x.id}: slice ${J(x.slice)} is not one of ${SLICES.join('|')}`)
    if (!UNIT_KINDS.includes(x.kind)) f.push(`${x.id}: kind ${J(x.kind)} is not one of ${UNIT_KINDS.join('|')}`)
    x.acceptance.forEach((a, i) => { if (!ACC_KINDS.includes(a.kind)) f.push(`${x.id}: acceptance[${i}].kind ${J(a.kind)} is not one of ${ACC_KINDS.join('|')}`) })
    if (!Number.isInteger(x.paint_order) || x.paint_order < 0 || x.paint_order > 10) f.push(`${x.id}: paint_order must be 0..10`)
    if (!x.acceptance.length) f.push(`${x.id}: no acceptance`)
    x.acceptance.forEach((a, i) => { if (!String(a.cmd).trim() || !String(a.expect).trim()) f.push(`${x.id}: acceptance[${i}] needs a non-empty cmd and expect`) })
    if (x.acceptance.some(a => a.kind === 'capture') && !ancestors(x.id, byId).has('U01')) f.push(`${x.id}: capture acceptance without depending on U01`)
  }
  const covered = new Set(units.flatMap(x => x.covers))
  const unc = sp.rules.filter(r => r.buildable && !covered.has(r.id)).map(r => r.id)
  if (unc.length) f.push('buildable spec rules not covered by any unit: ' + unc.join(', '))
  const traced = new Set(sp.rules.flatMap(r => r.from))
  const untr = pre.must_ids.filter(m => !traced.has(m))
  if (untr.length) f.push('bible must rules not traced by any spec rule: ' + untr.join(', '))
  return f
}

function checksFailures(rd) {   // Job 3's spec('<S>') criterion can never pass on an empty /checks/<S>, and no Job 3 fix unit can add one
  const c = rd.checks || {}
  return SLICES.flatMap(s => {
    const xs = Array.isArray(c[s]) ? c[s] : []
    if (!xs.length) return [`slice ${s}: /checks/${s} in sheet-spec.json is missing or empty (Job 3 needs at least one {id, cmd, expect} check per slice; s12 owns /checks)`]
    const blank = xs.filter(x => !String((x || {}).id ?? '').trim() || !String((x || {}).cmd ?? '').trim() || !String((x || {}).expect ?? '').trim())
    const phone = xs.some(x => isPhoneId((x || {}).id) && !phoneLoosened(PHONE_REF, phoneTerms(x)).length)
    return (blank.length ? [`slice ${s}: /checks/${s} has ${blank.length} check(s) without a non-empty id, cmd and expect`] : []).concat(phone ? [] : [`slice ${s}: /checks/${s} has no check with id "phone" whose cmd is one node tools/filigree-capture.js run (no echo/printf, ; or ||) with --metrics listing phone, a single --phone 390x664@3 (or a smaller viewport) and a real --cells file and whose expect states phone.overlaps = 0, phone.hscroll false, phone.min_name_px null or >= 12, phone.min_italic_px null or >= 11 and phone.wrong_taps = 0 as a number, each as strict or stricter (FM3, FM4; s12 owns /checks)`])
      .concat((JOB3_REQ_CHECKS[s] || []).filter(id => !xs.some(x => (x || {}).id === id)).map(id => `slice ${s}: /checks/${s} lacks required check id "${id}" (Job 3 REQ_CHECKS, exact match; s12 owns /checks)`))   // exact: Job 3 compares c.id === id
  })
}

const chkMap = checks => Object.fromEntries(SLICES.map(s => [s, new Map((Array.isArray((checks || {})[s]) ? checks[s] : []).filter(x => String((x || {}).id ?? '').trim()).map(x => [x.id, x])) ]))
const isPhoneId = id => String(id).trim().toLowerCase() === 'phone'
const PHONE_KEYS = ['overlaps', 'hscroll', 'min_name_px', 'min_italic_px', 'wrong_taps'], PHONE_MAX = ['overlaps', 'wrong_taps'], PHONE_MIN = ['min_name_px', 'min_italic_px']
const PHONE_REF = {w: 390, h: 664, dpr: 3, cells: true, tool: true, keys: PHONE_KEYS, overlaps: 0, hscroll: true, min_name_px: 12, min_italic_px: 11, wrong_taps: 0}   // FM3/FM4; R2: upright 12 px, italic 11 px
const PHONE_OP = /(<=|>=|≤|≥|!==?|===?|=|<|>|\bat most\b|\bat least\b|\bup to\b|\bno more than\b|\bno less than\b|\bis\b)\s*(-?\d+(?:\.\d+)?)/g
const PHONE_WAIVE = /\b(?:advisory|not enforced|unenforced|tolerated|ignored?|optional|informational|best[- ]effort|warn(?:ing)?s? only|only|except|unless|excluding)\b/i
function phoneTerms(x) {   // what a phone check enforces; an unreadable command, viewport, cells value, key or bound counts as no bound at all
  const cmd = String((x || {}).cmd ?? ''), ex = String((x || {}).expect ?? '')
  const fl = {}
  for (const m of cmd.matchAll(/(?:^|\s)--([\w-]+)(?:[\s=]+(?!--)(\S+))?/g)) (fl[m[1]] = fl[m[1]] || []).push(m[2] ?? '')
  const one = k => (fl[k] || []).length === 1 ? fl[k][0] : null, list = v => v.replace(/^['"]|['"]$/g, '').split(',').filter(Boolean)
  const tool = /^\s*node\s+(?:\.\/)?tools\/filigree-capture\.js(?=\s|$)/.test(cmd) && !/\|\||;|\b(?:echo|printf|true|cat\s*<<)\b/.test(cmd) && one('metrics') !== null && list(one('metrics')).includes('phone')   // a real capture run, not a command that prints its own JSON
  const vp = tool && one('phone') !== null ? one('phone').match(/^(\d+)x(\d+)(?:@(\d+(?:\.\d+)?))?$/) : null, cl = tool ? one('cells') : null
  const t = {w: vp ? +vp[1] : Infinity, h: vp ? +vp[2] : Infinity, dpr: vp ? (vp[3] ? +vp[3] : 3) : 0, cells: cl !== null && !/^(none|null|false|0|-|''|"")?$/i.test(cl), tool, keys: PHONE_KEYS.filter(k => ex.includes(k)),
    views: one('views') !== null ? list(one('views')) : fl.views ? [] : null, only: fl.only ? (one('only') !== null ? list(one('only')) : []) : null}
  const hits = [...ex.matchAll(new RegExp(PHONE_KEYS.join('|'), 'g'))]
  const spans = k => hits.map((m, i) => [m[0], ex.slice(m.index + m[0].length, i + 1 < hits.length ? hits[i + 1].index : ex.length)]).filter(([n]) => n === k).map(([, g]) => g)
  const segs = k => spans(k).map(g => g.split(/[,;]|&&|\band\b/)[0])
  for (const k of PHONE_MAX.concat(PHONE_MIN)) {   // several readable bounds on one key: the loosest one counts
    const up = PHONE_MAX.includes(k), none = up ? Infinity : -Infinity
    const vs = spans(k).map(g => {   // one bound per mention; a second bound after it (even past a comma), a waiver, or (for a count) an "or"/null allowance makes the mention unreadable
      const ps = g.split(/[,;]|&&|\band\b/), bs = [...ps[0].matchAll(PHONE_OP)]
      const extra = ps.slice(1).some(q => [...q.matchAll(PHONE_OP)].some(m => !/[A-Za-z]\w*[._]\w|\bphone\b/.test(q.slice(0, m.index))))
      if (!bs.length) return null
      if (bs.length > 1 || extra || PHONE_WAIVE.test(g) || (up && (/\bor\b|\|\|/.test(g) || /(?<!\b(?:not|never|no|non)[\s-]+)\bnull\b/i.test(g)))) return none
      const [, op, n] = bs[0], eq = /^(===?|=|at most|at least|is)$/.test(op)
      if (up) return eq || op === '<=' || op === '≤' || op === 'up to' || op === 'no more than' ? +n : op === '<' ? Math.ceil(+n) - 1 : Infinity
      return eq || op === '>=' || op === '≥' || op === '>' || op === 'no less than' ? +n : -Infinity
    }).filter(v => v !== null)
    t[k] = vs.length ? (up ? Math.max(...vs) : Math.min(...vs)) : none
  }
  const hs = segs('hscroll')
  t.hscroll = (/!\s*(?:[\w$]+\.)*hscroll\b(?!\s*[=!<>])/.test(ex) || hs.some(g => /\bfalse\b|\bno\b|^\s*(?:===?|=)\s*0\b|^\s*!==?\s*true\b/i.test(g))) && !hs.some(g => /\b(true|any|ignored?|either|optional)\b/i.test(g.replace(/^\s*!==?\s*true\b/, ''))) && !spans('hscroll').some(g => PHONE_WAIVE.test(g))
  return t
}
const phoneLoosened = (o, n) => [].concat(   // the thresholds of o that n relaxes, by name; [] = n keeps or tightens every one
  o.tool && !n.tool ? ['cmd is not a node tools/filigree-capture.js run with --metrics listing phone'] : [],
  o.keys.filter(k => !n.keys.includes(k)).map(k => 'drops ' + k),
  n.w > o.w || n.h > o.h || n.dpr < o.dpr ? ['--phone ' + [n.w, n.h].join('x') + '@' + n.dpr + ' is larger than ' + [o.w, o.h].join('x') + '@' + o.dpr] : [],
  o.cells && !n.cells ? ['--cells'] : [], o.hscroll && !n.hscroll ? ['hscroll'] : [],
  o.views && (!n.views || o.views.some(v => !n.views.includes(v))) ? ['--views ' + J(n.views) + ' drops part of ' + J(o.views)] : [],
  o.only !== undefined && n.only && (!o.only || o.only.some(v => !n.only.includes(v))) ? ['--only ' + J(n.only) + ' narrows ' + J(o.only)] : [],
  PHONE_MAX.filter(k => n[k] > o[k]).map(k => k + ' <= ' + n[k] + ' (was <= ' + o[k] + ')'),
  PHONE_MIN.filter(k => n[k] < o[k]).map(k => k + ' >= ' + n[k] + ' (was >= ' + o[k] + ')'))
function checkRegressions(base, checks, cited) {   // the fixer's "append, keep byte-for-byte" rule, enforced: every baseline check survives under its exact id and keeps cmd/expect unless a cited entry names it; a cited phone change must also keep or tighten every threshold
  const now = chkMap(checks), msgs = [], own = t => String(t).includes('during a fix round')   // a regression message never licenses the change it reports
  const named = id => cited.some(t => !own(t) && (String(t).includes(J(id)) || String(t).split(/[^\w.-]+/).includes(id)))
  const phoneCited = s => cited.some(t => !own(t) && String(t).startsWith('slice ' + s + ':') && String(t).includes('"phone"'))   // the checksFailures entry for this slice's phone check
  for (const s of SLICES) {
    for (const [id, x] of base[s]) {
      const y = now[s].get(id), keep = J({id, cmd: x.cmd, expect: x.expect}), changed = y && (y.cmd !== x.cmd || y.expect !== x.expect)
      const lo = changed && isPhoneId(id) ? phoneLoosened(phoneTerms(x), phoneTerms(y)) : []
      if (!y) msgs.push(`slice ${s}: /checks/${s} dropped check id ${J(id)} during a fix round; restore it verbatim as ${keep} (s12 owns /checks)`)
      else if (changed && !(isPhoneId(id) ? phoneCited(s) : named(id))) msgs.push(`slice ${s}: /checks/${s} check id ${J(id)} had its cmd or expect changed during a fix round without a cited failure; restore it verbatim as ${keep} (s12 owns /checks)`)
      else if (lo.length) msgs.push(`slice ${s}: /checks/${s} check id ${J(id)} was loosened during a fix round (${lo.join('; ')}); restore it verbatim as ${keep}, or change it only by keeping or tightening every threshold (FM3, FM4; s12 owns /checks)`)
      else continue
      now[s].delete(id)
    }
    for (const [id, y] of now[s]) base[s].set(id, y)   // accepted changes and new checks join the baseline; a regressed id keeps its old value until restored
  }
  return msgs
}

function viewFailures(rd) {   // gates/views.json is frozen from /fixtures/views: the seeds verbatim, zoom = midpoint of /sheets/<sheet>/band
  const f = [], vs = rd.views, bands = rd.bands || {}, ids = vs.map(v => v.id), want = VIEWS_SEED.map(v => v.id)
  if (!sameList([...ids].sort(), [...want].sort())) f.push(`view ids ${J(ids)} != ${J(want)}`)
  for (const s of VIEWS_SEED) {
    const v = vs.find(x => x.id === s.id)
    if (!v) continue
    if (lc(v.sheet) !== s.sheet) f.push(`${s.id}: sheet ${J(v.sheet)} != ${J(s.sheet)}`)
    if (!(Math.abs(v.x - s.x) <= 0.05 && Math.abs(v.y - s.y) <= 0.05)) f.push(`${s.id}: centre ${v.x},${v.y} != ${s.x},${s.y}`)
    if (norm(v.mask) !== norm(s.mask)) f.push(`${s.id}: mask ${J(v.mask)} != ${J(s.mask)}`)
    const b = bands[s.sheet]
    if (!Array.isArray(b) || b.length !== 2 || !b.every(Number.isFinite) || b[0] > b[1]) f.push(`${s.id}: /sheets/${s.sheet}/band ${J(b)} is not [zmin, zmax]`)
    else if (!Number.isFinite(v.zoom) || Math.abs(v.zoom - (b[0] + b[1]) / 2) > 0.01) f.push(`${s.id}: zoom ${v.zoom} != midpoint ${(b[0] + b[1]) / 2} of /sheets/${s.sheet}/band`)
  }
  return f
}

function probeEq(p, got, exp) {
  if (exp == null || got == null) return false
  if (p.kind === 'number') { const a = Number(got), b = Number(exp); return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= (Number(p.tolerance) || 0) }
  if (p.kind === 'bool') return lc(got) === lc(exp)
  if (p.kind === 'hex') return lc(got).replace(/\s+/g, '') === lc(exp).replace(/\s+/g, '')
  if (p.kind === 'order') return sameList(asList(got).map(norm), asList(exp).map(norm))
  if (Array.isArray(exp) || Array.isArray(got)) { const a = asList(got).map(norm).sort(), b = asList(exp).map(norm).sort(); return sameList(a, b) }
  return norm(got) === norm(exp)
}

function drawFailures(e, rd) {
  const f = [], strip = l => norm(String(l).replace(/^layer-/, ''))
  const layers = e.layers.map(strip), want = rd.sheet_one_layers.map(strip)
  if (!sameList(layers, want)) f.push(`layers: ${J(layers)} != ${J(want)}`)
  const seen = new Set(layers.concat(e.labels.map(l => norm(l.class))))
  const miss = rd.must_classes.filter(c => !seen.has(norm(c)))
  if (miss.length) f.push('must: classes missing ' + miss.join(', '))
  const forbSet = new Set(rd.forbidden_classes.concat(SHEET_ONE_FORBIDDEN).map(norm)), forb = [...seen].filter(c => forbSet.has(c) || isHomestead(c))
  if (forb.length) f.push('forbidden: classes drawn ' + forb.join(', ') + (forb.some(isHomestead) ? ' (homesteads wait for the valley sheet; sheet one is the region sheet)' : ''))
  const pal = new Set(rd.palette_hex.map(lc).concat(['none', 'transparent']))
  const off = [...new Set(e.colors.map(lc))].filter(c => !pal.has(c))
  if (off.length) f.push('palette: colours outside it ' + off.join(', '))
  if (e.shields.length !== 1) f.push(`shield: ${e.shields.length} shields (need exactly 1)`)
  else { const d = Math.hypot(e.shields[0].x - rd.river_town.x, e.shields[0].y - rd.river_town.y); if (!(d <= 24)) f.push(`shield: ${Math.round(d)} px from ${rd.river_town.name} (max 24)`) }
  const texts = new Set(e.labels.map(l => norm(l.text)))
  const ml = rd.must_label.filter(t => !texts.has(norm(t)))
  if (ml.length) f.push('labels: must labels missing ' + ml.join(', '))
  return f
}

// ---- Preflight ----
phase('Preflight')
const pre = await crit(P(`${ANCHOR_TASK}
Put that object under "anchors". Then check the following and write nothing:
1. bible_gate_pass: ${OUTABS}/gates/1-research.json exists, parses and has "pass": true.
2. bible_sha256: sha256sum of ${OUTABS}/density-bible.json ('' if missing). bible_sha_ok: it equals the sha256 recorded for density-bible.json in that gate's "artifacts" ([{path, sha256}]); false if either is missing.
3. From ${OUTABS}/density-bible.json (empty values when it is missing): rule_ids = rules[].id; rule_kinds = {id: kind}; must_ids = ids of rules whose kind is "must"; class_ids = classes[].id; ground_six = the union of every ground_classes.*.six, de-duplicated and sorted; forbidden_by_sheet = {<sheet>: sheets.<sheet>.forbidden}; targets = the bible's "targets" object verbatim ({per_view:{<sheet>:{<class>:n}}}).
4. rulings_overrides = the "overrides" object of ${DOCS}/rulings.json ({} when the file is absent).
5. The ledger ${OUTABS}/state/2-plan.json (absent = empty) has {sections:[{sid, path, sha256, rules, fragment, anchors, open}], probes_sha256, bible_sha256, picks:{coast, river_town, city}, rulings_used, spec}. sections_ok = every recorded section whose path still exists and whose sha256sum equals the recorded sha256, copied verbatim as {sid, path, sha256, rules:[{id, from, buildable}], fragment, anchors, open}. ledger_ctx = {bible_sha256, picks, rulings_used} copied verbatim from the ledger ({} fields omitted when absent).
6. ${OUTABS}/gates/2-probes.json: probes_ok = it exists, parses, has frozen === true and a probes array, and (when the ledger records probes_sha256) its sha256sum equals that value. probes = its probes array verbatim when probes_ok, else []. probes_stamp = {bible_sha256, rulings} copied verbatim from that file's top-level keys of those names (omit a key that is absent). probes_sha256 = its sha256sum ('' if missing). probe_summary = [{id, ok}] with ok = the probe has id, q, kind, source, plus a pointer when source is "spec" and expected + cite otherwise.
7. spec_exists = ${SPEC_MD} or ${SPEC_JSON} exists.`), {label: 'preflight', phase: 'Preflight', schema: PRE, ...M('mech')})
if (!pre) return done({reason: 'agent died: preflight'})
for (const [k, d] of [['bible_sha256', ''], ['ground_six', []], ['probes', []], ['probes_sha256', '']]) if (pre[k] == null) { pre[k] = d; log('preflight omitted optional ' + k) }
const lost = anchorsLost(pre.anchors)
if (lost.length) die('anchor lost: ' + lost.join('; '))
const {r: RUL, used: RUSED} = rulingsMerge(pre.rulings_overrides)
const chainOk = !!(pre.bible_gate_pass && pre.bible_sha_ok)
if (!chainOk) {
  if (MODE === 'full' && !FORCE) die('planning must not start before the density bible exists (brief p5): gates/1-research.json is not pass, or the bible changed since')
  log('gate chain not satisfied (Job 1 gate not pass, or the bible changed): ' + (FORCE ? 'forced: ' + FORCE : 'reported only in ' + MODE + ' mode'))
}
const probesResumed = RESUME && pre.probes_ok
const stamp = pre.probes_stamp || {}
const probesStale = probesResumed && (!stamp.bible_sha256 || stamp.bible_sha256 !== pre.bible_sha256 || J(stamp.rulings || null) !== J(RUL))   // the fixed answers were derived from the bible and rulings in force when they were frozen
const lctx = pre.ledger_ctx || {}
const ctxMismatch = []   // a ledgered section was drafted against one bible, ruling set and ground; it resumes only when all three still match
if (!lctx.bible_sha256 || lctx.bible_sha256 !== pre.bible_sha256) ctxMismatch.push('bible')
if (Object.keys(RULINGS).some(k => (lctx.rulings_used || {})[k] !== RUSED[k])) ctxMismatch.push('rulings')
const resumedAll = RESUME && !ctxMismatch.length ? pre.sections_ok.filter(x => SECTIONS.some(s => s.sid === x.sid) && x.fragment && typeof x.fragment === 'object') : []   // no stored fragment (older ledger): rewritten
if (RESUME && ctxMismatch.length && pre.sections_ok.length) log('ledgered sections rewritten (' + ctxMismatch.join(' + ') + ' changed since they were written)')
let resumedSec = resumedAll.filter(x => !sectionFailures([x]).length)   // a ledgered section whose rules break the format is rewritten, never resumed
if (resumedSec.length < resumedAll.length) log('ledgered sections rewritten (rule-format failures): ' + resumedAll.filter(x => !resumedSec.includes(x)).map(x => x.sid).join(', '))
let todoSections = cap(SECTIONS.filter(s => !resumedSec.some(x => x.sid === s.sid)))

if (MODE === 'plan') {
  const nSec = todoSections.length
  // min = a run where no agent dies; max counts every crit() call twice (its retry) and every optional re-ask
  const K = 2, GATE = 8, CHECKS = 3   // GATE = 2 drafters + 2 extractors + rasterize + png stat + guess auditor + divergence judge
  const schedule = [
    {phase: 'Preflight', agents_min: 1, agents_max: K},
    {phase: 'Probes', agents_min: probesResumed ? 1 : 2, agents_max: probesResumed ? K : 3 * K},   // writer + one re-ask, then the readback
    {phase: 'Pick', agents_min: GROUND ? 0 : 1, agents_max: GROUND ? 0 : 6},   // challenger + 3 pickers + 2 judges
    {phase: 'Sections', agents_min: 2 * nSec + 1, agents_max: 3 * nSec + K},   // write + anchors (+ fix), then the early ledger record
    {phase: 'Integrate', agents_min: 3, agents_max: K + 4},   // integrator, cropper, red-team (+ patcher, red-team 2)
    {phase: 'Units', agents_min: 1, agents_max: 2 * K},   // planner + one fix
    {phase: 'Check', agents_min: CHECKS + 1, agents_max: 2 * CHECKS + 1 + K},   // checks (+ fixer + checks again) + reader
    {phase: 'Cold-cartographer gate', agents_min: GATE, agents_max: GATE},
    {phase: 'Fix', agents_min: 0, agents_max: ROUNDS * (K + K + CHECKS + K + GATE)},   // spec fixer, unit planner, checks, reader, gate
    {phase: 'Record', agents_min: 3, agents_max: 3 * K + K}   // three records (+ artifact hasher)
  ]
  const agents_min = schedule.reduce((t, x) => t + x.agents_min, 0), agents_max = schedule.reduce((t, x) => t + x.agents_max, 0)
  return done({reason: 'plan', schedule, agents_min, agents_max, bound: 125, over_bound: agents_max > 125, chain_ok: chainOk, owner_rulings_used: RUSED})
}

let rounds = 0
const gaps = []
const died = label => done({reason: 'agent died: ' + label, rounds, owner_rulings_used: RUSED})
const G20 = C('G2.0', 'preflight chain: Job 1 passed, bible unchanged', {bible_gate_pass: pre.bible_gate_pass, bible_sha_ok: pre.bible_sha_ok, forced_by: FORCE}, 'true (not forced)', chainOk && !FORCE)

// ---- Probes (frozen before the spec exists) ----
phase('Probes')
let probes, probesSha, probesAfterSpec = false
if (probesResumed) {
  if (probesStale) { const m = 'bible or rulings changed since the probes were frozen (or the file carries no stamp); delete gates/2-probes.json and sheet-spec.* and rerun'; if (MODE === 'full') die(m); log('frozen probes stale: ' + m) }
  probes = pre.probes; probesSha = pre.probes_sha256
  const bad = probeFailures(probes)
  if (bad.length) { if (MODE === 'full') die('frozen gates/2-probes.json is invalid and is never regenerated (' + bad.join('; ') + '); delete it and rerun with resume:false'); log('frozen probes invalid: ' + bad.join('; ')) }
  log(`probes resumed: ${probes.length} frozen`)
} else {
  if (pre.spec_exists) { probesAfterSpec = true; log('probes-after-spec: a sheet spec already exists while the probes are being written') }
  const probePrompt = bad => `The sheet spec does not exist yet and you must not look for one (do not open ${SPEC_MD}, ${SPEC_JSON}, ${OUTABS}/spec/ or ${OUTABS}/cold/).
From the density bible (${BIBLE}), the brief ${BRIEF} pages 5 (Planning) and 8 (sheets) (Read with pages:"5" and pages:"8"), and these rulings:
${rulingText(RUL, Object.keys(RULINGS))}
write 30-40 closed-form probes a cartographer must answer to draw sheet one (the region sheet, bbox ${SHEET_ONE_BBOX} atlas px).
- At least 15 must be fixed probes (source "bible" | "brief" | "ruling"): the answer is determined by the bible, the brief or a ruling regardless of the ground pick and of choices the spec makes. Give expected and cite (exactly "B-xx" for a bible rule id, "brief pN", or "Rnn").
- The rest are spec probes (source "spec"): freeze ONLY the question and a JSON pointer under one of these roots where the spec must hold the answer: ${SPEC_ROOTS.join(' ')} (for example /sheets/valley/band/0, /palette/rust_road/day, /picks/river_town/name). No expected value.
- kind is one of enum | number | name | hex | order | bool; give tolerance for number probes; order answers are arrays in order.
- The drafter sees only id, q, kind and options, and answers are scored by exact normalized match. So q must state the answer format: for enum and order probes put the closed option list in "options" (the exact tokens, in the bible's or spec's spelling) and say in q to answer with those tokens; for number probes name the unit and say how to round; for hex say "#rrggbb lowercase"; for bool say "true or false"; for name say which exact spelling form is wanted.
- Cover: paint order positions (the brief's order is ${PAINT_ORDER_IDS.join(' > ')}), forbidden per sheet, the shield town, the fog layer's place vs names, appear ease, the overlay order (${OVERLAY_IDS.join(', ')}), the hex six on F02, palette tokens, and the city label rule.
- ids P01, P02, ...
Write ${OUTABS}/gates/2-probes.json as {"date":"${DATE}","frozen":true,"bible_sha256":"${pre.bible_sha256}","rulings":${J(RUL)},"probes":[...]} (2-space indent; keep the bible_sha256 and rulings values exactly as given), creating parent directories.
${bad.length ? 'Your previous probe set failed these checks; rewrite the file so all pass:\n- ' + bad.join('\n- ') + '\n' : ''}${READBACK} Also return the probes array you wrote.`
  let pr = await crit(P(probePrompt([])), {label: 'probe writer', phase: 'Probes', schema: PROBES, ...M('judge')})
  if (!FILE_OK(pr)) return died('probe writer')
  let bad = probeFailures(pr.probes)
  if (bad.length) {
    pr = await crit(P(probePrompt(bad)), {label: 'probes (fix)', phase: 'Probes', schema: PROBES, ...M('judge')})
    if (!FILE_OK(pr)) return died('probes (fix)')
    bad = probeFailures(pr.probes)
    if (bad.length) { if (MODE === 'full') die('probes invalid after one re-ask: ' + bad.join('; ')); log('probes invalid (smoke, not enforced): ' + bad.join('; ')) }
  }
  probes = pr.probes; probesSha = pr.sha256
}
{   // the scored array must be the file's: a second, independent read of gates/2-probes.json is compared with the array in hand
  const rb = await crit(P(`Mechanical reader, no judging. Read ${OUTABS}/gates/2-probes.json, JSON.parse it and return {path, sha256 (sha256sum of the file), parsed: true, probes (its probes array, verbatim, every field of every probe)}. Write nothing.`), {label: 'probes readback', phase: 'Probes', schema: PROBES, ...M('mech')})
  if (!FILE_OK(rb)) { if (MODE === 'full') die('probes readback failed: gates/2-probes.json could not be re-read'); log('probes readback failed (smoke, not enforced)') }
  else {
    const drift = []
    if (probesSha && rb.sha256 !== probesSha) drift.push(`file sha ${rb.sha256} != ${probesSha}`)
    if (J(rb.probes) !== J(probes)) drift.push('the probes array in hand differs from the file')
    if (drift.length) { if (MODE === 'full') die('frozen probes drifted from gates/2-probes.json (' + drift.join('; ') + ')'); log('probes drift (smoke, not enforced): ' + drift.join('; ')) }
    if (!probesSha) probesSha = rb.sha256
  }
}
const specProbes = probes.filter(p => p.source === 'spec')
const probeList = J(probes.map(p => p.options && p.options.length ? {id: p.id, q: p.q, kind: p.kind, options: p.options} : {id: p.id, q: p.q, kind: p.kind}))

// ---- Pick ----
phase('Pick')
let picks = {...DEFAULT_GROUND, source: 'default (R8)'}, pickTally = null
const coverage = []
if (GROUND) { picks = {...GROUND, source: 'owner override (args.ground)'}; log('pick skipped: owner override') }
else {
  const ch = await agent(P(`Try to refute the R8 default ground: coast C1 (Pēshunor north coast), river town Aldorūs, painted city Epēshu; sheet one = the region sheet over C1 (bbox ${SHEET_ONE_BBOX}).
${rulingText(RUL, ['R8', 'R19', 'R21', 'R22'])}
Use the density bible (${BIBLE}) and the research dossier ${DOSSIER} §7. Weigh: DEM coverage (window ${WINDOW}), data readiness, shield evenness (Kanae 86 px, Sokundo 88 px; R19), the Aldorūs sea contradiction (R21) and the Drāmūz marker. Set refuted only when the evidence shows the default is materially worse; give reasons, and alt = your best alternative {coast, river_town, city} (the default itself when not refuted). Write nothing.`),
    {label: 'pick challenger', phase: 'Pick', schema: CHAL, ...M('judge')})
  if (!ch) log('pick challenger died: the R8 default stands')
  else if (!ch.refuted) log('R8 default not refuted')
  else {
    const angles = cap(['evidence-led', 'table-play-led', 'build-risk-led'])
    const raw = await parallel(angles.map(g => () => agent(P(`Pick the Filigree ground: one coast, one river town and one painted city, inside the DEM window ${WINDOW} (atlas px). Your angle: ${g}.
The R8 default (C1 / Aldorūs / Epēshu) was challenged for these reasons: ${J(ch.reasons)}; the challenger's alternative: ${J(ch.alt)}.
${rulingText(RUL, ['R8', 'R19', 'R21', 'R22'])}
Read the density bible (${BIBLE}) and ${DOSSIER} §7. Return {coast, river_town, city, why}. Write nothing.`),
      {label: 'picker · ' + g, phase: 'Pick', schema: PICK, ...M('judge')})))
    const pk = kept(raw, 'pickers'); coverage.push(['pickers', pk.ok, pk.k.length + '/' + raw.length])
    const cands = [{id: 'default', ...DEFAULT_GROUND}, {id: 'alt', ...ch.alt}, ...pk.k.map((p, i) => ({id: 'pick-' + (i + 1), coast: p.coast, river_town: p.river_town, city: p.city, why: p.why}))]
    const jr = await parallel(cap([1, 2]).map(n => () => agent(P(`Score every candidate ground below on a 1-5 rubric for each of: canon_fit, dem_window (one DEM window ${WINDOW} holds it all), data_ready, shield_even (R19), table_play.
Candidates: ${J(cands)}
${rulingText(RUL, ['R8', 'R19', 'R21', 'R22'])}
Evidence: the density bible (${BIBLE}) and ${DOSSIER} §7. Return {scores:[{candidate:<id>, canon_fit, dem_window, data_ready, shield_even, table_play}]} with one entry per candidate id. Write nothing.`),
      {label: 'pick judge ' + n, phase: 'Pick', schema: JUDGE, ...M('judge')})))
    const jk = kept(jr, 'pick judges'); coverage.push(['pick judges', jk.ok, jk.k.length + '/' + jr.length])
    if (!jk.k.length) log('pick-unjudged: no pick judge returned; the R8 default stands')
    else {
      const tot = {}
      for (const c of cands) {
        const per = jk.k.map(j => j.scores.find(s => s.candidate === c.id)).filter(Boolean)
        if (per.length === jk.k.length) tot[c.id] = per.reduce((t, s) => t + RUBRIC.reduce((u, k) => u + clamp5(s[k]), 0), 0)
        else if (per.length) log(`pick: ${c.id} not scored by every judge; left out of the tally`)
      }
      const best = cands.filter(c => c.id !== 'default' && tot[c.id] != null).sort((a, b) => tot[b.id] - tot[a.id] || (a.id < b.id ? -1 : 1))[0]
      pickTally = {totals: tot, best: best ? best.id : null, judges: jk.k.length}
      if (tot.default == null) log('pick: the default was not scored by every judge; it stands')
      else if (best && tot[best.id] >= tot.default + 1) picks = {coast: best.coast, river_town: best.river_town, city: best.city, source: 'pick panel: ' + best.id}
      else log('pick: no alternative scored >= default + 1; the R8 default stands')
    }
  }
}
const picksText = J({coast: picks.coast, river_town: picks.river_town, city: picks.city})
if (resumedSec.length && GROUND_KEYS.some(k => norm((lctx.picks || {})[k]) !== norm(picks[k]))) {
  log('ledgered sections rewritten (ground picks changed since they were written)')
  resumedSec = []; todoSections = cap(SECTIONS)
}

// ---- Sections ----
phase('Sections')
const writePrompt = s => `You write ONE section of the Filigree sheet spec: ${s.sid}, "${s.title}". Your section is not blind.
Task: ${s.brief}
Read: the density bible (${BIBLE}); ${REUSE}; the research dossier ${DOSSIER}; any code the reuse map points to.
Ground picks: ${picksText}. Sheet one = the region sheet, bbox ${SHEET_ONE_BBOX} (atlas px). DEM window ${WINDOW}. Paint order: ${PAINT_ORDER_IDS.join(' > ')}.
Bible per-view targets: ${J(pre.targets)}
Rulings:
${rulingText(RUL, s.rulings)}
Code anchors (pattern -> path:line as re-derived this run; cite anchors as patterns, never as line numbers):
${anchorMap(pre.anchors)}
You own these spec JSON pointers: ${s.owns.join(', ')}.
- Write ${OUTABS}/spec/${s.sid}.md: plain prose a cartographer can follow, with a "## Rules" list.
- Rules: ids S-${s.sid}-01, S-${s.sid}-02, …; each {id, text, from:[bible rule ids B-xx it implements], buildable}; from may be empty only when buildable is false. Across the twelve sections every bible must rule must be traced; these are the bible must ids: ${pre.must_ids.join(', ')}.
- fragment: {<owned pointer>: value} for the pointers you own.
- anchors: every code location you rely on as {path (repo-relative), pattern (a literal that grep -nF finds in that file)}.
- open: questions you could not settle.
${VOCAB_RULE}
Return {sid:"${s.sid}", path, sha256 (sha256sum of the file), rules, fragment, anchors, open}.`
const anchorPrompt = w => `Mechanical check, no judging. Save this JSON list of {path, pattern} to a temp file and, with a short node script (String.indexOf on the file text, so no shell quoting touches the patterns), test that each pattern occurs in ${REPO}/<path>: ${J(w.anchors)}
Return {bad:["<path> :: <pattern>", ...]} for every pattern that is not found (an unreadable path is bad too). Write nothing.`
const fixPrompt = (w, bad) => `Fix the broken code anchors of spec section ${w.sid} in ${OUTABS}/spec/${w.sid}.md. These patterns are not found in their files: ${J(bad)}
For each, find the current literal in that file (grep -nF / read the code) and rewrite the anchor, or drop it when the code it named is gone; change nothing else. The section object was: ${J(w)}
Return the full section object with the corrected anchors: {sid, path, sha256 (sha256sum of the rewritten file), rules, fragment, anchors, open}.`
const runSections = xs => pipeline(xs,
  s => agent(P(writePrompt(s)), {label: s.sid + ' · write', phase: 'Sections', schema: WRITE, ...M(s.role)}),
  (w, s) => w && agent(P(anchorPrompt(w)), {label: s.sid + ' · anchors', phase: 'Sections', schema: ANCH, ...M('mech')}).then(a => a && ({w, bad: a.bad})),
  (a, s) => a && (a.bad.length ? agent(P(fixPrompt(a.w, a.bad)), {label: s.sid + ' · fix', phase: 'Sections', schema: WRITE, ...M('triage')}) : a.w))
const secRes = await runSections(todoSections)
const secLost = todoSections.filter((s, i) => !secRes[i]).map(s => s.sid)
// a dropped section is left out of the ledger, so the resume rerun retries it; a rerun is known by the ledger already holding sections, and a second drop there fails G2.1
const secLostTwice = resumedSec.length ? secLost : []
if (secLost.length) log('sections dropped: ' + secLost.join(', ') + (secLostTwice.length ? ' (dropped again on a resume rerun: fails G2.1)' : ' (rerun with resume to retry them)'))
const sk = kept(secRes, 'sections'); coverage.push(['sections', sk.ok, sk.k.length + '/' + secRes.length])
const freshSec = sk.k.map(w => ({sid: w.sid, path: w.path, sha256: w.sha256, rules: w.rules.map(r => ({id: r.id, from: r.from, buildable: r.buildable})), fragment: w.fragment, anchors: w.anchors, open: w.open}))
// a section failing the rule format is left out of the ledger too, so the resume rerun rewrites it; the spec fixer cannot repair spec/sNN.md, so these failures never start a fix round
const secBad = new Set(freshSec.filter(x => sectionFailures([x]).length).map(x => x.sid))
if (secBad.size) log('sections failing the rule format (left out of the ledger): ' + [...secBad].join(', '))
const allSec = resumedSec.concat(freshSec.filter(x => !secBad.has(x.sid)))
const secFails = sectionFailures(resumedSec.concat(freshSec)).concat(secLostTwice.map(sid => 'section lost twice: ' + sid))
if (resumedSec.length) log('sections resumed: ' + resumedSec.map(x => x.sid).join(', '))
const ledgerOf = (probesH, specH) => ({job: JOB, date: DATE, sections: allSec, probes_sha256: probesH, bible_sha256: pre.bible_sha256, picks: {coast: picks.coast, river_town: picks.river_town, city: picks.city}, rulings_used: RUSED, spec: specH})
{   // written now as well as in Record, so a later death or infra exit still leaves resumable sections
  const early = await record('state/2-plan.json', ledgerOf(probesSha, {md_sha256: '', json_sha256: ''}), 'record ledger (sections)')
  if (!early) log('section ledger not recorded after Sections; a later exit cannot resume them')
}

// ---- Integrate ----
phase('Integrate')
const specShape = `sheet-spec.json shapes the gate reads by pointer:
- /picks = {coast:{name}, river_town:{name, x, y}, city:{name, x, y}} (x, y in atlas px from maps-site/data);
- /sheets/<country|region|valley|city> = {band:[zmin, zmax], must:[{class, rule}], forbidden:[classId]};
- /paint_order = ${J(PAINT_ORDER_IDS)} exactly;
- /sheet_one = {sheet:"region", bbox:${J(SHEET_ONE_BBOX)}, layers:[the paint_order ids painted on sheet one, in paint order; never ${SHEET_ONE_FORBIDDEN.join(', ')}: homesteads wait for the valley sheet, so /sheets/region/forbidden lists every homestead class], must_label:[every name that must be lettered on sheet one]};
- /palette/<token> = {day:"#rrggbb", night:"#rrggbb", use};
- /overlays covers ${J(OVERLAY_IDS)} in stack order (${OVERLAY_NOTE});
- /fixtures/views = [{id, sheet, x, y, zoom, mask, plate?}] from these seeds, each zoom resolved to the midpoint of its sheet's band, mask "" when none: ${J(VIEWS_SEED)}; /fixtures/masks = "${MASK_RULE}";
- /hash includes: ${HASH_RULE}
- /hook = this text VERBATIM (+ pre_filigree_panes from s12):\n${HOOK_CONTRACT}
- /capture = this text VERBATIM:\n${CAPTURE_CONTRACT}
- /rules = every section rule [{id, text, from, buildable, section, anchors:[{path, pattern}]}]; every code anchor the spec relies on appears in the JSON as {path, pattern}.`
const integPrompt = `You are the spec integrator. Read every section draft ${OUTABS}/spec/s01.md … s12.md (those that exist) and these section fragments (resumed and fresh): ${J(resumedSec.concat(sk.k).map(w => ({sid: w.sid, fragment: w.fragment, open: w.open})))}
Also read the density bible (${BIBLE}), ${REUSE} and the research dossier ${DOSSIER}. Ground picks: ${picksText}.
Rulings:
${rulingText(RUL, Object.keys(RULINGS))}
Write two files:
1. ${SPEC_MD}: SELF-SUFFICIENT prose from which a cartographer who never saw the brief, its posts or its plates could draw sheet one. Describe every reference in your own words. Names of posts, plates, outside atlases or Swiss sources may appear ONLY in a final "## Provenance" section; nothing outside it may match /${LEAK.source}/i. The shipped "Tithe" POI names appear only inside a "## Renames" section (R10).
2. ${SPEC_JSON} with every one of these root keys: ${SPEC_ROOTS.filter(r => !UNIT_ROOTS.includes(r)).join(' ')} (the unit planner appends ${UNIT_ROOTS.join(' ')} later; leave them out).
${specShape}
${VOCAB_RULE}
Return {md, json (the two paths), sha_md, sha_json (sha256sum of each), rules:[{id, from, buildable}] for every rule in /rules, roots_present:[the SPEC_ROOTS keys present, as "/key"]}.`
const [integ, crop] = await parallel([
  () => crit(P(integPrompt), {label: 'spec integrator', phase: 'Integrate', schema: INTEG, ...M('integ')}),
  () => agent(P(`Write the sheet-one base crop. If ${OUTABS}/spec/assets/sheet-one-base.jpg and sheet-one-base.json already exist and the JSON parses with bbox ${J(SHEET_ONE_BBOX)}, leave them untouched and only read back.
Otherwise: stitch the z5 tiles ${REPO}/maps-site/tiles/5/<x>/<y>.jpg covering atlas bbox ${J(SHEET_ONE_BBOX)} (z5 = 2 px per atlas px; a 256 px tile spans 128 atlas px, so tile_x = floor(x / 128), tile_y = floor(y / 128); check the naming on disk first) with ImageMagick convert (/usr/bin/convert; no sharp), crop to the bbox at 2 px per atlas px and write ${OUTABS}/spec/assets/sheet-one-base.jpg (JPEG q85, <= 300 KB), plus ${OUTABS}/spec/assets/sheet-one-base.json = {"date":"${DATE}","bbox":${J(SHEET_ONE_BBOX)},"scale":2,"origin":[${SHEET_ONE_BBOX[0]},${SHEET_ONE_BBOX[1]}]}.
Re-read the JSON file, JSON.parse it, and return {jpg, json (both paths), sha256 (sha256sum of the JSON file), parsed: true}.`), {label: 'base cropper', phase: 'Integrate', schema: CROP, ...M('mech')})
])
if (!integ) return died('spec integrator')
if (!FILE_OK(crop)) return died('base cropper')
let spec = integ
const redPrompt = `Red-team the sheet spec ${SPEC_MD} and ${SPEC_JSON} against these rulings and the density bible (${BIBLE}). List every contradiction spec <-> rulings <-> bible as {a, b, fix} (quote both sides; fix = the concrete edit). Write nothing.
${rulingText(RUL, Object.keys(RULINGS))}`
let red = await agent(P(redPrompt), {label: 'red-team', phase: 'Integrate', schema: RED, ...M('judge')})
if (red && red.contradictions.length) {
  const pat = await agent(P(`Apply these red-team fixes to ${SPEC_MD} and ${SPEC_JSON}; keep every rule id, keep /hook and /capture verbatim, change nothing else: ${J(red.contradictions)}
${VOCAB_RULE}
Return {md, json, sha_md, sha_json, rules:[{id, from, buildable}], roots_present}.`), {label: 'spec patcher', phase: 'Integrate', schema: INTEG, ...M('judge')})
  if (pat) { spec = pat; red = await agent(P(redPrompt), {label: 'red-team (2)', phase: 'Integrate', schema: RED, ...M('judge')}) }
  else log('spec patcher died: the red-team contradictions stand')
}
const redClean = !!red && red.contradictions.length === 0
if (!red) log('red-team died: G2.9 is not clean')

// ---- Units ----
phase('Units')
const unitPrompt = fails => `You are the unit planner. Read ${SPEC_MD}, ${SPEC_JSON} and ${REUSE}. Set the three root keys of ${SPEC_JSON} (keep everything else byte-for-byte; when units, slices or slice_classes already exist, overwrite them in place, never duplicate or append a second copy; keep U00 and U01 under exactly those ids): "units", "slices" ({A|B|C|D: [unit ids]}) and "slice_classes" ({A|B|C|D: [bible class ids that slice must make visible]}). After writing, re-read the file, JSON.parse it and check that /units, /slices and /slice_classes equal what you return, then return the three exactly as in the file (the gate re-reads the file, not your return).
Unit = {id:"U00".., title, slice, kind: logic|tool|data|css|copy, files:[repo paths], paint_order, depends_on:[ids], requires:[roads|census|rivers], covers:[spec rule ids], model?, effort?, acceptance:[{kind: node|grep|json|capture, cmd, expect}]}.
- paint_order: 0 = infrastructure, 1-9 = ${PAINT_ORDER_IDS.map((x, i) => (i + 1) + ' ' + x).join(', ')}, 10 = overlays.
- Slice A ground: U00 = files ["maps-site/index.html"], kind logic: it creates the /* FILIGREE */ … /* /FILIGREE */ block, implements the /hook contract with classes = the bible class ids, adds the default-off filigree=1 toggle + layers-panel row, and makes the #view= moveend writer keep trailing params. U01 = files ["tools/filigree-capture.js"], depends on U00, implements /capture. Then the relief bake reusing tools/filigree-dem.js, contours, water fill + pooled coast edge, rivers.json.
- Slice B ink: mint tool + gazetteer source, steadings, rust coast road over the traced network, reserves wash, names + heights rank/collision pass, the single ${picks.river_town} shield.
- Slice C city: ${picks.city} painted pass (grain, park voids, ocher arterials, pooled edges), seeded fog, street names on a threshold, hover-only halos.
- Slice D stack: old survey under + swipe, notices schema/sample/import, structures / caravan halts / blazed paths / muster days / shut ways as toggled sheets, hash grammar + sheet= lock, two one-question plates, the R10 rename of the Tithe-Yard / Tithe-Barn POIs to The Tribute-Yard / The Tribute-Barn; the same unit also rewords their d: description strings (the Tribute-Yard's becomes 'A walled yard where the harvest-tribute is weighed, counted, and grumbled over.'), and its acceptance includes {kind: grep, cmd: "grep -ci tithe maps-site/index.html", expect: "0"}.
- At most 9 units per slice; no dependency on a later slice; no cycles.
- Every acceptance item is machine-checkable: a command + its expected output. Prose is rejected. capture acceptance only in units that depend (directly or not) on U01.
- index.html (the sim) only if a spec rule names it.
- covers: together the units cover every buildable rule in /rules.
- slice_classes: only these bible class ids: ${pre.class_ids.join(', ')}; each of these ground-six classes in exactly one slice: ${pre.ground_six.join(', ')}.
- model (opus|sonnet|haiku) and effort (low|medium|high|xhigh|max) are optional per unit.
${fails.length ? 'Your previous plan failed these code checks; fix them all:\n- ' + fails.join('\n- ') : ''}`
const units = await crit(P(unitPrompt([])), {label: 'unit planner', phase: 'Units', schema: UNITS, ...M('judge')})
if (!units) return died('unit planner')
const planFails = unitFailures(units, spec)   // pre-check of the planner's return only; G2.1 re-runs unitFailures on what the spec reader finds in the file
if (planFails.length) {
  const u2 = await crit(P(unitPrompt(planFails)), {label: 'unit planner (fix)', phase: 'Units', schema: UNITS, ...M('judge')})
  if (!u2) return died('unit planner (fix)')
}

// ---- Check ----
const checkPrompts = [
  `Mechanical anchor check, no judging. Collect every {path, pattern} object at any depth of ${SPEC_JSON}. Save them to a temp file and, with a short node script (String.indexOf, so no shell quoting touches the patterns), test that each pattern occurs in ${REPO}/<path>. Return {bad:["<path> :: <pattern>", ...]} for each one not found. Write nothing.`,
  `Mechanical leak check, no judging. Apply the case-insensitive regex /${LEAK.source}/i to (1) ${SPEC_MD} outside its "## Provenance" section and (2) every string value in ${SPEC_JSON}. Return {hits:["<file> :: <matched text> :: <context>", ...]}. Write nothing.`,
  `Canon check of the player-facing strings in ${SPEC_MD} and ${SPEC_JSON} (labels, fiction names, plate questions, legend lines, notice voices). ${VOCAB_RULE} The old Tithe POI names (and the word "tithe") are allowed only inside a "## Renames" section of the .md AND in the rename unit's JSON fields (/units, /rules, /renames: title, covers, acceptance cmds and greps such as "grep -ci tithe maps-site/index.html") — exempt from this vocabulary rule; never flag those. Return {violations:["<file> :: <text> :: <why>", ...]}. Write nothing.`
]
const CHECK_LABELS = ['anchor check', 'leak check', 'canon check']
const CHECK_SCHEMAS = [ANCH, HITS, VIOL]
const CHECK_ROLES = ['mech', 'mech', 'audit']
const runChecks = sfx => parallel(checkPrompts.map((t, i) => () => agent(P(t), {label: CHECK_LABELS[i] + sfx, phase: 'Check', schema: CHECK_SCHEMAS[i], ...M(CHECK_ROLES[i])})))
const checkItems = ck => [ck[0] ? ck[0].bad : [], ck[1] ? ck[1].hits : [], ck[2] ? ck[2].violations : []]
async function checkPhase(tag, allowFix) {
  phase('Check')
  let ck = await runChecks(tag)
  const n = checkItems(ck).reduce((t, x) => t + x.length, 0)
  if (allowFix && (n || ck.some(x => !x))) {
    if (n) {
      const [bad, hits, viol] = checkItems(ck)
      const fx = await agent(P(`Fix these check findings in ${SPEC_MD} and ${SPEC_JSON}; keep rule ids, keep /hook and /capture verbatim, change nothing else.
Broken anchors (rewrite to the current literal or drop): ${J(bad)}
Leak hits (move the name into "## Provenance" or reword; the JSON may not contain them at all): ${J(hits)}
Canon violations (reword in the Nīmlad voice; old Tithe names only inside "## Renames" and in the R10 rename unit's JSON title/covers/acceptance, which you must leave verbatim so its grep acceptance still works): ${J(viol)}
${VOCAB_RULE}
Return {md, json, sha_md, sha_json, rules:[{id, from, buildable}], roots_present}.`), {label: 'spec fixer · check' + tag, phase: 'Check', schema: INTEG, ...M('triage')})
      if (fx) spec = fx; else log('check fixer died')
    }
    ck = await runChecks(tag + ' (2)')
  }
  const rd = await crit(P(`Mechanical reader, no judging. Do NOT extract by eye: write ONE short node script that reads ${SPEC_JSON}, resolves every pointer below itself (RFC 6901, JSON.parse and plain property access only), prints the result as JSON, and run it; also run sha256sum on ${SPEC_JSON} and ${SPEC_MD} and node-test the POLISH.md containment. Return the printed values verbatim, by these exact pointers:
- probe_values: for each of ${J(specProbes.map(p => ({id: p.id, pointer: p.pointer})))} → {id, value at that JSON pointer (RFC 6901), or null when it does not resolve or is an object};
- sheet_one_layers = /sheet_one/layers; paint_order = /paint_order; must_classes = /sheets/region/must[].class; forbidden_classes = /sheets/region/forbidden;
- palette_hex = every /palette/*/day value and every /paint/wash_hex/* value (print-sampled wash fills), lowercase; river_town = /picks/river_town {name, x, y}; must_label = /sheet_one/must_label;
- views = /fixtures/views as [{id, sheet, x, y, zoom, mask}] (mask "" when none); bands = {<sheet>: /sheets/<sheet>/band} for every key of /sheets; rule_ids = /rules[].id;
- rules = /rules as [{id, from, buildable}]; units = /units verbatim (each unit with every field as stored in the file); slices = /slices; slice_classes = /slice_classes ({} when absent); checks = /checks verbatim as {<slice>: [{id, cmd, expect}]} ({} when absent; a slice key with no checks stays out or []);
- sha_md, sha_json = sha256sum of ${SPEC_MD} and ${SPEC_JSON};
- prereq_unqueued = the "item" of every /prerequisites entry whose title is not queued in ${REPO}/POLISH.md. An entry is queued when its polish_title is non-empty and occurs in POLISH.md, OR the exact title "Filigree data — <item>" (the title this job's inserts use) occurs there.
Missing values are [] / "" / 0, never invented. Write nothing.`), {label: 'spec reader' + tag, phase: 'Check', schema: READER, ...M('mech')})
  if (rd) for (const [k, d] of [['sha_md', ''], ['sha_json', ''], ['prereq_unqueued', []]]) if (rd[k] == null) { rd[k] = d; log('spec reader omitted optional ' + k) }
  if (rd) {   // the reader is one mechanical agent whose output is the ground truth for spec probes and draw checks: reject what is vacuous or malformed
    rd.reader_fails = []
    if (!rd.must_classes.length) rd.reader_fails.push('reader: /sheets/region/must is empty (the must-classes draw check would pass vacuously)')
    if (!rd.palette_hex.length || !rd.palette_hex.every(h => /^#[0-9a-f]{6}$/.test(lc(h)))) rd.reader_fails.push('reader: /palette/*/day is empty or holds a non-#rrggbb value')
    if (!rd.sheet_one_layers.length) rd.reader_fails.push('reader: /sheet_one/layers is empty')
    for (const [ptr, xs] of [['/sheet_one/layers', rd.sheet_one_layers], ['/sheets/region/must', rd.must_classes]]) {   // G2.6 forbids homesteads on sheet one whatever the spec says
      const home = xs.filter(isHomestead)
      if (home.length) rd.reader_fails.push(`reader: ${ptr} lists ${home.join(', ')} (homesteads wait for the valley sheet; drafts that follow it fail G2.6 forbidden)`)
    }
    if (!rd.must_label.length) rd.reader_fails.push('reader: /sheet_one/must_label is empty')
    if (!rd.rule_ids.length) rd.reader_fails.push('reader: /rules is empty')
  }
  const unitFails = rd ? unitFailures({units: rd.units, slices: rd.slices, slice_classes: rd.slice_classes}, {rules: rd.rules}) : []   // G2.1 reads the file Job 3 consumes
  const checkFails = rd ? checksFailures(rd) : []
  return {ck, rd, unitFails, checkFails}
}

// ---- Cold-cartographer gate ----
const draftBody = (X, tag) => `You are a cartographer who has never seen any source posts or plates. You may read ONLY ${SPEC_MD}, ${SPEC_JSON}, ${OUTABS}/spec/assets/* and your own output directory ${coldDir(X, tag)}/. Anything else you open (including any other directory under ${OUTABS}/cold/, ${OUTABS}/gates/, the bible or the section drafts) is a violation. Do not use the web.
First empty your output directory: rm -rf ${coldDir(X, tag)} && mkdir -p ${coldDir(X, tag)} (anything left there from an earlier run is not your draft and must not be reused).
Draw SHEET ONE from the spec as ${coldDir(X, tag)}/sheet-one.svg:
- viewBox = its bbox in atlas px;
- one <g id="layer-<id>"> per painted layer, in paint order;
- every label is a <text> with data-class and data-rank, positioned in atlas px;
- fills/strokes only as palette hex or /paint/wash_hex values (or none);
- the base may be embedded as <image>;
- mark every overlay shield with a data-shield attribute and give its centre as data-x / data-y in atlas px.
Answer every probe below (id, q, kind, options only): answers = [{id, value, rule (the spec rule id or section you used)}]. Answer in exactly the format q asks for and, where a probe lists options, with exactly one of those tokens (an order probe: those tokens, as an array, in order); a paraphrase is scored wrong.
Probes: ${probeList}
List each guess you had to make as {what, needed_for, spec_ref (the spec section you looked in, or "")}.
List every file you opened (absolute paths) in files_read.
Return {svg (its path), answers, guesses, files_read}.`
async function coldGate(tag) {
  phase('Cold-cartographer gate')
  const pairs = await pipeline(['A', 'B'],
    X => agent(P(draftBody(X, tag), true), {label: 'drafter ' + X + tag, phase: 'Cold-cartographer gate', schema: DRAFT, ...M(X === 'A' ? 'deep' : 'judge')}),
    (d, X) => d && agent(P(`Mechanical SVG extraction, no judging. With a short node script (regex/DOM parse) read ${coldDir(X, tag)}/sheet-one.svg and return:
- layers: the id of every <g id="layer-…"> in document order;
- colors: every fill / stroke value (attributes and style declarations), lowercase, de-duplicated, url(...) references skipped;
- labels: every <text> as {text (trimmed text content), class (data-class), rank (data-rank as a string), x, y (numbers, atlas px)};
- shields: every element with a data-shield attribute as {x: data-x, y: data-y}.
Write nothing.`), {label: 'svg extractor ' + X + tag, phase: 'Cold-cartographer gate', schema: SVGX, ...M('mech')}).then(e => ({d, e})))
  const slot = {A: pairs[0] || null, B: pairs[1] || null}
  const live = ['A', 'B'].filter(X => slot[X])
  let raster = null
  if (live.length) {
    raster = await agent(P(`Rasterize these SVG drafts with headless Chromium (Playwright from NODE_PATH=/opt/node22/lib/node_modules; the browser lives under /opt/pw-browsers; never run playwright install): ${live.map(X => `${coldDir(X, tag)}/sheet-one.svg -> ${coldDir(X, tag)}/sheet-one.png`).join('; ')}. Width 1600 px, each PNG <= 300 KB (re-encode smaller if needed). Return {pngs:[paths], infra_error:""}; if the browser cannot start, return infra_error = the message.`),
      {label: 'rasterize' + tag, phase: 'Cold-cartographer gate', schema: RASTER, ...M('audit')})
    if (raster && raster.infra_error.trim()) return {infra: raster.infra_error.trim()}
  }
  const pngWant = ['A', 'B'].map(X => `${coldDir(X, tag)}/sheet-one.png`)
  let pngOk = false
  if (live.length === 2 && raster) {
    const listed = pngWant.every(w => raster.pngs.some(p => absP(p) === w))
    if (!listed) log('rasterize did not list both PNGs: G2.8 not run')
    else {
      const sz = await agent(P(`Mechanical check, no judging. Run stat -c %s on each of ${pngWant.join(' ')} and return {sizes:[{path, bytes}]} (bytes 0 when the file is missing). Write nothing.`), {label: 'png stat' + tag, phase: 'Cold-cartographer gate', schema: SIZES, ...M('mech')})
      pngOk = !!sz && pngWant.every(w => sz.sizes.some(x => absP(x.path) === w && x.bytes > 0))
      if (!pngOk) log('PNG stat ' + (sz ? 'found a missing or empty PNG' : 'agent died') + ': G2.8 not run')
    }
  }
  const both = pngOk
  const [aud, div] = await parallel([
    async () => live.length ? agent(P(`Audit the cold drafters' guesses against the sheet spec ${SPEC_MD} and ${SPEC_JSON}. Guesses: ${J(live.map(X => ({drafter: X, guesses: slot[X].d.guesses.map((q, i) => ({n: i + 1, ...q}))})))}
Return exactly one verdict per guess, none skipped. For each guess return {drafter, n (its number), guess (its "what"), class: "answered" (the spec does answer it: quote the spec text) | "gap", quote, pointer: the JSON pointer under one of ${SPEC_ROOTS.join(' ')} the guess concerns, or "" for a choice outside that schema}. Write nothing.`), {label: 'guess auditor' + tag, phase: 'Cold-cartographer gate', schema: AUDIT, ...M('judge')}) : null,
    async () => both ? agent(P(`Compare two independent drafts of sheet one: ${pngWant.join(' and ')}, against the spec ${SPEC_MD} and ${SPEC_JSON} only (open nothing else). blocking = every place the drafts diverge on something a spec rule governs, as {spec_rule (the /rules id), pointer, a (what A drew), b (what B drew)}; minor = other differences, one line each. Write nothing.`), {label: 'divergence judge' + tag, phase: 'Cold-cartographer gate', schema: DIVERGE, ...M('judge')}) : null
  ])
  return {tag, slot, raster, aud, div, both}
}

function scoreGate(g, rd) {
  const out = {per: {}, wrongBoth: [], drawBoth: []}
  for (const X of ['A', 'B']) {
    const s = g.slot[X]
    if (!s) { out.per[X] = null; continue }
    const ans = new Map(s.d.answers.map(a => [a.id, a.value])), vals = new Map(rd.probe_values.map(v => [v.id, v.value]))
    const wrong = probes.filter(p => !probeEq(p, ans.get(p.id), p.source === 'spec' ? vals.get(p.id) : p.expected)).map(p => p.id)
    out.per[X] = {pct: percent(probes.length - wrong.length, probes.length), wrong,
      draw: s.e ? drawFailures(s.e, rd) : ['extractor: agent died: svg extractor ' + X], blind: blindBad(s.d.files_read, DRAFTER_ALLOWED(X, g.tag))}
  }
  if (out.per.A && out.per.B) {
    out.wrongBoth = out.per.A.wrong.filter(id => out.per.B.wrong.includes(id))
    const noise = out.per.A.wrong.concat(out.per.B.wrong).filter(id => !out.wrongBoth.includes(id))
    if (noise.length) log('one-drafter probe misses (noise, not fixed): ' + noise.join(', '))
    out.drawBoth = out.per.A.draw.filter(x => out.per.B.draw.some(y => y.split(':')[0] === x.split(':')[0]))
  }
  out.gaps = g.aud ? g.aud.verdicts.filter(v => v.class === 'gap' && underRoots(v.pointer)) : null
  out.unaudited = []   // every (drafter, guess) pair needs a verdict, matched by number or by guess text; a skipped guess is never read as answered
  if (g.aud) for (const X of ['A', 'B']) if (g.slot[X]) g.slot[X].d.guesses.forEach((q, i) => {
    if (!g.aud.verdicts.some(v => v.drafter === X && (v.n === i + 1 || norm(v.guess) === norm(q.what)))) out.unaudited.push(`${X}#${i + 1}: ${q.what}`)
  })
  if (g.aud) { const oos = g.aud.verdicts.filter(v => v.class === 'gap' && !underRoots(v.pointer)); if (oos.length) log('out-of-schema gaps (logged only): ' + oos.map(v => v.guess).join(' | ')) }
  out.blocking = g.div ? g.div.blocking.filter(b => rd.rule_ids.includes(b.spec_rule) || underRoots(b.pointer) || (log('blocking divergence with unrecognised spec_rule kept (G2.8 fails on it): ' + J(b)), true)) : null
  return out
}

function criteriaOf(st) {
  const {ck, rd, sc, g} = st
  const nullPtr = specProbes.filter(p => { const v = rd.probe_values.find(x => x.id === p.id); return !v || v.value == null }).map(p => p.id)
  const dead = X => 'agent died: drafter ' + X
  const per = sc.per
  const g21 = st.unitFails.concat(st.checkFails, secFails, pre.ground_six.length || !pre.class_ids.length ? [] : ['ground_six unavailable: preflight returned no ground-six classes although the bible has classes; slice coverage unchecked'])
  return [
    G20,
    C('G2.1', 'traceability + DAG + acceptance + slices + mandatory U00/U01 + non-empty /checks per slice + a phone check per slice + Job 3 required check ids + no /checks regression in a fix round', g21.length ? g21 : 'ok', 'all code checks', !g21.length),
    C('G2.2', 'anchors resolve (by pattern)', ck[0] ? ck[0].bad : 'agent died: anchor check', '0 bad', !!ck[0] && !ck[0].bad.length),
    C('G2.3', 'leak check', ck[1] ? ck[1].hits : 'agent died: leak check', '0 hits', !!ck[1] && !ck[1].hits.length),
    C('G2.4', 'spec answers every spec probe pointer', nullPtr, '0 null', !nullPtr.length),
    C('G2.5', 'probe accuracy', {A: per.A ? per.A.pct : dead('A'), B: per.B ? per.B.pct : dead('B')}, 'each drafter >= 90%', !!per.A && !!per.B && per.A.pct >= 90 && per.B.pct >= 90),
    C('G2.6', 'draw checks', {A: per.A ? per.A.draw : dead('A'), B: per.B ? per.B.draw : dead('B')}, 'both drafts pass all', !!per.A && !!per.B && !per.A.draw.length && !per.B.draw.length),
    C('G2.7', 'schema-path gap guesses', !sc.gaps ? 'agent died: guess auditor' : sc.unaudited.length ? {gaps: sc.gaps.map(v => v.drafter + ': ' + v.guess + ' @ ' + v.pointer), auditor_incomplete: sc.unaudited} : sc.gaps.map(v => v.drafter + ': ' + v.guess + ' @ ' + v.pointer), '0 gaps; every guess audited', !!sc.gaps && !sc.gaps.length && !sc.unaudited.length),
    C('G2.8', 'blocking divergences', sc.blocking ? sc.blocking : g.both ? 'agent died: divergence judge' : 'not run: needs both drafts and both rasterized PNGs confirmed on disk', '0', !!sc.blocking && !sc.blocking.length),
    C('G2.9', 'red-team contradictions', red ? red.contradictions : 'agent died: red-team', 'last pass 0', redClean),
    C('G2.10', 'canon/voice', ck[2] ? ck[2].violations : 'agent died: canon check', '0 violations', !!ck[2] && !ck[2].violations.length),
    C('G2.11', 'blind compliance (allowlist check on self-reported files_read)', {A: per.A ? per.A.blind : dead('A'), B: per.B ? per.B.blind : dead('B')}, '0 reads outside DRAFTER_ALLOWED', !!per.A && !!per.B && !per.A.blind.length && !per.B.blind.length),
    C('G2.12', 'coverage (kept() on sections, pickers, judges)', coverage.map(([w, , m]) => w + ' ' + m), '>= 75% of each fan-out', coverage.every(([, ok]) => ok)),
    C('G2.13', 'gate views: /fixtures/views = V1-V7 seeds (sheet, centre, mask), zoom = band midpoint', st.viewFails.length ? st.viewFails : 'ok', '0 mismatches', !st.viewFails.length)
  ]
}

async function evaluate(tag, allowFix) {
  const {ck, rd, unitFails, checkFails} = await checkPhase(tag, allowFix)
  if (!rd) return {deadReader: 'spec reader' + tag}
  const g = await coldGate(tag)
  if (g.infra) return {infra: g.infra}
  const sc = scoreGate(g, rd)
  const st = {ck, rd, sc, g, unitFails, checkFails, viewFails: viewFailures(rd).concat(rd.reader_fails || [])}
  st.criteria = criteriaOf(st)
  return st
}

let st = await evaluate('', true)
if (st.deadReader) return died(st.deadReader)
if (st.infra) { log('infra: ' + st.infra); return done({reason: 'infra', rounds, owner_rulings_used: RUSED}) }
const FIXABLE = ['G2.1', 'G2.2', 'G2.3', 'G2.4', 'G2.5', 'G2.6', 'G2.7', 'G2.8', 'G2.10', 'G2.11', 'G2.13']
const fixableFailing = s => s.criteria.filter(c => FIXABLE.includes(c.id) && !c.pass && (c.id !== 'G2.1' || s.unitFails.length || s.checkFails.length)).map(c => c.id)   // G2.1 failing on section failures alone is not fixable here

// ---- Fix ----
let chkBase = chkMap(st.rd.checks)   // carried across rounds so a check dropped in round n still fails in round n+1 until restored
while (rounds < ROUNDS && fixableFailing(st).length) {
  if (budgetLeft() < ROUND_TOKENS) { log(`budget: ${budgetLeft()} tokens left < ${ROUND_TOKENS}; fix round skipped; the gate fails on its own criteria`); break }
  rounds++
  const tag = ' r' + rounds
  phase('Fix')
  const {ck, rd, sc} = st
  const nullPtr = specProbes.filter(p => { const v = rd.probe_values.find(x => x.id === p.id); return !v || v.value == null })
  const cite = {
    probes_both_wrong: sc.wrongBoth.map(id => { const p = probes.find(x => x.id === id); return p.source === 'spec' ? {id, q: p.q, source: 'spec', pointer: p.pointer} : {id, q: p.q, source: p.source, cite: p.cite, expected: p.expected} }),
    null_pointers: nullPtr.map(p => ({id: p.id, q: p.q, pointer: p.pointer})),
    schema_gaps: sc.gaps || [], blocking_divergences: sc.blocking || [], draw_checks_both_failed: sc.drawBoth,
    leak_hits: ck[1] ? ck[1].hits : [], canon_violations: ck[2] ? ck[2].violations : [], broken_anchors: ck[0] ? ck[0].bad : [],
    unit_failures: st.unitFails, checks_missing: st.checkFails, view_mismatches: st.viewFails.length ? {mismatches: st.viewFails, seeds: VIEWS_SEED} : [], roots_missing: SPEC_ROOTS.filter(r => !UNIT_ROOTS.includes(r) && !spec.roots_present.map(x => '/' + String(x).replace(/^\/+/, '')).includes(r))
  }
  const fx = await crit(P(`You are the spec fixer, round ${rounds}. Patch ${SPEC_MD} and ${SPEC_JSON} ONLY where cited below; keep every rule id, keep /hook and /capture verbatim, keep units/slices/slice_classes unless a unit failure is cited. Each "both wrong" probe means the spec is ambiguous there: make the answer explicit (never mention probes or drafters in the spec). For a source "spec" probe, make the value at its pointer explicit. For a bible/brief/ruling probe, the correct answer is its "expected" value, fixed by its cite (B-xx = that density-bible rule in ${BIBLE}; brief pN = page N of ${BRIEF}; Rnn = that ruling below): align the spec with that rule, page or ruling so it states that answer unambiguously. Each null pointer: put the answer at exactly that JSON pointer. Each schema gap: state the missing decision at its pointer. View mismatches: rewrite /fixtures/views as one {id, sheet, x, y, zoom, mask} per seed (id, sheet, x, y and mask exactly as seeded, mask "" when none) with zoom = the midpoint of /sheets/<sheet>/band. Each checks_missing entry: write /checks/<slice> for that slice as [{id, cmd, expect}] (a command printing JSON plus a condition on it, as section s12 specifies) so every slice A-D has at least one. For a checks_missing entry about a missing "phone" check, APPEND to that slice's existing /checks/<slice> and keep every existing check byte-for-byte (never rewrite, rename or drop one; Job 3 refuses a slice whose /checks lacks any of these required ids: ${J(JOB3_REQ_CHECKS)}); if that slice already holds a check with id "phone", correct that one check in place instead of adding a second, keeping or tightening every threshold it already states (a looser viewport, a dropped key or --cells, or a relaxed bound is a regression). The phone check is exactly {id: "phone", cmd: the capture run (node tools/filigree-capture.js, --metrics including phone) with --phone 390x664@3 and --cells <hexes.json> on that slice's gate views, expect: phone.overlaps = 0 (FM3), phone.hscroll false (FM3), phone.min_name_px null or >= 12 and phone.min_italic_px null or >= 11 (upright names 12 px, italic names 11 px: R2, FM3), and phone.wrong_taps = 0 as a number (FM3, FM4)}; state these thresholds verbatim in expect, never looser. For a checks_missing entry saying a slice lacks a required check id, APPEND one {id, cmd, expect} check under exactly that id (case-sensitive, no extra spaces) that measures what the id names, keeping every existing check byte-for-byte. For an entry saying a check was dropped or changed during a fix round, restore that check exactly as the entry quotes it. Only an entry saying the slice is missing or empty is written whole, and then it also holds the phone check and, for slices A and B, every required id above.
${J(cite)}
Rulings:
${rulingText(RUL, Object.keys(RULINGS))}
${VOCAB_RULE}
Return {md, json, sha_md, sha_json, rules:[{id, from, buildable}], roots_present}.`), {label: 'spec fixer' + tag, phase: 'Fix', schema: INTEG, ...M('judge')})
  if (!fx) return died('spec fixer' + tag)
  spec = fx
  const freshFails = unitFailures(units, spec), allUnitFails = st.unitFails.concat(freshFails.filter(x => !st.unitFails.includes(x)))   // the fixer may have changed the buildable rules
  if (allUnitFails.length) {
    const u3 = await crit(P(unitPrompt(allUnitFails)), {label: 'unit planner' + tag, phase: 'Fix', schema: UNITS, ...M('judge')})
    if (!u3) return died('unit planner' + tag)
  }
  st = await evaluate(tag, false)
  if (st.deadReader) return died(st.deadReader)
  if (st.infra) { log('infra: ' + st.infra); return done({reason: 'infra', rounds, owner_rulings_used: RUSED}) }
  const reg = checkRegressions(chkBase, st.rd.checks, cite.unit_failures.concat(cite.checks_missing))   // mutates chkBase
  if (reg.length) {
    log('fix round ' + rounds + ' regressed /checks: ' + reg.join(' | '))
    st.checkFails = st.checkFails.concat(reg.filter(r => !st.checkFails.includes(r)))
    st.criteria = criteriaOf(st)
  }
}

// ---- Record ----
phase('Record')
const rd = st.rd
const arts = [[OUT + '/sheet-spec.md', SPEC_MD, rd.sha_md], [OUT + '/sheet-spec.json', SPEC_JSON, rd.sha_json],
  [OUT + '/density-bible.json', OUTABS + '/density-bible.json', pre.bible_sha256], [OUT + '/gates/2-probes.json', OUTABS + '/gates/2-probes.json', probesSha]]
  .map(([path, abs, h]) => ({path, abs, sha256: lc(h)}))
for (const [a, h] of [[arts[0], spec.sha_md], [arts[1], spec.sha_json]]) if (SHA_OK(a.sha256) && SHA_OK(lc(h)) && lc(h) !== a.sha256) { log(`${a.path}: reader sha ${a.sha256} != writer sha ${lc(h)}; re-hashed`); a.sha256 = '' }
const unhashed = arts.filter(a => !SHA_OK(a.sha256))
if (unhashed.length) {   // Job 3 refuses to start unless the recorded spec sha equals the file's, so an empty sha is re-read, never recorded under a pass
  log('artifact shas missing, re-reading: ' + unhashed.map(a => a.path).join(', '))
  const hr = await crit(P(`Mechanical check, no judging. Run sha256sum on each of ${unhashed.map(a => a.abs).join(' ')} and return {hashes:[{path, sha256}]} (sha256 "" when the file is missing). Write nothing.`),
    {label: 'artifact hasher', phase: 'Record', schema: HASHES, ...M('mech')})
  if (hr) for (const a of unhashed) { const h = hr.hashes.find(x => absP(x.path) === a.abs); if (h && SHA_OK(lc(h.sha256))) a.sha256 = lc(h.sha256) }
}
const noSha = arts.filter(a => !SHA_OK(a.sha256)).map(a => a.path)
const criteria = st.criteria.concat([C('G2.14', 'artifact hashes recorded (sha256 of spec md/json, bible, probes)', noSha.length ? {missing: noSha} : 'ok', 'four 64-hex shas', !noSha.length)])
if (probesAfterSpec) gaps.push('probes were written while a sheet spec already existed (resume:false rerun)')
if (st.sc.gaps) for (const v of st.sc.gaps) gaps.push(`gap (${v.drafter}) ${v.pointer}: ${v.guess}`)
for (const u of st.sc.unaudited || []) gaps.push('guess not audited: ' + u)
for (const sid of secLost) gaps.push('section lost: ' + sid)
for (const sid of secBad) gaps.push('section rule format failed (rewritten on the resume rerun): ' + sid)
const gate = gateObj({criteria, rounds, rulings_used: RUSED, gaps, picks, pick_tally: pickTally, probes_written_after_spec: probesAfterSpec,
  artifacts: arts.map(a => ({path: a.path, sha256: a.sha256}))})
const ledger = ledgerOf(arts[3].sha256, {md_sha256: arts[0].sha256, json_sha256: arts[1].sha256})
const recs = await parallel([
  () => record('gates/2-plan.json', gate),
  () => record('gates/views.json', {date: DATE, views: rd.views}),
  () => record('state/2-plan.json', ledger)
])
const per = st.sc.per
const nSlice = s => (rd.slices[s] || []).length
const nDiv = st.sc.blocking ? st.sc.blocking.length : 'n/a'
const failing = criteria.filter(c => !c.pass).map(c => c.id)
const summary = {
  rounds, outputs: [OUT + '/sheet-spec.md', OUT + '/sheet-spec.json', OUT + '/spec/', OUT + '/gates/2-probes.json', OUT + '/gates/views.json', OUT + '/cold/', OUT + '/gates/2-plan.json'],
  gate_path: OUT + '/gates/2-plan.json', owner_rulings_used: RUSED,
  polish_note: `sheet spec: ${rd.rule_ids.length} rules, ${rd.units.length} units (A ${nSlice('A')} · B ${nSlice('B')} · C ${nSlice('C')} · D ${nSlice('D')}); cold drafters ${per.A ? per.A.pct : 'dead'}%/${per.B ? per.B.pct : 'dead'}% probes, ${nDiv} blocking divergences (round ${rounds})`,
  polish_inserts: rd.prereq_unqueued.map(t => `- [ ] **Filigree data — ${t}**`),   // each placed directly above Filigree 3 (R21)
  changelog_line: '- docs: Filigree 2 — sheet spec for the table map (cold-cartographer gate ' + (gate.pass ? 'pass' : 'fail') + ')'
}
if (recs.some(x => !x)) return done({...summary, pass: false, reason: 'record-mismatch'})
return done({...summary, pass: gate.pass, reason: gate.pass ? '' : FORCE ? 'forced: ' + FORCE : (failing.length ? failing.join(',') : MODE)})
