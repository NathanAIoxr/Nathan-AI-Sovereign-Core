import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const source = name => readFile(new URL(name, import.meta.url), "utf8");
export const sequence = [
  "foundations", "bitcoin-proof", "pools-stratum", "hardware-software", "wallet-rewards", "power-economics",
  "networks", "fleet-operations", "octopus-mirror", "golden-goose", "nature-analogies", "verification-lab",
];
const runtime = await source("runtime.mjs");
const modules = await Promise.all(sequence.map(async id => {
  const module = JSON.parse(await source("zones/" + id + "/module.json"));
  if (module.id !== id || !module.sources.every(([, url]) => new URL(url).protocol === "https:")) {
    throw new Error("Invalid lesson metadata for " + id);
  }
  return module;
}));

const courseMarker = "// BEGIN TABOR ACADEMY MINING COURSE";
const endMarker = "// END TABOR ACADEMY MINING COURSE";
const homeAnchor = "return new Response(head ? null : page, {";
const homeLink = 'return new Response(head ? null : page.replace("</main>", miningHomeLink + "</main>"), {';
const workbenchAnchor = '<ul class="guide-links">${links}</ul>${index}';
const workbenchLink = '${miningHomeLink}<ul class="guide-links">${links}</ul>${index}';
const routeAnchor = 'const { pathname } = new URL(request.url);';
const route = 'if (pathname === "/mining" || pathname.startsWith("/mining/")) return miningServe(request, miningModules);';

function replaceUnique(sourceText, anchor, replacement) {
  if (sourceText.split(anchor).length !== 2) throw new Error("Expected one Academy anchor: " + anchor);
  return sourceText.replace(anchor, () => replacement);
}

export function buildAcademy(academy) {
  const course = [
    courseMarker,
    'const miningHomeLink = \'<p><a href="/tabor-academy/mining/" style="color:#e6cf87">Cryptocurrency Mining</a></p>\';',
    "const miningModules = " + JSON.stringify(modules) + ";",
    runtime.trimEnd(),
    endMarker,
  ].join("\n");
  if (academy.includes(courseMarker)) {
    const previous = academy.slice(academy.indexOf(courseMarker), academy.indexOf(endMarker) + endMarker.length);
    if (!previous.endsWith(endMarker) || !academy.includes(homeLink) || !academy.includes(workbenchLink) ||
        !academy.includes(route)) throw new Error("Unexpected Academy course integration");
    return replaceUnique(academy, previous, course);
  }
  const withHome = replaceUnique(academy, homeAnchor, homeLink);
  const withWorkbench = replaceUnique(withHome, workbenchAnchor, workbenchLink);
  const start = "export default {";
  const insertion = withWorkbench.indexOf(start);
  const front = withWorkbench.slice(0, insertion);
  const handler = withWorkbench.slice(insertion);
  return front + course + "\n\n" + replaceUnique(handler, routeAnchor, routeAnchor + "\n    " + route);
}

export function buildZone(id) {
  const module = modules.find(item => item.id === id);
  if (!module) throw new Error("Unknown Academy mining zone: " + id);
  return runtime + "\nconst modules = " + JSON.stringify([module]) +
    ";\nexport default { fetch(request) { return miningServe(request, modules, true); } };\n";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , mode, value] = process.argv;
  if (mode === "zone") process.stdout.write(buildZone(value));
  else if (mode === "academy" && value) process.stdout.write(buildAcademy(await readFile(value, "utf8")));
  else throw new Error("Use node build.mjs zone <id> or node build.mjs academy <current-academy-worker.mjs>");
}
