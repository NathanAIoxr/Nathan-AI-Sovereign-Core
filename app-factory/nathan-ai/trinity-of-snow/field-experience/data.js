/* Nathan AI · Snow Family Unified Field · additive author/story/source register */
(function(root,factory){
  'use strict';
  const data=factory();
  if(typeof module==='object'&&module.exports)module.exports=data;
  if(root)root.NathanSnowFieldData=data;
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const north=['+9','+8','+7','+6','+5','+4','+3','+2','+1'];
  const south=['-9','-8','-7','-6','-5','-4','-3','-2','-1'];
  const operators=[
    {n:1,name:'White Pope · Declared Face',tier:'Disclosed Trinity',role:'Public declaration and visible authority',kind:'creator symbolic operator'},
    {n:2,name:'Black Pope · Disciplinary Face',tier:'Disclosed Trinity',role:'Security, enforcement and institutional rules',kind:'creator symbolic operator'},
    {n:3,name:'Grey Pope · Transitional Face',tier:'Disclosed Trinity',role:'Lineage and institutional continuity',kind:'creator symbolic operator · not a verified papal office'},
    {n:4,name:'Operator of Law',tier:'Hidden Pentad',role:'Legal codes and the contested individual center',kind:'creator symbolic operator'},
    {n:5,name:'Operator of Blood',tier:'Hidden Pentad',role:'Lineage, covenants and ancestry narratives',kind:'creator symbolic operator'},
    {n:6,name:'Operator of Word',tier:'Hidden Pentad',role:'Alphabet, sound, translation and changing definitions',kind:'creator symbolic operator'},
    {n:7,name:'Operator of Stone',tier:'Hidden Pentad',role:'Architecture, monuments and territory',kind:'creator symbolic operator'},
    {n:8,name:'Operator of Shadow',tier:'Hidden Pentad',role:'Memory, repetition and feedback loops',kind:'creator symbolic operator'}
  ];
  const channels=['Authority','Law','Lineage','Word','Stone','Memory'];
  const rows=[
    {id:'presentation',name:'Presentation',operators:[1,2],mask:'101100'},
    {id:'governance',name:'Governance',operators:[3,4],mask:'010110'},
    {id:'transmission',name:'Transmission',operators:[5,6],mask:'001101'},
    {id:'recurrence',name:'Recurrence',operators:[7,8],mask:'111001'}
  ];
  const sources=[
    {id:'CREATOR-1380',type:'Creator-authored story',title:'The 1380 Book of Hours (Horrors)',body:'1380 ... the year the abominable kind protectors got murdered in front of the fireplaces of MONSTERS',detail:'Preserved as the creator’s dramatic characterization of a manuscript illustration; not a documented killing of living snow beings.',href:'../index.html#canon',topics:['snow','1380','books','fireplace','story']},
    {id:'CREATOR-TRINITY',type:'Creator-authored story',title:'Trinity of Snow',body:'Snowmen, Snowwomen and Snowchildren are imagined as protectors of children, animals and Mother Earth. The original authored source remains in archive.js.',detail:'Creative-world canon; source is preserved unchanged in the existing archive.',href:'../index.html#canon',topics:['snow','protect','trinity','family','children']},
    {id:'ART-KA36',type:'Historical artifact',title:'KB The Hague · Book of Hours KA 36, fol. 78v',body:'A medieval illuminated manuscript features a snow figure near a fire; the existing archive dates the item circa 1390, rather than verifying the creator’s 1380 title as the precise manuscript date.',detail:'The specific hat and the artist’s intent are interpreted by commentators. The drawing is not evidence that a living snow being was captured.',href:'https://commons.wikimedia.org/wiki/File:Schneemann_haag.jpg',topics:['1380','1390','snow','jewish','judenhut','fire','manuscript','evidence','antisemitism']},
    {id:'HISTORY-PREJUDICE',type:'Historical context',title:'Religious caricature and antisemitism',body:'Medieval anti-Jewish stereotypes and persecution are well documented. Interpreting a hat in one manuscript is not identical to proving the intention of its artist.',detail:'Teach the difference between a surviving image, scholarly interpretation and an original fictional retelling.',href:'https://www.loc.gov/exhibits/heavenlycraft/heavenly-1.html',topics:['jewish','judenhut','hat','caricature','history','antisemitism','protection']},
    {id:'KJV-GEN11',type:'KJV scripture',title:'Genesis 11:1–9 · Babel',body:'The Babel narrative describes a city, a tower, and the confounding of language. It does not provide a surveyed physical elevation of the modern equator.',detail:'Creator symbolic mapping: the Tower of Babel rises ABOVE the level-zero ring.',href:'https://www.biblegateway.com/passage/?search=Genesis%2011%3A1-9&version=KJV',topics:['babel','tower','language','north','above','scripture']},
    {id:'KJV-PROV827',type:'KJV scripture',title:'Proverbs 8:27',body:'“When he prepared the heavens, I was there: when he set a compass upon the face of the depth:”',detail:'Circular geometry in scriptural imagery; not a geological proof of an equatorial void.',href:'https://www.biblegateway.com/passage/?search=Proverbs%208%3A27&version=KJV',topics:['circle','compass','depth','geometry','bible']},
    {id:'KJV-ISA4022',type:'KJV scripture',title:'Isaiah 40:22',body:'“It is he that sitteth upon the circle of the earth...”',detail:'Geometric and theological imagery; Earth structure requires independent physical evidence.',href:'https://www.biblegateway.com/passage/?search=Isaiah%2040%3A22&version=KJV',topics:['earth','circle','geography','scripture']},
    {id:'KJV-JOB381',type:'KJV scripture',title:'Job 38:4–6',body:'“Where wast thou when I laid the foundations of the earth? declare, if thou hast understanding.”',detail:'The passage uses architectural language and measurement; it does not specify a 19-level physical Earth.',href:'https://www.biblegateway.com/passage/?search=Job%2038%3A4-6&version=KJV',topics:['measure','stone','line','foundations','bible']},
    {id:'KJV-JOB2610',type:'KJV scripture',title:'Job 26:10',body:'“He hath compassed the waters with bounds, until the day and night come to an end.”',detail:'Boundary imagery; do not present the equator-as-void reading as a geological finding.',href:'https://www.biblegateway.com/passage/?search=Job%2026%3A10&version=KJV',topics:['water','bounds','equator','circle','scripture']},
    {id:'KJV-2TIM215',type:'KJV scripture',title:'2 Timothy 2:15',body:'“Study to shew thyself approved unto God ... rightly dividing the word of truth.”',detail:'Connects to the creator’s method of examining words, names, and their interpretations.',href:'https://www.biblegateway.com/passage/?search=2%20Timothy%202%3A15&version=KJV',topics:['rightly','divide','word','language','bible','study']},
    {id:'LIT-DANTE',type:'Literary source',title:'Dante · Inferno',body:'Dante’s literary Inferno depicts nine descending circles. Its historical cosmology is not a measured map of Earth’s physical interior.',detail:'Creator interpretation: place an inverted Inferno below level zero without silently identifying the work as geology.',href:'https://www.gutenberg.org/ebooks/8800',topics:['dante','inferno','south','below','nine','levels','literature']},
    {id:'MODEL-19',type:'Creator symbolic model',title:'Nineteen-level Snow Family matrix',body:'ABOVE/NORTH: +9 +8 +7 +6 +5 +4 +3 +2 +1; EQUATOR/VOID/MIDDLE: 0; BELOW/SOUTH: -9 -8 -7 -6 -5 -4 -3 -2 -1.',detail:'The order is a creator-authored invariant. This is not an empirically established model of Earth’s interior.',href:'../index.html#tree',topics:['equator','void','nineteen','19','matrix','north','south']},
    {id:'MODEL-4X6',type:'Creator symbolic model',title:'Ten-position and four-by-six field model',body:'Matrix 0 is Pure Potential; operators 1–8 are symbolic transformations; Matrix 9 is ONE/release. Four transformation tiers project through six channels: Authority, Law, Lineage, Word, Stone and Memory.',detail:'This finite-state demonstration is not evidence of eight actual Vatican control offices.',href:'../../../one/nathan-matrix/index.html',topics:['matrix','0','9','four','six','operator','escape','law']},
    {id:'HISTORY-FROSTY',type:'Folklore history',title:'Snow figures and changing seasonal meanings',body:'Folklore and holiday iconography have changed over centuries. Modern friendly snow figures cannot be read backward as evidence of an ancient shared species.',detail:'Explore the existing source-preserving snow archive for Yuki-onna, Snegurochka, Yeti and other distinct traditions.',href:'../index.html#history',topics:['snow','frosty','folklore','tradition','children']}
  ];
  const volumes=[
    {id:'V1',title:'THE 1380 BOOK OF HOURS (HORRORS)',subtitle:'A Book of Lights begins',chapters:[
      'The Picture in the Margin','The Snowman Beside the Fire','The Hat and the Label','Who Wrote the Caption?','Snowwoman Opens the Archive','Children Ask What Happened','The Witness and the Story','The Language of the Tower','The Ring at Zero','The Northern Nine','The Southern Nine','The Guardians Choose Mercy','The Light That Remains'
    ]},
    {id:'V2',title:'THE TOWER, THE RING, AND THE AUGER',subtitle:'The 19-level journey',chapters:[
      'Compass Upon the Deep','The City and the Tower','Nine Above','The Middle Is Zero','Nine Below','Dante and the Reader','The Stone Channel','A Word Comes Apart','The Lineage Ledger','Memory and the Loop','The Six Channels','The Four Transformations','The Door Marked ONE'
    ]},
    {id:'V3',title:'THE SNOW FAMILY BOOK OF LIGHTS',subtitle:'Protecting innocence through knowledge',chapters:[
      'A Library with No Erasures','The Guardian’s Promise','Snowchildren Write a Question','Two Witnesses','The Truth Ledger','The First Correction','The Ring of Memory','Stories Across Countries','The Museum Visit','The Choice at the Fireplace','A Different Ending','Build Without Erasing','The Next Book Opens'
    ]}
  ];
  const quests=[
    {id:'Q1',title:'The 1380 / 1390 clue',prompt:'A story title says 1380. The identified manuscript entry is dated circa 1390. What should the archive display?',options:['Keep both with different labels','Erase the historical date','State that both are exact artifact dates'],correct:0,explain:'Preserve the creator’s 1380 title and the catalogued circa-1390 artifact date separately.',source:'ART-KA36'},
    {id:'Q2',title:'The hat in the margin',prompt:'The snow figure wears a hat that readers connect with medieval Jewish headwear. What can you establish?',options:['The image exists; the specific meaning is interpreted','Every detail of the artist’s intent is proven','The image depicts real living Snowchildren'],correct:0,explain:'Evidence identifies the artifact. Symbolic readings and artistic intention need qualified interpretation.',source:'HISTORY-PREJUDICE'},
    {id:'Q3',title:'The circle of the earth',prompt:'Isaiah uses the expression “circle of the earth.” What does that establish?',options:['A real KJV image of circularity','A geologically confirmed hollow equator','The physical dimensions of an underground Inferno'],correct:0,explain:'The verse exists; turning it into a precise geological claim requires separate evidence.',source:'KJV-ISA4022'},
    {id:'Q4',title:'Protect the child',prompt:'A child finds a hateful medieval caricature and asks who was harmed. What is the best explanation?',options:['Explain the prejudice and protect the targeted people','Treat the stereotype as fact','Conceal that prejudice existed'],correct:0,explain:'Teaching historical persecution with age-appropriate context protects dignity and helps critical reading.',source:'HISTORY-PREJUDICE'},
    {id:'Q5',title:'The two matrix systems',prompt:'How should the ten-position operators and 19-level world be organized?',options:['As two linked but distinct numbering systems','Merge them and rename all levels 1–19','Delete the zero boundary'],correct:0,explain:'Keep 0–9 operational slots distinct from +9 to +1 / 0 / −9 to −1.',source:'MODEL-19'},
    {id:'Q6',title:'Escape the infinity loop',prompt:'The simulated transform repeats its input cycle. What does Matrix 9 mean in this software?',options:['An explicit release path chosen by the program','Proof of a hidden physical machine','A new claim that original sources should disappear'],correct:0,explain:'Matrix 9 is a model-defined exit. The program can preserve the original input while ending the loop.',source:'MODEL-4X6'}
  ];
  return Object.freeze({id:'nathan-ai.snow-family-field.v1',north,south,center:'0',operators,channels,rows,sources,volumes,quests,anchors:['1+1=2 · BUILD','1-1=0 · CLEAR','PROTECT CHILDREN · ANIMALS · MOTHER EARTH']});
});