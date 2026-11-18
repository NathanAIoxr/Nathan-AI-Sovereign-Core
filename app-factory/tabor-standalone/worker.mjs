const types={"style.css":"text/css; charset=utf-8","game.mjs":"text/javascript; charset=utf-8","icon.svg":"image/svg+xml","arcade.mjs":"text/javascript; charset=utf-8","atlas.mjs":"text/javascript; charset=utf-8"};
const labels={games:"Games",books:"Books & editions",sites:"Websites & project pages"};
const stages={hosted:"Hosted destination",registered:"Registered site",template:"Site template",playable:"Playable standalone app",reader:"Standalone reader",original:"Original hosted reader"};
const headers={"X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Cache-Control":"no-cache",
  "Content-Security-Policy":"default-src 'self'; script-src 'self'; style-src 'self'; worker-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"};
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
const pagePath=x=>"/"+x.type+"/"+x.id+"/";
const groupPath=id=>"/collections/"+id+"/";
const a=(href,label,cls="")=>"<a"+(cls?' class="'+cls+'"':"")+' href="'+esc(href)+'">'+esc(label)+"</a>";
const nav=(links,role)=>'<nav aria-label="'+esc(role)+'" class="links">'+links.join("")+"</nav>";
function safeSource(value){
  try{const url=new URL(value);return url.protocol==="https:"?url.href:null;}catch{return null;}
}
function docs(title,description,content,{manifest="",canonical=""}={}){
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+
    '<meta name="theme-color" content="#101e1b"><meta name="description" content="'+esc(description)+'"><title>'+esc(title)+'</title>'+
    (canonical?'<link rel="canonical" href="'+esc(canonical)+'">':"")+(manifest?'<link rel="manifest" href="'+esc(manifest)+'">':"")+
    '<link rel="icon" href="/assets/icon.svg"><link rel="stylesheet" href="/assets/style.css"></head><body>'+
    '<a class="skip" href="#main">Skip to content</a><header><div class="head wrap">'+a("/","Tabor Standalone","brand")+
    nav(Object.entries(labels).map(([path,name])=>a("/"+path+"/",name)),"Main")+'</div></header>'+
    '<main class="wrap" id="main">'+content+'</main><footer class="wrap"><p>Nathan Tabor · Tabor World</p></footer></body></html>';
}
let promise;
async function data(){
  promise??=(async()=>{
    const bytes=Uint8Array.from(atob(packed),c=>c.charCodeAt(0));
    const raw=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    const release=await new Response(raw).json();
    release.index=new Map(release.items.map(x=>[x.type+"/"+x.id,x]));
    return release;
  })();
  return promise;
}
const clean=x=>{const {html,words,...meta}=x;return {...meta,path:pagePath(x)};};
function groupLinks(items,host){
  return nav(items.map(id=>a(groupPath(id),host.groups[id].title,"chip")),"Related collections");
}
function card(x){
  return '<article class="card"><p class="kind">'+esc(x.category)+" · "+esc(stages[x.mode])+'</p><h2>'+a(pagePath(x),x.title)+'</h2>'+
    (x.detail?"<p>"+esc(x.detail)+"</p>":"")+(x.access?'<p class="kind">'+esc(x.access)+"</p>":"")+"</article>";
}
function pager(base,terms,page,total){
  if(total<2)return "";
  const go=n=>base+"?"+new URLSearchParams({...terms,page:String(n)}).toString();
  return nav([page>1?a(go(page-1),"Previous","chip"):"","<span>Page "+page+" of "+total+"</span>",page<total?a(go(page+1),"Next","chip"):""],"Pages");
}
function listings(info,url){
  const q=(url.searchParams.get("q")??"").trim().slice(0,100);
  const filter=url.searchParams.get("type")??"";
  const rows=info.rows.filter(x=>(!filter||x.type===filter)&&
    (!q||[x.title,x.category,x.id,x.detail].join(" ").toLowerCase().includes(q.toLowerCase())));
  const size=30,total=Math.max(1,Math.ceil(rows.length/size)),page=Math.min(total,Math.max(1,Number.parseInt(url.searchParams.get("page"),10)||1));
  const options=info.allowType?'<label>Type<select name="type"><option value="">All content</option>'+
    Object.entries(labels).map(([key,label])=>'<option value="'+key+'"'+(key===filter?" selected":"")+">"+esc(label)+"</option>").join("")+"</select></label>":"";
  const search='<form class="search" action="'+esc(info.path)+'" method="get"><label>Search<input name="q" type="search" maxlength="100" value="'+esc(q)+'"></label>'+options+'<button>Search</button></form>';
  return '<section class="intro"><p class="eyebrow">'+esc(info.kicker??"TABOR WORLD")+'</p><h1>'+esc(info.title)+'</h1>'+
    (info.description?"<p>"+esc(info.description)+"</p>":"")+(info.source?a(info.source,"Open original collection","chip"):"")+
    '</section>'+search+"<p class=\"kind\">"+rows.length+" "+(rows.length===1?"entry":"entries")+'</p><div class="grid">'+
    rows.slice((page-1)*size,page*size).map(card).join("")+'</div>'+pager(info.path,{q,...(filter?{type:filter}:{})},page,total);
}
function gamePage(x,host){
  const path=pagePath(x);
  const content='<section class="intro"><p class="eyebrow">LIBRARY OF TABOR GAME · '+esc(x.id.slice(6))+'</p><h1>'+esc(x.title)+
    '</h1><p>'+esc(x.detail)+'</p></section><section class="panel game" id="game" data-id="'+esc(x.id.slice(6))+'">'+
    '<div class="game-head"><strong id="mechanic"></strong><span id="score" aria-live="polite">0 points</span></div><p id="tip"></p>'+
    '<canvas id="board" width="720" height="430" aria-label="Playfield" tabindex="0"></canvas>'+
    '<div class="controls"><div id="aim-controls" class="arrows" aria-label="Aim controls" hidden>'+
    '<button type="button" data-aim="left" aria-label="Aim left">←</button><button type="button" data-aim="up" aria-label="Aim up">↑</button>'+
    '<button type="button" data-aim="down" aria-label="Aim down">↓</button><button type="button" data-aim="right" aria-label="Aim right">→</button></div>'+
    '<button type="button" id="action">Play</button><button type="button" id="replay">Restart</button></div>'+
    '<p id="game-status" role="status">Loading game…</p><noscript><p>Enable JavaScript to play here or '+a(x.source,"open the original challenge")+'.</p></noscript></section>'+
    '<section><h2>Also in</h2>'+groupLinks(x.groups,host)+nav([a(x.source,"Play in Grapple It","chip"),a(host.library,"Library of Tabor","chip")],"Original games")+
    '</section><script type="module" src="/assets/game.mjs"></script>';
  return docs(x.title+" · Tabor Standalone",x.detail,content,{manifest:path+"manifest.webmanifest",canonical:host.cloud+path});
}
function recordPage(x,host){
  const source=safeSource(x.source);
  const siblings=x.volume?host.items.filter(y=>y.volume===x.volume&&y.id.startsWith("pee-dee-")&&y.id!==x.id):[];
  const series=x.volume?host.items.filter(y=>y.type==="books"&&y.id.replace(/-\d+$/,"")===x.id.replace(/-\d+$/,"")):[];
  const near=nav(series.filter(y=>Math.abs(y.volume-x.volume)===1).map(y=>a(pagePath(y),(y.volume<x.volume?"Previous: ":"Next: ")+y.title,"chip")),"Books in this edition");
  const content='<section class="intro"><p class="eyebrow">'+esc(x.category)+(x.volume?" · BOOK "+x.volume:"")+'</p><h1>'+esc(x.title)+'</h1>'+
    (x.detail?"<p>"+esc(x.detail)+"</p>":"")+(x.language?"<p>"+esc(x.language)+"</p>":"")+(x.access?"<p>"+esc(x.access)+"</p>":"")+
    (source?a(source,x.type==="sites"?(x.mode==="template"?"Open source":"Open website"):"Open the original edition or source","chip"):"")+
    (x.sourceId?'<p class="kind">Source ID · '+esc(x.sourceId)+"</p>":"")+
    (x.html||x.words?a(pagePath(x)+"download","Download this edition","chip"):"")+'</section>'+
    (x.html?'<article class="reading">'+x.html+"</article>":x.words?'<article class="reading"><pre>'+esc(x.words)+"</pre></article>":"")+
    (series.length?near:"")+(siblings.length?'<section><h2>Other editions of Book '+x.volume+'</h2>'+
      nav(siblings.map(y=>a(pagePath(y),y.category+" · "+y.title,"chip")),"Other editions")+"</section>":"")+
    '<section><h2>Also in</h2>'+groupLinks(x.groups,host)+"</section>";
  return docs(x.title+" · Tabor Standalone",x.detail??x.category,content,{canonical:host.cloud+pagePath(x)});
}
function manifest(x){
  const path=pagePath(x);
  return {id:path,name:x.title,short_name:x.title,start_url:path,scope:path,display:"standalone",theme_color:"#101e1b",
    background_color:"#101e1b",icons:[{src:"/assets/icon.svg",sizes:"any",type:"image/svg+xml",purpose:"any"}]};
}
function serviceWorker(x,release){
  const path=pagePath(x),files=[path,...Object.keys(types).map(key=>"/assets/"+key)];
  const prefix="tabor-standalone-"+x.id+"-";
  return "const cachePrefix="+JSON.stringify(prefix)+";\nconst cacheName=cachePrefix+"+JSON.stringify(release)+";\nconst files="+JSON.stringify(files)+";\n"+
    "self.addEventListener('install',event=>event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(files))));\n"+
    "self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith(cachePrefix)&&name!==cacheName).map(name=>caches.delete(name))))));\n"+
    "self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!files.includes(url.pathname))return;event.respondWith(fetch(event.request).catch(()=>caches.open(cacheName).then(cache=>cache.match(url.pathname))));});\n";
}
function landing(host,url){
  const sections=Object.entries(labels).map(([key,name])=>'<article class="card"><p class="kind">'+host.counts[key]+' entries</p><h2>'+
    a("/"+key+"/",name)+'</h2></article>');
  const focus=["library-of-tabor","grapple-atlas","pee-dee-valley","the-twinkling","color-of-truth","app-portfolio"];
  const home='<section class="intro"><p class="eyebrow">TABOR WORLD · NATHAN TABOR</p><h1>Standalones</h1>'+
    '<p>Open an individual game, book, or site record. Follow the same item back into the collections it belongs to.</p></section>'+
    '<div class="grid">'+sections.join("")+'</div><h2>Collections</h2>'+groupLinks(focus,host);
  return home+listings({title:"Find an item",kicker:"DIRECTORY",rows:host.items,path:"/",allowType:true},url);
}
export default {
  async fetch(request){
    const url=new URL(request.url),head=request.method==="HEAD",path=url.pathname;
    const out=(body,mime,status=200,extra={})=>new Response(head?null:body,{status,headers:{...headers,"Content-Type":mime,...extra}});
    const plain=(body,status,extra)=>out(body,"text/plain; charset=utf-8",status,extra);
    const json=(value,mime="application/json; charset=utf-8")=>out(JSON.stringify(value),mime);
    const html=body=>out(body,"text/html; charset=utf-8");
    if(!head&&request.method!=="GET")return plain("Method not allowed",405,{Allow:"GET, HEAD"});
    if(path.startsWith("/assets/")){
      const id=path.slice(8);
      return Object.hasOwn(types,id)?out(assets[id],types[id]):plain("Not found",404);
    }
    const host=await data();
    if(path==="/api/health")return json({ok:true,release:host.release,counts:host.counts});
    if(path==="/api/catalog")return json({release:host.release,counts:host.counts,collections:host.groups,items:host.items.map(clean)});
    if(path==="/")return html(docs("Tabor Standalone · Tabor World","Games, books and websites by Nathan Tabor",landing(host,url)));
    const section=/^\/(games|books|sites)(?:\/)?$/.exec(path);
    if(section){
      const type=section[1],title=labels[type],canonical="/"+type+"/";
      if(path!==canonical)return new Response(null,{status:308,headers:{Location:canonical+url.search}});
      return html(docs(title+" · Tabor Standalone",title,listings({title,rows:host.items.filter(x=>x.type===type),path:canonical},url)));
    }
    const group=/^\/collections\/([a-z0-9-]+)\/?$/.exec(path);
    if(group&&Object.hasOwn(host.groups,group[1])){
      const key=group[1],info=host.groups[key],rows=host.items.filter(x=>x.groups.includes(key));
      return html(docs(info.title+" · Tabor Standalone",info.title,listings({...info,kicker:"COLLECTION",rows,path:groupPath(key),allowType:true},url)));
    }
    const item=/^\/(games|books|sites)\/([a-z0-9-]+)(?:\/(manifest\.webmanifest|sw\.js|download)?)?$/.exec(path);
    if(!item)return plain("Not found",404);
    const x=host.index.get(item[1]+"/"+item[2]);
    if(!x)return plain("Not found",404);
    const asset=item[3];
    if(asset==="download"){
      if(x.type!=="books"||!(x.html||x.words))return plain("Not found",404);
      const body=x.words??('<!doctype html><html lang="en"><meta charset="utf-8"><title>'+esc(x.title)+'</title><h1>'+esc(x.title)+'</h1><article>'+x.html+'</article></html>');
      return out(body,x.words?"text/plain; charset=utf-8":"text/html; charset=utf-8",200,
        {"Content-Disposition":'attachment; filename="'+x.id+(x.words?".txt":".html")+'"'});
    }
    if(asset&&x.type!=="games")return plain("Not found",404);
    if(asset==="manifest.webmanifest")return json(manifest(x),"application/manifest+json; charset=utf-8");
    if(asset==="sw.js")return out(serviceWorker(x,host.release),"text/javascript; charset=utf-8");
    if(!path.endsWith("/"))return new Response(null,{status:308,headers:{Location:pagePath(x)+url.search}});
    return html(x.type==="games"?gamePage(x,host):recordPage(x,host));
  }
};
