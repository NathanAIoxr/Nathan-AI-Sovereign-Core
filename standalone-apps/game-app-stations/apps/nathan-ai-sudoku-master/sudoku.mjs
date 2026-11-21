import {generate, solve, candidates, intersection, logicHint, lessons, lessonPuzzle, parsePuzzle} from './engine.mjs';

const byId = id => document.getElementById(id);
const board = byId('board');
const level = byId('level');
const lessonSelect = byId('lesson');
const announce = message => { byId('status').textContent = message; };
const storageKey = 'nathan-ai-sudoku-master-v1';
const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const modeButtons = [...document.querySelectorAll('[data-mode]')];
let classic, trainer, imported, step;
let mode = 'play', notesOn = false, oxOn = false, radarOn = true, still = motionQuery.matches;
let completed = new Set();

function openCell(values) {
  return Math.max(0, values.indexOf(0));
}

function newGame({puzzle, solution}) {
  return {
    puzzle, solution, values: puzzle.slice(),
    notes: Array.from({length: 81}, () => []),
    crossed: Array.from({length: 81}, () => []),
    selected: openCell(puzzle), checked: false,
  };
}

function game() { return mode === 'trainer' ? trainer : classic; }

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({
      puzzle: classic.puzzle, values: classic.values, notes: classic.notes,
      crossed: classic.crossed, selected: classic.selected,
      level: level.value, radarOn, oxOn, still, completed: [...completed],
    }));
  } catch { /* The game also works without storage. */ }
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved || ![...level.options].some(option => option.value === saved.level)) return false;
    const valid = grid => Array.isArray(grid) && grid.length === 81
      && grid.every(n => Number.isInteger(n) && n >= 0 && n <= 9);
    if (!valid(saved.puzzle) || !valid(saved.values) || saved.puzzle.some((n, i) => n && n !== saved.values[i])) return false;
    const answers = solve(saved.puzzle);
    if (answers.length !== 1) return false;
    classic = newGame({puzzle: saved.puzzle, solution: answers[0]});
    classic.values = saved.values;
    for (const key of ['notes', 'crossed']) {
      classic[key] = classic[key].map((_, i) => Array.isArray(saved[key]?.[i]) ? digits.filter(n => saved[key][i].includes(n)) : []);
    }
    if (Number.isInteger(saved.selected) && saved.selected >= 0 && saved.selected < 81) classic.selected = saved.selected;
    level.value = saved.level;
    if (typeof saved.radarOn === 'boolean') radarOn = saved.radarOn;
    if (typeof saved.oxOn === 'boolean') oxOn = saved.oxOn;
    if (typeof saved.still === 'boolean') still = saved.still;
    if (Array.isArray(saved.completed)) completed = new Set(saved.completed.filter(id => Object.hasOwn(lessons, id)));
    return true;
  } catch { return false; }
}

function changePuzzle() {
  classic = newGame(generate(level.value));
  step = null;
  announce('New ' + level.options[level.selectedIndex].text + ' puzzle.');
  update();
}

function restartLesson() {
  trainer = newGame(lessonPuzzle(lessonSelect.value));
  step = null;
  announce('Find the pattern and cross out its candidates. Hint shows the pattern and the cells it affects.');
  update();
}

function chooseMode(next) {
  mode = next;
  step = null;
  for (const button of modeButtons) button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  byId('play-area').hidden = mode === 'breaker';
  byId('breaker-area').hidden = mode !== 'breaker';
  if (mode === 'breaker') {
    byId('paste').focus();
    return;
  }
  if (mode === 'trainer' && !trainer) return restartLesson();
  announce(mode === 'trainer' ? 'Lesson resumed.' : 'Puzzle ready.');
  update();
}

function showMarks(cell, marks, crossed) {
  if (!marks.length && !crossed.length) return;
  const grid = document.createElement('span');
  grid.className = 'marks';
  grid.setAttribute('aria-hidden', 'true');
  for (const n of digits) {
    const mark = document.createElement('span');
    if (crossed.includes(n)) mark.className = 'crossed';
    mark.textContent = marks.includes(n) || crossed.includes(n) ? n : '';
    grid.append(mark);
  }
  cell.append(grid);
}

function update() {
  const {puzzle, values, notes, crossed, selected, checked, solution} = game();
  const isTraining = mode === 'trainer';
  const showingOx = isTraining || oxOn;
  const focused = board.contains(document.activeElement);
  const radar = intersection(selected);
  for (const [i, cell] of buttons.entries()) {
    const isGiven = Boolean(puzzle[i]);
    const eligible = showingOx && !values[i] ? candidates(values, i) : [];
    const marks = [...new Set([...eligible, ...notes[i]])];
    const exclusions = showingOx ? crossed[i] : [];
    cell.toggleAttribute('data-given', isGiven);
    cell.toggleAttribute('data-related', radarOn && radar.peers[i]);
    cell.toggleAttribute('data-match', radarOn && Boolean(values[selected]) && values[selected] === values[i]);
    cell.toggleAttribute('data-error', checked && Boolean(values[i]) && values[i] !== solution[i]);
    cell.toggleAttribute('data-pattern', step?.cells.includes(i) ?? false);
    cell.toggleAttribute('data-target', step?.eliminations?.some(entry => entry.index === i) ?? false);
    cell.setAttribute('aria-pressed', String(i === selected));
    cell.tabIndex = i === selected ? 0 : -1;
    const value = values[i] ? ', ' + values[i] + (isGiven ? ' given' : '') : ', empty';
    const marksLabel = i === selected && !values[i]
      ? (marks.length ? ', candidates or notes ' + marks.join(', ') : '') + (exclusions.length ? ', crossed ' + exclusions.join(', ') : '')
      : '';
    cell.setAttribute('aria-label', 'Row ' + (Math.floor(i / 9) + 1) + ', column ' + (i % 9 + 1) + value + marksLabel);
    cell.textContent = values[i] || '';
    if (!values[i]) showMarks(cell, marks, exclusions);
  }
  if (focused) buttons[selected].focus();
  byId('classic-tools').hidden = isTraining;
  byId('lesson-tools').hidden = !isTraining;
  byId('lesson-panel').hidden = !isTraining;
  byId('numbers').hidden = isTraining;
  byId('notes').hidden = isTraining;
  byId('erase').hidden = isTraining;
  byId('solve').hidden = isTraining;
  byId('ox').disabled = isTraining;
  byId('apply').hidden = !step;
  setToggle('radar', radarOn);
  setToggle('ox', showingOx);
  byId('motion').checked = still;
  byId('intersection').textContent = 'Row ' + radar.row + ' · Column ' + radar.col + ' · Box ' + radar.box;
  byId('ox-pad').hidden = !showingOx;
  const allowed = values[selected] ? [] : candidates(values, selected);
  for (const [i, key] of candidateButtons.entries()) {
    key.disabled = !allowed.includes(i + 1) && !crossed[selected].includes(i + 1);
    key.setAttribute('aria-pressed', String(crossed[selected].includes(i + 1)));
  }
  if (isTraining) {
    const id = lessonSelect.value;
    byId('technique-title').textContent = lessons[id].title;
    byId('technique-rule').textContent = lessons[id].rule;
    byId('lesson-progress').textContent = (completed.has(id) ? 'Lesson completed. ' : '') + completed.size + ' of ' + Object.keys(lessons).length + ' lessons completed.';
  }
  save();
}

function setToggle(id, enabled) {
  const el = byId(id);
  el.textContent = enabled ? 'On' : 'Off';
  el.setAttribute('aria-pressed', String(enabled));
}

function selectCell(i) {
  const g = game();
  if (g.selected !== i && radarOn && !still && !motionQuery.matches) {
    const frame = board.parentElement;
    frame.removeAttribute('data-scan');
    void frame.offsetWidth;
    frame.setAttribute('data-scan', '');
  }
  g.selected = i;
  update();
}

function place(n) {
  if (mode === 'trainer') {
    if (n) toggleCandidate(n);
    return;
  }
  const {puzzle, values, notes, crossed, selected, solution} = classic;
  if (puzzle[selected]) return announce('Choose an editable cell.');
  if (notesOn && n) {
    if (values[selected]) return announce('Erase the entry before adding notes.');
    const cell = notes[selected];
    notes[selected] = cell.includes(n) ? cell.filter(value => value !== n) : [...cell, n].sort();
  } else {
    values[selected] = n;
    notes[selected] = [];
    if (n) crossed[selected] = [];
  }
  step = null;
  classic.checked = false;
  if (values.every((value, i) => value === solution[i])) announce('Puzzle complete.');
  update();
}

function toggleCandidate(n) {
  const {selected, values, crossed} = game();
  const old = crossed[selected];
  if (values[selected] || (!old.includes(n) && !candidates(values, selected).includes(n))) return;
  crossed[selected] = old.includes(n) ? old.filter(value => value !== n) : [...old, n].sort();
  update();
}

function address(i) {
  return 'R' + (Math.floor(i / 9) + 1) + 'C' + (i % 9 + 1);
}

function coach() {
  const g = game();
  if (g.values.some((n, i) => n && n !== g.solution[i])) return announce('Check the entered digits before taking a hint.');
  if (g.values.every(Boolean)) return announce('Puzzle complete.');
  const technique = mode === 'trainer' ? lessonSelect.value : undefined;
  step = logicHint(g.values, {technique, crossed: technique ? [] : g.crossed});
  if (!step) {
    announce('No covered technique found in this position. Try OX NOT XO to inspect candidates.');
    update();
    return;
  }
  if (step.placement) {
    const {index, digit} = step.placement;
    g.selected = index;
    announce(step.title + '. ' + digit + ' goes at ' + address(index) + (step.unit ? ' in ' + step.unit + '.' : '.'));
  } else {
    if (!technique) oxOn = true;
    g.selected = step.eliminations[0].index;
    const targets = step.eliminations.map(({index, digit}) => digit + ' at ' + address(index));
    announce(step.title + (step.unit ? ' in ' + step.unit : ' on ' + step.digit) + '. Cross out ' + targets.join(', ') + '.');
  }
  update();
}

function check() {
  if (mode === 'trainer') {
    const id = lessonSelect.value;
    const expected = logicHint(trainer.values, {technique: id});
    if (trainer.crossed.some((list, i) => list.includes(trainer.solution[i]))) {
      announce('One of the crossed digits is the solution for its cell. Review the pattern.');
    } else if (expected.eliminations.every(({index, digit}) => trainer.crossed[index].includes(digit))) {
      completed.add(id);
      announce(lessons[id].title + ' complete. Every target candidate was eliminated.');
    } else {
      announce('The pattern still has candidates to cross out. Use Hint to see the target cells.');
    }
  } else {
    classic.checked = true;
    const wrong = classic.values.filter((n, i) => n && n !== classic.solution[i]).length;
    const open = classic.values.filter(n => !n).length;
    announce(wrong ? wrong + (wrong === 1 ? ' incorrect entry.' : ' incorrect entries.')
      : open ? open + ' empty cells. Entered digits are correct.' : 'Puzzle complete.');
  }
  update();
}

const buttons = Array.from({length: 81}, (_, i) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cell';
  button.addEventListener('click', () => selectCell(i));
  board.append(button);
  return button;
});

function digitPad(id, action, label) {
  return digits.map(n => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = n;
    if (label) button.setAttribute('aria-label', label + n);
    button.addEventListener('click', () => action(n));
    byId(id).append(button);
    return button;
  });
}
digitPad('numbers', place);
const candidateButtons = digitPad('ox-pad', toggleCandidate, 'Cross candidate ');
for (const [id, lesson] of Object.entries(lessons)) lessonSelect.add(new Option(lesson.title, id));

board.addEventListener('keydown', event => {
  const {selected} = game();
  const row = Math.floor(selected / 9), col = selected % 9;
  const moves = {ArrowLeft: col > 0 ? -1 : 0, ArrowRight: col < 8 ? 1 : 0,
    ArrowUp: row > 0 ? -9 : 0, ArrowDown: row < 8 ? 9 : 0};
  if (Object.hasOwn(moves, event.key)) {
    event.preventDefault();
    selectCell(selected + moves[event.key]);
  } else if (/^[1-9]$/.test(event.key)) {
    event.preventDefault();
    place(Number(event.key));
  } else if (['Backspace', 'Delete', '0'].includes(event.key)) {
    event.preventDefault();
    place(0);
  }
});
for (const button of modeButtons) button.onclick = () => chooseMode(button.dataset.mode);
byId('new').onclick = changePuzzle;
level.onchange = changePuzzle;
lessonSelect.onchange = restartLesson;
byId('restart').onclick = restartLesson;
byId('radar').onclick = () => {
  radarOn = !radarOn;
  if (!radarOn) board.parentElement.removeAttribute('data-scan');
  update();
};
byId('motion').onchange = event => {
  still = event.target.checked;
  if (still) board.parentElement.removeAttribute('data-scan');
  update();
};
byId('ox').onclick = () => { oxOn = !oxOn; update(); };
byId('notes').onclick = () => {
  notesOn = !notesOn;
  byId('notes').setAttribute('aria-pressed', String(notesOn));
  announce(notesOn ? 'Notes on.' : 'Notes off.');
};
byId('erase').onclick = () => place(0);
byId('hint').onclick = coach;
byId('check').onclick = check;
byId('solve').onclick = () => {
  classic.values = classic.solution.slice();
  step = null;
  classic.checked = false;
  announce('Solution shown.');
  update();
};
byId('apply').onclick = () => {
  const {placement, eliminations} = step;
  if (placement) {
    const wasNotes = notesOn;
    classic.selected = placement.index;
    notesOn = false;
    place(placement.digit);
    notesOn = wasNotes;
  } else {
    const g = game();
    for (const {index, digit} of eliminations) g.crossed[index] = [...new Set([...g.crossed[index], digit])].sort();
    step = null;
    if (mode === 'trainer') return check();
    announce('Candidates crossed out.');
    update();
  }
};

byId('breaker').onsubmit = event => {
  event.preventDefault();
  imported = undefined;
  try {
    imported = parsePuzzle(byId('paste').value);
    byId('breaker-status').textContent = 'Valid puzzle. ' + imported.puzzle.filter(Boolean).length + ' givens and one solution.';
  } catch (error) {
    byId('breaker-status').textContent = error.message;
  }
  byId('play-import').hidden = !imported;
};
byId('paste').oninput = () => {
  imported = undefined;
  byId('play-import').hidden = true;
  byId('breaker-status').textContent = '';
};
byId('play-import').onclick = () => {
  if (!imported) return;
  classic = newGame(imported);
  chooseMode('play');
  buttons[classic.selected].focus();
  announce('Imported puzzle ready.');
};
if (restore()) { announce('Saved puzzle restored.'); update(); }
else changePuzzle();
