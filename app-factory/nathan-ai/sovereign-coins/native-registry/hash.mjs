import { createHash } from 'node:crypto';

const algorithms = new Map([['SHA-256', ['sha256', 64]], ['SHA3-512', ['sha3-512', 128]]]);
const hex = (value) => typeof value === 'string' && /^[0-9a-f]+$/i.test(value);
const encoder = new TextEncoder();
const maximum = 16 * 1024;

export class HashRequestError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function hashInput(request) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new HashRequestError('Send application/json.', 415);
  }
  if (!request.body) throw new HashRequestError('Send a JSON object.');
  if (Number(request.headers.get('Content-Length')) > maximum) {
    throw new HashRequestError('Maximum JSON body is 16 KiB.', 413);
  }
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let body = '';
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) {
        await reader.cancel();
        throw new HashRequestError('Maximum JSON body is 16 KiB.', 413);
      }
      body += decoder.decode(value, { stream: true });
    }
    return JSON.parse(body + decoder.decode());
  } catch (error) {
    if (error instanceof HashRequestError) throw error;
    throw new HashRequestError('Send a valid UTF-8 JSON object.');
  } finally {
    reader.releaseLock();
  }
}

export function verifyHash(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HashRequestError('Send a JSON object.');
  }
  const { algorithm, data, encoding = 'utf8', expected, target } = input;
  const definition = algorithms.get(algorithm);
  if (!definition) throw new HashRequestError('Choose SHA-256 or SHA3-512.');
  const [nodeName, width] = definition;
  if (expected !== undefined && (!hex(expected) || expected.length !== width)) {
    throw new HashRequestError('Expected digest must have ' + width + ' hexadecimal digits.');
  }
  if (target !== undefined && (!hex(target) || target.length > width)) {
    throw new HashRequestError('Target must be an unsigned hexadecimal integer of at most ' + width + ' digits.');
  }
  if (typeof data !== 'string' || !['utf8', 'hex'].includes(encoding)) {
    throw new HashRequestError('Provide string data with utf8 or hex encoding.');
  }
  if (encoding === 'hex' && (data.length % 2 || (data !== '' && !hex(data)))) {
    throw new HashRequestError('Hex input must be complete pairs of hexadecimal digits.');
  }
  const bytes = encoding === 'utf8'
    ? encoder.encode(data)
    : Uint8Array.from(data.match(/../g) ?? [], (byte) => Number.parseInt(byte, 16));
  const digest = createHash(nodeName).update(bytes).digest('hex');
  return {
    algorithm,
    encoding,
    byte_count: bytes.byteLength,
    digest,
    matches: expected === undefined ? null : digest === expected.toLowerCase(),
    meets_target: target === undefined ? null : BigInt('0x' + digest) <= BigInt('0x' + target),
    comparison: 'unsigned big-endian digest <= unsigned target',
    scope: 'Digest and optional integer comparison',
  };
}
