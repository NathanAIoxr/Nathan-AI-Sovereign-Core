let plan = readStored('agi.plan', null);
const labels = ['Scope', 'Constraint', 'Build', 'Verify'];

function drawPlan() {
  if (!plan) return;
  byId('plan-title').textContent = plan.goal;
  const progress = () => {
    const completed = plan.done.filter(Boolean).length;
    byId('plan-count').textContent = completed + ' of ' + plan.steps.length + ' steps complete.';
  };
  const nodes = plan.steps.map((step, index) => {
    const label = document.createElement('label');
    label.className = 'check';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = plan.done[index];
    checkbox.addEventListener('change', () => {
      plan.done[index] = checkbox.checked;
      saveStored('agi.plan', plan);
      progress();
    });
    const text = document.createElement('span');
    text.textContent = labels[index] + ' · ' + step;
    label.append(checkbox, text);
    return label;
  });
  byId('steps').replaceChildren(...nodes);
  progress();
}

byId('plan-form').addEventListener('submit', event => {
  event.preventDefault();
  const goal = byId('goal').value.trim();
  const constraint = byId('constraint').value.trim();
  const evidence = byId('evidence').value.trim();
  if (!goal) {
    byId('plan-count').textContent = 'Enter a goal to start.';
    return;
  }
  plan = {
    goal, constraint, evidence,
    steps: [
      'List the deliverables for “' + goal + '” and identify their release destinations.',
      constraint || 'Record the main dependency or constraint before starting.',
      'Implement or prepare each deliverable and review the result.',
      evidence || 'Open each final deliverable through the path its audience will use and record what happened.',
    ],
    done: [false, false, false, false],
  };
  saveStored('agi.plan', plan);
  drawPlan();
});
if (plan) {
  byId('goal').value = plan.goal;
  byId('constraint').value = plan.constraint;
  byId('evidence').value = plan.evidence;
  drawPlan();
}
