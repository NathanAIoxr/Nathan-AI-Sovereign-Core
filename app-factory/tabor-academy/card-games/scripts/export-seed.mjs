import { buildSeed } from '../catalog.mjs';
const {schema,chunks,receipt,games,lessons,release} = await buildSeed();
if (process.argv.includes('--summary')) {
  const statuses = {};
  for (const game of games) statuses[game.status] = (statuses[game.status] || 0) + 1;
  console.log(JSON.stringify({ release, games: games.length, lessons: lessons.length,
    aliases: games.reduce((n,g)=>n+g.aliases.length,0), rules: games.filter(g=>g.rulebook).length,
    play: games.filter(g=>g.engine).length, statuses, chunks: chunks.length }));
} else if (process.argv.includes('--json')) {
  console.log(JSON.stringify({schema,chunks,receipt}));
} else {
  console.log([schema,...chunks,receipt].join('\n'));
}
