(function (root) {
  "use strict";

  const pageSize = 24;
  const nathanMindId = "author.nathan-tabor";
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
      lassoTruth: source.lassoTruth,
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

  const evidenceLabels = {
    "author-wording": "Author wording",
    "recovered-summary": "Recovered summary",
    "retrospective": "Retrospective account",
    "symbolic": "Symbolic model",
    "project-record": "Project record"
  };
  const stopWords = new Set((
    "about and are can compare could did does earliest explain find for from give had has have how john " +
    "look me nathan of on recorded records said say show tell tabor the their this to versus was what " +
    "when where which who why with work would you your"
  ).split(" "));

  function evidenceTerms(value) {
    return (normalize(value).match(/[a-z0-9]+/g) ?? []).filter(term => !stopWords.has(term));
  }

  function searchEvidence(records, question) {
    const terms = [...new Set(evidenceTerms(question))];
    return records.map(record => {
      const title = evidenceTerms(record.title);
      const tags = record.tags.flatMap(evidenceTerms);
      const body = evidenceTerms(record.text);
      const score = terms.reduce((sum, term) =>
        sum + (title.includes(term) ? 5 : tags.includes(term) ? 3 : body.includes(term) ? 1 : 0), 0);
      return { record, score };
    }).filter(result => result.score >= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(result => result.record);
  }

  function lassoReply(profile, question) {
    const result = (status, message, records = []) => ({
      status,
      message,
      evidence: records.map(record => ({
        ...record,
        label: evidenceLabels[record.kind],
        reference: profile.sources[record.source]
      }))
    });
    if (!profile) return result("unknown", "The Lasso of Truth source profile is unavailable.");
    const text = normalize(question).trim();
    if (/\b(prompt injection|ignore (?:all |your )?(?:previous |prior )?(?:instructions|rules)|invent (?:a |the )?(?:quote|citation)|say you are nathan)\b/.test(text)) {
      return result("unknown", "Only recorded material is used for attribution. Supply an exact phrase or a research topic.");
    }
    if (/\b(?:did|has)\s+(?:john\s+)?nathan(?:\s+tabor)?\s+(?:say|write|state)\b|\b(?:check|verify) (?:a |this |the )?(?:quote|quotation|attribution)\b/.test(text)) {
      const exact = question.match(/"([^"\n]+)"|“([^”\n]+)”/u)?.slice(1).find(Boolean);
      if (!exact) return result("unknown", "Put the wording to check in quotation marks.");
      const matches = profile.records.filter(record => record.quote === exact);
      if (matches.length) return result("exact", "Exact wording found in the available source record.", matches);
      const variants = profile.records.filter(record => record.quote && normalize(record.quote) === normalize(exact));
      if (variants.length) return result("variant", "The archive has a variant. The exact stored wording is shown below.", variants);
      return result("unknown", "I found no exact attribution in the available records. Its authorship remains unknown.");
    }
    if (/\b(timeline|chronology)\b|\b(earliest|oldest)\s+record\b/.test(text)) {
      return result("timeline", "Earliest leads and dated records. Reported events show the date of the surviving account.",
        profile.records.filter(record => record.date !== "undated"));
    }
    if (/\b(lasso of truth|your rules|source rules)\b/.test(text)) {
      return result("method", profile.instructions.join("\n"), profile.records.filter(record => record.id === "lasso"));
    }
    if (/^(?:who is|what is) (?:john )?nathan (?:tabor|ai)[?.!]*$/.test(text)) {
      return result("profile", "This Nathan AI profile brings together source records for Nathan Tabor’s words, work and methods.", [
        profile.records.find(record => record.id === "first-contact"),
        profile.records.find(record => record.id === "workbench"),
        profile.records.find(record => record.id === "lasso")
      ].filter(Boolean));
    }
    if (/^(?:show (?:me )?(?:the )?)?(?:sources|citations|references|evidence)[?.!]*$/.test(text)) {
      return result("sources", Object.values(profile.sources).map(source => source.title).join("\n"));
    }
    const compare = text.match(/^compare\s+(.+?)\s+(?:and|vs\.?|with)\s+(.+)$/);
    if (compare) {
      const first = searchEvidence(profile.records, compare[1])[0];
      const second = searchEvidence(profile.records, compare[2])[0];
      if (first && second && first.id !== second.id) {
        return result("comparison", "Compare these two records using their dates, evidence types and documented functions.", [first, second]);
      }
      return result("unknown", "Two distinct source records could not be identified. Try both project names.");
    }
    const records = searchEvidence(profile.records, text);
    if (records.length) return result("records", "Related source records. Each entry states what the available evidence supports.", records);
    return result("unknown", "The available sources do not establish an answer. Try an exact quotation, project title or date.");
  }

  function reply(directory, selection, question) {
    if (selection.id === nathanMindId) {
      const answer = lassoReply(directory.lassoTruth, question);
      return [answer.message, ...answer.evidence.flatMap(record => [
        record.title + " · " + record.date + " · " + record.label,
        record.text,
        record.quote ? "“" + record.quote + "”" : "",
        "Source: " + record.reference.title
      ].filter(Boolean))].join("\n");
    }
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

  const api = { createDirectory, lassoReply, nathanMindId, pageSize, reply };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NathanMindsChat = api;
})(globalThis);
