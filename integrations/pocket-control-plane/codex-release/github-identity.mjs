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

export function claimChecks(claims, now) {
  const legacy = 'repo:' + repo + ':ref:refs/heads/main';
  const immutable = 'repo:NathanAIoxr@226606102/Nathan-AI-Sovereign-Core@1038249626:ref:refs/heads/main';
  return {
    issuer: claims.iss === issuer,
    audience: claims.aud === audience,
    repository: String(claims.repository_id) === '1038249626' && String(claims.repository_owner_id) === '226606102',
    subject: claims.sub === legacy || claims.sub === immutable,
    branch: claims.ref === 'refs/heads/main',
    workflow: claims.workflow_ref === workflow,
    event: ['push', 'schedule', 'workflow_dispatch'].includes(claims.event_name),
    issued: Number.isInteger(claims.iat) && claims.iat <= now + 20 && claims.iat >= now - 900,
    starts: Number.isInteger(claims.nbf) && claims.nbf <= now + 20,
    expires: Number.isInteger(claims.exp) && claims.exp > now && claims.exp <= claims.iat + 900,
    run: typeof claims.run_id === 'string' && /^\d{1,20}$/.test(claims.run_id) &&
      typeof claims.run_attempt === 'string' && /^\d{1,8}$/.test(claims.run_attempt),
    commit: typeof claims.sha === 'string' && /^[a-f0-9]{40}$/.test(claims.sha),
  };
}

export function validClaims(claims, now) {
  return Object.values(claimChecks(claims, now)).every(Boolean);
}

export async function verifyGitHubReceipt(header, fetchKeys = fetch, now = Date.now() / 1000, diagnose = () => {}) {
  if (!header?.startsWith('Bearer ') || header.length > 14000) { diagnose('authorization_header'); return null; }
  const parts = header.slice(7).split('.');
  if (parts.length !== 3) { diagnose('credential_format'); return null; }
  const protectedHeader = parse(parts[0]);
  if (protectedHeader.alg !== 'RS256' || typeof protectedHeader.kid !== 'string') { diagnose('signing_algorithm'); return null; }
  const claims = parse(parts[1]);
  const invalid = Object.entries(claimChecks(claims, now)).filter(([, pass]) => !pass).map(([field]) => field);
  if (invalid.length) { diagnose('identity_' + invalid.join('_')); return null; }
  const keys = await fetchKeys(issuer + '/.well-known/jwks', {
    redirect: 'error', signal: AbortSignal.timeout(4000), cf: { cacheEverything: true, cacheTtl: 300 },
  });
  if (!keys.ok) { diagnose('issuer_key_fetch'); return null; }
  const jwk = (await keys.json()).keys?.find(key => key.kid === protectedHeader.kid && key.kty === 'RSA');
  if (!jwk) { diagnose('issuer_key_id'); return null; }
  const algorithm = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
  const key = await crypto.subtle.importKey('jwk', jwk, algorithm, false, ['verify']);
  const payload = new TextEncoder().encode(parts[0] + '.' + parts[1]);
  const authentic = await crypto.subtle.verify(algorithm, key, decode(parts[2]), payload);
  if (!authentic) diagnose('issuer_signature');
  return authentic ? { run: claims.run_id, attempt: claims.run_attempt, sha: claims.sha,
    issuedAt: claims.iat, verifiedAt: new Date(now * 1000).toISOString() } : null;
}
