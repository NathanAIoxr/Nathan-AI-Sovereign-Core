#!/usr/bin/env python3
"""The Nathan Tabor Way: evidence-first engineering case registry (stdlib only).

Catalog entries are hypotheses and test plans, NOT reports of remediation.
Passing this program's validations checks record structure, not evidence truth.
"""
from __future__ import annotations

import argparse
from collections import Counter
from decimal import Decimal
import hashlib
import json
from pathlib import Path
import sys
from threading import RLock
from typing import Any

ROOT = Path(__file__).resolve().parent
CATALOG = ROOT / 'problems.json'
STAGES = ('UNASSESSED', 'OBSERVED', 'REPRODUCED', 'ROOT_CAUSE_SUPPORTED', 'CORRECTED', 'TEST_PASSED', 'VERIFIED_IN_USE')
REQUIRED_CATALOG = ('id', 'domain', 'problem', 'mechanism_hypothesis', 'forward_correction', 'acceptance_test', 'limit', 'status')


def canonical_digest(data: Any) -> str:
    """Stable digest of JSON-compatible data, independent of mapping key order."""
    wire = json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode('utf-8')
    return hashlib.sha256(wire).hexdigest()


def load_catalog(path: Path = CATALOG) -> list[dict[str, Any]]:
    records = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(records, list):
        raise ValueError('Catalog must be an array')
    seen = set()
    for idx, record in enumerate(records):
        if not isinstance(record, dict):
            raise ValueError(f'Entry {idx}: must be an object')
        absent = [field for field in REQUIRED_CATALOG if not isinstance(record.get(field), str) or not record[field].strip()]
        if absent:
            raise ValueError(f'Entry {idx}: missing/empty fields {absent}')
        if record['id'] in seen:
            raise ValueError(f'Duplicate identifier {record["id"]}')
        if record['limit'] not in ('fixable', 'reducible', 'constrained'):
            raise ValueError(f'Entry {idx}: invalid limit')
        if record['status'] != 'UNASSESSED':
            raise ValueError(f'Catalog entry {idx} makes an unsupported operational claim')
        seen.add(record['id'])
    return records


def make_case(problem_id: str, catalog: list[dict[str, Any]]) -> dict[str, Any]:
    lookup = {item['id']: item for item in catalog}
    if problem_id not in lookup:
        raise ValueError(f'Unknown problem id: {problem_id}')
    item = lookup[problem_id]
    return {
        'problem_id': problem_id,
        'title': item['problem'],
        'stage': 'UNASSESSED',
        'intended_result': '',
        'observed_result': '',
        'baseline_measurement': '',
        'reproduction_steps': [],
        'reverse_trace': [],
        'root_cause_hypothesis': item['mechanism_hypothesis'],
        'root_cause_evidence_ids': [],
        'forward_change': item['forward_correction'],
        'change_reference': '',
        'acceptance_tests': [],
        'evidence': [],
        'deployment': {'environment': '', 'observed_after': '', 'independent_review': '', 'repetitions': 0},
        'open_blockers': [],
        'remaining_limits': '',
    }


def audit_case(case: dict[str, Any], known_ids: set[str]) -> dict[str, Any]:
    """Stage gate for case *documentation*, not forensic confirmation of evidence.

    Gates are cumulative. A stage is not validated unless every earlier gate passes.
    Evidence references must resolve to records with SHA-256 format; source authenticity
    and actual test execution require independent inspection outside this tool.
    """
    errors = []
    if not isinstance(case, dict):
        return {'passed': False, 'errors': ['Case must be a JSON object'], 'stage': None}
    stage = case.get('stage')
    if stage not in STAGES:
        return {'passed': False, 'errors': ['Invalid stage'], 'stage': stage}
    if case.get('problem_id') not in known_ids:
        errors.append('Unknown problem_id')
    evidence = case.get('evidence', [])
    if not isinstance(evidence, list):
        errors.append('Evidence must be a list')
        evidence = []
    ids = set()
    for entry in evidence:
        if not isinstance(entry, dict):
            errors.append('Each evidence item must be an object')
            continue
        evid = entry.get('id')
        digest = entry.get('sha256', '')
        if not isinstance(evid, str) or not evid.strip() or evid in ids:
            errors.append('Evidence IDs must be unique, nonempty strings')
        else:
            ids.add(evid)
        if not isinstance(digest, str) or len(digest) != 64 or any(c not in '0123456789abcdef' for c in digest.lower()):
            errors.append(f'Invalid SHA-256 for evidence {evid}')
        if not isinstance(entry.get('description'), str) or not entry['description'].strip():
            errors.append(f'Empty evidence description: {evid}')

    def required_text(field: str):
        if not isinstance(case.get(field), str) or not case[field].strip():
            errors.append(f'{field} is required')

    def refs(field: str):
        r = case.get(field, [])
        if not isinstance(r, list) or not r or not all(isinstance(v, str) and v in ids for v in r):
            errors.append(f'{field} must reference existing evidence records')

    level = STAGES.index(stage)
    if level >= 1:
        for field in ('intended_result', 'observed_result', 'baseline_measurement'):
            required_text(field)
    if level >= 2:
        if not isinstance(case.get('reproduction_steps'), list) or not case['reproduction_steps']:
            errors.append('reproduction_steps required')
        if not ids:
            errors.append('reproduction needs evidence')
    if level >= 3:
        if not isinstance(case.get('reverse_trace'), list) or not case['reverse_trace']:
            errors.append('reverse_trace required')
        required_text('root_cause_hypothesis')
        refs('root_cause_evidence_ids')
    if level >= 4:
        required_text('forward_change')
        required_text('change_reference')
        if not ids:
            errors.append('corrected stage needs evidence')
    if level >= 5:
        tests = case.get('acceptance_tests', [])
        if not isinstance(tests, list) or not tests:
            errors.append('At least one acceptance test required')
        else:
            for test in tests:
                if not isinstance(test, dict) or test.get('passed') is not True or not str(test.get('id', '')).strip():
                    errors.append('Acceptance test must have id and passed=true')
                    continue
                refs_here = test.get('evidence_ids')
                if not isinstance(refs_here, list) or not refs_here or not all(isinstance(e, str) and e in ids for e in refs_here):
                    errors.append(f'Acceptance test {test["id"]} lacks valid evidence references')
    if level >= 6:
        deployment = case.get('deployment')
        if not isinstance(deployment, dict):
            errors.append('deployment is required')
        else:
            for f in ('environment', 'observed_after', 'independent_review'):
                if not isinstance(deployment.get(f), str) or not deployment[f].strip():
                    errors.append(f'deployment.{f} is required')
            if not isinstance(deployment.get('repetitions'), int) or isinstance(deployment.get('repetitions'), bool) or deployment['repetitions'] < 2:
                errors.append('deployment.repetitions must be >= 2')
        blockers = case.get('open_blockers')
        if not isinstance(blockers, list) or blockers:
            errors.append('There must be no open blockers')
        required_text('remaining_limits')
    return {'passed': not errors, 'errors': errors, 'stage': stage,
            'note': 'Documentation gate only; validate real evidence and measurements independently.'}


class IdempotencyLedger:
    """Thread-safe illustrative single-process idempotency; not a distributed solution."""
    def __init__(self):
        self._results: dict[str, Any] = {}
        self._lock = RLock()
        self.executions = 0

    def apply(self, request_id: str, operation):
        if not request_id:
            raise ValueError('request_id is required')
        with self._lock:
            if request_id not in self._results:
                result = operation()
                self._results[request_id] = result
                self.executions += 1
            return self._results[request_id]


def authorized(grants: dict[str, set[tuple[str, str]]], actor: str, action: str, object_id: str) -> bool:
    """A demonstration of a default-deny policy, not a production authorization system."""
    return (action, object_id) in grants.get(actor, set())


def normalize_length(value: str | int | float, unit: str) -> Decimal:
    factors = {'mm': Decimal('0.001'), 'cm': Decimal('0.01'), 'm': Decimal('1'), 'km': Decimal('1000')}
    if unit not in factors:
        raise ValueError('Unknown unit')
    return Decimal(str(value)) * factors[unit]


def freshness_ok(now: int, last_updated: int, ttl_seconds: int) -> bool:
    if ttl_seconds < 0 or last_updated > now:
        return False
    return now - last_updated <= ttl_seconds


def safe_auxiliary_failure(charge_fn, optional_analytics_fn) -> Any:
    """Optional analytics must not block a completed checkout."""
    result = charge_fn()
    try:
        optional_analytics_fn(result)
    except Exception:
        pass  # demonstration only: production implementation must log safely
    return result


def tool_allowed(actor_permissions: set[str], requested_action: str, untrusted_text: str = '') -> bool:
    """Untrusted content cannot expand permissions. Text is intentionally ignored."""
    return requested_action in actor_permissions


def capped_backoff(base_seconds: float, retries: int, cap_seconds: float) -> list[float]:
    if retries < 0 or base_seconds <= 0 or cap_seconds <= 0:
        raise ValueError('Invalid backoff parameters')
    return [min(base_seconds * (2 ** min(i, 62)), cap_seconds) for i in range(retries)]


def cli(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description='THE NATHAN TABOR WAY — evidence-first technology case ledger')
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('summary', help='Show domain counts and unassessed status')
    sub.add_parser('validate-catalog', help='Check catalog schema and uniqueness')
    generate = sub.add_parser('new-case', help='Create an unassessed structured case')
    generate.add_argument('problem_id')
    generate.add_argument('--out', type=Path)
    verify = sub.add_parser('audit-case', help='Audit documentary stage-gate completeness')
    verify.add_argument('case', type=Path)
    test = sub.add_parser('list-domain', help='Display records for one domain')
    test.add_argument('text', help='Case-insensitive name fragment')
    args = parser.parse_args(argv)
    records = load_catalog()
    if args.command == 'summary':
        summary = {'catalog_count': len(records), 'domains': dict(Counter(r['domain'] for r in records)),
                   'limits': dict(Counter(r['limit'] for r in records)),
                   'status': dict(Counter(r['status'] for r in records)),
                   'catalog_sha256': canonical_digest(records)}
        print(json.dumps(summary, indent=2))
    elif args.command == 'validate-catalog':
        print(f'Catalog structural validation passed: {len(records)} hypotheses; zero audited deployments.')
    elif args.command == 'list-domain':
        print(json.dumps([r for r in records if args.text.lower() in r['domain'].lower()], indent=2))
    elif args.command == 'new-case':
        case = make_case(args.problem_id, records)
        contents = json.dumps(case, indent=2, ensure_ascii=False) + '\n'
        if args.out:
            if args.out.exists():
                raise FileExistsError(f'Will not overwrite: {args.out}')
            args.out.write_text(contents, encoding='utf-8')
            print(f'Created {args.out}')
        else:
            print(contents)
    elif args.command == 'audit-case':
        case = json.loads(args.case.read_text(encoding='utf-8'))
        result = audit_case(case, {r['id'] for r in records})
        print(json.dumps(result, indent=2))
        return 0 if result['passed'] else 1
    return 0


if __name__ == '__main__':
    try:
        sys.exit(cli())
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(2)