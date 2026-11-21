/** Accessible text for simulated Track Baller viewport state, not measured yarn mechanics. */
export function describeViewportForAccessibility(frame) {
  if (!frame || typeof frame !== 'object' || !Array.isArray(frame.orientation) ||
      frame.orientation.length !== 4 ||
      !frame.orientation.every(value => typeof value === 'number' && Number.isFinite(value)) ||
      typeof frame.zoom !== 'number' || !Number.isFinite(frame.zoom) || frame.zoom <= 0) {
    return '3D craft view unavailable';
  }
  const norm = Math.hypot(...frame.orientation);
  if (!Number.isFinite(norm) || Math.abs(norm - 1) > 1e-6) {
    return '3D craft view unavailable';
  }
  return `3D craft view, zoom ${Number(frame.zoom.toFixed(2))} times; orientation controlled by Track Baller`;
}
