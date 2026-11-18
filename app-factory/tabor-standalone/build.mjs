import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {gzipSync} from "node:zlib";
import {ATLAS,CLASSES,MECHANICS} from "../grapple-it/public/atlas.mjs";

const project=fileURLToPath(new URL(".",import.meta.url));
const root=resolve(project,"../..");
const repo="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core";
const cloud="https://tabor-standalone.nathantaboract.workers.dev";
const publisher="https://tabor-public-sites.nathantaboract.workers.dev";
const hook="https://hook-and-ring.nathantaboract.workers.dev";
const library="https://tabor-world.nathantaboract.workers.dev/library/";
const grapple="https://grapple-it.nathantaboract.workers.dev/";
const pee="https://pee-dee-valley.nathantaboract.workers.dev/";
const editions="https://pee-dee-valley-editions.nathantaboract.workers.dev/";
const sourcePath="app-factory/one/library-mind/documents.json";
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const read=p=>readFile(resolve(root,p),"utf8");
const decode=s=>s.replace(/&(?:amp|lt|gt|quot|apos|#39|nbsp);/g,m=>({"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&apos;":"'","&#39;":"'","&nbsp;":" "})[m]);
const title=s=>decode(s.replace(/<[^>]+>/g,"").trim());
const safeTextTags=new Set(["p","h2","h3","h4","blockquote","em","strong","ol","ul","li","hr","br","cite","i","b","span","div","section","a"]);
export const release="2026-11-17.5";

function bookBody(s){
  if(/<\s*(?:script|style|iframe|object|embed)\b/i.test(s))throw Error("Unexpected executable markup in a source article");
  return s.replace(/<\s*(\/?)([a-z][a-z\d-]*)\b[^>]*>/gi,(whole,closing,tag)=>{
    tag=tag.toLowerCase();
    return safeTextTags.has(tag)&&tag!=="a"?"<"+closing+tag+">":"";
  });
}
const stages={
  existing_condensed_manuscript:"Condensed manuscript",
  draft_awaiting_language_review:"Draft awaiting language review",
  unreviewed_translation_draft:"Unreviewed translation draft",
  archived_off_plan_ai_assisted_short_story:"Archived AI-assisted short story",
  novel_in_progress_chapters_1_to_6:"Novel in progress · Chapters 1–6"
};
export async function catalog(){
  const groups={
    "library-of-tabor":{title:"Library of Tabor",source:library},
    "grapple-atlas":{title:"Grapple It · 101 Applications",source:grapple+"#atlas"},
    "toss-target":{title:"Toss & Target · 60 arcade boards",source:publisher+"/boards/"},
    "pee-dee-valley":{title:"Pee Tabor and Dee Tabor of the Pee Dee Valley",source:pee},
    "pee-dee-original":{title:"Pee Dee Valley · Original 13 books",source:pee},
    "pee-dee-teen":{title:"Pee Dee Valley · Teen edition",source:editions+"teen.html"},
    "pee-dee-children":{title:"Pee Dee Valley · Children’s edition",source:editions+"children.html"},
    "original-works":{title:"Nathan Tabor · Public works archive",source:repo+"/tree/main/app-factory/nathan-ai/original-works"},
    "the-twinkling":{title:"THE TWINKLING"},
    "color-of-truth":{title:"THE COLOR OF TRUTH"},
    "tabor-world":{title:"Tabor World",source:"https://tabor-world.nathantaboract.workers.dev/"},
    "app-portfolio":{title:"Tabor World · App portfolio",source:"https://tabor-app-portfolio.nathantaboract.workers.dev/"}
  };
  const games=ATLAS.map(x=>{
    const shelf="subject-"+x.lcc.toLowerCase(),mechanic="mechanic-"+x.chassis;
    groups[shelf]={title:CLASSES[x.lcc]};
    groups[mechanic]={title:(MECHANICS[x.chassis]??x.chassis)+" · Games"};
    return {id:"atlas-"+x.id,type:"games",title:x.title,category:x.lcc,detail:x.application,
      mode:"playable",source:grapple+"#atlas/"+x.id,groups:["library-of-tabor","grapple-atlas",shelf,mechanic]};
  });
  const books=[];
  for(let n=1;n<=13;n++){
    const number=String(n).padStart(2,"0");
    const path="publications/pee-dee-valley/book-"+number+".html";
    const page=await read(path);
    const heading=page.match(/<h1[^>]*>([\s\S]+?)<\/h1>/i),article=page.match(/<article\b[^>]*>([\s\S]+?)<\/article>/i);
    if(!heading||!article)throw Error("Book source missing: "+path);
    books.push({id:"pee-dee-original-"+number,type:"books",title:title(heading[1]),category:"Original series",mode:"reader",
      volume:n,source:pee+"book-"+number+".html",groups:["library-of-tabor","pee-dee-valley","pee-dee-original"],html:bookBody(article[1])});
  }
  for(const edition of ["teen","children"]){
    const p="publishing/pee-dee-valley/"+edition+".html";
    const html=await read(p);
    const sections=[...html.matchAll(/<article\b[^>]*id="book-(\d+)"[^>]*>([\s\S]+?)<\/article>/gi)];
    if(sections.length!==13)throw Error("Expected all 13 books in "+p);
    for(const [,number,body] of sections){
      const h=body.match(/<h2[^>]*>([\s\S]+?)<\/h2>/i);
      if(!h)throw Error("Missing title");
      const group="pee-dee-"+edition;
      books.push({id:group+"-"+number.padStart(2,"0"),type:"books",title:title(h[1]),category:edition==="teen"?"Teen edition":"Children’s edition",
        volume:Number(number),mode:"reader",source:editions+edition+".html#book-"+number,groups:["library-of-tabor","pee-dee-valley",group],
        html:bookBody(body.replace(h[0],""))});
    }
  }
  for(const x of JSON.parse(await read(sourcePath))){
    if(!Object.hasOwn(stages,x.stage))continue;
    const related=["library-of-tabor","original-works"];
    if(x.id.includes("TWINKLING"))related.push("the-twinkling");
    if(x.title.startsWith("THE COLOR OF TRUTH"))related.push("color-of-truth");
    books.push({id:"work-"+slug(x.id),type:"books",title:x.title,category:stages[x.stage],mode:"reader",language:x.language,
      source:repo+"/blob/main/"+sourcePath,sourceId:x.id,groups:related,words:x.content});
  }
  const babel=JSON.parse(await read("archive-index/tower-of-babel/release.json"));
  books.push({id:"tower-of-babel",type:"books",title:babel.title,category:"Published reading edition",mode:"original",
    groups:["library-of-tabor","original-works"],source:"https://tower-of-babel-by-nathan-tabor.nathantaboract.workers.dev/"});
  const portfolio=JSON.parse(await read("app-factory/portfolio/catalog.json"));
  const plugins=JSON.parse(await read("standalone-apps/hook-and-ring/game/game-plugins.json"));
  const boards=plugins.map(x=>({id:"toss-"+x.id,type:"games",title:x.name,category:"Toss & Target",mode:"arcade-board",
    source:hook+"/chassis?game="+encodeURIComponent(x.id),groups:["toss-target","tabor-world"]}));
  const sites=portfolio.items.map(x=>{
    const group="sites-"+slug(x.kind);
    groups[group]={title:x.kind+" · Websites"};
    return {id:x.id,type:"sites",title:x.title,category:x.kind,detail:x.description,
      mode:x.state==="registered"?"cloud-published":x.state==="template"?"cloud-template":x.state,
      deployment:x.state==="hosted"?undefined:publisher+"/launch/"+x.id+"/",
      source:x.url??(x.path?repo+"/blob/"+portfolio.commit+"/"+x.path:undefined),
      groups:["app-portfolio","tabor-world",group,...(x.id==="pee-dee-valley"?["pee-dee-valley"]:[]),
        ...(x.id==="grapple-it"?["grapple-atlas"]:[])],access:x.id==="nathan-tabor-library"?"Sign-in required":undefined};
  });
  const items=[...games,...boards,...books,...sites];
  const keys=new Set(items.map(x=>x.type+"/"+x.id));
  if(keys.size!==items.length||items.some(x=>!x.groups.every(id=>Object.hasOwn(groups,id))))throw Error("Catalog identity conflict");
  return {release,cloud,library,groups,items,counts:{games:games.length+boards.length,
    installableGames:games.length,arcadeBoards:boards.length,books:books.length,sites:sites.length,
    hostedSites:sites.filter(x=>x.mode==="hosted").length,publishedSites:sites.filter(x=>x.mode==="cloud-published").length,
    templateLaunches:sites.filter(x=>x.mode==="cloud-template").length,publicArchiveEditions:books.filter(x=>x.sourceId).length}};
}

export async function build(){
  const data=await catalog();
  const sourceFiles={
    "style.css":"app-factory/tabor-standalone/style.css","game.mjs":"app-factory/tabor-standalone/game.mjs",
    "icon.svg":"app-factory/grapple-it/public/icon.svg","arcade.mjs":"app-factory/grapple-it/public/arcade.mjs",
    "atlas.mjs":"app-factory/grapple-it/public/atlas.mjs"
  };
  const assets=Object.fromEntries(await Promise.all(Object.entries(sourceFiles).map(async ([id,path])=>[id,await read(path)])));
  const packed=gzipSync(JSON.stringify(data),{level:9}).toString("base64");
  const out=resolve(project,".release");
  await mkdir(out,{recursive:true});
  await writeFile(resolve(out,"worker.mjs"),"const assets="+JSON.stringify(assets)+";\nconst packed="+JSON.stringify(packed)+";\n"+
    await read("app-factory/tabor-standalone/worker.mjs"));
  return {data,assets};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await build();
