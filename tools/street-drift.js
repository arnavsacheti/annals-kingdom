#!/usr/bin/env node
// tools/street-drift.js — read-only drift check for the street workflows (docs/street/README.md §8 (c)).
// The street prelude is filigree prelude v1 under seven whole-line masks plus one config region; this proves it.
// Usage: node tools/street-drift.js [--json] [--repo <dir>] [--self-test]   exit 0 ok, 1 drift, 2 usage or no street scripts
'use strict'
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto')

const argv = process.argv.slice(2)
const JSON_OUT = argv.includes('--json')
const ri = argv.indexOf('--repo')
const REPO = path.resolve(ri >= 0 ? argv[ri + 1] || '' : path.join(__dirname, '..'))
const WF = d => path.join(d, '.claude', 'workflows')
const FIL_NAMES = ['filigree-1-research', 'filigree-2-plan', 'filigree-3-build', 'filigree-4-review']
const ST_NAMES = ['street-1-research', 'street-2-plan', 'street-3-build', 'street-4-review']
const F_START = '// ==== filigree prelude v1', F_END = '// ==== end filigree prelude ===='
const S_START = '// ==== street prelude v1', S_END = '// ==== end street prelude ===='
const C_START = '// ---- street config ----\n', C_END = '// ---- end street config ----\n'
const MASKS = [
  ['START', /^\/\/ ==== (filigree|street) prelude v1.*$/m],
  ['END', /^\/\/ ==== end (filigree|street) prelude ====$/m],
  ['OUT', /^const OUT = .*$/m],
  ['DOCS', /^const DOCS = .*$/m],
  ['FULLOUT', /^if \(MODE === 'full' && !underDocs\(OUTABS\)\).*$/m],
  ['J1FORCE', /^if \(A\.force != null && JOB === .*$/m],
  ['ANCHORS', /^const ANCHORS = \[\n[\s\S]*?\n\]$/m]
]
const sha = t => crypto.createHash('sha256').update(t).digest('hex')
const read = f => fs.readFileSync(f, 'utf8')
function block(text, a, b, who) {   // from marker a through the end of marker b
  const i = text.indexOf(a), j = i < 0 ? -1 : text.indexOf(b, i)
  if (i < 0 || j < 0) throw new Error(who + ': markers ' + JSON.stringify(a) + ' .. ' + JSON.stringify(b) + ' not found')
  return text.slice(i, j + b.length)
}
function masked(t, who) {
  return MASKS.reduce((x, [name, re]) => {
    const n = (x.match(new RegExp(re.source, 'gm')) || []).length
    if (n !== 1) throw new Error(who + ': mask missing ' + name + ' (matched ' + n + ' times)')
    return x.replace(re, '<<' + name + '>>')
  }, t)
}
function stripConfig(p, who) {
  const c0 = p.indexOf(C_START), c1 = p.indexOf(C_END)
  if (c0 < 0 || c1 < c0 || p.indexOf(C_START, c0 + 1) >= 0) throw new Error(who + ': street config markers missing or repeated')
  return p.slice(0, c0) + p.slice(c1 + C_END.length)
}
function configOf(p, who) {
  const c0 = p.indexOf(C_START), c1 = p.indexOf(C_END)
  if (c0 < 0 || c1 < c0) throw new Error(who + ': street config markers missing')
  return p.slice(c0, c1 + C_END.length)
}
function lineOf(text, startsWith, who) {
  const l = text.split('\n').find(x => x.startsWith(startsWith))
  if (l == null) throw new Error(who + ': no line starting ' + JSON.stringify(startsWith))
  return l
}
function evalLiteral(text, head, who) {   // "const X = <literal>" spanning to the first line that is exactly "}" or "]"
  const i = text.indexOf(head)
  if (i < 0) throw new Error(who + ': ' + head + ' not found')
  const close = head.trim().endsWith('{') ? '\n}' : '\n]'
  const j = text.indexOf(close, i)
  if (j < 0) throw new Error(who + ': end of ' + head + ' not found')
  return new Function('return ' + text.slice(i + head.length - 1, j + 2))()
}
const AF = Object.getPrototypeOf(async function () {}).constructor
const FORBID = /\b(Date\.now|Math\.random|performance\.now)\s*\(|new Date\s*\(\s*\)|\brequire\s*\(|^\s*import\s/m

function metaCheck(file, stem) {   // filigree README §8 (a) + (b), applied to one script
  const s = read(file), errs = []
  if (!s.startsWith('export const meta = {')) errs.push('line 1 must be "export const meta = {"')
  try { new AF('agent', 'parallel', 'pipeline', 'phase', 'log', 'args', 'budget', 'workflow', s.replace(/^export const meta/m, 'const meta')) } catch (e) { errs.push('parse: ' + e.message) }
  const i = s.indexOf('\nconst JOB = ')
  if (i < 0) { errs.push('no "const JOB = " line'); return errs }
  const metaSrc = s.slice(0, i)
  if (/`|\$\{|\.\.\./.test(metaSrc)) errs.push('meta is not a pure literal (template, interpolation or spread)')
  let meta = null
  try { meta = new Function(metaSrc.replace(/^export const meta/, 'const meta') + ';return meta')() } catch (e) { errs.push('meta: ' + e.message); return errs }
  if (meta.name !== stem) errs.push('meta.name ' + JSON.stringify(meta.name) + ' != ' + stem)
  if (!s.slice(i).startsWith("\nconst JOB = '" + stem + "'")) errs.push('JOB must be ' + stem)
  const titles = new Set((meta.phases || []).map(p => p.title))
  const used = new Set([...s.matchAll(/phase\('([^']+)'\)|phase: '([^']+)'/g)].map(m => m[1] || m[2]))
  for (const u of used) if (!titles.has(u)) errs.push('phase not in meta: ' + u)
  for (const t of titles) if (!used.has(t)) errs.push('meta phase unused: ' + t)
  if (FORBID.test(s.slice(i))) errs.push('forbidden token (clock, random, require or import) in the body')
  return errs
}

function run(repo) {
  const checks = [], add = (id, ok, detail) => checks.push({id, ok: !!ok, detail: detail || ''})
  const filFiles = FIL_NAMES.map(n => path.join(WF(repo), n + '.js'))
  const stFiles = ST_NAMES.map(n => path.join(WF(repo), n + '.js'))
  const present = stFiles.filter(f => fs.existsSync(f))
  if (!present.length) return {ok: false, code: 2, checks: [{id: 'D-', ok: false, detail: 'no street scripts in ' + WF(repo)}]}
  // D0: filigree §8 (c) still holds (the derivation source is consistent)
  let filPre = null
  try {
    const pres = filFiles.map(f => block(read(f), F_START, F_END, path.basename(f)))
    const hs = new Set(pres.map(sha))
    add('D0', hs.size === 1, hs.size === 1 ? 'filigree preludes identical' : 'filigree prelude drift: ' + hs.size + ' variants')
    filPre = pres[0]
  } catch (e) { add('D0', false, e.message) }
  const miss = stFiles.filter(f => !fs.existsSync(f)).map(f => path.basename(f))
  // D1: each street prelude minus its config, masked == the filigree prelude, masked
  const stPres = {}
  for (const f of present) { try { stPres[f] = block(read(f), S_START, S_END, path.basename(f)) } catch (e) { add('D1', false, e.message) } }
  if (filPre) {
    let want = null
    try { want = masked(filPre, 'filigree-1-research.js') } catch (e) { add('D1', false, e.message) }
    if (want) for (const [f, p] of Object.entries(stPres)) {
      try { const got = masked(stripConfig(p, path.basename(f)), path.basename(f)); add('D1', got === want, path.basename(f) + (got === want ? ': derived ok' : ': prelude drift vs filigree prelude v1')) } catch (e) { add('D1', false, e.message) }
    }
  }
  // D2: the four street preludes (config included) are byte-identical, and all four exist
  const hs = new Set(Object.values(stPres).map(sha))
  add('D2', !miss.length && hs.size === 1, miss.length ? 'missing: ' + miss.join(', ') : hs.size === 1 ? 'street preludes identical' : 'street prelude drift: ' + hs.size + ' variants')
  const one = Object.values(stPres)[0] || ''
  let cfg = ''
  try { cfg = configOf(one, 'street prelude') } catch (e) { add('D3', false, e.message) }
  // D3: the street sandbox names what filigree-3's SANDBOX names (browser path, CDN packages, the two route globs)
  try {
    const fs3 = lineOf(read(filFiles[2]), 'const SANDBOX = ', 'filigree-3-build.js')
    const st = lineOf(cfg, 'const SANDBOX_ST = ', 'street config')
    const need = [(fs3.match(/executablePath (\S+?);/) || [])[1], (fs3.match(/npm pack (\S+ \S+) /) || [])[1], (fs3.match(/Route (\S+) to/) || [])[1], (fs3.match(/and (\S+) to <tmp>\/three/) || [])[1]]
    const lost = need.filter(x => !x || !st.includes(x))
    add('D3', !lost.length, lost.length ? 'street sandbox lacks: ' + lost.map(String).join(' | ') : 'sandbox recipe in step with filigree-3')
  } catch (e) { add('D3', false, e.message) }
  // D4: the digest recorder is filigree-1's, verbatim
  try {
    const cut = t => { const i = t.indexOf('const RECD = '), j = t.indexOf('\n  return r\n}', i); if (i < 0 || j < 0) throw new Error('recordD block not found'); return t.slice(i, j + 13) }
    const ok = cut(read(filFiles[0])) === cut(cfg)
    add('D4', ok, ok ? 'recordD verbatim' : 'recordD differs from filigree-1-research.js')
  } catch (e) { add('D4', false, e.message) }
  // D5: citations well-formed; street ruling texts free of the street vocabulary
  try {
    const RUL = evalLiteral(one, 'const RULINGS = {', 'street prelude')
    const STR = evalLiteral(cfg, 'const ST_RULINGS = {', 'street config')
    const cited = new Function('return ' + lineOf(cfg, 'const FIL_CITED = ', 'street config').replace(/^const FIL_CITED = /, '').replace(/\s*\/\/.*$/, ''))()
    const fixed = new Function('return ' + lineOf(cfg, 'const ST_FIXED = ', 'street config').replace(/^const ST_FIXED = /, '').replace(/\s*\/\/.*$/, ''))()
    const vocab = new Function(lineOf(one, 'const VOCAB = ', 'street prelude') + '\n' + lineOf(cfg, 'const VOCAB_ST = ', 'street config') + '\nreturn VOCAB_ST')()
    const errs = cited.filter(k => !(k in RUL)).map(k => 'cited ' + k + ' not in RULINGS')
      .concat(fixed.filter(k => !(k in STR)).map(k => 'fixed ' + k + ' not in ST_RULINGS'))
      .concat(Object.entries(STR).filter(([, v]) => vocab.test(v)).map(([k, v]) => k + ' uses banned word ' + JSON.stringify(v.match(vocab)[0])))
    add('D5', !errs.length, errs.join('; ') || 'citations and street rulings ok')
  } catch (e) { add('D5', false, e.message) }
  // D6: meta, phases, forbidden tokens, AsyncFunction parse (filigree README §8 (a)(b) logic)
  for (const f of present) { const e = metaCheck(f, path.basename(f, '.js')); add('D6', !e.length, path.basename(f) + (e.length ? ': ' + e.join('; ') : ': meta ok')) }
  const ok = checks.every(c => c.ok)
  return {ok, code: ok ? 0 : 1, checks}
}

function selfTest() {   // synthesizes its own street scripts in a temp repo; never reads or writes street scripts in REPO
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'street-drift-'))
  try {
    fs.mkdirSync(WF(tmp), {recursive: true})
    for (const n of FIL_NAMES) fs.copyFileSync(path.join(WF(REPO), n + '.js'), path.join(WF(tmp), n + '.js'))
    const fil1 = read(path.join(WF(REPO), 'filigree-1-research.js'))
    const fp = block(fil1, F_START, F_END, 'filigree-1-research.js')
    const recd = (() => { const i = fil1.indexOf('// record() copies verbatim'), j = fil1.indexOf('\n  return r\n}', i); return fil1.slice(i, j + 14) })()
    const sbx = lineOf(read(path.join(WF(REPO), 'filigree-3-build.js')), 'const SANDBOX = ', 'filigree-3-build.js').replace('const SANDBOX = ', 'const SANDBOX_ST = ')
    const cfg = C_START + "const FIL_CITED = ['R6', 'R13']\nconst ST_FIXED = ['ST3']\nconst ST_RULINGS = {\n  ST3: 'render-only queueing'\n}\n" +
      "const VOCAB_ST = new RegExp(VOCAB.source.replace(/\\)\\\\b$/, '|signals?)\\\\b'), 'i')\n" + sbx + '\n' + recd + '\n' + C_END
    const sp = fp.replace(MASKS[0][1], S_START + ' (self-test) ====').replace(MASKS[1][1], cfg + S_END)
      .replace(MASKS[2][1], "const OUT = String(A.outDir || 'docs/street').replace(/\\/+$/, '')").replace(MASKS[6][1], 'const ANCHORS = [\n  [\'index.html\', \'function makeStream(s){\', 1]\n]')
    const script = n => "export const meta = {\n  name: '" + n + "',\n  description: 'self-test',\n  phases: [{title: 'Preflight'}, {title: 'Record'}]\n}\nconst JOB = '" + n + "'\n" + sp + "\nphase('Preflight')\nreturn done({reason: 'plan'})\n"
    for (const n of ST_NAMES) fs.writeFileSync(path.join(WF(tmp), n + '.js'), script(n))
    const good = run(tmp)
    const f2 = path.join(WF(tmp), 'street-2-plan.js')
    fs.writeFileSync(f2, read(f2).replace('Presence is a threshold', 'Presence is THE threshold'))
    const bad = run(tmp)
    const failed = new Set(bad.checks.filter(c => !c.ok).map(c => c.id))
    const ok = good.ok && !bad.ok && failed.has('D1') && failed.has('D2')
    return {ok, code: ok ? 0 : 1, checks: [{id: 'self-test', ok, detail: 'faithful copies ' + (good.ok ? 'pass' : 'FAIL: ' + good.checks.filter(c => !c.ok).map(c => c.id + ' ' + c.detail).join('; ')) + '; one-word R6 edit ' + (failed.has('D1') && failed.has('D2') ? 'caught by D1 and D2' : 'NOT caught (' + [...failed].join(',') + ')')}]}
  } finally { fs.rmSync(tmp, {recursive: true, force: true}) }
}

let res
try { res = argv.includes('--self-test') ? selfTest() : run(REPO) } catch (e) { res = {ok: false, code: 1, checks: [{id: 'D-', ok: false, detail: e.message}]} }
if (JSON_OUT) process.stdout.write(JSON.stringify({ok: res.ok, checks: res.checks}) + '\n')
else { for (const c of res.checks) console.log((c.ok ? 'ok   ' : 'FAIL ') + c.id + ' ' + c.detail); console.log(res.ok ? 'street drift: ok' : 'street drift: FAIL') }
process.exitCode = res.code
