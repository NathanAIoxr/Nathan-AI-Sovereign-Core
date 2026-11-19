import { MENU, DINERS, MAX_PORTIONS, CHECK, SCENES, changePortion, preset, receipt, restorePlates, score, total } from "./engine.mjs";

const get = (id) => document.getElementById(id);
const currency = Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const number = Intl.NumberFormat("en-US");
const money = (cents) => currency.format(cents / 100);
const kcal = (calories) => number.format(calories) + " kcal";
const plateNames = ["Plate 1", "Plate 2", "Drink glass"];

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private browsing can disable storage. */ }
}

function line(label, value) {
  return '<div class="ledger-line"><span>' + label + '</span><strong>' + value + '</strong></div>';
}

function startPlates() {
  const key = "sunday-buffet.plates.v1";
  const saved = load(key);
  let plates = saved ? restorePlates(saved) : preset();
  const menu = get("menu");
  const diner = get("diner");
  const plate = get("plate");

  function render() {
    const selected = plates[diner.value];
    const index = Number(plate.value);
    get("totals").innerHTML = Object.entries(DINERS).map(([id, person]) =>
      '<div class="board"><span>' + person.name + '</span><strong>' + kcal(total(plates[id])) + '</strong></div>').join("");
    get("how").textContent = "In the book’s Sunday spread. " + DINERS[diner.value].how;
    get("plate-detail").innerHTML = selected.map((servings, i) => {
      const list = MENU.filter(({ id }) => servings[id]).map(({ id, name }) => servings[id] + " × " + name).join(", ");
      return '<div class="plate-line"><div>' + plateNames[i] + '<small>' + (list || "Empty") +
        '</small></div><strong>' + kcal(total([servings])) + '</strong></div>';
    }).join("");

    menu.innerHTML = MENU.filter(({ section }) => (section === "Drinks") === (index === 2)).map((item) => {
      const count = selected[index][item.id] ?? 0;
      return '<div class="menu-line"><div><strong>' + item.name + '</strong><small>' + item.unit + ' · ' + kcal(item.kcal) +
        '</small></div><div class="steps"><button class="step" type="button" data-item="' + item.id +
        '" data-delta="-1" aria-label="Remove one serving of ' + item.name + '"' + (count === 0 ? " disabled" : "") +
        '>−</button><output aria-label="' + item.name + ' servings">' + count + '</output><button class="step" type="button" data-item="' +
        item.id + '" data-delta="1" aria-label="Add one serving of ' + item.name + '"' + (count === MAX_PORTIONS ? " disabled" : "") +
        '>+</button></div></div>';
    }).join("");
  }

  menu.addEventListener("click", ({ target }) => {
    const button = target.closest("button[data-item]");
    if (!button) return;
    const { item, delta } = button.dataset;
    const selected = plates[diner.value][Number(plate.value)];
    changePortion(selected, item, Number(delta));
    save(key, plates);
    render();
    const options = [...menu.querySelectorAll('button[data-item="' + item + '"]:enabled')];
    (options.find((option) => option.dataset.delta === delta) ?? options[0])?.focus();
    get("portion-status").textContent = MENU.find(({ id }) => id === item).name + " · " + (selected[item] ?? 0) + " servings";
  });

  for (const element of [diner, plate]) element.addEventListener("change", () => {
    get("portion-status").textContent = "";
    render();
  });
  document.querySelectorAll("[data-preset]").forEach((button) => button.addEventListener("click", () => {
    plates = preset(button.dataset.preset);
    save(key, plates);
    get("portion-status").textContent = button.textContent + " applied.";
    render();
  }));
  render();

  const billInput = get("bill");
  const tipInput = get("tip");
  function updateTip() {
    if (!billInput.value || !tipInput.value || !billInput.validity.valid || !tipInput.validity.valid) {
      get("tip-output").textContent = "Enter a subtotal from $0 to $10,000 and a whole tip percentage from 0 to 100.";
      return;
    }
    const bill = receipt(Math.round(billInput.valueAsNumber * 100), tipInput.valueAsNumber);
    get("tip-output").innerHTML = line("Tip", money(bill.tip)) + line("Total before tax", money(bill.total));
  }
  for (const element of [billInput, tipInput]) element.addEventListener("input", updateTip);
  updateTip();

  let installPrompt;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
  });
  get("install").addEventListener("click", async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      installPrompt = undefined;
      return;
    }
    const message = get("install-message");
    message.textContent = "On iPhone, open this page in Safari, tap Share, then Add to Home Screen. On supported desktop and Android browsers, look for Install or Add to Home screen in the browser menu.";
    message.hidden = false;
  });
  if (matchMedia("(display-mode: standalone)").matches || navigator.standalone === true) get("install").hidden = true;
  window.addEventListener("appinstalled", () => { get("install").hidden = true; });
}

function startGame() {
  const key = "sunday-buffet.shift.v1";
  const saved = load(key);
  const storedChoices = Array.isArray(saved?.choices) ? saved.choices : [];
  let choices = [];
  for (const [i, index] of storedChoices.entries()) {
    if (!Number.isInteger(index) || !SCENES[i]?.choices[index]) break;
    choices.push(index);
  }
  let awaitingNext = saved?.awaitingNext === true && choices.length > 0;
  const game = get("game");

  function render(focus = false) {
    const results = score(choices);
    get("score").innerHTML = line("Care points", results.care + " / 12") + line("Added server tasks", results.tasks) +
      line("Tip left", choices.length === SCENES.length ? money(results.tip) : "Pending");
    get("restart").hidden = choices.length === 0;
    if (awaitingNext) {
      const index = choices.length - 1;
      const scene = SCENES[index];
      const choice = scene.choices[choices[index]];
      game.innerHTML = '<p class="eyebrow">' + scene.time + '</p><h2 tabindex="-1">' + scene.title +
        '</h2><p>' + choice.reply + '</p><button type="button" class="scene-next" data-next>' +
        (choices.length === SCENES.length ? "See the receipt" : "Next decision") + '</button>';
    } else if (choices.length === SCENES.length) {
      const rows = choices.map((index, scene) => '<li><strong>' + SCENES[scene].title + '</strong> · ' +
        SCENES[scene].choices[index].label + '</li>').join("");
      game.innerHTML = '<p class="eyebrow">CHECK CLOSED</p><h2 tabindex="-1">Your Sunday receipt</h2><ol class="scene-summary">' +
        rows + '</ol>' + line("Table subtotal", money(CHECK)) + line("Tip left", money(results.tip)) +
        line("Total before tax", money(CHECK + results.tip)) + '<p><a href="./app">Try your own bill and portions</a></p>';
    } else {
      const scene = SCENES[choices.length];
      const buttons = scene.choices.map(({ label }, index) => '<button type="button" class="choice" data-choice="' + index +
        '">' + label + '</button>').join("");
      game.innerHTML = '<p class="eyebrow">' + scene.time + ' · DECISION ' + (choices.length + 1) + ' OF ' +
        SCENES.length + '</p><h2 tabindex="-1">' + scene.title + '</h2><p>' + scene.body +
        '</p><div class="choice-list">' + buttons + '</div>';
    }
    if (focus) game.querySelector("h2").focus();
  }

  game.addEventListener("click", ({ target }) => {
    const button = target.closest("button");
    if (!button) return;
    if (button.hasAttribute("data-next")) awaitingNext = false;
    else {
      choices.push(Number(button.dataset.choice));
      awaitingNext = true;
    }
    save(key, { choices, awaitingNext });
    render(true);
  });
  get("restart").addEventListener("click", () => {
    choices = [];
    awaitingNext = false;
    save(key, { choices, awaitingNext });
    render(true);
  });
  render();
}

if (get("menu")) startPlates();
if (get("game")) startGame();
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(new URL("./sw.js", import.meta.url)).catch(() => {});
  }, { once: true });
}
