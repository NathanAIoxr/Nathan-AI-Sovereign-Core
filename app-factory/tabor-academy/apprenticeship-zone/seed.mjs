import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { pathwayGroups } from "../apprenticeships/pathways.mjs";
import { sources as priorSources } from "../apprenticeships/sources.mjs";
import { occupationSnapshot, occupationsGzip } from "../apprenticeships/registered.snapshot.mjs";
import { addedSources, history, proposals } from "./additions.mjs";
import internationalGzip from "./international.snapshot.mjs";

const date = "2026-11-20";
const unpack = encoded => JSON.parse(gunzipSync(Buffer.from(encoded, "base64")));
const key = (source, ...parts) => source + "-" + createHash("sha256").update(parts.join("\0")).digest("hex").slice(0, 20);
export const schema = await readFile(new URL("schema.sql", import.meta.url), "utf8");
export const pathsRoot = "/tabor-academy/institution/apprenticeships/pathway/";
export const fold = text => text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const catalogSources = { ...priorSources, ...addedSources };
const geography = { england: "England", germany: "Germany", canada: "Canada" };
const kindFromStatus = { current: "college", retired: "college", reconstruction: "reconstruction", documented: "historical", living: "living", proposed: "proposal" };
export function dataset() {
  const intl = unpack(internationalGzip);
  const federal = unpack(occupationsGzip);
  const records = [];
  const variants = [];
  const record = (id,title,area,kind,status,period,src,reference,detail,href,aliases="") => {
    if (!catalogSources[src] || !title || !id) throw Error("Incomplete record: " + id);
    if (href && !href.startsWith("https://") && !href.startsWith(pathsRoot)) throw Error("Unexpected record URL: " + href);
    records.push([id,title,area,kind,status,period,src,reference,detail,href,fold([title,reference,status,period,detail,aliases].join(" "))]);
  };
  for (const [code,title,details] of federal) {
    const id = key("us",code,title);
    record(id,title,"United States","occupation","Federally approved occupation","", "dol",code,
      "The workbook records approved occupations and training variants. Check for a separate sponsor or job listing.",
      "https://www.apprenticeship.gov/apprenticeship-occupations",
      details.map(row => row.slice(0,3).join(" ")).join(" "));
    details.forEach((row,i) => variants.push([id,i+1,JSON.stringify(row)]));
  }

  for (const [source, rows] of Object.entries(intl.records)) {
    for (const [title,ref,status,period,detail,href] of rows) {
      const id = key(source, source === "germany" ? title : ref);
      record(id,title,geography[source],source==="england"?"standard":"occupation",status,period,source,ref,detail,href);
    }
  }
  for (const group of pathwayGroups) {
    for (const item of group.programs) {
      const kind = kindFromStatus[group.status];
      const source = item.name.includes("North Bennet") ? "bennet" : item.name.includes("Butler County") ? "bc3" :
        item.name.includes("North Seattle") ? "seattle" : item.name.includes("GTCC") ? "gtcc" : group.sources[0];
      const region = kind==="college" ? "United States" : kind==="proposal" ? "Tabor Academy" : "Multiple regions";
      const statuses = { current:"Published college example",retired:"Documented withdrawal",reconstruction:"Evidence-based exercise",documented:"Historical record",living:"Living craft",proposed:"Proposed" };
      record("academy-"+group.id+"-"+item.id,item.name,region,kind,statuses[group.status],group.era,source,"",
        item.project,pathsRoot+group.id+"/"+item.id+"/",group.title);
    }
  }
  for (const [id,title,region,era,kind,source,detail] of history) {
    record("history-"+id,title,region,kind,kind==="living"?"Living craft":"Historical record",era,source,"",detail,catalogSources[source][1]);
  }
  for (const [group,title,exercise] of proposals) {
    record(key("proposal",title),title,"Tabor Academy","proposal","Proposed","Future programme","ilo",group,exercise,"");
  }
  if (new Set(records.map(row=>row[0])).size!==records.length) throw Error("Duplicate catalog IDs");
  const sources = Object.entries(catalogSources).map(([id,[name,url,note]])=>[id,name,url,note??"",date]);
  const imported = [
    ["dol",date,occupationSnapshot.sha256,occupationSnapshot.entries,"1,478 code-title entries with all source variants."],
    ...Object.entries(intl.sources).map(([id,x]) => [id,date,x.sha256,x.records,id === "england" ? "Standards API and public foundation and unit listings." : "Official snapshot."]),
    ["academy",date,createHash("sha256").update(JSON.stringify([pathwayGroups,history,proposals])).digest("hex"),
      records.filter(row=>row[0].startsWith("academy-")||row[0].startsWith("history-")||row[0].startsWith("proposal-")).length,
      "Prior Academy pathways and new historical records and proposals."],
  ];
  const counts = { records:records.length, variants:variants.length, sources:sources.length };
  if (variants.length!==occupationSnapshot.rows) throw Error("Federal workbook variants were lost");
  return { sources,records,variants,imported,counts };
}

function upserts(table,columns,pk,rows) {
  const fields = columns.split(",");
  const updates = fields.filter(field=>!pk.includes(field)).map(field=>field+"=excluded."+field).join(",");
  const sql = "INSERT INTO "+table+"("+columns+") SELECT "+
    fields.map((_,i)=>"json_extract(value,'$["+i+"]')").join(",")+
    " FROM json_each(?) WHERE true ON CONFLICT("+pk.join(",")+") DO UPDATE SET "+updates;
  const batches = [];
  let current = [];
  let bytes = 2;
  for (const row of rows) {
    const add = Buffer.byteLength(JSON.stringify(row))+1;
    if (bytes+add>26000 && current.length) {
      batches.push({ sql, params:[JSON.stringify(current)] });
      current = [];
      bytes = 2;
    }
    current.push(row);
    bytes += add;
  }
  if (current.length) batches.push({sql,params:[JSON.stringify(current)]});
  return batches;
}
export function seedPlan() {
  const { sources,records,variants,imported,counts } = dataset();
  return {schema,counts,stages:[
    upserts("sources","id,publisher,url,note,retrieved",["id"],sources),
    upserts("records","id,title,region,kind,status,period,source_id,reference,detail,source_url,search_key",["id"],records),
    upserts("variants","record_id,ordinal,source_data",["record_id","ordinal"],variants),
    upserts("import_receipts","id,retrieved,source_hash,record_count,notes",["id"],imported),
  ]};
}
if (process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) process.stdout.write(JSON.stringify(seedPlan()));
