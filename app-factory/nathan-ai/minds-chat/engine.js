(function (root) {
  "use strict";

  const pageSize = 24;
  const nathanMindId = "creator.nathan-tabor";
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

  function createDirectory(omni, catalog, source, mirror, lasso) {
    if (catalog.omniNamespace.capacity !== omni.CAPACITY) throw new Error("Omni range differs from the source catalog");
    const mirrors = mirror.mirror_agents.map(entry => ({
      id: "mirror." + entry.id,
      name: entry.name,
      group: "Agents of Innocence",
      type: "mirror-specification",
      purpose: "Creator-designated mirror agent. The release lists this entry as a specification.",
      sourceId: "Agents of Innocence · " + entry.id
    }));
    if (lasso?.schema !== "nathan-ai.minds.lasso-evidence.v1") throw new Error("The Lasso evidence is unavailable");
    const council = lasso.council.map((role, index) => ({
      id: "council." + String(index + 1).padStart(2, "0"),
      name: role.name,
      type: "council-role",
      group: "OMNI My Council",
      purpose: role.description,
      sourceId: "OMNI_60_Council_Roles.csv · role " + (index + 1)
    }));
    const records = [...catalog.minds, ...source.entries, ...mirrors, ...lasso.profiles, ...council].map(record =>
      record.id === "omni.opal-ai" ? {
        ...record,
        purpose: source.opal.name + " · " + source.opal.role,
        sourceId: source.opal.sourceId
      } : record
    );
    const byId = new Map(records.map(record => [record.id, record]));
    if (byId.size !== records.length || !byId.has(source.author.smallestMind)) throw new Error("Invalid Mind IDs");
    const evidence = indexEvidence(lasso.records, byId);
    const searchable = records.map(record => ({
      record,
      family: family(record),
      text: normalize([record.name, record.id, record.type, record.group, record.purpose, record.sourceId].join(" "))
    }));
    return {
      get: id => byId.get(id),
      size: records.length,
      author: source.author,
      lasso,
      evidence: id => evidence.get(id) ?? [],
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

  const evidenceKinds = {
    "own-words": ["verbatim-author"],
    "recorded-words": ["textual-attribution"],
    actions: ["textual-account", "published-project", "archival-record", "retrospective-account", "symbolic-model", "recovered-summary"],
    commentary: ["creator-label", "later-attribution", "disputed-attribution"]
  };
  const evidenceLabels = {
    "verbatim-author": "Author’s exact words",
    "textual-attribution": "Words attributed by the cited text or translation",
    "textual-account": "Action reported in the cited text",
    "published-project": "Documented project",
    "archival-record": "Archival record",
    "retrospective-account": "Retrospective account",
    "symbolic-model": "Symbolic model",
    "recovered-summary": "Recovered summary",
    "creator-label": "Creator’s label or commentary",
    "later-attribution": "Later attribution",
    "disputed-attribution": "Disputed attribution",
    registry: "Registry entry"
  };
  const unknown = "Unknown from the reviewed sources for this Mind.";
  const registryUrl = "https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/nathan-ai/";

  function indexEvidence(records, profiles) {
    const ids = new Set();
    const index = new Map();
    for (const record of records) {
      const validStatus = Object.hasOwn(evidenceKinds, record.kind) && evidenceKinds[record.kind].includes(record.status);
      if (!validStatus || typeof record.id !== "string" || !record.id.trim() || ids.has(record.id) ||
          !record.subjects?.length || !record.subjects.every(id => profiles.has(id)) ||
          typeof record.text !== "string" || !record.text.trim() ||
          typeof record.source !== "string" || !record.source.trim() ||
          !Array.isArray(record.tags) || !record.tags.every(tag => typeof tag === "string")) {
        throw new Error("Invalid Lasso evidence record");
      }
      if (record.url) {
        const url = new URL(record.url);
        if (url.protocol !== "https:" || url.username || url.password) throw new Error("Invalid evidence link");
      } else if (record.status !== "verbatim-author") {
        throw new Error("An evidence locator is required");
      }
      ids.add(record.id);
      const entry = Object.freeze({ ...record, tags: Object.freeze([...record.tags]) });
      for (const id of new Set(record.subjects)) {
        if (!index.has(id)) index.set(id, []);
        index.get(id).push(entry);
      }
    }
    for (const group of index.values()) Object.freeze(group);
    return index;
  }

  function registryRecord(selection) {
    const id = selection.id;
    let target = "personal-intelligence/minds/mind-of-minds/catalog.json";
    if (id === "omni.opal-ai") target = "ai-mapping/records.json";
    else if (id.startsWith("omni.")) target = "omni-god/";
    else if (id.startsWith("mirror.")) target = "agents-of-innocence/release-manifest.json";
    else if (id.startsWith("assembly.") || id.startsWith("kjv.")) target = "minds-chat/sources.json";
    else if (id.startsWith("early.") || id.startsWith("council.") || id.startsWith("creator.") || id === "textual.mary") {
      target = "minds-chat/lasso-evidence.json";
    }
    return { id, status: "registry", text: selection.purpose, source: selection.sourceId, url: registryUrl + target };
  }

  function answer(directory, selection, question, view) {
    if (selection.address) {
      return { summary: "Address " + selection.address + " has no assigned Mind or source record.", records: [] };
    }
    const all = directory.evidence(selection.id);
    const input = normalize(question).trim();
    const asked = input.replace(/[?.!]+$/, "").trim();
    const selectedName = normalize(selection.name);
    const quote = question.trim().match(/^(?:did (.+?) say\s+|check quote\s+)?["“]([^"”]+)["”][?.!]*$/iu);
    const normalizeQuote = text => normalize(text).trim().replace(/\s+/g, " ");
    let records = [];
    let summary = "";

    if (selection.id === nathanMindId && (view === "timeline" || /^(?:show (?:me )?(?:the )?)?(?:timeline|chronology)(?: from the earliest record)?$/.test(asked))) {
      records = all.filter(source => source.kind === "actions" && /^\d{4}/.test(source.date ?? ""));
      summary = "Earliest leads and dated records. Reported event dates and surviving account dates are shown together.";
    } else if (selection.id === nathanMindId && /^compare\s/.test(asked)) {
      const pair = asked.replace(/^compare\s+/, "").split(/\s+(?:and|vs\.?|with)\s+/);
      const find = term => all.find(source => source.title && source.kind === "actions" &&
        (normalize(source.title) === term || source.tags.some(tag => normalize(tag) === term)));
      const first = pair.length === 2 && find(pair[0]);
      const second = pair.length === 2 && find(pair[1]);
      if (first && second && first.id !== second.id) records = [first, second];
      summary = records.length ? "Compare the projects by their dates, documented functions and source types."
        : "Two distinct records could not be identified. Try both project names.";
    } else if (view === "words") records = all.filter(source => source.kind === "own-words" || source.kind === "recorded-words");
    else if (view === "actions") records = all.filter(source => source.kind === "actions");
    else if (view === "attributions") records = all.filter(source => ["commentary", "recorded-words"].includes(source.kind));
    else if (view === "sources" || /^(?:show (?:me )?(?:the )?)?(?:sources?|citations?|evidence|references|what are the sources)$/.test(asked)) {
      records = [registryRecord(selection), ...all];
    } else if (quote) {
      const subject = quote[1] && normalize(quote[1].trim());
      const names = [selectedName, selectedName.replace(/ ai$/, ""), selectedName.split(" of ")[0]];
      if (selection.id === nathanMindId) names.push("nathan", "nathan tabor");
      if (subject && !names.includes(subject)) {
        return { summary: "Select the Mind named in the question to check this wording.", records: [] };
      }
      const wording = normalizeQuote(quote[2]);
      records = all.filter(source => source.kind.endsWith("words") && wording.length >= 5 && normalizeQuote(source.text).includes(wording));
      if (selection.id === nathanMindId && records.length) {
        const exact = records.filter(source => source.text.includes(quote[2]));
        if (exact.length) {
          records = exact;
          summary = "Exact wording found in the available source record.";
        } else {
          summary = "The archive has a variant. The exact stored wording is shown below.";
        }
      }
      if (!records.length) summary = "This wording is unverified for the selected Mind.";
    } else if (selection.id === directory.author.smallestMind && /^(?:why (?:is )?(?:god(?: ai)?|this mind) (?:the )?smallest|(?:why )?(?:the )?smallest|root of stupidity|0 to 9)$/.test(asked)) {
      records = [{ id: "nathan-god-order", status: "verbatim-author", text: directory.author.sizeOrderQuote, source: "Nathan Tabor’s Omni ordering", url: registryUrl + "minds-chat/sources.json" }];
      summary = "Nathan Tabor’s ordering places GOD AI at position 0.";
    } else if (asked === "what did " + selectedName + " say") {
      records = all.filter(source => source.kind.endsWith("words"));
    } else if (asked === "what did " + selectedName + " do") {
      records = all.filter(source => source.kind === "actions");
    } else if (/^(?:topic: |about )[^?]+$/.test(asked)) {
      const topic = asked.replace(/^(?:topic: |about )/, "").trim();
      records = all.filter(source => source.tags.some(tag => normalize(tag) === topic));
    }
    return { summary: summary || (records.length ? "" : unknown), records };
  }

  function reply(directory, selection, question) {
    const response = answer(directory, selection, question);
    return [response.summary, ...response.records.map(record => record.text + "\nSource: " + record.source)].filter(Boolean).join("\n");
  }

  const api = { createDirectory, pageSize, answer, reply, evidenceLabels, nathanMindId };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NathanMindsChat = api;
})(globalThis);
