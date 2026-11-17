import {readFileSync} from 'node:fs';
import {ADDITIONAL_WORKLOADS, COMPANIONS, CRON, FLEET_WORKER, targetBinding, WORKLOADS} from './fleet-plan.mjs';

export function buildDeployment({firstControllerDeployment = false} = {}) {
  const metadata = (main_module, bindings) => ({main_module, compatibility_date: '2026-11-17', bindings});
  const companions = COMPANIONS.filter(workload => workload.worker !== FLEET_WORKER).map(workload => ({
    name: workload.worker,
    metadata: metadata('companion.mjs', [
      targetBinding(workload, 'TARGET'), {type: 'plain_text', name: 'WORKLOAD_KEY', text: workload.key},
    ]),
    enabled: false,
  }));
  const controller = {
    name: FLEET_WORKER,
    metadata: {
      ...metadata('controller.mjs', [
        {type: 'durable_object_namespace', name: 'SUPERVISORS', class_name: 'Supervisor'},
        {type: 'durable_object_namespace', name: 'FLEET_SUMMARY', class_name: 'FleetSummary'},
        ...WORKLOADS.map(workload => targetBinding(workload, `TARGET_${workload.key}`)),
        ...companions.map((worker, index) => ({type: 'service', name: COMPANIONS[index].binding, service: worker.name})),
        ...ADDITIONAL_WORKLOADS.map(workload => targetBinding(workload, workload.targetBinding)),
      ]),
      observability: {enabled: true, head_sampling_rate: 1},
      ...(firstControllerDeployment && {migrations: {new_tag: 'v1', new_sqlite_classes: ['Supervisor', 'FleetSummary']}}),
    },
    enabled: true,
    schedules: [{cron: CRON}],
  };
  const modules = Object.fromEntries(['controller.mjs', 'companion.mjs', 'fleet-plan.mjs', 'probe.mjs']
    .map(filename => [filename, readFileSync(new URL(filename, import.meta.url), 'utf8')]));
  return {controller, companions, modules};
}

if (import.meta.main) {
  const firstControllerDeployment = process.argv.includes('--new-controller');
  process.stdout.write(JSON.stringify(buildDeployment({firstControllerDeployment})));
}
