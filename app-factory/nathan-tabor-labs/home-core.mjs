import { runChecks, chip } from './science.mjs';
import { createAntFarm, configureAntFarm, advanceAntFarm, routeAnts } from './ant-farm.mjs';
import { bees } from './registry.mjs';

export const MINUTES = 15;
export const INTERVAL = MINUTES * 60_000;
const domain = '.nathantaboract.workers.dev';
const service = (id, title, path, protectedRoute = false) => ({
  id, title, url: 'https://' + id + domain, path, protectedRoute
});

export const connections = Object.freeze([
  service('nathan-absolute-intelligence', 'Absolute Intelligence', '/api/health'),
  service('nathan-ai-sovereign-hive', 'Sovereign Hive', '/api/repair/status'),
  service('nathan-ai-workers', 'Worker catalog', '/api/health'),
  service('one-sovereign-hub', 'ONE owner hub', '/api/status', true),
]);
export const release = 'nathan-ai-home-v1';
export const roles = Object.values(bees).map(({id,name,domain}) => ({id,name,domain}));

export function ownChecks() {
  const farm = createAntFarm();
  configureAntFarm(farm, {mode:'counterspin',plane:'vertical',visible:false});
  const phase = advanceAntFarm(farm,Math.PI/4);
  const selected = roles.map(x=>x.id);
  const routed = routeAnts(farm,selected);
  const lab = runChecks();
  const checks = [
    {id:'bee',name:'Physics Bee',result:'Existing Labs checks',passed:lab.passed,checks:lab.checks.length},
    {id:'ant',name:'Ant Farm',result:'Vertical counter-rotation and complete role routing',passed:
      phase.right>0 && phase.left>Math.PI && phase.axis===Math.PI/2 &&
      routed.length===selected.length && selected.every(id=>routed.includes(id)),
      roles:routed.length},
    {id:'agent',name:'Validation Agent',result:'Exact arithmetic and public/owner routing',passed:
      chip(1,1).value===2 && chip(0,0).value===1-1 &&
      connections.filter(target=>target.protectedRoute).length===1 && !farm.visible},
  ];
  return {release,passed:checks.every(item=>item.passed),checks};
}

async function probe(target,fetcher) {
  try {
    const response = await fetcher(target.url+target.path,{method:'GET',redirect:'manual',
      headers:{Accept:'application/json'},signal:AbortSignal.timeout(3500)});
    // Never read or return a downstream response body, headers or errors.
    const status = response.status;
    await response.body?.cancel().catch(()=>{});
    return {id:target.id,http:status,state:target.protectedRoute ?
      ([401,403].includes(status)?'owner-sign-in':'unexpected') :
      (status===200?'online':'unavailable')};
  } catch {
    return {id:target.id,http:null,state:'unavailable'};
  }
}

export async function homePulse(db,when,fetcher=fetch) {
  const slot = Math.floor(when/INTERVAL);
  if (await db.prepare('SELECT 1 AS done FROM home_pulses WHERE slot=?').bind(slot).first()) return;
  const targets = await Promise.all(connections.map(target=>probe(target,fetcher)));
  const local = ownChecks();
  const result = {local,targets,passed:local.passed && targets.every(x=>['online','owner-sign-in'].includes(x.state))};
  await db.batch([
    db.prepare('INSERT OR IGNORE INTO home_pulses (slot,scheduled_ms,result) VALUES (?,?,?)')
      .bind(slot,when,JSON.stringify(result)),
    db.prepare('DELETE FROM home_pulses WHERE slot IN (SELECT slot FROM home_pulses ORDER BY slot DESC LIMIT -1 OFFSET 32)'),
  ]);
}

export async function homeStatus(db,now=Date.now()) {
  const recent = await db.prepare('SELECT scheduled_ms,result FROM home_pulses ORDER BY slot DESC LIMIT 3').all();
  const snapshots = recent.results.map(row=>({at:row.scheduled_ms,...JSON.parse(row.result)}));
  return {release,identity:'Nathan AI 🚀',intervalMinutes:MINUTES,retention:32,
    checks:ownChecks(),snapshots,fresh:snapshots.length>0 && now-snapshots[0].at<=INTERVAL*2+5*60_000,
    connections,roles};
}
