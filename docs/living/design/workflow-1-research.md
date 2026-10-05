# Workflow 1 · `living-1-research.js` — Living 1 · Research → living bible (still-frame gate)

> Planning snapshot, 2026-10-05 (final integrated plan). Where the committed script and this document disagree, the
> script wins. This document also holds **the living prelude** (§0), shared byte for byte by all four living scripts.
> Staged by this session at `docs/living/design/workflows/living-1-research.js`; installed into `.claude/workflows/`
> only by the central item "Living 0" inside the UG11 install window.

## 0. The living prelude (one block; exact derivation)

**Derivation (exact).** Start from the street prelude of `.claude/workflows/street-1-research.js`: the text from the
line that starts `// ==== street prelude v1` through the line `// ==== end street prelude ====`. Then:

1. replace the seven whole lines that `tools/street-drift.js` masks (START, END, OUT, DOCS, FULLOUT, J1FORCE, ANCHORS;
   each matched exactly once) with the living lines shown in the block (START `// ==== living prelude v1 — …`, END
   `// ==== end living prelude ====`, `const OUT = String(A.outDir || 'docs/living')…`, `const DOCS = REPO +
   '/docs/living'…`, the FULLOUT and J1FORCE lines naming docs/living and `living-1-research`, and the living
   `ANCHORS` list);
2. replace the street config region (from `// ---- street config ----` through `// ---- end street config ----`,
   both lines included) with the living config region (from `// ---- living config ----` through `// ---- end living
   config ----`), placed where the street region was, just above END.

Nothing else changes: every other line is byte-identical to the street prelude, which `tools/street-drift.js` D1
proves equal to **filigree prelude v1** under the same masks. So the living prelude, with its config region stripped
and the masks applied, equals filigree prelude v1 masked (`tools/living-drift.js` L1). Inside the config region,
`recordL` is filigree-1's `recordD` with exactly two substitutions (L4); `canonJ`, `fnv`, `lenOk` are byte copies of
the `mobile-build.js` lines (L3); `SANDBOX_LC` names filigree-3's sandbox tokens plus mobile-build's four font
packages (L3). The four living scripts carry this block byte-identically (L2). It was produced mechanically by
`docs/living/design/build/gen-prelude.js` (delivered beside `living-config.js`, the config region's source, and
`proto-check.js`) from the checkout of 2026-10-05: `node docs/living/design/build/gen-prelude.js --splice
docs/living/design/workflow-1-research.md` writes `prelude.js` beside itself and replaces this section's block and sha;
`node docs/living/design/build/proto-check.js` checks it (L1, L3, L4, L5 pass; AsyncFunction parse ok; no forbidden
token, `\brequire\b` included), sha256
`4a2644bc0c897f38d4baa0f16c9b00e44701e0ae36a173b111724496e59eb912`. The implementer of U02 regenerates it the same way from the current street prelude and the config
region below, never by hand.

What the prelude gives every job (inherited from filigree prelude v1, unchanged): args validation (`date` required,
`mode` full|smoke|plan, `repo`, `outDir` under `docs/living` in full mode or an absolute dir outside the repo in smoke
mode, `maxRounds` 0..2, `resume`, `force` a reason string, never on Living 1), `die`, `PAIR`/`M`/`MO`, `crit`, `kept`,
`RULE`/`NOGIT_RULE`/`P`, `READBACK`, `FILE_OK`, `VOCAB`, `CLOCK_GREP`, the blindness allowlist (`absP`, `blindBad`),
`ANCHOR_TASK`/`anchorsLost`/`anchorMap`, `record` (never used by living bodies), `C`, `gateObj`, `done`, and the
filigree `RULINGS` R1-R22 (read-only; `args.rulings` is refused by the config). The living config adds the LC
rulings and their merge, the cited R/ST ids, the vocabulary, the sandbox, the hold, the relay check and `recordL`.

```js
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
```

## 1. meta (exact literal)

```js
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
```

## 2. Args

Shared (prelude) with the living rules: `date` (required), `repo`, `outDir` (default `docs/living`), `mode`
(`full|smoke|plan`), `maxRounds` (0..2, default 2), `resume` (default true). `force` is refused (J1FORCE line);
`rulings` is refused (config: R overrides come only from `docs/filigree/rulings.json`). Job keys, validated after the
first body line `checkArgs(['livingRulings', 'port', 'cdnDir'])`:

| arg | default | rule |
|---|---|---|
| `livingRulings` | `{}` | config: keys ⊆ LC1..LC17, non-empty strings; LC2, LC3, LC10, LC12, LC13 refused (`living ruling … is a fixed constraint`) |
| `port` | 0 | config: 0 or 1024..65535, never 8544 |
| `cdnDir` | — | an absolute path matching `PATH_OK` (else `args.cdnDir must be an absolute path …`), passed to every capture and instrument run as `--cdn-dir`; absent, each relay builds its own temp dir T per `SANDBOX_LC` (`mktemp -d`, then `npm pack leaflet@1.9.4 three@0.128.0 @fontsource/eb-garamond@5.3.0 @fontsource/lora@5.3.0 @fontsource/ibm-plex-mono@5.3.0 @fontsource/im-fell-english@5.3.0` there; npm works while the CDNs are blocked) and returns its path; T is never assumed to survive a resume (a resumed run rebuilds it) |

## 3. Constants (job body)

```js
checkArgs(['livingRulings', 'port', 'cdnDir'])
if (A.cdnDir != null && (typeof A.cdnDir !== 'string' || !PATH_OK.test(A.cdnDir) || !A.cdnDir.startsWith('/'))) die('args.cdnDir must be an absolute path of letters, digits and _ / . + - only')
const CDN = A.cdnDir || null   // null: each capture relay builds T per SANDBOX_LC
const ROUND_TOKENS = 1200000   // one follow-up round (≤ 28 agents incl. appliers); read by the config's lowBudget()
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
const QUESTIONS = [ /* §5.2 table: {id, role, lens, topic, brief} */ ]
const seenQ = new Set(QUESTIONS.map(q => norm(q.topic)))   // follow-up dedup (P7; the prelude's norm); grows with every accepted follow-up
```

## 4. Schemas (JSON; every `agent()` that returns data passes one)

```js
const S = {type: 'string'}, B = {type: 'boolean'}, I = {type: 'integer'}, N = {type: 'number'}, SA = {type: 'array', items: S}, OBJ = {type: 'object'}
const PRE = {type: 'object', properties: {missing: SA, anchors: OBJ, chain: {type: 'object', properties: {f4: OBJ, rm_checked: B, l0_checked: B, sheet_spec_sha: S, density_bible_sha: S, filigree_views_sha: S}, required: ['f4', 'rm_checked', 'sheet_spec_sha', 'density_bible_sha', 'filigree_views_sha']},
  overrides: {type: 'object', properties: {lc: OBJ, fil: OBJ, st: OBJ}, required: ['lc', 'fil', 'st']}, ledger: OBJ, gate_prev: OBJ, tool_shas: OBJ}, required: ['missing', 'anchors', 'chain', 'overrides', 'ledger', 'gate_prev', 'tool_shas']}
const HOLD = {type: 'object', additionalProperties: true, properties: {ok: B, len: I, sum: S}, required: ['ok', 'len', 'sum']}
const DRIFT = {type: 'object', properties: {living: OBJ, street: OBJ}, required: ['living', 'street']}
const CITE = {type: 'object', properties: {st_texts: OBJ, fil_texts: OBJ, sha: OBJ}, required: ['st_texts', 'fil_texts', 'sha']}   // cited ST texts (ST_RULINGS + docs/street/rulings.json overrides) and R texts (RULINGS + docs/filigree/rulings.json overrides), sha of each source
const TOOLW = {type: 'object', properties: {path: S, sha256: S, modes: SA, notes: S}, required: ['path', 'sha256', 'modes']}
const TOOLC = {type: 'object', properties: {a: HOLD, b: HOLD, equal: B, sha256: S, contract_ok: B, infra_error: S}, required: ['a', 'b', 'equal', 'sha256', 'contract_ok', 'infra_error']}   // two --self-test lines (each ok/cases/len/sum)
const FREEZE = {type: 'object', additionalProperties: true, properties: {ok: B, len: I, sum: S}, required: ['ok', 'len', 'sum']}   // the instrument's --freeze-summary line: views[{id, zoom, bbox, center, focus_inside_data, still_sha}], view_data{LVn:{features:{file:count}, sea_frac}}, moved[], refrozen, keys_n, views_sha
const L0R = {type: 'object', properties: {path: S, sha256: S, exit_code: I, profile_errors: SA, profiles: SA, shots_ok: B, atlas_sha: S, index_sha: S, reused: B, infra_error: S}, required: ['path', 'sha256', 'exit_code', 'profile_errors', 'profiles', 'shots_ok', 'atlas_sha', 'index_sha', 'reused', 'infra_error']}
const QFILE = {type: 'object', properties: {path: S, sha256: S, parsed: B, claims_n: I, gaps_n: I}, required: ['path', 'sha256', 'parsed', 'claims_n']}
const ANCH = {type: 'object', properties: {qid: S, claims: {type: 'array', items: {type: 'object', properties: {id: S, found: B}, required: ['id', 'found']}}}, required: ['qid', 'claims']}
const LENS = {type: 'object', properties: {qid: S, struck: SA, corrected: {type: 'array', items: {type: 'object', properties: {id: S, fix: S}, required: ['id', 'fix']}}}, required: ['qid', 'struck', 'corrected']}
const BIBLE = {type: 'object', properties: {md: QFILE, json: QFILE}, required: ['md', 'json']}
const VALID = {type: 'object', additionalProperties: true, properties: {ok: B, len: I, sum: S}, required: ['ok', 'len', 'sum']}   // --validate-bible line: errors[], devices{id:{moves, default, status, band, zones, still_rule, canon_tier, driving_state, owner_gate, home}}, sheet_wide[], checklist{devices_n, asks_n, missing[]}, canon_mismatch[], vocab_hits[], forbidden_rules[], refs_total
const ITEM = {type: 'object', properties: {class: S, state: S, tier: S, still: S, ref: S}, required: ['class', 'state', 'tier', 'still', 'ref']}
const APPLY = {type: 'object', properties: {views: {type: 'object', additionalProperties: {type: 'object', properties: {move: {type: 'array', items: ITEM}, still: {type: 'array', items: ITEM}, silent: B}, required: ['move', 'still', 'silent']}}, lv9_move: SA, files_read: SA}, required: ['views', 'lv9_move', 'files_read']}
const RESOLVE = {type: 'object', additionalProperties: true, properties: {ok: B, len: I, sum: S}, required: ['ok', 'len', 'sum']}   // --resolve-refs line: resolved{ref: bool}
const AMBIG = {type: 'object', properties: {view: S, verdict: S, bible_says: S, cite: S}, required: ['view', 'verdict', 'bible_says', 'cite']}
const CRITIC = {type: 'object', properties: {followups: {type: 'array', items: {type: 'object', properties: {id: S, role: S, topic: S, brief: S, why: S}, required: ['id', 'role', 'topic', 'brief', 'why']}}}, required: ['followups']}
const PATCH = {type: 'object', properties: {md: QFILE, json: QFILE, patched: SA}, required: ['md', 'json', 'patched']}
```

## 5. Agents (one job each; `PL(...)` prompts unless marked blind; model/effort from `M(role)`)

### 5.1 Preflight, instrument, freeze

| label | phase | role → model/effort | prompt essentials | schema |
|---|---|---|---|---|
| `preflight` | Preflight | triage → sonnet/low | `ANCHOR_TASK` (living ANCHORS); inputs exist: `DOSSIER`, `TODO`, `RULINGS_JSON`, `${FIL}/density-bible.json`, `${FIL}/sheet-spec.json`, `${FIL}/gates/views.json`, `${FIL}/gates/hexes.json`, every `maps-site/data` file of LV_RULES; chain: the highest `${FIL}/gates/4-review-c<k>.json` `{k, pass, forced}`; POLISH `rm_checked` and `l0_checked` (informational: Living 0 is a POLISH blocker, not a script check, so its own install-time preview can run); sha256 of sheet-spec, density bible and filigree views; overrides: `RULINGS_JSON.overrides`, `${FIL}/rulings.json.overrides`, `${STD}/rulings.json.overrides`; the ledger `LEDGER` and `GATE1` (parsed or null); `tool_shas` of `tools/mobile-capture.js`, `tools/mobile-tree.js`, `tools/living-measure.js` (or null) | `PRE` |
| `hold` | Preflight | triage | `HOLD_TASK_LC` | `HOLD` |
| `drift` | Preflight | triage | `DRIFT_TASK_LC` | `DRIFT` |
| `cite` | Preflight | triage | evaluate `ST_RULINGS` from `street-1-research.js` (literal, `new Function`), merge `${STD}/rulings.json` overrides; take the prelude R texts of `FIL_CITED` (passed in the prompt) merged with `${FIL}/rulings.json` overrides; return the texts of `ST_CITED` and `FIL_CITED` and sha256 of the three source files | `CITE` |
| `instrument` | Instrument | deep → sonnet/high | write `MEASURE` to the contract of §5.4 (and its toy layers under `TOY`); read `tools/mobile-capture.js` for the exported functions and the virtual clock; never edit it; `SANDBOX_LC`; never 8544 | `TOOLW` |
| `instrument check` | Instrument | triage | run `node tools/living-measure.js --self-test` twice (each `--cdn-dir ${CDN || 'T'}`), return both stdout lines parsed unchanged, `equal` (the two lines with `len`/`sum` dropped compare equal as text), sha256 of the tool, `contract_ok` = `node tools/living-drift.js --json` check L7 ok | `TOOLC` |
| `instrument fix <n>` (≤ 2) | Instrument | deep | the failing self-test case ids and details verbatim; fix only `MEASURE` and `TOY` | `TOOLW` |
| `freeze` | Freeze | triage | when `VIEWS_JSON` exists and `RESUME`: `node tools/living-measure.js --check-views --views VIEWS_JSON --rules <tmp/rules.json from LV_RULES>`; else `--freeze-views --rules … --out VIEWS_JSON --stills VIEW_DIR`; then `--view-data --views VIEWS_JSON --out VIEW_DATA`, `--keys --out KEYS_JSON`, `--dark-scan --out <tmp>` (adds `tDark` to the summary), and finally `--freeze-summary --views VIEWS_JSON --view-data VIEW_DATA --keys KEYS_JSON` whose one line is returned unchanged | `FREEZE` |
| `L0` | Freeze | triage | when `L0` exists, `RESUME` and every desktop/desktop2x shot of it re-hashes: return it with `reused:true`; else `node tools/mobile-capture.js --atlas --profiles iphone13,pixel7,landscape,desktop,desktop2x --unit L0 --out ${OUTABS}/captures/L0.json --shots-dir ${OUTABS}/shots/L0 --cdn-dir ${CDN || 'T'} --port ${PORT}` (absolute paths, so a smoke run writes only under its own outDir) (wait for any running capture as `RO_RULE_LC` bounds it: at most 20 minutes, then `infra_error: "capture busy"`; never kill); return path, sha256, exit, profile errors, profiles present, shots ok, `meta.atlas_sha`, `meta.index_sha` | `L0R` |

### 5.2 Research questions (one agent each, in parallel; output `RESEARCH/<qid>.json` = `{qid, claims:[{id:"<qid>-cNN", text, anchor|data_ref|metric, canon_tier?}], gaps:[]}`, `READBACK`)

| id | role | lens | the one question |
|---|---|---|---|
| q02 | audit | second-look | Which code moves the atlas today? Every rAF caller, CSS animation, timer and clock token in `maps-site/index.html` with `path:line`, whether each stops when hidden or reduced, measured with `living-measure --frames --living 0` rAF counts on LV1 and LV3. |
| q03 | audit | second-look | How does one still-chart control write the atlas's one motion state? `jReduceMq`, `jReduced()`, `jrn.forceReduced`, `#jbar-reduce`, `setRoutePlaying` after the reduced-motion item; what journey playback does under it; why no second `matchMedia` is needed. |
| q04 | audit | recount | Which existing pane hosts the living canvas? The pane list and z order from `L0`, what `pJTrail` holds, the name panes above it, the frozen filigree pane table (`sheet-spec.json`, read-only), and how the Leaflet Renderer.js scheme keeps a canvas in step during `zoomanim`. |
| q05 | deep | refute | Where exactly do the routes run? `party-route.json` stops and `via[]`, JPATH arc length, the legs the journey treats as teleports, named ways vs traced roads vs the print (px offsets), the sea-lane splines, top-origin conversion, and the Fell Mountains placement (marker y −93 vs `party-route.json` index 4, 0-based). |
| q06 | deep | second-look | Does the sheet-wide sea mask serve the shimmer? If "Living · the sheet-wide sea mask (tool)" is checked: water fraction per view (view-data), the harbour and DEM-agreement tests; else what the mask would need. Never Filigree's mask outside the window. |
| q07 | audit | second-look | What river data exists? Filigree 3's in-window `rivers.json` (present, overlap check), the later sheet-wide trace, and which river devices stay deferred. |
| q08 | audit | refute | What would the living traffic snapshot hold? `W.agents` fields (route, departDay, speed, kind), `routePos`, `W.routeVolume`/`pairLoads`, `W.seaRoutes`, via `living-measure --export-traffic --seed epeshu --day <d> --out <tmp>` (a temp path, never `maps-site/`); the sim-to-atlas window transform; bytes; the display noun for the sim's ship kind. |
| q09 | audit | second-look | What is the dark hour in closed form? `const darkHour =`, `_tamarDir`, `renderTod` (300 s per drawn day) copied into a presentation-day function; `--dark-scan` gives tDark; the dim amount that stays under the name panes. |
| q10 | deep | refute | What does canon back for each of the 21 devices? Against `wiki-places.json`, `party-route.json`, `reviews.json`, `party.json`, `lexicon/patrinaic.json`: the Loon Sea placement (no atlas coordinates; print lettering or none), Lugal, hoarwyrms and Witch-Birds, the storm season, each device's tier against the research table. |
| q11 | audit | second-look | Which words may the chart show? The display nouns (*mūskar*, *khophesh*, galley), the proposed strings (`todo-inputs.json` `strings`), `VOCAB_LC` and the UG9 words, the voice rubric (`docs/mobile/voice-rubric.md`, read-only). |
| q12 | audit | second-look | What does the zoom-through stand on? `street=` in `index.html`, `docs/street/gates/views.json` and its stills, `ANNALS.street`, "Sim ↔ atlas continuity", the Epēshu landmarks in `chart-pois.json`, the band from `Z_OPEN_MAX` to `Z_STREET` in the window; what slice Z waits for. |
| q13 | triage | recount | What may the chart cost in bytes? `L0` iphone13 first view (bytes, requests), the LC14 hook ceiling, lazy chunk estimates, gzip by `server.js`, the offline manifest (present? does any captured desktop view show a size it derives?). |
| q14 | judge | refute | Which bible classes are these devices? Map every device onto the filigree density-bible classes (B-18 `caravan_halt`, B-37 `fog_wash`, B-41 `muster_day`, B-42 `shut_way`) and the street bible's classes when present; which device reads `notices=` (shut ways), read-only. |

### 5.3 Verify, synthesize, gate, follow-up, record

| label | phase | role | prompt essentials | schema |
|---|---|---|---|---|
| `anchor <qid>` | Verify | mech → haiku/low | for each claim's `anchor` (`path:pattern`) or `data_ref`: found with String.indexOf / JSON pointer; strings only, no sha relays | `ANCH` |
| `lens <qid>` | Verify | refute → judge (opus/high); recount → triage; second-look → audit | refute: try to break each claim from its cited source; recount: re-run the numbers by command; second-look: re-read the cited spans; return struck and corrected ids | `LENS` |
| `integrator` | Synthesize | integ → opus/xhigh | surviving claims (struck removed, corrections applied), `DOSSIER`, `TODO` (devices, canon, budgets, corrections, views, strings), merged LC rulings (`lcRulingsMerge`), cited R/ST texts; write `BIBLE_MD` (sections per device, views, asks, debts, `## Provenance`) and `BIBLE_JSON` = `{devices:{<id>:{class_id, filigree_class, canon_tier, default, owner_gate, driving_state, moves, still_rule, band:[zmin,zmax], zones:[…], data_refs:[…], still_frame, cost:{draws_per_s, bytes_gz}, slice, status, home}}, sheet_wide:[…], asks:{…6}, rules:[{id, kind, text, covers}], debts:[…]}`; `VOCAB_LC_RULE`; never a new sim state, pane, clock token, WebGL or `notices=` write | `BIBLE` |
| `validator` | Synthesize | triage | write the constants `{DEVICES, ASKS, CANON_TABLE, LC_IDS, VOCAB_LC: source, JARGON_LC: source}` (passed in the prompt as JSON) to a temp file; run `node tools/living-measure.js --validate-bible BIBLE_JSON --md BIBLE_MD --constants <tmp>`; return its line unchanged | `VALID` |
| `applier A` / `applier B` | Still-frame gate | deep / judge, **blind** (`NOGIT_RULE`) | may read ONLY `BIBLE_MD`, `BIBLE_JSON`, `VIEWS_JSON`, `VIEW_DIR`, `VIEW_DATA`, `L0`, `${REPO}/maps-site/data/`, `${FIL}/density-bible.json`; per view LV1-LV8: the classes that move there and ≥ 2 that stay still, each `{class, state, tier, still, ref}`, or `silent:true` when the bible does not say; `lv9_move`; list every file read | `APPLY` |
| `resolver` | Still-frame gate | triage | write every ref of both appliers to a temp JSON; `node tools/living-measure.js --resolve-refs <tmp>`; return the line unchanged | `RESOLVE` |
| `ambiguity <LVn>` | Still-frame gate | judge | only for a view (≤ 4, lowest agreement first) where the two appliers' moving sets differ from each other: which reading the bible supports, with a cite; never overrides a code score | `AMBIG` |
| `critic` | Follow-up | judge | the failing criteria and gaps, and every question already asked (ids and topics, all rounds); ≤ `ROUND_Q` fresh questions with role and brief; code drops any whose `norm(topic)` is in `seenQ` or whose id repeats an asked id, logs the drops, then slices to `ROUND_Q` | `CRITIC` |
| `follow-up <id>` + `anchor`/`lens` | Follow-up | per question | as 5.2 and Verify | `QFILE`, `ANCH`, `LENS` |
| `patcher` | Follow-up | integ | patch `BIBLE_MD`/`BIBLE_JSON` from the new verified claims only; list patched ids | `PATCH` |
| `hold (record)` | Record | triage | `HOLD_TASK_LC` again (coexistence shas) | `HOLD` |
| `record …` ×3 | Record | `recordL` (triage) | `gates/1-research.json`, `gates/1-view-answers.json`, `state/1-research.json` | `RECD` |

### 5.4 The instrument contract (`tools/living-measure.js`, written by the `instrument` agent)

- Requires from `./mobile-capture.js` only names in its `module.exports` (L7): `startServer`, `launch`,
  `loadPlaywright`, `resolveCdn`, `openPage`, `pump`, `PROFILES`, `clockTokens`, `imageDiff`, `pngDecode`,
  `pngEncode`, `braceRange`. Never edits it, never writes `docs/mobile/`, never binds 8544 (`--port`, 0 default).
- Every summary mode prints ONE JSON line `{"ok":true,…,"len":N,"sum":H}` with `len`/`sum` over the key-sorted JSON of
  the other fields exactly as `tools/mobile-tree.js` (FNV-1a 32), or `{"ok":false,"error":…}` and exit 1.
- Modes: `--self-test`; `--freeze-views --rules F --out F --stills D`; `--check-views --views F --rules F`
  (prints `moved`); `--view-data --views F --out F` (per view: features in the viewport bbox per data file, `sea_frac`
  from `maps-site/living/sea-mask.png` when present); `--keys --out F` (every output key it can emit, frozen as
  `gates/measure-keys.json`; later versions may add keys, never drop one); `--dark-scan`; `--freeze-summary`;
  `--frames --views F [--ids …] --profiles p,q --living 0|1 --t a,b[,c] --scenarios s1,… [--runs 2] --out F
  [--shots-dir D]` with scenarios `moving still reduce hidden card layer-off below-band offscreen zoom-anim
  block-chunk coexist` (coexist = `filigree=1&living=1`), reporting per view × profile × scenario: `glyphs
  [{class,id,x,y,alpha}]` in atlas px, `glyph_sha`, `class_counts`, `raf_living` (callbacks over 120 pumped frames),
  `draws_per_s`, `still_sha`, `console_errors`, `page_errors`, `label_overlap_px`, `zoom_drift_px`,
  `transform_during_zoomanim`, `alpha_ramp_ms_max`, `control {present, rect, aria_label, pressed}`, `j_reduced`,
  `journey_playing`; before `maps-site/living.js` exists every on-run reports `living:"absent"` and still measures
  today's motion owners; `--static [--hooks <living-spec.json>]` (clock tokens by pattern W in `maps-site/living.js` and
  `maps-site/living/**`; forbidden names `createPane matchMedia W.rng getContext('webgl` `THREE` and the five atlas
  function names; gz bytes per lazy file; the raw growth `size(maps-site/index.html) − size(restore(...))`; the hook
  table `[{line, marked, declared, replaces_found}]`; `restore_sha`; `strings` from the `LC_STRINGS` literal of
  `living.js`; `notices_writes`); `--export-traffic --seed S --day D --out F`; `--validate-bible F --md F --constants
  F`; `--resolve-refs F`; and, for Living 2, `--spec-summary SPEC --bible BIBLE --md MD` (the units, rules, slices,
  hook lines, caps, eases, template, strings and prerequisites of `docs/living/living-spec.json` in the shape of
  workflow 2 §5.3, flattened to the fields its G2 criteria read) and `--resolve-pointers SPEC --answers F --probes F`
  (JSON-pointer resolution of every reader answer and every probe's `spec_pointer`).
- Living 3's slice L0 extends the instrument with `--gate-summary F --spec F --slice S` (the GL numbers of workflow 3
  §8 as one line), `--lint-on F` and `--score F --frames F` (the on-state accept files), as tool units; an
  extension may add keys to `gates/measure-keys.json` and never drops one (Living 3 checks the key list ⊇ Living 1's).
- The virtual clock is the capture's: rAF timestamps come from the pumped virtual time, so a frozen clock gives a
  frozen frame; `--t` pumps to an instant.
- `--self-test` copies `maps-site/` to a temp dir (never edits the repo), injects the toy loader there, and checks:
  the pass toy layer passes every scenario; each fail toy (rAF while hidden, a position from `Math.random`, a
  `createPane`, a 600 ms fade-in, a glyph inside a label box, an error on a blocked chunk) fails exactly its metric;
  `double-run` equal; `seed-sensitivity` (one keyed seed shifted moves `glyph_sha`). Cases `[{case, ok, detail}]`.

## 6. Control flow

```text
P0  [preflight, hold, drift, cite] = parallel(4 crit agents)
    any slot null (crit already retried once) -> return done({reason:'agent died: <preflight|hold|drift|cite>'}) before any dereference
    anchorsLost(anchors)      -> die('anchor lost: ' + list)
    !drift.living.ok || !drift.street.ok -> die('prelude drift: ' + failing check ids)
    MODE==='plan'             -> return done({reason:'plan', agents_bound, chain_ok, missing, held_by, plan:{questions:QUESTIONS.map(q=>q.id), views:LV_RULES.map(v=>v.id)}})   // as Livings 2-4: missing inputs, the Filigree 4 chain and the reduced-motion item reported in chain_ok:false, never thrown
    missing.length            -> die('missing inputs: ' + missing)
    holdOf(hold, 'freeze') non-empty -> return done({reason:'held', held_by, polish_note:'Living 1: held (' + why[0] + '); no release'})
    !(chain.f4 && chain.f4.pass && !chain.f4.forced) -> die('living research waits for the finished table map: the latest docs/filigree/gates/4-review-c<k>.json is not an unforced pass')
    !chain.rm_checked         -> die('living research waits for the atlas reduced-motion item')
    gate_prev && gate_prev.pass && RESUME && inputs re-hash -> return done({pass:true, reason:'already passed: …'})
P1  Instrument: skip when tool_shas.living-measure equals the ledger's and its self-test passes; else instrument -> check -> (fix -> check) ≤ 2;
    a null instrument or check after its retry -> G1.11 false (recorded gap, as a failing self-test)
    still failing -> criteria G1.11 false (the run continues to Record with the gap; no gate pass)
P2  Freeze: freeze (moved non-empty in full mode -> die('fixtures changed (moved: ' + ids + '); delete docs/living/gates/views.json and docs/living/gates/view/ to re-freeze'))
    a null freeze or L0 -> return done({reason:'agent died: <freeze|L0>'}); L0 infra_error (incl. "capture busy") -> return done({reason:'infra', …})
P3  Research: questions whose evidence re-hashes in the ledger are skipped; the rest run in parallel; kept(…, 'research') below 75% -> return done({reason:'agent died: research'})
P4  Verify: per question anchor + lens in parallel (no pipeline(): one parallel over all 2×n agents; null slots logged);
    struck claims dropped, corrections applied (code); a null anchor or lens agent leaves that question's claims
    unverified: they are kept out of the integrator's input and recorded as gaps (never silently confirmed)
P5  Synthesize: integrator (crit; null -> return done({reason:'agent died: integrator'})) -> validator (crit); !lenOk(validator) or null -> one fresh validator; still bad -> G1.9/G1.10/G1.13 false
P6  Gate: applier A ‖ applier B -> resolver -> ambiguity per disputed view -> score G1.1..G1.14 in code (a null applier
    scores 0 on every criterion it feeds; a null resolver resolves no ref; a null ambiguity judge is logged and ignored)
P7  Follow-up (r = 1..ROUNDS while some criterion fails and is follow-up-fixable):
    if (lowBudget()) { log('budget: follow-up round skipped'); break }
    critic -> filter through seenQ (drops logged) -> ≤ ROUND_Q questions (each accepted norm(topic) added to seenQ) -> verify -> patcher -> validator -> appliers -> resolver -> re-score
P8  Record: hold (record) -> coexistence (G1.14); recordL GATE1, ANSWERS, LEDGER; a record-mismatch -> reason 'record-mismatch' (the script's object is still returned)
```

Computed sets (code, from the validator's `devices` and the freezer's `views`/`view_data`): a device is **present** on a
view when the view's zoom lies in its `band` and one zone holds: `sheet`; `bbox` intersecting the view bbox; `data`
with ≥ 1 feature of that file in `view_data`; `mask:sea` with `sea_frac > 0`. **Moving set** = present ∧ `moves` ∧
`default === 'on'` ∧ `status === 'build'`. **Still set** = present ∧ (`!moves` ∨ `still_rule`).

## 7. Gate G1 — the still-frame test (scored in code; `gateObj`, every criterion must pass)

| id | criterion |
|---|---|
| G1.1 | per applier: named moving set = computed moving set on ≥ 7 of 8 gate views, and Jaccard ≥ 0.75 on all 8 |
| G1.2 | per applier: ≥ 2 still classes named per view, each in the computed still set, on ≥ 7 of 8 views |
| G1.3 | per applier: ≥ 95% of named classes carry the bible's `driving_state` and `canon_tier` |
| G1.4 | refs: ≥ 90% resolve per applier overall, no view below 75% (`--resolve-refs`) |
| G1.5 | reality: every computed moving class of every gate view has ≥ 1 source feature in `view_data`, or is in `sheet_wide` |
| G1.6 | canon: every device's `canon_tier` equals `CANON_TABLE`; every `invented`/`invented-behaviour` device has `default:'off'` and an LC `owner_gate`; a device with no data source is `deferred` with a POLISH `home`; `LC-rise` is `ruled-out` (LC10) |
| G1.7 | control view: both appliers' `lv9_move` ⊆ `sheet_wide` |
| G1.8 | zero `silent:true` |
| G1.9 | checklist 27/27: every id of `DEVICES` (21) and `ASKS` (6) has an entry (`checklist.missing` empty) |
| G1.10 | `forbidden_rules` empty: no rule adds sim state, a pane, a clock token, WebGL in `maps-site/` or a `notices=` write |
| G1.11 | instrument: both self-test lines `lenOk` and `ok`, every case ok, `equal`, `contract_ok`, `KEYS_JSON` written |
| G1.12 | fixtures: 9/9 views resolved with `focus_inside_data`, `moved` empty, `L0` exit 0 on the five profiles with no profile error and `shots_ok` |
| G1.13 | voice: `vocab_hits` empty (bible strings and fiction fields outside `## Provenance`) |
| G1.14 | blindness and coexistence: `blindBad(files_read, ALLOWED)` empty for both appliers; the Record hold `shas` equal the preflight's for `index`, `atlas`, `maps_other`, `docs_filigree`, `docs_street`, `docs_mobile`, `workflows`, `tools_other` |

Gate object: `gateObj({criteria, rounds, artifacts:[bible md/json, views, view-data, keys, L0, instrument with sha256],
rulings_used:{lc: LCR.used}, cited:{fil: cite.fil_texts, st: cite.st_texts, sha: cite.sha}, stamps:{sheet_spec,
density_bible, filigree_views, mobile_capture, mobile_tree}, gaps})`. Living 2-4 compare `cited` and `stamps` with
the current files and refuse when they moved.

## 8. Loop bounds and the agent bound

- `maxRounds` ≤ 2 follow-up rounds, each ≤ 4 questions deduplicated against every question already asked (`seenQ`),
  each round gated by `lowBudget()` (`ROUND_TOKENS` 1200000); instrument fixes ≤ 2; `crit()` gives one retry per critical
  singleton; ambiguity judges ≤ 4 per round (the disputed views with the lowest agreement first); a question that dies
  twice is a recorded gap.
- `agents_bound` (printed in plan mode, computed in code; `crit` agents count twice): preflight 4×2 = 8; instrument
  1 + 2 + 2×(1 + 2) = 9; freeze 2×2 = 4; research 13; verify 26; synthesize 2×2 = 4; gate appliers 2×2 + resolver 2 +
  ambiguity ≤ 4 = 10; follow-up 2 rounds × (critic 2 + 4 researchers + 8 verify + patcher 2 + validator 2 + appliers 4
  + resolver 2 + ambiguity 4) = 56; record (hold + 3 records)×2 = 8; total **138**; README §11 cap **150**. A typical
  run is about 60.

## 9. Outputs and return

Writes only under `docs/living/` and `tools/living-measure.js` (the one durable write outside `docs/living/`, by design:
the instrument mirrors the filigree probe tool and Living 3 extends it): `living-bible.{md,json}`, `research/q02–q14.json`
(13 files; q01 is the instrument and has no research file) (and `f<r><n>.json`), `fixtures/toy/`, `gates/views.json`, `gates/view/LV1–LV9.png` (≤ 300 KB, `full_path` kept),
`gates/view-data.json`, `gates/measure-keys.json`, `captures/L0.json` (+ git-ignored `shots/L0/`),
`gates/1-research.json`, `gates/1-view-answers.json`, `state/1-research.json`.

Return (`done`): `{job, date, mode, pass, reason, rounds, outputs, polish_note, polish_inserts, polish_inserts_above:
'Living 2 · Planning', changelog_line, owner_rulings_used, forced_by, gate_path, agents_bound, held_by?}`.
- pass: `polish_note` "Living 1: living bible, N devices, gate views 8/8 (min Jaccard x), refs y%, round r",
  `changelog_line` "docs: living chart — the living bible (Living 1)".
- fail after the rounds: `polish_inserts` one `Living gap — <criterion id>: <one-line why>` per failing criterion,
  deduplicated in code against `seenIns = new Set(hold.polish.living.gap_open.map(norm))` (the queued gap titles of the
  preflight hold) and each other, drops logged; `reason` the failing ids joined by `,`.
- `held`, `plan`, `infra`, `agent died: <label>`, `already passed: …`, `record-mismatch` as README §1.6.

## 10. What this stage reuses (exactly)

- **Copied:** filigree prelude v1 under the street masks (§0); `recordD` → `recordL`; mobile-build's `canonJ`/`fnv`/
  `lenOk` lines; the sandbox recipe of filigree-3 + mobile-build's font packages.
- **Ported:** the Street 1 skeleton (probe/instrument → freeze → questions → verify lenses → integrator → validator →
  paired blind appliers → resolver → critic), with Street's freeze-once rule and ledger.
- **Run, never edited:** `tools/mobile-capture.js` (the L0 capture; its exported functions inside the instrument),
  `tools/living-drift.js`, `tools/street-drift.js`, `tools/filigree-dem.js` (read by q06 only through the sea-mask
  check), the filigree and street `ANCHORS` (through `FIL_ST_ANCHOR_TASK` when q04 needs them).
- **Cited by id, read-only:** filigree R6 R10 R12 R13 R15 R16 R18 R22 and the density-bible classes B-18 B-37 B-41
  B-42; street ST1 ST3 ST4 ST7 ST18; the filigree gate views (LV2 = V1) and fixture F08; UG1-UG11.

## 11. Stub run (the U02 acceptance harness)

In a `mktemp -d` dir: load the script text, strip `export ` from line 1, build `new AsyncFunction('agent', 'parallel',
'pipeline', 'phase', 'log', 'args', 'budget', 'workflow', body)`, and run it with a stub `agent(prompt, opts)` that
returns canned objects by `opts.label` (preflight with an unforced passing f4, `rm_checked`/`l0_checked` true; a
`hold` line built with the real `fnv`/`canonJ` so `lenOk` passes; drift ok; …). Required outcomes: `mode:'plan'`
returns `{pass:false, reason:'plan'}` with `agents_bound` 138 ≤ 150 (with `l0_checked` false too); a hold line with one open Mobile item returns
`reason:'held'`; an f4 of `{pass:false}` throws `living-1-research: living research waits for the finished table map
…` in full mode and returns `reason:'plan'` with `chain_ok:false` in plan mode; a null `cite` slot returns `agent died:
cite`; a critic that re-proposes q05's topic yields no follow-up and a log line; a stub `budget` whose `remaining()` is
below `ROUND_TOKENS` runs no follow-up round and logs `budget: follow-up round skipped`; a relative `cdnDir` throws the
cdnDir rule; a mis-relayed hold (one hex digit of `sum` changed) returns `held` with "hold read died or mis-relayed"; a
`mode:'full'` stub run whose canned answers satisfy every criterion returns `pass:true` with 14 criteria, and the same
run with applier B off by one class on two views returns `pass:false` with only G1.1 failing. No stub reads a clock or
a random number.
