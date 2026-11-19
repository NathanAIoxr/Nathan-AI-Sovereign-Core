import assert from 'node:assert/strict';
import { test } from 'node:test';
import bridge from '../deploy/tabor-bridge.js';

test('bridge keeps its original root and routes only the Memory Bank prefix', async () => {
  const root = await bridge.fetch(new Request('https://bridge.test/'), {});
  assert.equal(await root.text(), 'Hello World!');
  const slash = await bridge.fetch(new Request('https://bridge.test/memory-bank?category=games'), {});
  assert.equal(slash.status, 308);
  assert.equal(slash.headers.get('Location'), 'https://bridge.test/memory-bank/?category=games');

  const env = {
    MEMORY_PLATFORM: {
      get(name) {
        assert.equal(name, 'nathan-ai-memory-bank');
        return {
          async fetch(request) {
            assert.equal(request.url, 'https://bridge.test/remember?test=1');
            assert.equal(request.method, 'POST');
            assert.equal(request.headers.get('Authorization'), 'Bearer mock');
            return Response.json(await request.json());
          }
        };
      }
    }
  };
  const routed = await bridge.fetch(new Request('https://bridge.test/memory-bank/remember?test=1', {
    method: 'POST',
    headers: { Authorization: 'Bearer mock' },
    body: '{"title":"Fictional"}'
  }), env);
  assert.deepEqual(await routed.json(), { title: 'Fictional' });
});
