function decodeJson(body) {
  try { return JSON.parse(body); }
  catch { return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(body), c => c.charCodeAt(0)))); }
}

export async function consumeBatch(request, queuePath, receiptPath) {
  const leased = await request(queuePath + '/messages/pull', {batch_size:10, visibility_timeout_ms:60000});
  const acks = [], retries = [];
  for (const message of leased.messages) {
    if (!message.lease_id) throw new Error('Queue response is missing a lease ID');
    try {
      const body = typeof message.body === 'string'
        ? decodeJson(message.body)
        : message.body;
      if (body?.project !== 'project-readers' || body.kind !== 'CANARY' ||
          typeof body.id !== 'string' || !/^reader-canary:[0-9a-f-]{36}$/.test(body.id)) {
        throw new Error('Unrecognized event');
      }
      const results = await request(receiptPath, {
        sql: 'INSERT INTO queue_receipts(event_id,project,kind) VALUES (?,?,?) ON CONFLICT(event_id) DO NOTHING',
        params: [body.id,body.project,body.kind]
      });
      if (results[0]?.success !== true) throw new Error('Receipt write failed');
      acks.push({lease_id:message.lease_id});
    } catch {
      retries.push({lease_id:message.lease_id,delay_seconds:30});
    }
  }
  if (acks.length || retries.length) {
    await request(queuePath + '/messages/ack',{acks,retries});
  }
  return {leased:leased.messages.length,acknowledged:acks.length,retried:retries.length};
}
