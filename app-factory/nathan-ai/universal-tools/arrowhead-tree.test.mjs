import test from 'node:test';
import assert from 'node:assert/strict';
import {PAIRS,PAIR_SCHEMA,findPairs,matchAnswer,SOURCE_REFERENCES} from './arrowhead-tree-matrix.mjs';

test('13 unique two-way arrowhead and tree pairings',()=>{
 assert.equal(PAIR_SCHEMA,'nathan-ai-arrowhead-tree-pairs.v1');
 assert.equal(PAIRS.length,13);
 assert.equal(new Set(PAIRS.map(x=>x.id)).size,13);
 assert.equal(new Set(PAIRS.map(x=>x.pointName)).size,13);
 assert.equal(new Set(PAIRS.map(x=>x.treeName)).size,13);
 for(const p of PAIRS){
  assert.equal(matchAnswer(p.number,'point'),p.treeName);
  assert.equal(matchAnswer(p.number,'tree'),p.pointName);
  assert.equal(p.linkStatus,'creative-shape-analogy');
  assert.equal(p.individualArtifactVerified,false);
  assert.equal(p.individualTreeSpecimenVerified,false);
  assert.ok(p.originalConnection.length>70);
 }
});
test('author preserves exactly 13 named pair slots, tree identities and regions',()=>{
 const first=PAIRS[0],last=PAIRS[12];
 assert.equal(first.pointName,'Clovis Fluted');
 assert.equal(first.treeName,'Tamarack Larch');
 assert.equal(first.originalLatin,'Larix laricina');
 assert.equal(last.pointName,'Washita Barbed');
 assert.equal(last.treeName,'Douglas Fir');
 assert.equal(last.acceptedLatin,'Pseudotsuga menziesii');
});
test('taxonomy corrections do not silently overwrite author-supplied names',()=>{
 const spruce=PAIRS[4],cypress=PAIRS[8];
 assert.equal(spruce.originalLatin,'Picea glauca');
 assert.equal(spruce.acceptedLatin,'Picea glauca var. densata');
 assert.equal(cypress.pointName,'Fresno Notched');
 assert.equal(cypress.shape,'unnotched triangular');
 assert.match(cypress.accuracyNote,/incorrect/);
 assert.equal(cypress.originalLatin,'Cupressus arizonica');
 assert.equal(cypress.acceptedLatin,'Hesperocyparis arizonica');
});
test('unverified point types stay clearly distinct from documented types',()=>{
 assert.equal(PAIRS[5].typeEvidence,'mixed');
 assert.equal(PAIRS[6].typeEvidence,'unverified');
 assert.equal(PAIRS[11].typeEvidence,'colloquial');
 assert.ok(PAIRS.every(x=>x.typeEvidence&&x.accuracyNote));
 assert.ok(SOURCE_REFERENCES.length>=5);
});
test('reverse searches and matching return the same 13 mapped records',()=>{
 assert.equal(findPairs('', 'point').length,13);
 assert.equal(findPairs('', 'tree').length,13);
 assert.deepEqual(new Set(findPairs('', 'tree').map(p=>p.id)),new Set(PAIRS.map(p=>p.id)));
 assert.equal(findPairs('Fraser Fir').length,1);
 assert.equal(findPairs('Fresno')[0].number,9);
 assert.equal(findPairs('No such point or tree').length,0);
});
