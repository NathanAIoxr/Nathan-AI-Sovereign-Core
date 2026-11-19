import { createServer } from 'node:http';
import anubis from './workers/anubis.mjs';
import karma from './workers/karma.mjs';
import finale from './workers/finale.mjs';
import texts from './workers/texts.mjs';
import domino from './workers/domino.mjs';

const routes = { anubis, karma, finale, texts, domino };
const env = { ANUBIS: anubis, KARMA: karma, FINALE: finale, TEXTS: texts };
const service = process.argv[2] ?? 'finale';
if (!Object.hasOwn(routes, service)) throw new Error('Unknown preview: ' + service);
const port = Number(process.env.PORT ?? 8787);
createServer(async (incoming, outgoing) => {
  const request = new Request(new URL(incoming.url, 'http://127.0.0.1:' + port), { method: incoming.method });
  try {
    const result = await routes[service].fetch(request, env);
    outgoing.writeHead(result.status, Object.fromEntries(result.headers));
    outgoing.end(Buffer.from(await result.arrayBuffer()));
  } catch (error) {
    console.error(error);
    outgoing.writeHead(500).end('Preview unavailable');
  }
}).listen(port, '127.0.0.1', () => console.log(`${service} at http://127.0.0.1:${port}`));
