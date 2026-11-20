import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
const here=(name)=>fileURLToPath(new URL(name,import.meta.url));
function crc32(bytes){
  let crc=0xffffffff;
  for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  return (crc^0xffffffff)>>>0;
}
function chunk(name,bytes){
  const tag=Buffer.from(name),header=Buffer.alloc(4),tail=Buffer.alloc(4);
  header.writeUInt32BE(bytes.length);tail.writeUInt32BE(crc32(Buffer.concat([tag,bytes])));
  return Buffer.concat([header,tag,bytes,tail]);
}
function icon(size){
  const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=2;
  const stride=size*3+1,pixels=Buffer.alloc(stride*size);
  const flakes=[[.43,.36],[.49,.32],[.57,.38],[.53,.44],[.39,.47],[.60,.48]];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const px=x/size,py=y/size,d=Math.hypot(px-.5,py-.445);
    let color=[19,40,33];
    if(d<.241)color=[184,220,209];
    if(d<.219)color=[49,92,78];
    if(py>.656&&py<.761&&Math.abs(px-.5)<.13+(py-.656)*.36)color=[167,130,81];
    if(d<.206&&py>.53&&py<.635&&Math.abs(px-.5)<.092)color=[186,147,94];
    if(py>.479&&py<.554&&Math.abs(px-.5)<(py-.479)*1.6)color=[244,237,218];
    if(flakes.some(([fx,fy])=>Math.hypot(px-fx,py-fy)<.014))color=[244,237,218];
    const start=y*stride+1+x*3;pixels.set(color,start);
  }
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
}
await cp(here('./public'),here('./dist'),{recursive:true});
for(const size of [192,512])await writeFile(here('./dist/icon-'+size+'.png'),icon(size));
const records=Object.fromEntries(await Promise.all((await readdir(here('./dist'))).map(async name=>{
  const data=await readFile(here('./dist/'+name));return [name,/\.(png|webp)$/.test(name)?{base64:data.toString('base64')}:data.toString('utf8')];
})));
const runtime=await readFile(here('./worker.mjs'),'utf8');
await mkdir(here('./.release'),{recursive:true});
await writeFile(here('./.release/worker.mjs'),runtime.replace('/*__ASSETS__*/ {}',()=>JSON.stringify(records)));
