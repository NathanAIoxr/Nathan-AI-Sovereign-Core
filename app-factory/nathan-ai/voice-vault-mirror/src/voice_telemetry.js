// Materials-only Conductor bridge: no raw audio, no private voice packs, no auto-promotion.
export function makeMaterialEvent({id,category,source,sha256=null}){
 if(!id||!category||!source)throw Error('id/category/source required');
 return {schema:1,namespace:'materials.voice-box',id,category,source,sha256,state:'HOLD',direction:'forward',payloadType:'metadata'};
}
export function githubContentsApi(repo,path){
 if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo))throw Error('invalid repository');
 return 'https://api.github.com/repos/'+repo+'/contents/'+path.split('/').map(encodeURIComponent).join('/');
}
