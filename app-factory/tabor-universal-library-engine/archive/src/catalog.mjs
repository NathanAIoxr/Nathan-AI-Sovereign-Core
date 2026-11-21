import { classNames, idPattern, mapClass, materials, providers, states, vaults } from "./model.mjs";

export const workFields = "id,title,author,language,class,vault,kind,state,description,source_url,source_reference,rights_note";

export function browseParams(url) {
  const query = url.searchParams.get("q")?.trim() ?? "";
  const shelf = url.searchParams.get("class") ?? "";
  const vault = url.searchParams.get("vault") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const material = url.searchParams.get("material") ?? "";
  const provider = url.searchParams.get("provider") ?? "";
  const rawPage = url.searchParams.get("page") ?? "1";
  const page = Number(rawPage);
  if (query.length > 120 || (shelf && !Object.hasOwn(classNames, shelf)) ||
      (vault && !Object.hasOwn(vaults, vault)) || (state && !Object.hasOwn(states, state)) ||
      (material && !Object.hasOwn(materials,material)) || (provider && !Object.hasOwn(providers,provider)) ||
      !/^\d{1,5}$/.test(rawPage) || page < 1) return null;
  return { query, shelf, vault, state, material, provider, page };
}

export function workShape(row) {
  return { ...row, uri: `sovereign://library/tabor/${row.class}/${row.id}`, wholeUnitMarker: "0xFFFF", moduleAffinity: mapClass(row.class) };
}

export async function browse(db, {query, shelf, vault, state, material, provider, page}) {
  const clauses = [];
  const values = [];
  const tokens = query.match(/[\p{L}\p{N}]+/gu)?.slice(0,16) ?? [];
  if (query && !tokens.length) return {page,pageSize:18,hasNext:false,entries:[]};
  const searchJoin = tokens.length ? " JOIN archive_search ON archive_search.id=w.id" : "";
  if (tokens.length) {
    clauses.push("archive_search MATCH ?");
    values.push(tokens.map(token=>'"'+token+'"*').join(" AND "));
  }
  for (const [field, value] of [["w.class",shelf],["w.vault",vault],["w.state",state],["s.material",material],["s.provider",provider]]) {
    if (!value) continue;
    clauses.push(field + " = ?");
    values.push(value);
  }
  const where = clauses.length ? " WHERE " + clauses.join(" AND ") : "";
  const fields = workFields.split(",").map(name=>"w."+name).join(",");
  const ordering = tokens.length ? "bm25(archive_search),w.title COLLATE NOCASE,w.id" : "w.title COLLATE NOCASE,w.id";
  const statement = `SELECT ${fields},s.provider,s.material FROM archive_works w${searchJoin}
    LEFT JOIN archive_sources s ON s.work_id=w.id${where} ORDER BY ${ordering} LIMIT ? OFFSET ?`;
  const pageSize = 18;
  const result = await db.prepare(statement).bind(...values, pageSize + 1, (page - 1) * pageSize).all();
  return { page, pageSize, hasNext: result.results.length > pageSize, entries: result.results.slice(0, pageSize).map(workShape) };
}

export async function workDetail(db, id) {
  if (id.length > 90 || !idPattern.test(id)) return null;
  const row = await db.prepare(`SELECT ${workFields} FROM archive_works WHERE id=?`).bind(id).first();
  if (!row) return null;
  const [witnesses, editions, source] = await db.batch([
    db.prepare("SELECT id,type,label,source_family,source_url,locator,claim FROM archive_witnesses WHERE work_id=? ORDER BY id").bind(id),
    db.prepare(`SELECT e.edition_id,e.label,e.source_url,e.sha256,e.bytes,e.rights_note,e.captured_utc,e.country,f.format
      FROM archive_editions e LEFT JOIN archive_edition_formats f USING(work_id,edition_id)
      WHERE e.work_id=? ORDER BY captured_utc DESC,edition_id`).bind(id),
    db.prepare("SELECT provider,external_id,material,holding,dating,shelfmark,snapshot FROM archive_sources WHERE work_id=?").bind(id)
  ]);
  return { ...workShape(row), source:source.results[0]??null, witnesses: witnesses.results, editions: editions.results.map(e => ({
    ...e, text: `/api/works/${id}/editions/${e.edition_id}/text`, verification: `/api/works/${id}/editions/${e.edition_id}/verify`
  })) };
}

export async function editionById(db, work, edition) {
  if ([work,edition].some(id => id.length > 90 || !idPattern.test(id))) return null;
  return db.prepare("SELECT e.*,f.format FROM archive_editions e LEFT JOIN archive_edition_formats f USING(work_id,edition_id) WHERE e.work_id=? AND e.edition_id=?").bind(work, edition).first();
}
