#!/usr/bin/env node
// The mobile measuring stick (Mobile 1 / M1.1). Every number is defined in docs/mobile/metrics.md;
// the harness it grew from is kept in docs/mobile/inputs/. Read-only on the repo: it writes only
// --out, --controls and the git-ignored shots dir. Playwright comes from NODE_PATH.
//
//   node tools/mobile-capture.js [--atlas] [--sim] [--profiles a,b] [--unit ID] [--out F] [--controls F]
//        [--clock virtual|real] [--cpu K] [--throttle slow4g] [--hw-cores N] [--device-memory M]
//        [--sw allow] [--port N | --url U | --server spawn] [--cdn-dir D] [--query dc=phone]
//        [--seeds epeshu,tamar1374] [--tap-n N] [--phone WxH@D] [--extras a,b] [--no-shots]
//        [--night-loaf] [--save-data] [--mutate-html FILE] [--jobs N]
//   node tools/mobile-capture.js --accept FILE [--capture F] [--ref NAME=F] [--allow-stale]
//   node tools/mobile-capture.js --lint-accept FILE
//   node tools/mobile-capture.js --compare A.json B.json
//   node tools/mobile-capture.js --mutate-only --mutate-html maps-site/index.html   (D7/D8 fixture)
//   node tools/mobile-capture.js --self-test
// One capture at a time: a run that launches a browser (capture, or --accept without --capture) first takes
// <os.tmpdir()>/annals-mobile-capture.lock {pid, boot, started, argv}; while a live pid holds it the run waits (15 s polls,
// up to 3 h, then exit 2); a dead pid's lock, or one from another boot (a pid reused after a container restart), is
// taken over; released on exit, error, SIGINT, SIGTERM.
// --lint-accept, --compare, --accept with --capture, --mutate-only and --self-test take no lock.
'use strict'
const fs = require('fs'), path = require('path'), http = require('http'), crypto = require('crypto'), zlib = require('zlib')
const cp = require('child_process'), os = require('os')

const REPO = path.resolve(__dirname, '..')
const TOOL_VERSION = 1
const SHOT_MAX = 300 * 1024
const sha = b => crypto.createHash('sha256').update(b).digest('hex')
const rd = (p, enc) => fs.readFileSync(path.isAbsolute(p) ? p : path.join(REPO, p), enc === undefined ? 'utf8' : enc)
const ex = p => fs.existsSync(path.isAbsolute(p) ? p : path.join(REPO, p))
const sleep = ms => new Promise(r => setTimeout(r, ms))
const rnd = (v, d = 3) => v == null || !isFinite(v) ? null : +(+v).toFixed(d)
const log = (...a) => process.stderr.write(a.join(' ') + '\n')
const isObj = v => v && typeof v === 'object' && !Array.isArray(v)

// ---------------------------------------------------------------- profiles (metrics.md section 2)
const PROFILES = {
  iphone13: {w: 390, h: 664, dpr: 3, touch: true, base: 'iPhone 13'},
  pixel7: {w: 412, h: 839, dpr: 2.625, touch: true, base: 'Pixel 7'},
  landscape: {w: 844, h: 340, dpr: 3, touch: true, base: 'iPhone 13'},
  desktop: {w: 1366, h: 768, dpr: 1, touch: false},
  desktop2x: {w: 1440, h: 900, dpr: 2, touch: false}
}
const DEFAULT_PROFILES = ['iphone13', 'pixel7', 'landscape', 'desktop', 'desktop2x']
const SLOW4G = {offline: false, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 150}
const INSETS = {top: 47, bottom: 34, left: 0, right: 0}
const FONT_HOSTS = /fonts\.(googleapis|gstatic)\.com/
let VERSION_HINT = '?v=mc'   // '&sw=1' is appended under --sw allow (the guard excludes localhost otherwise)

// ---------------------------------------------------------------- page-side code (serialised into the page)
function vclockInstall(cfg) {   // /* VCLOCK */ rAF, performance.now, Date.now / new Date() on a fixed timeline; seeded Math.random
  const realSetInterval = window.setInterval.bind(window)
  const vc = window.__vc = {t: 1000, dt: 1000 / 60, id: 0, q: [], frames: 0, auto: false, hidden: false}
  const BASE = 1.7e12
  window.requestAnimationFrame = cb => { vc.q.push([++vc.id, cb]); return vc.id }
  window.cancelAnimationFrame = id => { vc.q = vc.q.filter(x => x[0] !== id) }
  performance.now = () => vc.t
  const RD = Date
  class VD extends RD { constructor(...a) { if (a.length === 0) super(BASE + vc.t); else super(...a) } static now() { return BASE + vc.t } }
  window.Date = VD
  vc.pump = n => { for (let i = 0; i < (n || 1); i++) { vc.t += vc.dt; vc.frames++; const cur = vc.q; vc.q = []; for (const [, cb] of cur) { try { cb(vc.t) } catch (e) { console.error(e) } } } return vc.frames }
  if (cfg.auto) { vc.auto = true; realSetInterval(() => { if (vc.auto) vc.pump(1) }, 16) }
  function xmur3(s) { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19 } return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return (h ^= h >>> 16) >>> 0 } }
  function sfc32(a, b, c, d) { return () => { a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; let t = (a + b) | 0; a = b ^ b >>> 9; b = c + (c << 3) | 0; c = c << 21 | c >>> 11; d = d + 1 | 0; t = t + d | 0; c = c + t | 0; return (t >>> 0) / 4294967296 } }
  const h = xmur3('probe'); Math.random = sfc32(h(), h(), h(), h())
}

function pinInstall(cfg) {
  const def = (k, v) => { try { Object.defineProperty(Navigator.prototype, k, {get: () => v, configurable: true}) } catch (e) { /* kept */ } try { Object.defineProperty(navigator, k, {get: () => v, configurable: true}) } catch (e) { /* kept */ } }
  def('hardwareConcurrency', cfg.hw); def('deviceMemory', cfg.mem)
  if (cfg.saveData) { try { Object.defineProperty(navigator, 'connection', {get: () => ({saveData: true, effectiveType: '4g', addEventListener() {}, removeEventListener() {}}), configurable: true}) } catch (e) { /* kept */ } }
}

function pageLib() {
  const mc = window.__mc = {}
  const SEL = 'a[href], button, input, select, textarea, summary, [role=button], [tabindex]:not([tabindex="-1"]), .leaflet-control a, .leaflet-marker-icon.leaflet-interactive, #drawerHandle, [data-sheet-handle], .sheet-handle'   // the last three: handles that are divs today (metrics.md section 5 names the drawer handle a primary action)
  const area = r => r.width * r.height
  const shown = el => { const cs = getComputedStyle(el); return !(cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) }
  const clip = r => { const l = Math.max(r.left, 0), t = Math.max(r.top, 0), rr = Math.min(r.right, innerWidth), b = Math.min(r.bottom, innerHeight); return rr > l && b > t ? {l, t, r: rr, b} : null }
  const roleOf = el => {
    const a = el.getAttribute('role'); if (a) return a
    if (el.matches('#drawerHandle,[data-sheet-handle],.sheet-handle')) return 'button'
    const t = el.tagName
    if (t === 'A') return 'link'
    if (t === 'BUTTON' || t === 'SUMMARY') return 'button'
    if (t === 'SELECT') return 'combobox'
    if (t === 'TEXTAREA') return 'textbox'
    if (t === 'INPUT') { const ty = (el.type || 'text').toLowerCase(); return ty === 'checkbox' ? 'checkbox' : ty === 'radio' ? 'radio' : ty === 'range' ? 'slider' : ty === 'button' || ty === 'submit' ? 'button' : 'textbox' }
    return 'generic'
  }
  const nameOf = el => (el.getAttribute('aria-label') || el.getAttribute('title') || (el.textContent || '').replace(/\s+/g, ' ').trim() || el.getAttribute('placeholder') || el.id || '').trim().slice(0, 24)
  const isDisc = el => el.hasAttribute('aria-expanded') || /leaflet-control-layers-toggle/.test(el.className || '') || el.id === 'drawerHandle' || el.getAttribute('role') === 'tab' || !!el.closest('#drawerTabs') || el.matches('[data-sheet-handle],.sheet-handle,#sheetHandle,#sheetHandle *')
  mc.shown = shown
  mc.inventory = () => {
    const out = [], ids = {}
    for (const el of document.querySelectorAll(SEL)) {
      if (el.tagName === 'INPUT' && el.type === 'hidden') continue
      if (!shown(el)) continue
      const marker = el.classList.contains('leaflet-marker-icon')
      let r = el.getBoundingClientRect(), hitEl = el
      if (marker) {
        const g = el.querySelector('.glyph'), p = el.querySelector('.pad,[class*="pad"]')
        const cands = [el, g, p].filter(Boolean).map(e => ({e, r: e.getBoundingClientRect()})).filter(x => x.r.width > 0 && x.r.height > 0)
        if (!cands.length) continue
        cands.sort((a, b) => area(b.r) - area(a.r)); r = cands[0].r
        if (g) hitEl = g
      }
      if (!(r.width > 0 && r.height > 0)) continue
      const c = clip(r); if (!c) continue
      const cx = (c.l + c.r) / 2, cy = (c.t + c.b) / 2
      const top = document.elementFromPoint(cx, cy)
      const lab = top && top.closest && top.closest('label')
      if (!(top && (top === el || el.contains(top) || (lab && lab.contains(el))))) continue
      const role = roleOf(el), name = nameOf(el)
      let id = role + ':' + name; ids[id] = (ids[id] || 0) + 1; if (ids[id] > 1) id += '#' + ids[id]
      out.push({id, role, name, x: +r.left.toFixed(1), y: +r.top.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), cx: +cx.toFixed(1), cy: +cy.toFixed(1), marker, panel: !!el.closest('#panelBody'), disc: isDisc(el), under44: r.width < 44 || r.height < 44, bottom25: cy > innerHeight * 0.75})
    }
    return out
  }
  mc.glyphs = () => {   // every interactive marker's drawn .glyph centre (the point a finger is aimed at); tappable = inside the viewport and not under chrome
    const out = []
    for (const el of document.querySelectorAll('.leaflet-marker-icon.leaflet-interactive')) {
      if (!shown(el)) continue
      const g = el.querySelector('.glyph') || el; if (!shown(g)) continue
      const r = g.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) continue
      const x = r.left + r.width / 2, y = r.top + r.height / 2, inView = x >= 0 && y >= 0 && x <= innerWidth && y <= innerHeight, top = inView ? document.elementFromPoint(x, y) : null
      const name = (el.getAttribute('aria-label') || el.getAttribute('title') || (el.textContent || '').replace(/\s+/g, ' ').trim()).replace(/ — .*$/, '').trim()
      out.push({name, x: +x.toFixed(1), y: +y.toFixed(1), tappable: !!(top && top.closest('.leaflet-pane'))})
    }
    return out
  }
  const alphaOf = c => { if (!c || c === 'transparent') return 0; if (/^color\(/.test(c)) { const m = c.match(/\/\s*([\d.]+)(%?)/); return m ? +m[1] / (m[2] ? 100 : 1) : 1 } const m = c.match(/^rgba?\(([^)]+)\)/); if (!m) return 1; const q = m[1].split(/[,\s/]+/).filter(Boolean); return q.length > 3 ? +q[3] : 1 }
  const paints = (el, cs) => {   // does this element itself put ink on the chart: a fill, image, shadow, blur, border, replaced content or its own text
    if (alphaOf(cs.backgroundColor) > 0 || cs.backgroundImage !== 'none' || cs.boxShadow !== 'none' || (cs.backdropFilter && cs.backdropFilter !== 'none')) return true
    for (const s of ['Top', 'Right', 'Bottom', 'Left']) if (parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none' && alphaOf(cs['border' + s + 'Color']) > 0) return true
    if (/^(IMG|VIDEO|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return true
    for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return true
    return false
  }
  mc.chromeCover = () => {
    const map = document.getElementById('map'), rects = []
    for (const el of document.body.querySelectorAll('*')) {
      if (el.closest('#map .leaflet-pane') || el.closest('.leaflet-tile-container')) continue
      if (map && (el === map || el.contains(map))) continue
      if (/^(SCRIPT|STYLE|CANVAS|LINK|META|svg|path|defs|g)$/i.test(el.tagName)) continue
      const cs = getComputedStyle(el), pe = el.parentElement && getComputedStyle(el.parentElement).pointerEvents === 'none' && cs.pointerEvents !== 'none'
      const pos = (cs.position === 'fixed' || cs.position === 'absolute') && (cs.pointerEvents !== 'none' || paints(el, cs))   // pointer-events never exempts chrome that paints; a wrapper that paints nothing (the Leaflet corners) is skipped and its controls are counted
      if (!pos && !pe) continue
      if (!shown(el)) continue
      const r = el.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) continue
      const c = clip(r); if (!c) continue
      if (cs.pointerEvents === 'none' && (c.r - c.l) * (c.b - c.t) >= 0.9 * innerWidth * innerHeight) continue   // a full-viewport texture (the uncharted grain) is not chrome
      rects.push(c)
    }
    const xs = [...new Set(rects.flatMap(r => [r.l, r.r]))].sort((a, b) => a - b); let tot = 0
    for (let i = 0; i < xs.length - 1; i++) {
      const x0 = xs[i], x1 = xs[i + 1], iv = rects.filter(r => r.l <= x0 && r.r >= x1).map(r => [r.t, r.b]).sort((a, b) => a[0] - b[0])
      let cur = -1, y0 = null, len = 0
      for (const [a, b] of iv) { if (y0 === null) { y0 = a; cur = b } else if (a <= cur) cur = Math.max(cur, b); else { len += cur - y0; y0 = a; cur = b } }
      if (y0 !== null) len += cur - y0
      tot += len * (x1 - x0)
    }
    return tot / (innerWidth * innerHeight)
  }
  mc.hoverUngated = () => {
    let n = 0
    const walk = (rules, inHover) => {
      for (const r of rules) {
        if (r.type === 1) { if (!inHover && /:hover/.test(r.selectorText)) n++ }
        else if (r.type === 4) walk(r.cssRules, inHover || /\(\s*hover\s*:\s*hover\s*\)/.test(r.conditionText || r.media.mediaText))
        else if (r.cssRules && r.type !== 7 && r.type !== 5) walk(r.cssRules, inHover)
      }
    }
    for (const s of document.styleSheets) { if (s.href && !s.href.startsWith(location.origin)) continue; let rules; try { rules = s.cssRules } catch (e) { continue } if (rules) walk(rules, false) }
    return n
  }
  mc.minFont = skipSel => {
    let min = 1e9, who = null
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n; (n = tw.nextNode());) {
      if (!n.textContent.trim()) continue
      const p = n.parentElement; if (!p || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.tagName)) continue
      if (skipSel && p.closest(skipSel)) continue
      if (!shown(p)) continue
      const r = p.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0) || !clip(r)) continue
      const fs = parseFloat(getComputedStyle(p).fontSize)
      if (fs < min) { min = fs; who = (p.tagName + (p.id ? '#' + p.id : '') + (typeof p.className === 'string' && p.className ? '.' + p.className.split(/\s+/)[0] : '')).slice(0, 40) }
    }
    return {px: min === 1e9 ? null : min, who}
  }
  mc.panes = () => [...document.querySelectorAll('.leaflet-pane')].map(e => e.className.replace(/\s+/g, ' ').trim())
  mc.topOccupancy = () => {
    let max = 0, who = null
    for (const el of document.body.children) {
      if (/^(SCRIPT|STYLE|CANVAS)$/.test(el.tagName)) continue
      const cs = getComputedStyle(el); if ((cs.position !== 'fixed' && cs.position !== 'absolute') || !shown(el)) continue
      const r = el.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) continue
      if (area(r) > innerWidth * innerHeight * 0.5 || r.top > innerHeight * 0.3 || r.height > innerHeight * 0.35 || r.bottom <= 0) continue
      if (r.bottom > max) { max = r.bottom; who = el.id || el.className }
    }
    return {px: Math.round(max), frac: +(max / innerHeight).toFixed(3), who: String(who)}
  }
  mc.fingerprint = perturb => {   // the street probe's canonical record (street-1-research.js PROBE_SPEC --fingerprint); perturb adds 1 to the first caravan's departDay
    const W = window.ANNALS.world, r = v => typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v
    if (perturb) { const a = (W.agents || []).find(x => x.kind === 'caravan'); if (a) a.departDay += 1 }
    const nm = x => x && typeof x === 'object' ? (x.id != null ? x.id : x.name) : x
    return {clock: Object.fromEntries(Object.keys(W.clock || {}).sort().map(k => [k, r(W.clock[k])])), dayTicked: W.dayTicked,
      settlements: W.settlements.map(s => ({id: s.id != null ? s.id : s.name, pop: r(s.pop || 0), kind: s.kind, prosperity: r(s.prosperity)})),
      agents: (W.agents || []).map(a => ({kind: a.kind, departDay: r(a.departDay), route: nm(a.src) + '>' + nm(a.dst), speed: r(a.speed)})),
      chron: (W.chron || []).map(e => e.text), treasury: r(W.treasury || 0),
      routeVolume: W.routeVolume ? [...W.routeVolume.entries()].sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0).map(e => [e[0], e[1]]) : []}
  }
  mc.rngNext = () => { const o = {}; const g = window.ANNALS.world.rng; for (const k of ['gen', 'hist', 'amb', 'det']) if (g && typeof g[k] === 'function') o[k] = g[k](); return o }
  mc.lastLoAF = () => window.__loaf || null
}

// ---------------------------------------------------------------- PNG codec and the one image diff (metrics.md section 7)
function pngDecode(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a png')
  let o = 8, w = 0, h = 0, ct = 0, bd = 0, il = 0; const idat = []; let plte = null
  while (o < buf.length) {
    const len = buf.readUInt32BE(o), type = buf.toString('latin1', o + 4, o + 8), d = buf.subarray(o + 8, o + 8 + len)
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); bd = d[8]; ct = d[9]; il = d[12] } else if (type === 'IDAT') idat.push(d); else if (type === 'PLTE') plte = d
    o += 12 + len
  }
  if (bd !== 8 || il !== 0) throw new Error('png: only 8-bit non-interlaced')
  const bpp = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ct]; if (!bpp) throw new Error('png colour type ' + ct)
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, px = Buffer.alloc(h * stride)
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], s = y * (stride + 1) + 1, d = y * stride
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[d + x - bpp] : 0, b = y ? px[d - stride + x] : 0, c = y && x >= bpp ? px[d - stride + x - bpp] : 0
      let v = raw[s + x]
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c }
      px[d + x] = v & 255
    }
  }
  const rgba = Buffer.alloc(w * h * 4)
  for (let i = 0; i < w * h; i++) {
    let r, g, b, a = 255
    if (ct === 6) { r = px[i * 4]; g = px[i * 4 + 1]; b = px[i * 4 + 2]; a = px[i * 4 + 3] } else if (ct === 2) { r = px[i * 3]; g = px[i * 3 + 1]; b = px[i * 3 + 2] }
    else if (ct === 0) r = g = b = px[i]; else if (ct === 4) { r = g = b = px[i * 2]; a = px[i * 2 + 1] } else { r = plte[px[i] * 3]; g = plte[px[i] * 3 + 1]; b = plte[px[i] * 3 + 2] }
    rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = b; rgba[i * 4 + 3] = a
  }
  return {w, h, data: rgba}
}
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ c >>> 1 : c >>> 1; t[n] = c >>> 0 } return t })()
const crc32 = b => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ c >>> 8; return (c ^ 0xffffffff) >>> 0 }
function pngEncode(img) {
  const {w, h, data} = img, stride = w * 3, raw = Buffer.alloc(h * (stride + 1)); let prev = Buffer.alloc(stride)
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(stride); for (let x = 0; x < w; x++) { row[x * 3] = data[(y * w + x) * 4]; row[x * 3 + 1] = data[(y * w + x) * 4 + 1]; row[x * 3 + 2] = data[(y * w + x) * 4 + 2] }
    let best = null, bf = 0, bs = Infinity
    for (const f of [0, 1, 2, 4]) {
      const o = Buffer.alloc(stride); let s = 0
      for (let x = 0; x < stride; x++) {
        const a = x >= 3 ? row[x - 3] : 0, b = prev[x], c = x >= 3 ? prev[x - 3] : 0; let p = 0
        if (f === 1) p = a; else if (f === 2) p = b; else if (f === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c }
        const v = (row[x] - p) & 255; o[x] = v; s += v < 128 ? v : 256 - v
      }
      if (s < bs) { bs = s; best = o; bf = f }
    }
    raw[y * (stride + 1)] = bf; best.copy(raw, y * (stride + 1) + 1); prev = row
  }
  const chunk = (t, d) => { const b = Buffer.alloc(12 + d.length); b.writeUInt32BE(d.length, 0); b.write(t, 4, 'latin1'); d.copy(b, 8); b.writeUInt32BE(crc32(b.subarray(4, 8 + d.length)), 8 + d.length); return b }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, {level: 9})), chunk('IEND', Buffer.alloc(0))])
}
function boxDown(img, k) {
  const w = Math.floor(img.w / k), h = Math.floor(img.h / k), out = Buffer.alloc(w * h * 4)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 4; c++) {
    let s = 0; for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) s += img.data[((y * k + j) * img.w + x * k + i) * 4 + c]
    out[(y * w + x) * 4 + c] = Math.round(s / (k * k))
  }
  return {w, h, data: out}
}
function fitShot(buf) {   // <= 300 KB: the css-px PNG as taken, else the smallest integer box-down that fits (viewing only: the diff reads the full file)
  if (buf.length <= SHOT_MAX) return {buf, scale: 1}
  const img = pngDecode(buf)
  for (let k = 2; k <= 8; k++) { const e = pngEncode(boxDown(img, k)); if (e.length <= SHOT_MAX) return {buf: e, scale: 1 / k} }
  return {buf: pngEncode(boxDown(img, 8)), scale: 1 / 8}
}
function imageDiff(aBuf, bBuf, masks, scale) {   // a pixel differs when max(|dR|,|dG|,|dB|) > 8; diff = differing pixels outside masks / all pixels
  const a = pngDecode(aBuf), b = pngDecode(bBuf)
  if (a.w !== b.w || a.h !== b.h) return {diff: 1, size_mismatch: [a.w, a.h, b.w, b.h]}
  const ms = (masks || []).map(m => m.map(v => v * (scale || 1)))
  let bad = 0
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) {
    if (ms.some(m => x >= m[0] && x < m[0] + m[2] && y >= m[1] && y < m[1] + m[3])) continue
    const i = (y * a.w + x) * 4
    if (Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2])) > 8) bad++
  }
  return {diff: bad / (a.w * a.h)}
}

// ---------------------------------------------------------------- static server (equal to server.js until D1)
const MIME = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain'}
function startServer(root, port) {
  const st = {mutate: null}
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0].split('#')[0])
    if (p.endsWith('/')) p += 'index.html'
    const f = path.normalize(path.join(root, p))
    if (!f.startsWith(root)) { res.writeHead(403); return res.end() }
    fs.readFile(f, (err, data) => {
      if (err) { res.writeHead(404); return res.end('not found') }
      if (st.mutate && st.mutate.has(path.relative(root, f).split(path.sep).join('/'))) data = Buffer.concat([data, Buffer.from('\n<!-- v2 -->')])
      res.writeHead(200, {'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream'})
      res.end(data)
    })
  })
  return new Promise(r => srv.listen(port || 0, '127.0.0.1', () => r({origin: 'http://localhost:' + srv.address().port, port: srv.address().port, state: st, close: () => new Promise(c => srv.close(c))})))
}
function spawnServer(root) {   // post-D1: PORT=<free> node server.js from the tree
  return new Promise((resolve, reject) => {
    const port = 20000 + (process.pid % 20000)
    const ch = cp.spawn(process.execPath, ['server.js'], {cwd: root, env: {...process.env, PORT: String(port)}, stdio: 'ignore'})
    ch.on('error', reject)
    const t0 = Date.now()
    const probe = () => http.get({host: '127.0.0.1', port, path: '/'}, r => { r.resume(); resolve({origin: 'http://localhost:' + port, port, state: {}, close: async () => ch.kill()}) }).on('error', () => Date.now() - t0 > 10000 ? reject(new Error('spawned server did not start')) : setTimeout(probe, 150))
    probe()
  })
}

// ---------------------------------------------------------------- browser plumbing
function loadPlaywright() {
  for (const m of ['playwright', '/opt/node22/lib/node_modules/playwright']) { try { return require(m) } catch (e) { /* next */ } }
  throw new Error('playwright not found: set NODE_PATH=/opt/node22/lib/node_modules')
}
function resolveCdn(dir) {   // <dir>/leaflet/dist + <dir>/three/build, or the two npm tarballs (extracted next to them once)
  if (!dir) return null
  dir = path.resolve(dir)
  const L = path.join(dir, 'leaflet/dist'), T = path.join(dir, 'three/build/three.min.js')
  if (fs.existsSync(L) && fs.existsSync(T)) return {leaflet: L, three: T}
  const x = path.join(dir, '_x'); fs.mkdirSync(x, {recursive: true})
  for (const [tgz, sub] of [['leaflet-1.9.4.tgz', 'leaflet'], ['three-0.128.0.tgz', 'three']]) {
    if (!fs.existsSync(path.join(dir, tgz))) continue
    fs.mkdirSync(path.join(x, sub), {recursive: true})
    if (!fs.existsSync(path.join(x, sub, 'package.json'))) cp.execFileSync('tar', ['xzf', path.join(dir, tgz), '-C', path.join(x, sub), '--strip-components=1'])
  }
  if (fs.existsSync(path.join(x, 'leaflet/dist')) && fs.existsSync(path.join(x, 'three/build/three.min.js'))) return {leaflet: path.join(x, 'leaflet/dist'), three: path.join(x, 'three/build/three.min.js')}
  throw new Error('--cdn-dir ' + dir + ' has no leaflet/three')
}
async function launch(pw) {
  const args = ['--enable-unsafe-swiftshader']
  try { return await pw.chromium.launch({args}) } catch (e) {
    for (const p of ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome']) if (fs.existsSync(p)) return pw.chromium.launch({args, executablePath: p})
    throw e
  }
}
function ctxOptions(pw, key, prof, o) {
  const base = prof.base ? pw.devices[prof.base] : null
  const opts = {...(base || {}), viewport: {width: prof.w, height: prof.h}, screen: {width: prof.w, height: prof.h}, deviceScaleFactor: prof.dpr,
    isMobile: !!prof.touch, hasTouch: !!prof.touch, serviceWorkers: o.sw === 'allow' ? 'allow' : 'block'}
  if (!prof.touch) { opts.userAgent = undefined; delete opts.userAgent; opts.isMobile = false }
  if (o.saveData) opts.extraHTTPHeaders = {'Save-Data': 'on'}
  return opts
}

class Net {   // metrics.md section 1: only responses of the app's own origin count
  constructor(origin) { this.origin = origin; this.reqs = {}; this.fin = []; this.routed = []; this.aborted = []; this.foreign = new Set(); this.cacheHits = 0; this.pending = 0 }
  async attach(cdp) {
    await cdp.send('Network.enable')
    cdp.on('Network.requestWillBeSent', e => { const u = e.request.url; if (!/^https?:/.test(u)) return; this.reqs[e.requestId] = {url: u, local: u.startsWith(this.origin + '/'), done: false}; const o = new URL(u).origin; if (o !== this.origin) this.foreign.add(o); else this.pending++ })
    cdp.on('Network.responseReceived', e => { const r = this.reqs[e.requestId]; if (!r) return; r.status = e.response.status; if (e.response.fromDiskCache || e.response.fromServiceWorker || e.response.fromPrefetchCache || e.response.status === 304) { r.hit = true; this.cacheHits++ } })
    cdp.on('Network.requestServedFromCache', e => { const r = this.reqs[e.requestId]; if (r && !r.hit) { r.hit = true; this.cacheHits++ } })
    cdp.on('Network.loadingFinished', e => { const r = this.reqs[e.requestId]; if (!r || r.done) return; r.done = true; r.bytes = e.encodedDataLength; if (r.local) { this.pending--; this.fin.push(r) } })
    cdp.on('Network.loadingFailed', e => { const r = this.reqs[e.requestId]; if (!r || r.done) return; r.done = true; if (r.local) this.pending-- })
  }
  mark() { return {n: this.fin.length, hits: this.cacheHits} }
  since(m) {
    const f = this.fin.slice(m.n), cat = {}
    for (const r of f) { const p = new URL(r.url).pathname; const c = /\/tiles(-imperial|-war)?\//.test(p) ? 'tiles' : /\/charts\//.test(p) ? 'charts' : /\/art\//.test(p) ? 'art' : /\/data\//.test(p) ? 'data' : 'html_other'; cat[c] = cat[c] || {requests: 0, bytes: 0}; cat[c].requests++; cat[c].bytes += r.bytes }
    const big = f.slice().sort((a, b) => b.bytes - a.bytes)[0]
    return {bytes: f.reduce((s, r) => s + r.bytes, 0), requests: f.length, cache_hits: this.cacheHits - m.hits, max_asset: big ? {path: new URL(big.url).pathname, bytes: big.bytes} : null, by_cat: cat}
  }
}

async function openPage(env, key, kind, opts) {   // a fresh context + page with routes, pins, optional clock
  const prof = opts.profile
  const ctx = await env.browser.newContext(ctxOptions(env.pw, key, prof, opts))
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  const net = new Net(env.server.origin); await net.attach(cdp)
  const rec = {console: [], consoleUrl: [], page: [], failed: []}
  page.on('console', m => { if (m.type() === 'error') { rec.console.push(m.text().slice(0, 200)); let u = ''; try { u = m.location().url || '' } catch (e) { /* none */ } rec.consoleUrl.push(u) } })
  page.on('pageerror', e => rec.page.push(String(e.message).slice(0, 200)))
  page.on('requestfailed', r => rec.failed.push(r.url().slice(0, 100)))
  if (opts.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', {rate: opts.cpu})
  if (opts.throttle === 'slow4g') await cdp.send('Network.emulateNetworkConditions', SLOW4G)
  const routed = [], aborted = []
  await page.route(url => new URL(url).origin !== env.server.origin, async route => {
    const url = route.request().url(), u = new URL(url)
    if (env.cdn && /leaflet@1\.9\.4\/dist\//.test(url)) {
      const f = path.join(env.cdn.leaflet, u.pathname.split('/dist/')[1])
      if (fs.existsSync(f)) { const ct = f.endsWith('.css') ? 'text/css' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.png') ? 'image/png' : 'application/octet-stream'; const body = fs.readFileSync(f); routed.push({url, length: body.length}); return route.fulfill({body, contentType: ct}) }
    }
    if (env.cdn && /three\.js\/r128\/three\.min\.js/.test(url)) {
      let body = fs.readFileSync(env.cdn.three, 'utf8')
      if (kind === 'sim') body += '\n;(function(){try{var T=THREE,O=T.WebGLRenderer;function R(a){var r=new O(a);window.__mcR=r;var rr=r.render;r.render=function(s,c){window.__mcS=s;window.__mcC=c;return rr.apply(this,arguments)};return r}R.prototype=O.prototype;T.WebGLRenderer=R}catch(e){}})();\n'
      routed.push({url, length: Buffer.byteLength(body)}); return route.fulfill({body, contentType: 'text/javascript'})
    }
    aborted.push({url: url.slice(0, 120)}); return route.abort()
  })
  await page.addInitScript(`(${pinInstall.toString()})(${JSON.stringify({hw: opts.hw, mem: opts.mem, saveData: !!opts.saveData})})`)
  await page.addInitScript(`(${pageLib.toString()})()`)
  if (opts.vclock) await page.addInitScript(`(${vclockInstall.toString()})(${JSON.stringify({auto: opts.vclock === 'auto'})})`)
  return {ctx, page, cdp, net, rec, routed, aborted, close: () => ctx.close()}
}

async function settle(P, ms = 400, max = 60000) {   // tiles loaded and the app origin quiet
  const t0 = Date.now(); let quiet = 0
  while (Date.now() - t0 < max) {
    const n = await P.page.evaluate(() => document.querySelectorAll('#map .leaflet-tile-loading').length).catch(() => 0)
    if (n === 0 && P.net.pending <= 0) { quiet += 100; if (quiet >= ms) return true } else quiet = 0
    await sleep(100)
  }
  return false
}
async function tapAt(P, prof, x, y) { if (prof.touch) await P.page.touchscreen.tap(x, y); else await P.page.mouse.click(x, y) }
async function pump(P, n) { await P.page.evaluate(k => window.__vc.pump(k), n) }

function errorsOf(P) {   // UG2: a generic "Failed to load resource" line is explained only when its own URL is on a host whose request this run aborted; a local 404 stays unexplained
  const hostOf = u => { try { return new URL(u).host } catch (e) { return null } }
  const own = hostOf(P.net.origin), gone = new Set(P.aborted.map(a => hostOf(a.url)).concat(P.rec.failed.filter(u => !u.startsWith(P.net.origin)).map(hostOf)).filter(h => h && h !== own))
  const explained = P.rec.console.filter((t, i) => /Failed to load resource/.test(t) && gone.has(hostOf(P.rec.consoleUrl[i] || ''))).length
  return {console: P.rec.console.length, page: P.rec.page.length, unexplained: P.rec.console.length - explained + P.rec.page.length, messages: P.rec.console.concat(P.rec.page).slice(0, 6)}
}
function mergeErrors(a, b) { return {console: a.console + b.console, page: a.page + b.page, unexplained: a.unexplained + b.unexplained, messages: a.messages.concat(b.messages).slice(0, 6)} }
function netRecord(P, m) {
  const s = P.net.since(m)
  return {...s, foreign_origins: [...P.net.foreign].sort(), routed: P.routed.map(r => ({host: new URL(r.url).host, path: new URL(r.url).pathname.split('/').slice(-2).join('/'), length: r.length})).sort((a, b) => a.path < b.path ? -1 : 1), aborted: [...new Set(P.aborted.map(a => new URL(a.url).host))].sort()}
}

async function takeShot(P, env, o, surface, key, view, regionless) {
  if (o.noShots) return null
  const page = P.page
  await page.emulateMedia({reducedMotion: 'reduce'})
  if (P.vc) await page.evaluate(() => { window.__vc.auto = false })
  await sleep(150)
  let buf
  try { buf = await page.screenshot({animations: 'disabled', caret: 'hide', scale: 'css'}) } finally { await page.emulateMedia({reducedMotion: null}); if (P.vc) await page.evaluate(() => { window.__vc.auto = true }) }
  const f = fitShot(buf), dir = o.shotsDir, name = surface + '-' + key + '-' + view + '.png'
  fs.mkdirSync(dir, {recursive: true}); fs.writeFileSync(path.join(dir, name), f.buf)
  const im = pngDecode(f.buf), rel = p => path.relative(REPO, p).split(path.sep).join('/'), out = {path: rel(path.join(dir, name)), w: im.w, h: im.h, bytes: f.buf.length, scale: f.scale, sha: sha(f.buf)}
  if (f.scale !== 1) { const fn = name.replace(/\.png$/, '.full.png'); fs.writeFileSync(path.join(dir, fn), buf); out.full_path = rel(path.join(dir, fn)); out.full_sha = sha(buf) }   // the image diff reads the css-px original; the reduced copy is for viewing
  return out
}

// ---------------------------------------------------------------- sheet stops (metrics.md section 4: chrome_cover.peek and .half)
// A sheet exists when the surface exposes the hook window[ns].sheet.stop or a shown handle ([data-sheet-handle], .sheet-handle, #sheetHandle) inside
// its root (#panel on the atlas, #drawer on the sim). A stop is driven by the hook, else by tapping the handle; either way it is measured only once the
// sheet reports that stop through data-sheet-stop / data-stop on the [data-sheet] element (or the root), or a class peek|half|full, sheet-<stop>, is-<stop>,
// and half only when the sheet's rect differs from its rect at peek. Values: a number; 'no-sheet' while none exists (B0);
// 'unmeasured: stop not reached (...)' when a sheet exists but did not report the stop (a no-op hook included). Never null.
const SHEET_HANDLE = '[data-sheet-handle], .sheet-handle, #sheetHandle'
function sheetProbe(arg) {   // page side
  const [ns, rootSel, handleSel] = arg, root = document.querySelector(rootSel), mc = window.__mc
  const hook = !!(window[ns] && window[ns].sheet && typeof window[ns].sheet.stop === 'function')
  const h = root && [...root.querySelectorAll(handleSel)].find(e => mc.shown(e) && e.getBoundingClientRect().width > 0)
  const el = (h && h.closest('[data-sheet]')) || (root && root.querySelector('[data-sheet]')) || root
  let stop = null
  if (el) {
    stop = el.getAttribute('data-sheet-stop') || el.getAttribute('data-stop') || null
    if (!stop) for (const k of ['peek', 'half', 'full']) if (el.classList.contains(k) || el.classList.contains('sheet-' + k) || el.classList.contains('is-' + k)) stop = k
  }
  const r = h && h.getBoundingClientRect(), er = el && el !== root ? el.getBoundingClientRect() : (root ? root.getBoundingClientRect() : null)
  return {hook, handle: r ? {x: r.left + r.width / 2, y: r.top + r.height / 2} : null, stop, rect: er ? [Math.round(er.left), Math.round(er.top), Math.round(er.width), Math.round(er.height)] : null}
}
async function sheetStops(P, ns, rootSel, prof, extraPump) {   // a stop is measured only after the sheet itself reports it, whether the hook or the handle drove it
  const out = {}, page = P.page, probe = () => page.evaluate(sheetProbe, [ns, rootSel, SHEET_HANDLE]).catch(() => ({hook: false, handle: null, stop: null, rect: null}))
  const s0 = await probe()
  if (!s0.hook && !s0.handle) return {peek: 'no-sheet', half: 'no-sheet'}
  const at = {}
  for (const st of ['peek', 'half']) {
    try {
      let s = await probe(); const via = s.hook ? 'hook' : 'handle'
      if (s.hook) { await page.evaluate(([n, k]) => window[n].sheet.stop(k), [ns, st]); if (extraPump) await pump(P, 2); await sleep(400); s = await probe() }
      else for (let i = 0; i < 4 && s.stop !== st && s.handle; i++) { await tapAt(P, prof, s.handle.x, s.handle.y); if (extraPump) await pump(P, 2); await sleep(400); s = await probe() }
      if (s.stop !== st) { out[st] = 'unmeasured: stop not reached (' + via + ' asked ' + st + ', sheet reports ' + (s.stop || 'none') + ')'; continue }
      at[st] = s.rect
      if (st === 'half' && at.peek && s.rect && at.peek.join() === s.rect.join()) { out[st] = 'unmeasured: stop not reached (the sheet rect did not move from peek)'; continue }
      const v = rnd(await page.evaluate(() => window.__mc.chromeCover()), 4)
      out[st] = v == null ? 'unmeasured: chromeCover failed' : v
    } catch (e) { out[st] = 'unmeasured: ' + String(e.message || e).slice(0, 60) }
  }
  return out
}
const SHEET_KEY_RE = /\.chrome_cover\.(peek|half)$/

// ---------------------------------------------------------------- control inventory, reach, primary (metrics.md section 5)
const PRIMARY = {
  atlas: [/^textbox:Search/i, /^button:Zoom in/i, /^button:Zoom out/i, /Draw the sheet|sheet handle|drawer/i, /Layers/i, /^button:(Close|×)/i, /^(link|button):First card action/i],
  sim: [/^button:Pause/i, /^button:(Watching pace|1 day|5 days|30 days|120 days)/i, /Hide the court/i, /Return the court|Bring back the court/i, /^button:Open the ledger/i, /Close the chart/i]
}
function isPrimary(surface, c) { return PRIMARY[surface].some(re => re.test(c.id) || re.test(c.role + ':' + c.name)) }
async function inventory(P) { return P.page.evaluate(() => window.__mc.inventory()) }
async function actOn(P, prof, c) {
  await tapAt(P, prof, c.cx, c.cy); await sleep(350)
  if (/leaflet-control-layers-toggle|Layers/.test(c.id) || c.id.includes('Layers')) {   // Playwright touch cannot open a collapsed Leaflet control; the class is Control.Layers.expand()
    await P.page.evaluate(() => { const l = document.querySelector('.leaflet-control-layers'); if (l && !l.classList.contains('leaflet-control-layers-expanded')) l.classList.add('leaflet-control-layers-expanded') })
    await sleep(150)
  }
}
async function reachProbe(P, prof, surface, restore, depthMax = 2) {
  const reach = {}, start = await inventory(P)
  for (const c of start) reach[c.id] = 0
  const discOf = list => list.filter(c => c.disc).map(c => c.id)
  const visit = async (path, depth) => {
    if (depth > depthMax) return
    await restore(); let cur = await inventory(P)
    for (const id of path) { const c = cur.find(x => x.id === id); if (!c) return; await actOn(P, prof, c); cur = await inventory(P) }
    const here = discOf(cur).filter(id => !path.includes(id))
    for (const id of here) {
      await restore(); let inv = await inventory(P), ok = true
      for (const p of path) { const c = inv.find(x => x.id === p); if (!c) { ok = false; break } await actOn(P, prof, c); inv = await inventory(P) }
      if (!ok) continue
      const c = inv.find(x => x.id === id); if (!c) continue
      await actOn(P, prof, c); const after = await inventory(P)
      for (const a of after) if (reach[a.id] === undefined) reach[a.id] = depth
      if (depth < depthMax) await visit(path.concat(id), depth + 1)
    }
  }
  await visit([], 1)
  await restore()
  return {reach, start}
}

// ---------------------------------------------------------------- atlas capture
// A card <h2> may carry provenance marks after the name (provStar's <sup class="prov-star">✶</sup> on sea lanes and invented chart POIs):
// the page drops <sup>/.prov-star before reading the title, and cleanName drops any ✶ and a trailing run of marker glyphs, so 'The Strait Run✶' is the name 'The Strait Run'.
const MARK_TAIL_RE = /[\s\p{So}\p{Sk}*†‡§¶⁂※•·°]+$/u
function cleanName(s) { return String(s || '').normalize('NFC').replace(/✶/g, '').replace(/\s+/g, ' ').trim().replace(MARK_TAIL_RE, '').trim() }
function foldName(s) { return cleanName(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase() }
// A tap is "own" only on a whole-name match: Lepon must not own '#place=Leponnia' nor '#place=Lepon the Old'.
// The origin flags ('Hometown of X', 'Haunt of X') open the company card '#company=X'; that is the one alias.
const CARD_HASH_RE = /^#?(?:place|faction|company)=(.*)$/
function wantedNames(glyphName) {
  const f = foldName(glyphName), w = new Set([f]), m = f.match(/^(?:hometown|haunt) of (.+)$/)
  if (m) w.add(m[1])
  return w
}
const SEG_RE = /\s+(?:[—–·|•]|-)\s+/
const nameSegs = t => { const f = foldName(t); return [f, ...f.split(SEG_RE)] }   // a chooser row may carry a kind on either side of a dash; the name is a whole segment
const titleSegs = t => { const f = foldName(t); return [f, f.split(SEG_RE)[0]] }   // a card title is the name, or the name before a dash
function tapOutcome(glyphName, res, before) {
  const want = wantedNames(glyphName), has = names => names.some(n => want.has(n))
  const opened = !!(res.open || res.hash !== before)
  const hm = CARD_HASH_RE.exec(res.hash || ''), hashNames = hm ? [foldName(hm[1]), foldName(hm[1].split('&')[0])] : []
  const listed = !!res.chooser && res.chooser.rows.some(t => has(nameSegs(t)))
  const own = opened && (hashNames.length ? has(hashNames) : has(titleSegs(res.title)))   // the card hash, when there is one, decides
  return res.chooser ? (listed ? 'chooser' : 'chooser_without_glyph') : opened ? (own ? 'own' : 'other') : 'none'
}
// A recorded capture (B0 above all) must agree with the scorer, or the unchanged rule fails every unit on a fixture the tree never changed:
// each recorded 'other' row whose `opened` is a card title re-scores 'other', the title is stored as the page now reads it, and the counts add up.
// `opened` is the card hash, else the card title, else any other hash ('#view=' with no card open), else the chooser rows; so a row that is not a card hash re-scores from the record.
const TAP_KEEP = 60
const reScore = r => r.opened.startsWith('#') ? tapOutcome(r.name, {hash: r.opened, open: false, title: '', chooser: null}, '') : tapOutcome(r.name, {hash: '', open: true, title: cleanName(r.opened), chooser: null}, '')
function tapFixtureDisagreements(cap) {
  const out = [], bad = t => t.outcome === 'other' || t.outcome === 'chooser_without_glyph'
  for (const [p, a] of Object.entries((cap && cap.atlas) || {})) {
    const tf = a && a.tap_fixture; if (!tf || !Array.isArray(tf.taps)) continue
    const at = (i, r) => p + '.taps[' + i + '] ' + r.name + ' -> ' + r.opened
    tf.taps.forEach((r, i) => {
      if (r.outcome === 'own') out.push(at(i, r) + ': an own row is recorded')
      if (r.outcome !== 'other' || typeof r.opened !== 'string' || CARD_HASH_RE.test(r.opened)) return
      if (!r.opened.startsWith('#') && r.opened !== cleanName(r.opened)) out.push(at(i, r) + ': title not stored as read (provenance marks)')
      const re = reScore(r)
      if (re !== 'other') out.push(at(i, r) + ': recorded other, re-scores ' + re)
    })
    const nb = tf.taps.filter(bad).length, vs = Object.values(tf.views || {}).reduce((s, v) => s + (v.wrong_card || 0), 0)
    if (tf.wrong_card !== tf.wrong_taps) out.push(p + ': wrong_card ' + tf.wrong_card + ' != wrong_taps ' + tf.wrong_taps)
    if (vs !== tf.wrong_card) out.push(p + ': views wrong_card sum ' + vs + ' != wrong_card ' + tf.wrong_card)
    if (tf.taps.length < TAP_KEEP ? nb !== tf.wrong_card : nb > tf.wrong_card) out.push(p + ': ' + nb + ' wrong rows recorded vs wrong_card ' + tf.wrong_card)
    const ncw = tf.taps.filter(t => t.outcome === 'chooser_without_glyph').length
    if (tf.taps.length < TAP_KEEP ? ncw !== tf.chooser_without_glyph : ncw > tf.chooser_without_glyph) out.push(p + ': chooser_without_glyph ' + tf.chooser_without_glyph + ' vs ' + ncw + ' recorded')
  }
  return out
}
// Re-scores a recorded fixture's non-card-hash rows with the current scorer. A full list (fewer than TAP_KEEP rows) re-scores exactly;
// a cut list cannot recover the rows past the cut, and a pre-fix '#view=' row lost its title, so those need a recapture (as B0's tap_fixture had).
function rescoreTapFixture(tf) {
  const views = JSON.parse(JSON.stringify(tf.views || {})), keep = []
  let drop = 0
  for (const r of tf.taps) {
    if (r.outcome !== 'other' || typeof r.opened !== 'string' || CARD_HASH_RE.test(r.opened)) { keep.push(r); continue }
    const opened = r.opened.startsWith('#') ? r.opened : cleanName(r.opened), outcome = reScore({...r, opened})
    if (outcome === 'own') { drop++; if (views[r.view]) views[r.view].wrong_card-- } else keep.push({...r, opened, outcome})
  }
  return {tf: {...tf, wrong_card: tf.wrong_card - drop, wrong_taps: tf.wrong_taps - drop, views, taps: keep}, dropped: drop, cut: tf.taps.length >= TAP_KEEP}
}
async function captureAtlas(env, key, o) {
  const prof = o.profile = o.profiles[key], url = env.server.origin + '/maps-site/' + VERSION_HINT
  const P = await openPage(env, key, 'atlas', {...o, vclock: o.clock === 'virtual' ? 'auto' : null})
  P.vc = o.clock === 'virtual'
  const R = {env: {}, shots: {}}
  const page = P.page
  try {
    const m0 = P.net.mark()
    await page.goto(url, {waitUntil: 'load'})
    await page.waitForFunction(() => window.ATLAS && window.ATLAS.ready, null, {timeout: 120000})
    await settle(P, 400)
    R.env = await page.evaluate(() => ({w: innerWidth, h: innerHeight, dpr: devicePixelRatio, coarse: matchMedia('(pointer:coarse)').matches, hover: matchMedia('(hover:hover)').matches,
      hardwareConcurrency: navigator.hardwareConcurrency, deviceMemory: navigator.deviceMemory, vv_scale: window.visualViewport ? +window.visualViewport.scale.toFixed(3) : null, viewport_meta: (document.querySelector('meta[name=viewport]') || {}).content || null}))
    R.first_load = netRecord(P, m0)
    R.contents = await page.evaluate(() => {
      const c = document.getElementById('contents'), q = s => c && c.querySelector(s), top = e => e ? Math.round(e.getBoundingClientRect().top) : null
      return {open: !!c && !c.hidden, kickerTop: top(q('.contents-kicker')), titleTop: top(q('.contents-title')), footBottom: q('.contents-foot') ? Math.round(q('.contents-foot').getBoundingClientRect().bottom) : null, cardTops: [...(c ? c.querySelectorAll('.tcard') : [])].map(x => Math.round(x.getBoundingClientRect().top))}
    })
    R.shots['1-contents'] = await takeShot(P, env, o, 'atlas', key, '1-contents')
    // repeat visit: a second goto in the same context (metrics.md section 1)
    const m1 = P.net.mark()
    await page.goto(url, {waitUntil: 'load'})
    await page.waitForFunction(() => window.ATLAS && window.ATLAS.ready, null, {timeout: 120000})
    await settle(P, 400)
    const rv = P.net.since(m1); R.repeat_visit = {bytes: rv.bytes, requests: rv.requests, cache_hits: rv.cache_hits}
    // The Whole Chart
    await (prof.touch ? page.locator('.tcard[data-theme=whole]').tap() : page.locator('.tcard[data-theme=whole]').click())
    await sleep(500); await settle(P, 800)
    const whole = await page.evaluate(() => {
      const mc = window.__mc, s = document.scrollingElement, p = document.getElementById('panel'), pr = p && p.getBoundingClientRect(), pcs = p && getComputedStyle(p)
      const mp = window.ATLAS.map, z = mp.getZoom(), b = mp.getBounds(), mx = mp.options.maxBounds
      let share = null
      if (mx) { const a1 = mp.project(b.getSouthWest(), z), a2 = mp.project(b.getNorthEast(), z), c1 = mp.project(mx.getSouthWest(), z), c2 = mp.project(mx.getNorthEast(), z)
        const iw = Math.max(0, Math.min(Math.max(a1.x, a2.x), Math.max(c1.x, c2.x)) - Math.max(Math.min(a1.x, a2.x), Math.min(c1.x, c2.x))), ih = Math.max(0, Math.min(Math.max(a1.y, a2.y), Math.max(c1.y, c2.y)) - Math.max(Math.min(a1.y, a2.y), Math.min(c1.y, c2.y)))
        share = iw * ih / (Math.abs(c2.x - c1.x) * Math.abs(c2.y - c1.y)) }
      const inv = mc.inventory(), mk = inv.filter(c => c.marker)
      let tiers = null; try { tiers = typeof window.ATLAS.tiers === 'function' ? window.ATLAS.tiers() : null } catch (e) { tiers = {error: String(e)} }
      const fit = mp.getMinZoom(), ceil = (window.L && L.Browser.retina) ? 5 : 6
      return {doc_scroll: s.scrollHeight, doc_scroll_w: s.scrollWidth, inner_height: innerHeight, zoom: +z.toFixed(3), minZoom: +fit.toFixed(3), maxZoom: mp.getMaxZoom(),
        panel_closed: p ? {visibility: pcs.visibility, top: Math.round(pr.top), aria_hidden: p.getAttribute('aria-hidden'), leak_px: Math.max(0, Math.round(innerHeight - pr.top))} : null,
        chrome_cover: mc.chromeCover(), share_visible: share,
        targets: {count: inv.filter(c => c.under44).length, total: inv.length, ratio: inv.length ? +(inv.filter(c => c.under44).length / inv.length).toFixed(4) : null, markers: mk.length, markers_under44: mk.filter(c => c.under44).length},
        min_font: mc.minFont('#map .leaflet-pane'), hover_ungated: mc.hoverUngated(), panes: mc.panes(),
        tiers, tiers_derived: {fit: +fit.toFixed(4), ceil, B: +(fit + (ceil - fit) / 3).toFixed(4), C: +(fit + 2 * (ceil - fit) / 3).toFixed(4)},
        header_h: (() => { const h = document.querySelector('header'); return h ? Math.round(h.getBoundingClientRect().height) : null })(),
        marker_types: mk.reduce((a, c) => { a[c.role] = (a[c.role] || 0) + 1; return a }, {}),
        sw: null}
    })
    whole.sw = await page.evaluate(() => navigator.serviceWorker ? navigator.serviceWorker.getRegistrations().then(r => r.length) : null).catch(() => null)
    Object.assign(R, {doc_scroll: whole.doc_scroll, inner_height: whole.inner_height, panel_closed: whole.panel_closed, share_visible: rnd(whole.share_visible, 4), targets_under_44: whole.targets,
      min_font_px: whole.min_font, hover_ungated: whole.hover_ungated, panes: whole.panes, tiers: whole.tiers, tiers_derived: whole.tiers_derived, zoom: {current: whole.zoom, min: whole.minZoom, max: whole.maxZoom},
      header_h: whole.header_h, doc_scroll_w: whole.doc_scroll_w, sw_registrations: whole.sw})
    R.chrome_cover = {whole: rnd(whole.chrome_cover, 4)}
    R.shots['2-whole-chart'] = await takeShot(P, env, o, 'atlas', key, '2-whole-chart')
    // layers open
    try {
      const tog = await page.evaluate(() => { const e = document.querySelector('.leaflet-control-layers-toggle'); if (!e) return null; const r = e.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2} })
      if (tog) {
        if (prof.touch) { await page.touchscreen.tap(tog.x, tog.y); await sleep(300) } else { await page.mouse.move(tog.x, tog.y); await sleep(300) }
        const opened = await page.evaluate(() => document.querySelector('.leaflet-control-layers').classList.contains('leaflet-control-layers-expanded'))
        R.layers_tap_opened = opened
        if (!opened) await page.evaluate(() => document.querySelector('.leaflet-control-layers').classList.add('leaflet-control-layers-expanded'))
        await sleep(400)
        const lay = await page.evaluate(() => { const l = document.querySelector('.leaflet-control-layers-list'), r = l.getBoundingClientRect(); return {cover: window.__mc.chromeCover(), rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], fits: r.bottom <= innerHeight && r.right <= innerWidth && r.left >= 0, rows: l.querySelectorAll('label').length, row_h: Math.round(l.querySelector('label').getBoundingClientRect().height), scroll_h: l.scrollHeight, client_h: l.clientHeight} })
        R.chrome_cover.layers = rnd(lay.cover, 4); R.layers = {rect: lay.rect, fits_viewport: lay.fits, rows: lay.rows, row_h: lay.row_h, scrolls: lay.scroll_h > lay.client_h}
        R.shots['3-layers'] = await takeShot(P, env, o, 'atlas', key, '3-layers')
        await page.evaluate(() => document.querySelector('.leaflet-control-layers').classList.remove('leaflet-control-layers-expanded'))
        await sleep(300)
      } else { R.chrome_cover.layers = null; R.layers = null }
    } catch (e) { R.layers = {error: String(e).slice(0, 120)} }
    // the Epeshu tap at minZoom + 2.6 (the harness's z4.55 on iphone13), then the card state
    const tapAtZoom = async (name, dz) => {
      const info = await page.evaluate(([n, d]) => { const m = window.ATLAS.find(n); if (!m) return null; const ll = m._mk.getLatLng(); window.ATLAS.map.setView(ll, Math.min(window.ATLAS.map.getMaxZoom(), window.ATLAS.map.getMinZoom() + d), {animate: false}); return {z: window.ATLAS.map.getZoom()} }, [name, dz])
      if (!info) return {found: false}
      await sleep(600); await settle(P, 800)
      const pos = await page.evaluate(n => { const el = window.ATLAS.find(n)._mk.getElement(), g = el && el.querySelector('.glyph'); if (!g) return null; const r = g.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2} }, name)
      if (!pos) return {found: true, zoom: rnd(info.z, 3), glyph: null}
      const stack = await page.evaluate(([x, y]) => document.elementsFromPoint(x, y).slice(0, 4).map(e => (e.tagName + '.' + (typeof e.className === 'string' ? e.className : '')).slice(0, 40)), [pos.x, pos.y])
      await tapAt(P, prof, pos.x, pos.y); await sleep(1200); await settle(P, 600)
      const res = await page.evaluate(() => { const p = document.getElementById('panel'); return {hash: decodeURIComponent(location.hash), open: p.getAttribute('aria-hidden') === 'false', title: ((p.querySelector('h2,h3') || {}).textContent || '').trim().slice(0, 60)} })
      return {found: true, zoom: rnd(info.z, 3), glyph_center: [Math.round(pos.x), Math.round(pos.y)], stack, opened_hash: res.hash, panel_open: res.open, panel_title: res.title}
    }
    const closeCard = async () => {
      await page.evaluate(() => { const c = document.getElementById('panelClose'); if (c) c.click(); history.replaceState(null, '', location.pathname + location.search) }).catch(() => {})
      await sleep(400)
    }
    R.tap_epeshu = await tapAtZoom('Epēshu', 2.6)
    R.card = await page.evaluate(() => {
      const p = document.getElementById('panel'), r = p.getBoundingClientRect(), b = document.getElementById('panelBody'), cl = document.getElementById('panelClose').getBoundingClientRect()
      const ov = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / (innerWidth * innerHeight)
      return {open: p.getAttribute('aria-hidden') === 'false', rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], covers: +ov.toFixed(3), body_scroll_h: b.scrollHeight, body_client_h: b.clientHeight, close_btn: [Math.round(cl.width), Math.round(cl.height)], chrome_cover: window.__mc.chromeCover()}
    })
    R.chrome_cover.card = rnd(R.card.chrome_cover, 4); delete R.card.chrome_cover
    R.shots['4-place-card'] = await takeShot(P, env, o, 'atlas', key, '4-place-card')
    Object.assign(R.chrome_cover, await sheetStops(P, 'ATLAS', '#panel', prof, false))   // the card sheet at peek and half (A-U9); 'no-sheet' until it exists
    await closeCard()
    // tap fixture (R7, A-U3): the .glyph centre of every interactive glyph at each view A-U3 names; right = its own card, or a visible chooser whose rows list the glyph
    const setTapView = (at, z) => page.evaluate(([n, zz]) => { const M = window.ATLAS.map, mk = n && window.ATLAS.find(n), c = mk ? mk._mk.getLatLng() : (M.options.maxBounds ? M.options.maxBounds.getCenter() : M.getCenter()); M.setView(c, zz == null ? M.getMinZoom() : Math.max(M.getMinZoom(), Math.min(M.getMaxZoom(), zz)), {animate: false}) }, [at, z])
    const taps = [], tapViews = {}
    for (const [vid, at, z] of TAP_VIEWS) {
      await setTapView(at, z); await sleep(600); await settle(P, 600)
      const gl = await page.evaluate(() => window.__mc.glyphs()), named = gl.filter(g => g.name && g.tappable).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : a.x - b.x)
      const sample = o.tapN > 0 && named.length > o.tapN ? Array.from({length: o.tapN}, (_, i) => named[Math.floor(i * named.length / o.tapN)]) : named
      const v = tapViews[vid] = {zoom: rnd(await page.evaluate(() => window.ATLAS.map.getZoom()), 3), glyphs: gl.length, untappable: gl.filter(g => !g.tappable).length, unnamed: gl.filter(g => !g.name).length, tapped: 0, wrong_card: 0}
      for (const g of sample) {
        const before = await page.evaluate(() => location.hash), view0 = await page.evaluate(() => { const c = window.ATLAS.map.getCenter(); return [c.lat, c.lng, window.ATLAS.map.getZoom()] })
        await tapAt(P, prof, g.x, g.y); await sleep(700)
        const res = await page.evaluate(() => {
          const p = document.getElementById('panel'), vis = e => window.__mc.shown(e) && e.getAttribute('aria-hidden') !== 'true' && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0
          const ch = [...document.querySelectorAll('[class*=chooser]')].find(vis)
          const rows = ch ? [...ch.querySelectorAll('li,button,a,[role=option],[role=menuitem],[class*=row],[class*=item]')].filter(vis).map(e => e.textContent.replace(/\s+/g, ' ').trim()) : []
          return {hash: decodeURIComponent(location.hash), open: p.getAttribute('aria-hidden') === 'false', title: (h => { if (!h) return ''; const c = h.cloneNode(true); c.querySelectorAll('sup, .prov-star').forEach(e => e.remove()); return c.textContent.replace(/\s+/g, ' ').trim() })(p.querySelector('h2,h3')), chooser: ch ? {rows: rows.length ? rows : [ch.textContent.replace(/\s+/g, ' ').trim()]} : null}
        })
        const outcome = tapOutcome(g.name, res, before)
        taps.push({view: vid, name: g.name, outcome, opened: (CARD_HASH_RE.test(res.hash || '') ? res.hash : cleanName(res.title) || res.hash) || (res.chooser ? res.chooser.rows.slice(0, 4).join(' | ') : null)})
        v.tapped++; if (outcome === 'other' || outcome === 'chooser_without_glyph') v.wrong_card++
        if (res.chooser) await page.keyboard.press('Escape').catch(() => {})
        await closeCard()
        const moved = await page.evaluate(([la, ln, zz]) => { const c = window.ATLAS.map.getCenter(); return Math.abs(c.lat - la) > 1e-6 || Math.abs(c.lng - ln) > 1e-6 || Math.abs(window.ATLAS.map.getZoom() - zz) > 1e-6 }, view0)
        if (moved) { await page.evaluate(([la, ln, zz]) => window.ATLAS.map.setView([la, ln], zz, {animate: false}), view0); await sleep(300) }
      }
    }
    const bad = t => t.outcome === 'other' || t.outcome === 'chooser_without_glyph'
    R.tap_fixture = {n: taps.length, complete: o.tapN <= 0, wrong_card: taps.filter(bad).length, wrong_taps: taps.filter(bad).length, no_open: taps.filter(t => t.outcome === 'none').length, chooser: taps.filter(t => t.outcome === 'chooser').length,
      chooser_without_glyph: taps.filter(t => t.outcome === 'chooser_without_glyph').length, views: tapViews, taps: taps.filter(t => t.outcome !== 'own').slice(0, TAP_KEEP)}
    // long press: a touch held 600 ms on a glyph shows its name (A-U5) or opens nothing
    await setTapView(null, null); await sleep(600); await settle(P, 600)
    const lp = prof.touch ? (await page.evaluate(() => window.__mc.glyphs())).find(g => g.name && g.tappable) : null
    if (lp) {
      const g = lp, cdp = P.cdp
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: g.x, y: g.y}]}); await sleep(700)
      const tip = await page.evaluate(() => [...document.querySelectorAll('.leaflet-tooltip')].filter(e => window.__mc.shown(e)).length)
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []}); await sleep(300)
      R.long_press = {name_visible: tip > 0}; await closeCard()
    } else R.long_press = null
    // controls (union over the states) and reach
    await page.evaluate(() => window.ATLAS.map.setView(window.ATLAS.map.options.maxBounds ? window.ATLAS.map.options.maxBounds.getCenter() : window.ATLAS.map.getCenter(), window.ATLAS.map.getMinZoom(), {animate: false}))
    await sleep(500)
    const restore = async () => { await page.evaluate(() => { const l = document.querySelector('.leaflet-control-layers'); if (l) l.classList.remove('leaflet-control-layers-expanded'); const c = document.getElementById('panelClose'); if (c && document.getElementById('panel').getAttribute('aria-hidden') === 'false') c.click() }).catch(() => {}); await sleep(250) }
    const rp = await reachProbe(P, prof, 'atlas', restore)
    R.controls = rp.start.map(c => ({id: c.id, w: c.w, h: c.h, marker: c.marker, primary: isPrimary('atlas', c), reach: rp.reach[c.id], bottom25: c.bottom25}))
    await tapAtZoom('Epēshu', 4.2).catch(() => {})
    let firstAction = true
    for (const c of await inventory(P)) {
      if (R.controls.find(x => x.id === c.id)) continue
      rp.reach[c.id] = 1
      const first = firstAction && c.panel && c.role !== 'generic' && !/^button:Close/.test(c.id); if (first) firstAction = false
      R.controls.push({id: c.id, w: c.w, h: c.h, marker: false, primary: isPrimary('atlas', c) || first, card_first_action: first || undefined, reach: 1, bottom25: c.bottom25})
    }
    await closeCard()
    for (const id of Object.keys(rp.reach)) if (!R.controls.find(x => x.id === id)) R.controls.push({id, w: null, h: null, marker: false, primary: isPrimary('atlas', {id, role: id.split(':')[0], name: id.split(':').slice(1).join(':')}), reach: rp.reach[id], bottom25: null})
    R.reach = rp.reach
    R.reach_max = Math.max(0, ...Object.values(rp.reach).filter(v => v != null))
    R.primary = Object.fromEntries(R.controls.filter(c => c.primary).map(c => [c.id, {reach: c.reach == null ? null : c.reach, bottom25: c.bottom25, w: c.w, h: c.h}]))
    // city canvas determinism: the seeded plan for fixed cities, hashed (UG3)
    R.city_canvas = {}
    for (const n of ['Tamaron', 'Sokundo', 'Kanae']) {
      try { await page.evaluate(c => window.ATLAS.descend(c, 0), n); await sleep(1500); await settle(P, 1200, 20000) } catch (e) { /* city without a plan */ }
    }
    R.city_canvas = await page.evaluate(async () => {
      const reg = window.ATLAS.cityReg || {}, out = {}
      for (const k of Object.keys(reg).sort()) {
        const e = reg[k]; if (!e || e.prov !== 'invented' || !/^data:/.test(e.url || '')) continue
        const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(e.url))
        out[k] = [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('')
      }
      return out
    }).catch(e => ({error: String(e).slice(0, 100)}))
    R.cityCanvasSha = Object.keys(R.city_canvas).length ? sha(JSON.stringify(R.city_canvas)) : null
    R.errors = errorsOf(P)
    R.timing = {}
    await page.evaluate(() => { try { if (window.ATLAS.exitChart) window.ATLAS.exitChart() } catch (e) { /* none */ } })
    // extras on the same profile, each in its own page so the main measurement stays as B0 took it
    R.extras = {}; R.extra_errors = {}   // each extra's own page errors, read by UG2 (kept out of timing and out of the identity compare)
    await P.close()
    if (o.extras.includes('safe_area') && prof.touch) R.extras.safe_area = await extraSafeArea(env, key, o, 'atlas', url, R.extra_errors)
    if (o.extras.includes('keyboard') && prof.touch) R.extras.keyboard = await extraKeyboard(env, key, o, url, R.extra_errors)
    if (o.nightLoaf && prof.touch) R.timing.night_loaf = await extraLoaf(env, key, o, url, R.extra_errors)
    if (o.mutate) R.mutate_html = await extraMutate(env, key, o, '/maps-site/', 'maps-site/index.html', R.extra_errors)
  } catch (e) { R.error = String(e.stack || e).slice(0, 600); R.errors = R.errors || errorsOf(P); try { await P.close() } catch (e2) { /* closed */ } }
  return R
}

async function extraSafeArea(env, key, o, surface, url, sink = {}) {
  const P = await openPage(env, key, surface, {...o, vclock: surface === 'sim' ? 'manual' : null})
  try {
    let cmd = 'applied'
    try { await P.cdp.send('Emulation.setSafeAreaInsetsOverride', {insets: INSETS}) } catch (e) { cmd = 'unavailable' }
    await P.page.goto(url, {waitUntil: 'load'})
    if (surface === 'atlas') { await P.page.waitForFunction(() => window.ATLAS && window.ATLAS.ready); await settle(P, 400); await P.page.locator('.tcard[data-theme=whole]').tap(); await sleep(600); await settle(P, 600) }
    else { await simReady(P); await pump(P, 3) }
    const prof = o.profile
    const r = await P.page.evaluate(([ins, vw, vh]) => {
      const inv = window.__mc.inventory(), band = c => c.y < ins.top || c.y + c.h > vh - ins.bottom
      const env = (() => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;top:env(safe-area-inset-top);visibility:hidden'; document.body.appendChild(d); const t = parseFloat(getComputedStyle(d).top); d.remove(); return t })()
      let rules = 0; for (const s of document.styleSheets) { let rs; try { rs = s.cssRules } catch (e) { continue } const walk = rr => { for (const x of rr) { if (x.cssRules) walk(x.cssRules); else if (/safe-area-inset/.test(x.cssText)) rules++ } }; walk(rs) }
      return {env_top_px: env, viewport_fit_cover: /viewport-fit=cover/.test((document.querySelector('meta[name=viewport]') || {}).content || ''), env_rules: rules, intersecting: inv.filter(c => !c.marker && band(c)).map(c => c.id).slice(0, 20), intersecting_n: inv.filter(c => !c.marker && band(c)).length}
    }, [INSETS, prof.w, prof.h])
    return {command: cmd, ...r, safe_area: cmd === 'unavailable' ? 'unavailable' : 'applied'}
  } finally { sink.safe_area = errorsOf(P); await P.close() }
}
async function extraKeyboard(env, key, o, url, sink = {}) {   // layout path only: the real iOS keyboard is proposal until Mobile 15
  const P = await openPage(env, key, 'atlas', o), prof = o.profile
  try {
    await P.page.goto(url, {waitUntil: 'load'}); await P.page.waitForFunction(() => window.ATLAS && window.ATLAS.ready); await settle(P, 400)
    await P.page.locator('.tcard[data-theme=whole]').tap(); await sleep(500)
    await P.cdp.send('Emulation.setDeviceMetricsOverride', {width: prof.w, height: 300, deviceScaleFactor: prof.dpr, mobile: true})
    await sleep(500)
    return await P.page.evaluate(() => { const s = document.getElementById('search'), r = s ? s.getBoundingClientRect() : null; return {vv_height: window.visualViewport ? Math.round(window.visualViewport.height) : null, inner_height: innerHeight, search_rect: r ? [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] : null, search_visible: r ? r.bottom <= innerHeight && r.top >= 0 : null, font_px: s ? parseFloat(getComputedStyle(s).fontSize) : null} })
  } finally { sink.keyboard = errorsOf(P); await P.close() }
}
async function extraLoaf(env, key, o, url, sink = {}) {   // A-U12: LoAF during a scripted two-finger pinch, day then night (informational)
  const out = {}
  for (const theme of ['day', 'night']) {
    const P = await openPage(env, key, 'atlas', o), prof = o.profile
    try {
      await P.page.addInitScript(() => { window.__loaf = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__loaf.push(e.duration) }).observe({type: 'long-animation-frame', buffered: true}) } catch (e) { /* not supported */ } })
      await P.page.goto(url, {waitUntil: 'load'}); await P.page.waitForFunction(() => window.ATLAS && window.ATLAS.ready); await settle(P, 400)
      await P.page.locator('.tcard[data-theme=whole]').tap(); await sleep(600)
      await P.page.evaluate(t => document.body.setAttribute('data-theme', t), theme)
      const cx = prof.w / 2, cy = prof.h / 2
      await P.cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: cx - 30, y: cy, id: 1}, {x: cx + 30, y: cy, id: 2}]})
      for (let i = 1; i <= 20; i++) { await P.cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: cx - 30 - i * 4, y: cy, id: 1}, {x: cx + 30 + i * 4, y: cy, id: 2}]}); await sleep(30) }
      await P.cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []}); await sleep(800)
      const l = (await P.page.evaluate(() => window.__loaf || [])).sort((a, b) => a - b)
      out[theme] = {frames: l.length, p95: l.length ? rnd(l[Math.min(l.length - 1, Math.floor(l.length * 0.95))], 1) : 0, over50: l.filter(v => v > 50).length}
    } finally { sink['night_loaf.' + theme] = errorsOf(P); await P.close() }
  }
  return out
}
async function extraMutate(env, key, o, urlPath, file, sink = {}) {   // D7/D8: serve the same tree with one trailing <!-- v2 --> after the first visit
  const P = await openPage(env, key, 'atlas', o)
  try {
    const u = env.server.origin + urlPath + VERSION_HINT
    await P.page.goto(u, {waitUntil: 'load'}); await sleep(800)
    const before = await P.page.evaluate(() => document.documentElement.outerHTML.includes('<!-- v2 -->'))
    env.server.state.mutate = new Set([file]); await P.page.goto(u, {waitUntil: 'load'}); await sleep(800)
    const text = await P.page.evaluate(async () => (await fetch(location.pathname, {cache: 'no-cache'})).text())
    env.server.state.mutate = null
    return {first_visit_has_v2: before, served_has_v2: text.includes('<!-- v2 -->')}
  } finally { sink.mutate_html = errorsOf(P); await P.close() }
}

// ---------------------------------------------------------------- sim capture
async function simReady(P) {   // zero frames before ANNALS.ready: nothing ticks until the capture says so
  const t0 = Date.now()
  while (Date.now() - t0 < 180000) {
    const ok = await P.page.evaluate(() => !!(window.ANNALS && window.ANNALS.ready && window.__annalsReady)).catch(() => false)
    if (ok) return true
    await sleep(120)
  }
  throw new Error('ANNALS never became ready')
}
async function simStart(P, base, seed, o) {
  await P.page.goto(base + '/' + VERSION_HINT + (o.query ? '&' + o.query.replace(/^[?&]/, '') : '') + '#s=' + seed, {waitUntil: 'load'})
  await simReady(P)
  await P.page.evaluate(() => { window.ANNALS.speed(0); window.ANNALS.hold(1e12) })
  await pump(P, 3)
}
const TAP_VIEWS = [['whole', null, null], ['leponnia_z3.5', 'Epēshu', 3.5], ['epeshu_z4.55', 'Epēshu', 4.55], ['epeshu_z4.95', 'Epēshu', 4.95], ['city_z6.15', 'Epēshu', 6.15]]   // [id, centre on, absolute zoom]: the views A-U3 names
const SIM_VIEWS = [['overview', 0, 2200, 0.6], ['mid', 1, 700, 2.4], ['close', 2, 160, 4.0]]   // [name, settlement by descending population, altitude, yaw]
async function simViews(P) {
  const out = {}
  for (const [n, idx, alt, yaw] of SIM_VIEWS) {
    out[n] = await P.page.evaluate(([i, a, y]) => {
      const A = window.ANNALS, st = A.world.settlements.slice().sort((p, q) => (q.pop || 0) - (p.pop || 0) || (p.name < q.name ? -1 : 1)), s = st[Math.min(i, st.length - 1)]
      A.tod(0.5); A.gotoSettlement(s.name, a, true); A.yaw(y); A.pitch(0); A.step(2)
      const k = A.stats(); return {at: s.name, alt: a, calls: k.calls, tris: k.tris}
    }, [idx, alt, yaw])
  }
  return out
}
async function captureSim(env, key, o) {
  const prof = o.profile = o.profiles[key], base = env.server.origin
  const R = {shots: {}, seeds: {}}
  let P = null
  try {
    for (const seed of o.seeds) {
      const S = {}
      // the determinism record first, in a page of its own and before any UI probe, so no seed's fingerprint depends on UI behaviour (metrics.md section 4)
      P = await openPage(env, key, 'sim', {...o, vclock: 'manual'})
      P.vc = false
      await simStart(P, base, seed, o)
      await P.page.evaluate(() => window.ANNALS.simDays(400))
      const fp = await P.page.evaluate(() => window.__mc.fingerprint())
      S.fingerprint = sha(JSON.stringify(fp)); S.dayTicked = fp.dayTicked
      S.stats_after = await P.page.evaluate(() => { const s = window.ANNALS.stats(); return {buildings: s.buildings, trees: s.trees, seed: s.seed, realm: s.realm, treasury: s.treasury, pop: s.pop, agents: s.agents, chron: s.chron} })
      S.rng_next = await P.page.evaluate(() => window.__mc.rngNext())
      const fpErrors = errorsOf(P)
      await P.close(); P = null
      P = await openPage(env, key, 'sim', {...o, vclock: 'manual'})
      P.vc = false
      const page = P.page, m0 = P.net.mark()
      await simStart(P, base, seed, o)
      if (seed === o.seeds[0]) {
        R.env = await page.evaluate(() => ({w: innerWidth, h: innerHeight, dpr: devicePixelRatio, coarse: matchMedia('(pointer:coarse)').matches, hover: matchMedia('(hover:hover)').matches, hardwareConcurrency: navigator.hardwareConcurrency, deviceMemory: navigator.deviceMemory,
          viewport_meta: (document.querySelector('meta[name=viewport]') || {}).content || null, canvas: (() => { const c = document.querySelector('canvas'); return c ? [c.width, c.height] : null })()}))
        R.first_load = netRecord(P, m0)
        R.renderer = await page.evaluate(() => {
          const r = window.__mcR, s = window.__mcS; if (!r) return null
          const lights = []; if (s) s.traverse(x => { if (x.isLight) lights.push({type: x.type, castShadow: !!x.castShadow, map: x.shadow ? [x.shadow.mapSize.x, x.shadow.mapSize.y] : null}) })
          const a = r.getContext().getContextAttributes()
          return {pixelRatio: r.getPixelRatio(), size: (() => { const v = r.getSize(new window.THREE.Vector2()); return [v.x, v.y] })(), antialias: a.antialias, powerPreference: a.powerPreference, alpha: a.alpha, preserveDrawingBuffer: a.preserveDrawingBuffer,
            shadowMap: {enabled: r.shadowMap.enabled, type: r.shadowMap.type, autoUpdate: r.shadowMap.autoUpdate}, lights}
        })
        R.stats = await page.evaluate(() => window.ANNALS.stats())
        R.stats_keys = Object.keys(R.stats)
        R.device = await page.evaluate(() => { try { return typeof window.ANNALS.device === 'function' ? JSON.parse(JSON.stringify(window.ANNALS.device())) : null } catch (e) { return {error: String(e)} } })
        const meas = await page.evaluate(() => { const mc = window.__mc, inv = mc.inventory(); return {inv, hover: mc.hoverUngated(), font: mc.minFont('#labels, canvas'), top: mc.topOccupancy(), doc: [document.scrollingElement.scrollWidth, document.scrollingElement.scrollHeight]} })
        R.doc_scroll = meas.doc[1]; R.doc_scroll_w = meas.doc[0]; R.hover_ungated = meas.hover; R.min_font_px = meas.font; R.top_occupancy = meas.top
        R.targets_under_44 = {count: meas.inv.filter(c => c.under44).length, total: meas.inv.length, ratio: meas.inv.length ? +(meas.inv.filter(c => c.under44).length / meas.inv.length).toFixed(4) : null}
        R.shots['1-default'] = await takeShot(P, env, o, 'sim', key, '1-default')
        // the ledger sheet: handle, then the cover it makes
        const restore = async () => { await page.evaluate(() => { const f = document.getElementById('drawerFold'); const d = document.getElementById('drawer'); if (d && !d.classList.contains('hidden') && f) f.click(); const mo = document.getElementById('mapOverlay'); if (mo && !mo.classList.contains('hidden')) window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'})) }); await pump(P, 2); await sleep(200) }
        const rp = await reachProbe(P, prof, 'sim', restore)
        R.controls = rp.start.map(c => ({id: c.id, w: c.w, h: c.h, primary: isPrimary('sim', c), reach: rp.reach[c.id], bottom25: c.bottom25}))
        for (const id of Object.keys(rp.reach)) if (!R.controls.find(c => c.id === id)) R.controls.push({id, w: null, h: null, primary: isPrimary('sim', {id, role: id.split(':')[0], name: id.split(':').slice(1).join(':')}), reach: rp.reach[id], bottom25: null})
        R.reach = rp.reach; R.reach_max = Math.max(0, ...Object.values(rp.reach).filter(v => v != null))
        R.primary = Object.fromEntries(R.controls.filter(c => c.primary).map(c => [c.id, {reach: c.reach == null ? null : c.reach, bottom25: c.bottom25, w: c.w, h: c.h}]))
        await restore()
        const handle = await page.evaluate(() => { const h = document.getElementById('drawerHandle'); if (!h || !window.__mc.shown(h)) return null; const r = h.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2} })
        if (handle) {
          await tapAt(P, prof, handle.x, handle.y); await pump(P, 3); await sleep(300)
          R.ledger = await page.evaluate(() => { const d = document.getElementById('drawer'), r = d.getBoundingClientRect(); const ov = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) / (innerWidth * innerHeight)
            const inv = window.__mc.inventory().filter(c => d.contains(document.elementFromPoint(c.cx, c.cy))); return {open: !d.classList.contains('hidden'), rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], cover: +ov.toFixed(3), controls: inv.length, under44: inv.filter(c => c.under44).length} })
          R.shots['2-ledger'] = await takeShot(P, env, o, 'sim', key, '2-ledger')
          R.chrome_cover = {ledger: rnd(await page.evaluate(() => window.__mc.chromeCover()), 4), ...await sheetStops(P, 'ANNALS', '#drawer', prof, true)}   // the ledger sheet open, at peek and at half (S-U8)
          await restore()
        } else { R.ledger = null; R.chrome_cover = null }
        // hidden tab: does the loop keep ticking when the page is hidden? (virtual frames, speed 1)
        R.hidden = await page.evaluate(() => {
          const A = window.ANNALS, d0 = A.world.clock.day; A.speed(1)
          Object.defineProperty(document, 'visibilityState', {get: () => 'hidden', configurable: true}); Object.defineProperty(document, 'hidden', {get: () => true, configurable: true})
          document.dispatchEvent(new Event('visibilitychange')); window.__vc.pump(30)
          const adv = A.world.clock.day - d0
          Object.defineProperty(document, 'visibilityState', {get: () => 'visible', configurable: true}); Object.defineProperty(document, 'hidden', {get: () => false, configurable: true})
          document.dispatchEvent(new Event('visibilitychange')); A.speed(0)
          return {days_advanced_while_hidden: +adv.toFixed(4), pauses_when_hidden: adv < 1e-9}
        })
        await page.evaluate(() => { window.ANNALS.day(Math.floor(window.ANNALS.world.clock.day)) })
      }
      S.views = await simViews(P)
      await page.evaluate(() => { window.ANNALS.speed(0); window.ANNALS.hold(1e12) })
      S.errors = mergeErrors(fpErrors, errorsOf(P))
      if (seed === o.seeds[0] && o.extras.includes('ctxloss')) {
        S.ctxloss = await page.evaluate(async () => {
          const r = window.__mcR, gl = r && r.getContext(), e = gl && gl.getExtension('WEBGL_lose_context'); if (!e) return {available: false}
          const errs0 = (window.__errs || 0); e.loseContext(); await new Promise(x => setTimeout(x, 200)); const lost = gl.isContextLost(); e.restoreContext(); await new Promise(x => setTimeout(x, 400))
          try { window.__vc.pump(2) } catch (x) { return {available: true, lost, restored: !gl.isContextLost(), pump_error: String(x).slice(0, 80)} }
          return {available: true, lost, restored: !gl.isContextLost(), stats_ok: !!window.ANNALS.stats()}
        }).catch(e => ({available: 'error', error: String(e).slice(0, 80)}))
        S.errors = mergeErrors(fpErrors, errorsOf(P))
      }
      R.seeds[seed] = S
      if (seed === o.seeds[0]) { R.net_total = netRecord(P, m0) }
      await P.close(); P = null
    }
    // real clock, informational only: the ladder's behaviour under SwiftShader says nothing about a phone
    R.timing = {}
    R.extra_errors = {}
    if (o.realClock) R.timing.real_clock = await simRealClock(env, key, o, R.extra_errors)
    if (o.extras.includes('safe_area') && prof.touch) R.extras = {safe_area: await extraSafeArea(env, key, o, 'sim', base + '/' + VERSION_HINT + '#s=' + o.seeds[0], R.extra_errors)}
    if (o.mutate) (R.extras = R.extras || {}).mutate_html = await extraMutate(env, key, o, '/', 'index.html', R.extra_errors)
  } catch (e) { R.error = String(e.stack || e).slice(0, 600); if (P) try { await P.close() } catch (e2) { /* closed */ } }
  return R
}
async function simRealClock(env, key, o, sink = {}) {
  const P = await openPage(env, key, 'sim', o)
  const logs = []; P.page.on('console', m => { const t = m.text(); if (/degrade/.test(t)) logs.push(t) })
  try {
    await P.page.addInitScript(() => { window.__raf = []; const f = cb => { requestAnimationFrame(f2) }; const f2 = t => { window.__raf.push(t); requestAnimationFrame(f2) }; document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(f2)) })
    await P.page.goto(env.server.origin + '/' + VERSION_HINT + '#s=' + o.seeds[0], {waitUntil: 'load'})
    await simReady(P); await sleep(o.realSeconds * 1000)
    const r = await P.page.evaluate(() => {
      const a = window.__raf, secs = {}; for (const t of a) { const s = Math.floor(t / 1000); secs[s] = (secs[s] || 0) + 1 }
      const v = Object.values(secs).sort((x, y) => x - y); const stats = window.ANNALS.stats()
      return {raf_frames: a.length, fps_median: v.length ? v[Math.floor(v.length / 2)] : null, stats_fps: stats.fps, calls: stats.calls, tris: stats.tris}
    })
    let step = 0; for (const t of logs) { if (/pixelRatio/.test(t)) step = Math.max(step, 1); if (/terrain shadows off/.test(t)) step = Math.max(step, 2); if (/shadows off/.test(t) && !/terrain/.test(t)) step = Math.max(step, 3) }
    return {...r, degradeStep: step, seconds: o.realSeconds, cpu: o.cpu}
  } finally { sink.real_clock = errorsOf(P); await P.close() }
}

// ---------------------------------------------------------------- repo-level checks (no browser)
const P_RE = /Math[.]random|Date[.]now|new Date[(][)]|performance[.]now/g
const W_RE = /Math[.]random|Date[.]now|new Date[(]|Date[(]|Date[.]parse|performance[.]now|Intl[.]DateTimeFormat|crypto[.]getRandomValues|requestIdleCallback/g
function clockTokens(text) {
  const out = {}
  for (const [k, re] of [['P', P_RE], ['W', W_RE]]) {
    const lines = text.split('\n'); let occ = 0, ln = 0; const multi = []
    for (const l of lines) { const m = l.match(re); if (m) { occ += m.length; ln++; const t = {}; for (const x of m) t[x] = (t[x] || 0) + 1; const tl = l.trim(); multi.push({line: tl.slice(0, 160), sha: sha(l).slice(0, 12), tokens: t, ...(tl.length >= 160 ? {tsha: sha(tl).slice(0, 12)} : {})}) } }   // tsha only where the text is cut, so a B0 without long lines stays comparable
    multi.sort((a, b) => a.sha < b.sha ? -1 : 1)
    out[k] = {occurrences: occ, lines: ln, multiset: multi}
  }
  return out
}
function braceRange(text, anchor) {   // anchor to its matching "});", braces matched from the first "{" after it (street-1-research keydown_sha)
  const i = text.indexOf(anchor); if (i < 0) return null
  let j = text.indexOf('{', i), d = 0
  for (; j < text.length; j++) { if (text[j] === '{') d++; else if (text[j] === '}') { d--; if (d === 0) break } }
  const e = text.indexOf(');', j); return text.slice(i, e < 0 ? j + 1 : e + 2)
}
function fnSource(text, name) {
  const i = text.indexOf('function ' + name + '('); if (i < 0) return null
  let j = text.indexOf('{', i), d = 0
  for (; j < text.length; j++) { if (text[j] === '{') d++; else if (text[j] === '}') { d--; if (d === 0) break } }
  return text.slice(i, j + 1)
}
function readAnchors(file) {
  const t = rd(file), i = t.indexOf('const ANCHORS = ['); if (i < 0) return null
  const j = t.indexOf('\n]', i); return new Function('return ' + t.slice(i + 'const ANCHORS = '.length, j + 2))()
}
function repoChecks() {
  const R = {}, files = {index: 'index.html', atlas: 'maps-site/index.html'}
  const txt = {index: rd(files.index), atlas: rd(files.atlas)}
  R.sha = {index: sha(txt.index), atlas: sha(txt.atlas), server: ex('server.js') ? sha(rd('server.js')) : null}
  const re = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g
  R.syntax = {}
  for (const k of Object.keys(files)) { let m, n = 0, err = null; re.lastIndex = 0; while ((m = re.exec(txt[k]))) { n++; try { new Function(m[1]) } catch (e) { err = 'block ' + n + ': ' + e.message; break } } R.syntax[k] = err || 'OK ' + n }
  R.clock_tokens = {index: clockTokens(txt.index), atlas: clockTokens(txt.atlas)}
  R.keydown = {sha: (() => { const r = braceRange(txt.index, "window.addEventListener('keydown'"); return r ? sha(r) : null })(), lines: (() => { const r = braceRange(txt.index, "window.addEventListener('keydown'"); return r ? r.split('\n').length : null })()}
  R.camera_near = {literal: txt.index.includes('camera.near = clamp(R*0.02, 0.5, 50)'), sha: sha((txt.index.split('\n').find(l => l.includes('camera.near = clamp(')) || '').trim()).slice(0, 12)}
  R.ladder = {fpsAvg_degradeStep: txt.index.includes('let fpsAvg = 60, degradeStep'), wantShadow: txt.index.includes('const wantShadow = R < 1650 && degradeStep < 3 && shadowsOn;'),
    steps: [1, 2, 3].map(n => new RegExp('degradeStep = ' + n + '\\b').test(txt.index))}
  R.markers = {FILIGREE: (txt.index.match(/\/\* FILIGREE \*\//g) || []).length + (txt.atlas.match(/\/\* FILIGREE \*\//g) || []).length, STREET: (txt.index.match(/\/\* STREET \*\//g) || []).length + (txt.atlas.match(/\/\* STREET \*\//g) || []).length}
  R.tithe_lines = txt.atlas.split('\n').filter(l => /tithe/i.test(l)).length
  R.atlas_fn_sha = {}
  for (const n of ['xmur3', 'mulberry32', 'genCityCanvas', 'washMake', 'sampleCityMask']) { const s = fnSource(txt.atlas, n); R.atlas_fn_sha[n] = s ? sha(s) : null }
  R.createPane = (txt.atlas.match(/createPane\(/g) || []).length
  // anchors: every flag-1 literal of the eight scripts, read at run time
  R.anchors = {}
  const wf = '.claude/workflows'
  let missing = []
  for (const f of ex(wf) ? fs.readdirSync(path.join(REPO, wf)).filter(x => /^(filigree|street)-\d-.*\.js$/.test(x)).sort() : []) {
    let list = null; try { list = readAnchors(wf + '/' + f) } catch (e) { R.anchors[f] = {error: String(e.message).slice(0, 80)}; continue }
    if (!list) { R.anchors[f] = {error: 'no ANCHORS'}; continue }
    const flag1 = list.filter(a => a[2] === 1), miss = flag1.filter(a => !ex(a[0]) || !rd(a[0]).includes(a[1])).map(a => a[0] + ' :: ' + a[1])
    R.anchors[f] = {flag1: flag1.length, found: flag1.length - miss.length, missing: miss}
    missing = missing.concat(miss)
  }
  R.anchors_missing = [...new Set(missing)].sort()
  R.scripts_read = Object.keys(R.anchors).length
  try {
    const s1 = rd(wf + '/street-1-research.js'), m = s1.match(/^const STATS_KEYS = (\[[^\]]*\])/m)
    R.stats_keys_expected = m ? new Function('return ' + m[1])() : null
  } catch (e) { R.stats_keys_expected = null }
  try { const s = rd(wf + '/filigree-1-research.js').match(/^const VOCAB = (\/.*\/[a-z]*)$/m); R.vocab = s ? s[1] : null } catch (e) { R.vocab = null }
  R.pipeline_sha = {}
  if (ex(wf)) for (const f of fs.readdirSync(path.join(REPO, wf)).filter(x => x.endsWith('.js')).sort()) R.pipeline_sha[wf + '/' + f] = sha(rd(wf + '/' + f))
  if (ex('tools/street-drift.js')) {
    R.pipeline_sha['tools/street-drift.js'] = sha(rd('tools/street-drift.js'))
    const r = cp.spawnSync(process.execPath, ['tools/street-drift.js'], {cwd: REPO, encoding: 'utf8'}); R.street_drift_exit = r.status
  } else R.street_drift_exit = null
  return R
}

// ---------------------------------------------------------------- the accept file (metrics.md section 8)
const OPS = ['==', '!=', '<', '<=', '>', '>=', 'between', 'within', 'deep-equals', 'absent']
const GATE_PROFILES = {UG2: ['iphone13', 'pixel7', 'desktop', 'desktop2x'], UG3: ['iphone13', 'pixel7', 'landscape', 'desktop', 'desktop2x']}   // README/plan: UG3 on all five profiles; UG2 on the four gated ones
const REQUIRED_SEEDS = ['epeshu', 'tamar1374']   // UG3 fingerprints both canon seeds on every profile; no declaration or --seeds override removes one
const ALL_GATES = ['UG1', 'UG2', 'UG3', 'UG4', 'UG5', 'UG6', 'UG7', 'UG8', 'UG9', 'UG10', 'UG11']
function lintAccept(a) {
  const e = []
  if (!isObj(a)) return ['not an object']
  if (typeof a.unit !== 'string' || !a.unit) e.push('unit: string required')
  if (!Array.isArray(a.profiles) || !a.profiles.length) e.push('profiles: non-empty array required'); else for (const p of a.profiles) if (!PROFILES[p] && p !== 'phone') e.push('profiles: unknown profile ' + JSON.stringify(p))
  if (a.clock !== undefined && !['virtual', 'real'].includes(a.clock)) e.push('clock: virtual or real')
  if (!Array.isArray(a.gates)) e.push('gates: array required'); else for (const g of a.gates) if (!ALL_GATES.includes(g)) e.push('gates: unknown gate ' + JSON.stringify(g))
  if (Array.isArray(a.profiles) && Array.isArray(a.gates)) for (const g of a.gates) {
    const miss = (GATE_PROFILES[g] || []).filter(p => !a.profiles.includes(p))
    if (miss.length) e.push('profiles: ' + g + ' is scored on ' + GATE_PROFILES[g].join(', ') + '; missing ' + miss.join(', '))
  }
  const waive = isObj(a.waive) ? a.waive : {}
  if (a.waive !== undefined && !isObj(a.waive)) e.push('waive: object {UGn: reason}')
  if (Array.isArray(a.gates)) for (const g of ALL_GATES) if (!a.gates.includes(g) && !(typeof waive[g] === 'string' && waive[g].trim().length >= 8)) e.push('gates: ' + g + ' is neither listed nor waived with a reason')
  if (a.declared_change_keys !== undefined) {
    if (!Array.isArray(a.declared_change_keys) || a.declared_change_keys.some(k => typeof k !== 'string')) e.push('declared_change_keys: array of strings')
    else for (const k of a.declared_change_keys) {
      const sg = k.split('.')   // a declared key names a concrete surface.profile.metric; a '*' may stand only for a whole middle segment
      if (sg.length < 3 || sg.some(x => x === '') || sg.some(x => x.includes('*') && x !== '*') || sg[0] === '*' || sg[1] === '*' || sg[sg.length - 1] === '*') e.push('declared_change_keys: ' + JSON.stringify(k) + ' is too broad (surface.profile.metric at least; no * in the surface, profile or last segment)')
    }
  }
  if (a.declared_clock_lines !== undefined && (!Array.isArray(a.declared_clock_lines) || a.declared_clock_lines.some(l => typeof l !== 'string' || l.trim().length < 12))) e.push('declared_clock_lines: strings of at least 12 characters (a line of code)')
  if (a.mask !== undefined) {
    if (!Array.isArray(a.mask)) e.push('mask: array'); else a.mask.forEach((m, i) => {
      if (!isObj(m) || !Array.isArray(m.rect) || m.rect.length !== 4 || m.rect.some(v => typeof v !== 'number') || typeof m.profile !== 'string') return e.push('mask[' + i + ']: {profile, rect:[x,y,w,h], why}')
      if (typeof m.why !== 'string' || !m.why.trim()) e.push('mask[' + i + ']: why required')
      const pr = PROFILES[m.profile]; if (pr && m.rect[2] * m.rect[3] > 0.35 * pr.w * pr.h) e.push('mask[' + i + ']: covers more than 35% of the viewport')
    })
  }
  if (a.shot_views !== undefined && (!Array.isArray(a.shot_views) || a.shot_views.some(v => typeof v !== 'string' || !v))) e.push('shot_views: array of view names (UG8 diffs these beside every view the baseline holds)')
  if (a.strings !== undefined && (!Array.isArray(a.strings) || a.strings.some(s => typeof s !== 'string'))) e.push('strings: array of strings')
  if (!Array.isArray(a.checks)) e.push('checks: array required')
  else a.checks.forEach((c, i) => {
    const w = 'checks[' + i + ']'
    if (!isObj(c)) return e.push(w + ': object')
    if (typeof c.key !== 'string' || !c.key) e.push(w + ': key string required')
    if (!OPS.includes(c.op)) e.push(w + ': unknown op ' + JSON.stringify(c.op))
    else {
      if (c.op === 'absent') { if (c.value !== undefined) e.push(w + ': absent takes no value') }
      else if (c.op === 'deep-equals') { if (c.value === undefined && !c.ref) e.push(w + ': deep-equals needs value or ref') }
      else if (c.op === 'between') { if (!Array.isArray(c.value) || c.value.length !== 2 || c.value.some(v => typeof v !== 'number')) e.push(w + ': between needs value [lo,hi]') }
      else if (c.value === undefined && !c.ref) e.push(w + ': value or ref required')
      if (c.op === 'within' && typeof c.tol !== 'number') e.push(w + ': within needs tol (a fraction)')
      if (['<', '<=', '>', '>=', 'within'].includes(c.op) && c.value !== undefined && typeof c.value !== 'number') e.push(w + ': ' + c.op + ' needs a number value')
    }
    if (c.ref !== undefined && typeof c.ref !== 'string') e.push(w + ': ref string')
    if (c.except !== undefined && !Array.isArray(c.except)) e.push(w + ': except array')
  })
  return e
}
const TIMING_RE = /(^|\.)(timing|shots|meta|extras_timing)(\.|$)/
const getPath = (o, p) => { let cur = o; for (const k of p.split('.')) { if (cur == null) return undefined; cur = cur[k] } return cur }
const deepEq = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b))
function canon(v) { if (Array.isArray(v)) return v.map(canon); if (isObj(v)) return Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])); return v }
function strip(v, declared, pre) {   // drop timing, shots, meta and the declared keys (a declared key covers everything under it)
  if (Array.isArray(v)) return v.map((x, i) => strip(x, declared, pre + '.' + i))
  if (!isObj(v)) return v
  const o = {}
  for (const k of Object.keys(v)) {
    const p = pre ? pre + '.' + k : k
    if (k === 'timing' || k === 'shots' || k === 'meta' || k === 'reach_vs_controls' || k === 'extra_errors') continue
    if (declared.some(d => globMatch(d, p))) continue
    o[k] = strip(v[k], declared, p)
  }
  return o
}
function globMatch(pat, p) { const a = pat.split('.'), b = p.split('.'); if (b.length < a.length) return false; return a.every((s, i) => s === '*' || s === b[i]) }
function flatDiff(a, b, pre, out) {
  if (isObj(a) && isObj(b)) { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) flatDiff(a[k], b[k], pre ? pre + '.' + k : k, out) }
  else if (!deepEq(a, b)) out.push({key: pre, a, b})
  return out
}
function resolveRefs(accept, opts) {
  const dir = 'docs/mobile', refs = {B0: dir + '/baseline.json', R1: dir + '/captures/R1.json', final: dir + '/captures/final.json'}
  refs[accept.unit] = dir + '/captures/' + accept.unit + '.json'
  for (const r of opts.refs || []) { const i = r.indexOf('='); refs[r.slice(0, i)] = r.slice(i + 1) }
  return n => { const p = refs[n] || (dir + '/captures/' + n + '.json'); if (!ex(p)) return null; return JSON.parse(rd(p)) }
}
function shotDiffFor(cap, ref, surface, profile, masks, view, required) {   // every view the reference holds, the caller requires or the capture holds is diffed; a view absent on either side fails
  const a = getPath(cap, surface + '.' + profile + '.shots'), b = getPath(ref, surface + '.' + profile + '.shots')
  if (!a || !b) return {error: 'no shots for ' + surface + '.' + profile}
  let worst = 0; const per = {}
  const views = view ? [view] : [...new Set([...Object.keys(b), ...(required || []), ...Object.keys(a)])]
  for (const v of views) {
    if (!a[v]) { per[v] = 'missing from the capture (required by the ' + (b[v] ? 'reference' : v in b ? 'reference, which holds no shot either: recapture both' : 'accept file') + ')'; worst = Math.max(worst, 1); continue }
    if (!b[v]) { per[v] = 'missing from the reference'; worst = Math.max(worst, 1); continue }
    try {
      const full = s => s.scale === undefined || s.scale === 1 ? s.path : s.full_path   // never diff a reduced copy: averaging blocks hides hairline changes
      const fa = full(a[v]), fb = full(b[v])
      if (!fa || !fb) { per[v] = 'reduced shot without a full-resolution file (' + (fa ? 'reference' : 'capture') + '): recapture'; worst = Math.max(worst, 1); continue }
      const stale = [[a[v], 'capture'], [b[v], 'reference']].map(([r, who]) => {   // the files sit at fixed names in a shared dir: the diff reads only bytes the record vouches for
        const files = [[r.path, r.sha]].concat(r.scale === undefined || r.scale === 1 ? [] : [[r.full_path, r.full_sha]])
        return files.some(([p, h]) => !h || !ex(path.resolve(REPO, p)) || sha(fs.readFileSync(path.resolve(REPO, p))) !== h) ? who : null
      }).filter(Boolean)
      if (stale.length) { per[v] = stale.join(' and ') + ' shot changed since capture (or no recorded sha): recapture'; worst = Math.max(worst, 1); continue }
      const d = imageDiff(fs.readFileSync(path.resolve(REPO, fa)), fs.readFileSync(path.resolve(REPO, fb)), masks.filter(m => m.profile === profile && (!m.view || m.view === v)).map(m => m.rect), 1)
      per[v] = d.size_mismatch ? 'size ' + JSON.stringify(d.size_mismatch) : +d.diff.toFixed(5); worst = Math.max(worst, d.diff)
    } catch (e) { per[v] = 'error ' + e.message.slice(0, 50); worst = 1 }
  }
  return {diff: worst, per}
}
function evalCheck(c, cap, refOf, accept, notes) {
  const m = c.key.match(/^(atlas|sim)\.([A-Za-z0-9_]+)\.(shot_diff|metrics)(?:\.(.+))?$/)
  let got
  const declared = accept.declared_change_keys || []
  if (m && m[3] === 'shot_diff') {
    const ref = refOf(c.ref || 'B0'); if (!ref) return {ok: false, got: 'reference ' + (c.ref || 'B0') + ' not found'}
    const d = shotDiffFor(cap, ref, m[1], m[2], accept.mask || [], m[4]); got = d.diff == null ? d.error : d.diff; if (d.per) notes[c.key] = d.per
  } else if (m && m[3] === 'metrics') {
    const ref = refOf(c.ref || 'B0'); if (!ref) return {ok: false, got: 'reference ' + (c.ref || 'B0') + ' not found'}
    const ex2 = (c.except || []).flatMap(x => x === 'declared_change_keys' ? declared : [x])
    const a = strip(getPath(cap, m[1] + '.' + m[2]), ex2, m[1] + '.' + m[2]), b = strip(getPath(ref, m[1] + '.' + m[2]), ex2, m[1] + '.' + m[2])
    const diffs = flatDiff(a, b, '', []); got = diffs.length ? diffs.slice(0, 5).map(d => d.key + ': ' + JSON.stringify(d.a) + ' vs ' + JSON.stringify(d.b)).join('; ') : 'equal'
    return {ok: c.op === '==' || c.op === 'deep-equals' ? diffs.length === 0 : c.op === '!=' ? diffs.length > 0 : false, got, expected: 'equal to ' + (c.ref || 'B0') + ' except declared'}
  } else got = getPath(cap, c.key)
  let want = c.value
  if (want === undefined && c.ref) { const ref = refOf(c.ref); if (!ref) return {ok: false, got, expected: 'reference ' + c.ref + ' not found'}; want = getPath(ref, c.key) }
  const num = v => typeof v === 'number' && isFinite(v)
  let ok = false
  if (c.op !== 'absent' && got === undefined) return {ok: false, got: 'key absent from the capture', expected: want}
  if (c.op !== 'absent' && want === undefined) return {ok: false, got, expected: 'key absent from the reference'}
  if (SHEET_KEY_RE.test(c.key) && !num(got)) return {ok: false, got: got === undefined ? 'key absent from the capture' : got, expected: 'a measured sheet cover (a check on a peek/half key never passes on null, no-sheet or unmeasured)'}
  switch (c.op) {
    case '==': ok = deepEq(got, want); break
    case '!=': ok = !deepEq(got, want); break
    case 'deep-equals': ok = deepEq(got, want); break
    case '<': ok = num(got) && got < want; break
    case '<=': ok = num(got) && got <= want; break
    case '>': ok = num(got) && got > want; break
    case '>=': ok = num(got) && got >= want; break
    case 'between': ok = num(got) && got >= want[0] && got <= want[1]; break
    case 'within': ok = num(got) && num(want) && Math.abs(got - want) <= c.tol * Math.abs(want); break
    case 'absent': ok = got === undefined || got === null; break
  }
  return {ok, got, expected: c.op === 'absent' ? 'absent' : want}
}
const baseNameOf = accept => accept.baseline || (ex('docs/mobile/captures/R1.json') ? 'R1' : 'B0')
function gateResults(accept, cap, refOf, notes) {
  const fails = [], B = refOf(baseNameOf(accept)), declared = accept.declared_change_keys || []
  const add = (key, expected, got) => fails.push({key, op: 'gate', expected, got})
  const surfaces = ['atlas', 'sim'].filter(s => cap[s])
  for (const s of ['atlas', 'sim']) if (!cap[s] && (accept.gates || []).length) {   // a surface the capture skipped is covered only while its file is the baseline's
    const k = s === 'atlas' ? 'atlas_sha' : 'index_sha'
    if (B && B.meta && cap.meta && B.meta[k] && B.meta[k] === cap.meta[k]) notes['surface.' + s] = 'not captured: ' + (s === 'atlas' ? 'maps-site/index.html' : 'index.html') + ' equals the baseline'
    else add('capture.' + s, 'captured, or its file equal to the baseline', 'not captured')
  }
  const profs = s => Object.keys(cap[s] || {}).filter(k => isObj(cap[s][k]))
  for (const g of accept.gates || []) {
    const rep = cap.repo || {}
    if (g === 'UG1') { for (const k of ['index', 'atlas']) if (!/^OK/.test((rep.syntax || {})[k] || '')) add('UG1.syntax.' + k, 'OK', (rep.syntax || {})[k] || 'no repo block') }
    for (const s of surfaces) for (const p of GATE_PROFILES[g] || []) if (!isObj(cap[s][p])) add(g + '.' + s + '.' + p, 'captured', 'missing')   // a gate is never scored on fewer profiles than it names
    if (g === 'UG2') {
      for (const s of surfaces) for (const p of profs(s)) {
        const E = (s === 'atlas' ? [['main', cap[s][p].errors]] : Object.entries(cap[s][p].seeds || {}).map(([k, x]) => [k, x.errors])).concat(Object.entries(cap[s][p].extra_errors || {}))   // the main pages, then each extra's own page
        if (cap[s][p].error) add('UG2.' + s + '.' + p, 'no capture error', cap[s][p].error.slice(0, 80))
        for (const [k, e] of E) if (!e || e.unexplained !== 0) add('UG2.' + s + '.' + p + '.errors.' + k + '.unexplained', 0, e ? e.unexplained + ' ' + JSON.stringify(e.messages).slice(0, 100) : 'missing')
      }
    }
    if (g === 'UG3') {
      if (!B) add('UG3.baseline', 'B0 present', 'missing')
      else {
        const simProfs = cap.sim ? [...new Set([...GATE_PROFILES.UG3, ...profs('sim')])].filter(p => isObj(cap.sim[p])) : []   // a missing profile already failed above
        for (const p of simProfs) for (const seed of [...new Set([...REQUIRED_SEEDS, ...Object.keys(getPath(B, 'sim.' + p + '.seeds') || {}), ...Object.keys(cap.sim[p].seeds || {})])]) {   // both canon seeds always, whatever is declared
          const a = (cap.sim[p].seeds || {})[seed], b = getPath(B, 'sim.' + p + '.seeds.' + seed)
          if (!isObj(a) || !a.fingerprint) { add('UG3.sim.' + p + '.' + seed, 'captured (UG3 always needs ' + REQUIRED_SEEDS.join(' and ') + ')', a && a.error ? 'error ' + String(a.error).slice(0, 60) : 'missing'); continue }
          if (!b) { add('UG3.sim.' + p + '.' + seed + '.fingerprint', 'present in B0', 'B0 has none'); continue }
          if (a.fingerprint !== b.fingerprint) add('UG3.sim.' + p + '.' + seed + '.fingerprint', b.fingerprint, a.fingerprint)
          if (!deepEq(a.rng_next, b.rng_next)) add('UG3.sim.' + p + '.' + seed + '.rng_next', b.rng_next, a.rng_next)
        }
        const R0 = B.repo || {}
        const lineKey = x => x.tsha || (x.line.length < 160 ? sha(x.line).slice(0, 12) : null)   // sha of the whole trimmed line; a cut line without tsha matches nothing
        const budget = {}; for (const l of accept.declared_clock_lines || []) { const k = sha(l.trim()).slice(0, 12); budget[k] = budget[k] || {n: 0, line: l.trim()}; budget[k].n++ }   // each listing covers one changed copy
        const seenKeys = new Set(['index', 'atlas'].flatMap(k => [rep, R0].flatMap(r => ['P', 'W'].flatMap(pw => ((((r.clock_tokens || {})[k] || {})[pw] || {}).multiset || []).map(lineKey)))))
        for (const k of Object.keys(budget)) if (!seenKeys.has(k)) add('UG3.declared_clock_lines', 'a whole line present in B0 or the capture', budget[k].line.slice(0, 160))
        const files = ['index', 'atlas'].filter(k => { const ok = (rep.clock_tokens || {})[k] && (R0.clock_tokens || {})[k]; if (!ok) add('UG3.clock_tokens.' + k, 'present', 'missing'); return ok })
        const occ = ms => ms.reduce((n, x) => n + Object.values(x.tokens).reduce((a, b) => a + b, 0), 0), proj = ms => ms.map(x => ({line: x.line, sha: x.sha, tokens: x.tokens}))
        for (const pw of ['P', 'W']) {
          const drop = {}   // file -> {capture: Set(index), b0: Set(index)}: the changed copies of a declared line, removed only within its listing count
          for (const k of files) drop[k] = {c: new Set(), b: new Set()}
          for (const [key, {n, line}] of Object.entries(budget)) {
            let cost = 0; const take = []
            for (const k of files) {
              const c1 = rep.clock_tokens[k][pw].multiset, c0 = R0.clock_tokens[k][pw].multiset
              const i1 = c1.map((x, i) => i).filter(i => lineKey(c1[i]) === key), i0 = c0.map((x, i) => i).filter(i => lineKey(c0[i]) === key)
              const pool = {}; for (const i of i0) (pool[c0[i].sha] = pool[c0[i].sha] || []).push(i)
              const s1 = [], m0 = new Set(); for (const i of i1) { const q = pool[c1[i].sha]; if (q && q.length) m0.add(q.shift()); else s1.push(i) }   // copies paired by raw-line sha are unchanged
              const s0 = i0.filter(i => !m0.has(i))
              cost += Math.max(s1.length, s0.length); take.push([k, s1, s0])
            }
            if (cost > n) { add('UG3.declared_clock_lines.' + pw, '<= ' + n + ' changed cop' + (n === 1 ? 'y' : 'ies') + ' of ' + JSON.stringify(line.slice(0, 80)), cost); continue }
            for (const [k, s1, s0] of take) { for (const i of s1) drop[k].c.add(i); for (const i of s0) drop[k].b.add(i) }
          }
          for (const k of files) {
            const a = rep.clock_tokens[k][pw].multiset.filter((x, i) => !drop[k].c.has(i)), b = R0.clock_tokens[k][pw].multiset.filter((x, i) => !drop[k].b.has(i))
            const dn = drop[k].c.size + drop[k].b.size   // the count after removing only the declared changed copies equals B0's; with nothing declared this is the plain 37
            if (occ(a) !== occ(b)) add('UG3.clock_tokens.' + k + '.' + pw, occ(b) + (dn ? ' after the declared copies' : ''), occ(a))
            if (!deepEq(proj(a), proj(b))) add('UG3.clock_tokens.' + k + '.' + pw + '.multiset', 'equal to B0', 'differs')
          }
        }
        for (const n of Object.keys(R0.atlas_fn_sha || {})) if (!rep.atlas_fn_sha || rep.atlas_fn_sha[n] !== R0.atlas_fn_sha[n]) add('UG3.atlas_fn_sha.' + n, 'unchanged', 'changed')
      }
      // equal across profiles within a pixel-ratio class: at devicePixelRatio 1 the canvas text is hinted differently, so the 1x desktop is its own class (B0 finding, docs/mobile/README.md Instrument)
      for (const grp of [true, false]) {
        const ps = profs('atlas').filter(p => ((cap.atlas[p].env || {}).dpr > 1) === grp), shas = ps.map(p => cap.atlas[p].cityCanvasSha)
        if (ps.length && (shas.some(x => !x) || new Set(shas).size > 1)) add('UG3.atlas.cityCanvasSha', 'equal across ' + (grp ? 'dpr>1' : 'dpr 1') + ' profiles', JSON.stringify(ps.map(p => [p, (cap.atlas[p].cityCanvasSha || 'none').slice(0, 8)])))
      }
      if (B) for (const p of profs('atlas')) { const b = getPath(B, 'atlas.' + p + '.cityCanvasSha'); if (b && b !== cap.atlas[p].cityCanvasSha) add('UG3.atlas.' + p + '.cityCanvasSha', b, cap.atlas[p].cityCanvasSha) }
    }
    if (g === 'UG4') {
      if ((rep.anchors_missing || []).length) add('UG4.anchors_missing', [], rep.anchors_missing.slice(0, 5))
      if (!rep.scripts_read) add('UG4.scripts_read', '> 0', 0)
      if (rep.markers && (rep.markers.FILIGREE || rep.markers.STREET)) add('UG4.markers', {FILIGREE: 0, STREET: 0}, rep.markers)
      if (B && B.repo && rep.tithe_lines !== B.repo.tithe_lines) add('UG4.tithe_lines', B.repo.tithe_lines, rep.tithe_lines)
      if (rep.street_drift_exit !== 0) add('UG4.street_drift_exit', 0, rep.street_drift_exit)
    }
    if (g === 'UG5') {
      const want = rep.stats_keys_expected
      if (!want) add('UG5.stats_keys_expected', 'read from street-1-research.js', 'missing')
      for (const p of profs('sim')) if (!deepEq(cap.sim[p].stats_keys, want)) add('UG5.sim.' + p + '.stats_keys', want, cap.sim[p].stats_keys)
    }
    if (g === 'UG6') {
      if (!B || !B.repo) add('UG6.baseline', 'B0 present', 'missing')
      else if (rep.keydown.sha !== B.repo.keydown.sha) add('UG6.keydown.sha', B.repo.keydown.sha, rep.keydown.sha)
      if (!rep.camera_near || !rep.camera_near.literal) add('UG6.camera_near', 'camera.near = clamp(R*0.02, 0.5, 50)', 'absent')
      if (!rep.ladder || !rep.ladder.fpsAvg_degradeStep) add('UG6.ladder.fpsAvg', 'let fpsAvg = 60, degradeStep', 'absent')
      if (!rep.ladder || !rep.ladder.wantShadow) add('UG6.ladder.wantShadow', 'const wantShadow = R < 1650 && degradeStep < 3 && shadowsOn;', 'absent')
      if (!rep.ladder || !rep.ladder.steps.every(Boolean)) add('UG6.ladder.steps', [true, true, true], rep.ladder && rep.ladder.steps)
    }
    if (g === 'UG7') {
      if (!B) add('UG7.baseline', 'B0 present', 'missing')
      else for (const p of profs('atlas')) { const b = getPath(B, 'atlas.' + p + '.panes'); if (b && !deepEq(b, cap.atlas[p].panes)) add('UG7.atlas.' + p + '.panes', b.length + ' panes', cap.atlas[p].panes && cap.atlas[p].panes.length + ' panes') }
      if (B && B.repo && rep.createPane !== B.repo.createPane) add('UG7.createPane', B.repo.createPane, rep.createPane)
    }
    if (g === 'UG8') {
      if (!B) add('UG8.baseline', 'B0 present', 'missing')
      else for (const s of surfaces) for (const p of ['desktop', 'desktop2x']) {
        if (!cap[s][p]) { add('UG8.' + s + '.' + p, 'captured', 'missing'); continue }
        const a = strip(cap[s][p], declared, s + '.' + p), b = strip(getPath(B, s + '.' + p), declared, s + '.' + p)
        if (!b) { add('UG8.' + s + '.' + p + '.metrics', 'B0 has ' + p, 'missing'); continue }
        const d = flatDiff(a, b, '', [])
        if (d.length) add('UG8.' + s + '.' + p + '.metrics', 'equal to B0 except declared', d.slice(0, 4).map(x => x.key + ' ' + JSON.stringify(x.a) + ' vs ' + JSON.stringify(x.b)).join('; '))
        const reqViews = (accept.checks || []).map(c => (c.key || '').match(new RegExp('^' + s + '\\.' + p + '\\.shot_diff\\.(.+)$'))).filter(Boolean).map(m => m[1]).concat(accept.shot_views || [])
        const sd = shotDiffFor(cap, B, s, p, accept.mask || [], null, reqViews)
        if (sd.error) add('UG8.' + s + '.' + p + '.shot_diff', '<= 0.005', sd.error); else if (sd.diff > 0.005) add('UG8.' + s + '.' + p + '.shot_diff', '<= 0.005', sd.diff + ' ' + JSON.stringify(sd.per))
      }
    }
    if (g === 'UG9') {
      let vocab = null; try { vocab = new Function('return ' + rep.vocab)() } catch (e) { /* none */ }
      const jargon = /\b(tap|click|swipe|pinch|drawer|modal|menu|toggle|dismiss|app|download|install|offline mode|dark mode|theme|settings)\b/i
      const readme = ex('docs/mobile/README.md') ? rd('docs/mobile/README.md') : ''
      if (!vocab) add('UG9.VOCAB', 'read from filigree-1-research.js', 'missing')
      for (const s of accept.strings || []) {
        if (vocab && vocab.test(s)) add('UG9.string', 'no VOCAB hit', s)
        if (jargon.test(s) && !/Lektān/.test(s)) add('UG9.string.jargon', 'table words only', s)
        if (!readme.includes(s)) add('UG9.string.listed', 'listed in docs/mobile/README.md', s)
      }
      notes.UG9 = 'voice read (sonnet/low) is outside the tool; VOCAB, jargon and the README listing are scored here'
    }
    if (g === 'UG10') {
      const grow = accept.declared_first_view_growth || {bytes: 0, requests: 0}
      for (const s of surfaces) { const a = getPath(cap, s + '.iphone13.' + (s === 'atlas' ? 'first_load' : 'first_load')), b = B && getPath(B, s + '.iphone13.first_load')
        if (!a || !b) { add('UG10.' + s + '.iphone13.first_load', 'captured on iphone13 and in B0', a ? 'B0 missing' : 'not captured'); continue }
        if (a.bytes > b.bytes + (grow.bytes || 0)) add('UG10.' + s + '.iphone13.bytes', '<= ' + (b.bytes + (grow.bytes || 0)), a.bytes)
        if (a.requests > b.requests + (grow.requests || 0)) add('UG10.' + s + '.iphone13.requests', '<= ' + (b.requests + (grow.requests || 0)), a.requests) }
    }
    if (g === 'UG11') {
      if (!B || !B.repo) add('UG11.baseline', 'B0 present', 'missing')
      else for (const f of new Set([...Object.keys(B.repo.pipeline_sha || {}), ...Object.keys(rep.pipeline_sha || {})])) if ((B.repo.pipeline_sha || {})[f] !== (rep.pipeline_sha || {})[f]) add('UG11.' + f, (B.repo.pipeline_sha || {})[f], (rep.pipeline_sha || {})[f])
      if (accept.files_touched && accept.files_touched.some(f => /^\.claude\//.test(f))) add('UG11.files', 'no .claude/ path', 'present')
    }
  }
  return fails
}
function acceptScore(accept, cap, refOf, opts) {
  const errs = lintAccept(accept)
  if (errs.length) return {unit: accept.unit, pass: false, failing: errs.map(e => ({key: 'lint', op: 'lint', expected: 'valid accept file', got: e}))}
  const failing = [], notes = {}
  if (cap.meta && !opts.allowStale) {
    const cur = {index: sha(rd('index.html')), atlas: sha(rd('maps-site/index.html'))}
    if (cap.meta.index_sha !== cur.index || cap.meta.atlas_sha !== cur.atlas) failing.push({key: 'capture.stale', op: 'gate', expected: 'a capture of the current tree', got: 'index/atlas sha differ from the capture'})
  }
  for (const p of accept.profiles) for (const s of ['atlas', 'sim']) if (cap[s] && !cap[s][p]) failing.push({key: s + '.' + p, op: 'gate', expected: 'captured', got: 'missing'})
  for (const p of accept.profiles) for (const s of ['atlas', 'sim']) if (cap[s] && cap[s][p] && cap[s][p].error) failing.push({key: s + '.' + p + '.error', op: 'gate', expected: 'a clean capture', got: cap[s][p].error.slice(0, 120)})
  for (const c of accept.checks) {
    const r = evalCheck(c, cap, refOf, accept, notes)
    if (!r.ok) failing.push({key: c.key, op: c.op, expected: r.expected, got: r.got})
  }
  failing.push(...gateResults(accept, cap, refOf, notes))
  // a key not listed in declared_change_keys must equal its B0/R1 value (metrics.md section 8)
  const baseName = baseNameOf(accept), base = refOf(baseName)
  if (!base) failing.push({key: 'baseline.' + baseName, op: 'gate', expected: 'present', got: 'missing'})
  else for (const s of ['atlas', 'sim']) for (const p of accept.profiles) {
    if (!cap[s] || !cap[s][p]) continue
    const bp = getPath(base, s + '.' + p); if (!bp) { failing.push({key: s + '.' + p, op: 'unchanged', expected: baseName + ' has the profile', got: 'missing'}); continue }
    const d = flatDiff(strip(cap[s][p], accept.declared_change_keys || [], s + '.' + p), strip(bp, accept.declared_change_keys || [], s + '.' + p), s + '.' + p, [])
    for (const x of d.slice(0, 12)) failing.push({key: x.key, op: 'unchanged', expected: x.b, got: x.a})
    if (d.length > 12) failing.push({key: s + '.' + p, op: 'unchanged', expected: 'equal to ' + baseName, got: (d.length - 12) + ' more keys differ'})
  }
  return {unit: accept.unit, pass: failing.length === 0, failing, notes}
}

// ---------------------------------------------------------------- capture driver
function parseArgs(argv) {
  const o = {_: [], refs: [], flags: new Set()}
  const val = new Set(['--profiles', '--unit', '--out', '--controls', '--clock', '--cpu', '--throttle', '--hw-cores', '--device-memory', '--sw', '--port', '--url', '--server', '--cdn-dir', '--query', '--seeds', '--tap-n', '--phone', '--extras', '--accept', '--lint-accept', '--capture', '--ref', '--mutate-html', '--jobs', '--root', '--shots-dir', '--real-seconds', '--compare', '--baseline'])
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) { o._.push(a); continue }
    if (val.has(a)) { const v = argv[++i]; if (a === '--ref') o.refs.push(v); else o[a.slice(2)] = v; if (a === '--compare') o._cmp = [v, argv[++i]] } else o.flags.add(a.slice(2))
  }
  return o
}
function planOptions(a) {
  const profiles = {...PROFILES}
  if (a.phone) { const m = a.phone.match(/^(\d+)x(\d+)@([\d.]+)$/); if (!m) throw new Error('--phone WxH@D'); profiles.phone = {w: +m[1], h: +m[2], dpr: +m[3], touch: true, base: 'iPhone 13'} }
  const want = (a.profiles ? a.profiles.split(',') : a.phone && !a.profiles ? ['phone'] : DEFAULT_PROFILES)
  for (const p of want) if (!profiles[p]) throw new Error('unknown profile ' + p)
  const both = !a.flags.has('atlas') && !a.flags.has('sim')
  return {
    profiles, want, atlas: both || a.flags.has('atlas'), sim: both || a.flags.has('sim'), clock: a.clock || 'virtual',
    cpu: a.cpu ? +a.cpu : 1, throttle: a.throttle || null, hw: a['hw-cores'] ? +a['hw-cores'] : 8, mem: a['device-memory'] ? +a['device-memory'] : 8,
    sw: a.sw || 'block', saveData: a.flags.has('save-data'), query: a.query || '', seeds: (a.seeds || 'epeshu,tamar1374').split(','), tapN: a['tap-n'] ? +a['tap-n'] : 0,   // 0 = every interactive glyph at every view; N samples N per view and marks the fixture incomplete
    extras: (a.extras !== undefined ? a.extras : 'safe_area,keyboard,ctxloss').split(',').filter(Boolean), noShots: a.flags.has('no-shots'), nightLoaf: a.flags.has('night-loaf'),
    realClock: a.flags.has('real-clock'), mutateOnly: a.flags.has('mutate-only'), realSeconds: a['real-seconds'] ? +a['real-seconds'] : 8, mutate: a['mutate-html'] || null, jobs: a.jobs ? +a.jobs : 1,
    unit: a.unit || null, out: a.out || null, shotsDir: a['shots-dir'] || null, port: a.port ? +a.port : 0, url: a.url || null, server: a.server || 'static', cdnDir: a['cdn-dir'] || null, root: a.root ? path.resolve(a.root) : REPO
  }
}
function shotsDirName(o, meta) {   // a unit owns its dir; any other run (B0, R1, final, ad hoc) gets one per output and tree, never a shared one a later run overwrites
  if (o.unit) return o.unit
  return (o.out ? path.basename(o.out).replace(/\.json$/, '') : 'adhoc') + '-' + sha(meta.index_sha + meta.atlas_sha).slice(0, 12)
}
async function runCapture(o) {
  const t0 = Date.now()
  VERSION_HINT = '?v=mc' + (o.sw === 'allow' ? '&sw=1' : '')
  const pw = loadPlaywright(), env = {pw, cdn: resolveCdn(o.cdnDir)}
  env.server = o.url ? {origin: o.url.replace(/\/$/, ''), state: {}, close: async () => {}} : o.server === 'spawn' ? await spawnServer(o.root) : await startServer(o.root, o.port)
  env.browser = await launch(pw)
  const cap = {meta: {tool: 'mobile-capture', tool_version: TOOL_VERSION, tool_sha: sha(fs.readFileSync(__filename)), index_sha: sha(rd('index.html')), atlas_sha: sha(rd('maps-site/index.html')),
    unit: o.unit, profiles: o.want, clock: o.clock, pinned: {hardwareConcurrency: o.hw, deviceMemory: o.mem}, cpu: o.cpu, throttle: o.throttle, service_workers: o.sw === 'allow' ? 'allow (?sw=1)' : 'block',
    save_data: o.saveData, query: o.query || null, seeds: o.seeds, extras: o.extras, cdn_routed: !!env.cdn, server: o.url ? 'external' : o.server, browser: env.browser.version()}, repo: null}
  const oo = {...o, profiles: o.profiles, shotsDir: path.resolve(REPO, o.shotsDir || path.join('docs/mobile/shots', shotsDirName(o, cap.meta)))}
  try {
    cap.repo = repoChecks()
    if (o.atlas) cap.atlas = {}
    if (o.sim) cap.sim = {}
    const jobs = []
    for (const k of o.want) { if (o.atlas) jobs.push(['atlas', k]); if (o.sim) jobs.push(['sim', k]) }
    let next = 0
    const worker = async () => {
      while (next < jobs.length) {
        const [s, k] = jobs[next++], t1 = Date.now()
        log('capture', s, k)
        const r = await (s === 'atlas' ? captureAtlas : captureSim)(env, k, {...oo, profile: oo.profiles[k]})
        r.timing = r.timing || {}; r.timing.wall_ms = Date.now() - t1
        cap[s][k] = r
      }
    }
    await Promise.all(Array.from({length: Math.max(1, o.jobs)}, worker))
    for (const s of ['atlas', 'sim']) if (cap[s]) cap[s] = Object.fromEntries(Object.keys(cap[s]).sort((a, b) => o.want.indexOf(a) - o.want.indexOf(b)).map(k => [k, cap[s][k]]))
    cap.meta.timing = {wall_ms: Date.now() - t0}
  } finally { await env.browser.close(); await env.server.close() }
  return cap
}
function controlsFile(cap) {
  const out = {tool: 'mobile-capture', profile: 'desktop', viewport: '1366x768@1', note: 'ids are role:accessible-name; primary per metrics.md section 5; reach is taps on the profile the capture ran on', surfaces: {}}
  for (const s of ['atlas', 'sim']) { const d = cap[s] && cap[s].desktop; if (d && d.controls) out.surfaces[s] = d.controls.map(c => ({id: c.id, primary: !!c.primary, w: c.w, h: c.h, reach: c.reach})) }
  return out
}
function addReachVsControls(cap) {   // reach failures of each profile against the ids in docs/mobile/controls.json (A-U8: reach <= 2)
  if (!ex('docs/mobile/controls.json')) return
  const cf = JSON.parse(rd('docs/mobile/controls.json'))
  for (const s of ['atlas', 'sim']) for (const [k, r] of Object.entries(cap[s] || {})) {
    if (!r.reach || !cf.surfaces[s]) continue
    const ids = cf.surfaces[s].filter(c => !PROFILES[k] || PROFILES[k].touch || true).map(c => c.id)
    r.reach_vs_controls = {listed: ids.length, missing: ids.filter(id => r.reach[id] === undefined).length, over2: ids.filter(id => r.reach[id] !== undefined && r.reach[id] > 2).length,
      primary_missing: cf.surfaces[s].filter(c => c.primary && r.reach[c.id] === undefined).map(c => c.id)}
  }
}

// ---------------------------------------------------------------- compare (two runs agree on every non-timing key)
function compareCaptures(a, b) {
  const x = strip(a, [], ''), y = strip(b, [], '')
  const d = flatDiff(x, y, '', [])
  return d
}

// ---------------------------------------------------------------- self-test
async function selfTest() {
  const out = []; const ok = (n, v, d) => { out.push({n, ok: !!v, d: d || ''}); log((v ? 'ok   ' : 'FAIL ') + n + (d && !v ? ' :: ' + d : '')) }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mc-'))
  // PNG round trip and the one image diff
  const img = {w: 40, h: 30, data: Buffer.alloc(40 * 30 * 4)}; for (let i = 0; i < img.w * img.h; i++) { img.data[i * 4] = (i * 7) & 255; img.data[i * 4 + 1] = (i * 3) & 255; img.data[i * 4 + 2] = 90; img.data[i * 4 + 3] = 255 }
  const pa = pngEncode(img), back = pngDecode(pa); ok('png round trip', back.w === 40 && back.h === 30 && back.data.equals(img.data))
  const img2 = {...img, data: Buffer.from(img.data)}; for (let y = 0; y < 3; y++) for (let x = 0; x < 10; x++) img2.data[(y * 40 + x) * 4] = (img2.data[(y * 40 + x) * 4] + 100) & 255
  ok('diff: 30 of 1200 px differ', Math.abs(imageDiff(pa, pngEncode(img2)).diff - 30 / 1200) < 1e-9)
  ok('diff: mask covers the change', imageDiff(pa, pngEncode(img2), [[0, 0, 10, 3]]).diff === 0)
  const img3 = {...img, data: Buffer.from(img.data)}; img3.data[0] = (img3.data[0] + 8) & 255; ok('diff: delta 8 is not a difference', imageDiff(pa, pngEncode(img3)).diff === 0)
  img3.data[0] = (img3.data[0] + 1) & 255; ok('diff: delta 9 is', imageDiff(pa, pngEncode(img3)).diff > 0)
  // lint
  const WV = Object.fromEntries(ALL_GATES.map(g => [g, 'fixture without a tree']))
  const good = {unit: 'FX', profiles: ['desktop'], clock: 'virtual', gates: [], waive: WV, declared_change_keys: [], mask: [], checks: [{key: 'atlas.desktop.doc_scroll', op: '==', value: 664}, {key: 'atlas.desktop.share_visible', op: 'between', value: [0.3, 0.4]}]}
  ok('lint accepts a good file', lintAccept(good).length === 0, lintAccept(good).join('; '))
  const bad = JSON.parse(JSON.stringify(good)); bad.checks.push({key: 'atlas.desktop.x', op: 'approx', value: 1})
  ok('lint rejects an unknown op', lintAccept(bad).some(e => /unknown op "approx"/.test(e)), lintAccept(bad).join('; '))
  // accept: one passing check, one failing
  const cap = {meta: {}, atlas: {desktop: {doc_scroll: 768, share_visible: 0.97}}}
  const a1 = {unit: 'FX', profiles: ['desktop'], clock: 'virtual', gates: [], waive: WV, checks: [{key: 'atlas.desktop.doc_scroll', op: '==', value: 768}, {key: 'atlas.desktop.share_visible', op: 'between', value: [0.3, 0.4]}]}
  const self = () => cap
  const r1 = acceptScore(a1, cap, self, {allowStale: true})
  ok('accept: failing check named, pass false', !r1.pass && r1.failing.length === 1 && r1.failing[0].key === 'atlas.desktop.share_visible', JSON.stringify(r1.failing))
  const f = path.join(tmp, 'accept.json'), c = path.join(tmp, 'cap.json'); fs.writeFileSync(f, JSON.stringify(a1)); fs.writeFileSync(c, JSON.stringify(cap)); fs.writeFileSync(path.join(tmp, 'bad.json'), JSON.stringify(bad))
  const cli = cp.spawnSync(process.execPath, [__filename, '--accept', f, '--capture', c, '--ref', 'B0=' + c, '--allow-stale'], {encoding: 'utf8'})
  ok('cli --accept exits 1 and names the key', cli.status === 1 && /atlas\.desktop\.share_visible/.test(cli.stdout), 'status ' + cli.status + ' ' + cli.stdout.slice(0, 200))
  const cl2 = cp.spawnSync(process.execPath, [__filename, '--lint-accept', path.join(tmp, 'bad.json')], {encoding: 'utf8'})
  ok('cli --lint-accept rejects an unknown op (exit 1)', cl2.status === 1 && /approx/.test(cl2.stdout + cl2.stderr), 'status ' + cl2.status)
  a1.checks[1].value = [0.9, 1]; const r2 = acceptScore(a1, cap, self, {allowStale: true}); ok('accept: all pass -> pass true', r2.pass, JSON.stringify(r2.failing))
  const a2 = {...a1, checks: [{key: 'atlas.desktop.doc_scroll', op: 'deep-equals', ref: 'R1'}], declared_change_keys: []}
  const r3 = acceptScore(a2, cap, n => n === 'R1' ? {atlas: {desktop: {doc_scroll: 974}}} : cap, {allowStale: true}); ok('accept: ref compare fails on a changed key', !r3.pass && r3.failing.some(x => x.key === 'atlas.desktop.doc_scroll' && x.got === 768), JSON.stringify(r3.failing))
  const a3 = {unit: 'FX', profiles: ['desktop'], clock: 'virtual', gates: [], waive: WV, declared_change_keys: ['atlas.desktop.doc_scroll'], checks: [{key: 'atlas.desktop.metrics', op: 'deep-equals', ref: 'R1', except: ['declared_change_keys']}]}
  const ref4 = {atlas: {desktop: {doc_scroll: 974, share_visible: 0.97}}}
  const r4 = acceptScore(a3, cap, n => ref4, {allowStale: true}); ok('accept: declared key excluded from metrics equality and from the unchanged rule', r4.pass, JSON.stringify(r4.failing))
  const a4 = {...a3, declared_change_keys: []}; const r5 = acceptScore(a4, cap, n => ref4, {allowStale: true}); ok('accept: an undeclared changed key fails the unit', !r5.pass && r5.failing.some(x => x.key === 'atlas.desktop.doc_scroll'), JSON.stringify(r5.failing))
  const a5 = {...a1, checks: [{key: 'atlas.desktop.nope', op: 'absent'}, {key: 'atlas.desktop.doc_scroll', op: '==', value: 768}]}; ok('accept: an errored profile cannot pass an absent check', !acceptScore(a5, {atlas: {desktop: {error: 'boom'}}}, self, {allowStale: true}).pass)
  const a6 = {...a1, declared_change_keys: ['atlas']}; ok('lint: a declared key broader than surface.profile.key is rejected', lintAccept(a6).some(x => /too broad/.test(x)))
  const a7 = {...a1, gates: ['UG1'], waive: {}}; ok('lint: an unlisted, unwaived gate is rejected', lintAccept(a7).some(x => /UG2 is neither/.test(x)))
  for (const [k, want] of [[['atlas.*.*'], true], [['atlas.iphone13.*'], true], [['*.iphone13.doc_scroll'], true], [['atlas.*.doc_scroll'], true], [['atlas.iphone13.doc_*'], true], [['atlas.iphone13.doc_scroll'], false], [['atlas.iphone13.tiers.*.w'], false]]) ok('lint: declared key ' + JSON.stringify(k) + (want ? ' is rejected' : ' is accepted'), lintAccept({...a1, declared_change_keys: k}).some(x => /too broad/.test(x)) === want)
  // the fingerprint is the street probe's record: a one-day departDay shift, a chronicle text change or --perturb each change the sha
  {
    const world = (dep, text) => ({clock: {day: 400.5, speed: 0}, dayTicked: 400, settlements: [{name: 'A', pop: 10, kind: 'village', prosperity: 0.5}], agents: [{kind: 'caravan', src: {name: 'A'}, dst: {name: 'B'}, departDay: dep, speed: 300}], chron: [{text}], treasury: 5, routeVolume: new Map([['0>1', 2]])})
    const had = global.window
    const fp = (w, perturb) => { global.window = {ANNALS: {world: w}}; pageLib(); return sha(JSON.stringify(global.window.__mc.fingerprint(perturb))) }
    try {
      const base = fp(world(10, 'x'))
      ok('fingerprint: same world, same sha', base === fp(world(10, 'x')))
      ok('fingerprint: departDay + 1 changes the sha', base !== fp(world(11, 'x')))
      ok('fingerprint: a chronicle text change changes the sha', base !== fp(world(10, 'y')))
      ok('fingerprint: --perturb departDay changes the sha', base !== fp(world(10, 'x'), true))
    } finally { if (had === undefined) delete global.window; else global.window = had }
  }
  // UG2: an aborted font host explains only its own generic line; a local 404 stays unexplained; an extra page's errors reach the gate
  {
    const P = {net: {origin: 'http://localhost:1'}, aborted: [{url: 'https://fonts.googleapis.com/css2?family=EB'}], rec: {console: ['Failed to load resource: net::ERR_FAILED', 'Failed to load resource: the server responded with a status of 404 (Not Found)'], consoleUrl: ['https://fonts.googleapis.com/css2?family=EB', 'http://localhost:1/missing.png'], page: [], failed: ['https://fonts.googleapis.com/css2?family=EB']}}
    ok('errors: a local 404 is not hidden by an aborted font request', errorsOf(P).unexplained === 1, JSON.stringify(errorsOf(P)))
    const g = gateResults({gates: ['UG2'], declared_change_keys: []}, {atlas: {desktop: {errors: {unexplained: 0, messages: []}, extra_errors: {safe_area: {unexplained: 1, messages: ['boom']}}}}}, () => null, {})
    ok('UG2 reads the extra pages', g.some(x => /extra|safe_area/.test(x.key)), JSON.stringify(g))
  }
  // tap outcome: whole names, never substrings
  {
    const t = (n, hash, title, before = '', chooser = null) => tapOutcome(n, {hash, open: !!title, title, chooser}, before)
    ok('tap: Lepon on its own card is own', t('Lepon', '#place=Lepon', 'Lepon') === 'own')
    ok('tap: Lepon opening Leponnia is other', t('Lepon', '#place=Leponnia', 'Leponnia') === 'other')
    ok('tap: Lepon opening Lepon the Old is other', t('Lepon', '#place=Lepon the Old', 'Lepon the Old') === 'other')
    ok('tap: Alensis opening Alensis City is other', t('Alensis', '#place=Alensis City', 'Alensis City') === 'other')
    ok('tap: Epēshu opening the Senate of Epēshu is other', t('Epēshu', '#faction=The Senate of Epēshu', 'The Senate of Epēshu') === 'other')
    ok('tap: diacritics fold on both sides', t('Epēshu', '#place=Epeshu', 'Epeshu') === 'own')
    ok('tap: Hometown of X opening #company=X is own (the alias)', t('Hometown of Brannoc', '#company=Brannoc', 'Brannoc') === 'own')
    ok('tap: a title with a kind after a dash is still own', t('Epēshu', '', 'Epēshu — the Marble City') === 'own')
    ok('tap: a chooser row that merely contains the name is not listed', t('Lepon', '', '', '', {rows: ['Leponnia', 'Lepon the Old']}) === 'chooser_without_glyph')
    ok('tap: a chooser row naming the glyph is listed', t('Lepon', '', '', '', {rows: ['Lepon — ruin', 'Lepon the Old']}) === 'chooser')
    ok('tap: nothing opened is none', t('Lepon', '', '', '') === 'none')
    ok('tap: Tamaron opening Tamaron Mopher is other', t('Tamaron', '#place=Tamaron Mopher', 'Tamaron Mopher') === 'other')
    ok('tap: the card hash decides over a title that names the glyph', t('Lepon', '#place=Leponnia', 'Lepon') === 'other')
    ok('tap: a glyph named by the part after a title dash is not own', t('The Marble City', '', 'Epēshu — The Marble City') === 'other')
    ok('tap: Epēshu chooser row "The Senate of Epēshu" alone does not list it', t('Epēshu', '', '', '', {rows: ['The Senate of Epēshu']}) === 'chooser_without_glyph')
    // provenance marks: a starred title is still the glyph's own card; a starred card with a longer name is still another card
    ok('tap: a starred correct card is own (The Strait Run✶)', t('The Strait Run', '', 'The Strait Run✶') === 'own', t('The Strait Run', '', 'The Strait Run✶'))
    ok('tap: a starred correct card with spacing is own (The Gulf Crossing ✶ )', t('The Gulf Crossing', '', '  The Gulf  Crossing ✶ ') === 'own')
    ok('tap: a starred title with a kind after a dash is own', t('The Strait Run', '', 'The Strait Run✶ — sea lane') === 'own')
    ok('tap: a trailing marker glyph other than ✶ is stripped (★)', t('Hollow Rock', '', 'Hollow Rock ★') === 'own')
    ok('tap: a decomposed (NFD) title matches the composed glyph name', t('Epēshu', '', 'Epēshu✶'.normalize('NFD')) === 'own')
    ok('tap: a starred substring-named wrong card is other (Strait Run -> The Strait Runway✶)', t('The Strait Run', '', 'The Strait Runway✶') === 'other')
    ok('tap: a starred card that merely contains the glyph name is other (Lepon -> Leponnia✶)', t('Lepon', '', 'Leponnia✶') === 'other')
    ok('tap: a starred chooser row naming the glyph is listed', t('The Strait Run', '', '', '', {rows: ['The Strait Run✶ — sea lane']}) === 'chooser')
    ok('tap: a starred chooser row with a longer name does not list it', t('The Strait Run', '', '', '', {rows: ['The Strait Runway✶']}) === 'chooser_without_glyph')
  }
  // B0 agrees with the scorer: every recorded title-only 'other' row re-scores 'other', so a capture of the unchanged tree reproduces B0's tap_fixture
  {
    const bp = path.join(REPO, 'docs/mobile/baseline.json'), B = fs.existsSync(bp) ? JSON.parse(fs.readFileSync(bp, 'utf8')) : null
    const dis = B ? tapFixtureDisagreements(B) : ['docs/mobile/baseline.json missing']
    ok('B0: every recorded tap row agrees with the scorer and the counts add up', dis.length === 0, dis.slice(0, 4).join('; '))
    const rows = B ? Object.values(B.atlas || {}).reduce((n, a) => n + ((a.tap_fixture && a.tap_fixture.taps) || []).filter(r => r.outcome === 'other' && !String(r.opened).startsWith('#')).length, 0) : 0
    ok('B0: title-only other rows are present to check', rows > 0, String(rows))
    ok('B0: re-scoring B0 again changes nothing', !!B && Object.values(B.atlas || {}).every(a => !a.tap_fixture || rescoreTapFixture(a.tap_fixture).dropped === 0 && deepEq(rescoreTapFixture(a.tap_fixture).tf, a.tap_fixture)))
    const tf = () => ({n: 3, complete: true, wrong_card: 2, wrong_taps: 2, no_open: 0, chooser: 0, chooser_without_glyph: 0, views: {whole: {tapped: 3, wrong_card: 2}}, taps: [{view: 'whole', name: 'The Eshbrīn', outcome: 'other', opened: 'Epēshu'}, {view: 'whole', name: 'The Strait Run', outcome: 'other', opened: 'The Strait Run✶'}]})
    const inj = (f, re) => { const x = tf(); f(x); const d = tapFixtureDisagreements({atlas: {desktop: {tap_fixture: x}}}); return d.some(s => re.test(s)) }
    ok('B0 check: a starred own card recorded as other is caught (The Strait Run✶)', inj(() => {}, /re-scores own/) && inj(() => {}, /provenance marks/))
    ok('B0 check: an unstarred own title recorded as other is caught', inj(x => { x.taps[1].opened = 'The Strait Run' }, /re-scores own/))
    ok('B0 check: a wrong title stays other and is clean', tapFixtureDisagreements({atlas: {desktop: {tap_fixture: rescoreTapFixture(tf()).tf}}}).length === 0, tapFixtureDisagreements({atlas: {desktop: {tap_fixture: rescoreTapFixture(tf()).tf}}}).join('; '))
    ok('B0 check: an own row in the recorded list is caught', inj(x => { x.taps[0].outcome = 'own' }, /an own row is recorded/))
    ok('B0 check: a non-card hash row (#view=) with no card open re-scores other', !inj(x => { x.taps[1].opened = '#view=2195,1094,1.95' }, /re-scores/))
    ok('B0 check: counts that disagree with the rows are caught', inj(x => { x.taps[1] = {view: 'whole', name: 'X', outcome: 'other', opened: '#place=Y'}; x.wrong_card = 3; x.wrong_taps = 3 }, /views wrong_card sum|wrong rows recorded/))
    const rs = rescoreTapFixture(tf())
    ok('rescore: the starred own row is dropped and every count follows', rs.dropped === 1 && rs.tf.wrong_card === 1 && rs.tf.wrong_taps === 1 && rs.tf.views.whole.wrong_card === 1 && rs.tf.taps.length === 1 && rs.tf.taps[0].name === 'The Eshbrīn', JSON.stringify(rs.tf))
    // the unchanged rule: a fresh capture (scored by the current tool) of the unchanged tree equals a re-scored B0 and passes; the stale B0 fails
    const capT = t => ({atlas: {desktop: {tap_fixture: t}}}), accU = {unit: 'FX', profiles: ['desktop'], clock: 'virtual', gates: [], waive: WV, declared_change_keys: [], checks: []}
    ok('unchanged rule: a fresh capture against the re-scored B0 passes', acceptScore(accU, capT(rs.tf), () => capT(rescoreTapFixture(tf()).tf), {allowStale: true}).pass)
    ok('unchanged rule: a fresh capture against an un-re-scored B0 fails on tap_fixture', !acceptScore(accU, capT(rs.tf), () => capT(tf()), {allowStale: true}).pass)
  }
  // the image diff runs at full resolution: hairlines that a 3x box average hides still count
  {
    const W = 300, H = 200, base = {w: W, h: H, data: Buffer.alloc(W * H * 4, 200)}, hair = {w: W, h: H, data: Buffer.from(base.data)}
    for (let y = 0; y < H; y += 6) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; hair.data[i] -= 24; hair.data[i + 1] -= 24; hair.data[i + 2] -= 24 }
    const full = imageDiff(pngEncode(base), pngEncode(hair)).diff, red = imageDiff(pngEncode(boxDown(base, 3)), pngEncode(boxDown(hair, 3))).diff
    ok('diff: full resolution sees hairlines the 1/3 reduction loses', full > 0.1 && red === 0, full + ' vs ' + red)
    const dir = path.join(tmp, 'shots'); fs.mkdirSync(dir, {recursive: true})
    const w1 = (n, img) => { fs.writeFileSync(path.join(dir, n), pngEncode(img)); return path.join(dir, n) }
    const pf = w1('a.full.png', hair), pb = w1('b.full.png', base), pr = w1('a.png', boxDown(hair, 3)), pq = w1('b.png', boxDown(base, 3))
    const fh = p => sha(fs.readFileSync(p))
    const mk = (p, fp) => ({atlas: {desktop: {shots: {v: {path: p, w: 100, h: 66, scale: 1 / 3, sha: fh(p), ...(fp ? {full_path: fp, full_sha: fh(fp)} : {})}}}}})
    ok('shot diff: reduced copies without full files fail', shotDiffFor(mk(pr), mk(pq), 'atlas', 'desktop', [], null).diff === 1)
    const sd = shotDiffFor(mk(pr, pf), mk(pq, pb), 'atlas', 'desktop', [], null).diff
    ok('shot diff: with full files the hairlines show', sd > 0.1, String(sd))
    // the reference record vouches for its bytes: a later run that overwrites the reference files cannot make a changed tree diff 0
    const ref = mk(pq, pb), capd = mk(pr, pf)
    ok('shot diff: matching shas still diff', shotDiffFor(capd, ref, 'atlas', 'desktop', [], null).diff > 0.1)
    fs.copyFileSync(pf, pb); fs.copyFileSync(pr, pq)   // an ad hoc capture of the broken tree lands on the reference's file names
    const ow = shotDiffFor(capd, ref, 'atlas', 'desktop', [], null)
    ok('shot diff: an overwritten reference file fails as changed since capture', ow.diff === 1 && /reference shot changed since capture/.test(ow.per.v), JSON.stringify(ow))
    const nosha = {atlas: {desktop: {shots: {v: {...capd.atlas.desktop.shots.v, sha: undefined, full_sha: undefined}}}}}
    ok('shot diff: a record without shas fails', shotDiffFor(nosha, mk(pr, pf), 'atlas', 'desktop', [], null).diff === 1)
    const m1 = {index_sha: 'a', atlas_sha: 'b'}, m2 = {index_sha: 'c', atlas_sha: 'b'}
    const names = [shotsDirName({out: 'docs/mobile/baseline.json'}, m1), shotsDirName({out: 'docs/mobile/captures/R1.json'}, m1), shotsDirName({}, m1), shotsDirName({}, m2), shotsDirName({out: 'docs/mobile/baseline.json'}, m2)]
    ok('shots dir: baseline, R1 and ad hoc runs on any tree never share a dir, and none is the bare adhoc', new Set(names).size === names.length && !names.includes('adhoc') && /^baseline-/.test(names[0]) && shotsDirName({unit: 'M3.1'}, m1) === 'M3.1', JSON.stringify(names))
  }
  // UG3: a declared line is an exact line and cannot hide extra occurrences; UG2/UG3 need their profiles
  {
    const cl = t => ({P: clockTokens(t).P, W: clockTokens(t).W}), mkRepo = t => ({clock_tokens: {index: cl(t), atlas: cl('x\n')}, atlas_fn_sha: {}})
    const b0t = 'a = Math.random()\nb = 1\n', cpt = b0t + 'function ladderTick(){ return performance.now() }\nconst seedJitter = Math.random()*Date.now()\n'
    const seeds = {}, B = {repo: mkRepo(b0t), sim: {desktop: {seeds}}}
    const cap = {repo: mkRepo(cpt), sim: {desktop: {seeds}}}
    const run = (dec, c = cap) => gateResults({gates: ['UG3'], profiles: ['desktop'], declared_clock_lines: dec}, c, () => B, {}).filter(x => /clock_tokens|declared_clock/.test(x.key))
    ok('UG3: new clock lines fail with nothing declared', run([]).length > 0)
    ok('UG3: a substring of the new lines does not cover them', run(['performance.now() }', 'Math.random()*Date.now()']).length > 0, JSON.stringify(run(['performance.now() }'])))
    ok('UG3: the two whole lines cover exactly themselves', run(['function ladderTick(){ return performance.now() }', 'const seedJitter = Math.random()*Date.now()']).length === 0, JSON.stringify(run(['function ladderTick(){ return performance.now() }', 'const seedJitter = Math.random()*Date.now()'])))
    ok('UG3: a declared line that is in neither file fails', run(['const nothingLikeThisExists = Date.now()']).some(x => x.key === 'UG3.declared_clock_lines'))
    const cap2 = {repo: mkRepo(cpt + 'const another = Math.random()\n'), sim: {desktop: {seeds}}}
    ok('UG3: an extra undeclared occurrence still fails beside declared lines', run(['function ladderTick(){ return performance.now() }', 'const seedJitter = Math.random()*Date.now()'], cap2).length > 0)
    const g3 = lintAccept({unit: 'FX', profiles: ['desktop'], gates: ['UG3'], waive: Object.fromEntries(ALL_GATES.filter(g => g !== 'UG3').map(g => [g, 'fixture without a tree'])), checks: []})
    ok('lint: UG3 on one profile is rejected', g3.some(x => /UG3 is scored on/.test(x) && /landscape/.test(x)), g3.join('; '))
    const gm = gateResults({gates: ['UG3'], profiles: ['desktop']}, {repo: cap.repo, sim: {desktop: {seeds}}}, () => B, {})
    ok('UG3 fails when a profile is missing from the capture', gm.some(x => x.key === 'UG3.sim.landscape'), JSON.stringify(gm.map(x => x.key)))
    const g2 = lintAccept({unit: 'FX', profiles: ['iphone13', 'desktop', 'desktop2x'], gates: ['UG2'], waive: Object.fromEntries(ALL_GATES.filter(g => g !== 'UG2').map(g => [g, 'fixture without a tree'])), checks: []})
    ok('lint: UG2 without pixel7 is rejected', g2.some(x => /UG2 is scored on/.test(x) && /pixel7/.test(x)), g2.join('; '))
    const g2b = gateResults({gates: ['UG2'], profiles: ['desktop']}, {atlas: {desktop: {errors: {unexplained: 0, messages: []}}}}, () => null, {})
    ok('UG2 fails when a gate profile is missing from the capture', g2b.some(x => x.key === 'UG2.atlas.iphone13'), JSON.stringify(g2b.map(x => x.key)))
    // a declaration covers one changed copy per listing, keyed on the whole line
    const one = 'function ladderTick(){ return performance.now() }', cp3 = b0t + (one + '\n').repeat(3)
    ok('UG3: a declared line pasted three times fails', run([one], {repo: mkRepo(cp3), sim: {desktop: {seeds}}}).length > 0, JSON.stringify(run([one], {repo: mkRepo(cp3), sim: {desktop: {seeds}}})))
    ok('UG3: listed three times it covers three copies', run([one, one, one], {repo: mkRepo(cp3), sim: {desktop: {seeds}}}).length === 0, JSON.stringify(run([one, one, one], {repo: mkRepo(cp3), sim: {desktop: {seeds}}})))
    const b0dup = 'a = Math.random()\nb = 1\n', cpdup = b0dup + 'a = Math.random()\na = Math.random()\n'
    ok('UG3: copies of a B0 line beyond the declared count fail', run(['a = Math.random()'], {repo: mkRepo(cpdup), sim: {desktop: {seeds}}}).some(x => /declared_clock_lines\.P|clock_tokens\.index\.P$/.test(x.key)))
    ok('UG3: copies of a B0 line within the declared count pass', run(['a = Math.random()', 'a = Math.random()'], {repo: mkRepo(cpdup), sim: {desktop: {seeds}}}).length === 0)
    const long = 'const ' + 'x'.repeat(170), la = long + ' = Math.random()', lb = long + ' = Date.now()'
    ok('UG3: two lines sharing 160 chars are distinct (one declaration covers only its own)', run([la], {repo: mkRepo(b0t + la + '\n' + lb + '\n'), sim: {desktop: {seeds}}}).length > 0 && run([la, lb], {repo: mkRepo(b0t + la + '\n' + lb + '\n'), sim: {desktop: {seeds}}}).length === 0)
    {   // the finding's fixture on the real tree: three more copies of an existing index.html line, P 37 -> 40
      const t0 = rd('index.html'), real = t => ({clock_tokens: {index: cl(t), atlas: cl(rd('maps-site/index.html'))}, atlas_fn_sha: {}})
      const RB = {repo: real(t0), sim: {desktop: {seeds}}}, line = 'const now = performance.now();', rc = real(t0 + ('\n  ' + line).repeat(3))
      const rr = dec => gateResults({gates: ['UG3'], profiles: ['desktop'], declared_clock_lines: dec}, {repo: rc, sim: {desktop: {seeds}}}, () => RB, {}).filter(x => /clock_tokens|declared_clock/.test(x.key))
      ok('UG3: three pasted copies of a declared B0 line (P 40) fail', rc.clock_tokens.index.P.occurrences === 40 && rr([line]).some(x => /clock_tokens\.index\.P$/.test(x.key) || /declared_clock_lines\.P/.test(x.key)), JSON.stringify(rr([line])))
      ok('UG3: the same with nothing declared fails', rr([]).some(x => x.key === 'UG3.clock_tokens.index.P'))
    }
    {   // both canon seeds on every UG3 profile: a capture holding only epeshu fails even when sim.<p>.seeds is declared
      const P5 = GATE_PROFILES.UG3, fpOf = (p, sd) => ({fingerprint: 'fp-' + sd, rng_next: {gen: 0.5}, errors: {unexplained: 0, messages: []}})
      const simOf = sds => Object.fromEntries(P5.map(p => [p, {seeds: Object.fromEntries(sds.map(sd => [sd, fpOf(p, sd)]))}]))
      const B3 = {repo: mkRepo(b0t), sim: simOf(REQUIRED_SEEDS)}, both = {repo: mkRepo(b0t), sim: simOf(REQUIRED_SEEDS)}, onlyE = {repo: mkRepo(b0t), sim: simOf(['epeshu'])}
      const seedFails = (c, acc) => gateResults({gates: ['UG3'], profiles: P5, ...(acc || {})}, c, () => B3, {}).filter(x => /^UG3\.sim\./.test(x.key))
      ok('UG3 seeds: both seeds captured and equal pass', seedFails(both).length === 0, JSON.stringify(seedFails(both)))
      ok('UG3 seeds: a capture without tamar1374 fails on every profile', P5.every(p => seedFails(onlyE).some(x => x.key === 'UG3.sim.' + p + '.tamar1374')), JSON.stringify(seedFails(onlyE).map(x => x.key)))
      const decl = {declared_change_keys: P5.map(p => 'sim.' + p + '.seeds')}
      ok('UG3 seeds: declaring sim.<p>.seeds does not excuse a missing seed', P5.every(p => seedFails(onlyE, decl).some(x => x.key === 'UG3.sim.' + p + '.tamar1374')))
      const accS = {unit: 'FX', profiles: P5, gates: ['UG3'], waive: Object.fromEntries(ALL_GATES.filter(g => g !== 'UG3').map(g => [g, 'fixture without a tree'])), checks: [], ...decl}
      const scS = acceptScore(accS, onlyE, () => B3, {allowStale: true})
      ok('UG3 seeds: acceptScore with declared seed keys still fails the missing seed', !scS.pass && scS.failing.some(x => /^UG3\.sim\.iphone13\.tamar1374$/.test(x.key)), JSON.stringify(scS.failing.map(x => x.key)))
      const B1 = {repo: mkRepo(b0t), sim: simOf(['epeshu'])}
      ok('UG3 seeds: a baseline without tamar1374 does not excuse the capture lacking it', gateResults({gates: ['UG3'], profiles: P5}, onlyE, () => B1, {}).some(x => x.key === 'UG3.sim.desktop.tamar1374'))
      const errd = {repo: mkRepo(b0t), sim: Object.fromEntries(P5.map(p => [p, {seeds: {}, error: 'boom'}]))}
      ok('UG3 seeds: errored sim profiles with no seeds fail in gateResults alone', seedFails(errd).some(x => x.key === 'UG3.sim.desktop.epeshu'))
      const cliS = cp.spawnSync(process.execPath, [__filename, '--accept', f, '--seeds', 'epeshu'], {encoding: 'utf8'})
      ok('UG3 seeds: --accept refuses a --seeds override without both canon seeds', cliS.status === 1 && /capture\.seeds/.test(cliS.stdout), 'status ' + cliS.status + ' ' + cliS.stdout.slice(0, 160))
    }
    ok('UG3: an undeclared new token beside declared lines fails the occurrence count', run(['function ladderTick(){ return performance.now() }', 'const seedJitter = Math.random()*Date.now()'], {repo: mkRepo(cpt + 'x = performance.now()\n'), sim: {desktop: {seeds}}}).some(x => /clock_tokens\.index\.P$/.test(x.key)))
  }
  // UG8 through the gate: a full-resolution hairline change behind reduced copies fails desktop identity
  {
    const W = 300, H = 200, base = {w: W, h: H, data: Buffer.alloc(W * H * 4, 200)}, hair = {w: W, h: H, data: Buffer.from(base.data)}
    for (let y = 0; y < H; y += 6) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; hair.data[i] -= 24; hair.data[i + 1] -= 24; hair.data[i + 2] -= 24 }
    const dir = path.join(tmp, 'ug8'); fs.mkdirSync(dir, {recursive: true})
    const w1 = (n, img) => { fs.writeFileSync(path.join(dir, n), pngEncode(img)); return path.join(dir, n) }
    const shot = (img, tag) => { const p = w1(tag + '.png', boxDown(img, 3)), fp = w1(tag + '.full.png', img); return {v: {path: p, w: 100, h: 66, scale: 1 / 3, sha: sha(fs.readFileSync(p)), full_path: fp, full_sha: sha(fs.readFileSync(fp))}} }
    const prof = shots => ({doc_scroll: 768, shots})
    const B = {atlas: {desktop: prof(shot(base, 'b1')), desktop2x: prof(shot(base, 'b2'))}}
    const same = {atlas: {desktop: prof(shot(base, 'c1')), desktop2x: prof(shot(base, 'c2'))}}, changed = {atlas: {desktop: prof(shot(hair, 'h1')), desktop2x: prof(shot(base, 'h2'))}}
    const u8 = c => gateResults({gates: ['UG8'], profiles: ['desktop', 'desktop2x']}, c, () => B, {}).filter(x => /shot_diff/.test(x.key))
    ok('UG8: identical full-resolution shots pass', u8(same).length === 0, JSON.stringify(u8(same)))
    ok('UG8: a hairline change that the 1/3 copies hide fails at full resolution', u8(changed).some(x => x.key === 'UG8.atlas.desktop.shot_diff'), JSON.stringify(u8(changed)))
    // a conditional view (3-layers, 2-ledger) missing from the capture fails; the baseline's views, not the capture's, set the list
    const Bw = {atlas: {desktop: prof({...shot(base, 'bv'), w: shot(base, 'bw').v}), desktop2x: prof({...shot(base, 'bv2'), w: shot(base, 'bw2').v})}}
    const noW = {atlas: {desktop: prof(shot(base, 'nv')), desktop2x: prof({...shot(base, 'nv2'), w: shot(base, 'nw2').v})}}
    const u8w = (c, acc) => gateResults({gates: ['UG8'], profiles: ['desktop', 'desktop2x'], ...(acc || {})}, c, () => Bw, {}).filter(x => /shot_diff/.test(x.key))
    ok('UG8: a view the baseline holds and the capture lacks fails with a reason', u8w(noW).some(x => x.key === 'UG8.atlas.desktop.shot_diff' && /missing from the capture/.test(x.got)) && !u8w(noW).some(x => x.key === 'UG8.atlas.desktop2x.shot_diff'), JSON.stringify(u8w(noW)))
    const pdw = shotDiffFor(noW, Bw, 'atlas', 'desktop', [], null)
    ok('UG8: shotDiffFor over an empty capture shot set is 1, not 0', shotDiffFor({atlas: {desktop: {shots: {}}}}, Bw, 'atlas', 'desktop', [], null).diff === 1 && pdw.diff === 1 && /missing from the capture/.test(pdw.per.w), JSON.stringify(pdw))
    ok('UG8: a check on a named view the capture lacks fails', shotDiffFor(noW, Bw, 'atlas', 'desktop', [], 'w').diff === 1)
    ok('UG8: a view the accept file requires and neither side holds fails', u8w(same, {shot_views: ['3-layers']}).some(x => x.key === 'UG8.atlas.desktop.shot_diff' && /3-layers/.test(x.got)), JSON.stringify(u8w(same, {shot_views: ['3-layers']})))
    ok('UG8: a view named by an accept shot_diff check is required', u8w(same, {checks: [{key: 'atlas.desktop2x.shot_diff.2-ledger', op: '<=', value: 0.005}]}).some(x => x.key === 'UG8.atlas.desktop2x.shot_diff' && /2-ledger/.test(x.got)))
    ok('lint: shot_views must be an array of names', lintAccept({...a1, shot_views: 'x'}).some(x => /shot_views/.test(x)) && !lintAccept({...a1, shot_views: ['3-layers']}).some(x => /shot_views/.test(x)))
    ok('UG8: the reduced copies alone diff 0 (the reason for full_path)', imageDiff(fs.readFileSync(path.join(dir, 'h1.png')), fs.readFileSync(path.join(dir, 'b1.png'))).diff === 0)
  }
  // chrome_cover.peek / .half: a check never passes on null, 'no-sheet' or 'unmeasured'
  {
    const WV2 = Object.fromEntries(ALL_GATES.map(g => [g, 'fixture without a tree']))
    const acc = (op, value) => ({unit: 'FX', profiles: ['iphone13'], gates: [], waive: WV2, declared_change_keys: ['atlas.iphone13.chrome_cover.peek'], checks: [{key: 'atlas.iphone13.chrome_cover.peek', op, value}]})
    const capOf = v => ({atlas: {iphone13: {chrome_cover: {peek: v}}}}), sc = (a, v) => acceptScore(a, capOf(v), () => capOf('no-sheet'), {allowStale: true}).pass
    ok('peek: a measured 0.30 passes <= 0.35', sc(acc('<=', 0.35), 0.30))
    ok('peek: null fails <= 0.35', !sc(acc('<=', 0.35), null))
    ok('peek: null fails even an absent check', !sc(acc('absent'), null))
    ok('peek: null fails even == null', !sc(acc('==', null), null))
    ok('peek: no-sheet fails != 0', !sc(acc('!=', 0), 'no-sheet'))
    ok('peek: unmeasured fails', !sc(acc('<=', 0.35), 'unmeasured: x'))
    ok('peek: "unmeasured: stop not reached" fails a peek check', !sc(acc('<=', 0.35), 'unmeasured: stop not reached (hook asked peek, sheet reports none)'))
    ok('peek: an undeclared null against B0 no-sheet fails the unchanged rule', !acceptScore({...acc('<=', 1), declared_change_keys: [], checks: []}, capOf(null), () => capOf('no-sheet'), {allowStale: true}).pass)
  }
  // sheet stops via the hook: the sheet must report the stop it was driven to, and half must move from peek
  {
    const fakeP = hookImpl => {
      const st = {stop: null, rect: [0, 400, 390, 264]}
      const page = {evaluate: async (fn, arg) => {
        if (fn === sheetProbe) return {hook: true, handle: null, stop: st.stop, rect: st.rect.slice()}
        const src = String(fn)
        if (/sheet\.stop/.test(src)) { hookImpl(st, arg[1]); return }
        if (/chromeCover/.test(src)) return 0.2 + (st.rect[1] < 300 ? 0.3 : 0)
        throw new Error('unexpected evaluate')
      }}
      return {page}
    }
    const run = h => sheetStops(fakeP(h), 'ATLAS', '#panel', PROFILES.iphone13, false)
    const noop = await run(() => {})
    ok('sheet: a no-op hook leaves peek and half unmeasured (stop not reached)', /^unmeasured: stop not reached/.test(noop.peek) && /^unmeasured: stop not reached/.test(noop.half), JSON.stringify(noop))
    const good = await run((s, k) => { s.stop = k; s.rect = k === 'peek' ? [0, 500, 390, 164] : [0, 250, 390, 414] })
    ok('sheet: a hook that reaches and reports each stop is measured', good.peek === 0.2 && good.half === 0.5, JSON.stringify(good))
    const stuck = await run(s => { s.stop = 'peek'; s.rect = [0, 500, 390, 164] })
    ok('sheet: a hook stuck at peek leaves half unmeasured', stuck.peek === 0.2 && /^unmeasured: stop not reached/.test(stuck.half), JSON.stringify(stuck))
    const liar = await run((s, k) => { s.stop = k })
    ok('sheet: a hook that reports half without moving the sheet leaves half unmeasured', typeof liar.peek === 'number' && /^unmeasured: stop not reached/.test(liar.half), JSON.stringify(liar))
    const WV3 = Object.fromEntries(ALL_GATES.map(g => [g, 'fixture without a tree']))
    const accN = {unit: 'FX', profiles: ['iphone13'], gates: [], waive: WV3, declared_change_keys: ['atlas.iphone13.chrome_cover.peek', 'atlas.iphone13.chrome_cover.half'], checks: [{key: 'atlas.iphone13.chrome_cover.peek', op: '<=', value: 0.35}, {key: 'atlas.iphone13.chrome_cover.half', op: '<=', value: 0.6}]}
    const capN = v => ({atlas: {iphone13: {chrome_cover: v}}})
    ok('sheet: a no-op hook capture fails the peek/half checks', !acceptScore(accN, capN(noop), () => capN({peek: 'no-sheet', half: 'no-sheet'}), {allowStale: true}).pass)
    ok('sheet: a working hook capture passes the peek/half checks', acceptScore(accN, capN(good), () => capN({peek: 'no-sheet', half: 'no-sheet'}), {allowStale: true}).pass)
  }
  // clock tokens by occurrence, brace range
  const ct = clockTokens('a = Math.random() + Math.random()\nb = Date.now()\nc = 1\n'); ok('clock tokens count occurrences', ct.P.occurrences === 3 && ct.P.lines === 2)
  ok('keydown range braces matched', braceRange("x\nwindow.addEventListener('keydown', e => {\n  if(a){b}\n});\nrest", "window.addEventListener('keydown'").endsWith('});'))
  const rep = repoChecks()
  ok('repo: index clock tokens 37 on P', rep.clock_tokens.index.P.occurrences === 37, String(rep.clock_tokens.index.P.occurrences))
  {   // the one-capture lock, on a private lock file
    const lf = path.join(tmp, 'lock'), held = {pid: process.ppid, started: '2020-01-01T00:00:00.000Z', argv: []}
    fs.writeFileSync(lf, JSON.stringify(held))
    const busy = await acquireLock({file: lf, maxWaitMs: 0, pollMs: 10})
    ok('lock: held by a live pid (the parent) -> running verdict', !busy.held && busy.verdict === 'running' && busy.pid === process.ppid && busy.started === held.started && JSON.parse(fs.readFileSync(lf, 'utf8')).pid === process.ppid, JSON.stringify(busy))
    fs.writeFileSync(lf, JSON.stringify({...held, pid: 4194305}))
    const take = await acquireLock({file: lf, maxWaitMs: 0, pollMs: 10})
    ok('lock: a dead pid\'s lock is taken over', take.held && JSON.parse(fs.readFileSync(lf, 'utf8')).pid === process.pid)
    releaseLock(); ok('lock: released on exit (file removed)', !fs.existsSync(lf))
    fs.writeFileSync(lf, JSON.stringify({...held, boot: 'another-boot'}))
    const reboot = await acquireLock({file: lf, maxWaitMs: 0, pollMs: 10})
    ok('lock: a live pid from another boot is taken over', !BOOT_ID || (reboot.held && JSON.parse(fs.readFileSync(lf, 'utf8')).pid === process.pid))
    releaseLock()
  }
  fs.rmSync(tmp, {recursive: true, force: true})
  const bad2 = out.filter(x => !x.ok)
  return {pass: bad2.length === 0, checks: out.length, failing: bad2}
}

// ---------------------------------------------------------------- one capture at a time
const LOCK_FILE = path.join(os.tmpdir(), 'annals-mobile-capture.lock')
const LOCK_POLL_MS = 15000, LOCK_MAX_WAIT_MS = 3 * 3600 * 1000
const pidAlive = pid => { try { process.kill(pid, 0); return true } catch (e) { return e.code === 'EPERM' } }
const BOOT_ID = (() => { try { return fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim() } catch (e) { return '' } })()
let heldLock = null
function releaseLock() {   // only a lock that still names this process; sync so the exit handler can run it
  if (!heldLock) return
  const f = heldLock; heldLock = null
  try { if (JSON.parse(fs.readFileSync(f, 'utf8')).pid === process.pid) fs.unlinkSync(f) } catch (e) { /* already gone */ }
}
async function acquireLock(opts) {   // {file, maxWaitMs, pollMs} are internal (the self-test); resolves {held: true} or {held: false, verdict: 'running', pid, started}
  const o = {file: LOCK_FILE, maxWaitMs: LOCK_MAX_WAIT_MS, pollMs: LOCK_POLL_MS, ...opts}, t0 = Date.now(); let told = false
  for (;;) {
    try {
      fs.writeFileSync(o.file, JSON.stringify({pid: process.pid, boot: BOOT_ID, started: new Date().toISOString(), argv: process.argv.slice(2)}), {flag: 'wx'})
      if (!heldLock) { process.on('exit', releaseLock); for (const [s, c] of [['SIGINT', 130], ['SIGTERM', 143]]) process.on(s, () => process.exit(c)) }
      heldLock = o.file; return {held: true}
    } catch (e) { if (e.code !== 'EEXIST') throw e }
    let raw = null, cur = null; try { raw = fs.readFileSync(o.file, 'utf8'); cur = JSON.parse(raw) } catch (e) { /* unreadable: stale unless it is being written right now */ }
    if (raw !== null && !cur && Date.now() - t0 < 1000) { await sleep(50); continue }
    if (!cur || !Number.isInteger(cur.pid) || cur.pid === process.pid || !pidAlive(cur.pid) || (cur.boot && BOOT_ID && cur.boot !== BOOT_ID)) {   // stale: take it over, once more checking nobody replaced it meanwhile
      try { if (fs.readFileSync(o.file, 'utf8') === raw) fs.unlinkSync(o.file) } catch (e) { /* lost the race: loop and look again */ }
      continue
    }
    if (Date.now() - t0 >= o.maxWaitMs) return {held: false, verdict: 'running', pid: cur.pid, started: cur.started}
    if (!told) { log('another capture is running (pid ' + cur.pid + ', since ' + cur.started + ')'); told = true }
    await sleep(Math.min(o.pollMs, Math.max(0, o.maxWaitMs - (Date.now() - t0))))
  }
}
async function withLock(opts) {
  const r = await acquireLock(opts)
  if (!r.held) { log('another capture is running (pid ' + r.pid + ', since ' + r.started + '): gave up waiting'); process.exit(2) }
}

// ---------------------------------------------------------------- main
async function main() {
  const a = parseArgs(process.argv.slice(2))
  if (a.flags.has('self-test')) { const r = await selfTest(); console.log(JSON.stringify(r, null, 1)); process.exit(r.pass ? 0 : 1) }
  if (a['lint-accept']) {
    let acc; try { acc = JSON.parse(rd(a['lint-accept'])) } catch (e) { console.log(JSON.stringify({ok: false, errors: ['unreadable: ' + e.message]})); process.exit(1) }
    const e = lintAccept(acc); console.log(JSON.stringify({ok: e.length === 0, errors: e}, null, 1)); process.exit(e.length ? 1 : 0)
  }
  if (a._cmp) {
    const d = compareCaptures(JSON.parse(rd(a._cmp[0])), JSON.parse(rd(a._cmp[1])))
    console.log(JSON.stringify({agree: d.length === 0, differing_keys: d.slice(0, 40).map(x => ({key: x.key, a: x.a, b: x.b})), n: d.length}, null, 1)); process.exit(d.length ? 1 : 0)
  }
  if (a.accept) {
    const acc = JSON.parse(rd(a.accept)), errs = lintAccept(acc)
    if (errs.length) { console.log(JSON.stringify({unit: acc.unit, pass: false, failing: errs.map(e => ({key: 'lint', op: 'lint', expected: 'valid accept file', got: e}))}, null, 1)); process.exit(1) }
    if (a.seeds && REQUIRED_SEEDS.some(x => !a.seeds.split(',').includes(x))) { console.log(JSON.stringify({unit: acc.unit, pass: false, failing: [{key: 'capture.seeds', op: 'gate', expected: 'every capture scored by --accept includes ' + REQUIRED_SEEDS.join(','), got: a.seeds}]}, null, 1)); process.exit(1) }
    const refOf = resolveRefs(acc, a)
    let cap, capPath = a.capture || acc.capture
    if (capPath) cap = JSON.parse(rd(capPath))
    else {
      const o = planOptions({...a, flags: new Set([...a.flags]), profiles: acc.profiles.join(','), unit: acc.unit, clock: acc.clock || a.clock})
      o.atlas = acc.checks.some(c => /^atlas\./.test(c.key)) || acc.gates.some(g => ['UG3', 'UG7', 'UG8', 'UG10'].includes(g)) && !acc.checks.every(c => /^sim\./.test(c.key))
      o.sim = acc.checks.some(c => /^sim\./.test(c.key)) || acc.gates.some(g => ['UG3', 'UG5', 'UG8', 'UG10'].includes(g)) && !acc.checks.every(c => /^atlas\./.test(c.key))
      if (!o.atlas && !o.sim) o.atlas = o.sim = true
      await withLock()
      cap = await runCapture(o); fs.mkdirSync(path.join(REPO, 'docs/mobile/captures'), {recursive: true}); fs.writeFileSync(path.join(REPO, 'docs/mobile/captures', acc.unit + '.json'), JSON.stringify(cap, null, 1) + '\n')
    }
    addReachVsControls(cap)
    const res = acceptScore(acc, cap, refOf, {allowStale: a.flags.has('allow-stale') || !!(a.capture || acc.capture) && a.flags.has('allow-stale')})
    console.log(JSON.stringify(res, null, 1)); process.exit(res.pass ? 0 : 1)
  }
  const o = planOptions(a)
  if (a.flags.has('mutate-only')) {   // D7/D8 fixture: serve one trailing <!-- v2 --> on the named html after the first visit
    const file = o.mutate || 'maps-site/index.html', pw = loadPlaywright(), env = {pw, cdn: resolveCdn(o.cdnDir)}
    env.server = o.url ? {origin: o.url.replace(/\/$/, ''), state: {}, close: async () => {}} : await startServer(o.root, o.port)
    env.browser = await launch(pw)
    try { const key = o.want[0]; const r = await extraMutate(env, key, {...o, profile: o.profiles[key]}, file === 'index.html' ? '/' : '/' + file.replace(/index\.html$/, ''), file); console.log(JSON.stringify(r)); process.exit(r.served_has_v2 && !r.first_visit_has_v2 ? 0 : 1) } finally { await env.browser.close(); await env.server.close() }
  }
  await withLock()
  const cap = await runCapture(o)
  const text = JSON.stringify(cap, null, 1) + '\n'
  const outp = a.out || (o.unit ? 'docs/mobile/captures/' + o.unit + '.json' : null)
  if (outp) { const p = path.resolve(REPO, outp); fs.mkdirSync(path.dirname(p), {recursive: true}); fs.writeFileSync(p, text); log('wrote', p) }
  if (a.controls) { if (!cap.atlas && !cap.sim || !(cap.atlas && cap.atlas.desktop || cap.sim && cap.sim.desktop)) throw new Error('--controls needs the desktop profile'); const p = path.resolve(REPO, a.controls); fs.mkdirSync(path.dirname(p), {recursive: true}); fs.writeFileSync(p, JSON.stringify(controlsFile(cap), null, 1) + '\n'); log('wrote', p) }
  if (!outp) process.stdout.write(text)
}
if (require.main === module) main().catch(e => { console.error(e.stack || e); process.exit(2) })
module.exports = {tapOutcome, tapFixtureDisagreements, rescoreTapFixture, shotDiffFor, shotsDirName, gateResults, controlsFile, openPage, simStart, simViews, loadPlaywright, launch, resolveCdn, pump, PROFILES, startServer, repoChecks, clockTokens, braceRange, pngDecode, pngEncode, imageDiff, lintAccept, acceptScore, compareCaptures, runCapture, planOptions}
