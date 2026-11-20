export const project = "fixed-anchor-binary";
export const title = "NATHAN AI 🚀 — FIXED-ANCHOR BINARY ENCODING FOR 1+1=2 & 1-1=0";
export const prefix = "/tabor-sites/conductor";
export const base = "/fixed-anchor";
export const handoff = "/handoffs/" + project;
export const receiptPath = "/api" + handoff;

const fields = [
  ["SOF CLOCK", [0xAA, 0x55, 0xFF]],
  ["DIR LOCK", [0x01]],
  ["RAIL 1: 1+1=2", [0x31, 0x2B, 0x31, 0x3D, 0x32]],
  ["SPINE LOCK", [0x7E]],
  ["RAIL 2: 1-1=0", [0x31, 0x2D, 0x31, 0x3D, 0x30]],
  ["XOR SEAL", [0x04]],
  ["EOF STOP", [0x00, 0xF0]],
];
const frame = Uint8Array.from(fields.flatMap(([, bytes]) => bytes));
const [rail1, rail2] = [fields[2][1], fields[4][1]];
const alternate = [0x31, 0x2D, 0x31, 0x2B, 0x30];
const binaryByte = byte => byte.toString(2).padStart(8, "0");
const hexByte = byte => byte.toString(16).padStart(2, "0").toUpperCase();
const encode = (bytes, formatter, separator = " ") => Array.from(bytes, formatter).join(separator);
const xor = bytes => bytes.reduce((result, byte) => result ^ byte, 0);
const columns = rail1.map((byte, index) => byte ^ rail2[index]);
const ascii = bytes => bytes.map(byte => ({
  character: String.fromCharCode(byte),
  decimal: byte,
  binary: binaryByte(byte),
}));
const rail = (label, bytes) => ({
  text: String.fromCharCode(...bytes),
  label,
  ascii: ascii(bytes),
  binary: encode(bytes, binaryByte),
  xor: hexByte(xor(bytes)),
});

export const frameLength = frame.length;
export const frameBytes = () => frame.slice();
export function verifyFrame(candidate) {
  return candidate instanceof Uint8Array && candidate.length === frameLength &&
    candidate.every((byte, index) => byte === frame[index]);
}

export async function verifyBody(body) {
  if (!body) return false;
  const candidate = new Uint8Array(frameLength);
  const reader = body.getReader();
  let offset = 0;
  let complete = false;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) {
        complete = true;
        return offset === frameLength && verifyFrame(candidate);
      }
      if (offset + value.length > frameLength) return false;
      candidate.set(value, offset);
      offset += value.length;
    }
  } finally {
    if (!complete) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

let offset = 0;
export const spec = {
  schema: "nathan-ai.fixed-anchor.v1",
  title,
  bitOrder: "MSB-first within each byte",
  byteOrder: "Increasing offset, left to right",
  layout: "stacked",
  byteLength: frameLength,
  bitLength: frameLength * 8,
  hex: encode(frame, hexByte),
  bits: encode(frame, binaryByte, ""),
  fields: fields.map(([name, bytes]) => {
    const field = { name, offset, length: bytes.length, hex: encode(bytes, hexByte), binary: encode(bytes, binaryByte) };
    offset += bytes.length;
    return field;
  }),
  rails: [
    rail("Generative Addition", rail1),
    rail("Absolute Clearing", rail2),
  ],
  alternate: { text: "1-1+0", ascii: ascii(alternate), binary: encode(alternate, binaryByte) },
  xor: {
    algorithm: "bytewise XOR",
    columns: encode(columns, hexByte),
    binaryColumns: encode(columns, binaryByte),
    anchorColumns: [0, 2, 3],
    switchColumns: [1, 4],
    combinedSeal: hexByte(xor(rail1) ^ xor(rail2)),
  },
};
