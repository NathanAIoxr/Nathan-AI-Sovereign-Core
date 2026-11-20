export function createLearningMethods(data, site) {
  const methods = new Map(data.methods.map(method => [method.id, method]));
  const escape = value => String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
  const headers = {
    "content-security-policy": "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    "x-content-type-options": "nosniff",
    "cache-control": "no-store",
  };
  const civics = "https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/institution/civics/";
  const archive = "https://nathan-ai-gateway-archive-20261118.nathantaboract.workers.dev/gateway-monroe-redstone/";
  const academy = "https://tabor-bridge.nathantaboract.workers.dev/tabor-academy/institution/";
  const href = id => site.publicBase + "/" + id + "/";
  const js = `const form=document.querySelector("[data-method]");
const status=document.querySelector("#method-progress");
if(form&&status){
 const key="tabor.learning-methods.v1."+form.dataset.method;
 const checks=[...form.querySelectorAll('input[type="checkbox"]')];
 try{const saved=JSON.parse(localStorage.getItem(key)||"[]");checks.forEach((el,i)=>el.checked=saved[i]===true)}catch{}
 function update(){status.textContent=checks.filter(el=>el.checked).length+" of "+checks.length+" channels completed"}
 form.addEventListener("change",()=>{update();try{localStorage.setItem(key,JSON.stringify(checks.map(el=>el.checked)))}catch{}});
 update();
}`;

  function layout(title, body, withProgress = false) {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} · ${escape(site.name)}</title><style>
:root{color-scheme:light dark;font:17px/1.55 system-ui,sans-serif;background:#f5f2e9;color:#24291e}
*{box-sizing:border-box}body{margin:0}main{max-width:64rem;margin:auto;padding:clamp(1rem,5vw,4rem)}
h1,h2{font-family:Georgia,serif;font-weight:500;line-height:1.08}h1{font-size:clamp(2.3rem,6vw,5rem);max-width:18ch;margin:.7em 0 .3em}h2{font-size:clamp(1.4rem,4vw,2.5rem)}
a{color:#295540;text-underline-offset:.19em}a:focus-visible,input:focus-visible,button:focus-visible,summary:focus-visible{outline:2px solid currentColor;outline-offset:3px}
nav,.search,.pager{display:flex;flex-wrap:wrap;gap:.55rem 1.15rem;align-items:center}nav{border-bottom:1px solid #969b86;padding-bottom:1rem}
fieldset{border:1px solid #969b86;padding:1rem;margin:1rem 0}legend{padding:0 .4rem}
fieldset label,output{display:block;margin:.6rem 0}input,button{font:inherit;padding:.45rem}.search input{max-width:100%}li{margin:.4rem 0}summary,button{cursor:pointer}section{margin:2rem 0}.eyebrow{font-weight:700}
@media(prefers-color-scheme:dark){:root{background:#171b15;color:#f6f3e6}a{color:#b9d6a4}}
</style>${withProgress ? '<script defer src="' + site.publicBase + '/activity.js"></script>' : ""}</head><body><main>
<nav aria-label="Learning navigation"><a href="${site.home}">${escape(site.name)}</a><a href="${site.publicBase}/">All 101 methods</a><a href="${site.sibling}/">${escape(site.siblingName)}</a><a href="${academy}">Nine Pillars</a><a href="${civics}">Comparative Civics</a></nav>
${body}</main></body></html>`;
  }

  function index(url) {
    const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
    const query = q.toLocaleLowerCase();
    const filtered = group => data.methods.filter(m => m.group === group.id && (!query ||
      (m.id + " " + m.title + " " + m.activity).toLocaleLowerCase().includes(query)));
    const sections = data.groups.map(group => {
      const list = filtered(group);
      return list.length ? `<section id="category-${group.id}"><h2>${escape(group.name)}</h2><ol start="${group.first}">${list.map(method =>
        `<li value="${method.id}"><a href="${href(method.id)}">${escape(method.title)}</a></li>`).join("")}</ol></section>` : "";
    }).join("");
    return layout("101 Hands-On Learning Methods", `<p class="eyebrow">${escape(site.byline)}</p><h1>101 Hands-On Learning Methods</h1>
<p>Pick an activity. Observe, work out the pattern, test it, examine who benefits, then teach it back.</p>
<p><a href="${site.publicBase}/source.txt">Read the original submission</a> · <a href="${archive}">Gateway, Monroe, and Redstone research</a></p>
<form method="get" action="${site.publicBase}/" class="search"><label for="q">Find a method</label><input id="q" name="q" value="${escape(q)}" type="search"><button>Search</button>${q ? '<a href="' + site.publicBase + '/">Clear</a>' : ""}</form>
${query ? "" : '<ul>' + data.groups.map(group => '<li><a href="#category-' + group.id + '">' + escape(group.name) + '</a></li>').join("") + '</ul>'}
<section><h2>The 5-Channel Stimulation Loop</h2><ol>${data.channels.map(channel => `<li><strong>${escape(channel.title)}</strong> ${escape(channel.original)}</li>`).join("")}</ol></section>
${sections || "<p>No matching methods. Try a title, topic, or number.</p>"}`);
  }

  function detail(method) {
    const group = data.groups.find(group => group.id === method.group);
    const prompts = [
      "Start with the available object, model, image, or record. Describe one thing you notice before you interpret it.",
      "Name one pattern, relationship, or assumption you can check. Record what you expect to happen.",
      method.activity,
      "Ask who benefits, whose consent matters, and what the evidence actually supports. Record one limit.",
      "Show someone what you did, what happened, and what you would change. Ask them to demonstrate one step.",
    ];
    const steps = data.channels.map((channel, i) => `<fieldset><legend>${escape(channel.title)}</legend><p>${escape(prompts[i])}</p>
<label><input type="checkbox" name="channel-${channel.id}"> Mark this channel complete</label></fieldset>`).join("");
    return layout(method.title, `<p class="eyebrow">Method ${method.id} · ${escape(group.name)}</p><h1>${escape(method.title)}</h1>
<p><a href="${site.sibling}/${method.id}/">Open this activity in ${escape(site.siblingName)}</a></p>
<form data-method="${method.id}"><output id="method-progress" aria-live="polite">Mark each channel as you complete it.</output>${steps}</form>
<details><summary>Original description</summary><p>${escape(method.original)}</p></details>
${method.id >= 61 || method.id === 55 ? '<p><a href="' + civics + '">Practice source analysis in Comparative Civics</a> · <a href="' + archive + '">Follow an archival source trail</a></p>' : ""}
<p class="pager">${methods.has(method.id - 1) ? '<a href="' + href(method.id - 1) + '">Previous method</a>' : ""}
<a href="${site.publicBase}/#category-${group.id}">Back to category</a>${methods.has(method.id + 1) ? '<a href="' + href(method.id + 1) + '">Next method</a>' : ""}</p>`, true);
  }

  return function serveLearning(request) {
    const url = new URL(request.url);
    if (url.pathname !== site.route && !url.pathname.startsWith(site.route + "/")) return undefined;
    const tail = url.pathname.slice(site.route.length).replace(/\/$/, "");
    const send = (body, type, status = 200, extra = {}) => new Response(request.method === "HEAD" ? null : body, {
      status, headers: { ...headers, "content-type": type + "; charset=utf-8", ...extra },
    });
    if (!["GET", "HEAD"].includes(request.method)) return send("Method not allowed", "text/plain", 405, { allow: "GET, HEAD" });
    if (tail === "") return send(index(url), "text/html");
    if (tail === "/source.txt") return send(data.source, "text/plain");
    if (tail === "/activity.js") return send(js, "text/javascript");
    if (tail === "/api/methods") return send(JSON.stringify({ groups: data.groups, methods: data.methods, channels: data.channels }), "application/json");
    const numeric = /^\/([1-9]\d{0,2})$/.exec(tail);
    const method = numeric && methods.get(Number(numeric[1]));
    return method ? send(detail(method), "text/html") : send("Method not found", "text/plain", 404);
  };
}
