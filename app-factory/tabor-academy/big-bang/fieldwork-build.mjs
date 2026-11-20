import { readFileSync } from 'node:fs';
import { mottoHomeBlock } from './page.mjs';

export const original = readFileSync(new URL('author.txt', import.meta.url), 'utf8');
const start = original.indexOf('If you don’t know truth,');
const end = original.indexOf('\n\nThe motto,');
if (start < 0 || end <= start) throw new Error('Missing verbatim motto in the author source');
export const motto = original.slice(start, end);
export const homepageBlock = mottoHomeBlock(motto);

function replaceOnce(text, target, substitute) {
  const first = text.indexOf(target);
  if (first < 0 || text.indexOf(target, first + target.length) >= 0) {
    throw new Error('Expected exactly one Academy insertion point');
  }
  return text.replace(target, () => substitute);
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

export const homepagePatch = [replaceOnce, connectHome].map(fn => fn.toString()).join("\n\n");
