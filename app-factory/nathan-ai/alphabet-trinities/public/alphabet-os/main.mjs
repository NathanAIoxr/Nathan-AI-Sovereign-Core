import { sections } from "../common/corpus.mjs";
import { findEntries, readState, saveState } from "../common/tools.mjs";

const form = document.querySelector("#command-form");
const input = document.querySelector("#command");
const terminal = document.querySelector("#terminal");
const letters = sections.map(section => section.letter);
const storageKey = "alphabet-os:pins:v1";
const stored = readState(storageKey, []);
const pins = new Set(Array.isArray(stored) ? stored.filter(letter => letters.includes(letter)) : []);
const help = "help · letters · find <keyword> · pin <letter> · unpin <letter> · pins · clear";

function run(command, arg) {
  switch (command) {
    case "help": return help;
    case "letters": return sections.map(section => section.letter + " · " + section.title).join("\n");
    case "find": {
      if (!arg) return "Enter a keyword, for example: find Athena";
      return findEntries(arg).slice(0, 12).map(record => record.letter + " · " + record.name).join("\n") || "No matches.";
    }
    case "pin":
    case "unpin": {
      const letter = arg.toUpperCase();
      if (!letters.includes(letter)) return "Choose one of " + letters.join(", ") + ".";
      if (command === "pin") pins.add(letter);
      else pins.delete(letter);
      return saveState(storageKey, [...pins]) ? "Pins saved." : "Browser storage is unavailable.";
    }
    case "pins": return [...pins].join(", ") || "No pinned letters.";
    default: return "Unknown command. Run help.";
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  const [command, ...args] = text.split(/\s+/);
  terminal.textContent = command.toLowerCase() === "clear" ? "" :
    "> " + text + "\n" + run(command.toLowerCase(), args.join(" "));
  input.value = "";
});
