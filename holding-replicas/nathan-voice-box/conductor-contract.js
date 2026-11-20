// HOLD-only bridge contract; does not connect to an external Worker until explicitly bound.
export const VOICE_BOX_ID='project/one/nathan-voice-box';
export const VOICE_BOX_EVENTS=Object.freeze(['VOICE_BOX_INDEXED','VOICE_BOX_TEST_PASS','VOICE_BOX_HOLD_READY']);
export function voiceBoxEvent(type,details={}){
 if(!VOICE_BOX_EVENTS.includes(type))throw new Error('unsupported event');
 return {schema:1,projectId:VOICE_BOX_ID,type,details,mode:'HOLD',externalDispatch:false};
}
export function canPromote({ownerApproved=false,testsPassed=false,bindingsVerified=false,privacyReviewed=false}={}){
 return ownerApproved&&testsPassed&&bindingsVerified&&privacyReviewed;
}
