import { attachSwipeStrandNavigation } from './swipe-strand-bridge.mjs';
import { createStrandAnnouncer } from './live-announcer.mjs';

/** Opt-in accessibility adapter for simulated swipe-based strand navigation. */
export function attachSwipeAnnouncementBridge(element, strands, region, onSelection = () => {}, options = {}) {
  if (typeof onSelection !== 'function') throw new TypeError('onSelection callback required');
  const announcer = createStrandAnnouncer(region);
  let disposed = false;
  let session;
  try {
    session = attachSwipeStrandNavigation(element, strands, selection => {
      if (disposed) return;
      const accepted = onSelection(selection);
      if (accepted !== false) announcer.announce(selection);
    }, options);
  } catch (error) {
    announcer.dispose();
    throw error;
  }
  return Object.freeze({
    getSelectedId() { return disposed ? null : session.getSelectedId(); },
    dispose() {
      if (disposed) return;
      disposed = true;
      session.dispose();
      announcer.dispose();
    }
  });
}
