export function makeQuery() {
  const token=process.env.CLOUDFLARE_API_TOKEN;
  const account=process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !/^[a-f0-9]{32}$/.test(account ?? '')) throw Error('Cloudflare account and D1 credentials are required');
  return async (db,sql,params=[]) => {
    const response=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+'/d1/database/'+db+'/query',{
      method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({sql,params}),
      signal:AbortSignal.timeout(25000),redirect:'error'
    });
    if (!response.ok) throw Error('Cloudflare D1 returned '+response.status);
    const payload=await response.json();
    if (!payload.success || !payload.result?.[0]?.success) throw Error('Cloudflare D1 query failed');
    return payload.result[0];
  };
}
