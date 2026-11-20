import { createLearningExplorer } from "../human-learning-arc/human-learning-arc-runtime.mjs";
import { renderDecision } from "./field-drills.mjs";
import { survivalDomains } from "./survival-mastery-domains-data.mjs";

export const domainExplorer = createLearningExplorer(survivalDomains, {
  root: "/survival-mastery-domains",
  renderDecision,
  title: "Six Universal Human Survival & Mastery Domains",
  lead: "Choose a situation, make a decision, and compare it with a worked response. Explore 27 stations across protection, money, relationships, homestead skills, learning, and civic life.",
  headerLinks: [["/human-learning-arc/", "The Complete Human Learning Arc"], ["/learning-methods/", "101 Hands-On Learning Methods"]],
  promoteOn: ["/", "/human-learning-arc/", "/learning-methods/"],
  destination: {
    id: "six-universal-survival-mastery-domains", kind: "Practical decisions",
    desc: "Explore 27 decisions across protection, money, kinship, homestead, learning, and civic life.",
  },
  marker: "data-survival-mastery-domains",
  sectionLabel: "All stations in this domain",
  returnLabel: "Return to the domain map",
});
