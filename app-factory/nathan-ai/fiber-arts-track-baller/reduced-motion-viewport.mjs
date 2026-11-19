/** Opt-in accessibility guard for simulated Track Baller viewport frames.
 * No physical yarn forces are inferred or measured here.
 */
export function limitViewportMotion(previous, proposed, options = {}) {
  const { reducedMotion = false, maxPanDelta = 24, maxZoomRatio = 1.15 } = options;
  const finite = (n) => typeof n === 'number' && Number.isFinite(n);
  const valid = (v) => v && finite(v.zoom) && v.zoom > 0 && finite(v.panX) && finite(v.panY);
  if (!valid(previous) || !valid(proposed)) throw new TypeError('viewport requires finite positive zoom and finite pan coordinates');
  if (!finite(maxPanDelta) || maxPanDelta < 0 || !finite(maxZoomRatio) || maxZoomRatio < 1) throw new RangeError('invalid motion limits');
  if (!reducedMotion) return Object.freeze({ ...proposed });
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const dx = proposed.panX - previous.panX;
  const dy = proposed.panY - previous.panY;
  const distance = Math.hypot(dx, dy);
  const scale = distance > maxPanDelta ? maxPanDelta / distance : 1;
  return Object.freeze({
    ...proposed,
    panX: previous.panX + dx * scale,
    panY: previous.panY + dy * scale,
    zoom: clamp(proposed.zoom, previous.zoom / maxZoomRatio, previous.zoom * maxZoomRatio),
    // Reduced motion holds the prior orientation; no sudden spin.
    ...(Object.hasOwn(previous, 'orientation') ? { orientation: previous.orientation } : {}),
  });
}
