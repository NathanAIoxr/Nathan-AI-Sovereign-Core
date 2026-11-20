/** Opt-in, pure preview: illustrative linear-spring calculations, never physical yarn measurements. */
import { simulateYarnTensionSeries } from './yarn-tension-series.mjs';
import { summarizeSimulatedTension } from './yarn-tension-alert.mjs';

export function previewYarnTensionAdvisory({ enabled = false, lengthsMm, restLengthMm, stiffnessNPerMm, maxTensionN = 20, advisoryThresholdN = 5, maxSamples = 256 } = {}) {
  if (enabled !== true) return Object.freeze({ enabled: false, simulated: true, verifiedPhysics: false, advisoryOnly: true, series: null, advisory: null });
  const series = simulateYarnTensionSeries({ lengthsMm, restLengthMm, stiffnessNPerMm, maxTensionN, maxSamples });
  const advisory = summarizeSimulatedTension(series, { advisoryThresholdN });
  return Object.freeze({ enabled: true, simulated: true, verifiedPhysics: false, advisoryOnly: true, series, advisory });
}
