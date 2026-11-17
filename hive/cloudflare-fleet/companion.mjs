import {WorkerEntrypoint} from 'cloudflare:workers';
import {WORKLOADS} from './fleet-plan.mjs';
import {probe} from './probe.mjs';

export default class extends WorkerEntrypoint {
  fetch() {
    return new Response(null, {status: 404});
  }

  check() {
    const workload = WORKLOADS.find(item => item.key === this.env.WORKLOAD_KEY);
    if (!workload?.contractType) throw new Error('Workload missing');
    return probe(workload, this.env.TARGET, true);
  }
}
