/** Opt-in, DOM-agnostic accessible announcements for symbolic strand selection. */
export function createStrandSelectionAnnouncer({ announce, labels = {} } = {}) {
  if (typeof announce !== 'function') throw new TypeError('announce callback required');
  if (!labels || typeof labels !== 'object' || Array.isArray(labels)) throw new TypeError('labels object required');
  const safeLabels = Object.create(null);
  for (const [id, label] of Object.entries(labels)) {
    if (!id || typeof label !== 'string' || !label.trim() || label.length > 120) throw new TypeError('valid label required');
    safeLabels[id] = label.trim();
  }
  let disposed = false;
  return Object.freeze({
    onSelection(selection) {
      if (disposed) return false;
      if (selection?.cleared === true && selection.id === null && selection.index === -1 && selection.activated === false) {
        announce('Strand selection cleared');
        return true;
      }
      if (!selection || typeof selection.id !== 'string' || !selection.id || !Number.isSafeInteger(selection.index) || selection.index < 0 || typeof selection.activated !== 'boolean') throw new TypeError('valid selection required');
      const label = Object.hasOwn(safeLabels, selection.id) ? safeLabels[selection.id] : selection.id;
      const message = `${selection.activated ? 'Activated' : 'Selected'} strand ${label}`;
      announce(message);
      return true;
    },
    dispose() { disposed = true; }
  });
}
