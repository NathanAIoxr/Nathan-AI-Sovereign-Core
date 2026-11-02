'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const data = require('./history.json');
const archive = require('./records.js');
test('preserve 72 source headings', () => assert.equal(data.length, 72));
test('preserve the original 69 audit positions without inventing missing entries', () => assert.equal(archive.select(data, 'audit', '').length, 69));
test('preserve 100 312-register placeholders with no fabricated text', () => {
 const records = archive.select(data, 'network', '');
 assert.equal(records.length, 100);
 assert.equal(records[0].id, 'NET-213');
 assert.equal(records.at(-1).id, 'NET-312');
});
test('original private sources not silently published', () => assert.equal(archive.ORIGINAL_FILES.length, 13));
