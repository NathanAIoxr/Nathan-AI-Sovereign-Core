import { classNames, idPattern, mapClass, states, vaults } from "./model.mjs";

export const workFields = "id,title,author,language,class,vault,kind,state,description,source_url,source_reference,rights_note";

export function browseParams(url) {
  const query = url.searchParams.get("q")?.trim() ?? "";
  const shelf = url.searchParams.get("class") ?? "";
  const vault = url.searchParams.get("vault") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const rawPage = url.searchParams.get("page") ?? "1";
  const page = Number(rawPage);
  if (query.length > 120 || (shelf && !Object.hasOwn(classNames, shelf)) ||
      (vault && !Object.hasOwn(vaults, vault)) || (state && !Object.hasOwn(states, state)) ||
      !/^\d{1,4}$/.test(rawPage) || page < 1) return null;
  return { query, shelf, vault, state, page };
}

export function workShape(row) {
  return { ...row, uri: `sovereign://library/tabor/${row.class}/${row.id}`, wholeUnitMarker: "0xFFFF", moduleAffinity: mapClass(row.class) };
}

export async function browse(db, {query, shelf, vault, state, page}) {
  const clauses = [];
  const values = [];
  if (query) {
    const escaped = "%" + query.replace(/[~_%]/g, "~$&") + "%";
    const fields = ["title","author","description","source_reference","id"];
    clauses.push("(" + fields.map(field => `${field} LIKE ? ESCAPE '~'`).join(" OR ") + ")");
    values.push(...fields.map(() => escaped));
  }
  for (const [field, value] of [["class",shelf],["vault",vault],["state",state]]) {
    if (!value) continue;
    clauses.push(field + " = ?");
    values.push(value);
  }
  const where = clauses.length ? " WHERE " + clauses.join(" AND ") : "";
  const statement = `SELECT ${workFields} FROM archive_works${where} ORDER BY title COLLATE NOCASE,id LIMIT ? OFFSET ?`;
  const pageSize = 18;
  const result = await db.prepare(statement).bind(...values, pageSize + 1, (page - 1) * pageSize).all();
  return { page, pageSize, hasNext: result.results.length > pageSize, entries: result.results.slice(0, pageSize).map(workShape) };
}

export async function workDetail(db, id) {
  if (id.length > 90 || !idPattern.test(id)) return null;
  const row = await db.prepare(`SELECT ${workFields} FROM archive_works WHERE id=?`).bind(id).first();
  if (!row) return null;
  const [witnesses, editions] = await db.batch([
    db.prepare("SELECT id,type,label,source_family,source_url,locator,claim FROM archive_witnesses WHERE work_id=? ORDER BY id").bind(id),
    db.prepare("SELECT edition_id,label,source_url,sha256,bytes,rights_note,captured_utc,country FROM archive_editions WHERE work_id=? ORDER BY captured_utc DESC,edition_id").bind(id)
  ]);
  return { ...workShape(row), witnesses: witnesses.results, editions: editions.results.map(e => ({
    ...e, text: `/api/works/${id}/editions/${e.edition_id}/text`, verification: `/api/works/${id}/editions/${e.edition_id}/verify`
  })) };
}

export async function editionById(db, work, edition) {
  if ([work,edition].some(id => id.length > 90 || !idPattern.test(id))) return null;
  return db.prepare("SELECT * FROM archive_editions WHERE work_id=? AND edition_id=?").bind(work, edition).first();
}
