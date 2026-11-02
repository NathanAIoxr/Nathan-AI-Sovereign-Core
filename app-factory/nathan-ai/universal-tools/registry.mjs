/* Nathan AI / ONE: public educational design index. Author labels are preserved;
   the "status" field is an editorial confidence classification, not proof. */
export const SCHEMA = 'nathan-ai-universal-tools.v1';
export const STATUS = Object.freeze({
  H:'Only the parent tradition is documented; THIS ITEM has no individual artifact verification',
  C:'Authorial comparative variant; this exact name and shape are NOT historically authenticated',
  P:'Unverified historical claim or name — do not present as fact',
  R:'Related object category, not proof of a historical hairpin or weapon subtype',
  O:'Modern original/invented collector design — NOT a historical artifact'
});
const seed = [
 {id:1,title:'Japanese Shaken Master Collection',subtitle:'Wheels of Strategy',origin:'Japan',mechanic:'Radial symmetry and rotation',geometry:'radial',
  names:'Juji-Shuriken|Senban-Shuriken|Sanpō-Shuriken|Goppō-Shuriken|Roppō-Shuriken|Happō-Shuriken|Manji-Shuriken|Hishi-Gane|Kumode-Shuriken|Shoken-Shuriken|Kikuka-Shuriken|Fukumibari-Ring|PEACE WHEEL',
  status:'H H P P C H P P P O O O O',shapes:'cross|diamond plate|three-point radial|five-point radial|six-point radial|eight-point radial|hooked pinwheel|disk|spider-like radial|ring with arms|floral radial|small halo|concentric harmony'},
 {id:2,title:'Indian Chakram Wheel Set',subtitle:'Airfoils of the Vanguard',origin:'South Asia',mechanic:'Ring geometry and rotational stability',geometry:'ring',
  names:'Mula Chakram|Vakra-Dhar|Nabho-Chakra|Kshura-Ring|Ardha-Chandra|Jala-Chakra|Agni-Chakra|Mantra-Gane|Karala-Blade|Sukshma-Chakra|Kundala-Vrita|Dharma-Chakra|UNIVERSAL HARMONY RING',
  status:'C O O O R O O O O O O R O',shapes:'thick annulus|wave circle|braced circle|serrated circle|crescent|lightweight ring|grooved circle|engraved disk|hooked ring|small disk|coiled ring|spoked wheel|plain circle'},
 {id:3,title:'Central African Kpinga Collection',subtitle:'Winged Blades of the Great Forest',origin:'Central Africa',mechanic:'Asymmetry and rotational inertia',geometry:'branch',legacy13:'Court of Accord — earlier proposed centerpiece',
  names:'Kpinga Baseline|Mambele-Leaf|Pingah-Phallus|Hungamunga-Hook|Za-Wing|Kulbeda-Spike|Trombash-Crescent|Njiga-Spider|Gaa-Ma|Musele-Oar|Kondondo|Kilonda-Master|Royal Pingha — fictional flyer centerpiece',
  status:'H C C P O O P O O R O O O',shapes:'three-wing silhouette|leaf-shaped branches|figural projection|L-curve|flat wing|narrow branches|crescent|four hooks|blunt geometry|paddle silhouette|notched branch|tiered shape|fictional bat-wing silhouette; not museum-verified'},
 {id:4,title:'Global Star-Arrowhead Matrix',subtitle:'Lithic and Forged Projectile Points',origin:'Multiple continents',mechanic:'Point symmetry, sectional geometry and material',geometry:'point',
  names:'Clovis Fluted|Cahokia Side-Notched|Snowflake Serrated|Trilobate Bronze|Quadrolate Iron|Bell-Beaker Barbed|Agate-Eccentric|Medieval Bodkin|Crescent Broadhead|Maya Stemmed Obsidian|Harpoon-Tang|Pax-Standard|PLOWSHARE POINT',
  status:'H P O H P C C H C C H O O',shapes:'lanceolate|side notches|branching frost motif|three-sided cross-section|four-sided cross-section|barbed form|eccentric stone|narrow square|crescent|stemmed glass|barbs and tang|uniform point|plow motif'},
 {id:5,title:'Universal Boomerang & Airfoil Wing',subtitle:'The Seven-Continent Flying Sticks',origin:'Global comparative',mechanic:'Curvature, drag, spin and lift',geometry:'curve',
  names:'Classic Kylie|Egyptian Throwing Stick|Hopi Rabbit Stick|Magdeburg Wing|Indian Valari|Amazonian Macana Wing|Antarctic Airfoil Rotor|Returning Boomerang|Nile Marsh Throwing Stick|Obłazowa Boomerang|Little Salt Spring Curve|Number 7 Hooked Form|Fire-Drill Bow & Inertial Flywheel',
  status:'H H H O H P R H C H H H O',shapes:'L-shaped arc|curved stick|hooked stick|proposed wing|crescent|proposed plaque|modern rotor|returning arc|curved stick|prehistoric curve|wooden curve|hooked shape|spindle and flywheel',
  legacy13:'UNITY WING'},
 {id:6,title:'Bolas & Kinetic Star Cord',subtitle:'The Seven-Continent Weighted Entanglers',origin:'Global comparative',mechanic:'Momentum, tension and entanglement',geometry:'cord',
  names:'Gaucho Boleadoras|Inuit Bird Bola|Rift Valley Leg-Lock|Okinawan Surujin|Roman Retiarius Net|Australian Corded Stone Snare|Antarctic Rocket Tether|Patagonian Two-Weight Bola|Patagonian Three-Weight Bola|Casting-Net Sinkers|Knot Map|Constellation Cord|Fire-Drill Bow & Inertial Flywheel',
  status:'H H O R R O O H H R O O O',shapes:'three connected weights|multiweight cord|proposed weights|chain and weights|weighted net|proposed cord|modern tether analogy|two connected weights|three connected weights|weighted net perimeter|knot diagram|star cord diagram|spindle and flywheel',
  legacy13:'ACCORD KNOT'},
 {id:7,title:'Atlatl & Lever-Action Spear',subtitle:'The Seven-Continent Mechanical Extension',origin:'Global comparative',mechanic:'Lever arms, torque and mechanical advantage',geometry:'lever',
  names:'Basketmaker Atlatl|Solutrean Spear-Thrower|Australian Woomera|Andean Estólica|Paleolithic Siberian Lever|Bushman Spring-Board|Antarctic Pneumatic Harpoon|Magdalenian Antler Lever|Aztec Atlatl|Arctic Harpoon Thrower|Woodland Spear-Thrower|Oceanian Spear-Thrower|Fire-Drill Bow & Inertial Flywheel',
  status:'H P H H O O R H H H C C O',shapes:'lever and spur|carved lever|woomera lever|Andean lever|proposed lever|proposed springboard|modern launcher analogy|antler lever|historical lever|harpoon throwing board|wooden lever|regional lever|spindle and flywheel',
  legacy13:'CONSERVATION LEVER'},
 {id:8,title:'Hairpins of Humanity',subtitle:'The Thirteen Forms Across Civilizations',origin:'Global comparative',mechanic:'Support, fastening, ornament and ritual',geometry:'pin',
  names:'Prehistoric Talisman — Sacred Stick|Egyptian Sacred Pin — Eternity|Chinese Ji — Womanhood|Roman Acus — Empire|Chinese Buyao — Dancing Crown|Andean Tupu — Silver Guardian|Mimikaki Kanzashi — Advantage|Korean Binyeo — Royal Guardian|Fuzhou Three Knives — Defenders|Western Hatpin — Streetcar Defender|French Aigrette — Feathered Crown|Modern Bobby Pin — Invisible Revolution|UNIVERSAL HAIRPIN',
  status:'C H H H H R H H H R R H O',shapes:'plain rod|ornamental rod|straight hairpin|decorated single pin|dangling finial|clothing pin (related)|ear-scoop pin|transverse rod|three decorative pins|hat fastener (related)|feather ornament (related)|folded steel loop|symbolic universal stick'}
];
const regions = {
  4:['North America','North America','Original design','Europe / Mediterranean','Europe / Roman','Europe','Multiple cultures','Europe','Multiple cultures','Mesoamerica','Multiple continents','Original design','Original design'],
  5:['Australia','Egypt','Southwestern North America','Germany (proposed)','India — Tamil','Amazonia (unverified)','Antarctica (modern science)','Australia','Egypt','Poland','North America','Australia','Global educational'],
  6:['South America','Arctic North America','Africa (unverified)','Okinawa — Japan','Roman Mediterranean','Australia (unverified)','Antarctica (proposed analogy)','Patagonia','Patagonia','Multiple cultures','Original design','Original design','Global educational'],
  7:['North America','Europe (provisional)','Australia','Andes — South America','Siberia (unverified)','Southern Africa (unverified)','Antarctica (modern analogy)','Europe','Mesoamerica','Arctic North America','North America','Oceania','Global educational'],
  8:['Prehistoric global (concept)','Ancient Egypt','China','Roman Mediterranean','China','Andes — South America','Japan','Korea','Fuzhou — China','Europe / North America','France / Europe','Global modern','Global educational']
};
export const COLLECTIONS = Object.freeze(seed.map(s=>Object.freeze({
  id:s.id,code:'BX'+String(s.id).padStart(2,'0'),title:s.title,subtitle:s.subtitle,origin:s.origin,
  mechanic:s.mechanic,geometry:s.geometry,legacy13:s.legacy13||null,
  items:Object.freeze(s.names.split('|').map((name,i)=>Object.freeze({
    id:'BX'+String(s.id).padStart(2,'0')+'-'+String(i+1).padStart(2,'0'),
    set:s.id,number:i+1,name,region:(regions[s.id]||[])[i]||s.origin,
    shape:s.shapes.split('|')[i],status:s.status.split(' ')[i],
    objectVerified:false, accession:null,
    authorialCatalogLabel:true,
    correction:s.id===3&&i===12?'Correction: The bat-wing No. 13 named Royal Pingha is an AI-created illustration, NOT a documented Zande or Central African blade. Do not use it as an authentic museum replica. Cleveland Museum of Art 2015.156 is a different, asymmetric historical pingha.':s.id===3&&i===7?'The No. 08 Njiga-Spider label and radial symbol silhouette are not verified as a specific museum-documented weapon; do not describe it as a historical radiation-symbol-shaped knife.':null,
    role:i===12?'thirteenth centerpiece':'collection unit',
    previousCenterpiece:i===12?s.legacy13||null:null
  })))
})));
export const ARTIFACTS = Object.freeze(COLLECTIONS.flatMap(c=>c.items));
/* Museum-confirmed reference is deliberately separate from the owner's 104 concept slots.
   A real pingha cannot authenticate an invented "Royal Pingha" silhouette. */
export const MUSEUM_REFERENCES = Object.freeze([Object.freeze({
 id:'CMA-2015.156',name:'Throwing Knife / Prestige Scepter (pingha)',
 maker:'Zande-style maker',region:'Central or Eastern Africa',
 date:'1800–mid-1900s',material:'Iron alloy and plant fiber',
 overallCm:45.5,shape:'Asymmetrical projecting blades from an elongated shaft',
 museum:'Cleveland Museum of Art',
 url:'https://www.clevelandart.org/art/2015.156',
 itemInCollectorCase:false
})]);
export const STATUS_KEY = Object.keys(STATUS);
export function searchArtifacts(query='',collection=0,status='') {
  const q=String(query).normalize('NFKD').toLocaleLowerCase().trim();
  return ARTIFACTS.filter(a=>(!collection||a.set===Number(collection))&&(!status||a.status===status)&&(!q||[a.id,a.name,a.region,a.shape,COLLECTIONS[a.set-1].title,STATUS[a.status]].join(' ').normalize('NFKD').toLocaleLowerCase().includes(q)));
}
export const ORIGINAL_NOTE = 'HISTORICAL CORRECTION: These 104 positions are authorial catalog concepts, NOT 104 museum-verified weapons. No individual collector slot has an authenticated accession record. No. 13 Royal Pingha is a fabricated bat-winged illustration, not a documented African weapon. Original labels are retained as proposals, not as historical facts.';
export const GAME_MODES = Object.freeze(['Geometry families','Geography clues','Evidence or concept']);
