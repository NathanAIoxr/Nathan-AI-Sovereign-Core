# Tabor Accords — Evidence-First Academy: executable acceptance test

This file is an implementation artifact, not a claim of completed curriculum or deployed Worker. User statements must be kept verbatim in a separate source registry. Assistant proposals are explicitly noncanonical.

## Original source rules
- “If it doesn’t make sense, it’s not true.”
- “If you can’t evidence, it don’t have imaginary friends.”
- “What actually exist”
- The available digits are exactly one each of 1, 2, 3.

## Testable inventory
The nonempty ordered arrangements without reuse are:
`123, 132, 1, 12, 13, 231, 213, 2, 21, 23, 321, 312, 3, 31, 32`.
Expected count = 15; lengths 1:3, 2:6, 3:6.

## Requirements
1. Preserve original input, source attribution and constraints before any transformation.
2. Never add digits or duplicate an available digit within one arrangement.
3. Evidence classifications: supported, contradicted, not-established. Never conflate unsupported with disproven.
4. Record provenance, change author, verification status and original text separately.
5. Do not label speculative lesson totals as authored or deployed lessons.
6. Implement and test modules independently; report exact CI, D1 and Worker receipts.

## Local executable check
```js
import assert from 'node:assert/strict';
const original = ['123','132','1','12','13','231','213','2','21','23','321','312','3','31','32'];
function enumerate(digits) {
  const out = [];
  const visit = (prefix, remaining) => {
    if (prefix) out.push(prefix);
    for (const d of remaining) visit(prefix + d, remaining.filter(x => x !== d));
  };
  visit('', digits);
  return out;
}
const generated = enumerate(['1','2','3']);
assert.equal(generated.length,15);
assert.deepEqual([...generated].sort(),[...original].sort());
assert.deepEqual([1,2,3].map(n => generated.filter(s=>s.length===n).length),[3,6,6]);
assert.ok(generated.every(s=>new Set(s).size===s.length));
console.log('PASS: 15 original non-repeating arrangements');
```

Conductor intake: issue #535. Next implement code as a standalone tested module; validate existing lease ownership and deploy only to authorized owned infrastructure. A queued D1 row is not a claimed or executed job.
