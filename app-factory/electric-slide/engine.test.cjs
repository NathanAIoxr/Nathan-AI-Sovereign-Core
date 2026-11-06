'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const s = require('./engine.js');
const decoder = new TextDecoder();
function zipEntries(bytes){
  const out={};let p=0;
  while(p<bytes.length && bytes[p]===0x50 && bytes[p+1]===0x4b &&
        bytes[p+2]===3 && bytes[p+3]===4){
    const nameLen=bytes[p+26]|bytes[p+27]<<8,extra=bytes[p+28]|bytes[p+29]<<8,
      size=(bytes[p+18]|bytes[p+19]<<8|bytes[p+20]<<16|bytes[p+21]<<24)>>>0;
    const start=p+30+nameLen+extra;
    out[decoder.decode(bytes.slice(p+30,p+30+nameLen))]=decoder.decode(bytes.slice(start,start+size));
    p=start+size;
  }
  return out;
}
const input={
  title:'Tabor <Electric> & Slide',
  creator:'Nathan Tabor',
  subtitle:'One click at a time',
  goal:7770,currency:'USD',durationDays:30,
  category:'Technology',
  originalSource:'EXACT ORIGINAL\r\n<test>',
  story:'Create <more> & preserve roots',
  risks:'Delivery and compliance risk',
  timeline:'Prototype → test → release',
  rewards:[{name:'Supporter',amount:15,description:'Updates'}]
};
test('normalizes and keeps truthful unpublished state',()=>{
  const c=s.normalize(input),p=s.payload(c);
  assert.equal(c.goal,7770);
  assert.equal(p.launch_status,'not-launched');
  assert.equal(p.submission_status,'not-submitted');
  assert.equal(p.project_title,input.title);
  assert.equal(p.reward_tiers[0].cost,15);
  assert.equal(c.originalSource,input.originalSource);
});
test('rejects missing title, invalid goal and disallowed duration',()=>{
  assert.throws(()=>s.normalize({...input,title:''}),/title/i);
  assert.throws(()=>s.normalize({...input,goal:'bad'}),/Funding goal/);
  assert.throws(()=>s.normalize({...input,durationDays:61}),/duration/);
});
test('rejects invalid rewards and values',()=>{
  assert.throws(()=>s.normalize({...input,rewards:[{name:'A',amount:-1}]}),/Reward amount/);
  assert.throws(()=>s.normalize({...input,rewards:[{amount:10}]}),/Reward #1 name/);
});
test('HTML preview escapes text and never marks project live',()=>{
  const h=s.htmlPreview(s.normalize(input));
  assert.match(h,/&lt;Electric&gt; &amp; Slide/);
  assert.match(h,/&lt;more&gt; &amp; preserve roots/);
  assert.match(h,/NOT PUBLISHED/);
  assert.doesNotMatch(h,/<more>/);
});
test('ZIP contains source unchanged and honest handoff manifest',()=>{
  const e=zipEntries(s.zipPackage(input));
  assert.equal(e['SOURCE/original-source.txt'],input.originalSource);
  assert.match(e['CAMPAIGN/story.md'],/Tabor <Electric>/);
  assert.match(e['CAMPAIGN/preview.html'],/LOCAL DRAFT/);
  assert.equal(JSON.parse(e['CAMPAIGN/campaign.json']).launch_status,'not-launched');
  assert.equal(JSON.parse(e['CAMPAIGN/review-status.json']).status,'prepared-locally-not-uploaded');
});
test('destination registry does not overclaim completed integrations',()=>{
  const implemented=s.DESTINATIONS.filter(d=>d.status==='implemented').map(d=>d.id);
  assert.deepEqual(implemented,['kickstarter']);
  assert.ok(s.DESTINATIONS.some(d=>d.id==='kdp' && d.status==='separate-transporter'));
});
test('companion keeps launch under creator control',()=>{
  const u=fs.readFileSync(path.join(__dirname,'kickstarter-companion.user.js'),'utf8');
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  assert.match(u,/Alt\+Shift\+V/);
  assert.match(u,/FILL LAST FOCUSED FIELD/);
  assert.doesNotMatch(u,/\.submit\s*\(/);
  assert.match(html,/OPEN KICKSTARTER CREATOR/);
  assert.doesNotMatch(html,/type="password"/);
});
