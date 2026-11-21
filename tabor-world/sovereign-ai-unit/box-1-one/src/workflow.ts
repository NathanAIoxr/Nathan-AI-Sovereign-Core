import {WorkflowEntrypoint,WorkflowStep,WorkflowEvent} from "cloudflare:workers";
export class NathanAuditWorkflow extends WorkflowEntrypoint<{LEDGER:D1Database},{jobId:string}> {
 async run(event:WorkflowEvent<{jobId:string}>,step:WorkflowStep){
  const id=event.payload.jobId;
  await step.do("verify-job-record",async()=>{
   const record=await this.env.LEDGER.prepare("SELECT id,status FROM sovereign_jobs WHERE id=?").bind(id).first();
   if(!record)throw new Error("job_not_found");
   return record.status;
  });
  await step.do("mark-audited",async()=>{
   await this.env.LEDGER.prepare("UPDATE sovereign_jobs SET audited_at=? WHERE id=?").bind(Date.now(),id).run();
  });
 }
}
