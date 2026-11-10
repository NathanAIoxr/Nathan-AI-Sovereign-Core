/* Optional read-only bridge to the existing owner-started Node Runtime.
 * Never changes a worker task, approves an action, or intercepts its lifecycle.
 */
'use strict';
(() => {
  const core = window.NathanConsciouness, runtime = window.NathanNodeRuntime;
  const form = document.getElementById('run-form');
  if (!core || !runtime || !form) return;
  const collective = core.createCollective({capacity: core.MAX_CAPACITY});
  const section = document.createElement('section');
  section.setAttribute('aria-label','Digital consciouness self-model policy');
  const heading = document.createElement('h2');
  heading.textContent = 'CONSCIOUNESS · Shared Node Policy';
  const description = document.createElement('p');
  description.textContent = 'A local functional self-model is mapped to each selected logical node address. Worker execution remains under the original owner-controlled runtime and continues unchanged.';
  const output = document.createElement('pre');
  output.className = 'task-log';
  output.textContent = 'No runtime node batch bound in this page.';
  const link = document.createElement('a');
  link.href = '../consciouness/index.html';
  link.textContent = 'Open free-will choice and memory workshop';
  section.append(heading,description,link,output);
  form.closest('section').insertAdjacentElement('afterend', section);
  form.addEventListener('submit', () => {
    try {
      const get = id => document.getElementById(id).value;
      const batch = runtime.range({additional:get('additional'), first:get('first'), count:get('count'), payload:get('payload')});
      const bound = collective.bindRuntimeJobs(batch.jobs);
      output.textContent = JSON.stringify({
        schema: bound.schema,
        selected: bound.attached,
        inheritedPolicy: bound.policy,
        capabilities: core.CAPABILITIES,
        freeWill: 'choice proposals require separate owner approval',
        externalActions: 'none from this bridge'
      }, null, 2);
    } catch (error) {
      output.textContent = 'No self-model binding: ' + error.message;
    }
  });
})();
