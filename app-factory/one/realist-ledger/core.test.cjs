'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('./core.js');
function fixture({crlf=false,continuation=false}={}){
 const end=crlf?'\r\n':'\n';
 const lines=[];
 for(let n=1;n<=101;n++){
  lines.push(n+'. Original action '+n+': preserve Noël, עברית, 日本語 — Nathan Tabor');
  if(continuation&&n===25)lines.push('    Indented continuation exactly as authored, including punctuation!  ');
 }
 return lines.join(end)+end;
}
test('all 101 original positions, canonical section boundaries and source preservation',()=>{
 const parsed=core.parseLedger(fixture());
 assert.equal(parsed.length,101);
 assert.deepEqual(parsed.map(x=>x.number),Array.from({length:101},(_,i)=>i+1));
 assert.equal(parsed[24].section,'I');assert.equal(parsed[25].section,'II');
 assert.equal(parsed[49].section,'II');assert.equal(parsed[50].section,'III');
 assert.equal(parsed[74].section,'III');assert.equal(parsed[75].section,'IV');
 assert.equal(parsed[100].section,'IV');
 assert.equal(parsed[0].original,'1. Original action 1: preserve Noël, עברית, 日本語 — Nathan Tabor\n');
});
test('CRLF and indentation are retained in original book text; normalized search view remains separate',()=>{
 const parsed=core.parseLedger(fixture({crlf:true,continuation:true}));
 const exact='25. Original action 25: preserve Noël, עברית, 日本語 — Nathan Tabor\r\n    Indented continuation exactly as authored, including punctuation!  \r\n';
 assert.equal(parsed[24].original,exact);
 assert.ok(parsed[24].text.endsWith('including punctuation!'));
 const manuscript=core.bookText(core.SECTIONS[0],parsed);
 assert.ok(manuscript.includes(exact));
 assert.ok(!manuscript.includes('25. '+parsed[24].text));
 assert.equal((manuscript.match(/### Action /g)||[]).length,25);
 assert.equal((core.bookText(core.SECTIONS[3],parsed).match(/### Action /g)||[]).length,26);
});
test('resumed original slots are validated; tampered or duplicate source cannot masquerade as complete',()=>{
 const good=core.parseLedger(fixture());
 assert.equal(core.validateEntries([...good].reverse())[0].number,1);
 assert.equal(core.validateEntries(core.placeholderLedger()).length,101);
 const dup=good.map(x=>({...x}));dup[13].number=1;
 assert.throws(()=>core.validateEntries(dup),/Invalid, repeated/);
 const other=good.map(x=>({...x}));other[0].section='IV';
 assert.throws(()=>core.validateEntries(other),/conflicting volume/);
 const fake=good.map(x=>({...x}));fake[0].original='2. wrong';
 assert.throws(()=>core.validateEntries(fake),/invalid verbatim/);
 assert.throws(()=>core.validateEntries(good.slice(1)),/exactly 101/);
 const privateLegacy=good.map(({number,text,section})=>({number,text,section}));
 assert.match(core.bookText(core.SECTIONS[1],privateLegacy),/26\. Original action 26/);
});
test('missing/duplicate entries, oversized input and wrong export boundaries fail closed',()=>{
 assert.throws(()=>core.parseLedger(fixture().replace(/^1\. .*\n/m,'')),/Missing: 1/);
 assert.throws(()=>core.parseLedger(fixture()+'1. Duplicate author text\n'),/Duplicate entry 1/);
 assert.throws(()=>core.parseLedger('x'.repeat(core.MAX_SOURCE_CHARS+1)),/exceeds 2 MiB/);
 const parsed=core.parseLedger(fixture());
 assert.throws(()=>core.bookText({...core.SECTIONS[0],to:101},parsed),/four original/);
 assert.throws(()=>core.bookText(core.SECTIONS[0],core.placeholderLedger()),/complete original source/);
 assert.throws(()=>core.parseLedger({not:'text'}),/must be text/);
});
test('question sequence uses only the four original volumes',()=>{
 const parsed=core.parseLedger(fixture());
 const first=core.buildQuestion(parsed,()=>0);
 assert.equal(first.number,1);assert.equal(first.correct,'I');
 assert.deepEqual(first.choices.map(x=>x.id),['I','II','III','IV']);
});
