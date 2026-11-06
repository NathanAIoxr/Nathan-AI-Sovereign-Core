/* TTFES&BTP Kickstarter local creator interface. */
(function(){
'use strict';
var E;
function id(x){return document.getElementById(x);}
function value(x){return id(x).value;}
function status(target,text){id(target).textContent=text;}
function reward(n) {
  var title=value('r'+n+'-name').trim(), cost=value('r'+n+'-price'),
    description=value('r'+n+'-description');
  if(!title&&!cost&&!description.trim())return null;
  return {name:title,amount:Number(cost),description:description};
}
function input(){
  return {
    title:value('title'),subtitle:value('subtitle'),creator:value('creator'),
    category:value('category'),goal:value('goal'),currency:value('currency'),durationDays:value('duration'),
    keywords:value('keywords'),story:value('story'),risks:value('risks'),timeline:value('timeline'),
    originalSource:value('source'),rewards:[1,2,3].map(reward).filter(Boolean),
    rightsReviewed:id('rights').checked,fulfillmentReviewed:id('rewards-check').checked,
    costsReviewed:id('cost-check').checked
  };
}
function read(){return E.normalize(input());}
function error(target,e){status(target,'NOT COMPLETED: '+(e&&e.message||e));}
function filename(s){return String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'project';}
function download(bytes,name,type){
  var url=URL.createObjectURL(new Blob([bytes],{type:type})),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  window.setTimeout(function(){URL.revokeObjectURL(url);},15000);
}
async function copy(text){
  if(!navigator.clipboard||!navigator.clipboard.writeText)throw Error('Clipboard unavailable. Use the downloaded file or a secure browser context.');
  await navigator.clipboard.writeText(text);
}
function updatePreview(){
  var c=read(),text=E.storyMarkdown(c);
  status('preview',text);
  return c;
}
function importDraft(raw) {
  var c=E.normalize(raw);
  [['title',c.title],['subtitle',c.subtitle],['creator',c.creator],['category',c.category],
   ['goal',c.goal],['currency',c.currency],['duration',c.durationDays],
   ['keywords',c.keywords.join(', ')],['story',c.story],['risks',c.risks],
   ['timeline',c.timeline],['source',c.originalSource]].forEach(function(entry){id(entry[0]).value=entry[1];});
  c.rewards.slice(0,3).forEach(function(r,i){
    var n=i+1;id('r'+n+'-name').value=r.name;
    id('r'+n+'-price').value=r.amount;id('r'+n+'-description').value=r.description;
  });
  status('review-status','Imported a local draft. Verify every field before exporting or transferring it.');
}
function boot() {
  E=window.TaborElectricSlide;
  if(!E||!window.DummiePublisher){status('review-status','The shared ZIP engine is missing. Open from the complete TABOR Factory website.');return;}
  var region=id('destinations');
  E.DESTINATIONS.forEach(function(d){
    var box=document.createElement('div');box.className='panel';box.style.margin='0';
    var title=document.createElement('strong');title.textContent=d.name;box.appendChild(title);
    var p=document.createElement('p');p.textContent=d.mode+' · '+d.status;box.appendChild(p);
    region.appendChild(box);
  });
  id('inspect').addEventListener('click',function(){
    try{
      var c=updatePreview(),missing=[];
      if(!c.story.trim())missing.push('Project story');
      if(!c.risks.trim())missing.push('Risks');
      if(!c.timeline.trim())missing.push('Timeline');
      if(!c.originalSource.trim())missing.push('Original source');
      if(!c.readiness.rightsReviewed)missing.push('Rights review');
      if(!c.readiness.fulfillmentReviewed)missing.push('Reward fulfillment review');
      if(!c.readiness.costsReviewed)missing.push('Financial review');
      status('review-status','Campaign draft validated for local export. Goal '+c.currency+' '+c.goal+
        ', duration '+c.durationDays+' days, '+c.rewards.length+' reward drafts.'+
        (missing.length?'\nPending checks: '+missing.join('; '):'\nCreator checkboxes marked complete (not externally verified).')+
        '\nKickstarter account, identity, payouts and final launch are separate.');
    }catch(e){error('review-status',e);}
  });
  id('show-preview').addEventListener('click',function(){try{updatePreview();id('preview').parentElement.open=true;}catch(e){error('review-status',e);}});
  id('copy-json').addEventListener('click',async function(){
    try{var c=read();await copy(JSON.stringify(E.payload(c),null,2));
      status('transport-status','Campaign JSON copied to your clipboard. Not uploaded or published.');}
    catch(e){error('transport-status',e);}
  });
  id('save-zip').addEventListener('click',function(){
    try{var c=read(),data=E.zipPackage(input());
      download(data,filename(c.title)+'-electric-slide.zip','application/zip');
      status('transport-status','Local ZIP package prepared ('+Math.round(data.length/1024)+' KiB). Confirm your browser saved it. No online submission.');}
    catch(e){error('transport-status',e);}
  });
  id('save-story').addEventListener('click',function(){
    try{var c=read();download(E.storyMarkdown(c),filename(c.title)+'-campaign.md','text/markdown;charset=utf-8');
      status('transport-status','Story draft prepared for download; not published.');}
    catch(e){error('transport-status',e);}
  });
  id('copy-story').addEventListener('click',async function(){
    try{await copy(E.storyMarkdown(read()));status('transport-status','Story copied to clipboard; not published.');}
    catch(e){error('transport-status',e);}
  });
  id('open-kickstarter').addEventListener('click',function(){
    var missing=[];
    if(!id('rights').checked)missing.push('rights');
    if(!id('rewards-check').checked)missing.push('rewards and delivery');
    if(!id('cost-check').checked)missing.push('budget and costs');
    if(missing.length){
      status('handoff-status','Review these items before handoff: '+missing.join(', ')+'.');
      return;
    }
    window.open('https://www.kickstarter.com/start','_blank','noopener,noreferrer');
    status('handoff-status','Kickstarter creator page opened. You must verify and enter campaign details. No form submission, authorization or launch has happened here.');
  });
  id('import-json').addEventListener('click',function(){id('json-file').click();});
  id('json-file').addEventListener('change',async function(){
    try{
      var f=this.files[0];if(!f)return;
      if(f.size>1024*1024)throw Error('Local campaign JSON must be under 1 MiB.');
      importDraft(JSON.parse(await f.text()));
    }catch(e){error('review-status',e);}
    finally{this.value='';}
  });
}
document.addEventListener('DOMContentLoaded',boot);
})();
