export const previousBees = Object.freeze([
  "Queen", "Library", "Physics", "Memory", "Curriculum", "Provenance", "Index", "Economy", "Shadow", "Replication"
]);

export const domainBees = Object.freeze([
  ["Hardware", "Silicon, boards, sensors, actuators, power, thermal systems, GPIO, I²C, SPI, UART, PCIe"],
  ["Firmware", "Bootloaders, UEFI and BIOS, device trees, real-time controllers, FPGA images"],
  ["OS", "Kernels, drivers, process isolation, memory, scheduling, containers"],
  ["Network", "Protocols, routing, trust boundaries, mesh, satellite links, local-first transport"],
  ["Security", "Keys, attestation, secure enclaves, integrity measurements, defensive asset inventory"],
  ["Sensor", "Touch, gyro, camera, IMU, environmental, biometric, and radio inputs"],
  ["Actuator", "Motors, haptics, displays, sound, LEDs, and robotic effectors"],
  ["Storage", "Local and distributed storage, encryption, versioning, ownership"],
  ["Compute", "CPU, GPU, NPU, edge and local inference"],
  ["Interface", "Dual-Screen Arcade, Track Baller, external presentation and human controls"],
  ["Integration", "Authorized device and application adapters, permission boundaries, supported capability reports"]
]);

export const orbit = Object.freeze([
  [1, 4], [2, 6], [4, 7], [6, 6], [7, 4], [6, 2], [4, 1], [2, 2]
]);
export const trail = Object.freeze([1, 2, 3, 4, 5, 6, 7]);

const zero = () => ({ phase: 0, steps: 0, signedSteps: 0 });
export const createPattern = () => ({ normal: zero(), reverse: { ...zero(), phase: 6 }, left: zero(), right: zero() });

function advance(lane, direction, length) {
  const next = lane.phase + direction;
  const phase = next === length ? 0 : next < 0 ? length - 1 : next;
  return { phase, steps: lane.steps + 1, signedSteps: lane.signedSteps + direction };
}

export function stepPattern(state, pattern, spin) {
  return {
    normal: pattern === "normal" || pattern === "both" ? advance(state.normal, 1, trail.length) : state.normal,
    reverse: pattern === "reverse" || pattern === "both" ? advance(state.reverse, -1, trail.length) : state.reverse,
    left: spin === "left" || spin === "both" ? advance(state.left, -1, orbit.length) : state.left,
    right: spin === "right" || spin === "both" ? advance(state.right, 1, orbit.length) : state.right
  };
}

export function patternPositions(state, axis) {
  const coordinate = phase => axis === "vertical" ? [trail[phase], 4] : [4, trail[phase]];
  const phaseSum = state.left.phase + state.right.phase;
  const netPhase = phaseSum >= orbit.length ? phaseSum - orbit.length : phaseSum;
  return {
    normal: coordinate(state.normal.phase), reverse: coordinate(state.reverse.phase),
    left: orbit[state.left.phase], right: orbit[state.right.phase],
    netPhase, netSpin: state.left.signedSteps + state.right.signedSteps
  };
}

export function propose(domain, specialist = false) {
  if (!domainBees.some(([owner]) => owner === domain)) throw RangeError("Unknown domain");
  return Object.freeze({
    domain, authority: "Nathan AI Hive", bee: domain + " Bee",
    ant: "Ant Farm simulation", action: "review the sample inventory record",
    state: "proposed", priority: "observe", simulated: true,
    specialist: specialist ? "requested from Replication Bee" : "none"
  });
}

export function resolve(task, decision) {
  if (task.state !== "proposed") return task;
  if (decision === "hold") return { ...task, state: "held", result: "No sample review ran." };
  if (decision !== "approve") return task;
  return { ...task, state: "observed", result: "One sample record reviewed. Zero device writes.",
    specialist: task.specialist === "none" ? "none" : "sample specialist completed and dissolved" };
}
