const root="https://tabor-standalone.nathantaboract.workers.dev";
const styles=":root{color-scheme:dark;font:17px system-ui;background:#101e1b;color:#f2f7f4}body{max-width:62rem;margin:auto;padding:1.25rem}a{color:#abf2cb}li{margin:.6rem 0}select,input,button{font:inherit}";
const escape=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const rules="default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; worker-src 'none'; object-src 'none'; frame-ancestors 'self'; form-action 'self' https:; base-uri 'self'";
const mime={"html":"text/html","htm":"text/html","js":"text/javascript","mjs":"text/javascript","css":"text/css","json":"application/json","webmanifest":"application/manifest+json","svg":"image/svg+xml","png":"image/png","jpg":"image/jpeg","jpeg":"image/jpeg","webp":"image/webp","gif":"image/gif","ico":"image/x-icon","woff":"font/woff","woff2":"font/woff2","mp3":"audio/mpeg","ogg":"audio/ogg","wav":"audio/wav","wasm":"application/wasm","txt":"text/plain","md":"text/plain","csv":"text/csv"};
function sourceURL(path){return "/"+path.split("/").map(encodeURIComponent).join("/");}
function page(title,content){
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(title)+'</title><style>'+styles+'</style><nav><a href="'+root+'/">Tabor Standalone</a> · <a href="/boards/">Arcade boards</a> · <a href="'+root+'/sites/">Sites</a></nav><main><h1>'+escape(title)+'</h1>'+content+'</main><footer>Nathan Tabor · Tabor World</footer>';
}
function find(path){
  const name=path.replace(/^\/+|\/+$/g,"");
  if(Object.hasOwn(build.assets,name))return name;
  const index=name+"/index.html";
  return Object.hasOwn(build.assets,index)?index:undefined;
}
export default {
  async fetch(request,env){
    const url=new URL(request.url),head=request.method==="HEAD";
    const reply=(body,type="text/plain; charset=utf-8",status=200,extra={})=>new Response(head?null:body,{status,headers:{"Content-Type":type,"Content-Security-Policy":rules,"X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Cache-Control":"no-cache",...extra}});
    if(!head&&request.method!=="GET")return reply("Method not allowed.",undefined,405,{Allow:"GET, HEAD"});
    if(url.pathname==="/api/health")return reply(JSON.stringify({ok:true,release:build.release,commit:build.commit,counts:build.counts}),"application/json");
    if(url.pathname==="/")return reply(page("Tabor World · Public sites",'<p>'+build.counts.publishedPages+' original site pages and '+build.boards.length+' arcade boards.</p><ul><li><a href="'+root+'/sites/">Find public sites by title</a></li><li><a href="/boards/">Browse and launch arcade boards</a></li><li><a href="/api/health">Release receipt</a></li></ul>'),"text/html; charset=utf-8");
    const board=/^\/boards(?:\/([a-z0-9-]+))?\/?$/.exec(url.pathname);
    if(board){
      if(!board[1])return reply(page("Toss & Target Arcade",'<p>Choose an individual board by Nathan Tabor.</p><ol>'+build.boards.map(x=>'<li><a href="/boards/'+x.id+'/">'+escape(x.title)+'</a></li>').join("")+'</ol>'),"text/html; charset=utf-8");
      const game=build.boards.find(x=>x.id===board[1]);
      if(game)return reply(page(game.title,'<p>Physics chassis '+escape(game.chassis)+'</p><p><a href="https://hook-and-ring.nathantaboract.workers.dev/chassis?game='+game.id+'">Play '+escape(game.title)+'</a></p>'),"text/html; charset=utf-8");
    }
    const entry=/^\/launch\/([a-z0-9-]+)\/?$/.exec(url.pathname);
    if(entry&&Object.hasOwn(build.launch,entry[1])){
      const record=build.launch[entry[1]];
      return new Response(null,{status:302,headers:{Location:record.url??sourceURL(record.path)+url.search,"Cache-Control":"no-cache"}});
    }
    let path;
    let decoded;
    try{decoded=decodeURIComponent(url.pathname);path=find(decoded);}catch{return reply("Not found.",undefined,404);}
    if(!path&&build.linkedAssets.includes(decoded.slice(1))){
      const raw="https://raw.githubusercontent.com/NathanAIoxr/Nathan-AI-Sovereign-Core/"+build.commit;
      return new Response(null,{status:302,headers:{Location:raw+sourceURL(decoded.slice(1))}});
    }
    if(!path)return reply("Not found.",undefined,404);
    if(path.endsWith("/index.html")&&!url.pathname.endsWith("/")&&!url.pathname.endsWith("/index.html"))
      return new Response(null,{status:308,headers:{Location:url.pathname+"/"+url.search}});
    const type=mime[path.slice(path.lastIndexOf(".")+1)]??"application/octet-stream";
    if(head)return reply(null,type);
    const slots=build.assets[path];
    const keys=[...new Set(slots.map(s=>s.split(".")[0]))];
    const packs=await Promise.all(keys.map(k=>env.PUBLIC_ASSETS.get(build.release+"/pack-"+k,{type:"json"})));
    if(packs.some(p=>!p))return reply("Release asset is temporarily unavailable.",undefined,503,{"Retry-After":"30"});
    const files=new Map(keys.map((k,i)=>[k,packs[i]]));
    const compressed=slots.map(s=>files.get(s.split(".")[0])[s]).join("");
    const bytes=Uint8Array.from(atob(compressed),c=>c.charCodeAt(0));
    const body=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return reply(body,type.startsWith("text/")?type+"; charset=utf-8":type);
  }
};
