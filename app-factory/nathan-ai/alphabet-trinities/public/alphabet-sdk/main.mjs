import { findEntries } from "../common/tools.mjs";

const form = document.querySelector("#sdk-form");
const query = document.querySelector("#sdk-query");
const result = document.querySelector("#sdk-result");
function render() {
  result.textContent = JSON.stringify(findEntries(query.value).map(({ id, letter, name, tradition }) =>
    ({ id, letter, name, tradition })), null, 2);
}
form.addEventListener("submit", event => { event.preventDefault(); render(); });
render();
