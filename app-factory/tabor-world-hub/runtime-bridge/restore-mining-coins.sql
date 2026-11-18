-- Restore the November 2 author-defined matrix from app-factory/nathan-ai/sovereign-coins/registry.json.
-- Stable legacy slot IDs and any operator-edited rows are retained.
WITH recovered(coin_id, symbol, label) AS (VALUES
  ('SIN', 'SIN', 'Sovereign Invariant Network'),
  ('SEN', 'SEN', 'Sovereign Energy Network'),
  ('SLOT-03', 'SOV', 'Sovereign Order Value'),
  ('SLOT-04', 'MNK', 'Monad Node Kernel'),
  ('SLOT-05', 'BTM', 'Binary Truth Matrix'),
  ('SLOT-06', 'ASR', 'Active Spectral Reduction'),
  ('SLOT-07', 'OXR', 'Oxr Root Ledger'),
  ('SLOT-08', 'ALP', 'Alephium Optimized'),
  ('SLOT-09', 'QBC', 'Qubic Matrix'),
  ('SLOT-10', 'ZPH', 'Zephyr Protocol'),
  ('SLOT-11', 'KRN', 'Kernersville Node'),
  ('SLOT-12', 'ALX', 'Alexander County'),
  ('SLOT-13', 'SMW', 'Symmetric Mirror Wave'),
  ('SLOT-14', 'CLV', 'Clover Four-Leaf'),
  ('SLOT-15', 'D0G', 'Dog Company Core'),
  ('SLOT-16', 'GLY', 'Glyphic Resonance'),
  ('SLOT-17', 'OMN', 'Phoenix Omniversal'),
  ('SLOT-18', 'JNT', 'John Nathan Tabor Invariant'),
  ('SLOT-19', 'LVC', 'Lavicore Process'),
  ('SLOT-20', 'SMC', 'Smooth Ceiling'),
  ('SLOT-21', 'LFB', 'Leaf Bailer')
)
UPDATE tabor_mining_coins AS coin
SET symbol = recovered.symbol, label = recovered.label, status = 'source-defined',
    provenance = 'Author-defined 21 Sovereign Coin Matrix (2026-11-02)'
FROM recovered
WHERE coin.coin_id = recovered.coin_id
  AND coin.network IS NULL
  AND ((coin.status = 'unresolved'
        AND coin.symbol IS NULL
        AND coin.provenance = '21-coin count supplied by user; name not verified')
    OR (coin.status = 'definition-pending'
        AND coin.symbol = recovered.symbol
        AND coin.coin_id IN ('SIN', 'SEN')
        AND coin.provenance = 'user-supplied inventory'));
