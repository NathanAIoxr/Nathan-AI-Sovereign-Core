import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const m = JSON.parse(await readFile(path.join(root,'manifest.json'),'utf8'));
test('12 distinct crafts, six operations each', () => {
 assert.equal(m.crafts.length,12);
 assert.equal(new Set(m.crafts.map(c=>c.id)).size,12);
 assert.equal(m.crafts.reduce((n,c)=>n+c.steps.length,0),72);
});
test('manifest specifies touch input', () => {
 assert.equal(m.input.multitouch,true);
 assert.equal(m.input.pointerEvents,true);
});
test('generated Worker returns app, health, manifest', async () => {
 const {default:w} = await import(pathToFileURL(path.join(root,'dist','worker.mjs')).href);
 const html=await w.fetch(new Request('https://example.test/'));
 assert.equal(html.status,200); assert.match(await html.text(),/Tabor ONE/);
 const h=await w.fetch(new Request('https://example.test/api/health'));
 const health=await h.json(); assert.equal(health.crafts,12);assert.equal(health.operations,72);
 const manifest=await w.fetch(new Request('https://example.test/api/manifest'));
 assert.equal((await manifest.json()).crafts.length,12);
 const notfound=await w.fetch(new Request('https://example.test/missing')); assert.equal(notfound.status,404);
});
