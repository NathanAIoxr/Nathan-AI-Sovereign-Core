/** Deterministic simulated Track Baller orientation; not verified yarn physics. */
export function normalizeQuaternion(q) {
 if (!Array.isArray(q)||q.length!==4||q.some(v=>!Number.isFinite(v))) throw new TypeError('four finite components required');
 const n=Math.hypot(...q); if(n<1e-12) throw new RangeError('zero quaternion');
 return q.map(v=>v/n);
}
export function multiplyQuaternion(a,b) {
 const [w,x,y,z]=normalizeQuaternion(a),[W,X,Y,Z]=normalizeQuaternion(b);
 return normalizeQuaternion([w*W-x*X-y*Y-z*Z,w*X+x*W+y*Z-z*Y,w*Y-x*Z+y*W+z*X,w*Z+x*Y-y*X+z*W]);
}
export function dragTrackball(q,dx,dy,sensitivity=0.008) {
 if (![dx,dy,sensitivity].every(Number.isFinite)||sensitivity<=0) throw new TypeError('invalid drag');
 const x=Math.max(-500,Math.min(500,dx)),y=Math.max(-500,Math.min(500,dy));
 const n=Math.hypot(x,y);if(n===0)return normalizeQuaternion(q);
 const h=n*sensitivity/2;
 return multiplyQuaternion([Math.cos(h),-y/n*Math.sin(h),x/n*Math.sin(h),0],q);
}
