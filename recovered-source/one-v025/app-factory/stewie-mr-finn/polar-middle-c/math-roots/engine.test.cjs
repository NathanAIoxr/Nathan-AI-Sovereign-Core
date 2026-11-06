const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const c=require('./catalog.js'),e=require('./engine.js');
test('100 ordered gates from 11 eras with unique answer per gate',()=>{
 assert.equal(c.GATES.length,100);assert.equal(new Set(c.GATES.map(g=>g.era)).size,11);
 c.GATES.forEach((g,i)=>{assert.equal(g.id,i+1);assert.ok(g.title&&g.formula);const o=c.optionsFor(g.id);assert.equal(o.length,4);assert.equal(new Set(o).size,4);assert.equal(o.filter(x=>c.check(g.id,x).correct).length,1);});
});
test('source ranges expanded as labeled modern adaptations',()=>{
 for(const i of [1,2,3,4,5,13,14,15,16,17,18,19,20,56,57,58,59,60,61,62,63,64,65])assert.equal(c.GATES[i-1].adapted,true);
});
test('root-finders converge with suitable starting guesses',()=>{
 for(const method of e.METHODS){const s=e.solve('sqrt2',method);assert.equal(s.status,'converged',method+': '+s.error);assert.ok(Math.abs(s.x-Math.SQRT2)<1e-7);}
 for(const method of e.METHODS){const s=e.solve('cubic',method);assert.equal(s.status,'converged',method+': '+s.error);assert.ok(Math.abs(s.x-1.5213797068)<1e-6);}
});
test('root detection does not falsely certify no real root',()=>{
 for(const key of ['tangent','noroot']){const s=e.step(e.init(key,'bisection'));assert.equal(s.status,'failed');assert.match(s.error,/bracket/);}
 assert.equal(e.isolate('noroot').length,0);assert.ok(e.isolate('sqrt2').length>0);
});
test('sine root locally approximates pi/6',()=>{const s=e.solve('sine','hybrid');assert.equal(s.status,'converged');assert.ok(Math.abs(s.x-Math.PI/6)<1e-7)});
test('vector Newton solves BOTH nonlinear equations',()=>{
 let s={x:1.5,y:.5,iterations:[]};for(let i=0;i<10;i++){s=e.vectorStep(s);if(s.status==='converged')break;}
 assert.equal(s.status,'converged');assert.ok(Math.abs(s.x-2)<1e-7);assert.ok(Math.abs(s.y-1)<1e-7);
});
test('offline iPhone script mirrors must be identical',()=>{
 const parent=path.resolve(__dirname,'../../Resources/PolarMiddleC/math-roots');
 for(const f of ['catalog.js','engine.js'])assert.equal(fs.readFileSync(path.join(__dirname,f),'utf8'),fs.readFileSync(path.join(parent,f),'utf8'));
});
