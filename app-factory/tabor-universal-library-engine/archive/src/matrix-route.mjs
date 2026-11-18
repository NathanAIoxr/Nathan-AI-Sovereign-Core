import {anchors,dimensions,matrixSelection,matrixWidth,portalJump,readMatrix} from "./matrix.mjs";
import {html,shell} from "./ui.mjs";

const headers = {
  "cache-control":"no-store",
  "content-security-policy":"default-src 'none'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  "referrer-policy":"no-referrer",
  "x-content-type-options":"nosniff"
};
const reply = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{...headers,"content-type":"application/json; charset=utf-8"}});
const head = (request,response) => request.method === "HEAD" ? new Response(null,response) : response;

function path(selection, changes) {
  const search = new URLSearchParams();
  for (const [key,value] of Object.entries({...selection,...changes})) {
    if (value !== null) search.set(key,value);
  }
  return "/matrix?"+search;
}

const axis = Array.from({length:matrixWidth},(_,n)=>n);
const selected = (value, chosen) => value === chosen ? " selected" : "";
const axisOptions = value => axis.map(n=>`<option${selected(n,value)}>${n}</option>`).join("");

function matrixPage(result) {
  const {selection:s,occupancy,events,nextCursor} = result;
  const filled = new Map(occupancy.map(({row,col,count})=>[`${row}:${col}`,count]));
  const grid = axis.map(row=>`<tr><th scope="row">${row}</th>`+axis.map(col=>{
    const count = filled.get(`${row}:${col}`) ?? 0;
    const current = row === s.row && col === s.col;
    const href = path(s,{row,col,tick:null,cursor:null});
    const label = `Row ${row}, column ${col}, ${count} events`;
    return `<td${current?' class="current"':''}><a href="${html(href)}" aria-label="${label}"${current?' aria-current="true"':''}>${count || "·"}</a></td>`;
  }).join("")+"</tr>").join("");
  const timeline = events.map(e=>`<li><p class="meta">Sequence ${e.sequence} · Tick ${e.destination.tick} · ${e.direction.replace("_"," ")} · ${html(e.recordedUtc)}</p>
    <h3><a href="/works/${html(e.work)}">${html(e.payload.label ?? e.work)}</a></h3><p>${html(e.payload.note ?? "")}</p>
    <details><summary>Coordinate and SHA-256</summary><dl><dt>Origin</dt><dd>Row ${e.origin.row}, column ${e.origin.col}, dimension ${e.origin.dimension}, ${html(anchors[e.origin.scale])}, tick ${e.origin.tick}</dd>
    <dt>Portal</dt><dd><code>${html(e.uri)}</code></dd><dt>SHA-256</dt><dd><code>${html(e.stateHash)}</code></dd></dl></details></li>`).join("");
  return shell("Sovereign Matrix",`<h1>Sovereign Matrix</h1>
    <p class="intro">Every part is whole—there are no fractals. Choose one of 169 cells, select a dimension and scale, then read the archive’s portal history.</p>
    <p class="links"><a href="/matrix">Entrance timeline</a><a href="/matrix?row=12&amp;col=12&amp;dimension=20&amp;scale=CRO_MECRO">Printed scroll</a><a href="/matrix?row=12&amp;col=12&amp;dimension=29&amp;scale=CRO_MECRO">Printed book</a><a href="/api/matrix/health">Matrix receipt</a></p>
    <form action="/matrix" method="get" class="matrix-form">
      <label>Row<select name="row">${axisOptions(s.row)}</select></label>
      <label>Column<select name="col">${axisOptions(s.col)}</select></label>
      <label>Dimension<select name="dimension">${dimensions.map(n=>`<option${selected(n,s.dimension)}>${n}</option>`).join("")}</select></label>
      <label>Scale<select name="scale">${Object.entries(anchors).map(([key,label])=>`<option value="${key}"${selected(key,s.scale)}>${html(label)}</option>`).join("")}</select></label>
      <label>Timeline order<select name="order"><option value="desc"${selected("desc",s.order)}>Newest recorded first</option><option value="asc"${selected("asc",s.order)}>Oldest recorded first</option></select></label>
      <label>Tick (optional)<input name="tick" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="16" value="${s.tick ?? ""}"></label>
      <button>Open cell</button>
    </form>
    <div class="scroll"><table class="sovereign-grid"><caption>Events per cell · Dimension ${s.dimension} · ${html(anchors[s.scale])}</caption>
    <thead><tr><th scope="col">Row</th>${axis.map(n=>`<th scope="col">${n}</th>`).join("")}</tr></thead><tbody>${grid}</tbody></table></div>
    <section class="section"><h2>Cell ${s.row*matrixWidth+s.col} timeline</h2>
    ${timeline?`<ol class="cards">${timeline}</ol>`:"<p>This coordinate has no recorded events for the current filters.</p>"}
    <p class="links">${nextCursor?`<a href="${html(path(s,{cursor:nextCursor}))}">More entries</a>`:""}
    <a href="${html(path(s,{order:s.order === "desc"?"asc":"desc",cursor:null}))}">Reverse timeline order</a>
    <a href="/api${html(path(s))}">Timeline JSON</a></p></section>`)
    .replace("</head>",'<link rel="stylesheet" href="/matrix.css"></head>');
}

async function authorized(request, secret) {
  const token = request.headers.get("authorization");
  if (!token?.startsWith("Bearer ") || token.length > 512) return false;
  const [expected,provided] = await Promise.all([secret,token.slice(7)].map(value =>
    crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))));
  const bytes = new Uint8Array(provided);
  return new Uint8Array(expected).reduce((diff,byte,index)=>diff | (byte ^ bytes[index]),0) === 0;
}

async function readJump(request) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json" || !request.body) return null;
  const stream = request.body.getReader();
  const decoder = new TextDecoder("utf-8",{fatal:true});
  let body = "", length = 0;
  try {
    for (;;) {
      const {done,value} = await stream.read();
      if (done) return JSON.parse(body+decoder.decode());
      length += value.length;
      if (length > 8192) return null;
      body += decoder.decode(value,{stream:true});
    }
  } catch {
    return null;
  } finally {
    await stream.cancel().catch(()=>{});
    stream.releaseLock();
  }
}

export async function matrixRoute(request,env) {
  const url = new URL(request.url);
  const route = url.pathname;
  if (!["/matrix","/matrix.css","/api/matrix","/api/matrix/health","/api/matrix/jumps"].includes(route)) return null;
  const write = route === "/api/matrix/jumps";
  const allowed = write ? ["POST"] : ["GET","HEAD"];
  if (!allowed.includes(request.method)) {
    return new Response(null,{status:405,headers:{...headers,allow:allowed.join(", ")}});
  }
  try {
    if (write) {
      if (!env.MATRIX_WRITE_KEY) return reply({error:"Portal writer unavailable"},503);
      if (!await authorized(request,env.MATRIX_WRITE_KEY)) return reply({error:"Unauthorized"},401);
      const result = await portalJump(env.ARCHIVE_DB,await readJump(request));
      return reply(result.body,result.status);
    }
    if (route === "/matrix.css") return head(request,new Response(
      ".matrix-form{grid-template-columns:repeat(auto-fit,minmax(min(8rem,100%),1fr))}.sovereign-grid{width:max-content;min-width:100%;text-align:center}.sovereign-grid caption{text-align:left;padding:.5rem 0}.sovereign-grid td{padding:0}.sovereign-grid a{display:grid;place-items:center;min-width:2.75rem;min-height:2.75rem}.sovereign-grid .current{background:#cbe5da}.sovereign-grid .current a{font-weight:750}",{
        headers:{...headers,"content-type":"text/css; charset=utf-8"}
      }));
    if (route === "/api/matrix/health") {
      const counts = await env.ARCHIVE_DB.prepare(`SELECT
        (SELECT COUNT(*) FROM sovereign_cells) AS cells,
        (SELECT COUNT(*) FROM sovereign_dimensions) AS dimensions,
        (SELECT COUNT(*) FROM sovereign_scales) AS scales,
        (SELECT COUNT(*) FROM sovereign_matrix_events) AS events`).first();
      return head(request,reply({release:"sovereign-matrix-v1",...counts}));
    }
    const selection = matrixSelection(url.searchParams);
    if (!selection) return head(request,reply({error:"Invalid matrix coordinate or history filter"},400));
    const result = await readMatrix(env.ARCHIVE_DB,selection);
    const response = route === "/matrix" ? new Response(matrixPage(result),{
      headers:{...headers,"content-type":"text/html; charset=utf-8"}
    }) : reply({width:matrixWidth,cellCount:matrixWidth**2,dimensions,anchors,...result});
    return head(request,response);
  } catch {
    return head(request,reply({error:"Matrix storage unavailable"},503));
  }
}
