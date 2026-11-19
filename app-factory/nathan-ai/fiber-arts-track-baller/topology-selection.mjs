import { validateBraidWord } from './topology.mjs';
import { resolveStrandInteraction } from './selection-controller.mjs';

/** Connects viewport strand IDs to symbolic braid positions. No yarn physics implied.
 * Explicit one-based indices prevent accidental ordering assumptions.
 */
export function resolveTopologySelection(strands, point, braidWord, options = {}) {
  const topology = validateBraidWord(braidWord, { maxCrossings: options.maxCrossings ?? 10000 });
  if (!Array.isArray(strands)) throw new TypeError('strands must be an array');
  const byId = new Map();
  const indices = new Set();
  for (const strand of strands) {
    if (!strand || typeof strand.id !== 'string' || !strand.id ||
        !Number.isSafeInteger(strand.braidIndex) || strand.braidIndex < 1 ||
        byId.has(strand.id) || indices.has(strand.braidIndex)) {
      throw new TypeError('strand IDs and positive braid indices must be unique');
    }
    byId.set(strand.id, strand.braidIndex);
    indices.add(strand.braidIndex);
  }
  for (let index = 1; index <= topology.minimumStrands; index++) {
    if (!indices.has(index)) throw new RangeError('braid strand mapping is incomplete');
  }
  const selected = resolveStrandInteraction(strands, point, { radius: options.radius });
  const braidIndex = selected.selectedStrandId === null ? null : byId.get(selected.selectedStrandId);
  const crossings = braidIndex === null ? [] : topology.crossings.flatMap((crossing, index) =>
    crossing.strand === braidIndex || crossing.strand + 1 === braidIndex ? [index + 1] : []);
  return Object.freeze({ ...selected, braidIndex, crossingSteps: Object.freeze(crossings),
    simulation: 'symbolic-only' });
}
