import { cycleAt, heartbeat, minYear, maxYear, scaleValue, score } from "./model.mjs";

const byId = id => document.getElementById(id);

const year = byId("year");
const windowYear = byId("window");
const yearResult = byId("shared-status");
const earlier = byId("earlier");
const later = byId("later");

function showYear() {
  try {
    if (!year.value.trim()) throw new RangeError("Enter a year.");
    const state = cycleAt(Number(year.value));
    windowYear.value = state.year;
    earlier.disabled = state.year <= minYear;
    later.disabled = state.year >= maxYear;
    state.broods.forEach(b => {
      const lane = document.querySelector('[data-period="' + b.cycleYears + '"]');
      [...lane.children].forEach((tick, i) => tick.classList.toggle("at-phase", i === b.phase));
      byId("phase-" + b.cycleYears).textContent =
        "Phase " + b.phase + " of " + b.cycleYears + (b.scheduled ? " · scheduled this year" : "") +
        " · next emergence " + b.nextYear;
    });
    const current = state.shared ? "both broods scheduled" : "most recent shared year " + state.sharedAtOrBefore;
    yearResult.textContent = state.year + " · " + current + ". Next shared year: " + state.nextSharedYear + ".";
  } catch (error) {
    yearResult.textContent = error.message;
  }
}

const setYear = value => {
  year.value = value;
  showYear();
};
year.addEventListener("input", showYear);
windowYear.addEventListener("input", () => setYear(windowYear.value));
earlier.addEventListener("click", () => setYear(Math.max(minYear, Number(year.value || 2024) - 1)));
later.addEventListener("click", () => setYear(Math.min(maxYear, Number(year.value || 2024) + 1)));
for (const button of document.querySelectorAll("[data-year]")) {
  button.addEventListener("click", () => setYear(button.dataset.year));
}

const tempo = byId("tempo");
const play = byId("play-score");
const stop = byId("stop-score");
const audioStatus = byId("audio-status");
const rows = [...document.querySelectorAll("[data-phrase-row]")];
const midi = { "F♯": 66, "G♯": 68, "A♯": 70, "C♯": 73, "D♯": 75 };
let audio;
let playback;

function stopAudio(message) {
  if (!playback) return;
  for (const timer of playback.timers) clearTimeout(timer);
  for (const voice of playback.voices) voice.stop();
  playback.bus?.disconnect();
  playback = null;
  rows.forEach(row => row.classList.remove("current-phrase"));
  stop.disabled = true;
  audioStatus.textContent = message;
}

function pulse(note, start, length, bus) {
  const oscillator = audio.createOscillator();
  const envelope = audio.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = 440 * 2 ** ((midi[note] - 69) / 12);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(0.075, start + 0.016);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + length);
  oscillator.connect(envelope).connect(bus);
  oscillator.start(start);
  oscillator.stop(start + length);
  return oscillator;
}

async function playPhrases(indices) {
  stopAudio("Playback stopped.");
  const contextConstructor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!contextConstructor) {
    audioStatus.textContent = "Audio is unavailable in this browser.";
    return;
  }
  try {
    audio ??= new contextConstructor();
    const current = { voices: [], timers: [], bus: audio.createGain() };
    playback = current;
    stop.disabled = false;
    await audio.resume();
    if (playback !== current) return;
    current.bus.connect(audio.destination);
    const beat = 60 / Number(tempo.value);
    const origin = audio.currentTime + 0.03;
    let index = 0;
    for (const phraseIndex of indices) {
      const [, count, thumb, pinky] = score[phraseIndex];
      current.timers.push(setTimeout(() => {
        rows.forEach((row, i) => row.classList.toggle("current-phrase", i === phraseIndex));
        audioStatus.textContent = "Playing phrase " + (phraseIndex + 1) + " · " + count + " pulses.";
      }, 1000 * beat * index));
      for (let i = 0; i < count; i++) {
        const start = origin + beat * index++;
        for (const note of [thumb, pinky]) current.voices.push(pulse(note, start, beat * 0.54, current.bus));
      }
    }
    current.timers.push(setTimeout(() => stopAudio("Playback complete."), 1000 * (beat * index + 0.03)));
  } catch {
    stopAudio("Playback unavailable.");
    audioStatus.textContent = "Playback unavailable.";
  }
}

tempo.addEventListener("input", () => { byId("tempo-label").textContent = tempo.value + " BPM"; });
play.addEventListener("click", () => playPhrases(score.map((_, i) => i)));
stop.addEventListener("click", () => stopAudio("Playback stopped."));
for (const button of document.querySelectorAll("[data-phrase]")) {
  button.addEventListener("click", () => playPhrases([Number(button.dataset.phrase)]));
}

let movement = -1;
let movementTimer;
const movementEls = [...document.querySelectorAll("[data-movement]")];
const movementPlay = byId("run-motion");
function showMovement() {
  movementEls.forEach((el, i) => el.classList.toggle("active-motion", movement === i));
  byId("motion-status").textContent =
    movement < 0 ? "17 movements" : (movement + 1) + " / 17 · " + heartbeat[movement];
}
function stopMovement() {
  clearInterval(movementTimer);
  movementTimer = undefined;
  movementPlay.textContent = "Play movements";
}
byId("advance-motion").addEventListener("click", () => {
  stopMovement();
  movement = (movement + 1) % heartbeat.length;
  showMovement();
});
byId("reset-motion").addEventListener("click", () => {
  stopMovement();
  movement = -1;
  showMovement();
});
movementPlay.addEventListener("click", () => {
  if (movementTimer) {
    stopMovement();
    return;
  }
  movement = 0;
  showMovement();
  movementPlay.textContent = "Pause movements";
  movementTimer = setInterval(() => {
    if (movement + 1 === heartbeat.length) return stopMovement();
    movement++;
    showMovement();
  }, 420);
});

const scaleInput = byId("scale-input");
const scaleResult = byId("scale-result");
const scaleFormat = new Intl.NumberFormat("en", {minimumFractionDigits:4, maximumFractionDigits:4});

function updateScale() {
  try {
    if (!scaleInput.value.trim()) throw new RangeError("Enter an input.");
    scaleResult.textContent = scaleFormat.format(scaleValue(Number(scaleInput.value)));
  } catch (error) {
    scaleResult.textContent = error.message;
  }
}
scaleInput.addEventListener("input", updateScale);
for (const button of document.querySelectorAll("[data-scale]")) {
  button.addEventListener("click", () => { scaleInput.value = button.dataset.scale; updateScale(); });
}

const search = byId("archive-search");
const branch = byId("archive-branch");
const records = [...document.querySelectorAll("[data-record]")];
function filterRecords() {
  const query = search.value.trim().toLowerCase();
  let count = 0;
  for (const row of records) {
    row.hidden = Boolean(branch.value && branch.value !== row.dataset.branch) ||
      !row.textContent.toLowerCase().includes(query);
    if (!row.hidden) count++;
  }
  byId("record-count").textContent = count + (count === 1 ? " record" : " records");
  byId("no-records").hidden = count > 0;
}
search.addEventListener("input", filterRecords);
branch.addEventListener("change", filterRecords);
