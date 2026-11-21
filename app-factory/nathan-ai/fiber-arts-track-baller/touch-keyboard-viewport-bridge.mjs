/** Opt-in one-way synchronization of simulated touch viewport frames into keyboard navigation.
 * Does not modify the pinch controller or claim calibrated yarn physics.
 */
export function bridgeTouchToKeyboard(keyboardController, onViewportFrame = () => {}, { suppressUnchanged = false } = {}) {
  if (!keyboardController || typeof keyboardController.syncFrame !== 'function' || typeof keyboardController.getFrame !== 'function')
    throw new TypeError('keyboard controller with syncFrame/getFrame required');
  if (typeof onViewportFrame !== 'function') throw new TypeError('viewport callback required');
  if (typeof suppressUnchanged !== 'boolean') throw new TypeError('suppressUnchanged must be boolean');
  let active = true;
  const sameOrientation = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== 4 || b.length !== 4) return false;
    if (a.every((v, i) => Object.is(v, b[i]))) return true;
    // Unit quaternions q and -q encode the same 3D rotation.
    return a.every((v, i) => typeof v === 'number' && Number.isFinite(v) &&
      typeof b[i] === 'number' && Number.isFinite(b[i]) && v === -b[i]);
  };
  return Object.freeze({
    onTouchFrame(frame) {
      if (!active) return false;
      // Snapshot before syncFrame: some controllers mutate and return the same frame object.
      const current = suppressUnchanged ? keyboardController.getFrame() : null;
      const previous = current && typeof current === 'object'
        ? Object.fromEntries(Object.entries(current).map(([key, value]) =>
            [key, Array.isArray(value) ? value.slice() : value])) : current;
      const accepted = keyboardController.syncFrame(frame);
      if (!accepted) return false;
      const next = keyboardController.getFrame();
      if (suppressUnchanged && previous && next &&
          Object.keys(previous).length === Object.keys(next).length &&
          Object.keys(previous).every(key => key === 'orientation'
            ? sameOrientation(previous[key], next[key])
            : Object.is(previous[key], next[key]))) return true;
      onViewportFrame(next);
      return true;
    },
    dispose() { active = false; }
  });
}
