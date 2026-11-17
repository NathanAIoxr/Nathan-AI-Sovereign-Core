import { readFile } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const file = name => readFile(new URL(name, root), "utf8");
const [runner, canary, documentation, repair, tests] = await Promise.all([
  file("sandbox-runner.mjs"), file("sandbox-canary.mjs"),
  file("sandbox-verify-comments.mjs"), file("repair.mjs"), file("repair.test.mjs")
]);

function insert(source, marker, value) {
  const key = JSON.stringify(marker);
  if (source.split(key).length !== 2) throw new Error("Invalid bundle marker " + marker);
  return source.replace(key, () => JSON.stringify(value));
}

let canaryScript = insert(canary, "__HIVE_REPAIR_MODULE__", repair);
canaryScript = insert(canaryScript, "__HIVE_TEST_MODULE__", tests);
let output = insert(runner, "__ABSOLUTE_INTELLIGENCE_DOCUMENTATION_CHECK__", documentation);
output = insert(output, "__ABSOLUTE_INTELLIGENCE_HIVE_CANARY__", canaryScript);
process.stdout.write(output);
