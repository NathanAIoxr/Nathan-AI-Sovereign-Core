const controls = document.querySelector("[data-practice]");
const key = "tabor-academy/mastery/" + controls.dataset.practice;
const hold = controls.querySelector("[data-hold]");
const done = controls.querySelector("[data-done]");
const status = document.querySelector("#lesson-state");
let state = "";

try {
  state = localStorage.getItem(key) ?? "";
} catch {
  // Practice controls also work when the browser disables persistent storage.
}

function render() {
  hold.textContent = state === "paused" ? "Resume" : "Hold on";
  hold.setAttribute("aria-pressed", String(state === "paused"));
  done.textContent = state === "practiced" ? "Clear practice mark" : "Mark practiced";
  done.setAttribute("aria-pressed", String(state === "practiced"));
  status.textContent = ({ paused: "Practice paused.", practiced: "Marked practiced on this device." })[state] ?? "";
}

function update(next) {
  state = next;
  render();
  try {
    if (state) localStorage.setItem(key, state);
    else localStorage.removeItem(key);
  } catch {
    status.textContent += " This browser could not save your progress.";
  }
}

hold.addEventListener("click", () => update(state === "paused" ? "" : "paused"));
done.addEventListener("click", () => update(state === "practiced" ? "" : "practiced"));
render();
controls.hidden = false;
