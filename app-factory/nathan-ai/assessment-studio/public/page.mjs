import { ipipItems } from "./ipip.mjs";
import { comparisonKey, parseValue, providers, qeItems, qiItems, rankAttempts, scoreBigFive, scorePractice, units } from "./assessments.mjs";

const $ = id => document.getElementById(id);
const storageKey = "nathan-ai.assessment-studio.results.v1";
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" });
const scale = ["Very inaccurate", "Moderately inaccurate", "Neither", "Moderately accurate", "Very accurate"];
const labModes = {
  qi: { name: "QI · Quick Intelligence", items: qiItems, measure: "Reasoning accuracy", comparison: "Same six-item reasoning exercise" },
  qe: { name: "QE · Quintessential Empathy", items: qeItems, measure: "Scenario response alignment", comparison: "Same four-scenario exercise" },
};
const views = Array.from(document.querySelectorAll(".view"));
const nav = Array.from(document.querySelectorAll(".sections a"));
let records = [];
let storageAvailable = true;
let bigPage = 0;
let bigAnswers = [];
let activeLab;
let labStart;
let rankedId;

function node(tag, value, className) {
  const element = document.createElement(tag);
  if (value !== undefined) element.textContent = value;
  if (className) element.className = className;
  return element;
}

function action(text, callback) {
  const button = node("button", text);
  button.type = "button";
  button.addEventListener("click", callback);
  return button;
}

function link(text, href, external = false) {
  const anchor = node("a", text);
  anchor.href = href;
  if (external) {
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  }
  return anchor;
}

function showView(focus = false) {
  const selected = views.find(view => "#" + view.id === location.hash)?.id ?? "directory";
  views.forEach(view => { view.hidden = view.id !== selected; });
  nav.forEach(anchor => {
    if (anchor.hash === "#" + selected) anchor.setAttribute("aria-current", "page");
    else anchor.removeAttribute("aria-current");
  });
  if (focus) $(selected).focus();
}

function renderDirectory() {
  const category = $("category").value;
  const cards = providers.filter(provider => category === "All assessments" || category === provider.category).map(provider => {
    const card = node("article", undefined, "card");
    const open = provider.id === "ipip" ? link("Take questionnaire", "#big-five") : link("Open provider ↗", provider.url, true);
    open.setAttribute("aria-label", provider.id === "ipip" ? "Take the IPIP Big Five questionnaire" : "Open " + provider.name + " provider");
    const log = action("Log result", () => {
      $("instrument").value = provider.id;
      updateInstrument();
      location.hash = "results";
    });
    log.setAttribute("aria-label", "Log " + provider.name + " result");
    const actions = node("div", undefined, "card-actions");
    actions.append(open, log);
    card.append(node("p", provider.format, "format"), node("h3", provider.name), node("p", provider.detail), actions);
    return card;
  });
  $("providers").replaceChildren(...cards);
}

function fieldset(prompt, options, name, offset, answer, inline = false) {
  const group = node("fieldset", undefined, inline ? "question scale" : "question");
  group.append(node("legend", prompt));
  options.forEach((label, index) => {
    const wrap = node("label", undefined, "choice");
    const radio = node("input");
    radio.type = "radio";
    radio.name = name;
    radio.value = offset + index;
    radio.checked = answer === offset + index;
    radio.required = true;
    wrap.append(radio, node("span", label));
    group.append(wrap);
  });
  return group;
}

function renderBigFive() {
  const start = bigPage * 5;
  const items = ipipItems.slice(start, start + 5).map(([prompt], index) => {
    const number = start + index;
    return fieldset((number + 1) + ". " + prompt, scale, "answer-" + number, 1, bigAnswers[number], true);
  });
  $("big-items").replaceChildren(...items);
  $("big-back").disabled = bigPage === 0;
  $("big-progress").textContent = "Items " + (start + 1) + "–" + (start + items.length) + " of " + ipipItems.length;
  $("big-next").textContent = start + items.length === ipipItems.length ? "Score Big Five" : "Next five";
}

function collectBigAnswers() {
  for (const [name, value] of new FormData($("big-form"))) bigAnswers[Number(name.slice(7))] = Number(value);
}

function showBigScore() {
  const scores = scoreBigFive(bigAnswers);
  const result = $("big-result");
  const list = node("ul", undefined, "score-list");
  scores.forEach(({ measure, value }) => {
    const row = node("li");
    const bar = node("meter");
    bar.min = 10;
    bar.max = 50;
    bar.value = value;
    bar.setAttribute("aria-label", measure);
    row.append(node("span", measure), bar, node("strong", value + " / 50"));
    list.append(row);
  });
  const heading = node("h3", "Your Big Five trait profile");
  heading.tabIndex = -1;
  const save = action("Save five scores", () => {
    saveRecords(scores.map(score => ({
      ...score, instrument: "IPIP Big Five", edition: "IPIP 50-item Big Five Markers", unit: "raw",
      comparison: "50-item IPIP, 1–5 response scale", source: "Scored in Assessment Studio",
    })));
    save.disabled = true;
  });
  const reset = action("Start a new questionnaire", () => {
    bigPage = 0;
    bigAnswers = [];
    result.replaceChildren();
    $("big-form").hidden = false;
    renderBigFive();
    $("big-items").querySelector("input").focus();
  });
  result.replaceChildren(heading, node("p", "Traits are ordered by your raw scores within this questionnaire."), list, save, reset);
  $("big-form").hidden = true;
  heading.focus();
}

function startLab(mode) {
  activeLab = mode;
  const { name, items } = labModes[mode];
  $("lab-name").textContent = name;
  $("lab-items").replaceChildren(...items.map(({ prompt, choices }, index) => fieldset(prompt, choices, "item-" + index, 0)));
  $("lab-result").replaceChildren();
  $("lab-form").hidden = false;
  labStart = performance.now();
  $("lab-items").querySelector("input").focus();
}

function showLabScore() {
  const { name, items, measure, comparison } = labModes[activeLab];
  const answers = Array.from(new FormData($("lab-form")).values(), Number);
  const value = scorePractice(items, answers);
  const seconds = Math.round((performance.now() - labStart) / 1000);
  const duration = activeLab === "qi" ? " · " + seconds + " seconds elapsed" : "";
  const heading = node("h3", value + " / " + items.length + duration);
  heading.tabIndex = -1;
  const explanations = node("ol", undefined, "explanations");
  items.forEach(({ prompt, choices, answer, why }, index) => {
    const row = node("li");
    row.append(node("strong", prompt), node("p", "Your answer: " + choices[answers[index]]), node("p", "Practice answer: " + choices[answer] + " " + why));
    explanations.append(row);
  });
  const save = action("Save practice result", () => {
    saveRecords([{
      instrument: name, edition: "Studio practice v1", measure, value, unit: "raw", comparison,
      source: "Nathan Tabor Way practice" + duration,
    }]);
    save.disabled = true;
  });
  $("lab-form").hidden = true;
  $("lab-result").replaceChildren(heading, node("p", "Practice results use the answers and explanations for this exercise."), explanations, save);
  heading.focus();
}

function updateInstrument() {
  const custom = $("instrument").value === "other";
  $("custom-label").hidden = !custom;
  $("record-form").elements.custom.required = custom;
}

function localDate() {
  const now = new Date();
  const display = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return display.toISOString().slice(0, 10);
}

function status(message) {
  $("status").textContent = message;
}

function persist(next) {
  if (storageAvailable) {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); }
    catch { storageAvailable = false; }
  }
  records = next;
  renderRecords();
  return storageAvailable;
}

function saveRecords(entries) {
  const at = new Date().toISOString();
  const saved = entries.map(entry => ({ date: localDate(), ...entry, at, id: crypto.randomUUID() }));
  const stored = persist([...records, ...saved]);
  status(stored ? "Saved in this browser." : "Saved for this visit. Browser storage is unavailable. Export to keep a copy.");
  location.hash = "results";
}

function renderRanking(selected) {
  rankedId = selected?.id;
  $("ranking").hidden = !selected;
  if (!selected) return;
  const ranks = rankAttempts(records, selected);
  const list = node("ul", undefined, "ranks");
  ranks.forEach(record => {
    list.append(node("li", "Rank " + record.rank + " · " + record.value + " · " + dateFormat.format(new Date(record.date)) + (record.id === selected.id ? " · selected" : "")));
  });
  $("rank-list").replaceChildren(
    node("p", selected.instrument + " · " + selected.measure + " · " + units[selected.unit] + " · " + selected.comparison),
    list,
  );
}

function renderRecords() {
  const history = [...records].sort((a, b) => b.date.localeCompare(a.date) || b.at.localeCompare(a.at));
  $("export").disabled = history.length === 0;
  $("records").replaceChildren(...(history.length ? history.map(record => {
    const row = node("article", undefined, "record");
    const details = node("div", undefined, "record-details");
    const title = node("h4", record.instrument + " · " + record.measure);
    const meta = [record.edition, dateFormat.format(new Date(record.date)), record.source].filter(Boolean).join(" · ");
    details.append(title, node("p", meta));
    const value = node("div", undefined, "record-value");
    value.append(node("strong", record.value), node("span", units[record.unit]));
    const actions = node("div", undefined, "record-actions");
    if (comparisonKey(record)) {
      const compare = action("Compare", () => {
        renderRanking(record);
        $("ranking").focus();
      });
      compare.setAttribute("aria-label", "Compare " + record.instrument + " " + record.measure);
      actions.append(compare);
    }
    const remove = action("Delete", () => {
      const stored = persist(records.filter(item => item.id !== record.id));
      status(stored ? "Result deleted." : "Result removed for this visit. Browser storage is unavailable.");
      $("results-title").setAttribute("tabindex", "-1");
      $("results-title").focus();
    });
    remove.setAttribute("aria-label", "Delete " + record.instrument + " " + record.measure + " result");
    actions.append(remove);
    row.append(details, value, actions);
    return row;
  }) : [node("p", "Your saved results will appear here.", "empty")]));
  renderRanking(records.find(record => record.id === rankedId));
}

for (const provider of providers) $("instrument").add(new Option(provider.name, provider.id));
$("instrument").add(new Option("Other assessment", "other"));
for (const [id, label] of Object.entries(units)) $("unit").add(new Option(label, id));

$("record-form").elements.date.value = localDate();
$("instrument").addEventListener("change", updateInstrument);
$("record-form").addEventListener("submit", event => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  const field = key => values[key].trim();
  const provider = providers.find(item => item.id === values.instrument);
  const instrument = provider?.name ?? field("custom");
  const edition = field("edition");
  const measure = field("measure");
  if (!instrument || !edition || !measure) {
    status("Enter the instrument name, edition and measure.");
    return;
  }
  const unit = values.unit;
  try {
    saveRecords([{
      instrument, edition, measure, value: parseValue(values.value, unit), unit, comparison: field("comparison"),
      date: values.date, source: field("source") || provider?.name || "Self-entered",
    }]);
    event.currentTarget.elements.value.value = "";
  } catch (error) {
    status(error.message);
  }
});
$("export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ schema: storageKey, results: records }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const download = link("Download", url);
  download.download = "nathan-tabor-assessments.json";
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$("category").addEventListener("change", renderDirectory);
$("big-form").addEventListener("submit", event => {
  event.preventDefault();
  collectBigAnswers();
  if ((bigPage + 1) * 5 === ipipItems.length) showBigScore();
  else {
    bigPage++;
    renderBigFive();
    $("big-items").querySelector("input").focus();
  }
});
$("big-back").addEventListener("click", () => {
  collectBigAnswers();
  bigPage--;
  renderBigFive();
  $("big-items").querySelector("input").focus();
});
$("lab-form").addEventListener("submit", event => {
  event.preventDefault();
  showLabScore();
});
document.querySelectorAll("[data-lab]").forEach(button => {
  button.addEventListener("click", () => startLab(button.dataset.lab));
});
window.addEventListener("hashchange", () => showView(true));

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
  if (!Array.isArray(saved)) throw new TypeError("Unexpected result format");
  records = saved;
} catch {
  storageAvailable = false;
  status("Browser storage is unavailable. Results can be exported during this visit.");
}
renderDirectory();
renderBigFive();
updateInstrument();
renderRecords();
showView();
