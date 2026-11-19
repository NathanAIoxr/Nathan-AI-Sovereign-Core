import {execFileSync} from 'node:child_process'
import {readFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'

const here=new URL('./',import.meta.url)
const root=fileURLToPath(new URL('../../',here))
const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()
const paths=execFileSync('git',['ls-tree','-r','--name-only','-z','HEAD'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean)
const manifests=paths.filter(path=>path.split('/').at(-1)==='app.json')
const catalog=JSON.parse(await readFile(new URL('../game-app-stations/dist/catalog.json',here),'utf8'))
const release=JSON.parse(await readFile(new URL('../game-app-stations/dist/release.json',here),'utf8'))
const prefix='standalone-apps/game-app-stations/apps/'
const origin='https://pub-a374b836528943e2917457f04363c2ff.r2.dev/'
const stations=catalog.stations.map(({id,station,status})=>{
  const manifest=prefix+id+'/app.json'
  if(!manifests.includes(manifest)||station!=='apps/'+id+'/index.html'||!release.hashes[station])
    throw Error('Invalid station source: '+id)
  return {id,manifest,url:new URL(station,origin).href,sourceStatus:status,sha256:release.hashes[station]}
})
if(stations.length!==catalog.count||stations.length!==release.count||new Set(stations.map(site=>site.id)).size!==stations.length)
  throw Error('Catalog counts differ')
const sources=manifests.map(path=>({path,kind:path.startsWith(prefix)?'station-manifest':'app-manifest'}))
const writing=paths.filter(path=>/\/(?:book|series)\.json$|\/books\/[^/]+\.md$|\.epub$/i.test(path)
  && !/(?:^|\/)(?:private|private-[^/]*|recovered-source)(?:\/|$)/i.test(path))
const native=paths.filter(path=>/\/ios\/project\.yml$|\.xcodeproj\/project\.pbxproj$|\/android\/app\/build\.gradle(\.kts)?$/i.test(path))
process.stdout.write(JSON.stringify({revision,sources,stations,writing,native},null,2)+'\n')
