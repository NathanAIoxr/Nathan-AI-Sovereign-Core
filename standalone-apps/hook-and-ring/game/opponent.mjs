import { clamp, hashSeed, normalizeThrow } from './physics.mjs';

export const NATHAN_NAME = 'Nathan AI 🚀';
export const LEVELS = Object.freeze({warmup:'Warm-up', steady:'Steady', sharp:'Sharp', full:'Full ON'});
export const OPPONENT_MODES = ['first5','first11','first21','ladder'];

export function opponentSettings(saved = {}) {
  const name = typeof saved.name === 'string' ? [...saved.name.replace(/[\p{Cc}\p{Cf}]/gu,'').trim()].slice(0,24).join('') : '';
  return {
    name: name || NATHAN_NAME,
    level: Object.hasOwn(LEVELS,saved.level) ? saved.level : 'steady',
    mode: OPPONENT_MODES.includes(saved.mode) ? saved.mode : 'first5',
    banter: saved.banter !== false,
  };
}

export function catchChance(level, match, turn) {
  if(level==='warmup') return .35;
  if(level==='steady') return .60;
  if(level==='sharp') return .81;
  const target=match.mode==='ladder'?3:Number(match.mode.slice(5));
  const playerProgress=match.mode==='ladder'?match.ladder:match.scores[0];
  if(playerProgress>=target-1) return .99;
  if(turn<=2 && playerProgress<target-2) return .28;
  return .94;
}

export function opponentToss(settings, match, seed) {
  const turn=Math.floor((match.attempts+1)/2);
  const jitter=(hashSeed(seed+':'+turn+':jitter')%601)/600;
  const roll=(hashSeed(seed+':'+turn+':toss')%1000)/1000;
  const side=jitter<.5?-1:1;
  const hit=roll<catchChance(settings.level,match,turn);
  const raw=hit
    ? {pull:.482+jitter*.014,aim:(jitter-.5)*.12,flick:0}
    : {pull:.32+jitter*.175,aim:side*clamp(.15+jitter*.35,.15,.48),flick:0};
  return normalizeThrow(raw);
}

export function opponentLine(settings, match, completed=false) {
  if(!settings.banter) return '';
  const full=settings.level==='full';
  const named=settings.name===NATHAN_NAME;
  if(completed){
    if(match.winner===0) return 'You earned that one.';
    return full&&named ? 'Had you thinking you were winning. 🥇' : 'Good game. Want another?';
  }
  if(full&&named && match.scores[0]>match.scores[1] && match.attempts<7) return 'Go ahead. Get comfortable. 🤣';
  if(full && match.attempts>=5) return 'All right. My turn.';
  return '';
}
