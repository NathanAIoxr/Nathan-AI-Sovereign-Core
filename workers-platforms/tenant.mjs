import { languageTarget, source } from "./platforms.mjs";
import { escape, json, links, page } from "./view.mjs";

const kinds = new Set(["language", "dialect", "family"]);
const selectFields = "id, name, kind, iso, family, parent_language, macroarea, first_documented, last_documented, sign";

function catalogForm(url) {
  const values = Object.fromEntries(url.searchParams);
  const option = (value, label, field) =>
    `<option value="${value}"${values[field] === value ? " selected" : ""}>${label}</option>`;
  return `<form action="/p/languages/catalog">
<label>Search <input name="q" maxlength="80" value="${escape(values.q || "")}" placeholder="Latin, English, Akkadian"></label>
<label>Record type <select name="kind">${option("", "All", "kind")}${[...kinds].map((kind) => option(kind, kind, "kind")).join("")}</select></label>
<label>Documentation <select name="period">${option("", "All dates", "period")}${option("historical", "Before 1500", "period")}${option("recent", "1500 onward", "period")}</select></label>
<label><input type="checkbox" name="sign" value="1"${values.sign === "1" ? " checked" : ""}> Sign languages</label>
<button>Search</button></form>`;
}

async function search(url, db) {
  const q = (url.searchParams.get("q") || "").trim();
  const kind = url.searchParams.get("kind") || "";
  const period = url.searchParams.get("period") || "";
  const sign = url.searchParams.get("sign") || "";
  const offset = Number(url.searchParams.get("offset") || "0");
  if (q.length > 80 || (kind && !kinds.has(kind)) || !["", "historical", "recent"].includes(period)
    || !["", "1"].includes(sign) || !Number.isSafeInteger(offset) || offset < 0 || offset > 100000) {
    return json({ error: "Invalid catalog filter" }, 400);
  }
  const where = [];
  const parameters = [];
  if (q) {
    where.push("(instr(lower(name), lower(?)) > 0 OR id = lower(?) OR iso = lower(?))");
    parameters.push(q, q, q);
  }
  if (kind) { where.push("kind = ?"); parameters.push(kind); }
  if (period === "historical") where.push("(first_documented < 1500 OR last_documented < 1500)");
  if (period === "recent") where.push("(coalesce(first_documented, last_documented) >= 1500)");
  if (sign === "1") where.push("sign = 1");
  const predicate = where.length ? " WHERE " + where.join(" AND ") : "";
  const order = q ? "CASE WHEN id = lower(?) OR iso = lower(?) THEN 0 ELSE 1 END, " : "";
  if (q) parameters.push(q, q);
  const result = await db.prepare(`SELECT ${selectFields} FROM languoid${predicate}
    ORDER BY ${order}name COLLATE NOCASE, id LIMIT 31 OFFSET ?`).bind(...parameters, offset).all();
  const records = result.results.slice(0, 30);
  const nextOffset = result.results.length > 30 ? offset + 30 : null;
  if (url.pathname.endsWith("/api/catalog")) return json({ source, records, nextOffset });
  const nextUrl = new URL(url);
  if (nextOffset !== null) nextUrl.searchParams.set("offset", String(nextOffset));
  return page("Ancient to modern language catalog", `
<h1>Ancient to modern language catalog</h1>
<p>Browse language, dialect and family records. Date filters use the source’s documentation fields where available.</p>
${catalogForm(url)}
${records.length ? `<ul>${records.map((row) => `<li><a href="https://glottolog.org/resource/languoid/id/${escape(row.id)}">${escape(row.name)}</a> <span class="detail">${escape(row.kind)} · ${escape(row.id)}${row.iso ? " · " + escape(row.iso) : ""}</span></li>`).join("")}</ul>` : "<p>No matching records.</p>"}
${nextOffset !== null ? `<p><a href="${escape(nextUrl.pathname + nextUrl.search)}">Next 30 records</a></p>` : ""}
<p>Source <a href="${source.page}">${source.title}</a> · ${source.credits} · ${source.license}</p>`);
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
    const url = new URL(request.url);
    const base = "/p/" + env.PLATFORM_ID;
    const route = url.pathname.slice(base.length);
    if (!url.pathname.startsWith(base + "/") && url.pathname !== base) return json({ error: "Platform mismatch" }, 404);
    if (env.PLATFORM_ID === "languages") {
      if (route === "/catalog" || route === "/api/catalog") return search(url, env.DB);
      if (route === "/api/coverage") {
        const data = await env.DB.prepare("SELECT kind, count(*) AS records, sum(sign) AS sign_records FROM languoid GROUP BY kind ORDER BY kind").all();
        const release = await env.DB.prepare("SELECT id, records FROM catalog_release").first();
        return json({ target: languageTarget, targetUnit: "program target", source, release, byRecordType: data.results });
      }
    }
    if (!["", "/", "/api/platform"].includes(route)) return json({ error: "Route not found" }, 404);
    const row = await env.DB.prepare("SELECT * FROM platform_record WHERE id = ?").bind(env.PLATFORM_ID).first();
    if (!row) return json({ error: "Platform record unavailable" }, 503);
    const { links_json, ...record } = row;
    record.links = JSON.parse(links_json);
    if (route === "/api/platform") return json(record);
    return page(record.title, `<h1>${escape(record.title)}</h1><p>${escape(record.purpose)}</p>
<p>Independent platform by ${escape(record.owner)}.</p>
${env.PLATFORM_ID === "languages" ? `<p><a href="${base}/catalog">Explore the language catalog</a> · <a href="${base}/api/coverage">Coverage data</a></p>` : ""}
<h2>Connected projects</h2>${links(record.links)}<p><a href="${base}/api/platform">Platform API</a></p>`);
  }
};
