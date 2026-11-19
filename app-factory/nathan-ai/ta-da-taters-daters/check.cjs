const fs=require('fs'),vm=require('vm'),assert=require('assert');
const elements=new Map();const element=key=>{if(!elements.has(key))elements.set(key,{innerHTML:'',textContent:'',style:{},classList:{toggle(){}},showModal(){},close(){},remove(){},addEventListener(){}});return elements.get(key)};
const handlers={};const storage=new Map();const context={crypto:require('crypto').webcrypto,console,setTimeout,clearTimeout,Blob,URL,FormData,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},sessionStorage:{getItem:()=> 'yes'},document:{documentElement:{},querySelector:element,querySelectorAll:()=>[],body:{classList:{toggle(){}}},addEventListener:(n,fn)=>handlers[n]=fn},window:{scrollTo(){},addEventListener(){}},location:{hash:''}};vm.createContext(context);vm.runInContext(fs.readFileSync('dist/data.js','utf8')+'\n'+fs.readFileSync('dist/almanac.js','utf8')+'\n'+fs.readFileSync('dist/international.js','utf8')+'\n'+fs.readFileSync('dist/advisor.js','utf8')+'\n'+fs.readFileSync('dist/app.js','utf8'),context);
function run(s){return vm.runInContext(s,context)}
for(const page of ['advisor','intent','languages','almanac','knowledge','board','discover','interests','profile','saved','messages','boundaries','planner','safety','learn','settings','about']){run(`location.hash='#${page}';render()`);assert(element('#main').innerHTML.length>300,page)}
assert(run('new Set(interests.map(i=>i.id)).size===interests.length'));
run("location.hash='#interests';render();viewMode='details';query='feet';renderCatalog()");assert(element('#catalogGrid').innerHTML.includes('adult feet'));assert(!element('#catalogGrid').innerHTML.includes('Latex'));
run("location.hash='#discover';render();distance=25;goal='Friendship first';renderPeople()");assert(element('#peopleGrid').innerHTML.includes('Alex'));assert(!element('#peopleGrid').innerHTML.includes('River'));
run("state.blocked=['alex'];renderPeople()");assert(element('#peopleGrid').innerHTML.includes('No sample profiles'));
assert.equal(run("esc('<img src=x onerror=alert(1)>')"),'&lt;img src=x onerror=alert(1)&gt;');
run("state.settings.remember=true;state.profile.name='Sample';persist()");assert(JSON.parse(storage.get('tada-demo')).profile.name==='Sample');
run("state.settings.remember=false;persist()");assert(!storage.has('tada-demo'));
console.log('PASS: 17 routes, unique directory IDs, interest search, combined filters, blocking, HTML escaping, opt-in persistence and removal.');console.log('Directory:',run('interests.length'),'terms in',run('Object.keys(groups).length'),'categories.');

run("state.prefs={feet:{interest:'Interested',visibility:'Only me'},hands:{interest:'Curious',visibility:'Matches only'},hair:{interest:'Interested',visibility:'On my profile'}}");
assert.equal(run("previewButtons('On my profile').length"),1);assert.equal(run("previewButtons('Matches only').length"),2);assert.equal(run("previewButtons('Only me').length"),3);
assert(!run("profilePreviewContent('On my profile')").includes('Feet'));
run("toggleButton('feet')");assert.equal(run("selectedButtons().length"),2);run("toggleButton('feet')");assert.equal(run("selectedButtons().length"),3);assert.equal(run("state.prefs.feet.visibility"),'Only me');
run("state.overrides={feet:{name:'My foot preference',category:'Personal collection'}}");assert(run("categoryList().includes('Personal collection')"));
for(const year of [2024,2025,2026])for(const n of [1,12,13,17,21,60]){let previousMonth=0,previousDay=0;for(let ordinal=0;ordinal<(year===2024?366:365);ordinal++){const d=new Date(year,0,ordinal+1,12),iso=d.toISOString().slice(0,10),result=run(`customDate('${iso}',${n})`);assert(result.month>=1&&result.month<=n);assert(result.day>=1);assert(result.month>=previousMonth);assert(result.month!==previousMonth||result.day===previousDay+1);previousMonth=result.month;previousDay=result.day}}
run("location.hash='#almanac';render();runCommand('Add dinner on 2026-11-12 at 7pm')");assert.equal(run("tta().events.at(-1).date"),'2026-11-12');assert.equal(run("tta().events.at(-1).time"),'19:00');
const before=run('tta().events.length');run("runCommand('Add dinner on 2026-02-30 at 7pm')");assert.equal(run('tta().events.length'),before);
run("runCommand('Task: plan a weekend away');runCommand('Note: Intimacy is respect');runCommand('Show 17 month calendar')");assert.equal(run('tta().tasks.at(-1).title'),'plan a weekend away');assert.equal(run('tta().notes.at(-1).text'),'Intimacy is respect');assert.equal(run('tta().calendar'),17);
console.log('PASS: audience separation, add/remove arithmetic, custom categories, all calendar days across leap/non-leap years, planner commands, invalid dates, tasks and notes.');

assert.equal(run('Object.keys(shellLanguages).length'),24);
assert(run('Object.values(shellLanguages).every(p=>p.split("|").length===shellKeys.length)'));
assert.equal(run('new Set(languageCodes).size'),run('languageCodes.length'));
run("state.settings.language='ar';render()");assert.equal(context.document.documentElement.dir,'rtl');
run("state.settings.language='en';render()");assert.equal(context.document.documentElement.dir,'ltr');
assert(run("starterDraft('Set a boundary','I do not want photos','Warm & clear')").includes('Please respect that'));
run("state.intent={kind:'Coffee',context:'Test',visibility:'Only me',expires:Date.now()+10000}");assert.equal(run("intentPreview('On my profile')"),'');
assert(run("intentPreview('Only me')").includes('Coffee'));
run("state.intent.expires=Date.now()-1");assert.equal(run('currentIntent()'),null);
run("state.intent={kind:'Coffee',visibility:'On my profile',expires:Date.now()+10000,paused:true}");assert.equal(run('currentIntent()'),null);
console.log('PASS: 24 complete navigation packs, unique language codes, RTL/LTR switching, boundary templates, private intent visibility and expiration.');
