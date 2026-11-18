const error = message => { throw new RangeError(message); };
const integer = (n, min, max) => Number.isSafeInteger(n) && n >= min && n <= max;
const number = (x, min, max) => Number.isFinite(x) && x >= min && x <= max;
const optional = (x, fallback) => x === undefined ? fallback : x;
const tick = /^-?\d{1,30}$/;

function ledger({transactions}) {
  if (!Array.isArray(transactions) || !transactions.length || transactions.length > 100) error("Supply 1–100 transactions");
  const accounts = new Map();
  let postings = 0;
  for (const [index, transaction] of transactions.entries()) {
    if (!Array.isArray(transaction) || transaction.length < 2 || transaction.length > 100) error("Supply 2–100 postings per transaction");
    let total = 0n;
    for (const posting of transaction) {
      if (!posting || typeof posting.account !== "string" || !posting.account.trim() || posting.account.length > 80 ||
          typeof posting.amountMinor !== "string" || !tick.test(posting.amountMinor) || BigInt(posting.amountMinor) <= 0n ||
          !["debit","credit"].includes(posting.side)) error("Each posting needs account, side, and a positive amountMinor string");
      const amount = BigInt(posting.amountMinor) * (posting.side === "debit" ? 1n : -1n);
      total += amount;
      accounts.set(posting.account, (accounts.get(posting.account) ?? 0n) + amount);
      postings++;
    }
    if (total !== 0n) return { balanced:false, transaction:index + 1, netMinor:String(total) };
  }
  return { balanced:true, transactions:transactions.length, postings, accounts:[...accounts].map(([account, amount]) => ({
    account, netDebitMinor:String(amount),
  })) };
}

function stateMachine({initial, transitions, moves}) {
  const text = item => typeof item === "string" && item.length > 0 && item.length <= 80;
  if (!text(initial) || !Array.isArray(transitions) || transitions.length > 500 ||
      !Array.isArray(moves) || moves.length > 500 || !moves.every(text)) error("Supply an initial state, transitions, and moves");
  const states = new Map();
  for (const t of transitions) {
    if (!t || ![t.from,t.move,t.to].every(text)) error("Each transition needs from, move, and to");
    const options = states.get(t.from) ?? new Map();
    if (options.has(t.move)) error("A state may define each move only once");
    options.set(t.move, t.to);
    states.set(t.from, options);
  }
  let state = initial;
  const visited = [initial];
  for (const [index, move] of moves.entries()) {
    const next = states.get(state)?.get(move);
    if (next === undefined) return { valid:false, at:index + 1, move, state, visited };
    state = next;
    visited.push(state);
  }
  return { valid:true, state, visited };
}

function auditIntervals({start, end, step, samples}) {
  if (!integer(start,0,1e14) || !integer(end,start,1e14) || !integer(step,1,1e14) ||
      (end - start) % step || (end - start) / step > 2000 || !Array.isArray(samples) ||
      samples.length > 4000 || !samples.every(n => integer(n,0,1e14))) {
    error("Supply aligned nonnegative integer range boundaries, a positive step, and up to 4,000 samples");
  }
  const seen = new Set(), duplicates = new Set(), outside = new Set(), offGrid = new Set();
  for (const value of samples) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
    if (value < start || value > end) outside.add(value);
    else if ((value - start) % step) offGrid.add(value);
  }
  const missing = [];
  for (let value = start; value <= end; value += step) if (!seen.has(value)) missing.push(value);
  return { expected:(end-start)/step+1, missing, duplicates:[...duplicates], outside:[...outside], offGrid:[...offGrid] };
}

function simulate({seed, trials, probability}) {
  if (!integer(seed,0,0xffffffff) || !integer(trials,1,100000) || !number(probability,0,1)) {
    error("Supply a uint32 seed, 1–100,000 trials, and probability between zero and one");
  }
  let state = seed, wins = 0;
  for (let i = 0; i < trials; i++) {
    state = (state + 0x6D2B79F5) | 0;
    let value = Math.imul(state ^ state >>> 15, state | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    if (((value ^ value >>> 14) >>> 0) / 4294967296 < probability) wins++;
  }
  return { algorithm:"Mulberry32", seed, trials, probability, successes:wins, observed:wins/trials };
}

// Exact minimum cover of the selected truth rows, for up to four variables.
function truthTable({variables, ones}) {
  if (!Array.isArray(variables) || !integer(variables.length,1,4) ||
      !variables.every(s => typeof s === "string" && /^[A-Za-z][A-Za-z0-9_]{0,15}$/.test(s)) ||
      new Set(variables).size !== variables.length || !Array.isArray(ones) ||
      ones.length > 16 || !ones.every(i => integer(i,0,(1 << variables.length)-1))) error("Supply 1–4 variable names and true row indices");
  const rowCount = 1 << variables.length;
  const target = ones.reduce((mask,row) => mask | (1 << row),0);
  const covers = new Map();
  for (let fixed = 0; fixed < rowCount; fixed++) {
    for (let value = 0; value < rowCount; value++) {
      if (value & ~fixed) continue;
      let mask = 0;
      for (let row = 0; row < rowCount; row++) if ((row & fixed) === value) mask |= 1 << row;
      if (mask & ~target) continue;
      const terms = variables.flatMap((name,index) => {
        const bit = 1 << (variables.length-1-index);
        return fixed & bit ? [(value & bit ? "" : "!") + name] : [];
      });
      covers.set(mask, terms);
    }
  }
  const memo = new Map([[0,{cost:0,terms:[]}]]);
  function minCover(remaining) {
    if (memo.has(remaining)) return memo.get(remaining);
    let best;
    const required = remaining & -remaining;
    for (const [mask, term] of covers) {
      if (!(mask & required)) continue;
      const rest = minCover(remaining & ~mask);
      const cost = rest.cost + 100 + term.length;
      if (!best || cost < best.cost) best = {cost, terms:[term,...rest.terms]};
    }
    memo.set(remaining,best);
    return best;
  }
  const {terms} = minCover(target);
  return {variables, trueRows:[...new Set(ones)].sort((a,b)=>a-b), terms,
    expression:terms.map(term => term.join(" & ") || "1").join(" | ") || "0"};
}

function wav({frequencies, sampleRate, durationMs}) {
  sampleRate = optional(sampleRate,16000);
  durationMs = optional(durationMs,250);
  if (!integer(sampleRate,8000,48000) || !integer(durationMs,10,1000) ||
      !Array.isArray(frequencies) || !integer(frequencies.length,1,8) ||
      !frequencies.every(f => number(f,1,sampleRate*0.49))) error("Supply 1–8 frequencies below Nyquist and a duration of 10–1000 ms");
  const samples = Math.round(sampleRate*durationMs/1000);
  const buffer = new ArrayBuffer(44 + samples*2), bytes = new Uint8Array(buffer), pcm = new DataView(buffer);
  for (const [offset,tag] of [[0,"RIFF"],[8,"WAVEfmt "],[36,"data"]]) {
    bytes.set(new TextEncoder().encode(tag),offset);
  }
  pcm.setUint32(4,36+samples*2,true);
  pcm.setUint32(16,16,true);
  pcm.setUint16(20,1,true);
  pcm.setUint16(22,1,true);
  pcm.setUint32(24,sampleRate,true);
  pcm.setUint32(28,sampleRate*2,true);
  pcm.setUint16(32,2,true);
  pcm.setUint16(34,16,true);
  pcm.setUint32(40,samples*2,true);
  for (let i=0;i<samples;i++) {
    const gain = Math.min(1,i/80,(samples-1-i)/80)*0.78;
    const amplitude = frequencies.reduce((sum,f)=>sum+Math.sin(2*Math.PI*f*i/sampleRate),0)/frequencies.length;
    pcm.setInt16(44+2*i,Math.round(32767*gain*amplitude),true);
  }
  return new Response(buffer,{headers:{"content-type":"audio/wav","content-disposition":'attachment; filename="tabor-tone.wav"'}});
}

function spectrum({samples,sampleRate}) {
  if (!Array.isArray(samples) || !integer(samples.length,8,4096) ||
      (samples.length & (samples.length-1)) || !samples.every(n=>number(n,-1e6,1e6)) ||
      !number(sampleRate,1,384000)) error("Supply 8–4096 samples with a power-of-two length and a positive sample rate");
  const n=samples.length, real=new Float64Array(samples), imag=new Float64Array(n);
  for (let i=1,j=0;i<n;i++) {
    let bit=n>>1;
    for (;j&bit;bit>>=1) j^=bit;
    j^=bit;
    if (i<j) [real[i],real[j]]=[real[j],real[i]];
  }
  for (let size=2;size<=n;size*=2) {
    const half=size/2;
    for (let k=0;k<half;k++) {
      const angle=-2*Math.PI*k/size, wr=Math.cos(angle), wi=Math.sin(angle);
      for (let base=k;base<n;base+=size) {
        const other=base+half, r=real[other]*wr-imag[other]*wi, i=real[other]*wi+imag[other]*wr;
        real[other]=real[base]-r;
        imag[other]=imag[base]-i;
        real[base]+=r;
        imag[base]+=i;
      }
    }
  }
  return {sampleRate,binWidthHz:sampleRate/n, bins:Array.from({length:n/2+1},(_,i)=>({
    hz:i*sampleRate/n, magnitude:Math.hypot(real[i],imag[i])*(i===0||i===n/2?1:2)/n,
  })) };
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const codes = ".- -... -.-. -.. . ..-. --. .... .. .--- -.- .-.. -- -. --- .--. --.- .-. ... - ..- ...- .-- -..- -.-- --.. ----- .---- ..--- ...-- ....- ..... -.... --... ---.. ----.".split(" ");
const toMorse = new Map([...alphabet].map((letter,index)=>[letter,codes[index]]));
const fromMorse = new Map(codes.map((code,index)=>[code,alphabet[index]]));

function morse({text,code,unitMs}) {
  unitMs=optional(unitMs,80);
  if (!integer(unitMs,20,1000) || (typeof text==="string") === (typeof code==="string")) error("Supply one of text or code and an optional unit duration");
  let words;
  if (typeof text==="string") {
    if (!/^[A-Za-z0-9 ]{1,160}$/.test(text) || !text.trim()) error("Use letters, digits, and spaces");
    words=text.toUpperCase().trim().split(/ +/).map(word=>[...word].map(letter=>toMorse.get(letter)));
  } else {
    if (!/^[ .\-/]{1,1024}$/.test(code)) error("Use dots, dashes, spaces, and slashes between words");
    words=code.trim().split(/\s*\/\s*/).map(word=>word.split(/ +/));
    if (words.some(word=>word.some(letter=>!fromMorse.has(letter)))) error("Unknown Morse character");
  }
  const timing=[];
  words.forEach((word,wordIndex)=>{
    if (wordIndex) timing.push(-7*unitMs);
    word.forEach((letter,index)=>{
      if (index) timing.push(-3*unitMs);
      [...letter].forEach((symbol,pulse)=>{
        if (pulse) timing.push(-unitMs);
        timing.push(symbol==="."?unitMs:3*unitMs);
      });
    });
  });
  return {text:words.map(word=>word.map(letter=>fromMorse.get(letter)).join("")).join(" "),
    code:words.map(word=>word.join(" ")).join(" / "), unitMs, timing};
}

function resonance({model,length,waveSpeed,tension,linearDensity,harmonics}) {
  harmonics=optional(harmonics,5);
  if (!integer(harmonics,1,24) || !number(length,1e-6,1e7)) error("Supply a length in meters and 1–24 harmonics");
  let first, stride=1;
  if (model==="string" && number(tension,1e-6,1e9) && number(linearDensity,1e-9,1e6)) first=Math.sqrt(tension/linearDensity)/(2*length);
  if (model==="open-pipe" && number(waveSpeed,1e-3,1e9)) first=waveSpeed/(2*length);
  if (model==="closed-pipe" && number(waveSpeed,1e-3,1e9)) { first=waveSpeed/(4*length); stride=2; }
  if (!first) error("Select string with tension and linear density or a pipe with wave speed");
  return {model, fundamentalHz:first, harmonicsHz:Array.from({length:harmonics},(_,i)=>first*(1+i*stride))};
}

function color({hex}) {
  if (typeof hex!=="string" || !/^#[0-9a-f]{6}$/i.test(hex)) error("Supply a six-digit HEX color prefixed with #");
  const values=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)), rgb=values.map(x=>x/255);
  const [r,g,b]=rgb, max=Math.max(...rgb), min=Math.min(...rgb), diff=max-min, lightness=(max+min)/2;
  const hue=!diff?0:max===r?60*((g-b)/diff%6):max===g?60*((b-r)/diff+2):60*((r-g)/diff+4);
  const linear=rgb.map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
  const dot=(coefficients)=>coefficients.reduce((sum,c,i)=>sum+c*linear[i],0);
  const xyz=[dot([.4124564,.3575761,.1804375]),dot([.2126729,.7151522,.0721750]),dot([.0193339,.1191920,.9503041])];
  const transform=x=>x>216/24389?Math.cbrt(x):((24389/27*x)+16)/116;
  const [fx,fy,fz]=xyz.map((x,i)=>transform(x/[.95047,1,1.08883][i]));
  const lms=[
    dot([.4122214708,.5363325363,.0514459929]),dot([.2119034982,.6806995451,.1073969566]),dot([.0883024619,.2817188376,.6299787005]),
  ].map(Math.cbrt);
  const [ll,mm,ss]=lms;
  const a=1.9779984951*ll-2.4285922050*mm+.4505937099*ss;
  const ob=.0259040371*ll+.7827717662*mm-.8086757660*ss;
  const c=Math.hypot(a,ob);
  return {hex:hex.toUpperCase(), rgb:values,
    hsl:[(hue+360)%360,diff?diff/(1-Math.abs(2*lightness-1))*100:0,lightness*100],
    labD65:[116*fy-16,500*(fx-fy),200*(fy-fz)],
    oklch:[.2104542553*ll+.7936177850*mm-.0040720468*ss,c,c<1e-7?0:(Math.atan2(ob,a)*180/Math.PI+360)%360]};
}

function editScript({original,edited}) {
  if (typeof original!=="string" || typeof edited!=="string" || original.length>1024 || edited.length>1024) error("Supply two texts up to 1,024 UTF-16 units each");
  const a=[...original],b=[...edited], width=b.length+1;
  const dp=new Uint16Array((a.length+1)*width);
  for (let i=a.length-1;i>=0;i--) for (let j=b.length-1;j>=0;j--) {
    dp[i*width+j]=a[i]===b[j]?dp[(i+1)*width+j+1]+1:Math.max(dp[(i+1)*width+j],dp[i*width+j+1]);
  }
  const edits=[];
  function emit(operation,char) {
    if (edits.at(-1)?.operation===operation) edits.at(-1).text+=char;
    else edits.push({operation,text:char});
  }
  let i=0,j=0;
  while (i<a.length || j<b.length) {
    if (i<a.length && j<b.length && a[i]===b[j]) { emit("equal",a[i++]); j++; }
    else if (j===b.length || (i<a.length && dp[(i+1)*width+j]>=dp[i*width+j+1])) emit("delete",a[i++]);
    else emit("insert",b[j++]);
  }
  return {identical:original===edited, indexing:"Unicode code points", edits};
}

export const engines = new Map([
  [420,{method:"POST",run:ledger,example:{transactions:[[{account:"Cash",side:"debit",amountMinor:"1250"},{account:"Equity",side:"credit",amountMinor:"1250"}]]}}],
  [422,{method:"POST",run:stateMachine,example:{initial:"start",transitions:[{from:"start",move:"go",to:"finish"}],moves:["go"]}}],
  [425,{method:"POST",run:auditIntervals,example:{start:0,end:40,step:10,samples:[0,10,30,30,40]}}],
  [426,{method:"POST",run:simulate,example:{seed:1973,trials:10000,probability:.5}}],
  [431,{method:"POST",run:truthTable,example:{variables:["A","B","C"],ones:[1,3,5,7]}}],
  [435,{method:"POST",run:wav,example:{frequencies:[440,660],durationMs:200}}],
  [436,{method:"POST",run:spectrum,example:{samples:[0,1,0,-1,0,1,0,-1],sampleRate:8000}}],
  [445,{method:"POST",run:morse,example:{text:"TABOR"}}],
  [447,{method:"POST",run:resonance,example:{model:"closed-pipe",length:1,waveSpeed:343}}],
  [448,{method:"POST",run:color,example:{hex:"#8BBAA6"}}],
  [450,{method:"POST",run:editScript,example:{original:"Tabor",edited:"Taber"}}],
]);
