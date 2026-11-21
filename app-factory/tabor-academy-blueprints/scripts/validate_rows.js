import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const validator = fileURLToPath(new URL("./validate_rows.py", import.meta.url));
const run = spawnSync("python3", [validator, ...process.argv.slice(2)], { stdio: "inherit" });
if (run.error) console.error(run.error.message);
process.exitCode = run.status ?? 1;
