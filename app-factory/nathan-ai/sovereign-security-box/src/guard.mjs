// Nathan AI defensive perimeter; no active counterattack or identity attribution.
export function classify(request, config={}) {
 const ip=String(request?.ip??'');const method=String(request?.method??'GET').toUpperCase();
 const path=String(request?.path??'/');const auth=Boolean(request?.authenticated);
 const failed=Number(request?.recentAuthFailures??0);const rate=Number(request?.requestsPerMinute??0);
 const protectedPath=/^\/(admin|conductor|api\/write|vault)(\/|$)/i.test(path);
 const signals=[];
 if(!['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'].includes(method))signals.push('unexpected_method');
 if(protectedPath&&!auth)signals.push('protected_path_unauthenticated');
 if(failed>=5)signals.push('repeated_auth_failure');
 if(rate>(config.maxRequestsPerMinute??120))signals.push('rate_threshold');
 const decision=signals.includes('protected_path_unauthenticated')?'DENY':signals.length>=2?'QUARANTINE':signals.length?'CHALLENGE':'ALLOW';
 return {decision,signals,ipHint:ip?ip.replace(/\d+$/,'x'):null,attribution:'UNVERIFIED',mode:'DEFENSIVE',project:'nathan-ai-security',eventVersion:1};
}
export function safeEvent(request,classification){return {project:'nathan-ai-security',decision:classification.decision,signals:classification.signals,ipHint:classification.ipHint,attribution:'UNVERIFIED',createdAt:new Date().toISOString()};}
