export const FLEET_WORKER = 'nathan-ai-fleet';
export const OWNER_SUFFIX = '.nathantaboract.workers.dev';
export const CHECK_INTERVAL = 5;
export const CRON = '* * * * *';
export const HANDOFF_DB = '996d9d72-8355-4ace-beea-2a2e669f5d74';

// [Worker, workload, reachability path, optional contract path, contract type]
const targets = [
  ['bibletopia', 'Games', '/', '/', 'html'],
  ['bibletopia-release-bee', 'Games', '/api/status', '/api/status', 'json'],
  ['dual-screen-arcade', 'Games', '/', '/', 'html'],
  ['grapple-it', 'Games', '/', '/api/daily', 'json'],
  ['grapple-it-bees', 'Games', '/status', '/status', 'json'],
  ['hook-and-ring', 'Games', '/', '/api/status', 'json'],
  ['hook-and-ring-bee', 'Games', '/api/status', '/api/status', 'json'],
  ['nathan-absolute-intelligence', 'AI and operations', '/', '/api/health', 'json'],
  ['nathan-ai-deployment-check', 'AI and operations', '/api/health'],
  ['nathan-ai-handoff-bee', 'AI and operations', null, null, 'handoff'],
  ['nathan-ai-help-wanted', 'AI and operations', '/health', '/health', 'json'],
  ['nathan-ai-help-wanted-live', 'AI and operations', '/', '/api/overview', 'json'],
  ['nathan-ai-patch-verifier', 'AI and operations', '/', '/api/status', 'json'],
  ['nathan-ai-project-runner', 'AI and operations', '/healthz', '/healthz', 'json'],
  ['nathan-ai-repair-sandbox', 'AI and operations', '/', '/', 'private'],
  ['nathan-ai-sovereign-hive', 'AI and operations', '/', '/api/queue', 'json'],
  ['nathan-ai-truthstream', 'AI and operations', '/', '/health', 'json'],
  ['nathan-ai-workers', 'AI and operations', '/', '/api/health', 'json'],
  ['nathan-tabor-labs', 'AI and operations', '/', '/api/receipts', 'json'],
  ['nathan-tabor-library', 'Books and research', '/', '/api/catalog', 'json'],
  ['one-launch', 'AI and operations', '/healthz', '/healthz', 'json'],
  ['one-sovereign-hub', 'AI and operations', '/health', '/health', 'json'],
  ['pee-and-dee-books', 'Books and research', '/', '/', 'html'],
  ['pee-dee-valley', 'Books and research', '/', '/', 'html'],
  ['pee-dee-valley-editions', 'Books and research', '/', '/', 'html'],
  ['tabor-bridge', 'AI and operations', '/'],
  ['tabor-database-atlas', 'Books and research', '/', '/api/status', 'json'],
  ['tabor-one', 'AI and operations', '/health', '/api/cloud/status', 'json'],
  ['tabor-saturday-morning', 'Games', '/', '/health', 'json'],
  ['tabor-tracker-ball', 'Games', '/', '/health', 'json'],
  ['tabor-universal-library-engine', 'Books and research', '/app-factory/tabor-universal-library-engine/public/world/', '/app-factory/tabor-universal-library-engine/public/catalog.json', 'json'],
  ['tabor-world', 'Games', '/', '/health', 'json'],
  ['tower-of-babel-by-nathan-tabor', 'Books and research', '/', '/', 'html'],
];

export const WORKLOADS = targets.map(([service, group, path, contractPath, contractType], index) => ({
  service, group, path, contractPath, contractType, key: String(index + 1).padStart(2, '0'),
}));

export const COMPANIONS = WORKLOADS.filter(workload => workload.contractType).map((workload, index, all) => ({
  ...workload,
  binding: `BOT_${workload.key}`,
  worker: index === all.length - 1 ? FLEET_WORKER : `nathan-ai-fleet-bot-${workload.key}`,
}));

export const SLOTS = [
  ...WORKLOADS.map(workload => ({...workload, worker: workload.service, mode: 'primary'})),
  ...COMPANIONS.map(workload => ({...workload, mode: 'companion'})),
].map((slot, index) => ({
  ...slot,
  id: `agent-${String(index + 1).padStart(2, '0')}`,
  cohort: index % CHECK_INTERVAL,
  targetBinding: `TARGET_${slot.key}`,
}));

export const ADDITIONAL_WORKLOADS = [
  {service: 'tabor-app-portfolio', supervisor: 'nathan-tabor-labs', contractPath: '/', contractType: 'html'},
  {service: 'library-of-tabor-data', supervisor: 'nathan-tabor-library', origin: 'https://library-data.internal',
    contractPath: '/connections', contractType: 'json'},
].map((workload, index) => ({
  ...workload, worker: workload.service, targetBinding: `ADDITIONAL_${index + 1}`,
  cohort: SLOTS.find(slot => slot.worker === workload.supervisor).cohort,
}));

export function targetBinding(workload, name) {
  return workload.contractType === 'handoff'
    ? {type: 'd1', name, database_id: HANDOFF_DB, id: HANDOFF_DB}
    : {type: 'service', name, service: workload.service};
}
