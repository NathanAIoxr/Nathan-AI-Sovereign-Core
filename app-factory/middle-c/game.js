/* THE MIDDLE C — AXIS OF INFINITY
 * Original word/number puzzle. Reverse spelling is deterministic;
 * phonetic and historical readings are hypotheses, never certified truths.
 * Independent from (and reuses the conceptual boundaries of) Babel × Inferno.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MiddleCGame=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const WORDS=Object.freeze([
 {word:'KINETICS',definition:'The branch of mechanics concerned with forces and motion.',parts:['KIN','NET','TIC','S'],note:'KIN and NET are English strings; their presence does not establish the etymology of kinetics.'},
 {word:'ELECTRONS',definition:'Negatively charged elementary particles.',parts:['ELECT','RON','S'],note:'SNORT-CELE is creative recutting, not the scientific meaning of electrons.'},
 {word:'CONSCIOUSNESSES',definition:'Plural of consciousness: awareness or states of awareness.',parts:['CON','SCIOUS','NESS','ES'],note:'Middle C is a user-defined symbolic anchor, not a measured consciousness frequency.'},
 {word:'MAMMALIA',definition:'Taxonomic class of mammals.',parts:['MAM','MAL','IA'],note:'Mammalia is biological taxonomy; hidden letter partitions are imaginative game patterns.'},
 {word:'COMPASSION',definition:'Concern for suffering together with a desire to help.',parts:['COM','PASS','ION'],note:'The word has a known linguistic history; arbitrary splits are not that history.'},
 {word:'SYMPATHY',definition:'Feelings of concern or understanding for another.',parts:['SYM','PATH','Y'],note:'A visual segmentation is not automatically a valid Greek derivation.'},
 {word:'EMPATHY',definition:'The capacity to understand or share another person’s feelings.',parts:['EM','PATH','Y'],note:'Letter puzzles are symbolic unless cross-checked against linguistic scholarship.'},
 {word:'MIRROR',definition:'A surface that reflects light.',parts:['MIR','ROR'],note:'Reversing letters is not the same operation as a physical mirror.'},
 {word:'SOVEREIGN',definition:'Having independent authority or self-government.',parts:['SOV','ERE','IGN'],note:'Independence of box IDs is a software design analogy.'},
 {word:'BABEL',definition:'A biblical place/name associated with the confusion of languages.',parts:['BA','BEL'],note:'Religious narrative and historical linguistics require distinct evidence.'},
 {word:'COSMOS',definition:'The universe viewed as an ordered system.',parts:['COS','MOS'],note:'The game does not map unseen dimensions empirically.'},
 {word:'EQUATOR',definition:'The imaginary great circle equally distant from geographic poles.',parts:['EQU','ATOR'],note:'Changing visual orientation does not reverse geographic north.'}
]);
const NUMBERS=Object.freeze([
 {n:3,culture:'Multiple traditions',term:'Triadic patterns',status:'structural-analogy',description:'Three positions on this board: above, middle, below. Triads also appear in many traditions, but not all mean the same thing.'},
 {n:9,culture:'Ancient Egypt',term:'Heliopolitan Ennead',status:'historical-reference',description:'The Ennead is a group of nine deities in the Heliopolitan theological tradition; local traditions differed.'},
 {n:6,culture:'Geometry',term:'Six cardinal axis directions',status:'mathematical-model',description:'Three mutually perpendicular axes have six signed directions (+X, −X, +Y, −Y, +Z, −Z).'},
 {n:12,culture:'Mesopotamian and later traditions',term:'Twelvefold counting and cycles',status:'historical-reference',description:'Base-60 mathematics and twelvefold divisions occur historically, with meanings varying by culture.'},
 {n:4,culture:'Geometry and symbolism',term:'Four directions',status:'structural-analogy',description:'North, east, south, west are four cardinal compass directions; spiritual uses differ.'},
 {n:7,culture:'Various historical traditions',term:'Sevenfold patterns',status:'structural-analogy',description:'Seven occurs in many religious and historical systems; shared counting does not prove shared origin.'},
 {n:36,culture:'Mathematics',term:'Triangular number of eight',status:'mathematical-model',description:'1+2+3+4+5+6+7+8 = 36.'},
 {n:0,culture:'Mathematics',term:'Additive identity',status:'mathematical-model',description:'Zero is the additive identity, not literal annihilation of a human or material object.'},
 {n:1,culture:'Mathematics',term:'Multiplicative identity',status:'mathematical-model',description:'Multiplying a number by one preserves it; protecting a person is an ethical commitment.'}
]);
const MODES=['mirror','meaning','numbers'];
function reverse(input){return [...String(input)].reverse().join('')}
function tokenize(word){return [...word].map((character,index)=>({id:'C'+index,index,character}))}
function mirror(word){const a=tokenize(word);return {original:word,below:reverse(word),pairs:a.map((x,i)=>({above:x,below:{id:'C'+(a.length-1-i),index:i,character:a[a.length-1-i].character}}))}}
function hash(s){let n=2166136261;for(const ch of String(s)){n=Math.imul(n^ch.codePointAt(0),16777619)>>>0}return n>>>0}
function nth(level){if(!Number.isSafeInteger(level)||level<1||level>1000000000)throw RangeError('Level outside supported range');return WORDS[(level-1)%WORDS.length]}
function choiceSet(answer,wrong,seed){const vals=[answer,...wrong.filter(x=>x!==answer)].slice(0,4),unique=[...new Set(vals)];if(unique.length<3)throw Error('Invalid options');const options=unique.map((v,i)=>({id:'option-'+i,label:String(v),correct:v===answer}));return options.sort((a,b)=>(hash(seed+a.label)-hash(seed+b.label))||a.id.localeCompare(b.id))}
function puzzle(level){const record=nth(level),round=Math.floor((level-1)/WORDS.length),kind=MODES[(level-1)%MODES.length],number=NUMBERS[(level-1)%NUMBERS.length];let title,question,answer,wrong,explanation,status='verified-operation';
 if(kind==='mirror'){title='Mirror the letters';question='Choose the exact right-to-left reversal of '+record.word+'.';answer=reverse(record.word);wrong=[record.word,reverse(record.word.slice(1)),record.word.slice(1)+record.word[0],reverse(record.word).slice(1)+'X'];explanation='This is literal character reversal. It does not prove a hidden message or an identical spoken sound.'}
 else if(kind==='meaning'){title='What the word actually says';question='Choose the conventional meaning of '+record.word+'.';answer=record.definition;wrong=[WORDS[(level)%WORDS.length].definition,WORDS[(level+4)%WORDS.length].definition,WORDS[(level+7)%WORDS.length].definition];explanation=record.note;status='dictionary-style-definition'}
 else {title='Ancient number gateway';question='Which reference is associated with the number '+number.n+'?';answer=number.term;wrong=NUMBERS.filter(n=>n.n!==number.n).slice(round%4,round%4+3).map(n=>n.term);explanation=number.description+' Context: '+number.culture+'. A similar number is not proof of universal ancient agreement.';status=number.status}
 return {level,round,kind,title,question,options:choiceSet(answer,wrong,level+':'+round),answer,explanation,status,word:record.word,below:reverse(record.word),number:number.n,middle:'C',cMeaning:'CONSCIOUSNESSES',sourceKind:'game-content',precepts:['1 + 1 = 2','1 - 1 = 0']};
}
function newGame(level=1){puzzle(level);return {schema:'tabor.middle-c.v1',level,score:0,streak:0,correct:0,attempts:0,answered:false,selected:null,history:[]}}
function validate(s){if(!s||s.schema!=='tabor.middle-c.v1'||!Number.isSafeInteger(s.level)||s.level<1||s.level>1000000000||!Number.isSafeInteger(s.score)||s.score<0||!Array.isArray(s.history)||typeof s.answered!=='boolean')throw Error('Invalid saved game state');return s}
function choose(state,id){const s=structuredClone(validate(state)),p=puzzle(s.level);if(s.answered)throw Error('Already answered');const choice=p.options.find(x=>x.id===id);if(!choice)throw Error('Unknown choice');s.answered=true;s.selected=id;s.attempts++;if(choice.correct){s.streak++;s.correct++;s.score+=100+s.streak*10}else{s.streak=0} s.history.push({level:s.level,kind:p.kind,choice:choice.label,correct:choice.correct,answer:p.answer});if(s.history.length>200)s.history.shift();return {state:s,correct:choice.correct,explanation:p.explanation,answer:p.answer}}
function next(state){const s=structuredClone(validate(state));if(!s.answered)throw Error('Answer current puzzle first');if(s.level>=1000000000)throw Error('Maximum safe indexed level reached');s.level++;s.answered=false;s.selected=null;return s}
function analyze(input){const literal=String(input).trim();if(!literal||literal.length>160)throw Error('Enter 1 to 160 characters');const letters=[...literal].filter(x=>/^[A-Za-z]$/.test(x));const segments=literal.toUpperCase().split(/[^A-Z]+/).filter(Boolean);const suggest=['KIN','NET','TIE','SEN','NIX','NYS','SNORT','CELE'].filter(x=>literal.toUpperCase().includes(x));return {literal,reverse:reverse(literal),letters:letters.length,segments,artisticMatches:suggest,source:'user-provided spelling',interpretation:'Suggested fragments are creative matches, not etymology or evidence of financial surveillance, cosmic forces, or historical identity.'}}
return Object.freeze({WORDS,NUMBERS,MODES,reverse,tokenize,mirror,hash,puzzle,newGame,validate,choose,next,analyze});
});