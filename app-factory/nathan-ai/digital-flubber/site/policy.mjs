export const zones = Object.freeze({
  playground: ['Place balls', 'Place walls', 'Practice'],
  workbench: ['Place balls', 'Place walls', 'Practice'],
  vault: ['Explicit access required']
});
export const actions = ['ball', 'wall', 'enter'];
export const maxBalls = 64;

export function authorize(zone, action, { grant = false, contained = false } = {}) {
  const reason = contained ? 'containment-active'
    : !Object.hasOwn(zones, zone) || !actions.includes(action) ? 'unknown-scope'
    : zone === 'vault' && !grant ? 'permission-required' : 'allowed';
  return { allowed: reason === 'allowed', reason,
    response: reason === 'allowed' ? 'flubber' : 'slubber' };
}

export const incidentPlans = Object.freeze({
  'unexpected-access': ['Stop new actions and keep the zone isolated.', 'Export the app activity log and record the affected zone.', 'Review grants before resuming the lab.'],
  'unexpected-motion': ['Contain and pause the simulation.', 'Inspect restitution, stored energy and the last boundary event.', 'Reset the arena or lower energy before resuming.'],
  'manual-drill': ['Activate containment to pause the arena.', 'Review recent Slubber decisions and export the exercise log.', 'Resume the arena after reviewing the permissions.']
});
