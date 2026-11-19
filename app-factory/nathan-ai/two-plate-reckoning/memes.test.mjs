import assert from "node:assert/strict";
import { test } from "node:test";
import { cardId, cardLink, receiptCaption } from "./public/memes.mjs";

test("the card link carries the preset and drops unrelated inputs", () => {
  const linked = cardLink("https://example.com/two-plate-reckoning/?draft=private","gravy");
  assert.equal(linked,"https://example.com/two-plate-reckoning/?meme=gravy#memes");
  assert.equal(cardId("constructor"),"amen");
  assert.equal(cardId(null),"amen");
});

test("receipt captions reflect the expanded portion count and actual gratuity", () => {
  assert.equal(receiptCaption(720),"19 + 17 portions. Real tip: $7.20.");
  assert.equal(receiptCaption(0),"19 + 17 portions. Real tip: $0.00.");
});
