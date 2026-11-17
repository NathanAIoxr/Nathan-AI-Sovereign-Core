export const missions = [
  {id:'iron-gate', region:'North America', place:'Appalachian ridgeline', title:'The Iron Gate', color:'#bf6e56', ward:0, limit:12,
    map:['##.###','@G.S.X','##.#.#','######'],
    briefing:'A shutter has locked the ridge road. Clear the iron gate and walk the first Spark to the sanctuary.',
    clue:'Stand beside the gate before you release the pack.'},
  {id:'flooded-steps', region:'South America', place:'Andean terraces', title:'The Flooded Steps', color:'#76a098', ward:1, limit:16,
    map:['######','@.S..#','##~#.#','#.S.GX','######'],
    briefing:'The lower terrace is flooding. There are two Sparks and one dry route to the valley bell.',
    clue:'A ward stabilizes one crossing for the entire attempt. Use it on the amber hazard when you stand beside it.'},
  {id:'bells', region:'Europe', place:'North Atlantic coast', title:'The Bells Below', color:'#8c9db4', ward:1, limit:20,
    map:['#..S##','@G##.X','#...G#','#.#S##','######'],
    briefing:'Two coastal bells have lost contact. Find both Sparks before you cross the second iron gate.',
    clue:'Look for a stair above the entrance gate. Each gate needs its own release.'},
  {id:'lantern', region:'Africa', place:'Saharan salt routes', title:'The Lantern Road', color:'#c2a475', ward:1, limit:18,
    map:['######','@.~~S#','#.G#.X','#S...#','######'],
    briefing:'A false road cuts across the salt. Take the Hounds below the unstable ground and bring both Sparks through.',
    clue:'Two hazards lie side by side. Only one ward is available, so consider the lower road.'},
  {id:'rain-lock', region:'Asia', place:'Pacific rain coast', title:'The Rain Lock', color:'#a79ebf', ward:2, limit:21,
    map:['#S~..#','@G#.G#','#.#~.X','#S...#','######'],
    briefing:'A rain lock is taking on water. Carry the upper and lower Sparks out before the last bell.',
    clue:'The upper Spark sits behind a crossing. The lower road can take you around the second hazard.'},
  {id:'reef', region:'Oceania', place:'Southern Pacific islands', title:'The Reef of Glass', color:'#729ca3', ward:2, limit:24,
    map:['#S~#S#','@G.#.#','#.~G~X','#S...#','######'],
    briefing:'Three Sparks are scattered across glassy causeways. Carry every one to high ground before the reef disappears.',
    clue:'Plan the return from the upper-right Spark before crossing the middle of the reef.'},
  {id:'white-gate', region:'Antarctica', place:'Southern ice shelf', title:'The White Gate', color:'#adb9ce', ward:2, limit:26,
    map:['#S~.S#','@G#~.#','#..G~X','#S#..#','######'],
    briefing:'The final sanctuary is across an ice shelf. Guide all three Sparks through and close the circuit.',
    clue:'Bring the lower Spark back early. Then look for a single ward that helps you cross in both directions.'}
];

for (const mission of missions) {
  mission.width = mission.map[0].length;
  mission.cells = mission.map.join('');
  mission.sparkCount = [...mission.cells].filter(tile => tile === 'S').length;
}

export const tiles = {'.':'Path','#':'Wall','G':'Iron gate','~':'Hazard','S':'Gold Spark','X':'Sanctuary','@':'Entry'};
export const actions = ['move','release','ward'];

export function fresh(mission) {
  return {position:mission.cells.indexOf('@'), steps:0, sparks:[], cleared:[], warded:[], outcome:'playing', dispatch:null, message:mission.briefing};
}

export function adjacent(mission, a, b) {
  if (!Number.isInteger(b) || b < 0 || b >= mission.cells.length) return false;
  return Math.abs(a % mission.width - b % mission.width) +
    Math.abs(Math.floor(a / mission.width) - Math.floor(b / mission.width)) === 1;
}

export function tileAt(mission, state, index) {
  if (state.cleared.includes(index) || state.warded.includes(index) || state.sparks.includes(index)) return '.';
  return mission.cells[index];
}

export function act(mission, state, mode, target) {
  if (state.outcome !== 'playing' || !actions.includes(mode)) return state;
  const reject = message => ({...state, message, dispatch:null});
  if (!adjacent(mission,state.position,target)) return reject('Choose a square directly beside your position.');
  const tile = tileAt(mission,state,target);
  let next = {...state, steps:state.steps+1, dispatch:null};
  if (mode === 'release') {
    if (tile !== 'G') return reject('Choose an adjacent iron gate to release the Hounds.');
    next.cleared = [...state.cleared,target];
    next.dispatch = {from:state.position,to:target};
    next.message = 'HOUNDS RELEASED. The iron gate is clear.';
  } else if (mode === 'ward') {
    if (tile !== '~') return reject('Choose an adjacent hazard to place a ward.');
    if (state.warded.length >= mission.ward) return reject('Every ward for this attempt is already in use.');
    next.warded = [...state.warded,target];
    next.message = 'Crossing stabilized. You can use it for the rest of this attempt.';
  } else {
    if (tile === '#') return reject('The wall is solid. Find another path.');
    if (tile === 'G') return reject('An iron gate blocks the way. Select Release, then choose the gate.');
    if (tile === '~') {
      return {...next, outcome:'lost', message:'Unstable ground. No Sparks were banked. Clear the attempt to try again.'};
    }
    next.position = target;
    next.message = 'Move recorded.';
    if (tile === 'S') {
      next.sparks = [...state.sparks,target];
      next.message = 'Spark secured. ' + next.sparks.length + ' of ' + mission.sparkCount + ' ready for the sanctuary.';
    }
    if (tile === 'X') {
      if (next.sparks.length === mission.sparkCount) {
        return {...next, outcome:'won', message:'INNOCENCE PROTECTED. Every Spark reached sanctuary safely.'};
      }
      next.message = 'The sanctuary is open. Keep going until every Spark is safe.';
    }
  }
  if (next.steps >= mission.limit) {
    next.outcome = 'lost';
    next.message = 'The last bell rang. Clear the attempt to try a shorter route.';
  }
  return next;
}
