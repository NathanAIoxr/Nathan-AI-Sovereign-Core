'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const game=require('../app-factory/one/trial-matrix/engine.js');
const base=process.env.ONE_V025_URL||'http://127.0.0.1:8002';
const entry=base+'/app-factory/one/trial-matrix/';
const storage='one.private.v025.progress.v1';
async function snapshot(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),storage);}
async function imported(page,level,mode='campaign'){
 const save=game.save(game.initial(level,123,false,0,mode==='campaign'?{mode,difficulty:'story'}:{}));
 await page.locator('#import').setInputFiles({name:'v025-session.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(save))});
 await page.waitForFunction(({key,level,mode})=>{const s=JSON.parse(localStorage.getItem(key))?.save?.session;return s?.level===level&&s.moves===0&&s.status==='playing'&&!!s.strategy===(mode==='campaign');},{key:storage,level,mode});
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const errors=[];
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-20T16:00:00Z')});await page.clock.pauseAt(new Date('2026-10-20T16:00:01Z'));await page.goto(entry);
  assert.equal(await page.locator('#level-nav button').count(),33);assert.match(await page.title(),/Private ONE v025/);
  for(let level=1;level<=33;level++){
   await imported(page,level);let n=0;
   while(!/TRIAL COMPLETE|TRIAL FAILED/.test(await page.locator('#feedback').innerText())&&n++<160){
    if(await page.locator('#ward').isEnabled())await page.locator('#ward').click();
    const state=(await snapshot(page)).save.session,analysis=game.analyze(state);
    if(analysis.length&&await page.locator('#forecasts button').first().isEnabled()){
     const symbols=analysis[0].symbols;await page.locator('#forecasts button').nth(symbols.indexOf(Math.max(...symbols))).click();
    }
    await page.locator('#hint').click();
    if(await page.locator('#apply-hint').isEnabled()){
     if(level===6&&n===1){
      const text=await page.locator('#feedback').innerText(),slots=[...text.matchAll(/slot (\d+)/g)].map(x=>Number(x[1])-1);assert.equal(slots.length,2);
      for(const i of slots){const tile=page.locator('#board [data-slot="'+i+'"]');await tile.focus();await page.keyboard.press('Space');}
     }else await page.locator('#apply-hint').click();
    }
    if(level===5)await page.clock.runFor(2000);
   }
   assert.match(await page.locator('#feedback').innerText(),/TRIAL COMPLETE/,'campaign '+level);
   const state=(await snapshot(page)).save.session;assert.equal(state.strategy.guardianHealth,0);assert.ok(state.progress>=game.LEVELS[level-1].goal);
   console.log('PASS desktop campaign',level);
  }
  const complete=await snapshot(page);assert.equal(complete.profile.completed.length,33);assert.equal(Object.keys(complete.profile.mastery).length,33);assert.equal(complete.profile.coins,3400);assert.equal(complete.profile.gems,48);
  const downloadEvent=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadEvent;await download.saveAs(path.join(__dirname,'v025-verified-progress.json'));
  await page.reload();assert.match(await page.locator('#wallet').innerText(),/33\/33 completed/);assert.equal((await snapshot(page)).profile.coins,3400);
  await page.screenshot({path:path.join(__dirname,'v025-desktop.png'),fullPage:true});
  const mobileContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});const phone=await mobileContext.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(entry);
  await phone.locator('#import').setInputFiles(path.join(__dirname,'v025-verified-progress.json'));await phone.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.profile.completed.length===33,storage);
  for(const level of [6,8,10,14,23,24,25,26,27,28,31,32,33]){
   await phone.locator('#level-nav button').nth(level-1).tap();assert.equal(await phone.locator('#guardian-name').innerText(),game.strategy.GUIDES[level-1].guardian);
   await phone.getByRole('button',{name:'Fortify',exact:true}).tap();
   if(level===8){await phone.getByRole('button',{name:'Hide symbols',exact:true}).tap();assert.equal(await phone.locator('#board .tile').first().innerText(),'?');await phone.getByRole('button',{name:'Study symbols (free)',exact:true}).tap();}
   if(level===23)await phone.getByRole('button',{name:'Dark state',exact:true}).tap();
   if(level===26)await phone.getByRole('button',{name:'Inspect weights (free)',exact:true}).tap();
   await phone.locator('#dock-hint').tap();await phone.locator('#dock-play').tap();
   assert.ok(!await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'no mobile overflow '+level);
   const state=(await snapshot(phone)).save.session;assert.ok(state.strategy.heroTurns>=1);
  }
  await phone.locator('#analysis-panel > summary').tap();await phone.waitForSelector('#analysis-list button');assert.ok(await phone.locator('#analysis-list button').count()>0);await phone.locator('#analysis-list button').first().tap();await phone.locator('#dock-play').tap();
  await phone.locator('#board-panel').scrollIntoViewIfNeeded();await phone.screenshot({path:path.join(__dirname,'v025-mobile.png'),fullPage:true});
  await phone.locator('#daily-run').tap();const daily1=(await snapshot(phone)).save.session;await phone.locator('#daily-run').tap();const daily2=(await snapshot(phone)).save.session;assert.equal(daily1.seed,daily2.seed);assert.deepEqual(daily1.board,daily2.board);
  await phone.locator('#play-mode').selectOption('practice');await phone.locator('#start-run').tap();assert.equal(await phone.locator('#campaign-panel').isVisible(),false);assert.equal((await snapshot(phone)).save.session.strategy,undefined);
  const before=await phone.evaluate(key=>localStorage.getItem(key),storage);await phone.locator('#import').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"schema":"invalid"}')});await phone.waitForFunction(()=>document.getElementById('feedback').textContent.startsWith('Save import failed:'));assert.equal(await phone.evaluate(key=>localStorage.getItem(key),storage),before);
  const blocked=await browser.newContext();await blocked.addInitScript(()=>{Storage.prototype.setItem=function(){throw Error('Storage disabled');};});const blockedPage=await blocked.newPage();blockedPage.on('pageerror',e=>errors.push(e.message));await blockedPage.goto(entry);assert.match(await blockedPage.locator('#storage-status').innerText(),/storage unavailable/);await blockedPage.locator('#hint').click();await blockedPage.locator('#apply-hint').click();assert.ok(await blockedPage.locator('#guardian-name').isVisible());
  const one=await context.newPage();one.on('pageerror',e=>errors.push(e.message));await one.goto(base+'/app-factory/one/');await one.locator('[data-view="trials"]').click();const frame=one.frameLocator('iframe[src="./trial-matrix/index.html"]');await frame.locator('#level-nav button').nth(32).click();assert.equal(await frame.locator('#guardian-name').innerText(),'The Null King');
  assert.deepEqual(errors,[]);console.log('PASS keyboard play, mobile touch, strategy lab, daily repeatability, mastery rewards, legacy import, full export/reload, invalid import preservation, unavailable-storage play, and private ONE integration. No browser exceptions.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
