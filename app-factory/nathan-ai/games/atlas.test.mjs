import test from 'node:test';
import assert from 'node:assert/strict';
import {parseOwnerPack,sourceLineEntries,PACK_SCHEMA} from './atlas.mjs';

test('recognizes owner-source packs and preserves content exactly',()=>{
  const content='• 1. THE GAME OF GAMES: 1+1=2\n\n• 2. THE TABOR SPIRAL: 1-1=0\n';
  const pack=JSON.stringify({schema:PACK_SCHEMA,files:[{name:'source.txt',content,source_kind:'user_supplied_verbatim'}]});
  const items=parseOwnerPack(pack);
  assert.equal(items.length,1);
  assert.equal(items[0].name,'source.txt');
  assert.equal(items[0].content,content);
});
test('does not interpret arbitrary JSON or invalid packs as a source pack',()=>{
  assert.equal(parseOwnerPack('{"hello":"world"}'),null);
  assert.equal(parseOwnerPack('not json'),null);
  assert.throws(()=>parseOwnerPack(JSON.stringify({schema:PACK_SCHEMA,files:[{name:'broken'}]})),/Invalid pack/);
});
test('derives search entries separately without changing original source',()=>{
  const content='Header\n• 1. Christmas Cipher Alphabet Grid: The 52-week system.\n• Synthesis: Multi-epoch tabletop mechanics.\nIgnored line\n';
  const original={id:7,name:'preserved.txt',content};
  const entries=sourceLineEntries(original);
  assert.equal(entries.length,2);
  assert.equal(entries[0].title,'Christmas Cipher Alphabet Grid');
  assert.equal(entries[0].number,'1');
  assert.equal(entries[0].line,2);
  assert.equal(entries[1].title,'Synthesis');
  assert.equal(original.content,content);
});
test('rejects oversized owner files to avoid accidental browser overload',()=>{
  const pack=JSON.stringify({schema:PACK_SCHEMA,files:[{name:'huge.txt',content:'a'.repeat(8000001)}]});
  assert.throws(()=>parseOwnerPack(pack),/exceeds/);
});
