import { digest, eventSeal, putOnce } from './neila.mjs';

function stmt(db, sql, ...params) { return db.prepare(sql).bind(...params); }

async function webhook(env, event) {
  if (!env.EMIT_WEBHOOK_URL || event.event_type !== 'TAP_SIM') return;
  const url = new URL(env.EMIT_WEBHOOK_URL);
  if (url.protocol !== 'https:' || url.username || url.password || !env.EMIT_WEBHOOK_KEY) {
    throw new Error('Invalid webhook configuration');
  }
  const db = env.ZONE_DB;
  if (await stmt(db, 'SELECT event_id FROM emit_webhook_receipts WHERE event_id=?', event.event_id).first()) return;
  const body = JSON.stringify(event);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.EMIT_WEBHOOK_KEY),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(body))),
    byte => byte.toString(16).padStart(2, '0')).join('');
  const response = await fetch(url, {
    method: 'POST', body, redirect: 'error', signal: AbortSignal.timeout(5000),
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': event.event_id,
      'X-EMIT-Signature': 'sha256=' + signature }
  });
  if (!response.ok) throw new Error('Webhook delivery failed');
  await stmt(db, 'INSERT OR IGNORE INTO emit_webhook_receipts(event_id) VALUES (?)', event.event_id).run();
}

export async function consume(batch, env, zone) {
  if (batch.queue === 'zone-tweezer-events-dlq') {
    for (const message of batch.messages) {
      await putOnce(env.ZONE_R2, 'dead-letter/' + await digest(message.id) + '.json',
        { id: message.id, attempts: message.attempts, body: message.body });
      message.ack();
    }
    return;
  }
  const db = env.ZONE_DB;
  const accepted = [];
  for (const message of batch.messages) {
    try {
      const { event_id: id, zone: source, merkle_root: root } = message.body ?? {};
      if (typeof id !== 'string' || id.length > 128 || source !== zone) throw new Error('Invalid EMIT event');
      const event = await stmt(db, `SELECT e.*,s.sequence,s.previous_hash,s.alien_hash,s.neila_hash,s.merkle_root
        FROM events e JOIN event_seals s USING(event_id) WHERE event_id=?`, id).first();
      if (!event || (root && event.merkle_root !== root)) throw new Error('NEILA seal missing or mismatched');
      const values = [id, event.event_type, event.tick_slot, event.run_id, event.deck_id, event.trigger_name];
      const seal = await eventSeal(values, event.sequence, event.previous_hash);
      if (seal.root !== event.merkle_root || seal.forward !== event.alien_hash || seal.reverse !== event.neila_hash) {
        throw new Error('NEILA seal verification failed');
      }
      accepted.push([message, { zone, event_id: id, event_type: event.event_type, tick_slot: event.tick_slot,
        run_id: event.run_id, deck_id: event.deck_id, trigger_name: event.trigger_name,
        created_at: event.created_at, merkle_root: seal.root }]);
    } catch {
      message.retry();
    }
  }
  if (accepted.length) {
    await db.batch(accepted.map(([, event]) =>
      stmt(db, 'INSERT OR IGNORE INTO received_events(event_id) VALUES (?)', event.event_id)));
  }
  for (const [message, event] of accepted) {
    try {
      await webhook(env, event);
      message.ack();
    } catch {
      message.retry();
    }
  }
}
