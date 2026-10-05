// Minimal static server for local preview of the ANNALS single-file app.
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const root = __dirname;
const mime = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.txt':'text/plain; charset=utf-8', '.md':'text/markdown; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.geojson':'application/geo+json; charset=utf-8',
  '.webmanifest':'application/manifest+json; charset=utf-8', '.svg':'image/svg+xml',
  '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.gif':'image/gif',
  '.ico':'image/x-icon', '.woff2':'font/woff2', '.woff':'font/woff', '.ttf':'font/ttf', '.otf':'font/otf',
  '.wasm':'application/wasm', '.pgd':'application/octet-stream'
};
const gz = new Set(['.html', '.js', '.mjs', '.css', '.json', '.geojson', '.svg', '.webmanifest', '.txt', '.md']);
const raster = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.ico']);
const cache = new Map();   // file -> {mtime, size, gz}
function cc(rel, ext, q){
  if(/(^|&)t=/.test(q) || rel.startsWith('/vendor/') || rel.includes('/vendor/')) return 'public, max-age=31536000, immutable';
  if(raster.has(ext)) return 'public, max-age=2592000';
  return 'no-cache';   // html, sw*.js, data/*.json, offline-manifest.json and the rest revalidate by ETag
}
http.createServer((req, res) => {
  if(req.method !== 'GET' && req.method !== 'HEAD'){ res.writeHead(405, {Allow:'GET, HEAD'}); return res.end(); }
  const q = (req.url.split('#')[0].split('?')[1]) || '';
  let p;
  try { p = decodeURIComponent(req.url.split('?')[0].split('#')[0]); } catch(e){ res.writeHead(400); return res.end(); }
  if(p.endsWith('/')) p += 'index.html';   // '/' → the sim, '/maps-site/' → the atlas
  const f = path.normalize(path.join(root, p));
  if(!f.startsWith(root)){ res.writeHead(403); return res.end(); }
  fs.stat(f, (err, st) => {
    if(err || !st.isFile()){ res.writeHead(404); return res.end('not found'); }
    fs.readFile(f, (err2, data) => {
      if(err2){ res.writeHead(404); return res.end('not found'); }
      const ext = path.extname(f).toLowerCase();
      const rel = '/' + path.relative(root, f).split(path.sep).join('/');
      const wantGz = gz.has(ext) && data.length > 256 && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
      const h = {
        'Content-Type': mime[ext] || 'application/octet-stream',
        'Cache-Control': cc(rel, ext, q),
        'Last-Modified': st.mtime.toUTCString()
      };
      if(gz.has(ext)) h['Vary'] = 'Accept-Encoding';
      h['ETag'] = 'W/"' + st.size.toString(16) + '-' + Math.floor(st.mtimeMs).toString(16) + (wantGz ? '-gz' : '') + '"';
      const inm = req.headers['if-none-match'];
      if(inm && inm.split(',').some(t => t.trim() === h['ETag'] || t.trim() === '*' || t.trim().replace(/^W\//, '') === h['ETag'].replace(/^W\//, ''))){
        res.writeHead(304, h); return res.end();
      }
      let body = data;
      if(wantGz){
        let c = cache.get(f);
        if(!c || c.mtime !== st.mtimeMs || c.size !== st.size){ c = {mtime: st.mtimeMs, size: st.size, gz: zlib.gzipSync(data, {level: 9})}; cache.set(f, c); }
        body = c.gz; h['Content-Encoding'] = 'gzip';
      }
      h['Content-Length'] = body.length;
      res.writeHead(200, h);
      res.end(req.method === 'HEAD' ? undefined : body);
    });
  });
}).listen(+process.env.PORT || 8544, function(){ console.log('annals dev server: http://localhost:' + this.address().port); });
