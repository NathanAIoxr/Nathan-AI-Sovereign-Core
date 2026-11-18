export const gameEngine = String.raw`
export const scenarios = [
  {id:"alpha", name:"Sector Alpha", task:"Untangle the Illusion Barrier and reclaim the old ruins.",
   barrier:"Illusion Barrier", guard:3, decay:"Old System Ruins", directive:"Clear Decay", decayEnergy:2,
   threat:"Deception", plane:"Mental", field:"Mental & Financial"},
  {id:"echo", name:"Echo Archive", task:"Clear the distorted records and return the archive to order.",
   barrier:"Echo Barrier", guard:5, decay:"Frozen Archive", directive:"Unbind Ruin", decayEnergy:3,
   threat:"False Echo", plane:"Mythological", field:"Everything & Nothing"},
  {id:"meridian", name:"Meridian Loom", task:"Recover the broken gate and open the One into Zero lock.",
   barrier:"Meridian Veil", guard:6, decay:"Abandoned Matrix", directive:"Clear Decay", decayEnergy:4,
   threat:"Tangled Time", plane:"Dream", field:"Here & There"}
];

export const forms = [
  {name:"Broadblade of Truth", force:2, guard:1},
  {name:"Rapier of Precision", force:3, guard:0},
  {name:"Shield-Edge", force:1, guard:2}
];
export const planes = ["Mental","Spiritual","Physical","Financial","Literal","Figurative","Mythological","Dream"];
export const scopes = ["Mental & Financial","Everything & Nothing","Here & There"];
export const directives = ["Clear Decay","Unbind Ruin"];
export const lockPath = ["right","right","left","left","left","left"];
export const discernAfterMs = 2000;

export function start(id) {
  const scene = scenarios.find(s => s.id === id) || scenarios[0];
  return {scene, barrier:scene.guard, decay:scene.decayEnergy, form:null, bladeName:null, trap:null, thread:null,
    converted:false, foundation:null, stability:6, lock:0, complete:false, journal:[]};
}

export function play(state, command) {
  const {scene} = state;
  const reject = reason => ({ok:false, reason, state});
  const changed = (changes, role, note) => ({ok:true, state:{...state, ...changes,
    journal:[...state.journal, {role, note}]}});
  if (!command || typeof command !== "object") return reject("Choose an action.");
  if (state.complete) return reject("This sector is complete. Choose the next sector or undo a move.");
  switch (command.action) {
    case "manifest": {
      if (!Number.isInteger(command.form) || !forms[command.form]) return reject("Choose a blade form.");
      if (state.barrier === 0) return reject("The barrier has already been severed.");
      const auto = command.auto === true;
      const custom = !auto && typeof command.label === "string" ? command.label.trim().slice(0,64) : "";
      const bladeName = custom || forms[command.form].name;
      if (state.form === command.form && state.bladeName === bladeName) return reject("That form is already active.");
      const prefix = auto ? "Autonomous Discernment" : "Thought-Link Active";
      return changed({form:command.form,bladeName},"Light Slayer",prefix + " — " + bladeName);
    }
    case "strike": {
      if (state.form === null) return reject("Grip the hilt to manifest a blade first.");
      if (!state.barrier) return reject("The barrier has already been severed.");
      const blade = forms[state.form];
      const barrier = Math.max(0, state.barrier - blade.force);
      const stability = Math.max(0, Math.min(12, state.stability + blade.guard - (barrier ? 1 : 0)));
      return changed({barrier, stability},"Light Slayer",barrier ? scene.barrier + " weakened." : scene.barrier + " severed.");
    }
    case "arm": {
      if (state.converted) return reject("The threat has already been converted.");
      if (!planes.includes(command.plane) || !scopes.includes(command.scope)) return reject("Choose a plane and scope.");
      if (state.trap?.plane === command.plane && state.trap.scope === command.scope) return reject("That trap is already armed.");
      return changed({trap:{plane:command.plane, scope:command.scope}},"Light Sleyer","Web armed on " + command.plane + " · " + command.scope);
    }
    case "convert": {
      if (state.barrier) return reject("Sever the barrier to reveal the threat.");
      if (state.converted) return reject("The threat has already been converted.");
      if (!state.trap) return reject("Arm a conversion web first.");
      if (state.trap.plane !== scene.plane || state.trap.scope !== scene.field) {
        return reject("Tune the web to " + scene.plane + " / " + scene.field + ".");
      }
      const thread = "Purified_" + scene.threat.replaceAll(" ", "_") + "_Thread";
      return changed({trap:null, thread, converted:true, stability:Math.min(12,state.stability+2)},"Light Sleyer","Captured " + scene.threat + " → " + thread);
    }
    case "clear": {
      if (!state.decay) return reject("This sector is clear.");
      if (command.directive !== scene.directive) return reject("This ruin requires " + scene.directive + ".");
      const decay = state.decay - 1;
      return changed({decay},"Dark Slayer",command.directive + " — " + (decay ? scene.decay + " weakened." : scene.decay + " cleared."));
    }
    case "weave": {
      if (state.foundation) return reject("This sector already has a foundation.");
      if (state.decay || !state.thread) return reject("Clear the ruins and convert the threat before weaving.");
      const foundation = "Innocence Pillar · " + scene.name;
      return changed({foundation, thread:null, stability:Math.min(12,state.stability+2)},"Dark Sleyer",foundation + " woven.");
    }
    case "rotate": {
      if (!state.foundation) return reject("Weave the foundation to reach the lock.");
      if (command.direction !== "left" && command.direction !== "right") return reject("Choose a left or right full circle.");
      const lock = command.direction === lockPath[state.lock] ? state.lock+1 : Number(command.direction === "right");
      const complete = lock === lockPath.length;
      return changed({lock, complete},"Axis",complete ? "One into Zero opened the sector." :
        (lock <= state.lock ? "Lock realigned. " : "Lock advanced. ") + lock + "/" + lockPath.length);
    }
    default:
      return reject("Unknown action.");
  }
}

export function replay(id, commands) {
  let state = start(id);
  if (!Array.isArray(commands) || commands.length > 256) return state;
  for (const command of commands) {
    const result = play(state, command);
    if (!result.ok) break;
    state = result.state;
  }
  return state;
}
`;
