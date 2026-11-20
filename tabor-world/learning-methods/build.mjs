import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { createLearningMethods } from "../../app-factory/tabor-academy/institution/learning-methods/runtime.mjs";
import { learningMethods } from "../../app-factory/tabor-academy/institution/learning-methods/data.mjs";
import { worldLearningSite } from "../../app-factory/tabor-academy/institution/learning-methods/sites.mjs";

export const worldLinks = [
  { id: "hands-on-learning", name: "101 Hands-On Learning Methods", kind: "Interactive learning", area: "Worlds",
    url: "https://tabor-world.nathantaboract.workers.dev/learning-methods/", desc: "101 activities across five categories with a five-channel practice loop." },
  { id: "tabor-academy-nine-pillars", name: "Tabor Academy · Nine Pillars", kind: "Academy", area: "Worlds",
    url: "https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/institution/", desc: "Curriculum, syllabus, lessons, assessment, library, records, and governance." },
  { id: "comparative-civics", name: "Comparative Civics & Legal Language", kind: "Source-based lesson", area: "Worlds",
    url: "https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/institution/civics/", desc: "Compare the 1776 declarations, Diné Fundamental Laws, and the 1868 Navajo Treaty." },
  { id: "gateway-redstone", name: "Gateway, Monroe, and Redstone", kind: "Public records", area: "Worlds",
    url: "https://nathan-ai-gateway-archive-20261118.nathantaboract.workers.dev/gateway-monroe-redstone/", desc: "Research notes, original transcript, and a 101-source evidence index." },
];
export const worldLearningBlock = "/* BEGIN TABOR WORLD LEARNING METHODS */\nconst serveWorldLearningMethods = (" +
  createLearningMethods.toString() + ")(" + JSON.stringify(learningMethods) + ", " + JSON.stringify(worldLearningSite) +
  ");\n/* END TABOR WORLD LEARNING METHODS */";

export function installWorld(source, block = worldLearningBlock, entries = worldLinks) {
  const exportLine = "export default {fetch:handle};";
  const bridgedLine = "export default {fetch(request){return serveWorldLearningMethods(request) ?? handle(request);}};";
  const start = "/* BEGIN TABOR WORLD LEARNING METHODS */";
  const end = "/* END TABOR WORLD LEARNING METHODS */";
  if (source.includes(start)) {
    const a = source.indexOf(start), b = source.indexOf(end);
    if (b < a || !source.includes(bridgedLine)) throw new Error("World learning markers are inconsistent");
    source = source.slice(0, a) + block + source.slice(b + end.length);
  } else {
    if (source.split(exportLine).length !== 2) throw new Error("Expected the Tabor World handler");
    source = source.replace(exportLine, () => block + "\n" + bridgedLine);
  }
  const catalog = /((?:const|let|var) destinations\s*=\s*)(\[[\s\S]*?\]);\s*(?=\/\* BEGIN TABOR WORLD LEARNING METHODS \*\/)/;
  if (!catalog.test(source)) throw new Error("The Tabor World destination catalog was not found");
  return source.replace(catalog, (_, prefix, json) => {
    const current = JSON.parse(json);
    for (const entry of entries) {
      const index = current.findIndex(item => item.id === entry.id);
      if (index < 0) current.push(entry);
      else current[index] = entry;
    }
    return prefix + JSON.stringify(current, null, 2) + ";\n";
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv[2]) throw new Error("Provide the live Tabor World Worker module");
  process.stdout.write(installWorld(await readFile(process.argv[2], "utf8")));
}
