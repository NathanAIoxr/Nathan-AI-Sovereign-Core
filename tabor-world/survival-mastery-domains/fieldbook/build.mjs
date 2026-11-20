import { pathToFileURL } from "node:url";
import { fieldbook } from "./runtime.mjs";
import { survivalDomains } from "../survival-mastery-domains-data.mjs";
import { labs, capstone } from "./labs.mjs";

export function buildFieldbook() {
  const publicDomains = { eras: survivalDomains.eras.map(({ id, stations }) => ({
    id,
    stations: stations.map(({ id, title, academy }) => ({ id, title, academy })),
  })) };
  return "export default (" + fieldbook.toString() + ")(" + [publicDomains, labs, capstone].map(value => JSON.stringify(value)).join(",\n") + ");\n";
}

export function wireEntry(source) {
  const binding = 'import withFieldbook from "./survival-fieldbook.mjs";';
  if (source.includes(binding)) {
    if (!source.includes("export default withFieldbook(")) throw new Error("Academy wrapper has an incomplete Fieldbook");
    return source;
  }
  const marker = "export default ";
  if (source.indexOf(marker) < 0 || source.indexOf(marker) !== source.lastIndexOf(marker)) throw new Error("Expected one Academy default export");
  return binding + "\n" + source.replace(marker, "const academyBeforeFieldbook = ")
    + "\nexport default withFieldbook(academyBeforeFieldbook);\n";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.stdout.write(buildFieldbook());
