import { attachKeyboardStrandNavigation } from './keyboard-strand-navigation.mjs';

/** Opt-in keyboard-to-live-region bridge. Symbolic strand IDs only; no yarn physics or network calls. */
export function attachAccessibleKeyboardStrands(element, strands, announcer, onSelection = () => {}) {
  if (!announcer || typeof announcer.announce !== 'function') throw new TypeError('announcer required');
  if (typeof onSelection !== 'function') throw new TypeError('onSelection callback required');
  let active = true;
  const navigation = attachKeyboardStrandNavigation(element, strands, (selection, event) => {
    if (!active) return;
    const accepted = onSelection(selection, event);
    if (accepted !== false) announcer.announce(selection);
  });
  return Object.freeze({
    getSelectedId: () => navigation.getSelectedId(),
    dispose() { if (!active) return; active = false; navigation.dispose(); }
  });
}
