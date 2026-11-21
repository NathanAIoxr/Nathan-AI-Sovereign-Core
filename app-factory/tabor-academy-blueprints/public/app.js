import { flows, glossary, mysteries, rankedLessons, scales } from "./explorers.js";

import { blueprintCode, fieldQr, openField, openHunt, setupField } from "./field.js";

import { answerColumns, answerLayer } from "./answer-layer.js";
import { offlineCurriculum, verifiedCurriculum } from "./sync.js";
import { identifySnapshot } from "../shared/merkle.js";

const byId = id => document.getElementById(id);
const mode = byId("investigative-mode");
const tier = byId("tier");
const status = byId("lesson-status");
const list = byId("lessons");
const search = byId("blueprint-search");

let lessons = [];
const diagrams = new Map();
let activeRequest;
let allLessons;
let room = null;
let roomPending = false;
let revealed = new Set();
let recentMystery = -1;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function button(label, action) {
  const control = element("button", label);
  control.type = "button";
  control.addEventListener("click", action);
  return control;
}

function event(type, detail) {
  if (globalThis.ACADEMY_OFFLINE || !navigator.onLine) return;
  const body = type === "lesson" ? { type, lessonId: detail } : { type, detail };
  void fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body), keepalive: true }).catch(() => {});
}

function clearPrint() {
  document.body.classList.remove("print-single");
  list.querySelector(".print-current")?.classList.remove("print-current");
}
window.addEventListener("afterprint", clearPrint);

function lessonCard(lesson) {
  const card = element("article", null, "lesson");
  const header = element("header", null, "lesson-header");
  const heading = element("h2", null, "comparison");
  const labels = [lesson.item_a_label, lesson.item_b_label, lesson.item_c_label].filter(Boolean);
  labels.forEach((label, index) => {
    if (index > 0) heading.append(element("span", " vs. ", "versus"));
    heading.append(element("span", label));
  });
  heading.id = `lesson-${lesson.id}`;
  card.setAttribute("aria-labelledby", heading.id);
  header.append(element("p", `Lesson ${lesson.id} · ${lesson.tier} · ${lesson.domain}`, "classification"), heading);
  card.append(header, element("p", lesson.clue_prompt, "clue"));

  const visible = !mode.checked || (room ? room.lessonId === lesson.id && room.revealed : revealed.has(lesson.id));
  const answers = answerLayer(document, lesson, visible);
  card.append(answers);
  if (visible && diagrams.has(lesson.id)) {
    const figure = element("figure", null, "lesson-diagram");
    const image = element("img");
    image.src = `/api/diagram/${lesson.id}`;
    image.alt = diagrams.get(lesson.id);
    image.loading = "lazy";
    image.width = 1080;
    image.height = 520;
    figure.append(image);
    card.append(figure);
  }

  const signature = element("aside", null, "card-signature");
  signature.append(fieldQr(lesson.id), element("strong", blueprintCode(lesson.id)));
  card.append(signature);

  const actions = element("div", null, "card-actions");
  if (!globalThis.ACADEMY_OFFLINE) actions.append(button("Found Another Twin!", () => openField(lesson)));
  if (mode.checked) {
    const reveal = button(visible ? "Hide blueprint" : "Reveal blueprint", async () => {
      if (room) {
        if (await updateRoom({ lessonId: lesson.id, revealed: !visible })) event("lesson", lesson.id);
      } else {
        if (visible) revealed.delete(lesson.id);
        else {
          revealed.add(lesson.id);
          event("lesson", lesson.id);
        }
        render();
      }
      list.querySelector(`[aria-controls="answers-${lesson.id}"]`)?.focus();
    });
    reveal.setAttribute("aria-controls", answers.id);
    reveal.setAttribute("aria-expanded", String(visible));
    actions.append(reveal);
    if (!globalThis.ACADEMY_OFFLINE) actions.append(button("Finish hunt", () => openHunt(lesson, answerColumns, getAllLessons, viewLesson)));
  }
  if (room && room.lessonId !== lesson.id) {
    actions.append(button("Share clue", () => updateRoom({ lessonId: lesson.id, revealed: false })));
  }
  actions.append(button("Print 3×5 field card", async () => {
    clearPrint();
    document.body.classList.add("print-single");
    card.classList.add("print-current");
    event("lesson", lesson.id);
    event("print", "printed");
    await signature.querySelector("img").decode().catch(() => {});
    window.print();
  }));
  card.append(actions);
  return card;
}

function render() {
  byId("active-mode").textContent = mode.checked ? "Investigative Mode" : "Instant Blueprint Mode";
  const shared = byId("shared-lesson");
  shared.hidden = !room?.lessonId;
  if (!shared.hidden) {
    const view = button(`Open shared lesson ${room.lessonId}`, () => viewLesson(room.lessonId));
    shared.replaceChildren(`Room shared ${room.revealed ? "a blueprint" : "a clue"}. `, view);
  }
  list.replaceChildren(...lessons.map(lessonCard));
}

async function getLessons(params, signal) {
  if (!globalThis.ACADEMY_OFFLINE && navigator.onLine) {
    try {
      if (!params.has("q")) {
        const fresh = await verifiedCurriculum(signal);
        if (fresh) return params.has("tier") ? fresh.rows.filter(row => row.tier === params.get("tier")) : fresh.rows;
      }
      const result = await fetch(`/api/lessons${params.size ? "?" + params : ""}`, { signal });
      if (!result.ok) throw new Error(`Lesson request failed (${result.status})`);
      return result.json();
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
    }
  }
  const local = globalThis.ACADEMY_OFFLINE ? null : await offlineCurriculum().catch(() => null);
  if (local && (await identifySnapshot(local.rows)).root !== local.manifest.root) {
    throw new Error("Offline curriculum integrity check failed");
  }
  const snapshot = globalThis.ACADEMY_OFFLINE ?? local?.rows ?? await (await fetch("/exports/blueprints.json", { signal })).json();
  const filter = params.get("tier");
  const rows = filter ? snapshot.filter(row => row.tier === filter) : snapshot;
  return params.has("q") ? rankedLessons(rows, params.get("q")) : rows;
}

async function getAllLessons() {
  allLessons ??= await getLessons(new URLSearchParams());
  return allLessons;
}

async function viewLesson(id) {
  tier.value = "";
  search.value = "";
  await loadLessons();
  const heading = byId(`lesson-${id}`);
  if (!heading) return;
  heading.tabIndex = -1;
  heading.focus();
  heading.scrollIntoView({ block: "start" });
}

async function loadLessons() {
  activeRequest?.abort();
  const request = new AbortController();
  activeRequest = request;
  const params = new URLSearchParams();
  if (tier.value) params.set("tier", tier.value);
  if (search.value.trim()) params.set("q", search.value.trim());
  byId("search-clear").hidden = !params.has("q");

  status.replaceChildren("Loading lessons…");
  try {
    const rows = await getLessons(params, request.signal);
    if (activeRequest !== request) return;
    if (!params.size) allLessons = rows;
    lessons = rows;
    render();
    status.textContent = rows.length ? `${rows.length} ${rows.length === 1 ? "lesson" : "lessons"}` : "No matching blueprints.";
  } catch (error) {
    if (error.name === "AbortError" || activeRequest !== request) return;
    status.replaceChildren("Lessons could not be loaded. ", button("Retry", loadLessons));
  }
}

byId("search-form").addEventListener("submit", action => {
  action.preventDefault();
  void loadLessons();
});
byId("search-clear").addEventListener("click", () => {
  search.value = "";
  search.focus();
  void loadLessons();
});
tier.addEventListener("change", loadLessons);
mode.addEventListener("change", async () => {
  const investigative = mode.checked;
  if (room && !await updateRoom({ investigative }) && room) mode.checked = room.investigative;
  render();
  event("mode", investigative ? "investigative" : "instant");
});

byId("mystery-button").addEventListener("click", async () => {
  const panel = byId("mystery");
  panel.hidden = false;
  const candidates = mysteries.map((pair, index) => ({ pair, index })).filter(({ index }) => index !== recentMystery);
  const { pair, index } = candidates[Math.floor(Math.random() * candidates.length)];
  recentMystery = index;
  try {
    await getAllLessons();
    if (recentMystery !== index) return;
    const rows = pair.ids.map(id => allLessons.find(row => row.id === id));
    if (rows.some(row => !row)) throw new Error("Mystery lesson missing");
    const answer = element("p");
    answer.hidden = true;
    const reveal = button("Reveal the connection", () => {
      answer.hidden = !answer.hidden;
      answer.textContent = answer.hidden ? "" : pair.answer;
      reveal.textContent = answer.hidden ? "Reveal the connection" : "Hide the connection";
      reveal.setAttribute("aria-expanded", String(!answer.hidden));
    });
    reveal.setAttribute("aria-expanded", "false");
    panel.replaceChildren(element("h2", rows.map(row => row.item_a_label).join(" × ")),
      element("p", rows.map(row => row.domain).join(" / "), "classification"),
      element("p", pair.clue), reveal, answer);
    event("mystery", "opened");
  } catch {
    panel.textContent = "This mystery could not be loaded. Try another pair.";
  }
});

const flowType = byId("flow-type");
let reversed = false;
for (const flow of flows) flowType.append(element("option", flow.name));
function drawFlow() {
  const flow = flows[flowType.selectedIndex];
  byId("flow-left").textContent = flow.left;
  byId("flow-right").textContent = flow.right;
  byId("flow-arrow").classList.toggle("is-reversed", reversed);
  byId("flow-result").textContent = reversed
    ? `${flow.reverse}: ${flow.right} → ${flow.left}`
    : `${flow.forward}: ${flow.left} → ${flow.right}`;
  byId("flow-detail").textContent = flow.detail;
}
flowType.addEventListener("change", () => { reversed = false; drawFlow(); });
byId("flow-flip").addEventListener("click", () => { reversed = !reversed; drawFlow(); });
drawFlow();

const scale = byId("scale");
function drawScale() {
  const index = Number(scale.value);
  const [name, size, explanation] = scales[index];
  scale.setAttribute("aria-valuetext", name);
  byId("scale-shape").style.width = `${size}px`;
  byId("scale-shape").style.borderWidth = `${4 + index * 2}px`;
  byId("scale-result").textContent = `${name} · ${explanation}`;
}
scale.addEventListener("input", drawScale);
drawScale();

for (const term of Object.keys(glossary)) byId("terms").append(element("option", term));
byId("vocabulary-form").addEventListener("submit", action => {
  action.preventDefault();
  const term = byId("term").value.toLowerCase().trim();
  const result = byId("definition");
  if (!term) { result.textContent = "Enter a term."; return; }
  if (!Object.hasOwn(glossary, term)) {
    result.replaceChildren(element("p", `The glossary has no entry for “${term}.”`),
      button("Search blueprints for this term", () => { search.value = term; void loadLessons(); }));
    return;
  }
  const [meaning, example, query] = glossary[term];
  result.replaceChildren(element("p", meaning), element("p", example),
    button("Find related blueprints", () => { search.value = query; void loadLessons(); }));
});

const codeField = byId("room-code");
const roomStatus = byId("room-status");

async function roomRequest(method, code, change) {
  const headers = {};
  if (code) headers["X-Room-Code"] = code;
  if (change) headers["Content-Type"] = "application/json";
  const result = await fetch("/api/classroom", { method, headers, body: change && JSON.stringify(change) });
  const data = await result.json();
  if (!result.ok) throw Object.assign(new Error(data.error), { status: result.status });
  return data;
}

function displayRoom(next) {
  room = next;
  byId("room-leave").hidden = !room;
  if (room) {
    mode.checked = room.investigative;
    codeField.value = room.code;
    const expiry = new Date(room.expiresAt * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    roomStatus.textContent = `Connected. Share the room code. Expires at ${expiry}.`;
  }
  render();
}

async function enterRoom(method, code) {
  if (roomPending) return;
  roomPending = true;
  try {
    const state = await roomRequest(method, code);
    displayRoom({ ...state, code: state.code ?? code });
  } catch (error) {
    roomStatus.textContent = error.message;
  } finally {
    roomPending = false;
  }
}

async function updateRoom(change) {
  if (!room || roomPending) return false;
  const current = room;
  roomPending = true;
  try {
    const { revision, investigative, lessonId, revealed } = current;
    const state = await roomRequest("POST", current.code, { revision, investigative, lessonId, revealed, ...change });
    if (room !== current) return false;
    displayRoom({ ...state, code: current.code });
    return true;
  } catch (error) {
    if (room === current) roomStatus.textContent = error.message;
    return false;
  } finally {
    roomPending = false;
  }
}

async function refreshRoom() {
  if (!room || roomPending || document.hidden) return;
  const current = room;
  try {
    const latest = await roomRequest("GET", current.code);
    if (room === current && !roomPending && latest.revision !== current.revision) {
      displayRoom({ ...latest, code: current.code });
    }
  } catch (error) {
    if (room === current && error.status === 404) {
      displayRoom(null);
      roomStatus.textContent = error.message;
    }
  }
}

byId("room-form").addEventListener("submit", action => {
  action.preventDefault();
  const code = codeField.value.trim().toLowerCase().replace(/-/g, "");
  if (!/^[a-f0-9]{32}$/.test(code)) { roomStatus.textContent = "Enter the complete room code."; return; }
  void enterRoom("GET", code);
});
byId("room-make").addEventListener("click", () => enterRoom("POST"));
byId("room-leave").addEventListener("click", () => {
  if (roomPending) return;
  roomStatus.textContent = "You left the room.";
  codeField.value = "";
  displayRoom(null);
});
window.setInterval(refreshRoom, 2000);
document.addEventListener("visibilitychange", refreshRoom);
mode.checked = false;
const fieldLink = new URL(location.href).searchParams.get("lesson");
if (/^TA-\d{3,9}$/i.test(fieldLink ?? "")) {
  void viewLesson(Number(fieldLink.slice(3)));
} else {
  void loadLessons();
}
setupField();

if (!globalThis.ACADEMY_OFFLINE) void fetch("/api/diagrams").then(response => response.ok ? response.json() : [])
  .then(records => {
    for (const record of records) diagrams.set(record.lesson_id, record.alt_text);
    if (diagrams.size) render();
  }).catch(() => {});
