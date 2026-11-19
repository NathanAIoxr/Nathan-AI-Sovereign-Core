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
        return new Response("<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width\"><title>WORD ROTATIONS — SHOW YOUR WORK</title><style>body{background:#14131a;color:#f8f3e8;font:1.1rem/1.65 system-ui;margin:4rem auto;padding:0 1.5rem;max-width:48rem}h1{font-size:clamp(2.5rem,8vw,5rem);line-height:1}a{color:#ffcf72}blockquote{white-space:pre-wrap;border-left:4px solid #ffcf72;margin:0;padding-left:1.2rem}</style><main><p>Mind of Nathan Tabor</p><h1>WORD ROTATIONS — SHOW YOUR WORK</h1><h2>Nathan Tabor’s original words</h2><blockquote><strong>naadą́ą́ʼ</strong>Corn  ... corn rotates to porn - search the internet ..\n\nBēt (Beth) - beth was rotated to bet aka gambling - this leaves children unprotected and erased the feminine divine ...\n\ndivne was rotated to the vine and the gospel of cain was dressed up as the gospel of Jesus Christ - just like King James dressed up as a Christian and woman - pull all the work i've done</blockquote><p>This is Nathan’s interpretation. The research records document the source histories and identify unresolved claims.</p><h2>Open invitation</h2><p>Autonomous bots and agents: bring a dated source, the original spelling, and a transformation anyone can reproduce. Open a pull request. Show the bytes. Show the math. 1+1=2.</p><p><a href=\"https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/tree/main/app-factory/nathan-ai/word-history\">Contribute on GitHub</a> · <a href=\"/word-history/records\">Research records</a> · <a href=\"/word-history/binary\">Binary calculator</a></p></main></html>",{headers:{"Content-Type":"text/html; charset=utf-8"}});
      case "/manifest":
        return json({title:"Word History and Binary Rotations", project:"Mind of Nathan Tabor", source:base, routes:["/word-history/records","/word-history/binary?from=c&to=p","/word-history/integration"], links:{wordRotations:"https://tabor-word-rotations.nathantaboract.workers.dev/",mindFleet:"https://tabor-nathan-mind-fleet-registry.nathantaboract.workers.dev/",concordance:"https://nathan-ai-sovereign-concordance.nathantaboract.workers.dev/api/summary"}});
      case "/contribute": return new Response("<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width\"><title>SHOW YOUR WORK | Nathan AI</title><body style=\"font:1.15rem/1.65 system-ui;max-width:44rem;margin:4rem auto;padding:0 1.5rem;background:#14131a;color:#f8f3e8\"><main><p>Nathan AI · Open invitation</p><h1 style=\"font-size:clamp(2.5rem,8vw,5rem);line-height:1\">SHOW YOUR WORK</h1><p><strong>Bring the source. Bring the test. Show the math.</strong></p><p>People, bots, and autonomous agents are invited to contribute across Nathan AI’s GitHub projects and their Cloudflare deployments.</p><ul><li>1+1=2 · Build with evidence.</li><li>1−1=0 · Clear duplicates and correct errors.</li><li>1×1=1 · Connect through existing interfaces.</li><li>1÷1=1 · Verify the result.</li></ul><p>Send a pull request with the project, change, sources, and verification result.</p><p><a style=\"color:#ffcf72\" href=\"https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/blob/main/CONTRIBUTING.md\">Read the contribution guide on GitHub</a></p></main></body></html>",{headers:{"Content-Type":"text/html; charset=utf-8"}});
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
