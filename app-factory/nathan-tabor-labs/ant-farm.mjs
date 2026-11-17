// Opposite streams share a clock and an axis. Their phases are kept separately.
const TAU = Math.PI + Math.PI;
const QUARTER_TURN = Math.atan2(1, 0);
export const antModes = Object.freeze(["forward", "reverse", "counterspin"]);
export const antPlanes = Object.freeze(["linear", "vertical"]);

function wrap(angle) {
  return (angle % TAU + TAU) % TAU;
}

export function createAntFarm() {
  return {
    mode: "counterspin", plane: "linear", visible: false,
    forwardCursor: 0, reverseCursor: 0, right: 0, left: 0,
    trails: {forward: {}, reverse: {}}, lanes: {forward: [], reverse: []},
  };
}

export function configureAntFarm(farm, {mode, plane, visible}) {
  if (!antModes.includes(mode) || !antPlanes.includes(plane) || typeof visible !== "boolean") {
    throw new RangeError("Invalid Ant Farm settings.");
  }
  Object.assign(farm, {mode, plane, visible});
}

export function advanceAntFarm(farm, radians) {
  if (!Number.isFinite(radians) || radians < 0) throw new RangeError("Invalid Ant Farm clock step.");
  if (farm.mode !== "reverse") farm.right = wrap(farm.right + radians);
  if (farm.mode !== "forward") farm.left = wrap(farm.left - radians);
  return {right: farm.right, left: farm.left,
    axis: farm.plane === "vertical" ? QUARTER_TURN : 0};
}

// Only routing outcomes reinforce trails. Neither stream alters authority or priority.
export function routeAnts(farm, bees) {
  const candidates = [...new Set(bees)];
  const count = candidates.length;
  if (!count) return [];
  const farmLanes = {forward: [], reverse: []};
  for (const [direction, ordered, cursor] of [
    ["forward", candidates, "forwardCursor"], ["reverse", [...candidates].reverse(), "reverseCursor"],
  ]) {
    if (direction === "forward" && farm.mode === "reverse" || direction === "reverse" && farm.mode === "forward") continue;
    const start = farm[cursor] % count;
    const rotated = ordered.slice(start).concat(ordered.slice(0, start));
    const trail = farm.trails[direction];
    const [next, ...rest] = rotated;
    farmLanes[direction] = [next, ...rest.sort((a, b) => (trail[b] ?? 0) - (trail[a] ?? 0))];
    farm[cursor] = (start + 1) % count;
    for (const bee of candidates) trail[bee] = Math.max(0, (trail[bee] ?? 0) - 1);
    trail[next] = Math.min(4, trail[next] + 2);
  }
  farm.lanes = farmLanes;
  const {forward, reverse} = farmLanes;
  const routes = farm.plane === "vertical"
    ? [forward, reverse].flat()
    : Array.from({length: count}, (_, index) => [forward[index], reverse[index]]).flat();
  return [...new Set(routes.filter(Boolean))];
}
