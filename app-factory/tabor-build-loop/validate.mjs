import { parse } from "acorn";

export function checkModule(code, dependencies = []) {
  const ast = parse(code, { ecmaVersion:"latest",sourceType:"module" });
  const allowed = new Set(dependencies.map(row => "./" + row.file_path.split("/").at(-1)));
  if (!ast.body.some(node => node.type.startsWith("Export"))) throw new Error("Module needs an ES export.");
  const stack = [ast];
  while (stack.length) {
    const node = stack.pop();
    if (node.type === "ImportExpression") throw new Error("Use a declared static dependency instead of a dynamic import.");
    if (node.source && (node.type === "ImportDeclaration" || node.type.startsWith("Export")) && !allowed.has(node.source.value)) {
      throw new Error("Module imports must reference a direct dependency in its plan.");
    }
    for (const value of Object.values(node)) {
      if (value && typeof value.type === "string") stack.push(value);
      else if (Array.isArray(value)) for (const child of value) if (child && typeof child.type === "string") stack.push(child);
    }
  }
}
