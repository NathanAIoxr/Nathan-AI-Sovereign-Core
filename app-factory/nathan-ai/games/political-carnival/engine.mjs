/* Nathan Tabor political carnival: public demo mechanics, no proprietary SDK internals. */
export const ORIGINAL_TITLES = Object.freeze([
  'Pin the Donkey on the Tail',
  'Pin the Tail on the ASS'
]);
export const GAMES = Object.freeze([
  {id:'pin_donkey_on_tail',title:ORIGINAL_TITLES[0],stage:'browser-demo',prompt:'PIN THE DONKEY ON THE TAIL',marker:'🫏'},
  {id:'pin_tail_on_ass',title:ORIGINAL_TITLES[1],stage:'browser-demo',prompt:'PIN THE TAIL ON THE ASS',marker:'🎀'},
  {id:'dunking_booth',title:'Dunking Booth',stage:'planned'},
  {id:'pie_in_the_face',title:'Slam a Pie in Their Faces',stage:'planned'},
  {id:'apple_bobbing',title:'Apple Bobbing Wash Tub',stage:'planned'}
]);
/* Demonstration samples, not a current government directory or the full 596-seat roster. */
export const DEMO_ROSTER = Object.freeze([
  {id:'trump',name:'Donald Trump',office:'President',state:'US',source:'user-supplied example'},
  {id:'vance',name:'JD Vance',office:'Vice President',state:'US',source:'user-supplied example'},
  {id:'senate-demo',name:'Senator — demo slot',office:'Senate',state:'',source:'placeholder'},
  {id:'house-demo',name:'Representative — demo slot',office:'House',state:'',source:'placeholder'},
  {id:'court-demo',name:'Justice — demo slot',office:'Supreme Court',state:'',source:'placeholder'},
  {id:'governor-demo',name:'Governor — demo slot',office:'Governor',state:'',source:'placeholder'}
]);
export function clamp01(n) { return Math.min(1,Math.max(0,Number.isFinite(Number(n))?Number(n):0)); }
export function scorePlacement({x,y,targetX,targetY}) {
  const dx=clamp01(x)-clamp01(targetX),dy=clamp01(y)-clamp01(targetY);
  const distance=Math.hypot(dx,dy)/Math.SQRT2;
  const points=Math.max(0,Math.min(100,Math.round(100*(1-distance))));
  return {points,tickets:Math.max(1,Math.ceil(points/20)),distance:Number(distance.toFixed(4))};
}
export function makeRound({gameId,characterId,x,y,targetX,targetY}) {
  if(!GAMES.some(g=>g.id===gameId && g.stage==='browser-demo')) throw Error('Game is not playable.');
  if(typeof characterId!=='string'||characterId.length>80)throw Error('Invalid character.');
  const score=scorePlacement({x,y,targetX,targetY});
  return {schema:'nathan-carnival-round.v1',gameId,characterId,points:score.points,tickets:score.tickets};
}
export function normalizeRoster(input) {
  const rows=Array.isArray(input)?input:input?.characters;
  if(!Array.isArray(rows)||rows.length>700)throw Error('Roster must contain up to 700 characters.');
  const seen=new Set();
  return rows.map((row,i)=>{
    const id=String(row?.id||'').trim(),name=String(row?.name||'').trim();
    const office=String(row?.office||'').trim(),state=String(row?.state||'').trim();
    if(!/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(id)||!name||name.length>120||office.length>70||state.length>40||seen.has(id))
      throw Error('Invalid or repeated character at row '+(i+1));
    seen.add(id);return {id,name,office,state,source:'owner-imported'};
  });
}
