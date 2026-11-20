const webLinks = /https?:\/\/[^\s"'<>\\`\])]+/gi;
const relativeLinks = /\]\(([^)\s]+)\)|\b(?:href|src)\s*=\s*["']([^"'\s]+)["']|\b(?:from\s+|import\s*\(\s*)["'](\.{1,2}\/[^"']+)["']/g;
const bindings = /(?:cf|d1|kv|r2):\/\/[^\s"'<>\\`\])]+/gi;
const repositoryPaths = /(?:^|["'\s:])((?:app-factory|zones|integrations|\.github)\/[A-Za-z0-9_.\/-]+)(?=$|["'\s,])/g;

export function references(text) {
  const targets = new Set(text.match(webLinks) ?? []);
  for (const link of text.match(bindings) ?? []) targets.add(link);
  for (const match of text.matchAll(relativeLinks)) targets.add(match[1] ?? match[2] ?? match[3]);
  return [...targets].filter(target => target.length <= 2048);
}

export function storageReferences(text) {
  const targets = new Set(references(text).map(externalTarget).filter(Boolean));
  for (const match of text.replaceAll('\\"', '"').matchAll(repositoryPaths)) {
    targets.add('github-path:' + match[1]);
  }
  return [...targets];
}

export function externalTarget(target) {
  try {
    const url = new URL(target);
    if (!['https:', 'http:', 'cf:', 'd1:', 'kv:', 'r2:'].includes(url.protocol)) return null;
    if (url.username || url.password) return 'credential-bearing-reference';
    url.search = '';
    url.hash = '';
    // Webhook and signed resource paths can themselves contain credentials.
    if (/(?:webhooks?|token|credentials?|secrets?)(?:\/|$)/i.test(url.pathname)) return url.origin + '/[redacted]';
    return url.href;
  } catch {
    return null;
  }
}
