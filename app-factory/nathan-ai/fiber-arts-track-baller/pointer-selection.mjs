import { resolveTopologySelection } from './topology-selection.mjs';

/** Normalize a primary pointer event into local viewport coordinates.
 * Caller supplies viewport bounds; no DOM access or physical calibration.
 */
export function pointerToViewport(event, bounds) {
  if (!event || !bounds || typeof event !== 'object' || typeof bounds !== 'object')
    throw new TypeError('pointer event and bounds are required');
  const { clientX, clientY, isPrimary, pointerType } = event;
  const { left, top, width, height } = bounds;
  if (![clientX, clientY, left, top, width, height].every(Number.isFinite) || width <= 0 || height <= 0)
    throw new RangeError('finite pointer coordinates and positive viewport dimensions required');
  if (isPrimary === false || !['mouse', 'touch', 'pen'].includes(pointerType)) return null;
  const x = clientX - left;
  const y = clientY - top;
  if (x < 0 || y < 0 || x > width || y > height) return null;
  return Object.freeze({ x, y });
}

/** Opt-in adapter: no event listeners, speech, mutation or network side effects. */
export function selectTopologyAtPointer(strands, event, bounds, braidWord, options = {}) {
  const point = pointerToViewport(event, bounds);
  if (point === null) return Object.freeze({ ignored: true, reason: 'non-primary, unsupported or outside viewport', simulation: 'symbolic-only' });
  return resolveTopologySelection(strands, point, braidWord, options);
}
