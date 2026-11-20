import test from "node:test";
import assert from "node:assert/strict";
import { byteOrder, paths, REVERSE, splitText, textOrder } from "./src/engine.mjs";

test("the nine routes have exactly eight reachable combinations after two passes", () => {
  assert.equal(paths.length, 9);
  const results = new Set(paths.flatMap(a => paths.map(b => a.bits ^ b.bits)));
  assert.deepEqual([...results].sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
  for (const { bits } of paths) {
    for (let original = 0; original < 8; original++) assert.equal((original ^ bits) ^ bits, original);
  }
});

test("backwards text preserves graphemes, order of CRLF and the original", () => {
  const input = "A\r\n👩🏾‍💻e\u0301";
  const clusters = splitText(input);
  assert.equal(textOrder(clusters, REVERSE), "e\u0301👩🏾‍💻\r\nA");
  assert.equal(textOrder(clusters, 0), input);
  assert.equal(textOrder(clusters, REVERSE, 2), "e\u0301👩🏾‍💻");
});

test("binary files are bounded for previews and reversible without mutating input", () => {
  const bytes = Uint8Array.of(0, 1, 254, 255);
  assert.deepEqual(byteOrder(bytes, REVERSE, 2), Uint8Array.of(255, 254));
  assert.deepEqual(byteOrder(byteOrder(bytes, REVERSE), REVERSE), bytes);
  assert.deepEqual(byteOrder(bytes, 0), Uint8Array.of(0, 1, 254, 255));
  assert.equal(byteOrder(new Uint8Array(0), REVERSE).length, 0);
});
