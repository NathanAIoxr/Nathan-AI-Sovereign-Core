/** Pure two-pointer pinch/rotate gesture for simulated fiber viewport; no physical yarn calibration. */
export function pinchFrame(previous, current, options = {}) {
  const point = p => {
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new TypeError('finite pointer coordinates required');
    return p;
  };
  if (!Array.isArray(previous) || !Array.isArray(current) || previous.length !== 2 || current.length !== 2) throw new TypeError('exactly two pointers required');
  const [a,b] = previous.map(point), [c,d] = current.map(point);
  const distance = (p,q) => Math.hypot(q.x-p.x,q.y-p.y);
  const before = distance(a,b), after = distance(c,d);
  if (before < 1e-6 || after < 1e-6) return {scale:1, rotation:0, panX:0, panY:0, valid:false};
  const minScale = options.minScale ?? 0.5, maxScale = options.maxScale ?? 2;
  if (![minScale,maxScale].every(Number.isFinite) || minScale <= 0 || maxScale < minScale) throw new RangeError('invalid scale limits');
  const scale = Math.max(minScale, Math.min(maxScale, after/before));
  const angle = (p,q) => Math.atan2(q.y-p.y,q.x-p.x);
  const delta = angle(c,d)-angle(a,b);
  const rotation = Math.atan2(Math.sin(delta),Math.cos(delta));
  return {scale, rotation, panX:(c.x+d.x-a.x-b.x)/2, panY:(c.y+d.y-a.y-b.y)/2, valid:true};
}
