'use strict';
(() => {
  const STORAGE = 'nathan:bossman-dog:notes:v1';
  const SKIN = 'nathan:bossman-dog:skin:v1';
  const skins = new Set(['concrete','atlas','caseboard','signal']);
  let data = null;
  let entries = [];
  const $ = (id) => document.getElementById(id);
  function safeRead(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } }
  function save() { try { localStorage.setItem(STORAGE, JSON.stringify(entries)); return true; } catch { message('Local storage unavailable; use Export JSON while this page is open.'); return false; } }
  function message(s) { $('message').textContent = s; }
  function el(tag, text, className) { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (className) e.className = className; return e; }
  function clearAndRender(container, rows, make) {
    container.replaceChildren();
    if (!rows.length) { container.append(el('p','No matching records.')); return; }
    for (const row of rows) container.append(make(row));
  }
  function switchSkin(skin) {
    if (!skins.has(skin)) return;
    document.body.dataset.skin = skin;
    document.querySelectorAll('[data-theme]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.theme === skin)));
    try { localStorage.setItem(SKIN, JSON.stringify(skin)); } catch { /* private mode */ }
  }
  function identityCard(item) {
    const card = el('article',undefined,'tile');
    card.append(el('strong',item.name), el('p',item.kind,'eyebrow'),el('p',item.source,'hint'),el('small',item.status,'status'));
    return card;
  }
  function archiveCard(item) {
    const card = el('article',undefined,'tile');
    card.append(el('strong',item.title),el('p',item.scope),el('p','Source: '+item.provenance,'hint'),el('small',item.availability,'status-open'));
    return card;
  }
  function laneCard(item) {
    const card = el('article',undefined,'tile');
    card.append(el('strong',item.name),el('p',item.scope),el('p',item.note,'hint'),el('small','RESEARCH LANE / '+item.status.toUpperCase(),'status-open'));
    return card;
  }
  function renderIdentities() {
    const q = $('identity-search').value.trim().toLowerCase();
    const list = data.identities.filter(r => (r.name+' '+r.kind+' '+r.source).toLowerCase().includes(q));
    $('identity-count').textContent = '('+list.length+'/'+data.identities.length+')';
    clearAndRender($('identities'),list,identityCard);
  }
  function validatedDraft(item) {
    if (!item || typeof item !== 'object') return null;
    const lane = String(item.lane || '');
    if (!data.researchLanes.some(x => x.id === lane)) return null;
    const title = String(item.title || '').slice(0,160).trim();
    const url = String(item.url || '').slice(0,2048).trim();
    const note = String(item.note || '').slice(0,4000);
    const allowed = ['unverified','source-attached','independently-reviewed'];
    const state = allowed.includes(item.state) ? item.state : 'unverified';
    if (!title || (url && !/^https?:\/\//i.test(url)) || (state !== 'unverified' && !url)) return null;
    const savedAt = Number.isFinite(item.savedAt) ? item.savedAt : Date.now();
    return {id:typeof item.id === 'string' && item.id.length <= 80 ? item.id : String(savedAt)+'-'+Math.random().toString(36).slice(2),lane,title,url,note,state,savedAt};
  }
  function renderEntries() {
    $('evidence-count').textContent = '('+entries.length+')';
    clearAndRender($('evidence-list'),entries.slice().reverse(),item => {
      const lane = data.researchLanes.find(x => x.id === item.lane);
      const d = el('article',undefined,'record');
      d.append(el('strong',item.title));
      const when = new Date(item.savedAt);
      d.append(el('div',(lane?.name || item.lane)+' · '+item.state+' · '+(Number.isNaN(when.getTime()) ? 'unknown date' : when.toLocaleString()),'meta'));
      if (item.note) d.append(el('p',item.note));
      if (item.url) {
        const link=el('a','Open cited source');
        link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';
        d.append(link);
      }
      const remove = el('button','Remove local note');
      remove.type='button';remove.addEventListener('click',() => { entries=entries.filter(x=>x.id!==item.id);save();renderEntries(); });
      d.append(el('div'),remove);
      return d;
    });
  }
  function download() {
    const payload = {format:'nathan-bossman-dog-local-evidence-v1',exportedAt:new Date().toISOString(),entries};
    const obj = new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(obj), a = document.createElement('a');
    a.href=url;a.download='bossman-dog-local-evidence.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
    message('Local JSON backup prepared. Drafts are not submitted to GitHub.');
  }
  function wire() {
    document.querySelectorAll('[data-theme]').forEach(b => b.addEventListener('click',()=>switchSkin(b.dataset.theme)));
    switchSkin(safeRead(SKIN,'concrete'));
    $('identity-search').addEventListener('input',renderIdentities);
    $('evidence-form').addEventListener('submit',evt=>{
      evt.preventDefault();
      const raw = {lane:$('lane-select').value,state:$('state-select').value,title:$('record-title').value,url:$('record-url').value,note:$('record-note').value,savedAt:Date.now()};
      const valid = validatedDraft(raw);
      if (!valid) { message('Enter a title, and supply a public http(s) source URL for reviewed states.'); return; }
      entries.push(valid);save();renderEntries();$('evidence-form').reset();message('Saved in this browser only. No external investigation started.');
    });
    $('export').addEventListener('click',download);
    $('clear').addEventListener('click',()=> { if (!window.confirm('Delete all local BOSSMAN × DOG evidence drafts from this browser? Export first to preserve them.')) return; entries=[];save();renderEntries();message('Local drafts cleared.'); });
    $('import').addEventListener('change',async evt=>{
      const file = evt.target.files?.[0]; if (!file) return;
      if (file.size > 2_000_000) { message('Backup too large (2 MB limit).'); return; }
      try {
        const payload=JSON.parse(await file.text());
        if (payload.format!=='nathan-bossman-dog-local-evidence-v1' || !Array.isArray(payload.entries)) throw Error('Backup format not recognized');
        const loaded=payload.entries.slice(0,300).map(validatedDraft).filter(Boolean);
        const map=new Map(entries.map(x=>[x.id,x]));
        for(const entry of loaded)if(!map.has(entry.id))map.set(entry.id,entry);
        entries=Array.from(map.values()).slice(-500);save();renderEntries();
        message('Imported '+loaded.length+' valid local records. Prior local records retained.');
      } catch(e) { message('Import failed: '+e.message); }
      evt.target.value='';
    });
  }
  async function start() {
    wire();
    try {
      const response=await fetch('records.json',{cache:'no-store'});
      if(!response.ok) throw Error('Source register HTTP '+response.status);
      data=await response.json();
      if(!Array.isArray(data.identities) || !Array.isArray(data.researchLanes) || !Array.isArray(data.archiveLeads))throw Error('Invalid source register');
      clearAndRender($('archive-leads'),data.archiveLeads,archiveCard);
      clearAndRender($('research-lanes'),data.researchLanes,laneCard);
      for(const lane of data.researchLanes){const opt=document.createElement('option');opt.value=lane.id;opt.textContent=lane.name;$('lane-select').append(opt);}
      entries=(Array.isArray(safeRead(STORAGE,[])) ? safeRead(STORAGE,[]) : []).slice(-500).map(validatedDraft).filter(Boolean);
      renderIdentities();renderEntries();message('Four visual treatments ready · source register loaded · local evidence notebook active.');
    } catch(e) {
      $('identities').textContent='Register not available. Use a local web server instead of file:// to load records.json.';
      $('archive-leads').textContent='Source register unavailable.';
      $('research-lanes').textContent='Source register unavailable.';
      $('evidence-form').querySelectorAll('input,textarea,select,button').forEach(x=>x.disabled=true);
      message('Unable to load records.json: '+e.message);
    }
  }
  start();
})();
