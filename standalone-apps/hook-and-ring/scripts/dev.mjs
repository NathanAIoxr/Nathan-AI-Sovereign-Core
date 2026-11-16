import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import worker from '../dist/worker.mjs';

const sqlite = new DatabaseSync(':memory:');
for (const name of ['0000_tournament.sql', '0001_arcade_events.sql']) {
  sqlite.exec(await readFile(new URL('../migrations/' + name, import.meta.url), 'utf8'));
}
const DB = {
  prepare(sql) {
    const statement = sqlite.prepare(sql);
    return { bind: (...values) => ({
      all: async () => ({ results: statement.all(...values) }),
      first: async () => statement.get(...values) ?? null,
      run: async () => ({ meta: statement.run(...values) }),
    }), first: async () => statement.get() ?? null };
  },
};
const port = Number(process.env.PORT ?? 8787);
createServer(async (req, res) => {
  try {
    const chunks = [];
    let length = 0;
    for await (const chunk of req) {
      length += chunk.byteLength;
      if (length > 8192) {
        res.writeHead(413).end('Request too large.');
        return;
      }
      chunks.push(chunk);
    }
    const request = new Request(new URL(req.url, 'http://127.0.0.1:' + port), {
      method: req.method, headers: req.headers, body: length ? Buffer.concat(chunks) : undefined,
    });
    const response = await worker.fetch(request, { DB });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    res.writeHead(500).end('Local game request failed.');
  }
}).listen(port, '127.0.0.1', () => console.log('Hook and Ring at http://127.0.0.1:' + port));
