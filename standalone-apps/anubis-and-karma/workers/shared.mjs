import { release, style } from '../.generated/assets.mjs';

export { release };

export const urls = {
  anubis: 'https://tabor-anubis.nathantaboract.workers.dev',
  karma: 'https://tabor-karma.nathantaboract.workers.dev',
  finale: 'https://tabor-anubis-karma.nathantaboract.workers.dev',
  domino: 'https://tabor-domino.nathantaboract.workers.dev',
  world: 'https://tabor-world.nathantaboract.workers.dev',
  heka: 'https://tabor-heka.nathantaboract.workers.dev',
  pocket: 'https://nathan-ai-pocket-codex.nathantaboract.workers.dev',
  github: 'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/standalone-apps/anubis-and-karma',
  manifest: 'https://raw.githubusercontent.com/NathanAIoxr/Nathan-AI-Sovereign-Core/main/standalone-apps/anubis-and-karma/release.json',
};

const headers = {
  'content-security-policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'cache-control': 'no-store',
};

export function reply(request, body, type = 'text/plain; charset=utf-8', status = 200, extra = {}) {
  return new Response(request.method === 'HEAD' ? null : body, {
    status, headers: { ...headers, 'content-type': type, ...extra },
  });
}

export const json = (request, body, status) =>
  reply(request, JSON.stringify(body), 'application/json; charset=utf-8', status);

const health = (request, service) =>
  json(request, { ok: true, service, release: release.id, version: release.version });

export function site(service, route) {
  return {
    async fetch(request, env) {
      if (!['GET', 'HEAD'].includes(request.method)) {
        return reply(request, 'Method not allowed', undefined, 405, { allow: 'GET, HEAD' });
      }
      const path = new URL(request.url).pathname;
      if (path === '/api/health') return health(request, service);
      if (path === '/site.css') return reply(request, style, 'text/css; charset=utf-8');
      return await route(path, request, env) ?? reply(request, 'Page not found', undefined, 404);
    },
  };
}

export const html = (request, body, status) => reply(request, body, 'text/html; charset=utf-8', status);

export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

export function frame(title, main) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(title)} · Tabor World</title><link rel="stylesheet" href="/site.css"></head>
  <body><header class="top"><a class="brand" href="${urls.finale}">TABOR WORLD <span> / 0 × 1</span></a>
  <nav aria-label="Project"><a href="${urls.finale}/read">Read</a><a href="${urls.domino}">Domino</a></nav></header>
  <main class="page single">${main}</main>
  <footer><a href="${urls.finale}">Anubis &amp; Karma</a><a href="${urls.github}">Source on GitHub</a></footer></body></html>`;
}

export function entry(service, record) {
  return site(service, (path, request) => {
    if (path === '/api/entry') return json(request, record);
    if (path === '/') return html(request, frame(record.name, `
      <p class="overline">Tabor Codex / ${escapeHTML(record.id)}</p>
      <h1>${escapeHTML(record.name)}</h1>
      <p class="intro">${escapeHTML(record.role)}</p><p>${escapeHTML(record.detail)}</p>
      <a class="button" href="${urls.finale}">Play the finale</a>`));
  });
}
