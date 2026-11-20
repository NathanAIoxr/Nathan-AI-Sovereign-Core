import { principal } from './access.mjs';
import { consume } from './emit.mjs';
import { digest, eventSeal, genesis, putOnce, travel } from './neila.mjs';

const zone = 'zone/tweezer-tap-os';
const prefix = '/tabor-sites/tweezer-tap-os';
const interval = 10_000;
const identifier = /^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,95}$/;
const json = (body, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store' }
});
const statement = (db, sql, ...bindings) => db.prepare(sql).bind(...bindings);
const master = env => env.CONDUCTOR.get(env.CONDUCTOR.idFromName(zone));
const eventInsert = `INSERT INTO events
  (event_id,event_type,tick_slot,run_id,deck_id,trigger_name) VALUES (?,?,?,?,?,?)`;
const enqueue = 'INSERT INTO emit_outbox(event_id) VALUES (?)';
const auditInsert = `INSERT INTO audit_checks
  (run_id,direction,check_name,outcome,evidence_ref) VALUES (?,?,?,?,?)`;
const manifest = {
  nostril_toy: ['HOLD_HEAD','FLASHLIGHT_ON','TWEEZERS_PULL','RESET_SIM'],
  shoulder_bb: ['HOLD_HEAD','FLASHLIGHT_ON','TWEEZERS_PULL','RESET_SIM'],
  ingrown_nail: ['HOLD_HEAD','FLASHLIGHT_ON','TWEEZERS_PULL','RESET_SIM']
};
const outcomes = {
  HOLD_HEAD: 'SIMULATED', FLASHLIGHT_ON: 'SIMULATED',
  TWEEZERS_PULL: 'SIMULATED', RESET_SIM: 'RESET'
};

export function timeEvent(epoch) {
  const slot = Math.floor(epoch / interval);
  return { id: `time:${slot}`, slot };
}

export class MasterConductor {
  constructor(state, env) {
    this.state = state;
    this.storage = state.storage;
    this.env = env;
    this.db = env.ZONE_DB;
    this.tail = Promise.resolve();
  }

  serial(operation) {
    const pending = this.tail.then(operation);
    this.tail = pending.catch(() => {});
    return pending;
  }

  async permitted() {
    return (await this.storage.get('suspended')) !== true;
  }

  async arm() {
    if ((await this.storage.getAlarm()) === null) {
      await this.storage.setAlarm((timeEvent(Date.now()).slot + 1) * interval);
    }
  }

  alarm() {
    return this.serial(async () => {
      await this.arm();
      await this.heartbeat(Date.now());
    });
  }

  async heartbeat(epoch) {
    const active = await this.storage.get('activeRelease');
    const previous = await this.storage.get('lastHeartbeat');
    if (active?.phase === 'LIVE' && epoch - previous >= 2 * interval) {
      await this.brake('MISSED_HEARTBEATS');
    } else if (active?.phase === 'LIVE' && !await this.verifyHead()) {
      await this.brake('NEILA_INTEGRITY');
    }
    if ((await this.storage.get('activeRelease'))?.phase === 'RESTORE_PENDING') await this.restore();
    if (await this.permitted()) {
      await this.tick(epoch);
      await this.storage.put('lastHeartbeat', Math.max(epoch, previous ?? 0));
    }
  }

  async verifyHead() {
    const chain = await this.db.prepare(`SELECT s.*,e.event_type,e.tick_slot,e.run_id,e.deck_id,e.trigger_name,
      p.merkle_root AS parent FROM event_seals s JOIN events e USING(event_id)
      LEFT JOIN event_seals p ON p.sequence=s.sequence-1 ORDER BY s.sequence DESC LIMIT 1`).first();
    if (!chain) return null;
    const expected = await eventSeal([chain.event_id, chain.event_type, chain.tick_slot, chain.run_id,
      chain.deck_id, chain.trigger_name], chain.sequence, chain.parent ?? genesis);
    const object = await this.env.ZONE_R2.get('neila/events/' + chain.merkle_root + '.json');
    const valid = expected.root === chain.merkle_root && expected.previous === chain.previous_hash &&
      expected.forward === chain.alien_hash && expected.reverse === chain.neila_hash &&
      (chain.sequence === 1 || Boolean(chain.parent)) && await object?.text() === JSON.stringify(expected);
    return valid ? expected.root : null;
  }

  async seal(values) {
    const [id] = values;
    if (await statement(this.db, 'SELECT event_id FROM event_seals WHERE event_id=?', id).first()) return [];
    const head = await this.db.prepare('SELECT sequence,merkle_root FROM event_seals ORDER BY sequence DESC LIMIT 1').first();
    const seal = await eventSeal(values, (head?.sequence ?? 0) + 1, head?.merkle_root ?? genesis);
    await putOnce(this.env.ZONE_R2, 'neila/events/' + seal.root + '.json', seal);
    return [statement(this.db, `INSERT INTO event_seals
      (event_id,sequence,previous_hash,alien_hash,neila_hash,merkle_root) VALUES (?,?,?,?,?,?)`,
      id, seal.sequence, seal.previous, seal.forward, seal.reverse, seal.root)];
  }

  async tick(epoch) {
    const { id, slot } = timeEvent(epoch);
    const values = [id, 'TIME_TICK', slot, null, null, null];
    await this.db.batch([
      statement(this.db, eventInsert, ...values),
      ...await this.seal(values),
      statement(this.db, enqueue, id)
    ]);
    await this.flush();
  }

  async flush() {
    const { results } = await this.db.prepare(
      'SELECT p.* FROM pending_emits p ORDER BY enqueued_at,event_id LIMIT 25'
    ).all();
    for (const row of results) {
      const values = [row.event_id, row.event_type, row.tick_slot, row.run_id, row.deck_id, row.trigger_name];
      const missing = await this.seal(values);
      if (missing.length) await this.db.batch(missing);
      const { merkle_root } = await statement(this.db, 'SELECT merkle_root FROM event_seals WHERE event_id=?', row.event_id).first();
      await this.env.EMIT_BUS.send({
        zone, event_id: row.event_id, event_type: row.event_type,
        tick_slot: row.tick_slot, run_id: row.run_id,
        deck_id: row.deck_id, trigger_name: row.trigger_name, created_at: row.created_at, merkle_root
      });
      await statement(this.db, 'INSERT INTO emit_receipts(event_id) VALUES (?)', row.event_id).run();
    }
  }

  async tap(request) {
    const size = Number(request.headers.get('Content-Length') ?? 0);
    if (size > 1024) return json({ error: 'Tap frame too large' }, 413);
    const reader = request.body?.getReader();
    const buffer = new Uint8Array(1024);
    let length = 0;
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (length + value.length > buffer.length) {
          await reader.cancel();
          return json({ error: 'Tap frame too large' }, 413);
        }
        buffer.set(value, length);
        length += value.length;
      }
    }
    let input;
    try { input = JSON.parse(new TextDecoder().decode(buffer.subarray(0, length))); }
    catch { return json({ error: 'Invalid tap JSON' }, 400); }
    return this.executeTap(input);
  }

  async executeTap(input) {
    if (!(await this.permitted())) return json({ error: 'Zone suspended' }, 423);
    const { id, deck, trigger } = input ?? {};
    if (typeof id !== 'string' || !identifier.test(id) ||
        !Object.hasOwn(manifest, deck) || !manifest[deck].includes(trigger)) {
      return json({ error: 'Use a stable id and a seeded deck and trigger' }, 400);
    }
    const enabled = await statement(this.db, `SELECT c.enabled FROM tap_decks d
      JOIN cartridges c USING(cartridge_id) WHERE d.deck_id=?`, deck).first();
    if (enabled?.enabled !== 1) return json({ error: 'Deck unavailable' }, 409);
    const eventId = `tap:${id}`;
    const runId = 'tap-simulation';
    const old = await statement(this.db, 'SELECT deck_id,trigger_name FROM events WHERE event_id=?', eventId).first();
    if (old && (old.deck_id !== deck || old.trigger_name !== trigger)) {
      return json({ error: 'Event ID already used for another command' }, 409);
    }
    const values = [eventId, 'TAP_SIM', null, runId, deck, trigger];
    await this.db.batch([
      statement(this.db, 'INSERT INTO zone_runs(run_id,zone_id,revision) VALUES (?,?,?)', runId, zone, 'simulation'),
      statement(this.db, eventInsert, ...values),
      statement(this.db, 'INSERT INTO extraction_log(event_id,result) VALUES (?,?)', eventId, outcomes[trigger]),
      ...await this.seal(values),
      statement(this.db, enqueue, eventId)
    ]);
    return json({ event_id: eventId, result: outcomes[trigger], delivery: 'OUTBOX' }, 202);
  }

  async audit() {
    if (!(await this.permitted())) return json({ error: 'Zone suspended' }, 423);
    const revision = this.env.BUILD?.id;
    if (!revision) return json({ error: 'Worker version metadata is required' }, 503);
    const runId = crypto.randomUUID();
    await statement(this.db, 'INSERT INTO zone_runs(run_id,zone_id,revision) VALUES (?,?,?)', runId, zone, revision).run();
    const checks = [
      ['schema', async () => {
        const { results } = await this.db.prepare(
          'SELECT name FROM sqlite_schema WHERE name IN (?,?,?,?,?,?,?)'
        ).bind('events','pending_emits','zone_verification','received_events','audit_checks','tap_decks','extraction_log').all();
        const root = await this.verifyHead();
        return { pass: results.length === 7 && Boolean(root), observed: root };
      }],
      ['smoke', async () => {
        const db = this.db;
        const id = `smoke:${runId}`;
        const values = [id, 'TAP_SIM', null, runId, 'nostril_toy', 'RESET_SIM'];
        await db.batch([
          statement(db, eventInsert, ...values),
          ...await this.seal(values),
          statement(db, 'INSERT INTO extraction_log(event_id,result) VALUES (?,?)', id, 'RESET')
        ]);
        const row = await statement(db, `SELECT e.run_id,e.trigger_name,l.result FROM events e
          JOIN extraction_log l USING(event_id) WHERE e.event_id=?`, id).first();
        return { pass: row?.run_id === runId && row.trigger_name === 'RESET_SIM' && row.result === 'RESET', observed: row };
      }],
      ['manifest', async () => {
        const { results } = await this.db.prepare(
          'SELECT deck_id,trigger_name FROM tap_tiles ORDER BY deck_id,tile_position'
        ).all();
        const expected = Object.keys(manifest).sort().flatMap(deck => manifest[deck].map(trigger => ({
          deck_id: deck, trigger_name: trigger
        })));
        return { pass: results.length === expected.length &&
          results.every((row,i) => row.deck_id === expected[i].deck_id && row.trigger_name === expected[i].trigger_name),
          observed: results };
      }]
    ];
    const forward = await this.verify(runId, revision, 'ALIEN_FORWARD', checks);
    const passed = forward && await this.verify(runId, revision, 'NEILA_REVERSE', [...checks].reverse(), forward);
    const receipt = await statement(this.db, 'SELECT * FROM zone_verification WHERE run_id=?', runId).first();
    if (!passed && (await this.storage.get('activeRelease'))?.phase === 'LIVE') await this.brake('NEILA_INTEGRITY');
    return json(receipt);
  }

  async verify(runId, revision, direction, checks, previous = genesis) {
    for (const [name, inspect] of checks) {
      const evidence = await inspect().catch(() => ({ pass: false, observed: 'CHECK_ERROR' }));
      const record = { zone, runId, revision, direction, name, previous, ...evidence };
      const hash = await digest(record);
      const key = await putOnce(this.env.ZONE_R2, `neila/audit/${runId}/${direction}/${name}.json`, { ...record, hash });
      await this.db.batch([
        statement(this.db, auditInsert, runId, direction, name, evidence.pass ? 'PASS' : 'FAIL', key),
        statement(this.db, 'INSERT INTO audit_seals(run_id,direction,check_name,hash) VALUES (?,?,?,?)', runId, direction, name, hash)
      ]);
      previous = hash;
      if (!evidence.pass) return false;
    }
    return previous;
  }

  async brake(reason) {
    await this.storage.put('suspended', true);
    const active = await this.storage.get('activeRelease');
    if (active?.phase === 'LIVE') {
      await this.storage.put('activeRelease', { ...active, phase: 'RESTORE_PENDING', reason });
      await this.restore();
    }
  }

  async restore() {
    const release = await this.storage.get('activeRelease');
    const next = await this.storage.get('restoreRetry');
    if (next && Date.now() < next) return;
    await this.storage.put('restoreRetry', Date.now() + 60_000);
    try {
      await putOnce(this.env.ZONE_R2, 'neila/rollback/' + release.id + '.json', release);
      const result = await travel(this.env, 'restore', release.bookmark);
      await this.storage.put('activeRelease', { ...release, phase: 'ROLLED_BACK', restoredBookmark: result.bookmark });
      await this.storage.delete('restoreRetry');
    } catch {
      console.error('TWEEZER-OS restore pending');
    }
  }

  async launch(admin) {
    if (!admin || !(await this.permitted())) return json({ error: 'Launch unavailable' }, 423);
    if (!this.env.D1_TIME_TRAVEL_TOKEN || !this.env.ZONE_KV) {
      return json({ error: 'D1 Time Travel is unconfigured' }, 503);
    }
    const active = await this.storage.get('activeRelease');
    if (active?.phase === 'LIVE') return json({ phase: 'LIVE', revision: active.revision });
    const revision = this.env.BUILD?.id;
    const audit = await statement(this.db, `SELECT v.integrity FROM zone_verification v JOIN zone_runs r USING(run_id)
      WHERE r.revision=? ORDER BY r.started_at DESC,r.rowid DESC LIMIT 1`, revision ?? '').first();
    const heartbeat = await this.storage.get('lastHeartbeat');
    if (audit?.integrity !== 'PASS' || !heartbeat || Date.now() - heartbeat >= 2 * interval) {
      return json({ error: 'Current ALIEN/NEILA pass and heartbeat required' }, 409);
    }
    const approval = await this.storage.get('sibling_hold');
    if (!approval || approval.revision !== revision || approval.expires <= Date.now()) {
      await this.storage.put('sibling_hold', { admin, revision, expires: Date.now() + 600_000 });
      return json({ phase: 'SIBLING_HOLD' }, 202);
    }
    if (approval.admin === admin) return json({ error: 'A second admin is required' }, 409);
    const { bookmark } = await travel(this.env, 'bookmark');
    const release = { id: crypto.randomUUID(), revision, bookmark, phase: 'LIVE' };
    await putOnce(this.env.ZONE_R2, 'neila/launch/' + release.id + '.json', release);
    await this.env.ZONE_KV.put('last-pre-launch', JSON.stringify(release));
    await this.storage.delete('sibling_hold');
    await this.storage.put('activeRelease', release);
    return json({ phase: 'LIVE', revision });
  }

  async socket() {
    if (this.state.getWebSockets().length >= 8) return json({ error: 'Too many simulation clients' }, 429);
    const [client, server] = Object.values(new WebSocketPair());
    this.state.acceptWebSocket(server);
    server.serializeAttachment({ lastFlinch: 0, quotaStart: 0, frames: 0 });
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(socket, message) {
    return this.serial(async () => {
      if (!(message instanceof ArrayBuffer) || message.byteLength < 2 || message.byteLength > 20) {
        return socket.close(1003, 'Invalid simulation frame');
      }
      const frame = new Uint8Array(message);
      if (frame[0] !== 1) return socket.close(1003, 'Invalid simulation version');
      const attachment = socket.deserializeAttachment();
      const now = Date.now();
      if (now - attachment.quotaStart >= 1000) Object.assign(attachment, { quotaStart: now, frames: 0 });
      if (++attachment.frames > 12) return socket.close(1008, 'Simulation frame limit');
      if (frame[1] === 2 && frame.length === 2) {
        if (now - attachment.lastFlinch >= 250 && await this.permitted()) {
          attachment.lastFlinch = now;
          socket.send(JSON.stringify({ signal: 'irq_flinch', simulation: true }));
        }
        socket.serializeAttachment(attachment);
        return;
      }
      socket.serializeAttachment(attachment);
      if (frame[1] !== 1 || frame.length !== 20) return socket.close(1003, 'Invalid TAP THAT frame');
      const deck = Object.keys(manifest)[frame[2]];
      const trigger = manifest[deck]?.[frame[3]];
      const hex = Array.from(frame.slice(4), byte => byte.toString(16).padStart(2, '0')).join('');
      const id = hex.replace(/^(........)(....)(....)(....)(............)$/, '$1-$2-$3-$4-$5');
      const response = await this.executeTap({ id, deck, trigger });
      socket.send(JSON.stringify({ request_id: id, status: response.status, ...await response.json() }));
    });
  }

  fetch(request) {
    return this.serial(async () => {
      const path = new URL(request.url).pathname;
      const method = request.method;
      if (method === 'POST' && path === '/internal/cron') {
        await this.arm();
        const { epoch } = await request.json();
        await this.heartbeat(Math.max(Date.now(), epoch));
        return json({ zone });
      }
      if (method === 'POST' && (path === '/brake' || path === '/resume')) {
        if (path === '/brake') await this.brake('MANUAL_BRAKE');
        else {
          if ((await this.storage.get('activeRelease'))?.phase === 'RESTORE_PENDING') {
            return json({ error: 'D1 restore pending' }, 423);
          }
          await this.storage.put('suspended', false);
        }
        return json({ suspended: path === '/brake' });
      }
      if (method === 'GET' && path === '/status') {
        const pending = await this.db.prepare('SELECT count(*) AS count FROM pending_emits').first();
        const heartbeat = await this.db.prepare('SELECT max(tick_slot) AS slot FROM events').first();
        const audit = await this.db.prepare(`SELECT v.* FROM zone_verification v JOIN zone_runs r USING(run_id)
          WHERE v.revision <> 'simulation' ORDER BY r.started_at DESC, r.run_id DESC LIMIT 1`).first();
        return json({ zone, suspended: !(await this.permitted()), pending: pending.count,
          lastTick: heartbeat.slot, slotMs: interval, audit,
          switch: (await this.storage.get('activeRelease'))?.phase ?? 'REHEARSAL' });
      }
      if (method === 'POST' && path === '/tap') return this.tap(request);
      if (method === 'POST' && path === '/audit') return this.audit();
      if (method === 'POST' && path === '/switch/launch') return this.launch(request.headers.get('X-Zone-Admin'));
      if (method === 'GET' && path === '/socket' && request.headers.get('Upgrade')?.toLowerCase() === 'websocket') return this.socket();
      return json({ error: 'Route unavailable' }, 404);
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'tweezer-tap-os.internal' && request.method === 'POST' &&
        env.RELAY_KEY && request.headers.get('X-Conductor-Relay') === env.RELAY_KEY) {
      if (url.pathname === '/internal/cron') return master(env).fetch(request);
      if (url.pathname === '/internal/queue') {
        const { queue, messages } = await request.json();
        if (!['zone-tweezer-events-q', 'zone-tweezer-events-dlq'].includes(queue) || messages.length > 10) {
          return json({ error: 'Unexpected queue batch' }, 400);
        }
        const ack = [];
        const batch = messages.map((message, index) => ({
          ...message, ack: () => ack.push(index), retry: () => {}
        }));
        const legacy = queue === 'zone-tweezer-events-q' &&
          env.REHEARSAL ? batch.filter(message => message.body?.zone === 'tweezer-tap-os') : [];
        await consume({ queue, messages: batch.filter(message => !legacy.includes(message)) }, env, zone);
        if (legacy.length) await env.REHEARSAL.queue({ queue, messages: legacy }, env);
        return json({ ack });
      }
    }
    const path = (url.pathname === prefix || url.pathname.startsWith(prefix + '/') ?
      url.pathname.slice(prefix.length) : url.pathname) || '/';
    if (path.startsWith('/internal/')) return json({ error: 'Unknown route' }, 404);
    if (request.method === 'GET' && path === '/health') {
      const row = await env.ZONE_DB.prepare(`SELECT
        (SELECT count(*) FROM event_seals) AS seals,
        (SELECT count(*) FROM received_events) AS received,
        (SELECT max(tick_slot) FROM events) AS last_tick`).first();
      return json({ zone, version: env.BUILD?.id, ...row });
    }
    const user = await principal(request, env);
    if (!user) return json({ error: 'Staging credentials required' }, 401);
    if (path === '/switch/launch' && !user.admin) return json({ error: 'Zone admin required' }, 403);
    if (user.service && !['/status', '/socket', '/tap'].includes(path)) return json({ error: 'Service access limited to simulation' }, 403);
    if (request.headers.get('Origin') && request.headers.get('Origin') !== url.origin) {
      return json({ error: 'Origin not allowed' }, 403);
    }
    url.pathname = path;
    if (request.method === 'GET' && path === '/') return env.ASSETS.fetch(new Request(url, request));
    const internal = new Request(url, request);
    internal.headers.delete('X-Zone-Admin');
    if (user.admin) internal.headers.set('X-Zone-Admin', user.id);
    return master(env).fetch(internal);
  },
  async scheduled(event, env) {
    const reply = await master(env).fetch('https://conductor.invalid/internal/cron', {
      method: 'POST', body: JSON.stringify({ epoch: event.scheduledTime })
    });
    if (!reply.ok) throw new Error('Conductor cron failed');
  },
  queue: (batch, env) => consume(batch, env, zone)
};
