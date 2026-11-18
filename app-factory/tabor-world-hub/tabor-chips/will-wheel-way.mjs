import { scheduleTicks, steps } from "./model.mjs";

export const originalText = `Where there is a will there is a way … but also … there’s a way where’s there a will … plus where there is a wheel there is a will … and where there is a will there is a wheel … and where’s there’s a way there’s a wheel 

So we got …

Will = wheel
Will = way
Wheel = will
Wheel = way
Way = will
Way = wheel

Them 

Will = Will

Wheel = Wheel

Way = Way`;

export const words = ["Will", "Wheel", "Way"];
const meanings = [
  [
    ["Where there is a will, there is a will.", "Check that the intention holds steady when the route or the tool changes."],
    ["Where there is a will, there is a wheel.", "Turn a decision into a repeatable motion. A practice routine gives the decision somewhere to go each day."],
    ["Where there is a will, there is a way.", "Let the intention set the destination. Compare available routes and choose an action you can take."]
  ],
  [
    ["Where there is a wheel, there is a will.", "A tool can surface an intention. An instrument in reach can give someone a reason to start practicing."],
    ["Where there is a wheel, there is a wheel.", "Check that the mechanism repeats its movement. Run the same cycle again and see whether the result holds."],
    ["Where there is a wheel, there is a way.", "A working mechanism can open a route. A drive wheel turns repeated rotation into distance traveled."]
  ],
  [
    ["Where there is a way, there is a will.", "Seeing a feasible route can renew the will to act. One attainable step makes the goal easier to commit to."],
    ["Where there is a way, there is a wheel.", "Let the route shape the mechanism. Its turns, surface, and distance determine what must carry you."],
    ["Where there is a way, there is a way.", "Check that the route still reaches its destination when you repeat it from the same starting point."]
  ]
];
export const relations = words.flatMap((from, i) => words.map((to, j) => ({
  from, to, statement: from + " = " + to,
  ownerLine: from + " = " + (i === j ? to : to.toLowerCase()),
  kind: i === j ? "Identity" : "Direction",
  phrase: meanings[i][j][0], interpretation: meanings[i][j][1]
})));

const indexOf = value => words.findIndex(word => word.toLowerCase() === value);
const urlFor = (from, to) => "/will-wheel-way?from=" + from.toLowerCase() + "&to=" + to.toLowerCase() + "#matrix";

export function readRelation(params) {
  return [indexOf(params.get("from") ?? "will"), indexOf(params.get("to") ?? "wheel")];
}

export function selectRelation(from, to) {
  const selected = relations[from * words.length + to];
  const nextWord = words.findIndex((_, i) => i !== from && i !== to);
  const route = from === to ? [from, to] : [from, to, nextWord, from];
  const reference = { clockHz: 110, bpm: 96 };
  const edges = scheduleTicks(reference.clockHz, reference.bpm, route.length - 1);
  return {
    selected, route: route.map(i => words[i]),
    next: urlFor(words[to], words[from === to ? to : nextWord]),
    reverse: urlFor(words[to], words[from]),
    reference: { ...reference, edges }
  };
}

const navigation = [
  "Clear obstacles between your intent and the route.",
  "Build the wheel that can carry the intent.",
  "Connect the wheel to the way you chose.",
  "Check that the way leads where the will intended."
];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
const link = (href, label) => `<a href="${esc(href)}">${esc(label)}</a>`;

export function renderWillWheelWay(selection, projects, source) {
  const { selected, route, next, reverse, reference } = selection;
  const matrix = words.map(from => `<tr><th scope="row">${from}</th>${words.map(to => {
    const current = from === selected.from && to === selected.to;
    return `<td class="${from === to ? "identity" : ""}"><a ${current ? 'aria-current="true"' : ""} href="${esc(urlFor(from,to))}">${from} = ${to}</a></td>`;
  }).join("")}</tr>`).join("");
  const trace = reference.edges.map((edge, i) => `<li><strong>${route[i]} → ${route[i+1]}</strong><span>${edge.ticksSincePrevious} ticks · ${edge.elapsedTicks} elapsed</span></li>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Will · Wheel · Way by Nathan Tabor</title><meta name="description" content="Nathan Tabor’s Will, Wheel, Way wordplay with nine relationships and two directions around the wheel."><link rel="stylesheet" href="/style.css"></head>
<body class="will-wheel-way"><a class="skip" href="#main">Skip to content</a><header><div class="wrap nav">
<a href="/">Tabor Chips</a><nav aria-label="Workspace"><a href="#matrix">Matrix</a><a href="#cycle">Timing</a><a href="#original">Original words</a>${link(projects.rhythm[1], "Rhythm Matrix")}</nav></div></header>
<main id="main" class="wrap">
<section class="hero"><div><p class="kicker">BY NATHAN TABOR</p><h1>Will <span>·</span> Wheel <span>·</span> Way</h1>
<p class="subtitle">Where there is a will there is a way</p>
<p class="intro">Choose which word leads. Follow the relationship, reverse it, or return to the same word.</p>
<div class="links"><a class="primary" href="#matrix">Explore the matrix</a><a href="#original">Read Nathan’s original words</a></div></div>
<aside aria-label="An interpretation of the three words"><div><strong>Will</strong><span>Intention</span></div><div><strong>Wheel</strong><span>Mechanism</span></div><div><strong>Way</strong><span>Route</span></div></aside></section>
<section id="matrix"><h2>Choose a relationship</h2><p>Read from the row to the column. The three diagonal cells repeat the same word.</p>
<div class="grid will-grid">
<div class="panel"><table class="will-table"><thead><tr><th scope="col">From ↓ To →</th>${words.map(word => `<th scope="col">${word}</th>`).join("")}</tr></thead><tbody>${matrix}</tbody></table></div>
<article class="panel"><p class="kicker">${selected.kind}</p><h3>${selected.statement}</h3><p class="will-phrase">${selected.phrase}</p><p>${selected.interpretation}</p>
<div class="links">${selected.kind === "Direction" ? `${link(reverse, "Reverse this relationship")}${link(next, "Follow the next step")}` : '<a href="#cycle">See the held beat</a>'}</div></article></div></section>
<section id="cycle"><h2>Turn the wheel</h2><p>The two loops cover all six directions. Start on any relationship to move the starting point.</p>
<div class="links"><a href="${esc(urlFor("Will","Wheel"))}">Will → Wheel → Way → Will</a><a href="${esc(urlFor("Will","Way"))}">Will → Way → Wheel → Will</a></div>
<div class="panel trace"><h3>${route.join(" → ")}</h3><p>One modeled beat per move at ${reference.bpm} BPM using the ${reference.clockHz} Hz reference clock.</p><ol>${trace}</ol>
<div class="links"><a href="/#timing">Tabor Chips timing lab</a>${link(projects.atlas[1] + "#lab", "Rhythm Matrix beat lab")}</div></div></section>
<section id="practice"><h2>The Nathan Tabor Way</h2><div class="grid foundations">${steps.map((step,i) => `<article><h3>${step.name} · ${step.equation}</h3><p>${navigation[i]}</p></article>`).join("")}</div></section>
<section id="original"><h2>Nathan’s original words</h2><div class="panel"><pre>${esc(originalText)}</pre></div></section></main>
<footer><div class="wrap links">${link(projects.hub[1], "Tabor World Hub")}<a href="/api/will-wheel-way">Matrix JSON</a><a href="/source/will-wheel-way.txt">Original text</a>${link(source, "GitHub source")}</div></footer></body></html>`;
}
