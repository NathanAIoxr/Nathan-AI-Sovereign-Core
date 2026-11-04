import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const get=(name)=>fs.readFileSync(path.join(ROOT,name),"utf8");
const exists=["index.html","reader.html","game.html","manifest.webmanifest","sw.js","icon.svg","README.md","READER_METHOD_V2.md","books/README.md","books/01-the-spine-and-the-stone.md","books/02-four-families-five-marks.md","books/03-the-universal-readers-atlas.md"];
for(const f of exists){assert.ok(fs.existsSync(path.join(ROOT,f)),"Missing "+f)}
const app=get("reader.html"),game=get("game.html"),index=get("index.html");
for(const pane of ["reader","cipher","scripts","ogham","universal","speech","archive"]){assert.ok(app.includes('data-pane="'+pane+'"'),"Missing original pane "+pane)}
assert.ok(app.includes("TMR1"),"Original cipher identifier lost");
assert.ok(app.includes("oghamMasterChart"),"Original master chart lost");
assert.ok(app.includes("exportJSON"),"Original project export missing");
const core="ᚁᚂᚃᚄᚅᚆᚇᚈᚉᚊᚋᚌᚍᚎᚏᚐᚑᚒᚓᚔ";
for(const c of Array.from(core)){assert.ok(game.includes(c),"Game missing Ogham glyph "+c)}
for(const c of Array.from("ᚕᚖᚗᚘᚙ"))assert.ok(game.includes(c),"Forfid missing "+c);
assert.match(game,/const MODES=/);
assert.match(game,/const PLANE=/);
assert.match(game,/const EVIDENCE=/);
assert.match(game,/localStorage/);
assert.match(game,/Export progress JSON/);
assert.ok(game.includes('["ᚇ","D","Dair"]'),"Dair sign not in family 2");
assert.match(index,/reader\.html/);assert.match(index,/game\.html/);
const manifest=JSON.parse(get("manifest.webmanifest"));assert.equal(manifest.start_url,"./index.html");assert.equal(manifest.display,"standalone");
for(const [f,count] of [["books/01-the-spine-and-the-stone.md",7],["books/02-four-families-five-marks.md",8],["books/03-the-universal-readers-atlas.md",10]]){
 const text=get(f);
 const chapterCount=(text.match(/^## Chapter \d+/gm)||[]).length;
 assert.equal(chapterCount,count,"Incorrect narrative chapter count in "+f);
 assert.ok(text.length>9000,"Book is suspiciously short: "+f);
}
console.log("PASS: "+exists.length+" required artifacts; all 7 preserved reader panels; 20 original glyphs; 5 forfeda; game evidence rules; three book manuscripts.");
