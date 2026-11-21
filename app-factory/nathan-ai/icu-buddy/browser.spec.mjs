import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle" });
  await page.getByLabel("What do you want to do?").selectOption("boundary");
  await page.getByLabel("Your own words (optional)").fill("Please ask before visiting.");
  await page.getByRole("button", { name: "Draft a reply" }).click();
  const draft = page.getByLabel("Editable draft");
  assert.equal(await draft.isVisible(), true);
  assert.match(await draft.inputValue(), /Please ask before visiting\.$/);
  assert.equal(await draft.evaluate(el => document.activeElement === el), true);
  await draft.fill("Edited locally by the user.");
  assert.equal(await draft.inputValue(), "Edited locally by the user.");
  await page.getByRole("button", { name: "Clear" }).click();
  assert.equal(await draft.isVisible(), false);
  assert.equal(await page.getByLabel("What do you want to do?").evaluate(el => document.activeElement === el), true);
  assert.equal(await page.locator("#status").textContent(), "");
  await page.getByLabel("What do you want to do?").evaluate(el => { el.value = "invalid-option"; });
  await page.getByRole("button", { name: "Draft a reply" }).click();
  assert.equal(await draft.isVisible(), false);
  assert.match(await page.locator("#status").textContent(), /Choose a starting point/);
  assert.equal(await page.getByLabel("What do you want to do?").evaluate(el => document.activeElement === el), true);
  assert.deepEqual(errors, []);
  console.log("iCU Buddy Chromium: draft/edit/reset/focus/invalid-selection PASS");
} finally {
  await browser.close();
}
