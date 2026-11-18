import { catalog, officialHost, prefix } from "../src/registry.mjs";

const baseColumns="id,title,author,language,class,vault,kind,state,description,source_url,source_reference,rights_note";
const workValues=Array.from({length:12},(_,i)=>`json_extract(value,'$.work[${i}]')`).join(",");
const rows=catalog.entries.map(item=>{
  const number=String(item.id).padStart(3,"0");
  return {work:["tabor-worker-"+number,item.name,item.submittedReference??"Submitted Worker catalog","eng","T","loc","collection","collection-guide",
    `Tabor Worker Catalog #${number}. ${item.description}`,officialHost+prefix+"/projects/"+number,"Tabor Worker Catalog #"+number,
    "Catalog description and link to upstream evidence. Source repositories retain their individual terms."]};
});
export const archiveIntake={
  sql:`INSERT INTO archive_works (${baseColumns}) SELECT ${workValues} FROM json_each(?) WHERE 1
  ON CONFLICT(id) DO UPDATE SET title=excluded.title,author=excluded.author,description=excluded.description,source_url=excluded.source_url
  WHERE archive_works.title IS NOT excluded.title OR archive_works.author IS NOT excluded.author OR archive_works.description IS NOT excluded.description OR archive_works.source_url IS NOT excluded.source_url`,
  params:[JSON.stringify(rows)]
};
export const ledgerSchema=`CREATE TABLE IF NOT EXISTS tabor_worker_catalog_replicas(
  cohort TEXT NOT NULL, slot TEXT NOT NULL, release TEXT NOT NULL, sha256 TEXT NOT NULL, bytes INTEGER NOT NULL,
  catalog_url TEXT NOT NULL, verified_at TEXT NOT NULL, PRIMARY KEY(cohort,slot,sha256)
) STRICT`;
