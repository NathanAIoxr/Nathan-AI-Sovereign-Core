const origin = "https://unified-operations-cockpit.nathantaboract.workers.dev";
const base = "/tabor-apps/";
const workers = {
  "taborpoolboys": "taborpoolboys-app",
  "kristian-plaque": "kristian-plaque-app",
  "assessment-studio": "nathan-tabor-assessment-studio"
};
const directory = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Tabor Apps · Nathan Tabor</title>\n<style>\n*{box-sizing:border-box}body{margin:0;background:#151b1a;color:#f3ebde;font:1rem/1.6 \"Instrument Sans\",system-ui,sans-serif}main,footer{width:min(65rem,calc(100% - 2.5rem));margin:auto}header{padding:clamp(3rem,10vw,8rem) 0 1.5rem;border-bottom:1px solid #666e64}h1,h2{font:500 clamp(3.3rem,10vw,7.25rem)/.95 \"Instrument Serif\",Georgia,serif;margin:0;letter-spacing:-.055em}p{color:#d5d0be}ol{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(22rem,100%),1fr));list-style:none;padding:0;gap:1rem;margin:2rem 0}li{padding:1.35rem;background:#222d29;border:1px solid #666e64}h2{font-size:2.3rem}a{color:#f6cd8a;text-underline-offset:.24em}a:focus-visible{outline:3px solid #f6cd8a;outline-offset:4px}footer{padding:1rem 0 3rem}\n</style></head><body><main><header><h1>Tabor Apps</h1><p>Independent web apps by Nathan Tabor.</p></header><ol>\n<li><h2>TABORBOY</h2><p>Identity Blank, Motion Lab and Tabor Sideline Bait.</p><a href=\"https://taborboy.pages.dev/app/\">Open TABORBOY</a></li>\n<li><h2>TABORPOOL</h2><p>Broadsheet archive, checksum verification and ledger sandbox.</p><a href=\"https://taborpool.pages.dev/app/\">Open TABORPOOL</a></li>\n<li><h2>TaborPoolBoys</h2><p>Browse three editorial covers, pick an edition and save an issue.</p><a href=\"https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/taborpoolboys/\">Open TaborPoolBoys</a></li>\n<li><h2>KRISTIAN Plaque Archive</h2><p>Nathan Tabor’s plaque, corrected wording, and a record of the edits.</p><a href=\"https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/kristian-plaque/\">Open KRISTIAN Plaque Archive</a></li>\n<li><h2>Assessment Studio</h2><p>Personality, reasoning, QI/QE practice, and personal results.</p><a href=\"https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/assessment-studio/\">Open Assessment Studio</a></li>\n</ol></main><footer>Nathan Tabor</footer></body></html>";

function appDispatch(request, platforms) {
  const url = new URL(request.url);
  if (url.origin !== origin) return null;
  if (url.pathname === base.slice(0,-1)) return Response.redirect(origin + base, 308);
  if (!url.pathname.startsWith(base)) return null;
  if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed', {status:405,headers:{allow:'GET, HEAD'}});
  if (url.pathname === base) {
    const headers = {
      'content-type':'text/html; charset=utf-8',
      'cache-control':'no-cache',
      'content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'",
      'x-content-type-options':'nosniff',
    };
    return new Response(request.method === 'HEAD' ? null : directory, {headers});
  }
  const id = url.pathname.slice(base.length).split('/',1)[0];
  if (!Object.hasOwn(workers,id)) return new Response('App not found', {status:404});
  return forward();
  async function forward() {
    try { return await platforms.get(workers[id], {}, { limits:{ cpuMs:60,subRequests:0 } }).fetch(request); }
    catch { return new Response('Application unavailable', {status:503}); }
  }
}

export const dispatchTaborApp = appDispatch;
