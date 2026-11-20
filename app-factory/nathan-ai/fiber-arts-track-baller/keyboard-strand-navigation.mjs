import { isInteractiveKeyboardTarget } from './keyboard-focus-path.mjs';
/** Opt-in keyboard navigation for symbolic strands. Does not modify craft data. */
export function attachKeyboardStrandNavigation(element, strands, onSelection) {
  if (!element || typeof element.addEventListener !== 'function' || typeof element.removeEventListener !== 'function') throw new TypeError('event target required');
  if (!Array.isArray(strands) || strands.some(s => !s || typeof s.id !== 'string' || !s.id) || new Set(strands.map(s => s.id)).size !== strands.length) throw new TypeError('unique strand ids required');
  if (typeof onSelection !== 'function') throw new TypeError('onSelection callback required');
  const ids = strands.map(s => s.id);
  let index = -1, active = true;
  function keydown(event) {
    if (!active || event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (isInteractiveKeyboardTarget(event)) return;
    if (!ids.length) return;
    let next = index;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % ids.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index < 0 ? ids.length - 1 : (index - 1 + ids.length) % ids.length);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = ids.length - 1;
    else if (event.key === 'Enter' || event.key === ' ') {
      if (index < 0) return;
      event.preventDefault?.();
      onSelection(Object.freeze({id: ids[index], index, source:'keyboard', activated:true}), event);
      return;
    } else return;
    event.preventDefault?.();
    index = next;
    onSelection(Object.freeze({id:ids[index],index,source:'keyboard',activated:false}), event);
  }
  element.addEventListener('keydown', keydown);
  return Object.freeze({
    getSelectedId() { return active && index >= 0 ? ids[index] : null; },
    dispose() { if (active) { active = false; element.removeEventListener('keydown', keydown); } }
  });
}
