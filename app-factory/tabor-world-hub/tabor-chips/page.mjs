const escape = str => String(str).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]);
const link = (href, label) => `<a href="${escape(href)}">${escape(label)}</a>`;

export function page({ assets, anchors, steps, projects, source, chipSource, reference }) {
  const { chip, continuation } = assets;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tabor Chips · Nathan AI Sovereign Supercomputer</title><meta name="description" content="Nathan Tabor’s full chip-to-cloud architecture and live Rhythm Matrix timing lab.">
<link rel="stylesheet" href="/style.css"><script type="module" src="/client.mjs"></script></head>
<body><a class="skip" href="#main">Skip to content</a><header><div class="wrap nav">
${link(projects.hub[1], "Tabor World Hub")}<nav aria-label="Workspace"><a href="#layers">Engineering tracks</a><a href="#timing">Timing lab</a><a href="#projects">Connected projects</a></nav></div></header>
<main id="main" class="wrap">
<section class="hero"><div><p class="kicker">BY NATHAN TABOR</p><h1>Tabor Chips</h1><p class="subtitle">Enhanced Nathan AI Sovereign Supercomputer</p>
<p class="intro">The chip-to-cloud architecture and a timing lab that connects the Rhythm Matrix, the Sovereign Supercomputer, and True Cloud Computing.</p>
<div class="links"><a class="primary" href="#timing">Run the timing lab</a><a href="#layers">Explore all ${chip.layers.length} tracks</a></div></div>
<aside aria-label="The Nathan Tabor Way">
${steps.map(step => `<div><span>${step.clock} o’clock</span><strong>${step.name}</strong><b>${step.equation}</b></div>`).join("")}
</aside></section>

<section id="foundation"><h2>From physical atoms to software</h2><p>Four foundations map the same computing functions across a phone, a rack, an undersea cable, and a cloud runtime.</p>
<div class="grid foundations">${anchors.map(anchor => `<article><h3>${escape(anchor.title)}</h3><p>${escape(anchor.detail)}</p>
<div class="track-links">${anchor.layers.map(number => link("#track-" + number, chip.layers.find(layer => layer.number === number).name.replace(/^Tabor /, ""))).join("")}</div></article>`).join("")}</div></section>

<section id="layers"><h2>Tabor Chips engineering tracks</h2>
<p>${escape(chip.standing_tag)} · ${link("/source/architecture.md", "Full architecture text")} · ${link(chipSource, "Original GitHub source")}</p>
<div class="grid">${chip.layers.map(layer => `<details id="track-${layer.number}" class="track">
<summary><span class="number">${layer.number}</span>${escape(layer.name)}</summary>
<p>${escape(layer.scope)}</p><p class="small">Assigned role · ${escape(layer.agent)}</p>
<ul>${layer.deliverables.map(deliverable => `<li>${escape(deliverable)}</li>`).join("")}</ul></details>`).join("")}</div>
<details class="panel reference"><summary>NVIDIA and the reference systems</summary>
<p>${escape(chip.reference_baselines.join(" · "))}</p>
<p>NVIDIA publishes ${reference.graceCpus} Grace CPUs, ${reference.blackwellGpus} Blackwell GPUs, ${reference.hbm3eTb} TB of HBM3e, and ${reference.nvlinkBandwidthTbPerS} TB/s of NVLink bandwidth for its GB200 NVL72 rack. ${link(reference.source, "NVIDIA specifications")}</p>
<p>Tabor Chips has separate engineering tracks, and its 2X+ performance figures remain design targets.</p></details></section>

<section id="timing"><h2>Rhythm-to-clock timing lab</h2><p>Choose a cicada year and a demonstration tempo. The lab fetches the Rhythm Matrix schedule and score count, converts each score pulse into timer ticks, and returns a receipt alongside the live 2X+ and True Cloud checks.</p>
<div class="panel"><form action="/api/run" id="timing-form">
<label>Cicada year<input name="year" type="number" min="-10000" max="10000" value="2024" required></label>
<label>Reference clock (Hz)<input name="clockHz" type="number" min="5" max="1000000000" value="110" required></label>
<label>Tempo (BPM)<input name="bpm" type="number" min="20" max="300" value="96" required></label>
<button class="primary">Run and verify</button></form>
<p class="small">110 Hz is the 4T Clover design reference. The timer model compares tick placement. Cicada phases are reported independently in years.</p>
<p id="run-status" role="status"></p>
<div id="run-result" hidden>
<dl id="run-metrics" class="metrics"></dl><ol id="run-steps"></ol>
<details><summary>Timer tick trace</summary><div class="scroller"><table><thead><tr><th>Pulse</th><th>Interval ticks</th><th>Elapsed ticks</th><th>Error (ticks)</th></tr></thead><tbody id="run-rows"></tbody></table></div></details>
<p id="live-sources" class="small"></p><a id="run-json" href="/api/run">Open run JSON</a></div></div></section>

<section id="projects"><h2>Connected projects</h2><div class="grid destinations">
${Object.values(projects).map(([name, url]) => link(url, name)).join("")}</div>
<details class="panel"><summary>Master Continuation Map · ${continuation.workstreams.length} workstreams</summary>
<ul class="continuation">${continuation.workstreams.map(row => `<li><strong>${escape(row.name)}</strong> · ${escape(row.continuation_tag)}<p>${escape(row.scope)}</p></li>`).join("")}</ul>
</details></section>
</main>
<footer><div class="wrap links">${link(source, "GitHub source")}${link("/api/architecture", "Architecture JSON")}${link("/api/receipt", "Deployment receipt")}</div></footer></body></html>`;
}
