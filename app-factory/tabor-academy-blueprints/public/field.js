import qrcode from "qrcode-generator";
import { discardObservation, flushOutbox, hunts, pendingObservations, queueBackgroundSync,
  saveHunt, saveObservation } from "./sync.js";

const canonical = "https://tabor-academy-blueprints.pages.dev";

export function blueprintCode(id) {
  return "TA-" + String(id).padStart(6, "0");
}

export function fieldQr(id) {
  const image = new Image(116, 116);
  const qr = qrcode(0, "M");
  qr.addData(`${canonical}/?lesson=${blueprintCode(id)}`);
  qr.make();
  image.src = qr.createDataURL(4, 16);
  image.alt = `Scan to open ${blueprintCode(id)}`;
  return image;
}

const element = (tag, text) => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  return node;
};

function button(label, action) {
  const node = element("button", label);
  node.type = "button";
  node.addEventListener("click", action);
  return node;
}

const byId = id => document.getElementById(id);
let activeLesson;
let photo;

async function resizePhoto(file) {
  const image = await createImageBitmap(file);
  try {
    const ratio = Math.min(1, 1000 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
  } finally {
    image.close();
  }
}

async function refreshOutbox() {
  const all = await pendingObservations();
  const status = byId("outbox-status");
  const queued = all.filter(entry => !entry.error);
  status.textContent = all.length
    ? `${queued.length} queued · ${all.length - queued.length} need attention`
    : "Outbox empty";
  const list = byId("outbox-items");
  list.replaceChildren(...all.map(entry => {
    const row = element("li", entry.objectName + (entry.error ? " · " + entry.error : ""));
    row.append(" ", button("Discard", async () => {
      await discardObservation(entry.id);
      await refreshOutbox();
    }));
    return row;
  }));
}

async function retry() {
  try {
    if (navigator.onLine) await flushOutbox();
    await refreshOutbox();
    await queueBackgroundSync().catch(() => {});
  } catch {
    byId("outbox-status").textContent = "Field storage is unavailable in this browser.";
  }
}

async function sightings(id) {
  const list = byId("field-sightings");
  list.replaceChildren();
  if (!id) return;
  try {
    const result = await fetch(`/api/sightings?lesson=${id}`);
    const records = result.ok ? await result.json() : [];
    if (activeLesson?.id !== id) return;
    if (!records.length) {
      list.append(element("p", "No reviewed field sightings yet."));
      return;
    }
    for (const record of records) {
      const article = element("article");
      article.append(element("strong", record.object_name), element("p", record.note));
      if (record.photoUrl && record.photoUrl.startsWith("/api/sighting-photo/")) {
        const image = element("img");
        image.src = record.photoUrl;
        image.alt = record.object_name;
        image.loading = "lazy";
        article.append(image);
      }
      list.append(article);
    }
  } catch {
    if (activeLesson?.id === id) list.append(element("p", "Field sightings load when you are online."));
  }
}

export function openField(lesson) {
  activeLesson = lesson;
  const title = lesson ? `Found Another Twin! · ${blueprintCode(lesson.id)}` : "Build a Blueprint Card";
  const dialog = byId("field-dialog");
  byId("field-title").textContent = title;
  byId("field-message").textContent = "";
  byId("field-form").reset();
  const other = byId("field-second");
  other.required = !lesson;
  byId("field-second-label").hidden = Boolean(lesson);
  photo = undefined;
  dialog.showModal();
  void sightings(lesson?.id);
}

function examples(lesson, rows, layer) {
  const score = row => {
    let value = Number(row.domain === lesson.domain);
    const terms = layer === "flow_direction" ? /revers|counter|direction/i
      : layer === "scale_medium" ? /larger|smaller|volume|cross.section|depth/i
      : layer === "input_output" ? /pressure|energy|force|heat|power/i
      : null;
    if (terms?.test(row[layer])) value += 3;
    return value;
  };
  return rows.filter(row => row.id !== lesson.id)
    .sort((a, b) => score(b) - score(a) || a.id - b.id).slice(0, 3);
}

export function openHunt(lesson, columns, getRows, viewLesson) {
  const choices = byId("hunt-layers");
  const dialog = byId("hunt-dialog");
  byId("hunt-title").textContent = `Investigate ${blueprintCode(lesson.id)}`;
  choices.replaceChildren(...columns.map(([key, name]) => {
    const item = element("label");
    const input = element("input");
    input.type = "checkbox";
    input.value = key;
    item.append(input, " " + name);
    return item;
  }));
  byId("hunt-examples").replaceChildren();
  byId("hunt-complete").hidden = false;
  byId("hunt-complete").onclick = async () => {
    const selected = Array.from(choices.querySelectorAll("input:checked"), input => input.value);
    const missed = columns.find(([key]) => !selected.includes(key));
    byId("hunt-complete").hidden = true;
    const directions = byId("hunt-examples");
    try {
      await saveHunt(lesson, selected);
      await updateUnlock();
      const rows = await getRows();
      const heading = missed ? `Explore ${missed[1].toLowerCase()}` : "Explore another blueprint";
      directions.append(element("h3", heading));
      if (missed) {
        const [key, name] = missed;
        for (const peer of examples(lesson, rows, key)) {
          directions.append(element("p", `${peer.item_a_label} and ${peer.item_b_label} · ${name}. ${peer[key]}`),
            button(`Open ${blueprintCode(peer.id)}`, () => { dialog.close(); void viewLesson(peer.id); }));
        }
      }
    } catch {
      directions.append(element("p", "Progress could not be saved on this device."));
      byId("hunt-complete").hidden = false;
    }
  };
  dialog.showModal();
}

async function updateUnlock() {
  const totals = new Map();
  for (const hunt of await hunts()) totals.set(hunt.domain, (totals.get(hunt.domain) ?? 0) + 1);
  byId("build-card").hidden = ![...totals.values()].some(count => count >= 5);
}

export function setupField() {
  if (globalThis.ACADEMY_OFFLINE) {
    byId("field-tools").hidden = true;
    return;
  }
  const form = byId("field-form");
  const send = byId("field-send");
  byId("field-photo").addEventListener("change", async input => {
    const file = input.target.files[0];
    photo = undefined;
    if (!file) return;
    send.disabled = true;
    try {
      if (file.size > 10_000_000) throw new Error("Large file");
      photo = await resizePhoto(file);
      if (photo.length > 480_000) throw new Error("Large image");
    } catch {
      photo = undefined;
      input.target.value = "";
      byId("field-message").textContent = "Choose a smaller JPEG or PNG image.";
    } finally {
      send.disabled = false;
    }
  });
  form.addEventListener("submit", async action => {
    action.preventDefault();
    send.disabled = true;
    try {
      const entry = {
        lessonId: activeLesson?.id ?? null, objectName: byId("field-object").value.trim(),
        secondObject: activeLesson ? null : byId("field-second").value.trim(),
        note: byId("field-note").value.trim(), photo: photo ?? null,
      };
      if (!entry.objectName || (!entry.lessonId && !entry.secondObject)) {
        byId("field-message").textContent = "Enter the object names.";
        return;
      }
      await saveObservation(entry);
      form.reset();
      photo = undefined;
      byId("field-message").textContent = "Saved on this device for submission. Check the outbox for sync.";
      void retry();
    } catch {
      byId("field-message").textContent = "The device could not save the observation. Your form is still here.";
    } finally {
      send.disabled = false;
    }
  });

  byId("build-card").addEventListener("click", () => openField(null));
  byId("outbox-retry").addEventListener("click", retry);
  window.addEventListener("online", retry);
  navigator.serviceWorker?.addEventListener("message", action => {
    if (action.data?.type === "academy-outbox") void refreshOutbox();
  });
  if ("serviceWorker" in navigator) {
    void navigator.serviceWorker.register("/sw.js", { type: "module" })
      .then(() => retry()).catch(() => {});
  }
  void retry();
  void updateUnlock().catch(() => {});
}
