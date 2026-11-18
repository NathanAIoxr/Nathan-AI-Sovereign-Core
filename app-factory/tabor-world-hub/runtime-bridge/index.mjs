const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const registryHub = {async fetch(request,env){const u=new URL(request.url);const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','cache-control':'public,max-age=60'}});if(u.pathname==='/health')return json({name:'Tabor World Hub',status:'online',mode:'read-only',database:'tabor-database-registry'});if(u.pathname==='/api/systems'){const q=(u.searchParams.get('q')||'').slice(0,100);const r=await env.REGISTRY.prepare('SELECT id,name,kind,status,provenance FROM supercomputer_registry WHERE name LIKE ? ORDER BY name LIMIT 200').bind('%'+q+'%').all();return json({count:r.results.length,systems:r.results})}if(u.pathname==='/api/overview'){const r=await env.REGISTRY.prepare('SELECT kind,status,COUNT(*) AS count FROM supercomputer_registry GROUP BY kind,status').all();return json({name:'Tabor World Hub',registry:r.results,architecture:['NATHAN OS','Nathan Tabor Supercomputer','ABM Master Brain','4T Clover','78-Field Matrix','Worldwide Agents','Tabor Light/Dark Slayer/Sleyer'],notice:'Registry records are specifications; they do not establish running agents.'})}if(u.pathname!=='/')return json({error:'not found'},404);const r=await env.REGISTRY.prepare('SELECT id,name,status FROM supercomputer_registry ORDER BY name LIMIT 200').all();const items=r.results.map(x=>'<article><strong>'+esc(x.name)+'</strong><small>'+esc(x.status)+'</small></article>').join('');return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tabor World Hub</title><style>body{margin:0;background:#0b1220;color:#e8eef8;font:16px system-ui}header{padding:44px 7%;background:linear-gradient(120deg,#12263f,#173c50)}h1{font-size:clamp(2rem,6vw,4rem);margin:0}p{color:#b6c8da;max-width:70ch}main{padding:24px 7%}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}article{border:1px solid #31485c;border-radius:12px;padding:18px;background:#142237}small{display:block;color:#92e0cc;margin-top:8px}a{color:#8de0ff}</style><header><h1>TABOR WORLD HUB</h1><p>Nathan Tabor Supercomputer · NATHAN AI · Library of Tabor · Worldwide Worker Federation</p><p>Preserving original systems, names, source provenance, and independent applications.</p></header><main><h2>Supercomputer Systems ('+r.results.length+')</h2><p>Catalog status is not deployment status. Existing Cloudflare applications remain independent.</p><p><a href="/api/overview">Architecture API</a> · <a href="/api/systems">Searchable registry API</a> · <a href="/health">Health</a></p><section>'+items+'</section></main></html>',{headers:{'content-type':'text/html; charset=utf-8','cache-control':'public,max-age=60'}})}};

const services = [
  { id: 'supercomputer', name: 'Nathan Tabor Supercomputer', binding: 'SUPERCOMPUTER', health: '/healthz', worker: 'nathan-tabor-supercomputer' },
  { id: 'registry', name: 'Supercomputer Registry', binding: 'COMPUTE_REGISTRY', worker: 'tabor-supercomputer-registry' },
  { id: 'mining', name: 'TABOR CORP Mining Hub', binding: 'MINING_HUB', worker: 'tabor-corp-mining-hub' },
  { id: 'currency', name: 'Tabor Sovereign Currency', binding: 'CURRENCY', health: '/healthz', worker: 'tabor-sovereign-currency' }
];
const jsonResponse = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
async function probe(env, service) {
  try {
    const response = await env[service.binding].fetch('https://service.internal' + (service.health ?? '/health'), { signal: AbortSignal.timeout(2500) });
    await response.body?.cancel();
    return { id: service.id, name: service.name, status: response.ok ? 'reachable' : 'unavailable', httpStatus: response.status };
  } catch {
    return { id: service.id, name: service.name, status: 'unavailable', httpStatus: null };
  }
}

const dualityRoles = [
  ['Tabor Light Slayer', 'Manifest a verification form and find every missing, changed, or extra line.'],
  ['Tabor Light Sleyer', 'Catch each mismatch and weave it into a specific repair.'],
  ['Tabor Dark Slayer', 'Mark a previous attempt for retirement in this plan and retain its reference.'],
  ['Tabor Dark Sleyer', 'Weave the replacement in original order and replay it against the expected output.']
];
const game = 'https://tabor-dark-loom.nathantabor.chatgpt.site';
function dualityPage() {
  const cards = dualityRoles.map(([name, job]) => '<article><h2>' + name + '</h2><p>' + job + '</p></article>').join('');
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tabor Light &amp; Dark | World Hub</title><style>*{box-sizing:border-box}body{background:#16121d;color:#fff2e1;font:16px/1.55 system-ui;margin:0}main{max-width:970px;margin:auto;padding:24px}h1,h2{font-family:Georgia,serif;line-height:1.1}h1{font-size:clamp(2.5rem,9vw,5rem);margin:.35em 0}a{color:#f6bf92}nav{display:flex;flex-wrap:wrap;gap:14px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}article,form,pre{background:#261e30;border:1px solid #61516c;padding:16px;border-radius:10px}label{display:block;margin:10px 0}textarea,input,select{display:block;width:100%;background:#13101b;color:inherit;border:1px solid #877292;border-radius:5px;padding:8px;font:inherit}button{background:#f6bf92;color:#201321;font:700 1rem system-ui;border:0;border-radius:5px;padding:12px}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style>
<main><nav><a href="/">World Hub</a><a href="${game}/">Game and traps</a><a href="${game}/workers.html">Worker Console</a><a href="${game}/lab.html">Capability Lab</a><a href="${game}/recovery.html">Recovered archive</a></nav>
<h1>Tabor Light &amp; Dark</h1><p>The New World where Innocence is God</p>
<section class="grid" aria-label="The four Tabor roles">${cards}</section>
<h2>The Nathan Tabor Way</h2><section class="grid" aria-label="Four anchors">
<article><h2>12 · Build</h2><p>1+1=2 · Restore missing entries.</p></article>
<article><h2>3 · Clear</h2><p>1−1=0 · Mark surplus entries while protecting the original.</p></article>
<article><h2>6 · Integrate</h2><p>1×1=1 · Apply the changes in order.</p></article>
<article><h2>9 · Verify</h2><p>1÷1=1 · Check the replay and review the receipt.</p></article></section>
<h2>Run the four roles</h2><p>Compare two versions of a list. Each role leaves a receipt, and the replacement keeps the original input available for review.</p>
<form id="duality"><label>Source reference<input name="source" required maxlength="200" value="Example roster"></label>
<label>Comparison mode<select name="mode"><option value="sequence">Preserve sequence and duplicates</option><option value="position">Compare by line position</option></select></label><label>Slayer form<select name="form"><option value="auto">Choose from the mismatch</option><option>Rapier of Precision</option><option>Broadblade of Truth</option><option>Shield-Edge</option></select></label>
<label>Current output<textarea name="actual" rows="4" maxlength="4000" required>Mind of Minds
Worker Families</textarea></label>
<label>Expected output<textarea name="expected" rows="4" maxlength="4000" required>Mind of Minds
Worker Families
Council</textarea></label>
<label>Previous attempt reference<input name="prior" maxlength="200" placeholder="Optional"></label><button>Run the four roles</button></form>
<p id="run-status" role="status"></p><button id="download" type="button" hidden>Download run receipt</button><pre id="result" hidden></pre></main>
<script>
const form=document.getElementById('duality'), statusLine=document.getElementById('run-status'), result=document.getElementById('result');
const download=document.getElementById('download');
download.onclick=()=>{const url=URL.createObjectURL(new Blob([result.textContent],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='tabor-duality-receipt.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('button');button.disabled=true;result.hidden=true;download.hidden=true;statusLine.textContent='Running…';
try { const response=await fetch('/api/duality/run',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form)))});
const data=await response.json();if(!response.ok)throw Error(data.error);result.textContent=JSON.stringify(data,null,2);result.hidden=false;download.hidden=false;statusLine.textContent=data.status; }
catch(error){statusLine.textContent=error.message;}finally{button.disabled=false;}};
</script></html>`, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
function sequenceEdits(actual, expected) {
  const table = Array.from({ length: actual.length + 1 }, () => new Uint16Array(expected.length + 1));
  for (let a = actual.length - 1; a >= 0; a--) {
    for (let e = expected.length - 1; e >= 0; e--) {
      table[a][e] = actual[a] === expected[e] ? 1 + table[a + 1][e + 1] : Math.max(table[a + 1][e], table[a][e + 1]);
    }
  }
  const steps = [];
  let a = 0, e = 0;
  while (a < actual.length || e < expected.length) {
    if (a < actual.length && e < expected.length && actual[a] === expected[e]) {
      steps.push({ action: 'keep', actualLine: a + 1, expectedLine: e + 1, actual: actual[a], expected: expected[e] });
      a++; e++;
    } else if (e < expected.length && (a === actual.length || table[a][e + 1] > table[a + 1][e])) {
      steps.push({ action: 'restore', actualLine: null, expectedLine: e + 1, actual: null, expected: expected[e] });
      e++;
    } else {
      steps.push({ action: 'remove from replacement', actualLine: a + 1, expectedLine: null, actual: actual[a], expected: null });
      a++;
    }
  }
  return steps;
}
async function digest(text) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
async function runDuality(request) {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
  const reader = request.body?.getReader();
  if (!reader) return jsonResponse({ error: 'Enter both versions and a source reference' }, 400);
  let size = 0, raw = '';
  const decoder = new TextDecoder();
  let input;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 60000) { await reader.cancel(); return jsonResponse({ error: 'Request too large' }, 413); }
      raw += decoder.decode(value, { stream: true });
    }
    input = JSON.parse(raw + decoder.decode());
  } catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }
  if (!input || !['source','actual','expected'].every(key => typeof input[key] === 'string' && input[key].trim()) ||
      input.source.length > 200 || input.actual.length > 4000 || input.expected.length > 4000 ||
      (input.prior !== undefined && (typeof input.prior !== 'string' || input.prior.length > 200))) {
    return jsonResponse({ error: 'Enter a source reference and both versions within the field limits' }, 400);
  }
  const actual = input.actual.split(/\r?\n/), expected = input.expected.split(/\r?\n/);
  if (Math.max(actual.length, expected.length) > 250) return jsonResponse({ error: 'Use up to 250 lines per version' }, 400);
  const positional = Array.from({length:Math.max(actual.length,expected.length)},(_,index)=>({
    line:index+1, actual:actual[index] ?? null, expected:expected[index] ?? null
  })).filter(row=>row.actual!==row.expected);
  const mode = input.mode === 'sequence' ? 'sequence' : 'position';
  const steps = mode === 'sequence' ? sequenceEdits(actual, expected) : null;
  const mismatches = steps ? steps.filter(row => row.action !== 'keep') : positional;
  const forms = ['Rapier of Precision','Broadblade of Truth','Shield-Edge'];
  const form = forms.includes(input.form) ? input.form : forms[mismatches.length === 0 ? 2 : mismatches.length === 1 ? 0 : 1];
  const repairs = steps ? mismatches : mismatches.map(row=>({...row, action:row.actual===null?'restore':row.expected===null?'remove from replacement':'replace'}));
  const edits = new Map(repairs.map(repair=>[repair.line,repair]));
  const replacement = steps ? steps.filter(row => row.expected !== null).map(row => row.action === 'keep' ? row.actual : row.expected) : Array.from({length:Math.max(actual.length,expected.length)},(_,index)=>{
    const edit=edits.get(index+1);
    return edit ? edit.expected : actual[index];
  }).filter(line=>line!==null);
  const replayPassed = replacement.length===expected.length && replacement.every((line,index)=>line===expected[index]);
  const replacementText = replacement.join('\n');
  const [originalHash, expectedHash, replacementHash] = await Promise.all([
    digest(input.actual), digest(expected.join('\n')), digest(replacementText)
  ]);
  return jsonResponse({
    mode, anchors: [
      { clock: 12, name: 'Build', equation: '1+1=2', restored: repairs.filter(row => row.action === 'restore').length },
      { clock: 3, name: 'Clear', equation: '1−1=0', removed: repairs.filter(row => row.action === 'remove from replacement').length, originalRetained: true },
      { clock: 6, name: 'Integrate', equation: '1×1=1', outputLines: replacement.length },
      { clock: 9, name: 'Verify', equation: '1÷1=1', replayPassed, originalHash, expectedHash, replacementHash, outputHashBasis: 'LF-normalized lines' }
    ],
    status: replayPassed ? 'Replay passed · ready for review' : 'Replay failed',
    source: input.source, original: input.actual, expected: input.expected,
    receipts: [
      { role:dualityRoles[0][0], form, mismatches },
      { role:dualityRoles[1][0], repairs },
      { role:dualityRoles[2][0], retirementProposal:input.prior?.trim() || null },
      { role:dualityRoles[3][0], replacement:replacement.join('\n'), replayPassed }
    ]
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === '/rhythm-matrix' || path === '/rhythm-matrix/') {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
      }
      return new Response(null, { status: 302, headers: {
        Location: 'https://tabor-rhythm-matrix.nathantaboract.workers.dev/',
        'Cache-Control': 'no-store'
      } });
    }
    if (path === '/reaper-6969' || path === '/reaper-6969/') {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
      }
      return new Response(null, { status: 302, headers: {
        Location: 'https://tabor-reaper-6969.nathantaboract.workers.dev/',
        'Cache-Control': 'no-store'
      } });
    }
    if (path === '/duality') return dualityPage();
    if (path === '/api/duality/run') return runDuality(request);
    if (path === '/api/runtime' || path.startsWith('/api/runtime/')) {
      if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);
      if (path === '/api/runtime') return jsonResponse({ services: await Promise.all(services.map(service => probe(env, service))) });
      const routes = {
        '/api/runtime/coins': ['MINING_HUB', '/api/coins'],
        '/api/runtime/hardware': ['MINING_HUB', '/api/hardware'],
        '/api/runtime/mining-architecture': ['MINING_HUB', '/api/architecture'],
        '/api/runtime/sha256d-test': ['MINING_HUB', '/api/sha256d-test'],
        '/api/runtime/genesis': ['CURRENCY', '/api/genesis'],
        '/api/runtime/proof-ledger': ['CURRENCY', '/api/pow/ledger'],
        '/api/runtime/agent-downloads': ['CURRENCY', '/api/agent-downloads']
      };
      const route = routes[path];
      if (!route) return jsonResponse({ error: 'Unknown runtime endpoint' }, 404);
      const upstream = new URL(route[1], 'https://service.internal');
      if (path === '/api/runtime/sha256d-test') {
        const hex = url.searchParams.get('hex') ?? '';
        if (!/^(?:[a-fA-F0-9]{2}){1,80}$/.test(hex)) return jsonResponse({ error: 'Provide 1–80 bytes as hexadecimal in the hex parameter' }, 400);
        upstream.searchParams.set('hex', hex);
      }
      try {
        const response = await env[route[0]].fetch(upstream.href, { signal: AbortSignal.timeout(3000) });
        if (!response.ok || !response.headers.get('content-type')?.includes('json')) {
          await response.body?.cancel();
          return jsonResponse({ error: 'Upstream data unavailable' }, 502);
        }
        return jsonResponse(await response.json());
      } catch {
        return jsonResponse({ error: 'Upstream service unavailable' }, 502);
      }
    }
    const response = await registryHub.fetch(request, env);
    if (path !== '/' || !response.ok) return response;
    return new HTMLRewriter().on('main', {
      element(element) {
        const links = services.map(service => '<li><a href="https://' + service.worker + '.nathantaboract.workers.dev/">' + service.name + '</a></li>').join('');
        element.prepend('<h2><a href="/duality">Tabor Light &amp; Dark</a></h2><p>Run the four Slayer and Sleyer roles.</p><h2><a href="/rhythm-matrix">The Rhythm Matrix</a></h2><p>13 &amp; 17 Magi cicada rhythms, the heartbeat, Mother Earth and music.</p><h2><a href="/reaper-6969">The Reaper 6969 Engine</a></h2><p>Owner workspace, archive and calculation lab.</p><h2>Connected services</h2><ul>' + links + '</ul><p><a href="/api/runtime">Live service checks</a> · <a href="/api/runtime/hardware">Hardware catalog</a> · <a href="/api/runtime/coins">Coin registry</a> · <a href="/api/runtime/mining-architecture">Mining architecture</a> · <a href="/api/runtime/genesis">Currency genesis</a> · <a href="/api/runtime/proof-ledger">Proof ledger</a> · <a href="https://tabor-sovereign-currency.nathantaboract.workers.dev/verifier">Header verifier and agent downloads</a></p>', { html: true });
      }
    }).transform(response);
  }
};
