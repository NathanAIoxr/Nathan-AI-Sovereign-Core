import {expeditions,expeditionGroups} from './expedition-data.mjs'

export const variantCount=128
const brims=['Crown','Cap','Hood','Brim','Helm','Bonnet','Circlet','Wrap']
const mirrors=['Crown Hatette','Cap Hatette','Hood Hatette','Brim Hatette','Helm Hatette','Bonnet Hatette','Circlet Hatette','Wrap Hatette']
const byId=new Map(expeditions.map(realm=>[realm.id,realm]))
const emptyBits='0'.repeat(variantCount/4)

export function findExpedition(id) {
  return byId.get(id)
}

export function makePair(realm, variant) {
  if (!realm || !Number.isInteger(variant) || variant<0 || variant>=variantCount) return null
  const group=expeditionGroups[realm.group]
  const id=realm.id+'-'+variant.toString(16).padStart(2,'0')
  if (variant===0) return {id,realm:realm.id,variant,hat:realm.hat,hatette:realm.hatette}
  const motif=realm.motifs[variant>>5]
  const material=group.materials[(variant>>3)%4]
  const form=variant%brims.length
  return {id,realm:realm.id,variant,hat:motif+' '+material+' '+brims[form],hatette:material+' '+motif+' '+mirrors[form]}
}

export function stageFor(realm, variant, step) {
  const seed=[...realm.id].reduce((n,letter)=>Math.imul(n,31)+letter.charCodeAt(0),0)>>>0
  const mode=(seed+variant+step)%2===0?'pi':'phi'
  const order=((seed>>>3)+variant+(step===1?1:0))%2===0?'az':'za'
  const word=step===0?realm.glyph:step===1?realm.motifs[(seed+variant)%realm.motifs.length].toUpperCase():realm.glyph+' '+realm.motifs[variant>>5].toUpperCase()
  return {mode,order,word,label:expeditionGroups[realm.group].stages[step]}
}

export function showInscription(word, order) {
  return order==='za'?[...word].reverse().join(''):word
}

export function readExpeditions(value) {
  if (!value || typeof value!=='object') return {}
  return Object.fromEntries(expeditions.flatMap(({id})=>{
    const bits=Object.hasOwn(value,id)?value[id]:null
    return typeof bits==='string' && /^[0-9a-f]{32}$/.test(bits)?[[id,bits]]:[]
  }))
}

export function hasPair(progress, id, variant) {
  const digit=(progress[id]??emptyBits)[variant>>2]
  return Boolean(parseInt(digit,16)&(1<<(variant%4)))
}

export function restorePair(progress, realm, variant) {
  if (!makePair(realm,variant)) return progress
  const current=progress[realm.id]??emptyBits
  const position=variant>>2
  const digit=parseInt(current[position],16)|(1<<(variant%4))
  return {...progress,[realm.id]:current.slice(0,position)+digit.toString(16)+current.slice(position+1)}
}

const bitCounts=[0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4]
export function countPairs(progress) {
  return Object.values(progress).reduce((total,bits)=>total+[...bits].reduce((n,digit)=>n+bitCounts[parseInt(digit,16)],0),0)
}

export function foldText(text) {
  return text.normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase()
}
