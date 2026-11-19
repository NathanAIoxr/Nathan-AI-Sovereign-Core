#!/usr/bin/env python3
"""TABOR WORLD CRYPTO: offline rewards and proof-of-work research simulator.
No actual cryptocurrencies are created, transferred, or mined.
Run: python tabor_world_crypto.py
"""
import hashlib
import json
import sqlite3
import time
from dataclasses import dataclass

COINS = {
    'PIRATE': ('Pirate Law Coin', 'truth_discovery'),
    'SPARTAN': ('Spartan Law Coin', 'protection'),
    'EARTH': ('Mother Earth Coin', 'restoration'),
    'MOTHER': ('God the Mother Coin', 'consent_care'),
    'SIN': ('SiN/SeN Coin', 'evidence'),
    'SOVEREIGN': ('I Own It All Coin', 'sovereignty'),
    'CHILDFIRE': ('Childfire Coin', 'joy_creativity'),
    'SCROLL': ('Scrollfire Coin', 'learning'),
    'OVERRIDE': ('Override Coin', 'innovation'),
}

ACTIVITIES = {
    'lesson_completed': ('SCROLL', 10),
    'history_challenge': ('PIRATE', 8),
    'rescue_mission': ('SPARTAN', 8),
    'environment_project': ('EARTH', 12),
    'consent_lesson': ('MOTHER', 10),
    'source_verification': ('SIN', 8),
    'sovereignty_course': ('SOVEREIGN', 10),
    'creative_challenge': ('CHILDFIRE', 10),
    'coding_challenge': ('OVERRIDE', 12),
}

@dataclass(frozen=True)
class MiningResult:
    nonce: int | None
    digest: str | None
    attempts: int
    elapsed_seconds: float
    success: bool
    simulated: bool = True

class TaborWorldLedger:
    def __init__(self, path=':memory:'):
        self.db = sqlite3.connect(path)
        self.db.execute('PRAGMA foreign_keys=ON')
        self.db.executescript('''
        CREATE TABLE IF NOT EXISTS balances (
          user_id TEXT NOT NULL, coin TEXT NOT NULL, amount INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY(user_id, coin), CHECK(amount >= 0));
        CREATE TABLE IF NOT EXISTS reward_events (
          event_id TEXT PRIMARY KEY, user_id TEXT NOT NULL, activity TEXT NOT NULL,
          coin TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount > 0),
          created_at INTEGER NOT NULL);
        ''')
        self.db.commit()

    def award(self, user_id, activity, event_id, verified=False):
        if not verified:
            raise PermissionError('Server-side verification is required')
        if not user_id or not event_id or activity not in ACTIVITIES:
            raise ValueError('Invalid reward event')
        coin, amount = ACTIVITIES[activity]
        with self.db:
            cursor = self.db.execute(
                'INSERT OR IGNORE INTO reward_events VALUES (?, ?, ?, ?, ?, ?)',
                (event_id, user_id, activity, coin, amount, int(time.time())))
            if cursor.rowcount == 0:
                return {'credited': False, 'reason': 'duplicate_event'}
            self.db.execute('''
                INSERT INTO balances(user_id, coin, amount) VALUES (?, ?, ?)
                ON CONFLICT(user_id, coin) DO UPDATE SET amount=amount+excluded.amount
                ''', (user_id, coin, amount))
        return {'credited': True, 'coin': coin, 'amount': amount}

    def balances(self, user_id):
        values = {coin: 0 for coin in COINS}
        for coin, amount in self.db.execute(
            'SELECT coin, amount FROM balances WHERE user_id=?', (user_id,)):
            values[coin] = amount
        return values


def sovereign_anchor():
    return (1 + 1 == 2 and 1 - 1 == 0 and 0b1 + 0b1 == 0b10)


def research_mine(payload, leading_zero_hex=3, max_attempts=200000):
    """Toy PoW experiment; not a Bitcoin block or network difficulty target."""
    if not (1 <= leading_zero_hex <= 6):
        raise ValueError('Toy difficulty must be between 1 and 6')
    if not (1 <= max_attempts <= 2_000_000):
        raise ValueError('Attempt count out of range')
    start = time.perf_counter()
    # Original numerical rail; each candidate is independently hashed.
    base = 13 + 17 + 71 + 31
    for attempt in range(max_attempts):
        nonce = base + attempt
        candidate = f'{payload}|{nonce}'.encode('utf-8')
        digest = hashlib.sha256(hashlib.sha256(candidate).digest()).hexdigest()
        if digest.startswith('0' * leading_zero_hex):
            return MiningResult(nonce, digest, attempt + 1,
                                round(time.perf_counter() - start, 6), True)
    return MiningResult(None, None, max_attempts,
                        round(time.perf_counter() - start, 6), False)


def demo():
    assert sovereign_anchor()
    ledger = TaborWorldLedger()
    events = [
        ('lesson_completed', 'event-001'),
        ('coding_challenge', 'event-002'),
        ('creative_challenge', 'event-003'),
    ]
    awards = [ledger.award('demo-user', a, e, verified=True) for a, e in events]
    duplicate = ledger.award('demo-user', 'lesson_completed', 'event-001', verified=True)
    assert not duplicate['credited']
    mined = research_mine('TABOR WORLD | NATHAN AI | BEE HIVE', leading_zero_hex=3)
    assert not mined.success or mined.digest.startswith('000')
    print(json.dumps({
        'system': 'Tabor World Crypto — OFFLINE SIMULATION',
        'anchor': '1+1=2; 1-1=0',
        'asset_status': 'INTERNAL POINTS ONLY; NO ON-CHAIN TOKENS',
        'coins': COINS,
        'awards': awards,
        'duplicate_blocked': not duplicate['credited'],
        'balances': ledger.balances('demo-user'),
        'research_proof_of_work': mined.__dict__,
        'bitcoin_mined': 0,
        'real_wallets_connected': False,
    }, indent=2))

if __name__ == '__main__':
    demo()
