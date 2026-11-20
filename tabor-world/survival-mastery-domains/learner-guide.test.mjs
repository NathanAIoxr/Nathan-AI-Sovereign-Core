import assert from "node:assert/strict";
import test from "node:test";
import withLearnerGuide from "./academy-learner-guide.mjs";
import { domainExplorer } from "./runtime.mjs";
import { survivalDomains } from "./survival-mastery-domains-data.mjs";
import { academyCourse, learningTopics, worldCourse } from "./survival-guide.mjs";

const request = (path, method = "GET") => new Request("https://example.test" + path, { method });
const academy = withLearnerGuide({ fetch: () => new Response("delegated") });
test("both experiences find the right topic with everyday words", async () => {
  for (const [home, fetchPage] of [
    [worldCourse, domainExplorer.serve],
    [academyCourse, academy.fetch],
  ]) {
    for (const [query, title] of [
      ["water", "Make a safe drinking water plan"],
      ["loans", "Compare loans, fees, and debt"],
      ["gaslighting", "Set and respect boundaries"],
    ]) {
      const response = await fetchPage(request(home + "/?q=" + query));
      const page = await response.text();
      assert.equal(response.status, 200);
      assert.match(page, /Start with Three Apples/);
      assert.match(page, /Search results/);
      assert.ok(page.includes(title));
    }
    const noResults = await fetchPage(request(home + "/?q=%3Cscript%3E"));
    const page = await noResults.text();
    assert.match(page, /0 topics for/);
    assert.match(page, /&lt;script&gt;/);
    assert.doesNotMatch(page, /<script>/);
  }
});

test("all 27 Academy topics show the existing lesson and matching drill together", async () => {
  const topics = learningTopics(survivalDomains, "academy");
  assert.equal(topics.length, 27);
  for (const domain of survivalDomains.eras) {
    const response = await academy.fetch(request("/way/mastery-" + domain.id + "/"));
    const page = await response.text();
    for (const topic of topics.filter((item) => item.domain === domain.id)) {
      assert.ok(page.includes(topic.lesson));
      assert.ok(page.includes(topic.practice));
    }
  }
});

test("Academy drills keep authored wording and offer a separate self-check and print view", async () => {
  const path = "/way/mastery-money/survival-field-drill-04/";
  const env = { LIBRARY: { prepare: () => ({
    bind(domain, slug) {
      assert.equal(domain, "mastery-money");
      assert.equal(slug, "survival-field-drill-04");
      return { first: async () => ({
        outcome: "Make a decision.",
        build: "Three apples. Choices: 1. First / 2. Second / 3. Third",
        flip: "Nathan Tabor’s words: “subtractions and multiplication are man made traps”",
        integrate: "Write down where each apple went.",
        verify: "Worked response: Account for every apple.",
        link: "institution/foundation/three-apples/",
      }) };
    },
  }) } };
  const page = await (await academy.fetch(request(path), env)).text();
  assert.match(page, /<ol><li>First<\/li><li>Second<\/li><li>Third<\/li><\/ol>/);
  assert.match(page, /<blockquote>“subtractions and multiplication are man made traps”<\/blockquote>/);
  assert.match(page, /<details><summary>Check your response/);
  assert.match(page, /survival-mastery-domains\/money\/4\//);
  assert.match(await (await academy.fetch(request(path + "?print=1"), env)).text(), /<details open>/);
  assert.equal(await (await academy.fetch(request(path, "HEAD"), env)).text(), "");
  assert.equal(await (await academy.fetch(request(path))).text(), "delegated");
  assert.equal(await (await academy.fetch(request(academyCourse + "/fieldbook/"))).text(), "delegated");
  assert.equal(await (await academy.fetch(request(academyCourse + "/", "POST"))).text(), "delegated");
});

test("Three Apples presents subtraction and points to the original lesson", async () => {
  const result = await domainExplorer.serve(request(worldCourse + "/money/4/?choice=1"));
  const page = await result.text();
  assert.match(page, /Three Apples · Subtraction/);
  assert.match(page, /Three minus one equals two apples on the table/);
  assert.match(page, /institution\/foundation\/three-apples\//);
  assert.doesNotMatch(page, /bicycle patch|what you traded|Bartering income/);
  const search = await academy.fetch(request(academyCourse + "/?q=subtraction"));
  assert.match(await search.text(), /Three Apples · Subtraction/);
});
