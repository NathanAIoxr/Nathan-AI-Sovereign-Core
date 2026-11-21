/** Opt-in one-way synchronization of simulated touch viewport frames into keyboard navigation.
 * Does not modify the pinch controller or claim calibrated yarn physics.
 */
export function bridgeTouchToKeyboard(keyboardController, onViewportFrame = () => {}, { suppressUnchanged = false } = {}) {
  if (!keyboardController || typeof keyboardController.syncFrame !== 'function' || typeof keyboardController.getFrame !== 'function')
    throw new TypeError('keyboard controller with syncFrame/getFrame required');
  if (typeof onViewportFrame !== 'function') throw new TypeError('viewport callback required');
  if (typeof suppressUnchanged !== 'boolean') throw new TypeError('suppressUnchanged must be boolean');
  let active = true;
  return Object.freeze({
    onTouchFrame(frame) {
      if (!active) return false;
      const previous = suppressUnchanged ? keyboardController.getFrame() : null;
      const accepted = keyboardController.syncFrame(frame);
      if (!accepted) return false;
      const next = keyboardController.getFrame();
      if (suppressUnchanged && previous && next &&
          Object.keys(previous).length === Object.keys(next).length &&
          Object.keys(previous).every(key => key === 'orientation' && Array.isArray(previous[key]) && Array.isArray(next[key])\n            ? previous[key].length === next[key].length && previous[key].every((value, index) => Object.is(value, next[key][index]))\n            : Object.is(previous[key], next[key]))) return true;
      onViewportFrame(next);
      return true;
    },
    dispose() { active = false; }
  });
}
