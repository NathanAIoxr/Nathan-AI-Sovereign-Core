const WHOLE_UNIT_BITMASK = 0xFF;
const MAX_GENERATION = 0xF;
const anchorCodes = new Map([["pi", 1], ["phi", 2], ["pi-phi", 3]]);
const requiredText = ["title", "kind", "summary"];
const optionalText = ["value_text", "record_date", "phonetic_key", "structural_role", "target_slug"];
const slugFormat = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const loneSurrogate = /[\uD800-\uDFFF]/u;

function isText(value) {
  return typeof value === "string" && !loneSurrogate.test(value);
}

export function verifyNode(node) {
  if (!node || typeof node.slug !== "string" || !slugFormat.test(node.slug)) {
    return 0;
  }

  const valid = anchorCodes.has(node.math_anchor)
    && requiredText.every((field) => isText(node[field]) && node[field].trim().length > 0)
    && optionalText.every((field) => node[field] == null || isText(node[field]));
  return Number(valid);
}

function stampBinarySeal(node, generation, index) {
  const anchorCode = anchorCodes.get(node.math_anchor);
  const word = (WHOLE_UNIT_BITMASK << 8) | (generation << 4) | anchorCode;
  return {
    ...node,
    generation,
    sovereign_index: index,
    binary_seal: word.toString(2).padStart(16, "0"),
    hex_seal: "0x" + word.toString(16).toUpperCase().padStart(4, "0"),
    isopsephy_pi: (anchorCode & 1) ? 80 : null,
    isopsephy_phi: (anchorCode & 2) ? 500 : null,
  };
}

export function buildAndPurge(nodes, generations = 3) {
  if (!Number.isInteger(generations) || generations < 0 || generations > MAX_GENERATION) {
    throw new RangeError("generations must be an integer from 0 to 15");
  }

  const slugs = new Set();
  const pool = [];
  function append(node, generation) {
    if (slugs.has(node.slug)) {
      throw new Error("Duplicate sovereign node slug: " + node.slug);
    }
    slugs.add(node.slug);
    pool.push(stampBinarySeal(node, generation, pool.length + 1));
  }

  for (const node of nodes) {
    if (verifyNode(node) === 1) {
      append(node, 0);
    }
  }

  for (let generation = 1; generation <= generations; generation++) {
    const sourceCount = pool.length;
    for (let i = 0; i < sourceCount; i++) {
      const source = pool[i];
      const slug = [source.slug, generation, i + 1].join("-");
      append({ ...source, slug }, generation);
    }
  }

  return pool;
}

