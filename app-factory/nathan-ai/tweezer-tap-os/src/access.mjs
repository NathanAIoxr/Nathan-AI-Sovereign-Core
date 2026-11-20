let cache;
const decode = part => Uint8Array.from(atob(part.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
function read(part) { return JSON.parse(new TextDecoder().decode(decode(part))); }

export async function principal(request, env) {
  const issuer = env.ACCESS_ISSUER;
  const audience = env.ACCESS_AUDIENCE;
  const assertion = request.headers.get('Cf-Access-Jwt-Assertion') ?? '';
  if (audience && /^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer ?? '') && assertion.length <= 8192) {
    try {
      const [head, payload, sig, ...extra] = assertion.split('.');
      const header = read(head);
      const claims = read(payload);
      const now = Date.now() / 1000;
      if (extra.length || header.alg !== 'RS256' || typeof header.kid !== 'string' ||
          claims.iss !== issuer || !Array.isArray(claims.aud) || !claims.aud.includes(audience) ||
          !Number.isFinite(claims.exp) || claims.exp <= now || (claims.nbf ?? 0) > now) return null;
      if (cache?.issuer !== issuer || cache.until <= now || !cache.keys.some(key => key.kid === header.kid)) {
        const response = await fetch(issuer + '/cdn-cgi/access/certs', { signal: AbortSignal.timeout(3000) });
        if (!response.ok) return null;
        const { keys } = await response.json();
        cache = { issuer, keys, until: now + 300 };
      }
      const jwk = cache.keys.find(key => key.kid === header.kid);
      if (!jwk) return null;
      const key = await crypto.subtle.importKey('jwk', jwk,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
      if (!await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decode(sig),
        new TextEncoder().encode(head + '.' + payload))) return null;
      if (typeof claims.email === 'string' && claims.sub) {
        const email = claims.email.toLowerCase();
        const admins = (env.ZONE_ADMINS ?? '').toLowerCase().split(',').map(value => value.trim()).filter(Boolean);
        return { id: email, admin: admins.includes(email) };
      }
      return claims.common_name ? { id: claims.common_name, admin: false, service: true } : null;
    } catch {
      return null;
    }
  }
  if (env.ZONE_CONTROL_KEY && request.headers.get('Authorization') === 'Bearer ' + env.ZONE_CONTROL_KEY) {
    return { id: 'staging-operator', admin: false };
  }
  return null;
}
