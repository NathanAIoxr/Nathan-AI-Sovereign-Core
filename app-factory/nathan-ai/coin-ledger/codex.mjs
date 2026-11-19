const entries = [
  ["TaborZone & Ecosystem Architecture","Content zones, magazine mastheads, and the Living Threshold connecting Taborboy and Taborpool."],
  ["Multi-Canon Biblical Database Engine","Translation and database structure for the 66-book KJV and 73-book canons."],
  ["Futhark, Ogham & Origami","Comparative symbolic traditions, script, and folding logic."],
  ["The Bible: Uncut","CODEX_SYSTEM_DIRECTIVE for ancient text extraction and source wording."],
  ["The Nathan Tabor Way","nathan_tabor_way_blueprint.py, four anchors and 180° inversion."],
  ["Geospatial & Paleogeographic Reference Engine","Coordinates, 10,000 BC paleogeography, and textual reference lookups."],
  ["Direct Historical Text & conversation_archive","Historical records and conversation archive structure."],
  ["Four-Anchor & Communication Breakdown","BUILD, FLIP, QI, QE, and the 101-acronym index."],
  ["Tabor Universal Motion + Identity Platform","The six-blank identity field and physical motion analysis."],
].map(([title,summary],index)=>({id:index+1,title,summary}));

const voicebox = {
  branch:"feature/nathan-voicebox-edge-micro-macro-20261106",
  commit:"b6e20690d1c77c2c1bc91a769e7d334f372b9315",
  architecture:"Voice Box v2 archive reference for offline speech synthesis and acoustic mapping, including Whisper.cpp.",
  oxr:"OXR appears in an earlier Nathan AI simulation script reference.",
};
const positions = [[-2,-2],[0,-2],[2,-2],[-2,-1],[2,-1],[-2,1],[2,1],[-1,2],[1,2]];
const views = [
  [ "forward", "Forward", (x,y)=>[x,y], false ],
  [ "backward", "Backward", (x,y)=>[x,y], true ],
  [ "upside-down", "Upside down", (x,y)=>[-x,-y], false ],
  [ "this-side", "This side of the mirror", (x,y)=>[x,-y], false ],
  [ "mirror", "As the mirror", (x,y)=>[-x,y], false ],
  [ "other-side", "Other side of the mirror", (x,y)=>[-x,-y], true ],
];
export function codexData() {
  return {source:"User-supplied Codex and Voicebox index", anchor:{symbol:"X",x:0,y:0,names:["Mother Earth","Every human mind"]}, entries, voicebox,
    views:views.map(([id,label,transform,reverse])=>({
      id,label,anchor:{x:0,y:0},
      points:(reverse?[...entries].reverse():entries).map((entry,index)=>{
        const [x,y]=transform(...positions[index]);
        return {id:entry.id,x,y};
      }),
    }))};
}
const encode = value => String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
export function codexPage() {
  const data=codexData();
  const boards=data.views.map(({label,points})=>{
    const occupied=new Map(points.map(({id,x,y})=>[x+","+y,id]));
    const squares=Array.from({length:25},(_,i)=>{
      const x=i%5-2,y=Math.floor(i/5)-2;
      const id=occupied.get(x+","+y);
      if(x===0&&y===0)return '<span class="anchor" aria-label="Fixed center">X</span>';
      return id?'<a href="#codex-'+id+'" aria-label="Codex '+id+'">'+id+'</a>':'<span aria-hidden="true"></span>';
    }).join("");
    return '<section class="card"><h2>'+encode(label)+'</h2><div class="board">'+squares+'</div></section>';
  }).join("");
  const list=data.entries.map(({id,title,summary})=>'<li id="codex-'+id+'"><strong>'+encode(title)+'</strong><p>'+encode(summary)+'</p></li>').join("");
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nathan AI · Codex</title><link rel="stylesheet" href="/codex.css"><main><nav><a href="/">Coin Ledger</a> · <a href="/api/compute">Compute checks</a> · <a href="https://nathan-ai-mining-lab.nathantaboract.workers.dev/">Mining Lab</a> · <a href="/api/codex">Codex JSON</a></nav><h1>Nathan AI 🚀 Codex</h1><p>All six views share the same X at the center. In the blueprint, that X represents Mother Earth and every human mind.</p><div class="views">'+boards+'</div><h2>Codex 1–9</h2><ol>'+list+'</ol><h2>Voicebox &amp; OXR</h2><p>'+encode(voicebox.architecture)+'</p><p>'+encode(voicebox.oxr)+'</p><p><a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/commit/'+voicebox.commit+'">Voicebox source commit</a></p></main></html>';
}
export const codexCss = "html{color-scheme:dark}body{background:#12171d;color:#f6f3ed;font:1rem/1.55 system-ui,sans-serif;margin:0}main{max-width:70rem;margin:auto;padding:1rem}h1,h2{line-height:1.2}a{color:#a8dbf9}a:focus-visible{outline:2px solid white}.views{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr));gap:.8rem}.card{border:1px solid #50606e;border-radius:.6rem;padding:.8rem}.card h2{font-size:1rem}.board{display:grid;grid-template-columns:repeat(5,1fr);gap:.15rem}.board>*{display:grid;place-items:center;aspect-ratio:1;background:#25313b;border-radius:.25rem}.board a{text-decoration:none;font-weight:bold}.board .anchor{color:#12171d;background:#f9be73;font-weight:bold}ol{padding-left:1.5rem}li{padding:.35rem 0}li p{margin:.2rem 0}";
