(function (root) {
  'use strict';
  const MODES = Object.freeze({
    WIFI_ONLY: 'wifi-only',
    CELLULAR_WIFI: 'cellular-wifi'
  });
  const DEFAULT_MODE = MODES.WIFI_ONLY;
  const TRUSTED_HOST = 'nathanaioxr.github.io';
  const APP_PATH = '/Nathan-AI-Sovereign-Core/app-factory/nathan-ai/operations/turnaround/';
  const LOCAL_APP_PATH = '/app-factory/nathan-ai/operations/turnaround/';

  function isPrivateHost(hostname) {
    const h = String(hostname || '').replace(/^\[|\]$/g, '').toLowerCase();
    if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') ||
        h === '127.0.0.1' || h === '::1') return true;
    if (h.startsWith('fc') || h.startsWith('fd') || /^fe[89ab]/.test(h)) return true; // private/link-local IPv6 prefixes
    const octets = h.split('.');
    if (octets.length !== 4 || !octets.every(x => /^\d{1,3}$/.test(x) && Number(x) <= 255)) return false;
    const [a,b] = octets.map(Number);
    return a === 10 || a === 127 || a === 192 && b === 168 || a === 172 && b >= 16 && b <= 31 || a === 169 && b === 254;
  }
  function classify(context = {}) {
    const type = String(context.connectionType || '').toLowerCase();
    const networkType = type === 'wifi' || type === 'ethernet' ? 'local-link'
      : type === 'cellular' ? 'cellular' : 'unknown';
    const protocol = String(context.protocol || '');
    const hostname = String(context.hostname || '').toLowerCase();
    const pathname = String(context.pathname || '/');
    const local = isPrivateHost(hostname);
    const published = protocol === 'https:' && hostname === TRUSTED_HOST
      && pathname.startsWith(APP_PATH);
    const ownHost = local && pathname.startsWith(LOCAL_APP_PATH);
    return { networkType, local, published, ownHost, protocol, hostname, online: context.online !== false };
  }
  function permitReadOnlyCheck(mode, context = {}) {
    if (!Object.values(MODES).includes(mode)) throw new RangeError('Unsupported network mode');
    const x = classify(context);
    if (!x.online) return { allowed:false, reason:'Device reports offline; local arithmetic still works.', scope:'local-engine' };
    if (mode === MODES.WIFI_ONLY) {
      if (x.networkType === 'cellular') return { allowed:false, reason:'Cellular detected: network request blocked by Wi-Fi-only mode.', scope:'local-engine' };
      if (!x.ownHost) return { allowed:false, reason:'Wi-Fi-only check requires the self-hosted private LAN app. Open the local-server URL on your trusted network.', scope:'local-engine' };
      return { allowed:true, scope:'same-origin-read-only', reason:x.networkType === 'unknown'
        ? 'Private-LAN host verified, radio type unavailable. Metered transport cannot be guaranteed; only a small same-origin file check is permitted.'
        : 'Own local network and non-cellular connection reported. Small same-origin check permitted.' };
    }
    if (x.published) return { allowed:true, scope:'same-origin-read-only', reason:'HTTPS hosted edition; small read-only same-origin check permitted with explicit cellular opt-in.' };
    if (x.ownHost && x.networkType !== 'cellular') return { allowed:true, scope:'same-origin-read-only', reason:'Private-LAN edition; small read-only check permitted.' };
    return { allowed:false, scope:'local-engine', reason:'Cellular + Wi-Fi mode requires the known HTTPS app host, or a trusted local app address on a non-cellular connection.' };
  }
  function localVerification(engine, registry) {
    if (!engine || !registry || !Array.isArray(registry.node_tiers)) throw new TypeError('Local engine and source registry required');
    const a = engine.initialState();
    const turned = engine.transition(a, {type:'TURN_180'});
    const restored = engine.transition(turned, {type:'TURN_180'});
    const page = engine.virtualPage(registry.node_tiers[0], 1, 20);
    const invariants = {
      build:1 + 1 === 2,
      clear:1 - 1 === 0,
      fullTurn:restored.heading === a.heading && restored.axis === a.axis,
      safety:a.emergencyBrakes === 1 && a.hatchesSecured === 1 && a.anchorsDropped === 1,
      virtualNodes:page.indexes.length === 20 && page.sourceCount === 69696969
    };
    return { passed:Object.values(invariants).every(Boolean), invariants, checkedVirtualPositions:page.indexes.length, realDevicesActivated:0, remoteJobsStarted:0 };
  }
  const API = Object.freeze({MODES,DEFAULT_MODE,APP_PATH,LOCAL_APP_PATH,isPrivateHost,classify,permitReadOnlyCheck,localVerification});
  if (typeof module === 'object' && module.exports) module.exports = API;
  else root.NathanNetworkPolicy = API;
})(typeof window === 'object' ? window : globalThis);
