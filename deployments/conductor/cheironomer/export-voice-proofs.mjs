const repository="NathanAIoxr/Nathan-AI-Sovereign-Core";
const vault="https://unified-operations-cockpit.nathantaboract.workers.dev/tabor-sites/conductor/cheironomer/internal/voice-proofs";
const contents="https://api.github.com/repos/"+repository+"/contents/deployments/conductor/cheironomer/voice-proofs.json";
const {GITHUB_TOKEN,ACTIONS_ID_TOKEN_REQUEST_TOKEN,ACTIONS_ID_TOKEN_REQUEST_URL,GITHUB_REPOSITORY,GITHUB_REF}=process.env;
if(GITHUB_REPOSITORY!==repository||GITHUB_REF!=="refs/heads/main"||!GITHUB_TOKEN||!ACTIONS_ID_TOKEN_REQUEST_TOKEN||!ACTIONS_ID_TOKEN_REQUEST_URL)throw Error("Expected the repository's main-branch GitHub Actions identity");
const oidc=new URL(ACTIONS_ID_TOKEN_REQUEST_URL);
if(oidc.protocol!=="https:"||!oidc.hostname.endsWith(".actions.githubusercontent.com"))throw Error("Unexpected OIDC issuer URL");
oidc.searchParams.set("audience",vault);
const fetchBound=(url,options={})=>fetch(url,{...options,redirect:"error",signal:AbortSignal.timeout(20000)});
async function read(response){
  if(!response.ok)throw Error("HTTP "+response.status+" from "+new URL(response.url).hostname);
  return response.json();
}
const {value}=await read(await fetchBound(oidc,{headers:{Authorization:"Bearer "+ACTIONS_ID_TOKEN_REQUEST_TOKEN}}));
const {voiceEvidence}=await read(await fetchBound(vault,{headers:{Authorization:"Bearer "+value}}));
if(!Array.isArray(voiceEvidence)||voiceEvidence.length>1000||voiceEvidence.some(row=>
  !/^[0-9a-f-]{36}$/.test(row.event_id)||!/^[a-f0-9]{64}$/.test(row.source_hash)||!Number.isFinite(Date.parse(row.created_at))))throw Error("Malformed voice proof response");
const evidence=voiceEvidence.map(({event_id,source_hash,created_at})=>({event_id,source_hash,created_at}));
if(!evidence.length){console.log("No approved voice proofs to publish.");process.exit(0);}
const payload=Buffer.from(JSON.stringify({voiceEvidence:evidence},null,2)+"\n").toString("base64");
const headers={Authorization:"Bearer "+GITHUB_TOKEN,Accept:"application/vnd.github+json","Content-Type":"application/json","X-GitHub-Api-Version":"2022-11-28"};
const previous=await fetchBound(contents+"?ref=main",{headers});
const existing=previous.status===404?null:await read(previous);
if(existing?.content?.replace(/\s/g,"")===payload){console.log("Voice proofs already current.");process.exit(0);}
const result=await read(await fetchBound(contents,{method:"PUT",headers,body:JSON.stringify({
  branch:"main",message:"Publish approved Cheironomer voice proof digests",content:payload,...(existing?{sha:existing.sha}:{})
})}));
console.log(JSON.stringify({published:evidence.length,commit:result.commit.sha}));
