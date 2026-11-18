import original from "./worker.mjs";
import { withWorkerCatalog } from "./tabor-worker-catalog-bundle.mjs";
export * from "./worker.mjs";
export default withWorkerCatalog(original, {"host":"tabor-supercomputer-federation","nav":[],"federation":true});
