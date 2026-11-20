import assert from 'node:assert/strict';
import {normalize,layouts,makerSheet} from './public/model.js';
import app from './.release/worker.mjs';
for(const [format,count] of [['single',1],['stack',3],['pyramid',6]]){
 const design=normalize({format,scenes:['cosmos'],snow:140,tier:'studio',quantity:0});
 assert.equal(layouts[format].points.length,count);
 assert.equal(design.scenes.length,count);
 assert.equal(design.scenes[0],'cosmos');
 assert.equal(design.snow,100);
 assert.equal(design.quantity,1);
 if(count>1)assert.match(makerSheet(design),/Individual quote/);
 assert.deepEqual(normalize(JSON.parse(JSON.stringify(design))),design);
}
assert.match(makerSheet(normalize({format:'pyramid'})),/BELOW · Left.*[\s\S]+ABOVE · Unity/);
assert.doesNotThrow(()=>normalize(null));
assert.equal(app.fetch(new Request('https://example.com/')).status,200);
assert.equal(app.fetch(new Request('https://example.com/model.js')).headers.get('content-type'),'text/javascript; charset=utf-8');
assert.equal(await app.fetch(new Request('https://example.com/',{method:'HEAD'})).text(),'');
assert.equal(app.fetch(new Request('https://example.com/nope')).status,404);
console.log('Layouts, design round trips, production briefs and asset routes passed.');
