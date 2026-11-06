/* TTFES&BTP — The Tabor Finger Electric Slide and Button Tapping Process.
 * Original design/ownership: Nathan Tabor. Additive to TABOR Factory.
 * Offline-only campaign preparation; never logs into, uploads to, or launches Kickstarter.
 * Uses existing DUMMIE ZIP engine.
 */
(function(root,factory) {
  'use strict';
  var zip = typeof module === 'object' && module.exports
    ? require('../dummie-publisher/publisher.js') : root.DummiePublisher;
  var api = factory(zip);
  if(typeof module === 'object' && module.exports) module.exports=api;
  else root.TaborElectricSlide=api;
})(typeof globalThis==='undefined'?this:globalThis,function(packager) {
  'use strict';
  var enc=new TextEncoder();
  var SCHEMA='tabor.ttfes-btp.kickstarter.v1';
  var DESTINATIONS=Object.freeze([
    {id:'library',name:'ONE Master Library',mode:'local-import',status:'future-adapter'},
    {id:'github',name:'GitHub + Vercel',mode:'authorized-api',status:'future-adapter'},
    {id:'workspace',name:'Airtable / Notion / Drive',mode:'authorized-api',status:'future-adapter'},
    {id:'catalog',name:'ISBN and library metadata',mode:'file-export',status:'future-adapter'},
    {id:'kickstarter',name:'Kickstarter',mode:'manual-transfer',status:'implemented'},
    {id:'crowdfunding',name:'Indiegogo / BackerKit',mode:'manual-transfer',status:'future-adapter'},
    {id:'kdp',name:'Amazon KDP',mode:'manual-transfer',status:'separate-transporter'},
    {id:'appstores',name:'App Store / Google Play',mode:'manual-review',status:'future-adapter'},
    {id:'commerce',name:'Online storefronts',mode:'csv-or-api',status:'future-adapter'},
    {id:'audio',name:'Podcast and audiobook platforms',mode:'file-export',status:'future-adapter'},
    {id:'evidence',name:'Evidence archives',mode:'sha-256-manifest',status:'future-adapter'}
  ]);
  function str(x,max) {return String(x===undefined||x===null?'':x).replace(/\r\n?/g,'\n').slice(0,max||100000);}
  function required(x,name,max) {var s=str(x,max).trim();if(!s)throw Error(name+' is required.');return s;}
  function int(x,name,min,max) {var n=Number(x);if(!Number.isSafeInteger(n)||n<min||(max&&n>max))throw Error(name+' must be a whole number between '+min+' and '+(max||'the permitted maximum')+'.');return n;}
  function rewards(value) {
    if(!Array.isArray(value))return [];
    if(value.length>20)throw Error('A maximum of 20 reward drafts is supported.');
    return value.map(function(r,i) {
      r=r||{};
      return {name:required(r.name||r.tier,'Reward #'+(i+1)+' name',100),
        amount:int(r.amount===undefined?r.cost:r.amount,'Reward amount',1,100000000),
        description:str(r.description||r.perks,2000),
        shipping:str(r.shipping,1000),delivery:str(r.delivery||r.fulfillment,1000)};
    });
  }
  function normalize(raw) {
    raw=raw||{};
    var title=required(raw.title||raw.project_title,'Project title',120);
    var currency=str(raw.currency||'USD',3).toUpperCase();
    if(!/^[A-Z]{3}$/.test(currency))throw Error('Currency must be a three-letter code.');
    var original=String(raw.originalSource!==undefined?raw.originalSource:(raw.project_source||''));
    if(original.length>5000000)throw Error('Source exceeds 5,000,000 characters; split it into separately preserved packages.');
    var goal=int(raw.goal===undefined?raw.funding_goal:raw.goal,'Funding goal',1,1000000000);
    var duration=int(raw.durationDays||raw.duration_days||30,'Campaign duration',1,60);
    var keywordInput=raw.keywords||raw.search_keywords||[];
    var keywords=(Array.isArray(keywordInput)?keywordInput:str(keywordInput,1400).split(','))
      .map(function(k){return str(k,90).trim();}).filter(Boolean).slice(0,7);
    return {
      schema:SCHEMA,
      creator:required(raw.creator||'Nathan Tabor','Creator',120),
      title:title,subtitle:str(raw.subtitle||raw.project_subtitle,250),
      category:str(raw.category||'Publishing',120),
      goal:goal,currency:currency,durationDays:duration,
      brief:str(raw.brief,12000),
      story:str(raw.story||raw.project_story,100000),
      risks:str(raw.risks||raw.risks_and_challenges,10000),
      timeline:str(raw.timeline||raw.project_timeline,10000),
      keywords:keywords,
      rewards:rewards(raw.rewards||raw.reward_tiers||[]),
      originalSource:original,
      readiness:{
        rightsReviewed:raw.rightsReviewed===true,
        fulfillmentReviewed:raw.fulfillmentReviewed===true,
        costsReviewed:raw.costsReviewed===true
      },
      status:'local-preparation-only',
      destination:'Kickstarter'
    };
  }
  function payload(c) {
    c=c&&c.schema===SCHEMA?c:normalize(c);
    return {
      schema:c.schema,project_title:c.title,project_subtitle:c.subtitle,category:c.category,
      funding_goal:c.goal,currency:c.currency,duration_days:c.durationDays,
      story:c.story,risks_and_challenges:c.risks,project_timeline:c.timeline,
      search_keywords:c.keywords,
      reward_tiers:c.rewards.map(function(r){return {tier:r.name,cost:r.amount,perks:r.description,shipping:r.shipping,fulfillment:r.delivery};}),
      submission_status:'not-submitted',launch_status:'not-launched'
    };
  }
  function storyMarkdown(c) {
    c=c&&c.schema===SCHEMA?c:normalize(c);
    var out='# '+c.title+'\n\n'+(c.subtitle?c.subtitle+'\n\n':'');
    out+='## Story\n\n'+(c.story||'[Describe your creative project and the deliverable.]')+'\n\n';
    out+='## Rewards\n\n'+(c.rewards.length?c.rewards.map(function(r){
      return '### '+r.name+' — '+c.currency+' '+r.amount+'\n\n'+(r.description||'[Describe the reward.]')+'\n\n'+
        (r.delivery?'Delivery: '+r.delivery+'\n\n':'')+
        (r.shipping?'Shipping: '+r.shipping+'\n\n':'');
    }).join(''):'[Add rewards and fulfillment estimates.]')+'\n';
    out+='## Timeline\n\n'+(c.timeline||'[Add delivery milestones.]')+'\n\n';
    out+='## Risks and challenges\n\n'+(c.risks||'[Explain the material risks and mitigation steps.]')+'\n';
    return out;
  }
  function htmlEscape(x){return str(x,200000).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function htmlPreview(c) {
    c=c&&c.schema===SCHEMA?c:normalize(c);
    var html=storyMarkdown(c).split(/\n\n+/).map(function(x) {
      var match=x.match(/^(#{1,3}) (.+)$/);
      if(match)return '<h'+match[1].length+'>'+htmlEscape(match[2])+'</h'+match[1].length+'>';
      return '<p>'+x.split('\n').map(htmlEscape).join('<br>')+'</p>';
    }).join('\n');
    return '<!doctype html><html lang="en"><meta charset="utf-8"><title>'+
      htmlEscape(c.title)+' — Local draft</title><main><p><strong>LOCAL DRAFT: NOT PUBLISHED</strong></p>'+
      html+'</main></html>';
  }
  function receipt(c) {
    return {schema:SCHEMA,creator:c.creator,title:c.title,
      destination:'Kickstarter',status:'prepared-locally-not-uploaded',
      caveats:['Verify the actual Kickstarter fields and current rules.',
        'Confirm rights, creator identity, banking, shipping, fees, rewards, and project viability.',
        'A package download or browser prefill is NOT submission, approval or launch.',
        'Final approval and launch always require the creator to act in Kickstarter.']};
  }
  function zipPackage(input) {
    var c=normalize(input), out=payload(c);
    var files=[
      {path:'SOURCE/original-source.txt',bytes:enc.encode(c.originalSource)},
      {path:'CAMPAIGN/campaign.json',bytes:enc.encode(JSON.stringify(out,null,2)+'\n')},
      {path:'CAMPAIGN/story.md',bytes:enc.encode(storyMarkdown(c))},
      {path:'CAMPAIGN/preview.html',bytes:enc.encode(htmlPreview(c))},
      {path:'CAMPAIGN/review-status.json',bytes:enc.encode(JSON.stringify(receipt(c),null,2)+'\n')},
      {path:'READ-ME-FIRST.txt',bytes:enc.encode(
        'TTFES&BTP · The Tabor Finger Electric Slide and Button Tapping Process\n'+
        'Creator: Nathan Tabor\n'+
        'This is an unpublished draft, NOT a Kickstarter submission or KDP book.\n'+
        'Keep the original source untouched in SOURCE/. Campaign materials are derivatives.\n'+
        'Sign in at https://www.kickstarter.com/start to complete verification and bank details yourself.\n'+
        'Review all legal, financial, copyright, shipping, media and reward statements.\n'+
        'Do not paste credentials into transport packages or browser extensions.\n'+
        'Use the browser companion to fill ONLY an explicitly focused field, never final submit buttons.\n')}
    ];
    return packager.zip(files);
  }
  return Object.freeze({SCHEMA:SCHEMA,DESTINATIONS:DESTINATIONS,normalize:normalize,payload:payload,
    storyMarkdown:storyMarkdown,htmlPreview:htmlPreview,zipPackage:zipPackage});
});
