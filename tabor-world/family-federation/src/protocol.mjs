export const lockMoves=Object.freeze(["insert","right","right","left","left","left","left"]);
export const binary=lockMoves.map(move=>move==="left"?"0":"1").join("");
export const roles=Object.freeze(["build","verify","relay"]);

function evaluateLock(moves,sequence) {
  let progress=0;
  for (const move of moves) {
    if(progress===sequence.length)break;
    if(move===sequence[progress])progress++;
    else progress=move==="insert"?1:0;
  }
  const rotation=Math.max(0,Math.min(2,progress-1))*360-Math.max(0,progress-3)*360;
  return {progress,rotation,inserted:progress>0,open:progress===sequence.length,next:sequence[progress]??null};
}

export const lockState=moves=>evaluateLock(moves,lockMoves);
export function protocolClient(){
  return "const sequence="+JSON.stringify(lockMoves)+";\nconst evaluate=("+evaluateLock.toString()+");\nexport const lockState=(moves)=>evaluate(moves,sequence);\n";
}

export function pack(summary,digest) {
  if(!/^[0-9a-f]{64}$/.test(digest))throw RangeError("Invalid roster digest.");
  const buffer=new Uint8Array(52),view=new DataView(buffer.buffer);
  buffer.set([0x54,0x46,0x45,0x44,1,binary.length,parseInt(binary.padEnd(8,"0"),2),roles.length]);
  const counts=[summary.github,summary.cloudflare,summary.parent_count];
  counts.forEach((value,index)=>{
    if(!Number.isInteger(value)||value<0||value>0xffffffff)throw RangeError("Invalid roster count.");
    view.setUint32(8+index*4,value,false);
  });
  buffer.set(Uint8Array.from(digest.match(/../g),hex=>parseInt(hex,16)),20);
  return buffer;
}
