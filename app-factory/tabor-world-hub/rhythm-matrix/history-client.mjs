import { patterns, periods, periodRatio } from "./history-lab.mjs";

const byId = id => document.getElementById(id);
const normalize = value => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const search = byId("history-search");
const era = byId("history-era");
const domain = byId("history-domain");
const groups = Array.from(document.querySelectorAll("[data-era-group]"), group => ({
  group,
  entries: Array.from(group.querySelectorAll("[data-history-record]"), entry => ({ entry, terms: normalize(entry.textContent) }))
}));

function filter() {
  const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
  let count = 0;
  for (const { group, entries } of groups) {
    let visible = 0;
    for (const { entry, terms: text } of entries) {
      const matches = (!era.value || entry.dataset.era === era.value)
        && (!domain.value || entry.dataset.domain === domain.value)
        && terms.every(term => text.includes(term));
      entry.hidden = !matches;
      visible += Number(matches);
    }
    group.hidden = visible === 0;
    count += visible;
  }
  byId("history-count").textContent = count ? `${count} ${count === 1 ? "entry" : "entries"}` : "No matching entries.";
}

search.addEventListener("input", filter);
era.addEventListener("change", filter);
domain.addEventListener("change", filter);
function clearFilters() {
  search.value = "";
  era.value = "";
  domain.value = "";
  filter();
}
byId("history-clear").addEventListener("click", clearFilters);
document.querySelector(".era-index").addEventListener("click", clearFilters);
filter();

const patternInput = byId("pattern");
const tempo = byId("pattern-tempo");
const grid = byId("pattern-grid");
const play = byId("pattern-play");
const stop = byId("pattern-stop");
const status = byId("pattern-status");
const getPattern = () => patterns.find(p => p.id === patternInput.value);
let audio;
let pulseSources = [];
let finish;
let playback = 0;

function stopPattern(message) {
  playback += 1;
  clearTimeout(finish);
  for (const oscillator of pulseSources) oscillator.stop();
  pulseSources = [];
  play.disabled = false;
  stop.disabled = true;
  status.textContent = message;
}

function drawPattern() {
  const { steps, overlay } = getPattern();
  grid.replaceChildren();
  for (const [i, accent] of steps.entries()) {
    const mark = document.createElement("span");
    mark.className = accent === 2 ? "strong-beat" : accent === 1 ? "beat" : "rest";
    mark.textContent = accent === 2 ? "●" : accent === 1 ? "•" : "–";
    if (overlay?.[i]) mark.textContent += " +";
    mark.setAttribute("aria-label", `Pulse ${i + 1}, ${accent === 2 ? "accent" : accent === 1 ? "beat" : "upper part rests"}${overlay?.[i] ? ", lower part beat" : ""}`);
    grid.append(mark);
  }
}

function clickAt(time, frequency, volume) {
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(time);
  oscillator.stop(time + 0.075);
  pulseSources.push(oscillator);
}

play.addEventListener("click", async () => {
  const run = ++playback;
  play.disabled = true;
  stop.disabled = false;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    await audio.resume();
    if (run !== playback) return;
    const { steps, overlay, beats } = getPattern();
    const stepSeconds = 60 / Number(tempo.value) * beats / steps.length;
    const start = audio.currentTime + 0.04;
    for (let i = 0; i < steps.length * 2; i += 1) {
      const index = i % steps.length;
      const at = start + stepSeconds * i;
      if (steps[index]) clickAt(at, steps[index] === 2 ? 880 : 620, 0.16);
      if (overlay?.[index]) clickAt(at, 330, 0.14);
    }
    status.textContent = "Playing two cycles.";
    finish = setTimeout(() => stopPattern("Playback finished."), (2 * steps.length * stepSeconds + 0.12) * 1000);
  } catch {
    if (run === playback) stopPattern("Audio playback is unavailable in this browser.");
  }
});
stop.addEventListener("click", () => stopPattern("Playback stopped."));
patternInput.addEventListener("change", () => {
  stopPattern("Audio starts when you press Play.");
  drawPattern();
});
tempo.addEventListener("input", () => { byId("pattern-bpm").textContent = tempo.value + " BPM"; });
drawPattern();

const periodValues = new Map(periods.map(([key, , seconds]) => [key, seconds]));
const first = byId("period-first");
const second = byId("period-second");
const number = new Intl.NumberFormat("en", { maximumSignificantDigits: 5 });
const format = value => value < 0.001 || value >= 1e9 ? value.toExponential(3) : number.format(value);
function compare() {
  const a = periodValues.get(first.value);
  const b = periodValues.get(second.value);
  byId("period-output").textContent = `First ≈ ${format(a)} s. Second ≈ ${format(b)} s. Second ÷ first ≈ ${format(periodRatio(a, b))}.`;
}
first.addEventListener("change", compare);
second.addEventListener("change", compare);
compare();

document.querySelectorAll(".history-tools, .lab-controls").forEach(node => { node.hidden = false; });
