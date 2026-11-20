/** Illustrative yarn tension estimator; NOT measured yarn physics. No external effects. */
export function simulateYarnTension({ stretchMm, restLengthMm, stiffnessNPerMm, maxTensionN = 20 }) {
  for (const [name, value] of Object.entries({ stretchMm, restLengthMm, stiffnessNPerMm, maxTensionN })) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and nonnegative`);
  }
  if (restLengthMm <= 0 || maxTensionN <= 0) throw new RangeError('length and cap must be positive');
  const extensionMm = Math.max(0, stretchMm - restLengthMm);
  const rawTensionN = extensionMm * stiffnessNPerMm;
  const tensionN = Math.min(maxTensionN, rawTensionN);
  return Object.freeze({ simulated: true, verifiedPhysics: false, model: 'linear-spring-illustration-v1', extensionMm, tensionN, capped: rawTensionN > maxTensionN });
}
