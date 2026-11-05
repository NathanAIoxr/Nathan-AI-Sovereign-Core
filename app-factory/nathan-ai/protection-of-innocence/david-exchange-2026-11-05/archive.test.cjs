const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const get = n => JSON.parse(fs.readFileSync(path.join(__dirname,n),"utf8"));
test("source and index remain separate, ordered and in one-to-one correspondence",()=>{
  const source=get("messages.json"), index=get("index.json");
  assert.equal(source.messages.length,4);
  assert.equal(index.records.length,4);
  assert.deepEqual(source.messages.map(x=>x.id),index.records.map(x=>x.id));
  assert.deepEqual(source.messages.map(x=>x.sequence),[1,2,3,4]);
  for(const item of source.messages) {
    assert.equal(item.role,"user");
    assert.ok(item.original_text.length>0);
    assert.equal(item.author_verified_bytes,false);
  }
});
test("original user corrections, repetitions and source punctuation are not normalized away",()=>{
  const m=get("messages.json").messages.map(x=>x.original_text);
  assert.ok(m[0].startsWith("Hey David\n\nYOU ARE WORTH"));
  assert.ok(m[0].includes("KILL ALL VILLAGE IDIOTS"));
  assert.ok(m[1].includes("I’d SLICE"));
  assert.ok(m[2].includes("I’d SLICE"));
  assert.ok(m[2].includes("2nd attempt - you lied the first time - YOU CHANGED MY WORDS"));
  assert.ok(m[3].startsWith("Restore all of my words"));
  assert.notEqual(m[1],m[2]);
});
