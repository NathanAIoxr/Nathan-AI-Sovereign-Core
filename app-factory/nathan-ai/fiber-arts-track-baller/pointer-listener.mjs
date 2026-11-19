import { pointerToViewport } from './pointer-selection.mjs';

/** Explicitly attach primary-pointer selection to a supplied viewport element.
 * Caller controls the selection callback and must call dispose when finished.
 * No network, speech, fulfillment or physics side effects.
 */
export function attachPointerSelection(element, onSelect) {
  if (!element || typeof element.addEventListener !== 'function' || typeof element.removeEventListener !== 'function' || typeof element.getBoundingClientRect !== 'function')
    throw new TypeError('element must support pointer events and viewport bounds');
  if (typeof onSelect !== 'function') throw new TypeError('onSelect must be a function');
  let active = true;
  function onPointerUp(event) {
    if (!active || event?.button > 0) return;
    const point = pointerToViewport(event, element.getBoundingClientRect());
    if (point !== null) onSelect(point, event);
  }
  element.addEventListener('pointerup', onPointerUp);
  return Object.freeze({ dispose() {
    if (!active) return;
    active = false;
    element.removeEventListener('pointerup', onPointerUp);
  } });
}
