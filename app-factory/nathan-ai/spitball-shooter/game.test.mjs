import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createContext,runInContext} from "node:vm";

const html = await readFile(new URL("./index.html",import.meta.url),"utf8");
const moduleSource = html.split('<script type="module">')[1].split("</script>")[0];
function game() {
  const elements = new Map();
  const getElementById = id => {
    if (!elements.has(id)) elements.set(id, {
      value:"", style:{},lastElementChild:{style:{},dataset:{}},getContext(){return {};},
      addEventListener(){},setAttribute(){},focus(){},replaceChildren(){}
    });
    return elements.get(id);
  };
  const context = createContext({
    document:{getElementById,addEventListener(){}}, window:{addEventListener(){}},
    Option:class {}, requestAnimationFrame(){}, performance:{now(){return 0;}}
  });
  runInContext(moduleSource,context);
  return expression => runInContext(expression,context);
}

test("sweet spot reaches all three stationary target centers",()=>{
  const run = game();
  assert.equal(run(`targets.filter(t=>!t.bonus).every(t=>{
    aim=position(t);const shot=launch(.76);
    for(let i=0;i<86;i++) advance(shot,1/120,i/120);
    return Math.hypot(t.x-shot.x,t.y-shot.y)<3;
  })`),true);
});

test("a foil pellet can reach the bank ring after a real reflection",()=>{
  const run = game();
  const result = run(`
    setLevel(2);
    let answer = null;
    for(let x=723;x<=885 && !answer;x+=4) for(let y=55;y<=340 && !answer;y+=4){
      aim={x,y};
      const shot=launch(.76);
      for(let i=1;i<250;i++){
        if(!advance(shot,1/120,i/120))break;
        const t=targets.find(t=>!t.hit&&Math.hypot(t.x-shot.x,t.y-shot.y)<=t.r+shot.payload.radius);
        if(t){if(t.bank&&shot.banks)answer={x,y};break;}
      }
    }
    answer`);
  assert.ok(result,"bank ring reachable from a visible aim point");
});

test("teacher warning, ducking, detention and checkpoint retry",()=>{
  const run = game();
  assert.equal(run('show("playing"); clock=5.5; patrol()'),"warn");
  assert.equal(run('startCharge("keyboard"); toggleDuck(); charge'),null);
  assert.equal(run('toggleDuck(); clock=6.7; startCharge("keyboard"); takeShot("keyboard"); state'),"detention");
  assert.equal(run('clock=6.7; dustUntil=7; patrol()'),"dust");
});

test("final round requires heavy ammo and supports double-barrel fire",()=>{
  const run = game();
  assert.equal(run('setLevel(3); selectStraw(0); gear().compatible'),false);
  assert.equal(run('const armored=targets[0]; $("ammo").value="0"; hit(armored,launch(.76),armored); armored.hit'),false);
  assert.equal(run('show("playing"); $("ammo").value="3"; selectStraw(2); startCharge("keyboard"); performance.now=()=>850; takeShot("keyboard"); bullets.length'),2);
  assert.equal(run('hit(armored,bullets[0],armored); armored.hit'),true);
});

test("bamboo costs tickets once, equips immediately and is remembered",()=>{
  const run = game();
  assert.equal(run('chooseStraw(3); settings.tickets'),15);
  assert.equal(run('gear().barrel.id'),"bamboo");
  assert.equal(run('launch(.65).optimal && launch(.76).windScale<1'),true);
  assert.equal(run('chooseStraw(3); settings.tickets'),15);
  assert.equal(run('chooseStraw(10)'),false);
  assert.equal(run('setLevel(1); gear().barrel.id'),"bamboo");
});

test("tickets earned during a round commit exactly once on clear",()=>{
  const run = game();
  assert.equal(run(`
    show("playing");
    const file = targets.filter(target=>!target.bonus);
    for(const t of file) hit(t,launch(.76),t);
    step(1/120);
    settings.tickets
  `),30);
  assert.equal(run('while(state==="playing") step(1/120); settings.tickets'),89);
  assert.equal(run('setLevel(1); settings.tickets'),89);
});

test("last-round retry starts with compatible gear",()=>{
  const run = game();
  assert.equal(run('setLevel(3); setLevel(3); gear().compatible'),true);
});
