// Minimal static server for local preview of the ANNALS single-file app.
const http = require('http'), fs = require('fs'), path = require('path');
const root = __dirname;
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.txt':'text/plain', '.png':'image/png', '.json':'application/json' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if(p === '/') p = '/index.html';
  const f = path.normalize(path.join(root, p));
  if(!f.startsWith(root)){ res.writeHead(403); return res.end(); }
  fs.readFile(f, (err, data) => {
    if(err){ res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, {'Content-Type': mime[path.extname(f).toLowerCase()] || 'application/octet-stream'});
    res.end(data);
  });
}).listen(8544, () => console.log('annals dev server: http://localhost:8544'));
