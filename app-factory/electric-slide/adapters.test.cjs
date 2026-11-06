'use strict';
const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const M=require('./matrix.js'),A=require('./adapters.js');
function entries(zip){
 const dec=new TextDecoder(),out={};let p=0;
 while(p<zip.length && zip[p]===80 && zip[p+1]===75 && zip[p+2]===3 && zip[p+3]===4){
   const size=(zip[p+18] | zip[p+19]<<8 | zip[p+20]<<16 | zip[p+21]<<24)>>>0;
   const nameLength=zip[p+26] | zip[p+27]<<8;
   const extraLength=zip[p+28] | zip[p+29]<<8;
   const start=p+30+nameLength+extraLength;
   const name=dec.decode(zip.slice(p+30,p+30+nameLength));
   out[name]=dec.decode(zip.slice(start,start+size));p=start+size;
 }
 return out;
}
test('all 46 destinations have unique local logical field templates and no external write support',()=>{
 const report=A.audit();
 assert.equal(report.ok,true,report.errors.join('; '));
 assert.equal(report.total,46);
 assert.equal(M.DESTINATIONS.length,46);
 for(const d of M.DESTINATIONS){
   const t=A.template(d.id);
   assert.equal(t.destination.id,d.id);
   assert.equal(t.importGuaranteed,false);
   assert.equal(t.externalWriteSupported,false);
   assert.equal(t.verifiedProviderFields,false);
   assert.ok(t.fields.length>=5,d.id);
   assert.equal(new Set(t.fields.map(f=>f.id)).size,t.fields.length,d.id);
   for(const f of t.fields)assert.equal(f.providerSelectorVerified,false);
 }
});
test('all destinations produce local JSON and an inspectable ZIP package',()=>{
 for(const d of M.DESTINATIONS){
   const fields=Object.fromEntries(A.template(d.id).fields.slice(0,2).map((f,i)=>[f.id,'Value '+i]));
   const input={destinationId:d.id,creator:'Nathan Tabor',
      sourceLabel:'Source original',originalSource:'EXACT\r\nŁŌÐ ☀',
      fields,sourceSha256:'a'.repeat(64),createdAtUtc:'2026-11-06T20:00:00.000Z'};
   const p=A.build(input),e=entries(A.makeZip(input));
   assert.equal(p.source.originalText,input.originalSource,d.id);
   assert.equal(p.destination.importGuaranteed,false,d.id);
   assert.equal(p.approval.submitted,false,d.id);
   assert.equal(p.approval.published,false,d.id);
   assert.equal(e['SOURCE/ORIGINAL.txt'],input.originalSource,d.id);
   assert.equal(JSON.parse(e['DESTINATION/destination-packet.json']).source.originalText,input.originalSource,d.id);
   assert.equal(JSON.parse(e['PROVENANCE/receipt.json']).sha256,'a'.repeat(64),d.id);
   assert.match(e['DESTINATION/mapping.csv'],/logical_field/);
   assert.match(e['DESTINATION/READ-ME-FIRST.txt'],/NOT an upload/);
 }
});
test('unknown destinations, unknown logical fields, invalid digests and missing source are rejected',()=>{
 assert.throws(()=>A.template('not-a-provider'),/Unknown destination/);
 assert.throws(()=>A.build({destinationId:'shopify',originalSource:'Original',fields:{password:'secret'}}),/Unexpected field/);
 assert.throws(()=>A.build({destinationId:'shopify',originalSource:'Original',fields:{price:{x:2}}}),/must be text/);
 assert.throws(()=>A.build({destinationId:'shopify',originalSource:'Original',sourceSha256:'bad'}),/Invalid SHA/);
 assert.throws(()=>A.build({destinationId:'shopify',originalSource:'Original',createdAtUtc:'today'}),/UTC timestamp/);
 assert.throws(()=>A.build({destinationId:'shopify',originalSource:''}),/Original source/);
 assert.throws(()=>A.build({destinationId:'shopify',originalSource:'Original',fields:{description:'x'.repeat(100001)}}),/100000/);
});
test('CSV formula injection cannot turn a copied user-supplied value into a spreadsheet formula',()=>{
 const packet=A.build({destinationId:'shopify',originalSource:'Original',fields:{
   name:'=IMPORTXML("https://invalid.example","x")',description:'-1+2',sku:'@SUM(A1:A2)'
 }});
 const csv=A.mappingCsv(packet);
 assert.match(csv,/"'=IMPORTXML/);
 assert.match(csv,/"'-1\+2"/);
 assert.match(csv,/"'@SUM/);
 assert.ok(csv.startsWith('\uFEFF'));
 assert.ok(csv.includes('\r\n'));
});
test('UI contains editor, transparent status, and no external write calls',()=>{
 const html=fs.readFileSync(path.join(__dirname,'matrix.html'),'utf8');
 const ui=fs.readFileSync(path.join(__dirname,'adapters-ui.js'),'utf8');
 assert.match(html,/logical-fields/);
 assert.match(html,/adapters\.js/);
 assert.match(html,/adapters-ui\.js/);
 assert.match(ui,/SHA-256/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|\bXMLHttpRequest\b|navigator\.sendBeacon|\.submit\s*\(/);
 assert.match(html,/not verified live selectors/i);
});