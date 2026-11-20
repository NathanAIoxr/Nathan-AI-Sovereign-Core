const preview = document.querySelector("#finish-preview");
const note = document.querySelector("#finish-note");

function updateFinish() {
  const selected = document.querySelector('input[name="finish"]:checked');
  preview.dataset.finish = selected.value;
  note.textContent = selected.dataset.description;
}

const options = document.querySelectorAll('input[name="finish"]');
options.forEach((option) => option.addEventListener("change", updateFinish));
if (options.length) updateFinish();
