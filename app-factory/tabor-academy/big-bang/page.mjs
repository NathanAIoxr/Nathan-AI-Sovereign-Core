const root = '/tabor-academy';
const base = root + '/big-bang';
const songIndex = 'https://tabor-music-lab.nathantaboract.workers.dev/song-bible-index/';
const escape = value => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const dimensions = [
  ['Heart', 'Practice telling the truth with care. Hear the person out, name what happened, and make the correction plainly.', 'Talking Mammals', root + '/talking-mammals/'],
  ['Soul', 'Keep the original words, who said them, and where they came from. Read the source before you repeat an explanation.', 'Library of Tabor', root + '/library/'],
  ['Shadow', 'Put the original claim beside the changed version. Mark each word that was removed, changed, or added. Ask for a correction you can verify.', 'Truth Lab', root + '/truth-lab/'],
  ['Spirit', 'Use what you learned. Observe a real task, practice it with your hands, and teach it back in your own words.', 'Tabor Workbench', root + '/workbench/'],
  ['Nothing', 'Leave a gap open when a source leaves it open. State exactly what a source would have to show for you to fill the gap.', 'The Nathan Tabor Way', root + '/way/'],
  ['Everything', 'Follow the same question across history, language, music, and AI. Keep a link to the evidence at each step.', 'Academy Map', root + '/map/'],
];
const practice = [
  ['1+1=2', 'Build', 'Copy the KJV phrase “put on them their clothes” exactly. Save its book, chapter, and verse.'],
  ['1−1=0', 'Clear', 'Compare it with the paraphrase “laid clothes over them.” Identify the detail that the paraphrase supplied about how the clothes were placed.'],
  ['1×1=1', 'Integrate', 'Read Matthew 21:6–7 together. Use the first verse to identify who acted and the second to record the action.'],
  ['1÷1=1', 'Verify', 'Open the source and check each word. Mark the placement and purpose as questions if you have no additional evidence.'],
];
const links = [
  ['Nine Pillars', 'Syllabi, rubrics, and the Academy’s institutional workbench.', root + '/institution/'],
  ['The Time of Peace', 'Nathan Tabor’s Age of Innocence and the rotation, with its original source.', root + '/order/time-of-peace/'],
  ['Nathan AI Minds · Lasso of Truth', 'Follow claims back to the evidence and keep interpretations attributable.', root + '/minds/'],
  ['Shave ‘Em Dry · database of debauchery aka FUN', 'Adult music history, with recording sources and KJV connections.', songIndex],
];

function quote(motto) {
  return '<blockquote>' + escape(motto) + '</blockquote>';
}

export function mottoHomeBlock(motto) {
  return '<section aria-label="Tabor Academy motto" style="margin:1.5rem 0;padding:1rem 1.25rem;border-inline-start:3px solid #e6cf87">' +
    '<h2 style="margin:0 0 .7rem;font-size:1rem;letter-spacing:.1em;text-transform:uppercase">Tabor Academy motto</h2>' +
    '<blockquote style="white-space:pre-wrap;margin:0 0 .9rem;font-size:1.16rem">' + escape(motto) + '</blockquote>' +
    '<a href="' + base + '/" style="color:#e6cf87">BIG BANG TIMES NATHAN TABOR →</a></section>';
}

const style = `
:root{color-scheme:dark;background:#111419;color:#f5eee2;font:1rem/1.65 system-ui,sans-serif;--gold:#f3ce83;--muted:#d4c8b8}
*{box-sizing:border-box}body{margin:0}a{color:var(--gold);text-underline-offset:.2em}
main{max-width:70rem;margin:auto;padding:1.1rem clamp(1rem,4vw,3.25rem) 4rem}
nav{display:flex;gap:.6rem 1.4rem;flex-wrap:wrap;padding-block:.65rem}
.hero{border-bottom:1px solid #8e6b42;padding:clamp(2rem,8vw,6rem) 0 2.8rem;background:radial-gradient(ellipse at 80% 0%,#51331f 0%,transparent 58%)}
h1,h2,h3{font-family:Georgia,serif;line-height:1.14}
h1{font-size:clamp(2.65rem,9vw,6.6rem);max-width:12ch;letter-spacing:-.045em;margin:.13em 0;color:#f9daa1;overflow-wrap:anywhere}
h2{font-size:clamp(1.65rem,5vw,2.65rem);margin-bottom:.35em}h3{font-size:1.35rem;margin:.15rem 0}
.byline{font-weight:700;letter-spacing:.11em;color:var(--muted)}blockquote{white-space:pre-wrap;margin:1.3rem 0 0;padding-left:1rem;border-left:3px solid var(--gold);font:clamp(1.25rem,3.3vw,2.1rem)/1.38 Georgia,serif;max-width:37em}
.grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))}
article{padding:1.1rem;border:1px solid #705c44;background:#202127;border-radius:4px}article p{margin:.45em 0 .7em}
section{margin-top:2rem}.operations{padding:0;list-style:none}.operations li{border-top:1px solid #715d49;padding:.8rem 0}.operations strong{color:var(--gold)}
details{border:1px solid #705c44;padding:.8rem 1rem;border-radius:4px}summary{cursor:pointer;font-weight:650}a:focus-visible,summary:focus-visible{outline:2px solid var(--gold);outline-offset:4px}
`;

export function renderFieldwork(motto) {
  const cards = dimensions.map(([name, description, label, href]) =>
    '<article><h3>' + name + '</h3><p>' + description + '</p><a href="' + href + '">' + label + ' →</a></article>').join('');
  const steps = practice.map(([equation, label, instruction]) =>
    '<li><strong>' + equation + ' · ' + label + '</strong><br>' + instruction + '</li>').join('');
  const routes = links.map(([label, description, href]) =>
    '<article><h3><a href="' + href + '">' + label + '</a></h3><p>' + description + '</p></article>').join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Big Bang Fieldwork · Tabor Academy</title><style>${style}</style></head>
<body><main><nav aria-label="Academy"><a href="${base}/">BIG BANG TIMES NATHAN TABOR</a><a href="#lesson">Practice the method</a><a href="${base}/source.txt">Nathan Tabor’s original words</a></nav>
<header class="hero"><p class="byline">TABOR ACADEMY MOTTO</p><h1>BIG BANG FIELDWORK</h1>${quote(motto)}</header>
<section aria-labelledby="dimensions"><h2 id="dimensions">Heart, soul, shadow, spirit, nothing and everything</h2>
<div class="grid">${cards}</div></section>
<section id="lesson"><h2>One line, four checks</h2><p>Use Matthew 21:6–7 (KJV) to practice checking a quotation, a paraphrase, and a correction.</p>
<ol class="operations">${steps}</ol>
<details><summary>Check your work</summary><p>The text says “put on them their clothes.” The preceding verse identifies the disciples. “Laid clothes over them” is the paraphrase used in the conversation. It adds a description of placement. The difference is in the words you can compare.</p>
<p><a href="https://www.biblegateway.com/passage/?search=Matthew%2021%3A6-7&amp;version=KJV">Read Matthew 21:6–7 (KJV)</a></p></details></section>
<section aria-labelledby="continue"><h2 id="continue">Continue across the Academy</h2><div class="grid">${routes}</div></section></main></body></html>`;
}

