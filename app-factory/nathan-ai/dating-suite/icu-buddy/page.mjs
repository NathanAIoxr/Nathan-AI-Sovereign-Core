import { makeDraft } from "./drafts.mjs";

const form = document.querySelector("#draft-form");
const panel = document.querySelector("#draft-panel");
const status = document.querySelector("#status");
const { approach, note, draft } = form.elements;

form.addEventListener("submit", event => {
  event.preventDefault();
  draft.value = makeDraft(approach.value, note.value);
  panel.hidden = false;
  draft.focus();
  status.textContent = "Draft ready to edit.";
});

form.addEventListener("reset", () => {
  panel.hidden = true;
  status.textContent = "";
});
