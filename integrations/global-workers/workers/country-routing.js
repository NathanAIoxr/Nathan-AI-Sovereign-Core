// MIT · source: https://github.com/cloudflare/cloudflare-docs/blob/69ccd7a4ec0dfcc8fe7375ac25ae6204956174be/src/content/docs/workers/examples/country-code-redirect.mdx
// License and copyright notices: ../licenses/cloudflare-docs.txt
// Adapted from the Cloudflare Workers country-code redirect example (MIT).
const locales = new Map([["ES","es"],["MX","es"],["CO","es"],["FR","fr"],["CA","en"],["DE","de"],["JP","ja"]]);
const greetings = { en:"Welcome", es:"Bienvenido", fr:"Bienvenue", de:"Willkommen", ja:"ようこそ" };
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path==="/routes") return Response.json({spanish:["ES","MX","CO"],routes:Object.fromEntries(locales)});
    if (path==="/") return Response.redirect(new URL("/"+(locales.get(request.cf?.country)??"en"),url.origin),302);
    const lang=path.slice(1);
    if (!Object.hasOwn(greetings,lang)) return new Response("Unknown language",{status:404});
    return new Response(greetings[lang],{headers:{"Content-Language":lang,"Content-Type":"text/plain; charset=UTF-8"}});
  },
};
