import { check, define, int, num, str, sum, vec } from "../../../shared/core.ts";
function escape(x:string){return x.replace(/[<>&"']/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&#39;"}[c]!));}
function stamp(ms:number, separator:string) {const n=int(ms,0,360000000),seconds=Math.floor(n/1000);return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(x=>String(x).padStart(2,"0")).join(":")+separator+String(n%1000).padStart(3,"0");}
export const modules={
 "233": define("HLS manifest from supplied segments",{segments:[{name:"clip001.ts",duration:6},{name:"clip002.ts",duration:5.2}]},p=>{
  check(Array.isArray(p.segments)&&p.segments.length>=1&&p.segments.length<=80,"Expected 1–80 segment descriptions");
  const list=p.segments.map(s=>{const name=str(s.name,128);check(/^[\w.-]+\.(?:ts|m4s)$/.test(name),"Expected a local segment name");return {name,duration:num(s.duration,.001,120)};});
  return "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:"+Math.ceil(Math.max(...list.map(s=>s.duration)))+"\n#EXT-X-PLAYLIST-TYPE:VOD\n"+list.map(s=>"#EXTINF:"+s.duration+",\n"+s.name).join("\n")+"\n#EXT-X-ENDLIST\n";
 }),
 "234": define("PCM RMS and peak report",{pcm:[0,.2,-.3,.9]},p=>{const x=vec(p.pcm).map(v=>num(v,-1,1));return {peak:Math.max(...x.map(Math.abs)),rms:Math.sqrt(sum(x.map(v=>v*v))/x.length)};}),
 "235": define("Amplitude-threshold silence trimming",{pcm:[0,0,.3,.4,0],threshold:.01},p=>{const x=vec(p.pcm),t=num(p.threshold,0,1);let start=x.findIndex(a=>Math.abs(a)>t);if(start<0)return {start:0,end:0,pcm:[]};let end=x.length;while(end>start&&Math.abs(x[end-1])<=t)end--;return {start,end,pcm:x.slice(start,end)};}),
 "236": define("WebVTT or SRT subtitle formatting",{format:"vtt",cues:[{text:"Hello",start:0,end:1500}]},p=>{
  const srt=p.format==="srt";check(srt||p.format==="vtt","Expected vtt or srt");check(Array.isArray(p.cues)&&p.cues.length<=100,"Expected cues");const split=srt?",":".";
  return (srt?"":"WEBVTT\n\n")+p.cues.map((cue,i)=>{check(typeof cue.end==="number"&&typeof cue.start==="number"&&cue.end>cue.start,"Cue end must follow its start");return (srt?i+1+"\n":"")+stamp(cue.start,split)+" --> "+stamp(cue.end,split)+"\n"+escape(str(cue.text,512)).replaceAll("-->","→");}).join("\n\n")+"\n";
 }),
 "238": define("SVG share card renderer",{title:"Library of Tabor",subtitle:"Digital Edge 101"},p=>'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="100%" height="100%" fill="#112442"/><text x="80" y="310" fill="#fff" font-size="58">'+escape(str(p.title,60))+'</text><text x="80" y="405" fill="#a3dee2" font-size="36">'+escape(str(p.subtitle,100))+"</text></svg>"),
 "240": define("Formula arithmetic and aggregate evaluator",{operator:"SUM",values:[2,4,6]},p=>{const v=vec(p.values);switch(p.operator){case "SUM":return sum(v);case "AVERAGE":return sum(v)/v.length;case "MIN":return Math.min(...v);case "MAX":return Math.max(...v);case "COUNT":return v.length;default:check(false,"Unknown aggregate");}}),
 "241": define("WCAG color contrast ratio",{foreground:"#ffffff",background:"#112442"},p=>{
  const luminance=(x:unknown)=>{const hex=str(x,7);check(/^#[0-9a-f]{6}$/i.test(hex),"Expected six-digit RGB hex");const values=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return values[0]*.2126+values[1]*.7152+values[2]*.0722;};
  const a=luminance(p.foreground),b=luminance(p.background),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);return {ratio,aaNormal:ratio>=4.5,aaaNormal:ratio>=7};
 }),
 "244": define("glTF asset structure inspection",{asset:{version:"2.0"},meshes:[{primitives:[{attributes:{POSITION:0}}]}]},p=>{
  check(p.asset&&typeof p.asset==="object"&&(p.asset as Record<string,unknown>).version==="2.0","Expected glTF 2.0 asset");check(Array.isArray(p.meshes)&&p.meshes.length<=80,"Expected meshes");
  return {meshes:p.meshes.length,primitives:sum(p.meshes.map(m=>{check(Array.isArray(m.primitives)&&m.primitives.length<=80,"Invalid mesh primitives");return m.primitives.length;})),inspection:"structure"};
 }),
 "245": define("Escaped Markdown section slide preview",{markdown:"# Opening\nHello\n---\n# Next\nMore"},p=>{
  const slides=str(p.markdown).split(/^---\s*$/m);check(slides.length<=32,"Too many slides");return slides.map(s=>{const [first,...rest]=s.trim().split("\n");return "<section><h2>"+escape(first.replace(/^#+\s+/,""))+"</h2><p>"+escape(rest.join("\n"))+"</p></section>";}).join("\n");
 }),
 "246": define("Word-level edit sequence",{before:"the red cat",after:"the blue cat"},p=>{
  const tokens=(x:unknown)=>str(x,1500).trim().split(/\s+/).filter(Boolean),a=tokens(p.before),b=tokens(p.after);
  check(a.length<=120&&b.length<=120,"Up to 120 words per version");const t=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
  for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)t[i][j]=a[i]===b[j]?1+t[i+1][j+1]:Math.max(t[i+1][j],t[i][j+1]);
  const out=[];let i=0,j=0;while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){out.push({op:"keep",word:a[i++]});j++;}else if(j===b.length||i<a.length&&t[i+1][j]>=t[i][j+1])out.push({op:"delete",word:a[i++]});else out.push({op:"insert",word:b[j++]});}return out;
 }),
 "247": define("ISBN ISBN-10 and ISBN-13 check-digit validator",{isbn:"9780306406157"},p=>{const s=str(p.isbn,32).replace(/[ -]/g,"").toUpperCase();const digits=[...s];return {normalized:s,valid:/^\d{9}[\dX]$/.test(s)?sum(digits.map((c,i)=>(c==="X"?10:Number(c))*(10-i)))%11===0:/^\d{13}$/.test(s)&&sum(digits.map((c,i)=>Number(c)*(i%2?3:1)))%10===0};})
};
