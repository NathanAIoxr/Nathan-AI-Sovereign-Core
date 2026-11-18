import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const url = new URL("../data/catalog.json",import.meta.url);
const catalog=JSON.parse(await readFile(url,"utf8"));
const body=JSON.stringify(catalog)+"\n";
const sha256=createHash("sha256").update(body).digest("hex");
const evidence={};
for (const item of catalog.entries) evidence[item.source.status]=(evidence[item.source.status]??0)+1;
const release={release:catalog.release,entries:catalog.entries.length,categories:catalog.categories.length,
  bytes:Buffer.byteLength(body),sha256,evidence,localUtilities:catalog.entries.filter(item=>item.localUtility).map(item=>item.id)};
await writeFile(new URL("../data/release.json",import.meta.url),JSON.stringify(release,null,2)+"\n");
console.log(release);
