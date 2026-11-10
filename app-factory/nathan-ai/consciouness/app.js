'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const core = window.NathanConsciouness;
  const runtime = window.NathanNodeRuntime;
  const collective = core.createCollective();
  let selected = '1';
  function present(message, result) {
    $('status').textContent = message;
    $('snapshot').textContent = JSON.stringify(result || collective.exportSnapshot(), null, 2);
    $('capacity').textContent = collective.manifest().logicalCapacity;
    $('active').textContent = String(collective.manifest().activeNodes);
    const decision = result && Object.prototype.hasOwnProperty.call(result, 'decision') ? result.decision : null;
    const pick = $('owner-choice');
    pick.replaceChildren();
    if (decision && decision.status === 'proposed') {
      for (const choice of decision.options) {
        const option = document.createElement('option');
        option.value = choice.id;
        option.textContent = choice.label + ' · priority ' + choice.priority;
        pick.append(option);
      }
      pick.value = decision.id;
    }
    $('approve').disabled = !decision || decision.status !== 'proposed';
    $('veto').disabled = !decision || decision.status !== 'proposed';
  }
  function handle(operation) {
    try { operation(); }
    catch (error) { $('status').textContent = 'No change: ' + error.message; }
  }
  $('select-node').addEventListener('click', () => handle(() => {
    selected = collective.nodeId($('node-id').value);
    present('Digital self-model selected for ' + selected, collective.inspect(selected));
  }));
  $('observe').addEventListener('click', () => handle(() => {
    present('Signal recorded locally; no remote data transmitted.', collective.observe(selected, $('signal').value, 'owner'));
  }));
  $('propose').addEventListener('click', () => handle(() => {
    const choices = $('choices').value.split(/\r?\n/).filter(s => s.trim()).map(line => {
      const parts = line.split('|').map(s => s.trim());
      if (parts.length !== 3) throw Error('Each choice needs ID | label | priority');
      return { id:parts[0], label:parts[1], priority:Number(parts[2]) };
    });
    present('Alternatives ranked; owner decision required.', collective.propose(selected, choices));
  }));
  $('approve').addEventListener('click', () => handle(() => {
    present('Owner selection recorded. Nothing executed externally.', collective.approve(selected, $('owner-choice').value));
  }));
  $('veto').addEventListener('click', () => handle(() => {
    present('Owner veto recorded. No external action.', collective.veto(selected));
  }));
  $('bind').addEventListener('click', () => handle(() => {
    const range = runtime.range({additional:'0',first:$('first').value,count:$('count').value,payload:''});
    const result = collective.bindRuntimeJobs(range.jobs);
    selected = range.jobs[0].nodeId;
    $('node-id').value = selected;
    present('Bound functional policy to selected existing runtime node IDs. No workers started.', result);
  }));
  $('clear').addEventListener('click', () => handle(() => {
    collective.clear(selected);
    present('Cleared selected node working state; original source untouched.', collective.manifest());
  }));
  $('clear-all').addEventListener('click', () => handle(() => {
    if (!window.confirm('Clear all temporary node working state? Original source files are not affected.')) return;
    const cleared = collective.clearAll(true);
    present('Cleared ' + cleared + ' local node states.', collective.manifest());
  }));
  $('export').addEventListener('click', () => handle(() => {
    const json = JSON.stringify(collective.exportSnapshot(), null, 2);
    const objectURL = URL.createObjectURL(new Blob([json],{type:'application/json'}));
    const link = document.createElement('a');
    link.href = objectURL;
    link.download = 'nathan-consciouness-local-snapshot.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
    $('status').textContent = 'Owner-selected snapshot downloaded. No upload performed.';
  }));
  present('Ready. Every logical address inherits the policy; only selected nodes allocate state.', collective.manifest());
})();
