import conductor, { MasterConductor } from './edge-conductor.mjs';
import rehearsal from './runtime.mjs';
import board from '../edge-board.html';

export { MasterConductor };
export default {
  ...conductor,
  fetch(request, env) {
    const assets = { fetch: () => new Response(board, { headers: {
      'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'",
      'X-Content-Type-Options': 'nosniff'
    } }) };
    return conductor.fetch(request, { ...env, ASSETS: assets, REHEARSAL: rehearsal });
  }
};
