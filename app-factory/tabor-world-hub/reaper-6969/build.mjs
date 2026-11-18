import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const source = process.argv[2];
if (!source) throw new Error("Pass the directory that holds the owner archive files.");
const names = {
  "Reaper_6969_Recovery.md": ["Recovery report", "text/markdown; charset=utf-8"],
  "tabor_reaper.py": ["Original saved Python calculations", "text/x-python; charset=utf-8"],
  "Reaper_6969_Sealed_Engine.txt": ["Saved sealed-engine and USIC continuation", "text/plain; charset=utf-8"],
  "Reaper_6969_Knight_and_OXR.txt": ["Saved KNIGHT, OXR and author directives", "text/plain; charset=utf-8"]
};

const items = await Promise.all(Object.entries(names).map(async ([filename, [title, type]]) => {
  const bytes = await readFile(join(source, filename));
  if (!bytes.length) throw new Error(filename + " is empty.");
  return {
    filename, title, type, bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    content: bytes.toString("utf8")
  };
}));
await writeFile(new URL("private-data.mjs", import.meta.url), "export default " + JSON.stringify(items) + ";\n");
