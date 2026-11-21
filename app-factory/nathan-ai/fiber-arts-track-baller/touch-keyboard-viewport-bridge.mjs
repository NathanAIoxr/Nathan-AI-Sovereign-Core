/** Opt-in one-way synchronization of simulated touch viewport frames into keyboard navigation.
 * Does not modify the pinch controller or claim calibrated yarn physics.
 */
export function bridgeTouchToKeyboard(keyboardController, onViewportFrame = () => {}) {
  if (!keyboardController || typeof keyboardController.syncFrame !== 'function' || typeof keyboardController.getFrame !== 'function')
    throw new TypeError('keyboard controller with syncFrame/getFrame required');
  if (typeof onViewportFrame !== 'function') throw new TypeError('viewport callback required');
  let active = true;
  return Object.freeze({
    onTouchFrame(frame) {
      if (!active) return false;
      const accepted = keyboardController.syncFrame(frame);
      if (!accepted) return false;
      onViewportFrame(keyboardController.getFrame());
      return true;
    },
    dispose() { active = false; }
  });
}
