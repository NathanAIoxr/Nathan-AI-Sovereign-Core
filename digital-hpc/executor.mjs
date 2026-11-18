import { computeShard, scale } from "./model.mjs";

export default {
  fetch(request) {
    const match = /^\/shard\/(\d)$/.exec(new URL(request.url).pathname);
    if (request.method !== "GET" || !match || Number(match[1]) >= scale) {
      return Response.json({ error: "Invalid shard request" }, { status: 400 });
    }
    return Response.json(computeShard(Number(match[1])));
  }
};
