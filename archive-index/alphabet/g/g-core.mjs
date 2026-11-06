/** Nathan AI · G glyph / Tabor Spiral independent, read-only geometry and source engine */
export const SOURCE_SCHEMA='nathan-ai.g.public-master-titles.v1';
export const ROUTES_SCHEMA='nathan-ai.g.original-research-routes.v1';
export const GEOMETRY_SCHEMA='nathan-ai.g.geometry-spiral-model.v1';
export const PHI=(1+Math.sqrt(5))/2;
export const GOLDEN_B=Math.log(PHI)/(Math.PI/2);
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export function verifyG(source,metadata,routes,geometry){
 if(source?.schema!==SOURCE_SCHEMA||metadata?.schema!=='nathan-ai.g.master-title-gzip-metadata.v1'||routes?.schema!==ROUTES_SCHEMA||geometry?.schema!==GEOMETRY_SCHEMA)throw TypeError('Source schema mismatch');
 if(!Array.isArray(source.records)||source.records.length!==713||source.generalRows!==713||source.gRows!==719||source.withheld!==6)throw TypeError('Master G privacy/source count mismatch');
 if(!Array.isArray(source.collections)||source.collections.length!==21||!Array.isArray(routes.entries)||routes.entries.length!==21)throw TypeError('G source families missing');
 if(!source.records.every(x=>Array.isArray(x)&&x.length===3&&Number.isInteger(x[0])&&typeof x[1]==='string'&&x[1].trimStart().toLocaleLowerCase().startsWith('g')&&Number.isInteger(x[2])&&x[2]>=0&&x[2]<source.collections.length))throw TypeError('Invalid G source occurrence');
 if(new Set(source.records.map(x=>x[0])).size!==713)throw TypeError('Lost source occurrence IDs');
 if(routes.originalUserLine!=="time for G ... find all G's - 5 rotated around and or a 6 reshaped the natilus aka tabor spiral")throw TypeError('Creator text changed');
 if(!geometry.graphicModes.some(x=>x.id==='5-rotation')||!geometry.graphicModes.some(x=>x.id==='6-reshaped'))throw TypeError('Independent 5/6 geometry collapsed');
 if(!geometry.spirals.some(x=>x.direction==='inward')||!geometry.spirals.some(x=>x.direction==='outward'))throw TypeError('Inward/outward engines collapsed');
 if(metadata.counts.publicGeneral!==713||metadata.counts.withheldNonGeneral!==6)throw TypeError('Incomplete public source metadata');
 return true;
}
export function searchTitles(source,{query='',collection='',limit=100,offset=0}={}){
 if(!source?.records||typeof query!=='string'||typeof collection!=='string')throw TypeError('Invalid G catalog');
 const q=query.normalize('NFKC').toLocaleLowerCase().trim();
 const rows=source.records.filter(x=> (!collection||source.collections[x[2]]===collection)&&(!q||[x[1],source.collections[x[2]]].some(y=>y.normalize('NFKC').toLocaleLowerCase().includes(q))));
 return {total:rows.length,items:rows.slice(clamp(Math.floor(offset),0,source.records.length),clamp(Math.floor(offset),0,source.records.length)+clamp(Math.floor(limit),1,200)).map(x=>({sourceIndex:x[0],title:x[1],collection:source.collections[x[2]],stage:'source-title-not-finished-app'}))};
}
export function filterRoutes(routes,{query='',group=''}={}){
 const q=String(query).normalize('NFKC').toLocaleLowerCase().trim();
 return routes.entries.filter(x=>(!group||x.group===group)&&(!q||[x.title,x.notes,x.source,x.input,x.output].filter(Boolean).join(' ').normalize('NFKC').toLocaleLowerCase().includes(q)));
}
export function rotatePoint(x,y,degrees){const angle=Number(degrees)*Math.PI/180;if(!Number.isFinite(angle))throw TypeError('Rotation invalid');return {x:x*Math.cos(angle)-y*Math.sin(angle),y:x*Math.sin(angle)+y*Math.cos(angle)};}
export function glyphTransform({glyph='5',degrees=0}={}){
 const allowed=['5','6','G','g'];if(!allowed.includes(glyph)||!Number.isInteger(degrees)||degrees < -360||degrees > 360)throw TypeError('Glyph state invalid');
 return {original:glyph,degrees,stage:glyph==='5'?'creator-rotated-5':glyph==='6'?'creator-reshaped-6':'literal-modern-letter',display:glyph,note:'Geometric analogy only; rotating a numeral is not a historical derivation or a mathematically exact identity with G.'};
}

/** Illustrative vector crossfade from an open-bottom 6 path to a G-like path.
 * These are newly drawn teaching outlines, never historical written originals. */
export function morphSixToG(progress=0){
 if(!Number.isFinite(progress)||progress<0||progress>1)throw TypeError('Morph progress outside 0..1');
 const six=[[112,28],[78,24],[49,45],[34,78],[34,108],[53,132],[84,137],[109,124],[120,102],[104,86],[74,90],[48,108]];
 const g=[[118,43],[91,28],[61,27],[38,48],[30,78],[40,110],[66,130],[100,126],[119,106],[120,88],[98,88],[81,88]];
 const pts=six.map((p,i)=>({x:p[0]+(g[i][0]-p[0])*progress,y:p[1]+(g[i][1]-p[1])*progress}));
 return {progress,points:pts,path:pts.map((p,i)=>(i?'L':'M')+' '+p.x.toFixed(2)+' '+p.y.toFixed(2)).join(' '),identity:progress===0?'6-inspired outline':progress===1?'G-inspired outline':'intermediate demonstration'};
}
export function spiralPoints({direction='inward',b=0.18,turns=2.6,steps=400,rotationDeg=0}={}){
 if(!['inward','outward'].includes(direction)||!Number.isFinite(b)||b<=0||b>0.5||!Number.isFinite(turns)||turns<0.5||turns>5||!Number.isInteger(steps)||steps<16||steps>2000)throw TypeError('Invalid spiral parameters');
 const T=2*Math.PI*turns;const points=[];
 const offset=rotationDeg*Math.PI/180;
 for(let i=0;i<=steps;i++){
  const t=T*i/steps;
  const r=direction==='inward'?Math.exp(-b*t):Math.exp(b*(t-T));
  points.push({x:r*Math.cos(t+offset),y:r*Math.sin(t+offset),theta:t,radius:r});
 }
 return points;
}
export function svgPath(points,{centerX=240,centerY=240,scale=208}={}){
 if(!Array.isArray(points)||!points.length)throw TypeError('Points required');
 return points.map((p,i)=>(i?'L':'M')+(centerX+p.x*scale).toFixed(2)+' '+(centerY+p.y*scale).toFixed(2)).join(' ');
}
export function numberedChambers(count=63){
 if(!Number.isInteger(count)||count<1||count>1000)throw TypeError('Chamber count invalid');
 const pts=spiralPoints({direction:'inward',b:0.18,turns:2.5,steps:Math.max(63,count-1)});
 return Array.from({length:count},(_,i)=>({number:i+1,x:pts[Math.round(i*(pts.length-1)/Math.max(1,count-1))].x,y:pts[Math.round(i*(pts.length-1)/Math.max(1,count-1))].y}));
}
export function quizQuestions(){
 return [
 {q:'The creator supplied which independent paths to G?',choices:['Rotating 5 or reshaping 6','E equals 3 only','F equals P only','G equals Greek gamma historically'],answer:'Rotating 5 or reshaping 6'},
 {q:'What earlier G archive title was preserved?',choices:['The Generator / The Ground Vault','The Firewall / The Freeze','The Helios Core / Helix Twist','The Door / Divider'],answer:'The Generator / The Ground Vault'},
 {q:'What is the symbolic Tabor Spiral inward expression?',choices:['r = a exp(-bθ)','r = a exp(+bθ)','r = a + bθ','r = a/θ²'],answer:'r = a exp(-bθ)'},
 {q:'How many chambers does the separately sourced Nautilus of War game manual name?',choices:['63','33','26','12'],answer:'63'},
 {q:'What does scientific research say about a Nautilus shell?',choices:['It is not reliably an exact golden spiral','Every shell is precisely golden','Its radius never grows','It is the historic source of Latin G'],answer:'It is not reliably an exact golden spiral'}
 ];
}
