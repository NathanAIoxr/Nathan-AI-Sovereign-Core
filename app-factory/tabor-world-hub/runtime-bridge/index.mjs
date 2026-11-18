const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const registryHub = {async fetch(request,env){const u=new URL(request.url);const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','cache-control':'public,max-age=60'}});if(u.pathname==='/health')return json({name:'Tabor World Hub',status:'online',mode:'read-only',database:'tabor-database-registry'});if(u.pathname==='/api/systems'){const q=(u.searchParams.get('q')||'').slice(0,100);const r=await env.REGISTRY.prepare('SELECT id,name,kind,status,provenance FROM supercomputer_registry WHERE name LIKE ? ORDER BY name LIMIT 200').bind('%'+q+'%').all();return json({count:r.results.length,systems:r.results})}if(u.pathname==='/api/overview'){const r=await env.REGISTRY.prepare('SELECT kind,status,COUNT(*) AS count FROM supercomputer_registry GROUP BY kind,status').all();return json({name:'Tabor World Hub',registry:r.results,architecture:['NATHAN OS','Nathan Tabor Supercomputer','ABM Master Brain','4T Clover','78-Field Matrix','Worldwide Agents','Tabor Light/Dark Slayer/Sleyer'],notice:'Registry records are specifications; they do not establish running agents.'})}if(u.pathname!=='/')return json({error:'not found'},404);const r=await env.REGISTRY.prepare('SELECT id,name,status FROM supercomputer_registry ORDER BY name LIMIT 200').all();const items=r.results.map(x=>'<article><strong>'+esc(x.name)+'</strong><small>'+esc(x.status)+'</small></article>').join('');return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tabor World Hub</title><style>body{margin:0;background:#0b1220;color:#e8eef8;font:16px system-ui}header{padding:44px 7%;background:linear-gradient(120deg,#12263f,#173c50)}h1{font-size:clamp(2rem,6vw,4rem);margin:0}p{color:#b6c8da;max-width:70ch}main{padding:24px 7%}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}article{border:1px solid #31485c;border-radius:12px;padding:18px;background:#142237}small{display:block;color:#92e0cc;margin-top:8px}a{color:#8de0ff}</style><header><h1>TABOR WORLD HUB</h1><p>Nathan Tabor Supercomputer · NATHAN AI · Library of Tabor · Worldwide Worker Federation</p><p>Preserving original systems, names, source provenance, and independent applications.</p></header><main><h2>Supercomputer Systems ('+r.results.length+')</h2><p>Catalog status is not deployment status. Existing Cloudflare applications remain independent.</p><p><a href="/api/overview">Architecture API</a> · <a href="/api/systems">Searchable registry API</a> · <a href="/health">Health</a></p><section>'+items+'</section></main></html>',{headers:{'content-type':'text/html; charset=utf-8','cache-control':'public,max-age=60'}})}};

const services = [
  { id: 'supercomputer', name: 'Nathan Tabor Supercomputer', binding: 'SUPERCOMPUTER', worker: 'nathan-tabor-supercomputer' },
  { id: 'registry', name: 'Supercomputer Registry', binding: 'COMPUTE_REGISTRY', worker: 'tabor-supercomputer-registry' },
  { id: 'mining', name: 'TABOR CORP Mining Hub', binding: 'MINING_HUB', worker: 'tabor-corp-mining-hub' },
  { id: 'currency', name: 'Tabor Sovereign Currency', binding: 'CURRENCY', worker: 'tabor-sovereign-currency' }
];
const jsonResponse = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
async function probe(env, service) {
  try {
    const response = await env[service.binding].fetch('https://service.internal/health', { signal: AbortSignal.timeout(2500) });
    await response.body?.cancel();
    return { id: service.id, name: service.name, status: response.ok ? 'reachable' : 'unavailable', httpStatus: response.status };
  } catch {
    return { id: service.id, name: service.name, status: 'unavailable', httpStatus: null };
  }
}
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/api/runtime' || path.startsWith('/api/runtime/')) {
      if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);
      if (path === '/api/runtime') return jsonResponse({ services: await Promise.all(services.map(service => probe(env, service))) });
      const routes = {
        '/api/runtime/coins': ['MINING_HUB', '/api/coins'],
        '/api/runtime/hardware': ['MINING_HUB', '/api/hardware'],
        '/api/runtime/mining-architecture': ['MINING_HUB', '/api/architecture'],
        '/api/runtime/sha256d-test': ['MINING_HUB', '/api/sha256d-test'],
        '/api/runtime/genesis': ['CURRENCY', '/api/genesis']
      };
      const route = routes[path];
      if (!route) return jsonResponse({ error: 'Unknown runtime endpoint' }, 404);
      try {
        const response = await env[route[0]].fetch('https://service.internal' + route[1], { signal: AbortSignal.timeout(3000) });
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
        element.prepend('<h2>Connected services</h2><ul>' + links + '</ul><p><a href="/api/runtime">Live service checks</a> · <a href="/api/runtime/hardware">Hardware catalog</a> · <a href="/api/runtime/coins">Coin registry</a> · <a href="/api/runtime/mining-architecture">Mining architecture</a> · <a href="/api/runtime/genesis">Currency genesis</a></p>', { html: true });
      }
    }).transform(response);
  }
};
