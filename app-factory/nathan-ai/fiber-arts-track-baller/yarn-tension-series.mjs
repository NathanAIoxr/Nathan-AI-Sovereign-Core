/** Read-only illustrative tension samples for a viewport; never measured yarn physics. */
import { simulateYarnTension } from './yarn-tension-simulator.mjs';

export function simulateYarnTensionSeries({ lengthsMm, restLengthMm, stiffnessNPerMm, maxTensionN = 20, maxSamples = 256 }) {
  if (!Array.isArray(lengthsMm) || lengthsMm.length > maxSamples || !Number.isSafeInteger(maxSamples) || maxSamples < 1 || maxSamples > 4096) {
    throw new RangeError('lengthsMm must be an array within the bounded sample limit');
  }
  const samples = lengthsMm.map((stretchMm, index) => Object.freeze({
    index,
    ...simulateYarnTension({ stretchMm, restLengthMm, stiffnessNPerMm, maxTensionN })
  }));
  return Object.freeze({ simulated: true, verifiedPhysics: false, model: 'linear-spring-illustration-v1', samples: Object.freeze(samples) });
}
