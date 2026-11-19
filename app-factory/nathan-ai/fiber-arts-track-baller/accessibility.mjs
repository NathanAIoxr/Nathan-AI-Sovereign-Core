/** Accessible, deterministic gesture descriptions for a simulated fiber viewport. */
const DIRECTIONS = Object.freeze({up:'up',down:'down',left:'left',right:'right'});
export function describeFiberAction(action, options = {}) {
  if (!action || typeof action !== 'object') throw new TypeError('action object required');
  const precision = options.precision ?? 0;
  if (!Number.isInteger(precision) || precision < 0 || precision > 2) throw new RangeError('precision must be 0..2');
  switch (action.type) {
    case 'swipe': {
      if (action.valid !== true) return 'Swipe not recognized';
      if (!Object.hasOwn(DIRECTIONS, action.direction)) throw new TypeError('invalid swipe direction');
      return `Swiped ${DIRECTIONS[action.direction]}`;
    }
    case 'strand': {
      if (action.id == null) return 'No strand selected';
      if (typeof action.id !== 'string' || !action.id.trim()) throw new TypeError('invalid strand id');
      return `Selected strand ${action.id.trim().slice(0,80)}`;
    }
    case 'zoom': {
      if (!Number.isFinite(action.scale) || action.scale <= 0) throw new RangeError('invalid zoom scale');
      return `Viewport zoom ${Math.round(action.scale * 100 * 10**precision) / 10**precision} percent`;
    }
    default: throw new RangeError('unsupported action type');
  }
}
