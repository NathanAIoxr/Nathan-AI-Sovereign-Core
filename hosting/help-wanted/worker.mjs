const publicQuery = 'is:open is:issue is:public label:"help wanted"';
const candidateQuery = publicQuery + ' label:documentation no:assignee -label:security -label:vulnerability';
const searchBase = 'https://api.github.com/search/issues';
const resultKey = 'queue:v1';
const attemptKey = 'attempt:v1';
const cap = 50;
const firstContribution = {"id":"goldener-data/goldener#422","title":"Goldener density-weighing guide","issue":"https://github.com/goldener-data/goldener/issues/422","patch":"https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/feat/help-wanted-worker/hosting/help-wanted/contributions/goldener-422.patch","stage":"Patch prepared · Python run and upstream handoff pending"};
const sensitive = /\b(exploit|vulnerabilit(?:y|ies)|payload|intrusion|malware|rce|cve[- ]\d+|bypass|credential)\b/i;
const issuePattern = /^https:\/\/github\.com\/([a-z\d_.-]+)\/([a-z\d_.-]+)\/issues\/([1-9]\d*)$/i;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[character]);
}
function searchPage(query) {
  const url = new URL('https://github.com/search');
  url.searchParams.set('type', 'issues');
  url.searchParams.set('q', query);
  return url.href;
}
function normalize(item) {
  const match = issuePattern.exec(item.html_url ?? '');
  if (!match || item.pull_request || !item.title || sensitive.test(item.title)) return null;
  const repository = match[1] + '/' + match[2];
  return {id: repository.toLowerCase() + '#' + match[3], repository,
    url: item.html_url, title: String(item.title).slice(0,300), updatedAt: item.updated_at ?? null,
    sourceChecked: 1, rulesChecked: 0, patchChecked: 0, delivered: 0};
}
async function search(query, size, fetcher = fetch) {
  const url = new URL(searchBase);
  url.search = new URLSearchParams({q:query,per_page:String(size),sort:'updated',order:'desc'});
  const response = await fetcher(url, {headers:{accept:'application/vnd.github+json',
    'x-github-api-version':'2022-11-28','user-agent':'Nathan-AI-Help-Wanted/1.0'},signal:AbortSignal.timeout(8000)});
  if (!response.ok) throw Error('GitHub search returned HTTP ' + response.status);
  const result = await response.json();
  if (!Number.isSafeInteger(result.total_count) || !Array.isArray(result.items)) throw Error('Unexpected GitHub search response');
  return result;
}
async function refresh(env, fetcher = fetch, time = new Date().toISOString()) {
  const [all, lanes] = await Promise.allSettled([
    search(publicQuery, 1, fetcher), search(candidateQuery, cap, fetcher)
  ]);
  const previous = await env.QUEUE.get(resultKey, 'json');
  const issues = lanes.status === 'fulfilled'
    ? [...new Map(lanes.value.items.map(normalize).filter(Boolean).map(item => [item.id,item])).values()]
    : previous?.issues ?? [];
  const snapshot = {
    scannedAt: lanes.status === 'fulfilled' ? time : previous?.scannedAt ?? null,
    source: lanes.status === 'fulfilled' ? 'GitHub REST API' : previous?.source ?? 'Pending first scan',
    publicMatchCount: all.status === 'fulfilled' ? all.value.total_count : previous?.publicMatchCount ?? null,
    publicCountAt: all.status === 'fulfilled' ? time : previous?.publicCountAt ?? null,
    publicIncomplete: all.status === 'fulfilled' ? Boolean(all.value.incomplete_results) : previous?.publicIncomplete ?? null,
    documentationMatchCount: lanes.status === 'fulfilled' ? lanes.value.total_count : previous?.documentationMatchCount ?? null,
    documentationIncomplete: lanes.status === 'fulfilled' ? Boolean(lanes.value.incomplete_results) : previous?.documentationIncomplete ?? null,
    issues, pageSize:cap, allSearch:searchPage(publicQuery), candidateSearch:searchPage(candidateQuery)
  };
  const errors = [all, lanes].filter(result=>result.status==='rejected').map(result=>String(result.reason?.message??'Search failed').slice(0,150));
  if (all.status === 'fulfilled' || lanes.status === 'fulfilled') {
    await env.QUEUE.put(resultKey, JSON.stringify(snapshot));
  }
  await env.QUEUE.put(attemptKey, JSON.stringify({attemptedAt:time,errors}));
  return snapshot;
}
function html(snapshot, attempt) {
  const rows = (snapshot?.issues ?? []).map(issue => '<li><a href="' + escapeHtml(issue.url) + '">' + escapeHtml(issue.title) +
    '</a><small>' + escapeHtml(issue.id) + ' · Awaiting review</small></li>').join('');
  const status = attempt?.errors?.length ? 'Latest refresh: ' + attempt.errors.join(', ') : 'Last refresh ' + (snapshot?.scannedAt ?? 'pending');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Help Wanted · Nathan AI</title><style>:root{color-scheme:dark;background:#111923;color:#f5f0e6;font:16px/1.55 system-ui}body{max-width:58rem;margin:3rem auto;padding:0 1.25rem}h1{font-size:clamp(2.2rem,8vw,4rem);line-height:1.1;margin:.3em 0}a{color:#eaca91;text-underline-offset:.2em}small{display:block;color:#b6c5d0}li{padding:.65rem 0;border-bottom:1px solid #43505d}ol{padding-left:1.5rem}p{max-width:65ch}.status{color:#b6c5d0}</style></head><body><main>' +
    '<a href="https://nathan-ai-workers.nathantaboract.workers.dev/">Nathan AI Worker Workspace</a><h1>Help Wanted</h1><p>By Nathan Tabor and Nathan AI</p>' +
    '<p>Find open requests for help. Review the source and contribution rules, build the fix, verify it, and prepare a handoff.</p>' +
    '<p><strong>' + escapeHtml(snapshot?.publicMatchCount ?? 'Pending') + '</strong> reported public matches · <strong>' + (snapshot?.issues?.length ?? 0) + '</strong> documentation leads in this queue.</p>' +
    '<p class="status">' + escapeHtml(status) + (snapshot?.publicIncomplete || snapshot?.documentationIncomplete ? ' · GitHub flagged partial search results.' : '') + '</p>' +
    '<section aria-labelledby="contribution"><h2 id="contribution">Prepared contribution</h2><p><a href="' + firstContribution.issue + '">' + escapeHtml(firstContribution.title) + '</a> · <a href="' + firstContribution.patch + '">Read the patch</a><small>' + escapeHtml(firstContribution.stage) + '</small></p></section>' +
    '<p><a href="' + searchPage(publicQuery).replaceAll('&','&amp;') + '">Open the full GitHub search</a> · <a href="/api/queue">Queue and evidence</a></p><ol>' + rows + '</ol></main></body></html>';
}
async function handle(request, env) {
  const route = new URL(request.url).pathname;
  const headers = {'x-content-type-options':'nosniff','x-robots-tag':'noindex','cache-control':'no-store',
    'content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"};
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null,{status:405,headers:{...headers,allow:'GET, HEAD'}});
  if (route !== '/' && route !== '/api/queue' && route !== '/health') return new Response(null,{status:404,headers});
  const [snapshot,attempt] = await Promise.all([env.QUEUE.get(resultKey,'json'),env.QUEUE.get(attemptKey,'json')]);
  const body = route === '/' ? html(snapshot,attempt)
    : JSON.stringify(route === '/health' ? {ok:true,queueReady:Boolean(snapshot?.scannedAt),latestAttempt:attempt} : {snapshot,latestAttempt:attempt});
  return new Response(request.method === 'HEAD' ? null : body,{headers:{...headers,
    'content-type':route === '/' ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8'}});
}
export {handle, normalize, refresh};
export default {fetch:handle, scheduled(controller,env,ctx) {ctx.waitUntil(refresh(env,fetch,new Date(controller.scheduledTime).toISOString()));}};
