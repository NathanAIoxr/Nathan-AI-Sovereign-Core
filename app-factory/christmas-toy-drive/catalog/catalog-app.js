(function(){'use strict';
var data=window.ChristmasDriveCatalog; if(!data){document.getElementById('matrix-rows').textContent='The giving catalog could not be loaded.';return;}
var p=document.getElementById('program'),a=document.getElementById('amount'),f=document.getElementById('frequency'),rows=document.getElementById('matrix-rows'),link=document.getElementById('give-link'),status=document.getElementById('copy-status');
var money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
data.tiers.forEach(t=>{var o=document.createElement('option');o.value=String(t.amount);o.textContent=money(t.amount);a.append(o);});
a.value='50';
function selection(){
 var amount=Number(a.value),tier=data.tiers.find(t=>t.amount===amount),cat=p.value,entry=tier.items[cat],flex=data.flexible[cat],freq=data.frequencies.find(x=>x.id===f.value);
 if(!entry&&flex)entry={title:flex.name,summary:flex.description};
 if(!entry||!freq)return null;
 return {amount,cat,title:entry.title,summary:entry.summary,frequency:freq.label};
}
function render(){
 var s=selection();if(!s)return;
 document.getElementById('chosen-amount').textContent=money(s.amount);
 document.getElementById('chosen-title').textContent=s.title;
 document.getElementById('chosen-desc').textContent=s.summary+'. Giving levels represent proposed program support, not guaranteed units or a completed purchase.';
 document.getElementById('chosen-frequency').textContent=s.frequency;
 var q=new URLSearchParams({amount:String(s.amount),category:s.cat,frequency:f.value,gift:s.title});link.href='../give/?'+q.toString()+'#give';
 status.textContent='Planning only. No charge, subscription, or gift delivery has occurred.';
}
rows.replaceChildren();
data.tiers.forEach(t=>{
 var tr=document.createElement('tr');var c=document.createElement('td');c.textContent=money(t.amount);tr.append(c);
 ['toys','clothing','food'].forEach(cat=>{var td=document.createElement('td'),button=document.createElement('button');button.type='button';button.textContent=t.items[cat].title;button.setAttribute('aria-label',money(t.amount)+' '+t.items[cat].title);button.addEventListener('click',()=>{p.value=cat;a.value=String(t.amount);render();document.getElementById('builder').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});td.append(button);tr.append(td);});rows.append(tr);
});
[p,a,f].forEach(x=>x.addEventListener('change',render));
document.getElementById('copy-plan').addEventListener('click',()=>{
 var s=selection();if(!s)return;
 var note='CHRISTMAS TOY DRIVE — GIVING PLAN\n'+s.title+'\nAmount: '+money(s.amount)+'\nCategory: '+s.cat+'\nSchedule: '+s.frequency+'\nCash App: $DOGGODjnt\n\nThis is not a donation receipt. Payment, item purchase and delivery have NOT been confirmed. Monthly plans are not automatically charged.';
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(note).then(()=>status.textContent='Giving plan copied. No money transferred.').catch(()=>status.textContent='Copy access is unavailable in this browser.');
 else status.textContent='Copy access is unavailable in this browser.';
});
render();
})();