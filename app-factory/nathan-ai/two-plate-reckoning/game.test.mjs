import assert from "node:assert/strict";
import { test } from "node:test";
import { portraits, receipt, score, tally } from "./public/game.mjs";

test("both characters have two independently scored plates", () => {
  for (const role of Object.values(portraits)) {
    assert.equal(role.plates.length,2);
    for (const {order} of role.plates) {
      assert.ok(score(order,order));
      assert.ok(!score(order.slice(1),order));
      assert.ok(!score([...order].reverse(),order));
    }
  }
  assert.equal(tally("preacher"),19);
  assert.equal(tally("wife"),17);
});

test("the receipt counts actual money and service trips", () => {
  assert.deepEqual(receipt(20,"together"),{cents:3600,gratuity:720,total:4320,requests:1});
  assert.deepEqual(receipt(0,"separate"),{cents:3600,gratuity:0,total:3600,requests:3});
});
