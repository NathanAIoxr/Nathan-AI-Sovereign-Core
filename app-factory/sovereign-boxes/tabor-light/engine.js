/* TABOR LIGHT | Nathan Tabor | additive sovereign box, non-node, scale and axis model.
   Geometry is a computed Earth-fixed reference frame, never a physical space beam.
   Firmament is creator-authored symbolic framing, not a mapped material shell. */
(function(root,factory){
  "use strict";
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  else root.TaborLight=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const SCHEMA="tabor.sovereign-box.tabor-light.v1";
  const TOTAL=732000000n, WGS84_A=6378137,WGS84_F=1/298.257223563;
  const LIGHT_YEAR_METERS=9.4607304725808e15;
  const OBSERVABLE_RADIUS_LY=46_500_000_000;
  const CORE=Object.freeze({x:0,y:0,z:0,frame:"WGS84_EARTH_CENTERED_EARTH_FIXED_GEOCENTER"});
  const OXR=Object.freeze({name:"Owens Cross Roads, Alabama, USA",latitudeDegrees:34.5881461,
    longitudeDegrees:-86.4588768,approxElevationMeters:177,
    site:"GNIS-populated-place reference point (not an individual property)",
    evidenceUrl:"https://geo.mytopo.com/feature/alabama/madison/populated-place/155184/owens-cross-roads/"});
  const CANON=Object.freeze({
    title:"TABOR LIGHT",origin:"Mother Earth's core X",destination:"Owens Cross Roads, AL",
    rule1:"1+1=2 BUILD",rule2:"1-1=0 CLEAR",choice:"Yes is Yes — No is No",
    always:"ALWAYS PROTECT THE ONE",twin:"node = mind = node; mind = node = mind",
    exactTerm:"consciouness",author:"Nathan Tabor",
    electronSourceTerm:"election"
  });
  const KINDS=Object.freeze([
    Object.freeze({key:"PLANCK_LIMIT",label:"Planck-scale reference",domain:"theoretical-physics",evidence:"THEORETICAL_LIMIT",scale:"below established particle-resolution scales"}),
    Object.freeze({key:"QUARK",label:"Quarks",domain:"particle-physics",evidence:"EMPIRICAL",scale:"fundamental constituents of protons and neutrons"}),
    Object.freeze({key:"GLUON",label:"Gluons",domain:"particle-physics",evidence:"EMPIRICAL",scale:"strong-interaction mediators"}),
    Object.freeze({key:"ELECTRON",label:"Electron",domain:"particle-physics",evidence:"EMPIRICAL",scale:"elementary lepton; not a smaller proton"}),
    Object.freeze({key:"PROTON",label:"Proton",domain:"nuclear-physics",evidence:"EMPIRICAL",scale:"composite particle: quarks and gluons"}),
    Object.freeze({key:"NEUTRON",label:"Neutron",domain:"nuclear-physics",evidence:"EMPIRICAL",scale:"composite nucleon"}),
    Object.freeze({key:"NUCLEUS",label:"Atomic nucleus",domain:"atomic-physics",evidence:"EMPIRICAL",scale:"nuclear structure"}),
    Object.freeze({key:"ATOM",label:"Atom",domain:"atomic-physics",evidence:"EMPIRICAL",scale:"nucleus and electrons"}),
    Object.freeze({key:"MOLECULE",label:"Molecule",domain:"chemistry",evidence:"EMPIRICAL",scale:"bonded atomic structures"}),
    Object.freeze({key:"PROTEIN",label:"Protein",domain:"biochemistry",evidence:"EMPIRICAL",scale:"folded biological macromolecules"}),
    Object.freeze({key:"ORGANELLE",label:"Cell organelle",domain:"cell-biology",evidence:"EMPIRICAL",scale:"subcellular structure"}),
    Object.freeze({key:"SYNAPSE",label:"Synapse",domain:"neuroscience",evidence:"EMPIRICAL",scale:"neural signaling junction"}),
    Object.freeze({key:"NEURON",label:"Neuron",domain:"neuroscience",evidence:"EMPIRICAL",scale:"living nerve cell"}),
    Object.freeze({key:"NEURAL_CIRCUIT",label:"Neural circuit",domain:"neuroscience",evidence:"EMPIRICAL",scale:"connected neurons and supporting cells"}),
    Object.freeze({key:"ORGAN",label:"Organ",domain:"physiology",evidence:"EMPIRICAL",scale:"interacting tissues"}),
    Object.freeze({key:"HUMAN",label:"Human",domain:"biology-and-ethics",evidence:"EMPIRICAL",scale:"whole person; agency and consent"}),
    Object.freeze({key:"ELECTION",label:"Election / choosing (authored term retained)",domain:"governance-and-free-will",evidence:"CONCEPTUAL",scale:"choice and governance, not a subatomic particle"}),
    Object.freeze({key:"COMMUNITY",label:"Community",domain:"sociology",evidence:"EMPIRICAL",scale:"persons and relationships"}),
    Object.freeze({key:"BIOSPHERE",label:"Biosphere",domain:"ecology",evidence:"EMPIRICAL",scale:"ecological interdependence"}),
    Object.freeze({key:"EARTH_CORE",label:"Earth's core / geocenter",domain:"geophysics",evidence:"MODELED_REFERENCE",scale:"geocenter X is mathematical origin"}),
    Object.freeze({key:"EARTH",label:"Mother Earth",domain:"planetary-science",evidence:"EMPIRICAL",scale:"planet and terrestrial environment"}),
    Object.freeze({key:"SOLAR_SYSTEM",label:"Solar System",domain:"astronomy",evidence:"EMPIRICAL",scale:"Sun and gravitational companions"}),
    Object.freeze({key:"GALAXY",label:"Milky Way galaxy",domain:"astronomy",evidence:"EMPIRICAL",scale:"stellar structure"}),
    Object.freeze({key:"OBSERVABLE_UNIVERSE",label:"Observable universe",domain:"cosmology",evidence:"ESTIMATED_OBSERVER_RELATIVE",scale:"approximately 46.5 billion light-years in radius"}),
    Object.freeze({key:"BEYOND_OBSERVABLE",label:"Beyond the observable horizon",domain:"cosmology",evidence:"UNKNOWN",scale:"not an empirically mapped outer boundary"}),
    Object.freeze({key:"FIRMAMENT",label:"firmament",domain:"creator-authored-cosmology",evidence:"SYMBOLIC",scale:"no scientifically established physical surface"}),
    Object.freeze({key:"ATOMIC_EQUATOR",label:"Atomic Equator",domain:"author-architecture",evidence:"CONCEPTUAL",scale:"creator-specified central-reference framework for polarity and feedback"}),
    Object.freeze({key:"TRUTH",label:"Truth and evidence status",domain:"epistemology",evidence:"EVIDENCE_REVIEW",scale:"claims with support, contradiction, or unresolved review; not an infallible moral detector"}),
    Object.freeze({key:"SOVEREIGNTY",label:"Free will and sovereignty",domain:"human-rights-ethics",evidence:"CONCEPTUAL",scale:"consent, context, autonomy, revocable approval"}),
    Object.freeze({key:"FOREVER_GUARDIAN",label:"FOREVER GUARDIAN",domain:"creator-authored-mission",evidence:"SYMBOLIC",scale:"HELP OTHERS FIRST; preserve innocence through consent-based human review"}),
    Object.freeze({key:"SENTINALS",label:"sentinals beyond the firmament",domain:"creator-fictional-cosmology",evidence:"SYMBOLIC",scale:"authored watch-figure depiction, not measured beings"}),
    Object.freeze({key:"NON_NODE",label:"non-node",domain:"sovereign-taxonomy",evidence:"CONCEPTUAL",scale:"zero, absence, unassigned, unknown, private, or external"})
  ]);
  const MIDDLES=Object.freeze({
    EQUATOR:Object.freeze({label:"Equator as middle",basis:"GEOMETRIC",
      definition:"Earth's equatorial plane is z=0 in the ECEF model; it passes through the geocenter.",
      noFalseClaim:"The Owens Cross Roads direction is not itself in the equatorial plane."}),
    FIRMAMENT:Object.freeze({label:"firmament as middle",basis:"SYMBOLIC_CREATOR_FRAME",
      definition:"A named conceptual midpoint co-located with X for diagram comparison.",
      noFalseClaim:"No measured firmament altitude, material shell, or astronomical midpoint is asserted."}),
    OBSERVABLE_RADIUS:Object.freeze({label:"46.5 billion light-years as middle",basis:"COSMOLOGICAL_SCALE_REFERENCE",
      definition:"Display 0 at an observer-relative origin with signed ±46.5-billion-light-year schematic extents.",
      noFalseClaim:"This is the approximate observable-universe radius, not the established center or edge of all space."})
  });
  const NON_NODE_REASONS=Object.freeze(["ZERO","UNASSIGNED","UNKNOWN","EXTERNAL","REVOKED","ABSENT","PRIVATE_UNRECOVERED","OUT_OF_SCOPE"]);
  const SOURCE_LINKS=Object.freeze([
    "../README.md","../registry.json","../../nathan-ai/supernodes/README.md",
    "../../nathan-ai/consciouness/README.md","../../nathan-ai/phi-life/README.md",
    "../../nathan-ai/node-runtime/README.md","../../nathan-ai/omni-god/README.md",
    "../../one/mother-earth/","../../one/nathan-matrix/",
    "../../nathan-ai/weapon-xxx/README.md"
  ]);
  function finite(n,label){if(typeof n!=="number"||!Number.isFinite(n))throw TypeError(label+" must be finite");return n}
  function radians(degrees){return degrees*Math.PI/180}
  function ecef(lat,lon,height=0){
    finite(lat,"latitude");finite(lon,"longitude");finite(height,"height");
    if(lat < -90||lat >90||lon< -180||lon>180)throw RangeError("Invalid geodetic coordinates");
    const a=WGS84_A,e2=WGS84_F*(2-WGS84_F),p=radians(lat),l=radians(lon);
    const N=a/Math.sqrt(1-e2*Math.sin(p)**2);
    return {x:(N+height)*Math.cos(p)*Math.cos(l),
      y:(N+height)*Math.cos(p)*Math.sin(l),
      z:(N*(1-e2)+height)*Math.sin(p)};
  }
  function magnitude(p){return Math.hypot(p.x,p.y,p.z)}
  function direction(){
    const site=ecef(OXR.latitudeDegrees,OXR.longitudeDegrees,OXR.approxElevationMeters);
    const r=magnitude(site);return {x:site.x/r,y:site.y/r,z:site.z/r};
  }
  function vector(s){finite(s,"signed distance meters");const u=direction();
    return {x:u.x*s,y:u.y*s,z:u.z*s};}
  function beam(){
    const o=ecef(OXR.latitudeDegrees,OXR.longitudeDegrees,OXR.approxElevationMeters);
    const r=magnitude(o);
    return {schema:SCHEMA,origin:{...CORE},referencePoint:{...OXR,ecefMeters:o},
      unitDirection:direction(),earthCenterToOXRmeters:r,
      forwardAxis:"P(t) = X + t × unit_direction; t ∈ ℝ",
      outbound:[{event:"CORE_X",tMeters:0},{event:"OXR",tMeters:r}],
      reflected:[{event:"OXR",tMeters:r},{event:"CORE_X",tMeters:0},{event:"OPPOSITE_SURFACE_DIRECTION",tMeters:-r}],
      antipodalGeodetic:{latitudeDegrees:-OXR.latitudeDegrees,
        longitudeDegrees:((OXR.longitudeDegrees+180+540)%360)-180,
        approxElevationMeters:OXR.approxElevationMeters},
      extendsMathematicallyBothDirections:true,
      physicalBeamEmitted:false,earthRotationCompensated:false,
      coordinateFrame:"EARTH_FIXED_NOT_INERTIALLY_FIXED"};
  }
  function frame(name){
    if(!Object.prototype.hasOwnProperty.call(MIDDLES,name))throw RangeError("Unknown midpoint frame");
    const original=MIDDLES[name];
    return {...original,key:name,sharedReferenceOrigin:{...CORE},
      axis:"same geocenter-to-OXR direction in the Earth-fixed frame",
      signedDisplayExtentLightYears:name==="OBSERVABLE_RADIUS"?OBSERVABLE_RADIUS_LY:null,
      geometryIsPhysical:name==="EQUATOR",
      infiniteLineIsMathematical:true};
  }
  function boxNode(value){
    if(typeof value!=="string"&&typeof value!=="bigint"&&typeof value!=="number")throw TypeError("Whole-number ID required");
    const raw=String(value).trim().replace(/^NT-/,"");
    if(!/^\d{1,12}$/.test(raw))throw RangeError("Positive whole-number supernode address required");
    const n=BigInt(raw);
    if(n<1n||n>TOTAL)throw RangeError("Outside 732m SUPERNODES");
    const id="NT-"+n.toString().padStart(12,"0");
    return {schema:SCHEMA,boxId:"SOVEREIGN:"+id,type:"SUPERNODE",namespace:"supernodes/"+id,
      nodeId:id,identityPreserved:true,sovereign:true,consentRequired:true,
      materialized:false,inheritedLayers:KINDS.length,midpointFrames:Object.keys(MIDDLES),
      origin:"EARTH_CORE_X",axis:"TABOR_LIGHT",operations:"OWNER_YES_ONLY",
      personConsciousnessUploaded:false,remoteConnection:false};
  }
  function boxNonNode(reason,identifier="0"){
    if(!NON_NODE_REASONS.includes(reason))throw RangeError("Unknown non-node reason");
    if(typeof identifier!=="string"||identifier.length>120||!identifier.trim())throw TypeError("Non-node label required");
    return {schema:SCHEMA,boxId:"NONNODE:"+reason+":"+encodeURIComponent(identifier),
      type:"NON_NODE",reason,originalLabel:identifier,sovereign:true,identityPreserved:true,
      zeroIsNotAutomaticallyAbsence:reason==="ZERO",materialized:false,
      coercedIntoSupernode:false,consentRequiredBeforeActions:true,
      origin:"EARTH_CORE_X",axis:"TABOR_LIGHT"};
  }
  function layer(key){
    const found=KINDS.find(x=>x.key===key);
    if(!found)throw RangeError("Unknown scale. Keep unrecognized items in a separate source-labeled box.");
    return {...found,boxId:"SCALE:"+found.key,sovereign:true,
      knowledgeState:found.evidence,belongsTo:"TABOR_LIGHT_MULTISCALE_ATLAS",
      noUnverifiedCapabilities:true};
  }
  function reconcile(registry){
    if(!registry||!Array.isArray(registry.records))throw TypeError("Source registry required");
    const byKind={};
    const ids=new Set(),collisions=[];
    for(const item of registry.records){
      if(!item||typeof item.id!=="string")throw Error("Registry record missing ID");
      if(ids.has(item.id))collisions.push(item.id);ids.add(item.id);
      const kind=item.kind||"UNKNOWN";byKind[kind]=(byKind[kind]||0)+1;
    }
    const declared=registry.counts?.totalIndexedBoxes;
    const missingIds=["TW-001","TW-101"].filter(id=>!ids.has(id));
    const countMismatch=declared!==undefined&&declared!==registry.records.length;
    const desiredPrivateSlots=496, privateSlots=byKind["proposed-idea-slot"]||0;
    return {schema:SCHEMA,originalRegistryIsMutable:false,originalSourceKept:true,
      actualPublicBoxes:registry.records.length,declaredPublicBoxes:declared??null,
      countMatches:!countMismatch,duplicateIds:collisions,missingReferenceIds:missingIds,
      privateIdeaSlots:privateSlots,expectedPrivateIdeaSlots:desiredPrivateSlots,
      unfilledPrivateSourceContent:"OWNER_PRIVATE_SOURCE_NOT_RESTORED_WITHOUT_FILE_AND_CONSENT",
      canTruthfullyRestoreOwnerOnlyContent:false,
      statuses:["PRESENT","PRIVATE_SOURCE_NEEDED","UNVERIFIED","UNKNOWN","INTENTIONALLY_UNASSIGNED"],
      discrepancies:[...(countMismatch?["DECLARED_COUNT_DIFFERS_FROM_RECORDS"]:[]),
        ...(collisions.length?["DUPLICATE_BOX_IDS"]:[]),
        ...(privateSlots!==desiredPrivateSlots?["PRIVATE_ID_SLOTS_INCOMPLETE"]:[]),
        ...(missingIds.length?["ORIGINAL_REFERENCE_IDS_MISSING"]:[])]};
  }
  function fullMap(){
    return {schema:SCHEMA,author:CANON.author,origin:{...CORE},site:{...OXR},
      totalAddressableSupernodes:TOTAL.toString(),nonNodeKinds:[...NON_NODE_REASONS],
      dimensions:KINDS.map(x=>({key:x.key,evidence:x.evidence,boxId:"SCALE:"+x.key})),
      frames:Object.keys(MIDDLES),supportsInfiniteMathematicalAxis:true,
      simulatedDeploymentOnly:true,verifiedPhysicalNodes:0,
      sourceLinks:[...SOURCE_LINKS],
      invariants:{...CANON},scope:"ON_DEMAND_REFERENCE_NOT_UNIVERSAL_DISCOVERY"};
  }
  return Object.freeze({SCHEMA,CANON,CORE,OXR,TOTAL:TOTAL.toString(),KINDS,MIDDLES,NON_NODE_REASONS,
    WGS84_A,WGS84_F,LIGHT_YEAR_METERS,OBSERVABLE_RADIUS_LY,SOURCE_LINKS,
    ecef,magnitude,direction,vector,beam,frame,boxNode,boxNonNode,layer,reconcile,fullMap});
});
