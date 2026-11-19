import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const record=JSON.parse(readFileSync(new URL("./research/isaiah-45-7-provenance.json",import.meta.url),"utf8"));
test("KJV source and creator comparison remain separate",()=>{assert.equal(record.scripture.classification,"scripture");assert.match(record.scripture.text,/create evil/);assert.equal(record.interpretation.classification,"creator_interpretation");assert.ok(record.interpretation.description.includes("not a statement"));});
test("Hebrew words have attributed sources and distinct Strong numbers",()=>{assert.equal(new Set(record.lexemes.map(x=>x.strong)).size,record.lexemes.length);assert.ok(record.lexemes.every(x=>x.hebrew&&x.source.startsWith("https://")));assert.ok(record.lexemes.some(x=>x.strong==="H7451"&&x.gloss.includes("calamity")));});
test("unresolved historical links remain unresolved",()=>{assert.ok(record.unresolved.some(x=>x.includes("historical link")));assert.ok(record.sources.every(x=>x.supports&& (x.url||x.path)));});
