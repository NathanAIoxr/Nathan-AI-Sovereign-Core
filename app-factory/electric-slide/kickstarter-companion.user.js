// ==UserScript==
// @name         TTFES&BTP — Electric Slide Kickstarter Companion
// @namespace    https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core
// @version      0.1.0
// @description  Local campaign-data helper; owner manually focuses each editable field. Never submits or launches.
// @match        https://www.kickstarter.com/*
// @grant        none
// ==/UserScript==
(function(){
  'use strict';
  // This is not an official Kickstarter integration.
  // No automatic provider selectors, session reads, external requests or form submits.
  const ROOT_ID='ttfes-btp-companion';
  if(document.getElementById(ROOT_ID))return;
  let lastTarget=null, campaign=null, selected='project_title';
  const allowed=['project_title','project_subtitle','category','funding_goal','currency',
    'duration_days','story','risks_and_challenges','project_timeline',
    'reward_1_tier','reward_1_cost','reward_1_perks',
    'reward_2_tier','reward_2_cost','reward_2_perks',
    'reward_3_tier','reward_3_cost','reward_3_perks'];
  const root=document.createElement('section');
  root.id=ROOT_ID;root.hidden=true;
  Object.assign(root.style,{position:'fixed',right:'15px',bottom:'16px',width:'min(410px,calc(100vw - 30px))',
    maxHeight:'70vh',overflowY:'auto',padding:'15px',background:'#101e2a',color:'#f8f1de',
    border:'2px solid #f4ca75',borderRadius:'13px',zIndex:'2147483647',
    font:'14px/1.5 system-ui,sans-serif',boxShadow:'0 8px 35px #000a'});
  function elem(tag,props,text) {
    const item=document.createElement(tag);
    Object.assign(item,props||{});
    if(text!==undefined)item.textContent=text;
    return item;
  }
  const title=elem('h2',{},'TTFES&BTP · Electric Slide');
  title.style.margin='0 0 6px';title.style.fontSize='17px';
  const detail=elem('p',{},'Open your local campaign JSON here. Choose a value, click a Kickstarter text field, then press Alt+Shift+V to fill only that field.');
  const input=elem('textarea',{rows:4,placeholder:'Paste the TTFES&BTP campaign JSON here'});
  const select=elem('select');
  const status=elem('p',{},'Not loaded. No submissions or account changes.');
  const line=elem('div');line.style.display='flex';line.style.flexWrap='wrap';line.style.gap='7px';
  function action(label,fn) {
    const b=elem('button',{type:'button'},label);
    Object.assign(b.style,{padding:'8px',background:'#e6c176',color:'#14212b',
      border:'0',borderRadius:'7px',cursor:'pointer'});
    b.addEventListener('click',fn);line.appendChild(b);return b;
  }
  const dismiss=elem('button',{type:'button'},'Close');
  Object.assign(dismiss.style,{float:'right',background:'#334958',color:'#fff',padding:'5px 9px',
    border:'1px solid #779ca5',borderRadius:'7px'});
  dismiss.addEventListener('click',()=>{root.hidden=true;});
  root.append(dismiss,title,detail,input,select,line,status);
  document.documentElement.appendChild(root);
  for(const key of allowed)select.add(new Option(key.replaceAll('_',' '),key));
  select.addEventListener('change',()=>{selected=select.value;});
  function message(s){status.textContent=s;}
  function dataValues() {
    if(!campaign)return {};
    const out={};
    allowed.forEach(key=>{if(Object.hasOwn(campaign,key))out[key]=campaign[key];});
    const rewards=Array.isArray(campaign.reward_tiers)?campaign.reward_tiers:[];
    for(let i=0;i<3;i++) {
      const n=i+1,r=rewards[i];
      if(!r)continue;
      out['reward_'+n+'_tier']=r.tier;
      out['reward_'+n+'_cost']=r.cost;
      out['reward_'+n+'_perks']=r.perks;
    }
    return out;
  }
  action('LOAD JSON',()=>{
    try {
      if(input.value.length>500000)throw Error('Payload is too large for this companion.');
      const p=JSON.parse(input.value);
      if(!p||p.schema!=='tabor.ttfes-btp.kickstarter.v1')throw Error('Load the Electric Slide campaign JSON export.');
      campaign=p;
      message('Draft loaded locally. Choose a value and focus a text field on this page. No changes yet.');
    } catch(e){campaign=null;message('NOT LOADED: '+e.message);}
  });
  action('COPY SELECTED',async()=>{
    try {
      const v=dataValues()[selected];
      if(v===undefined)throw Error('Selected value missing.');
      await navigator.clipboard.writeText(String(v));
      message(selected+' copied to clipboard. No page field changed.');
    } catch(e){message('Copy unavailable: '+e.message);}
  });
  function isEditable(target) {
    if(!target||root.contains(target))return false;
    const t=target.tagName?target.tagName.toLowerCase():'';
    if(target.matches&&target.matches('[readonly], [disabled]'))return false;
    if(t==='input')return ['text','number','search','url'].includes(target.type);
    if(t==='textarea')return true;
    return !!target.isContentEditable;
  }
  function banned(target) {
    const desc=[target.name,target.id,target.getAttribute('aria-label'),
      target.getAttribute('placeholder')].join(' ').toLowerCase();
    return /password|token|secret|bank|routing|account number|tax|ssn|social security|credit card|payment|login|sign in|verify/.test(desc);
  }
  document.addEventListener('focusin',e=>{if(isEditable(e.target))lastTarget=e.target;},true);
  function fillFocused() {
    try {
      const values=dataValues(), raw=values[selected], target=lastTarget;
      if(raw===undefined)throw Error('Load JSON and select a populated field.');
      if(!isEditable(target)||banned(target))throw Error('Click a permitted Kickstarter project text field first.');
      const val=String(raw);
      if(val.length>100000)throw Error('This value is too large for single-field transfer.');
      if(target.isContentEditable) {
        target.focus();target.textContent=val;
        target.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:val}));
      } else {
        const proto=target.tagName.toLowerCase()==='textarea'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
        const setter=Object.getOwnPropertyDescriptor(proto,'value').set;
        setter.call(target,val);
        target.dispatchEvent(new Event('input',{bubbles:true}));
        target.dispatchEvent(new Event('change',{bubbles:true}));
        target.focus();
      }
      message('Filled '+selected+' in the field you chose. Review its displayed value and save in Kickstarter yourself.');
    } catch(e){message('NOT FILLED: '+e.message);}
  }
  action('FILL LAST FOCUSED FIELD',fillFocused);
  window.addEventListener('keydown',e=>{
    if(e.altKey&&e.shiftKey&&e.code==='KeyS'){e.preventDefault();root.hidden=!root.hidden;}
    if(e.altKey&&e.shiftKey&&e.code==='KeyV'){
      if(root.hidden)return;
      e.preventDefault();fillFocused();
    }
  },true);
  // This companion never searches for launch, submit, payment, approve, save or publish controls.
  // It never clicks them, regardless of payload content.
})();
