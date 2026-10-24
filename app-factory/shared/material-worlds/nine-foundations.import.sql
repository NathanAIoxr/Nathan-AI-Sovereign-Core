-- Optional additive import; not yet executed. Backup the database first.
-- Independent namespace; no existing catalogue rows or saves are modified.
BEGIN IMMEDIATE;
CREATE TABLE IF NOT EXISTS tabor_nine_foundations_v1 (
 foundation_id TEXT PRIMARY KEY,
 ordinal INTEGER NOT NULL UNIQUE CHECK (ordinal BETWEEN 1 AND 9),
 title TEXT NOT NULL,
 purpose TEXT NOT NULL,
 application_role TEXT NOT NULL,
 attributed_to TEXT NOT NULL,
 provenance TEXT NOT NULL
);
INSERT INTO tabor_nine_foundations_v1
(foundation_id,ordinal,title,purpose,application_role,attributed_to,provenance)
VALUES
('tabor.foundation.01',1,'The Egg','Origin and a protected starting state','initial_state','Nathan Tabor','conceptual framework; application meanings interpreted'),
('tabor.foundation.02',2,'The Gene','Instructions, inheritance, and variation','template','Nathan Tabor','conceptual framework; application meanings interpreted'),
('tabor.foundation.03',3,'The Hox','Position, sequence, and organization','placement','Nathan Tabor','conceptual framework; application meanings interpreted'),
('tabor.foundation.04',4,'The Rule','Constraints, permissions, and consequences','constraints','Nathan Tabor','conceptual framework; application meanings interpreted'),
('tabor.foundation.05',5,'The Duality','Partnership and complementary roles','relationship','Nathan Tabor','conceptual framework; application meanings interpreted'),
('tabor.foundation.06',6,'The Polarity','Direction and orientation','orientation','Nathan Tabor','conceptual framework; application meanings interpreted'),
('tabor.foundation.07',7,'The Tale','An individual account of experience','individual_account','Nathan Tabor','conceptual framework; application meanings interpreted'),
('tabor.foundation.08',8,'The Story','Connected accounts and shared context','connected_narrative','Nathan Tabor','conceptual framework; application meanings interpreted'),
('tabor.foundation.09',9,'The Truth','Evidence, uncertainty, and correction','evidence_record','Nathan Tabor','conceptual framework; application meanings interpreted')
ON CONFLICT(foundation_id) DO UPDATE SET
 ordinal=excluded.ordinal, title=excluded.title, purpose=excluded.purpose,
 application_role=excluded.application_role, attributed_to=excluded.attributed_to,
 provenance=excluded.provenance;
COMMIT;
