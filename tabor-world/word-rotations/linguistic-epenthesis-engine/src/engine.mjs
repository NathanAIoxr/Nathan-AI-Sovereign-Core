// NATHAN AI Linguistic Epenthesis Engine — deterministic text transformation, not HTTP routing.
export const MATRIX={
  "W_axis": {
    "orientation": "upright",
    "nodes": [
      "Will",
      "Wheel",
      "Way"
    ],
    "theme": "Forward motion, drive, and direction"
  },
  "M_axis": {
    "orientation": "inverted",
    "nodes": [
      "Mill",
      "Mheel",
      "May"
    ],
    "theme": "Harvest, humor, and permission"
  },
  "3_axis": {
    "orientation": "rotated_90",
    "nodes": [
      "3ill",
      "3heel",
      "3ay"
    ],
    "theme": "Triad measurement, stance, and greeting"
  },
  "chevron_axis": {
    "orientation": "stacked_left_shift",
    "nodes": [
      "<<ill",
      "<<heel",
      "<<ay"
    ],
    "theme": "Origin tracing, pivoting, and signal return"
  }
};
export const RULES={
  "intrusive_r": {
    "branch": "Phonetics & Phonology",
    "mechanism": "Intervocalic hiatus resolution (/ə/, /ɑː/, /ɔː/ + Vowel -> insert /ɹ/)",
    "function": "Zero wasted motion; bridges open vowel collisions across boundaries"
  },
  "paragogic_s": {
    "branch": "Morphology",
    "mechanism": "Analogical leveling & paragoge (attach uniform -s suffix)",
    "function": "Complete grammatical order; removes irregular exceptions across nodes"
  }
};
export const LOW_OPEN_ENDINGS=["a","ah","aw","ay","uh","o"];
export const VOWEL_STARTS=["a","e","i","o","u"];
export function applyIntrusiveR(firstWord,secondWord){
 const w1=String(firstWord).trim(),w2=String(secondWord).trim();
 if(!w1||!w2)return [w1,w2].filter(Boolean).join(" ");
 return LOW_OPEN_ENDINGS.some(s=>w1.toLowerCase().endsWith(s))&&VOWEL_STARTS.some(v=>w2.toLowerCase().startsWith(v))?`${w1}-r-${w2}`:`${w1} ${w2}`;
}
export function applyParagogicS(word){const w=String(word).trim();return w&&!w.toLowerCase().endsWith("s")?w+"s":w;}
export function processNode(axis,index,nextToken="is"){
 const data=MATRIX[axis];if(!data)return {error:"Unknown axis",allowed_axes:Object.keys(MATRIX)};
 if(!Number.isInteger(index)||index<0||index>=data.nodes.length)return {error:"Node index out of range"};
 const raw=data.nodes[index];return {agent:{"W_axis":"Agent-W","M_axis":"Agent-M","3_axis":"Agent-3","chevron_axis":"Agent-Chevron"}[axis],axis,orientation:data.orientation,raw_node:raw,paragogic_s_node:applyParagogicS(raw),intrusive_r_bridge:applyIntrusiveR(raw,nextToken),theme:data.theme,status:"locked_and_ready"};
}
export function processAxis(axis,nextToken="is"){
 const data=MATRIX[axis];if(!data)return {error:"Unknown axis",allowed_axes:Object.keys(MATRIX)};
 return {axis,orientation:data.orientation,theme:data.theme,nodes:data.nodes.map((_,i)=>processNode(axis,i,nextToken))};
}
