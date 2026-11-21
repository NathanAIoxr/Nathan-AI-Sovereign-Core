export const categories = {
  Numbers: [
    ['Which sum is 24?', ['8 + 12', '9 + 15', '11 + 15'], 1],
    ['Which number is prime?', ['17', '21', '27'], 0],
    ['A minute contains how many seconds?', ['50', '100', '60'], 2]
  ],
  Shapes: [
    ['How many edges does a cube have?', ['8', '12', '16'], 1],
    ['A right angle is how many degrees?', ['45', '180', '90'], 2],
    ['Which shape has five sides?', ['Pentagon', 'Hexagon', 'Octagon'], 0]
  ],
  Words: [
    ['Which word reads the same backward?', ['RIVER', 'LEVEL', 'LATER'], 1],
    ['Which word comes first alphabetically?', ['COVE', 'CAPE', 'CAVE'], 1],
    ['If you reverse FLOW, what do you get?', ['WOLF', 'LOWF', 'FOWL'], 0]
  ]
};

export function begin(category) {
  if (!Object.hasOwn(categories, category)) throw new RangeError('Unknown category');
  return { category, index: 0, score: 0, correct: null };
}

export function answer(round, index) {
  const question = categories[round.category][round.index];
  if (!question || round.correct !== null || !Number.isInteger(index) || index < 0 || index >= question[1].length) {
    return round;
  }
  const correct = index === question[2];
  return { ...round, correct, score: round.score + Number(correct) };
}

export function advance(round) {
  return round.correct === null ? round : { ...round, correct: null, index: round.index + 1 };
}
