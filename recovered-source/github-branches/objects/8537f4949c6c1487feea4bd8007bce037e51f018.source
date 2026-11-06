/* Nathan AI recovery atlas. Additive public metadata, owner-selected source stays in this tab. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const state = { base: [], local: [], limit: 48, query: '', kind: '', category: '', status: '' };
  const elt = (tag, value) => {
    const node = document.createElement(tag);
    if (value !== undefined) node.textContent = String(value);
    return node;
  };
  const sourceLink = (row, label, href) => {
    if (!href) return null;
    const a = elt('a', label);
    a.href = href;
    if (/^https:/.test(href)) {
      a.rel = 'noopener noreferrer';
      a.target = '_blank';
    }
    return a;
  };
  function rowsFrom(registry, games) {
    const interfaces = registry.interfaces.map(x => ({
      kind: 'interface', name: x.name, category: x.category, status: x.status,
      detail: x.path, href: x.href, source_url: x.source_url
    }));
    const gameRows = games.map(x => ({
      kind: 'game', name: x.title, category: x.category, status: x.stage,
      detail: 'Existing original Games Atlas title; consult its own source and lifecycle stage.',
      href: x.href ? '../games/' + x.href : '../games/index.html',
      source_url: null
    }));
    const systems = registry.systems.map(x => ({
      kind: 'system', name: x.name, category: x.category, status: x.status,
      detail: x.source, href: x.href || null, source_url: null
    }));
    const anchors = registry.archive_anchors.map(x => ({
      kind: 'archive', name: x.name, category: x.category, status: x.status,
      detail: x.description, href: null, source_url: null
    }));
    return [...interfaces, ...gameRows, ...systems, ...anchors];
  }
  function redrawFilters() {
    const all = [...state.base, ...state.local];
    const categories = [...new Set(all.map(x => x.category))].sort();
    const statuses = [...new Set(all.map(x => x.status))].sort();
    for (const [id, options, initial] of [['category', categories, 'All categories'], ['status', statuses, 'All lifecycle stages']]) {
      const sel = $(id), prev = sel.value;
      sel.replaceChildren();
      const empty = elt('option', initial); empty.value = ''; sel.append(empty);
      for (const value of options) { const o = elt('option', value); o.value = value; sel.append(o); }
      if (options.includes(prev)) sel.value = prev;
      else { sel.value = ''; state[id] = ''; }
    }
  }
  function selectedRows() {
    const q = state.query.toLocaleLowerCase();
    return [...state.base, ...state.local].filter(x =>
      (!state.kind || x.kind === state.kind) &&
      (!state.category || x.category === state.category) &&
      (!state.status || x.status === state.status) &&
      (!q || [x.name, x.category, x.status, x.detail, x.searchText || ''].join(' ').toLocaleLowerCase().includes(q))
    );
  }
  function render() {
    const matches = selectedRows();
    const list = $('records');
    list.replaceChildren();
    for (const row of matches.slice(0, state.limit)) {
      const article = elt('article'); article.className = 'card';
      const kind = elt('div', row.kind + ' · ' + row.status); kind.className = 'eyebrow';
      const title = elt('h3', row.name);
      const group = elt('small', row.category);
      const description = elt('p', row.detail || 'Original source details remain in its own project.');
      article.append(kind, title, group, description);
      const goto = sourceLink(row, row.kind === 'interface' ? 'Open existing route (if published)' :
        row.kind === 'game' ? 'Open Games Atlas / game route' : 'Open original module', row.href);
      if (goto) article.append(goto);
      const source = sourceLink(row, 'View source code', row.source_url);
      if (source) article.append(source);
      if(row.kind==='source' && isSafeReadableSource(row.path,row.size)) {
        const btn=elt('button','Read public source in Nathan AI');btn.type='button';
        btn.addEventListener('click',()=>openPublicSource(row,article));article.append(btn);
      }
      if (row.file) {
        const button = elt('button', 'Download selected original');
        button.type = 'button';
        button.addEventListener('click', () => {
          const url = URL.createObjectURL(row.file);
          const a = elt('a'); a.href = url; a.download = row.file.name;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        });
        article.append(button);
        if (row.searchText) {
          const details = elt('details');
          const summary = elt('summary', 'View local text preview');
          const pre = elt('pre', row.searchText.slice(0, 6000) + (row.searchText.length > 6000 ? '\n…preview clipped; original remains unchanged' : ''));
          details.append(summary, pre); article.append(details);
        }
      }
      list.append(article);
    }
    $('results-status').textContent = matches.length.toLocaleString() + ' matching records · ' +
      Math.min(state.limit, matches.length).toLocaleString() + ' shown · ' +
      state.base.length.toLocaleString() + ' public references + ' + state.local.length + ' owner-selected files';
    $('more').hidden = matches.length <= state.limit;
    if (!matches.length) list.append(elt('p', 'No matching source record. Try another search, or select an original file using the owner-source control.'));
  }

  // Public-source integration ledger: only filenames, source links and credential NAMES.
  // Connected accounts and private originals are NOT fetched from the browser.
  function auditedRows() {
    const serviceRows = [
      ['GitHub','repository readable; no production backend implied','https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core'],
      ['Airtable · ONE Master Index','10 tables; 44 recorded app modules; 13 connected-service records','https://airtable.com/app00zqqUnAe8uo4k'],
      ['Airtable · Crypto Assets','7 tables; wallet and exchange records not yet verified populated','https://airtable.com/app7ywDhJdAowJx2b'],
      ['Airtable · Crypto Mining Operations','12 tables: hardware, software, pools, performance, energy, profitability, maintenance, wallets, payouts, monitoring, dashboard and plan; telemetry not verified',''],
      ['Google Drive · Source & Project Library','folder identified; private bytes NOT copied into public site','https://drive.google.com/drive/folders/1i1lzNd3EvzIYSyWPT6nABU_VwrxG1Tfp'],
      ['Vercel','sign-in observed; zero accessible projects in November 2 inspection','https://vercel.com/'],
      ['Supabase','account activity observed; SQL schema remains unapplied','https://supabase.com/'],
      ['Datadog','11 template/integration dashboards; zero service entities observed','https://app.datadoghq.com/'],
      ['Notion','connected navigation; no continuous mirror established','https://www.notion.so/'],
      ['Canva','design tooling; no automated publication pipeline established','https://www.canva.com/'],
      ['Gmail','mail access; no automatic Nathan AI messaging enabled','https://mail.google.com/'],
      ['Google Calendar','calendar tooling; no Nathan AI schedule sync confirmed','https://calendar.google.com/'],
      ['Google Contacts','contact tooling; no CRM sync confirmed','https://contacts.google.com/'],
      ['Firecrawl','research tooling; no automatic ingestion verified','https://www.firecrawl.dev/'],
      ['Finances','separate private account analysis; NO public project data import','']
    ].map(([name,detail,source_url])=>({
      kind:'service',name,category:'Connected systems · audit metadata',
      status:'audited November 2, 2026; recheck live status',detail,
      source_url,href:null
    }));
    const credentialGroups = [
      ['ONE catalog API (open PR #63)','ONE_CATALOG_READ_TOKEN AIRTABLE_TOKEN ONE_AIRTABLE_BASE_ID ONE_AIRTABLE_TABLE_ID ONE_CATALOG_BIND ONE_CATALOG_PORT','https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/63'],
      ['ONE encrypted archive','ONE_SYNC_TOKEN ONE_DOMAIN ONE_ALLOWED_ORIGINS ONE_DATA_DIR PORT','https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/app-factory/one/lean-cloud/README.md'],
      ['Sovereign mining & wallet gateway','NATHAN_GATEWAY_TOKEN NATHAN_GATEWAY_PORT COINGECKO_DEMO_KEY COINGECKO_ENABLED XMRIG_ACCESS_TOKEN XMRIG_ENABLED XMRIG_PORT TWOMINERS_ADDRESS TWOMINERS_COIN BRAIINS_TOKEN BITCOIN_RPC_USER BITCOIN_RPC_PASSWORD BITCOIN_RPC_PORT BTCPAY_API_KEY BTCPAY_STORE_ID BTCPAY_BASE_URL ALCHEMY_API_KEY HA_TOKEN HA_ENTITY_ID HA_PORT PROMETHEUS_ENABLED PROMETHEUS_PORT GRAFANA_ENABLED GRAFANA_PORT GRAFANA_TOKEN','https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/app-factory/nathan-ai/sovereign-coins/integrations/README.md'],
      ['Earlier Mac bridge','OPENAI_API_KEY OPENROUTER_API_KEY','']
    ].map(([name,detail,source_url])=>({
      kind:'credential',name,category:'Configuration variable NAMES ONLY',
      status:'values NOT imported; connection unverified',
      detail:'Expected variable names: '+detail+'. The historically exposed earlier OpenAI key requires revocation verification.',
      source_url,href:null
    }));
    const patchNames = {
      54:'21-system infrastructure index',55:'Original Architecture 63',
      56:'21-part distributed ledger',57:'Cryptocurrency conspectus',
      58:'17-provider mining gateway · 10 read-only adapters',
      59:'53-Year Matrix',60:'BLACKJACK 21-move game',
      61:'Reversible Life Formula protocol',
      62:'Phi-life / Phi-mine reference',63:'Read-only Airtable API + draft Supabase RLS'
    };
    const patchRows = Object.entries(patchNames).map(([number,name])=>({
      kind:'patch',name:'PR #'+number+' · '+name,category:'GitHub patch history',
      status:'historical snapshot; check pull request for actual merge/CI',
      detail:'Owner source patch. Closed does not necessarily mean merged. Inspect GitHub for up-to-date state.',
      source_url:'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/'+number,href:null
    }));
    return [...serviceRows,...credentialGroups,...patchRows];
  }
  function isSafeReadableSource(path,size) {
    return size <= 160000 &&
      /\.(?:txt|md|markdown|csv|tsv|json|html|css|js|mjs|cjs|ts|tsx|jsx|py|sh|sql|xml|yaml|yml|toml|svg|c|h|rs|java|kt|swift)$/i.test(path) &&
      !/(?:^|\/)(?:\.env(?:\.|$)|secrets?\/|credentials?\/|private[_-]?key|seed[_-]?phrase)/i.test(path) &&
      !/\.(?:pem|p12|pfx|key)$/i.test(path);
  }
  async function loadPublicRepositoryTree() {
    const status=$('repo-status');
    try {
      const res=await fetch('https://api.github.com/repos/NathanAIoxr/Nathan-AI-Sovereign-Core/git/trees/main?recursive=1',
        {headers:{Accept:'application/vnd.github+json'}});
      if (!res.ok) throw Error('GitHub returned HTTP '+res.status);
      const data=await res.json();
      if (!Array.isArray(data.tree)) throw Error('Repository tree response not available');
      const blobs=data.tree.filter(x=>x.type==='blob'&&typeof x.path==='string');
      const fileRows=blobs.map(x=>{
        const path=x.path, suffix=(path.split('.').pop()||'file').toLowerCase();
        return {
          kind:'source',name:path.split('/').pop(),category:'GitHub public source · '+suffix,
          status:'file on public main; runtime not implied',
          detail:path+' · '+Number(x.size||0).toLocaleString()+' bytes · Git blob '+String(x.sha||'').slice(0,12),
          path,size:Number(x.size||0),blob_sha:String(x.sha||''),
          searchText:path,source_url:'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/'+
            path.split('/').map(encodeURIComponent).join('/'),href:null
        };
      });
      state.base.push(...fileRows);
      $('repo-file-count').textContent=fileRows.length.toLocaleString();
      status.textContent='GitHub main tree read · '+fileRows.length.toLocaleString()+
        ' public source files indexed; source bytes remain in GitHub.'+
        (data.truncated?' GitHub marked this listing TRUNCATED; it is not exhaustive.':'');
      redrawFilters();render();
    } catch (error) {
      $('repo-file-count').textContent='—';
      status.textContent='Live GitHub tree unavailable ('+error.message+
        '). Existing published interface registry and source links remain accessible. No files were deleted.';
    }
  }
  async function openPublicSource(row,article) {
    const old=article.querySelector('pre.source-viewer');
    if (old) {old.remove();return;}
    const pre=elt('pre','Reading selected public source…');pre.className='source-viewer';
    article.append(pre);
    try {
      const raw='https://raw.githubusercontent.com/NathanAIoxr/Nathan-AI-Sovereign-Core/main/'+
        row.path.split('/').map(encodeURIComponent).join('/');
      const resp=await fetch(raw);
      if (!resp.ok) throw Error('HTTP '+resp.status);
      const code=await resp.text();
      if(code.length>180000)throw Error('Source exceeds safe inline preview size');
      pre.textContent=code; // NEVER inject source as HTML, evaluate or run scripts.
    }catch(e){pre.textContent='Inline preview unavailable: '+e.message+'. Use the GitHub source link.';}
  }
  function exportRecoveryManifest() {
    const data={
      schema:'nathan-ai.owner-recovery-manifest.v1',exported_at:new Date().toISOString(),
      warning:'Metadata and source references only: NOT an original-byte backup or evidence of live integrations.',
      records:[...state.base,...state.local].map(x=>({
        kind:x.kind,name:x.name,category:x.category,status:x.status,detail:x.detail,
        source_url:x.source_url||null,path:x.path||x.file?.webkitRelativePath||null,
        size_bytes:x.file?.size??x.size??null,git_blob_sha:x.blob_sha||null,
        original_bytes_included:false
      }))
    };
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a=elt('a');a.href=url;a.download='NATHAN_AI_RECOVERY_METADATA_'+new Date().toISOString().slice(0,10)+'.json';
    document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }

  function watchFilters() {
    for (const id of ['kind', 'category', 'status']) {
      $(id).addEventListener('change', () => { state[id] = $(id).value; state.limit = 48; render(); });
    }
    $('q').addEventListener('input', () => { state.query = $('q').value.trim(); state.limit = 48; render(); });
    $('more').addEventListener('click', () => { state.limit += 48; render(); });
  }
  async function load() {
    try {
      const [a, b] = await Promise.all([
        fetch('./registry.json', {cache:'no-store'}),
        fetch('../games/catalog.json', {cache:'no-store'})
      ]);
      if (!a.ok || !b.ok) throw Error('Missing source index (HTTP ' + a.status + '/' + b.status + ')');
      const registry = await a.json();
      const catalog = await b.json();
      if (registry.schema !== 'nathan-ai.build-recovery.v1' ||
          !Array.isArray(registry.interfaces) || !Array.isArray(registry.systems) ||
          !Array.isArray(registry.archive_anchors) || !Array.isArray(catalog.entries))
        throw Error('Invalid archive index format');
      state.base = rowsFrom(registry, catalog.entries).concat(auditedRows());
      $('page-count').textContent = registry.interfaces.length.toLocaleString();
      $('game-count').textContent = catalog.entries.length.toLocaleString();
      $('system-count').textContent = registry.systems.length.toLocaleString();
      $('archive-count').textContent = registry.archive_anchors.length.toLocaleString();
      $('source-meta').textContent = 'Version: ' + registry.schema + ' · Snapshot: ' + registry.as_of +
        ' · Public source paths and prior recovery metadata only; private archives are not imported automatically.';
      redrawFilters(); render();
    } catch (err) {
      $('results-status').textContent = 'The public catalog did not load: ' + err.message + '. Existing links above still work.';
      $('source-meta').textContent = 'Static GitHub Pages or HTTP serving is needed for JSON loading. Opening this HTML directly as file:// may block fetch.';
    }
  }
  async function ownerImport(files) {
    const selected = Array.from(files || []);
    if(selected.length>20000){$('owner-status').textContent='More than 20,000 selected files: import in batches or use the Creator Vault ZIP importer. Nothing silently skipped.';return;}
    let added = 0;
    for (const file of selected) {
      if (state.local.some(x => x.file === file)) continue;
      const readable = /\.(txt|md|markdown|csv|tsv|json|html|py|js|cjs|mjs|xml|yaml|yml)$/i.test(file.name) && !/(?:\.env|private.?key|secret|seed.?phrase|password|credential)/i.test(file.name);
      let searchText = '';
      if (readable && file.size <= 1024 * 1024 && added < 40) {
        try { searchText = await file.text(); } catch (_) { searchText = ''; }
      }
      state.local.push({
        kind: 'owner', name: file.webkitRelativePath || file.name, category: 'Owner-selected sources',
        status: 'tab-only, original unchanged',
        detail: file.size.toLocaleString() + ' bytes · original file · ' +
          (searchText ? 'local text search available' : 'binary / over-limit / unreadable preview'),
        searchText, file, href: null, source_url: null
      }); added += 1;
    }
    $('owner-status').textContent = state.local.length + ' selected source file(s) in this tab. ' +
      (added ? added + ' newly included. ' : '') + 'Nothing uploaded or published.';
    $('clear-owner').disabled = !state.local.length;
    redrawFilters(); render();
  }
  $('owner-import').addEventListener('change', e => {
    ownerImport(e.target.files).catch(() => { $('owner-status').textContent = 'One or more selected files could not be read in this browser.'; });
  });
  $('clear-owner').addEventListener('click', () => {
    state.local = [];
    $('owner-import').value = '';
    $('owner-status').textContent = 'Owner-selected files cleared from this tab view.';
    $('clear-owner').disabled = true;
    redrawFilters(); render();
  });
  $('export-source-manifest').addEventListener('click',exportRecoveryManifest);
  $('owner-folder').addEventListener('change',e=>{
    ownerImport(e.target.files).catch(()=>{$('owner-status').textContent='Selected folder could not be indexed.';});
  });
  watchFilters();
  load().then(loadPublicRepositoryTree);
})();
