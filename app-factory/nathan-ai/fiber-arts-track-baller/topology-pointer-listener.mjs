import { attachPointerSelection } from './pointer-listener.mjs';
import { resolveTopologySelection } from './topology-selection.mjs';

/** Explicit opt-in wiring of viewport pointerup to symbolic topology selection.
 * No automatic speech, network calls, fulfillment, or physical yarn claims.
 */
export function attachTopologyPointerSelection(element, strands, braidWord, onSelection, options = {}) {
  if (typeof onSelection !== 'function') throw new TypeError('onSelection must be a function');
  if (!Array.isArray(strands) || !Array.isArray(braidWord)) throw new TypeError('strands and braidWord must be arrays');
  return attachPointerSelection(element, (point, event) => {
    const result = resolveTopologySelection(strands, point, braidWord, options);
    onSelection(result, event);
  });
}
