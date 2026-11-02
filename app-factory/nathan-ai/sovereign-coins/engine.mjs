/* Nathan AI — Sovereign Coin Matrix: deterministic local design ledger.
 * No chain connection, mining, token issuance, proxy routing, or wallet authorization.
 */
export const LEDGER_SCHEMA = 'nathan-ai.sovereign-coin-ledger.v1';
export const DESIGN_RATIO = 16;

export function validateRegistry(source) {
  const issues = [];
  const coins = source && source.coins;
  if (!Array.isArray(coins) || coins.length !== 21)
    return {ok:false,issues:['Expected exactly 21 sovereign coin rings.'],count:Array.isArray(coins)?coins.length:0};
  const seen = new Set();
  coins.forEach((c,i)=>{
    if (c.number !== i+1) issues.push('Incorrect ring number at index '+i);
    if (!/^[A-Z0-9]{3}$/.test(c.ticker||'')) issues.push('Invalid ticker: '+String(c.ticker));
    if (seen.has(c.ticker)) issues.push('Duplicate ticker: '+c.ticker);
    seen.add(c.ticker);
    if (!c.name || !c.definition) issues.push('Missing name or definition: '+c.ticker);
    if (!Number.isSafeInteger(c.initial_design_units)||c.initial_design_units<0)
      issues.push('Invalid design units: '+c.ticker);
    const expected = (c.ticker==='SIN'||c.ticker==='SEN')?1000000:0;
    if (c.initial_design_units!==expected) issues.push('Changed original foundation: '+c.ticker);
  });
  if (coins[0]?.ticker!=='SIN'||coins[1]?.ticker!=='SEN')
    issues.push('The source order of SIN and SEN was changed.');
  return {ok:issues.length===0,issues,count:coins.length};
}

export function createLedger(createdAt = new Date().toISOString()) {
  return {schema:LEDGER_SCHEMA,created_at:createdAt,entries:[],mode:'offline_local_demo'};
}
export function summarizeBalances(source, ledger) {
  const values = new Map(source.coins.map(c=>[c.ticker,0]));
  for (const e of ledger.entries) if (values.has(e.ticker)) values.set(e.ticker,values.get(e.ticker)+e.delta_units);
  return source.coins.map(c=>({
    number:c.number,ticker:c.ticker,name:c.name,
    design_allocation_units:c.initial_design_units,
    local_demo_units:values.get(c.ticker),
    verified_onchain_units:null
  }));
}
export function auditLedger(source,ledger) {
  const issues = [];
  if (ledger?.schema!==LEDGER_SCHEMA||!Array.isArray(ledger.entries))
    return {ok:false,issues:['Incorrect ledger schema or missing entries.']};
  const known = new Set(source.coins.map(c=>c.ticker));
  const balances = new Map(source.coins.map(c=>[c.ticker,0]));
  ledger.entries.forEach((e,i)=>{
    if(e.sequence!==i+1) issues.push('Sequence error at '+(i+1));
    if(!known.has(e.ticker)) issues.push('Unknown ticker '+e.ticker);
    if(!Number.isSafeInteger(e.delta_units)||e.delta_units===0) issues.push('Invalid integer units at '+(i+1));
    if(typeof e.description!=='string'||!e.description.trim()) issues.push('Missing audit description at '+(i+1));
    if(typeof e.created_at!=='string'||!e.created_at) issues.push('Missing event timestamp at '+(i+1));
    if(known.has(e.ticker)&&Number.isSafeInteger(e.delta_units)) {
      const next=balances.get(e.ticker)+e.delta_units;
      if(!Number.isSafeInteger(next)||next<0) issues.push('Negative or unsafe local balance at '+(i+1));
      balances.set(e.ticker,next);
    }
  });
  return {ok:issues.length===0,issues,event_count:ledger.entries.length};
}
export function addLocalEvent(source,ledger,{ticker,delta_units,description,created_at=new Date().toISOString()}) {
  const original=auditLedger(source,ledger);
  if(!original.ok) throw new Error('Source ledger audit failed: '+original.issues.join('; '));
  if(!source.coins.some(c=>c.ticker===ticker)) throw new Error('Unknown ring '+ticker);
  if(!Number.isSafeInteger(delta_units)||delta_units===0) throw new Error('Use nonzero whole-number local units.');
  if(typeof description!=='string'||!description.trim()) throw new Error('Audit description required.');
  const current=summarizeBalances(source,ledger).find(x=>x.ticker===ticker).local_demo_units;
  if(current+delta_units<0 || !Number.isSafeInteger(current+delta_units))
    throw new Error('Cannot overdraw a local demonstration balance.');
  const event={sequence:ledger.entries.length+1,ticker,delta_units,description:description.trim().slice(0,280),created_at};
  return {...ledger,entries:[...ledger.entries,event]};
}
function nonnegativeMoney(value,label) {
  if(value===''||value===null||value===undefined) throw new Error(label+' is required.');
  const n=Number(value);
  if(!Number.isFinite(n)||n<0) throw new Error(label+' must be a nonnegative finite amount.');
  return n;
}
export function calculateEfficiency(energyCostUsd,revenueUsd,consumedKwh='') {
  const input=nonnegativeMoney(energyCostUsd,'Electrical energy cost');
  const output=nonnegativeMoney(revenueUsd,'Recorded output value');
  if (consumedKwh!==''&&consumedKwh!==null&&consumedKwh!==undefined) nonnegativeMoney(consumedKwh,'Energy kWh');
  return {
    energy_cost_usd:input,
    output_value_usd:output,
    net_usd:output-input,
    observed_output_per_dollar:input>0?output/input:null,
    requested_design_ratio:DESIGN_RATIO,
    meets_design_target:input>0?output/input>=DESIGN_RATIO:false,
    minimum_output_for_16x:input*DESIGN_RATIO,
    cost_per_kwh:consumedKwh!==''&&Number(consumedKwh)>0?input/Number(consumedKwh):null,
    verification:'USER_ENTERED_DATA_ONLY_NOT_A_LIVE_MINING_AUDIT'
  };
}
