export const seedNodes = [
  { slug: "act-naming", title: "ACT database naming mechanism", kind: "project_note", summary: "The notes describe a Pi / Phi naming mechanism for nodes that connect ancient libraries with historical and biblical texts.", value_text: null, record_date: "2026-10-02", phonetic_key: null, structural_role: null, target_slug: null, math_anchor: null },
  { slug: "act-recorded-value-1-168", title: "ACT recorded value 1.168", kind: "recorded_value", summary: "The supplied ACT notes record both 1.168 and 1.618 in the Pi / Phi naming work.", value_text: "1.168", record_date: "2026-10-02", phonetic_key: null, structural_role: null, target_slug: null, math_anchor: null },
  { slug: "alias-phi", title: "Phi", kind: "alias", summary: "Shared phonetic key and sovereign structural role.", value_text: "phi", record_date: null, phonetic_key: "phi", structural_role: "proportion", target_slug: "phi", math_anchor: "phi" },
  { slug: "alias-phi-glyph", title: "φ", kind: "alias", summary: "Shared phonetic key and sovereign structural role.", value_text: "φ", record_date: null, phonetic_key: "phi", structural_role: "proportion", target_slug: "phi", math_anchor: "phi" },
  { slug: "alias-phy", title: "Phy", kind: "alias", summary: "Shared phonetic key and sovereign structural role.", value_text: "phy", record_date: null, phonetic_key: "phi", structural_role: "proportion", target_slug: "phi", math_anchor: "phi" },
  { slug: "alias-pi", title: "Pi", kind: "alias", summary: "Shared phonetic key and sovereign structural role.", value_text: "pi", record_date: null, phonetic_key: "pie", structural_role: "circle", target_slug: "pi", math_anchor: "pi" },
  { slug: "alias-pi-glyph", title: "π", kind: "alias", summary: "Shared phonetic key and sovereign structural role.", value_text: "π", record_date: null, phonetic_key: "pie", structural_role: "circle", target_slug: "pi", math_anchor: "pi" },
  { slug: "alias-pie", title: "Pie", kind: "alias", summary: "Shared phonetic key and sovereign structural role.", value_text: "pie", record_date: null, phonetic_key: "pie", structural_role: "whole-unit", target_slug: "pie-pi-phi", math_anchor: "pi" },
  { slug: "alias-py", title: "Py", kind: "alias", summary: "Shared phonetic key and sovereign structural role.", value_text: "py", record_date: null, phonetic_key: "pie", structural_role: "whole-unit", target_slug: "pie-pi-phi", math_anchor: "pi" },
  { slug: "alias-pye", title: "Pye", kind: "alias", summary: "Shared phonetic key and sovereign structural role.", value_text: "pye", record_date: null, phonetic_key: "pie", structural_role: "circle", target_slug: "pi", math_anchor: "pi" },
  { slug: "every-part-is-whole", title: "Every Part Is Whole", kind: "project_note", summary: "“Every part is whole—there are no fractals” is the governing principle recorded for the project.", value_text: null, record_date: "2026-08-21", phonetic_key: null, structural_role: null, target_slug: null, math_anchor: null },
  { slug: "forgotten-constants", title: "The 69 Forgotten Constants", kind: "project_note", summary: "A research lead on historical numbers and formulas across ancient civilizations.", value_text: "69", record_date: "2026-10-02", phonetic_key: null, structural_role: null, target_slug: null, math_anchor: null },
  { slug: "golden-ratio-matrix", title: "13, 17, and 34 Golden Ratio Matrix", kind: "project_note", summary: "The notes associate these numbers with the project’s golden-ratio and rhythm framework.", value_text: "13, 17, 34", record_date: null, phonetic_key: null, structural_role: null, target_slug: null, math_anchor: null },
  { slug: "greek-lettering", title: "Greek Lettering and Isopsephy", kind: "project_note", summary: "Research notes on Greek lettering, archaic characters, and numerical letter values.", value_text: null, record_date: "2026-11-10", phonetic_key: null, structural_role: null, target_slug: null, math_anchor: null },
  { slug: "heartbeat-cadence", title: "Heartbeat and Marching Cadence", kind: "project_note", summary: "A rhythm concept combining Pi, Phi, whole/hole wordplay, and ascending and descending marching patterns.", value_text: null, record_date: "2026-10-23", phonetic_key: null, structural_role: null, target_slug: null, math_anchor: null },
  { slug: "leonardo-golden-ratio", title: "Leonardo da Vinci and the Golden Ratio", kind: "project_note", summary: "A research lead on proportion, mirror writing, and anatomical mechanics.", value_text: null, record_date: "2026-11-06", phonetic_key: null, structural_role: null, target_slug: null, math_anchor: null },
  { slug: "phi", title: "Phi (φ)", kind: "math_reference", summary: "The golden ratio (1 + √5) / 2.", value_text: "1.618033988749895…", record_date: null, phonetic_key: null, structural_role: null, target_slug: null, math_anchor: null },
  { slug: "phonetic-circular-language", title: "Phonetic and Circular Language", kind: "project_note", summary: "A language concept pairing the Pi/Pie homophone with linear and circular expression.", value_text: null, record_date: null, phonetic_key: null, structural_role: null, target_slug: null, math_anchor: null },
  { slug: "pi", title: "Pi (π)", kind: "math_reference", summary: "The ratio of a circle’s circumference to its diameter.", value_text: "3.141592653589793…", record_date: null, phonetic_key: null, structural_role: null, target_slug: null, math_anchor: null },
  { slug: "pie-pi-phi", title: "Pie Pi Phi", kind: "project_note", summary: "Nathan Tabor’s concept combining Pie wordplay with Pi and Phi.", value_text: null, record_date: null, phonetic_key: null, structural_role: null, target_slug: null, math_anchor: null }
];

export function verifyNode(node) {
  const valid = Boolean(node && node.slug && node.title && node.kind && node.summary);
  return valid ? 1 : 0;
}

export function buildAndPurge(nodes, generations = 3) {
  // 1 - 1 = 0: Purge any invalid or empty records immediately
  let pool = nodes.filter(node => verifyNode(node) === 1);

  // 1 + 1 = 2: Double valid records per generation (20 -> 40 -> 80 -> 160)
  for (let g = 1; g <= generations; g++) {
    const nextBatch = [];
    for (let i = 0; i < pool.length; i++) {
      const source = pool[i];
      if (verifyNode(source) === 1) {
        nextBatch.push({
          ...source,
          slug: `${source.slug}-${g}-${i + 1}`
        });
      }
    }
    pool = pool.concat(nextBatch);
  }

  return pool;
}

export const result = buildAndPurge(seedNodes, 3);
