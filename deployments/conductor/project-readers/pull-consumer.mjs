const projectPattern = /^[a-z0-9][a-z0-9-]{0,79}$/;
const digestPattern = /^reader-finding:[a-f0-9]{64}$/;

function receiptFor(event) {
  if (event?.project !== 'project-readers' || typeof event.id !== 'string') {
    throw new Error('Unrecognized event');
  }
  if (event.kind === 'CANARY' && /^reader-canary:[0-9a-f-]{36}$/.test(event.id)) {
    return {
      sql: 'INSERT INTO queue_receipts(event_id,project,kind) VALUES (?,?,?) ON CONFLICT(event_id) DO NOTHING',
      params: [event.id,event.project,event.kind]
    };
  }
  const {target, revision, status, tables} = event;
  if (event.kind !== 'READER_FINDING' || !digestPattern.test(event.id) ||
      typeof target !== 'string' || !projectPattern.test(target) ||
      typeof revision !== 'string' || !/^[a-f0-9]{40}$/.test(revision) ||
      !['candidate','review'].includes(status) || !Array.isArray(tables) ||
      !tables.length || tables.length > 2 ||
      tables.some(t => !['staged_app','zone_manifest'].includes(t))) {
    throw new Error('Unrecognized reader finding');
  }
  return {
    sql: 'INSERT INTO reader_findings(event_id,target,revision,status,source_tables) VALUES (?,?,?,?,?) ON CONFLICT(event_id) DO NOTHING',
    params: [event.id,target,revision,status,JSON.stringify(tables)]
  };
}

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
      const results = await request(receiptPath, receiptFor(body));
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
