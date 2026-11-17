export const bees = Object.freeze(Object.fromEntries([
  ["queen", "Queen Bee", "Hive routing, priority and permissions"],
  ["library", "Library Bee", "LC cartridges, class metadata and reference integrity"],
  ["physics", "Physics Bee", "Track Baller orientation, fields, trajectory and Universal Bridge state"],
  ["memory", "Memory Bee", "Z-101 personal memory and owner consent"],
  ["curriculum", "Curriculum Bee", "Learning sequences, hints and adaptive difficulty"],
  ["provenance", "Provenance Bee", "Source, version and integrity"],
  ["index", "Index Bee", "Discovery, search and cross-class links"],
  ["economy", "Economy Bee", "Generosity-First rewards and bridge buffs"],
  ["shadow", "Shadow Bee", "Authorship, contradictory state and boundary reports"],
  ["replication", "Replication Bee", "Temporary specialist and work-group lifecycle"],
  ["hardware", "Hardware Bee", "Silicon, boards, power, thermal, GPIO, I²C, SPI, UART and PCIe"],
  ["firmware", "Firmware Bee", "Bootloaders, UEFI/BIOS, device trees, real-time controllers and FPGA"],
  ["os", "OS Bee", "Kernels, drivers, process isolation, scheduling, memory and containers"],
  ["network", "Network Bee", "Protocols, routing, local-first links, mesh, satellite and trust boundaries"],
  ["security", "Security Bee", "Keys, attestation, enclaves, defensive integrity and access boundaries"],
  ["sensor", "Sensor Bee", "Touch, gyro, camera, IMU, environmental, biometric and radio observations"],
  ["actuator", "Actuator Bee", "Displays, audio, LEDs, haptics, motors and robotic effectors"],
  ["storage", "Storage Bee", "Encrypted, versioned local and distributed data"],
  ["compute", "Compute Bee", "CPU, GPU, NPU, edge execution and model allocation"],
  ["interface", "Interface Bee", "Dual-Screen, Track Baller, external display and headset surfaces"],
  ["integration", "Integration Bee", "Owner-authorized external hardware and software adapters"],
].map(([id, name, domain], index) => [id, Object.freeze({id, name, domain, technology: index >= 10})])));

export const voices = Object.freeze({
  nathan: Object.freeze({name: "Nathan AI 🚀", role: "Coach / Clutch Rival / Direct Interface"}),
  pk: Object.freeze({name: "PK", role: "Chaos Wild Card / Stress Tester"}),
  curator: Object.freeze({name: "Grape-Apple Curator", role: "Subject Master / Provenance Keeper"}),
});

export const priorities = Object.freeze({critical: 0, high: 1, normal: 2, background: 3});
export const prioritiesByType = Object.freeze({
  "boundary.report": "critical", "device.status": "high", "module.open": "normal",
  "module.complete": "normal", "interaction.summary": "normal", "bridge.clear": "normal",
  "worker.heartbeat": "background", "worker.request": "normal",
});
export const deviceDomains = Object.freeze(Object.values(bees).filter(bee => bee.technology).map(bee => bee.id));
