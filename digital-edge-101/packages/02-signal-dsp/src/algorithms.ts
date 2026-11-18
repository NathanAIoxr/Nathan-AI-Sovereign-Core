import { check, define, dot, int, mean, num, sum, vec } from "../../../shared/core.ts";
function fft(xs: number[]) {
  const n=xs.length; check((n&(n-1))===0,"FFT length must be a power of two");
  const r=Float32Array.from(xs), j=new Float32Array(n);
  for(let i=1,k=0;i<n;i++){let b=n>>1;for(;k&b;b>>=1)k^=b;k^=b;if(i<k)[r[i],r[k]]=[r[k],r[i]];}
  for(let size=2;size<=n;size*=2)for(let start=0;start<n;start+=size)for(let k=0;k<size/2;k++){
    const angle=-2*Math.PI*k/size,c=Math.cos(angle),s=Math.sin(angle),a=start+k,b=a+size/2;
    const re=r[b]*c-j[b]*s,im=r[b]*s+j[b]*c;
    r[b]=r[a]-re;j[b]=j[a]-im;r[a]+=re;j[a]+=im;
  }
  return Array.from(r,(re,i)=>[re,j[i]]);
}
const sample={samples:[0,1,0,-1,0,1,0,-1]};
const signal=(p:Record<string,unknown>)=>vec(p.samples);
export function kalman(values:number[], q:number, r:number) {
  let estimate=values[0],variance=1;
  return values.map(value=>{variance+=q;const gain=variance/(variance+r);estimate+=gain*(value-estimate);variance*=1-gain;return estimate;});
}
function waveform(count:number,cycles:number,phase=0){return Array.from({length:count},(_,i)=>Math.sin(2*Math.PI*cycles*i/count+phase));}
export const modules = {
  "016": define("Radix-2 FFT",sample,p=>fft(signal(p))),
  "017": define("FFT power spectrum",sample,p=>fft(signal(p)).map(([r,i])=>r*r+i*i)),
  "018": define("Sine wave generator",{count:16,cycles:2,phase:0},p=>waveform(int(p.count,1,256),num(p.cycles,0,128),num(p.phase,-360,360))),
  "019": define("Square wave fixture",{count:16,cycles:2},p=>waveform(int(p.count,1,256),num(p.cycles,0,128)).map(n=>n>=0?1:-1)),
  "020": define("Linear chirp generator",{count:16,start:1,end:4},p=>{const n=int(p.count,2,256),a=num(p.start,0,128),b=num(p.end,0,128);return Array.from({length:n},(_,i)=>{const t=i/n;return Math.sin(2*Math.PI*(a*t+(b-a)*t*t/2));});}),
  "021": define("Hann window",sample,p=>{const x=signal(p);return x.map((v,i)=>v*(x.length===1?1:.5-.5*Math.cos(2*Math.PI*i/(x.length-1))));}),
  "022": define("Root mean square",sample,p=>Math.sqrt(mean(signal(p).map(x=>x*x)))),
  "023": define("Lagged autocorrelation",{...sample,lag:2},p=>{const x=signal(p),l=int(p.lag,0,x.length-1);return dot(x.slice(0,x.length-l),x.slice(l));}),
  "024": define("Cross-correlation",{left:[1,2,3],right:[2,1],lag:1},p=>{const a=vec(p.left),b=vec(p.right),lag=int(p.lag,-255,255);return sum(a.map((v,i)=>v*(b[i+lag]??0)));}),
  "025": define("Causal moving average",{...sample,window:3},p=>{const x=signal(p),w=int(p.window,1,x.length);return x.map((_,i)=>mean(x.slice(Math.max(0,i-w+1),i+1)));}),
  "026": define("Finite impulse response",{...sample,taps:[.25,.5,.25]},p=>{const x=signal(p),t=vec(p.taps,32);return x.map((_,i)=>sum(t.map((h,k)=>h*(x[i-k]??0))));}),
  "027": define("Scalar Kalman smoother",{samples:[1,3,2,4],processNoise:.1,measurementNoise:.4},p=>kalman(signal(p),num(p.processNoise,0,100),num(p.measurementNoise,1e-9,100))),
  "028": define("Decimation with block averaging",{...sample,factor:2},p=>{const x=signal(p),f=int(p.factor,1,x.length);return x.filter((_,i)=>i%f===0).map((_,i)=>mean(x.slice(i*f,(i+1)*f)));}),
  "029": define("Zero crossing rate",sample,p=>{const x=signal(p),sign=x.filter(n=>n!==0).map(Math.sign);return {crossings:sign.filter((s,i)=>i>0&&s!==sign[i-1]).length,intervals:x.length-1};}),
  "030": define("Peak frequency bin",sample,p=>{const x=fft(signal(p));let bin=0,power=-1;for(let i=0;i<=x.length/2;i++){const next=x[i][0]**2+x[i][1]**2;if(next>power){power=next;bin=i;}}return {bin,power};})
};
