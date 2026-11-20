import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const source = name => readFile(new URL(name, import.meta.url), "utf8");
export const sequence = [
  "foundations", "bitcoin-proof", "pools-stratum", "hardware-software", "wallet-rewards", "power-economics",
  "networks", "fleet-operations", "octopus-mirror", "golden-goose", "nature-analogies", "verification-lab",
];
const runtime = await source("runtime.mjs");
const play = await source("play.mjs");
const modules = await Promise.all(sequence.map(async id => {
  const module = JSON.parse(await source("zones/" + id + "/module.json"));
  if (module.id !== id || !module.sources.every(([, url]) => new URL(url).protocol === "https:")) {
    throw new Error("Invalid lesson metadata for " + id);
  }
  if (!module.challenge?.kind) throw new Error("Missing challenge for " + id);
  return module;
}));

const courseMarker = "// BEGIN TABOR ACADEMY MINING COURSE";
const endMarker = "// END TABOR ACADEMY MINING COURSE";
const homeAnchor = "return new Response(head ? null : page, {";
const homeLink = 'return new Response(head ? null : page.replace("</main>", miningHomeLink + "</main>"), {';
const workbenchAnchor = '<ul class="guide-links">${links}</ul>';
const workbenchLink = '${miningHomeLink}' + workbenchAnchor;
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
    "const miningPlayScript = " + JSON.stringify(play) + ";",
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
  const guidesAt = withHome.indexOf("function renderGuides(");
  const guidesEnd = guidesAt < 0 ? -1 : withHome.indexOf("\nfunction ", guidesAt + 1);
  const withWorkbench = guidesEnd < 0
    ? replaceUnique(withHome, workbenchAnchor, workbenchLink)
    : withHome.slice(0, guidesAt) +
      replaceUnique(withHome.slice(guidesAt, guidesEnd), workbenchAnchor, workbenchLink) +
      withHome.slice(guidesEnd);
  const start = withWorkbench.includes("const academyApp = {") ? "const academyApp = {" : "export default {";
  if (!withWorkbench.includes(start)) throw new Error("Academy application entry point missing");
  const insertion = withWorkbench.indexOf(start);
  const front = withWorkbench.slice(0, insertion);
  const handler = withWorkbench.slice(insertion);
  const routeStart = start + "\n  async fetch(";
  if (!handler.startsWith(routeStart)) throw new Error("Academy fetch entry point missing");
  const routeAt = handler.indexOf(routeAnchor);
  if (routeAt < 0 || routeAt > 250) throw new Error("Academy route anchor missing");
  const splice = routeAt + routeAnchor.length;
  return front + course + "\n\n" + handler.slice(0, splice) + "\n    " + route + handler.slice(splice);
}

export function buildZone(id) {
  const module = modules.find(item => item.id === id);
  if (!module) throw new Error("Unknown Academy mining zone: " + id);
  return runtime + "\nconst miningPlayScript = " + JSON.stringify(play) + ";\nconst modules = " + JSON.stringify([module]) +
    ";\nexport default { fetch(request) { return miningServe(request, modules, true); } };\n";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , mode, value] = process.argv;
  if (mode === "zone") process.stdout.write(buildZone(value));
  else if (mode === "academy" && value) process.stdout.write(buildAcademy(await readFile(value, "utf8")));
  else throw new Error("Use node build.mjs zone <id> or node build.mjs academy <current-academy-worker.mjs>");
}
