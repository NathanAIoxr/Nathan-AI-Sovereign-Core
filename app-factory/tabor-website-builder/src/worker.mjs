import { sites, aidIds, mountRoot } from './sites.mjs';
import { page, section, html, json, style, client, editorClient, securityHeaders } from './ui.mjs';
import { catalog, gifts, handling, manageAid, pledgeStatus } from './aid.mjs';
import { readBuilder, manageBuilder, editorialQueue } from './builder.mjs';
import { creation, police } from './editorial.mjs';

const databaseSites = new Set(['handling-life', 'site-builder', ...aidIds]);
const compatibility = '2026-11-01';

function asset(content, type) {
  return new Response(content, { headers: { ...securityHeaders, 'content-type': type + '; charset=utf-8', 'cache-control': 'public, max-age=300' } });
}

function notFound(site, path) {
  if (path.startsWith('/api/')) return json({ error: 'Not found' }, 404);
  const hideYear = site.id === 'year-zero' && (path === '/origins' || path.startsWith('/origins/'));
  return html(page(site, section('Page unavailable', '<p>Use the site name above to return to the main page.</p>'), { hideYear }), 404);
}

async function verifyToken(authorization, secret) {
  if (!secret) return json({ error: 'Set the publisher token in the Worker settings to use this endpoint.' }, 503);
  if (!authorization?.startsWith('Bearer ') || authorization.length > 1024) return json({ error: 'Publisher token required' }, 401);
  const hash = value => crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const [given, expected] = await Promise.all([hash(authorization.slice(7)), hash(secret)]);
  let difference = 0;
  const presented = new Uint8Array(given);
  const stored = new Uint8Array(expected);
  for (let index = 0; index < 32; index++) difference |= presented[index] ^ stored[index];
  return difference === 0 ? null : json({ error: 'Publisher token required' }, 401);
}

async function objectBody(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json') || !request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 96000) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    const parsed = JSON.parse(text + decoder.decode());
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function dispatch(request, env) {
  const site = sites[env.SITE_ID];
  if (!site) return json({ error: 'Unknown Worker site' }, 503);
  const url = new URL(request.url);
  const mount = mountRoot + site.id;
  const incomingPath = url.pathname === mount || url.pathname.startsWith(mount + '/')
    ? url.pathname.slice(mount.length)
    : url.pathname;
  const path = incomingPath.replace(/\/+$/, '') || '/';
  const read = ['GET', 'HEAD'].includes(request.method);
  if (read && path === '/style.css') return asset(style, 'text/css');
  if (read && path === '/site.js') return asset(client + (site.id === 'site-builder' ? editorClient : ''), 'text/javascript');
  if (read && path === '/api/health') {
    if (databaseSites.has(site.id)) await env.DB.prepare('SELECT 1 AS ready').first();
    return json({ site: site.id, status: 'ok', compatibility });
  }
  const aid = aidIds.includes(site.id);
  const builder = site.id === 'site-builder';
  if (builder && read && path === '/api/articles' ||
    request.method === 'POST' && (builder && ['/api/publish', '/api/editions'].includes(path) ||
      aid && ['/api/catalog', '/api/pledges', '/api/pledge-status'].includes(path))) {
    const error = await verifyToken(request.headers.get('Authorization'), env.PUBLISHER_TOKEN);
    if (error) return error;
    if (read) return editorialQueue(env, url);
    const input = await objectBody(request);
    if (!input) return json({ error: 'A valid JSON object is required' }, 400);
    if (builder) return manageBuilder(env, path, input);
    return path === '/api/pledge-status' ? pledgeStatus(site, env, input) : manageAid(site, env, path, input);
  }
  if (!read) return notFound(site, path);
  if (aid && ['/', '/api/catalog'].includes(path)) {
    const items = await catalog(site, env);
    return path === '/' ? gifts(site, items) : json({ program: site.id, items });
  }
  if (site.id === 'handling-life' && ['/', '/api/programs'].includes(path)) return handling(site, env, path);
  if (builder) return await readBuilder(site, env, path) ?? notFound(site, path);
  if (site.id === 'year-zero') return creation(site, path) ?? notFound(site, path);
  if (site.id === 'police-accountability' && path === '/') return police(site);
  return notFound(site, path);
}

export default {
  async fetch(request, env) {
    try {
      const response = await dispatch(request, env);
      if (request.method === 'HEAD') return new Response(null, response);
      const mount = mountRoot + env.SITE_ID;
      const path = new URL(request.url).pathname;
      if ((path === mount || path.startsWith(mount + '/')) &&
          response.headers.get('content-type')?.startsWith('text/html')) {
        const body = (await response.text()).replace(/\b(href|src|action)="\/(?!\/)/g, '$1="' + mount + '/');
        return new Response(body, response);
      }
      return response;
    } catch (error) {
      console.error('Request failed for', env.SITE_ID, error.message);
      return json({ error: 'The site could not complete this request' }, 503);
    }
  },
};
