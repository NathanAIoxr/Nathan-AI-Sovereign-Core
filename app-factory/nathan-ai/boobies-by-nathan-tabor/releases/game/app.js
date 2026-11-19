const rounds = [
  ['BOOBIES', 'BOOBLESS', 'BELLS'],
  ['BOOBLESS', 'SHELL', 'BOOBIES'],
  ['SHELL', 'BOIL', 'GLOBE'],
  ['GLOBE', 'BELLS', 'SHELL'],
  ['BOIL', 'BOOBIES', 'GLOBE'],
  ['BELLS', 'SHELL', 'BOIL'],
];
let round = 0;
let score = 0;
let flipped = false;

function showRound() {
  flipped = false;
  byId('flip').setAttribute('aria-pressed', 'false');
  byId('round').textContent = 'Round ' + (round + 1) + ' of ' + rounds.length;
  byId('score').textContent = 'Score ' + score + ' / ' + rounds.length;
  byId('feedback').textContent = '';
  byId('next').textContent = round === rounds.length - 1 ? 'See score' : 'Next trap';
  byId('next').disabled = true;
  byId('flip').disabled = false;
  const [correct, ...decoys] = rounds[round];
  showDigits(byId('display'), makeFlip(correct));
  const options = [...decoys];
  options.splice(round % (decoys.length + 1), 0, correct);
  const buttons = options.map(word => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = word;
    button.addEventListener('click', () => {
      if (word === correct) score++;
      byId('score').textContent = 'Score ' + score + ' / ' + rounds.length;
      byId('feedback').textContent = word === correct ? 'Trap zeroed. 00' : 'The flip reads ' + correct + '.';
      for (const choice of buttons) choice.disabled = true;
      byId('next').disabled = false;
      byId('next').focus();
    });
    return button;
  });
  byId('choices').replaceChildren(...buttons);
}

byId('flip').addEventListener('click', () => {
  flipped = !flipped;
  byId('flip').setAttribute('aria-pressed', String(flipped));
  const display = byId('display');
  display.firstElementChild.classList.toggle('flip', flipped);
  const word = rounds[round][0];
  display.setAttribute('aria-label', flipped ? word : makeFlip(word));
});

byId('next').addEventListener('click', () => {
  round++;
  if (round < rounds.length) {
    showRound();
    byId('flip').focus();
    return;
  }
  byId('round').textContent = 'Round complete';
  byId('choices').replaceChildren();
  byId('next').disabled = true;
  byId('flip').disabled = true;
  byId('feedback').textContent = 'Final score: ' + score + ' of ' + rounds.length + ' traps zeroed.';
  byId('reset').focus();
});

byId('reset').addEventListener('click', () => {
  round = 0;
  score = 0;
  showRound();
});
showRound();
