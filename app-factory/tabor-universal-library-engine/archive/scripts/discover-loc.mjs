import { setTimeout } from "node:timers/promises";

const collections = new Set(["books","manuscripts","maps","notated-music","newspapers","photos"]);
const [collection, query, start="1", length="1"] = process.argv.slice(2);
if (!collections.has(collection) || !query || query.length > 120 || !/^\d{1,4}$/.test(start) ||
    Number(start)<1 || !/^[1-5]$/.test(length)) {
  console.error('Usage: node scripts/discover-loc.mjs books "search term" [start page] [pages 1–5]');
  process.exit(2);
}

const records = new Map();
let nextPage = null;
for (let page=Number(start);page<Number(start)+Number(length);page++) {
  const url = new URL("https://www.loc.gov/"+collection+"/");
  url.search = new URLSearchParams({fo:"json",q:query,c:"25",sp:String(page)}).toString();
  const response = await fetch(url,{headers:{accept:"application/json"},signal:AbortSignal.timeout(25000),redirect:"error"});
  if (!response.ok) throw new Error(`LoC returned ${response.status} on page ${page}; resume from that page`);
  const data = await response.json();
  if (!Array.isArray(data.results) || typeof data.pagination !== "object" || !data.pagination) {
    throw new Error(`Unexpected LoC response on page ${page}`);
  }
  for (const row of data.results) {
    if (typeof row.id!=="string" || typeof row.title!=="string") continue;
    const id = new URL(row.id);
    if (id.hostname!=="www.loc.gov" || !["http:","https:"].includes(id.protocol)) continue;
    id.protocol="https:";
    const record = {sourceId:id.href, title:row.title, date:row.date??null,
      contributors:row.contributor??[], language:row.language??[], originalFormat:row.original_format??[],
      rightsReview:"pending", sourceSearch:url.href};
    records.set(id.href,record);
  }
  nextPage = data.pagination.next ? page+1 : null;
  if (!nextPage) break;
  if (page<Number(start)+Number(length)-1) await setTimeout(1000);
}
console.log(JSON.stringify({provider:"Library of Congress",collection,query,nextPage,records:[...records.values()]},null,2));
