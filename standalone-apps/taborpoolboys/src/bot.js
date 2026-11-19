const release = {
  "id": "taborpoolboys",
  "worker": "taborpoolboys-worker",
  "group": "standalone-apps",
  "title": "TaborPoolBoys",
  "status": "Magazine live",
  "summary": "Crossover magazine reader and Match the Covers",
  "version": "2026-11-19-magazine.1",
  "url": "https://pub-2df43f63514844ecbcd9f7da4de75d89.r2.dev/index.html"
};
const covers = [
  [
    "boys-debut",
    "210107e8cbfc4340d18453a659a0ce1647848f699bf3885f534f03e8a4db1000"
  ],
  [
    "boys-01",
    "8749ac0f4d223cda1c46bf1f9653f64f9ef0253ff70c90bf535c60ac4ed2d714"
  ],
  [
    "boys-02",
    "1a40d3e30d2743828f94cc06e3a25f20bd87025219e287b61dd9e320fb564926"
  ],
  [
    "boys-03",
    "afb1cc23aa49e9a1724511a3f6ae90243cfe50f1e785951f767a94b6b0ba9e2e"
  ],
  [
    "boys-christmas",
    "ac62d493a09388af675ab2e400dce72bfdde9a8d8606c47db0cffd3e4e7f6c97"
  ]
];
const required = [
  "index.html",
  "api/magazine.json",
  "magazine/index.html",
  "magazine/play.html",
  "magazine/style.css",
  "magazine/reader.js",
  "magazine/game.js",
  "magazine/manifest.webmanifest",
  "magazine/sw.js",
  "magazine/issues/debut.html",
  "magazine/issues/two.html",
  "magazine/issues/sexuality-and-scripture.html",
  "magazine/issues/the-oracle-den.html",
  "magazine/issues/christmas.html"
];

async function live(bucket) {
  const files = await Promise.all(required.map(key=>bucket.head(key)));
  return files.every(file=>file?.size>0);
}

async function verifyCover(bucket,[name,expected]) {
  const object = await bucket.get("magazine/covers/"+name+".webp");
  if (!object) return false;
  const digest = await crypto.subtle.digest("SHA-256",await object.arrayBuffer());
  const hex = Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("");
  return hex === expected;
}

export default {
  async fetch(request,env) {
    const url = new URL(request.url);
    if (url.hostname !== "station.internal") return new Response(null,{status:404});
    const identity = {id:release.id,worker:release.worker,version:release.version};
    if (request.method === "POST" && url.pathname === "/__hub/refresh") {
      try {
        const [ready,...checks] = await Promise.all([live(env.PUBLISHED),...covers.map(cover=>verifyCover(env.PUBLISHED,cover))]);
        const verified = ready && checks.every(Boolean);
        return Response.json({...identity,verified},{status:verified?200:503});
      } catch {
        return Response.json({...identity,verified:false},{status:503});
      }
    }
    if (!["GET","HEAD"].includes(request.method)) return new Response(null,{status:405});
    const scoped = url.pathname.replace(/^\/work\/taborpoolboys(?=\/)/,"");
    if (scoped === "/") return Response.redirect(release.url,302);
    if (scoped !== "/healthz") return new Response(null,{status:404});
    const ready = await live(env.PUBLISHED).catch(()=>false);
    return new Response(request.method==="HEAD"?null:JSON.stringify({...identity,ready}),{
      status:ready?200:503,headers:{"content-type":"application/json","cache-control":"no-store"}
    });
  }
};
