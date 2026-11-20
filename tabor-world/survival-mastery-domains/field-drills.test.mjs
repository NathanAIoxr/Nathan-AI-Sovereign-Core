import assert from "node:assert/strict";
import test from "node:test";
import { domainExplorer } from "./runtime.mjs";
import { survivalDomains } from "./survival-mastery-domains-data.mjs";
import { fieldDrills } from "./field-drills-data.mjs";

const origin = "https://tabor-world.nathantaboract.workers.dev";
test("each World decision supports all three choices and an independent Academy drill", async () => {
  let total = 0;
  for (const domain of survivalDomains.eras) {
    for (const station of domain.stations) {
      const url = origin + "/survival-mastery-domains/" + domain.id + "/" + station.id + "/";
      const drill = fieldDrills[station.id];
      const before = await domainExplorer.serve(new Request(url)).text();
      assert.equal((before.match(/name="choice"/g) ?? []).length, 3);
      assert.ok(before.includes(drill.practice));
      assert.ok(before.includes(drill.source[1]));
      assert.ok(!before.includes("Worked response —"));
      for (let i = 1; i <= 3; i += 1) {
        const answer = await domainExplorer.serve(new Request(url + "?choice=" + i)).text();
        assert.equal(answer.includes("That choice fits this case."), i === drill.correct);
        assert.ok(answer.includes("Worked response —"));
      }
      const invalid = await domainExplorer.serve(new Request(url + "?choice=1&choice=2")).text();
      assert.ok(!invalid.includes("Worked response —"));
      total += 1;
    }
  }
  assert.equal(total, 27);
});
