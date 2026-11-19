import { createServer } from 'node:http';
import main from './dist/main.mjs';
import slubber from './dist/slubber.mjs';
import sos from './dist/sos.mjs';

const services = {
  SLUBBER: { fetch: url => slubber.fetch(new Request(url)) },
  SOS: { fetch: url => sos.fetch(new Request(url)) }
};
createServer(async (incoming, outgoing) => {
  try {
    const response = await main.fetch(new Request('http://localhost' + incoming.url, { method: incoming.method }), services);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    outgoing.writeHead(500).end('Local preview error');
  }
}).listen(Number(process.env.FLUBBER_PORT ?? 8787), '127.0.0.1');
