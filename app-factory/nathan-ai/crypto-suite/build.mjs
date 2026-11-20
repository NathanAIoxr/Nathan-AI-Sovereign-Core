import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const load = name => readFile(new URL(name, import.meta.url), "utf8");
const [appJson, roleJson, runtime, client, styles, archive, mirror, receipt, checksum] = await Promise.all([
  "editions.json", "roles.json", "runtime.mjs", "browser.mjs", "style.css", "restoration.json",
  "zero_noise.mjs", "ledger/state.json", "ledger/state.sha256",
].map(load));
const editions = JSON.parse(appJson);
export function bundle(id) {
  if (!Object.hasOwn(editions,id)) throw new Error("Unknown edition");
  const primitives = runtime.slice(0,runtime.indexOf("function escape"));
  const mirrorModule = id === "mining-lab"
    ? "const mirrorState = " + JSON.stringify(receipt) + ";\nconst mirrorSha256 = " + JSON.stringify(checksum.trim()) + ";\n" + mirror
    : "";
  return "const editions = "+JSON.stringify(editions)+";\nconst roles = "+roleJson.trim()+";\nconst restoration = "+archive.trim()+";\nconst styles = "+JSON.stringify(styles)+";\nconst browserModule = "+JSON.stringify(primitives+client)+";\n"+runtime+"\n"+mirrorModule+"\nexport default createApp("+JSON.stringify(id)+");\n";
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.stdout.write(bundle(process.argv[2]));
