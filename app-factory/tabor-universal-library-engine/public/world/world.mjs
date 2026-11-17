import { createWorld, matches, compare, periodicSource, worldEdition } from "./world-core.mjs";
const $=id=>document.getElementById(id);
const size=36;
let page=0,view="all",all=[],index=new Map(),focus="",selection=[];
const query=$("query"),category=$("category");
function el(tag,text,attributes={}){
  const n=document.createElement(tag);
  if(text!==undefined)n.textContent=text;
  for(const [key,value] of Object.entries(attributes))n.setAttribute(key,value);
  return n;
}
function link(label,href){
  if(typeof href!=="string"||!(/^(https:\/\/|\.\.?\/)/.test(href)))return null;
  return el("a",label,{href});
}
const button=(title,handler,attributes={})=>{
  const node=el("button",title,{type:"button",...attributes});
  node.addEventListener("click",handler);
  return node;
};
function inView(row){
  return view==="all"||(view==="elements")===(row.kind==="Chemical element");
}
function viewFilters(){
  const old=category.value;
  const values=[...new Set(all.filter(inView).map(r=>r.kind))].sort();
  category.replaceChildren(new Option("All categories",""),...values.map(v=>new Option(v,v)));
  if(values.includes(old))category.value=old;
  $("element-note").hidden=view!=="elements";
  $("records").classList.toggle("elements",view==="elements");
  for(const b of $("views").querySelectorAll("button"))b.setAttribute("aria-pressed",String(b.dataset.view===view));
}
function paint(){
  const rows=all.filter(r=>inView(r)&&(!category.value||r.kind===category.value)&&matches(r,query.value.trim()));
  const pages=Math.max(1,Math.ceil(rows.length/size));
  page=Math.min(page,pages-1);
  $("status").textContent=rows.length+" "+(rows.length===1?"record":"records");
  $("records").replaceChildren(...rows.slice(page*size,(page+1)*size).map(row=>{
    const b=button(row.title,()=>open(row),{class:"record","data-record":row.id,"aria-current":String(row.id===focus)});
    if(view!=="elements")b.append(el("small",row.kind));
    return b;
  }));
  $("current-page").textContent=(page+1)+" / "+pages;
  $("previous-page").disabled=page===0;
  $("next-page").disabled=page+1>=pages;
}
function optional(parent,child){if(child)parent.append(child);}
function open(row,move=true){
  focus=row.id;
  for(const n of $("records").querySelectorAll(".record"))n.setAttribute("aria-current",String(n.dataset.record===row.id));
  const detail=$("detail");detail.hidden=false;$("detail-empty").hidden=true;
  $("detail-title").textContent=row.title;detail.replaceChildren(el("p",row.kind+" · "+row.source,{class:"meta"}));
  if(row.description)detail.append(el("p",row.description));
  if(row.sourceNote)detail.append(el("p",row.sourceNote,{class:"meta"}));
  const rows=Object.entries(row.metadata??{}).filter(([,v])=>v!=null&&v!=="");
  if(rows.length){
    const d=el("dl");
    for(const [key,val] of rows)d.append(el("dt",key),el("dd",Array.isArray(val)?val.join(" · "):typeof val==="object"?JSON.stringify(val):String(val)));
    detail.append(d);
  }
  optional(detail,link(row.number&&row.kind==="Chemical element"?"Open full IUPAC periodic table":"Open source record",row.url));
  optional(detail,link("Launch cartridge",row.play));
  if(row.references?.length){
    const list=el("ul");
    for(const ref of row.references){
      const li=el("li");li.append(link(ref.title,ref.url)??el("span",ref.title));list.append(li);
    }
    detail.append(list);
  }
  const links=(row.connections??[]).filter(r=>index.has(r.id));
  if(links.length){
    const list=el("ul");
    for(const r of links){
      const target=index.get(r.id),li=el("li");
      li.append(button(r.label+" · "+target.title,()=>open(target)));
      if(r.note)li.append(el("p",r.note));
      list.append(li);
    }
    detail.append(list);
  }
  detail.append(button("Add to comparison",()=>{
    if(selection.includes(row.id))return;
    selection=[...selection.slice(-1),row.id];paintTray();
  }));
  const url=new URL(location.href);url.searchParams.set("record",row.id);history.replaceState(null,"",url);
  if(move&&matchMedia("(max-width:680px)").matches)$("detail-title").scrollIntoView({block:"start"});
}
function paintTray(){
  const rows=selection.map(id=>index.get(id)),tray=$("comparison");
  tray.replaceChildren();
  $("clear").disabled=rows.length===0;
  $("tray-status").textContent=rows.length===0?"Add two records to compare them.":rows.length===1?"Add a second record.":"Two records selected.";
  for(const row of rows){
    const pick=el("div",undefined,{class:"pick"});
    pick.append(button(row.title,()=>open(row)),button("Remove",()=>{
      selection=selection.filter(id=>id!==row.id);paintTray();
    },{"aria-label":"Remove "+row.title}));tray.append(pick);
  }
  if(rows.length===2){
    const relations=compare(...rows);
    if(!relations.length)tray.append(el("p","The catalog has no direct link recorded for this pair."));
    else for(const item of relations)tray.append(el("p",item.from+" → "+item.to+" · "+item.label+(item.note?" · "+item.note:"")));
  }
}
async function get(path){
  const response=await fetch(path);
  if(!response.ok)throw Error(path);
  return response.json();
}
try{
  const [ledger,library,castAndProps,atlas,places,entries]=await Promise.all([
    get("../catalog.json"),get("./source-catalog.json"),get("./cast-and-props.json"),
    get("./cosmic-body.json"),get("./worlds-atlas.json"),get("./world.json")]);
  const world=createWorld({ledger,library,castAndProps,atlas,places,entries});
  all=world.records;index=new Map(all.map(row=>[row.id,row]));
  const counts=world.summary;
  for(const [label,href] of [
    ["IUPAC periodic table",periodicSource],
    [counts.tracker+" Tracker Ball entries · v.7 edition","../catalog.json"],
    [counts.world+" Tabor World cartridges · separate edition","./source-catalog.json"],
    ["Tabor World source branch",worldEdition],
    [counts.cosmic+" Cosmic Body records and "+counts.cosmicRelationships+" source relationships","./cosmic-body.json"],
    [counts.places+" meSPARK Worlds Atlas records","./worlds-atlas.json"],
    ["Cast and workbench object records","./cast-and-props.json"],["World reference records","./world.json"]
  ]){
    const li=el("li");li.append(link(label,href));$("sources").append(li);
  }
  for(const b of $("views").querySelectorAll("button"))b.addEventListener("click",()=>{
    view=b.dataset.view;page=0;viewFilters();paint();
  });
  for(const control of [query,category])control.addEventListener(control===query?"input":"change",()=>{page=0;paint();});
  $("previous-page").addEventListener("click",()=>{page--;paint();});
  $("next-page").addEventListener("click",()=>{page++;paint();});
  $("clear").addEventListener("click",()=>{selection=[];paintTray();});
  const requested=new URL(location.href).searchParams.get("record");
  if(index.has(requested))open(index.get(requested),false);
  viewFilters();paint();
}catch(error){
  $("status").textContent="The sources could not load. Reload to retry.";
  console.error(error);
}
