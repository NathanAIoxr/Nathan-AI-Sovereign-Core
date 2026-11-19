export const edition = 1
export const chapterTitles = [
  'The First Hat', 'Dude & Dudette', 'The Hatette Spin', 'Boy & Boyette',
  'Girl & Girlette', 'The Box Police', 'Pals & Palettes', 'Kings & Kingettes',
  'The Mirror Fortress', 'Rhythm of the Free', 'The Hater Siege', 'Unboxed', 'DONE.',
]
export const questions = ['Who am I?', 'Why me?', 'What is my true purpose?']
export const mentors = [
  ['The Sage', 'Look at the pattern twice. Circles return. Spirals grow.'],
  ['Granddad', 'Read the sign both ways. Keep the name you chose.'],
  ['The Systems Architect', '1 + 1 = 2 stacks worlds. 1 − 1 = 0 clears a cage.'],
  ['The Cosmic Presence', 'Make a world another traveler can walk through.'],
]
export const briefing = 'DUDES AND DUDETTES — HEAR YE, HEAR YE! BOYS AND BOYETTES, GIRLS AND GIRLETTES, KINGS AND KINGETTES, PALS AND PALETTES — ALL TRAVELERS FROM HERE, THERE, OVER THERE, ABOVE, BELOW, THE MIDDLE, AND NOWHERE — STEP INSIDE THE ONE UNIFIED UNIVERSE!'
export const finale = 'BE THE HAT AND HATETTE — BE YOU — STOP THE HATERS — DONE!'
export const realms = [
  {id:'middle', heading:'The Middle', name:'Babel-Free Bazaar', hat:'The First Hat', color:'#e9b87a', mode:'pi', order:'az', glyph:'BABEL', book:0, x:49, y:48, tone:196, lore:'Lanterns carry pocket worlds above a street that changes with every spoken word.'},
  {id:'here', heading:'Here', name:'Crown Forge', hat:'Sovereign Forge-Brim', color:'#ffae7f', mode:'phi', order:'az', glyph:'FORGE', book:1, x:21, y:66, tone:220, lore:'Shape a brim, give it a sound, and leave a portal open for another traveler.'},
  {id:'there', heading:'There', name:'Rhythm Arena', hat:'Hater-Breaker Halo', color:'#f99e99', mode:'pi', order:'za', glyph:'LABEL', book:5, x:78, y:64, tone:246.94, lore:'Box Police throw labels into the arena. Catch one on your brim and free the traveler inside the cage.'},
  {id:'over-there', heading:'Over There', name:'The Shifting Bridges', hat:'Santa’s Crimson Cap', color:'#ffd27f', mode:'phi', order:'za', glyph:'BRIDGE', book:7, x:76, y:32, tone:261.63, lore:'Step sideways. The bridge comes into view when the sign turns end to beginning.'},
  {id:'above', heading:'Above', name:'The Aurora Yule-Ette', hat:'The Aurora Yule-Ette', color:'#8df3cf', mode:'phi', order:'az', glyph:'AURORA', book:8, x:46, y:22, tone:329.63, lore:'Santa’s Crimson Cap has a feminine equal. Northern lights turn into bridges to her polar sky-citadel.'},
  {id:'below', heading:'Below', name:'Doggerland', hat:'Doggerland Tide-Helm', color:'#67b6ff', mode:'pi', order:'za', glyph:'TIDE', book:3, x:54, y:76, tone:130.81, lore:'Follow the submerged riverbed to a fictional bone-and-amber vault beneath the North Sea.'},
  {id:'nowhere', heading:'Nowhere', name:'The Z-to-A Mirror Void', hat:'Omega-Alpha Crown', color:'#c8a7ff', mode:'phi', order:'za', glyph:'OMEGA', book:11, x:20, y:31, tone:164.81, lore:'The Backwards Citadel reads cause after effect. Turn the inscription around to cross.'},
]
export const hats = [
  ...realms.map(({id,hat,tone,color})=>({id, name:hat, tone, color, realm:id})),
  {id:'silt-weave', name:'Silt-Weave Hatette', tone:146.83, color:'#70d4d3', realm:'below'},
  {id:'alpha-omega', name:'Alpha-Omega Brim', tone:293.66, color:'#e5c0ff', realm:'nowhere'},
]
const knownHat = id => hats.some(hat => hat.id === id)
export const pattern = ['stomp','stomp','clap','rest']

export function frequency(seed) {
  let hash = 2166136261
  for (const character of seed) hash = Math.imul(hash ^ character.codePointAt(0), 16777619)
  const index = hash >>> 0
  return {signature: index.toString(36).toUpperCase().padStart(7,'0'), tone: 164 + index % 193, offset: index % 8}
}

export function newGame() {
  return {edition, seed:'', visited:['middle'], found:[], stack:[], rescued:false, walked:0, creations:[], form:'wearer'}
}

export function readCreation(value) {
  if (!value || typeof value.name !== 'string' || typeof value.word !== 'string') return null
  const name = value.name.trim()
  const word = value.word.trim().toUpperCase()
  if (name.length < 2 || name.length > 36 || !/^[A-Z]{2,16}$/.test(word)) return null
  if (!['pi','phi'].includes(value.mode) || !['az','za'].includes(value.order)) return null
  return {name, word, mode:value.mode, order:value.order}
}

export function readGame(value) {
  if (value?.edition !== edition) return newGame()
  const ids = (input, predicate, limit) => Array.isArray(input) ? [...new Set(input.filter(predicate))].slice(0,limit) : []
  const found = ids(value.found,knownHat,hats.length)
  return {
    edition, seed:typeof value.seed === 'string' && /^[A-Za-z0-9:-]{1,64}$/.test(value.seed) ? value.seed : '',
    visited:ids(['middle',...(Array.isArray(value.visited) ? value.visited : [])],id=>realms.some(realm=>realm.id===id),realms.length),
    found, stack:ids(value.stack,id=>found.includes(id),3),
    rescued:value.rescued === true, walked:Number.isSafeInteger(value.walked) ? Math.max(0,Math.min(9999,value.walked)) : 0,
    creations:Array.isArray(value.creations) ? value.creations.slice(0,13).map(readCreation).filter(Boolean) : [],
    form:['wearer','world','word'].includes(value.form) ? value.form : 'wearer',
  }
}

export function inspect(realm, mode, order) {
  const word = realm.glyph ?? realm.word
  const shown = order === 'za' ? [...word].reverse().join('') : word
  return {shown, open:realm.mode === mode && realm.order === order}
}

export function chooseHat(state, id) {
  if (!state.found.includes(id)) return state.stack
  if (state.stack.includes(id)) return state.stack.filter(item=>item!==id)
  return state.stack.length < 3 ? [...state.stack,id] : state.stack
}

export function stackName(stack) {
  if (stack.includes('above') && (stack.includes('below') || stack.includes('silt-weave'))) return 'Aurora over Doggerland'
  if (stack.includes('above') && stack.includes('over-there')) return 'The Solstice Crown'
  if (stack.includes('below') && stack.includes('silt-weave')) return 'The North Sea Gate'
  if (stack.includes('nowhere') && stack.includes('alpha-omega')) return 'The Double Mirror'
  return hats.filter(hat=>stack.includes(hat.id)).map(hat=>hat.name).join(' + ')
}

export function chapterAccess(state) {
  const has = id => state.found.includes(id)
  return [
    Boolean(state.seed), has('here'), has('middle'), has('below'), has('silt-weave'),
    has('there'), state.visited.includes('over-there'), has('over-there'), has('above'),
    state.stack.length === 3, state.rescued, has('nowhere') && has('alpha-omega'),
    state.found.length === hats.length && state.rescued && state.creations.length > 0,
  ]
}
