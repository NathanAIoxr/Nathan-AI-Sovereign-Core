const maxFile = 16 * 1024 * 1024;
const maxMessage = 512 * 1024;
const decoder = new TextDecoder();
const encoder = new TextEncoder();

function parseMessage(message) {
  const split = /\r?\n\r?\n/.exec(message);
  if (!split) throw new Error('This file is missing its email headers or body.');
  const headers = new Map();
  for (const line of message.slice(0, split.index).replace(/\r?\n[ \t]+/g, ' ').split(/\r?\n/)) {
    const colon = line.indexOf(':');
    if (colon > 0) headers.set(line.slice(0, colon).toLowerCase(), line.slice(colon + 1).trim());
  }
  return { headers, body: message.slice(split.index + split[0].length) };
}

function decodeBody(body, charset, transferEncoding) {
  const reader = new TextDecoder(charset || 'utf-8');
  if (transferEncoding === 'base64') {
    return reader.decode(Uint8Array.from(atob(body.replace(/\s+/g, '')), byte => byte.charCodeAt(0)));
  }
  if (transferEncoding !== 'quoted-printable') return body;
  const encoded = body.replace(/=\r?\n/g, '').split(/(=[0-9a-fA-F]{2})/);
  return reader.decode(Uint8Array.from(encoded.flatMap(part =>
    /^=[0-9a-fA-F]{2}$/.test(part) ? [Number.parseInt(part.slice(1), 16)] : [...encoder.encode(part)],
  )));
}

function plainText({ headers, body }, depth = 0) {
  if (depth > 6 || /^attachment\b/i.test(headers.get('content-disposition') ?? '')) return undefined;
  const type = headers.get('content-type') ?? 'text/plain';
  if (/^text\/plain\b/i.test(type)) {
    const charset = /charset\s*=\s*(?:"([^"]+)"|([^;\s]+))/i.exec(type);
    return decodeBody(body, charset?.[1] ?? charset?.[2], headers.get('content-transfer-encoding')?.toLowerCase());
  }
  const boundary = /\bboundary\s*=\s*(?:"([^"]+)"|([^;\s]+))/i.exec(type);
  if (!/^multipart\//i.test(type) || !boundary) return undefined;

  const marker = '--' + (boundary[1] ?? boundary[2]);
  const separator = /\r?\n/;
  let start = null;
  for (const line of body.matchAll(/[^\r\n]*(?:\r?\n|$)/g)) {
    const value = line[0].replace(separator, '').trimEnd();
    if (value !== marker && value !== marker + '--') continue;
    if (start !== null && line.index > start) {
      const child = parseMessage(body.slice(start, line.index));
      const text = plainText(child, depth + 1);
      if (text !== undefined) return text;
    }
    if (value.endsWith('--') && value === marker + '--') break;
    start = line.index + line[0].length;
  }
}

function getRecord(bytes, expectedId) {
  const message = parseMessage(decoder.decode(bytes));
  const number = /^codex\s+([0-9])$/i.exec(message.headers.get('subject') ?? '')?.[1];
  const id = number === undefined ? undefined : 'codex-0' + number;
  const text = plainText(message);
  if (!id || (expectedId && expectedId !== id) || !text?.trim()) {
    throw new Error('This email needs a numbered Codex 0–9 subject and a plain-text body.');
  }
  return [id, text];
}

async function inflate(data, size) {
  const reader = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const result = new Uint8Array(size);
  let offset = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (offset + value.length > size) throw new Error('Invalid inflated email size.');
      result.set(value, offset);
      offset += value.length;
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  if (offset !== size) throw new Error('Incomplete email in the source ZIP.');
  return result;
}

async function zipRecords(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u32 = index => view.getUint32(index, true);
  const u16 = index => view.getUint16(index, true);
  const searchLimit = Math.max(0, view.byteLength - 65557);
  let end = view.byteLength - 22;
  for (; end >= searchLimit; end--) {
    if (u32(end) === 0x06054b50 && end + 22 + u16(end + 20) === view.byteLength) break;
  }
  if (end < searchLimit || u16(end + 4) || u16(end + 6)) throw new Error('Could not read this ZIP directory.');

  const count = u16(end + 10);
  const start = u32(end + 16);
  if (count > 500 || start + u32(end + 12) !== end) throw new Error('Unsupported ZIP directory.');
  const records = new Map();
  let next = start;
  for (let index = 0; index < count; index++) {
    const entry = next;
    if (entry + 46 > end || u32(entry) !== 0x02014b50) throw new Error('Invalid ZIP entry.');
    const nameStart = entry + 46;
    const nameEnd = nameStart + u16(entry + 28);
    next = nameEnd + u16(entry + 30) + u16(entry + 32);
    if (next > end) throw new Error('Invalid ZIP entry name.');
    const name = decoder.decode(bytes.subarray(nameStart, nameEnd));
    const id = /^(?:numbered-drafts\/)?(codex-0[0-9])\.eml$/i.exec(name)?.[1]?.toLowerCase();
    if (!id) continue;

    const local = u32(entry + 42);
    const size = u32(entry + 24);
    const compressedSize = u32(entry + 20);
    const method = u16(entry + 10);
    if (records.has(id) || size > maxMessage || u16(entry + 8) & 1 ||
        local + 30 > start || u32(local) !== 0x04034b50 || ![0, 8].includes(method)) {
      throw new Error('Unsupported or duplicate email in the ZIP.');
    }
    const dataStart = local + 30 + u16(local + 26) + u16(local + 28);
    if (dataStart + compressedSize > start || (method === 0 && compressedSize !== size)) {
      throw new Error('Incomplete email in the source ZIP.');
    }
    const data = bytes.subarray(dataStart, dataStart + compressedSize);
    const [, body] = getRecord(method === 0 ? data : await inflate(data, size), id);
    records.set(id, body);
  }
  if (records.size === 0) throw new Error('No numbered Codex emails were found in this ZIP.');
  return records;
}

export async function readLocalArchive(file) {
  if (file.size > maxFile) throw new Error('Choose a source ZIP or email smaller than 16 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (/\.zip$/i.test(file.name)) return zipRecords(bytes);
  if (!/\.eml$/i.test(file.name) || /codex-01-it\.eml$/i.test(file.name) || file.size > maxMessage) {
    throw new Error('Choose a numbered Codex email or the source ZIP.');
  }
  return new Map([getRecord(bytes)]);
}
