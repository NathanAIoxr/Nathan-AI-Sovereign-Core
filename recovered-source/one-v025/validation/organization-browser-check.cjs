'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const base=process.env.ONE_V025_URL||'http://127.0.0.1:8002';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const p=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/');assert.match(await p.title(),/Private ONE v025 — Start here/);
 assert.equal(await p.locator('#games article').count(),3);
 await p.screenshot({path:path.join(__dirname,'v025-home-desktop.png'),fullPage:true});
 await p.getByRole('link',{name:'Play THE 33 →',exact:true}).click();
 assert.equal(await p.locator('#level-nav button').count(),33);await p.locator('#level-nav button').nth(32).click();await p.locator('#hint').click();await p.locator('#apply-hint').click();
 const key='one.private.v025.progress.v1',saved=await p.evaluate(k=>localStorage.getItem(k),key);
 await p.getByRole('link',{name:'v025 home',exact:true}).click();
 assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),saved,'home must not touch progress');
 await p.getByRole('link',{name:'Play THE 33 →',exact:true}).click();
 assert.equal(await p.locator('#guardian-name').innerText(),'The Null King');
 assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),saved,'existing campaign resumes exactly after home navigation');
 await p.getByRole('link',{name:'v025 home',exact:true}).click();await p.getByRole('link',{name:'Play Rootkeep →',exact:true}).click();
 assert.equal(await p.locator('#tutorial-board button').count(),35);await p.locator('#skip-tutorial').click();await p.locator('#atlas-tab').click();assert.equal(await p.locator('[data-stage]').count(),33);
 await p.getByRole('link',{name:'v025 home',exact:true}).click();await p.getByRole('link',{name:'Open the Studio →',exact:true}).click();assert.equal(await p.locator('#board button').count(),64);
 await p.getByRole('link',{name:'v025 home',exact:true}).click();await p.getByRole('link',{name:'Open your framework →',exact:true}).click();assert.match(await p.locator('#tabor').innerText(),/The Tabor Decimal System — by Nathan Tabor/);
 for(const route of ['/docs/','/references/','/validation/','/preserved/','/archive/']){const response=await p.goto(base+route);assert.equal(response.status(),200);assert.equal(await p.locator('header').getByRole('link',{name:/v025 home|Home/}).count(),1);}
 await p.goto(base+'/');await p.getByRole('link',{name:'Open ONE',exact:true}).click();assert.match(await p.title(),/Private ONE v025/);await p.getByRole('link',{name:'v025 home',exact:true}).click();
 await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.tagName),'A');
 for(const width of [360,390,768]){await p.setViewportSize({width,height:844});await p.goto(base+'/');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await p.getByRole('link',{name:'Play Rootkeep →',exact:true}).isVisible(),true);await p.goto(base+'/docs/');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 await p.setViewportSize({width:390,height:844});await p.goto(base+'/');await p.screenshot({path:path.join(__dirname,'v025-home-mobile.png'),fullPage:true});assert.deepEqual(errors,[]);
 console.log('PASS v025 organization: all three games and ONE open from home and return; 33-stage campaign resumes byte-for-byte; Rootkeep guest tutorial and 33 expeditions, Studio board, framework credit and five guide sections open; keyboard navigation and 360/390/768px layouts work with no horizontal overflow or browser exceptions.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
