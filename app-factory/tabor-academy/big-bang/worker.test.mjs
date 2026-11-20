import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { buildModule, patchAcademyEntry } from "./build.mjs";

const revision = "4".repeat(40);
const { default: connect } = await import("data:text/javascript;base64," + Buffer.from(await buildModule(revision)).toString("base64"));
const academy = { fetch: req => new Response(new URL(req.url).pathname) };
const worker = connect(academy);
const get = (path, method) => worker.fetch(new Request("https://academy.example" + path, { method }));

test("the authored motto and charter appear unchanged with all six pathways", async () => {
  const response = await get("/big-bang/");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-tabor-big-bang-revision"), revision);
  const html = await response.text();
  assert.ok(html.includes("If you don’t know truth, you don’t know True love because love without truth is tough love …"));
  assert.ok(html.includes("while love with truth is unconditional love"));
  assert.ok(html.includes("The motto, heart, soul, shadow, spirit, nothing and everything of Tabor Academy"));
  for (const id of ["heart", "soul", "shadow", "spirit", "nothing", "everything"]) {
    assert.ok(html.includes('<article id="' + id + '">'));
  }
  assert.equal(html, await readFile(new URL("index.html", import.meta.url), "utf8"));
});

test("only the Big Bang asset routes are claimed and the release is pinned", async () => {
  assert.equal((await get("/big-bang")).headers.get("location"), "./big-bang/");
  assert.equal((await get("/big-bang/", "HEAD")).body, null);
  assert.equal((await get("/big-bang/", "POST")).status, 405);
  assert.equal((await get("/big-bang/constructor")).status, 404);
  assert.deepEqual(await (await get("/big-bang/healthz")).json(), {
    service: "tabor-academy-big-bang", ready: true, revision
  });
  assert.equal(await (await get("/other")).text(), "/other");
});

test("the live entry wrapper is additive and repeatable", () => {
  const entry = 'import academy from "./worker.mjs";\nexport default { ...academy };\n';
  const patched = patchAcademyEntry(entry);
  assert.equal(patchAcademyEntry(patched), patched);
  assert.match(patched, /export default withBigBang\(\{ \.\.\.academy \}\);/);
  assert.throws(() => patchAcademyEntry("export default academy"), /Unrecognized/);
});


test("the release supplies the canonical words and approved workspace routes", async () => {
  const html = await (await get("/big-bang/")).text();
  for (const path of ["../workspace/?panel=voice", "../workspace/?panel=verify", "../workspace/?panel=matrix", "../workspace/?panel=matrix&amp;mode=0", "../library/"]) {
    assert.ok(html.includes('href="' + path + '"'));
  }
  const canon = await (await get("/big-bang/canon.json")).json();
  assert.equal(canon.motto.length, 2);
  for (const line of canon.motto) assert.ok(html.includes(line));
  const module = await buildModule(revision, { withWorkspace: true });
  assert.match(module, /^import privateWorkspace from "\.\/academy-workspace-dispatch\.mjs";/);
});
