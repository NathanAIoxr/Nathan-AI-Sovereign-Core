/* NATHAN AI — DEHACK THE WORLD · DELIVER THE WORLD
 * A–Z names are transcribed from the owner-supplied source and ordered
 * exactly as received. The 101 heading coexists with 104 actual bullet entries.
 * Complete verbatim descriptions are recoverable by importing the ORIGINAL
 * Pasted text.txt on the user's own device; never silently rewrite them.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanDehackCatalog=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const LETTERS='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NAMES=[
['Absolute Asset Auditing','Archery Impact Tracker','Analog Audio Extraction','Ant-Colony Architecture Design'],
['Appliance Durability Audit','Bakery Material Sourcing','Binary Morality Filter','Blueberry Muffin Melt Ratio'],
['Concrete Scale Navigation','Chrono-Timeline Slider','Couch Comfort Mapping','Crockpot Recipe Preservation'],
['Direct Action Routing','Dog Language Sync','Driveway Zoning Verification','Dartboard Geometry Alignment'],
['Ephemeral Container Flushing','Esther Project Deployment','Extending Table Carpentry','Equipment Privacy Deletion'],
['Farm-to-Table Logistics','Fruit Ripeness Scanning','Free-Throw Rim Targeting','Friction Subtraction Calculations'],
['Global Infrastructure Tracker','Garbage Waste Conversion','Good Samaritan Dispatch','Grammar Trap Stripping'],
['Hardware Exception Triggers','Hound Dog Motivation Profiling','History Leak Scrubbing','Homeplace Land Restoration'],
['Innocence Gift Safeguard','Input Cleanliness Scan','Intelligent UI Synthesis','Insect Coexistence Mapping'],
['Judith Strategic Blueprinting','Jael Systemic Correction','Joint Venture Auditing','Joy-Driven Processing'],
['KJV Mathematical Mapping','Kernel Stability Monitoring','Kitchen Allergen Verification','Kinesthetic Cadence Matching'],
['Local Checkpoint Mapping','Lasso of Truth Enforcement','Linguistic Phonetic Decryption','Log Cabin Insulation Audit'],
['Macro System Diagnostics','Micro Texture Verification','Motorcycle Sidecar Balancing','Man-Made Illusion Removal'],
['Natural Remedy Verification','Neck Adjustment Trajectory','Nomad Monad Orientation','Nostalgic Flavor Revival'],
['Open Canvas Formatting','OBD Diagnostic Configuration','Oil Supply Traceability','Order Maintenance Engine'],
['Perspective Shifting Engine','Pre-Thought Termination Switch','Porch Environment Calibration','Progressive Disclosure Truncation'],
['Quantum Scale Shifting','Quiet Baseline Restitution','Query Precision Lock','Quality Assurance Auditing'],
['Real-Time Global Scanning','Rat-Tail Design Customization','Realitist Logic Filtering','Resource Sharing Calculator'],
['Sovereign Sovereignty Shield','Silver Queen Harvest Tracker','Soft-Serve Machine Blueprinting','Systemic Malice Deconstruction'],
['Time Travel Simulation','Tabor Appliance Circuit Map','Trojan Defense Isolation','Truth-in-Language Linearizer'],
['Unalterable Core Enforcement','Underground Space Architecture','Unadorned Data Rendering','Utility-First Filtering'],
['Voice Blueprint Harmonization','Vengeance Matrix Inversion','Vintage Suit Tailoring Layouts','Vein Pattern Calibration'],
['Watermelon Salt Layering Grid','Well-Water Purity Scan','Woodpecker Habitat Tracking','Winnie-the-Pooh Stuffed Form Sizing'],
['Xavier Contact Encryption','X-Axis Spatial Plotting','Xylographic Block Reconstruction','Xenobiotic Compound Scraping'],
['Yes-is-Yes Declaration Lock','Yin-and-Yang Night Balance','Yield-on-Cost Projections','Youth Protection Routing'],
['Zero-State Slate Clearing','Zoning Compliance Auditing','Zorro Font Matrix Cipher','Zodiac Alignment Synchronization']
];
const SPECIFIC={
'Binary Morality Filter':'evidence',
'Man-Made Illusion Removal':'plain',
'Grammar Trap Stripping':'plain',
'Realitist Logic Filtering':'evidence',
'Truth-in-Language Linearizer':'compare',
'History Leak Scrubbing':'compare',
'Systemic Malice Deconstruction':'compare',
'Resource Sharing Calculator':'share',
'Zero-State Slate Clearing':'clear',
'Quiet Baseline Restitution':'clear',
'Yes-is-Yes Declaration Lock':'evidence',
'Progressive Disclosure Truncation':'plain',
'KJV Mathematical Mapping':'compare',
'Query Precision Lock':'evidence',
'Unadorned Data Rendering':'plain',
'Friction Subtraction Calculations':'plain'
};
const SOURCE_SHA256='1cf68a8d3c67d365f7e50717f91cbc4f49478d7fa0b9470e0874a432076177ff';
const records=Object.freeze(NAMES.flatMap((items,i)=>items.map((title,j)=>Object.freeze({
 ordinal:i*4+j+1,letter:LETTERS[i],title,workingMode:SPECIFIC[title]||'worksheet',
 releaseStatus:SPECIFIC[title]?'shared-consumer-tool':'source-registered-task',
 description:'Source description available through verbatim original-file import',
 authoredSource:'Pasted text.txt / The Consumer A-to-Z Reality Directory'
}))));
const FILTERS=Object.freeze([
{id:'institutional',title:'Man-Made Lies Stripped (The Institutional Purge)',mode:'plain',notice:'Simplify wording; retain the source and verify every claim independently.'},
{id:'jerome',title:'Saint Jerome Lies Removed (The Textual & Translation Correction)',mode:'compare',notice:'Compare owner-provided manuscripts and translations without alleging alterations as historical fact without evidence.'},
{id:'spiritual',title:'God Lies Removed (The Spiritual Control Purge)',mode:'evidence',notice:'Review religious claims and interpretations with user-supplied sources; do not erase beliefs or assert universal theological findings.'}
]);
function validateRecords(){if(records.length!==104||new Set(records.map(r=>r.title)).size!==104)throw Error('The 104 original titles must remain complete and distinct');
 for(let i=0;i<records.length;i++)if(records[i].ordinal!==i+1||records[i].letter!==LETTERS[Math.floor(i/4)]||records[i].title!==NAMES[Math.floor(i/4)][i%4])throw Error('Source order changed');
 return {letterGroups:26,sourceClaimedCount:101,actualSourceEntries:104,retainedEntries:records.length};}
function parseOriginal(source){
 if(typeof source!=='string'||source.length>200000||!source.includes('The Consumer A-to-Z Reality Directory'))throw Error('Select the original A-to-Z text file (max 200,000 characters)');
 const text=source.replace(/\r\n?/g,'\n');const lines=text.split('\n');
 const start=lines.findIndex(x=>x.trim()==='A'),end=lines.findIndex(x=>x.startsWith('The complete A-to-Z consumer registry'));
 if(start<0||end<=start)throw Error('Original A–Z section boundaries were not found');
 const original=[];let letter=null;
 for(const line of lines.slice(start,end)){
  if(/^[A-Z]$/.test(line))letter=line;
  else if(line.startsWith('• ')){
   const idx=line.indexOf(': ');if(idx<3||!letter)throw Error('Malformed source bullet');
   original.push({letter,title:line.slice(2,idx),description:line.slice(idx+2),verbatimLine:line});
  }
 }
 validateRecords();
 if(original.length!==104)throw Error('Expected 104 original A-Z bullets; received '+original.length);
 for(let i=0;i<original.length;i++)if(original[i].letter!==records[i].letter||original[i].title!==records[i].title)throw Error('Original item '+(i+1)+' was altered or moved');
 return original.map((o,i)=>Object.freeze({...records[i],description:o.description,verbatimLine:o.verbatimLine}));
}
function search(items,query='',letter='all'){
 const q=String(query).trim().toLocaleLowerCase();
 return items.filter(r=>(letter==='all'||r.letter===letter)&&(!q||[r.title,r.description,r.letter,r.workingMode].some(x=>String(x).toLocaleLowerCase().includes(q))));
}
return Object.freeze({LETTERS,NAMES,records,FILTERS,SOURCE_SHA256,validateRecords,parseOriginal,search});
});
