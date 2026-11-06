/* Nathan Tabor Quad-Axis additive creative reconstruction. */
(function(root,factory){const x=factory();if(typeof module==="object"&&module.exports)module.exports=x;else root.QuadAxis=x;})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
const rev=s=>Array.from(s).reverse().join("");
const word=s=>s.replace(/\S+/gu,w=>rev(w));
const vertical=s=>s.split("\n").reverse().map(rev).join("\n");
function shift(c,k){const n=c.charCodeAt(0),b=n>=65&&n<=90?65:n>=97&&n<=122?97:null;return b===null?c:String.fromCharCode(b+((n-b+k)%26+26)%26);}
const masters=["leonardo","raphael","donatello","michelangelo"];
function transform(value,master="leonardo",o={},decode=false){const s=String(value),layer=o.layer||"horizontal",harmonic=o.harmonic??7,square=o.square??4;if(![3,7,12].includes(harmonic)||![4,9,16].includes(square))throw Error("Invalid harmonic/square key");
switch(master){
case "leonardo":if(layer==="horizontal")return rev(s);if(layer==="word")return word(s);if(layer==="vertical")return vertical(s);if(layer==="double")return s;throw Error("Unknown Leonardo layer");
case "raphael":return Array.from(s,c=>shift(c,(decode?-1:1)*harmonic)).join("");
case "donatello":return Array.from(s,(c,i)=>shift(c,(decode?-1:1)*((i%square)+1))).join("");
case "michelangelo":return Array.from(s,(c,i)=>i%2===1?shift(c,13):c).join("");
default:throw Error("Unknown master");}}
function stack(s,o){return masters.reduce((x,m)=>transform(x,m,o),s)}
function unstack(s,o){return [...masters].reverse().reduce((x,m)=>transform(x,m,o,true),s)}
return {masters,reverse:rev,word,vertical,encode:(s,m,o)=>transform(s,m,o),decode:(s,m,o)=>transform(s,m,o,true),allFour:(s,o)=>Object.fromEntries(masters.map(m=>[m,transform(s,m,o)])),stack,unstack};
});