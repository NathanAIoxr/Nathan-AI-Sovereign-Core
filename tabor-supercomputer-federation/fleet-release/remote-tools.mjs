const crown = "tabor-sovereign-crown";
const polyglot = "tabor-polyglot-knowledge-gateway";
const imagination = "library-of-tabor-imagination";

const crownTools = [
  [421,"POST",{nodes:[{id:"box",type:"container"},{id:"book",type:"content"}]}],
  [423,"POST",{values:[12,27,145,8,311,10]}],
  [424,"POST",{a:"1",b:"2",c:"1",d:"3",op:"add"}],
  [430,"GET",{value:"1",from:"mi",to:"km"}],
  [432,"GET",{n:"360"}],
  [433,"GET",{value:"79927398713"}],
  [437,"GET",{base:"440",semitones:"7"}],
  [438,"GET",{frequency_hz:"440",source_toward_mps:"12"}],
  [443,"GET",{hz:"500000000000000"}],
  [444,"GET",{temp_c:"20",relative_humidity:"50"}],
  [449,"GET",{lat1:"35.96",lon1:"-80.01",lat2:"36.07",lon2:"-79.79"}],
  [485,"GET",{values:"1,3,2,5,4"}],
  [488,"POST",{text:"Tabor"}],
  [495,"GET",{q:"Euclid"}],
];

const languageTools = [
  [13,{text:"Tabor שלום 𓀀 𒀀"}],
  [48,{text:"ABC\nA👩‍🚀B\n123"}],
  [52,{text:"בְּרֵאשִׁ֖ית",remove:"cantillation"}],
  [74,{text:"Tabor שלום Αλφα"}],
  [83,{text:"Tabor",compare:"Robat"}],
  [95,{text:"Tabor"}],
];
const imaginationDemos = [1,9,31,45,56,73,87,93];
export const providerBindings = {
  FLEET_CROWN:crown, FLEET_POLYGLOT:polyglot, FLEET_IMAGINATION:imagination,
};
const pad = id => String(id).padStart(3,"0");

export const remoteTools = new Map([
  ...crownTools.map(([id,method,example])=>[id,{method,example,binding:"FLEET_CROWN",path:"/api/dispatch/"+id}]),
  ...languageTools.map(([id,example])=>[101+id,{
    method:"POST",example,binding:"FLEET_POLYGLOT",path:"/api/tools/"+pad(id),
  }]),
  ...imaginationDemos.map(id=>[303+id,{
    method:"GET",example:{},binding:"FLEET_IMAGINATION",path:"/demo/IMAG-"+pad(id),fixed:true,
  }]),
]);

export async function invokeRemote(tool, url, payload, env) {
  const target=new URL(tool.path,"https://"+providerBindings[tool.binding]+".internal");
  if (tool.method==="GET") target.search=url.search;
  const opts={method:tool.method,redirect:"manual",signal:AbortSignal.timeout(7000)};
  if (tool.method==="POST") {
    opts.headers={"content-type":"application/json"};
    opts.body=JSON.stringify(payload);
  }
  return env[tool.binding].fetch(target,opts);
}
