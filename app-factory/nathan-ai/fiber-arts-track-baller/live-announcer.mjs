import { describeFiberAction } from './accessibility.mjs';

/** Opt-in accessible status updates. Caller owns the live region and cleanup. */
export function createStrandAnnouncer(region) {
  if (!region || typeof region.setAttribute !== 'function' || !('textContent' in region))
    throw new TypeError('region must support accessible text updates');
  const previous = {
    role: region.getAttribute('role'),
    live: region.getAttribute('aria-live'),
    atomic: region.getAttribute('aria-atomic')
  };
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  let active = true;
  return Object.freeze({
    announce(selection) {
      if (!active) return false;
      const id = selection?.selectedStrand?.id ?? selection?.strand?.id ?? selection?.id ?? null;
      region.textContent = describeFiberAction({ type: 'strand', id });
      return true;
    },
    dispose() {
      if (!active) return;
      active = false;
      for (const [name, value] of [['role', previous.role], ['aria-live', previous.live], ['aria-atomic', previous.atomic]]) {
        if (value === null) region.removeAttribute(name);
        else region.setAttribute(name, value);
      }
    }
  });
}
