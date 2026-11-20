export const ZONE = "tweezer-tap-os";
export const WATCHDOG_MS = 30_000;
export const CARTRIDGES = Object.freeze(["nostril_toy", "shoulder_bb", "ingrown_nail"]);
export const CONTROL_ACTIONS = Object.freeze([
  "ARM", "HOLD_HEAD", "FLASHLIGHT_ON", "TWEEZERS_PULL", "IRQ_FLINCH", "ABORT_ER_RUN"
]);
export const initial = () => ({
  mission: null, phase: "IDLE", holds: [], light: false, panic: 0, deadline: 0, outcome: null
});

export function canonical(value) {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value !== null && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(k => JSON.stringify(k) + ":" + canonical(value[k])).join(",") + "}";
  }
  return JSON.stringify(value);
}

export async function digest(value) {
  const data = new TextEncoder().encode(canonical(value));
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  return Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
}

const same = (left, right) => canonical(left) === canonical(right);
const fail = (before, status) => ({state: before, status});
const accept = (state, status = "ACCEPTED") => ({state, status});

function abort(state, cause) {
  return accept({...state, phase:"BRAKED", deadline:0, holds:[], light:false, outcome:cause}, "BRAKED");
}

export function transition(before, input, now) {
  const {action, actor, mission} = input;
  const armed = before.phase === "ARMED";
  const timedOut = armed && now >= before.deadline;
  if (action === "ABORT_ER_RUN") return armed ? abort(before, "OPERATOR_STOP") : fail(before,"NO_ACTIVE_MISSION");
  if (timedOut) return abort(before, "ER_WATCHDOG");
  if (action === "TIME_TICK") return accept(before, "HEARTBEAT");
  if (action === "ARM") {
    if (armed || !CARTRIDGES.includes(mission)) return fail(before, "ARM_DENIED");
    return accept({...initial(), mission, phase:"ARMED", deadline:now+WATCHDOG_MS});
  }
  if (!armed) return fail(before, "NO_ACTIVE_MISSION");
  if (action === "HOLD_HEAD") {
    if (!["operator-a","operator-b"].includes(actor)) return fail(before,"HOLD_ROLE_REQUIRED");
    if (before.holds.includes(actor)) return fail(before,"HOLD_ALREADY_RECORDED");
    return accept({...before, holds:[...before.holds,actor].sort()});
  }
  if (action === "FLASHLIGHT_ON") return accept({...before, light:true});
  if (action === "IRQ_FLINCH") {
    const state = {...before, panic:Math.min(3,before.panic+1)};
    return state.panic === 3 ? abort(state,"IRQ_FLINCH_LIMIT") : accept(state);
  }
  if (action === "TWEEZERS_PULL") {
    if (before.holds.length !== 2 || !before.light) return fail(before,"INTERLOCK");
    return accept({...before,phase:"COMPLETE",deadline:0,holds:[],light:false,outcome:"CLEARED"}, "COMPLETE");
  }
  return fail(before,"UNKNOWN_ACTION");
}

export function alien(before, input, now) {
  const next = transition(before, input, now);
  const changes = Object.keys(before).filter(key => !same(before[key], next.state[key])).sort();
  const undo = Object.fromEntries(changes.map(key => [key,before[key]]));
  return {direction:"ALIEN", input, time:now, before, after:next.state, result:next.status, changes, undo};
}

export function neila(forward, expectedAfter = forward.after) {
  if (!same(forward.after,expectedAfter)) return {direction:"NEILA",passed:false,reason:"OUTCOME_CONTINUITY"};
  const replay = alien(forward.before,forward.input,forward.time);
  if (!same(replay, forward)) return {direction:"NEILA",passed:false,reason:"REPLAY_MISMATCH"};
  const reversed = {...forward.after, ...forward.undo};
  if (!same(reversed,forward.before)) return {direction:"NEILA",passed:false,reason:"UNDO_MISMATCH"};
  return {direction:"NEILA",passed:true,reason:"REPLAY_AND_UNDO_MATCH"};
}

export function rehearsal(now) {
  const score = [];
  let state = initial();
  const plan = [
    ["ARM","operator-a"],["TWEEZERS_PULL","operator-a"],["HOLD_HEAD","operator-a"],
    ["HOLD_HEAD","operator-a"],["HOLD_HEAD","operator-b"],["FLASHLIGHT_ON","operator-a"],
    ["IRQ_FLINCH","sensor"],["TWEEZERS_PULL","operator-a"],["TIME_TICK","clock"],
    ["ARM","operator-b"],["HOLD_HEAD","operator-b"],["ABORT_ER_RUN","operator-b"],
    ["TIME_TICK","clock"],["ARM","operator-a"],["TIME_TICK","clock",WATCHDOG_MS],
    ["TWEEZERS_PULL","operator-b"],["ARM","operator-b"],["IRQ_FLINCH","sensor"],
    ["IRQ_FLINCH","sensor"],["IRQ_FLINCH","sensor"]
  ];
  const expected = ["ACCEPTED","INTERLOCK","ACCEPTED","HOLD_ALREADY_RECORDED","ACCEPTED",
    "ACCEPTED","ACCEPTED","COMPLETE","HEARTBEAT","ACCEPTED","ACCEPTED","BRAKED","HEARTBEAT",
    "ACCEPTED","BRAKED","NO_ACTIVE_MISSION","ACCEPTED","ACCEPTED","ACCEPTED","BRAKED"];
  let time = now;
  for (const mission of CARTRIDGES) {
    for (const [index,[action,actor,delay = 1]] of plan.entries()) {
      time += delay;
      const forward = alien(state,{action,actor,...(action === "ARM" ? {mission} : {})},time);
      score.push({measure:score.length+1,expected:expected[index],forward});
      state = forward.after;
    }
  }
  return score;
}

export function reverseScore(score) {
  let cursor = score.at(-1)?.forward.after;
  const measures = [];
  for (const item of [...score].reverse()) {
    const verdict = neila(item.forward,cursor);
    const passed = verdict.passed && item.forward.result === item.expected;
    measures.push({measure:item.measure,passed,reason:passed ? verdict.reason : "MEASURE_FAILED"});
    cursor = item.forward.before;
  }
  return {passed:score.length===60 && same(cursor,initial()) &&
    measures.every((m,i) => m.passed && m.measure === 60-i),measures};
}

export function isWarrant(row, now) {
  return row?.zone_id === ZONE && row.mode === "HOLDING" && row.enabled === 1 &&
    (row.expires_at === null || Number.isSafeInteger(row.expires_at) && row.expires_at > now);
}
