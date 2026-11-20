import { attachKeyboardStrandNavigation } from './keyboard-strand-navigation.mjs';
import { createStrandAriaLiveRegion } from './strand-aria-live-region.mjs';

/** Opt-in keyboard strand navigation with an existing ARIA live region.
 * No DOM insertion, persistence, network calls, or physical yarn calibration.
 */
export function attachKeyboardAriaSelection(element, strands, region, { enabled = false, labels = {}, onSelection = () => {} } = {}) {
  if (typeof enabled !== 'boolean') throw new TypeError('enabled must be boolean');
  if (typeof onSelection !== 'function') throw new TypeError('onSelection callback required');
  const live = createStrandAriaLiveRegion({ region, labels, enabled });
  let disposed = false;
  let navigationEnabled = enabled;
  let navigation;
  try {
    navigation = attachKeyboardStrandNavigation(element, strands, (selection, event) => {
      if (disposed) return;
      if (onSelection(selection, event) === false) return false;
      live.onSelection(selection);
      return true;
    }, { isEnabled: () => !disposed && navigationEnabled });
  } catch (error) {
    live.dispose();
    throw error;
  }
  return Object.freeze({
    getSelectedId() { return disposed ? null : navigation.getSelectedId(); },
    setEnabled(value) {
      if (typeof value !== 'boolean') throw new TypeError('enabled must be boolean');
      if (disposed) return false;
      const updated = live.setEnabled(value);
      if (updated) navigationEnabled = value;
      return updated;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      navigation.dispose();
      live.dispose();
    }
  });
}
