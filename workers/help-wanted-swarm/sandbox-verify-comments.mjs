
import assert from "node:assert/strict";
const {patch,original,base}=JSON.parse(process.argv[1]);
assert.match(base,/^[a-f0-9]{40}$/);
const source=original.split("\n");
const draft=patch.split("\n");
assert.equal(draft.filter(line=>line.startsWith("diff --git ")).length,1);
const target=[];
let index=0;
let hunks=0;
for(let i=4;i<draft.length;){
  if(draft[i]===""){i++;continue;}
  const h=/^@@ -(\d+),(\d+) \+(\d+),(\d+) @@/.exec(draft[i++]);
  assert.ok(h,"Expected a unified diff hunk");
  const [,oldStart,oldCount,newStart,newCount]=h.map(Number);
  assert.ok(oldStart-1>=index);
  target.push(...source.slice(index,oldStart-1));
  index=oldStart-1;
  assert.equal(target.length,newStart-1);
  let removed=0,added=0;
  while(i<draft.length&&/^[ +-]/.test(draft[i])){
    const line=draft[i++];
    const prefix=line[0],value=line.slice(1);
    if(prefix!=="+"){assert.equal(value,source[index++]);removed++;}
    if(prefix!=="-"){target.push(value);added++;}
    if(prefix!==" ")assert.match(value,/^#/);
  }
  assert.equal(removed,oldCount);
  assert.equal(added,newCount);
  hunks++;
}
assert.equal(hunks,2);
target.push(...source.slice(index));
assert.deepEqual(target.filter(x=>!x.startsWith("#")),source.filter(x=>!x.startsWith("#")));
assert.equal(target.filter(x=>/^#   keyword\s/.test(x)).length,0);
process.stdout.write(JSON.stringify({runtime:process.version,platform:process.platform,
 command:"node: verify exact diff hunks and comment-only changes",base,checks:4,ok:true}));
