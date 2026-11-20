export function addEgyptCleopatraLesson(worker, lessonHtml) {
  const slug = "ancient-egypt-cleopatra";
  const href = "/tabor-academy/order/ancient-egypt-cleopatra/";
  const title = "Ancient Egypt and Cleopatra VII · Labor, authority, and the record";
  const replaceOnce = (text, target, replacement) => {
    const first = text.indexOf(target);
    if (first < 0 || text.indexOf(target, first + target.length) >= 0) {
      throw new Error("Expected one Academy insertion point: " + target);
    }
    return text.replace(target, () => replacement);
  };
  if (worker.includes('const egyptCleopatraLesson =')) return worker;

  const route = '    if (pathname === "/order/time-of-peace/source.txt" &&';
  const handler = [
    '    if (request.method === "GET" || request.method === "HEAD") {',
    '      if (pathname === "/order/' + slug + '/source.txt") return servePeaceSource(request, env, "' + slug + '");',
    '      if (pathname === "/order/' + slug + '" || pathname === "/order/' + slug + '/") {',
    '        return new Response(request.method === "HEAD" ? null : workbenchPage(' + JSON.stringify(title) + ', egyptCleopatraLesson), {',
    '          headers: { ...workbenchHeaders, "content-type": "text/html; charset=utf-8" },',
    '        });',
    '      }',
    '    }',
  ].join("\n");

  worker = replaceOnce(worker, 'export default {', 'const egyptCleopatraLesson = ' + JSON.stringify(lessonHtml) + ';\n\nexport default {');
  worker = replaceOnce(worker, route, handler + '\n' + route);
  worker = replaceOnce(worker, 'async function servePeaceSource(request, env) {', 'async function servePeaceSource(request, env, slug = "time-of-peace") {');
  worker = replaceOnce(worker, '.bind("time-of-peace").first();', '.bind(slug).first();');

  const link = '<a href="' + href + '">Ancient Egypt and Cleopatra VII</a>';
  const originalLink = '<a href="${peacePath}source.txt">Read the original source text</a>';
  worker = replaceOnce(worker, originalLink, originalLink + ' · ' + link);
  const orderLink = '<a href="${mount}/order/time-of-peace/">The Time of Peace · The Age of Innocence and the rotation</a>';
  return replaceOnce(worker, orderLink, orderLink + ' · ' + link);
}
