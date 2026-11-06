/* Nathan AI — owner-selected source recovery. Never uploads local files. */
(() => {
  'use strict';
  const DB_NAME = 'nathan-ai-private-source-intake-v1';
  const MAX_FILE = 128 * 1024 * 1024;
  const MAX_PREVIEW = 2 * 1024 * 1024;
  const $ = id => document.getElementById(id);
  const state = { db: null, rows: [] };
  const enc = new TextEncoder();
  const fmtBytes = n => (n / 1048576).toFixed(n < 1048576 ? 3 : 1) + ' MiB';
  const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  const text = (element, value) => { element.textContent = String(value); return element; };
  const item = (tag, value) => text(document.createElement(tag), value);
  const status = message => text($('status'), message);
  function secretFilename(name) {
    return /(^|\/)(\.env(?:\.|$)|id_rsa|id_ed25519|.*\.(?:pem|p12|pfx|key)$|.*(?:seed.phrase|recovery.phrase|private.key|secret.key))/i.test(name);
  }
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('originals')) db.createObjectStore('originals', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('Another tab is blocking the local vault database.'));
    });
  }
  function read(store, key) {
    return new Promise((resolve, reject) => {
      const req = state.db.transaction(store, 'readonly').objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  function readAll(store) {
    return new Promise((resolve, reject) => {
      const req = state.db.transaction(store, 'readonly').objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  function write(store, value, key) {
    return new Promise((resolve, reject) => {
      const tx = state.db.transaction(store, 'readwrite');
      if (key === undefined) tx.objectStore(store).put(value);
      else tx.objectStore(store).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  function remove(store, key) {
    return new Promise((resolve, reject) => {
      const tx = state.db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  async function sha256(input) {
    return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', input)));
  }
  async function archiveKey() {
    const password = $('pass').value;
    if (password.length < 12) throw new Error('Enter your private vault passphrase (12 or more characters).');
    let salt = await read('settings', 'salt');
    if (!salt) {
      salt = Array.from(crypto.getRandomValues(new Uint8Array(16)));
      await write('settings', salt, 'salt');
    }
    const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      {name:'PBKDF2',salt:new Uint8Array(salt),iterations:250000,hash:'SHA-256'},
      base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']
    );
    const sentinel = await read('settings', 'key-check');
    if (sentinel) {
      try {
        const plain = await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(sentinel.iv)},key,sentinel.bytes);
        if (new TextDecoder().decode(plain) !== 'NATHAN-AI-ORIGINAL-VAULT-v1') throw new Error('Incorrect passphrase.');
      } catch (_) { throw new Error('Wrong vault passphrase; existing originals were not changed.'); }
    } else {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const bytes = await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode('NATHAN-AI-ORIGINAL-VAULT-v1'));
      await write('settings',{iv:Array.from(iv),bytes},'key-check');
    }
    return key;
  }
  async function getOriginal(row, key) {
    return crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(row.iv)},key,row.ciphertext);
  }
  function download(blob, name) {
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(href), 30000);
  }
  function render() {
    const q = $('search').value.trim().toLowerCase();
    const matches = state.rows.filter(r =>
      [r.name,r.source,r.relativePath,r.sha256].join(' ').toLowerCase().includes(q)
    );
    const total = state.rows.reduce((s,r) => s + r.size,0);
    text($('counts'), state.rows.length.toLocaleString() + ' locally encrypted source entries · ' + fmtBytes(total) + ' original bytes before encryption.');
    const root = $('records'); root.replaceChildren();
    for (const r of matches.slice(0,120)) {
      const card = document.createElement('article'); card.className = 'card';
      const h = item('h3', r.name);
      const sub = item('small', r.source + ' · ' + (r.relativePath || r.name) + ' · ' + fmtBytes(r.size));
      const digest = item('p', 'SHA-256 ' + r.sha256.slice(0,24) + '…');
      const when = item('small', 'Imported ' + r.importedAt);
      const actions = document.createElement('div'); actions.className = 'record-actions';
      const restore = item('button','Download original');
      restore.type='button';
      restore.addEventListener('click', async () => {
        try {
          const key = await archiveKey();
          const plain = await getOriginal(r,key);
          download(new Blob([plain],{type:r.type || 'application/octet-stream'}),r.name);
          status('Original recovered locally: ' + r.name);
        } catch(e) { status(e.message); }
      });
      actions.append(restore);
      if (r.size <= MAX_PREVIEW && /\.(?:txt|md|markdown|csv|tsv|json|js|mjs|cjs|py|html|css|ts|tsx|jsx|xml|yaml|yml|sql|sh|ps1)$/i.test(r.name)) {
        const preview = item('button','Preview locally');
        preview.type='button';
        preview.addEventListener('click', async () => {
          try {
            const key = await archiveKey();
            const plain = await getOriginal(r,key);
            text($('preview'),new TextDecoder().decode(plain).slice(0,30000));
            status('Decrypted original preview only in this browser tab.');
          } catch(e) { status(e.message); }
        });
        actions.append(preview);
      }
      const del = item('button','Remove local copy');
      del.type='button';
      del.addEventListener('click', async () => {
        if (!confirm('Delete only this encrypted local copy? Original source files elsewhere are not affected.')) return;
        try { await remove('originals',r.id); text($('preview'),'Preview cleared.'); await refresh(); status('Local copy removed; external original unchanged.'); }
        catch(e) {status(e.message);}
      });
      actions.append(del);
      card.append(h,sub,digest,when,actions);root.append(card);
    }
    text($('result-summary'),matches.length.toLocaleString() + ' matching originals; first ' + Math.min(120,matches.length) + ' displayed.');
  }
  async function refresh() {
    const all = await readAll('originals');
    state.rows = all.sort((a,b) => a.name.localeCompare(b.name) || a.importedAt.localeCompare(b.importedAt));
    render();
  }
  async function importFiles() {
    const files = [...$('file-import').files,...$('folder-import').files];
    if (!files.length) { status('Choose a file or folder first.'); return; }
    $('import').disabled=true;
    let added=0,duplicate=0,refused=0,failed=0;
    try {
      const key = await archiveKey();
      const source = $('source').value;
      for (const f of files) {
        const path = f.webkitRelativePath || f.name;
        if (secretFilename(path) || f.size > MAX_FILE) { refused++; continue; }
        try {
          const bytes = await f.arrayBuffer();
          const hash = await sha256(bytes);
          const id = await sha256(enc.encode(source+'\0'+path+'\0'+hash));
          if (await read('originals',id)) {duplicate++;continue;}
          const iv = crypto.getRandomValues(new Uint8Array(12));
          const ciphertext = await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes);
          await write('originals',{id,sha256:hash,name:f.name,relativePath:path,source,size:f.size,
            type:f.type,importedAt:new Date().toISOString(),iv:Array.from(iv),ciphertext});
          added++;
        } catch (e) { failed++; status('A local file failed: '+f.name+' ('+e.message+')'); }
      }
      await refresh();
      status('Imported '+added+' originals; skipped '+duplicate+' identical entries; refused '+refused+
        ' sensitive/oversized filenames; failed '+failed+'. No remote upload.');
      $('pass').value='';
      $('file-import').value='';$('folder-import').value='';
    } catch (e) {status(e.message);}
    finally {$('import').disabled=false;}
  }
  function exportManifest() {
    const manifest = {schema:'nathan-ai-private-source-intake-manifest-v1',exportedAt:new Date().toISOString(),
      note:'Metadata only; does not contain original bytes or restore an archive.',
      records:state.rows.map(({id,sha256,name,relativePath,source,size,type,importedAt}) =>
        ({id,sha256,name,relativePath,source,size,type,importedAt}))};
    download(new Blob([JSON.stringify(manifest,null,2)],{type:'application/json'}),'NATHAN_AI_AZ_SOURCE_MANIFEST.json');
    status('Metadata manifest downloaded. Encrypted original bytes stay in this browser.');
  }
  async function init() {
    if (!globalThis.isSecureContext || !globalThis.crypto?.subtle || !globalThis.indexedDB) {
      status('Secure-context Web Crypto and IndexedDB are required; use HTTPS in a supported browser.');
      $('import').disabled=true;return;
    }
    try {
      state.db=await openDB();
      await refresh();
      status('Local vault ready. No files have been uploaded.');
    } catch (e) {status('Could not open private browser vault: '+e.message);$('import').disabled=true;}
  }
  $('import').addEventListener('click',importFiles);
  $('clear').addEventListener('click',()=>{$('file-import').value='';$('folder-import').value='';$('pass').value='';status('File selections and passphrase cleared. Stored files unchanged.');});
  $('search').addEventListener('input',render);
  $('export-manifest').addEventListener('click',exportManifest);
  $('refresh').addEventListener('click',()=>refresh().catch(e=>status(e.message)));
  init();
})();