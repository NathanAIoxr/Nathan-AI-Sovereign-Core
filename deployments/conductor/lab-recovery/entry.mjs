import original from './tabor-worker-catalog-entry.mjs';
import { withLabRecovery } from './archive.mjs';

export * from './tabor-worker-catalog-entry.mjs';
export default withLabRecovery(original);
