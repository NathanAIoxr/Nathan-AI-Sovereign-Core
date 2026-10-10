/* TABOR GPS: global position + local orientation + time.
   WGS84 mathematical demonstration, not certified navigation. */
(function(root){"use strict";
const RAD=Math.PI/180, DEG=180/Math.PI, A=6378137, F=1/298.257223563, E2=F*(2-F);
const norm=v=>((v%360)+360)%360;
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
function valid(lat,lon,alt=0){return [lat,lon,alt].every(Number.isFinite)&&lat>=-90&&lat<=90&&lon>=-180&&lon<=180}
function ecef(lat,lon,alt=0){if(!valid(lat,lon,alt))throw Error("Invalid latitude, longitude, or altitude");const phi=lat*RAD,l=lon*RAD,N=A/Math.sqrt(1-E2*Math.sin(phi)**2);return {x:(N+alt)*Math.cos(phi)*Math.cos(l),y:(N+alt)*Math.cos(phi)*Math.sin(l),z:(N*(1-E2)+alt)*Math.sin(phi)}}
function haversine(a,b){if(!valid(a.lat,a.lon)||!valid(b.lat,b.lon))throw Error("Invalid coordinates");const p1=a.lat*RAD,p2=b.lat*RAD,dp=(b.lat-a.lat)*RAD,dl=(b.lon-a.lon)*RAD,h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*6371008.8*Math.asin(Math.min(1,Math.sqrt(h)))}
function bearing(a,b){if(!valid(a.lat,a.lon)||!valid(b.lat,b.lon))throw Error("Invalid coordinates");const y=Math.sin((b.lon-a.lon)*RAD)*Math.cos(b.lat*RAD),x=Math.cos(a.lat*RAD)*Math.sin(b.lat*RAD)-Math.sin(a.lat*RAD)*Math.cos(b.lat*RAD)*Math.cos((b.lon-a.lon)*RAD);return Math.abs(x)+Math.abs(y)<1e-13?null:norm(Math.atan2(y,x)*DEG)}
function compass(deg){if(deg===null)return "Undefined";return ["N","NE","E","SE","S","SW","W","NW"][Math.round(norm(deg)/45)%8]}
function relative(heading,b){if(b===null)return "At destination / bearing undefined";const d=((norm(b-heading)+540)%360)-180;return Math.abs(d)<=22.5?"FORWARD":Math.abs(d)>=157.5?"BEHIND":d>0?"RIGHT "+Math.abs(d).toFixed(1)+"°":"LEFT "+Math.abs(d).toFixed(1)+"°"}
function poleward(lat){return lat>0?"Geographic NORTH":lat<0?"Geographic SOUTH":"Either geographic north or south, depending on selected pole"}
function equator(lat){return Math.abs(lat)<1e-8?"ON EQUATOR":lat>0?"NORTHERN HEMISPHERE":"SOUTHERN HEMISPHERE"}
function layerInfo(){return [
 {n:"01",name:"Core Inertial Anchor",kind:"Earth-centered coordinates",status:"Calculated locally",note:"WGS84 Earth-Centered, Earth-Fixed position. An Earth-fixed frame rotates with Earth; it is not inertial."},
 {n:"02",name:"Surface Vector Field",kind:"Terrain & tangent directions",status:"Calculated locally",note:"True bearings, locally oriented forward/right, and north/east/up reference. No measured terrain elevation in demo."},
 {n:"03",name:"Ionospheric Resonance",kind:"GNSS radio corrections",status:"Concept layer · no live data",note:"Ionospheric delays can affect GNSS precision. Live corrections need verified signals and compatible receivers."},
 {n:"04",name:"Shielding Barrier",kind:"Radiation belts & space weather",status:"Concept layer · no live data",note:"Van Allen belts and broader space weather matter to spacecraft and some high-altitude technology."},
 {n:"05",name:"Magnetopause Boundary",kind:"Solar wind boundary",status:"Concept layer · no live data",note:"A changing magnetospheric boundary—not a rigid shield or independent universal compass field."}
]}
function compute(from,to,heading=0,alt=0,date=new Date()){const p=ecef(from.lat,from.lon,alt),distance=haversine(from,to),trueBearing=bearing(from,to);return {ecef:p,distance,bearing:trueBearing,compass:compass(trueBearing),heading:norm(heading),relative:relative(heading,trueBearing),hemisphere:equator(from.lat),poleward:poleward(from.lat),time:new Date(date).toISOString(),layers:layerInfo()}}
root.TaborGPSEngine={ecef,haversine,bearing,compass,relative,poleward,equator,compute,layerInfo,valid,norm};
if(typeof document==="undefined"||!document.getElementById("gps-form"))return;
const $=id=>document.getElementById(id);
let last=null,deviceHeading=null;
function val(id,n){$(id).textContent=n}
function output(message,error=false){val("status",message);$("status").dataset.error=String(error)}
function number(id){return Number($(id).value)}
function update(){const f={lat:number("lat"),lon:number("lon")},t={lat:number("destlat"),lon:number("destlon")},h=number("heading"),alt=number("alt");
 if(!valid(f.lat,f.lon,alt)||!valid(t.lat,t.lon)||!Number.isFinite(h)){output("Please enter valid coordinates (latitude −90 to 90; longitude −180 to 180).",true);return}
 try{last=compute(f,t,h,alt);const r=last;
 val("where",f.lat.toFixed(5)+"°, "+f.lon.toFixed(5)+"°");
 val("when",new Date(r.time).toLocaleString());
 val("ecef","X "+r.ecef.x.toFixed(0)+" m / Y "+r.ecef.y.toFixed(0)+" m / Z "+r.ecef.z.toFixed(0)+" m");
 val("distance",(r.distance/1000).toFixed(2)+" km");
 val("bearing",r.bearing===null?"—":r.bearing.toFixed(1)+"° "+r.compass);
 val("relative",r.relative);val("hemisphere",r.hemisphere);val("poleward",r.poleward);
 const rot=r.heading,$needle=$("needle");$needle.style.transform="rotate("+(-rot)+"deg)";
 val("heading-value",r.heading.toFixed(1)+"° "+compass(r.heading));val("frame",r.hemisphere+" • heading is independent of position");
 $("layers").replaceChildren();r.layers.forEach(x=>{let card=document.createElement("article");card.className="layer";let name=document.createElement("strong");name.textContent=x.n+" — "+x.name;let meta=document.createElement("small");meta.textContent=x.kind+" • "+x.status;let info=document.createElement("p");info.textContent=x.note;card.append(name,meta,info);$("layers").append(card)});
 const gx=50+f.lon/180*40,gy=50-f.lat/90*35;$("earth-dot").setAttribute("cx",gx.toFixed(2));$("earth-dot").setAttribute("cy",gy.toFixed(2));
 output("Coordinates and direction calculated. Manual values are demonstrations; this is not a navigation safety instrument.");
 }catch(e){output(e.message,true)}
}
$("gps-form").onsubmit=e=>{e.preventDefault();update()};
$("heading").oninput=()=>{val("heading-input",number("heading").toFixed(0)+"°");update()};
$("gps-now").onclick=()=>update();
$("gps-locate").onclick=()=>{if(!navigator.geolocation){output("Device location is unavailable in this browser.",true);return}output("Requesting location permission…");navigator.geolocation.getCurrentPosition(pos=>{val("lat",pos.coords.latitude);val("lon",pos.coords.longitude);if(Number.isFinite(pos.coords.altitude))val("alt",pos.coords.altitude);update();output("Location received with reported accuracy ±"+Math.round(pos.coords.accuracy)+" m. Verify before relying on it.")},err=>output("Could not access device location: "+err.message,true),{enableHighAccuracy:true,timeout:13000,maximumAge:10000})};
$("gps-swap").onclick=()=>{for(const [a,b] of [["lat","destlat"],["lon","destlon"]]){const tmp=$(a).value;$(a).value=$(b).value;$(b).value=tmp}update()};
$("gps-north").onclick=()=>{$("heading").value=0;val("heading-input","0°");update()};
$("gps-south").onclick=()=>{$("heading").value=180;val("heading-input","180°");update()};
$("gps-equator").onclick=()=>{$("lat").value=0;update()};
$("gps-copy").onclick=()=>{if(!last){update();if(!last)return}const data=JSON.stringify(last,null,2);const blob=new Blob([data],{type:"application/json"}),u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download="tabor-gps-measurement.json";a.click();setTimeout(()=>URL.revokeObjectURL(u),1200)};
update();
})(typeof globalThis!=="undefined"?globalThis:this);