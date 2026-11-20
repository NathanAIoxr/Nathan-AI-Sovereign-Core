import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createInstitution } from "./runtime.mjs";

const here = new URL("./", import.meta.url);
export const blueprintSource = await readFile(new URL("blueprint.json", here), "utf8");
export const blueprint = JSON.parse(blueprintSource);
export const blueprintKey = "institution/blueprint-" + blueprint.meta.version + ".json";
export const release = createHash("sha256").update(createInstitution.toString()).update(blueprintSource).digest("hex").slice(0, 16);
const start = "/* BEGIN TABOR ACADEMY INSTITUTION */";
const end = "/* END TABOR ACADEMY INSTITUTION */";

export function buildWorker(source) {
  const block = [start,
    "const serveAcademyInstitution = (" + createInstitution.toString() + ")(" +
      JSON.stringify(blueprint) + ", " + JSON.stringify(release) + ");",
    end, "",
  ].join("\n");
  if (source.includes(start) || source.includes(end)) {
    if (!source.includes(start) || !source.includes(end) || source.indexOf(end) < source.indexOf(start)) {
      throw new Error("Existing Institution release markers are inconsistent");
    }
    return source.slice(0, source.indexOf(start)) + block + source.slice(source.indexOf(end) + end.length + 1);
  }
  const home = /^const page = (.+);$/m;
  const homepage = source.match(home);
  const route = '    const { pathname } = new URL(request.url);';
  // The Academy has multiple route functions. Patch only its exported handler.
  const handler = "export default {";
  const handlerAt = source.lastIndexOf(handler);
  if (!homepage || handlerAt === -1 || !source.slice(handlerAt).includes(route)) {
    throw new Error("Current Academy source lacks the expected homepage or route insertion point");
  }
  const page = JSON.parse(homepage[1]);
  if (!page.includes("</main>")) throw new Error("Academy homepage is missing main element");
  const link = '<p><a href="/tabor-academy/institution/" style="color:#e6cf87">Nine-Pillar Academy</a></p>';
  const updatedHome = page.replace("</main>", link + "\n</main>");
  const updated = source.replace(home, () => "const page = " + JSON.stringify(updatedHome) + ";");
  const dispatchAt = updated.lastIndexOf(handler);
  const dispatch = updated.slice(dispatchAt)
    .replace("async fetch(request, env) {", "async fetch(request, env, ctx) {")
    .replace(route, () => route +
    '\n    if (pathname === "/institution" || pathname.startsWith("/institution/")) return serveAcademyInstitution(request, env, ctx);');
  return updated.slice(0, dispatchAt) + block + dispatch;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv[2]) throw new Error("Provide the current Academy Worker source");
  process.stdout.write(buildWorker(await readFile(process.argv[2], "utf8")));
}
