(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.NathanCapabilities = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FORMULAS = Object.freeze(['node = mind = node', 'mind = node = mind']);
  // This is Nathan Tabor's authored identity rule, not a scientific assertion
  // that all network/software nodes possess consciousness.
  const CAPABILITIES = Object.freeze([
    ['receive', 'Receive / acquire'],
    ['recognize', 'Recognize / identify'],
    ['remember', 'Store / remember'],
    ['retrieve', 'Retrieve / recall'],
    ['connect', 'Connect / relate'],
    ['transform', 'Process / transform'],
    ['interpret', 'Interpret / represent'],
    ['evaluate', 'Evaluate / verify'],
    ['decide', 'Decide / control'],
    ['create', 'Create / compose'],
    ['communicate', 'Communicate / transmit'],
    ['adapt', 'Adapt / respond'],
    ['protect', 'Protect / validate'],
    ['restore', 'Recover / restore'],
    ['sequence', 'Sequence / time'],
    ['present', 'Present / interact'],
    ['measure', 'Measure / observe'],
    ['execute', 'Execute / coordinate']
  ].map(([id, title]) => Object.freeze({ id, title })));

  const CANDIDATES = Object.freeze({
    receive: /(?:import|upload|input|ingest|source|feed|rss|connector|scrape|adapter|intake|camera|sensor)/i,
    recognize: /(?:recognition|classifier|detect|pattern|identify|parser|lexicon|phonetic|search)/i,
    remember: /(?:memory|database|archive|sqlite|store|vault|history|catalog|ledger|index)/i,
    retrieve: /(?:search|find|query|lookup|reader|browser|explorer|library|index)/i,
    connect: /(?:connect|link|graph|relationship|network|sync|bridge|api|plugin|node)/i,
    transform: /(?:convert|encode|decode|translate|transform|engine|compute|render|matrix)/i,
    interpret: /(?:word|language|lexicon|meaning|semantic|scripture|dictionary|linguistic)/i,
    evaluate: /(?:test|audit|verify|check|quality|evidence|score|benchmark|validate)/i,
    decide: /(?:policy|rule|gate|decision|state|command|workflow|permission)/i,
    create: /(?:studio|factory|creator|generator|build|publish|writing|editor|craft)/i,
    communicate: /(?:message|chat|email|notification|share|voice|speech|transmit)/i,
    adapt: /(?:adapt|learn|feedback|training|responsive|reaction)/i,
    protect: /(?:protect|defend|security|auth|safe|virus|ransomware|integrity|privacy|guard)/i,
    restore: /(?:backup|restore|recovery|offload|snapshot|archive|version)/i,
    sequence: /(?:time|date|schedule|event|history|timeline|calendar|clock)/i,
    present: /(?:view|display|interface|ui|html|css|style|page|game|play|visual)/i,
    measure: /(?:measure|metric|monitor|stat|analy|sensor|telemetry|performance)/i,
    execute: /(?:runner|runtime|worker|job|task|pipeline|deploy|automation)/i
  });
  // These regexes identify code *signals*, not proof of successful execution.
  const SIGNALS = Object.freeze({
    receive: [
      ['fetch call', /\bfetch\s*\(/],
      ['file input', /type\s*=\s*["']file["']|FileReader\b/],
      ['file parse', /\bJSON\.parse\s*\(|\breadFile(?:Sync)?\s*\(/]
    ],
    recognize: [
      ['regex matching', /\b(?:match|matchAll|test)\s*\(|\.test\s*\(/],
      ['search or matching', /\b(?:includes|startsWith|endsWith|indexOf)\s*\(/]
    ],
    remember: [
      ['browser storage', /\b(?:localStorage|sessionStorage|indexedDB)\b/],
      ['database operation', /\b(?:sqlite3|CREATE\s+TABLE|INSERT\s+INTO|UPDATE\s+\w+\s+SET)\b/i],
      ['file write', /\b(?:writeFile|write_text|write_bytes)\s*\(/]
    ],
    retrieve: [
      ['data selection', /\b(?:SELECT\s+.+?\s+FROM|querySelector|querySelectorAll)\b/i],
      ['collection filter', /\.filter\s*\(/],
      ['find operation', /\.find\s*\(/]
    ],
    connect: [
      ['module import', /\b(?:import\s+|require\s*\()/],
      ['network URL', /https?:\/\/[^\s"']+/],
      ['message channel', /\b(?:postMessage|WebSocket|BroadcastChannel)\b/]
    ],
    transform: [
      ['data mapping', /\.map\s*\(/],
      ['data encoding', /\b(?:TextEncoder|TextDecoder|encodeURIComponent|atob|btoa)\s*\(?/],
      ['string transformation', /\.replace(?:All)?\s*\(/]
    ],
    interpret: [
      ['locale handling', /\b(?:Intl\.|toLocale|normalize\s*\()/],
      ['speech processing', /\b(?:SpeechRecognition|speechSynthesis)\b/]
    ],
    evaluate: [
      ['assertion', /\b(?:assert\.|expect\s*\(|test\s*\(|describe\s*\()/],
      ['checksum digest', /\b(?:digest\s*\(|createHash\s*\()/]
    ],
    decide: [
      ['conditional branch', /\b(?:if\s*\(|switch\s*\()/],
      ['dispatch', /\b(?:dispatch|reducer|route)\s*\(/]
    ],
    create: [
      ['DOM construction', /\b(?:createElement|appendChild|insertAdjacentHTML)\s*\(/],
      ['document generation', /\b(?:Blob\s*\(|createObjectURL|writeFile)\s*\(/]
    ],
    communicate: [
      ['message send', /\b(?:postMessage|sendEmail|sendMessage|send\s*\()/],
      ['speech synthesis', /\bspeechSynthesis\b/]
    ],
    adapt: [
      ['state update', /\b(?:setState|useState|addEventListener)\s*\(/],
      ['feedback logic', /\b(?:feedback|reward|retry|retrain)\b/i]
    ],
    protect: [
      ['input sanitization', /\b(?:sanitize|escapeHTML|safeParse|noCredentials)\s*\(/],
      ['input validation', /\b(?:validate|isValid|assertSafe|verify)\s*\(/],
      ['authorization checks', /\b(?:authorize|permission|accessControl)\s*\(/]
    ],
    restore: [
      ['backup or restoration', /\b(?:restore|backup|snapshot|recovery)\s*\(/],
      ['integrity check', /\b(?:sha256|sha-256|checksum|digest)\b/i]
    ],
    sequence: [
      ['clock timestamp', /\bDate\.now\s*\(|\bnew Date\s*\(/],
      ['scheduled work', /\b(?:setInterval|setTimeout|cron)\s*\(/]
    ],
    present: [
      ['DOM interaction', /\b(?:addEventListener|querySelector|getElementById)\s*\(/],
      ['visual rendering', /\b(?:getContext|requestAnimationFrame|innerHTML|textContent)\b/]
    ],
    measure: [
      ['measurement', /\b(?:performance\.now|performance\.mark|console\.time)\s*\(/],
      ['counting or aggregation', /\.reduce\s*\(|\.length\b/]
    ],
    execute: [
      ['worker execution', /\b(?:new Worker|Worker\s*\(|child_process|execFile|spawn)\b/],
      ['asynchronous work', /\b(?:async\s+function|async\s*\(|await\s+)\b/]
    ]
  });
  const CODE = /\.(?:js|mjs|cjs|ts|tsx|jsx|py|swift|ino|sql|sh|html|css|yml|yaml)$/i;
  function kind(path, entryType) {
    if (entryType === 'd') return 'directory';
    if (/\.(?:png|jpg|jpeg|gif|webp|ico|svg)$/i.test(path)) return 'image / asset';
    if (/\.(?:zip|pdf|docx|xlsx|pptx)$/i.test(path)) return 'package / artifact';
    if (/\.(?:json|csv|tsv|jsonl)$/i.test(path)) return 'structured data';
    if (/\.(?:md|txt|rst)$/i.test(path)) return 'documentation / source';
    if (/\.(?:test\.[cm]?js|spec\.[cm]?js)$/i.test(path)) return 'test code';
    if (CODE.test(path)) return 'executable / interface source';
    return 'other';
  }
  function scope(path) {
    if (path.startsWith('app-factory/nathan-ai/')) return 'Nathan AI';
    if (path.startsWith('app-factory/one/')) return 'ONE';
    if (path.startsWith('app-factory/')) return 'Factory / other apps';
    if (path.startsWith('archive-index/')) return 'Archive';
    if (path.startsWith('docs/')) return 'Documentation';
    if (path.startsWith('.github/')) return 'GitHub automation';
    return 'Repository root / tools';
  }
  function fromPath(entry) {
    if (!entry || typeof entry.p !== 'string' || !['f', 'd'].includes(entry.t))
      throw new Error('Invalid repository inventory entry');
    const path = entry.p;
    const candidates = Object.keys(CANDIDATES).filter(id => CANDIDATES[id].test(path));
    return {
      path, type: kind(path, entry.t), entryType: entry.t, scope: scope(path),
      bytes: Number(entry.b) || 0, gitSha: String(entry.s || ''),
      candidates, observed: [], evidence: [], evidenceLevel: 'path-only',
      runtimeVerified: false, reviewStatus: 'not-source-reviewed'
    };
  }
  function analyzeText(entry, source) {
    const row = fromPath(entry);
    if (entry.t !== 'f' || !CODE.test(entry.p) || typeof source !== 'string')
      return row;
    for (const [capability, patterns] of Object.entries(SIGNALS)) {
      for (const [signal, expression] of patterns) {
        if (expression.test(source)) {
          if (!row.observed.includes(capability)) row.observed.push(capability);
          row.evidence.push({ capability, signal, basis: 'static-source-pattern' });
        }
      }
    }
    row.evidenceLevel = 'static-source-scanned';
    row.reviewStatus = 'automated-review-only';
    return row;
  }
  function summary(records) {
    const result = { total: records.length, byScope: {}, byType: {}, candidateCounts: {}, observedCounts: {}, sourceScanned: 0, runtimeVerified: 0 };
    for (const row of records) {
      result.byScope[row.scope] = (result.byScope[row.scope] || 0) + 1;
      result.byType[row.type] = (result.byType[row.type] || 0) + 1;
      row.candidates.forEach(c => { result.candidateCounts[c] = (result.candidateCounts[c] || 0) + 1; });
      row.observed.forEach(c => { result.observedCounts[c] = (result.observedCounts[c] || 0) + 1; });
      if (row.evidenceLevel === 'static-source-scanned') result.sourceScanned++;
      if (row.runtimeVerified) result.runtimeVerified++;
    }
    return result;
  }
  function search(records, options) {
    const o = options || {};
    const query = String(o.query || '').trim().toLowerCase();
    return records.filter(r =>
      (!o.scope || o.scope === 'All' || r.scope === o.scope) &&
      (!o.capability || o.capability === 'All' || r.candidates.includes(o.capability) || r.observed.includes(o.capability)) &&
      (!o.type || o.type === 'All' || r.type === o.type) &&
      (!query || [r.path, r.scope, r.type, ...r.candidates, ...r.observed].join(' ').toLowerCase().includes(query))
    );
  }
  return Object.freeze({ FORMULAS, CAPABILITIES, kind, scope, fromPath, analyzeText, summary, search });
});
