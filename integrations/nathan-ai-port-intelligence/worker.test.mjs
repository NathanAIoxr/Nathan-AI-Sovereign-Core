import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';
const request=(path,method='GET',body)=>worker.fetch(new Request('https://localhost'+path,{method,body:body?JSON.stringify(body):undefined,headers:body?{'content-type':'application/json'}:{}}),{});
test('public health endpoint',async()=>{const r=await request('/health');assert.equal(r.status,200);const d=await r.json();assert.equal(d.mode,'passive')});
test('port registry is reference only',async()=>{const d=await (await request('/ports')).json();assert.equal(d.ports.find(x=>x.port===22).service,'SSH');assert.match(d.notice,/not live scans/i)});
test('private reports fail closed without secret',async()=>{const r=await request('/reports','POST',{assessment_id:'test'});assert.equal(r.status,503)});
test('no scanning endpoint',async()=>{const r=await request('/scan','POST',{});assert.equal(r.status,404)});
test('private read fails closed',async()=>{const r=await request('/reports/test');assert.equal(r.status,503)});
