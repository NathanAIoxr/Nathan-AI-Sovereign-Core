import { keyboardViewportFrame } from './keyboard-viewport.mjs';
import { isInteractiveKeyboardTarget } from './keyboard-focus-path.mjs';

/** Opt-in keyboard viewport controller for simulated Track Baller navigation. */
export function attachKeyboardViewportListener(element, initialFrame, onFrame, { enabled = false, frameOptions = {} } = {}) {
  if (!element || typeof element.addEventListener !== 'function' || typeof element.removeEventListener !== 'function') throw new TypeError('event target required');
  if (typeof enabled !== 'boolean' || typeof onFrame !== 'function') throw new TypeError('invalid controller options');
  if (!frameOptions || typeof frameOptions !== 'object' || Array.isArray(frameOptions)) throw new TypeError('frameOptions must be an object');
  let current = keyboardViewportFrame(initialFrame, 'Unrecognized', frameOptions);
  let active = true;
  let allowed = enabled;
  function keydown(event) {
    if (!active || !allowed || !event || event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || isInteractiveKeyboardTarget(event)) return;
    const next = keyboardViewportFrame(current, event.key, frameOptions);
    if (!next.handled) return;
    event.preventDefault?.();
    if (onFrame(next, event) !== false) current = next;
  }
  element.addEventListener('keydown', keydown);
  return Object.freeze({
    getFrame() { return current; },
    setEnabled(value) { if (typeof value !== 'boolean') throw new TypeError('enabled must be boolean'); if (!active) return false; allowed = value; return true; },
    dispose() { if (!active) return; active = false; element.removeEventListener('keydown', keydown); }
  });
}
