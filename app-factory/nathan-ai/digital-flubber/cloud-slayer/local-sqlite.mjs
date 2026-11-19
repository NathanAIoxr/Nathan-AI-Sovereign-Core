import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

export function openLocalRegistry(filename = ':memory:') {
  const sqlite = new DatabaseSync(filename);
  sqlite.exec(readFileSync(new URL('migrations/0001_registry.sql', import.meta.url), 'utf8'));
  const prepare = (sql, params = []) => {
    const statement = sqlite.prepare(sql);
    return {
      bind: (...values) => prepare(sql, values),
      first: async () => statement.get(...params) ?? null,
      all: async () => ({ results: statement.all(...params) })
    };
  };
  return {
    sqlite,
    prepare,
    batch: statements => Promise.all(statements.map(statement => statement.all()))
  };
}
