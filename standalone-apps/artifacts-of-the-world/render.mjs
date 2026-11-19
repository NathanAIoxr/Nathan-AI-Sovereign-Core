const entities = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"};
const h = value => String(value).replace(/[&<>"']/g, character => entities[character]);

const styles = `
  :root { color-scheme: dark; --bg:#141411; --field:#1d1c17; --line:#514934; --text:#f4eddc; --muted:#d4c7aa; --gold:#efcb84; }
  * { box-sizing: border-box; }
  body { margin:0; color:var(--text); background:var(--bg); font:1.06rem/1.65 system-ui,sans-serif; }
  header, main, footer { width:min(72rem,100% - 2.5rem); margin-inline:auto; }
  header { display:flex; flex-wrap:wrap; gap: .4rem 1.5rem; align-items:center; justify-content:space-between; padding:1.1rem 0; border-bottom:1px solid var(--line); color:var(--muted); font-size:.95rem; }
  nav a + a { margin-left:1.2rem; }
  main { padding-block:clamp(2.5rem,8vw,6rem); }
  h1, h2, h3 { font-family:Georgia,serif; font-weight:normal; line-height:1.15; margin:0 0 .65rem; }
  h1 { max-width:16ch; color:var(--gold); font-size:clamp(2.7rem,8vw,6.2rem); letter-spacing:-.04em; }
  h2 { font-size:clamp(1.75rem,3.4vw,2.5rem); }
  h3 { font-size:1.44rem; }
  p { max-width:69ch; }
  a { color:var(--gold); text-underline-offset:.22em; }
  a:focus-visible, input:focus-visible, button:focus-visible { outline:3px solid var(--gold); outline-offset:4px; }
  .intro { margin:1.2rem 0 2.4rem; color:var(--muted); font-size:1.17rem; }
  section { margin-top:2.8rem; }
  blockquote, article, .exercise { margin:0; padding:clamp(1rem,3vw,1.75rem); background:var(--field); border:1px solid var(--line); border-radius:.35rem; }
  blockquote { border-left:3px solid var(--gold); font-family:Georgia,serif; font-size:clamp(1.1rem,2.3vw,1.44rem); white-space:pre-wrap; }
  article p { margin:.5rem 0; }
  .type { display:block; color:var(--muted); font-size:.8rem; letter-spacing:.045em; margin-bottom:.55rem; }
  .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr)); gap:1rem; }
  .stack { display:grid; gap:1rem; }
  .links { display:flex; flex-wrap:wrap; gap:.35rem 1.8rem; list-style:none; padding:0; }
  .exercise p { margin-top:0; }
  ol li { padding:.25rem 0; }
  label { display:block; margin:.6rem 0; }
  input,button { background:var(--bg); color:var(--text); border:1px solid var(--line); border-radius:.3rem; padding:.45rem .65rem; font:inherit; }
  button { cursor:pointer; color:var(--gold); }
  input[type=number] { width:8rem; }
  input[type=checkbox] { accent-color:var(--gold); }
  output { display:block; margin-top:1rem; color:var(--gold); }
  footer { border-top:1px solid var(--line); padding:1.1rem 0 2rem; color:var(--muted); }
`;

const chargeScript = `const form = document.querySelector('#charge');
const result = document.querySelector('#charge-result');
form.addEventListener('submit', event => {
  event.preventDefault();
  const protons = form.elements.protons.valueAsNumber;
  const electrons = form.elements.electrons.valueAsNumber;
  if (!Number.isSafeInteger(protons) || !Number.isSafeInteger(electrons)) {
    result.textContent = 'Enter whole numbers within the listed ranges.';
    return;
  }
  const charge = protons - electrons;
  result.textContent = charge === 0 ? '0 · Neutral atom' :
    (charge > 0 ? '+' + charge + ' · Positive ion' : charge + ' · Negative ion');
});`;

const closingScript = `const form = document.querySelector('#closing');
const steps = [...form.querySelectorAll('input')];
const result = document.querySelector('#closing-result');
form.addEventListener('change', () => {
  const count = steps.filter(step => step.checked).length;
  result.textContent = count === steps.length ? 'All four steps checked.' : count + ' of four steps checked.';
});`;

function exercise(app) {
  if (app.id === "elemental-charge") {
    return `<section aria-labelledby="example"><h2 id="example">Calculate an ion’s net charge</h2><form id="charge" class="exercise">
<p>Use 11 protons and 10 electrons to model Na⁺. The result is in elementary-charge units.</p>
<label>Protons <input name="protons" type="number" min="1" max="118" value="11" required></label>
<label>Electrons <input name="electrons" type="number" min="0" max="150" value="10" required></label>
<button type="submit">Calculate</button><output id="charge-result" aria-live="polite"></output></form></section>`;
  }
  if (app.id === "end-that-war") {
    return `<section aria-labelledby="steps"><h2 id="steps">Work through the four steps</h2><form id="closing" class="exercise">
<label><input type="checkbox"> 1−1=0 · Name the harm and stop repeating it.</label>
<label><input type="checkbox"> 1+1=2 · Choose a repair.</label>
<label><input type="checkbox"> 1×1=1 · Carry it through.</label>
<label><input type="checkbox"> 1÷1=1 · Verify the result.</label>
<output id="closing-result" aria-live="polite">0 of four steps checked.</output></form></section>`;
  }
  return "";
}

export function render(app, apps, original) {
  const catalog = apps.find(entry => entry.id === "catalog");
  const isCatalog = app === catalog;
  const artifacts = apps.slice(1, 5);
  const topics = apps.slice(5);
  const cards = entries => entries.map(entry => `<article><h3><a href="${h(entry.origin)}/">${h(entry.title)}</a></h3><p>${h(entry.description)}</p></article>`).join("");
  const index = `<section id="record" aria-labelledby="original"><h2 id="original">Nathan Tabor’s original words</h2><blockquote>${h(original)}</blockquote><p><a href="/original.txt">Download the original text</a></p></section>
<section aria-labelledby="artifacts"><h2 id="artifacts">Named artifacts</h2><div class="cards">${cards(artifacts)}</div>
<p>The original says “I believe 16 different artifacts.” It names four objects here. The scope of the number and the remaining names are open.</p>
<p><a href="/api/catalog">Catalog and provisional artifact register (JSON)</a></p></section>
<section aria-labelledby="themes"><h2 id="themes">Nature, charge and the closing sequence</h2><div class="cards">${cards(topics)}</div></section>`;
  const notes = app.sections.map(([type, title, note, source]) =>
    `<article><span class="type">${h(type)}</span><h3>${h(title)}</h3><p>${h(note)}</p>${source ? `<p><a href="${h(source)}">Read the source</a></p>` : ""}</article>`).join("");
  const companions = app.links.length ? `<section aria-labelledby="related"><h2 id="related">Related Nathan AI projects</h2><ul class="links">${app.links.map(([label, url]) => `<li><a href="${h(url)}">${h(label)}</a></li>`).join("")}</ul></section>` : "";
  const script = app.id === "elemental-charge" ? chargeScript : app.id === "end-that-war" ? closingScript : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${h(app.title)} · Nathan Tabor</title><style>${styles}</style></head><body><header><span>Nathan Tabor</span>
<nav aria-label="Main navigation">${isCatalog ? '<a href="#record">Original words</a><a href="#artifacts">Artifacts</a>' : `<a href="${h(catalog.origin)}/">The Artifacts of the world</a><a href="/api/record">Dossier data</a>`}</nav></header>
<main><h1>${h(app.title)}</h1><p class="intro">${h(app.description)}</p>
${isCatalog ? index : `<section class="stack" aria-label="Dossier">${notes}</section>${exercise(app)}${companions}`}</main>
<footer><a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/standalone-apps/artifacts-of-the-world">GitHub source</a></footer>
${script ? '<script>' + script + '</script>' : ""}</body></html>`;
}
