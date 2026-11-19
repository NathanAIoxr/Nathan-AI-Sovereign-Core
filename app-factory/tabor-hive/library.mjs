const classification = "https://www.loc.gov/aba/cataloging/classification/lcco/";
const source = "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/a18e863cfd36c0eb2ae4b6d8add09fcc04b7203c/app-factory/tabor-tracker-ball/public/loc101-catalog.mjs";
const profiles = new Set(["orbit", "dial", "trace", "field", "flow", "audio", "link", "logic"]);

export function createLibraryBee(modules, classes) {
  const catalog = new Map();
  if (modules.length !== 101 || Object.keys(classes).length !== 21) throw new Error("Incomplete LC catalog.");
  for (const [index, module] of modules.entries()) {
    if (module.id !== index + 1 || !Object.hasOwn(classes, module.classCode) || !profiles.has(module.profile) ||
      typeof module.title !== "string" || typeof module.task !== "string" || !Array.isArray(module.items) ||
      module.items.length < 2 || module.items.some(item => typeof item.name !== "string" ||
        typeof item.detail !== "string" || item.classLink && !Object.hasOwn(classes, item.classLink))) {
      throw new Error("Invalid LC cartridge " + module.id);
    }
    catalog.set(module.id, module);
  }
  return {
    load(id) {
      const module = catalog.get(id);
      if (!module) throw new RangeError("Cartridge outside the LC catalog.");
      return module;
    },
    reference(id) {
      const {classCode} = this.load(id);
      return {cartridge: "LC-" + classCode + "-" + String(id).padStart(3, "0"), classCode,
        className: classes[classCode], callNumber: null, classification, source};
    },
    search(query = "", code = "") {
      const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
      return [...catalog.values()].filter(module => {
        if (code && module.classCode !== code) return false;
        const text = [module.id, module.classCode, classes[module.classCode], module.title, module.briefTitle, module.brief,
          ...module.items.map(item => item.name)].join(" ").toLowerCase();
        return terms.every(term => text.includes(term));
      });
    },
    links(id) {
      const module = this.load(id);
      return [...new Set(module.items.map(item => item.classLink).filter(Boolean))];
    },
  };
}
