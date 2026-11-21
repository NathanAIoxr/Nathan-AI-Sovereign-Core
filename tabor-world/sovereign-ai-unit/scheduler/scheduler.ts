export type Backend={id:string;kind:"cpu"|"gpu"|"managed-inference"|"cluster";region:string;accelerator:string;deviceCount:number;memoryMb:number;precisions:string[];runtimes:string[];interconnect:string;available:number;reserved:number;costUsdPerHour:number;enabled:boolean};
export type JobRequirement={runtime:string;precision:string;memoryMb:number;region?:string;deadlineMs?:number;maxCostUsd:number;estimatedHours:number};
export function eligibleBackends(backends:readonly Backend[],job:JobRequirement):Backend[]{
 if(!Number.isFinite(job.estimatedHours)||job.estimatedHours<=0||!Number.isFinite(job.maxCostUsd)||job.maxCostUsd<0)throw new RangeError("invalid budget or duration");
 return backends.filter(b=>b.enabled&&b.available-b.reserved>0&&b.memoryMb>=job.memoryMb&&b.runtimes.includes(job.runtime)&&b.precisions.includes(job.precision)&&(!job.region||job.region===b.region)&&b.costUsdPerHour*job.estimatedHours<=job.maxCostUsd).sort((a,b)=>a.costUsdPerHour-b.costUsdPerHour||b.available-a.available||a.id.localeCompare(b.id));
}
export function selectBackend(backends:readonly Backend[],job:JobRequirement):Backend|null{return eligibleBackends(backends,job)[0]??null}
