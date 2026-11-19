import { readFile } from 'node:fs/promises';
import { availableChats, importChatEntries } from '../public/archive.js';
import { memoryClient } from './client.js';

const [mode, file, ...ids] = process.argv.slice(2);
if (!file || !['--preview', '--write'].includes(mode) || (mode === '--write' && !ids.length)) {
  throw new Error('Use --preview conversations.json or --write conversations.json <chat-id> [more-chat-ids].');
}
const chats = availableChats(JSON.parse(await readFile(file, 'utf8')));
if (mode === '--preview') {
  for (const { id, title, messages } of chats) console.log(JSON.stringify({ id, title, messages: messages.length }));
} else {
  const wanted = new Set(ids);
  const matches = chats.filter(chat => wanted.has(chat.id));
  if (matches.length !== wanted.size) throw new Error('A selected conversation ID was missing.');
  const client = memoryClient();
  const result = await importChatEntries(matches, body => client('/import', body));
  console.log('Saved ' + result.saved + ' records. Skipped ' + result.duplicates + ' duplicates.');
}
