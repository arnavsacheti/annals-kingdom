const fs = require('fs'), crypto = require('crypto')
const argv = process.argv.slice(2), ri = argv.indexOf('--repo')   // usage: node proto-check.js [--repo <checkout>]
const WF = (ri >= 0 ? argv[ri + 1] : '/home/user/annals-kingdom').replace(/\/+$/, '') + '/.claude/workflows/'
const sha = t => crypto.createHash('sha256').update(t).digest('hex')
const fil1 = fs.readFileSync(WF + 'filigree-1-research.js', 'utf8')
const F_START = '// ==== filigree prelude v1', F_END = '// ==== end filigree prelude ===='
const fp = fil1.slice(fil1.indexOf(F_START), fil1.indexOf(F_END) + F_END.length)
const lp = fs.readFileSync(__dirname + '/prelude.js', 'utf8')
const MASKS = [
  ['START', /^\/\/ ==== (filigree|living) prelude v1.*$/m], ['END', /^\/\/ ==== end (filigree|living) prelude ====$/m],
  ['OUT', /^const OUT = .*$/m], ['DOCS', /^const DOCS = .*$/m], ['FULLOUT', /^if \(MODE === 'full' && !underDocs\(OUTABS\)\).*$/m],
  ['J1FORCE', /^if \(A\.force != null && JOB === .*$/m], ['ANCHORS', /^const ANCHORS = \[\n[\s\S]*?\n\]$/m]]
const masked = t => MASKS.reduce((x, [n, re]) => { const k = (x.match(new RegExp(re.source, 'gm')) || []).length; if (k !== 1) throw new Error('mask ' + n + ' x' + k); return x.replace(re, '<<' + n + '>>') }, t)
const C_START = '// ---- living config ----\n', C_END = '// ---- end living config ----\n'
const c0 = lp.indexOf(C_START), c1 = lp.indexOf(C_END)
const stripped = lp.slice(0, c0) + lp.slice(c1 + C_END.length)
console.log('L1 masked equal:', masked(stripped) === masked(fp))
const cfg = lp.slice(c0, c1 + C_END.length)
// L4
const cutD = t => { const i = t.indexOf('const RECD = '), j = t.indexOf('\n  return r\n}', i); return t.slice(i, j + 13) }
const want = cutD(fil1).replace('async function recordD(', 'async function recordL(').replace("...M('mech')})", "...M('triage')})")
console.log('L4 recordL derived:', want === cutD(cfg), cutD(fil1).split("...M('mech')})").length - 1)
// L3 tokens
const fs3 = fs.readFileSync(WF + 'filigree-3-build.js', 'utf8').split('\n').find(l => l.startsWith('const SANDBOX = '))
const need = [(fs3.match(/executablePath (\S+?);/) || [])[1], (fs3.match(/npm pack (\S+ \S+) /) || [])[1], (fs3.match(/Route (\S+) to/) || [])[1], (fs3.match(/and (\S+) to <tmp>\/three/) || [])[1]]
const mb = fs.readFileSync(WF + 'mobile-build.js', 'utf8'); const cdn = mb.split('\n').find(l => l.startsWith('const CDN_STEP = '))
const fonts = cdn.match(/@fontsource\/[a-z-]+@[\d.]+/g)
const sbx = cfg.split('\n').find(l => l.startsWith('const SANDBOX_LC = '))
console.log('L3 missing:', need.concat(fonts).filter(x => !sbx.includes(x)))
for (const n of ['const canonJ = ', 'const fnv = ', 'const lenOk = ']) console.log('L3', n, mb.split('\n').find(l => l.startsWith(n)) === cfg.split('\n').find(l => l.startsWith(n)))
// L5: rulings texts vs VOCAB_LC
const runPre = new Function('args', 'log', 'agent', 'crit0', lp.replace(/^const JOB.*$/m, '') + '\nreturn {LC_RULINGS, LC_FIXED, LC_GATED, VOCAB_LC, JARGON_LC, RULINGS, FIL_CITED, ST_CITED, ANCHORS, M, SANDBOX_LC, holdOf, lenOk}')
const AF = Object.getPrototypeOf(async function () {}).constructor
let env
try { env = new Function('args', 'log', 'const JOB = "living-2-plan";\n' + lp + '\nreturn {LC_RULINGS, LC_FIXED, LC_GATED, VOCAB_LC, JARGON_LC, RULINGS, FIL_CITED, ST_CITED, ANCHORS, M, holdOf, lenOk, fnv, canonJ}')({date: '2026-10-05', mode: 'plan'}, () => {}) } catch (e) { console.log('run error', e.message) }
const bad = Object.entries(env.LC_RULINGS).filter(([, v]) => env.VOCAB_LC.test(v)).map(([k, v]) => k + ':' + v.match(env.VOCAB_LC)[0])
console.log('L5 vocab hits:', bad, 'jargon hits:', Object.entries(env.LC_RULINGS).filter(([, v]) => env.JARGON_LC.test(v)).map(([k, v]) => k + ':' + v.match(env.JARGON_LC)[0]))
console.log('FIL_CITED ok', env.FIL_CITED.every(k => k in env.RULINGS))
const stSrc = fs.readFileSync(WF + 'street-1-research.js', 'utf8'); const i = stSrc.indexOf('const ST_RULINGS = {'), j = stSrc.indexOf('\n}', i)
const ST = new Function('return ' + stSrc.slice(i + 'const ST_RULINGS = '.length, j + 2))()
console.log('ST_CITED ok', env.ST_CITED.every(k => k in ST))
const vst = stSrc.split('\n').find(l => l.startsWith('const VOCAB_ST = ')); const words = s => new Set(s.match(/\(([^()]|\([^()]*\))*\)\\\\b/)[0].slice(1).split('|'))
const stWords = (vst.match(/'\|(.*)\)\\\\b'\)/) || [])[1].split('|'); console.log('VOCAB_ST words in VOCAB_LC:', stWords.every(w => env.VOCAB_LC.source.includes('|' + w + '|') || env.VOCAB_LC.source.includes('|' + w + ')')))
const mc = fs.readFileSync(WF + '../../tools/mobile-capture.js', 'utf8'); const jl = mc.split('\n').find(l => l.trim().startsWith('const jargon = '))
console.log('JARGON equal:', jl.trim().replace('const jargon = ', '') === env.JARGON_LC.toString())
console.log('anchors:', env.ANCHORS.length, 'pair roles', JSON.stringify(env.M('triage')))
// test holdOf / lenOk
const payload = {busy: [], polish: {mobile_open: [], census_open: false, fil_open: [], street_open: [], continuity_checked: false}, filigree: {f4: {k: 1, pass: true, forced: false}}, street: {s4: null}}
const t = JSON.stringify(env.canonJ(payload)); const h = {ok: true, ...payload, len: t.length, sum: env.fnv(t)}
console.log('hold build:', env.holdOf(h, 'build'), 'zoom:', env.holdOf(h, 'zoom'), 'docs:', env.holdOf(h, 'docs'))
// parse as AsyncFunction inside a stub script
const script = "export const meta = {\n  name: 'living-2-plan',\n  description: 'x',\n  phases: [{title: 'Preflight'}]\n}\nconst JOB = 'living-2-plan'\n" + lp + "\nphase('Preflight')\nreturn done({reason: 'plan'})\n"
try { new AF('agent', 'parallel', 'pipeline', 'phase', 'log', 'args', 'budget', 'workflow', script.replace(/^export const meta/m, 'const meta')); console.log('AsyncFunction parse ok') } catch (e) { console.log('parse fail', e.message) }
const FORBID = /\b(Date\.now|Math\.random|performance\.now)\s*\(|new Date\s*\(\s*\)|\brequire\b|^\s*import\s/m   // \brequire\b: stricter than L6's require( so no module-loader token reaches a script
console.log('forbidden tokens in prelude:', FORBID.test(lp))
console.log('prelude sha', sha(lp))
