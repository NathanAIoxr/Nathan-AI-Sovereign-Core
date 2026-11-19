export const defaults = Object.freeze({ highway: 10, mph: 110, dinner: 97, goodbye: 2 });

const limits = { highway: 180, mph: 200, dinner: 360, goodbye: 90 };
const midpoint = 0.73;

export function createRoute(values = defaults) {
  const input = Object.fromEntries(Object.keys(defaults).map(key => {
    const number = Number(values[key]);
    if (!Number.isInteger(number) || number < 1 || number > limits[key]) {
      throw new RangeError('Invalid route setting: ' + key);
    }
    return [key, number];
  }));
  return [
    { id: 'highway', label: 'Highway', seconds: input.highway * 60, mph: input.mph },
    { id: 'dinner', label: 'Dinner', seconds: input.dinner * 60, mph: 0 },
    { id: 'goodbye', label: 'Parking-lot goodbye', seconds: input.goodbye * 60, mph: 0 }
  ];
}

export function duration(route) {
  return route.reduce((seconds, stage) => seconds + stage.seconds, 0);
}

export function sample(route, time) {
  const full = duration(route);
  const elapsed = Math.min(full, Math.max(0, Number.isFinite(time) ? time : 0));
  if (elapsed === full) return { elapsed, stage: 2, done: true, mph: 0, position: 1 };
  const highway = route[0].seconds;
  const dinnerEnd = highway + route[1].seconds;
  if (elapsed < highway) {
    return { elapsed, stage: 0, done: false, mph: route[0].mph, position: elapsed / highway * midpoint };
  }
  if (elapsed < dinnerEnd) return { elapsed, stage: 1, done: false, mph: 0, position: midpoint };
  return { elapsed, stage: 2, done: false, mph: 0, position: 1 };
}

export function simulationExport(route) {
  return { type: 'scrambler-simulation', simulated: true, totalSeconds: duration(route), route };
}

export function clock(time) {
  const seconds = Math.floor(time);
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map(value => String(value).padStart(2, '0')).join(':');
}
