import { describe, expect, test } from "vitest";
import table from "../../../registry/os-syscall-table.json";
import { handlers } from "../../../registry/handlers.ts";
import { router, syscall } from "./router.ts";

const req=(path:string,payload?:unknown)=>new Request("https://example.test"+path,payload===undefined?undefined:{
  method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)
});

test.each([...handlers])("%s executes a deterministic, JSON-readable fixture",async(id)=>{
  const result=await syscall(id,undefined,{});
  expect(result.ok,result.error?.message).toBe(true);
  const a=JSON.stringify(result.data);
  expect(a).toBeDefined();
  const second=await syscall(id,undefined,{});
  expect(JSON.stringify(second.data)).toBe(a);
});

describe("gateway",()=>{
  test("covers all 505 IDs with honest executable status",async()=>{
    expect(table).toHaveLength(505);
    expect(new Set(table.map(row=>row.id)).size).toBe(505);
    expect(table.filter(x=>x.id.match(/^0\d\d$|^10[01]$/)&&x.status==="executable")).toHaveLength(101);
    expect((await router(req("/api/modules/102/sample"),{})).status).toBe(501);
    expect((await router(req("/api/modules/OG-097/sample"),{})).status).toBe(501);
  });
  test("classic calculators, hashes and scientific fixtures",async()=>{
    expect((await syscall("OG-073",undefined,{})).data).toBe(6);
    expect((await syscall("OG-083",undefined,{})).data).toMatchObject({accumulator:8});
    expect((await syscall("006",undefined,{})).data).toBe(0xcbf43926);
    expect((await syscall("003",{text:""},{})).data).toBe("af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262");
    expect((await syscall("030",undefined,{})).data).toEqual({bin:2,power:16});
    expect((await syscall("047",undefined,{})).data).toEqual({x:4,y:4,squaredError:0});
  });
  test("MCP and DAG reject unsupported actions, cycles and caller privilege claims",async()=>{
    const rs=await router(req("/mcp",{jsonrpc:"2.0",id:1,method:"tools/call",params:{name:"syscall_OG_073"}}),{});
    expect(await rs.json()).toMatchObject({result:{isError:false}});
    const resp=await router(req("/api/plan",[{id:"a",syscall:"001",after:["b"]},{id:"b",syscall:"004",after:["a"]}]),{});
    expect(resp.status).toBe(400);
    const piped=await router(req("/api/plan",[{id:"rms",syscall:"022",after:["vec"],from:"vec",into:"samples"},{id:"vec",syscall:"OG-081"}]),{});
    expect(await piped.json()).toMatchObject({order:["vec","rms"],outputs:{vec:[4,6],rms:Math.sqrt(26)}});
    const unsafe=await router(req("/syscall",{syscall_id:"300",caller_context:{auth_level:"admin"},payload:{code:"ignored"}}),{});
    expect(unsafe.status).toBe(501);
  });
  test("ACT preserves 20 original rows and records all 160 16-bit seals",async()=>{
    const data=await (await router(req("/api/act"),{})).json() as {nodes:{slug:string;binary_seal:string;value_text:string}[];counts:number[]};
    expect(data.counts).toEqual([20,40,80,160]);
    expect(new Set(data.nodes.map(n=>n.slug)).size).toBe(160);
    expect(data.nodes.every(n=>n.binary_seal.length===16)).toBe(true);
    expect(data.nodes.find(n=>n.slug==="act-recorded-value-1-168")?.value_text).toBe("1.168");
  });
});
