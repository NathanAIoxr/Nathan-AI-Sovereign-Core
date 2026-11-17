import assert from "node:assert/strict";
import test from "node:test";
import {classes, modules} from "./public/loc101-catalog.mjs";
import {applyStroke, choose, completed, fieldForce, logicValues, markers, matchesModule,
  newScene, profiles, rotate, traceMatches, turn} from "./public/loc101-core.mjs";
import {project, TAU} from "./public/track-baller.mjs";

test("the brief has 101 ordered, searchable modules in all 21 classes", () => {
  assert.deepEqual(modules.map(({id}) => id), Array.from({length:101},(_, index) => index + 1));
  assert.equal(Object.keys(classes).length,21);
  assert.equal(new Set(modules.map(({classCode}) => classCode)).size,21);
  assert.equal(new Set(modules.map(({title}) => title)).size,101);
  assert.equal(new Set(modules.map(({profile}) => profile)).size,Object.keys(profiles).length);
  for (const module of modules) {
    const {id, title, brief, items, task, profile, classCode} = module;
    assert.ok(title && brief && task && profiles[profile] && classes[classCode], "module " + id);
    assert.ok(items.length >= 3 && items.every(({name,detail}) => name && detail));
    assert.equal(new Set(items.map(({name}) => name)).size, items.length);
    for (const {classLink} of items) if (classLink) assert.ok(classes[classLink]);
    assert.ok(matchesModule(module, title.toUpperCase(), classCode, classes, false, new Set()));
    assert.ok(matchesModule(module, "", classCode, classes, true, new Set([id])));
  }
  assert.ok(matchesModule(modules[88], "artillery", "U", classes, false, new Set()));
  assert.equal(modules[4].items.filter(item => item.text).length,3);
});

test("every module initializes with finite markers and has a valid route to completion", () => {
  for (const module of modules) {
    const scene = newScene(module);
    assert.ok(markers(scene).every(({x,y}) => Number.isFinite(x) && Number.isFinite(y)));
    assert.equal(completed(scene),false);
    if (module.profile === "link") {
      for (let index = 0; index < module.items.length - 1; index++) {
        choose(scene,index); choose(scene,index+1);
      }
    } else {
      module.items.forEach((_,index) => choose(scene,index));
    }
    assert.equal(completed(scene),true,"module " + module.id);
    assert.equal(completed(newScene(module)),false);
  }
});

test("trace requires ordered checkpoints and link completion requires actual edges", () => {
  const trace = newScene(modules[42]);
  const path = markers(trace);
  assert.equal(traceMatches([...path].reverse(),path),false);
  assert.equal(traceMatches(path,path),true);
  applyStroke(trace,{kind:"drag",path});
  assert.equal(completed(trace),true);
  const link = newScene(modules[99]);
  choose(link,0); choose(link,2);
  assert.equal(link.edges.size,0);
  choose(link,0); choose(link,1);
  assert.equal(completed(link),false);
  choose(link,2); choose(link,1);
  assert.equal(completed(link),true);
});

test("quaternion projection preserves lengths and dial motion wraps", () => {
  const scene = newScene(modules[66]);
  rotate(scene,.4,.55,-.23);
  const rotated = project(scene.orientation,[1,0,0]);
  assert.ok(Math.abs(1 - Math.hypot(...rotated)) < 1e-12);
  assert.ok(Math.abs(rotated[2]) > .1);
  const dial = newScene(modules[2]);
  turn(dial,-TAU/4);
  assert.equal(dial.active,3);
  turn(dial,TAU/4);
  assert.equal(dial.active,0);
});

test("field response falls with distance and logic gates compute each truth combination", () => {
  assert.ok(Number.isFinite(fieldForce(0)));
  assert.ok(fieldForce(.20) > fieldForce(.45) && fieldForce(.45) > fieldForce(.80));
  assert.deepEqual([0,1,2,3].map(logicValues),[
    {AND:true,OR:true,XOR:false}, {AND:false,OR:true,XOR:true},
    {AND:false,OR:true,XOR:true}, {AND:false,OR:false,XOR:false},
  ]);
});
