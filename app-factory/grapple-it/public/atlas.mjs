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
 ["A","reference","craft","Encyclopedia cross-reference","Linked headings","Each reference redirects the reader to a related entry.","Order-dependent","Follow numbered references to assemble the topic trail","Reference trail"],
 ["A","archive","rhythm","Annual almanac","Calendar and events","Entries cluster by month and recur on an annual cycle.","Cyclical","Strike on the cue to synchronize the calendar dial","Calendar dial"],
 ["A","role","craft","Museum collections curator","Inventory tags and accession steps","Works between acquisition, cataloging, and public display.","Systematic","Trace intake from item tag to shelf","Accession track"],
 ["A","artifact","spin","Revolving globe stand","Tilted axis and rotating shell","Spins on a fixed axis beneath a stationary index.","Orientation-sensitive","Align the rotating globe marker with the reference pad","Meridian pad"],
 ["A","media","arc","Newspaper delivery route","Bundles and spaced doorsteps","Connects stops in a repeatable delivery order.","Distributed","Guide a parcel arc onto the selected doorstep","Delivery drop"],
 ["B","character","rhythm","Socrates in the dialogues","Questions and alternating turns","Tests assumptions by following an answer with another question.","Inquisitive","Answer on the marked dialogue beat","Dialogue cue"],
 ["B","concept","craft","Ethical decision tree","Choices and branching outcomes","Each answer changes which branch becomes available next.","Dependent on prior choices","Trace the numbered decision steps","Decision path"],
 ["B","role","rhythm","Community bell keeper","Bell, interval and signal","Marks a scheduled event with a recognizable signal.","Cadenced","Sound the bell when the marker passes the cue","Bell strike"],
 ["B","artifact","spin","Optical illusion disc","Contrast bands on a spinning surface","Repeating graphics appear to move as the disc turns.","Angle-sensitive","Align the contrast marker on its pad","Illusion disc pad"],
 ["B","artifact","rope","Temple offering basket","Suspended basket and fixed hook","The open top defines a receiving area for loose objects.","Pendular","Time the basket swing to the hook","Basket hook"],
 ["C","role","craft","Genealogist","Generations and documentary links","Reconciles names, dates, and relationships across generations.","Evidence-oriented","Trace the numbered family connections","Family-tree path"],
 ["C","artifact","spin","Wax seal impression","Raised face and registration mark","A raised design leaves a matching impression in soft wax.","Alignment-sensitive","Align the seal face before contacting the pad","Seal registration"],
 ["C","archive","craft","Archival finding aid","Containers and folder hierarchy","Describes a collection through nested series and folders.","Hierarchical","Follow collection, series, and folder checkpoints","Finding-aid trail"],
 ["C","artifact","arc","Excavation grid token","Survey grid and movable tag","Identifies a find by its position in a surveyed square.","Position-sensitive","Send the token to the chosen survey square","Survey square"],
 ["C","artifact","rhythm","Mechanical chronology clock","Periodic ticks and date markers","Uses advancing markers to place events in sequence.","Sequential","Advance the date cue on the clock’s beat","Chronology dial"],
 ["D","role","rope","Historical dock porter","Sling, cargo and hook","Moves incoming goods from dock edge to a receiving area.","Balance-sensitive","Match the cargo swing to its landing hook","Cargo hook"],
 ["D","artifact","spin","Trade amphora","Rounded body, handles and base","A narrow neck and paired handles distinguish the vessel.","Tippy","Set the jar down when its orientation marker aligns","Amphora stand"],
 ["D","place","craft","Historic city gate","Entries and connected streets","An opening in a wall concentrates movement at one point.","Route-dependent","Trace the route through the gate district","Gate route"],
 ["D","artifact","rhythm","Mechanical station clock","Dial and evenly spaced marks","The face divides time into recurring departure cues.","Periodic","Match the clock’s highlighted signal","Station signal"],
 ["D","system","arc","Canal parcel transfer","Two banks and a receiving area","A parcel changes hands across a gap between stations.","Gap-spanning","Lob a model parcel onto the far landing","Canal landing"],
 ["E","character","rope","Paul Bunyan","Legendary strength and a logging-camp setting","A larger-than-life figure in American logging folklore.","Larger than life","Time a cartoon timber sling into its cradle","Timber cradle"],
 ["E","role","arc","Frontier mail carrier","Saddlebag and spaced collection points","Uses a series of stops to carry messages across distance.","Mobile","Arc the mailbag to the collection platform","Mail platform"],
 ["E","place","craft","Historic town main street","Landmarks on connected blocks","Storefronts and crossroads organize the street into landmarks.","Walkable","Trace landmarks in their numbered order","Main Street route"],
 ["E","artifact","spin","Printing press type block","Mirrored glyph and printing face","The printing face must align with neighboring type.","Alignment-sensitive","Rotate the printing face toward the pad","Type bed"],
 ["E","media","rhythm","Oral history recording","Pauses and spoken phrases","A recorded voice carries pauses, emphasis, and observation.","Cadenced","Mark the starts of timed segments","Recording cue"],
 ["F","role","rope","Great Lakes dockhand","Dock line and moving vessel","Coordinates moving lines with the changing position of a vessel.","Responsive to drift","Catch the mooring post at the end of the swing","Dock post"],
 ["F","place","craft","Appalachian switchback trail","Marked route and tight turns","Turns back across the slope instead of climbing straight uphill.","Terrain-constrained","Trace the numbered bends in the trail","Switchback path"],
 ["F","artifact","arc","Regional fair beanbag","Soft parcel and raised board","The soft bag settles where its weight meets the board.","Trajectory-sensitive","Land the bag in the scored zone","Fairground board"],
 ["F","artifact","spin","River ferry turntable","Deck, pivot, and docking alignment","The rotating platform meets the dock at specific alignments.","Rotational","Align the rotating deck marker with its berth","Ferry berth"],
 ["F","role","rhythm","Festival parade marshal","Timed crossings and moving groups","Maintains spacing between groups moving along one route.","Coordinated","Release each parade group on the green cue","Parade cue"],
 ["G","role","craft","Cartographer","Map symbols and ordered waypoints","Turns surveyed landmarks into symbols at a chosen scale.","Scale-aware","Trace the route through the annotated landmarks","Map route"],
 ["G","animal","rope","River otter","Waterborne movement and current drift","Moves between water and banks with quick changes of direction.","Agile","Guide the game float into the river marker","River float marker"],
 ["G","concept","arc","Contour-map distance","Elevation bands and separate points","Coarse or tight contour spacing changes how terrain reads.","Spatial","Land the survey token on the requested contour","Contour marker"],
 ["G","artifact","spin","Orienteering compass","Needle, dial and reference bearing","A pivoting needle settles toward a reference bearing.","Orientation-sensitive","Match the rotating compass marker with its bearing","Bearing pad"],
 ["G","system","rhythm","Recreation relay","Successive handoffs","Each leg ends where the next participant starts.","Coordinated","Tap on the exchange cue","Relay exchange"],
 ["H","role","arc","Market stall vendor","Produce and separate bins","Brings items from a display area to a point of exchange.","Sort-oriented","Toss a produce token into the highlighted bin","Market bin"],
 ["H","concept","craft","Supply-chain handoff","Linked suppliers and stages","Responsibility changes at designated transfer points.","Sequence-dependent","Connect the ordered handoff points","Supplier checkpoints"],
 ["H","system","rhythm","Cooperative assembly line","Stations and synchronized cycles","Each station depends on the work of the preceding station.","Paced","Transfer the workpiece on the shared cadence","Work-cycle cue"],
 ["H","artifact","spin","Mechanical tally counter","Number wheels and indexed positions","A single actuation advances the displayed count.","Incremental","Align the digit wheel to its registration pad","Counter wheel pad"],
 ["H","data","craft","Survey response matrix","Rows, columns and keyed responses","Rows and columns make answers comparable across respondents.","Structured","Trace the selected response cells in order","Response cells"],
 ["J","role","rhythm","Meeting chair","Speaking queue and timed turns","Gives speakers turns and moves the group through an agenda.","Procedural","Pass the floor on the cue","Speaking turn"],
 ["J","artifact","arc","Municipal ballot token","Marked token and receiving box","The receiving slot defines where a token enters the count.","Destination-sensitive","Place the game token in the indicated box","Ballot box"],
 ["J","system","craft","Public comment workflow","Intake, review and response","Comments progress from submission to a recorded disposition.","Sequential","Trace the numbered comment stages","Comment trail"],
 ["J","artifact","spin","Council nameplate stand","Face and rotating base","The holder rotates so its text faces a designated audience.","Presentation-sensitive","Set the nameplate facing the selected pad","Nameplate slot"],
 ["J","data","craft","Public budget ledger","Categories and linked allocations","Line items connect amounts to categories and decisions.","Reconciled by sequence","Follow the numbered ledger review route","Budget cells"],
 ["K","role","craft","Court clerk","Filing steps and docket keys","Maintains filing order, docket entries, and deadlines.","Procedural","Trace the ordered intake steps for a mock case","Mock docket"],
 ["K","character","rhythm","Portia in The Merchant of Venice","Courtroom dialogue and alternating speech","Her interpretation of the bond turns the courtroom scene.","Deliberate","Tap the cue for a reply in the scene","Portia’s reply"],
 ["K","artifact","spin","Mock courtroom evidence seal","Seal orientation and tamper mark","An intact closure shows the mock exhibit has stayed sealed.","Registration-sensitive","Align the seal with the mock evidence sleeve","Evidence seal pad"],
 ["K","concept","craft","Chain of custody","Transfers, receipts and timestamps","Each transfer records who held an item and when.","Traceable","Trace the numbered transfer checkpoints","Custody trail"],
 ["K","artifact","arc","Filed-document tray","Separate slots and folder weight","A labeled tray gathers items awaiting the same next step.","Placement-sensitive","Land the mock folder in its designated tray","Document tray"],
 ["L","role","rhythm","Language teacher","Call-and-response prompts","Links a cue with a sound, word, or spoken response.","Cadenced","Echo the prompt on the marked beat","Response cue"],
 ["L","artifact","craft","Tracing slate","Marked strokes and writing surface","A reusable surface shows the path of a stroke.","Stroke-order-sensitive","Trace the numbered slate marks","Slate strokes"],
 ["L","system","arc","Classroom sorting station","Bins and movable practice tokens","Visible category labels determine where an item belongs.","Destination-sensitive","Guide the token into the class bin","Sorting bin"],
 ["L","artifact","spin","Rotating flashcard wheel","Face-up cards and a pivot","Rotation brings one prompt at a time to the viewing position.","Orientation-sensitive","Align the card face to the reading position","Flashcard reader"],
 ["L","concept","craft","Spaced study plan","Ordered review intervals","Material returns for review at spaced intervals.","Revisitable","Trace the scheduled review checkpoints","Study plan"],
 ["M","role","rhythm","Orchestra conductor","Beat cues and ensemble entrances","Uses visible cues to coordinate entries and tempo.","Coordinating","Cue the entrance on the highlighted beat","Ensemble beat"],
 ["M","artifact","spin","Tuning peg","Rotational adjustment and index mark","Rotation changes the tension carried by the string.","Fine-adjusted","Rotate the peg marker into alignment","Pitch index"],
 ["M","artifact","rope","Metronome pendulum","Weighted arm and pivot","The swing alternates across a center at a repeatable tempo.","Periodic","Release at the beat mark in the swing","Pendulum beat"],
 ["M","media","craft","Musical score","Measures, notes and reading order","Marks time and part entries on a shared written surface.","Ordered","Trace the numbered note positions","Score checkpoints"],
 ["M","artifact","arc","Percussion mallet game prop","Swing and target plate","Its head makes one clear contact with a marked target.","Impact-sensitive","Arc the virtual mallet head to the target plate","Percussion plate"],
 ["N","role","craft","Mosaic artisan","Tesserae and ordered placement","Places small pieces to build a larger pattern.","Pattern-driven","Trace the outline and tile path","Mosaic board"],
 ["N","artifact","spin","Potter’s wheel","Rotating platform and registration line","The clay holds its shape around the wheel’s center as it turns.","Continuously rotating","Align the rotating piece with the registration mark","Pottery index"],
 ["N","place","rope","Sculpture installation bay","Hoist cable and mounting point","A marked footprint fixes the piece’s place in the exhibition.","Balance-sensitive","Match the suspended model to its mounting ring","Sculpture anchor"],
 ["N","media","arc","Exhibition projection frame","Directional source and bounded screen","The visible frame shows where light starts and ends.","Framed","Aim the light token at the projection marker","Projection frame"],
 ["N","concept","craft","Architectural floor plan","Rooms, doors and circulation","Openings connect rooms into routes through a building.","Spatially ordered","Trace the marked circulation route","Floor-plan route"],
 ["P","character","craft","Alice in Wonderland","Doors and turns in unfamiliar spaces","Follows a rabbit into a world of changing rules and scale.","Curious","Trace the numbered route through the doors","Wonderland doors"],
 ["P","character","rope","Pinocchio","Jointed puppet and suspension strings","A wooden puppet whose story follows choices and consequences.","Articulated","Time the puppet-ring swing to the stage anchor","Puppet anchor"],
 ["P","character","spin","Don Quixote","Windmill scene and rotary motion","Reads ordinary windmills through the world of chivalric tales.","Imaginative","Align the windmill’s marker with its scoring pad","Windmill pad"],
 ["P","character","rhythm","Sherlock Holmes","Clues and timed deductions","Connects small observations to explanations in a case.","Observant","Tap when the marker crosses the evidence cue","Evidence cue"],
 ["P","character","arc","Dorothy in The Wonderful Wizard of Oz","Journey and destination markers","The yellow brick road links encounters to the Emerald City.","Determined","Send the path token to the next waypoint","Yellow-road waypoint"],
 ["Q","artifact","rope","Laboratory pendulum","Tether and suspended mass","A bob repeatedly passes the same reference locations.","Oscillatory","Catch the timing window as the model swings through","Pendulum gate"],
 ["Q","concept","arc","Orbital arrival window","Relative positions and drift","The target changes position while the model probe moves.","Time-dependent","Aim the virtual probe at the arrival marker","Arrival marker"],
 ["Q","system","spin","Molecular orientation model","Rotation and marked alignment","Alignment marks reveal a change in orientation.","Orientation-dependent","Set the model marker into the matching pad","Model alignment"],
 ["Q","data","craft","Seismograph trace","Time series with marked peaks","Peaks record movement at particular points along a timeline.","Ordered in time","Trace the marked peaks in sequence","Seismic trace"],
 ["Q","animal","rhythm","Firefly signal display","Intermittent flashes and pauses","A repeatable flash pattern provides a visible marker.","Rhythmic","Tap on the highlighted flash cue","Flash cue"],
 ["R","role","craft","Medical simulator technician","Training stations and ordered checks","Checks pretend equipment in the order shown by the training station.","Procedure-oriented","Trace the fictional simulator checkout route","Simulator path"],
 ["R","artifact","spin","Anatomy model joint","Pivot, range and alignment","The model pivots at the point that joins its two segments.","Articulated","Align the rotating teaching model with its dock","Model dock"],
 ["R","media","rhythm","Training pulse display","Synthetic waveform and beat marks","Each synthetic pulse repeats along a visible time axis.","Cyclical","Match the artificial marker in the rhythm exercise","Training beat"],
 ["R","artifact","arc","Clinic logistics dummy parcel","Box and labeled supply shelf","A visible label determines where the mock parcel belongs.","Destination-sensitive","Place a virtual supply token onto the mock shelf","Mock supply shelf"],
 ["R","data","craft","Health-history training chart","Fictional time points and annotations","Entries run in time order on a fictional training record.","Chronological","Follow the numbered mock chart entries","Mock chart"],
 ["S","role","arc","Orchard sorter","Produce and receiving baskets","Classification sends each fruit toward its designated bin.","Sort-oriented","Guide the fruit token into the target basket","Fruit basket"],
 ["S","artifact","rope","Barn hay sling","Rope, bale and loading hook","The hook carries a swinging load toward a marked stop.","Load-sensitive","Time the cartoon bale swing to its hook","Hay hook"],
 ["S","concept","craft","Irrigation layout","Branches and numbered gates","Branches divide the water routes among labeled field sections.","Networked","Trace the planned route through the model field","Irrigation gates"],
 ["S","animal","rhythm","Bee on a blossom route","Stops and repeated flower visits","Stops on successive blossoms punctuate the path.","Repetitive","Tap at each blossom marker on the cue","Blossom cue"],
 ["S","artifact","spin","Seed sorting drum","Rotating slots and indexed opening","A repeating slot carries material past a stationary outlet.","Periodic","Bring the drum slot over the collection pad","Seed tray index"],
 ["T","artifact","spin","Tabor Tracker Ball 🖲️","Rotational input and moving cursor","A swirl turns finger movement into on-screen rotation.","Direction-sensitive","Match the onscreen rotational marker with the landing pad","Trackball index"],
 ["T","artifact","rope","Workshop gantry crane","Suspended load and overhead track","The overhead track holds a moving load suspended.","Inertia-sensitive","Time the model hook to catch the cargo ring","Crane ring"],
 ["T","system","arc","Parcel transfer robot","Pickup points and drop zones","Pickups and drops occur at marked points along the route.","Trajectory-constrained","Guide the virtual parcel into its drop zone","Robot drop zone"],
 ["T","data","craft","Database record graph","Entities and keyed relationships","Keys define which entities connect across records.","Linked","Trace the numbered links in the database diagram","Database relations"],
 ["U","role","rhythm","Ceremonial drill drummer","Repeating beats and coordinated steps","A recurring beat supplies a timing cue during a ceremony.","Cadenced","Tap the drum cue for the ceremonial display","Ceremonial beat"],
 ["U","artifact","spin","Museum uniform display turntable","Rotating plinth and front marker","Each viewing angle reveals a different part of the display.","Orientation-sensitive","Align the display’s front marker with the viewing pad","Display plinth"],
 ["U","archive","craft","Veterans’ oral history index","Interviews, timestamps and tags","Tags connect interview segments with subjects and dates.","Cross-referenced","Trace the interview index in order","Interview trail"],
 ["U","artifact","arc","Training-field marker token","Colored marker and practice circle","A high-visibility mark identifies one place on a practice field.","Placement-sensitive","Place the virtual marker inside the circle","Practice circle"],
 ["V","artifact","rope","Harbor mooring buoy","Floating body and attached line","The floating marker moves while its line stays anchored.","Buoyant","Time the swing to catch the mooring eye","Mooring eye"],
 ["V","role","rhythm","Harbor signal operator","Light flashes and intervals","Timed light signals create an observable sequence.","Synchronized","Tap the highlighted harbor signal","Harbor light cue"],
 ["V","place","arc","Rescue-sled practice deck","Receiving area separated by a gap","A bounded receiving zone marks the end of the practice run.","Gap-spanning","Send the virtual rescue token to the deck","Practice deck"],
 ["V","data","craft","Ship log timeline","Timestamps and ordered entries","Time entries order the events recorded along a voyage.","Chronological","Trace the displayed voyage checkpoints","Voyage log path"],
 ["Z","role","craft","Cataloger","Description fields and shelf identifiers","Links descriptive information to identifiers people can search.","Schema-driven","Trace from title field to shelf marker","Catalog record path"],
 ["Z","data","craft","Library authority record","Preferred name and variant forms","One preferred identifier connects alternative name forms.","Cross-referenced","Follow the numbered variant-name links","Authority record links"],
 ["Z","artifact","spin","Microfilm reel","Spool direction and alignment marks","Spooling moves individual frames past the reader aperture.","Rotational","Align the reel leader mark with the reader pad","Microfilm pad"],
 ["Z","system","arc","Library book return sorter","Moving item and destination bin","Routes a returned item toward a bin assigned by its label.","Routing-sensitive","Send the book token to its indicated bin","Return bin"]
];
export const ATLAS = Object.freeze(rows.map(([lcc,kind,chassis,title,attributes,characteristics,traits,application,target],index)=>{
 const number=index+1, id=String(number).padStart(3,'0');
 const tier=Object.keys(CLASSES).indexOf(lcc)%7;
 const pace=[.78,.96,1.14,1.32][index%4];
 const drift=(index%2===0?1:-1)*(.018+(index%5)*.009);
 const window=.118-(index%6)*.007;
 return Object.freeze({id,number,lcc,kind,chassis,title,attributes,characteristics,traits,application,target,tier,pace,drift,window,seed:29+number*3});
}));
const indexed = new Map(ATLAS.map(entry=>[entry.id,entry]));
export function atlasEntry(id){return indexed.get(id);}
export function atlasSearch({query='',lcc='',kind='',chassis=''}={}){
 const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
 return ATLAS.filter(entry=>{
  if(lcc&&lcc!==entry.lcc||kind&&kind!==entry.kind||chassis&&chassis!==entry.chassis)return false;
  const haystack=[entry.id,entry.title,CLASSES[entry.lcc],TYPES[entry.kind],entry.attributes,
    entry.characteristics,entry.traits,entry.application,entry.target,MECHANICS[entry.chassis]].join(' ').toLowerCase();
  return terms.every(term=>haystack.includes(term));
 });
}
export function atlasMedals(value){
 return Object.fromEntries(ATLAS.flatMap(({id})=>{
  const score=value?.[id];
  return Number.isSafeInteger(score)&&score>=150&&score<=300?[[id,score]]:[];
 }));
}
