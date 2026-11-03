const {test}=require('node:test');
const assert=require('node:assert/strict');
const api=require('./engine.js');
const provenance={dataKind:'owner-record',verification:'unverified',evidence:'',notes:''};
const project=(extra={})=>({...provenance,name:'Build the workspace',status:'active',...extra});
const wallet=(extra={})=>({...provenance,name:'Watch only',blockchain:'bitcoin',address:'public-address-placeholder',type:'watch-only',...extra});
const asset=(extra={})=>({...provenance,name:'Bitcoin',symbol:'BTC',blockchain:'bitcoin',wallet:'w1',amount:'0.1',asOf:'2026-11-03',...extra});
let counter=0;const opts={id:()=>`record_${++counter}`,now:()=> '2026-11-03T12:00:00.000Z'};
const put=(s,table,record)=>api.apply(s,[{table,record}],opts);
const base=()=>put(api.empty(),'wallets',wallet({id:'w1'}));
test('clean workspace has eight empty tables and no invented holdings or balances',()=>{
 const s=api.empty();assert.equal(Object.keys(s.records).length,8);assert.equal(Object.values(s.records).flat().length,0);assert.deepEqual(api.portfolio(s),[]);assert.deepEqual(api.parse(JSON.stringify(s)),s);
});
test('exact decimal arithmetic preserves atomic units and large balances',()=>{
 assert.equal(api.sum('0.1','0.2'),'0.3');assert.equal(api.sum('99999999999999999999999999999999','0.000000000000000001'),'99999999999999999999999999999999.000000000000000001');assert.equal(api.decimal('000.01000'),'0.01');for(const x of ['-1','NaN','1e10','0.0000000000000000001','1,000'])assert.throws(()=>api.decimal(x));
});
test('updates are transactional, audited, and preserve original input',()=>{
 const s=put(api.empty(),'projects',project({id:'p1'}));assert.equal(s.revision,1);assert.equal(s.audit[0].action,'create');const next=put(s,'projects',{...s.records.projects[0],status:'complete'});assert.equal(s.records.projects[0].status,'active');assert.equal(next.audit[1].action,'update');assert.equal(next.revision,2);
 assert.throws(()=>api.apply(next,[{table:'tasks',record:{...provenance,name:'Missing parent',project:'unknown',status:'todo',priority:'normal'}}],opts),/missing project/);assert.equal(next.revision,2);
});
test('references prevent orphan deletion and chain mismatch',()=>{
 let s=base();s=put(s,'assets',asset({id:'a1'}));assert.throws(()=>api.apply(s,[{table:'wallets',action:'delete',record:s.records.wallets[0]}],opts),/missing wallet/);assert.throws(()=>put(s,'assets',asset({blockchain:'ethereum'})),/blockchain must match/);assert.equal(s.records.wallets.length,1);
});
test('deduplication retains chain-sensitive public address identity',()=>{
 const s=base();assert.throws(()=>put(s,'wallets',wallet()),/Duplicate Wallet/);const next=put(s,'wallets',wallet({address:'Public-address-placeholder'}));assert.equal(next.records.wallets.length,2);assert.throws(()=>put(put(s,'assets',asset()),'assets',asset()),/Duplicate Crypto/);
});
test('transaction event identity supports separate transfers and rejects replays',()=>{
 const tx={...provenance,name:'Receipt',blockchain:'bitcoin',txid:'a'.repeat(64),wallet:'w1',symbol:'BTC',date:'2026-11-03',incoming:'0.2',status:'confirmed'};
 const s=put(base(),'transactions',tx);assert.throws(()=>put(s,'transactions',tx),/Duplicate Transactions/);assert.equal(put(s,'transactions',{...tx,eventIndex:'1'}).records.transactions.length,2);assert.throws(()=>put(base(),'transactions',{...tx,incoming:'0',outgoing:'0'}),/incoming or outgoing/);assert.throws(()=>put(base(),'transactions',{...tx,fee:'0.1'}),/fee asset/);
});
test('portfolio keeps imported and estimated balances apart from owner verification',()=>{
 let s=base();const values=[{amount:'0.1',verification:'owner-verified',evidence:'receipt-1',costBasis:'100',currency:'USD'},{amount:'0.2',dataKind:'imported-record',verification:'owner-verified',evidence:'import-1'},{amount:'0.3',dataKind:'estimate'},{amount:'',dataKind:'missing',verification:'missing'},{amount:'0.4'}];
 for(let i=0;i<values.length;i++){s=put(s,'wallets',wallet({id:'wallet'+i,address:'public-'+i}));s=put(s,'assets',asset({...values[i],wallet:'wallet'+i}));}
 const [g]=api.portfolio(s);assert.equal(g.ownerVerified,'0.1');assert.equal(g.imported,'0.2');assert.equal(g.estimated,'0.3');assert.equal(g.unverified,'0.4');assert.equal(g.missing,1);assert.deepEqual(g.costBasis,{USD:'100'});
});
test('contract identity prevents adding unrelated tokens with identical tickers',()=>{
 let s=put(base(),'assets',asset({contract:'token-a'}));s=put(s,'assets',asset({contract:'token-b'}));assert.equal(api.portfolio(s).length,2);
});
test('verification and date claims require usable supporting fields',()=>{
 assert.throws(()=>api.record('assets',asset({verification:'owner-verified'})),/evidence/);assert.throws(()=>api.record('assets',asset({verification:'owner-verified',evidence:'receipt',amount:''})),/needs an amount/);assert.throws(()=>api.record('assets',asset({asOf:'2026-02-30'})),/calendar/);assert.throws(()=>api.record('assets',asset({costBasis:'3'})),/currency/);assert.throws(()=>api.record('assets',asset({dataKind:'missing'})),/missing verification/);
});
test('imports merge atomically, skip exact duplicates and preserve local audit',()=>{
 const s=base(),incoming=put(s,'projects',project({id:'p1'}));const result=api.merge(s,incoming,opts);assert.equal(result.added,1);assert.equal(result.skipped,1);assert.equal(result.state.audit.length,2);assert.equal(result.state.audit[1].action,'import');assert.equal(api.merge(result.state,incoming,opts).added,0);
 const changed=put(incoming,'wallets',{...incoming.records.wallets[0],name:'Conflicting label'});assert.throws(()=>api.merge(s,changed,opts),/Import conflict/);assert.equal(s.records.projects.length,0);
});
test('malformed backups, duplicate IDs, orphan refs and oversized input fail closed',()=>{
 assert.throws(()=>api.parse('{}'),/Unsupported/);assert.throws(()=>api.parse('x'.repeat(3000001)),/too large/);const s=base();s.records.projects.push(api.record('projects',project({id:'w1'})));assert.throws(()=>api.validate(s),/Duplicate/);const b=base();b.audit[0].action='faked';assert.throws(()=>api.validate(b),/audit/);
});
test('recognizable credentials are rejected and CSV formula cells are neutralized',()=>{
 for(const notes of ['password: example-value','private_key=example-value','api_key=example-value','xprv'+'A'.repeat(65),'a'.repeat(64)])assert.throws(()=>api.record('projects',project({notes})),/credentials/);
 assert.throws(()=>api.record('wallets',wallet({address:'xprv'+'A'.repeat(65)})),/credentials/);
 const s=put(api.empty(),'projects',project({name:'=HYPERLINK("example")'}));assert.match(api.csv('projects',s),/"'=HYPERLINK/);assert.equal(api.parse(JSON.stringify(s)).records.projects[0].name,'=HYPERLINK("example")');
});
