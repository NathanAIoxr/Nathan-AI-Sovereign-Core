// Nathan AI — 1,000-script concordance gateway.
// Uses only owned Cloudflare D1 databases and the existing dispatch namespace.
// Public endpoints are bounded, read-only, and attribute the Glottolog source.
const SOURCE = {
  title: "Glottolog CLDF v5.4",
  credits: "Harald Hammarström, Robert Forkel, Martin Haspelmath and Sebastian Bank",
  license: "CC BY 4.0",
  url: "https://glottolog.org/meta/downloads",
  changes: "Existing sourced records indexed and exposed through bounded queries"
};
const reply = (data, status = 200) => Response.json(data, {
  status,
  headers: {
    "cache-control": status === 200 ? "public, max-age=60" : "no-store",
    "x-content-type-options": "nosniff",
    "access-control-allow-origin": "*"
  }
});
const counts = async env => {
  const [registry, snapshots, shards, languages] = await Promise.all([
    env.COCKPIT.prepare("SELECT COUNT(*) AS n FROM dispatch_script_registry").first(),
    env.COCKPIT.prepare("SELECT COUNT(*) AS n FROM dispatch_script_snapshots").first(),
    env.COCKPIT.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(record_count),0) AS records FROM language_shard_concordance").first(),
    env.LANGUAGES.prepare("SELECT COUNT(*) AS n FROM languoid").first()
  ]);
  return {
    registered_scripts: registry?.n || 0,
    source_snapshots: snapshots?.n || 0,
    data_shards: shards?.n || 0,
    shard_language_records: shards?.records || 0,
    indexed_language_records: languages?.n || 0,
    dispatch_namespace_bound: Boolean(env.PLATFORMS)
  };
};
const validCode = value => /^[a-z0-9]{4}[0-9]{4}$/i.test(value);
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "GET") return reply({ error: "Method not allowed" }, 405);
    if (url.pathname === "/" || url.pathname === "/health") {
      return reply({
        ok: true,
        service: "nathan-ai-1000-concordance",
        purpose: "Bounded concordance and verified owned-script access",
        source: SOURCE
      });
    }
    if (url.pathname === "/api/summary") {
      try {
        const state = await counts(env);
        return reply({
          ok: true, ...state,
          state: state.registered_scripts === state.source_snapshots ? "ARCHIVE_RECONCILED" : "RECONCILIATION_NEEDED",
          interpretation: "Language shards are executable data endpoints, not independent physical supercomputers",
          source: SOURCE
        });
      } catch (error) {
        return reply({ ok: false, error: "database unavailable" }, 503);
      }
    }
    if (url.pathname === "/api/languages") {
      const q = (url.searchParams.get("q") || "").trim();
      const parsedLimit = Number(url.searchParams.get("limit") || 20);
      if (!q || q.length > 80 || !Number.isSafeInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
        return reply({ error: "q required (1-80 chars), limit 1-50" }, 400);
      }
      const literalQuery = q.replace(/[\\%_]/g, "\\$&");
      try {
        const result = await env.LANGUAGES.prepare(
          "SELECT id,name,kind,iso,family,parent_language,macroarea,first_documented,last_documented,sign " +
          "FROM languoid WHERE name LIKE ? ESCAPE '\\' OR id=? OR iso=? ORDER BY name LIMIT ?"
        ).bind("%" + literalQuery + "%", q, q, parsedLimit).all();
        return reply({ ok: true, query: q, count: result.results?.length || 0, results: result.results || [], source: SOURCE });
      } catch (error) {
        return reply({ error: "language query unavailable" }, 503);
      }
    }
    if (url.pathname.startsWith("/api/language/")) {
      const code = decodeURIComponent(url.pathname.slice("/api/language/".length));
      if (!validCode(code)) return reply({ error: "invalid Glottocode" }, 400);
      try {
        const row = await env.LANGUAGES.prepare(
          "SELECT id,name,kind,iso,family,parent_language,macroarea,first_documented,last_documented,sign FROM languoid WHERE id=?"
        ).bind(code).first();
        return row ? reply({ ok: true, record: row, source: SOURCE }) : reply({ error: "not found" }, 404);
      } catch (error) {
        return reply({ error: "language lookup unavailable" }, 503);
      }
    }
    if (url.pathname.startsWith("/api/shards/")) {
      // Deliberately expose ONLY registered, read-only language scripts.
      const name = decodeURIComponent(url.pathname.slice("/api/shards/".length));
      if (!/^language-shard-[0-9]{4}$/.test(name)) return reply({ error: "invalid shard" }, 400);
      if (!env.PLATFORMS) return reply({ error: "namespace not bound" }, 503);
      const reg = await env.COCKPIT.prepare(
        "SELECT script_name FROM dispatch_script_registry WHERE script_name=? AND script_kind='language_data' AND code_verified=1"
      ).bind(name).first();
      if (!reg) return reply({ error: "unregistered shard" }, 404);
      try {
        return await env.PLATFORMS.get(name).fetch(new Request("https://internal.invalid/p/" + name, { method: "GET" }));
      } catch (error) {
        return reply({ error: "shard failed" }, 502);
      }
    }
    return reply({ error: "not found" }, 404);
  },
  async scheduled(controller, env, ctx) {
    ctx.waitUntil((async () => {
      try {
        const state = await counts(env);
        const reconciled = state.registered_scripts === state.source_snapshots
          && state.shard_language_records === state.indexed_language_records;
        await env.COCKPIT.prepare(
          "INSERT INTO cockpit_log(tier,action,state,payload,created_at) VALUES(?,?,?,?,?)"
        ).bind(
          "FLEET",
          "CONCORDANCE_RECONCILIATION",
          reconciled ? 1 : 0,
          JSON.stringify({ cron: controller.cron, ...state }),
          new Date().toISOString()
        ).run();
      } catch (error) {
        await env.COCKPIT.prepare(
          "INSERT INTO cockpit_log(tier,action,state,payload,created_at) VALUES(?,?,?,?,?)"
        ).bind("FLEET", "CONCORDANCE_RECONCILIATION_ERROR", 0, String(error.message || error).slice(0,240), new Date().toISOString()).run();
      }
    })());
  }
};
