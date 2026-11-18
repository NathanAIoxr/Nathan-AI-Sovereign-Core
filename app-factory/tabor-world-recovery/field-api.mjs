import { inputJSON } from "./runtime-api.mjs";
import { controls, hesitationThreshold, playTurn, project, replay, score } from "./field-engine.mjs";

const json = (data, status = 200) => Response.json(data, { status, headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });
const validMove = move => move && typeof move.command === "string" && move.command.length > 0 && move.command.length <= 160 &&
  Number.isInteger(move.elapsed) && move.elapsed >= 0 && move.elapsed <= 60000;

async function proof(value) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function fieldRequest(request, scenarios) {
  if (!Array.isArray(scenarios) || scenarios.length === 0) return json({ error: "The field scenarios are unavailable." }, 503);
  const path = new URL(request.url).pathname;
  if (path === "/api/field/scenarios") {
    if (request.method !== "GET") return json({ error: "Use GET for scenarios." }, 405);
    return json({ scenarios, controls, hesitationThreshold });
  }
  if (path !== "/api/field/play") return json({ error: "Unknown field route." }, 404);
  if (request.method !== "POST") return json({ error: "Use POST for field turns." }, 405);
  try {
    const body = await inputJSON(request);
    const scenario = scenarios.find(item => item.id === body.scenario);
    if (!scenario || !Number.isInteger(body.seed) || body.seed < 0 || body.seed > 4294967295 ||
        !Array.isArray(body.history) || body.history.length > 72 || !body.history.every(validMove) ||
        (body.move != null && !validMove(body.move))) throw new RangeError("Invalid scenario, seed, or move history.");
    const previous = replay(scenario, body.seed, body.history);
    const result = body.move ?
      playTurn(previous.state, scenario, body.move.command, body.move.elapsed) :
      { state: previous.state, accepted: false, event: "" };
    if (result.accepted && body.history.length === 72) throw new RangeError("Start a fresh scenario to continue.");
    const events = result.accepted ? [...previous.events, result.event] : previous.events;
    const state = project(result.state);
    const balance = score(result.state, scenario);
    return json({ accepted: result.accepted, event: result.event, events, state, ...balance,
      receipt: await proof({ scenario: scenario.id, seed: body.seed, state, events }) });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof RangeError) return json({ error: error.message }, 400);
    return json({ error: "The field could not complete this turn." }, 500);
  }
}
