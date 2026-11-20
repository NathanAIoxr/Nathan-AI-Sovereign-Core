import { verifyIntakeIdentity } from './card-intake-auth.mjs';

const encode = new TextEncoder();
const sizeLimit = 448_000;
const oldid = 'https://en.wikipedia.org/?oldid=';
const curid = 'https://en.wikipedia.org/?curid=';
const archive = 'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/app-factory/game-reference-lab/';
const json = (data,status=200) => Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const positive = (v) => Number.isSafeInteger(v) && v>0;
const text = (v,max) => typeof v==='string' && Boolean(v.trim()) && v.length<=max;
const nullableId = (v) => v===null || (typeof v==='string' && /^[a-z0-9-]{1,90}$/.test(v));
const normalize = (v) => v.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().trim();

async function body(request) {
  const incoming = request.headers.get('content-length');
  if (incoming && Number(incoming)>sizeLimit) throw Error('Payload too large');
  const reader = request.body?.getReader();
  if (!reader) throw Error('Empty payload');
  const buffer = new Uint8Array(sizeLimit);
  let used = 0;
  while (true) {
    const {done,value} = await reader.read();
    if (done) break;
    if (used+value.length>sizeLimit) {
      await reader.cancel();
      throw Error('Payload too large');
    }
    buffer.set(value,used);
    used+=value.length;
  }
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer.subarray(0,used)));
}

const hash = async (v) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encode.encode(JSON.stringify(v)))),
  (byte)=>byte.toString(16).padStart(2,'0')).join('');

function reference(item) {
  if (!item || !text(item.title,255) || !Array.isArray(item.categories) || item.categories.length<1 ||
    item.categories.length>20 || !item.categories.every((v)=>text(v,120)) || !nullableId(item.linkedGame)) return false;
  if (item.source==='wikipedia') {
    return positive(item.pageId) && positive(item.revision) && item.id==='enwiki:'+item.pageId &&
      item.url===curid+item.pageId && item.revisionUrl===oldid+item.revision && ['game-lead','reference'].includes(item.recordType);
  }
  return item.source==='nathan-archive' && typeof item.id==='string' && /^NT-CARD-\d{3}$/.test(item.id) &&
    item.url===archive+'morning-additions-238.json' && item.recordType==='owner-reference' && positive(item.position);
}

function spec(item) {
  if (!item || typeof item.id!=='string' || !/^[A-Z0-9_]{1,80}$/.test(item.id) || !positive(item.sequence) ||
    item.url!==archive+'morning-mechanics-taxonomy.json') return false;
  return ['purpose','inputs','outputs','notes'].every((field)=>text(item[field],1000));
}

export async function verifiedArtifact(value) {
  const {references,specs,evidence,receipt} = value || {};
  if (!Array.isArray(references) || references.length<169 || references.length>1500 ||
    !Array.isArray(specs) || specs.length!==22 || !specs.every(spec) || !references.every(reference) ||
    new Set(references.map((x)=>x.id)).size!==references.length || new Set(specs.map((x)=>x.id)).size!==22 ||
    new Set(specs.map((x)=>x.sequence)).size!==22 || !evidence || !receipt || !receipt.verified ||
    !['public','oauth-bearer'].includes(evidence.access) || !Array.isArray(evidence.coverage) ||
    evidence.coverage.length>20 || !evidence.coverage.every((entry)=>entry && text(entry.category,120) &&
      positive(entry.requests) && entry.requests<=4 && Number.isSafeInteger(entry.received) &&
      entry.received>=0 && typeof entry.capped==='boolean')) return false;
  const nathanArchive = references.filter((x)=>x.source==='nathan-archive').length;
  const matched = references.filter((x)=>x.linkedGame).length;
  if (nathanArchive!==69 || evidence.sources?.nathanArchive!==nathanArchive || evidence.sources?.matched!==matched ||
    evidence.sources?.engineSpecs!==22 || evidence.sources?.wikipedia!==references.length-nathanArchive ||
    evidence.digest!==await hash([references,specs])) return false;
  const id = 'tabor-cards-'+(await hash(evidence)).slice(0,24);
  const input = await hash({id,kind:'card-library-research-intake',payload:evidence});
  return receipt.correlationId===id && receipt.alpha?.inputDigest===input &&
    receipt.beta?.inputDigest===input && receipt.beta.accepted===true;
}

const fields = ['id','source','title','search_title','record_type','url','revision','revision_url','categories','linked_game','source_position'];
const update = fields.slice(2).map((c)=>c+'=excluded.'+c).join(',');
const changed = fields.slice(2).map((c)=>'card_research_sources.'+c+' IS NOT excluded.'+c).join(' OR ');
const sourceSql = 'INSERT INTO card_research_sources('+fields.join(',')+') SELECT ' +
  fields.map((_,i)=>'json_extract(value,\'$['+i+']\')').join(',') +
  ' FROM json_each(?) WHERE 1 ON CONFLICT(id) DO UPDATE SET '+update+
  ' WHERE (excluded.revision IS NULL OR excluded.revision >= card_research_sources.revision) AND ('+changed+');';

export async function publishReferences(request,db,verify=verifyIntakeIdentity) {
  if (!db) return json({error:'Catalog database unavailable'},503);
  if (!(request.headers.get('content-type')||'').startsWith('application/json')) return json({error:'Use application/json'},415);
  let identity;
  try { identity = await verify(request); }
  catch { return json({error:'GitHub identity verifier unavailable'},503); }
  if (!identity) return json({error:'Unauthorized'},401);
  let data;
  try { data = await body(request); }
  catch { return json({error:'Invalid or oversized intake document'},400); }
  if (!await verifiedArtifact(data)) return json({error:'Intake provenance or records did not verify'},422);

  const rows = data.references.map((v)=>[v.id,v.source,v.title,normalize(v.title),v.recordType,v.url,v.revision??null,
    v.revisionUrl??null,JSON.stringify(v.categories),v.linkedGame,v.position??null]);
  const commands = [];
  for (let i=0;i<rows.length;i+=25) commands.push(db.prepare(sourceSql).bind(JSON.stringify(rows.slice(i,i+25))));
  const specs = data.specs.map(({id,sequence,url,...definition})=>[id,sequence,JSON.stringify(definition),url]);
  commands.push(db.prepare(`INSERT INTO card_research_specs(id,sequence,definition,url)
    SELECT json_extract(value,'$[0]'),json_extract(value,'$[1]'),json_extract(value,'$[2]'),json_extract(value,'$[3]')
    FROM json_each(?) WHERE 1 ON CONFLICT(id) DO UPDATE SET definition=excluded.definition,url=excluded.url
    WHERE definition<>excluded.definition OR url<>excluded.url`).bind(JSON.stringify(specs)));
  const receipt = {...data.receipt, githubRun:identity.runId};
  commands.push(db.prepare(`INSERT INTO card_research_runs(receipt_id,evidence,conductor_receipt) VALUES(?,?,?)
      ON CONFLICT(receipt_id) DO UPDATE SET checked_at=CURRENT_TIMESTAMP,conductor_receipt=excluded.conductor_receipt`)
    .bind(receipt.correlationId,JSON.stringify(data.evidence),JSON.stringify(receipt)));
  try {
    await db.batch(commands);
    return json({id:receipt.correlationId,sources:data.evidence.sources,githubRun:identity.runId});
  } catch (error) {
    console.error(JSON.stringify({component:'card-reference-intake',type:error.name}));
    return json({error:'Research database transaction failed'},503);
  }
}
