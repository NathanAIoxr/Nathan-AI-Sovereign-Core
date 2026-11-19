const input = document.querySelector("#data");
const enable = document.querySelector("#enable");
const bank = document.querySelector("#bank");
const output = document.querySelector("#registers");
const status = document.querySelector("#hardware-status");
const registers = new Uint8Array(3);
const index = () => bank.selectedIndex;
const binary = value => value.toString(2).padStart(8, "0");

function show() {
  output.textContent = [...registers].map((value, i) =>
    "ABC"[i] + "   " + binary(value) + "   " + value + (i === index() ? "   ← read" : "")).join("\n");
}
bank.addEventListener("change", show);
document.querySelector("#clock").addEventListener("click", () => {
  const data = input.valueAsNumber;
  if (enable.checked && (!Number.isInteger(data) || data < 0 || data > 255)) {
    status.textContent = "Enter a whole number from 0 to 255.";
    input.focus();
    return;
  }
  if (enable.checked) registers[index()] = data;
  status.textContent = enable.checked ? "Clock edge wrote bank " + bank.value + "." : "Clock edge held all registers.";
  show();
});
document.querySelector("#hardware-reset").addEventListener("click", () => {
  registers.fill(0);
  status.textContent = "All registers cleared.";
  show();
});
show();
