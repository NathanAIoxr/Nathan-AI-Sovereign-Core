import { attachSwipePointerSession } from './swipe-pointer-session.mjs';

/** Opt-in swipe navigation over symbolic strand IDs; simulated UI, not yarn physics. */
export function attachSwipeStrandNavigation(element, strands, onSelection, options = {}) {
  if (!Array.isArray(strands) || strands.some(s => !s || typeof s.id !== 'string' || !s.id) || new Set(strands.map(s => s.id)).size !== strands.length) throw new TypeError('unique strand ids required');
  if (typeof onSelection !== 'function') throw new TypeError('onSelection callback required');
  const ids = strands.map(s => s.id);
  let index = -1;
  let disposed = false;
  const session = attachSwipePointerSession(element, frame => {
    if (disposed || !ids.length) return;
    const delta = frame.direction === 'left' || frame.direction === 'up' ? -1 : 1;
    index = index < 0 ? (delta > 0 ? 0 : ids.length - 1) : (index + delta + ids.length) % ids.length;
    onSelection(Object.freeze({ id: ids[index], index, source: 'swipe', direction: frame.direction, simulated: true }));
  }, options);
  return Object.freeze({
    getSelectedId() { return !disposed && index >= 0 ? ids[index] : null; },
    dispose() { if (disposed) return; disposed = true; session.dispose(); }
  });
}
