import { fieldDrills } from "./field-drills-data.mjs";

import { escape, guideStyles, link as guideLink } from "./survival-guide.mjs";
const link = ([label, url]) => `<a href="${escape(url)}">${escape(label)}</a>`;

export function renderDecision(station, request) {
  const drill = fieldDrills[station.id];
  if (!drill) return "";
  const selections = new URL(request.url).searchParams.getAll("choice");
  const picked = selections.length === 1 && /^[1-3]$/.test(selections[0]) ? Number(selections[0]) : 0;
  const result = picked
    ? `<div class="answer" id="decision-result" tabindex="-1"><strong>${picked === drill.correct ? "That choice fits this case." : "Compare your choice with the worked response."}</strong>
       ${picked === drill.correct ? "" : `<p>Your choice — ${escape(drill.options[picked - 1])}</p>`}
       <p>Worked response — ${escape(drill.options[drill.correct - 1])}</p><p>${escape(drill.why)}</p></div>`
    : '<div id="decision-result"></div>';
  const buttons = drill.options.map((choice, index) =>
    `<button name="choice" value="${index + 1}" type="submit">${escape(choice)}</button>`).join("");
  const authorVoice = drill.authorQuotes?.length
    ? `<blockquote><p><strong>Nathan Tabor</strong></p>${drill.authorQuotes.map((words) => `<p>“${escape(words)}”</p>`).join("")}</blockquote>`
    : "";
  return `<div class="guide"><style>${guideStyles}</style>${authorVoice}<p>${escape(drill.case)}</p>${result}
    <form class="choices" method="get" action="#decision-result" aria-label="Choose a response">${buttons}</form>
    <div class="actions">${guideLink(drill.practice, "Continue in Tabor Academy", "action primary")}</div>
    <details><summary>Sources and related work</summary><p>${link(drill.source)} · ${link(drill.related)}</p></details></div>`;
}
