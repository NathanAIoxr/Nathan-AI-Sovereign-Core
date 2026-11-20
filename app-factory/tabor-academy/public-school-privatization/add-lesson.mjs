export function addThesis(worker, lesson) {
  const marker = "const publicSchoolThesis = ";
  if (worker.includes(marker)) return worker;
  const path = "/order/public-school-privatization/";
  const mountPath = "/tabor-academy" + path;
  const title = "THE GLOVES ARE OFF · The 1998 Regent thesis";
  const replaceOnce = (source, from, to) => {
    if (source.split(from).length !== 2) throw new Error("Academy insertion point missing or repeated");
    return source.replace(from, () => to);
  };
  const route = '      if (pathname === "/order/ancient-servitude/source.txt")';
  const handlers = [
    '      if (pathname === "' + path + 'source.txt") return servePeaceSource(request, env, "public-school-privatization");',
    '      if (pathname === "' + path.slice(0, -1) + '" || pathname === "' + path + '") {',
    '        return new Response(request.method === "HEAD" ? null : workbenchPage(' + JSON.stringify(title) + ', publicSchoolThesis), {',
    '          headers: { ...workbenchHeaders, "content-type": "text/html; charset=utf-8" },',
    '        });',
    '      }',
  ].join("\n");
  worker = replaceOnce(worker, route, handlers + "\n" + route);
  worker = replaceOnce(worker, 'const academyApp = {', marker + JSON.stringify(lesson) + ";\n\nconst academyApp = {");
  const heading = '<section><h2>Who taught, and who set the syllabus?</h2>';
  worker = replaceOnce(worker, heading, '<section id="school-authority"><h2>Who taught, and who set the syllabus?</h2><p><a href="' + mountPath + '">The 1998 Regent thesis on privatizing public schools</a></p>');
  const declaration = /^export default createAcademyNavigation\(academyApp, (.+)\);$/m;
  const map = worker.match(declaration);
  if (!map) throw new Error("Current Academy Map definition missing");
  const data = JSON.parse(map[1]);
  data.catalog["Learning paths and the Academy"].push([path, title, "Nathan Tabor, Regent University, privatization, public schools, funding, Common Core"]);
  data.relations["/order/"].push(["#school-authority", "school-authority", "Who set the syllabus?", [[path + "#thesis", "Read Nathan Tabor’s statement on the Department of Education"]]]);
  data.relations[path] = [
    ["#thesis", "thesis", "The 1998 thesis", [["/order/#school-authority", "Follow who taught and set the syllabus"]]],
  ];
  return worker.replace(declaration, () => "export default createAcademyNavigation(academyApp, " + JSON.stringify(data) + ");");
}
