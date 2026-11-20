import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { digest, isWarrant, neila, rehearsal, reverseScore } from "./model.mjs";

const repository = "NathanAIoxr/Nathan-AI-Sovereign-Core";
const branch = "zone/tweezer-tap-os";
const commitPattern = /^[0-9a-f]{40}$/;
const project = new URL("../", import.meta.url);
const read = (name) => readFileSync(new URL(name,project),"utf8");
const manifest = JSON.parse(read("app.json"));

export async function releaseMeasures(release,checks) {
  const origin = 0;
  const score = rehearsal(origin);
  const expected = reverseScore(score);
  let prior = await digest(score);
  const chain = [];
  for (const [index,[title,passed]] of checks.entries()) {
    const step = {measure:61+index,title,passed:Boolean(passed),release,prior};
    const sha = await digest(step);
    chain.push({...step,sha});
    prior = sha;
  }
  let cursor = prior;
  const reverse = [];
  for (const {sha,...step} of [...chain].reverse()) {
    const passed = step.passed && cursor === sha && await digest(step) === sha;
    reverse.push({measure:step.measure,passed});
    cursor = step.prior;
  }
  return {
    passed: chain.length === 12 && cursor === await digest(score) && expected.passed &&
      reverse.every((step,index)=>step.passed && step.measure===72-index),
    forward:chain,reverse:[...reverse,...expected.measures],sha256:prior
  };
}

const headers = () => ({
  authorization:"Bearer "+process.env.GITHUB_TOKEN,
  accept:"application/vnd.github+json",
  "x-github-api-version":"2022-11-28"
});

async function api(path,options={}) {
  const response = await fetch("https://api.github.com/repos/"+repository+path,
    {...options,headers:{...headers(),...(options.headers??{})},signal:AbortSignal.timeout(15_000)});
  if (!response.ok) throw Error("GitHub request failed: "+response.status+" "+path);
  return response.json();
}

async function cloudEvidence() {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const authorization = process.env.CLOUDFLARE_API_TOKEN;
  if (!/^[a-f0-9]{32}$/.test(account??"") || !authorization) throw Error("Cloudflare D1 read credentials are required by the release gate");
  const response = await fetch("https://api.cloudflare.com/client/v4/accounts/"+account+"/d1/database/059f7a3a-43d1-49ea-80b2-65245436500f/query",{
    method:"POST", headers:{authorization:"Bearer "+authorization,"content-type":"application/json"},
    body:JSON.stringify({batch:[
      {sql:"SELECT * FROM zone_warrant WHERE zone_id = 'tweezer-tap-os'"},
      {sql:"SELECT l.sha256, l.event_json, l.created_at, d.sha256 AS applied_sha FROM conductor_evidence l JOIN conductor_delivery_receipts d USING(event_id) WHERE l.trigger_name='TIME_TICK' AND l.audit_status='PASS' AND json_extract(l.event_json,'$.scoreAudit.passed')=1 ORDER BY l.sequence DESC LIMIT 1"},
      {sql:"SELECT count(*) AS n FROM conductor_evidence WHERE audit_status='BRAKE'"}
    ]}),signal:AbortSignal.timeout(15_000)
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw Error("Cloudflare D1 rehearsal check failed");
  const [warrant,row,brake] = data.result.map(x=>x.results[0]);
  const evidence = row && JSON.parse(row.event_json);
  return {
    warrant: isWarrant(warrant,Date.now()),
    brakeClear: brake?.n===0,
    verifiedTime: Boolean(evidence) && row.sha256===row.applied_sha && await digest(evidence)===row.sha256 &&
      evidence.scoreAudit?.reverseMeasures===60 && neila(evidence.forward).passed &&
      row.created_at<=Date.now() && Date.now()-row.created_at<=300_000
  };
}

async function main() {
  const tag = process.env.GITHUB_REF ?? "";
  const parts = tag.match(/^refs\/tags\/launch\/tweezer-tap-os\/([0-9a-f]{40})-([0-9a-f]{40})$/);
  if (!parts) throw Error("Expected a launch tag with exact staged and main commit SHAs");
  const [,head,base] = parts;
  const local = execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim();
  if (process.env.GITHUB_REPOSITORY!==repository || !commitPattern.test(local) || local !== head) {
    throw Error("Launch tag does not target this checkout");
  }

  const [actor,stage,target,pulls,runs,cloud] = await Promise.all([
    api("/collaborators/"+encodeURIComponent(process.env.GITHUB_ACTOR)+"/permission"),
    api("/git/ref/heads/"+branch),
    api("/git/ref/heads/main"),
    api("/pulls?state=open&base=main&head=NathanAIoxr:"+encodeURIComponent(branch)),
    api("/actions/runs?head_sha="+head+"&per_page=100"),
    cloudEvidence()
  ]);
  if (pulls.length!==1) throw Error("Exactly one open staging promotion pull request is required");
  const pr = pulls[0];
  const reviews = await api("/pulls/"+pr.number+"/reviews?per_page=100");
  const reviewers = new Map();
  for (const review of reviews) {
    if (["APPROVED","CHANGES_REQUESTED","DISMISSED"].includes(review.state)) reviewers.set(review.user?.login,review);
  }
  const approved = [...reviewers.values()].some(r=>r.state==="APPROVED" && r.commit_id===head &&
    r.user?.login && r.user.login!==pr.user?.login &&
    ["OWNER","MEMBER","COLLABORATOR"].includes(r.author_association));
  let upToDate = true;
  try { execFileSync("git",["merge-base","--is-ancestor",base,head]); }
  catch { upToDate = false; }
  const config = read("wrangler.toml");

  const release = {head,base,pr:pr.number};
  const checks = [
    ["Exact tagged checkout",local===head],
    ["Maintainer launch command",actor.permission==="admin" || actor.role_name==="maintain"],
    ["Staged HEAD",stage.object.sha===head],
    ["Production base pinned",target.object.sha===base && pr.base.sha===base],
    ["Reviewed base included in staging",upToDate],
    ["Promotion PR ready",!pr.draft && pr.head.sha===head && pr.head.repo?.full_name===repository && pr.base.ref==="main"],
    ["Independent approval on exact revision",approved],
    ["Successful exact-commit zone checks",runs.workflow_runs.some(x=>x.name==="Tweezer TAP holding checks" && x.head_sha===head && x.conclusion==="success")],
    ["Private rehearsal config",manifest.mode==="HOLDING" && manifest.stagingOnly===true &&
      /^workers_dev = false$/m.test(config) && /^preview_urls = false$/m.test(config)],
    ["Active Cloudflare staging warrant",cloud.warrant],
    ["Cloudflare emergency brake clear",cloud.brakeClear],
    ["Fresh TIME and EMIT receipt verified",cloud.verifiedTime]
  ];

  const audit = await releaseMeasures(release,checks);
  console.log(JSON.stringify(audit,null,2));
  if (!audit.passed) throw Error("ALIEN / NEILA release checks failed");
  const [lastMain,lastHead] = await Promise.all([api("/git/ref/heads/main"),api("/git/ref/heads/"+branch)]);
  if (lastMain.object.sha!==base || lastHead.object.sha!==head) throw Error("Branch moved after the release audit");
  const merged = await api("/pulls/"+pr.number+"/merge",{
    method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({sha:head,merge_method:"merge"})
  });
  if (!merged.merged) throw Error("GitHub refused the track switch");
  console.log("Merged verified commit",head,"via PR",pr.number,"receipt",audit.sha256);
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) await main();
