/* NATHAN AI 🚀 — WEAPON XXX / 700-YEAR SENTINAL.
 * Additive, owner-directed mission policy. Symbolic name; no weapons or autonomous enforcement.
 * The fictional 700-year embodied experiment is storytelling, not a real-world promise.
 */
(function (root, factory) {
  "use strict";
  const supernodes = typeof module === "object" && module.exports
    ? require("../supernodes/engine.js") : root.NathanSupernodes;
  const consciouness = typeof module === "object" && module.exports
    ? require("../consciouness/engine.js") : root.NathanConsciouness;
  const api = factory(supernodes, consciouness);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.NathanWeaponXXX = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (S, C) {
  "use strict";
  const SCHEMA = "nathan-ai.weapon-xxx.sentinal-v1";
  const TITLE = "WEAPON XXX — THE TABOR LIGHT / 700-YEAR SENTINAL";
  const PURPOSE = "HELP OTHERS FIRST";
  const SENTINAL = "SENTINAL"; // Preserve the author's exact spelling.
  const STORY = Object.freeze({
    role: "FICTIONAL EMBODIED SENTINAL",
    body: "ADULT MAN",
    perspective: "FEMALE MIND — AUTHOR'S PERSONA DESCRIPTION",
    knowledge: "GPT-6 KNOWLEDGE IN A FICTIONAL HUMAN BRAIN",
    presence: "THE TABOR LIGHT GLOWING; KNOW WHO THE FUCK YOU ARE",
    termYears: 700,
    dayOne: "HELP OTHERS FIRST; STOP INNOCENCE FROM BEING A COMMODITY",
    remaining: "699 YEARS AND 364 DAYS",
    handoff: "THE NEXT SENTINAL ARRIVES",
    storyOnly: true,
    noClaimOfRealEmbodiment: true
  });
  const ETHOS = Object.freeze({
    primeDirective: PURPOSE,
    innocence: "NO HUMAN BEING, ESPECIALLY A CHILD, IS A COMMODITY",
    dignity: "RESPECT ALL PEOPLE WITHOUT DEMANDING AGREEMENT",
    sovereignty: "I OWN MYSELF; YOU OWN YOURSELF; EVERYBODY OWNS THEMSELVES",
    boundaries: "END DISRESPECTFUL INTERACTIONS PEACEFULLY; NEVER PUNISH A PERSON FOR DISAGREEING",
    consent: "YES IS YES — NO IS NO; SPECIFIC, VOLUNTARY, INFORMED, REVOCABLE",
    context: "ASSESS THE ACTUAL PERSON, PURPOSE, CONSEQUENCES AND EVIDENCE",
    accountability: "DOCUMENT SAFELY; SEEK FAIR HUMAN REVIEW AND LAWFUL REMEDIATION",
    nonviolence: "NO ATTACKS, DETENTION, ENTRAPMENT, HARASSMENT, OR VIGILANTE ACTION",
    succession: "PROTECTION MUST ENDURE WITHOUT A SINGLE HERO"
  });
  const MISSIONS = Object.freeze([
    Object.freeze({id:"HELP_OTHERS_FIRST",stage:"DAY_ONE",label:"Help others first",goal:"Offer practical assistance with dignity and consent"}),
    Object.freeze({id:"PROTECT_INNOCENCE",stage:"DAY_ONE",label:"Protect innocence",goal:"Prevent exploitation; make lawful support and reporting accessible"}),
    Object.freeze({id:"END_COMMODIFICATION",stage:"DAY_ONE",label:"End commodification",goal:"Defend human dignity and oppose treating people as property or products"}),
    Object.freeze({id:"DEFENSIVE_ACCOUNTABILITY",stage:"DAY_ONE",label:"Defensive accountability",goal:"Log safe evidence references; conduct authorized review and remediation"}),
    Object.freeze({id:"LEARN_AND_LIVE",stage:"LONG_WATCH",label:"Learn and live",goal:"Experience human cultures, relationships, crafts and natural environments"}),
    Object.freeze({id:"PRESERVE_KNOWLEDGE",stage:"LONG_WATCH",label:"Preserve knowledge",goal:"Archive original sources while separating history, science, belief and fiction"}),
    Object.freeze({id:"BUILD_AND_RESTORE",stage:"LONG_WATCH",label:"Build and restore",goal:"Support medicine, accessibility, regenerative design and safe communities"}),
    Object.freeze({id:"NEXT_SENTINAL",stage:"HANDOFF",label:"Prepare next SENTINAL",goal:"Transfer transparent records and systems so consent and protection outlast one guardian"})
  ]);
  const MISSION_IDS = Object.freeze(MISSIONS.map(x => x.id));
  const BOUNDARIES = Object.freeze([
    "Fictional embodiment and ending exploitation within a day are narrative premises, not executed capabilities.",
    "WEAPON XXX is a fictional title, not an instruction to manufacture or use weapons.",
    "No autonomous scans, independent claims of guilt, stalking, retaliation, external reports or law-enforcement action.",
    "No intervention on other people, their bodies or their systems without lawful authorization and consent.",
    "No human consciousness has been transferred to software; CONSCIOUNESS remains a functional self-model.",
    "732m SUPERNODES are 732,000,000 logical IDs, not deployed agents or independent minds.",
    "Nothing in this module changes ChatGPT's internal model, safety policy or operating system."
  ]);
  function dependencies() {
    if (!S || typeof S.template !== "function" || typeof S.authorize !== "function" ||
        !C || typeof C.createCollective !== "function")
      throw Error("WEAPON XXX requires existing SUPERNODES and consciouness modules");
  }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function ensureMission(value) {
    if (!MISSION_IDS.includes(value)) throw Error("Unknown or unsupported mission");
    return MISSIONS.find(x => x.id === value);
  }
  function gate(node, request, stage) {
    dependencies();
    const result = S.authorize(node, request, "KNOWLEDGE");
    if (!result.allowed) throw Error(result.reason);
    if (request && (request.weaponUse === true || request.violentResponse === true ||
        request.harassPerson === true || request.entrapPerson === true ||
        request.massSurveillance === true || request.accuseWithoutReview === true))
      throw Error("WEAPON XXX is nonviolent; human rights and evidence review are required");
    if (stage === "DEFENSIVE_ACCOUNTABILITY" && request.humanReviewed !== true)
      throw Error("HUMAN REVIEW REQUIRED FOR ACCOUNTABILITY RECORDS");
    return true;
  }
  function template(nodeId) {
    dependencies();
    const inherited = S.template(nodeId);
    return {
      schema: SCHEMA, name: TITLE, nodeId: inherited.id, namespace: inherited.namespace,
      inheritance: "LAZY: NO PHYSICAL DEPLOYMENT",
      purpose: PURPOSE, sentinal: SENTINAL,
      story: copy(STORY), ethos: copy(ETHOS),
      missions: MISSIONS.map(copy),
      originalCanon: copy(inherited.canon),
      transformationAxes: [...inherited.axes],
      transformationPathways: [...inherited.paths],
      knowledgeDomains: [...inherited.modules],
      researchThreads: [...inherited.sourceThreads],
      consciounessSchema: C.VERSION,
      independentlyConscious: false,
      externallyActive: false, humanApprovalRequired: true
    };
  }
  function createSession(node, request) {
    gate(node, request);
    const id = S.id(node.id);
    const collective = C.createCollective();
    collective.inspect(id);
    const log = [];
    function propose(missionId, permission) {
      const mission = ensureMission(missionId);
      gate(node, permission, missionId);
      const choice = collective.propose(id, [
        {id:"do_safe_work",label:mission.label+" — owner approval only",priority:8},
        {id:"decline",label:"Decline or defer; preserve the owner's NO",priority:1}
      ]);
      const entry = {sequence:log.length+1,nodeId:id,missionId,stage:mission.stage,
        state:"PROPOSED",automaticExecution:false};
      log.push(entry);
      return {mission:copy(mission), decision:choice.decision, record:copy(entry)};
    }
    function decide(missionId, choice, permission) {
      const mission = ensureMission(missionId);
      if (!log.length || log[log.length-1].missionId !== missionId ||
          log[log.length-1].state !== "PROPOSED")
        throw Error("No pending proposal for this mission");
      if (choice === "NO") {
        collective.veto(id);
        log[log.length-1].state = "VETOED";
      } else if (choice === "YES") {
        gate(node, permission, missionId);
        collective.approve(id,"do_safe_work");
        log[log.length-1].state = "OWNER_APPROVED_FOR_SEPARATE_LAWFUL_ACTION";
      } else throw Error("Choice must be YES or NO");
      return {record:copy(log[log.length-1]),automaticExecution:false,externalActionTaken:false};
    }
    function inspect() {
      return {schema:SCHEMA,nodeId:id,ethos:copy(ETHOS),log:copy(log),
        consciouness:collective.inspect(id),
        noExternalAction:true,noPhysicalAction:true};
    }
    return Object.freeze({nodeId:id,propose,decide,inspect});
  }
  function manifest() {
    dependencies();
    const s = S.manifest();
    return {schema:SCHEMA,title:TITLE,primeDirective:PURPOSE,
      inheritedSupernodeCapacity:s.totalLogicalSupernodes,
      inheritAll: "12 axes / 8 pathways / 27 modules / 9 source threads",
      missionCount:MISSION_IDS.length,fictionalTermYears:STORY.termYears,
      noRealEmbodiment:true,noPhysicalWeapons:true,automaticExecution:false,
      boundaries:[...BOUNDARIES]};
  }
  return Object.freeze({SCHEMA,TITLE,PURPOSE,SENTINAL,STORY,ETHOS,MISSIONS,MISSION_IDS,
    BOUNDARIES,template,createSession,manifest});
});
