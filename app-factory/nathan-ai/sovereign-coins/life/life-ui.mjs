/* NATHAN AI 21 Sovereign Coin Life Matrix
 * No personal data collection, automatic persistence, external transmission,
 * wallet access, sign-in form, or financial assertion.
 */
const $=id=>document.getElementById(id);
const drafts=new Map(); // ephemeral in-page only; never written to localStorage
let rows=[],originals=[],selected='SIN';
const element=(tag,content)=>{const e=document.createElement(tag);e.textContent=String(content??'');return e};
function saveDraft(){drafts.set(selected,$('life-notes').value);}
function select(ticker){
  if(rows.length&&!rows.some(x=>x.ticker===ticker))return;
  saveDraft();selected=ticker;
  const record=rows.find(x=>x.ticker===selected);
  $('life-selected').textContent=record?.ticker||ticker;
  $('life-question').textContent=record?.question||'Owner-selected life connection';
  $('life-notes').value=drafts.get(selected)||'';
  draw();
}
function draw(){
  const query=$('life-search').value.trim().toLocaleLowerCase();
  const filtered=rows.filter(r=>{
    const orig=originals.find(o=>o.ticker===r.ticker);
    return [r.ticker,r.life_domain,r.question,orig?.name,orig?.definition].filter(Boolean).join(' ').toLocaleLowerCase().includes(query);
  });
  const grid=$('life-grid');grid.replaceChildren();
  for(const r of filtered){
    const original=originals.find(o=>o.ticker===r.ticker);
    const card=element('article');card.className='life-card';
    const tag=element('span',String(r.number).padStart(2,'0')+' · '+r.ticker);tag.className='tag';
    const title=element('strong',r.life_domain);
    const name=element('small',original?.name||'Original label unavailable');
    const source=element('small',original?.definition||'Original definition unavailable');
    const selectButton=element('button',selected===r.ticker?'Selected · edit private note':'Connect life record');
    selectButton.type='button';selectButton.setAttribute('aria-pressed',String(selected===r.ticker));
    selectButton.addEventListener('click',()=>select(r.ticker));
    card.append(tag,title,name,source,selectButton);grid.append(card);
  }
  $('life-status').textContent=filtered.length+' of '+rows.length+' life-domain links shown · editorial crosswalk (original coin definitions unchanged).';
}
function exportSelected(){
  saveDraft();
  const original=originals.find(o=>o.ticker===selected);
  const mapping=rows.find(r=>r.ticker===selected);
  const output={
    schema:'nathan-ai.owner-life-note.export.v1',
    exported_at:new Date().toISOString(),
    original_coin:{ticker:selected,name:original?.name,definition:original?.definition},
    proposed_life_domain:mapping?.life_domain,
    source_of_note:'user-entered (private; session-only)',
    owner_original_words:drafts.get(selected)||'',
    financial_claims_verified:false,
    service_credentials_included:false
  };
  const blob=new Blob([JSON.stringify(output,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='NATHAN_AI_LIFE_'+selected+'_LOCAL.json';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('life-note-status').textContent='Download initiated for '+selected+'; no network upload was made. Store the file securely if it contains private information.';
}
async function init(){
  try{
    const [life,coin]=await Promise.all([fetch('./life-matrix.json'),fetch('../registry.json')]);
    if(!life.ok||!coin.ok)throw Error('The life crosswalk or source registry could not load.');
    const lm=await life.json();const cm=await coin.json();
    if(lm.schema!=='nathan-ai.sovereign-life-map.v1'||!Array.isArray(lm.linkages)||!Array.isArray(cm.coins)||lm.linkages.length!==21||cm.coins.length!==21)
      throw Error('Expected 21 source rings and 21 life connections.');
    for(let i=0;i<21;i++){
      if(lm.linkages[i].ticker!==cm.coins[i].ticker||lm.linkages[i].number!==cm.coins[i].number)
        throw Error('Source ticker alignment mismatch at position '+(i+1));
    }
    rows=lm.linkages;originals=cm.coins;
    $('life-search').addEventListener('input',draw);
    $('life-export').addEventListener('click',exportSelected);
    $('life-clear').addEventListener('click',()=>{
      drafts.delete(selected);$('life-notes').value='';$('life-note-status').textContent='Current session note cleared; no source records were changed.';
    });
    const initial=rows[0];
    selected=initial.ticker;
    $('life-selected').textContent=initial.ticker;
    $('life-question').textContent=initial.question;
    draw();
  }catch(error){$('life-status').textContent='Life connections unavailable: '+error.message;}
}
init();
