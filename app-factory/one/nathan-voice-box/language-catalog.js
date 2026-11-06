"use strict";
(() => {
  const $=id=>document.getElementById(id), store=window.NathanVoiceStore;
  const TAG=/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/;
  const starter=[
    ["en","English"],["en-US","English — United States"],["en-GB","English — United Kingdom"],
    ["en-AU","English — Australia"],["en-IN","English — India"],
    ["es","Spanish"],["es-ES","Spanish — Spain"],["es-MX","Spanish — Mexico"],
    ["es-AR","Spanish — Argentina"],["es-CO","Spanish — Colombia"],
    ["pt","Portuguese"],["pt-BR","Portuguese — Brazil"],["pt-PT","Portuguese — Portugal"],
    ["fr","French"],["fr-CA","French — Canada"],["de","German"],["it","Italian"],
    ["nl","Dutch"],["af","Afrikaans"],["sw","Swahili"],["zu","Zulu"],["xh","Xhosa"],
    ["am","Amharic"],["om","Oromo"],["so","Somali"],["yo","Yoruba"],["ig","Igbo"],
    ["ha","Hausa"],["ar","Arabic"],["ar-EG","Arabic — Egypt"],["ar-SA","Arabic — Saudi Arabia"],
    ["ar-MA","Arabic — Morocco"],["he","Hebrew"],["fa","Persian"],["ur","Urdu"],
    ["hi","Hindi"],["bn","Bengali"],["pa","Punjabi"],["gu","Gujarati"],["mr","Marathi"],
    ["ta","Tamil"],["te","Telugu"],["kn","Kannada"],["ml","Malayalam"],["si","Sinhala"],
    ["ne","Nepali"],["sa","Sanskrit"],["tr","Turkish"],["az","Azerbaijani"],["kk","Kazakh"],
    ["uz","Uzbek"],["ru","Russian"],["uk","Ukrainian"],["pl","Polish"],["cs","Czech"],
    ["sk","Slovak"],["hu","Hungarian"],["ro","Romanian"],["bg","Bulgarian"],["el","Greek"],
    ["sr","Serbian"],["hr","Croatian"],["bs","Bosnian"],["sq","Albanian"],["hy","Armenian"],
    ["ka","Georgian"],["zh","Chinese"],["zh-Hans","Chinese — Simplified script"],
    ["zh-Hant","Chinese — Traditional script"],["zh-CN","Chinese — Mainland China"],
    ["zh-TW","Chinese — Taiwan"],["yue","Cantonese"],["nan","Min Nan"],
    ["ja","Japanese"],["ko","Korean"],["th","Thai"],["vi","Vietnamese"],["lo","Lao"],
    ["km","Khmer"],["my","Burmese"],["id","Indonesian"],["ms","Malay"],["tl","Tagalog"],
    ["fil","Filipino"],["jv","Javanese"],["su","Sundanese"],["mi","Māori"],
    ["sm","Samoan"],["haw","Hawaiian"],["fj","Fijian"],["mg","Malagasy"],
    ["ga","Irish"],["gd","Scottish Gaelic"],["cy","Welsh"],["br","Breton"],
    ["eu","Basque"],["ca","Catalan"],["gl","Galician"],["is","Icelandic"],
    ["sv","Swedish"],["no","Norwegian"],["da","Danish"],["fi","Finnish"],["et","Estonian"],
    ["lv","Latvian"],["lt","Lithuanian"],["mt","Maltese"],["la","Latin"],
    ["grc","Ancient Greek (historical)"],["arc","Imperial Aramaic (historical)"],
    ["cop","Coptic (historical)"],["egy","Ancient Egyptian (historical)"],["got","Gothic (historical)"]
  ].map(([tag,name])=>({id:tag.toLowerCase(),tag,name,source:"starter"}));
  let entries=starter, installed=[];
  const norm=s=>String(s||"").toLocaleLowerCase();
  const codebase=tag=>norm(tag).split("-")[0];
  function support(tag){
    const full=norm(tag),base=codebase(tag);
    if(installed.some(v=>norm(v.language)===full))return "LOCAL SYNTHESIS";
    if(installed.some(v=>codebase(v.language)===base))return "RELATED VOICE INSTALLED";
    return "CATALOG ONLY";
  }
  function allEntries(){
    const m=new Map(starter.map(x=>[norm(x.tag),x]));
    for(const x of entries) m.set(norm(x.tag),x);
    return [...m.values()];
  }
  function draw(){
    const q=norm($("language-search").value.trim());
    const results=$("language-results");results.replaceChildren();
    const filtered=allEntries().filter(x=>!q||
      norm(x.name).includes(q)||norm(x.tag).includes(q)||norm(x.dialect).includes(q)).slice(0,250);
    for(const item of filtered){
      const opt=document.createElement("option");
      opt.value=item.tag;
      opt.textContent=item.name+" ["+item.tag+"] · "+support(item.tag);
      results.append(opt);
    }
    $("language-count").textContent=
      allEntries().length.toLocaleString()+" catalog records · "+
      installed.length+" installed voice identifiers · "+
      filtered.length+" displayed. Catalog metadata does not mean speech synthesis exists.";
  }
  async function init(){
    try {
      const saved=await Promise.all([store.all("languages"),store.get("registry","iso6393")]);
      entries=[...starter,...saved[0],...(saved[1]?.entries||[])];
    }catch(e){$("language-count").textContent="Local catalog storage unavailable: "+e.message;}
    draw();
  }
  $("language-search").addEventListener("input",draw);
  $("language-results").addEventListener("change",()=>{
    const tag=$("language-results").value;
    $("lang").value=tag;
    const matched=installed.find(v=>norm(v.language)===norm(tag));
    if(matched){$("voice").value=matched.name;}
    $("language-choice").textContent="Selected "+tag+" — "+support(tag)+
      ". For native dialect speech, install a matching licensed local model.";
  });
  $("add-language").addEventListener("click",async()=>{
    const tag=$("new-language-tag").value.trim(),name=$("new-language-name").value.trim();
    const dialect=$("new-dialect-name").value.trim();
    if(!TAG.test(tag)||name.length<2||name.length>120||dialect.length>120){
      $("language-choice").textContent="Use a valid language tag, a name and an optional dialect label (up to 120 characters).";return;
    }
    const item={id:tag.toLowerCase(),tag,name,dialect,source:"local-user"};
    try{await store.put("languages",item);entries.push(item);draw();$("language-choice").textContent="Saved local catalog entry: "+name+". No synthesis model was created.";}
    catch(e){$("language-choice").textContent="Unable to save language: "+e.message;}
  });
  $("language-import").addEventListener("change",async event=>{
    const file=event.target.files?.[0];
    if(!file)return;
    if(file.size>4*1024*1024){$("language-choice").textContent="Registry is over the local 4 MB import limit.";return;}
    try{
      // ISO 639-3 reference table from iso639-3.sil.org, not a speech-training dataset.
      const input=await file.text(), lines=input.split(/\r?\n/);
      if(!lines[0]?.startsWith("Id\t"))throw Error("Expected ISO 639-3 tab-separated columns beginning with Id");
      const records=[];
      for(const line of lines.slice(1)){
        const parts=line.split("\t");
        if(parts.length<7)continue;
        const code=parts[0],name=parts[6];
        if(/^[a-z]{3}$/.test(code)&&name&&name.length<=120){
          records.push({id:code,tag:code,name,source:"ISO-639-3 imported",type:parts[5]});
        }
      }
      if(records.length<100)throw Error("Not a complete language code table");
      await store.put("registry",{id:"iso6393",entries:records,importedAt:new Date().toISOString()});
      const saved=await store.all("languages");
      entries=[...starter,...saved,...records];draw();
      $("language-choice").textContent="Imported "+records.length+" language records locally. Models are still installed separately.";
    }catch(e){$("language-choice").textContent="Import failed: "+e.message;}
    finally{event.target.value="";}
  });
  document.addEventListener("voicebox:voices",event=>{
    installed=event.detail||[];draw();
  });
  init();
})();
