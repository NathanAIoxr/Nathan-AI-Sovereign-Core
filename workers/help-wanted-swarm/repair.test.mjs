import assert from "node:assert/strict";
import test from "node:test";
import { externalJob, githubJob, pageUrl, validResult } from "./repair.mjs";

test("canonical internal identities stay in the internal lane", () => {
  const row = githubJob({
    url: "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/issues/233",
    title: "Document project adoption",
  }, "GLOBAL", 100);
  assert.equal(row[0], "github:nathanai"+"oxr/nathan-ai-sovereign-core#233");
  assert.equal(row[1], "INTERNAL");
  assert.equal(githubJob({url:"https://example.test/issues/233",title:"Foreign"}, "GLOBAL", 100), null);
});

test("Bugzilla snapshots only admit open, public, tagged entries", () => {
  const config = {type:"bugzilla",endpoint:"https://bugzilla.mozilla.org/rest/bug",label:"good-first-bug"};
  const issue = {id:15,summary:"Fix docs",keywords:["good-first-bug"],groups:[],is_open:true};
  assert.equal(externalJob(config, issue, 100)[0], "bugzilla:bugzilla.mozilla.org#15");
  assert.equal(externalJob(config, {...issue,groups:["private"]}, 100), null);
  assert.equal(externalJob(config, {...issue,is_open:false}, 100), null);
  assert.deepEqual(pageUrl(config,12).searchParams.getAll("status"), ["UNCONFIRMED","NEW","ASSIGNED","REOPENED"]);
});
test("verification requires both a patch and passing test evidence", () => {
  const receipt = {base:"a".repeat(40),patch:"diff --git a/x b/x",tests:[]};
  assert.equal(validResult("PATCH_READY",receipt), true);
  assert.equal(validResult("VERIFIED",receipt), false);
  assert.equal(validResult("VERIFIED",{...receipt,tests:[{command:"node --test",exitCode:0}]}), true);
  assert.equal(validResult("VERIFIED",{...receipt,tests:[{command:"node --test",exitCode:1}]}), false);
});
