'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const g=require('/workspace/Nathan-AI-Sovereign-Core/app-factory/one/trial-matrix/engine.js');
const url='http://127.0.0.1:8000/app-factory/one/trial-matrix/';
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
 const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-10-20T16:00:00Z')});
 await page.goto(url);assert.equal(await page.locator('#level-nav button').count(),33);
 for(let level=1;level<=33;level++){
  await page.locator('#import').setInputFiles({name:'trial.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(g.save(g.initial(level,123,false,0))))});
  await page.waitForFunction(level=>{const data=JSON.parse(localStorage.getItem('one.33trial.progress.v1'));return data?.save?.session.level===level&&data.save.session.moves===0&&data.save.session.status==='playing';},level);
  let n=0;
  while(!/TRIAL COMPLETE|TRIAL FAILED/.test(await page.locator('#feedback').innerText())&&n++<150){
   await page.locator('#hint').click();
   if(await page.locator('#apply-hint').isEnabled()){
    if(level===6&&n===1){const text=await page.locator('#feedback').innerText();const slots=[...text.matchAll(/slot (\d+)/g)].map(m=>Number(m[1])-1);assert.equal(slots.length,2);for(const slot of slots)await page.locator('.expanded-board button[data-slot="'+slot+'"]').click();}
    else await page.locator('#apply-hint').click();
   }
   if(level===5)await page.clock.runFor(2000);
  }
  assert.match(await page.locator('#feedback').innerText(),/TRIAL COMPLETE/,'Browser completes level '+level);
  console.log('PASS browser completion',level);
 }
 const snapshot=await page.evaluate(()=>JSON.parse(localStorage.getItem('one.33trial.progress.v1')));
 assert.equal(snapshot.profile.completed.length,33);assert.equal(snapshot.profile.coins,3400);assert.equal(snapshot.profile.gems,48);
 const downloadEvent=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadEvent;await download.saveAs('/workspace/outputs/THE_33_verified_progress.json');
 await page.reload();assert.match(await page.locator('#wallet').innerText(),/33\/33 completed/);
 const oldWallet=await page.locator('#wallet').innerText();
 await page.locator('#import').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"schema":"bad"}')});
 assert.match(await page.locator('#feedback').innerText(),/Save import failed/);assert.equal(await page.locator('#wallet').innerText(),oldWallet);
 await page.screenshot({path:'/workspace/outputs/the33-desktop.png',fullPage:true});
 const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});const phone=await mobile.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(url);
 await phone.locator('#import').setInputFiles('/workspace/outputs/THE_33_verified_progress.json');await phone.waitForFunction(()=>JSON.parse(localStorage.getItem('one.33trial.progress.v1'))?.profile.completed.length===33);assert.match(await phone.locator('#wallet').innerText(),/33\/33 completed/);
 for(const level of [6,8,10,23,24,25,26,27,31,32,33]){
  await phone.locator('#level-nav button').nth(level-1).tap();
  assert.match(await phone.locator('#stage-title').innerText(),new RegExp(g.LEVELS[level-1].name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  if(level===8){const study=phone.getByRole('button',{name:'Hide symbols'});await study.tap();assert.equal(await phone.locator('.expanded-board button').first().innerText(),'?');await phone.getByRole('button',{name:'Study symbols (free)',exact:true}).tap();}
  if(level===23)await phone.getByRole('button',{name:'Dark state',exact:true}).tap();
  if(level===26)await phone.getByRole('button',{name:'Inspect weights (free)',exact:true}).tap();
  await phone.locator('#hint').tap();await phone.locator('#apply-hint').tap();
  assert.ok(!await phone.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),'No mobile viewport overflow for trial '+level);
 }
 await phone.locator('#board').scrollIntoViewIfNeeded();await phone.screenshot({path:'/workspace/outputs/the33-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS export/import, reload, rewards, invalid-import preservation, mobile touch, responsive layout; no browser exceptions');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
