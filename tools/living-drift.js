#!/usr/bin/env node
// tools/living-drift.js — Read-only drift, hold and install-window checks for the living workflows (docs/living/README.md §8).
// The living prelude is filigree prelude v1 under the street masks plus one living config region; this proves it.
// Usage: node tools/living-drift.js [--json] [--repo <dir>] [--staged]             drift checks L0-L9   exit 0 ok, 1 drift, 2 usage or no living scripts
//        node tools/living-drift.js --hold [--repo <dir>]                          the hold read: one JSON line with len and sum
//        node tools/living-drift.js --install-window [--idle-confirmed] [--repo <dir>]   the UG11 install window: one JSON line with len and sum
//        node tools/living-drift.js --self-test                                    synthetic repos in a temp dir
// --hold and --install-window exit 0 whenever they could read (the decision is the workflow's, in code), 1 when a file they need did not parse.
'use strict'
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto'), cp = require('child_process')

const argv = process.argv.slice(2)
const FLAGS = ['--json', '--staged', '--hold', '--install-window', '--idle-confirmed', '--self-test']
const usage = m => { process.stderr.write('living-drift: ' + m + '\nusage: node tools/living-drift.js [--json] [--repo <dir>] [--staged] | --hold [--repo <dir>] | --install-window [--idle-confirmed] [--repo <dir>] | --self-test\n'); process.exit(2) }
const OPT = {repo: null}
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--repo') { if (!argv[i + 1] || argv[i + 1].startsWith('--')) usage('--repo needs a directory'); OPT.repo = argv[++i] }
  else if (FLAGS.includes(argv[i])) OPT[argv[i].slice(2)] = true
  else usage('unknown argument ' + JSON.stringify(argv[i]))
}
const MODES = ['hold', 'install-window', 'self-test'].filter(k => OPT[k])
if (MODES.length > 1) usage('--hold, --install-window and --self-test are exclusive')
if (OPT.staged && MODES.length) usage('--staged belongs to the default drift checks')
if (OPT['idle-confirmed'] && !OPT['install-window']) usage('--idle-confirmed belongs to --install-window')
if (OPT.json && MODES.length) usage('--json belongs to the default drift checks')
const REPO = path.resolve(OPT.repo != null ? OPT.repo : path.join(__dirname, '..'))
if (OPT.repo != null && !(fs.existsSync(REPO) && fs.statSync(REPO).isDirectory())) usage('--repo is not a directory: ' + REPO)

const WF = d => path.join(d, '.claude', 'workflows'), SG = d => path.join(d, 'docs', 'living', 'design', 'workflows')   // INSTALLED, STAGED
const FIL_NAMES = ['filigree-1-research', 'filigree-2-plan', 'filigree-3-build', 'filigree-4-review']
const L_NAMES = ['living-1-research', 'living-2-plan', 'living-3-build', 'living-4-review']
const F_START = '// ==== filigree prelude v1', F_END = '// ==== end filigree prelude ===='
const L_START = '// ==== living prelude v1', L_END = '// ==== end living prelude ===='
const C_START = '// ---- living config ----\n', C_END = '// ---- end living config ----\n'
const MASKS = [
  ['START', /^\/\/ ==== (filigree|living) prelude v1.*$/m],
  ['END', /^\/\/ ==== end (filigree|living) prelude ====$/m],
  ['OUT', /^const OUT = .*$/m],
  ['DOCS', /^const DOCS = .*$/m],
  ['FULLOUT', /^if \(MODE === 'full' && !underDocs\(OUTABS\)\).*$/m],
  ['J1FORCE', /^if \(A\.force != null && JOB === .*$/m],
  ['ANCHORS', /^const ANCHORS = \[\n[\s\S]*?\n\]$/m]
]
const PARAM_BAN = 's goto street filigree notices journey chart poi company faction place view'.split(' ')
const sha = t => crypto.createHash('sha256').update(t).digest('hex')
const read = f => fs.readFileSync(f, 'utf8')
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 } return h.toString(16).padStart(8, '0') }   // must equal fnv in .claude/workflows/mobile-build.js
const canon = v => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v
const lst = p => { try { return fs.lstatSync(p) } catch { return null } }
const has = p => !!lst(p)
const isFile = p => { const s = lst(p); return !!s && s.isFile() }
const shaOf = p => isFile(p) ? sha(fs.readFileSync(p)) : null
const unique = a => [...new Set(a)]
const AF = Object.getPrototypeOf(async function () {}).constructor
const FORBID = /\b(Date\.now|Math\.random|performance\.now)\s*\(|new Date\s*\(\s*\)|\brequire\s*\(|^\s*import\s/m

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
  if (c0 < 0 || c1 < c0 || p.indexOf(C_START, c0 + 1) >= 0) throw new Error(who + ': living config markers missing or repeated')
  return p.slice(0, c0) + p.slice(c1 + C_END.length)
}
function configOf(p, who) {
  const c0 = p.indexOf(C_START), c1 = p.indexOf(C_END)
  if (c0 < 0 || c1 < c0) throw new Error(who + ': living config markers missing')
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
const listOf = (text, name, who) => new Function('return ' + lineOf(text, 'const ' + name + ' = ', who).replace(/^const \w+ = /, '').replace(/\s*\/\/.*$/, ''))()
function alts(re) {   // the top-level alternatives of /\b(a|b(c)?|d)\b/
  const s = re.source.replace(/^\\b\(/, '').replace(/\)\\b$/, ''), out = []
  let d = 0, cur = ''
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '\\') { cur += ch + (s[++i] || ''); continue }
    if (ch === '(') d++
    if (ch === ')') d--
    if (ch === '|' && !d) { out.push(cur); cur = '' } else cur += ch
  }
  return out.concat(cur)
}
const recBlock = (t, fn, who) => {   // the config text from "const RECD = " through the "\n  return r\n}" that ends the record function fn
  const i = t.indexOf('const RECD = '), k = i < 0 ? -1 : t.indexOf('async function ' + fn + '(', i), j = k < 0 ? -1 : t.indexOf('\n  return r\n}', k)
  if (j < 0) throw new Error(who + ': RECD .. ' + fn + ' block not found')
  return t.slice(i, j + 13)
}
const once = (t, s, who) => { const n = t.split(s).length - 1; if (n !== 1) throw new Error(who + ': ' + JSON.stringify(s) + ' found ' + n + ' times, not once'); return t }

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

const cutFn = t => { const i = t.indexOf('function metaCheck('), j = i < 0 ? -1 : t.indexOf('\n}', i); return j < 0 ? null : t.slice(i, j + 2) }

// ---------------------------------------------------------------- drift checks L0-L9
function placement(repo) {
  const n = dir => L_NAMES.filter(x => has(path.join(dir, x + '.js'))).length
  return {staged: n(SG(repo)), installed: n(WF(repo))}
}
function run(repo, forceStaged) {
  const checks = [], add = (id, ok, detail) => checks.push({id, ok: !!ok, detail: detail || ''})
  const pl = placement(repo)
  const location = !forceStaged && pl.installed === 4 ? 'installed' : pl.staged === 4 ? 'staged' : null
  if (!location) return {ok: false, code: 2, location: null, checks: [{id: 'L-', ok: false, detail: 'no living scripts in .claude/workflows/ or docs/living/design/workflows/'}]}
  const dir = location === 'staged' ? SG(repo) : WF(repo)
  const lFiles = L_NAMES.map(n => path.join(dir, n + '.js'))
  const wf = n => path.join(WF(repo), n + '.js')
  const filFiles = FIL_NAMES.map(wf)
  const tryc = (id, fn) => { try { fn() } catch (e) { add(id, false, e.message) } }
  // L0: the derivation root is healthy
  let filPre = null
  tryc('L0', () => {
    const pres = filFiles.map(f => block(read(f), F_START, F_END, path.basename(f))), hs = new Set(pres.map(sha))
    filPre = pres[0]
    const sd = path.join(repo, 'tools', 'street-drift.js')
    const r = has(sd) ? cp.spawnSync(process.execPath, [sd, '--json'], {cwd: repo, encoding: 'utf8'}) : {error: new Error('tools/street-drift.js missing')}
    const bad = (hs.size === 1 ? [] : ['filigree prelude drift: ' + hs.size + ' variants']).concat(r.error ? [r.error.message] : r.status === 0 ? [] : ['tools/street-drift.js exit ' + r.status])
    add('L0', !bad.length, bad.join('; ') || 'filigree preludes identical; street-drift exit 0')
  })
  // L1: each living prelude minus its config, masked == filigree prelude v1, masked
  const lPres = {}
  for (const f of lFiles) { try { lPres[f] = block(read(f), L_START, L_END, path.basename(f)) } catch (e) { add('L1', false, e.message) } }
  if (filPre) {
    let want = null
    try { want = masked(filPre, 'filigree-1-research.js') } catch (e) { add('L1', false, e.message) }
    if (want) for (const [f, p] of Object.entries(lPres)) {
      try { const got = masked(stripConfig(p, path.basename(f)), path.basename(f)); add('L1', got === want, path.basename(f) + (got === want ? ': derived ok' : ': prelude drift vs filigree prelude v1')) } catch (e) { add('L1', false, e.message) }
    }
  }
  // L2: the four living preludes (config included) are byte-identical, and all four exist
  const miss = lFiles.filter(f => !has(f)).map(f => path.basename(f)), hs = new Set(Object.values(lPres).map(sha))
  add('L2', !miss.length && hs.size === 1, miss.length ? 'missing: ' + miss.join(', ') : hs.size === 1 ? 'living preludes identical' : 'living prelude drift: ' + hs.size + ' variants')
  const one = Object.values(lPres)[0] || ''
  let cfg = ''
  try { cfg = configOf(one, 'living prelude') } catch (e) { add('L3', false, e.message) }
  const mb = (() => { try { return read(wf('mobile-build')) } catch { return '' } })()
  // L3: copies in step with their sources (sandbox tokens, font faces, canonJ / fnv / lenOk)
  tryc('L3', () => {
    const fs3 = lineOf(read(filFiles[2]), 'const SANDBOX = ', 'filigree-3-build.js'), sb = lineOf(cfg, 'const SANDBOX_LC = ', 'living config')
    const need = [(fs3.match(/executablePath (\S+?);/) || [])[1], (fs3.match(/npm pack (\S+ \S+) /) || [])[1], (fs3.match(/Route (\S+) to/) || [])[1], (fs3.match(/and (\S+) to <tmp>\/three/) || [])[1]]
    const faces = lineOf(mb, 'const CDN_STEP = ', 'mobile-build.js').match(/@fontsource\/[a-z0-9-]+@\d+(?:\.\d+)*/g) || []
    const errs = need.filter(x => !x || !sb.includes(x)).map(x => 'SANDBOX_LC lacks ' + String(x))
      .concat(faces.length ? faces.filter(x => !sb.includes(x)).map(x => 'SANDBOX_LC lacks ' + x) : ['no @fontsource token in the CDN_STEP line of mobile-build.js'])
      .concat(['const canonJ = ', 'const fnv = ', 'const lenOk = '].filter(p => lineOf(cfg, p, 'living config') !== lineOf(mb, p, 'mobile-build.js')).map(p => p.trim() + ' line differs from mobile-build.js'))
    add('L3', !errs.length, errs.join('; ') || 'sandbox tokens, font faces and canonJ/fnv/lenOk in step')
  })
  // L4: recordL is filigree-1's recordD after exactly two substitutions
  tryc('L4', () => {
    let want = recBlock(read(filFiles[0]), 'recordD', 'filigree-1-research.js')
    once(want, 'async function recordD(', 'filigree-1-research.js'); want = want.replace('async function recordD(', () => 'async function recordL(')
    once(want, "...M('mech')})", 'filigree-1-research.js'); want = want.replace("...M('mech')})", () => "...M('triage')})")
    const ok = want === recBlock(cfg, 'recordL', 'living config')
    add('L4', ok, ok ? 'recordL derived from recordD' : 'recordL differs from filigree-1-research.js recordD (two substitutions allowed)')
  })
  // L5: rulings, citations and words
  tryc('L5', () => {
    const errs = [], st1 = read(wf('street-1-research'))
    const RUL = evalLiteral(one, 'const RULINGS = {', 'living prelude'), STR = evalLiteral(st1, 'const ST_RULINGS = {', 'street-1-research.js'), LC = evalLiteral(cfg, 'const LC_RULINGS = {', 'living config')
    const ids = Object.keys(LC), fixed = listOf(cfg, 'LC_FIXED', 'living config'), gated = listOf(cfg, 'LC_GATED', 'living config')
    errs.push(...listOf(cfg, 'FIL_CITED', 'living config').filter(k => !(k in RUL)).map(k => 'FIL_CITED ' + k + ' not in RULINGS'))
    errs.push(...listOf(cfg, 'ST_CITED', 'living config').filter(k => !(k in STR)).map(k => 'ST_CITED ' + k + ' not in ST_RULINGS'))
    errs.push(...fixed.filter(k => !(k in LC)).map(k => 'LC_FIXED ' + k + ' not in LC_RULINGS'), ...gated.filter(k => !(k in LC)).map(k => 'LC_GATED ' + k + ' not in LC_RULINGS'))
    const vocab = lineOf(one, 'const VOCAB = ', 'living prelude')
    const VL = new Function(vocab + '\n' + lineOf(cfg, 'const VOCAB_LC = ', 'living config') + '\nreturn VOCAB_LC')()
    const JL = new Function(lineOf(cfg, 'const JARGON_LC = ', 'living config') + '\nreturn JARGON_LC')()
    const V0 = new Function(vocab + '\nreturn VOCAB')(), VS = new Function(vocab + '\n' + lineOf(st1, 'const VOCAB_ST = ', 'street-1-research.js') + '\nreturn VOCAB_ST')()
    const aL = alts(VL), a0 = alts(V0)
    if (!a0.every((a, i) => aL[i] === a)) errs.push("VOCAB_LC does not keep VOCAB's alternation")
    const lost = alts(VS).filter(a => !aL.includes(a))
    if (lost.length) errs.push('VOCAB_LC lacks VOCAB_ST alternatives: ' + lost.slice(0, 5).join(', '))
    for (const [k, v] of Object.entries(LC)) { if (VL.test(v)) errs.push(k + ' uses banned word ' + JSON.stringify(v.match(VL)[0])); if (JL.test(v)) errs.push(k + ' uses table word ' + JSON.stringify(v.match(JL)[0])) }
    const jl = read(path.join(repo, 'tools', 'mobile-capture.js')).split('\n').map(l => l.trim()).find(l => l.startsWith('const jargon = ')), jm = jl && jl.match(/^const jargon = (\/(?:\\.|[^\/\\\n])+\/[a-z]*)/)
    if (!jm) errs.push('no const jargon = regex literal in tools/mobile-capture.js')
    else if (JL.toString() !== jm[1]) errs.push('JARGON_LC differs from the jargon regex of tools/mobile-capture.js')
    const rj = JSON.parse(read(path.join(repo, 'docs', 'living', 'rulings.json')))
    if (JSON.stringify(Object.keys(rj).sort()) !== JSON.stringify(['about', 'confirmed', 'date', 'overrides', 'rulings'])) errs.push('rulings.json keys are not date, about, rulings, overrides, confirmed')
    const rs = Array.isArray(rj.rulings) ? rj.rulings : []
    if (JSON.stringify(rs.map(r => r && r.id)) !== JSON.stringify(ids)) errs.push('rulings.json ids differ from the LC ids in order')
    for (const r of rs) if (r && r.id in LC) {
      if (r.text !== LC[r.id]) errs.push('rulings.json ' + r.id + ' text differs from LC_RULINGS')
      if (r.fixed !== fixed.includes(r.id)) errs.push('rulings.json ' + r.id + ' fixed flag differs')
      if (r.gated !== gated.includes(r.id)) errs.push('rulings.json ' + r.id + ' gated flag differs')
    }
    const ov = rj.overrides && typeof rj.overrides === 'object' && !Array.isArray(rj.overrides) ? rj.overrides : (errs.push('rulings.json overrides is not an object'), {})
    for (const [k, v] of Object.entries(ov)) {
      if (!(k in LC) || fixed.includes(k)) errs.push('override ' + k + ' is not an overridable LC id')
      else if (typeof v !== 'string' || !v.startsWith(LC[k]) || v.length <= LC[k].length) errs.push('override ' + k + ' must start with its default text and be longer')
    }
    if (!Array.isArray(rj.confirmed) || rj.confirmed.some(k => !(k in LC))) errs.push('rulings.json confirmed is not a subset of the LC ids')
    add('L5', !errs.length, errs.join('; ') || 'citations, rulings.json and words ok')
  })
  // L6: meta and bodies
  tryc('L6', () => {
    const sd = path.join(repo, 'tools', 'street-drift.js'), mine = cutFn(read(__filename)), theirs = has(sd) ? cutFn(read(sd)) : null
    add('L6', !!mine && mine === theirs, mine && mine === theirs ? 'metaCheck copy equals tools/street-drift.js' : 'metaCheck copy differs from tools/street-drift.js')
  })
  for (const f of lFiles) {
    if (!has(f)) continue
    const stem = path.basename(f, '.js')
    try {
      const e = metaCheck(f, stem), s = read(f), a = s.indexOf(L_START), b = s.indexOf(L_END, a)
      const body = a >= 0 && b >= 0 ? s.slice(0, a) + s.slice(b + L_END.length) : s
      if (/(?<![\w$.])record(?:D)?\(/.test(body)) e.push('record( or recordD( call outside the prelude (use recordL)')
      if (body.includes('8544')) e.push('8544 literal outside the prelude')
      add('L6', !e.length, stem + '.js' + (e.length ? ': ' + e.join('; ') : ': meta ok'))
    } catch (e) { add('L6', false, stem + '.js: ' + e.message) }
  }
  // L7: the instrument contract
  tryc('L7', () => {
    const lm = path.join(repo, 'tools', 'living-measure.js')
    if (!has(lm)) return add('L7', true, 'absent: Living 1 writes it')
    const names = [...read(lm).matchAll(/const\s*\{([^}]*)\}\s*=\s*require\(\s*['"]\.\/mobile-capture(?:\.js)?['"]\s*\)/g)].flatMap(m => m[1].replace(/\/\/.*$/gm, '').split(',').map(x => x.trim().split(/\s*[:=]\s*/)[0]).filter(Boolean))
    const mcl = lineOf(read(path.join(repo, 'tools', 'mobile-capture.js')), 'module.exports = {', 'mobile-capture.js')
    const keys = new Set(mcl.slice(mcl.indexOf('{') + 1, mcl.lastIndexOf('}')).split(',').map(x => x.trim().split(/\s*:\s*/)[0]).filter(Boolean))
    const lost = unique(names).filter(n => !keys.has(n))
    add('L7', !lost.length, lost.length ? 'not exported by tools/mobile-capture.js: ' + lost.join(', ') : 'living-measure.js uses ' + unique(names).length + ' mobile-capture exports, all present')
  })
  // L8: the param grammar (ST18 cited)
  tryc('L8', () => {
    const p = listOf(cfg, 'LIVING_PARAM', 'living config'), errs = []
    if (typeof p !== 'string' || !/^[a-z]+$/.test(p)) errs.push('does not match ^[a-z]+$')
    else { if (p.endsWith('s')) errs.push('ends in s'); if (PARAM_BAN.includes(p)) errs.push('is a taken param') }
    add('L8', !errs.length, errs.length ? 'LIVING_PARAM ' + JSON.stringify(p) + ' ' + errs.join(' and ') : 'LIVING_PARAM ' + JSON.stringify(p) + ' ok')
  })
  // L9: placement
  add('L9', (pl.staged === 4 && pl.installed === 0) || (pl.staged === 0 && pl.installed === 4), 'staged ' + pl.staged + ', installed ' + pl.installed + ' (all four in exactly one location)')
  const ok = checks.every(c => c.ok)
  return {ok, code: ok ? 0 : 1, location, checks}
}

// ---------------------------------------------------------------- the hold read and the install window
const BUSY_RE = 'tools/(mobile-capture|mobile-tree|street-probe)[.]js'   // its own pattern holds ( and [.], so pgrep never matches itself
function busyList() {
  let rows = []
  const r = cp.spawnSync('pgrep', ['-af', BUSY_RE], {encoding: 'utf8'})   // no shell
  if (r.error) {
    const re = new RegExp(BUSY_RE)
    for (const p of fs.existsSync('/proc') ? fs.readdirSync('/proc').filter(x => /^\d+$/.test(x)) : []) { try { const c = fs.readFileSync('/proc/' + p + '/cmdline', 'utf8').split('\0').join(' ').trim(); if (re.test(c)) rows.push(p + ' ' + c) } catch {} }
  } else rows = r.stdout.split('\n').filter(Boolean)
  return rows.filter(l => { const p = Number(l.split(' ')[0]); return p !== process.pid && p !== process.ppid }).map(l => l.slice(0, l.indexOf(' ') + 121))
}
function polishRead(text) {
  const lines = text.split('\n')
  const title = i => { let t = lines[i].replace(/^- \[.\] \*\*/, ''), k = t.indexOf('**'); for (let j = i + 1; k < 0 && j < Math.min(lines.length, i + 4) && lines[j].trim(); j++) { t += ' ' + lines[j].trim(); k = t.indexOf('**') } return (k < 0 ? t : t.slice(0, k)).replace(/\s+/g, ' ').trim() }
  const open = re => lines.flatMap((l, i) => re.test(l) ? [title(i)] : [])
  const checked = s => lines.some(l => l.startsWith('- [x] **' + s))
  const byCycle = re => { const o = {c1: [], c2: []}; lines.forEach((l, i) => { const m = l.match(re); if (m) (o['c' + m[1]] = o['c' + m[1]] || []).push(title(i)) }); return o }
  const mobile = lines.flatMap((l, i) => { const m = l.match(/^- \[ \] \*\*Mobile (\d{1,2})(b?)( fix \d{1,2}| \(fix \d{1,2}\))? ·/); return m && Number(m[1]) !== 15 ? [title(i)] : [] })
  return {
    mobile_open: mobile, census_open: lines.some(l => l.startsWith('- [ ] **Mobile later · census pin names')),
    fil_open: open(/^- \[ \] \*\*(Filigree 3 stuck unit|Filigree 4 punch c|Filigree data —)/), street_open: open(/^- \[ \] \*\*(Street 3 stuck|Street 4 punch c|Street data \(S3\) —)/),
    m9_checked: checked('Mobile 9 ·'), m14_checked: checked('Mobile 14 ·'), f4_checked: checked('Filigree 4 ·'), s4_checked: checked('Street 4 ·'),
    continuity_checked: checked('Sim ↔ atlas continuity**'), traced_roads_checked: checked('Traced road network'), rm_checked: checked('Atlas reduced motion for its own animations'),
    seamask_checked: checked('Living · the sheet-wide sea mask'), rivers_checked: checked('Living later · trace the rivers'), l0_checked: checked('Living 0 ·'),
    living: {gap_open: open(/^- \[ \] \*\*Living gap — /), data_open: open(/^- \[ \] \*\*Living data — /), stuck_open: open(/^- \[ \] \*\*Living 3 stuck /), punch_open: byCycle(/^- \[ \] \*\*Living 4 punch c(\d+) /), zpunch_open: byCycle(/^- \[ \] \*\*Living 4z punch c(\d+) /)}
  }
}
function jsonAt(file) {
  try { return JSON.parse(read(file)) } catch (e) { throw new Error(path.basename(file) + ' did not parse: ' + e.message) }
}
function gateAt(repo, dir, re) {   // the highest-k gate file matching re: {k, pass, forced} or null
  const d = path.join(repo, dir), ks = (has(d) ? fs.readdirSync(d) : []).flatMap(f => { const m = f.match(re); return m ? [[Number(m[1]), f]] : [] }).sort((a, b) => b[0] - a[0])
  if (!ks.length) return null
  const g = jsonAt(path.join(d, ks[0][1]))
  return {k: ks[0][0], pass: g.pass === true, forced: !!(g.forced_by || g.forced)}
}
function walkFiles(repo, rel, skip, out) {   // regular files only (lstat: no symlinks); rel ends with "/"
  let ents
  try { ents = fs.readdirSync(path.join(repo, rel), {withFileTypes: true}) } catch { return out }
  for (const e of ents) {
    const r = rel + e.name
    if (e.isDirectory()) { if (!skip(r + '/')) walkFiles(repo, r + '/', skip, out) }
    else if (e.isFile() && !skip(r)) out.push([r, sha(fs.readFileSync(path.join(repo, r)))])
  }
  return out
}
const digest = (repo, rel, skip) => sha(walkFiles(repo, rel, skip || (() => false), []).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0).map(([p, h]) => p + '\0' + h + '\n').join(''))
function holdRead(repo, busy) {
  const polishFile = path.join(repo, 'POLISH.md')
  if (!isFile(polishFile)) throw new Error('POLISH.md not found in ' + repo)
  const gate = f => { const p = path.join(repo, f); if (!isFile(p)) return {exists: false, pass: false, mode: null, forced: false}; const g = jsonAt(p); return {exists: true, pass: g.pass === true, mode: g.mode == null ? null : g.mode, forced: !!(g.forced_by || g.forced)} }
  const wfDir = path.join(repo, '.claude', 'workflows'), tDir = path.join(repo, 'tools')
  const map = (dir, rel, keep) => Object.fromEntries((has(dir) ? fs.readdirSync(dir).sort() : []).filter(f => keep(f) && isFile(path.join(dir, f))).map(f => [rel + f, shaOf(path.join(dir, f))]))
  const idx = isFile(path.join(repo, 'index.html')) ? read(path.join(repo, 'index.html')) : ''
  const skipOther = r => r === 'maps-site/index.html' || r === 'maps-site/living.js' || r === 'maps-site/data/offline-manifest.json' || r.startsWith('maps-site/living/')
  return {
    busy, polish: polishRead(read(polishFile)),
    filigree: {f2: gate('docs/filigree/gates/2-plan.json'), f4: gateAt(repo, 'docs/filigree/gates', /^4-review-c(\d+)\.json$/)},
    street: {s4: gateAt(repo, 'docs/street/gates', /^4-review-c(\d+)\.json$/), views: isFile(path.join(repo, 'docs/street/gates/views.json'))},
    sim: {street_param: idx.split('street=').length - 1},
    shas: {
      index: shaOf(path.join(repo, 'index.html')), atlas: shaOf(path.join(repo, 'maps-site/index.html')), manifest: shaOf(path.join(repo, 'maps-site/data/offline-manifest.json')),
      docs_filigree: digest(repo, 'docs/filigree/'), docs_street: digest(repo, 'docs/street/'), docs_mobile: digest(repo, 'docs/mobile/'), maps_other: digest(repo, 'maps-site/', skipOther),
      street_state3: shaOf(path.join(repo, 'docs/street/state/3-build.json')),
      workflows: {...map(wfDir, '.claude/workflows/', f => f.endsWith('.js')), ...map(tDir, 'tools/', f => f === 'street-drift.js')},
      tools_other: map(tDir, 'tools/', f => /^(filigree-|street-|mobile-)/.test(f) || f === 'build-offline-manifest.js')
    }
  }
}
function windowRead(repo, idle, busy) {
  const polishFile = path.join(repo, 'POLISH.md')
  if (!isFile(polishFile)) throw new Error('POLISH.md not found in ' + repo)
  const units = jsonAt(path.join(repo, 'docs/mobile/units.json')), state = jsonAt(path.join(repo, 'docs/mobile/state.json'))
  if (!Array.isArray(units)) throw new Error('units.json is not an array')
  const P = polishRead(read(polishFile)), su = (state && state.units) || {}
  const laneRuns = {atlas: r => /^Mobile (4|5|5b|6|7|8)$/.test(r) || /^Mobile 9 ?\(?fix \d+\)?$/.test(r), sim: r => /^Mobile (10|11|12|13)$/.test(r) || /^Mobile 14 ?\(?fix \d+\)?$/.test(r)}
  const laneItems = {atlas: /^Mobile (4|5|5b|6|7|8) ·/, sim: /^Mobile (10|11|12|13) ·/}
  const lane = (name, n, checked) => {
    const us = units.filter(u => u && typeof u.run === 'string' && laneRuns[name](u.run)).map(u => u.id)
    const passed = us.filter(id => su[id] && su[id].status === 'passed'), fix_open = P.mobile_open.filter(t => new RegExp('^Mobile ' + n + ' (fix \\d+|\\(fix \\d+\\)) ·').test(t))
    const item_open = P.mobile_open.filter(t => laneItems[name].test(t))   // a checked review does not end the lane while an item (the owner-gated 5b) can still run
    return {units: us, passed, review_checked: checked, fix_open, item_open, closed: (passed.length > 0 && (!checked || item_open.length > 0)) || fix_open.length > 0}
  }
  const lanes = {atlas: lane('atlas', 9, P.m9_checked), sim: lane('sim', 14, P.m14_checked)}, pl = placement(repo)
  const quiet = !busy.length && P.m9_checked && P.m14_checked && !P.mobile_open.length   // mobile_open: every unchecked Mobile item but 15 (5b and fix items included)
  const early = !busy.length && !lanes.atlas.closed && !lanes.sim.closed && !!idle
  const open = (quiet || early) && pl.staged === 4 && pl.installed === 0, why = []
  if (busy.length) why.push('a mobile or street tool is running: ' + busy.slice(0, 2).join(' | '))
  for (const [name, l] of Object.entries(lanes)) if (l.closed) why.push(name + ' lane closed' + (l.passed.length && !l.review_checked ? ': passed ' + l.passed.join(', ') + ' with its review line unchecked' : '') + (l.passed.length && l.review_checked && l.item_open.length ? ': passed ' + l.passed.join(', ') + ' with open item(s) ' + l.item_open.join('; ') : '') + (l.fix_open.length ? ': open fix line(s) ' + l.fix_open.join('; ') : ''))
  if (!P.m9_checked) why.push('"Mobile 9 ·" review line is unchecked')
  if (!P.m14_checked) why.push('"Mobile 14 ·" review line is unchecked')
  const other = P.mobile_open.filter(t => !/^Mobile (9|14) ·/.test(t))
  if (!quiet && other.length) why.push('open Mobile item(s) besides 15: ' + other.join('; '))
  if (!quiet && !idle) why.push('no --idle-confirmed: pgrep cannot see a mobile-build run in its agent phases')
  if (pl.staged !== 4 || pl.installed !== 0) why.push('staged ' + pl.staged + ', installed ' + pl.installed + ' (need 4 staged, 0 installed)')
  return {open, path: !open ? null : quiet ? 'reviews-checked' : 'idle-confirmed', idle_unverifiable: !quiet, edit_ok: quiet || early, busy, lanes, staged: pl.staged, installed: pl.installed, why: open ? [] : unique(why)}
}
function emit(fields) {   // {"ok":true,...fields,"len":N,"sum":H}: N and H over the key-sorted JSON of the fields, as tools/mobile-tree.js prints them
  const f = canon(fields), t = JSON.stringify(f)
  return JSON.stringify({ok: true, ...f, len: t.length, sum: fnv(t)})
}

// ---------------------------------------------------------------- self-test
function selfTest() {   // synthesizes its own living scripts in temp repos; never reads or writes living scripts in REPO
  const cases = [], tmps = []
  const REQ = 'req' + 'uire'   // the fake instrument is written as text; this file itself loads only built-ins
  const add = (name, ok, detail) => cases.push({case: name, ok: !!ok, detail: detail || ''})
  const mk = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'living-drift-')); tmps.push(d); return d }
  const put = (d, rel, text) => { fs.mkdirSync(path.dirname(path.join(d, rel)), {recursive: true}); fs.writeFileSync(path.join(d, rel), text) }
  try {
    const src = rel => read(path.join(REPO, rel))
    const wfs = n => src('.claude/workflows/' + n + '.js')
    const fil1 = wfs('filigree-1-research'), st1 = wfs('street-1-research'), mb = wfs('mobile-build')
    const fp = block(fil1, F_START, F_END, 'filigree-1-research.js')
    const recd = recBlock(fil1, 'recordD', 'filigree-1-research.js').replace('async function recordD(', () => 'async function recordL(').replace("...M('mech')})", () => "...M('triage')})")
    const faces = lineOf(mb, 'const CDN_STEP = ', 'mobile-build.js').match(/@fontsource\/[a-z0-9-]+@\d+(?:\.\d+)*/g).join(' ')
    const sbx = lineOf(wfs('filigree-3-build'), 'const SANDBOX = ', 'filigree-3-build.js').replace('const SANDBOX = ', () => 'const SANDBOX_LC = ').replace(/`$/, () => ' ' + faces + '`')
    const jarg = src('tools/mobile-capture.js').split('\n').map(l => l.trim()).find(l => l.startsWith('const jargon = ')).replace('const jargon = ', () => 'const JARGON_LC = ')
    const LC = {LC1: 'Default off: the chart stays still until the hash names it.', LC2: 'One control stops every motion at once.', LC3: 'The still frame keeps every mark.', LC4: 'Only beasts the realm knows may move.'}
    const cfg = C_START + "const FIL_CITED = ['R6', 'R13']\nconst ST_CITED = ['ST3', 'ST18']\nconst LC_RULINGS = {\n" + Object.entries(LC).map(([k, v], i, a) => '  ' + k + ": '" + v + "'" + (i < a.length - 1 ? ',' : '')).join('\n') + "\n}\n" +
      "const LC_FIXED = ['LC2']\nconst LC_GATED = ['LC4']\nconst LIVING_PARAM = 'living'\n" + lineOf(st1, 'const VOCAB_ST = ', 'street-1-research.js').replace('const VOCAB_ST = ', () => 'const VOCAB_LC = ') + '\n' + jarg + '\n' + sbx + '\n' +
      ['const canonJ = ', 'const fnv = ', 'const lenOk = '].map(p => lineOf(mb, p, 'mobile-build.js')).join('\n') + '\n' + recd + '\n' + C_END
    const pre = fp.replace(MASKS[0][1], () => L_START + ' (self-test) ====').replace(MASKS[1][1], () => cfg + L_END)
      .replace(MASKS[2][1], () => "const OUT = String(A.outDir || 'docs/living').replace(/\\/+$/, '')").replace(MASKS[3][1], () => "const DOCS = REPO + '/docs/living'")
      .replace(MASKS[4][1], () => "if (MODE === 'full' && !underDocs(OUTABS)) die('living')").replace(MASKS[5][1], () => "if (A.force != null && JOB === 'living-1-research') die('living')")
      .replace(MASKS[6][1], () => "const ANCHORS = [\n  ['index.html', 'window.ANNALS = {', 1]\n]")
    const script = (n, p) => "export const meta = {\n  name: '" + n + "',\n  description: 'self-test',\n  phases: [{title: 'Preflight'}, {title: 'Record'}]\n}\nconst JOB = '" + n + "'\n" + p + "\nphase('Preflight')\nreturn done({reason: 'plan'})\n"
    const rulings = () => ({date: '2026-10-05', about: 'self-test', rulings: Object.entries(LC).map(([id, text]) => ({id, text, default: 'x', fixed: id === 'LC2', gated: id === 'LC4', why: 'x', owner_question: 'x'})), overrides: {}, confirmed: []})
    const SRC = ['filigree-1-research', 'filigree-2-plan', 'filigree-3-build', 'filigree-4-review', 'street-1-research', 'street-2-plan', 'street-3-build', 'street-4-review', 'mobile-build'].map(n => '.claude/workflows/' + n + '.js').concat(['tools/street-drift.js', 'tools/mobile-capture.js'])
    const repoOf = (edit) => {   // edit(preludeText, scriptName) -> prelude text for that script
      const d = mk()
      for (const f of SRC) put(d, f, src(f))
      for (const n of L_NAMES) put(d, 'docs/living/design/workflows/' + n + '.js', script(n, edit ? edit(pre, n) : pre))
      put(d, 'docs/living/rulings.json', JSON.stringify(rulings(), null, 2) + '\n')
      return d
    }
    const drift = (d, extra) => { const r = cp.spawnSync(process.execPath, [__filename, '--json', '--repo', d].concat(extra || []), {encoding: 'utf8'}); let j = null; try { j = JSON.parse(r.stdout) } catch {} return {code: r.status, j, err: r.stderr} }
    const failedOf = r => r.j ? r.j.checks.filter(c => !c.ok).map(c => c.id) : ['no output: ' + r.err.slice(0, 200)]
    const expectFail = (name, d, ids, extra) => {
      const r = drift(d, extra), f = unique(failedOf(r)).sort()
      add(name, r.code === 1 && JSON.stringify(f) === JSON.stringify(ids.slice().sort()), 'exit ' + r.code + ', failed ' + (f.join(',') || 'none') + ', expected ' + ids.join(','))
    }
    // faithful copies
    {
      const d = repoOf(), r = drift(d), r2 = drift(d, ['--staged'])
      add('faithful copies (staged)', r.code === 0 && r.j && r.j.ok && r.j.location === 'staged' && r.j.checks.length >= 12 && r2.code === 0, 'exit ' + r.code + ', ' + (r.j ? r.j.checks.filter(c => !c.ok).map(c => c.id + ' ' + c.detail).join('; ') || r.j.checks.length + ' checks ok' : r.err.slice(0, 200)) + '; --staged exit ' + r2.code)
    }
    expectFail('one-word edit of R6 in living-2-plan.js -> L1 and L2', repoOf((p, n) => n === 'living-2-plan' ? once(p, 'Presence is a threshold', 'prelude').replace('Presence is a threshold', () => 'Presence is THE threshold') : p), ['L1', 'L2'])
    expectFail('one-word edit of LC1 in one script -> L2', repoOf((p, n) => n === 'living-3-build' ? once(p, 'the chart stays still', 'prelude').replace('the chart stays still', () => 'the chart stays quiet') : p), ['L2'])
    {
      const d = repoOf(), j = rulings(); j.rulings[0].text += ' x'
      put(d, 'docs/living/rulings.json', JSON.stringify(j, null, 2) + '\n')
      expectFail('rulings.json text of LC1 differs -> L5', d, ['L5'])
    }
    expectFail("recordL keeps M('mech') -> L4", repoOf(p => { const i = p.indexOf('async function recordL('); return p.slice(0, i) + once(p.slice(i), "...M('triage')})", 'recordL').replace("...M('triage')})", () => "...M('mech')})") }), ['L4'])
    expectFail('SANDBOX_LC without @fontsource/lora@5.3.0 -> L3', repoOf(p => once(p, '@fontsource/lora@5.3.0', 'SANDBOX_LC').replace('@fontsource/lora@5.3.0', () => '@fontsource/lorax@5.3.0')), ['L3'])
    expectFail("LIVING_PARAM = 'livings' -> L8", repoOf(p => once(p, "const LIVING_PARAM = 'living'", 'LIVING_PARAM').replace("const LIVING_PARAM = 'living'", () => "const LIVING_PARAM = 'livings'")), ['L8'])
    {
      const d = repoOf()
      for (const n of L_NAMES) put(d, '.claude/workflows/' + n + '.js', read(path.join(d, 'docs/living/design/workflows/' + n + '.js')))
      expectFail('scripts in both STAGED and INSTALLED -> L9', d, ['L9'])
    }
    {
      const d = repoOf(), mcKeys = lineOf(read(path.join(d, 'tools/mobile-capture.js')), 'module.exports = {', 'mobile-capture.js'), real = mcKeys.slice(mcKeys.indexOf('{') + 1).split(',')[0].trim()
      put(d, 'tools/living-measure.js', "const {" + real + "} = " + REQ + "('./mobile-capture.js')\n")
      const okR = drift(d), okL7 = okR.j && okR.j.checks.find(c => c.id === 'L7')
      put(d, 'tools/living-measure.js', "const {\n  " + real + ",\n  noSuchExport\n} = " + REQ + "('./mobile-capture.js')\n")
      add('a real mobile-capture export passes L7', okR.code === 0 && okL7 && okL7.ok, okL7 ? okL7.detail : 'no L7')
      expectFail('living-measure.js requiring {noSuchExport} -> L7', d, ['L7'])
    }
    // --hold on a synthetic POLISH.md
    const POLISH = [
      '# POLISH', '',
      '- [x] **Mobile 9 · Atlas lane review (USER REQUEST)** — done', '- [ ] **Mobile 5b · Owner-gated cut (OWNER-GATED)** — x',
      '- [ ] **Mobile 14 fix 1 · Sim lane fix: the first finding (USER REQUEST)** — x', '- [ ] **Mobile 15 · Real-device pass (OWNER-RUN)** — excluded', '- [ ] **Mobile · Filigree 4 phone gate (script)** — excluded',
      '- [ ] **Mobile later · census pin names on phones (A12 part b)** — x', '- [ ] **Mobile later · WebP rasters (OWNER-GATED)** — excluded',
      '- [ ] **Filigree 4 punch c1 f01 — a surviving major** — x', '- [x] **Filigree 4 · Review → punch list (USER REQUEST)** — done',
      '- [ ] **Living gap — G1.1: a still frame criterion** — x', '- [ ] **Living data — traced roads** — x',
      '- [ ] **Living 3 stuck unit U05 — a unit that failed** — x', '- [ ] **Living 4 punch c1 L03 — a blocker** — x', '- [ ] **Living 4z punch c2 Z01 — a major** — x',
      '- [x] **Sim ↔ atlas continuity** — done', '- [ ] **Mobile 8 · Atlas: a wrapped title that', '  runs on (USER REQUEST)** — x', ''
    ].join('\n')
    const hd = mk()
    put(hd, 'POLISH.md', POLISH); put(hd, 'index.html', 'a street=1 b street=\n'); put(hd, 'maps-site/index.html', 'atlas'); put(hd, 'maps-site/living.js', 'x'); put(hd, 'maps-site/other.json', '{}')
    put(hd, 'docs/filigree/gates/4-review-c1.json', '{"pass":false,"forced_by":null}'); put(hd, 'docs/filigree/gates/4-review-c2.json', '{"pass":true,"forced_by":null}'); put(hd, 'docs/filigree/gates/4-review-c10.json', '{"pass":true,"forced_by":"owner"}')
    put(hd, 'docs/filigree/gates/2-plan.json', '{"pass":true,"mode":"full","forced_by":null}')
    {
      const hf = holdRead(hd, []), line = emit(hf), j = JSON.parse(line), pol = hf.polish
      const lib = new Function(['const canonJ = ', 'const fnv = ', 'const lenOk = '].map(p => lineOf(mb, p, 'mobile-build.js')).join('\n') + '\nreturn {canonJ, fnv, lenOk}')()
      const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
      add('--hold on a synthetic POLISH.md', same(pol.mobile_open, ['Mobile 5b · Owner-gated cut (OWNER-GATED)', 'Mobile 14 fix 1 · Sim lane fix: the first finding (USER REQUEST)', 'Mobile 8 · Atlas: a wrapped title that runs on (USER REQUEST)']) && pol.census_open === true &&
        same(pol.fil_open, ['Filigree 4 punch c1 f01 — a surviving major']) && pol.m9_checked === true && pol.m14_checked === false && pol.f4_checked === true && pol.continuity_checked === true && pol.l0_checked === false &&
        same(pol.living.gap_open, ['Living gap — G1.1: a still frame criterion']) && same(pol.living.data_open, ['Living data — traced roads']) && same(pol.living.stuck_open, ['Living 3 stuck unit U05 — a unit that failed']) &&
        same(pol.living.punch_open, {c1: ['Living 4 punch c1 L03 — a blocker'], c2: []}) && same(pol.living.zpunch_open, {c1: [], c2: ['Living 4z punch c2 Z01 — a major']}) &&
        hf.filigree.f2.pass === true && hf.filigree.f2.mode === 'full' && same(hf.filigree.f4, {k: 10, pass: true, forced: true}) && hf.street.s4 === null && hf.street.views === false && hf.sim.street_param === 2 &&
        hf.shas.index === sha('a street=1 b street=\n') && hf.shas.manifest === null && hf.shas.street_state3 === null && lib.lenOk(j) && j.len === JSON.stringify(canon(hf)).length && j.sum === lib.fnv(JSON.stringify(lib.canonJ(hf))),
        'mobile_open ' + JSON.stringify(pol.mobile_open) + ', census_open ' + pol.census_open + ', fil_open ' + JSON.stringify(pol.fil_open) + ', m9_checked ' + pol.m9_checked + ', lenOk ' + lib.lenOk(j))
      const bent = JSON.parse(line.replace(/("sum":")(.)/, (m, a, c) => a + (c === '0' ? '1' : '0')))
      add('--hold line: one altered sum digit fails lenOk', lib.lenOk(j) && !lib.lenOk(bent), 'sum ' + j.sum)
      add('--hold maps_other skips the declared living files', hf.shas.maps_other === sha('maps-site/other.json\0' + sha('{}') + '\n'), hf.shas.maps_other.slice(0, 12))
      add('FNV-1a 32 vectors', fnv('') === '811c9dc5' && fnv('a') === 'e40c292c' && fnv('foobar') === 'bf9cf968' && lib.fnv('foobar') === 'bf9cf968', fnv('') + ' ' + fnv('a') + ' ' + fnv('foobar'))
      const cli = cp.spawnSync(process.execPath, [__filename, '--hold', '--repo', hd], {encoding: 'utf8'}); let cj = null; try { cj = JSON.parse(cli.stdout) } catch {}
      add('--hold CLI: exit 0, one line, len digest', cli.status === 0 && cli.stdout.trim().split('\n').length === 1 && !!cj && lib.lenOk(cj), 'exit ' + cli.status)
    }
    {
      const probe = cp.spawn(process.execPath, ['-e', 'setTimeout(()=>{},6000)', 'tools/street-probe.js'], {stdio: 'ignore'})
      let found
      try { for (let i = 0; i < 20 && !found; i++) { found = busyList().find(l => l.startsWith(probe.pid + ' ')); if (!found) cp.spawnSync(process.execPath, ['-e', 'setTimeout(()=>{},100)']) } } finally { probe.kill() }
      add('busy lists a street-probe command line, not this tool', !!found && found.length <= String(probe.pid).length + 121 && !busyList().some(l => l.includes('living-drift.js')), found || 'not seen')
    }
    // --install-window
    const win = (units, st, polish, nStaged, nInst, idle, busy) => {
      const d = mk()
      put(d, 'docs/mobile/units.json', JSON.stringify(units)); put(d, 'docs/mobile/state.json', JSON.stringify({units: st})); put(d, 'POLISH.md', polish)
      L_NAMES.slice(0, nStaged).forEach(n => put(d, 'docs/living/design/workflows/' + n + '.js', '')); L_NAMES.slice(0, nInst).forEach(n => put(d, '.claude/workflows/' + n + '.js', ''))
      const w = windowRead(d, idle, busy || []), j = JSON.parse(emit(w))
      return {w, j}
    }
    const U = [{id: 'D3', run: 'Mobile 4'}, {id: 'A-U1', run: 'Mobile 4'}, {id: 'D1', run: 'Mobile 3'}, {id: 'S-U1', run: 'Mobile 10'}, {id: 'G9', run: 'Mobile 9'}, {id: 'F9', run: 'Mobile 9 (fix 1)'}]
    const open9 = '- [ ] **Mobile 9 · Atlas lane review (USER REQUEST)** — x\n- [ ] **Mobile 14 · Sim lane review (USER REQUEST)** — x\n', done9 = '- [x] **Mobile 9 · Atlas lane review (USER REQUEST)** — x\n- [x] **Mobile 14 · Sim lane review (USER REQUEST)** — x\n'
    const lib2 = new Function(['const canonJ = ', 'const fnv = ', 'const lenOk = '].map(p => lineOf(mb, p, 'mobile-build.js')).join('\n') + '\nreturn lenOk')()
    const winCase = (name, r, want) => add(name, lib2(r.j) && Object.entries(want).every(([k, v]) => JSON.stringify(r.w[k]) === JSON.stringify(v)), JSON.stringify({open: r.w.open, path: r.w.path, idle_unverifiable: r.w.idle_unverifiable, edit_ok: r.w.edit_ok, atlas_closed: r.w.lanes.atlas.closed, why: r.w.why}).slice(0, 300))
    winCase('--install-window: no lane unit passed, no flag', win(U, {D1: {status: 'passed'}}, open9, 4, 0, false), {open: false, idle_unverifiable: true, path: null, edit_ok: false})
    winCase('--install-window: the same with --idle-confirmed', win(U, {D1: {status: 'passed'}}, open9, 4, 0, true), {open: true, path: 'idle-confirmed', idle_unverifiable: true, edit_ok: true})
    {
      const r = win(U, {D3: {status: 'passed'}}, open9, 4, 0, true)
      winCase('--install-window: D3 passed, Mobile 9 open, --idle-confirmed', r, {open: false, edit_ok: false}); add('--install-window: the atlas lane is closed', r.w.lanes.atlas.closed === true && r.w.lanes.atlas.passed.join() === 'D3' && r.w.lanes.atlas.units.join() === 'D3,A-U1,F9' && r.w.lanes.sim.closed === false, JSON.stringify(r.w.lanes.atlas))
    }
    winCase('--install-window: Mobile 9 and 14 checked, no flag', win(U, {D3: {status: 'passed'}}, done9, 4, 0, false), {open: true, path: 'reviews-checked', idle_unverifiable: false, edit_ok: true})
    winCase('--install-window: the last with Mobile 9 fix 1 open', win(U, {D3: {status: 'passed'}}, done9 + '- [ ] **Mobile 9 fix 1 · Atlas lane fix (USER REQUEST)** — x\n', 4, 0, false), {open: false, idle_unverifiable: true, edit_ok: false})
    winCase('--install-window: reviews checked with 4 installed', win(U, {D3: {status: 'passed'}}, done9, 0, 4, false), {open: false, edit_ok: true, path: null})
    {
      const U5 = U.concat([{id: 'A-U2', run: 'Mobile 5'}, {id: 'A-U10', run: 'Mobile 6'}]), m5b = done9 + '- [ ] **Mobile 5b · absolute bands (OWNER-GATED)** — x\n'
      winCase('--install-window: Mobile 9 and 14 checked, Mobile 5b open, no flag', win(U5, {D3: {status: 'passed'}, 'A-U2': {status: 'deferred-5b'}, 'A-U10': {status: 'deferred-5b'}}, m5b, 4, 0, false), {open: false, path: null, idle_unverifiable: true, edit_ok: false})
      const r = win(U5, {D3: {status: 'passed'}, 'A-U2': {status: 'passed'}, 'A-U10': {status: 'deferred-5b'}}, m5b, 4, 0, true)
      winCase('--install-window: the last mid-5b (A-U2 passed) with --idle-confirmed', r, {open: false, edit_ok: false}); add('--install-window: an open Mobile 5b keeps the atlas lane closed after its review', r.w.lanes.atlas.closed === true && r.w.lanes.atlas.item_open.join() === 'Mobile 5b · absolute bands (OWNER-GATED)' && r.w.lanes.sim.closed === false, JSON.stringify(r.w.lanes.atlas))
      winCase('--install-window: Mobile 3 open, reviews checked, no flag', win(U, {D3: {status: 'passed'}}, done9 + '- [ ] **Mobile 3 · Delivery (USER REQUEST)** — x\n', 4, 0, false), {open: false, idle_unverifiable: true, edit_ok: false})
    }
    winCase('--install-window: a running capture closes it', win(U, {}, done9, 4, 0, true, ['123 node tools/mobile-capture.js --atlas']), {open: false, edit_ok: false, busy: ['123 node tools/mobile-capture.js --atlas']})
    {
      const d = mk()
      put(d, 'docs/mobile/units.json', JSON.stringify(U)); put(d, 'docs/mobile/state.json', '{"units":{}}'); put(d, 'POLISH.md', open9); L_NAMES.forEach(n => put(d, 'docs/living/design/workflows/' + n + '.js', ''))
      const cli = cp.spawnSync(process.execPath, [__filename, '--install-window', '--repo', d], {encoding: 'utf8'}); let cj = null; try { cj = JSON.parse(cli.stdout) } catch {}
      add('--install-window CLI: exit 0, one line, len digest', cli.status === 0 && cli.stdout.trim().split('\n').length === 1 && !!cj && lib2(cj) && cj.open === false && cj.idle_unverifiable === true, 'exit ' + cli.status)
      const bad = cp.spawnSync(process.execPath, [__filename, '--install-window', '--repo', path.join(d, 'nope')], {encoding: 'utf8'})
      add('usage errors exit 2', bad.status === 2 && cp.spawnSync(process.execPath, [__filename, '--bogus'], {encoding: 'utf8'}).status === 2 && cp.spawnSync(process.execPath, [__filename, '--repo'], {encoding: 'utf8'}).status === 2, 'exit ' + bad.status)
    }
    const ok = cases.every(c => c.ok)
    return {ok, code: ok ? 0 : 1, cases}
  } finally { for (const d of tmps) fs.rmSync(d, {recursive: true, force: true}) }
}

// ---------------------------------------------------------------- main
function main() {
  if (OPT['self-test']) {
    let r
    try { r = selfTest() } catch (e) { r = {ok: false, code: 1, cases: [{case: 'self-test', ok: false, detail: e.message}]} }
    process.stdout.write(JSON.stringify({ok: r.ok, cases: r.cases}) + '\n'); process.exitCode = r.code; return
  }
  if (OPT.hold || OPT['install-window']) {
    try { process.stdout.write(emit(OPT.hold ? holdRead(REPO, busyList()) : windowRead(REPO, !!OPT['idle-confirmed'], busyList())) + '\n') } catch (e) { process.stdout.write(JSON.stringify({ok: false, error: e.message}) + '\n'); process.exitCode = 1 }
    return
  }
  let res
  try { res = run(REPO, !!OPT.staged) } catch (e) { res = {ok: false, code: 1, location: null, checks: [{id: 'L-', ok: false, detail: e.message}]} }
  if (OPT.json) process.stdout.write(JSON.stringify({ok: res.ok, location: res.location, checks: res.checks}) + '\n')
  else { for (const c of res.checks) console.log((c.ok ? 'ok   ' : 'FAIL ') + c.id + ' ' + c.detail); console.log(res.ok ? 'living drift: ok' : 'living drift: FAIL') }
  process.exitCode = res.code
}
main()
