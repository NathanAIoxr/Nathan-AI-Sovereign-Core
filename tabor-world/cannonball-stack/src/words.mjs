export async function words(value) {
  if(typeof value!=="string"||value.length>16000)throw RangeError("Use text up to 16,000 characters.");
  const segmenter=new Intl.Segmenter(undefined,{granularity:"grapheme"});
  const split=text=>Array.from(segmenter.segment(text),item=>item.segment);
  const firstLetters=value.split(/\s+/u).filter(Boolean).map(token=>split(token).find(part=>/\p{L}/u.test(part))??"").join("");
  const raw=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)));
  const sha256=Array.from(raw,byte=>byte.toString(16).padStart(2,"0")).join("");
  const seed=BigInt("0x"+sha256.slice(0,12));
  return {exact:value,mirror:split(value).reverse().join(""),firstLetters,sha256,
    family:Number(seed%172n)+1,clover:Number(seed%1382n)+1,supernode:Number(seed%732000000n)+1,
    omni:Number(seed%126000000000n)+1,duodecimal:seed.toString(12).toUpperCase()};
}
