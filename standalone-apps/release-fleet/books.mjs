import {readFile} from 'node:fs/promises'
import {chapters} from '../game-app-stations/apps/hats-and-hatettes-worlds-within/chronicles.mjs'
import {chapterTitles} from '../game-app-stations/apps/hats-and-hatettes-worlds-within/world.mjs'

const series=JSON.parse(await readFile(new URL('../../app-factory/nathan-ai/sorting-hats-hatettes/series.json',import.meta.url),'utf8'))
const chronicles=chapters.map((chapter,index)=>[chapterTitles[index],chapter.note])
for (const entries of [series,chronicles]) {
  if(entries.length!==13||entries.some(entry=>!Array.isArray(entry)||entry.some(field=>typeof field!=='string'||!field.trim()))) {
    throw Error('Expected 13 sourced volume entries')
  }
}
process.stdout.write(JSON.stringify([
  {id:'unbound-series-map',title:'Sorting Hats & Hatettes · UNBOUND',edition:'13-volume series map',chapters:series},
  {id:'worlds-within-chronicles-preview',title:'Chronicles of Hat & Hatette · Worlds Within',edition:'13 chapter previews',chapters:chronicles},
]))
