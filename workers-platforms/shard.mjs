import shard from "./data.mjs";

const headers = {
  "cache-control": "public, max-age=3600",
  "x-content-type-options": "nosniff"
};

export default {
  fetch(request) {
    const path = new URL(request.url).pathname;
    const root = "/p/" + shard.id;
    if (request.method !== "GET") return Response.json({ error: "Method not allowed" }, { status: 405 });
    if (path === root || path === root + "/") {
      return Response.json({
        ...shard,
        owner: "Nathan Tabor",
        citation: {
          credits: "Harald Hammarström, Robert Forkel, Martin Haspelmath and Sebastian Bank",
          license: "CC BY 4.0",
          url: "https://glottolog.org/meta/downloads",
          changes: "Selected fields, partitioned by Glottocode"
        }
      }, { headers });
    }
    return Response.json({ error: "Route not found" }, { status: 404 });
  }
};
