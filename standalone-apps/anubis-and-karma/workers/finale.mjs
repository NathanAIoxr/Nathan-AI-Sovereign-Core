import { index, client, novella } from '../.generated/assets.mjs';
import { escapeHTML, frame, html, json, reply, release, site } from './shared.mjs';

export default site('finale', (path, request) => {
  if (path === '/') return html(request, index);
  if (path === '/client.mjs') return reply(request, client, 'text/javascript; charset=utf-8');
  if (path === '/api/release') return json(request, release);
  if (path === '/book.txt') {
    return reply(request, novella, undefined, 200, {
      'content-disposition': 'attachment; filename="The-Last-Weighing.txt"',
    });
  }
  if (path === '/read') {
    const [title, credit, ...paragraphs] = novella.trim().split('\n\n');
    return html(request, frame(title, `
      <p class="overline">Anubis &amp; Karma / Short fiction</p><h1>${escapeHTML(title)}</h1>
      <p class="credit">${escapeHTML(credit)}</p>
      <article class="story">${paragraphs.map((text) => `<p>${escapeHTML(text)}</p>`).join('')}</article>
      <a class="button" href="/book.txt" download>Download the story</a>`));
  }
});

