// MIT · source: https://github.com/cloudflare/cloudflare-docs/blob/69ccd7a4ec0dfcc8fe7375ac25ae6204956174be/src/content/docs/workers/examples/alter-headers.mdx
// License and copyright notices: ../licenses/cloudflare-docs.txt
// Adapted from the Cloudflare Workers alter headers example (MIT).
export default {
  async fetch() {
    const response = new Response("X-Example header transformation", {headers:{"X-Example":"initial","X-Remove":"removed"}});
    const newResponse = new Response(response.body,response);
    newResponse.headers.set("X-Example","updated");
    newResponse.headers.append("Vary","Accept");
    newResponse.headers.delete("X-Remove");
    return newResponse;
  },
};
