import { readFile, writeFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { merkleRoot, rowHash, sha256, verifyRows } from "../shared/merkle.js";

const root = new URL("../", import.meta.url);
const legacy = Buffer.from(await readFile(new URL("public/exports/blueprints.json", root))).toString("utf8");
const lessons = JSON.parse(legacy).sort((a,b) => a.id-b.id);
const hashes = await Promise.all(lessons.map(rowHash));
if (new Set(hashes).size !== hashes.length) throw new Error("Duplicate canonical Blueprint answer rows");

const view = `CREATE TABLE IF NOT EXISTS blueprint_lifecycle (
  lesson_id INTEGER PRIMARY KEY REFERENCES blueprint_lessons(id),
  state TEXT NOT NULL CHECK (state IN ('verified', 'quarantined')),
  origin TEXT NOT NULL,
  verified_at INTEGER
);
CREATE TABLE IF NOT EXISTS blueprint_integrity (
  lesson_id INTEGER PRIMARY KEY REFERENCES blueprint_lessons(id),
  row_sha256 TEXT UNIQUE NOT NULL CHECK(length(row_sha256)=64 AND row_sha256 NOT GLOB '*[^0-9a-f]*'),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version>=1),
  state INTEGER NOT NULL DEFAULT 1 CHECK(state IN (-1,0,1))
);
CREATE VIEW IF NOT EXISTS blueprint_lessons_v7 AS
SELECT b.id, i.row_sha256, i.version, CASE WHEN l.state='quarantined' THEN 0 ELSE i.state END AS state,
  b.tier, b.domain, b.item_a_label, b.item_b_label, coalesce(b.item_c_label,'N/A — Two-Item Pair') AS item_c_label,
  b.clue_prompt, b.core_parts, b.operations, b.traits_attributes, b.scale_medium, b.input_output, b.flow_direction,
  b.modification_exemption, b.blind_spot_note, coalesce(m.object_key,'N/A — No Diagram') AS r2_diagram_key
FROM blueprint_lessons AS b
JOIN blueprint_integrity AS i ON i.lesson_id=b.id
LEFT JOIN blueprint_lifecycle AS l ON l.lesson_id=b.id
LEFT JOIN blueprint_media AS m ON m.lesson_id=b.id;
`;
const seed = lessons.map(({ id },i) => `INSERT INTO blueprint_integrity (lesson_id,row_sha256)
SELECT ${id}, '${hashes[i]}' WHERE EXISTS (SELECT 1 FROM blueprint_lessons WHERE id=${id})
ON CONFLICT(lesson_id) DO NOTHING;`).join("\n") + "\n";
const path = new URL("migrations/0007_phase7_integrity.sql",root);
const sql = view + seed;
if (process.argv.includes("--seed-baseline")) await writeFile(path,sql);
const db = new DatabaseSync(":memory:");
db.exec("PRAGMA foreign_keys=ON");
for (const file of ["0001_init.sql","0002_phase2.sql","0003_motor_schematic.sql","0004_closed_loop.sql",
  "0005_index_release.sql","0006_reviewed_aliases.sql","0007_phase7_integrity.sql"]) {
  db.exec(await readFile(new URL("migrations/"+file,root),"utf8"));
}
const list = db.prepare("SELECT * FROM blueprint_lessons_v7 WHERE state=1 ORDER BY id").all();
if (list.some(row => Object.keys(row).length !== 19) || list.length !== lessons.length) {
  throw new Error("Expected one 19-column integrity row per verified lesson");
}
const merkle_root = await verifyRows(list);
if (merkle_root !== await merkleRoot(hashes)) throw new Error("D1 view and legacy export hashes differ");
const receipt = {
  algorithm:"TaborAcademy:answers-nfc-json-sha256+sorted-merkle:v1",
  merkle_root,
  rows:list.length,
  verified_export_sha256:await sha256(JSON.stringify(list)),
};
await writeFile(new URL("public/exports/blueprints-integrity.json",root),JSON.stringify(receipt,null,2)+"\n");
await writeFile(new URL("public/exports/blueprints-v7.json",root),JSON.stringify(list,null,2)+"\n");
console.log(JSON.stringify(receipt));
