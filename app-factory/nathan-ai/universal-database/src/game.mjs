export function start() {
  return { code: 'D0', sector: 0, moves: 0, collected: [], won: false, event: null };
}

export function move(board, state, direction) {
  if (state.won) return state;
  const dimension = board.dimensions.find(row => row.code === state.code);
  let { code, sector } = state;
  let event = null;
  if (direction === 'cw' || direction === 'ccw') {
    const delta = direction === 'cw' ? 1 : -1;
    sector = (sector + board.sectors + delta * dimension.angular_step) % board.sectors;
  } else {
    const link = board.links.find(row => row.source === code && row.direction === direction);
    if (!link) throw new RangeError('Unknown movement direction');
    code = link.destination;
    event = link.event;
    if (event === 'FIRMAMENT_FLIP') sector = (board.sectors - sector) % board.sectors;
  }
  const key = code + '/' + sector;
  const beacon = board.beacons.find(row => row.code === code && row.sector === sector);
  const collected = beacon && !state.collected.includes(key) ? [...state.collected, key] : state.collected;
  const won = code === 'D0' && sector === 0 && collected.length === board.beacons.length;
  return { code, sector, moves: state.moves + 1, collected, won, event };
}
