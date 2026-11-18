// MIT · source: https://github.com/cloudflare/cloudflare-docs/blob/69ccd7a4ec0dfcc8fe7375ac25ae6204956174be/src/content/docs/workers/examples/geolocation-hello-world.mdx
// License and copyright notices: ../licenses/cloudflare-docs.txt
// Adapted from the Cloudflare Workers geolocation example (MIT).
export default {
  async fetch(request) {
    const {country,continent,colo}=request.cf ?? {};
    return Response.json({ country:country??null, continent:continent??null, edge:colo??null });
  },
};
