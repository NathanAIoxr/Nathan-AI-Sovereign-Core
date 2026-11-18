export const steps = [
  { name: "CLEAR", clock: 3, equation: "1−1=0", box: "Sovereign Box 0" },
  { name: "BUILD", clock: 12, equation: "1+1=2", box: "Sovereign Box 1" },
  { name: "INTEGRATE", clock: 6, equation: "1×1=1" },
  { name: "VERIFY", clock: 9, equation: "1÷1=1" }
];

export const anchors = [
  { title: "The Physical Atoms (Earth, Light, and Power)", detail: "Silicon and other semiconductors, metals, glass, electricity, and cooling form the physical plant. Radio carries wireless signals and optical fiber carries light. Power delivery and heat removal set limits for devices and racks.", layers: ["08", "09", "10", "17"] },
  { title: "Switching and State", detail: "Compute units update state. Registers, cache, memory, and storage preserve it at different speeds and scales. Clock and reset domains define when state can change.", layers: ["01", "02", "03", "07"] },
  { title: "Movement and Timing", detail: "Data moves between dies, across racks, and through networks. A timing interface defines when a transfer starts, how receivers recognize it, and when a system retries or reports a fault.", layers: ["04", "05", "06", "11"] },
  { title: "Software and Coordination", detail: "Compilers and runtimes dispatch work. Sovereign Boxes, applications, and the cloud control plane apply policy and coordinate execution. Evidence comes from testing the result at the layer where it runs.", layers: ["12", "13", "14", "15", "16", "18"] }
];

const mod = (a, b) => ((a % b) + b) % b;
function matchesRhythm(year, rhythm) {
  const phases = [13, 17].map(cycle => mod(year - 2024, cycle));
  return rhythm?.year === year && rhythm.recurrenceYears === 221
    && rhythm.shared === phases.every(phase => phase === 0)
    && rhythm.sharedAtOrBefore === year - mod(year - 2024, 221)
    && rhythm.nextSharedYear === year - mod(year - 2024, 221) + 221
    && rhythm.broods?.length === 2
    && rhythm.broods.every((brood, i) => brood.name === ["Brood XIX", "Brood XIII"][i]
      && brood.cycleYears === [13, 17][i] && brood.phase === phases[i] && brood.scheduled === (phases[i] === 0));
}

export function scheduleTicks(clockHz, bpm, pulses) {
  const numerator = 60n * BigInt(clockHz);
  const denominator = BigInt(bpm);
  return Array.from({ length: pulses }, (_, i) => {
    const ideal = BigInt(i + 1) * numerator;
    const edge = ideal / denominator;
    const previousEdge = (ideal - numerator) / denominator;
    return {
      pulse: i + 1,
      ticksSincePrevious: Number(edge - previousEdge),
      elapsedTicks: Number(edge),
      errorNumerator: Number(edge * denominator - ideal)
    };
  });
}

export function runTiming({ year, clockHz, bpm }, rhythm, catalog, computer, cloud) {
  const safeInput = [year, clockHz, bpm].every(Number.isInteger)
    && Math.abs(year) <= 10000 && clockHz >= 5 && clockHz <= 1000000000 && bpm >= 20 && bpm <= 300;
  if (!safeInput) throw new RangeError("Use a year from −10000 to 10000, 20–300 BPM, and a whole clock rate from 5 Hz to 1 GHz.");
  const pulseCount = catalog?.pulseCount;
  const sourceIsValid = matchesRhythm(year, rhythm) && catalog?.ok === true
    && catalog.project === "THE RHYTHM MATRIX" && Number.isInteger(pulseCount) && pulseCount >= 1 && pulseCount <= 300
    && Number.isInteger(catalog.historyRecords) && catalog.historyRecords >= 1
    && computer?.ok === true && computer.redundancyFixture?.fields === 78 && computer.redundancyFixture.restored === true
    && cloud?.name === "TRUE CLOUD COMPUTING BY NATHAN TABOR" && cloud.state === "edge-online";
  if (!sourceIsValid) throw new Error("A source response did not match its published verification contract.");

  const edges = scheduleTicks(clockHz, bpm, pulseCount);
  const last = edges.at(-1);
  const totalTicks = edges.reduce((sum, pulse) => sum + pulse.ticksSincePrevious, 0);
  const timingVerified = edges.every(pulse => pulse.ticksSincePrevious > 0
    && pulse.errorNumerator <= 0 && pulse.errorNumerator > -bpm) && totalTicks === last.elapsedTicks;
  return {
    ok: timingVerified,
    evidence: "Live software integration and reference timer model",
    inputs: { year, clockHz, bpm },
    steps: [
      { ...steps[0], result: "Input ranges and live source responses validated" },
      { ...steps[1], result: "Generated one tick interval per Rhythm Matrix score pulse" },
      { ...steps[2], result: "Attached cicada phases, the 2X+ fixture and True Cloud health" },
      { ...steps[3], result: timingVerified ? "Cicada phases replayed and every edge within one clock tick" : "Tick verification failed" }
    ],
    rhythm: {
      broods: rhythm.broods.map(({ name, cycleYears, phase, scheduled }) => ({ name, cycleYears, phase, scheduled })),
      shared: rhythm.shared,
      recurrenceYears: rhythm.recurrenceYears,
      nextSharedYear: rhythm.nextSharedYear,
      atlasRecords: catalog.historyRecords,
      pulseCount,
      revision: /^[a-f0-9]{40}$/.test(catalog.revision ?? "") ? catalog.revision : null
    },
    computer: { fields: computer.redundancyFixture.fields, restored: true, hplMeasurement: null },
    cloud: { version: typeof cloud.version === "string" && /^[0-9.]{1,25}$/.test(cloud.version) ? cloud.version : null, state: cloud.state },
    timer: {
      period: { numerator: clockHz * 60, denominator: bpm, unit: "ticks" },
      errorUnit: "1/bpm tick",
      totalTicks,
      edges
    }
  };
}
