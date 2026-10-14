/* THE POLAR MIDDLE C — a Stewart & Mr. Finn branch game.
   Reuses the existing Middle C language engine. "C" = consciousnesses in
   Nathan Tabor's fictional symbolism, not a scientific measure.
   Historical sources are credited in each gate.
*/
(function (root, factory) {
  'use strict';
  const game = factory(root.MiddleCGame || (typeof require === 'function' ? require('../../middle-c/game.js') : null));
  if (typeof module === 'object' && module.exports) module.exports = game;
  else root.PolarMiddleC = game;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (middleC) {
  'use strict';
  if (!middleC || typeof middleC.reverse !== 'function') throw Error('The existing Middle C engine is required.');
  const MAX_LEVEL = 1000000000;
  const SOURCES = Object.freeze({
    egypt: 'https://www.britishmuseum.org/blog/eureka-finding-key-ancient-egypt',
    egyptNumbers: 'https://mathshistory.st-andrews.ac.uk/HistTopics/Egyptian_numerals/',
    babylon: 'https://mathshistory.st-andrews.ac.uk/HistTopics/Babylonian_numerals/',
    maya: 'https://mathshistory.st-andrews.ac.uk/HistTopics/Mayan_mathematics/',
    letters: 'https://www.cam.ac.uk/research/news/easy-as-alep-bet-gimel-cambridge-research-explores-social-context-of-ancient-writing',
    biblical: 'https://www.cambridge.org/core/books/abs/cambridge-history-of-the-bible/biblical-scripts/A9C6BC53FC8AB5E4863CA17002EEC372',
    china: 'https://mathshistory.st-andrews.ac.uk/HistTopics/Chinese_numerals/',
    india: 'https://mathshistory.st-andrews.ac.uk/Biographies/Brahmagupta/',
    inka: 'https://www.nist.gov/nist-museum/standardizing-empire',
    khipu: 'https://americanindian.si.edu/exhibitions/infinityofnations/andes/143866.html'
  });
  // A gate's answer is historical/contextual: never a claim that all traditions agree.
  const ARCHIVE = Object.freeze([
    {culture:'Ancient Egypt',code:'10',question:'Which number base organized hieroglyphic Egyptian numerals?',answer:'Ten — powers of 10',wrong:['Sixty — powers of 60','Twenty — powers of 20','Twelve — powers of 12'],detail:'Hieroglyphic numeral signs represent units, tens, hundreds and higher powers of ten. This is not the same as modern decimal positional notation.',source:SOURCES.egyptNumbers},
    {culture:'Egyptian hieroglyphs',code:'𓋹',question:'What can a hieroglyphic sign do besides depict a thing?',answer:'Represent sounds or help classify a word',wrong:['Always represent an English letter','Encode only modern numbers','Always reveal one hidden universal meaning'],detail:'Egyptian writing used phonetic signs and semantic determinatives. Its signs cannot be decoded by reading them as modern English.',source:SOURCES.egypt},
    {culture:'Babylonian mathematics',code:'60',question:'What base was used for Babylonian place-value numerals?',answer:'Sixty',wrong:['Two','Ten only','Twenty'],detail:'Sexagesimal place value builds numbers from powers of 60, using combinations of unit and ten signs within a place.',source:SOURCES.babylon},
    {culture:'Maya mathematics',code:'20',question:'What was the principal base of Maya numeration?',answer:'Twenty',wrong:['Eight','Ten only','Sixty'],detail:'Maya numerals use dots, bars and a zero sign; some calendar place values have a special modification.',source:SOURCES.maya},
    {culture:'Phoenician writing',code:'𐤀',question:'Which later writing tradition adapted the Phoenician alphabet?',answer:'Greek alphabetic writing',wrong:['Binary machine code','Modern emoji','Maya bar numerals'],detail:'The Greek alphabet adapted a West Semitic alphabet, including changes to represent vowel sounds.',source:SOURCES.letters},
    {culture:'Ancient Greek writing',code:'Α Β Γ',question:'In early Greek, what major feature did alphabetic adaptation help represent?',answer:'Vowel sounds with dedicated letters',wrong:['Only musical notes','Only numbers in base 60','A single shared word for every language'],detail:'Greek borrowed and transformed the Phoenician sequence of letters; similar letter names are historical connections, not universal spiritual equivalences.',source:SOURCES.letters},
    {culture:'Historical Hebrew scripts',code:'אב',question:'Which pair begins the conventional Hebrew letter sequence?',answer:'Alef and Bet',wrong:['Alpha and Omega','V and X','Dot and bar'],detail:'Hebrew and Greek scriptures used distinct historical writing systems. The game keeps language history separate from speculative ciphers.',source:SOURCES.biblical},
    {culture:'Aramaic and Syriac',code:'ܐ',question:'Are Aramaic and Greek the same ancient language?',answer:'No — distinct languages and script histories',wrong:['Yes — identical language','Yes — both use only Roman numerals','Neither has written texts'],detail:'Aramaic belongs to the Semitic language family. Syriac developed as a literary form of Aramaic; it is not an alternate spelling of Greek.',source:SOURCES.biblical},
    {culture:'Ancient China',code:'十',question:'What place-value base was used on traditional Chinese counting boards?',answer:'Ten',wrong:['Sixty','Twenty-five','Only two'],detail:'Counting rods were arranged in decimal place values, with changing rod orientations helping mark different columns.',source:SOURCES.china},
    {culture:'Indian mathematics',code:'0',question:'Which mathematician described arithmetic with zero in a work of 628 CE?',answer:'Brahmagupta',wrong:['Herodotus','Euclid','Champollion'],detail:'Brahmagupta formulated rules involving zero. Some of his historical rules, such as division by zero, are not accepted in modern arithmetic.',source:SOURCES.india},
    {culture:'Inka khipu',code:'🪢',question:'How did Inka khipu record many quantities?',answer:'Knots and positions on cords',wrong:['Only printed alphabet letters','Only silver coins','By carved Roman numeral clocks'],detail:'Many Inka khipu encode decimal place-value information in cord and knot configurations. Not every meaning of every khipu is settled.',source:SOURCES.inka},
    {culture:'Inka record keeping',code:'10×',question:'The number place values on known Inka khipu commonly follow which base?',answer:'Base ten',wrong:['Base sixty','Base three only','No numerical structure at all'],detail:'Historical Inka knotted-cord records supported administration, tribute accounting and other record keeping.',source:SOURCES.khipu}
  ]);
  const HEARD = Object.freeze([
    {say:'HO / OH',prompt:'Santa Dog shouts “HO!” and Ozzie replies “OH!” Which is the careful reading?',answer:'Two exclamations with the letters in different orders',wrong:['The same spelled word','Both are historical Egyptian words','A universal command in every language'],explain:'HO and OH are different English spellings. Their pronunciation can differ. Their reversal is a playful pattern, not an ancient translation.'},
    {say:'SEA / SEE',prompt:'You hear “sea.” Which statement is accurate?',answer:'“Sea” and “see” can sound alike but differ in meaning',wrong:['Both spellings mean ocean','Hearing reveals their spelling every time','They must have the same origin'],explain:'Context is needed to know which homophone a speaker intends.'},
    {say:'KNIGHT / NIGHT',prompt:'Ozzie hears “night.” What can the sound alone establish?',answer:'Not which spelling was intended',wrong:['It must be a medieval knight','It must be after sunset','It is the same historical root'],explain:'In many English accents, knight and night are pronounced alike but mean different things.'},
    {say:'BARK',prompt:'Stewie hears “bark” near a tree and a dog. What is the best response?',answer:'Ask whether it means tree covering or a dog sound',wrong:['It always means an aggressive animal','It means the dog is dangerous','It only names a tree'],explain:'One spoken form can have more than one meaning; context matters.'},
    {say:'PRESENT',prompt:'A sign says “PRESENT.” What should a word detective check?',answer:'Context, meaning, and possibly stress in pronunciation',wrong:['That it always means right now','That it always means a wrapped gift','That it is an ancient code'],explain:'Present has multiple conventional uses: something given, a time, being there, and a verb.'},
    {say:'C / SEE',prompt:'Santa Dog says “C.” What is the evidence-based distinction?',answer:'The letter name sounds like “see”; the game assigns C a symbolic role',wrong:['Consciousnesses is the dictionary definition of C','All languages call awareness “C”','A note C has a measurable human consciousness'],explain:'C is a letter and a musical pitch name. “C = consciousnesses” is this game world’s original metaphor.'},
    {say:'BASS',prompt:'Mr. Finn finds the word BASS. What determines whether it is a fish or low musical sound?',answer:'Context — and pronunciation can change',wrong:['Only its number of letters','It must always be a fish','It always describes Middle C'],explain:'English spelling does not always supply one pronunciation or meaning.'},
    {say:'HO HO HO',prompt:'What is Santa Dog doing when he shouts “HO HO HO”?',answer:'Giving his invented festive greeting',wrong:['Quoting an Egyptian royal title','Defining every dog as male','Stating a scientific law'],explain:'In the story, HO HO HO is a playful greeting, not a historical language claim.'},
    {say:'OH OH OH',prompt:'What does Ozzie’s “OH OH OH” express in this game?',answer:'Wonder and discovering a new clue',wrong:['The formal etymology of all alphabets','A required ancient number symbol','A claim that all meanings are identical'],explain:'The southern phrase is a fictional character’s catchphrase for curious observation.'},
    {say:'BUTCH / DOG',prompt:'Is “butch” the standard zoological word for a male dog?',answer:'No — Butch Dog is Santa Dog’s chosen nickname',wrong:['Yes — it replaces “dog” in all dictionaries','Yes — it is an Egyptian hieroglyph','All canine females have that designation'],explain:'Male dog is an ordinary term; female dog may be called a bitch in animal terminology. Words can have other, sometimes insulting, human uses.'},
    {say:'ECHO',prompt:'You hear your own words again in Ozzie’s ice cave. What is an echo?',answer:'A reflected sound',wrong:['Proof that time moves backward','A rewritten alphabet','A separate person repeating every sound'],explain:'An echo is a sound reflection. In the game it symbolizes listening twice before deciding what was said.'},
    {say:'STAR',prompt:'Finn points at a “star.” What does context tell you?',answer:'Whether it is a celestial object or a person with acclaim',wrong:['It must always mean a celebrity','It must always be a constellation','It has one meaning in every ancient culture'],explain:'Many ordinary words have different senses; no single decoding rule replaces context.'}
  ]);
  const WORDS = Object.freeze(['HO','OH','PAW','PENGUIN','STEWIE','FINN','MAMMAL','NORTH','SOUTH','ECHO','STAR','MIDDLE','CONSCIOUSNESSES','KINETICS','KINDLING','BARK']);
  const STAGES = ['above','below','middle'];
  function hash(v){return middleC.hash(String(v));}
  function shuffle(opts,seed){return opts.map((v,i)=>({id:'c'+i,label:v})).sort((a,b)=>hash(seed+':'+a.label)-hash(seed+':'+b.label)||a.id.localeCompare(b.id));}
  function indexLevel(level){if(!Number.isSafeInteger(level)||level<1||level>MAX_LEVEL)throw RangeError('Invalid level');return level-1;}
  function puzzle(level,stage){
    const k=indexLevel(level);
    if(!Number.isInteger(stage)||stage<0||stage>2)throw RangeError('Invalid stage');
    let q;
    if(stage===0) {
      const entry=HEARD[(k*7)%HEARD.length];
      q={world:'North Paw',hero:'🎅 HO HO HO Santa Dog',kind:'listen',title:'ABOVE C • What was said?',symbol:entry.say,question:entry.prompt,answer:entry.answer,wrong:entry.wrong,explanation:entry.explain,evidence:'English usage',source:null};
    } else if(stage===1){
      const word=WORDS[(k*5+Math.floor(k/WORDS.length))%WORDS.length];
      const reversed=middleC.reverse(word), options=[word,word.slice(1)+word[0],middleC.reverse(word.slice(1))].filter(x=>x!==reversed);
      while(options.length<3)options.push('NOT-'+options.length);
      q={world:'Polar Mirror Bridge',hero:'🐈‍⬛ Stewie + 🐈 Mr. Finn',kind:'mirror',title:'BELOW C • See it backwards',symbol:word,question:'Read '+word+' one character at a time from RIGHT to LEFT. Which exact string appears?',answer:reversed,wrong:options.slice(0,3),explanation:'The literal reversal is '+reversed+'. The bridge changes written order, not actual word history or spoken pronunciation.',evidence:'Verified string operation',source:null};
    } else {
      const entry=ARCHIVE[(k*5)%ARCHIVE.length];
      q={world:'South Paw',hero:'🐧 OH OH OH Ozzie',kind:'archive',title:'MIDDLE C • Compare the evidence',symbol:entry.code,question:entry.question,answer:entry.answer,wrong:entry.wrong,explanation:entry.detail,evidence:entry.culture,source:entry.source};
    }
    const choices=shuffle([q.answer,...q.wrong].slice(0,4),level+':'+stage);
    if(choices.length!==4||choices.filter(c=>c.label===q.answer).length!==1)throw Error('Bad options');
    return {...q,level,stage,choices,correctId:choices.find(c=>c.label===q.answer).id};
  }
  function newGame(level=1){indexLevel(level);return {schema:'tabor.stewie-polar-middle-c.v1',level,stage:0,locked:false,selected:null,score:0,stars:0,solved:0,history:[]};}
  function validate(s){if(!s||s.schema!=='tabor.stewie-polar-middle-c.v1'||!Number.isSafeInteger(s.level)||s.level<1||s.level>MAX_LEVEL||!Number.isInteger(s.stage)||s.stage<0||s.stage>2||typeof s.locked!=='boolean'||!Number.isSafeInteger(s.score)||s.score<0||!Number.isSafeInteger(s.stars)||s.stars<0||!Array.isArray(s.history))throw Error('Invalid game progress');return s;}
  function answer(state,id){const s={...validate(state),history:[...state.history]},p=puzzle(s.level,s.stage);if(s.locked)throw Error('Stage already answered');const option=p.choices.find(c=>c.id===id);if(!option)throw Error('Unknown answer');const correct=id===p.correctId;s.locked=true;s.selected=id;if(correct){s.score+=100;s.solved++;if(s.stage===2)s.stars++;}s.history.push({level:s.level,stage:s.stage,correct,choice:option.label,answer:p.answer});if(s.history.length>100)s.history.shift();return {state:s,correct,explanation:p.explanation,answer:p.answer};}
  function advance(state){const s={...validate(state),history:[...state.history]};if(!s.locked)throw Error('Finish this part first');if(s.stage<2)s.stage++;else {if(s.level===MAX_LEVEL)throw RangeError('Reached indexed level cap');s.level++;s.stage=0;}s.locked=false;s.selected=null;return s;}
  function decode(input){const text=String(input||'').trim();if(!text||[...text].length>120)throw Error('Enter 1–120 characters');const entry=HEARD.find(x=>x.say.toLowerCase()===text.toLowerCase());return {input:text,literal:middleC.reverse(text),hearing:entry?entry.explain:'Spelling alone may not determine pronunciation or historical meaning.',meaning:entry?entry.answer:'Use a dictionary and context for conventional meaning.',symbolism:'You may invent a symbolic reading, but label it as creative; it is not automatically historical or scientific evidence.'};}
  return Object.freeze({MAX_LEVEL,SOURCES,ARCHIVE,HEARD,WORDS,STAGES,puzzle,newGame,validate,answer,advance,decode});
});
