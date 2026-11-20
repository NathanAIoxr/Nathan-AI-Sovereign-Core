export function addAncientServitudeLesson(worker, lessonHtml) {
  const pageDeclaration = /^const page = (.+);$/m;
  const page = worker.match(pageDeclaration);
  if (!page) throw new Error("Academy home template is missing.");
  if (worker.includes("const ancientServitudeLesson =")) return worker;

  const addOnce = (text, target, replacement) => {
    const start = text.indexOf(target);
    if (start < 0 || text.indexOf(target, start + target.length) >= 0) {
      throw new Error("Expected one Academy insertion point: " + target);
    }
    return text.replace(target, () => replacement);
  };

  const slug = "ancient-servitude";
  const path = "/order/" + slug;
  const link = '<a href="/tabor-academy' + path + '/">Part 2 · Ancient Servitude</a>';
  const subtitle = "the academy for TALKING MAMMALS";
  const byline = '<p class="byline">BY NATHAN TABOR</p>';
  let home = JSON.parse(page[1]);
  home = addOnce(home, byline, '<p>' + subtitle + '</p>\n' + byline);
  home = addOnce(home, "Tabor Academy by Nathan Tabor. Coming soon.", "Tabor Academy by Nathan Tabor, " + subtitle + ".");
  const homeLink = '<a href="/tabor-academy/order/">The Law of Order</a>';
  home = addOnce(home, homeLink, homeLink + ' · ' + link);

  worker = worker.replace(pageDeclaration, () => "const page = " + JSON.stringify(home) + ";");
  const partOne = "egyptCleopatraLesson), {";
  worker = addOnce(worker, partOne, "'<p>' + ancientServitudeLink + '</p>' + egyptCleopatraLesson), {");
  const route = '      if (pathname === "/order/ancient-egypt-cleopatra/source.txt")';
  const handler = [
    '      if (pathname === "' + path + '/source.txt") return servePeaceSource(request, env, "' + slug + '");',
    '      if (pathname === "' + path + '" || pathname === "' + path + '/") {',
    '        return new Response(request.method === "HEAD" ? null : workbenchPage("Ancient Servitude · Work, debt, and the right to leave", ancientServitudeLesson), {',
    '          headers: { ...workbenchHeaders, "content-type": "text/html; charset=utf-8" },',
    '        });',
    '      }',
  ].join("\n");
  worker = addOnce(worker, route, handler + "\n" + route);
  return addOnce(worker, "export default {",
    "const ancientServitudeLesson = " + JSON.stringify(lessonHtml) + ";\n" +
    "const ancientServitudeLink = " + JSON.stringify(link) + ";\n\nexport default {");
}
