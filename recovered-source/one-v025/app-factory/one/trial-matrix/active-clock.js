/* Entropy counts active play only. Pause preserves the remaining feed interval. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OneActiveClock=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
function create(now=0,{remaining=2000,paused=false}={}){
 if(!Number.isFinite(now)||!Number.isFinite(remaining)||remaining<=0||remaining>2000||typeof paused!=='boolean')throw Error('Invalid active clock');
 let last=now,left=remaining,stopped=paused;
 function advance(at){if(!Number.isFinite(at))throw Error('Invalid clock time');const elapsed=Math.max(0,at-last);last=at;if(stopped)return 0;left-=elapsed;if(left>0)return 0;const ticks=1+Math.floor(-left/2000);left+=ticks*2000;return ticks;}
 function pause(at){const ticks=advance(at);stopped=true;return ticks;}
 function resume(at){if(!Number.isFinite(at))throw Error('Invalid clock time');last=at;stopped=false;}
 function snapshot(){return {remaining:left,paused:stopped};}
 return Object.freeze({advance,pause,resume,snapshot});
}
return Object.freeze({create});
});
