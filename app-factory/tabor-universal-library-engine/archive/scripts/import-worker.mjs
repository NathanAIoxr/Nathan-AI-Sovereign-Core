import { bodyKey, classNames, editionFormats, idPattern, materials, providers, shaPattern } from "../src/model.mjs";
import { sha256 } from "../src/integrity.mjs";

const recordCap = 128;
const byteCap = 2_000_000;
const origins = {
  loc: ["www.loc.gov"],
  gutenberg: ["www.gutenberg.org"],
  cdli: ["cdli.earth"],
  papyri: ["papyri.info"],
  iaa: ["www.deadseascrolls.org.il"],
  idp: ["idp.bl.uk"],
  vat: ["digi.vatlib.it"],
  sinai: ["www.codexsinaiticus.org", "codexsinaiticus.org"]
};
const editionOrigins = {ocr:["data.labs.loc.gov"], atf:["github.com"], tei:["raw.githubusercontent.com"]};
const editionProviders = {ocr:"loc",atf:"cdli",tei:"papyri"};

const textFields = (rows,length)=>Array.isArray(rows)&&rows.length===length&&
  rows.every(value=>typeof value==="string"&&value.length<=1300&&value.indexOf("\0")===-1);
const workId = value=>typeof value==="string"&&value.length<=90&&idPattern.test(value);
function allowedUrl(value,hosts) {
  if (typeof value!=="string" || value.length>600) return false;
  try {
    const url=new URL(value);
    return url.protocol==="https:"&&!url.port&&!url.username&&!url.password&&hosts.includes(url.hostname);
  } catch { return false; }
}

async function authenticated(request, env) {
  const token=request.headers.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token || !/^[a-f0-9]{64}$/.test(env.IMPORT_KEY??"")) return false;
  const encoder=new TextEncoder();
  const alg={name:"HMAC",hash:"SHA-256"};
  const [actual,expected]=await Promise.all([crypto.subtle.importKey("raw",encoder.encode(token),alg,false,["sign"]),
    crypto.subtle.importKey("raw",encoder.encode(env.IMPORT_KEY),alg,false,["verify"])]);
  const note=encoder.encode("tabor-corpus-import");
  return crypto.subtle.verify("HMAC",expected,await crypto.subtle.sign("HMAC",actual,note),note);
}

async function boundedBody(request) {
  if (Number(request.headers.get("content-length"))>byteCap || !request.body) throw new RangeError("Import payload size");
  const reader=request.body.getReader();
  const bytes=new Uint8Array(byteCap);
  let count=0;
  try {
    for (;;) {
      const {done,value}=await reader.read();
      if (done) break;
      if (count+value.length>byteCap) throw new RangeError("Import payload size");
      bytes.set(value,count);
      count+=value.length;
    }
  } finally { await reader.cancel(); }
  return new TextDecoder("utf-8",{fatal:true}).decode(bytes.subarray(0,count));
}

const workSelect=Array.from({length:12},(_,i)=>`json_extract(value,'$.work[${i}]')`).join(",");
const sourceSelect=Array.from({length:7},(_,i)=>`json_extract(value,'$.source[${i}]')`).join(",");
const insertWorks=`INSERT INTO archive_works (id,title,author,language,class,vault,kind,state,description,source_url,source_reference,rights_note)
  SELECT ${workSelect} FROM json_each(?) WHERE 1 ON CONFLICT(id) DO NOTHING RETURNING id`;
const insertSources=`INSERT INTO archive_sources (work_id,provider,external_id,material,holding,dating,shelfmark,snapshot)
  SELECT json_extract(value,'$.work[0]'),${sourceSelect} FROM json_each(?) WHERE 1 ON CONFLICT(work_id) DO NOTHING RETURNING work_id`;
const sqlReceipt="INSERT INTO archive_import_receipts VALUES (?,?,?,?) ON CONFLICT(batch_sha) DO NOTHING";

export async function putRecords(env, rows) {
  if (!Array.isArray(rows)||rows.length<1||rows.length>recordCap) throw new RangeError("Invalid record batch size");
  const provider=rows[0]?.source?.[0];
  if (!Object.hasOwn(providers,provider)) throw new RangeError("Unknown provider");
  const visited=new Set();
  for(const row of rows) {
    const {work,source}=row??{};
    if (!textFields(work,12)||!textFields(source,7)||source[0]!==provider||!workId(work[0])||
        !work[0].startsWith(provider+"-")||visited.has(work[0])||!work[1]||!source[1]||!source[6]||
        !Object.hasOwn(classNames,work[4])||!Object.hasOwn(materials,source[2])||!allowedUrl(work[9],origins[provider])) {
      throw new RangeError("Invalid catalog record");
    }
    visited.add(work[0]);
  }
  const db=env.ARCHIVE_DB;
  const body=JSON.stringify(rows);
  const hash=await sha256(new TextEncoder().encode(body));
  const [works,refs]=await db.batch([
    db.prepare(insertWorks).bind(body),
    db.prepare(insertSources).bind(body),
    db.prepare(sqlReceipt).bind(hash,provider,rows.length,new Date().toISOString())
  ]);
  return {provider,submitted:rows.length,added:works.results.length,indexed:refs.results.length,sha256:hash};
}

async function putEdition(env, payload) {
  const {work,id,label,url,digest,format,body}=payload??{};
  if (!workId(work)||!workId(id)||typeof label!=="string"||!label||label.length>300||!shaPattern.test(digest??"")||
      !Object.hasOwn(editionFormats,format)||!allowedUrl(url,editionOrigins[format])||typeof body!=="string") {
    throw new RangeError("Invalid edition");
  }
  const db=env.ARCHIVE_DB;
  const record=await db.prepare("SELECT w.rights_note,s.provider FROM archive_works w JOIN archive_sources s ON s.work_id=w.id WHERE w.id=?").bind(work).first();
  if (!record||record.provider!==editionProviders[format]) throw new RangeError("Edition provider mismatch");
  const bytes=Uint8Array.from(atob(body),c=>c.charCodeAt(0));
  if (!bytes.length||bytes.length>1_490_000||await sha256(bytes)!==digest) throw new RangeError("Edition digest mismatch");
  if (format==="tei") {
    const prefix=new TextDecoder().decode(bytes.subarray(0,600));
    if (!/<TEI(?:\s|>)/.test(prefix)) throw new RangeError("Expected TEI file");
  }
  const existing=await db.prepare("SELECT sha256 FROM archive_editions WHERE work_id=? AND edition_id=?").bind(work,id).first();
  if(existing && existing.sha256!==digest) throw new RangeError("Edition already has different bytes");
  const key=bodyKey(digest);
  const stored=await env.ARCHIVE_BLOB.head(key);
  if (stored && (stored.customMetadata?.sha256!==digest||stored.size!==bytes.length)) throw new Error("R2 object metadata mismatch");
  if (!stored) await env.ARCHIVE_BLOB.put(key,bytes,{sha256:digest,customMetadata:{sha256:digest}});
  const captured=new Date().toISOString();
  const result=await db.batch([
    db.prepare("INSERT INTO archive_editions (work_id,edition_id,label,source_url,sha256,bytes,rights_note,captured_utc,country) VALUES (?,?,?,?,?,?,?,?,NULL) ON CONFLICT(work_id,edition_id) DO NOTHING")
      .bind(work,id,label,url,digest,bytes.length,record.rights_note,captured),
    db.prepare("INSERT INTO archive_edition_formats SELECT work_id,edition_id,? FROM archive_editions WHERE work_id=? AND edition_id=? AND sha256=? ON CONFLICT DO NOTHING")
      .bind(format,work,id,digest),
    db.prepare("INSERT INTO archive_receipts SELECT ?,work_id,edition_id,'published',sha256,captured_utc FROM archive_editions WHERE work_id=? AND edition_id=? AND sha256=? ON CONFLICT DO NOTHING")
      .bind(work+"/"+id,work,id,digest)
  ]);
  const final=await db.prepare("SELECT sha256 FROM archive_editions WHERE work_id=? AND edition_id=?").bind(work,id).first();
  if (final?.sha256!==digest) throw new RangeError("Edition publication conflict");
  return {work,id,bytes:bytes.length,digest,added:result[0].meta.changes};
}

export default {
  async fetch(request,env) {
    const path=new URL(request.url).pathname;
    if (request.method!=="POST"||!["/records","/edition"].includes(path)||!await authenticated(request,env)) {
      return new Response(null,{status:404});
    }
    try {
      const body=JSON.parse(await boundedBody(request));
      return Response.json(path==="/records"?await putRecords(env,body):await putEdition(env,body));
    } catch(error) {
      const client=error instanceof RangeError||error instanceof SyntaxError;
      return Response.json({error:client?error.message:"Import storage failed"},{status:client?400:503});
    }
  }
};
