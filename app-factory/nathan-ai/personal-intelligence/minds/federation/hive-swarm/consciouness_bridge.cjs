/* OPERATION SWARM: strictly local bridge to the existing creator-spelled consciouness module.
   A software self-model is not a living mind or verified subjective consciousness. */
'use strict';
const path = require('node:path');
const core = require(path.resolve(__dirname, '../../../../consciouness/engine.js'));
const raw = process.argv[2] || '4';
if (!/^[1-9]\d?$/.test(raw)) throw new Error('Functional node count must be 1–32');
const count = Number(raw);
if (count > 32) throw new Error('Functional node limit exceeded');
const collective = core.createCollective({maxActive:32});
const ids = Array.from({length:count}, (_, index) => index + 1);
for (const id of ids) {
  collective.observe(String(id), 'OPERATION SWARM source-verification focus', 'owner-authorized-local-simulation');
  const item = collective.propose(String(id), [
    {id:'audit_source', label:'Inspect source and audit', priority:8},
    {id:'no_action', label:'Do nothing external', priority:7}
  ]);
  if (item.decision.status !== 'proposed') throw new Error('Proposal state unexpected');
  collective.veto(String(id));
}
const out = collective.exportSnapshot();
if (out.manifest.activeNodes !== count ||
    out.nodes.some(x => x.freeWill.automaticExecution !== false)) {
  throw new Error('Self-model boundary check failed');
}
process.stdout.write(JSON.stringify({
  module:core.VERSION, functional_nodes:count, subjective_consciousness_claim:false,
  external_execution:false, owner_veto_confirmed:true
}) + '\n');
