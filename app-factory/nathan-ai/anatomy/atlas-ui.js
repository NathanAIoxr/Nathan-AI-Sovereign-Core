(function(){"use strict";
const Source=window.NathanAnatomySource,$=id=>document.getElementById(id),el=(name,text,cls)=>{const n=document.createElement(name);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n};
let atlas=null,selection="A",reverse=false;
function card(title,description,kicker){const c=el("article",undefined,"card");if(kicker)c.append(el("div",kicker,"label"));c.append(el("h3",title),el("p",description));return c}
function drawLetter(){const a=atlas.anatomyAZ.find(x=>x.letter===selection),v=atlas.iversions.find(x=>x.letter===selection),mode=$("layer").value,root=$("detail");root.replaceChildren();root.append(el("div",selection+" · "+v.name+" · Mirror "+v.mirror,"label"),el("h3",a.term));
if(mode==="all"||mode==="anatomy")root.append(el("strong","Anatomy reference (new editorial layer)"),el("p",a.description));
for(const field of ["human","software","hardware"]){if(mode==="all"||mode===field)root.append(el("strong",field[0].toUpperCase()+field.slice(1)+" — recorded source-edition analogy"),el("p",v[field]))}
root.append(el("p","Source status: A–J author-supplied; K mixed; L–Z completed during the recorded edition. These cross-domain analogies are not verified identical mechanisms.","small"))}
function drawLetters(){const q=$("query").value.trim().toLowerCase();const matches=atlas.anatomyAZ.filter(x=>{const v=atlas.iversions.find(y=>y.letter===x.letter);return [x.letter,x.term,x.description,v.name,v.human,v.software,v.hardware].join(" ").toLowerCase().includes(q)});if(reverse)matches.reverse();
if(matches.length&&!matches.some(x=>x.letter===selection))selection=matches[0].letter;
const root=$("letters");root.replaceChildren();for(const x of matches){const b=el("button",x.letter);b.type="button";b.setAttribute("aria-pressed",String(selection===x.letter));b.addEventListener("click",()=>{selection=x.letter;drawLetters()});root.append(b)}
$("result-count").textContent=matches.length+" of 26 records";if(matches.length)drawLetter();else $("detail").textContent="No matching anatomy record."}
function init(){Source.validate(atlas);drawLetters();
for(const q of atlas.biologicalEquator)$("equator").append(card(q.original,q.physiology,q.direction+" · "+q.system));
for(const r of atlas.spine.regions)$("spine").append(card(r.region,r.code+" · "+r.count+" positions"+(r.medicalNote?"; "+r.medicalNote:"")));
for(const g of atlas.grammar)$("grammar").append(card(g.structure,g.link,g.body));
for(const s of atlas.bodySystems)$("systems").append(card(s,"Organ-system classification"));
for(const s of atlas.macroMicro)$("scales").append(card(s,"Author's scale index"));
for(const f of atlas.relatedOriginalFrameworks)$("frameworks").append(card(f.title,f.summary,f.stage));
}
$("query").addEventListener("input",()=>{if(atlas)drawLetters()});$("layer").addEventListener("change",()=>{if(atlas)drawLetter()});$("reverse").addEventListener("click",()=>{reverse=!reverse;$("reverse").textContent=reverse?"Z → A":"A → Z";if(atlas)drawLetters()});
fetch("./atlas.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("atlas.json request failed");return r.json()}).then(data=>{atlas=data;init()}).catch(e=>{$("detail").textContent="Unable to load the anatomy source: "+e.message});
})();