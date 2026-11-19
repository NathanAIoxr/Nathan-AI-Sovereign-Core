import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

export function openLocalRegistry(filename = ':memory:') {
  const sqlite = new DatabaseSync(filename);
  for (const file of ['0001_registry.sql', '0002_tool_library.sql']) {
    sqlite.exec(readFileSync(new URL('migrations/' + file, import.meta.url), 'utf8'));
  }
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
