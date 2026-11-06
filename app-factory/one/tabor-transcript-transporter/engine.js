/* The Tabor Transcript Transporter — an additive, local-only Nathan Tabor module.
 * Original text is never silently modified. KDP handoff is NOT publication.
 * Reuses DUMMIE's tested ZIP package writer, not a second ZIP implementation.
 */
(function (root, factory) {
  'use strict';
  var zipEngine = typeof module === 'object' && module.exports
    ? require('../../dummie-publisher/publisher.js') : root.DummiePublisher;
  var api = factory(zipEngine);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TaborTranscriptTransporter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (packager) {
  'use strict';
  var encoder = new TextEncoder();
  function bytes(s) { return encoder.encode(String(s)); }
  function normalizeXml(s) {
    return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
  function safeName(s) {
    s = String(s || '').trim();
    if (!s || s.length > 180) throw Error('Enter a book title (1–180 characters).');
    return s;
  }
  function slug(s) {
    var value = safeName(s).normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    return value || 'transcript';
  }
  function specOf(meta) {
    meta = meta || {};
    var title = safeName(meta.title);
    return {
      title: title,
      subtitle: String(meta.subtitle || '').slice(0, 180),
      author: String(meta.author || 'Nathan Tabor').trim().slice(0, 120),
      description: String(meta.description || '').slice(0, 3800),
      language: String(meta.language || 'en').trim().slice(0, 20),
      keywords: (Array.isArray(meta.keywords) ? meta.keywords : String(meta.keywords || '').split(','))
        .map(function (v) { return String(v).trim(); }).filter(Boolean).slice(0, 7),
      aiDisclosure: ['generated', 'assisted-only', 'none', 'review-required'].includes(meta.aiDisclosure)
        ? meta.aiDisclosure : 'review-required',
      sourceLabel: String(meta.sourceLabel || 'editor-input').slice(0, 120),
      identifier: 'urn:tabor:transcript:' + slug(title),
      rightsReviewed: meta.rightsReviewed === true,
      disclosureReviewed: meta.disclosureReviewed === true
    };
  }
  function extractChapters(text) {
    text = String(text || '');
    if (!text.trim()) throw Error('Paste or import a nonempty manuscript.');
    if (text.length > 5500000) throw Error('Manuscript exceeds the 5.5 million character local browser limit.');
    var rows = text.replace(/\r\n?/g, '\n').split('\n');
    var chapters = [], current = { title: 'Opening', lines: [] };
    function add() {
      if (current.lines.some(function (s) { return s.trim(); })) {
        chapters.push({ title: current.title, text: current.lines.join('\n') });
      }
    }
    rows.forEach(function (line) {
      var heading = line.match(/^\s{0,3}#{1,2}\s+(.+?)\s*#*\s*$/);
      if (!heading) heading = line.match(/^\s*(chapter\s+(?:\d+|[ivxlcdm]+)(?:\s*[:—–-]\s*.+)?)\s*$/i);
      if (heading && heading[1].trim()) {
        add();
        current = { title: heading[1].trim().slice(0, 160), lines: [] };
      } else current.lines.push(line);
    });
    add();
    if (!chapters.length) chapters.push({ title: 'Manuscript', text: text });
    if (chapters.length > 250) throw Error('More than 250 detected chapters; simplify headings.');
    return chapters;
  }
  function xhtmlParagraphs(text) {
    return String(text).split(/\n\s*\n/).filter(function (p) { return p.trim(); })
      .map(function (p) { return '<p>' + p.split('\n').map(normalizeXml).join('<br/>') + '</p>'; }).join('\n');
  }
  function makeEpub(meta, manuscript) {
    var s = specOf(meta), c = extractChapters(manuscript), entries = [];
    entries.push({ path: 'mimetype', bytes: bytes('application/epub+zip') });
    entries.push({ path: 'META-INF/container.xml', bytes: bytes('<?xml version="1.0" encoding="UTF-8"?>' +
      '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">' +
      '<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>') });
    var manifest = '<item id="toc" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>' +
      '<item id="style" href="style.css" media-type="text/css"/>';
    var spine = '';
    var nav = '';
    c.forEach(function (chapter, i) {
      var id = 'c' + (i + 1), file = 'chapter-' + (i + 1) + '.xhtml';
      manifest += '<item id="' + id + '" href="' + file + '" media-type="application/xhtml+xml"/>';
      spine += '<itemref idref="' + id + '"/>';
      nav += '<li><a href="' + file + '">' + normalizeXml(chapter.title) + '</a></li>';
      entries.push({ path: 'OEBPS/' + file, bytes: bytes('<?xml version="1.0" encoding="UTF-8"?>' +
        '<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" lang="' + normalizeXml(s.language) + '">' +
        '<head><title>' + normalizeXml(chapter.title) + '</title><link rel="stylesheet" type="text/css" href="style.css"/></head>' +
        '<body><section><h1>' + normalizeXml(chapter.title) + '</h1>' +
        xhtmlParagraphs(chapter.text) + '</section></body></html>') });
    });
    entries.push({ path: 'OEBPS/nav.xhtml', bytes: bytes('<?xml version="1.0" encoding="UTF-8"?>' +
      '<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" lang="' + normalizeXml(s.language) + '">' +
      '<head><title>Contents</title></head><body><nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops" id="toc">' +
      '<h1>Contents</h1><ol>' + nav + '</ol></nav></body></html>') });
    entries.push({ path: 'OEBPS/style.css', bytes: bytes('body{font-family:serif;line-height:1.45} h1{page-break-before:always;font-size:1.6em} p{margin:0 0 .8em;text-indent:0}')} );
    entries.push({ path: 'OEBPS/content.opf', bytes: bytes('<?xml version="1.0" encoding="UTF-8"?>' +
      '<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">' +
      '<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">' +
      '<dc:identifier id="bookid">' + normalizeXml(s.identifier) + '</dc:identifier>' +
      '<dc:title>' + normalizeXml(s.title) + '</dc:title>' +
      '<dc:creator>' + normalizeXml(s.author) + '</dc:creator>' +
      '<dc:language>' + normalizeXml(s.language) + '</dc:language>' +
      '<meta property="dcterms:modified">2026-11-06T00:00:00Z</meta></metadata>' +
      '<manifest>' + manifest + '</manifest><spine>' + spine + '</spine></package>') });
    return packager.zip(entries);
  }
  function wordParagraph(text, style) {
    var ppr = style ? '<w:pPr><w:pStyle w:val="' + style + '"/></w:pPr>' : '';
    var lines = String(text).split('\n');
    var content = lines.map(function (line, index) {
      return (index ? '<w:r><w:br/></w:r>' : '') +
        '<w:r><w:t xml:space="preserve">' + normalizeXml(line) + '</w:t></w:r>';
    }).join('');
    return '<w:p>' + ppr + content + '</w:p>';
  }
  function makeDocx(meta, manuscript) {
    var s = specOf(meta), chapters = extractChapters(manuscript);
    var paragraphs = wordParagraph(s.title, 'Title') + wordParagraph(s.author, 'Subtitle');
    chapters.forEach(function (chapter) {
      paragraphs += wordParagraph(chapter.title, 'Heading1');
      chapter.text.split(/\n\s*\n/).filter(function (p) { return p.trim(); }).forEach(function (p) {
        paragraphs += wordParagraph(p);
      });
    });
    var document = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
      paragraphs + '<w:sectPr><w:pgSz w:w="8640" w:h="12960"/>' +
      '<w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="360" w:footer="360" w:gutter="0"/>' +
      '</w:sectPr></w:body></w:document>';
    var styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/>' +
      '<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="22"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:rPr><w:sz w:val="24"/></w:rPr></w:style>' +
      '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:pageBreakBefore/></w:pPr>' +
      '<w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style></w:styles>';
    var files = [
      { path: '[Content_Types].xml', bytes: bytes('<?xml version="1.0" encoding="UTF-8"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
        '</Types>') },
      { path: '_rels/.rels', bytes: bytes('<?xml version="1.0" encoding="UTF-8"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '</Relationships>') },
      { path: 'word/_rels/document.xml.rels', bytes: bytes('<?xml version="1.0" encoding="UTF-8"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '</Relationships>') },
      { path: 'word/styles.xml', bytes: bytes(styles) },
      { path: 'word/document.xml', bytes: bytes(document) }
    ];
    return packager.zip(files);
  }
  function compareWords(a, b) {
    a = String(a); b = String(b);
    var A = Array.from(a), B = Array.from(b);
    if (A.length > 120 || B.length > 120) throw Error('Pattern scanner supports up to 120 characters per field.');
    var d = Array.from({ length: A.length + 1 }, function () { return Array(B.length + 1).fill(0); });
    for (var i = 0; i <= A.length; i++) d[i][0] = i;
    for (var j = 0; j <= B.length; j++) d[0][j] = j;
    for (i = 1; i <= A.length; i++) for (j = 1; j <= B.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1,
        d[i - 1][j - 1] + (A[i - 1].toLowerCase() === B[j - 1].toLowerCase() ? 0 : 1));
    var steps = [];
    i = A.length; j = B.length;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && A[i - 1].toLowerCase() === B[j - 1].toLowerCase() && d[i][j] === d[i - 1][j - 1]) {
        steps.unshift({ type: 'keep', letter: A[i - 1], sourcePosition: i, targetPosition: j }); i--; j--;
      } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
        steps.unshift({ type: 'delete', letter: A[i - 1], sourcePosition: i }); i--;
      } else if (j > 0 && d[i][j] === d[i][j - 1] + 1) {
        steps.unshift({ type: 'insert', letter: B[j - 1], targetPosition: j }); j--;
      } else {
        steps.unshift({ type: 'replace', from: A[i - 1], to: B[j - 1], sourcePosition: i, targetPosition: j }); i--; j--;
      }
    }
    return { original: a, candidate: b, editDistance: d[A.length][B.length], steps: steps,
      sourceReversed: A.reverse().join(''), targetReversed: B.reverse().join('') };
  }
  function extractChatTranscript(record, roles) {
    roles = roles || ['user', 'assistant'];
    if (!record || typeof record !== 'object') throw Error('Conversation record missing.');
    var messages = [];
    if (record.mapping && typeof record.mapping === 'object') {
      var nodes = record.mapping, chain = [], at = record.current_node, visited = {};
      while (at && nodes[at] && !visited[at]) { visited[at] = true; chain.unshift(nodes[at]); at = nodes[at].parent; }
      if (!chain.length) chain = Object.values(nodes).filter(function (n) { return n && n.message; })
        .sort(function (a, b) { return (a.message.create_time || 0) - (b.message.create_time || 0); });
      messages = chain.map(function (n) { return n.message; }).filter(Boolean);
    } else if (Array.isArray(record.messages)) messages = record.messages;
    var chunks = [];
    messages.forEach(function (m) {
      var role = m.author && m.author.role || m.role || '';
      if (!roles.includes(role)) return;
      var content = m.content || {};
      var parts = Array.isArray(content.parts) ? content.parts.filter(function (p) { return typeof p === 'string'; })
        : (typeof content.text === 'string' ? [content.text] : (typeof m.text === 'string' ? [m.text] : []));
      if (parts.length) chunks.push('[' + role.toUpperCase() + ']\n' + parts.join('\n'));
    });
    if (!chunks.length) throw Error('No readable text messages found in the selected conversation.');
    return chunks.join('\n\n');
  }
  function packageFiles(meta, original, cover) {
    var s = specOf(meta);
    if (!String(original || '').trim()) throw Error('A manuscript is required.');
    var name = slug(s.title), files = [
      { path: 'SOURCE/TRANSCRIPT-ORIGINAL.txt', bytes: bytes(original) },
      { path: 'KDP/' + name + '.epub', bytes: makeEpub(s, original) },
      { path: 'KDP/' + name + '-print-draft.docx', bytes: makeDocx(s, original) },
      { path: 'KDP/kdp-listing.json', bytes: bytes(JSON.stringify({
        title: s.title, subtitle: s.subtitle, author: s.author, language: s.language,
        description: s.description, keywords: s.keywords, aiDisclosureReview: s.aiDisclosure,
        rightsReviewed: s.rightsReviewed, disclosureReviewed: s.disclosureReviewed,
        status: 'prepared-local-only-not-uploaded-not-published'
      }, null, 2)) },
      { path: 'READ-ME-FIRST.txt', bytes: bytes(
        'THE TABOR TRANSCRIPT TRANSPORTER — THE TRANSCRIBER\n' +
        'Original creator: Nathan Tabor\n\n' +
        'Your original manuscript is in SOURCE/ and is not silently rewritten.\n' +
        'EPUB and DOCX are derived artifacts. Proofread every page in Kindle Previewer and print preview.\n' +
        'KDP upload, pricing, AI disclosure, rights, cover verification and final submission are MANUAL.\n' +
        'A print DOCX is a starting layout, NOT a certified print-ready KDP interior.\n' +
        'No Amazon account login, upload, publication or approval occurs in this application.\n' +
        'Official dashboard: https://kdp.amazon.com/\n' +
        'Privacy: your full ChatGPT export is not bundled; only selected transcript text is packaged.\n') }
    ];
    if (cover && cover.bytes && cover.name) {
      var extension = String(cover.name).toLowerCase().match(/\.(png|jpe?g)$/);
      if (!extension) throw Error('Cover must be PNG or JPEG.');
      if (!(cover.bytes instanceof Uint8Array) || cover.bytes.length > 15 * 1024 * 1024)
        throw Error('Cover must be under 15 MiB.');
      files.push({ path: 'COVER/cover.' + extension[1].replace('jpeg', 'jpg'), bytes: cover.bytes });
    }
    return packager.zip(files);
  }
  return Object.freeze({ specOf: specOf, extractChapters: extractChapters, makeEpub: makeEpub,
    makeDocx: makeDocx, packageFiles: packageFiles, compareWords: compareWords,
    extractChatTranscript: extractChatTranscript, slug: slug });
});
