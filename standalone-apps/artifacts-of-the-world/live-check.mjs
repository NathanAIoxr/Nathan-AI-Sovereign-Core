import { setTimeout as delay } from "node:timers/promises";
import { apps, build } from "./build.mjs";

async function verifyProject({ app, files }) {
  const results = await Promise.allSettled(Object.entries(files).map(async ([path, [type, expected]]) => {
    const url = new URL(path, app.origin);
    const response = await fetch(url, {
      redirect: "error",
      headers: { "cache-control": "no-cache" },
      signal: AbortSignal.timeout(8_000)
    });
    if (!response.ok) throw new Error(path + " returned HTTP " + response.status);
    if (!response.headers.get("content-type")?.startsWith(type.split(";")[0])) {
      throw new Error(path + " returned an unexpected content type");
    }
    const actual = Buffer.from(await response.arrayBuffer());
    if (!actual.equals(Buffer.from(expected))) {
      throw new Error(path + " differs from the build");
    }
  }));
  return results.filter(result => result.status === "rejected").map(result => result.reason.message);
}

const builds = await Promise.all(apps.map(({ id }) => build(id)));
const attempts = process.argv.includes("--wait-for-release") ? 10 : 1;
let reports;
for (let i = 1; i <= attempts; i++) {
  reports = await Promise.all(builds.map(async build => ({ id: build.app.id, errors: await verifyProject(build) })));
  if (reports.every(report => report.errors.length === 0) || i === attempts) break;
  await delay(10_000);
}
for (const { id, errors } of reports) {
  console.log(id + " · " + (errors.length ? errors.join(", ") : "matches the GitHub build"));
}
if (reports.some(report => report.errors.length)) process.exitCode = 1;
