'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const c=require('./root-contracts.js');
const p={schema:'tabor.root.project.v1',id:'tabor.world:TW-001',originalId:'TW-001',tenantId:'private-owner-1',name:'Original world',status:'prototype',visibility:'private'};
const a={schema:'tabor.root.asset-ref.v1',id:'tabor.vault:abc123',tenantId:'private-owner-1',sourceFilename:'original.png',sha256:'f'.repeat(64),visibility:'private',provenance:'user-owned original'};
test('preserves distinct project namespace and exact original legacy ID',()=>{
 assert.deepEqual(c.checkProject(p),[]);
 assert.equal(p.originalId,'TW-001');
 assert.notEqual('tabor.world:TW-001','tabor.world:TW001');
 assert.equal(c.validId('TW-001'),false);
 assert.ok(c.checkProject({...p,id:'TW-001'}).length>0);
});
test('requires source provenance, digest status and visibility for each asset',()=>{
 assert.deepEqual(c.checkAsset(a),[]);
 assert.ok(c.checkAsset({...a,provenance:''}).length>0);
 assert.ok(c.checkAsset({...a,sha256:'not-a-hash'}).length>0);
 assert.ok(c.checkAsset({...a,visibility:undefined}).length>0);
 assert.deepEqual(c.checkAsset({...a,sha256:null}),[]);
});
test('deny by default without trusted authenticated server context',()=>{
 assert.equal(c.authorize({actor:{authenticated:true},action:'asset.read',resource:{tenantId:'private-owner-1'}}).allowed,false);
 assert.equal(c.authorize({trustedServerContext:true,actor:{id:'a',tenantId:'x'},resource:{id:'b',tenantId:'x'},action:'asset.read'}).allowed,false);
});
test('denies cross-tenant scopes even when grant appears approved',()=>{
 const actor={id:'A',tenantId:'A',authenticated:true},grant={actorId:'A',tenantId:'A',resourceId:'asset-1',scopes:['asset.read'],expiresAt:Date.now()+10000,approved:true};
 assert.equal(c.authorize({trustedServerContext:true,actor,resource:{id:'asset-1',tenantId:'B'},action:'asset.read',grants:[grant]}).allowed,false);
});
test('permits only in-scope unexpired grants in trusted server context',()=>{
 const actor={id:'A',tenantId:'A',authenticated:true},resource={id:'asset-1',tenantId:'A'};
 const grant={actorId:'A',tenantId:'A',resourceId:'asset-1',scopes:['asset.read'],expiresAt:Date.now()+10000,approved:true};
 assert.equal(c.authorize({trustedServerContext:true,actor,resource,action:'asset.read',grants:[grant]}).allowed,true);
 assert.equal(c.authorize({trustedServerContext:true,actor,resource,action:'asset.link',grants:[grant]}).allowed,false);
 assert.equal(c.authorize({trustedServerContext:true,actor,resource,action:'asset.read',grants:[{...grant,revoked:true}]}).allowed,false);
 assert.equal(c.authorize({trustedServerContext:true,actor,resource,action:'asset.read',grants:[{...grant,expiresAt:0}]}).allowed,false);
});
test('irreversible external payment and publishing cannot be approved locally',()=>{
 const actor={id:'A',tenantId:'A',authenticated:true},resource={id:'any',tenantId:'A'};
 const grants=['payment.charge','publish.execute','bank.transfer'].map(action=>({actorId:'A',tenantId:'A',resourceId:'*',approved:true,scopes:[action],expiresAt:Date.now()+20000}));
 for(const action of ['payment.charge','publish.execute','bank.transfer'])
  assert.equal(c.authorize({trustedServerContext:true,actor,resource,action,grants}).allowed,false);
});
test('release blocks private assets and incomplete rights approval',()=>{
 assert.equal(c.releaseReview(p,[a],'Shopify',{reviewId:'r1',ownerReviewed:true,rightsReviewed:true}).status,'blocked');
 assert.equal(c.releaseReview(p,[{...a,visibility:'public'}],'Shopify',null).status,'blocked');
});
test('successful public review remains a draft and never executes a release',()=>{
 const r=c.releaseReview(p,[{...a,visibility:'public'}],'Shopify',{reviewId:'r1',ownerReviewed:true,rightsReviewed:true});
 assert.equal(r.status,'ready-for-provider-review');
 assert.match(r.warning,/No publication/);
 assert.equal('execute' in r,false);
});
