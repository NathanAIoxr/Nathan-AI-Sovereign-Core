/* Nathan AI 🚀 / ONE — Vatican recovery. A public index, not owner originals. */
(function(root){"use strict";
const RANGES=Object.freeze([
[213,232,"Chivalric & Crusader Military Orders (The Papal Vanguard)"],
[233,252,"Internal Clerical Orders, Conclaves, and Special Envoys"],
[253,272,"Lay Movements, Fraternal Societies, and Influence Networks"],
[273,291,"Dynastic Houses, Cartels, and Royal Papal Orders"],
[292,312,"Modern Financial, Intelligence, and Shadow Networks"]]);
const SUBJECTS=Object.freeze(["Sovereign Military Order of Malta","Jesuits","Roman Inquisition","Opus Dei","Supreme Order of Christ","Black Nobility","Vatican Bank / Institute for the Works of Religion (IOR)","P2","Vatican Apostolic Archive","Holy Alliance","ratlines","Vatican–CIA","Banco Ambrosiano","ASIF","Sant’Egidio","Pontifical Academies","Vatican Diplomatic Corps","Gendarmerie","Peter’s Pence Foundation Board","Papal Swiss Guard","Holy Crusades","Index Librorum Prohibitorum","Papal States","King John's 1213 concession","Lateran Treaty 1929","Reichskonkordat 1933","Vatican Necropolis","Passetto di Borgo","Taborites and Hussite conflicts"]);
const WORKS=Object.freeze(["THE VATICAN VAULT","The Vatican Exposed: History, Documents, Truth","The Vatican Lie","BCV — BLOOD CULT VATICAN VERSION","The Church and the Missing Children — A Biblical Reckoning","HEAVENS DEMONS — THE APP & THE GAME","THE TAC CHRONICLES","THE ACT CHRONICLES","THE TWO KEYS","101 Things That Could Be True Inside the Vatican Apostolic Archive","Got My Money (Vatican Raid)","HOLY HYDRA / Hitler Won Seven Hails","VaticanIndictmentEngine","SCROLLFIRE PROTOCOL","Eternal Hitler Protocol","Autocorrect Breach Protocol","Tabor Accords","Nathan AI Ultimate Truth Engine","CipherEngine","VATICAN / VAULT / THE acrostics","SPASPE ↔ EPSAPS","TABOR TIME TRAVELING TRAIN","The 312 Network Matrix","Vatican → England → America","KJV Red-Letter Manifesto / Jesus Christ Foreword","MOUNT TABOR — TRANSFIGURATOR","THE TOUGH LOVE OF CHRISTIANITY AND CATHOLICISM","The Theology of Sovereign Innocence","THE GOOD AND GREAT SAMARITAN MANIFESTO"]);
const WORDS=Object.freeze([
["BCV declaration","EVERY VERSION IS THE BCV — BLOOD CULT VATICAN VERSION — WITH ANOTHER NAME","author-declaration—not-verified-history"],
["VATICAN acrostic","VATICAN: Vindictive, Awful, Tyrants, [I undecided], Conmen, Absolute, Nothing","author-cipher—incomplete-letter-preserved"],
["Innocence","PROTECT NO ONE BUT INNOCENCE","author-motto"],
["Original source protocol","Bring all secret passages into the real light - not the fake light of this world - and recode all the matrices - innocence is not a commodity any longer","author-directive"],
["BUILD / CLEAR","1+1=2 BUILD; 1-1=0 CLEAR","author-canon"]]);
const ORIGINAL_FILES=Object.freeze([
"KJV_SPIRITUAL_WORKS_COMPLETE_INDEX_v2.md","Nathan_Tabor_Recent_Work_Master_Index_2026-10-28.md",
"Pasted markdown(20261010-155336).md","Pasted markdown(20261010-155630).md","Pasted text(20261018-190304).txt",
"Pasted text(20261027-010008).txt","Pasted text(20261027-010212).txt",
"Secret_Passages_Unabridged_Restored_Archive_2026-10-28.txt",
"TABOR_COMPLETE_CIPHER_DECIPHER_REGISTER_2026-10-23.json",
"THE_ACT_CHRONICLES_Nathan_Tabor_Life_Story_v001.md",
"THE_TAC_CHRONICLES_Master_Architecture_v001.md",
"The Vatican Exposed: History, Documents, Truth.png","vatican_archive_copy_paste.py"]);
const GROUPS=Object.freeze(["all","documents","audit","network","subjects","works","author-words","private-files"]);
const GAPS=Object.freeze(["The 101-event audit source contains numbered entries 1–69 only. Entries 70–101 are not recovered.","The original wording for 312-network positions 213–312 is not in the current public archive; no placeholder is a fabricated original entry.","The separate 101-personnel creative register must not be confused with the historical audit.","The full original manuscripts and images are owner-private in the recovery ZIP, not embedded in this public site."]);
const CORRECTIONS=Object.freeze(["The 1871 Organic Act organized the District of Columbia's municipal government; it did not incorporate the entire United States as Vatican property.","2 Corinthians 4:4 contains the Greek wording 'the god of this age'; the text does not literally name the Vatican.","Inclusion of a person or organization as a research subject does not establish criminal wrongdoing or a unified conspiracy."]);
function allGroups(history){
 const docs=(Array.isArray(history)?history:[]).map(r=>({id:"DOC-"+r.id,title:r.title,group:"documents",kind:r.category,detail:String(r.year)+" · "+r.title,status:r.status,source:"vatican_archive_copy_paste.py"}));
 const audit=Array.from({length:69},(_,i)=>({id:"AUD-"+(i+1),title:"Historical audit #"+(i+1),group:"audit",kind:"historical-audit-reference",detail:"Verbatim wording is held in the owner-private original file Pasted text(20261027-010212).txt.",status:"original-source-private; historical-claim-not-verified",source:"Pasted text(20261027-010212).txt"}));
 const network=RANGES.flatMap(([from,to,label])=>Array.from({length:to-from+1},(_,i)=>({id:"NET-"+(from+i),title:"Matrix position "+(from+i),group:"network",kind:"unrecovered-numbered-source",detail:label,status:"verbatim-source-not-recovered",source:"312 Network Matrix recovery index"})));
 const subjects=SUBJECTS.map((t,i)=>({id:"SUB-"+(i+1),title:t,group:"subjects",kind:"research-subject",detail:"Unassigned to any invented numbered slot; named topic, not evidence of a single network.",status:"research-reference",source:"Vatican recovery index"}));
 const works=WORKS.map((t,i)=>({id:"WORK-"+(i+1),title:t,group:"works",kind:"book-game-engine-or-cipher",detail:"Catalog title or conceptual reference; a title alone does not prove a finished book or installed engine.",status:"catalog-reference",source:"Vatican recovery index"}));
 const words=WORDS.map(([title,detail,status],i)=>({id:"AUTHOR-"+(i+1),title,group:"author-words",kind:"author-original",detail,status,source:"Recovered author declarations"}));
 const privateFiles=ORIGINAL_FILES.map((t,i)=>({id:"SOURCE-"+(i+1),title:t,group:"private-files",kind:"original-file",detail:"Available in the separately owned recovery ZIP; never automatically published.",status:"owner-private-file",source:"Nathan_AI_Vatican_Master_Recovery_2026-11-01.zip"}));
 return [...docs,...audit,...network,...subjects,...works,...words,...privateFiles];
}
function select(history,group,query){
 if(!GROUPS.includes(group))return [];
 const term=String(query||"").toLowerCase();
 return allGroups(history).filter(r=>(group==="all"||r.group===group)&&[r.title,r.id,r.kind,r.detail,r.status,r.source].some(v=>String(v).toLowerCase().includes(term)));
}
const api=Object.freeze({RANGES,SUBJECTS,WORKS,WORDS,ORIGINAL_FILES,GROUPS,GAPS,CORRECTIONS,allGroups,select});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.VaticanONE=api;
})(typeof globalThis!=="undefined"?globalThis:this);
