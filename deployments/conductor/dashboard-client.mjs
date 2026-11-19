export const dashboardScript = String.raw`
const selector = id => document.getElementById(id);
const root = '/tabor-sites/conductor/api';
const key = selector('key');
const feedback = selector('feedback');
const jobs = selector('jobs');
let busy = false;
async function api(path, body) {
  const response = await fetch(root + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: 'Bearer ' + key.value, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store'
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'request_failed');
  return data;
}
function button(label, handler) {
  const item = document.createElement('button');
  item.textContent = label;
  item.onclick = () => run(handler);
  return item;
}
async function refresh() {
  const result = await api('/jobs');
  feedback.textContent = result.control.paused ? 'Paused · ' + result.control.reason : 'Accepting jobs';
  jobs.replaceChildren();
  for (const job of result.jobs) {
    const row = document.createElement('article');
    const title = document.createElement('strong');
    title.textContent = job.command + ' · ' + job.state;
    const details = document.createElement('p');
    details.textContent = job.id + (job.release ? ' · ' + job.release : '') + (job.issue ? ' · ' + job.issue : '');
    row.append(title, details);
    if (job.state === 'awaiting_approval') {
      row.append(button('Approve deployment', () => api('/jobs/' + job.id + '/decision', { approved: true })),
                 button('Reject', () => api('/jobs/' + job.id + '/decision', { approved: false })));
    }
    if (job.run_id) {
      const link = document.createElement('a');
      link.href = 'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/actions/runs/' + job.run_id;
      link.textContent = 'GitHub run';
      row.append(link);
    }
    jobs.append(row);
  }
}
async function run(action) {
  if (busy) return;
  busy = true;
  try {
    if (action) await action();
    await refresh();
  } catch (error) {
    feedback.textContent = error.message;
  } finally {
    busy = false;
  }
}
selector('load').onclick = () => run();
selector('verify').onclick = () => run(() => api('/dispatch', { id: crypto.randomUUID(), command: 'verify', project: 'zeros-and-ones' }));
selector('deploy').onclick = () => run(() => api('/dispatch', { id: crypto.randomUUID(), command: 'deploy', project: 'zeros-and-ones' }));
selector('pause').onclick = () => run(() => api('/control/pause', {}));
selector('resume').onclick = () => run(() => api('/control/resume', {}));
key.addEventListener('input', () => { jobs.replaceChildren(); feedback.textContent = ''; });
fetch(root + '/health', { cache: 'no-store' }).then(response => response.json()).then(data => {
  selector('health').textContent = data.ready ? 'Conductor ready · ' + data.release.slice(0, 12) : 'Conductor unavailable';
}).catch(() => { selector('health').textContent = 'Conductor unavailable'; });
`;
