/**
 * Nathan AI Global Infrastructure Atlas — public, read-only architectural seed.
 * Reference components are NOT deployed nodes or proof of network presence.
 * No external network discovery, scanning or third-party execution.
 * Full 871-component research snapshot exists as a separate offline source export.
 */
export const SNAPSHOT = "2026-11-18";
export const LAYERS = [
  {
    "id": "L00",
    "name": "Physical networks and facilities",
    "examples": [
      "subsea fiber",
      "terrestrial fiber",
      "IXP",
      "carrier hotel",
      "colocation facility",
      "network PoP",
      "satellite gateway",
      "electric grid",
      "landing station",
      "DE-CIX",
      "LINX",
      "Equinix",
      "TeleGeography"
    ]
  },
  {
    "id": "L01",
    "name": "Silicon firmware and pre-OS rings",
    "examples": [
      "UEFI",
      "coreboot",
      "TianoCore EDK II",
      "OpenBMC",
      "Redfish",
      "IPMI",
      "Intel Management Engine",
      "AMD Platform Security Processor",
      "Arm Trusted Firmware",
      "NVIDIA BlueField DPU",
      "SmartNIC",
      "PCIe",
      "SPI",
      "TPM 2.0"
    ]
  },
  {
    "id": "L02",
    "name": "Routing and transport",
    "examples": [
      "Autonomous System",
      "BGP",
      "OSPF",
      "IS-IS",
      "RPKI",
      "Anycast",
      "IPv4",
      "IPv6",
      "TCP",
      "UDP",
      "QUIC",
      "HTTP/3",
      "RIPE RIS",
      "CAIDA AS Rank",
      "RFC 4271",
      "FRRouting",
      "BIRD"
    ]
  },
  {
    "id": "L03",
    "name": "DNS PKI naming and trust",
    "examples": [
      "IANA DNS root",
      "Root Server System",
      "recursive DNS",
      "BIND 9",
      "Unbound",
      "CoreDNS",
      "PowerDNS",
      "DNSSEC",
      "DoH",
      "DoT",
      "ACME",
      "Let's Encrypt",
      "Certificate Transparency",
      "OpenSSL",
      "step-ca",
      "SPIFFE",
      "SPIRE",
      "mTLS"
    ]
  },
  {
    "id": "L04",
    "name": "Host operating systems and kernels",
    "examples": [
      "Linux kernel",
      "FreeBSD",
      "OpenBSD",
      "NetBSD",
      "Windows NT kernel",
      "macOS XNU",
      "seL4",
      "Zephyr",
      "RT-Thread",
      "Redox OS",
      "ReactOS",
      "Cilium eBPF",
      "gVisor syscall sandbox"
    ]
  },
  {
    "id": "L05",
    "name": "Runtimes hypervisors and sandboxes",
    "examples": [
      "KVM",
      "QEMU",
      "Firecracker",
      "Cloud Hypervisor",
      "Kata Containers",
      "Docker",
      "containerd",
      "CRI-O",
      "runc",
      "Wasmtime",
      "Wasmer",
      "WasmEdge",
      "WASI",
      "V8",
      "workerd",
      "Deno",
      "Node.js",
      "Python",
      "IPython",
      "Jupyter Xeus",
      "IRkernel",
      "IJulia"
    ]
  },
  {
    "id": "L06",
    "name": "Edge Workers and serverless",
    "examples": [
      "Cloudflare Workers",
      "Cloudflare Durable Objects",
      "Cloudflare Workers AI",
      "Cloudflare Workflows",
      "Cloudflare Queues",
      "Cloudflare Pages",
      "Fastly Compute",
      "Akamai EdgeWorkers",
      "AWS Lambda",
      "AWS Lambda@Edge",
      "Deno Deploy",
      "Vercel Edge Functions",
      "Azure Functions",
      "Google Cloud Run",
      "OpenFaaS",
      "Knative",
      "Hono"
    ]
  },
  {
    "id": "L07",
    "name": "Orchestration scheduling and distributed execution",
    "examples": [
      "Kubernetes",
      "kubelet",
      "KubeEdge",
      "KubeRay",
      "Ray",
      "Slurm",
      "Apache Spark",
      "Apache Flink",
      "Apache Airflow",
      "Temporal",
      "Prefect",
      "Argo Workflows",
      "GitHub Actions",
      "n8n",
      "Conductor",
      "Dapr",
      "Windmill",
      "Inngest",
      "Celery",
      "BullMQ",
      "Sidekiq",
      "Quartz"
    ]
  },
  {
    "id": "L08",
    "name": "Storage persistence consensus and AI memory",
    "examples": [
      "etcd",
      "Consul",
      "ZooKeeper",
      "FoundationDB",
      "CockroachDB",
      "TiKV",
      "Cloudflare D1",
      "Cloudflare Workers KV",
      "Cloudflare R2",
      "PostgreSQL",
      "SQLite",
      "Redis",
      "RocksDB",
      "Milvus",
      "Qdrant",
      "Weaviate",
      "Neo4j",
      "Chroma",
      "Apache Cassandra",
      "Ceph",
      "Raft",
      "Paxos"
    ]
  },
  {
    "id": "L09",
    "name": "Message buses and event streams",
    "examples": [
      "Apache Kafka",
      "Redpanda",
      "NATS",
      "RabbitMQ",
      "Redis Streams",
      "Cloudflare Queues",
      "Apache Pulsar",
      "Apache ActiveMQ",
      "Mosquitto",
      "MQTT",
      "AMQP",
      "gRPC",
      "NATS JetStream",
      "Apache RocketMQ",
      "Azure Service Bus",
      "AWS SQS",
      "Google Pub/Sub"
    ]
  },
  {
    "id": "L10",
    "name": "AI inference GPU nodes and compute kernels",
    "examples": [
      "NVIDIA CUDA",
      "AMD ROCm",
      "Intel oneAPI",
      "Triton",
      "PyTorch",
      "TensorFlow",
      "ONNX Runtime",
      "OpenVINO",
      "vLLM",
      "llama.cpp",
      "Ollama",
      "Ray Serve",
      "TensorRT-LLM",
      "TGI",
      "LMDeploy",
      "ComfyUI",
      "OpenLLM",
      "BentoML",
      "KubeRay"
    ]
  },
  {
    "id": "L11",
    "name": "Agents bots MCP tools and orchestration",
    "examples": [
      "LangGraph",
      "LangChain",
      "CrewAI",
      "AutoGen",
      "PydanticAI",
      "Google ADK",
      "OpenAI Agents SDK",
      "Mastra",
      "Vercel AI SDK",
      "ElizaOS",
      "Rig",
      "LangChainGo",
      "Haystack",
      "AgentScope",
      "MCP Registry",
      "MCP Python SDK",
      "GitHub MCP Server",
      "Cloudflare Agents SDK",
      "OpenAPI",
      "GraphQL",
      "JSON-RPC",
      "A2A Protocol"
    ]
  },
  {
    "id": "L12",
    "name": "Crawlers browser automation and chat bots",
    "examples": [
      "Googlebot",
      "Bingbot",
      "Applebot",
      "YandexBot",
      "DuckDuckBot",
      "GPTBot",
      "OAI-SearchBot",
      "ClaudeBot",
      "CCBot",
      "Playwright",
      "Puppeteer",
      "Selenium",
      "Browserless",
      "aiogram",
      "Telegraf",
      "Rasa",
      "Discord.py",
      "TwitchIO",
      "BotMan",
      "Robot Framework"
    ]
  },
  {
    "id": "L13",
    "name": "IoT embedded robotics and realtime",
    "examples": [
      "FreeRTOS",
      "Zephyr",
      "ThreadX",
      "RT-Thread",
      "Contiki-NG",
      "RIOT OS",
      "ESP-IDF",
      "MicroPython",
      "ROS 2",
      "ROS Navigation2",
      "Micro-ROS",
      "Fast DDS",
      "MQTT",
      "CoAP",
      "LoRaWAN",
      "Matter",
      "Thread",
      "BLE",
      "Zigbee",
      "OPC UA",
      "CAN bus"
    ]
  },
  {
    "id": "L14",
    "name": "Decentralized P2P blockchain federation",
    "examples": [
      "IPFS Kubo",
      "libp2p",
      "Filecoin",
      "BitTorrent DHT",
      "Kademlia",
      "Bittensor",
      "Render Network",
      "Bitcoin Core",
      "Ethereum Geth",
      "Ethereum Reth",
      "Nethermind",
      "Solana",
      "Matrix",
      "ActivityPub",
      "AT Protocol",
      "Tor",
      "Hyperledger Fabric"
    ]
  },
  {
    "id": "L15",
    "name": "Observability security and software supply chain",
    "examples": [
      "OpenTelemetry",
      "Prometheus",
      "Grafana",
      "Vector",
      "Falco",
      "Pixie",
      "Cilium",
      "Envoy",
      "NGINX",
      "Cloudflare WAF",
      "Cloudflare DDoS Protection",
      "Cloudflare Zero Trust",
      "Open Policy Agent",
      "Trivy",
      "Sigstore",
      "Cosign",
      "SBOM",
      "OSV vulnerability database",
      "eBPF",
      "XDP"
    ]
  },
  {
    "id": "L16",
    "name": "Registries discovery and public measurement",
    "examples": [
      "IANA",
      "NRO",
      "RIPE NCC",
      "ARIN",
      "APNIC",
      "LACNIC",
      "AFRINIC",
      "PeeringDB",
      "CAIDA",
      "RouteViews",
      "RIPE RIS",
      "Root-Servers.org",
      "Certificate Transparency",
      "MCP Registry",
      "CNCF Landscape",
      "Artifact Hub",
      "ROS Index",
      "Hugging Face",
      "GitHub Topics",
      "NPM Registry",
      "PyPI",
      "crates.io",
      "Go packages"
    ]
  },
  {
    "id": "L17",
    "name": "Applications integration and federation",
    "examples": [
      "Cloudflare API",
      "GitHub REST API",
      "GitHub Actions",
      "OAuth 2.0",
      "OIDC",
      "MCP gateway",
      "Service bindings",
      "Webhooks",
      "REST APIs",
      "gRPC services",
      "Server-sent events",
      "WebSockets",
      "API Gateway",
      "OpenTelemetry OTLP",
      "ETL connectors",
      "Vectorize",
      "Cloudflare AI Gateway"
    ]
  }
];
export const SOURCES = [
  {
    "name": "IANA root",
    "url": "https://www.iana.org/domains/root/servers"
  },
  {
    "name": "NRO stats",
    "url": "https://www.nro.net/about/rirs/statistics/"
  },
  {
    "name": "RIPE RIS",
    "url": "https://www.ripe.net/analyse/internet-measurements/routing-information-service-ris/"
  },
  {
    "name": "CAIDA",
    "url": "https://asrank.caida.org/"
  },
  {
    "name": "PeeringDB",
    "url": "https://www.peeringdb.com/"
  },
  {
    "name": "Root servers",
    "url": "https://root-servers.org/"
  },
  {
    "name": "CNCF",
    "url": "https://landscape.cncf.io/"
  },
  {
    "name": "MCP",
    "url": "https://registry.modelcontextprotocol.io/"
  },
  {
    "name": "Artifact Hub",
    "url": "https://artifacthub.io/"
  },
  {
    "name": "ROS",
    "url": "https://index.ros.org/"
  },
  {
    "name": "Hugging Face",
    "url": "https://huggingface.co/"
  },
  {
    "name": "GitHub",
    "url": "https://github.com/topics/ai-agent"
  },
  {
    "name": "Cloudflare",
    "url": "https://developers.cloudflare.com/workers/"
  }
];
export const COMPONENTS = LAYERS.flatMap(layer=>layer.examples.map((name,index)=>({
 id:layer.id+"-C"+String(index+1).padStart(3,"0"),name,layer:layer.id,
 status:"public_reference_only",execution:"not_installed_by_atlas"
})));
export const EDGES = [
 {from:"L00",to:"L01",relation:"conceptual_dependency"},
 {from:"L01",to:"L02",relation:"conceptual_dependency"},
 {from:"L02",to:"L03",relation:"conceptual_dependency"},
 {from:"L03",to:"L04",relation:"conceptual_dependency"},
 {from:"L04",to:"L05",relation:"conceptual_dependency"},
 {from:"L05",to:"L06",relation:"conceptual_dependency"},
 {from:"L06",to:"L07",relation:"conceptual_dependency"},
 {from:"L07",to:"L08",relation:"conceptual_dependency"},
 {from:"L08",to:"L09",relation:"conceptual_dependency"},
 {from:"L09",to:"L10",relation:"conceptual_dependency"},
 {from:"L10",to:"L11",relation:"conceptual_dependency"},
 {from:"L11",to:"L12",relation:"conceptual_dependency"},
 {from:"L12",to:"L13",relation:"conceptual_dependency"},
 {from:"L13",to:"L14",relation:"conceptual_dependency"},
 {from:"L14",to:"L15",relation:"conceptual_dependency"},
 {from:"L15",to:"L16",relation:"conceptual_dependency"},
 {from:"L16",to:"L17",relation:"conceptual_dependency"}
,{from:"L03",to:"L11",relation:"service_discovery"},{from:"L08",to:"L11",relation:"agent_memory"},
{from:"L09",to:"L07",relation:"event_delivery"},{from:"L15",to:"L06",relation:"telemetry"},
{from:"L16",to:"L11",relation:"curated_discovery"}];
const headers={"Cache-Control":"public, max-age=300","X-Content-Type-Options":"nosniff",
 "Access-Control-Allow-Origin":"*"};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{...headers,"Content-Type":"application/json; charset=utf-8"}});
export default {
 async fetch(request){
  if(request.method!=="GET" && request.method!=="HEAD")return json({error:"read_only"},405);
  const url=new URL(request.url),path=url.pathname.replace(/\/+$/,"")||"/";
  let out;
  if(path==="/"||path==="/health") out={name:"Nathan AI Global Infrastructure Atlas",status:"reference_service_ready",snapshot:SNAPSHOT,
   layers:LAYERS.length,seed_components:COMPONENTS.length,typed_conceptual_edges:EDGES.length,
   scope:"public architectural index, not a live Internet census",
   deployed_nodes_from_seed:0, endpoints:["/api/layers","/api/components","/api/edges","/api/sources","/api/summary"]};
  else if(path==="/api/layers")out={layers:LAYERS.map(({id,name,examples})=>({id,name,seed_components:examples.length}))};
  else if(path==="/api/components"){
   const layer=url.searchParams.get("layer"),q=(url.searchParams.get("q")||"").trim().toLowerCase().slice(0,80);
   const limit=Math.min(100,Math.max(1,Number(url.searchParams.get("limit"))||50));
   const matches=COMPONENTS.filter(x=>(!layer||x.layer===layer)&&(!q||x.name.toLowerCase().includes(q)));
   out={count:matches.length,items:matches.slice(0,limit),truncated:matches.length>limit};
  }
  else if(path==="/api/edges")out={kind:"conceptual_only",edges:EDGES};
  else if(path==="/api/sources")out={sources:SOURCES};
  else if(path==="/api/summary")out={snapshot:SNAPSHOT,layers:LAYERS.length,seed_components:COMPONENTS.length,public_sources:SOURCES.length,
    status:"architectural_seed_only",notes:["871-component offline research atlas is separate","No imported code is run","No global host scans"]};
  else return json({error:"not_found"},404);
  if(request.method==="HEAD")return new Response(null,{headers});
  return json(out);
 }
};
