// Nathan AI Global Catalog Bridge — public metadata only.
// Cloudflare D1 is the authoritative registry; GitHub's 205-item export is the mirror.
// Never run, clone, scan, or install candidate third-party repositories here.
const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, OPTIONS"
};
const respond = (value, status=200) => new Response(JSON.stringify(value), {status, headers});
const numberArg = (value, fallback, maximum) => {
  if (value === null || !/^[0-9]{1,6}$/.test(value)) return fallback;
  return Math.min(maximum, Math.max(0, Number(value)));
};
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, {status: 204, headers});
    if (request.method !== "GET" && request.method !== "HEAD") return respond({error:"method_not_allowed"}, 405);
    if (!env.ATLAS) return respond({error:"catalog_binding_unavailable"}, 503);
    try {
      if (url.pathname === "/" || url.pathname === "/health") {
        const count = await env.ATLAS.prepare("SELECT COUNT(*) AS n FROM global_atlas_public_repos").first();
        return respond({service:"nathan-ai-global-catalog-bridge",status:"ok",repositories:Number(count?.n || 0),mode:"public_metadata_read_only"});
      }
      if (url.pathname === "/api/summary") {
        const [repo,component,layer,source,imports] = await Promise.all([
          env.ATLAS.prepare("SELECT COUNT(*) AS n, SUM(CASE WHEN status='discovered_not_installed' THEN 1 ELSE 0 END) AS discovered_only FROM global_atlas_public_repos").first(),
          env.ATLAS.prepare("SELECT COUNT(*) AS n FROM global_atlas_components").first(),
          env.ATLAS.prepare("SELECT COUNT(*) AS n FROM global_atlas_layers").first(),
          env.ATLAS.prepare("SELECT COUNT(*) AS n FROM global_atlas_sources").first(),
          env.ATLAS.prepare("SELECT COUNT(*) AS n FROM imported_workers").first()
        ]);
        return respond({
          source_of_truth:"Cloudflare D1 tabor-global-import-catalog",
          github_mirror:"https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/app-factory/nathan-ai/global-infrastructure-atlas/public-github-discovery-205.json",
          totals:{public_repositories:Number(repo?.n||0),public_repositories_discovered_only:Number(repo?.discovered_only||0),public_components:Number(component?.n||0),layers:Number(layer?.n||0),source_directories:Number(source?.n||0),imported_worker_records:Number(imports?.n||0)},
          deployment_meaning:"Research records are not installed software, running third-party programs, or physical servers",
          mode:"public_metadata_read_only"
        });
      }
      if (url.pathname === "/api/repos") {
        const limit = Math.max(1, numberArg(url.searchParams.get("limit"), 50, 100));
        const offset = numberArg(url.searchParams.get("offset"), 0, 1000);
        const category = url.searchParams.get("category");
        if (category && (category.length > 100 || /[\x00-\x1F]/.test(category))) return respond({error:"invalid_category"},400);
        const where = category ? " WHERE category = ?" : "";
        const count = await (category ?
          env.ATLAS.prepare("SELECT COUNT(*) AS n FROM global_atlas_public_repos WHERE category = ?").bind(category).first() :
          env.ATLAS.prepare("SELECT COUNT(*) AS n FROM global_atlas_public_repos").first());
        const sql = "SELECT repo, name, category, url, fit, status FROM global_atlas_public_repos" + where + " ORDER BY repo LIMIT ? OFFSET ?";
        const data = category ?
          await env.ATLAS.prepare(sql).bind(category, limit, offset).all() :
          await env.ATLAS.prepare(sql).bind(limit, offset).all();
        return respond({total:Number(count?.n||0),offset,limit,items:data.results||[],next_offset:offset+limit<Number(count?.n||0)?offset+limit:null});
      }
      if (url.pathname === "/api/sources") {
        const result = await env.ATLAS.prepare("SELECT name, url FROM global_atlas_sources ORDER BY name").all();
        return respond({items:result.results||[]});
      }
      if (url.pathname === "/api/layers") {
        const result = await env.ATLAS.prepare("SELECT id, title FROM global_atlas_layers ORDER BY id").all();
        return respond({items:result.results||[]});
      }
      return respond({error:"not_found"},404);
    } catch (error) {
      // Internal D1 errors are not exposed to the internet.
      return respond({error:"catalog_unavailable"},503);
    }
  }
};
