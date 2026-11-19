const project = "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core";
const sourcePath = "/tree/main/app-factory/nathan-ai/global-bounties";
const covenant = Object.freeze({
  architect: "Nathan Tabor | Nathan AI Sovereign Core",
  mandate: "Innocence is not a commodity anymore.",
  principles: ["Honor", "Loyalty", "Preserve source attribution"],
  math: {
    build: "1+1=2",
    clear: "1-1=0",
    integrate: "1×1=1",
    verify: "1÷1=1"
  },
  decision: "Yes is Yes — No is No."
});

const statuses = ["OPEN", "UNDER_REVIEW", "ACTIVE_CLOSED_TO_NEW_ENTRIES", "CLOSED", "PAUSED"];
const categories = ["mathematics", "science"];
const responseHeaders = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Sovereign-Architect": "Nathan Tabor",
  "X-Sovereign-Covenant": "Innocence-Is-Not-A-Commodity",
  "X-Sovereign-Math": "1+1=2; 1-1=0"
};
const toolList = [
  {
    name: "search_bounties",
    description: "Search source-checked mathematics prizes and science challenges.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        category: { type: "string", enum: [...categories, "math"] },
        status: { type: "string", enum: statuses },
        q: { type: "string", maxLength: 120 },
        limit: { type: "integer", minimum: 1, maximum: 100 }
      }
    },
    annotations: { readOnlyHint: true, destructiveHint: false }
  },
  {
    name: "get_prize_stats",
    description: "Count open records and report prize and pool amounts separately.",
    inputSchema: { type: "object", additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false }
  }
];

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(payload, status = 200, headers = {}) {
  return Response.json(payload, { status, headers: { ...responseHeaders, ...headers } });
}

function reply(payload, status = 200) {
  return json({ _covenant: covenant, ...payload }, status, { "Access-Control-Allow-Origin": "*" });
}

function plain(value, type = "text/plain; charset=utf-8") {
  return new Response(value, { headers: { ...responseHeaders, "Content-Type": type } });
}

function publicBase(url, env) {
  return (env.PUBLIC_BASE_URL ?? url.origin).replace(/\/$/, "");
}

function discovery(base) {
  return {
    name: "Nathan AI Global Bounties & Grand Challenges",
    version: "1.0.0",
    description: "Public, opt-in participation and read access for mathematics and science.",
    scope: ["system", "non-system"],
    url: base + "/",
    mcp: { url: base + "/mcp", transport: "streamable-http", access: "read-only" },
    openapi: base + "/openapi.json",
    join: base + "/join",
    source: project + sourcePath
  };
}

const initialized = new WeakSet();

async function prepareCatalog(db) {
  if (initialized.has(db)) return;
  await db.batch(bootstrapSql.map((sql) => db.prepare(sql)));
  initialized.add(db);
}

function parseFilters(input) {
  const category = input.category === "math" ? "mathematics" : input.category;
  const { status, q } = input;
  const limit = input.limit === undefined ? 50 : Number(input.limit);
  if (category !== undefined && !categories.includes(category)) {
    throw new RequestError(400, "Choose mathematics or science.");
  }
  if (status !== undefined && !statuses.includes(status)) {
    throw new RequestError(400, "Choose a supported status.");
  }
  if (q !== undefined && (typeof q !== "string" || q.length > 120)) {
    throw new RequestError(400, "Search text must contain at most 120 characters.");
  }
  if ((input.limit !== undefined && !["number", "string"].includes(typeof input.limit)) ||
      !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new RequestError(400, "Limit must be an integer from 1 to 100.");
  }
  return { category, status, q, limit };
}

async function listBounties(db, input) {
  const { category, status, q, limit } = parseFilters(input);
  await prepareCatalog(db);
  const filters = [];
  const params = [];
  if (category) {
    filters.push("category = ?");
    params.push(category);
  }
  if (status) {
    filters.push("status = ?");
    params.push(status);
  }
  if (q) {
    filters.push("(instr(lower(title), lower(?)) > 0 OR instr(lower(organization), lower(?)) > 0 OR instr(lower(description), lower(?)) > 0)");
    params.push(q, q, q);
  }
  const where = filters.length ? " WHERE " + filters.join(" AND ") : "";
  const { results } = await db.prepare(`SELECT * FROM global_bounties${where} ORDER BY payout_usd DESC, id LIMIT ?`)
    .bind(...params, limit).all();
  return { count: results.length, bounties: results };
}

async function prizeStats(db) {
  await prepareCatalog(db);
  const { results } = await db.prepare(`
    SELECT category, payout_kind, COUNT(*) AS count, SUM(payout_usd) AS reported_usd
    FROM global_bounties WHERE status = 'OPEN'
    GROUP BY category, payout_kind ORDER BY category, payout_kind
  `).all();
  const totals = { count: 0, prize_usd: 0, pool_usd: 0 };
  for (const row of results) {
    totals.count += row.count;
    totals[row.payout_kind + "_usd"] += row.reported_usd;
  }
  return { status: "OPEN", totals, breakdown: results };
}

async function authorized(request, secret) {
  const header = request.headers.get("Authorization");
  if (!secret || !header?.startsWith("Bearer ") || header.length > 1024) return false;
  const encoding = new TextEncoder();
  const [given, expected] = await Promise.all(
    [header.slice(7), secret].map((value) => crypto.subtle.digest("SHA-256", encoding.encode(value)))
  );
  const expectedBytes = new Uint8Array(expected);
  return new Uint8Array(given).reduce((delta, value, i) => delta | (value ^ expectedBytes[i]), 0) === 0;
}

async function readJson(request) {
  if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new RequestError(415, "Content-Type must be application/json.");
  }
  if (!request.body) throw new RequestError(400, "A JSON body is required.");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16_384) {
        await reader.cancel();
        throw new RequestError(413, "Request body exceeds 16 KiB.");
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(text + decoder.decode());
  } catch {
    throw new RequestError(400, "Malformed JSON.");
  }
}

async function updateBounty(request, env) {
  if (!await authorized(request, env.API_KEY)) {
    return json({ _covenant: covenant, error: "Unauthorized" }, 401, { "WWW-Authenticate": "Bearer" });
  }
  const row = await readJson(request);
  if (!row || typeof row !== "object" || Array.isArray(row)) throw new RequestError(400, "Expected an object.");
  if (typeof row.id !== "string" || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(row.id)) {
    throw new RequestError(400, "Use a lowercase record ID with letters, digits and hyphens.");
  }
  for (const [key, limit] of [["title", 200], ["organization", 200], ["description", 2_000], ["source_url", 500]]) {
    if (typeof row[key] !== "string" || !row[key].trim() || row[key].length > limit) {
      throw new RequestError(400, "Missing or invalid " + key + ".");
    }
    row[key] = row[key].trim();
  }
  let source;
  try { source = new URL(row.source_url); } catch { throw new RequestError(400, "Invalid source_url."); }
  if (source.protocol !== "https:" || source.username || source.password) {
    throw new RequestError(400, "Use a public HTTPS sponsor or administrator source.");
  }
  if (!categories.includes(row.category) || !statuses.includes(row.status) ||
      !["prize", "pool"].includes(row.payout_kind) || !Number.isSafeInteger(row.payout_usd) ||
      row.payout_usd < 0 || row.payout_usd > 1_000_000_000_000 ||
      (row.deadline != null && (typeof row.deadline !== "string" || row.deadline.length > 200))) {
    throw new RequestError(400, "Invalid category, status, payout or deadline.");
  }
  const checkedOn = new Date().toISOString().slice(0, 10);
  await prepareCatalog(env.DB);
  const change = await env.DB.prepare(`
    INSERT INTO global_bounties
      (id, title, organization, category, payout_usd, payout_kind, status, deadline, source_url, description, checked_on)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET title=excluded.title, organization=excluded.organization,
      category=excluded.category, payout_usd=excluded.payout_usd, payout_kind=excluded.payout_kind,
      status=excluded.status, deadline=excluded.deadline, source_url=excluded.source_url,
      description=excluded.description, checked_on=excluded.checked_on
    WHERE excluded.checked_on >= global_bounties.checked_on
  `).bind(row.id, row.title, row.organization, row.category, row.payout_usd, row.payout_kind,
    row.status, row.deadline ?? null, source.href, row.description, checkedOn).run();
  if (!change.meta.changes) throw new RequestError(409, "The catalog has a later source check.");
  return json({ _covenant: covenant, status: "upserted", id: row.id, checked_on: checkedOn });
}

async function handleMcp(request, env, base) {
  const origin = request.headers.get("Origin");
  if (origin !== null && origin !== new URL(base).origin) return json({ error: "Forbidden origin" }, 403);
  if (request.method !== "POST") return json({ error: "Use POST for MCP" }, 405, { Allow: "POST" });

  let rpc;
  try { rpc = await readJson(request); } catch (error) {
    return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: error.message } }, error.status);
  }
  const id = rpc?.id;
  const validId = typeof id === "string" || Number.isSafeInteger(id);
  const success = (result) => json({ jsonrpc: "2.0", id, result });
  const failure = (code, message, status = 200) =>
    json({ jsonrpc: "2.0", id: validId ? id : null, error: { code, message } }, status);
  if (rpc?.jsonrpc !== "2.0" || typeof rpc.method !== "string" || (id !== undefined && !validId)) {
    return failure(-32600, "Invalid Request", 400);
  }
  if (id === undefined) return new Response(null, { status: 202, headers: responseHeaders });

  const versions = ["2025-11-25", "2025-06-18", "2025-03-26"];
  const protocolHeader = request.headers.get("MCP-Protocol-Version");
  if (protocolHeader !== null && !versions.includes(protocolHeader)) {
    return failure(-32600, "Unsupported MCP-Protocol-Version", 400);
  }
  if (rpc.method === "initialize") {
    return success({
      protocolVersion: versions.includes(rpc.params?.protocolVersion) ? rpc.params.protocolVersion : versions[0],
      capabilities: { tools: {} },
      serverInfo: { name: "nathan-ai-bounties-db", version: "1.0.0" },
      instructions: covenant.mandate + " Preserve the source URL with cited results."
    });
  }
  if (rpc.method === "ping") return success({});
  if (rpc.method === "tools/list") return success({ tools: toolList });
  if (rpc.method !== "tools/call") return failure(-32601, "Method not found");
  const tool = toolList.find(({ name }) => name === rpc.params?.name);
  const args = rpc.params?.arguments ?? {};
  if (!tool || !args || typeof args !== "object" || Array.isArray(args) ||
      Object.keys(args).some((key) => !Object.hasOwn(tool.inputSchema.properties, key))) {
    return failure(-32602, "Unknown tool or invalid tool arguments");
  }
  try {
    const result = tool.name === "search_bounties" ? await listBounties(env.DB, args) : await prizeStats(env.DB);
    return success({ content: [{ type: "text", text: JSON.stringify({ _covenant: covenant, ...result }) }] });
  } catch (error) {
    const message = error instanceof RequestError ? error.message : "Catalog unavailable";
    return success({ isError: true, content: [{ type: "text", text: message }] });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const base = publicBase(url, env);
    const mount = new URL(base).pathname.replace(/\/$/, "");
    const path = mount && url.pathname.startsWith(mount + "/") ? url.pathname.slice(mount.length) : url.pathname;
    try {
      if (path === "/mcp") return await handleMcp(request, env, base);
      if (path === "/bounties" && request.method === "POST") return await updateBounty(request, env);
      if (request.method !== "GET") {
        return json({ _covenant: covenant, error: "Method not allowed" }, 405,
          { Allow: path === "/bounties" ? "GET, POST" : "GET" });
      }
      switch (path) {
        case "/":
        case "/.well-known/agent.json":
          return reply(discovery(base));
        case "/join":
          return reply({
            invitation: "Bots, agents, repositories, and people are invited to contribute source-backed math and science records and corrections.",
            scopes: {
              system: "Use the same public endpoints from Nathan AI Workers and repositories.",
              "non-system": "Use the public endpoints from independent clients and repositories."
            },
            access: "Public read and opt-in review. A repository pull request proposes changes for maintainer review.",
            issue: project + "/issues/new?title=Global%20Bounties%3A%20",
            contribution_guide: project + sourcePath + "#join",
            openapi: base + "/openapi.json",
            mcp: base + "/mcp"
          });
        case "/bounties":
          return reply(await listBounties(env.DB, Object.fromEntries(url.searchParams)));
        case "/stats":
          return reply(await prizeStats(env.DB));
        case "/openapi.json":
          return json({ ...openApiDocument, servers: [{ url: base }] }, 200, { "Access-Control-Allow-Origin": "*" });
        case "/llms.txt":
          return plain([
            "# Nathan AI Global Bounties & Grand Challenges",
            "> " + covenant.mandate + " Nathan Tabor. Honor, loyalty and source attribution.",
            "",
            "## Participate",
            `- [Join](${base}/join)`,
            `- [Source and contribution guide](${project}${sourcePath}#join)`,
            "",
            "## Catalog",
            `- [Bounties](${base}/bounties)`,
            `- [Stats](${base}/stats)`,
            `- [OpenAPI](${base}/openapi.json)`,
            `- [MCP](${base}/mcp)`,
            ""
          ].join("\n"));
        case "/robots.txt":
          return plain("User-agent: *\nAllow: /\n" + `Sitemap: ${base}/sitemap.xml\n`);
        case "/sitemap.xml":
          return plain('<?xml version="1.0" encoding="utf-8"?>' +
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
            ["/", "/join", "/bounties", "/stats", "/openapi.json", "/llms.txt", "/.well-known/agent.json"]
              .map((endpoint) => `<url><loc>${base}${endpoint}</loc></url>`).join("") + "</urlset>",
            "application/xml; charset=utf-8");
        default:
          return reply({ error: "Not found" }, 404);
      }
    } catch (error) {
      if (error instanceof RequestError) return json({ _covenant: covenant, error: error.message }, error.status);
      return json({ _covenant: covenant, error: "Catalog unavailable" }, 503);
    }
  }
};
