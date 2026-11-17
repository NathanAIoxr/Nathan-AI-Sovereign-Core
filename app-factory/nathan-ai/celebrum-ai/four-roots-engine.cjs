'use strict';
// CELEBRUM AI 🧠 — BY NATHAN TABOR
// Local, non-authoritative evidence-classification reference. No external actions.
const crosswalk = require('./four-roots-crosswalk.json');
const ids = new Set(crosswalk.roots.map(r => r.id));
const allowedOrigins = new Set(crosswalk.record_origin_types);
const directions = new Set(['law_to_system','system_to_law']);
const modes = new Set(['anchored','unanchored']);
function path(rootId, direction, mode) {
  if (!ids.has(rootId)) throw new RangeError('Unknown root');
  if (!directions.has(direction)) throw new RangeError('Unknown direction');
  if (!modes.has(mode)) throw new RangeError('Unknown mode');
  return crosswalk.roots.find(r => r.id === rootId)[direction][mode];
}
function verifyMatrix() {
  const errors=[];
  if (crosswalk.roots.length !== 4) errors.push('Expected four roots');
  if (new Set(crosswalk.roots.map(r => r.id)).size !== 4) errors.push('Duplicate root ID');
  for(const r of crosswalk.roots) {
    if(!r.title || !r.controls || !Array.isArray(r.controls)) errors.push('Incomplete '+r.id);
    for(const d of directions) for(const m of modes) if(!r[d] || !r[d][m]) errors.push('Missing '+r.id+' '+d+' '+m);
  }
  for(const edge of crosswalk.connections) if(!ids.has(edge.to))errors.push('Unresolvable edge '+edge.to);
  return {valid:errors.length===0, errors,roots:crosswalk.roots.length,directionalCells:crosswalk.roots.length*directions.size*modes.size};
}
function inspectClaim(claim={}) {
  const notes=[];
  const origin=String(claim.origin||'UNKNOWN');
  if(!allowedOrigins.has(origin))notes.push('Unknown record origin');
  if(['EXECUTED_LOCAL','EXTERNAL_ACTION'].includes(origin) && !claim.receipt)notes.push('Execution not independently evidenced');
  if(claim.originalWasEdited && !claim.separateVersionId)notes.push('Source changed without distinct derived version');
  if(claim.determinesGuilt)notes.push('Criminal guilt cannot be determined by this software');
  if(claim.personalDataPublished && !claim.authorizedPublication)notes.push('Personal data publication lacks authorization evidence');
  if(claim.subjectIsHypothesis && claim.presentedAsFact)notes.push('Hypothesis was promoted into a factual claim');
  if(claim.originalSpeechWasHypothetical && claim.reframedAsDiagnosis)notes.push('Original hypothetical was recast as a diagnosis');
  return {ok:notes.length===0,issues:notes,reviewRequired:notes.length>0};
}
module.exports={crosswalk,path,verifyMatrix,inspectClaim};
