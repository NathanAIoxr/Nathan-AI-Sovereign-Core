import { escape, json, page } from './station.mjs';
import { publicSigningKeys, verifyGitHubReceipt } from './github-identity.mjs';

import { catalogGroups, crosshairs, orderedRelease, verifyCrosshairs } from './release-order.mjs';

const GITHUB = 'NathanAIoxr/Nathan-AI-Sovereign-Core';
const KV_KEY = 'codex-build-check:v1';
const GITHUB_KEY = 'codex-github-build:v1';
const SIGNING_KEYS = 'codex-github-public-keys:v1';

function tiles(entries) {
  return '<div class="grid">' + entries.map(item => `<a class="tile" href="/work/${item.id}/"><strong>${escape(item.title)}</strong><small>${escape(item.status)}</small></a>`).join('') + '</div>';
}

async function githubStatus() {
  const url = 'https://api.github.com/repos/' + GITHUB + '/actions/workflows/codex-pocket-build.yml/runs?branch=main&per_page=1';
  const answer = await fetch(url, { headers: { 'user-agent': 'Nathan-AI-Pocket-Codex', accept: 'application/vnd.github+json' }, redirect: 'error', signal: AbortSignal.timeout(4500) });
  if (!answer.ok) return { connected: false, status: answer.status, run: null };
  const data = await answer.json();
  const run = data.workflow_runs?.[0];
  return { connected: true, status: answer.status, run: run ? { id: run.id, status: run.status, conclusion: run.conclusion, sha: run.head_sha, at: run.updated_at } : null };
}

async function inspectOne(env, project) {
  try {
    const result = await env.PROJECTS.get(project.worker).fetch(new Request('https://station.internal/healthz'));
    const actual = await result.json();
    return { id: project.id, ready: result.ok && actual.id === project.id && actual.version === project.version };
  } catch {
    return { id: project.id, ready: false };
  }
}

async function refreshStandaloneApp(env, project) {
  try {
    const request = new Request('https://station.internal/__hub/refresh', { method: 'POST' });
    const response = await env.PROJECTS.get(project.worker).fetch(request);
    const actual = await response.json();
    return { id: project.id, verified: response.ok && actual.id === project.id && actual.version === project.version && actual.verified === true };
  } catch {
    return { id: project.id, verified: false };
  }
}

export function createPocket(projects, independentApps = []) {
  const allProjects = [...projects, ...independentApps];
  const byId = new Map(allProjects.map(item => [item.id, item]));
  const publicRows = allProjects.map(({ question, ...item }) => item);
  const order = orderedRelease(allProjects);

  async function audit(env) {
    const checked = [];
    for (let start = 0; start < projects.length; start += 8) {
      checked.push(...await Promise.all(projects.slice(start, start + 8).map(item => inspectOne(env, item))));
    }
    let crosshairsReady = false;
    try {
      const response = await env.PROJECTS.get(crosshairs.worker).fetch(new Request('https://station.internal/api/views'));
      crosshairsReady = response.ok && verifyCrosshairs(await response.json());
    } catch { /* The hourly receipt records an unavailable or invalid reader. */ }
    const appJobs = await Promise.all(independentApps.map(item => refreshStandaloneApp(env, item)));
    checked.push(...await Promise.all(independentApps.map(item => inspectOne(env, item))));
    let github = await githubStatus().catch(() => ({ connected: false, status: null, run: null }));
    if (!github.connected && env.RECEIPTS) {
      const proof = await env.RECEIPTS.get(GITHUB_KEY, 'json');
      if (proof && Date.now() - Date.parse(proof.verifiedAt) < 86400000) {
        github = { connected: true, via: 'signed-build-receipt', status: null, run: proof };
      }
    }
    const receipt = { checkedAt: new Date().toISOString(), expected: checked.length,
      healthy: checked.filter(row => row.ready).length, failed: checked.filter(row => !row.ready).map(row => row.id),
      crosshairs: { ready: crosshairsReady, views: crosshairs.views }, appJobs, github };
    if (env.RECEIPTS) await env.RECEIPTS.put(KV_KEY, JSON.stringify(receipt));
    console.log(JSON.stringify({ event: 'codex_build_check', ...receipt }));
    return receipt;
  }

  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (request.method === 'POST' && url.pathname === '/api/github/receipt') {
        if (!env.RECEIPTS) return json({ error: 'receipt_store_unavailable' }, 503);
        let reason = 'verification_unavailable';
        const auth = request.headers.get('authorization');
        const check = (keySource = fetch) => verifyGitHubReceipt(auth, keySource, Date.now() / 1000, stage => { reason = stage; });
        let receipt = await check().catch(() => null);
        if (!receipt && ['verification_unavailable', 'issuer_key_fetch', 'issuer_key_id'].includes(reason)) {
          const cached = await env.RECEIPTS.get(SIGNING_KEYS, 'json');
          for (const snapshot of [cached, env.PUBLIC_GITHUB_KEYS]) {
            if (snapshot?.expiresAt > Date.now() && Array.isArray(snapshot.keys)) {
              receipt = await check(async () => Response.json({ keys: snapshot.keys })).catch(() => null);
              if (receipt) break;
            }
          }
        }
        if (!receipt) return json({ error: 'unauthorized', reason }, 401);
        const current = await env.RECEIPTS.get(GITHUB_KEY, 'json');
        let signingKeysRefreshed = false;
        if (!current || current.issuedAt < receipt.issuedAt) {
          if (request.headers.get('content-type') === 'application/json') {
            if (Number(request.headers.get('content-length')) > 12000) return json({ error: 'payload_too_large' }, 413);
            const encoded = await request.text();
            if (encoded.length > 12000) return json({ error: 'payload_too_large' }, 413);
            let keys;
            try { keys = publicSigningKeys(JSON.parse(encoded).publicSigningKeys); } catch { /* Invalid input. */ }
            if (!keys) return json({ error: 'invalid_signing_key_set' }, 400);
            await env.RECEIPTS.put(SIGNING_KEYS, JSON.stringify({ keys, expiresAt: Date.now() + 345600000 }));
            signingKeysRefreshed = true;
          }
          await env.RECEIPTS.put(GITHUB_KEY, JSON.stringify(receipt));
        }
        return json({ saved: true, run: receipt.run, signingKeysRefreshed });
      }
      const head = request.method === 'HEAD';
      if (!head && request.method !== 'GET') return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } });
      const path = url.pathname;
      if (path + '/' === crosshairs.path) return Response.redirect(new URL(crosshairs.path, url), 308);
      if (path.startsWith(crosshairs.path)) {
        const target = new URL('https://station.internal');
        target.pathname = '/' + path.slice(crosshairs.path.length);
        try {
          return await env.PROJECTS.get(crosshairs.worker).fetch(new Request(target, { method: request.method }));
        } catch {
          return json({ error: 'project_unavailable', id: crosshairs.id }, 503);
        }
      }
      const match = /^\/work\/([a-z0-9-]+)(\/.*)?$/.exec(path);
      let result;
      if (match) {
        const item = byId.get(match[1]);
        if (!item) return json({ error: 'project_not_found' }, 404);
        if (!match[2]) return Response.redirect(new URL(path + '/', url), 308);
        if (item.group === 'standalone-apps' && ['/', '/app', '/app/'].includes(match[2])) {
          return Response.redirect(item.url, 302);
        }
        const target = new URL(path + url.search, 'https://station.internal');
        try {
          return await env.PROJECTS.get(item.worker).fetch(new Request(target, { method: request.method }));
        } catch {
          return json({ error: 'project_unavailable', id: item.id }, 503);
        }
      }
      const tab = url.searchParams.get('tab') === 'github' ? 'github' : 'cloudflare';
      const nav = '<nav aria-label="Pocket Control"><a href="/?tab=github">GitHub Pro</a><a href="/?tab=cloudflare">Clouder Pro</a><a href="/work/codex-crosshairs/">Codex Crosshairs</a><a href="/release-order">Release order</a><a href="/api/build-status">Build status JSON</a></nav>';
      if (path === '/healthz') {
        result = json({ service: 'nathan-ai-pocket-codex', ready: Boolean(env.PROJECTS), projects: allProjects.length, receiptStore: Boolean(env.RECEIPTS) });
      } else if (path === '/api/catalog') {
        result = json({ service: 'nathan-ai-pocket-codex', groups: catalogGroups.map(([id, label]) => ({ id, label })), projects: publicRows });
      } else if (path === '/release-order') {
        const jobs = order.jobs.map(job => '<li><strong>' + escape(job.runner) + '</strong> · ' + escape(job.job) + '</li>').join('');
        const stages = order.groups.map(group => {
          const items = group.projects.map(id => byId.get(id));
          return items.length ? '<section><h2>' + escape(group.title) + '</h2>' + tiles(items) + '</section>' : '';
        }).join('');
        const links = '<p><a href="/work/codex-crosshairs/">Open all nine Crosshairs views</a> · <a href="/api/order">Order JSON</a> · <a href="/api/build-status">Cloudflare verification</a> · <a href="/api/github">GitHub build receipt</a></p>';
        result = page('Release order', 'Nathan AI · Pocket Control', nav + links + '<section><h2>Build and verification</h2><ol>' + jobs + '</ol></section>' + stages);
      } else if (path === '/api/order') {
        result = json(order);
      } else if (path === '/api/build-status') {
        const receipt = env.RECEIPTS ? await env.RECEIPTS.get(KV_KEY, 'json') : null;
        result = json({ expected: allProjects.length, receipt });
      } else if (path === '/api/github') {
        const receipt = env.RECEIPTS ? await env.RECEIPTS.get(KV_KEY, 'json') : null;
        const verifiedRun = env.RECEIPTS ? await env.RECEIPTS.get(GITHUB_KEY, 'json') : null;
        result = json({ repository: GITHUB, checkedAt: receipt?.checkedAt ?? null, status: receipt?.github ?? null, verifiedRun });
      } else if (path === '/') {
        const query = (url.searchParams.get('q') ?? '').trim().slice(0, 90);
        const needle = query.toLocaleLowerCase();
        const found = publicRows.filter(item => [item.title, item.id, item.status].join(' ').toLocaleLowerCase().includes(needle));
        const search = `<form><input type="hidden" name="tab" value="${tab}"><label for="find">Find a project</label><input id="find" type="search" name="q" maxlength="90" value="${escape(query)}"><button>Search</button></form>`;
        const content = tab === 'github'
          ? `<section><h2>GitHub Pro</h2><p><a href="https://github.com/${GITHUB}">Nathan-AI-Sovereign-Core</a></p><p><a href="https://github.com/${GITHUB}/actions/workflows/codex-pocket-build.yml">Build runs</a> · <a href="/api/github">Latest checked status</a></p></section>`
          : '<section><h2>Clouder Pro</h2><p><a href="/api/build-status">Latest Worker verification</a> · <a href="/api/catalog">Project manifest</a></p></section>';
        const directory = catalogGroups.map(([id, label]) => {
          const entries = found.filter(item => item.group === id);
          return entries.length ? '<section><h2>' + label + '</h2>' + tiles(entries) + '</section>' : '';
        }).join('') || '<p>No projects match your search.</p>';
        result = page('Codex, Kodex & Nodes', 'Nathan AI · Pocket Control', nav + content + search + directory);
      } else {
        result = json({ error: 'not_found' }, 404);
      }
      if (!head) return result;
      return new Response(null, { status: result.status, headers: result.headers });
    },
    scheduled(event, env, ctx) {
      ctx.waitUntil(audit(env));
    },
  };
}
