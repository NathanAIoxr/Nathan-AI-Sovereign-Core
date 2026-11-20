import { limitViewportMotion } from './reduced-motion-viewport.mjs';

/** Apply the existing accessibility guard to a simulated gesture frame.
 * No measured yarn physics or persistent user settings are implied.
 */
export function applyAccessibleGestureFrame(previous, proposed, options = {}) {
  const { reducedMotion = false, ...limits } = options;
  if (typeof reducedMotion !== 'boolean') throw new TypeError('reducedMotion must be boolean');
  const next = limitViewportMotion(previous, proposed, { ...limits, reducedMotion });
  const orientation = next.orientation;
  return Object.freeze({
    ...next,
    ...(Array.isArray(orientation) ? { orientation: Object.freeze([...orientation]) } : {}),
    simulated: true,
    verifiedPhysics: false,
    reducedMotionApplied: reducedMotion,
  });
}
