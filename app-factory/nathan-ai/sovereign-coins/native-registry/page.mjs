const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

const navigation = [
  ['Native coins', 'scope=native'],
  ['Numbers', 'group=NUMBERS&scope=all'],
  ['Symbols', 'group=SYMBOLS'],
  ['Nathan AI & Tabor designs', 'scope=design'],
  ['21-ring matrix', 'group=MATRIX21'],
  ['Connected networks', 'scope=connected'],
  ['Historical native coins', 'scope=historical'],
  ['Exclusions and open identifications', 'scope=review'],
  ['Full index', 'scope=all'],
];

export function registryPage(selection, coins) {
  const search = new URLSearchParams({ scope: selection.scope });
  if (selection.group) search.set('group', selection.group);
  if (selection.q) search.set('q', selection.q);
  const letters = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ', (letter) => {
    search.set('letter', letter);
    return '<a href="/registry?' + escape(search) + '"' + (selection.letter === letter ? ' aria-current="page"' : '') + '>' + letter + '</a>';
  }).join('');
  if (selection.letter) search.set('letter', selection.letter);
  else search.delete('letter');
  const row = (coin) => {
    const [namespace, symbol] = coin.related_id?.split(':') ?? [];
    const relation = coin.related_id ? '<p>Related <a href="/registry?scope=all&amp;q=' +
      escape(encodeURIComponent(coin.related_id)) + '">' + escape(symbol + ' (' + namespace + ')') + '</a></p>' : '';
    const units = coin.position ? '<p>Ring ' + coin.position + ' · ' +
      (coin.design_units === null ? 'Design allocation unspecified' : coin.design_units.toLocaleString('en-US') + ' design units') + '</p>' : '';
    const original = coin.submitted ? '<details><summary>Submitted wording</summary><p>' + escape(coin.submitted) + '</p>' +
      (coin.submitted_seed ? '<p>Submitted SQL seed · ' + escape(coin.submitted_seed.method) + ' · ' +
        escape(coin.submitted_seed.note) + '</p>' : '') + '</details>' : '';
    return '<tr><th scope="row">' + escape(coin.symbol) + '</th><td><strong>' + escape(coin.name) + '</strong><br><small>' +
      escape(coin.id) + '</small></td><td>' + escape(coin.consensus_or_math || '—') + '</td><td><small>' +
      escape(coin.asset_class) + '</small><p>' + escape(coin.notes) + '</p>' + units + relation + original +
      (coin.source_url ? '<p><a href="' + escape(coin.source_url) + '">Source for ' + escape(coin.symbol) + '</a></p>' : '') + '</td></tr>';
  };
  return `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nathan AI Mining &amp; Wallet · Sovereign Coin Registry</title>
<link rel="stylesheet" href="/registry.css"><script type="module" src="/registry.js"></script>
<main><header><h1>Sovereign Coin Registry</h1>
<p>Nathan AI Mining &amp; Wallet</p>
<nav aria-label="Project links">
<a href="https://nathan-ai-mining-lab.nathantaboract.workers.dev/">Mining Lab</a>
<a href="https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/nathan-ai/sovereign-coins/integrations/index.html">Wallet Command Center</a>
<a href="/coins">Historical coin catalog JSON</a>
<a href="https://nathan-ai-crypto-64.nathantaboract.workers.dev/restoration">64-position archive</a>
<a href="#hash">Hash verifier</a><a href="#bounties">Bounties</a></nav></header>
<section aria-labelledby="registry-title"><h2 id="registry-title">Asset index</h2>
<nav aria-label="Registry views">${navigation.map(([name, query]) => '<a href="/registry?' + escape(query) + '">' + name + '</a>').join('')}</nav>
<nav aria-label="Alphabetical index">${letters}</nav>
<form action="/registry" method="get">
<input type="hidden" name="scope" value="${escape(selection.scope)}">
${selection.group ? '<input type="hidden" name="group" value="' + escape(selection.group) + '">' : ''}
<label for="coin-query">Find a symbol, network or design</label>
<div class="fields"><input id="coin-query" type="search" name="q" value="${escape(selection.q)}" maxlength="120"><button>Search</button></div>
</form>
<p>${coins.length} records · <a href="/coins/sovereign?${escape(search)}">Download this view as JSON</a></p>
<div class="table-wrap" tabindex="0" role="region" aria-label="Coin records"><table><thead>
<tr><th>Symbol</th><th>Asset or design</th><th>Consensus or math</th><th>Record</th></tr></thead>
<tbody>${coins.map(row).join('') || '<tr><td colspan="4">No matching records.</td></tr>'}</tbody></table></div></section>
<section id="hash"><h2>Verify a hash</h2><p>Use public test data. Enter an expected digest or a hexadecimal target to check it against the calculated digest.</p>
<form id="hash-form" method="post" action="/verify-hash"><div class="fields">
<label>Algorithm<select name="algorithm"><option>SHA-256</option><option>SHA3-512</option></select></label>
<label>Input encoding<select name="encoding"><option>utf8</option><option>hex</option></select></label></div>
<label>Data<textarea name="data" maxlength="4096" rows="3"></textarea></label>
<label>Expected digest (optional)<input name="expected" maxlength="128" autocomplete="off"></label>
<label>Hexadecimal target (optional)<input name="target" maxlength="128" autocomplete="off"></label>
<button>Verify hash</button></form><pre id="hash-result" aria-live="polite"></pre></section>
<section id="bounties"><h2>Global Bounties &amp; Grand Challenges</h2><nav aria-label="Bounty sources">
<a href="https://tabor-bridge.nathantaboract.workers.dev/global-bounties/join">Open the bounty project</a>
<a href="/coins/sovereign/bounties">Catalog</a><a href="/coins/sovereign/bounties/work">Civic work</a>
<a href="/coins/sovereign/bounties/intake">Prize intake</a></nav></section>
</main></html>`;
}

export const browserScript = `const form = document.querySelector('#hash-form');
const result = document.querySelector('#hash-result');
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = Object.fromEntries(new FormData(form));
  for (const key of ['expected', 'target']) {
    input[key] = input[key].trim();
    if (!input[key]) delete input[key];
  }
  result.textContent = 'Verifying…';
  try {
    const response = await fetch('/verify-hash', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    result.textContent = JSON.stringify(await response.json(), null, 2);
  } catch {
    result.textContent = 'Hash service temporarily unavailable.';
  }
});`;

export const styleSheet = `
:root{color-scheme:dark;font:16px/1.5 system-ui,sans-serif;background:#0b1320;color:#ecf4ff}
*{box-sizing:border-box}main{margin:auto;max-width:1160px;padding:clamp(16px,4vw,44px)}
header{padding-bottom:20px;border-bottom:1px solid #38516b}h1{font-size:clamp(2rem,5vw,3rem);line-height:1.08;margin:0}
header p,small{color:#b3c7db}a{color:#86d8fe}section{margin-top:30px}nav,.fields{display:flex;flex-wrap:wrap;gap:12px;align-items:end;margin:12px 0}
nav[aria-label="Alphabetical index"] a{padding:2px 5px}a[aria-current="page"]{background:#86d8fe;color:#0b1320}
label{display:block}input,select,textarea,button{font:inherit;margin:4px 0 12px;padding:8px;border:1px solid #7090ae;border-radius:6px}
input,textarea{width:min(100%,34rem)}input,textarea,select{background:#061322;color:inherit}button{background:#8be1ff;color:#0b1320;font-weight:700;cursor:pointer}
table{width:100%;min-width:650px;border-collapse:collapse;background:#112035}th,td{text-align:left;vertical-align:top;padding:10px;border-bottom:1px solid #38516b}
td p,details p{margin:4px 0 8px}summary{color:#86d8fe;cursor:pointer}.table-wrap{overflow:auto}pre{white-space:pre-wrap;overflow-wrap:anywhere}
`;
