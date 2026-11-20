const KEY='tweezer-os:incident-ledger:v1';
export function saveIncident(incident,storage=globalThis.localStorage){if(!incident||typeof incident.mission!=='string')throw Error('invalid incident');const records=JSON.parse(storage.getItem(KEY)||'[]');records.push({mission:incident.mission,score:Number(incident.score)||0,outcome:String(incident.outcome||'stopped'),createdAt:new Date().toISOString()});storage.setItem(KEY,JSON.stringify(records.slice(-100)));return records.length;}
export function readIncidents(storage=globalThis.localStorage){return JSON.parse(storage.getItem(KEY)||'[]');}
export function clearIncidents(storage=globalThis.localStorage){storage.removeItem(KEY);}
