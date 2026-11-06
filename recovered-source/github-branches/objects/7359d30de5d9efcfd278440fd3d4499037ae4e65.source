(function(root){
  'use strict';
  const SCHEMA='nathan-ai.appearance.v1',KEY=SCHEMA;
  const skins=[
    ['original','Original','Keep each page’s original palette.','dark','#101720','#1b2934','#f4f1e8','#bac8d2','#e6cea0','#15232e','#617786','#6ee1d3'],
    ['midnight','Sovereign Midnight','Ink blue, warm gold, quiet precision.','dark','#0b1422','#12243a','#eef5ff','#b6c8df','#eac784','#15232e','#46617e','#6ee1d3'],
    ['aurora','Aurora','Indigo surfaces and luminous mint.','dark','#10142a','#1d2444','#f3f1ff','#c7c4e0','#a9f3df','#09251f','#665a94','#c3b1ff'],
    ['oceanic','Oceanic','Deep-water blue and sea-glass accents.','dark','#071b27','#0f3042','#edfaff','#b9d8e4','#7be0dd','#09292b','#436f83','#b0e5ff'],
    ['parchment','Library Parchment','Warm paper and editorial brown.','light','#f5efdf','#fffcf3','#302b22','#675b45','#6b3c17','#fff8e9','#a99a7b','#345e55'],
    ['studio','Studio Light','Clear white surfaces with cobalt focus.','light','#f5f7fb','#ffffff','#172d42','#4c6175','#1353b4','#ffffff','#9aaabd','#426559'],
    ['terminal','Terminal','Green phosphor on near-black.','dark','#050e0b','#0d1d15','#c8ffd1','#9ac7a4','#8bf3a6','#082011','#397951','#cce68a'],
    ['graphite','Graphite','Neutral charcoal, silver, restrained surfaces.','dark','#16191c','#252a2f','#f2f4f5','#c3c9cf','#d9e0e5','#1b232b','#647280','#b7d5e9'],
    ['amethyst','Amethyst','Plum, lavender, and soft orchid.','dark','#1e112b','#321f45','#fff1ff','#ddc5e8','#f0b7ff','#351044','#9878aa','#e5d48d'],
    ['sunset','Copper Sunset','Dark terracotta with warm amber.','dark','#251717','#3d2624','#fff5e9','#e5c9b8','#ffce89','#42270b','#a17464','#ecc0ac'],
    ['contrast-dark','High Contrast Dark','Black, white, and decisive yellow focus.','dark','#000000','#101010','#ffffff','#dddddd','#ffee00','#000000','#ffffff','#ffffff'],
    ['contrast-light','High Contrast Light','White, black, and deep navy actions.','light','#ffffff','#ffffff','#000000','#333333','#000080','#ffffff','#000000','#000080']
  ].map(([id,name,description,scheme,bg,panel,text,muted,accent,onAccent,border,secondary])=>({id,name,description,scheme,bg,panel,text,muted,accent,onAccent,border,secondary}));
  const defaults={skin:'original',font:'system',scale:'1',density:'comfortable',width:'comfortable',reduceMotion:false};
  const allowed={skin:skins.map(x=>x.id),font:['system','serif','mono','readable'],scale:['0.95','1','1.1','1.2'],density:['comfortable','compact'],width:['comfortable','wide','reading']};
  function settings(value){
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid appearance settings');
    const result={...defaults};for(const [key,values]of Object.entries(allowed)){if(value[key]!==undefined){if(!values.includes(value[key]))throw Error('Unsupported '+key);result[key]=value[key]}}
    if(value.reduceMotion!==undefined){if(typeof value.reduceMotion!=='boolean')throw Error('Invalid motion setting');result.reduceMotion=value.reduceMotion}return result;
  }
  function parse(raw){if(typeof raw!=='string'||raw.length>10000)throw Error('Appearance file is too large');const value=JSON.parse(raw);if(value.schema!==SCHEMA)throw Error('Unsupported appearance file');return settings(value.settings)}
  function serialize(value){return JSON.stringify({schema:SCHEMA,settings:settings(value)},null,2)}
  function contrast(a,b){
    function luminance(hex){const rgb=hex.replace('#','').match(/.{2}/g).map(c=>parseInt(c,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722}
    const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
  }
  const api={SCHEMA,KEY,skins,defaults,allowed,settings,parse,serialize,contrast};if(typeof module==='object'&&module.exports)module.exports=api;else root.NathanAppearance=api;
})(typeof window==='object'?window:globalThis);
