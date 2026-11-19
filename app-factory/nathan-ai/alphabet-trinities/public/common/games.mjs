import { records } from "./tools.mjs";

const clues = [
  ["A-1", "Prophecy at Delphi, music, and a later association with the sun."],
  ["A-2", "Strategic warfare, weaving, and a birth from the head of Zeus."],
  ["A-3", "The Egyptian guide of the dead who attends the heart-weighing scales."],
  ["A-5", "The Greek deity who embodies war and the tumult of combat."],
  ["A-6", "The Titan who bears the heavens."],
  ["B-1", "The creator in the Trimurti."],
  ["B-2", "The radiant figure whose death precedes Ragnarök."],
  ["B-3", "An Egyptian protective goddess depicted in cat and lioness forms."],
  ["B-6", "The personified north wind."],
  ["C-1", "The paired entry for the personification of time and the Titan of the Golden Age."],
  ["C-2", "The often three-headed hound who guards the Greek Underworld."],
  ["C-3", "The sorceress of Aeaea who transforms Odysseus’s crew."],
  ["C-6", "King Arthur’s legendary court in medieval romance."],
  ["G-1", "Hesiod’s personified Earth who bears the sky and the sea."],
  ["H-2", "The swift Greek messenger who guides the dead and protects travelers."],
  ["I-3", "The Greek messenger who personifies the rainbow."],
  ["J-2", "The two-faced Roman god of doorways and beginnings."],
  ["K-2", "The deity who teaches Arjuna in the Bhagavad Gita."],
  ["L-2", "The Hindu goddess of fortune, wealth, and abundance."],
  ["M-3", "In Ovid, a maker of dream figures who imitates human forms."],
  ["N-2", "The winged Greek figure whose name means victory."],
  ["O-3", "The Greek giant hunter placed among the stars."],
  ["P-3", "The Titan who brings fire to humanity."],
  ["Q-3", "The name for the fifth element in ancient natural philosophy."],
  ["R-3", "The Vedic term associated with ritual and cosmic order."],
  ["S-1", "The Latin word for the sun, also personified as a Roman deity."],
  ["U-2", "The Sumerian sun deity linked with legal judgment and justice."],
  ["W-2", "The Old English vocabulary entry for fate or what comes to pass."],
  ["X-2", "The Greek term for reciprocal hospitality between guest and host."],
  ["Y-1", "The Norse primordial being whose body supplies matter for the world."],
  ["Z-3", "The Greek vocabulary word for living existence."],
  ["T-1", "The Athenian king who enters the labyrinth with help from Ariadne."],
  ["T-2", "The biblical Greek word behind the Tabor sound reading “the OS.”"],
  ["T-3", "The Marvel Titan behind the Tabor sound reading “thank NOS.”"],
  ["V-2", "The Latin word for truth or truthfulness."],
  ["V-6", "The Vedic deity and word associated with wind."],
  ["V-10", "The SI unit of electric potential difference."],
];

function shuffled(items, random) {
  const result = [...items];
  for (let last = result.length - 1; last > 0; last--) {
    const pick = Math.floor(random() * (last + 1));
    [result[last], result[pick]] = [result[pick], result[last]];
  }
  return result;
}

export function newRound(random = Math.random) {
  return shuffled(clues, random).slice(0, 6).map(([id, clue]) => {
    const correct = records.find(record => record.id === id.toLowerCase());
    const alternatives = shuffled(records.filter(record => record.letter === correct.letter && record.id !== correct.id), random);
    return { correct, clue, choices: shuffled([correct, ...alternatives.slice(0, 3)], random) };
  });
}

export const twisted = order => [order[2], order[0], order[1]];
export function swapped(order, left, right) {
  const result = [...order];
  [result[left], result[right]] = [result[right], result[left]];
  return result;
}
