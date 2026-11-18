export const termsPerShard = 4096;
export const scale = 10;

export const systems = [
  ["nathan-tabor-supercomputer", "Nathan Tabor Supercomputer"],
  ["nathan-tabor-supercomputer-2x", "Nathan Tabor Supercomputer 2×"],
  ["tabor-super-heroine-computer", "Hyperbolic Symbiotic Quantum Physics Super Heroine Computer"],
  ["tabor-supercomputer-federation", "Tabor Supercomputer Federation"],
  ["nathan-tabor-hyper-federation", "Hyper Supercomputer Federation"],
  ["tabor-supercomputer-registry", "Tabor Supercomputer Registry"],
  ["tabor-compute-fleet", "Tabor Compute Fleet"],
  ["nathan-ai-supercomputer-control", "Nathan AI Supercomputer Control"],
  ["nathan-sovereign-fp64-fabric", "Sovereign FP64 Fabric"],
  ["nathan-sovereign-fp64-executor", "Sovereign FP64 Executor"]
].map(([id, name]) => ({ id, name }));

export const architecture = [
  { layer: "Distributed memory and compute", digital: "One private executor service with one or ten independent invocations, each using local Float64Array buffers. Coordinator gathers and checks the partial results.", mode: "running" },
  { layer: "Shared memory and persistence", digital: "Coordinator reduces over shard replies. Each invocation keeps its own memory. Existing Durable Objects remain the federation's separate persistent state layer.", mode: "running" },
  { layer: "Accelerators and memory fabric", digital: "HBM3e/HBM4, DDR5 ECC, MRDIMM, LPDDR5X, on-chip SRAM, CXL, persistent memory, ASICs, FPGAs, GPUs, and quantum research map to roles in the design. This portable kernel uses Worker CPU and typed arrays.", mode: "architecture mapping" },
  { layer: "Hot, warm, cold and archive storage", digital: "Local arrays act as hot scratch. R2 Standard holds the canonical checkpoint and R2 Infrequent Access holds a gzip copy used in an integrity-checked restore. Separate D1 copies support an alternate restore exercise. NVMe scratch, Lustre, enterprise HDD lakes, tape and offline archives describe distinct physical tiers.", mode: "running with a reference fixture" },
  { layer: "Ingestion and interconnect", digital: "The coordinator creates fixed synthetic inputs and dispatches over a Cloudflare Service Binding. Physical InfiniBand, Slingshot and optical fabric have separate timing and bandwidth characteristics.", mode: "running" },
  { layer: "Fault tolerance and operations", digital: "Closed-form replay checks every shard. A three-copy synthetic bit-flip exercise demonstrates majority voting. CPU and subrequest limits bound demand. Facility power, UPS, coolant and water are modeled capacity inputs at the existing federation.", mode: "running and modeled" },
  { layer: "Mission workloads", digital: "FP64 verification and integer fault tests run on synthetic inputs. CFD, climate, orbit and astrophysics are scientific plug-in categories. Defensive integrity analysis runs over supplied or synthetic records.", mode: "running and design slots" }
];

export const fixture = JSON.stringify({
  fixture: "nathan-tabor-digital-hpc-v1",
  kernel: "fp64-dot-closed-form-v1",
  termsPerShard,
  baselineShards: 1,
  expandedShards: scale
});

export function computeShard(index) {
  if (!Number.isInteger(index) || index < 0 || index >= scale) throw new RangeError("Invalid shard index");
  const a = new Float64Array(termsPerShard);
  const b = new Float64Array(termsPerShard);
  for (let i = 0; i < termsPerShard; i++) {
    a[i] = i + 1;
    b[i] = i + 1 + 2 * index;
  }
  let sum = 0;
  for (let i = 0; i < termsPerShard; i++) sum += a[i] * b[i];
  return { index, terms: termsPerShard, sum };
}

export function expectedSum(index) {
  const n = termsPerShard;
  return n * (n + 1) * (2 * n + 1) / 6 + index * n * (n + 1);
}

export async function digest(text) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), (n) => n.toString(16).padStart(2, "0")).join("");
}

export function vote() {
  const intact = 0x17a60b51;
  const replicas = Uint32Array.of(intact, intact ^ 8, intact);
  const [a, b, c] = replicas;
  const recovered = ((a & b) | (a & c) | (b & c)) >>> 0;
  return { replicas: Array.from(replicas), recovered, verified: recovered === intact, injectedBitFlips: 1 };
}
