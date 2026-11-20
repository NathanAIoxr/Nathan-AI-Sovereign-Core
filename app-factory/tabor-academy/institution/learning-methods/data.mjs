import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const read = file => readFile(new URL(file, import.meta.url), "utf8");
const source = await read("source.txt");
const activities = (await read("activities.txt")).trimEnd().split("\n");

const groups = [...source.matchAll(/^(\d)\. (.+) \((\d+)–(\d+)\)$/gm)].map(([, id, name, first, last]) => ({
  id: Number(id), name, first: Number(first), last: Number(last),
}));
const regions = source.split("What Else This Unlocks:");
const methods = [...regions[0].matchAll(/^(\d+)\. (.+?) — (.+)$/gm)].map(([, number, title, original], i) => {
  const id = Number(number);
  const group = groups.find(item => item.first <= id && id <= item.last);
  if (id !== i + 1 || !group || !activities[i]) throw new Error("Missing group or activity for method " + id);
  return { id, group: group.id, title, original, activity: activities[i] };
});
const channels = [...regions[1].matchAll(/^(\d)\. (.+?)\s*:\s*(.+)$/gm)].map(([, number, title, original]) => ({
  id: Number(number), title, original,
}));
if (methods.length !== 101 || activities.length !== 101 || groups.length !== 5 || channels.length !== 5) {
  throw new Error("Expected 101 activities, five categories and five channels");
}

export const learningMethods = { groups, methods, channels, source };
const quote = x => typeof x === "number" ? x : "'" + x.replaceAll("'", "''") + "'";
const tuples = rows => rows.map(row => "  (" + row.map(quote).join(", ") + ")").join(",\n");

export function seedSql() {
  return `-- Generated from learning-methods/data.mjs.
CREATE TABLE IF NOT EXISTS academy_learning_categories (
  id INTEGER PRIMARY KEY, label TEXT NOT NULL, first_method INTEGER NOT NULL, last_method INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS academy_learning_methods (
  id INTEGER PRIMARY KEY CHECK(id BETWEEN 1 AND 101), category_id INTEGER NOT NULL,
  title TEXT NOT NULL, original_text TEXT NOT NULL, activity TEXT NOT NULL,
  FOREIGN KEY(category_id) REFERENCES academy_learning_categories(id)
);
CREATE TABLE IF NOT EXISTS academy_learning_channels (
  id INTEGER PRIMARY KEY CHECK(id BETWEEN 1 AND 5), title TEXT NOT NULL, original_text TEXT NOT NULL
);
INSERT INTO academy_learning_categories(id,label,first_method,last_method) VALUES
${tuples(groups.map(g => [g.id,g.name,g.first,g.last]))}
ON CONFLICT(id) DO NOTHING;
INSERT INTO academy_learning_methods(id,category_id,title,original_text,activity) VALUES
${tuples(methods.map(m => [m.id,m.group,m.title,m.original,m.activity]))}
ON CONFLICT(id) DO NOTHING;
INSERT INTO academy_learning_channels(id,title,original_text) VALUES
${tuples(channels.map(c => [c.id,c.title,c.original]))}
ON CONFLICT(id) DO NOTHING;
INSERT INTO library_catalog (id,title,author,classification_code,r2_object_key,material_type,public_url) VALUES
  ('101-learning-methods','101 Hands-On Learning Methods','Tabor Academy','TA.LAB.101',NULL,'Learning collection','/tabor-academy/institution/learning-methods/'),
  ('101-learning-methods-source','101 Hands-On Learning Methods · Original submission','Supplied text','TA.LAB.102',NULL,'Original submission','/tabor-academy/institution/learning-methods/source.txt')
ON CONFLICT(id) DO NOTHING;
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.stdout.write(seedSql());
