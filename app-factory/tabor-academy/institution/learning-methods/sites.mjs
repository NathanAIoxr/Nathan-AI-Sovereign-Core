const world = "https://tabor-world.nathantaboract.workers.dev";
const academy = "https://tabor-bridge.nathantaboract.workers.dev/tabor-academy";

export const academyLearningSite = {
  name: "Tabor Academy",
  byline: "the academy for TALKING MAMMALS",
  route: "/institution/learning-methods",
  publicBase: "/tabor-academy/institution/learning-methods",
  home: academy + "/",
  sibling: world + "/learning-methods",
  siblingName: "Tabor World",
};
export const worldLearningSite = {
  name: "Tabor World",
  byline: "Tabor World · Hands-on fieldwork",
  route: "/learning-methods",
  publicBase: "/learning-methods",
  home: world + "/",
  sibling: academy + "/institution/learning-methods",
  siblingName: "Tabor Academy",
};
