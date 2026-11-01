/* Nathan AI 🚀 / ONE — additive, public-safe Nervous System Wiring Logic (W).
 * This is a symbolic software signal-routing simulator, NOT human nervous-system
 * control, a diagnostic device, a biometric system, or an emergency monitor.
 * No owner measurements, health claims, records, or credentials are embedded.
 */
(function(root) {
  "use strict";
  const REGISTERS = Object.freeze([
    {code:"A",name:"The Absolute Core Cortex",phase:1,domain:"attention and source evaluation",kind:"author-defined metaphor"},
    {code:"B&D",name:"The 12 Eye & Ear Gate Registers",phase:1,domain:"visual and auditory input / text review",kind:"author-defined metaphor"},
    {code:"C",name:"The Cortical Inhibition Pain-Switch",phase:1,domain:"pain and attention; pain signals are not disabled",kind:"author-defined metaphor"},
    {code:"H",name:"The Heart-Mark SSS Sync Engine",phase:2,domain:"spirit, soul and shadow creative vocabulary",kind:"fictional / interpretive framework"},
    {code:"J",name:"The Joint Compression Reset Rings",phase:2,domain:"joint awareness; never force popping or adjustment",kind:"author-defined metaphor"},
    {code:"L",name:"The Laryngeal Apple Oscillator",phase:2,domain:"voice, rhythm and speech; never manipulate the throat",kind:"author-defined metaphor"},
    {code:"P",name:"The Pure Zero-Odor Dermal Layer",phase:3,domain:"skin and hygiene; not a verified invariant",kind:"unverified physical claim"},
    {code:"R",name:"The Recumbent Porch Rest Frame",phase:3,domain:"posture and observation; not therapeutic guidance",kind:"author-defined metaphor"},
    {code:"V",name:"The Hand Vein Signature Map",phase:3,domain:"vascular patterns; not unbreakable authentication",kind:"unverified security claim"},
    {code:"Z",name:"The Zero-Buffer Execution Switch",phase:3,domain:"action planning; preserves deliberate safety checks",kind:"author-defined metaphor"},
    {code:"W",name:"Nervous System Wiring Logic",phase:0,domain:"non-clinical signal-routing model",kind:"executable demo"}
  ]);
  const SIGNALS=Object.freeze(["sensory","pain","speech","motor","cardiac","proprioception"]);
  const SEVERITIES=Object.freeze(["info","warning","urgent"]);
  const ROUTES=Object.freeze({
    OBSERVE:"Record the category and consider its context; no physical action is issued.",
    REVIEW:"Pause and check the source, context, and possible safer next step.",
    ATTEND:"Treat a pain-related signal as information; never force joints, neck or throat.",
    PAUSE:"Stop the simulated flow; significant or urgent symptoms need real-world assessment."
  });
  function whole(n) {
    if(typeof n!=="bigint" && !Number.isSafeInteger(n)) throw new TypeError("Whole integer required");
    return BigInt(n);
  }
  function build(a,b) {return whole(a)+whole(b);}
  function clear(a,b) {return whole(a)-whole(b);}
  function letterValue(c){
    if(typeof c!=="string" || !/^[A-Z]$/.test(c)) throw new TypeError("Single A-Z letter required");
    return c.charCodeAt(0)-64;
  }
  function middleHearing() {
    const above="HKQ",below="JMW";
    const mid=Array.from(above,(c,i)=>{
      const total=letterValue(c)+letterValue(below[i]);
      if(total%2!==0) throw new Error("No exact alphabetic midpoint");
      return String.fromCharCode(64+total/2);
    }).join("");
    return Object.freeze({above,middle:mid,below,interpretation:"I LISTEN TO (author-defined)"});
  }
  function processSignal(input) {
    if(!input || typeof input!=="object" || Array.isArray(input)) throw new TypeError("Signal object required");
    const type=input.type,severity=input.severity;
    if(!SIGNALS.includes(type)) throw new RangeError("Unsupported signal category");
    if(!SEVERITIES.includes(severity)) throw new RangeError("Unsupported severity");
    if(input.note!==undefined && (typeof input.note!=="string" || input.note.length>240)) throw new RangeError("Optional context must be at most 240 characters");
    const route=severity==="urgent"?"PAUSE":type==="pain"?"ATTEND":severity==="warning"?"REVIEW":"OBSERVE";
    // Deliberately discard note and do not persist raw context, identity or biometrics.
    return Object.freeze({
      schema:"nathan-one-wiring-simulation.v1",
      source:"demonstration only",
      signalType:type, severity, route,
      guidance:ROUTES[route],
      phases:Object.freeze([
        Object.freeze({name:"ADAPTATION",step:"Recognize the signal category and source boundary"}),
        Object.freeze({name:"BUILDING",step:"Evaluate context and protect the safety pause"}),
        Object.freeze({name:"CREATION",step:"Present a non-clinical educational response"})
      ]),
      actionExecuted:false,
      diagnosticConclusion:null,
      contextStored:false
    });
  }
  const api=Object.freeze({REGISTERS,SIGNALS,SEVERITIES,ROUTES,build,clear,middleHearing,processSignal});
  root.NathanNervousWiring=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
