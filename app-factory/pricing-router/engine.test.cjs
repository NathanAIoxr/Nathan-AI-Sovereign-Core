"use strict";
const {test}=require("node:test");
const a=require("node:assert/strict"),f=require("node:fs"),p=require("node:path");
const e=require("./engine.js");
const policy=JSON.parse(f.readFileSync(p.join(__dirname,"policy.json"),"utf8"));
const catalog=JSON.parse(f.readFileSync(p.join(__dirname,"catalog.json"),"utf8"));
const app=x=>({id:"example",title:"Demo",audience:"general",category:"casual",purpose:"entertainment",complexity:2,...x});
test("config parses",()=>a.equal(e.validate(policy,catalog),true));
test("children take priority over wealth, advanced or multiplayer",()=>{
 const x=e.compile(app({audience:"children",category:"story",complexity:5,ongoingContent:true,multiplayer:true,supportsAds:true}),policy,catalog);
 a.equal(x.configuration,"socialFlow");a.equal(x.freeCore,true);
 a.deepEqual(x.offers.map(o=>o.id),["story_expansion"]);
 a.equal(x.offers[0].requiresAdultCheckout,true);
});
test("children never get a priced sandbox vault",()=>{
 const x=e.compile(app({audience:"children",category:"sandbox",complexity:5}),policy,catalog);
 a.equal(x.offers.length,0);a.equal(x.configuration,"socialFlow");
});
test("competitive ongoing game gets season content and cosmetics",()=>{
 const x=e.compile(app({category:"competitive",ongoingContent:true}),policy,catalog);
 a.equal(x.configuration,"corePipeline");
 a.deepEqual(x.offers.map(o=>o.id),["season_pass","cosmetics"]);
});
test("advanced creator is apex based on product complexity only",()=>{
 const x=e.compile(app({category:"creator",audience:"professionals",complexity:5,deliveryCost:"high",ongoingContent:true}),policy,catalog);
 a.equal(x.configuration,"maxApex");a.equal(x.priceBand,"advanced");
 a.ok(x.offers.some(o=>o.id==="pro_kit"));
});
test("spend history, net worth, streak and ad engagement never change prices",()=>{
 const x=app({category:"creator",complexity:5,audience:"professionals"});
 a.deepEqual(e.compile({...x,lifetimeSpendHistory:0,netWorth:0},policy,catalog),
 e.compile({...x,lifetimeSpendHistory:999999,netWorth:90000000,consecutiveDaysActive:200,adEngagementRatio:1},policy,catalog));
});
test("community always social even high complexity",()=>a.equal(e.compile(app({category:"community",complexity:5,ongoingContent:true}),policy,catalog).configuration,"socialFlow"));
test("user-picked offer allowlist and product band work",()=>{
 const x=e.compile(app({category:"casual",supportsAds:true,allowedOfferIds:["ad_removal"],ownerPriceBand:"advanced"}),policy,catalog);
 a.deepEqual(x.offers.map(o=>o.id),["ad_removal"]);
 a.equal(x.offers[0].recommendedUsdCents,499);
});
test("unknown audiences and complexity rejected",()=>{
 a.throws(()=>e.compile(app({audience:"high-net-worth"}),policy,catalog));
 a.throws(()=>e.compile(app({complexity:20}),policy,catalog));
});
test("all plans are inert checkout previews",()=>{
 for(const c of ["casual","creator","story","competitive","utility"]){
 const x=e.compile(app({category:c,complexity:5,ongoingContent:true}),policy,catalog);
 a.equal(x.releaseStatus,"PREVIEW_ONLY");a.equal(x.verifiedBilling,false);
 a.ok(x.offers.every(o=>o.platformProductId===null&&o.directPurchaseEnabled===false));
 }
});
test("mixed-audience content gets children-first safeguards",()=>{
 const x=e.compile(app({category:"casual",supportsAds:true,includesChildren:true,ongoingContent:true}),policy,catalog);
 a.equal(x.configuration,"socialFlow");a.ok(x.offers.every(o=>o.requiresAdultCheckout));a.ok(x.offers.every(o=>o.id!=="ad_removal"));
});
test("family audience defaults child-safe and community purpose wins",()=>{
 const family=e.compile(app({audience:"families",category:"competitive",ongoingContent:true}),policy,catalog);
 a.equal(family.configuration,"socialFlow");a.ok(family.offers.every(o=>o.requiresAdultCheckout));
 const community=e.compile(app({category:"creator",complexity:5,purpose:"community"}),policy,catalog);
 a.equal(community.configuration,"socialFlow");
});
