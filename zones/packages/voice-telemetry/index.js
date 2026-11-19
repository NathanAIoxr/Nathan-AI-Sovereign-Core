import { sha256 } from '../provenance-ledger/index.js';

export async function readBody(request, max) {
  const length = request.headers.get('Content-Length');
  if (length !== null && Number(length) > max) throw new RangeError('Body too large');
  if (!request.body) throw new SyntaxError('Missing body');
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel().catch(() => {});
        throw new RangeError('Body too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (!size) throw new SyntaxError('Missing body');
  const data = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return data;
}

export async function readObject(request, max = 16384) {
  const body = JSON.parse(new TextDecoder().decode(await readBody(request, max)));
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new SyntaxError('Expected JSON object');
  return body;
}

async function writeEvent(db, project, id, source, data) {
  const body = JSON.stringify(data);
  if (new TextEncoder().encode(body).length > 16384) throw new RangeError('Event too large');
  await db.prepare(
    'INSERT INTO telemetry_stream (project_id, event_id, source, body) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING'
  ).bind(project, id, source, body).run();
  const saved = await db.prepare(
    'SELECT source, body FROM telemetry_stream WHERE project_id = ? AND event_id = ?'
  ).bind(project, id).first();
  if (saved.source !== source || saved.body !== body) return { conflict: true };
  return { eventId: id };
}

export async function ingestTelemetry(request, env, project) {
  const payload = await readObject(request);
  const id = request.headers.get('Idempotency-Key') ?? await sha256(JSON.stringify(payload));
  if (!/^[a-zA-Z0-9_.:-]{1,96}$/.test(id)) throw new SyntaxError('Invalid idempotency key');
  return writeEvent(env.ZONES, project, id, 'http', payload);
}

function asBase64(bytes) {
  const chunks = [];
  for (let index = 0; index < bytes.length; index += 8192) {
    chunks.push(String.fromCharCode(...bytes.subarray(index, index + 8192)));
  }
  return btoa(chunks.join(''));
}

export async function ingestVoice(request, env, project) {
  const contentType = request.headers.get('Content-Type')?.split(';', 1)[0];
  if (!['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg'].includes(contentType)) {
    throw new SyntaxError('Use an audio upload');
  }
  const bytes = await readBody(request, 4 * 1024 * 1024);
  const digest = await sha256(bytes);
  const id = 'voice-' + digest;
  const saved = await env.ZONES.prepare(
    'SELECT body FROM telemetry_stream WHERE project_id = ? AND event_id = ? AND source = ?'
  ).bind(project, id, 'voice').first();
  if (saved) return { eventId: id };

  const result = await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
    audio: asBase64(bytes), task: 'transcribe', vad_filter: true,
  });
  if (typeof result.text !== 'string' || !result.text.trim()) throw new SyntaxError('No speech detected');
  const transcript = result.text.trim();
  const cleaned = transcript.replace(/\b(?:um+|uh+)\b[, ]*/gi, '').replace(/\s{2,}/g, ' ').trim();
  const hashtags = [...new Set(cleaned.match(/#[\p{L}\p{N}_-]+/gu) ?? [])].slice(0, 30);
  return writeEvent(env.ZONES, project, id, 'voice', { digest, transcript, cleaned, hashtags });
}
