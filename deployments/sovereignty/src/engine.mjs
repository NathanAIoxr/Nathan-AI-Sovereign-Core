export const REVERSE = 1;
export const REFLECT_X = 2;
export const REFLECT_Y = 4;
export const directions = [
  { label: "Forwards", mark: "→", bits: 0 },
  { label: "Backwards", mark: "←", bits: REVERSE },
  { label: "Upside down", mark: "↻", bits: REFLECT_X | REFLECT_Y },
];
export const mirrors = [
  { label: "This side", bits: 0 },
  { label: "As the mirror", bits: REFLECT_X },
  { label: "Other side", bits: REFLECT_Y },
];
export const paths = directions.flatMap(direction => mirrors.map(mirror => ({
  direction: direction.label,
  mirror: mirror.label,
  mark: direction.mark,
  bits: direction.bits ^ mirror.bits,
})));

export function describe(bits) {
  const order = bits & REVERSE ? "Reversed" : "Original";
  const flipped = [
    bits & REFLECT_X ? "left–right" : "",
    bits & REFLECT_Y ? "top–bottom" : "",
  ].filter(Boolean);
  return flipped.length ? order + " · " + flipped.join(" and ") : order + " · upright";
}

export function splitText(value) {
  if (/^[\x00-\x7f]*$/.test(value)) return value.match(/\r\n|[\s\S]/g) ?? [];
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return Array.from(segmenter.segment(value), part => part.segment);
}

export function textOrder(parts, bits, limit = parts.length) {
  if (!(bits & REVERSE)) return parts.slice(0, limit).join("");
  return parts.slice(Math.max(0, parts.length - limit)).reverse().join("");
}

export function byteOrder(bytes, bits, limit = bytes.length) {
  if (!(bits & REVERSE)) return bytes.slice(0, limit);
  return bytes.slice(Math.max(0, bytes.length - limit)).reverse();
}
