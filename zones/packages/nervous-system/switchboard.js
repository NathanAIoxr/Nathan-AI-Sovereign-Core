const toolDefinitions = [{
  name: 'get_zone_status',
  description: 'Read the current project staging state.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
}, {
  name: 'queue_integrity_audit',
  description: 'Queue a verification of this project’s provenance and R2 objects.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
}];

export async function switchboard(body, zone, env) {
  const { id, method, params } = body;
  const encode = result => ({ jsonrpc: '2.0', id: id ?? null, result });
  const error = (code, message) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
  if (body.jsonrpc !== '2.0' || typeof method !== 'string') return error(-32600, 'Invalid Request');
  if (id === undefined && method.startsWith('notifications/')) return null;
  if (method === 'initialize') {
    const supported = ['2025-03-26', '2025-06-18', '2025-11-25'];
    const protocolVersion = supported.includes(params?.protocolVersion) ? params.protocolVersion : supported.at(-1);
    return encode({ protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'tabor-sovereign-zones', version: '1.0.0' } });
  }
  if (method === 'ping') return encode({});
  if (method === 'tools/list') return encode({ tools: toolDefinitions });
  if (method !== 'tools/call') return error(-32601, 'Method not found');
  if (!toolDefinitions.some(tool => tool.name === params?.name)) return error(-32602, 'Unknown tool');
  const result = { projectId: zone.project_id, zoneStatus: zone.zone_status, mode: zone.live ? 'LIVE' : 'HOLDING' };
  if (params.name === 'queue_integrity_audit') {
    const auditId = crypto.randomUUID();
    await env.AUDIT_QUEUE.send({ type: 'integrity-audit', projectId: zone.project_id, auditId });
    Object.assign(result, { auditId, queued: true });
  }
  return encode({ content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result });
}
