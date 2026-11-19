export const winningLine = board => [
  [0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6],
].find(line => board[line[0]] && line.every(i => board[i] === board[line[0]]));

export function sow(pits, player, index) {
  const store = player ? 9 : 4;
  if (!Number.isInteger(index) || index < store - 4 || index >= store || !pits[index]) return null;
  const next = pits.slice();
  let seeds = next[index], i = index;
  next[i] = 0;
  while (seeds) {
    i = (i + 1) % 10;
    if (i === 9 - store + 4) continue;
    next[i]++;
    seeds--;
  }
  const opposite = 8 - i;
  if (i >= store - 4 && i < store && next[i] === 1 && next[opposite]) {
    next[store] += next[opposite] + 1;
    next[opposite] = next[i] = 0;
  }
  const finished = !next.slice(0,4).some(Boolean) || !next.slice(5,9).some(Boolean);
  if (finished) {
    for (const s of [4,9]) for (let j=s-4;j<s;j++) {
      next[s] += next[j];
      next[j] = 0;
    }
  }
  return {next, player:i===store ? player : 1-player, finished};
}

export function adjacent(i, j, width) {
  const row = x => Math.floor(x / width);
  return Math.abs(row(i) - row(j)) + Math.abs(i % width - j % width) === 1;
}

export function territory(board, width) {
  const points = [board.filter(n=>n===1).length,board.filter(n=>n===2).length];
  const visited = new Set();
  for (let i=0;i<board.length;i++) {
    if (board[i] || visited.has(i)) continue;
    const region = [i], borders = new Set();
    visited.add(i);
    for (const j of region) {
      for (const n of [j-1,j+1,j-width,j+width]) {
        if (n<0 || n>=board.length || !adjacent(j,n,width)) continue;
        if (board[n]) borders.add(board[n]);
        else if (!visited.has(n)) {visited.add(n);region.push(n);}
      }
    }
    if (borders.size===1) points[[...borders][0]-1]+=region.length;
  }
  return points;
}

export function runs(values) {
  const clues = [];
  let run = 0;
  for (const n of [...values,0]) {
    if (n) run++;
    else if (run) {clues.push(run);run=0;}
  }
  return clues.length ? clues : [0];
}

export const pixelPicture = ['00100','01110','11111','01110','00100'].join('').split('').map(Number);
export function pixelClues(board) {
  return Array.from({length:2},(_,axis)=>Array.from({length:5},(_,i)=>
    runs(Array.from({length:5},(_,j)=>board[axis?j*5+i:i*5+j])).join(' ')));
}

export const routeEnds = [[0,12],[20,4]];
export const blocked = [6,8,16,18];
export function extend(paths, color, i) {
  if (!Number.isInteger(color) || !routeEnds[color] || !Number.isInteger(i) || i<0 || i>=25 || blocked.includes(i)) return paths;
  const [start,end] = routeEnds[color];
  if (i===start) return paths.map((route,k)=>k===color?[start]:route);
  const route = paths[color];
  if (routeEnds[1-color].includes(i) || paths[1-color].includes(i) || route.at(-1)===end ||
      route.includes(i) || !adjacent(route.at(-1),i,5)) return paths;
  return paths.map((entry,k)=>k===color?[...entry,i]:entry);
}

export const crossword = ['RING...','...R...','...I...','...DART'].join('');
export function crosswordDone(values) {
  return values.length===crossword.length && Array.from(crossword).every((c,i)=>c==='.'||values[i]===c);
}
