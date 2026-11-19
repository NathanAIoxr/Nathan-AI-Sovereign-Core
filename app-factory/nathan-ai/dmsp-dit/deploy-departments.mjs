import { readFile } from "node:fs/promises";
import { departmentBuilds } from "./department-builds.mjs";

const { CLOUDFLARE_ACCOUNT_ID: accountId, CLOUDFLARE_API_TOKEN: token } = process.env;
if (!/^[a-f0-9]{32}$/.test(accountId || "") || !token) {
  throw new Error("Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN");
}
const code = await readFile(new URL("./department-worker.mjs", import.meta.url), "utf8");
const url = "https://api.cloudflare.com/client/v4/accounts/" + accountId +
  "/workers/dispatch/namespaces/nathan-tabor-platforms/scripts/";

for (const [departmentId, [deliverable, input, evidence]] of Object.entries(departmentBuilds)) {
  const name = "dmsp-dit-" + departmentId;
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify({
    main_module: "department-worker.mjs",
    compatibility_date: "2026-11-18",
    bindings: [{ type: "json", name: "DEPARTMENT", json: { departmentId, deliverable, input, evidence } }],
    tags: ["dmsp-dit-department-build"],
  })], { type: "application/json" }));
  form.append("department-worker.mjs", new Blob([code], { type: "application/javascript+module" }), "department-worker.mjs");
  const response = await fetch(url + name, {
    method: "PUT",
    headers: { Authorization: "Bearer " + token },
    body: form,
    signal: AbortSignal.timeout(30000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success !== true) {
    throw new Error("Could not deploy " + name + " (HTTP " + response.status + ")");
  }
  console.log("Deployed " + name);
}
