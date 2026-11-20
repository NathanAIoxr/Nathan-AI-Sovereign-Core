import { snapshot } from './github-intake-keys.mjs';

export const audience = 'urn:tabor-academy:card-games:research-intake';
const issuer = 'https://token.actions.githubusercontent.com';
const repo = 'NathanAIoxr/Nathan-AI-Sovereign-Core';
const branch = 'refs/heads/main';
const workflow = repo + '/.github/workflows/tabor-academy-card-source-intake.yml@' + branch;
const events = new Set(['push','schedule','workflow_dispatch']);
const cryptoParams = {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'};
const encoded = new TextEncoder();

function base64url(part) {
  if (!/^[A-Za-z0-9_-]+$/.test(part)) throw Error('Invalid JWT encoding');
  return Uint8Array.from(atob(part.replaceAll('-','+').replaceAll('_','/')), (c) => c.charCodeAt(0));
}
const parse = (part) => JSON.parse(new TextDecoder().decode(base64url(part)));

const matchingKey = (jwks,kid) => jwks.keys?.find((value)=>value.kid===kid && value.kty==='RSA' &&
  (!value.alg || value.alg==='RS256') && (!value.use || value.use==='sig'));

async function signingKey(kid,fetcher,now) {
  try {
    const response = await fetcher(issuer+'/.well-known/jwks',{redirect:'error',signal:AbortSignal.timeout(5000)});
    if (!response.ok) throw Error('GitHub issuer HTTP '+response.status);
    return matchingKey(await response.json(),kid);
  } catch (error) {
    // This snapshot contains only the issuer's public verification keys.
    const cached = now*1000 < Date.parse(snapshot.expires) ? matchingKey(snapshot,kid) : undefined;
    if (!cached) throw error;
    return cached;
  }
}

export async function verifyIntakeIdentity(request, {fetcher=fetch, now=Math.floor(Date.now()/1000)}={}) {
  const authorization = request.headers.get('authorization') || '';
  if (authorization.length > 8192) return null;
  const match = /^Bearer ([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(authorization);
  if (!match) return null;
  const [,header64,claims64,signature64] = match;
  let header,claims;
  try { header=parse(header64); claims=parse(claims64); }
  catch { return null; }
  if (!header || !claims || header.alg!=='RS256' || typeof header.kid!=='string' || !/^[\w-]{1,150}$/.test(header.kid) ||
    claims.iss!==issuer || claims.aud!==audience || claims.repository!==repo || claims.repository_id!=='1038249626' ||
    claims.repository_owner_id!=='226606102' || claims.ref!==branch || claims.workflow_ref!==workflow ||
    !events.has(claims.event_name) || !Number.isSafeInteger(claims.exp) || !Number.isSafeInteger(claims.nbf) ||
    !Number.isSafeInteger(claims.iat) || claims.exp<=now || claims.nbf>now+15 || claims.iat>now+15 ||
    claims.exp<=claims.iat || claims.exp-claims.iat>900 || !/^\d+$/.test(claims.run_id || '')) return null;

  const key = await signingKey(header.kid,fetcher,now);
  if (!key) return null;
  try {
    const publicKey = await crypto.subtle.importKey('jwk',key,cryptoParams,false,['verify']);
    const valid = await crypto.subtle.verify(cryptoParams,publicKey,base64url(signature64),encoded.encode(header64+'.'+claims64));
    return valid ? {runId:claims.run_id} : null;
  } catch { return null; }
}
