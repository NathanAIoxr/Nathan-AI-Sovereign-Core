export function addTinFoulHats(worker, lesson) {
  const marker = "const tinFoulHatsLesson = ";
  if (worker.includes(marker)) return worker;
  const path = "/order/tin-foul-hats/";
  const slug = "tin-foul-hats";
  const title = "EVERYONE GET THEIR TIN FOUL HATS ON";
  const replaceOnce = (source, from, to) => {
    if (source.split(from).length !== 2) throw Error("Expected one Academy insertion point: " + from);
    return source.replace(from, () => to);
  };
  const handler = [
    "function serveTinFoulHats(request) {",
    "  const url = new URL(request.url);",
    '  const print = url.searchParams.get("print") === "1";',
    '  const answer = url.searchParams.get("answer");',
    '  const options = [["press","Freedom of the press"],["petition","Right to petition"],["assembly","Right to assemble"]];',
    '  const correct = "The right to petition covers asking the government to address a grievance.";',
    '  const feedback = answer === "petition" ? correct : options.some(([key]) => key === answer) ? "Try again. Look for the right that covers presenting a request to the government." : "";',
    '  const form = \'<form class="screen-only" action="/tabor-academy/order/tin-foul-hats/#challenge" method="get"><fieldset><legend>Choose a right</legend>\' +',
    '    options.map(([key,label]) => \'<label style="display:block"><input type="radio" name="answer" value="\' + key + \'" required\' + (answer === key ? \' checked\' : \'\') + \'> \' + label + \'</label>\').join("") +',
    '    url.searchParams.getAll("trail").slice(-8).filter(step => step.length <= 240).map(step => \'<input type="hidden" name="trail" value="\' + escape(step) + \'">\').join("") +',
    '    \'<button type="submit">Check answer</button></fieldset></form><p class="screen-only" role="status">\' + feedback + \'</p>\';',
    '  const paper = \'<div class="tin-paper"><ul>\' + options.map(([,label]) => "<li>□ " + label + "</li>").join("") +',
    '    \'</ul><p>Explain your choice: _________________________________________</p><p>Parent answer key: \' + correct + \'</p></div>\';',
    '  const styles = \'<style>.tin-paper{display:none}.tin-print .tin-paper{display:block}.tin-print .tin-online{display:none}blockquote{white-space:pre-wrap;overflow-wrap:anywhere}@media print{.tin-paper{display:block}.tin-online{display:none}section{break-inside:auto}h2{break-after:avoid}}</style>\';',
    '  const tools = print ? \'<p class="screen-only">Use your browser’s Print command for the lesson and parent form. <a href="/tabor-academy/order/tin-foul-hats/">Return to the interactive lesson</a></p>\' : "";',
    '  const body = styles + tools + \'<div class="\' + (print ? "tin-print" : "") + \'">\' +',
    '    tinFoulHatsLesson.replace("<details><summary>Reveal the answer", print ? "<details open><summary>Reveal the answer" : "<details><summary>Reveal the answer").replace("{{CHALLENGE}}", \'<div class="tin-online">\' + form + "</div>" + paper) +',
    '    \'<p class="screen-only"><a href="/tabor-academy/order/tin-foul-hats/source.txt">Read Nathan’s full original statement</a></p></div>\';',
    '  return new Response(request.method === "HEAD" ? null : workbenchPage(' + JSON.stringify(title) + ', body), {headers:{...workbenchHeaders,"content-type":"text/html; charset=utf-8"}});',
    "}",
  ].join("\n");
  worker = replaceOnce(worker,"const academyApp = {", marker + JSON.stringify(lesson) + ";\n" + handler + "\n\nconst academyApp = {");
  const anchor = '      if (pathname === "/order/ancient-servitude/source.txt")';
  const routes = '      if (pathname === "' + path + 'source.txt") return servePeaceSource(request, env, "' + slug + '");\n' +
    '      if (pathname === "' + path + '" || pathname === "' + path.slice(0,-1) + '") return serveTinFoulHats(request);\n';
  worker = replaceOnce(worker, anchor, routes + anchor);
  const pattern = /^export default createAcademyNavigation\(academyApp, (.+)\);$/m;
  const match = worker.match(pattern);
  if (!match) throw Error("Academy Map definition missing");
  const data = JSON.parse(match[1]);
  data.catalog["Learning paths and the Academy"].push([path,title,"Beast on the East River, Bill of Rights, The Simpsons, Opal Tabor, Redstone, CIA, Monroe, Gateway, GATE, Rockefeller, Common Core, KJV, parent print"]);
  data.relations["/order/public-school-privatization/"].find(section => section[1] === "thesis")[3].push([path+"#money","Follow the funding and curriculum records"]);
  data.relations[path] = [
    ["#records","records","The 1956 quotation", [["/order/public-school-privatization/#thesis","Read Nathan Tabor’s 1998 thesis statement"]]],
    ["#money","money","The school funding trail", [["/order/public-school-privatization/#thesis","Go to the 1998 Regent thesis"]]],
    ["#school","school","Education pathways", [["/order/#school-authority","Who taught, and who set the syllabus?"]]],
  ];
  return worker.replace(pattern, () => "export default createAcademyNavigation(academyApp, " + JSON.stringify(data) + ");");
}
