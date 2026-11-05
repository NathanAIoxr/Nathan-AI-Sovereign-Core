(function (root) {
  "use strict";
  const CANON = "Things are only complicated because people make them complicated when you remove the complication you see the root issue and is very simple to fix";
  const STEPS = Object.freeze([
    "REMOVE THE COMPLICATION",
    "EXPOSE THE ROOT ISSUE",
    "FIX THE ROOT ISSUE"
  ]);
  const CASE_STUDY = Object.freeze({
    source: CANON,
    complication: "The response added philosophy, exceptions, qualifications, and unnecessary questions.",
    root: "The response changed the task from preserving a direct principle to debating it.",
    fix: "Keep the original words unchanged. Remove the extra layers. Apply the three-step process."
  });
  const LESSONS = [
    {id:"clear", title:STEPS[0], goal:"Separate what was said from layers added afterward.", example:"A person asks for the main cause; the reply adds unrelated theories. Remove those theories before proceeding.", exercise:"Copy the exact original statement, then identify only the extra layer."},
    {id:"root", title:STEPS[1], goal:"Identify a concrete cause rather than a new label or assumption.", example:"A task keeps being repeated because nobody owns the decision. The root is missing ownership.", exercise:"State the observable cause in one sentence."},
    {id:"fix", title:STEPS[2], goal:"Make a direct, testable change that addresses the stated cause.", example:"Name the responsible owner and the next action. Check whether the repeated task stops.", exercise:"Name the action, who does it, and what result will show it worked."}
  ];
  const CHALLENGES = [
    {prompt:"A clear sentence is buried beneath an unrelated philosophical debate. What is the first move?", options:["Add more philosophers","Remove the unrelated discussion","Change the original sentence"],correct:1,reason:"Remove the complication while preserving the original sentence."},
    {prompt:"A team has ten meetings because no one is accountable for a decision. What is the root?",options:["The meeting-room chairs","Missing decision ownership","The color of the calendar"],correct:1,reason:"Missing ownership directly explains the repeated meetings."},
    {prompt:"A lesson says 'do the task' but includes six unrelated exceptions. What should the editor do?",options:["Preserve the task and remove unrelated extras","Invent a new task","Add six more exceptions"],correct:0,reason:"Keep the source statement intact while clearing added layers."},
    {prompt:"The problem is that no person is assigned to publish the report. What fixes it?",options:["Rename the report","Schedule five discussions","Assign a publisher and a due date"],correct:2,reason:"The action directly addresses the missing assignment."},
    {prompt:"Two witnesses use different names for the same animal. Which is the root identification problem?",options:["Their names alone cannot determine species","One witness must be lying","All old names are identical"],correct:0,reason:"Characteristics and evidence—not labels alone—determine identification."},
    {prompt:"A response repeats your statement with an added 'however' that changes its meaning. What should be removed?",options:["The user's words","The meaning-changing qualification","The entire archive"],correct:1,reason:"Leave the source untouched; remove an added qualification from the derived answer."},
    {prompt:"The system gives three conflicting versions of a rule. What root issue should be investigated?",options:["Fonts","User mood","No single preserved source-of-truth version"],correct:2,reason:"The absence of a canonical record creates version conflict."},
    {prompt:"A student knows the cause: instructions are hidden across seven tabs. What is a direct fix?",options:["Put the required instructions on one clear page","Add seven more tabs","Rename every tab"],correct:0,reason:"A single clear instruction location addresses the stated cause."},
    {prompt:"A book draft silently rewrites an author's original line. What is the complication?",options:["Page count","The author's spelling","Unlabeled editorial changes"],correct:2,reason:"Editorial changes belong in a separately labeled derivation, not the source."},
    {prompt:"The same error returns after a fix. Which underlying fact should be checked?",options:["Whether the change actually removed the cause","Whether the button is blue","Whether people like the title"],correct:0,reason:"A fix must address the cause and work in practice."},
    {prompt:"Someone says a problem is too hard without identifying what fails. Which step is needed?",options:["Add more vague labels","Expose the precise point of failure","Create another committee"],correct:1,reason:"Identify the concrete problem rather than amplifying complication."},
    {prompt:"A game teaches the three-step rule. Which ending matches the rule?",options:["Remove the source","Keep arguing forever","Apply the direct fix to the identified root"],correct:2,reason:"The sequence ends by fixing the root issue."}
  ];
  const VOLUMES = [
    {number:1,title:"THE COMPLICATION",chapters:["The Original Words","The Added Layers","The Clearing"]},
    {number:2,title:"THE ROOT ISSUE",chapters:["What Actually Happened","A Cause You Can Name","The Root in One Sentence"]},
    {number:3,title:"THE DIRECT FIX",chapters:["The Action","The Result","The Rule Carried Forward"]}
  ];
  function clipped(text,limit) { return String(text == null ? "" : text).trim().slice(0,limit); }
  function buildRecord(input) {
    const record={
      original:clipped(input.original,6000),
      complication:clipped(input.complication,3000),
      root:clipped(input.root,3000),
      fix:clipped(input.fix,3000)
    };
    if (!record.original) throw Error("Enter the original statement first.");
    return record;
  }
  function getStages(record) {
    return [
      {title:STEPS[0],detail:record.complication||"No complication entered. Original text remains unchanged."},
      {title:STEPS[1],detail:record.root||"Root cause not supplied yet."},
      {title:STEPS[2],detail:record.fix||"Direct fix not supplied yet."}
    ];
  }
  function makeBook(record,volumeNumber) {
    const r=buildRecord(record);
    const v=VOLUMES.find(x=>x.number===Number(volumeNumber));
    if(!v)throw Error("Unknown volume.");
    const texts={
      1:["The author's exact original statement is retained below without editorial changes.\n\n> "+r.original,
         "The separately recorded complication:\n\n"+(r.complication||"[Not yet identified]")+"\n\nThis is an editorial observation, not part of the source quotation.",
         "The clearing begins with one action: remove the added complication, while retaining the original words."],
      2:["Begin with what is actually known. The source statement remains:\n\n> "+r.original,
         "The root issue entered by the reader:\n\n"+(r.root||"[Not yet identified]")+"\n\nThis is a reader-entered diagnosis, not an independently verified fact.",
         "Root issue in one sentence:\n\n"+(r.root||"[Write the specific cause here]")],
      3:["The root issue to address:\n\n"+(r.root||"[Not yet identified]"),
         "Direct fix entered by the reader:\n\n"+(r.fix||"[Enter the action that removes the root cause]"),
         "Keep the original. Remove the complication. Expose the root. Fix it.\n\nOriginal words:\n\n> "+r.original]
    };
    return "# THE KINGS OF CLARITY · ROOT → CLEAR → BUILD\n\n## Volume "+v.number+": "+v.title+
      "\n\n**Nathan AI educational book-series draft**\n\n**Creator's original principle (verbatim):**\n\n> "+CANON+
      "\n\n"+v.chapters.map((c,i)=>"### Chapter "+(i+1)+": "+c+"\n\n"+texts[v.number][i]).join("\n\n")+
      "\n\n---\n\n*Source text and reader-generated interpretation remain separate. This is an editable short draft, not a completed published book.*\n";
  }
  function grade(index,choice) {
    const q=CHALLENGES[index];
    if(!q||!Number.isInteger(choice)||choice<0||choice>=q.options.length)throw Error("Invalid game answer.");
    return {correct:choice===q.correct,reason:q.reason,correctAnswer:q.options[q.correct]};
  }
  function validateSaved(data) {
    if(!data||data.schema!=="nathan-ai.root-clear.v1")throw Error("Incorrect save format.");
    const record=buildRecord(data.record||{});
    const score=Number(data.score),round=Number(data.round);
    if(!Number.isInteger(score)||score<0||score>CHALLENGES.length*10)throw Error("Invalid score.");
    if(!Number.isInteger(round)||round<0||round>CHALLENGES.length)throw Error("Invalid round.");
    return {schema:"nathan-ai.root-clear.v1",record,score,round};
  }
  const API={CANON,STEPS,CASE_STUDY,LESSONS,CHALLENGES,VOLUMES,buildRecord,getStages,makeBook,grade,validateSaved};
  if(typeof module==="object"&&module.exports)module.exports=API;
  else root.NathanRootClearCore=API;
})(typeof window!=="undefined"?window:globalThis);
