/** Opt-in one-way synchronization of simulated touch viewport frames into keyboard navigation.
 * Does not modify the pinch controller or claim calibrated yarn physics.
 */
export function bridgeTouchToKeyboard(keyboardController, onViewportFrame = () => {}, { suppressUnchanged = false, requireUnitQuaternion = false, rejectInvalidQuaternion = false } = {}) {
  if (!keyboardController || typeof keyboardController.syncFrame !== 'function' || typeof keyboardController.getFrame !== 'function')
    throw new TypeError('keyboard controller with syncFrame/getFrame required');
  if (typeof onViewportFrame !== 'function') throw new TypeError('viewport callback required');
  if (typeof suppressUnchanged !== 'boolean') throw new TypeError('suppressUnchanged must be boolean');
  if (typeof requireUnitQuaternion !== 'boolean') throw new TypeError('requireUnitQuaternion must be boolean');
  if (typeof rejectInvalidQuaternion !== 'boolean') throw new TypeError('rejectInvalidQuaternion must be boolean');
  let active = true;
  let acceptedFrames = 0;
  let rejectedFrames = 0;
  let publishedFrames = 0;
  const sameOrientation = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== 4 || b.length !== 4) return false;
    // Optional strict guard: only normalized finite orientations may be sign-equivalent.
    if (requireUnitQuaternion) {
      const unit = q => q.every(v => typeof v === 'number' && Number.isFinite(v)) &&
        Math.abs(q.reduce((sum, v) => sum + v * v, 0) - 1) <= 1e-6;
      if (!unit(a) || !unit(b)) return false;
    }
    // Non-finite values (including NaN) must never be treated as stable rotations.
    if (![...a, ...b].every(v => typeof v === 'number' && Number.isFinite(v))) return false;
    if (a.every((v, i) => Object.is(v, b[i]))) return true;
    // Unit quaternions q and -q encode the same 3D rotation.
    return a.every((v, i) => typeof v === 'number' && Number.isFinite(v) &&
      typeof b[i] === 'number' && Number.isFinite(b[i]) && v === -b[i]);
  };
  return Object.freeze({
    onTouchFrame(frame) {
      if (!active) return false;
      // Optional ingress validation: reject malformed orientations before controller mutation.
      if (rejectInvalidQuaternion && (!frame || !Array.isArray(frame.orientation) ||
          frame.orientation.length !== 4 || !frame.orientation.every(v => typeof v === 'number' && Number.isFinite(v)) ||
          Math.abs(frame.orientation.reduce((sum, v) => sum + v * v, 0) - 1) > 1e-6)) {
        rejectedFrames++;
        return false;
      }
      // Snapshot before syncFrame: some controllers mutate and return the same frame object.
      const current = suppressUnchanged ? keyboardController.getFrame() : null;
      const previous = current && typeof current === 'object'
        ? Object.fromEntries(Object.entries(current).map(([key, value]) =>
            [key, Array.isArray(value) ? value.slice() : value])) : current;
      const accepted = keyboardController.syncFrame(frame);
      if (!accepted) { rejectedFrames++; return false; }
      acceptedFrames++;
      const next = keyboardController.getFrame();
      if (suppressUnchanged && previous && next &&
          Object.keys(previous).length === Object.keys(next).length &&
          Object.keys(previous).every(key => key === 'orientation'
            ? sameOrientation(previous[key], next[key])
            : Object.is(previous[key], next[key]))) return true;
      publishedFrames++;
      onViewportFrame(next);
      return true;
    },
    getMetrics() { return Object.freeze({ acceptedFrames, rejectedFrames, publishedFrames, active }); },
    dispose() { active = false; }
  });
}
