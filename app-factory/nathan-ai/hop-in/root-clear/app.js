(function () {
"use strict";
const E=window.NathanRootClearCore;
const $=id=>document.getElementById(id);
const SAVE_KEY="nathan-ai.root-clear.v1";
const state={round:0,score:0,answered:false,lesson:0,completed:new Set(),bookNumber:0,bookContent:""};
function node(tag,text,cls){
  const x=document.createElement(tag);
  if(text!==undefined)x.textContent=String(text);
  if(cls)x.className=cls;
  return x;
}
function status(message){$("status").textContent=String(message);}
function fields(){
  return {original:$("original").value,complication:$("complication").value,root:$("root").value,fix:$("fix").value};
}
function writeFields(record){
  for(const key of ["original","complication","root","fix"])$(key).value=record[key]||"";
}
function openTab(tab){
  for(const b of document.querySelectorAll("[data-tab]")){
    const active=b.dataset.tab===tab;
    b.setAttribute("aria-selected",String(active));
    $(b.dataset.tab).hidden=!active;
  }
}
function addLine(parent,heading,content){
  const block=node("section",undefined,"result-block");
  block.append(node("h3",heading),node("p",content));
  parent.append(block);
}
function renderPlan(){
  const out=$("analysis");
  out.replaceChildren();
  try{
    const record=E.buildRecord(fields());
    addLine(out,"ORIGINAL · VERBATIM",record.original);
    const stages=E.getStages(record);
    for(let i=0;i<stages.length;i++)addLine(out,(i+1)+". "+stages[i].title,stages[i].detail);
    status("Three-step record built. Original words preserved.");
  }catch(err){out.append(node("p",err.message));status(err.message);}
}
function caseStudy(){
  writeFields({original:E.CASE_STUDY.source,complication:E.CASE_STUDY.complication,root:E.CASE_STUDY.root,fix:E.CASE_STUDY.fix});
  renderPlan();openTab("workshop");
}
function clearInputs(){
  writeFields({original:"",complication:"",root:"",fix:""});
  $("analysis").replaceChildren(node("p","Inputs cleared. The canonical source remains preserved under Original record."));
  status("Current inputs cleared. Saved record was not changed.");
}
function gameRender(){
  const question=$("game-question"),options=$("game-options");
  options.replaceChildren();
  $("game-score").textContent=state.score+" points";
  $("game-meter").style.width=(state.round/E.CHALLENGES.length*100)+"%";
  $("game-feedback").textContent="";
  $("game-next").disabled=true;
  if(state.round===E.CHALLENGES.length){
    $("game-progress").textContent="All 12 rounds completed";
    question.textContent="FINISH · "+state.score+" / "+(E.CHALLENGES.length*10)+" points";
    options.append(node("p","Replay the challenge or continue to the academy and book series."));
    $("game-meter").style.width="100%";
    return;
  }
  const q=E.CHALLENGES[state.round];
  state.answered=false;
  $("game-progress").textContent="Round "+(state.round+1)+" of "+E.CHALLENGES.length;
  question.textContent=q.prompt;
  q.options.forEach((choice,index)=>{
    const b=node("button",choice,"choice");
    b.type="button";
    b.addEventListener("click",()=>{
      if(state.answered)return;
      state.answered=true;
      const grade=E.grade(state.round,index);
      if(grade.correct)state.score+=10;
      $("game-score").textContent=state.score+" points";
      $("game-feedback").textContent=(grade.correct?"CORRECT. ":"TRY AGAIN NEXT ROUND. ")+grade.reason+
        (grade.correct?"":" Correct answer: "+grade.correctAnswer);
      for(const item of options.querySelectorAll("button"))item.disabled=true;
      b.classList.add(grade.correct?"correct":"incorrect");
      $("game-next").disabled=false;
      $("game-next").textContent=state.round===E.CHALLENGES.length-1?"Finish":"Next round";
    });
    options.append(b);
  });
}
function lessonRender(){
  const l=E.LESSONS[state.lesson];
  const holder=$("lesson-content");holder.replaceChildren();
  holder.append(node("p","LESSON "+(state.lesson+1)+" / 3","eyebrow"),node("h3",l.title));
  addLine(holder,"Objective",l.goal);
  addLine(holder,"Example",l.example);
  addLine(holder,"Practice",l.exercise);
  $("lesson-complete").textContent=state.completed.has(state.lesson)?"Completed ✓":"Mark lesson complete";
  $("academy-progress").textContent=state.completed.size+" of 3 lessons completed this session";
  for(const b of $("lesson-pills").querySelectorAll("button")){
    const active=Number(b.dataset.lesson)===state.lesson;
    b.setAttribute("aria-pressed",String(active));
    b.textContent=(Number(b.dataset.lesson)+1)+". "+E.STEPS[Number(b.dataset.lesson)]+
      (state.completed.has(Number(b.dataset.lesson))?" ✓":"");
  }
}
function renderBook(n){
  try{
    state.bookNumber=n;
    state.bookContent=E.makeBook(fields(),n);
    $("book-preview").textContent=state.bookContent;
    $("book-download").disabled=false;
    $("book-copy").disabled=false;
    status("Book Volume "+n+" generated as an editable draft, not a published manuscript.");
  }catch(err){$("book-preview").textContent=err.message;state.bookContent="";$("book-download").disabled=true;$("book-copy").disabled=true;status(err.message);}
}
function download(content,name,type){
  const blob=new Blob([content],{type:type||"text/plain;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function saveRecord(){
  try{
    const record=E.buildRecord(fields());
    localStorage.setItem(SAVE_KEY,JSON.stringify({schema:SAVE_KEY,record,score:state.score,round:state.round}));
    status("Saved on this device. The source record is still separate from your editable inputs.");
  }catch(err){status("Save unavailable: "+err.message);}
}
function restore(data){
  const d=E.validateSaved(data);
  writeFields(d.record);state.score=d.score;state.round=d.round;state.answered=false;
  if(state.round<E.CHALLENGES.length&&state.score>state.round*10)throw Error("Saved score conflicts with completed rounds.");
  renderPlan();gameRender();status("Saved record loaded. No cloud account was accessed.");
}
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>openTab(b.dataset.tab)));
$("analyze").addEventListener("click",renderPlan);
$("load-case").addEventListener("click",caseStudy);
$("reset-fields").addEventListener("click",clearInputs);
$("game-hint").addEventListener("click",()=>{$("game-feedback").textContent="Look for the choice that removes extra layers, names a concrete cause, or directly fixes that cause.";});
$("game-next").addEventListener("click",()=>{if(!state.answered||state.round>=E.CHALLENGES.length)return;state.round++;gameRender();});
$("game-restart").addEventListener("click",()=>{state.round=0;state.score=0;state.answered=false;gameRender();});
$("lesson-complete").addEventListener("click",()=>{state.completed.add(state.lesson);lessonRender();});
$("book-download").addEventListener("click",()=>{if(state.bookContent)download(state.bookContent,"Nathan_AI_Root_Issue_Volume_"+state.bookNumber+".md","text/markdown;charset=utf-8");});
$("book-copy").addEventListener("click",async()=>{
  if(!state.bookContent)return;
  try{await navigator.clipboard.writeText(state.bookContent);status("Manuscript copied.");}
  catch(err){status("Clipboard unavailable; select the manuscript text to copy it.");}
});
$("copy-source").addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText(E.CANON);status("Original sentence copied unchanged.");}
  catch(err){status("Clipboard unavailable; select the original sentence to copy it.");}
});
$("save").addEventListener("click",saveRecord);
$("export-json").addEventListener("click",()=>{
  try{
    const record=E.buildRecord(fields());
    const data={schema:SAVE_KEY,record,score:state.score,round:state.round};
    download(JSON.stringify(data,null,2),"Nathan_AI_Root_Clear_Build.json","application/json");
    status("JSON record exported. No information was sent to a server.");
  }catch(err){status(err.message);}
});
$("import-json").addEventListener("change",async ev=>{
  const file=ev.target.files&&ev.target.files[0];
  if(!file)return;
  try{
    if(file.size>35000)throw Error("Record exceeds 35 KB limit.");
    const data=JSON.parse(await file.text());
    const verified=E.validateSaved(data);
    if(verified.round<E.CHALLENGES.length&&verified.score>verified.round*10)throw Error("Score exceeds completed rounds.");
    restore(verified);
  }catch(err){status("Import rejected: "+err.message);}
  ev.target.value="";
});
$("clear-save").addEventListener("click",()=>{
  if(!confirm("Clear only the locally saved ROOT → CLEAR → BUILD record?"))return;
  try{localStorage.removeItem(SAVE_KEY);status("Local save cleared; current work remains visible until you clear it.");}
  catch(err){status("Storage unavailable: "+err.message);}
});
$("canon").textContent=E.CANON;
$("case-original").textContent=E.CASE_STUDY.source;
$("case-complication").textContent=E.CASE_STUDY.complication;
$("case-root").textContent=E.CASE_STUDY.root;
$("case-fix").textContent=E.CASE_STUDY.fix;
E.LESSONS.forEach((l,i)=>{
  const b=node("button",(i+1)+". "+l.title);b.type="button";b.dataset.lesson=i;
  b.addEventListener("click",()=>{state.lesson=i;lessonRender();});
  $("lesson-pills").append(b);
});
E.VOLUMES.forEach(v=>{
  const b=node("button","Volume "+v.number+" · "+v.title);
  b.type="button";b.addEventListener("click",()=>renderBook(v.number));$("book-buttons").append(b);
});
writeFields({original:E.CANON,complication:"",root:"",fix:""});
renderPlan();gameRender();lessonRender();
})();