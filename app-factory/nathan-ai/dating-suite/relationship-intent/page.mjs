import { INTENTS, evaluateIntent } from "./rules.mjs";

const form = document.querySelector("#intent-form");
const result = document.querySelector("#result");
const { first, second, blocked, expired } = form.elements;
for (const select of [first, second]) {
  for (const intent of INTENTS) {
    select.add(new Option(intent, intent));
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const decision = evaluateIntent({
    firstIntent: first.value, secondIntent: second.value,
    blocked: blocked.checked, expired: expired.checked,
  });
  result.textContent = decision.detail;
});

form.addEventListener("reset", () => { result.textContent = ""; });
