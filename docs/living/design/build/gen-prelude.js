// derive the living prelude from the street prelude (exact derivation of workflow-1-research.md §0).
// usage: node gen-prelude.js [--repo <checkout>] [--splice <workflow-1-research.md>]
// writes prelude.js beside this file; with --splice also replaces the fenced prelude block of that doc's §0 and its sha line.
// Delivered as docs/living/design/build/ (with living-config.js and proto-check.js) so the recipe survives the planning session.
const fs = require('fs'), crypto = require('crypto')
const argv = process.argv.slice(2), opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null }
const WF = (opt('--repo') || '/home/user/annals-kingdom').replace(/\/+$/, '') + '/.claude/workflows/'
const st = fs.readFileSync(WF + 'street-1-research.js', 'utf8')
const S_START = '// ==== street prelude v1', S_END = '// ==== end street prelude ===='
const i = st.indexOf(S_START), j = st.indexOf(S_END, i)
const street = st.slice(i, j + S_END.length)
const cfg = fs.readFileSync(__dirname + '/living-config.js', 'utf8')   // ends with "\n"
const C_START = '// ---- street config ----\n', C_END = '// ---- end street config ----\n'
const c0 = street.indexOf(C_START), c1 = street.indexOf(C_END)
let p = street.slice(0, c0) + cfg + street.slice(c1 + C_END.length)
const rep = (re, line) => { const n = (p.match(new RegExp(re.source, 'gm')) || []).length; if (n !== 1) throw new Error('mask ' + re + ' matched ' + n); p = p.replace(re, () => line) }
rep(/^\/\/ ==== street prelude v1.*$/m, '// ==== living prelude v1 — derived from filigree prelude v1 via the street prelude (masked diff: tools/living-drift.js L1); keep byte-identical across the four living scripts ====')
rep(/^\/\/ ==== end street prelude ====$/m, '// ==== end living prelude ====')
rep(/^const OUT = .*$/m, "const OUT = String(A.outDir || 'docs/living').replace(/\\/+$/, '')")
rep(/^const DOCS = .*$/m, "const DOCS = REPO + '/docs/living'   // living static inputs (dossier, todo-inputs, rulings.json, README); filigree, street and mobile records are read-only (FIL, STD, MOB)")
rep(/^if \(MODE === 'full' && !underDocs\(OUTABS\)\).*$/m, "if (MODE === 'full' && !underDocs(OUTABS)) die('full runs write the durable record: args.outDir must be docs/living or a subdirectory of it')")
rep(/^if \(A\.force != null && JOB === .*$/m, "if (A.force != null && JOB === 'living-1-research') die('args.force is not accepted by Living 1 (there is no earlier living gate to skip)')")
rep(/^const ANCHORS = \[\n[\s\S]*?\n\]$/m, `const ANCHORS = [
  ['maps-site/index.html', 'function jFrame(', 1], ['maps-site/index.html', 'function jReduced(', 1], ['maps-site/index.html', 'jReduceMq', 1],
  ['maps-site/index.html', "getElementById('jbar-reduce')", 1], ['maps-site/index.html', 'forceReduced', 1], ['maps-site/index.html', "'pJTrail'", 1],
  ['maps-site/index.html', 'map.createPane(', 1], ['maps-site/index.html', 'function setHash(', 1], ['maps-site/index.html', 'Z_OPEN_MAX', 1],
  ['maps-site/index.html', 'function buildSeaLanes(', 1], ['maps-site/index.html', 'function registerCityOverlay(', 1], ['maps-site/index.html', 'window.ATLAS=', 1],
  ['maps-site/index.html', 'function handleHash(', 1], ['maps-site/index.html', 'JPPS', 1], ['maps-site/index.html', '@keyframes dashmove', 1],
  ['maps-site/index.html', '@keyframes copulse', 1], ['index.html', 'const darkHour =', 1], ['index.html', 'renderTod = (renderTod', 1],
  ['index.html', 'function routePos(', 1], ['index.html', 'function tickDragon', 1], ['index.html', 'window.ANNALS = {', 1],
  ['maps-site/index.html', '/*LC-HOOK*/', 0], ['maps-site/index.html', 'living=1', 0], ['maps-site/index.html', '/* FILIGREE */', 0], ['index.html', '/* STREET */', 0]
]`)
fs.writeFileSync(__dirname + '/prelude.js', p)
const sha = crypto.createHash('sha256').update(p).digest('hex')
console.log('lines', p.split('\n').length, 'sha256', sha)
const doc = opt('--splice')
if (doc) {
  let d = fs.readFileSync(doc, 'utf8')
  const L_START = '// ==== living prelude v1', L_END = '// ==== end living prelude ===='
  const a = d.indexOf('\n' + L_START) + 1, b = d.indexOf('\n' + L_END + '\n', a) + 1   // whole-line markers inside the fenced block
  if (a < 1 || b < 1 || d.indexOf('\n' + L_START, a) >= 0) throw new Error('splice: prelude markers not found exactly once in ' + doc)
  d = d.slice(0, a) + p.replace(/\n$/, '') + d.slice(b + L_END.length)
  const shaLine = /`[0-9a-f]{64}`\. The implementer of U02 regenerates it/
  if (!shaLine.test(d)) throw new Error('splice: sha line not found in ' + doc)
  d = d.replace(shaLine, '`' + sha + '`. The implementer of U02 regenerates it')
  fs.writeFileSync(doc, d)
  console.log('spliced', doc)
}
