import test from "node:test";
import assert from "node:assert/strict";
import {auditPublicGraph} from "./public-safety-audit.mjs";
test("public persona registry has no static privacy or active integration findings",()=>{
 const report=auditPublicGraph();
 assert.equal(report.safe,true,JSON.stringify(report.findings));
 assert.equal(report.dispatch,false);
 assert.ok(report.checked.nodes>=20);
});
test("rejects markup, secrets, dangling edges and active integrations",()=>{
 const report=auditPublicGraph({nodes:[{id:"a",name:"A",kind:"persona",summary:"<img src=x> bearer token"}],edges:[{from:"a",to:"missing"}],integrations:[{id:"x",mode:"dispatch"}]});
 assert.equal(report.safe,false);
 assert.deepEqual(new Set(report.findings.map(f=>f.code)),new Set(["embedded_markup","possible_secret","dangling_edge","active_external_integration"]));
});
