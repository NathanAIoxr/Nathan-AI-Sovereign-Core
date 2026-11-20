const columns = 'id,source,title,record_type,url,revision,revision_url,categories,linked_game,source_position';
const sourceNames = new Set(['wikipedia','nathan-archive']);
const latest = 'SELECT receipt_id,checked_at,evidence FROM card_research_runs ORDER BY checked_at DESC, rowid DESC LIMIT 1';
const key = (title) => title.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().trim();
const display = ({categories,...row}) => ({...row,categories:JSON.parse(categories)});

export async function researchSummary(db) {
  const [sources,specs,receipt] = await db.batch([
    db.prepare('SELECT source,count(*) AS total,sum(linked_game IS NOT NULL) AS matched FROM card_research_sources GROUP BY source ORDER BY source'),
    db.prepare('SELECT count(*) AS total FROM card_research_specs'),
    db.prepare(latest),
  ]);
  const last = receipt.results[0];
  return {sources:sources.results,engineSpecs:specs.results[0].total,
    refresh:last ? {id:last.receipt_id,checkedAt:last.checked_at,...JSON.parse(last.evidence)} : null};
}

export async function listResearch(db, params) {
  const source = params.get('source') || 'wikipedia';
  if (!sourceNames.has(source)) return null;
  const offsetString = params.get('offset') || '0';
  const offset = /^\d{1,6}$/.test(offsetString) ? Number(offsetString) : 0;
  const q = key((params.get('q') || '').slice(0,100));
  const clauses = ' WHERE source=?' + (q ? ' AND instr(search_title,?)>0' : '');
  const values = q ? [source,q] : [source];
  const [rows,count] = await db.batch([
    db.prepare('SELECT ' + columns + ' FROM card_research_sources' + clauses +
      ' ORDER BY '+ (source === 'nathan-archive' ? 'source_position,' : '') + 'search_title,id LIMIT 24 OFFSET ?').bind(...values,offset),
    db.prepare('SELECT count(*) AS total FROM card_research_sources'+clauses).bind(...values),
  ]);
  const total = count.results[0].total;
  return {source,items:rows.results.map(display),total,nextOffset:offset+24<total ? offset+24 : null};
}

export async function researchForGame(db, gameId) {
  const {results} = await db.prepare('SELECT '+columns+' FROM card_research_sources WHERE linked_game=? ORDER BY source,search_title,id LIMIT 12').bind(gameId).all();
  return results.map(display);
}

export async function engineSpecs(db) {
  const {results} = await db.prepare('SELECT id,sequence,definition,url FROM card_research_specs ORDER BY sequence').all();
  return results.map(({definition,...row})=>({...row,...JSON.parse(definition)}));
}
