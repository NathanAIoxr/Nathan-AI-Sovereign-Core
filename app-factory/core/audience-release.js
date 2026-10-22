/* TABOR ROOT audience review V1: advisory preflight, not an official age rating.
 * No age inference from user identity and no bypass of storefront questionnaires.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TaborAudienceRelease=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const TYPES=['book','game','educational','app','film','music','social','commerce','humanitarian','simulation'];
const LEVELS=['none','mild','moderate','strong'];
const RISKS=['violence','gore','fear','sexuality','profanity','substances','discrimination','gambling','sensitiveHistory'];
const CAPS=['chat','userGenerated','userUpload','ads','inAppPurchases','randomRewards','location','camera','microphone','externalCode','externalLinks','healthData','donations','realMoney'];
const RANK={none:0,mild:1,moderate:2,strong:3};
function inspect(input){
 if(!input||typeof input!=='object'||!TYPES.includes(input.type)||typeof input.id!=='string'||!input.id.trim())throw Error('Valid project ID and medium required');
 const content=input.content||{},features=input.features||{};
 for(const k of Object.keys(content))if(!RISKS.includes(k))throw Error('Unknown content descriptor: '+k);
 for(const k of Object.keys(features))if(!CAPS.includes(k))throw Error('Unknown product capability: '+k);
 for(const k of RISKS)if(!LEVELS.includes(content[k]??'none'))throw Error('Invalid descriptor: '+k);
 for(const k of CAPS)if(typeof (features[k]??false)!=='boolean')throw Error('Invalid capability: '+k);
 const findings=[],add=(code,level,reason)=>findings.push({code,level,reason});
 const max=Math.max(...RISKS.map(k=>RANK[content[k]||'none']));
 const interactive=['game','simulation'].includes(input.type);
 if(max>=2)add('MATURE_CONTENT','review','Strong/moderate content requires documented human classification and territory-aware ratings.');
 if(content.gore==='strong'||content.sexuality==='strong')add('EXTREME_CONTENT','block','High-intensity material requires specialist review before any family-oriented release.');
 if(interactive&&(content.violence!=='none'||content.gore!=='none'))add('INTERACTIVE_VIOLENCE','review','Player-controlled violence and reward framing require gameplay and most-extreme-scene disclosure.');
 if(input.target==='children'&&(max>=2||features.chat||features.userGenerated||features.randomRewards||features.ads||features.inAppPurchases))add('CHILD_AUDIENCE','block','Child-directed release has unresolved content, monetization or communication safeguards.');
 if(input.target==='children'&&input.type==='game'&&content.fear!=='none')add('CHILD_FEAR','review','Review frightening visuals, sounds and interaction intensity for the intended developmental audience.');
 if(features.randomRewards&&features.inAppPurchases)add('PAID_RANDOM_REWARDS','block','Review gambling/loot mechanics, odds and regional purchase protections before release.');
 if(features.chat||features.userGenerated||features.userUpload)add('USER_CONTENT','review','Moderation, reporting, account safety and user-data protections required.');
 if(features.location||features.camera||features.microphone||features.healthData)add('SENSITIVE_ACCESS','review','Require purpose limitation, opt-in permissions and data minimization.');
 if(features.realMoney||features.donations)add('FINANCIAL_ACTION','block','Financial transactions require permitted processors, compliance, approval and server-side verification.');
 if(features.externalCode)add('REMOTE_CODE','block','Unreviewed downloaded executable functionality requires platform-specific legal and technical review.');
 if(features.ads)add('ADVERTISING','review','Check age suitability, targeting and advertising controls.');
 if(['book','music','film'].includes(input.type)&&!interactive)add('MEDIA_CONTEXT','info','Narrative depiction is assessed in its medium; interactivity rules should not automatically be applied.');
 if(['game','simulation'].includes(input.type))add('MECHANICS_DISCLOSURE','review','Document legal moves, outcome/reward loops, social features, paywalls, unlockable content and updates.');
 if(content.sensitiveHistory!=='none')add('HISTORICAL_CONTEXT','review','Separate documented events, theology, allegation, satire and fiction. Review cultural treatment and attribution.');
 if(input.publishesNewFeatures)add('APP_REVIEW_VISIBILITY','review','Describe new functionality accurately and expose it to review. No concealed/dormant features.');
 const gates=['source-rights','content-editorial','storefront-questionnaire','privacy-safety','on-device-testing','owner-signoff'];
 const blockers=findings.filter(x=>x.level==='block');
 return {schema:'tabor.release.audience.v1',id:input.id,type:input.type,target:input.target||'general',readiness:blockers.length?'HOLD':findings.some(x=>x.level==='review')?'REVIEW_REQUIRED':'ASSESSMENT_REQUIRED',findings,requiredGates:gates,officialAgeRating:null,ageRatingIsOfficial:false,submissionApproved:false,note:'A descriptive self-assessment only. Storefront official questionnaires and local jurisdiction decisions remain mandatory. No automated approval.'};
}
return Object.freeze({TYPES,LEVELS,RISKS,CAPS,inspect});
});