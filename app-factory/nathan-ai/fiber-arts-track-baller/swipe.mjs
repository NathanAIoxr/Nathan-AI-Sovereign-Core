/** Deterministic one-pointer swipe intent for a simulated fiber viewport; not yarn physics. */
export function swipeFrame(start, end, options = {}) {
  const finitePoint = p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.time);
  if (!finitePoint(start) || !finitePoint(end)) throw new TypeError('finite x, y, time required');
  const minDistance = options.minDistance ?? 12;
  const maxDuration = options.maxDuration ?? 600;
  if (!Number.isFinite(minDistance) || minDistance < 0 || !Number.isFinite(maxDuration) || maxDuration <= 0) throw new RangeError('invalid swipe thresholds');
  const duration = end.time - start.time;
  if (duration <= 0) return {valid:false, direction:null, distance:0, duration};
  const dx = end.x - start.x, dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  const valid = distance >= minDistance && duration <= maxDuration;
  const direction = !valid ? null : Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'down' : 'up');
  return {valid, direction, distance, duration};
}
