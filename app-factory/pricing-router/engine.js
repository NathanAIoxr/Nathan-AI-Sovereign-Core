/* T123-PRICING-ROUTER-001: offline preview logic, not payment processing */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports) module.exports=api;
  if(root) root.TaborPricingRouter=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const audiences=["children","families","general","educators","professionals"];
  const categories=["story","casual","competitive","sandbox","creator","utility","education","community"];
  const purposes=["entertainment","learning","creativity","community","professional"];
  function normalize(input){
    if(!input||typeof input!=="object"||Array.isArray(input)) throw Error("App profile required");
    const app={
      id:String(input.id||"draft-app"),title:String(input.title||"Untitled App"),
      audience:input.audience||"general",category:input.category||"casual",
      purpose:input.purpose||"entertainment",
      complexity:input.complexity===undefined?2:input.complexity,
      deliveryCost:input.deliveryCost||"low",
      ongoingContent:input.ongoingContent===true,multiplayer:input.multiplayer===true,
      supportsAds:input.supportsAds===true,freeCore:input.freeCore!==false,
      includesChildren:input.includesChildren===true||input.audience==="children"||input.audience==="families",
      ownerPriceBand:input.ownerPriceBand||"auto",
      allowedOfferIds:input.allowedOfferIds===undefined?null:input.allowedOfferIds
    };
    if(!app.id.trim()||!app.title.trim()||app.id.length>100||app.title.length>160) throw Error("Invalid app ID/title");
    if(!audiences.includes(app.audience)||!categories.includes(app.category)||!purposes.includes(app.purpose)) throw Error("Unknown audience/category/purpose");
    if(!Number.isInteger(app.complexity)||app.complexity<1||app.complexity>5) throw Error("Complexity must be 1..5");
    if(!["low","medium","high"].includes(app.deliveryCost)||!["auto","basic","standard","advanced"].includes(app.ownerPriceBand)) throw Error("Invalid cost or band");
    if(app.allowedOfferIds!==null&&(!Array.isArray(app.allowedOfferIds)||app.allowedOfferIds.length>100||app.allowedOfferIds.some(x=>typeof x!=="string"))) throw Error("Invalid offer allowlist");
    return app;
  }
  function matches(rule,app){
    const w=rule.when||{};
    return (!w.audienceAny||w.audienceAny.includes(app.audience))&&
      (!w.categoryAny||w.categoryAny.includes(app.category))&&
      (!w.purposeAny||w.purposeAny.includes(app.purpose))&&
      (w.complexityAtLeast===undefined||app.complexity>=w.complexityAtLeast)&&
      (w.ongoingContent===undefined||app.ongoingContent===w.ongoingContent)&&
      (w.multiplayer===undefined||app.multiplayer===w.multiplayer)&&
      (w.includesChildren===undefined||app.includesChildren===w.includesChildren);
  }
  function band(app){
    if(app.ownerPriceBand!=="auto")return app.ownerPriceBand;
    if(app.complexity>=4&&app.deliveryCost==="high")return "advanced";
    if(app.complexity>=3||app.deliveryCost!=="low")return "standard";
    return "basic";
  }
  function validate(policy,catalog){
    if(policy?.schemaVersion!==1||!Array.isArray(policy.rules)||!policy.configurations)throw Error("Invalid rules");
    if(catalog?.schemaVersion!==1||!Array.isArray(catalog.offers))throw Error("Invalid offers");
    const seen=new Set();
    for(const offer of catalog.offers){
      if(!offer.id||seen.has(offer.id))throw Error("Duplicate or missing offer");
      seen.add(offer.id);
      if(!["non_consumable","consumable","auto_renewable","non_renewing"].includes(offer.type))throw Error("Unknown purchase type");
      for(const b of ["basic","standard","advanced"]){
        if(!Number.isInteger(offer.previewPriceCents?.[b])||offer.previewPriceCents[b]<0)throw Error("Bad preview price");
      }
    }
    for(const r of policy.rules)if(!policy.configurations[r.configuration])throw Error("Unknown configuration");
    return true;
  }
  function compile(input,policy,catalog){
    validate(policy,catalog);
    const app=normalize(input),rule=policy.rules.find(r=>matches(r,app));
    if(!rule)throw Error("Missing default rule");
    const config=policy.configurations[rule.configuration],priceBand=band(app),child=app.includesChildren;
    const offers=catalog.offers.filter(o=>
      config.offerIds.includes(o.id)&&
      (!app.allowedOfferIds||app.allowedOfferIds.includes(o.id))&&
      o.categories.includes(app.category)&&o.audiences.includes(app.audience)&&
      (!o.requiresAds||app.supportsAds)&&(!o.requiresOngoing||app.ongoingContent)&&
      !(child&&(o.requiresAds||["consumable","auto_renewable"].includes(o.type)))
    ).map(o=>({
      id:o.id,title:o.title,description:o.description,type:o.type,
      recommendedUsdCents:o.previewPriceCents[priceBand],
      priceAuthority:"PLATFORM_AFTER_SKU_REGISTRATION",pricingStatus:"ILLUSTRATIVE_ONLY",
      platformProductId:null,directPurchaseEnabled:false,requiresAdultCheckout:child
    }));
    return {
      module:"T123-PRICING-ROUTER-001",app,configuration:rule.configuration,
      configurationName:config.title,ruleId:rule.id,reason:rule.reason,priceBand,
      freeCore:child||app.freeCore,offers,
      childGuard:child?"No ads, paid consumables, recurring billing or child checkout in this prototype.":"Not applicable",
      releaseStatus:"PREVIEW_ONLY",humanApprovalRequired:true,verifiedBilling:false,
      individualSpendProfilingUsed:false,policyVersion:policy.version,catalogVersion:catalog.version
    };
  }
  return {normalize,validate,compile,matches,band,audiences,categories,purposes};
});