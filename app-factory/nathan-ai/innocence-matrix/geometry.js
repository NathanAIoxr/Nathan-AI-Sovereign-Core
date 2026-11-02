/* NATHAN AI 🚀 · original geometric study; no people, no political iconography.
 * Visual construction is illustrative, not a verified machine design or historic biblical identification.
 */
(function(root,factory){const x=factory();if(typeof module==='object'&&module.exports)module.exports=x;else root.InnocenceGeometry=x;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const STAGES=[
{id:'cross',title:'The Cross',detail:'Straight four-arm source geometry'},
{id:'hooked',title:'THE HOOKED CROSS',detail:'Four bent arms · geometric intermediate form'},
{id:'thirteen',title:'13 rotating units',detail:'13-fold radial arrangement at 360° / 13'},
{id:'rose',title:'Rose of Sharon',detail:'13-petal rosette · author-defined design progression'},
{id:'iris',title:'Iris / wheel',detail:'Aperture and Ezekiel wheel visual-study branch'}
];
const SYMBOL='The swastika a.k.a. THE HOOKED CROSS .. it is the cross of the James 1:27 and Romans 13:4 servants and ministers of innocence aka the Holy Fools and Divine Jesters … but there is nothing foolish or jestering about them … they have a job';
const SCRIPTURE=['James 1:27','Romans 13:4','James 2:26','Ephesians 5:11','Isaiah 58:1','Titus 3:10'];
function angle(i,n=13){if(!Number.isInteger(n)||n<3||n>120)throw Error('Invalid fold count');return 360*i/n;}
function pt(i,n=13,r=120){const theta=(angle(i,n)-90)*Math.PI/180;return [r*Math.cos(theta),r*Math.sin(theta)]}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))}
function radialPetals(n=13){
 return Array.from({length:n},(_,i)=>'<ellipse cx="0" cy="-114" rx="31" ry="103" transform="rotate('+angle(i,n)+')" stroke="#eed39b" stroke-width="2.5" fill="#b66854" fill-opacity=".17"/>').join('');
}
function cross(){return '<path d="M -12 -116 H 12 V -12 H 116 V 12 H 12 V 116 H -12 V 12 H -116 V -12 H -12 Z" fill="#ecd19b" stroke="#f9ecc9" stroke-width="2"/>'}
function hooked(){return '<path d="M 0 0 V -97 H 47 M0 0 H 97 V 47 M0 0 V 97 H -47 M0 0 H -97 V -47" stroke="#e9d29b" stroke-width="24" fill="none" stroke-linejoin="miter" stroke-linecap="square"/>'}
function thirteen(){
 return Array.from({length:13},(_,i)=>'<g transform="rotate('+angle(i)+') translate(0 -132) scale(.26)" opacity=".94">'+hooked()+'</g>').join('');
}
function spokes(){return Array.from({length:13},(_,i)=>'<line x1="0" y1="0" x2="'+pt(i)[0].toFixed(3)+'" y2="'+pt(i)[1].toFixed(3)+'" stroke="#7ecce4" stroke-opacity=".64" stroke-width="1.6"/>').join('')}
function buildSVG(options={}){
 const stage=STAGES.some(s=>s.id===options.stage)?options.stage:'rose';
 const degrees=((Number(options.spin)||0)%360+360)%360;
 const guides=options.guides!==false;
 const size=Number.isFinite(options.size)?Math.max(200,Math.min(2400,Math.round(options.size))):820;
 let shape='';
 if(stage==='cross')shape=cross();
 if(stage==='hooked')shape=hooked();
 if(stage==='thirteen')shape=thirteen();
 if(stage==='rose')shape=radialPetals();
 if(stage==='iris')shape='<circle r="160" fill="none" stroke="#eed39b" stroke-width="17"/>'+Array.from({length:13},(_,i)=>'<path d="M 0,-41 Q 94,-126 21,-156 Q -29,-105 0,-41Z" transform="rotate('+angle(i)+')" fill="#e5bd79" fill-opacity=".36" stroke="#f6dca8" stroke-width="1.6"/>').join('');
 let svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+size+'" height="'+size+'" viewBox="0 0 600 600" role="img" aria-label="'+esc(STAGES.find(s=>s.id===stage).title)+'">';
 svg+='<defs><radialGradient id="field"><stop offset="0" stop-color="#214b67"/><stop offset="1" stop-color="#0b1929"/></radialGradient></defs><rect width="600" height="600" fill="url(#field)"/>';
 svg+='<circle cx="300" cy="300" r="240" fill="none" stroke="#53758a" stroke-width="2"/>';
 svg+='<g transform="translate(300 300)">';
 if(guides)svg+= '<g>'+spokes()+'</g><circle r="175" stroke="#77b2c2" stroke-dasharray="4 12" stroke-opacity=".5" fill="none"/>';
 svg+='<g transform="rotate('+degrees.toFixed(3)+')">'+shape+'</g>';
 svg+='<circle r="17" fill="#f0dba8" stroke="#fff5d4" stroke-width="3"/>';
 svg+='</g><text x="300" y="44" font-family="Arial,sans-serif" text-anchor="middle" fill="#f4e8ce" font-weight="bold" font-size="23">'+esc(STAGES.find(s=>s.id===stage).title)+'</text>';
 svg+='<text x="300" y="567" font-family="Arial,sans-serif" text-anchor="middle" fill="#cce6ed" font-size="18">13 × 27.69230769° · author-defined geometry</text></svg>';
 return svg;
}
function wheelsSVG(wheels=2){
 if(wheels!==2&&wheels!==4)throw Error('2 or 4 wheels required');
 let s='<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="420" viewBox="0 0 1100 420" role="img" aria-label="'+(wheels===2?'Two-wheel motorcycle-inspired concept':'Four-wheel vehicle-inspired concept')+'"><rect width="1100" height="420" fill="#0c1c2e"/>';
 const locations=wheels===2?[[265,292],[835,292]]:[[190,285],[435,285],[670,285],[915,285]];
 for(const [x,y] of locations){
  s+='<circle cx="'+x+'" cy="'+y+'" r="108" fill="#153750" stroke="#edcb88" stroke-width="12"/>';
  for(let i=0;i<13;i++){const t=angle(i)*Math.PI/180;s+='<line x1="'+x+'" y1="'+y+'" x2="'+(x+93*Math.sin(t)).toFixed(2)+'" y2="'+(y-93*Math.cos(t)).toFixed(2)+'" stroke="#8bcfe0" stroke-width="5"/>'}
  s+='<circle cx="'+x+'" cy="'+y+'" r="17" fill="#e8c17b"/>';
 }
 s+='<path d="M '+locations[0][0]+' 164 H '+locations[locations.length-1][0]+'" stroke="#edcb88" stroke-width="18" fill="none"/>';
 s+='<text x="550" y="55" font-family="Arial,sans-serif" text-anchor="middle" fill="#f1dbae" font-size="36">'+(wheels===2?'TWO WHEELS — CONCEPTUAL MOTORCYCLE':'FOUR WHEELS — CONCEPTUAL VEHICLE')+'</text>';
 s+='<text x="550" y="394" font-family="Arial,sans-serif" text-anchor="middle" fill="#c5dce4" font-size="19">Illustrative construction, not a mechanically tested vehicle</text></svg>';
 return s;
}
return {STAGES,SYMBOL,SCRIPTURE,angle,pt,buildSVG,wheelsSVG,esc};
});