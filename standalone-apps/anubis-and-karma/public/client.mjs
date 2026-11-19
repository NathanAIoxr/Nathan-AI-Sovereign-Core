export const cases = [
  {
    title: 'The Dry Gate',
    scenario: 'The clerk signed for a full water delivery. A woman sets an empty jar on the scales.',
    evidence: 'The signed delivery record and the empty jar disagree.',
    effect: 'The upper village has run dry. The mill below still needs enough water to finish its grain.',
    decision: [
      { value: 0, text: 'Stamp the clerk’s record and close the gate.' },
      { value: 1, text: 'Hear both villages and measure the flow at the fork.' },
    ],
    missed: 'The stamp leaves the contradiction on the scales. The wells are still dry.',
    receipt: 'The measurements locate the blocked channel. The signed entry can now be corrected.',
  },
  {
    title: 'The Weight of a Repair',
    scenario: 'The gatekeeper can clear the blockage. A sudden diversion would strand the mill workers downstream.',
    evidence: 'Both channels can carry water when opened in turn.',
    effect: 'Each opening changes what reaches the other village.',
    decision: [
      { value: 1, text: 'Open in stages and take a reading in each village.' },
      { value: 0, text: 'Send the full flow uphill in one move.' },
    ],
    missed: 'The first village gets water. The mill’s interruption leaves the repair open.',
    receipt: 'Both readings agree with the gate log. The upper jar fills and the mill finishes.',
  },
  {
    title: 'The Last Weighing',
    scenario: 'The clerk offers a blank ledger to start the next day. The people who brought the evidence are still standing in the hall.',
    evidence: 'The original delivery entry, the correction, and both readings are present.',
    effect: 'The two villages can follow the record and test the repair.',
    decision: [
      { value: 0, text: 'Replace the first page with a clean sheet.' },
      { value: 1, text: 'Keep the first entry and attach the verified repair.' },
    ],
    missed: 'The clean sheet removes the evidence the villages need to verify the repair.',
    receipt: 'Anubis weighs the amended record. Karma follows the repaired channels. The two accounts agree.',
  },
];

export function choose(state, value) {
  if (state.index >= cases.length || ![0, 1].includes(value)) return state;
  const current = cases[state.index];
  return value === 0
    ? { ...state, message: current.missed }
    : { index: state.index + 1, message: current.receipt };
}

function mount(doc) {
  const el = (id) => doc.getElementById(id);
  let state = { index: 0, message: '' };

  function render(moveFocus = false) {
    const current = cases[state.index];
    const finished = !current;
    el('progress').textContent = finished ? 'All three cases closed' : `Case ${state.index + 1} of ${cases.length}`;
    el('game-title').textContent = current?.title ?? 'The war is over';
    el('scenario').textContent = current?.scenario ?? 'Anubis and Karma close the book together. Outside, the neighbors set the stones back in place and hang a porch swing.';
    el('evidence').textContent = current?.evidence ?? 'The corrected record is visible to both villages.';
    el('effect').textContent = current?.effect ?? 'Water reaches both villages. The repair has a receipt.';
    el('feedback').textContent = state.message;
    el('choices').replaceChildren();
    for (const choice of current?.decision ?? []) {
      const button = doc.createElement('button');
      button.type = 'button';
      button.textContent = choice.text;
      button.addEventListener('click', () => {
        state = choose(state, choice.value);
        if (choice.value === 0) el('feedback').textContent = state.message;
        else render(true);
      });
      el('choices').append(button);
    }
    for (const [index, stone] of [...el('stones').children].entries()) {
      stone.toggleAttribute('data-closed', index < state.index);
      stone.setAttribute('aria-label', `Case ${index + 1}: ${index < state.index ? 'closed' : 'open'}`);
    }
    el('stones').classList.toggle('finished', finished);
    el('root-result').hidden = !finished;
    el('reset').hidden = !finished;
    if (moveFocus) el('game-title').focus();
  }

  el('reset').addEventListener('click', () => {
    state = { index: 0, message: '' };
    render(true);
  });
  render();
}

if (typeof document !== 'undefined') mount(document);
