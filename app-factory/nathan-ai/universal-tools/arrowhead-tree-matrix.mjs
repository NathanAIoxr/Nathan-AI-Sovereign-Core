/* Source-first creative pairings, submitted by the author on 2026-11-02.
 * Point types and tree taxa must not be confused with proof of historical design influence. */
export const PAIR_SCHEMA='nathan-ai-arrowhead-tree-pairs.v1';
export const MATRIX_TITLE='The 13-Point Arrowhead & Christmas Tree Matrix';
export const MATRIX_NOTE='All 13 shape pairings are original creative analogies. Archaeological object types and living tree species have separate independent histories. Type verification is not proof of an ancient link.';
const pairs=[
 [1,'Clovis Fluted','Paleo-Indian','Tamarack Larch','Larix laricina','Larix laricina','Sleek, lance-like column: The long central flake channel (flute) mirrors a perfectly straight, tall trunk topped with slender, ancient ice-age growth lines.','lanceolate','documented','Clovis is a documented fluted projectile-point type. Tree silhouette is variable.'],
 [2,'Folsom Fluted','Paleo-Indian','Balsam Fir','Abies balsamea','Abies balsamea','Elegant, thin symmetry: The signature wide, thin profile matches the classic, gently tapering, lightweight canopy of northern boreal forests.','fluted lanceolate','documented','Folsom is documented. Folsom flutes commonly extend much farther along the point than Clovis flutes.'],
 [3,'Dalton Point','Archaic Period','Shortleaf Pine','Pinus echinata','Pinus echinata','Rectangular base, tapering top: The straight, blocky base translates directly into a sturdy, heavy tree trunk holding up a strictly uniform triangular crown.','lanceolate / concave base','documented','Dalton has late Paleoindian / early Archaic associations; the original period label alone is oversimplified.'],
 [4,'Kirk Stemmed','Southeast','Longleaf Pine','Pinus palustris','Pinus palustris','Exposed stem, jagged edges: The prolonged square base acts as a long bare trunk, while the saw-tooth serrations match heavy, tufted clusters of long needles.','stemmed','documented','Kirk Stemmed is an Early Archaic point type. Serrated edges are not mandatory for every specimen.'],
 [5,'Archaic Triangular','Plains','Black Hills Spruce','Picea glauca','Picea glauca var. densata','Flawless geometric triangle: A broad, straight-bottomed wedge shape that perfectly mimics a densely packed, shear-trimmed, formal Christmas spruce.','triangular','generic','Archaic Triangular is a broad description, not a uniquely identified universal diagnostic type. Black Hills spruce is Picea glauca var. densata.'],
 [6,'Avalón / Adena','Woodland','Eastern White Pine','Pinus strobus','Pinus strobus','Soft, sweeping shoulders: The broad, curved, non-pointed edges copy the soft, cloud-like horizontal branches that bow downward under heavy snow.','broad stemmed','mixed','Adena is documented as a point classification; Avalón/Avalon was not authenticated as the same formal type in reviewed guides.'],
 [7,'Hopewell Serrated','Hopewell','Fraser Fir','Abies fraseri','Abies fraseri','Aggressive jagged tiers: The dramatic, multi-stepped serrations provide the exact silhouette of a hyper-symmetrical, deeply layered farm fir tree.','serrated / stepped','unverified','Hopewell names a broad archaeological tradition. Hopewell Serrated was not confirmed as a single canonical projectile-point type.'],
 [8,'Cahokia Side-Notched','Mississippian','Eastern Redcedar','Juniperus virginiana','Juniperus virginiana','Right-angled base notches: A sharp triangle with square cutouts at the base, mimicking a wild cedar whose bottom limbs are cleared straight out at the floor.','side-notched triangle','documented','Cahokia/Grant Side-Notched is a documented archaeological category.'],
 [9,'Fresno Notched','Southwest','Arizona Cypress','Cupressus arizonica','Hesperocyparis arizonica','Architectural column: Lean, narrow, and geometrically precise, mirroring a tightly coiled, manicured desert spire that flares only slightly at the base.','unnotched triangular','misnamed','Fresno projectile points are unnotched small triangles. The word Notched in this author\'s label is incorrect. Hesperocyparis arizonica is an accepted scientific name for Arizona cypress.'],
 [10,'Perdiz Point','Southwest / Plains','Pinyon Pine','Pinus edulis','Pinus edulis','Needle trunk, compact crown: Features an incredibly long, narrow stem holding a short, wide triangular top—exactly like a high-desert scrub pine.','stemmed and barbed','documented','Perdiz is a documented form; exact point proportions vary.'],
 [11,'Scallorn Point','Plains','Colorado Blue Spruce','Picea pungens','Picea pungens','Sharp, wide flare: The heavily expanding, out-turned corner barbs match the wide, rigid, sharply upward-sweeping tiers of a premium blue spruce.','corner-notched / barbed','documented','Scallorn is a documented archaeological point type.'],
 [12,'Bird Point','Great Basin','Subalpine Fir','Abies lasiocarpa','Abies lasiocarpa','Miniature high-altitude spire: Tiny, slender, and razor-sharp, mimicking the ultra-skinny, pencil-thin crowns of firs growing on cold, windy mountain ridges.','small triangular','colloquial','Bird point is a collector nickname for multiple small point types, not one diagnostic Great Basin culture or type.'],
 [13,'Washita Barbed','Plains','Douglas Fir','Pseudotsuga menziesii','Pseudotsuga menziesii','Deeply notched layered branches: The deep side-gashes carve the arrowhead into heavily defined branch layers, mimicking the classic thick, full holiday tree.','side-notched','mixed','Washita points are documented, often as side-notched triangular points; Barbed is not established as one canonical subtype in the consulted sources.']
];
export const PAIRS=Object.freeze(pairs.map(([number,pointName,region,treeName,originalLatin,acceptedLatin,originalConnection,shape,typeEvidence,accuracyNote])=>Object.freeze({
 id:'AT'+String(number).padStart(2,'0'),number,pointName,region,treeName,
 originalLatin,acceptedLatin,originalConnection,shape,typeEvidence,accuracyNote,
 linkStatus:'creative-shape-analogy',individualArtifactVerified:false,individualTreeSpecimenVerified:false
})));
export const SOURCE_REFERENCES=Object.freeze([
 {label:'Jefferson Patterson Park & Museum — Maryland diagnostic projectile points',url:'https://apps.jefpat.maryland.gov/diagnostic/ProjectilePoints/ProjectilePoints.aspx'},
 {label:'University of Iowa Press — A Projectile Point Guide for the Upper Mississippi River Valley',url:'https://uipress.uiowa.edu/books/projectile-point-guide-upper-mississippi-river-valley'},
 {label:'University of Missouri Museum of Anthropology — Clovis/Folsom/Dalton',url:'https://anthromuseum.missouri.edu/e-exhibits/clovis-stone-tools'},
 {label:'Arkansas Archeological Survey — Fresno unnotched triangular points',url:'https://archeology.uark.edu/wp-content/uploads/2015/04/RS31_HUMANADAPTATIONS.pdf'},
 {label:'USDA NRCS — Black Hills spruce, Picea glauca var. densata',url:'https://www.nrcs.usda.gov/sites/default/files/2023-09/tree_booklet_2023_low_Res.pdf'},
 {label:'USDA NRCS — Arizona Cypress / Hesperocyparis arizonica',url:'https://plants.usda.gov/DocumentLibrary/plantguide/pdf/pg_hear22.pdf'},
 {label:'University of Wisconsin–La Crosse — Point Guide / Bird Point terminology',url:'https://www.uwlax.edu/mvac/past-cultures/point-guide/'}
]);
export function findPairs(query='',direction='point'){
 const q=String(query).toLocaleLowerCase().trim();
 const arr=PAIRS.filter(p=>!q||[p.pointName,p.treeName,p.originalLatin,p.acceptedLatin,p.region,p.shape,p.accuracyNote].join(' ').toLocaleLowerCase().includes(q));
 return direction==='tree'?[...arr].sort((a,b)=>a.treeName.localeCompare(b.treeName)):arr;
}
export function matchAnswer(number,direction='point'){const p=PAIRS.find(p=>p.number===Number(number));return p?(direction==='tree'?p.pointName:p.treeName):null;}
