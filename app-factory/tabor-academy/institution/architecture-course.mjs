export function renderArchitectureCourse({ course, root, slug, answer, layout, esc }) {
  const page = root + "course/";
  const foundation = root.slice(0, -"architecture/".length);
  const list = entries => "<ol>" + entries.map(entry => "<li>" + esc(entry) + "</li>").join("") + "</ol>";
  if (!slug) {
    const minutes = course.modules.reduce((sum, item) => sum + item.minutes, 0);
    return layout(course.title, `<nav aria-label="Architecture of Everything and Nothing"><a href="${root}">The Architecture</a><a href="${root}source.txt">Nathan Tabor’s original packet</a><a href="${page}worksheet.txt">Source ledger worksheet</a><a href="${foundation}three-apples/">The Three Apples Reality</a></nav>
<h1>${esc(course.title)}</h1><p class="byline">${esc(course.subtitle)}</p>
<blockquote><p>${esc(course.authorMotto)}</p><cite>Nathan Tabor</cite></blockquote>
<p>Work each problem two ways. First, use the rules and records you encounter. Then go back to what happened, what the original says, and who needs to be protected.</p>
<section aria-labelledby="modules"><h2 id="modules">Teaching modules</h2>
<p>${course.modules.length} modules · ${minutes} minutes at your own pace</p>
<ol class="pillars">${course.modules.map(item => `<li><h3><a href="${page}${item.id}/">${esc(item.title)}</a></h3><p>${esc(item.objective)}</p><p class="byline">${item.minutes} minutes</p></li>`).join("")}</ol></section>
<p><a href="${root}conductor.json">Conductor handoff</a> · <a href="${root}practice/">Architecture practice</a></p>`);
  }

  const index = course.modules.findIndex(item => item.id === slug);
  if (index === -1) return null;
  const item = course.modules[index];
  const previous = course.modules[index - 1];
  const next = course.modules[index + 1];
  const { check } = item;
  const result = answer !== null && /^[0-2]$/.test(answer) ? Number(answer) : null;
  const choices = check.choices.map((choice, choiceIndex) => `<div class="choice"><input type="radio" id="answer-${choiceIndex}" name="answer" value="${choiceIndex}" required${result === choiceIndex ? " checked" : ""}><label for="answer-${choiceIndex}">${esc(choice)}</label></div>`).join("");
  const feedback = result === null ? "" : `<p id="result" role="status"><strong>${result === check.correct ? "Correct." : "Review this step."}</strong> ${esc(check.feedback)}</p>`;
  const source = slug === "nine-cars"
    ? `<blockquote><p>${esc(course.nineCarsAxiom)}</p><cite>Nathan Tabor · Nine Cars Axiom</cite></blockquote>`
    : "";
  const reading = {
    "library-lineage": `<p><a href="${root}#lineage">Open the library lineage and primary-source links</a></p>`,
    "nine-cars": `<p><a href="${foundation}reality-math/#multiply">Work the Reality Math multiplication cases</a> · <a href="${foundation}three-apples/#middle">Compare the Three Apples demonstration</a></p>`,
    "primary-truth": `<p><a href="${root}source.txt">Open Nathan Tabor’s original packet</a></p>`,
    "master-conductor": `<p><a href="${root}#prompts">Open the four author prompts</a> · <a href="${root}conductor.json">Open the Conductor handoff</a></p>`,
  }[slug] ?? "";
  return layout(item.title, `<nav aria-label="Course links"><a href="${page}">All teaching modules</a><a href="${page}worksheet.txt">Worksheet</a>${previous ? `<a href="${page}${previous.id}/">Previous module</a>` : ""}${next ? `<a href="${page}${next.id}/">Next module</a>` : ""}</nav>
<h1>${esc(item.title)}</h1><p class="byline">Module ${index + 1} of ${course.modules.length} · ${item.minutes} minutes</p>
<p><strong>What you’ll learn</strong> · ${esc(item.objective)}</p>${source}
<p><strong>Situation</strong> · ${esc(item.scenario)}</p>
<section><h2>How to operate in this world</h2><p>${esc(item.inWorld)}</p></section>
<section><h2>How to operate without this world stupidity</h2><p>${esc(item.without)}</p></section>
<section><h2>Work the case</h2>${reading}${list(item.lab)}
<p><strong>Worked record</strong> · ${esc(item.record)}</p>
<p><strong>What to produce</strong> · ${esc(item.deliverable)}</p></section>
<section><h2>Check your answer</h2>${feedback}<form method="get" action="${page}${item.id}/#result"><fieldset><legend>${esc(check.question)}</legend>${choices}</fieldset><button type="submit">Check answer</button></form></section>
${next ? `<p><a href="${page}${next.id}/">Continue to ${esc(next.title)}</a></p>` : `<p><a href="${root}conductor.json">Open the Conductor handoff</a> · <a href="${page}">Review the course</a></p>`}`);
}

export function architectureWorksheet() {
  return `TABOR ACADEMY · SOURCE LEDGER WORKSHEET

Module and situation:
What do I need to decide?

OPERATE IN THIS WORLD
What form, catalog, rule, or process applies?
What do its labels or numbers mean in this setting?
What correction can that process accept?

OPERATE WITHOUT THIS WORLD STUPIDITY
What is physically present or directly observable?
What are the units, place, time, and scope?
What is the exact source wording?
What is the source locator, author, date if known, and version?
What was added by a later interpretation, translation, or label?
Put the two claims side by side. Do they answer the same question?
What check resolves the conflict, and what is still unresolved?

PROTECT THE ONE
Who is affected or omitted?
What correction keeps them accounted for?
Which details may be shared, and with whom?

MASTER CONDUCTOR
Source IDs:
Evidence status:
Publish, hold, or restrict:
Reason:
How can a second reader verify the decision?
`;
}
