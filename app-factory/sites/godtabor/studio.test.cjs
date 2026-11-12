'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname,'studio.html'),'utf8');
test('GODTABOR additive gateway has all three dimensions',()=>{
 assert.match(html,/<!doctype html>/i);
 for(const id of ['literal','figurative','myth'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/BY NATHAN TABOR/i);
 assert.match(html,/COUNCIL OF GODS/);
});
test('independent browser records with no remote intake',()=>{
 for(const ns of ['godtabor.literal.v1','godtabor.figurative.v1','godtabor.mythology.v1','godtabor.master-index.v1'])assert.ok(html.includes(ns),ns);
 assert.doesNotMatch(html,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|<form[^>]*action=/i);
 assert.doesNotMatch(html,/<input[^>]*type="(?:email|tel|password)"/i);
});
test('originals marked verbatim and lore explicitly fictional',()=>{
 assert.match(html,/VERBATIM OWNER-AUTHORED MATERIAL/);
 assert.match(html,/Download GOD today and BECOME the GOD you are BORN TO BE/);
 assert.match(html,/source_type:"fictional story seed/);
 assert.match(html,/not a claim that supernatural entities have been demonstrated/);
});
