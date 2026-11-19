const headers = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Nathan-Profile': 'sandbox'
};

export default {
  fetch(request) {
    const url = new URL(request.url);
    if (request.method !== 'GET') {
      return Response.json({ error: 'Read-only sandbox fixture.' }, { status: 405, headers: { ...headers, Allow: 'GET' } });
    }
    if (url.pathname === '/health') {
      return Response.json({ profile: 'sandbox', source: 'bundled-public-fixture', records: rows.length }, { headers });
    }
    if (url.pathname === '/bounties') {
      const category = url.searchParams.get('category');
      const status = url.searchParams.get('status');
      const query = (url.searchParams.get('q') ?? '').trim().toLowerCase().slice(0, 120);
      const filtered = rows.filter(row =>
        (!category || row.category === (category === 'math' ? 'mathematics' : category)) &&
        (!status || row.status === status) &&
        (!query || [row.title, row.organization, row.description].some(value => value.toLowerCase().includes(query)))
      );
      return Response.json({ profile: 'sandbox', count: filtered.length, bounties: filtered }, { headers });
    }
    if (url.pathname === '/stats') {
      const totals = { count: 0, prize_usd: 0, pool_usd: 0 };
      for (const row of rows.filter(row => row.status === 'OPEN')) {
        totals.count++;
        if (row.payout_kind === 'prize') totals.prize_usd += row.payout_usd ?? 0;
        if (row.payout_kind === 'pool') totals.pool_usd += row.payout_usd ?? 0;
      }
      return Response.json({ profile: 'sandbox', status: 'OPEN', totals }, { headers });
    }
    return Response.json({ error: 'Route not found.' }, { status: 404, headers });
  }
};
