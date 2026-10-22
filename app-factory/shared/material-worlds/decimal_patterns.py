"""Study helpers for the Tabor Decimal System concept, attributed to Nathan Tabor.
Standard algorithms are identified as such; this is not a claim of new arithmetic,
biological proof, neural learning, legal TABOR behavior, or immutable storage.
"""
from __future__ import annotations
import math
import random

class LifeField:
    """Conway B3/S23 rules, with a per-instance random initial field.
    Evolution is deterministic; random initialization is not stochastic evolution.
    """
    def __init__(self, size=7, seed=42, field=None):
        if type(size) is not int or not 1 <= size <= 128:
            raise ValueError('Size must be 1–128')
        self.size = size
        rng = random.Random(seed)
        if field is None:
            self.field = [[rng.randrange(2) for _ in range(size)] for _ in range(size)]
        elif len(field) == size and all(len(r) == size and all(type(v) is int and v in (0, 1) for v in r) for r in field):
            self.field = [row[:] for row in field]
        else:
            raise ValueError('Expected a square binary field')
    def step(self):
        n = self.size
        output = [[0] * n for _ in range(n)]
        for r in range(n):
            for c in range(n):
                count = sum(self.field[rr][cc] for rr in range(max(0, r-1), min(n, r+2)) for cc in range(max(0, c-1), min(n, c+2)) if (rr, cc) != (r, c))
                output[r][c] = int(count == 3 or self.field[r][c] == 1 and count == 2)
        self.field = output
        return [row[:] for row in output]

class PatternIndex:
    """Explicit-ID cosine similarity search; no learned network or attractor dynamics."""
    def __init__(self, dimensions):
        if type(dimensions) is not int or not 1 <= dimensions <= 4096:
            raise ValueError('Dimensions must be 1–4096')
        self.dimensions, self.assets = dimensions, {}
    def _normalize(self, vector):
        if len(vector) != self.dimensions or any(not isinstance(v, (int, float)) or isinstance(v, bool) or not math.isfinite(v) for v in vector):
            raise ValueError('Finite vector of matching dimensionality required')
        norm = math.hypot(*vector)
        return tuple(v/norm for v in vector) if norm else None
    def add(self, asset_id, vector):
        if not isinstance(asset_id, str) or not asset_id or asset_id in self.assets:
            raise ValueError('Distinct stable asset ID required')
        normalized = self._normalize(vector)
        if normalized is None:
            raise ValueError('Zero vectors do not identify a pattern')
        self.assets[asset_id] = normalized
    def query(self, vector):
        q = self._normalize(vector)
        if q is None or not self.assets:
            return None
        scores = [(sum(a*b for a,b in zip(q,v)), key) for key,v in self.assets.items()]
        score, key = sorted(scores, key=lambda pair: (-pair[0], pair[1]))[0]
        return {'asset_id': key, 'similarity': max(-1.0, min(1.0, score))}

class IntegerLedger:
    """Small local integer ledger with idempotent entries. Not a network transaction DB."""
    def __init__(self):
        self.balance, self.entries = 0, {}
    def apply(self, action_id, delta):
        if not isinstance(action_id, str) or not action_id or type(delta) is not int:
            raise ValueError('Action ID and integer delta required')
        if action_id in self.entries:
            if self.entries[action_id] != delta:
                raise ValueError('Action ID already used with another value')
            return self.balance
        if len(self.entries) >= 10000:
            raise ValueError('Export and begin a new ledger before adding entries')
        if self.balance + delta < 0:
            raise ValueError('Insufficient balance')
        self.entries[action_id] = delta
        self.balance += delta
        assert self.balance == sum(self.entries.values())
        return self.balance
