import { createNutcrackerFleet } from "./nutcracker-fleet-core.mjs";
import { createNutcrackerAgi } from "./nutcracker-agi-core.mjs";
import { agiModelPath, runAgiModel } from "./nutcracker-agi-model.mjs";

const root = "/tabor-sites/conductor";
const pathRoot = "/handoffs/nutcracker-bedroom/fleet";
const fleet = createNutcrackerFleet();
export const nutcrackerFleetInfo = {
  fleetCount: fleet.fleetCount, unitsPerFleet: fleet.unitsPerFleet, total: fleet.total,
  dashboardPath: root + pathRoot, rosterPath: root + "/api" + pathRoot
};
const headers = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow"
};

function startFleet(createFleet, createAgi, modelPath) {
  const engine = createFleet();
  const { digestSource, review, sourceLimit, parseManifest, unitAt, reuseBundle } = engine;
  const agi = createAgi(engine);
  const read = id => document.getElementById(id);
  const file = read("file");
  const source = read("source");
  const medium = read("medium");
  const manifest = read("manifest");
  const message = read("status");
  const receipt = read("receipt");
  const reuse = read("reuse");
  const proposal = read("proposal");
  const evidence = read("evidence");
  const draftStatus = read("draft-status");
  let result;
  let submission;
  let draft;
  let draftStale = false;

  function reset() {
    result = null;
    submission = null;
    receipt.textContent = "";
    receipt.hidden = true;
    reuse.disabled = true;
    message.textContent = "";
    read("download").disabled = true;
  }

  function resetDraft() {
    draft = null;
    draftStale = false;
    evidence.textContent = "";
    evidence.hidden = true;
    draftStatus.textContent = "";
  }

  async function sourceBytes() {
    const selected = file.files[0];
    if (selected && source.value) throw new Error("Choose a file or pasted text for this review.");
    if (selected?.size > sourceLimit) throw new Error("The source file must be 256 KiB or smaller.");
    return selected
      ? new Uint8Array(await selected.arrayBuffer())
      : new TextEncoder().encode(source.value);
  }

  function download(name, value) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2) + "\n"], {
      type: "application/json"
    }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  for (const input of [file, source, medium, proposal]) input.addEventListener("input", () => {
    reset();
    if (draft) {
      draftStale = true;
      evidence.hidden = true;
      draftStatus.textContent = "Inputs changed. Draft again to link evidence to the current source.";
    }
  });
  manifest.addEventListener("input", reset);
  const actions = ["hash", "example", "draft-local", "draft-import", "draft-model", "agi-example", "check"];
  function run(id, task) {
    read(id).addEventListener("click", async () => {
      reset();
      const controls = [file, source, medium, manifest, proposal, ...actions.map(read)];
      for (const control of controls) control.disabled = true;
      try { await task(); }
      catch (error) {
        const output = id.startsWith("draft-") || id === "agi-example" ? draftStatus : message;
        output.textContent = error.message;
      }
      finally { for (const control of controls) control.disabled = false; }
    });
  }

  run("hash", async () => {
    message.textContent = "Source SHA-256: " + await digestSource(await sourceBytes());
  });
  run("example", async () => {
    resetDraft();
    file.value = "";
    medium.value = "digital";
    const prefix = "const release = { testPassed: true };\n";
    const help = "// Verify the release before publishing.\n";
    source.value = prefix + help;
    const encoder = new TextEncoder();
    const start = encoder.encode(prefix).length;
    const helpBytes = encoder.encode(help);
    const digest = await digestSource(await sourceBytes());
    manifest.value = JSON.stringify({
      protection: {
        sourceSha256: digest, reviewRef: "demo-review", consent: "pass",
        privacy: "pass", exploitation: "pass"
      },
      parts: [
        { id: "test-a", subject: "release", predicate: "test-passed", scope: "build-1", value: true },
        { id: "test-b", subject: "release", predicate: "test-passed", scope: "build-1", value: false },
        {
          id: "help-text", subject: "help", predicate: "spelling-reviewed", scope: "build-1", value: true,
          range: [start, start + helpBytes.length],
          reuseReview: {
            status: "approved", sourceSha256: digest, ref: "demo-second-review",
            partSha256: await digestSource(helpBytes)
          }
        }
      ]
    }, null, 2);
    message.textContent = "Example loaded. Review submission to see the contradiction and the reuse entry.";
  });
  function showDraft(current, prepared) {
    draft = current;
    draftStale = false;
    manifest.value = JSON.stringify(prepared, null, 2);
    draftStatus.textContent = current.nutcracker.id + " · " + current.claims.length +
      " grounded claims · " + current.skipped.length + " rejected draft entries";
    evidence.textContent = JSON.stringify({
      sourceSha256: current.sourceSha256, binaryPreview: current.binary, claims: current.claims, skipped: current.skipped
    }, null, 2);
    evidence.hidden = false;
  }
  async function buildDraft(bytes, proposals, origin) {
    const current = await agi.draft(bytes, proposals, origin);
    const previous = manifest.value.trim() ? parseManifest(manifest.value) : null;
    showDraft(current, agi.prepareManifest(current, previous));
  }
  run("draft-local", async () => buildDraft(await sourceBytes(), null, "literal"));
  run("draft-import", async () => {
    if (!proposal.value.trim()) throw new Error("Paste a JSON proposal in the LLM import field.");
    await buildDraft(await sourceBytes(), parseManifest(proposal.value), "imported-llm");
  });
  run("draft-model", async () => {
    const status = await fetch(modelPath, { cache: "no-store" });
    const capability = await status.json();
    if (!status.ok) throw new Error(capability.error);
    const bytes = await sourceBytes();
    if (!bytes.length || bytes.length > capability.maxSource) throw new Error("The hosted model accepts up to 6,000 UTF-8 bytes.");
    const response = await fetch(modelPath, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: agi.sourceText(bytes) })
    });
    const output = await response.json();
    if (!response.ok) throw new Error(output.error);
    await buildDraft(bytes, output, "conductor-llm");
  });
  run("agi-example", async () => {
    file.value = "";
    medium.value = "digital";
    proposal.value = "";
    source.value = [
      "Release inventory · build-1",
      "CLAIM release | test-passed | build-1 | true",
      "CLAIM release | test-passed | build-1 | false",
      "CLAIM instructions | verified | build-1 | true"
    ].join("\n");
    const current = await agi.draft(await sourceBytes());
    const prepared = agi.prepareManifest(current);
    Object.assign(prepared.protection, {
      reviewRef: "training-protection-review", consent: "pass", privacy: "pass", exploitation: "pass"
    });
    const reusable = current.claims.find(claim => claim.subject === "instructions");
    prepared.parts = [{ id: reusable.id, reuseReview: {
      status: "approved", sourceSha256: current.sourceSha256,
      partSha256: reusable.evidenceSha256, ref: "training-independent-review"
    } }];
    showDraft(current, prepared);
  });
  run("check", async () => {
    if (draftStale) throw new Error("Inputs changed. Draft again before reviewing this source.");
    const record = manifest.value.trim() ? parseManifest(manifest.value) : null;
    const bytes = await sourceBytes();
    const hash = await digestSource(bytes);
    const decision = draft ? agi.assess(draft, record, hash, medium.value) : {
      report: review(record, hash, medium.value), effective: record
    };
    result = decision.report;
    submission = { bytes, record: decision.effective, medium: medium.value };
    const status = { crushed: "Crushed · rejected", held: "Held for review", cleared: "Cleared supplied checks" };
    message.textContent = status[result.disposition] + " · " + result.nutcracker.id;
    receipt.textContent = JSON.stringify(result, null, 2);
    receipt.hidden = false;
    reuse.disabled = result.reuse.length === 0;
    read("download").disabled = false;
  });
  read("download").addEventListener("click", () => download(result.nutcracker.id + "-receipt.json", result));
  reuse.addEventListener("click", async () => {
    const snapshot = submission;
    const filename = result.nutcracker.id + "-reuse.json";
    reuse.disabled = true;
    try {
      const bundle = await reuseBundle(snapshot.bytes, snapshot.record, snapshot.medium);
      if (snapshot === submission) download(filename, bundle);
    } catch (error) {
      if (snapshot === submission) message.textContent = error.message;
    } finally {
      if (snapshot === submission) reuse.disabled = false;
    }
  });
  read("print").addEventListener("click", () => window.print());
  read("lookup").addEventListener("click", () => {
    try {
      const unit = unitAt(read("ordinal").valueAsNumber);
      read("location").textContent = unit.id + " · Fleet " + unit.fleet + " · Unit " + unit.unit;
    } catch (error) {
      read("location").textContent = error.message;
    }
  });
}

const script = `(${startFleet.toString()})(${createNutcrackerFleet.toString()}, ${createNutcrackerAgi.toString()}, ${JSON.stringify(root + agiModelPath)});\n`;
const page = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Nutcracker Fleet · Nathan Tabor</title>
<style>
:root{color-scheme:dark;--bg:#131110;--panel:#211b18;--line:#504139;--text:#faf2e7;--dim:#d3c5b7;--accent:#f0b777}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:1rem/1.55 system-ui,sans-serif}
main{width:min(64rem,calc(100% - 2rem));margin:2.25rem auto 4rem}h1,h2{font-family:Georgia,serif;line-height:1.05;font-weight:400}
h1{font-size:clamp(3rem,8vw,5rem);margin:1.3rem 0 .35rem}h2{font-size:1.85rem;margin:0 0 .8rem}
a{color:var(--accent)}p{margin:.55rem 0 1rem}.summary{font-size:1.25rem;color:var(--accent)}.description,small{color:var(--dim)}
.work{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1.5rem}
.panel{min-width:0;background:var(--panel);border:1px solid var(--line);padding:clamp(1rem,3vw,1.8rem)}
label{display:block;font-weight:600;margin-top:.8rem}textarea,select,input{color:var(--text);background:var(--bg);font:inherit;max-width:100%}
textarea,select{width:100%;padding:.65rem;border:1px solid var(--line);border-radius:.25rem}
textarea{min-height:9rem;resize:vertical;font: .88rem/1.4 ui-monospace,monospace}textarea#manifest{min-height:13rem}
button{font:600 .93rem system-ui,sans-serif;padding:.6rem .85rem;border:1px solid var(--line);color:var(--text);background:var(--panel);cursor:pointer}
button.primary{background:var(--accent);color:var(--bg);border-color:var(--accent)}button:disabled{opacity:.5;cursor:default}
.actions{display:flex;flex-wrap:wrap;gap:.65rem;margin-top:1.15rem}.results{margin-top:1rem}#status{overflow-wrap:anywhere}
pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--bg);padding:1rem;margin:0}.paper{display:none}
@media(max-width:42rem){.work{grid-template-columns:1fr}}
@media print{main{display:none}.paper{display:block;color:#000;font:11pt/1.45 system-ui,sans-serif}body{background:#fff}.paper h1{font-size:27pt}.blank{border-bottom:1px solid #555;min-height:2em;margin-bottom:.7em}}
</style>
<main>
<nav aria-label="Project"><a href="${root}/handoffs/nutcracker-bedroom">Nutcracker handoff</a></nav>
<h1>Nutcracker Fleet</h1>
<p class="summary">${fleet.fleetCount} fleets × ${fleet.unitsPerFleet.toLocaleString("en-US")} Nutcrackers · ${fleet.total.toLocaleString("en-US")} individually addressable units</p>
<p class="description">Trace claims from digital code or paper through source verification, innocence checks, and a Fleet decision. Local drafting and imported LLM proposals stay in this browser.</p>
<div class="actions"><button id="print" type="button">Print paper worksheet</button> <a href="${root}/api${pathRoot}?fleet=1">Open fleet 1 roster</a></div>
<div class="work">
<section class="panel" aria-labelledby="intake-heading">
<h2 id="intake-heading">Source intake</h2>
<label for="medium">Medium</label>
<select id="medium"><option value="digital">Digital code or file</option><option value="paper">Paper transcription</option></select>
<label for="file">Choose a file</label><input id="file" type="file">
<label for="source">Or paste source text</label><textarea id="source" maxlength="262144"></textarea>
<small>256 KiB maximum. Code is read as data.</small>
<div class="actions"><button id="hash" type="button">Calculate source hash</button></div>
</section>
<section class="panel" aria-labelledby="agi-heading">
<h2 id="agi-heading">AGI workbench</h2>
<p>Draft claims, match them to exact source bytes, and send the evidence to the Fleet.</p>
<small>For local drafting, use one line per claim in this format <code>CLAIM subject | predicate | scope | value</code>.</small>
<label for="proposal">Import an LLM proposal in JSON</label>
<textarea id="proposal" spellcheck="false" maxlength="65536" placeholder='{"claims":[{"subject":"release","predicate":"test-passed","scope":"build-1","value":true,"quote":"Exact source words"}]}'></textarea>
<div class="actions"><button id="draft-local" type="button">Draft local claims</button><button id="draft-import" type="button">Check imported LLM claims</button><button id="agi-example" type="button">Load AGI sample</button></div>
<div class="actions"><button id="draft-model" type="button">Send source to Conductor LLM</button></div>
<small>Hosted inference sends the source to Cloudflare Workers AI and uses Conductor operator access.</small>
<p id="draft-status" role="status"></p>
<pre id="evidence" hidden></pre>
</section>
<section class="panel" aria-labelledby="review-heading">
<h2 id="review-heading">Review manifest</h2>
<label for="manifest">Reviewer evidence and scope-matched claims in JSON</label>
<textarea id="manifest" spellcheck="false" maxlength="262144"></textarea>
<small>Record consent, privacy and exploitation as pass, fail or unresolved. For model claims, enter accept or dismiss and a reviewer reference beside each claim ID. Reuse requires separate approval tied to the source and part hashes.</small>
<div class="actions"><button id="example" type="button">Load sample</button><button id="check" type="button" class="primary">Review submission</button></div>
</section>
</div>
<section class="panel results" aria-labelledby="roster-heading">
<h2 id="roster-heading">Find a Nutcracker</h2>
<label for="ordinal">Unit number from 1 to 69,000</label>
<input id="ordinal" type="number" min="1" max="${fleet.total}" value="1">
<button id="lookup" type="button">Look up unit</button>
<p id="location" role="status"></p>
</section>
<section class="panel results" aria-labelledby="results-heading">
<h2 id="results-heading">Review receipt</h2>
<p id="status" role="status"></p>
<pre id="receipt" hidden></pre>
<div class="actions"><button id="download" type="button" disabled>Download receipt</button><button id="reuse" type="button" disabled>Download approved reuse entries</button></div>
</section>
</main>
<section class="paper">
<h1>Nutcracker Fleet · Paper Intake</h1>
<p>Keep the original. Record each claim with its source, scope and reviewer.</p>
<div class="blank">Source reference and date</div><div class="blank">Reviewer and Nutcracker ID</div>
<div class="blank">Consent · pass / fail / unresolved</div>
<div class="blank">Privacy · pass / fail / unresolved</div>
<div class="blank">Exploitation · pass / fail / unresolved</div>
<div class="blank">Claim A · subject / predicate / scope / value</div>
<div class="blank">Claim B · subject / predicate / scope / value</div>
<div class="blank">Discrepancy and evidence</div>
<div class="blank">Decision · cleared / crushed / held</div>
<div class="blank">Reusable part and independent reviewer reference</div>
<p>Transcribe the completed record in the Nutcracker Fleet and select Paper transcription to issue a digital receipt.</p>
</section>
<script defer src="${root}${pathRoot}.js"></script>
</html>`;

export function serveNutcrackerFleet(request, path, runtime) {
  if (path === agiModelPath) return runAgiModel(request, runtime);
  const api = "/api" + pathRoot;
  const javascript = pathRoot + ".js";
  if (![pathRoot, pathRoot + "/", api, javascript].includes(path)) return null;
  const respond = (body, type, status = 200) => new Response(request.method === "HEAD" ? null : body, {
    status, headers: { ...headers, "Content-Type": type }
  });
  if (!["GET", "HEAD"].includes(request.method)) {
    return new Response(null, { status: 405, headers: { ...headers, Allow: "GET, HEAD" } });
  }
  if (path === javascript) return respond(script, "text/javascript; charset=utf-8");
  if (path !== api) return respond(page, "text/html; charset=utf-8");

  const number = new URL(request.url).searchParams.get("fleet");
  const info = nutcrackerFleetInfo;
  if (number === null) return respond(JSON.stringify(info), "application/json");
  if (!/^[1-9]\d?$/.test(number) || Number(number) > fleet.fleetCount) {
    return respond(JSON.stringify({ error: "Choose a fleet from 1 to 69." }), "application/json", 400);
  }
  const first = (Number(number) - 1) * fleet.unitsPerFleet + 1;
  const units = Array.from({ length: fleet.unitsPerFleet }, (_, index) => fleet.unitAt(first + index));
  return respond(JSON.stringify({ ...info, fleet: Number(number), units }), "application/json");
}
