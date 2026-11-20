/** Opt-in adapter from symbolic strand announcements to an existing ARIA live region.
 * The caller owns the DOM element; this module never creates or inserts nodes.
 */
import { createStrandSelectionAnnouncer } from './strand-selection-announcer.mjs';

export function createStrandAriaLiveRegion({ region, labels = {}, enabled = false } = {}) {
  if (!region || typeof region.setAttribute !== 'function' || !('textContent' in region)) {
    throw new TypeError('existing live region required');
  }
  if (typeof enabled !== 'boolean') throw new TypeError('enabled must be boolean');
  let disposed = false;
  let active = enabled;
  const announcer = createStrandSelectionAnnouncer({ labels, announce(message) {
    if (disposed || !active) return;
    region.textContent = message;
  }});
  if (region.getAttribute?.('aria-live') == null) region.setAttribute('aria-live', 'polite');
  if (region.getAttribute?.('aria-atomic') == null) region.setAttribute('aria-atomic', 'true');
  return Object.freeze({
    onSelection(selection) {
      if (disposed || !active) return false;
      return announcer.onSelection(selection);
    },
    setEnabled(value) {
      if (typeof value !== 'boolean') throw new TypeError('enabled must be boolean');
      if (disposed) return false;
      active = value;
      return true;
    },
    dispose() { disposed = true; active = false; announcer.dispose(); }
  });
}
