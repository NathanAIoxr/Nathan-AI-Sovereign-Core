import { selectStrand } from './strand-selection.mjs';
import { describeFiberAction } from './accessibility.mjs';

/** Pure viewport adapter; no DOM, speech, network, or physical yarn calibration. */
export function resolveStrandInteraction(strands, point, options = {}) {
  const selection = selectStrand(strands, point, options);
  return Object.freeze({
    selectedStrandId: selection?.id ?? null,
    announcement: describeFiberAction({ type: 'strand', id: selection?.id ?? null }),
    distance: selection?.distance ?? null,
  });
}
