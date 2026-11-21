import assert from 'node:assert/strict';
export const originalArrangements = ['123','132','1','12','13','231','213','2','21','23','321','312','3','31','32'];
export function enumerateNonRepeating(digits) {
  if (!Array.isArray(digits) || new Set(digits).size !== digits.length) throw new Error('Input inventory must contain distinct digits');
  const out=[];
  const visit=(prefix, remaining)=>{
    if(prefix) out.push(prefix);
    for(let i=0;i<remaining.length;i++) visit(prefix+remaining[i], remaining.filter((_,j)=>i!==j));
  };
  visit('',digits);
  return out;
}
export function verifyOriginalInventory(){
  const generated=enumerateNonRepeating(['1','2','3']);
  assert.equal(generated.length,15);
  assert.deepEqual([...generated].sort(),[...originalArrangements].sort());
  assert.deepEqual([1,2,3].map(n=>generated.filter(s=>s.length===n).length),[3,6,6]);
  assert.ok(generated.every(s=>new Set(s).size===s.length));
  assert.throws(()=>enumerateNonRepeating(['1','1','2']));
  return {status:'passed',count:generated.length,byLength:{1:3,2:6,3:6}};
}
if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) console.log(JSON.stringify(verifyOriginalInventory()));
