import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { CHECK, changePortion, preset, receipt, restorePlates, score, total } from "../public/engine.mjs";
import worker from "../dist/worker.mjs";

test("the two plates, drinks, and tall-tale calories match both book formats", async () => {
  const { preacher, wife } = preset();
  assert.deepEqual(preacher.map((plate) => total([plate])), [1305, 810, 300]);
  assert.deepEqual(wife.map((plate) => total([plate])), [1050, 920, 150]);
  assert.equal(total(preacher), 2415);
  assert.equal(total(wife), 2120);
  assert.equal(total(preset("tall").preacher), 4000);
  assert.equal(total(preset("empty").wife), 0);
  const manuscript = await readFile(new URL("../BOOK.md", import.meta.url), "utf-8");
  const html = await readFile(new URL("../public/book.html", import.meta.url), "utf-8");
  for (const value of ["2,415", "2,120", "4,535", "4,000", "$9.64", "$57.84"]) {
    assert.ok(manuscript.includes(value) && html.includes(value), value);
  }
});

test("portion edits are isolated and restored values are bounded and sanitized", () => {
  const plates = preset();
  changePortion(plates.preacher[0], "chicken", 1);
  assert.equal(total(plates.preacher), 2735);
  assert.equal(total(plates.wife), 2120);
  assert.equal(total(preset().preacher), 2415);
  assert.deepEqual(restorePlates({ preacher: [{ chicken: 200, tea: 3, beef: -5 }, {}, { tea: 1, mac: 7 }] }).preacher,
    [{ chicken: 20 }, {}, { tea: 1 }]);
});

test("the game settles all tip outcomes in exact cents", () => {
  assert.deepEqual(score([2, 1, 1, 2]), { care: 12, tasks: 0, tip: 964 });
  assert.deepEqual(score([0, 0, 0, 0]), { care: 0, tasks: 8, tip: 0 });
  assert.deepEqual(score([1, 2, 2, 1]), { care: 6, tasks: 4, tip: 482 });
  assert.deepEqual(receipt(CHECK, 20), { subtotal: 4820, tip: 964, total: 5784 });
  assert.equal(receipt(127, 5).tip, 6);
});

test("Worker serves all product entrances and the binary PDF", async () => {
  const request = (path, options) => new Request("https://example.com" + path, options);
  for (const [path, title] of [["/", "Slam-Down"], ["/game", "Play the shift"], ["/app", "Build the spread"], ["/book", "Source notes"]]) {
    const res = await worker.fetch(request(path));
    assert.equal(res.status, 200);
    assert.ok((await res.text()).includes(title), path);
    assert.equal((await worker.fetch(request(path, { method: "HEAD" }))).body, null);
  }
  assert.equal((await worker.fetch(request("/tabor-apps/sunday-buffet"))).headers.get("Location"), "/tabor-apps/sunday-buffet/");
  assert.equal((await worker.fetch(request("/tabor-apps/sunday-buffet/app"))).status, 200);
  const pdf = await worker.fetch(request("/tabor-apps/sunday-buffet/book.pdf"));
  assert.equal(pdf.headers.get("Content-Type"), "application/pdf");
  assert.equal((await pdf.text()).slice(0, 5), "%PDF-");
  assert.equal((await worker.fetch(request("/unlisted"))).status, 404);
  assert.equal((await worker.fetch(request("/game/"))).headers.get("Location"), "/game");
  assert.equal((await worker.fetch(request("/", { method: "PUT" }))).status, 405);
});

test("edition receipt exposes the stored metadata", async () => {
  const metadata = { title: "Sunday Buffet Slam-Down", version: "1.0.0", sha256: "a".repeat(64) };
  const env = { VAULT: { prepare: () => ({ bind: (id) => ({ first: async () => {
    assert.equal(id, "sunday-buffet-1.0.0");
    return metadata;
  } }) }) } };
  const res = await worker.fetch(new Request("https://example.com/api/edition"), env);
  assert.deepEqual(await res.json(), metadata);
});
