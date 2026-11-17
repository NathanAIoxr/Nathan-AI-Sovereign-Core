const cloud = id => 'https://' + id + '.nathantaboract.workers.dev/';

export const ownerLinks = Object.freeze([
  {title:'Absolute Intelligence',href:cloud('nathan-absolute-intelligence'),description:'Model jobs and owner approvals'},
  {title:'ONE owner hub',href:cloud('one-sovereign-hub'),description:'Private work and approvals'},
  {title:'Library of Tabor · owner archive',href:cloud('nathan-tabor-library'),description:'Manuscripts and author review'},
]);

export const directory = Object.freeze([
  {heading:'Play',entries:[
    ['Mind of Nathan Tabor','/play/mind','Play a shot, replay it, and change the wind.'],
    ['Labs Player Edition','/play/labs','134 playable challenges.'],
    ['Release the Hounds of Hell','/play/hounds','Arcade defense.'],
    ['Tabor World',cloud('tabor-world'),'Explore the world and its connected games.'],
    ['Tabor Track Baller',cloud('tabor-tracker-ball'),'Trackball, gestures and tactile physics.'],
    ['Universal Library Engine',cloud('tabor-universal-library-engine'),'Playable cartridges and the project ledger.'],
    ['Dual-Screen Arcade',cloud('dual-screen-arcade'),'Pair a puzzle with an action game.'],
    ['Grapple It',cloud('grapple-it'),'Swing, release and aim.'],
    ['Hook & Ring',cloud('hook-and-ring'),'Ring catches and precision flicks.'],
    ['BIBLeTopia',cloud('bibletopia'),'Explore Bible worlds and activities.'],
    ['Tabor Saturday Morning',cloud('tabor-saturday-morning'),'Open the Saturday Morning collection.'],
  ]},
  {heading:'Build and inspect',entries:[
    ['Nathan Tabor Labs workbench','/workbench','Quantum circuit simulation, Boolean adder and edge calculation.'],
    ['Tabor Database Atlas',cloud('tabor-database-atlas'),'Hosted projects, import receipts and queue status.'],
    ['Sovereign Field Lab source','https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/octopus-root/sovereign-fields','Research code and simulation models.'],
  ]},
  {heading:'Read and explore',entries:[
    ['Tabor World App Portfolio',cloud('tabor-app-portfolio'),'Browse the app, game, world and library catalog.'],
    ['Pee and Dee picture books',cloud('pee-and-dee-books'),'Picture-book collection.'],
    ['Pee Dee Valley editions',cloud('pee-dee-valley-editions'),'Book editions and series.'],
    ['Tower of Babel by Nathan Tabor',cloud('tower-of-babel-by-nathan-tabor'),'Read the language and history project.'],
  ]},
  {heading:'Workers',entries:[
    ['Worker status','/workers','Latest home checks and fleet receipts.'],
    ['Nathan AI Fleet',cloud('nathan-ai-fleet'),'Worker and supervisor coverage.'],
    ['Sovereign Hive',cloud('nathan-ai-sovereign-hive'),'Hive queue and status.'],
    ['Worker Catalog',cloud('nathan-ai-workers'),'Worker roles and project records.'],
    ['Help Wanted',cloud('nathan-ai-help-wanted-live'),'Open the public queue dashboard.'],
  ]},
  {heading:'Owner workspaces',entries:ownerLinks.map(link=>[link.title,link.href,link.description])},
]);
