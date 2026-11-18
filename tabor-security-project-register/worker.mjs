const projects = [
  { id: 'odb', title: 'DIRTY_OLE_BASTARD_Protocol (Financial Reclamation)',
    parent: 'Nathan AI Guardian V2.0', provenance: 'prior_record_summary', dates: ['2025-10-05', '2025-10-08'],
    recorded_behavior: 'symbolic financial sweep; recorded simulation',
    live_fixture: '/api/fixtures/odb' },
  { id: '1993', title: '1993 coding archive', provenance: 'author_reported',
    source_status: 'original_source_not_verified', live_fixture: '/api/fixtures/supply-chain' },
  { id: 'gotv', title: 'GOTV code provenance', provenance: 'author_reported',
    source_status: 'original_source_and_ownership_not_verified' },
  { id: 'november-collection', title: 'November 5, 2026 security simulations',
    provenance: 'prior_record_summary', reported_count: 60, individual_entries_verified: false },
  { id: 'semantics', title: 'Semantics Antivirus / TABOR 1-2-3',
    provenance: 'prior_record_summary', recorded_behavior: 'local language and text review prototype' },
  { id: 'outside-box', title: 'Sovereign Defender / Outside Box', provenance: 'github_pull_request',
    href: 'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/320' },
  { id: 'wordplay', title: 'Nathan Tabor Wordplay Matrix', provenance: 'cloudflare_and_github',
    href: 'https://epenthesis-word-matrix.nathantaboract.workers.dev/explore',
    source: 'https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/328',
    related: ['music', 'rhythm', 'cadence', 'ODB / Wu-Tang'] },
]

const encoder = new TextEncoder()
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
const json = (data, status = 200) => Response.json(data, { status, headers })

async function sha256(text) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(text))
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function runFixture(id) {
  let evidence
  if (id === 'odb') {
    const mockLedger = [{ token: 'fixture-a', value: 13 }, { token: 'fixture-b', value: 21 }]
    evidence = { label: projects[0].title, fixture_records: mockLedger.length,
      symbolic_units: mockLedger.reduce((sum, record) => sum + record.value, 0),
      money_moved: false, result: 'symbolic_total_verified' }
  } else if (id === 'supply-chain') {
    const expected = await sha256('approved fixture text')
    const observed = await sha256('unexpected fixture text')
    const matching = await sha256('approved fixture text')
    evidence = { label: 'Trojan-horse defense tabletop', artifact: 'inert text fixture',
      expected_sha256: expected, mismatched_sha256: observed,
      trust_decision: observed === expected ? 'matches_manifest' : 'hold_for_review',
      clean_control: matching === expected ? 'matches_manifest' : 'hold_for_review' }
  } else if (id === 'recovery') {
    const manifest = await sha256('fixed backup fixture v1')
    const restored = await sha256('fixed backup fixture v1')
    const mismatch = await sha256('changed backup fixture')
    evidence = { label: 'Ransomware recovery tabletop', artifact: 'inert text fixture',
      restored_copy_matches: restored === manifest, altered_copy_matches: mismatch === manifest }
  } else {
    return null
  }
  const report = { schema: 1, mode: 'defensive_synthetic_fixture', id, external_actions: 0, evidence }
  return { ...report, receipt: { sha256: await sha256(JSON.stringify(report)) } }
}

function homepage() {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Nathan AI Project and Provenance Register</title><style>:root{color-scheme:dark;font-family:Geist,system-ui,sans-serif;background:#11191d;color:#edf5f4}main{max-width:54rem;margin:auto;padding:clamp(20px,6vw,60px)}header{border-bottom:1px solid #4a585d;padding-bottom:22px}h1{margin:0;font-size:clamp(2.2rem,7vw,4rem);line-height:1.06}p{color:#c1cecd;line-height:1.55}li{margin:12px 0}a{color:#aee6cb;text-underline-offset:3px}</style>
<main><header><h1>Nathan AI Project and Provenance Register</h1><p>Project names, source references, and reproducible defensive fixtures.</p></header>
<h2>Project records</h2><ul><li><a href="/api/projects">Open the project register</a></li>
<li><a href="https://epenthesis-word-matrix.nathantaboract.workers.dev/explore">Nathan Tabor Wordplay Matrix</a></li>
<li><a href="https://github.com/NathanAIoxr/Nathan-AI-Sovereign-Core/pull/320">Sovereign Defender / Outside Box</a></li></ul>
<h2>Defensive exercises</h2><ul><li><a href="/api/fixtures/odb">DIRTY_OLE_BASTARD_Protocol (Financial Reclamation)</a></li>
<li><a href="/api/fixtures/supply-chain">Trojan-horse defense tabletop</a></li><li><a href="/api/fixtures/recovery">Ransomware recovery tabletop</a></li></ul></main></html>`, { headers: { ...headers,
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'" } })
}

export default {
  async fetch(request) {
    if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405)
    const path = new URL(request.url).pathname
    if (path === '/') return homepage()
    if (path === '/health') return json({ service: 'Nathan AI Project and Provenance Register', projects: projects.length, fixtures: 3 })
    if (path === '/api/projects') return json({ projects })
    if (path.startsWith('/api/fixtures/')) {
      const result = await runFixture(path.slice('/api/fixtures/'.length))
      if (result) return json(result)
    }
    return json({ error: 'not_found' }, 404)
  },
}
