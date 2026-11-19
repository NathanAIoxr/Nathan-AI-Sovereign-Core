import {copyFile,mkdir,writeFile} from 'node:fs/promises'
import {alphabet,headwear,materials,realms,pairAt,catalogSize} from '../public/game.mjs'

const catalog={
  alphabet, headwear, materials, realms, winter:pairAt(0,0,0,true), catalogSize,
}

for (const relative of ['./ios/Resources/','./android/app/src/main/assets/']) {
  const directory=new URL(relative,import.meta.url)
  await mkdir(directory,{recursive:true})
  await writeFile(new URL('realms.json',directory),JSON.stringify(catalog)+'\n')
}

const drawable=new URL('./android/app/src/main/res/drawable/',import.meta.url)
await mkdir(drawable,{recursive:true})
await copyFile(new URL('../public/icon-192.png',import.meta.url),new URL('unbound_icon.png',drawable))
