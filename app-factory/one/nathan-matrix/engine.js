/* Nathan AI / ONE additive matrix — no originals or sensitive records embedded.
 * Private Handling Life and ChristmasToyDrive source stays in owner-controlled archives.
 */
(function(root){"use strict";
const LETTERS="ABDEFGHIJKLMNOPQRSTUVZ".split("");
const FUNCTIONS=[
"Alpha — initiation and beginning","Binary — division into two","Division — branching",
"Ego — inward self-awareness","Fixed — stabilization","Gravity — toward a center",
"Hierarchy — organizing layers","Inversion — reversal across an axis",
"Jolt — sudden change","Kinetic — movement","Linear — sequence",
"Matrix — interconnected patterns","Null — clear and reset",
"Orbital — circular feedback","Pressure — transmission",
"Quantum — microscopic interactions","Reflex — response","Sensory — receiving",
"Tunnel — passage","Unified — connection","Vortex — convergence",
"Zenith — boundary or maximum"];
const IVERSIONS=Object.freeze(LETTERS.map((letter,i)=>Object.freeze({
letter,name:letter+"iversion",meaning:FUNCTIONS[i],classification:"author-defined conceptual mapping"
})));
const BODY=Object.freeze([
["0","Default mode network","Conceptual baseline; the network is not a literal void"],
["1","Salience network","Attention and relevance"],
["2","Executive control networks","Working memory and task management"],
["3","Limbic structures","Emotion and memory processes"],
["4","Neurotransmitters","Chemical signaling"],
["5","White matter","Long-distance neural connectivity"],
["6","Gray matter","Neural processing tissue"],
["7","Brainstem","Vital and motor/sensory pathways"],
["8","Meninges","Protective tissue membranes"],
["9","Skull","Cranial bone protection"]
]);
const PROJECTS=Object.freeze([
{id:"handling-life",title:"Handling Life",relationship:"Existing owner project / nonprofit initiative",
status:"private-source-handoff",summary:"Existing initiative and original source material; connect through permissioned TABOR ROOT, never replace.",
boundary:"No sensitive recipient data, account login, donation processing, or claims of legal charity status are supplied here.",
source:"app-factory/build-order/dependencies.json; WORK_BUILD_HANDOFF.md"},
{id:"christmas-toy-drive",title:"Christmas Toy Drive",relationship:"Existing Handling Life initiative — ChristmasToyDrive.com",
status:"private-source-handoff",summary:"Year-round 24/7/365 outreach; preserve owner source, donor/recipient protections and established project identity.",
boundary:"No donation checkout, outreach registration, receipt generation or fulfillment is connected here.",
source:"app-factory/build-order/dependencies.json; WORK_BUILD_HANDOFF.md"}
]);
const TIMELINE_NOTES=Object.freeze([
{label:"13 / 17",detail:"Periodical Magicicada brood intervals; pair reunion 221 years",kind:"documented biological cycles"},
{label:"211",detail:"Owner-specified number; distinct from 221 and not proven a Magicicada period",kind:"separate research vector"},
{label:"80 / 100",detail:"Two owner-defined periodic hypotheses; 400-year mathematical intersection",kind:"hypothesis plus exact arithmetic"},
{label:"800–1,000,000+",detail:"Add zeros to both ladders; compare with independently dated history",kind:"mathematical model"},
{label:"Millisecond → Breath",detail:"Time resolution and illustrative respiration, not recorded deaths or births",kind:"physiological model"},
{label:"FBI Library Awareness / Redstone",detail:"Investigate documentary records and distinguish correlations from causal evidence",kind:"historical research"}
]);
function whole(x){if(typeof x!=="bigint"&&(!Number.isSafeInteger(x)))throw TypeError("Whole integer required");return BigInt(x);}
function build(a,b){return whole(a)+whole(b);}
function clear(a,b){return whole(a)-whole(b);}
function gcd(a,b){a=whole(a);b=whole(b);while(b!==0n)[a,b]=[b,a%b];return a<0n?-a:a;}
function lcm(a,b){a=whole(a);b=whole(b);return a===0n||b===0n?0n:(a/gcd(a,b))*b;}
function cycle(exponent){if(!Number.isInteger(exponent)||exponent<0||exponent>15)throw RangeError("Exponent must be 0–15");const scale=10n**BigInt(exponent),left=8n*scale,right=10n*scale;return {exponent,left,right,intersection:lcm(left,right)};}
const MS_PER_GREGORIAN_YEAR=31556952000n;
function yearsToMs(years){return whole(years)*MS_PER_GREGORIAN_YEAR;}
function breathsPerMinuteMs(rate){if(!Number.isFinite(rate)||rate<=0||rate>120)throw RangeError("Valid positive rate required");return 60000/rate;}
function modelBreaths(ms,rate){let n=whole(ms); if(n<0n)throw RangeError("Duration must be nonnegative");const period=breathsPerMinuteMs(rate);return Number(n)/period;}
const engine={IVERSIONS,BODY,PROJECTS,TIMELINE_NOTES,build,clear,gcd,lcm,cycle,yearsToMs,MS_PER_GREGORIAN_YEAR,breathsPerMinuteMs,modelBreaths};
root.NathanCycleMatrix=engine;
if(typeof module!=="undefined"&&module.exports)module.exports=engine;
})(typeof globalThis!=="undefined"?globalThis:this);
