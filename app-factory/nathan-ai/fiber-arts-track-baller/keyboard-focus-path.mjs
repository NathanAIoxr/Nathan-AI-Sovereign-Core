/** Guard strand keyboard shortcuts when an event originates inside another control. */
const BLOCKED_TAGS = new Set(['input','textarea','select','button','a','summary','option']);
const BLOCKED_ROLES = new Set(['textbox','searchbox','combobox','spinbutton','button','link','menuitem','checkbox','radio','slider','switch','tab','treeitem','option']);
export function isInteractiveKeyboardTarget(event) {
  if (!event || typeof event !== 'object') throw new TypeError('keyboard event required');
  const path = typeof event.composedPath === 'function' ? event.composedPath() : null;
  const nodes = Array.isArray(path) && path.length ? path : (() => {
    const out = []; let node = event.target;
    for (let i = 0; node && i < 32; i++, node = node.parentElement ?? node.parentNode) out.push(node);
    return out;
  })();
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue;
    const tag = typeof node.tagName === 'string' ? node.tagName.toLowerCase() : '';
    const role = node.getAttribute?.('role') ?? node.role;
    if (node.isContentEditable || BLOCKED_TAGS.has(tag) || BLOCKED_ROLES.has(typeof role === 'string' ? role.toLowerCase() : '')) return true;
    if (node.getAttribute?.('contenteditable') === 'true') return true;
  }
  return false;
}
