import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';
const invoke=(path,method='GET',body,env={},token)=>worker.fetch(new Request('https://localhost'+path,{method,body:body?JSON.stringify(body):undefined,headers:{...(body?{'content-type':'application/json'}:{}),...(token?{authorization:'Bearer '+token}:{})}}),env);
test('public health endpoint',async()=>{const r=await invoke('/health');assert.equal(r.status,200);const d=await r.json();assert.equal(d.mode,'passive')});
test('port registry is reference only',async()=>{const d=await (await invoke('/ports')).json();assert.equal(d.ports.find(x=>x.port===22).service,'SSH');assert.match(d.notice,/not live scans/i)});
test('private reports fail closed without secret',async()=>{assert.equal((await invoke('/reports','POST',{assessment_id:'test'})).status,503)});
test('no scanning endpoint',async()=>{assert.equal((await invoke('/scan','POST',{})).status,404)});
test('private read fails closed',async()=>{assert.equal((await invoke('/reports/test')).status,503)});
test('authorized report submission, retrieval, and duplicate rejection',async()=>{
 const token='test-token-with-at-least-24-chars';
 const records=new Map();
 const env={REPORT_API_TOKEN:token,REPORTS:{get:async key=>records.get(key)||null,put:async(key,value)=>{records.set(key,value)}}};
 const report={assessment_id:'test_001',authorization:{owner_or_authorized:true,scope_description:'Synthetic test only'},findings:[{host:'example.invalid',port:443,protocol:'tcp',state:'unknown'}]};
 assert.equal((await invoke('/reports','POST',report,env)).status,401);
 const posted=await invoke('/reports','POST',report,env,token);assert.equal(posted.status,201);assert.match((await posted.json()).sha256,/^[a-f0-9]{64}$/);
 assert.equal((await invoke('/reports','POST',report,env,token)).status,409);
 const stored=await invoke('/reports/test_001','GET',undefined,env,token);assert.equal(stored.status,200);assert.equal((await stored.json()).scanned_by_worker,false);
});
test('rejects false authorization attestation',async()=>{
 const token='test-token-with-at-least-24-chars';
 const env={REPORT_API_TOKEN:token,REPORTS:{get:async()=>null,put:async()=>{}}};
 const report={assessment_id:'bad',authorization:{owner_or_authorized:false,scope_description:'No permission'},findings:[]};
 assert.equal((await invoke('/reports','POST',report,env,token)).status,400);
});
