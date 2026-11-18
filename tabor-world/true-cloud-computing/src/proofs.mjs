export function canonical(value) {
  if (Array.isArray(value)) return "["+value.map(canonical).join(",")+"]";
  if (value!==null && typeof value==="object") {
    return "{"+Object.keys(value).sort().map(key=>JSON.stringify(key)+":"+canonical(value[key])).join(",")+"}";
  }
  return JSON.stringify(value);
}

export const toHex = bytes => Array.from(bytes,byte=>byte.toString(16).padStart(2,"0")).join("");

export async function sha256(text) {
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text));
  return toHex(new Uint8Array(digest));
}

export async function actAddress(label) {
  if (typeof label!=="string"||label.length>320) throw new RangeError("Enter a label of up to 80 characters.");
  const value=label.normalize("NFKC").trim().replace(/\s+/g," ");
  if (!value||Array.from(value).length>80||/\p{C}/u.test(value)) {
    throw new RangeError("Enter a label of 1–80 visible characters.");
  }
  const digest=await sha256(canonical(["ACT",1,value]));
  const ticks=1_000_000_000n;
  const circle=BigInt("0x"+digest.slice(0,8))*3_141_592_653n%ticks;
  const proportion=BigInt("0x"+digest.slice(8,16))*1_618_033_988n%ticks;
  return {address:"act-v1-"+digest.slice(0,24),sha256:digest,version:1,
    pi:Math.PI,phi:(1+Math.sqrt(5))/2,pie_sector:Number(circle*12n/ticks),
    angle_degrees:Number(circle)/Number(ticks)*360,phi_phase:Number(proportion)/Number(ticks)};
}
