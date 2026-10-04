#!/usr/bin/env node
// filigree-dem.js - read-only probe of the sim's embedded heightfield EPESHU_HF (index.html).
// Written 2026-10-04 for Filigree Job 1 (q09). Plain Node: fs, path, zlib only; no clock, no random.
// Usage: node tools/filigree-dem.js --at x,y
//        node tools/filigree-dem.js --bbox x0,y0,x1,y1 [--min-prom 15]
// Transform: PNG 768x768 RGB, h = (R*256+G)/32 - 300 m. Cell (gx,gy) covers atlas
// [1060+gx*800/768, 1060+(gx+1)*800/768) x [1240+gy*800/768, ...); centre = +0.5 cell.
// --at: h of the CONTAINING cell, null outside the half-open window [1060,1860) x [1240,2040).
// --bbox: every cell whose CENTRE lies in the half-open box [x0,x1) x [y0,y1); no interpolation.
//   land_frac = share of those cells with h >= 0; hmin/hmax over those cells (null if none).
//   peaks = 8-connected local maxima (equal-height plateaus count once, row-major first cell)
//   with prominence >= min-prom (default 15 m), computed inside the bbox cells only: prom = h minus the
//   highest saddle that joins the peak to higher ground; the box's highest peak takes h - hmin.
// This is the RAW decode: genHydrology carves the sim's W.H, which is not read here.
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const X0 = 1060, Y0 = 1240, N = 768, SPAN = 800, K = SPAN / N;

function load() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const m = /const EPESHU_HF_URI\s*=\s*'data:image\/png;base64,([A-Za-z0-9+\/=]+)'/.exec(src);
  if (!m) throw new Error('EPESHU_HF_URI not found');
  const buf = Buffer.from(m[1], 'base64');
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let p = 8, w = 0, h = 0, depth = 0, ct = 0, il = 0; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('latin1', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); depth = d[8]; ct = d[9]; il = d[12]; }
    else if (type === 'IDAT') idat.push(d);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  if (w !== N || h !== N || depth !== 8 || ct !== 2 || il !== 0) throw new Error('unexpected PNG format ' + [w, h, depth, ct, il]);
  const raw = zlib.inflateSync(Buffer.concat(idat)), bpp = 3, stride = N * bpp;
  const out = Buffer.alloc(N * stride);
  for (let y = 0; y < N; y++) {
    const f = raw[y * (stride + 1)], s = y * (stride + 1) + 1, o = y * stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? out[o + i - bpp] : 0, b = y ? out[o - stride + i] : 0, c = (y && i >= bpp) ? out[o - stride + i - bpp] : 0;
      let v = raw[s + i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      else if (f !== 0) throw new Error('bad filter ' + f);
      out[o + i] = v & 255;
    }
  }
  const H = new Float64Array(N * N);
  for (let i = 0; i < N * N; i++) H[i] = (out[i * 3] * 256 + out[i * 3 + 1]) / 32 - 300;
  return H;
}
const r2 = v => Math.round(v * 100) / 100;
const num = s => { const a = String(s).split(',').map(Number); if (a.some(v => !isFinite(v))) throw new Error('bad numbers: ' + s); return a; };

function at(H, x, y) {
  const gx = Math.floor((x - X0) * N / SPAN), gy = Math.floor((y - Y0) * N / SPAN);
  if (!(x >= X0 && x < X0 + SPAN && y >= Y0 && y < Y0 + SPAN) || gx < 0 || gy < 0 || gx >= N || gy >= N) return { h: null };
  return { h: r2(H[gy * N + gx]) };
}

function bbox(H, x0, y0, x1, y1, minProm) {
  // cell centre = X0 + (g+0.5)*K in [x0,x1)  =>  g in [ceil((x0-X0)/K-0.5), ceil((x1-X0)/K-0.5)-1]
  const lo = (a, o) => Math.max(0, Math.ceil((a - o) / K - 0.5)), hi = (b, o) => Math.min(N - 1, Math.ceil((b - o) / K - 0.5) - 1);
  const gx0 = lo(x0, X0), gx1 = hi(x1, X0), gy0 = lo(y0, Y0), gy1 = hi(y1, Y0);
  const w = gx1 - gx0 + 1, hh = gy1 - gy0 + 1;
  if (w <= 0 || hh <= 0) return { land_frac: null, hmin: null, hmax: null, peaks: [] };
  const n = w * hh, v = new Float64Array(n); let land = 0, hmin = Infinity, hmax = -Infinity;
  for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) {
    const h = H[(gy0 + j) * N + gx0 + i]; v[j * w + i] = h;
    if (h >= 0) land++; if (h < hmin) hmin = h; if (h > hmax) hmax = h;
  }
  // descending flood: a cell with no already-placed neighbour births a peak; joining two components
  // kills the lower peak with prominence = its h - the saddle (current cell) h.
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => v[b] - v[a] || a - b);
  const par = new Int32Array(n).fill(-1), top = new Int32Array(n), peaks = [];
  const find = a => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
  const better = (a, b) => v[a] > v[b] || (v[a] === v[b] && a < b);
  for (const c of order) {
    const cx = c % w, cy = (c - cx) / w; par[c] = c; top[c] = c; let born = true;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= hh) continue;
      const q = ny * w + nx; if (par[q] < 0) continue;
      born = false;
      const a = find(c), b = find(q); if (a === b) continue;
      let win = a, lose = b; if (better(top[b], top[a])) { win = b; lose = a; }
      peaks.push({ i: top[lose], prom: v[top[lose]] - v[c] });
      par[lose] = win;
    }
    void born;
  }
  const root = find(order[0]); peaks.push({ i: top[root], prom: v[top[root]] - hmin });
  const list = peaks.filter(p => p.prom >= minProm).map(p => {
    const gx = gx0 + p.i % w, gy = gy0 + Math.floor(p.i / w);
    return { x: r2(X0 + (gx + 0.5) * K), y: r2(Y0 + (gy + 0.5) * K), h: r2(v[p.i]), prom: r2(p.prom) };
  }).sort((a, b) => b.h - a.h || a.y - b.y || a.x - b.x);
  return { land_frac: Math.round(land / n * 10000) / 10000, hmin: r2(hmin), hmax: r2(hmax), peaks: list };
}

function main(argv) {
  const H = load(); let res;
  const k = argv.indexOf('--min-prom'), minProm = k >= 0 ? Number(argv[k + 1]) : 15;
  if (argv[0] === '--at') { const [x, y] = num(argv[1]); res = at(H, x, y); }
  else if (argv[0] === '--bbox') { const [a, b, c, d] = num(argv[1]); res = bbox(H, a, b, c, d, minProm); }
  else { console.error('usage: filigree-dem.js --at x,y | --bbox x0,y0,x1,y1 [--min-prom m]'); process.exit(2); }
  process.stdout.write(JSON.stringify(res) + '\n');
}
if (require.main === module) main(process.argv.slice(2)); else module.exports = { load, at, bbox };
