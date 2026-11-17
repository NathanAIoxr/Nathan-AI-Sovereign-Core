import {createBridge} from "../../../standalone-apps/hook-and-ring/game/universal-bridge.mjs";

export const circuitPack = Object.freeze({
  cartridge_id: "LC_TK_CIRCUITS_V7",
  lc_class: "T - Technology (TK)",
  title: "Circuit Breaker & Field Lab",
  interaction_modes: ["PINCH_AND_PLACE", "TRACKBALL_SPIN", "MAGNETIC_SNAP"],
  physics_profile: {gravity: 0, magnetic_strength: 1.8, snap_to_grid: true, allow_full_quaternion: true},
  bridge_rules: {bottom_clear_grants: "POWER_CHARGE", magnetic_lock_grants: "CIRCUIT_STABLE"},
  cast_roles: {
    curator_intro: "Welcome to Class TK. Spin the board, pinch the components, feel the field.",
    nathan_ai_tip: "Match each connector to its labeled socket before energizing the circuit.",
    pk_chaos_modifier: "Surge mode changes the toy field strength during practice.",
  },
});

const puzzleAward = {orbit:"shield", field:"shield", trace:"focus", dial:"focus", link:"charge",
  logic:"charge", flow:"charge", audio:"focus"};

export function circuitScene(module) {
  return {
    ...module,
    title:circuitPack.title,
    brief:"Complete a schematic circuit by snapping each part to its marked position.",
    task:"Place the battery, switch, and lamp in the matching sockets.",
    items:[
      {name:"Battery",detail:"source socket"},
      {name:"Switch",detail:"control socket"},
      {name:"Lamp",detail:"load socket"},
    ],
    circuit:circuitPack,
  };
}

export function newLibraryBridge() {
  const arcade = createBridge();
  const cleared = new Set();
  const gameRules = {bridge:{points:100}};
  let attempt = null;
  let shield = 0;
  let focus = 0;

  return {
    clear(module) {
      if (cleared.has(module.id)) return "";
      cleared.add(module.id);
      arcade.grantShots(1);
      const reward = puzzleAward[module.profile];
      if (reward === "shield") shield = 1;
      if (reward === "focus") focus = 1;
      const extra = reward === "shield" ? " and Shield" : reward === "focus" ? " and Focus" : "";
      return (module.circuit ? "Circuit stable. " : "") + "Bridge earned Charge" + extra + ".";
    },
    start() {
      if (attempt !== null || !arcade.consumeShot()) return null;
      const slow = focus > 0;
      focus = 0;
      attempt = arcade.startAttempt(gameRules);
      return {id:attempt, slow};
    },
    end(id, success) {
      if (attempt !== id || id === null) return null;
      attempt = null;
      const hit = arcade.emitTopHit(id,{success});
      if (hit) return "100 points, one Charge, and a clue.";
      if (shield > 0) {
        shield = 0;
        arcade.grantShots(1);
        return "Shield returned one Charge.";
      }
      return "Complete a module for more Charge, or use a practice attempt.";
    },
    snapshot() {
      const {points,loadedShots} = arcade.snapshot();
      return {points,charge:loadedShots,shield,focus,pending:attempt !== null};
    },
  };
}

export function castLine(role, scene) {
  const {module,visited,active} = scene;
  if (role === "curator") {
    return module.circuit ? circuitPack.cast_roles.curator_intro :
      "Grape-Apple Curator · " + module.items[active].name + " — " + module.items[active].detail;
  }
  if (role === "pk") {
    return module.circuit ? circuitPack.cast_roles.pk_chaos_modifier :
      "PK · Try the same move with the opposite spin and compare your first result.";
  }
  const next = module.items.find((_,index) => !visited.has(index));
  const hint = module.circuit ? circuitPack.cast_roles.nathan_ai_tip :
    next ? "Inspect " + next.name + " next." : "All items recorded. Replay the move to verify it.";
  return "Nathan AI 🚀 · " + hint;
}
