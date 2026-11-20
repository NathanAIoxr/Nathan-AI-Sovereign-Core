const academy = "/tabor-academy/";
const bigBang = academy + "big-bang/";
const base = bigBang + "evidence/";
const cockpit = "https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites";
const title = "Big Bang Evidence Challenges";

const zones = [
  {
    id: "truth", name: "Truth Lab", task: "Question the claim and build a proof sheet.",
    links: [["Enter Truth Lab", academy + "truth-lab/"]],
  },
  {
    id: "minds", name: "Sovereign Minds", task: "Compare a statement with the source that supports its attribution.",
    links: [["Academy Minds", academy + "minds/"], ["Sovereign directory", "/sovereign-minds/"], ["Zero", "/sovereign-minds/zero/"], ["One", "/sovereign-minds/one/"]],
  },
  {
    id: "lasso", name: "Lasso of Truth", task: "Check the source and decide what can be released.",
    links: [["Reviewed evidence", academy + "minds/lasso-evidence.json"], ["Release gate status", cockpit + "/conductor/api/release-gate/health"]],
  },
  {
    id: "groundskeeper", name: "Groundskeeper AI · Collyn Phillips Tabor", task: "Check whether the system works and whether the continuity checks are current.",
    links: [["Open Groundskeeper AI", cockpit + "/groundskeeper-ai"], ["Read current observations", cockpit + "/groundskeeper-ai/api/status"]],
  },
  {
    id: "nature", name: "Nature & the Golden Goose", task: "Explore bioremediation analogies and test the Golden Goose cleanup model.",
    links: [["Nature analogies", academy + "mining/zones/nature-analogies/"], ["Golden Goose lab", "/golden-goose/"]],
  },
  {
    id: "mining", name: "Cryptocurrency Mining", task: "Try proof of work, inspect hardware and pools, and verify a share.",
    links: [["Enter the 12 mining zones", academy + "mining/"], ["Verification lab", academy + "mining/zones/verification-lab/"]],
  },
  {
    id: "conductor", name: "Nathan AI Rocket 🚀 & Master Conductor", task: "Check the live fleet status and follow the evidence back to the Conductor.",
    links: [["Rocket Mining Conductor", "/rocket-conductor/"], ["Master Conductor", cockpit + "/conductor"]],
  },
];

const rounds = [
  {
    zone: "lasso",
    clue: "A quote appears in a Mind’s voice. The exact wording is missing from its cited source.",
    question: "What would you do with the attribution?",
    answers: ["Publish it because the words sound right.", "Flag it for review and look for a source with the exact wording.", "Replace the quote with what the person probably meant."],
    correct: 1,
    retry: "The source has to support both the wording and who said it. Try again.",
    explanation: "Keep the attribution in review. If you find the wording, check who said it and read the surrounding context.",
  },
  {
    zone: "mining",
    clue: "The dashboard is ready and a public Bitcoin block header verifies. The fleet has no recorded heartbeat or accepted share.",
    question: "What can you report?",
    answers: ["The fleet mined that block.", "The dashboard is ready and the public header verifies. Fleet mining is unconfirmed.", "The fleet earned a payout."],
    correct: 1,
    retry: "A public block header gives you evidence about that block. What fleet evidence did you actually see?",
    explanation: "Report the two checks that passed. A fleet heartbeat, pool share and payout each need their own evidence.",
  },
  {
    zone: "truth",
    clue: "A learner notices they repeated the fleet claim and prepares to correct it in front of the group.",
    question: "How can you help them make the correction?",
    answers: ["Show the evidence, correct the claim together, and let them retry.", "Let the claim stand so they won’t feel embarrassed.", "Make the mistake the focus of the lesson."],
    correct: 0,
    retry: "The learner needs a way to correct the claim and keep participating.",
    explanation: "Show what the evidence supports, correct the record, and give the learner room to try the next check.",
  },
];

const css = `
:root{color-scheme:dark;--paper:#fcf1d9;--muted:#d5d9cc;--line:#546158;--gold:#ffd28f;--green:#b5e3c4}
*{box-sizing:border-box}body{margin:0;color:var(--paper);background:#101813;font:1rem/1.55 system-ui,sans-serif}
main{max-width:70rem;margin:auto;padding:clamp(1rem,4vw,3rem)}a{color:var(--gold);text-underline-offset:.2em}
a:focus-visible,button:focus-visible,[tabindex]:focus-visible{outline:3px solid var(--gold);outline-offset:4px}
nav{display:flex;gap:1rem;flex-wrap:wrap;color:var(--muted);font-size:.95rem}
.hero{position:relative;isolation:isolate;overflow:hidden;margin:clamp(1.75rem,5vw,4rem) 0 2rem;padding:clamp(1.25rem,5vw,3.5rem);border:1px solid #6a745f;
border-radius:1rem;background:radial-gradient(ellipse at 87% 0%,#674927 0%,transparent 55%),#1c2a21}
.hero.ignited::before{content:"";position:absolute;z-index:-1;top:-17rem;right:-15rem;width:40rem;aspect-ratio:1;border-radius:50%;
background:repeating-radial-gradient(circle,#f5b87422 0 2px,transparent 2px 28px);
mask-image:radial-gradient(circle,#000 15%,transparent 71%);animation:expand .85s ease-out both;pointer-events:none}
h1{font:900 clamp(2rem,7vw,5.5rem)/.99 Georgia,serif;max-width:16ch;margin:0;letter-spacing:-.045em}
h2,h3{line-height:1.2}h2{font-size:clamp(1.5rem,4vw,2.15rem);margin:.2rem 0 1rem}
.hero p{max-width:48ch;color:var(--muted);margin:1.2rem 0}
button{font:inherit;color:inherit;background:#26382e;border:1px solid #819184;border-radius:.5rem;padding:.62rem .95rem;
min-height:44px;text-align:left;cursor:pointer}button:hover:not(:disabled){border-color:var(--gold)}
button:disabled{cursor:default}.primary{background:var(--gold);color:#2a1c0e;border-color:var(--gold);font-weight:700}
.controls{display:flex;flex-wrap:wrap;gap:.6rem;align-items:center}.challenge,.live{margin-bottom:2rem;padding:clamp(1rem,4vw,2rem);
border:1px solid var(--line);border-radius:.75rem;background:#19261f}.challenge p{max-width:66ch}
#choices{display:grid;gap:.6rem;margin-bottom:.9rem}#choices button[aria-pressed=true]{border-color:var(--green);
background:#293f32}#feedback{min-height:1.55em;color:var(--green)}#pace{color:var(--muted)}#live-result{margin-bottom:0}
.zones{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr));gap:1rem}
.zone{padding:1.1rem;border:1px solid var(--line);border-radius:.65rem;background:#17241c}
.zone h3{margin:.1rem 0}.zone p{color:var(--muted);margin:.5rem 0}.zone ul{margin:.6rem 0 0;padding-left:1.2rem}
.zone li{margin:.25rem 0}.zone:target,.zone.active{border-color:var(--gold)}
[hidden]{display:none!important}.burst .zone{animation:reveal .45s ease-out both;animation-delay:calc(var(--i) * 55ms)}
@keyframes reveal{from{transform:translateY(12px);opacity:.6}to{transform:translateY(0);opacity:1}}
@keyframes expand{from{transform:scale(.4);opacity:0}30%{opacity:1}to{transform:scale(1.8);opacity:0}}
@media(prefers-reduced-motion:reduce){.burst .zone,.hero.ignited::before{animation:none}}
`;

function page() {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#101813"><title>${title} · Tabor Academy</title><style>${css}</style>
<script defer src="${base}play.js"></script></head><body><main>
<nav aria-label="Tabor Academy"><a href="${academy}">Tabor Academy</a><a href="${bigBang}">BIG BANG TIMES NATHAN TABOR</a><a href="#zones">Browse zones</a></nav>
<header class="hero" id="launch"><h1>${title}</h1>
<p>Check a quote, verify a mining claim, and help someone correct the record. Pause any time with Hold on.</p>
<button id="start" class="primary" type="button" hidden>Start challenges</button></header>
<section id="challenge" class="challenge" aria-labelledby="question" hidden>
  <div class="controls"><p id="progress"></p><button id="hold" type="button" aria-pressed="false">Hold on</button><span id="pace" role="status"></span></div>
  <p id="clue"></p><h2 id="question" tabindex="-1" aria-describedby="clue"></h2><div id="choices"></div>
  <p id="feedback" role="status"></p>
  <div class="controls"><button id="next" type="button" hidden>Next challenge</button><a id="round-zone" hidden>Explore this zone</a></div>
</section>
<section class="live" id="live" aria-labelledby="live-title" hidden>
  <h2 id="live-title">Check the Rocket Conductor</h2>
  <div class="controls"><button id="check-live" type="button">Read live evidence</button><a href="/rocket-conductor/api/status">Open source report</a></div>
  <p id="live-result" role="status"></p>
</section>
<section id="zones" aria-labelledby="zones-title"><h2 id="zones-title">Choose a zone</h2><div class="zones">
${zones.map(({id, name, task, links}, index) => `<article class="zone" id="${id}" style="--i:${index}">
<h3>${name}</h3><p>${task}</p><ul>${links.map(([label, href]) => `<li><a href="${href}">${label}</a></li>`).join("")}</ul></article>`).join("")}
</div></section></main></body></html>`;
}

function play(rounds) {
  const get = id => document.getElementById(id);
  const challenge = get("challenge");
  const question = get("question");
  const next = get("next");
  const hold = get("hold");
  const feedback = get("feedback");
  const zoneLink = get("round-zone");
  let index = 0;
  let paused = false;
  let solved = false;
  let timer;

  function render() {
    const round = rounds[index];
    solved = false;
    next.hidden = true;
    zoneLink.hidden = true;
    feedback.textContent = "";
    document.querySelector(".zone.active")?.classList.remove("active");
    get("progress").textContent = round ? `Challenge ${index + 1} of ${rounds.length}` : "Complete";
    hold.hidden = !round;
    get("clue").textContent = round?.clue ?? "";
    question.textContent = round?.question ?? "Choose a zone and keep exploring";
    get("choices").replaceChildren(...(round?.answers ?? []).map((label, answer) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        if (solved) return;
        get("choices").querySelectorAll("button").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
        if (answer !== round.correct) {
          feedback.textContent = round.retry;
          return;
        }
        solved = true;
        feedback.textContent = round.explanation;
        get(round.zone).classList.add("active");
        zoneLink.href = "#" + round.zone;
        zoneLink.hidden = false;
        next.textContent = index + 1 === rounds.length ? "Finish challenges" : "Next challenge";
        next.hidden = false;
        schedule();
      });
      return button;
    }));
    question.focus({preventScroll: index === 0});
  }

  function advance() {
    clearTimeout(timer);
    index += 1;
    render();
  }

  function schedule() {
    clearTimeout(timer);
    if (solved && !paused) timer = setTimeout(advance, 6000);
  }

  hold.addEventListener("click", () => {
    paused = !paused;
    hold.textContent = paused ? "Resume pace" : "Hold on";
    hold.setAttribute("aria-pressed", String(paused));
    get("pace").textContent = paused ? "Paused. Continue when you’re ready." : "";
    schedule();
  });
  next.addEventListener("click", advance);
  zoneLink.addEventListener("click", () => {
    clearTimeout(timer);
    paused = true;
    hold.textContent = "Resume pace";
    hold.setAttribute("aria-pressed", "true");
    get("pace").textContent = "Paused. Continue when you’re ready.";
  });
  get("start").addEventListener("click", () => {
    clearTimeout(timer);
    index = 0;
    paused = false;
    hold.textContent = "Hold on";
    hold.setAttribute("aria-pressed", "false");
    get("pace").textContent = "";
    get("start").textContent = "Restart challenges";
    challenge.hidden = false;
    get("launch").classList.add("ignited");
    get("zones").classList.add("burst");
    render();
  });
  get("launch").addEventListener("animationend", () => get("launch").classList.remove("ignited"));

  get("check-live").addEventListener("click", async event => {
    const button = event.currentTarget;
    const result = get("live-result");
    button.disabled = true;
    result.textContent = "Reading the Rocket Conductor…";
    try {
      const response = await fetch("/rocket-conductor/api/status", {cache: "no-store", signal: AbortSignal.timeout(15000)});
      if (!response.ok) throw Error("Live status unavailable");
      const data = await response.json();
      const fleet = data.observed?.fleet;
      const labels = [
        `Integration checks ${data.integrationsReady === true ? "ready" : "unconfirmed"}`,
        `Bitcoin header proof ${data.observed?.bitcoin?.ok === true ? "verified" : "unconfirmed"}`,
      ];
      if (fleet?.ok === true && Number.isInteger(fleet.registered) && Number.isInteger(fleet.heartbeats)) {
        labels.push(`Enrolled miners ${fleet.registered}`, `Fleet heartbeats ${fleet.heartbeats}`);
      } else {
        labels.push("Fleet inventory unavailable");
      }
      labels.push(`Fleet mining ${data.mining?.verified === true ? "verified" : "unconfirmed"}`);
      result.textContent = labels.join(" · ");
    } catch {
      result.textContent = "The live report is unavailable. Try again or open the source report.";
    } finally {
      button.disabled = false;
    }
  });
  get("start").hidden = false;
  get("live").hidden = false;
}

export function serveEvidence(request, release) {
  const path = new URL(request.url).pathname.replace(/^\/tabor-academy(?=\/)/, "");
  const mount = "/big-bang/evidence";
  if (path !== mount && !path.startsWith(mount + "/")) return null;
  const headers = {
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
  };
  const head = request.method === "HEAD";
  if (request.method !== "GET" && !head) {
    return new Response(null, {status: 405, headers: {...headers, Allow: "GET, HEAD"}});
  }
  const reply = (body, type, status = 200) =>
    new Response(head ? null : body, {status, headers: {...headers, "Content-Type": type + "; charset=utf-8"}});
  switch (path.slice(mount.length)) {
    case "": return new Response(null, {status: 308, headers: {...headers, Location: base}});
    case "/": return reply(page(), "text/html");
    case "/play.js": return reply(`(${play.toString()})(${JSON.stringify(rounds)});`, "text/javascript");
    case "/healthz": return reply(JSON.stringify({service: "tabor-academy-big-bang-evidence", ready: true, release, zones: zones.length}), "application/json");
    default: return reply("Not found", "text/plain", 404);
  }
}
