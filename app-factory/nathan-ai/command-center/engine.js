(function(root){
  'use strict';
  const SCHEMA='nathan-ai.command-center.v1',KEY=SCHEMA,MAX=2000;
  const f=(key,label,type='text',required=false,options)=>({key,label,type,required,options});
  const tables={
    projects:{title:'Projects',fields:[f('name','Project name','text',true),f('status','Stage','select',true,['planned','active','blocked','complete']),f('goal','Outcome','textarea'),f('due','Target date','date'),f('module','Nathan AI module','module')]},
    tasks:{title:'Build Tasks',fields:[f('name','Task','text',true),f('project','Project','projects',true),f('status','Status','select',true,['todo','doing','blocked','done']),f('priority','Priority','select',true,['normal','high','urgent']),f('due','Due date','date'),f('acceptance','Acceptance criteria','textarea')]},
    wallets:{title:'Wallet Registry',fields:[f('name','Wallet name','text',true),f('blockchain','Blockchain','text',true),f('address','Public receiving address','text',true),f('type','Wallet type','select',true,['hardware','software','exchange','watch-only','other'])]},
    assets:{title:'Crypto Assets',fields:[f('name','Asset name','text',true),f('symbol','Symbol','text',true),f('blockchain','Blockchain','text',true),f('contract','Contract / asset identifier (blank = native)'),f('wallet','Wallet','wallets',true),f('amount','Balance snapshot','decimal'),f('asOf','Balance date','date',true),f('costBasis','Cost basis','decimal'),f('currency','Cost basis currency')]},
    transactions:{title:'Transactions',fields:[f('name','Description','text',true),f('blockchain','Blockchain','text',true),f('txid','Transaction ID','text',true),f('eventIndex','Transfer / event index (default 0)'),f('wallet','Wallet','wallets',true),f('symbol','Asset symbol','text',true),f('date','Date','date',true),f('incoming','Incoming amount','decimal'),f('outgoing','Outgoing amount','decimal'),f('fee','Network fee','decimal'),f('feeSymbol','Network fee asset'),f('status','Confirmation','select',true,['unknown','pending','confirmed','failed'])]},
    exchanges:{title:'Exchanges',fields:[f('name','Exchange name','text',true),f('account','Account label (no login details)','text',true),f('status','Synchronization','select',true,['not-connected','manual-import','needs-review']),f('asOf','Last manual import','date')]},
    mining:{title:'Mining Rewards',fields:[f('name','Pool','text',true),f('symbol','Coin','text',true),f('amount','Reward amount','decimal',true),f('date','Payout date','date',true),f('wallet','Destination wallet','wallets',true),f('payoutId','Pool payout ID','text',true)]},
    reports:{title:'Portfolio Reports',fields:[f('name','Report name','text',true),f('date','Reporting date','date',true),f('summary','Source-separated balance summary','textarea',true)]}
  };
  const common=[f('dataKind','Record origin','select',true,['owner-record','imported-record','estimate','missing']),f('verification','Verification','select',true,['unverified','owner-verified','missing']),f('evidence','Evidence reference (public URL or record ID)'),f('notes','Notes','textarea')];
  const clone=x=>JSON.parse(JSON.stringify(x));
  function safe(value,allowHash=false){
    const s=String(value);
    if(/-----BEGIN[^\n]*PRIVATE KEY-----|\b(?:password|passphrase|seed[ _-]?phrase|recovery[ _-]?phrase|mnemonic|private[ _-]?key|api[ _-]?key|access[ _-]?token|secret)\s*[=:]\s*\S+|\b(?:sk-|ghp_|github_pat_)[A-Za-z0-9_-]{20,}|\b(?:xprv|tprv)[1-9A-HJ-NP-Za-km-z]{60,}|\b[5KL][1-9A-HJ-NP-Za-km-z]{50,51}\b/i.test(s.replace(/"\s*:\s*"/g,':'))||(!allowHash&&/\b(?:0x)?[a-f0-9]{64}\b/i.test(s)))throw Error('Possible credentials or private key detected. Use public references only.');
    return s;
  }
  // Exact base-10 arithmetic; no floating-point balances or implicit prices.
  function decimal(value){const s=String(value).trim();if(!/^\d{1,32}(?:\.\d{1,18})?$/.test(s))throw Error('Use a nonnegative decimal with up to 18 decimal places.');const [a,b='']=s.split('.');return BigInt(a).toString()+(b.replace(/0+$/,'')?'.'+b.replace(/0+$/,''):'');}
  function units(s){s=String(s);if(s.length>64||!/^\d+(?:\.\d{1,18})?$/.test(s))throw Error('Invalid decimal total.');const [a,b='']=s.split('.');return BigInt(a)*10n**18n+BigInt(b.padEnd(18,'0'));}
  function amount(n){const a=n/10n**18n,b=(n%10n**18n).toString().padStart(18,'0').replace(/0+$/,'');return a.toString()+(b?'.'+b:'');}
  const sum=(a,b)=>amount(units(a)+units(b));
  function date(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error('Use a valid calendar date.');return s;}
  function empty(){return {schema:SCHEMA,revision:0,records:Object.fromEntries(Object.keys(tables).map(k=>[k,[]])),audit:[]};}
  function record(table,input){
    const spec=tables[table];if(!spec||!input||typeof input!=='object'||Array.isArray(input))throw Error('Unknown table or invalid record.');
    const row={};
    for(const field of [...spec.fields,...common]){
      const raw=input[field.key]??'';if(typeof raw!=='string')throw Error(field.label+' must be text.');
      let value=raw.trim();if(value.length>(table==='reports'&&field.key==='summary'?1000000:field.type==='textarea'?16000:1000))throw Error(field.label+' is too long.');
      // Hashes and transaction IDs are public identifiers; do not treat them as keys.
      safe(value,['txid','contract','payoutId','evidence'].includes(field.key)||(table==='reports'&&field.key==='summary'));
      if(field.required&&!value)throw Error(field.label+' is required.');
      if(value&&field.type==='select'&&!field.options.includes(value))throw Error('Invalid '+field.label+'.');
      if(value&&field.type==='decimal')value=decimal(value);
      if(value&&field.type==='date')date(value);
      if(field.key==='symbol'||field.key==='currency'||field.key==='feeSymbol')value=value.toUpperCase();
      if(field.key==='blockchain')value=value.toLowerCase();
      if(field.key==='eventIndex'){value=value||'0';if(!/^\d{1,10}$/.test(value))throw Error('Event index must be a nonnegative integer.');value=String(Number(value));}
      row[field.key]=value;
    }
    if(input.id!==undefined){if(typeof input.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(input.id))throw Error('Invalid record ID.');row.id=input.id;}
    if(row.verification==='owner-verified'&&!row.evidence)throw Error('Owner verification requires an evidence reference.');
    if(row.dataKind==='missing'&&row.verification!=='missing')throw Error('Missing information must have missing verification.');
    if(table==='assets'&&Boolean(row.costBasis)!==Boolean(row.currency))throw Error('Cost basis needs both amount and currency.');
    if(table==='assets'&&row.verification==='owner-verified'&&!row.amount)throw Error('A verified balance needs an amount, including zero.');
    if(table==='transactions'&&row.fee&&!row.feeSymbol)throw Error('Specify the network fee asset.');
    if(table==='transactions'&&!units(row.incoming||'0')&&!units(row.outgoing||'0'))throw Error('Supply an incoming or outgoing amount.');
    return row;
  }
  const key=(table,r)=>{
    const join=(...v)=>JSON.stringify(v);
    switch(table){
      case 'wallets':return join(r.blockchain,r.address);
      case 'assets':return join(r.wallet,r.blockchain,r.symbol,r.contract);
      case 'transactions':return join(r.blockchain,r.txid,r.eventIndex,r.wallet,r.symbol);
      case 'exchanges':return join(r.name.toLowerCase(),r.account);
      case 'mining':return join(r.name.toLowerCase(),r.payoutId,r.symbol,r.wallet);
      default:return join(r.id);
    }
  };
  function validate(state){
    if(!state||state.schema!==SCHEMA||!Number.isSafeInteger(state.revision)||state.revision<0||!state.records||!Array.isArray(state.audit)||state.audit.length>10000)throw Error('Unsupported workspace backup.');
    const out=empty();out.revision=state.revision;let count=0;const ids=new Set();
    for(const table of Object.keys(tables)){
      if(!Array.isArray(state.records[table]))throw Error('Missing table: '+table);const seen=new Set();
      out.records[table]=state.records[table].map(input=>{
        const r=record(table,input);if(!r.id||ids.has(r.id))throw Error('Duplicate or missing record ID.');ids.add(r.id);
        const k=key(table,r);if(seen.has(k))throw Error('Duplicate '+tables[table].title+' record.');seen.add(k);count++;return r;
      });
    }
    if(count>MAX)throw Error('Workspace limit is '+MAX+' records. Export and split larger datasets.');
    for(const [table,rows] of Object.entries(out.records))for(const r of rows){
      if(r.project&&!out.records.projects.some(p=>p.id===r.project))throw Error('Task references a missing project.');
      if(r.wallet){const wallet=out.records.wallets.find(w=>w.id===r.wallet);if(!wallet)throw Error('Record references a missing wallet.');if(r.blockchain&&wallet.blockchain!==r.blockchain)throw Error('Record blockchain must match its wallet.');}
    }
    out.audit=state.audit.map(a=>{
      if(!a||!Number.isSafeInteger(a.revision)||a.revision<1||a.revision>state.revision||!['create','update','delete','import'].includes(a.action)||!tables[a.table]||typeof a.recordId!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(a.recordId)||typeof a.at!=='string'||!Number.isFinite(Date.parse(a.at)))throw Error('Invalid audit entry.');
      return {revision:a.revision,action:a.action,table:a.table,recordId:a.recordId,at:new Date(a.at).toISOString()};
    });
    if(JSON.stringify(out).length>3000000)throw Error('Workspace exceeds the 3 MB backup limit. Export and split larger datasets.');
    return out;
  }
  function apply(state,changes,{id=()=>root.crypto.randomUUID(),now=()=>new Date().toISOString()}={}){
    const out=validate(state);if(!Array.isArray(changes)||!changes.length||changes.length>MAX)throw Error('No changes or batch too large.');
    const rev=out.revision+1,at=now();
    for(const change of changes){
      const table=change.table;if(!tables[table])throw Error('Unknown table.');const rows=out.records[table];let row=record(table,change.record);row.id=row.id||id();const index=rows.findIndex(r=>r.id===row.id);
      let action=change.action||'save';
      if(action==='delete'){if(index<0)throw Error('Record no longer exists.');rows.splice(index,1);}
      else if(action==='save'){action=index<0?'create':'update';if(index<0)rows.push(row);else rows[index]=row;}
      else throw Error('Unsupported operation.');
      out.audit.push({revision:rev,action,table,recordId:row.id,at});
    }
    if(out.audit.length>10000)throw Error('Audit limit reached. Export a backup before starting a new workspace.');out.revision=rev;return validate(out);
  }
  function parse(text){if(typeof text!=='string'||text.length>3000000)throw Error('Backup is too large.');return validate(JSON.parse(text));}
  function merge(state,incoming,options={}){
    const base=validate(state),other=validate(incoming),changes=[];let skipped=0;
    for(const [table,rows] of Object.entries(other.records))for(const row of rows){
      const existing=base.records[table].find(r=>r.id===row.id||key(table,r)===key(table,row));
      if(existing){const a={...existing},b={...row};delete a.id;delete b.id;if(JSON.stringify(a)!==JSON.stringify(b))throw Error('Import conflict in '+tables[table].title+'. Existing records were kept.');if(existing.id!==row.id)throw Error('Duplicate identity has a different record ID. Keep the original IDs when importing linked records.');skipped++;}
      else changes.push({table,record:row});
    }
    if(!changes.length)return {state:base,added:0,skipped};const result=apply(base,changes,options);
    for(const a of result.audit)if(a.revision===result.revision)a.action='import';return {state:result,added:changes.length,skipped};
  }
  function portfolio(state){
    const valid=validate(state),groups=new Map();
    for(const r of valid.records.assets){
      const k=JSON.stringify([r.blockchain,r.symbol,r.contract]);if(!groups.has(k))groups.set(k,{blockchain:r.blockchain,symbol:r.symbol,contract:r.contract,ownerVerified:'0',unverified:'0',imported:'0',estimated:'0',missing:0,costBasis:{}});const g=groups.get(k);
      if(r.amount===''||r.dataKind==='missing'){g.missing++;continue;}
      const bucket=r.dataKind==='estimate'?'estimated':r.dataKind==='imported-record'?'imported':r.verification==='owner-verified'?'ownerVerified':'unverified';g[bucket]=sum(g[bucket],r.amount);
      if(bucket==='ownerVerified'&&r.costBasis)g.costBasis[r.currency]=sum(g.costBasis[r.currency]||'0',r.costBasis);
    }
    return [...groups.values()];
  }
  function csv(table,state){const fields=tables[table].fields.concat(common),quote=x=>'"'+String(/^[\s]*[=+@\-\t\r]/.test(String(x))?"'"+x:x).replace(/"/g,'""')+'"';return [fields.map(f=>quote(f.label)).join(','),...validate(state).records[table].map(r=>fields.map(f=>quote(r[f.key])).join(','))].join('\r\n');}
  const api={SCHEMA,KEY,tables,common,MAX,empty,record,validate,apply,parse,merge,portfolio,csv,decimal,sum};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NathanCommandCenter=api;
})(typeof globalThis!=='undefined'?globalThis:this);
