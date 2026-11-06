import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {verifyG,PHI,GOLDEN_B,searchTitles,filterRoutes,spiralPoints,svgPath,glyphTransform,rotatePoint,numberedChambers,quizQuestions,morphSixToG} from './g-core.mjs';
const data=readFileSync(new URL('./source-catalog-g.json.gz',import.meta.url));
const source=JSON.parse(gunzipSync(data).toString('utf8'));
const metadata=JSON.parse(readFileSync(new URL('./source-catalog-g.metadata.json',import.meta.url),'utf8'));
const routes=JSON.parse(readFileSync(new URL('./research-routes.json',import.meta.url),'utf8'));
const geometry=JSON.parse(readFileSync(new URL('./geometry-spiral.json',import.meta.url),'utf8'));
test('all 713 public titles decode as source occurrences, no non-general records',()=>{
 assert.equal(verifyG(source,metadata,routes,geometry),true);
 assert.equal(createHash('sha256').update(data).digest('hex'),'84890de016cc5fca8d237181c8982a5a0d8df34fa3ac999d60ee1b26129fc458');
 assert.equal(source.records.length,713);assert.equal(source.withheld,6);
});
test('604 family-grove occurrences retain their separate original titles',()=>{
 const c=searchTitles(source,{collection:'MATERS vs TATERS — Family Grove'});
 assert.equal(c.total,604);
 assert.equal(metadata.collectionCounts.find(x=>x[0]==='MATERS vs TATERS — Family Grove')[1],604);
});
test('duplicates retained and search always preserves original title bytes',()=>{
 const g=searchTitles(source,{query:'Gabriel'});
 assert.ok(g.total>=2);
 const s=searchTitles(source,{query:'G→U / E→R / R→E Rotation'});
 assert.equal(s.total,1);
 assert.equal(s.items[0].title,'G→U / E→R / R→E Rotation');
});
test('two separate G alternatives preserve exact source and previous g→6',()=>{
 assert.match(routes.originalUserLine,/5 rotated around and or a 6 reshaped the natilus aka tabor spiral/);
 assert.ok(filterRoutes(routes,{query:'5 rotated around'}).length);
 assert.ok(filterRoutes(routes,{query:'a 6 reshaped'}).length);
 assert.equal(geometry.preservedLegacy,'g→6');
 for(const ch of ['5','6','G','g'])assert.equal(glyphTransform({glyph:ch}).original,ch);
 assert.throws(()=>glyphTransform({glyph:'P'}));
 assert.equal(glyphTransform({glyph:'5',degrees:90}).degrees,90);
});
test('inward and outward spiral radius monotonic and different',()=>{
 const inward=spiralPoints({direction:'inward'}),outward=spiralPoints({direction:'outward'});
 assert.ok(inward[0].radius>inward.at(-1).radius);assert.ok(outward[0].radius<outward.at(-1).radius);
 assert.ok(Math.abs(inward[0].radius-1)<1e-12);assert.ok(Math.abs(outward.at(-1).radius-1)<1e-12);
 assert.equal(inward.length,401);assert.ok(svgPath(inward).startsWith('M'));
 assert.throws(()=>spiralPoints({b:3}));
});
test('rotation is reversible within floating-point precision',()=>{
 const p=rotatePoint(8,3,90),q=rotatePoint(p.x,p.y,-90);
 assert.ok(Math.abs(q.x-8)<1e-9&&Math.abs(q.y-3)<1e-9);
});
test('golden mathematical special case separate from Nautilus style coefficient',()=>{
 assert.ok(PHI>1.6&&PHI<1.7);
 assert.ok(Math.abs(GOLDEN_B-0.30635)<0.00001);
 assert.ok(Math.abs(GOLDEN_B-0.18)>0.1);
 assert.equal(geometry.gameReference.chambers,63);
});
test('63 creative game chambers preserve ordered numbering and prior source',()=>{
 const cells=numberedChambers();
 assert.equal(cells.length,63);assert.deepEqual([cells[0].number,cells.at(-1).number],[1,63]);
 assert.ok(Math.hypot(cells[0].x,cells[0].y)>Math.hypot(cells.at(-1).x,cells.at(-1).y));
 assert.throws(()=>numberedChambers(0));
});
test('21 G research routes include full original G code and cross-indexes',()=>{
 assert.equal(routes.entries.length,21);assert.ok(filterRoutes(routes,{query:'GLUCO'}).length>0);
 assert.ok(filterRoutes(routes,{query:'Gate System (12x12 Matrix)'}).length>0);
 assert.ok(filterRoutes(routes,{query:'GORD'}).length>0);
 assert.ok(filterRoutes(routes,{query:'Tabor Spiral'}).length>=2);
});
test('five-game questions have exact answer keys',()=>{
 const q=quizQuestions();assert.equal(q.length,5);for(const item of q){assert.equal(item.choices.length,4);assert.ok(item.choices.includes(item.answer));}
});

test('continuous clockwise and counterclockwise creator rotation and six-to-G morph work',()=>{
 for(const angle of [-360,-270,-90,0,1,45,90,180,270,359,360])assert.equal(glyphTransform({glyph:'5',degrees:angle}).degrees,angle);
 assert.throws(()=>glyphTransform({glyph:'5',degrees:361}));
 assert.throws(()=>glyphTransform({glyph:'5',degrees:0.25}));
 const a=morphSixToG(0),mid=morphSixToG(.5),b=morphSixToG(1);
 assert.equal(a.points.length,12);assert.equal(mid.points.length,12);assert.equal(b.points.length,12);
 assert.notEqual(a.path,b.path);assert.notEqual(mid.path,a.path);
 assert.equal(a.identity,'6-inspired outline');assert.equal(b.identity,'G-inspired outline');
 assert.throws(()=>morphSixToG(1.1));
});
