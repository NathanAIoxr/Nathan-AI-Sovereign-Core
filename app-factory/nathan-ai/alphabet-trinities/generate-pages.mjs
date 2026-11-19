import { mkdir, writeFile, readFile } from "node:fs/promises";
import { units } from "./units.mjs";
import { archive, assessment, featuredLetters, originalT, sections, sources, sovereigntyOS } from "./public/common/corpus.mjs";
import { alternateT, rootNotes } from "./public/common/expansion.mjs";
import { escapeHtml as e, records } from "./public/common/tools.mjs";

const root = new URL("./public/", import.meta.url);
const file = (id, name) => new URL(id + "/" + name, root);
const urlFor = id => "../" + id + "/";
const links = entries => entries.map(([label, href]) => '<li><a href="' + e(href) + '">' + e(label) + '</a></li>').join("\n");
const cards = items => items.map(([title, tradition, detail]) =>
  '<article class="card"><h3>' + e(title) + '</h3><small>' + e(tradition) + '</small><p>' + e(detail) + '</p></article>').join("\n");
const letters = '<nav class="letters" aria-label="Alphabet">' + Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ").map(letter =>
  '<a href="' + (featuredLetters.includes(letter) ? "#letter-" + letter : archive + letter.toLowerCase() + "/") +
  '" aria-label="' + letter + (featuredLetters.includes(letter) ? "" : " in the existing A–Z Archive") + '">' + letter + '</a>').join("") + '</nav>';
const secondT = `<h3>T · ${e(alternateT.title)}</h3>
<p>${e(alternateT.core.join(" · "))}</p><p>Additional roots and figures · ${e(alternateT.related.join(" · "))}</p>`;
const fullSections = sections.map(({ letter, title, core, related }) => `
<section class="block" id="letter-${letter}">
<h2>${letter} · ${e(title)}</h2>
${letter === "T" ? "<blockquote>" + e(originalT) + "</blockquote>" : ""}
<div class="grid">${cards(core)}</div>
${letter === "T" ? secondT : ""}
<details><summary>Additional figures and roots</summary><div class="grid">${cards(related)}</div></details>
</section>`).join("\n");
const roots = `<section class="block" id="hebrew-names"><h2>Hebrew name notes</h2>
<p>Each proposed reading is paired with a lexical or textual note.</p>
<div class="grid">${rootNotes.map(([name, script, reading, text]) => `<article class="card"><h3>${e(name)}</h3>
<p>${e(script)}</p><blockquote>${e(reading)}</blockquote><p>${e(text)}</p></article>`).join("\n")}</div></section>`;
export const volumes = [
  ["abc", "The A, B, and C Trinities", "ABC", "Three letter groups bring myth, vocabulary, and cultural history into the same reference. A pairs light and strategy with the weighing of the heart. B connects creation, the death of Baldr, and protection. C puts time beside an entrance to the Underworld and a guide who knows the route ahead."],
  ["tv", "The Trinity of T’s and the V Shift", "TV", "Theseus brings Athenian civic order. Theos brings the word “gods” into the conversation through John 10:34–35 and Psalm 82. Thanos moves from a Marvel character to the language of engine performance. The V chapter brings together word, truth, life, and voice."],
  ["gl", "Earth to Fate · G through L", "GHIJKL", "The letter groups run from Gaia, Ganesha, and Gabriel to Loki, Lakshmi, and Lugh. The notes trace common threads such as messengers, thresholds, kingship, and the signs behind several Greek and Hebrew letters."],
  ["mr", "Water to Order · M through R", "MNOPQR", "These six letter groups run from Mercury, Minerva, and Morpheus to Ra, Rhea, and Ṛta. Along the way, the lexicon connects mythic themes to vocabulary for breath, measure, order, and speech."],
  ["sz", "Sun to Summit · S through Z", "STUVWXYZ", "The final run follows the sun, dawn, wind, crossings, twinship, and the summit. It includes both T groupings and the V Trinity of Word, Truth, & Life."],
];
const volumeNames = ["I", "II", "III", "IV", "V"];
const bookSections = volumes.map(([anchor, title, range, intro], index) => `<section class="block" id="${anchor}">
<h2>Volume ${volumeNames[index]} · ${e(title)}</h2>
${index === 1 ? "<blockquote>" + e(originalT) + "</blockquote>" : ""}
<p>${e(intro)}</p>
${sections.filter(s => range.includes(s.letter)).map(s => "<h3>" + s.letter + " · " + e(s.title) +
'</h3><div class="grid">' + cards([...s.core, ...s.related]) + "</div>" +
(s.letter === "T" && index === 4 ? secondT : "")).join("\n")}
<ul class="no-print">${links([["Download Volume " + volumeNames[index] + " (EPUB)", "./volume-" + (index + 1) + ".epub"],
...(index === 0 ? [["Download the original A–C text (Markdown)", "./abc-source.md"]] : []),
...(index === 1 ? [["Download the original Trinity of T’s line", "./t-original.txt"], ["Download the T/V source notes", "./tv-source.txt"]] : [])])}</ul>
</section>`).join("\n");

const body = {
  "alphabet-trinities": `${letters}
<section class="block" id="projects"><h2>Open a project</h2><div class="grid">
${units.slice(1).map(unit => `<article class="card"><small>${e(unit.kind)}</small><h3><a href="${urlFor(unit.id)}">${e(unit.name)}</a></h3><p>${e(unit.description)}</p></article>`).join("\n")}
</div></section>
${fullSections}
${roots}
<section class="block"><h2>Connections and sources</h2>
<p>D, E, and F open their existing letter departments. Theseus, Theos, and Thanos are grouped through Nathan Tabor’s sound readings. T and V have separate historical letter lineages. The original T/V notes and the editorial reading are both available in the books.</p>
<ul>${links([["Nathan AI A–Z archive", archive], ["Assessment Studio", assessment], ["Sovereignty OS source", sovereigntyOS], ...sources])}</ul></section>`,

  "alphabet-field-app": `<section class="block">
<h2>Lexicon</h2><div class="row">
<label>Search <input id="query" type="search" placeholder="Name, tradition, or topic"></label>
<label>Letter <select id="letter"><option value="">All letters</option>${sections.map(s => '<option>' + s.letter + '</option>').join("")}</select></label>
<button id="saved" type="button" aria-pressed="false">Show bookmarks</button>
</div>
<p id="status" class="status" role="status"></p><div class="grid" id="entries"></div>
<noscript><p><a href="../alphabet-trinities/">Read the complete lexicon on the website.</a></p></noscript>
</section>
<section class="block"><h2>Build · Flip · Integrate · Verify</h2>
<p>A public library can fund one program. It can repair its only study room or open a new lending service. Which do you choose and who would gain from it?</p>
<details><summary>Flip the scenario</summary><p>A nearby community center offers free study rooms but closes before most shift workers finish. Reconsider your choice from their perspective.</p></details>
<details><summary>Integrate and verify</summary><p>Write a plan that names who benefits, who is still excluded, and what observation would change your mind.</p></details>
<label for="reflection">Your local notes</label><textarea id="reflection" rows="4" maxlength="5000"></textarea>
<div class="row"><button id="save-note" type="button">Save notes</button><span id="note-status" role="status"></span></div>
<p><a href="${assessment}">Open Assessment Studio for QI/QE practice and the personality and IQ test directory</a>.</p>
</section>`,

  "trinity-match": `<section class="block"><h2>Match the clue</h2>
<p>Choose the name that matches each clue. A round contains six questions.</p>
<p id="progress" aria-live="polite"></p><p id="clue"></p><div id="choices" class="row"></div>
<p id="feedback" class="status" role="status"></p><div class="row">
<button id="next" type="button" hidden>Next clue</button><button id="restart" type="button">New round</button></div>
</section>`,

  "letter-labyrinth": `<section class="block"><h2>Restore the sequence</h2>
<p>Select two tiles to swap them. Put each trio back in its original order. Compare moves against the par of two.</p>
<div class="row"><label>Trinity <select id="chapter">${sections.filter(s => s.core.length).map(s => '<option>' + s.letter + '</option>').join("")}</select></label>
<button type="button" id="reset">Reset puzzle</button></div>
<div class="row" id="tiles" aria-label="Current sequence"></div>
<p id="moves" role="status" class="status"></p>
<details><summary>Read the order clue</summary><p id="hint"></p></details>
</section>`,

  "alphabet-books": `<nav class="letters" aria-label="Volumes">${volumes.map(([anchor], index) =>
  '<a href="#' + anchor + '">' + volumeNames[index] + '</a>').join("")}</nav>
${bookSections}
${roots}
<section class="block"><h2>Sources</h2><ul>${links(sources)}</ul></section>`,

  "alphabet-os": `<section class="block"><h2>Launch deck</h2><div class="grid">${units.filter(u => u.id !== "alphabet-os").map(u =>
'<article class="card"><h3><a href="' + urlFor(u.id) + '">' + e(u.name) + '</a></h3><p>' + e(u.description) + '</p></article>').join("")}</div></section>
<section class="block"><h2>Command console</h2>
<p>Try <code>help</code>, <code>letters</code>, <code>find Athena</code>, <code>pin C</code>, <code>pins</code>, or <code>clear</code>. The console and pins run in your browser.</p>
<form id="command-form" class="row"><label>Command <input required id="command" autocomplete="off" maxlength="120"></label><button type="submit">Run</button></form>
<pre id="terminal" aria-live="polite">Alphabet OS ready.</pre>
<p><a href="${sovereigntyOS}">Open the existing Sovereignty OS project</a>.</p></section>`,

  "alphabet-sdk": `<section class="block"><h2>Read the data</h2>
<ul>${links([["Static dataset (JSON)", "./lexicon.json"], ["Public Worker API", "https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-apps/alphabet-sdk/api/lexicon?letter=T"], ["JavaScript module", "../common/tools.mjs"], ["Source and Node CLI", "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/nathan-ai/alphabet-trinities"]])}</ul>
<p>The API accepts <code>letter</code> (a letter in the corpus) and <code>q</code> (keywords). It returns the matching entries as JSON.</p>
<form id="sdk-form" class="row"><label>Try a query <input id="sdk-query" maxlength="100" value="Athena"></label><button>Search locally</button></form><pre id="sdk-result" aria-live="polite"></pre>
</section>`,

  "alphabet-hardware": `<section class="block"><h2>Three-register simulator</h2>
<p>Select bank A, B, or C. A clock edge can load an unsigned 8-bit value. Readback changes with the selected bank. Reset clears all three banks.</p>
<div class="row"><label>Bank <select id="bank"><option>A</option><option>B</option><option>C</option></select></label>
<label>Data (0–255) <input id="data" type="number" min="0" max="255" step="1" value="42"></label>
<label><span>Write enable</span><input id="enable" type="checkbox" checked></label>
<button type="button" id="clock">Clock edge</button><button type="button" id="hardware-reset">Reset</button></div>
<pre id="registers" aria-live="polite"></pre><p id="hardware-status" class="status" role="status"></p>
<h2>RTL and testbench</h2><ul>${links([["SystemVerilog register bank", "./alphabet-registers.sv"], ["Self-checking SystemVerilog testbench", "./alphabet-registers-tb.sv"]])}</ul>
<p>The files are ready for HDL simulation and synthesis. A physical FPGA build requires board pin assignments and timing constraints.</p>
</section>`,
};

export const scripts = new Set(["alphabet-field-app", "trinity-match", "letter-labyrinth", "alphabet-os", "alphabet-sdk", "alphabet-hardware"]);
const bookLinks = [
  ["A–Z Archive", archive], ["ONE App Hub", "https://one-sovereign-hub.nathantaboract.workers.dev/apps.html"],
  ["GitHub source", "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/nathan-ai/alphabet-trinities"],
];
const recordLink = "../../../../../docs/record/index.html";
const notice = '<aside id="nathan-record-notice" aria-label="Timestamped record" ' +
  'style="display:block!important;position:relative!important;box-sizing:border-box!important;' +
  'grid-column:1/-1;flex:0 0 100%;width:100%;padding:12px 16px;margin:0;' +
  'background:#fff0b3!important;color:#161616!important;border-bottom:3px solid #161616;' +
  'font:600 16px/1.5 system-ui,sans-serif;text-align:left;overflow-wrap:anywhere;">' +
  '<a href="' + recordLink + '" style="color:#161616!important;text-decoration:underline!important;">' +
  'READ THE TIMESTAMPED RECORD — Nathan Tabor / ChatGPT</a>' +
  '<span style="display:block;font-size:14px;font-weight:400;color:#161616!important;">' +
  'Repository changes, authorship complaints, correction claims, and unfinished work. ' +
  'Record opened November 5, 2026, 7:42:08 p.m. EST.</span></aside>';
function render(unit) {
  const hub = unit.id === "alphabet-trinities";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#141b19"><meta name="description" content="${e(unit.description)}">
<title>${e(unit.name)} · Nathan Tabor</title>
<link rel="stylesheet" href="../common/style.css">
<!-- github-pages-shell:start -->
<link rel="stylesheet" href="../../../appearance/shared.css" data-nathan-shared-appearance>
<link rel="stylesheet" href="../../../launcher/shared.css" data-nathan-command-center>
<script src="../../../appearance/engine.js"></script>
<script src="../../../appearance/app.js" defer></script>
<script src="../../../workspace.js" defer></script>
<script src="../../../assistant/engine.js" defer></script>
<script src="../../../launcher/engine.js" defer></script>
<script src="../../../launcher/app.js" defer></script>
<!-- github-pages-shell:end -->
${unit.id === "alphabet-field-app" ? '<link rel="manifest" href="./manifest.webmanifest">' : ""}
${scripts.has(unit.id) ? '<script type="module" src="./main.mjs"></script>' : ""}
</head>
<body>
${notice}

<a class="skip" href="#main">Skip to content</a>
<header class="site-nav wrap"><a class="brand" href="../alphabet-trinities/">NATHAN TABOR</a>
<nav aria-label="Project navigation"><a href="../alphabet-trinities/#projects">Projects</a><a href="../alphabet-books/">Books</a>${hub ? '<a href="../alphabet-field-app/">Field App</a>' : '<a href="../alphabet-trinities/">Alphabet Trinities</a>'}</nav></header>
<main class="wrap" id="main">
<header class="hero"><h1>${e(unit.name)}</h1><p class="lede">${e(unit.description)}</p>${hub ? '<p class="byline">The Trinity of T’s by Nathan Tabor</p>' : ""}</header>
${body[unit.id]}
</main>
<footer class="wrap"><nav aria-label="Related projects">${bookLinks.map(([label, href]) => '<a href="' + e(href) + '">' + e(label) + '</a>').join("")}</nav>
</footer>
</body>
</html>
`;
}

for (const unit of units) {
  await mkdir(new URL(unit.id + "/", root), { recursive: true });
  const contents = { "index.html": render(unit), "app.json": JSON.stringify(unit, null, 2) + "\n" };
  if (unit.id === "alphabet-sdk") contents["lexicon.json"] = JSON.stringify({ version: 1, entries: records }, null, 2) + "\n";
  for (const [name, data] of Object.entries(contents)) {
    const path = file(unit.id, name);
    if (process.argv.includes("--check")) {
      if (data !== await readFile(path, "utf8")) throw new Error("Regenerate " + path.pathname);
    } else {
      await writeFile(path, data);
    }
  }
}
