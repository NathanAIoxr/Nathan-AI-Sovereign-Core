#!/usr/bin/env python3
"""Validate and partition the additive 101-worker build queue without deploying."""
import json
from pathlib import Path
p=Path(__file__).resolve().parent/'tabor-remaining-build-queue.json'
d=json.loads(p.read_text())
jobs=d['jobs']
assert len(jobs)==81, f"Expected 81 unimplemented entries, got {len(jobs)}"
assert len([j for j in jobs if j['queue']=='primary-78'])==78
assert len([j for j in jobs if j['queue']=='overflow-3'])==3
assert len({j['id'] for j in jobs})==81
assert len({j['worker_name'] for j in jobs})==81
assert all(not j['deploy_approved'] and not j['upstream_verified'] for j in jobs)
for n in range(1,9):
    assigned=[j for j in jobs if j['assigned_worker']==f'tabor-build-agent-{n:02d}']
    print(f'build-agent-{n:02d}: {len(assigned)} assigned, 0 deployed')
print('Validated 81 planned integrations; 78 primary + 3 overflow. No deployments performed.')
