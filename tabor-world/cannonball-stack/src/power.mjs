const provider="https://api.carbonintensity.org.uk";
export async function generation(fetcher=fetch) {
  const response=await fetcher(provider+"/generation",{signal:AbortSignal.timeout(5000),headers:{accept:"application/json"}});
  if(!response.ok)throw Error("Power feed unavailable");
  const {data}=await response.json();
  const {from,to,generationmix}=data??{};
  if(typeof from!=="string"||typeof to!=="string"||!Number.isFinite(Date.parse(from))||
    !Number.isFinite(Date.parse(to))||Date.parse(from)>=Date.parse(to)||!Array.isArray(generationmix)||
    generationmix.length<1||generationmix.length>20||generationmix.some(row=>typeof row?.fuel!=="string"||
    !/^[a-z0-9 -]{1,30}$/i.test(row.fuel)||!Number.isFinite(row.perc)||row.perc<0||row.perc>100)||
    new Set(generationmix.map(row=>row.fuel)).size!==generationmix.length)throw Error("Unexpected generation mix");
  return {provider:"National Energy System Operator",region:"Great Britain",source_url:provider+"/generation",
    units:"percent of reported generation mix",from,to,fuels:generationmix.map(({fuel,perc})=>({fuel,percent:perc}))};
}
