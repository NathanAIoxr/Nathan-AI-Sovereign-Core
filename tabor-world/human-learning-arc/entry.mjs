import original from "./tabor-worker-catalog-entry.mjs";
import { withLearningArc } from "./human-learning-arc-runtime.mjs";

export * from "./tabor-worker-catalog-entry.mjs";
export default withLearningArc(original);
