// Reusable component-level recovery. Repairs must be reversible and explicitly supplied.
export class RecoverySupervisor {
 constructor({check,repair,onEvent=()=>{},intervalMs=60000,cooldownMs=30000,maxFailures=3}){
  if(typeof check!=='function'||typeof repair!=='function'||!Number.isFinite(intervalMs)||intervalMs<1000||!Number.isFinite(cooldownMs)||cooldownMs<1000||!Number.isSafeInteger(maxFailures)||maxFailures<1)throw new Error('Explicit bounded recovery policy required');
  Object.assign(this,{check,repair,onEvent,intervalMs,cooldownMs,maxFailures});this.running=false;this.failures=0;this.next=0;this.timer=null;this.halted=false;this.active=false;
 }
 emit(state){try{this.onEvent({state,failures:this.failures,next:this.next});}catch{/* telemetry cannot trigger another repair */}}
 async tick(){
  if(this.running||this.halted||Date.now()<this.next)return {state:this.halted?'halted':'deferred'};
  this.running=true;try{
   let healthy=false;try{healthy=await this.check();}catch{/* failed health probe enters recovery */}
   if(healthy){this.failures=0;this.emit('healthy');return {state:'healthy'};}
   await this.repair();
   if(!(await this.check()))throw new Error('Recovery verification failed');
   this.failures=0;this.next=Date.now()+this.cooldownMs;this.emit('recovered');return {state:'recovered'};
  }catch{this.failures++;this.halted=this.failures>=this.maxFailures;this.next=Date.now()+Math.min(3600000,this.cooldownMs*2**Math.min(this.failures-1,6));const state=this.halted?'halted':'cooldown';this.emit(state);return {state};}
  finally{this.running=false;}
 }
 start(){if(this.active)return;this.active=true;const loop=async()=>{if(!this.active)return;await this.tick();if(this.active)this.timer=setTimeout(loop,this.intervalMs);};void loop();}
 stop(){this.active=false;clearTimeout(this.timer);this.timer=null;}
 resume(){this.halted=false;this.failures=0;this.next=0;this.emit('resumed');}
}
