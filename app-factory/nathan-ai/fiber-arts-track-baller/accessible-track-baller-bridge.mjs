import { bridgeTouchToKeyboard } from './touch-keyboard-viewport-bridge.mjs';
import { attachViewportStatusRegion } from './viewport-status-region.mjs';

/**
 * Opt-in accessible bridge for simulated craft viewport frames.
 * No DOM lookup, network request, or physical yarn calibration occurs here.
 */
export function connectAccessibleTrackBaller(keyboardController, statusRegion, onViewportFrame = () => {}, options = {}) {
  if (typeof onViewportFrame !== 'function') throw new TypeError('viewport callback required');
  const status = attachViewportStatusRegion(statusRegion);
  let bridge;
  try {
    bridge = bridgeTouchToKeyboard(keyboardController, frame => {
      status.update(frame);
      onViewportFrame(frame);
    }, options);
  } catch (error) {
    status.dispose();
    throw error;
  }
  let active = true;
  return Object.freeze({
    onTouchFrame(frame) { return active ? bridge.onTouchFrame(frame) : false; },
    getMetrics() { return bridge.getMetrics(); },
    dispose() {
      if (!active) return;
      active = false;
      bridge.dispose();
      status.dispose();
    }
  });
}
