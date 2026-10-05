export const meta = {
  name: 'mobile-review',
  description: 'Mobile track review of one POLISH item or one whole lane (Mobile 9 = atlas lane MR-A, Mobile 14 = sim lane MR-S): the mechanical gates (combined acceptance with UG1-UG11 coverage, UG2 page errors, street-drift, manifest checks) fail it in code whatever the votes; five blind finder lenses (determinism, desktop identity, phone parity, voice, delay-not-drop and quality) over the item diff and a fresh five-profile capture; each finding reproduced, refuted (opus/high) and rated (sonnet/low), surviving on 2 of 3 votes; an opus/high judge rules; writes docs/mobile/reviews/<item>.json and returns the blocker/major list',
  whenToUse: 'After mobile-build.js finished a POLISH item (every unit passed), or as Mobile 9 / Mobile 14: Workflow({name:"mobile-review", args:{item:"Mobile 9", date:"YYYY-MM-DD", diff:"<scratchpad>/mobile-9.diff"}}) or args {lane:"atlas"|"sim", date, diff}. The central session makes the diff (agents never run git); mode:"plan" returns the schedule and the paths with no agent. Read-only on the tree: it writes only under docs/mobile/reviews/ and its capture docs/mobile/captures/review-<item>.json.',
  phases: [
    {title: 'Preflight', detail: 'state.json statuses and app shas (rebase rule), the diff and its paths (lane discipline), accept files, references, tools'},
    {title: 'Capture', detail: 'one fresh five-profile capture of the tree, then the mechanical scoring: compare vs B0/R1, the combined acceptance of every unit in scope, drift, manifests, the sim_after_mobile_pass grep'},
    {title: 'Find', detail: 'five blind single-lens finders (<=3 findings each in round 0, <=1 in extra rounds); code-sourced findings survive without a vote (votes only add findings)'},
    {title: 'Verify', detail: 'dedup, then reproduce (sonnet/medium), refute (opus/high) and severity (sonnet/low) in parallel per finder finding; survive on >=2 of 3 votes'},
    {title: 'Judge', detail: 'opus/high rules final severity and merges duplicates among survivors (never more than one step lighter than the severity vote)'},
    {title: 'Record', detail: 'docs/mobile/reviews/<item>.json, read back and length-checked; POLISH fix-item text and fix-unit stubs returned for the central session'}
  ]
}
const JOB = 'mobile-review'
const A = (args && typeof args === 'object' && !Array.isArray(args)) ? args : {}
const die = m => { throw new Error(JOB + ': ' + m) }
const ARG_KEYS = ['item', 'lane', 'units', 'date', 'mode', 'repo', 'diff', 'cdnDir', 'maxRounds']
for (const k of Object.keys(A)) if (!ARG_KEYS.includes(k)) die('unknown arg ' + k + ' (accepted: ' + ARG_KEYS.join(', ') + ')')
const DATE = A.date
const dayOk = d => { if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false; const [y, m, n] = d.split('-').map(Number); return m >= 1 && m <= 12 && n >= 1 && n <= [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1] }
if (!dayOk(DATE)) die('args.date must be a "YYYY-MM-DD" string naming a real calendar day (scripts cannot read the clock)')
const MODE = A.mode || 'full'
if (!['full', 'plan'].includes(MODE)) die('args.mode must be full|plan')
const PATH_OK = /^[A-Za-z0-9_\/.+-]+$/   // paths reach unquoted shell lines in prompts; this charset needs no quoting
for (const k of ['repo', 'diff', 'cdnDir']) if (A[k] != null && (typeof A[k] !== 'string' || !PATH_OK.test(A[k]) || A[k].split('/').includes('..'))) die('args.' + k + ' must be a path of letters, digits and _ / . + - only, with no .. segment')
const REPO = String(A.repo || '/home/user/annals-kingdom').replace(/\/+$/, '')
if (!REPO.startsWith('/') || REPO.includes('//')) die('args.repo must be a normalized absolute path')
const ROUNDS = A.maxRounds ?? 1
if (!Number.isInteger(ROUNDS) || ROUNDS < 0 || ROUNDS > 2) die('args.maxRounds must be an integer 0..2 (extra find rounds for lenses that produced survivors)')
if (A.cdnDir != null && !A.cdnDir.startsWith('/')) die('args.cdnDir must be absolute')

// ---- the track's units (units.json run/model fields; README section 6) ----
const UNIT = {
  D1: ['server.js: gzip, MIME, ETag/304, Cache-Control, HEAD, PORT env', 'sonnet'], D2: ['DEPLOY.md rewrite + pages.yml staging', 'sonnet'], D6: ['tools/build-offline-manifest.js', 'sonnet'],
  D3: ['Atlas: vendor Leaflet 1.9.4 and the OFL fonts', 'sonnet'], D5: ['Atlas: versioned rasters (?t=TILES_V)', 'sonnet'], 'A-U1': ['Atlas: the frame (closed sheet clipped, Contents heading safe, safe areas, dvh)', 'sonnet'],
  'A-U2': ['Atlas: absolute reveal bands (A19), pinned to the earlier desktop', 'opus'], 'A-U3': ['Atlas: one coarse-pointer tap resolver and a chooser', 'opus'], 'A-U4': ['Atlas: 44 px touch targets and invisible marker pads', 'sonnet'],
  'A-U8': ['Atlas: the table drawer (one-row header, thumb-zone cluster, layers inside, landscape side sheet)', 'opus'], 'A-U10': ['Atlas: The Whole Chart fits a portrait phone (letterboxed fit-width)', 'sonnet'], 'A-U11': ['Atlas: 720 px overlay previews before the full plate', 'sonnet'],
  D7: ['Atlas worker maps-site/sw.js + sw-kill.js + guarded registration', 'opus'], D9: ['Atlas: "Keep this chart for the table" (size first) and "Keep the chart lit"', 'sonnet'],
  'A-U9': ['Atlas: the place card as a peek / half / full standard sheet', 'sonnet'], 'A-U5': ['Atlas: touch parity (hover gated, halo ring, realm tap, long-press name, census pads)', 'sonnet'], 'A-U6': ['Atlas: search at 16 px with 44 px rows above the keyboard', 'sonnet'],
  'A-U7': ['Atlas: half-step zoom buttons on touch; Save-Data idle tiles', 'sonnet'], 'A-U12': ['Atlas: night-mode pinch measured on phones (no edit)', 'haiku'],
  D4: ['Sim: vendor three r128 and IM Fell English', 'sonnet'], 'S-U1': ['Sim: 44 px controls, HUD 13 px, page zoom allowed', 'sonnet'], 'S-U2': ['Sim: "Return the court" tab and a close button on the full chart', 'sonnet'],
  'S-U3': ['Sim: device classes chosen once at load (creation-time levers only)', 'opus'], 'S-U4': ['Sim: the honest ladder + ANNALS.device() / deviceReport()', 'opus'], 'S-U5': ['Sim: survive WebGL context loss; pause while hidden', 'opus'],
  D8: ['Sim worker sw.js + sw-kill.js + guarded registration', 'opus'], D10: ['Sim: "Keep the realm for the table" (size first) and "Keep the chronicle lit"', 'sonnet'],
  'S-U6': ['Sim: debounced resize with the class pixel ratio; capped graphs canvas', 'sonnet'], 'S-U7': ['Sim: speed controls in a bottom bar on portrait phones; compact landscape HUD', 'sonnet'],
  'S-U8': ['Sim: the ledger as a three-stop sheet', 'sonnet'], 'S-U9': ['Sim: first-touch hint card and per-pointer hint text', 'sonnet'], 'S-U10': ['Sim: Night ink for the HUD, ledger and sheets', 'sonnet']
}
const ATLAS_UNITS = ['D3', 'D5', 'A-U1', 'A-U2', 'A-U3', 'A-U4', 'A-U8', 'A-U10', 'A-U11', 'D7', 'D9', 'A-U9', 'A-U5', 'A-U6', 'A-U7', 'A-U12']
const SIM_UNITS = ['D4', 'S-U1', 'S-U2', 'S-U3', 'S-U4', 'S-U5', 'D8', 'D10', 'S-U6', 'S-U7', 'S-U8', 'S-U9', 'S-U10']
const ITEMS = {
  '3': {lane: 'shared', units: ['D1', 'D2', 'D6']},
  '4': {lane: 'atlas', units: ['D3', 'D5', 'A-U1']},
  '5': {lane: 'atlas', units: ['A-U2', 'A-U3', 'A-U4']},
  '5b': {lane: 'atlas', units: ['A-U2', 'A-U10']},
  '6': {lane: 'atlas', units: ['A-U8', 'A-U10', 'A-U11']},
  '7': {lane: 'atlas', units: ['D7', 'D9']},
  '8': {lane: 'atlas', units: ['A-U9', 'A-U5', 'A-U6', 'A-U7', 'A-U12']},
  '9': {lane: 'atlas', units: ATLAS_UNITS, laneReview: true},
  '10': {lane: 'sim', units: ['D4', 'S-U1', 'S-U2']},
  '11': {lane: 'sim', units: ['S-U3', 'S-U4', 'S-U5']},
  '12': {lane: 'sim', units: ['D8', 'D10']},
  '13': {lane: 'sim', units: ['S-U6', 'S-U7', 'S-U8', 'S-U9', 'S-U10']},
  '14': {lane: 'sim', units: SIM_UNITS, laneReview: true}
}
const LANE_REVIEW = {atlas: '9', sim: '14'}
const LANES = ['atlas', 'sim', 'shared']
const DEFER_OK = ['A-U2', 'A-U10']   // the A19 owner gate: deferred-5b counts as satisfied for dependants (README section 4)
const UNIT_ID = /^[A-Za-z0-9.-]{1,24}$/

let KEY = null, ITEM, LANE, UNITS_IN, LANE_REV = false
if (A.lane != null && !LANES.includes(A.lane)) die('args.lane must be atlas|sim|shared')
if (A.item != null) {
  if (typeof A.item !== 'string' && typeof A.item !== 'number') die('args.item must be a string such as "Mobile 9"')
  const m = String(A.item).trim().match(/^(?:mobile[\s_-]*)?(\d{1,2}b?)$/i)
  if (m && ITEMS[m[1].toLowerCase()]) {
    KEY = m[1].toLowerCase()
    const it = ITEMS[KEY]
    if (A.units != null) die('args.units is only for a fix item that is not in the item table; ' + 'Mobile ' + KEY + ' has fixed units')
    if (A.lane != null && A.lane !== it.lane) die('args.lane ' + A.lane + ' does not match Mobile ' + KEY + ' (' + it.lane + ')')
    ITEM = 'Mobile ' + KEY; LANE = it.lane; UNITS_IN = it.units.slice(); LANE_REV = !!it.laneReview
  } else {
    ITEM = String(A.item).trim()
    if (!/^[A-Za-z0-9 ._-]{1,60}$/.test(ITEM)) die('a fix item name must be 1-60 letters, digits, spaces and . _ -')
    if (!A.lane) die('a fix item (' + ITEM + ') needs args.lane')
    if (!Array.isArray(A.units) || !A.units.length || A.units.length > 20 || A.units.some(u => typeof u !== 'string' || !UNIT_ID.test(u))) die('a fix item needs args.units: 1-20 unit ids')
    LANE = A.lane; UNITS_IN = A.units.slice()
  }
} else {
  if (!A.lane || A.lane === 'shared') die('give args.item ("Mobile 4".."Mobile 14", "Mobile 5b" or a fix item) or args.lane "atlas"|"sim" for the lane review')
  if (A.units != null) die('args.units needs args.item (a fix item)')
  KEY = LANE_REVIEW[A.lane]; ITEM = 'Mobile ' + KEY; LANE = A.lane; UNITS_IN = ITEMS[KEY].units.slice(); LANE_REV = true
}
const SLUG = ITEM.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const APP = LANE === 'atlas' ? ['maps-site/index.html'] : LANE === 'sim' ? ['index.html'] : []
const SURF = LANE === 'atlas' ? '--atlas' : LANE === 'sim' ? '--sim' : '--atlas --sim'
const HAS = s => LANE === s || LANE === 'shared'
const DIFF = A.diff == null ? null : (A.diff.startsWith('/') ? A.diff : REPO + '/' + A.diff.replace(/^(\.\/)+/, ''))
if (MODE === 'full' && !DIFF) die('args.diff is required: the unified diff of ' + ITEM + ' made by the central session (agents never run git); mode:"plan" prints the paths it must cover')
const CDN = A.cdnDir || null

// ---- paths ----
const MD = REPO + '/docs/mobile'
const REV_REL = 'docs/mobile/reviews/' + SLUG + '.json'
const EVID_REL = 'docs/mobile/reviews/' + SLUG + '.evidence.json'
const ACC_REL = 'docs/mobile/reviews/' + SLUG + '.accept.json'
const CAP_REL = 'docs/mobile/captures/review-' + SLUG + '.json'
const PROFILES = ['iphone13', 'pixel7', 'landscape', 'desktop', 'desktop2x']
const GATES = ['UG1', 'UG2', 'UG3', 'UG4', 'UG5', 'UG6', 'UG7', 'UG8', 'UG9', 'UG10', 'UG11'], NEVER_WAIVED = ['UG1', 'UG4', 'UG9', 'UG11']   // mobile-build's rule: these are always listed
let START_REF = null   // the reference in force before the first unit of the scope ran (docs/mobile/state.json units[].ref_before); null -> R1 else B0
const refFile = n => n === 'B0' ? 'docs/mobile/baseline.json' : 'docs/mobile/captures/' + n + '.json'
const ALWAYS_OFF = ['.claude/', 'tools/street-drift.js', 'tools/filigree-', 'tools/street-', 'docs/filigree/', 'docs/street/']   // never in a mobile diff (UG11, coexistence)
const LANE_OFF = {atlas: ['index.html', 'sw.js', 'sw-kill.js', 'offline-manifest.json', 'vendor/'], sim: ['maps-site/'], shared: ['index.html', 'maps-site/index.html']}
const offLane = p => ALWAYS_OFF.concat(LANE_OFF[LANE]).some(x => /[\/-]$/.test(x) ? p.startsWith(x) : p === x)
const SIM_PASS = [['deviceReport', 'deviceReport'], ['webglcontextlost', 'webglcontextlost'], ['visibilitychange', 'visibilitychange'], ['DEVICE class constant', '\\bDEVICE\\b'], ['dc query reader', "get\\(['\"]dc['\"]\\)|[?&]dc="]]   // G14's sim_after_mobile_pass grep (grep -E patterns)

// ---- models (stage-workflows policy; finders follow the plan's rule: opus/high when the scope holds an opus unit) ----
const PAIR = {mech: ['haiku', 'low'], triage: ['sonnet', 'low'], audit: ['sonnet', 'medium'], deep: ['sonnet', 'high'], judge: ['opus', 'high']}
const M = role => ({model: PAIR[role][0], effort: PAIR[role][1]})
const HAS_OPUS = UNITS_IN.some(u => (UNIT[u] || [])[1] === 'opus')
const FINDER_ROLE = HAS_OPUS ? 'judge' : 'deep'
const FIND_CAP0 = 3, FIND_CAP = 1, CODE_CAP = 6, VERIFY_CONC = 6, VERIFY_BOUND = 150, ROUND_TOKENS = 1200000
const SEV = ['blocker', 'major', 'minor', 'nit']
const SEV_RUBRIC = 'blocker = breaks determinism (a simDays(400) fingerprint, rng_next, cityCanvasSha within its class, a clock-token count or per-line multiset, a new W.rng use), breaks coexistence (a flag-1 anchor, /* FILIGREE */ or /* STREET */, tools/street-drift.js, a .claude/workflows or street-drift sha, an edit outside the lane), changes ANNALS.stats() keys, the keydown handler or camera.near, or DROPS a class, name or control from the desktop or from a phone (delay, never drop); major = fails another universal gate (UG1 syntax, UG2 console errors, UG7 panes or tiers, UG8 desktop identity beyond tolerance, UG9 voice, UG10 bytes) or a unit\'s measured acceptance, makes anything on a desktop later, smaller or thinner, delays a phone name past its desktop threshold + 0.5 zoom or its band end, or opens the wrong card on a tap; minor = a visible phone defect inside the rules; nit = taste.'

// ---- prompt rules ----
const J = v => JSON.stringify(v)
const RULE = `Repo root: ${REPO} (cd there first; use absolute paths). Never run git, not even a read-only git command. Never schedule reminders, triggers or wake-ups. This review is read-only on the tree: never edit index.html, maps-site/**, server.js, sw.js, vendor/**, tools/**, .claude/**, POLISH.md, CHANGELOG.md, VERSION, docs/filigree/** or docs/street/**. Write ONLY the files this prompt names; scratch files go in a mktemp -d directory. Never start, stop or reuse a server on port 8544. Return only the requested JSON.`
const P = body => RULE + '\n' + body
const SANDBOX = `Browser runs go only through node ${REPO}/tools/mobile-capture.js, with NODE_PATH=/opt/node22/lib/node_modules (Playwright, Chromium only; never run playwright install). The tool serves the repo itself on a free port. CDNs are blocked in the sandbox: ${CDN ? 'pass --cdn-dir ' + CDN : 'in a mktemp -d directory run npm pack leaflet@1.9.4 three@0.128.0 @fontsource/eb-garamond@5.3.0 @fontsource/lora@5.3.0 @fontsource/ibm-plex-mono@5.3.0 @fontsource/im-fell-english@5.3.0 and pass --cdn-dir <that directory> (the tool reads the .tgz files and renders the production fonts from the fontsource ones)'}. Add --server spawn exactly when ${REPO}/docs/mobile/state.json records units.D1.status "passed" (the edited server.js has landed); otherwise keep the default in-process server (a command line given below decides it for you). One capture at a time: if "pgrep -f 'tools/mobile-capture[.]js'" finds one running, wait for it to exit (poll every 30 s); never start a second one, never kill one. A full capture can take 30 minutes or more: run it in the background with its exit code written to a file, then poll with commands of at most 9 minutes each (e.g. "timeout 540 bash -c 'until [ -f <dir>/code ]; do sleep 15; done'") as many times as needed, up to 2 hours. A setup failure (port, browser, CDN) is an infra_error, never a defect; a capture that is merely still running is neither.`
const READBACK = 'Then re-read the file, JSON.parse it, and return {path, sha256 (sha256sum of the file), chars: (JSON.stringify(parsed, null, 2)).length, parsed: true}.'
const unitList = UNITS_IN.map(u => `${u} (${(UNIT[u] || ['a fix unit'])[0]})`).join('; ')
const BLIND = `You are blind on purpose: do not open docs/mobile/reviews/ (except ${REPO}/${EVID_REL} and ${REPO}/${ACC_REL}), any earlier review record, the build loop's review notes or any transcript.`
const NOT_DEFECTS = 'Not defects: changes an accept file declares (declared_change_keys, mask, declared_clock_lines) unless the change itself breaks a rule; the owner\'s answers in docs/mobile/owner-answers.json (q1 pins tiers B/C to the earlier desktop, so the 1x desktop reveals earlier; q2 fit-width letterbox); the accepted phone presentation scale (lower shadow resolution, no antialias on the phone class); a deferred piece that has its named POLISH home (S15, A12 part b, instance thinning, the shadow freeze, night tiles, WebP, one-finger pan); cityCanvasSha differing on the 1x desktop (a B0 finding: dpr 1 is its own class); sandbox artefacts (SwiftShader timings, blocked font hosts before D3/D4).'

// ---- schemas ----
const S = {type: 'string'}, SA = {type: 'array', items: S}, B = {type: 'boolean'}, I = {type: 'integer'}
const NI = {type: ['integer', 'null']}
const OBJ = (props, req) => ({type: 'object', properties: props, required: req || Object.keys(props)})
const MAPS = {type: 'object', additionalProperties: S}
const PRE = OBJ({state_exists: B, statuses: MAPS, start_ref: S, start_ref_exists: B, state_app_sha: MAPS, now_sha: MAPS,
  diff: OBJ({exists: B, bytes: I, sha256: S, files: SA}), accept_missing: SA, capture_missing: SA,
  refs: OBJ({baseline: B, r1: B, final: B, owner: B}), owner_q1: S, owner_q2: S,
  tools: OBJ({capture: B, drift: B, manifest: B}), server_landed: B})
const CAPT = OBJ({path: S, sha256: S, exit: I, profiles: MAPS, errors: I, infra_error: S})
const FAIL = OBJ({key: S, op: S, expected: S, got: S})
const SCORE = OBJ({path: S, sha256: S, accept_path: S, compare_b0_exit: I, compare_b0_n: I, compare_r1_exit: NI,
  accept_none: B, accept_lint_ok: B, accept_pass: B, failing_n: I, accept_failing: {type: 'array', items: FAIL}, accept_gates: SA, accept_waived: SA,
  drift_exit: I, drift_self_test_exit: I, manifest_atlas_exit: NI, manifest_sim_exit: NI, grep_missing: SA, infra_error: S})
const FIND = OBJ({lens: S, findings: {type: 'array', items: OBJ({id: S, title: S, where: S,
  evidence: OBJ({kind: {type: 'string', enum: ['metric', 'cmd', 'diff', 'shot']}, ref: S}), repro_cmd: S, fix: S, unit_hint: S,
  severity_guess: {type: 'string', enum: SEV}})}})
const DEDUP = OBJ({dupes: {type: 'array', items: OBJ({id: S, of: S})}})
const REPRO = OBJ({id: S, reproduced: B, out: S, infra_error: S})
const REFUTE = OBJ({id: S, refuted: B, why: S, infra_error: S})
const SEVR = OBJ({id: S, real: B, severity: {type: 'string', enum: SEV}, why: S})
const JUDGE = OBJ({rulings: {type: 'array', items: OBJ({uid: S, severity: {type: 'string', enum: SEV}, same_as: S, why: S, fix: S, done_when: S})}})
const FILEREC = OBJ({path: S, sha256: S, chars: I, parsed: B})

// ---- helpers ----
const arr = v => Array.isArray(v) ? v : []
const oneLine = s => String(s ?? '').replace(/\s+/g, ' ').trim()
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9#.-]+/g, ' ').trim()
const isHex = s => /^[0-9a-f]{64}$/.test(String(s ?? ''))
const infraOf = x => oneLine(x && x.infra_error)
const lowBudget = () => !!(budget && budget.total && budget.remaining() < ROUND_TOKENS)
async function crit(p, o) { return (await agent(p, o)) ?? (await agent(p, {...o, label: o.label + ' (retry)'})) }
const result = o => ({job: JOB, date: DATE, mode: MODE, item: ITEM, lane: LANE, lane_review: LANE_REV, units: UNITS_IN, pass: false, reason: '',
  blockers_majors: [], minors: 0, review_path: null, review_sha256: null, capture_path: null, evidence_path: null, gaps: [], polish_inserts: [], fix_units: [], ...o})

// ---- the five blind lenses ----
const LENSES = [
  {id: 'L1', key: 'determinism', check: 'determinism (UG3)', body: () => `UG3. The simDays(400) fingerprints for epeshu and tamar1374 (sim.<profile>.seeds.<seed>.fingerprint) and rng_next equal B0 on all five profiles; once S-U3 has landed also under ?dc=desktop, ?dc=phone and the hardwareConcurrency x deviceMemory matrix; once S-U4 has landed the live-loop checks (60 fps, the 30 fps cap, a forced ladder step, a hidden/resume cycle) stop at the same W.dayTicked with identical fingerprints. Clock tokens are counted by occurrence (repo.clock_tokens in the capture): index.html stays at exactly 37 for the narrow pattern Math[.]random|Date[.]now|new Date[(][)]|performance[.]now and 37 for the wide one, with the per-line token multiset equal to B0 apart from declared lines; maps-site/index.html stays at 1 narrow and 2 wide. No new code names W.rng; the ladder, the hidden pause and the wake lock take time only from the rAF timestamp argument; no device class, viewport, pointer, DPR, memory, core count or ladder step may reach generated or simulated state. ${HAS('atlas') ? 'Atlas: the diff touches none of xmur3, mulberry32, genCityCanvas, washMake or sampleCityMask; cityCanvasSha equals B0 per profile and is equal across the dpr>1 profiles. ' : ''}Read the diff hunk by hunk for any value that could feed seeded generation, and check the capture keys rather than trusting the code reading.`},
  {id: 'L2', key: 'desktop', check: 'desktop identity (UG8, desktop half of UG7)', body: () => `UG8 on desktop (1366x768@1) and desktop2x (1440x900@2): every metric equals the item\'s starting reference (${START_REF ? refFile(START_REF) : "docs/mobile/captures/R1.json where it exists, else B0"}: the capture in force before the first unit of this scope ran, so earlier items\' changes are not this item\'s) apart from declared keys; shot diffs <= 0.5% outside declared masks; the desktop click fixture is equal; ${HAS('sim') ? 'sim renderer parameters and calls/tris at the three views (virtual clock) are equal; ' : ''}${HAS('atlas') ? 'ATLAS.tiers() on both desktops is never later than B0 (the owner\'s q1 pin moves the 1x desktop earlier: ruled, not a defect); ' : ''}every CSS rule and JS branch the diff adds is gated on a coarse pointer, the phone class or a query no fine-pointer desktop or tablet matches: a fine pointer never auto-selects the phone class, (hover:hover) paths are unchanged, "(Esc)" texts stay on fine pointers only, and a touch-screen desktop (pointer:fine with any-pointer:coarse) keeps the desktop path. A phone budget never thins, delays or shrinks anything on a desktop.`},
  {id: 'L3', key: 'parity', check: 'phone parity (taps, reach, bytes, lifecycle)', body: () => [
    HAS('atlas') ? 'Atlas on iphone13, pixel7 and landscape: tap correctness (tap_fixture: each glyph centre opens the right card or the chooser lists every mark within 22 px; faded or tier-hidden glyphs never take a tap; the Epēshu tap at z4.55 no longer opens the Lektān card), long_press names without changing the hash, targets_under_44 (controls and marker pads), min_font_px >= 12 on touch, chrome_cover, share_visible and doc_scroll as the accept files promise, every desktop control reachable in <= 2 steps (reach), first-view bytes and requests on iphone13 never above the declared amount (UG10), repeat-visit cache hits, offline once D7 has landed, and no service worker registered under automation.' : '',
    HAS('sim') ? 'Sim on iphone13, pixel7 and landscape: targets_under_44, top occupancy and ledger cover as promised; the court tab and the chart close each restore in one step; page zoom is not locked; the first-touch hint shows once and never on a desktop; lifecycle: a webglcontextlost/restored cycle keeps the same world, stats, chronicle and fingerprint, a hidden tab pauses and resumes without a jump in W.dayTicked, resize is debounced (10 resizes give one setSize) with the class pixel ratio, the ladder never steps at a virtual 60 fps and honours the 30 fps phone cap; ANNALS.device() and deviceReport() work and stay out of stats(); first-view bytes and requests on iphone13 never above the declared amount (UG10); offline once D8 has landed, and no service worker registered under automation.' : '',
    'Cross-unit: a later unit undoing an earlier unit\'s measured gain (a sheet covering another sheet\'s peek, a chooser under a drawer, rows under the on-screen keyboard, a handle under 48 px) is in scope.'].filter(Boolean).join(' ')},
  {id: 'L4', key: 'voice', check: 'voice (UG9)', body: () => 'UG9. Every new or changed player-visible string in the diff (labels, titles, aria-labels, placeholders, hints, notices, tidings, the size rows) is listed in docs/mobile/README.md section 3 with its surface; fixed forms match docs/mobile/voice-rubric.md exactly (macrons, the ❦, the em dash); no string matches VOCAB (the line starting "const VOCAB =" in .claude/workflows/filigree-1-research.js) or VOCAB_ST (built as tools/street-drift.js builds it from the street config region of .claude/workflows/street-1-research.js): read both regexes from those files, never retype them; none of the interface jargon (tap, click, swipe, pinch, drawer, modal, menu, toggle, dismiss, app, download, install, offline mode, dark mode, theme, settings, save) appears in visible text; years appear only as A.B. and never from the device clock (R12: a snapshot shows its own A.B. date); the words are table words in the chronicle voice (bronze-age Nīmlad, the nine Kembar), never Christian-medieval or software vocabulary. Wiki canon names (for example The Lektān Priesthood) are exempt. Internal ids, class names and comments are out of scope.'},
  {id: 'L5', key: 'quality', check: 'delay, never drop, and quality (UG4-UG7, UG11)', body: () => `Delay, never drop: every class of ink, name, control and panel the desktop shows stays reachable on every phone profile; a phone's held-back name arrives by its desktop threshold + 0.5 zoom or its sheet band end and is never smaller than on the desktop nor under 12 px on touch (R2); nothing is removed to fit, only moved into a sheet, a chooser or a later threshold. Quality: no instance trimming, no static-shadow freeze, ${HAS('atlas') ? 'keepBuffer stays 4, detectRetina kept, ' : ''}no raster, font or render quality reduced for a desktop. Coexistence: every flag-1 anchor literal of the eight workflow scripts is still found (functions are added, never renamed), /* FILIGREE */ and /* STREET */ are absent, grep -ci tithe maps-site/index.html is unchanged, node tools/street-drift.js exits 0; Object.keys(ANNALS.stats()) is unchanged; the keydown handler sha, camera.near = clamp(R*0.02, 0.5, 50), "let fpsAvg = 60, degradeStep" and the wantShadow line are unchanged; the .leaflet-pane list equals B0 (no createPane); the .claude/workflows/*.js and tools/street-drift.js shas equal the references (repo.* keys in the capture). A piece left out must have its named POLISH home (grep POLISH.md). Code quality where it threatens the bar: a listener added per open and never removed, a loop that runs on touch every frame, a layout read-write thrash per frame.`}
]
const LENS_IX = id => LENSES.findIndex(L => L.id === id)

// ---- plan mode: the schedule, no agent ----
const expectAgents = 3 + LENSES.length + 1 + 3 * (LENSES.length * FIND_CAP0) + 2 + ROUNDS * (1 + LENSES.length * (1 + 3 * FIND_CAP))
if (MODE === 'plan') {
  const diffPaths = LANE === 'atlas' ? ['maps-site/', 'tools/art-previews.js', 'docs/mobile/'] : LANE === 'sim' ? ['index.html', 'vendor/', 'sw.js', 'sw-kill.js', 'offline-manifest.json', 'docs/mobile/'] : ['server.js', 'DEPLOY.md', '.github/workflows/pages.yml', 'tools/lint-deploy.js', 'tools/build-offline-manifest.js', 'docs/mobile/']
  return result({reason: 'plan', pass: false, schedule: {
    item: ITEM, slug: SLUG, lane: LANE, lane_review: LANE_REV, units: UNITS_IN.map(u => ({id: u, title: (UNIT[u] || ['a fix unit'])[0], model: (UNIT[u] || ['', 'sonnet'])[1]})),
    app_files: APP, ready_when: `every unit in scope has status "passed" in docs/mobile/state.json (${DEFER_OK.join(' and ')} may be "deferred-5b"), and state.json app_sha equals the tree (else run mobile-build first: the rebase rule)`,
    diff: {arg: 'args.diff', made_by: 'the central session (agents never run git), restricted to the item\'s files since the last release before the item', paths: diffPaths, forbidden: ALWAYS_OFF.concat(LANE_OFF[LANE])},
    phases: ['Preflight', 'Capture', 'Find', 'Verify', 'Judge', 'Record'],
    capture: {path: CAP_REL, cmd: `node tools/mobile-capture.js ${SURF} --profiles ${PROFILES.join(',')} --unit review-${SLUG} --out ${CAP_REL} --cdn-dir <dir>`},
    scoring: {evidence: EVID_REL, combined_accept: ACC_REL, checks: ['--compare vs B0 and R1', 'combined accept of the scope units on the fresh capture', 'street-drift and --self-test', HAS('atlas') ? 'offline manifest --atlas --check (when present)' : '', HAS('sim') ? 'offline manifest --sim --check (when present)' : '', LANE === 'sim' && LANE_REV ? 'sim_after_mobile_pass grep' : ''].filter(Boolean)},
    lenses: LENSES.map(L => ({id: L.id, lens: L.key, check: L.check, ...M(FINDER_ROLE), cap_round0: FIND_CAP0, cap_extra: FIND_CAP})),
    verify: {reproduce: M('audit'), refute: M('judge'), severity: M('triage'), survive: '>= 2 of 3 votes', concurrency: VERIFY_CONC},
    judge: M('judge'), extra_rounds: ROUNDS, agent_bound: VERIFY_BOUND, expected_agents_max: expectAgents,
    outputs: [REV_REL, EVID_REL, ACC_REL, CAP_REL], pass_rule: 'scored in code first, whatever the votes: the capture has all five profiles per lane surface and no page error (UG2); every passed unit has an accept file; the combined acceptance lints, lists UG1 UG4 UG9 UG11 and lists or waives every other gate, passes, and its failing list is intact; street-drift and its self-test exit 0; each offline manifest --check present exits 0. Then: all five lenses ran; no out-of-lane path in the diff; no surviving blocker or major; no unverified finding guessed blocker or major. Votes only add findings: a mechanical failure is never dropped or lightened by one'
  }})
}

// ---- Preflight ----
phase('Preflight')
const gaps = []
const pre = await crit(P(`Preflight read for the mobile review of ${ITEM} (write nothing outside a mktemp -d directory).
1. ${MD}/state.json: state_exists (present and parses). statuses: for each id in ${J(UNITS_IN)}, units[id].status as stored, or "missing". state_app_sha: the stored app_sha object (each value a sha256 string; {} when absent). start_ref: walking ${J(UNITS_IN)} in that order, the first id whose units[id].ref_before is a non-empty string gives start_ref = that string; "" when none does. start_ref_exists: start_ref is non-empty and its file exists and parses (${MD}/baseline.json for "B0", else ${MD}/captures/<start_ref>.json). server_landed: true iff units.D1.status === "passed" (false when the file or the entry is absent).
2. now_sha: {"index.html": sha256sum of ${REPO}/index.html, "maps-site/index.html": sha256sum of ${REPO}/maps-site/index.html}.
3. The diff file ${DIFF}: exists, bytes, sha256; files = every path named on a line that starts with "+++ b/" or "--- a/" (strip that prefix and any trailing tab and timestamp; skip /dev/null), deduplicated and sorted. When it is missing: exists false, bytes 0, sha256 "", files [].
4. accept_missing: the ids from step 1 whose ${MD}/accept/<id>.json is absent; capture_missing: the ids whose ${MD}/captures/<id>.json is absent.
5. refs: baseline = ${MD}/baseline.json parses; r1 = ${MD}/captures/R1.json exists; final = ${MD}/final.json exists; owner = ${MD}/owner-answers.json parses. owner_q1 and owner_q2: its q1 and q2 as strings ("" when null or absent).
6. tools: capture = ${REPO}/tools/mobile-capture.js exists; drift = ${REPO}/tools/street-drift.js exists; manifest = ${REPO}/tools/build-offline-manifest.js exists.
Return {state_exists, statuses, start_ref, start_ref_exists, state_app_sha, now_sha, diff: {exists, bytes, sha256, files}, accept_missing, capture_missing, refs: {baseline, r1, final, owner}, owner_q1, owner_q2, tools: {capture, drift, manifest}, server_landed}.`), {label: 'preflight', phase: 'Preflight', schema: PRE, ...M('mech')})
if (!pre) return result({reason: 'preflight agent died twice'})
const notReady = []
if (!pre.state_exists) notReady.push('docs/mobile/state.json missing (mobile-build writes it)')
for (const u of UNITS_IN) { const s = (pre.statuses || {})[u] || 'missing'; if (!(s === 'passed' || (s === 'deferred-5b' && DEFER_OK.includes(u) && KEY !== '5b'))) notReady.push(`${u} is ${s}`) }
const shaDrift = Object.entries(pre.state_app_sha || {}).filter(([k, v]) => isHex(v) && (pre.now_sha || {})[k] !== v).map(([k]) => k)
if (shaDrift.length) notReady.push('app sha differs from state.json for ' + shaDrift.join(', ') + ': a change the loop did not make; run mobile-build (the rebase rule) before reviewing')
if (!pre.diff || !pre.diff.exists || !(pre.diff.bytes > 0)) notReady.push('the diff ' + DIFF + ' is missing or empty')
if (!pre.refs || !pre.refs.baseline) notReady.push('docs/mobile/baseline.json (B0) missing or unparseable')
if (!pre.tools || !pre.tools.capture) notReady.push('tools/mobile-capture.js missing')
if (notReady.length) { log('not ready: ' + notReady.join('; ')); return result({reason: 'not ready: ' + notReady.join('; ')}) }
const deferred = UNITS_IN.filter(u => (pre.statuses || {})[u] === 'deferred-5b')
const offFiles = arr(pre.diff.files).filter(offLane)
if (offFiles.length) log('lane discipline: the diff touches ' + offFiles.join(', '))
if (pre.accept_missing.length) gaps.push('accept files missing for ' + pre.accept_missing.join(', ') + ' (the combined acceptance covers the rest)')
if (/^(B0|R1|final|rebase-\d+|after-[A-Za-z0-9][A-Za-z0-9._-]{0,31})$/.test(pre.start_ref || '') && pre.start_ref_exists === true) START_REF = pre.start_ref
else gaps.push(pre.start_ref ? `the starting reference ${JSON.stringify(pre.start_ref)} named in state.json is missing or not a reference name: the combined acceptance reads R1 else B0` : 'no unit in scope records ref_before in state.json (built before the reference advanced?): the combined acceptance reads R1 else B0, so earlier items\' changes may show as failures')
if (!pre.refs.r1 && (HAS('atlas') && UNITS_IN.some(u => u !== 'D3' && ATLAS_UNITS.includes(u)) || HAS('sim') && UNITS_IN.some(u => u !== 'D4' && SIM_UNITS.includes(u)))) gaps.push('docs/mobile/captures/R1.json is missing: desktop identity reads B0 (fallback serif) instead of the vendored-font reference')

// ---- Capture ----
phase('Capture')
const cap = await crit(P(`Capture the current tree for the review of ${ITEM} (writes ${REPO}/${CAP_REL} only; the tool also writes its git-ignored shots under docs/mobile/shots/).
${SANDBOX}
Run from ${REPO}: NODE_PATH=/opt/node22/lib/node_modules node tools/mobile-capture.js ${SURF} --profiles ${PROFILES.join(',')} --unit review-${SLUG} --out ${CAP_REL} --cdn-dir <dir>${pre.server_landed === true ? ' --server spawn' : ''}
Use that command line exactly as written: the server choice is decided here. Keep the exit code. Then sha256sum ${CAP_REL} and read it: profiles = {"<surface>": comma-separated profile names present under that top-level key (atlas, sim)}; errors = computed by node (UG2, as tools/mobile-capture.js gateResults reads it): the sum of the "unexplained" field of every errors object (atlas.<profile>.errors, sim.<profile>.seeds.<seed>.errors, and each <surface>.<profile>.extra_errors.<name>), plus 1 for every <surface>.<profile> that carries an "error" string (0 when none).
Return {path: "${CAP_REL}", sha256, exit, profiles, errors, infra_error: "" or the setup failure in one line}.`), {label: 'capture', phase: 'Capture', schema: CAPT, ...M('mech')})
const capOk = !!cap && !infraOf(cap) && cap.exit === 0 && isHex(cap.sha256)
if (!capOk) { log('capture failed: ' + (cap ? infraOf(cap) || 'exit ' + cap.exit : 'agent died')); return result({reason: 'capture failed: ' + (cap ? infraOf(cap) || 'exit ' + cap.exit : 'agent died twice'), gaps}) }
const accFiles = UNITS_IN.filter(u => !pre.accept_missing.includes(u)).map(u => `docs/mobile/accept/${u}.json`)
const score = await crit(P(`Mechanical scoring for the review of ${ITEM}. Write ${REPO}/${EVID_REL} and ${REPO}/${ACC_REL} only; scratch files in a mktemp -d directory. Run every command from ${REPO} with NODE_PATH=/opt/node22/lib/node_modules; keep each exit code and its stdout (parsed JSON when it parses, else the last 2000 characters).
a. compare_b0: node tools/mobile-capture.js --compare docs/mobile/baseline.json ${CAP_REL} (exit 1 only means keys differ; n = its "n").
b. compare_r1: when docs/mobile/captures/R1.json exists, the same against it; else null.
c. Combined acceptance. ${accFiles.length ? `Read ${J(accFiles)}. Build one object: unit "review-${SLUG}"; ${START_REF ? '"baseline": "' + START_REF + '" (the item\'s starting reference, so only this scope\'s own changes are measured); ' : ''}profiles, gates and declared_change_keys = the union in first-seen order; declared_clock_lines, mask, strings and checks = the concatenation in file order; waive = the waive entries (from any file) of gates no file lists; clock "virtual". Write it to ${ACC_REL} (2-space JSON). Run node tools/mobile-capture.js --lint-accept ${ACC_REL}, then node tools/mobile-capture.js --accept ${ACC_REL} --capture ${CAP_REL}. accept_lint_ok = lint exit 0; accept_pass = accept exit 0; accept_failing = its failing list (the first 60), each field converted to a string with JSON.stringify unless already a string; failing_n = the length of its FULL failing list, counted by node on the parsed result (-1 when the output does not parse). accept_gates = the combined file's gates list as written; accept_waived = the keys of its waive object ([] when none). accept_none false.` : `No accept file exists: write {"unit": "review-${SLUG}", "none": true} to ${ACC_REL}; accept_none true, accept_lint_ok false, accept_pass false, failing_n 0, accept_failing [], accept_gates [], accept_waived [].`}
d. node tools/street-drift.js and node tools/street-drift.js --self-test: drift_exit and drift_self_test_exit (-1 when the tool is missing).
e. manifest_atlas_exit: ${HAS('atlas') ? 'when tools/build-offline-manifest.js and maps-site/data/offline-manifest.json both exist, the exit of node tools/build-offline-manifest.js --atlas --check; else null' : 'null'}. manifest_sim_exit: ${HAS('sim') ? 'when tools/build-offline-manifest.js and offline-manifest.json (repo root) both exist, the exit of node tools/build-offline-manifest.js --sim --check; else null' : 'null'}.
f. grep_missing: ${LANE === 'sim' && LANE_REV ? `for each [name, pattern] in ${J(SIM_PASS)}, grep -cE pattern index.html; list the names with 0 hits` : '[] (not run for this review)'}.
Write {date: "${DATE}", item: "${ITEM}", capture: "${CAP_REL}", compare_b0, compare_r1, accept, drift, manifest, grep_missing} with the full outputs to ${EVID_REL} (2-space JSON), re-read it and JSON.parse it.
Return {path: "${EVID_REL}", sha256, accept_path: "${ACC_REL}", compare_b0_exit, compare_b0_n, compare_r1_exit, accept_none, accept_lint_ok, accept_pass, failing_n, accept_failing, accept_gates, accept_waived, drift_exit, drift_self_test_exit, manifest_atlas_exit, manifest_sim_exit, grep_missing, infra_error: "" or the setup failure}.`), {label: 'scoring', phase: 'Capture', schema: SCORE, ...M('mech')})
if (!score || infraOf(score)) { log('scoring failed: ' + (score ? infraOf(score) : 'agent died')); return result({reason: 'scoring failed: ' + (score ? infraOf(score) : 'agent died twice'), capture_path: CAP_REL, gaps}) }

// ---- mechanical gates: scored here, in code; no vote can waive one (plan.md 4.2: the universal gates are scored in code) ----
const mech = []   // reasons the review fails whatever the votes
const codeCands = []
const cand = (title, where, evidence, repro_cmd, fix, unit_hint, severity_guess) => codeCands.push({id: 'C' + (codeCands.length + 1), title, where, evidence, repro_cmd, fix, unit_hint, severity_guess})
const ACCEPT_CMD = `node tools/mobile-capture.js --accept ${ACC_REL} --capture ${CAP_REL}`
{
  const surfs = ['atlas', 'sim'].filter(HAS)
  const missingProf = surfs.flatMap(sf => PROFILES.filter(p => !String((cap.profiles || {})[sf] || '').split(',').map(x => x.trim()).includes(p)).map(p => sf + '.' + p))
  if (missingProf.length) { mech.push('the fresh capture lacks ' + missingProf.join(', ') + ' (every gate is scored on all five profiles)'); cand(`Fresh capture lacks ${missingProf.length} profile(s)`, missingProf.join(', '), {kind: 'metric', ref: `${CAP_REL} profiles: ${J(cap.profiles)}`}, `node -p "const c = JSON.parse(fs.readFileSync('${CAP_REL}', 'utf8')); [Object.keys(c.atlas || {}), Object.keys(c.sim || {})]"`, 'make the capture complete on every profile', 'new', 'blocker') }
  if (!Number.isInteger(cap.errors) || cap.errors !== 0) { mech.push(`UG2: the fresh capture recorded ${cap.errors} console/page error(s)`); cand(`UG2: ${cap.errors} console/page error(s) in the fresh capture`, CAP_REL, {kind: 'metric', ref: `${CAP_REL} <surface>.<profile>.errors`}, `node tools/mobile-capture.js --accept ${ACC_REL} --capture ${CAP_REL} (the UG2.* keys of its failing list)`, 'remove the cause of every console or page error', 'new', 'major') }
  const passedNoAcc = arr(pre.accept_missing).filter(u => (pre.statuses || {})[u] === 'passed')
  if (passedNoAcc.length) mech.push('no accept file for passed unit(s) ' + passedNoAcc.join(', ') + ': their gates were not scored')
  if (!score.accept_none) {
    const accFail = arr(score.accept_failing), accN = score.failing_n, gl = arr(score.accept_gates), wv = arr(score.accept_waived)
    if (score.accept_lint_ok !== true) mech.push('the combined accept file does not lint')
    const notListed = NEVER_WAIVED.filter(g => !gl.includes(g)), uncovered = GATES.filter(g => !gl.includes(g) && !wv.includes(g))
    if (notListed.length || uncovered.length) mech.push('the combined acceptance does not score every universal gate (' + [notListed.length ? 'never-waived ' + notListed.join(' ') + ' not listed' : '', uncovered.length ? uncovered.join(' ') + ' neither listed nor waived' : ''].filter(Boolean).join('; ') + ')')
    if (!Number.isInteger(accN) || accN < 0 || accFail.length !== Math.min(60, accN)) mech.push(`the combined acceptance failing list is not intact (failing_n ${accN}, listed ${accFail.length})`)
    else if (score.accept_pass !== true && !accFail.length) mech.push('the combined acceptance did not pass and lists no failing key (scoring truncated or crashed)')
    else if (score.accept_pass === true && accN > 0) mech.push('the combined acceptance reports pass with ' + accN + ' failing key(s)')
    else if (score.accept_pass !== true) mech.push('the combined acceptance fails (' + accN + ' failing key(s))')
    const failGroups = {}
    for (const f of accFail) { const g = String(f.key).split('.').slice(0, 2).join('.'); (failGroups[g] = failGroups[g] || []).push(f) }
    const groups = Object.entries(failGroups)
    for (const [g, fs] of groups.slice(0, CODE_CAP)) cand(`Combined acceptance of ${ITEM} fails at ${g}: ${fs.length} key(s)`, g, {kind: 'metric', ref: `${EVID_REL} accept.failing: ${J(fs.slice(0, 6))}`}, ACCEPT_CMD,
      'restore the failing keys to their accepted values, or declare them in the unit\'s accept file if the change is intended and allowed', 'new', /^UG(3|4|11)\b/.test(g) ? 'blocker' : 'major')
    if (groups.length > CODE_CAP) { const rest = groups.slice(CODE_CAP); cand(`Combined acceptance of ${ITEM} fails in ${rest.length} further group(s): ${rest.map(x => x[0]).join(', ').slice(0, 200)}`, rest.map(x => x[0]).join(', ').slice(0, 300), {kind: 'metric', ref: `${EVID_REL} accept.failing: ${J(rest.flatMap(x => x[1]).slice(0, 6))}`}, ACCEPT_CMD, 'restore the failing keys to their accepted values', 'new', 'major') }
  } else if (UNITS_IN.some(u => (pre.statuses || {})[u] === 'passed')) mech.push('no accept file exists for passed units: the combined acceptance was not scored')
  if (score.drift_exit !== 0 || score.drift_self_test_exit !== 0) { mech.push(`tools/street-drift.js exits ${score.drift_exit} (self-test ${score.drift_self_test_exit})`); cand(`tools/street-drift.js exits ${score.drift_exit} (self-test ${score.drift_self_test_exit})`, 'tools/street-drift.js',
    {kind: 'cmd', ref: `${EVID_REL} drift`}, 'node tools/street-drift.js; echo $?; node tools/street-drift.js --self-test; echo $?', 'restore the anchors or scripts the drift check names', 'new', 'blocker') }
  for (const [k, v] of [['atlas', score.manifest_atlas_exit], ['sim', score.manifest_sim_exit]]) if (v != null && v !== 0) { mech.push(`offline manifest --${k} --check exits ${v}`); cand(`offline manifest --${k} --check exits ${v}`, k === 'atlas' ? 'maps-site/data/offline-manifest.json' : 'offline-manifest.json',
    {kind: 'cmd', ref: `${EVID_REL} manifest`}, `node tools/build-offline-manifest.js --${k} --check; echo $?`, 'regenerate the manifest after the last app-file edit of the lane', k === 'atlas' ? 'A-U7' : 'S-U10', 'major') }
  if (mech.length) log('mechanical gates fail (scored in code): ' + mech.join('; '))
}

// ---- Find / Verify ----
const FINDER_READS = `Scope: ${ITEM} (${LANE} lane${LANE_REV ? ', the whole-lane review' : ''}), units ${unitList}. Their accept files are docs/mobile/accept/<id>.json and their per-unit captures docs/mobile/captures/<id>.json.
The change: the unified diff ${DIFF} (made by the central session; read it, never run git). The tree as it is now has the change applied.
Measurements: the fresh capture ${CAP_REL} (all five profiles), B0 docs/mobile/baseline.json, ${START_REF ? 'the item\'s starting reference ' + refFile(START_REF) + ' (the combined acceptance is scored against it), ' : ''}${pre.refs.r1 ? 'R1 docs/mobile/captures/R1.json (the desktop reference after vendoring)' : 'no R1 yet (read B0)'}, the scored evidence ${EVID_REL} (compare vs B0/R1, the combined acceptance ${ACC_REL} scored on the fresh capture, drift, manifests).
Rules: docs/mobile/gates.md (UG1-UG11), docs/mobile/metrics.md (every metric and the accept format), docs/mobile/README.md sections 1-5 (delay, never drop; player-visible strings; ordering), docs/mobile/voice-rubric.md, docs/mobile/owner-answers.json (owner rulings: never second-guess them).`
function finderPrompt(L, round, mine) {
  const cap = round ? FIND_CAP : FIND_CAP0
  return P(`You are one blind finder of the ${ITEM} mobile review. Lens: ${L.check}. Look only through this lens; other lenses cover the rest. ${BLIND}
${FINDER_READS}
Lens rules: ${L.body()}
${SANDBOX} You may run the capture tool with --out in your temp dir (add --no-shots unless you need a shot), node scripts and greps; nothing that writes in the repo.
${NOT_DEFECTS}
Report at most ${cap} finding(s), most severe first. ${round ? 'This is an extra round: report only a defect you have not reported before. Already reported (do not repeat): ' + J(mine) + '.' : ''} A finding is a concrete defect in this change or in its interaction with earlier mobile units, with evidence a third party can re-run: evidence.kind "metric" (a key path in a named capture or evidence file), "cmd" (a command and what it prints), "diff" (file and line of the hunk) or "shot" (a shot path); repro_cmd = one read-only command (no git, nothing written in the repo) that shows it. Zero findings is a valid answer.
Return {lens: "${L.id}", findings: [{id: "F1", title, where (file:line or metric key), evidence: {kind, ref}, repro_cmd, fix (one sentence), unit_hint (the unit id it belongs to, or "new"), severity_guess: "blocker"|"major"|"minor"|"nit"}]}.`)
}
const claim = f => `Finding ${f.uid} (${f.lens === 'code' ? 'a mechanical check' : 'lens ' + f.lens}): ${oneLine(f.title)}
Where: ${oneLine(f.where)}
Evidence (${f.evidence.kind}): ${oneLine(f.evidence.ref)}
Repro: ${oneLine(f.repro_cmd)}
Scope: ${ITEM} (${LANE} lane), units ${UNITS_IN.join(', ')}; the diff ${DIFF}; the fresh capture ${CAP_REL}; the evidence ${EVID_REL}; B0 docs/mobile/baseline.json; rules docs/mobile/gates.md, docs/mobile/metrics.md, docs/mobile/README.md, docs/mobile/owner-answers.json.`
const reproducePrompt = f => P(`Reproduce one review finding on the current tree, independently. ${claim(f)}
${SANDBOX}
Run the repro command or an equivalent read-only check (a capture with --out in your temp dir, a node script, a grep). reproduced = true only when you saw the defect yourself; false when the tree does not show it. Return {id: "${f.uid}", reproduced, out (what you ran and saw, <= 600 characters), infra_error: "" or the setup failure that stopped you}.`)
const refutePrompt = f => P(`Try to refute one review finding: argue that it is NOT a defect of this change. ${claim(f)}
${NOT_DEFECTS}
Also refuted: a misread metric or key, a value the unit's accept file declares, a defect that predates the mobile track (equal in B0) and is not made worse, a claim about a file outside the diff that the change cannot affect. Check the evidence yourself (read the diff, the capture, the accept files; you may run read-only commands; ${SANDBOX})
refuted = true only with concrete evidence; when the defect stands, refuted = false. Return {id: "${f.uid}", refuted, why (<= 400 characters), infra_error: "" or the setup failure}.`)
const severityPrompt = f => P(`Rate one review finding. ${claim(f)}
Rubric: ${SEV_RUBRIC}
${NOT_DEFECTS}
real = whether, on the evidence as stated and the rules, this is a defect at all (your vote); severity = its rubric class if it is real (your best class otherwise). Read the cited files if you need to; run nothing heavy. Return {id: "${f.uid}", real, severity, why (one sentence)}.`)

const survivors = [], unverified = [], dropped = [], deadLens = new Set(), lensCounts = {}, seen = new Set()
let spent = 3, rounds = 0   // preflight, capture, scoring (retries uncounted)
let lensesNow = LENSES
for (let round = 0; ; round++) {
  const tag = round ? ' r' + round : ''
  phase('Find')
  const raw = await parallel(lensesNow.map(L => () => crit(finderPrompt(L, round, survivors.concat(dropped).filter(f => f.lens === L.id).map(f => oneLine(f.title))), {label: `${L.id} · ${L.key}${tag}`, phase: 'Find', schema: FIND, ...M(FINDER_ROLE)})))
  spent += raw.length
  const candidates = []
  if (round === 0) for (const c of codeCands) {   // a mechanical failure survives without a vote: votes only add findings, never drop or lighten one
    const g = {...c, lens: 'code', round: 0, uid: 'code.' + c.id}; seen.add(norm(g.title + ' ' + g.where))
    survivors.push({uid: g.uid, lens: 'code', title: oneLine(g.title), where: oneLine(g.where), severity_guess: g.severity_guess, votes: null, evidence: g.evidence, repro_cmd: oneLine(g.repro_cmd), fix: oneLine(g.fix), unit_hint: oneLine(g.unit_hint), severity: g.severity_guess, severity_source: 'code', reproduce_out: '', refute_why: '', severity_why: ''})
  }
  raw.forEach((res, i) => {
    const L = lensesNow[i], lc = lensCounts[L.id] || (lensCounts[L.id] = {found: 0, capped: 0, no_evidence: 0, dupe: 0, survived: 0, refuted: 0, not_real: 0, unverified: 0, died: 0})
    if (!res) { lc.died++; if (round === 0) deadLens.add(L.id); log(`agent died (with its retry): ${L.id} finder${tag}` + (round === 0 ? ' (a missing lens, never "no findings")' : '')); return }
    const all = arr(res.findings), capN = round ? FIND_CAP : FIND_CAP0
    if (all.length > capN) { lc.capped += all.length - capN; log(`${L.id}${tag}: ${all.length - capN} finding(s) past the cap of ${capN} dropped`) }
    all.slice(0, capN).forEach((f, j) => {
      lc.found++
      if (!f || !f.evidence || !oneLine(f.evidence.ref) || !oneLine(f.repro_cmd)) { lc.no_evidence++; return }
      const g = {...f, lens: L.id, round, uid: `${L.id}.r${round}.${j + 1}`}
      g.key = norm(g.title + ' ' + g.where)
      if (seen.has(g.key)) { lc.dupe++; dropped.push({uid: g.uid, lens: L.id, title: oneLine(g.title), why: 'seen'}); return }
      seen.add(g.key); candidates.push(g)
    })
  })
  if (!candidates.length) { log(`round ${round}: no fresh findings (dry)`); break }

  phase('Verify')
  let fresh = candidates
  if (fresh.length > 1) {   // fuzzy pass: removes only a later candidate naming the same defect as an earlier one
    const dd = await agent(P(`Fuzzy duplicate pass, mechanical; judge nothing else and write nothing. Candidates in order: ${J(fresh.map(f => ({id: f.uid, title: oneLine(f.title), where: oneLine(f.where)})))}. A candidate is a duplicate when it names the same defect at the same place as an EARLIER candidate in the list; "of" is that earlier id, copied exactly. Return {dupes: [{id, of}]} ([] when none).`), {label: 'dedup' + tag, phase: 'Verify', schema: DEDUP, ...M('mech')})
    spent++
    if (dd) {
      const ix = new Map(fresh.map((f, i) => [f.uid, i]))
      const gone = new Set(arr(dd.dupes).filter(x => x && ix.has(x.id) && ix.has(x.of) && ix.get(x.of) < ix.get(x.id) && !String(x.id).startsWith('code.')).map(x => x.id))
      for (const f of fresh) if (gone.has(f.uid)) { (lensCounts[f.lens] || {}).dupe++; dropped.push({uid: f.uid, lens: f.lens, title: oneLine(f.title), why: 'fuzzy dupe'}) }
      fresh = fresh.filter(f => !gone.has(f.uid))
    } else log('agent died: dedup' + tag + ' (optional; the code-side key already ran)')
  }
  const fits = Math.max(0, Math.floor((VERIFY_BOUND - spent - 2) / 3))
  const rank = f => SEV.indexOf(f.severity_guess || 'minor')
  const verify = fresh.length <= fits ? fresh : fresh.map((f, j) => [f, j]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).slice(0, fits).map(x => x[0])
  for (const f of fresh.filter(f => !verify.includes(f))) { unverified.push({uid: f.uid, lens: f.lens, title: oneLine(f.title), severity_guess: f.severity_guess, why: 'agent bound'}); if (lensCounts[f.lens]) lensCounts[f.lens].unverified++ }
  if (verify.length < fresh.length) gaps.push(`round ${round}: ${fresh.length - verify.length} finding(s) left unverified by the agent bound`)
  const ver = []
  for (let c = 0; c < verify.length; c += VERIFY_CONC) ver.push(...await parallel(verify.slice(c, c + VERIFY_CONC).map(f => () => parallel([   // three independent votes: none sees another's answer
    () => agent(reproducePrompt(f), {label: `${f.uid} · reproduce`, phase: 'Verify', schema: REPRO, ...M('audit')}),
    () => agent(refutePrompt(f), {label: `${f.uid} · refute`, phase: 'Verify', schema: REFUTE, ...M('judge')}),
    () => agent(severityPrompt(f), {label: `${f.uid} · severity`, phase: 'Verify', schema: SEVR, ...M('triage')})]))))
  spent += 3 * verify.length
  const survLenses = new Set()
  verify.forEach((f, i) => {
    const [rep, ref, sev] = arr(ver[i]), lc = lensCounts[f.lens] || {}
    const vote = (x, ok, bad) => !x || infraOf(x) ? null : ok(x) ? true : bad(x) ? false : null
    const votes = {reproduce: vote(rep, x => x.reproduced === true, x => x.reproduced === false), refute: vote(ref, x => x.refuted === false, x => x.refuted === true), severity: vote(sev, x => x.real === true, x => x.real === false)}
    const yes = Object.values(votes).filter(v => v === true).length, no = Object.values(votes).filter(v => v === false).length
    const base = {uid: f.uid, lens: f.lens, title: oneLine(f.title), where: oneLine(f.where), severity_guess: f.severity_guess, votes}
    if (yes >= 2) {
      const severity = sev && !infraOf(sev) && SEV.includes(sev.severity) ? sev.severity : f.severity_guess
      survivors.push({...base, evidence: f.evidence, repro_cmd: oneLine(f.repro_cmd), fix: oneLine(f.fix), unit_hint: oneLine(f.unit_hint), severity, severity_source: sev && SEV.includes(sev.severity) ? 'vote' : 'finder guess',
        reproduce_out: oneLine(rep && rep.out).slice(0, 400), refute_why: oneLine(ref && ref.why).slice(0, 300), severity_why: oneLine(sev && sev.why).slice(0, 300)})
      lc.survived++; if (f.lens !== 'code') survLenses.add(f.lens)
    } else if (no >= 2) {
      dropped.push({...base, why: votes.refute === false ? 'refuted' : votes.reproduce === false ? 'not reproduced' : 'not real', refute_why: oneLine(ref && ref.why).slice(0, 200)})
      if (votes.refute === false) lc.refuted++; else lc.not_real++
    } else {
      const infra = [rep, ref, sev].map(infraOf).filter(Boolean)
      unverified.push({...base, why: infra.length ? 'infra: ' + infra[0].slice(0, 160) : 'votes undecided (a verifier died)'}); lc.unverified++
      log(`unverified: ${f.uid} ${oneLine(f.title)} ${J(votes)}`)
    }
  })
  if (verify.length < fresh.length) { log(`round ${round}: no extra round (the agent bound was reached)`); break }
  if (!survLenses.size) { log(`round ${round}: no lens produced a survivor`); break }
  if (round >= ROUNDS) { if (ROUNDS) gaps.push(`find loop stopped at its cap with survivors from ${[...survLenses].join(', ')}`); break }
  if (lowBudget()) { log('budget: extra round skipped'); gaps.push(`extra round ${round + 1} skipped by the token budget`); break }
  const next = lensesNow.filter(L => survLenses.has(L.id))
  if (spent + next.length * (1 + 3 * FIND_CAP) + 3 > VERIFY_BOUND) { gaps.push(`extra round ${round + 1} skipped by the agent bound`); break }
  lensesNow = next
  rounds++
}
for (const id of deadLens) gaps.push(`lens ${id} (${LENSES[LENS_IX(id)].key}) died with its retry: a missing lens, never "no findings"`)

// ---- Judge ----
phase('Judge')
let rulings = null
if (survivors.length) {
  const brief = survivors.map(s => ({uid: s.uid, lens: s.lens, title: s.title, where: s.where, evidence: s.evidence, repro_cmd: s.repro_cmd, fix: s.fix, unit_hint: s.unit_hint, severity_vote: s.severity, votes: s.votes, reproduce_out: s.reproduce_out, refute_why: s.refute_why}))
  const jr = await crit(P(`You are the judge of the ${ITEM} mobile review (${LANE} lane). These findings survived verification (at least 2 of 3 independent votes: reproduced, not refuted, real) or are mechanical checks scored in code (lens "code": never lighter than their severity_vote). You may not drop one; you rule each.
${J(brief)}
Rubric: ${SEV_RUBRIC}
${NOT_DEFECTS}
Rules: docs/mobile/gates.md, docs/mobile/README.md, docs/mobile/owner-answers.json (read them; you may read the diff ${DIFF} and the evidence ${EVID_REL}; run nothing heavy).
For each uid: severity (final class), same_as (the uid of an EARLIER survivor in the list naming the same defect, else ""), why (one sentence), fix (one sentence a fixer can act on), done_when (one measurable sentence: a capture key with its expected value, or a command with its expected output).
Return {rulings: [{uid, severity, same_as, why, fix, done_when}]} with one entry per uid, in the given order.`), {label: 'judge', phase: 'Judge', schema: JUDGE, ...M('judge')})
  if (jr) rulings = new Map(arr(jr.rulings).filter(r => r && survivors.some(s => s.uid === r.uid)).map(r => [r.uid, r]))
  else gaps.push('the judge died twice: severities are the verifiers\' votes')
}
const order = new Map(survivors.map((s, i) => [s.uid, i]))
for (const s of survivors) {
  const r = rulings && rulings.get(s.uid)
  const vi = SEV.indexOf(s.severity), floor = SEV[Math.min(vi + 1, SEV.length - 1)]   // the judge may lighten by at most one step
  s.final = r ? (SEV.indexOf(r.severity) > SEV.indexOf(floor) ? floor : r.severity) : s.severity
  if (s.lens === 'code' && SEV.indexOf(s.final) > SEV.indexOf(s.severity_guess)) s.final = s.severity_guess   // a mechanical failure never lightens by vote: its fix unit is still generated
  s.judge = r ? {severity: r.severity, why: oneLine(r.why).slice(0, 300)} : null
  if (r && oneLine(r.fix)) s.fix = oneLine(r.fix)
  s.done_when = r ? oneLine(r.done_when) : ''
  const t = r && survivors.find(x => x.uid === r.same_as)   // a merge target must come earlier and be at least as heavy: a lighter target would hide a blocker/major
  s.same_as = t && order.get(t.uid) < order.get(s.uid) && SEV.indexOf(t.final) <= SEV.indexOf(s.final) ? t.uid : ''
}
if (rulings && survivors.some(s => !rulings.has(s.uid))) gaps.push('the judge left ' + survivors.filter(s => !rulings.has(s.uid)).length + ' survivor(s) unruled: their votes stand')

// ---- Record ----
phase('Record')
const heavy = s => s.final === 'blocker' || s.final === 'major'
const BM = survivors.filter(s => heavy(s) && !s.same_as).sort((a, b) => SEV.indexOf(a.final) - SEV.indexOf(b.final) || order.get(a.uid) - order.get(b.uid))
const unverHeavy = unverified.filter(u => u.severity_guess === 'blocker' || u.severity_guess === 'major')
const why = []
if (offFiles.length) why.push('the diff touches paths outside the ' + LANE + ' lane: ' + offFiles.join(', '))
if (deadLens.size) why.push('lens(es) missing: ' + [...deadLens].join(', '))
if (BM.length) why.push(BM.length + ' surviving blocker/major finding(s)')
if (unverHeavy.length) why.push(unverHeavy.length + ' blocker/major-guessed finding(s) unverified')
for (const m of mech) why.push(m + '; scored in code, not by votes')
const PASS = !why.length
const FIXMODEL = u => (UNIT[u] || [])[1] === 'opus' ? {model: 'opus', effort: 'high'} : {model: 'sonnet', effort: 'high'}
const HINT_FILES = {D1: ['server.js'], D2: ['DEPLOY.md', '.github/workflows/pages.yml', 'tools/lint-deploy.js'], D6: ['tools/build-offline-manifest.js']}   // the shared lane has no app file: a fix unit writes what its finding names
const diffIn = arr(pre.diff.files).filter(p => !offLane(p) && !p.startsWith('docs/'))
function fixFiles(s) {
  const toks = oneLine(s.where).split(/[\s,;]+/).map(t => t.replace(/[:#(].*$/, '')).filter(Boolean)
  const named = diffIn.filter(p => toks.some(t => t === p || (t.endsWith('/') && p.startsWith(t))))
  const hinted = (HINT_FILES[s.unit_hint] || []).filter(p => !offLane(p))
  const f = [...new Set([...APP, ...named, ...hinted])]
  return f.length ? f : diffIn.slice(0, 8)
}
const fixUnits = BM.map((s, i) => ({id: `${SLUG}-F${i + 1}`, run: `${ITEM} (fix ${i + 1})`, lane: LANE, kind: 'logic', files: fixFiles(s).concat([`docs/mobile/accept/${SLUG}-F${i + 1}.json`]), ...FIXMODEL(s.unit_hint),
  defects: [], depends_on: [], title: s.title, acceptance: ['UG1-UG11 as every unit', s.done_when || ('the review finding ' + s.uid + ' no longer reproduces: ' + s.repro_cmd)], from_review: REV_REL + '#' + s.uid}))
const inserts = BM.map((s, i) => `- [ ] **${ITEM} fix ${i + 1} · ${s.title.replace(/\*/g, '')} (USER REQUEST)** — ${s.fix} (${s.final}; review ${SLUG} ${s.uid}; unit hint ${s.unit_hint || 'new'}; lane ${LANE}).\n  - Done when: ${s.done_when || 'the finding no longer reproduces: ' + s.repro_cmd}; the universal gates pass; a re-run of ${ITEM}'s review leaves no blocker or major.\n  - Prerequisites: none. Goes directly above ${ITEM}; fix unit ${SLUG}-F${i + 1}, run "${ITEM} (fix ${i + 1})" (mobile-build item "${ITEM} (fix ${i + 1})").`)
const laneExtra = LANE_REV ? (LANE === 'atlas' ? {filigree2_ready: PASS && !deferred.length, deferred_units: deferred, note_g9: 'G9 also needs the staged Pages replay, both desktops re-captured and docs/mobile/final.json with ATLAS.tiers() per profile (central)'}
  : {street1_ready: PASS && score.drift_exit === 0 && score.drift_self_test_exit === 0, sim_after_mobile_pass_missing: arr(score.grep_missing), note_g14: 'G14: a missing sim_after_mobile_pass feature means the street block sentence is edited (central); docs/mobile/final.json is completed centrally'}) : {}
const review = {job: JOB, date: DATE, item: ITEM, slug: SLUG, lane: LANE, lane_review: LANE_REV, units: UNITS_IN, deferred_units: deferred, pass: PASS, reason: PASS ? 'no surviving blocker or major' : why.join('; '),
  inputs: {diff: {path: DIFF, sha256: pre.diff.sha256, bytes: pre.diff.bytes, files: pre.diff.files}, capture: {path: CAP_REL, sha256: cap.sha256, profiles: cap.profiles, errors: cap.errors}, evidence: {path: EVID_REL, sha256: score.sha256}, combined_accept: ACC_REL,
    app_sha: pre.now_sha, references: {B0: 'docs/mobile/baseline.json', R1: pre.refs.r1 ? 'docs/mobile/captures/R1.json' : null}, owner: {q1: pre.owner_q1, q2: pre.owner_q2}},
  scoring: {compare_b0: {exit: score.compare_b0_exit, n: score.compare_b0_n}, compare_r1_exit: score.compare_r1_exit, accept: {none: score.accept_none, lint_ok: score.accept_lint_ok, pass: score.accept_pass, failing: arr(score.accept_failing).length, failing_n: score.failing_n, baseline: START_REF},
    drift: [score.drift_exit, score.drift_self_test_exit], manifest: {atlas: score.manifest_atlas_exit, sim: score.manifest_sim_exit}, out_of_lane: offFiles},
  lenses: Object.fromEntries(LENSES.map(L => [L.id, {lens: L.key, ...M(FINDER_ROLE), ...(lensCounts[L.id] || {died: 1})}])), code_candidates: codeCands.length,
  verify: {reproduce: M('audit'), refute: M('judge'), severity: M('triage'), rule: 'survive on >= 2 of 3 votes'}, judge: M('judge'), rounds, agents: spent,
  blockers_majors: BM.map(s => ({uid: s.uid, severity: s.final, lens: s.lens, title: s.title, where: s.where, fix: s.fix, done_when: s.done_when, unit_hint: s.unit_hint})),
  survivors, unverified, dropped, gaps, polish_inserts: inserts, fix_units: fixUnits, ...laneExtra}
const text = JSON.stringify(review, null, 2)
const rec = await crit(P(`Write the review record. Create ${REPO}/docs/mobile/reviews/ if needed and write ${REPO}/${REV_REL} (overwrite an older one) so that it holds exactly this JSON value, 2-space indented, with a trailing newline (write it with a node script from a temp file, never by hand-retyping it in a shell string):
${text}
${READBACK}`), {label: 'record', phase: 'Record', schema: FILEREC, ...M('mech')})
const recOk = !!rec && rec.parsed === true && isHex(rec.sha256) && rec.chars === text.length
if (!recOk) gaps.push('the review record could not be confirmed (' + (rec ? 'chars ' + rec.chars + ' vs ' + text.length : 'agent died') + ')')
log(`${ITEM}: ${PASS ? 'PASS' : 'FAIL'} · ${BM.length} blocker/major · ${survivors.length - BM.length} other survivor(s) · ${unverified.length} unverified · ${spent} agents`)
return result({pass: PASS && recOk, reason: !recOk ? 'record not confirmed; ' + review.reason : review.reason,
  blockers_majors: review.blockers_majors, minors: survivors.filter(s => !heavy(s) && !s.same_as).length, unverified: unverified.length,
  review_path: recOk ? REV_REL : null, review_sha256: recOk ? rec.sha256 : null, capture_path: CAP_REL, evidence_path: EVID_REL, accept_path: ACC_REL,
  gaps, polish_inserts: inserts, fix_units: fixUnits, ...laneExtra,
  changelog_line: `${ITEM} review (${LANE}${LANE_REV ? ' lane' : ''}): ${PASS ? 'passed' : 'failed'}; ${BM.length} blocker/major, ${survivors.length - BM.length} minor/nit; record ${REV_REL}.`})
