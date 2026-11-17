import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { routes } from './routes.mjs';

const here = path => new URL('../' + path, import.meta.url);
const root = fileURLToPath(new URL('../../../',import.meta.url));
const base = 'standalone-apps/hook-and-ring';
const dependencies = [
  'app-factory/tabor-tracker-ball/public/digit-input.mjs',
  'app-factory/tabor-tracker-ball/public/track-baller.mjs',
  'standalone-apps/tactilecore-sdk/LICENSE.md',
  'standalone-apps/tactilecore-sdk/src/engine.mjs',
  'standalone-apps/tactilecore-sdk/src/kinetic.mjs',
];
const git = args => execFileSync('git',args,{cwd:root,maxBuffer:4*1024*1024,stdio:['ignore','pipe','pipe']});
const sha = content => createHash('sha256').update(content).digest('hex');
const modules = ['game/physics.mjs', 'game/yard-rules.mjs', 'server/worker.mjs'];
const source = await Promise.all(modules.map(path => readFile(here(path), 'utf8')));
const server = source.map(module => module.replace(/^import .*?;\n/gm, '').replace(/^export /gm, '')).join('\n');

const assets = await Promise.all(routes.map(async ([route, path, type, binary]) => {
  let content=await readFile(here('game/'+path),binary?'base64':'utf8');
  if(route==='/controllers/digit-input.mjs'){
    for(const [from,to] of [
      ['../../../standalone-apps/tactilecore-sdk/src/engine.mjs','./engine.mjs'],
      ['../../../standalone-apps/hook-and-ring/game/input.mjs','/input.mjs?v=3'],
    ]){
      if(!content.includes(from))throw Error('Digit controller import changed: '+from);
      content=content.replace(from,to);
    }
  }
  return [route,{type,content,binary}];
}));
let sourceCommit=null;
try {sourceCommit=git(['rev-parse','HEAD']).toString().trim();}catch {}
let archive=null;
if(process.env.PUBLISH_SOURCE==='1'){
  if(!sourceCommit||git(['status','--porcelain','--',base,...dependencies]).toString().trim()){
    throw Error('Publish the source archive from a clean committed checkout.');
  }
  const bytes=git(['archive','--format=tar.gz','--prefix=hook-and-ring-source/',sourceCommit,base,...dependencies]);
  archive={path:'/source.tar.gz',sha256:sha(bytes),bytes:bytes.length};
  assets.push([archive.path,{type:'application/gzip',content:bytes.toString('base64'),binary:true}]);
}
const bundleMap=new Map(assets);
const release={
  app:'Hook and Ring by Nathan Tabor',
  version:JSON.parse(await readFile(here('package.json'),'utf8')).version,
  sourceCommit, archive, boardCount:JSON.parse(bundleMap.get('/game-plugins.json').content).length,
  routes:assets.map(([path,value])=>({path,sha256:sha(Buffer.from(value.content,value.binary?'base64':'utf8'))})),
};
assets.push(['/release.json',{type:'application/json; charset=utf-8',content:JSON.stringify(release),binary:false}]);
const script=server+'\nconst bundled = '+JSON.stringify(assets)+";\nconst assets = new Map(bundled.map(([path,{type,content,binary}]) => [path,{\n  type, bytes: () => binary ? Uint8Array.from(atob(content), c => c.charCodeAt(0)) : content\n}]));\nexport default createWorker(assets);\n";

await mkdir(here('dist/'),{recursive:true});
await writeFile(here('dist/worker.mjs'),script);

const monitor = await readFile(here('server/release-bee.mjs'), 'utf8');
const catalog = bundleMap.get('/ecosystem.json').content.trim();
await writeFile(here('dist/release-bee.mjs'), monitor.replace(/^import .*;\n/, `const catalog = ${catalog};\n`));
