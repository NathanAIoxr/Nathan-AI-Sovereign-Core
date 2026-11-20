const moduleName = "academy-jeffrey-epstein-bible.mjs";
const moduleImport = 'import { withJeffreyEpsteinBible } from "./' + moduleName + '";';

export function mountJeffreyEpsteinBible(entry) {
  if (entry.startsWith(moduleImport + "\n") && /^export default withJeffreyEpsteinBible\(.+\);$/m.test(entry)) return entry;
  const current = /^export default (withApprenticeshipZone\(.+\));$/m;
  if (entry.includes(moduleName) || !current.test(entry)) {
    throw new Error("The Academy entry point has changed");
  }
  return moduleImport + "\n" + entry.replace(current, (_, wrapper) =>
    "export default withJeffreyEpsteinBible(" + wrapper + ");");
}
