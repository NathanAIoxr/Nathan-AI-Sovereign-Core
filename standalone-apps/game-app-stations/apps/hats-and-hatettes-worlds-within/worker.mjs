import {edition, realms, hats, questions, chapterTitles} from './world.mjs'
import {chapters} from './chronicles.mjs'
import {expeditions,expeditionGroups,evidenceLabels} from './expedition-data.mjs'
import {variantCount} from './expedition.mjs'

const prefix='apps/hats-and-hatettes-worlds-within/'
const assets={
  '/':'play.html',
  '/play.html':'play.html',
  '/worlds.css':'worlds.css',
  '/world.mjs':'world.mjs',
  '/play.mjs':'play.mjs',
  '/landscape.mjs':'landscape.mjs',
  '/chronicles.mjs':'chronicles.mjs',
  '/expedition-data.mjs':'expedition-data.mjs',
  '/expedition.mjs':'expedition.mjs',
  '/expedition-ui.mjs':'expedition-ui.mjs',
  '/headwear.mjs':'headwear.mjs',
  '/met-headwear.mjs':'met-headwear.mjs',
}
const types={
  html:'text/html; charset=utf-8',
  css:'text/css; charset=utf-8',
  mjs:'text/javascript; charset=utf-8',
}
const headers={
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'Permissions-Policy':'camera=(self), microphone=(), geolocation=()',
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; media-src 'self' blob:; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
}

function receipt(data, method) {
  return new Response(method==='HEAD'?null:JSON.stringify(data),{
    headers:{...headers,'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=60'},
  })
}

const catalogs={
  museum:{columns:'object_id,kind,title,dating,culture,department', table:'museum_object', terms:"kind||' '||title||' '||culture||' '||department", order:'object_id'},
  styles:{columns:'name,family', table:'headwear_style', terms:"name||' '||family", order:'name'},
  pairs:{columns:'id,realm,variant,hat,hatette', table:'pair', terms:"realm||' '||hat||' '||hatette", order:'realm,variant'},
}

async function listCatalog(request, env, url) {
  const kind=url.searchParams.get('kind')??'pairs'
  if(!Object.hasOwn(catalogs,kind)) return new Response('Unknown catalog',{status:400,headers})
  if(!env.CATALOG) return new Response('Catalog unavailable',{status:503,headers})
  const {columns,table,terms,order}=catalogs[kind]
  const query=(url.searchParams.get('q')??'').trim().slice(0,80)
  const offset=Math.min(15000,Math.max(0,Number.parseInt(url.searchParams.get('offset')??'0',10)||0))
  const limit=Math.min(100,Math.max(1,Number.parseInt(url.searchParams.get('limit')??'24',10)||24))
  const where=' WHERE instr(lower('+terms+'),lower(?1)) > 0'
  const results=await env.CATALOG.batch([
    env.CATALOG.prepare('SELECT COUNT(*) AS total FROM '+table+where).bind(query),
    env.CATALOG.prepare('SELECT '+columns+' FROM '+table+where+' ORDER BY '+order+' LIMIT ?2 OFFSET ?3').bind(query,limit,offset),
  ])
  return receipt({kind,query,offset,limit,total:results[0].results[0].total,items:results[1].results},request.method)
}

export default {
  async fetch(request, env) {
    const url=new URL(request.url)
    const {pathname}=url
    const {method}=request
    if(!['HEAD','GET'].includes(method)) {
      return new Response('Method not allowed',{status:405,headers:{...headers,Allow:'GET, HEAD'}})
    }
    if(pathname==='/api/expeditions') return receipt({edition,expeditions,groups:expeditionGroups,evidenceLabels,variantsPerRealm:variantCount},method)
    if(pathname==='/api/catalog') return listCatalog(request,env,url)
    if(pathname==='/api/atlas') return receipt({edition,realms,hats,questions,chapters:chapters.map((chapter,index)=>({title:chapterTitles[index],...chapter}))},method)
    if(pathname==='/api/health') {
      const game=await env.STATIONS.head(prefix+'play.html')
      if(!game) return new Response(null,{status:503,headers})
      return receipt({ok:true,edition,coordinates:realms.length,hats:hats.length,chapters:chapters.length},method)
    }
    if(!Object.hasOwn(assets,pathname)) return new Response(method==='HEAD'?null:'World not found',{status:404,headers})
    const file=assets[pathname]
    const key=prefix+file
    const object=method==='HEAD'?await env.STATIONS.head(key):await env.STATIONS.get(key)
    if(!object) return new Response(null,{status:503,headers})
    const responseHeaders={
      ...headers,
      'Content-Type':types[file.split('.').at(-1)],
      'Cache-Control':'public, max-age=60',
      'Content-Length':String(object.size),
      ETag:object.httpEtag,
    }
    if(request.headers.get('If-None-Match')===object.httpEtag) {
      delete responseHeaders['Content-Length']
      return new Response(null,{status:304,headers:responseHeaders})
    }
    return new Response(method==='HEAD'?null:object.body,{headers:responseHeaders})
  },
}
