import assert from "node:assert/strict";
import test from "node:test";
import bot from "../src/bot.js";

const req = (path, method = "GET", host = "station.internal") => new Request("https://"+host+path,{method});

test("dispatch bot routes only the exact project and verified health",async () => {
  const response = await bot.fetch(req("/work/taborpool/"),{});
  assert.equal(response.headers.get("location"),"https://taborpool.pages.dev/app/");
  const health = await bot.fetch(req("/work/taborpool/healthz"),{DB:{prepare:()=>({first:async()=>({verified_at:42})})}});
  assert.deepEqual(await health.json(),{id:"taborpool",worker:"taborpool-worker",version:"2026-11-19.2",ready:true,last_verified_at:42});
  assert.equal((await bot.fetch(req("/sources/codex-1.txt"),{})).status,404);
  assert.equal((await bot.fetch(req("/__hub/refresh"),{})).status,404);
  assert.equal((await bot.fetch(req("/__hub/refresh","POST","taborpool.pages.dev"),{})).status,404);
  assert.equal((await bot.fetch(req("/work/taborpool/__hub/refresh","POST"),{})).status,405);
});
