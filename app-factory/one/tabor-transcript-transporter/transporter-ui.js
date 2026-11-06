/* THE TABOR TRANSCRIPT TRANSPORTER · Browser-only UI. No remote manuscript uploads. */
(function () {
  'use strict';
  function el(id) { return document.getElementById(id); }
  var T, sourceOriginal = null, sourceLabel = 'pasted-text', conversations = [], cover = null;
  function report(id, value) { el(id).textContent = value; }
  function getMeta() {
    return {
      title: el('title').value,
      subtitle: el('subtitle').value,
      author: el('author').value,
      language: el('language').value,
      description: el('description').value,
      keywords: el('keywords').value,
      aiDisclosure: el('ai-disclosure').value,
      sourceLabel: sourceLabel,
      sourceOriginal: sourceOriginal,
      rightsReviewed: el('rights').checked,
      disclosureReviewed: el('disclosure-check').checked
    };
  }
  function manuscript() {
    var text = el('manuscript').value;
    if (!text.trim()) throw Error('Paste or import some transcript text first.');
    return text;
  }
  function onError(where, e) { report(where, 'NOT COMPLETED: ' + (e && e.message || String(e))); }
  function download(data, name, mime) {
    var blob = new Blob([data], { type: mime }), url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 15000);
  }
  function build(which) {
    var meta = getMeta(), text = manuscript(), slug = T.slug(meta.title);
    if (sourceOriginal === null) {
      sourceOriginal = text;
      report('source-status', 'First source snapshot sealed in memory. Working text may now be edited independently.');
      meta.sourceOriginal = sourceOriginal;
    }
    var data, fileName, type;
    if (which === 'epub') {
      data = T.makeEpub(meta, text);
      fileName = slug + '.epub';
      type = 'application/epub+zip';
    } else if (which === 'word') {
      data = T.makeDocx(meta, text);
      fileName = slug + '-print-draft.docx';
      type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else {
      data = T.packageFiles(meta, text, cover);
      fileName = slug + '-kdp-handoff.zip';
      type = 'application/zip';
    }
    download(data, fileName, type);
    report('publish-status', 'Prepared local ' + fileName + ' (' + Math.round(data.length / 1024) +
      ' KiB). Verify it was saved on your device. No Amazon upload or publication has occurred.');
  }
  function conversationList(value) {
    var records = Array.isArray(value) ? value : [value];
    conversations = records.filter(function (record) {
      return record && typeof record === 'object' && (record.mapping || record.messages);
    });
    if (!conversations.length) throw Error('No ChatGPT conversation records found. Import conversations.json or paste text.');
    var select = el('conversation'); select.textContent = '';
    conversations.forEach(function (rec, i) {
      var option = document.createElement('option');
      option.value = String(i);
      option.textContent = String(rec.title || ('Conversation ' + (i + 1))).slice(0, 140);
      select.appendChild(option);
    });
    el('chat-wrap').hidden = false;
    report('source-status', 'Loaded ' + conversations.length + ' conversation records in browser memory. Choose one transcript; other conversations are not included in the KDP bundle.');
  }
  function loadSelected() {
    var record = conversations[Number(el('conversation').value)];
    var role = el('roles').value;
    var roles = role === 'both' ? ['user', 'assistant'] : [role];
    var text = T.extractChatTranscript(record, roles);
    el('manuscript').value = text;
    sourceOriginal = text; sourceLabel = 'chatgpt-selected-transcript';
    if (!el('title').value) el('title').value = String(record.title || 'Untitled Transcript').slice(0, 180);
    report('source-status', 'Sealed exact selected transcript string (' + text.length + ' characters; ' + roles.join(' + ') + '). The full export and other chats will not be bundled.');
    el('chat-wrap').hidden = false;
  }
  async function importFile(file) {
    if (!file) return;
    if (file.size > 24 * 1024 * 1024) throw Error('This browser prototype limits imports to 24 MiB. Extract a smaller text file from a large export.');
    if (/\.json$/i.test(file.name)) {
      conversationList(JSON.parse(await file.text()));
      sourceLabel = 'chatgpt-json-import';
      return;
    }
    if (!/\.(txt|md|markdown)$/i.test(file.name)) throw Error('Choose TXT, MD, or conversations.json.');
    var text = await file.text();
    el('manuscript').value = text;
    sourceOriginal = text; sourceLabel = file.name;
    if (!el('title').value) el('title').value = file.name.replace(/\.(txt|md|markdown)$/i, '').slice(0, 180);
    el('chat-wrap').hidden = true;
    report('source-status', 'Sealed imported text from ' + file.name + ' (' + text.length + ' characters). Source snapshot remains separate from edits.');
  }
  function inspect() {
    var c = T.extractChapters(manuscript()), total = c.reduce(function (n, x) { return n + x.text.length; }, 0);
    report('chapter-report', c.length + ' chapter section(s) detected; ' + total + ' content characters.\n' +
      c.slice(0, 16).map(function (x, i) { return (i + 1) + '. ' + x.title; }).join('\n') +
      (c.length > 16 ? '\n… and ' + (c.length - 16) + ' more.' : '') +
      '\n\nHeadings recognized: # / ## Markdown or Chapter N. Source text is unchanged.');
  }
  function showCompare() {
    var result = T.compareWords(el('pattern-a').value, el('pattern-b').value);
    var steps = result.steps.map(function (step) {
      if (step.type === 'keep') return 'KEEP ' + step.letter + ' (original ' + step.sourcePosition + ' → candidate ' + step.targetPosition + ')';
      if (step.type === 'delete') return 'DELETE ' + step.letter + ' (original position ' + step.sourcePosition + ')';
      if (step.type === 'insert') return 'INSERT ' + step.letter + ' (candidate position ' + step.targetPosition + ')';
      return 'REPLACE ' + step.from + ' with ' + step.to;
    }).join('\n');
    report('compare-output', 'ORIGINAL: ' + result.original + '\nCANDIDATE: ' + result.candidate +
      '\nMinimum single-character edits: ' + result.editDistance + '\n\n' + steps +
      '\n\nReversed character order (NOT reflected glyph shapes): ' + result.sourceReversed +
      ' / ' + result.targetReversed +
      '\nInterpretation remains distinct from the original.');
  }
  function savedLenses() {
    try {
      var value = JSON.parse(localStorage.getItem('tabor-transcriber-lenses-v1') || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (_e) { return {}; }
  }
  function renderLens() {
    var value = savedLenses()[el('lens').value] || { name: '', note: '' };
    el('lens-name').value = value.name || '';
    el('lens-note').value = value.note || '';
  }
  function saveLens() {
    var lenses = savedLenses(), key = el('lens').value;
    lenses[key] = { name: el('lens-name').value.trim().slice(0, 100),
      note: el('lens-note').value.slice(0, 4000) };
    try {
      localStorage.setItem('tabor-transcriber-lenses-v1', JSON.stringify(lenses));
      report('lens-status', 'Saved lens ' + key + ' in this browser only. Export your descriptions separately for durable backup.');
    } catch (e) { onError('lens-status', e); }
  }
  function boot() {
    T = window.TaborTranscriptTransporter;
    if (!T || !window.DummiePublisher) {
      report('publish-status', 'Application dependencies are missing. Open from the full TABOR Factory site.');
      return;
    }
    for (var i = 1; i <= 38; i++) {
      var option = document.createElement('option'), num = String(i).padStart(2, '0');
      option.value = num; option.textContent = 'Lens ' + num + ' — user-defined';
      el('lens').appendChild(option);
    }
    el('lens').addEventListener('change', renderLens);
    renderLens();
    el('save-lens').addEventListener('click', saveLens);
    el('file').addEventListener('change', async function () {
      try { await importFile(this.files[0]); } catch (e) { onError('source-status', e); }
    });
    el('cover').addEventListener('change', async function () {
      try {
        var f = this.files[0]; if (!f) return;
        if (!/\.(jpg|jpeg|png)$/i.test(f.name) || f.size > 15 * 1024 * 1024) throw Error('Choose a JPEG or PNG under 15 MiB.');
        cover = { name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) };
        report('publish-status', 'Cover loaded in memory: ' + f.name + '. Dimensions and artwork rights still require review.');
      } catch (e) { cover = null; onError('publish-status', e); }
    });
    el('load-conversation').addEventListener('click', function () { try { loadSelected(); } catch (e) { onError('source-status', e); } });
    el('seal-original').addEventListener('click', function () {
      try { sourceOriginal = manuscript(); sourceLabel = 'manually-sealed-text'; report('source-status', 'Exact current transcript sealed in memory (' + sourceOriginal.length + ' characters). Edits now stay separate.'); }
      catch (e) { onError('source-status', e); }
    });
    el('preview-chapters').addEventListener('click', function () { try { inspect(); } catch (e) { onError('chapter-report', e); } });
    [['make-package', 'package'], ['make-epub', 'epub'], ['make-word', 'word']].forEach(function (pair) {
      el(pair[0]).addEventListener('click', function () { try { build(pair[1]); } catch (e) { onError('publish-status', e); } });
    });
    el('go-kdp').addEventListener('click', function () {
      if (!el('rights').checked || !el('disclosure-check').checked || el('ai-disclosure').value === 'review-required') {
        report('publish-status', 'Finish the rights checks and choose the appropriate AI-content review status before KDP handoff.');
        return;
      }
      window.open('https://kdp.amazon.com/', '_blank', 'noopener,noreferrer');
      report('publish-status', 'Amazon KDP opened in a separate tab. Sign in and upload your prepared files yourself. Publication is not confirmed.');
    });
    el('compare').addEventListener('click', function () { try { showCompare(); } catch (e) { onError('compare-output', e); } });
    showCompare();
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
