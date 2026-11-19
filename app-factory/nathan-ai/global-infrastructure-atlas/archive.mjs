const snapshot = "2026-11-18";
const catalogKey = `${snapshot}/catalog.json.gz`;
const downloads = new Map([
  ["/archive/download", "whole_global_computing_network_atlas.zip"],
  ["/archive/discovery-v1.zip", "global_tech_discovery_bundle-v1.zip"],
  ["/archive/discovery-v2.zip", "global_tech_discovery_bundle-v2.zip"],
]);
const catalogPaths = new Set([
  "/api/archive/summary", "/api/archive/components", "/api/archive/catalog.json",
]);
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=300",
  "X-Content-Type-Options": "nosniff",
};

function json(request, data, status = 200) {
  return new Response(request.method === "HEAD" ? null : JSON.stringify(data), {
    status,
    headers: {
      ...headers,
      "Cache-Control": status < 400 ? headers["Cache-Control"] : "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export async function serveArchive(request, url, path, bucket) {
  const filename = downloads.get(path);
  if (!filename && !catalogPaths.has(path)) return undefined;
  if (!bucket) return json(request, { error: "archive_unavailable" }, 503);

  try {
    if (filename) {
      const key = `${snapshot}/${filename}`;
      const object = await (request.method === "HEAD" ? bucket.head(key) : bucket.get(key));
      if (!object) return json(request, { error: "archive_unavailable" }, 503);
      return new Response(object.body ?? null, {
        headers: {
          ...headers,
          "Content-Type": "application/zip",
          "Content-Length": String(object.size),
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const object = await bucket.get(catalogKey);
    if (!object) return json(request, { error: "archive_unavailable" }, 503);
    const data = await new Response(object.body.pipeThrough(new DecompressionStream("gzip"))).json();
    if (path === "/api/archive/catalog.json") return json(request, data);
    if (path === "/api/archive/summary") {
      return json(request, {
        snapshot: data.as_of,
        scope: data.scope,
        counts: data.counts,
        prior_catalog_entries_preserved: data.prior_catalog_entries_preserved,
        components: "/api/archive/components",
        catalog: "/api/archive/catalog.json",
        downloads: [...downloads.keys()],
      });
    }

    const params = url.searchParams;
    const layer = params.get("layer");
    const query = (params.get("q") ?? "").trim().toLowerCase().slice(0, 80);
    const limit = Math.max(1, Math.min(100, Math.trunc(Number(params.get("limit"))) || 50));
    const offset = Math.max(0, Math.min(data.nodes.length, Math.trunc(Number(params.get("offset"))) || 0));
    const matches = data.nodes.filter((item) =>
      (!layer || item.layers.includes(layer)) && (!query || item.name.toLowerCase().includes(query)),
    );
    const next = offset + limit;
    return json(request, {
      count: matches.length,
      items: matches.slice(offset, next),
      next_offset: next < matches.length ? next : null,
    });
  } catch {
    return json(request, { error: "archive_unavailable" }, 503);
  }
}
