import { createLearningExplorer } from "../human-learning-arc/human-learning-arc-runtime.mjs";
import { renderDecision } from "./field-drills.mjs";
import { survivalDomains } from "./survival-mastery-domains-data.mjs";

import { barterLesson, domains, escape, guideLanding, guideQuery, guideStyles, link, learningTopics, topicList } from "./survival-guide.mjs";

const base = "/survival-mastery-domains";
const topics = learningTopics(survivalDomains, "world");

export const domainExplorer = createLearningExplorer(survivalDomains, {
  root: base,
  renderGuideLanding: (request) => guideLanding("world", guideQuery(request), topics),
  renderGuideDomain: (era) => `<div class="guide"><style>${guideStyles}</style>
    <div class="actions">${link(base + "/", "All six domains", "action")}</div>
    <p class="lede">${escape(domains.find((domain) => domain.id === era.id).summary)}</p>
    <h2>Choose a drill</h2>${topicList(topics.filter((topic) => topic.domain === era.id))}${era.id === "money" ? `<div class="actions">${barterLesson()}</div>` : ""}</div>`,
  renderDecision,
  title: "Six Universal Human Survival & Mastery Domains",
  lead: "Choose a situation, make a decision, and compare it with a worked response. Explore 27 stations across protection, money, relationships, homestead skills, learning, and civic life.",
  headerLinks: [
    ["/human-learning-arc/", "The Complete Human Learning Arc"],
    ["/learning-methods/", "101 Hands-On Learning Methods"],
    [survivalDomains.academy + "fieldbook/", "Six Domains Fieldbook"],
  ],
  promoteOn: ["/", "/human-learning-arc/", "/learning-methods/"],
  destination: {
    id: "six-universal-survival-mastery-domains", kind: "Practical decisions",
    desc: "Explore 27 decisions across protection, money, kinship, homestead, learning, and civic life.",
  },
  marker: "data-survival-mastery-domains",
  browseLabel: "Try a practical decision drill",
  sectionLabel: "All stations in this domain",
  returnLabel: "Return to the domain map",
});
