// Bounded conductor: inventory audit and approved job claiming, no arbitrary execution.
export async function conductCycle(db,cycleId) {
 const started=await db.prepare('INSERT OR IGNORE INTO sovereign_conductor_cycles_v1(cycle_id) VALUES(?)').bind(cycleId).run();
 if(!started.meta?.changes) return {cycleId,duplicate:true};
 const projects=await db.prepare("SELECT c.project_id,c.mode,c.max_jobs_per_cycle FROM sovereign_conductor_v1 c JOIN zones_registry z ON z.project_id=c.project_id WHERE c.enabled=1 AND z.launch_status='HOLD' ORDER BY c.project_id LIMIT 100").all();
 let eligible=0,claimed=0;
 for(const p of projects.results){
  if(p.mode!=='approved_dispatch')continue;
  const jobs=await db.prepare("SELECT job_id FROM sovereign_dispatch_v1 WHERE project_id=? AND approved=1 AND status='queued' ORDER BY created_at,job_id LIMIT ?").bind(p.project_id,p.max_jobs_per_cycle).all();
  eligible+=jobs.results.length;
  for(const j of jobs.results){
   const result=await db.prepare("UPDATE sovereign_dispatch_v1 SET status='claimed',claimed_at=CURRENT_TIMESTAMP WHERE job_id=? AND project_id=? AND status='queued' AND approved=1").bind(j.job_id,p.project_id).run();
   if(result.meta?.changes)claimed++;
  }
 }
 const receipt={mode:'bounded',projectsChecked:projects.results.length,eligibleJobs:eligible,claimedJobs:claimed,executedJobs:0};
 await db.prepare('UPDATE sovereign_conductor_cycles_v1 SET finished_at=CURRENT_TIMESTAMP,projects_checked=?,eligible_jobs=?,claimed_jobs=?,receipt_json=? WHERE cycle_id=?').bind(receipt.projectsChecked,eligible,claimed,JSON.stringify(receipt),cycleId).run();
 return {cycleId,...receipt};
}
