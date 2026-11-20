/** Pure keyboard-event guard for opt-in Track Baller viewport shortcuts.
 * Prevents navigation keys from stealing text entry, modifier shortcuts or IME input.
 * This module does not attach listeners or modify the DOM.
 */
import { keyboardViewportFrame } from './keyboard-viewport.mjs';

export function guardedKeyboardViewportFrame(previous, event, options = {}) {
  if (!event || typeof event !== 'object' || typeof event.key !== 'string') throw new TypeError('keyboard event with key required');
  const { tagName = '', isContentEditable = false, role = '' } = event;
  if (typeof tagName !== 'string' || typeof role !== 'string' || typeof isContentEditable !== 'boolean') throw new TypeError('invalid focus metadata');
  const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName.toUpperCase()) || isContentEditable || ['textbox', 'searchbox', 'combobox', 'spinbutton'].includes(role.toLowerCase());
  const blocked = editing || event.isComposing === true || event.ctrlKey === true || event.metaKey === true || event.altKey === true || event.shiftKey === true;
  // Validate viewport and options even for ignored keys; preserve immutable snapshots.
  const frame = keyboardViewportFrame(previous, blocked ? '__blocked__' : event.key, options);
  return Object.freeze({ ...frame, blockedByFocus: blocked });
}
