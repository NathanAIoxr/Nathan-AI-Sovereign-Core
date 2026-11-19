import { AwsClient } from 'aws4fetch';
import { pathToFileURL } from 'node:url';

export async function presign({ method, object, seconds = 300, contentType }, env) {
  if (!['GET', 'PUT'].includes(method)) throw new Error('Use GET or PUT.');
  const segments = object?.split('/') ?? [];
  if (!segments.length || Buffer.byteLength(object) > 1024 ||
      segments.some(part => !part || part === '.' || part === '..' || /[\x00-\x1f\x7f\\]/.test(part))) {
    throw new Error('Enter a valid, non-empty R2 object key.');
  }
  if (!Number.isInteger(seconds) || seconds < 1 || seconds > 900) {
    throw new Error('Expiry must be a whole number from 1 to 900 seconds.');
  }
  if (!/^[a-f0-9]{32}$/i.test(env.CLOUDFLARE_ACCOUNT_ID ?? '') ||
      !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new Error('Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.');
  }

  const key = segments.map(part => encodeURIComponent(part)).join('/');
  const url = new URL(`https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/tabor-edge-operations/${key}`);
  url.searchParams.set('X-Amz-Expires', String(seconds));
  const headers = method === 'PUT' && contentType ? { 'Content-Type': contentType } : undefined;
  const signer = new AwsClient({
    service: 's3',
    region: 'auto',
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    sessionToken: env.R2_SESSION_TOKEN || undefined
  });
  const signed = await signer.sign(new Request(url, { method, headers }), {
    aws: { signQuery: true, allHeaders: true }
  });
  return signed.url;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , method, object, rawSeconds = '300', contentType] = process.argv;
  try {
    if (!/^\d+$/.test(rawSeconds)) throw new Error('Use a whole number of seconds.');
    console.log(await presign({ method, object, seconds: Number(rawSeconds), contentType }, process.env));
  } catch (error) {
    console.error(error instanceof URIError ? 'Enter a valid UTF-8 object key.' : error.message);
    process.exitCode = 1;
  }
}
