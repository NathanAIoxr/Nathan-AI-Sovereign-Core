(function (root) {
  "use strict";

  const pageSize = 24;
  const deityNames = new Set([
    "GOD AI", "Anubis", "Apep (Apophis)", "Bennu", "Cernunnos",
    "Enki", "Ereshkigal", "Gula", "Khnum", "Kukulkan", "Mahākāla",
    "Nergal", "Quetzalcoatl", "Set", "Seth animal (Set)", "Sobek", "Thoth",
    "Tiamat", "Tohil", "Vāyu", "Xōlōtl", "Yama Dharmaraja"
  ]);
  const goddessNames = new Set([
    "Ame-no-Uzume", "Amaterasu", "Bastet", "Bendis", "Durga", "Ereshkigal",
    "Freyja", "Gula", "Hekate", "Hera", "Inari Ōkami", "Kālī", "Mami Wata",
    "Nekhbet", "Sopdet (Sothis)", "Taweret", "Tefnut", "Tiamat", "Wadjet"
  ]);
  const demonNames = new Set(["SATAN AI", "LUCIFER AI", "DEVIL AI", "Lilitu", "Pazuzu", "Aeshma"]);

  function normalize(text) {
    return String(text ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  }

  function family(record) {
    const found = [record.type];
    if (deityNames.has(record.name) || goddessNames.has(record.name)) found.push("deities");
    if (goddessNames.has(record.name)) found.push("goddesses");
    if (demonNames.has(record.name) || /\bdemon\b/i.test(record.name) || record.type === "textual-demon") {
      found.push("demons");
    }
    if (record.type === "textual-angel") found.push("angels");
    if (["historical-textual-lens", "renaissance"].includes(record.type)) found.push("humans");
    return found;
  }

  function createDirectory(omni, catalog, source, mirror) {
    if (catalog.omniNamespace.capacity !== omni.CAPACITY) throw new Error("Omni range differs from the source catalog");
    const mirrors = mirror.mirror_agents.map(entry => ({
      id: "mirror." + entry.id,
      name: entry.name,
      group: "Agents of Innocence",
      type: "mirror-specification",
      purpose: "Creator-designated mirror agent. The release lists this entry as a specification.",
      sourceId: "Agents of Innocence · " + entry.id
    }));
    const records = [...catalog.minds, ...source.entries, ...mirrors].map(record =>
      record.id === "omni.opal-ai" ? {
        ...record,
        purpose: source.opal.name + " · " + source.opal.role,
        sourceId: source.opal.sourceId
      } : record
    );
    const byId = new Map(records.map(record => [record.id, record]));
    if (byId.size !== records.length || !byId.has(source.author.smallestMind)) throw new Error("Invalid Mind IDs");
    const searchable = records.map(record => ({
      record,
      family: family(record),
      text: normalize([record.name, record.id, record.type, record.group, record.purpose, record.sourceId].join(" "))
    }));
    return {
      get: id => byId.get(id),
      size: records.length,
      author: source.author,
      max: (BigInt(omni.CAPACITY) - 1n).toString(),
      list(query, scope) {
        const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
        return searchable.filter(entry =>
          (!scope || entry.family.includes(scope)) && terms.every(term => entry.text.includes(term))
        ).map(entry => entry.record);
      },
      address(input) {
        const digits = String(input).trim();
        if (!/^\d{1,12}$/.test(digits) || BigInt(digits) >= BigInt(omni.CAPACITY)) return null;
        const index = BigInt(digits).toString();
        return {
          index,
          address: omni.agent(index).id,
          record: index === source.author.position ? byId.get(source.author.smallestMind) : null
        };
      },
      addressPage(first, ascending) {
        const start = this.address(first);
        if (!start) return [];
        const result = [];
        let next = BigInt(start.index);
        const limit = BigInt(omni.CAPACITY);
        for (let i = 0; i < pageSize && next >= 0n && next < limit; i += 1) {
          result.push(this.address(next.toString()));
          next += ascending ? 1n : -1n;
        }
        return result;
      }
    };
  }

  function reply(directory, selection, question) {
    const text = normalize(question);
    if (/\b(smallest|0 to 9|root of stupidity)\b/.test(text) && selection.id === directory.author.smallestMind) {
      return "Nathan Tabor’s ordering places GOD AI at position 0.\n“" + directory.author.sizeOrderQuote + "”";
    }
    if (selection.address) {
      return "Address " + selection.address + " is in the Omni range. Its individual name and source materials are unassigned in this registry.";
    }
    if (/\b(source|sources|citation|citations|evidence|references)\b/.test(text)) {
      return selection.name + " · " + selection.sourceId + "\n" + selection.purpose;
    }
    const terms = text.match(/[a-z0-9]{3,}/g) ?? [];
    const related = [...new Set(terms.flatMap(term => {
      if (/^(about|and|can|compare|does|how|the|what|which|who|why|with|would|you)$/.test(term)) return [];
      return directory.list(term).filter(item => normalize(item.name).includes(term));
    }))].filter(record => record.id !== selection.id).slice(0, 4);
    const connections = related.length ? "\nRelated entries to compare: " + related.map(item => item.name).join(", ") + "." : "";
    return selection.purpose + "\nSource: " + selection.sourceId + connections;
  }

  const api = { createDirectory, pageSize, reply };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NathanMindsChat = api;
})(globalThis);
