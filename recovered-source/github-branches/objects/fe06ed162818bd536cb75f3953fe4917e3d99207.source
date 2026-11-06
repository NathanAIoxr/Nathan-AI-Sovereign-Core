(function () {
  'use strict';
  const details = document.getElementById('network-details');
  const command = document.getElementById('network-command');
  const link = document.getElementById('network-link');
  const copy = document.getElementById('network-copy');
  if (!details || !command || !link || !copy) return;
  const modes = {
    offline: {
      desc: 'LOCAL DEVICE: deterministic simulation with no hosted model, billed tokens or live hardware. The page stays interactive without network while open. For reliable reload after going offline, launch the local host first or save a standalone distribution.',
      cmd: 'node app-factory/nathan-ai/operations/turnaround/network-server.cjs',
      web: false
    },
    wifi: {
      desc: 'WI-FI / LOCAL NETWORK: on a computer you control, start the read-only local server from the repository root. Permit local firewall access only as needed. Open the displayed LAN-IP link from other devices on the same trusted Wi-Fi. Each device has separate local state. Nothing scans neighbors or pools processors.',
      cmd: 'node app-factory/nathan-ai/operations/turnaround/network-server.cjs --host 0.0.0.0 --lan --port 8787\n# On your other device: http://YOUR-LAN-IP:8787/app-factory/nathan-ai/operations/turnaround/',
      web: false
    },
    cellular: {
      desc: 'CELLULAR / INTERNET: open the deployed HTTPS static edition using mobile data after the branch is merged to the published site. You do not need API tokens to use the local engine. This is remote page delivery, not a direct connection to your home Wi-Fi host. Secure cross-network peer computation would require a separate consent-based service.',
      cmd: 'https://nathanaioxr.github.io/Nathan-AI-Sovereign-Core/app-factory/nathan-ai/operations/turnaround/',
      web: true
    }
  };
  let current = 'offline';
  function setMode(mode) {
    if (!Object.hasOwn(modes, mode)) return;
    current = mode;
    for (const button of document.querySelectorAll('[data-network-mode]')) {
      button.setAttribute('aria-pressed', String(button.dataset.networkMode === mode));
    }
    details.textContent = modes[mode].desc;
    command.textContent = modes[mode].cmd;
    link.hidden = !modes[mode].web;
    copy.textContent = 'Copy ' + (modes[mode].web ? 'HTTPS address' : 'startup command');
  }
  for (const button of document.querySelectorAll('[data-network-mode]')) {
    button.addEventListener('click', () => setMode(button.dataset.networkMode));
  }
  copy.addEventListener('click', async () => {
    const source = modes[current].cmd;
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('No clipboard access in this context');
      await navigator.clipboard.writeText(source);
      copy.textContent = 'Copied — paste on your own device';
    } catch (_) {
      copy.textContent = 'Select and copy the text above manually';
    }
  });
  setMode('offline');
})();
