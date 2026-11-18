// MIT · source: https://github.com/cloudflare/cloudflare-docs/blob/69ccd7a4ec0dfcc8fe7375ac25ae6204956174be/src/content/docs/workers/examples/read-post.mdx
// License and copyright notices: ../licenses/cloudflare-docs.txt
// Adapted from the Cloudflare Workers read POST example (MIT).
const MAX_BYTES = 32768;
export default {
  async fetch(request) {
    if (request.method === "GET") return Response.json({ method:"POST", contentTypes:["application/json","text/plain"], maxBytes:MAX_BYTES });
    if (request.method !== "POST") return new Response(null, { status:405, headers:{Allow:"GET, POST"} });
    const contentType=(request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!["application/json","text/plain"].includes(contentType)) return Response.json({error:"Unsupported content type"},{status:415});
    if (!request.body) return Response.json({error:"Empty body"},{status:400});
    const reader = request.body.getReader();
    const data = new Uint8Array(MAX_BYTES);
    let length = 0;
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      if (length + value.length > MAX_BYTES) {
        await reader.cancel();
        return Response.json({error:"Request body too large"},{status:413});
      }
      data.set(value,length);
      length += value.length;
    }
    try {
      const text=new TextDecoder("utf-8",{fatal:true}).decode(data.subarray(0,length));
      if (contentType==="application/json") {
        const value=JSON.parse(text);
        return Response.json({ contentType, bytes:length, type:value===null?"null":Array.isArray(value)?"array":typeof value });
      }
      return Response.json({ contentType, bytes:length, codePoints:[...text].length });
    } catch {
      return Response.json({error:"Invalid input"},{status:400});
    }
  },
};
