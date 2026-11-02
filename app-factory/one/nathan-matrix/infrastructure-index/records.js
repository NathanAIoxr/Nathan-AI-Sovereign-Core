/* Nathan AI 🚀 / ONE • Additive 21-system infrastructure index.
 * Author-supplied text retained verbatim in sourceFunction and sourceRule.
 * Editorial technology caveats are maintained separately in README.md.
 * Do not convert descriptions into deployment claims.
 */
(function (root) {
  "use strict";
  const categories = [
  {
    "id": "software",
    "number": 1,
    "title": "7 SOFTWARE ARCHITECTURES & PLATFORMS (THE LOGIC ENGINE)",
    "eyebrow": "💾"
  },
  {
    "id": "hardware",
    "number": 2,
    "title": "7 HARDWARE COMPONENT ARRAYS (THE PHYSICAL SUBSTRATE)",
    "eyebrow": "⚙️"
  },
  {
    "id": "connectivity",
    "number": 3,
    "title": "7 CONNECTIVITY & PROTOCOL INTERFACES (THE BRIDGEWAY)",
    "eyebrow": "🔌"
  }
];
  const records = [
  {
    "number": 1,
    "category": "software",
    "name": "Linux Kernel",
    "epithet": "The Core Foundation",
    "sourceFunction": "The open-source monolithic operating system kernel managing hardware resources, memory space, and CPU instructions.",
    "sourceRule": "Enforces strict process isolation and user privilege rings (Kernel space vs. User space) to secure cross-platform hardware deployments from mobile devices to global supercomputers."
  },
  {
    "number": 2,
    "category": "software",
    "name": "Kubernetes",
    "epithet": "The Orchestration Master",
    "sourceFunction": "An open-source container-orchestration platform designed to automate the deployment, scaling, and management of cloud-native applications.",
    "sourceRule": "Continuously tracks infrastructure status to match a declared configuration, automatically restarting or scaling virtual application clusters to maintain absolute uptime."
  },
  {
    "number": 3,
    "category": "software",
    "name": "Git",
    "epithet": "The Distributed Version Controller",
    "sourceFunction": "A decentralized file-tracking engine that allows thousands of programmers to modify a single codebase simultaneously without overwriting data.",
    "sourceRule": "Records file state changes as a cryptographic directed acyclic graph (DAG) of commits, guaranteeing a permanent, unalterable ledger of structural modifications."
  },
  {
    "number": 4,
    "category": "software",
    "name": "PostgreSQL",
    "epithet": "The Relational Matrix",
    "sourceFunction": "An enterprise-grade, open-source object-relational database management system designed to process complex data layers with absolute stability.",
    "sourceRule": "Enforces strict ACID (Atomicity, Consistency, Isolation, Durability) transactions, ensuring database operations either execute completely or roll back entirely to prevent data corruption."
  },
  {
    "number": 5,
    "category": "software",
    "name": "Docker",
    "epithet": "The Container Isolation Chamber",
    "sourceFunction": "A software platform that packages application code along with its exact operating system dependencies into a single lightweight virtual container.",
    "sourceRule": "Utilizes native operating system isolation features (namespaces and cgroups) to ensure software runs identically on any physical infrastructure without configuration drift."
  },
  {
    "number": 6,
    "category": "software",
    "name": "React Native",
    "epithet": "The Cross-Platform Vector",
    "sourceFunction": "An open-source mobile application framework created by Meta to render native iOS and Android user interfaces using a single JavaScript codebase.",
    "sourceRule": "Bridges high-level scripting directly to platform-specific UI threads, transforming layout blueprints into native user interface components in real-time."
  },
  {
    "number": 7,
    "category": "software",
    "name": "Apache Kafka",
    "epithet": "The Real-Time Event Stream",
    "sourceFunction": "A distributed event-streaming platform designed to ingest, process, and route massive pipelines of live data logs instantly.",
    "sourceRule": "Organizes data packets into immutable, partitioned append-only logs distributed across storage arrays, allowing multiple systems to consume data streams simultaneously without performance lag."
  },
  {
    "number": 8,
    "category": "hardware",
    "name": "Graphical Processing Unit / GPU",
    "epithet": "The Parallel Matrix",
    "sourceFunction": "A specialized hardware processor containing thousands of micro-cores engineered to execute mathematical operations simultaneously.",
    "sourceRule": "Maximizes high-bandwidth memory access to compute dense matrix multiplication arrays, acting as the primary computation engine for modern artificial intelligence models and high-fidelity 3D graphics."
  },
  {
    "number": 9,
    "category": "hardware",
    "name": "Solid-State Drive / NVMe SSD",
    "epithet": "The Non-Volatile Silicon Store",
    "sourceFunction": "High-speed flash storage systems designed to retain digital memory patterns permanently without relying on moving mechanical parts.",
    "sourceRule": "Interfaces directly with the system's high-speed motherboard communication lanes (PCIe), eliminating physical read-head mechanical latency to deliver gigabyte-per-second data transfers."
  },
  {
    "number": 10,
    "category": "hardware",
    "name": "Application-Specific Integrated Circuit / ASIC",
    "epithet": "The Hardcoded Processor",
    "sourceFunction": "A microchip customized and permanently etched to perform a single, specific mathematical calculation with maximum possible power efficiency.",
    "sourceRule": "Bypasses general-purpose instruction cycles entirely to lock execution logic directly into hardware silicon, providing unmatched computational speed for crypto mining and network routing."
  },
  {
    "number": 11,
    "category": "hardware",
    "name": "Tensor Processing Unit / TPU",
    "epithet": "The AI Accelerator",
    "sourceFunction": "Google's proprietary application-specific integrated circuit custom-built to accelerate deep learning and machine learning neural networks.",
    "sourceRule": "Employs a systolic array hardware architecture to flow data directly through calculation cells without constantly reading and writing to a central register, minimizing power draw."
  },
  {
    "number": 12,
    "category": "hardware",
    "name": "Field-Programmable Gate Array / FPGA",
    "epithet": "The Mutable Hardware Chameleons",
    "sourceFunction": "An integrated circuit designed to be configured and rewired by a customer or designer after manufacturing.",
    "sourceRule": "Utilizes arrays of programmable logic blocks and interconnects, allowing engineers to physically restructure the chip's hardware circuitry via code to adapt to new technology standards."
  },
  {
    "number": 13,
    "category": "hardware",
    "name": "RISC-V Architecture",
    "epithet": "The Open Instruction Matrix",
    "sourceFunction": "An open-source hardware instruction set architecture (ISA) based on established reduced instruction set computer principles.",
    "sourceRule": "Eliminates proprietary licensing barriers by offering a modular, royalty-free blueprint for computing chips, allowing developers to design custom silicon extensions for specialized devices."
  },
  {
    "number": 14,
    "category": "hardware",
    "name": "Quantum Processing Unit / QPU",
    "epithet": "The Subatomic Supercomputer",
    "sourceFunction": "A specialized physical computing processor designed to harness quantum mechanical phenomena to execute complex computational simulations.",
    "sourceRule": "Manipulates subatomic particles as quantum bits (qubits) existing in simultaneous states (superposition) and linked profiles (entanglement) to solve specific multi-variable mathematical algorithms that overwhelm classical binary chips."
  },
  {
    "number": 15,
    "category": "connectivity",
    "name": "PCIe 5.0 / 6.0 Bus",
    "epithet": "The Internal Superhighway",
    "sourceFunction": "The high-speed motherboard expansion bus standard utilized to link graphics cards, high-velocity network chips, and solid-state storage arrays to the main CPU.",
    "sourceRule": "Operates via dedicated point-to-point serial communication links (lanes), doubling data throughput with each subsequent generation to maintain maximum hardware synchronization."
  },
  {
    "number": 16,
    "category": "connectivity",
    "name": "Thunderbolt 4 / 5",
    "epithet": "The Multi-Protocol Conductor",
    "sourceFunction": "A hardware interface standard that consolidates high-speed data transmission, dynamic video output signals, and high-wattage power delivery into a single USB Type-C physical port.",
    "sourceRule": "Allocates internal bandwidth dynamically across concurrent connections, ensuring high-resolution external display feeds do not choke storage drive read/write access."
  },
  {
    "number": 17,
    "category": "connectivity",
    "name": "Wi-Fi 7 / 802.11be",
    "epithet": "The Ultra-Wide Spectrum",
    "sourceFunction": "The high-velocity wireless local networking standard designed to process massive local data throughput with near-zero connection delay.",
    "sourceRule": "Leverages ultra-wide 320 MHz signal channels and Multi-Link Operation (MLO) to transmit data packets simultaneously across different radio frequencies (2.4 GHz, 5 GHz, 6 GHz), bypassing signal interference."
  },
  {
    "number": 18,
    "category": "connectivity",
    "name": "5G Advanced / 6G Cellular",
    "epithet": "The Macro-Grid Vector",
    "sourceFunction": "High-speed cellular network infrastructures designed to connect millions of mobile devices, autonomous vehicles, and remote sensors to core internet pipelines.",
    "sourceRule": "Employs millimeter-wave (mmWave) spectrum configurations and massive multi-input multi-output (MIMO) antenna arrays to beam high-density, targeted data streams directly to moving devices."
  },
  {
    "number": 19,
    "category": "connectivity",
    "name": "USB4 Version 2.0",
    "epithet": "The Global Universal Serial Link",
    "sourceFunction": "An open hardware interface specification providing up to 80Gbps of symmetrical or asymmetrical data transmission over standard USB-C cables.",
    "sourceRule": "Utilizes advanced PAM3 signal encoding to double data packet frequency across existing wiring configurations without requiring hardware redesigns of the physical connector ports."
  },
  {
    "number": 20,
    "category": "connectivity",
    "name": "Optical Interconnects",
    "epithet": "The Photonic Data Bridge",
    "sourceFunction": "&#x53;erver rack and system-level communication links that replace traditional metal copper wires with microscopic fiber-optic wave-guides.",
    "sourceRule": "Converts electrical data signals directly into laser light pulses, eliminating thermal build-up and physical resistance to link high-density AI data centers over longer physical distances."
  },
  {
    "number": 21,
    "category": "connectivity",
    "name": "eSIM Architecture",
    "epithet": "The Virtual Subscriber Profile",
    "sourceFunction": "A tiny, hardware-integrated microchip embedded directly onto device motherboards that replaces physical, removable plastic SIM cards.",
    "sourceRule": "Downloads, encrypts, and stores multiple network operator profiles securely via over-the-air cellular networks, allowing instant carrier switching without physical hardware swaps."
  }
];
  const data = Object.freeze({
    id: "NATHAN-INFRASTRUCTURE-21",
    version: "2026-11-02",
    ancestor: "NATHAN AI 🚀 → TABOR ROOT → TABOR 1-2-3 FACTORY → ONE",
    counts: Object.freeze({ software: 7, hardware: 7, connectivity: 7 }),
    categories: Object.freeze(categories),
    records: Object.freeze(records.map(x => Object.freeze(x)))
  });
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  root.NathanInfrastructureIndex = data;
})(typeof globalThis !== "undefined" ? globalThis : this);
