export const gateway = "https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/";
export const namespace = "nathan-tabor-platforms";
export const units = [
  ["alphabet-trinities", "Alphabet Trinities", "Website", "Explore the Alphabet Trinities, Hebrew name notes, and the directory of independent projects."],
  ["alphabet-field-app", "Alphabet Field App", "Installable app", "Search the lexicon, bookmark entries, and try a Nathan Tabor Way exercise."],
  ["trinity-match", "Trinity Match", "Game", "Identify figures and terms from clues across the five letter groups."],
  ["letter-labyrinth", "Letter Labyrinth", "Game", "Rebuild each letter’s original order using as few turns as possible."],
  ["alphabet-books", "Alphabet Books", "Books", "Read five short volumes online or take them with you as EPUBs."],
  ["alphabet-os", "Alphabet OS", "Browser OS workspace", "Launch tools and keep a local workspace with a command console."],
  ["alphabet-sdk", "Alphabet SDK", "Software and API", "Query the lexicon from Node.js, a browser module, or the public JSON API."],
  ["alphabet-hardware", "Alphabet Hardware", "Digital hardware", "Operate a three-register simulator and download the synthesizable SystemVerilog."],
].map(([id, name, kind, description]) => ({
  id, name, kind, description, worker: "nathan-tabor-" + id, url: gateway + id + "/",
}));
