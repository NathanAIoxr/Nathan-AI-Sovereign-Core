import { createDecipheriv, createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { readFile, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { finished } from "node:stream/promises";

const [manifestPath, partsDir, keyPath, output] = process.argv.slice(2);
if (!manifestPath || !partsDir || !keyPath || !output) {
  throw new Error("Usage: node restore.mjs manifest.json part-folder owner-key.txt restored.zip");
}
const { parts } = JSON.parse(await readFile(manifestPath, "utf8"));
const key = (await readFile(keyPath, "utf8")).trim();
if (!/^[a-fA-F0-9]{64}$/.test(key)) throw new Error("Owner key must be 64 hex digits.");
if (parts.length < 1) throw new Error("No archive parts.");
const tmp = output + ".partial";
const stream = createWriteStream(tmp, { flags: "wx", mode: 0o600 });
let opened = false;
stream.once("open", () => { opened = true; });
const done = finished(stream);
done.catch(() => {});
let decipher;
let tail = Buffer.alloc(0);
try {
  for (const [index, part] of parts.entries()) {
    if (!/^sealed-\d{3}\.bin$/.test(part.file)) throw new Error("Invalid part name.");
    let data = await readFile(join(partsDir, part.file));
    if (data.length !== part.size || createHash("sha256").update(data).digest("hex") !== part.sha256) throw new Error("Part integrity check failed for " + part.file);
    if (index === 0) {
      if (data.subarray(0, 5).toString("ascii") !== "TATA1") throw new Error("Unknown archive format.");
      decipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), data.subarray(5, 17));
      data = data.subarray(17);
    }
    const chunk = Buffer.concat([tail, data]);
    tail = chunk.subarray(-16);
    const clear = decipher.update(chunk.subarray(0, -16));
    await new Promise((resolve, reject) => stream.write(clear, (error) => error ? reject(error) : resolve()));
  }
  decipher.setAuthTag(tail);
  stream.end(decipher.final());
  await done;
  await rename(tmp, output);
} catch (error) {
  stream.destroy();
  await done.catch(() => {});
  if (opened) await rm(tmp, { force: true });
  throw error;
}
