'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const file=path.join(__dirname,'index.html');
const html=fs.readFileSync(file,'utf8');
test('Cash App cashtag and destination visible, not a fake embedded checkout',()=>{
 assert.match(html,/\$DOGGODjnt/);
 assert.match(html,/https:\/\/cash\.app\/\$DOGGODjnt/);
 assert.match(html,/Confirm recipient before paying/);
 assert.match(html,/not an embedded or automatic checkout/);
});
test('truthful donor record and nonprofit claims',()=>{
 assert.match(html,/has not been established/);
 assert.match(html,/Do not assume a Cash App transfer is tax-deductible/);
 assert.match(html,/not proof that a donation was paid/);
 assert.match(html,/not live automated actions/);
 assert.doesNotMatch(html,/stripe\.com|paypal\.com|api[_-]?key|secret_key/i);
 assert.doesNotMatch(html,/<form[^>]*\saction=/i);
 assert.doesNotMatch(html,/fetch\s*\(|XMLHttpRequest|sendBeacon/i);
});
test('local frontend script parses and no donor email is transmitted',()=>{
 const match=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(match,'embedded planner script');
 assert.doesNotThrow(()=>new vm.Script(match[1]));
 assert.doesNotMatch(match[1],/localStorage|sessionStorage|indexedDB/i);
});
