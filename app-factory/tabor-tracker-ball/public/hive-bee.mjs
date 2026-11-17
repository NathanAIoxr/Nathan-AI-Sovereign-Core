import {runJob} from "./hive-core.mjs";

self.addEventListener("message", ({data}) => {
  const {key,kind,lease}=data;
  try { self.postMessage({key,lease,ok:true,result:runJob(kind)}); }
  catch(error) { self.postMessage({key,lease,ok:false,error:String(error.message)}); }
});
