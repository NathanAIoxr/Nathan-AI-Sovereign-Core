import { blake3 } from "@noble/hashes/blake3.js";
import { bytes, check, define, hex, int, mod, sha, utf8, vec } from "../../../shared/core.ts";
const prime = 257;
const field = (x: unknown) => int(x, 0, prime - 1);
function power(base: number, n: number, modulus: number): number {
  let output = 1;
  while (n > 0) { if (n % 2) output = output * base % modulus; base = base * base % modulus; n = Math.floor(n / 2); }
  return output;
}
function crc(xs: Uint8Array): number {
  let register = 0xffffffff;
  for (const x of xs) { register ^= x; for (let bit = 0; bit < 8; bit++) register = (register >>> 1) ^ ((register & 1) ? 0xedb88320 : 0); }
  return (register ^ 0xffffffff) >>> 0;
}
const example = { text: "Nathan Tabor" };
export const modules = {
  "001": define("SHA-256 text digest", example, async p => hex(await sha(utf8(p.text)))),
  "002": define("SHA-512 text digest", example, async p => hex(await sha(utf8(p.text), "SHA-512"))),
  "003": define("BLAKE3 text digest", example, p => hex(blake3(utf8(p.text)))),
  "004": define("Triple modular redundancy voter", { replicas: [21, 20, 21] }, p => {
    const [a,b,c] = vec(p.replicas,3,3).map(n => int(n,0,0xffffffff));
    return { majority: ((a & b) | (b & c) | (a & c)) >>> 0, disagreement: a !== b || b !== c };
  }),
  "005": define("HMAC-SHA-256 fixture", { text: "message", fixtureKey: "demo-key" }, async p => {
    const key = await crypto.subtle.importKey("raw", utf8(p.fixtureKey), {name:"HMAC", hash:"SHA-256"},false,["sign"]);
    return hex(new Uint8Array(await crypto.subtle.sign("HMAC", key, utf8(p.text))));
  }),
  "006": define("CRC-32 byte checksum", { bytes: [49,50,51,52,53,54,55,56,57] }, p => crc(bytes(p.bytes))),
  "007": define("Byte parity", { bytes: [1,3,7] }, p => [...bytes(p.bytes)].map(x => {
    let parity = 0; for (let v = x; v; v >>>= 1) parity ^= v & 1; return parity;
  })),
  "008": define("Shamir polynomial share fixture", { secret: 42, coefficients: [7,11], shares: 5 }, p => {
    const factors = [field(p.secret), ...vec(p.coefficients,7).map(field)];
    return Array.from({length:int(p.shares,factors.length,32)}, (_,i) => {
      const x = i+1; return [x,factors.reduceRight((y,c) => (y*x+c)%prime,0)];
    });
  }),
  "009": define("Shamir share reconstruction fixture", { shares: [[1,60],[2,100],[3,162]] }, p => {
    check(Array.isArray(p.shares) && p.shares.length >= 2 && p.shares.length <= 32, "Expected 2–32 shares");
    const shares = p.shares.map(s => vec(s,2,2).map(field));
    const xs = shares.map(s=>s[0]); check(xs.every(x=>x!==0)&&new Set(xs).size===xs.length,"Share coordinates must be unique and nonzero");
    return shares.reduce((secret, [x,y], i) => (secret + y * xs.reduce((term, z, j) => j===i?term:mod(term*mod(-z,prime)*power(mod(x-z,prime),prime-2,prime),prime),1))%prime, 0);
  }),
  "010": define("Quorum decision", { votes: [true,true,false] }, p => {
    check(Array.isArray(p.votes)&&p.votes.length>=1&&p.votes.length<=31&&p.votes.every(x=>typeof x==="boolean"),"Expected boolean votes");
    const yes = p.votes.filter(Boolean).length; return { yes, no:p.votes.length-yes, decision: yes*2===p.votes.length?null:yes*2>p.votes.length };
  }),
  "011": define("Scalar modular exponentiation", { base: 7, exponent: 23, modulus: 257 }, p => power(int(p.base),int(p.exponent),int(p.modulus,2))),
  "012": define("Lattice arithmetic teaching fixture", { coefficients: [4,-6,8,13], modulus: 17, shift: 1 }, p => {
    const q = int(p.modulus,2,65535), xs = vec(p.coefficients,32).map(n=>int(n,-65535,65535)), k = int(p.shift,0,xs.length-1);
    return xs.map((_,i) => mod(i>=k?xs[i-k]:-xs[xs.length+i-k],q));
  }),
  "013": define("Hamming distance across bytes", { left: [3,7], right: [2,1] }, p => {
    const a=bytes(p.left),b=bytes(p.right); check(a.length===b.length,"Byte lengths differ"); let count=0;
    for(let i=0;i<a.length;i++) for(let x=a[i]^b[i];x;x&=x-1) count++;
    return count;
  }),
  "014": define("SHA-256 binary digest", { bytes: [0,128,255] }, async p => hex(await sha(bytes(p.bytes)))),
  "015": define("Fletcher-16 checksum", { bytes: [65,66,67] }, p => { let a=0,b=0; for(const x of bytes(p.bytes)){a=(a+x)%255;b=(b+a)%255;} return b*256+a; })
};
