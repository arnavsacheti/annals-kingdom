#!/usr/bin/env node
// Offline manifest: --atlas -> maps-site/data/offline-manifest.json, --sim -> offline-manifest.json,
// --check [--atlas|--sim] -> exit 1 when a listed raster changed and TILES_V did not (or the manifest is stale).
// --root DIR works on a copy of the repo. Output is a pure function of the files: sorted keys, no clock.
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const argv = process.argv.slice(2);
const flag = f => argv.includes(f);
const ri = argv.indexOf('--root');
const ROOT = path.resolve(ri >= 0 ? argv[ri + 1] : path.join(__dirname, '..'));
const RASTER_DIRS = ['tiles', 'tiles-war', 'tiles-imperial', 'charts', 'art'];
const RASTER_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;
const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;

const LANES = {
  atlas: { base: path.join(ROOT, 'maps-site'), out: 'data/offline-manifest.json', rel: 'maps-site/data/offline-manifest.json',
    skip: new Set(['data/offline-manifest.json', 'sw.js', 'sw-kill.js']), roots: null },
  sim: { base: ROOT, out: 'offline-manifest.json', rel: 'offline-manifest.json',
    skip: new Set(), roots: ['index.html', 'share.jpg', 'vendor'] }
};

function walk(base, rel, acc) {
  let st; try { st = fs.statSync(path.join(base, rel)); } catch (e) { return; }
  if (st.isDirectory()) {
    for (const n of fs.readdirSync(path.join(base, rel))) if (n[0] !== '.') walk(base, rel ? rel + '/' + n : n, acc);
  } else if (st.isFile()) acc.push([rel, st.size]);
}

function tilesV(lane) {
  if (lane !== 'atlas') return null;
  let s; try { s = fs.readFileSync(path.join(LANES.atlas.base, 'index.html'), 'utf8'); } catch (e) { return null; }
  const m = /\b(?:var|let|const)\s+TILES_V\s*=\s*(?:(["'])([^"']*)\1|([\w.-]+))/.exec(s);
  return m ? (m[2] !== undefined ? m[2] : m[3]) : null;
}

function build(lane) {
  const L = LANES[lane], list = [];
  if (L.roots) L.roots.forEach(r => walk(L.base, r, list)); else walk(L.base, '', list);
  list.sort((a, b) => cmp(a[0], b[0]));
  const files = [], groups = {}, all = crypto.createHash('sha256');
  let total = 0;
  for (const [p, bytes] of list) {
    if (L.skip.has(p)) continue;
    const e = { bytes, path: p };
    if (lane === 'atlas' && RASTER_DIRS.includes(p.split('/')[0]) && RASTER_EXT.test(p)) {
      e.sha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(L.base, p))).digest('hex');
      all.update(p + '\0' + e.sha256 + '\n');
    }
    files.push(e);
    const g = p.includes('/') ? p.split('/')[0] : '.';
    (groups[g] = groups[g] || { bytes: 0, files: 0 });
    groups[g].bytes += bytes; groups[g].files++; total += bytes;
  }
  return { files, groups, kind: lane, rasters: all.digest('hex'), schema: 1, tileset: tilesV(lane), total: { bytes: total, files: files.length } };
}

const sortKeys = v => Array.isArray(v) ? v.map(sortKeys)
  : v && typeof v === 'object' ? Object.keys(v).sort(cmp).reduce((o, k) => (o[k] = sortKeys(v[k]), o), {}) : v;
const render = o => JSON.stringify(sortKeys(o), null, 1) + '\n';

function check(lane, explicit) {
  const file = path.join(LANES[lane].base, LANES[lane].out);
  if (!fs.existsSync(file)) {
    if (!explicit) { console.error(lane + ': no manifest, skipped'); return 0; }
    console.error(lane + ': ' + LANES[lane].rel + ' missing; run --' + lane); return 1;
  }
  const old = JSON.parse(fs.readFileSync(file, 'utf8')), cur = build(lane);
  if (old.tileset !== cur.tileset) { console.error(lane + ': TILES_V moved (' + old.tileset + ' -> ' + cur.tileset + '); regenerate'); return 0; }
  if (old.rasters !== cur.rasters) {
    const was = new Map((old.files || []).map(f => [f.path, f.sha256]));
    const bad = cur.files.filter(f => f.sha256 && was.get(f.path) !== f.sha256).map(f => f.path);
    const gone = [...was.keys()].filter(p => was.get(p) && !cur.files.some(f => f.path === p));
    console.error(lane + ': rasters changed but TILES_V did not (' + bad.concat(gone).slice(0, 5).join(', ') + '); bump TILES_V');
    return 1;
  }
  if (render(old) !== render(cur)) { console.error(lane + ': manifest is stale; run --' + lane); return 1; }
  console.error(lane + ': ok');
  return 0;
}

if (flag('--check')) {
  const lanes = flag('--atlas') ? ['atlas'] : flag('--sim') ? ['sim'] : ['atlas', 'sim'];
  const explicit = flag('--atlas') || flag('--sim');
  process.exit(lanes.map(l => check(l, explicit)).some(Boolean) ? 1 : 0);
}
const lane = flag('--atlas') ? 'atlas' : flag('--sim') ? 'sim' : null;
if (!lane) { console.error('usage: build-offline-manifest.js (--atlas | --sim | --check) [--root DIR]'); process.exit(2); }
const out = path.join(LANES[lane].base, LANES[lane].out);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, render(build(lane)));
console.error('wrote ' + LANES[lane].rel);
