import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const root = new URL('../', import.meta.url);
const schema = new URL('migrations/d1/0001_board.sql', root);

export async function buildBoard() {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('PRAGMA foreign_keys = ON');
    db.exec(await readFile(schema, 'utf8'));
    return {
      dimensions: db.prepare('SELECT * FROM dimension ORDER BY cycle_order').all(),
      links: db.prepare('SELECT * FROM dimension_link ORDER BY source, direction').all(),
      beacons: db.prepare('SELECT * FROM beacon ORDER BY code, sector').all(),
      sectors: db.prepare('SELECT COUNT(*) AS total FROM sector').get().total
    };
  } finally {
    db.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = new URL('.build/', root);
  await mkdir(output, { recursive: true });
  await Promise.all([
    copyFile(new URL('src/page.html', root), new URL('index.html', output)),
    copyFile(new URL('src/client.mjs', root), new URL('client.mjs', output)),
    copyFile(new URL('src/game.mjs', root), new URL('game.mjs', output)),
    buildBoard().then(board => writeFile(new URL('board.json', output), JSON.stringify(board)))
  ]);
}
