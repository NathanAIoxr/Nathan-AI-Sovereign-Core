export const adapters = Object.freeze({
  software:{title:"Software architectures and local indexing",candidate:"An ingest step stops normalizing the record ID",
    symptom:"Search no longer returns a source record",checks:[
      "Does the failure start after this step?",
      "Can a clean test record reproduce it at this step?",
      "Does correcting this step restore the same record end to end?",
      "Can you rule out permissions, missing source data, and stale results?"
    ]},
  archives:{title:"Archival databases and linguistic mapping",candidate:"The source identifier changed during import",
    symptom:"A root word and its citation point to different entries",checks:[
      "Does the original edition have the identifier before the mismatch?",
      "Can reimporting the same edition reproduce the mismatch?",
      "Does preserving the source identifier fix the lookup?",
      "Can you rule out edition differences and a transliteration mismatch?"
    ]},
  logic:{title:"Ciphers and deterministic logic",candidate:"The encoder and decoder use different symbol order",
    symptom:"A round-trip changes the original text",checks:[
      "Does the symbol-order mismatch occur before the round-trip failure?",
      "Does the same input reproduce the failure under the same mapping?",
      "Does aligning the symbol order restore the original input?",
      "Can you rule out normalization and an incorrect key version?"
    ]},
  motion:{title:"Motion analysis and interactive game worlds",candidate:"Consecutive gesture timestamps arrive out of order",
    symptom:"A slow gesture occasionally scores as a fast one",checks:[
      "Does the timestamp reversal precede the scoring error?",
      "Can a replay with the same events reproduce the error?",
      "Does sorting or rejecting invalid events correct the replay?",
      "Can you rule out device sampling and scoring thresholds?"
    ]},
  personal:{title:"Personal productivity and decompression tools",candidate:"The capture flow resets before saving",
    symptom:"A new note disappears when the screen closes",checks:[
      "Does the reset happen before persistence?",
      "Can a dummy note reproduce it without using private data?",
      "Does saving before the reset preserve the same note?",
      "Can you rule out a different account and unavailable storage?"
    ]},
  products:{title:"Consumer products and mechanical prototypes",candidate:"The part geometry mismatches its design specification",
    symptom:"A bench-test assembly does not fit",checks:[
      "Does the measured mismatch precede the failed fit?",
      "Does repeating the measurement reproduce the mismatch?",
      "Does a corrected design fit under the same test conditions?",
      "Can you rule out measurement error and the other part’s tolerance?"
    ]}
});
export const signals=["precedes","reproduces","corrected","alternatives"];
const answers=new Set(["yes","no","unknown"]);
export function evaluateRoot(input){
  if(!input||!Object.hasOwn(adapters,input.adapter))throw Error("Select a valid category.");
  const candidate=String(input.candidate??"").trim();
  const symptom=String(input.symptom??"").trim();
  if(!candidate||!symptom||candidate.length>300||symptom.length>300)throw Error("Enter a candidate and an observed symptom, each under 301 characters.");
  const answersBySignal=signals.map(s=>input.evidence?.[s]??"unknown");
  if(answersBySignal.some(x=>!answers.has(x)))throw Error("Select Yes, No, or Unknown for every check.");
  const checks=adapters[input.adapter].checks.map((text,i)=>({text,answer:answersBySignal[i]}));
  const [before,,fixed,other]=answersBySignal;
  const contradicted=before==="no";
  const conclusion=contradicted?"Candidate contradicted by the recorded evidence":
    answersBySignal.every(x=>x==="yes")?"Candidate supported by the recorded checks":
    fixed==="yes"&&other==="no"?"Possible contributor. Competing causes remain.":
    fixed==="no"?"The proposed correction did not resolve the symptom":"Root cause still open";
  const next=checks.find(r=>r.answer==="unknown")?.text??checks.find(r=>r.answer==="no")?.text??null;
  return {candidate,symptom,conclusion,checks,next};
}
