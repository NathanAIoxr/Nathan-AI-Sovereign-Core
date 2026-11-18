import works from "../data/works.json" with { type: "json" };
import witnesses from "../data/witnesses.json" with { type: "json" };
import editions from "../data/editions.json" with { type: "json" };
import { classNames, idPattern, maxEditionBytes, shaPattern, states, vaults } from "../src/model.mjs";

const catalogStatement = "INSERT INTO archive_works (id,title,author,language,class,vault,kind,state,description,source_url,source_reference,rights_note) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,author=excluded.author,language=excluded.language,class=excluded.class,vault=excluded.vault,kind=excluded.kind,state=excluded.state,description=excluded.description,source_url=excluded.source_url,source_reference=excluded.source_reference,rights_note=excluded.rights_note";
const witnessStatement = "INSERT INTO archive_witnesses (work_id,id,type,label,source_family,source_url,locator,claim) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(work_id,id) DO UPDATE SET type=excluded.type,label=excluded.label,source_family=excluded.source_family,source_url=excluded.source_url,locator=excluded.locator,claim=excluded.claim";
const editionStatement = "INSERT INTO archive_editions (work_id,edition_id,label,source_url,sha256,bytes,rights_note,captured_utc,country) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(work_id,edition_id) DO NOTHING";
const receiptStatement = "INSERT INTO archive_receipts (id,work_id,edition_id,action,sha256,recorded_utc) SELECT ?,work_id,edition_id,'published',sha256,captured_utc FROM archive_editions WHERE work_id=? AND edition_id=? AND sha256=? ON CONFLICT(id) DO NOTHING";

const validUrl = value => {const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password;};
const byId = new Map(works.map(row=>[row[0],row]));
for (const row of works) {
  if (row.length!==12 || !idPattern.test(row[0]) || !Object.hasOwn(classNames,row[4]) ||
      !Object.hasOwn(vaults,row[5]) || !Object.hasOwn(states,row[7]) || !validUrl(row[9])) throw new Error("Invalid work: "+row[0]);
}
if(byId.size!==works.length) throw new Error("Duplicate work IDs");
for(const row of witnesses) {
  if(row.length!==8 || !byId.has(row[0]) || !idPattern.test(row[1]) || !validUrl(row[5])) throw new Error("Invalid witness: "+row[1]);
}
for(const e of editions) {
  if(!byId.has(e.work) || !idPattern.test(e.id) || !validUrl(e.url) || !shaPattern.test(e.sha256) ||
    !Number.isInteger(e.bytes) || e.bytes<1 || e.bytes>maxEditionBytes) throw new Error("Invalid edition: "+e.id);
}

export const catalogBatch = [
  ...works.map(params=>({sql:catalogStatement,params})),
  ...witnesses.map(params=>({sql:witnessStatement,params}))
];

export function editionBatch(e,capturedUtc) {
  return [
    {sql:editionStatement,params:[e.work,e.id,e.label,e.url,e.sha256,e.bytes,byId.get(e.work)[11],capturedUtc,e.country]},
    {sql:receiptStatement,params:[e.work+"/"+e.id,e.work,e.id,e.sha256]}
  ];
}
