// Grapple It by Nathan Tabor — original roster and progression.
export const WORDMARK = 'GRAPPLE = GRAPE 🍇 APE 🦍 LE ☸️ APPLE 🍎 = EL 🧟♂️ APP ♌️ EL 🎶 EPA ☢️ EP 🔮 AR 🔫 G 🪐';
export const CAST = {
  forms: [
    {id:'male', name:'Male', mark:'🍇', color:'#dbc1ff', pronouns:'he / him'},
    {id:'female', name:'Female', mark:'🍎', color:'#ff92c8', pronouns:'she / her'},
  ],
  nathan: {name:'Nathan AI 🚀', role:'Absolute Intelligence', modes:['Coach','Full On']},
  pk: {name:'PK 🐽', line:'PK .. that’s the wild card .. that boy ain’t rite …', levels:['Wild Card','Full Chaos'],
    origin:'He came from the pig 🐽 farmer and the sow (my momma) haha 🤣'},
  curator: {name:'Grape 🍇 Apple 🍎', role:'Gear trials and progression'},
};
export const RULES = {
  pendulum:{name:'Pendulum', hint:'Release through the catch window as the ring swings across.'},
  latch:{name:'Latch & reel', hint:'Catch the anchor, then reel in the green. Ease before the line snaps.'},
  bounce:{name:'Bank shot', hint:'The marker reverses direction off the rail. Time the return through the catch zone.'},
  single:{name:'Precision throw', hint:'Read the wind and release inside the narrow target window.'},
  spin:{name:'Spin & stick', hint:'Release when position and the rotating mark both line up.'},
  tether:{name:'Tension control', hint:'Latch, then reel through swells. A heavy load will punish a long pull.'},
  heavy:{name:'Heavy throw', hint:'Hold to charge. Release on the target with at least 55% charge.'},
  chain:{name:'Chain reaction', hint:'Hit the primary target, then catch the second window before it closes.'},
  return:{name:'Return arc', hint:'Release as the marker is coming back toward the launch edge.'},
};
const gear = (id,name,icon,rule,timing,force) => ({id,name,icon,rule,timing,force});
export const TIERS = [
  {id:'backyard',name:'The Backyard & Bar',target:'Brass peg',scene:'YARD',color:'#cce590',wind:.034,tempo:1,gear:[
    gear('brass-ring','Brass Ring','◎','pendulum',.19,1),gear('rope','Rope','↪','latch',.18,1),
    gear('horseshoes','Horseshoes','Ω','bounce',.17,1.04),gear('pub-darts','Pub Darts','➶','single',.125,.93)]},
  {id:'fair',name:'County Fair & Wild West',target:'Moving post',scene:'MIDWAY',color:'#ffbe7d',wind:.049,tempo:1.08,gear:[
    gear('duck-hooks','Spinning Duck Hooks','✷','spin',.17,1.02),gear('lasso','Cowboys’ Lasso','↻','latch',.15,1.06),
    gear('reel','Fishing-Rod Reel','⟲','tether',.16,1.10)]},
  {id:'worksite',name:'The Worksite & Lumberyard',target:'Timber block',scene:'LUMBER',color:'#ecab87',wind:.043,tempo:1.13,gear:[
    gear('hammer','Framing Hammers','⊤','heavy',.16,1.03),gear('sledge','Heavy Sledgehammers','▰','heavy',.14,.88),
    gear('axe','Throwing Axes','◩','spin',.15,.94)]},
  {id:'shadow',name:'Feudal Shadow Arsenal',target:'Lantern ring',scene:'SHADOW',color:'#e4baef',wind:.069,tempo:1.22,gear:[
    gear('stars','Chinese Throwing Stars (Shuriken)','✧','spin',.145,.93),gear('hairpins','Killer Hairpins (Kanzashi)','❖','single',.107,.85),
    gear('kaginawa','Ninja Kaginawa Grapple','⚓','latch',.14,1.05)]},
  {id:'naval-gear',name:'Ancient Naval & Siege',target:'Floating marker',scene:'HARBOR',color:'#8bddd8',wind:.086,tempo:1.15,gear:[
    gear('corvus','Roman Corvus Boarding Grapple','▤','latch',.155,1.03),gear('harpoons','Harpoons','↟','tether',.145,.93),
    gear('crossbows','Crossbows','⤒','single',.116,.95),gear('wrist-bows','Wrist-Bows','⤊','single',.123,.86)]},
  {id:'junkyard',name:'PK’s Secret Junkyard',target:'Swinging feed bucket',scene:'HOG WILD',color:'#f6acd3',wind:.100,tempo:1.27,gear:[
    gear('firework','Exploding Firework Rings','✹','chain',.168,1.04),gear('boomerangs','Boomerangs','⤳','return',.16,1.06),
    gear('candy','Holiday Candy-Cane Hooks','♧','latch',.16,1.03),gear('chickens','Rubber Chickens','♬','bounce',.17,1.08),
    gear('skillet','Cast-Iron Skillet & Bacon Hook','◉','heavy',.14,.92),gear('lucky','The Lucky Horseshoe','Ω','bounce',.14,1.07),
    gear('paint','The “Sunday Best” Paint Can','▣','chain',.145,1.01)]},
];
export const REWARD = {title:'Family Reunion', badge:'Tabor Survivor', coins:2500,
  gear:gear('golden-piggy','Golden Piggy Bank Ring 🐽','🐽','bounce',.18,1.07)};
export const EXPEDITIONS = [
  {id:'roman-mooring',name:'Roman Harbor Mooring',gear:'corvus',target:'Training barge ring',goal:145,layout:.035},
  {id:'roman-drive-by',name:'Roman Naval Drive-By',gear:'corvus',target:'Passing galley marker',goal:165,layout:-.065},
  {id:'harbor-wreckage',name:'Harbor Wreckage Dredging',gear:'harpoons',target:'Sunken cargo chest',goal:150,layout:.065},
  {id:'castle-lantern',name:'Lantern Court Traverse',gear:'kaginawa',target:'Swinging lantern anchor',goal:145,layout:.045},
  {id:'castle-battlement',name:'Castle Battlement Hook-Climb',gear:'kaginawa',target:'Upper stone anchor',goal:165,layout:-.05},
  {id:'frontier-stagecoach',name:'Frontier Stagecoach Loop',gear:'lasso',target:'Stagecoach prop',goal:155,layout:-.02},
  {id:'frontier-rodeo',name:'Cowboy Rodeo Lasso',gear:'lasso',target:'Moving fence post',goal:165,layout:.075},
  {id:'modern-rescue',name:'Modern Cliff Rescue',gear:'rope',target:'Rescue sled',goal:160,layout:-.06},
  {id:'volcano-cliff',name:'Volcano Cliff Swing',gear:'rope',target:'Overhead cliff anchor',goal:165,layout:.08},
];
export const GEAR = new Map(TIERS.flatMap(tier=>tier.gear.map(item=>[item.id,{...item,tier}])));
GEAR.set(REWARD.gear.id,{...REWARD.gear,tier:TIERS.at(-1)});
