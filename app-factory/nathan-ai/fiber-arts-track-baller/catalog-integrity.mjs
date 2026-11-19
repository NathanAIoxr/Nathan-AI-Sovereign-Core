/** Read-only shape check for the planned 12-craft / 72-step catalog.
 * This validates a supplied snapshot; it does not assert that a deployed catalog exists.
 */
export function auditFiberCatalog(crafts) {
  const errors = [];
  if (!Array.isArray(crafts)) return Object.freeze({ ok: false, craftCount: 0, stepCount: 0, errors: Object.freeze(['catalog must be an array']) });
  const craftIds = new Set();
  let stepCount = 0;
  if (crafts.length !== 12) errors.push(`expected 12 crafts; found ${crafts.length}`);
  for (const [i, craft] of crafts.entries()) {
    if (!craft || typeof craft !== 'object' || Array.isArray(craft)) { errors.push(`craft ${i} invalid`); continue; }
    if (typeof craft.id !== 'string' || !craft.id.trim()) errors.push(`craft ${i} missing id`);
    else if (craftIds.has(craft.id)) errors.push(`duplicate craft id: ${craft.id}`);
    else craftIds.add(craft.id);
    if (!Array.isArray(craft.steps)) { errors.push(`craft ${i} steps missing`); continue; }
    stepCount += craft.steps.length;
    if (craft.steps.length !== 6) errors.push(`craft ${i} expected 6 steps; found ${craft.steps.length}`);
    const stepIds = new Set();
    for (const [j, step] of craft.steps.entries()) {
      if (!step || typeof step.id !== 'string' || !step.id.trim()) errors.push(`craft ${i} step ${j} missing id`);
      else if (stepIds.has(step.id)) errors.push(`craft ${i} duplicate step id: ${step.id}`);
      else stepIds.add(step.id);
    }
  }
  if (stepCount !== 72) errors.push(`expected 72 steps; found ${stepCount}`);
  return Object.freeze({ ok: errors.length === 0, craftCount: crafts.length, stepCount, errors: Object.freeze(errors) });
}
