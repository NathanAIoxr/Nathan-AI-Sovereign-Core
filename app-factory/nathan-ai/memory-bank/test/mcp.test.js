import { createServer } from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const script = fileURLToPath(new URL('../scripts/mcp.js', import.meta.url));

test('an MCP stdio client can discover tools, save, recall and restrict writes', async (t) => {
  const received = [];
  const http = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk.toString();
    received.push({ method: request.method, url: request.url, auth: request.headers.authorization, body });
    response.setHeader('Content-Type', 'application/json');
    if (request.method === 'POST') response.end('{"status":"saved","id":1,"title":"Orbit"}');
    else response.end('{"count":1,"memories":[{"id":1,"title":"Orbit"}],"next_before_id":null}');
  });
  http.listen(0, '127.0.0.1');
  t.after(() => http.close());
  await once(http, 'listening');
  const origin = 'http://127.0.0.1:' + http.address().port + '/memory-bank';
  async function connect(key, readOnly) {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [script],
      env: { MEMORY_BASE_URL: origin, MEMORY_API_KEY: key, MEMORY_READ_ONLY: readOnly }
    });
    const client = new Client({ name: 'test', version: '1.0.0' });
    t.after(() => transport.close());
    await client.connect(transport);
    return client;
  }
  const client = await connect('write-test', '0');
  assert.deepEqual((await client.listTools()).tools.map((tool) => tool.name), ['recall_memory', 'save_memory']);
  const saved = await client.callTool({ name: 'save_memory', arguments: { title: 'Orbit', content: 'Original wording' } });
  assert.equal(JSON.parse(saved.content[0].text).id, 1);
  const read = await connect('read-test', '1');
  assert.deepEqual((await read.listTools()).tools.map((tool) => tool.name), ['recall_memory']);
  const recalled = await read.callTool({ name: 'recall_memory', arguments: { q: 'Orbit', limit: 2 } });
  assert.equal(JSON.parse(recalled.content[0].text).memories[0].title, 'Orbit');
  const denied = await read.callTool({ name: 'save_memory', arguments: { title: 'x', content: 'y' } });
  assert.equal(denied.isError, true);
  assert.deepEqual(received, [
    { method: 'POST', url: '/memory-bank/remember', auth: 'Bearer write-test', body: '{"title":"Orbit","content":"Original wording"}' },
    { method: 'GET', url: '/memory-bank/recall?limit=2&q=Orbit', auth: 'Bearer read-test', body: '' }
  ]);
  await read.close();
  await client.close();
});
