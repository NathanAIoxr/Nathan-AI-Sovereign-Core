const issuer = 'https://token.actions.githubusercontent.com';
const audience = 'https://nathan-ai-pocket-codex.nathantaboract.workers.dev';
const repo = 'NathanAIoxr/Nathan-AI-Sovereign-Core';
const workflow = repo + '/.github/workflows/codex-pocket-build.yml@refs/heads/main';

function decode(segment) {
  if (!/^[A-Za-z0-9_-]+$/.test(segment)) throw new TypeError('Invalid JWT segment');
  return Uint8Array.from(atob(segment.replaceAll('-', '+').replaceAll('_', '/')), byte => byte.charCodeAt(0));
}

function parse(segment) {
  return JSON.parse(new TextDecoder().decode(decode(segment)));
}

export function validClaims(claims, now) {
  return claims.iss === issuer && claims.aud === audience && claims.repository_id === '1038249626' &&
    claims.sub === 'repo:' + repo + ':ref:refs/heads/main' && claims.ref === 'refs/heads/main' &&
    claims.workflow_ref === workflow && ['push', 'schedule', 'workflow_dispatch'].includes(claims.event_name) &&
    Number.isInteger(claims.iat) && claims.iat <= now + 10 && claims.iat >= now - 600 &&
    Number.isInteger(claims.nbf) && claims.nbf <= now + 10 &&
    Number.isInteger(claims.exp) && claims.exp > now && claims.exp <= claims.iat + 600 &&
    typeof claims.run_id === 'string' && /^\d{1,20}$/.test(claims.run_id) &&
    typeof claims.run_attempt === 'string' && /^\d{1,8}$/.test(claims.run_attempt) &&
    typeof claims.sha === 'string' && /^[a-f0-9]{40}$/.test(claims.sha);
}

export async function verifyGitHubReceipt(header, fetchKeys = fetch, now = Date.now() / 1000) {
  if (!header?.startsWith('Bearer ') || header.length > 14000) return null;
  const parts = header.slice(7).split('.');
  if (parts.length !== 3) return null;
  const protectedHeader = parse(parts[0]);
  if (protectedHeader.alg !== 'RS256' || typeof protectedHeader.kid !== 'string') return null;
  const claims = parse(parts[1]);
  if (!validClaims(claims, now)) return null;
  const keys = await fetchKeys(issuer + '/.well-known/jwks', {
    redirect: 'error', signal: AbortSignal.timeout(4000), cf: { cacheEverything: true, cacheTtl: 300 },
  });
  if (!keys.ok) return null;
  const jwk = (await keys.json()).keys?.find(key => key.kid === protectedHeader.kid && key.kty === 'RSA');
  if (!jwk) return null;
  const algorithm = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
  const key = await crypto.subtle.importKey('jwk', jwk, algorithm, false, ['verify']);
  const payload = new TextEncoder().encode(parts[0] + '.' + parts[1]);
  const authentic = await crypto.subtle.verify(algorithm, key, decode(parts[2]), payload);
  return authentic ? { run: claims.run_id, attempt: claims.run_attempt, sha: claims.sha,
    issuedAt: claims.iat, verifiedAt: new Date(now * 1000).toISOString() } : null;
}
