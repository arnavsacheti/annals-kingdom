// Lint DEPLOY.md against server.js: node tools/lint-deploy.js (prints one line per mismatch, exit 1 on any).
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), cp = require('child_process'), net = require('net');
const root = path.join(__dirname, '..');
const md = fs.readFileSync(path.join(root, 'DEPLOY.md'), 'utf8');
const bad = [];
const cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim().replace(/`/g, ''));
const rows = hdr => {
  const L = md.split('\n'), out = [];
  const i = L.findIndex(l => cells(l).join('|') === hdr.join('|'));
  if(i < 0){ bad.push('missing table: ' + hdr.join(' | ')); return out; }
  for(let j = i + 2; j < L.length && /^\s*\|/.test(L[j]); j++) out.push(cells(L[j]));
  return out;
};
const t1 = rows(['path class', 'example path', 'Cache-Control', 'Content-Type', 'Content-Encoding']);
const t2 = rows(['request path', 'sim block answers']);
// a temp root holds server.js plus the repo file (or a stub where it is not built yet) for each example
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-deploy-'));
fs.copyFileSync(path.join(root, 'server.js'), path.join(tmp, 'server.js'));
for(const r of t1){
  const rel = r[1].split('?')[0], src = path.join(root, rel), dst = path.join(tmp, rel);
  fs.mkdirSync(path.dirname(dst), {recursive: true});
  if(fs.existsSync(src)) fs.copyFileSync(src, dst); else fs.writeFileSync(dst, '/* stub */\n'.repeat(200));
}
const free = () => new Promise(res => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });
const get = (port, p) => new Promise((res, rej) => http.get({port, path: p, headers: {'Accept-Encoding': 'gzip'}}, r => { r.resume(); r.on('end', () => res(r)); }).on('error', rej));
(async () => {
  const port = await free();
  const srv = cp.spawn(process.execPath, ['server.js'], {cwd: tmp, env: Object.assign({}, process.env, {PORT: String(port)}), stdio: 'ignore'});
  try {
    for(let i = 0; i < 50; i++){ try { await get(port, '/'); break; } catch(e){ await new Promise(r => setTimeout(r, 100)); } }
    for(const [cls, p, cc, ct, ce] of t1){
      const r = await get(port, p), h = r.headers;
      const got = [h['cache-control'] || '', h['content-type'] || '', h['content-encoding'] || 'none'], want = [cc, ct, ce || 'none'];
      ['Cache-Control', 'Content-Type', 'Content-Encoding'].forEach((n, k) => { if(got[k] !== want[k]) bad.push(`${cls} ${p}: ${n} is "${got[k]}", DEPLOY.md says "${want[k]}"`); });
      if(r.statusCode !== 200) bad.push(`${cls} ${p}: status ${r.statusCode}`);
    }
  } finally { srv.kill(); fs.rmSync(tmp, {recursive: true, force: true}); }
  // the sim block: dotfile denial, then the allowlist regex; anything else falls to index.html (or 404)
  const sec = md.split(/^## /m).find(s => /^sim\.princexizor/.test(s)) || '';
  const m = sec.match(/location ~ (\^\/\([^\n]*?\)\?\$) \{/), d = sec.match(/location ~ (\/\\\.) \{/);
  if(!m) bad.push('sim block: no allowlist `location ~ ^/(...)?$` line');
  if(!d) bad.push('sim block: no dotfile denial `location ~ /\\.`');
  if(m && d){
    const allow = new RegExp(m[1]), dot = new RegExp(d[1]);
    for(const [p, want] of t2){
      const got = !dot.test(p) && allow.test(p) ? 'file' : 'index.html-or-404';
      if(got !== want) bad.push(`sim block ${p}: regex answers ${got}, DEPLOY.md says ${want}`);
    }
  }
  if(!/for f in vendor sw\.js sw-kill\.js offline-manifest\.json; do \[ -e "\$f" \] && cp -R "\$f" _site\/; done/.test(fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8'))) bad.push('pages.yml: staging loop missing');
  for(const b of bad) console.log(b);
  process.exit(bad.length ? 1 : 0);
})();
