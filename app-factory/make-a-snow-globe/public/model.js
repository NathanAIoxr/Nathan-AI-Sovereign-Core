export const scenes={aurora:"Crystal Staircase & Aurora",village:"Winter Village",forest:"Evergreen Forest",cosmos:"Pocket Galaxy",empty:"Snow Only"};
export const finishes={walnut:"Walnut & brass",silver:"Silver & stone",black:"Black & gold"};
export const layouts={
  single:{label:"1-globe Single",note:"One independent sphere.",points:[[360,290,218,"Sphere"]]},
  stack:{label:"3-globe Stacked Snowman",note:"Three chambers stacked from bottom to top.",points:[[360,435,106,"BELOW"],[360,245,84,"CENTER"],[360,100,61,"ABOVE"]]},
  pyramid:{label:"6-globe Sovereign Pyramid",note:"BELOW: Trinity · CENTER: Duality · ABOVE: Unity.",points:[[196,440,80,"BELOW · Left"],[360,440,80,"BELOW · Center"],[524,440,80,"BELOW · Right"],[278,299,78,"CENTER · Left"],[442,299,78,"CENTER · Right"],[360,164,76,"ABOVE · Unity"]]}
};
export const tiers={
  digital:{title:"Digital studio",price:"Free",details:"Design, shake and export your globe.",route:"Digital only"},
  insert:{title:"Personalized insert",price:"$29–$49",details:"Stock globe with printed artwork or an insert.",route:"Photo-globe supplier"},
  studio:{title:"Studio keepsake",price:"$89–$179",details:"Stock vessel with hand assembly and simple personalization.",route:"Local craft studio or independent maker"},
  bespoke:{title:"Bespoke sculpture",price:"$249–$499",details:"One-off sculpted scene inside a stock vessel.",route:"One-off sculptor or specialty globe maker"},
  collector:{title:"Collector showpiece",price:"$750+ planning floor",details:"Custom structure, multi-globe assemblies or complex finishes. Quote required.",route:"Specialty fabricator with packaging and seal testing"},
  production:{title:"Production run",price:"Quote only",details:"Sample, tooling, manufacturer minimum and freight quoted separately.",route:"Commercial snow-globe producer"}
};
const valid=(choices,value,fallback)=>Object.hasOwn(choices,value)?value:fallback;
const string=(value,limit)=>typeof value==="string"?value.replace(/[\r\n\t]/g," ").trim().slice(0,limit):"";
export function normalize(input={}){
  if(!input||typeof input!=="object")input={};
  const format=valid(layouts,input.format,"single");
  const bounded=(value,min,max,fallback)=>Number.isFinite(value)?Math.max(min,Math.min(max,Math.round(value))):fallback;
  const count=layouts[format].points.length;
  return {version:1,name:string(input.name,44),format,finish:valid(finishes,input.finish,"walnut"),
    snow:bounded(input.snow,0,100,55),engraving:string(input.engraving,42),
    scenes:Array.from({length:count},(_,i)=>valid(scenes,input.scenes?.[i],"aurora")),
    tier:valid(tiers,input.tier,"digital"),quantity:bounded(input.quantity,1,100000,1),destination:string(input.destination,80)};
}
export function makerSheet(d){
  const layout=layouts[d.format],tier=tiers[d.tier];
  const text=[
    "MAKE a SNOW GLOBE · Nathan Tabor","MAKER SHEET",d.name||"My snow globe","",
    "Structure: "+layout.label,"Finish: "+finishes[d.finish],"Snow amount: "+d.snow+"% (visual target)",
    "Engraving: "+(d.engraving||"None"),"Quantity: "+d.quantity,"Ship-to region: "+(d.destination||"To be provided"),
    "Option: "+tier.title,"Budget: "+(d.format==="single"||d.tier==="digital"?tier.price:"Individual quote for multi-globe structure")+" (USD; planning only)",
    "Route: "+(d.format==="single"||d.tier==="digital"?tier.route:"Specialty fabricator; confirm a stable support design"),
    "",...layout.points.map((p,i)=>p[3]+": "+scenes[d.scenes[i]]),"",
    "Ask the maker to quote materials, dimensions, mounting, leak testing, sample approval, packaging, lead time, shipping and duties.",
    "Attach the preview PNG. Confirm price and specifications before authorizing production."
  ];
  return text.join("\n");
}
