import { newRound } from "../common/games.mjs";

const choices = document.querySelector("#choices");
const progress = document.querySelector("#progress");
const clue = document.querySelector("#clue");
const feedback = document.querySelector("#feedback");
const next = document.querySelector("#next");
const restart = document.querySelector("#restart");
let round, position, score;

function present(focus = false) {
  const question = round[position];
  next.hidden = true;
  choices.replaceChildren();
  feedback.textContent = "";
  if (!question) {
    progress.textContent = "Round complete";
    clue.textContent = `You answered ${score} of ${round.length} correctly.`;
    restart.focus();
    return;
  }
  progress.textContent = `Clue ${position + 1} of ${round.length} · Score ${score}`;
  clue.textContent = question.clue;
  for (const answer of question.choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = answer.name;
    button.addEventListener("click", () => {
      const correct = question.correct.id === answer.id;
      if (correct) score++;
      for (const choice of choices.children) choice.disabled = true;
      feedback.textContent = (correct ? "Correct. " : "The answer is " + question.correct.name + ". ") + question.correct.tradition + ".";
      next.textContent = position + 1 >= round.length ? "See score" : "Next clue";
      next.hidden = false;
      next.focus();
    });
    choices.append(button);
  }
  if (focus) choices.firstElementChild.focus();
}

function start(focus = false) {
  round = newRound();
  position = 0;
  score = 0;
  present(focus);
}
next.addEventListener("click", () => { position++; present(true); });
restart.addEventListener("click", () => start(true));
start();
