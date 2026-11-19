import assert from 'node:assert/strict';
import { test } from 'node:test';
import { availableChats, chatEntries, importChatEntries } from '../public/archive.js';

function chat(id, content) {
  return {
    id,
    title: 'Orbit grid',
    current_node: 'answer',
    mapping: {
      root: { parent: null, children: ['question'] },
      question: {
        parent: 'root',
        children: ['system', 'branch'],
        message: { author: { role: 'user' }, create_time: 1733011200, content: { parts: ['  Exact words  '] } }
      },
      system: { parent: 'question', children: ['answer'], message: { author: { role: 'system' }, content: { parts: ['Hidden'] } } },
      answer: { parent: 'system', message: { author: { role: 'assistant' }, content: { parts: [content] } } },
      branch: { parent: 'question', message: { author: { role: 'assistant' }, content: { parts: ['old alternate'] } } }
    }
  };
}

test('ChatGPT export preserves selected branch, roles, exact text and chat provenance', () => {
  const source = 'a'.repeat(11999) + '🌱 tail';
  const records = [...chatEntries(availableChats({ conversations: [chat('chat-123', source)] }))];
  assert.equal(records.length, 3);
  assert.equal(records[0].content, '  Exact words  ');
  assert.equal(records[0].title, 'Orbit grid (user 1)');
  assert.match(records[0].tags, /conversation chat-123, 2024-12-01/);
  assert.equal(records[1].content + records[2].content, source);
  assert.equal(records[2].title, 'Orbit grid (assistant 2.2)');
  assert.equal(records[2].category, 'chatgpt-history');
});

test('archive writer only receives selected records and batches no more than 40', async () => {
  const source = availableChats(Array.from({ length: 41 }, (_, index) => chat('chat-' + index, 'fictional')));
  const slices = [];
  const results = await importChatEntries(source.slice(10, 35), async ({ entries }) => {
    slices.push(entries.length);
    assert.ok(entries.every(entry => /conversation chat-(1[0-9]|2[0-9]|3[0-4])(?:,|$)/.test(entry.tags)));
    return { saved: entries.length, duplicates: 0 };
  });
  assert.deepEqual(slices, [40, 10]);
  assert.equal(results.saved, 50);
});
