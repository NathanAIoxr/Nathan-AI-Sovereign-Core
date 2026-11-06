/* Run: node graphics.test.cjs. These checks do not constitute browser QA. */
const G=require('./graphics-core.js');
let count=0;
function check(value,message){if(!value)throw Error(message);count++;}
function rejects(fn,message){let thrown=false;try{fn();}catch{thrown=true;}check(thrown,message);}
for(const id of Object.keys(G.glyphs))check(G.icon(id).includes('role="img"'),'accessible icon '+id);
for(const e of G.elements)check(G.gem(e.id).includes(e.label),'gem label');
for(const frames of Object.values(G.presets)){
 for(let i=0;i<=100;i++){const s=G.sample(frames,i/100);check(Number.isFinite(s.x)&&s.opacity>=0&&s.opacity<=1,'finite timeline');}
 check(G.sample(frames,0).x===frames[0].x,'first frame');
 check(G.sample(frames,1).opacity===frames[frames.length-1].opacity,'last frame');
 check(JSON.stringify(G.sample(frames,.5,true))===JSON.stringify({x:0,y:0,scale:1,opacity:1}),'reduced motion');
}
for(let seed=1;seed<=40;seed++){
 const random=G.rng(seed),input=Array.from({length:20},(_,i)=>({id:String(i),width:16+Math.floor(random()*100),height:16+Math.floor(random()*100)}));
 const a=G.pack(input,512,2);
 for(let i=0;i<a.frames.length;i++){const f=a.frames[i];check(f.x>=2&&f.y>=2&&f.x+f.width+2<=a.width&&f.y+f.height+2<=a.height,'frame bounds');
 for(let j=0;j<i;j++){const b=a.frames[j];check(f.x>=b.x+b.width||b.x>=f.x+f.width||f.y>=b.y+b.height||b.y>=f.y+f.height,'nonoverlap');}}
 const p=new G.Particles(48,seed),q=new G.Particles(48,seed);p.burst(10,10,100);q.burst(10,10,100);
 check(p.items.length===48,'bounded burst');check(JSON.stringify(p.items)===JSON.stringify(q.items),'deterministic particle stream');
 for(let i=0;i<30;i++)p.step(.05);check(p.items.length===0,'particles expire');
}
check(G.pack([],64).height===1,'empty atlas');
rejects(()=>G.pack([{id:'a',width:64,height:10}],64,2),'oversize');
rejects(()=>G.pack([{id:'a',width:10,height:10},{id:'a',width:10,height:10}]),'duplicate id');
rejects(()=>G.pack([{id:'a',width:10.5,height:10}]),'fractional width');
rejects(()=>G.sample(G.presets.idle,NaN),'NaN time');
rejects(()=>G.sample([{t:0,x:0,y:0,scale:1,opacity:1},{t:0,x:0,y:0,scale:1,opacity:1}],.5),'time order');
rejects(()=>new G.Particles(10000),'particle capacity');
rejects(()=>G.icon('unknown'),'unknown symbol');
rejects(()=>G.gem('fire',Infinity),'infinite size');
console.log('PASS '+count+' graphics checks');
