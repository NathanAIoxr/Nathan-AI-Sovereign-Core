/** Pure strand selection for a simulated craft viewport. No physical yarn calibration. */
export function selectStrand(strands, point, options = {}) {
  if (!Array.isArray(strands) || !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new TypeError('valid strands and point required');
  const radius = options.radius ?? 18;
  if (!Number.isFinite(radius) || radius < 0) throw new RangeError('invalid selection radius');
  let best = null;
  for (const strand of strands) {
    if (!strand || typeof strand.id !== 'string' || !strand.id || !Array.isArray(strand.points) || strand.points.length === 0) continue;
    let distance = Infinity;
    for (let i = 0; i < strand.points.length; i++) {
      const a = strand.points[i], b = strand.points[Math.min(i + 1, strand.points.length - 1)];
      if (![a?.x,a?.y,b?.x,b?.y].every(Number.isFinite)) continue;
      const dx = b.x-a.x, dy = b.y-a.y, len2 = dx*dx+dy*dy;
      const t = len2 ? Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/len2)) : 0;
      distance = Math.min(distance,Math.hypot(point.x-(a.x+t*dx),point.y-(a.y+t*dy)));
    }
    if (distance <= radius && (!best || distance < best.distance)) best = {id:strand.id,distance};
  }
  return best;
}
