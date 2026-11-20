import { createNutcrackerFleet } from "./nutcracker-fleet-core.mjs";
import { createNutcrackerAgi } from "./nutcracker-agi-core.mjs";
import { createLlmagiSystem } from "./llmagi-os-core.mjs";
import { nativeImage } from "./llmagi-native-image.mjs";

const base = "/tabor-sites/conductor";
const desk = "/handoffs/nutcracker-bedroom/llmagi-os";
const api = "/api" + desk;
const fleetPath = base + "/handoffs/nutcracker-bedroom/fleet";
const fixedAnchor = base + "/handoffs/fixed-anchor-binary";
const academy = base + "/handoffs/tabor-academy-architecture-course";
const scripture = "https://www.biblegateway.com/passage/?search=Matthew+2%3A1-12&version=KJV";
const fleet = createNutcrackerFleet();
const system = createLlmagiSystem(fleet, createNutcrackerAgi(fleet));
const roots = {
  L: { root: "lamd", meaning: "Ox goad" },
  M: { root: "maym", meaning: "Water" },
  A: { root: "ʾalp", meaning: "Ox" },
  G: { root: "gaml", meaning: "Throwing stick" },
  I: { root: "yad", meaning: "Hand or forearm" }
};
const rootsInOrder = spelling => Array.from(spelling, letter => ({ letter, ...roots[letter] }));
const headers = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow"
};

export const llmagiRelease = {
  dashboardPath: base + desk, manifestPath: base + api, imagePath: base + desk + "/llmagi-os.img",
  encoding: system.encoding, anchors: system.anchors,
  services: { fleet: fleetPath, fixedAnchor, academy },
  subsystems: {
    kernel: "Fleet disposition and exact-source evidence checks",
    execution: "LLMAGI forward processing and IGAMLL reverse replay",
    processes: "Single-job browser console with task counters",
    artifacts: "Local receipt import, SHA-256 seal and JSON export",
    devices: "Browser file picker and native BIOS display, keyboard and memory services"
  },
  naming: {
    projectWording: "the group of individuals who mapped the stars to find Jesus",
    reference: "Matthew 2:1–12 (KJV)", url: scripture
  },
  letterRoots: {
    basis: "Earliest reconstructed letter-name meanings",
    forward: rootsInOrder(system.encoding.forward),
    reverse: rootsInOrder(system.encoding.reverse),
    sources: [
      { title: "Antiguo Oriente · Hypothetical Origins of Alphabet Letters", url: "https://repositorio.uca.edu.ar/bitstream/123456789/6787/4/origin-alphabet-goldwasser-hypothesis.pdf" },
      { title: "Brown University · Semitic alphabet", url: "https://webhelper.brown.edu/joukowsky/courses/ancientmiddleeast10/files/11909955.pdf" }
    ]
  },
  native: { kind: "x86 BIOS two-stage monitor", bytes: nativeImage.size, sha256: nativeImage.sha256 }
};

const rootRows = llmagiRelease.letterRoots.forward.map(({ letter, root, meaning }) =>
  `<tr><th scope="row">${letter}</th><td><i>${root}</i></td><td>${meaning}</td></tr>`
).join("");
const rootSources = llmagiRelease.letterRoots.sources.map(({ title, url }) =>
  `<a href="${url}">${title}</a>`
).join(" · ");

function startDesk(createFleet, createAgi, createSystem) {
  const fleet = createFleet();
  const agi = createAgi(fleet);
  const system = createSystem(fleet, agi);
  const item = id => document.getElementById(id);
  const source = item("source");
  const sourceFile = item("source-file");
  const proposals = item("proposals");
  const review = item("review");
  const medium = item("medium");
  const archive = item("archive");
  const reuse = item("reuse");
  const status = item("status");
  const output = item("output");
  const commandIds = ["example", "draft", "forward", "reverse"];
  async function sourceBytes() {
    const selected = sourceFile.files[0];
    if (selected && source.value) throw new Error("Choose a source file or paste source text.");
    if (selected?.size > fleet.sourceLimit) throw new Error("The source limit is 256 KiB.");
    return selected ? new Uint8Array(await selected.arrayBuffer()) : new TextEncoder().encode(source.value);
  }
  const readJson = element => element.value.trim() ? fleet.parseManifest(element.value) : null;
  const print = value => JSON.stringify(value, null, 2);
  let running = false;
  let completed = 0;
  let failed = 0;
  let reusable = null;

  function clearReuse() { reusable = null; reuse.disabled = true; }
  for (const input of [source, sourceFile, medium, proposals, review]) input.addEventListener("input", clearReuse);

  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  function show(label, value) {
    status.textContent = label;
    output.textContent = print(value);
    output.hidden = false;
  }

  function command(id, handler) {
    item(id).addEventListener("click", async () => {
      if (running) return;
      running = true;
      const interactive = [source, sourceFile, proposals, review, medium, archive, ...commandIds.map(item)];
      for (const control of interactive) control.disabled = true;
      status.textContent = "Running " + id + "…";
      try {
        await handler();
        completed++;
      } catch (error) {
        failed++;
        output.hidden = true;
        status.textContent = error.message;
      } finally {
        item("tasks").textContent = completed + " completed · " + failed + " failed";
        for (const control of interactive) control.disabled = false;
        running = false;
      }
    });
  }

  async function draftCase() {
    clearReuse();
    const draft = await agi.draft(await sourceBytes(), readJson(proposals));
    const prepared = agi.prepareManifest(draft, readJson(review));
    review.value = print(prepared);
    show("Draft linked to " + draft.nutcracker.id, {
      sourceSha256: draft.sourceSha256, binary: draft.binary,
      claims: draft.claims, rejected: draft.skipped
    });
    return { draft, prepared };
  }
  command("example", async () => {
    sourceFile.value = "";
    source.value = [
      "Tabor OS review example",
      "CLAIM release | approved | build-1 | true",
      "CLAIM release | approved | build-1 | false",
      "CLAIM instructions | reviewed | build-1 | true"
    ].join("\n");
    medium.value = "digital";
    review.value = "";
    proposals.value = "";
    archive.value = "";
    const { draft, prepared } = await draftCase();
    Object.assign(prepared.protection, {
      reviewRef: "training-example", consent: "pass", privacy: "pass", exploitation: "pass"
    });
    const instructions = draft.claims.find(claim => claim.subject === "instructions");
    prepared.parts = [{ id: instructions.id, reuseReview: {
      status: "approved", ref: "training-reuse", sourceSha256: draft.sourceSha256,
      partSha256: instructions.evidenceSha256
    } }];
    review.value = print(prepared);
  });
  command("draft", draftCase);
  command("forward", async () => {
    clearReuse();
    const bytes = await sourceBytes();
    const done = await system.forward(bytes, readJson(proposals), readJson(review), medium.value);
    if (!review.value.trim()) review.value = print(done.manifest);
    archive.value = print(done.artifact);
    if (done.artifact.body.report.reuse.length) {
      reusable = { bytes, manifest: done.effective, medium: medium.value };
      reuse.disabled = false;
    }
    show("LLMAGI · " + done.artifact.body.disposition.toUpperCase(), done.artifact.body.report);
  });
  command("reverse", async () => {
    const proof = await system.reverse(await sourceBytes(), readJson(archive), readJson(proposals), readJson(review), medium.value);
    const matches = proof.receiptMatches && proof.sourceMatches && proof.decisionMatches;
    show(matches ? "IGAMLL · replay verified" : "IGAMLL · mismatch", proof);
  });
  item("save").addEventListener("click", () => {
    if (!archive.value.trim()) { status.textContent = "Run LLMAGI or open a receipt first."; return; }
    download("llmagi-receipt.json", archive.value);
  });
  reuse.addEventListener("click", async () => {
    const parts = reusable;
    if (!parts) return;
    reuse.disabled = true;
    try {
      const data = await fleet.reuseBundle(parts.bytes, parts.manifest, parts.medium);
      if (reusable === parts) download("llmagi-approved-parts.json", print(data));
    } catch (error) {
      if (reusable === parts) status.textContent = error.message;
    } finally {
      if (reusable === parts) reuse.disabled = false;
    }
  });
  item("open").addEventListener("change", async event => {
    if (running) return;
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 262_144) throw new Error("Choose a receipt under 256 KiB.");
      const content = await file.text();
      fleet.parseManifest(content);
      if (!running) {
        archive.value = content;
        status.textContent = "Receipt opened. Supply the same source, proposal and review to replay it.";
      }
    } catch (error) {
      status.textContent = error.message;
    } finally {
      event.target.value = "";
    }
  });
  item("verify-frame").addEventListener("click", () => {
    item("frame-result").textContent = system.verifyFixedFrame(item("frame").value)
      ? "1 · exact fixed-anchor frame" : "0 · fixed-anchor mismatch";
  });
}

const client = `(${startDesk.toString()})(${createNutcrackerFleet.toString()}, ${createNutcrackerAgi.toString()}, ${createLlmagiSystem.toString()});\n`;
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>LLMAGI OS · IGAMLL · Nathan Tabor</title><style>
:root{color-scheme:dark;--bg:#0a1216;--card:#102026;--line:#315059;--text:#e8f7ee;--muted:#b9d2ca;--green:#75ecc5;--gold:#efce86}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:1rem/1.5 system-ui,sans-serif}main{width:min(69rem,calc(100% - 2rem));margin:2rem auto 4rem}
h1,h2{font-family:Georgia,serif;line-height:1.06}h1{font-size:clamp(3rem,8vw,6.4rem);margin:.6rem 0}h2{font-size:1.7rem;margin:.1rem 0 .75rem}
p{margin:.6rem 0 1rem}a{color:var(--green)}small,.muted{color:var(--muted)}.eq{color:var(--green);font-size:1.3rem}.reverse{color:var(--gold)}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin:1rem 0}.panel{background:var(--card);border:1px solid var(--line);padding:clamp(1rem,3vw,1.8rem);overflow-wrap:anywhere}
label{display:block;margin:.7rem 0 .35rem;font-weight:600}textarea,select,input,button{font:inherit;color:var(--text);max-width:100%}textarea,select{width:100%;padding:.7rem;border:1px solid var(--line);background:var(--bg)}
textarea{min-height:7rem;resize:vertical;font: .9rem/1.45 ui-monospace,monospace}button{background:var(--bg);border:1px solid var(--line);padding:.55rem .75rem;cursor:pointer}button.primary{background:var(--green);color:var(--bg);font-weight:700}button:disabled{opacity:.5}
.actions{display:flex;flex-wrap:wrap;gap:.45rem;margin-top:.75rem}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--bg);padding:.8rem}code{overflow-wrap:anywhere}.toplinks{display:flex;gap:.75rem;flex-wrap:wrap}
table{width:100%;border-collapse:collapse;text-align:left}th,td{padding:.5rem .6rem;border-bottom:1px solid var(--line)}
@media(max-width:44rem){.grid{grid-template-columns:1fr}}
</style></head><body><main>
<nav class="toplinks" aria-label="Connected systems"><a href="${base}">Conductor</a><a href="${fleetPath}">Nutcracker Fleet and LLM workbench</a><a href="${fixedAnchor}">Fixed-anchor binary</a><a href="${academy}">Tabor Academy architecture</a><a href="${base + api}">System manifest</a><a href="#letter-roots">Letter roots</a></nav>
<h1>LLMAGI OS</h1><p class="eq">${system.encoding.equation}</p>
<p>Forward · ${system.encoding.forwardReadings.join(" · ")}</p>
<p class="reverse">Reverse · ${system.encoding.reverse} · ${system.encoding.reverseReadings.join(" · ")}</p>
<p class="muted">Nathan Tabor’s naming image · “${llmagiRelease.naming.projectWording}.” Matthew describes wise men from the east who saw the star and followed it to Jesus. <a href="${scripture}">Matthew 2:1–12 (KJV)</a></p>
<div class="grid">
<section class="panel"><h2>LLMAGI · Run</h2><p>Trace code, documents, or paper transcriptions to exact source evidence and the Fleet’s decision.</p>
<label for="medium">Input medium</label><select id="medium"><option value="digital">Digital</option><option value="paper">Paper transcription</option></select>
<label for="source-file">Open UTF-8 source file</label><input id="source-file" type="file">
<label for="source">Or paste source text</label><textarea id="source" maxlength="131072"></textarea>
<label for="proposals">LLM claims JSON · optional</label><textarea id="proposals" maxlength="65536"></textarea>
<label for="review">Review manifest JSON</label><textarea id="review" maxlength="131072"></textarea>
<div class="actions"><button type="button" id="example">Load example</button><button type="button" id="draft">Draft source</button><button type="button" class="primary" id="forward">Run LLMAGI</button><button type="button" id="reuse" disabled>Download approved parts</button></div></section>
<section class="panel"><h2>IGAMLL · Verify</h2><p>Open an earlier receipt and replay it with the same source, medium, proposal, and reviewer decisions. This checks reproducibility and receipt integrity.</p>
<label for="open">Open receipt file</label><input id="open" type="file" accept=".json,application/json">
<label for="archive">Receipt JSON</label><textarea id="archive" maxlength="262144"></textarea>
<div class="actions"><button type="button" id="reverse">Replay with IGAMLL</button><button type="button" id="save">Download receipt</button></div>
<p id="tasks" class="muted">0 completed · 0 failed</p></section>
</div>
<section class="panel"><h2>Console</h2><p role="status" id="status">Ready</p><pre id="output" hidden></pre></section>
<div class="grid">
<section class="panel"><h2>Binary and arithmetic</h2>
<p><code>LLMAGI ${system.binary("LLMAGI")}</code></p><p><code>IGAMLL ${system.binary("IGAMLL")}</code></p>
<p>${system.anchors.join(" · ")}</p>
<label for="frame">144-bit fixed-anchor frame (hex)</label><input type="text" id="frame" maxlength="80" value="${system.fixedFrame}">
<button type="button" id="verify-frame">Verify frame</button><p role="status" id="frame-result"></p></section>
<section class="panel"><h2>Native BIOS boot image</h2>
<p>Boots a two-stage x86 monitor with forward and reverse readings, native arithmetic checks, and a BIOS memory report. The browser workbench runs the model and Fleet workflows.</p>
<p><a href="${llmagiRelease.imagePath}">Download llmagi-os.img</a></p><small>SHA-256 <code>${nativeImage.sha256}</code></small></section>
</div>
<section class="panel" id="letter-roots" aria-labelledby="roots-heading">
<h2 id="roots-heading">Earliest reconstructed letter-name meanings</h2>
<table><thead><tr><th scope="col">Letter</th><th scope="col">Root</th><th scope="col">Meaning</th></tr></thead><tbody>${rootRows}</tbody></table>
<p><small>${rootSources}</small></p>
</section>
</main><script defer src="${base + desk}.js"></script></body></html>`;

export function serveLlmagiOs(request, path) {
  if (![desk, desk + "/", desk + ".js", api, desk + "/llmagi-os.img"].includes(path)) return null;
  if (!["GET", "HEAD"].includes(request.method)) {
    return new Response(null, { status: 405, headers: { ...headers, Allow: "GET, HEAD" } });
  }
  const head = request.method === "HEAD";
  const send = (body, type, extras = {}) => new Response(head ? null : body, {
    headers: { ...headers, ...extras, "Content-Type": type }
  });
  if (path === api) return send(JSON.stringify(llmagiRelease), "application/json");
  if (path === desk + ".js") return send(client, "text/javascript; charset=utf-8");
  if (path.endsWith(".img")) {
    const image = head ? null : new Uint8Array(nativeImage.size);
    if (image) image.set(Uint8Array.from(atob(nativeImage.base64), byte => byte.charCodeAt(0)));
    return send(image, "application/octet-stream", {
      "Content-Disposition": 'attachment; filename="llmagi-os.img"',
      "Content-Length": String(nativeImage.size)
    });
  }
  return send(html, "text/html; charset=utf-8");
}
