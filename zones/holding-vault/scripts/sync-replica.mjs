import {replicateInventory} from './replica.mjs';

const token = process.env.CLOUDFLARE_API_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!token || !/^[a-f0-9]{32}$/.test(account ?? '')) throw Error('Cloudflare API token and account ID required');

const result = await replicateInventory(async ({method,path,body,query}) => {
  const url = new URL('https://api.cloudflare.com/client/v4'+path);
  for (const [key,value] of Object.entries(query ?? {})) url.searchParams.set(key,String(value));
  const response = await fetch(url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  if (!response.ok) throw Error('Cloudflare API returned '+response.status+' for '+method+' '+url.pathname);
  return response.json();
},account);
console.log(JSON.stringify(result,null,2));
