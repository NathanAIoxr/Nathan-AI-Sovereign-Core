export const modes = {0:'clearing/reset', 1:'anchor/origin', 2:'generative build'};
export const seed = {
  id:'', title:'1+1=2', result:'One unit and one unit make two.',
  attributes:'Quantity. Each input is one unit.',
  characteristics:'Counting starts from the end result and can return to the original units.',
  functionalities:'Combine two single units. Remove one from one to return to zero.',
  steps:['Start with two units.', 'Separate them into one unit and one unit.', 'Trace each unit to the original count.'],
  origin:'1+1=2 (build) and 1-1=0 (clear)', domain:'Physical', kind:'Lesson',
  source:'Nathan Tabor’s supplied Tabor Academy specification', locator:'Logic & Verification',
  sourceType:'Primary historical record', sourceUrl:'', lcc:'', dewey:'', strong:'',
  phonetic:'', rootMeaning:'', transcript:'', corrections:'', audioId:'', mode:1,
  role:'Facilitator', protect:null, replicate:null, manipulation:false, ambiguity:false, hiddenControl:false,
  test:'addition', input:'1,1', expected:'2', storyteller:''
};
const limits = {title:180,result:1600,attributes:3500,characteristics:3500,functionalities:3500,origin:3500,
  source:600,locator:500,sourceUrl:1000,lcc:80,dewey:80,strong:80,phonetic:1500,rootMeaning:2500,
  transcript:24000,corrections:12000,input:1200,expected:1200,storyteller:6000};
const choices = {domain:['Physical','Spiritual','Both'],kind:['Lesson','Tool','Simulation','Insight','Blueprint','Historical record'],
  role:['Facilitator','Storyteller'],sourceType:['Primary historical record','Strong’s Concordance','Original manuscript','Other source'],
  test:['manual','addition','subtraction','reversal','exact']};
export function normalize(input) {
  const result = {};
  for (const [key, limit] of Object.entries(limits)) {
    result[key] = typeof input[key] === 'string' ? input[key].slice(0,limit) : '';
  }
  if (result.sourceUrl && !/^https?:\/\//i.test(result.sourceUrl)) result.sourceUrl = '';
  for (const [key, values] of Object.entries(choices)) result[key] = values.includes(input[key]) ? input[key] : values[0];
  result.steps = Array.isArray(input.steps) ? input.steps.filter(x=>typeof x==='string'&&x.trim()).slice(0,30).map(x=>x.slice(0,500)) : [];
  result.mode = [0,1,2].includes(input.mode) ? input.mode : 1;
  result.audioId = /^[a-f0-9-]{36}$/.test(input.audioId || '') ? input.audioId : '';
  for (const key of ['protect','replicate']) result[key] = [0,1].includes(input[key]) ? input[key] : null;
  for (const key of ['manipulation','ambiguity','hiddenControl']) result[key] = input[key] === true;
  return result;
}
export function runTest(test,input) {
  if (test==='exact') return input;
  if (test==='reversal') return [...input].reverse().join('');
  if (!['addition','subtraction'].includes(test)) return null;
  const parts = input.split(',').map(x=>x.trim());
  if(parts.length!==2 || parts.some(x=>!/^[-+]?\d+$/.test(x))) return null;
  const [a,b] = parts.map(BigInt);
  return String(test==='addition' ? a+b : a-b);
}
export function verification(entry) {
  const observed = runTest(entry.test,entry.input);
  const actual = entry.test==='manual' ? entry.replicate : (observed===null || !entry.expected.length ? null : Number(observed===entry.expected));
  const reasons = [];
  if(entry.protect!==1) reasons.push('Protect innocence must equal 1.');
  if(actual!==1) reasons.push('Replicable must equal 1.');
  if(entry.manipulation) reasons.push('Manipulation');
  if(entry.ambiguity) reasons.push('Ambiguity');
  if(entry.hiddenControl) reasons.push('Hidden control');
  if(!entry.result.trim() || !entry.origin.trim() || !entry.functionalities.trim() || !entry.source.trim() || !entry.locator.trim()) {
    reasons.push('Provide the result, origin, functionality, and source locator.');
  }
  return {observed,replicable:actual,retained:reasons.length===0,reasons};
}
export const words = (text) => [...new Set(text.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu) || [])].slice(0,400);
export const indexCatalog = (entry) => [entry.title,entry.kind,entry.domain,entry.lcc,entry.dewey,modes[entry.mode],entry.attributes,entry.characteristics,entry.functionalities,entry.transcript].join(' ');
function annotations(text) {
  return new Map(text.split('\n').flatMap(line => {
    const match = line.match(/^([^—:]+)[—:]\s*(.+)$/);
    return match ? [[match[1].trim().toLocaleLowerCase(),match[2].trim()]] : [];
  }));
}
export function wordIndex(entry) {
  const sound=annotations(entry.phonetic);
  const roots=annotations(entry.rootMeaning);
  return words(entry.transcript).map(word=>{
    const key=word.toLocaleLowerCase();
    return {word,phonetic:sound.get(key)||'',root:roots.get(key)||''};
  });
}
export const indexPhonetics = (entry) => JSON.stringify({words:wordIndex(entry),strong:entry.strong});
export const indexEvidence = (entry) => JSON.stringify({type:entry.sourceType, source:entry.source, locator:entry.locator, url:entry.sourceUrl});
export const semanticText = (entry) => [entry.title,entry.result,entry.attributes,entry.characteristics,entry.functionalities,entry.rootMeaning].join('\n').slice(0,5000);
