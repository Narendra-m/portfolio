/**
 * scripts/server.mjs
 * Zero-dependency static file server using Node built-ins only.
 * Serves the project root on http://127.0.0.1:5173
 * Blocks directory traversal outside the project root.
 */

import { createServer }       from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath }      from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT      = resolve(__dirname, '..');
const PORT      = process.env.PORT ? parseInt(process.env.PORT) : 5173;
const HOST      = '127.0.0.1';

export const ROOT_DIR = ROOT;
export const SERVER_PORT = PORT;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.pdf':  'application/pdf',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.txt':  'text/plain; charset=utf-8',
  '.xml':  'application/xml',
};

function serveFile(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  // Resolve and guard against traversal
  const absolute = resolve(join(ROOT, decodeURIComponent(urlPath)));
  if (!absolute.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  let filePath = absolute;
  // Try index.html inside directories
  try {
    const st = statSync(filePath);
    if (st.isDirectory()) filePath = join(filePath, 'index.html');
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found: ' + urlPath);
    return;
  }

  const ext  = extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  let stat;
  try { stat = statSync(filePath); } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found: ' + urlPath);
    return;
  }

  res.writeHead(200, {
    'Content-Type':   mime,
    'Content-Length': stat.size,
    'Cache-Control':  'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });

  createReadStream(filePath).pipe(res);
}

// Export factory so generator scripts can start/stop the server
export function startServer(port = PORT) {
  return new Promise((resolveP) => {
    const server = createServer(serveFile);
    server.listen(port, HOST, () => {
      // port 0 binds an ephemeral port — read the real one back off the socket
      const bound = server.address().port;
      const addr = `http://${HOST}:${bound}`;
      console.log(`\n  ✦ Portfolio server running at ${addr}\n`);
      resolveP({ server, addr, port: bound });
    });
  });
}

// Run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer(PORT);
}
