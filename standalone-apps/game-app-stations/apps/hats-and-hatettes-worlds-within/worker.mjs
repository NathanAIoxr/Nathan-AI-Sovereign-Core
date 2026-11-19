import {edition, realms, hats, questions, chapterTitles} from './world.mjs'
import {chapters} from './chronicles.mjs'

const prefix='apps/hats-and-hatettes-worlds-within/'
const assets={
  '/':'play.html',
  '/play.html':'play.html',
  '/worlds.css':'worlds.css',
  '/world.mjs':'world.mjs',
  '/play.mjs':'play.mjs',
  '/landscape.mjs':'landscape.mjs',
  '/chronicles.mjs':'chronicles.mjs',
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

export default {
  async fetch(request, env) {
    const {pathname}=new URL(request.url)
    const {method}=request
    if(!['HEAD','GET'].includes(method)) {
      return new Response('Method not allowed',{status:405,headers:{...headers,Allow:'GET, HEAD'}})
    }
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
