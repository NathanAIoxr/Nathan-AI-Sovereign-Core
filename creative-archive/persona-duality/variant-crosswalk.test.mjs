import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('./variant-crosswalk.json',import.meta.url),'utf8'));
test('both author spelling variants are retained without adjudicating private evidence',()=>{
 assert.deepEqual(data.variants.map(x=>x.spelling),['SANTA SUPMALG','SANTA SUPMALS']);
 assert.equal(data.status,'unresolved_requires_original_source_review');
 assert.equal(data.policy.preserve_both,true);
 assert.equal(data.policy.do_not_overwrite_canon,true);
 assert.equal(data.policy.private_transcripts_not_published,true);
});
