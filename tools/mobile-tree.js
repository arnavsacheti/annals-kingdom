#!/usr/bin/env node
// Deterministic file operations for the mobile loop (.claude/workflows/mobile-build.js): snapshot, check and
// restore a unit's files, its guarded docs and the whole served/pipeline tree, and write the loop state.
// Every command prints exactly one JSON line on stdout: {"ok":true,...fields,"len":N,"sum":H} (N = length and
// H = 32-bit FNV-1a hex over the UTF-16 units of the key-sorted JSON of the fields; the workflow re-checks both,
// so a relay that alters one hex digit is caught) or {"ok":false,"error":"..."} with exit 1.
// Only restore writes the repo; snapshot writes only under --snap; check writes nothing.
//
//   node tools/mobile-tree.js snapshot --unit ID --snap DIR --files '<JSON array>' [--prune id1,id2] [--repo R]
//   node tools/mobile-tree.js check --unit ID --snap DIR [--repo R]
//   node tools/mobile-tree.js restore --unit ID --snap DIR [--repo R]
//   node tools/mobile-tree.js write-state --from TMP --to PATH --expect-len N
//   node tools/mobile-tree.js hold [--repo R]   (fil1 gate, app_sha, pipeline_sha; writes nothing)
//   node tools/mobile-tree.js accept --file REL [--repo R]   (an accept file read and linted; writes nothing)
//   node tools/mobile-tree.js --self-test
'use strict'
const fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os'), cp = require('child_process')

// must equal .claude/workflows/mobile-build.js
const TREE = ['index.html', 'maps-site/', 'tools/', '.claude/', 'server.js', 'vendor/']
const APP = ['index.html', 'maps-site/index.html']
const GUARD = id => ['docs/mobile/accept/' + id + '.json', 'docs/mobile/owner-answers.json']
const ID_OK = /^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/
const SHOTS = 'docs/mobile/shots/'

const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 } return h.toString(16).padStart(8, '0') }   // must equal fnv in mobile-build.js
const canon = v => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v
const sortObj = o => Object.fromEntries(Object.keys(o).sort().map(k => [k, o[k]]))
const lst = p => { try { return fs.lstatSync(p) } catch { return null } }
const isFile = p => { const s = lst(p); return !!s && s.isFile() }
const isDir = p => { const s = lst(p); return !!s && s.isDirectory() }
const shaOf = p => isFile(p) ? sha(fs.readFileSync(p)) : null
const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => a[k] !== b[k]).sort()
const holds = (list, p) => list.some(f => f.endsWith('/') ? p.startsWith(f) : p === f)
const fail = m => { const e = new Error(m); e.tool = true; throw e }
const log = (...a) => process.stderr.write(a.join(' ') + '\n')

// ---------------------------------------------------------------- args and context
function parseArgs(argv) {
  const a = {_: []}
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i]
    if (k === '--self-test') a.selfTest = true
    else if (k.startsWith('--')) { if (i + 1 >= argv.length) fail(k + ' needs a value'); a[k.slice(2)] = argv[++i] }
    else a._.push(k)
  }
  return a
}
const realish = p => {   // realpath of the deepest existing ancestor, plus the rest
  p = path.resolve(p)
  const rest = []
  for (let q = p; ; q = path.dirname(q)) {
    try { return path.join(fs.realpathSync(q), ...rest.reverse()) } catch { if (q === path.dirname(q)) return p; rest.push(path.basename(q)) }
  }
}
const under = (p, root) => p === root || p.startsWith(root + '/')
function ctxOf(a, needUnit) {
  const repo = path.resolve(a.repo || path.resolve(__dirname, '..'))
  if (!isDir(repo)) fail('--repo is not a directory: ' + repo)
  if (!a.snap || !path.isAbsolute(a.snap)) fail('--snap must be an absolute path')
  const rRepo = realish(repo), snap = path.resolve(a.snap), rSnap = realish(snap)
  if (under(rRepo, rSnap)) fail('--snap must not be the repo root or an ancestor of it')
  if (under(rSnap, path.join(rRepo, '.git')) || under(rSnap, path.join(rRepo, '.claude'))) fail('--snap must not be under .git or .claude')
  const snapRel = under(rSnap, rRepo) ? path.relative(rRepo, rSnap).split(path.sep).join('/') + '/' : null
  if (needUnit && !ID_OK.test(a.unit || '')) fail('bad --unit ' + JSON.stringify(a.unit))
  return {repo, snap, snapRel, unit: a.unit, U: needUnit ? path.join(snap, a.unit) : null, R: rel => path.join(repo, rel)}
}

// ---------------------------------------------------------------- walks (lstat semantics: no symlinks, regular files only)
function walk(c, rel, out, skip) {
  let ents
  try { ents = fs.readdirSync(path.join(c.repo, rel), {withFileTypes: true}) } catch { return out }
  for (const e of ents.sort((x, y) => x.name < y.name ? -1 : x.name > y.name ? 1 : 0)) {
    const r = rel + e.name
    if (e.isDirectory()) { if (e.name !== 'node_modules' && !skip(r + '/')) walk(c, r + '/', out, skip) }
    else if (e.isFile() && !skip(r)) out[r] = sha(fs.readFileSync(c.R(r)))
  }
  return out
}
const skipSnap = c => r => !!c.snapRel && r.startsWith(c.snapRel)
const dirWalk = (c, d) => isDir(c.R(d)) ? walk(c, d, {}, skipSnap(c)) : {}
function treeWalk(c) {
  const out = {}
  for (const e of TREE) {
    if (e.endsWith('/')) Object.assign(out, dirWalk(c, e))
    else if (isFile(c.R(e))) out[e] = sha(fs.readFileSync(c.R(e)))
  }
  return sortObj(out)
}
const repoWalk = c => sortObj(walk(c, '', {}, r => r === '.git/' || r === SHOTS || skipSnap(c)(r)))
function pipeSha(c) {
  const out = {}, wf = '.claude/workflows/'
  let ents = []
  try { ents = fs.readdirSync(c.R(wf), {withFileTypes: true}) } catch {}
  for (const e of ents) if (e.isFile() && e.name.endsWith('.js')) out[wf + e.name] = sha(fs.readFileSync(c.R(wf + e.name)))
  if (isFile(c.R('tools/street-drift.js'))) out['tools/street-drift.js'] = shaOf(c.R('tools/street-drift.js'))
  return sortObj(out)
}
const appSha = c => sortObj(Object.fromEntries(APP.filter(a => isFile(c.R(a))).map(a => [a, shaOf(c.R(a))])))
const ug1 = p => {   // CLAUDE.md "Verification" one-liner, in-process, same output text
  let s
  try { s = fs.readFileSync(p, 'utf8') } catch { return 'missing' }
  const re = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g
  let m, n = 0
  while ((m = re.exec(s))) { n++; try { new Function(m[1]) } catch (e) { return 'block ' + n + ': ' + e.message } }
  return 'OK ' + n
}

// ---------------------------------------------------------------- copies
const mkp = f => fs.mkdirSync(path.dirname(f), {recursive: true})
function cpKeep(src, dst, want) {   // copy bytes + mode + mtime; the copy must hash to want
  mkp(dst)
  fs.copyFileSync(src, dst)
  const st = fs.statSync(src)
  fs.chmodSync(dst, st.mode & 0o7777)
  fs.utimesSync(dst, st.atime, st.mtime)
  if (want && shaOf(dst) !== want) fail('copy did not reproduce ' + src + ' (changed while copying?)')
}
function safeRel(r) {
  if (typeof r !== 'string' || !r || path.isAbsolute(r) || r.includes('\\') || r.includes('\0')) return false
  const segs = (r.endsWith('/') ? r.slice(0, -1) : r).split('/')
  return segs.every(s => s && s !== '.' && s !== '..')
}
function fileEntryOk(e) {
  return typeof e === 'string' && safeRel(e) && !e.includes('//') && /^[A-Za-z0-9_/.+-]+$/.test(e) &&
    !/^\.(claude|git)(\/|$)/.test(e) && e !== 'tools/street-drift.js'   // per path segment, like mobile-build.js: .github/ and .gitignore are fine
}

// ---------------------------------------------------------------- commands
function snapshot(a) {
  const c = ctxOf(a, true), U = c.U
  let files
  try { files = JSON.parse(a.files) } catch { fail('--files must be a JSON array') }
  if (!Array.isArray(files)) fail('--files must be a JSON array')
  for (const e of files) if (!fileEntryOk(e)) fail('bad files entry ' + JSON.stringify(e))
  for (const e of files) if (!e.endsWith('/') && isDir(c.R(e))) fail('files entry ' + e + ' is a directory (end it with /)')
  const prune = a.prune ? a.prune.split(',') : []
  for (const id of prune) if (!ID_OK.test(id) || id === c.unit) fail('bad --prune id ' + JSON.stringify(id))
  fs.rmSync(U, {recursive: true, force: true})
  for (const d of ['files', 'guard', 'tree']) fs.mkdirSync(path.join(U, d), {recursive: true})
  for (const id of prune) fs.rmSync(path.join(c.snap, id, 'tree'), {recursive: true, force: true})
  const dirs = [], mf = {}
  for (const e of files) {
    if (e.endsWith('/')) {
      if (!dirs.includes(e)) dirs.push(e)
      for (const [rel, s] of Object.entries(dirWalk(c, e))) { cpKeep(c.R(rel), path.join(U, 'files', rel), s); mf[rel] = s }
    } else if (isFile(c.R(e))) { const s = shaOf(c.R(e)); cpKeep(c.R(e), path.join(U, 'files', e), s); mf[e] = s }
    else if (!(e in mf)) mf[e] = null
  }
  const manifest = {dirs, files: sortObj(mf)}
  fs.writeFileSync(path.join(U, 'manifest.json'), JSON.stringify(manifest))
  const pipeline_sha = pipeSha(c), app_sha = appSha(c)
  const [acc, own] = GUARD(c.unit), accept_sha = shaOf(c.R(acc)), owner_sha = shaOf(c.R(own))
  for (const [g, s] of [[acc, accept_sha], [own, owner_sha]]) if (s) cpKeep(c.R(g), path.join(U, 'guard', g), s)
  const tree = treeWalk(c)
  for (const [rel, s] of Object.entries(tree)) cpKeep(c.R(rel), path.join(U, 'tree', rel), s)
  fs.writeFileSync(path.join(U, 'tree.json'), JSON.stringify(tree))
  const repo = repoWalk(c)
  fs.writeFileSync(path.join(U, 'repo.json'), JSON.stringify(repo))
  fs.writeFileSync(path.join(U, 'marker'), '')
  return {manifest, pipeline_sha, accept_sha, owner_sha, app_sha, tree_n: Object.keys(tree).length,
    tree_sha256: sha(fs.readFileSync(path.join(U, 'tree.json'))), repo_n: Object.keys(repo).length}
}
function loadSnap(c) {
  for (const f of ['marker', 'manifest.json', 'tree.json', 'repo.json']) if (!isFile(path.join(c.U, f))) fail('no snapshot for unit ' + c.unit + ' (' + f + ' missing under ' + c.U + ')')
  const rd = f => JSON.parse(fs.readFileSync(path.join(c.U, f), 'utf8'))
  const manifest = rd('manifest.json'), tree = rd('tree.json'), repo = rd('repo.json')
  if (!manifest || !Array.isArray(manifest.dirs) || !manifest.files || typeof manifest.files !== 'object') fail('bad manifest.json')
  for (const r of [...manifest.dirs, ...Object.keys(manifest.files), ...Object.keys(tree)]) if (!safeRel(r)) fail('unsafe path in snapshot: ' + JSON.stringify(r))
  for (const d of manifest.dirs) if (!d.endsWith('/')) fail('bad manifest dir ' + d)
  return {manifest, tree, repo, treeRaw: fs.readFileSync(path.join(c.U, 'tree.json'))}
}
function filesSha(c, manifest) {
  const out = {}
  for (const k of Object.keys(manifest.files)) out[k] = shaOf(c.R(k))
  for (const d of manifest.dirs) Object.assign(out, dirWalk(c, d))
  return sortObj(out)
}
const guardSha = c => { const [acc, own] = GUARD(c.unit); return {accept_sha: shaOf(c.R(acc)), owner_sha: shaOf(c.R(own))} }
function check(a) {
  const c = ctxOf(a, true), s = loadSnap(c)
  return {pipeline_sha: pipeSha(c), ...guardSha(c), changed: diff(s.repo, repoWalk(c)), tree_changed: diff(s.tree, treeWalk(c)),
    tree_base_sha256: sha(fs.readFileSync(path.join(c.U, 'tree.json'))), ug1: {index: ug1(c.R('index.html')), atlas: ug1(c.R('maps-site/index.html'))},
    files_sha: filesSha(c, s.manifest), app_sha: appSha(c)}
}
function restore(a) {
  const c = ctxOf(a, true), s = loadSnap(c), U = c.U, {manifest} = s, G = GUARD(c.unit)
  const allowed = rel => safeRel(rel) && !rel.endsWith('/') && !under(rel, '.git') && !(c.snapRel && rel.startsWith(c.snapRel)) &&
    (holds(TREE, rel) || rel in manifest.files || manifest.dirs.some(d => rel.startsWith(d)) || G.includes(rel))
  const target = rel => {
    if (!allowed(rel)) fail('refusing to touch ' + JSON.stringify(rel))
    const segs = rel.split('/')
    for (let i = 1; i < segs.length; i++) { const st = lst(c.R(segs.slice(0, i).join('/'))); if (st && !st.isDirectory()) fail('refusing to write through ' + segs.slice(0, i).join('/')) }
    const st = lst(c.R(rel))
    if (st && st.isDirectory()) fail('refusing to replace directory ' + rel)
    return c.R(rel)
  }
  const reverted = new Set()
  const put = (src, rel, want) => {
    if (shaOf(src) !== want) fail('snapshot copy corrupt: ' + src)
    const p = target(rel), st = lst(p)
    if (st && (!st.isFile() || st.nlink > 1)) fs.unlinkSync(p)   // copyFileSync/chmod/utimes would write through a symlink or hard link
    cpKeep(src, p, want); reverted.add(rel)
  }
  const del = rel => { const p = target(rel); if (lst(p)) { fs.unlinkSync(p); reverted.add(rel) } }
  const plan = []   // validate every source before the first write
  const srcOk = (src, want) => shaOf(src) === want || fail('snapshot copy corrupt: ' + src)
  for (const [k, want] of Object.entries(manifest.files)) {
    if (want) { if (shaOf(c.R(k)) !== want && srcOk(path.join(U, 'files', k), want)) plan.push(() => put(path.join(U, 'files', k), k, want)) }
    else if (lst(c.R(k))) plan.push(() => del(k))
  }
  for (const d of manifest.dirs) for (const rel of Object.keys(dirWalk(c, d))) if (!(rel in manifest.files)) plan.push(() => del(rel))
  for (const g of G) {
    const src = path.join(U, 'guard', g), want = shaOf(src)
    if (want) { if (shaOf(c.R(g)) !== want) plan.push(() => put(src, g, want)) }
    else if (lst(c.R(g))) plan.push(() => del(g))
  }
  const now0 = treeWalk(c)
  for (const rel of Object.keys(s.tree)) if (now0[rel] !== s.tree[rel]) srcOk(path.join(U, 'tree', rel), s.tree[rel])
  for (const rel of [...Object.keys(manifest.files), ...Object.keys(now0), ...Object.keys(s.tree), ...G]) allowed(rel) || fail('refusing to touch ' + JSON.stringify(rel))
  for (const op of plan) op()
  const now = treeWalk(c)
  for (const [rel, want] of Object.entries(s.tree)) if (now[rel] !== want) put(path.join(U, 'tree', rel), rel, want)
  for (const rel of Object.keys(now)) if (!(rel in s.tree)) del(rel)
  return {dirs: manifest.dirs, files: filesSha(c, manifest), ...guardSha(c), tree_changed: diff(s.tree, treeWalk(c)),
    tree_base_sha256: sha(fs.readFileSync(path.join(U, 'tree.json'))), reverted: [...reverted].sort()}
}
function hold(a) {   // the hold read: Filigree 1 gate flags plus the app and pipeline shas
  const repo = path.resolve(a.repo || path.resolve(__dirname, '..'))
  if (!isDir(repo)) fail('--repo is not a directory: ' + repo)
  const c = {repo, R: rel => path.join(repo, rel)}
  let g = null
  try { g = JSON.parse(fs.readFileSync(c.R('docs/filigree/gates/1-research.json'), 'utf8')) } catch {}
  const ru = g && g.rulings_used && typeof g.rulings_used === 'object' ? g.rulings_used : {}
  const fil1 = {exists: !!g, pass: !!g && g.pass === true, rulings_used: Object.fromEntries(['R2', 'R7', 'R12', 'R14', 'R18'].map(r => [r, g && typeof ru[r] === 'string' ? ru[r] : 'missing']))}
  return {fil1, app_sha: appSha(c), pipeline_sha: pipeSha(c)}
}
function accept(a) {   // what the loop scores an accept file by, read from disk (an author's own retelling of it is never trusted)
  const repo = path.resolve(a.repo || path.resolve(__dirname, '..'))
  if (!isDir(repo)) fail('--repo is not a directory: ' + repo)
  const rel = String(a.file || '')
  if (!/^docs\/mobile\/accept\/[A-Za-z0-9][A-Za-z0-9._-]{0,31}\.json$/.test(rel)) fail('--file must be docs/mobile/accept/<id>.json')
  const f = path.join(repo, rel)
  if (!isFile(f)) return {path: rel, exists: false, sha256: null, lint_ok: false, lint_errors: ['missing'], accept: null}
  const buf = fs.readFileSync(f)
  let j = null
  try { j = JSON.parse(buf.toString('utf8')) } catch (e) { return {path: rel, exists: true, sha256: sha(buf), lint_ok: false, lint_errors: ['does not parse: ' + e.message], accept: null} }
  const r = cp.spawnSync(process.execPath, [path.join(__dirname, 'mobile-capture.js'), '--lint-accept', f], {encoding: 'utf8'})
  let lint = null
  try { lint = JSON.parse(r.stdout) } catch {}
  const pick = k => j && Object.prototype.hasOwnProperty.call(j, k) ? j[k] : null
  return {path: rel, exists: true, sha256: sha(buf), lint_ok: r.status === 0 && !!lint && lint.ok === true, lint_errors: lint && Array.isArray(lint.errors) ? lint.errors.map(String) : ['lint did not run: exit ' + r.status],
    accept: {unit: pick('unit'), profiles: pick('profiles'), gates: pick('gates'), waive: pick('waive'), baseline: pick('baseline'), capture: pick('capture'), files_touched: pick('files_touched'),
      checks_n: Array.isArray(pick('checks')) ? j.checks.length : -1, declared_n: Array.isArray(pick('declared_change_keys')) ? j.declared_change_keys.length : -1}}
}
function writeState(a) {
  if (!a.from || !a.to) fail('write-state needs --from and --to')
  if (!/^\d+$/.test(a['expect-len'] || '')) fail('--expect-len must be a non-negative integer')
  const N = +a['expect-len']
  let parsed
  try { parsed = JSON.parse(fs.readFileSync(a.from, 'utf8')) } catch (e) { fail('--from does not parse: ' + e.message) }
  const got = JSON.stringify(parsed).length
  if (got !== N) fail('length ' + got + ' !== --expect-len ' + N + ' (the JSON was not written verbatim)')
  if (!a.to.endsWith('.json')) fail('--to must end in .json')
  fs.mkdirSync(path.dirname(path.resolve(a.to)), {recursive: true})
  fs.writeFileSync(a.to, JSON.stringify(parsed, null, 2) + '\n')
  const buf = fs.readFileSync(a.to), re = JSON.parse(buf.toString('utf8'))
  if (JSON.stringify(canon(re)) !== JSON.stringify(canon(parsed))) fail('written state does not read back equal')
  return {path: a.to, sha256: sha(buf), canon_len: JSON.stringify(re).length,
    units_n: Object.keys((re && re.units) || {}).length, rebase_n: ((re && re.rebase) || []).length}
}

// ---------------------------------------------------------------- self-test
function selfTest() {
  const T = fs.mkdtempSync(path.join(os.tmpdir(), 'mobile-tree-')), SNAP = path.join(T, 'docs/mobile/shots/loop')
  let n = 0
  const ok = (cond, name) => { if (!cond) throw Object.assign(new Error('self-test: ' + name), {tool: true}); n++ }
  const W = (rel, s) => { mkp(path.join(T, rel)); fs.writeFileSync(path.join(T, rel), s) }
  const RD = rel => fs.readFileSync(path.join(T, rel), 'utf8')
  const S = rel => sha(fs.readFileSync(path.join(T, rel)))
  const eq = (x, y) => JSON.stringify(canon(x)) === JSON.stringify(canon(y))
  const run = (args, repo = true) => {
    const r = cp.spawnSync(process.execPath, [__filename, ...args, ...(repo ? ['--repo', T] : [])], {encoding: 'utf8'})
    const lines = r.stdout.split('\n')
    let j = null
    try { j = JSON.parse(lines[0]) } catch {}
    return {code: r.status, j, oneLine: lines.length === 2 && lines[1] === '' && !!j, stderr: r.stderr}
  }
  const lenOk = j => { if (!j || j.ok !== true) return false; const t = JSON.stringify(canon(Object.fromEntries(Object.entries(j).filter(([k]) => k !== 'ok' && k !== 'len' && k !== 'sum')))); return j.len === t.length && j.sum === fnv(t) }
  const good = (r, name) => { if (!(r.code === 0 && r.oneLine && lenOk(r.j))) log(name, JSON.stringify(r)); ok(r.code === 0 && r.oneLine && lenOk(r.j), name + ': exit 0, one line, len digest') ; return r.j }
  const bad = (r, name) => ok(r.code === 1 && r.oneLine && r.j.ok === false && typeof r.j.error === 'string', name + ': refused with exit 1')
  const oneLiner = file => { const r = cp.spawnSync(process.execPath, ['-e', 'const fs=require("fs");const s=fs.readFileSync("index.html","utf8");const re=/<script(?![^>]*src)[^>]*>([\\s\\S]*?)<\\/script>/g;let m,n=0;while(m=re.exec(s)){n++;try{new Function(m[1])}catch(e){console.error("block "+n+": "+e.message);process.exit(1)}}console.log("OK "+n)'.replace('"index.html"', JSON.stringify(file))], {cwd: T, encoding: 'utf8'}); return (r.stdout + r.stderr).split('\n')[0] }
  try {
    W('index.html', '<html><script src="x.js"></script><script>var a = 1; function f() { return a }</script></html>\n')
    W('maps-site/index.html', '<html><body><script>let b = [1, 2].map(x => x * 2)</script></body></html>\n')
    W('maps-site/a/b.txt', 'b\n'); W('tools/street-drift.js', '// drift\n'); W('tools/x.js', '// x\n'); fs.chmodSync(path.join(T, 'tools/x.js'), 0o755)
    W('tools/node_modules/m.js', 'nm\n'); W('.claude/workflows/w.js', '// w\n'); W('.claude/CLAUDE.md', '# c\n'); W('server.js', '// s\n')
    W('vendor/v.js', '// v\n'); W('docs/mobile/accept/T1.json', '{"a":1}\n'); W('docs/mobile/owner-answers.json', '{"o":1}\n'); W('docs/other.md', 'other\n')
    W('node_modules/skip.js', 'skip\n'); W('.git/HEAD', 'ref\n'); fs.symlinkSync('index.html', path.join(T, 'maps-site/link.html'))
    fs.utimesSync(path.join(T, 'index.html'), new Date(1e12), new Date(1e12))
    const FILES = JSON.stringify(['server.js', 'maps-site/a/', 'docs/absent.md'])

    const s1 = good(run(['snapshot', '--unit', 'T1', '--snap', SNAP, '--files', FILES]), 'snapshot')
    const U1 = path.join(SNAP, 'T1')
    ok(eq(s1.manifest, {dirs: ['maps-site/a/'], files: {'docs/absent.md': null, 'maps-site/a/b.txt': S('maps-site/a/b.txt'), 'server.js': S('server.js')}}), 'snapshot manifest')
    ok(eq(s1.pipeline_sha, {'.claude/workflows/w.js': S('.claude/workflows/w.js'), 'tools/street-drift.js': S('tools/street-drift.js')}), 'snapshot pipeline_sha')
    ok(eq(s1.app_sha, {'index.html': S('index.html'), 'maps-site/index.html': S('maps-site/index.html')}), 'snapshot app_sha')
    ok(s1.accept_sha === S('docs/mobile/accept/T1.json') && s1.owner_sha === S('docs/mobile/owner-answers.json'), 'snapshot accept_sha/owner_sha')
    const treeJ = JSON.parse(fs.readFileSync(path.join(U1, 'tree.json'), 'utf8'))
    ok(eq(Object.keys(treeJ), ['.claude/CLAUDE.md', '.claude/workflows/w.js', 'index.html', 'maps-site/a/b.txt', 'maps-site/index.html', 'server.js', 'tools/street-drift.js', 'tools/x.js', 'vendor/v.js']) && s1.tree_n === 9, 'tree excludes node_modules and the symlink')
    ok(s1.tree_sha256 === sha(fs.readFileSync(path.join(U1, 'tree.json'))) && !/\s/.test(fs.readFileSync(path.join(U1, 'tree.json'), 'utf8')), 'tree.json as written, no whitespace')
    ok(fs.statSync(path.join(U1, 'tree/index.html')).mtimeMs === 1e12 && (fs.statSync(path.join(U1, 'tree/tools/x.js')).mode & 0o777) === 0o755, 'tree copies keep mtime and mode')
    ok(s1.repo_n === 12, 'repo walk skips .git, node_modules, symlinks and shots')
    ok(isFile(path.join(U1, 'marker')) && RD('docs/mobile/accept/T1.json') === fs.readFileSync(path.join(U1, 'guard/docs/mobile/accept/T1.json'), 'utf8') && RD('server.js') === fs.readFileSync(path.join(U1, 'files/server.js'), 'utf8'), 'marker, guard and unit copies')

    const chk = () => good(run(['check', '--unit', 'T1', '--snap', SNAP]), 'check')
    let c1 = chk()
    ok(eq(c1.changed, []) && eq(c1.tree_changed, []), 'check after snapshot: nothing changed')
    ok(c1.ug1.index === 'OK 1' && c1.ug1.atlas === 'OK 1' && c1.ug1.index === oneLiner('index.html') && c1.ug1.atlas === oneLiner('maps-site/index.html'), 'ug1 OK 1 both, equal to the one-liner')
    ok(eq(c1.files_sha, s1.manifest.files) && c1.tree_base_sha256 === s1.tree_sha256 && eq(c1.pipeline_sha, s1.pipeline_sha) && eq(c1.app_sha, s1.app_sha), 'check shas equal the snapshot')
    const later = new Date(Date.now() + 60000)
    const touch = d => { for (const e of fs.readdirSync(d, {withFileTypes: true})) { const p = path.join(d, e.name); if (e.isDirectory()) { if (p !== SNAP) touch(p) } else if (e.isFile()) fs.utimesSync(p, later, later) } }
    touch(T)
    c1 = chk()
    ok(eq(c1.changed, []) && eq(c1.tree_changed, []), 'mtime re-touch is not a change')

    W('server.js', '// s2\n'); W('.claude/CLAUDE.md', '# c2\n'); fs.unlinkSync(path.join(T, 'maps-site/a/b.txt')); W('tools/new.js', '// new\n')
    W('docs/other.md', 'other2\n'); W('docs/mobile/shots/x.png', 'png'); W('docs/mobile/accept/T1.json', '{"a":2}\n')
    c1 = chk()
    ok(eq(c1.changed, ['.claude/CLAUDE.md', 'docs/mobile/accept/T1.json', 'docs/other.md', 'maps-site/a/b.txt', 'server.js', 'tools/new.js']), 'check: changed lists exactly the edits (not shots)')
    ok(eq(c1.tree_changed, ['.claude/CLAUDE.md', 'maps-site/a/b.txt', 'server.js', 'tools/new.js']), 'check: tree_changed = the four TREE paths')
    ok(c1.accept_sha === S('docs/mobile/accept/T1.json') && c1.accept_sha !== s1.accept_sha && c1.owner_sha === s1.owner_sha, 'check: accept_sha moved, owner_sha not')
    ok(c1.files_sha['server.js'] === S('server.js') && c1.files_sha['maps-site/a/b.txt'] === null && !eq(c1.files_sha, s1.manifest.files), 'check: files_sha moved')
    W('index.html', '<html><script>var a = ;</script></html>\n')
    c1 = chk()
    ok(c1.ug1.index.startsWith('block 1:') && c1.ug1.index === oneLiner('index.html') && c1.ug1.atlas === 'OK 1', 'ug1.index reports block 1 like the one-liner')
    ok(c1.changed.includes('index.html') && c1.tree_changed.includes('index.html') && c1.app_sha['index.html'] !== s1.app_sha['index.html'], 'broken index.html is a change')

    const r1 = good(run(['restore', '--unit', 'T1', '--snap', SNAP]), 'restore')
    ok(eq(r1.reverted, ['.claude/CLAUDE.md', 'docs/mobile/accept/T1.json', 'index.html', 'maps-site/a/b.txt', 'server.js', 'tools/new.js']), 'restore: reverted = the moved snapshot paths')
    ok(eq(r1.tree_changed, []) && eq(r1.files, s1.manifest.files) && eq(r1.dirs, s1.manifest.dirs) && r1.tree_base_sha256 === s1.tree_sha256, 'restore: tree and files back')
    ok(r1.accept_sha === s1.accept_sha && r1.owner_sha === s1.owner_sha, 'restore: guard shas back')
    ok(RD('docs/other.md') === 'other2\n' && isFile(path.join(T, 'docs/mobile/shots/x.png')) && !isFile(path.join(T, 'tools/new.js')), 'restore never touches docs/other.md or shots')
    ok(fs.statSync(path.join(T, 'index.html')).mtimeMs === 1e12, 'restore keeps the snapshot mtime')
    c1 = chk()
    ok(eq(c1.changed, ['docs/other.md']) && eq(c1.tree_changed, []) && c1.ug1.index === 'OK 1', 'check after restore: only docs/other.md differs')
    const r2 = good(run(['restore', '--unit', 'T1', '--snap', SNAP]), 'second restore')
    ok(eq(r2.reverted, []), 'second restore reverts nothing')
    W('docs/victim.txt', 'SECRET\n'); W('docs/victim2.txt', 'SECRET2\n'); const vt = fs.statSync(path.join(T, 'docs/victim.txt')).mtimeMs
    for (const [rel, to] of [['tools/x.js', 'docs/victim.txt'], ['server.js', 'docs/victim.txt'], ['docs/mobile/accept/T1.json', 'docs/victim.txt'], ['docs/absent.md', 'docs/victim2.txt']]) { if (lst(path.join(T, rel))) fs.unlinkSync(path.join(T, rel)); fs.symlinkSync(path.join(T, to), path.join(T, rel)) }
    fs.unlinkSync(path.join(T, 'vendor/v.js')); fs.linkSync(path.join(T, 'docs/victim2.txt'), path.join(T, 'vendor/v.js'))
    const r4 = good(run(['restore', '--unit', 'T1', '--snap', SNAP]), 'restore over symlinked/hard-linked targets')
    ok(eq(r4.reverted, ['docs/absent.md', 'docs/mobile/accept/T1.json', 'server.js', 'tools/x.js', 'vendor/v.js']) && eq(r4.tree_changed, []) && eq(r4.files, s1.manifest.files) && r4.accept_sha === s1.accept_sha, 'restore replaces links at targets')
    ok(RD('docs/victim.txt') === 'SECRET\n' && fs.statSync(path.join(T, 'docs/victim.txt')).mtimeMs === vt && RD('docs/victim2.txt') === 'SECRET2\n', 'restore never writes through a link')
    ok(['tools/x.js', 'server.js', 'docs/mobile/accept/T1.json', 'vendor/v.js'].every(r => isFile(path.join(T, r)) && fs.lstatSync(path.join(T, r)).nlink === 1) && !lst(path.join(T, 'docs/absent.md')) && (fs.statSync(path.join(T, 'tools/x.js')).mode & 0o777) === 0o755, 'linked targets are regular files again')
    fs.unlinkSync(path.join(T, 'docs/victim.txt')); fs.unlinkSync(path.join(T, 'docs/victim2.txt'))
    ok(eq(good(run(['restore', '--unit', 'T1', '--snap', SNAP]), 'restore after links').reverted, []), 'restore after links reverts nothing')

    const s2 = good(run(['snapshot', '--unit', 'T2', '--snap', SNAP, '--files', JSON.stringify(['maps-site/a/', 'docs/t2.md']), '--prune', 'T1']), 'snapshot T2 with prune')
    ok(s2.accept_sha === null && !fs.existsSync(path.join(U1, 'tree')) && isFile(path.join(U1, 'manifest.json')), 'absent accept is null; prune removes only the tree copy')
    W('maps-site/a/new.txt', 'n\n'); W('docs/t2.md', 't2\n'); W('docs/mobile/accept/T2.json', '{}\n')
    const r3 = good(run(['restore', '--unit', 'T2', '--snap', SNAP]), 'restore T2')
    ok(eq(r3.reverted, ['docs/mobile/accept/T2.json', 'docs/t2.md', 'maps-site/a/new.txt']) && r3.accept_sha === null && !fs.existsSync(path.join(T, 'docs/t2.md')), 'restore deletes files the snapshot lacked')
    bad(run(['check', '--unit', 'T9', '--snap', SNAP]), 'check without a snapshot')

    const st = {units: {b: {status: 'passed'}, a: {status: 'failed', failing: [{key: 'x'}]}}, rebase: [{at: 1}], z: 'é'}
    W('tmp/state.json', JSON.stringify(st)); const L = JSON.stringify(st).length
    const to = path.join(T, 'out/deep/state.json')
    const w = good(run(['write-state', '--from', path.join(T, 'tmp/state.json'), '--to', to, '--expect-len', String(L)], false), 'write-state')
    ok(w.path === to && w.sha256 === sha(fs.readFileSync(to)) && w.canon_len === L && w.units_n === 2 && w.rebase_n === 1 && fs.readFileSync(to, 'utf8') === JSON.stringify(st, null, 2) + '\n', 'write-state round-trip')
    bad(run(['write-state', '--from', path.join(T, 'tmp/state.json'), '--to', to, '--expect-len', String(L + 1)], false), 'write-state wrong --expect-len')
    bad(run(['write-state', '--from', path.join(T, 'tmp/state.json'), '--to', path.join(T, 'out/s.txt'), '--expect-len', String(L)], false), 'write-state non-.json target')

    bad(run(['snapshot', '--unit', 'T3', '--snap', T, '--files', '[]']), '--snap = repo root')
    bad(run(['snapshot', '--unit', 'T3', '--snap', path.dirname(T), '--files', '[]']), '--snap = repo ancestor')
    bad(run(['snapshot', '--unit', 'T3', '--snap', path.join(T, '.claude/snap'), '--files', '[]']), '--snap under .claude')
    bad(run(['snapshot', '--unit', 'T3', '--snap', path.join(T, '.git/snap'), '--files', '[]']), '--snap under .git')
    bad(run(['snapshot', '--unit', '../x', '--snap', SNAP, '--files', '[]']), 'unit id ../x')
    for (const e of ['../etc/passwd', '.claude/x', '.claude', '.claude/', '.git/x', '.git', 'tools/street-drift.js', '/etc/passwd', 'a//b', './a', 'a b']) bad(run(['snapshot', '--unit', 'T3', '--snap', SNAP, '--files', JSON.stringify([e])]), 'files entry ' + e)
    bad(run(['snapshot', '--unit', 'T3', '--snap', SNAP, '--files', JSON.stringify(['maps-site'])]), 'dir entry without slash')
    ok(!fs.existsSync(path.join(SNAP, 'T3')) && RD('docs/other.md') === 'other2\n', 'refusals write nothing')
    W('.github/workflows/pages.yml', 'on: push\n'); W('.gitignore', 'x\n')
    const s4 = good(run(['snapshot', '--unit', 'T4', '--snap', SNAP, '--files', JSON.stringify(['DEPLOY.md', '.github/workflows/pages.yml', '.gitignore', '.claudex/'])]), 'snapshot accepts .github/x, .gitignore, .claudex/')
    ok(eq(s4.manifest.files, {'.github/workflows/pages.yml': S('.github/workflows/pages.yml'), '.gitignore': S('.gitignore'), 'DEPLOY.md': null}) && eq(s4.manifest.dirs, ['.claudex/']), 'snapshot manifest for dot-prefixed (non .git/.claude) entries')
    W('.github/workflows/pages.yml', 'on: pull\n'); fs.unlinkSync(path.join(T, '.gitignore')); W('DEPLOY.md', 'd\n')
    ok(fnv('') === '811c9dc5' && fnv('a') === 'e40c292c' && fnv('foobar') === 'bf9cf968', 'fnv-1a 32 known vectors')
    const h1 = good(run(['hold']), 'hold')
    ok(h1.fil1.exists === false && h1.fil1.pass === false && h1.fil1.rulings_used.R12 === 'missing' && eq(h1.app_sha, {'index.html': S('index.html'), 'maps-site/index.html': S('maps-site/index.html')}) && h1.pipeline_sha['tools/street-drift.js'] === S('tools/street-drift.js'), 'hold: no gate file, app and pipeline shas')
    W('docs/filigree/gates/1-research.json', JSON.stringify({pass: true, rulings_used: {R2: 'rulings.json', R7: 'default', R12: 'rulings.json', R14: 'rulings.json'}}))
    const h2 = good(run(['hold']), 'hold with a gate')
    ok(h2.fil1.exists && h2.fil1.pass === true && h2.fil1.rulings_used.R7 === 'default' && h2.fil1.rulings_used.R18 === 'missing' && h2.fil1.rulings_used.R2 === 'rulings.json', 'hold: gate flags read')
    W('docs/mobile/accept/T9.json', JSON.stringify({unit: 'T9', checks: [1, 2], declared_change_keys: []}))
    const ac = good(run(['accept', '--file', 'docs/mobile/accept/T9.json']), 'accept read')
    ok(ac.exists && ac.sha256 === S('docs/mobile/accept/T9.json') && ac.accept.unit === 'T9' && ac.accept.checks_n === 2 && ac.accept.declared_n === 0 && ac.accept.baseline === null && typeof ac.lint_ok === 'boolean' && Array.isArray(ac.lint_errors), 'accept: read from disk (unit, sha, counts, absent keys null)')
    const am = good(run(['accept', '--file', 'docs/mobile/accept/NOPE.json']), 'accept missing')
    ok(am.exists === false && am.accept === null && am.lint_ok === false, 'accept: a missing file is reported, not invented')
    bad(run(['accept', '--file', '../x.json']), 'accept outside docs/mobile/accept')
    const tam = {...h2, sum: h2.sum, pipeline_sha: {...h2.pipeline_sha, 'tools/street-drift.js': h2.pipeline_sha['tools/street-drift.js'].replace(/^./, ch => ch === 'a' ? 'b' : 'a')}}
    ok(!lenOk(tam) && tam.len === h2.len, 'sum: one altered hex digit keeps len but fails the sum')
    const r5 = good(run(['restore', '--unit', 'T4', '--snap', SNAP]), 'restore T4')
    ok(eq(r5.reverted, ['.github/workflows/pages.yml', '.gitignore', 'DEPLOY.md']) && RD('.github/workflows/pages.yml') === 'on: push\n' && RD('.gitignore') === 'x\n' && !lst(path.join(T, 'DEPLOY.md')), 'restore T4 reverts .github/x and .gitignore')
  } finally { fs.rmSync(T, {recursive: true, force: true}) }
  return 'OK ' + n
}

// ---------------------------------------------------------------- main
function main() {
  const argv = process.argv.slice(2)
  try {
    const a = parseArgs(argv)
    if (a.selfTest) { process.stdout.write(JSON.stringify({ok: true, self_test: selfTest()}) + '\n'); return }
    const cmd = a._[0], fn = {snapshot, check, restore, 'write-state': writeState, hold, accept}[cmd]
    if (!fn || a._.length !== 1) fail('usage: mobile-tree.js snapshot|check|restore|write-state|hold|accept ... | --self-test')
    const f = canon(fn(a)), t = JSON.stringify(f)
    process.stdout.write(JSON.stringify({ok: true, ...f, len: t.length, sum: fnv(t)}) + '\n')
  } catch (e) {
    if (!e.tool) log(e.stack || String(e))
    process.stdout.write(JSON.stringify({ok: false, error: String(e.message || e)}) + '\n')
    process.exitCode = 1
  }
}
main()
