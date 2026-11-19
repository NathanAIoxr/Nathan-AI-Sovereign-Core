import {createHive} from "./hive.mjs";
import {bees, voices} from "./registry.mjs";

const who = id => document.getElementById(id);
const button = (label, listener) => {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = label;
  element.addEventListener("click", listener);
  return element;
};

export function mountHive({modules, classes, v7Ledger}) {
  const {surface, owner} = createHive({
    modules, classes, v7Ledger,
    storage: {
      getItem: key => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
    },
  });
  const voice = who("hive-voice"), chaos = who("hive-chaos");
  const mode = who("ant-mode"), plane = who("ant-plane"), reveal = who("ant-reveal");
  const template = who("ant-template"), panel = who("hive-ant"), status = who("hive-status");
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  let lastAntTime = performance.now(), frame = 0;

  function advanceClock(time) {
    const phases = owner.tickAnt(Math.max(0, time - lastAntTime) / 900);
    lastAntTime = time;
    return phases;
  }

  function paintAnt(time) {
    const {left, right, axis} = advanceClock(time);
    if (reveal.checked) {
      who("ant-right").setAttribute("opacity", mode.value === "reverse" ? ".2" : "1");
      who("ant-left").setAttribute("opacity", mode.value === "forward" ? ".2" : "1");
      who("ant-right").setAttribute("transform", "rotate(" + right * 180 / Math.PI + " 80 50)");
      who("ant-left").setAttribute("transform", "rotate(" + left * 180 / Math.PI + " 80 50)");
      who("ant-axis").setAttribute("transform", "rotate(" + axis * 180 / Math.PI + " 80 50)");
      template.hidden = false;
    } else template.hidden = true;
    if (panel.open && reveal.checked && !media.matches) frame = requestAnimationFrame(paintAnt);
  }

  function syncAnt() {
    const time = performance.now();
    advanceClock(time);
    owner.setAnt({mode: mode.value, plane: plane.value, visible: reveal.checked});
    who("ant-state").textContent = (mode.value === "counterspin" ? "Left and right streams active" : mode.value + " stream active") +
      " · " + plane.value + " axis";
    cancelAnimationFrame(frame);
    paintAnt(time);
  }

  for (const element of [mode, plane, reveal]) element.addEventListener("change", syncAnt);
  panel.addEventListener("toggle", syncAnt);
  media.addEventListener("change", syncAnt);

  function render(snapshot = surface.read()) {
    who("hive-cast-output").textContent = snapshot.voice.name;
    who("hive-cast-line").textContent = snapshot.voice.text;
    who("hive-surface-voice").textContent = snapshot.voice.name + " · " + snapshot.voice.text;
    who("hive-lesson").textContent = snapshot.learning
      ? "Level " + snapshot.learning.level + " · " + snapshot.learning.successes + " checkpoints · " +
        snapshot.economy.coins + " Hive rewards" : "";
    who("hive-route").textContent = snapshot.lastRoute.map(id => bees[id].name).join(" → ");
    const reference = snapshot.provenance;
    who("hive-ref").textContent = reference ? reference.cartridge + " · LC Class " + reference.classCode : "";
    who("hive-source").hidden = !reference;
    if (reference) who("hive-source").href = reference.source;
    who("hive-links").replaceChildren(...snapshot.indexedClasses.map(code => button(
      "Class " + code, () => {
        const filter = who("class-filter");
        filter.value = code;
        filter.dispatchEvent(new Event("change"));
        filter.focus();
      },
    )));
  }

  surface.subscribe(({snapshot}) => render(snapshot));
  for (const [id, metadata] of Object.entries(voices)) voice.add(new Option(metadata.name, id));
  for (const element of [voice, chaos]) element.addEventListener("change", () => {
    owner.setCast({voice: voice.value, chaos: chaos.checked});
    render();
  });
  const domains = who("hive-domains");
  for (const bee of Object.values(bees)) {
    const term = document.createElement("dt"), definition = document.createElement("dd");
    term.textContent = bee.name;
    definition.textContent = bee.domain;
    domains.append(term, definition);
    if (bee.technology) who("hive-domain-picker").add(new Option(bee.name, bee.id));
  }

  const deviceForm = who("hive-device-form");
  deviceForm.addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(deviceForm);
    try {
      const registered = owner.registerDevice({id: crypto.randomUUID(), name: form.get("device-name"),
        domain: form.get("device-domain"), consent: form.has("device-consent"), grants: ["observe"]});
      const entry = document.createElement("li");
      entry.textContent = registered.name + " · " + bees[registered.domain].name + " · observation granted ";
      entry.append(button("Revoke", () => { owner.revokeDevice(registered.id); entry.remove(); }));
      who("hive-devices").append(entry);
      deviceForm.reset();
    } catch (error) { status.textContent = error.message; }
  });

  const frameDialog = who("hive-surface-dialog"), iframe = who("hive-surface-frame");
  let embedded = null, returnModule;
  const embeddedApps = {
    "universal-library": {title: "v.7 Tabor Universal Library Engine", path: "../../tabor-universal-library-engine/public/index.html"},
    arcade: {title: "Dual-Screen Arcade", path: "../../games/dual-screen-arcade/index.html"},
    "track-baller": {title: "Tabor Tracker Ball", path: "./index.html"},
  };
  for (const launcher of document.querySelectorAll("[data-hive-surface]")) {
    launcher.addEventListener("click", () => {
      const next = launcher.dataset.hiveSurface;
      const app = embeddedApps[next];
      embedded = next;
      const module = Number(launcher.dataset.hiveModule ?? 101);
      surface.emit("module.open", {module, surface: next});
      who("hive-surface-title").textContent = app.title;
      iframe.title = app.title;
      const url = new URL(app.path, location.href);
      url.searchParams.set("hive", "9");
      if (launcher.dataset.hiveModule) url.searchParams.set("module", launcher.dataset.hiveModule);
      iframe.src = url.href;
      frameDialog.showModal();
    });
  }
  who("hive-surface-close").addEventListener("click", () => frameDialog.close());
  frameDialog.addEventListener("close", () => {
    iframe.removeAttribute("src");
    embedded = null;
    document.dispatchEvent(new CustomEvent("tabor-hive:surface-return", {detail: {module: returnModule}}));
    returnModule = undefined;
  });
  window.addEventListener("message", event => {
    if (event.origin !== location.origin || event.source !== iframe.contentWindow || !embedded ||
        event.data?.channel !== "tabor-hive-v9" || event.data.surface !== embedded) return;
    const {type, payload} = event.data;
    if (embedded === "universal-library" && type === "surface.ready") {
      iframe.contentWindow.postMessage({channel: "tabor-hive-v9", type: "cast.setting",
        chaos: surface.read().pk}, location.origin);
      return;
    }
    if (embedded === "universal-library" && type === "vault.open") {
      frameDialog.close();
      who("hive-vault").open = true;
      who("hive-vault").querySelector("summary").focus();
      return;
    }
    if (embedded === "universal-library" && type === "catalog.open" &&
        Number.isInteger(payload?.module) && payload.module >= 1 && payload.module <= 101) {
      returnModule = payload.module;
      frameDialog.close();
      return;
    }
    const allowed = type === "interaction.summary" && payload?.surface === embedded ||
      type === "module.open" && embedded === "universal-library" && payload?.surface === embedded ||
      type === "bridge.clear" && ["arcade", "universal-library"].includes(embedded);
    if (!allowed) return;
    try {
      surface.emit(type, payload);
      const snapshot = surface.read();
      who("hive-surface-status").textContent = type === "bridge.clear"
        ? "Universal Bridge · " + snapshot.economy.bridgeClears + " clears · " + snapshot.economy.coins + " Hive rewards"
        : type === "interaction.summary" ? "Tactile input · " + payload.kind : "";
    } catch { owner.report("data-boundary"); }
  });
  document.addEventListener("tabor-hive:surface-return", () => {
    who("hive-surface-status").textContent = "";
  });

  const circuit = who("hive-circuit");
  const toggleA = who("circuit-a"), toggleB = who("circuit-b"), circuitMode = who("circuit-mode");
  function circuitState() {
    const light = circuitMode.value === "series" ? toggleA.checked && toggleB.checked : toggleA.checked || toggleB.checked;
    who("circuit-lamp").textContent = light ? "Lamp on · closed path" : "Lamp off · open path";
    who("circuit-lamp").classList.toggle("lit", light);
    if (circuit.open) {
      owner.authorizeDevice({id: circuitDevice, capability: "simulate"});
      surface.emit("interaction.summary", {surface: "circuit", kind: "tap"});
    }
  }
  const circuitDevice = "virtual-circuit";
  owner.registerDevice({id: circuitDevice, name: "Circuit Lab", domain: "hardware", grants: ["simulate"], consent: true});
  circuit.addEventListener("toggle", circuitState);
  for (const control of [toggleA, toggleB, circuitMode]) control.addEventListener("change", circuitState);

  const vault = owner.memory;
  const unlock = who("vault-unlock"), edit = who("vault-edit"), list = who("vault-notes"), output = who("vault-status");
  function showNotes(notes) {
    list.replaceChildren(...notes.map(note => {
      const entry = document.createElement("li"), copy = document.createElement("p");
      copy.textContent = note.text;
      const tag = document.createElement("small");
      tag.textContent = "Cartridge " + note.module;
      entry.append(copy, tag, button("Remove", async () => {
        try {
          if (!who("vault-delete-consent").checked) throw new Error("Confirm removal first.");
          showNotes(await vault.write({consent: true, remove: note.id}));
          who("vault-delete-consent").checked = false;
          output.textContent = "Note removed.";
        } catch (error) { output.textContent = error.message; }
      }));
      return entry;
    }));
  }

  unlock.addEventListener("submit", async event => {
    event.preventDefault();
    const pass = who("vault-pass");
    try {
      await vault.unlock(pass.value);
      unlock.hidden = true;
      edit.hidden = false;
      showNotes(vault.read());
      output.textContent = "Z-101 unlocked.";
    } catch { output.textContent = "Z-101 could not open. Check the passphrase and browser storage."; }
    finally { pass.value = ""; }
  });
  who("vault-lock").addEventListener("click", () => {
    try {
      vault.lock();
      edit.reset();
      edit.hidden = true;
      unlock.hidden = false;
      list.replaceChildren();
      output.textContent = "Z-101 locked.";
    } catch (error) { output.textContent = error.message; }
  });
  edit.addEventListener("submit", async event => {
    event.preventDefault();
    const active = surface.read().active?.module;
    const note = who("vault-note"), consent = who("vault-consent");
    try {
      showNotes(await vault.write({consent: consent.checked, module: active, note: note.value}));
      note.value = "";
      consent.checked = false;
      output.textContent = "Note sealed in Z-101 on this device.";
    } catch (error) { output.textContent = error.message; }
  });
  syncAnt();
  render();
  return surface;
}
