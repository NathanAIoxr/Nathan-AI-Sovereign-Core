import { readFile,writeFile,mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const dir=fileURLToPath(new URL(".",import.meta.url));
const root=resolve(dir,"../..");
const app="app-factory/tabor-universal-library-engine";
const entry="/"+app+"/public/";
const arcade="app-factory/games/dual-screen-arcade/index.html";
const read=path=>readFile(resolve(root,path),"utf8");
function extract(text,begin,end){
  const start=text.indexOf(begin),stop=text.indexOf(end,start);
  if(start<0||stop<=start)throw Error("Dual-Screen Arcade export markers changed: "+begin);
  return text.slice(start,stop);
}
export function arcadeModule(source){
  const bridge=extract(source,"const TOP = {","const COLORS=");
  const physics=extract(source,"const W=560,H=208;","function drawTarget");
  return "// Generated from the Dual-Screen Arcade by ../build.mjs.\n"+bridge+"\n"+physics+"\nexport {newRound,grant,beginAttempt,endAttempt,updateBridge,evaluateShot,ringX};\n";
}
const browserFiles=[
  "app-factory/tabor-tracker-ball/public/track-baller.mjs",
  "app-factory/tabor-tracker-ball/public/digit-input.mjs",
  "app-factory/grapple-it/public/rope.mjs",
  "app-factory/grapple-it/public/fixed-clock.mjs",
  "standalone-apps/tactilecore-sdk/src/engine.mjs",
  "standalone-apps/hook-and-ring/game/input.mjs",
  "standalone-apps/hook-and-ring/game/physics.mjs",
  ...["index.html","app.mjs","engine.mjs","labs.mjs","style.css","catalog.json"].map(p=>app+"/public/"+p)
];
export async function build(){
  const generated=arcadeModule(await read(arcade));
  const assets=Object.fromEntries(await Promise.all(browserFiles.map(async p=>["/"+p,await read(p)])));
  assets[entry+"arcade-core.mjs"]=generated;
  for(const f of ["index.html","world.css","world.mjs","world-core.mjs","frontier.mjs","world.json","source-catalog.json","cast-and-props.json","release-ledger.json","destinations.json"])
    assets[entry+"world/"+f]=await read(app+"/public/world/"+f);
  assets[entry+"world/cosmic-body.json"]=await read("app-factory/nathan-ai/anatomy/cosmic-body/atlas.json");
  assets[entry+"world/worlds-atlas.json"]=await read("app-factory/one/mespark-memory-matrix/worlds-atlas.json");
  const hero=entry+"world/tabor-world-hero.webp";
  assets[hero]=await readFile(resolve(root,app+"/public/world/tabor-world-hero.webp"));
  const manifest=JSON.parse(assets[entry+"world/release-ledger.json"]);
  const releaseInfo={schema:manifest.schema,release:manifest.current,counts:manifest.counts};
  const out=resolve(dir,".release");
  await mkdir(out,{recursive:true});
  await writeFile(resolve(dir,"public/arcade-core.mjs"),generated);
  const packed=Object.fromEntries(Object.entries(assets).map(([path,content])=>
    [path,Buffer.isBuffer(content)?{base64:content.toString("base64")}:Buffer.byteLength(content)>12000?[gzipSync(content,{level:9}).toString("base64")]:content]));
  const worker="const files="+JSON.stringify(packed)+";\nconst entry="+JSON.stringify(entry)+";\nconst releaseInfo="+JSON.stringify(releaseInfo)+";\n"+
    await read(app+"/worker.mjs");
  await writeFile(resolve(out,"worker.mjs"),worker);
  return {worker,assets};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await build();
