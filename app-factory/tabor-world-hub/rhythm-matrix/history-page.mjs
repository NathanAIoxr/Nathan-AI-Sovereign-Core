import { domains, eras, history } from "./history-catalog.mjs";
import { patterns, periods } from "./history-lab.mjs";
import { escape, githubLink } from "./page.mjs";

const selectOptions = (labels, all) => `<option value="">${all}</option>` +
  Object.entries(labels).map(([key, label]) => `<option value="${key}">${escape(label)}</option>`).join("");
const periodOptions = selected => periods.map(([key, label]) =>
  `<option value="${key}"${key === selected ? " selected" : ""}>${escape(label)}</option>`).join("");

export function renderHistory(revision) {
  const groups = Object.entries(eras).map(([k, label]) => `<section class="history-group" id="era-${k}" data-era-group>
<h3>${escape(label)}</h3><ol class="history-records">
${history.filter(entry => entry.era === k).map(entry => `<li id="${entry.id}" data-history-record data-era="${k}" data-domain="${entry.domain}">
<div class="history-date"><strong>${escape(entry.date)}</strong><span>${escape(entry.evidence)}</span></div>
<div><h4><a href="#${entry.id}" aria-label="Link to ${escape(entry.title)}">${escape(entry.title)}</a></h4>
<p class="history-region">${escape(entry.region)} · ${escape(domains[entry.domain])}</p>
<p>${escape(entry.description)}</p>
<p class="sources"><a href="${escape(entry.source.url)}">${escape(entry.source.title)}</a></p></div></li>`).join("")}</ol></section>`).join("");

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ancient to Modern Rhythms · THE RHYTHM MATRIX</title>
<meta name="description" content="A source-linked atlas of music, dance, clocks, natural cycles and digital timing, from Ice Age instruments to browser audio.">
<link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/history.css"><script type="module" src="/history-client.mjs"></script></head>
<body><a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap top-inner"><a class="brand" href="/">THE RHYTHM MATRIX</a>
<nav aria-label="Rhythm Matrix"><a href="/#chronology">Nathan’s chronology</a><a href="#timeline">Timeline</a><a href="#lab">Rhythm lab</a></nav>
</div></header>
<main id="main" class="wrap history-page">
<section class="history-hero">
<p class="byline">THE RHYTHM MATRIX · NATHAN TABOR</p><h1>Ancient to<br>Modern Rhythms</h1>
<p class="hero-copy">Trace rhythm from Ice Age instruments to digital clocks, alongside the living traditions and natural cycles that carry time today.</p>
<div class="actions"><a href="#timeline" class="primary">Browse ${history.length} entries</a><a href="#lab">Try the rhythm lab</a></div>
<nav class="era-index" aria-label="Timeline sections">${Object.entries(eras).map(([key, label]) => `<a href="#era-${key}">${escape(label)}</a>`).join("")}</nav>
</section>
<section id="timeline" class="section">
<div class="section-head"><div><h2>Rhythm through time</h2></div><p>Dates identify the evidence available. Heritage listings document living practices with histories of their own.</p></div>
<div class="panel history-tools" hidden>
<label>Search <input id="history-search" type="search" placeholder="Cicada, drumming, Japan…"></label>
<label>Section <select id="history-era">${selectOptions(eras, "All sections")}</select></label>
<label>Topic <select id="history-domain">${selectOptions(domains, "All topics")}</select></label>
<button type="button" id="history-clear">Clear filters</button></div>
<p id="history-count" class="micro" role="status">${history.length} entries</p>
${groups}
</section>
<section id="lab" class="section">
<div class="section-head"><div><h2>Rhythm lab</h2></div><p>Hear how pulses are grouped, then compare the duration of rhythms from the body, Earth and sky.</p></div>
<div class="history-labs">
<article class="panel lab-card"><h3>Play a pattern</h3><p>Listen to simplified pulse models. The groups show the structure used in each example.</p>
<div class="lab-controls" hidden><label>Pattern <select id="pattern">${patterns.map(({id, label}) => `<option value="${id}">${escape(label)}</option>`).join("")}</select></label>
<label>Tempo <input type="range" id="pattern-tempo" min="48" max="180" value="96"><output id="pattern-bpm">96 BPM</output></label>
<div id="pattern-grid" class="pattern-grid" aria-label="Pulse pattern"></div>
<div class="actions"><button class="primary" id="pattern-play" type="button">Play two cycles</button><button id="pattern-stop" type="button" disabled>Stop</button></div></div>
<p id="pattern-status" class="micro" role="status">Audio starts when you press Play.</p></article>
<article class="panel lab-card"><h3>Compare cycle lengths</h3><p>Choose two examples to see their periods in the same unit.</p>
<div class="lab-controls" hidden><label>First cycle <select id="period-first">${periodOptions("brood-19")}</select></label>
<label>Second cycle <select id="period-second">${periodOptions("brood-13")}</select></label></div>
<output id="period-output" class="period-result" aria-live="polite">The 17-year cycle is about 1.31 times as long as the 13-year cycle.</output>
<p class="micro">Year presets use 365.2425 days. Natural periods are examples or averages.</p></article>
</div></section>
</main><footer><div class="wrap actions"><a href="/">Back to the Rhythm Matrix</a><a href="/api/history">Catalog JSON</a><a href="${escape(githubLink(revision))}">GitHub source</a></div></footer>
</body></html>`;
}
