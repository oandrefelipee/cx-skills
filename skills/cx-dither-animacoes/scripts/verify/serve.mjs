#!/usr/bin/env node
/**
 * serve.mjs - servidor estatico Node, sem dependencias, robusto sob carga.
 *
 *   node serve.mjs <pasta> [porta]        (porta padrao 8790; 0 = porta livre)
 *
 * Por que existe: `python -m http.server` derruba conexoes (ERR_CONNECTION_RESET) quando
 * varios verificadores/abas rodam juntos, e file:// bloqueia texturas WebGL e mascaras CSS.
 * Aqui: keep-alive, streams com tratamento de erro, MIME corretos (incl. .mjs/.svg/.wasm),
 * sem cache, protecao contra path traversal, index.html em diretorios, CORS aberto.
 * Imprime "SERVING <url>" quando pronto. Encerre com Ctrl+C / SIGTERM (so o PID que voce iniciou).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const port = process.argv[3] != null ? Number(process.argv[3]) : 8790;
if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error('pasta invalida:', root);
  process.exit(2);
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.map': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm', '.mp4': 'video/mp4', '.webm': 'video/webm', '.glsl': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.normalize(path.join(root, urlPath));
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end('forbidden'); return; }
    let st;
    try { st = fs.statSync(file); } catch { res.writeHead(404, { 'content-type': 'text/plain' }).end('404 ' + urlPath); return; }
    if (st.isDirectory()) {
      if (!urlPath.endsWith('/')) { res.writeHead(301, { location: urlPath + '/' }).end(); return; }
      file = path.join(file, 'index.html');
      try { st = fs.statSync(file); } catch { res.writeHead(404, { 'content-type': 'text/plain' }).end('404 ' + urlPath + 'index.html'); return; }
    }
    res.writeHead(200, {
      'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'content-length': st.size,
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'connection': 'keep-alive',
    });
    if (req.method === 'HEAD') { res.end(); return; }
    const s = fs.createReadStream(file);
    s.on('error', () => res.destroy());
    res.on('close', () => s.destroy());
    s.pipe(res);
  } catch (e) {
    if (!res.headersSent) res.writeHead(400, { 'content-type': 'text/plain' });
    res.end('bad request');
  }
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.on('clientError', (err, socket) => { if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n'); });
server.listen(port, '127.0.0.1', () => {
  console.log(`SERVING http://127.0.0.1:${server.address().port}/  (raiz: ${root})`);
});
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.close(() => process.exit(0)));
