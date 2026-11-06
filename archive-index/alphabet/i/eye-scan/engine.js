/* Nathan AI — I / EYES / GHG source-preserving text-scan addon.
   Works on OWNER-SUPPLIED TEXT only. No OCR, camera, clipboard capture, network
   operations, identity inference, automatic deletion, or secret storage. */
(function(root, factory) {
  'use strict';
  const api=factory();
  if(typeof module==="object" && module.exports) module.exports=api;
  else root.NathanEyeScan=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  'use strict';
  const SEG=typeof Intl!=="undefined" && Intl.Segmenter
    ? new Intl.Segmenter(undefined,{granularity:"grapheme"}) : null;
  const clusters=s=>SEG?[...SEG.segment(s)].map(x=>x.segment):Array.from(s);
  const reverse=s=>clusters(String(s)).reverse().join("");
  const glyphs=Object.freeze({E:"Ǝ",Y:"⅄",I:"I",e:"ǝ",y:"ʎ",i:"ᴉ",H:"H"});
  const upsideDown=s=>clusters(String(s)).reverse().map(c=>glyphs[c]||c).join("");
  const aliases=[
    {person:"Genghis Khan", variants:["Genghis Khan","Chinggis Khan","Činggis Khan","Temujin","Temüjin","Jenghiz Khan"],type:"historical spelling"},
    {person:"Genghis Khan",variants:["ghensis Chon"],type:"author phonetic association; not attested"},
    {person:"Confucius",variants:["Confucius","Kongzi","Kong Fuzi","Kong Qiu","孔子","孔丘"],type:"historical spelling"},
    {person:"Confucius",variants:["confucious"],type:"author spelling; not attested"}
  ];
  function matchesTerm(source,term){
    const s=String(source).toLocaleLowerCase(), t=term.toLocaleLowerCase();
    let pos=-1;
    while((pos=s.indexOf(t,pos+1))!==-1){
      const before=pos?Array.from(s.slice(0,pos)).pop():null;
      const after=pos+t.length<s.length?Array.from(s.slice(pos+t.length))[0]:null;
      const letter=/[\p{L}\p{M}\p{N}]/u;
      if((!before||!letter.test(before))&&(!after||!letter.test(after)))return true;
    }
    return false;
  }
  const words=s=>s.match(/[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}\p{N}]+)*/gu)||[];
  function scan(text){
    if(typeof text!=="string")throw new TypeError("Text input required");
    if(new TextEncoder().encode(text).length>512000)throw new RangeError("512 KB owner-input limit");
    const tokens=words(text);
    const lines=text.split(/\r?\n/u).map(s=>s.trim()).filter(Boolean);
    const palindrome=[...new Set(tokens.filter(w=>clusters(w).length>=3&&w.toLocaleLowerCase()===reverse(w).toLocaleLowerCase()))];
    const nameHits=aliases.flatMap(group=>group.variants.filter(v=>matchesTerm(text,v))
      .map(variant=>({person:group.person,variant,classification:group.type})));
    return Object.freeze({
      schema:"nathan-ai.i.ghg.eye-scan.v1",
      original:text,
      forward:text,
      reverseCharacters:reverse(text),
      upsideDownTypography:upsideDown(text),
      reverseWords:tokens.slice().reverse().join(" "),
      wordInitials:tokens.map(w=>clusters(w)[0]).join(""),
      lineAcrostic:lines.map(l=>clusters(l)[0]).join(""),
      palindromes:palindrome,
      terms:["EYE","EYES","I","GHG","THC","CHT","CPT","HERE","THERE","EVERYWHERE","SOUL"].filter(t=>matchesTerm(text,t)),
      nameHits,
      creatorMapping:{from:"EYE",to:"GHG",classification:"author-defined inverted reading, not ordinary 180° glyph rotation"},
      status:"Source-preserving literal/phonetic/symbolic comparison, NOT OCR or history verification"
    });
  }
  return Object.freeze({reverse,upsideDown,matchesTerm,scan});
});