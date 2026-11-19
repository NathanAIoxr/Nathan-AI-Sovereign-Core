import { INTEGRATIONS, NODES, EDGES, TASKS } from "./registry.mjs";

/** PD-012: reference-only integration inventory. Never probes or mutates external systems. */
export const EXPECTED_REPOSITORY_PATHS = Object.freeze([
  "app-factory/nathan-ai/operations/train-runtime",
  "app-factory/sites/santa-claus-factory",
  "creative-archive/nexus-mas-spirit/canon.json"
]);
export const EXPECTED_CLOUDFLARE_SCRIPTS = Object.freeze([
  "library-of-tabor-imagination", "nathan-ai-fleet", "nathan-tabor-labs"
]);

export function auditReferences(integrations = INTEGRATIONS) {
  const failures = [];
  const ids = new Set();
  for (const item of integrations) {
    if (!item || typeof item !== "object" || typeof item.id !== "string" || ids.has(item.id)) {
      failures.push("missing_or_duplicate_id"); continue;
    }
    ids.add(item.id);
    if (item.mode !== "reference_only") failures.push(item.id + ":unexpected_mutation_mode");
    if (item.type === "github_path") {
      if (!EXPECTED_REPOSITORY_PATHS.includes(item.value)) failures.push(item.id + ":unapproved_repo_path");
    } else if (item.type === "cloudflare_script") {
      if (!EXPECTED_CLOUDFLARE_SCRIPTS.includes(item.value)) failures.push(item.id + ":unapproved_cloudflare_script");
    } else failures.push(item.id + ":unsupported_locator_type");
    if (Object.keys(item).some(k => /token|secret|password|credential|authorization|private_key/i.test(k))) failures.push(item.id + ":sensitive_field");
  }
  const actualRepo = integrations.filter(x => x?.type === "github_path").map(x => x.value);
  const actualScripts = integrations.filter(x => x?.type === "cloudflare_script").map(x => x.value);
  for (const path of EXPECTED_REPOSITORY_PATHS) if (!actualRepo.includes(path)) failures.push("missing_repository_reference:" + path);
  for (const script of EXPECTED_CLOUDFLARE_SCRIPTS) if (!actualScripts.includes(script)) failures.push("missing_script_reference:" + script);
  return {
    ok: failures.length === 0,
    failures,
    total: integrations.length,
    checked_repository_paths: actualRepo,
    declared_cloudflare_scripts: actualScripts,
    repository_paths_verified_live: false,
    cloudflare_scripts_verified_live: false,
    remote_access_performed: false,
    changes_to_other_projects: 0,
    verification_note: "Static registry audit only. A separate authorized read must verify current GitHub paths and Cloudflare script state."
  };
}

export function auditGraph() {
  const ids = new Set(NODES.map(n => n.id));
  return {
    nodes: NODES.length, edges: EDGES.length, backlog: TASKS.length,
    missing_endpoints: EDGES.filter(e => !ids.has(e.from) || !ids.has(e.to)).length,
    completed_tasks_claimed: TASKS.filter(t => t.status === "complete" || t.dispatch !== false).length
  };
}
