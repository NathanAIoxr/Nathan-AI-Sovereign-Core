import { advanceShot, createShot, normalizeThrow, STEP, TRICKS, trickResult } from './physics.mjs';

const KEY = 'hook-ring-toss-lab-v1';
const CAP = 40;
const bounded = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const sources = ['controls','glass','toe','tracker-ball','wrist-flip','air-motion','import'];
const modes = ['practice','first5','first11','first21','ladder','streak','trick','breeze','daily','lab'];
const vector = (value) => value && bounded(value.x,-100,100) && bounded(value.y,-100,100)
  ? {x:value.x,y:value.y} : undefined;
const cleanGesture = value => {
  if (!value || !Number.isInteger(value.contacts) || !bounded(value.contacts,0,10)) return undefined;
  return {contacts:value.contacts, guard:bounded(value.guard,0,45)?value.guard:null, velocity:vector(value.velocity),
    twist:bounded(value.twist,-Math.PI,Math.PI)?value.twist:undefined};
};

export function traceToss(raw, wind, trick) {
  const state = createShot(raw,wind);
  const points = [{...state.p,t:0}];
  const stride = Math.round(1/(STEP*30));
  for (let step=1; !state.result; step++) {
    advanceShot(state);
    if (step%stride===0 || state.result) points.push({...state.p,t:state.time});
  }
  return {points,result:trick===undefined?state.result:trickResult(state.result,trick)};
}

export function validateToss(value) {
  const raw=value?.throw;
  if (!raw || !bounded(raw.pull,0,1) || !bounded(raw.aim,-1,1) || !bounded(raw.flick,-1,1) ||
    !bounded(value.wind,-1,1) || value.trick!==undefined && (!Number.isInteger(value.trick) || !bounded(value.trick,0,TRICKS.length-1))) return null;
  return {
    throw:normalizeThrow(raw),wind:value.wind,trick:value.trick,
    at:bounded(value.at,0,8.64e15)?value.at:0,
    mode:modes.includes(value.mode)?value.mode:'lab',
    source:sources.includes(value.source)?value.source:'import',
    gesture:cleanGesture(value.gesture),
  };
}

export function readTosses(storage) {
  try {
    const saved=JSON.parse(storage.getItem(KEY));
    if (!Array.isArray(saved)) return [];
    return saved.slice(0,CAP).map(validateToss).filter(Boolean);
  } catch { return []; }
}

export function saveToss(storage,toss) {
  const record=validateToss({...toss,at:toss.at??Date.now()});
  if (!record) return null;
  try { storage.setItem(KEY,JSON.stringify([record,...readTosses(storage)].slice(0,CAP))); } catch {}
  return record;
}

export function importTosses(payload) {
  const isLab = payload?.format==='hook-ring-toss-lab-v1' && Array.isArray(payload.tosses) &&
    payload.tosses.length>0 && payload.tosses.length<=CAP;
  const isLegacy = payload?.cartridge==='TACTILECORE-C01-HOOK-RING' && payload.version===1;
  if (!isLab && !isLegacy) throw Error('Choose a Hook and Ring replay or Toss Lab file.');
  const records=(isLab?payload.tosses:[payload]).map(value=>validateToss({...value,source:'import'}));
  if (records.some(record=>record===null)) throw Error('The file contains a toss with invalid physics inputs.');
  return records;
}

export const drills = [
  {name:'Find the release',wind:0,start:{pull:.41,aim:0,flick:0},goal:'Land a clean catch.',target:{pull:.49,aim:0,flick:0},check:r=>r.outcome==='catch'},
  {name:'Soft touch',wind:0,start:{pull:.52,aim:0,flick:0},goal:'Catch below 0.30 m/s.',target:{pull:.48,aim:0,flick:0},check:r=>r.outcome==='catch'&&r.speed<300},
  {name:'Clear the rim',wind:0,start:{pull:.49,aim:.24,flick:0},goal:'Catch within 20 mm of center.',target:{pull:.49,aim:0,flick:0},check:r=>r.outcome==='catch'&&Math.abs(r.lateral)<=20},
  {name:'Crosswind right',wind:.42,start:{pull:.49,aim:0,flick:0},goal:'Catch within 20 mm in a rightward breeze.',target:{pull:.50,aim:-.31,flick:0},check:r=>r.outcome==='catch'&&Math.abs(r.lateral)<=20},
  {name:'Crosswind left',wind:-.42,start:{pull:.49,aim:0,flick:0},goal:'Catch within 20 mm in a leftward breeze.',target:{pull:.50,aim:.31,flick:0},check:r=>r.outcome==='catch'&&Math.abs(r.lateral)<=20},
];
