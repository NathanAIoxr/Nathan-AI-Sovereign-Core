import { branches, docs, timeline, pillars, naturalRhythms } from "./catalog.mjs";
import { cycleAt, heartbeat, heartbeatQuote, pitchMultiplier, pulseCount, score } from "./model.mjs";

export const escape = str => String(str).replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));
const links = refs => refs.map(id => docs[id]).map(({ title, url }) =>
  `<a href="${escape(url)}">${escape(title)}</a>`).join(" · ");
const sources = refs => `<p class="sources">${links(refs)}</p>`;
const branchLabels = new Map(branches);

export function githubLink(revision) {
  const valid = /^[a-f0-9]{40}$/.test(revision ?? "");
  const repo = "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core";
  return valid ? repo + "/tree/" + revision + "/app-factory/tabor-world-hub/rhythm-matrix" : repo + "/pull/316";
}

export function renderPage(revision) {
  const state = cycleAt(2024);
  const clock = state.broods.map(b => `<div class="lane"><div class="lane-label"><strong>${b.name}</strong><span>${b.cycleYears}-year cycle</span></div>
<div class="ticks" data-period="${b.cycleYears}">${Array.from({length:b.cycleYears}, (_, i) =>
    `<span class="tick${i === 0 ? " at-phase" : ""}" aria-hidden="true"></span>`).join("")}</div>
<p id="phase-${b.cycleYears}">Phase 0 of ${b.cycleYears} · next emergence ${b.nextYear}</p></div>`).join("");
  const scoreRows = score.map(([line,count,thumb,pinky], i) => `<tr data-phrase-row="${i}">
<td><button type="button" class="play-phrase" data-phrase="${i}" aria-label="Play phrase ${i+1}">▶</button></td>
<th scope="row">${escape(line)}</th><td>${count}</td><td>${thumb} → ${pinky}</td></tr>`).join("");
  const arrows = { up:"↑", down:"↓", left:"←", right:"→" };
  const steps = heartbeat.map((word, i) =>
    `<li class="${i < 4 ? "vertical" : "lateral"}" data-movement="${i}"><span aria-hidden="true">${arrows[word]}</span><small>${word}</small></li>`).join("");
  let pillarNumber = 0;
  const pillarCards = pillars.map(([group, names]) => `<article class="pillar"><h3>${group}</h3><ul>
${names.map(name => `<li><span class="key">P${String(++pillarNumber).padStart(2, "0")}</span> ${escape(name)}</li>`).join("")}</ul></article>`).join("");
  const records = timeline.map(({ date,branch,name,description,references }) => `<li data-record data-branch="${branch}">
<p class="record-date"><time datetime="${date}">${date}</time><span>${branchLabels.get(branch)}</span></p>
<div><h3>${escape(name)}</h3><p>${escape(description)}</p>${references.length ? sources(references) : ""}</div></li>`).join("");
  const rhythmList = naturalRhythms.map(([id, name]) => `<li><span class="key">NTA-${String(id).padStart(3,"0")}</span> ${escape(name)}</li>`).join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>THE RHYTHM MATRIX · Nathan Tabor</title><meta name="description" content="Nathan Tabor’s 13- and 17-year Magi cicada rhythms, music, heartbeat, Mother Earth and acoustic archive.">
<link rel="stylesheet" href="/style.css"><script type="module" src="/app.mjs"></script></head>
<body><a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap top-inner">
<a class="brand" href="/">THE RHYTHM MATRIX</a><nav aria-label="Workspace">
<a href="#cycles">Cycles</a><a href="#music">Music</a><a href="#earth">Mother Earth</a><a href="#voice">The Voice</a><a href="#chronology">Chronology</a><a href="/history">Ancient to Modern</a>
</nav></div></header>
<main id="main" class="wrap">
<section class="hero">
<div><p class="byline">BY NATHAN TABOR</p><h1>THE RHYTHM<br>MATRIX</h1>
<p class="hero-copy">13 and 17 Magi cicada rhythms, the heartbeat of humanity, Mother Earth, and the music that connects them in Nathan Tabor’s work.</p>
<div class="actions"><a class="primary" href="#cycles">Explore the cycles</a><a href="#chronology">Read the chronology</a><a href="/history">Explore Ancient to Modern Rhythms</a><a href="https://tabor-chips.nathantaboract.workers.dev/#timing">Tabor Chips timing lab</a><a href="https://tabor-chips.nathantaboract.workers.dev/will-wheel-way">Will · Wheel · Way</a></div></div>
<aside class="hero-count" aria-label="Two cicada clocks"><div><strong>13</strong><p>YEAR CYCLE<br>Brood XIX</p></div><div><strong>17</strong><p>YEAR CYCLE<br>Brood XIII</p></div><p>221 years between scheduled shared emergences</p></aside>
</section>

<section id="cycles" class="section">
<div class="section-head"><div><p class="eyebrow">MAGI CICADA</p><h2>Two clocks through time</h2></div><p>Explore the idealized schedules of Broods XIX and XIII, anchored to their 2024 co-emergence.</p></div>
<div class="panel cycle-panel">
<div class="controls year-controls"><button id="earlier" type="button" aria-label="Previous year">←</button>
<label>Year <input id="year" type="number" min="-10000" max="10000" step="1" value="2024"></label>
<button id="later" type="button" aria-label="Next year">→</button>
<div class="jump-years"><button type="button" data-year="1803">1803</button><button type="button" data-year="2024">2024</button><button type="button" data-year="2245">2245</button></div>
</div>
<label class="range-label" for="window">1803–2245 comparison window</label><input id="window" type="range" min="1803" max="2245" value="2024">
<div class="lanes">${clock}</div>
<p id="shared-status" class="result" role="status">2024 · both broods scheduled. Next shared year: 2245.</p>
<p class="micro">The model uses modulo 13 and modulo 17. It gives a scheduled year rather than a field observation at a particular site. Local timing and off-cycle emergences require observation.</p>
</div>
<div class="cards math-cards">
<article><h3>17 − 13 = 4</h3><p>Difference in cycle lengths. Four-year off-cycle emergences are documented. The proposed common developmental clock is part of the Rhythm Matrix research.</p>${sources(["offcycle","dimensions"])}</article>
<article><h3>13 + 17 = 30</h3><p>God’s Two Calendars and God’s One Timeline makes a separate 13-month and 17-month reading, using KJV anchors for seasons, signs and time.</p>${sources(["calendars","kjv"])}</article>
<article><h3>17 + 17 = 34</h3><p>13 + 21 also gives 34. The archive calls 34 the Heartbeat Constant and names the Golden Ratio Frequency Key (17) and Divine Energy Variable (13).</p>${sources(["registry"])}</article>
<article><h3>13 × 17 = 221</h3><p>1803 and 2024 are aligned years for these two specific broods. The next scheduled shared year is 2245. The workbook keeps 211 as a separate research comparison.</p>${sources(["align","broods","matrix","expanded"])}</article>
</div>
</section>

<section id="music" class="section">
<div class="section-head"><div><p class="eyebrow">THE HEARTBEAT OF HUMANITY</p><h2>Music - The Language of God</h2></div><p>Eight phrases. Five black notes. Thumb and pinky.</p></div>
<div class="panel">
<div class="controls"><button id="play-score" class="primary" type="button">Play ${pulseCount} pulses</button><button id="stop-score" type="button" disabled>Stop</button>
<label>Demo tempo <input id="tempo" type="range" min="48" max="180" value="96"></label><output id="tempo-label">96 BPM</output></div>
<p id="audio-status" role="status" class="micro">The preview plays the recovered note pairs as synthesized pulses.</p>
<div class="table-wrap" tabindex="0" aria-label="Eight-part piano score"><table><thead><tr><th>Play</th><th>Your phrase</th><th>Pulses</th><th>Thumb → pinky</th></tr></thead>
<tbody>${scoreRows}</tbody></table></div>
${sources(["cords","contour","score","music"])}
</div>
<div class="cards">
<article><h3>The Secret Cords of David</h3><p>The September score links the O Holy Night contour, The Little Drummer Boy cadence, the four-pulse core, and the two-pulse Final Drop. Key classes: F♯, G♯, A♯, C♯ and D♯. The source skips 0, 1, 2 and 3.</p>${sources(["cords","contour"])}</article>
<article><h3>The 19 Secret Chords</h3><p>Nine Inferno positions, one silent Equator measure, and nine Babel positions. The October study uses two hands, 4/4 at 96 BPM, and STOMP · STOMP · CLAP · REST.</p>${sources(["piano","mp3","midi","cadence","cadenceMidi"])}</article>
</div>
<div class="panel motion"><h3>Four vertical · Thirteen lateral</h3><blockquote>${escape(heartbeatQuote)}</blockquote>
<ol class="motion-grid" aria-label="The 17-movement heartbeat sequence">${steps}</ol>
<div class="controls"><button id="advance-motion" type="button">Next movement</button><button id="run-motion" type="button">Play movements</button><button id="reset-motion" type="button">Reset</button><span id="motion-status" role="status">17 movements</span></div>
<p>The October Rhythm Matrix connects this directional cadence to the ocean pattern heard during The Sopranos. The 9, 13, 21.2 and 62.2 year ocean series belong to the research comparison. Wave-crest periods use seconds.</p>${sources(["dimensions","aura","noaa"])}
</div>
</section>

<section id="earth" class="section">
<div class="section-head"><div><p class="eyebrow">MOTHER EARTH &amp; FATHER TIME</p><h2>The core and the clock</h2></div><p>OXR, Reaper 69696969, The Heartbeat and the geological-computer records.</p></div>
<div class="cards">
<article><h3>OXR and ONE sovereign BOX</h3><p>Mrs. Evans and the five magnetic fields appear in the Owens Cross Roads recollection. The six-anchor geometry places OXR first and uses the core as the origin. The Age Paradox carries the ancient dirt and water theme into forward and reverse biblical time.</p>${sources(["earthTime","registry","kjv"])}</article>
<article><h3>NT-1 and the planetary pulse</h3><p>NT-1 records 7.83 Hz as a symbolic Schumann reference. NT_f DRUM BEATER RESONANCE: 7,830 is recorded separately. The OBD observability engine is named THE HEARTBEAT. Reaper 69696969 carries the balancing and retuning theme.</p>${sources(["nt1","drum","obd","reaper","nasa"])}</article>
<article><h3>4T Clover</h3><p>Torrent processes, Terraces hold memory, Tunnels route, and Terminal clocks the geological-computer design. The proposed 110 Hz clock is a design parameter. The source models human heartbeat as a hardware-cycle analogy.</p>${sources(["clover","earth"])}</article>
<article><h3>Coexistence and natural rhythm</h3><p>Biological Cycles, Bio-Acoustic Partitioning and Coexistence Principle appear in the Multi-Frequency Reality Framework. The archive connects Natural, Tabornome, and the drum-beater imagery to this branch.</p>${sources(["aura","tabor","map"])}</article>
</div>
<details class="panel rhythm-register"><summary>Open the 34 Cosmic &amp; Natural Rhythms register</summary><ol>${rhythmList}</ol>${sources(["registry"])}</details>
</section>

<section id="voice" class="section">
<div class="section-head"><div><p class="eyebrow">THE VOICE</p><h2>PI × PHI × PIE</h2></div><p>The October 23 calculation uses π, rounded φ = 1.618 and WHOLE = 1.0.</p></div>
<div class="panel scale-panel"><div class="controls"><label>Input <input id="scale-input" type="number" min="0" max="1000000000" step="any" value="423"></label>
<div class="jump-years">${[423,202.8,10,13,7.83,110].map(x=>`<button type="button" data-scale="${x}">${x}</button>`).join("")}</div></div>
<p class="result">× ${pitchMultiplier.toFixed(10)} = <output id="scale-result" aria-live="polite">2,150.1500</output></p>
<p class="micro">The calculator preserves the input unit. Model values and symbolic references carry their own meaning.</p>
${sources(["voice","voiceEngine","waveform","waveform3"])}</div>
<h2>17 Root Pillars</h2><p>The recovered October 29 source groups 17 named concepts in four stations. The source supplies names and identifiers.</p>
<div class="cards pillars">${pillarCards}</div>${sources(["pillars","rootsIndex"])}
</section>

<section id="chronology" class="section">
<div class="section-head"><div><p class="eyebrow">2025–2026</p><h2>Chronology and source records</h2></div><p>Find work by title, phrase or branch.</p></div>
<div class="controls timeline-controls"><label>Search <input id="archive-search" type="search" placeholder="e.g. KURENAI" maxlength="130"></label>
<label>Branch <select id="archive-branch"><option value="">All branches</option>${branches.map(([id,label])=>`<option value="${id}">${label}</option>`).join("")}</select></label><span id="record-count" role="status">${timeline.length} records</span></div>
<ol id="timeline" class="timeline">${records}</ol><p id="no-records" hidden>No matching records.</p>
<p class="micro">An incomplete date shows the precision available in the archive. The early Python originals, full “every tick” passage, and an independent 17-frequency table remain source gaps.</p>
</section>
</main><footer><div class="wrap"><a href="https://tabor-world-hub.nathantaboract.workers.dev/">Tabor World Hub</a> · <a href="${githubLink(revision)}">GitHub source</a> · <a href="/api/catalog">Catalog JSON</a> · <a href="/api/receipt">Deployment receipt</a></div></footer>
</body></html>`;
}
