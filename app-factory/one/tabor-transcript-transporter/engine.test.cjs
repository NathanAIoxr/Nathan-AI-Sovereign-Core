'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const t = require('./engine.js');
const decoder = new TextDecoder();
function entries(arr) {
  let p = 0, out = {};
  while (p < arr.length && arr[p] === 0x50 && arr[p + 1] === 0x4b &&
         arr[p + 2] === 3 && arr[p + 3] === 4) {
    const size = arr[p + 18] | (arr[p + 19] << 8) | (arr[p + 20] << 16) | (arr[p + 21] << 24);
    const nameLength = arr[p + 26] | (arr[p + 27] << 8);
    const extraLength = arr[p + 28] | (arr[p + 29] << 8);
    const start = p + 30 + nameLength + extraLength;
    const name = decoder.decode(arr.slice(p + 30, p + 30 + nameLength));
    out[name] = arr.slice(start, start + size);
    p = start + size;
  }
  return out;
}
const spec = { title: 'Test & Truth', author: 'Nathan Tabor', sourceOriginal: 'UNEDITED STREAM',
  aiDisclosure: 'review-required' };
const manuscript = '# Chapter One\nExact <words> & marks.\n\nNext passage.\n# Chapter Two\nClosing.';
test('letter scanning exposes, rather than invents, the SVIRS→VIRUS edits', () => {
  const x = t.compareWords('SVIRS', 'VIRUS');
  assert.equal(x.editDistance, 2);
  assert.deepEqual(x.steps.filter(s => s.type !== 'keep').map(s => s.type + ':' + s.letter),
    ['delete:S', 'insert:U']);
  assert.equal(x.original, 'SVIRS');
});
test('chapter detection preserves the supplied manuscript', () => {
  const c = t.extractChapters(manuscript);
  assert.equal(c.length, 2);
  assert.match(c[0].text, /Exact <words> & marks/);
  assert.equal(c[1].title, 'Chapter Two');
});
test('EPUB has uncompressed mimetype first, container, OPF, nav, chapters and escaped text', () => {
  const z = t.makeEpub(spec, manuscript), e = entries(z);
  assert.equal(Object.keys(e)[0], 'mimetype');
  assert.equal(decoder.decode(e.mimetype), 'application/epub+zip');
  assert.ok(e['META-INF/container.xml']);
  assert.match(decoder.decode(e['OEBPS/content.opf']), /unique-identifier="bookid"/);
  assert.match(decoder.decode(e['OEBPS/nav.xhtml']), /chapter-2.xhtml/);
  assert.match(decoder.decode(e['OEBPS/chapter-1.xhtml']), /&lt;words&gt; &amp; marks/);
});
test('DOCX has essential OpenXML package parts and escaped manuscript text', () => {
  const e = entries(t.makeDocx(spec, manuscript));
  for (const name of ['[Content_Types].xml', '_rels/.rels', 'word/document.xml',
      'word/styles.xml', 'word/_rels/document.xml.rels']) assert.ok(e[name], name);
  assert.match(decoder.decode(e['word/document.xml']), /Exact &lt;words&gt; &amp; marks/);
  assert.match(decoder.decode(e['word/document.xml']), /w:pgSz w:w="8640" w:h="12960"/);
});
test('package separates source, working manuscript, KDP files, and always marks unpublished', () => {
  const e = entries(t.packageFiles(spec, manuscript));
  assert.equal(decoder.decode(e['SOURCE/TRANSCRIPT-ORIGINAL.txt']), 'UNEDITED STREAM');
  assert.equal(decoder.decode(e['SOURCE/WORKING-MANUSCRIPT.txt']), manuscript);
  const listing = JSON.parse(decoder.decode(e['KDP/kdp-listing.json']));
  assert.equal(listing.status, 'prepared-local-only-not-uploaded-not-published');
  assert.equal(listing.aiDisclosureReview, 'review-required');
  assert.ok(e['KDP/test-truth.epub']);
});
test('selected conversation excludes system content and alternate branches', () => {
  const data = { current_node: 'a2', mapping: {
    root: { parent: null, message: null },
    a1: { parent: 'root', message: { author: { role: 'user' }, content: { parts: ['Source'] } } },
    a2: { parent: 'a1', message: { author: { role: 'assistant' }, content: { parts: ['Selected'] } } },
    alternative: { parent: 'a1', message: { author: { role: 'assistant' }, content: { parts: ['Private other branch'] } } }
  }};
  assert.equal(t.extractChatTranscript(data), '[USER]\nSource\n\n[ASSISTANT]\nSelected');
});
test('validates empty titles, empty manuscripts, and unsafe cover types', () => {
  assert.throws(() => t.makeEpub({ title: '' }, 'hi'), /title/);
  assert.throws(() => t.makeEpub(spec, '  '), /nonempty/);
  assert.throws(() => t.packageFiles(spec, manuscript, {
    name: 'secret.html', bytes: new Uint8Array([1])
  }), /PNG or JPEG/);
});
test('site points to local JS and official KDP only, without password fields', () => {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const ui = fs.readFileSync(path.join(__dirname, 'transporter-ui.js'), 'utf8');
  assert.match(html, /engine\.js/);
  assert.match(ui, /https:\/\/kdp\.amazon\.com\//);
  assert.doesNotMatch(html, /type="password"/);
  assert.match(html, /38 user-defined reading lenses/);
});
