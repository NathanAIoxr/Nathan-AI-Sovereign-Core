'use strict';
// Opt-in, read-only static app host. No APIs, tokens, pairing, remote commands,
// device discovery, private document ingestion, or computation offloading.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const ROOT = path.resolve(__dirname, '../../../..');
const FACTORY = path.join(ROOT, 'app-factory');
const START = '/app-factory/nathan-ai/operations/turnaround/';
const TYPES = Object.freeze({
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp',
  '.ico':'image/x-icon', '.woff':'font/woff', '.woff2':'font/woff2',
  '.webmanifest':'application/manifest+json', '.md':'text/plain; charset=utf-8'
});
const DENY = new Set(['.git', '.github', 'private', 'private-samples',
  'secrets', 'node_modules', '.env', 'backups', 'vault-exports']);

function options(argv) {
  const parsed = { host:'127.0.0.1', port:8787, lan:false, help:false };
  for (let i = 0; i < argv.length; i++) {
    const item = argv[i];
    if (item === '--lan') parsed.lan = true;
    else if (item === '--help' || item === '-h') parsed.help = true;
    else if (item === '--host' && argv[i+1]) parsed.host = argv[++i];
    else if (item === '--port' && argv[i+1]) parsed.port = Number(argv[++i]);
    else throw new Error('Unknown or incomplete option: ' + item);
  }
  if (!['127.0.0.1','localhost','0.0.0.0'].includes(parsed.host)) {
    throw new Error('Host must be loopback or 0.0.0.0 (explicit Wi-Fi LAN)');
  }
  if (parsed.host === '0.0.0.0' && !parsed.lan) {
    throw new Error('LAN binding requires --lan to confirm local network exposure');
  }
  if (!Number.isInteger(parsed.port) || parsed.port < 0 || parsed.port > 65535) {
    throw new Error('Port must be an integer from 0 to 65535');
  }
  return parsed;
}

function pathnameToFile(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); }
  catch { return null; }
  if (decoded === '/') decoded = START + 'index.html';
  if (decoded.endsWith('/')) decoded += 'index.html';
  if (decoded.includes('\\') || decoded.includes('\0') || decoded.includes('%') ||
      decoded.includes('//')) return null;
  const parts = decoded.split('/').filter(Boolean);
  if (parts[0] !== 'app-factory' || parts.length < 3 ||
      parts.some(p => p === '.' || p === '..' || p.startsWith('.') || DENY.has(p.toLowerCase()))) return null;
  const full = path.resolve(ROOT, ...parts);
  if (!(full.startsWith(FACTORY + path.sep))) return null;
  if (!Object.hasOwn(TYPES, path.extname(full).toLowerCase())) return null;
  return full;
}

function createServer() {
  return http.createServer((req, res) => {
    const baseHeaders = {
      'X-Content-Type-Options':'nosniff',
      'Referrer-Policy':'no-referrer',
      'Cache-Control':'no-store',
      'Cross-Origin-Resource-Policy':'same-origin',
      'Content-Security-Policy':"default-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, {...baseHeaders, Allow:'GET, HEAD'}); res.end('Read-only application host'); return;
    }
    let url;
    try { url = new URL(req.url, 'http://localhost'); }
    catch { res.writeHead(400, baseHeaders); res.end('Bad request'); return; }
    const pathname = pathnameToFile(url.pathname);
    if (!pathname) { res.writeHead(404, baseHeaders); res.end('Not found'); return; }
    fs.realpath(pathname, (resolveError, real) => {
      // Reject symlinks or a local checkout that redirects into private files.
      if (resolveError || real !== pathname) {
        res.writeHead(404, baseHeaders); res.end('Not found'); return;
      }
      fs.stat(pathname, (error, stat) => {
        if (error || !stat.isFile()) { res.writeHead(404, baseHeaders); res.end('Not found'); return; }
        const type = TYPES[path.extname(pathname).toLowerCase()];
        res.writeHead(200, {...baseHeaders, 'Content-Type': type, 'Content-Length': stat.size });
        if (req.method === 'HEAD') { res.end(); return; }
        const stream = fs.createReadStream(pathname);
        stream.on('error', () => res.destroy());
        stream.pipe(res);
      });
    });
  });
}
if (require.main === module) {
  try {
    const parsed = options(process.argv.slice(2));
    if (parsed.help) {
      process.stdout.write([
        'Nathan AI Sovereign Light: read-only app on your own network.',
        'Local device: node network-server.cjs',
        'Opt-in Wi-Fi LAN: node network-server.cjs --host 0.0.0.0 --lan --port 8787',
        'Other Wi-Fi devices: http://YOUR-LAN-IP:8787/app-factory/nathan-ai/operations/turnaround/',
        'Cellular: use HTTPS GitHub Pages after merge/deployment; this HTTP host never exposes itself publicly.',
        'No access credentials or API tokens required for the app. Do not forward the LAN port to the internet.',
      ].join('\n') + '\n');
    } else {
      createServer().listen(parsed.port, parsed.host, () => {
        const scope = parsed.host === '0.0.0.0' ? 'YOUR LOCAL NETWORK (opt-in)' : 'this device only';
        process.stdout.write('Nathan AI on ' + scope + '\n');
        process.stdout.write('Open http://' + (parsed.host === '0.0.0.0' ? 'YOUR-LAN-IP' : parsed.host) +
          ':' + parsed.port + START + '\n');
        process.stdout.write('Read-only app; no tokens, private-file upload or network task execution.\n');
      });
    }
  } catch (error) {
    process.stderr.write(error.message + '\n');
    process.exitCode = 1;
  }
}
module.exports = { options, pathnameToFile, createServer, START };
