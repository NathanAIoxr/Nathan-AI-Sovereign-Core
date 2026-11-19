/** Opt-in bridge for attachTopologyPointerSelection and createStrandAnnouncer.
 * Pure callback wiring: no DOM ownership, speech, network, or yarn physics.
 */
export function createSelectionAnnouncementBridge(announcer, onSelection = () => {}) {
  if (!announcer || typeof announcer.announce !== 'function')
    throw new TypeError('announcer must expose announce(selection)');
  if (typeof onSelection !== 'function')
    throw new TypeError('onSelection must be a function');
  let active = true;
  return Object.freeze({
    onSelection(selection, event) {
      if (!active) return false;
      // Do not announce when a consumer callback rejects the selection.
      const accepted = onSelection(selection, event);
      if (accepted === false) return false;
      return announcer.announce(selection) === true;
    },
    dispose() { active = false; }
  });
}
