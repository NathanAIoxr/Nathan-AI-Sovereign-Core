// 101 original gameplay interpretations organized by LCC main class.
export const LCC_SOURCE = 'https://www.loc.gov/aba/cataloging/classification/lcco/';
export const CLASSES = Object.freeze({
 "A": "General works",
 "B": "Philosophy, psychology & religion",
 "C": "Historical research methods",
 "D": "World history",
 "E": "History of the Americas",
 "F": "History of the Americas",
 "G": "Geography, anthropology & recreation",
 "H": "Social sciences",
 "J": "Political science",
 "K": "Law",
 "L": "Education",
 "M": "Music",
 "N": "Fine arts",
 "P": "Language & literature",
 "Q": "Science",
 "R": "Medicine",
 "S": "Agriculture",
 "T": "Technology",
 "U": "Military science",
 "V": "Naval science",
 "Z": "Bibliography, libraries & information"
});
export const TYPES = Object.freeze({character:'Characters',role:'Human roles',animal:'Animals',artifact:'Objects',place:'Places',concept:'Concepts',system:'Systems',data:'Data and records',archive:'Archives',reference:'Reference works',media:'Media'});
export const MECHANICS = Object.freeze({
 arc:'Trajectory, drift and target placement', spin:'Rotation and landing alignment',
 rope:'Oscillation and timed release', rhythm:'Cadence and input timing',
 craft:'Ordered tracing and checkpoint accuracy',
});
const rows = [
 ["A","reference","craft","Encyclopedia cross-reference","Linked headings","Order-dependent","Follow numbered references to assemble the topic trail","Reference trail"],
 ["A","archive","rhythm","Annual almanac","Calendar and events","Cyclical","Strike on the cue to synchronize the calendar dial","Calendar dial"],
 ["A","role","craft","Museum collections curator","Inventory tags and accession steps","Systematic","Trace intake from item tag to shelf","Accession track"],
 ["A","artifact","spin","Revolving globe stand","Tilted axis and rotating shell","Orientation-sensitive","Align the rotating globe marker with the reference pad","Meridian pad"],
 ["A","media","arc","Newspaper delivery route","Bundles and spaced doorsteps","Distributed","Guide a parcel arc onto the selected doorstep","Delivery drop"],
 ["B","character","rhythm","Socrates in the dialogues","Questions and alternating turns","Inquisitive","Answer on the marked dialogue beat","Dialogue cue"],
 ["B","concept","craft","Ethical decision tree","Choices and branching outcomes","Dependent on prior choices","Trace the numbered decision steps","Decision path"],
 ["B","role","rhythm","Community bell keeper","Bell, interval and signal","Cadenced","Sound the bell when the marker passes the cue","Bell strike"],
 ["B","artifact","spin","Optical illusion disc","Contrast bands on a spinning surface","Angle-sensitive","Align the contrast marker on its pad","Illusion disc pad"],
 ["B","artifact","rope","Temple offering basket","Suspended basket and fixed hook","Pendular","Time the basket swing to the hook","Basket hook"],
 ["C","role","craft","Genealogist","Generations and documentary links","Evidence-oriented","Trace the numbered family connections","Family-tree path"],
 ["C","artifact","spin","Wax seal impression","Raised face and registration mark","Alignment-sensitive","Align the seal face before contacting the pad","Seal registration"],
 ["C","archive","craft","Archival finding aid","Containers and folder hierarchy","Hierarchical","Follow collection, series, and folder checkpoints","Finding-aid trail"],
 ["C","artifact","arc","Excavation grid token","Survey grid and movable tag","Position-sensitive","Send the token to the chosen survey square","Survey square"],
 ["C","artifact","rhythm","Mechanical chronology clock","Periodic ticks and date markers","Sequential","Advance the date cue on the clock’s beat","Chronology dial"],
 ["D","role","rope","Historical dock porter","Sling, cargo and hook","Balance-sensitive","Match the cargo swing to its landing hook","Cargo hook"],
 ["D","artifact","spin","Trade amphora","Rounded body, handles and base","Tippy","Set the jar down when its orientation marker aligns","Amphora stand"],
 ["D","place","craft","Historic city gate","Entries and connected streets","Route-dependent","Trace the route through the gate district","Gate route"],
 ["D","artifact","rhythm","Mechanical station clock","Dial and evenly spaced marks","Periodic","Match the clock’s highlighted signal","Station signal"],
 ["D","system","arc","Canal parcel transfer","Two banks and a receiving area","Gap-spanning","Lob a model parcel onto the far landing","Canal landing"],
 ["E","character","rope","Paul Bunyan","Legendary strength and a logging-camp setting","Larger than life","Time a cartoon timber sling into its cradle","Timber cradle"],
 ["E","role","arc","Frontier mail carrier","Saddlebag and spaced collection points","Mobile","Arc the mailbag to the collection platform","Mail platform"],
 ["E","place","craft","Historic town main street","Landmarks on connected blocks","Walkable","Trace landmarks in their numbered order","Main Street route"],
 ["E","artifact","spin","Printing press type block","Mirrored glyph and printing face","Alignment-sensitive","Rotate the printing face toward the pad","Type bed"],
 ["E","media","rhythm","Oral history recording","Pauses and spoken phrases","Cadenced","Mark the starts of timed segments","Recording cue"],
 ["F","role","rope","Great Lakes dockhand","Dock line and moving vessel","Responsive to drift","Catch the mooring post at the end of the swing","Dock post"],
 ["F","place","craft","Appalachian switchback trail","Marked route and tight turns","Terrain-constrained","Trace the numbered bends in the trail","Switchback path"],
 ["F","artifact","arc","Regional fair beanbag","Soft parcel and raised board","Trajectory-sensitive","Land the bag in the scored zone","Fairground board"],
 ["F","artifact","spin","River ferry turntable","Deck, pivot, and docking alignment","Rotational","Align the rotating deck marker with its berth","Ferry berth"],
 ["F","role","rhythm","Festival parade marshal","Timed crossings and moving groups","Coordinated","Release each parade group on the green cue","Parade cue"],
 ["G","role","craft","Cartographer","Map symbols and ordered waypoints","Scale-aware","Trace the route through the annotated landmarks","Map route"],
 ["G","animal","rope","River otter","Waterborne movement and current drift","Agile","Guide the game float into the river marker","River float marker"],
 ["G","concept","arc","Contour-map distance","Elevation bands and separate points","Spatial","Land the survey token on the requested contour","Contour marker"],
 ["G","artifact","spin","Orienteering compass","Needle, dial and reference bearing","Orientation-sensitive","Match the rotating compass marker with its bearing","Bearing pad"],
 ["G","system","rhythm","Recreation relay","Successive handoffs","Coordinated","Tap on the exchange cue","Relay exchange"],
 ["H","role","arc","Market stall vendor","Produce and separate bins","Sort-oriented","Toss a produce token into the highlighted bin","Market bin"],
 ["H","concept","craft","Supply-chain handoff","Linked suppliers and stages","Sequence-dependent","Connect the ordered handoff points","Supplier checkpoints"],
 ["H","system","rhythm","Cooperative assembly line","Stations and synchronized cycles","Paced","Transfer the workpiece on the shared cadence","Work-cycle cue"],
 ["H","artifact","spin","Mechanical tally counter","Number wheels and indexed positions","Incremental","Align the digit wheel to its registration pad","Counter wheel pad"],
 ["H","data","craft","Survey response matrix","Rows, columns and keyed responses","Structured","Trace the selected response cells in order","Response cells"],
 ["J","role","rhythm","Meeting chair","Speaking queue and timed turns","Procedural","Pass the floor on the cue","Speaking turn"],
 ["J","artifact","arc","Municipal ballot token","Marked token and receiving box","Destination-sensitive","Place the game token in the indicated box","Ballot box"],
 ["J","system","craft","Public comment workflow","Intake, review and response","Sequential","Trace the numbered comment stages","Comment trail"],
 ["J","artifact","spin","Council nameplate stand","Face and rotating base","Presentation-sensitive","Set the nameplate facing the selected pad","Nameplate slot"],
 ["J","data","craft","Public budget ledger","Categories and linked allocations","Reconciled by sequence","Follow the numbered ledger review route","Budget cells"],
 ["K","role","craft","Court clerk","Filing steps and docket keys","Procedural","Trace the ordered intake steps for a mock case","Mock docket"],
 ["K","character","rhythm","Portia in The Merchant of Venice","Courtroom dialogue and alternating speech","Deliberate","Tap the cue for a reply in the scene","Portia’s reply"],
 ["K","artifact","spin","Mock courtroom evidence seal","Seal orientation and tamper mark","Registration-sensitive","Align the seal with the mock evidence sleeve","Evidence seal pad"],
 ["K","concept","craft","Chain of custody","Transfers, receipts and timestamps","Traceable","Trace the numbered transfer checkpoints","Custody trail"],
 ["K","artifact","arc","Filed-document tray","Separate slots and folder weight","Placement-sensitive","Land the mock folder in its designated tray","Document tray"],
 ["L","role","rhythm","Language teacher","Call-and-response prompts","Cadenced","Echo the prompt on the marked beat","Response cue"],
 ["L","artifact","craft","Tracing slate","Marked strokes and writing surface","Stroke-order-sensitive","Trace the numbered slate marks","Slate strokes"],
 ["L","system","arc","Classroom sorting station","Bins and movable practice tokens","Destination-sensitive","Guide the token into the class bin","Sorting bin"],
 ["L","artifact","spin","Rotating flashcard wheel","Face-up cards and a pivot","Orientation-sensitive","Align the card face to the reading position","Flashcard reader"],
 ["L","concept","craft","Spaced study plan","Ordered review intervals","Revisitable","Trace the scheduled review checkpoints","Study plan"],
 ["M","role","rhythm","Orchestra conductor","Beat cues and ensemble entrances","Coordinating","Cue the entrance on the highlighted beat","Ensemble beat"],
 ["M","artifact","spin","Tuning peg","Rotational adjustment and index mark","Fine-adjusted","Rotate the peg marker into alignment","Pitch index"],
 ["M","artifact","rope","Metronome pendulum","Weighted arm and pivot","Periodic","Release at the beat mark in the swing","Pendulum beat"],
 ["M","media","craft","Musical score","Measures, notes and reading order","Ordered","Trace the numbered note positions","Score checkpoints"],
 ["M","artifact","arc","Percussion mallet game prop","Swing and target plate","Impact-sensitive","Arc the virtual mallet head to the target plate","Percussion plate"],
 ["N","role","craft","Mosaic artisan","Tesserae and ordered placement","Pattern-driven","Trace the outline and tile path","Mosaic board"],
 ["N","artifact","spin","Potter’s wheel","Rotating platform and registration line","Continuously rotating","Align the rotating piece with the registration mark","Pottery index"],
 ["N","place","rope","Sculpture installation bay","Hoist cable and mounting point","Balance-sensitive","Match the suspended model to its mounting ring","Sculpture anchor"],
 ["N","media","arc","Exhibition projection frame","Directional source and bounded screen","Framed","Aim the light token at the projection marker","Projection frame"],
 ["N","concept","craft","Architectural floor plan","Rooms, doors and circulation","Spatially ordered","Trace the marked circulation route","Floor-plan route"],
 ["P","character","craft","Alice in Wonderland","Doors and turns in unfamiliar spaces","Curious","Trace the numbered route through the doors","Wonderland doors"],
 ["P","character","rope","Pinocchio","Jointed puppet and suspension strings","Articulated","Time the puppet-ring swing to the stage anchor","Puppet anchor"],
 ["P","character","spin","Don Quixote","Windmill scene and rotary motion","Imaginative","Align the windmill’s marker with its scoring pad","Windmill pad"],
 ["P","character","rhythm","Sherlock Holmes","Clues and timed deductions","Observant","Tap when the marker crosses the evidence cue","Evidence cue"],
 ["P","character","arc","Dorothy in The Wonderful Wizard of Oz","Journey and destination markers","Determined","Send the path token to the next waypoint","Yellow-road waypoint"],
 ["Q","artifact","rope","Laboratory pendulum","Tether and suspended mass","Oscillatory","Catch the timing window as the model swings through","Pendulum gate"],
 ["Q","concept","arc","Orbital arrival window","Relative positions and drift","Time-dependent","Aim the virtual probe at the arrival marker","Arrival marker"],
 ["Q","system","spin","Molecular orientation model","Rotation and marked alignment","Orientation-dependent","Set the model marker into the matching pad","Model alignment"],
 ["Q","data","craft","Seismograph trace","Time series with marked peaks","Ordered in time","Trace the marked peaks in sequence","Seismic trace"],
 ["Q","animal","rhythm","Firefly signal display","Intermittent flashes and pauses","Rhythmic","Tap on the highlighted flash cue","Flash cue"],
 ["R","role","craft","Medical simulator technician","Training stations and ordered checks","Procedure-oriented","Trace the fictional simulator checkout route","Simulator path"],
 ["R","artifact","spin","Anatomy model joint","Pivot, range and alignment","Articulated","Align the rotating teaching model with its dock","Model dock"],
 ["R","media","rhythm","Training pulse display","Synthetic waveform and beat marks","Cyclical","Match the artificial marker in the rhythm exercise","Training beat"],
 ["R","artifact","arc","Clinic logistics dummy parcel","Box and labeled supply shelf","Destination-sensitive","Place a virtual supply token onto the mock shelf","Mock supply shelf"],
 ["R","data","craft","Health-history training chart","Fictional time points and annotations","Chronological","Follow the numbered mock chart entries","Mock chart"],
 ["S","role","arc","Orchard sorter","Produce and receiving baskets","Sort-oriented","Guide the fruit token into the target basket","Fruit basket"],
 ["S","artifact","rope","Barn hay sling","Rope, bale and loading hook","Load-sensitive","Time the cartoon bale swing to its hook","Hay hook"],
 ["S","concept","craft","Irrigation layout","Branches and numbered gates","Networked","Trace the planned route through the model field","Irrigation gates"],
 ["S","animal","rhythm","Bee on a blossom route","Stops and repeated flower visits","Repetitive","Tap at each blossom marker on the cue","Blossom cue"],
 ["S","artifact","spin","Seed sorting drum","Rotating slots and indexed opening","Periodic","Bring the drum slot over the collection pad","Seed tray index"],
 ["T","artifact","spin","Tabor Tracker Ball 🖲️","Rotational input and moving cursor","Direction-sensitive","Match the onscreen rotational marker with the landing pad","Trackball index"],
 ["T","artifact","rope","Workshop gantry crane","Suspended load and overhead track","Inertia-sensitive","Time the model hook to catch the cargo ring","Crane ring"],
 ["T","system","arc","Parcel transfer robot","Pickup points and drop zones","Trajectory-constrained","Guide the virtual parcel into its drop zone","Robot drop zone"],
 ["T","data","craft","Database record graph","Entities and keyed relationships","Linked","Trace the numbered links in the database diagram","Database relations"],
 ["U","role","rhythm","Ceremonial drill drummer","Repeating beats and coordinated steps","Cadenced","Tap the drum cue for the ceremonial display","Ceremonial beat"],
 ["U","artifact","spin","Museum uniform display turntable","Rotating plinth and front marker","Orientation-sensitive","Align the display’s front marker with the viewing pad","Display plinth"],
 ["U","archive","craft","Veterans’ oral history index","Interviews, timestamps and tags","Cross-referenced","Trace the interview index in order","Interview trail"],
 ["U","artifact","arc","Training-field marker token","Colored marker and practice circle","Placement-sensitive","Place the virtual marker inside the circle","Practice circle"],
 ["V","artifact","rope","Harbor mooring buoy","Floating body and attached line","Buoyant","Time the swing to catch the mooring eye","Mooring eye"],
 ["V","role","rhythm","Harbor signal operator","Light flashes and intervals","Synchronized","Tap the highlighted harbor signal","Harbor light cue"],
 ["V","place","arc","Rescue-sled practice deck","Receiving area separated by a gap","Gap-spanning","Send the virtual rescue token to the deck","Practice deck"],
 ["V","data","craft","Ship log timeline","Timestamps and ordered entries","Chronological","Trace the displayed voyage checkpoints","Voyage log path"],
 ["Z","role","craft","Cataloger","Description fields and shelf identifiers","Schema-driven","Trace from title field to shelf marker","Catalog record path"],
 ["Z","data","craft","Library authority record","Preferred name and variant forms","Cross-referenced","Follow the numbered variant-name links","Authority record links"],
 ["Z","artifact","spin","Microfilm reel","Spool direction and alignment marks","Rotational","Align the reel leader mark with the reader pad","Microfilm pad"],
 ["Z","system","arc","Library book return sorter","Moving item and destination bin","Routing-sensitive","Send the book token to its indicated bin","Return bin"]
];
export const ATLAS = Object.freeze(rows.map(([lcc,kind,chassis,title,attributes,traits,application,target],index)=>{
 const number=index+1, id=String(number).padStart(3,'0');
 const tier=Object.keys(CLASSES).indexOf(lcc)%7;
 const pace=[.78,.96,1.14,1.32][index%4];
 const drift=(index%2===0?1:-1)*(.018+(index%5)*.009);
 const window=.118-(index%6)*.007;
 return Object.freeze({id,number,lcc,kind,chassis,title,attributes,traits,application,target,tier,pace,drift,window,seed:29+number*3});
}));
const indexed = new Map(ATLAS.map(entry=>[entry.id,entry]));
export function atlasEntry(id){return indexed.get(id);}
export function atlasSearch({query='',lcc='',kind='',chassis=''}={}){
 const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
 return ATLAS.filter(entry=>{
  if(lcc&&lcc!==entry.lcc||kind&&kind!==entry.kind||chassis&&chassis!==entry.chassis)return false;
  const haystack=[entry.id,entry.title,CLASSES[entry.lcc],TYPES[entry.kind],entry.attributes,
    entry.traits,entry.application,entry.target,MECHANICS[entry.chassis]].join(' ').toLowerCase();
  return terms.every(term=>haystack.includes(term));
 });
}
export function atlasMedals(value){
 return Object.fromEntries(ATLAS.flatMap(({id})=>{
  const score=value?.[id];
  return Number.isSafeInteger(score)&&score>=150&&score<=300?[[id,score]]:[];
 }));
}
