export function eventResults(event) {
  if (!event || event.champion === null) return null;
  const names = event.players;
  return {
    format: 'hook-and-ring-results-v1',
    event: event.name,
    catchGoal: event.goal,
    champion: names[event.champion],
    rounds: event.rounds.map((round, index) => ({
      round: index + 1,
      matches: round.map(match => ({
        scores: match.players.map((seat, side) => ({
          player: names[seat],
          catches: match.scores[side],
        })),
        winner: names[match.winner],
        tosses: match.turn,
      })),
    })),
  };
}
