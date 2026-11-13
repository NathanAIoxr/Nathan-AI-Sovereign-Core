/* Optional additive browser game interoperability contract. Does not patch other games. */
export const EVENT_NAME='nathan:arcade:score';
export const BRIDGE_SCHEMA='nathan-arcade-score.v1';
const STORAGE_KEY='nathan-political-carnival-scores-v1';
export function toScoreMessage(round) {
  if(!round||round.schema!=='nathan-carnival-round.v1'||!Number.isInteger(round.points)||round.points<0||round.points>100)
    throw Error('Invalid round receipt');
  return {schema:BRIDGE_SCHEMA,source:'nathan-political-carnival',gameId:round.gameId,points:round.points,tickets:round.tickets};
}
export function publishScore(round,target) {
  const receipt=toScoreMessage(round);
  if(target && typeof target.dispatchEvent==='function'&&typeof CustomEvent==='function')
    target.dispatchEvent(new CustomEvent(EVENT_NAME,{detail:receipt}));
  return receipt;
}
export function readScores(storage) {
  if(!storage)return [];
  try {
    const v=JSON.parse(storage.getItem(STORAGE_KEY)||'[]');
    if(!Array.isArray(v))return [];
    return v.filter(s=>s&&s.schema===BRIDGE_SCHEMA&&typeof s.gameId==='string'&&Number.isInteger(s.points)&&s.points>=0&&s.points<=100).slice(-50);
  } catch {return [];}
}
export function saveScore(round,storage) {
  const receipt=toScoreMessage(round);
  if(!storage)return receipt;
  try{storage.setItem(STORAGE_KEY,JSON.stringify([...readScores(storage),receipt].slice(-50)));}catch{/* storage blocked: gameplay remains available */}
  return receipt;
}
