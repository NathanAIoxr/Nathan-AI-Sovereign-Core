import { validateBraidWord, reduceBraidWord } from './topology.mjs';

/** Immutable symbolic braid snapshots for step-by-step craft playback.
 * This is algebraic simulation, not measured yarn tension or collision physics.
 */
export function replayBraidWord(word, { maxCrossings = 10000 } = {}) {
  const { crossings } = validateBraidWord(word, { maxCrossings });
  const steps = crossings.map((crossing, index) => {
    const prefix = crossings.slice(0, index + 1);
    const reduced = reduceBraidWord(prefix);
    return Object.freeze({
      step: index + 1,
      crossing,
      reducedCrossings: Object.freeze([...reduced]),
      announcement: `Step ${index + 1}: strand ${crossing.strand} crosses ${crossing.parity === 1 ? 'over' : 'under'} strand ${crossing.strand + 1}`,
    });
  });
  return Object.freeze({ totalSteps: steps.length, steps: Object.freeze(steps) });
}
