export const domains = [
  'Language and phonetics', 'Logic and attributes', 'Handling Life and provenance',
  'Find the Tabor and research', 'Library of Tabor and publishing', 'Finger Physics and games',
  'Vehicles, hardware and repair', 'Engineering and diagnostics', 'Operations and releases',
  'Sovereignty and verification', 'Fleet orchestration'
]

export const items = []
const add = (name, bot, input, run, review, needs) => {
  items.push({ name, bot, input, run, review, needs })
}

const string = value => String(value ?? '')
const txt = x => string(x.text)
const list = value => {
  if (!Array.isArray(value)) throw new TypeError('Expected an array')
  if (value.length > 1000) throw new RangeError('Maximum array length is 1,000')
  return value
}
const num = value => {
  if ((typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) ||
      !Number.isFinite(Number(value))) throw new TypeError('Expected a finite number')
  return Number(value)
}
const positive = value => {
  const number = num(value)
  if (number <= 0) throw new RangeError('Expected a positive number')
  return number
}
const digits = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
const chars = text => Array.from(digits.segment(string(text)), part => part.segment)
const words = text => string(text).match(/[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}]+)*/gu) ?? []
const lines = text => string(text).split(/\r\n|\r|\n/)
const fold = value => string(value).normalize('NFKC').toLowerCase()
const plain = value => fold(value).normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]/gu, '')
const rev = text => chars(text).reverse().join('')
const unique = values => [...new Set(values)]
const count = values => {
  const result = new Map()
  for (const value of values) result.set(value, (result.get(value) ?? 0) + 1)
  return [...result].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }))
}
const bytes = value => new TextEncoder().encode(string(value))
const hex = buffer => Array.from(new Uint8Array(buffer), n => n.toString(16).padStart(2, '0')).join('')
const hash = async value => hex(await crypto.subtle.digest('SHA-256', bytes(value)))
const identical = (a, b) => string(a) === string(b)
const date = value => {
  const raw = string(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new TypeError('Use YYYY-MM-DD')
  const parsed = Date.parse(raw)
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0, 10) !== raw) throw new RangeError('Invalid calendar date')
  return parsed
}
const median = values => {
  const sorted = list(values).map(num).sort((a, b) => a - b)
  if (!sorted.length) throw new RangeError('At least one value required')
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}
const obj = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Expected an object')
  return value
}
const sortedKeys = record => Object.keys(obj(record)).sort()
const stable = value => Array.isArray(value) ? value.map(stable)
  : value && typeof value === 'object' ? Object.fromEntries(sortedKeys(value).map(key => [key, stable(value[key])])) : value
const secureUrl = value => {
  const parsed = new URL(string(value))
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new TypeError('Use an HTTP(S) URL without credentials')
  return parsed
}
const ratio = (a, b) => num(a) / positive(b)
const pct = (a, b) => ratio(a, b) * 100
const distance = (a, b) => Math.hypot(num(a.x) - num(b.x), num(a.y) - num(b.y))
const boundInt = (value, min, max) => {
  const n = num(value)
  if (!Number.isInteger(n) || n < min || n > max) throw new RangeError(`Expected an integer from ${min} to ${max}`)
  return n
}
const missing = (record, fields) => list(fields).map(string).filter(key => !Object.hasOwn(obj(record), key) || record[key] == null || record[key] === '')
const escapeHtml = value => string(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c])
const formatId = (prefix, n) => `${prefix}-${String(n).padStart(3, '0')}`
const fromBase = (value, base) => {
  const baseNumber = BigInt(boundInt(base, 2, 36))
  const raw = string(value).toLowerCase()
  if (!/^-?[0-9a-z]{1,256}$/.test(raw)) throw new TypeError('Expected a signed integer of up to 256 digits')
  const negative = raw.startsWith('-')
  let total = 0n
  for (const digit of negative ? raw.slice(1) : raw) {
    const n = BigInt(parseInt(digit, 36))
    if (n >= baseNumber) throw new RangeError('Digit outside input base')
    total = total * baseNumber + n
  }
  return negative ? -total : total
}

const sound = value => {
  const letters = plain(value).toUpperCase().replace(/[^A-Z]/g, '')
  if (!letters) throw new TypeError('English Soundex requires Latin A–Z letters')
  const code = letter => ['BFPV','CGJKQSXZ','DT','L','MN','R'].findIndex(g => g.includes(letter)) + 1
  let result = letters[0], last = code(letters[0])
  for (const letter of letters.slice(1)) {
    if ('HW'.includes(letter)) continue
    const next = code(letter)
    if (next && next !== last) result += next
    last = next
  }
  return result.padEnd(4, '0').slice(0, 4)
}
const homophones = [
  ['right','rite','write','wright'], ['there','their','they’re'], ['nose','knows'],
  ['hear','here'], ['one','won'], ['two','too','to'], ['peace','piece'], ['read','reed'],
  ['sew','so','sow'], ['new','knew'], ['whole','hole'], ['brake','break']
]
const compareEvidence = entries => {
  const byClaim = new Map()
  for (const entry of list(entries)) {
    const claim = string(entry.claim).trim()
    if (!claim) throw new TypeError('Each entry needs a claim')
    const values = byClaim.get(claim) ?? new Map()
    const key = JSON.stringify(stable(entry.value ?? null))
    const sources = values.get(key) ?? []
    sources.push(string(entry.source))
    values.set(key, sources)
    byClaim.set(claim, values)
  }
  return Array.from(byClaim).filter(([, values]) => values.size > 1).map(([claim, values]) => ({
    claim, alternatives: Array.from(values, ([value, sources]) => ({ value: JSON.parse(value), sources }))
  }))
}

// 001–010
add('Phonetic and Root-Word Deconstructor', 'Root Evidence Auditor', {
  word:'Tabor', entries:[{ term:'Tabor', language:'English', root:'', source:'' }]
}, x => ({ soundex: sound(x.word), dictionaryMatches:list(x.entries).filter(e => fold(e.term) === fold(x.word)) }),
r => ({ entriesMissingCitations:r.dictionaryMatches.filter(e => !e.source), phoneticMethod:'English Soundex' }),
'Comparable root entries supplied by the caller. Root claims need citations.')
add('Bidirectional and Mirror Text', 'Grapheme Round-Trip Checker', { text:'GOD\nDOG' }, x => ({
  mirror:rev(txt(x)), lineMirrors:lines(txt(x)).map(rev), bottomToTop:lines(txt(x)).reverse().join('\n')
}), (r,x) => ({ verified:rev(r.mirror) === txt(x) }))
add('Acrostic Matrix', 'Acrostic Position Auditor', { text:'Truth\nArchive\nBuild\nOrigin\nRoot' },
x => lines(txt(x)).flatMap((line,i) => line.trim() ? [{ line:i+1, first:chars(line.trim())[0] }] : []),
r => ({ acrostic:r.map(e=>e.first).join(''), citedLines:r.map(e=>e.line) }))
add('Homophone and Context Review', 'Dictation Ambiguity Reviewer', { text:'I heard someone knows the right route.' },
x => words(txt(x)).flatMap((word, i) => {
  const group = homophones.find(g => g.includes(fold(word)))
  return group ? [{ position:i+1, original:word, alternatives:group.filter(w=>w!==fold(word)) }] : []
}), r => ({ flags:r.length, resolution:'author review' }))
add('Anagram Comparator', 'Letter Inventory Verifier', { left:'LIVE', right:'EVIL' },
x => ({ match:chars(plain(x.left)).sort().join('')===chars(plain(x.right)).sort().join(''), counts:count(chars(plain(x.left))) }),
(r,x) => ({ equalLength:chars(plain(x.left)).length===chars(plain(x.right)).length, match:r.match }))
add('Four-Beat Cadence', 'Cadence Alignment Counter', { words:['watch','your','step','rest','watch'] },
x => list(x.words).map((value,i)=>({ value, beat:['STOMP','STOMP','CLAP','REST'][i%4] })),
r => ({ bars:Math.ceil(r.length/4), openSlots:(4-r.length%4)%4 }))
add('Circular Reading', 'Rotation Reversal Checker', { text:'TABOR', offset:2 }, x => {
  const units=chars(txt(x)), size=units.length
  const offset=((boundInt(x.offset,-100000,100000)%(size||1))+size)%(size||1)
  return { offset, rotated:[...units.slice(offset),...units.slice(0,offset)].join('') }
}, (r,x) => ({ verified:chars(r.rotated).length===chars(txt(x)).length, offset:r.offset }))
add('Script Inventory', 'Mixed Script Reviewer', { text:'Tabor Τάβωρ תבור' },
x => Object.fromEntries(['Latin','Greek','Hebrew','Arabic','Cyrillic','Han'].map(s=>[s,(txt(x).match(new RegExp(`\\p{Script=${s}}`,'gu'))??[]).length])),
r => ({ activeScripts:Object.keys(r).filter(k=>r[k]), mixed:Object.values(r).filter(Boolean).length>1 }))
add('Concordance Finder', 'Citation Context Checker', { text:'build clear build', term:'build' },
x => lines(txt(x)).flatMap((line,i)=>words(line).some(w=>fold(w)===fold(x.term))?[{ line:i+1, text:line }]:[]),
(r,x) => ({ matchedLines:r.length, verified:r.every(row=>lines(txt(x))[row.line-1]===row.text) }))
add('Parallel Passage Alignment', 'Missing Witness Marker', { left:'one\ntwo', right:'one\nthree\nfour' },
x => Array.from({length:Math.max(lines(x.left).length,lines(x.right).length)},(_,i)=>({line:i+1,left:lines(x.left)[i]??null,right:lines(x.right)[i]??null})),
r => ({ missing:r.filter(row=>row.left===null||row.right===null).map(row=>row.line), differing:r.filter(row=>row.left!==row.right).map(row=>row.line) }))

// 011–020
add('Attribute-Only Comparator', 'Unmapped Attribute Reviewer', { left:{brand:'A', watts:60}, right:{brand:'B', watts:70}, fields:['watts'] },
x => list(x.fields).map(key=>({ key, left:obj(x.left)[key]??null,right:obj(x.right)[key]??null })),
r => ({ missing:r.filter(row=>row.left===null||row.right===null).map(row=>row.key) }))
add('Root Cause Decision Tree', 'Untested Cause Reviewer', { observations:{ power:false }, rules:[{ test:'power', equals:false, cause:'Supply path needs inspection' }] },
x => list(x.rules).filter(rule=>Object.hasOwn(obj(x.observations),rule.test)&&Object.is(x.observations[rule.test],rule.equals)),
(r,x) => ({ hypothesisCount:r.length, untested:unique(list(x.rules).map(rule=>rule.test)).filter(key=>!Object.hasOwn(x.observations,key)) }))
add('Ripple Impact Simulator', 'Scenario Assumption Reviewer', { base:100, scenarios:[{name:'Repair', changes:[20,-5]}] },
x => list(x.scenarios).map(s=>({name:s.name, outcome:list(s.changes).reduce((n,d)=>n+num(d),num(x.base))})),
(r,x) => ({ changesByScenario:r.map(s=>({name:s.name,delta:s.outcome-num(x.base)})), model:'additive' }))
add('Binary and Duodecimal Converter', 'Base Round-Trip Checker', { value:'144', from:10, to:12 },
x => ({ value:fromBase(x.value,x.from).toString(boundInt(x.to,2,36)) }),
(r,x) => ({ verified:fromBase(r.value,x.to)===fromBase(x.value,x.from) }))
add('Build Clear Integrate Verify', 'Arithmetic Trace Verifier', { a:1,b:1 },
x => ({ build:num(x.a)+num(x.b), clear:num(x.a)-num(x.b), integrate:num(x.a)*num(x.b), verify:num(x.b)===0?null:num(x.a)/num(x.b) }),
r => ({ finite:Object.values(r).filter(v=>v!==null).every(Number.isFinite), divisionDefined:r.verify!==null }))
add('Contradiction Matrix', 'Conflicting Claim Auditor', { entries:[{claim:'date',value:1841,source:'A'},{claim:'date',value:1842,source:'B'}] },
x => compareEvidence(x.entries), r => ({ contradictions:r.length, claims:r.map(row=>row.claim) }))
add('Decision Scorecard', 'Weight Coverage Auditor', { weights:{repairability:3,cost:1}, options:[{name:'A',scores:{repairability:4,cost:3}}] },
x => list(x.options).map(o=>({name:o.name,score:sortedKeys(x.weights).reduce((sum,k)=>sum+num(x.weights[k])*num(obj(o.scores)[k]),0)})).sort((a,b)=>b.score-a.score),
r => ({ tiedAtTop:r.length>1&&r[0].score===r[1].score, options:r.length }))
add('Threshold Rules', 'Boundary Condition Checker', { value:80, thresholds:[{label:'Pass',minimum:80}] },
x => list(x.thresholds).filter(t=>num(x.value)>=num(t.minimum)).map(t=>t.label),
(r,x) => ({ exactBoundary:list(x.thresholds).filter(t=>num(t.minimum)===num(x.value)).map(t=>t.label), matches:r.length }))
add('Dependency Walk', 'Dependency Cycle and Missing Node Reviewer', { root:'publish', graph:{publish:['test'],test:[]} },
x => {
  const graph=obj(x.graph), seen=new Set(), visiting=new Set(), order=[], cycles=new Set(), absent=new Set()
  if(Object.keys(graph).length>1000) throw new RangeError('Maximum 1,000 nodes')
  function visit(key) {
    if(visiting.has(key)) { cycles.add(key); return }
    if(seen.has(key)) return
    if(!Object.hasOwn(graph,key)) { absent.add(key); return }
    visiting.add(key)
    for(const child of list(graph[key])) visit(string(child))
    visiting.delete(key)
    seen.add(key)
    order.push(key)
  }
  visit(string(x.root))
  return { order, cycles:[...cycles], absent:[...absent] }
}, r=>({ ready:!r.cycles.length&&!r.absent.length, cycles:r.cycles, absent:r.absent }))
add('Units and Ratios', 'Dimension Conversion Checker', { value:25.4, from:'mm', to:'in' }, x => {
  const factors={mm:1,cm:10,m:1000,in:25.4,ft:304.8}
  if(!Object.hasOwn(factors,x.from)||!Object.hasOwn(factors,x.to)) throw new TypeError('Units: mm, cm, m, in, ft')
  return { value:num(x.value)*factors[x.from]/factors[x.to], unit:x.to }
}, r=>({ finite:Number.isFinite(r.value), units:r.unit }))

// 021–030
add('Voice-to-Vault Receipt', 'Verbatim Transcript Auditor', { text:'Exact words.\n' },
async x=>({sha256:await hash(txt(x)),bytes:bytes(txt(x)).length,verbatim_locked:true}),
async (r,x)=>({verified:r.sha256===await hash(txt(x)),bytes:r.bytes}),
'Open the local vault at /vault to record audio, save exact text, and verify stored files.')
add('Verbatim Quote and Manuscript Lock', 'Character Change Examiner', { text:'Yes is Yes', edited:'Yes is Yes' },
async x=>({ same:identical(txt(x),x.edited),sourceHash:await hash(txt(x)),editedHash:await hash(x.edited) }),
(r,x)=>({ verified:r.same===(r.sourceHash===r.editedHash),firstDifference:identical(txt(x),x.edited)?null:lines(txt(x)).findIndex((line,i)=>line!==lines(x.edited)[i])+1||Math.min(lines(txt(x)).length,lines(x.edited).length)+1 }))
add('Media Provenance Manifest', 'Ownership Claim Label Reviewer', { sha256:'a'.repeat(64), creator:'Example creator', source:'creator declaration' },
x=>{
  if(!/^[0-9a-f]{64}$/i.test(string(x.sha256))) throw new TypeError('Expected a SHA-256 hex digest')
  return {sha256:fold(x.sha256), creator:string(x.creator), source:string(x.source), claimType:'self-attested'}
}, r=>({hasAttribution:Boolean(r.creator),hasSource:Boolean(r.source),evidence:r.claimType}))
add('Mosaic Index Entry', 'Index Completeness Reviewer', { title:'Example note', tags:['Build','build','Archive'], date:'2026-11-18' },
x=>({title:string(x.title),tags:unique(list(x.tags).map(tag=>fold(tag).trim()).filter(Boolean)),date:new Date(date(x.date)).toISOString().slice(0,10)}),
r=>({ missing:missing(r,['title','date']),tags:r.tags.length }))
add('File Deduplication', 'Duplicate Digest Reviewer', {files:[{name:'a',digest:'a'.repeat(64)},{name:'b',digest:'a'.repeat(64)}]},
x=>{
  const groups=new Map()
  for(const file of list(x.files)){
    if(!/^[0-9a-f]{64}$/i.test(string(file.digest))) throw new TypeError('Each file needs a SHA-256 digest')
    const key=fold(file.digest), group=groups.get(key)??[]
    group.push(file.name)
    groups.set(key,group)
  }
  return Array.from(groups,([digest,names])=>({digest,names}))
}, r=>({duplicates:r.filter(g=>g.names.length>1)}))
add('Record Change Ledger', 'Changed Field Auditor', { before:{title:'A'}, after:{title:'B',year:2026} },
x=>unique([...sortedKeys(x.before),...sortedKeys(x.after)]).flatMap(key=>{
  const before=Object.hasOwn(x.before,key),after=Object.hasOwn(x.after,key)
  if(before&&after&&JSON.stringify(stable(x.before[key]))===JSON.stringify(stable(x.after[key]))) return []
  return [{key,status:before?after?'changed':'removed':'added'}]
}),r=>({fieldsChanged:r.length,fields:r.map(e=>e.key)}))
add('Archive Timestamp Validator', 'Calendar Boundary Reviewer', {date:'2000-01-02'},
x=>({iso:new Date(date(x.date)).toISOString()}), (r,x)=>({dateRoundTrip:r.iso.slice(0,10)===x.date}))
add('Source Bundle Fingerprint', 'Bundle Reordering Verifier', { record:{title:'A', tags:['source']} },
async x=>({sha256:await hash(JSON.stringify(stable(obj(x.record))))}),
async (r,x)=>({verified:r.sha256===await hash(JSON.stringify(stable(x.record))),fields:sortedKeys(x.record)}))
add('Archive Export Inventory', 'Export Field Coverage Reviewer', {records:[{id:'A',title:'Example',sha256:'a'.repeat(64)}]},
x=>list(x.records).map(record=>({id:record.id??null,missing:missing(record,['id','title','sha256']),digestValid:/^[0-9a-f]{64}$/i.test(string(record.sha256))})),
r=>({incomplete:r.filter(row=>row.missing.length||!row.digestValid)}))
add('Private Field Redactor', 'Redaction Coverage Checker', {record:{title:'A',note:'Example'},fields:['note']},
x=>Object.fromEntries(sortedKeys(x.record).filter(key=>!list(x.fields).includes(key)).map(key=>[key,x.record[key]])),
(r,x)=>({requested:list(x.fields).length,removed:x.fields.filter(key=>Object.hasOwn(x.record,key)&&!Object.hasOwn(r,key))}))

// 031–040
add('Find the Tabor Variant Matcher','Surname Match Reviewer',{name:'Tabour',aliases:['Tabor','Tabour','Tàbor','Tavor']},
x=>({ key:plain(x.name),reverse:rev(txt({text:x.name})),matches:list(x.aliases).filter(a=>plain(a)===plain(x.name)) }),
r=>({candidates:r.matches.length,relationshipEstablished:false}))
add('Reversed Surname Index','Reversal Pair Checker',{names:['TABOR','ROBAT','TABER']},
x=>unique(list(x.names).map(string)).map(name=>({name,reversal:rev(name)})),
(r,x)=>({roundTrip:r.every(e=>rev(e.reversal)===e.name),pairs:r.filter(e=>x.names.includes(e.reversal))}))
add('Source Citation Builder','Source Completeness Reviewer',{title:'Register',institution:'Example archive',locator:'p. 4',url:'https://example.org/register'},
x=>({citation:[x.institution,x.title,x.locator,secureUrl(x.url).href].filter(Boolean).join(', '),source:secureUrl(x.url).href}),
(r,x)=>({missing:missing(x,['institution','title','locator','url']),source:r.source}))
add('Lineage Timeline','Chronology Conflict Reviewer',{events:[{name:'Birth',date:'1901-05-01'},{name:'Record',date:'1932-10-10'}]},
x=>list(x.events).map(e=>({...e,time:date(e.date)})).sort((a,b)=>a.time-b.time),
r=>({ordered:r.every((e,i)=>i===0||r[i-1].time<=e.time),sharedDates:count(r.map(e=>e.date)).filter(e=>e.count>1)}))
add('Ancestral Edge Graph','Circular Lineage Reviewer',{edges:[{parent:'A',child:'B'},{parent:'B',child:'C'}]},
x=>{
  const parents=new Map()
  for(const {parent,child} of list(x.edges)){
    if(typeof parent!=='string'||typeof child!=='string'||!parent||!child) throw new TypeError('Each edge needs parent and child IDs')
    if(!parents.has(parent)) parents.set(parent,new Set())
    if(!parents.has(child)) parents.set(child,new Set())
    parents.get(child).add(parent)
  }
  const checked=new Set(), visiting=new Set(), cycles=new Set()
  function visit(person){
    if(visiting.has(person)){cycles.add(person);return}
    if(checked.has(person))return
    visiting.add(person)
    for(const ancestor of parents.get(person)) visit(ancestor)
    visiting.delete(person)
    checked.add(person)
  }
  for(const person of parents.keys()) visit(person)
  return {lineage:Array.from(parents,([person,values])=>({person,parents:[...values]})),cycles:[...cycles]}
},r=>({people:r.lineage.length,cycleMarkers:r.cycles}))
add('Place Name Variant Matrix','Place Label Reviewer',{places:[{name:'Thabor',region:'Example region'},{name:'Tabor',region:'Another region'}]},
x=>list(x.places).map(p=>({...p,normalized:plain(p.name)})),
r=>({missingRegion:r.filter(p=>!p.region).map(p=>p.name),duplicateKeys:count(r.map(p=>p.normalized)).filter(e=>e.count>1)}))
add('Witness Comparison','Independent Source Reviewer',{entries:[{claim:'birthplace',value:'A',source:'One'},{claim:'birthplace',value:'B',source:'Two'}]},
x=>({sources:unique(list(x.entries).map(e=>string(e.source)).filter(Boolean)),conflicts:compareEvidence(x.entries)}),
(r,x)=>({distinctCitationLabels:r.sources.length,unattributed:list(x.entries).filter(e=>!e.source).length}))
add('Chronological Gap Finder','Gap Threshold Reviewer',{dates:['1841-01-01','1843-02-01'],minimumDays:365},
x=>list(x.dates).map(d=>[date(d),d]).sort((a,b)=>a[0]-b[0]).flatMap(([time,d],i,a)=>{
  if(!i)return []
  const days=(time-a[i-1][0])/86400000
  return days>=positive(x.minimumDays)?[{start:a[i-1][1],end:d,days}]:[]
}),r=>({gaps:r.length,longestDays:Math.max(0,...r.map(e=>e.days))}))
add('Research Question Queue','Unanswered Question Reviewer',{questions:[{question:'Where was the record filed?',status:'open'}]},
x=>list(x.questions).filter(q=>q.status==='open').map(q=>string(q.question).trim()).filter(Boolean),
r=>({remaining:r.length,duplicates:count(r.map(fold)).filter(e=>e.count>1)}))
add('Evidence and Interpretation Ledger','Unsupported Assertion Reviewer',{entries:[{kind:'evidence',text:'Register entry',source:'Archive'},{kind:'interpretation',text:'Possibly the same family'}]},
x=>{
  const groups={evidence:[],interpretation:[],unclassified:[]}
  for(const entry of list(x.entries)) (['evidence','interpretation'].includes(entry.kind)?groups[entry.kind]:groups.unclassified).push(entry)
  return groups
},r=>({uncitedEvidence:r.evidence.filter(e=>!e.source),unclassified:r.unclassified.length}))

// 041–050
add('Library of Tabor Catalog Record','Catalog Metadata Reviewer',{title:'Sample tablet',format:'tablet',language:'und',source:'https://example.org/item'},
x=>({title:string(x.title),format:fold(x.format),language:string(x.language),source:secureUrl(x.source).href}),
r=>({missing:missing(r,['title','format','language','source'])}))
add('Editions and Witnesses','Edition Duplicate Reviewer',{editions:[{work:'W1',edition:'E1',witness:'A'},{work:'W1',edition:'E2',witness:'B'}]},
x=>list(x.editions).map(e=>({work:string(e.work),edition:string(e.edition),witness:string(e.witness)})),
r=>({works:unique(r.map(e=>e.work)),duplicates:count(r.map(e=>JSON.stringify([e.work,e.edition,e.witness]))).filter(e=>e.count>1)}))
add('Rights Statement Organizer','Public Access Rights Reviewer',{items:[{id:'A',rights:'public-domain',reference:'https://example.org/rights'}]},
x=>list(x.items).map(({id,rights,reference})=>({id,rights,reference:reference?secureUrl(reference).href:null,referenceSupplied:['public-domain','open-license'].includes(rights)&&Boolean(reference)})),
r=>({recordsForRightsReview:r.filter(e=>!e.referenceSupplied).map(e=>e.id),verification:'caller-supplied statements'}))
add('Manuscript Section Index','Heading Order Reviewer',{text:'# Book\n## Chapter\nText\n### Entry'},
x=>lines(txt(x)).flatMap((line,i)=>{const m=/^(#{1,6})\s+(.+)$/.exec(line);return m?[{level:m[1].length,title:m[2],line:i+1}]:[]}),
r=>({skippedLevels:r.filter((e,i)=>i>0&&e.level>r[i-1].level+1).map(e=>e.line)}))
add('A–Z Story Outline','Alphabet Entry Coverage Reviewer',{entries:{A:'Ace',B:'Build',Z:'Zero'}},
x=>Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ',letter=>({letter,content:string(obj(x.entries)[letter])})),
r=>({missing:r.filter(e=>!e.content.trim()).map(e=>e.letter)}))
add('Rhyme Family Sorter','Rhyme Key Reviewer',{entries:[{word:'light',key:'aɪt'},{word:'right',key:'aɪt'}]},
x=>{
  const families=new Map()
  for(const e of list(x.entries)){const key=string(e.key),group=families.get(key)??[];group.push(string(e.word));families.set(key,group)}
  return Array.from(families,([key,words])=>({key,words}))
},r=>({singletons:r.filter(e=>e.words.length===1),uncoded:r.find(e=>!e.key)?.words??[]}))
add('Canon Coverage Matrix','Book Mapping Reviewer',{expected:['Genesis','Exodus'], present:['Genesis']},
x=>{const have=new Set(list(x.present).map(fold));return unique(list(x.expected)).map(book=>({book,present:have.has(fold(book))}))},
(r,x)=>({missing:r.filter(b=>!b.present).map(b=>b.book),extra:list(x.present).filter(b=>!r.some(e=>fold(e.book)===fold(b)))}))
add('Safe Print Proof','Print Source Integrity Reviewer',{title:'A story',text:'Yes is Yes.\n\nNo is No.'},
x=>({title:escapeHtml(x.title),paragraphs:txt(x).split(/\n{2,}/).map(p=>`<p>${escapeHtml(p)}</p>`).join('')}),
(r,x)=>({paragraphs:txt(x).split(/\n{2,}/).length,renderedChars:r.paragraphs.length}))
add('Creative Canon Consistency','Canon Contradiction Reviewer',{entries:[{claim:'character name',value:'SANTA SUPMALS',source:'Example entry'}]},
x=>({conflicts:compareEvidence(x.entries),entryCount:list(x.entries).length}),
r=>({resolved:r.conflicts.length===0,reviewedEntries:r.entryCount}))
add('Publishing Record Checklist','Publication Gaps Reviewer',{record:{title:'Example',byline:'Nathan Tabor',version:'1'},required:['title','byline','version','rights']},
x=>({missing:missing(x.record,x.required),entry:stable(x.record)}),
r=>({complete:r.missing.length===0,gaps:r.missing}))

// 051–060
add('Touch Millimeter Normalization','Calibration Reviewer',{pixel:25.4,pixelsPerInch:96},
x=>({millimeters:ratio(x.pixel,x.pixelsPerInch)*25.4}),
(r,x)=>({roundTrip:Math.abs(r.millimeters*positive(x.pixelsPerInch)/25.4-num(x.pixel))<1e-9}))
add('Finger Velocity','Timestamp Order Reviewer',{points:[{x:0,y:0,ms:0},{x:4,y:3,ms:10}]},
x=>list(x.points).slice(1).map((p,i)=>({ms:p.ms,mmPerSecond:1000*distance(p,x.points[i])/positive(num(p.ms)-num(x.points[i].ms))})),
r=>({segments:r.length,peak:Math.max(0,...r.map(p=>p.mmPerSecond))}))
add('One Euro Pointer Filter','Filter Sample Reviewer',{samples:[{t:0,value:0},{t:0.01,value:5},{t:0.02,value:1}],minCutoff:1,beta:0.1,derivativeCutoff:1},
x=>{
  const alpha=(dt,cutoff)=>1/(1+1/(2*Math.PI*dt*cutoff))
  const min=positive(x.minCutoff), beta=num(x.beta), derivative=positive(x.derivativeCutoff)
  if(beta<0)throw new RangeError('Beta must be nonnegative')
  let oldTime,oldRaw,smoothed,delta=0
  return list(x.samples).map(({t,value},i)=>{
    const time=num(t),raw=num(value)
    if(i){
      const dt=positive(time-oldTime)
      delta+=alpha(dt,derivative)*((raw-oldRaw)/dt-delta)
      smoothed+=alpha(dt,min+beta*Math.abs(delta))*(raw-smoothed)
    }else smoothed=raw
    oldTime=time;oldRaw=raw
    return {t:time,value:smoothed}
  })
},(r,x)=>({sampleCountPreserved:r.length===x.samples.length,firstSamplePreserved:r.length===0||r[0].value===num(x.samples[0].value)}))
add('Lift-Off Ring Buffer','Release Window Reviewer',{samples:[1,2,3,4],capacity:3},
x=>list(x.samples).slice(-boundInt(x.capacity,1,256)),
(r,x)=>({retained:r.length,dropped:x.samples.length-r.length}))
add('Safe-Cancel Touch Region','Touch Boundary Reviewer',{x:2,width:100,margin:0.05},
x=>{const width=positive(x.width),p=num(x.x),margin=num(x.margin);if(margin<0||margin>=0.5||p<0||p>width) throw new RangeError('Point or margin outside range');return {cancel:p<=width*margin||p>=width*(1-margin)}},
(r,x)=>({cancel:r.cancel,edgeDistance:Math.min(num(x.x),num(x.width)-num(x.x))}))
add('Virtual Trackball Rotation','Angle Normalization Reviewer',{x:1,y:-1},
x=>({degrees:(Math.atan2(num(x.y),num(x.x))*180/Math.PI+360)%360,magnitude:Math.hypot(num(x.x),num(x.y))}),
r=>({normalized:r.degrees>=0&&r.degrees<360,stationary:r.magnitude===0}))
add('Arc Chassis Trajectory','Arc Sample Reviewer',{speed:8,degrees:45,gravity:9.81,sampleCount:6},
x=>{
  const a=num(x.degrees)*Math.PI/180,v=positive(x.speed),g=positive(x.gravity),n=boundInt(x.sampleCount,2,128)
  if(a<0||a>Math.PI/2)throw new RangeError('Angle must be from 0 through 90 degrees')
  const duration=2*v*Math.sin(a)/g
  return Array.from({length:n},(_,i)=>{const t=duration*i/(n-1);return {t,x:v*Math.cos(a)*t,y:(v*Math.sin(a)-g*t/2)*t}})
},r=>({startsAtGround:r[0].y===0,endsAtGround:Math.abs(r.at(-1).y)<1e-8}))
add('Pendulum Chassis Period','Pendulum Assumption Reviewer',{length:1,gravity:9.81},
x=>({seconds:2*Math.PI*Math.sqrt(positive(x.length)/positive(x.gravity))}),
r=>({model:'small-angle pendulum',valid:r.seconds>0}))
add('Rhythm Chassis Timing','Beat Window Reviewer',{expectedMs:[0,500,1000],actualMs:[12,490,1100],window:50},
x=>list(x.expectedMs).map((beat,i)=>{const actual=list(x.actualMs)[i],delta=actual==null?null:num(actual)-num(beat);return {beat,delta,hit:delta!==null&&Math.abs(delta)<=positive(x.window)}}),
r=>({hits:r.filter(e=>e.hit).length,misses:r.filter(e=>!e.hit).length}))
add('Tournament Seed Sorter','Tournament Tie Reviewer',{players:[{id:'a',rating:1500},{id:'b',rating:1600}]},
x=>list(x.players).map(p=>({id:string(p.id),rating:num(p.rating)})).sort((a,b)=>b.rating-a.rating||a.id.localeCompare(b.id)).map((p,i)=>({...p,seed:i+1})),
r=>({ties:count(r.map(e=>e.rating)).filter(e=>e.count>1),duplicates:count(r.map(e=>e.id)).filter(e=>e.count>1)}))

// 061–070
add('Repairability Scorecard','Repair Score Evidence Reviewer',{criteria:[{name:'parts availability',score:4,max:5,evidence:'Supplier list'}]},
x=>list(x.criteria).map(c=>{const score=pct(c.score,c.max);if(score<0||score>100)throw new RangeError('Score outside range');return {name:c.name,score,evidence:string(c.evidence)}}),
r=>({uncited:r.filter(c=>!c.evidence).map(c=>c.name),average:r.length?r.reduce((n,c)=>n+c.score,0)/r.length:null}))
add('Vintage Appliance Compatibility','Appliance Specification Reviewer',{target:{volts:120,mount:'A'},options:[{name:'Motor',spec:{volts:120,mount:'A'}}]},
x=>list(x.options).map(o=>({name:o.name,differences:sortedKeys(x.target).filter(k=>!Object.is(x.target[k],obj(o.spec)[k]))})),
r=>({specMatches:r.filter(o=>!o.differences.length).map(o=>o.name)}))
add('OBD Trouble Code Classifier','Diagnostic Code Format Reviewer',{codes:['P0300','C0123','bad']},
x=>list(x.codes).map(c=>{
  const code=string(c).trim().toUpperCase(),valid=/^[PCBU][0-3][0-9A-F]{3}$/.test(code)
  return {code,valid,family:valid?{P:'Powertrain',C:'Chassis',B:'Body',U:'Network'}[code[0]]:null}
}),r=>({invalid:r.filter(e=>!e.valid).map(e=>e.code)}))
add('Vehicle Telemetry Summary','Telemetry Outlier Reviewer',{readings:[700,720,690,2000]},
x=>({median:median(x.readings),minimum:Math.min(...x.readings.map(num)),maximum:Math.max(...x.readings.map(num))}),
(r,x)=>({outsideFiftyPercent:list(x.readings).map(num).filter(v=>Math.abs(v-r.median)>Math.abs(r.median)*0.5)}))
add('Maintenance Interval Logger','Maintenance Due Reviewer',{mileage:94000,services:[{name:'Example',lastMileage:90000,everyMiles:4000}]},
x=>list(x.services).map(s=>({name:s.name,dueMileage:num(s.lastMileage)+positive(s.everyMiles),remaining:num(s.lastMileage)+positive(s.everyMiles)-num(x.mileage)})),
r=>({due:r.filter(s=>s.remaining<=0).map(s=>s.name)}))
add('Carpentry Cut List','Kerf and Stock Reviewer',{boardLength:100,kerf:0.3,pieces:[{name:'brace',length:30,quantity:2}]},
x=>{
  const board=positive(x.boardLength),kerf=num(x.kerf),boards=[]
  if(kerf<0)throw new RangeError('Kerf must be nonnegative')
  const demand=list(x.pieces).flatMap(piece=>Array.from({length:boundInt(piece.quantity,1,100)},()=>({name:piece.name,length:positive(piece.length)})))
  if(demand.length>1000)throw new RangeError('Maximum 1,000 cuts')
  for(const piece of demand.sort((a,b)=>b.length-a.length)){
    const consumption=piece.length+kerf
    if(consumption>board)throw new RangeError('Cut plus kerf exceeds stock')
    let stock=boards.find(item=>item.remaining>=consumption)
    if(!stock){stock={remaining:board,cuts:[]};boards.push(stock)}
    stock.remaining-=consumption;stock.cuts.push(piece)
  }
  return {boards,stockLength:board,kerf}
},r=>({stock:r.boards.length,cuts:r.boards.reduce((n,b)=>n+b.cuts.length,0),unused:r.boards.reduce((n,b)=>n+b.remaining,0)}))
add('Modular Furniture Dimensions','Module Clearance Reviewer',{overall:120,bays:3,divider:2},
x=>({bayWidth:(positive(x.overall)-(boundInt(x.bays,1,100)-1)*positive(x.divider))/x.bays}),
r=>({usable:r.bayWidth>0}))
add('Workshop Area Takeoff','Area Coverage Reviewer',{length:8,width:4,wastePercent:10},
x=>{const area=positive(x.length)*positive(x.width),waste=num(x.wastePercent);if(waste<0)throw new RangeError('Waste percent must be nonnegative');return {area,orderArea:area*(1+waste/100)}},
r=>({wasteArea:r.orderArea-r.area}))
add('Parts Inventory Reconciler','Stock Variance Reviewer',{expected:{A:3,B:2},counted:{A:2,C:2}},
x=>unique([...sortedKeys(x.expected),...sortedKeys(x.counted)]).map(part=>({part,delta:num(Object.hasOwn(x.counted,part)?x.counted[part]:0)-num(Object.hasOwn(x.expected,part)?x.expected[part]:0)})),
r=>({short:r.filter(e=>e.delta<0),extra:r.filter(e=>e.delta>0)}))
add('Electronics Power Budget','Power Headroom Reviewer',{capacityWatts:100,loads:[{volts:12,amps:2},{volts:5,amps:1}]},
x=>({watts:list(x.loads).reduce((sum,l)=>sum+positive(l.volts)*positive(l.amps),0),capacity:positive(x.capacityWatts)}),
r=>({remaining:r.capacity-r.watts,overBudget:r.watts>r.capacity}))

// 071–080
add('Incident Root Cause Timeline','Missing Evidence Reviewer',{events:[{at:'2026-11-18T10:00:00Z',label:'Alert',evidence:'Log 1'}]},
x=>list(x.events).map(e=>{const ms=Date.parse(e.at);if(!Number.isFinite(ms))throw new TypeError('Expected a valid timestamp');return {...e,at:new Date(ms).toISOString()}}).sort((a,b)=>a.at.localeCompare(b.at)),
r=>({uncited:r.filter(e=>!e.evidence).map(e=>e.label),events:r.length}))
add('Latency Percentiles','Latency Budget Reviewer',{millis:[5,8,12,108],budget:100},
x=>{const a=list(x.millis).map(num).sort((a,b)=>a-b);if(!a.length)throw new RangeError('Provide sample points');return Object.fromEntries([50,95,99].map(p=>[`p${p}`,a[Math.ceil(p*a.length/100)-1]]))},
(r,x)=>({p95WithinBudget:r.p95<=positive(x.budget),samples:x.millis.length}))
add('Storage Growth Projection','Projection Assumptions Reviewer',{current:100,daily:2,days:30},
x=>({projected:num(x.current)+num(x.daily)*boundInt(x.days,0,36500)}),
(r,x)=>({delta:r.projected-num(x.current),model:'linear'}))
add('Queue Capacity Estimate','Backlog Growth Reviewer',{arrivalsPerMinute:140,handledPerMinute:120,minutes:5},
x=>({backlog:Math.max(0,(num(x.arrivalsPerMinute)-num(x.handledPerMinute))*boundInt(x.minutes,0,100000))}),
r=>({grows:r.backlog>0}))
add('Service Uptime Summary','Missing Observation Reviewer',{checks:[200,200,503,null]},
x=>{const checks=list(x.checks),known=checks.filter(c=>c!==null).map(c=>boundInt(c,100,599)),good=known.filter(c=>c>=200&&c<300).length;return {observations:known.length,missing:checks.length-known.length,successRate:known.length?pct(good,known.length):null}},
r=>({missing:r.missing,fullyObserved:r.missing===0}))
add('Capacity Fit Matrix','Resource Shortfall Reviewer',{available:{ram:8,cpu:4},needed:{ram:12,cpu:2}},
x=>sortedKeys(x.needed).map(key=>({key,remaining:num(Object.hasOwn(obj(x.available),key)?x.available[key]:0)-num(x.needed[key])})),
r=>({shortfalls:r.filter(e=>e.remaining<0)}))
add('Configuration Comparison','Changed Configuration Reviewer',{a:{cache:true,replicas:1},b:{cache:true,replicas:2}},
x=>unique([...sortedKeys(x.a),...sortedKeys(x.b)]).flatMap(key=>Object.is(x.a[key],x.b[key])?[]:[{key,from:x.a[key]??null,to:x.b[key]??null}]),
r=>({changedKeys:r.map(e=>e.key)}))
add('Blueprint Revision Reconciler','Drawing Revision Reviewer',{expected:{frame:'r2',panel:'r1'},actual:{frame:'r1'}},
x=>sortedKeys(x.expected).map(drawing=>({drawing,expected:x.expected[drawing],actual:Object.hasOwn(obj(x.actual),drawing)?x.actual[drawing]:null})),
r=>({mismatches:r.filter(e=>e.expected!==e.actual)}))
add('Measurement Tolerance Matrix','Out-of-Tolerance Reviewer',{measurements:[{name:'part',value:10.3,target:10,tolerance:0.25}]},
x=>list(x.measurements).map(m=>({name:m.name,deviation:num(m.value)-num(m.target),pass:Math.abs(num(m.value)-num(m.target))<=positive(m.tolerance)})),
r=>({failed:r.filter(m=>!m.pass).map(m=>m.name)}))
add('Data Schema Profiler','Schema Drift Reviewer',{records:[{id:1,name:'A'},{id:'2'}]},
x=>{
  const fields=new Map()
  for(const record of list(x.records))for(const key of sortedKeys(record)){
    const observed=fields.get(key)??[]
    observed.push(record[key]===null?'null':Array.isArray(record[key])?'array':typeof record[key])
    fields.set(key,observed)
  }
  return Array.from(fields,([field,types])=>({field,types:unique(types),present:types.length}))
},(r,x)=>({mixed:r.filter(e=>e.types.length>1),missing:r.filter(e=>e.present<x.records.length)}))

// 081–090
add('Release Receipt Builder','Receipt Field Reviewer',{service:'nathan-mind-fleet',version:'v1',commit:'abcdef0',url:'https://example.org/health'},
x=>({service:string(x.service),version:string(x.version),commit:string(x.commit),url:secureUrl(x.url).href}),
r=>({missing:missing(r,['service','version','commit']),commitFormat:/^[0-9a-f]{7,64}$/i.test(r.commit)}))
add('GitHub Change Manifest','Pull Request Scope Reviewer',{files:['src/worker.mjs','test/worker.test.mjs'],prefix:'src/'},
x=>list(x.files).map(path=>({path:string(path),inScope:string(path).startsWith(string(x.prefix))})),
r=>({outside:r.filter(e=>!e.inScope).map(e=>e.path)}))
add('Test Coverage Register','Missing Test Case Reviewer',{expected:['happy','failure','retry'],observed:['happy','retry']},
x=>{const seen=new Set(list(x.observed));return list(x.expected).map(test=>({test,reported:seen.has(test)}))},
r=>({missing:r.filter(e=>!e.reported).map(e=>e.test)}))
add('Queue Retry Calculator','Retry Limit Reviewer',{attempt:3,baseSeconds:2,maxSeconds:300,maxAttempts:5},
x=>{const attempt=boundInt(x.attempt,1,40),max=boundInt(x.maxAttempts,1,40);return {retry:attempt<max,seconds:attempt<max?Math.min(positive(x.maxSeconds),positive(x.baseSeconds)*2**(attempt-1)):null}},
r=>({terminal:!r.retry,delay:r.seconds}))
add('Duplicate Claim Detector','Idempotency Collision Reviewer',{jobs:[{key:'build-1',digest:'one'},{key:'build-1',digest:'two'}]},
x=>compareEvidence(list(x.jobs).map(j=>({claim:j.key,value:j.digest,source:'job'}))),
r=>({collisionKeys:r.map(e=>e.claim)}))
add('Deployment Status Matrix','Unverified Deployment Reviewer',{services:[{name:'Fleet',reported:'deployed',observed:'healthy'}]},
x=>list(x.services).map(s=>({name:s.name,reported:s.reported,observed:s.observed??'unknown'})),
r=>({unverified:r.filter(e=>e.reported==='deployed'&&e.observed!=='healthy').map(e=>e.name)}))
add('Rollback Candidate Selector','Rollback Compatibility Reviewer',{releases:[{id:'v1',schema:1,healthy:true},{id:'v2',schema:2,healthy:false}],currentSchema:1},
x=>list(x.releases).filter(e=>e.healthy===true&&e.schema===x.currentSchema).at(-1)??null,
r=>({candidate:r?.id??null,schema:r?.schema??null}))
add('Service and Binding Index','Unresolved Binding Reviewer',{services:['gateway','archive'],bindings:[{from:'gateway',to:'archive'}]},
x=>{const known=new Set(list(x.services));return list(x.bindings).map(b=>({...b,resolved:known.has(b.from)&&known.has(b.to)}))},
r=>({unresolved:r.filter(e=>!e.resolved)}))
add('Change Window Calculator','Window Overlap Reviewer',{first:{start:60,end:120},second:{start:90,end:150}},
x=>{const interval=slot=>{const start=boundInt(slot.start,0,1440),end=boundInt(slot.end,0,1440);if(start>=end)throw new RangeError('Start must precede end');return [start,end]};const a=interval(x.first),b=interval(x.second);return {overlapMinutes:Math.max(0,Math.min(a[1],b[1])-Math.max(a[0],b[0]))}},
r=>({conflict:r.overlapMinutes>0}))
add('Operations Handoff Checklist','Unowned Work Reviewer',{tasks:[{title:'Verify',owner:'',status:'open'}]},
x=>list(x.tasks).map(t=>({title:string(t.title),owner:string(t.owner),status:string(t.status)})),
r=>({needsOwner:r.filter(t=>!t.owner&&t.status!=='done').map(t=>t.title)}))

// 091–100
add('Consent Scope Matrix','Consent Expiry Reviewer',{grants:[{action:'export',until:'2026-12-31'}],action:'export',on:'2026-11-18'},
x=>({granted:list(x.grants).some(g=>g.action===x.action&&date(g.until)>=date(x.on))}),
(r,x)=>({matchingExpired:list(x.grants).filter(g=>g.action===x.action&&date(g.until)<date(x.on)).length,granted:r.granted}))
add('Least Privilege Grant Comparison','Excess Permission Reviewer',{needed:['read'],granted:['read','write']},
x=>{const needed=new Set(list(x.needed)),granted=new Set(list(x.granted));return {excess:[...granted].filter(p=>!needed.has(p)),missing:[...needed].filter(p=>!granted.has(p))}},
r=>({scopeFits:!r.excess.length&&!r.missing.length}))
add('Data Retention Calendar','Retention Deadline Reviewer',{records:[{id:'A',created:'2026-01-01'}],days:30,asOf:'2026-11-18'},
x=>list(x.records).map(r=>{const expiry=date(r.created)+boundInt(x.days,0,36500)*86400000;return {id:r.id,expires:new Date(expiry).toISOString().slice(0,10),expired:expiry<=date(x.asOf)}}),
r=>({expired:r.filter(e=>e.expired).map(e=>e.id)}))
add('Backup Restore Fingerprint','Restored Byte Reviewer',{original:'original',restored:'original'},
async x=>({original:await hash(x.original),restored:await hash(x.restored)}),
r=>({matches:r.original===r.restored}))
add('Verification Gate Checklist','Gate Evidence Coverage Reviewer',{checks:[{key:'sha256',passed:true,evidence:'digest record'}]},
x=>{const checks=list(x.checks);return {pass:checks.length>0&&checks.every(c=>c.passed===true&&Boolean(c.evidence)),failed:checks.filter(c=>c.passed!==true||!c.evidence).map(c=>c.key)}},
r=>({gate:r.pass?'pass':'review',failed:r.failed}))
add('Public and Private Field Policy','Publication Field Reviewer',{record:{title:'A',privateNote:'example'},publicFields:['title']},
x=>Object.fromEntries(sortedKeys(x.record).filter(key=>list(x.publicFields).includes(key)).map(key=>[key,x.record[key]])),
(r,x)=>({removed:sortedKeys(x.record).filter(key=>!Object.hasOwn(r,key))}))
add('Audit Sequence Checker','Audit Gap Reviewer',{events:[{seq:1,id:'A'},{seq:3,id:'B'}]},
x=>list(x.events).map(e=>({seq:boundInt(e.seq,1,1e12),id:string(e.id)})).sort((a,b)=>a.seq-b.seq),
r=>({duplicates:count(r.map(e=>e.seq)).filter(e=>e.count>1),gaps:r.slice(1).flatMap((e,i)=>e.seq-r[i].seq>1?[{from:r[i].seq+1,to:e.seq-1}]:[])}))
add('Record Ownership Metadata Check','Attribution Gaps Reviewer',{record:{creator:'Example',license:'CC BY',source:'https://example.org/item'}},
x=>({metadata:{creator:string(x.record.creator),license:string(x.record.license),source:x.record.source?secureUrl(x.record.source).href:''}}),
r=>({missing:missing(r.metadata,['creator','license','source']),claimType:'attribution metadata'}))
add('Sovereign Replica Receipt','Replica Digest Agreement Reviewer',{copies:[{site:'local',sha256:'a'.repeat(64)},{site:'remote',sha256:'a'.repeat(64)}]},
x=>list(x.copies).map(c=>({site:string(c.site),digest:fold(c.sha256),valid:/^[0-9a-f]{64}$/i.test(string(c.sha256))})),
r=>({agrees:r.length>1&&r.every(e=>e.valid)&&unique(r.map(e=>e.digest)).length===1,sites:unique(r.map(e=>e.site))}))
add('Yes Is Yes Decision Record','Decision Evidence Reviewer',{question:'Ready?',answer:'yes',reason:'All supplied checks passed'},
x=>{const answer=fold(x.answer);if(!['yes','no'].includes(answer))throw new TypeError('Answer must be yes or no');return {question:string(x.question),answer,reason:string(x.reason)}},
r=>({complete:Boolean(r.question&&r.reason),answer:r.answer}))

// 101
add('Fleet Roster and Job Plan','Fleet Queue Supervisor',{
  jobs:[{worker:'NTW-014',input:{value:'144',from:10,to:12}},{worker:'NTW-021',input:{text:'Exact words.'}}]
}, x=>({ jobs:list(x.jobs).slice(0,100).map((job,i)=>{
  const id=string(job.worker).toUpperCase()
  return {id,position:i+1,ready:/^NTW-\d{3}$/.test(id)&&Number(id.slice(4))>=1&&Number(id.slice(4))<=100&&Boolean(job.input&&typeof job.input==='object'&&!Array.isArray(job.input))}
}), exceeded:x.jobs.length>100 }),
r=>({ ready:r.jobs.filter(j=>j.ready).length, invalid:r.jobs.filter(j=>!j.ready).map(j=>j.position), exceeded:r.exceeded }),
'Validates an ordered job plan. Individual jobs are invoked through their assigned worker or bot endpoint.')

export const roster = items.map(({name,bot,input,needs},i)=>{
  const n=i+1
  return { n, worker:formatId('NTW',n), bot:formatId('NTB',n), name, botName:bot, domain:domains[Math.floor(i/10)], input, ...(needs?{notes:needs}:{}) }
})
