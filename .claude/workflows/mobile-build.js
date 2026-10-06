export const meta = {
  name: 'mobile-build',
  description: 'Mobile N: run the fix units of one Mobile POLISH item from a units file, strictly in order; per unit accept file -> snapshot -> implementer -> UG1 + UG11 + scope (scored in code) -> measurer (tools/mobile-capture.js --accept, scored in code) -> <=2 fixes -> review lenses -> refute -> fix -> fresh re-review -> restore on failure',
  whenToUse: 'Run as the POLISH item "Mobile N" (Mobile 3, the atlas lane 4-8, the sim lane 10-13, or the owner-gated Mobile 5b) in a fresh session: Workflow({name:"mobile-build", args:{item:"Mobile 4", date:"YYYY-MM-DD"}}). args.mode "plan" returns the schedule and writes nothing. A review fix unit (run "Mobile N (fix K)") runs as item "Mobile N (fix K)"; item "Mobile N" also picks up its fix units. Loop self-test: item "Fixture noop" or "Fixture fail" with units docs/mobile/fixtures/<noop|fail>-unit.json. Returns reason "held" while docs/filigree/gates/1-research.json is missing, failing or not re-integrated (R2/R7/R12/R14/R18 overridden). Never runs kind "central" units, never authors anything under .claude/ (a failed unit\'s stray writes there are copied back from the snapshot and the item halts, UG11), never runs git; the central session commits.',
  phases: [
    {title: 'Preflight', detail: 'units file, state.json, owner answers, the Filigree 1 gate, app and pipeline shas, the schedule'},
    {title: 'Hold', detail: 'per unit: the Filigree 1 hold flag (app-file units) and the rebase trigger read'},
    {title: 'Rebase', detail: 'app files or pipeline scripts changed outside the loop: re-take the reference capture, record it in state.json. A passed unit\'s own capture becomes the reference for the next unit (after-<id>)'},
    {title: 'Accept', detail: 'accept-author writes docs/mobile/accept/<id>.json from the acceptance bullets only; --lint-accept; checked in code'},
    {title: 'Snapshot', detail: 'tools/mobile-tree.js (deterministic; the agent only relays its one-line JSON, length-checked in code) copies the unit files, the accept file, the owner answers and the whole tree (index.html, maps-site/, tools/, .claude/, server.js, vendor/) with sha manifests, pipeline shas and a content manifest of the repo'},
    {title: 'Implement', detail: 'the unit model and effort; writable set = the unit files minus the accept file; then UG1, UG11 and scope scored in code'},
    {title: 'Measure', detail: 'sonnet/low runs tools/mobile-capture.js --accept (one capture at a time; --server spawn decided in code); the script scores exit code, pass and failing'},
    {title: 'Fix', detail: '<=2 fix rounds fed the failing keys; review fixes fed the surviving findings'},
    {title: 'Review', detail: 'lenses (desktop identity, delay-not-drop parity, determinism, voice, acceptance) -> refute each blocker/major -> fix -> fresh re-review (<=2 cycles)'},
    {title: 'Restore', detail: 'on failure: tools/mobile-tree.js (deterministic; the agent only relays its one-line JSON, length-checked in code) restores the unit files, the accept file, the owner answers and every tree path that moved from the snapshot; every manifest verified in code; any .claude/ or tools/street-drift.js change halts the whole item (UG11); a write outside every snapshotted path halts it too'},
    {title: 'Record', detail: 'docs/mobile/state.json written by tools/mobile-tree.js write-state (deterministic; the agent only relays its one-line JSON, length-checked in code) after every unit and every rebase'}
  ]
}
const JOB = 'mobile-build'
const A = (args && typeof args === 'object' && !Array.isArray(args)) ? args : {}
const die = m => { throw new Error(JOB + ': ' + m) }
const KNOWN_ARGS = ['item', 'date', 'mode', 'repo', 'units', 'state', 'snapDir', 'rerun', 'maxFix', 'reviewCycles', 'jobs', 'cdnDir', 'server']
for (const k of Object.keys(A)) if (!KNOWN_ARGS.includes(k)) die('unknown arg ' + k)
const DATE = A.date
const dayOk = d => { if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false; const [y, m, n] = d.split('-').map(Number); return m >= 1 && m <= 12 && n >= 1 && n <= [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1] }
if (!dayOk(DATE)) die('args.date must be a "YYYY-MM-DD" string naming a real calendar day (scripts cannot read the clock)')
const ITEM = A.item
if (typeof ITEM !== 'string' || !/^(Mobile \d{1,2}b?( \(fix \d{1,2}\))?|Fixture [a-z0-9-]+)$/.test(ITEM)) die('args.item must name one POLISH item, e.g. "Mobile 4", "Mobile 5b" or one review fix "Mobile 9 (fix 1)" (or a loop fixture run, e.g. "Fixture noop")')
const ITEM_5B = /^Mobile \d{1,2}b$/.test(ITEM)
const MODE = A.mode || 'full'
if (!['full', 'plan'].includes(MODE)) die('args.mode must be full|plan')
const PATH_OK = /^[A-Za-z0-9_\/.+-]+$/   // paths reach unquoted shell lines in prompts; this charset needs no quoting
const segsOk = p => !p.includes('//') && !p.split('/').some(s => s === '.' || s === '..')
const REPO = String(A.repo || '/home/user/annals-kingdom').replace(/\/+$/, '')
if (!PATH_OK.test(REPO) || !REPO.startsWith('/') || !segsOk(REPO)) die('args.repo must be a normalized absolute path')
const inRepo = p => p === REPO || p.startsWith(REPO + '/')
// The loop never authors anything under .claude/ (UG11: script and loop files are central-session only); its one write there is the failure-path restore copying snapshot bytes back, after which the item halts. Every path a prompt asks an agent to write passes here first.
const W_OK = rel => { const r = String(rel); if (!PATH_OK.test(r) || !segsOk(r) || /^\.claude(\/|$)/.test(r) || /^\.git(\/|$)/.test(r) || r === 'tools/street-drift.js') die('refused write path ' + r); return r }
function relArg(k, dflt, ok, why) {
  const v = A[k] == null ? dflt : A[k]
  if (typeof v !== 'string' || !PATH_OK.test(v) || !segsOk(v)) die('args.' + k + ' must be a path of letters, digits and _ / . + - only')
  const abs = v.startsWith('/') ? v.replace(/\/+$/, '') : REPO + '/' + v.replace(/\/+$/, '')
  if (!ok(v, abs)) die('args.' + k + ' ' + why)
  return abs
}
const UNITS_ABS = relArg('units', 'docs/mobile/units.json', (v, a) => inRepo(a) && /^docs\/mobile\/[A-Za-z0-9_\/.-]+\.json$/.test(a.slice(REPO.length + 1)), 'must be a .json file under docs/mobile/ (default docs/mobile/units.json; fixtures in docs/mobile/fixtures/)')
if (/^Fixture /.test(ITEM) && !/\/docs\/mobile\/fixtures\//.test(UNITS_ABS)) die('a Fixture item reads its units from docs/mobile/fixtures/ (args.units)')
const STATE_ABS = relArg('state', 'docs/mobile/state.json', (v, a) => inRepo(a) ? /^docs\/mobile\/[A-Za-z0-9_.-]+\.json$/.test(a.slice(REPO.length + 1)) : a.endsWith('.json'), 'must be a .json file directly in docs/mobile/ or an absolute path outside the repo (fixture dry runs)')
const SNAP = relArg('snapDir', 'docs/mobile/shots/loop', (v, a) => inRepo(a) ? a.startsWith(REPO + '/docs/mobile/shots/') : true, 'must be under docs/mobile/shots/ (git-ignored) or an absolute path outside the repo')
if (inRepo(STATE_ABS)) W_OK(STATE_ABS.slice(REPO.length + 1))
const STATE_REL = inRepo(STATE_ABS) ? STATE_ABS.slice(REPO.length + 1) : null
const SNAP_REL = inRepo(SNAP) ? SNAP.slice(REPO.length + 1) : null
const RERUN = A.rerun ?? []
if (!Array.isArray(RERUN) || RERUN.some(x => typeof x !== 'string')) die('args.rerun must be an array of unit ids (re-run even when state.json records them passed)')
const intArg = (k, d, lo, hi) => { const v = A[k] ?? d; if (!Number.isInteger(v) || v < lo || v > hi) die('args.' + k + ' must be an integer ' + lo + '..' + hi); return v }
const MAXFIX = intArg('maxFix', 2, 0, 2), CYCLES = intArg('reviewCycles', 2, 0, 2), JOBS = intArg('jobs', 1, 1, 8)
if (A.cdnDir != null && (typeof A.cdnDir !== 'string' || !A.cdnDir.startsWith('/') || !PATH_OK.test(A.cdnDir) || !segsOk(A.cdnDir))) die('args.cdnDir must be an absolute path')
const SERVER = A.server || 'static'
if (!['static', 'spawn'].includes(SERVER)) die('args.server must be static|spawn (default: spawn once a unit touching server.js has passed, and for that unit\'s own measurements; static before)')

// ---- constants ----
const APP = ['index.html', 'maps-site/index.html']
const PROFILES = ['iphone13', 'pixel7', 'landscape', 'desktop', 'desktop2x']
const GATES = ['UG1', 'UG2', 'UG3', 'UG4', 'UG5', 'UG6', 'UG7', 'UG8', 'UG9', 'UG10', 'UG11']
const NEVER_WAIVED = ['UG1', 'UG4', 'UG9', 'UG11']   // only a unit whose files are all under docs/ or tools/ (nothing served) may waive the rest with a reason; a unit that touches any served file waives nothing
const HOLD_R = ['R2', 'R7', 'R12', 'R14', 'R18']
const MODELS = ['opus', 'sonnet', 'haiku'], EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max']
const KINDS = ['central', 'tool', 'data', 'config', 'logic', 'css']
const ST_OK = ['passed', 'failed', 'skipped', 'deferred-5b']
const OWNER_FILE = 'docs/mobile/owner-answers.json'
const TREE = ['index.html', 'maps-site/', 'tools/', '.claude/', 'server.js', 'vendor/']   // whole-tree snapshot: every served or pipeline path a unit could reach outside its own files
const isPipe = p => /^\.claude(\/|$)/.test(p) || p === 'tools/street-drift.js'   // any change here halts the whole item (UG11)
const NODE_TOOL = 'NODE_PATH=/opt/node22/lib/node_modules node tools/mobile-capture.js'
const TREE_TOOL = 'node tools/mobile-tree.js'
const MECH = {model: 'sonnet', effort: 'low'}   // relays of 64-hex shas: haiku altered single digits (2026-10-05)
const RULE_PIPE = `Never write, move or delete anything under ${REPO}/.claude/ or ${REPO}/tools/street-drift.js.`
const RULE_HEAD = `Repo root: ${REPO} (cd there before any command; use absolute paths). Never run git, not even read-only commands. Never schedule reminders, triggers or wake-ups.`
const RULE = `${RULE_HEAD} ${RULE_PIPE} Write ONLY the files this prompt names; throwaway scripts and temp files go in a mktemp -d directory outside the repo. Never start, stop or reuse a server on port 8544. Return only the requested JSON.`
const P = body => RULE + '\n' + body
const P_RESTORE = body => RULE.replace(RULE_PIPE, `Under ${REPO}/.claude/ and to ${REPO}/tools/street-drift.js you may only copy snapshot bytes back or delete a file the snapshot lacks, exactly as ordered below; nothing else there.`) + '\n' + body
const CDN_STEP = A.cdnDir ? `Use --cdn-dir ${A.cdnDir}.` : 'In a mktemp -d directory T run "npm pack leaflet@1.9.4 three@0.128.0 @fontsource/eb-garamond@5.3.0 @fontsource/lora@5.3.0 @fontsource/ibm-plex-mono@5.3.0 @fontsource/im-fell-english@5.3.0" (quiet) and pass --cdn-dir T (the tool accepts the .tgz files; it routes the CDN globs to disk, serves the Google Fonts hosts from the fontsource files so the production faces render and is harmless once vendoring has landed).'
const BUSY = 'Before starting, if `pgrep -f \'tools/mobile-capture[.]js\'` finds a capture already running (an earlier attempt), wait for it to exit (poll every 30 s): never start a second one, never kill it.'   // the [.] keeps pgrep from matching a shell that carries the pattern itself
const POLL = 'While the capture runs, keep polling with commands of at most 9 minutes each (e.g. `timeout 540 bash -c \'until [ -f T/code ]; do sleep 15; done\'`), as many times as needed (up to 2 hours). Never report infra_error because the capture is still running or slow; infra_error is only for a tool that could not start.'
const LONG_RUN = BUSY + ' A full capture can take 30 minutes or more: start it in the background (run_in_background, or nohup ... &) with stdout and stderr redirected to files in T and its exit code written to T/code, then poll until T/code exists. ' + POLL + ' Never kill it early and never start a second capture while one runs.'
const serverLanded = () => Object.entries(ST.units).some(([id, r]) => r && r.status === 'passed' && byId[id] && (byId[id].files || []).includes('server.js'))
const serverFlag = u => (SERVER === 'spawn' || serverLanded() || (u && Array.isArray(u.files) && u.files.includes('server.js'))) ? ' --server spawn' : ''   // a unit that edits server.js is measured on the server it wrote
const shaMapRule = 'sha256 (hex, of the file bytes) keyed by repo-relative path'
const PIPE_RULE = `pipeline_sha = ${shaMapRule} of every ${REPO}/.claude/workflows/*.js and of ${REPO}/tools/street-drift.js (read only).`
const APP_RULE = `app_sha = ${shaMapRule} of ${REPO}/index.html and ${REPO}/maps-site/index.html ({"index.html": ..., "maps-site/index.html": ...}).`
const FIL1_RULE = `fil1 = from ${REPO}/docs/filigree/gates/1-research.json: {exists (present and parses), pass: parsed.pass === true, rulings_used: {R2, R7, R12, R14, R18: each parsed.rulings_used[id] as a string, or "missing"}} (exists false -> pass false and every ruling "missing").`

// ---- schemas ----
const S = {type: 'string'}, SA = {type: 'array', items: S}, B = {type: 'boolean'}, I = {type: 'integer'}
const ANY = {type: ['string', 'number', 'boolean', 'array', 'object', 'null']}
const LOOSE = {type: 'object', additionalProperties: ANY}
const SHAS = {type: 'object', additionalProperties: S}
const NSHAS = {type: 'object', additionalProperties: {type: ['string', 'null']}}
const OBJ = (props, req) => ({type: 'object', properties: props, required: req || Object.keys(props)})
const FIL1 = OBJ({exists: B, pass: B, rulings_used: SHAS})
const IDX = OBJ({id: S, run: S, kind: S, files: SA, depends_on: SA, owner_key: S}, ['id', 'run', 'kind', 'files', 'depends_on', 'owner_key'])
const PRE = OBJ({units_exists: B, index: {type: 'array', items: IDX}, index_len: I, state_exists: B, state: {type: ['object', 'null']}, owner: {type: ['object', 'null']},
  fil1: FIL1, app_sha: SHAS, pipeline_sha: SHAS, baselines: NSHAS, b0_meta: {type: ['object', 'null'], properties: {index_sha: S, atlas_sha: S}}})
const UNIT = {type: 'object', properties: {id: S, run: S, kind: S, files: SA, acceptance: SA}, required: ['id', 'run', 'kind', 'files', 'acceptance'], additionalProperties: ANY}   // a unit object itself, never a wrapper around the array
const FULL = OBJ({units: {type: 'array', items: UNIT}, canon_len: I, ref: OBJ({name: S, path: S, exists: B, pipeline_sha: SHAS, index_sha: S, atlas_sha: S}, ['name', 'path', 'exists', 'pipeline_sha'])})
const HOLDR = OBJ({ok: B, len: I, sum: S, fil1: FIL1, app_sha: SHAS, pipeline_sha: SHAS})
const REB = OBJ({exit_code: I, path: S, sha256: S, index_sha: S, atlas_sha: S, pipeline_sha: SHAS, profile_errors: SA, infra_error: S})
const ACC = OBJ({path: S, authored: B, lint_ok: B, lint_errors: SA, accept: LOOSE, sha256: S})
const ACCR = OBJ({ok: B, len: I, sum: S, path: S, exists: B, sha256: {type: ['string', 'null']}, lint_ok: B, lint_errors: SA, accept: {type: ['object', 'null']}})   // tools/mobile-tree.js accept: the file as it is on disk
const MAN = OBJ({dirs: SA, files: NSHAS})
const NS = {type: ['string', 'null']}
const SNAPR = OBJ({ok: B, len: I, sum: S, error: S, manifest: MAN, pipeline_sha: SHAS, accept_sha: NS, owner_sha: NS, app_sha: SHAS, tree_n: I, tree_sha256: S, repo_n: I}, ['ok', 'len', 'sum', 'manifest', 'pipeline_sha', 'accept_sha', 'owner_sha', 'app_sha', 'tree_n', 'tree_sha256', 'repo_n'])
const IMPL = OBJ({summary: S, files_changed: SA, strings_added: SA, notes: S})
const CHECK = OBJ({ok: B, len: I, sum: S, pipeline_sha: SHAS, accept_sha: NS, owner_sha: NS, changed: SA, tree_changed: SA, tree_base_sha256: S, ug1: OBJ({index: S, atlas: S}), files_sha: NSHAS, app_sha: SHAS})
const RESTR = OBJ({ok: B, len: I, sum: S, dirs: SA, files: NSHAS, accept_sha: NS, owner_sha: NS, tree_changed: SA, tree_base_sha256: S, reverted: SA})
const MEAS = OBJ({exit_code: I, result: {type: ['object', 'null']}, failing_n: I, infra_error: S, stderr_tail: S})
const FIND = OBJ({findings: {type: 'array', items: OBJ({severity: {type: 'string', enum: ['blocker', 'major', 'minor', 'nit']}, title: S, evidence: S, where: S})}})
const REFUTE = OBJ({refuted: B, reason: S})
const ADV = OBJ({path: S, sha256: S, orig_sha256: S, index_sha: S, atlas_sha: S, pipeline_sha: SHAS})
const REC = OBJ({ok: B, len: I, sum: S, path: S, sha256: S, canon_len: I, units_n: I, rebase_n: I})

// ---- helpers ----
const canonJ = v => Array.isArray(v) ? v.map(canonJ) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonJ(v[k])])) : v
const same = (a, b) => JSON.stringify(canonJ(a ?? null)) === JSON.stringify(canonJ(b ?? null))
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 } return h.toString(16).padStart(8, '0') }   // must equal fnv in tools/mobile-tree.js
const lenOk = r => { if (!r || r.ok !== true || !Number.isInteger(r.len)) return false; const t = JSON.stringify(canonJ(Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'ok' && k !== 'len' && k !== 'sum')))); return t.length === r.len && fnv(t) === r.sum }   // tools/mobile-tree.js prints len and sum over every other field: a relay that dropped or altered anything, even one hex digit, fails here
const diffKeys = (a, b) => [...new Set([...Object.keys(a || {}), ...Object.keys(b || {})])].filter(k => (a || {})[k] !== (b || {})[k])
async function crit(p, o) { return (await agent(p, o)) ?? (await agent(p, {...o, label: o.label + ' (retry)'})) }
const F = (key, expected, got) => ({key, op: 'loop', expected, got: typeof got === 'string' ? got.slice(0, 300) : got})
const ID_OK = /^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/
const appOf = files => APP.filter(a => files.some(f => f === a || (f.endsWith('/') && a.startsWith(f))))
const holdsPath = (files, p) => files.some(f => f.endsWith('/') ? p.startsWith(f) : p === f)
const fil1Why = f => !f ? ['the Filigree 1 gate read died'] : [
  f.exists ? '' : 'docs/filigree/gates/1-research.json is missing (Filigree 1 not re-integrated)',
  f.exists && f.pass !== true ? 'docs/filigree/gates/1-research.json does not pass' : '',
  ...HOLD_R.filter(r => !f.rulings_used || !f.rulings_used[r] || f.rulings_used[r] === 'default' || f.rulings_used[r] === 'missing').map(r => r + ' is recorded as ' + JSON.stringify((f.rulings_used || {})[r] || 'missing') + ', not overridden')].filter(Boolean)
const servesFiles = u => !u.files.every(f => f.startsWith('docs/') || f.startsWith('tools/'))   // server.js, sw.js, vendor/, offline-manifest.json, maps-site/** and the app files are served: all eleven gates
const writableOf = u => u.files.filter(f => f !== docsAccept(u.id) && f !== OWNER_FILE)   // neither the accept file nor the owner's answers is writable by a unit
const docsOnly = u => u.files.every(f => f.startsWith('docs/'))   // edits no served file: the current reference IS a capture of its app tree
const lensModel = u => u.model === 'opus' ? {model: 'opus', effort: 'high'} : {model: 'sonnet', effort: 'high'}
const fixModel = u => ({model: u.model === 'opus' ? 'opus' : 'sonnet', effort: u.effort === 'low' ? 'medium' : u.effort === 'medium' ? 'medium' : 'high'})

// ---- 1. preflight (read-only) ----
phase('Preflight')
const askPre = l => crit(P(`Preflight read for the mobile loop (write nothing; use a node script in a mktemp -d directory that reads files with fs.readFileSync and computes sha256 with the crypto module).
1. units_exists = ${UNITS_ABS} exists and parses. The file is a JSON array of units, or an object whose "units" key is that array. index = one entry per unit, in file order: {id, run, kind, files, depends_on (default []), owner_key: unit.owner_gate ? String(unit.owner_gate.key) : ""}, every value copied exactly (no reordering, no trimming). index_len = JSON.stringify(index).length computed by node on exactly the array you return. When the file is missing or does not parse: units_exists false, index [], index_len 2.
2. state_exists / state = ${STATE_ABS} parsed verbatim (null when absent).
3. owner = ${REPO}/${OWNER_FILE} parsed verbatim (null when absent).
4. ${FIL1_RULE}
5. ${APP_RULE}
6. ${PIPE_RULE}
7. baselines = {B0: sha256 of ${REPO}/docs/mobile/baseline.json, R1: of ${REPO}/docs/mobile/captures/R1.json, final: of ${REPO}/docs/mobile/final.json, or when that is absent of ${REPO}/docs/mobile/captures/final.json}; null for a missing file.
8. b0_meta = {index_sha: meta.index_sha, atlas_sha: meta.atlas_sha} of docs/mobile/baseline.json (null when absent).
Return {units_exists, index, index_len, state_exists, state, owner, fil1, app_sha, pipeline_sha, baselines, b0_meta}.`), {label: l, phase: 'Preflight', schema: PRE, ...MECH})
let pre = await askPre('preflight read')
if (pre && pre.units_exists && JSON.stringify(pre.index).length !== pre.index_len) { log('preflight: index digest mismatch; one fresh read'); pre = await askPre('preflight read (digest retry)') }
if (!pre) die('preflight read died twice')
if (!pre.units_exists) die('units file ' + UNITS_ABS + ' is missing or does not parse (the central session copies the plan units.json there)')
if (JSON.stringify(pre.index).length !== pre.index_len) die('preflight index digest mismatch (transcription altered or truncated the units index); re-run')
for (const k of APP) if (!/^[0-9a-f]{64}$/.test((pre.app_sha || {})[k] || '')) die('preflight: no sha256 for ' + k)
const INDEX = pre.index
const byId = Object.fromEntries(INDEX.map(u => [u.id, u]))
if (Object.keys(byId).length !== INDEX.length) die('units file lists a unit id twice')

// state: loaded or initialised; the loop owns every field it writes
let ST = pre.state
if (ST != null) {
  if (typeof ST !== 'object' || ST.version !== 1 || !ST.units || typeof ST.units !== 'object' || Array.isArray(ST.units) || !Array.isArray(ST.rebase) || !ST.app_sha || typeof ST.app_sha !== 'object') die(STATE_ABS + ' is malformed (want {version:1, item, app_sha, baselines, owner_answers, units:{}, rebase:[]})')
  for (const [id, r] of Object.entries(ST.units)) if (!r || !ST_OK.includes(r.status)) die(STATE_ABS + ': unit ' + id + ' has status ' + JSON.stringify(r && r.status))
} else {
  ST = {version: 1, item: ITEM, app_sha: (pre.b0_meta && pre.b0_meta.index_sha && pre.b0_meta.atlas_sha) ? {'index.html': pre.b0_meta.index_sha, 'maps-site/index.html': pre.b0_meta.atlas_sha} : {...pre.app_sha},
    baselines: {B0: null, R1: null, final: null}, owner_answers: OWNER_FILE, units: {}, rebase: []}
  log('state: ' + STATE_ABS + ' absent; initialised (app_sha from baseline.json meta, so a change since B0 rebases first)')
}
ST.item = ITEM
ST.baselines = {B0: pre.baselines.B0 ?? null, R1: pre.baselines.R1 ?? null, final: pre.baselines.final ?? null}
ST.owner_answers = OWNER_FILE
const statusOf = id => (ST.units[id] || {}).status || null
const lastRef = () => { const r = [...ST.rebase].reverse().find(x => x && typeof x.ref === 'string' && /^(R1|rebase-\d+|after-[A-Za-z0-9][A-Za-z0-9._-]{0,31})$/.test(x.ref)); return r ? r.ref : null }   // R1: the font-faithful desktop reference, taken centrally

// ---- 2. selection ----
const runMatch = r => typeof r === 'string' && (r === ITEM || r.startsWith(ITEM + ' ('))
const SEL_IDS = ITEM_5B ? INDEX.filter(u => runMatch(u.run) || statusOf(u.id) === 'deferred-5b').map(u => u.id) : INDEX.filter(u => runMatch(u.run)).map(u => u.id)
if (!SEL_IDS.length) return {job: JOB, item: ITEM, date: DATE, mode: MODE, pass: false, reason: 'no units', units: [], note: 'no unit in ' + UNITS_ABS + ' has run "' + ITEM + '"' + (ITEM_5B ? ' or status deferred-5b' : '')}
const REF0 = lastRef()
const askFull = l => crit(P(`Read-only (a node script in a mktemp -d directory; write nothing).
1. From ${UNITS_ABS} (a JSON array of units, or an object whose "units" key is that array) return units = the full unit objects whose id is one of ${JSON.stringify(SEL_IDS)}, in file order, each copied exactly with every key and value (no reordering, no trimming, no added keys). canon_len = JSON.stringify(units).length computed by node on exactly the array you return.
2. ref: the reference capture named ${JSON.stringify(REF0 || 'auto')}: ${REF0 ? `path docs/mobile/captures/${REF0}.json` : 'path docs/mobile/captures/R1.json when it exists, else docs/mobile/baseline.json'}; return {name: ${REF0 ? JSON.stringify(REF0) : '"R1" or "B0" (whichever path you used)'}, path (repo-relative), exists, pipeline_sha: parsed.repo.pipeline_sha ({} when absent), index_sha: parsed.meta.index_sha, atlas_sha: parsed.meta.atlas_sha}.
Return {units, canon_len, ref}.`), {label: l, phase: 'Preflight', schema: FULL, ...MECH})
let full = await askFull('units + reference read')
if (full && JSON.stringify(full.units).length !== full.canon_len) { log('units read: digest mismatch (' + JSON.stringify(full.units).length + ' vs ' + full.canon_len + '); one fresh read'); full = await askFull('units + reference read (digest retry)') }
if (!full) die('units read died twice')
if (JSON.stringify(full.units).length !== full.canon_len) die('units digest mismatch (transcription altered or truncated a unit); re-run')
if (!same(full.units.map(u => u.id), SEL_IDS)) die('units read returned ' + JSON.stringify(full.units.map(u => u.id)) + ', wanted ' + JSON.stringify(SEL_IDS))
let REF = REF0
const refPath = () => REF ? 'docs/mobile/captures/' + REF + '.json' : full.ref.path
let REF_PIPE = full.ref && full.ref.exists ? full.ref.pipeline_sha : null
if (!full.ref || !full.ref.exists) log('reference ' + JSON.stringify(full.ref && full.ref.path) + ' is missing: every unit that runs re-takes the reference first')

// static refusals (code): the loop never runs central units, never a unit that names .claude/, never a unit holding both app files
function refusal(u) {
  if (!ID_OK.test(String(u.id))) return 'unit id ' + JSON.stringify(u.id) + ' is not a safe id'
  if (u.kind === 'central') return 'kind central: run by the central session, never by the loop'
  if (!KINDS.includes(u.kind)) return 'unknown kind ' + JSON.stringify(u.kind)
  if (!Array.isArray(u.files) || !u.files.length || u.files.some(f => typeof f !== 'string')) return 'files must be a non-empty array of paths'
  const bad = u.files.filter(f => !PATH_OK.test(f) || f.startsWith('/') || !segsOk(f) || f === '' || f === './')
  if (bad.length) return 'unsafe file paths ' + JSON.stringify(bad)
  if (u.files.some(f => /^\.claude(\/|$)/.test(f))) return 'refused: files include a .claude/ path (UG11: script and loop files are central-session only)'
  if (u.files.some(f => /^\.git(\/|$)/.test(f) || f === 'tools/street-drift.js' || (f.endsWith('/') && ('.claude/'.startsWith(f) || 'tools/street-drift.js'.startsWith(f))))) return 'refused: files reach .git/, .claude/ or tools/street-drift.js'
  if (u.files.some(f => f === docsAccept(u.id).replace(/[^/]+$/, '') || (STATE_REL && holdsPath([f], STATE_REL)) || (SNAP_REL && f.endsWith('/') && (SNAP_REL + '/').startsWith(f)))) return 'refused: files reach the loop\'s own state, snapshot or accept directory'
  if (appOf(u.files).length > 1) return 'refused: holds both app files (a unit holds exactly one app file as its writable path)'
  if (!MODELS.includes(u.model) || !EFFORTS.includes(u.effort)) return 'model/effort missing or invalid (' + u.model + '/' + u.effort + ')'
  if (!Array.isArray(u.acceptance) || !u.acceptance.length || u.acceptance.some(x => typeof x !== 'string')) return 'acceptance must be a non-empty array of strings'
  if (u.depends_on != null && (!Array.isArray(u.depends_on) || u.depends_on.some(x => typeof x !== 'string'))) return 'depends_on must be an array of ids'
  if (u.owner_gate && (u.owner_gate.file !== OWNER_FILE || !['q1', 'q2'].includes(u.owner_gate.key) || !u.owner_gate.values || typeof u.owner_gate.values !== 'object')) return 'owner_gate must read ' + OWNER_FILE + ' key q1 or q2 with values'
  return ''
}
function docsAccept(id) { return 'docs/mobile/accept/' + id + '.json' }

// strict file order; a dependency inside the selection must come earlier
const UNITS = full.units
const pos = Object.fromEntries(UNITS.map((u, i) => [u.id, i]))
for (const u of UNITS) for (const d of u.depends_on || []) if (pos[d] != null && pos[d] > pos[u.id]) die('unit ' + u.id + ' depends on ' + d + ', which comes later in ' + UNITS_ABS + ' (units run strictly in file order)')

// owner gate (A19 q1 for A-U2, q2 for A-U10); the loop never assumes an unrecorded answer
const owner = pre.owner && typeof pre.owner === 'object' ? pre.owner : {}
const Q1_UNIT = (INDEX.find(x => x.owner_key === 'q1') || {}).id || null
function ownerGate(u, q1Status) {
  const g = u.owner_gate
  if (!g) return {ok: true, text: ''}
  const v = owner[g.key], vals = Object.keys(g.values)
  if (g.key === 'q1') {
    if (v == null) return {defer: true, why: 'owner question q1 (the A19 tier pin) is unanswered in ' + OWNER_FILE}
    if (!vals.includes(v)) return {refuse: 'q1 answer ' + JSON.stringify(v) + ' is not one of ' + vals.join('|')}
    if (v === 'c' && !(owner.q1_values && Number.isFinite(owner.q1_values.B) && Number.isFinite(owner.q1_values.C))) return {defer: true, why: 'q1 is "c" but q1_values {B, C} are not recorded'}
    return {ok: true, text: `Owner answer q1 = "${v}": ${g.values[v]}${v === 'c' ? ' ' + JSON.stringify(owner.q1_values) : ''}.`}
  }
  if (q1Status === 'deferred-5b' && !ITEM_5B) return {defer: true, why: 'deferred with ' + Q1_UNIT + ' (owner question q1 unanswered)'}
  if (q1Status !== 'passed' && Q1_UNIT) return v == null ? {defer: true, why: Q1_UNIT + ' has not run; q2 unanswered'} : {ok: true, text: `Owner answer q2 = "${v}": ${g.values[v] || ''}.`}
  if (v == null) return {ok: true, text: `Owner question q2 is unanswered and ${Q1_UNIT} ran, so the plan default ships: "a" (${g.values.a || 'the plan default'}).`}
  if (!vals.includes(v)) return {refuse: 'q2 answer ' + JSON.stringify(v) + ' is not one of ' + vals.join('|')}
  return {ok: true, text: `Owner answer q2 = "${v}": ${g.values[v]}.`}
}

const CENTRAL_RUN = /^Mobile [0-2]( |$)/   // Mobile 0-2 (inputs, capture tool + B0, saved loop) are run centrally, never by the loop
function depWhy(u, live) {   // live: statuses decided in this run (they win over state.json)
  const why = []
  for (const d of u.depends_on || []) {
    const s = live[d] || statusOf(d), x = byId[d]
    if (!x) { why.push(d + ' is not in the units file'); continue }
    if (s === 'passed' || s === 'deferred-5b') continue
    if (pos[d] == null && (x.kind === 'central' || CENTRAL_RUN.test(String(x.run)))) { log(u.id + ': dependency ' + d + ' is a step of Mobile 0-2 or a central step outside this item; trusted (the central session runs those first and records no loop state for them)'); continue }
    why.push(d + (x.kind === 'central' ? ' (central, in this item) has not been recorded passed' : ' is ' + (s || 'not run')))
  }
  return why
}

// ---- 3. schedule (plan mode returns it) ----
function decide(u, live, simulate) {
  const r = refusal(u)
  if (r) return {action: u.kind === 'central' ? 'central' : 'refused', why: r}
  if (statusOf(u.id) === 'passed' && !RERUN.includes(u.id) && !live[u.id]) return {action: 'done', why: 'state.json records it passed (args.rerun re-runs it)'}
  if (statusOf(u.id) === 'deferred-5b' && !ITEM_5B && !RERUN.includes(u.id)) return {action: 'deferred', why: 'deferred-5b: runs under "Mobile 5b"'}
  const dw = depWhy(u, live)
  if (dw.length) return {action: 'skip', why: 'dependency not satisfied: ' + dw.join('; ')}
  const og = ownerGate(u, live[Q1_UNIT] || statusOf(Q1_UNIT))
  if (og.refuse) return {action: 'refused', why: og.refuse}
  if (og.defer) return ITEM_5B ? {action: 'held', why: og.why} : {action: 'defer', why: og.why}
  const app = appOf(u.files)
  if (app.length && fil1Why(pre.fil1).length && simulate) return {action: 'held', why: fil1Why(pre.fil1).join('; ')}
  return {action: 'run', why: '', owner: og.text, app: app[0] || null}
}
const schedule = []
{
  const live = {}
  for (const u of UNITS) {
    const d = decide(u, live, true)
    schedule.push({id: u.id, title: u.title || '', kind: u.kind, model: u.model || null, effort: u.effort || null, app_file: appOf(Array.isArray(u.files) ? u.files : [])[0] || null, files: u.files, depends_on: u.depends_on || [], action: d.action, why: d.why, owner: d.owner || ''})
    if (d.action === 'run') live[u.id] = 'passed'; else if (d.action === 'defer') live[u.id] = 'deferred-5b'; else if (['skip', 'refused', 'held'].includes(d.action)) live[u.id] = 'skipped'
  }
}
const appDrift0 = diffKeys(ST.app_sha, pre.app_sha).filter(k => APP.includes(k))
const pipeDrift0 = REF_PIPE ? diffKeys(REF_PIPE, pre.pipeline_sha) : ['reference missing']
if (MODE === 'plan') {
  return {job: JOB, item: ITEM, date: DATE, mode: MODE, pass: false, reason: 'plan', units_file: UNITS_ABS, state_file: STATE_ABS, state_exists: pre.state_exists,
    filigree1_hold: fil1Why(pre.fil1), reference: full.ref, rebase_needed: (appDrift0.length || pipeDrift0.length || ST.ref_stale === true) ? {app_files: appDrift0, pipeline: pipeDrift0, ref_stale: ST.ref_stale === true} : null,
    owner: pre.owner, schedule, note: 'plan mode wrote nothing; "run" units start in file order, each after the hold flag, the rebase trigger and its accept file'}
}

// ---- 4. full run ----
const results = [], newRebase = [], polishInserts = []
const live = {}
async function recordState(label) {
  const L = label || 'record state', want = JSON.stringify(ST).length
  const ask = l => crit(P(`Record the loop state. In a mktemp -d directory T (outside the repo) write the JSON below VERBATIM to T/state.json with a quoted heredoc (cat > T/state.json <<'EOF_STATE', then the JSON, then a line EOF_STATE); add, drop or retype nothing. Then from ${REPO} run:
${TREE_TOOL} write-state --from T/state.json --to ${STATE_ABS} --expect-len ${want}
The tool writes ${STATE_ABS} itself (write nothing else in the repo) and prints exactly one line of JSON. Return that line parsed, every key and value exactly as printed (no edits). If it exits non-zero, return {ok: false, len: -1, sum: "", path: "", sha256: "", canon_len: -1, units_n: -1, rebase_n: -1}.

${JSON.stringify(ST, null, 2)}`), {label: l, phase: 'Record', schema: REC, ...MECH})
  const good = r => lenOk(r) && r.canon_len === want && r.units_n === Object.keys(ST.units).length && r.rebase_n === ST.rebase.length
  let r = await ask(L)
  if (!good(r)) { log(L + ': state.json write not confirmed (' + (r ? 'len ' + r.len + ', canon_len ' + r.canon_len : 'died') + '); one retry'); r = await ask(L + ' (retry)') }
  if (!good(r)) die('state.json write did not read back equal (' + L + '); stop: the record is unreliable')
  return r
}
function setUnit(u, status, extra) {
  const prev = ST.units[u.id] || {}
  const all = (extra.failing || []).length ? extra.failing : status === 'passed' ? [] : [F(status, status === 'deferred-5b' ? 'an owner answer' : 'a run', extra.why || status)]   // state.json keeps the M1.3 schema: the reason travels in failing
  const failing = all.length > 40 ? [...all.slice(0, 39), F('failing.more', 'at most 40 recorded', (all.length - 39) + ' more (see the run result)')] : all   // the record agent relays state.json verbatim: keep it small
  ST.units[u.id] = {status, attempts: extra.attempts ?? prev.attempts ?? 0, capture: extra.capture ?? prev.capture ?? null, files_sha: extra.files_sha ?? prev.files_sha ?? {}, failing,
    ref_before: (prev.status === 'passed' && prev.ref_before) ? prev.ref_before : (extra.ref_before ?? prev.ref_before ?? null)}   // ref_before: the reference in force when the unit began; mobile-review scores a scope against its first unit's
  live[u.id] = status
  results.push({id: u.id, status, why: extra.why || '', attempts: ST.units[u.id].attempts, failing: (extra.failing || []).slice(0, 20)})
}
const finish = (reason, extra) => {
  const ran = results.filter(r => r.status !== 'deferred-5b' && r.status !== 'central')
  const pass = reason === 'done' && ran.length > 0 && ran.every(r => r.status === 'passed')
  return {job: JOB, item: ITEM, date: DATE, mode: MODE, pass, reason, units: results, schedule, rebase: newRebase, reference: REF || 'auto (R1 or B0)', state_file: STATE_ABS, polish_inserts: polishInserts,
    polish_note: pass ? ITEM + ': every unit passed; the central session commits each unit and checks the item' : ITEM + ' stays unchecked: ' + results.filter(r => r.status !== 'passed').map(r => r.id + ' ' + r.status + (r.why ? ' (' + r.why + ')' : '')).join('; '),
    ...(extra || {})}
}

const SNAPDIR = id => SNAP + '/' + id
const diffHow = id => `The unit's diff (no git): ${SNAPDIR(id)}/manifest.json lists every unit file at snapshot time ({dirs, files: {path: sha256 | null}}, null = absent then); compare ${SNAPDIR(id)}/files/<path> with ${REPO}/<path> (diff -u; a null entry is a new file; for each dir also list files that are new under it).`
const PARITY = 'delay, never drop: every class, control and name the desktop shows stays reachable on iphone13, pixel7 and landscape (a phone may reveal later, never lose); a phone budget never removes, delays or shrinks anything on the desktop'
const HARD = `Hard rules (docs/mobile/README.md sections 1-5, docs/mobile/gates.md UG1-UG11; these override anything else):
- ${PARITY}.
- Determinism: nothing touches the seed, W.rng, the sim, canon names or the chronicle voice; no new code names W.rng; clock-token occurrence counts stay as gates.md UG3 says unless the accept file declares the line; atlas: never touch xmur3, mulberry32, genCityCanvas, washMake or sampleCityMask.
- Anchors (UG4): keep every flag-1 literal of the eight scripts (for example var TIER_CEIL=, function setEra, function registerCityOverlay, function worldOpacityUpdate, the keydown handler, camera.near = clamp(R*0.02, 0.5, 50), let fpsAvg = 60, degradeStep); add, never rename; no "/* FILIGREE */" or "/* STREET */" text; never touch "tithe" words in maps-site/index.html.
- UG5/UG6/UG7: ANNALS.stats() keys unchanged (device state lives in ANNALS.device()); the keydown handler text unchanged; no createPane.
- UG9: new player-visible strings use table vocabulary, are listed in docs/mobile/README.md section 3, and avoid menu, drawer, modal, dismiss, toggle, tap, pinch, swipe, download, install, offline mode, dark mode, theme, save; bronze-age Nimlad voice, the Kembar, years A.B.; never saint/abbey/priest/baron or other Christian-medieval words.
- Desktop identity (UG8) on 1366x768@1 and 1440x900@2: guard phone-only CSS and JS behind (pointer:coarse) / (hover:none) / the device class, exactly as the unit specifies.
- Never change how a resource is loaded or structured to change what tools/mobile-capture.js counts (no @import or inlining to hide rules from its walker, no dropped integrity or crossorigin attribute, no timing tricks, no trimming, padding or rewording code to land a byte count); a metric that moves for a legitimate reason is the central session's call in the accept file: report it in notes and leave it failing.`

async function holdRead(u, tag) {   // null unless the tool's line arrives intact (one fresh agent on a bad relay)
  const ask = l => crit(P(`Hold read for unit ${u.id} (write nothing). From ${REPO} run exactly this one command (it reads docs/filigree/gates/1-research.json, the app files and the pipeline scripts, and writes nothing):
${TREE_TOOL} hold
It prints exactly one line of JSON. Return that line parsed, every key and value exactly as printed (no edits). If it exits non-zero, return {ok: false, len: -1, sum: "", fil1: {exists: false, pass: false, rulings_used: {}}, app_sha: {}, pipeline_sha: {}}.`), {label: l, phase: 'Hold', schema: HOLDR, ...MECH})
  const L = (tag ? tag + ' ' : '') + 'hold ' + u.id
  let h = await ask(L)
  if (h && !lenOk(h)) h = await ask(L + ' (relay retry)')
  return h && lenOk(h) ? h : null
}
async function rebase(u, h, why) {
  const name = 'rebase-' + (ST.rebase.length + 1)
  W_OK('docs/mobile/captures/' + name + '.json')
  log(u.id + ': rebase (' + why + '): re-taking the reference as docs/mobile/captures/' + name + '.json')
  const r = await crit(P(`Re-take the mobile reference capture (it replaces the old reference for every later unit; do not interpret results). ${CDN_STEP} From ${REPO} run: ${NODE_TOOL} --unit ${name} --out docs/mobile/captures/${name}.json --jobs ${JOBS}${(SERVER === 'spawn' || serverLanded()) ? ' --server spawn' : ''} --cdn-dir <T or the dir above> (both surfaces, all five profiles, the default extras, exactly as B0 was taken). ${LONG_RUN} Write nothing else. Then read docs/mobile/captures/${name}.json with a node script and return {exit_code, path: "docs/mobile/captures/${name}.json", sha256 (of the file), index_sha: meta.index_sha, atlas_sha: meta.atlas_sha, pipeline_sha: repo.pipeline_sha, profile_errors: one "<surface>.<profile>: <error>" string for every atlas.<p> or sim.<p> object that carries an error field, infra_error: "" or a short reason when the tool could not start (browser, port, CDN)}.`),
    {label: 'rebase ' + name + ' before ' + u.id, phase: 'Rebase', schema: REB, model: 'sonnet', effort: 'medium'})
  const ok = r && r.exit_code === 0 && !r.infra_error && /^[0-9a-f]{64}$/.test(r.sha256 || '') && r.index_sha === h.app_sha['index.html'] && r.atlas_sha === h.app_sha['maps-site/index.html'] && same(r.pipeline_sha, h.pipeline_sha) && !(r.profile_errors || []).length
  if (!ok) return {ok: false, why: !r ? 'rebase capture died' : r.infra_error || (r.profile_errors || []).join('; ') || 'rebase capture does not match the tree (exit ' + r.exit_code + ')'}
  const entry = {before_unit: u.id, app_sha_before: {...ST.app_sha}, app_sha_after: {...h.app_sha}, reason: why, ref: name}
  ST.rebase.push(entry); newRebase.push(entry)
  ST.app_sha = {...h.app_sha}; REF = name; REF_PIPE = {...h.pipeline_sha}; delete ST.ref_stale
  await recordState('record rebase ' + name)
  return {ok: true}
}

async function advanceRef(u, fin) {   // a passed unit's scored capture becomes the reference for every later unit (a copy: the unit's own file is rewritten if it is re-run)
  const name = 'after-' + u.id
  W_OK('docs/mobile/captures/' + name + '.json')
  const r = await crit(P(`Copy ${REPO}/docs/mobile/captures/${u.id}.json byte for byte to ${REPO}/docs/mobile/captures/${name}.json (this one new file only; the original stays). Then read the copy with a node script and return {path: "docs/mobile/captures/${name}.json", sha256 (of the copy), orig_sha256 (of the original), index_sha: meta.index_sha, atlas_sha: meta.atlas_sha, pipeline_sha: repo.pipeline_sha ({} when absent)}.`),
    {label: 'reference ' + name, phase: 'Record', schema: ADV, ...MECH})
  const ok = r && /^[0-9a-f]{64}$/.test(r.sha256 || '') && r.sha256 === r.orig_sha256 && r.index_sha === fin.app_sha['index.html'] && r.atlas_sha === fin.app_sha['maps-site/index.html'] && same(r.pipeline_sha, fin.pipeline_sha)
  if (!ok) { log(u.id + ': its capture could not be taken as the next reference (' + (r ? 'it does not describe the final tree or pipeline' : 'copy died') + '); the next unit re-takes the reference'); return false }
  const entry = {before_unit: null, after_unit: u.id, app_sha_before: {...ST.app_sha}, app_sha_after: {...fin.app_sha}, reason: 'unit passed', ref: name}
  ST.rebase.push(entry); newRebase.push(entry)
  REF = name; REF_PIPE = {...fin.pipeline_sha}; delete ST.ref_stale
  return true
}

async function authorAccept(u, complaint) {
  const ap = W_OK(docsAccept(u.id))
  return crit(P(`You are the accept-author for mobile unit ${u.id} ("${u.title || ''}"). Write ONLY ${REPO}/${ap}. You see only the unit's acceptance bullets below, docs/mobile/metrics.md (section 8 is the schema), docs/mobile/gates.md, the reference capture ${REF ? 'docs/mobile/captures/' + REF + '.json' : '(docs/mobile/captures/R1.json when it exists, else docs/mobile/baseline.json)'} for real key paths and current values, and tools/mobile-capture.js (lintAccept, evalCheck, gateResults) for ops and key paths. Never look at any implementation, diff or snapshot.
If ${ap} already exists, its "unit" is "${u.id}", it passes --lint-accept and it meets every rule below, keep it byte-unchanged (authored false). Otherwise write it (authored true):
- unit "${u.id}"; profiles ${JSON.stringify(PROFILES)}; clock "virtual"; files_touched ${JSON.stringify(u.files)};
- gates: ${servesFiles(u) ? 'all eleven, UG1..UG11, none waived (the unit touches served files: ' + JSON.stringify(u.files.filter(f => !f.startsWith('docs/') && !f.startsWith('tools/'))) + ')' : 'UG1..UG11; this unit touches only docs/ and tools/ files (nothing served), so UG2 UG3 UG5 UG6 UG7 UG8 UG10 may instead be waived in "waive": {"UGn": "<reason, 8+ chars>"}; UG1 UG4 UG9 UG11 are always listed'};
- ${REF ? `"baseline": "${REF}" (the current reference: the last passed unit's capture or the last rebase)` : 'no "baseline" key (the tool uses R1 when docs/mobile/captures/R1.json exists, else B0)'};
- ${docsOnly(u) ? `"capture": "${refPath()}" (this unit edits only docs/, so the served tree equals the reference and the tool scores against that capture instead of taking a fresh one)` : 'no "capture" key (the tool takes a fresh capture of the edited tree)'};
- checks: every measurable number in the bullets becomes {key, op, value, was: <the reference value>} (ops ==, !=, <, <=, >, >=, between, within + tol, deep-equals, absent; ref compares to a named baseline);
- declared_change_keys: exactly the concrete metric keys the unit is meant to change (surface.profile.metric; a * only for a whole middle segment; never broader);
- strings: the unit's new player-visible strings exactly as docs/mobile/README.md section 3 lists them for ${u.id} ([] when none); declared_first_view_growth {bytes, requests} only when a bullet declares growth; declared_clock_lines only for a line a bullet declares; mask only for declared regions (<= 35% of the viewport, with why);
- unscored: the text of every bullet the tool cannot measure (the review's acceptance lens reads them).
Then run: cd ${REPO} && ${NODE_TOOL} --lint-accept ${ap}. Return {path: "${ap}", authored, lint_ok (exit 0), lint_errors, accept: the file parsed, sha256 (of the file)}.${complaint ? '\nThe previous attempt was rejected: ' + complaint + ' Fix exactly that.' : ''}

Unit acceptance bullets:
${u.acceptance.map((b, i) => (i + 1) + '. ' + b).join('\n')}`), {label: 'accept ' + u.id, phase: 'Accept', schema: ACC, model: 'sonnet', effort: 'medium'})
}
async function acceptRead(u) {   // the loop scores the accept file as the tool reads it from disk, never as its author retells it (an author relayed a summary without its checks, 2026-10-05)
  const ask = l => crit(P(`Read the accept file of mobile unit ${u.id} (write nothing). From ${REPO} run exactly this one command:
${TREE_TOOL} accept --file ${docsAccept(u.id)}
It prints exactly one line of JSON. Return that line parsed, every key and value exactly as printed (no edits). If it exits non-zero, return {ok: false, len: -1, sum: "", path: "", exists: false, sha256: null, lint_ok: false, lint_errors: [], accept: null}.`), {label: l, phase: 'Accept', schema: ACCR, ...MECH})
  let r = await ask('accept read ' + u.id)
  if (r && !lenOk(r)) r = await ask('accept read ' + u.id + ' (relay retry)')
  return r && lenOk(r) ? r : null
}
function acceptWhy(u, a) {
  if (!a) return ['the accept read died or was not relayed intact twice']
  if (!a.exists || !a.accept) return ['accept file ' + docsAccept(u.id) + (a.exists ? ' does not parse: ' + (a.lint_errors || []).join('; ') : ' was not written')]
  const acc = a.accept || {}, strict = servesFiles(u), gates = Array.isArray(acc.gates) ? acc.gates : [], waive = acc.waive && typeof acc.waive === 'object' ? acc.waive : {}
  return [
    a.lint_ok === true && !(a.lint_errors || []).length ? '' : 'lint failed: ' + (a.lint_errors || []).join('; '),
    acc.unit === u.id ? '' : 'unit is ' + JSON.stringify(acc.unit),
    /^[0-9a-f]{64}$/.test(a.sha256 || '') ? '' : 'no sha256',
    PROFILES.every(p => (acc.profiles || []).includes(p)) ? '' : 'profiles must include all five',
    ...(strict ? GATES.filter(g => !gates.includes(g)).map(g => g + ' not listed (a unit that touches served files lists all eleven)') : NEVER_WAIVED.filter(g => !gates.includes(g)).map(g => g + ' must be listed')),
    ...GATES.filter(g => !gates.includes(g) && !(!strict && typeof waive[g] === 'string' && waive[g].trim().length >= 8)).map(g => g + ' neither listed nor waived'),
    (acc.baseline ?? null) === (REF ?? null) ? '' : 'baseline must be ' + JSON.stringify(REF) + ', is ' + JSON.stringify(acc.baseline),
    same(acc.files_touched, u.files) ? '' : 'files_touched must equal the unit files',
    (acc.capture ?? null) === (docsOnly(u) ? refPath() : null) ? '' : 'capture must be ' + JSON.stringify(docsOnly(u) ? refPath() : null) + ', is ' + JSON.stringify(acc.capture),
    Number.isInteger(acc.checks_n) && acc.checks_n >= 0 ? '' : 'checks missing'].filter(Boolean)
}

const GUARD = u => [docsAccept(u.id), OWNER_FILE]   // never in a unit's writable set; snapshotted and restored with it
async function snapshot(u) {
  const s1 = await snapshot1(u, '')
  return !s1 || lenOk(s1) || s1.ok === false ? s1 : snapshot1(u, ' (relay retry)')   // a refused snapshot is final; a mis-relayed one gets one fresh agent (the tool re-snapshots from scratch)
}
async function snapshot1(u, sfx) {
  const prune = Object.keys(ST.units).filter(id => id !== u.id && ID_OK.test(id) && ST.units[id].status === 'passed')   // a passed unit's tree copy is no longer needed (a failed one's stays for the central session)
  return crit(P(`Snapshot unit ${u.id} before any edit. From ${REPO} run exactly this one command (the tool does every copy and writes only under ${SNAP}; do not copy, move or delete anything yourself):
${TREE_TOOL} snapshot --unit ${u.id} --snap ${SNAP} --files '${JSON.stringify(u.files)}'${prune.length ? ' --prune ' + prune.join(',') : ''}
It prints exactly one line of JSON. Return that line parsed, every key and value exactly as printed (no edits, no re-ordering needed). If it exits non-zero, return {ok: false, len: -1, sum: "", error: <the "error" string it printed, verbatim>, manifest: {dirs: [], files: {}}, pipeline_sha: {}, accept_sha: null, owner_sha: null, app_sha: {}, tree_n: 0, tree_sha256: "", repo_n: 0}.`),
    {label: 'snapshot ' + u.id + sfx, phase: 'Snapshot', schema: SNAPR, ...MECH})
}
async function postCheck(u, tag) {
  const ask = l => crit(P(`Post-${tag} check for unit ${u.id} (write nothing). From ${REPO} run exactly this one command (it reads the repo and this unit's snapshot, which it finds under the --snap directory itself, and writes nothing; copy the command verbatim: --snap is the parent directory, never the unit's subfolder):
${TREE_TOOL} check --unit ${u.id} --snap ${SNAP}
It prints exactly one line of JSON. Return that line parsed, every key and value exactly as printed (no edits). If it exits non-zero, return {ok: false, len: -1, sum: "", pipeline_sha: {}, accept_sha: null, owner_sha: null, changed: [], tree_changed: [], tree_base_sha256: "", ug1: {index: "", atlas: ""}, files_sha: {}, app_sha: {}}.`),
    {label: l, phase: tag === 'pre-restore' ? 'Restore' : 'Implement', schema: CHECK, ...MECH})
  const c = await ask(tag + ' check ' + u.id)
  return !c || lenOk(c) ? c : (await ask(tag + ' check ' + u.id + ' (relay retry)')) || c   // a relay that altered the tool's line gets one fresh agent; checkWhy scores what comes back
}
function checkWhy(u, snap, c) {   // UG1, UG11 hash gate, accept read-only, write scope: all scored here
  if (!c || !lenOk(c)) return [F('check.digest', 'the tool output relayed intact', c ? 'len mismatch' : 'died twice')]   // a relay error, not an integrity breach: the key stays outside /^(UG11|scope|accept)/
  const ap = docsAccept(u.id), writable = writableOf(u)
  const allowed = p => holdsPath(writable, p) || p === 'docs/mobile/captures/' + u.id + '.json' || p.startsWith('docs/mobile/shots/') || (STATE_REL && p === STATE_REL)
  const out = []
  if (!same(c.pipeline_sha, snap.pipeline_sha)) out.push(F('UG11.pipeline_sha', 'unchanged .claude/workflows/*.js and tools/street-drift.js', diffKeys(snap.pipeline_sha, c.pipeline_sha).join(', ')))
  if ((c.accept_sha ?? null) !== (snap.accept_sha ?? null)) out.push(F('accept.read_only', snap.accept_sha, c.accept_sha))
  if ((c.owner_sha ?? null) !== (snap.owner_sha ?? null)) out.push(F('scope.' + OWNER_FILE, 'the owner\'s answers unchanged (' + snap.owner_sha + ')', c.owner_sha))
  if (c.tree_base_sha256 !== snap.tree_sha256) out.push(F('scope.snapshot', 'the snapshot tree manifest untouched (' + snap.tree_sha256 + ')', c.tree_base_sha256))
  for (const p of c.tree_changed || []) if (isPipe(p)) out.push(F('UG11.' + p, 'unchanged since the snapshot (script and loop files are central-session only)', 'changed')); else if (!holdsPath(writable, p)) out.push(F('scope.' + p, 'a write inside the unit files', 'changed (tree manifest)'))
  const seen = new Set(out.map(f => f.key))
  for (const p of c.changed || []) if (isPipe(p) && !seen.has('UG11.' + p)) out.push(F('UG11.' + p, 'unchanged since the snapshot (script and loop files are central-session only)', 'written')); else if (!isPipe(p) && (p === OWNER_FILE || !allowed(p)) && !seen.has('scope.' + p)) out.push(F('scope.' + p, p === OWNER_FILE ? 'the owner\'s answers unchanged' : 'a write inside the unit files', 'written'))
  if (!/^OK \d+/.test(String((c.ug1 || {}).index))) out.push(F('UG1.index.html', 'OK <n>', (c.ug1 || {}).index))
  if (!/^OK \d+/.test(String((c.ug1 || {}).atlas))) out.push(F('UG1.maps-site/index.html', 'OK <n>', (c.ug1 || {}).atlas))
  return out
}
async function measure(u, round) {
  const m = await crit(P(`Measure unit ${u.id} (round ${round}): run the tool and report; do not interpret, do not edit anything. ${CDN_STEP} From ${REPO} run: ${NODE_TOOL} --accept ${docsAccept(u.id)} --jobs ${JOBS}${serverFlag(u)} --cdn-dir <T or the dir above>, stdout to T/out.json, stderr to T/err.txt. ${LONG_RUN} (The tool writes docs/mobile/captures/${u.id}.json itself; write nothing else.) Then return {exit_code (the integer in T/code), result: T/out.json parsed (null when it does not parse), failing_n: the length of result.failing computed by node (-1 when absent), infra_error: "" or a short reason when the tool could not start (browser, port, CDN, Playwright), stderr_tail: the last 1500 characters of T/err.txt}.`),
    {label: 'measure ' + u.id + ' r' + round, phase: 'Measure', schema: MEAS, model: 'sonnet', effort: 'low'})
  if (!m) return {pass: false, infra: true, failing: [F('measure.died', 'a measurement', 'died twice')]}
  const r = m.result
  if (m.infra_error || m.exit_code === 2 || !r || typeof r !== 'object') return {pass: false, infra: true, failing: [F('measure.infra', 'the tool ran', m.infra_error || ('exit ' + m.exit_code + ' ' + (m.stderr_tail || '').slice(-200)))]}
  if (!Array.isArray(r.failing) || r.failing.length !== m.failing_n) return {pass: false, failing: [F('measure.digest', 'failing list intact (' + m.failing_n + ')', Array.isArray(r.failing) ? r.failing.length : 'absent')]}
  if ((m.exit_code === 0) !== (r.pass === true)) return {pass: false, failing: [F('measure.inconsistent', 'exit 0 iff pass', 'exit ' + m.exit_code + ', pass ' + r.pass)]}
  const pass = m.exit_code === 0 && r.pass === true && r.failing.length === 0 && r.unit === u.id
  return {pass, failing: pass ? [] : (r.failing.length ? r.failing : [F('measure.unit', u.id, r.unit)]).slice(0, 60)}
}
async function implement(u, og) {
  const ap = docsAccept(u.id), writable = writableOf(u)
  return agent(P(`Implement mobile unit ${u.id}: "${u.title || ''}" (kind ${u.kind}; defects ${JSON.stringify(u.defects || [])}, described in docs/mobile/inputs.json). Read docs/mobile/README.md, docs/mobile/gates.md and docs/mobile/metrics.md first.
Writable paths (nothing else; directories end in "/"): ${JSON.stringify(writable)}. ${appOf(u.files).length ? 'Your only app file is ' + appOf(u.files)[0] + '.' : 'You edit no app file.'}
Read-only for you: ${ap} (the accept file the measurer scores you with: read it, never edit it), ${OWNER_FILE} (the owner's recorded answers: read, never edit; any change fails the unit), every reference capture, POLISH.md unless listed above, CHANGELOG.md, VERSION, docs/filigree/**, docs/street/**.
${og ? og + '\n' : ''}${HARD}
You may self-check with ${NODE_TOOL} (a capture with --out in your temp dir, or --accept ${ap}), with --cdn-dir as in the sandbox (npm pack leaflet@1.9.4 three@0.128.0 @fontsource/eb-garamond@5.3.0 @fontsource/lora@5.3.0 @fontsource/ibm-plex-mono@5.3.0 @fontsource/im-fell-english@5.3.0 into a temp dir)${serverFlag(u) ? '; pass --server spawn' : ''}; never commit, never touch git.
Acceptance (the accept file scores the measurable part in code; reviewers read the rest):
${u.acceptance.map((b, i) => (i + 1) + '. ' + b).join('\n')}
Return {summary, files_changed (repo-relative), strings_added (every new player-visible string, verbatim), notes}.`), {label: 'implement ' + u.id, phase: 'Implement', schema: IMPL, model: u.model, effort: u.effort})
}
async function fixer(u, og, what, failing, round) {
  const ap = docsAccept(u.id), writable = writableOf(u)
  return agent(P(`Fix mobile unit ${u.id}: "${u.title || ''}" (${what}, round ${round}). ${diffHow(u.id)}
Writable paths (nothing else): ${JSON.stringify(writable)}. ${ap} and ${OWNER_FILE} are read-only (never edit the accept file to make a check pass; any change to either fails the unit). Change only what the failures below need; keep everything that already passes.${serverFlag(u) ? ' When you self-check with ' + NODE_TOOL + ', pass --server spawn.' : ''}
${og ? og + '\n' : ''}${HARD}
Failures to fix:
${JSON.stringify(failing.slice(0, 40), null, 1)}
Unit acceptance:
${u.acceptance.map((b, i) => (i + 1) + '. ' + b).join('\n')}
Return {summary, files_changed, strings_added, notes}.`), {label: 'fix ' + u.id + ' ' + what + ' r' + round, phase: 'Fix', ...fixModel(u), schema: IMPL})
}
async function restore(u, snap) {   // puts back the unit files, the accept file, the owner answers and every tree path that moved; verified in code against the snapshot
  const reverted = new Set()
  for (let k = 0; k < 2; k++) {
    const r = await crit(P_RESTORE(`Restore unit ${u.id} from its snapshot. From ${REPO} run exactly this one command, copied verbatim (--snap is the parent directory, never the unit's subfolder) (it puts back the unit files, the guarded files ${JSON.stringify(GUARD(u))} and every moved tree path, and verifies the result):
${TREE_TOOL} restore --unit ${u.id} --snap ${SNAP}
The tool does every copy and delete; do not copy, move or delete anything yourself. It prints exactly one line of JSON. Return that line parsed, every key and value exactly as printed (no edits). If it exits non-zero, return {ok: false, len: -1, sum: "", dirs: [], files: {}, accept_sha: null, owner_sha: null, tree_changed: [], tree_base_sha256: "", reverted: []}.`),
      {label: 'restore ' + u.id + (k ? ' (again)' : ''), phase: 'Restore', schema: RESTR, ...MECH})
    for (const p of (r && r.reverted) || []) reverted.add(p)
    const bad = !r ? ['restore died'] : [
      !lenOk(r) ? 'restore output not relayed intact' : '',
      same(r.files, snap.manifest.files) ? '' : 'unit files ' + diffKeys(snap.manifest.files, r.files).slice(0, 5).join(', '),
      (r.accept_sha ?? null) === (snap.accept_sha ?? null) ? '' : 'accept file ' + docsAccept(u.id),
      (r.owner_sha ?? null) === (snap.owner_sha ?? null) ? '' : OWNER_FILE,
      r.tree_base_sha256 === snap.tree_sha256 ? '' : 'the snapshot tree manifest itself moved',
      (r.tree_changed || []).length ? 'tree paths still differ: ' + r.tree_changed.slice(0, 8).join(', ') : ''].filter(Boolean)
    if (!bad.length) return {ok: true, reverted: [...reverted].sort()}
    log(u.id + ': restore did not reproduce the snapshot (' + bad.join('; ') + ')')
    if (k) return {ok: false, reverted: [...reverted].sort(), why: bad.join('; ')}
  }
}

const LENSES = [
  {id: 'desktop', when: u => u.files.some(f => APP.includes(f) || f.startsWith('maps-site/') || f === 'server.js' || f.startsWith('vendor/') || f === 'sw.js'),
    q: 'Desktop identity (UG8): does anything change on desktop 1366x768@1 or 1440x900@2 (fine pointer, hover) beyond the accept file\'s declared_change_keys: layout, behaviour, reveal zooms, controls, keyboard, timings, bytes? Look for phone-only CSS or JS that is not guarded by (pointer:coarse), (hover:none) or the device class, and for shared code paths whose desktop output moved.'},
  {id: 'parity', when: u => u.files.some(f => APP.includes(f) || f.startsWith('maps-site/')),
    q: 'Delay, never drop / class parity: ' + PARITY + '. Is every desktop control, layer, name, card and keyboard action still reachable on a phone (within two touches), and does a phone lose any class? Is anything on the desktop delayed or thinned for the phone\'s sake?'},
  {id: 'determinism', when: u => u.files.some(f => APP.includes(f)),
    q: 'Determinism: does the diff touch the seed path, W.rng (or name it), the sim tick, the ladder\'s time source, generation order, the per-tree draw order, or (atlas) xmur3, mulberry32, genCityCanvas, washMake, sampleCityMask? New clock tokens (grep -oE "Math[.]random|Date[.]now|new Date[(][)]|performance[.]now") not declared in the accept file? Can a viewport, pixel ratio, device class or host property reach generated state?'},
  {id: 'voice', when: () => true,
    q: 'Voice (UG9, docs/mobile/voice-rubric.md): every new player-visible string (labels, titles, aria-labels, hints, notices): table vocabulary, bronze-age Nimlad, the Kembar, years A.B.; listed in docs/mobile/README.md section 3; none of menu, drawer, modal, dismiss, toggle, tap, pinch, swipe, download, install, offline mode, dark mode, theme, save; no Christian-medieval words. Report nothing when the unit adds no player-visible string.'},
  {id: 'acceptance', when: () => true,
    q: 'Acceptance conformance: for each acceptance bullet (especially the accept file\'s "unscored" list, which no code measured), is it met by the diff as written? A bullet the diff does not deliver is a major; a bullet delivered in a way that breaks another bullet is a blocker.'}
]
async function review(u, og) {
  for (let c = 0; c <= CYCLES; c++) {
    const lenses = LENSES.filter(L => L.when(u))
    const per = await pipeline(lenses,
      L => crit(P(`Review lens "${L.id}" on mobile unit ${u.id}: "${u.title || ''}" (cycle ${c}; you are a fresh reviewer and see no earlier review). Read only; write nothing. ${diffHow(u.id)} Also read ${REPO}/${docsAccept(u.id)} (the scored checks) and ${REPO}/${docsOnly(u) ? refPath() : 'docs/mobile/captures/' + u.id + '.json'} (the capture the last passing measurement scored). Question: ${L.q}
Report only defects this unit's diff causes, each with evidence (path:line, the measured key, or a reproduction you ran). severity: blocker (breaks a gate, determinism, desktop identity or drops a class), major (an acceptance bullet unmet, a reachable regression), minor, nit. Return {findings: [{severity, title, evidence, where}]} ([] when clean).
Unit acceptance:
${u.acceptance.map((b, i) => (i + 1) + '. ' + b).join('\n')}`), {label: 'review ' + u.id + ' ' + L.id + ' c' + c, phase: 'Review', schema: FIND, ...lensModel(u)}),
      (res, L) => {
        if (!res) return {lens: L.id, died: true, survivors: []}
        const serious = (res.findings || []).filter(f => f.severity === 'blocker' || f.severity === 'major')
        const minor = (res.findings || []).length - serious.length
        if (minor) log(u.id + ' ' + L.id + ' c' + c + ': ' + minor + ' minor/nit finding(s) recorded, not fixed')
        return parallel(serious.map((f, i) => () => agent(P(`Try to REFUTE this review finding on mobile unit ${u.id} by checking the actual files (read only; write nothing). ${diffHow(u.id)} Finding (${f.severity}, lens ${L.id}): ${f.title}\nEvidence: ${f.evidence}\nWhere: ${f.where}\nrefuted = true only with concrete evidence that it is wrong, not caused by this unit's diff, or below major severity; when uncertain, refuted = false. Return {refuted, reason}.`),
          {label: 'refute ' + u.id + ' ' + L.id + ' #' + (i + 1) + ' c' + c, phase: 'Review', schema: REFUTE, model: 'sonnet', effort: 'medium'})))
          .then(vs => ({lens: L.id, survivors: serious.filter((f, i) => !(vs[i] && vs[i].refuted === true)).map(f => ({...f, lens: L.id}))}))
      })
    const died = per.filter(x => !x || x.died)
    if (died.length) return {ok: false, failing: [F('review.died', 'every lens reports', died.length + ' lens(es) died')]}
    const surv = per.flatMap(x => x.survivors)
    if (!surv.length) return {ok: true, cycles: c}
    log(u.id + ' review c' + c + ': ' + surv.length + ' blocker/major survived refutation')
    const failing = surv.map(f => F('review.' + f.lens + '.' + f.severity, 'no surviving blocker or major', f.title + ' :: ' + f.evidence))
    if (c === CYCLES) return {ok: false, failing}
    const fx = await fixer(u, og, 'review findings', surv, c + 1)
    if (!fx) return {ok: false, failing: [F('review.fix.died', 'a fix', 'died')]}
    attemptsBump(u)
    const g = await gateAndMeasure(u, og, 1, 'review-fix c' + (c + 1))
    if (!g.ok) return g
  }
  return {ok: false, failing: [F('review.cycles', 'clean within ' + CYCLES + ' cycles', 'not clean')]}
}
const ATT = {}
const attemptsBump = u => { ATT[u.id] = (ATT[u.id] || 0) + 1 }
let SNAPS = {}
async function gateAndMeasure(u, og, fixes, tag) {   // post-check (UG1, UG11, scope) -> measure -> <= fixes rounds
  let round = 0
  for (;;) {
    const c = await postCheck(u, tag + (round ? ' f' + round : ''))
    const cw = checkWhy(u, SNAPS[u.id], c)
    if (cw.some(f => /^(UG11|scope|accept)/.test(f.key))) return {ok: false, failing: cw, hard: true}   // integrity breach: no fix round, restore
    let m = cw.length ? {pass: false, failing: cw} : await measure(u, tag + (round ? ' f' + round : ''))
    if (m.infra) { log(u.id + ': measurement infra failure; one retry'); m = await measure(u, tag + ' infra-retry') }
    if (m.pass) return {ok: true, files_sha: c.files_sha, app_sha: c.app_sha}
    if (m.infra || round >= fixes) return {ok: false, failing: m.failing}
    round++
    const fx = await fixer(u, og, 'failing measured keys', m.failing, round)
    if (!fx) return {ok: false, failing: [F('fix.died', 'a fix', 'died')]}
    attemptsBump(u)
  }
}

for (const u of UNITS) {
  const d = decide(u, live, false)
  if (d.action === 'central' || d.action === 'done') { log(u.id + ': ' + d.action + ' (' + d.why + ')'); results.push({id: u.id, status: d.action === 'done' ? 'passed' : 'central', why: d.why, attempts: 0, failing: []}); if (d.action === 'done') live[u.id] = 'passed'; continue }
  if (d.action === 'deferred') { live[u.id] = 'deferred-5b'; results.push({id: u.id, status: 'deferred-5b', why: d.why, attempts: 0, failing: []}); continue }
  if (d.action === 'refused' || d.action === 'skip') { log(u.id + ': ' + d.action + ': ' + d.why); setUnit(u, 'skipped', {why: (d.action === 'refused' && !/^refused/.test(d.why) ? 'refused: ' : '') + d.why, failing: []}); await recordState('record ' + u.id + ' skipped'); continue }
  if (d.action === 'held') { await recordState('record before hold'); return finish('held', {held_by: u.id, held_why: d.why}) }
  if (d.action === 'defer') {
    log(u.id + ': deferred-5b (' + d.why + ')')
    setUnit(u, 'deferred-5b', {why: d.why, failing: []})
    if (u.owner_gate && u.owner_gate.key === 'q1') for (const x of INDEX.filter(x => x.owner_key === 'q2' && statusOf(x.id) !== 'passed')) { ST.units[x.id] = {status: 'deferred-5b', attempts: (ST.units[x.id] || {}).attempts || 0, capture: null, files_sha: {}, failing: [F('deferred-5b', 'an owner answer', 'deferred with ' + u.id)]}; live[x.id] = 'deferred-5b' }
    if (!polishInserts.length) polishInserts.push({where: 'directly above the Filigree 2 entry in POLISH.md', text: '- [ ] **Mobile 5b · absolute bands (OWNER-GATED)** — run mobile-build with item "Mobile 5b" once docs/mobile/owner-answers.json records q1 (and q2): the deferred units ' + [u.id, ...INDEX.filter(x => x.owner_key === 'q2').map(x => x.id)].join(', ') + '. Filigree 2 stays held while either is deferred (G9).'})
    await recordState('record ' + u.id + ' deferred-5b')
    continue
  }
  // run: hold flag + rebase trigger, then accept -> snapshot -> implement -> gates -> measure -> fix -> review -> record/restore
  phase('Hold')
  const h = await holdRead(u)
  if (!h) return finish('stopped', {stopped_at: u.id, why: 'hold read died or was not relayed intact twice'})
  if (appOf(u.files).length && fil1Why(h.fil1).length) { await recordState('record before hold'); return finish('held', {held_by: u.id, held_why: fil1Why(h.fil1).join('; ')}) }
  const appDrift = diffKeys(ST.app_sha, h.app_sha).filter(k => APP.includes(k)), pipeDrift = REF_PIPE ? diffKeys(REF_PIPE, h.pipeline_sha) : null
  if (appDrift.length || !REF_PIPE || ST.ref_stale === true || (pipeDrift.length && !docsOnly(u))) {   // a docs-only unit scores against the reference itself, so pipeline drift alone needs no new reference
    phase('Rebase')
    const why = [appDrift.length ? 'app file(s) changed outside the loop: ' + appDrift.join(', ') : '', !REF_PIPE ? 'reference capture missing' : ST.ref_stale === true ? 'the last passed unit\'s capture was not taken as the reference' : pipeDrift.length ? 'pipeline scripts changed since the reference (UG11 compares against it): ' + pipeDrift.join(', ') : ''].filter(Boolean).join('; ')
    const rb = await rebase(u, h, why)
    if (!rb.ok) { await recordState('record before stop'); return finish('rebase-failed', {stopped_at: u.id, why: rb.why}) }
  }
  const refBefore = REF || full.ref.name
  phase('Accept')
  const au = await authorAccept(u, '')
  if (au) log(u.id + ': accept file ' + (au.authored ? 'written' : 'kept'))
  let acc = await acceptRead(u)
  let aw = acceptWhy(u, acc)
  if (aw.length) { log(u.id + ': accept file rejected: ' + aw.join('; ')); await authorAccept(u, aw.join('; ')); acc = await acceptRead(u); aw = acceptWhy(u, acc) }
  if (aw.length) { setUnit(u, 'failed', {why: 'accept file not valid', ref_before: refBefore, failing: aw.map(x => F('accept', 'a valid accept file', x))}); await recordState('record ' + u.id + ' failed'); continue }
  phase('Snapshot')
  const snap = await snapshot(u)
  if (!snap || !lenOk(snap) || !snap.manifest || (snap.accept_sha ?? null) !== acc.sha256 || !same(snap.app_sha, h.app_sha) || !/^[0-9a-f]{64}$/.test(snap.tree_sha256 || '') || !(snap.tree_n >= APP.length) || !same(snap.pipeline_sha, h.pipeline_sha)) { setUnit(u, 'failed', {why: 'snapshot failed or the tree moved after the hold read', ref_before: refBefore, failing: [F('snapshot', 'a snapshot of the held tree', snap ? (snap.ok === false && snap.error ? 'tool refused: ' + snap.error : 'mismatch') : 'died')]}); await recordState('record ' + u.id + ' failed'); continue }
  SNAPS[u.id] = snap; ATT[u.id] = 0
  phase('Implement')
  const im = await implement(u, d.owner)
  attemptsBump(u)
  let outcome = im ? await gateAndMeasure(u, d.owner, MAXFIX, 'implement') : {ok: false, failing: [F('implement.died', 'an implementation', 'died')]}
  if (outcome.ok) {
    phase('Review')
    const rv = await review(u, d.owner)
    if (!rv.ok) outcome = rv
  }
  if (outcome.ok) {
    const fin = await postCheck(u, 'final')
    const fw = checkWhy(u, snap, fin)
    if (fw.length) outcome = {ok: false, failing: fw}
    else {
      ST.app_sha = {...fin.app_sha}
      setUnit(u, 'passed', {attempts: ATT[u.id], capture: docsOnly(u) ? refPath() : 'docs/mobile/captures/' + u.id + '.json', files_sha: fin.files_sha, ref_before: refBefore, failing: []})
      if (!docsOnly(u) && !(await advanceRef(u, fin))) ST.ref_stale = true   // a docs-only unit scored against the reference itself: nothing moved
      await recordState('record ' + u.id + ' passed')
      log(u.id + ': passed (' + ATT[u.id] + ' attempt(s))')
      continue
    }
  }
  phase('Restore')
  const dmg = await postCheck(u, 'pre-restore')   // what the failed unit, its fixers and its reviewers left behind, read before anything is put back
  const dw = dmg ? checkWhy(u, snap, dmg) : []
  const back = await restore(u, snap)
  const hardRe = /^(UG11|scope|accept)/
  const breaches = [...new Set([...(outcome.failing || []), ...dw].filter(f => hardRe.test(f.key)).map(f => f.key))]
  const pipeHit = [...new Set([...breaches.filter(k => /^UG11\./.test(k)).map(k => k === 'UG11.pipeline_sha' ? 'the pipeline scripts (.claude/workflows/*.js or tools/street-drift.js)' : k.slice(5)), ...back.reverted.filter(isPipe)])]   // .claude/ or tools/street-drift.js moved: the whole item halts (UG11)
  const LOOP_OUT = p => p === 'docs/mobile/captures/' + u.id + '.json' || p.startsWith('docs/mobile/shots/') || (STATE_REL && p === STATE_REL)
  const lost = dmg && lenOk(dmg) ? (dmg.changed || []).filter(p => !holdsPath(u.files, p) && !GUARD(u).includes(p) && !holdsPath(TREE, p) && !LOOP_OUT(p)) : ['(the pre-restore read died or was not relayed intact: writes outside the snapshotted paths are unknown)']   // no snapshot copy exists for these
  setUnit(u, 'failed', {attempts: ATT[u.id], capture: docsOnly(u) ? refPath() : 'docs/mobile/captures/' + u.id + '.json', files_sha: back.ok ? snap.manifest.files : {}, ref_before: refBefore, failing: outcome.failing || [], why: back.ok ? 'restored from the snapshot' + (back.reverted.length ? ' (' + back.reverted.length + ' path(s) put back)' : '') : 'RESTORE FAILED: ' + back.why})
  const hb = back.ok ? await holdRead(u, 'post-restore') : null   // the restored tree must equal the held tree; nothing a unit wrote is ever adopted as a baseline
  const stray = !back.ok ? [] : hb ? [...diffKeys(h.app_sha, hb.app_sha).filter(k => APP.includes(k)), ...diffKeys(h.pipeline_sha, hb.pipeline_sha)] : ['(the tree read died)']
  const outside = back.reverted.filter(p => !holdsPath(u.files, p))
  if (!back.ok || pipeHit.length || lost.length || stray.length) {
    await recordState('record ' + u.id + ' failed')
    const why = [!back.ok ? 'restore did not reproduce the snapshot (' + back.why + '); the central session must restore ' + JSON.stringify(u.files) + ', ' + JSON.stringify(GUARD(u)) + ' and the tree from ' + SNAPDIR(u.id) + ' (files/, guard/, tree/ with tree.json)' : '',
      pipeHit.length ? 'UG11: the unit run changed ' + pipeHit.join(', ') + (back.ok ? ' (put back from the snapshot)' : '') + '; the whole item halts until the central session has checked the pipeline' : '',
      lost.length ? 'the unit wrote outside every snapshotted path, so nothing could put these back: ' + lost.slice(0, 20).join(', ') : '',
      stray.length ? 'after the restore the app or pipeline tree still differs from the held tree: ' + stray.join(', ') : '',
      breaches.length ? 'breaches: ' + breaches.slice(0, 20).join(', ') : ''].filter(Boolean).join('; ')
    return finish(pipeHit.length ? 'halted-ug11' : 'restore-failed', {stopped_at: u.id, why, reverted: back.reverted, unrestorable: lost})
  }
  await recordState('record ' + u.id + ' failed')
  log(u.id + ': failed and restored' + (outside.length ? ' (writes outside its files put back: ' + outside.slice(0, 10).join(', ') + ')' : '') + '; its dependants are skipped')
}
return finish('done')
