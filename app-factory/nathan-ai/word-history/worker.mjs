const base = "https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/nathan-ai/word-history";
const records = [
  {id:"corn-porn", original:"naadą́ą́ʼ", mapping:"corn ↔ porn", operation:"First-letter ROT13; ASCII XOR 0x13 for c/p only. Circular bit rotation cannot change the number of set bits.", history:"Naadą́ą́ʼ means corn or maize in Diné Bizaad. Old English corn meant grain. Porn is recorded in 1962 as a shortening of pornography. Modern online usage substitutes the corn emoji for porn.", sources:["https://education.byu.edu/arts/lessons/beauty-beside-me","https://www.etymonline.com/word/corn","https://www.etymonline.com/word/porn","https://eightbyeight.com/glossary/algospeak/"]},
  {id:"beth-bet", original:"𐤁 / Bēt / Beth", mapping:"Bēt → bet", operation:"Remove the macron in bēt or the final h in beth, after lowercasing.", history:"Bet is a documented spelling of the Phoenician letter name associated with house. The English wagering verb appears in the 1590s and has uncertain origins. A historical derivation from the letter name remains unverified.", sources:["https://www.unicode.org/charts/PDF/U10900.pdf","https://www.etymonline.com/word/bet"]},
  {id:"divine-vine", original:"divine", mapping:"divine → vine → the vine", operation:"Delete di; optionally insert the followed by a space.", history:"Divine and vine trace to Latin divinus and vinea respectively. John 15:1 KJV contains the true vine. A historical substitution for the feminine divine remains unverified.", sources:["https://www.etymonline.com/word/divine","https://www.etymonline.com/word/vine","https://www.biblegateway.com/passage/?search=John%2015%3A1&version=KJV"]},
  {id:"cain-kjv", original:"Genesis 4:15 and 1 John 3:12", mapping:"Cain's curse and protection", operation:"Textual comparison.", history:"Genesis depicts Cain receiving protection from being killed. First John uses Cain as a negative example. James commissioned the translation published in 1611. The proposed gospel substitution remains unverified.", sources:["https://www.biblegateway.com/passage/?search=Genesis%204%3A15%3B1%20John%203%3A12&version=KJV","https://www.loc.gov/exhibits/bibles/other-bibles.html"]}
];
const byte = n => n.toString(2).padStart(8,"0");
const json = (body,status=200) => Response.json(body,{status});
export default {
  async fetch(request, env = {}) {
    if (request.method !== "GET") return new Response("Method not allowed",{status:405,headers:{Allow:"GET"}});
    const url = new URL(request.url);
    switch(url.pathname) {
      case "/":
      case "/manifest":
        return json({title:"Word History and Binary Rotations", project:"Mind of Nathan Tabor", source:base, routes:["/records","/binary?from=c&to=p","/integration"], links:{wordRotations:"https://tabor-word-rotations.nathantaboract.workers.dev/",mindFleet:"https://tabor-nathan-mind-fleet-registry.nathantaboract.workers.dev/",concordance:"https://nathan-ai-sovereign-concordance.nathantaboract.workers.dev/api/summary"}});
      case "/records": return json(records);
      case "/health": return json({ok:true,count:records.length});
      case "/integration": {
        const checks = await Promise.all([["mindFleet",env.MIND_FLEET,"/health"],["concordance",env.CONCORDANCE,"/api/summary"]].map(async ([name,service,path]) => {
          if (!service) return [name,{configured:false}];
          try { const response = await service.fetch("https://internal"+path); if (response.body) await response.body.cancel(); return [name,{configured:true,status:response.status}]; }
          catch { return [name,{configured:true,status:null}]; }
        }));
        return json(Object.fromEntries(checks));
      }
      case "/binary": {
        const from=url.searchParams.get("from")??"c", to=url.searchParams.get("to")??"p";
        if (!/^[\x20-\x7e]$/.test(from)||! /^[\x20-\x7e]$/.test(to)) return json({error:"Use one printable ASCII character for each parameter."},400);
        const a=from.charCodeAt(0), b=to.charCodeAt(0), mask=a^b;
        const leftRotations=Array.from({length:8},(_,n)=>n).filter(n=>(((a<<n)|(a>>>(8-n)))&255)===b);
        return json({from,to,fromBits:byte(a),toBits:byte(b),xorBits:byte(mask),flippedBits:byte(mask).split("1").length-1,leftRotations});
      }
      default: return json({error:"Not found"},404);
    }
  }
};
