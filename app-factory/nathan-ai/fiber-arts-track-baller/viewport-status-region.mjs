import { describeViewportForAccessibility } from './viewport-accessibility.mjs';

/** Opt-in, read-only status reporting for simulated Track Baller viewport frames. */
export function attachViewportStatusRegion(region, { restoreTextOnDispose = false } = {}) {
  if (!region || typeof region.setAttribute !== 'function' ||
      typeof region.getAttribute !== 'function' ||
      typeof region.removeAttribute !== 'function' || !('textContent' in region)) {
    throw new TypeError('region must support accessible status attributes and text');
  }
  if (typeof restoreTextOnDispose !== 'boolean') throw new TypeError('restoreTextOnDispose must be boolean');
  const originalText = region.textContent;
  const attributes = ['role', 'aria-live', 'aria-atomic'];
  const original = attributes.map(name => [name, region.getAttribute(name)]);
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  let active = true;
  let last = null;
  return Object.freeze({
    update(frame) {
      if (!active) return false;
      const description = describeViewportForAccessibility(frame);
      if (description === last) return false;
      region.textContent = description;
      last = description;
      return true;
    },
    dispose() {
      if (!active) return;
      active = false;
      for (const [name, value] of original) {
        if (value === null) region.removeAttribute(name);
        else region.setAttribute(name, value);
      }
      if (restoreTextOnDispose) region.textContent = originalText;
    }
  });
}
