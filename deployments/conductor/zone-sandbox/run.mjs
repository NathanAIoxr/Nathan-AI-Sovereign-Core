import { createHash } from "node:crypto";
import { readFile, appendFile } from "node:fs/promises";
import { reconcileZone, validateProjects } from "./reconcile.mjs";

const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: cloudKey,
  GITHUB_TOKEN: gitKey, GITHUB_REPOSITORY: repository, GITHUB_SHA: commit,
  GITHUB_STEP_SUMMARY: summary } = process.env;
const projects = JSON.parse(await readFile(new URL("projects.json", import.meta.url), "utf8"));
const worker = await readFile(new URL("worker.mjs", import.meta.url), "utf8");
validateProjects(projects);
if (process.argv[2] === "--validate") {
  console.log("Verified " + projects.length + " independent Zone declarations");
  process.exit(0);
}
if (!/^[0-9a-f]{32}$/.test(account ?? "") || !cloudKey || !gitKey ||
    repository !== "NathanAIoxr/Nathan-AI-Sovereign-Core" || !/^[0-9a-f]{40}$/.test(commit ?? "")) {
  throw new Error("Zone reconciliation requires the configured GitHub and Cloudflare credentials");
}

async function api(base, credential, method, path, options = {}) {
  const url = new URL(base + path);
  for (const [key, value] of Object.entries(options.query ?? {})) url.searchParams.set(key, value);
  const headers = { Authorization: "Bearer " + credential, Accept: "application/json" };
  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }
  const response = await fetch(url, { method, headers, body, redirect: "error", signal: AbortSignal.timeout(20_000) });
  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    const error = new Error(method + " " + path + " returned " + response.status);
    error.status = response.status;
    throw error;
  }
  return payload;
}

const cf = (...args) => api("https://api.cloudflare.com/client/v4/accounts/" + account, cloudKey, ...args);
const gh = (...args) => api("https://api.github.com/repos/" + repository, gitKey, ...args);

async function ensureBranch(project) {
  const branch = "zone/" + project;
  const existing = async () => {
    try {
      return (await gh("GET", "/git/ref/heads/" + branch)).ref === "refs/heads/" + branch;
    } catch (error) {
      if (error.status === 404) return false;
      throw error;
    }
  };
  if (await existing()) return;
  try {
    await gh("POST", "/git/refs", { body: { ref: "refs/heads/" + branch, sha: commit } });
  } catch (error) {
    if (!(await existing())) throw error;
  }
}

const release = createHash("sha256").update(worker).digest("hex");
const receipts = [];
for (const project of projects) {
  try {
    await ensureBranch(project);
    receipts.push(await reconcileZone(cf, project, release, worker));
  } catch (error) {
    console.error(project, error.message);
    receipts.push({ project, phase: "NEEDS_ATTENTION" });
  }
}
console.log(JSON.stringify({ mode: "TIME", workflow: ["ALIEN", "EMIT", "NEILA"], receipts }, null, 2));
if (summary) {
  await appendFile(summary, ["| Project | Phase |", "| --- | --- |",
    ...receipts.map(row => "| " + row.project + " | " + row.phase + " |"), ""].join("\n"));
}
if (receipts.some(row => row.phase === "NEEDS_ATTENTION")) process.exitCode = 1;
