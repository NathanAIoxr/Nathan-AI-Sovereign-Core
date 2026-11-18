import { Miniflare } from "miniflare";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const workers=JSON.parse(await readFile(new URL("./workers.json",import.meta.url)));
const reports=[];
for (const worker of workers) {
  const code=await readFile(new URL("./build/"+worker.name+".mjs",import.meta.url),"utf8");
  const name=worker.name;
  const mf=new Miniflare({workers:[{config:{
    name,compatibilityDate:"2026-11-18",compatibilityFlags:worker.cloudflare_compatibility_flags,
    manifest:{mainModule:"index.mjs",modules:{"index.mjs":{type:"esm",contents:code}}}
  }}]});
  try {
    const response=await mf.dispatchFetch("https://edge.test"+worker.probe_path,{headers:{"CF-Connecting-IP":"192.0.2.10"}});
    const body=await response.text();
    assert.equal(response.status,200);
    if (name.endsWith("-uuid")) assert.match(body,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    else if(name.endsWith("-request-ip")) assert.match(body,/^(?:192\.0\.2\.10|127\.0\.0\.1)$/);
    else assert.ok(body.includes(worker.marker),"Missing response marker: "+body.slice(0,150));
    if (name.endsWith("-bulk-redirects")) {
      const hop=await mf.dispatchFetch("https://edge.test/bulk1",{redirect:"manual"});
      assert.equal(hop.status,302);
      assert.equal(new URL(hop.headers.get("location")).pathname,"/docs");
    }
    if (name.endsWith("-security-headers")) assert.equal(response.headers.get("x-frame-options"),"DENY");
    if (name.endsWith("-response-headers")) {
      assert.equal(response.headers.get("x-example"),"updated");
      assert.equal(response.headers.get("x-remove"),null);
    }
    if (name.endsWith("-country-routing")) assert.equal(await (await mf.dispatchFetch("https://edge.test/ja")).text(),"ようこそ");
    if (name.endsWith("-body-inspector")) {
      const accepted=await mf.dispatchFetch("https://edge.test/",{method:"POST",headers:{"content-type":"application/json"},body:"{}"});
      assert.equal(accepted.status,200);
      assert.deepEqual(await accepted.json(),{contentType:"application/json",bytes:2,type:"object"});
      const excessive=await mf.dispatchFetch("https://edge.test/",{method:"POST",headers:{"content-type":"text/plain"},body:"a".repeat(32769)});
      assert.equal(excessive.status,413);
    }
    if (name.endsWith("-qr-svg")) {
      assert.match(response.headers.get("content-type"),/image\/svg/);
      assert.equal((await mf.dispatchFetch("https://edge.test/?url=x&margin=9000")).status,400);
    }
    if (name.endsWith("-social-card")) {
      const result=await mf.dispatchFetch("https://edge.test/api/og?title=%3Cscript%3E");
      const markup=await result.text();
      assert.ok(markup.includes("&lt;script&gt;"));
      assert.ok(!markup.includes("<script>"));
    }
    reports.push({name,local_status:"passed"});
  } catch(error) {
    reports.push({name,local_status:"failed",cause:String(error)});
    process.exitCode=1;
  } finally {await mf.dispose();}
}
console.log(JSON.stringify(reports,null,2));
