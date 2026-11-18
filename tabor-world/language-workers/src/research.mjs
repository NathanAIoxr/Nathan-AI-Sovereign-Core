import { XMLParser, XMLValidator } from "fast-xml-parser";
import { parseDate } from "./ancient.mjs";
import { integer, readBytes, RequestError, sha256, string, webHeaders } from "./shared.mjs";

const decoder = new TextDecoder("utf-8", { fatal: true });
const researchAgent = "TaborPolyglot/1.0 (https://tabor-polyglot-knowledge-gateway.nathantaboract.workers.dev/)";

async function publicData(url, { kind = "json", limit = 2500000 } = {}) {
  const endpoint = String(url);
  const hostname = new URL(endpoint).hostname;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7500);
  try {
    const response = await fetch(endpoint, { signal: controller.signal, redirect: "manual", headers: {
      "user-agent": researchAgent, accept: kind === "json" ? "application/json" : "*/*",
    } });
    if (!response.ok) throw new RequestError(`Provider unavailable: ${hostname} (HTTP ${response.status})`, 502);
    const bytes = await readBytes(response.body, limit);
    if (kind === "font") return bytes;
    const content = decoder.decode(bytes);
    return kind === "json" ? JSON.parse(content) : content;
  } catch (error) {
    if (error instanceof RequestError && error.status === 502) throw error;
    const reason = controller.signal.aborted ? "timeout" : error instanceof SyntaxError ? "invalid JSON" :
      error instanceof RequestError ? "response size exceeded" : "network or decoding error";
    console.warn("Research provider request failed", hostname, error?.name, error?.message);
    throw new RequestError(`Provider unavailable: ${hostname} (${reason})`, 502);
  } finally {
    clearTimeout(timeout);
  }
}

const query = (input, field = "query") => string(input[field], field, 180).trim();
const size = input => integer(input.limit ?? 10, 1, 20, "limit");
const source = (url, data) => ({ source: String(url), data });
const asArray = data => data == null ? [] : Array.isArray(data) ? data : [data];

async function events(input) {
  const date = parseDate(input.date ?? new Date().toISOString().slice(0, 10));
  const kind = input.type ?? "selected";
  if (!["selected", "events", "births", "deaths", "holidays"].includes(kind)) throw new RequestError("Invalid event type");
  const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/${kind}/${date.toISOString().slice(5,10).replace("-", "/")}`;
  const data = await publicData(url);
  if (!Array.isArray(data[kind])) throw new RequestError("Invalid Wikimedia feed response", 502);
  return source(url, data[kind].slice(0, size(input)).map(event => ({
    year: event.year ?? null, summary: event.text,
    references: asArray(event.pages).map(page => page.content_urls?.desktop?.page).filter(Boolean).slice(0, 5),
  })));
}

async function wikidata(input) {
  if (input.entity !== undefined) {
    const id = string(input.entity, "entity", 14);
    if (!/^Q[1-9][0-9]*$/.test(id)) throw new RequestError("entity must be a Wikidata Q ID");
    const url = `https://www.wikidata.org/wiki/Special:EntityData/${id}.json`;
    const result = (await publicData(url)).entities?.[id];
    if (!result) throw new RequestError("Entity not returned by Wikidata", 502);
    const properties = { P31: "instance_of", P22: "father", P25: "mother", P40: "child", P26: "spouse", P460: "said_to_be_same_as", P2925: "domain_of_saint_or_deity" };
    const edges = Object.entries(properties).flatMap(([key, predicate]) => asArray(result.claims?.[key])
      .filter(claim => claim.rank !== "deprecated" && claim.mainsnak?.datavalue?.value?.id)
      .slice(0, 30).map(claim => ({ predicate, object: claim.mainsnak.datavalue.value.id, source_property: key,
        references: claim.references?.length ?? 0 })));
    return source(url, { id, label: result.labels?.en?.value, description: result.descriptions?.en?.value, edges });
  }
  const url = new URL("https://www.wikidata.org/w/api.php");
  url.search = new URLSearchParams({ action: "wbsearchentities", search: query(input), language: "en", format: "json", limit: String(size(input)) });
  const result = await publicData(url);
  if (!Array.isArray(result.search)) throw new RequestError("Invalid Wikidata response", 502);
  return source(url, result.search.map(row => ({ id: row.id, label: row.label, description: row.description })));
}

function xml(raw) {
  if (/<!\s*(DOCTYPE|ENTITY)\b/i.test(raw) || XMLValidator.validate(raw) !== true) throw new RequestError("Invalid XML or unsupported XML declaration");
  return new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, parseTagValue: false,
    processEntities: false, maxNestedTags: 60 }).parse(raw);
}

async function openLibrary(input) {
  const endpoint = new URL("https://openlibrary.org/search.json");
  if (input.isbn === undefined) endpoint.searchParams.set("q", query(input));
  else {
    const isbn = string(input.isbn, "isbn", 25).replace(/[\s-]+/g,"").toUpperCase();
    if (!/^(?:\d{9}[\dX]|\d{13})$/.test(isbn)) throw new RequestError("ISBN must contain 10 or 13 characters");
    endpoint.searchParams.set("isbn", isbn);
  }
  endpoint.searchParams.set("limit", String(size(input)));
  endpoint.searchParams.set("fields", "key,title,author_name,first_publish_year,edition_count,language");
  const data = await publicData(endpoint);
  if (!Array.isArray(data.docs)) throw new RequestError("Invalid Open Library response", 502);
  return source(endpoint, { total: data.numFound, books: data.docs });
}

async function chronicling(input) {
  const url = new URL("https://www.loc.gov/collections/chronicling-america/");
  url.search = new URLSearchParams({ qs: query(input), dl: "page", fo: "json", c: String(size(input)) });
  for (const key of ["start_date","end_date"]) {
    if (input[key] !== undefined) url.searchParams.set(key, parseDate(input[key]).toISOString().slice(0,10));
  }
  if (input.start_date && input.end_date && input.start_date > input.end_date) throw new RequestError("start_date must precede end_date");
  const data = await publicData(url, { limit: 4500000 });
  if (!Array.isArray(data.results)) throw new RequestError("Invalid Library of Congress response", 502);
  return source(url, { total: data.pagination?.total, pages: data.results.map(row => ({
    title: row.title, date: row.date, url: row.url ?? row.id, location: row.location,
  })) });
}

async function wayback(input) {
  let target;
  try {
    target = new URL(string(input.url, "url", 1000));
  } catch {
    throw new RequestError("url must be an absolute HTTPS URL");
  }
  if (target.protocol !== "https:" || target.username || target.password || target.port) throw new RequestError("url must be an HTTPS URL without credentials or port");
  const from = integer(input.from ?? 1996, 1996, 2100, "from");
  const to = integer(input.to ?? new Date().getUTCFullYear(), from, 2100, "to");
  const url = new URL("https://web.archive.org/cdx/search/cdx");
  url.search = new URLSearchParams({ url: target.href, from: String(from), to: String(to), output: "json",
    fl: "timestamp,original,statuscode,digest", filter: "statuscode:200", limit: String(size(input)) });
  const rows = await publicData(url);
  if (!Array.isArray(rows)) throw new RequestError("Invalid archive response", 502);
  return source(url, { captures: rows.slice(1).map(([timestamp, original, status, digest], index) => ({
    timestamp, original, status, digest, changed_from_previous_row: index ? digest !== rows[index][3] : null,
  })) });
}

async function gutenberg(input) {
  if (input.text !== undefined) {
    const content = string(input.text, "text", 40000);
    return { mode: "supplied TXT preview", paragraphs: content.split(/(?:\r?\n[\t ]*){2,}/).map(value => value.trim()).filter(Boolean),
      sha256: await sha256(new TextEncoder().encode(content)) };
  }
  const url = new URL("https://gutendex.com/books/");
  url.search = new URLSearchParams({ search: query(input), copyright: "false" });
  const result = await publicData(url);
  if (!Array.isArray(result.results)) throw new RequestError("Invalid Gutendex response", 502);
  return source(url, { total: result.count, records: result.results.slice(0, size(input)).map(row => ({
    id: row.id, title: row.title, authors: row.authors, languages: row.languages,
    catalog_url: `https://www.gutenberg.org/ebooks/${row.id}`,
  })) });
}

function tei(input) {
  const document = xml(string(input.xml, "xml", 40000));
  const root = document.TEI ?? document.teiCorpus;
  if (!root) throw new RequestError("A TEI or teiCorpus root is required");
  const records = [];
  function visit(node, locale) {
    if (typeof node !== "object" || node === null) return;
    const current = node["@_lang"] ?? locale;
    for (const [tag, children] of Object.entries(node)) {
      for (const child of asArray(children)) {
        if (["p","l","ab"].includes(tag)) records.push({ tag, id: child?.["@_id"] ?? null, language: child?.["@_lang"] ?? current ?? null, content: child });
        else visit(child, current);
      }
    }
  }
  visit(root);
  return { count: records.length, records: records.slice(0, 300) };
}

async function arxiv(input) {
  const url = new URL("https://export.arxiv.org/api/query");
  const terms = query(input).replace(/["\\]/g, " ");
  url.search = new URLSearchParams({ search_query: `all:"${terms}"`, max_results: String(size(input)), sortBy:"submittedDate", sortOrder:"descending" });
  const feed = xml(await publicData(url, {kind:"xml"})).feed;
  if (!feed) throw new RequestError("Invalid arXiv feed response", 502);
  return source(url, asArray(feed.entry).map(row => ({
    id: row.id, title: row.title?.replace(/\s+/g," ").trim(), published: row.published,
    authors: asArray(row.author).map(author => author.name),
  })));
}

const gardinerFont = "https://raw.githubusercontent.com/nederhof/opentypehiero/089a8d604b19cb3e5883b03ad1159ba0800a7a8f/fonts/NewGardinerSMP.ttf";
const noto = {
  egyptian: "Noto Sans Egyptian Hieroglyphs", cuneiform: "Noto Sans Cuneiform",
  linear_b: "Noto Sans Linear B", gothic: "Noto Sans Gothic", anatolian: "Noto Sans Anatolian Hieroglyphs",
};

export const researchHandlers = {
  10: async input => {
    const term = query(input);
    const url = new URL("https://en.wiktionary.org/w/api.php");
    url.search = new URLSearchParams({ action:"query", prop:"revisions", titles:term, rvprop:"content", rvslots:"main", format:"json", formatversion:"2" });
    const data = await publicData(url);
    const page = data.query?.pages?.[0];
    if (page?.missing) throw new RequestError("Wiktionary entry not found", 404);
    const wikitext = page?.revisions?.[0]?.slots?.main?.content;
    if (typeof wikitext !== "string") throw new RequestError("Invalid Wiktionary response", 502);
    const sections = [...wikitext.matchAll(/^={3,5}\s*([^=\r\n]+?)\s*={3,5}\s*$/gm)].map(match => match[1]);
    return source(url, { title: page.title, section_headings: sections.slice(0, 100), extract: wikitext.slice(0, 12000),
      attribution: `https://en.wiktionary.org/wiki/${encodeURIComponent(page.title)}`, license: "https://creativecommons.org/licenses/by-sa/4.0/" });
  },
  34: async () => new Response(await publicData(gardinerFont, {kind:"font", limit:650000}), {
    headers: { ...webHeaders, "content-type": "font/ttf", "cache-control":"public, max-age=86400",
      "content-disposition": 'attachment; filename="NewGardinerSMP.ttf"' },
  }),
  58: events,
  59: wikidata,
  81: chronicling,
  82: wayback,
  88: ({ xml: raw }) => {
    const document = xml(string(raw, "xml", 40000));
    if (!document.feed && !document.rss?.channel) throw new RequestError("RSS 2.0 or Atom feed required");
    const items = asArray(document.feed?.entry ?? document.rss?.channel?.item)
      .map(item => ({ title: item.title ?? null, date: item.published ?? item.pubDate ?? item.updated ?? null, id: item.id ?? item.guid ?? null }));
    return { items: items.slice(0, 300).map((item, i) => ({ ...item, input_index: i })).sort((a,b) =>
      (Date.parse(a.date) || 0) - (Date.parse(b.date) || 0)) };
  },
  89: gutenberg,
  90: tei,
  91: openLibrary,
  92: arxiv,
  96: ({ script }) => {
    if (!Object.hasOwn(noto, script)) throw new RequestError("Unknown Noto script family", 404);
    const family = noto[script];
    return { family, stylesheet: `https://fonts.googleapis.com/css2?family=${family.replaceAll(" ", "+")}`,
      source: `https://notofonts.github.io/`, deployment: "External font stylesheet reference" };
  },
};
