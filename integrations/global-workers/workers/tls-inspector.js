// MIT · source: https://github.com/cloudflare/cloudflare-docs/blob/69ccd7a4ec0dfcc8fe7375ac25ae6204956174be/src/content/docs/workers/examples/block-on-tls.mdx
// License and copyright notices: ../licenses/cloudflare-docs.txt
// Adapted from the Cloudflare Workers block-on-TLS example (MIT).
export default {
  async fetch(request) {
    const tlsVersion = request.cf?.tlsVersion ?? null;
    const accepted = tlsVersion === "TLSv1.2" || tlsVersion === "TLSv1.3";
    return Response.json({ tlsVersion, minimum: "TLSv1.2", accepted }, { status: accepted || !tlsVersion ? 200 : 403 });
  },
};
