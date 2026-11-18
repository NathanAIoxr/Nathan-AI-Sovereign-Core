import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { fieldRequest } from "./field-api.mjs";
import { openField, playTurn, project, replay, score } from "./field-engine.mjs";

const scenarios = JSON.parse(await readFile(new URL("field-scenarios.json", import.meta.url), "utf8"));
const alpha = scenarios[0];
const move = (command, elapsed = 0) => ({ command, elapsed });
const mission = scenario => [
  move("grasp"), move("think Claymore of Clarity", 1500), move("strike " + scenario.barrier),
  move("deploy " + scenario.plane), move("capture " + scenario.shadow), move("convert " + scenario.shadow),
  move("command " + scenario.directive + " | " + scenario.ruin), move("weave " + scenario.sector),
];
test("manual thought works at 2000 ms and autonomous default takes over at 2001 ms", () => {
  const board = playTurn(openField(alpha, 81), alpha, "grasp").state;
  const manual = playTurn(board, alpha, "think Claymore of Clarity", 2000);
  assert.equal(manual.state.form, "Claymore of Clarity");
  const automatic = playTurn(board, alpha, "think Claymore of Clarity", 2001);
  assert.ok(["Broadblade of Truth","Rapier of Precision","Shield-Edge"].includes(automatic.state.form));
  assert.equal(playTurn(board, alpha, "think", 2001).state.form, automatic.state.form);
});

test("all four classes change the board, with scoped traps and one-use threads", () => {
  let board = replay(alpha, 1, mission(alpha).slice(0, 3)).state;
  assert.equal(score(board, alpha).balance, 20);
  board = playTurn(board, alpha, "deploy Mental & Financial | Other").state;
  assert.equal(playTurn(board, alpha, "capture Deception").accepted, false);
  board = playTurn(board, alpha, "rewind").state;
  assert.equal(board.traps.length, 0);
  assert.equal(playTurn(board, alpha, "convert Deception").accepted, false);
  const complete = replay(alpha, 1, mission(alpha)).state;
  assert.equal(complete.traps[0].scope, "Everything & Nothing");
  assert.equal(complete.wovenOrder[0].id, "Purified_Deception_Thread");
  assert.equal(complete.newWorldMatrix[0].id, "Innocence_Pillar_1");
  assert.equal(playTurn(complete, alpha, "weave Cleared Sector Alpha").accepted, false);
  assert.equal(playTurn(complete, alpha, "command Clear Decay | Some other target").accepted, false);
  assert.equal(score(complete, alpha).balance, 100);
  assert.equal(score(complete, alpha).complete, true);
});

test("all three missions run in both engines and replay to the same board", () => {
  for (const scenario of scenarios) {
    const initial = mission(scenario);
    const history = [...initial];
    if (scenario.dreamRequired || scenario.rewindRequired) {
      const pre = replay(scenario, 90, initial.slice(0, -1));
      assert.equal(playTurn(pre.state, scenario, "weave " + scenario.sector).accepted, false);
      if (scenario.dreamRequired) history.splice(-1, 0, move("dream A new pattern for the loom"));
      if (scenario.rewindRequired) history.splice(-1, 0, move("rewind"), initial.at(-2));
    }
    const js = replay(scenario, 90, history);
    const python = spawnSync("python3", [fileURLToPath(new URL("tabor_field.py", import.meta.url)), "--json"], {
      encoding: "utf8", input: JSON.stringify({ scenario: scenario.id, seed: 90, history }),
    });
    assert.equal(python.status, 0, python.stderr);
    const parsed = JSON.parse(python.stdout);
    assert.deepEqual(parsed.state, project(js.state));
    assert.deepEqual(parsed.events, js.events);
    assert.equal(parsed.complete, score(js.state, scenario).complete);
    assert.equal(parsed.balance, 100);
  }
});

test("the HTTP game fingerprints replayed turns and rejects invalid histories", async () => {
  const endpoint = "https://field.test/api/field/play";
  const request = body => fieldRequest(new Request(endpoint, { method: "POST", headers: { "content-type":"application/json" }, body: JSON.stringify(body) }), scenarios);
  const history = mission(alpha);
  const final = await request({ scenario: alpha.id, seed: 1, history: history.slice(0,-1), move: history.at(-1) });
  assert.equal(final.status, 200);
  const board = await final.json();
  assert.equal(board.complete, true);
  assert.match(board.receipt, /^[0-9a-f]{64}$/);
  const replayed = await (await request({ scenario: alpha.id, seed: 1, history })).json();
  assert.equal(replayed.receipt, board.receipt);
  const bad = await request({ scenario: alpha.id, seed: 1, history: [move("convert Deception")] });
  assert.equal(bad.status, 400);
});
