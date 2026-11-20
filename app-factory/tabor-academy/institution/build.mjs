import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createInstitution } from "./runtime.mjs";
import { architectureWorksheet, renderArchitectureCourse } from "./architecture-course.mjs";
import { foundation as foundationStatement, foundationQuote } from "./foundation.mjs";
import { learningMethods } from "./learning-methods/data.mjs";
import { createLearningMethods } from "./learning-methods/runtime.mjs";
import { academyLearningSite } from "./learning-methods/sites.mjs";

const here = new URL("./", import.meta.url);
export const blueprintSource = await readFile(new URL("blueprint.json", here), "utf8");
export const blueprint = JSON.parse(blueprintSource);
const handoffSource = await readFile(new URL("library-handoff.txt", here), "utf8");
const blockStart = handoffSource.indexOf("=== CONDUCTOR HANDOFF: THE LIBRARY OF TABOR (NATHAN TABOR) ===");
const blockEnd = handoffSource.lastIndexOf("\nUse code with caution.");
if (blockStart < 0 || blockEnd <= blockStart) throw new Error("Library of Tabor handoff block is missing");
const architectureSource = await readFile(new URL("architecture.txt", here), "utf8");
const conductor = JSON.parse(await readFile(new URL("../../../deployments/conductor/academy/architecture.json", here), "utf8"));
const prompts = [...architectureSource.matchAll(/^Prompt (\d+) — (.+):\n(.+)$/gm)]
  .map(([, id, title, text]) => ({ id: Number(id), title, text }));
if (prompts.map(prompt => prompt.id).join(",") !== "1,2,3,4") throw new Error("Architecture requires four ordered author prompts");

const course = JSON.parse(await readFile(new URL("architecture-course.json", here), "utf8"));
const authorMotto = architectureSource.split("\n")[2].slice(1, -1);
export const foundation = {
  ...foundationStatement,
  millionDollar: {
    lesson: await readFile(new URL("million-dollar.html", here), "utf8"),
    source: await readFile(new URL("million-dollar.txt", here), "utf8"),
  },
  threeApples: {
    lesson: await readFile(new URL("three-apples.html", here), "utf8"),
    source: await readFile(new URL("three-apples.txt", here), "utf8"),
  },
  realityMath: await readFile(new URL("reality-math.html", here), "utf8"),
  libraryHandoff: { source: handoffSource, block: handoffSource.slice(blockStart, blockEnd) },
  architecture: {
    source: architectureSource,
    blueprint: await readFile(new URL("architecture.html", here), "utf8"),
    practice: JSON.parse(await readFile(new URL("architecture-practice.json", here), "utf8")),
    course: {
      ...course,
      authorMotto,
      nineCarsAxiom: "Nine real cars in the parking lot remain nine real cars—no catalog or paper rule can erase what physically exists.",
      worksheet: architectureWorksheet(),
    },
    conductor: {
      ...conductor,
      sourceSha256: createHash("sha256").update(architectureSource).digest("hex"),
      prompts,
    },
  },
};
export const civics = {
  html: await readFile(new URL("civics/lesson.html", here), "utf8"),
  source: await readFile(new URL("civics/source.txt", here), "utf8"),
};
const catalog = JSON.parse(await readFile(new URL("../map/topics.json", here), "utf8"));
const civicsPath = "/institution/civics/";
export const blueprintKey = "institution/blueprint-" + blueprint.meta.version + ".json";
export const release = createHash("sha256").update(createInstitution.toString()).update(blueprintSource).update(JSON.stringify([civics, foundation])).update(foundationQuote.toString()).update(renderArchitectureCourse.toString()).update(createLearningMethods.toString()).update(JSON.stringify([learningMethods, academyLearningSite])).digest("hex").slice(0, 16);
const start = "/* BEGIN TABOR ACADEMY INSTITUTION */";
const end = "/* END TABOR ACADEMY INSTITUTION */";

function updateAcademyMap(source) {
  const exportLine = /^export default createAcademyNavigation\(academyApp, (.+)\);$/m;
  return source.replace(exportLine, (_, json) => {
    const current = JSON.parse(json);
    for (const [path, group] of [
      [civicsPath, "History and the record"],
      ["/institution/learning-methods/", "Learning paths and the Academy"],
      ["/institution/foundation/", "Learning paths and the Academy"],
      ["/institution/foundation/architecture/", "Learning paths and the Academy"],
      ["/institution/foundation/architecture/course/", "Learning paths and the Academy"],
      ["/institution/foundation/library-handoff/", "Learning paths and the Academy"],
      ["/institution/foundation/reality-math/", "Learning paths and the Academy"],
      ["/institution/foundation/three-apples/", "Learning paths and the Academy"],
      ["/institution/foundation/reality-math/million-dollar/", "Learning paths and the Academy"],
    ]) {
      const entries = current.catalog[group] ?? (current.catalog[group] = []);
      const entry = catalog.catalog[group].find(([href]) => href === path);
      const index = entries.findIndex(([href]) => href === path);
      if (index < 0) entries.push(entry);
      else entries[index] = entry;
      if (catalog.relations[path]) current.relations[path] = catalog.relations[path];
    }
    const peacePath = "/order/time-of-peace/";
    const target = current.relations[peacePath]?.find(([, anchor]) => anchor === "rotation");
    const link = catalog.relations[peacePath].find(([, anchor]) => anchor === "rotation")[3]
      .find(([href]) => href.startsWith(civicsPath));
    if (target && !target[3].some(([href]) => href === link[0])) target[3].push(link);
    return "export default createAcademyNavigation(academyApp, " + JSON.stringify(current) + ");";
  });
}

const home = /^const page = (.+);$/m;
const foundationStart = "<!-- BEGIN TABOR ACADEMY FOUNDATION -->";
const foundationEnd = "<!-- END TABOR ACADEMY FOUNDATION -->";

function updateAcademyHome(source, includeInstitutionLink) {
  const homepage = source.match(home);
  if (!homepage) throw new Error("Current Academy source lacks the expected homepage");
  let page = JSON.parse(homepage[1]);
  if (!page.includes("</main>")) throw new Error("Academy homepage is missing main element");

  const panel = foundationStart +
    `<div id="academy-foundation" style="max-width:52rem;margin:2rem 0;font-size:clamp(1rem,2.25vw,1.3rem);line-height:1.55">
${foundationQuote(foundation)}
<p><a href="${foundation.path}" style="color:#e6cf87">Tabor Academy Foundation</a></p>
<p><a href="${foundation.path}architecture/" style="color:#e6cf87">The Architecture of Everything and Nothing</a></p>
</div>` + foundationEnd;
  const first = page.indexOf(foundationStart);
  const last = page.indexOf(foundationEnd);
  if (first >= 0 && last > first) {
    page = page.slice(0, first) + panel + page.slice(last + foundationEnd.length);
  } else if (first >= 0 || last >= 0) {
    throw new Error("Existing Academy foundation markers are inconsistent");
  } else if (page.includes("</h1>")) {
    page = page.replace("</h1>", () => "</h1>" + panel);
  } else {
    page = page.replace("</main>", () => panel + "</main>");
  }
  if (includeInstitutionLink) {
    const link = '<p><a href="/tabor-academy/institution/" style="color:#e6cf87">Nine-Pillar Academy</a></p>';
    page = page.replace("</main>", link + "\n</main>");
  }
  return source.replace(home, () => "const page = " + JSON.stringify(page) + ";");
}

export function buildWorker(source) {
  const block = [start,
    "const renderAcademyFoundationQuote = " + foundationQuote.toString() + ";",
    "const renderAcademyArchitectureCourse = " + renderArchitectureCourse.toString() + ";",
    "const serveAcademyInstitutionBase = (" + createInstitution.toString() + ")(" +
      JSON.stringify(blueprint) + ", " + JSON.stringify(release) + ", " + JSON.stringify(civics) + ", " + JSON.stringify(foundation) + ", renderAcademyFoundationQuote, renderAcademyArchitectureCourse);",
    "const serveAcademyLearningMethods = (" + createLearningMethods.toString() + ")(" +
      JSON.stringify(learningMethods) + ", " + JSON.stringify(academyLearningSite) + ");",
    "const serveAcademyInstitution = (request, env, ctx) => serveAcademyLearningMethods(request) ?? serveAcademyInstitutionBase(request, env, ctx);",
    end, "",
  ].join("\n");
  if (source.includes(start) || source.includes(end)) {
    if (!source.includes(start) || !source.includes(end) || source.indexOf(end) < source.indexOf(start)) {
      throw new Error("Existing Institution release markers are inconsistent");
    }
    const updated = source.slice(0, source.indexOf(start)) + block + source.slice(source.indexOf(end) + end.length + 1);
    return updateAcademyMap(updateAcademyHome(updated, false));
  }
  const route = '    const { pathname } = new URL(request.url);';
  // The Academy has multiple route functions. Patch only its exported handler.
  const handler = "export default {";
  const handlerAt = source.lastIndexOf(handler);
  if (handlerAt === -1 || !source.slice(handlerAt).includes(route)) {
    throw new Error("Current Academy source lacks the expected homepage or route insertion point");
  }
  const updated = updateAcademyHome(source, true);
  const dispatchAt = updated.lastIndexOf(handler);
  const dispatch = updated.slice(dispatchAt)
    .replace("async fetch(request, env) {", "async fetch(request, env, ctx) {")
    .replace(route, () => route +
    '\n    if (pathname === "/institution" || pathname.startsWith("/institution/")) return serveAcademyInstitution(request, env, ctx);');
  return updateAcademyMap(updated.slice(0, dispatchAt) + block + dispatch);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv[2]) throw new Error("Provide the current Academy Worker source");
  process.stdout.write(buildWorker(await readFile(process.argv[2], "utf8")));
}
