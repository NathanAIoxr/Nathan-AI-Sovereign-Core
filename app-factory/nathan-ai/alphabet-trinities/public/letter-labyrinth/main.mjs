import { sections } from "../common/corpus.mjs";
import { swapped, twisted } from "../common/games.mjs";

const chapter = document.querySelector("#chapter");
const tiles = document.querySelector("#tiles");
const hint = document.querySelector("#hint");
const status = document.querySelector("#moves");
const reset = document.querySelector("#reset");
let target, board, held, moves;

function show(focusIndex = null) {
  const won = board.every((piece, index) => piece === target[index]);
  tiles.replaceChildren();
  board.forEach((piece, index) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.textContent = piece;
    tile.setAttribute("aria-pressed", String(held === index));
    tile.disabled = won;
    tile.addEventListener("click", () => {
      if (held === index) held = null;
      else if (held === null) held = index;
      else {
        board = swapped(board, held, index);
        held = null;
        moves++;
      }
      show(index);
    });
    tiles.append(tile);
  });
  status.textContent = won ? `Restored in ${moves} moves. Par is two.` :
    `${moves} moves. ${held === null ? "Choose a tile." : "Choose its swap partner."}`;
  if (focusIndex !== null) (won ? reset : tiles.children[focusIndex]).focus();
}

function start() {
  const section = sections.find(s => s.letter === chapter.value);
  target = section.core.map(item => item[0]);
  board = twisted(target);
  held = null;
  moves = 0;
  hint.textContent = target.join(" → ");
  show();
}
chapter.addEventListener("change", start);
reset.addEventListener("click", start);
start();
