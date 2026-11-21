import { models } from "./lab.mjs";

const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => entities[c]);

const navigation = [["/", "Overview"], ["/archive", "Recovery archive"], ["/lab", "Calculation lab"], ["/downloads", "Downloads"]];
const worldHub = "https://tabor-world-hub.nathantaboract.workers.dev/";
const repository = "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core";
const defaultGitHub = repository + "/pull/316";
const numberFormat = new Intl.NumberFormat("en", { maximumSignificantDigits: 7 });
const format = value => numberFormat.format(value);

export function githubURL(sha) {
  return /^[a-f0-9]{40}$/.test(sha ?? "")
    ? repository + "/tree/" + sha + "/app-factory/tabor-world-hub/reaper-6969"
    : defaultGitHub;
}

export function frame(path, title, body, sha) {
  const nav = navigation.map(([href, name]) =>
    `<a href="${href}"${path === href ? ' aria-current="page"' : ""}>${name}</a>`).join("");
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} | Reaper 6969</title><link rel="stylesheet" href="/workbench.css">
<body><header class="top"><div class="top-inner"><a class="brand" href="/">REAPER 6969</a>
<nav aria-label="Workspace">${nav}</nav></div></header><main>${body}</main>
<footer><a href="${worldHub}">Tabor World Hub</a> · <a href="${githubURL(sha)}">GitHub source</a> · John Nathan Tabor</footer></body></html>`;
}

export function overview(sha) {
  return frame("/", "Owner workspace", `<section class="hero">
<p class="credit">John Nathan Tabor</p><h1>THE REAPER<br>6969 ENGINE</h1>
<p>The recovered kinetic, biomorphic, OXR, vehicle and software designs, with the original records and a working calculation lab.</p>
<div class="links"><a class="action" href="/archive">Open the recovery archive</a><a href="/lab">Run the models</a></div></section>
<div class="grid">
<section class="card"><h3>Hardware and vehicles</h3><p>The sealed thermal loop, displacement pumps and 69 Harmonic Shutter. KNIGHT Reaper Rider and SCR OXR SLEIGH.</p><a href="/archive#hardware">Hardware records</a></section>
<section class="card"><h3>Nathan AI and authorized systems</h3><p>Nathan AI, Mines, NODESMINDS, REAPER AI and the TOSCDD / USIC index. The archive also traces the motion, OBD, Arduino and OmniCore records.</p><a href="/archive#connections">Project connections</a></section>
<section class="card"><h3>Source and calculations</h3><p>Read your saved wording, download the Python file, and run the thermal, hydraulic and counter-rotation models in the browser.</p><a href="/downloads">Downloads and SHA-256</a></section></div>`, sha);
}

function inlineMarkdown(text) {
  const pattern = /\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*/g;
  let result = "";
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    result += escapeHtml(text.slice(offset, match.index));
    result += match[3] ? "<strong>" + escapeHtml(match[3]) + "</strong>" :
      '<a href="' + escapeHtml(match[2]) + '">' + escapeHtml(match[1]) + "</a>";
    offset = match.index + match[0].length;
  }
  return result + escapeHtml(text.slice(offset));
}

const sections = ["chronology", "hardware", "software", "connections", "gaps"];

export function archivePage(markdown, sha) {
  const blocks = markdown.trim().split(/\r?\n\s*\r?\n/);
  const article = blocks.map(block => {
    const lines = block.split(/\r?\n/);
    if (lines[0].startsWith("# ")) return "<h1>" + inlineMarkdown(lines[0].slice(2)) + "</h1>";
    const section = /^## (\d)\. (.+)$/.exec(block);
    if (section) return `<h2 id="${sections[Number(section[1])-1] ?? ""}">${inlineMarkdown(section[2])}</h2>`;
    if (lines[0].startsWith("> ")) return "<blockquote>" + inlineMarkdown(block.slice(2)) + "</blockquote>";
    if (lines.every(line => line.startsWith("|") && line.endsWith("|")) && lines.length > 2) {
      const cells = (line, tag) => line.slice(1, -1).split("|").map(cell =>
        "<" + tag + ">" + inlineMarkdown(cell.trim()) + "</" + tag + ">").join("");
      const rows = lines.slice(2).map(line => "<tr>" + cells(line, "td") + "</tr>").join("");
      return '<div class="table-wrap" tabindex="0"><table><thead><tr>' + cells(lines[0], "th") +
        "</tr></thead><tbody>" + rows + "</tbody></table></div>";
    }
    return "<p>" + inlineMarkdown(block.replace(/^## /, "")) + "</p>";
  });
  return frame("/archive", "Recovery archive",
    '<nav class="jump" aria-label="Archive sections">' + sections.map((id, i) =>
      `<a href="#${id}">${["Chronology", "Hardware", "Software", "Connections", "Source gaps"][i]}</a>`).join("") +
    '</nav><article>' + article.join("") + "</article>", sha);
}

export function labPage(modelID, params, result, error, sha) {
  const cards = Object.entries(models).map(([id, model]) => {
    const active = modelID === id;
    const fields = model.fields.map(([name, label, fallback]) => `<label>${escapeHtml(label)}
<input name="${name}" type="number" step="any" required value="${escapeHtml(active ? (params.get(name) ?? fallback) : fallback)}"></label>`).join("");
    const output = active && result ? '<div class="results"><table><tbody>' +
      result.metrics.map(([label, value, unit]) => `<tr><th scope="row">${escapeHtml(label)}</th><td>${format(value)} ${escapeHtml(unit)}</td></tr>`).join("") +
      '</tbody></table>' + (result.states ? '<div class="table-wrap"><table><thead><tr><th>State</th><th>Temperature (K)</th><th>Volume (m³)</th><th>Absolute pressure (Pa)</th></tr></thead><tbody>' +
        result.states.map(({ temperature_k, volume_m3, pressure_absolute_pa }, i) =>
          `<tr><th scope="row">${i+1}</th><td>${format(temperature_k)}</td><td>${format(volume_m3)}</td><td>${format(pressure_absolute_pa)}</td></tr>`).join("") +
        '</tbody></table></div>' : "") +
      `<p><a href="/api/lab?${escapeHtml(params.toString())}">Open result JSON</a></p></div>` : "";
    return `<section id="${id}" class="card"><h2>${model.title}</h2><p>${model.summary}</p>
<form method="get" action="/lab#${id}"><input type="hidden" name="model" value="${id}">
<div class="fields">${fields}</div><button>Calculate</button></form>
${active && error ? '<p class="error" role="alert">' + escapeHtml(error) + "</p>" : ""}${output}</section>`;
  }).join("");
  return frame("/lab", "Calculation lab", `<h1>Calculation lab</h1>
<p>Three models from the recovered Python analysis. Inputs are assumptions and outputs describe the models.</p>
${error && !Object.hasOwn(models, modelID) ? '<p class="error" role="alert">' + escapeHtml(error) + "</p>" : ""}
<div class="grid">${cards}</div>`, sha);
}

export function downloadsPage(files, sha) {
  const rows = files.map(file => `<tr><th scope="row"><a href="/downloads/${encodeURIComponent(file.filename)}">${escapeHtml(file.title)}</a></th>
<td>${format(file.bytes)} bytes</td><td class="digest">${escapeHtml(file.sha256)}</td></tr>`).join("");
  return frame("/downloads", "Owner downloads", `<h1>Owner downloads</h1>
<p>The archive files behind this deployment.</p><div class="table-wrap" tabindex="0"><table><thead>
<tr><th>File</th><th>Size</th><th>SHA-256</th></tr></thead><tbody>${rows}</tbody></table></div>
<p><a href="/api/manifest">Deployment and archive manifest</a></p>`, sha);
}
