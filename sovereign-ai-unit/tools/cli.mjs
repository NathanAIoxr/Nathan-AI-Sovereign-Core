import { readFile, writeFile } from "node:fs/promises";
import { api, submit, wait, artifact } from "./client.mjs";
const [command,argument,other]=process.argv.slice(2);
const emit = object => console.log(JSON.stringify(object,null,2));
try {
  if(command==="status") emit(await (await api("/status",argument==="project"?{method:"POST"}:{auth:false})).json());
  else if(command==="jobs") emit(await (await api("/jobs")).json());
  else if(command==="submit"&&argument) emit(await submit(JSON.parse(await readFile(argument,"utf8")),other));
  else if(command==="inspect"&&argument) emit(await (await api("/jobs/"+encodeURIComponent(argument))).json());
  else if(command==="wait"&&argument) emit(await wait(argument,other?Number(other):undefined));
  else if(command==="cancel"&&argument) emit(await (await api("/jobs/"+encodeURIComponent(argument),{method:"DELETE"})).json());
  else if(command==="artifact"&&argument) {
    const result=await artifact(argument);
    if(other) await writeFile(other,result.raw,{flag:"wx"});
    emit(other?{file:other,sha256:result.hash}:result.data);
  } else if(command==="upload"&&argument) {
    const input=await readFile(argument);
    if(input.byteLength>8*1024*1024) throw new Error("Object exceeds 8 MiB");
    emit(await (await api("/objects",{method:"POST",body:input})).json());
  } else if(command==="benchmarks") emit(await (await api("/benchmarks",{auth:false})).json());
  else throw new Error("Use status [project], jobs, submit file [key], inspect ID, wait ID [seconds], cancel ID, artifact ID [file], upload file, or benchmarks.");
} catch(error) {
  console.error(error.message);
  if(error.body?.receipt) console.error(JSON.stringify(error.body.receipt));
  process.exitCode=1;
}
