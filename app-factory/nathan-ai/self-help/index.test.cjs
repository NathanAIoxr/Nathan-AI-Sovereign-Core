'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');

test('No original victim-blaming disclosure questionnaire or hidden fields',()=>{
  for(const phrase of [
    'What would protect you and anyone else involved?',
    'Identify an immediate safe, nonviolent step.',
    'Who can help, with consent?',
    'Quick self-help check-in',
    'Describe the situation in your own words.'
  ]) assert.equal(html.includes(phrase),false,'Forbidden generated prompt: '+phrase);
  assert.doesNotMatch(html,/<textarea\b|<input\b|<form\b/i);
});

test('No assistant-generated protection section is republished as Nathan Tabor source',()=>{
  assert.doesNotMatch(html, /id="protect-innocence"/i);
  assert.doesNotMatch(html, /id="protection-title"/i);
  assert.doesNotMatch(html, /GET AWAY\\. MAKE NOISE\\. GET HELP\\./i);
});

test('Original Nathan Tabor principles and KJV references are preserved as his, not rewritten',()=>{
  for(const phrase of [
    'INNOCENCE IS MY GOD',
    'PROTECT NO ONE BUT INNOCENCE',
    'Nobody gets permission to destroy somebody else’s innocence',
    'Yes is Yes — No is No',
    '1+1=2 — BUILD. 1−1=0 — CLEAR.',
    'James 1:27 and Romans 13:4',
    'McGuffey Readers',
    '../children-innocence/PROTECTION_OF_INNOCENCE.md'
  ]) assert.ok(html.includes(phrase),'Missing original principle: '+phrase);
});

test('Existing project tracks and navigation preserved, no claim of completed service',()=>{
  assert.ok(html.includes('iCuBUDDY and BUDDY AI are separate named project tracks.'));
  assert.ok(html.includes('This navigation page is not their completed implementation.'));
  for(const href of ['../index.html','../original-works/index.html','../children-innocence/index.html','../assistant/index.html']) {
    assert.ok(html.includes('href="'+href+'"'),'Missing link '+href);
  }
});
