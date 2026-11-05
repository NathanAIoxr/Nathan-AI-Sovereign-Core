// Lightweight ASCII STL regeneration of unembossed interlocking panels.
// For raised text use one-matrix-panels.scad with OpenSCAD.
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
const names=['BODY','SOUL','SHADOW','MIND','SPIRIT'];
function outline(i,c=.35){const right=i<4?[[50,0],[50,20],[58,18],[58,42],[50,40],[50,60]]:[[50,0],[50,60]];const left=i>0?[[0,60],[0,40+c],[8+c,42+c],[8+c,18-c],[0,20-c],[0,0]]:[[0,60],[0,0]];return [[0,0],...right,...left].slice(0,-1)}
function cross(a,b,c){return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])}
function within(p,a,b,c){return cross(a,b,p)>=-1e-8&&cross(b,c,p)>=-1e-8&&cross(c,a,p)>=-1e-8}
function triangulate(points){let idx=points.map((_,i)=>i),tris=[],limit=points.length**2;while(idx.length>3&&limit--){let cut=false;for(let j=0;j<idx.length;j++){const ia=idx[(j-1+idx.length)%idx.length],ib=idx[j],ic=idx[(j+1)%idx.length],a=points[ia],b=points[ib],c=points[ic];if(cross(a,b,c)<=1e-8||idx.some(k=>k!==ia&&k!==ib&&k!==ic&&within(points[k],a,b,c)))continue;tris.push([ia,ib,ic]);idx.splice(j,1);cut=true;break}if(!cut)throw Error('triangulation failed')}if(idx.length!==3)throw Error('triangulation incomplete');tris.push(idx);return tris}
function normal(a,b,c){const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]],n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n)||1;return n.map(x=>x/l)}
function stl(i){const pts=outline(i),faces=[];for(const [a,b,c] of triangulate(pts)){faces.push([[...pts[a],5],[...pts[b],5],[...pts[c],5]],[[...pts[c],0],[...pts[b],0],[...pts[a],0]])}for(let k=0;k<pts.length;k++){const a=pts[k],b=pts[(k+1)%pts.length];faces.push([[...a,0],[...b,0],[...b,5]],[[...a,0],[...b,5],[...a,5]])}return ['solid nathan_five_matrix_'+names[i],...faces.map(f=>'  facet normal '+normal(...f).map(n=>n.toFixed(8)).join(' ')+'\n    outer loop\n'+f.map(p=>'      vertex '+p.join(' ')).join('\n')+'\n    endloop\n  endfacet'),'endsolid nathan_five_matrix_'+names[i]].join('\n')+'\n'}
for(let i=0;i<5;i++){const output=join(import.meta.dirname,(i+1)+'_'+names[i]+'_basic.stl');writeFileSync(output,stl(i));console.log(output)}
