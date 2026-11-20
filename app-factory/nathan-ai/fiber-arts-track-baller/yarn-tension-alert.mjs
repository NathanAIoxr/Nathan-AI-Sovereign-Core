/** Optional, read-only simulated tension advisory; not a physical safety limit. */
export function summarizeSimulatedTension(series, { advisoryThresholdN = 5 } = {}) {
  if (!series || series.simulated !== true || series.verifiedPhysics !== false || !Array.isArray(series.samples) || series.samples.length > 4096) {
    throw new TypeError('a bounded simulated tension series is required');
  }
  if (!Number.isFinite(advisoryThresholdN) || advisoryThresholdN <= 0) throw new RangeError('advisoryThresholdN must be positive and finite');
  let peakN = 0;
  let aboveThresholdCount = 0;
  let cappedCount = 0;
  for (const sample of series.samples) {
    if (!sample || sample.simulated !== true || sample.verifiedPhysics !== false || !Number.isFinite(sample.tensionN) || sample.tensionN < 0 || typeof sample.capped !== 'boolean') {
      throw new TypeError('invalid simulated tension sample');
    }
    peakN = Math.max(peakN, sample.tensionN);
    if (sample.tensionN > advisoryThresholdN) aboveThresholdCount++;
    if (sample.capped) cappedCount++;
  }
  return Object.freeze({ simulated: true, verifiedPhysics: false, advisoryOnly: true, sampleCount: series.samples.length, peakN, aboveThresholdCount, cappedCount, advisoryThresholdN });
}
