/* TABOR 1-2-3 FACTORY: 1420 — THE CROWNING JEWEL
 * Turn-based historical-fiction strategy prototype. 
 * Abstract gameplay only: no real weapon recipes or tactical instruction.
 * Separate 1420 Bohemia and 1872 US mutual-aid historical eras.
 * SPDX-License-Identifier: MIT
 */
(function (root) {
  'use strict';
  const SIZE=5, CORE=12, MAX_TURNS=10, LEGACY_TURNS=8;
  const locations=[2,14,10,22,4,20,0,24,9,15];
  const TERRAINS=[
    'hill','field','road','field','hill',
    'field','marsh','road','field','field',
    'road','field','road','field','road',
    'field','field','road','marsh','field',
    'hill','field','road','field','hill'
  ];
  const ARCHIVE_QUESTIONS=[
    {question:'The fortified settlement central to the 1420 chapter was in which region?',answers:['Bohemia','Missouri','Mississippi'],correct:0,explain:'Tábor is in historic Bohemia, now in the Czech Republic.'},
    {question:'Who founded the American Knights and Daughters of Tabor in 1872?',answers:['Moses Dickson','Jan Žižka','John Wycliffe'],correct:0,explain:'Rev. Moses Dickson founded the African American fraternal order in Independence, Missouri.'},
    {question:'Which location inspired the American order’s name?',answers:['Biblical Mount Tabor','Fortress Tábor in Bohemia','A medieval European guild'],correct:0,explain:'According to the museum research, the order’s name refers to Mount Tabor in the biblical Book of Judges. A direct organizational link to Bohemia has not been documented.'},
    {question:'What numbers appeared on the fraternal jewel and in the elaborate 1899 publication title?',answers:['777 and 333','1420 and 1872','12 and 25 only'],correct:0,explain:'The symbols 777 and 333 appear with the twelve-pointed emblem, and the 1899 Dickson publication title uses them.'},
    {question:'What completes the fictional Crowning Jewel mission?',answers:['Safeguarding people and creating enduring support','Erasing the nineteenth-century timeline','Claiming both groups fought side by side in 1420'],correct:0,explain:'This original cross-century story honors lasting protection and mutual aid without inventing a literal historic alliance.'}
  ];
  const actionCosts={
    fortify:'2 timber; choose a location on the board',
    rescue:'2 stores; shelter two residents',
    gather:'recover 2 timber and 2 stores; lose 1 cohesion',
    council:'2 cohesion; persuade one approaching group to withdraw',
    scout:'prepare the city to delay the next approach'
  };
  const legacyActions={
    aid:{cost:2,label:'Mutual-aid fund',metric:'aid'},
    school:{cost:2,label:'Education house',metric:'school'},
    care:{cost:3,label:'Community care',metric:'care'},
    outreach:{cost:1,label:'Membership outreach',metric:'outreach'},
    constitution:{cost:1,label:'Members’ charter',metric:'charter'}
  };
  const clone=x=>JSON.parse(JSON.stringify(x));
  function assert(condition,msg){if(!condition)throw new Error(msg)}
  function bounded(n,min,max){return Math.max(min,Math.min(max,n))}
  function pos(index){return {row:Math.floor(index/SIZE),col:index%SIZE}}
  function dist(a,b){let x=pos(a),y=pos(b);return Math.abs(x.row-y.row)+Math.abs(x.col-y.col)}
  function makeDefense(difficulty='standard'){
    assert(['standard','story'].includes(difficulty),'Unknown difficulty');
    return {mode:'defense',difficulty,turn:1,over:false,result:null,integrity:difficulty==='story'?9:7,
      residents:6,safe:0,timber:7,stores:6,cohesion:5,wagons:{},scouted:false,
      threats:[{id:'advance-n',spot:2,fatigue:2},{id:'advance-e',spot:14,fatigue:2}],
      log:['1420 · The town of Tábor seeks shelter. Protect its residents and preserve the community.']};
  }
  function nextSpot(start){
    if(start===CORE)return CORE;
    const p=pos(start),target=pos(CORE);
    const vertical=p.row<target.row?start+SIZE:p.row>target.row?start-SIZE:start;
    const horizontal=p.col<target.col?start+1:p.col>target.col?start-1:start;
    if(p.row!==target.row&&p.col!==target.col){
      const a=vertical,b=horizontal;
      return a===CORE?a:b===CORE?b:(TERRAINS[a]==='marsh'?b:a);
    }
    return p.row!==target.row?vertical:horizontal;
  }
  function moveThreats(state){
    const remaining=[];
    for (const threat of state.threats) {
      const spot=nextSpot(threat.spot);
      const wagon=state.wagons[spot];
      if(wagon){
        wagon.hp-=1;
        threat.fatigue-=1;
        state.log.unshift('A fortified wagon protected the approach.');
        if(wagon.hp<=0){delete state.wagons[spot];state.log.unshift('A wagon needs to be restored.')}
        if(threat.fatigue>0)remaining.push(threat);
      }else if(spot===CORE){
        state.integrity-=1;
        state.log.unshift('An approaching force reached the town; the community held but lost resilience.');
      }else{
        remaining.push({...threat,spot});
      }
    }
    state.threats=remaining;
  }
  function finishDefense(state) {
    if(state.integrity<=0){state.over=true;state.result='defeat';state.log.unshift('The settlement was overrun. Try a different protection and rescue plan.')}
    else if(state.turn>MAX_TURNS){
      state.over=true;
      const success=state.safe>=4&&state.integrity>0;
      state.result=success?'victory':'partial';
      state.log.unshift(success?'Victory: the settlement survives and civilians reach safety.':'The settlement endured, but too few residents reached safety. Try again.');
    }
  }
  function defenseAction(input,action,spot) {
    const state=clone(input);
    if(state.over)return {state,accepted:false,message:'The chapter has ended. Restart to play again.'};
    if(!Object.prototype.hasOwnProperty.call(actionCosts,action))return {state,accepted:false,message:'Choose a valid action.'};
    let message='';
    if(action==='fortify'){
      if(!Number.isInteger(spot)||spot<0||spot>=25||spot===CORE)return {state,accepted:false,message:'Select a location other than the settlement center.'};
      if(dist(spot,CORE)>2)return {state,accepted:false,message:'The wagon must remain within two spaces of town.'};
      if(state.threats.some(t=>t.spot===spot))return {state,accepted:false,message:'The location is occupied by an approaching group.'};
      if(state.timber<2)return {state,accepted:false,message:'Not enough timber. Gather supplies first.'};
      state.timber-=2;
      state.wagons[spot]={hp:3};
      message='The community reinforced its defensive wagon position.';
    }else if(action==='rescue'){
      if(state.safe>=state.residents)return {state,accepted:false,message:'All residents are already sheltered.'};
      if(state.stores<2)return {state,accepted:false,message:'Not enough provisions to shelter more residents.'};
      state.stores-=2;
      state.safe=bounded(state.safe+2,0,state.residents);
      message='Two more residents reached protected shelter.';
    }else if(action==='gather'){
      if(state.cohesion<1)return {state,accepted:false,message:'Not enough community cohesion for another supply round.'};
      state.timber=bounded(state.timber+2,0,15);
      state.stores=bounded(state.stores+2,0,15);
      state.cohesion-=1;
      message='Artisans and neighbors shared the resources they could spare.';
    }else if(action==='council'){
      if(state.cohesion<2)return {state,accepted:false,message:'A council delegation requires 2 cohesion.'};
      if(!state.threats.length)return {state,accepted:false,message:'No approaching group is available for talks.'};
      state.cohesion-=2;
      state.threats.sort((a,b)=>dist(a.spot,CORE)-dist(b.spot,CORE));
      state.threats.shift();
      message='Negotiators secured a withdrawal without another clash.';
    }else if(action==='scout'){
      state.scouted=true;
      message='Scouts warned the town of the next approaching force.';
    }
    state.log.unshift('Turn '+state.turn+': '+message);
    moveThreats(state);
    if(state.turn%2===0&&state.turn<MAX_TURNS){
      if(state.scouted){state.scouted=false;state.log.unshift('Your advance warning delayed the next approaching force.')}
      else {
        const spot=locations[(state.turn/2+1)%locations.length];
        const fallback=locations.find(x=>!state.threats.some(t=>t.spot===x))??spot;
        state.threats.push({id:'approach-'+state.turn,spot:fallback,fatigue:2});
        state.log.unshift('A new armed contingent was reported beyond the settlement.');
      }
    }
    state.turn++;
    finishDefense(state);
    return {state,accepted:true,message};
  }
  function makeLegacy(){
    return {mode:'legacy',turn:1,over:false,result:null,treasury:6,trust:4,members:3,
      served:0,programs:{aid:0,school:0,care:0,outreach:0,charter:0},
      log:['1872 · A separate African American fraternal organization is founded in Missouri. Build a lasting mutual-aid legacy.']};
  }
  function finishLegacy(state){
    if(state.turn>LEGACY_TURNS){
      state.over=true;
      const p=state.programs;
      const success=p.aid>=1&&p.school>=1&&p.care>=1&&state.served>=6&&state.trust>=1;
      state.result=success?'victory':'partial';
      state.log.unshift(success?'The mutual-aid network grew: members can access community services.':'The fraternal network began, but the care, education, and aid foundation remains incomplete.');
    }
  }
  function legacyAction(input,action){
    const state=clone(input);
    if(state.over)return {state,accepted:false,message:'The chapter has ended.'};
    let message='';
    if(action==='fundraise'){
      state.treasury+=3;
      state.trust=bounded(state.trust+1,0,8);
      message='Community supporters pooled resources into the common treasury.';
    }else if(Object.prototype.hasOwnProperty.call(legacyActions,action)){
      const def=legacyActions[action];
      if(state.treasury<def.cost)return {state,accepted:false,message:'Not enough funds. Organize a fundraising round.'};
      state.treasury-=def.cost;
      state.programs[def.metric]++;
      if(action==='aid'){state.served+=2;message='The mutual-aid fund helped two community members.'}
      if(action==='school'){state.served+=2;message='The education program equipped two members with new opportunities.'}
      if(action==='care'){state.served+=2;message='The community care network reached two people.'}
      if(action==='outreach'){state.members+=3;state.trust++;message='Three new members joined the association.'}
      if(action==='constitution'){state.trust=bounded(state.trust+2,0,8);message='Members established shared rules for equitable governance.'}
    }else return {state,accepted:false,message:'Unknown civic action.'};
    state.log.unshift('Turn '+state.turn+': '+message);
    state.turn++;
    finishLegacy(state);
    return {state,accepted:true,message};
  }
  function runTests(){
    const tests=[];
    function test(name,fn){try{fn();tests.push({name,passed:true})}catch(error){tests.push({name,passed:false,error:String(error.message)})}}
    test('Defense initial state',()=>{let s=makeDefense();assert(s.integrity===7&&s.safe===0&&s.turn===1,'Wrong baseline')});
    test('Rescue is an actual action',()=>{let x=defenseAction(makeDefense(),'rescue');assert(x.accepted&&x.state.safe===2&&x.state.stores===4,'Rescue did not work')});
    test('Invalid fortress placement does not consume turn',()=>{let x=defenseAction(makeDefense(),'fortify',CORE);assert(!x.accepted&&x.state.turn===1,'Failed placement consumed a turn')});
    test('Fortification costs timber',()=>{let x=defenseAction(makeDefense(),'fortify',7);assert(x.accepted&&x.state.timber===5,'Timber amount wrong')});
    test('Threats progress toward town',()=>{let x=defenseAction(makeDefense(),'scout');assert(x.state.threats.some(t=>t.spot===7),'Threat did not advance')});
    test('Defense cannot be played after defeat',()=>{let s=makeDefense();s.over=true;assert(!defenseAction(s,'rescue').accepted,'Over state changed')});
    test('Legacy civic fund works',()=>{let x=legacyAction(makeLegacy(),'aid');assert(x.accepted&&x.state.served===2&&x.state.treasury===4,'Aid failed')});
    test('Legacy funds may be earned',()=>{let x=legacyAction(makeLegacy(),'fundraise');assert(x.state.treasury===9,'Fundraising failed')});
    test('Legacy rejects unaffordable action',()=>{let s=makeLegacy();s.treasury=0;let x=legacyAction(s,'care');assert(!x.accepted&&x.state.turn===1,'Unexpected cost')});
    test('Legacy may achieve victory',()=>{let s=makeLegacy();for(const action of ['fundraise','aid','school','care','fundraise','outreach','constitution','aid']){const r=legacyAction(s,action);assert(r.accepted,'Rejected '+action);s=r.state}assert(s.over&&s.result==='victory','Expected victory')});
    test('Archive has five unique supported-answer clues',()=>{assert(ARCHIVE_QUESTIONS.length===5,'Wrong number of clues');assert(ARCHIVE_QUESTIONS.every(q=>q.answers.length>=3&&q.correct>=0&&q.correct<q.answers.length),'Invalid clue')});
    test('Defense timeline terminates',()=>{let s=makeDefense('story');for(let n=0;n<10;n++){let r=defenseAction(s,'rescue');if(!r.accepted)r=defenseAction(s,'gather');if(!r.accepted)r=defenseAction(s,'scout');s=r.state;if(s.over)break}assert(s.over,'Did not terminate')});
    return tests;
  }
  const ENGINE={makeDefense,defenseAction,makeLegacy,legacyAction,runTests,archiveQuestions:ARCHIVE_QUESTIONS,constants:{SIZE,CORE,MAX_TURNS,LEGACY_TURNS,TERRAINS,actionCosts,legacyActions}};
  root.CrowningJewelEngine=ENGINE;

  if(typeof document==='undefined'||!document.getElementById('cj-board'))return;

  const $=id=>document.getElementById(id);
  let state=makeDefense(),mode='defense',chosen='fortify';
  let archiveStage=0;

  const buttons=['fortify','rescue','gather','council','scout'];
  const labelTerrain={hill:'⛰',field:'🌾',road:'▫',marsh:'≈'};
  function pushStatus(message){$('cj-status').textContent=message}
  function val(id,text){$(id).textContent=text}
  function create(tag,className,content){
    const el=document.createElement(tag);
    if(className)el.className=className;
    if(content!==undefined)el.textContent=content;
    return el;
  }
  function readTopScore(key){try{return Number(localStorage.getItem(key)||'0')}catch(e){return 0}}
  function saveTopScore(key,score){try{localStorage.setItem(key,String(Math.max(score,readTopScore(key))))}catch(e){}}
  function score(s){if(s.mode==='defense')return Math.max(0,s.safe*40+s.integrity*20+Object.keys(s.wagons).length*8+(s.result==='victory'?150:0));return s.served*30+s.trust*12+s.members*4+(s.result==='victory'?150:0)}
  function useAction(action,spot){
    const result=mode==='defense'?defenseAction(state,action,spot):legacyAction(state,action);
    if(!result.accepted){pushStatus(result.message);return}
    state=result.state;
    if(state.over){saveTopScore('cj_best_'+mode,score(state));if(state.result==='victory'){try{localStorage.setItem('cj_completed_'+mode,'1')}catch(e){}}$('cj-finale').hidden=false;$('cj-finale').textContent=state.result==='victory'?'MISSION COMPLETE · '+state.log[0]:'CHAPTER COMPLETE · '+state.log[0]}
    render();pushStatus(result.message);
  }
  function drawBoard(){
    const board=$('cj-board');board.replaceChildren();
    for(let i=0;i<25;i++){
      const tile=create('button','cj-tile');
      const hasCore=i===CORE,fort=state.wagons[i],threat=state.threats.find(t=>t.spot===i);
      const terrain=TERRAINS[i];
      if(terrain==='marsh')tile.classList.add('wet');
      if(hasCore)tile.classList.add('core');
      if(fort)tile.classList.add('fort');
      if(threat)tile.classList.add('threat');
      let visual=hasCore?'🏰':fort?'🛡️':threat?'⚑':labelTerrain[terrain];
      const title=hasCore?'Town center':fort?'Fortified wagon (strength '+fort.hp+')':threat?'Approaching faction':terrain;
      tile.setAttribute('aria-label','Row '+(pos(i).row+1)+', column '+(pos(i).col+1)+': '+title);
      tile.innerHTML='<span aria-hidden="true">'+visual+'</span>';
      if(!hasCore&&fort){const sm=create('small','',String(fort.hp));tile.append(sm)}
      tile.title=title;
      tile.disabled=state.over;
      tile.onclick=()=>{if(chosen!=='fortify'){pushStatus('Select Fortify to place a wagon on the map. Other actions use their action button.');return}useAction('fortify',i)};
      board.append(tile);
    }
  }
  function drawActions(){
    const slot=$('cj-actions');slot.replaceChildren();
    if(mode==='defense'){
      for(const a of buttons){
        const b=create('button','cj-action'+(a===chosen?' active':''),a[0].toUpperCase()+a.slice(1));
        b.title=actionCosts[a];
        b.disabled=state.over;
        b.setAttribute('aria-pressed',String(a===chosen));
        b.onclick=()=>{if(a==='fortify'){chosen=a;render();pushStatus('Fortify selected. Tap an open square within two spaces of town.')}else useAction(a)};
        slot.append(b);
      }
    }else{
      for(const [a,def] of Object.entries(legacyActions)){
        const b=create('button','cj-action',def.label+' · '+def.cost+' funds');
        b.disabled=state.over;
        b.onclick=()=>useAction(a);
        slot.append(b);
      }
      const b=create('button','cj-action','Fundraise · +3 funds');
      b.disabled=state.over;b.onclick=()=>useAction('fundraise');slot.append(b);
    }
  }
  function drawLog(){
    const log=$('cj-log');log.replaceChildren();
    state.log.slice(0,6).forEach(l=>log.append(create('li','',l)));
  }
  function archiveReady(){
    try{return localStorage.getItem('cj_completed_defense')==='1'&&localStorage.getItem('cj_completed_legacy')==='1'}catch(e){return false}
  }
  function renderArchive(){
    const ready=archiveReady();
    $('cj-archive').hidden=!ready;
    $('cj-unlock').textContent=ready?'Unlocked: complete the five archival clues to earn the Crowning Jewel. This connects stories through documented shared symbolism and a fictional portal.':'Locked: earn a victory in both the 1420 and 1872 chapters.';
    if(!ready)return;
    const box=$('cj-archive-options');box.replaceChildren();
    if(archiveStage>=ARCHIVE_QUESTIONS.length){
      $('cj-archive-title').textContent='♛ The Crowning Jewel restored';
      $('cj-archive-question').textContent='Two distinct historical chapters are now connected by an original story about protecting innocence and building lasting community institutions.';
      $('cj-archive-feedback').textContent='ARCHIVE COMPLETED · Your jewel is preserved on this device.';
      try{localStorage.setItem('cj_archive_completed','1')}catch(e){}
      return;
    }
    const q=ARCHIVE_QUESTIONS[archiveStage];
    $('cj-archive-title').textContent='Archive clue '+(archiveStage+1)+' / '+ARCHIVE_QUESTIONS.length;
    $('cj-archive-question').textContent=q.question;
    $('cj-archive-feedback').textContent='Choose the historically supported answer.';
    q.answers.forEach((answer,index)=>{
      const button=create('button','cj-action',answer);
      button.onclick=()=>{
        if(index===q.correct){
          archiveStage++;
          renderArchive();
          if(archiveStage<ARCHIVE_QUESTIONS.length)$('cj-archive-feedback').textContent=q.explain+' Next clue unlocked.';
        }else $('cj-archive-feedback').textContent='Not quite. Try again: '+q.explain;
      };
      box.append(button);
    });
  }
  function render(){
    $('cj-siege').hidden=mode!=='defense';
    $('cj-civic').hidden=mode!=='legacy';
    $('cj-defense-tab').setAttribute('aria-selected',String(mode==='defense'));
    $('cj-legacy-tab').setAttribute('aria-selected',String(mode==='legacy'));
    val('cj-chapter',mode==='defense'?'1420 · Protect the settlement':'1872 · Build a mutual-aid legacy');
    val('cj-turn',String(Math.min(state.turn,mode==='defense'?MAX_TURNS:LEGACY_TURNS))+'/'+(mode==='defense'?MAX_TURNS:LEGACY_TURNS));
    if(mode==='defense'){
      val('cj-integrity',state.integrity);val('cj-saved',state.safe+'/'+state.residents);
      val('cj-wood',state.timber);val('cj-stores',state.stores);val('cj-cohesion',state.cohesion);
      val('cj-threats',state.threats.length);
      val('cj-best',readTopScore('cj_best_defense'));
      drawBoard();
    }else{
      val('cj-funds',state.treasury);val('cj-trust',state.trust);val('cj-members',state.members);
      val('cj-served',state.served);val('cj-programs',[
        'Aid '+state.programs.aid,'Education '+state.programs.school,'Care '+state.programs.care
      ].join(' · '));
      val('cj-best',readTopScore('cj_best_legacy'));
    }
    drawActions();drawLog();renderArchive();
    val('cj-objective',mode==='defense'?'Protect Tábor through ten turns and shelter at least four of six residents. Fortify the approaches, coordinate supplies, scout or negotiate.':'By turn eight, create aid, education and care programs; serve at least six members, and preserve community trust.');
    $('cj-finale').hidden=!state.over;
    if(state.over)$('cj-finale').textContent=state.result==='victory'?'MISSION COMPLETE · '+state.log[0]:'CHAPTER COMPLETE · '+state.log[0];
  }
  function switchMode(which){
    mode=which;chosen='fortify';state=mode==='defense'?makeDefense($('cj-difficulty').value):makeLegacy();
    $('cj-finale').hidden=true;render();
    pushStatus(mode==='defense'?'The Tábor chapter has begun. Place a wagon or choose an action.':'The 1872 mutual-aid chapter has begun. Select a civic action.');
  }
  $('cj-defense-tab').onclick=()=>switchMode('defense');
  $('cj-legacy-tab').onclick=()=>switchMode('legacy');
  $('cj-restart').onclick=()=>switchMode(mode);
  $('cj-archive-reset').onclick=()=>{archiveStage=0;renderArchive()};
  $('cj-difficulty').onchange=()=>{if(mode==='defense')switchMode('defense')};
  $('cj-tests').onclick=()=>{const report=runTests();const failures=report.filter(x=>!x.passed);pushStatus('Self-tests: '+(report.length-failures.length)+'/'+report.length+' passed'+(failures.length?'. '+failures.map(x=>x.name+': '+x.error).join('; '):'.'))};
  render();
})(typeof globalThis!=='undefined'?globalThis:this);
