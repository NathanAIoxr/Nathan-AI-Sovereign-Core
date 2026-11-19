import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const dossier=JSON.parse(readFileSync(new URL('./cleopatra-staff-source-gap.json',import.meta.url),'utf8'));
const original=readFileSync(new URL('../original.txt',import.meta.url),'utf8');
test('Cleopatra staff claim is verbatim and attributed to author source',()=>{
 for(const evidence of dossier.evidence) assert.ok(original.includes(evidence.exact_excerpt));
 assert.equal(dossier.claim_class,'author_report_not_independently_verified');
});
test('unverified object, breakage, and custody remain open',()=>{
 assert.equal(dossier.status,'open');
 assert.equal(dossier.publication,'review_only_not_deployed');
 for(const key of ['identity_verified','breakage_verified','custody_verified']) assert.equal(dossier[key],false);
 assert.ok(dossier.unresolved.length>=3);
});
