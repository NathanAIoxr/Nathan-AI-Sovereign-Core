import { readFileSync } from 'node:fs';

export const original = readFileSync(new URL('author.txt', import.meta.url), 'utf8');
const start = original.indexOf('If you don’t know truth,');
const end = original.indexOf('\n\nThe motto,');
if (start < 0 || end <= start) throw new Error('Missing verbatim motto in the author source');
export const motto = original.slice(start, end);
export const moduleSource = readFileSync(new URL('page.mjs', import.meta.url), 'utf8');

function replaceOnce(text, target, substitute) {
  const first = text.indexOf(target);
  if (first < 0 || text.indexOf(target, first + target.length) >= 0) {
    throw new Error('Expected exactly one Academy insertion point');
  }
  return text.replace(target, () => substitute);
}

export function connectEntry(source) {
  if (source.includes('serveAcademyBigBang(request)')) return source;
  const importLine = 'import academy from "./worker.mjs";';
  const firstCall = '    const response=await academyWithSnowGlobes.fetch(request,env,ctx);';
  return replaceOnce(
    replaceOnce(source, importLine, importLine + '\nimport { serveAcademyBigBang } from "./big-bang.mjs";'),
    firstCall, '    const bigBang = serveAcademyBigBang(request);\n    if (bigBang) return bigBang;\n' + firstCall,
  );
}

export function connectHome(core, content) {
  const pattern = /^const page = (.+);$/m;
  const match = core.match(pattern);
  if (!match) throw new Error('Academy homepage was not found');
  let html = JSON.parse(match[1]);
  const add = '<!-- BEGIN TABOR ACADEMY MOTTO -->' + content + '<!-- END TABOR ACADEMY MOTTO -->';
  const installed = /<!-- BEGIN TABOR ACADEMY MOTTO -->[\s\S]*?<!-- END TABOR ACADEMY MOTTO -->/;
  if (installed.test(html)) html = html.replace(installed, () => add);
  else {
    const byline = '<p class="byline">BY NATHAN TABOR</p>';
    html = replaceOnce(html, byline, byline + '\n' + add + '\n');
  }
  return core.replace(pattern, () => 'const page = ' + JSON.stringify(html) + ';');
}

export async function build(release) {
  if (!/^[a-f\d]{40}$/.test(release)) throw new Error('Expected the GitHub release SHA');
  const author = 'export const motto = ' + JSON.stringify(motto) +
    ';\nexport const original = ' + JSON.stringify(original) + ';\nexport const release = ' + JSON.stringify(release) + ';\n';
  const authorUrl = 'data:text/javascript,' + encodeURIComponent(author);
  const localSource = moduleSource.replace("'./big-bang-source.mjs'", JSON.stringify(authorUrl));
  const page = await import('data:text/javascript,' + encodeURIComponent(localSource));
  return {
    patch: [replaceOnce, connectEntry, connectHome].map(fn => fn.toString()).join('\n\n'),
    modules: { 'big-bang.mjs': moduleSource, 'big-bang-source.mjs': author },
    home: page.mottoHomeBlock(),
    serve: page.serveAcademyBigBang,
  };
}
