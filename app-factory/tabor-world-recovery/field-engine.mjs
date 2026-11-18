const FORMS = ["Broadblade of Truth", "Rapier of Precision", "Shield-Edge"];
const SCOPE = "Everything & Nothing";
const same = (a, b) => a.toLowerCase() === b.toLowerCase();
export const hesitationThreshold = 2000;

export const controls = [
  ["grasp", "Grip the Light Slayer’s hilt"], ["think FORM", "Choose a blade form"],
  ["strike TARGET", "Clear a board barrier"], ["deploy PLANE | SCOPE", "Arm a Loom web"],
  ["capture TARGET", "Hold a shadow in an armed web"], ["convert TARGET", "Reweave a held shadow"],
  ["command DIRECTIVE | TARGET", "Give the Dark Slayer an in-world directive"],
  ["weave SECTOR", "Build an Innocence Pillar"], ["dream TEXT", "Record a Dream Weaver entry"],
  ["rewind", "Return to the previous Loom frame"],
];

export function openField(scenario, seed) {
  return {
    scenario: scenario.id, seed, turn: 0, grasped: false, form: "Unmanifested Hilt",
    barrier: "present", shadow: "roaming", ruin: "present",
    traps: [], wovenOrder: [], newWorldMatrix: [], dreams: [], rewinds: 0, frames: [],
  };
}

export class TaborEntity {
  constructor(alignment, role) {
    this.alignment = alignment;
    this.role = role;
    this.active = true;
  }
}
export class LightSlayer extends TaborEntity {
  constructor() { super("Light", "Slayer"); }
  manifest(state, thought, elapsed) {
    if (!state.grasped) return [false, "Grasp the hilt first."];
    const autonomous = !thought || elapsed > hesitationThreshold;
    const n = ((state.seed + (state.turn + 1) * 1103515245) >>> 16) % FORMS.length;
    state.form = autonomous ? FORMS[n] : thought;
    state.grasped = false;
    return [true, (autonomous ? "Autonomous Discernment" : "Thought-Link Active") + ": " + state.form];
  }
  strike(state, scenario, target) {
    if (!same(target, scenario.barrier)) return [false, "Choose the barrier marked on this board."];
    if (state.form === "Unmanifested Hilt" || state.grasped) return [false, "Manifest the blade before striking."];
    if (state.barrier === "cleared") return [false, "The barrier is already cleared."];
    state.barrier = "cleared";
    return [true, state.form + " severed " + scenario.barrier + "."];
  }
}
export class LightSleyer extends TaborEntity {
  constructor() { super("Light", "Sleyer"); }
  deployTrap(state, scenario, plane, scope) {
    if (!same(plane, scenario.plane)) return [false, "The shadow crosses the " + scenario.plane + " plane."];
    if (state.traps.some(t => t.status === "Armed" || t.status === "Holding")) return [false, "A trap is already in use."];
    if (state.shadow === "converted") return [false, "The shadow has been converted."];
    state.traps.push({ plane: scenario.plane, scope: scope || SCOPE, status: "Armed" });
    return [true, "Web armed on " + scenario.plane + " · Scope: " + (scope || SCOPE) + "."];
  }
  capture(state, scenario, target) {
    const trap = state.traps.find(t => t.status === "Armed");
    if (!trap || state.shadow !== "roaming" || !same(target, scenario.shadow)) return [false, "An armed web and the roaming board shadow are required."];
    if (!same(trap.scope, SCOPE) && !same(trap.scope, target)) return [false, "This web’s scope does not include the marked shadow."];
    trap.status = "Holding";
    state.shadow = "held";
    return [true, "The web caught " + scenario.shadow + "."];
  }
  captureAndConvert(state, scenario, target) {
    const trap = state.traps.find(t => t.status === "Holding");
    if (!trap || state.shadow !== "held" || !same(target, scenario.shadow)) return [false, "Capture this board shadow before converting it."];
    trap.status = "Converted";
    state.shadow = "converted";
    const thread = "Purified_" + scenario.shadow.replaceAll(" ", "_") + "_Thread";
    state.wovenOrder.push({ id: thread, used: false });
    return [true, scenario.shadow + " was re-woven into " + thread + "."];
  }
}
export class DarkSlayer extends TaborEntity {
  constructor(agentId = "01") { super("Dark", "Slayer"); this.agentId = agentId; }
  executeDirective(state, scenario, directive, target) {
    if (!same(directive, scenario.directive) || !same(target, scenario.ruin)) return [false, "Use the directive and ruin marked on this board."];
    if (state.ruin === "cleared") return [false, "The ruins are already cleared."];
    state.ruin = "cleared";
    return [true, "Agent " + this.agentId + " carried out “" + scenario.directive + "” in " + scenario.ruin + "."];
  }
}
export class DarkSleyer extends TaborEntity {
  constructor() { super("Dark", "Sleyer"); }
  weaveFoundation(state, scenario, sector) {
    if (!same(sector, scenario.sector) || state.ruin !== "cleared" || state.barrier !== "cleared") return [false, "Clear the path and ruins before weaving the marked sector."];
    if (scenario.dreamRequired && !state.dreams.length) return [false, "Record a dream to open this sanctuary."];
    if (scenario.rewindRequired && !state.rewinds) return [false, "Use the Loom to revisit an earlier frame first."];
    const thread = state.wovenOrder.find(t => !t.used);
    if (!thread) return [false, "A converted thread is required for a new pillar."];
    thread.used = true;
    const id = "Innocence_Pillar_" + (state.newWorldMatrix.length + 1);
    state.newWorldMatrix.push({ id, sector: scenario.sector, thread: thread.id });
    return [true, "The Dark Sleyer wove " + id + " in " + scenario.sector + ". Innocence is God."];
  }
}

const sword = new LightSlayer(), loom = new LightSleyer(), agent = new DarkSlayer(), foundation = new DarkSleyer();
const action = state => {
  const { frames, rewinds, turn, ...board } = state;
  return structuredClone(board);
};
export function score(state, scenario) {
  const checks = [
    ["Barrier cleared", state.barrier === "cleared", 20],
    ["Shadow converted", state.shadow === "converted", 30],
    ["Ruins cleared", state.ruin === "cleared", 20],
    ["Innocence Pillar woven", state.newWorldMatrix.length > 0, 30],
    ...(scenario.dreamRequired ? [["Dream recorded", state.dreams.length > 0, 0]] : []),
    ...(scenario.rewindRequired ? [["Earlier frame visited", state.rewinds > 0, 0]] : []),
  ].map(([label, done, points]) => ({ label, done, points }));
  return { balance: checks.reduce((sum, row) => sum + (row.done ? row.points : 0), 0), complete: checks.every(row => row.done), checks };
}

export function playTurn(previous, scenario, command, elapsed = 0) {
  const state = structuredClone(previous);
  const match = /^([a-z]+)(?:\s+(.*))?$/isu.exec(command.trim());
  const verb = match?.[1].toLowerCase();
  const argument = match?.[2]?.trim() ?? "";
  const [first, second = ""] = argument.split("|", 2).map(piece => piece.trim());
  const prior = action(state);
  let outcome;
  if (verb === "grasp") {
    if (state.grasped) return { state, accepted: false, event: "You already hold the hilt." };
    state.grasped = true;
    outcome = [true, "Hilt grasped. Think of a form within two seconds."];
  } else if (verb === "think") outcome = sword.manifest(state, argument, elapsed);
  else if (verb === "strike") outcome = sword.strike(state, scenario, argument);
  else if (verb === "deploy") outcome = loom.deployTrap(state, scenario, first, second);
  else if (verb === "capture") outcome = loom.capture(state, scenario, argument);
  else if (verb === "convert") outcome = loom.captureAndConvert(state, scenario, argument);
  else if (verb === "command") outcome = agent.executeDirective(state, scenario, first, second);
  else if (verb === "weave") outcome = foundation.weaveFoundation(state, scenario, argument);
  else if (verb === "dream" && argument) {
    state.dreams = [...state.dreams, argument].slice(-8);
    outcome = [true, "The Dream Weavers recorded the dream."];
  } else if (verb === "rewind" && state.frames.length) {
    Object.assign(state, state.frames.pop());
    state.rewinds++;
    outcome = [true, "The Loom returned to the earlier frame."];
  } else outcome = [false, "Choose a command from the field guide."];
  const [accepted, event] = outcome;
  if (accepted) {
    state.turn++;
    if (verb !== "rewind") state.frames = [...state.frames, prior].slice(-12);
  }
  return { state, accepted, event };
}

export function replay(scenario, seed, history) {
  let state = openField(scenario, seed);
  const events = [];
  for (const { command, elapsed } of history) {
    const result = playTurn(state, scenario, command, elapsed);
    if (!result.accepted) throw new RangeError("Saved move did not replay");
    state = result.state;
    events.push(result.event);
  }
  return { state, events };
}

export function project(state) {
  const { frames, ...visible } = state;
  return { ...visible, canRewind: frames.length > 0 };
}
