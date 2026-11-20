export function addAcademyMap(worker, runtime, data) {
  const marker = "/* TABOR ACADEMY MAP */";
  const start = worker.indexOf(marker);
  if (start >= 0) worker = worker.slice(0, start).trimEnd().replace("const academyApp = {", "export default {") + "\n";
  const entry = "export default {";
  if (worker.split(entry).length !== 2) throw new Error("Expected one Academy entry point");
  const app = worker.replace(entry, "const academyApp = {");
  return app.trimEnd() + "\n\n" + marker + "\n" + runtime.trimEnd() +
    "\nexport default createAcademyNavigation(academyApp, " + JSON.stringify(data) + ");\n";
}
