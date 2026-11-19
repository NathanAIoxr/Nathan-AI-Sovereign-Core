import { readFile } from 'node:fs/promises';
import { memoryClient } from './client.js';

const file = process.argv[2];
if (!file) throw new Error('Usage: npm run import -- notes.json');
const parsed = JSON.parse(await readFile(file, 'utf8'));
const entries = Array.isArray(parsed) ? parsed : parsed?.entries;
if (!Array.isArray(entries) || !entries.length) throw new Error('Expected an array or an object containing entries.');
const client = memoryClient();
let page = [];
let bytes = Buffer.byteLength('{"entries":[]}');
let saved = 0;
let duplicates = 0;
let completed = 0;

async function send() {
  if (!page.length) return;
  try {
    const response = await client('/import', { entries: page });
    saved += response.saved;
    duplicates += response.duplicates;
    completed += page.length;
  } catch (error) {
    throw new Error('Import stopped at entries ' + (completed + 1) + '–' +
      (completed + page.length) + '. ' + error.message + ' Previous batches can be retried.');
  }
  page = [];
  bytes = Buffer.byteLength('{"entries":[]}');
}

for (const entry of entries) {
  const length = Buffer.byteLength(JSON.stringify(entry)) + 1;
  if (length > 500 * 1024) throw new Error('An entry exceeds the import size limit.');
  if (page.length === 40 || bytes + length > 500 * 1024) await send();
  page.push(entry);
  bytes += length;
}
await send();
console.log('Saved ' + saved + ' memories. Skipped ' + duplicates + ' duplicates.');
