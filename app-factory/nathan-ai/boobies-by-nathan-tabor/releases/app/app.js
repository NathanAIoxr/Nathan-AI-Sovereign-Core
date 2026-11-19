let flipped = false;
let shownDigits;
const input = byId('digits');

function renderCalculator() {
  const digits = input.value.replace(/[^0-9]/g, '').slice(0, 8);
  if (input.value !== digits) input.value = digits;
  const display = byId('display');
  if (digits !== shownDigits) {
    showDigits(display, digits, flipped);
    shownDigits = digits;
  } else {
    display.firstElementChild.classList.toggle('flip', flipped);
  }
  const reading = flipped ? readFlip(digits) : digits;
  display.setAttribute('aria-label', reading || 'Empty display');
  byId('flip').setAttribute('aria-pressed', String(flipped));
  byId('result').value = reading || 'Enter up to 8 digits';
}

input.addEventListener('input', renderCalculator);
byId('flip').addEventListener('click', () => {
  flipped = !flipped;
  renderCalculator();
});
for (const preset of document.querySelectorAll('[data-digits]')) {
  preset.addEventListener('click', () => {
    input.value = preset.dataset.digits;
    flipped = false;
    renderCalculator();
  });
}
renderCalculator();
