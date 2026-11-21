import { advance, answer, begin, categories } from './quiz-engine.mjs';

const element = id => document.getElementById(id);
const menu = element('categories');
const panel = element('round');
const heading = element('question');
const choices = element('answers');
const result = element('result');
let round;

function button(label, click) {
  const control = document.createElement('button');
  control.type = 'button';
  control.textContent = label;
  control.addEventListener('click', click);
  return control;
}

function show() {
  const questions = categories[round.category];
  const current = questions[round.index];
  element('next').hidden = true;
  if (!current) {
    panel.hidden = true;
    result.textContent = round.category + ' score: ' + round.score + ' / ' + questions.length + '.';
    element('reset').hidden = false;
    element('reset').focus();
    return;
  }
  const [question, answers, correctIndex] = current;
  panel.hidden = false;
  element('position').textContent = round.category + ' · ' + (round.index + 1) + ' of ' + questions.length;
  heading.textContent = question;
  result.textContent = '';
  choices.replaceChildren(...answers.map((label, index) => button(label, () => {
    round = answer(round, index);
    for (const control of choices.children) control.disabled = true;
    result.textContent = round.correct ? 'Correct.' : 'Answer: ' + answers[correctIndex] + '.';
    element('next').textContent = round.index + 1 === questions.length ? 'See score' : 'Next question';
    element('next').hidden = false;
    element('next').focus();
  })));
  heading.focus();
}

menu.replaceChildren(...Object.keys(categories).map(category => button(category, () => {
  round = begin(category);
  menu.hidden = true;
  show();
})));
element('next').addEventListener('click', () => { round = advance(round); show(); });
element('reset').addEventListener('click', () => {
  menu.hidden = false;
  element('reset').hidden = true;
  result.textContent = '';
  menu.firstElementChild.focus();
});
