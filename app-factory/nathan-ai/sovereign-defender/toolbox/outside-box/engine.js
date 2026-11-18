/* NATHAN AI Outside Box: local defensive case review. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../engine.js'));
  } else {
    root.NathanOutsideBox = factory(root.NathanDefenseToolbox);
  }
})(globalThis, function (toolbox) {
  'use strict';
  const INPUT_SCHEMA = 'nathan-ai.outside-box.telemetry.v1';
  const CASE_SCHEMA = 'nathan-ai.outside-box.case.v1';
  const MAX_BYTES = 2 * 1024 * 1024;
  const MAX_ROWS = 1000;
  const MAX_SOURCES = 10;
  const STAGES = Object.freeze(['observed', 'targeted', 'accessed', 'changed', 'transferred', 'blocked']);
  const PLAYBOOK = Object.freeze([
    ['Account takeover', 'Review sign-ins and revoke the affected sessions.'],
    ['Business email compromise', 'Quarantine related messages and verify payment requests independently.'],
    ['Credential theft or stuffing', 'Revoke exposed credentials and review successful sign-ins.'],
    ['Denial of service', 'Apply targeted edge rate limits and verify legitimate traffic.'],
    ['Exfiltration', 'Restrict the affected egress or sharing path and verify data scope.'],
    ['Fileless execution', 'Isolate the endpoint and preserve process evidence.'],
    ['Git and CI/CD compromise', 'Pause the affected pipeline and review runner credentials and artifacts.'],
    ['Host compromise', 'Isolate the affected host and preserve evidence.'],
    ['Injection or unsafe input', 'Restrict the affected route and correct input handling.'],
    ['Job or command abuse', 'Suspend the affected job identity and review queued work.'],
    ['Key, token, or certificate theft', 'Revoke the exposed secret and verify that reuse is rejected.'],
    ['Lateral movement', 'Restrict affected internal paths and review touched identities and hosts.'],
    ['Malware or malicious attachments', 'Quarantine the material and review endpoint events.'],
    ['Network, DNS, or domain hijacking', 'Restore verified settings and review administrator access.'],
    ['OAuth or connected-app abuse', 'Revoke the affected grant and review data access.'],
    ['Phishing and impersonation', 'Quarantine related messages and notify affected users through a trusted channel.'],
    ['Queued persistence', 'Review new jobs, startup entries, and integrations.'],
    ['Ransomware', 'Isolate affected systems and protect recovery copies.'],
    ['Supply-chain compromise', 'Pause the affected dependency or artifact and verify provenance.'],
    ['Tampering with data or logs', 'Preserve surviving evidence and compare trusted copies.'],
    ['Unauthorized privilege escalation', 'Remove the unexpected grant and review its use.'],
    ['Vulnerable or exposed service', 'Reduce exposure and review prior access before recovery.'],
    ['Webhook or API abuse', 'Disable the affected credential or endpoint and review signatures and replay checks.'],
    ['Cross-workspace access', 'Restrict the affected connection and verify which workspaces were reached.'],
    ['Your lost or compromised device', 'Revoke device sessions and verify enrollment status.'],
    ['Zero-day or unknown cause', 'Contain the behavior you can observe and preserve the evidence.']
  ].map(([title, action], i) => Object.freeze({ id: String.fromCharCode(65 + i), title, action })));
  const ACTIONS = Object.freeze({
    observe: 'Observe', block: 'Block traffic at your boundary', revoke: 'Revoke access',
    isolate: 'Isolate affected asset', restore: 'Restore known-good state', report: 'Prepare evidence handoff'
  });
  const LABELS = Object.freeze({
    'observe': 'Record the next observed event, its time, and its source.',
    'block': 'Check the protected boundary log for an explicit denial.',
    'revoke': 'Verify the affected credential or session is inactive using your management console.',
    'isolate': 'Verify the affected asset is isolated from other protected assets.',
    'restore': 'Verify the restored state against its trusted baseline.',
    'report': 'Record the provider or responder case reference.'
  });

  function object(value, field) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(field + ' must be an object.');
    return value;
  }

  function text(value, field, max = 250, required = false) {
    if (value == null) {
      if (required) throw new Error(field + ' is required.');
      return '';
    }
    if (typeof value !== 'string' || value.length > max) throw new Error(field + ' must be text, up to ' + max + ' characters.');
    const clean = value.trim();
    if (required && !clean) throw new Error(field + ' is required.');
    return clean;
  }

  function utc(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(value)) {
      throw new Error('Use a UTC timestamp such as 2026-11-18T14:30:00Z.');
    }
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 19) !== value.slice(0, 19)) {
      throw new Error('The UTC timestamp is invalid.');
    }
    const fraction = value.slice(20, -1).padEnd(9, '0');
    return value.slice(0, 19) + '.' + fraction + 'Z';
  }

  function rows(values) {
    if (!Array.isArray(values) || !values.length || values.length > MAX_ROWS) {
      throw new Error('Choose a file with 1 to ' + MAX_ROWS + ' records.');
    }
    return values;
  }

  function normalizeEvent(value, inputRow) {
    const entry = object(value, 'Event');
    const stage = entry.stage ?? 'observed';
    if (!STAGES.includes(stage)) throw new Error('Unknown impact stage.');
    const family = entry.family ?? '';
    if (family && !PLAYBOOK.some(item => item.id === family)) throw new Error('Family must be an A–Z playbook code.');
    return {
      inputRow, time: utc(entry.observedAt), clock: 'utc', stage, family,
      asset: text(entry.asset, 'Affected asset', 250, true),
      observation: text(entry.observation, 'Observation', 1000, true),
      principal: text(entry.principal, 'Observed account or device'),
      ingress: text(entry.ingress, 'Observed ingress'),
      sourceRef: text(entry.sourceRef, 'Source reference')
    };
  }

  function fromCloudflare(value, inputRow) {
    const entry = object(value, 'Cloudflare row');
    const host = text(entry.ClientRequestHost, 'ClientRequestHost', 255, true);
    const ray = text(entry.RayID, 'RayID', 120, true);
    const action = text(entry.SecurityAction, 'SecurityAction', 60).toLowerCase();
    const method = text(entry.ClientRequestMethod, 'ClientRequestMethod', 20);
    const status = Number.isInteger(entry.EdgeResponseStatus) && entry.EdgeResponseStatus >= 100 &&
      entry.EdgeResponseStatus <= 599 ? String(entry.EdgeResponseStatus) : '';
    return normalizeEvent({
      observedAt: entry.EdgeStartTimestamp,
      asset: host,
      observation: ['Cloudflare edge request.', method && 'Method: ' + method + '.',
        status && 'HTTP status: ' + status + '.', action && 'Security action: ' + action + '.'].filter(Boolean).join(' '),
      ingress: entry.ClientIP,
      sourceRef: ray,
      stage: action === 'block' ? 'blocked' : 'observed'
    }, inputRow);
  }

  function parse(raw) {
    let input;
    try {
      input = JSON.parse(raw);
    } catch {
      const lines = raw.split(/\r?\n/).filter(line => line.trim());
      return { kind: 'cloudflare', events: rows(lines).map((line, i) => {
        try { return fromCloudflare(JSON.parse(line), i + 1); }
        catch (error) { throw new Error('Cloudflare row ' + (i + 1) + ': ' + error.message); }
      }) };
    }
    if (input && input.schema === INPUT_SCHEMA) {
      return { kind: 'telemetry', events: rows(input.events).map((item, i) => normalizeEvent(item, i + 1)) };
    }
    if (input && input.schema === toolbox.VERSION && input.tool === 'incident-ledger') {
      const validated = toolbox.incidentLog(rows(input.records).map(entry => ({
        observed: entry.observedLocal, type: entry.type, details: entry.details
      })));
      return { kind: 'incident-ledger', events: validated.records.map(record => ({
        inputRow: record.ordinal, time: record.observedLocal, clock: 'local-unzoned', stage: 'observed',
        family: '', asset: '', principal: '', ingress: '', sourceRef: '',
        observation: record.type + ': ' + record.details
      })) };
    }
    return { kind: 'cloudflare', events: rows(Array.isArray(input) ? input : [input]).map((row, i) => fromCloudflare(row, i + 1)) };
  }

  async function importEvidence(name, bytes) {
    if (!(bytes instanceof Uint8Array) || !bytes.length || bytes.length > MAX_BYTES) {
      throw new Error('Choose a nonempty file of 2 MiB or less.');
    }
    const copy = new Uint8Array(bytes);
    const raw = new TextDecoder('utf-8', { fatal: true }).decode(copy);
    const report = parse(raw);
    const hash = await crypto.subtle.digest('SHA-256', copy);
    const sha = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
    const fingerprint = toolbox.reviewFingerprint(name, sha);
    return {
      source: { name: fingerprint.file, sha256: fingerprint.sha256, bytes: copy.length, kind: report.kind },
      events: report.events.map(event => ({ ...event, id: sha + ':' + event.inputRow, source: sha }))
    };
  }

  function buildCase(reports) {
    if (!Array.isArray(reports) || reports.length > MAX_SOURCES) throw new Error('Case source limit reached.');
    const unique = [...new Map(reports.map(report => [report.source.sha256, report])).values()];
    const events = unique.flatMap(report => report.events);
    const timeline = events.filter(event => event.clock === 'utc').sort((a, b) => a.time.localeCompare(b.time));
    const unzoned = events.filter(event => event.clock === 'local-unzoned');
    const fields = key => [...new Set(events.map(item => item[key]).filter(Boolean))];
    return {
      schema: CASE_SCHEMA, sources: unique.map(report => report.source), timeline, unzoned,
      observed: { principals: fields('principal'), ingress: fields('ingress'), assets: fields('asset') },
      attribution: 'Unknown', inferredIntent: 'Undetermined', sourceAuthentication: 'Imported, unverified',
      impact: Object.fromEntries(STAGES.map(stage => [stage, events.filter(event => event.stage === stage).length])),
      playbook: PLAYBOOK.filter(item => events.some(event => event.family === item.id))
    };
  }

  function knownEvents(caseRecord, evidenceId) {
    const event = [...caseRecord.timeline, ...caseRecord.unzoned].find(item => item.id === evidenceId);
    if (!event) throw new Error('Choose an event in this case.');
    return event;
  }

  function recordDecision(caseRecord, input) {
    if (!Object.hasOwn(ACTIONS, input.action)) throw new Error('Choose a supported response.');
    if (input.ownerConfirmed !== true) throw new Error('Confirm that you own or are authorized to manage the affected system.');
    const event = knownEvents(caseRecord, input.evidenceId);
    return {
      id: crypto.randomUUID(), time: new Date().toISOString(), evidenceId: event.id,
      action: input.action, target: event.asset || text(input.asset, 'Protected asset', 250, true),
      reason: text(input.reason, 'Reason', 750, true), status: 'owner-selected',
      check: LABELS[input.action]
    };
  }

  function recordReview(caseRecord, input) {
    const event = knownEvents(caseRecord, input.evidenceId);
    const family = PLAYBOOK.find(item => item.id === input.family);
    if (!family) throw new Error('Choose a potential intent or attack family.');
    if (!['possible', 'probable', 'unknown'].includes(input.confidence)) throw new Error('Choose a review confidence.');
    return {
      evidenceId: event.id, time: new Date().toISOString(), family: family.id, label: family.title,
      confidence: input.confidence, reason: text(input.reason, 'Supporting observation', 750, true),
      source: 'owner assessment'
    };
  }

  function recordOutcome(decision, input) {
    if (!['verified-by-owner', 'unsuccessful', 'still-pending'].includes(input.status)) throw new Error('Choose a result.');
    return {
      decisionId: decision.id, time: new Date().toISOString(), status: input.status,
      evidence: text(input.evidence, 'Result or evidence reference', 750, true)
    };
  }

  return Object.freeze({
    INPUT_SCHEMA, CASE_SCHEMA, MAX_BYTES, MAX_SOURCES, ACTIONS, PLAYBOOK,
    importEvidence, buildCase, recordDecision, recordReview, recordOutcome
  });
});
