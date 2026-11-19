/** Nathan Mind 202 build-queue validator. No deployments or external writes. */
import {readFileSync} from 'node:fs';
const q=JSON.parse(readFileSync(new URL('../nathan-mind-202-build-queue.json',import.meta.url),'utf8'));
const registry=JSON.parse(readFileSync(new URL('../nathan-mind-101-workers-101-bots.json',import.meta.url),'utf8'));
const ids=new Set(q.jobs.map(j=>j.id));
if(q.jobs.length!==202||ids.size!==202)throw Error('Expected 202 unique jobs');
if(q.jobs.filter(j=>j.kind==='worker').length!==101||q.jobs.filter(j=>j.kind==='bot').length!==101)throw Error('Expected 101 of each kind');
for(const j of q.jobs){if(!Number.isInteger(j.build_lane)||j.build_lane<1||j.build_lane>8)throw Error('Invalid lane '+j.id);if(j.status!=='awaiting_implementation')throw Error('Unexpected state '+j.id);if(j.kind==='bot'&&!ids.has(j.worker_ref))throw Error('Missing Worker '+j.worker_ref)}
if(registry.workers.length!==101||registry.bots.length!==101)throw Error('Registry counts differ');
console.log('Validated 202 build assignments across 8 lanes. No deployments performed.');
