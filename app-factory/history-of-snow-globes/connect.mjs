const appPath="/history-of-snow-globes";
const appUrl="https://tabor-bridge.nathantaboract.workers.dev"+appPath+"/";
const title="The History of Snow Globes";
const link='<p data-snow-globes><a href="'+appUrl+'">'+title+' · Book, Lab and Game</a></p>';
function insertOnce(source,anchor,replacement){
  if(source.split(anchor).length!==2)throw Error("Expected one integration anchor");
  return source.replace(anchor,()=>replacement);
}
export function connectSnowGlobes(kind,source){
  if(source.includes("/* history-of-snow-globes entry */"))return source;
  if(kind==="bridge"){
    const anchor='      const academy = "/tabor-academy";';
    const handler=[
      '      /* history-of-snow-globes entry */',
      '      const snow = "/history-of-snow-globes";',
      '      if (url.pathname === snow) {',
      '        url.pathname += "/";',
      '        return Response.redirect(url, 308);',
      '      }',
      '      if (url.pathname.startsWith(snow + "/")) {',
      '        url.pathname = url.pathname.slice(snow.length);',
      '        return env.TABOR_ACADEMY.get("history-of-snow-globes").fetch(new Request(url, request));',
      '      }',
    ].join("\n");
    return insertOnce(source,anchor,handler+"\n"+anchor);
  }
  const names={
    academy:{exportName:"academyWithSnowGlobes",selector:"main h1",paths:["/","/map/"]},
    world:{exportName:"worldWithSnowGlobes",selector:".hero h1",paths:["/"]},
    roots:{exportName:"rootsWithSnowGlobes",selector:"main h1",paths:["/library/","/app-factory/tabor-universal-library-engine/public/library/","/app-factory/tabor-universal-library-engine/public/world/","/app-factory/tabor-universal-library-engine/public/"]},
  };
  const config=names[kind];
  if(!config)throw Error("Unknown integration surface");
  const anchor="export default ";
  return insertOnce(source,anchor,"const "+config.exportName+" = ")+
    "\n/* history-of-snow-globes entry */\nexport default {\n"+
    "  ..."+config.exportName+",\n"+
    "  async fetch(request,env,ctx) {\n"+
    "    const response=await "+config.exportName+".fetch(request,env,ctx);\n"+
    "    const path=new URL(request.url).pathname;\n"+
    "    if(request.method==='GET'&&"+JSON.stringify(config.paths)+".includes(path)&&response.ok&&response.headers.get('content-type')?.startsWith('text/html')) {\n"+
    "      return new HTMLRewriter().on("+JSON.stringify(config.selector)+",{element(el){el.after("+JSON.stringify(link)+",{html:true});}}).transform(response);\n"+
    "    }\n    return response;\n  }\n};\n";
}
