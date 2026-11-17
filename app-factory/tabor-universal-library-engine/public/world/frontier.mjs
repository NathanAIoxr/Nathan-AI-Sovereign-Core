const $=id=>document.getElementById(id);
const storage="tabor-world-motion-paused";
const motion=$("motion"),visual=motion.parentElement;
function paintMotion(paused){
  visual.dataset.paused=String(paused);
  motion.setAttribute("aria-pressed",String(paused));
  motion.textContent=paused?"Resume motion":"Pause motion";
}
let paused=false;
try{paused=localStorage.getItem(storage)==="true";}catch{}
paintMotion(paused);motion.hidden=false;
motion.addEventListener("click",()=>{
  paused=!paused;paintMotion(paused);
  try{localStorage.setItem(storage,String(paused));}catch{}
});
async function json(path){
  const response=await fetch(path);
  if(!response.ok)throw Error("Unavailable "+path);
  return response.json();
}
function node(tag,text,attrs={}){
  const element=document.createElement(tag);
  if(text!==undefined)element.textContent=text;
  for(const [key,value] of Object.entries(attrs))element.setAttribute(key,value);
  return element;
}
function sourceLink(text,url){
  if(typeof url!=="string")return null;
  const parsed=new URL(url,location.href);
  return parsed.protocol==="https:"?node("a",text,{href:parsed.href}):null;
}
function launchpad(items){
  const search=$("destination-search"),filter=$("destination-category");
  for(const category of [...new Set(items.map(item=>item.category))].sort())filter.add(new Option(category,category));
  function paint(){
    const words=search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matches=items.filter(item=>(!filter.value||item.category===filter.value)&&
      words.every(word=>[item.title,item.category,item.description].join(" ").toLowerCase().includes(word)));
    $("destination-count").textContent=matches.length+" of "+items.length+" destinations";
    const cards=matches.map(item=>{
      const article=node("article",undefined,{class:"destination"}),heading=node("h3");
      const sameLibrary=item.id==="library-of-tabor";
      const anchor=sameLibrary?node("a",item.title,{href:"#catalog"}):sourceLink(item.title,item.url);
      heading.append(anchor??node("span",item.title));
      const access=item.access==="sign-in"?"Sign-in required":"Public page checked";
      article.append(heading,node("p",item.description),node("p",item.category+" · "+access,{class:"access"}));
      return article;
    });
    $("destinations").replaceChildren(...(cards.length?cards:[node("p","No matching destinations.")]));
  }
  search.addEventListener("input",paint);filter.addEventListener("change",paint);paint();
}
function ledger(payload){
  $("top-release").textContent="Release "+payload.current;
  $("release-status").textContent=payload.counts.records+" records · "+payload.counts.runnable+" runnable modules and drills · "+payload.counts.destinations+" linked destinations";
  for(const item of payload.history){
    const card=node("article",undefined,{class:"release-item"}),list=node("ul");
    card.append(node("h4",item.title),node("small",item.id));
    for(const change of item.changes)list.append(node("li",change));
    card.append(list);
    const source=sourceLink("Release source",item.source);
    if(source)card.append(source);
    $("release-history").append(card);
  }
  for(const item of payload.next){
    const card=node("article",undefined,{class:"release-item"});
    card.append(node("h4",item.title),node("p",item.detail));
    const source=sourceLink("Source inventory",item.source);
    if(source)card.append(source);
    $("next-work").append(card);
  }
}
await Promise.allSettled([
  json("./destinations.json").then(launchpad).catch(()=>{$("destination-count").textContent="The destination list is temporarily unavailable.";}),
  json("./release-ledger.json").then(ledger).catch(()=>{$("release-status").textContent="The release ledger is temporarily unavailable.";})
]);
