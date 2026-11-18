// TRUE CLOUD COMPUTING BY NATHAN TABOR: read-only, evidence-grounded warehouse twin.
const zones=[
{id:"hall-control",label:"Sovereign Control Hall",kind:"orchestration",systems:["nathan-ai-supercomputer-control","tabor-job-orchestrator","tabor-true-cloud-computing"]},
{id:"hall-compute",label:"Compute & GPU Hall",kind:"compute",systems:["tabor-compute-fleet","nathan-ai-sovereign-2x","nathan-tabor-supercomputer"]},
{id:"hall-storage",label:"Storage & Memory Hall",kind:"storage",systems:["tabor-database-atlas","D1 registry","R2 artifact vault (access unverified)"]},
{id:"hall-network",label:"Network Fabric Hall",kind:"network",systems:["tabor-infrastructure-gateway","tabor-bridge","tabor-world-hub"]},
{id:"hall-crypto",label:"Cryptocurrency & Mining Hall",kind:"crypto",systems:["tabor-crypto-infrastructure-server","tabor-coin-federation","tabor-corp-mining-hub","tabor-coin-agent-scheduler"]},
{id:"hall-power",label:"Power & Cooling Hall",kind:"simulation",systems:["power budget twin","thermal capacity twin","cooling failure scenarios"]},
{id:"hall-security",label:"Sovereign Security Hall",kind:"security",systems:["Box 0 Clearing Gate","Box 1 Compounding Engine","rotational-agent-mesh"]},
{id:"hall-observability",label:"Telemetry & Receipts Hall",kind:"observability",systems:["nathan-ai-telemetry-edge","supercomputer receipts","benchmark verification"]}
];
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"*"}});
async function count(db,table){const allowed=["tabor_infrastructure_nodes","tabor_compute_fleet","tabor_mining_coins","tabor_mining_hardware","tabor_mining_verification_receipts","tabor_compute_heartbeats"];if(!allowed.includes(table))throw Error("table not allowed");const row=await db.prepare("SELECT COUNT(*) AS count FROM "+table).first();return Number(row?.count??0)}
export default {async fetch(request,env){
 const url=new URL(request.url);if(request.method!=="GET")return json({error:"method_not_allowed"},405);
 if(url.pathname==="/health")return json({service:"tabor-virtual-warehouse",status:"deployed",mode:"software-defined-digital-twin",physical_compute_claim:false});
 if(url.pathname==="/api/halls")return json({warehouse:"TRUE CLOUD COMPUTING BY NATHAN TABOR",halls:zones,physical_racks:"not_verified",note:"Virtual halls are architectural groups, not provisioned physical buildings"});
 if(url.pathname==="/api/inventory"){
  if(!env.REGISTRY)return json({error:"d1_binding_unavailable"},503);
  try{const entries=await Promise.all(["tabor_infrastructure_nodes","tabor_compute_fleet","tabor_mining_coins","tabor_mining_hardware","tabor_mining_verification_receipts","tabor_compute_heartbeats"].map(async name=>({name,count:await count(env.REGISTRY,name)})));return json({source:"live Cloudflare D1",observed_at:new Date().toISOString(),entries,interpretation:"registry counts do not prove online physical devices, mining hashrate or earnings"})}
  catch{return json({error:"inventory_query_unavailable"},503)}
 }
 if(url.pathname==="/api/capacity-model"){
  const nodes=Number(url.searchParams.get("devices")||0),watts=Number(url.searchParams.get("watts_per_device")||0),hours=Number(url.searchParams.get("hours")||24),pue=Number(url.searchParams.get("pue")||1.3);
  if(![nodes,watts,hours,pue].every(Number.isFinite)||nodes<0||nodes>1000000||!Number.isInteger(nodes)||watts<0||watts>20000||hours<=0||hours>8760||pue<1||pue>3)return json({error:"invalid_capacity_model_parameters"},400);
  const itKw=nodes*watts/1000;return json({mode:"hypothetical_only",devices:nodes,it_kw:itKw,facility_kw:itKw*pue,facility_kwh:itKw*pue*hours,hours,pue,installed_devices_verified:false,usd_cost:"requires measured power tariff and actual device inventory"});
 }
 return json({service:"NATHAN AI Virtual Warehouse",endpoints:["/health","/api/halls","/api/inventory","/api/capacity-model"],no_public_write_api:true});
}};
