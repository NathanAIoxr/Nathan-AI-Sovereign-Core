const encoder=new TextEncoder();
export async function sha(text) {
  const hash=await crypto.subtle.digest("SHA-256",encoder.encode(text));
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
export async function ledgerHashes(id,prior,digest) {
  return Promise.all([sha(prior+"|"+digest+"|"+id),sha(id+"|"+digest+"|"+prior)]);
}
export async function verifiedPayload(row,payload) {
  if(!row||await sha(JSON.stringify(payload))!==row.payload_hash)return false;
  const [alien,neila]=await ledgerHashes(row.event_id,row.prior_hash,row.payload_hash);
  return row.alien_hash===alien&&row.neila_hash===neila;
}
export async function quarantine(db,scope,id) {
  await db.prepare("INSERT OR IGNORE INTO verification_quarantine VALUES(?,?,?)")
    .bind(scope,id,new Date().toISOString()).run();
}

export async function verifyDnsReceipt(row) {
  if(!row)return false;
  try {
    const canonical=JSON.stringify({at:row.checked_at,cfStatus:row.cf_status,domain:row.domain,gate:"HOLDING",
      nameservers:JSON.parse(row.nameservers_json),route:row.route_id??"",zoneId:row.zone_id});
    const alien=await sha("ALIEN|"+canonical);
    return row.alien_seal===alien&&row.neila_seal===await sha("NEILA|"+alien+"|"+canonical);
  } catch{return false;}
}

export async function checkDnsReceipt(env,domain,zoneId) {
  const db=env.LEDGER;
  const [row,locked]=await Promise.all([
    db.prepare("SELECT * FROM dns_provision_receipts WHERE domain=?").bind(domain).first(),
    db.prepare("SELECT 1 AS locked FROM verification_quarantine WHERE scope='dns' AND record_id=?").bind(domain).first()
  ]);
  if(locked||!row||zoneId!==undefined&&row.zone_id!==zoneId)return false;
  if(await verifyDnsReceipt(row))return true;
  await quarantine(db,"dns",domain);
  await env.ZONE_KV.put("ZONE_STATUS:"+domain,"KILLED");
  return false;
}

export async function verifyLiveDecision(env,domain,record) {
  if(!record||record.state!=="LIVE"||!await checkDnsReceipt(env,domain,record.dns_zone_id))return false;
  const db=env.LEDGER;
  const proof=await db.prepare(
    `SELECT p.*,l.payload_hash,l.alien_hash,l.neila_hash,l.prior_hash,l.event_type
    FROM dns_live_proofs p JOIN provenance_ledger l USING(event_id)
    WHERE p.domain=? AND p.zone_id=? AND p.activated_at=? ORDER BY p.event_id DESC LIMIT 1`
  ).bind(domain,record.dns_zone_id,record.updated_at).first();
  let valid=false;
  try{
    const payload=JSON.parse(proof.approved_json);
    valid=proof.event_type==="promote"&&payload.action==="promote"&&payload.domain===domain&&await verifiedPayload(proof,payload);
  }catch{}
  if(!valid){
    await quarantine(db,"dns",domain);
    await env.ZONE_KV.put("ZONE_STATUS:"+domain,"KILLED");
  }
  return valid;
}
