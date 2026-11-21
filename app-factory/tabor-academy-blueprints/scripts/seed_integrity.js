import { readFileSync } from "node:fs";
import { rowSha256 } from "../shared/merkle.js";

const rows = JSON.parse(readFileSync(new URL("../public/exports/blueprints.json", import.meta.url), "utf8"));
for (const row of rows) {
  if (!Number.isSafeInteger(row.id) || row.id < 1) throw new Error("Invalid seed lesson ID");
  console.log(`UPDATE blueprint_lessons SET row_sha256='${await rowSha256(row)}' WHERE id=${row.id};`);
}
