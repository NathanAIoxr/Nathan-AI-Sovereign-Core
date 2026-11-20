import train from '../../operations/train-runtime/worker.mjs';

const prefix = '/tabor-sites/tweezer-tap-os';
const relay = env => env.TWEEZER_ZONES.get('zone-tweezer-tap-edge');

function internal(env, path, payload) {
  return relay(env).fetch('https://tweezer-tap-os.internal/internal/' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Conductor-Relay': env.RELAY_KEY },
    body: JSON.stringify(payload)
  });
}

export default {
  fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    if (path === prefix || path.startsWith(prefix + '/')) return relay(env).fetch(request);
    return train.fetch(request, env, ctx);
  },
  async scheduled(event, env) {
    const response = await internal(env, 'cron', { epoch: event.scheduledTime });
    if (!response.ok) throw new Error('TIME relay failed');
  },
  async queue(batch, env) {
    const messages = batch.messages.map(({ id, attempts, body }) => ({ id, attempts, body }));
    const response = await internal(env, 'queue', { queue: batch.queue, messages });
    if (!response.ok) throw new Error('EMIT relay failed');
    const { ack } = await response.json();
    const completed = new Set(ack);
    for (const [index, message] of batch.messages.entries()) {
      if (completed.has(index)) message.ack();
      else message.retry();
    }
  }
};
