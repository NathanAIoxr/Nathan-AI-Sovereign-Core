import {createHash} from 'node:crypto'

const origin='https://pub-a374b836528943e2917457f04363c2ff.r2.dev/'
const release='releases/nathan-release-fleet/ec97a12c75f6/'
const assets=[
  ['unbound-series-map.epub','application/epub+zip','3ed8e82a7c9138a25c88974e60d045fa547aeadc8b6c9121d71553923c991145'],
  ['worlds-within-chronicles-preview.epub','application/epub+zip','9492dc2cb506e258224cf5b23b96b502abcae1f5bf9579ce7f558e81d8e440d8'],
  ['hat-os-bios-diagnostic.zip','application/zip','17c01d8697b10e86f08dd1f9f42b59d3b306e8078d5e527b36acb20caff85883'],
]

const results=await Promise.allSettled(assets.map(async ([file,mime,expected])=>{
  const url=new URL(release+file,origin)
  const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000)})
  if(!response.ok) throw Error(file+' returned HTTP '+response.status)
  const type=response.headers.get('content-type')?.split(';')[0]
  if(type!==mime) throw Error(file+' returned '+type+', expected '+mime)
  const bytes=Buffer.from(await response.arrayBuffer())
  const sha256=createHash('sha256').update(bytes).digest('hex')
  if(sha256!==expected) throw Error(file+' digest mismatch')
  return {name:file,url:url.href,sha256,bytes:bytes.length,http:response.status}
}))

const failures=results.filter(result=>result.status==='rejected')
const verified=results.filter(result=>result.status==='fulfilled').map(result=>result.value)
const messages=failures.map(({reason})=>String(reason.message??reason))
console.log(JSON.stringify({checkedAt:new Date().toISOString(),commit:process.env.GITHUB_SHA??null,verified,failures:messages},null,2))
if(failures.length) process.exitCode=1
