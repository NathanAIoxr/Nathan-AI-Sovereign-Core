import { setTimeout } from "node:timers/promises";
import { pathToFileURL } from "node:url";

const collections = new Set(["books","manuscripts","maps","notated-music","newspapers","photos"]);

export function readPage(data, url) {
  if (!Array.isArray(data?.results) || typeof data.pagination !== "object" || !data.pagination) {
    throw new Error("Unexpected Library of Congress response");
  }
  const records = [];
  for (const row of data.results) {
    if (typeof row?.id!=="string" || typeof row.title!=="string") continue;
    let id;
    try { id = new URL(row.id); } catch { continue; }
    if (id.hostname!=="www.loc.gov" || !["http:","https:"].includes(id.protocol) || id.username || id.password) continue;
    id.protocol="https:";
    records.push({sourceId:id.href, title:row.title, date:row.date??null,
      contributors:row.contributor??[], language:row.language??[], originalFormat:row.original_format??[],
      rightsReview:"pending", sourceSearch:url.href});
  }
  return {records, hasNext:typeof data.pagination.next==="string" && data.pagination.next.length>0};
}

async function main(args) {
  const [collection, query, start="1", length="1"] = args;
  if (!collections.has(collection) || !query || query.length > 120 || !/^\d{1,4}$/.test(start) ||
      Number(start)<1 || !/^[1-5]$/.test(length)) {
    console.error('Usage: node scripts/discover-loc.mjs books "search term" [start page] [pages 1–5]');
    process.exitCode = 2;
    return;
  }
  const records = new Map();
  let nextPage = null;
  for (let page=Number(start);page<Number(start)+Number(length);page++) {
    try {
      const url = new URL("https://www.loc.gov/"+collection+"/");
      url.search = new URLSearchParams({fo:"json",q:query,c:"25",sp:String(page)}).toString();
      const response = await fetch(url,{headers:{accept:"application/json"},signal:AbortSignal.timeout(25000),redirect:"error"});
      if (!response.ok) throw new Error("HTTP "+response.status);
      const result = readPage(await response.json(),url);
      for (const record of result.records) records.set(record.sourceId,record);
      nextPage = result.hasNext ? page+1 : null;
    } catch(error) {
      nextPage = page;
      console.error(`Library of Congress request ended at page ${page} (${error.message}). Resume at page ${page}.`);
      process.exitCode = 1;
      break;
    }
    if (!nextPage) break;
    if (page<Number(start)+Number(length)-1) await setTimeout(1000);
  }
  console.log(JSON.stringify({provider:"Library of Congress",collection,query,nextPage,records:[...records.values()]},null,2));
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) await main(process.argv.slice(2));
