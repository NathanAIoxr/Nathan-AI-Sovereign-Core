/* NATHAN AI — Anatomy A–Z source validation. Educational data only:
 * preserves A–Z letters, Atbash inversions, provenance and conceptual/medical
 * separation. Does not certify medical facts or change a single original word.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanAnatomySource=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const LETTERS='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
 function validate(data){
  if(!data||data.schema!=='nathan-ai.anatomy-atlas.v1')throw Error('Unexpected anatomy source edition');
  if(!Array.isArray(data.anatomyAZ)||data.anatomyAZ.length!==26||!Array.isArray(data.iversions)||data.iversions.length!==26)throw Error('All 26 original positions and IVERSIONS are required');
  for(let i=0;i<26;i++){
   const letter=LETTERS[i],mirror=LETTERS[25-i],a=data.anatomyAZ[i],v=data.iversions[i];
   if(!a||a.letter!==letter||!v||v.letter!==letter||v.mirror!==mirror)throw Error('Anatomy/IVERSION positions are missing, shifted or duplicated at '+letter);
   for(const [label,value] of [['term',a.term],['description',a.description],['anatomy provenance',a.provenance],
      ['IVERSION name',v.name],['human comparison',v.human],['software comparison',v.software],
      ['hardware comparison',v.hardware],['IVERSION provenance',v.from]]){
    if(typeof value!=='string'||!value.trim())throw Error('Missing '+label+' at '+letter);
   }
  }
  for(const key of ['biologicalEquator','grammar','bodySystems','macroMicro','relatedOriginalFrameworks']){
   if(!Array.isArray(data[key])||data[key].length===0)throw Error('Required source section missing: '+key);
  }
  if(!Array.isArray(data.spine?.regions)||data.spine.regions.length!==5||
     data.spine.regions.some(x=>!Number.isInteger(x.count)||x.count<1)||
     data.spine.regions.reduce((a,x)=>a+x.count,0)!==33)throw Error('Spine source edition must retain 33 named positions');
  if(typeof data.scientificBoundary!=='string'||!data.scientificBoundary.includes('not established clinical classifications'))throw Error('Required scientific and medical truth boundary missing');
  if(typeof data.notice!=='string'||!data.notice.includes('assistant-completed'))throw Error('Authorship boundary missing');
  return {letters:26,inversions:26,spinePositions:33,medicalStatus:'conceptual-plus-reference-not-diagnostic'};
 }
 function paired(data,letter){
  validate(data);
  const index=LETTERS.indexOf(letter);
  if(index<0)throw Error('Choose a letter A through Z');
  return {anatomy:data.anatomyAZ[index],iversion:data.iversions[index]};
 }
 return Object.freeze({LETTERS,validate,paired});
});
