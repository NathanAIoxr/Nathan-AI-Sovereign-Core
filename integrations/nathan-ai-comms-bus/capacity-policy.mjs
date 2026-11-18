// Deterministic planning functions. Not a substitute for account-level billing metrics.
export const DEFAULT_POLICY = Object.freeze({
  schedulerCron: "* * * * *",
  tickEveryMinutes: 5,
  heartbeatEveryMinutes: 15,
  localQueueMessagesPerDay: 200,
  telemetryRetentionDays: 30,
  reserveFraction: 0.05,
  workerRequestsPerMonth: 10_000_000,
  workerCpuMsPerMonth: 30_000_000,
  queueOperationsPerMonth: 1_000_000,
  kvReadsPerMonth: 10_000_000,
  kvWritesPerMonth: 1_000_000,
  d1RowsReadPerMonth: 25_000_000_000,
  d1RowsWrittenPerMonth: 50_000_000,
});

export function scheduleActions(timestampMs) {
  const d = new Date(timestampMs);
  if (!Number.isFinite(d.valueOf())) throw new TypeError("Invalid schedule timestamp");
  const m = d.getUTCMinutes();
  return {
    cron_invoked: true,
    sample: m % DEFAULT_POLICY.tickEveryMinutes === 0,
    heartbeat: m % DEFAULT_POLICY.heartbeatEveryMinutes === 0,
  };
}

export function monthlyPacing({
  days = 30,
  reserveFraction = DEFAULT_POLICY.reserveFraction,
} = {}) {
  if (!Number.isInteger(days) || days < 28 || days > 31) throw new RangeError("Invalid month length");
  if (!Number.isFinite(reserveFraction) || reserveFraction < 0 || reserveFraction >= 1) {
    throw new RangeError("Invalid reserve fraction");
  }
  const minutes = days * 24 * 60;
  const available = 1 - reserveFraction;
  return {
    basis: "hypothetical_even_month; NOT observed account consumption",
    days,
    minutes,
    reserveFraction,
    workerRequestAveragePerMinute: Math.floor(DEFAULT_POLICY.workerRequestsPerMonth * available / minutes),
    workerCpuMsAveragePerMinute: Math.floor(DEFAULT_POLICY.workerCpuMsPerMonth * available / minutes),
    totalWorkerRequestsIncluded: DEFAULT_POLICY.workerRequestsPerMonth,
    totalWorkerCpuMsIncluded: DEFAULT_POLICY.workerCpuMsPerMonth,
    queueOperationsIncluded: DEFAULT_POLICY.queueOperationsPerMonth,
    // One small message generally counts as write/read/delete; retries or >64kB cost more.
    approximateDeliveredQueueMessagesIncluded: Math.floor(DEFAULT_POLICY.queueOperationsPerMonth / 3),
  };
}

export function parseLocalQuota(raw, fallback = DEFAULT_POLICY.localQueueMessagesPerDay) {
  const value = raw === undefined || raw === null || raw === "" ? fallback : Number(raw);
  if (!Number.isSafeInteger(value) || value < 1 || value > 2000) {
    throw new RangeError("Local message quota must be an integer 1..2000");
  }
  return value;
}
