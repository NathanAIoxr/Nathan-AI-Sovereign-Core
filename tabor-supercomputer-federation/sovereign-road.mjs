const encoder = new TextEncoder()
const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })
const algorithm = { name: 'HMAC', hash: 'SHA-256' }
const maximumPacketBytes = 2048
const maximumClockSkew = 300_000
const exactSeal = /^0xFF[0-3][1-3]$/
const slugFormat = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const gateRejection = { status: 'PURGED_AT_GATE', code: 0, destination: null }

async function readBoundedBody(request) {
  const reader = request.body?.getReader()
  if (!reader) return null
  const bytes = new Uint8Array(maximumPacketBytes)
  let length = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) return decoder.decode(bytes.subarray(0, length))
      if (length + value.length > maximumPacketBytes) {
        await reader.cancel()
        return null
      }
      bytes.set(value, length)
      length += value.length
    }
  } finally {
    reader.releaseLock()
  }
}

function packetShape(packet, node) {
  return packet && packet.road_origin === node && typeof packet.target_slug === 'string'
    && packet.target_slug.length <= 256 && slugFormat.test(packet.target_slug)
    && typeof packet.hex_seal === 'string' && exactSeal.test(packet.hex_seal)
    && Object.keys(packet).length === 3
}

export async function authenticateRoad(request, node, secret, now = Date.now()) {
  const timestamp = request.headers.get('X-Sovereign-Timestamp') ?? ''
  const signature = request.headers.get('X-Sovereign-Signature') ?? ''
  if (!secret || secret.length < 32 || !/^\d{13}$/.test(timestamp)
    || Math.abs(now - Number(timestamp)) > maximumClockSkew || !/^[0-9a-f]{64}$/.test(signature)) return null
  try {
    const body = await readBoundedBody(request)
    if (body === null) return null
    const master = await crypto.subtle.importKey('raw', encoder.encode(secret), algorithm, false, ['sign'])
    const derived = await crypto.subtle.sign('HMAC', master, encoder.encode('sovereign-road-v1/' + node))
    const key = await crypto.subtle.importKey('raw', derived, algorithm, false, ['verify'])
    const supplied = Uint8Array.from(signature.match(/../g), byte => parseInt(byte, 16))
    const signed = encoder.encode(timestamp + '\n' + body)
    if (!await crypto.subtle.verify('HMAC', key, supplied, signed)) return null
    const packet = JSON.parse(body)
    return packetShape(packet, node) ? packet : null
  } catch {
    return null
  }
}

export function routeToSovereignty(packet, node, bySlug) {
  if (!packetShape(packet, node)) return gateRejection
  const row = bySlug.get(packet.target_slug)
  if (row?.hex_seal !== packet.hex_seal) return gateRejection
  return {
    status: 'ADMITTED_TO_THRONE',
    code: 1,
    destination: ['sovereign://', node, '/act/', row.slug].join(''),
    record: row,
  }
}
