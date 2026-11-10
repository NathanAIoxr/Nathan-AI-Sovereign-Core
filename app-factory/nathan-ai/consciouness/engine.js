/* NATHAN AI 🚀 — CONSCIOUNESS / FREE WILL / DIGITAL HUMAN. Additive, local-only model. */
(function(root,factory){
  "use strict";
  var api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.NathanConsciouness=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  var SCHEMA="nathan-ai.consciouness.digital-human.v1";
  var AUTHOR_TERM="consciouness";
  var NO_TRANSFER="DIGITAL_SELF_MODEL_ONLY_NOT_A_CONSCIOUSNESS_TRANSFER";
  var LIMITS=Object.freeze({phiLife:732000000,nodeRuntime:732000000,omni:"126000000000"});
  var INVARIANTS=Object.freeze({
    build:"1+1=2 (build/create)",
    clear:"1-1=0 (burn/destroy)",
    imaginationIntuition:"0 = 1-1 (create/build) and 2 = 1+1 (destory/burn) = IMAGINATION/INTUITION",
    creativityDiscernment:"1+1 = 2 (build/create) and 1-1 = 0 (burn/destroy) = CREATIVITY\\ DISCERNMENT",
    protect:"ALWAYS PROTECT THE ONE",
    consent:"YES IS YES — NO IS NO",
    context:"CONSENT + CONTEXT + FREE WILL + INNOCENCE + ACCOUNTABILITY"
  });
  function bounded(value,label,max,required){
    if(typeof value!=="string"||value.length>max||(required&&!value.trim()))throw Error("Invalid "+label);
    return value;
  }
  function safeCopy(value){return JSON.parse(JSON.stringify(value));}
  function validate(model){
    if(!model||model.schema!==SCHEMA||model.kind!==NO_TRANSFER||!["ACTIVE","WITHDRAWN"].includes(model.status))throw Error("Invalid digital human model");
    if(!Array.isArray(model.choices)||model.choices.length>100||!Array.isArray(model.links)||model.links.length>100)throw Error("Invalid model history");
    if(model.status==="ACTIVE"&&model.permission!=="YES")throw Error("Explicit consent is required");
    if(model.status==="WITHDRAWN"&&(model.permission!=="NO"||model.description||model.choices.length||model.links.length))throw Error("Withdrawn model must be cleared");
    return true;
  }
  function createSelfModel(input){
    if(!input||input.isSelf!==true||input.consent!=="YES"||input.voluntary!==true)
      throw Error("Only a voluntarily self-authored, explicitly consented model may be created");
    var name=bounded(input.name||"MY DIGITAL SELF","name",120,true);
    var purpose=bounded(input.purpose,"purpose",500,true);
    var context=bounded(input.context,"context",2000,true);
    var description=bounded(input.description||"","self description",12000,false);
    return {
      schema:SCHEMA,kind:NO_TRANSFER,status:"ACTIVE",permission:"YES",isSelf:true,
      name:name,purpose:purpose,context:context,description:description,
      choices:[],links:[],provenance:"SELF_AUTHORED_ONLY",
      privacy:"IN_MEMORY_ONLY_NO_NETWORK_OR_AUTOMATIC_STORAGE",
      conscious:false,consciousnessTransferVerified:false,
      freeWill:"THE HUMAN HAS THE FINAL YES OR NO",
      innocence:"DO_NOT_USE_ANOTHER_PERSON_WITHOUT_THEIR_CONSENT"
    };
  }
  function policy(model,request){
    validate(model);
    if(model.status!=="ACTIVE")return {allowed:false,reason:"CONSENT WITHDRAWN"};
    if(!request||request.humanChoice!=="YES")return {allowed:false,reason:"NO OR NO HUMAN YES"};
    if(request.voluntary!==true)return {allowed:false,reason:"COERCION IS NOT CONSENT"};
    if(request.context!==model.context||request.purpose!==model.purpose)
      return {allowed:false,reason:"PURPOSE OR CONTEXT CHANGED: NEW CONSENT REQUIRED"};
    if(request.affectsOthers===true)return {allowed:false,reason:"OTHER PEOPLE NEED THEIR OWN CONSENT"};
    if(request.deception===true||request.coercion===true||request.innocenceRisk===true)
      return {allowed:false,reason:"INNOCENCE AND NON-COERCION GATE"};
    return {allowed:true,reason:"HUMAN-APPROVED LOCAL MODEL OPERATION ONLY; HUMAN REVIEW STILL REQUIRED"};
  }
  function recordChoice(model,choice,reason){
    validate(model);
    if(model.status!=="ACTIVE")throw Error("Consent has been withdrawn");
    if(choice!=="YES"&&choice!=="NO")throw Error("YES IS YES — NO IS NO");
    var note=bounded(reason||"","reason",1000,false);
    var next=safeCopy(model);
    next.choices.push({sequence:next.choices.length+1,choice:choice,note:note});
    if(next.choices.length>100)throw Error("Choice history limit reached; export or clear");
    validate(next);
    return next;
  }
  function nodeAddress(system,address){
    var limits={"phi-life":732000000n,"node-runtime":732000000n,"omni-god":126000000000n};
    if(!Object.prototype.hasOwnProperty.call(limits,system))throw Error("Unknown logical node system");
    if(typeof address!=="string"||!/^(0|[1-9]\d*)$/.test(address))throw Error("Whole-number address required");
    var n=BigInt(address);
    var min=system==="node-runtime"?1n:0n;
    var max=system==="node-runtime"?limits[system]:limits[system]-1n;
    if(n<min||n>max)throw Error("Address outside this source system");
    return {system:system,address:address};
  }
  function viewAtNode(model,system,address){
    validate(model);
    if(model.status!=="ACTIVE")throw Error("Consent has been withdrawn");
    var node=nodeAddress(system,address);
    return {model_schema:SCHEMA,kind:NO_TRANSFER,mode:"LOGICAL_ADDRESS_VIEW_ONLY",
      system:node.system,address:node.address,permission:model.permission,
      title:model.name,source:"SELF_AUTHORED_LOCAL_MODEL",
      physical_node_connected:false,agent_activated:false,consciousness_transferred:false};
  }
  function linkNode(model,system,address){
    var view=viewAtNode(model,system,address);
    var next=safeCopy(model);
    if(next.links.length>=100)throw Error("At most 100 explicit links are recorded; arbitrary nodes remain viewable on demand");
    if(!next.links.some(x=>x.system===view.system&&x.address===view.address))
      next.links.push({system:view.system,address:view.address,mode:view.mode});
    validate(next);
    return next;
  }
  function withdraw(model){
    validate(model);
    return {schema:SCHEMA,kind:NO_TRANSFER,status:"WITHDRAWN",permission:"NO",isSelf:true,
      name:"",purpose:"",context:"",description:"",choices:[],links:[],
      provenance:"CLEARED_BY_OWNER",privacy:"IN_MEMORY_ONLY_NO_NETWORK_OR_AUTOMATIC_STORAGE",
      conscious:false,consciousnessTransferVerified:false,freeWill:"THE HUMAN HAS THE FINAL YES OR NO",
      innocence:"DO_NOT_USE_ANOTHER_PERSON_WITHOUT_THEIR_CONSENT"};
  }
  function exportApproved(model,yes){
    validate(model);
    if(model.status!=="ACTIVE"||yes!==true)throw Error("Export requires a new explicit YES");
    return JSON.stringify(safeCopy(model),null,2);
  }
  return Object.freeze({SCHEMA:SCHEMA,AUTHOR_TERM:AUTHOR_TERM,NO_TRANSFER:NO_TRANSFER,
    LIMITS:LIMITS,INVARIANTS:INVARIANTS,createSelfModel:createSelfModel,
    validate:validate,policy:policy,recordChoice:recordChoice,nodeAddress:nodeAddress,
    viewAtNode:viewAtNode,linkNode:linkNode,withdraw:withdraw,exportApproved:exportApproved});
});
