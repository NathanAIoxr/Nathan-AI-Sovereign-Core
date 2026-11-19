import { index, client, novella } from '../.generated/assets.mjs';
import { escapeHTML, frame, html, json, reply, release, site, urls } from './shared.mjs';

export default site('finale', (path, request) => {
  if (path === '/') return html(request, index);
  if (path === '/client.mjs') return reply(request, client, 'text/javascript; charset=utf-8');
  if (path === '/root') return html(request, rootPage());
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

const conflictNames = [
  ['Angels vs demons · God vs Satan', 'War in heaven', 'Revelation 12:7–9', 'Revelation 12:7-9'],
  ['Spiritual warfare', 'The struggle against principalities, powers, and spiritual wickedness', 'Ephesians 6:12', 'Ephesians 6:12'],
  ['Sin vs righteousness', 'Sin unto death and obedience unto righteousness', 'Romans 6:16–18', 'Romans 6:16-18'],
  ['Flesh vs Spirit', 'The flesh and the Spirit contend within the person', 'Galatians 5:17', 'Galatians 5:17'],
  ['The law of the mind and the law of sin', 'The struggle Paul describes within himself', 'Romans 7:23', 'Romans 7:23'],
  ['Light vs darkness', 'Deeds brought into the light or kept in darkness', 'John 3:19–21', 'John 3:19-21'],
];

function rootPage() {
  const names = conflictNames.map(([name, summary, reference, passage]) => {
    const source = 'https://www.biblegateway.com/passage/?search=' + encodeURIComponent(passage) + '&version=KJV';
    return `<li><strong>${escapeHTML(name)}</strong> · ${escapeHTML(summary)}
      <small><a href="${escapeHTML(source)}">${escapeHTML(reference)} (KJV)</a></small></li>`;
  }).join('');
  return frame('The Root of 0 and 1', `
    <h1>The Root of 0 and 1</h1>
    <p class="intro"><strong>${escapeHTML(release.framing)}</strong></p>
    <blockquote><p>${escapeHTML(release.rootDirective)}</p><cite>Nathan Tabor</cite></blockquote>
    <p class="intro"><strong>0 = 0 · 1 = 1</strong></p>
    <p>In the finale, 0 marks a case still open. 1 marks a repair verified by the people it affected. The original act and the repair both stay on the record.</p>
    <h2>Names for the conflict</h2>
    <p>Good vs evil is the broad phrase. These KJV passages give names to the conflict in heaven, in human conduct, and within the person.</p>
    <ul class="domino-list">${names}</ul>
    <h2>Names across traditions</h2>
    <ul class="domino-list">
      <li><a href="${urls.texts}/#war-scroll">Sons of Light vs Sons of Darkness</a> · War Scroll (1QM)</li>
      <li><a href="${urls.texts}/#yasna-30-3">The two opposed spirits</a> · Yasna 30.3–4</li>
      <li><a href="${urls.texts}/#gita-16-6">Divine and demoniac dispositions</a> · Bhagavad Gītā 16.6</li>
      <li><a href="${urls.texts}/#quran-17-81">Truth vs falsehood</a> · Qurʾān 17:81</li>
      <li><a href="${urls.texts}/#tattvartha-8">Karmic bondage</a> · Tattvārtha Sūtra 8.1</li>
      <li><a href="${urls.texts}/#trc-1995">Truth and reconciliation</a> · South Africa’s 1995 act</li>
    </ul>
    <a class="button" href="${urls.texts}">Browse the ancient-to-modern text index</a>
    <a class="button" href="/">Play the finale</a>`);
}
