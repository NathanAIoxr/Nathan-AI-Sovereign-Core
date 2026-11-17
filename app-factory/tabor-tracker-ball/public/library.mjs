import { attachDigitTrackBaller } from "./digit-input.mjs";
import { applyCharge, cartridgeRecord, cast, clearRecords, initialRound, pilots, searchRecords, toggleRecord, verifySelection } from "./library-core.mjs";

const get = id => document.getElementById(id);
const make = (name, text) => {
  const element = document.createElement(name);
  if (text) element.textContent = text;
  return element;
};
const button = (text, handler) => {
  const element = make("button", text);
  element.type = "button";
  element.addEventListener("click", handler);
  return element;
};

async function start() {
  const response = await fetch(new URL("./library-catalog.json", import.meta.url));
  if (!response.ok) throw Error("The catalog could not be loaded.");
  const { classes, cartridges, trackerDraft } = await response.json();
  const url = new URL(location.href);
  let source = url.searchParams.get("source") === "tracker" ? "tracker" : "main";
  let item;
  let pilot;
  let round = initialRound();
  let reversed = false;
  let feedback = "";
  let revision = 0;
  let gestureRevision;
  const slots = ["A", "B", "C"];

  for (const [code, title] of Object.entries(classes)) {
    const option = make("option", code + " · " + title);
    option.value = code;
    get("category").append(option);
  }

  function renderBrowse() {
    const list = source === "main" ? cartridges : trackerDraft;
    const status = source === "main" ? get("status").value : "";
    const results = searchRecords(list, { text: get("search").value, category: get("category").value, status });
    get("results").textContent = results.length + " of " + list.length + (source === "main" ? " applications" : " draft records");
    const children = results.map(entry => {
      const li = make("li");
      const control = button(entry.id + " · " + entry.title, () => select(entry, true));
      control.classList.toggle("active", item?.id === entry.id);
      if (item?.id === entry.id) control.setAttribute("aria-current", "true");
      li.append(control);
      return li;
    });
    get("cartridges").replaceChildren(...children);
  }

  function renderRound() {
    get("charge").textContent = round.charge;
    get("points").textContent = round.points;
    get("feedback").textContent = feedback;
    get("verify").disabled = round.verified || round.selected.length === 0;
    get("clear").disabled = round.verified || round.selected.length === 0;
    get("apply").disabled = round.charge === 0;
    get("surface-status").textContent = round.completed ? "Charge used. One point recorded." :
      round.charge > 0 ? "Roll, flick, pinch and release, or use the button." : "Build a pair to earn charge.";
    const order = reversed ? slots.slice().reverse() : slots;
    const options = order.map(slot => {
      const card = pilot.records[slots.indexOf(slot)];
      const choice = button(card.label, () => {
        round = toggleRecord(round, slot);
        feedback = round.selected.length + " selected";
        renderRound();
        get("choices").querySelector('[data-slot="' + slot + '"]').focus();
      });
      choice.dataset.slot = slot;
      choice.setAttribute("aria-pressed", String(round.selected.includes(slot)));
      choice.disabled = round.verified;
      return choice;
    });
    get("choices").replaceChildren(...options);
  }

  function runAction() {
    const next = applyCharge(round);
    if (next === round) return;
    round = next;
    feedback = "One recorded action";
    renderRound();
  }

  function reset(trayReversed = false) {
    revision++;
    round = initialRound();
    reversed = trayReversed;
    feedback = "";
    if (pilot) renderRound();
  }

  function select(entry, focus = false) {
    item = entry;
    pilot = source === "main" && pilots[entry.id];
    get("entry-title").textContent = entry.title;
    get("entry-description").textContent = entry.description || "The supplied draft stops during this entry.";
    get("entry-meta").textContent = source === "main" ?
      ["Class " + entry.class, entry.suggestedCode, entry.profile, pilot ? "Shared exercise" : "Design record"].join(" · ") :
      "Tracker Ball draft · " + entry.id + " · Class " + entry.class;
    const note = source === "main" ?
      [entry.classificationNote, entry.sourceTitle && "Source title: " + entry.sourceTitle].filter(Boolean).join(" ") :
      (!entry.complete ? "The remaining draft entries were absent from the attachment." : "");
    get("entry-note").hidden = !note;
    get("entry-note").textContent = note;
    const gameLink = get("game-link");
    gameLink.hidden = !entry.game;
    if (entry.game) gameLink.href = "./?game=" + encodeURIComponent(entry.game);
    const links = (entry.related ?? []).map(id => {
      const related = cartridges.find(candidate => candidate.id === id);
      const li = make("li");
      li.append(button(related.title, () => switchSource("main", related.id, true)));
      return li;
    });
    get("related").replaceChildren(...links);
    get("related").hidden = links.length === 0;
    const record = source === "main" ? cartridgeRecord(entry) : null;
    get("record").hidden = !record;
    if (record) {
      const fields = ["attributes", "characteristics", "functionalities", "traits"];
      get("record-fields").replaceChildren(...fields.flatMap(key => [make("dt", key), make("dd", record[key].join(" · "))]));
    }
    get("entry-actions").hidden = false;
    get("bridge").hidden = !pilot;
    if (pilot) get("goal").textContent = pilot.goal;
    reset();
    url.searchParams.set("source", source);
    url.searchParams.set("id", entry.id);
    history.replaceState(null, "", url);
    renderBrowse();
    if (focus) get("entry-title").focus({ preventScroll: false });
  }

  function switchSource(next, id, focus = false) {
    source = next;
    get("main-source").setAttribute("aria-pressed", String(source === "main"));
    get("tracker-source").setAttribute("aria-pressed", String(source === "tracker"));
    get("status-label").hidden = source !== "main";
    get("search").value = "";
    get("category").value = "";
    get("status").value = "";
    const list = source === "main" ? cartridges : trackerDraft;
    select(list.find(entry => entry.id === id) ?? list[0], focus);
  }

  get("main-source").addEventListener("click", () => switchSource("main"));
  get("tracker-source").addEventListener("click", () => switchSource("tracker"));
  get("search").addEventListener("input", renderBrowse);
  get("category").addEventListener("change", renderBrowse);
  get("status").addEventListener("change", renderBrowse);
  get("verify").addEventListener("click", () => {
    const next = verifySelection(round, pilot.required);
    feedback = next === round ? "Check the record IDs, then try again." : "Pair verified. One charge added.";
    round = next;
    renderRound();
  });
  get("apply").addEventListener("click", runAction);
  get("clear").addEventListener("click", () => {
    round = clearRecords(round);
    feedback = "Zero selected";
    renderRound();
  });
  get("restart").addEventListener("click", () => reset());
  get("download").addEventListener("click", () => {
    const payload = source === "main" ? { source: item, cartridge: cartridgeRecord(item), exercise: pilot || null } : { draft: item };
    const file = new Blob([JSON.stringify(payload, null, 2) + "\n"], { type: "application/json" });
    const href = URL.createObjectURL(file);
    const link = make("a");
    link.href = href;
    link.download = "tabor-" + source + "-" + item.id + ".json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  });

  for (const actor of cast) {
    const row = make("p");
    row.append(make("strong", actor.label + " "), document.createTextNode(actor.functionalities.join(", ")));
    if (actor.id === "pk") row.append(" ", button("Reverse tray order", () => reset(!reversed)));
    get("cast").append(row);
  }

  attachDigitTrackBaller(get("surface"), {
    onStart() { gestureRevision = revision; },
    onGripStart() { gestureRevision = revision; },
    onEnd(detail) {
      if (gestureRevision === revision && detail.kind !== "tap") runAction();
    },
    onGripEnd(detail) {
      if (gestureRevision === revision && detail.peakContacts > 1) runAction();
    }
  });

  switchSource(source, Number(url.searchParams.get("id")));
}

start().catch(error => {
  get("results").textContent = "Catalog unavailable. Reload to try again.";
  console.error(error);
});
