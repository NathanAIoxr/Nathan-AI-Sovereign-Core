import test from 'node:test';import assert from 'node:assert/strict';import {detectScriptDirection,homophoneCandidates} from './units.mjs';
test('English left-to-right',()=>assert.equal(detectScriptDirection('Hello').direction,'ltr'));
test('Hebrew right-to-left',()=>assert.equal(detectScriptDirection('שלום').direction,'rtl'));
test('Mixed script',()=>assert.equal(detectScriptDirection('Hello שלום').direction,'mixed'));
test('Neutral numbers',()=>assert.equal(detectScriptDirection('123 !').direction,'neutral'));
test('Homophone suggestions preserve input',()=>{const x=homophoneCandidates('Two cats');assert.equal(x.tokens[0].token,'Two');assert.deepEqual(x.tokens[0].candidates,['to','too']);});
test('Unknown word remains unaltered',()=>assert.deepEqual(homophoneCandidates('Tabor').tokens[0].candidates,[]));
test('Reject oversize input',()=>assert.throws(()=>detectScriptDirection('x'.repeat(10001)),RangeError));
test('Reject non-string input',()=>assert.throws(()=>homophoneCandidates(null),RangeError));
