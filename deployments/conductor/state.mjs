import { DurableObject } from "cloudflare:workers";

export const project = "zeros-and-ones";
export const repository = "NathanAIoxr/Nathan-AI-Sovereign-Core";
const git = "https://api.github.com/repos/" + repository;
const live = "https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/zeros-and-ones/health";
const active = "'queued','dispatching','waiting_github','verifying'";
const maxJobs = 20;
const waitMs = 20_000;

function backoff(attempt) {
  return Math.min(60_000, 2_000 * 2 ** Math.min(attempt, 5));
}

export class ProjectConductor extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    ctx.blockConcurrencyWhile(async () => this.sql.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY, command TEXT NOT NULL, state TEXT NOT NULL,
        created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
        next_at INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0,
        run_id INTEGER, expected_release TEXT, release TEXT, issue TEXT
      );
      CREATE INDEX IF NOT EXISTS jobs_state ON jobs(state, next_at);
      CREATE TABLE IF NOT EXISTS control (
        id INTEGER PRIMARY KEY CHECK(id=1), paused INTEGER NOT NULL,
        failures INTEGER NOT NULL, reason TEXT
      );
      INSERT OR IGNORE INTO control VALUES (1, 0, 0, NULL);
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY, job_id TEXT, event TEXT NOT NULL, created_at INTEGER NOT NULL,
        details TEXT NOT NULL, next_export INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS events_pending ON events(next_export);
    `));
  }

  ready() {
    return this.sql.exec("SELECT 1 AS ready").one().ready === 1;
  }

  get(id) {
    return this.sql.exec("SELECT * FROM jobs WHERE id = ?", id).toArray()[0] ?? null;
  }

  list() {
    return {
      control: this.sql.exec("SELECT paused, failures, reason FROM control WHERE id=1").one(),
      jobs: this.sql.exec("SELECT * FROM jobs ORDER BY created_at DESC LIMIT 25").toArray()
    };
  }

  log(jobId, event, details = {}) {
    const now = Date.now();
    this.sql.exec("INSERT INTO events(id,job_id,event,created_at,details,next_export) VALUES(?,?,?,?,?,?)",
      crypto.randomUUID(), jobId, event, now, JSON.stringify(details), now);
    console.log(JSON.stringify({ component: "conductor", jobId, event }));
  }

  async submit(id, command) {
    const old = this.get(id);
    if (old) return old.command === command ? { job: old, replayed: true } : { error: "idempotency_conflict", status: 409 };
    const n = this.sql.exec(`SELECT COUNT(*) AS n FROM jobs WHERE state IN (${active},'awaiting_approval')`).one().n;
    if (n >= maxJobs) return { error: "queue_full", status: 429 };
    const state = command === "deploy" ? "awaiting_approval" : "queued";
    const now = Date.now();
    this.ctx.storage.transactionSync(() => {
      this.sql.exec("INSERT INTO jobs(id,command,state,created_at,updated_at,next_at) VALUES(?,?,?,?,?,?)",
        id, command, state, now, now, now);
      this.log(id, state, { command });
    });
    await this.schedule();
    return { job: this.get(id), replayed: false };
  }

  async decision(id, approved) {
    const job = this.get(id);
    if (!job) return { error: "not_found", status: 404 };
    if (job.state !== "awaiting_approval") return { error: "already_decided", status: 409 };
    if (approved && !this.env.GITHUB_ACTIONS_TOKEN) return { error: "github_credential_missing", status: 409 };
    this.change(id, approved ? "queued" : "rejected", { event: approved ? "approved" : "rejected" });
    await this.schedule();
    return { job: this.get(id) };
  }

  async setPaused(paused) {
    this.ctx.storage.transactionSync(() => {
      this.sql.exec("UPDATE control SET paused=?, reason=?, failures=CASE WHEN ?=0 THEN 0 ELSE failures END WHERE id=1",
        Number(paused), paused ? "operator" : null, Number(paused));
      this.log(null, paused ? "paused" : "resumed");
    });
    await this.schedule();
    return this.list().control;
  }

  async wake(runId) {
    this.sql.exec("UPDATE jobs SET next_at=? WHERE state='waiting_github' AND run_id=?", Date.now(), runId);
    await this.schedule();
  }

  change(id, state, fields = {}) {
    const { event = state, attempts = 0, next = Date.now(), runId, expected, release, issue } = fields;
    this.ctx.storage.transactionSync(() => {
      this.sql.exec(`UPDATE jobs SET state=?,updated_at=?,next_at=?,attempts=?,
        run_id=COALESCE(?,run_id), expected_release=COALESCE(?,expected_release),
        release=COALESCE(?,release),issue=? WHERE id=?`,
        state, Date.now(), next, attempts, runId ?? null, expected ?? null, release ?? null, issue ?? null, id);
      this.log(id, event, { state, issue: issue ?? null, run_id: runId ?? null, release: release ?? null });
      if (state === "done") this.sql.exec("UPDATE control SET failures=0 WHERE id=1");
      if (state === "failed" || state === "needs_review") {
        this.sql.exec("UPDATE control SET failures=failures+1 WHERE id=1");
        if (state === "needs_review") {
          this.sql.exec("UPDATE control SET paused=1,reason='needs_review' WHERE id=1");
          this.log(null, "review_pause");
        } else if (this.sql.exec("SELECT failures FROM control WHERE id=1").one().failures === 3) {
          this.sql.exec("UPDATE control SET paused=1,reason='circuit_open' WHERE id=1");
          this.log(null, "circuit_open");
        }
      }
    });
  }

  async schedule() {
    const work = this.sql.exec(`
      SELECT MIN(next_at) AS due FROM jobs
      WHERE state IN ('dispatching','waiting_github','verifying')
        OR (state='queued' AND (SELECT paused FROM control WHERE id=1)=0
          AND NOT EXISTS (SELECT 1 FROM jobs WHERE state IN ('dispatching','waiting_github','verifying')))
    `).one().due;
    const outbox = this.sql.exec("SELECT MIN(next_export) AS due FROM events WHERE next_export>0").one().due;
    const next = Math.min(work ?? Infinity, outbox ?? Infinity);
    if (Number.isFinite(next)) await this.ctx.storage.setAlarm(Math.max(Date.now() + 100, next));
    else await this.ctx.storage.deleteAlarm();
  }

  async alarm() {
    try {
      await this.advance();
    } finally {
      try {
        await this.mirrorEvents();
      } finally {
        await this.schedule();
      }
    }
  }

  async advance() {
    const now = Date.now();
    const existing = this.sql.exec("SELECT * FROM jobs WHERE state IN ('dispatching','waiting_github','verifying') LIMIT 1").toArray()[0];
    if (existing?.next_at > now) return;
    const paused = this.sql.exec("SELECT paused FROM control WHERE id=1").one().paused;
    const job = existing ?? (!paused && this.sql.exec("SELECT * FROM jobs WHERE state='queued' AND next_at<=? ORDER BY created_at,id LIMIT 1", now).toArray()[0]);
    if (!job) return;

    if (job.state === "dispatching") {
      this.change(job.id, "needs_review", { issue: "github_dispatch_outcome_unknown" });
      return;
    }
    if (job.state === "queued" && job.command === "deploy") {
      if (!this.env.GITHUB_ACTIONS_TOKEN) {
        this.change(job.id, "failed", { issue: "github_credential_missing" });
        return;
      }
      // Persist this boundary before the POST. A lost response must never fire a second run.
      this.change(job.id, "dispatching", { next: now + waitMs });
      await this.schedule();
      try {
        const res = await this.github("/actions/workflows/deploy.yml/dispatches", {
          method: "POST", body: JSON.stringify({ ref: "main" })
        });
        if ([400, 401, 403, 404, 422, 429].includes(res.status)) {
          this.change(job.id, "failed", { issue: "github_dispatch_rejected" });
          return;
        }
        if (res.status !== 200) throw new Error("Missing dispatch receipt");
        const { workflow_run_id: runId } = await res.json();
        if (!Number.isSafeInteger(runId) || runId < 1) throw new Error("Invalid dispatch receipt");
        this.change(job.id, "waiting_github", { runId, next: Date.now() + 3_000 });
      } catch {
        this.change(job.id, "needs_review", { issue: "github_dispatch_outcome_unknown" });
      }
      return;
    }

    if (job.state === "waiting_github") {
      try {
        const res = await this.github("/actions/runs/" + job.run_id);
        if (!res.ok) throw new Error("Run lookup unavailable");
        const run = await res.json();
        if (run.status === "completed") {
          if (run.conclusion === "success" && /^[a-f0-9]{40}$/.test(run.head_sha ?? "")) {
            this.change(job.id, "verifying", { expected: run.head_sha, runId: job.run_id });
          } else {
            this.change(job.id, "failed", { issue: "github_run_failed", runId: job.run_id });
          }
          return;
        }
      } catch {
        // The next alarm retries only this read.
      }
      const attempts = job.attempts + 1;
      if (attempts >= 36) this.change(job.id, "needs_review", { issue: "github_wait_expired", runId: job.run_id });
      else this.sql.exec("UPDATE jobs SET attempts=?,next_at=? WHERE id=?", attempts, Date.now() + waitMs, job.id);
      return;
    }

    if (job.state === "queued") {
      this.change(job.id, "verifying", { next: now + waitMs });
      await this.schedule();
    }
    try {
      const res = await fetch(live, { signal: AbortSignal.timeout(7_000), redirect: "manual" });
      if (!res.ok) throw new Error("Live endpoint unavailable");
      const body = await res.json();
      if (body.status !== "ok" || !/^[a-f0-9]{40}$/.test(body.release ?? "")) throw new Error("Invalid live receipt");
      if (job.expected_release && job.expected_release !== body.release) throw new Error("Live commit mismatch");
      this.change(job.id, "done", { release: body.release, runId: job.run_id });
    } catch {
      const attempts = job.attempts + 1;
      if (attempts >= 4) this.change(job.id, "failed", { issue: "live_verification_failed", runId: job.run_id });
      else this.sql.exec("UPDATE jobs SET attempts=?,next_at=? WHERE id=?", attempts, Date.now() + backoff(attempts), job.id);
    }
  }

  github(path, init = {}) {
    return fetch(git + path, {
      ...init, redirect: "manual", signal: AbortSignal.timeout(8_000),
      headers: {
        Authorization: "Bearer " + this.env.GITHUB_ACTIONS_TOKEN,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "Nathan-AI-Conductor",
        "X-GitHub-Api-Version": "2026-03-10"
      }
    });
  }

  async mirrorEvents() {
    const events = this.sql.exec(`
      SELECT * FROM events WHERE next_export>0 AND next_export<=?
      ORDER BY created_at LIMIT 8
    `, Date.now()).toArray();
    for (const e of events) {
      try {
        await this.env.LEDGER.prepare(`
          INSERT OR IGNORE INTO conductor_events(event_id,job_id,event,created_at,details)
          VALUES (?,?,?,?,?)
        `).bind(e.id, e.job_id, e.event, e.created_at, e.details).run();
        await this.env.AUDIT.put("events/" + e.id + ".json", JSON.stringify({
          id: e.id, job_id: e.job_id, event: e.event, created_at: e.created_at,
          details: JSON.parse(e.details)
        }), {
          onlyIf: { etagDoesNotMatch: "*" },
          httpMetadata: { contentType: "application/json" }
        });
        this.sql.exec("UPDATE events SET next_export=0 WHERE id=?", e.id);
      } catch {
        console.warn(JSON.stringify({ component: "conductor", event: "audit_peer_retry", id: e.id }));
        this.sql.exec("UPDATE events SET attempts=attempts+1,next_export=? WHERE id=?",
          Date.now() + backoff(e.attempts + 1), e.id);
      }
    }
  }
}
