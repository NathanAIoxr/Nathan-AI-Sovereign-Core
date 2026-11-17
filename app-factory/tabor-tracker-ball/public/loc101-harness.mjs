import {modules,classes} from "./loc101-catalog.mjs";
import {applyStroke,choose,completed,markers,newScene,profiles,rotate} from "./loc101-core.mjs";
import {castLine,newLibraryBridge} from "./loc101-bridge.mjs";

export function verifyLibrary() {
  const seen = new Set();
  const failed = [];
  for (const [index,module] of modules.entries()) {
    try {
      if (module.id !== index + 1 || seen.has(module.title) || !classes[module.classCode] ||
        !profiles[module.profile] || module.items.length < 3) throw Error("catalog");
      seen.add(module.title);
      const scene = newScene(module);
      if (module.profile === "orbit") rotate(scene,.12,-.19,.2);
      const points = markers(scene);
      if (points.length !== module.items.length || !points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))) {
        throw Error("marker layout");
      }
      if (module.profile === "trace") applyStroke(scene,{kind:"drag",path:points});
      else if (module.profile === "link") {
        for (const [step] of module.items.slice(1).entries()) {
          choose(scene,step);
          choose(scene,step+1);
        }
      } else module.items.forEach((_,step) => choose(scene,step));
      if (!completed(scene)) throw Error("completion");
      const bridge = newLibraryBridge();
      if (!bridge.clear(module) || bridge.clear(module) || bridge.snapshot().charge !== 1) throw Error("reward");
      for (const role of ["nathan","pk","curator"]) if (!castLine(role,scene).trim()) throw Error("cast");
    } catch (error) {
      failed.push(module.id + " " + module.title + " (" + error.message + ")");
    }
  }
  return {total:modules.length, passed:modules.length - failed.length, failed};
}
