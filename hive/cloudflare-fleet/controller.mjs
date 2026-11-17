import {DurableObject} from 'cloudflare:workers';
import {CHECK_INTERVAL, COMPANIONS, FLEET_WORKER, SLOTS, WORKLOADS} from './fleet-plan.mjs';
import {probe} from './probe.mjs';

const MINUTE = 60_000;
const STALE_AFTER = 12 * MINUTE;
const OUTCOMES = new Set(['healthy', 'protected', 'failed']);
const slotByWorker = new Map(SLOTS.map(slot => [slot.worker, slot]));

export class Supervisor extends DurableObject {
  #pending;

  async run(worker, tick) {
    const slot = slotByWorker.get(worker);
    if (!slot || this.ctx.id.name !== worker) throw new Error('Invalid supervisor assignment');
    while (this.#pending) await this.#pending;
    this.#pending = this.#check(slot, tick);
    try {
      return await this.#pending;
    } finally {
      this.#pending = undefined;
    }
  }

  async #check(slot, tick) {
    const previous = await this.ctx.storage.get('latest');
    if (previous?.tick >= tick) return previous;

    let result;
    try {
      if (slot.mode === 'primary' || slot.worker === FLEET_WORKER) {
        result = await probe(slot, this.env[slot.targetBinding], slot.mode === 'companion');
      } else {
        result = await this.env[slot.binding].check();
      }
      if (!OUTCOMES.has(result?.outcome)) throw new Error('Invalid receipt');
    } catch {
      result = {outcome: 'failed', status: null, reason: 'companion_unavailable', latencyMs: null};
    }
    const failures = result.outcome === 'failed' ? (previous?.failures ?? 0) + 1 : 0;
    const receipt = {worker: slot.worker, tick, checkedAt: Date.now(), failures, ...result};
    await this.ctx.storage.put('latest', receipt);
    if (failures === 1 || failures === 2) console.warn('Fleet supervisor', receipt);
    return receipt;
  }
}

export class FleetSummary extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS receipts (
      worker TEXT PRIMARY KEY, tick INTEGER NOT NULL, checked_at INTEGER NOT NULL,
      outcome TEXT NOT NULL, failures INTEGER NOT NULL
    )`);
  }

  record(receipts) {
    this.ctx.storage.transactionSync(() => {
      for (const receipt of receipts) {
        this.ctx.storage.sql.exec(`INSERT INTO receipts VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(worker) DO UPDATE SET tick=excluded.tick, checked_at=excluded.checked_at,
          outcome=excluded.outcome, failures=excluded.failures WHERE excluded.tick > receipts.tick`,
        receipt.worker, receipt.tick, receipt.checkedAt, receipt.outcome, receipt.failures);
      }
    });
  }

  status() {
    const entries = this.ctx.storage.sql.exec('SELECT worker, checked_at, outcome, failures FROM receipts').toArray();
    const byWorker = new Map(entries.map(row => [row.worker, row]));
    const now = Date.now();
    const empty = () => ({assigned: 0, checked: 0, healthy: 0, protected: 0, failed: 0, stale: 0, pending: 0, attention: 0});
    const summary = empty();
    const groups = {};
    let lastChecked = 0;

    for (const slot of SLOTS) {
      const receipt = byWorker.get(slot.worker);
      const outcome = !receipt ? 'pending' : now - receipt.checked_at > STALE_AFTER ? 'stale' : receipt.outcome;
      const group = groups[slot.group] ??= empty();
      for (const counts of [group, summary]) {
        counts.assigned++;
        counts[outcome]++;
        if (receipt) counts.checked++;
        if (outcome === 'stale' || (outcome === 'failed' && receipt.failures >= 2)) counts.attention++;
      }
      if (receipt) lastChecked = Math.max(lastChecked, receipt.checked_at);
    }
    return {
      service: FLEET_WORKER,
      workers: {managed: SLOTS.length, existingWorkloads: WORKLOADS.length, companionBots: COMPANIONS.length},
      supervisors: summary,
      groups,
      checkIntervalMinutes: CHECK_INTERVAL,
      lastChecked: lastChecked ? new Date(lastChecked).toISOString() : null,
    };
  }
}

function summary(env) {
  return env.FLEET_SUMMARY.getByName('fleet');
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (request.method !== 'GET' || !['/', '/health'].includes(path)) return new Response(null, {status: 404});
    return Response.json(await summary(env).status(), {headers: {'Cache-Control': 'no-store'}});
  },

  async scheduled(event, env) {
    const tick = Math.floor(event.scheduledTime / MINUTE);
    const jobs = SLOTS.filter(slot => slot.cohort === tick % CHECK_INTERVAL);
    const receipts = [];
    for (let index = 0; index < jobs.length; index += 4) {
      const results = await Promise.allSettled(jobs.slice(index, index + 4).map(slot =>
        env.SUPERVISORS.getByName(slot.worker).run(slot.worker, tick)));
      for (const result of results) {
        if (result.status === 'fulfilled') receipts.push(result.value);
        else console.error('Fleet supervisor could not record a check', String(result.reason));
      }
    }
    await summary(env).record(receipts);
  },
};
