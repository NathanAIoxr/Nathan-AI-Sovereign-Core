type Config = Pick<Cloudflare.Env, "ARCHIVE_RAW" | "ARCHIVE_CATALOG" | "WIKIMEDIA_TOKENS"> & {
  SOURCE_USER_AGENT: string;
  WIKIMEDIA_USER?: string;
  WIKIMEDIA_PASS?: string;
  WIKIMEDIA_CACHE_KEY?: string;
  USPTO_API_KEY?: string;
  SEMANTIC_SCHOLAR_API_KEY?: string;
  OPENALEX_API_KEY?: string;
  ARCHIVE_TOPICS: string;
};

type ObjectValue = Record<string, unknown>;
type Source = {
  provider: string;
  input: string;
  url: URL;
  entityPath: string[];
  headers?: Record<string, string>;
  body?: ObjectValue;
};
type Topic = { source: string; input: string };
type Token = { access: string; expires: number; refresh: string; refreshExpires: number };

const MAX_BYTES = 4 * 1024 * 1024;
const TOKEN_KEY = "enterprise-session";
const DAY = 86400_000;
const encode = new TextEncoder();
const decode = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false });

function object(value: unknown): ObjectValue {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as ObjectValue : {};
}

function textId(value: unknown): string | null {
  return typeof value === "string" && value ? value
    : typeof value === "number" && Number.isSafeInteger(value) ? String(value) : null;
}

function url(base: string, params: Record<string, string> = {}): URL {
  const result = new URL(base);
  for (const [key, value] of Object.entries(params)) result.searchParams.set(key, value);
  return result;
}

function plan(env: Config, { source, input }: Topic): Source {
  const component = encodeURIComponent(input);
  const wiki = "https://en.wikipedia.org/w/api.php";
  const loc = "https://www.loc.gov";
  const limited = { q: input, fo: "json", c: "10", at: "results,pagination" };
  switch (source) {
    case "wikimedia":
      return { provider: source, input, url: url(wiki, {
        action: "query", format: "json", formatversion: "2", redirects: "1", prop: "info|revisions",
        inprop: "url", rvprop: "ids|timestamp|content", rvslots: "main", titles: input, maxlag: "5",
      }), entityPath: ["query", "pages"] };
    case "wikimedia-enterprise":
      return { provider: source, input,
        url: url("https://api.enterprise.wikimedia.com/v2/articles/" + component),
        body: { filters: [{ field: "is_part_of.identifier", value: "enwiki" }] }, entityPath: [] };
    case "wikidata":
      if (!/^Q[1-9]\d*$/.test(input)) throw new Error("Wikidata input must be a QID");
      return { provider: source, input, url: url("https://www.wikidata.org/w/api.php", {
        action: "wbgetentities", ids: input, format: "json", languages: "en", sitefilter: "enwiki", maxlag: "5",
      }), entityPath: ["entities", input] };
    case "wikidata-sparql":
      if (!/^Q[1-9]\d*$/.test(input)) throw new Error("Wikidata SPARQL input must be a QID");
      return { provider: source, input, url: url("https://query.wikidata.org/sparql", {
        format: "json",
        query: "SELECT ?relation ?target WHERE { wd:" + input + " ?relation ?target . " +
          'FILTER(STRSTARTS(STR(?relation), "http://www.wikidata.org/prop/direct/") && ' +
          'STRSTARTS(STR(?target), "http://www.wikidata.org/entity/Q")) } ORDER BY ?relation ?target LIMIT 25',
      }), entityPath: ["results", "bindings"] };
    case "archive":
      if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(input)) throw new Error("Invalid Internet Archive identifier");
      return { provider: source, input, url: url("https://archive.org/metadata/" + component), entityPath: ["metadata"] };
    case "loc":
      return { provider: source, input, url: url(loc + "/search/", limited), entityPath: ["results"] };
    case "chronicling-america":
      return { provider: source, input,
        url: url(loc + "/collections/chronicling-america/", limited), entityPath: ["results"] };
    case "uspto":
      if (!env.USPTO_API_KEY) throw new Error("USPTO_API_KEY is missing");
      return { provider: source, input, url: url("https://api.uspto.gov/api/v1/patent/applications/search"),
        headers: { "X-Api-Key": env.USPTO_API_KEY }, body: { q: input, pagination: { offset: 0, limit: 10 } },
        entityPath: ["patentFileWrapperDataBag"] };
    case "semantic-scholar":
      return { provider: source, input, url: url("https://api.semanticscholar.org/graph/v1/paper/search",
        { query: input, limit: "10", fields: "title,year,url,externalIds" }),
        headers: env.SEMANTIC_SCHOLAR_API_KEY ? { "x-api-key": env.SEMANTIC_SCHOLAR_API_KEY } : {},
        entityPath: ["data"] };
    case "openalex":
      return { provider: source, input, url: url("https://api.openalex.org/works",
        { search: input, per_page: "10", select: "id,doi,display_name,publication_year,primary_location" }),
        headers: env.OPENALEX_API_KEY ? { Authorization: "Bearer " + env.OPENALEX_API_KEY } : {},
        entityPath: ["results"] };
    default:
      throw new Error("Unknown source");
  }
}

async function boundedJson(response: Response): Promise<{ bytes: Uint8Array<ArrayBuffer>; data: unknown }> {
  if (!response.body) throw new Error("Missing upstream response body");
  if (Number(response.headers.get("content-length")) > MAX_BYTES) {
    await response.body.cancel();
    throw new Error("Upstream response exceeds byte limit");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error("Upstream response exceeds byte limit");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { bytes, data: JSON.parse(decode.decode(bytes)) as unknown };
}

function request(target: URL, headers: Record<string, string>, body?: ObjectValue): Promise<Response> {
  return fetch(target, {
    method: body ? "POST" : "GET", redirect: "error", signal: AbortSignal.timeout(15_000),
    headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function drain(response: Response): Promise<void> {
  await response.body?.cancel();
}

function bytesFromBase64(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}

async function cacheKey(env: Config): Promise<CryptoKey> {
  const bytes = bytesFromBase64(env.WIKIMEDIA_CACHE_KEY ?? "");
  if (bytes.length !== 32) throw new Error("WIKIMEDIA_CACHE_KEY must contain 32 base64-encoded random bytes");
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function cachedToken(env: Config, key: CryptoKey): Promise<Token | undefined> {
  const stored = await env.WIKIMEDIA_TOKENS.get(TOKEN_KEY, "json");
  const { iv, ciphertext } = object(stored);
  if (typeof iv !== "string" || typeof ciphertext !== "string") return;
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: bytesFromBase64(iv) }, key, bytesFromBase64(ciphertext),
    );
    const token = JSON.parse(decode.decode(plaintext)) as Token;
    if (token.refreshExpires > Date.now() + 120_000) return token;
  } catch {
    // A rotated cache key invalidates the cached session.
  }
}

async function enterpriseToken(env: Config, rejectedAccess?: string): Promise<string> {
  const username = env.WIKIMEDIA_USER?.toLowerCase();
  if (!username || !env.WIKIMEDIA_PASS) throw new Error("Wikimedia Enterprise credentials are missing");
  const key = await cacheKey(env);
  const previous = await cachedToken(env, key);
  if (previous && previous.access !== rejectedAccess && previous.expires > Date.now() + 120_000) {
    return previous.access;
  }

  const headers = { "User-Agent": env.SOURCE_USER_AGENT };
  const auth = "https://auth.enterprise.wikimedia.com/v1/";
  let refresh = previous?.refresh;
  let refreshExpires = previous?.refreshExpires ?? 0;
  let response = refresh
    ? await request(url(auth + "token-refresh"), headers, { username, refresh_token: refresh })
    : undefined;
  if (response && [400, 401, 403].includes(response.status)) {
    await drain(response);
    response = undefined;
    refresh = undefined;
  }
  if (!response) {
    response = await request(url(auth + "login"), headers, { username, password: env.WIKIMEDIA_PASS });
    refreshExpires = Date.now() + 90 * DAY;
  }
  if (!response.ok) {
    await drain(response);
    throw new Error("Wikimedia authentication HTTP " + response.status);
  }
  const data = object((await boundedJson(response)).data);
  const access = data.access_token;
  refresh = typeof data.refresh_token === "string" ? data.refresh_token : refresh;
  if (typeof access !== "string" || !refresh || typeof data.expires_in !== "number" || data.expires_in <= 0) {
    throw new Error("Wikimedia authentication returned an invalid token response");
  }
  const token: Token = { access, refresh, refreshExpires, expires: Date.now() + data.expires_in * 1000 };
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encode.encode(JSON.stringify(token)));
  await env.WIKIMEDIA_TOKENS.put(TOKEN_KEY, JSON.stringify({
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
  }), { expiration: Math.floor(refreshExpires / 1000) });
  return access;
}

function catalogItems(source: Source, payload: unknown): ObjectValue[] {
  let nodes = payload;
  for (const key of source.entityPath) nodes = object(nodes)[key];
  if (Array.isArray(nodes)) return nodes.map(object);
  return nodes && typeof nodes === "object" ? [object(nodes)] : [];
}

async function fingerprint(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, "0")).join("");
}

async function ingest(env: Config, topic: Topic): Promise<{ snapshot: string; entities: number }> {
  const source = plan(env, topic);
  const headers = { "User-Agent": env.SOURCE_USER_AGENT, ...source.headers };
  let access = source.provider === "wikimedia-enterprise" ? await enterpriseToken(env) : undefined;
  const fetchSource = () => request(source.url, access ? { ...headers, Authorization: "Bearer " + access } : headers, source.body);
  let response = await fetchSource();
  if (response.status === 401 && access) {
    await drain(response);
    access = await enterpriseToken(env, access);
    response = await fetchSource();
  }
  if (!response.ok) {
    const retryAfter = response.headers.get("retry-after");
    await drain(response);
    throw new UpstreamError(response.status, retryAfter);
  }
  const { bytes, data } = await boundedJson(response);
  const upstream = object(data);
  if (object(upstream.error).code === "maxlag") throw new UpstreamError(503, response.headers.get("retry-after"));
  if (upstream.error || upstream.errors) throw new Error("Provider returned an API error");
  const items = catalogItems(source, data);
  const entities = new Map<string, { uri: string | null; version: string | null }>();
  for (const item of items) {
    if (item.missing !== undefined || item.invalid !== undefined) continue;
    if (source.provider === "wikidata-sparql") {
      const relation = textId(object(item.relation).value);
      const uri = textId(object(item.target).value);
      if (relation && uri) entities.set(relation + " " + uri, { uri, version: null });
      continue;
    }
    const id = textId(item.pageid ?? item.identifier ?? item.id ?? item.paperId ?? item.applicationNumberText);
    const revision = Array.isArray(item.revisions) ? object(item.revisions[0]) : {};
    const version = textId(revision.revid ?? object(item.version).identifier ?? item.lastrevid);
    if (id) entities.set(id, { uri: textId(item.fullurl ?? item.url ?? item.doi), version });
  }
  const hash = await fingerprint(bytes);
  const identity = await fingerprint(new Uint8Array(encode.encode(JSON.stringify([source.provider, source.input, hash]))));
  const rawKey = "nutsy/archive/" + source.provider + "/" + hash + ".json";
  const time = new Date().toISOString();
  // R2 verifies the transmitted bytes against this checksum before accepting the object.
  await env.ARCHIVE_RAW.put(rawKey, bytes, {
    sha256: Uint8Array.from(hash.match(/../g) ?? [], pair => Number.parseInt(pair, 16)).buffer, onlyIf: { etagDoesNotMatch: "*" }, httpMetadata: { contentType: "application/json" },
  });
  const db = env.ARCHIVE_CATALOG;
  await db.batch([
    db.prepare(`INSERT INTO nutsy_archive_snapshots
      (id, provider, lookup, source_url, retrieved_at, sha256, r2_key)
      VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`)
      .bind(identity, source.provider, source.input, source.url.toString(), time, hash, rawKey),
    ...Array.from(entities, ([id, { uri, version }]) => db.prepare(`INSERT INTO nutsy_archive_entities
      (snapshot_id, entity_id, canonical_url, source_version) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING`).bind(identity, id, uri, version)),
  ]);
  return { snapshot: identity, entities: entities.size };
}

class UpstreamError extends Error {
  readonly status: number;
  readonly retryAfter: string | null;

  constructor(status: number, retryAfter: string | null) {
    super("Upstream HTTP " + status);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

function retryTime(value: string | null): number {
  if (!value) return Date.now() + 3600_000;
  if (/^\d+$/.test(value)) return Date.now() + Number(value) * 1000;
  return Date.parse(value) || Date.now() + 3600_000;
}

function topics(raw: string): Topic[] {
  const entries: unknown = JSON.parse(raw);
  if (!Array.isArray(entries) || entries.length > 8) throw new Error("ARCHIVE_TOPICS must contain at most eight entries");
  return entries.map((entry: unknown) => {
    const { source, input } = object(entry);
    if (typeof source !== "string" || typeof input !== "string" || !input.trim() || input.length > 200) {
      throw new Error("Invalid archive topic");
    }
    return { source, input: input.trim() };
  });
}

export default {
  async scheduled(_event: ScheduledController, env: Config): Promise<void> {
    if (!env.SOURCE_USER_AGENT?.trim()) throw new Error("Set a descriptive SOURCE_USER_AGENT with contact information");
    const failures = [];
    for (const topic of topics(env.ARCHIVE_TOPICS)) {
      try {
        const state = await env.ARCHIVE_CATALOG.prepare(
          "SELECT until_ms FROM nutsy_archive_cooldowns WHERE provider = ?",
        ).bind(topic.source).first<{ until_ms: number }>();
        if (state && state.until_ms > Date.now()) continue;
        const result = await ingest(env, topic);
        console.log(JSON.stringify({ event: "archive_ingested", provider: topic.source, ...result }));
      } catch (error) {
        if (error instanceof UpstreamError && (error.status === 429 || error.status === 503)) {
          await env.ARCHIVE_CATALOG.prepare(`INSERT INTO nutsy_archive_cooldowns (provider, until_ms)
            VALUES (?, ?) ON CONFLICT(provider) DO UPDATE SET until_ms = MAX(until_ms, excluded.until_ms)`)
            .bind(topic.source, retryTime(error.retryAfter)).run();
        }
        const status = error instanceof UpstreamError ? error.status : undefined;
        console.error(JSON.stringify({ event: "archive_ingestion_failed", provider: topic.source, status }));
        failures.push(topic.source);
      }
    }
    if (failures.length) throw new Error("Archive ingestion failed for: " + failures.join(", "));
  },
};
