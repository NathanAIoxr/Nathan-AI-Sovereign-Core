import { escapeHtml, findEntries, readState, saveState } from "../common/tools.mjs";

const query = document.querySelector("#query");
const letter = document.querySelector("#letter");
const entries = document.querySelector("#entries");
const status = document.querySelector("#status");
const toggle = document.querySelector("#saved");
const reflection = document.querySelector("#reflection");
const noteStatus = document.querySelector("#note-status");
const bookmarkKey = "alphabet-field-app:bookmarks:v1";
const noteKey = "alphabet-field-app:notes:v1";
const stored = readState(bookmarkKey, []);
const bookmarks = new Set(Array.isArray(stored) ? stored : []);
reflection.value = String(readState(noteKey, ""));

function render(focusId) {
  const matches = findEntries(query.value, letter.value).filter(record => toggle.getAttribute("aria-pressed") !== "true" || bookmarks.has(record.id));
  entries.innerHTML = matches.map(({ id, name, letter, tradition, detail }) => `
    <article class="card"><small>${letter} · ${escapeHtml(tradition)}</small><h3>${escapeHtml(name)}</h3>
    <p>${escapeHtml(detail)}</p><button type="button" data-id="${id}" aria-pressed="${bookmarks.has(id)}"
    aria-label="Bookmark ${escapeHtml(name)}">${bookmarks.has(id) ? "Bookmarked" : "Bookmark"}</button></article>`).join("");
  status.textContent = matches.length ? `${matches.length} matching entries` : "No matching entries. Try another search or letter.";
  if (focusId) (entries.querySelector('[data-id="' + focusId + '"]') ?? toggle).focus();
}

query.addEventListener("input", () => render());
letter.addEventListener("change", () => render());
toggle.addEventListener("click", () => {
  const active = toggle.getAttribute("aria-pressed") !== "true";
  toggle.setAttribute("aria-pressed", active);
  render();
});
entries.addEventListener("click", event => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  const { id } = button.dataset;
  if (bookmarks.has(id)) bookmarks.delete(id);
  else bookmarks.add(id);
  const persisted = saveState(bookmarkKey, [...bookmarks]);
  render(id);
  if (!persisted) status.textContent += " · Browser storage is unavailable.";
});
document.querySelector("#save-note").addEventListener("click", () => {
  noteStatus.textContent = saveState(noteKey, reflection.value) ? "Saved in this browser." : "Browser storage is unavailable.";
});
render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(error => console.warn("Offline setup unavailable", error));
}
