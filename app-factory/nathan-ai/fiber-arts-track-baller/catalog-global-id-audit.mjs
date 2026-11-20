/** Additive, read-only global identifier check for fiber craft snapshots.
 * This does not establish that a production catalog has been located.
 */
import { auditFiberCatalog } from './catalog-integrity.mjs';

export function auditFiberGlobalIds(crafts) {
  const base = auditFiberCatalog(crafts);
  const errors = [...base.errors];
  if (Array.isArray(crafts)) {
    const seen = new Map();
    for (const [craftIndex, craft] of crafts.entries()) {
      if (!Array.isArray(craft?.steps)) continue;
      for (const [stepIndex, step] of craft.steps.entries()) {
        const id = step?.id;
        if (typeof id !== 'string' || !id.trim()) continue;
        const first = seen.get(id);
        if (first && first.craftIndex !== craftIndex) {
          errors.push(`step id ${JSON.stringify(id)} reused across crafts ${first.craftIndex} and ${craftIndex}`);
        } else if (!first) seen.set(id, { craftIndex, stepIndex });
      }
    }
  }
  return Object.freeze({ ok: errors.length === 0, craftCount: base.craftCount, stepCount: base.stepCount, errors: Object.freeze(errors) });
}
