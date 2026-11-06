(function () {
  'use strict';
  const policy = window.NathanNetworkPolicy;
  const engine = window.NathanTurnaround;
  const byId = id => document.getElementById(id);
  const details = byId('network-details');
  const command = byId('network-command');
  const hostedLink = byId('network-link');
  const copy = byId('network-copy');
  const execute = byId('network-execute');
  const emergency = byId('network-emergency');
  const output = byId('network-result');
  if (!policy || !engine || !details || !command || !hostedLink || !copy || !execute || !emergency || !output) return;

  // This is a presentation and execution preference, not an OS Wi-Fi switch.
  const modes = {
    [policy.MODES.WIFI_ONLY]: {
      desc: 'DEFAULT — WI-FI ONLY: run deterministic calculations on this device. For a small read-only local network check, start the supplied server and open its private-LAN address. Public internet requests and known cellular connections are blocked by this gateway. A browser cannot guarantee that a private network is unmetered.',
      cmd: 'node app-factory/nathan-ai/operations/turnaround/network-server.cjs --host 0.0.0.0 --lan --port 8787\n# From another trusted Wi-Fi device open http://YOUR-LAN-IP:8787/app-factory/nathan-ai/operations/turnaround/',
      web: false
    },
    [policy.MODES.CELLULAR_WIFI]: {
      desc: 'OPT IN — CELLULAR + WI-FI: run the same local engine and allow a small read-only check on the known HTTPS app host. This does not run jobs on a cellular tower, guarantee connectivity, upload source text, synchronize devices, or eliminate mobile-data charges.',
      cmd: 'https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/nathan-ai/operations/turnaround/',
      web: true
    }
  };
  let mode = policy.DEFAULT_MODE;
  let pending = null;
  let generation = 0;
  const context = () => ({
    protocol: location.protocol,
    hostname: location.hostname,
    pathname: location.pathname,
    online: navigator.onLine !== false,
    // The Network Information API is not available in all browsers.
    // effectiveType ("4g") measures link speed, NOT cellular radio type.
    connectionType: navigator.connection?.type || navigator.mozConnection?.type ||
      navigator.webkitConnection?.type || 'unknown'
  });
  function cancelPending() {
    generation += 1;
    if (pending) pending.abort();
    pending = null;
    execute.disabled = false;
  }
  function announce(message) { output.textContent = message; }
  function selectMode(value) {
    if (!Object.hasOwn(modes, value)) return;
    cancelPending();
    mode = value;
    for (const b of document.querySelectorAll('[data-network-mode]')) {
      b.setAttribute('aria-pressed', String(b.dataset.networkMode === value));
    }
    details.textContent = modes[value].desc;
    command.textContent = modes[value].cmd;
    hostedLink.hidden = !modes[value].web;
    copy.textContent = 'Copy ' + (modes[value].web ? 'HTTPS address' : 'server command');
    announce(value === policy.DEFAULT_MODE
      ? 'Wi-Fi-only default selected. RUN executes the on-device engine; network checks are restricted to your own local app host.'
      : 'Cellular + Wi-Fi selected by you. RUN executes the on-device engine; only an approved same-origin read-only check is eligible.');
  }

  for (const b of document.querySelectorAll('[data-network-mode]')) {
    b.addEventListener('click', () => selectMode(b.dataset.networkMode));
  }
  copy.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('No clipboard');
      await navigator.clipboard.writeText(modes[mode].cmd);
      copy.textContent = 'Copied — paste on your own device';
    } catch (_) {
      copy.textContent = 'Select and copy the text above manually';
    }
  });

  execute.addEventListener('click', async () => {
    cancelPending();
    const current = generation;
    // Compute locally first. This never launches processes on other devices.
    let check;
    try {
      check = policy.localVerification(engine, {node_tiers:[{id:'misfit',count:69696969}]});
    } catch (error) {
      announce('Local engine check failed: ' + error.message);
      return;
    }
    if (!check.passed) {
      announce('Local engine check did not pass. No network request was made.');
      return;
    }
    const permission = policy.permitReadOnlyCheck(mode, context());
    const primary = 'LOCAL EXECUTION PASS: 1+1=2, 1−1=0, reversible 180°, safety flags and 20 virtual index positions checked. 0 external jobs started.';
    if (!permission.allowed) {
      announce(primary + ' NETWORK CHECK SKIPPED: ' + permission.reason);
      return;
    }
    // A single same-origin HEAD request checks only the published public
    // registry, not arbitrary sites, private content, nodes, or peers.
    const aborter = new AbortController();
    pending = aborter;
    execute.disabled = true;
    announce(primary + ' Checking one same-origin public registry file…');
    try {
      const response = await fetch('./registry.json', {
        method:'HEAD', cache:'no-store', credentials:'omit',
        redirect:'error', signal:aborter.signal
      });
      if (generation !== current) return;
      announce(primary + (response.ok
        ? ' READ-ONLY NETWORK CHECK PASS: source registry reachable. ' + permission.reason
        : ' Registry responded HTTP ' + response.status + '; local engine remains operational.'));
    } catch (error) {
      if (generation !== current) return;
      announce(primary + (error.name === 'AbortError'
        ? ' Network check cancelled.'
        : ' Network check unavailable; local engine remains operational. ' + permission.reason));
    } finally {
      if (generation === current) { pending = null; execute.disabled = false; }
    }
  });

  emergency.addEventListener('click', () => {
    cancelPending();
    mode = policy.DEFAULT_MODE;
    for (const b of document.querySelectorAll('[data-network-mode]')) {
      b.setAttribute('aria-pressed', String(b.dataset.networkMode === mode));
    }
    details.textContent = modes[mode].desc;
    command.textContent = modes[mode].cmd;
    hostedLink.hidden = true;
    announce('EMERGENCY BRAKE ENGAGED. Outstanding network check cancelled; Wi-Fi-only restored. Original wording, local queue and files remain unchanged.');
  });
  selectMode(policy.DEFAULT_MODE);
})();
