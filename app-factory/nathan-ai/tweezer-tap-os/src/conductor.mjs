const zone = 'zone/tweezer-tap-os';
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
      if (await this.permitted()) await this.tick(Date.now());
    });
  }

  async tick(epoch) {
    const { id, slot } = timeEvent(epoch);
    await this.db.batch([
      statement(this.db, eventInsert, id, 'TIME_TICK', slot, null, null, null),
      statement(this.db, enqueue, id)
    ]);
    await this.flush();
  }

  async flush() {
    const { results } = await this.db.prepare(
      'SELECT * FROM pending_emits ORDER BY enqueued_at,event_id LIMIT 25'
    ).all();
    if (this.env.DELIVERY_MODE === 'd1') {
      if (!results.length) return;
      await this.db.batch(results.flatMap(row => [
        statement(this.db, 'INSERT INTO received_events(event_id) VALUES (?) ON CONFLICT(event_id) DO NOTHING', row.event_id),
        statement(this.db, 'INSERT INTO emit_receipts(event_id) VALUES (?)', row.event_id)
      ]));
      return;
    }
    for (const row of results) {
      await this.env.EMIT_BUS.send({
        zone, event_id: row.event_id, event_type: row.event_type,
        tick_slot: row.tick_slot, run_id: row.run_id,
        deck_id: row.deck_id, trigger_name: row.trigger_name, created_at: row.created_at
      });
      await statement(this.db, 'INSERT INTO emit_receipts(event_id) VALUES (?)', row.event_id).run();
    }
  }

  async tap(request) {
    if (!(await this.permitted())) return json({ error: 'Zone suspended' }, 423);
    const input = await request.json().catch(() => null);
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
    await this.db.batch([
      statement(this.db, 'INSERT INTO zone_runs(run_id,zone_id,revision) VALUES (?,?,?)', runId, zone, 'simulation'),
      statement(this.db, eventInsert, eventId, 'TAP_SIM', null, runId, deck, trigger),
      statement(this.db, 'INSERT INTO extraction_log(event_id,result) VALUES (?,?)', eventId, outcomes[trigger]),
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
        return { pass: results.length === 7, observed: results.map(row => row.name).sort() };
      }],
      ['smoke', async () => {
        const db = this.db;
        const id = `smoke:${runId}`;
        await db.batch([
          statement(db, eventInsert, id, 'TAP_SIM', null, runId, 'nostril_toy', 'RESET_SIM'),
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
    if (await this.verify(runId, revision, 'ALIEN_FORWARD', checks)) {
      await this.verify(runId, revision, 'NEILA_REVERSE', [...checks].reverse());
    }
    return json(await statement(this.db, 'SELECT * FROM zone_verification WHERE run_id=?', runId).first());
  }

  async verify(runId, revision, direction, checks) {
    for (const [name, inspect] of checks) {
      const evidence = await inspect().catch(() => ({ pass: false, observed: 'CHECK_ERROR' }));
      const key = `audit/${runId}/${direction}/${name}.json`;
      await this.env.ZONE_R2.put(key, JSON.stringify({ zone, runId, revision, direction, name, ...evidence }));
      await statement(this.db, auditInsert, runId, direction, name,
        evidence.pass ? 'PASS' : 'FAIL', key).run();
      if (!evidence.pass) return false;
    }
    return true;
  }

  fetch(request) {
    return this.serial(async () => {
      const path = new URL(request.url).pathname;
      const method = request.method;
      if (method === 'POST' && path === '/internal/cron') {
        await this.arm();
        const { epoch } = await request.json();
        if (await this.permitted()) await this.tick(epoch);
        return json({ zone });
      }
      if (method === 'POST' && (path === '/brake' || path === '/resume')) {
        await this.storage.put('suspended', path === '/brake');
        return json({ suspended: path === '/brake' });
      }
      if (method === 'GET' && path === '/status') {
        const pending = await this.db.prepare('SELECT count(*) AS count FROM pending_emits').first();
        const heartbeat = await this.db.prepare('SELECT max(tick_slot) AS slot FROM events').first();
        const audit = await this.db.prepare(`SELECT v.* FROM zone_verification v JOIN zone_runs r USING(run_id)
          WHERE v.revision <> 'simulation' ORDER BY r.started_at DESC, r.run_id DESC LIMIT 1`).first();
        return json({ zone, suspended: !(await this.permitted()), pending: pending.count, delivery: this.env.DELIVERY_MODE === 'd1' ? 'D1' : 'QUEUE',
          lastTick: heartbeat.slot, slotMs: interval, audit });
      }
      if (method === 'POST' && path === '/clock') {
        await this.arm();
        if (!(await this.permitted())) return json({ error: 'Zone suspended' }, 423);
        await this.tick(Date.now());
        return json({ zone, delivery: this.env.DELIVERY_MODE === 'd1' ? 'D1' : 'QUEUE' });
      }
      if (method === 'POST' && path === '/tap') return this.tap(request);
      if (method === 'POST' && path === '/audit') return this.audit();
      return json({ error: 'Route unavailable' }, 404);
    });
  }
}

export default {
  fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/internal/')) return json({ error: 'Unknown route' }, 404);
    if (request.method === 'GET' && url.pathname === '/') return env.ASSETS.fetch(request);
    if (request.method === 'GET' && url.pathname === '/') {
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return new Response(env.BOARD_HTML, { headers: {
        'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      } });
    }
    if (!env.ZONE_CONTROL_KEY ||
      request.headers.get('Authorization') !== `Bearer ${env.ZONE_CONTROL_KEY}`) {
      return json({ error: 'Staging credentials required' }, 401);
    }
    return master(env).fetch(request);
  },
  async scheduled(event, env) {
    const reply = await master(env).fetch('https://conductor.invalid/internal/cron', {
      method: 'POST', body: JSON.stringify({ epoch: event.scheduledTime })
    });
    if (!reply.ok) throw new Error('Conductor cron failed');
  },
  async queue(batch, env) {
    for (const message of batch.messages) {
      const id = message.body?.event_id;
      if (message.body?.zone !== zone || typeof id !== 'string') {
        message.ack();
        continue;
      }
      await statement(env.ZONE_DB, `INSERT INTO received_events(event_id)
        SELECT event_id FROM events WHERE event_id=? ON CONFLICT(event_id) DO NOTHING`, id).run();
      message.ack();
    }
  }
};
