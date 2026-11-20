import {sha,quarantine} from "./integrity.js";

export const intentSeconds=600;
const scale=1_000_000;
const categories=new Set(["ODDS_GATE","MINING_UNIT","CAPITAL_ALLOCATION"]);
const txId=/^MATH-[a-f0-9-]{36}$/;
const clock=()=>Math.floor(Date.now()/1000);

function fixed(value,min,max) {
  if(typeof value!=="number"||!Number.isFinite(value)||value<min||value>max||Number(value.toFixed(6))!==value)throw new TypeError("invalid_risk_number");
  return Math.round(value*scale);
}
export function riskInputs(raw) {
  if(!raw||typeof raw!=="object"||Array.isArray(raw)||Object.keys(raw).some(k=>!["category","unitStake","impliedProb","trueProb","feeDrag","minEdgeHurdle"].includes(k)))throw new TypeError("invalid_risk_input");
  const {category="ODDS_GATE",unitStake,impliedProb,trueProb,feeDrag=0.02,minEdgeHurdle=0.025}=raw;
  if(!categories.has(category))throw new TypeError("invalid_risk_category");
  const input={category,unitStake:fixed(unitStake,0.000001,1_000_000),impliedProb:fixed(impliedProb,0.000001,0.999999),
    trueProb:fixed(trueProb,0.000001,0.999999),feeDrag:fixed(feeDrag,0,1),minEdgeHurdle:fixed(minEdgeHurdle,0.025,1)};
  return {...input,netEdge:input.trueProb-input.impliedProb-input.feeDrag};
}
async function seals(row) {
  const canonical=JSON.stringify([row.tx_id,row.ordinal,row.owner,row.state,row.expires_at,row.payload_json]);
  const alien=await sha("ALIEN|RISK|"+canonical);
  const neila=await sha("NEILA|RISK|"+alien+"|"+canonical);
  return [alien,neila];
}
export async function verifyRiskEvent(event) {
  const [alien,neila]=await seals(event);
  return event.alien_seal===alien&&event.neila_seal===neila;
}
async function write(db,row) {
  const [alien,neila]=await seals(row);
  const sql=`INSERT INTO deterministic_ledger
    SELECT ?,?,?,?,?,?,?,?
    WHERE NOT EXISTS(SELECT 1 FROM deterministic_ledger WHERE tx_id=? AND ordinal=?)
    AND (?=0 OR ((?='EXPIRED' AND unixepoch()>=?) OR (?!='EXPIRED' AND unixepoch()<?)))`;
  await db.prepare(sql).bind(row.tx_id,row.ordinal,row.owner,row.payload_json,row.state,row.expires_at,alien,neila,
    row.tx_id,row.ordinal,row.ordinal,row.state,row.expires_at,row.state,row.expires_at).run();
}
async function read(db,id,owner) {
  const rows=await db.prepare("SELECT * FROM deterministic_ledger WHERE tx_id=? AND owner=? ORDER BY ordinal").bind(id,owner).all();
  if(!rows.results.length)return {error:"risk_not_found"};
  const block=await db.prepare("SELECT 1 FROM verification_quarantine WHERE scope='risk' AND record_id=?").bind(id).first();
  if(block)return {error:"integrity_lock"};
  if(!(await Promise.all(rows.results.map(verifyRiskEvent))).every(Boolean)||
    rows.results[1]&&JSON.parse(rows.results[1].payload_json).prior!==rows.results[0].alien_seal){
    await quarantine(db,"risk",id);
    return {error:"integrity_lock"};
  }
  return {intent:rows.results[0],settlement:rows.results[1]};
}
function summarize({intent,settlement}) {
  const state=settlement?.state??(intent.state==="INTENT_LOCKED"&&clock()>=intent.expires_at?"EXPIRED":intent.state);
  const input=JSON.parse(intent.payload_json);
  return {id:intent.tx_id,state,mode:"SIMULATION",expiresAt:intent.expires_at,netEdge:input.netEdge/scale,
    requiredHurdle:input.minEdgeHurdle/scale,equation:state==="SETTLED_2"?"1 + 1 = 2":state==="SETTLED_0"?"1 - 1 = 0":null,
    alienSeal:settlement?.alien_seal??intent.alien_seal,neilaSeal:settlement?.neila_seal??intent.neila_seal};
}
export async function evaluateRisk(db,owner,raw) {
  const input=riskInputs(raw);
  const row={tx_id:"MATH-"+crypto.randomUUID(),ordinal:0,owner,payload_json:JSON.stringify(input),
    state:input.netEdge>=input.minEdgeHurdle?"INTENT_LOCKED":"REJECTED",expires_at:clock()+intentSeconds};
  await write(db,row);
  return riskStatus(db,owner,row.tx_id);
}
async function close(db,intent,state) {
  await write(db,{tx_id:intent.tx_id,ordinal:1,owner:intent.owner,state,expires_at:intent.expires_at,
    payload_json:JSON.stringify({prior:intent.alien_seal})});
}
export async function riskStatus(db,owner,id) {
  if(typeof id!=="string"||!txId.test(id))throw new TypeError("invalid_risk_id");
  const rows=await read(db,id,owner);
  if(rows.error)return rows;
  return summarize(rows);
}
export async function settleRisk(db,owner,id,result) {
  if(typeof id!=="string"||!txId.test(id)||typeof result!=="boolean")throw new TypeError("invalid_risk_settlement");
  const rows=await read(db,id,owner);
  if(rows.error)return rows;
  if(rows.intent.state!=="INTENT_LOCKED")return {error:"risk_not_locked"};
  const desired=result?"SETTLED_2":"SETTLED_0";
  if(!rows.settlement){
    if(clock()<rows.intent.expires_at)await close(db,rows.intent,desired);
    else await close(db,rows.intent,"EXPIRED");
  }
  const status=await riskStatus(db,owner,id);
  return status.error||status.state===desired?status:{...status,error:"risk_already_closed"};
}
export async function expireRisk(db) {
  const batch=await db.prepare(
    `SELECT l.tx_id,l.owner FROM deterministic_ledger l WHERE l.state='INTENT_LOCKED' AND l.expires_at<=unixepoch()
    AND NOT EXISTS(SELECT 1 FROM deterministic_ledger x WHERE x.tx_id=l.tx_id AND x.ordinal=1)
    AND NOT EXISTS(SELECT 1 FROM verification_quarantine q WHERE q.scope='risk' AND q.record_id=l.tx_id)
    ORDER BY l.expires_at LIMIT 12`
  ).all();
  for(const {tx_id,owner} of batch.results){
    const rows=await read(db,tx_id,owner);
    if(!rows.error&&!rows.settlement)await close(db,rows.intent,"EXPIRED");
  }
}
