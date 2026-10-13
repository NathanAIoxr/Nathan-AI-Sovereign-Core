/* Run: node app-factory/pricing-router/build-manifests.cjs [path/to/manifests.json]
 * Emits proposed plans to stdout. Never deploys prices or processes purchases. */
"use strict";
const fs=require("node:fs");
const path=require("node:path");
const router=require("./engine.js");
function compileManifests(input,policy,catalog){
  if(!input||input.schemaVersion!==1||!Array.isArray(input.apps))throw Error("Expected manifest schemaVersion 1 and apps array");
  if(input.apps.length>10000)throw Error("Too many apps in one batch");
  const ids=new Set(),plans=[];
  for(const app of input.apps){
    const normalized=router.normalize(app);
    if(ids.has(normalized.id))throw Error("Duplicate app ID: "+normalized.id);
    ids.add(normalized.id);
    plans.push(router.compile(normalized,policy,catalog));
  }
  return {schemaVersion:1,mode:"PREVIEW_ONLY",generatedBy:"T123-PRICING-ROUTER-001",
    pricingPolicyVersion:policy.version,catalogVersion:catalog.version,applicationCount:plans.length,plans};
}
function loadJSON(file){return JSON.parse(fs.readFileSync(file,"utf8"))}
if(require.main===module){
  try{
    const base=__dirname;
    const manifestPath=process.argv[2]||path.join(base,"manifests.example.json");
    const compiled=compileManifests(
      loadJSON(manifestPath),loadJSON(path.join(base,"policy.json")),
      loadJSON(path.join(base,"catalog.json")));
    process.stdout.write(JSON.stringify(compiled,null,2)+"\n");
  }catch(error){process.stderr.write("Factory manifest error: "+error.message+"\n");process.exitCode=1}
}
module.exports={compileManifests};
