"use strict";
const $ = (id) => document.getElementById(id);
const token = document.querySelector('meta[name="local-session"]').content;
let currentAudioURL = null, currentArchiveURL = null;
const setStatus = (message) => { $("status").textContent = message; };
async function init() {
  try {
    const response = await fetch("/voices", {cache:"no-store"});
    const data = await response.json();
    const select = $("voice");
    select.replaceChildren();
    for (const voice of data.voices) {
      const opt = document.createElement("option");
      opt.value = voice.name;
      opt.dataset.lang = voice.language;
      opt.textContent = voice.name + " · " + voice.language;
      if (voice.language.toLowerCase() === "en-us") opt.selected = true;
      select.append(opt);
    }
    if (data.voices.length) {
      setStatus(data.voices.length + " installed voice choices detected. Ready to synthesize offline.");
    } else {
      const opt = document.createElement("option");
      opt.value = "en-us"; opt.textContent = "No engine detected"; select.append(opt);
      setStatus("No local speech engine found. Install espeak-ng, or configure an authorized ONNX pack.");
    }
  } catch (e) { setStatus("Local engine unavailable: " + e.message); }
}
$("speak").addEventListener("click", async () => {
  const button = $("speak");
  button.disabled = true;
  setStatus("Generating on this device…");
  try {
    const obj = {
      text: $("text").value, lang: $("lang").value.trim(),
      voice: $("voice").value, persona: $("persona").value,
      effect: $("effect").value, pack: $("pack").value.trim() || null
    };
    const resp = await fetch("/speak", {
      method:"POST",headers:{"Content-Type":"application/json","X-Local-Session":token},
      body:JSON.stringify(obj),cache:"no-store"
    });
    if (!resp.ok) {
      const error = await resp.json();
      throw new Error(error.error || "Local engine error");
    }
    const blob = await resp.blob();
    if (currentAudioURL) URL.revokeObjectURL(currentAudioURL);
    currentAudioURL = URL.createObjectURL(blob);
    $("player").src = currentAudioURL;
    $("download").href = currentAudioURL;
    $("download").hidden = false;
    setStatus("Done locally. " + Math.round(blob.size/1024) + " KiB PCM audio. "
      + ($("persona").value === "neutral" ? "Synthetic voice." : "Fictional dramatization."));
  } catch (e) { setStatus("Error: " + e.message); }
  finally { button.disabled = false; }
});
$("archive").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (currentArchiveURL) URL.revokeObjectURL(currentArchiveURL);
  if (!file) { $("archival-player").removeAttribute("src"); return; }
  if (!file.type.startsWith("audio/")) {
    setStatus("Please select an audio recording."); return;
  }
  currentArchiveURL = URL.createObjectURL(file);
  $("archival-player").src = currentArchiveURL;
});
window.addEventListener("beforeunload", () => {
  if (currentAudioURL) URL.revokeObjectURL(currentAudioURL);
  if (currentArchiveURL) URL.revokeObjectURL(currentArchiveURL);
});
$("voice").addEventListener("change", () => {
  const choice = $("voice").selectedOptions[0];
  if (choice && choice.dataset.lang) $("lang").value = choice.dataset.lang;
});
init();