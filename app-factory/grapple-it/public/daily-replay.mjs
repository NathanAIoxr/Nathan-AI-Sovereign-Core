import {dailyCourse,freshLine,advanceLine,castLine,doAction,medal} from './campaign.mjs';
import {PHYSICS_HZ,STEP} from './fixed-clock.mjs';

export const MAX_TICKS = PHYSICS_HZ * 120;
export const MAX_INPUTS = 192;
export const utcDate = (date = new Date()) => date.toISOString().slice(0, 10);
export const MEDALS = ['Bronze', 'Silver', 'Gold'];

export function lineInput(state, action) {
  switch (action) {
    case 'cast': return state.phase === 'action' ? doAction(state) : castLine(state);
    case 'reel':
    case 'ease':
      if (state.phase === 'reel') state.hold = action === 'reel';
  }
}

export function checkDailyReplay(day, moves) {
  if (!Array.isArray(moves) || !moves.length || moves.length > MAX_INPUTS) return null;
  const state = freshLine(dailyCourse(day));
  let tick = 0;
  for (const move of moves) {
    if (!Array.isArray(move) || move.length !== 2) return null;
    const [target, action] = move;
    if (!Number.isSafeInteger(target) || target < tick || target > MAX_TICKS || !['cast', 'reel', 'ease'].includes(action)) return null;
    while (tick < target && state.phase !== 'won') {
      advanceLine(state, STEP);
      tick++;
    }
    if (state.phase === 'won') return null;
    if (action === 'cast' ? !['aim', 'action'].includes(state.phase) :
      state.phase !== 'reel' || state.hold === (action === 'reel')) return null;
    lineInput(state, action);
  }
  while (state.phase === 'reel' && state.hold && tick < MAX_TICKS) {
    advanceLine(state, STEP);
    tick++;
  }
  return state.phase === 'won' ? {grade: MEDALS.indexOf(medal(state)) + 1, ticks:tick} : null;
}
