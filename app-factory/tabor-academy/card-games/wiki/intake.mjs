import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { conduct } from '../../../nathan-ai/sovereign-conductor-bridge/src/conductor.mjs';
import { normalize, readCatalog } from '../catalog.mjs';

const catalogSource = new URL('../../../game-reference-lab/',import.meta.url);
const readJSON = async (path) => JSON.parse(await readFile(new URL(path,catalogSource),'utf8'));
const archiveBase = 'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/app-factory/game-reference-lab/';
export async function ownerReferences() {
  const [archive,taxonomy] = await Promise.all([readJSON('morning-additions-238.json'),readJSON('morning-mechanics-taxonomy.json')]);
  const classifications = new Map(taxonomy.card.record_classifications.map((row) => [row.id,row]));
  const items = archive.items.filter((row) => row.family === 'historical and modern card games');
  if (items.length !== 69 || taxonomy.card.engine_modules.length !== 22) throw Error('Unexpected card archive shape. Review the source release.');
  if (new Set(items.map((row) => row.id)).size !== items.length) throw Error('Duplicate original card reference ID');
  const sources = items.map(({id,title,source_position},i) => {
    const position = source_position ?? i+1;
    const original = classifications.get(id);
    return {
      id,title,source:'nathan-archive', recordType:'owner-reference', url:archiveBase + 'morning-additions-238.json',
      categories:[original?.classification?.primary ?? 'Nathan Tabor card-game archive'],
      position,
    };
  });
  const specs = taxonomy.card.engine_modules.map((spec,i) => ({...spec,sequence:i+1,url:archiveBase + 'morning-mechanics-taxonomy.json'}));
  return {sources,specs};
}

const keys = (title) => [...new Set([normalize(title),normalize(title.replace(/\s*\((?:card game|game)\)$/i,''))])];
function linker(games) {
  const map = new Map();
  const priority = (game) => game.status === 'indexed' ? 1 : game.status === 'original' ? 2 : 3;
  for (const game of games) {
    for (const name of [game.title,...game.aliases]) {
      for (const key of keys(name)) {
        if (!map.has(key)) map.set(key,new Map());
        map.get(key).set(game.id,game);
      }
    }
  }
  return (title) => {
    const found = new Map();
    for (const key of keys(title)) for (const [id,g] of map.get(key) || []) found.set(id,g);
    if (!found.size) return null;
    const best = Math.max(...[...found.values()].map(priority));
    const matches = [...found.values()].filter((g) => priority(g) === best);
    return matches.length === 1 ? matches[0].id : null;
  };
}

function checkPage(page) {
  if (page.id !== 'enwiki:' + page.pageId || page.url !== 'https://en.wikipedia.org/?curid=' + page.pageId ||
    page.revisionUrl !== 'https://en.wikipedia.org/?oldid=' + page.revision ||
    !Number.isSafeInteger(page.pageId) || page.pageId <= 0 || !Number.isSafeInteger(page.revision) || page.revision <= 0 ||
    !['game-lead','reference'].includes(page.recordType) || typeof page.title !== 'string' || !page.title.trim() ||
    page.title.length > 255 || !Array.isArray(page.categories) || page.categories.some((category) => typeof category !== 'string')) {
    throw Error('Invalid Wikipedia snapshot record');
  }
  return {...page, source:'wikipedia'};
}

const digest = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
export async function prepareIntake(snapshot) {
  const [{games},owners] = await Promise.all([readCatalog(),ownerReferences()]);
  const link = linker(games);
  const pages = snapshot.pages.map(checkPage);
  if (pages.length < 100 || new Set(pages.map((row)=>row.id)).size !== pages.length) throw Error('Incomplete or duplicate Wikipedia snapshot');
  const references = [...pages,...owners.sources].map((item) => ({
    ...item, linkedGame: item.recordType === 'reference' ? null : link(item.title),
  }));
  const sources = { wikipedia:pages.length, nathanArchive:owners.sources.length, engineSpecs:owners.specs.length,
    matched:references.filter((item)=>item.linkedGame).length };
  const backlog = [
    ...references.filter((item) => item.source === 'nathan-archive'),
    ...references.filter((item) => item.source === 'wikipedia' && item.recordType === 'game-lead'),
  ].map((item) => [item,item.linkedGame ? games.find((g)=>g.id===item.linkedGame) : null])
    .filter(([,game])=>!game?.engine)
    .map(([item,game]) => ({
      sourceId:item.id, title:item.title, url:item.revisionUrl || item.url, existingGame:item.linkedGame,
      next:game?.rulebook ? 'prototype-and-test' : 'find-and-check-rules',
    }));
  const evidence = {sources,access:snapshot.access,coverage:snapshot.coverage,digest:digest([references,owners.specs])};
  const receipt = conduct({id:'tabor-cards-' + digest(evidence).slice(0,24),kind:'card-library-research-intake',payload:evidence});
  if (!receipt.verified) throw Error('Conductor evidence digest did not verify');
  return {references,specs:owners.specs,backlog,evidence,receipt};
}

const quote = (value) => value == null ? 'NULL' : "'" + String(value).replaceAll("'","''") + "'";
const recordRows = (rows) => rows.map((row)=>'('+row.map(quote).join(',')+')').join(',\n');
export async function intakeStatements(run) {
  const schema = await readFile(new URL('schema.sql',import.meta.url),'utf8');
  const cols = ['id','source','title','search_title','record_type','url','revision','revision_url','categories','linked_game','source_position'];
  const rows = run.references.map((r)=>[r.id,r.source,r.title,normalize(r.title),r.recordType,r.url,r.revision,
    r.revisionUrl,JSON.stringify(r.categories),r.linkedGame,r.position]);
  const changes = cols.slice(2).map((column)=>column+'=excluded.'+column).join(',');
  const compare = cols.slice(2).map((column)=>'card_research_sources.'+column+' IS NOT excluded.'+column).join(' OR ');
  const chunks = [];
  for (let i=0;i<rows.length;i+=25) {
    chunks.push('INSERT INTO card_research_sources('+cols.join(',')+') VALUES '+recordRows(rows.slice(i,i+25))+
      ' ON CONFLICT(id) DO UPDATE SET '+changes+' WHERE (excluded.revision IS NULL OR excluded.revision >= card_research_sources.revision) AND ('+compare+');');
  }
  chunks.push('INSERT INTO card_research_specs(id,sequence,definition,url) VALUES '+
    recordRows(run.specs.map(({id,sequence,url,...definition})=>[id,sequence,JSON.stringify(definition),url]))+
    ' ON CONFLICT(id) DO UPDATE SET definition=excluded.definition,url=excluded.url WHERE definition <> excluded.definition OR url <> excluded.url;');
  const receipt = 'INSERT INTO card_research_runs(receipt_id,evidence,conductor_receipt) VALUES '+
    recordRows([[run.receipt.correlationId,JSON.stringify(run.evidence),JSON.stringify(run.receipt)]])+
    ' ON CONFLICT(receipt_id) DO UPDATE SET checked_at=CURRENT_TIMESTAMP;';
  return {schema,chunks,receipt};
}
