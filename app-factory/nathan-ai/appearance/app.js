(function(){
  'use strict';
  if(window.NathanAppearanceUI)return;
  const api=window.NathanAppearance,root=document.documentElement,script=document.currentScript;
  const studio=new URL('index.html',script.src).href;
  let state={...api.defaults},readWarning='',status=null;
  try{const raw=localStorage.getItem(api.KEY);if(raw)state=api.parse(raw)}catch(e){readWarning='Stored appearance settings could not be read; original defaults are active.'}
  const fonts={system:'system-ui, sans-serif',serif:'Georgia, Cambria, serif',mono:'ui-monospace, SFMono-Regular, Consolas, monospace',readable:'Verdana, Arial, sans-serif'};
  const widths={comfortable:'1220px',wide:'1440px',reading:'960px'};
  function apply(){
    const skin=api.skins.find(s=>s.id===state.skin);root.dataset.nathanAppearance='v1';root.dataset.nathanSkin=skin.id;root.dataset.nathanDensity=state.density;root.dataset.nathanMotion=state.reduceMotion?'reduce':'system';root.classList.toggle('nathan-themed',skin.id!=='original');
    for(const key of ['bg','panel','text','muted','accent','onAccent','border','secondary'])root.style.setProperty('--n-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),skin[key]);
    root.style.setProperty('--n-scheme',skin.scheme);root.style.setProperty('--n-font',fonts[state.font]);root.style.setProperty('--n-scale',state.scale);root.style.setProperty('--n-width',widths[state.width]);
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=skin.bg;
    if(document.getElementById('nathan-appearance-dialog')){
      document.querySelectorAll('[data-nathan-setting]').forEach(e=>{const key=e.dataset.nathanSetting;if(e.type==='checkbox')e.checked=state[key];else e.value=state[key]});
      document.querySelectorAll('[data-nathan-skin-choice]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.nathanSkinChoice===skin.id)));
    }
    window.dispatchEvent(new CustomEvent('nathan:appearancechange',{detail:{...state}}));
  }
  function change(patch){
    try{state=api.settings({...state,...patch});apply();try{localStorage.setItem(api.KEY,api.serialize(state));if(status)status.textContent='Appearance saved for Nathan AI pages on this browser.'}catch(e){if(status)status.textContent='Appearance active in this tab; browser storage is unavailable.'}}
    catch(e){if(status)status.textContent=e.message}
  }
  const exposed={getState:()=>({...state}),setState:change};window.NathanAppearanceUI=Object.freeze(exposed);apply();
  window.addEventListener('storage',event=>{if(event.key!==api.KEY)return;try{state=event.newValue?api.parse(event.newValue):{...api.defaults};apply();if(status)status.textContent='Appearance updated from another Nathan AI tab.'}catch(e){if(status)status.textContent='Another tab supplied invalid appearance settings; current appearance retained.'}});
  function start(){
    const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
    const trigger=el('button','Look & feel');trigger.type='button';trigger.className='nathan-appearance-button';trigger.id='nathan-appearance-trigger';trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls','nathan-appearance-dialog');
    const header=document.querySelector('body>main>header')||document.querySelector('header');if(header)header.append(trigger);else{const bar=el('div');bar.className='nathan-appearance-standalone';bar.append(trigger);document.body.prepend(bar)}
    const dialog=el('dialog');dialog.id='nathan-appearance-dialog';dialog.className='nathan-appearance-dialog';dialog.setAttribute('aria-labelledby','nathan-appearance-title');
    const body=el('div');body.className='nathan-appearance-content';const heading=el('div');heading.className='nathan-appearance-heading';const title=el('h2','Make Nathan AI yours.');title.id='nathan-appearance-title';const close=el('button','Close');close.type='button';close.setAttribute('aria-label','Close appearance settings');heading.append(title,close);body.append(heading,el('p','Choose a palette and reading style. Your records, source text and game state stay untouched.'));
    const grid=el('div');grid.className='nathan-skin-grid';grid.setAttribute('role','group');grid.setAttribute('aria-label','Choose a skin');
    for(const skin of api.skins){const b=el('button');b.type='button';b.className='nathan-skin-card';b.dataset.nathanSkinChoice=skin.id;b.setAttribute('aria-pressed',String(state.skin===skin.id));const swatch=el('span');swatch.className='nathan-skin-swatch';swatch.style.background=skin.bg;swatch.setAttribute('aria-hidden','true');for(const color of [skin.panel,skin.accent,skin.secondary]){const dot=el('i');dot.style.background=color;swatch.append(dot)}b.append(swatch,el('strong',skin.name),el('small',skin.description));b.addEventListener('click',()=>change({skin:skin.id}));grid.append(b)}
    body.append(grid);const fields=el('div');fields.className='nathan-appearance-fields';
    for(const [key,label,choices]of [
      ['font','Reading font',[['system','Modern system'],['serif','Editorial serif'],['mono','Technical mono'],['readable','Spacious sans']]],
      ['scale','Text size',[['0.95','95%'],['1','100%'],['1.1','110%'],['1.2','120%']]],
      ['density','Spacing',[['comfortable','Comfortable'],['compact','Compact']]],
      ['width','Page width',[['comfortable','Comfortable'],['wide','Wide workspace'],['reading','Focused reading']]]
    ]){const lab=el('label',label);lab.htmlFor='nathan-'+key;const select=el('select');select.id=lab.htmlFor;select.dataset.nathanSetting=key;for(const [value,name]of choices){const o=el('option',name);o.value=value;select.append(o)}select.value=state[key];select.addEventListener('change',()=>change({[key]:select.value}));lab.append(select);fields.append(lab)}
    const motion=el('label');motion.className='nathan-appearance-check';const checkbox=el('input');checkbox.type='checkbox';checkbox.dataset.nathanSetting='reduceMotion';checkbox.checked=state.reduceMotion;checkbox.addEventListener('change',()=>change({reduceMotion:checkbox.checked}));motion.append(checkbox,el('span','Reduce interface motion'));fields.append(motion);body.append(fields,el('p','System reduced-motion preferences are respected. These controls change interface styling, not running computations or game rules.'));
    status=el('p',readWarning||'Choose any setting to preview and save it.');status.id='nathan-appearance-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');body.append(status);
    const actions=el('div');actions.className='nathan-appearance-actions';const reset=el('button','Reset appearance');reset.type='button';reset.addEventListener('click',()=>change({...api.defaults}));const exportButton=el('button','Export settings');exportButton.type='button';exportButton.addEventListener('click',()=>{const a=el('a');a.href=URL.createObjectURL(new Blob([api.serialize(state)],{type:'application/json'}));a.download='nathan-ai-appearance.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500)});
    const input=el('input');input.type='file';input.accept='.json,application/json';input.hidden=true;input.id='nathan-import-appearance';const importButton=el('button','Import settings');importButton.type='button';importButton.addEventListener('click',()=>input.click());input.addEventListener('change',async()=>{const file=input.files[0];if(!file)return;try{if(file.size>10000)throw Error('Appearance file is too large');change(api.parse(await file.text()))}catch(e){status.textContent='Import failed: '+e.message+' Current appearance retained.'}input.value=''});
    actions.append(reset,exportButton,importButton);body.append(actions,input);const link=el('a','Open Appearance Studio →');link.href=studio;link.style.display='inline-block';link.style.marginTop='18px';body.append(link);dialog.append(body);document.body.append(dialog);
    trigger.addEventListener('click',()=>dialog.showModal());document.querySelectorAll('[data-nathan-open-style]').forEach(b=>b.addEventListener('click',()=>dialog.showModal()));close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>trigger.focus());dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}});apply();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
