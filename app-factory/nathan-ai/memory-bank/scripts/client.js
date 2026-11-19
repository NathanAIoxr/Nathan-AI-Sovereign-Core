export function memoryClient(key = process.env.MEMORY_API_KEY) {
  if (!process.env.MEMORY_BASE_URL || !key) {
    throw new Error('Set MEMORY_BASE_URL and the memory bank bearer key.');
  }
  const endpoint = new URL(process.env.MEMORY_BASE_URL);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname);
  if ((endpoint.protocol !== 'https:' && !(local && endpoint.protocol === 'http:')) ||
      endpoint.username || endpoint.password || !/^\/(?:[A-Za-z0-9_-]+\/?)*$/.test(endpoint.pathname) || endpoint.search || endpoint.hash) {
    throw new Error('MEMORY_BASE_URL must be an HTTPS base URL or an HTTP loopback base URL.');
  }
  if (!endpoint.pathname.endsWith('/')) endpoint.pathname += '/';
  return async function request(path, body) {
    if (!['/remember', '/recall', '/import'].includes(path)) throw new Error('Unknown Memory Bank route.');
    const options = {
      headers: { Authorization: 'Bearer ' + key },
      redirect: 'error',
      signal: AbortSignal.timeout(20_000)
    };
    if (body !== undefined) {
      options.method = 'POST';
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    const response = await fetch(new URL(path.slice(1), endpoint), options);
    if (!response.ok) throw new Error('Memory bank returned HTTP ' + response.status + '.');
    return response.json();
  };
}
